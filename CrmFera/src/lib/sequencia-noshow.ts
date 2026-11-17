import { db } from "@/lib/db";
import { config } from "@/lib/config";
import { auditar } from "@/lib/audit";
import { registrarEvento } from "@/lib/timeline";
import { tagsDe } from "@/lib/tags";
import { conexaoPadrao, conexaoPorId, enviarTexto, type Conexao } from "@/lib/whatsapp";
import { ehEnvioHumano } from "@/lib/seletor-agente";
import { classificarReunioes } from "@/lib/reunioes";
import { liberarPelaConexao } from "@/lib/guarda-numero";
import { podeTocarContato } from "@/lib/pode-tocar";
import {
  devidoEm,
  diaUtil,
  falhaDefinitiva,
  partesBrt,
  MIN_ENTRE_ENVIOS_MS,
  MIN_ENTRE_TOQUES_MS,
  PAUSA_RESPOSTA_MS,
  ESPERA_FALA_HUMANA_MS,
  RESERVA_VELHA_MS,
  TOLERANCIA_ATRASO_MS,
  type PassoSequencia,
} from "@/lib/sequencia-proposta";
import { DIAS_NOSHOW, textoNoShow } from "@/lib/sequencia-noshow-copy";

/**
 * Sequência de quem agendou e NÃO compareceu (10/11/2026): 5 mensagens, D+1, D+7, D+15, D+30 e D+60
 * contados do dia da reunião perdida. Textos: `sequencia-noshow-copy.ts`.
 *
 * Quem já passou do início (no-show antigo) recebe a mensagem 1 na primeira janela e segue só pelos passos
 * que ainda não venceram (os vencidos viram `pulado`, como na sequência de proposta).
 *
 * Estado em `Contact.customFields.sequencia_noshow`. Nasce DESLIGADA: Setting `sequencia_noshow` = "1" envia;
 * "teste" decide e devolve o que enviaria, sem enviar nada. Mesmas camadas anti-duplicidade da sequência de
 * proposta (trava em memória, histórico como 2ª fonte, reserva atômica em Setting, falha ambígua não repete).
 */

/** Recusa do guarda do número: a mensagem não saiu e não conta como tentativa. */
const PREFIXO_GUARDA = "GUARDA: ";
export const CHAVE_NOSHOW = "sequencia_noshow";
const HORA = 3_600_000;
/**
 * Origens que entram na sequência. Vazio = todas (padrão do CRM FERA). Para restringir, liste as
 * origens no ambiente `NOSHOW_ORIGENS` (separadas por vírgula).
 */
export const ORIGENS_NOSHOW: string[] = String(process.env.NOSHOW_ORIGENS ?? "")
  .split(",")
  .map((o) => o.trim().toLowerCase())
  .filter(Boolean);

export function origemNoShow(origem: string | null | undefined): boolean {
  return !ORIGENS_NOSHOW.length || ORIGENS_NOSHOW.includes(String(origem ?? "").toLowerCase());
}
/** Estágios em que o lead já saiu do jogo. */
const ESTAGIOS_FIM = ["cliente", "perdido"];
export const JANELA_INICIO_MIN = 10 * 60;
export const JANELA_FIM_MIN = 18 * 60;
export const CAP_DIA_PADRAO = 30;
/** A mensagem 1 é a porta de entrada: o backlog adotado de uma vez escoa pelo teto diário em até 5 dias. */
export const TOLERANCIA_PASSO1_MS = 5 * 24 * HORA;
const BRT_MS = 3 * HORA;

export type EstadoNoShow = {
  status: "ativa" | "encerrada";
  /** horário da reunião perdida (evento_data): remarcar muda isto e invalida a sequência */
  noShowEm: string;
  criadaEm: string;
  passos: PassoSequencia[];
  encerradaEm?: string;
  encerradaMotivo?: string;
};

// ---------- tempo ----------

/** Segunda a sábado (fora de feriado), das 10h às 18h de Brasília. */
export function dentroDaJanelaNoShow(agora: Date): boolean {
  const p = partesBrt(agora);
  return diaUtil(p) && p.minutos >= JANELA_INICIO_MIN && p.minutos < JANELA_FIM_MIN;
}

