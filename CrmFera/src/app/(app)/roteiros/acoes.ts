"use server";

import { revalidatePath } from "next/cache";
import { sessaoAtual } from "@/lib/auth";
import { auditar } from "@/lib/audit";
import { db } from "@/lib/db";
import { STATUS } from "@/lib/roteiros";

/** Lei 3/5: trocar o andamento do roteiro fica na auditoria. */
export async function mudarStatusRoteiro(form: FormData) {
  const s = await sessaoAtual();
  if (!s) throw new Error("nao autenticado");

  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  if (!STATUS.some((x) => x.id === status)) throw new Error("status invalido");

  const r = await db.roteiro.update({ where: { id }, data: { status } });
  await auditar(s.email, "roteiro_status", `${r.slug} → ${status}`);
  revalidatePath("/roteiros");
}
