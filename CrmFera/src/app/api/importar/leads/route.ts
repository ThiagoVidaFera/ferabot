import { NextRequest, NextResponse } from "next/server";
import { importarDoPainelAntigo } from "@/lib/importar-leads";
import { sessaoAtual } from "@/lib/auth";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Importa o painel antigo. Aceita sessao logada OU o token de webhook —
 * assim da pra chamar da tela e tambem agendar por fora.
 */
export async function POST(req: NextRequest) {
  const s = await sessaoAtual();
  const token = await config("webhook_venda_token", "WEBHOOK_VENDA_TOKEN");
  const autorizado = s || (token && req.headers.get("x-webhook-token") === token);
  if (!autorizado) {
    return NextResponse.json({ ok: false, erro: "nao autorizado" }, { status: 401 });
  }

  const r = await importarDoPainelAntigo(s?.email ?? "api");
  return NextResponse.json(r, { status: r.ok ? 200 : 502 });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
