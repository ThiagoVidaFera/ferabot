import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { config } from "@/lib/config";
import { tokensIguais } from "@/lib/cofre";
import { contarLeadsReais, ferabotVistoEm, jornadaAtual, lerEntregas, ultimaAtividade } from "@/lib/jornada-estado";
import { contarProgresso, lerPlano, lerProgresso } from "@/lib/plano-cliente-banco";
import { negocio } from "@/lib/negocio";

export const dynamic = "force-dynamic";

const SETE_DIAS_MS = 7 * 86_400_000;
/** Chave curta é adivinhável: abaixo disto a rota se comporta como se não existisse. */
const TAMANHO_MINIMO_DA_CHAVE = 32;

/**
 * Resumo deste painel para quem acompanha vários clientes (a visão geral do mentor).
 * Só existe quando o servidor define `PAINEL_ADMIN_KEY` com 32+ caracteres (uma por painel); sem ela a rota some (404).
 * Não devolve chave nem conversa: só o andamento.
 */
export async function GET(req: NextRequest) {
  const esperado = process.env.PAINEL_ADMIN_KEY ?? "";
  if (esperado.length < TAMANHO_MINIMO_DA_CHAVE) return NextResponse.json({ ok: false }, { status: 404 });
  if (!tokensIguais(req.headers.get("x-admin-key") ?? "", esperado)) {
    return NextResponse.json({ ok: false, erro: "chave de acompanhamento invalida" }, { status: 401 });
  }

  const desde = new Date(Date.now() - SETE_DIAS_MS);
  const [jornada, visto, entregas, nome, leads, leads7d, leadsReais, paradoDesde, plano, progresso] = await Promise.all([
    jornadaAtual(),
    ferabotVistoEm(),
    lerEntregas(),
    config("negocio_nome"),
    db.contact.count(),
    db.contact.count({ where: { createdAt: { gte: desde } } }),
    contarLeadsReais(),
    ultimaAtividade(),
    lerPlano(),
    lerProgresso(),
  ]);
  const trilha = (p: (typeof jornada.atuais)["tecnica"]) => (p ? `${p.numero}. ${p.titulo}` : "concluída");

  return NextResponse.json({
    ok: true,
    negocio: nome || negocio().nome,
    jornada: {
      feitos: jornada.feitos,
      total: jornada.total,
      atual: jornada.atual ? `${jornada.atual.numero}. ${jornada.atual.titulo}` : "concluída",
      falta: jornada.atual?.itens.filter((i) => !i.feito).map((i) => i.texto) ?? [],
    },
    trilhas: { tecnica: trilha(jornada.atuais.tecnica), conteudo: trilha(jornada.atuais.conteudo) },
    ferabotVistoEm: visto || null,
    /** última vez que o dono avançou (marco, entrega, roteiro, plano aprovado); null = nunca */
    paradoDesde: paradoDesde,
    leads,
    leads7d,
    leadsReais,
    plano: { ...contarProgresso(plano, progresso), posts: plano.postsInstagram.length, aprovado: Boolean(plano.aprovadoEm) },
    ultimasEntregas: entregas.slice(0, 5),
  });
}
