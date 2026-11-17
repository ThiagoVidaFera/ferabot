/**
 * Prioridade da fila "quem falou e ninguem respondeu".
 *
 * Modulo PURO (sem banco, sem relogio global): recebe os numeros ja medidos e
 * devolve pontos + motivos legiveis. Assim a regra e testavel e a tela nao
 * precisa adivinhar por que alguem esta no topo.
 *
 * Regra (0-100, soma dos pesos abaixo, presa entre 0 e 100):
 *   tempo parado   ate 30   1,25 pt/hora desde a 1a mensagem sem resposta
 *   calor          ate 30   calor() 0-100 x 0,30 (respondeu, estagio, compra...)
 *   janela 24h     25 | 10 | 0   fechando (18-24h) | aberta (<18h) | fechada
 *   ticket         ate 10   ja comprou 10 · negocio >= R$1.000 8 · negocio menor 4
 *   origem         ate 10   funil:* 10 · anuncio/indicacao 8 · organico 4
 *   encerramento   -25      ultima fala do lead e so "obrigado/ok/joinha"
 *
 * Niveis: >= 70 urgente · >= 45 alta · resto normal.
 * Empate: janela fechando > aberta > fechada, depois mais tempo parado.
 */

export const JANELA_HORAS = 24;
export const FECHANDO_APOS_HORAS = 18;

export const PESOS = {
  tempoPorHora: 1.25,
  tempoMax: 30,
  calorFator: 0.3,
  janelaFechando: 25,
  janelaAberta: 10,
  ticketComprou: 10,
  ticketNegocioGrande: 8,
  ticketNegocioPequeno: 4,
  negocioGrandeCents: 100_000,
  origemFunil: 10,
  origemAnuncioOuIndicacao: 8,
  origemOrganico: 4,
  encerramento: -25,
} as const;

export const LIMIAR_URGENTE = 70;
export const LIMIAR_ALTA = 45;

const HORA_MS = 3_600_000;

export type EstadoJanela = "aberta" | "fechando" | "fechada";
export type Janela = { estado: EstadoJanela; horasRestantes: number | null };
export type Nivel = "urgente" | "alta" | "normal";

/** Janela de 24h contada da ULTIMA mensagem do lead. */
export function janelaWhatsapp(ultimaEntrada: Date, agora: Date): Janela {
  const decorridas = Math.max(0, (agora.getTime() - ultimaEntrada.getTime()) / HORA_MS);
  if (decorridas >= JANELA_HORAS) return { estado: "fechada", horasRestantes: null };
  const horasRestantes = JANELA_HORAS - decorridas;
  return {
    estado: decorridas >= FECHANDO_APOS_HORAS ? "fechando" : "aberta",
    horasRestantes,
  };
}

export type EntradaPrioridade = {
  horasParado: number;
  calor: number;
  janela: Janela;
  origem: string;
  estagio: string;
  receitaCents: number;
  valorNegocioCents: number;
  encerramento: boolean;
};

export type PartesPrioridade = {
  tempo: number;
  calor: number;
  janela: number;
  ticket: number;
  origem: number;
  encerramento: number;
};

export type Prioridade = {
  pontos: number;
  nivel: Nivel;
  partes: PartesPrioridade;
  motivos: string[];
};

const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function pontosOrigem(origem: string): number {
  if (origem.startsWith("funil:")) return PESOS.origemFunil;
  if (origem === "anuncio" || origem === "indicacao") return PESOS.origemAnuncioOuIndicacao;
  if (origem === "organico") return PESOS.origemOrganico;
  return 0;
}

function pontosTicket(e: EntradaPrioridade): number {
  if (e.receitaCents > 0) return PESOS.ticketComprou;
  if (e.valorNegocioCents >= PESOS.negocioGrandeCents) return PESOS.ticketNegocioGrande;
  if (e.valorNegocioCents > 0) return PESOS.ticketNegocioPequeno;
  return 0;
}

