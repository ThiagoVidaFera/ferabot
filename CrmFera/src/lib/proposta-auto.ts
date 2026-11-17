import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { auditar } from "@/lib/audit";
import { avisar } from "@/lib/notificacao";
import { gerar } from "@/lib/ia";
import { propor } from "@/lib/agentes";
import { adicionarTag } from "@/lib/tags";
import { primeiroNome } from "@/lib/telefone";
import { registrarEvento } from "@/lib/timeline";
import { linksDePropostaEm } from "@/lib/links-proposta";
import { humanoJaFalou } from "@/lib/seletor-agente";
import { podeTocarContato } from "@/lib/pode-tocar";
import { gravarProposta } from "@/lib/proposta-contato";
import { ehAssentimento } from "@/lib/assentimento";
import { ehEncerramento } from "@/lib/resposta-automatica";
import {
  OFERTA_AUTO,
  TAG_PROPOSTA_AUTO_ENVIADA,
  lerParte,
  montarPropostaJson,
  nomeSeguro,
  removerAspasNaoLiterais,
  slugDoNome,
  ticketConfirmado,
  validarParte,
  type ContextoValidacao,
  type ParteVariavel,
} from "@/lib/proposta-auto-compor";
import { PROMPT_COMPOSICAO, entradaComposicao } from "@/lib/proposta-auto-prompt";
import { mensagemFinal, mensagemInicial } from "@/lib/proposta-auto-mensagem";
import { criarJob, lerJob, pedirInstagram, resumirInstagram, saude } from "@/lib/proposta-svc-client";

/**
 * PROPOSTA AUTOMÁTICA DEPOIS DO "PODE". Só funciona com o serviço de proposta configurado
 * (PROPOSTA_SVC_URL + PROPOSTA_SVC_KEY); sem ele, a conversa passa para o dono.
 *
 * Estados em `customFields.propostaAuto`: compondo → gerando → enviando → enviada | falhou. O cron de
 * 1 minuto (`processarPropostasAuto`) avança um passo por contato. Cada passo que não pode repetir (compor,
 * enviar) é reivindicado por uma linha única na tabela `Notificacao` (`reivindicar`): vale entre processos,
 * então dois containers do deploy `start-first` nunca mandam a mesma proposta duas vezes.
 * Falha = silêncio pro lead + `revisar` + `humano` + aviso ao dono (nunca texto de "travada" pro lead).
 */

export type EstadoPropostaAuto = {
  estado: "compondo" | "gerando" | "enviando" | "enviada" | "falhou";
  agenteId: string;
  iniciadaEm: string;
  atualizadoEm?: string;
  jobId?: string;
  slug?: string;
  url?: string;
  validade?: string;
  ticket?: number | null;
  linha?: string;
  erro?: string;
};

const MODELO_COMPOSICAO = "gemini-2.5-pro";
const TENTATIVAS_COMPOSICAO = 2;
const MAX_FALAS_DO_LEAD = 80;
const LIMITE_ETAPA_MS = 25 * 60_000;
const LIMITE_ENVIANDO_MS = 10 * 60_000;
/** `ultima_do_lead` e `disse_sim` não valem aqui (resposta a um "pode"); a mensagem nova do lead é conferida à parte. */
const MOTIVOS_QUE_NAO_BLOQUEIAM = ["ultima_do_lead", "disse_sim"];
/** Campos internos que nunca vão pro modelo (links, ids, rastreio, dados de contato). */
const CAMPOS_IGNORADOS = /^(utm_|whatsapp_chat_id|proposta|resposta_pendente|agente_|evento_|campanha|criativo)|link|url|score|form|funil|fonte|token|mail|fone|phone|whatsapp|_id$|_em$/i;
const CAMPOS_DO_QUE_VENDE = /vende|produto|profiss|objetivo/i;

type Campos = Record<string, unknown>;
let emAndamento = false;

// ------------------------------------------------------------------ utilidades

const camposDe = (c: unknown): Campos => (c && typeof c === "object" ? (c as Campos) : {});

export function lerEstado(campos: unknown): EstadoPropostaAuto | null {
  const e = camposDe(campos).propostaAuto as Partial<EstadoPropostaAuto> | undefined;
  return e && typeof e.estado === "string" && typeof e.agenteId === "string" ? (e as EstadoPropostaAuto) : null;
}

async function gravarEstado(contactId: string, estado: EstadoPropostaAuto): Promise<void> {
  const c = await db.contact.findUnique({ where: { id: contactId }, select: { customFields: true } });
  if (!c) return;
  const novo = { ...estado, atualizadoEm: new Date().toISOString() };
  await db.contact.update({ where: { id: contactId }, data: { customFields: { ...camposDe(c.customFields), propostaAuto: novo } as never } });
}

