import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { registrarCusto, type EntradaCusto } from "@/lib/aquisicao";
import { auditar } from "@/lib/audit";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * POST /api/custos — entrada de custo de anúncio.
 * body: {data:"AAAA-MM-DD", origem, campanha?, custoCentavos, impressoes?, cliques?}
 * ou    {custos:[...]} pra lote.
 * Protegido pelo mesmo token do webhook de venda, se configurado.
 */
export async function POST(req: NextRequest) {
  const esperado = await config("webhook_venda_token", "WEBHOOK_VENDA_TOKEN");
  if (esperado && req.headers.get("x-webhook-token") !== esperado) {
    return NextResponse.json({ ok: false, erro: "token invalido" }, { status: 401 });
  }

  let corpo: EntradaCusto | { custos: EntradaCusto[] };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ ok: false, erro: "json invalido" }, { status: 400 });
  }

  const lista = "custos" in corpo ? corpo.custos : [corpo];
  const resultados: Array<{ ok: boolean; origem: string; erro?: string }> = [];

  for (const c of lista) {
    try {
      await registrarCusto(c);
      resultados.push({ ok: true, origem: c.origem });
    } catch (e) {
      resultados.push({
        ok: false,
        origem: c.origem ?? "?",
        erro: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const gravados = resultados.filter((r) => r.ok).length;
  await auditar("api:custos", "custos_importados", `${gravados}/${lista.length}`);
  return NextResponse.json({ ok: true, gravados, resultados });
}

export async function GET() {
  const total = await db.custoAds.aggregate({ _sum: { custoCents: true }, _count: true });
  return NextResponse.json({
    ok: true,
    registros: total._count,
    totalCentavos: total._sum.custoCents ?? 0,
  });
}
