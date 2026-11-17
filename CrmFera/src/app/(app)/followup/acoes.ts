"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { sessaoAtual } from "@/lib/auth";
import { auditar } from "@/lib/audit";
import { registrarEvento } from "@/lib/timeline";
import { conexaoPadrao, conexaoPorId, enviarTexto } from "@/lib/whatsapp";
import { aplicarVariaveis } from "@/lib/config";
import { conexaoDoNumeroUnico, exigeNumeroUnico, recarregarNumeroUnico, sessaoPermitida } from "@/lib/numero-unico";

async function exigirSessao() {
  const s = await sessaoAtual();
  if (!s) throw new Error("nao autenticado");
  return s;
}

export type RespostaToque = { ok: boolean; erro?: string };

/**
 * Marca o toque da etapa. O carimbo `followup` no evento e o que faz a etapa
 * nao repetir — a linha do tempo e o registro, nao uma tabela de controle.
 */
export async function registrarToque(
  contactId: string,
  etapa: string,
  texto?: string,
): Promise<RespostaToque> {
  const s = await exigirSessao();
  const contato = await db.contact.findUnique({ where: { id: contactId } });
  if (!contato) return { ok: false, erro: "contato nao encontrado" };

  // Se veio texto, manda de verdade pelo WhatsApp.
  if (texto?.trim()) {
    if (!contato.phone) return { ok: false, erro: "contato sem telefone" };

    const campos =
      contato.customFields && typeof contato.customFields === "object"
        ? (contato.customFields as Record<string, unknown>)
        : {};
    const instanceId = typeof campos.instanceId === "string" ? campos.instanceId : undefined;
    // Número único (numero-unico.ts): lead dessa origem só fala pelo número configurado.
    await recarregarNumeroUnico();
    const escolhida = exigeNumeroUnico(contato.origem)
      ? await conexaoDoNumeroUnico()
      : instanceId
        ? await conexaoPorId(instanceId)
        : await conexaoPadrao();
    if (!escolhida && exigeNumeroUnico(contato.origem)) {
      return { ok: false, erro: "Este lead só fala pelo número único, que não está conectado no CRM" };
    }
    const conexao = escolhida;
    if (!conexao) return { ok: false, erro: "WhatsApp nao conectado" };
    if (!sessaoPermitida(contato.origem, conexao.sessao)) return { ok: false, erro: "Este lead só fala pelo número único configurado" };

    const final = aplicarVariaveis(texto.trim(), contato);
    const destino =
      typeof campos.whatsapp_chat_id === "string" && campos.whatsapp_chat_id
        ? campos.whatsapp_chat_id
        : contato.phone;

    const r = await enviarTexto(conexao, destino, final);
    if (!r.ok) return { ok: false, erro: r.erro };

    await db.whatsappMessage.create({
      data: {
        contactId,
        instanceId: conexao.instanceId ?? null,
        fromNumber: "crm",
        toNumber: contato.phone,
        body: final,
        direction: "outbound",
        status: "sent",
        externalId: r.externalId ?? null,
        metadata: { origem: "followup", followup: etapa, ator: s.email } as never,
      },
    });
    await registrarEvento({
      contactId,
      eventType: "whatsapp_message",
      channel: "whatsapp",
      metadata: { direcao: "enviada", texto: final, followup: etapa, ator: s.email },
    });
  } else {
    // Sem texto = "falei por fora, marca como feito".
    await registrarEvento({
      contactId,
      eventType: "note",
      channel: "sistema",
      metadata: { texto: `Toque ${etapa} marcado como feito`, followup: etapa, ator: s.email },
    });
  }

  await auditar(s.email, "followup_toque", `${etapa} -> ${contactId}`);
  revalidatePath("/followup");
  revalidatePath(`/contatos/${contactId}`);
  return { ok: true };
}

/** Tira o contato da régua sem falar com ele (não é hora / não faz sentido). */
export async function pularEtapa(contactId: string, etapa: string) {
  const s = await exigirSessao();
  await registrarEvento({
    contactId,
    eventType: "note",
    channel: "sistema",
    metadata: { texto: `Toque ${etapa} pulado`, followup: etapa, ator: s.email },
  });
  await auditar(s.email, "followup_pulado", `${etapa} -> ${contactId}`);
  revalidatePath("/followup");
}

/**
 * Retira o lead de TODAS as automações: vai pro estágio "Sem automação", que o
 * agente, a régua, o follow-up, os toques e os disparos respeitam. Sai também da
 * fila "falaram e ninguém respondeu". Reversível: é só mudar o estágio de volta.
 */
export async function retirarDasAutomacoes(contactId: string) {
  const s = await exigirSessao();
  const { mudarEstagio } = await import("@/lib/timeline");
  const { cancelarToqueProposta } = await import("@/lib/toque-proposta");
  await mudarEstagio(contactId, "sem_automacao", s.email);
  await cancelarToqueProposta(contactId);
  await auditar(s.email, "retirado_das_automacoes", contactId);
  revalidatePath("/followup");
  revalidatePath("/inbox");
  revalidatePath("/contatos");
  revalidatePath("/");
}
