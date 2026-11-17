import { db } from "@/lib/db";
import { auditar } from "@/lib/audit";
import { tagsDe } from "@/lib/tags";

/**
 * Mescla de contatos duplicados (30/10/2026).
 *
 * Caso real: o Romeu preencheu o formulário com um telefone (+55) e escreveu
 * do WhatsApp com outro (+39). O CRM não tinha como saber que era a mesma
 * pessoa e criou dois contatos — o do formulário ficou "sem mensagem" (e caiu
 * em "Precisam de atenção manual") e o do WhatsApp ficou sem os dados do
 * formulário. O elo que sobra é o @ do Instagram: o botão da página manda o @
 * na primeira mensagem ("Olá, meu nome é X (@handle)…") e o formulário
 * guarda `instagram`.
 *
 * Regras de segurança: só junta quando o @ é o mesmo, há UM único candidato, e
 * um dos dois ainda não tem NENHUMA mensagem (nunca funde duas conversas reais).
 */

const JANELA_DIAS = 30;
const HANDLES_GENERICOS = new Set(["instagram", "none", "nao", "não", "sem", "nenhum", "n/a", "na", "teste"]);

export function normalizarInstagram(v: unknown): string | null {
  const h = String(v ?? "").trim().replace(/^@/, "").toLowerCase();
  if (!/^[a-z0-9._]{3,30}$/.test(h) || HANDLES_GENERICOS.has(h)) return null;
  return h;
}

/** O primeiro @handle de um texto ("meu nome é Ana (@ana.silva). Vim da página…"). */
export function extrairInstagramDaMensagem(texto: string | null | undefined): string | null {
  const m = String(texto ?? "").match(/@([a-z0-9._]{3,30})/i);
  return m ? normalizarInstagram(m[1]) : null;
}

type PontaMescla = { id: string; mensagens: number; createdAt: Date };

/** Fica o contato com a conversa; empate, o mais antigo. */
export function decidirManter(a: PontaMescla, b: PontaMescla): { manter: PontaMescla; descartar: PontaMescla } {
  if (a.mensagens !== b.mensagens) return a.mensagens > b.mensagens ? { manter: a, descartar: b } : { manter: b, descartar: a };
  return a.createdAt <= b.createdAt ? { manter: a, descartar: b } : { manter: b, descartar: a };
}

type ContatoMescla = {
  name: string;
  email: string | null;
  phone: string | null;
  origem: string;
  tags: unknown;
  customFields: unknown;
  createdAt: Date;
  totalRevenue: number;
  purchaseCount: number;
};

/** Dados finais do contato que fica (função pura: é o que o teste confere). */
export function dadosMesclados(manter: ContatoMescla, descartar: ContatoMescla, descartarId: string) {
  const doFormulario = descartar.origem.startsWith("funil:") && !manter.origem.startsWith("funil:");
  const camposManter = (manter.customFields ?? {}) as Record<string, unknown>;
  const camposDescartar = (descartar.customFields ?? {}) as Record<string, unknown>;
  const telefonesDiferem = !!descartar.phone && descartar.phone !== manter.phone;
  return {
    name: doFormulario ? descartar.name : manter.name,
    email: manter.email ?? descartar.email,
    origem: doFormulario ? descartar.origem : manter.origem,
    tags: [...new Set([...tagsDe(manter.tags), ...tagsDe(descartar.tags)])],
    customFields: {
      ...camposDescartar,
      ...camposManter,
      ...(telefonesDiferem ? { telefone_formulario: descartar.phone } : {}),
      mesclado_de: descartarId,
    },
    createdAt: descartar.createdAt < manter.createdAt ? descartar.createdAt : manter.createdAt,
    totalRevenue: manter.totalRevenue + descartar.totalRevenue,
    purchaseCount: manter.purchaseCount + descartar.purchaseCount,
  };
}

