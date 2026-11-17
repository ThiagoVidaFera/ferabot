import { db } from "@/lib/db";

/**
 * Economia por funil: quanto entrou, quanto custou, e o que sobrou.
 *
 * Sem custo, o CRM sabe a receita mas não sabe o preço dela. E CPA calculado
 * no olho é pior que nenhum: em ago/2026 o painel antigo contava 3.252 "leads"
 * dos quais 2.760 eram linhas vazias — todo custo-por-lead saía ~6,6× menor do
 * que a realidade. Aqui o denominador é contato REAL (com telefone ou e-mail).
 */

export type LinhaFunil = {
  origem: string;
  leads: number;
  clientes: number;
  vendas: number;
  /** reuniões marcadas pela agenda (customFields.evento_data) — coorte do mês */
  agendadas: number;
  /** dessas, quantas o closer marcou "compareceu" na ficha */
  realizadas: number;
  receitaCents: number;
  custoCents: number;
  /** custo por lead */
  cplCents: number | null;
  /** custo por cliente adquirido */
  cacCents: number | null;
  /** custo por reunião REALIZADA (não por marcada) */
  cprCents: number | null;
  /** receita / custo */
  roas: number | null;
  conversao: number;
  margemCents: number | null;
};

export type ResumoAquisicao = {
  linhas: LinhaFunil[];
  totais: LinhaFunil;
  temCusto: boolean;
  periodo: { de: Date; ate: Date };
};

export async function resumoAquisicao(de: Date, ate: Date): Promise<ResumoAquisicao> {
  const [contatos, compras, custos, coorte] = await Promise.all([
    // Denominador honesto: só quem tem como ser contatado é lead.
    db.contact.groupBy({
      by: ["origem"],
      where: {
        createdAt: { gte: de, lt: ate },
        OR: [{ phone: { not: null } }, { email: { not: null } }],
      },
      _count: true,
    }),
    db.purchase.findMany({
      where: { createdAt: { gte: de, lt: ate } },
      select: { origem: true, valueCents: true, contactId: true },
    }),
    db.custoAds.groupBy({
      by: ["origem"],
      where: { data: { gte: de, lt: ate } },
      _sum: { custoCents: true },
    }),
    // Reunião: a agenda grava evento_data no customFields (JSON — o SQLite não
    // filtra por dentro dele, então o recorte é em memória, só na janela do mês).
    db.contact.findMany({
      where: { createdAt: { gte: de, lt: ate } },
      select: { id: true, origem: true, customFields: true },
    }),
  ]);

  const agendadosPorOrigem = new Map<string, string[]>();
  for (const c of coorte) {
    const cf = c.customFields && typeof c.customFields === "object" ? (c.customFields as Record<string, unknown>) : {};
    if (typeof cf.evento_data !== "string" || !cf.evento_data) continue;
    agendadosPorOrigem.set(c.origem, [...(agendadosPorOrigem.get(c.origem) ?? []), c.id]);
  }
  const idsAgendados = [...agendadosPorOrigem.values()].flat();
  const eventosReuniao = idsAgendados.length
    ? await db.timelineEvent.findMany({
        where: { eventType: "call", contactId: { in: idsAgendados } },
        select: { contactId: true, metadata: true },
      })
    : [];
  const compareceram = new Set(
    eventosReuniao
      .filter((e) => (e.metadata as Record<string, unknown> | null)?.resultado === "compareceu")
      .map((e) => e.contactId),
  );

  const origens = new Set<string>();
  contatos.forEach((c) => origens.add(c.origem));
  compras.forEach((c) => origens.add(c.origem ?? "outro"));
  custos.forEach((c) => origens.add(c.origem));
  agendadosPorOrigem.forEach((_, o) => origens.add(o));

  const linhas: LinhaFunil[] = [];

  for (const origem of origens) {
    const leads = contatos.find((c) => c.origem === origem)?._count ?? 0;
    const doFunil = compras.filter((c) => (c.origem ?? "outro") === origem);
    const receitaCents = doFunil.reduce((s, c) => s + c.valueCents, 0);
    const clientes = new Set(doFunil.map((c) => c.contactId)).size;
    const custoCents = custos.find((c) => c.origem === origem)?._sum.custoCents ?? 0;
    const agendadosIds = agendadosPorOrigem.get(origem) ?? [];
    const realizadas = agendadosIds.filter((id) => compareceram.has(id)).length;

    linhas.push({
      origem,
      leads,
      clientes,
      vendas: doFunil.length,
      agendadas: agendadosIds.length,
      realizadas,
      receitaCents,
      custoCents,
      cplCents: custoCents && leads ? Math.round(custoCents / leads) : null,
      cacCents: custoCents && clientes ? Math.round(custoCents / clientes) : null,
      cprCents: custoCents && realizadas ? Math.round(custoCents / realizadas) : null,
      roas: custoCents ? receitaCents / custoCents : null,
      conversao: leads ? clientes / leads : 0,
      margemCents: custoCents ? receitaCents - custoCents : null,
    });
  }

  // Quem gasta dinheiro aparece primeiro; depois quem traz receita.
  linhas.sort((a, b) => b.custoCents - a.custoCents || b.receitaCents - a.receitaCents);

  const soma = (f: (l: LinhaFunil) => number) => linhas.reduce((s, l) => s + f(l), 0);
  const tLeads = soma((l) => l.leads);
  const tClientes = soma((l) => l.clientes);
  const tReceita = soma((l) => l.receitaCents);
  const tCusto = soma((l) => l.custoCents);
  const tRealizadas = soma((l) => l.realizadas);

  const totais: LinhaFunil = {
    origem: "TOTAL",
    leads: tLeads,
    clientes: tClientes,
    vendas: soma((l) => l.vendas),
    agendadas: soma((l) => l.agendadas),
    realizadas: tRealizadas,
    receitaCents: tReceita,
    custoCents: tCusto,
    cplCents: tCusto && tLeads ? Math.round(tCusto / tLeads) : null,
    cacCents: tCusto && tClientes ? Math.round(tCusto / tClientes) : null,
    cprCents: tCusto && tRealizadas ? Math.round(tCusto / tRealizadas) : null,
    roas: tCusto ? tReceita / tCusto : null,
    conversao: tLeads ? tClientes / tLeads : 0,
    margemCents: tCusto ? tReceita - tCusto : null,
  };

  return { linhas, totais, temCusto: tCusto > 0, periodo: { de, ate } };
}

