import { db } from "@/lib/db";
import { negocio } from "@/lib/negocio";
import { config } from "@/lib/config";
import { auditar } from "@/lib/audit";
import { atenderCom } from "@/lib/agente-conversa";
import { followupAdiado } from "@/lib/followup-adiado";
import { situacaoProposta } from "@/lib/followup-proposta-copy";
import { podeTocarContato } from "@/lib/pode-tocar";
import { tagsDe } from "@/lib/tags";
import { lerSequencia } from "@/lib/sequencia-proposta";
import { escolherToqueFinal, jaRecebeuVideo, enviarVideoUltimoToque } from "@/lib/video-ultimo-toque";
import { lerProposta, ofertaDaProposta, type OfertaDoCatalogo } from "@/lib/proposta-contato";
import {
  escolherAgente,
  ehEnvioHumano,
  agentesNumeroPessoal,
  recarregarListasDeAgentes,
  ORIGENS_ABERTURA_HUMANA,
} from "@/lib/seletor-agente";

/**
 * FOLLOW-UP DE CONVERSA PARADA (48h).
 *
 * Vale pras conversas que os agentes atendem nos numeros WAHA (quando
 * `agentes_numero_pessoal` esta configurado, so os agentes dessa lista). Conversa parada = a ULTIMA mensagem foi do agente e o lead
 * nao respondeu ha 48h. Quem escreve o toque e o PROPRIO agente da conversa,
 * com o historico inteiro — nada de texto fixo: retoma do ponto exato em que
 * parou, e duas pessoas nunca recebem a mesma mensagem (regra anti-ban).
 *
 * Por que nao a regua de `followup-auto.ts`: ela e do numero oficial (template
 * da Meta fora das 24h) e tem texto do funil antigo de mentoria.
 *
 * Travas:
 *  - o gate do seletor vale inteiro (so lead de funil, sem humano na conversa,
 *    sem tag de controle) — ele roda de novo antes de cada toque;
 *  - no maximo TOQUES_MAX toques seguidos sem resposta; respondeu, zera;
 *  - so em horario comercial de Brasilia, segunda a sabado;
 *  - um toque por tick, intervalo minimo entre toques e cap diario.
 *
 * Liga/desliga: Setting `followup_agente` ("0" desliga). Nasce LIGADO.
 */

const PARADA_MS = 48 * 60 * 60 * 1000;
/** Conversa parada ha mais que isso nao e "parada", e abandonada: nao reabre. */
const JANELA_MAX_MS = 30 * 24 * 60 * 60 * 1000;
const TOQUES_MAX = 2;
const CAP_DIA_PADRAO = 30;
const INTERVALO_MIN_MS = 3 * 60 * 1000;
const HORA_INICIO = 9;
const HORA_FIM = 20;
const ATOR = "cron:followup-agente";

export const CHAVE_FOLLOWUP = "agente-48h";

function horarioComercial(agora: Date): boolean {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    hour: "numeric",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(agora);
  const hora = Number(partes.find((p) => p.type === "hour")?.value ?? 0);
  const dia = partes.find((p) => p.type === "weekday")?.value;
  return dia !== "Sun" && hora >= HORA_INICIO && hora < HORA_FIM;
}

function meta(m: unknown): Record<string, unknown> {
  return (m ?? {}) as Record<string, unknown>;
}

export type Candidato = {
  contactId: string;
  sessao: string;
  paradaHa: number;
  toque: number;
  /** a ultima fala foi do dono/time (lead de abertura humana), nao do agente */
  ultimaFoiHumana: boolean;
  /** estagio do lead no CRM: `proposta` troca o texto do toque pela opcao D */
  etapa: string;
  /** oferta da proposta enviada (customFields.proposta); null = proposta sem registro */
  oferta: OfertaDoCatalogo | null;
};

/** Mensagem escrita por um agente que o follow-up retoma (lista vazia = qualquer agente). */
const ehAgente = (m: unknown): boolean => {
  const slug = String(meta(m).agente ?? "");
  if (!slug) return false;
  const lista = agentesNumeroPessoal();
  return lista.length ? lista.includes(slug) : true;
};