export async function mesclarContatos(manterId: string, descartarId: string, motivo: string) {
  const [manter, descartar] = await Promise.all([
    db.contact.findUnique({ where: { id: manterId } }),
    db.contact.findUnique({ where: { id: descartarId } }),
  ]);
  if (!manter || !descartar || manterId === descartarId) return null;

  // Listas e disparos têm chave única (lista+contato): o que já existe no que fica não se move.
  const [listasManter, disparosManter] = await Promise.all([
    db.contactListMember.findMany({ where: { contactId: manterId }, select: { listId: true } }),
    db.broadcastTarget.findMany({ where: { contactId: manterId }, select: { broadcastId: true } }),
  ]);

  const dados = dadosMesclados(manter, descartar, descartarId);
  const ficaDoDescartado = { contactId: descartarId };
  await db.$transaction([
    db.whatsappMessage.updateMany({ where: ficaDoDescartado, data: { contactId: manterId } }),
    db.timelineEvent.updateMany({ where: ficaDoDescartado, data: { contactId: manterId } }),
    db.ficha.updateMany({ where: ficaDoDescartado, data: { contactId: manterId } }),
    db.contactIdentity.updateMany({ where: ficaDoDescartado, data: { contactId: manterId } }),
    db.agentAction.updateMany({ where: ficaDoDescartado, data: { contactId: manterId } }),
    db.deal.updateMany({ where: ficaDoDescartado, data: { contactId: manterId } }),
    db.emailSend.updateMany({ where: ficaDoDescartado, data: { contactId: manterId } }),
    db.purchase.updateMany({ where: ficaDoDescartado, data: { contactId: manterId } }),
    db.contactListMember.updateMany({
      where: { ...ficaDoDescartado, listId: { notIn: listasManter.map((l) => l.listId) } },
      data: { contactId: manterId },
    }),
    db.contactListMember.deleteMany({ where: ficaDoDescartado }),
    db.broadcastTarget.updateMany({
      where: { ...ficaDoDescartado, broadcastId: { notIn: disparosManter.map((b) => b.broadcastId) } },
      data: { contactId: manterId },
    }),
    db.broadcastTarget.deleteMany({ where: ficaDoDescartado }),
    db.conversationState.deleteMany({ where: ficaDoDescartado }),
    db.contact.update({
      where: { id: manterId },
      data: {
        name: dados.name,
        email: dados.email,
        origem: dados.origem,
        tags: dados.tags as never,
        customFields: dados.customFields as never,
        createdAt: dados.createdAt,
        totalRevenue: dados.totalRevenue,
        purchaseCount: dados.purchaseCount,
      },
    }),
    db.contact.delete({ where: { id: descartarId } }),
  ]);
  await auditar("sistema", "contatos_mesclados", `${descartar.name} (${descartarId}) → ${dados.name} (${manterId}) · ${motivo}`.slice(0, 300));
  return { manterId, descartadoId: descartarId };
}

type Linha = { id: string };

/**
 * Procura o outro contato com o MESMO @ do Instagram e, se for um caso seguro,
 * junta. Devolve quem ficou (`manterId`) ou null se não mesclou.
 */
export async function mesclarDuplicataPorInstagram(contactId: string, handle?: string | null) {
  const atual = await db.contact.findUnique({ where: { id: contactId }, select: { id: true, customFields: true, createdAt: true } });
  if (!atual) return null;
  const h = normalizarInstagram(handle) ?? normalizarInstagram((atual.customFields as Record<string, unknown> | null)?.instagram);
  if (!h) return null;

  const desde = new Date(Date.now() - JANELA_DIAS * 86_400_000).toISOString();
  const outros = await db.$queryRaw<Linha[]>`
    SELECT id FROM Contact
    WHERE id != ${contactId}
      AND createdAt >= ${desde}
      AND lower(replace(coalesce(json_extract(customFields, '$.instagram'), ''), '@', '')) = ${h}
    LIMIT 3`;
  if (outros.length !== 1) return null; // nenhum ou ambíguo

  const [a, b] = await Promise.all(
    [contactId, outros[0].id].map(async (id) => ({
      id,
      mensagens: await db.whatsappMessage.count({ where: { contactId: id } }),
      createdAt: (await db.contact.findUnique({ where: { id }, select: { createdAt: true } }))!.createdAt,
    })),
  );
  if (a.mensagens > 0 && b.mensagens > 0) return null; // duas conversas reais: nunca funde
  const { manter, descartar } = decidirManter(a, b);
  return mesclarContatos(manter.id, descartar.id, `mesmo Instagram @${h}`);
}
