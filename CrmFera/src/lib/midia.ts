import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

/**
 * Guarda de mídia enviada pelo inbox.
 *
 * O arquivo vai pro MESMO volume do banco (`/opt/crm/data/midia`), fora da
 * pasta do app (LEI 6) — assim ele sobrevive a deploy, entra no backup junto
 * com o banco e nunca vira asset estático servido sem autenticação.
 *
 * Guardar base64 dentro do registro da mensagem seria mais simples e bem pior:
 * um áudio de 30s incharia a linha em ~400 KB e toda listagem de conversa
 * carregaria isso à toa.
 */

const TETO_BYTES = 12 * 1024 * 1024;

const EXTENSOES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/webm": "webm",
  "video/mp4": "mp4",
  "application/pdf": "pdf",
};

export function pastaMidia(): string {
  const base = process.env.MIDIA_DIR ?? path.join(path.dirname(bancoPath()), "midia");
  fs.mkdirSync(base, { recursive: true });
  return base;
}

function bancoPath(): string {
  const url = process.env.DATABASE_URL ?? "file:./data/crm.db";
  return url.replace(/^file:/, "");
}

export type MidiaSalva = {
  id: string;
  mimetype: string;
  tamanho: number;
  nome: string;
};

export function salvarMidia(
  base64: string,
  mimetype: string,
  nomeOriginal?: string,
): MidiaSalva {
  const limpo = base64.includes(",") ? base64.slice(base64.indexOf(",") + 1) : base64;
  const buf = Buffer.from(limpo, "base64");

  if (!buf.length) throw new Error("arquivo vazio");
  if (buf.length > TETO_BYTES) {
    throw new Error(`arquivo de ${(buf.length / 1024 / 1024).toFixed(1)} MB — o teto é 12 MB`);
  }

  const base = mimetype.split(";")[0].trim().toLowerCase();
  const ext = EXTENSOES[base] ?? "bin";
  const id = crypto.randomUUID();

  fs.writeFileSync(path.join(pastaMidia(), `${id}.${ext}`), buf);

  return {
    id: `${id}.${ext}`,
    mimetype: base,
    tamanho: buf.length,
    nome: nomeOriginal?.slice(0, 120) ?? `arquivo.${ext}`,
  };
}

export function lerMidia(id: string): { buf: Buffer; mimetype: string } | null {
  // nunca deixar o id escapar da pasta
  if (!/^[a-f0-9-]{36}\.[a-z0-9]{2,5}$/i.test(id)) return null;

  const arquivo = path.join(pastaMidia(), id);
  if (!fs.existsSync(arquivo)) return null;

  const ext = id.split(".").pop() ?? "";
  const mimetype =
    Object.entries(EXTENSOES).find(([, e]) => e === ext)?.[0] ?? "application/octet-stream";

  return { buf: fs.readFileSync(arquivo), mimetype };
}
