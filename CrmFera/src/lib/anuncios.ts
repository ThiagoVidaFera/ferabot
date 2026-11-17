/**
 * Aba Anúncios: gasto (Meta) + leads e vendas (CRM) numa linha por anúncio.
 *
 * Funções puras: quem busca dado (Graph, banco) fica em `anuncios-dados.ts`.
 * Regra de ouro herdada de `aquisicao.ts`: sem dado não há número. Anúncio que
 * só existe no CRM aparece com gasto 0 e ROAS nulo, nunca com custo inventado.
 */

export interface InsightAnuncio {
  adId: string;
  nome: string;
  campanha: string;
  gastoCents: number;
  impressoes: number;
  cliques: number;
}

export interface ContatoDeAnuncio {
  adId: string;
  anuncio: string;
  leads: number;
  compras: ReadonlyArray<{ valueCents: number }>;
}

export type SituacaoAnuncio = "vende" | "gastando" | "cedo";

export interface LinhaAnuncio {
  adId: string;
  nome: string;
  campanha: string;
  gastoCents: number;
  impressoes: number;
  cliques: number;
  leads: number;
  vendas: number;
  receitaCents: number;
  roas: number | null;
  cplCents: number | null;
  situacao: SituacaoAnuncio;
  /**
   * O CRM tem venda/lead com nome que serve a mais de um anúncio desta conta e
   * não dá pra saber de qual. Esta linha pode estar vendendo sem aparecer:
   * nunca sugerir pausa sobre ela.
   */
  incerto: boolean;
}

export interface SugestaoAnuncio {
  tipo: "pausar" | "escalar";
  adId: string;
  titulo: string;
  motivo: string;
}

/** Abaixo disso o anúncio ainda não teve chance de provar nada. */
export const MIN_CLIQUES_PARA_JULGAR = 30;
export const MIN_GASTO_PARA_JULGAR_CENTS = 3000;

/** "AD-Video_01 | variação" e "ad-video-01" são o mesmo anúncio. */
export function chaveDeNome(nome: string): string {
  return (nome.split(/[|·]/)[0] ?? "").trim().toLowerCase().replace(/_/g, "-");
}

/** Nome do CRM costuma vir sem o prefixo que a Meta tem ("ad-", "fa-"...). */
const MIN_CHAVE_PARCIAL = 6;
function serveParaOutro(a: string, b: string): boolean {
  if (a.length < MIN_CHAVE_PARCIAL || b.length < MIN_CHAVE_PARCIAL) return false;
  return `-${a}`.endsWith(`-${b}`) || `-${b}`.endsWith(`-${a}`);
}

interface Acumulador {
  adId: string;
  nome: string;
  campanha: string;
  gastoCents: number;
  impressoes: number;
  cliques: number;
  leads: number;
  vendas: number;
  receitaCents: number;
}

function situacaoDe(a: Acumulador): SituacaoAnuncio {
  if (a.vendas > 0) return "vende";
  const amostraGrande = a.cliques >= MIN_CLIQUES_PARA_JULGAR || a.gastoCents >= MIN_GASTO_PARA_JULGAR_CENTS;
  return amostraGrande ? "gastando" : "cedo";
}