const hojeBrasilia = (): string => new Date(Date.now() - 3 * 3_600_000).toISOString().slice(0, 10);

/** Trava entre processos: só quem criar a linha única (tipo+chave) executa o passo. */
async function reivindicar(contactId: string, passo: string): Promise<boolean> {
  try {
    await db.notificacao.create({ data: { tipo: "proposta-auto-passo", chave: `${contactId}:${passo}`, detalhe: new Date().toISOString() } });
    return true;
  } catch {
    return false;
  }
}

/** Passo secundário que não pode derrubar o principal, mas também não pode sumir sem rastro. */
async function secundario(contexto: string, passo: Promise<unknown>): Promise<void> {
  try {
    await passo;
  } catch (e) {
    await auditar("proposta-auto", "erro_secundario", `${contexto}: ${e instanceof Error ? e.message : String(e)}`.slice(0, 280)).catch(() => {});
  }
}

const descricaoDaOferta = (): string => {
  const o = OFERTA_AUTO;
  const partes = [`${o.ofertaBase}, R$ ${o.aVista.toLocaleString("pt-BR")} à vista`];
  if (o.parcelas) partes.push(`ou ${o.parcelas}× R$ ${o.parcela.toLocaleString("pt-BR")}`);
  if (o.especial) partes.push(`em até ${o.especial.horas}h, ${o.especial.parcelas}× R$ ${o.especial.parcela} ou R$ ${o.especial.pix.toLocaleString("pt-BR")} no Pix`);
  if (o.garantiaMeta) partes.push(`garantia ${o.garantiaMeta}`);
  return partes.join("; ");
};

// ------------------------------------------------------------------ entrada

/** Instagram do lead: campo da ficha ou o primeiro @usuario escrito por ele (ignora e-mail). */
export function instagramDoLead(campos: Campos, falas: readonly string[]): string | null {
  const daFicha = typeof campos.instagram === "string" ? campos.instagram.replace(/^@/, "").trim() : "";
  if (daFicha) return daFicha;
  for (const f of falas) {
    const m = f.match(/(?<![\w.])@([a-z0-9._]{3,30})/i);
    if (m) return m[1].replace(/\.+$/, "");
  }
  return null;
}

export function respostasDoFormulario(campos: Campos): Record<string, string> {
  return Object.fromEntries(
    Object.entries(campos)
      .filter(([k, v]) => typeof v === "string" && v.trim() && !CAMPOS_IGNORADOS.test(k))
      .map(([k, v]) => [k, String(v).trim()]),
  );
}

async function falasDoLead(contactId: string): Promise<string[]> {
  const msgs = await db.whatsappMessage.findMany({
    where: { contactId, direction: "inbound" },
    orderBy: { timestamp: "desc" },
    take: MAX_FALAS_DO_LEAD,
    select: { body: true },
  });
  return msgs.map((m) => m.body).filter((b): b is string => Boolean(b?.trim())).reverse();
}

// ------------------------------------------------------------------ início (chamado quando o lead diz "pode")

export type ResultadoInicio = { iniciada: boolean; motivo?: string; semServico?: boolean };

export async function iniciarPropostaAuto(p: { agenteId: string; contactId: string }): Promise<ResultadoInicio> {
  const contato = await db.contact.findUnique({ where: { id: p.contactId } });
  if (!contato?.phone) return { iniciada: false, motivo: "contato sem telefone" };
  if (lerEstado(contato.customFields)) return { iniciada: false, motivo: "proposta automática já iniciada" };
  const enviadas = await db.whatsappMessage.findMany({ where: { contactId: p.contactId, direction: "outbound" }, orderBy: { timestamp: "desc" }, take: 60, select: { body: true } });
  if (linksDePropostaEm(enviadas.map((m) => m.body)).length) return { iniciada: false, motivo: "proposta já enviada nesta conversa" };
  // Antes de dizer "estou montando" ao lead, o serviço tem que estar de pé (revisão de 15/11/2026).
  const servico = await saude();
  if (!servico.ok) return { iniciada: false, semServico: true, motivo: `serviço de proposta indisponível: ${servico.erro}` };

  const slug = slugDoNome(contato.name ?? "", contato.phone, randomBytes(3).toString("hex"));
  await gravarEstado(p.contactId, { estado: "compondo", agenteId: p.agenteId, iniciadaEm: new Date().toISOString(), slug });
  const nome = primeiroNome(nomeSeguro(contato.name ?? "")) || "tudo bem";
  await propor({ agentId: p.agenteId, contactId: p.contactId, acao: "enviar_mensagem", payload: { texto: mensagemInicial(nome) } });
  await auditar("proposta-auto", "iniciada", p.contactId);
  return { iniciada: true };
}

