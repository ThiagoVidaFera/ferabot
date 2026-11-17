import { NextRequest, NextResponse } from "next/server";
import { normalizarEntrada, receberMensagem, normalizarStatus, aplicarStatus } from "@/lib/entrada";
import { auditar } from "@/lib/audit";
import { atenderMensagem } from "@/lib/agente-conversa";
import { carimbarPortaDaMensagem } from "@/lib/portas";
import { db } from "@/lib/db";
import { ehAvisoInterno } from "@/lib/notificacao";

export const dynamic = "force-dynamic";

/**
 * Webhook de mensagem recebida.
 *
 * O path e o do megaprompt (/api/webhooks/evolution) e continua valendo — o
 * handler aceita tanto o payload do WAHA quanto o da Evolution. Ha um alias em
 * /api/webhooks/waha para quem preferir o nome do provider real.
 */
export async function POST(req: NextRequest) {
  // Com WEBHOOK_TOKEN no .env, só entra quem traz o token (o CRM o põe na URL ao configurar o WAHA).
  // Sem isso, qualquer um que alcance a porta forjaria mensagem de lead e o robô responderia.
  const tokenEsperado = process.env.WEBHOOK_TOKEN;
  if (tokenEsperado && req.nextUrl.searchParams.get("token") !== tokenEsperado) {
    return NextResponse.json({ ok: false, erro: "nao autorizado" }, { status: 401 });
  }
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ ok: false, erro: "json invalido" }, { status: 400 });
  }

  // Guarda o payload cru do ultimo evento — e o unico jeito de diagnosticar
  // diferenca de formato entre engines (NOWEB manda LID, WEBJS manda numero).
  try {
    await db.setting.upsert({
      where: { key: "ultimo_payload_whatsapp" },
      update: { value: JSON.stringify(corpo).slice(0, 8000) },
      create: { key: "ultimo_payload_whatsapp", value: JSON.stringify(corpo).slice(0, 8000) },
    });
  } catch {
    // diagnostico nunca derruba a entrada de mensagem
  }

  // Status de entrega vem no MESMO webhook das mensagens. Tratar antes: sem
  // isso todo envio do agente ficava "sent" pra sempre.
  const status = normalizarStatus(corpo);
  if (status.length) {
    const aplicados = await aplicarStatus(status);
    return NextResponse.json({ ok: true, status: status.length, aplicados });
  }

  const m = normalizarEntrada(corpo);
  if (!m) {
    return NextResponse.json({ ok: true, ignorada: true, motivo: "formato desconhecido" });
  }

  // A Kapso nao garante o id do numero que RECEBEU dentro do payload, e sem ele
  // a mensagem cairia na instancia default (WAHA) e o agente ficaria mudo, em
  // silencio. Como a URL do webhook e nossa, o numero vai nela:
  // .../webhooks/evolution?sessao=<phone_number_id>. Query e so fallback —
  // payload explicito sempre ganha.
  if (!m.sessao) {
    const daUrl = new URL(req.url).searchParams.get("sessao");
    if (daUrl) m.sessao = daUrl;
  }

  // Aviso do CRM que voltou pelo webhook (o destino e um numero conectado): nao e lead.
  if (!m.fromMe && ehAvisoInterno(m.corpo)) {
    return NextResponse.json({ ok: true, ignorada: true, motivo: "aviso interno do CRM" });
  }

  try {
    const r = await receberMensagem(m);
    if (r.contatoCriado) {
      await auditar("webhook:whatsapp", "contato_criado_por_mensagem", r.contactId ?? "");
    }

    // Porta pela mensagem: o botao da pagina de vendas abre o WhatsApp com um
    // texto pre-preenchido — e ele que carimba `quente-yt` e liga o closer.
    // Tem que acontecer ANTES do seletor escolher o agente.
    // So mensagem DO LEAD: o texto que o dono manda do celular passa pelo
    // mesmo webhook (fromMe) e nao pode carimbar porta nem acordar agente — o
    // agente responderia a mensagem do proprio dono (risco que so nao aparecia
    // porque os numeros pessoais nao tinham agente ate 28/10/2026).
    const doLead = !r.ignorada && r.contactId && !m.fromMe;
    if (doLead) {
      await carimbarPortaDaMensagem(r.contactId!, m.corpo).catch(() => {});
    }

    // Qual agente atende e decisao do seletor (gatilho por tag/estagio/origem,
    // prioridade, tag mais recente). O gate do numero OFICIAL (cloud_api) mora
    // la dentro: fora dele ninguem responde — senao o robo atenderia as
    // conversas pessoais do dono e da equipe, que entram pelo mesmo webhook
    // via WAHA.
    let recepcao: unknown = undefined;
    if (doLead) {
      recepcao = await atenderMensagem(r.contactId!, m.sessao ?? null);
    }

    return NextResponse.json({ ok: true, ...r, recepcao });
  } catch (e) {
    const erro = e instanceof Error ? e.message : String(e);
    await auditar("webhook:whatsapp", "entrada_erro", erro);
    return NextResponse.json({ ok: false, erro }, { status: 500 });
  }
}

/**
 * Alguns providers checam o endpoint com GET antes de assinar.
 * A Meta (Cloud API) faz o handshake `hub.challenge` e EXIGE que a resposta
 * seja o challenge cru em text/plain — JSON aqui reprova a assinatura.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const modo = searchParams.get("hub.mode");
  const desafio = searchParams.get("hub.challenge");
  const token = searchParams.get("hub.verify_token");

  if (modo === "subscribe" && desafio) {
    const esperado = process.env.META_VERIFY_TOKEN;
    if (esperado && token !== esperado) {
      return new NextResponse("token invalido", { status: 403 });
    }
    return new NextResponse(desafio, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ ok: true, pronto: true });
}
