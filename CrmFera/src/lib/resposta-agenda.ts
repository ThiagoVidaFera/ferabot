import { db } from "@/lib/db";
import { negocio } from "@/lib/negocio";
import { sessaoPermitida } from "@/lib/numero-unico";
import { enviarConviteAulaSeElegivel } from "@/lib/convite-aula";
import { auditar } from "@/lib/audit";
import { registrarEvento } from "@/lib/timeline";
import { conexaoPorId, enviarTexto } from "@/lib/whatsapp";
import { reuniaoFutura } from "@/lib/seletor-agente";

/**
 * Robô da agenda no período ANTES da reunião.
 * Quem tem reunião futura só recebe preparo/lembrete — e, se perguntar, estas
 * respostas simples: link da sala, data e hora, propósito. Sem modelo de IA:
 * texto fixo, escolhido por palavra-chave. Pergunta fora disso não recebe
 * resposta; fica no Inbox para o dono.
 */

const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const FUSO = "America/Sao_Paulo";
export const MAX_RESPOSTAS_POR_DIA = 6;

const PEDE_LINK = /\b(link|sala|meet|google meet|zoom|como (eu )?(entro|acesso|participo)|onde (vai ser|ser[aá]|[eé] a reuni))/i;
const PEDE_QUANDO = /\b(que (dia|horas?)|qual (o )?(dia|hor[aá]rio|data|hora)|hor[aá]rio|data da|quando|a que horas|[aà]s quantas)\b/i;
const PEDE_PROPOSITO = /\b(sobre o que|pra que|para que|prop[oó]sito|objetivo|do que se trata|como (vai ser|funciona|ser[aá])|o que (vamos|vai|vou|iremos)|vai rolar)\b/i;

function textoDe(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/** "segunda, 02/11, às 12h30" no fuso de Brasília. */
export function quandoPorExtenso(d: Date): string {
  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const p = (t: string) => partes.find((x) => x.type === t)?.value ?? "";
  const dia = DIAS[new Date(d.toLocaleString("en-US", { timeZone: FUSO })).getDay()];
  const hora = p("minute") === "00" ? `${Number(p("hour"))}h` : `${Number(p("hour"))}h${p("minute")}`;
  return `${dia}, ${p("day")}/${p("month")}, às ${hora}`;
}

/** Respostas (um bloco por assunto perguntado) ou [] se não for pergunta de agenda. */
export function respostasDaAgenda(texto: string, campos: unknown, agora: Date = new Date()): string[] {
  const quando = reuniaoFutura(campos, agora);
  if (!quando || !texto.trim()) return [];
  const link = textoDe((campos as Record<string, unknown> | null)?.link_reuniao);
  const saida: string[] = [];

  if (PEDE_LINK.test(texto) && link) saida.push(`O link da sala é esse: ${link}`);
  if (PEDE_QUANDO.test(texto)) saida.push(`Nossa reunião está marcada pra ${quandoPorExtenso(quando)}.`);
  if (PEDE_PROPOSITO.test(texto)) {
    const n = negocio();
    saida.push(`Nessa reunião, em cerca de ${n.reuniao.duracaoMin} minutos, a gente olha o seu caso e eu te mostro como chegar em ${n.promessa}.`);
    // material de preparo (opcional): o link da isca/apresentação do negocio.json
    if (n.links.isca) saida.push(`Se quiser já ir se preparando: ${n.links.isca}`);
  }
  return saida;
}

/** Responde a última mensagem do lead com o que a agenda sabe. Devolve quantos blocos enviou. */
export async function responderAgenda(contactId: string, ultimaDoLead: string): Promise<number> {
  const c = await db.contact.findUnique({ where: { id: contactId } });
  if (!c?.phone) return 0;
  const blocos = respostasDaAgenda(ultimaDoLead, c.customFields);
  if (!blocos.length) return 0;

  const inicioDoDia = new Date();
  inicioDoDia.setHours(0, 0, 0, 0);
  const hoje = await db.whatsappMessage.count({
    where: { contactId, direction: "outbound", timestamp: { gte: inicioDoDia }, metadata: { path: "$.origem", equals: "agenda" } },
  });
  if (hoje >= MAX_RESPOSTAS_POR_DIA) return 0;

  const entrada = await db.whatsappMessage.findFirst({
    where: { contactId, direction: "inbound", instanceId: { not: null } },
    orderBy: { timestamp: "desc" },
    select: { instanceId: true },
  });
  const conexao = entrada?.instanceId ? await conexaoPorId(entrada.instanceId) : null;
  if (!conexao) return 0;
  // Número único (numero-unico.ts): lead dessa origem só fala pelo número configurado.
  if (!sessaoPermitida(c.origem, conexao.sessao)) {
    await auditar("agenda", "resposta_bloqueada", `${contactId}: numero_unico`);
    return 0;
  }
  const campos = (c.customFields ?? {}) as Record<string, unknown>;
  const destino = textoDe(campos.whatsapp_chat_id) || c.phone;

  let enviados = 0;
  for (const texto of blocos) {
    const r = await enviarTexto(conexao, destino, texto);
    if (!r.ok) {
      await auditar("agenda", "resposta_falhou", `${contactId}: ${r.erro ?? "?"}`);
      break;
    }
    await db.whatsappMessage.create({
      data: {
        contactId,
        instanceId: conexao.instanceId ?? null,
        fromNumber: "crm",
        toNumber: c.phone,
        body: texto,
        direction: "outbound",
        status: "sent",
        externalId: r.externalId ?? null,
        // origem "agenda": não conta como gente falando (não calaria nada)
        metadata: { origem: "agenda", ator: "cron" } as never,
      },
    });
    await registrarEvento({
      contactId,
      eventType: "whatsapp_message",
      channel: "whatsapp",
      metadata: { direcao: "enviada", texto, origem: "agenda", ator: "cron" },
    });
    enviados++;
  }
  if (enviados) {
    await auditar("agenda", "resposta_enviada", `${contactId}: ${enviados} bloco(s)`);
    await enviarConviteAulaSeElegivel({ contactId, conexao, destino });
  }
  return enviados;
}
