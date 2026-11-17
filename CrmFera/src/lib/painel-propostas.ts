import { db } from "@/lib/db";
import { tagsDe } from "@/lib/tags";
import { ehEnvioHumano } from "@/lib/seletor-agente";
import { chanceFechamento, type ResultadoChance } from "@/lib/chance-fechamento";
import { ehToqueDeFollowupProposta } from "@/lib/followup-proposta-detectar";
import { lerProposta, ofertaDaProposta, precoDaProposta } from "@/lib/proposta-contato";
import { PRECO_SPRINT_CENTAVOS, ofertaMaisRecente, resumirMensagem } from "@/lib/oferta-na-conversa";
import {
  DIAS_SEQUENCIA,
  ORIGENS_FORA_DA_SEQUENCIA,
  ESPERA_FALA_HUMANA_MS,
  PAUSA_RESPOSTA_MS,
  contarToques,
  lerSequencia,
  proximoPasso,
  toquesSemResposta,
  type EstadoSequencia,
} from "@/lib/sequencia-proposta";

/**
 * Lista de leads em "Analisando proposta" para o Painel (09/11/2026): nome, valor da proposta,
 * quantos follow-ups já receberam, data da última mensagem enviada, chance de fechamento e o
 * próximo toque da sequência.
 */

const DIA_MS = 86_400_000;
const VALIDADE_DIAS = 3;

export type MensagemDoPainel = {
  direction: string;
  timestamp: Date;
  body: string;
  metadata: unknown;
  /** text | audio | video | image | document */
  type?: string | null;
};

export type EntradaProposta = {
  id: string;
  nome: string;
  tags: string[];
  customFields: unknown;
  /** quando o estágio virou `proposta` (último stage_change) */
  viradaParaPropostaEm: Date | null;
  /** quem moveu para `proposta`: e-mail de gente ou `agente:<slug>` */
  atorDaVirada?: string | null;
  /** origem do contato (`funil:...`); funis com número único ficam fora da sequência */
  origem?: string | null;
  /** telefone do contato, para o botão do WhatsApp */
  telefone?: string | null;
  criadoEm: Date;
  mensagens: MensagemDoPainel[];
};

export type StatusSequenciaPainel = "ativa" | "encerrada" | "sem";

export type LinhaProposta = {
  id: string;
  nome: string;
  /** só dígitos, com DDI (formato do wa.me); null = sem telefone utilizável */
  telefone: string | null;
  /** dia em que a proposta foi enviada (D0 da sequência, ou a virada de estágio) */
  inicioEm: Date;
  /** null = a proposta não está registrada e o valor não é conhecido */
  valorCentavos: number | null;
  /** de onde veio o valor (manual, proposta registrada, conversa, agente ou desconhecido) */
  valorOrigem: OrigemDoValor;
  /** nome da oferta quando não é a padrão */
  valorRotulo: string | null;
  /** em uma frase, de onde saiu o valor (tooltip) */
  valorEvidencia: string | null;
  /** resumo de uma linha da última mensagem que enviamos; null = nunca enviamos */
  ultimaResumo: string | null;
  /** o mesmo resumo, mais longo, para o tooltip */
  ultimaResumoCompleto: string | null;
  followups: number;
  totalDeToques: number;
  ultimaEnviadaEm: Date | null;
  chance: ResultadoChance;
  statusSequencia: StatusSequenciaPainel;
  proximo: { d: number; quando: Date } | null;
  /** por que não há próximo toque, ou por que ele está segurado; null = nada travando */
  motivo: string | null;
  /** o "!" do Painel: o que o dono tem de fazer à mão; null = o robô cuida */
  acaoManual: string | null;
  diasDesdeProposta: number | null;
};

export type PainelPropostas = {
  linhas: LinhaProposta[];
  totalCentavos: number;
  esperadoCentavos: number;
};

/** Preço do produto que cada agente oferece quando move o lead para "proposta". */
// configurável: env VALOR_POR_AGENTE='{"agente:fechamento": 300000}' (centavos)
const VALOR_POR_AGENTE: Readonly<Record<string, number>> = (() => {
  try {
    return JSON.parse(process.env.VALOR_POR_AGENTE || "{}") as Record<string, number>;
  } catch {
    return {};
  }
})();