const inicioDoDiaBrt = (agora: Date): Date => {
  const p = partesBrt(agora);
  return new Date(Date.UTC(p.y, p.m - 1, p.d, 0, 0) + BRT_MS);
};

// ---------- estado ----------

const dataValida = (v: unknown): boolean => typeof v === "string" && Number.isFinite(new Date(v).getTime());

export function lerNoShow(campos: unknown): EstadoNoShow | null {
  const s = (campos as Record<string, unknown> | null)?.[CHAVE_NOSHOW];
  if (!s || typeof s !== "object") return null;
  const r = s as Partial<EstadoNoShow>;
  const ok =
    (r.status === "ativa" || r.status === "encerrada") &&
    dataValida(r.noShowEm) &&
    dataValida(r.criadaEm) &&
    Array.isArray(r.passos) &&
    r.passos.every((p) => !!p && typeof p.d === "number" && dataValida(p.devidoEm) && typeof p.status === "string");
  return ok ? (r as EstadoNoShow) : null;
}

/**
 * Passos nascem pendentes. O D+1 vencido (no-show antigo) vira "pendente agora": a mensagem 1 é a porta de
 * entrada de todo mundo. Os demais passos vencidos há mais de 30h viram `pulado`.
 */
export function construirNoShow(noShowEm: Date, agora: Date): EstadoNoShow {
  const passos: PassoSequencia[] = DIAS_NOSHOW.map((d) => {
    const devido = devidoEm(noShowEm, d);
    const atrasado = agora.getTime() - devido.getTime() > TOLERANCIA_ATRASO_MS;
    if (!atrasado) return { d, devidoEm: devido.toISOString(), status: "pendente" };
    if (d === DIAS_NOSHOW[0]) return { d, devidoEm: agora.toISOString(), status: "pendente" };
    return { d, devidoEm: devido.toISOString(), status: "pulado", motivo: "etapa anterior ao início da sequência" };
  });
  return { status: "ativa", noShowEm: noShowEm.toISOString(), criadaEm: agora.toISOString(), passos };
}

const trocarPasso = (e: EstadoNoShow, d: number, mudanca: Partial<PassoSequencia>): EstadoNoShow => ({
  ...e,
  passos: e.passos.map((p) => (p.d === d ? { ...p, ...mudanca } : p)),
});

const proximoPasso = (e: EstadoNoShow): PassoSequencia | null => e.passos.find((p) => p.status === "pendente") ?? null;

const datasDeToques = (e: EstadoNoShow): number[] =>
  e.passos.filter((p) => p.status === "enviado" && p.enviadoEm).map((p) => new Date(p.enviadoEm as string).getTime());

// ---------- decisão (pura) ----------

export type ContextoNoShow = {
  estagio: string;
  tags: string[];
  ultimaDoLead: Date | null;
  ultimaFalaHumana: Date | null;
  /** número oficial (Cloud API) não aceita texto livre fora da janela de 24h */
  oficial: boolean;
  /** a sequência de proposta está ativa: ela é a dona da conversa */
  propostaAtiva: boolean;
  agora: Date;
};

export type DecisaoNoShow =
  | { acao: "esperar"; motivo: string }
  | { acao: "encerrar"; motivo: string }
  | { acao: "pular"; passo: number; motivo: string }
  | { acao: "enviar"; passo: number };

const temTagDeControle = (tags: string[]): boolean => tags.some((t) => t === "optout" || t.startsWith("controle-"));

