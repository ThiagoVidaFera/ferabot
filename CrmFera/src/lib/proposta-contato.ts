import { db } from "@/lib/db";
import { auditar } from "@/lib/audit";
import { registrarEvento } from "@/lib/timeline";
import { normalizarTelefone, variantesTelefone } from "@/lib/telefone";
import { linksDePropostaEm } from "@/lib/links-proposta";
import { negocio, type OfertaNegocio } from "@/lib/negocio";

/**
 * Oferta de cada proposta, guardada no contato (05/11/2026).
 *
 * O agente de follow-up precisa saber QUAL proposta o lead recebeu (entregas e garantia
 * daquela oferta, não da padrão). A skill de proposta registra a oferta aqui ao enviar a
 * proposta (POST /api/contatos/proposta), e o follow-up lê `customFields.proposta`.
 *
 * Fica em `Contact.customFields` (JSON): não precisa de migração. Só atualiza
 * contato que já existe, como o `gravar-instagram`.
 */

export type PropostaGuardada = {
  /** chave do catálogo: o slug da oferta no negocio.json (ou `padrao` = a primeira) */
  ofertaBase: string;
  /** página da proposta enviada ao lead */
  link: string;
  enviadaEm: string;
  /** entregas desta proposta, quando diferentes das do catálogo (ex.: proposta personalizada) */
  entregas?: string[];
};

export type OfertaDoCatalogo = {
  /** entregas em frase curta, prontas para entrar numa frase corrida */
  entregas: string[];
  /** como a garantia é dita; null = a oferta NÃO tem garantia (nunca citar) */
  garantia: string | null;
  /** o vídeo-resumo genérico descreve esta oferta e esta garantia? */
  videoResumo: boolean;
};

/**
 * Catálogo de ofertas de proposta, montado das ofertas do `negocio.json`. A chave é o `slug` da
 * oferta; `padrao` é sempre a primeira oferta (o que a skill de proposta grava quando não diz qual).
 */
function catalogoDoNegocio(): Record<string, OfertaDoCatalogo> {
  const lista = negocio().ofertas;
  const de = (o: OfertaNegocio): OfertaDoCatalogo => ({
    entregas: o.entregas,
    garantia: o.garantiaCurta || o.garantia || null,
    videoResumo: false,
  });
  const mapa: Record<string, OfertaDoCatalogo> = Object.fromEntries(lista.map((o) => [o.slug, de(o)]));
  if (lista[0]) mapa.padrao = de(lista[0]);
  return mapa;
}

const CATALOGO: Readonly<Record<string, OfertaDoCatalogo>> = catalogoDoNegocio();

/**
 * Páginas de OFERTA que valem como link da proposta quando o lead não ganhou página própria:
 * os links das ofertas do negocio.json.
 */
function ehPaginaDeOferta(link: string): boolean {
  return negocio().ofertas.some((o) => o.link && (link === o.link || link.startsWith(o.link.replace(/\/+$/, "") + "/")));
}

/** Link aceito no registro: página de proposta ou página de uma oferta do catálogo. */
export function linkDaProposta(bruto: unknown): string | undefined {
  if (typeof bruto !== "string") return undefined;
  const proposta = linksDePropostaEm([bruto])[0];
  if (proposta) return proposta;
  const limpo = bruto.trim();
  return /^https:\/\//i.test(limpo) && ehPaginaDeOferta(limpo) ? limpo : undefined;
}

export const OFERTAS_CONHECIDAS: readonly string[] = Object.keys(CATALOGO);

export type PrecoDaOferta = {
  /** preço total, em centavos */
  totalCentavos: number;
  /** parcela mensal quando a oferta tem parcelamento definido; null = não definido */
  parcelaCentavos: number | null;
};

/** "R$ 7.500" -> 750000 centavos; "R$ 206,26" -> 20626. null quando não há valor. */
export function centavosDe(frase: string): number | null {
  const m = frase.match(/R\$\s*([\d.]+)(?:,(\d{2}))?/i);
  if (!m) return null;
  return Number(m[1].replace(/\./g, "")) * 100 + Number(m[2] ?? 0);
}

