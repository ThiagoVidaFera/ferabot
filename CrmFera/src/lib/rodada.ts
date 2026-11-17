import { db } from "@/lib/db";
import { podeTocarContato } from "@/lib/pode-tocar";
import { auditar } from "@/lib/audit";
import { gerar } from "@/lib/ia";
import { propor } from "@/lib/agentes";
import { filaDoDia } from "@/lib/followup";
import { linhaDoTempo } from "@/lib/timeline";
import { primeiroNome } from "@/lib/telefone";

/**
 * A rodada do agente.
 *
 * Sem isto, os agentes são um endpoint parado esperando alguém chamar — e
 * ninguém chama. Aqui o agente acorda no horário, varre a fila que lhe cabe e
 * enche a trilha de PROPOSTAS. Você abre o Painel de manhã e aprova o que
 * presta. É o que faz "cadastrar um funcionário de IA" virar verdade.
 *
 * Nada sai sem aprovação, a menos que o agente esteja em modo autônomo — que
 * nasce desligado e precisa ser trocado na mão.
 */

const TETO_POR_RODADA = 25;

export type ResultadoRodada = {
  agente: string;
  analisados: number;
  propostas: number;
  falhas: number;
  erro?: string;
};

function horaAgora(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** "diaria:09:00" venceu? Só uma vez por dia, a partir do horário marcado. */
export function deveRodar(agenda: string | null, ultima: Date | null): boolean {
  if (!agenda) return false;
  const [tipo, hora] = agenda.split(":").length >= 2
    ? [agenda.split(":")[0], agenda.slice(agenda.indexOf(":") + 1)]
    : [agenda, "09:00"];
  if (tipo !== "diaria") return false;

  if (horaAgora() < hora) return false;

  if (ultima) {
    const hoje = new Date();
    const mesmoDia =
      ultima.getFullYear() === hoje.getFullYear() &&
      ultima.getMonth() === hoje.getMonth() &&
      ultima.getDate() === hoje.getDate();
    if (mesmoDia) return false;
  }
  return true;
}

/** Contexto do contato que vai no prompt — só o que ajuda a escrever. */
async function contexto(contactId: string): Promise<string> {
  const c = await db.contact.findUnique({ where: { id: contactId } });
  if (!c) return "";
  const eventos = await linhaDoTempo(contactId, 12);
  const tags = Array.isArray(c.tags) ? (c.tags as string[]) : [];

  const historico = eventos
    .slice()
    .reverse()
    .map((e) => {
      const m = (e.metadata ?? {}) as Record<string, unknown>;
      const quando = e.timestamp.toLocaleDateString("pt-BR");
      const texto = String(m.texto ?? m.product ?? "");
      const quem = m.direcao === "recebida" ? "ELE" : m.direcao === "enviada" ? "EU" : "sistema";
      return `- ${quando} [${e.eventType}${m.direcao ? "/" + quem : ""}] ${texto}`.slice(0, 220);
    })
    .join("\n");

  return [
    `Nome: ${c.name}`,
    `Primeiro nome: ${primeiroNome(c.name)}`,
    `Estágio: ${c.lifecycleStage}`,
    `Origem: ${c.origem}`,
    tags.length ? `Tags: ${tags.join(", ")}` : "",
    c.purchaseCount ? `Já comprou ${c.purchaseCount}x` : "Nunca comprou",
    "",
    "Linha do tempo (mais antigo primeiro):",
    historico || "- (sem histórico)",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function rodarAgente(agentId: string): Promise<ResultadoRodada> {
  const agente = await db.agent.findUnique({ where: { id: agentId } });
  if (!agente) return { agente: "?", analisados: 0, propostas: 0, falhas: 0, erro: "nao encontrado" };
  if (!agente.ativo) {
    return { agente: agente.slug, analisados: 0, propostas: 0, falhas: 0, erro: "desligado" };
  }

  const alvo = agente.alvo ?? "followup";
  let contatos: Array<{ contactId: string; motivo: string }> = [];

  if (alvo === "followup") {
    const fila = await filaDoDia(TETO_POR_RODADA);
    contatos = fila.map((f) => ({
      contactId: f.contactId,
      motivo: `etapa ${f.etapa.chave} (${f.etapa.rotulo}) · ${f.diasSemContato} dia(s) sem contato`,
    }));
  } else if (alvo === "novos") {
    const desde = new Date(Date.now() - 2 * 86400000);
    const novos = await db.contact.findMany({
      where: { createdAt: { gte: desde }, lifecycleStage: "novo", phone: { not: null } },
      take: TETO_POR_RODADA,
      orderBy: { createdAt: "desc" },
    });
    contatos = novos.map((c) => ({ contactId: c.id, motivo: "chegou nas últimas 48h" }));
  } else {
    return { agente: agente.slug, analisados: 0, propostas: 0, falhas: 0, erro: `alvo desconhecido: ${alvo}` };
  }

  let propostas = 0;
  let falhas = 0;

  for (const alvoContato of contatos) {
    // Guarda central (13/11/2026): não propõe toque pra quem a régua não pode tocar.
    const toque = await podeTocarContato({ contactId: alvoContato.contactId, regua: `rodada:${agente.slug}`, seco: true });
    if (!toque.liberado) continue;
    // Já existe proposta aberta pra esse contato? Não empilha.
    const pendente = await db.agentAction.findFirst({
      where: { agentId, contactId: alvoContato.contactId, status: "proposta" },
    });
    if (pendente) continue;

    const ctx = await contexto(alvoContato.contactId);
    const entrada = `${ctx}\n\nPor que ele está na fila agora: ${alvoContato.motivo}\n\nEscreva APENAS a mensagem de WhatsApp que eu devo enviar. Sem aspas, sem assinatura, sem explicação.`;

    const r = await gerar(agente.prompt, entrada);
    if (!r.ok || !r.texto) {
      falhas++;
      continue;
    }

    try {
      await propor({
        agentId,
        contactId: alvoContato.contactId,
        acao: "enviar_mensagem",
        payload: {
          texto: r.texto,
          motivo: alvoContato.motivo,
          modelo: r.modelo,
          promptVersionId: agente.activeVersionId,
        },
      });
      propostas++;
    } catch {
      falhas++;
    }
  }

  await db.agent.update({ where: { id: agentId }, data: { ultimaRodada: new Date() } });
  await auditar(
    `agente:${agente.slug}`,
    "rodada",
    `${contatos.length} analisados · ${propostas} propostas · ${falhas} falhas`,
  );

  return { agente: agente.slug, analisados: contatos.length, propostas, falhas };
}

/** Chamado pelo relógio do servidor. Roda quem está na hora. */
export async function rodarAgendados(): Promise<ResultadoRodada[]> {
  const agentes = await db.agent.findMany({ where: { ativo: true, agenda: { not: null } } });
  const saida: ResultadoRodada[] = [];
  for (const a of agentes) {
    if (!deveRodar(a.agenda, a.ultimaRodada)) continue;
    try {
      saida.push(await rodarAgente(a.id));
    } catch (e) {
      saida.push({
        agente: a.slug,
        analisados: 0,
        propostas: 0,
        falhas: 0,
        erro: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return saida;
}
