import { chavesSalvas } from "@/lib/chaves";

/**
 * As páginas do dono: os sites da conta Netlify dele (a mesma chave que o FERABOT usa para publicar).
 * Lista ao vivo, com cache curto em memória para a tela não chamar a Netlify a cada clique.
 */
export type PaginaDoDono = {
  id: string;
  nome: string;
  url: string;
  atualizadaEm: string | null;
  captura: string | null;
};

export type ResultadoPaginas = { paginas: PaginaDoDono[]; erro: string | null; semChave: boolean };

type SiteNetlify = {
  id?: string;
  name?: string;
  url?: string;
  ssl_url?: string;
  custom_domain?: string | null;
  updated_at?: string;
  published_deploy?: { published_at?: string } | null;
  screenshot_url?: string | null;
};

const VALIDADE_MS = 10 * 60 * 1000;
let cache: { em: number; dados: PaginaDoDono[] } | null = null;

/** Endereço que o dono divulga: domínio próprio quando tem, senão o https da Netlify. */
export function enderecoDoSite(site: SiteNetlify): string {
  if (site.custom_domain) return `https://${site.custom_domain}`;
  return site.ssl_url || site.url || "";
}

export function paraPagina(site: SiteNetlify): PaginaDoDono | null {
  const url = enderecoDoSite(site);
  if (!site.id || !url.startsWith("https://")) return null;
  return {
    id: site.id,
    nome: site.name ?? url,
    url,
    atualizadaEm: site.published_deploy?.published_at ?? site.updated_at ?? null,
    captura: site.screenshot_url?.startsWith("https://") ? site.screenshot_url : null,
  };
}

export function ordenarPorAtualizacao(paginas: PaginaDoDono[]): PaginaDoDono[] {
  return [...paginas].sort((a, b) => Date.parse(b.atualizadaEm ?? "0") - Date.parse(a.atualizadaEm ?? "0"));
}

export async function paginasDoDono(forcar = false, buscar: typeof fetch = fetch): Promise<ResultadoPaginas> {
  const token = (await chavesSalvas()).NETLIFY_AUTH_TOKEN;
  if (!token) return { paginas: [], erro: null, semChave: true };
  if (!forcar && cache && Date.now() - cache.em < VALIDADE_MS) return { paginas: cache.dados, erro: null, semChave: false };
  try {
    const resposta = await buscar("https://api.netlify.com/api/v1/sites?per_page=100", {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
    if (resposta.status === 401) return { paginas: [], erro: "A Netlify recusou a chave. Confira na tela Chaves.", semChave: false };
    if (!resposta.ok) return { paginas: [], erro: `A Netlify respondeu ${resposta.status}. Tente de novo em alguns minutos.`, semChave: false };
    const sites = (await resposta.json()) as SiteNetlify[];
    const paginas = ordenarPorAtualizacao(sites.map(paraPagina).filter((p): p is PaginaDoDono => p !== null));
    cache = { em: Date.now(), dados: paginas };
    return { paginas, erro: null, semChave: false };
  } catch {
    return { paginas: [], erro: "Não consegui falar com a Netlify agora. Tente de novo em alguns minutos.", semChave: false };
  }
}
