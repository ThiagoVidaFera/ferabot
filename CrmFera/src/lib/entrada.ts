import { db } from "@/lib/db";
import { registrarEvento } from "@/lib/timeline";
import { normalizarTelefone, variantesTelefone } from "@/lib/telefone";
import { avaliarEAvisar } from "@/lib/notificacao";
import { avisarRespostaDeLead } from "@/lib/aviso-lead";
import { registrarReferral, referralVazio, type ReferralCtwa } from "@/lib/ctwa";
import { detectarMidiaWaha, baixarMidiaWaha, type MidiaDetectada } from "@/lib/midia-waha";
import { conexaoDe } from "@/lib/whatsapp";
import { extrairInstagramDaMensagem, mesclarDuplicataPorInstagram } from "@/lib/mesclar-contatos";
import { origemDaMensagemPronta, ORIGEM_MENSAGEM_PRONTA } from "@/lib/numero-comercial";
import { resolverTelefoneDoLid, perguntarLidAoWaha, type FontesLid } from "@/lib/lid";
import { auditar } from "@/lib/audit";

/** As três fontes do LID, ligadas ao banco e à instância WAHA da sessão que recebeu. */
function fontesLid(sessao: string): FontesLid {
  return {
    telefoneDoContatoPorChat: async (jid) => {
      const r = await db.$queryRaw<{ phone: string | null }[]>`
        SELECT phone FROM Contact WHERE json_extract(customFields, '$.whatsapp_chat_id') = ${jid} LIMIT 1`;
      return r[0]?.phone ?? null;
    },
    telefoneDoContatoPorMensagem: async (jid) => {
      const msg = await db.whatsappMessage.findFirst({
        where: { externalId: { contains: `_${jid}_` }, contactId: { not: null } },
        select: { contact: { select: { phone: true } } },
      });
      return msg?.contact?.phone ?? null;
    },
    perguntarAoWaha: async (jid) => {
      if (!sessao) return null;
      const inst = await db.whatsappInstance.findFirst({ where: { instanceName: sessao } });
      const conexao = inst ? conexaoDe(inst) : null;
      return conexao ? perguntarLidAoWaha(conexao, sessao, jid) : null;
    },
  };
}

/**
 * Normalizacao de mensagem recebida. Aceita o formato do WAHA (provider real)
 * E o da Evolution (contrato literal do megaprompt) — assim o endpoint
 * /api/webhooks/evolution do doc funciona para os dois.
 */

export type MensagemRecebida = {
  sessao: string; // qual NUMERO do CRM recebeu — casa com WhatsappInstance.instanceName
  externalId: string;
  de: string; // jid cru — pode ser @lid (NOWEB) ou @c.us
  chatId: string; // onde responder (o mesmo jid de onde veio)
  numero: string; // SO digitos do telefone real, quando da pra saber
  para: string;
  corpo: string;
  tipo: string;
  fromMe: boolean;
  ehGrupo: boolean;
  pushName?: string;
  timestamp: Date;
  /**
   * Mensagem enviada (fromMe): `app` = alguem digitou no celular, `api` = um
   * script mandou pelo WAHA (robo de agenda, disparo). E o que separa "gente
   * assumiu a conversa" de "um robo nosso falou" — o agente so sai no primeiro.
   */
  fonte?: string;
  /** Áudio/foto/vídeo/documento/figurinha (WAHA): entra com rótulo e, se der, com o arquivo. */
  midia?: MidiaDetectada;
  /**
   * De qual anuncio a pessoa clicou pra abrir essa conversa (Click-to-WhatsApp).
   * A Meta manda UMA vez, na primeira mensagem, e nao existe endpoint pra
   * perguntar depois — perdeu aqui, perdeu pra sempre.
   */
  referral?: ReferralCtwa;
};

/**
 * O engine NOWEB do WAHA endereca por LID (`123456789012345@lid`), que NAO e
 * telefone. O numero real vem em `_data.key.remoteJidAlt`. Sem isso o CRM cria
 * contato com o LID no lugar do telefone — foi o que aconteceu no 1o teste real.
 */
