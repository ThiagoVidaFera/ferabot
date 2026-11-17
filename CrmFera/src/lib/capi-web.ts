import { db } from "@/lib/db";
import { config } from "@/lib/config";
import { auditar } from "@/lib/audit";
import { postar, enviarEventoCtwa, type EventoCapi } from "@/lib/capi";
import { montarEventoWeb, temSinalWeb, temCliqueWhatsapp, origemComPixelProprio, type EventoMeta } from "@/lib/rastreio-meta";

/**
 * CAPI do lead de PÁGINA. Par do `capi.ts` (que cobre só quem veio de anúncio
 * de WhatsApp). Mesmas garantias: nunca levanta, deduplica na `Notificacao`,
 * erro permanente para de tentar, erro transitório reabre a chave.
 */

type Resultado = { enviado: boolean; motivo?: string };

const TIMEOUT_MS = 5000;

type RespostaGraph = {
  events_received?: number;
  error?: { message?: string; error_user_msg?: string; is_transient?: boolean };
};

export async function enviarEventoWeb(
  contactId: string,
  evento: EventoMeta,
  opcoes: {
    valorCentavos?: number;
    moeda?: string;
    chaveDedup?: string;
    eventId?: string;
    actionSource?: "website" | "system_generated";
    cliente?: { ip?: string; ua?: string };
  } = {},
): Promise<Resultado> {
  try {
    if ((await config("capi_web_ativo", "CAPI_WEB_ATIVO", "1")) === "0") {
      return { enviado: false, motivo: "desligado" };
    }
    const contato = await db.contact.findUnique({ where: { id: contactId } });
    if (!contato) return { enviado: false, motivo: "contato nao encontrado" };
    // Lead que nunca passou por anúncio não tem o que atribuir.
    if (!temSinalWeb(contato.customFields)) return { enviado: false, motivo: "sem sinal de anuncio" };
    if (temCliqueWhatsapp(contato.customFields)) return { enviado: false, motivo: "coberto pelo ctwa" };
    if (origemComPixelProprio(contato.origem, await origensFora())) {
      return { enviado: false, motivo: "funil com pixel proprio" };
    }
    // A Meta recusa evento `website` sem user agent — melhor não mandar que gerar recusa diária.
    if (opcoes.actionSource === "website" && !opcoes.cliente?.ua) {
      return { enviado: false, motivo: "website sem user agent" };
    }

    // Pixel só da configuração: aceitar o do corpo deixaria qualquer POST público desviar eventos.
    // Sem pixel configurado não envia: nunca existe pixel "padrão" (evento iria pro pixel de outra pessoa).
    const pixel = await config("capi_pixel_web", "CAPI_PIXEL_WEB");
    if (!pixel) return { enviado: false, motivo: "capi_pixel_web nao configurado" };
    const token = (await config("capi_token", "CAPI_TOKEN")) || (await config("meta_ads_token", "META_ADS_TOKEN"));
    if (!token) return { enviado: false, motivo: "capi_token nao configurado" };

    const chave = `${contactId}:${evento}:${opcoes.chaveDedup ?? ""}`;
    try {
      await db.notificacao.create({
        data: { tipo: "capi_web", chave, detalhe: `${evento} · ${contato.name}`.slice(0, 200) },
      });
    } catch {
      return { enviado: false, motivo: "ja enviado" };
    }

    const ev = montarEventoWeb({
      evento,
      contato,
      agoraSeg: Math.floor(Date.now() / 1000),
      eventId: opcoes.eventId ?? chave,
      valorCentavos: opcoes.valorCentavos,
      moeda: opcoes.moeda,
      actionSource: opcoes.actionSource,
      cliente: opcoes.cliente,
    });
    const testCode = await config("capi_test_event_code", "CAPI_TEST_EVENT_CODE");
    const corpo = JSON.stringify({ data: [ev], ...(testCode ? { test_event_code: testCode } : {}) });
    const url =
      `https://graph.facebook.com/v21.0/${encodeURIComponent(pixel)}/events` +
      `?access_token=${encodeURIComponent(token)}`;

    let resposta = "";
    try {
      resposta = await postar(url, corpo, TIMEOUT_MS);
    } catch (e) {
      await db.notificacao.deleteMany({ where: { tipo: "capi_web", chave } });
      await auditar("sistema", "capi_web_falhou", `${evento}: ${e instanceof Error ? e.message : String(e)}`);
      return { enviado: false, motivo: "rede" };
    }

    let json: RespostaGraph = {};
    try {
      json = JSON.parse(resposta) as RespostaGraph;
    } catch {
      /* corpo não-JSON cai no tratamento de erro */
    }
    if (json.error || !json.events_received) {
      const msg = json.error?.error_user_msg ?? json.error?.message ?? resposta.slice(0, 180);
      const permanente = json.error?.is_transient === false;
      if (!permanente) await db.notificacao.deleteMany({ where: { tipo: "capi_web", chave } });
      await auditar(
        "sistema",
        "capi_web_recusado",
        `${evento} · pixel ${pixel}: ${String(msg).slice(0, 150)}${permanente ? " [permanente]" : ""}`,
      );
      return { enviado: false, motivo: String(msg).slice(0, 120) };
    }

    await auditar(
      "sistema",
      "capi_web_enviado",
      `${evento} · ${contactId} · pixel ${pixel}` +
        (opcoes.valorCentavos !== undefined ? ` · ${(opcoes.valorCentavos / 100).toFixed(2)}` : ""),
    );
    return { enviado: true };
  } catch (e) {
    return { enviado: false, motivo: e instanceof Error ? e.message : String(e) };
  }
}

