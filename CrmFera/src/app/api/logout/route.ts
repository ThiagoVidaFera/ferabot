import { NextRequest, NextResponse } from "next/server";
import { sessaoAtual } from "@/lib/auth";
import { cookieDeLogout } from "@/lib/sessao-edge";
import { auditar } from "@/lib/audit";
import { publicUrl } from "@/lib/url";

export async function POST(req: NextRequest) {
  const s = await sessaoAtual();
  if (s) await auditar(s.email, "logout");
  const res = NextResponse.redirect(publicUrl(req, "/login"), { status: 303 });
  res.headers.set("Set-Cookie", cookieDeLogout());
  return res;
}
