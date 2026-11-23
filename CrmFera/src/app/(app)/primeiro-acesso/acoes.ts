"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashSenha, sessaoAtual } from "@/lib/auth";
import { auditar } from "@/lib/audit";
import { assinarSessao, COOKIE_SESSAO, DIAS_SESSAO } from "@/lib/sessao-edge";
import { COOKIE_TROCAR_SENHA, motivoSenhaRecusada } from "@/lib/acesso";
import { SENHA_INICIAL } from "@/lib/hospedado";

export type ResultadoPrimeiroAcesso = { ok: false; erro: string };

/**
 * Troca da senha de entrada. Derruba qualquer outro aparelho que tenha entrado com a senha
 * de entrada e já renova a sessão deste, para o dono não precisar entrar de novo.
 */
export async function definirSenhaNova(_: ResultadoPrimeiroAcesso | null, form: FormData): Promise<ResultadoPrimeiroAcesso> {
  const s = await sessaoAtual();
  if (!s) redirect("/login");

  const nova = String(form.get("nova") ?? "");
  const motivo = motivoSenhaRecusada(nova, String(form.get("confirmacao") ?? ""), SENHA_INICIAL);
  if (motivo) return { ok: false, erro: motivo };

  const epoca = new Date();
  await db.user.update({ where: { id: s.userId }, data: { passwordHash: await hashSenha(nova), sessionEpoch: epoca } });
  await auditar(s.email, "senha_trocada", "primeiro acesso");

  const token = await assinarSessao({ userId: s.userId, email: s.email, name: s.name, epoch: Math.floor(epoca.getTime() / 1000) });
  const seguro = (await headers()).get("x-forwarded-proto") === "https";
  const jar = await cookies();
  jar.set(COOKIE_SESSAO, token, { httpOnly: true, sameSite: "lax", path: "/", secure: seguro, maxAge: DIAS_SESSAO * 86_400 });
  jar.delete(COOKIE_TROCAR_SENHA);
  redirect("/comece");
}
