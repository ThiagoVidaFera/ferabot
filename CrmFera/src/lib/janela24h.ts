import { db } from "@/lib/db";
import { enviarConviteAulaSeElegivel } from "@/lib/convite-aula";
import { registrarEvento } from "@/lib/timeline";
import { auditar } from "@/lib/audit";
import { conexaoPorId, enviarTexto } from "@/lib/whatsapp";
import { podeTocarContato } from "@/lib/pode-tocar";

/**
 * Reabertura da janela de 24h (Cloud API / WABA oficial).
 *
 * A Meta só entrega texto livre até 24h depois da ÚLTIMA mensagem que o LEAD
 * mandou (ver `whatsapp.ts` `enviarTexto` provider cloud_api) — passou disso,
 * só template aprovado sai, e o resto da conversa trava. Aqui, ~1h antes de
 * fechar (23h de silêncio do lead), manda um puxão retomando a última
 * pergunta que ficou sem resposta — ainda DENTRO da janela — pra tentar
 * arrancar uma resposta e abrir mais 24h. Só vale pro numero oficial: o WAHA
 * não tem essa regra (ver CLAUDE.md, DESVIOS AUTORIZADOS).
 *
 * Dedup natural: assim que o puxão sai, ele vira a mensagem outbound mais
 * recente da conversa — a próxima rodada não acha mais esse contato como
 * candidato (o filtro exige que a ÚLTIMA mensagem seja inbound).
 */

const HORA_MS = 60 * 60 * 1000;
const JANELA_MIN_H = 23;
const JANELA_MAX_H = 24;

type Candidato = { contactId: string; instanceId: string; nome: string };

async function candidatos(): Promise<Candidato[]> {
  const cloudApi = await db.whatsappInstance.findMany({ where: { provider: "cloud_api" } });
  if (!cloudApi.length) return [];
  const idsCloud = cloudApi.map((i) => i.id);

  const agora = Date.now();
  const desde = new Date(agora - JANELA_MAX_H * HORA_MS);
  const ate = new Date(agora - JANELA_MIN_H * HORA_MS);

  const ultimas = await db.whatsappMessage.findMany({
    where: { instanceId: { in: idsCloud }, contactId: { not: null } },
    orderBy: { timestamp: "desc" },
    distinct: ["contactId"],
    select: { contactId: true, instanceId: true, direction: true, timestamp: true, contact: { select: { name: true } } },
  });

  return ultimas
    .filter(
      (m): m is typeof m & { instanceId: string } =>
        m.direction === "inbound" &&
        m.timestamp <= ate &&
        m.timestamp >= desde &&
        m.instanceId !== null,
    )
    .map((m) => ({
      contactId: m.contactId as string,
      instanceId: m.instanceId,
      nome: m.contact?.name?.split(" ")[0] ?? "tudo bem",
    }));
}

/** Última pergunta que a gente mandou nessa conversa, se ainda houver uma. */
async function ultimaPergunta(contactId: string, instanceId: string): Promise<string | null> {
  const enviadas = await db.whatsappMessage.findMany({
    where: { contactId, instanceId, direction: "outbound" },
    orderBy: { timestamp: "desc" },
    take: 20,
    select: { body: true },
  });
  for (const m of enviadas) {
    const blocos = m.body
      .split(/\n+/)
      .map((b) => b.trim())
      .filter(Boolean);
    const pergunta = [...blocos].reverse().find((b) => b.includes("?"));
    if (pergunta) return pergunta;
  }
  return null;
}

function montarNudge(nome: string, pergunta: string | null): string {
  if (pergunta) return `Oi ${nome}! Só retomando aqui:\n\n${pergunta}`;
  return `Oi ${nome}! Passando pra saber se ficou alguma dúvida por aqui 🙂`;
}

export async function reabrirJanelas24h(): Promise<{ enviados: number; falhas: number }> {
  const lista = await candidatos();
  let enviados = 0;
  let falhas = 0;

  for (const cv of lista) {
    const conexaoDaConversa = await conexaoPorId(cv.instanceId);
    if (!conexaoDaConversa) continue;
    // Guarda central (13/11/2026). Aqui a última mensagem é SEMPRE do lead, então a guarda bloqueia
    // ("ultima_do_lead": quem responde é gente) — o puxão "Só retomando aqui" em cima de uma
    // resposta do lead era exatamente o defeito da auditoria de 12/11. Fica registrado na auditoria.
    const toque = await podeTocarContato({ contactId: cv.contactId, regua: "janela24h", conexao: conexaoDaConversa, semTrocarNumero: true });
    if (!toque.liberado) continue;
    const conexao = toque.conexao ?? conexaoDaConversa;

    const contato = await db.contact.findUnique({ where: { id: cv.contactId } });
    if (!contato?.phone) continue;

    const pergunta = await ultimaPergunta(cv.contactId, cv.instanceId);
    const texto = montarNudge(cv.nome, pergunta);
    const r = await enviarTexto(conexao, contato.phone, texto);

    await db.whatsappMessage.create({
      data: {
        contactId: cv.contactId,
        instanceId: cv.instanceId,
        fromNumber: "crm",
        toNumber: contato.phone,
        body: texto,
        direction: "outbound",
        status: r.ok ? "sent" : "failed",
        externalId: r.externalId ?? null,
        metadata: { origem: "followup", followup: "Reabertura janela 24h", erro: r.erro ?? null } as never,
      },
    });

    if (r.ok) {
      enviados++;
      await enviarConviteAulaSeElegivel({ contactId: cv.contactId, conexao, destino: contato.phone });
      await registrarEvento({
        contactId: cv.contactId,
        eventType: "whatsapp_message",
        channel: "whatsapp",
        metadata: { direcao: "enviada", texto, ator: "sistema:janela24h" },
      });
    } else {
      falhas++;
      await auditar("sistema:janela24h", "reabertura_falhou", `${cv.contactId}: ${r.erro ?? "?"}`);
    }
  }

  return { enviados, falhas };
}
