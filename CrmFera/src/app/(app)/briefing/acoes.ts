"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sessaoAtual } from "@/lib/auth";
import { auditar } from "@/lib/audit";
import { PERGUNTAS_BRIEFING, respondidas, salvarBriefing } from "@/lib/briefing-cliente";

export async function salvarBriefingAcao(form: FormData): Promise<void> {
  const s = await sessaoAtual();
  if (!s) throw new Error("nao autenticado");
  const entrada = Object.fromEntries(PERGUNTAS_BRIEFING.map((p) => [p.id, String(form.get(p.id) ?? "")]));
  const briefing = await salvarBriefing(entrada);
  await auditar(s.email, "briefing.salvo", `${respondidas(briefing)} de ${PERGUNTAS_BRIEFING.length}`);
  revalidatePath("/briefing");
  revalidatePath("/jornada");
  revalidatePath("/comece");
  revalidatePath("/");
  redirect("/briefing?salvo=1");
}
