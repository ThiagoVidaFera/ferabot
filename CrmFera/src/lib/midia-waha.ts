import type { Conexao } from "@/lib/whatsapp";
import { salvarMidia, type MidiaSalva } from "@/lib/midia";

/**
 * Mídia (áudio, foto, vídeo, documento, figurinha) que chega pelo WAHA.
 *
 * Até 30/10/2026 o webhook só lia `payload.body`: áudio e foto sem legenda vinham
 * com `body: null` e caíam em "sem corpo" — sumiam do Inbox (áudio principalmente).
 * Agora a mensagem entra com rótulo ("[áudio]") e, se o WAHA deixar baixar, com o
 * arquivo guardado no volume do CRM (o Inbox toca/mostra pelo `midiaId`).
 */

export type MidiaDetectada = {
  tipo: "audio" | "image" | "video" | "document" | "sticker";
  mimetype?: string;
  /** URL do arquivo no WAHA, quando o payload já traz (senão busca por `downloadMedia`). */
  url?: string;
};

type Talvez = Record<string, unknown>;

function obj(v: unknown): Talvez {
  return v && typeof v === "object" ? (v as Talvez) : {};
}

function s(v: unknown): string {
  return typeof v === "string" ? v : "";
}

const CHAVES_DO_MOTOR: Array<[string, MidiaDetectada["tipo"]]> = [
  ["audioMessage", "audio"],
  ["pttMessage", "audio"],
  ["imageMessage", "image"],
  ["videoMessage", "video"],
  ["ptvMessage", "video"],
  ["stickerMessage", "sticker"],
  ["documentMessage", "document"],
  ["documentWithCaptionMessage", "document"],
];

function tipoPeloMimetype(mimetype: string): MidiaDetectada["tipo"] | null {
  const m = mimetype.toLowerCase();
  if (m.startsWith("audio/")) return "audio";
  if (m.startsWith("image/")) return m.includes("webp") ? "sticker" : "image";
  if (m.startsWith("video/")) return "video";
  if (m) return "document";
  return null;
}

/** Lê o `payload` do WAHA (event `message.any`) e diz se a mensagem é mídia. */
export function detectarMidiaWaha(payload: unknown): MidiaDetectada | null {
  const p = obj(payload);
  const media = obj(p.media);
  const mensagem = obj(obj(p._data).message);
  const chave = CHAVES_DO_MOTOR.find(([k]) => k in mensagem);

  if (p.hasMedia !== true && !chave) return null;

  const dentro = chave ? obj(mensagem[chave[0]]) : {};
  const mimetype = s(media.mimetype) || s(dentro.mimetype) || undefined;
  const tipo = (mimetype ? tipoPeloMimetype(mimetype) : null) ?? chave?.[1] ?? "document";
  // figurinha chega como imagem/webp: a chave do motor é a fonte de verdade
  const final = chave?.[1] === "sticker" ? "sticker" : tipo;
  return { tipo: final, mimetype, url: s(media.url) || undefined };
}

async function pedir(conexao: Conexao, caminho: string, ms: number): Promise<Response | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(conexao.baseUrl + caminho, {
      headers: { "X-Api-Key": conexao.apiKey, apikey: conexao.apiKey },
      signal: ctrl.signal,
    });
    return r.ok ? r : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** Caminho (sem host) de uma URL de arquivo do WAHA: `http://localhost:3000/api/files/x/y.oga` → `/api/files/x/y.oga`. */
export function caminhoDoArquivo(url: string): string | null {
  try {
    const u = new URL(url);
    return u.pathname.startsWith("/api/files/") ? u.pathname : null;
  } catch {
    return null;
  }
}

/**
 * Baixa o arquivo e guarda no volume. Sem URL no payload, pede ao WAHA a
 * mensagem com `downloadMedia=true` (que devolve a URL). Nunca lança: mídia
 * que não baixa continua aparecendo no Inbox pelo rótulo.
 */
export async function baixarMidiaWaha(
  conexao: Conexao,
  sessao: string,
  chatId: string,
  externalId: string,
  detectada: MidiaDetectada,
): Promise<MidiaSalva | null> {
  try {
    let url = detectada.url;
    let mimetype = detectada.mimetype;
    if (!url) {
      const r = await pedir(
        conexao,
        `/api/${encodeURIComponent(sessao)}/chats/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(externalId)}?downloadMedia=true`,
        8000,
      );
      const j = r ? ((await r.json().catch(() => null)) as Talvez | null) : null;
      const m = obj(j?.media);
      url = s(m.url) || undefined;
      mimetype = mimetype ?? (s(m.mimetype) || undefined);
    }
    const caminho = url ? caminhoDoArquivo(url) : null;
    if (!caminho) return null;
    const arquivo = await pedir(conexao, caminho, 10000);
    if (!arquivo) return null;
    const buf = Buffer.from(await arquivo.arrayBuffer());
    const tipoHttp = arquivo.headers.get("content-type") ?? "";
    return salvarMidia(buf.toString("base64"), mimetype || tipoHttp || "application/octet-stream");
  } catch {
    return null;
  }
}