// ------------------------------------------------------------------ composição

async function comporParte(entrada: string, falas: readonly string[], ctx: ContextoValidacao): Promise<{ parte: ParteVariavel | null; erros: string[] }> {
  let erros: string[] = [];
  let ultima: ParteVariavel | null = null;
  for (let tentativa = 1; tentativa <= TENTATIVAS_COMPOSICAO; tentativa++) {
    const reforco = erros.length ? `\n\nA SUA RESPOSTA ANTERIOR FOI RECUSADA POR: ${erros.join("; ")}. Reescreva o JSON inteiro corrigindo isso.` : "";
    const r = await gerar(PROMPT_COMPOSICAO, entrada + reforco, { modelo: MODELO_COMPOSICAO });
    const parte = r.ok && r.texto ? lerParte(r.texto) : null;
    if (!parte) {
      erros = [r.erro ?? "JSON fora do formato"];
      continue;
    }
    ultima = parte;
    const v = validarParte(parte, falas, ctx);
    if (v.ok) return { parte, erros: [] };
    erros = v.erros;
  }
  // Último recurso: fala não literal sai do documento; citação inventada na explicação perde as aspas.
  if (ultima) {
    const limpa = removerAspasNaoLiterais(ultima, falas);
    const v = validarParte(limpa, falas, ctx);
    if (v.ok) return { parte: limpa, erros: [] };
    erros = v.erros;
  }
  return { parte: null, erros };
}

async function perfilDoInstagram(handle: string | null): Promise<{ instagram: string; site: string }> {
  if (!handle) return { instagram: "", site: "" };
  const r = await pedirInstagram(handle);
  return r.ok ? resumirInstagram(r.perfil) : { instagram: "", site: "" };
}

async function comporEGerar(contactId: string, estado: EstadoPropostaAuto): Promise<void> {
  if (!(await reivindicar(contactId, "compor"))) return;
  const contato = await db.contact.findUnique({ where: { id: contactId } });
  if (!contato?.phone) return falhar(contactId, estado, "contato sem telefone");
  const campos = camposDe(contato.customFields);
  const falas = await falasDoLead(contactId);
  const nome = nomeSeguro(contato.name ?? "");
  if (nome.length < 2) return falhar(contactId, estado, `o nome do contato não serve para a página: "${(contato.name ?? "").slice(0, 40)}"`);
  const resposta = respostasDoFormulario(campos);
  const vende = Object.entries(resposta).find(([k]) => CAMPOS_DO_QUE_VENDE.test(k))?.[1] ?? "";
  const perfil = await perfilDoInstagram(instagramDoLead(campos, falas));
  const ctx: ContextoValidacao = { temInstagram: Boolean(perfil.instagram), temSite: Boolean(perfil.site) };

  const entrada = entradaComposicao({ nome, vende, respostasDoFormulario: resposta, falasDoLead: falas, ...perfil });
  const { parte, erros } = await comporParte(entrada, falas, ctx);
  if (!parte) return falhar(contactId, estado, `composição recusada pelos guardas: ${erros.join("; ").slice(0, 240)}`);

  const ticket = ticketConfirmado(parte.calculadora.ticket, [...falas, ...Object.values(resposta)]);
  const confirmada: ParteVariavel = { ...parte, calculadora: { ...parte.calculadora, ticket } };
  const slug = estado.slug ?? slugDoNome(nome, contato.phone, randomBytes(3).toString("hex"));
  const proposta = montarPropostaJson({ nome, telefone: contato.phone, empresa: vende, hoje: hojeBrasilia(), canal: "proposta automática", slug }, confirmada);
  const job = await criarJob(slug, proposta);
  if (!job.ok) return falhar(contactId, estado, job.erro);
  await gravarEstado(contactId, { ...estado, estado: "gerando", jobId: job.id, slug, ticket, linha: parte.linha_pessoal });
  await auditar("proposta-auto", "job_criado", `${contactId}: ${job.id}`);
}

// ------------------------------------------------------------------ falha

type OpcoesFalha = { naoConfirmado?: boolean };

