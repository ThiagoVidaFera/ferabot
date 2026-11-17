"use server";

import { revalidatePath } from "next/cache";
import { sessaoAtual } from "@/lib/auth";
import { auditar } from "@/lib/audit";
import { registrarCusto } from "@/lib/aquisicao";

export async function lancarCusto(form: FormData) {
  const s = await sessaoAtual();
  if (!s) throw new Error("nao autenticado");

  // "1.250,00" -> 1250.00
  const bruto = String(form.get("valor") ?? "0").replace(/\./g, "").replace(",", ".");
  const reais = Number(bruto);
  if (!Number.isFinite(reais)) throw new Error("valor invalido");

  const origem = String(form.get("origem") ?? "").trim();

  await registrarCusto({
    data: String(form.get("data") ?? ""),
    origem,
    campanha: String(form.get("campanha") ?? "").trim() || undefined,
    custoCentavos: Math.round(reais * 100),
    fonte: "manual",
  });

  await auditar(s.email, "custo_lancado", `${origem} ${reais}`);
  revalidatePath("/aquisicao");
}
