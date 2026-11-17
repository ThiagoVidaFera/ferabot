import { ehRespostaDois, furaHumano, instrucaoDaObjecao } from "@/lib/objecao-valor";
import { db } from "@/lib/db";
import { gerar } from "@/lib/ia";
import { propor, ehCampoDePerfil } from "@/lib/agentes";
import { auditar } from "@/lib/audit";
import {
  validarMensagem,
  validarResposta,
  estourouLimiteDePerguntas,
  temProximoPasso,
  numerosDoLead,
  citaNome,
  perguntasDe,
} from "@/lib/guardas";
import {
  respondePrecoNaHora,
  calaPorPreco,
  instrucaoDePreco,
  respondeuOPreco,
  avisoDePrecoRespondido,
} from "@/lib/resposta-preco";
import type { Oferta } from "@/lib/ofertas";
import { ehEstagio, semAutomacao } from "@/lib/estagios";
import { primeiroNome } from "@/lib/telefone";
import { paginaDeCadastro, regraPrimeiraMensagem } from "@/lib/primeira-mensagem";
import { AGENTES_COMECANDO_DO_ZERO, blocoComecandoDoZero, ehPerguntaDeEncaixe } from "@/lib/comecando-do-zero";
import { avisar } from "@/lib/notificacao";
import { midiaSemResposta } from "@/lib/midia-lead";
import { tagsDe, adicionarTag } from "@/lib/tags";
import { dividirQuebra, juntarPartes, arrumarFormato, MAX_PARTES } from "@/lib/quebra";
import { renderizarPrompt, autorizadoCompleto } from "@/lib/prompt-vars";
import { comFormato } from "@/lib/prompts/formato";
import {
  escolherAgente,
  humanoJaFalou,
  reuniaoFutura,
  agentesPrecoPublico,
  agentesVozDoDono,
} from "@/lib/seletor-agente";
import { urlDoCrm } from "@/lib/url";
import { negocio } from "@/lib/negocio";
import { perguntaSeERobo, perguntaPreco } from "@/lib/pergunta-robo";
import { ehRespostaAutomatica, pareceAssistente, ehEncerramento } from "@/lib/resposta-automatica";
import { responderAgenda, respostasDaAgenda } from "@/lib/resposta-agenda";
import { agendarResposta, atrasoLigado, type TipoResposta } from "@/lib/resposta-agendada";
import { resumoDoFormulario } from "@/lib/atalhos";
import { personaDaSessao, type Persona } from "@/lib/numero-comercial";
import { linksDePropostaEm } from "@/lib/links-proposta";
import { ehConviteResumo, citaPaginaDeConsultoria, semPaginasDeConsultoria } from "@/lib/convite-resumo";
import { ehAssentimento } from "@/lib/assentimento";
import { TAG_AGUARDANDO_PODE } from "@/lib/proposta-auto-compor";
import { iniciarPropostaAuto, lerEstado } from "@/lib/proposta-auto";

/** O "pode" só vale para um convite recente (72h): a tag `aguardando-pode` nunca sai da ficha. */
const VALIDADE_CONVITE_MS = 72 * 3_600_000;
/** Plano de Faturamento (15/11/2026): o robô NÃO para no convite; espera o "pode" e manda a proposta sozinho. */
const NOTA_CONVITE_ESPERA_PODE =
  "o robô convidou pro resumo e espera o 'pode': se o lead aceitar, a proposta é gerada e enviada sozinha";

/**
 * MOTOR GENERICO de agente conversacional (1:1 no WhatsApp).
 *
 * Nasceu do `recepcao.ts` (Agente 1) e passou a servir os 6 agentes do
 * playbook: o que muda entre eles e o PROMPT (no banco, versionado) e o
 * GATILHO (tag/estagio/origem). O que NAO muda:
 * - toda acao passa por `propor()` — respeita o modo (sugere/autonomo), fica
 *   auditada e tem recuo em 1 clique. Este arquivo NUNCA envia mensagem direto;
 * - preco, link e data vem da fonte unica (ofertas.ts + Setting) pelas
 *   variaveis `{{...}}`; a saida e validada por `guardas.ts` PARTE POR PARTE
 *   ([QUEBRA]). Se a IA inventar valor ou URL, a mensagem NAO sai;
 * - falhou duas vezes? Silencio + tag `revisar` + aviso (nunca texto de
 *   "travada" pro lead — decisao de 02/11/2026). Nunca marca
 *   `humano` por erro nosso (regra 5 do CLAUDE.md).
 */

type AgenteDb = NonNullable<Awaited<ReturnType<typeof db.agent.findFirst>>>;

/** Quantas mensagens de historico entram no contexto do modelo. O playbook
 *  manda ler 30-100 eventos: historico curto = agente repetitivo. */
const JANELA_HISTORICO = 40;

export type ResultadoAtendimento = {
  atendeu: boolean;
  agente?: string;
  motivo?: string;
  texto?: string;
  partes?: string[];
  erros?: string[];
};

type Decisao = {
  mensagem: string;
  estagio?: string;
  tags?: string[];
  nota?: string;
  /** campos do perfil que a pessoa acabou de informar (vão pra ficha) */
  perfil?: Record<string, string>;
  /** true quando a conversa precisa de gente — o agente para de responder. */
  humano?: boolean;
};

function lerPerfil(bruto: unknown): Record<string, string> {
  if (!bruto || typeof bruto !== "object") return {};
  return Object.fromEntries(
    Object.entries(bruto as Record<string, unknown>)
      .filter(([k, v]) => ehCampoDePerfil(k) && typeof v === "string" && v.trim())
      .map(([k, v]) => [k, String(v).trim()]),
  );
}

/** Le a decisao do modelo. Aceita JSON cru ou dentro de bloco ```json. */
export function lerDecisao(bruto: string): Decisao | null {
  const limpo = bruto
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    const j = JSON.parse(limpo) as Record<string, unknown>;
    const mensagem = typeof j.mensagem === "string" ? j.mensagem.trim() : "";
    if (!mensagem) return null;
    return {
      mensagem,
      estagio: typeof j.estagio === "string" ? j.estagio : undefined,
      tags: Array.isArray(j.tags) ? j.tags.filter((t): t is string => typeof t === "string") : [],
      nota: typeof j.nota === "string" ? j.nota : undefined,
      perfil: lerPerfil(j.perfil),
      humano: j.humano === true,
    };
  } catch {
    return null;
  }
}

