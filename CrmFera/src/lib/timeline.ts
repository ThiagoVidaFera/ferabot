import { eventoDoEstagio } from "@/lib/rastreio-meta";
import { db } from "@/lib/db";

// LEI 3 — a linha do tempo e append-only: nada se edita, tudo se registra.
// Este e o UNICO caminho para gravar TimelineEvent. Nao gravar direto pelo db
// em nenhum outro lugar: e aqui que `lastActivityAt` do contato e atualizado,
// e e por isso que ele so anda quando nasce evento REAL.

export type TipoEvento =
  | "whatsapp_message"
  | "email_sent"
  | "email_open"
  | "purchase"
  | "refund"
  | "stage_change"
  | "note"
  | "form_submit"
  | "broadcast"
  | "acao_agente"
  | "call";

export type Canal = "whatsapp" | "email" | "sistema" | "agente";

export type NovoEvento = {
  contactId: string;
  eventType: TipoEvento;
  channel?: Canal;
  metadata?: Record<string, unknown>;
  /** So para importacao historica. Em operacao normal, deixar vazio. */
  timestamp?: Date;
};

export async function registrarEvento(ev: NovoEvento) {
  const quando = ev.timestamp ?? new Date();

  const evento = await db.timelineEvent.create({
    data: {
      contactId: ev.contactId,
      eventType: ev.eventType,
      channel: ev.channel ?? null,
      metadata: (ev.metadata ?? {}) as never,
      timestamp: quando,
    },
  });

  // lastActivityAt nunca retrocede — importacao historica nao "envelhece" o contato.
  const contato = await db.contact.findUnique({
    where: { id: ev.contactId },
    select: { lastActivityAt: true },
  });
  if (!contato?.lastActivityAt || contato.lastActivityAt < quando) {
    await db.contact.update({
      where: { id: ev.contactId },
      data: { lastActivityAt: quando },
    });
  }

  return evento;
}

/** Muda o estagio e registra o evento. Nao mexer no estagio por fora daqui. */
export async function mudarEstagio(
  contactId: string,
  novo: string,
  ator: string,
) {
  const atual = await db.contact.findUnique({
    where: { id: contactId },
    select: { lifecycleStage: true },
  });
  if (!atual) throw new Error("contato nao encontrado: " + contactId);
  if (atual.lifecycleStage === novo) return null;

  await db.contact.update({
    where: { id: contactId },
    data: { lifecycleStage: novo },
  });

  // Virou oportunidade de verdade: avisa a Meta pra ela otimizar por ISSO, e
  // nao por volume de formulario/mensagem. Passa por aqui de proposito —
  // `mudarEstagio` e o funil unico de troca de estagio (agente, tela e funil).
  // `devolverConversao` cobre lead de WhatsApp (ctwa_clid) e de pagina (fbc/hash).
  const eventoMeta = eventoDoEstagio(novo);
  if (eventoMeta) {
    try {
      const { devolverConversaoSemEsperar } = await import("@/lib/capi-web");
      devolverConversaoSemEsperar(contactId, eventoMeta);
    } catch {
      /* atribuicao nunca derruba a mudanca de estagio */
    }
  }

  return registrarEvento({
    contactId,
    eventType: "stage_change",
    channel: "sistema",
    metadata: { de: atual.lifecycleStage, para: novo, ator },
  });
}

export async function linhaDoTempo(contactId: string, limite = 200) {
  return db.timelineEvent.findMany({
    where: { contactId },
    orderBy: { timestamp: "desc" },
    take: limite,
  });
}
