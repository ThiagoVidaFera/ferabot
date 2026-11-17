import fs from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";
import { config } from "@/lib/config";
import { auditar } from "@/lib/audit";
import { mudarEstagio, registrarEvento } from "@/lib/timeline";
import { tagsDe } from "@/lib/tags";
import { conexaoPorId, enviarMidia, enviarTexto } from "@/lib/whatsapp";
import { pastaMidia } from "@/lib/midia";
import { ehEnvioHumano, reuniaoFutura } from "@/lib/seletor-agente";
import { followupAdiado } from "@/lib/followup-adiado";
import { ehToqueDeFollowupProposta } from "@/lib/followup-proposta-detectar";
import { ARQUIVO_VIDEO_PROPOSTA } from "@/lib/video-ultimo-toque";
import { lerProposta, ofertaDaProposta, precoDaProposta, type PropostaGuardada } from "@/lib/proposta-contato";
import { escolherConteudo } from "@/lib/conteudos-followup";
import { podeTocarContato } from "@/lib/pode-tocar";
import { perguntouPreco } from "@/lib/fala-do-lead";
import { MOTIVO_SEM_TEXTO, textoDoPasso, textoEsqueleto, type ContextoTexto } from "@/lib/sequencia-proposta-copy";

/**
 * Sequência pós-proposta v2 (09/11/2026): D+1, D+3, D+7, D+15, D+30, D+60 e D+90 depois do envio da
 * proposta, mais o toque do esqueleto (que OCUPA o lugar do próximo toque agendado, não soma) para quem
 * deixa dois toques seguidos sem resposta. Textos em `sequencia-proposta-copy.ts`.
 *
 * O estado mora em `Contact.customFields.sequencia_proposta`. O cron de follow-up (a cada minuto) chama
 * `processarSequenciasProposta`. Nasce DESLIGADO: só envia com o Setting `sequencia_proposta` = "1"; com
 * "teste" decide e devolve o que enviaria, sem enviar nada.
 *
 * Contra mensagem duplicada (a pior falha possível aqui), em camadas:
 *  1. trava em memória (`rodando`): dois ticks do cron não se sobrepõem;
 *  2. o histórico de mensagens é a segunda fonte de verdade: passo cujo rótulo já saiu não sai de novo;
 *  3. reserva atômica do passo em `Setting` (chave única `seqprop:<contato>:<dia>`), criada ANTES do envio;
 *  4. falha ambígua (timeout, rede) nunca é repetida sozinha: o passo vira `pulado` com aviso na auditoria.
 */

export const DIAS_SEQUENCIA = [1, 3, 7, 15, 30, 60, 90] as const;
export const CHAVE_SEQUENCIA = "sequencia_proposta";

const HORA = 3_600_000;
const DIA = 24 * HORA;
export const TOLERANCIA_ATRASO_MS = 30 * HORA;
export const PAUSA_RESPOSTA_MS = 72 * HORA;
export const ESPERA_FALA_HUMANA_MS = 24 * HORA;
export const ESPERA_APOS_DESPEDIDA_MS = 72 * HORA;
/** Intervalo mínimo entre dois toques de follow-up ao mesmo lead (inclui os do robô antigo). */
export const MIN_ENTRE_TOQUES_MS = 44 * HORA;
export const MIN_ENTRE_ENVIOS_MS = 3 * 60_000;
export const RESERVA_VELHA_MS = 30 * 60_000;
export const ESPERA_ENTRE_TENTATIVAS_MS = 5 * 60_000;
export const MAX_TENTATIVAS = 2;
/** Dois toques seguidos sem resposta disparam o esqueleto. */
export const TOQUES_PARA_ESQUELETO = 2;
const BRT_MS = 3 * HORA;
/** Origens que ficam fora da sequência (ambiente `SEQUENCIA_PROPOSTA_FORA`, separadas por vírgula). */
export const ORIGENS_FORA_DA_SEQUENCIA: readonly string[] = String(process.env.SEQUENCIA_PROPOSTA_FORA ?? "")
  .split(",")
  .map((o) => o.trim().toLowerCase())
  .filter(Boolean);
const ORIGENS_FORA = ORIGENS_FORA_DA_SEQUENCIA;

/**
 * Feriados em que a sequência não envia (o toque vai para o próximo dia útil). Cobre até
 * `FERIADOS_ATE`; um teste falha quando a lista estiver a menos de 6 meses de vencer.
 */
export const FERIADOS_ATE = "2028-12-31";
const FERIADOS = new Set([
  "2026-11-20",
  "2026-12-25",
  "2027-01-01",
  "2027-02-08",
  "2027-02-09",
  "2027-03-26",
  "2027-04-21",
  "2027-05-01",
  "2027-09-07",
  "2027-10-12",
  "2027-11-02",
  "2027-11-15",
  "2027-12-25",
  "2028-01-01",
  "2028-02-28",
  "2028-02-29",
  "2028-04-14",
  "2028-04-21",
  "2028-05-01",
  "2028-09-07",
  "2028-10-12",
  "2028-11-02",
  "2028-11-15",
  "2028-12-25",
]);

export type StatusPasso = "pendente" | "enviado" | "pulado" | "cancelado";

export type PassoSequencia = {
  d: number;
  devidoEm: string;
  status: StatusPasso;
  motivo?: string;
  enviadoEm?: string;
  variante?: string;
  tentativas?: number;
  tentativaEm?: string;
};