/**
 * Conversas paradas: ultima mensagem foi do agente, ha 48h ou mais, num numero
 * pessoal. `toque` = quantos follow-ups ja sairam desde a ultima fala do lead.
 */
export async function conversasParadas(agora = new Date()): Promise<Candidato[]> {
  await recarregarListasDeAgentes();
  const desde = new Date(agora.getTime() - JANELA_MAX_MS);
  const doAgente = await db.whatsappMessage.findMany({
    where: { direction: "outbound", timestamp: { gte: desde }, contactId: { not: null } },
    select: { contactId: true, metadata: true },
    orderBy: { timestamp: "desc" },
    take: 5000,
  });
  // Leads de abertura humana: a conversa comeca pelo dono, entao nao ha
  // mensagem de agente pra achar o contato — ele entra pela origem.
  const deAberturaHumana = new Set(
    (
      await db.contact.findMany({
        where: { origem: { in: ORIGENS_ABERTURA_HUMANA } },
        select: { id: true },
      })
    ).map((c) => c.id),
  );
  const ids = Array.from(
    new Set([
      ...doAgente.filter((m) => ehAgente(m.metadata)).map((m) => m.contactId as string),
      ...deAberturaHumana,
    ]),
  );

  const pessoais = new Map(
    (await db.whatsappInstance.findMany({ where: { provider: { not: "cloud_api" } } })).map((i) => [
      i.id,
      i.instanceName,
    ]),
  );

  const lista: Candidato[] = [];
  for (const contactId of ids) {
    const ultimas = await db.whatsappMessage.findMany({
      where: { contactId },
      orderBy: { timestamp: "desc" },
      take: 12,
      select: { direction: true, metadata: true, timestamp: true, instanceId: true },
    });
    const ultima = ultimas[0];
    if (!ultima || ultima.direction !== "outbound") continue;
    const ficha = await db.contact.findUnique({ where: { id: contactId }, select: { tags: true, lifecycleStage: true, customFields: true } });
    if (!ficha || followupAdiado({ tags: tagsDe(ficha.tags), lifecycleStage: ficha.lifecycleStage }, agora)) continue;
    // Proposta registrada com sequência pós-proposta ativa (D+1 a D+90): quem fala é ela, não o toque de 48h.
    if (lerSequencia(ficha.customFields)?.status === "ativa") continue;
    // Abertura humana: a ultima fala pode ser do dono (ou do agente, ou de um
    // toque anterior). Qualquer outro robo (agenda, regua, disparo) nao conta.
    const ultimaFoiHumana = !ehAgente(ultima.metadata) && ehEnvioHumano(ultima.metadata);
    const falaValida = ehAgente(ultima.metadata) || (deAberturaHumana.has(contactId) && ultimaFoiHumana);
    if (!falaValida) continue;
    const paradaHa = agora.getTime() - ultima.timestamp.getTime();
    if (paradaHa < PARADA_MS || paradaHa > JANELA_MAX_MS) continue;

    // Toques seguidos desde a ultima fala do lead.
    // (toque em varias partes = varias linhas com o mesmo acaoId: conta 1)
    const toques = new Set<string>();
    for (const m of ultimas) {
      if (m.direction === "inbound") break;
      const mm = meta(m.metadata);
      if (mm.followup === CHAVE_FOLLOWUP) toques.add(String(mm.acaoId ?? m.timestamp.toISOString()));
    }
    const toque = toques.size;
    if (toque >= TOQUES_MAX) continue;

    // Sai pelo numero onde o LEAD escreveu (regra do `followup-auto.ts`).
    const dele = await db.whatsappMessage.findFirst({
      where: { contactId, direction: "inbound", instanceId: { not: null } },
      orderBy: { timestamp: "desc" },
      select: { instanceId: true },
    });
    // Lead que nunca respondeu (so recebeu a abertura do dono): sai pelo
    // numero onde a abertura foi enviada.
    const instanciaId = dele?.instanceId ?? ultima.instanceId;
    const sessao = instanciaId ? pessoais.get(instanciaId) : undefined;
    if (!sessao) continue;

    lista.push({
      contactId,
      sessao,
      paradaHa,
      toque,
      ultimaFoiHumana,
      etapa: ficha.lifecycleStage,
      oferta: ofertaDaProposta(lerProposta(ficha.customFields)),
    });
  }
  // quem esta parado ha mais tempo vai primeiro
  return lista.sort((a, b) => b.paradaHa - a.paradaHa);
}

