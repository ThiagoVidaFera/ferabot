import { db } from "@/lib/db";
import { conexaoDe, enviarMidia, resolverDestino } from "@/lib/whatsapp";
import { registrarEvento } from "@/lib/timeline";
import { enviarVideoPasso4 } from "@/lib/sequencia-iscas";
import { ARQUIVO_VIDEO_PASSO4 } from "@/lib/sequencia-iscas-copy";
import { legendaVideoJornada, nomeParaSaudacao } from "@/lib/sequencia-iscas-copy";
import { pastaMidia } from "@/lib/midia";
import type { OfertaDoCatalogo } from "@/lib/proposta-contato";
import fs from "node:fs";
import path from "node:path";

/**
 * ULTIMO TOQUE = VIDEO: quem fica sem responder os follow-ups do agente recebe o
 * vídeo do dono (o mesmo do passo 4 das iscas), se o arquivo existir na pasta de
 * mídia do CRM. Sem o arquivo, o toque final continua em texto.
 *
 * O toque final de texto (2o) vira o video, com a legenda fixa do passo 4. Quem
 * ja recebeu o video por qualquer caminho nao recebe de novo: cai no toque de
 * texto normal.
 */

/** Decisao pura: o toque final desta conversa deve ser o video? */
export function deveEnviarVideo(p: { toque: number; toquesMax: number; jaRecebeu: boolean; ligado: boolean }): boolean {
  return p.ligado && !p.jaRecebeu && p.toque === p.toquesMax - 1;
}

/** O lead ja recebeu algum video nosso (sequencia das iscas, disparo do Reel, toque anterior)? */
export async function jaRecebeuVideo(contactId: string): Promise<boolean> {
  const n = await db.whatsappMessage.count({ where: { contactId, direction: "outbound", type: "video" } });
  return n > 0;
}

/**
 * VIDEO-RESUMO DA PROPOSTA: quem esta em `proposta` recebe, no ultimo toque, o
 * video-resumo da oferta (se a oferta registrada tiver `videoResumo` e o arquivo
 * existir); sem isso cai no texto.
 */
export const ARQUIVO_VIDEO_PROPOSTA = "video-resumo-proposta-generico.mp4";

export type ToqueFinal = "video-proposta" | "video-jornada" | "texto";

export function escolherToqueFinal(p: {
  etapa: string;
  oferta: OfertaDoCatalogo | null;
  toque: number;
  toquesMax: number;
  jaRecebeu: boolean;
  ligado: boolean;
}): ToqueFinal {
  if (!deveEnviarVideo(p)) return "texto";
  if (p.etapa === "proposta") return p.oferta?.videoResumo ? "video-proposta" : "texto";
  return "video-jornada";
}

/** Legenda do video-resumo: sem validade, sem preco e sem pergunta de duvida. */
export function legendaVideoProposta(nome: string): string {
  const n = nomeParaSaudacao(nome);
  return [
    `${n ? `${n}, enquanto` : "Enquanto"} você avalia a proposta, separamos um vídeo curto sobre o que a gente conversou.`,
    "É rápido: mostra o que a gente monta com você 👆",
    "Quando assistir, é só clicar em Vamos começar na proposta que a gente abre o primeiro passo com você.",
  ].join("\n\n");
}

export type ResultadoVideo = { ok: boolean; erro?: string };

export async function enviarVideoUltimoToque(p: {
  contactId: string;
  sessao: string;
  agente: string;
  chaveFollowup: string;
  /** `proposta` manda o video-resumo; omitido = video da jornada de compra */
  tipo?: "proposta";
}): Promise<ResultadoVideo> {
  const [contato, inst] = await Promise.all([
    db.contact.findUnique({ where: { id: p.contactId } }),
    db.whatsappInstance.findFirst({ where: { instanceName: p.sessao } }),
  ]);
  const conexao = inst ? conexaoDe(inst) : null;
  if (!contato?.phone || !inst || !conexao) return { ok: false, erro: "contato sem telefone ou sessão não configurada" };

  const destino = await resolverDestino(conexao, contato.phone);
  if (!destino.temWhatsapp) return { ok: false, erro: "número sem WhatsApp" };

  const deProposta = p.tipo === "proposta";
  const arquivoVideo = path.join(pastaMidia(), deProposta ? ARQUIVO_VIDEO_PROPOSTA : ARQUIVO_VIDEO_PASSO4);
  if (!fs.existsSync(arquivoVideo)) return { ok: false, erro: `vídeo ausente: ${arquivoVideo}` };
  const legenda = deProposta ? legendaVideoProposta(contato.name) : legendaVideoJornada(contato.name);
  const r = deProposta
    ? await enviarVideoDaPasta(conexao, destino.chatId, ARQUIVO_VIDEO_PROPOSTA, legenda)
    : await enviarVideoPasso4(conexao, destino.chatId, legenda);
  if (!r.ok) return { ok: false, erro: r.erro ?? "falha no envio do vídeo" };

  await db.whatsappMessage.create({
    data: {
      contactId: contato.id,
      instanceId: conexao.instanceId ?? null,
      fromNumber: "crm",
      toNumber: contato.phone,
      body: legenda,
      type: "video",
      direction: "outbound",
      status: "sent",
      externalId: r.externalId ?? null,
      // Mesmo formato das falas do agente: conta como toque (`followup`) e nao
      // como gente (`origem: agente`), entao o gate "humano assume" nao dispara.
      metadata: { origem: "agente", agente: p.agente, followup: p.chaveFollowup, fonte: "api", video: true } as never,
    },
  });
  await registrarEvento({
    contactId: contato.id,
    eventType: "whatsapp_message",
    channel: "agente",
    metadata: { direcao: "enviada", texto: legenda, agente: p.agente, followup: p.chaveFollowup, video: true },
  });
  return { ok: true };
}

async function enviarVideoDaPasta(
  conexao: NonNullable<ReturnType<typeof conexaoDe>>,
  chatId: string,
  arquivoNome: string,
  legenda: string,
) {
  const arquivo = path.join(pastaMidia(), arquivoNome);
  if (!fs.existsSync(arquivo)) return { ok: false as const, erro: `video ausente: ${arquivo}` };
  return enviarMidia(conexao, chatId, {
    tipo: "video",
    mimetype: "video/mp4",
    filename: arquivoNome,
    base64: fs.readFileSync(arquivo).toString("base64"),
    legenda,
  });
}
