import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import {
  COOKIE_SESSAO,
  DIAS_SESSAO,
  assinarSessao,
  cookieDeLogout,
  cookieDeSessao,
  lerToken,
  type Sessao,
} from "@/lib/sessao-edge";

export type { Sessao };
export { COOKIE_SESSAO, DIAS_SESSAO, assinarSessao, lerToken, cookieDeSessao, cookieDeLogout };

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10);
}

export async function conferirSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

/**
 * Sessão do request atual.
 *
 * O token não expira na prática (365 dias, renovado a cada visita pelo
 * middleware). Quem manda de verdade é o `sessionEpoch` do usuário: se ele for
 * mais novo que o carimbo do token, a sessão morre. É assim que "sair de todos
 * os dispositivos" e a troca de senha derrubam aparelhos que já não temos.
 */
export async function sessaoAtual(): Promise<Sessao | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_SESSAO)?.value;
  if (!token) return null;

  const s = await lerToken(token);
  if (!s) return null;

  const user = await db.user.findUnique({
    where: { id: s.userId },
    select: { sessionEpoch: true },
  });
  if (!user) return null;

  const corte = Math.floor(user.sessionEpoch.getTime() / 1000);
  if ((s.epoch ?? 0) < corte) return null;

  return { userId: s.userId, email: s.email, name: s.name, epoch: s.epoch };
}

export async function autenticar(email: string, senha: string): Promise<Sessao | null> {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) return null;
  if (!(await conferirSenha(senha, user.passwordHash))) return null;
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    epoch: Math.floor(user.sessionEpoch.getTime() / 1000),
  };
}

/** Derruba TODAS as sessões do usuário, em todos os dispositivos. */
export async function encerrarTodasAsSessoes(userId: string) {
  await db.user.update({ where: { id: userId }, data: { sessionEpoch: new Date() } });
}
