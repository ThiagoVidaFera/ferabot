import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agentePorToken, propor, descreverPayload } from "@/lib/agentes";

export const dynamic = "force-dynamic";

/**
 * POST /api/agentes/acoes — body {contactId, acao, payload}
 * modo `sugere`  -> cria AgentAction `proposta`
 * modo `autonomo`-> executa e registra `executada`
 * SEMPRE grava AuditEvent (dentro de `propor`).
 */
export async function POST(req: NextRequest) {
  const agente = await agentePorToken(req.headers.get("x-agent-token"));
  if (!agente) return NextResponse.json({ ok: false, erro: "token invalido" }, { status: 401 });

  let corpo: { contactId?: string; acao?: string; payload?: Record<string, unknown> };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ ok: false, erro: "json invalido" }, { status: 400 });
  }

  if (!corpo.contactId || !corpo.acao) {
    return NextResponse.json({ ok: false, erro: "contactId e acao obrigatorios" }, { status: 400 });
  }

  try {
    const r = await propor({
      agentId: agente.id,
      contactId: corpo.contactId,
      acao: corpo.acao,
      payload: corpo.payload ?? {},
    });
    return NextResponse.json({
      ok: true,
      id: r.acao.id,
      status: r.acao.status,
      modo: agente.modo,
      executada: r.executada,
      erro: r.erro,
      resumo: descreverPayload(r.acao.acao, (r.acao.payload ?? {}) as Record<string, unknown>),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, erro: e instanceof Error ? e.message : String(e) },
      { status: 400 },
    );
  }
}

/** GET — as acoes deste agente, pra ele saber o que ja propos. */
export async function GET(req: NextRequest) {
  const agente = await agentePorToken(req.headers.get("x-agent-token"));
  if (!agente) return NextResponse.json({ ok: false, erro: "token invalido" }, { status: 401 });

  const acoes = await db.agentAction.findMany({
    where: { agentId: agente.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ ok: true, acoes });
}
