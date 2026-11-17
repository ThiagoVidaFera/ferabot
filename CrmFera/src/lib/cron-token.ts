import { NextResponse } from "next/server";

/**
 * Trava das rotas /api/cron/*: com `CRON_FILA_TOKEN` na env, exige o header `x-cron-token`
 * igual a ele (o relógio do docker-compose manda). Sem a env, fica aberta (só faz sentido com o
 * CRM numa rede fechada). Devolve a resposta de recusa, ou null quando pode seguir.
 */
export function recusaSemTokenDeCron(req: Request): NextResponse | null {
  const esperado = process.env.CRON_FILA_TOKEN;
  if (!esperado) return null;
  if (req.headers.get("x-cron-token") === esperado) return null;
  return NextResponse.json({ ok: false, erro: "x-cron-token invalido" }, { status: 401 });
}
