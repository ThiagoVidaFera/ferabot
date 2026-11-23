import { config } from "@/lib/config";

/**
 * CALENDÁRIO DE POSTS (22/11/2026): posts agendados por perfil, lidos do Post for Me.
 *
 * O Post for Me é o agendador de tudo que vai pro feed, Reels, Stories, TikTok e páginas
 * do Facebook (skill `publicacao-e-crosspost`). Os registros em .md das pastas ficam
 * velhos; a API é a fonte. Regras já pagas (seções 2, 10 e 17 da skill):
 *   - `limit` máximo 100 (200 dá 400); aqui usamos 50 pra reduzir os 500 esporádicos;
 *   - SEMPRE filtrar por `social_account_id`: a lista global dá falso negativo;
 *   - o tipo do post mora em `platform_configurations.<plataforma>.placement`;
 *   - a resposta de item traz `access_token` da conta: nunca logar o corpo cru.
 * Chave: Setting `postforme_api_key` (ou env POSTFORME_API_KEY). Cache em memória
 * por conta (5 min) e das contas (1 h).
 */

const BASE = "https://api.postforme.dev/v1";
const TIMEOUT_MS = 20_000;
const LIMITE = 50;
const MAX_PAGINAS = 20;
export const CACHE_POSTS_MS = 5 * 60_000;
const CACHE_CONTAS_MS = 60 * 60_000;
const TZ = "America/Sao_Paulo";

export type ContaPfm = { id: string; plataforma: string; nome: string; status: string };

export type TipoPost = "story" | "reel" | "feed" | "video" | "outro";

export type PostAgendado = {
  id: string;
  quando: string; // ISO (UTC, como vem da API)
  status: string;
  legenda: string;
  tipo: TipoPost;
  midia: string | null;
  midiaTipo: "imagem" | "video" | null;
  qtdMidia: number;
};

// ---- formato bruto ------------------------------------------------------------

type ContaBruta = { id: string; platform?: string; username?: string; status?: string };
type PostBruto = {
  id: string;
  status?: string;
  scheduled_at?: string | null;
  caption?: string | null;
  media?: { url?: string; type?: string }[] | null;
  platform_configurations?: Record<string, { placement?: string } | undefined> | null;
};
type Lista<T> = { data?: T[]; meta?: { total?: number; next?: string | null }; error?: unknown; message?: string };

// ---- puras --------------------------------------------------------------------

export function tipoDoPost(p: Pick<PostBruto, "platform_configurations" | "media">, plataforma: string): TipoPost {
  const conf = p.platform_configurations ?? {};
  const placement = (conf[plataforma]?.placement ?? Object.values(conf).find((c) => c?.placement)?.placement ?? "").toLowerCase();
  if (placement === "stories" || placement === "story") return "story";
  if (placement === "reels" || placement === "reel") return "reel";
  if (placement === "timeline" || placement === "feed") return "feed";
  if (plataforma === "tiktok" || plataforma === "youtube") return "video";
  return placement ? "outro" : "feed";
}

export const ROTULO_TIPO: Record<TipoPost, string> = { story: "Story", reel: "Reel", feed: "Feed", video: "Vídeo", outro: "Post" };
export const COR_TIPO: Record<TipoPost, string> = { story: "#F59E0B", reel: "#8B5CF6", feed: "#2563EB", video: "#10B981", outro: "#6B7280" };

export function lerPost(p: PostBruto, plataforma: string): PostAgendado | null {
  if (!p.id || !p.scheduled_at || Number.isNaN(Date.parse(p.scheduled_at))) return null;
  const midias = p.media ?? [];
  const primeira = midias[0];
  const url = primeira?.url ?? null;
  const ehVideo = /video/i.test(primeira?.type ?? "") || /\.(mp4|mov|webm)(\?|$)/i.test(url ?? "");
  return {
    id: p.id,
    quando: new Date(p.scheduled_at).toISOString(),
    status: p.status ?? "scheduled",
    legenda: (p.caption ?? "").replace(/\s+/g, " ").trim().slice(0, 240),
    tipo: tipoDoPost(p, plataforma),
    midia: url,
    midiaTipo: url ? (ehVideo ? "video" : "imagem") : null,
    qtdMidia: midias.length,
  };
}

/** AAAA-MM-DD em Brasília. */
export function diaBrasilia(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { timeZone: TZ });
}

export function horaBrasilia(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
}

export function agruparPorDia(posts: readonly PostAgendado[]): Map<string, PostAgendado[]> {
  const mapa = new Map<string, PostAgendado[]>();
  for (const p of [...posts].sort((a, b) => a.quando.localeCompare(b.quando))) {
    const d = diaBrasilia(p.quando);
    mapa.set(d, [...(mapa.get(d) ?? []), p]);
  }
  return mapa;
}

export type CelulaMes = { dia: string | null; numero: number | null };

