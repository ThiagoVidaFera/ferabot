/**
 * LID -> telefone para mensagens do WAHA NOWEB.
 *
 * Achado em 13/11/2026: mensagem ENVIADA pela API (propostas, robôs) e parte das
 * RECEBIDAS num número comercial chegam com `from: "<lid>@lid"` e SEM `remoteJidAlt`.
 * O CRM descartava como "sem telefone identificavel" e respondia 200 — 134 mensagens sumiram
 * em 3 semanas (propostas inteiras, respostas de lead) sem nenhum erro aparecer.
 *
 * Ordem: o que o proprio banco ja sabe (barato, sem rede) e so entao o WAHA (`GET /api/<s>/lids/<lid>`).
 */

export interface FontesLid {
  /** Contato cujo `customFields.whatsapp_chat_id` e esse jid. */
  telefoneDoContatoPorChat: (jid: string) => Promise<string | null>;
  /** Contato de alguma mensagem antiga cujo externalId contem esse LID. */
  telefoneDoContatoPorMensagem: (jid: string) => Promise<string | null>;
  /** WAHA: `GET /api/<sessao>/lids/<lid>` -> `{ lid, pn }`. */
  perguntarAoWaha: (jid: string) => Promise<string | null>;
}

const soDigitos = (v: string): string => v.split("@")[0].replace(/\D/g, "");

/** Lê a resposta do endpoint `/lids/<lid>` do WAHA. */
export function telefoneDaRespostaLid(resposta: unknown): string {
  if (!resposta || typeof resposta !== "object") return "";
  const pn = (resposta as Record<string, unknown>).pn;
  return typeof pn === "string" ? soDigitos(pn) : "";
}

/** Devolve só dígitos do telefone real, ou "" se nenhuma fonte souber. Nunca lança. */
export async function resolverTelefoneDoLid(jid: string, fontes: FontesLid): Promise<string> {
  if (!jid || !jid.includes("@lid")) return "";
  const ordem = [fontes.telefoneDoContatoPorChat, fontes.telefoneDoContatoPorMensagem, fontes.perguntarAoWaha];
  for (const fonte of ordem) {
    try {
      const tel = await fonte(jid);
      if (tel && soDigitos(tel)) return soDigitos(tel);
    } catch {
      // uma fonte fora do ar nao pode derrubar a entrada da mensagem: tenta a proxima
    }
  }
  return "";
}

/** Consulta o WAHA com timeout curto (o webhook nao pode ficar pendurado). */
export async function perguntarLidAoWaha(
  conexao: { baseUrl: string; apiKey: string },
  sessao: string,
  jid: string,
  timeoutMs = 4000,
): Promise<string | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${conexao.baseUrl}/api/${encodeURIComponent(sessao)}/lids/${encodeURIComponent(jid)}`, {
      headers: { "X-Api-Key": conexao.apiKey },
      signal: ctrl.signal,
    });
    if (!r.ok) return null;
    return telefoneDaRespostaLid(await r.json()) || null;
  } finally {
    clearTimeout(t);
  }
}
