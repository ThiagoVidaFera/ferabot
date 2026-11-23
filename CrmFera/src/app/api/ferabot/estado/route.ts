import { NextRequest, NextResponse } from "next/server";
import {
  jornadaAtual,
  marcarFerabotVisto,
  registrarEntrega,
  registrarMarco,
  registrarPerfil,
  tokenDoFerabotConfere,
} from "@/lib/jornada-estado";
import type { Jornada } from "@/lib/jornada";
import { tokensIguais } from "@/lib/cofre";

export const dynamic = "force-dynamic";

const TAMANHO_MAXIMO = 20_000;

type Corpo = {
  perfil?: unknown;
  marco?: { passo?: unknown; link?: unknown; resumo?: unknown; desfazer?: unknown };
  entrega?: { bot?: unknown; oque?: unknown; link?: unknown };
};

function resumo(jornada: Jornada) {
  return {
    feitos: jornada.feitos,
    total: jornada.total,
    concluida: jornada.concluida,
    atual: jornada.atual ? { numero: jornada.atual.numero, titulo: jornada.atual.titulo, prompt: jornada.atual.prompt } : null,
    trilhas: {
      conteudo: jornada.atuais.conteudo ? `${jornada.atuais.conteudo.numero}. ${jornada.atuais.conteudo.titulo}` : "concluída",
      tecnica: jornada.atuais.tecnica ? `${jornada.atuais.tecnica.numero}. ${jornada.atuais.tecnica.titulo}` : "concluída",
    },
    passos: jornada.passos.map((p) => ({
      numero: p.numero,
      id: p.id,
      trilha: p.trilha,
      titulo: p.titulo,
      feito: p.feito,
      itens: p.itens.map((i) => ({ texto: i.texto, feito: i.feito })),
    })),
  };
}

/** Chave de acompanhamento do painel (a equipe do Thiago registra os marcos da trilha técnica). */
function ehEquipe(req: NextRequest): boolean {
  const esperado = process.env.PAINEL_ADMIN_KEY ?? "";
  const chave = req.headers.get("x-admin-key");
  return Boolean(chave) && esperado.length >= 32 && tokensIguais(chave ?? "", esperado);
}

async function recusa(req: NextRequest): Promise<NextResponse | null> {
  if (ehEquipe(req)) return null;
  if (await tokenDoFerabotConfere(req.headers.get("x-ferabot-token"))) return null;
  return NextResponse.json({ ok: false, erro: "codigo de ligacao invalido" }, { status: 401 });
}

/** Em que passo da Jornada o dono está. O /fera lê isto para conduzir a conversa. */
export async function GET(req: NextRequest) {
  const negado = await recusa(req);
  if (negado) return negado;
  if (!ehEquipe(req)) await marcarFerabotVisto();
  return NextResponse.json({ ok: true, jornada: resumo(await jornadaAtual()) });
}

/** O FERABOT avisa o painel: perfil do dono, marco da Jornada cumprido, entrega feita. */
export async function POST(req: NextRequest) {
  const negado = await recusa(req);
  if (negado) return negado;

  const bruto = await req.text();
  if (bruto.length > TAMANHO_MAXIMO) {
    return NextResponse.json({ ok: false, erro: "corpo grande demais" }, { status: 413 });
  }
  let corpo: Corpo;
  try {
    corpo = JSON.parse(bruto) as Corpo;
  } catch {
    return NextResponse.json({ ok: false, erro: "json invalido" }, { status: 400 });
  }

  try {
    if (corpo.perfil) await registrarPerfil(corpo.perfil);
    if (corpo.marco) await registrarMarco(corpo.marco.passo, corpo.marco);
    if (corpo.entrega) await registrarEntrega(corpo.entrega);
  } catch (erro) {
    const motivo = erro instanceof Error ? erro.message : "dado invalido";
    return NextResponse.json({ ok: false, erro: motivo }, { status: 422 });
  }

  if (!ehEquipe(req)) await marcarFerabotVisto();
  return NextResponse.json({ ok: true, jornada: resumo(await jornadaAtual()) });
}
