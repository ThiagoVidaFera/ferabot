import { NextResponse, type NextRequest } from "next/server";
import {
  COOKIE_SESSAO,
  assinarSessao,
  cookieDeSessao,
  lerToken,
} from "@/lib/sessao-edge";
import { ehHttps } from "@/lib/url";

/**
 * Janela DESLIZANTE de sessão.
 *
 * O cookie vale 365 dias, mas é REEMITIDO a cada visita — então um aparelho em
 * uso normal nunca cai. Sem isso, o prazo seria fixo a partir do login e o
 * aparelho pediria senha de novo um ano depois, do nada.
 *
 * Reemite só quando o token tem mais de 1 dia: assinar JWT em toda requisição
 * (inclusive as de imagem/CSS) seria desperdício.
 */

const UM_DIA = 24 * 60 * 60;

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(COOKIE_SESSAO)?.value;
  if (!token) return NextResponse.next();

  const s = await lerToken(token);
  if (!s) return NextResponse.next();

  const agora = Math.floor(Date.now() / 1000);
  if (agora - s.emitidoEm < UM_DIA) return NextResponse.next();

  const novo = await assinarSessao({
    userId: s.userId,
    email: s.email,
    name: s.name,
    epoch: s.epoch,
  });

  const res = NextResponse.next();
  res.headers.set("Set-Cookie", cookieDeSessao(novo, ehHttps(req)));
  return res;
}

export const config = {
  // fora: assets e as rotas de auth (que já cuidam do próprio cookie)
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/login|api/logout).*)"],
};
