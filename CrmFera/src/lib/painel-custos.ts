import { db } from "@/lib/db";
import { classificarReunioes, type Reunioes } from "@/lib/reunioes";

/**
 * Custos e reuniões da tela inicial (06/11/2026).
 *
 * - Custo por lead: TODO gasto de anúncio do período ÷ leads reais (com telefone ou e-mail).
 * - Custo por reunião / por proposta: só o gasto dos funis que levam a reunião. Low ticket
 *   em espanhol (LATAM) não marca reunião; somá-lo inflaria esses dois custos.
 * - Reunião realizada / no show conta pela DATA DA REUNIÃO dentro do período.
 * - Proposta conta pela DATA DA REUNIÃO em que foi apresentada (sem reunião: data da marcação),
 *   e só quando GENTE marcou (botão "Proposta enviada" ou "Recebeu proposta" na tela
 *   de Reuniões). O estágio `proposta` movido por agente é a gaveta do desqualificado, não proposta.
 */

/** Origens de low ticket LATAM: não geram reunião. */
const ORIGEM_SEM_REUNIAO = /^latam:|-es-/;

export function ehCustoDeReuniao(origem: string): boolean {
  return !ORIGEM_SEM_REUNIAO.test(origem);
}

export interface EntradaCustos {
  custoTotalCents: number;
  custoReuniaoCents: number;
  leads: number;
  realizadas: number;
  marcadas: number;
  propostas: number;
}

export interface Custos {
  custoTotalCents: number;
  custoReuniaoCents: number;
  cplCents: number | null;
  porRealizadaCents: number | null;
  porMarcadaCents: number | null;
  porPropostaCents: number | null;
}

function dividir(custo: number, qtd: number): number | null {
  return custo > 0 && qtd > 0 ? Math.round(custo / qtd) : null;
}

export function calcularCustos(e: EntradaCustos): Custos {
  return {
    custoTotalCents: e.custoTotalCents,
    custoReuniaoCents: e.custoReuniaoCents,
    cplCents: dividir(e.custoTotalCents, e.leads),
    porRealizadaCents: dividir(e.custoReuniaoCents, e.realizadas),
    porMarcadaCents: dividir(e.custoReuniaoCents, e.marcadas),
    porPropostaCents: dividir(e.custoReuniaoCents, e.propostas),
  };
}

export interface ResumoReunioes {
  /** realizadas com data dentro do período */
  realizadas: number;
  noShow: number;
  /** marcadas daqui pra frente (independe do período) */
  aRealizar: number;
  /** já passaram e ninguém marcou se a pessoa veio */
  semResultado: number;
  /** reuniões com data no período (realizada + no show + sem resultado + futura) */
  marcadasNoPeriodo: number;
  /** % de comparecimento entre as decididas do período */
  comparecimento: number | null;
  proxima: Date | null;
}

export function resumirReunioes(r: Reunioes, p: { inicio: Date; fim: Date }, agora: Date = new Date()): ResumoReunioes {
  const noPeriodo = (d: Date) => d >= p.inicio && d < p.fim;
  const realizadas = r.realizadas.filter((x) => noPeriodo(x.quando)).length;
  const noShow = r.noShow.filter((x) => noPeriodo(x.quando)).length;
  const futuras = r.aRealizar.filter((x) => x.quando > agora);
  const semResultado = r.aRealizar.filter((x) => x.semResultado).length;
  const pendentesNoPeriodo = r.aRealizar.filter((x) => noPeriodo(x.quando)).length;
  const decididas = realizadas + noShow;
  return {
    realizadas,
    noShow,
    aRealizar: futuras.length,
    semResultado,
    marcadasNoPeriodo: decididas + pendentesNoPeriodo,
    comparecimento: decididas ? Math.round((realizadas / decididas) * 100) : null,
    proxima: futuras[0]?.quando ?? null,
  };
}

export function ehPropostaHumana(meta: unknown): boolean {
  if (!meta || typeof meta !== "object") return false;
  const m = meta as Record<string, unknown>;
  return m.para === "proposta" && typeof m.ator === "string" && !m.ator.startsWith("agente:");
}

