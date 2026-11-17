"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { sessaoAtual } from "@/lib/auth";
import { auditar } from "@/lib/audit";
import { processarBroadcast } from "@/lib/broadcast";
import { testarSmtp, enviarEmail } from "@/lib/email";

async function exigirSessao() {
  const s = await sessaoAtual();
  if (!s) throw new Error("nao autenticado");
  return s;
}

export async function salvarTemplate(form: FormData) {
  const s = await exigirSessao();
  const id = String(form.get("id") ?? "");
  const name = String(form.get("name") ?? "").trim();
  const subject = String(form.get("subject") ?? "").trim();
  const html = String(form.get("html") ?? "");
  if (!name || !subject) throw new Error("nome e assunto obrigatorios");

  if (id) {
    await db.emailTemplate.update({ where: { id }, data: { name, subject, html } });
    await auditar(s.email, "template_editado", name);
  } else {
    await db.emailTemplate.create({ data: { name, subject, html } });
    await auditar(s.email, "template_criado", name);
  }
  revalidatePath("/email");
}

export async function excluirTemplate(id: string) {
  const s = await exigirSessao();
  await db.emailTemplate.delete({ where: { id } });
  await auditar(s.email, "template_excluido", id);
  revalidatePath("/email");
}

/** Dispara um template para uma lista — vira um Broadcast de canal email. */
export async function enviarTemplateParaLista(form: FormData) {
  const s = await exigirSessao();
  const templateId = String(form.get("templateId") ?? "");
  const listId = String(form.get("listId") ?? "");
  if (!templateId || !listId) throw new Error("template e lista obrigatorios");

  const t = await db.emailTemplate.findUnique({ where: { id: templateId } });
  if (!t) throw new Error("template nao encontrado");

  const b = await db.broadcast.create({
    data: {
      titulo: t.subject,
      canal: "email",
      conteudo: t.html,
      listId,
      status: "rascunho",
    },
  });

  await auditar(s.email, "email_disparado", `${t.name} -> lista ${listId}`);
  void processarBroadcast(b.id).catch(() => {});

  revalidatePath("/email");
  revalidatePath("/disparos");
}

export async function testarConexaoSmtp() {
  await exigirSessao();
  return testarSmtp();
}

export async function enviarTeste(form: FormData) {
  const s = await exigirSessao();
  const para = String(form.get("para") ?? "").trim();
  if (!para) throw new Error("e-mail de destino obrigatorio");
  const r = await enviarEmail(para, "Teste do CRM", "<p>Funcionou. — O Cérebro</p>");
  await auditar(s.email, "email_teste", `${para}: ${r.ok ? "ok" : r.erro}`);
  revalidatePath("/email");
}
