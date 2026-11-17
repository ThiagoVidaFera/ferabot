import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agentePorToken } from "@/lib/agentes";

export const dynamic = "force-dynamic";

/** GET /api/agentes/contatos/:id — detalhe + ultimos 20 eventos */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const agente = await agentePorToken(req.headers.get("x-agent-token"));
  if (!agente) return NextResponse.json({ ok: false, erro: "token invalido" }, { status: 401 });

  // GOTCHA 5 do megaprompt: no Next 16, params e Promise.
  const { id } = await params;

  const contato = await db.contact.findUnique({
    where: { id },
    include: {
      timelineEvents: { orderBy: { timestamp: "desc" }, take: 20 },
      purchases: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!contato) return NextResponse.json({ ok: false, erro: "nao encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true, contato });
}
