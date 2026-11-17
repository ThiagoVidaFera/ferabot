import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { gravarProposta } from "@/lib/proposta-contato";

export const dynamic = "force-dynamic";

/**
 * POST /api/contatos/proposta  { telefone, ofertaBase, link, entregas?, fonte? }
 * Servidor-a-servidor (skill proposta-fera): exige `x-ingest-key`, sem modo publico.
 * Guarda a oferta da proposta no contato; o follow-up do agente le dali.
 */
export async function POST(req: NextRequest) {
  const chaveEsperada = await config("ingest_key", "INGEST_KEY");
  if (!chaveEsperada || req.headers.get("x-ingest-key") !== chaveEsperada) {
    return NextResponse.json({ ok: false, erro: "nao autorizado" }, { status: 401 });
  }

  let corpo: { telefone?: unknown; ofertaBase?: unknown; link?: unknown; entregas?: unknown; fonte?: unknown };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ ok: false, erro: "json invalido" }, { status: 400 });
  }

  const fonte = typeof corpo.fonte === "string" && /^[a-z0-9-]{1,30}$/.test(corpo.fonte) ? corpo.fonte : "skill-proposta";
  try {
    const r = await gravarProposta(corpo.telefone, corpo, fonte);
    if (!r.ok) return NextResponse.json({ ok: false, erro: r.erro }, { status: r.status });
    return NextResponse.json(r);
  } catch (e) {
    return NextResponse.json({ ok: false, erro: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