/**
 * Monta o contexto: quem e o contato, o que ja recebeu, o que ja disse, o que
 * ja foi proposto (links enviados) — "o que o agente le antes de responder",
 * na lista do playbook. Se um link ja saiu, o agente nao recomeca a venda.
 */
export async function contexto(contactId: string): Promise<string> {
  const contato = await db.contact.findUnique({ where: { id: contactId } });
  if (!contato) return "";

  const msgs = await db.whatsappMessage.findMany({
    where: { contactId },
    orderBy: { timestamp: "desc" },
    take: JANELA_HISTORICO,
  });

  const historico = msgs
    .reverse()
    .map((m) => `${m.direction === "inbound" ? "LEAD" : "AGENTE"}: ${m.body}`)
    .join("\n");

  const linksEnviados = Array.from(
    new Set(
      msgs
        .filter((m) => m.direction === "outbound")
        .flatMap((m) => m.body.match(/https?:\/\/[^\s)]+/g) ?? []),
    ),
  );

  const campos =
    contato.customFields && typeof contato.customFields === "object"
      ? (contato.customFields as Record<string, unknown>)
      : {};

  const compras = await db.purchase.findMany({
    where: { contactId },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { product: true },
  });

  const agora = new Date();
  const dataHoje = agora.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
  const hora = agora.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

  const formulario = resumoDoFormulario(campos);
  // primeira fala do robô: nenhuma mensagem nossa no histórico (e o histórico cabe inteiro na janela)
  const ehPrimeiraFalaDoRobo = msgs.length < JANELA_HISTORICO && !msgs.some((m) => m.direction === "outbound");

  return [
    `HOJE: ${dataHoje}, ${hora} (Brasília)`,
    `NOME: ${primeiroNome(contato.name) || "(não sei ainda)"}`,
    `ESTÁGIO ATUAL: ${contato.lifecycleStage}`,
    `ORIGEM: ${contato.origem ?? "desconhecida"}`,
    paginaDeCadastro(contato.origem) ? `PÁGINA EM QUE SE CADASTROU: ${paginaDeCadastro(contato.origem)}` : "",
    tagsDe(contato.tags).length ? `TAGS: ${tagsDe(contato.tags).join(", ")}` : "",
    campos.funil ? `FUNIL: ${String(campos.funil)}` : "",
    campos.anuncio ? `VEIO DO ANÚNCIO: ${String(campos.anuncio)}` : "",
    campos.objetivo ? `OBJETIVO QUE DECLAROU: ${String(campos.objetivo)}` : "",
    ...(formulario.length ? ["O QUE O LEAD JÁ CONTOU NO FORMULÁRIO (não pergunte de novo):", ...formulario] : []),
    compras.length ? `JÁ COMPROU: ${compras.map((c) => c.product).join(", ")}` : "",
    linksEnviados.length ? `LINKS JÁ ENVIADOS NESTA CONVERSA: ${linksEnviados.join(" · ")}` : "",
    ehPrimeiraFalaDoRobo ? `
${regraPrimeiraMensagem(contato.origem, (personaDaSessao(await sessaoDaConversa(contactId)) ? "terceira" : "primeira"))}` : "",
    "",
    "CONVERSA ATÉ AQUI:",
    historico || "(o lead ainda não escreveu nada)",
  ]
    .filter(Boolean)
    .join("\n");
}

const JANELA_MIDIA = 20;

/**
 * Áudio, foto, vídeo, documento ou figurinha sem resposta: nada sai pro lead, a conversa
 * passa pro dono do número e ele é avisado. Checagem em código, antes do modelo
 * (nunca dizer ao lead que não ouve ou não vê).
 */
async function calarPorMidia(
  slug: string,
  contactId: string,
  persona: Persona | null,
): Promise<ResultadoAtendimento | null> {
  const recentes = await db.whatsappMessage.findMany({
    where: { contactId },
    orderBy: { timestamp: "desc" },
    take: JANELA_MIDIA,
    select: { direction: true, type: true },
  });
  const midia = midiaSemResposta(recentes);
  if (!midia) return null;
  await marcarHumano(slug, contactId, `o lead mandou ${midia} — ver e responder manualmente`, persona);
  return { atendeu: false, agente: slug, motivo: `mandou ${midia} — só avisa e fica calado` };
}

/**
 * Atende UMA mensagem recebida: escolhe o agente pelo gatilho e roda.
 * Chamado pelo webhook depois que a entrada ja foi gravada, entao o historico
 * ja inclui a fala do lead.
 */
