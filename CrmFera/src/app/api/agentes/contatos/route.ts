import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agentePorToken } from "@/lib/agentes";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

/** GET /api/agentes/contatos?estagio=&busca= — lista resumida */
export async function GET(req: NextRequest) {
  const agente = await agentePorToken(req.headers.get("x-agent-token"));
  if (!agente) return NextResponse.json({ ok: false, erro: "token invalido" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const estagio = searchParams.get("estagio");
  const busca = (searchParams.get("busca") ?? "").trim();

  const where: Prisma.ContactWhereInput = {};
  if (estagio) where.lifecycleStage = estagio;
  if (busca) {
    const digitos = busca.replace(/\D/g, "");
    where.OR = [
      { name: { contains: busca } },
      { email: { contains: busca.toLowerCase() } },
      ...(digitos ? [{ phone: { contains: digitos } }] : []),
    ];
  }

  const contatos = await db.contact.findMany({
    where,
    orderBy: [{ lastActivityAt: "desc" }, { createdAt: "desc" }],
    take: 200,
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      lifecycleStage: true,
      origem: true,
      tags: true,
      totalRevenue: true,
      lastActivityAt: true,
    },
  });

  return NextResponse.json({ ok: true, total: contatos.length, contatos });
}
