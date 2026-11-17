import { NextResponse } from "next/server";
import { gerarSugestoesDoDia } from "@/lib/fila-sugestao-servico";

export const dynamic = "force-dynamic";

/**
 * Rotina DIARIA da fila "falou e ninguem respondeu": gera a sugestao de
 * resposta dos primeiros da fila e deixa no cache. NAO envia mensagem nenhuma.
 *
 * Se `CRON_FILA_TOKEN` estiver na env, exige o header `x-cron-token` igual a
 * ele (a rota gasta IA). Sem a env, segue o padrao das outras rotas de cron
 * (chamada pelo crontab do host, na rede interna).
 *
 * Exemplo de linha de crontab do host (07:30 todo dia):
 *   30 7 * * *  curl -s -m 300 -H "x-cron-token: $CRON_FILA_TOKEN" http://127.0.0.1:3900/api/cron/fila-sem-resposta
 */
export async function GET(req: Request) {
  const esperado = process.env.CRON_FILA_TOKEN;
  if (esperado && req.headers.get("x-cron-token") !== esperado) {
    return NextResponse.json({ ok: false, erro: "não autorizado" }, { status: 401 });
  }

  try {
    const resumo = await gerarSugestoesDoDia();
    return NextResponse.json({ ok: true, ...resumo });
  } catch (e) {
    const erro = e instanceof Error ? e.message : "falha na rotina";
    console.error("[fila-sem-resposta] erro:", erro);
    return NextResponse.json({ ok: false, erro }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
