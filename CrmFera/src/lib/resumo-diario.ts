import { db } from "@/lib/db";
import { avisar } from "@/lib/notificacao";
import { tagsDe } from "@/lib/tags";
import { ehRespostaAutomatica } from "@/lib/resposta-automatica";
import { primeiroNome } from "@/lib/telefone";
import { config } from "@/lib/config";

/**
 * RESUMO DO DIA do número principal do CRM.
 *
 * Os agentes trabalham sem ninguém olhando: conversa com `revisar` e lead quente esperando gente
 * passam despercebidos. Uma vez por dia, a partir das 18h de Brasília, o dono recebe o placar e a
 * lista de quem precisa de gente. Cada dia sai uma vez só (`avisar` deduplica pela chave).
 * Número: o da Setting `resumo_sessao` ou o padrão do CRM.
 */

const DIA_MS = 24 * 60 * 60 * 1000;
const HORA_ENVIO = 18;
const MAX_NOMES = 6;

export type PlacarDia = {
  enviadas: number;
  responderam: string[];
  esperandoGente: string[];
  revisar: string[];
};

export function horaDeBrasilia(agora: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", hour: "numeric", hourCycle: "h23" })
      .formatToParts(agora)
      .find((p) => p.type === "hour")?.value ?? 0,
  );
}

const lista = (nomes: string[]): string =>
  nomes.length
    ? nomes.slice(0, MAX_NOMES).join(", ") + (nomes.length > MAX_NOMES ? ` e mais ${nomes.length - MAX_NOMES}` : "")
    : "ninguém";

export function textoResumo(p: PlacarDia): string {
  return [
    `Hoje no seu número: *${p.enviadas}* mensagens enviadas pelo robô e *${p.responderam.length}* pessoas responderam.`,
    `*Responderam:* ${lista(p.responderam)}`,
    `*Esperando você (o robô parou):* ${lista(p.esperandoGente)}`,
    `*O robô não conseguiu responder (revisar):* ${lista(p.revisar)}`,
  ].join("\n\n");
}

export async function placarDoDia(agora: Date): Promise<PlacarDia | null> {
  const sessao = (await config("resumo_sessao", "RESUMO_SESSAO", "")) || "";
  const inst = sessao
    ? await db.whatsappInstance.findFirst({ where: { instanceName: sessao } })
    : await db.whatsappInstance.findFirst({ where: { isDefault: true }, orderBy: { createdAt: "desc" } });
  if (!inst) return null;
  const desde = new Date(agora.getTime() - DIA_MS);

  const msgs = await db.whatsappMessage.findMany({
    where: { instanceId: inst.id, timestamp: { gte: desde }, contactId: { not: null } },
    select: { contactId: true, direction: true, body: true, metadata: true },
  });
  const enviadas = msgs.filter(
    (m) => m.direction === "outbound" && ["agente", "followup", "sequencia-iscas"].includes(String((m.metadata as Record<string, unknown>)?.origem)),
  ).length;
  const quemRespondeu = new Set(
    msgs.filter((m) => m.direction === "inbound" && !ehRespostaAutomatica(m.body)).map((m) => m.contactId as string),
  );

  // Só gente que conversou NESTE número nos últimos 3 dias (humano/revisar de outros números ficam de fora).
  const dosUltimos3Dias = await db.whatsappMessage.findMany({
    where: { instanceId: inst.id, timestamp: { gte: new Date(agora.getTime() - 3 * DIA_MS) }, contactId: { not: null } },
    select: { contactId: true, direction: true },
    orderBy: { timestamp: "asc" },
  });
  // Quem ficou com a ÚLTIMA fala do lado dele (sem resposta nossa): é quem de fato espera.
  const ultimaDoLead = new Map<string, boolean>();
  for (const m of dosUltimos3Dias) ultimaDoLead.set(m.contactId as string, m.direction === "inbound");
  const contatos = await db.contact.findMany({
    where: { id: { in: Array.from(ultimaDoLead.keys()) } },
    select: { id: true, name: true, tags: true },
  });
  const nome = (c: { name: string }) => primeiroNome(c.name) || c.name;
  const recentes = contatos;

  return {
    enviadas,
    responderam: contatos.filter((c) => quemRespondeu.has(c.id)).map(nome),
    esperandoGente: recentes.filter((c) => ultimaDoLead.get(c.id) && tagsDe(c.tags).includes("humano")).map(nome),
    revisar: recentes.filter((c) => ultimaDoLead.get(c.id) && tagsDe(c.tags).includes("revisar")).map(nome),
  };
}

/** Chamado a cada rodada do cron (5 min): só age depois das 18h e uma vez por dia. */
export async function enviarResumoDiario(agora = new Date()): Promise<{ enviado: boolean; motivo?: string }> {
  if (horaDeBrasilia(agora) < HORA_ENVIO) return { enviado: false, motivo: "ainda não é hora" };
  const placar = await placarDoDia(agora);
  if (!placar) return { enviado: false, motivo: "nenhum número de WhatsApp conectado" };

  const dia = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(agora);
  const texto = textoResumo(placar);
  const r = await avisar("resumo", `resumo-dono:${dia}`, texto);
  return { enviado: r.enviado, motivo: r.motivo };
}
