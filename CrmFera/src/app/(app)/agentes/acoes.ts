"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { sessaoAtual } from "@/lib/auth";
import { auditar } from "@/lib/audit";
import { executarAcao, recusar, desfazer, type ResultadoAcao } from "@/lib/agentes";

async function exigirSessao() {
  const s = await sessaoAtual();
  if (!s) throw new Error("nao autenticado");
  return s;
}

function slugificar(v: string): string {
  return v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function criarAgente(form: FormData) {
  const s = await exigirSessao();
  const name = String(form.get("name") ?? "").trim();
  const prompt = String(form.get("prompt") ?? "").trim();
  if (!name) throw new Error("nome obrigatorio");

  const slug = slugificar(name) || `agente-${Date.now()}`;

  const agente = await db.agent.create({
    data: {
      name,
      slug,
      canal: String(form.get("canal") ?? "whatsapp"),
      prompt,
      model: String(form.get("model") ?? "gemini-2.5-flash"),
      modo: "sugere", // nunca nasce autonomo
      ativo: false,
    },
  });

  if (prompt) {
    const versao = await db.agentPromptVersion.create({
      data: { agentId: agente.id, versao: 1, prompt, autor: s.email },
    });
    await db.agent.update({ where: { id: agente.id }, data: { activeVersionId: versao.id } });
  }

  await auditar(s.email, "agente_criado", `${name} (${slug})`);
  revalidatePath("/agentes");
  // form action precisa devolver void — leva direto pra pagina do agente novo
  redirect(`/agentes/${agente.id}`);
}

/**
 * LEI 4 nesta base: salvar o prompt NAO sobrescreve — cria uma versao nova e
 * imutavel, e o agente passa a apontar pra ela. Assim da pra saber com qual
 * texto cada mensagem foi gerada.
 */
export async function salvarPrompt(form: FormData) {
  const s = await exigirSessao();
  const agentId = String(form.get("agentId") ?? "");
  const prompt = String(form.get("prompt") ?? "").trim();
  if (!agentId || !prompt) throw new Error("agente e prompt obrigatorios");

  const atual = await db.agent.findUnique({ where: { id: agentId } });
  if (!atual) throw new Error("agente nao encontrado");
  if (atual.prompt === prompt) return; // nada mudou, nao versiona a toa

  const ultima = await db.agentPromptVersion.findFirst({
    where: { agentId },
    orderBy: { versao: "desc" },
  });
  const numero = (ultima?.versao ?? 0) + 1;

  const versao = await db.agentPromptVersion.create({
    data: { agentId, versao: numero, prompt, autor: s.email },
  });
  await db.agent.update({
    where: { id: agentId },
    data: { prompt, activeVersionId: versao.id },
  });

  await auditar(s.email, "prompt_versionado", `${atual.slug} v${numero}`);
  revalidatePath(`/agentes/${agentId}`);
}

export async function restaurarVersao(agentId: string, versionId: string) {
  const s = await exigirSessao();
  const v = await db.agentPromptVersion.findUnique({ where: { id: versionId } });
  if (!v || v.agentId !== agentId) throw new Error("versao nao encontrada");

  // Restaurar tambem cria versao nova — o historico nunca reescreve.
  const ultima = await db.agentPromptVersion.findFirst({
    where: { agentId },
    orderBy: { versao: "desc" },
  });
  const nova = await db.agentPromptVersion.create({
    data: {
      agentId,
      versao: (ultima?.versao ?? 0) + 1,
      prompt: v.prompt,
      autor: `${s.email} (restaurou v${v.versao})`,
    },
  });
  await db.agent.update({
    where: { id: agentId },
    data: { prompt: v.prompt, activeVersionId: nova.id },
  });
  await auditar(s.email, "prompt_restaurado", `v${v.versao} -> v${nova.versao}`);
  revalidatePath(`/agentes/${agentId}`);
}

export async function alterarAgente(form: FormData) {
  const s = await exigirSessao();
  const agentId = String(form.get("agentId") ?? "");
  const modo = String(form.get("modo") ?? "sugere");
  const ativo = String(form.get("ativo") ?? "") === "1";
  const model = String(form.get("model") ?? "").trim();

  const agenda = String(form.get("agenda") ?? "").trim() || null;
  const alvo = String(form.get("alvo") ?? "").trim() || null;

  // Gatilho (playbook): tag/estagio/origem que ligam este agente numa conversa
  // 1:1, prioridade de desempate e intervalo entre partes do [QUEBRA].
  const limpa = (v: unknown) =>
    String(v ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ") || null;
  const gatilhoTag = limpa(form.get("gatilhoTag"));
  const gatilhoEstagio = limpa(form.get("gatilhoEstagio"));
  const gatilhoOrigem = limpa(form.get("gatilhoOrigem"));
  const prioridade = Number.parseInt(String(form.get("prioridade") ?? "0"), 10);
  const delayQuebraMs = Number.parseInt(String(form.get("delayQuebraMs") ?? "2500"), 10);

  await db.agent.update({
    where: { id: agentId },
    data: {
      modo,
      ativo,
      agenda,
      alvo,
      gatilhoTag,
      gatilhoEstagio,
      gatilhoOrigem,
      prioridade: Number.isFinite(prioridade) ? prioridade : 0,
      delayQuebraMs: Number.isFinite(delayQuebraMs) ? Math.min(Math.max(delayQuebraMs, 0), 15000) : 2500,
      ...(model ? { model } : {}),
    },
  });
  await auditar(
    s.email,
    "agente_alterado",
    `${agentId} modo=${modo} ativo=${ativo} gatilho=${gatilhoTag ?? "-"}/${gatilhoEstagio ?? "-"}/${gatilhoOrigem ?? "-"} prio=${prioridade}`,
  );
  revalidatePath(`/agentes/${agentId}`);
  revalidatePath("/agentes");
}

export async function aprovarAcao(actionId: string): Promise<ResultadoAcao> {
  const s = await exigirSessao();
  const r = await executarAcao(actionId, s.email);
  revalidatePath("/agentes");
  revalidatePath("/");
  return r;
}

export async function recusarAcao(actionId: string) {
  const s = await exigirSessao();
  await recusar(actionId, s.email);
  revalidatePath("/agentes");
  revalidatePath("/");
}

export async function desfazerAcao(actionId: string): Promise<ResultadoAcao> {
  const s = await exigirSessao();
  const r = await desfazer(actionId, s.email);
  revalidatePath("/agentes");
  return r;
}

export async function excluirAgente(agentId: string) {
  const s = await exigirSessao();
  const a = await db.agent.findUnique({ where: { id: agentId } });
  await db.agent.delete({ where: { id: agentId } });
  await auditar(s.email, "agente_excluido", a?.slug ?? agentId);
  revalidatePath("/agentes");
}


/**
 * Instala (ou reinstala o que faltar) os 6 agentes do playbook + recepcao.
 * Idempotente: agente que ja existe NAO tem prompt sobrescrito — so ganha
 * gatilho se ainda nao tiver.
 */
export async function instalarAgentesPadrao() {
  const s = await exigirSessao();
  const { garantirAgentesPadrao } = await import("@/lib/instalar-agentes");
  const r = await garantirAgentesPadrao(s.email);
  await auditar(s.email, "agentes_instalados", `${r.criados.length} criado(s): ${r.criados.join(", ") || "nenhum"}`);
  revalidatePath("/agentes");
}

/** Roda o agente agora, sem esperar a agenda. */
export async function rodarAgora(agentId: string) {
  const s = await exigirSessao();
  const { rodarAgente } = await import("@/lib/rodada");
  const r = await rodarAgente(agentId);
  await auditar(s.email, "rodada_manual", `${r.agente}: ${r.propostas} proposta(s)`);
  revalidatePath("/agentes");
  revalidatePath(`/agentes/${agentId}`);
  return r;
}
