import { db } from "@/lib/db";
import { config } from "@/lib/config";
import { internos } from "@/lib/followup-auto";
import { tagsDe } from "@/lib/tags";
import { calorDe } from "@/lib/calor";
import {
  janelaWhatsapp,
  calcularPrioridade,
  ordenarFila,
  ehEncerramento,
  type Janela,
  type Prioridade,
} from "@/lib/fila-prioridade";

/**
 * Fila diaria de "quem falou e ninguem respondeu".
 *
 * Fonte: `WhatsappMessage`. Entra na fila o contato cuja ULTIMA mensagem de
 * WhatsApp e do lead (inbound) — nao existe outbound nosso nesse instante ou
 * depois. Ela NAO envia nada: so lista, pontua e (em `fila-sugestao.ts`)
 * sugere o texto. Enviar continua sendo ato humano, no Inbox.
 *
 * Complementa a regua de `followup.ts` (que e a fila do NOSSO silencio): aqui
 * a bola esta com a gente, e cada hora parada custa mais.
 */

const HORA_MS = 3_600_000;
const DIA_MS = 24 * HORA_MS;
const DIAS_PADRAO = 30;
const LIMITE_PADRAO = 200;
const LOTE = 100;

/** Marcas de "nao me chame" — a unica coisa que tira o lead da fila a contragosto. */
const TAGS_SILENCIO = ["optout", "controle-optout", "controle-nao-perturbe"];
const ESTADOS_FORA = ["arquivada", "excluida"];

const ROTULO_MIDIA: Record<string, string> = {
  audio: "[áudio]",
  image: "[imagem]",
  video: "[vídeo]",
  document: "[documento]",
};

export type OpcoesFila = {
  agora?: Date;
  /** So considera mensagens dos ultimos N dias (lead mais antigo ja esfriou). */
  dias?: number;
  limite?: number;
};

export type ItemSemResposta = {
  contactId: string;
  nome: string;
  telefone: string | null;
  estagio: string;
  origem: string;
  instanceId: string | null;
  tipoConexao: string | null;
  ultimaMensagem: { texto: string; tipo: string; em: Date };
  primeiraSemResposta: Date;
  mensagensSemResposta: number;
  horasParado: number;
  janela: Janela;
  /** Cloud API + janela fechada: texto livre nao entrega, so template aprovado. */
  exigeTemplate: boolean;
  encerramento: boolean;
  calor: number;
  prioridade: Prioridade;
};

type Candidato = { contactId: string; ultima: Date; primeira: Date; total: number };

type LinhaBruta = { contactId: string; ultima: string; primeira: string; total: number | bigint };

/**
 * Contatos cuja ultima mensagem e inbound: nenhum outbound nosso com
 * timestamp >= ao dele. Agrega por contato: primeira/ultima/quantidade das
 * mensagens que ainda esperam resposta.
 */
async function candidatos(agora: Date, dias: number): Promise<Candidato[]> {
  const desde = new Date(agora.getTime() - dias * DIA_MS).toISOString();
  const linhas = await db.$queryRaw<LinhaBruta[]>`
    SELECT m.contactId AS contactId,
           MAX(m.timestamp) AS ultima,
           MIN(m.timestamp) AS primeira,
           COUNT(*) AS total
    FROM WhatsappMessage m
    WHERE m.contactId IS NOT NULL
      AND m.direction = 'inbound'
      AND NOT EXISTS (
        SELECT 1 FROM WhatsappMessage o
        WHERE o.contactId = m.contactId
          AND o.direction = 'outbound'
          AND o.timestamp >= m.timestamp
      )
    GROUP BY m.contactId
    HAVING MAX(m.timestamp) >= ${desde}
  `;
  return linhas
    .map((l) => ({
      contactId: l.contactId,
      ultima: new Date(l.ultima),
      primeira: new Date(l.primeira),
      total: Number(l.total),
    }))
    .filter((c) => c.ultima.getTime() <= agora.getTime() + HORA_MS); // ignora mensagem do futuro
}

export type ContatoLeve = {
  id: string;
  name: string;
  phone: string | null;
  lifecycleStage: string;
  origem: string;
  tags: unknown;
  conversa: { estado: string } | null;
};

function digitos(v: string | null): string {
  return (v ?? "").replace(/\D/g, "");
}

export function elegivel(c: ContatoLeve, numerosInternos: Set<string>): boolean {
  if (c.lifecycleStage === "perdido" || c.lifecycleStage === "pessoal" || c.lifecycleStage === "sem_automacao") return false;
  if (c.conversa && ESTADOS_FORA.includes(c.conversa.estado)) return false;
  if (tagsDe(c.tags).some((t) => TAGS_SILENCIO.includes(t))) return false;
  const fone = digitos(c.phone);
  if (fone && numerosInternos.has(fone)) return false;
  return true;
}

function emLotes<T>(lista: readonly T[], tamanho: number): T[][] {
  const partes: T[][] = [];
  for (let i = 0; i < lista.length; i += tamanho) partes.push(lista.slice(i, i + tamanho));
  return partes;
}

