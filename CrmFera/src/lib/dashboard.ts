// Visão do Painel por período: leads criados no intervalo, agrupados pela etapa ATUAL.
// Funções puras — a consulta ao banco fica na página.

export type PeriodoKey = "hoje" | "ontem" | "semana" | "mes" | "custom";

export type Periodo = {
  key: PeriodoKey;
  inicio: Date;
  /** Exclusivo. */
  fim: Date;
  de: string;
  ate: string;
};

export type Grupo = "novo" | "interagiu" | "interagindo" | "agendado" | "cliente" | "perdido";

export const GRUPOS: { key: Grupo; label: string; cor: string }[] = [
  { key: "novo", label: "Novo", cor: "#2563eb" },
  { key: "interagiu", label: "Interagiu", cor: "#0284c7" },
  { key: "interagindo", label: "Interagindo", cor: "#7c3aed" },
  { key: "agendado", label: "Agendado", cor: "#15803d" },
  { key: "cliente", label: "Cliente", cor: "#a16207" },
  { key: "perdido", label: "Perdido", cor: "#dc2626" },
];

export type ContatoDash = { createdAt: Date; lifecycleStage: string; respondeu: boolean };

export type Contagem = Record<Grupo, number> & { leads: number };

export type LinhaDia = Contagem & { dia: string; taxa: number | null };

const DIA_MS = 86400000;

const pad = (n: number) => String(n).padStart(2, "0");

export function chaveDia(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function inicioDoDia(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function somarDias(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function lerDia(s: string | undefined): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [a, m, d] = s.split("-").map(Number);
  const data = new Date(a, m - 1, d);
  return Number.isNaN(data.getTime()) ? null : data;
}

export function resolverPeriodo(
  key: string | undefined,
  de: string | undefined,
  ate: string | undefined,
  agora: Date = new Date(),
): Periodo {
  const hoje = inicioDoDia(agora);
  let inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  let fim = somarDias(hoje, 1);
  let k: PeriodoKey = "mes";

  if (key === "hoje") {
    k = "hoje";
    inicio = hoje;
  } else if (key === "ontem") {
    k = "ontem";
    inicio = somarDias(hoje, -1);
    fim = hoje;
  } else if (key === "semana") {
    k = "semana";
    inicio = somarDias(hoje, -((hoje.getDay() + 6) % 7)); // segunda-feira
  } else if (key === "custom") {
    const d1 = lerDia(de);
    const d2 = lerDia(ate);
    if (d1 && d2) {
      const [a, b] = d1 <= d2 ? [d1, d2] : [d2, d1];
      k = "custom";
      inicio = a;
      fim = somarDias(b, 1);
    }
  }
  return { key: k, inicio, fim, de: chaveDia(inicio), ate: chaveDia(somarDias(fim, -1)) };
}

export function grupoDe(lifecycleStage: string, respondeu: boolean): Grupo {
  switch (lifecycleStage) {
    case "conversando":
      return "interagindo";
    case "call_marcada":
    case "proposta":
      return "agendado";
    case "cliente":
      return "cliente";
    case "perdido":
      return "perdido";
    default:
      return respondeu ? "interagiu" : "novo";
  }
}

export function contagemVazia(): Contagem {
  return { leads: 0, novo: 0, interagiu: 0, interagindo: 0, agendado: 0, cliente: 0, perdido: 0 };
}

export function contar(contatos: readonly ContatoDash[]): Contagem {
  return contatos.reduce<Contagem>(
    (acc, c) => {
      const g = grupoDe(c.lifecycleStage, c.respondeu);
      return { ...acc, leads: acc.leads + 1, [g]: acc[g] + 1 };
    },
    contagemVazia(),
  );
}

/** Quem já passou de "só chegou": usado no funil Leads → Interagiu → Agendado. */
export function funil(c: Contagem): { leads: number; interagiu: number; agendado: number } {
  const agendado = c.agendado + c.cliente;
  return { leads: c.leads, interagiu: c.interagiu + c.interagindo + agendado, agendado };
}

export function pct(parte: number, total: number): number {
  return total > 0 ? Math.round((parte / total) * 100) : 0;
}

/** Um item por dia do período (mais recente primeiro), inclusive dias sem lead. */
export function historicoDiario(contatos: readonly ContatoDash[], p: Periodo): LinhaDia[] {
  const porDia = new Map<string, ContatoDash[]>();
  for (const c of contatos) {
    const k = chaveDia(c.createdAt);
    porDia.set(k, [...(porDia.get(k) ?? []), c]);
  }
  const dias = Math.round((p.fim.getTime() - p.inicio.getTime()) / DIA_MS);
  const linhas: LinhaDia[] = [];
  for (let i = 0; i < dias; i++) {
    const dia = chaveDia(somarDias(p.inicio, i));
    const c = contar(porDia.get(dia) ?? []);
    linhas.push({ ...c, dia, taxa: c.leads ? pct(c.agendado + c.cliente, c.leads) : null });
  }
  return linhas.reverse();
}

export function reunioesPorDia(
  datas: readonly Date[],
  p: Periodo,
): { dia: string; total: number }[] {
  const mapa = new Map<string, number>();
  for (const d of datas) mapa.set(chaveDia(d), (mapa.get(chaveDia(d)) ?? 0) + 1);
  const dias = Math.round((p.fim.getTime() - p.inicio.getTime()) / DIA_MS);
  return Array.from({ length: dias }, (_, i) => {
    const dia = chaveDia(somarDias(p.inicio, i));
    return { dia, total: mapa.get(dia) ?? 0 };
  });
}

export function diaCurto(chave: string): string {
  const [, m, d] = chave.split("-");
  return `${d}/${m}`;
}
