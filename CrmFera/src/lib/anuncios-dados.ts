import { config } from "@/lib/config";
import { db } from "@/lib/db";
import type { ContatoDeAnuncio, InsightAnuncio } from "@/lib/anuncios";

const GRAPH = "https://graph.facebook.com/v21.0";
const MAX_PAGINAS = 10;
const TIMEOUT_MS = 20000;

export interface InsightsResultado {
  insights: InsightAnuncio[];
  /** null = deu certo; texto = por que a Graph não entregou (aparece na tela). */
  aviso: string | null;
}

interface LinhaGraph {
  ad_id?: string;
  ad_name?: string;
  campaign_name?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
}

interface RespostaGraph {
  data?: LinhaGraph[];
  paging?: { next?: string };
  error?: { message?: string };
}

function dia(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

async function buscarJson(url: string): Promise<RespostaGraph> {
  const r = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  return (await r.json()) as RespostaGraph;
}

/** Gasto por anúncio no período, direto da Graph. Nunca levanta: devolve aviso. */
export async function insightsDosAnuncios(de: Date, ate: Date): Promise<InsightsResultado> {
  const token = await config("meta_ads_token", "META_ADS_TOKEN");
  const conta = (await config("meta_ads_account", "META_ADS_ACCOUNT")).replace(/^act_/, "");
  if (!token || !conta) {
    return { insights: [], aviso: "Token ou conta do Meta Ads não configurados: sem gasto por anúncio." };
  }

  const ultimoDia = new Date(ate.getTime() - 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    level: "ad",
    fields: "ad_id,ad_name,campaign_name,spend,impressions,clicks",
    time_range: JSON.stringify({ since: dia(de), until: dia(ultimoDia) }),
    limit: "200",
    access_token: token,
  });

  try {
    const linhas: LinhaGraph[] = [];
    let url: string | undefined = `${GRAPH}/act_${conta}/insights?${params.toString()}`;
    for (let i = 0; url && i < MAX_PAGINAS; i++) {
      const pagina: RespostaGraph = await buscarJson(url);
      if (pagina.error) {
        return { insights: [], aviso: `Meta recusou: ${String(pagina.error.message).slice(0, 140)}` };
      }
      linhas.push(...(pagina.data ?? []));
      url = pagina.paging?.next;
    }
    const insights = linhas
      .filter((l) => l.ad_id)
      .map(
        (l): InsightAnuncio => ({
          adId: String(l.ad_id),
          nome: l.ad_name ?? `ID ${l.ad_id}`,
          campanha: l.campaign_name ?? "—",
          gastoCents: Math.round(parseFloat(l.spend ?? "0") * 100),
          impressoes: parseInt(l.impressions ?? "0", 10),
          cliques: parseInt(l.clicks ?? "0", 10),
        }),
      );
    return { insights, aviso: null };
  } catch (e) {
    return { insights: [], aviso: `Não consegui falar com o Meta: ${e instanceof Error ? e.message : "erro"}` };
  }
}

export interface VendaPorDia {
  dia: string;
  receitaCents: number;
  vendas: number;
}

export interface DadosCrmAnuncios {
  contatos: ContatoDeAnuncio[];
  vendasPorDia: VendaPorDia[];
  vendasPorOrigem: { origem: string; vendas: number; receitaCents: number }[];
  totalVendas: number;
  totalReceitaCents: number;
}

function camposDe(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === "object" ? (valor as Record<string, unknown>) : {};
}