export type EstadoSequencia = {
  status: "ativa" | "encerrada";
  /** dia em que a proposta foi enviada */
  inicio: string;
  criadaEm: string;
  /** link e data de registro da proposta que originou a sequência (proposta nova = sequência nova) */
  link?: string;
  propostaEnviadaEm?: string;
  passos: PassoSequencia[];
  /** toques do robô antigo, anteriores à sequência (ISO) */
  legado?: string[];
  esqueleto?: { enviadoEm: string; variante: "a" | "b"; d: number };
  encerradaEm?: string;
  encerradaMotivo?: string;
};

// ---------- tempo (Brasília, UTC-3 fixo: sem horário de verão desde 2019) ----------

export type PartesBrt = { y: number; m: number; d: number; dow: number; minutos: number };

export function partesBrt(data: Date): PartesBrt {
  const x = new Date(data.getTime() - BRT_MS);
  return {
    y: x.getUTCFullYear(),
    m: x.getUTCMonth() + 1,
    d: x.getUTCDate(),
    dow: x.getUTCDay(),
    minutos: x.getUTCHours() * 60 + x.getUTCMinutes(),
  };
}

const dois = (n: number): string => String(n).padStart(2, "0");
const chaveDia = (p: PartesBrt): string => `${p.y}-${dois(p.m)}-${dois(p.d)}`;

/** Domingo e feriado não enviam; sábado envia. */
export function diaUtil(p: PartesBrt): boolean {
  return p.dow !== 0 && !FERIADOS.has(chaveDia(p));
}

/** Quando o passo `dias` vence: 9h de Brasília, `dias` dias depois do envio, pulando domingo e feriado. */
export function devidoEm(inicio: Date, dias: number): Date {
  const p = partesBrt(inicio);
  let dia = Date.UTC(p.y, p.m - 1, p.d + dias);
  for (let i = 0; i < 10; i++) {
    const x = new Date(dia);
    const q: PartesBrt = {
      y: x.getUTCFullYear(),
      m: x.getUTCMonth() + 1,
      d: x.getUTCDate(),
      dow: x.getUTCDay(),
      minutos: 0,
    };
    if (diaUtil(q)) return new Date(Date.UTC(q.y, q.m - 1, q.d, 9 + 3, 0));
    dia += DIA;
  }
  return new Date(Date.UTC(p.y, p.m - 1, p.d + dias, 12, 0));
}

/** Janela de envio: 9h às 10h30 de Brasília, segunda a sábado, fora de feriado. */
export function dentroDaJanela(agora: Date): boolean {
  const p = partesBrt(agora);
  return diaUtil(p) && p.minutos >= 9 * 60 && p.minutos < 10 * 60 + 30;
}

// ---------- estado ----------

const dataValida = (v: unknown): boolean => typeof v === "string" && Number.isFinite(new Date(v).getTime());

export function lerSequencia(campos: unknown): EstadoSequencia | null {
  const s = (campos as Record<string, unknown> | null)?.[CHAVE_SEQUENCIA];
  if (!s || typeof s !== "object") return null;
  const r = s as Partial<EstadoSequencia>;
  const ok =
    (r.status === "ativa" || r.status === "encerrada") &&
    dataValida(r.inicio) &&
    dataValida(r.criadaEm) &&
    Array.isArray(r.passos) &&
    r.passos.every((p) => !!p && typeof p.d === "number" && dataValida(p.devidoEm) && typeof p.status === "string") &&
    (r.legado === undefined || (Array.isArray(r.legado) && r.legado.every(dataValida)));
  return ok ? (r as EstadoSequencia) : null;
}

/** Passos nascem pendentes; o que já venceu há mais de 30h na hora da criação vira `pulado`. */
export function construirSequencia(
  inicio: Date,
  agora: Date,
  legado: string[] = [],
  proposta?: PropostaGuardada,
): EstadoSequencia {
  const passos: PassoSequencia[] = DIAS_SEQUENCIA.map((d) => {
    const devido = devidoEm(inicio, d);
    const atrasado = agora.getTime() - devido.getTime() > TOLERANCIA_ATRASO_MS;
    return atrasado
      ? { d, devidoEm: devido.toISOString(), status: "pulado", motivo: "etapa anterior ao início da sequência" }
      : { d, devidoEm: devido.toISOString(), status: "pendente" };
  });
  return {
    status: "ativa",
    inicio: inicio.toISOString(),
    criadaEm: agora.toISOString(),
    ...(proposta ? { link: proposta.link, propostaEnviadaEm: proposta.enviadaEm } : {}),
    passos,
    ...(legado.length ? { legado } : {}),
  };
}

const trocarPasso = (e: EstadoSequencia, d: number, mudanca: Partial<PassoSequencia>): EstadoSequencia => ({
  ...e,
  passos: e.passos.map((p) => (p.d === d ? { ...p, ...mudanca } : p)),
});

/** Quantas mensagens de follow-up o lead já recebeu desde a proposta (robô antigo + sequência nova). */
export function contarToques(e: EstadoSequencia): number {
  return e.passos.filter((p) => p.status === "enviado").length + (e.legado?.length ?? 0);
}

export function proximoPasso(e: EstadoSequencia): PassoSequencia | null {
  return e.passos.find((p) => p.status === "pendente") ?? null;
}

function datasDeToques(e: EstadoSequencia): number[] {
  return [
    ...e.passos.filter((p) => p.status === "enviado" && p.enviadoEm).map((p) => new Date(p.enviadoEm as string).getTime()),
    ...(e.legado ?? []).map((t) => new Date(t).getTime()),
  ];
}

