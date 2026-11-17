import { NextRequest, NextResponse } from "next/server";
import { registrarVenda, type EntradaVenda } from "@/lib/vendas";
import { auditar } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/venda
 * body: {nome, email?, whatsapp?, produto, valorCentavos, origem?, externalId?}
 *
 * Contrato literal do megaprompt. Segredo OPCIONAL: se `WEBHOOK_VENDA_TOKEN`
 * estiver no .env, exige o header `x-webhook-token`; sem a env, o endpoint fica
 * aberto (como no doc) e continua testavel por curl puro.
 */
export async function POST(req: NextRequest) {
  const esperado = process.env.WEBHOOK_VENDA_TOKEN;
  if (esperado && req.headers.get("x-webhook-token") !== esperado) {
    return NextResponse.json({ ok: false, erro: "token invalido" }, { status: 401 });
  }

  let corpo: EntradaVenda;
  try {
    corpo = (await req.json()) as EntradaVenda;
  } catch {
    return NextResponse.json({ ok: false, erro: "json invalido" }, { status: 400 });
  }

  try {
    const r = await registrarVenda(corpo);
    await auditar(
      "webhook:venda",
      r.duplicada ? "venda_duplicada_ignorada" : "venda_registrada",
      `${corpo.produto} ${corpo.valorCentavos} -> ${r.contactId}`,
    );
    return NextResponse.json(r);
  } catch (e) {
    const erro = e instanceof Error ? e.message : String(e);
    await auditar("webhook:venda", "venda_erro", erro);
    return NextResponse.json({ ok: false, erro }, { status: 400 });
  }
}