/** Leads e vendas do CRM no período, com o anúncio de origem quando existe. */
export async function dadosCrmDosAnuncios(de: Date, ate: Date): Promise<DadosCrmAnuncios> {
  const janela = { gte: de, lt: ate };
  const compras = await db.purchase.findMany({
    where: { createdAt: janela },
    select: { valueCents: true, origem: true, createdAt: true, contactId: true },
  });

  // customFields é JSON em texto no SQLite: filtrar por dentro dele é por LIKE.
  const comAnuncio = await db.$queryRaw<{ id: string }[]>`
    SELECT id FROM Contact
    WHERE customFields LIKE '%"ctwa_ad_id"%' OR customFields LIKE '%"utm_content"%' OR customFields LIKE '%"anuncio"%'`;
  const idsComAnuncio = new Set(comAnuncio.map((c) => c.id));

  const contatosDoPeriodo = await db.contact.findMany({
    where: {
      id: { in: [...idsComAnuncio] },
      OR: [{ createdAt: janela }, { id: { in: compras.map((c) => c.contactId) } }],
    },
    select: { id: true, createdAt: true, customFields: true },
  });

  const comprasPorContato = new Map<string, { valueCents: number }[]>();
  for (const c of compras) {
    comprasPorContato.set(c.contactId, [...(comprasPorContato.get(c.contactId) ?? []), { valueCents: c.valueCents }]);
  }

  const contatos = contatosDoPeriodo.map((c): ContatoDeAnuncio => {
    const campos = camposDe(c.customFields);
    return {
      adId: String(campos.ctwa_ad_id ?? ""),
      anuncio: String(campos.anuncio ?? campos.utm_content ?? ""),
      leads: c.createdAt >= de && c.createdAt < ate ? 1 : 0,
      compras: comprasPorContato.get(c.id) ?? [],
    };
  });

  const porDia = new Map<string, VendaPorDia>();
  const porOrigem = new Map<string, { origem: string; vendas: number; receitaCents: number }>();
  for (const c of compras) {
    const d = dia(c.createdAt);
    const a = porDia.get(d) ?? { dia: d, receitaCents: 0, vendas: 0 };
    porDia.set(d, { dia: d, receitaCents: a.receitaCents + c.valueCents, vendas: a.vendas + 1 });
    const o = c.origem ?? "outro";
    const b = porOrigem.get(o) ?? { origem: o, vendas: 0, receitaCents: 0 };
    porOrigem.set(o, { origem: o, vendas: b.vendas + 1, receitaCents: b.receitaCents + c.valueCents });
  }

  return {
    contatos,
    vendasPorDia: [...porDia.values()].sort((a, b) => a.dia.localeCompare(b.dia)),
    vendasPorOrigem: [...porOrigem.values()].sort((a, b) => b.receitaCents - a.receitaCents),
    totalVendas: compras.length,
    totalReceitaCents: compras.reduce((s, c) => s + c.valueCents, 0),
  };
}

/** Pausa o anúncio na Meta. Exige permissão de gerenciar anúncios no token. */
export async function pausarAnuncioNaMeta(adId: string): Promise<{ ok: boolean; erro?: string }> {
  if (!/^[0-9]{6,}$/.test(adId)) return { ok: false, erro: "ID de anúncio inválido" };
  const token = await config("meta_ads_token", "META_ADS_TOKEN");
  if (!token) return { ok: false, erro: "Token do Meta Ads não configurado" };
  try {
    const r = await fetch(`${GRAPH}/${adId}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ status: "PAUSED", access_token: token }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const j = (await r.json()) as { success?: boolean; error?: { message?: string } };
    if (j.success) return { ok: true };
    return { ok: false, erro: String(j.error?.message ?? "Meta não confirmou").slice(0, 160) };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : "erro" };
  }
}

const LOTE_STATUS = 50;

/**
 * IDs dos anúncios que estão rodando agora (effective_status ACTIVE).
 * Falhou ou sem token: devolve conjunto vazio, e a tela não sugere nada
 * (melhor calar do que mandar pausar o que não se sabe se roda).
 */
export async function anunciosAtivos(adIds: ReadonlyArray<string>): Promise<Set<string>> {
  const ids = adIds.filter((i) => /^[0-9]{6,}$/.test(i));
  const token = await config("meta_ads_token", "META_ADS_TOKEN");
  if (!ids.length || !token) return new Set();

  const ativos = new Set<string>();
  try {
    for (let i = 0; i < ids.length; i += LOTE_STATUS) {
      const params = new URLSearchParams({
        ids: ids.slice(i, i + LOTE_STATUS).join(","),
        fields: "effective_status",
        access_token: token,
      });
      const r = await fetch(`${GRAPH}/?${params.toString()}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      const j = (await r.json()) as Record<string, unknown>;
      if (j.error) return new Set();
      for (const [id, v] of Object.entries(j)) {
        if ((v as { effective_status?: string } | null)?.effective_status === "ACTIVE") ativos.add(id);
      }
    }
  } catch {
    return new Set();
  }
  return ativos;
}