/** Toques enviados depois da última fala do lead ou de gente: base do gatilho do esqueleto. */
export function toquesSemResposta(e: EstadoSequencia, ultimaDoLead: Date | null, ultimaFalaHumana: Date | null): number {
  const marco = Math.max(new Date(e.inicio).getTime(), ultimaDoLead?.getTime() ?? 0, ultimaFalaHumana?.getTime() ?? 0);
  return datasDeToques(e).filter((t) => t > marco).length;
}

// ---------- decisão (pura) ----------

export type ContextoSequencia = {
  estagio: string;
  tags: string[];
  /** última mensagem recebida do lead (qualquer data) */
  ultimaDoLead: Date | null;
  /** última mensagem enviada por gente (o dono ou alguém do time) */
  ultimaFalaHumana: Date | null;
  /** número oficial (Cloud API): não aceita texto livre fora da janela de 24h */
  oficial: boolean;
  agora: Date;
  /** o lead pediu pra esperar (retornar-<mês>, defletiu, sem-condicoes-agora, nao-qualificado…) */
  adiado?: boolean;
  /** há reunião marcada no futuro */
  reuniaoMarcada?: boolean;
};

export type DecisaoSequencia =
  | { acao: "esperar"; motivo: string }
  | { acao: "encerrar"; motivo: string }
  | { acao: "pular"; passo: number; motivo: string }
  | { acao: "enviar"; passo: number; esqueleto: boolean };

/** `optout` e qualquer `controle-*` (suporte humano, não perturbe…) tiram o lead da automação. */
const temTagDeControle = (tags: string[]): boolean => tags.some((t) => t === "optout" || t.startsWith("controle-"));

export function decidirSequencia(e: EstadoSequencia, c: ContextoSequencia): DecisaoSequencia {
  if (e.status !== "ativa") return { acao: "esperar", motivo: "sequência encerrada" };
  if (c.estagio !== "proposta") return { acao: "encerrar", motivo: `estágio mudou pra ${c.estagio}` };
  if (temTagDeControle(c.tags)) return { acao: "encerrar", motivo: "tag de controle (não perturbe, suporte humano ou optout)" };

  const agora = c.agora.getTime();
  const proximo = proximoPasso(e);
  if (!proximo) {
    const ultimo = Math.max(0, ...datasDeToques(e));
    if (ultimo && agora - ultimo < ESPERA_APOS_DESPEDIDA_MS) {
      return { acao: "esperar", motivo: "aguardando 72h depois do último toque" };
    }
    return { acao: "encerrar", motivo: "concluída" };
  }

  const devido = new Date(proximo.devidoEm).getTime();
  if (agora < devido) return { acao: "esperar", motivo: "ainda não venceu" };
  if (agora - devido > TOLERANCIA_ATRASO_MS) return { acao: "pular", passo: proximo.d, motivo: "atrasado mais de 30h" };

  if (c.adiado) return { acao: "esperar", motivo: "o lead pediu pra esperar (tag de adiamento)" };
  if (c.reuniaoMarcada) return { acao: "esperar", motivo: "há reunião marcada" };

  const inicio = new Date(e.inicio).getTime();
  const respondeu = c.ultimaDoLead && c.ultimaDoLead.getTime() > inicio ? c.ultimaDoLead.getTime() : null;
  const falouGente = c.ultimaFalaHumana && c.ultimaFalaHumana.getTime() > inicio ? c.ultimaFalaHumana.getTime() : null;
  if (respondeu) {
    const ref = Math.max(respondeu, falouGente ?? 0);
    if (agora < ref + PAUSA_RESPOSTA_MS) return { acao: "esperar", motivo: "pausada: o lead respondeu e a conversa é humana" };
  } else if (falouGente && agora < falouGente + ESPERA_FALA_HUMANA_MS) {
    return { acao: "esperar", motivo: "gente falou com o lead nas últimas 24h" };
  }

  const ultimoToque = Math.max(0, ...datasDeToques(e));
  if (ultimoToque && agora - ultimoToque < MIN_ENTRE_TOQUES_MS) {
    return { acao: "esperar", motivo: "o último toque foi há menos de 44h" };
  }

  if (!dentroDaJanela(c.agora)) return { acao: "esperar", motivo: "fora da janela (9h às 10h30, segunda a sábado)" };
  if (c.oficial) return { acao: "pular", passo: proximo.d, motivo: "número oficial: fora da janela de 24h" };

  const serio = c.tags.includes("tom-serio");
  const gatilhoEsqueleto =
    !e.esqueleto &&
    !serio &&
    proximo.d !== 90 &&
    toquesSemResposta(e, c.ultimaDoLead, c.ultimaFalaHumana) >= TOQUES_PARA_ESQUELETO;
  return { acao: "enviar", passo: proximo.d, esqueleto: gatilhoEsqueleto };
}

// ---------- envio ----------

export type TipoEnvio = "texto" | "video-proposta" | "imagem-esqueleto";

export type EnvioPasso = {
  contatoId: string;
  telefone: string;
  chatId: string | null;
  instanceId: string;
  texto: string;
  tipo: TipoEnvio;
  rotulo: string;
  arquivo?: string;
};

export type ResultadoEnvioPasso = { ok: boolean; erro?: string; externalId?: string };

function varianteDoLead(contatoId: string): "a" | "b" {
  let soma = 0;
  for (const ch of contatoId) soma += ch.charCodeAt(0);
  return soma % 2 === 0 ? "a" : "b";
}

export const arquivoEsqueleto = (v: "a" | "b"): string => `esqueleto-${v}.png`;

const existeMidia = (arquivo: string): boolean => fs.existsSync(path.join(pastaMidia(), arquivo));