async function enviadosHoje(agora: Date): Promise<{ total: number; ultimo: Date | null }> {
  const inicio = new Date(agora);
  inicio.setHours(0, 0, 0, 0);
  const eventos = await db.auditEvent.findMany({
    where: { actor: ATOR, action: "toque_enviado", createdAt: { gte: inicio } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return { total: eventos.length, ultimo: eventos[0]?.createdAt ?? null };
}

function situacao(c: Candidato): string {
  const horas = Math.round(c.paradaHa / 3_600_000);
  // Proposta ja enviada: o toque e a opcao D (custo de adiar, entregas, risco baixo, clique).
  if (c.etapa === "proposta") {
    return situacaoProposta({ horas, toque: c.toque, ultimaFoiHumana: c.ultimaFoiHumana, oferta: c.oferta });
  }
  return [
    c.ultimaFoiHumana
      ? `FOLLOW-UP: o lead parou de responder há ${horas} horas, depois da última mensagem do ${negocio().dono.primeiroNome} (escrita por ele, na mão). Continue no mesmo tom, como a sequência natural dessa conversa.`
      : `FOLLOW-UP: o lead parou de responder há ${horas} horas, depois da SUA última mensagem.`,
    c.toque === 0
      ? "Este é o primeiro toque depois do silêncio."
      : "Você já mandou um toque e ele também ficou sem resposta. Este é o ÚLTIMO: depois dele você não insiste mais.",
    "Escreva UMA mensagem curta (1 ou 2 parágrafos) que retoma exatamente de onde a conversa parou, com o que o lead já contou.",
    "Não repita a sua última mensagem nem a última pergunta com as mesmas palavras: reformule mais fácil de responder, com 2 exemplos de resposta entre aspas.",
    "Nada de saudação longa, nada de pedir desculpa pelo sumiço, nada de 'pode ignorar' ou 'sem compromisso'. Termine com UMA pergunta.",
    'Não mude o estágio (deixe "estagio" vazio) e humano false.',
  ].join("\n");
}

export type ResultadoFollowupAgente = {
  ligado: boolean;
  motivo?: string;
  candidatos?: number;
  enviado?: { contactId: string; agente?: string; ok: boolean; motivo?: string };
};

/** O cron bate a cada minuto e um toque leva ate ~1 min pra gerar: sem esta
 *  trava, dois ticks sobrepostos escolheriam o mesmo lead e mandariam 2 toques. */
let rodando = false;

/** Um tick do cron: no maximo UM toque. */
/** Setting `followup_agente_video`: só "1" liga o vídeo do último toque (padrão desligado, 13/11/2026). */
export function videoLigadoPelaSetting(valor: string | null | undefined): boolean {
  return (valor ?? "").trim() === "1";
}

async function videoDoUltimoToqueLigado(): Promise<boolean> {
  return videoLigadoPelaSetting(await config("followup_agente_video", undefined, "0"));
}

export async function processarFollowupAgentes(agora = new Date()): Promise<ResultadoFollowupAgente> {
  if (rodando) return { ligado: true, motivo: "tick anterior ainda rodando" };
  rodando = true;
  try {
    return await tick(agora);
  } finally {
    rodando = false;
  }
}

async function tick(agora: Date): Promise<ResultadoFollowupAgente> {
  if ((await config("followup_agente", undefined, "1")) === "0") return { ligado: false };
  if (!horarioComercial(agora)) return { ligado: true, motivo: "fora do horario comercial" };

  const cap = Number(await config("followup_agente_cap_dia", undefined, String(CAP_DIA_PADRAO))) || CAP_DIA_PADRAO;
  const hoje = await enviadosHoje(agora);
  if (hoje.total >= cap) return { ligado: true, motivo: `cap diario (${cap}) atingido` };
  if (hoje.ultimo && agora.getTime() - hoje.ultimo.getTime() < INTERVALO_MIN_MS) {
    return { ligado: true, motivo: "intervalo entre toques" };
  }

  // Conversa que falhou nas ultimas 24h nao e tentada de novo a cada minuto.
  const falhas = await db.auditEvent.findMany({
    where: { actor: ATOR, action: "toque_falhou", createdAt: { gte: new Date(agora.getTime() - 86_400_000) } },
    select: { detail: true },
  });
  const falhou = new Set(falhas.map((f) => String(f.detail ?? "").split(" ")[0]));

  // Vídeo no último toque: DESLIGADO por padrão desde 13/11/2026 (13 envios, 2 respostas). Liga com "1".
  const videoLigado = await videoDoUltimoToqueLigado();
  const lista = (await conversasParadas(agora)).filter((c) => !falhou.has(c.contactId));
  for (const c of lista) {
    // Guarda central (13/11/2026): compra, opt-out, adiamento, "vamos fechar", última fala do lead,
    // número único (numero-unico.ts; aqui não troca de número, só pula).
    const toque = await podeTocarContato({ contactId: c.contactId, regua: "followup-agente", sessao: c.sessao, semTrocarNumero: true, agora });
    if (!toque.liberado) continue;
    // O gate inteiro de novo: humano pode ter assumido, tag de controle, etc.
    const escolha = await escolherAgente(c.contactId, { sessao: c.sessao, modo: "followup" });
    if (!escolha.agente) continue;

    // Toque final = video. Lead em proposta com a oferta padrao recebe o video-resumo
    // da proposta; os demais, o da jornada de compra (quem ja recebeu video segue no texto).
    const toqueFinal = escolherToqueFinal({
      etapa: c.etapa,
      oferta: c.oferta,
      toque: c.toque,
      toquesMax: TOQUES_MAX,
      jaRecebeu: await jaRecebeuVideo(c.contactId),
      ligado: videoLigado,
    });
    if (toqueFinal !== "texto") {
      const v = await enviarVideoUltimoToque({
        contactId: c.contactId,
        sessao: c.sessao,
        agente: escolha.agente.slug,
        chaveFollowup: CHAVE_FOLLOWUP,
        ...(toqueFinal === "video-proposta" ? { tipo: "proposta" as const } : {}),
      });
      await auditar(
        ATOR,
        v.ok ? "toque_enviado" : "toque_falhou",
        `${c.contactId} toque ${c.toque + 1} VIDEO ${toqueFinal} (${escolha.agente.slug})${v.erro ? ` — ${v.erro}` : ""}`.slice(0, 300),
      );
      return {
        ligado: true,
        candidatos: lista.length,
        enviado: { contactId: c.contactId, agente: escolha.agente.slug, ok: v.ok, motivo: v.erro },
      };
    }

    const r = await atenderCom(escolha.agente, c.contactId, {
      situacao: situacao(c),
      followup: CHAVE_FOLLOWUP,
    });
    await auditar(
      ATOR,
      r.atendeu ? "toque_enviado" : "toque_falhou",
      `${c.contactId} toque ${c.toque + 1} (${escolha.agente.slug})${r.motivo ? ` — ${r.motivo}` : ""}`.slice(0, 300),
    );
    return {
      ligado: true,
      candidatos: lista.length,
      enviado: { contactId: c.contactId, agente: escolha.agente.slug, ok: r.atendeu, motivo: r.motivo },
    };
  }
  return { ligado: true, candidatos: lista.length, motivo: "ninguem elegivel" };
}
