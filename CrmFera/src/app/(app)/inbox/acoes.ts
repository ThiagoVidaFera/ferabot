"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { sessaoAtual } from "@/lib/auth";
import { auditar } from "@/lib/audit";
import { registrarEvento, mudarEstagio } from "@/lib/timeline";
import { conexaoPadrao, conexaoPorId, enviarTexto, enviarMidia } from "@/lib/whatsapp";
import { salvarMidia } from "@/lib/midia";
import { aplicarVariaveis } from "@/lib/config";
import { agendarToqueProposta, cancelarToqueProposta } from "@/lib/toque-proposta";
import type { EstadoConversa } from "./estados";

async function exigirSessao() {
  const s = await sessaoAtual();
  if (!s) throw new Error("nao autenticado");
  return s;
}

export type RespostaEnvio = { ok: boolean; erro?: string };

export async function enviarMensagem(
  contactId: string,
  texto: string,
  instanceId?: string,
): Promise<RespostaEnvio> {
  const s = await exigirSessao();
  const corpo = texto.trim();
  if (!corpo) return { ok: false, erro: "mensagem vazia" };

  const contato = await db.contact.findUnique({ where: { id: contactId } });
  if (!contato?.phone) return { ok: false, erro: "contato sem telefone" };

  // Responde pelo MESMO numero que recebeu. Sem isso, mensagem que chegou no
  // numero unico sairia por outro numero — e o lead veria dois numeros.
  const conexao = instanceId ? await conexaoPorId(instanceId) : await conexaoPadrao();
  if (!conexao) return { ok: false, erro: "WhatsApp nao conectado (tela de Configurações)" };

  const final = aplicarVariaveis(corpo, contato);

  // Se ja conversamos, responder no mesmo chatId (o NOWEB endereca por @lid).
  const campos =
    contato.customFields && typeof contato.customFields === "object"
      ? (contato.customFields as Record<string, unknown>)
      : {};
  const destino =
    typeof campos.whatsapp_chat_id === "string" && campos.whatsapp_chat_id
      ? campos.whatsapp_chat_id
      : contato.phone;

  const r = await enviarTexto(conexao, destino, final);

  await db.whatsappMessage.create({
    data: {
      contactId,
      instanceId: conexao.instanceId ?? null,
      fromNumber: "crm",
      toNumber: contato.phone,
      body: final,
      direction: "outbound",
      status: r.ok ? "sent" : "failed",
      externalId: r.externalId ?? null,
      metadata: { origem: "inbox", ator: s.email, erro: r.erro ?? null } as never,
    },
  });

  if (r.ok) {
    await registrarEvento({
      contactId,
      eventType: "whatsapp_message",
      channel: "whatsapp",
      metadata: { direcao: "enviada", texto: final, ator: s.email },
    });
  }

  await auditar(s.email, r.ok ? "mensagem_enviada" : "mensagem_falhou", `${contactId}: ${r.erro ?? "ok"}`);

  revalidatePath("/inbox");
  revalidatePath(`/contatos/${contactId}`);
  return { ok: r.ok, erro: r.erro };
}

export async function salvarQuickReply(form: FormData) {
  const s = await exigirSessao();
  const title = String(form.get("title") ?? "").trim();
  const body = String(form.get("body") ?? "").trim();
  const bruto = String(form.get("shortcut") ?? "").trim();
  if (!title || !body) throw new Error("titulo e texto obrigatorios");

  const shortcut = bruto ? (bruto.startsWith("/") ? bruto : "/" + bruto) : null;
  await db.quickReply.create({ data: { title, body, shortcut } });
  await auditar(s.email, "quick_reply_criada", title);
  revalidatePath("/inbox");
}

export async function excluirQuickReply(id: string) {
  const s = await exigirSessao();
  await db.quickReply.delete({ where: { id } });
  await auditar(s.email, "quick_reply_excluida", id);
  revalidatePath("/inbox");
}

export async function marcarLida(contactId: string) {
  await exigirSessao();
  await db.whatsappMessage.updateMany({
    where: { contactId, direction: "inbound", status: { not: "read" } },
    data: { status: "read" },
  });
  revalidatePath("/inbox");
}


/**
 * Estado da conversa no Inbox — o "kanban de atendimento".
 *   andamento (padrao) · destacada · arquivada · excluida
 * Excluir e SOFT: some das abas, mas nem o contato nem as mensagens sao
 * apagados. Atendimento se organiza; historico nao se joga fora (LEI 3).
 */
