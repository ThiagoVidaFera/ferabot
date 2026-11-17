/**
 * VIGIA DO RASTREAMENTO META (05/11/2026).
 *
 * A CAPI do WhatsApp foi recusada 12 vezes seguidas entre 31/08 e 09/09 e
 * ninguém soube: o erro morria na Auditoria. E 0% dos leads pagos de página
 * chegavam com o clique (`fbc`). Este vigia roda uma vez por dia e só fala
 * quando há problema:
 *   1. recusa da CAPI (WhatsApp ou página) nas últimas 24h;
 *   2. funil com lead pago (utm_source=meta) e menos da metade com clique;
 *   3. campanha em que a Meta e o CRM contam leads com diferença maior que 2×.
 * As regras ficam em `problemasDeRastreio` (pura, testada); a coleta fica embaixo.
 */

export type Recusa = { detalhe: string; em: Date };
export type Cobertura = { origem: string; pagos: number; comClique: number };
export type MetaXCrm = { campanha: string; meta: number; crm: number };
export type DadosRastreio = { recusas: Recusa[]; cobertura: Cobertura[]; metaXcrm: MetaXCrm[] };

const MIN_LEADS = 5;
const COBERTURA_MINIMA = 0.5;
const DIVERGENCIA_MAXIMA = 2;
const HORA_ENVIO = 9;
const DIA_MS = 86_400_000;
const JANELA_COBERTURA_DIAS = 3;
const JANELA_META_DIAS = 7;
const GRAPH_TIMEOUT_MS = 8000;
/** Motivos do `avisar` que não melhoram tentando de novo no mesmo dia. */
const MOTIVOS_DEFINITIVOS = ["tipo desligado", "desligado para este destinatario", "ja avisado"];

export function problemasDeRastreio(d: DadosRastreio): string[] {
  const out: string[] = [];
  if (d.recusas.length) {
    const ultima = d.recusas[0].detalhe.slice(0, 160);
    out.push(`CAPI recusou ${d.recusas.length} evento(s) em 24h. Último: ${ultima}`);
  }
  const ruins = d.cobertura.filter((c) => c.pagos >= MIN_LEADS && c.comClique / c.pagos < COBERTURA_MINIMA);
  if (ruins.length) {
    const lista = ruins.map((c) => `${c.origem} (${c.comClique} de ${c.pagos})`).join(", ");
    out.push(`Lead pago chegando SEM o clique (fbc) — a Meta não casa a conversão: ${lista}`);
  }
  const divergentes = d.metaXcrm.filter((m) => {
    if (Math.max(m.meta, m.crm) < MIN_LEADS) return false;
    const menor = Math.max(Math.min(m.meta, m.crm), 1);
    return Math.max(m.meta, m.crm) / menor > DIVERGENCIA_MAXIMA;
  });
  if (divergentes.length) {
    const lista = divergentes.map((m) => `${m.campanha}: Meta ${m.meta} × CRM ${m.crm}`).join("; ");
    out.push(`Leads 7 dias, Meta e CRM não batem: ${lista}`);
  }
  return out;
}

export function textoAlertaRastreio(problemas: string[]): string {
  return [
    "Rastreamento Meta com problema:",
    "",
    ...problemas.map((p) => `• ${p}`),
    "",
    "Detalhe: CRM → Auditoria (capi_*). Checklist: skill meta-ads-rastreamento.",
  ].join("\n");
}