/** Valor configurado (em centavos) para um evento de etapa; vazio = sem valor. */
async function valorDaEtapa(evento: EventoMeta): Promise<number | undefined> {
  const v = await config(`capi_valor_${evento.toLowerCase()}_centavos`);
  const n = Number(v);
  return v && Number.isFinite(n) && n > 0 ? n : undefined;
}

/**
 * Dispara sem esperar. O CRM roda como servidor Node contínuo (não serverless),
 * então a promessa termina sozinha — e quem chamou (captura, etapa, venda) não
 * fica preso esperando a Graph.
 */
export function devolverConversaoSemEsperar(
  contactId: string,
  evento: EventoMeta,
  opcoes: { valorCentavos?: number; chaveDedup?: string } = {},
): void {
  void devolverConversao(contactId, evento, opcoes).catch(() => undefined);
}

/**
 * Ponto ÚNICO de devolução de conversão pra Meta. Tenta os dois caminhos —
 * WhatsApp (ctwa_clid) e página (fbc/fbp/hash) — e cada um sai em silêncio
 * quando o contato não é dele. Nunca levanta.
 */
export async function devolverConversao(
  contactId: string,
  evento: EventoMeta,
  opcoes: { valorCentavos?: number; chaveDedup?: string } = {},
): Promise<void> {
  const valor = opcoes.valorCentavos ?? (evento === "Purchase" ? undefined : await valorDaEtapa(evento));
  const ctwa: EventoCapi | null =
    evento === "Purchase" ? "Purchase" : evento === "Lead" ? "LeadSubmitted" : "QualifiedLead";
  try {
    if (ctwa) await enviarEventoCtwa(contactId, ctwa, { valorCentavos: valor, chaveDedup: opcoes.chaveDedup });
  } catch {
    /* atribuição nunca derruba quem chamou */
  }
  try {
    await enviarEventoWeb(contactId, evento, { valorCentavos: valor, chaveDedup: opcoes.chaveDedup });
  } catch {
    /* idem */
  }
}

/** Funis que têm pixel próprio (ex.: página de um cliente seu), separados por vírgula. Padrão: nenhum. */
export const ORIGENS_FORA_PADRAO = "";
export async function origensFora(): Promise<string> {
  return config("capi_web_origens_fora", "CAPI_WEB_ORIGENS_FORA", ORIGENS_FORA_PADRAO);
}
