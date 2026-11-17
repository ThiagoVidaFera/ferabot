import { db } from "@/lib/db";
import { registrarEvento } from "@/lib/timeline";
import { auditar } from "@/lib/audit";
import { anuncioPorId } from "@/lib/meta-ads";

/**
 * Rastreamento de lead que entra por CTWA (Click-to-WhatsApp).
 *
 * O problema que isto resolve (achado em 28/08/2026): lead de anúncio CTWA
 * nascia com `origem: "whatsapp"` e nome igual ao próprio telefone. Dava pra
 * ver QUE veio do WhatsApp e nada mais — nem campanha, nem conjunto, nem
 * anúncio. A tela de Aquisição nunca ia fechar CPL desses leads.
 *
 * A Meta manda tudo isso, uma única vez, no `referral` da PRIMEIRA mensagem da
 * conversa. Se essa mensagem não for lida na hora, o dado não volta nunca —
 * não existe endpoint pra perguntar depois de qual anúncio veio um contato.
 * Por isso a captura é feita no webhook, antes de qualquer agente responder, e
 * o payload cru é guardado junto: se a resolução do nome falhar (token morto),
 * o `source_id` continua no banco e o nome pode ser preenchido depois.
 */

export type ReferralCtwa = {
  /** id do ANÚNCIO (ou do post) que originou o clique */
  sourceId?: string;
  /** "ad" | "post" */
  sourceType?: string;
  /** permalink da peça (fb.me/...) */
  sourceUrl?: string;
  headline?: string;
  corpo?: string;
  /** identificador do clique — é ele que casa com a CAPI da Meta */
  ctwaClid?: string;
  thumbnail?: string;
  /** WhatsApp Business Account ID — obrigatorio na CAPI de business messaging */
  wabaId?: string;
};

export function referralVazio(r: ReferralCtwa | undefined): boolean {
  if (!r) return true;
  return !r.sourceId && !r.ctwaClid && !r.sourceUrl && !r.headline;
}

/** O que fica gravado em `Contact.customFields` — nomes que a ficha já rotula. */
export type CamposCtwa = {
  ctwa_ad_id?: string;
  ctwa_clid?: string;
  anuncio?: string;
  adset?: string;
  campanha?: string;
  ctwa_headline?: string;
  ctwa_url?: string;
  ctwa_tipo?: string;
  /** ISO — quando a gente capturou; o clique é imediatamente antes */
  ctwa_em?: string;
  ctwa_waba_id?: string;
};

/**
 * Grava a origem do clique no contato e na linha do tempo.
 *
 * Idempotente por contato: o referral só chega na primeira mensagem, mas se um
 * reenvio do webhook trouxer de novo, não duplica evento nem sobrescreve uma
 * atribuição já resolvida por outra (mais completa).
 *
 * Nunca levanta — rastreamento é conveniência, gravar a mensagem é obrigação.
 */
export async function registrarReferral(
  contactId: string,
  ref: ReferralCtwa,
): Promise<{ gravado: boolean; motivo?: string; campos?: CamposCtwa }> {
  try {
    if (referralVazio(ref)) return { gravado: false, motivo: "referral vazio" };

    const contato = await db.contact.findUnique({ where: { id: contactId } });
    if (!contato) return { gravado: false, motivo: "contato nao encontrado" };

    const atuais =
      contato.customFields && typeof contato.customFields === "object"
        ? (contato.customFields as Record<string, unknown>)
        : {};

    // Já atribuído a este mesmo anúncio? Não mexe. Primeiro clique vence:
    // reatribuir apagaria de qual peça a pessoa veio de verdade.
    if (atuais.ctwa_ad_id && atuais.ctwa_ad_id === ref.sourceId) {
      return { gravado: false, motivo: "ja atribuido" };
    }

    // A Graph transforma o id num nome legível. Se o token estiver morto isso
    // volta null e a gente guarda o id mesmo assim — dado cru vale mais que
    // nenhum dado, e o nome dá pra preencher depois.
    const anuncio = ref.sourceId ? await anuncioPorId(ref.sourceId) : null;

    const campos: CamposCtwa = {
      ctwa_ad_id: ref.sourceId || undefined,
      ctwa_clid: ref.ctwaClid || undefined,
      anuncio: anuncio?.nome || ref.headline || undefined,
      adset: anuncio?.adset || undefined,
      campanha: anuncio?.campanha || undefined,
      ctwa_headline: ref.headline || undefined,
      ctwa_url: ref.sourceUrl || undefined,
      ctwa_tipo: ref.sourceType || undefined,
      ctwa_waba_id: ref.wabaId || undefined,
      ctwa_em: new Date().toISOString(),
    };
    for (const k of Object.keys(campos) as (keyof CamposCtwa)[]) {
      if (campos[k] === undefined) delete campos[k];
    }

    await db.contact.update({
      where: { id: contactId },
      data: {
        // `whatsapp` dizia só o canal. `ctwa` diz que foi anúncio pago — é a
        // diferença entre "chegou sozinho" e "custou dinheiro" na Aquisição.
        origem: contato.origem === "whatsapp" || !contato.origem ? "ctwa" : contato.origem,
        customFields: { ...atuais, ...campos } as never,
      },
    });

    const nome = campos.anuncio ?? `anúncio ${ref.sourceId ?? "?"}`;
    await registrarEvento({
      contactId,
      eventType: "note",
      channel: "sistema",
      metadata: {
        texto:
          `📣 Veio do ${campos.ctwa_tipo === "post" ? "post" : "anúncio"}: ${nome}` +
          (campos.campanha ? ` · campanha ${campos.campanha}` : "") +
          (campos.adset ? ` · conjunto ${campos.adset}` : "") +
          (anuncio ? "" : " (nome não resolvido — token do Meta Ads sem acesso)"),
        ator: "sistema",
        ctwa: campos as unknown as Record<string, unknown>,
      },
    });

    await auditar(
      "webhook:whatsapp",
      "ctwa_atribuido",
      `${contactId} · ${campos.ctwa_ad_id ?? "sem id"} · ${campos.campanha ?? "campanha nao resolvida"}`,
    );

    return { gravado: true, campos };
  } catch (e) {
    return { gravado: false, motivo: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Preenche o NOME do anúncio de quem já foi capturado só com o id.
 *
 * Existe porque os dois tokens de Meta Ads estavam mortos quando isso foi
 * construído: o id entra no banco de qualquer jeito, e um token novo depois
 * fecha a atribuição retroativamente. Rodar por
 * `npx tsx scripts/resolver-ctwa.ts`.
 */
export async function resolverPendentes(limite = 200): Promise<{
  olhados: number;
  resolvidos: number;
}> {
  const candidatos = await db.contact.findMany({
    where: { origem: "ctwa" },
    take: limite,
    orderBy: { createdAt: "desc" },
  });

  let resolvidos = 0;
  for (const c of candidatos) {
    const campos =
      c.customFields && typeof c.customFields === "object"
        ? (c.customFields as Record<string, unknown>)
        : {};
    const adId = String(campos.ctwa_ad_id ?? "");
    if (!adId || campos.campanha) continue; // sem id, ou já resolvido

    const anuncio = await anuncioPorId(adId);
    if (!anuncio?.nome) continue;

    await db.contact.update({
      where: { id: c.id },
      data: {
        customFields: {
          ...campos,
          anuncio: anuncio.nome,
          adset: anuncio.adset,
          campanha: anuncio.campanha,
        } as never,
      },
    });
    resolvidos++;
  }

  return { olhados: candidatos.length, resolvidos };
}
