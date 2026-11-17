/**
 * O mesmo lead pode chamar /api/leads/entrada duas vezes pelo mesmo funil (formulário da página
 * e, minutos depois, a reserva do horário). O contato é um só (junta por telefone); o que
 * duplicava era o evento "Entrou por …" na linha do tempo.
 */

export const JANELA_ENTRADA_REPETIDA_MS = 2 * 60 * 60 * 1000;

export interface EventoRecente {
  timestamp: Date;
  metadata: unknown;
}

function textoDe(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object") return "";
  const t = (metadata as Record<string, unknown>).texto;
  return typeof t === "string" ? t : "";
}

/** True se algum evento recente já diz a mesma coisa ("Entrou por <funil>…") dentro da janela. */
export function ehEntradaRepetida(
  recentes: readonly EventoRecente[],
  texto: string,
  agora: Date = new Date(),
): boolean {
  if (!texto) return false;
  return recentes.some(
    (e) => textoDe(e.metadata) === texto && agora.getTime() - e.timestamp.getTime() <= JANELA_ENTRADA_REPETIDA_MS,
  );
}
