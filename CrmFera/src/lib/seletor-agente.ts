import { db } from "@/lib/db";
import { semAutomacao } from "@/lib/estagios";
import { tagsDe, temControle, produtoDaTag, tagComprou } from "@/lib/tags";
import { personaDaSessao, ehLeadComercial, recarregarPersonas } from "@/lib/numero-comercial";
import { config } from "@/lib/config";

/**
 * Quem atende esta mensagem? (playbook: "a troca de bastao")
 *
 * Um agente por contato. Ordem de prioridade quando duas tags coexistem:
 *  1. controle-* / humano vence tudo — ninguem responde, o humano assume;
 *  2. comprou-[produto] (ou estagio cliente) desliga os agentes daquele
 *     produto — ninguem vende o que a pessoa ja comprou;
 *  3. venda vence nutricao (a maior `prioridade` configurada no agente);
 *  4. empate = a tag carimbada por ULTIMO (e onde a pessoa esta agora).
 *
 * Sem nenhum gatilho casando no numero oficial, vale a porta do anuncio: o
 * agente `recepcao`. Fora do numero oficial (WAHA pessoal) so rodam os
 * agentes de agentesNumeroPessoal(), e so com gatilho de funil casando e
 * nenhum humano tendo falado na conversa — e o gate que impede o robo de
 * responder as conversas pessoais do dono e da equipe.
 */

export const SLUG_RECEPCAO = "recepcao";
/** O único agente que conversa com quem tem reunião futura (confirma e lembra). */
export const SLUG_CONFIRMACAO = "confirmacao-reuniao";

export type AgenteEscolhido = Awaited<ReturnType<typeof db.agent.findFirst>>;

export type Escolha = {
  agente: NonNullable<AgenteEscolhido> | null;
  motivo: string;
  /** tag que casou o gatilho (quando foi por tag) */
  porTag?: string;
  /** numero pessoal + gente ja falou: o chamador carimba `humano` */
  humanoAssumiu?: boolean;
};

