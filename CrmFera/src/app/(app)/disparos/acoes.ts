"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { sessaoAtual } from "@/lib/auth";
import { auditar } from "@/lib/audit";
import { processarBroadcast } from "@/lib/broadcast";

async function exigirSessao() {
  const s = await sessaoAtual();
  if (!s) throw new Error("nao autenticado");
  return s;
}

export async function criarLista(form: FormData) {
  const s = await exigirSessao();
  const name = String(form.get("name") ?? "").trim();
  if (!name) throw new Error("nome da lista obrigatorio");

  // Lista por TAG e dinamica: o source guarda a tag e a sincronizacao roda a
  // cada disparo (quem ganhar a tag depois entra sozinho).
  const tag = String(form.get("tag") ?? "").trim().toLowerCase();
  const lista = await db.contactList.create({
    data: { name, source: tag ? `tag:${tag}` : "manual" },
  });
  if (tag) {
    const { sincronizarListaPorTag } = await import("@/lib/broadcast");
    await sincronizarListaPorTag(lista.id);
  }

  // Preenche a lista com um filtro de estagio, se pedido.
  const estagio = String(form.get("estagio") ?? "");
  if (estagio && !tag) {
    const contatos = await db.contact.findMany({
      where: { lifecycleStage: estagio },
      select: { id: true },
    });
    for (const c of contatos) {
      await db.contactListMember.create({
        data: { listId: lista.id, contactId: c.id },
      });
    }
  }

  await auditar(s.email, "lista_criada", `${name} (${lista.id})`);
  revalidatePath("/disparos");
}

export async function excluirLista(listId: string) {
  const s = await exigirSessao();
  await db.contactList.delete({ where: { id: listId } });
  await auditar(s.email, "lista_excluida", listId);
  revalidatePath("/disparos");
}

export async function criarBroadcast(form: FormData) {
  const s = await exigirSessao();

  const titulo = String(form.get("titulo") ?? "").trim();
  const canal = String(form.get("canal") ?? "whatsapp_1x1");
  const conteudo = String(form.get("conteudo") ?? "").trim();
  const mediaUrl = String(form.get("mediaUrl") ?? "").trim() || null;
  const listId = String(form.get("listId") ?? "") || null;
  const gruposBrutos = form.getAll("groupIds").map(String).filter(Boolean);
  const quando = String(form.get("agendadoPara") ?? "").trim();
  const agora = String(form.get("agora") ?? "") === "1";

  if (!titulo || !conteudo) throw new Error("titulo e conteudo obrigatorios");
  if (canal !== "whatsapp_grupo" && !listId) throw new Error("escolha a lista de destino");
  if (canal === "whatsapp_grupo" && !gruposBrutos.length) throw new Error("escolha ao menos um grupo");

  // datetime-local chega sem fuso; o servidor roda em America/Sao_Paulo (TZ no .env).
  const agendadoPara = !agora && quando ? new Date(quando) : null;

  const b = await db.broadcast.create({
    data: {
      titulo,
      canal,
      conteudo,
      mediaUrl,
      listId: canal === "whatsapp_grupo" ? null : listId,
      groupIds: gruposBrutos as never,
      agendadoPara,
      status: agora ? "rascunho" : "agendado",
    },
  });

  await auditar(s.email, "broadcast_criado", `${titulo} (${canal}) ${agora ? "agora" : quando}`);

  if (agora) {
    // Nao segura a resposta da tela: dispara em background.
    void processarBroadcast(b.id).catch(() => {});
  }

  revalidatePath("/disparos");
}

export async function cancelarBroadcast(id: string) {
  const s = await exigirSessao();
  const b = await db.broadcast.findUnique({ where: { id } });
  if (!b || b.status !== "agendado") return;
  await db.broadcast.update({ where: { id }, data: { status: "rascunho", agendadoPara: null } });
  await auditar(s.email, "broadcast_cancelado", b.titulo);
  revalidatePath("/disparos");
}

export async function dispararAgora(id: string) {
  const s = await exigirSessao();
  await auditar(s.email, "broadcast_disparado_manual", id);
  void processarBroadcast(id).catch(() => {});
  revalidatePath("/disparos");
}

export async function excluirBroadcast(id: string) {
  const s = await exigirSessao();
  await db.broadcast.delete({ where: { id } });
  await auditar(s.email, "broadcast_excluido", id);
  revalidatePath("/disparos");
}
