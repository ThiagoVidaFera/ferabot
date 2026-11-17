import { db } from "@/lib/db";

/** LEI 5 — tudo auditado. actor = email do humano OU slug do agente. */
export async function auditar(actor: string, action: string, detail?: string) {
  return db.auditEvent.create({ data: { actor, action, detail: detail ?? null } });
}