export async function atenderMensagem(
  contactId: string,
  sessao: string | null | undefined,
): Promise<ResultadoAtendimento> {
  const persona = personaDaSessao(sessao);
  const ultimaDoLead = (
    await db.whatsappMessage.findFirst({
      where: { contactId, direction: "inbound" },
      orderBy: { timestamp: "desc" },
      select: { body: true },
    })
  )?.body;

  // Reunião futura agendada: o robô da agenda responde o básico (link, data/hora, propósito);
  // o resto só o agente de confirmação conversa. "é robô?" vai pra atendimento manual.
  const contato = await db.contact.findUnique({ where: { id: contactId } });
  if (contato && semAutomacao(contato.lifecycleStage)) {
    return { atendeu: false, motivo: "fora das automações (pessoal ou retirado) — nenhum robô fala" };
  }
  if (contato && reuniaoFutura(contato.customFields)) {
    if (tagsDe(contato.tags).includes("humano") || (await humanoJaFalou(contactId))) {
      return { atendeu: false, motivo: "reunião futura — conversa com humano" };
    }
    const calouAgenda = await calarPorMidia("agenda", contactId, persona);
    if (calouAgenda) return calouAgenda;
    if (perguntaSeERobo(ultimaDoLead)) {
      await marcarHumano("agenda", contactId, "o lead perguntou se fala com robô/IA", persona);
      return { atendeu: false, agente: "agenda", motivo: "perguntou se é robô — atendimento manual" };
    }
    // Resposta com atraso humano (1–3 min): só agenda se a pergunta é de agenda.
    if ((await atrasoLigado()) && respostasDaAgenda(ultimaDoLead ?? "", contato.customFields).length) {
      await agendarResposta(contactId, "agenda", sessao);
      return { atendeu: false, agente: "agenda", motivo: "resposta da agenda agendada (1–3 min)" };
    }
    const enviados = await responderAgenda(contactId, ultimaDoLead ?? "").catch(() => 0);
    if (enviados > 0) return { atendeu: true, agente: "agenda", motivo: "agenda respondeu" };
    // Não era pergunta de agenda: segue pro seletor, que só devolve o agente de confirmação
    // (confirmacao-reuniao) para quem tem reunião futura. Sem ele ativo, ninguém fala.
  }

  const excecao = await excecaoObjecaoDeValor(contactId);
  const escolha = await escolherAgente(contactId, { sessao, ignorarHumano: excecao.fura });
  if (escolha.humanoAssumiu) {
    // Deixa visivel na ficha (e reversivel pelo "Religar agente" do Inbox).
    await adicionarTag(contactId, "humano", "regra:humano-ja-falou").catch(() => {});
  }
  if (!escolha.agente) return { atendeu: false, motivo: escolha.motivo };

  const calou = await calarPorMidia(escolha.agente.slug, contactId, persona);
  if (calou) return calou;

  // Perguntou se é robô/IA: nenhum agente responde, em nenhum número. Silêncio,
  // tag `humano` e aviso de atendimento manual.
  if (perguntaSeERobo(ultimaDoLead)) {
    await marcarHumano(escolha.agente.slug, contactId, "o lead perguntou se fala com robô/IA", persona);
    return { atendeu: false, agente: escolha.agente.slug, motivo: "perguntou se é robô — atendimento manual" };
  }

  // Resposta automática (ausência, "deixe sua mensagem"): robô não responde robô.
  if (ehRespostaAutomatica(ultimaDoLead)) {
    return { atendeu: false, agente: escolha.agente.slug, motivo: "resposta automática do lead — silêncio" };
  }

  // Quem respondeu parece ser secretária/equipe do lead: robô cala, o dono assume.
  if (pareceAssistente(ultimaDoLead)) {
    await marcarHumano(escolha.agente.slug, contactId, "quem respondeu parece ser assistente/equipe do lead — responder manualmente", persona);
    return { atendeu: false, agente: escolha.agente.slug, motivo: "assistente do lead — atendimento manual" };
  }

  // Pergunta de preço: agente com preço canônico em `ofertas.ts` RESPONDE o valor na hora
  // (`atenderCom` + resposta-preco.ts) e o humano é avisado. Silêncio + aviso quando não há preço
  // canônico ou o lead pede desconto/condição especial (o dono decide). Agentes de
  // `agentes_preco_publico` (preço na própria página) ficam fora desta trava.
  if (
    !agentesPrecoPublico().includes(escolha.agente.slug) &&
    calaPorPreco(escolha.agente.slug, ultimaDoLead)
  ) {
    await adicionarTag(contactId, "perguntou-preco", `agente:${escolha.agente.slug}`).catch(() => {});
    await marcarHumano(escolha.agente.slug, contactId, "pediu preço/condições de pagamento — responder manualmente", persona);
    return { atendeu: false, agente: escolha.agente.slug, motivo: "pediu preço — aguarda o dono" };
  }

  // Agradecimento, "ok", "." e emoji encerram a conversa: não pedem resposta.
  if (ehEncerramento(ultimaDoLead, await nossaUltimaFoiPergunta(contactId))) {
    return { atendeu: false, agente: escolha.agente.slug, motivo: "encerramento do lead — silêncio" };
  }

  // Atraso humano: a resposta é AGENDADA pra 60–100 s e o cron dispara (cada
  // mensagem nova do lead reinicia o relógio — rajada vira uma resposta só).
  // `responderAgendado` roda depois. Desliga com `resposta_atraso_ativo` = 0.
  if (await atrasoLigado()) {
    await agendarResposta(contactId, "agente", sessao);
    return { atendeu: false, agente: escolha.agente.slug, motivo: "resposta agendada (1–3 min)" };
  }

  // Rajada: gente manda 3 mensagens seguidas ("oi" / "tudo bem?" / "vim da
  // pagina"). Sem esta espera saiam 3 respostas, uma por mensagem. Espera um
  // pouco; se chegou mensagem mais nova, quem responde e a chamada dela, com o
  // contexto inteiro.
  const ultimaAntes = await ultimaEntradaId(contactId);
  await new Promise((r) => setTimeout(r, ESPERA_RAJADA_MS));
  if ((await ultimaEntradaId(contactId)) !== ultimaAntes) {
    return { atendeu: false, agente: escolha.agente.slug, motivo: "rajada — a mensagem seguinte responde" };
  }

  // Uma resposta por vez por contato: a segunda espera a primeira terminar e
  // le o historico ja com o que saiu. A escolha e refeita depois da espera —
  // se o dono respondeu nesses segundos, o agente nao fala por cima dele.
  const anterior = emAtendimento.get(contactId) ?? Promise.resolve();
  const atual = anterior
    .catch(() => {})
    .then(async (): Promise<ResultadoAtendimento> => {
      const ex = await excecaoObjecaoDeValor(contactId);
      const agora = await escolherAgente(contactId, { sessao, ignorarHumano: ex.fura });
      if (agora.humanoAssumiu) {
        await adicionarTag(contactId, "humano", "regra:humano-ja-falou").catch(() => {});
      }
      if (!agora.agente) return { atendeu: false, motivo: agora.motivo };
      return atenderCom(agora.agente, contactId, {
        situacao: [await situacaoDoLead(contactId), ex.situacao].filter(Boolean).join("\n\n") || undefined,
        ignorarHumano: ex.fura,
      });
    });
  emAtendimento.set(contactId, atual);
  try {
    return await atual;
  } finally {
    if (emAtendimento.get(contactId) === atual) emAtendimento.delete(contactId);
  }
}

/**
 * Executa a resposta que `atenderMensagem` agendou (chamado pelo cron quando
 * vence). Refaz o gate: se o dono digitou, saiu das automações ou virou
 * `humano` nesse meio-tempo, o robô não fala por cima.
 */