function listaDe(v: string | null | undefined): string[] {
  return String(v ?? "")
    .split(/[,\s]+/)
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

/** "inscrito-evento-" casa com "inscrito-evento-c01"; "quente-yt" so com ela mesma. */
function tagCasa(padrao: string, tag: string): boolean {
  return padrao.endsWith("-") ? tag.startsWith(padrao) : tag === padrao;
}

/**
 * Listas de agentes por tipo de número (configuráveis, vazias por padrão).
 *
 * - `agentes_numero_pessoal`: agentes que podem responder num número PESSOAL (WAHA do dono ou da
 *   equipe). Nesses números o robô só fala com LEAD DE FUNIL (origem `funil:*` ou tag de porta) e
 *   sai da conversa quando alguém digita. Família, amigos e cliente antigo continuam sem robô.
 * - `agentes_preco_publico`: agentes cuja oferta tem preço público na própria página: podem falar o valor.
 *
 * Valor: slugs separados por vírgula (tela de Configurações ou env AGENTES_NUMERO_PESSOAL /
 * AGENTES_PRECO_PUBLICO). Sem configuração, nenhum agente roda em número pessoal: o número
 * conectado no CRM é tratado como o número oficial do negócio.
 */
function slugs(valor: string | undefined | null): string[] {
  return listaDe(valor);
}

let listaNumeroPessoal: string[] = slugs(process.env.AGENTES_NUMERO_PESSOAL);
let precoPublico: string[] = slugs(process.env.AGENTES_PRECO_PUBLICO);
let sessoesPessoais: string[] = slugs(process.env.SESSOES_PESSOAIS);
let vozDoDono: string[] = slugs(process.env.AGENTES_VOZ_DO_DONO);

export function agentesNumeroPessoal(): string[] {
  return listaNumeroPessoal;
}

/**
 * Sessões do WAHA que são números PESSOAIS (`sessoes_pessoais`, env SESSOES_PESSOAIS). Vazio por
 * padrão: o WhatsApp conectado no CRM é o número oficial do negócio e todos os agentes rodam nele.
 * Liste aqui o celular pessoal do dono se ele também estiver conectado: nele só rodam os
 * agentes de `agentes_numero_pessoal`, só com lead de funil, e nunca com família e amigos.
 */
export function sessoesPessoaisConfiguradas(): string[] {
  return sessoesPessoais;
}

export function agentesPrecoPublico(): string[] {
  return precoPublico;
}

/** Relê as listas e as personas do Setting (chamado a cada escolha de agente). */
export async function recarregarListasDeAgentes(): Promise<void> {
  listaNumeroPessoal = slugs(await config("agentes_numero_pessoal", "AGENTES_NUMERO_PESSOAL"));
  precoPublico = slugs(await config("agentes_preco_publico", "AGENTES_PRECO_PUBLICO"));
  sessoesPessoais = slugs(await config("sessoes_pessoais", "SESSOES_PESSOAIS"));
  vozDoDono = slugs(await config("agentes_voz_do_dono", "AGENTES_VOZ_DO_DONO"));
  await recarregarPersonas();
}

/** Só para testes. */
export function _definirListasDeAgentes(l: { numeroPessoal?: string[]; precoPublico?: string[]; sessoesPessoais?: string[] }): void {
  if (l.sessoesPessoais) sessoesPessoais = l.sessoesPessoais;
  if (l.numeroPessoal) listaNumeroPessoal = l.numeroPessoal;
  if (l.precoPublico) precoPublico = l.precoPublico;
}

/**
 * Agente de oferta com data de validade: depois do instante ele sai da disputa sozinho
 * (promoção com prazo real). Configurável em `agentes_com_prazo` como JSON {"slug": "ISO"}.
 */
export const AGENTES_COM_PRAZO: Record<string, Date> = (() => {
  try {
    const bruto = JSON.parse(process.env.AGENTES_COM_PRAZO || "{}") as Record<string, string>;
    return Object.fromEntries(Object.entries(bruto).map(([k, v]) => [k, new Date(v)]));
  } catch {
    return {};
  }
})();

export function agenteForaDoPrazo(slug: string, agora: Date = new Date()): boolean {
  const fim = AGENTES_COM_PRAZO[slug];
  return !!fim && agora.getTime() > fim.getTime();
}

/** Agentes que falam com a voz do dono em PRIMEIRA pessoa (o guarda barra o dono em terceira
 *  pessoa neles). Configurável em `agentes_voz_do_dono` (env AGENTES_VOZ_DO_DONO). Vazio por padrão:
 *  os agentes padrão falam como a equipe do dono e citam o dono em terceira pessoa. */
export function agentesVozDoDono(): string[] {
  return vozDoDono;
}

/**
 * Origens cuja PRIMEIRA mensagem é do dono, na mão: o robô nunca abre nem responde esse lead,
 * só entra com o follow-up de conversa parada (`modo: "followup"`). Nesses leads o dono digitar
 * NÃO tira o agente, então o gate `humanoJaFalou` não vale pra eles. Vazio por padrão: deixar um
 * funil aqui faz o lead esperar o dono (lead que chega de madrugada fica sem resposta).
 */
export const ORIGENS_ABERTURA_HUMANA: string[] = listaDe(process.env.ORIGENS_ABERTURA_HUMANA);

export function ehAberturaHumana(origem: string | null | undefined): boolean {
  return !!origem && ORIGENS_ABERTURA_HUMANA.includes(origem.toLowerCase());
}

/** Quem mandou cada mensagem de saida: so `inbox`, `followup` e o celular de
 *  verdade sao gente. Disparo, convite de grupo, agente e robo de agenda
 *  (WAHA `source: api`) nao contam. Celular sem `fonte` (gravado antes de
 *  28/10) conta como gente — na duvida o robo fica de fora. */
export function ehEnvioHumano(meta: unknown): boolean {
  const m = (meta ?? {}) as Record<string, unknown>;
  if (m.origem === "inbox") return true;
  // follow-up do cron (followup-auto, reabertura de janela) e robo, nao gente
  // (o manual grava o e-mail de quem enviou em `ator`; a reabertura nao grava ator)
  if (m.origem === "followup") return typeof m.ator === "string" && m.ator !== "cron";
  return m.origem === "celular" && m.fonte !== "api";
}

/**
 * Alguem do time ja falou com esse lead na mao? Regra de ouro: o
 * agente sai da conversa assim que gente digita nela — duas vozes no mesmo
 * WhatsApp queimam o lead. `agente_religado_em` (botao "Religar agente" no
 * Inbox) zera a contagem.
 */
export async function humanoJaFalou(contactId: string, desde?: Date | null): Promise<boolean> {
  const saidas = await db.whatsappMessage.findMany({
    where: { contactId, direction: "outbound", ...(desde ? { timestamp: { gt: desde } } : {}) },
    select: { metadata: true },
    orderBy: { timestamp: "desc" },
    take: 200,
  });
  return saidas.some((s) => ehEnvioHumano(s.metadata));
}

function religadoEm(campos: unknown): Date | null {
  const v = (campos as Record<string, unknown> | null)?.agente_religado_em;
  const d = typeof v === "string" ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

/**
 * Reunião agendada pela página /agendar/ numa data FUTURA (`evento_data` do
 * contato). Quem está nessa situação só recebe o que o robô da agenda manda
 * (preparo e lembrete): nenhum agente, régua ou follow-up fala com ele (sem isso,
 * um "Obrigada!" ao preparo fazia o agente entrar qualificando).
 */
export function reuniaoFutura(campos: unknown, agora: Date = new Date()): Date | null {
  const bruto = (campos as Record<string, unknown> | null)?.evento_data;
  const quando = typeof bruto === "string" ? new Date(bruto) : null;
  return quando && !Number.isNaN(quando.getTime()) && quando.getTime() > agora.getTime() ? quando : null;
}

export async function escolherAgente(
  contactId: string,
  opts: { sessao?: string | null; modo?: "resposta" | "followup"; ignorarHumano?: boolean } = {},
): Promise<Escolha> {
  // Gate do canal: o numero oficial tem todos os agentes; os numeros pessoais
  // (sessoes_pessoais) so os de agentes_numero_pessoal, e so pra lead de funil.
  await recarregarListasDeAgentes();
  let numeroPessoal = false;
  const persona = personaDaSessao(opts.sessao);
  if (opts.sessao !== undefined) {
    if (!opts.sessao) return { agente: null, motivo: "sem sessao" };
    const inst = await db.whatsappInstance.findFirst({ where: { instanceName: opts.sessao } });
    if (!inst) return { agente: null, motivo: "numero desconhecido" };
    numeroPessoal = inst.provider !== "cloud_api" && sessoesPessoais.includes(String(inst.instanceName ?? "").toLowerCase());
  }

  const contato = await db.contact.findUnique({ where: { id: contactId } });
  if (!contato) return { agente: null, motivo: "contato nao encontrado" };

  const tags = tagsDe(contato.tags);
  if (semAutomacao(contato.lifecycleStage)) return { agente: null, motivo: "fora das automações (pessoal ou retirado) — nenhum robô fala" };
  // Objeção de valor fura SÓ a tag `humano` (objecao-valor.ts); optout e controle-* continuam mandando.
  if (temControle(opts.ignorarHumano ? tags.filter((t) => t !== "humano") : tags)) {
    return { agente: null, motivo: "tag de controle — humano assume" };
  }
  if (reuniaoFutura(contato.customFields)) {
    // Reunião futura: só o agente de confirmação/lembrete conversa (e o robô da agenda responde
    // link/hora). Nenhum outro agente, régua ou follow-up entra qualificando quem já agendou.
    const confirmacao = await db.agent.findFirst({ where: { slug: SLUG_CONFIRMACAO, ativo: true } });
    return confirmacao
      ? { agente: confirmacao, motivo: "reunião futura agendada — só a confirmação fala" }
      : { agente: null, motivo: "reunião futura agendada — só o robô da agenda fala (preparo e lembrete)" };
  }

  const aberturaHumana = ehAberturaHumana(contato.origem);
  if (aberturaHumana && opts.modo !== "followup") {
    return { agente: null, motivo: "abertura humana — nesta origem o robô só faz follow-up" };
  }

  const comprados = new Set(
    tags.map((t) => (t.startsWith("comprou-") ? t.slice("comprou-".length) : null)).filter(Boolean),
  );
  const ehCliente = contato.lifecycleStage === "cliente";

  const agentes = await db.agent.findMany({
    where: { ativo: true, canal: "whatsapp" },
    orderBy: [{ prioridade: "desc" }, { createdAt: "asc" }],
  });

  type Candidato = { agente: (typeof agentes)[number]; porTag?: string; quando: number };
  const candidatos: Candidato[] = [];

  // Quando cada tag foi carimbada — pra desempatar pelo mais recente.
  const eventosTag = await db.timelineEvent.findMany({
    where: { contactId, eventType: "acao_agente" },
    orderBy: { timestamp: "desc" },
    take: 100,
    select: { metadata: true, timestamp: true },
  });
  const quandoTag = (tag: string): number => {
    const ev = eventosTag.find((e) => (e.metadata as Record<string, unknown>)?.tag === tag);
    if (ev) return ev.timestamp.getTime();
    // sem evento (tag antiga/importada): posicao no array, depois das datadas
    return tags.indexOf(tag);
  };

  for (const a of agentes) {
    if (numeroPessoal && !agentesNumeroPessoal().includes(a.slug)) continue;
    if (agenteForaDoPrazo(a.slug)) continue;
    const padroesTag = listaDe(a.gatilhoTag);
    const estagios = listaDe(a.gatilhoEstagio);
    const origens = listaDe(a.gatilhoOrigem);
    if (!padroesTag.length && !estagios.length && !origens.length) continue;

    // Compra encerra a venda daquele produto: agente preso a tag de produto
    // ja comprado sai da disputa. Cliente so e atendido por quem mira `cliente`.
    const produtosDoAgente = padroesTag.map(produtoDaTag).filter(Boolean) as string[];
    if (produtosDoAgente.some((p) => comprados.has(p) || tags.includes(tagComprou(p)))) continue;
    if (ehCliente && !estagios.includes("cliente")) continue;

    const tagQueCasou = tags
      .filter((t) => padroesTag.some((p) => tagCasa(p, t)))
      .sort((x, y) => quandoTag(y) - quandoTag(x))[0];
    const casaEstagio = estagios.includes(contato.lifecycleStage);
    const casaOrigem = contato.origem ? origens.includes(contato.origem.toLowerCase()) : false;

    if (tagQueCasou || casaEstagio || casaOrigem) {
      candidatos.push({
        agente: a,
        porTag: tagQueCasou,
        quando: tagQueCasou ? quandoTag(tagQueCasou) : -1,
      });
    }
  }

  // Numero com persona (numero-comercial.ts): lead de funil sem gatilho casando ou de
  // anuncio (ctwa) cai no agente padrao do numero — os gatilhos so cobrem os
  // funis das paginas.
  if (numeroPessoal && persona && !candidatos.length && ehLeadComercial(contato.origem)) {
    const padrao = agentes.find((a) => a.slug === persona.agentePadrao);
    if (padrao) candidatos.push({ agente: padrao, quando: -1 });
  }

  if (candidatos.length) {
    candidatos.sort(
      (x, y) => y.agente.prioridade - x.agente.prioridade || y.quando - x.quando,
    );
    const c = candidatos[0];
    // So aqui, com gatilho de funil casando: checar antes carimbava `humano`
    // em familia e amigos (todo contato pessoal tem saida "celular") e os
    // tirava dos disparos (revisao de 28/10/2026).
    if (
      numeroPessoal &&
      !aberturaHumana &&
      !opts.ignorarHumano &&
      (await humanoJaFalou(contactId, religadoEm(contato.customFields)))
    ) {
      return { agente: null, motivo: "humano ja falou nesta conversa", humanoAssumiu: true };
    }
    return {
      agente: c.agente,
      motivo: c.porTag ? `gatilho por tag ${c.porTag}` : "gatilho por estagio/origem",
      porTag: c.porTag,
    };
  }

  // Numero pessoal sem gatilho casando = conversa pessoal. Ninguem responde.
  if (numeroPessoal) return { agente: null, motivo: "numero pessoal — nao e lead de funil" };

  // Porta do anuncio: quem chega no numero oficial sem tag nenhuma.
  if (ehCliente) return { agente: null, motivo: "ja e cliente — pos-venda nao e a recepcao" };
  const recepcao = agentes.find((a) => a.slug === SLUG_RECEPCAO);
  if (!recepcao) return { agente: null, motivo: "nenhum gatilho casou e a recepcao esta desligada" };
  return { agente: recepcao, motivo: "porta do anuncio (recepcao)" };
}
