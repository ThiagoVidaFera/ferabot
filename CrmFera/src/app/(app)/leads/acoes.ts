"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { sessaoAtual } from "@/lib/auth";
import { auditar } from "@/lib/audit";
import { mudarEstagio, registrarEvento } from "@/lib/timeline";
import { ehStatusManual } from "@/lib/painel-leads";

/**
 * Troca o status do cartão. "auto" devolve o lead pro status calculado —
 * `conversando` se já houve mensagem, `novo` se nunca houve. Passa por
 * `mudarEstagio` de propósito: é ele que grava a linha do tempo e avisa a
 * Meta quando o lead vira proposta.
 */
export async function trocarStatusLead(contactId: string, valor: string): Promise<void> {
  const s = await sessaoAtual();
  if (!s) throw new Error("nao autenticado");

  let novo: string;
  if (ehStatusManual(valor)) {
    novo = valor;
  } else if (valor === "auto") {
    const conversou = await db.timelineEvent.count({
      where: { contactId, eventType: "whatsapp_message" },
    });
    novo = conversou ? "conversando" : "novo";
  } else {
    throw new Error("status invalido: " + valor);
  }

  await mudarEstagio(contactId, novo, s.email);
  await auditar(s.email, "estagio_mudado", `${contactId} -> ${novo} (painel de leads)`);
  revalidatePath("/leads");
  revalidatePath(`/contatos/${contactId}`);
}

/** Ganho = venda de verdade: passa pelo mesmo caminho do checkout (receita, tag, aviso, Meta). */
export async function marcarGanho(contactId: string, produto: string, valor: string): Promise<void> {
  const s = await sessaoAtual();
  if (!s) throw new Error("nao autenticado");

  // "7.500,00" · "7500" · "7500.5" → centavos. Ponto com 3 dígitos depois é milhar.
  const limpo = valor.trim().replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const reais = Number(limpo);
  if (!produto.trim()) throw new Error("produto obrigatorio");
  if (!Number.isFinite(reais) || reais <= 0) throw new Error("valor invalido: " + valor);

  const { registrarVenda } = await import("@/lib/vendas");
  await registrarVenda({
    contactId,
    produto: produto.trim(),
    valorCentavos: Math.round(reais * 100),
    origem: "painel-leads",
    ator: s.email,
  });
  await auditar(s.email, "venda_manual", `${contactId} ${produto} ${reais} (painel de leads)`);
  revalidatePath("/leads");
  revalidatePath("/vendas");
  revalidatePath(`/contatos/${contactId}`);
}

const MOTIVOS_PERDA: Record<string, string> = {
  sem_dinheiro: "Sem dinheiro",
  sem_resposta: "Sem resposta",
  sem_perfil: "Sem perfil",
};

/** Perdido sempre com motivo — é ele que diz se o problema é a oferta, o follow-up ou o tráfego. */
export async function marcarPerdido(contactId: string, motivo: string): Promise<void> {
  const s = await sessaoAtual();
  if (!s) throw new Error("nao autenticado");
  const rotulo = MOTIVOS_PERDA[motivo];
  if (!rotulo) throw new Error("motivo invalido: " + motivo);

  const contato = await db.contact.findUnique({ where: { id: contactId }, select: { customFields: true } });
  if (!contato) throw new Error("contato nao encontrado");
  const campos =
    contato.customFields && typeof contato.customFields === "object"
      ? (contato.customFields as Record<string, unknown>)
      : {};
  await db.contact.update({
    where: { id: contactId },
    data: { customFields: { ...campos, motivo_perda: motivo } as never },
  });

  await mudarEstagio(contactId, "perdido", s.email);
  const { adicionarTag } = await import("@/lib/tags");
  await adicionarTag(contactId, `perdido-${motivo.replace(/_/g, "-")}`, s.email);
  await registrarEvento({
    contactId,
    eventType: "note",
    channel: "sistema",
    metadata: { texto: `Lead perdido — motivo: ${rotulo}`, ator: s.email },
  });
  await auditar(s.email, "lead_perdido", `${contactId} ${motivo}`);
  revalidatePath("/leads");
  revalidatePath(`/contatos/${contactId}`);
}