export async function responderAgendado(
  contactId: string,
  tipo: TipoResposta,
  sessao: string | null,
): Promise<ResultadoAtendimento> {
  const contato = await db.contact.findUnique({ where: { id: contactId } });
  if (!contato || semAutomacao(contato.lifecycleStage)) {
    return { atendeu: false, motivo: "fora das automações" };
  }

  if (tipo === "agenda") {
    if (!reuniaoFutura(contato.customFields) || tagsDe(contato.tags).includes("humano") || (await humanoJaFalou(contactId))) {
      return { atendeu: false, agente: "agenda", motivo: "agenda: não cabe mais responder" };
    }
    const calouAgenda = await calarPorMidia("agenda", contactId, personaDaSessao(sessao));
    if (calouAgenda) return calouAgenda;
    const ultima = await db.whatsappMessage.findFirst({
      where: { contactId, direction: "inbound" },
      orderBy: { timestamp: "desc" },
      select: { body: true },
    });
    const enviados = await responderAgenda(contactId, ultima?.body ?? "").catch(() => 0);
    return { atendeu: enviados > 0, agente: "agenda", motivo: enviados ? "agenda respondeu" : "agenda: nada a responder" };
  }

  const anterior = emAtendimento.get(contactId) ?? Promise.resolve();
  const atual = anterior
    .catch(() => {})
    .then(async (): Promise<ResultadoAtendimento> => {
      const ex = await excecaoObjecaoDeValor(contactId);
      const agora = await escolherAgente(contactId, { sessao, ignorarHumano: ex.fura });
      if (agora.humanoAssumiu) {
        await adicionarTag(contactId, "humano", "regra:humano-ja-falou").catch(() => {});
      }
      if (!agora.agente) return { atendeu: false, motivo: agora.motivo };
      return atenderCom(agora.agente, contactId, {
        situacao: [await situacaoDoLead(contactId), ex.situacao].filter(Boolean).join("\n\n") || undefined,
        ignorarHumano: ex.fura,
      });
    });
  emAtendimento.set(contactId, atual);
  try {
    return await atual;
  } finally {
    if (emAtendimento.get(contactId) === atual) emAtendimento.delete(contactId);
  }
}

/**
 * Objeção de valor (ou "2 – travei") fura a tag `humano` e o "humano já falou" — só pra oferecer a
 * oferta menor (downsell), uma vez (objecao-valor.ts). Só olha a ÚLTIMA fala; objeção antiga não reabre o robô.
 */
async function excecaoObjecaoDeValor(contactId: string): Promise<{ fura: boolean; situacao?: string }> {
  const recentes = await db.whatsappMessage.findMany({
    where: { contactId },
    orderBy: { timestamp: "desc" },
    take: 200,
    select: { direction: true, body: true },
  });
  const ultima = recentes[0];
  const ultimaDoLead = recentes.find((m) => m.direction === "inbound")?.body;
  const enviadas = recentes.filter((m) => m.direction === "outbound").map((m) => m.body);
  const entrada = {
    ultimaDoLead,
    nossaUltima: enviadas[0],
    enviadas,
    ultimaEhDoLead: ultima?.direction === "inbound",
  };
  if (!furaHumano(entrada)) return { fura: false };
  return { fura: true, situacao: instrucaoDaObjecao(ehRespostaDois(ultimaDoLead, enviadas[0])) };
}

const ESPERA_RAJADA_MS = Number(process.env.AGENTE_ESPERA_RAJADA_MS ?? 8000);
const emAtendimento = new Map<string, Promise<ResultadoAtendimento>>();

/** Quantas mensagens o lead ja mandou. Contagem, nao "a mais recente": o
 *  timestamp do WAHA e por segundo e duas mensagens no mesmo segundo
 *  empatavam (as duas chamadas respondiam). */
async function ultimaEntradaId(contactId: string): Promise<number> {
  return db.whatsappMessage.count({ where: { contactId, direction: "inbound" } });
}

/** A nossa última fala nesta conversa terminou em pergunta? ("ok" depois dela é resposta, não despedida) */
async function nossaUltimaFoiPergunta(contactId: string): Promise<boolean> {
  const ultima = await db.whatsappMessage.findFirst({
    where: { contactId, direction: "outbound" },
    orderBy: { timestamp: "desc" },
    select: { body: true },
  });
  return Boolean(ultima?.body.trim().endsWith("?"));
}

/** Lead já marcado como não qualificado: o agente para de qualificar e só responde o que ele disse. */
async function situacaoDoLead(contactId: string): Promise<string | undefined> {
  const contato = await db.contact.findUnique({ where: { id: contactId }, select: { tags: true } });
  const marca = tagsDe(contato?.tags).find((t) => t.startsWith("nao-qualificado"));
  if (!marca) return undefined;
  return `ATENÇÃO: este lead já foi marcado como NÃO QUALIFICADO (${marca}). Não faça novas perguntas de diagnóstico nem de qualificação e não retome o que ele já respondeu. Responda só o que ele acabou de dizer, com gentileza e sem oferta, e feche com "qualquer coisa me chama aqui".`;
}

/** Sessao (numero) onde a conversa esta: a da ultima entrada do lead — a mesma
 *  regra que o envio usa pra escolher por onde responder (`agentes.ts`). */
async function sessaoDaConversa(contactId: string): Promise<string | null> {
  const ultima = await db.whatsappMessage.findFirst({
    where: { contactId, direction: "inbound", instanceId: { not: null } },
    orderBy: { timestamp: "desc" },
    select: { instanceId: true },
  });
  if (!ultima?.instanceId) return null;
  const inst = await db.whatsappInstance.findUnique({ where: { id: ultima.instanceId } });
  return inst?.instanceName ?? null;
}

/**
 * Nomes da pessoa que o AGENTE ja disse nesta conversa. Regra da casa
 * (30/10/2026): o nome vai na primeira mensagem e nao se repete — repetir em
 * toda resposta ("Entendi, Camila. ... Certo, Camila.") nao e fala de gente.
 * So o follow-up pode repetir (quem chama a atencao de quem sumiu).
 * Candidatos: o nome do contato e o que ela escreveu ("meu nome e Ana").
 */
/** O que o AGENTE ja escreveu nesta conversa (mais recentes primeiro). */
async function falasDoAgente(contactId: string): Promise<string[]> {
  const saidas = await db.whatsappMessage.findMany({
    where: { contactId, direction: "outbound" },
    orderBy: { timestamp: "desc" },
    take: JANELA_HISTORICO,
    select: { body: true, metadata: true },
  });
  return saidas
    .filter((s) => (s.metadata as Record<string, unknown> | null)?.agente)
    .map((s) => s.body);
}

/** Alguma mensagem NOSSA nesta conversa (agente, regua ou gente) ja apresentou a persona do numero? */
async function personaJaApresentada(contactId: string, persona: Persona): Promise<boolean> {
  const saidas = await db.whatsappMessage.findMany({
    where: { contactId, direction: "outbound" },
    orderBy: { timestamp: "desc" },
    take: JANELA_HISTORICO,
    select: { body: true },
  });
  return saidas.some((s) => persona.apresentacao.test(s.body));
}

