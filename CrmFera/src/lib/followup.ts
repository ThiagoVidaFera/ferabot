import { db } from "@/lib/db";
import { config } from "@/lib/config";

/**
 * Fila de follow-up.
 *
 * A régua antiga (followup.py) calculava a etapa pela IDADE DO LEAD — e por
 * isso mandava o D2 pra quem tinha respondido ontem. Aqui a conta é outra:
 *
 *   1. o relógio começa no NOSSO ÚLTIMO CONTATO, não na chegada do lead;
 *   2. se ele RESPONDEU depois disso, sai da fila (a bola é nossa, não dele);
 *   3. cada etapa entra no máximo uma vez — a própria timeline é o registro.
 *
 * Nada disso precisa de tabela nova: a linha do tempo já sabe tudo (LEI 3).
 */

export type Etapa = {
  chave: string;
  rotulo: string;
  /** dias desde o nosso último contato para o lead entrar nesta etapa */
  aposDias: number;
};

export const ETAPAS_PADRAO: Etapa[] = [
  { chave: "D0", rotulo: "Primeiro contato", aposDias: 0 },
  { chave: "D2", rotulo: "2º toque", aposDias: 2 },
  { chave: "D5", rotulo: "3º toque", aposDias: 5 },
  { chave: "D12", rotulo: "Último toque", aposDias: 12 },
];

/** Estágios em que ainda faz sentido perseguir. Cliente e perdido saem. */
const ESTAGIOS_TRABALHAVEIS = ["novo", "frio", "conversando", "futuro", "sem_resposta"];

export async function etapas(): Promise<Etapa[]> {
  const bruto = await config("followup_etapas");
  if (!bruto) return ETAPAS_PADRAO;
  try {
    const lista = JSON.parse(bruto) as Etapa[];
    return Array.isArray(lista) && lista.length ? lista : ETAPAS_PADRAO;
  } catch {
    return ETAPAS_PADRAO;
  }
}

export type ItemFila = {
  contactId: string;
  nome: string;
  telefone: string | null;
  estagio: string;
  origem: string;
  etapa: Etapa;
  diasSemContato: number;
  ultimoNosso: Date | null;
  ultimaDele: Date | null;
  respondeuAlgumaVez: boolean;
  chips: string[];
};

type Marco = {
  ultimoNosso: Date | null;
  ultimaDele: Date | null;
  etapasFeitas: Set<string>;
};

/** Lê a linha do tempo e devolve o que importa pra decidir o próximo toque. */
function lerMarcos(
  eventos: Array<{
    eventType: string;
    channel: string | null;
    metadata: unknown;
    timestamp: Date;
  }>,
): Marco {
  const m: Marco = { ultimoNosso: null, ultimaDele: null, etapasFeitas: new Set() };

  for (const ev of eventos) {
    const meta = (ev.metadata ?? {}) as Record<string, unknown>;

    if (typeof meta.followup === "string") m.etapasFeitas.add(meta.followup);

    const ehMensagem = ev.eventType === "whatsapp_message";
    const ehSaida =
      ev.eventType === "broadcast" ||
      ev.eventType === "email_sent" ||
      (ehMensagem && meta.direcao === "enviada");
    const ehEntrada = ehMensagem && meta.direcao === "recebida";

    if (ehSaida && (!m.ultimoNosso || ev.timestamp > m.ultimoNosso)) m.ultimoNosso = ev.timestamp;
    if (ehEntrada && (!m.ultimaDele || ev.timestamp > m.ultimaDele)) m.ultimaDele = ev.timestamp;
  }
  return m;
}

function diasEntre(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86400000);
}

/**
 * Monta a fila do dia. Um contato aparece no MÁXIMO uma vez, na etapa mais
 * avançada que ele alcança.
 */