function telefoneDoJid(jid: string, dados: Talvez): string {
  if (jid && !jid.includes("@lid")) return jid.split("@")[0].replace(/\D/g, "");
  const key = obj(dados.key);
  const alt = s(key.remoteJidAlt) || s(dados.remoteJidAlt) || s(dados.senderPn);
  return alt ? alt.split("@")[0].replace(/\D/g, "") : "";
}

type Talvez = Record<string, unknown>;

function s(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function obj(v: unknown): Talvez {
  return v && typeof v === "object" ? (v as Talvez) : {};
}

/**
 * Mensagem sem texto (audio, foto, figurinha, documento) tem que APARECER no
 * CRM mesmo assim. Antes ela era descartada por "sem corpo" e sumia inteira —
 * nem entrava no historico, nem o agente sabia que existiu. Lead manda audio o
 * tempo todo; esse era o buraco mais provavel de acontecer no dia 1.
 */
const ROTULO_MIDIA: Record<string, string> = {
  audio: "[áudio]",
  voice: "[áudio]",
  image: "[imagem]",
  video: "[vídeo]",
  document: "[documento]",
  sticker: "[figurinha]",
  location: "[localização]",
  contacts: "[contato]",
  unsupported: "[mensagem não suportada]",
};

function rotuloDeMidia(tipo: string): string {
  return ROTULO_MIDIA[tipo] ?? "";
}

/**
 * Le o bloco `referral` do Click-to-WhatsApp.
 *
 * O formato e o mesmo da Cloud API em todos os BSPs que desembrulham o
 * envelope (Kapso inclusive) — o objeto da mensagem carrega `referral` com
 * `source_id` (o ID do anuncio), `source_type`, `source_url`, `headline`,
 * `body` e `ctwa_clid`. Alguns entregam o mesmo bloco em `context.referral`
 * quando a conversa e retomada, por isso os dois sao olhados.
 */
function lerReferral(msg: Talvez, wabaId?: string): ReferralCtwa | undefined {
  const r = obj(msg.referral).source_id || obj(msg.referral).ctwa_clid
    ? obj(msg.referral)
    : obj(obj(msg.context).referral);
  const ref: ReferralCtwa = {
    sourceId: s(r.source_id) || undefined,
    sourceType: s(r.source_type) || undefined,
    sourceUrl: s(r.source_url) || undefined,
    headline: s(r.headline) || undefined,
    corpo: s(r.body) || undefined,
    // a Meta escreve `ctwa_clid`; alguns BSPs repassam como `ctwaClid`
    ctwaClid: s(r.ctwa_clid) || s(r.ctwaClid) || undefined,
    thumbnail: s(r.thumbnail_url) || s(r.image_url) || undefined,
    // O `entry[].id` do webhook da Cloud API E o WhatsApp Business Account ID.
    // Ele e obrigatorio na CAPI de business messaging, e ler dele evita depender
    // da permissao `whatsapp_business_management` (que o token nao tem).
    wabaId: wabaId || undefined,
  };
  return referralVazio(ref) ? undefined : ref;
}

export function normalizarEntrada(bruto: unknown): MensagemRecebida | null {
  const raiz = obj(bruto);

  // ---- WAHA: { event: "message", session, payload: {...} }
  const sessao = s(raiz.session);

  const p = obj(raiz.payload);
  if (p.from || p.id) {
    const de = s(p.from);
    const dados = obj(p._data);
    const ts = Number(p.timestamp);
    const midia = detectarMidiaWaha(p);
    return {
      sessao,
      externalId: s(p.id) || `${de}-${ts}`,
      de,
      chatId: de,
      numero: telefoneDoJid(de, dados),
      para: s(p.to),
      // mídia sem legenda vem com body null: o rótulo ("[áudio]") faz ela aparecer no Inbox
      corpo: s(p.body) || (midia ? rotuloDeMidia(midia.tipo) : ""),
      tipo: midia?.tipo ?? "text",
      midia: midia ?? undefined,
      fromMe: p.fromMe === true,
      // status/story (status@broadcast) nao e conversa: ignora como grupo, sem poluir a auditoria
      ehGrupo: de.includes("@g.us") || de.includes("status@broadcast"),
      // o WAHA NOWEB manda em _data.pushName; o WEBJS manda notifyName
      pushName: s(dados.pushName) || s(dados.notifyName) || s(p.notifyName) || undefined,
      timestamp: ts ? new Date(ts * 1000) : new Date(),
      fonte: s(p.source) || undefined,
    };
  }

  // ---- Meta Cloud API (BSP oficial: Kapso, Zernio, ou Meta direto):
  // { entry: [{ changes: [{ value: { metadata, contacts, messages } }] }] }
  const entradas = Array.isArray(raiz.entry) ? raiz.entry : [];
  for (const e of entradas) {
    const wabaId = s(obj(e).id);
    const mudancas = Array.isArray(obj(e).changes) ? (obj(e).changes as unknown[]) : [];
    for (const c of mudancas) {
      const valor = obj(obj(c).value);
      const msgs = Array.isArray(valor.messages) ? valor.messages : [];
      if (!msgs.length) continue; // evento de status (sent/delivered/read), nao e mensagem

      const msg = obj(msgs[0]);
      const meta = obj(valor.metadata);
      const perfil = obj(obj((valor.contacts as unknown[])?.[0]).profile);
      const de = s(msg.from); // Cloud API ja manda o telefone em digitos, sem @jid
      const ts = Number(msg.timestamp);

      // O texto vem em lugar diferente por tipo. Botao/lista sao respostas de
      // template — perder isso quebraria o fluxo de qualificacao por botao.
      const tipoMsg = s(msg.type) || "text";
      const corpo =
        s(obj(msg.text).body) ||
        s(obj(obj(msg.interactive).button_reply).title) ||
        s(obj(obj(msg.interactive).list_reply).title) ||
        s(obj(msg.button).text) ||
        s(obj(msg.image).caption) ||
        s(obj(msg.video).caption) ||
        s(obj(msg.document).caption) ||
        s(obj(msg.document).filename) ||
        rotuloDeMidia(tipoMsg);

      return {
        // a sessao do Cloud API e o phone_number_id — casa com instanceName
        sessao: s(meta.phone_number_id),
        externalId: s(msg.id) || `${de}-${ts}`,
        de,
        chatId: de,
        numero: de.replace(/\D/g, ""),
        para: s(meta.display_phone_number),
        corpo,
        tipo: tipoMsg,
        fromMe: false, // Cloud API nao entrega echo da propria mensagem nesse canal
        ehGrupo: false, // WhatsApp Business Platform nao tem grupo
        pushName: s(perfil.name) || undefined,
        timestamp: ts ? new Date(Number(ts) * 1000) : new Date(),
        referral: lerReferral(msg, wabaId),
      };
    }
  }

  // ---- Kapso (payload_version v2): a Kapso DESEMBRULHA o envelope da Meta e
  // entrega a mensagem em `message` (ou `data.message`), sem entry/changes.
  // Confirmado no worker do Diagnostico FERA (`functions/entry-lead.js`), que
  // le exatamente `body.message || body.data.message`.
  const kapsoMsg = obj(raiz.message).from
    ? obj(raiz.message)
    : obj(obj(raiz.data).message).from
      ? obj(obj(raiz.data).message)
      : null;
  if (kapsoMsg) {
    const de = s(kapsoMsg.from) || s(kapsoMsg.phone_number);
    const ts = Number(kapsoMsg.timestamp);
    const kapso = obj(kapsoMsg.kapso);
    const texto = obj(kapsoMsg.text);
    const tipoKapso = s(kapsoMsg.type) || "text";
    const corpo =
      s(texto.body) ||
      s(kapsoMsg.text) ||
      s(kapsoMsg.body) ||
      s(obj(obj(kapsoMsg.interactive).button_reply).title) ||
      s(obj(obj(kapsoMsg.interactive).list_reply).title) ||
      s(obj(kapsoMsg.button).text) ||
      s(obj(kapsoMsg.image).caption) ||
      s(obj(kapsoMsg.video).caption) ||
      s(obj(kapsoMsg.document).caption) ||
      s(obj(kapsoMsg.document).filename) ||
      rotuloDeMidia(tipoKapso);

    // O numero que RECEBEU pode vir em varios lugares dependendo da versao do
    // payload; sem ele o gate de instancia nao acha a conexao e o agente cala.
    const destino =
      s(obj(raiz.whatsapp_phone_number).id) ||
      s(raiz.phone_number_id) ||
      s(obj(raiz.data).phone_number_id) ||
      s(kapso.phone_number_id) ||
      s(obj(kapso.phone_number).id);

    return {
      sessao: destino,
      externalId: s(kapsoMsg.id) || `${de}-${ts}`,
      de,
      chatId: de,
      numero: de.replace(/\D/g, ""),
      para: destino,
      corpo,
      tipo: tipoKapso,
      fromMe: false,
      ehGrupo: false,
      pushName: s(obj(kapsoMsg.profile).name) || s(kapso.contact_name) || undefined,
      timestamp: ts ? new Date(ts * 1000) : new Date(),
      // a Kapso desembrulha o envelope mas preserva o bloco; se um dia mudar,
      // o `kapso.referral` cobre o apelido proprio dela.
      referral:
        lerReferral(kapsoMsg, s(raiz.whatsapp_business_account_id) || s(kapso.waba_id)) ??
        lerReferral(kapso, s(raiz.whatsapp_business_account_id)),
    };
  }

  // ---- Evolution: { data: { key: {...}, message: {...}, pushName } }
  const d = obj(raiz.data);
  const key = obj(d.key);
  if (key.remoteJid) {
    const msg = obj(d.message);
    const ext = obj(msg.extendedTextMessage);
    const de = s(key.remoteJid);
    return {
      sessao: sessao || s(raiz.instance),
      externalId: s(key.id) || `${de}-${Date.now()}`,
      de,
      chatId: de,
      numero: telefoneDoJid(de, d),
      para: "",
      corpo: s(msg.conversation) || s(ext.text),
      tipo: "text",
      fromMe: key.fromMe === true,
      ehGrupo: de.includes("@g.us"),
      pushName: s(d.pushName) || undefined,
      timestamp: d.messageTimestamp ? new Date(Number(d.messageTimestamp) * 1000) : new Date(),
    };
  }

  return null;
}

export type ResultadoEntrada = {
  ignorada: boolean;
  motivo?: string;
  contactId?: string;
  messageId?: string;
  contatoCriado?: boolean;
};

/**
 * Grava a mensagem recebida: cria o contato se o numero for novo (name =
 * pushName), grava WhatsappMessage + TimelineEvent e atualiza lastActivityAt.
 * Dedup por externalId — a mesma mensagem reenviada nunca duplica.
 */
export async function receberMensagem(m: MensagemRecebida): Promise<ResultadoEntrada> {
  // DESVIO CONSCIENTE do megaprompt: ele manda ignorar `fromMe:true`. Seguir
  // isso descarta TODA mensagem enviada pelo celular (as que o dono responde
  // na mão) — o inbox mostraria só o lado do lead, metade da conversa. Aqui
  // fromMe entra como OUTBOUND; o dedup por externalId impede que a mensagem
  // que o próprio CRM enviou apareça duas vezes.
  if (m.ehGrupo) return { ignorada: true, motivo: "grupo" };
  if (!m.corpo.trim()) return { ignorada: true, motivo: "sem corpo" };

  const ja = await db.whatsappMessage.findUnique({ where: { externalId: m.externalId } });
  if (ja) {
    return { ignorada: true, motivo: "duplicada", contactId: ja.contactId ?? undefined };
  }

  // Em mensagem enviada pelo celular, o "outro lado" é o destinatário.
  let phone = normalizarTelefone(m.numero);
  if (!phone && m.de.includes("@lid")) {
    // Envio pela API e parte das respostas no WAHA chegam com LID e sem
    // remoteJidAlt: resolve pelo que o banco já sabe e, por último, pelo WAHA.
    phone = normalizarTelefone(await resolverTelefoneDoLid(m.de, fontesLid(m.sessao)));
  }
  if (!phone) {
    // Sem telefone real nao ha identidade — melhor recusar do que criar um
    // contato com LID no lugar do numero. Mas NUNCA em silêncio: fica no log.
    await auditar("webhook:whatsapp", "entrada_descartada_sem_telefone", `${m.sessao} ${m.de} ${m.externalId} ${m.fromMe ? "enviada" : "recebida"}`).catch(() => {});
    return { ignorada: true, motivo: "sem telefone identificavel" };
  }

  // Em mensagem enviada (fromMe) o pushName é o de QUEM ENVIOU — o dono. Usar
  // isso batizava o lead com o nome do dono.
  const nomeDoLead = m.fromMe ? undefined : m.pushName?.trim() || undefined;

  let contato = await db.contact.findFirst({ where: { phone: { in: variantesTelefone(phone) } } });
  let contatoCriado = false;
  if (!contato) {
    contato = await db.contact.create({
      data: {
        name: nomeDoLead || phone,
        phone,
        origem: (!m.fromMe && origemDaMensagemPronta(m.corpo)) || "whatsapp",
        lifecycleStage: "novo",
      },
    });
    contatoCriado = true;
  } else if (!m.fromMe && contato.origem === "whatsapp" && origemDaMensagemPronta(m.corpo)) {
    // base antiga que usou o botao das paginas: agora e lead de funil e o robo atende
    contato = await db.contact.update({ where: { id: contato.id }, data: { origem: ORIGEM_MENSAGEM_PRONTA } });
  } else if (contato.name === contato.phone && nomeDoLead) {
    // so preenche nome se o contato ainda estava sem nome de verdade
    contato = await db.contact.update({
      where: { id: contato.id },
      data: { name: nomeDoLead },
    });
  }

  // Responder no MESMO chatId de onde veio (LID inclusive) e o caminho seguro.
  const camposAtuais =
    contato.customFields && typeof contato.customFields === "object"
      ? (contato.customFields as Record<string, unknown>)
      : {};
  if (camposAtuais.whatsapp_chat_id !== m.chatId) {
    contato = await db.contact.update({
      where: { id: contato.id },
      data: { customFields: { ...camposAtuais, whatsapp_chat_id: m.chatId } as never },
    });
  }

  // Atribuicao do CTWA: tem que ser AQUI, antes de qualquer coisa poder
  // falhar mais adiante. A Meta manda o `referral` uma unica vez, na primeira
  // mensagem, e nao existe endpoint pra perguntar depois de qual anuncio o
  // contato veio — se este ponto do codigo nao gravar, o dado nao existe mais.
  if (!m.fromMe && m.referral) {
    await registrarReferral(contato.id, m.referral).catch(() => {});
  }

  // A instancia que RECEBEU — casa pela sessao do payload; sem isso, com dois
  // numeros conectados, toda mensagem ficaria pendurada no numero padrao.
  const instancia =
    (m.sessao
      ? await db.whatsappInstance.findFirst({ where: { instanceName: m.sessao } })
      : null) ?? (await db.whatsappInstance.findFirst({ where: { isDefault: true } }));

  // Defesa extra de duplicata: o WAHA às vezes ecoa a mensagem que o próprio
  // CRM acabou de mandar com um id diferente do que devolveu no envio.
  if (m.fromMe) {
    const eco = await db.whatsappMessage.findFirst({
      where: {
        contactId: contato.id,
        direction: "outbound",
        body: m.corpo,
        timestamp: { gte: new Date(m.timestamp.getTime() - 120000) },
      },
    });
    if (eco) return { ignorada: true, motivo: "eco do proprio envio", contactId: contato.id };

    // Eco de MÍDIA que o próprio Inbox mandou: o texto gravado lá é "🎤 Áudio"/"📷 Foto",
    // então a comparação por corpo não pega. Casa por tipo + janela + `midiaId`.
    if (m.midia) {
      const recentes = await db.whatsappMessage.findMany({
        where: {
          contactId: contato.id,
          direction: "outbound",
          type: m.tipo,
          timestamp: { gte: new Date(m.timestamp.getTime() - 120000) },
        },
        select: { metadata: true },
        take: 10,
      });
      const ecoMidia = recentes.some((r) => typeof (r.metadata as Record<string, unknown> | null)?.midiaId === "string");
      if (ecoMidia) return { ignorada: true, motivo: "eco da midia enviada pelo Inbox", contactId: contato.id };
    }

    // Corrida do eco do AGENTE: o WAHA as vezes devolve o fromMe antes de o
    // agente gravar a linha (envia primeiro, grava depois). Sem isto a
    // resposta do robo virava "celular" e — sem `source` — contava como gente,
    // calando o agente depois da 1a mensagem (revisao de 28/10/2026).
    const doAgente = await db.agentAction.findMany({
      where: {
        contactId: contato.id,
        acao: "enviar_mensagem",
        createdAt: { gte: new Date(Date.now() - 10 * 60_000) },
      },
      select: { payload: true },
    });
    const corpo = m.corpo.trim();
    if (doAgente.some((a) => String((a.payload as Record<string, unknown>)?.texto ?? "").includes(corpo))) {
      return { ignorada: true, motivo: "eco do envio do agente", contactId: contato.id };
    }
  }

  const msg = await db.whatsappMessage.create({
    data: {
      contactId: contato.id,
      instanceId: instancia?.id ?? null,
      fromNumber: m.fromMe ? (instancia?.phoneNumber ?? "crm") : phone,
      toNumber: m.fromMe ? phone : (instancia?.phoneNumber || "crm"),
      body: m.corpo,
      type: m.tipo,
      direction: m.fromMe ? "outbound" : "inbound",
      status: m.fromMe ? "sent" : "delivered",
      externalId: m.externalId,
      metadata: {
        pushName: m.pushName ?? null,
        chatId: m.chatId,
        ...(m.fromMe ? { origem: "celular", fonte: m.fonte ?? null } : {}),
      } as never,
      timestamp: m.timestamp,
    },
  });

  // Guarda o arquivo (best-effort, nunca derruba a entrada): o Inbox toca/mostra pelo `midiaId`.
  const conexaoMidia = m.midia && instancia && m.sessao ? conexaoDe(instancia) : null;
  if (m.midia && conexaoMidia && m.sessao) {
    const salva = await baixarMidiaWaha(conexaoMidia, m.sessao, m.chatId, m.externalId, m.midia).catch(() => null);
    if (salva) {
      await db.whatsappMessage.update({
        where: { id: msg.id },
        data: { metadata: { ...(msg.metadata as Record<string, unknown>), midiaId: salva.id, mimetype: salva.mimetype } as never },
      });
    }
  }

  // Contato novo que escreve com o @ do Instagram (botão da página manda "(@fulano)"):
  // se o formulário dele entrou com OUTRO telefone, junta os dois num contato só.
  if (!m.fromMe && contatoCriado) {
    const handle = extrairInstagramDaMensagem(m.corpo);
    if (handle) await mesclarDuplicataPorInstagram(contato.id, handle).catch(() => null);
  }

  await registrarEvento({
    contactId: contato.id,
    eventType: "whatsapp_message",
    channel: "whatsapp",
    metadata: {
      direcao: m.fromMe ? "enviada" : "recebida",
      texto: m.corpo,
      ...(m.fromMe ? { origem: "celular" } : {}),
    },
    timestamp: m.timestamp,
  });

  // Só avisa quando o LEAD fala. Mensagem que saiu do celular é você mesmo.
  //
  // Dois caminhos: se a mensagem caiu num número NOSSO com dono (um celular
  // pessoal da equipe), o dono recebe o aviso com a FICHA do lead — é o
  // aviso que substituiu o que saía junto do disparo. Nos
  // outros números (o oficial, onde o agente de recepção atende) segue o aviso
  // antigo. Nunca os dois: dois toques pelo mesmo fato e a pessoa para de olhar.
  if (!m.fromMe) {
    try {
      const r = await avisarRespostaDeLead(contato.id, instancia?.phoneNumber, m.corpo);
      if (r.motivo === "numero sem dono") {
        await avaliarEAvisar(contato.id, m.corpo);
      }
    } catch {
      /* notificacao e conveniencia; gravar o fato e obrigacao */
    }
  }

  return {
    ignorada: false,
    contactId: contato.id,
    messageId: msg.id,
    contatoCriado,
  };
}

/**
 * STATUS de mensagem enviada (Cloud API e Kapso mandam no mesmo webhook).
 *
 * Sem isso todo envio do agente ficava "sent" pra sempre e o CRM nao sabia se a
 * mensagem chegou — que e exatamente o tipo de mentira silenciosa que ja custou
 * caro no WAHA ("armado" entregando zero). `failed` traz o motivo da Meta.
 */
export type StatusRecebido = {
  externalId: string;
  status: string; // sent | delivered | read | failed
  erro?: string;
};

export function normalizarStatus(bruto: unknown): StatusRecebido[] {
  const raiz = obj(bruto);
  const achados: Talvez[] = [];

  // Cloud API cru: entry[].changes[].value.statuses[]
  for (const e of Array.isArray(raiz.entry) ? raiz.entry : []) {
    for (const c of Array.isArray(obj(e).changes) ? (obj(e).changes as unknown[]) : []) {
      const st = obj(obj(c).value).statuses;
      if (Array.isArray(st)) achados.push(...st.map(obj));
    }
  }
  // Kapso (desembrulhado): { statuses: [...] } ou { data: { statuses: [...] } }
  for (const fonte of [raiz, obj(raiz.data)]) {
    if (Array.isArray(fonte.statuses)) achados.push(...fonte.statuses.map(obj));
    const um = obj(fonte.status);
    if (s(um.id) && s(um.status)) achados.push(um);
  }

  return achados
    .filter((x) => s(x.id) && s(x.status))
    .map((x) => {
      const err = Array.isArray(x.errors) ? obj(x.errors[0]) : {};
      return {
        externalId: s(x.id),
        status: s(x.status).toLowerCase(),
        erro: s(err.title) || s(err.message) || undefined,
      };
    });
}

/** Aplica os status no banco. Nunca rebaixa: `read` não volta pra `delivered`. */
const PESO: Record<string, number> = { sent: 1, delivered: 2, read: 3, failed: 4 };

export async function aplicarStatus(lista: StatusRecebido[]): Promise<number> {
  let aplicados = 0;
  for (const st of lista) {
    const msg = await db.whatsappMessage.findUnique({ where: { externalId: st.externalId } });
    if (!msg) continue; // status de mensagem que nao e nossa
    if ((PESO[st.status] ?? 0) <= (PESO[msg.status] ?? 0)) continue;

    const meta =
      msg.metadata && typeof msg.metadata === "object"
        ? (msg.metadata as Record<string, unknown>)
        : {};
    await db.whatsappMessage.update({
      where: { id: msg.id },
      data: {
        status: st.status,
        metadata: { ...meta, ...(st.erro ? { erro_entrega: st.erro } : {}) } as never,
      },
    });
    aplicados++;

    // Falha de entrega e a unica que merece virar evento na linha do tempo: e o
    // caso em que o CRM mostra "enviada" e o lead nunca viu nada.
    if (st.status === "failed" && msg.contactId) {
      await registrarEvento({
        contactId: msg.contactId,
        eventType: "whatsapp_message",
        channel: "whatsapp",
        metadata: { direcao: "falhou", texto: msg.body, erro: st.erro ?? "sem detalhe" },
      });
    }
  }
  return aplicados;
}