export function decidirNoShow(e: EstadoNoShow, c: ContextoNoShow): DecisaoNoShow {
  if (e.status !== "ativa") return { acao: "esperar", motivo: "sequência encerrada" };
  if (ESTAGIOS_FIM.includes(c.estagio)) return { acao: "encerrar", motivo: `estágio ${c.estagio}` };
  if (temTagDeControle(c.tags)) return { acao: "encerrar", motivo: "tag de controle (não perturbe, suporte humano ou optout)" };

  const proximo = proximoPasso(e);
  if (!proximo) return { acao: "encerrar", motivo: "concluída" };

  const agora = c.agora.getTime();
  const devido = new Date(proximo.devidoEm).getTime();
  if (agora < devido) return { acao: "esperar", motivo: "ainda não venceu" };
  const tolerancia = proximo.d === DIAS_NOSHOW[0] ? TOLERANCIA_PASSO1_MS : TOLERANCIA_ATRASO_MS;
  if (agora - devido > tolerancia) return { acao: "pular", passo: proximo.d, motivo: "atrasado além da tolerância" };

  if (c.propostaAtiva) return { acao: "esperar", motivo: "sequência de proposta ativa" };

  const noShow = new Date(e.noShowEm).getTime();
  const respondeu = c.ultimaDoLead && c.ultimaDoLead.getTime() > noShow ? c.ultimaDoLead.getTime() : null;
  const falouGente = c.ultimaFalaHumana && c.ultimaFalaHumana.getTime() > noShow ? c.ultimaFalaHumana.getTime() : null;
  if (respondeu) {
    if (agora < Math.max(respondeu, falouGente ?? 0) + PAUSA_RESPOSTA_MS) {
      return { acao: "esperar", motivo: "pausada: o lead respondeu e a conversa é humana" };
    }
  } else if (falouGente && agora < falouGente + ESPERA_FALA_HUMANA_MS) {
    return { acao: "esperar", motivo: "gente falou com o lead nas últimas 24h" };
  }

  const ultimo = Math.max(0, ...datasDeToques(e));
  if (ultimo && agora - ultimo < MIN_ENTRE_TOQUES_MS) return { acao: "esperar", motivo: "o último toque foi há menos de 44h" };

  if (!dentroDaJanelaNoShow(c.agora)) return { acao: "esperar", motivo: "fora da janela (10h às 18h, segunda a sábado)" };
  if (c.oficial) return { acao: "pular", passo: proximo.d, motivo: "número oficial: fora da janela de 24h" };
  return { acao: "enviar", passo: proximo.d };
}

// ---------- banco ----------

async function gravar(contactId: string, estado: EstadoNoShow): Promise<void> {
  const c = await db.contact.findUnique({ where: { id: contactId }, select: { customFields: true } });
  if (!c) return;
  const campos = { ...((c.customFields ?? {}) as Record<string, unknown>), [CHAVE_NOSHOW]: estado };
  await db.contact.update({ where: { id: contactId }, data: { customFields: campos as never } });
}

const chaveReserva = (contactId: string, d: number, noShowEm: string): string => `noshow:${contactId}:${noShowEm.slice(0, 10)}:${d}`;

async function reservar(contactId: string, d: number, noShowEm: string, agora: Date): Promise<{ ok: true } | { ok: false; desde: Date | null }> {
  const chave = chaveReserva(contactId, d, noShowEm);
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

const liberarReserva = (contactId: string, d: number, noShowEm: string) =>
  db.setting.deleteMany({ where: { key: chaveReserva(contactId, d, noShowEm) } });

const rotuloDoPasso = (d: number): string => `noshow-d${d}`;

async function saidaComRotulo(contactId: string, rotulo: string, depoisDe: Date): Promise<Date | null> {
  const m = await db.whatsappMessage.findFirst({
    where: { contactId, direction: "outbound", timestamp: { gt: depoisDe }, metadata: { path: "$.followup", equals: rotulo } },
    orderBy: { timestamp: "desc" },
    select: { timestamp: true },
  });
  return m?.timestamp ?? null;
}

type Candidato = { id: string; name: string; phone: string | null; origem: string; tags: unknown; lifecycleStage: string; customFields: unknown };

/** Todo contato marcado no-show cuja reunião perdida é a mais recente (remarcou = sai da lista). */
async function noShowsAtuais(): Promise<Map<string, Date>> {
  const ids = await db.$queryRaw<{ id: string }[]>`SELECT id FROM Contact WHERE customFields LIKE '%"evento_data"%' AND tags LIKE '%"no-show"%'`;
  const contatos = await db.contact.findMany({
    where: { id: { in: ids.map((i) => i.id) } },
    select: {
      id: true,
      name: true,
      phone: true,
      origem: true,
      customFields: true,
      tags: true,
      timelineEvents: { where: { eventType: "call" }, select: { metadata: true, timestamp: true } },
    },
  });
  const r = classificarReunioes(
    contatos.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      origem: c.origem,
      customFields: c.customFields,
      tags: c.tags,
      eventos: c.timelineEvents.flatMap((e) => {
        const res = (e.metadata as Record<string, unknown> | null)?.resultado;
        return typeof res === "string" ? [{ resultado: res, timestamp: e.timestamp }] : [];
      }),
    })),
  );
  return new Map(r.noShow.map((n) => [n.id, n.quando]));
}