export function consolidarAnuncios(
  insights: ReadonlyArray<InsightAnuncio>,
  contatos: ReadonlyArray<ContatoDeAnuncio>,
): LinhaAnuncio[] {
  const porId = new Map<string, Acumulador>();
  const idPorNome = new Map<string, string>();

  for (const i of insights) {
    porId.set(i.adId, {
      adId: i.adId,
      nome: i.nome,
      campanha: i.campanha,
      gastoCents: i.gastoCents,
      impressoes: i.impressoes,
      cliques: i.cliques,
      leads: 0,
      vendas: 0,
      receitaCents: 0,
    });
    const chave = chaveDeNome(i.nome);
    if (chave && !idPorNome.has(chave)) idPorNome.set(chave, i.adId);
  }

  const incertos = new Set<string>();

  for (const c of contatos) {
    const chaveNome = chaveDeNome(c.anuncio);
    let id = c.adId && porId.has(c.adId) ? c.adId : idPorNome.get(chaveNome);
    if (!id && chaveNome) {
      const candidatos = [...idPorNome.entries()].filter(([k]) => serveParaOutro(k, chaveNome)).map(([, v]) => v);
      if (candidatos.length === 1) id = candidatos[0];
      else candidatos.forEach((v) => incertos.add(v));
    }
    id = id ?? (c.adId || chaveNome);
    if (!id) continue;

    const atual =
      porId.get(id) ??
      ({
        adId: id,
        nome: c.anuncio || `ID ${id}`,
        campanha: "—",
        gastoCents: 0,
        impressoes: 0,
        cliques: 0,
        leads: 0,
        vendas: 0,
        receitaCents: 0,
      } satisfies Acumulador);

    porId.set(id, {
      ...atual,
      leads: atual.leads + c.leads,
      vendas: atual.vendas + c.compras.length,
      receitaCents: atual.receitaCents + c.compras.reduce((s, p) => s + p.valueCents, 0),
    });
  }

  const linhas = [...porId.values()].map(
    (a): LinhaAnuncio => ({
      ...a,
      roas: a.gastoCents > 0 ? a.receitaCents / a.gastoCents : null,
      cplCents: a.gastoCents > 0 && a.leads > 0 ? Math.round(a.gastoCents / a.leads) : null,
      situacao: situacaoDe(a),
      incerto: incertos.has(a.adId),
    }),
  );

  const peso = (l: LinhaAnuncio) => (l.situacao === "vende" ? 0 : 1);
  return linhas.sort(
    (a, b) => peso(a) - peso(b) || b.receitaCents - a.receitaCents || b.gastoCents - a.gastoCents,
  );
}

function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Painel curto como o do agente: o que mais gasta sem vender e o que mais devolve. */
export const MAX_SUGESTOES_POR_TIPO = 3;

/**
 * Sugestão só nasce de amostra que já pode ser julgada (situacao != "cedo"),
 * nunca sobre linha incerta, e, quando `ativos` vem, só sobre anúncio que
 * ainda está rodando (não adianta mandar pausar o que já está pausado).
 */
export function gerarSugestoes(
  linhas: ReadonlyArray<LinhaAnuncio>,
  ativos?: ReadonlySet<string>,
): SugestaoAnuncio[] {
  const elegiveis = linhas.filter((l) => !l.incerto && (!ativos || ativos.has(l.adId)));

  const pausar = elegiveis
    .filter((l) => l.situacao === "gastando")
    .sort((a, b) => b.gastoCents - a.gastoCents)
    .slice(0, MAX_SUGESTOES_POR_TIPO)
    .map(
      (l): SugestaoAnuncio => ({
        tipo: "pausar",
        adId: l.adId,
        titulo: `Pausa "${l.nome}"`,
        motivo: `Gastou ${brl(l.gastoCents)}, trouxe ${l.leads} lead(s) e nenhuma venda.`,
      }),
    );

  const escalar = elegiveis
    .filter((l) => l.situacao === "vende" && l.roas !== null && l.roas >= 1)
    .sort((a, b) => (b.roas ?? 0) - (a.roas ?? 0))
    .slice(0, MAX_SUGESTOES_POR_TIPO)
    .map(
      (l): SugestaoAnuncio => ({
        tipo: "escalar",
        adId: l.adId,
        titulo: `Põe mais verba em "${l.nome}"`,
        motivo: `Devolveu ${brl(l.receitaCents)} sobre ${brl(l.gastoCents)} gastos (${(l.roas ?? 0).toFixed(2).replace(".", ",")}×).`,
      }),
    );

  return [...pausar, ...escalar];
}
