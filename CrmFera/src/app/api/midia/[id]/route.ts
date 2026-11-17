import { NextRequest, NextResponse } from "next/server";
import { lerMidia } from "@/lib/midia";
import { sessaoAtual } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Serve a midia guardada. Exige sessao — nao e pasta publica. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await sessaoAtual())) {
    return NextResponse.json({ erro: "nao autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const m = lerMidia(id);
  if (!m) return NextResponse.json({ erro: "nao encontrado" }, { status: 404 });

  return new NextResponse(new Uint8Array(m.buf), {
    headers: {
      "Content-Type": m.mimetype,
      "Cache-Control": "private, max-age=86400",
    },
  });
}
