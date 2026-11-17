/**
 * Cache das sugestoes da fila, guardado em UMA linha de `Setting` (sem
 * migration: nada de schema novo pra subir em producao). Funcoes puras —
 * recebem e devolvem objetos novos, nunca alteram o que entra.
 *
 * Uma sugestao vale enquanto o lead nao escreveu de novo: a chave de validade
 * e o instante da ULTIMA mensagem dele. Mensagem nova = conversa mudou =
 * sugestao velha descartada.
 */

export const CHAVE_CACHE = "fila_sem_resposta_sugestoes";
export const VALIDADE_MAXIMA_DIAS = 7;

export type EntradaCache = {
  texto: string;
  /** ISO da ultima mensagem do lead no momento em que a sugestao foi gerada. */
  ultimaEntradaEm: string;
  geradoEm: string;
};

export type Cache = Readonly<Record<string, EntradaCache>>;

const DIA_MS = 86_400_000;

function ehEntrada(v: unknown): v is EntradaCache {
  if (!v || typeof v !== "object") return false;
  const e = v as Record<string, unknown>;
  return (
    typeof e.texto === "string" &&
    typeof e.ultimaEntradaEm === "string" &&
    typeof e.geradoEm === "string"
  );
}

/** Le o JSON guardado; qualquer coisa torta vira cache vazio (nunca quebra a tela). */
export function lerCache(bruto: string | null | undefined): Cache {
  if (!bruto) return {};
  try {
    const j: unknown = JSON.parse(bruto);
    if (!j || typeof j !== "object" || Array.isArray(j)) return {};
    const entradas = Object.entries(j as Record<string, unknown>).filter(
      (par): par is [string, EntradaCache] => ehEntrada(par[1]),
    );
    return Object.fromEntries(entradas);
  } catch {
    return {};
  }
}

export function cacheValido(cache: Cache, contactId: string, ultimaEntradaEm: Date): string | null {
  const e = cache[contactId];
  if (!e) return null;
  return e.ultimaEntradaEm === ultimaEntradaEm.toISOString() ? e.texto : null;
}

export function comEntrada(cache: Cache, contactId: string, entrada: EntradaCache): Cache {
  return { ...cache, [contactId]: entrada };
}

/** Remove entradas com mais de 7 dias — o Setting nao pode crescer sem limite. */
export function podar(cache: Cache, agora: Date): Cache {
  const limite = agora.getTime() - VALIDADE_MAXIMA_DIAS * DIA_MS;
  return Object.fromEntries(
    Object.entries(cache).filter(([, e]) => {
      const t = Date.parse(e.geradoEm);
      return Number.isFinite(t) && t >= limite;
    }),
  );
}
