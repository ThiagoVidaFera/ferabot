import { NextRequest, NextResponse } from "next/server";
import { autenticar } from "@/lib/auth";
import { assinarSessao, cookieDeSessao } from "@/lib/sessao-edge";
import { auditar } from "@/lib/audit";
import { db } from "@/lib/db";
import { publicUrl, ehHttps } from "@/lib/url";
import { painelHospedado, SENHA_INICIAL } from "@/lib/hospedado";
import { bloqueadoPorFalhas, cookieTrocarSenha, inicioDaJanela, normalizarEmail } from "@/lib/acesso";

async function falhasRecentes(email: string): Promise<number> {
  return db.auditEvent.count({ where: { actor: email, action: "login_falhou", createdAt: { gte: inicioDaJanela() } } });
}

// GOTCHA 12 do megaprompt: login/logout como route handler + <form method="post">.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = normalizarEmail(String(form.get("email") ?? ""));
  const senha = String(form.get("senha") ?? "");

  // muitas tentativas erradas no mesmo e-mail: para de testar senha por 15 minutos
  if (email && bloqueadoPorFalhas(await falhasRecentes(email))) {
    await auditar(email, "login_bloqueado");
    return NextResponse.redirect(publicUrl(req, "/login?erro=bloqueado"), { status: 303 });
  }

  const sessao = await autenticar(email, senha);
  if (!sessao) {
    await auditar(email || "desconhecido", "login_falhou");
    return NextResponse.redirect(publicUrl(req, "/login?erro=1"), { status: 303 });
  }

  const token = await assinarSessao(sessao);
  // senha de entrada (igual para todo cliente): troca obrigatória antes de usar o painel
  const trocar = painelHospedado() && SENHA_INICIAL !== "" && senha === SENHA_INICIAL;
  const res = NextResponse.redirect(publicUrl(req, trocar ? "/primeiro-acesso" : "/"), { status: 303 });
  res.headers.append("Set-Cookie", cookieDeSessao(token, ehHttps(req)));
  if (trocar) res.headers.append("Set-Cookie", cookieTrocarSenha(ehHttps(req), true));
  await auditar(sessao.email, "login");
  return res;
}
