"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sessaoAtual } from "@/lib/auth";
import { auditar } from "@/lib/audit";
import { pausarAnuncioNaMeta } from "@/lib/anuncios-dados";

/** Lei 5: a sugestão é proposta; o clique é a aprovação; fica tudo na auditoria. */
export async function pausarAnuncio(form: FormData) {
  const s = await sessaoAtual();
  if (!s) throw new Error("nao autenticado");

  const adId = String(form.get("adId") ?? "").trim();
  const nome = String(form.get("nome") ?? "").slice(0, 120);
  const r = await pausarAnuncioNaMeta(adId);

  await auditar(s.email, r.ok ? "anuncio_pausado" : "anuncio_pausa_falhou", `${adId} ${nome}${r.erro ? ` · ${r.erro}` : ""}`);
  revalidatePath("/anuncios");
  redirect(r.ok ? "/anuncios?pausado=1" : `/anuncios?erro=${encodeURIComponent(r.erro ?? "falhou")}`);
}