async function falhar(contactId: string, estado: EstadoPropostaAuto, motivo: string, op: OpcoesFalha = {}): Promise<void> {
  await secundario("falhar:gravarEstado", gravarEstado(contactId, { ...estado, estado: "falhou", erro: motivo.slice(0, 300) }));
  await secundario("falhar:revisar", adicionarTag(contactId, "revisar", "proposta-auto"));
  // A conversa precisa de gente: o lead já ouviu "estou montando". Sem `humano` o follow-up de 48h falaria por cima.
  await secundario("falhar:humano", adicionarTag(contactId, "humano", "proposta-auto"));
  await auditar("proposta-auto", "falhou", `${contactId}: ${motivo}`.slice(0, 300)).catch(() => {});
  const c = await db.contact.findUnique({ where: { id: contactId }, select: { name: true, phone: true } });
  const quem = c?.name ?? c?.phone ?? contactId;
  const situacao = op.naoConfirmado
    ? `O envio da proposta de *${quem}* não confirmou: veja na conversa se ela saiu e, se não saiu, mande à mão.`
    : `A proposta automática de *${quem}* NÃO saiu. Ela disse "pode" e já recebeu o aviso de que a proposta está sendo montada: mande a proposta à mão.`;
  await secundario("falhar:avisar", avisar("erro", `proposta-auto:${contactId}`, `${situacao}\n\nMotivo: ${motivo.slice(0, 240)}\n\nAbrir: ${process.env.APP_URL ?? "http://localhost:3900"}/contatos/${contactId}`));
}

// ------------------------------------------------------------------ envio

/** Alguém (gente) já mandou proposta ou falou na conversa depois que começamos? Então o robô não manda por cima. */
async function alguemJaAssumiu(contactId: string, desde: Date): Promise<string | null> {
  if (await humanoJaFalou(contactId, desde)) return "você já falou nesta conversa enquanto a proposta era gerada";
  const saidas = await db.whatsappMessage.findMany({ where: { contactId, direction: "outbound" }, orderBy: { timestamp: "desc" }, take: 60, select: { body: true } });
  return linksDePropostaEm(saidas.map((m) => m.body)).length ? "já existe link de proposta enviado nesta conversa" : null;
}

/** O lead escreveu algo diferente de "sim/obrigado" depois do "pode" ("pera", "quanto custa?", "esquece")? Então quem responde é gente. */
async function leadMudouDeIdeia(contactId: string, desde: Date): Promise<string | null> {
  const novas = await db.whatsappMessage.findMany({ where: { contactId, direction: "inbound", timestamp: { gt: desde } }, orderBy: { timestamp: "asc" }, select: { body: true } });
  const estranha = novas.find((m) => !(ehAssentimento(m.body) || ehEncerramento(m.body, false)));
  return estranha ? `o lead escreveu depois do "pode": "${(estranha.body ?? "").slice(0, 80)}"` : null;
}

async function motivoParaNaoEnviar(contactId: string, estado: EstadoPropostaAuto): Promise<string | null> {
  const desde = new Date(estado.iniciadaEm);
  const assumiu = await alguemJaAssumiu(contactId, desde);
  if (assumiu) return assumiu;
  const mudou = await leadMudouDeIdeia(contactId, desde);
  if (mudou) return mudou;
  const guarda = await podeTocarContato({ contactId, regua: "proposta-auto", seco: true });
  if (!guarda.liberado && !MOTIVOS_QUE_NAO_BLOQUEIAM.includes(guarda.motivo)) return `guarda de toque barrou o envio (${guarda.motivo}: ${guarda.detalhe})`;
  return null;
}

async function enviarProposta(contactId: string, estado: EstadoPropostaAuto, url: string, validade: string | null): Promise<void> {
  if (!(await reivindicar(contactId, "enviar"))) return;
  const contato = await db.contact.findUnique({ where: { id: contactId } });
  if (!contato?.phone) return falhar(contactId, estado, "contato sem telefone");
  const motivo = await motivoParaNaoEnviar(contactId, estado);
  if (motivo) return falhar(contactId, estado, `${motivo}. A página ficou pronta em ${url} e NÃO foi enviada.`);

  // Grava ANTES de mandar: se algo cair depois do envio, o estado nunca volta a `gerando` e nada é reenviado.
  await gravarEstado(contactId, { ...estado, estado: "enviando", url, ...(validade ? { validade } : {}) });
  const texto = mensagemFinal({ nome: primeiroNome(nomeSeguro(contato.name ?? "")) || "tudo bem", link: url, linha: estado.linha ?? "", ticket: estado.ticket ?? null });
  const r = await propor({ agentId: estado.agenteId, contactId, acao: "enviar_mensagem", payload: { texto } });
  if (!r.executada) return falhar(contactId, estado, `envio não executado: ${r.erro ?? "agente em modo sugere (ação ficou pendente)"}. Página pronta em ${url}.`);
  await concluir(contactId, contato.phone, estado, url, validade);
}