function nomesJaDitosPeloAgente(
  nomeDoContato: string | null,
  falasDoLead: string[],
  falasAgente: string[],
): string[] {
  const candidatos = new Set<string>();
  const doContato = primeiroNome(nomeDoContato);
  if (doContato) candidatos.add(doContato);
  for (const fala of falasDoLead) {
    const m = fala.match(/meu nome [ée]\s+(\p{L}{3,})/iu);
    if (m) candidatos.add(m[1]);
  }
  return Array.from(candidatos).filter((n) => falasAgente.some((f) => citaNome(f, n)));
}

/** Roda um agente especifico num contato (o seletor ja decidiu, ou e teste). */
export type OpcoesAtendimento = {
  /** Situacao extra pro modelo (ex.: o follow-up de conversa parada). */
  situacao?: string;
  /** Marca o envio como toque de follow-up (vai pro metadata da mensagem). */
  followup?: string;
  /** Objeção de valor fura a tag `humano` (objecao-valor.ts): o agente entra só pra oferecer a oferta menor. */
  ignorarHumano?: boolean;
};

export async function atenderCom(
  agente: AgenteDb,
  contactId: string,
  opcoes: OpcoesAtendimento = {},
): Promise<ResultadoAtendimento> {
  if (!agente.ativo) return { atendeu: false, agente: agente.slug, motivo: "agente desativado" };

  const contato = await db.contact.findUnique({ where: { id: contactId } });
  if (!contato) return { atendeu: false, agente: agente.slug, motivo: "contato nao encontrado" };

  // Conversa entregue pra humano nao volta pro robo — a tag e o freio de mao.
  if (tagsDe(contato.tags).includes("humano") && !opcoes.ignorarHumano) {
    return { atendeu: false, agente: agente.slug, motivo: "conversa com humano" };
  }

  // Vale também pro follow-up e pra resposta agendada, que entram direto aqui.
  const calou = await calarPorMidia(agente.slug, contactId, personaDaSessao(await sessaoDaConversa(contactId)));
  if (calou) return calou;

  // Respondeu ao convite do resumo (Plano de Faturamento, 15/11/2026): "pode" gera e envia a proposta.
  if (!opcoes.followup && !opcoes.ignorarHumano && tagsDe(contato.tags).includes(TAG_AGUARDANDO_PODE)) {
    const tratada = await tratarRespostaAoConvite(agente, contato);
    if (tratada) return tratada;
  }

  const inicio = new Date();
  const base = await autorizadoCompleto();
  const falasDoLead = await db.whatsappMessage.findMany({
    where: { contactId, direction: "inbound" },
    select: { body: true },
    orderBy: { timestamp: "desc" },
    take: JANELA_HISTORICO,
  });
  // Perguntou o valor e a oferta deste agente tem preço canônico: responde agora (13/11/2026).
  const ofertaPreco: Oferta | null = opcoes.followup ? null : respondePrecoNaHora(agente.slug, falasDoLead[0]?.body);
  const situacao = [opcoes.situacao, ofertaPreco ? instrucaoDePreco(ofertaPreco) : ""].filter(Boolean).join("\n\n");
  const entrada = (await contexto(contactId)) + (situacao ? `

SITUAÇÃO AGORA:
${situacao}` : "");
  // Tudo que já saiu nesta conversa (agente, régua ou gente): resposta nova não repete nenhuma.
  const jaSaiu = (
    await db.whatsappMessage.findMany({
      where: { contactId, direction: "outbound" },
      select: { body: true },
      orderBy: { timestamp: "desc" },
      take: JANELA_HISTORICO,
    })
  )
    .map((m) => m.body)
    .filter((b) => b && b.trim().length > 3);
  // Follow-up: a pagina de proposta do lead (ja enviada a ele) pode ser repetida.
  const jaEnviados = opcoes.followup
    ? await db.whatsappMessage.findMany({
        where: { contactId, direction: "outbound" },
        select: { body: true },
        orderBy: { timestamp: "desc" },
        take: JANELA_HISTORICO,
      })
    : [];
  const autorizado = {
    ...base,
    // Página de consultoria nunca sai de robô (11/11/2026): some da whitelist, então o
    // guarda recusa. A proposta personalizada que um humano já mandou pode ser lembrada
    // no follow-up (linksDePropostaEm).
    links: [...semPaginasDeConsultoria(base.links), ...linksDePropostaEm(jaEnviados.map((m) => m.body))],
    precos: [
      ...base.precos,
      // so o que o lead ESCREVEU: customFields traz telefone e data ISO e liberaria
      // "R$ 2026", "R$ 30"... (revisao de 28/10/2026)
      ...numerosDoLead(falasDoLead.map((m) => m.body)),
    ],
  };
  // Numero com voz propria (persona, numero-comercial.ts): a identidade vai no FIM do prompt e
  // manda mais que a do agente. Vale pra resposta e pro follow-up de 48h.
  const persona = personaDaSessao(await sessaoDaConversa(contactId));
  // Follow-up pode repetir o nome e retomar a pergunta (reformulada); resposta
  // normal nunca repete nome nem pergunta ja feita.
  const falasAgente = opcoes.followup ? [] : await falasDoAgente(contactId);
  const opcoesGuarda = {
    // voz do dono em primeira pessoa; num numero com persona, a persona fala
    proibirTerceiraPessoa: agentesVozDoDono().includes(agente.slug) && !persona,
    // num numero com persona o agente PODE (e deve) se apresentar como ela
    personaSeApresenta: !!persona,
    nomesJaDitos: nomesJaDitosPeloAgente(contato.name, falasDoLead.map((m) => m.body), falasAgente),
    // "Isso encaixa no seu momento atual?" volta no texto de quem começa do zero (16/11/2026)
    perguntasJaFeitas: falasAgente.flatMap(perguntasDe).filter((p) => !ehPerguntaDeEncaixe(p)),
  };
  // Checagens da resposta INTEIRA (13/11/2026): 1 pergunta, nome no máximo 1 vez, nada repetido.
  // agente de preço público fica sem teto de perguntas (briefing de pós-pagamento pede vários itens).
  const opcoesResposta = {
    maxPerguntas: agentesPrecoPublico().includes(agente.slug) ? Number.POSITIVE_INFINITY : 1,
    nomes: candidatosDeNome(contato.name, falasDoLead.map((m) => m.body)),
    mensagensJaEnviadas: jaSaiu,
  };
  const perguntasDoAgente = opcoes.followup ? [] : (await falasDoAgente(contactId)).flatMap(perguntasDe);
  // Quem está começando do zero não é descartado (16/11/2026): o bloco vai depois do texto do
  // banco, que ainda manda "ainda não vende nada → futuro" nas versões antigas.
  const blocoZero = AGENTES_COMECANDO_DO_ZERO.includes(agente.slug)
    ? `\n\n${blocoComecandoDoZero(persona ? "terceira" : "primeira")}`
    : "";
  const prompt =
    comFormato(await renderizarPrompt(agente.prompt)) + blocoZero + (persona ? `\n\n${persona.bloco}` : "");
  // Conversa nova no numero com persona: a 1a mensagem tem que apresentar o dono
  // do numero. O prompt sozinho nao segura (o "NAO se apresente" do agente brigava
  // com a persona), entao o guarda exige — e a 2a tentativa recebe o motivo.
  const precisaApresentar = persona ? !(await personaJaApresentada(contactId, persona)) : false;

  let ultimoErro: string[] = [];
  // Duas tentativas: a segunda recebe o motivo da recusa. Mesmo desenho do
  // crm-leads, onde isso levantou a taxa de aproveitamento sem afrouxar guarda.
  for (let tentativa = 1; tentativa <= 2; tentativa++) {
    // O reforco diz O QUE corrigir e o que NAO mexer: sem isso o modelo
    // "corrige" encurtando tudo e derruba a pergunta final ou o link (visto no
    // teste de mesa do Agente 04).
    const reforco = ultimoErro.length
      ? `\n\nA SUA RESPOSTA ANTERIOR FOI RECUSADA POR: ${ultimoErro.join("; ")}. Reescreva corrigindo SÓ isso — mantenha todo o conteúdo, a pergunta final (ou o "me chama aqui") e o link, se havia. Parágrafo comprido? Quebre em parágrafos de 1-2 frases com linha em branco, ou use [QUEBRA].`
      : "";

    const r = await gerar(prompt, entrada + reforco, { modelo: agente.model });
    if (process.env.DEBUG_AGENTE) {
      console.error(`[debug ${agente.slug} tentativa ${tentativa}] ${r.ok ? r.texto : r.erro}`);
    }
    if (!r.ok || !r.texto) {
      ultimoErro = [r.erro ?? "IA sem resposta"];
      continue;
    }

    const decisao = lerDecisao(r.texto);
    if (!decisao) {
      ultimoErro = ["resposta fora do formato JSON"];
      continue;
    }

    // Passagem silenciosa: a conversa pede gente e o dono do numero assume
    // dali — nada sai pro lead, so estagio/tags/nota, `humano` e o aviso.
    // Passagem pra gente é SEMPRE muda, em qualquer número e com qualquer agente
    // (robô nunca avisa "vou passar pra alguém").
    // Nada sai pro lead — só estágio/tags/nota, `humano` e o aviso pra equipe.
    // Exceção: o convite do resumo SAI pro lead e só depois o robô para (11/11/2026).
    const convidou = ehConviteResumo(decisao.mensagem);
    const silencio = decisao.mensagem.trim() === "-";
    // Perguntou o valor: a resposta é o valor, não passagem nem silêncio (13/11/2026).
    if (ofertaPreco && (decisao.humano || silencio) && !convidou) {
      ultimoErro = [
        `o lead perguntou o valor: responda nesta mensagem com "${ofertaPreco.comoFalar}" e termine com "Faz sentido pro seu momento?" — não devolva humano nem "-"`,
      ];
      continue;
    }
    if (decisao.humano && !convidou) {
      await aplicar(agente, contactId, decisao, [], opcoes.followup, persona);
      return { atendeu: false, agente: agente.slug, motivo: `passou pra ${persona?.nome ?? "gente"} em silencio` };
    }
    // "-" sem humano = o agente decidiu não responder (autoresposta, "ok" depois de encerrar).
    // Nada sai; estágio/tags/nota seguem. Antes o "-" ia pro guarda, era recusado 2× e virava `revisar`.
    if (silencio) {
      await aplicar(agente, contactId, decisao, [], opcoes.followup, persona);
      return { atendeu: false, agente: agente.slug, motivo: "o agente escolheu não responder" };
    }

    // Formato e trabalho de maquina: paragrafo comprido e parte longa sao
    // arrumados aqui (fronteira de frase/paragrafo) ANTES do guarda. O guarda
    // fica pra conteudo (link, preco, tom) e pro que a arrumacao nao resolve.
    const partes = arrumarFormato(dividirQuebra(decisao.mensagem));
    if (!partes.length) {
      ultimoErro = ["mensagem vazia"];
      continue;
    }
    if (partes.length > MAX_PARTES) {
      ultimoErro = [`mais de ${MAX_PARTES} partes — junte em menos mensagens`];
      continue;
    }
    const erros = partes.flatMap((p, i) => {
      const v = validarMensagem(p, autorizado, opcoesGuarda);
      return v.ok ? [] : v.erros.map((e) => (partes.length > 1 ? `parte ${i + 1}: ${e}` : e));
    });
    if (persona && precisaApresentar && !persona.apresentacao.test(partes.join("\n"))) {
      erros.push(
        `faltou se apresentar: neste número a primeira mensagem diz quem fala ("${persona.nome} aqui, ...")`,
      );
    }
    // A ULTIMA parte e a que fica na tela do lead: tem que terminar com
    // pergunta, link ou "me chama aqui". Sem isso a conversa morre em "ok".
    if (!temProximoPasso(partes[partes.length - 1])) {
      erros.push("termina sem pergunta nem próximo passo — feche com UMA pergunta ou 'qualquer coisa me chama aqui'");
    }
    if (partes.some(citaPaginaDeConsultoria)) {
      erros.push(
        'mandou a página de consultoria — robô nunca manda página nem proposta: tire o link e termine com o convite do resumo',
      );
    }
    if (convidou && !ehConviteResumo(partes[partes.length - 1])) {
      erros.push("o convite do resumo tem que ser a ÚLTIMA frase da mensagem — depois dele não vem mais nada");
    }
    erros.push(...validarResposta(partes, opcoesResposta).erros);
    if (ofertaPreco && !partes.some((p) => respondeuOPreco(p, ofertaPreco))) {
      erros.push(`o lead perguntou o valor e a resposta não traz o valor: escreva "${ofertaPreco.comoFalar}"`);
    }
    const limite = opcoes.followup ? null : estourouLimiteDePerguntas(contato.origem, perguntasDoAgente, partes);
    if (limite) erros.push(limite);
    if (erros.length) {
      ultimoErro = erros;
      continue;
    }

    // A geracao leva de segundos a ~1 min. Se alguem do time digitou nesse
    // meio-tempo, a resposta do agente nao sai por cima dele.
    if (await humanoJaFalou(contactId, inicio)) {
      await adicionarTag(contactId, "humano", "regra:humano-ja-falou").catch(() => {});
      return { atendeu: false, agente: agente.slug, motivo: "humano falou durante a geracao" };
    }
    // Convite do resumo saiu: a mensagem vai e o robô para (tag `humano` + aviso), mesmo que
    // o modelo tenha esquecido o "humano": true. Estágio vira "proposta" se ele não disse outro.
    // 15/11/2026 (Plano de Faturamento) e depois em TODOS os funis: não para no convite, marca `aguardando-pode`.
    const final = !convidou
      ? decisao
      : {
          ...decisao,
          humano: false,
          tags: [...(decisao.tags ?? []), TAG_AGUARDANDO_PODE],
          estagio: decisao.estagio ?? "proposta",
          nota: decisao.nota ?? NOTA_CONVITE_ESPERA_PODE,
        };
    await aplicar(agente, contactId, final, partes, opcoes.followup, persona);
    if (ofertaPreco) await avisarPrecoRespondido(agente.slug, contactId, ofertaPreco, persona);
    return { atendeu: true, agente: agente.slug, texto: juntarPartes(partes), partes };
  }

  // Follow-up que falhou nao manda contorno: "deu uma travada" so faz sentido
  // como resposta a uma fala do lead. Silencio e melhor que mensagem sem nexo.
  if (opcoes.followup) {
    return { atendeu: false, agente: agente.slug, motivo: "follow-up nao passou no guarda", erros: ultimoErro };
  }

  // Falhou duas vezes: SILENCIO. Nunca mandamos texto de "deu uma travada"
  // — soava a erro de sistema e chegou a
  // responder autoresponder. So marca `revisar` e avisa.
  await auditar(`agente:${agente.slug}`, "agente_contorno", ultimoErro.join("; ").slice(0, 300));
  // NAO marca `humano` aqui. Falha de guarda e de UM turno — marcar humano
  // matava a conversa pra sempre por um erro nosso (18/08: o guarda de preco
  // barrou a pergunta de qualificacao e enterrou 3 leads reais). Avisa e segue:
  // a proxima mensagem do lead tenta de novo.
  await marcarRevisar(agente.slug, contactId, ultimoErro.join("; "));
  return { atendeu: false, agente: agente.slug, motivo: "falhou nos guardas — silêncio", erros: ultimoErro };
}

