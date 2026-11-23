"use server";

import { revalidatePath } from "next/cache";
import { sessaoAtual } from "@/lib/auth";
import { auditar } from "@/lib/audit";
import { apagarChave, retestarChave, salvarChave } from "@/lib/chaves";

async function exigirSessao() {
  const sessao = await sessaoAtual();
  if (!sessao) throw new Error("nao autenticado");
  return sessao;
}

function atualizarTelas() {
  revalidatePath("/chaves");
  revalidatePath("/jornada");
  revalidatePath("/");
}

export async function salvarChaveAcao(form: FormData): Promise<void> {
  const sessao = await exigirSessao();
  const env = String(form.get("env") ?? "");
  const valor = String(form.get("valor") ?? "").trim();
  if (!valor) return;
  const status = await salvarChave(env, valor);
  // o valor nunca vai para a auditoria: só o nome da chave e o resultado do teste
  await auditar(sessao.email, "chave.salva", `${env}: ${status.ok === true ? "funcionando" : status.ok === false ? "recusada" : "sem teste"}`);
  atualizarTelas();
}

export async function retestarChaveAcao(form: FormData): Promise<void> {
  await exigirSessao();
  await retestarChave(String(form.get("env") ?? ""));
  atualizarTelas();
}

export async function apagarChaveAcao(form: FormData): Promise<void> {
  const sessao = await exigirSessao();
  const env = String(form.get("env") ?? "");
  await apagarChave(env);
  await auditar(sessao.email, "chave.apagada", env);
  atualizarTelas();
}
