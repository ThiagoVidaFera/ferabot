import { NextRequest, NextResponse } from "next/server";
import { importarHistorico } from "@/lib/importar-historico";
import { sessaoAtual } from "@/lib/auth";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";
export const maxDuration = 800;

/** Importa o historico de conversa do WhatsApp. Operacao pontual e pesada. */
export async function POST(req: NextRequest) {
  const s = await sessaoAtual();
  const token = await config("webhook_venda_token", "WEBHOOK_VENDA_TOKEN");
  if (!s && !(token && req.headers.get("x-webhook-token") === token)) {
    return NextResponse.json({ ok: false, erro: "nao autorizado" }, { status: 401 });
  }

  const instanceId = new URL(req.url).searchParams.get("instancia") ?? undefined;
  const r = await importarHistorico(instanceId, s?.email ?? "api");
  return NextResponse.json(r, { status: r.ok ? 200 : 502 });
}
