import { db } from "@/lib/db";
import { AGENTES_PADRAO } from "@/lib/prompts";
import { promptPadrao } from "@/lib/prompt-recepcao";
import { SLUG_RECEPCAO } from "@/lib/seletor-agente";

/**
 * Instala os agentes padrao (o roster de prompts/index.ts + recepcao). IDEMPOTENTE:
 * - agente que nao existe: cria em modo `sugere`, com gatilho e prioridade da
 *   definicao, `ativo` so quando a porta existe de verdade; prompt vira v1;
 * - agente que ja existe e o prompt do CODIGO mudou: versiona o novo, MAS SO
 *   se todas as versoes ate agora foram de maquina (LEI 4 — edicao humana pela
 *   tela nunca e sobrescrita; ai a atualizacao e manual, na tela);
 * - preenche gatilho/prioridade so se estiverem vazios.
 *
 * Roda no boot (instrumentation.ts) e pelo botao "Instalar agentes padrao"
 * em /agentes.
 */
async function versionarSeMudouEForMaquina(
  agenteId: string,
  promptAtual: string,
  promptNovo: string,
  autor: string,
): Promise<boolean> {
  if (promptAtual === promptNovo) return false;

  const versoes = await db.agentPromptVersion.findMany({
    where: { agentId: agenteId },
    orderBy: { versao: "desc" },
  });
  const soMaquina = versoes.every((v) => /^(seed|boot|instalador|teste[-a-z]*)($| )/.test(v.autor));
  if (!soMaquina) return false;

  const versao = await db.agentPromptVersion.create({
    data: {
      agentId: agenteId,
      versao: (versoes[0]?.versao ?? 0) + 1,
      prompt: promptNovo,
      autor: `${autor} (prompt do código atualizado)`,
    },
  });
  await db.agent.update({ where: { id: agenteId }, data: { prompt: promptNovo, activeVersionId: versao.id } });
  return true;
}

export async function garantirAgentesPadrao(autor = "instalador") {
  const criados: string[] = [];
  const ajustados: string[] = [];

  for (const def of AGENTES_PADRAO) {
    const existente = await db.agent.findUnique({ where: { slug: def.slug } });
    if (!existente) {
      const criado = await db.agent.create({
        data: {
          name: def.nome,
          slug: def.slug,
          canal: "whatsapp",
          prompt: def.prompt,
          model: def.modelo ?? "gemini-2.5-flash",
          // playbook: nasce em Sugere, sobe pra autonomo depois de 20 propostas
          // sem correcao — salvo decisao explicita do dono na definicao.
          modo: def.modoPadrao ?? "sugere",
          ativo: def.ativoPadrao,
          gatilhoTag: def.gatilhoTag ?? null,
          gatilhoEstagio: def.gatilhoEstagio ?? null,
          gatilhoOrigem: def.gatilhoOrigem ?? null,
          prioridade: def.prioridade,
        },
      });
      const versao = await db.agentPromptVersion.create({
        data: { agentId: criado.id, versao: 1, prompt: def.prompt, autor },
      });
      await db.agent.update({ where: { id: criado.id }, data: { activeVersionId: versao.id } });
      criados.push(def.slug);
      continue;
    }

    const versionou = await versionarSeMudouEForMaquina(existente.id, existente.prompt, def.prompt, autor);
    if (versionou) ajustados.push(`${def.slug} (prompt atualizado)`);

    const remendo: Record<string, unknown> = {};
    if (!existente.gatilhoTag && !existente.gatilhoEstagio && !existente.gatilhoOrigem) {
      remendo.gatilhoTag = def.gatilhoTag ?? null;
      remendo.gatilhoEstagio = def.gatilhoEstagio ?? null;
      remendo.gatilhoOrigem = def.gatilhoOrigem ?? null;
    }
    if (!existente.prioridade && def.prioridade) remendo.prioridade = def.prioridade;
    if (Object.keys(remendo).length) {
      await db.agent.update({ where: { id: existente.id }, data: remendo });
      ajustados.push(def.slug);
    }
  }

  // Recepcao: garante que existe (porta de quem chega sem tag nenhuma).
  const recepcao = await db.agent.findUnique({ where: { slug: SLUG_RECEPCAO } });
  if (!recepcao) {
    const p = promptPadrao();
    const criado = await db.agent.create({
      data: {
        name: "Recepção",
        slug: SLUG_RECEPCAO,
        canal: "whatsapp",
        prompt: p,
        // Pro: o Flash repetia nome e terminava sem pergunta no teste de mesa de 30/10/2026
        model: "gemini-2.5-pro",
        modo: "sugere",
        // nasce ligada em SUGERE: o dono aprova cada resposta na Inbox antes de sair
        ativo: true,
        prioridade: 0,
      },
    });
    const versao = await db.agentPromptVersion.create({
      data: { agentId: criado.id, versao: 1, prompt: p, autor },
    });
    await db.agent.update({ where: { id: criado.id }, data: { activeVersionId: versao.id } });
    criados.push(SLUG_RECEPCAO);
  } else {
    const versionou = await versionarSeMudouEForMaquina(
      recepcao.id,
      recepcao.prompt,
      promptPadrao(),
      autor,
    );
    if (versionou) ajustados.push(`${SLUG_RECEPCAO} (prompt atualizado)`);
  }

  return { criados, ajustados };
}