/** A mensagem JÁ saiu. Nada aqui pode reenviar nem avisar "não saiu": cada passo é isolado e deixa rastro se falhar. */
async function concluir(contactId: string, telefone: string, estado: EstadoPropostaAuto, url: string, validade: string | null): Promise<void> {
  await secundario("concluir:estado", gravarEstado(contactId, { ...estado, estado: "enviada", url, ...(validade ? { validade } : {}) }));
  await secundario("concluir:humano", adicionarTag(contactId, "humano", "proposta-auto"));
  await secundario("concluir:tag", adicionarTag(contactId, TAG_PROPOSTA_AUTO_ENVIADA, "proposta-auto"));
  await secundario("concluir:oferta", gravarProposta(telefone, { ofertaBase: OFERTA_AUTO.ofertaBase, link: url }, "proposta-auto"));
  const nota = `Proposta enviada automaticamente depois do "pode" (${descricaoDaOferta()})${validade ? `, válida até ${validade}` : ""}: ${url}`;
  await secundario("concluir:nota", registrarEvento({ contactId, eventType: "note", channel: "sistema", metadata: { texto: nota } }));
  await auditar("proposta-auto", "enviada", `${contactId}: ${url}`).catch(() => {});
  const c = await db.contact.findUnique({ where: { id: contactId }, select: { name: true, phone: true } });
  await secundario("concluir:avisar", avisar("lead_quente", `proposta-auto-ok:${contactId}`, `✅ Proposta enviada sozinha para *${c?.name ?? c?.phone}*: ${url}\n\nA conversa agora é contigo (o robô parou).\nAbrir: ${process.env.APP_URL ?? "http://localhost:3900"}/contatos/${contactId}`));
}

async function acompanharJob(contactId: string, estado: EstadoPropostaAuto): Promise<void> {
  if (!estado.jobId) return falhar(contactId, estado, "job sem id");
  if (Date.now() - new Date(estado.iniciadaEm).getTime() > LIMITE_ETAPA_MS) return falhar(contactId, estado, "a página demorou mais de 25 minutos para ficar pronta");
  const r = await lerJob(estado.jobId);
  if (!r.ok) return; // serviço fora do ar agora: tenta no próximo minuto, o limite de 25 min cobre
  if (r.job.status === "failed") return falhar(contactId, estado, `serviço de proposta falhou: ${r.job.erro ?? "sem detalhe"}`);
  if (r.job.status === "done" && r.job.url) return enviarProposta(contactId, estado, r.job.url, r.job.validade);
}

// ------------------------------------------------------------------ cron

export type ResultadoPropostasAuto = { compostas: number; acompanhadas: number; presas: number };

const idade = (iso: string | undefined): number => (iso ? Date.now() - new Date(iso).getTime() : 0);

async function passo(contactId: string, estado: EstadoPropostaAuto, res: ResultadoPropostasAuto): Promise<void> {
  if (estado.estado === "enviando") {
    if (idade(estado.atualizadoEm) > LIMITE_ENVIANDO_MS) {
      await falhar(contactId, estado, "o envio ficou em andamento por mais de 10 minutos e não confirmou", { naoConfirmado: true });
      res.presas++;
    }
    return;
  }
  if (estado.estado === "compondo") {
    if (idade(estado.iniciadaEm) > LIMITE_ETAPA_MS) {
      await falhar(contactId, estado, "a composição ficou parada por mais de 25 minutos");
      res.presas++;
      return;
    }
    await comporEGerar(contactId, estado);
    res.compostas++;
    return;
  }
  await acompanharJob(contactId, estado);
  res.acompanhadas++;
}

export async function processarPropostasAuto(): Promise<ResultadoPropostasAuto> {
  const res: ResultadoPropostasAuto = { compostas: 0, acompanhadas: 0, presas: 0 };
  if (emAndamento) return res;
  emAndamento = true;
  try {
    for (const alvo of ["compondo", "gerando", "enviando"] as const) {
      const lista = await db.contact.findMany({ where: { customFields: { path: "$.propostaAuto.estado", equals: alvo } }, select: { id: true, customFields: true } });
      for (const c of lista) {
        const estado = lerEstado(c.customFields);
        if (!estado || estado.estado !== alvo) continue;
        try {
          await passo(c.id, estado, res);
        } catch (e) {
          await falhar(c.id, estado, `erro inesperado: ${e instanceof Error ? e.message : String(e)}`).catch(() => {});
        }
      }
    }
    return res;
  } finally {
    emAndamento = false;
  }
}