/** Candidatos que sobrevivem aos filtros de contato, com o contato junto. */
async function selecionar(agora: Date, dias: number) {
  const [brutos, numerosInternos] = await Promise.all([candidatos(agora, dias), internos()]);
  const saida: Array<{ cand: Candidato; contato: ContatoLeve }> = [];
  for (const lote of emLotes(brutos, LOTE)) {
    const contatos = await db.contact.findMany({
      where: { id: { in: lote.map((c) => c.contactId) } },
      select: {
        id: true,
        name: true,
        phone: true,
        lifecycleStage: true,
        origem: true,
        tags: true,
        conversa: { select: { estado: true } },
      },
    });
    const porId = new Map(contatos.map((c) => [c.id, c]));
    for (const cand of lote) {
      const contato = porId.get(cand.contactId);
      if (contato && elegivel(contato, numerosInternos)) saida.push({ cand, contato });
    }
  }
  return saida;
}

export function textoDaMensagem(m: { body: string; type: string }): string {
  const t = m.body.trim();
  if (t) return t;
  return ROTULO_MIDIA[m.type] ?? "[mensagem sem texto]";
}

async function diasConfigurados(opts: OpcoesFila): Promise<number> {
  if (opts.dias) return opts.dias;
  const n = Number(await config("fila_sem_resposta_dias"));
  return Number.isFinite(n) && n > 0 ? n : DIAS_PADRAO;
}

export async function contarSemResposta(opts: OpcoesFila = {}): Promise<number> {
  const agora = opts.agora ?? new Date();
  return (await selecionar(agora, await diasConfigurados(opts))).length;
}

export async function filaSemResposta(opts: OpcoesFila = {}): Promise<ItemSemResposta[]> {
  const agora = opts.agora ?? new Date();
  const dias = await diasConfigurados(opts);
  const limite = opts.limite ?? LIMITE_PADRAO;

  const selecionados = await selecionar(agora, dias);
  const instancias = await db.whatsappInstance.findMany({ select: { id: true, provider: true } });
  const providerDe = new Map(instancias.map((i) => [i.id, i.provider]));
  const desde = new Date(agora.getTime() - dias * DIA_MS);

  const itens: ItemSemResposta[] = [];
  for (const lote of emLotes(selecionados, LOTE)) {
    const ids = lote.map((s) => s.contato.id);
    const [enriquecidos, entradas] = await Promise.all([
      db.contact.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          purchaseCount: true,
          totalRevenue: true,
          timelineEvents: {
            where: { eventType: "whatsapp_message" },
            orderBy: { timestamp: "desc" },
            take: 40,
            select: { eventType: true, metadata: true },
          },
          deals: { select: { valueCents: true } },
        },
      }),
      db.whatsappMessage.findMany({
        where: { contactId: { in: ids }, direction: "inbound", timestamp: { gte: desde } },
        orderBy: { timestamp: "desc" },
        select: { contactId: true, body: true, type: true, timestamp: true, instanceId: true },
      }),
    ]);
    const extra = new Map(enriquecidos.map((c) => [c.id, c]));
    const ultimaPorContato = new Map<string, (typeof entradas)[number]>();
    for (const m of entradas) {
      if (m.contactId && !ultimaPorContato.has(m.contactId)) ultimaPorContato.set(m.contactId, m);
    }

    for (const { cand, contato } of lote) {
      const ult = ultimaPorContato.get(contato.id);
      const mais = extra.get(contato.id);
      if (!ult || !mais) continue;

      const texto = textoDaMensagem(ult);
      const janela = janelaWhatsapp(cand.ultima, agora);
      const tipoConexao = ult.instanceId ? (providerDe.get(ult.instanceId) ?? null) : null;
      const horasParado = Math.max(0, (agora.getTime() - cand.primeira.getTime()) / HORA_MS);
      const encerramento = ehEncerramento(texto);
      const { pontos: calor } = calorDe(
        { purchaseCount: mais.purchaseCount, lifecycleStage: contato.lifecycleStage, origem: contato.origem },
        mais.timelineEvents,
      );
      const valorNegocioCents = mais.deals.reduce((max, d) => Math.max(max, d.valueCents), 0);

      itens.push({
        contactId: contato.id,
        nome: contato.name,
        telefone: contato.phone,
        estagio: contato.lifecycleStage,
        origem: contato.origem,
        instanceId: ult.instanceId,
        tipoConexao,
        ultimaMensagem: { texto, tipo: ult.type, em: cand.ultima },
        primeiraSemResposta: cand.primeira,
        mensagensSemResposta: cand.total,
        horasParado,
        janela,
        exigeTemplate: tipoConexao === "cloud_api" && janela.estado === "fechada",
        encerramento,
        calor,
        prioridade: calcularPrioridade({
          horasParado,
          calor,
          janela,
          origem: contato.origem,
          estagio: contato.lifecycleStage,
          receitaCents: mais.totalRevenue,
          valorNegocioCents,
          encerramento,
        }),
      });
    }
  }

  return ordenarFila(itens).slice(0, limite);
}
