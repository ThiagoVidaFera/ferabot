import { db } from "@/lib/db";
import { registrarEvento } from "@/lib/timeline";
import { negocio } from "@/lib/negocio";

/**
 * A gramatica das tags (playbook dos agentes, 2026-08-22).
 *
 * Tag e MEMORIA: acumula, nunca some. Estagio e POSICAO: um por vez.
 * Convencao: `o-que-aconteceu-[produto]` (permanente) e `acao-evento-c[NN]`
 * (ciclo, nunca reaproveitada). `controle-*` trava agente e regua e vence
 * qualquer outra. Uma tag por porta, um agente por tag — duas portas com a
 * mesma tag = dois agentes disputando a mesma pessoa.
 */

/**
 * Slug curto de cada produto — e o sufixo das tags de produto. CONTRATO ESTAVEL: o produto
 * principal (a primeira oferta do negocio.json) e sempre `principal` nas tags
 * (`interesse-principal`, `quente-principal`, `checkout-abandonado-principal`, `comprou-principal`),
 * qualquer que seja o slug da oferta. O produto de entrada e `entrada`.
 */
export const PRODUTOS = {
  principal: { slug: "principal", nome: negocio().ofertas[0]?.nome ?? "Produto principal" },
  entrada: { slug: "entrada", nome: negocio().entrada.nome || "Produto de entrada" },
} as const;

export type ProdutoSlug = keyof typeof PRODUTOS;

/** `humano` e a tag legada de "gente assumiu"; as `controle-*` sao do playbook. */
export const TAGS_CONTROLE = [
  "humano",
  "controle-optout",
  "controle-suporte-humano",
  "controle-nao-perturbe",
  "optout",
];

export function ehControle(tag: string): boolean {
  return TAGS_CONTROLE.includes(tag) || tag.startsWith("controle-");
}

export function temControle(tags: string[]): boolean {
  return tags.some(ehControle);
}

export const tagInteresse = (p: ProdutoSlug) => `interesse-${p}`;
export const tagCheckoutAbandonado = (p: ProdutoSlug) => `checkout-abandonado-${p}`;
export const tagQuente = (p: ProdutoSlug) => `quente-${p}`;
export const tagComprou = (p: string) => `comprou-${p}`;
export const tagInscritoEvento = (ciclo: string) => `inscrito-evento-c${ciclo}`;
export const tagAssistiuEvento = (ciclo: string) => `assistiu-evento-c${ciclo}`;

/** Produto de uma tag de produto: "checkout-abandonado-principal" -> "principal". */
export function produtoDaTag(tag: string): string | null {
  const m = tag.match(/^(?:interesse|checkout-abandonado|quente|comprou)-([a-z0-9]+)$/);
  return m ? m[1] : null;
}

/** Normaliza para comparar nomes de produto: minúsculo, sem acento, só letras e números. */
function chaveDeNome(t: string): string {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Nome do produto no checkout -> slug. O webhook de venda manda o nome como esta cadastrado na
 * plataforma. Casa com o nome (ou slug) das ofertas do negocio.json: a primeira oferta vira
 * `principal`, o produto de entrada vira `entrada`. Produto desconhecido vira slug do proprio
 * nome — nunca cai no buraco.
 */
export function produtoSlugDe(nomeProduto: string): string {
  const n = nomeProduto.toLowerCase();
  const chave = chaveDeNome(nomeProduto);
  const neg = negocio();
  const contem = (alvo: string) => {
    const k = chaveDeNome(alvo);
    return k.length >= 3 && (chave.includes(k) || k.includes(chave));
  };
  // ENTRADA antes de tudo: o nome do produto de entrada costuma conter o nome do principal
  if (neg.entrada.slug && (contem(neg.entrada.nome) || contem(neg.entrada.slug))) return PRODUTOS.entrada.slug;
  const [primeira, ...outras] = neg.ofertas;
  if (primeira && (contem(primeira.nome) || contem(primeira.slug))) return PRODUTOS.principal.slug;
  const outra = outras.find((o) => contem(o.nome) || contem(o.slug));
  if (outra) return outra.slug.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30) || "produto";
  return (
    n
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30) || "produto"
  );
}

/** `Contact.tags` e Json (array de string) — ler direto como texto quebra. */
export function tagsDe(bruto: unknown): string[] {
  return Array.isArray(bruto) ? bruto.filter((t): t is string => typeof t === "string") : [];
}

/**
 * Carimba a tag no contato e deixa o evento na linha do tempo (LEI 3). E por
 * esse evento que o seletor sabe qual tag e a mais recente.
 */
export async function adicionarTag(contactId: string, tag: string, por: string) {
  const limpa = tag.trim().toLowerCase();
  if (!limpa) return { adicionada: false };
  const contato = await db.contact.findUnique({ where: { id: contactId }, select: { tags: true } });
  if (!contato) return { adicionada: false };
  const atuais = tagsDe(contato.tags);
  if (atuais.includes(limpa)) return { adicionada: false };
  await db.contact.update({
    where: { id: contactId },
    data: { tags: [...atuais, limpa] as never },
  });
  await registrarEvento({
    contactId,
    eventType: "acao_agente",
    channel: "sistema",
    metadata: { texto: `Tag adicionada: ${limpa}`, tag: limpa, por },
  });
  return { adicionada: true };
}