export type OrigemDoValor = "manual" | "registrada" | "conversa" | "agente" | "desconhecido";

export type ValorDoLead = {
  /** null = nenhuma pista de valor */
  centavos: number | null;
  origem: OrigemDoValor;
  /** nome da oferta quando não é a padrão */
  rotulo: string | null;
  /** de onde saiu o valor, para o tooltip */
  evidencia: string | null;
};

/**
 * Valor da proposta que está de pé para o lead, do mais certo para o menos certo:
 *  1. definido à mão: `customFields.valor_proposta` (reais) ou a tag `oferta-sprint` (R$ 3.000);
 *  2. convite do Sprint na conversa, DEPOIS da proposta (quem recusou a maior e foi convidado para o Sprint);
 *  3. proposta registrada no CRM (catálogo);
 *  4. a oferta mais recente que a conversa mostra (link da oferta ou valor dito);
 *  5. o produto do agente que fez a oferta (quem moveu o lead para `proposta`) ou a tag `oferta-*`.
 * As tags de "porta" (`interesse-*`) dizem por onde o lead chegou, não o que foi oferecido: não valem.
 */
export function valorDoLead(i: {
  customFields: unknown;
  tags: string[];
  atorDaVirada?: string | null;
  saidas: readonly { body: string; timestamp: Date }[];
  inicio: Date;
}): ValorDoLead {
  const campos = (i.customFields ?? {}) as Record<string, unknown>;
  const manual = typeof campos.valor_proposta === "number" && campos.valor_proposta > 0 ? campos.valor_proposta : null;
  if (manual !== null) {
    return { centavos: Math.round(manual * 100), origem: "manual", rotulo: null, evidencia: "valor definido à mão no CRM" };
  }
  if (i.tags.includes("oferta-sprint")) {
    return { centavos: PRECO_SPRINT_CENTAVOS, origem: "manual", rotulo: "Sprint", evidencia: "tag oferta-sprint" };
  }

  const registrada = lerProposta(i.customFields);
  const preco = registrada ? precoDaProposta(registrada.ofertaBase) : null;

  const sprint = ofertaMaisRecente(i.saidas, { soSprint: true, ...(preco ? { depoisDe: i.inicio } : {}) });
  if (sprint) return { centavos: sprint.centavos, origem: "conversa", rotulo: sprint.rotulo, evidencia: sprint.evidencia };

  if (preco) return { centavos: preco.totalCentavos, origem: "registrada", rotulo: null, evidencia: "proposta registrada no CRM" };

  const conversa = ofertaMaisRecente(i.saidas);
  if (conversa) return { centavos: conversa.centavos, origem: "conversa", rotulo: conversa.rotulo, evidencia: conversa.evidencia };

  const doAgente = i.atorDaVirada ? VALOR_POR_AGENTE[i.atorDaVirada] : undefined;
  if (doAgente) return { centavos: doAgente, origem: "agente", rotulo: null, evidencia: "produto do agente que fez a oferta" };
  if (i.tags.includes("oferta-cjc")) return { centavos: 1_000_000, origem: "agente", rotulo: null, evidencia: "tag oferta-cjc" };
  if (i.tags.includes("oferta-csl")) return { centavos: 750_000, origem: "agente", rotulo: null, evidencia: "tag oferta-csl" };
  return { centavos: null, origem: "desconhecido", rotulo: null, evidencia: null };
}

/** Só dígitos, de 10 a 15 (DDI + número); fora disso não há link de WhatsApp. */
export function telefoneParaWhatsapp(bruto: string | null | undefined): string | null {
  const digitos = (bruto ?? "").replace(/\D/g, "");
  return digitos.length >= 10 && digitos.length <= 15 ? digitos : null;
}

export type CampoOrdem = "chance" | "proposta" | "ultima" | "proximo";
export type DirecaoOrdem = "asc" | "desc";

/**
 * Sentido de cada ordenação no primeiro clique: chance maior primeiro; proposta mais recente primeiro;
 * última mensagem mais antiga primeiro (quem está há mais tempo sem receber nada); próximo follow-up
 * mais próximo primeiro. Clicar de novo no mesmo botão inverte.
 */
