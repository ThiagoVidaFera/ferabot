import { NextRequest, NextResponse } from "next/server";
import { marcarFerabotVisto, tokenDoFerabotConfere } from "@/lib/jornada-estado";
import { atualizarEstadoWhatsapp, ligarServidorWhatsapp } from "@/lib/whatsapp-cliente";
import { auditar } from "@/lib/audit";

export const dynamic = "force-dynamic";

const TAMANHO_MAXIMO = 4000;

async function recusa(req: NextRequest): Promise<NextResponse | null> {
  if (await tokenDoFerabotConfere(req.headers.get("x-ferabot-token"))) return null;
  return NextResponse.json({ ok: false, erro: "codigo de ligacao invalido" }, { status: 401 });
}

/**
 * O FERABOT acabou de subir o WhatsApp na VPS do cliente e liga o servidor a este painel.
 * Corpo: { url, apiKey, sessao? }. A chave nunca volta na resposta.
 */
export async function POST(req: NextRequest) {
  const negado = await recusa(req);
  if (negado) return negado;
  const bruto = await req.text();
  if (bruto.length > TAMANHO_MAXIMO) return NextResponse.json({ ok: false, erro: "corpo grande demais" }, { status: 413 });
  let corpo: { url?: unknown; apiKey?: unknown; sessao?: unknown };
  try {
    corpo = JSON.parse(bruto);
  } catch {
    return NextResponse.json({ ok: false, erro: "json invalido" }, { status: 400 });
  }

  const resultado = await ligarServidorWhatsapp({ url: corpo.url, apiKey: corpo.apiKey, sessao: corpo.sessao });
  await marcarFerabotVisto();
  await auditar("ferabot", "whatsapp.servidor", resultado.ok ? "ligado" : "recusado");
  return NextResponse.json(resultado, { status: resultado.ok ? 200 : 422 });
}

/** Estado atual do WhatsApp: o FERABOT pergunta depois que o dono lê o QR. */
export async function GET(req: NextRequest) {
  const negado = await recusa(req);
  if (negado) return negado;
  const estado = await atualizarEstadoWhatsapp();
  return NextResponse.json({ ok: true, status: estado.status, telefone: estado.telefone ?? null });
}
