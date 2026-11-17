import { db } from "@/lib/db";
import { negocio, usandoExemplo } from "@/lib/negocio";
import { urlDoCrm } from "@/lib/url";
import { config } from "@/lib/config";
import { conexaoPadrao, enviarTexto, type Conexao } from "@/lib/whatsapp";
import { auditar } from "@/lib/audit";
import { registrarEvento } from "@/lib/timeline";
import { calorDe } from "@/lib/calor";

const RE_INSTAGRAM = /(?<![\w.@])@([a-z0-9._]{2,30})(?![\w.])/i;

/** Acha o Instagram que o lead escreveu na conversa (Etapa 1, pergunta 4). */
function extrairInstagram(
  eventos: { metadata: unknown; timestamp: Date; eventType: string }[],
): string | null {
  for (const e of eventos) {
    if (e.eventType !== "whatsapp_message") continue;
    const meta = (e.metadata ?? {}) as Record<string, unknown>;
    if (meta.direcao !== "recebida") continue;
    const texto = String(meta.texto ?? "");
    const m = texto.match(RE_INSTAGRAM);
    if (m) return `@${m[1]}`;
  }
  return null;
}

/**
 * Aviso no SEU WhatsApp quando algo merece sua atenção agora.
 *
 * O CRM não adianta nada às 21h se você não está com a tela aberta. Aqui só
 * entra o que justifica interromper: lead que respondeu, lead novo que chega
 * qualificado, e venda. Fora isso, silêncio — notificação que toca à toa vira
 * ruído e você para de olhar.
 *
 * Cada aviso sai UMA vez (tabela Notificacao com @@unique[tipo, chave]).
 */

export type TipoAviso = "lead_quente" | "resposta" | "venda" | "erro" | "resumo" | "silencio";

const ROTULO: Record<TipoAviso, string> = {
  lead_quente: "🔥 Lead quente",
  resposta: "💬 Respondeu",
  venda: "💰 Venda",
  erro: "⚠️ Erro",
  resumo: "📋 Resumo do dia",
  silencio: "🔕 Conversas paradas",
};

/**
 * O texto é um aviso do próprio CRM (ou do robô da agenda) que voltou pelo webhook
 * porque o destino é um número conectado? Sem isto ele virava "conversa" de um
 * contato com o nome do dono e poluía a base.
 */
export function ehAvisoInterno(texto: string | null | undefined): boolean {
  const t = String(texto ?? "").replace(/️/g, "").trimStart();
  return Object.values(ROTULO).some((r) => t.startsWith(r.replace(/️/g, ""))) || t.startsWith("📅 REUNIAO AGENDADA");
}

async function ligado(tipo: TipoAviso): Promise<boolean> {
  const v = await config(`notificar_${tipo}`, undefined, "1");
  return v !== "0";
}

/**
 * Interruptor por DESTINATÁRIO (04/11/2026): os agentes passaram a responder os leads, então dá
 * pra calar o aviso por mensagem de cada pessoa sem calar a outra.
 *  - sem `para` (WhatsApp de avisos do dono): `notificar_dono_<tipo>` = "0"
 *  - com `para` (ex.: alguém da equipe): `notificar_para_<telefone>_<tipo>` = "0"
 */
async function ligadoParaDestino(tipo: TipoAviso, para?: string): Promise<boolean> {
  const quem = para ? `para_${para.replace(/\D/g, "")}` : "dono";
  const v = await config(`notificar_${quem}_${tipo}`, undefined, "1");
  return v !== "0";
}

async function destino(): Promise<string | null> {
  // sem configuração, os avisos vão pro WhatsApp do dono (negocio.json)
  // (nunca o número do exemplo: ele pode ser de alguém de verdade)
  const n = await config("notificar_whatsapp", "NOTIFICAR_WHATSAPP", usandoExemplo() ? "" : negocio().dono.whatsapp);
  const so = n.replace(/\D/g, "");
  return so.length >= 12 ? so : null;
}

function dentroDoHorario(inicio: string, fim: string): boolean {
  if (!inicio || !fim) return true;
  const agora = new Date();
  const min = agora.getHours() * 60 + agora.getMinutes();
  const [hi, mi] = inicio.split(":").map(Number);
  const [hf, mf] = fim.split(":").map(Number);
  const ini = hi * 60 + (mi || 0);
  const f = hf * 60 + (mf || 0);
  return ini <= f ? min >= ini && min <= f : min >= ini || min <= f;
}

export type ResultadoAviso = { enviado: boolean; motivo?: string };

export type OpcoesAviso = {
  /** outro destino que nao o `notificar_whatsapp` (ex.: alguém da equipe) */
  para?: string;
  /** numero que envia, quando o padrao pode estar fora (vigia de sessoes) */
  conexao?: Conexao;
};