export async function mudarEstadoConversa(contactId: string, estado: EstadoConversa) {
  const s = await exigirSessao();

  await db.conversationState.upsert({
    where: { contactId },
    update: { estado, ator: s.email },
    create: { contactId, estado, ator: s.email },
  });

  const rotulo =
    estado === "destacada"
      ? "Conversa destacada"
      : estado === "arquivada"
        ? "Conversa arquivada"
        : estado === "excluida"
          ? "Conversa excluída do inbox (histórico preservado)"
          : "Conversa devolvida para Em andamento";

  await registrarEvento({
    contactId,
    eventType: "note",
    channel: "sistema",
    metadata: { texto: rotulo, ator: s.email },
  });
  await auditar(s.email, "conversa_" + estado, contactId);

  revalidatePath("/inbox");
  revalidatePath(`/contatos/${contactId}`);
}


export type TipoMidia = "image" | "voice" | "file";

/**
 * Envia foto ou audio pela conversa. O arquivo chega em base64 da tela, vai
 * pro WhatsApp e fica guardado no volume pra aparecer no historico depois.
 */
export async function enviarMidiaMensagem(
  contactId: string,
  tipo: TipoMidia,
  base64: string,
  mimetype: string,
  nomeArquivo?: string,
  legenda?: string,
  instanceId?: string,
): Promise<RespostaEnvio> {
  const s = await exigirSessao();

  const contato = await db.contact.findUnique({ where: { id: contactId } });
  if (!contato?.phone) return { ok: false, erro: "contato sem telefone" };

  const conexao = instanceId ? await conexaoPorId(instanceId) : await conexaoPadrao();
  if (!conexao) return { ok: false, erro: "WhatsApp nao conectado" };

  let guardada;
  try {
    guardada = salvarMidia(base64, mimetype, nomeArquivo);
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : String(e) };
  }

  const campos =
    contato.customFields && typeof contato.customFields === "object"
      ? (contato.customFields as Record<string, unknown>)
      : {};
  const destino =
    typeof campos.whatsapp_chat_id === "string" && campos.whatsapp_chat_id
      ? campos.whatsapp_chat_id
      : contato.phone;

  const r = await enviarMidia(conexao, destino, {
    tipo,
    mimetype,
    filename: nomeArquivo,
    base64,
    legenda,
  });

  await db.whatsappMessage.create({
    data: {
      contactId,
      instanceId: conexao.instanceId ?? null,
      fromNumber: "crm",
      toNumber: contato.phone,
      body: legenda?.trim() || (tipo === "voice" ? "🎤 Áudio" : tipo === "image" ? "📷 Foto" : "📎 Arquivo"),
      type: tipo === "voice" ? "audio" : tipo === "image" ? "image" : "document",
      direction: "outbound",
      status: r.ok ? "sent" : "failed",
      externalId: r.externalId ?? null,
      metadata: {
        origem: "inbox",
        ator: s.email,
        midiaId: guardada.id,
        mimetype: guardada.mimetype,
        tamanho: guardada.tamanho,
        erro: r.erro ?? null,
      } as never,
    },
  });

  if (r.ok) {
    await registrarEvento({
      contactId,
      eventType: "whatsapp_message",
      channel: "whatsapp",
      metadata: {
        direcao: "enviada",
        texto: legenda?.trim() || (tipo === "voice" ? "Áudio" : "Foto"),
        midiaId: guardada.id,
        ator: s.email,
      },
    });
  }

  await auditar(s.email, r.ok ? "midia_enviada" : "midia_falhou", `${tipo} -> ${contactId}: ${r.erro ?? "ok"}`);

  revalidatePath("/inbox");
  revalidatePath(`/contatos/${contactId}`);
  return { ok: r.ok, erro: r.erro };
}


/**
 * Devolve a conversa pro agente. Tira a tag `humano` e carimba
 * `agente_religado_em`: o seletor so conta mensagem de gente DEPOIS desse
 * instante — senao a conversa antiga travaria o agente de novo na hora.
 */
export async function religarAgente(contactId: string) {
  const s = await exigirSessao();
  const c = await db.contact.findUnique({ where: { id: contactId } });
  if (!c) return;

  const tags = Array.isArray(c.tags) ? (c.tags as string[]) : [];
  const campos =
    c.customFields && typeof c.customFields === "object" ? (c.customFields as Record<string, unknown>) : {};
  await db.contact.update({
    where: { id: contactId },
    data: {
      tags: tags.filter((t) => t !== "humano") as never,
      customFields: { ...campos, agente_religado_em: new Date().toISOString() } as never,
    },
  });
  await registrarEvento({
    contactId,
    eventType: "acao_agente",
    channel: "sistema",
    metadata: { texto: "Agente religado nesta conversa (tag humano removida)", tag: "humano", por: s.email },
  });
  await auditar(s.email, "agente_religado", contactId);
  revalidatePath("/inbox");
  revalidatePath(`/contatos/${contactId}`);
}

