import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Cofre das chaves do dono (tokens de Meta, Netlify, Gemini...).
 *
 * O valor vai cifrado para o banco (AES-256-GCM): quem copiar o arquivo do banco sem o
 * segredo do servidor não lê chave nenhuma. O segredo vem de `COFRE_SECRET` ou, na falta,
 * de `SESSION_SECRET` (que toda instalação já tem).
 */
const VERSAO = "v1";
const TAMANHO_IV = 12;

function segredoDoServidor(): string {
  const segredo = process.env.COFRE_SECRET || process.env.SESSION_SECRET || "";
  if (segredo.length < 16) {
    throw new Error("cofre sem segredo: defina COFRE_SECRET (ou SESSION_SECRET) com 16+ caracteres");
  }
  return segredo;
}

function chaveDe(segredo: string): Buffer {
  return createHash("sha256").update(`cofre:${segredo}`).digest();
}

export function cifrar(texto: string, segredo: string = segredoDoServidor()): string {
  const iv = randomBytes(TAMANHO_IV);
  const cifra = createCipheriv("aes-256-gcm", chaveDe(segredo), iv);
  const dados = Buffer.concat([cifra.update(texto, "utf8"), cifra.final()]);
  return [VERSAO, iv.toString("base64"), cifra.getAuthTag().toString("base64"), dados.toString("base64")].join(":");
}

export function decifrar(guardado: string, segredo: string = segredoDoServidor()): string {
  const [versao, iv, selo, dados] = guardado.split(":");
  if (versao !== VERSAO || !iv || !selo || dados === undefined) {
    throw new Error("valor do cofre em formato desconhecido");
  }
  const decifra = createDecipheriv("aes-256-gcm", chaveDe(segredo), Buffer.from(iv, "base64"));
  decifra.setAuthTag(Buffer.from(selo, "base64"));
  return Buffer.concat([decifra.update(Buffer.from(dados, "base64")), decifra.final()]).toString("utf8");
}

/** Mostra só o fim da chave: dá para reconhecer qual é, não dá para usar. */
export function mascarar(valor: string): string {
  if (valor.length <= 8) return "••••";
  return `••••${valor.slice(-4)}`;
}

/** Comparação em tempo constante, para token de acesso. */
export function tokensIguais(recebido: string, esperado: string): boolean {
  if (!recebido || !esperado) return false;
  const a = createHash("sha256").update(recebido).digest();
  const b = createHash("sha256").update(esperado).digest();
  return timingSafeEqual(a, b);
}

export function novoToken(bytes = 24): string {
  return randomBytes(bytes).toString("hex");
}
