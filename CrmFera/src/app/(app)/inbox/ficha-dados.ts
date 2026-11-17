import { db } from "@/lib/db";
import { estagio } from "@/lib/estagios";
import { calor } from "@/lib/notificacao";
import { anuncioPorId } from "@/lib/meta-ads";

/**
 * Carrega a ficha do lead UMA vez por render do Inbox.
 *
 * Existe porque a ficha aparece em dois lugares: a coluna da direita no
 * desktop e o painel dobrável no celular. Antes o `<FichaLead>` buscava os
 * dados sozinho — renderizar nos dois lugares custaria duas rodadas de query
 * pra mostrar exatamente o mesmo conteúdo.
 */

/** Chaves internas que não interessam na ficha. */
const ESCONDER = new Set(["whatsapp_chat_id", "instanceId"]);

/** Os campos do CTWA ganham bloco próprio — repetir em "Qualificação" polui. */
const DO_CTWA = new Set([
  "ctwa_ad_id",
  "ctwa_clid",
  "ctwa_headline",
  "ctwa_url",
  "ctwa_tipo",
  "ctwa_em",
  "anuncio",
  "adset",
  "campanha",
]);

export type DadosFicha = Awaited<ReturnType<typeof carregarFicha>>;

export async function carregarFicha(contactId: string) {
  const c = await db.contact.findUnique({
    where: { id: contactId },
    include: {
      purchases: { orderBy: { createdAt: "desc" }, take: 3 },
      identities: true,
      _count: { select: { messages: true, timelineEvents: true } },
    },
  });
  if (!c) return null;

  const [{ pontos, motivos }, primeira, ultimaNota] = await Promise.all([
    calor(contactId),
    db.timelineEvent.findFirst({ where: { contactId }, orderBy: { timestamp: "asc" } }),
    // O agente de recepção resume a qualificação em nota. É a coisa mais útil
    // da tela e vivia só na linha do tempo do contato, a dois cliques daqui.
    db.timelineEvent.findFirst({
      where: { contactId, eventType: "note" },
      orderBy: { timestamp: "desc" },
    }),
  ]);

  const campos =
    c.customFields && typeof c.customFields === "object"
      ? (c.customFields as Record<string, unknown>)
      : {};

  const qualificacao = Object.entries(campos)
    .filter(
      ([k, v]) =>
        !ESCONDER.has(k) && !DO_CTWA.has(k) && v !== null && v !== "" && typeof v !== "object",
    )
    .map(([k, v]) => [k, String(v)] as const);

  // De qual anúncio veio o clique. A imagem é URL assinada e expira, então é
  // buscada na hora (cache de 1h em `meta-ads.ts`) e nunca guardada no banco.
  const adId = String(campos.ctwa_ad_id ?? "");
  const doGraph = adId ? await anuncioPorId(adId).catch(() => null) : null;
  const ctwa = adId || campos.ctwa_clid || campos.campanha
    ? {
        adId: adId || null,
        clid: String(campos.ctwa_clid ?? "") || null,
        tipo: String(campos.ctwa_tipo ?? "") || null,
        headline: String(campos.ctwa_headline ?? "") || null,
        url: String(campos.ctwa_url ?? "") || null,
        nome: doGraph?.nome || String(campos.anuncio ?? "") || null,
        adset: doGraph?.adset || String(campos.adset ?? "") || null,
        campanha: doGraph?.campanha || String(campos.campanha ?? "") || null,
        imagem: doGraph?.imagem ?? null,
        destino: doGraph?.destino ?? null,
      }
    : null;

  // O par {pergunta, resposta} dos quizzes vive aninhado — achatar aqui deixa a
  // ficha do Inbox mostrar o mesmo que a ficha pública `/f/<code>`.
  const respostas: { pergunta: string; resposta: string }[] = [];
  const rt = campos.respostas_texto;
  if (rt && typeof rt === "object") {
    for (const [k, v] of Object.entries(rt as Record<string, unknown>)) {
      if (Array.isArray(v)) {
        const juntas = v.map((x) => String(x ?? "").trim()).filter(Boolean).join(" · ");
        if (juntas) respostas.push({ pergunta: k, resposta: juntas });
      } else if (v && typeof v === "object") {
        const o = v as { pergunta?: string; resposta?: string };
        if (String(o.resposta ?? "").trim()) {
          respostas.push({ pergunta: o.pergunta || k, resposta: String(o.resposta) });
        }
      } else if (String(v ?? "").trim()) {
        respostas.push({ pergunta: k, resposta: String(v) });
      }
    }
  }

  const notaTexto = ((ultimaNota?.metadata ?? {}) as Record<string, unknown>).texto;

  return {
    id: c.id,
    nome: c.name,
    phone: c.phone,
    email: c.email,
    company: c.company,
    origem: c.origem,
    createdAt: c.createdAt,
    lifecycleStage: c.lifecycleStage,
    estagio: estagio(c.lifecycleStage),
    tags: Array.isArray(c.tags) ? (c.tags as string[]) : [],
    pontos,
    motivos,
    identities: c.identities.map((i) => ({ id: i.id, fonte: i.fonte, externalId: i.externalId })),
    primeiraEm: primeira?.timestamp ?? null,
    resumoAgente: typeof notaTexto === "string" ? notaTexto : null,
    resumoEm: ultimaNota?.timestamp ?? null,
    qualificacao,
    ctwa,
    respostas,
    totais: { mensagens: c._count.messages, eventos: c._count.timelineEvents },
    purchaseCount: c.purchaseCount,
    totalRevenue: c.totalRevenue,
    lastPurchaseAt: c.lastPurchaseAt,
    purchases: c.purchases.map((p) => ({
      id: p.id,
      product: p.product,
      valueCents: p.valueCents,
      createdAt: p.createdAt,
    })),
  };
}
