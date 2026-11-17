"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { sessaoAtual } from "@/lib/auth";
import { auditar } from "@/lib/audit";
import { registrarEvento } from "@/lib/timeline";

async function exigirSessao() {
  const s = await sessaoAtual();
  if (!s) throw new Error("nao autenticado");
  return s;
}

export async function moverDeal(dealId: string, stageId: string) {
  const s = await exigirSessao();

  const deal = await db.deal.findUnique({
    where: { id: dealId },
    include: { stage: true },
  });
  if (!deal) throw new Error("negocio nao encontrado");
  if (deal.stageId === stageId) return;

  const destino = await db.pipelineStage.findUnique({ where: { id: stageId } });
  if (!destino) throw new Error("estagio nao encontrado");

  await db.deal.update({ where: { id: dealId }, data: { stageId } });

  // LEI 3: arrastar o cartao e um fato — vira evento na linha do tempo do contato.
  await registrarEvento({
    contactId: deal.contactId,
    eventType: "stage_change",
    channel: "sistema",
    metadata: {
      de: deal.stage.name,
      para: destino.name,
      deal: deal.titulo,
      escopo: "funil",
      ator: s.email,
    },
  });
  await auditar(s.email, "deal_movido", `${deal.titulo}: ${deal.stage.name} -> ${destino.name}`);

  revalidatePath("/funis");
  revalidatePath(`/contatos/${deal.contactId}`);
}

export async function criarDeal(form: FormData) {
  const s = await exigirSessao();

  const contactId = String(form.get("contactId") ?? "");
  const stageId = String(form.get("stageId") ?? "");
  const titulo = String(form.get("titulo") ?? "").trim();
  const reais = Number(String(form.get("valor") ?? "0").replace(",", "."));
  if (!contactId || !stageId || !titulo) throw new Error("contato, estagio e titulo obrigatorios");

  const deal = await db.deal.create({
    data: {
      contactId,
      stageId,
      titulo,
      valueCents: Number.isFinite(reais) ? Math.round(reais * 100) : 0,
    },
  });

  await registrarEvento({
    contactId,
    eventType: "note",
    channel: "sistema",
    metadata: { texto: `Negócio criado no funil: ${titulo}`, ator: s.email },
  });
  await auditar(s.email, "deal_criado", deal.id);

  revalidatePath("/funis");
  revalidatePath(`/contatos/${contactId}`);
}

export async function excluirDeal(dealId: string) {
  const s = await exigirSessao();
  const deal = await db.deal.findUnique({ where: { id: dealId } });
  if (!deal) return;
  await db.deal.delete({ where: { id: dealId } });
  await auditar(s.email, "deal_excluido", deal.titulo);
  revalidatePath("/funis");
}
