import { NextRequest, NextResponse } from "next/server";
import { criarFicha, type DadosLead } from "@/lib/ficha";
import { config } from "@/lib/config";
import { urlDoCrm } from "@/lib/url";

export const dynamic = "force-dynamic";

/**
 * POST /api/fichas
 * body: {dados: {...lead cru...}}   header: x-ficha-token
 * -> {ok, code, url, expira_em}
 *
 * Quem chama: um worker externo de follow-up, no instante em que um numero da equipe
 * fala com um lead novo. Ele manda o registro do lead como recebeu, e a resposta
 * e o link curto que vai no aviso do WhatsApp.
 *
 * O token e obrigatorio: sem ele qualquer um cria ficha com conteudo arbitrario
 * e ganha uma URL do nosso dominio pra hospedar o que quiser.
 */
export async function POST(req: NextRequest) {
  const esperado = await config("ficha_token", "FICHA_TOKEN");
  if (!esperado) {
    return NextResponse.json({ ok: false, erro: "ficha_token nao configurado" }, { status: 503 });
  }
  if (req.headers.get("x-ficha-token") !== esperado) {
    return NextResponse.json({ ok: false, erro: "token invalido" }, { status: 401 });
  }

  let corpo: { dados?: DadosLead };
  try {
    corpo = (await req.json()) as { dados?: DadosLead };
  } catch {
    return NextResponse.json({ ok: false, erro: "json invalido" }, { status: 400 });
  }

  const dados = corpo.dados;
  if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
    return NextResponse.json({ ok: false, erro: "dados obrigatorio" }, { status: 422 });
  }
  if (!String(dados.telefone ?? dados.whatsapp ?? "").trim() && !String(dados.nome ?? "").trim()) {
    return NextResponse.json({ ok: false, erro: "lead sem nome e sem telefone" }, { status: 422 });
  }

  const base = await config("app_url", "CRM_URL_PUBLICA", urlDoCrm());
  try {
    const r = await criarFicha(dados, base);
    return NextResponse.json({
      ok: true,
      code: r.code,
      url: r.url,
      expira_em: r.expiraEm.toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, erro: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
