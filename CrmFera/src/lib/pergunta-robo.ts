/**
 * O lead está perguntando se fala com robô/IA? (29/10/2026)
 *
 * Regra: nenhum agente responde isso. Em qualquer número, o robô
 * cala, marca `humano` e avisa que o lead precisa de atendimento manual.
 * A checagem é determinística (antes do modelo): não depende do prompt.
 *
 * `\b` do JavaScript não enxerga letra acentuada ("você", "é"), então os
 * limites de palavra aqui são lookarounds Unicode.
 */
const ANTES = "(?<![\\p{L}\\p{N}])";
const DEPOIS = "(?![\\p{L}\\p{N}])";
const ser = `${ANTES}(?:é|e|eh|são|sao|ser)${DEPOIS}`;
const ALVO = `${ANTES}(?:um |uma |o |a )?(?:robôs?|robos?|bot|ia|i\\.a\\.?|inteligência artificial|inteligencia artificial|chat ?gpt|máquina|maquina|automático|automatico|automática|automatica)${DEPOIS}`;
const SUJEITO = `${ANTES}(?:você|voce|vocês|voces|vc|vcs|tu|isso|isso aqui|esse atendimento|essa conversa|ele|ela)${DEPOIS}`;
const PESSOA = `${ANTES}(?:um |uma )?(?:pessoa|humano|gente|alguém|alguem)${DEPOIS}`;

const PADROES: RegExp[] = [
  // "você é robô?", "isso é uma IA?", "vcs são um bot?"
  new RegExp(`${SUJEITO}.{0,25}${ser}.{0,12}${ALVO}`, "iu"),
  // "é robô?", "é IA?", "é um bot?"
  new RegExp(`^\\W*(?:é|e|eh)\\s+${ALVO}\\s*\\?*\\W*$`, "iu"),
  // "tô falando com um robô?", "estou conversando com uma pessoa de verdade?"
  new RegExp(`${ANTES}(?:falando|conversando)${DEPOIS}.{0,15}${ANTES}com${DEPOIS}.{0,8}(?:${ALVO}|${PESSOA}).{0,25}\\?`, "iu"),
  new RegExp(`(?:pessoa|humano|gente|alguém|alguem) de verdade`, "iu"),
  new RegExp(`${ser}\\s+(?:uma\\s+)?(?:pessoa|humano)\\s*\\?`, "iu"),
];

export function perguntaSeERobo(texto: string | null | undefined): boolean {
  const t = String(texto ?? "").trim();
  if (!t || t.length > 300) return false;
  return PADROES.some((p) => p.test(t));
}

/**
 * O lead está pedindo preço, valor, condições ou forma de pagamento? (30/10/2026)
 *
 * Regra para os agentes de venda consultiva: preço e condição o dono avalia caso
 * a caso (muitas vezes faz proposta diferente), então o robô FICA EM SILÊNCIO e
 * espera ele entrar. Exige formato de pergunta/pedido: quem responde "o que vende
 * e por quanto" com "mentoria, valor de 3 mil" não dispara.
 */
const PADROES_PRECO: RegExp[] = [
  new RegExp(`${ANTES}quanto${DEPOIS}\\s+(?:custa|[ée]|fica|sai|cobra|ser[aá]|vai custar|ficaria|pago|investimento)`, "iu"),
  new RegExp(`${ANTES}qual${DEPOIS}\\s+(?:[ée]\\s+)?(?:o\\s+)?(?:pre[çc]o|valor|investimento|custo|condi[çc][õo]es)`, "iu"),
  new RegExp(`(?:condi[çc][õo]es|formas?|op[çc][õo]es)\\s+(?:de\\s+)?pagamento`, "iu"),
  new RegExp(`^\\W*(?:o\\s+)?(?:pre[çc]o|valor|investimento|custo)s?${DEPOIS}`, "iu"),
  new RegExp(`(?:pre[çc]o|valor|investimento|custo|parcel\\p{L}*|desconto|pagamento)[^?]{0,30}\\?`, "iu"),
];

export function perguntaPreco(texto: string | null | undefined): boolean {
  const t = String(texto ?? "").trim();
  if (!t || t.length > 200) return false;
  return PADROES_PRECO.some((p) => p.test(t));
}
