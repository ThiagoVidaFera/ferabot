/**
 * O plano do cliente da consultoria: big idea, mecanismo único, headlines que ele repete,
 * roteiros dos vídeos do YouTube e sugestões de posts do Instagram.
 * Nasce no onboarding (quem fechou ganha o painel já com o plano) e o FERABOT atualiza
 * quando refina a narrativa. Regras puras aqui; quem lê e grava o banco é `plano-cliente-banco.ts`.
 */

/** `lote`: o mês em que o item entrou (ex.: "2026-12"), para o lote mensal da mensalidade. */
export type RoteiroYoutube = { titulo: string; gancho?: string; roteiro: string; lote?: string };
export type PostInstagram = { formato: string; titulo: string; texto: string; lote?: string };

/** As redes e links do dono (o FERABOT puxa daqui para o perfil.json). */
export type RedesCliente = { instagram?: string; youtube?: string; site?: string; whatsapp?: string; tiktok?: string };
export const CAMPOS_REDES = ["instagram", "youtube", "site", "whatsapp", "tiktok"] as const;

export type PlanoCliente = {
  bigIdea: string;
  mecanismo: { nome: string; explicacao: string };
  headlines: string[];
  roteirosYoutube: RoteiroYoutube[];
  postsInstagram: PostInstagram[];
  redes?: RedesCliente;
  atualizadoEm: string;
  /** quando o dono aprovou a big idea e o mecanismo (some se eles mudarem) */
  aprovadoEm?: string;
};

export const LIMITES = {
  curto: 300,
  medio: 2_000,
  longo: 12_000,
  headlines: 20,
  roteiros: 30,
  posts: 60,
} as const;

export const PLANO_VAZIO: PlanoCliente = {
  bigIdea: "",
  mecanismo: { nome: "", explicacao: "" },
  headlines: [],
  roteirosYoutube: [],
  postsInstagram: [],
  atualizadoEm: "",
};

export type ResultadoPlano = { ok: true; plano: PlanoCliente } | { ok: false; erro: string };

function texto(valor: unknown, limite: number): string {
  return typeof valor === "string" ? valor.trim().slice(0, limite) : "";
}

function lista(valor: unknown, maximo: number): unknown[] {
  return Array.isArray(valor) ? valor.slice(0, maximo) : [];
}

function objeto(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === "object" && !Array.isArray(valor) ? (valor as Record<string, unknown>) : {};
}

const LOTE = /^\d{4}-\d{2}$/;

function lote(valor: unknown): { lote?: string } {
  const l = texto(valor, 7);
  return LOTE.test(l) ? { lote: l } : {};
}

function roteiro(valor: unknown): RoteiroYoutube | null {
  const o = objeto(valor);
  const titulo = texto(o.titulo, LIMITES.curto);
  const corpo = texto(o.roteiro, LIMITES.longo);
  if (!titulo || !corpo) return null;
  const gancho = texto(o.gancho, LIMITES.medio);
  return { titulo, ...(gancho ? { gancho } : {}), roteiro: corpo, ...lote(o.lote) };
}

function post(valor: unknown): PostInstagram | null {
  const o = objeto(valor);
  const titulo = texto(o.titulo, LIMITES.curto);
  const corpo = texto(o.texto, LIMITES.medio * 2);
  if (!titulo || !corpo) return null;
  return { formato: texto(o.formato, 60) || "post", titulo, texto: corpo, ...lote(o.lote) };
}

/** Acrescenta sem repetir título; mais novos primeiro, dentro do teto. */
function redes(valor: unknown): RedesCliente | undefined {
  const o = objeto(valor);
  const limpas = Object.fromEntries(
    CAMPOS_REDES.map((c) => [c, texto(o[c], 200)] as const).filter(([, v]) => v !== ""),
  ) as RedesCliente;
  return Object.keys(limpas).length ? limpas : undefined;
}

function acrescentar<T extends { titulo: string }>(atuais: T[], novos: T[], teto: number): T[] {
  const titulos = new Set(atuais.map((a) => a.titulo));
  return [...novos.filter((n) => !titulos.has(n.titulo)), ...atuais].slice(0, teto);
}

