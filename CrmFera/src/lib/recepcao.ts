import { db } from "@/lib/db";
import { promptPadrao } from "@/lib/prompt-recepcao";
import { atenderCom, type ResultadoAtendimento } from "@/lib/agente-conversa";
import { SLUG_RECEPCAO } from "@/lib/seletor-agente";

/**
 * AGENTE 1 — RECEPCAO (a porta do anuncio Click-to-WhatsApp no numero OFICIAL).
 *
 * Desde 2026-08-22 o motor de conversa e generico (`agente-conversa.ts`) e o
 * agente que atende cada mensagem e escolhido pelo gatilho
 * (`seletor-agente.ts`). A recepcao e o que sobra quando nenhum gatilho casa:
 * quem chega pelo anuncio, sem tag. Este arquivo so preserva a API antiga
 * (`atender(contactId)`) pros scripts de simulacao e pro webhook.
 */

export { promptPadrao, SLUG_RECEPCAO };
export type ResultadoRecepcao = ResultadoAtendimento;

/** Roda a recepcao num contato, sem passar pelo seletor (teste/simulacao). */
export async function atender(contactId: string): Promise<ResultadoRecepcao> {
  const agente = await db.agent.findUnique({ where: { slug: SLUG_RECEPCAO } });
  if (!agente) return { atendeu: false, motivo: "agente de recepcao nao existe" };
  if (!agente.prompt) return atenderCom({ ...agente, prompt: promptPadrao() }, contactId);
  return atenderCom(agente, contactId);
}
