import { NextRequest, NextResponse } from "next/server";
import { tokensIguais } from "@/lib/cofre";
import { tokenDoFerabotConfere } from "@/lib/jornada-estado";
import { lerPlano, salvarPlano } from "@/lib/plano-cliente-banco";

export const dynamic = "force-dynamic";

const TAMANHO_MAXIMO = 400_000;
const TAMANHO_MINIMO_DA_CHAVE = 32;

/**
 * Quem pode ler e gravar o plano: o onboarding (chave de acompanhamento do painel,
 * `x-admin-key`) e o FERABOT do dono (`x-ferabot-token`).
 */
async function autorizado(req: NextRequest): Promise<boolean> {
  const admin = process.env.PAINEL_ADMIN_KEY ?? "";
  const chave = req.headers.get("x-admin-key");
  if (chave && admin.length >= TAMANHO_MINIMO_DA_CHAVE && tokensIguais(chave, admin)) return true;
  return tokenDoFerabotConfere(req.headers.get("x-ferabot-token"));
}

export async function GET(req: NextRequest) {
  if (!(await autorizado(req))) return NextResponse.json({ ok: false, erro: "sem permissao" }, { status: 401 });
  return NextResponse.json({ ok: true, plano: await lerPlano() });
}

export async function POST(req: NextRequest) {
  if (!(await autorizado(req))) return NextResponse.json({ ok: false, erro: "sem permissao" }, { status: 401 });

  const bruto = await req.text();
  if (bruto.length > TAMANHO_MAXIMO) return NextResponse.json({ ok: false, erro: "plano grande demais" }, { status: 413 });

  let corpo: unknown;
  try {
    corpo = JSON.parse(bruto);
  } catch {
    return NextResponse.json({ ok: false, erro: "json invalido" }, { status: 400 });
  }

  const resultado = await salvarPlano(corpo);
  if (!resultado.ok) return NextResponse.json({ ok: false, erro: resultado.erro }, { status: 422 });
  const p = resultado.plano;
  return NextResponse.json({
    ok: true,
    plano: { headlines: p.headlines.length, roteirosYoutube: p.roteirosYoutube.length, postsInstagram: p.postsInstagram.length },
  });
}
