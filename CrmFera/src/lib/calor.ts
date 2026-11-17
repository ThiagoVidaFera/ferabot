/**
 * Calor do lead (0-100): quanto ele merece atencao agora.
 * Extraido de `notificacao.ts` para ser PURO e reaproveitado pela fila de
 * "falou e ninguem respondeu" sem uma consulta por contato. A regra e a
 * mesma de sempre — responder no WhatsApp 40, conversa >=3 mensagens +15,
 * ja comprou +25, call/proposta +25, origem conhecida +10, mensagem >120
 * caracteres +15.
 */

export type ContatoParaCalor = {
  purchaseCount: number;
  lifecycleStage: string;
  origem: string;
};

export type EventoParaCalor = { eventType: string; metadata: unknown };

export type Calor = { pontos: number; motivos: string[] };

const LIMITE_MENSAGEM_LONGA = 120;

function metaDe(e: EventoParaCalor): Record<string, unknown> {
  return e.metadata && typeof e.metadata === "object" ? (e.metadata as Record<string, unknown>) : {};
}

export function calorDe(c: ContatoParaCalor, eventos: readonly EventoParaCalor[]): Calor {
  const recebidas = eventos.filter(
    (e) => e.eventType === "whatsapp_message" && metaDe(e).direcao === "recebida",
  );
  const motivos: string[] = [];
  let pontos = 0;

  if (recebidas.length >= 1) {
    pontos += 40;
    motivos.push("respondeu no WhatsApp");
  }
  if (recebidas.length >= 3) {
    pontos += 15;
    motivos.push("conversa em andamento");
  }
  if (c.purchaseCount > 0) {
    pontos += 25;
    motivos.push("já comprou");
  }
  if (["call_marcada", "proposta"].includes(c.lifecycleStage)) {
    pontos += 25;
    motivos.push(`está em ${c.lifecycleStage}`);
  }
  if (c.origem !== "outro" && c.origem !== "base") {
    pontos += 10;
    motivos.push(`veio de ${c.origem}`);
  }

  // Texto longo e sinal de interesse real — quem so manda "oi" nao conta igual.
  const maiorTexto = recebidas.reduce(
    (max, e) => Math.max(max, String(metaDe(e).texto ?? "").length),
    0,
  );
  if (maiorTexto > LIMITE_MENSAGEM_LONGA) {
    pontos += 15;
    motivos.push("escreveu mensagem longa");
  }

  return { pontos: Math.min(100, pontos), motivos };
}