/**
 * Normaliza o que chegou (do onboarding ou do FERABOT). Campo ausente mantém o valor atual:
 * o FERABOT pode mandar só os roteiros novos sem apagar a big idea.
 * `modo: "acrescentar"` soma roteiros e posts aos que já existem (o lote do mês) em vez de trocar a lista.
 */
export function mesclarPlano(atual: PlanoCliente, entrada: unknown, agora = new Date()): ResultadoPlano {
  const e = objeto(entrada);
  if (Object.keys(e).length === 0) return { ok: false, erro: "plano vazio" };
  const somar = e.modo === "acrescentar";

  const mec = "mecanismo" in e ? objeto(e.mecanismo) : null;
  const plano: PlanoCliente = {
    bigIdea: "bigIdea" in e ? texto(e.bigIdea, LIMITES.medio) : atual.bigIdea,
    mecanismo: mec
      ? { nome: texto(mec.nome, LIMITES.curto), explicacao: texto(mec.explicacao, LIMITES.medio) }
      : atual.mecanismo,
    headlines:
      "headlines" in e
        ? lista(e.headlines, LIMITES.headlines)
            .map((h) => texto(h, LIMITES.curto))
            .filter(Boolean)
        : atual.headlines,
    roteirosYoutube: atual.roteirosYoutube,
    postsInstagram: atual.postsInstagram,
    ...(atual.redes ? { redes: atual.redes } : {}),
    atualizadoEm: agora.toISOString(),
  };
  if ("redes" in e) {
    const novas = redes(e.redes);
    plano.redes = novas ? { ...(atual.redes ?? {}), ...novas } : atual.redes;
  }
  if ("roteirosYoutube" in e) {
    const novos = lista(e.roteirosYoutube, LIMITES.roteiros).map(roteiro).filter((r): r is RoteiroYoutube => r !== null);
    plano.roteirosYoutube = somar ? acrescentar(atual.roteirosYoutube, novos, LIMITES.roteiros) : novos;
  }
  if ("postsInstagram" in e) {
    const novos = lista(e.postsInstagram, LIMITES.posts).map(post).filter((p): p is PostInstagram => p !== null);
    plano.postsInstagram = somar ? acrescentar(atual.postsInstagram, novos, LIMITES.posts) : novos;
  }
  // aprovação vale para a big idea e o mecanismo que o dono viu; mudou, precisa aprovar de novo
  const mesmaNarrativa =
    plano.bigIdea === atual.bigIdea && plano.mecanismo.nome === atual.mecanismo.nome && plano.mecanismo.explicacao === atual.mecanismo.explicacao;
  if (atual.aprovadoEm && mesmaNarrativa) plano.aprovadoEm = atual.aprovadoEm;

  if (!temConteudo(plano)) return { ok: false, erro: "nenhum campo do plano veio preenchido" };
  return { ok: true, plano };
}

export function temConteudo(plano: PlanoCliente): boolean {
  return Boolean(
    plano.bigIdea ||
      plano.mecanismo.nome ||
      plano.headlines.length ||
      (plano.redes && Object.keys(plano.redes).length) ||
      plano.roteirosYoutube.length ||
      plano.postsInstagram.length,
  );
}

/** Marca a aprovação do dono (só quando há big idea ou mecanismo para aprovar). */
export function aprovarPlano(plano: PlanoCliente, agora = new Date()): PlanoCliente | null {
  if (!plano.bigIdea && !plano.mecanismo.nome) return null;
  return { ...plano, aprovadoEm: agora.toISOString() };
}

export function lerPlanoBruto(bruto: string): PlanoCliente {
  if (!bruto) return PLANO_VAZIO;
  try {
    const r = mesclarPlano(PLANO_VAZIO, JSON.parse(bruto));
    if (!r.ok) return PLANO_VAZIO;
    const original = objeto(JSON.parse(bruto));
    const aprovadoEm = texto(original.aprovadoEm, 40);
    return { ...r.plano, atualizadoEm: texto(original.atualizadoEm, 40), ...(aprovadoEm ? { aprovadoEm } : {}) };
  } catch {
    return PLANO_VAZIO;
  }
}
