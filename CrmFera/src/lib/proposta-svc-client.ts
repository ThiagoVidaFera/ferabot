/**
 * Cliente do `proposta-svc` (Python, na VPS, rede interna): gera e publica a página da proposta.
 * Contrato em `PLANO-PROPOSTA-AUTOMATICA.md`. Nunca lança: erro vira `{ ok: false, erro }`.
 */

export type StatusJob = "queued" | "running" | "done" | "failed";

export type JobProposta = {
  status: StatusJob;
  url: string | null;
  validade: string | null;
  erro: string | null;
};

export type PerfilInstagram = {
  seguidores?: number;
  posts?: number;
  bio?: string;
  link_bio?: string;
  link_bio_resumo?: string;
  posts_recentes?: { data?: string; legenda?: string; views?: number; likes?: number }[];
};

export type Resposta<T> = ({ ok: true } & T) | { ok: false; erro: string };

type Fetcher = typeof fetch;

const TIMEOUT_MS = 30_000;
const HEALTH_TIMEOUT_MS = 5_000;

function config(): { base: string; chave: string } | null {
  const base = process.env.PROPOSTA_SVC_URL?.replace(/\/$/, "");
  const chave = process.env.PROPOSTA_SVC_KEY;
  return base && chave ? { base, chave } : null;
}

async function chamar<T>(metodo: "GET" | "POST", caminho: string, corpo: unknown, f: Fetcher): Promise<Resposta<{ dados: T }>> {
  const c = config();
  if (!c) return { ok: false, erro: "PROPOSTA_SVC_URL/PROPOSTA_SVC_KEY nao configurados" };
  try {
    const r = await f(`${c.base}${caminho}`, {
      method: metodo,
      headers: { "x-key": c.chave, "Content-Type": "application/json" },
      ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!r.ok) return { ok: false, erro: `proposta-svc respondeu ${r.status}` };
    return { ok: true, dados: (await r.json()) as T };
  } catch (e) {
    return { ok: false, erro: `proposta-svc fora do ar: ${e instanceof Error ? e.message : String(e)}` };
  }
}

/** O serviço responde? Conferido ANTES de dizer ao lead "estou montando a proposta". */
export async function saude(f: Fetcher = fetch): Promise<{ ok: true } | { ok: false; erro: string }> {
  const c = config();
  if (!c) return { ok: false, erro: "PROPOSTA_SVC_URL/PROPOSTA_SVC_KEY nao configurados" };
  try {
    const r = await f(`${c.base}/health`, { signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS) });
    return r.ok ? { ok: true } : { ok: false, erro: `/health respondeu ${r.status}` };
  } catch (e) {
    return { ok: false, erro: `proposta-svc fora do ar: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export async function pedirInstagram(username: string, f: Fetcher = fetch): Promise<Resposta<{ perfil: PerfilInstagram }>> {
  const r = await chamar<PerfilInstagram & { ok?: boolean; erro?: string }>("POST", "/instagram", { username }, f);
  if (!r.ok) return r;
  if (r.dados.ok === false) return { ok: false, erro: r.dados.erro ?? "instagram indisponivel" };
  return { ok: true, perfil: r.dados };
}

export async function criarJob(slug: string, proposta: Record<string, unknown>, f: Fetcher = fetch): Promise<Resposta<{ id: string }>> {
  const r = await chamar<{ id?: string }>("POST", "/jobs", { slug, proposta }, f);
  if (!r.ok) return r;
  return r.dados.id ? { ok: true, id: r.dados.id } : { ok: false, erro: "proposta-svc nao devolveu o id do job" };
}

export async function lerJob(id: string, f: Fetcher = fetch): Promise<Resposta<{ job: JobProposta }>> {
  const r = await chamar<Partial<JobProposta>>("GET", `/jobs/${encodeURIComponent(id)}`, undefined, f);
  if (!r.ok) return r;
  const d = r.dados;
  const status: StatusJob = d.status === "done" || d.status === "failed" || d.status === "running" ? d.status : "queued";
  return { ok: true, job: { status, url: d.url ?? null, validade: d.validade ?? null, erro: d.erro ?? null } };
}

/** Resumo do Instagram em texto corrido para o prompt (só fatos que o serviço devolveu). */
export function resumirInstagram(p: PerfilInstagram): { instagram: string; site: string } {
  const posts = (p.posts_recentes ?? [])
    .slice(0, 12)
    .map((x) => `- ${x.data ?? ""} · ${x.views ?? "?"} views · ${(x.legenda ?? "").replace(/\s+/g, " ").slice(0, 220)}`)
    .join("\n");
  const instagram = [
    p.seguidores !== undefined ? `Seguidores: ${p.seguidores}` : "",
    p.posts !== undefined ? `Posts: ${p.posts}` : "",
    p.bio ? `Bio: ${p.bio.replace(/\s+/g, " ")}` : "",
    p.link_bio ? `Link da bio: ${p.link_bio}` : "",
    posts ? `Posts recentes:\n${posts}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return { instagram, site: p.link_bio_resumo ?? "" };
}