/** Cria a sequência de todo no-show elegível que ainda não tem uma para ESTA reunião perdida. */
export async function adotarNoShows(agora: Date, gravarDados: boolean): Promise<{ novos: string[] }> {
  const atuais = await noShowsAtuais();
  const novos: string[] = [];
  if (atuais.size === 0) return { novos };
  const candidatos = await db.contact.findMany({
    where: { id: { in: [...atuais.keys()] } },
    select: { id: true, origem: true, lifecycleStage: true, phone: true, customFields: true },
  });
  for (const c of candidatos) {
    const quando = atuais.get(c.id);
    if (!quando || !c.phone || !origemNoShow(c.origem)) continue;
    if (ESTAGIOS_FIM.includes(c.lifecycleStage)) continue;
    const existente = lerNoShow(c.customFields);
    if (existente && existente.noShowEm === quando.toISOString()) continue;
    novos.push(c.id);
    if (!gravarDados) continue;
    await gravar(c.id, construirNoShow(quando, agora));
    await auditar("cron:sequencia-noshow", existente ? "noshow_recriada" : "noshow_adotada", `${c.id} · reunião ${quando.toISOString()}`);
  }
  return { novos };
}

// ---------- tick ----------

export type ModoNoShow = "desligado" | "teste" | "envio";
export const modoDoNoShow = (v: string): ModoNoShow => (v === "1" ? "envio" : v === "teste" ? "teste" : "desligado");

export type EnvioNoShow = { contatoId: string; telefone: string; chatId: string | null; instanceId: string | null; texto: string; rotulo: string };
export type ResultadoEnvioNoShow = { ok: boolean; erro?: string; externalId?: string };

export type DecisaoRegistrada = { contactId: string; nome: string; acao: DecisaoNoShow["acao"]; passo?: number; motivo?: string; texto?: string };
export type ResultadoNoShow = { modo: ModoNoShow; adotados: number; enviados: number; decisoes: DecisaoRegistrada[]; ocupado?: boolean };

export type DependenciasNoShow = {
  agora?: Date;
  modo?: ModoNoShow;
  /** troca o envio real (testes) */
  enviar?: (p: EnvioNoShow) => Promise<ResultadoEnvioNoShow>;
};

async function enviarReal(p: EnvioNoShow): Promise<ResultadoEnvioNoShow> {
  const conexao: Conexao | null = p.instanceId ? await conexaoPorId(p.instanceId) : await conexaoPadrao();
  if (!conexao) return { ok: false, erro: "HTTP 404: sessão do WhatsApp não encontrada" };
  const destino = p.chatId || p.telefone;
  const guarda = await liberarPelaConexao(conexao, "rotina", destino, p.texto);
  if (!guarda.liberado) return { ok: false, erro: `${PREFIXO_GUARDA}${guarda.motivo}` };
  return enviarTexto(conexao, destino, p.texto);
}

const textoLivre = (v: unknown, max: number): string | null => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