export const DIRECAO_PADRAO: Readonly<Record<CampoOrdem, DirecaoOrdem>> = {
  chance: "desc",
  proposta: "desc",
  ultima: "asc",
  proximo: "asc",
};

export function lerOrdem(campo?: string, dir?: string): { campo: CampoOrdem; dir: DirecaoOrdem } {
  const c: CampoOrdem = campo === "proposta" || campo === "ultima" || campo === "proximo" ? campo : "chance";
  const d: DirecaoOrdem = dir === "asc" || dir === "desc" ? dir : DIRECAO_PADRAO[c];
  return { campo: c, dir: d };
}

function valorDaOrdem(l: LinhaProposta, campo: CampoOrdem): number | null {
  switch (campo) {
    case "chance":
      return l.chance.pct;
    case "proposta":
      return l.inicioEm.getTime();
    case "ultima":
      return l.ultimaEnviadaEm ? l.ultimaEnviadaEm.getTime() : null;
    case "proximo":
      return l.proximo ? l.proximo.quando.getTime() : null;
  }
}

/** Ordena sem mexer na lista original. Quem não tem a data (sem mensagem, sem próximo toque) fica sempre no fim. */
export function ordenarLinhas(linhas: readonly LinhaProposta[], campo: CampoOrdem, dir: DirecaoOrdem): LinhaProposta[] {
  const sinal = dir === "asc" ? 1 : -1;
  return [...linhas].sort((a, b) => {
    const va = valorDaOrdem(a, campo);
    const vb = valorDaOrdem(b, campo);
    if (va === null && vb === null) return b.chance.pct - a.chance.pct;
    if (va === null) return 1;
    if (vb === null) return -1;
    return (va - vb) * sinal || b.chance.pct - a.chance.pct;
  });
}

function manualDe(customFields: unknown): number | null {
  const v = (customFields as Record<string, unknown> | null)?.chance_manual;
  return typeof v === "number" ? v : null;
}

const ddmm = (d: Date): string =>
  d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" });

/**
 * Por que o lead está sem próximo follow-up, ou por que o próximo está segurado (11/11/2026).
 * Espelha as regras de `adotarSequenciasProposta` e `decidirSequencia`; null = nada travando.
 */
export function motivoSemFollowup(i: {
  sequencia: EstadoSequencia | null;
  customFields: unknown;
  tags: readonly string[];
  origem?: string | null;
  ultimaDoLead: Date | null;
  /** última mensagem nossa escrita por gente (não robô) */
  ultimaFalaHumana?: Date | null;
  agora: Date;
}): string | null {
  const { sequencia } = i;
  if (sequencia?.status === "encerrada") return `encerrada: ${sequencia.encerradaMotivo ?? "sem motivo registrado"}`;
  if (sequencia) {
    if (i.tags.some((t) => t === "optout" || t.startsWith("controle-"))) return "encerra no próximo ciclo: tag de controle";
    if (!proximoPasso(sequencia)) return "concluindo";
    const inicio = new Date(sequencia.inicio).getTime();
    const depois = (d: Date | null | undefined) => (d && d.getTime() > inicio ? d.getTime() : null);
    const resposta = depois(i.ultimaDoLead);
    const gente = depois(i.ultimaFalaHumana);
    const agora = i.agora.getTime();
    if (resposta) {
      const volta = Math.max(resposta, gente ?? 0) + PAUSA_RESPOSTA_MS;
      if (agora < volta) return `pausada até ${ddmm(new Date(volta))}: o lead respondeu`;
    } else if (gente && agora < gente + ESPERA_FALA_HUMANA_MS) {
      return "segurada 24h: alguém da equipe falou com o lead";
    }
    return null;
  }
  if (ORIGENS_FORA_DA_SEQUENCIA.includes((i.origem ?? "").toLowerCase())) return "funil com número único: fora da sequência";
  const registrada = lerProposta(i.customFields);
  if (registrada) {
    return ofertaDaProposta(registrada) ? "o robô adota no próximo ciclo (9h)" : "oferta fora do catálogo: follow-up manual";
  }
  if (i.tags.includes("oferta-sprint")) return "Sprint: follow-up manual";
  const manual = (i.customFields as Record<string, unknown> | null)?.valor_proposta;
  if (typeof manual === "number" && manual > 0) return "proposta personalizada: follow-up manual";
  return "proposta não registrada";
}

