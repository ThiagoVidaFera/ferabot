import { primeiroNome } from "@/lib/telefone";
import { negocio } from "@/lib/negocio";

/**
 * Oferta da ESTAÇÃO do lembrete D+3 da proposta (Black Friday, Natal, etc.).
 *
 * No CRM FERA a lista nasce VAZIA: condição especial só existe quando o dono decide e escreve. Sem
 * janela vigente, `ofertaVigente` devolve null e o D+3 não sai (nunca texto inventado). Para criar
 * uma janela, acrescente um item em `OFERTAS` com datas, abertura e a condição real, e um teste.
 *
 * Valor e link de pagamento só para quem PERGUNTOU PREÇO: `textoSemPreco` é a versão padrão, sem R$
 * e sem checkout; `texto` só sai com `perguntouPreco`.
 */

/** Página da oferta principal (nunca o checkout cru). */
export const LINK_CHECKOUT_CONSULTORIA = negocio().ofertas[0]?.link ?? "";

export type OfertaSazonal = {
  id: string;
  /** vale a partir deste instante */
  desde: Date;
  /** vale enquanto o instante for anterior ou igual a este */
  ate: Date;
  /** texto com valor e link (só para quem perguntou preço); `nome` já vem do primeiro nome ("" = sem vocativo) */
  texto: (nome: string) => string;
  /** a mesma condição sem valor e sem link: é o que vai para quem não perguntou preço */
  textoSemPreco: (nome: string) => string;
};

export const OFERTAS: readonly OfertaSazonal[] = [];

export function ofertaVigente(agora: Date, ofertas: readonly OfertaSazonal[] = OFERTAS): OfertaSazonal | null {
  const t = agora.getTime();
  return ofertas.find((o) => t >= o.desde.getTime() && t <= o.ate.getTime()) ?? null;
}

/**
 * Texto do lembrete da estação, ou null se não há oferta vigente neste instante.
 * Sem `perguntouPreco` sai a versão sem valor e sem link de pagamento.
 */
export function textoLembreteD3(
  nomeCompleto: string | null | undefined,
  agora: Date,
  ofertas: readonly OfertaSazonal[] = OFERTAS,
  perguntouPreco = false,
): string | null {
  const oferta = ofertaVigente(agora, ofertas);
  if (!oferta) return null;
  const nome = nomeParaVocativo(nomeCompleto);
  return perguntouPreco ? oferta.texto(nome) : oferta.textoSemPreco(nome);
}

/** Primeiro nome só se parecer nome de gente (título, marca, dígito ou token curto ficam sem vocativo). */
export function nomeParaVocativo(nomeCompleto: string | null | undefined): string {
  const limpo = (nomeCompleto ?? "").normalize("NFKC").split(/[|/·–—]/)[0];
  const tokens = limpo.trim().split(/\s+/);
  const titulos = new Set(["professor", "prof", "prof.", "dr", "dr.", "dra", "dra.", "coach", "mentor", "mentora"]);
  while (tokens.length > 1 && titulos.has(tokens[0].toLowerCase())) tokens.shift();
  const nome = primeiroNome(tokens.join(" "));
  if ([...nome].length < 3 || /\d/.test(nome)) return "";
  return nome;
}
