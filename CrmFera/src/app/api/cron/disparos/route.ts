import { NextResponse } from "next/server";
import { recusaSemTokenDeCron } from "@/lib/cron-token";
import { processarAgendados } from "@/lib/broadcast";

export const dynamic = "force-dynamic";

/**
 * Gatilho da fila (cron do host chama a cada minuto, curl com timeout LONGO).
 *
 * AGUARDA o processamento de proposito: em Next 16 promise solta apos a
 * resposta e descartada (testado em 26/08 — fire-and-forget nunca rodou), e o
 * instrumentation nao e confiavel entre boots. Se o client abortar no meio,
 * o broadcast fica "enviando" orfao — e o proximo tick RETOMA: processarAgendados
 * reseta orfaos pra "agendado" e os contadores partem dos alvos ja enviados.
 */
async function rodar() {
  const n = await processarAgendados();
  return NextResponse.json({ ok: true, processados: n });
}

export async function POST(req: Request) {
  return recusaSemTokenDeCron(req) ?? rodar();
}

export async function GET(req: Request) {
  return recusaSemTokenDeCron(req) ?? rodar();
}
