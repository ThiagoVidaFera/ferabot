import { SignJWT, jwtVerify } from "jose";

/**
 * Verificação/assinatura de sessão SEM Prisma — o middleware roda no edge
 * runtime, onde o client do banco não existe. `lib/auth.ts` continua sendo a
 * porta única para tudo que precisa do banco.
 */

export const COOKIE_SESSAO = "crm_session";
/** A sessão no dispositivo é pra durar. Renovada a cada visita (deslizante). */
export const DIAS_SESSAO = 365;

export type Sessao = {
  userId: string;
  email: string;
  name: string;
  /** carimbo do sessionEpoch do usuário no momento do login */
  epoch?: number;
};

function segredo(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET ausente no .env");
  return new TextEncoder().encode(s);
}

export async function assinarSessao(s: Sessao): Promise<string> {
  return new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DIAS_SESSAO}d`)
    .sign(segredo());
}

export type SessaoLida = Sessao & { emitidoEm: number };

export async function lerToken(token: string): Promise<SessaoLida | null> {
  try {
    const { payload } = await jwtVerify(token, segredo());
    const { userId, email, name, epoch, iat } = payload as Record<string, unknown>;
    if (typeof userId !== "string" || typeof email !== "string") return null;
    return {
      userId,
      email,
      name: typeof name === "string" ? name : email,
      epoch: typeof epoch === "number" ? epoch : undefined,
      emitidoEm: typeof iat === "number" ? iat : 0,
    };
  } catch {
    return null;
  }
}

export function cookieDeSessao(token: string, seguro: boolean): string {
  const partes = [
    `${COOKIE_SESSAO}=${token}`,
    `Max-Age=${DIAS_SESSAO * 24 * 60 * 60}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (seguro) partes.push("Secure");
  return partes.join("; ");
}

export function cookieDeLogout(): string {
  return `${COOKIE_SESSAO}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`;
}
