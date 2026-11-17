import { db } from "@/lib/db";
import { auditar } from "@/lib/audit";
import { registrarEvento } from "@/lib/timeline";
import { normalizarTelefone, variantesTelefone } from "@/lib/telefone";
import { mesclarDuplicataPorInstagram, normalizarInstagram } from "@/lib/mesclar-contatos";

/**
 * Grava o @ do Instagram no contato (02/11/2026). Quem chama é o robô da agenda
 * (VPS): ele pede o @ do lead antes da reunião e, ao achar a resposta na conversa
 * do WhatsApp, devolve pra cá — a ficha do Inbox é a fonte única desse dado.
 *
 * Só atualiza contato que já existe (nunca cria lead) e não dispara aviso nem
 * "form_submit": é um dado novo numa pessoa conhecida, não uma entrada de funil.
 */

export type ResultadoInstagram =
  | { ok: true; id: string; instagram: string; mudou: boolean }
  | { ok: false; status: 404 | 422; erro: string };

export async function gravarInstagram(
  telefone: unknown,
  bruto: unknown,
  fonte: string,
): Promise<ResultadoInstagram> {
  const instagram = normalizarInstagram(bruto);
  if (!instagram) return { ok: false, status: 422, erro: "instagram invalido" };

  const phone = normalizarTelefone(typeof telefone === "string" ? telefone : null);
  if (!phone) return { ok: false, status: 422, erro: "telefone invalido" };

  const contato = await db.contact.findFirst({ where: { phone: { in: variantesTelefone(phone) } } });
  if (!contato) return { ok: false, status: 404, erro: "contato nao encontrado" };

  const campos =
    contato.customFields && typeof contato.customFields === "object"
      ? (contato.customFields as Record<string, unknown>)
      : {};
  const anterior = normalizarInstagram(campos.instagram);
  if (anterior === instagram) return { ok: true, id: contato.id, instagram, mudou: false };

  await db.contact.update({
    where: { id: contato.id },
    data: { customFields: { ...campos, instagram } as never },
  });
  await registrarEvento({
    contactId: contato.id,
    eventType: "note",
    channel: "sistema",
    metadata: {
      texto: `Instagram @${instagram} (${fonte})${anterior ? ` — antes: @${anterior}` : ""}`,
      instagram,
      anterior,
    },
  });
  await auditar(`api:${fonte}`, "instagram_gravado", `${contato.name} · @${instagram}`);

  // Mesmo @ em outro contato recente (ex.: formulário com um telefone, conversa com outro)?
  const mesclado = await mesclarDuplicataPorInstagram(contato.id, instagram).catch(() => null);
  return { ok: true, id: mesclado?.manterId ?? contato.id, instagram, mudou: true };
}