/**
 * Liga/desliga o "só humano": com a tag `humano` nenhum robô fala com o
 * contato (agente, follow-up do agente, régua e disparos leem a mesma tag).
 * Desligar reaproveita `religarAgente`, que também zera a contagem de falas.
 */
export async function alternarHumano(contactId: string, ativar: boolean) {
  if (!ativar) return religarAgente(contactId);
  const s = await exigirSessao();
  const { adicionarTag } = await import("@/lib/tags");
  await adicionarTag(contactId, "humano", s.email);
  await auditar(s.email, "humano_ativado", contactId);
  revalidatePath("/inbox");
  revalidatePath(`/contatos/${contactId}`);
}

const ESTAGIOS_JA_NA_PROPOSTA = ["proposta", "cliente"];

/**
 * Registra (ou desfaz) "call realizada" — tag `call-realizada` + evento `call`
 * na linha do tempo. Registrar a call liga a proposta sozinho: quem teve call
 * recebeu proposta. Desfazer NÃO mexe na proposta (pode ter sido enviada de verdade).
 */
export async function alternarCallRealizada(contactId: string, ativar: boolean) {
  const s = await exigirSessao();
  const c = await db.contact.findUnique({ where: { id: contactId } });
  if (!c) return;

  const { adicionarTag, tagsDe } = await import("@/lib/tags");
  if (ativar) {
    await adicionarTag(contactId, "call-realizada", s.email);
    await registrarEvento({
      contactId,
      eventType: "call",
      channel: "sistema",
      metadata: { texto: "Call realizada", por: s.email },
    });
    if (!ESTAGIOS_JA_NA_PROPOSTA.includes(c.lifecycleStage)) {
      await mudarEstagio(contactId, "proposta", s.email);
    }
    if (c.lifecycleStage !== "cliente") await agendarToqueProposta(contactId);
  } else {
    await db.contact.update({
      where: { id: contactId },
      data: { tags: tagsDe(c.tags).filter((t) => t !== "call-realizada") as never },
    });
    await registrarEvento({
      contactId,
      eventType: "call",
      channel: "sistema",
      metadata: { texto: "Call realizada desmarcada", por: s.email },
    });
  }
  await auditar(s.email, ativar ? "call_realizada" : "call_realizada_desfeita", contactId);
  revalidatePath("/inbox");
  revalidatePath(`/contatos/${contactId}`);
  revalidatePath("/followup");
}

/**
 * "Proposta enviada" = estágio `proposta`. Pode ligar à mão (proposta feita
 * por WhatsApp, sem call). Desligar devolve pra conversa em andamento.
 */
export async function alternarPropostaEnviada(contactId: string, ativar: boolean) {
  const s = await exigirSessao();
  const c = await db.contact.findUnique({ where: { id: contactId } });
  if (!c) return;

  if (ativar) {
    if (!ESTAGIOS_JA_NA_PROPOSTA.includes(c.lifecycleStage)) {
      await mudarEstagio(contactId, "proposta", s.email);
    }
    if (c.lifecycleStage !== "cliente") await agendarToqueProposta(contactId);
  } else if (c.lifecycleStage === "proposta") {
    await mudarEstagio(contactId, "conversando", s.email);
    await cancelarToqueProposta(contactId);
  }
  await auditar(s.email, ativar ? "proposta_enviada" : "proposta_desfeita", contactId);
  revalidatePath("/inbox");
  revalidatePath(`/contatos/${contactId}`);
  revalidatePath("/followup");
}

/**
 * Marca/desmarca call. Mexe no ESTAGIO do contato, nao num estado de conversa —
 * e o estagio que o funil, o painel e a regua de follow-up ja leem.
 */
export async function marcarCall(contactId: string, marcar: boolean) {
  const s = await exigirSessao();
  const c = await db.contact.findUnique({ where: { id: contactId } });
  if (!c) return;

  if (marcar) {
    await mudarEstagio(contactId, "call_marcada", s.email);
  } else if (c.lifecycleStage === "call_marcada") {
    // desmarcar volta pra conversa em andamento, nao pro comeco do funil
    await mudarEstagio(contactId, "conversando", s.email);
  }

  await auditar(s.email, marcar ? "call_marcada" : "call_desmarcada", contactId);
  revalidatePath("/inbox");
  revalidatePath(`/contatos/${contactId}`);
  revalidatePath("/followup");
}
