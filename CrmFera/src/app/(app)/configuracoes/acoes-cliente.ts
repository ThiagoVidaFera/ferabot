"use server";

import { revalidatePath } from "next/cache";
import { sessaoAtual } from "@/lib/auth";
import { auditar } from "@/lib/audit";
import { ligarServidorWhatsapp } from "@/lib/whatsapp-cliente";
import { aprovarPlanoAtual, marcarPostPublicado, marcarRoteiro } from "@/lib/plano-cliente-banco";
import { lerMarcos, registrarMarco } from "@/lib/jornada-estado";

/** Painel hospedado: o dono cola o endereço e a chave do servidor de WhatsApp dele. */
export async function ligarServidorWhatsappAcao(form: FormData): Promise<void> {
  const sessao = await sessaoAtual();
  if (!sessao) throw new Error("nao autenticado");
  const resultado = await ligarServidorWhatsapp({
    url: form.get("url"),
    apiKey: form.get("apiKey"),
    sessao: form.get("sessao"),
  });
  await auditar(sessao.email, "whatsapp.servidor", resultado.ok ? "ligado" : "recusado");
  revalidatePath("/configuracoes");
  revalidatePath("/jornada");
  revalidatePath("/");
}

async function exigirDono(): Promise<string> {
  const sessao = await sessaoAtual();
  if (!sessao) throw new Error("nao autenticado");
  return sessao.email;
}

function revalidarPlano() {
  revalidatePath("/configuracoes");
  revalidatePath("/jornada");
  revalidatePath("/");
}

/** O dono aprova a big idea e o mecanismo que chegaram no onboarding: fecha o passo da narrativa. */
export async function aprovarPlanoAcao(): Promise<void> {
  const email = await exigirDono();
  const aprovado = await aprovarPlanoAtual();
  await auditar(email, "plano.aprovado", aprovado ? "ok" : "sem narrativa");
  revalidarPlano();
}

/** Gravei / Publiquei em um roteiro do YouTube. O primeiro publicado já marca o passo do YouTube. */
export async function marcarRoteiroAcao(form: FormData): Promise<void> {
  const email = await exigirDono();
  const titulo = String(form.get("titulo") ?? "").slice(0, 300);
  const etapa = form.get("etapa") === "publicado" ? "publicado" : "gravado";
  const linkBruto = String(form.get("link") ?? "").trim();
  const link = /^https:\/\//i.test(linkBruto) ? linkBruto.slice(0, 500) : undefined;

  await marcarRoteiro(titulo, etapa, link);
  if (etapa === "publicado" && !(await lerMarcos()).video_youtube) {
    await registrarMarco("video_youtube", { link, resumo: titulo });
  }
  await auditar(email, `roteiro.${etapa}`, titulo);
  revalidarPlano();
}

/** Publiquei um post do plano. O primeiro publicado marca o passo das postagens. */
export async function marcarPostAcao(form: FormData): Promise<void> {
  const email = await exigirDono();
  const titulo = String(form.get("titulo") ?? "").slice(0, 300);
  await marcarPostPublicado(titulo);
  if (!(await lerMarcos()).posts) await registrarMarco("posts", { resumo: titulo });
  await auditar(email, "post.publicado", titulo);
  revalidarPlano();
}
