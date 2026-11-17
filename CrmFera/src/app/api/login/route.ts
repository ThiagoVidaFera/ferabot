import { NextRequest, NextResponse } from "next/server";
import { autenticar } from "@/lib/auth";
import { assinarSessao, cookieDeSessao } from "@/lib/sessao-edge";
import { auditar } from "@/lib/audit";
import { publicUrl, ehHttps } from "@/lib/url";

// GOTCHA 12 do megaprompt: login/logout como route handler + <form method="post">.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "");
  const senha = String(form.get("senha") ?? "");

  const sessao = await autenticar(email, senha);
  if (!sessao) {
    await auditar(email || "desconhecido", "login_falhou");
    return NextResponse.redirect(publicUrl(req, "/login?erro=1"), { status: 303 });
  }

  const token = await assinarSessao(sessao);
  const res = NextResponse.redirect(publicUrl(req, "/"), { status: 303 });
  res.headers.set("Set-Cookie", cookieDeSessao(token, ehHttps(req)));
  await auditar(sessao.email, "login");
  return res;
}
