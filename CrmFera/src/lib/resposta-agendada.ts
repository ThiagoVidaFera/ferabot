import { db } from "@/lib/db";
import { config } from "@/lib/config";
import { auditar } from "@/lib/audit";

/**
 * Atraso humano nas respostas do robô: cada
 * resposta sai de 1 a 3 minutos depois da mensagem do lead, pra não parecer
 * máquina. O webhook NÃO espera: ele só agenda (`customFields.resposta_pendente`),
 * e o cron de follow-up (a cada minuto) dispara quando vence. É durável: um
 * deploy no meio da espera não perde a resposta.
 *
 * O sorteio é de 60 a 100 s porque o cron tem granularidade de 1 min e a geração
 * leva uns segundos: somando, a resposta cai entre 1 e 3 minutos. Cada mensagem
 * nova do lead reinicia o relógio — uma rajada gera UMA resposta, depois da última.
 *
 * Desliga com Setting `resposta_atraso_ativo` = "0" (volta a responder na hora).
 */

export type TipoResposta = "agente" | "agenda";

export type RespostaPendente = {
  status: "pendente" | "processando";
  tipo: TipoResposta;
  sessao: string | null;
  agendadoEm: string;
  devidaEm: string;
};

export const ATRASO_MIN_S = 60;
export const ATRASO_MAX_S = 100;

export function sortearAtrasoMs(minS = ATRASO_MIN_S, maxS = ATRASO_MAX_S, aleatorio: () => number = Math.random): number {
  return Math.round((minS + aleatorio() * (maxS - minS)) * 1000);
}

export function lerPendente(campos: unknown): RespostaPendente | null {
  const r = (campos as Record<string, unknown> | null)?.resposta_pendente;
  if (!r || typeof r !== "object") return null;
  const p = r as Partial<RespostaPendente>;
  return typeof p.devidaEm === "string" && typeof p.agendadoEm === "string" && p.status && p.tipo
    ? (p as RespostaPendente)
    : null;
}

export async function atrasoLigado(): Promise<boolean> {
  return (await config("resposta_atraso_ativo", "RESPOSTA_ATRASO_ATIVO", "1")) !== "0";
}

async function gravar(contactId: string, valor: RespostaPendente | null) {
  const c = await db.contact.findUnique({ where: { id: contactId }, select: { customFields: true } });
  if (!c) return;
  const { resposta_pendente: _antigo, ...resto } = (c.customFields ?? {}) as Record<string, unknown>;
  await db.contact.update({
    where: { id: contactId },
    data: { customFields: (valor ? { ...resto, resposta_pendente: valor } : resto) as never },
  });
}

/** Agenda (ou REAGENDA, se já havia uma) a resposta pra daqui a 60–100 s. */
export async function agendarResposta(
  contactId: string,
  tipo: TipoResposta,
  sessao: string | null | undefined,
  agora: Date = new Date(),
) {
  await gravar(contactId, {
    status: "pendente",
    tipo,
    sessao: sessao ?? null,
    agendadoEm: agora.toISOString(),
    devidaEm: new Date(agora.getTime() + sortearAtrasoMs()).toISOString(),
  });
}

export type ResultadoRespostas = { vencidas: number; respondidas: number };

let emAndamento = false;

/** Dispara as respostas vencidas. `executar` é quem de fato atende (injetado: evita import circular). */
export async function processarRespostasAgendadas(
  executar: (contactId: string, tipo: TipoResposta, sessao: string | null) => Promise<unknown>,
  agora: Date = new Date(),
): Promise<ResultadoRespostas> {
  const res: ResultadoRespostas = { vencidas: 0, respondidas: 0 };
  if (emAndamento) return res;
  emAndamento = true;
  try {
    const candidatos = await db.contact.findMany({
      where: { customFields: { path: "$.resposta_pendente.status", equals: "pendente" } },
      select: { id: true, customFields: true },
    });
    for (const c of candidatos) {
      const p = lerPendente(c.customFields);
      if (!p || p.status !== "pendente" || agora.getTime() < new Date(p.devidaEm).getTime()) continue;
      res.vencidas++;
      await gravar(c.id, { ...p, status: "processando" });
      try {
        await executar(c.id, p.tipo, p.sessao);
        res.respondidas++;
      } catch (e) {
        await auditar("cron:resposta-agendada", "resposta_falhou", `${c.id}: ${e instanceof Error ? e.message : String(e)}`.slice(0, 200));
      } finally {
        // se chegou mensagem nova durante o atendimento, o reagendamento já
        // gravou outro `agendadoEm`: não apaga o relógio novo
        const atual = await db.contact.findUnique({ where: { id: c.id }, select: { customFields: true } });
        const ainda = lerPendente(atual?.customFields);
        if (ainda && ainda.agendadoEm === p.agendadoEm) await gravar(c.id, null);
      }
    }
    return res;
  } finally {
    emAndamento = false;
  }
}