function pontosJanela(j: Janela): number {
  if (j.estado === "fechando") return PESOS.janelaFechando;
  if (j.estado === "aberta") return PESOS.janelaAberta;
  return 0;
}

function nivelDe(pontos: number): Nivel {
  if (pontos >= LIMIAR_URGENTE) return "urgente";
  if (pontos >= LIMIAR_ALTA) return "alta";
  return "normal";
}

function motivosDe(e: EntradaPrioridade, partes: PartesPrioridade): string[] {
  const m: string[] = [];
  if (e.janela.estado === "fechando" && e.janela.horasRestantes !== null) {
    m.push(`janela de 24h fecha em ${Math.max(1, Math.round(e.janela.horasRestantes))}h`);
  } else if (e.janela.estado === "fechada") {
    m.push("janela de 24h ja fechou");
  }
  if (partes.tempo > 0) m.push(`parado ha ${Math.floor(e.horasParado)}h`);
  if (partes.calor >= 12) m.push(`lead quente (${Math.round(e.calor)}/100)`);
  if (e.receitaCents > 0) m.push("ja comprou");
  else if (partes.ticket > 0) m.push("tem negocio aberto");
  if (partes.origem > 0) m.push(`veio de ${e.origem}`);
  if (e.encerramento) m.push("so agradeceu — pode nao precisar de resposta");
  return m;
}

export function calcularPrioridade(e: EntradaPrioridade): Prioridade {
  const partes: PartesPrioridade = {
    tempo: Math.floor(limitar(e.horasParado * PESOS.tempoPorHora, 0, PESOS.tempoMax)),
    calor: Math.round(limitar(e.calor, 0, 100) * PESOS.calorFator),
    janela: pontosJanela(e.janela),
    ticket: pontosTicket(e),
    origem: pontosOrigem(e.origem),
    encerramento: e.encerramento ? PESOS.encerramento : 0,
  };
  const soma = Object.values(partes).reduce((a, b) => a + b, 0);
  const pontos = limitar(soma, 0, 100);
  return { pontos, nivel: nivelDe(pontos), partes, motivos: motivosDe(e, partes) };
}

const RANK_JANELA: Record<EstadoJanela, number> = { fechando: 2, aberta: 1, fechada: 0 };

type Ordenavel = {
  horasParado: number;
  janela: { estado: EstadoJanela };
  prioridade: { pontos: number };
};

/** Devolve uma lista NOVA ordenada; a original nao e tocada. */
export function ordenarFila<T extends Ordenavel>(itens: readonly T[]): T[] {
  return [...itens].sort(
    (a, b) =>
      b.prioridade.pontos - a.prioridade.pontos ||
      RANK_JANELA[b.janela.estado] - RANK_JANELA[a.janela.estado] ||
      b.horasParado - a.horasParado,
  );
}

const RE_ENCERRAMENTO =
  /^(?:ok(?:ay)?|okk+|blz|beleza|certo|combinado|show|top|valeu|vlw|obrigad[oa]s?|brigad[oa]|perfeito|entendi|legal|massa|[👍🙏👌😊🙂❤️\s!.,]+)(?:[\s,!.]+(?:ok|blz|valeu|obrigad[oa]s?|brigad[oa]|show|top|[👍🙏👌😊🙂❤️]+))*[\s!.👍🙏👌😊🙂❤️]*$/iu;

/** Ultima fala do lead e so um fecho de conversa, sem pergunta nem pedido. */
export function ehEncerramento(texto: string): boolean {
  const t = texto.trim();
  if (!t || t.length > 40 || t.includes("?")) return false;
  // "perfeito, obrigado!" = fecho; "obrigado, mas quanto custa" tem conteudo a mais
  const semFecho = t.replace(/[,!.]+/g, " ").replace(/\s+/g, " ").trim();
  return RE_ENCERRAMENTO.test(semFecho);
}