export async function avisar(
  tipo: TipoAviso,
  chave: string,
  texto: string,
  opcoes: OpcoesAviso = {},
): Promise<ResultadoAviso> {
  if (!(await ligado(tipo))) return { enviado: false, motivo: "tipo desligado" };
  if (!(await ligadoParaDestino(tipo, opcoes.para))) return { enviado: false, motivo: "desligado para este destinatario" };

  const para = opcoes.para ? opcoes.para.replace(/\D/g, "") : await destino();
  if (!para) return { enviado: false, motivo: "numero de notificacao nao configurado" };

  const inicio = await config("notificar_inicio", undefined, "07:00");
  const fim = await config("notificar_fim", undefined, "22:00");
  if (!dentroDoHorario(inicio, fim)) return { enviado: false, motivo: "fora do horario" };

  // Já avisamos isso? Não repete.
  try {
    // 1000, não 200: o motivo do erro vem no fim do texto e sumia do registro (caso Yêda, 15/11/2026).
    await db.notificacao.create({ data: { tipo, chave, detalhe: texto.slice(0, 1000) } });
  } catch {
    return { enviado: false, motivo: "ja avisado" };
  }

  const conexao = opcoes.conexao ?? (await conexaoPadrao());
  if (!conexao) {
    await db.notificacao.deleteMany({ where: { tipo, chave } }); // deixa tentar de novo
    return { enviado: false, motivo: "WhatsApp nao conectado" };
  }

  const r = await enviarTexto(conexao, para, `${ROTULO[tipo]}\n\n${texto}`);
  if (!r.ok) {
    await db.notificacao.deleteMany({ where: { tipo, chave } }); // deixa tentar de novo
    await auditar("sistema", "notificacao_falhou", r.erro ?? "?");
    return { enviado: false, motivo: r.erro };
  }

  await auditar("sistema", "notificacao_enviada", `${tipo}: ${chave}`);
  return { enviado: true };
}

/** Quanto esse contato merece atenção agora. 0-100. A regra vive em `calor.ts` (pura). */
export async function calor(contactId: string): Promise<{ pontos: number; motivos: string[] }> {
  const c = await db.contact.findUnique({
    where: { id: contactId },
    include: { timelineEvents: { orderBy: { timestamp: "desc" }, take: 40 } },
  });
  if (!c) return { pontos: 0, motivos: [] };
  return calorDe(c, c.timelineEvents);
}

/**
 * Lead que chega pelo WhatsApp tem o proprio numero como nome — ninguem batiza.
 * `5515900000465 — 5515900000465` gastava duas linhas do aviso pra dizer uma
 * coisa so. Quando o nome E o numero, sai so o numero, formatado.
 */
function cabecalho(nome: string, phone: string | null): string {
  const so = (v: string) => v.replace(/[^0-9]/g, "");
  const d = so(phone ?? "");
  const bonito =
    d.length === 13
      ? "(" + d.slice(2, 4) + ") " + d.slice(4, 9) + "-" + d.slice(9)
      : d.length === 12
        ? "(" + d.slice(2, 4) + ") " + d.slice(4, 8) + "-" + d.slice(8)
        : (phone ?? "sem telefone");
  return d && so(nome) === d ? bonito : nome + " — " + bonito;
}

const QUEBRA = "\n";

const LIMIAR_QUENTE = 55;
const LIMIAR_QUENTE_FUNIL = 40;

/** Chamado quando chega mensagem. Decide se vale te interromper. */
export async function avaliarEAvisar(contactId: string, textoRecebido: string) {
  const c = await db.contact.findUnique({
    where: { id: contactId },
    include: { timelineEvents: { orderBy: { timestamp: "desc" }, take: 40 } },
  });
  if (!c || c.lifecycleStage === "pessoal" || c.lifecycleStage === "sem_automacao") return;

  const { pontos, motivos } = await calor(contactId);
  const trecho = textoRecebido.slice(0, 140);
  const link = (await config("crm_url", "CRM_URL_PUBLICA", urlDoCrm())) + `/inbox?c=${contactId}`;

  // Só lead quente interrompe. "Fulano respondeu" sozinho não justifica o toque:
  // o Inbox já mostra isso, e aviso que toca à toa faz você parar de olhar todos.
  // Lead de FUNIL PAGO (origem `funil:*`) que respondeu já vale o toque com 40
  // pontos: em 13/10/2026 a 1ª resposta ao toque 1 do Grupo Bastidores ficou 7h
  // no vácuo porque "respondeu" sozinho dá 40 e o limiar era 55. Base fria e
  // grupo continuam em 55.
  const limiar = c.origem.startsWith("funil:") ? LIMIAR_QUENTE_FUNIL : LIMIAR_QUENTE;
  if (pontos < limiar) return;

  const resultado = await avisar(
    "lead_quente",
    contactId,
    `*${cabecalho(c.name, c.phone)}*` + QUEBRA +
      `${pontos}/100 · ${motivos.join(" · ")}\n\n` +
      `_"${trecho}"_\n\n${link}`,
  );

  // Primeira vez que esse contato vira quente (avisar() só entrega uma vez por
  // contato — dedup em Notificacao): destaca no Inbox e deixa o Instagram à
  // vista na conversa, sem precisar rolar a conversa inteira pra achar.
  if (resultado.enviado) {
    await db.conversationState.upsert({
      where: { contactId },
      update: { estado: "destacada", ator: "sistema" },
      create: { contactId, estado: "destacada", ator: "sistema" },
    });

    const instagram = extrairInstagram(c.timelineEvents);
    await registrarEvento({
      contactId,
      eventType: "note",
      channel: "sistema",
      metadata: {
        texto: instagram
          ? `🔥 Lead quente — Instagram: ${instagram}`
          : "🔥 Lead quente — destacado automaticamente (Instagram não identificado na conversa)",
        ator: "sistema",
      },
    });
  }
}

/** Venda entrou — esse sempre vale o toque. */
export async function avisarVenda(
  contactId: string,
  produto: string,
  valueCents: number,
  externalId?: string,
) {
  const c = await db.contact.findUnique({ where: { id: contactId } });
  const valor = (valueCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  await avisar(
    "venda",
    externalId ?? `${contactId}:${Date.now()}`,
    `*${valor}* — ${produto}\n${c?.name ?? "?"} · ${c?.origem ?? "?"}`,
  );
}