/** Traduz a decisao do modelo em acoes auditadas. */
async function aplicar(
  agente: AgenteDb,
  contactId: string,
  d: Decisao,
  partes: string[],
  followup?: string,
  persona?: Persona | null,
) {
  // sem partes = passagem silenciosa: nada sai pro lead
  if (partes.length) {
    await propor({
      agentId: agente.id,
      contactId,
      acao: "enviar_mensagem",
      payload: {
        texto: juntarPartes(partes),
        ...(followup ? { followup } : {}),
        ...(partes.length > 1 ? { partes, delayMs: agente.delayQuebraMs } : {}),
      },
    });
  }

  const contato = await db.contact.findUnique({ where: { id: contactId } });

  // No modo `sugere` a acao fica PENDENTE e o contato nao muda — sem esta
  // checagem o agente reproporia o mesmo estagio e as mesmas tags a cada
  // mensagem, e a fila de aprovacao viraria lixo. Achado na 1a simulacao.
  const pendentes = await db.agentAction.findMany({
    where: { contactId, status: "proposta" },
    select: { acao: true, payload: true },
  });
  const jaProposto = (acao: string, chave: string, valor: string) =>
    pendentes.some(
      (p) => p.acao === acao && (p.payload as Record<string, unknown>)?.[chave] === valor,
    );

  if (d.estagio && ehEstagio(d.estagio)) {
    const mudou = contato && contato.lifecycleStage !== d.estagio;
    if (mudou && !jaProposto("mover_estagio", "estagio", d.estagio)) {
      await propor({
        agentId: agente.id,
        contactId,
        acao: "mover_estagio",
        payload: { estagio: d.estagio },
      });
    }
  }

  // Link de venda saiu = estagio `proposta` (playbook: "se a resposta contiver
  // um link de checkout, mova o estagio para proposta"). Aqui o link de venda e
  // a pagina da oferta (negocio.json); se o modelo ja pediu outro estagio, respeita o dele.
  const linksDeVenda = negocio().ofertas.map((o) => o.link).filter(Boolean);
  const mandouLinkDeVenda = partes.some((p) => linksDeVenda.some((l) => p.includes(l)));
  if (
    mandouLinkDeVenda &&
    !d.estagio &&
    contato &&
    !["proposta", "cliente", "call_marcada"].includes(contato.lifecycleStage) &&
    !jaProposto("mover_estagio", "estagio", "proposta")
  ) {
    await propor({ agentId: agente.id, contactId, acao: "mover_estagio", payload: { estagio: "proposta" } });
  }

  const tagsAtuais = tagsDe(contato?.tags);
  for (const tag of d.tags ?? []) {
    const limpa = tag.trim().toLowerCase();
    if (!limpa || tagsAtuais.includes(limpa)) continue;
    if (jaProposto("adicionar_tag", "tag", limpa)) continue;
    await propor({ agentId: agente.id, contactId, acao: "adicionar_tag", payload: { tag: limpa } });
  }

  if (d.nota) {
    await propor({ agentId: agente.id, contactId, acao: "registrar_nota", payload: { texto: d.nota } });
  }

  // Perfil: so o que mudou em relacao ao que ja esta na ficha.
  const camposAtuais =
    contato?.customFields && typeof contato.customFields === "object"
      ? (contato.customFields as Record<string, unknown>)
      : {};
  const novosCampos = Object.fromEntries(
    Object.entries(d.perfil ?? {}).filter(([k, v]) => String(camposAtuais[k] ?? "") !== v),
  );
  if (Object.keys(novosCampos).length) {
    await propor({ agentId: agente.id, contactId, acao: "registrar_perfil", payload: { campos: novosCampos } });
  }

  if (d.humano) await marcarHumano(agente.slug, contactId, d.nota ?? "o agente pediu gente na conversa", persona);
}

