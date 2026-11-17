import { db } from "@/lib/db";
import { enviarConviteAulaSeElegivel } from "@/lib/convite-aula";
import { config } from "@/lib/config";
import { auditar } from "@/lib/audit";
import fs from "node:fs";
import path from "node:path";
import { devolverReserva, liberarPelaConexao } from "@/lib/guarda-numero";
import { podeTocarContato } from "@/lib/pode-tocar";
import { conexaoDe, enviarMidia, enviarTexto, resolverDestino } from "@/lib/whatsapp";
import { pastaMidia } from "@/lib/midia";
import { registrarEvento } from "@/lib/timeline";
import { humanoJaFalou } from "@/lib/seletor-agente";
import {
  ARQUIVO_VIDEO_PASSO4,
  conviteReuniaoPasso4,
  ORIGEM_ISCA,
  PREFIXO_ORIGEM_MATERIAL,
  horarioDeEnvio,
  materialDoContato,
  montarMensagem,
  proximoPasso,
  type Passo,
} from "@/lib/sequencia-iscas-copy";

/**
 * SEQUÊNCIA DAS ISCAS: quem baixou um material gratuito (origem `funil:isca-*` ou
 * `funil:material-*`) recebe 4 mensagens pelo número padrão do CRM (ou o de Setting
 * `sequencia_iscas_sessao`): 1 na hora, 2 depois de 24h, 3 depois de 36h da segunda e 4 (vídeo do
 * dono ou convite para a reunião) 36h depois da terceira. Texto em `sequencia-iscas-copy.ts`.
 */

const ATOR = "cron:sequencia-iscas";
const CAP_DIA_PADRAO = 40;
const INTERVALO_MIN_MS = 90 * 1000;
const RETENTATIVA_MS = 60 * 60 * 1000;
const FALHAS_MAX = 3;
const OLHAR_PARA_TRAS_MS = 5 * 24 * 60 * 60 * 1000;

export type ResultadoSequenciaIscas = {
  ligado: boolean;
  motivo?: string;
  candidatos?: number;
  enviado?: { contactId: string; passo: Passo; ok: boolean; motivo?: string };
};

let rodando = false;

export async function processarSequenciaIscas(agora = new Date()): Promise<ResultadoSequenciaIscas> {
  if (rodando) return { ligado: true, motivo: "tick anterior ainda rodando" };
  rodando = true;
  try {
    return await tick(agora);
  } finally {
    rodando = false;
  }
}

type Evento = { action: string; detail: string | null; createdAt: Date };

function doContato(eventos: Evento[], contactId: string): Evento[] {
  return eventos.filter((e) => (e.detail ?? "").split(" ")[0] === contactId);
}

