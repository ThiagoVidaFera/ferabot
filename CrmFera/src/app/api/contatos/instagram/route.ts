import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { gravarInstagram } from "@/lib/gravar-instagram";

export const dynamic = "force-dynamic";

/**
 * POST /api/contatos/instagram  { telefone, instagram, fonte? }
 * Servidor-a-servidor (robô da agenda): exige `x-ingest-key`, sem modo público.
 */
export async function POST(req: NextRequest) {
  const chaveEsperada = await config("ingest_key", "INGEST_KEY");
  if (!chaveEsperada || req.headers.get("x-ingest-key") !== chaveEsperada) {
    return NextResponse.json({ ok: false, erro: "nao autorizado" }, { status: 401 });
  }

  let corpo: { telefone?: unknown; instagram?: unknown; fonte?: unknown };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ ok: false, erro: "json invalido" }, { status: 400 });
  }

  const fonte = typeof corpo.fonte === "string" && /^[a-z0-9-]{1,30}$/.test(corpo.fonte) ? corpo.fonte : "robo-agenda";
  try {
    const r = await gravarInstagram(corpo.telefone, corpo.instagram, fonte);
    if (!r.ok) return NextResponse.json({ ok: false, erro: r.erro }, { status: r.status });
    return NextResponse.json(r);
  } catch (e) {
    return NextResponse.json({ ok: false, erro: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
