import { NextRequest, NextResponse } from "next/server";
import { chavesParaOFerabot } from "@/lib/chaves";
import { marcarFerabotVisto, tokenDoFerabotConfere } from "@/lib/jornada-estado";
import { auditar } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * O FERABOT na máquina do dono busca aqui as chaves que ele salvou no painel.
 * Só responde com o código de ligação (`x-ferabot-token`), sempre por HTTPS em produção.
 */
export async function GET(req: NextRequest) {
  if (!(await tokenDoFerabotConfere(req.headers.get("x-ferabot-token")))) {
    return NextResponse.json({ ok: false, erro: "codigo de ligacao invalido" }, { status: 401 });
  }
  const chaves = await chavesParaOFerabot();
  await marcarFerabotVisto();
  await auditar("ferabot", "chaves.lidas", `${Object.keys(chaves).length} chave(s)`);
  return NextResponse.json({ ok: true, chaves }, { headers: { "Cache-Control": "no-store" } });
}