/** Preço de cada oferta (painel de propostas e sequência pós-proposta), lido das frases de preço. */
function precosDoNegocio(): Record<string, PrecoDaOferta> {
  const lista = negocio().ofertas;
  const de = (o: OfertaNegocio): PrecoDaOferta | null => {
    const total = centavosDe(o.precoAVista || o.comoFalar);
    if (total === null) return null;
    // parcela só quando o parcelamento diz "Nx de R$ Y" e é por mês de verdade
    const parcela = /\d+\s*x\s+de\s+R\$/i.test(o.parcelamento) ? centavosDe(o.parcelamento.replace(/^.*?x\s+de\s+/i, "")) : null;
    return { totalCentavos: total, parcelaCentavos: parcela };
  };
  const mapa: Record<string, PrecoDaOferta> = {};
  for (const o of lista) {
    const p = de(o);
    if (p) mapa[o.slug] = p;
  }
  if (lista[0] && mapa[lista[0].slug]) mapa.padrao = mapa[lista[0].slug];
  return mapa;
}

const PRECOS: Readonly<Record<string, PrecoDaOferta>> = precosDoNegocio();

export function precoDaProposta(ofertaBase: string): PrecoDaOferta | null {
  return PRECOS[ofertaBase] ?? null;
}

export function lerProposta(campos: unknown): PropostaGuardada | null {
  const p = (campos as Record<string, unknown> | null)?.proposta;
  if (!p || typeof p !== "object") return null;
  const r = p as Partial<PropostaGuardada>;
  return typeof r.ofertaBase === "string" && typeof r.link === "string" && typeof r.enviadaEm === "string"
    ? (r as PropostaGuardada)
    : null;
}

/** A oferta do catálogo + as entregas próprias da proposta, se houver. Null se não souber. */
export function ofertaDaProposta(p: PropostaGuardada | null): OfertaDoCatalogo | null {
  const base = p ? CATALOGO[p.ofertaBase] : undefined;
  if (!p || !base) return null;
  return p.entregas?.length ? { ...base, entregas: p.entregas } : base;
}

export type EntradaProposta = { ofertaBase?: unknown; link?: unknown; entregas?: unknown };

export type ResultadoProposta =
  | { ok: true; id: string; ofertaBase: string }
  | { ok: false; status: 404 | 422; erro: string };

export async function gravarProposta(
  telefone: unknown,
  entrada: EntradaProposta,
  fonte: string,
  agora = new Date(),
): Promise<ResultadoProposta> {
  const ofertaBase = typeof entrada.ofertaBase === "string" ? entrada.ofertaBase : "";
  if (!CATALOGO[ofertaBase]) return { ok: false, status: 422, erro: `oferta desconhecida: ${ofertaBase}` };

  const link = linkDaProposta(entrada.link);
  if (!link) return { ok: false, status: 422, erro: "link de proposta invalido" };

  const entregas = Array.isArray(entrada.entregas)
    ? entrada.entregas.filter((e): e is string => typeof e === "string" && e.trim() !== "").map((e) => e.trim())
    : [];

  const phone = normalizarTelefone(typeof telefone === "string" ? telefone : null);
  if (!phone) return { ok: false, status: 422, erro: "telefone invalido" };

  const contato = await db.contact.findFirst({ where: { phone: { in: variantesTelefone(phone) } } });
  if (!contato) return { ok: false, status: 404, erro: "contato nao encontrado" };

  const campos =
    contato.customFields && typeof contato.customFields === "object"
      ? (contato.customFields as Record<string, unknown>)
      : {};
  const proposta: PropostaGuardada = {
    ofertaBase,
    link,
    enviadaEm: agora.toISOString(),
    ...(entregas.length ? { entregas } : {}),
  };
  await db.contact.update({
    where: { id: contato.id },
    data: { customFields: { ...campos, proposta } as never },
  });
  await registrarEvento({
    contactId: contato.id,
    eventType: "note",
    channel: "sistema",
    metadata: { texto: `Proposta registrada (${fonte}): oferta ${ofertaBase} · ${link}`, proposta },
  });
  await auditar(`api:${fonte}`, "proposta_gravada", `${contato.name} · ${ofertaBase}`);
  return { ok: true, id: contato.id, ofertaBase };
}
