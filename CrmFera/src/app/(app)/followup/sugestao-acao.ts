"use server";

import { sessaoAtual } from "@/lib/auth";
import { sugerirParaContato } from "@/lib/fila-sugestao-servico";

export type RespostaSugestao = { ok: true; texto: string; doCache: boolean } | { ok: false; erro: string };

/**
 * Pede (ou recupera do cache) a sugestao de resposta de UM contato.
 * Nao envia nada: devolve texto pra o humano copiar ou levar ao Inbox.
 */
export async function sugerirRespostaAcao(
  contactId: string,
  forcar = false,
): Promise<RespostaSugestao> {
  const sessao = await sessaoAtual();
  if (!sessao) return { ok: false, erro: "não autenticado" };
  if (typeof contactId !== "string" || !contactId) return { ok: false, erro: "contato inválido" };

  try {
    return await sugerirParaContato(contactId, { forcar });
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : "falha ao gerar a sugestão" };
  }
}
