import https from "node:https";
import { db } from "@/lib/db";
import { config } from "@/lib/config";
import { auditar } from "@/lib/audit";

/**
 * Conversions API para Business Messaging — devolve pra Meta o que aconteceu
 * DEPOIS do clique no anúncio de WhatsApp.
 *
 * O buraco que isto fecha: a Meta sabe que alguém clicou no anúncio e abriu a
 * conversa, e para aí. Se essa pessoa vira proposta ou compra, isso acontece
 * dentro do WhatsApp e do CRM — a Meta nunca fica sabendo, e otimiza a entrega
 * no escuro, mirando "quem manda mensagem" em vez de "quem compra".
 *
 * O que costura os dois lados é o `ctwa_clid`, capturado no `referral` da
 * primeira mensagem (ver `ctwa.ts`). Sem ele não há evento — não existe outro
 * jeito de a Meta casar uma venda do nosso banco com um clique do anúncio dela.
 *
 * Contrato (docs de Conversions API for Business Messaging):
 *   POST https://graph.facebook.com/v21.0/<DATASET_ID>/events
 *   { data: [{ event_name, event_time, action_source: "business_messaging",
 *              messaging_channel: "whatsapp",
 *              user_data: { whatsapp_business_account_id, ctwa_clid },
 *              custom_data: { currency, value } }] }
 *
 * `ctwa_clid` vai CRU — é o único identificador da CAPI que não é hasheado.
 */

/** Os eventos que fazem sentido no nosso funil. A lista da Meta é maior. */
export type EventoCapi = "QualifiedLead" | "Purchase" | "LeadSubmitted" | "InitiateCheckout";

type Resultado = { enviado: boolean; motivo?: string };

export function postar(url: string, corpo: string, timeoutMs = 15000): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(corpo) },
        timeout: timeoutMs,
      },
      (res) => {
        let dados = "";
        res.setEncoding("utf8");
        res.on("data", (p) => {
          if (dados.length < 4000) dados += p;
        });
        res.on("end", () => resolve(dados));
      },
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.write(corpo);
    req.end();
  });
}

/**
 * Manda um evento de conversão amarrado ao clique do anúncio.
 *
 * Nunca levanta: a venda já está gravada quando isto roda, e falha de
 * atribuição não pode desfazer nem atrasar o registro do dinheiro.
 *
 * Dedup na tabela `Notificacao` (@@unique[tipo, chave]) — reenvio do webhook
 * do checkout mandaria a mesma Purchase duas vezes e inflaria o ROAS que a
 * Meta enxerga, que é exatamente o número que decide onde ela gasta.
 */
export async function enviarEventoCtwa(
  contactId: string,
  evento: EventoCapi,
  opcoes: { valorCentavos?: number; moeda?: string; chaveDedup?: string } = {},
): Promise<Resultado> {
  try {
    if ((await config("capi_ativo", "CAPI_ATIVO", "1")) === "0") {
      return { enviado: false, motivo: "desligado" };
    }

    const contato = await db.contact.findUnique({ where: { id: contactId } });
    if (!contato) return { enviado: false, motivo: "contato nao encontrado" };

    const campos =
      contato.customFields && typeof contato.customFields === "object"
        ? (contato.customFields as Record<string, unknown>)
        : {};

    const clid = String(campos.ctwa_clid ?? "").trim();
    // Sem clid não há o que casar. Não é erro: a maior parte dos contatos não
    // veio de anúncio de WhatsApp.
    if (!clid) return { enviado: false, motivo: "sem ctwa_clid" };

    const waba =
      String(campos.ctwa_waba_id ?? "").trim() || (await config("waba_id", "WABA_ID"));
    if (!waba) return { enviado: false, motivo: "sem whatsapp_business_account_id" };

    const dataset = await config("capi_dataset_id", "CAPI_DATASET_ID");
    const token = (await config("capi_token", "CAPI_TOKEN")) || (await config("meta_ads_token", "META_ADS_TOKEN"));
    if (!dataset || !token) return { enviado: false, motivo: "capi_dataset_id/token nao configurados" };

    // Um evento por contato por tipo (ou pela chave que quem chama passar —
    // a venda usa o externalId do checkout, que e' o id do pedido).
    const chave = `${contactId}:${evento}:${opcoes.chaveDedup ?? ""}`;
    try {
      await db.notificacao.create({
        data: { tipo: "capi_ctwa", chave, detalhe: `${evento} · ${contato.name}`.slice(0, 200) },
      });
    } catch {
      return { enviado: false, motivo: "ja enviado" };
    }

    const corpo = JSON.stringify({
      data: [
        {
          event_name: evento,
          event_time: Math.floor(Date.now() / 1000),
          action_source: "business_messaging",
          messaging_channel: "whatsapp",
          user_data: { whatsapp_business_account_id: waba, ctwa_clid: clid },
          ...(opcoes.valorCentavos !== undefined
            ? {
                custom_data: {
                  currency: opcoes.moeda ?? "BRL",
                  value: opcoes.valorCentavos / 100,
                },
              }
            : {}),
        },
      ],
    });

    const url =
      `https://graph.facebook.com/v21.0/${encodeURIComponent(dataset)}/events` +
      `?access_token=${encodeURIComponent(token)}`;

    let resposta = "";
    try {
      resposta = await postar(url, corpo);
    } catch (e) {
      await db.notificacao.deleteMany({ where: { tipo: "capi_ctwa", chave } });
      await auditar("sistema", "capi_falhou", `${evento}: ${e instanceof Error ? e.message : String(e)}`);
      return { enviado: false, motivo: "rede" };
    }

    // A Graph responde 200 com `error` no corpo em vários casos — checar o
    // status HTTP não bastaria, então o corpo é quem decide.
    let json: {
      events_received?: number;
      error?: {
        message?: string;
        error_user_msg?: string;
        error_subcode?: number;
        is_transient?: boolean;
      };
    } = {};
    try {
      json = JSON.parse(resposta);
    } catch {
      /* corpo não-JSON cai no tratamento de erro abaixo */
    }
    if (json.error || !json.events_received) {
      // `message` da Meta é sempre "Invalid parameter" — inútil pra diagnosticar.
      // Quem diz o que está errado é `error_user_msg` (ex.: "O parâmetro
      // ctwa_clid é inválido"). Registrar o genérico custou uma ida à Graph na
      // mão pra descobrir que o contrato estava certo e só o clid era de teste.
      const msg =
        json.error?.error_user_msg ?? json.error?.message ?? resposta.slice(0, 180);

      // Erro permanente (clid inválido, dataset errado) não melhora tentando de
      // novo: mantém o registro de dedup e para. Só transitório/rede reabre.
      const permanente = json.error?.is_transient === false;
      if (!permanente) {
        await db.notificacao.deleteMany({ where: { tipo: "capi_ctwa", chave } });
      }

      console.log("[capi] recusado:", msg);
      await auditar(
        "sistema",
        "capi_recusado",
        `${evento}: ${String(msg).slice(0, 150)}${permanente ? " [permanente]" : ""}`,
      );
      return { enviado: false, motivo: String(msg).slice(0, 120) };
    }

    await auditar(
      "sistema",
      "capi_enviado",
      `${evento} · ${contactId}` +
        (opcoes.valorCentavos !== undefined ? ` · ${(opcoes.valorCentavos / 100).toFixed(2)}` : ""),
    );
    return { enviado: true };
  } catch (e) {
    return { enviado: false, motivo: e instanceof Error ? e.message : String(e) };
  }
}