/**
 * O robô respondeu o valor (13/11/2026): o humano acompanha. Tags `perguntou-preco` + `revisar`
 * e aviso (respeita os interruptores do gotcha 63). O agente segue atendendo — "tá caro" vira a oferta menor.
 */
async function avisarPrecoRespondido(slug: string, contactId: string, o: Oferta, persona: Persona | null) {
  await adicionarTag(contactId, "perguntou-preco", `agente:${slug}`).catch(() => {});
  await adicionarTag(contactId, "revisar", `agente:${slug}`).catch(() => {});
  const texto = `O lead perguntou o valor e o robô *${slug}* respondeu: ${o.comoFalar}. Acompanhe a conversa.\n\nAbrir: ${urlDoCrm(`contatos/${contactId}`)}`;
  await avisar("lead_quente", `preco:${contactId}`, texto, persona ? { para: persona.avisarEm } : undefined).catch(() => {});
  await auditar(`agente:${slug}`, "respondeu_preco", `${contactId}: ${avisoDePrecoRespondido(o)}`.slice(0, 200));
}

/** Candidatos a nome da pessoa: o primeiro nome do contato e o que ela escreveu ("meu nome é Ana"). */
function candidatosDeNome(nomeDoContato: string | null, falasDoLead: string[]): string[] {
  const candidatos = new Set<string>();
  const doContato = primeiroNome(nomeDoContato);
  if (doContato) candidatos.add(doContato);
  for (const fala of falasDoLead) {
    const m = fala.match(/meu nome [ée]\s+(\p{L}{3,})/iu);
    if (m) candidatos.add(m[1]);
  }
  return Array.from(candidatos);
}