/** Motivos em que o robô segue cuidando sozinho (não pedem "!"). */
const MOTIVOS_DO_ROBO = ["o robô adota no próximo ciclo (9h)", "funil com número único: fora da sequência"];

/**
 * O "!" do Painel (11/11/2026): o lead mandou a última mensagem (ele está esperando) ou o follow-up
 * dele é manual (o robô não cuida). Null = nada a fazer à mão.
 */
export function acaoManualDe(i: {
  mensagens: readonly MensagemDoPainel[];
  statusSequencia: StatusSequenciaPainel;
  motivo: string | null;
}): string | null {
  const ultimaMsg = i.mensagens.reduce<MensagemDoPainel | null>(
    (a, m) => (!a || m.timestamp.getTime() >= a.timestamp.getTime() ? m : a),
    null,
  );
  if (ultimaMsg?.direction === "inbound") return `responder: o lead mandou a última mensagem (${ddmm(ultimaMsg.timestamp)})`;
  if (i.statusSequencia === "ativa") return null;
  if (!i.motivo || MOTIVOS_DO_ROBO.includes(i.motivo)) return null;
  return `follow-up manual: ${i.motivo}`;
}

const ultima = (datas: Date[]): Date | null =>
  datas.length ? new Date(Math.max(...datas.map((d) => d.getTime()))) : null;

export function montarLinha(e: EntradaProposta, agora: Date): LinhaProposta {
  const sequencia: EstadoSequencia | null = lerSequencia(e.customFields);
  const registrada = lerProposta(e.customFields);
  const inicio = sequencia
    ? new Date(sequencia.inicio)
    : (e.viradaParaPropostaEm ?? (registrada ? new Date(registrada.enviadaEm) : e.criadoEm));

  const entradas = e.mensagens.filter((m) => m.direction === "inbound");
  const saidas = e.mensagens.filter((m) => m.direction === "outbound");
  const ultimaDoLead = ultima(entradas.map((m) => m.timestamp));
  const ultimaFalaHumana = ultima(saidas.filter((m) => ehEnvioHumano(m.metadata)).map((m) => m.timestamp));
  const depoisDaProposta = (d: Date | null) => !!d && d.getTime() > inicio.getTime();
  const respondeuAposProposta = depoisDaProposta(ultimaDoLead);

  const toquesPorTexto = saidas.filter(
    (m) => m.timestamp.getTime() > inicio.getTime() + 10 * 60_000 && ehToqueDeFollowupProposta(m.body, m.metadata),
  );
  const followups = sequencia ? contarToques(sequencia) : toquesPorTexto.length;
  const semResposta = sequencia
    ? toquesSemResposta(sequencia, ultimaDoLead, ultimaFalaHumana)
    : toquesPorTexto.filter((m) => !ultimaDoLead || m.timestamp.getTime() > ultimaDoLead.getTime()).length;

  const venceEm = registrada || sequencia ? inicio.getTime() + VALIDADE_DIAS * DIA_MS : null;
  const tags = e.tags;
  const chance = chanceFechamento(
    {
      tags,
      respondeuAposProposta,
      diasSemRespostaDoLead: ultimaDoLead ? Math.floor((agora.getTime() - ultimaDoLead.getTime()) / DIA_MS) : null,
      mensagensDoLead: entradas.length,
      toquesSemResposta: semResposta,
      diasDesdeVencimento: venceEm === null ? null : Math.floor((agora.getTime() - venceEm) / DIA_MS),
    },
    manualDe(e.customFields),
  );

  const valor = valorDoLead({ customFields: e.customFields, tags, atorDaVirada: e.atorDaVirada, saidas, inicio });
  const ultimaSaida = saidas.length ? saidas.reduce((a, b) => (b.timestamp.getTime() >= a.timestamp.getTime() ? b : a)) : null;
  const resumo = ultimaSaida ? resumirMensagem(ultimaSaida.body, ultimaSaida.type, ultimaSaida.metadata) : null;
  const proximo = sequencia && sequencia.status === "ativa" ? proximoPasso(sequencia) : null;
  const motivo = motivoSemFollowup({ sequencia, customFields: e.customFields, tags, origem: e.origem, ultimaDoLead, ultimaFalaHumana, agora });
  return {
    id: e.id,
    nome: e.nome,
    telefone: telefoneParaWhatsapp(e.telefone),
    inicioEm: inicio,
    valorCentavos: valor.centavos,
    valorOrigem: valor.origem,
    valorRotulo: valor.rotulo,
    valorEvidencia: valor.evidencia,
    ultimaResumo: resumo ? resumo.curto : null,
    ultimaResumoCompleto: resumo ? resumo.completo : null,
    followups,
    totalDeToques: DIAS_SEQUENCIA.length,
    ultimaEnviadaEm: ultima(saidas.map((m) => m.timestamp)),
    chance,
    statusSequencia: sequencia ? sequencia.status : "sem",
    proximo: proximo ? { d: proximo.d, quando: new Date(proximo.devidoEm) } : null,
    motivo,
    acaoManual: acaoManualDe({ mensagens: e.mensagens, statusSequencia: sequencia ? sequencia.status : "sem", motivo }),
    diasDesdeProposta: Math.floor((agora.getTime() - inicio.getTime()) / DIA_MS),
  };
}