export type EntradaCusto = {
  data: string; // YYYY-MM-DD
  origem: string;
  campanha?: string;
  custoCentavos: number;
  impressoes?: number;
  cliques?: number;
  fonte?: string;
  externalId?: string;
};

/** Grava custo de anúncio. Reimportar o mesmo dia/origem ATUALIZA, não soma. */
export async function registrarCusto(e: EntradaCusto) {
  const data = new Date(`${e.data}T00:00:00`);
  if (Number.isNaN(data.getTime())) throw new Error("data invalida (use AAAA-MM-DD)");
  if (!e.origem?.trim()) throw new Error("origem obrigatoria");
  if (!Number.isInteger(e.custoCentavos) || e.custoCentavos < 0) {
    throw new Error("custoCentavos deve ser inteiro em CENTAVOS");
  }

  return db.custoAds.upsert({
    where: {
      data_origem_campanha: {
        data,
        origem: e.origem.trim(),
        campanha: e.campanha?.trim() ?? "",
      },
    },
    update: {
      custoCents: e.custoCentavos,
      impressoes: e.impressoes ?? 0,
      cliques: e.cliques ?? 0,
      fonte: e.fonte ?? "manual",
    },
    create: {
      data,
      origem: e.origem.trim(),
      campanha: e.campanha?.trim() ?? "",
      custoCents: e.custoCentavos,
      impressoes: e.impressoes ?? 0,
      cliques: e.cliques ?? 0,
      fonte: e.fonte ?? "manual",
      externalId: e.externalId,
    },
  });
}
