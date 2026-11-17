import { negocio } from "./negocio";

/**
 * REGRA DA PRIMEIRA MENSAGEM DOS ROBÔS: toda primeira mensagem de robô (1) diz com clareza em que
 * PÁGINA o lead se cadastrou, (2) apresenta o trabalho em uma frase e (3) só então faz a pergunta
 * inicial. Parte pura (sem banco, sem rede): os emissores de texto fixo e o prompt dos agentes de
 * IA importam daqui, para a regra morar num lugar só.
 */

/** Mantido por compatibilidade: o CRM FERA tem uma marca só, a do negocio.json. */
export type Marca = string;

const PREFIXO_MATERIAL = "funil:material-";

function humanizar(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

/**
 * Nome da página em que o lead se cadastrou; `null` quando a origem não é uma página (anúncio,
 * WhatsApp, base). `funil:agendamento` vira "página Agendamento"; `funil:material-x`, a página dos
 * materiais gratuitos.
 */
export function paginaDeCadastro(origem: string | null | undefined): string | null {
  const o = (origem ?? "").toLowerCase();
  if (o.startsWith(PREFIXO_MATERIAL)) return `página dos materiais gratuitos de ${negocio().dono.primeiroNome}`;
  if (o.startsWith("funil:") && o.length > "funil:".length) return `página ${humanizar(o.slice("funil:".length))}`;
  return null;
}

/** Qual voz de marca apresenta o trabalho neste funil (uma só no CRM FERA). */
export function marcaDoFunil(_origem: string | null | undefined): Marca {
  return "padrao";
}

export type Voz = "primeira" | "terceira";

/** Apresentação do trabalho em uma frase (sem preço e sem link), a partir do negocio.json. */
export function apresentacaoDoTrabalho(_marca: Marca = "padrao", voz: Voz = "terceira"): string {
  const n = negocio();
  const promessa = n.promessa.replace(/[.!]+$/, "");
  return voz === "terceira" ? `O trabalho de ${n.dono.primeiroNome} é este: ${promessa}.` : `O nosso trabalho é este: ${promessa}.`;
}

/**
 * Combinados da primeira mensagem (texto fixo que antecede a qualificação). O CRM FERA não traz
 * combinados prontos: lista vazia = a primeira mensagem vai direto para a apresentação e a pergunta.
 */
export function combinadosDaAbertura(_voz: Voz = "primeira"): string[] {
  return [];
}

/** Bloco que entra no prompt dos agentes de IA quando eles ainda não falaram com o lead. */
export function regraPrimeiraMensagem(origem: string | null | undefined, voz: Voz = "terceira"): string {
  const pagina = paginaDeCadastro(origem);
  return [
    "REGRA DA PRIMEIRA MENSAGEM (obrigatória, vale mais que qualquer regra de ir direto à pergunta):",
    pagina
      ? `1. Abra com uma linha curta dizendo que a pessoa se cadastrou na ${pagina} (ex.: "vi que você preencheu o formulário na ${pagina}").`
      : "1. Não há página de cadastro conhecida: não invente página. Diga em que contexto a pessoa chegou (anúncio ou mensagem dela) só se o contexto trouxer isso.",
    `2. Em seguida apresente o trabalho em UMA frase, com as suas palavras, a partir disto: "${apresentacaoDoTrabalho("padrao", voz)}"`,
    "3. Só então faça UMA pergunta, a primeira do caso que ainda não foi respondida, com 2 exemplos.",
    "Isto vale só para a primeira fala do robô: nas seguintes, não repita a apresentação.",
  ].join("\n");
}