/**
 * O lead respondeu depois do convite do resumo (tag `aguardando-pode`, só no Plano de Faturamento).
 * "Pode" → gera e envia a proposta (proposta-auto.ts). Proposta já em andamento → silêncio.
 * Qualquer outra coisa (pergunta, preço, dúvida) → conversa com gente, como no convite de 11/11/2026.
 */
async function tratarRespostaAoConvite(
  agente: AgenteDb,
  contato: NonNullable<Awaited<ReturnType<typeof db.contact.findUnique>>>,
): Promise<ResultadoAtendimento | null> {
  const estado = lerEstado(contato.customFields);
  if (estado) {
    return { atendeu: false, agente: agente.slug, motivo: `proposta automática ${estado.estado} — robô em silêncio` };
  }
  const persona = personaDaSessao(await sessaoDaConversa(contato.id));
  // A tag nunca sai: só vale o convite RECENTE. Convite antigo = conversa normal (o robô segue o fluxo de sempre).
  const saidas = await db.whatsappMessage.findMany({
    where: { contactId: contato.id, direction: "outbound" },
    orderBy: { timestamp: "desc" },
    take: 20,
    select: { body: true, timestamp: true },
  });
  const convite = saidas.find((m) => ehConviteResumo(m.body));
  if (!convite || Date.now() - convite.timestamp.getTime() > VALIDADE_CONVITE_MS) return null;

  // TODAS as mensagens do lead desde o convite têm que ser "sim": "quanto custa?" seguido de "pode" é pergunta.
  const respostas = await db.whatsappMessage.findMany({
    where: { contactId: contato.id, direction: "inbound", timestamp: { gt: convite.timestamp } },
    orderBy: { timestamp: "asc" },
    select: { body: true },
  });
  if (!respostas.length || !respostas.every((m) => ehAssentimento(m.body))) {
    await marcarHumano(agente.slug, contato.id, "o lead respondeu ao convite do resumo com outra coisa que não 'pode' — responder manualmente", persona);
    return { atendeu: false, agente: agente.slug, motivo: "resposta ao convite não foi 'pode' — atendimento manual" };
  }
  const r = await iniciarPropostaAuto({ agenteId: agente.id, contactId: contato.id });
  if (r.semServico) {
    await marcarHumano(agente.slug, contato.id, `o lead disse 'pode' mas ${r.motivo} — mande a proposta à mão`, persona);
  }
  return { atendeu: r.iniciada, agente: agente.slug, motivo: r.iniciada ? "proposta automática iniciada" : r.motivo };
}

/** Falha de guarda: avisa e marca pra revisao, mas o agente CONTINUA atendendo. */
async function marcarRevisar(slug: string, contactId: string, motivo: string) {
  await adicionarTag(contactId, "revisar", `agente:${slug}`);
  await avisar(
    "erro",
    `contorno:${contactId}:${motivo.slice(0, 40)}`,
    `O agente *${slug}* não conseguiu responder e ficou em silêncio (nada foi enviado ao lead).

Motivo: ${motivo}

Abrir: ${urlDoCrm(`contatos/${contactId}`)}`,
  ).catch(() => {});
  await auditar(`agente:${slug}`, "agente_revisar", `${contactId}: ${motivo}`.slice(0, 200));
}

/** Tag `humano` = o agente para de responder esse contato pra sempre. */
async function marcarHumano(slug: string, contactId: string, motivo?: string, persona?: Persona | null) {
  const contato = await db.contact.findUnique({ where: { id: contactId } });
  if (!contato) return;

  // Numero com persona: quem responde dali e a pessoa dona do numero — o aviso
  // vai pro WhatsApp dela tambem, senao o lead fica esperando ninguem.
  if (persona) {
    await avisar(
      "lead_quente",
      `${slug}:${contactId}:${persona.nome}`,
      [
        `${persona.nome}, o robô parou de responder uma conversa no teu WhatsApp — agora é contigo.`,
        "",
        `*${contato.name ?? contato.phone}* — ${contato.phone ?? "sem telefone"}`,
        motivo ? `Motivo: ${motivo}` : "",
        "",
        "Responde direto no teu WhatsApp — lê o que já foi dito e continua de onde parou.",
      ]
        .filter(Boolean)
        .join("\n"),
      { para: persona.avisarEm },
    ).catch(() => {
      // aviso nunca pode derrubar o atendimento
    });
  }

  // Passar pra humano sem AVISAR o humano é o mesmo que abandonar o lead: ele
  // fica esperando resposta que ninguem sabe que precisa dar.
  await avisar(
    "lead_quente",
    `${slug}:${contactId}`,
    [
      `⚠️ Atendimento manual: o agente *${slug}* parou de responder e passou esta conversa pra você.`,
      "",
      `*${contato.name ?? contato.phone}* — ${contato.phone ?? "sem telefone"}`,
      motivo ? `Motivo: ${motivo}` : "",
      "",
      `Abrir: ${urlDoCrm(`contatos/${contactId}`)}`,
    ]
      .filter(Boolean)
      .join("\n"),
  ).catch(() => {
    // aviso nunca pode derrubar o atendimento
  });
  await adicionarTag(contactId, "humano", `agente:${slug}`);
  await auditar(`agente:${slug}`, "passou_pra_humano", contactId);
}