async function coletar(agora: Date): Promise<DadosRastreio> {
  const { db } = await import("@/lib/db");
  const recusasDb = await db.auditEvent.findMany({
    where: {
      action: { in: ["capi_recusado", "capi_web_recusado", "capi_falhou", "capi_web_falhou"] },
      createdAt: { gte: new Date(agora.getTime() - DIA_MS) },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const recusas = recusasDb.map((r) => ({ detalhe: r.detail ?? r.action, em: r.createdAt }));

  const desde = new Date(agora.getTime() - JANELA_COBERTURA_DIAS * DIA_MS);
  const leads = await db.contact.findMany({
    where: { createdAt: { gte: desde }, origem: { startsWith: "funil:" } },
    select: { origem: true, customFields: true },
  });
  // Funil de cliente com pixel próprio é medido na CAPI dele, não aqui.
  const { origensFora } = await import("@/lib/capi-web");
  const { origemComPixelProprio } = await import("@/lib/rastreio-meta");
  const fora = await origensFora();
  const porOrigem = new Map<string, Cobertura>();
  for (const l of leads) {
    const cf = (l.customFields ?? {}) as Record<string, unknown>;
    if (String(cf.utm_source ?? "") !== "meta") continue;
    if (origemComPixelProprio(l.origem, fora)) continue;
    const o = String(l.origem);
    const atual = porOrigem.get(o) ?? { origem: o, pagos: 0, comClique: 0 };
    porOrigem.set(o, { ...atual, pagos: atual.pagos + 1, comClique: atual.comClique + (cf.fbc ? 1 : 0) });
  }

  return { recusas, cobertura: [...porOrigem.values()], metaXcrm: await metaXCrm(agora) };
}

/** Leads por campanha, Meta (insights) × CRM (campanha = utm_campaign). Falha = lista vazia. */
async function metaXCrm(agora: Date): Promise<MetaXCrm[]> {
  try {
    const { db } = await import("@/lib/db");
    const { config } = await import("@/lib/config");
    const token = await config("meta_ads_token", "META_ADS_TOKEN");
    const contas = (await config("rastreio_contas", undefined, await config("meta_ads_account", "META_ADS_ACCOUNT")))
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    if (!token || !contas.length) return [];

    const meta = new Map<string, number>();
    for (const conta of contas) {
      const url =
        `https://graph.facebook.com/v21.0/${encodeURIComponent(conta)}/insights?level=campaign` +
        `&date_preset=last_7d&fields=campaign_name,actions&limit=200&access_token=${encodeURIComponent(token)}`;
      const r = (await (await fetch(url, { signal: AbortSignal.timeout(GRAPH_TIMEOUT_MS) })).json()) as {
        data?: { campaign_name: string; actions?: { action_type: string; value: string }[] }[];
        error?: unknown;
      };
      // Rate limit/permissão vem como `error` sem `data`: não vira "0 leads".
      if (r.error || !r.data) continue;
      for (const c of r.data) {
        const lead = (c.actions ?? []).find((a) => a.action_type === "lead" || a.action_type === "offsite_conversion.fb_pixel_lead");
        if (lead) meta.set(c.campaign_name, (meta.get(c.campaign_name) ?? 0) + Number(lead.value));
      }
    }
    if (!meta.size) return [];

    const leads = await db.contact.findMany({
      where: { createdAt: { gte: new Date(agora.getTime() - JANELA_META_DIAS * DIA_MS) } },
      select: { customFields: true },
    });
    const crm = new Map<string, number>();
    for (const l of leads) {
      const camp = String(((l.customFields ?? {}) as Record<string, unknown>).campanha ?? "");
      if (meta.has(camp)) crm.set(camp, (crm.get(camp) ?? 0) + 1);
    }
    // Só compara campanha cujo nome o CRM reconhece: campanha antiga com UTM em
    // slug/id daria "CRM 0" todo dia e viraria alarme falso.
    return [...crm.entries()].map(([campanha, n]) => ({ campanha, meta: meta.get(campanha) ?? 0, crm: n }));
  } catch {
    return [];
  }
}

/** Uma vez por dia, a partir das 9h de Brasília. Silencioso quando está tudo certo. */
export async function vigiarRastreamento(agora = new Date()): Promise<{ enviado: boolean; motivo?: string }> {
  const { horaDeBrasilia } = await import("@/lib/resumo-diario");
  const { config } = await import("@/lib/config");
  if ((await config("vigia_rastreio_ativo", undefined, "1")) === "0") return { enviado: false, motivo: "desligado" };
  if (horaDeBrasilia(agora) < HORA_ENVIO) return { enviado: false, motivo: "cedo" };

  const { db } = await import("@/lib/db");
  const dia = new Date(agora.getTime() - 3 * 3_600_000).toISOString().slice(0, 10);
  const chave = `rastreio:${dia}`;
  // Marca o dia antes de coletar: a coleta bate na Graph e não pode rodar a cada 5 min.
  try {
    await db.notificacao.create({ data: { tipo: "vigia_rastreio", chave, detalhe: "rodou" } });
  } catch {
    return { enviado: false, motivo: "ja rodou hoje" };
  }

  const liberarDia = () => db.notificacao.deleteMany({ where: { tipo: "vigia_rastreio", chave } });
  let problemas: string[];
  try {
    problemas = problemasDeRastreio(await coletar(agora));
  } catch (e) {
    await liberarDia(); // tenta de novo no próximo ciclo
    return { enviado: false, motivo: e instanceof Error ? e.message : String(e) };
  }
  if (!problemas.length) return { enviado: false, motivo: "tudo certo" };
  const { avisar } = await import("@/lib/notificacao");
  const r = await avisar("erro", chave, textoAlertaRastreio(problemas));
  // WhatsApp fora/fora do horário: o alerta é justamente o que mais importa — reabre o dia.
  if (!r.enviado && !MOTIVOS_DEFINITIVOS.includes(String(r.motivo))) await liberarDia();
  return { enviado: r.enviado, motivo: r.motivo };
}
