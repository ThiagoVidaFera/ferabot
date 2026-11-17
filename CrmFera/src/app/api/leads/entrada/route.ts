import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { registrarEvento } from "@/lib/timeline";
import { normalizarTelefone, variantesTelefone } from "@/lib/telefone";
import { ehEntradaRepetida, JANELA_ENTRADA_REPETIDA_MS } from "@/lib/entrada-repetida";
import { auditar } from "@/lib/audit";
import { config } from "@/lib/config";
import { avaliarEAvisar } from "@/lib/notificacao";
import { avisarFormularioPreenchido } from "@/lib/aviso-lead";
import { carimbarPortaDeLead } from "@/lib/portas";
import { agendarConviteGrupo, ehFunilGrupo } from "@/lib/convite-grupo";
import { ehFunilIsca } from "@/lib/funil-isca";
import { mesclarDuplicataPorInstagram } from "@/lib/mesclar-contatos";
import { extrairClique } from "@/lib/rastreio-meta";

export const dynamic = "force-dynamic";

/**
 * Porta de entrada de lead do CRM.
 *
 * Porta de entrada única dos leads das páginas (formulário, quiz, agenda). Aceita o
 * MESMO formato deles de propósito — assim landing page e worker existentes
 * passam a apontar pra cá sem reescrever formulário nenhum.
 *
 * Dois modos de autenticação:
 *   - `x-ingest-key` (worker, integração servidor-a-servidor)
 *   - público com CORS (formulário de landing page), protegido por honeypot
 *     e pelos campos obrigatórios — é a mesma exposição que o lead-public já
 *     tinha, não é superfície nova.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-ingest-key",
};

type Entrada = {
  nome?: string;
  name?: string;
  whatsapp?: string;
  telefone?: string;
  phone?: string;
  email?: string;
  instagram?: string;
  origem?: string;
  funil?: string;
  /** formato do lead-public: a oferta que a pagina vende e a etapa (ex.: clicou_checkout) */
  oferta?: string;
  etapa?: string;
  campanha?: string;
  form_id?: string;
  objetivo?: string;
  /** qualquer resposta de quiz/qualificação vai junto e vira ficha */
  respostas?: Record<string, unknown>;
  /**
   * O formato bom: `{ chave: { pergunta, resposta } }`. Os quizzes mandam
   * assim; a ficha (`coletarRespostas`) já sabe ler. Ficou de fora daqui até
   * 28/08/2026 — o lead entrava e as respostas sumiam sem erro nenhum.
   */
  respostas_texto?: Record<string, unknown>;
  /** submit do meio do formulário (contato salvo, quiz não terminou) */
  parcial?: boolean;
  chips?: string[];
  score?: number | string;
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
  utm_content?: string;
  utm_term?: string;
  /**
   * Campos do funil /agendar/ (13/10/2026). Ate aqui o agenda.js mandava
   * nicho, trava e "investe R$100/dia" e tudo sumia sem erro — campo fora
   * desta lista nao vira ficha. Mesma classe de bug do respostas_texto.
   */
  fonte?: string;
  nicho?: string;
  maior_trava?: string;
  investe_100_dia?: string;
  evento_data?: string;
  link_reuniao?: string;
  origem_url?: string;
  /** chave da página que gerou a reunião (agenda.js, 10/11/2026): painel /reunioes */
  pagina?: string;
  ref?: string;
  externalId?: string;
  /**
   * Elo com o clique no anúncio (05/11/2026). Sem isto a Meta não casa nenhuma
   * conversão que o CRM devolve — 0% dos leads de funil traziam `fbc` até aqui.
   * `event_id` é o MESMO do `fbq('track','Lead',…,{eventID})` da página.
   */
  fbc?: string;
  fbp?: string;
  fbclid?: string;
  fbclid_em?: number;
  event_id?: string;
  ad_id?: string;
  utm_id?: string;
  placement?: string;
  client_ip?: string;
  client_user_agent?: string;
  /** honeypot: preenchido = robô */
  company?: string;
  "bot-field"?: string;
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  let d: Entrada;
  try {
    d = (await req.json()) as Entrada;
  } catch {
    return NextResponse.json({ ok: false, erro: "json invalido" }, { status: 400, headers: CORS });
  }

  // Honeypot — campo invisível no formulário. Robô preenche, gente não.
  // Responde 200 de propósito: negar em silêncio é melhor que ensinar o robô.
  if (d.company || d["bot-field"]) {
    return NextResponse.json({ ok: true }, { headers: CORS });
  }

  const chaveEsperada = await config("ingest_key", "INGEST_KEY");
  const chaveRecebida =
    req.headers.get("x-ingest-key") ?? new URL(req.url).searchParams.get("key") ?? "";
  const autenticado = chaveEsperada && chaveRecebida === chaveEsperada;

  const nome = String(d.nome ?? d.name ?? "").trim();
  const phone = normalizarTelefone(d.whatsapp ?? d.telefone ?? d.phone);
  const email = String(d.email ?? "").trim().toLowerCase() || null;

  // Sem forma de contato não é lead — é a regra que faltava no painel antigo
  // e que gerou 2.760 linhas vazias em agosto.
  if (!phone && !email) {
    return NextResponse.json(
      { ok: false, erro: "whatsapp ou email obrigatorio" },
      { status: 422, headers: CORS },
    );
  }

  const origem =
    d.origem?.trim() ||
    (d.funil ? `funil:${slug(d.funil)}` : null) ||
    (d.utm_source ? "anuncio" : "outro");

  // Tudo que o lead respondeu vira ficha — é o que aparece no Inbox ao lado
  // da conversa e evita responder no escuro.
  const campos: Record<string, unknown> = {};
  if (d.instagram) campos.instagram = String(d.instagram).replace(/^@/, "");
  if (d.campanha || d.utm_campaign) campos.campanha = d.campanha ?? d.utm_campaign;
  if (d.form_id) campos.form_id = d.form_id;
  if (d.funil) campos.funil = d.funil;
  if (d.oferta) campos.oferta = d.oferta;
  if (d.etapa) campos.etapa = d.etapa;
  if (d.objetivo) campos.objetivo = d.objetivo;
  if (d.score !== undefined) campos.score = String(d.score);
  if (d.utm_source) campos.utm_source = d.utm_source;
  if (d.utm_medium) campos.utm_medium = d.utm_medium;
  if (d.utm_content) campos.utm_content = d.utm_content;
  if (d.utm_term) campos.utm_term = d.utm_term;
  if (d.fonte) campos.fonte = d.fonte;
  if (d.nicho) campos.nicho = d.nicho;
  if (d.maior_trava) campos.maior_trava = d.maior_trava;
  if (d.investe_100_dia) campos.investe_100_dia = d.investe_100_dia;
  if (d.evento_data) campos.evento_data = d.evento_data;
  if (d.link_reuniao) campos.link_reuniao = d.link_reuniao;
  if (d.origem_url) campos.origem_url = d.origem_url;
  if (d.pagina) campos.pagina = d.pagina;
  // Navegador postando direto: o cabeçalho é do lead. Com x-ingest-key é um
  // servidor no meio, e o IP dele não serve pra Meta — só vale o do corpo.
  const cab = autenticado
    ? {}
    : {
        ip: (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null,
        ua: req.headers.get("user-agent"),
      };
  // IP/UA só vão no Lead desta hora — não ficam gravados no contato (LGPD).
  const { client_ip: ipLead, client_ua: uaLead, ...clique } = extrairClique(d as Record<string, unknown>, cab);
  Object.assign(campos, clique);
  if (Array.isArray(d.chips) && d.chips.length) campos.chips = d.chips;
  if (d.respostas && typeof d.respostas === "object") Object.assign(campos, d.respostas);
  // aninhado de propósito: a ficha espera o par {pergunta, resposta} inteiro,
  // achatar aqui perderia o enunciado.
  if (d.respostas_texto && typeof d.respostas_texto === "object") {
    campos.respostas_texto = d.respostas_texto;
  }

  try {
    const existente =
      (phone ? await db.contact.findFirst({ where: { phone: { in: variantesTelefone(phone) } } }) : null) ??
      (email ? await db.contact.findFirst({ where: { email } }) : null);

    let contactId: string;
    let criado = false;

    if (existente) {
      const camposAtuais =
        existente.customFields && typeof existente.customFields === "object"
          ? (existente.customFields as Record<string, unknown>)
          : {};
      await db.contact.update({
        where: { id: existente.id },
        data: {
          name: existente.name === existente.phone && nome ? nome : existente.name,
          phone: existente.phone ?? phone,
          email: existente.email ?? email,
          // resposta nova vence a antiga: ele acabou de preencher
          customFields: mesclarCampos(camposAtuais, campos) as never,
        },
      });
      contactId = existente.id;
    } else {
      const c = await db.contact.create({
        data: {
          name: nome || phone || email || "Sem nome",
          phone,
          email,
          origem,
          lifecycleStage: "novo",
          customFields: campos as never,
        },
      });
      contactId = c.id;
      criado = true;
    }

    // Já conversou pelo WhatsApp com outro número e o mesmo @ do Instagram? Junta no contato da conversa.
    if (campos.instagram) {
      const mesclado = await mesclarDuplicataPorInstagram(contactId, String(campos.instagram)).catch(() => null);
      if (mesclado) contactId = mesclado.manterId;
    }

    // A porta carimba a tag do momento (playbook): e a tag que decide qual
    // agente fala com essa pessoa quando ela responder no WhatsApp.
    let tagsPorta: string[] = [];
    try {
      tagsPorta = await carimbarPortaDeLead(contactId, {
        funil: d.funil,
        oferta: d.oferta,
        etapa: d.etapa,
        origem,
        campanha: d.campanha ?? d.utm_campaign,
        nicho: d.nicho,
      });
    } catch {
      /* tag de porta nunca derruba a captura do lead */
    }

    const textoEntrada = `Entrou por ${d.funil ?? d.oferta ?? origem}${d.etapa ? ` (${d.etapa})` : ""}`;
    const recentes = criado
      ? []
      : await db.timelineEvent.findMany({
          where: {
            contactId,
            eventType: "form_submit",
            timestamp: { gte: new Date(Date.now() - JANELA_ENTRADA_REPETIDA_MS) },
          },
          select: { timestamp: true, metadata: true },
          take: 10,
        });
    if (!ehEntradaRepetida(recentes, textoEntrada)) await registrarEvento({
      contactId,
      eventType: "form_submit",
      channel: "sistema",
      metadata: {
        texto: textoEntrada,
        campanha: campos.campanha ?? null,
        chips: d.chips ?? [],
        tags: tagsPorta,
        autenticado,
      },
    });

    if (d.externalId) {
      try {
        await db.contactIdentity.create({
          data: {
            contactId,
            fonte: d.funil ? slug(d.funil) : "entrada",
            externalId: d.externalId,
            payload: { origem } as never,
          },
        });
      } catch {
        /* @@unique([fonte, externalId]) — já ligado */
      }
    }

    await auditar(
      autenticado ? "api:ingest" : "api:lead-publico",
      criado ? "lead_recebido" : "lead_atualizado",
      `${nome || phone || email} · ${origem}`,
    );

    // Lead pelo servidor, com o event_id da página: a Meta deduplica com o
    // evento do navegador e recupera o que bloqueador/iOS/aba fechada comeram.
    // Só quando a página mandou event_id — sem ele seria Lead em dobro.
    if (!d.parcial && d.event_id) {
      // Sem await: a resposta ao formulário não espera a Graph.
      const idLead = contactId;
      void import("@/lib/capi-web")
        .then(({ enviarEventoWeb }) =>
          enviarEventoWeb(idLead, "Lead", {
            eventId: String(d.event_id),
            chaveDedup: String(d.event_id),
            actionSource: "website",
            cliente: { ip: ipLead, ua: uaLead },
          }),
        )
        .catch(() => undefined);
    }

    // Funil do grupo de bastidores (27/10/2026): sem aviso no CallMeBot — quem
    // entra recebe o convite pra altoticket do número principal.
    if (ehFunilGrupo(d.funil ?? origem)) {
      if (!d.parcial) {
        try {
          await agendarConviteGrupo(contactId, nome);
        } catch {
          /* convite nunca derruba a captura do lead */
        }
      }
      return NextResponse.json({ ok: true, id: contactId, criado }, { headers: CORS });
    }

    // Isca digital (29/10/2026): sem aviso no CallMeBot. Se o lead responder no
    // WhatsApp, o aviso de resposta (webhook) continua valendo.
    if (ehFunilIsca(d.funil ?? origem)) {
      return NextResponse.json({ ok: true, id: contactId, criado }, { headers: CORS });
    }

    // Aviso no seu WhatsApp se o lead já chegar qualificado.
    try {
      await avaliarEAvisar(contactId, `Novo lead: ${nome || phone} (${d.funil ?? origem})`);
    } catch {
      /* aviso nunca derruba a captura do lead */
    }

    // Formulário COMPLETO (com ou sem quiz): aviso com a ficha, um por pessoa
    // por funil. O `avaliarEAvisar` acima nunca cobre esse caso — o placar dele
    // conta comportamento de WhatsApp, e quem acabou de preencher tem 10/100.
    // Antes só avisava quando havia `respostas`/`respostas_texto` (quiz), o que
    // deixava formulário simples (orçamento, isca de guia) sem aviso nenhum —
    // avisar em todo submit completo.
    if (!d.parcial) {
      try {
        await avisarFormularioPreenchido(contactId, {
          ...campos,
          nome,
          telefone: phone ?? "",
          email: email ?? "",
          funil: d.funil ?? origem,
        });
      } catch {
        /* aviso nunca derruba a captura do lead */
      }
    }

    return NextResponse.json({ ok: true, id: contactId, criado }, { headers: CORS });
  } catch (e) {
    const erro = e instanceof Error ? e.message : String(e);
    await auditar("api:lead", "lead_erro", erro);
    return NextResponse.json({ ok: false, erro }, { status: 500, headers: CORS });
  }
}

/**
 * Mescla resposta nova por cima da antiga sem apagar bloco que a nova não traz.
 * O submit parcial chega antes do completo e um `...spread` cego deixava o
 * parcial (menos respostas) sobrescrever o completo quando a ordem invertia.
 */
function mesclarCampos(
  atuais: Record<string, unknown>,
  novos: Record<string, unknown>,
): Record<string, unknown> {
  const saida = { ...atuais, ...novos };
  const a = atuais.respostas_texto;
  const n = novos.respostas_texto;
  if (a && typeof a === "object" && n && typeof n === "object") {
    saida.respostas_texto = { ...(a as object), ...(n as object) };
  }
  return saida;
}

function slug(v: string): string {
  return v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
