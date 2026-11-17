/**
 * Tabela de ofertas AUTORIZADA: a fonte única de preço, link, condição, garantia e bônus.
 * O agente lê daqui pelas variáveis `{{oferta.<slug>.preco}}` (prompt-vars.ts) e `guardas.ts`
 * valida a saída contra a MESMA tabela. A IA nunca inventa valor nem URL: se citar algo que não
 * está aqui, a mensagem é barrada.
 *
 * Os dados vêm de `negocio.json` (negocio.ts). Mudou preço ou link? Muda lá, reinicia o CRM.
 *
 * Este arquivo NÃO importa nada do app (db/ia/next): o seed roda via tsx.
 */
import { negocio, type OfertaNegocio } from "./negocio";

export type Oferta = OfertaNegocio & {
  key: string;
  /** só dígitos, sem centavos: usado pelo guarda. 206,26 -> "206" */
  precoDigitos: string[];
  bonusAncora: string;
};

function digitosDe(valor: string): string {
  return valor
    .replace(/^r\$\s*/i, "")
    .trim()
    .replace(/,\d{2}$/, "")
    .replace(/\D/g, "");
}

/** Todos os valores em R$ de uma frase ("R$ 2.000 à vista ou 10x de R$ 230" -> ["2000","230"]). */
function valoresEm(frase: string): string[] {
  return (frase.match(/R\$\s*[\d.,]+/gi) ?? []).map(digitosDe).filter(Boolean);
}

function montar(o: OfertaNegocio): Oferta {
  const somaBonus = o.bonus.reduce((s, b) => s + Number(digitosDe(b.valor) || 0), 0);
  return {
    ...o,
    key: o.slug,
    precoDigitos: Array.from(new Set([...valoresEm(o.comoFalar), ...valoresEm(o.precoAVista), ...valoresEm(o.parcelamento)])),
    bonusAncora: somaBonus ? `R$ ${somaBonus.toLocaleString("pt-BR")} em bônus` : "",
  };
}

export const OFERTAS: Oferta[] = negocio().ofertas.map(montar);

/** Critério de verba de anúncio que o agente cita ao qualificar (opcional). */
export const VERBA_ANUNCIO = {
  comoFalar: "um valor por dia em anúncio, pago direto na conta de anúncios",
  prazo: "os primeiros meses, que é o tempo de testar e ver o que paga a conta",
  comR$: "o valor de anúncio que você combinar",
} as const;

const entrada = negocio().entrada;

/** Produto de ENTRADA (o degrau antes do principal). Só liga com slug, preço e link preenchidos. */
export const PRODUTO_DE_ENTRADA = {
  disponivel: Boolean(entrada.slug && entrada.preco && entrada.link),
  slug: entrada.slug || "entrada",
  nome: entrada.nome,
  preco: entrada.preco,
  precoDigitos: valoresEm(entrada.preco),
  link: entrada.link,
  garantia: entrada.garantia,
};

/** Link do suporte humano (pagamento, acesso, reembolso, erro técnico). */
export const SUPORTE_HUMANO = {
  numero: negocio().dono.whatsapp,
  link: negocio().links.suporte || `https://wa.me/${negocio().dono.whatsapp}`,
};

export function oferta(key: string): Oferta | undefined {
  return OFERTAS.find((o) => o.key === key);
}

export function ofertaPorSlug(slug: string): Oferta | undefined {
  return OFERTAS.find((o) => o.slug === slug);
}

/** Valores que o agente precisa dizer e que não são preço de oferta (faixas da qualificação). */
export const VALORES_DE_QUALIFICACAO: string[] = negocio().valoresDeQualificacao.map(digitosDe).filter(Boolean);

/** Tudo que o agente pode citar sem ser barrado pelo guarda. */
export function autorizadoGeral(): { links: string[]; precos: string[] } {
  const n = negocio();
  const precosBonus = OFERTAS.flatMap((o) => o.bonus.map((b) => digitosDe(b.valor)));
  const precosEntrega = OFERTAS.flatMap((o) => o.entregas.flatMap(valoresEm));
  const somaBonus = OFERTAS.map((o) => String(o.bonus.reduce((s, b) => s + Number(digitosDe(b.valor) || 0), 0))).filter(
    (v) => v !== "0",
  );
  const linksNegocio = Object.values(n.links).filter(Boolean);
  return {
    // o checkout cru NÃO entra: só a página que vende
    links: Array.from(
      new Set([
        ...OFERTAS.map((o) => o.link),
        ...(PRODUTO_DE_ENTRADA.disponivel ? [PRODUTO_DE_ENTRADA.link] : []),
        ...linksNegocio,
        `https://wa.me/${n.dono.whatsapp}`,
      ].filter(Boolean)),
    ),
    precos: Array.from(
      new Set(
        [
          ...OFERTAS.flatMap((o) => o.precoDigitos),
          ...(PRODUTO_DE_ENTRADA.disponivel ? PRODUTO_DE_ENTRADA.precoDigitos : []),
          ...VALORES_DE_QUALIFICACAO,
          ...precosBonus,
          ...precosEntrega,
          ...somaBonus,
        ].filter(Boolean),
      ),
    ),
  };
}
