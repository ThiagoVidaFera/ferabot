/**
 * Estimativa de chance de fechamento de uma proposta em análise (painel, 09/11/2026).
 *
 * NÃO é probabilidade medida: é uma régua de sinais da conversa, calibrada no histórico do CRM
 * (3 vendas entre 31 propostas já resolvidas, perto de 10%). Parte de 8% e soma ou tira pontos por
 * sinais observáveis. Cada ponto tem um motivo legível, que o painel mostra ao passar o mouse.
 * `customFields.chance_manual` (0 a 100) vence a régua, para quando o dono souber algo que o CRM não sabe.
 */

export const CHANCE_BASE = 8;
export const CHANCE_MINIMA = 1;
export const CHANCE_MAXIMA = 40;

export type SinaisChance = {
  tags: string[];
  /** o lead falou depois de a proposta sair */
  respondeuAposProposta: boolean;
  /** dias desde a última mensagem do lead; null = nunca falou */
  diasSemRespostaDoLead: number | null;
  /** quantas mensagens o lead já mandou, no total */
  mensagensDoLead: number;
  /** toques de follow-up enviados depois da última fala do lead */
  toquesSemResposta: number;
  /** dias desde que a proposta venceu (negativo = ainda vale); null = sem proposta registrada */
  diasDesdeVencimento: number | null;
};

export type ResultadoChance = {
  /** 1 a 40 (ou o valor manual) */
  pct: number;
  manual: boolean;
  motivos: string[];
};

const temTag = (tags: string[], ...prefixos: string[]): boolean =>
  tags.some((t) => prefixos.some((p) => t === p || t.startsWith(p)));

export function chanceFechamento(s: SinaisChance, manual?: number | null): ResultadoChance {
  if (typeof manual === "number" && Number.isFinite(manual)) {
    return { pct: Math.max(0, Math.min(100, Math.round(manual))), manual: true, motivos: ["definida à mão"] };
  }

  let pct = CHANCE_BASE;
  const motivos: string[] = [`ponto de partida ${CHANCE_BASE}%`];
  const mexer = (pontos: number, motivo: string) => {
    pct += pontos;
    motivos.push(`${pontos > 0 ? "+" : ""}${pontos}: ${motivo}`);
  };

  const respondeuRecente = s.respondeuAposProposta && s.diasSemRespostaDoLead !== null && s.diasSemRespostaDoLead <= 3;
  if (respondeuRecente) mexer(6, "respondeu nos últimos 3 dias");
  if (s.mensagensDoLead >= 10) mexer(4, "conversa longa (10+ mensagens dele)");
  if (temTag(s.tags, "perguntou-preco")) mexer(3, "pediu o valor");
  const objecoes = s.tags.filter((t) => /^obje[çc][ãa]o/i.test(t));
  if (objecoes.some((t) => !/vou pensar/i.test(t))) mexer(2, "levantou objeção (sinal de interesse)");
  if (objecoes.some((t) => /vou pensar/i.test(t))) mexer(-3, "disse que ia pensar (adiamento, não interesse)");
  if (temTag(s.tags, "reuniao-realizada", "call-realizada")) mexer(3, "já fez a reunião de vendas");

  if (temTag(s.tags, "no-show")) mexer(-2, "faltou a uma reunião");
  if (!s.respondeuAposProposta && s.toquesSemResposta >= 3) mexer(-3, "3+ toques sem nenhuma resposta");
  if (s.diasSemRespostaDoLead !== null && s.diasSemRespostaDoLead > 30) mexer(-6, "mais de 30 dias sem falar");
  else if (s.diasSemRespostaDoLead !== null && s.diasSemRespostaDoLead > 10) mexer(-4, "mais de 10 dias sem falar");
  if (s.diasDesdeVencimento !== null && s.diasDesdeVencimento > 3) mexer(-2, "proposta vencida há mais de 3 dias");
  if (temTag(s.tags, "fora_escopo", "passagem_humano", "nao-qualificado")) mexer(-5, "fora do perfil ou sem qualificação");
  if (temTag(s.tags, "defletiu", "sem-condicoes-agora")) mexer(-3, "disse que não tem condições agora");

  const final = Math.max(CHANCE_MINIMA, Math.min(CHANCE_MAXIMA, Math.round(pct)));
  return { pct: final, manual: false, motivos };
}
