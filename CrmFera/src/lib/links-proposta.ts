import { negocio } from "./negocio";

/**
 * Links de PROPOSTA já enviados na conversa.
 *
 * O guarda do agente só deixa passar link da whitelist (`autorizadoGeral`). A página de proposta é
 * gerada por lead e nunca está nela, então o follow-up que manda copiar o link da conversa seria
 * barrado. Aqui só entra o que NÓS já mandamos àquele lead e só se for link de proposta: o host
 * começa com "proposta", o caminho tem "/proposta", ou o link mora sob o `links.proposta` do
 * negocio.json. O checkout continua de fora.
 */

const URL = /https?:\/\/[^\s)\]]+/gi;

function ehLinkDeProposta(link: string, base: string): boolean {
  try {
    const u = new globalThis.URL(link);
    if (base && link.startsWith(base)) return true;
    return u.hostname.toLowerCase().startsWith("proposta") || /\/proposta/i.test(u.pathname);
  } catch {
    return false;
  }
}

/** Extrai, sem repetir, os links de proposta de uma lista de textos enviados. */
export function linksDePropostaEm(textos: string[]): string[] {
  const base = negocio().links.proposta.replace(/\/+$/, "");
  const achados = new Set<string>();
  for (const t of textos) {
    for (const m of t.match(URL) ?? []) {
      const limpo = m.replace(/[.,;:!?]+$/, "");
      if (ehLinkDeProposta(limpo, base)) achados.add(limpo);
    }
  }
  return Array.from(achados);
}