async function enviarPasso(p: EnvioPasso): Promise<ResultadoEnvioPasso> {
  const conexao = await conexaoPorId(p.instanceId);
  if (!conexao) return { ok: false, erro: "HTTP 404: sessão do WhatsApp não encontrada" };
  const destino = p.chatId || p.telefone;
  if (p.tipo === "texto" || !p.arquivo) return enviarTexto(conexao, destino, p.texto);
  const arquivo = path.join(pastaMidia(), p.arquivo);
  if (!fs.existsSync(arquivo)) return { ok: false, erro: `HTTP 404: mídia ausente (${p.arquivo})` };
  const video = p.tipo === "video-proposta";
  return enviarMidia(conexao, destino, {
    tipo: video ? "video" : "image",
    mimetype: video ? "video/mp4" : "image/png",
    filename: p.arquivo,
    base64: fs.readFileSync(arquivo).toString("base64"),
    legenda: p.texto,
  });
}

/** Só uma resposta HTTP de erro prova que a mensagem NÃO saiu; timeout e queda de rede são ambíguos. */
export const falhaDefinitiva = (erro: string | undefined): boolean => /^HTTP [45]\d\d/.test(erro ?? "");

// ---------- banco ----------

async function gravarSequencia(contactId: string, estado: EstadoSequencia): Promise<void> {
  const c = await db.contact.findUnique({ where: { id: contactId }, select: { customFields: true } });
  if (!c) return;
  const campos = { ...((c.customFields ?? {}) as Record<string, unknown>), [CHAVE_SEQUENCIA]: estado };
  await db.contact.update({ where: { id: contactId }, data: { customFields: campos as never } });
}

/** Link de proposta: host que começa com "proposta" ou caminho com "/proposta" (links-proposta.ts). */
const PROPOSTA_LINK = /https?:\/\/(?:proposta[-\w]*\.[^\s/]+|[^\s/]+\/[^\s]*proposta)/i;
const JANELA_DO_ENVIO_MS = 14 * DIA;

/**
 * D0 de verdade: a 1ª mensagem nossa com o link da proposta, dentro dos 14 dias que antecedem o
 * registro da proposta (uma proposta revisada, semanas depois, não herda o D0 da antiga); senão,
 * a última virada de estágio para `proposta` até o registro; senão, a data do registro.
 */
async function inicioReal(contactId: string, proposta: PropostaGuardada): Promise<Date> {
  const registro = new Date(proposta.enviadaEm).getTime();
  let host: string | null = null;
  try {
    host = new URL(proposta.link).hostname;
  } catch {
    host = null;
  }
  const saidas = await db.whatsappMessage.findMany({
    where: { contactId, direction: "outbound" },
    orderBy: { timestamp: "asc" },
    select: { body: true, timestamp: true },
  });
  const comLink = saidas.find((m) => {
    const t = m.timestamp.getTime();
    const cita = host ? m.body.includes(host) : PROPOSTA_LINK.test(m.body);
    return cita && t >= registro - JANELA_DO_ENVIO_MS && t <= registro + HORA;
  });
  if (comLink) return comLink.timestamp;
  const virada = await db.timelineEvent.findFirst({
    where: {
      contactId,
      eventType: "stage_change",
      metadata: { path: "$.para", equals: "proposta" },
      timestamp: { lte: new Date(registro + HORA) },
    },
    orderBy: { timestamp: "desc" },
    select: { timestamp: true },
  });
  return virada?.timestamp ?? new Date(proposta.enviadaEm);
}

/**
 * Cria a sequência de toda proposta registrada que está em `proposta` e ainda não tem uma (ou cuja
 * proposta é outra, com link ou registro novos). É assim que as propostas em andamento entram, com o
 * D0 real e os toques do robô antigo contados, e também as novas, por qualquer caminho de registro.
 */