async function tick(agora: Date): Promise<ResultadoSequenciaIscas> {
  if ((await config("sequencia_iscas", undefined, "0")) !== "1") return { ligado: false };
  // Teste controlado: Setting `sequencia_iscas_so_contato` = id restringe a rodada a UM contato
  // (e dispensa o horario de envio, para testar a qualquer hora).
  const soContato = await config("sequencia_iscas_so_contato", undefined, "");
  if (!soContato && !horarioDeEnvio(agora)) return { ligado: true, motivo: "fora do horario de envio" };

  const eventos = await db.auditEvent.findMany({
    where: { actor: ATOR, createdAt: { gte: new Date(agora.getTime() - 30 * 86_400_000) } },
    orderBy: { createdAt: "desc" },
    select: { action: true, detail: true, createdAt: true },
  });

  const inicioDia = new Date(agora);
  inicioDia.setHours(0, 0, 0, 0);
  const enviosHoje = eventos.filter((e) => e.action.startsWith("passo") && e.createdAt >= inicioDia);
  const cap = Number(await config("sequencia_iscas_cap_dia", undefined, String(CAP_DIA_PADRAO))) || CAP_DIA_PADRAO;
  if (enviosHoje.length >= cap) return { ligado: true, motivo: `cap diario (${cap}) atingido` };
  const ultimo = eventos.find((e) => e.action.startsWith("passo"));
  if (ultimo && agora.getTime() - ultimo.createdAt.getTime() < INTERVALO_MIN_MS) {
    return { ligado: true, motivo: "intervalo entre envios" };
  }

  const sessao = (await config("sequencia_iscas_sessao", "SEQUENCIA_ISCAS_SESSAO", "")) || "";
  const inst = sessao
    ? await db.whatsappInstance.findFirst({ where: { instanceName: sessao } })
    : await db.whatsappInstance.findFirst({ where: { isDefault: true }, orderBy: { createdAt: "desc" } });
  const conexao = inst ? conexaoDe(inst) : null;
  if (!inst || !conexao) return { ligado: true, motivo: "nenhum número de WhatsApp conectado" };

  const contatos = await db.contact.findMany({
    where: {
      ...(soContato ? { id: soContato } : {}),
      phone: { not: null },
      lifecycleStage: { notIn: ["cliente", "perdido", "pessoal", "sem_automacao"] },
      createdAt: { gte: new Date(agora.getTime() - OLHAR_PARA_TRAS_MS) },
      OR: [{ origem: { startsWith: ORIGEM_ISCA } }, { origem: { startsWith: PREFIXO_ORIGEM_MATERIAL } }],
    },
    orderBy: { createdAt: "asc" },
  });

  let devidos = 0;
  for (const c of contatos) {
    const material = materialDoContato(c);
    if (!material || !c.phone) continue;

    const meus = doContato(eventos, c.id);
    const falhas = meus.filter((e) => e.action === "falhou");
    if (falhas.length >= FALHAS_MAX) continue;
    if (falhas[0] && agora.getTime() - falhas[0].createdAt.getTime() < RETENTATIVA_MS) continue;

    const enviados: Partial<Record<Passo, Date>> = {};
    for (const p of [1, 2, 3, 4] as const) {
      const ev = meus.find((e) => e.action === `passo${p}`);
      if (ev) enviados[p] = ev.createdAt;
    }

    // Lead que escreve para o numero (antes ou depois) sai da sequencia; gente
    // do time falando tambem. Nossas proprias mensagens nao contam como gente.
    const escreveu = await db.whatsappMessage.findFirst({
      where: { contactId: c.id, direction: "inbound" },
      select: { id: true },
    });
    const conversou = Boolean(escreveu) || (await humanoJaFalou(c.id));

    const passo = proximoPasso({ criadoEm: c.createdAt, enviados, encerrada: false, conversou }, agora);
    if (!passo) continue;
    devidos += 1;

    // Guarda central (13/11/2026): estágio, compra, opt-out, adiamento, "vamos fechar", número único.
    const toque = await podeTocarContato({ contactId: c.id, regua: "sequencia-iscas", conexao, semTrocarNumero: true, agora });
    if (!toque.liberado) continue;

    // Guarda unico do numero: teto a frio compartilhado, espacamento, janela, quarentena.
    const liberado = await liberarPelaConexao(conexao, passo === 1 ? "prioritario" : "rotina", c.phone);
    // cap cheio so para a rotina: um passo 1 (prioritario) mais adiante ainda pode caber
    if (liberado.motivo === "cap_frio_dia") continue;
    if (!liberado.liberado) return { ligado: true, candidatos: devidos, motivo: `guarda: ${liberado.motivo}` };

    const destino = await resolverDestino(conexao, c.phone);
    if (!destino.temWhatsapp) {
      devolverReserva(conexao);
      // numero sem WhatsApp: some da sequencia (conta como 3 falhas)
      for (let i = 0; i < FALHAS_MAX; i++) await auditar(ATOR, "falhou", `${c.id} passo${passo} numero sem WhatsApp`);
      continue;
    }
    const temVideo = fs.existsSync(path.join(pastaMidia(), ARQUIVO_VIDEO_PASSO4));
    const texto =
      passo === 4 && !temVideo ? conviteReuniaoPasso4(c.name) : montarMensagem(passo, c.name, material, c.origem);
    const r = passo === 4 ? await enviarVideoPasso4(conexao, destino.chatId, texto) : await enviarTexto(conexao, destino.chatId, texto);
    if (!r.ok) {
      await auditar(ATOR, "falhou", `${c.id} passo${passo} ${r.erro ?? "?"}`.slice(0, 300));
      return { ligado: true, candidatos: devidos, enviado: { contactId: c.id, passo, ok: false, motivo: r.erro } };
    }
    await db.whatsappMessage.create({
      data: {
        contactId: c.id,
        instanceId: conexao.instanceId ?? null,
        fromNumber: "crm",
        toNumber: c.phone,
        body: texto,
        ...(passo === 4 && temVideo ? { type: "video" } : {}),
        direction: "outbound",
        status: "sent",
        externalId: r.externalId ?? null,
        metadata: { origem: "sequencia-iscas", fonte: "api", passo, ator: "sistema" } as never,
      },
    });
    await auditar(ATOR, `passo${passo}`, `${c.id} ${material.link}`.slice(0, 300));
    await registrarEvento({
      contactId: c.id,
      eventType: "whatsapp_message",
      channel: "whatsapp",
      metadata: { direcao: "enviada", texto, origem: "sequencia-iscas", passo },
    });
    await enviarConviteAulaSeElegivel({ contactId: c.id, conexao, destino: destino.chatId });
    return { ligado: true, candidatos: devidos, enviado: { contactId: c.id, passo, ok: true } };
  }
  return { ligado: true, candidatos: devidos, motivo: "ninguem devido" };
}

/** Passo 4: o vídeo do dono vai como vídeo, com o convite na legenda. Sem o arquivo, sai em texto. */
export async function enviarVideoPasso4(conexao: NonNullable<ReturnType<typeof conexaoDe>>, chatId: string, legenda: string) {
  const arquivo = path.join(pastaMidia(), ARQUIVO_VIDEO_PASSO4);
  if (!fs.existsSync(arquivo)) return enviarTexto(conexao, chatId, legenda);
  return enviarMidia(conexao, chatId, {
    tipo: "video",
    mimetype: "video/mp4",
    filename: ARQUIVO_VIDEO_PASSO4,
    base64: fs.readFileSync(arquivo).toString("base64"),
    legenda,
  });
}
