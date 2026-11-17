/**
 * CONVITE DO RESUMO e PÁGINAS QUE ROBÔ NÃO MANDA.
 *
 * Alguns negócios preferem que o robô nunca mande a página de vendas: ele propõe e pergunta
 * "Posso te mandar aqui o resumo de como funciona?", e quem manda o resumo é o dono. Quando o lead
 * diz "pode", o motor marca `aguardando-pode` e segue para a proposta (proposta-auto.ts).
 *
 * Por que em código e não só no prompt: o modelo às vezes ignora regra de prompt. O guarda recusa
 * a página listada aqui e o motor marca `humano` quando o convite sai.
 *
 * No CRM FERA a lista começa VAZIA: os agentes padrão podem mandar a página da oferta principal.
 * Para travar uma página, coloque o domínio dela no Setting `paginas_sem_robo` (separado por vírgula).
 */

export const PERGUNTA_RESUMO = "Posso te mandar aqui o resumo de como funciona?";
export const PERGUNTA_RESUMO_IMPLEMENTACAO = PERGUNTA_RESUMO;

/** Domínios (sem protocolo) que robô nenhum manda. Lido do ambiente `PAGINAS_SEM_ROBO`. */
export const PAGINAS_DE_CONSULTORIA: readonly string[] = String(process.env.PAGINAS_SEM_ROBO ?? "")
  .split(",")
  .map((p) => p.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, ""))
  .filter(Boolean);

const semProtocolo = (u: string): string => u.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");

export function ehPaginaDeConsultoria(url: string): boolean {
  const u = semProtocolo(url);
  return PAGINAS_DE_CONSULTORIA.some((p) => u === p || u.startsWith(`${p}/`) || u.startsWith(`${p}?`));
}

/** Tira as páginas travadas da whitelist de links do guarda. */
export function semPaginasDeConsultoria(links: readonly string[]): string[] {
  return links.filter((l) => !ehPaginaDeConsultoria(l));
}

/** A mensagem cita alguma página travada (com ou sem https)? */
export function citaPaginaDeConsultoria(texto: string): boolean {
  const t = String(texto ?? "").toLowerCase();
  return PAGINAS_DE_CONSULTORIA.some((p) => t.includes(p));
}

/**
 * A mensagem traz o convite do resumo? Aceita pequenas variações do modelo
 * ("posso te mandar o resumo…", "posso te enviar aqui um resumo…").
 */
const CONVITE = /posso\s+te\s+(?:mandar|enviar)\s+(?:aqui\s+)?(?:o|um)\s+resumo\s+de\s+como\s+funciona/i;

export function ehConviteResumo(texto: string | null | undefined): boolean {
  return CONVITE.test(String(texto ?? ""));
}