async function carregarContexto(c: Candidato, e: EstadoNoShow, agora: Date) {
  const ultimaMsg = await db.whatsappMessage.findFirst({
    where: { contactId: c.id, instanceId: { not: null } },
    orderBy: { timestamp: "desc" },
    select: { instanceId: true },
  });
  const instanceId = ultimaMsg?.instanceId ?? null;
  const inst = instanceId ? await db.whatsappInstance.findUnique({ where: { id: instanceId } }) : null;
  const entrada = await db.whatsappMessage.findFirst({
    where: { contactId: c.id, direction: "inbound" },
    orderBy: { timestamp: "desc" },
    select: { timestamp: true },
  });
  const saidas = await db.whatsappMessage.findMany({
    where: { contactId: c.id, direction: "outbound", timestamp: { gt: new Date(e.noShowEm) } },
    orderBy: { timestamp: "desc" },
    take: 60,
    select: { metadata: true, timestamp: true },
  });
  const campos = (c.customFields ?? {}) as Record<string, unknown>;
  const contexto: ContextoNoShow = {
    estagio: c.lifecycleStage,
    tags: tagsDe(c.tags),
    ultimaDoLead: entrada?.timestamp ?? null,
    ultimaFalaHumana: saidas.find((m) => ehEnvioHumano(m.metadata))?.timestamp ?? null,
    oficial: inst?.provider === "cloud_api",
    propostaAtiva: (campos.sequencia_proposta as { status?: string } | undefined)?.status === "ativa",
    agora,
  };
  return { instanceId, contexto };
}

let rodando = false;

export async function processarNoShows(deps: DependenciasNoShow = {}): Promise<ResultadoNoShow> {
  if (rodando) return { modo: "desligado", adotados: 0, enviados: 0, decisoes: [], ocupado: true };
  rodando = true;
  try {
    return await tick(deps);
  } finally {
    rodando = false;
  }
}