export function montarPainel(entradas: EntradaProposta[], agora: Date): PainelPropostas {
  const linhas = entradas
    .map((e) => montarLinha(e, agora))
    .sort((a, b) => b.chance.pct - a.chance.pct || (b.valorCentavos ?? 0) - (a.valorCentavos ?? 0));
  const totalCentavos = linhas.reduce((s, l) => s + (l.valorCentavos ?? 0), 0);
  const esperadoCentavos = Math.round(linhas.reduce((s, l) => s + ((l.valorCentavos ?? 0) * l.chance.pct) / 100, 0));
  return { linhas, totalCentavos, esperadoCentavos };
}

export async function painelPropostas(agora = new Date()): Promise<PainelPropostas> {
  const contatos = await db.contact.findMany({
    where: { lifecycleStage: "proposta" },
    select: { id: true, name: true, phone: true, origem: true, tags: true, customFields: true, createdAt: true },
  });
  if (!contatos.length) return { linhas: [], totalCentavos: 0, esperadoCentavos: 0 };
  const ids = contatos.map((c) => c.id);
  const [mensagens, viradas] = await Promise.all([
    db.whatsappMessage.findMany({
      where: { contactId: { in: ids } },
      orderBy: { timestamp: "asc" },
      select: { contactId: true, direction: true, timestamp: true, body: true, metadata: true, type: true },
    }),
    db.timelineEvent.findMany({
      where: { contactId: { in: ids }, eventType: "stage_change", metadata: { path: "$.para", equals: "proposta" } },
      orderBy: { timestamp: "asc" },
      select: { contactId: true, timestamp: true, metadata: true },
    }),
  ]);
  const porContato = new Map<string, MensagemDoPainel[]>();
  for (const m of mensagens) {
    if (!m.contactId) continue;
    const lista = porContato.get(m.contactId) ?? [];
    lista.push({ direction: m.direction, timestamp: m.timestamp, body: m.body, metadata: m.metadata, type: m.type });
    porContato.set(m.contactId, lista);
  }
  const virada = new Map<string, { em: Date; ator: string | null }>();
  for (const v of viradas) {
    const ator = (v.metadata as Record<string, unknown> | null)?.ator;
    virada.set(v.contactId, { em: v.timestamp, ator: typeof ator === "string" ? ator : null });
  }

  return montarPainel(
    contatos.map((c) => ({
      id: c.id,
      nome: c.name,
      telefone: c.phone,
      origem: c.origem,
      tags: tagsDe(c.tags),
      customFields: c.customFields,
      viradaParaPropostaEm: virada.get(c.id)?.em ?? null,
      atorDaVirada: virada.get(c.id)?.ator ?? null,
      criadoEm: c.createdAt,
      mensagens: porContato.get(c.id) ?? [],
    })),
    agora,
  );
}
