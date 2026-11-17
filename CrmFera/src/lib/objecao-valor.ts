/**
 * OBJEÇÃO DE VALOR FURA O `humano`, só para oferecer o PRODUTO DE ENTRADA.
 *
 * A tag `humano` cala todos os agentes. Se a ÚLTIMA fala do lead é objeção de valor (ou a resposta
 * "2" das opções da régua) e o negócio tem um produto de entrada (negocio.json, `entrada`), o agente
 * pode entrar só para oferecer esse produto, uma vez, mesmo com `humano`. Sem produto de entrada
 * configurado, nada fura: quem responde é o dono.
 *
 * O que NÃO fura: `controle-*`, `optout`, cliente/perdido/sem automação, compra e reunião futura.
 *
 * Único import: ofertas.ts (puro, sem db/ia/next), para rodar nos testes unitários.
 */
import { PRODUTO_DE_ENTRADA } from "./ofertas";

/** "travei no valor", "muita grana", "tá caro", "não cabe", "só em janeiro"… */
const OBJECAO_DE_VALOR: readonly RegExp[] = [
  /\btravei\s+(?:n[oa]|com\s+o)\s+(?:valor|pre[çc]o|investimento)/i,
  /\bmuita\s+(?:grana|dinheiro)\b/i,
  /(?:^|\s)(?:t[áa]|[ée]|ficou|fica|est[áa])\s+(?:muito\s+|bem\s+|meio\s+|um\s+pouco\s+)?caro\b/i,
  /\bcaro\s+(?:demais|pra\s+mim|para\s+mim)\b/i,
  /\bn[ãa]o\s+(?:tenho|consigo|cabe|d[áa])\b[^.!?\n]{0,40}\b(?:grana|dinheiro|valor|investir|investimento|pagar|no\s+or[çc]amento)/i,
  /\b(?:valor|pre[çc]o|investimento)\b[^.!?\n]{0,30}\b(?:alto|pesado|puxado|n[ãa]o\s+cabe|fora\s+da\s+(?:minha\s+)?realidade)/i,
  /\b(?:t[áa]|est[áa]|ficou)\s+(?:pesado|puxado|apertado)\b/i,
  /(?:^|\s)[ée]\s+s[óo]\s+o\s+financeiro\b/i,
  /\b(?:invi[áa]vel|fora\s+do\s+(?:meu\s+)?or[çc]amento|n[ãa]o\s+cabe\s+no\s+(?:meu\s+)?bolso)\b/i,
  /\bs[óo]\s+em\s+(?:janeiro|fevereiro|mar[çc]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/i,
];

/** "2", "2.", "2️⃣", "opção 2", "2 - travei…" — sem o resto do texto ser outra coisa. */
const RESPOSTA_DOIS = /^\s*(?:op[çc][ãa]o\s*)?2(?:️?⃣)?\s*(?:[-–—.):]|$)/i;

/** Nossa última fala trazia as opções 1/2/3 da régua (a "2" só vale como resposta a elas). */
const TEM_OPCOES = /1️?⃣[\s\S]*2️?⃣[\s\S]*3️?⃣/;

function escaparRegex(t: string): string {
  return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** O produto de entrada já foi oferecido nesta conversa (por robô ou por gente)? */
function entradaNaConversa(texto: string): boolean {
  const nome = PRODUTO_DE_ENTRADA.nome.trim();
  const link = PRODUTO_DE_ENTRADA.link.trim();
  return (!!nome && new RegExp(escaparRegex(nome), "i").test(texto)) || (!!link && texto.includes(link));
}

export function ehObjecaoDeValor(texto: string | null | undefined): boolean {
  const t = String(texto ?? "").trim();
  if (!t || t.length > 600) return false;
  return OBJECAO_DE_VALOR.some((p) => p.test(t));
}

/** "2" respondendo às opções 1/2/3 da nossa última mensagem ("Travei em algo"). */
export function ehRespostaDois(texto: string | null | undefined, nossaUltima: string | null | undefined): boolean {
  const t = String(texto ?? "").trim();
  if (!t || t.length > 600) return false;
  return RESPOSTA_DOIS.test(t) && TEM_OPCOES.test(String(nossaUltima ?? ""));
}

export function entradaJaOferecida(enviadas: readonly string[]): boolean {
  return enviadas.some((b) => entradaNaConversa(b));
}

export type EntradaDaExcecao = {
  ultimaDoLead: string | null | undefined;
  nossaUltima: string | null | undefined;
  /** textos de TODAS as mensagens que nós enviamos (robô ou gente) */
  enviadas: readonly string[];
  /** a última mensagem da conversa é do lead? (objeção antiga não reabre o robô) */
  ultimaEhDoLead: boolean;
};

/** O `humano` deve ser ignorado para esta fala? Só para oferecer o produto de entrada, uma vez. */
export function furaHumano(e: EntradaDaExcecao): boolean {
  if (!PRODUTO_DE_ENTRADA.disponivel) return false;
  if (!e.ultimaEhDoLead) return false;
  if (entradaJaOferecida(e.enviadas)) return false;
  return ehObjecaoDeValor(e.ultimaDoLead) || ehRespostaDois(e.ultimaDoLead, e.nossaUltima);
}

/** Instrução em "SITUAÇÃO AGORA" quando a exceção abriu a conversa. */
export function instrucaoDaObjecao(respostaDois: boolean): string {
  return [
    "ATENÇÃO: esta conversa estava com a tag `humano`, mas o lead acabou de dizer que travou no valor" +
      (respostaDois ? " (respondeu \"2 – travei\" às opções da régua)" : "") +
      ". Você entra SÓ pra isso.",
    `Reconheça em 1 frase o que ele disse, ofereça UMA vez o produto de entrada, ${PRODUTO_DE_ENTRADA.nome} (${PRODUTO_DE_ENTRADA.preco}), e termine com \"Faz sentido pro seu momento?\".`,
    "Não dê desconto, não prometa nada fora desse produto. Devolva a tag \"oferta-entrada\" e NÃO devolva \"humano\": true por causa dessa oferta.",
    respostaDois
      ? "Se ele respondeu só \"2\" sem dizer o que travou, assuma que é o valor, mas deixe aberto: \"se for outra coisa, me diz em uma linha\"."
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}