async function tick(deps: DependenciasNoShow): Promise<ResultadoNoShow> {
  const agora = deps.agora ?? new Date();
  const modo = deps.modo ?? modoDoNoShow(await config("sequencia_noshow", undefined, "0"));
  const res: ResultadoNoShow = { modo, adotados: 0, enviados: 0, decisoes: [] };
  if (modo === "desligado") return res;
  const gravarDados = modo === "envio";

  res.adotados = (await adotarNoShows(agora, gravarDados)).novos.length;
  const atuais = await noShowsAtuais();
  const candidatos = await db.contact.findMany({
    where: { customFields: { path: "$.sequencia_noshow.status", equals: "ativa" } },
    select: { id: true, name: true, phone: true, origem: true, tags: true, lifecycleStage: true, customFields: true },
  });

  const capDia = Number(await config("sequencia_noshow_cap_dia", undefined, String(CAP_DIA_PADRAO))) || CAP_DIA_PADRAO;
  const enviadosHoje = await db.whatsappMessage.count({
    where: { direction: "outbound", timestamp: { gte: inicioDoDiaBrt(agora) }, metadata: { path: "$.sequencia_noshow", equals: "sim" } },
  });
  const recente = await db.whatsappMessage.findFirst({
    where: { direction: "outbound", fromNumber: "crm", timestamp: { gte: new Date(agora.getTime() - MIN_ENTRE_ENVIOS_MS) } },
    select: { id: true },
  });
  const rodada = { gravarDados, deps, res, atuais, vagas: capDia - enviadosHoje, bloqueado: gravarDados ? !!recente : false };

  for (const c of candidatos) {
    try {
      await processarContato(c, agora, rodada);
    } catch (e) {
      await auditar("cron:sequencia-noshow", "noshow_erro", `${c.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return res;
}

type Rodada = {
  gravarDados: boolean;
  deps: DependenciasNoShow;
  res: ResultadoNoShow;
  atuais: Map<string, Date>;
  vagas: number;
  bloqueado: boolean;
};

async function encerrar(c: Candidato, estado: EstadoNoShow, motivo: string, agora: Date, r: Rodada): Promise<void> {
  r.res.decisoes.push({ contactId: c.id, nome: c.name, acao: "encerrar", motivo });
  if (!r.gravarDados) return;
  await gravar(c.id, { ...estado, status: "encerrada", encerradaEm: agora.toISOString(), encerradaMotivo: motivo });
  await auditar("cron:sequencia-noshow", "noshow_encerrada", `${c.id}: ${motivo}`);
}

async function processarContato(c: Candidato, agora: Date, r: Rodada): Promise<void> {
  let estado = lerNoShow(c.customFields);
  if (!estado) return;

  // Remarcou, foi marcado "compareceu" ou a reunião perdida mudou: esta sequência não vale mais.
  const quando = r.atuais.get(c.id);
  if (!quando || quando.toISOString() !== estado.noShowEm) {
    await encerrar(c, estado, "reunião remarcada ou resultado alterado", agora, r);
    return;
  }

  const { instanceId, contexto } = await carregarContexto(c, estado, agora);
  for (let volta = 0; volta < DIAS_NOSHOW.length + 2; volta++) {
    const d = decidirNoShow(estado, contexto);
    if (d.acao === "esperar") return;
    if (d.acao === "encerrar") return encerrar(c, estado, d.motivo, agora, r);
    if (d.acao === "pular") {
      r.res.decisoes.push({ contactId: c.id, nome: c.name, acao: "pular", passo: d.passo, motivo: d.motivo });
      estado = trocarPasso(estado, d.passo, { status: "pulado", motivo: d.motivo });
      if (r.gravarDados) await gravar(c.id, estado);
      continue;
    }
    const recente = agora.getTime() - new Date(estado.noShowEm).getTime() < 7 * 24 * HORA;
    const texto = textoNoShow(d.passo, c.name, recente);
    if (!texto) {
      estado = trocarPasso(estado, d.passo, { status: "pulado", motivo: "sem texto para este passo" });
      if (r.gravarDados) await gravar(c.id, estado);
      continue;
    }
    const registro: DecisaoRegistrada = { contactId: c.id, nome: c.name, acao: "enviar", passo: d.passo, texto };
    // Guarda central (13/11/2026): compra, opt-out, adiamento, "vamos fechar", última fala do lead, número único.
    const conexaoAtual = instanceId ? await conexaoPorId(instanceId) : await conexaoPadrao();
    const toque = await podeTocarContato({ contactId: c.id, regua: "sequencia-noshow", conexao: conexaoAtual, agora, seco: !r.gravarDados });
    if (!toque.liberado) {
      r.res.decisoes.push({ ...registro, acao: "esperar", motivo: `guarda: ${toque.motivo} (${toque.detalhe})` });
      return;
    }
    const instanciaEnvio = toque.conexao?.instanceId ?? instanceId;
    if (!r.gravarDados) {
      r.res.decisoes.push(registro);
      return;
    }
    if (r.bloqueado || r.vagas <= 0) return; // 1 envio por vez, 3 min entre eles, teto diário
    await enviarComSeguranca(c, estado, d.passo, texto, registro, instanciaEnvio, agora, r);
    return;
  }
}

async function enviarComSeguranca(
  c: Candidato,
  estadoDoTick: EstadoNoShow,
  passo: number,
  texto: string,
  registro: DecisaoRegistrada,
  instanceId: string | null,
  agora: Date,
  r: Rodada,
): Promise<void> {
  if (!c.phone) {
    r.res.decisoes.push({ ...registro, acao: "pular", motivo: "sem telefone" });
    await gravar(c.id, trocarPasso(estadoDoTick, passo, { status: "pulado", motivo: "sem telefone" }));
    return;
  }

  // Releitura: o retrato do tick pode ter envelhecido.
  const fresco = await db.contact.findUnique({
    where: { id: c.id },
    select: { id: true, name: true, phone: true, origem: true, tags: true, lifecycleStage: true, customFields: true },
  });
  const estado = fresco ? lerNoShow(fresco.customFields) : null;
  if (!fresco || !estado) return;
  const { contexto } = await carregarContexto(fresco, estado, agora);
  const de = decidirNoShow(estado, contexto);
  if (de.acao !== "enviar" || de.passo !== passo) return;

  const rotulo = rotuloDoPasso(passo);
  const jaSaiu = await saidaComRotulo(c.id, rotulo, new Date(estado.noShowEm));
  if (jaSaiu) {
    await gravar(c.id, trocarPasso(estado, passo, { status: "enviado", enviadoEm: jaSaiu.toISOString() }));
    await auditar("cron:sequencia-noshow", "estado_curado", `${c.id} [${rotulo}] já constava no histórico`);
    return;
  }

  const reserva = await reservar(c.id, passo, estado.noShowEm, agora);
  if (!reserva.ok) {
    if (reserva.desde && agora.getTime() - reserva.desde.getTime() > RESERVA_VELHA_MS) {
      await gravar(c.id, trocarPasso(estado, passo, { status: "pulado", motivo: "reserva antiga sem confirmação de envio (envio incerto)" }));
      await auditar("cron:sequencia-noshow", "toque_incerto", `${c.id} [${rotulo}]: reserva antiga sem mensagem no histórico`);
    }
    return;
  }

  r.bloqueado = true;
  const campos = (c.customFields ?? {}) as Record<string, unknown>;
  const envio: EnvioNoShow = { contatoId: c.id, telefone: c.phone, chatId: textoLivre(campos.whatsapp_chat_id, 80), instanceId, texto, rotulo };
  let resultado: ResultadoEnvioNoShow;
  try {
    resultado = await (r.deps.enviar ?? enviarReal)(envio);
  } catch (e) {
    resultado = { ok: false, erro: e instanceof Error ? e.message : String(e) };
  }

  if (!resultado.ok) {
    if (resultado.erro?.startsWith(PREFIXO_GUARDA)) {
      await liberarReserva(c.id, passo, estado.noShowEm);
      r.res.decisoes.push({ ...registro, acao: "esperar", motivo: resultado.erro });
      return;
    }
    if (falhaDefinitiva(resultado.erro)) {
      await liberarReserva(c.id, passo, estado.noShowEm);
      const tentativas = (estado.passos.find((p) => p.d === passo)?.tentativas ?? 0) + 1;
      const mudanca: Partial<PassoSequencia> =
        tentativas >= 2
          ? { status: "pulado", motivo: `falhou ${tentativas} vezes: ${resultado.erro}`, tentativas }
          : { tentativas, tentativaEm: agora.toISOString() };
      await gravar(c.id, trocarPasso(estado, passo, mudanca));
      await auditar("cron:sequencia-noshow", "toque_falhou", `${c.id} [${rotulo}]: ${resultado.erro ?? "?"}`);
      r.res.decisoes.push({ ...registro, acao: "esperar", motivo: `falha no envio: ${resultado.erro ?? "?"}` });
      return;
    }
    // Ambíguo (timeout, rede): pode ter saído. Não repete sozinho.
    await gravar(c.id, trocarPasso(estado, passo, { status: "pulado", motivo: `envio incerto: ${resultado.erro ?? "sem resposta"}` }));
    await auditar("cron:sequencia-noshow", "toque_incerto", `${c.id} [${rotulo}]: ${resultado.erro ?? "sem resposta"}`);
    r.res.decisoes.push({ ...registro, acao: "esperar", motivo: `envio incerto: ${resultado.erro ?? "sem resposta"}` });
    return;
  }

  // Resolve ANTES do resto do registro: se o banco falhar adiante, o texto não sai de novo.
  await gravar(c.id, trocarPasso(estado, passo, { status: "enviado", enviadoEm: agora.toISOString() }));
  await db.whatsappMessage.create({
    data: {
      contactId: c.id,
      instanceId,
      fromNumber: "crm",
      toNumber: c.phone,
      body: texto,
      type: "text",
      direction: "outbound",
      status: "sent",
      externalId: resultado.externalId ?? null,
      timestamp: agora,
      // ator "cron": não conta como gente falando (não pausa a sequência nem cala o agente)
      metadata: { origem: "followup", followup: rotulo, ator: "cron", fonte: "api", sequencia_noshow: "sim" } as never,
    },
  });
  await registrarEvento({
    contactId: c.id,
    eventType: "whatsapp_message",
    channel: "whatsapp",
    metadata: { direcao: "enviada", texto, followup: rotulo, ator: "cron" },
  });
  await auditar("cron:sequencia-noshow", "toque_enviado", `${c.id} [${rotulo}]`);
  r.res.decisoes.push(registro);
  r.res.enviados++;
  r.vagas--;
}