/** Grade do mês (segunda a domingo), com células vazias nas pontas. `mes` = "AAAA-MM". */
export function gradeDoMes(mes: string): CelulaMes[][] {
  const [ano, m] = mes.split("-").map(Number);
  const primeiro = new Date(Date.UTC(ano, m - 1, 1));
  const diasNoMes = new Date(Date.UTC(ano, m, 0)).getUTCDate();
  const offset = (primeiro.getUTCDay() + 6) % 7; // segunda = 0
  const celulas: CelulaMes[] = Array.from({ length: offset }, () => ({ dia: null, numero: null }));
  for (let d = 1; d <= diasNoMes; d++) celulas.push({ dia: `${mes}-${String(d).padStart(2, "0")}`, numero: d });
  while (celulas.length % 7) celulas.push({ dia: null, numero: null });
  const semanas: CelulaMes[][] = [];
  for (let i = 0; i < celulas.length; i += 7) semanas.push(celulas.slice(i, i + 7));
  return semanas;
}

export function mesValido(s: string | undefined): s is string {
  return Boolean(s && /^\d{4}-(0[1-9]|1[0-2])$/.test(s));
}

export function mesVizinho(mes: string, delta: number): string {
  const [ano, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(ano, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function mesAtualBrasilia(agora = new Date()): string {
  return new Date(agora).toLocaleDateString("sv-SE", { timeZone: TZ }).slice(0, 7);
}

export function nomeDoMes(mes: string): string {
  const [ano, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(ano, m - 1, 1)).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
}

const ORDEM_PLATAFORMA: Record<string, number> = { instagram: 0, tiktok: 1, facebook: 2, youtube: 3 };

export function ordenarContas(contas: readonly ContaPfm[]): ContaPfm[] {
  return [...contas].sort(
    (a, b) => (ORDEM_PLATAFORMA[a.plataforma] ?? 9) - (ORDEM_PLATAFORMA[b.plataforma] ?? 9) || a.nome.localeCompare(b.nome),
  );
}

// ---- API ----------------------------------------------------------------------

export type Resultado<T> = { dados: T; erro: string | null };

async function chave(): Promise<string> {
  // painel do cliente: a chave mora no cofre (tela Chaves); CRM do dono: Setting antiga ou env
  const { chavesSalvas } = await import("@/lib/chaves");
  const doCofre = (await chavesSalvas()).POSTFORME_API_KEY;
  return doCofre || config("postforme_api_key", "POSTFORME_API_KEY");
}

async function api<T>(caminho: string, k: string): Promise<Lista<T>> {
  const r = await fetch(`${BASE}${caminho}`, { headers: { Authorization: `Bearer ${k}` }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (r.status === 401) throw new Error("Post for Me recusou a chave (401)");
  if (r.status === 429) throw new Error("Post for Me pediu calma (429); tente de novo em 1 minuto");
  if (!r.ok) throw new Error(`Post for Me respondeu ${r.status}`);
  return (await r.json()) as Lista<T>;
}

let cacheContas: { em: number; contas: ContaPfm[] } | null = null;
const cachePosts = new Map<string, { em: number; posts: PostAgendado[] }>();

export async function temChavePostForMe(): Promise<boolean> {
  return Boolean(await chave());
}

export async function listarContasPfm(forcar = false): Promise<Resultado<ContaPfm[]>> {
  if (!forcar && cacheContas && Date.now() - cacheContas.em < CACHE_CONTAS_MS) return { dados: cacheContas.contas, erro: null };
  const k = await chave();
  if (!k) return { dados: [], erro: "Chave do Post for Me não configurada." };
  try {
    const r = await api<ContaBruta>("/social-accounts?limit=100", k);
    const contas = ordenarContas(
      (r.data ?? []).map((c) => ({ id: c.id, plataforma: c.platform ?? "outra", nome: c.username ?? c.id, status: c.status ?? "" })),
    );
    cacheContas = { em: Date.now(), contas };
    return { dados: contas, erro: null };
  } catch (e) {
    return { dados: cacheContas?.contas ?? [], erro: e instanceof Error ? e.message : "erro" };
  }
}

/** Todos os posts AGENDADOS (futuros) de uma conta, paginados com filtro por conta. */
export async function postsAgendados(conta: ContaPfm, forcar = false): Promise<Resultado<PostAgendado[]>> {
  const c = cachePosts.get(conta.id);
  if (!forcar && c && Date.now() - c.em < CACHE_POSTS_MS) return { dados: c.posts, erro: null };
  const k = await chave();
  if (!k) return { dados: [], erro: "Chave do Post for Me não configurada." };
  const posts: PostAgendado[] = [];
  try {
    for (let pagina = 0, offset = 0; pagina < MAX_PAGINAS; pagina++, offset += LIMITE) {
      const r = await api<PostBruto>(`/social-posts?status=scheduled&social_account_id=${encodeURIComponent(conta.id)}&limit=${LIMITE}&offset=${offset}`, k);
      const lote = r.data ?? [];
      for (const p of lote) {
        const lido = lerPost(p, conta.plataforma);
        if (lido && lido.status === "scheduled") posts.push(lido);
      }
      const total = r.meta?.total ?? 0;
      if (!lote.length || offset + LIMITE >= total) break;
    }
    cachePosts.set(conta.id, { em: Date.now(), posts });
    return { dados: posts, erro: null };
  } catch (e) {
    return { dados: c?.posts ?? [], erro: e instanceof Error ? e.message : "erro" };
  }
}