export async function adotarSequenciasProposta(agora = new Date()): Promise<number> {
  const candidatos = await db.contact.findMany({
    where: { lifecycleStage: "proposta" },
    select: { id: true, name: true, origem: true, customFields: true },
  });
  let adotadas = 0;
  for (const c of candidatos) {
    if (ORIGENS_FORA.includes(c.origem.toLowerCase())) continue;
    const proposta = lerProposta(c.customFields);
    if (!proposta || !ofertaDaProposta(proposta)) continue;
    const existente = lerSequencia(c.customFields);
    const mesmaProposta = existente && (!existente.link || (existente.link === proposta.link && existente.propostaEnviadaEm === proposta.enviadaEm));
    if (mesmaProposta) continue;
    try {
      const inicio = await inicioReal(c.id, proposta);
      const depois = await db.whatsappMessage.findMany({
        where: { contactId: c.id, direction: "outbound", timestamp: { gt: new Date(inicio.getTime() + 10 * 60_000) } },
        orderBy: { timestamp: "asc" },
        select: { body: true, metadata: true, timestamp: true },
      });
      const legado = depois.filter((m) => ehToqueDeFollowupProposta(m.body, m.metadata)).map((m) => m.timestamp.toISOString());
      await gravarSequencia(c.id, construirSequencia(inicio, agora, legado, proposta));
      await auditar(
        "cron:sequencia-proposta",
        existente ? "sequencia_recriada" : "sequencia_adotada",
        `${c.id} · D0 ${inicio.toISOString()} · ${legado.length} toques anteriores`,
      );
      adotadas++;
    } catch (e) {
      await auditar("cron:sequencia-proposta", "adocao_falhou", `${c.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return adotadas;
}

/** Desliga a sequência de um contato (botão "Proposta enviada" desligado). */
export async function cancelarSequenciaProposta(contactId: string, motivo = "desligada à mão", agora = new Date()): Promise<void> {
  const c = await db.contact.findUnique({ where: { id: contactId }, select: { customFields: true } });
  const e = lerSequencia(c?.customFields);
  if (!e || e.status !== "ativa") return;
  await gravarSequencia(contactId, { ...e, status: "encerrada", encerradaEm: agora.toISOString(), encerradaMotivo: motivo });
}

export type ModoSequencia = "desligado" | "teste" | "envio";

export function modoDaSequencia(valor: string): ModoSequencia {
  if (valor === "1") return "envio";
  if (valor === "teste") return "teste";
  return "desligado";
}

export type DecisaoRegistrada = {
  contactId: string;
  nome: string;
  acao: DecisaoSequencia["acao"];
  passo?: number;
  esqueleto?: boolean;
  motivo?: string;
  texto?: string;
  tipo?: TipoEnvio;
};

export type ResultadoSequencias = {
  modo: ModoSequencia;
  adotadas: number;
  enviados: number;
  decisoes: DecisaoRegistrada[];
  /** outro tick ainda estava rodando */
  ocupado?: boolean;
};

export type DependenciasSequencia = {
  agora?: Date;
  /** troca o envio real (testes) */
  enviar?: (p: EnvioPasso) => Promise<ResultadoEnvioPasso>;
  /** força o modo (testes e simulação); senão vem do Setting */
  modo?: ModoSequencia;
  /** o arquivo de mídia existe? (testes) */
  midiaExiste?: (arquivo: string) => boolean;
};

type CandidatoSequencia = {
  id: string;
  name: string;
  phone: string | null;
  origem: string;
  tags: unknown;
  lifecycleStage: string;
  customFields: unknown;
};

async function instanciaDaConversa(contactId: string): Promise<string | null> {
  for (const direction of ["inbound", "outbound"] as const) {
    const m = await db.whatsappMessage.findFirst({
      where: { contactId, direction, instanceId: { not: null } },
      orderBy: { timestamp: "desc" },
      select: { instanceId: true },
    });
    if (m?.instanceId) return m.instanceId;
  }
  return null;
}

async function carregarContexto(c: CandidatoSequencia, e: EstadoSequencia, agora: Date) {
  const instanceId = await instanciaDaConversa(c.id);
  const inst = instanceId ? await db.whatsappInstance.findUnique({ where: { id: instanceId } }) : null;
  const ultimaEntrada = await db.whatsappMessage.findFirst({
    where: { contactId: c.id, direction: "inbound" },
    orderBy: { timestamp: "desc" },
    select: { timestamp: true },
  });
  const saidas = await db.whatsappMessage.findMany({
    where: { contactId: c.id, direction: "outbound", timestamp: { gt: new Date(e.inicio) } },
    orderBy: { timestamp: "desc" },
    take: 60,
    select: { metadata: true, timestamp: true },
  });
  const humana = saidas.find((m) => ehEnvioHumano(m.metadata));
  const tags = tagsDe(c.tags);
  const contexto: ContextoSequencia = {
    estagio: c.lifecycleStage,
    tags,
    ultimaDoLead: ultimaEntrada?.timestamp ?? null,
    ultimaFalaHumana: humana?.timestamp ?? null,
    oficial: inst?.provider === "cloud_api",
    agora,
    adiado: followupAdiado({ tags, lifecycleStage: c.lifecycleStage }, agora),
    reuniaoMarcada: !!reuniaoFutura(c.customFields, agora),
  };
  return { instanceId, contexto };
}

function canalDoLead(_tags: string[]): string {
  return "pelo digital";
}

function textoLivre(valor: unknown, maximo: number): string | null {
  if (typeof valor !== "string" || !valor.trim()) return null;
  return valor.trim().slice(0, maximo);
}

const urlHttps = (valor: string | null): string | null => (valor && /^https:\/\/\S+$/.test(valor) ? valor : null);

async function montarContextoTexto(
  c: CandidatoSequencia,
  e: EstadoSequencia,
  proposta: PropostaGuardada,
  agora: Date,
): Promise<ContextoTexto | null> {
  const oferta = ofertaDaProposta(proposta);
  const preco = precoDaProposta(proposta.ofertaBase);
  if (!oferta || !preco) return null;
  const campos = (c.customFields ?? {}) as Record<string, unknown>;
  const tags = tagsDe(c.tags);
  // D+15: o melhor conteúdo que o lead AINDA NÃO recebeu (Setting primeiro, depois a biblioteca).
  const enviadas = await db.whatsappMessage.findMany({
    where: { contactId: c.id, direction: "outbound" },
    orderBy: { timestamp: "desc" },
    take: 300,
    select: { body: true },
  });
  const urlEscolhida = urlHttps(textoLivre(await config("sequencia_proposta_conteudo"), 300));
  const descricaoEscolhida =
    textoLivre(await config("sequencia_proposta_conteudo_descricao"), 160) ?? "um material nosso que pode ajudar no que a gente conversou";
  const conteudo = escolherConteudo(
    tags,
    enviadas.map((m) => m.body),
    urlEscolhida ? { url: urlEscolhida, descricao: descricaoEscolhida } : null,
  );
  // Valor e link de pagamento só para quem perguntou preço (13/11/2026).
  const falasDoLead = await db.whatsappMessage.findMany({
    where: { contactId: c.id, direction: "inbound" },
    orderBy: { timestamp: "desc" },
    take: 200,
    select: { body: true },
  });
  return {
    perguntouPreco: falasDoLead.some((m) => perguntouPreco(m.body)),
    nome: c.name,
    oferta,
    ofertaBase: proposta.ofertaBase,
    precoTotalCentavos: preco.totalCentavos,
    parcelaCentavos: preco.parcelaCentavos,
    linkProposta: proposta.link,
    inicio: new Date(e.inicio),
    agora,
    tomSerio: tags.includes("tom-serio"),
    trava: textoLivre(campos.maior_trava, 140) ?? textoLivre(campos.trava, 140),
    canal: canalDoLead(tags),
    novidade: textoLivre(await config("sequencia_proposta_novidade"), 220),
    conteudo,
    nToques: contarToques(e) + 1,
  };
}

function escolherEnvio(
  passo: number,
  esqueleto: boolean,
  texto: string,
  ctx: ContextoTexto,
  variante: "a" | "b",
  midiaExiste: (arquivo: string) => boolean,
): { tipo: TipoEnvio; arquivo?: string; rotulo: string; esqueleto: boolean; texto: string } {
  if (esqueleto && midiaExiste(arquivoEsqueleto(variante))) {
    return {
      tipo: "imagem-esqueleto",
      arquivo: arquivoEsqueleto(variante),
      rotulo: `proposta-esqueleto-${variante}`,
      esqueleto: true,
      texto: textoEsqueleto(ctx),
    };
  }
  if (passo === 1 && ctx.oferta.videoResumo && midiaExiste(ARQUIVO_VIDEO_PROPOSTA)) {
    return { tipo: "video-proposta", arquivo: ARQUIVO_VIDEO_PROPOSTA, rotulo: "proposta-d1-a", esqueleto: false, texto };
  }
  return { tipo: "texto", rotulo: `proposta-d${passo}-a`, esqueleto: false, texto };
}

async function registrarEnvio(p: EnvioPasso, telefone: string, r: ResultadoEnvioPasso, agora: Date): Promise<void> {
  const tipoMsg = p.tipo === "video-proposta" ? "video" : p.tipo === "imagem-esqueleto" ? "image" : "text";
  await db.whatsappMessage.create({
    data: {
      contactId: p.contatoId,
      instanceId: p.instanceId,
      fromNumber: "crm",
      toNumber: telefone,
      body: p.texto,
      type: tipoMsg,
      direction: "outbound",
      status: "sent",
      externalId: r.externalId ?? null,
      timestamp: agora,
      // ator "cron": não conta como gente falando (não pausa a sequência nem cala o agente)
      metadata: { origem: "followup", followup: p.rotulo, ator: "cron", fonte: "api", sequencia: true } as never,
    },
  });
  await registrarEvento({
    contactId: p.contatoId,
    eventType: "whatsapp_message",
    channel: "whatsapp",
    metadata: { direcao: "enviada", texto: p.texto, followup: p.rotulo, ator: "cron" },
  });
}

async function passouEspacamento(agora: Date): Promise<boolean> {
  const recente = await db.whatsappMessage.findFirst({
    where: { direction: "outbound", fromNumber: "crm", timestamp: { gte: new Date(agora.getTime() - MIN_ENTRE_ENVIOS_MS) } },
    select: { id: true },
  });
  return !recente;
}

// ---- reserva atômica do passo (chave única em Setting) ----

const chaveReserva = (contactId: string, d: number): string => `seqprop:${contactId}:${d}`;

async function reservarPasso(contactId: string, d: number, agora: Date): Promise<{ ok: true } | { ok: false; desde: Date | null }> {
  const chave = chaveReserva(contactId, d);
  try {
    await db.setting.create({ data: { key: chave, value: agora.toISOString() } });
    return { ok: true };
  } catch (e) {
    if ((e as { code?: string }).code !== "P2002") throw e;
    const linha = await db.setting.findUnique({ where: { key: chave } });
    const desde = linha ? new Date(linha.value) : null;
    return { ok: false, desde: desde && Number.isFinite(desde.getTime()) ? desde : null };
  }
}

const liberarReserva = (contactId: string, d: number) => db.setting.deleteMany({ where: { key: chaveReserva(contactId, d) } });

/** A mensagem deste rótulo já saiu para este lead? (segunda fonte de verdade, independente do JSON). */
async function saidaComRotulo(contactId: string, rotulo: string): Promise<Date | null> {
  const m = await db.whatsappMessage.findFirst({
    where: { contactId, direction: "outbound", metadata: { path: "$.followup", equals: rotulo } },
    orderBy: { timestamp: "desc" },
    select: { timestamp: true },
  });
  return m?.timestamp ?? null;
}

// ---- trava em memória: dois ticks do cron não se sobrepõem ----
let rodando = false;

export async function processarSequenciasProposta(deps: DependenciasSequencia = {}): Promise<ResultadoSequencias> {
  if (rodando) return { modo: "desligado", adotadas: 0, enviados: 0, decisoes: [], ocupado: true };
  rodando = true;
  try {
    return await tick(deps);
  } finally {
    rodando = false;
  }
}

async function tick(deps: DependenciasSequencia): Promise<ResultadoSequencias> {
  const agora = deps.agora ?? new Date();
  const adotadas = await adotarSequenciasProposta(agora);
  const modo = deps.modo ?? modoDaSequencia(await config("sequencia_proposta", undefined, "0"));
  const res: ResultadoSequencias = { modo, adotadas, enviados: 0, decisoes: [] };
  if (modo === "desligado") return res;

  const gravar = modo === "envio";
  const candidatos = await db.contact.findMany({
    where: { customFields: { path: "$.sequencia_proposta.status", equals: "ativa" } },
    select: { id: true, name: true, phone: true, origem: true, tags: true, lifecycleStage: true, customFields: true },
  });
  const estado = { bloqueado: gravar ? !(await passouEspacamento(agora)) : false };
  for (const c of candidatos) {
    if (ORIGENS_FORA.includes(c.origem.toLowerCase())) continue;
    try {
      await processarContato(c, agora, { gravar, deps, res, estado });
    } catch (e) {
      await auditar("cron:sequencia-proposta", "sequencia_erro", `${c.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return res;
}

type Rodada = {
  gravar: boolean;
  deps: DependenciasSequencia;
  res: ResultadoSequencias;
  estado: { bloqueado: boolean };
};

async function processarContato(c: CandidatoSequencia, agora: Date, r: Rodada): Promise<void> {
  let estado = lerSequencia(c.customFields);
  const proposta = lerProposta(c.customFields);
  if (!estado || !proposta) return;
  const midiaExiste = r.deps.midiaExiste ?? existeMidia;
  const { instanceId, contexto } = await carregarContexto(c, estado, agora);

  for (let volta = 0; volta < DIAS_SEQUENCIA.length + 2; volta++) {
    const d = decidirSequencia(estado, contexto);
    if (d.acao === "esperar") return;

    if (d.acao === "encerrar") {
      r.res.decisoes.push({ contactId: c.id, nome: c.name, acao: "encerrar", motivo: d.motivo });
      estado = { ...estado, status: "encerrada", encerradaEm: agora.toISOString(), encerradaMotivo: d.motivo };
      if (!r.gravar) return;
      await gravarSequencia(c.id, estado);
      await auditar("cron:sequencia-proposta", "sequencia_encerrada", `${c.id}: ${d.motivo}`);
      const despediu = estado.passos.some((p) => p.d === 90 && p.status === "enviado");
      const respondeuDepois = !!contexto.ultimaDoLead && contexto.ultimaDoLead.getTime() > new Date(estado.inicio).getTime();
      if (d.motivo === "concluída" && despediu && !respondeuDepois && c.lifecycleStage === "proposta") {
        await mudarEstagio(c.id, "futuro", "sequencia-proposta");
      }
      return;
    }

    if (d.acao === "pular") {
      r.res.decisoes.push({ contactId: c.id, nome: c.name, acao: "pular", passo: d.passo, motivo: d.motivo });
      estado = trocarPasso(estado, d.passo, { status: "pulado", motivo: d.motivo });
      if (r.gravar) await gravarSequencia(c.id, estado);
      continue;
    }

    // ---- enviar ----
    const passoAtual = estado.passos.find((p) => p.d === d.passo);
    if (passoAtual?.tentativaEm && agora.getTime() - new Date(passoAtual.tentativaEm).getTime() < ESPERA_ENTRE_TENTATIVAS_MS) return;

    const variante = varianteDoLead(c.id);
    const ctxTexto = await montarContextoTexto(c, estado, proposta, agora);
    const textoBase = ctxTexto ? textoDoPasso(d.passo, ctxTexto) : null;
    if (!ctxTexto || !textoBase) {
      const motivo = !ctxTexto ? "oferta sem preço no catálogo" : (MOTIVO_SEM_TEXTO[d.passo] ?? "sem texto para este passo");
      r.res.decisoes.push({ contactId: c.id, nome: c.name, acao: "pular", passo: d.passo, motivo });
      estado = trocarPasso(estado, d.passo, { status: "pulado", motivo });
      if (r.gravar) await gravarSequencia(c.id, estado);
      continue;
    }
    const escolha = escolherEnvio(d.passo, d.esqueleto, textoBase, ctxTexto, variante, midiaExiste);
    const registro: DecisaoRegistrada = {
      contactId: c.id,
      nome: c.name,
      acao: "enviar",
      passo: d.passo,
      esqueleto: escolha.esqueleto,
      texto: escolha.texto,
      tipo: escolha.tipo,
    };
    // Guarda central (13/11/2026): compra, opt-out, adiamento, "vamos fechar", última fala do lead, número único.
    const conexaoAtual = instanceId ? await conexaoPorId(instanceId) : null;
    const toque = await podeTocarContato({ contactId: c.id, regua: "sequencia-proposta", conexao: conexaoAtual, agora, seco: !r.gravar });
    if (!toque.liberado) {
      r.res.decisoes.push({ ...registro, acao: "esperar", motivo: `guarda: ${toque.motivo} (${toque.detalhe})` });
      return;
    }
    const instanciaEnvio = toque.conexao?.instanceId ?? instanceId;
    if (!r.gravar) {
      r.res.decisoes.push(registro);
      return;
    }
    await enviarComSeguranca(c, estado, d.passo, escolha, registro, instanciaEnvio, variante, agora, r);
    return;
  }
}

/**
 * O envio propriamente dito, com todas as camadas contra duplicidade. Relê o contato antes de agir:
 * o estado do tick pode ter envelhecido (alguém desligou o botão, o lead respondeu, outro tick enviou).
 */
async function enviarComSeguranca(
  c: CandidatoSequencia,
  estadoDoTick: EstadoSequencia,
  passo: number,
  escolha: ReturnType<typeof escolherEnvio>,
  registro: DecisaoRegistrada,
  instanceId: string | null,
  variante: "a" | "b",
  agora: Date,
  r: Rodada,
): Promise<void> {
  const campos = (c.customFields ?? {}) as Record<string, unknown>;
  if (!instanceId || !c.phone) {
    r.res.decisoes.push({ ...registro, acao: "pular", motivo: "sem número conectado da conversa" });
    await gravarSequencia(c.id, trocarPasso(estadoDoTick, passo, { status: "pulado", motivo: "sem número conectado da conversa" }));
    return;
  }
  if (r.estado.bloqueado) return; // 1 envio por vez, com 3 min entre eles (anti-ban)

  // Releitura: nada de agir em cima de um retrato velho.
  const fresco = await db.contact.findUnique({
    where: { id: c.id },
    select: { id: true, name: true, phone: true, origem: true, tags: true, lifecycleStage: true, customFields: true },
  });
  const estado = fresco ? lerSequencia(fresco.customFields) : null;
  if (!fresco || !estado) return;
  const { contexto } = await carregarContexto(fresco, estado, agora);
  const de = decidirSequencia(estado, contexto);
  if (de.acao !== "enviar" || de.passo !== passo) return;

  // Camada 2: o histórico de mensagens manda mais que o JSON.
  const jaSaiu = await saidaComRotulo(c.id, escolha.rotulo);
  if (jaSaiu) {
    let curado = trocarPasso(estado, passo, { status: "enviado", enviadoEm: jaSaiu.toISOString(), variante: escolha.esqueleto ? `esqueleto-${variante}` : "a" });
    if (escolha.esqueleto) curado = { ...curado, esqueleto: { enviadoEm: jaSaiu.toISOString(), variante, d: passo } };
    await gravarSequencia(c.id, curado);
    await auditar("cron:sequencia-proposta", "estado_curado", `${c.id} [${escolha.rotulo}] já constava no histórico`);
    return;
  }

  // Camada 3: reserva atômica antes de qualquer chamada ao WhatsApp.
  const reserva = await reservarPasso(c.id, passo, agora);
  if (!reserva.ok) {
    if (reserva.desde && agora.getTime() - reserva.desde.getTime() > RESERVA_VELHA_MS) {
      await gravarSequencia(c.id, trocarPasso(estado, passo, { status: "pulado", motivo: "reserva antiga sem confirmação de envio (envio incerto)" }));
      await auditar("cron:sequencia-proposta", "toque_incerto", `${c.id} [${escolha.rotulo}]: reserva antiga sem mensagem no histórico`);
    }
    return;
  }

  r.estado.bloqueado = true; // qualquer tentativa gasta a vez deste tick
  const envio: EnvioPasso = {
    contatoId: c.id,
    telefone: c.phone,
    chatId: textoLivre(campos.whatsapp_chat_id, 80),
    instanceId,
    texto: escolha.texto,
    tipo: escolha.tipo,
    rotulo: escolha.rotulo,
    ...(escolha.arquivo ? { arquivo: escolha.arquivo } : {}),
  };
  const enviar = r.deps.enviar ?? enviarPasso;
  let resultado: ResultadoEnvioPasso;
  try {
    resultado = await enviar(envio);
  } catch (e) {
    resultado = { ok: false, erro: e instanceof Error ? e.message : String(e) };
  }

  if (!resultado.ok) {
    if (falhaDefinitiva(resultado.erro)) {
      // Resposta de erro do servidor: a mensagem não saiu. Tenta de novo em 5 min, no máximo 2 vezes.
      await liberarReserva(c.id, passo);
      const tentativas = (estado.passos.find((p) => p.d === passo)?.tentativas ?? 0) + 1;
      const mudanca: Partial<PassoSequencia> =
        tentativas >= MAX_TENTATIVAS
          ? { status: "pulado", motivo: `falhou ${tentativas} vezes: ${resultado.erro}`, tentativas }
          : { tentativas, tentativaEm: agora.toISOString() };
      await gravarSequencia(c.id, trocarPasso(estado, passo, mudanca));
      await auditar("cron:sequencia-proposta", "toque_falhou", `${c.id} [${escolha.rotulo}]: ${resultado.erro ?? "?"}`);
      r.res.decisoes.push({ ...registro, acao: "esperar", motivo: `falha no envio: ${resultado.erro ?? "?"}` });
      return;
    }
    // Ambíguo (timeout, rede): pode ter saído. Não repete sozinho; a reserva fica como prova.
    await gravarSequencia(c.id, trocarPasso(estado, passo, { status: "pulado", motivo: `envio incerto: ${resultado.erro ?? "sem resposta"}` }));
    await auditar("cron:sequencia-proposta", "toque_incerto", `${c.id} [${escolha.rotulo}]: ${resultado.erro ?? "sem resposta"}`);
    r.res.decisoes.push({ ...registro, acao: "esperar", motivo: `envio incerto: ${resultado.erro ?? "sem resposta"}` });
    return;
  }

  // Resolve ANTES do resto do registro: se o banco falhar adiante, o texto não sai de novo no próximo tick.
  let novo = trocarPasso(estado, passo, {
    status: "enviado",
    enviadoEm: agora.toISOString(),
    variante: escolha.esqueleto ? `esqueleto-${variante}` : "a",
  });
  if (escolha.esqueleto) novo = { ...novo, esqueleto: { enviadoEm: agora.toISOString(), variante, d: passo } };
  await gravarSequencia(c.id, novo);
  await registrarEnvio(envio, c.phone, resultado, agora);
  await auditar("cron:sequencia-proposta", "toque_enviado", `${c.id} [${escolha.rotulo}]`);
  r.res.decisoes.push(registro);
  r.res.enviados++;
}