async function carregarReunioes(): Promise<Reunioes> {
  // customFields é JSON em texto no SQLite: o filtro por dentro dele é por LIKE.
  const ids = await db.$queryRaw<{ id: string }[]>`SELECT id FROM Contact WHERE customFields LIKE '%"evento_data"%'`;
  const contatos = await db.contact.findMany({
    where: { id: { in: ids.map((i) => i.id) } },
    select: {
      id: true,
      name: true,
      phone: true,
      origem: true,
      customFields: true,
      tags: true,
      timelineEvents: { where: { eventType: "call" }, select: { metadata: true, timestamp: true } },
    },
  });
  return classificarReunioes(
    contatos.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      origem: c.origem,
      customFields: c.customFields,
      tags: c.tags,
      eventos: c.timelineEvents.flatMap((e) => {
        const res = (e.metadata as Record<string, unknown> | null)?.resultado;
        return typeof res === "string" ? [{ resultado: res, timestamp: e.timestamp }] : [];
      }),
    })),
  );
}

export interface MarcaProposta {
  contactId: string;
  /** quando alguém marcou a proposta (clique ou mudança de estágio) */
  em: Date;
}

/**
 * Proposta conta no período em que foi APRESENTADA: a data da reunião do contato.
 * Sem reunião registrada, vale a data da marcação. Um contato conta uma vez só.
 */
export function contarPropostasApresentadas(
  marcas: MarcaProposta[],
  reuniaoPorContato: Map<string, Date>,
  p: { inicio: Date; fim: Date },
): number {
  const contatos = new Set<string>();
  for (const m of marcas) {
    const apresentada = reuniaoPorContato.get(m.contactId) ?? m.em;
    if (apresentada >= p.inicio && apresentada < p.fim) contatos.add(m.contactId);
  }
  return contatos.size;
}

/** Todas as marcações humanas de proposta (sem filtro de data: o filtro é pela reunião). */
async function carregarMarcasDeProposta(r: Reunioes): Promise<MarcaProposta[]> {
  const [mudancas, marcadasNaReuniao] = await Promise.all([
    db.timelineEvent.findMany({
      where: { eventType: "stage_change", metadata: { path: "$.para", equals: "proposta" } },
      select: { contactId: true, metadata: true, timestamp: true },
    }),
    db.auditEvent.findMany({
      where: { action: "reuniao_proposta_sim" },
      select: { detail: true, createdAt: true },
    }),
  ]);
  const doBotao = marcadasNaReuniao.flatMap((a) => (a.detail ? [{ contactId: a.detail, em: a.createdAt }] : []));
  const doEstagio = mudancas
    .filter((m) => ehPropostaHumana(m.metadata))
    .map((m) => ({ contactId: m.contactId, em: m.timestamp }));
  // tag "proposta-recebida" na tela de Reuniões também é marcação humana
  const daTag = [...r.realizadas, ...r.noShow, ...r.aRealizar]
    .filter((x) => x.propostaRecebida)
    .map((x) => ({ contactId: x.id, em: x.quando }));
  return [...doBotao, ...doEstagio, ...daTag];
}

function reuniaoPorContato(r: Reunioes): Map<string, Date> {
  return new Map([...r.realizadas, ...r.noShow, ...r.aRealizar].map((x) => [x.id, x.quando]));
}

export interface PainelCustos {
  custos: Custos;
  reunioes: ResumoReunioes;
  leads: number;
  propostas: number;
  /** último dia com custo lançado (pra avisar quando o custo está atrasado) */
  custoAte: Date | null;
}

export async function painelCustos(p: { inicio: Date; fim: Date }): Promise<PainelCustos> {
  const janela = { gte: p.inicio, lt: p.fim };
  const [gastos, leads, reunioes, ultimo] = await Promise.all([
    db.custoAds.groupBy({ by: ["origem"], where: { data: janela }, _sum: { custoCents: true } }),
    db.contact.count({
      where: { createdAt: janela, OR: [{ phone: { not: null } }, { email: { not: null } }] },
    }),
    carregarReunioes(),
    db.custoAds.findFirst({ orderBy: { data: "desc" }, select: { data: true } }),
  ]);

  const custoTotalCents = gastos.reduce((s, g) => s + (g._sum.custoCents ?? 0), 0);
  const custoReuniaoCents = gastos
    .filter((g) => ehCustoDeReuniao(g.origem))
    .reduce((s, g) => s + (g._sum.custoCents ?? 0), 0);
  const resumo = resumirReunioes(reunioes, p);
  const propostas = contarPropostasApresentadas(
    await carregarMarcasDeProposta(reunioes),
    reuniaoPorContato(reunioes),
    p,
  );

  return {
    custos: calcularCustos({
      custoTotalCents,
      custoReuniaoCents,
      leads,
      realizadas: resumo.realizadas,
      marcadas: resumo.marcadasNoPeriodo,
      propostas,
    }),
    reunioes: resumo,
    leads,
    propostas,
    custoAte: ultimo?.data ?? null,
  };
}