export async function filaDoDia(limite = 300): Promise<ItemFila[]> {
  const lista = await etapas();
  const agora = new Date();

  // Em LOTES de propósito. Um `findMany` de 1500 contatos com
  // `timelineEvents` aninhado estoura o limite de variáveis do SQLite
  // ("The query parameter limit supported by your database is exceeded") —
  // o Prisma monta uma subconsulta por pai pra respeitar o `take` da relação.
  //
  // Achado em 30/08/2026 e pior do que parece: a fila voltava VAZIA, então a
  // tela de Follow-up mostrava "nada pra fazer" com 92 leads parados atrás.
  // Erro que se disfarça de lista vazia é o mais caro que existe.
  const base = await db.contact.findMany({
    where: {
      lifecycleStage: { in: ESTAGIOS_TRABALHAVEIS },
      phone: { not: null },
    },
    orderBy: { lastActivityAt: "desc" },
    take: 1500,
    select: { id: true },
  });

  const LOTE = 100;
  const contatos: Array<
    Awaited<ReturnType<typeof db.contact.findFirstOrThrow>> & {
      timelineEvents: Array<{ eventType: string; channel: string | null; metadata: unknown; timestamp: Date }>;
    }
  > = [];
  for (let i = 0; i < base.length; i += LOTE) {
    const ids = base.slice(i, i + LOTE).map((x) => x.id);
    const parte = await db.contact.findMany({
      where: { id: { in: ids } },
      orderBy: { lastActivityAt: "desc" },
      include: { timelineEvents: { orderBy: { timestamp: "desc" }, take: 60 } },
    });
    contatos.push(...parte);
  }

  const fila: ItemFila[] = [];

  for (const c of contatos) {
    const marcos = lerMarcos(c.timelineEvents);

    // REGRA 1 — respondeu depois do nosso último toque? A vez é nossa de
    // conversar, não de disparar régua. Sai da fila.
    if (marcos.ultimaDele && (!marcos.ultimoNosso || marcos.ultimaDele > marcos.ultimoNosso)) {
      continue;
    }

    // O relógio começa no NOSSO último contato; se nunca falamos, na chegada.
    const referencia = marcos.ultimoNosso ?? c.createdAt;
    const dias = diasEntre(referencia, agora);

    // etapa = a mais avançada cujo prazo já venceu e que ainda não foi feita
    let escolhida: Etapa | null = null;
    for (const e of lista) {
      if (dias >= e.aposDias && !marcos.etapasFeitas.has(e.chave)) escolhida = e;
    }
    if (!escolhida) continue;

    // Nunca dois toques no mesmo dia.
    if (marcos.ultimoNosso && diasEntre(marcos.ultimoNosso, agora) < 1 && escolhida.aposDias > 0) {
      continue;
    }

    const tags = Array.isArray(c.tags) ? (c.tags as string[]) : [];

    fila.push({
      contactId: c.id,
      nome: c.name,
      telefone: c.phone,
      estagio: c.lifecycleStage,
      origem: c.origem,
      etapa: escolhida,
      diasSemContato: dias,
      ultimoNosso: marcos.ultimoNosso,
      ultimaDele: marcos.ultimaDele,
      respondeuAlgumaVez: !!marcos.ultimaDele,
      chips: tags.slice(0, 4),
    });

    if (fila.length >= limite) break;
  }

  // quem está esperando há mais tempo aparece primeiro
  fila.sort((a, b) => b.diasSemContato - a.diasSemContato);
  return fila;
}

/** Quem respondeu e está esperando VOCÊ — a fila que importa mais que a régua. */
export async function aguardandoResposta(limite = 50) {
  const contatos = await db.contact.findMany({
    where: { lifecycleStage: { in: [...ESTAGIOS_TRABALHAVEIS, "call_marcada", "proposta"] } },
    orderBy: { lastActivityAt: "desc" },
    take: 300,
    include: { timelineEvents: { orderBy: { timestamp: "desc" }, take: 40 } },
  });

  const saida = [];
  for (const c of contatos) {
    const m = lerMarcos(c.timelineEvents);
    if (!m.ultimaDele) continue;
    if (m.ultimoNosso && m.ultimoNosso >= m.ultimaDele) continue;
    saida.push({
      contactId: c.id,
      nome: c.name,
      telefone: c.phone,
      estagio: c.lifecycleStage,
      desde: m.ultimaDele,
      horas: Math.floor((Date.now() - m.ultimaDele.getTime()) / 3600000),
    });
    if (saida.length >= limite) break;
  }
  saida.sort((a, b) => b.horas - a.horas);
  return saida;
}
