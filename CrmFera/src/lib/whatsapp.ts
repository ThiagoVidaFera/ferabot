import { db } from "@/lib/db";

/**
 * Adapter de WhatsApp.
 *
 * O megaprompt fecha em Evolution API (Baileys). Aqui o provider padrao e o
 * WAHA, que ja roda na VPS com as regras anti-ban — DESVIO AUTORIZADO, ver
 * CLAUDE.md. Os CONTRATOS sao os mesmos do doc (enviar texto, enviar pra grupo,
 * listar grupos, configurar webhook, QR, status), so muda o caminho HTTP.
 */

export type ProviderWhats = "waha" | "cloud_api" | "evolution";

export type Conexao = {
  provider: ProviderWhats;
  baseUrl: string;
  apiKey: string;
  sessao: string;
  instanceId?: string;
};

export type ResultadoEnvio = {
  ok: boolean;
  externalId?: string;
  erro?: string;
};

/** Monta a conexao a partir de UMA instancia do banco. */
export function conexaoDe(inst: {
  id: string;
  provider: string;
  evolutionApiUrl: string | null;
  evolutionApiKey: string | null;
  instanceName: string | null;
}): Conexao | null {
  if (!inst.evolutionApiUrl) return null;
  return {
    provider: (inst.provider as ProviderWhats) ?? "waha",
    baseUrl: inst.evolutionApiUrl.replace(/\/+$/, ""),
    apiKey: inst.evolutionApiKey ?? "",
    sessao: inst.instanceName || "default",
    instanceId: inst.id,
  };
}

/** Conexao de uma instancia especifica, por id. */
export async function conexaoPorId(instanceId: string): Promise<Conexao | null> {
  const inst = await db.whatsappInstance.findUnique({ where: { id: instanceId } });
  return inst ? conexaoDe(inst) : null;
}

/** Todas as instancias configuradas (numeros que o CRM opera). */
export async function instancias() {
  return db.whatsappInstance.findMany({
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
}

export async function conexaoPadrao(): Promise<Conexao | null> {
  const inst = await db.whatsappInstance.findFirst({
    where: { isDefault: true },
    orderBy: { createdAt: "desc" },
  });
  if (inst?.evolutionApiUrl) {
    return {
      provider: (inst.provider as ProviderWhats) ?? "waha",
      baseUrl: inst.evolutionApiUrl.replace(/\/+$/, ""),
      apiKey: inst.evolutionApiKey ?? "",
      sessao: inst.instanceName || "default",
      instanceId: inst.id,
    };
  }
  // Semente pelo .env enquanto a instancia nao foi criada na tela.
  const url = process.env.WAHA_URL;
  if (!url) return null;
  return {
    provider: "waha",
    baseUrl: url.replace(/\/+$/, ""),
    apiKey: process.env.WAHA_APIKEY ?? "",
    sessao: process.env.WAHA_SESSION || "default",
  };
}

function cabecalhos(c: Conexao): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (!c.apiKey) return h;
  // O Cloud API e Bearer puro; mandar X-Api-Key junto faz a Graph recusar.
  if (c.provider === "cloud_api") {
    // Graph direta autentica por Bearer; a Kapso faz proxy do MESMO contrato da
    // Cloud API mas autentica por X-API-Key — e RECUSA (401 "Invalid
    // credentials") se o Authorization vier junto. Testado 2026-08-18: mandar
    // os dois quebra. Por isso a escolha e exclusiva, pelo host.
    if (/(^|\.)kapso\.ai/i.test(new URL(c.baseUrl).hostname)) {
      h["X-API-Key"] = c.apiKey;
    } else {
      h["Authorization"] = `Bearer ${c.apiKey}`;
    }
    return h;
  }
  // WAHA usa X-Api-Key; a Evolution usa apikey. Mandar os dois nao quebra nenhum.
  h["X-Api-Key"] = c.apiKey;
  h["apikey"] = c.apiKey;
  return h;
}

/** chatId do WAHA: 5511999999999@c.us (1x1) ou <id>@g.us (grupo). */
export function chatId(numeroOuGrupo: string): string {
  if (numeroOuGrupo.includes("@")) return numeroOuGrupo;
  return numeroOuGrupo.replace(/\D/g, "") + "@c.us";
}

export type DestinoResolvido = { chatId: string; temWhatsapp: boolean };

/**
 * chatId REAL do numero no WhatsApp (WAHA `check-exists`). Conta antiga nao tem o 9
 * depois do DDD: mandar pra 5511988887777 quando o WhatsApp e 551188887777 deixa a
 * mensagem em ack PENDING pra sempre, sem erro (achado 29/10/2026). Se a consulta
 * falhar, cai no chatId montado — nao bloqueia o envio.
 */
export async function resolverDestino(c: Conexao, numero: string): Promise<DestinoResolvido> {
  const montado = { chatId: chatId(numero), temWhatsapp: true };
  if (c.provider !== "waha") return montado;
  try {
    const fone = numero.replace(/\D/g, "");
    const r = await chamar(
      c,
      `/api/contacts/check-exists?phone=${encodeURIComponent(fone)}&session=${encodeURIComponent(c.sessao)}`,
      { method: "GET" },
    );
    if (!r.ok) return montado;
    const j = (await r.json().catch(() => ({}))) as { numberExists?: boolean; chatId?: string };
    if (j.numberExists === false) return { chatId: montado.chatId, temWhatsapp: false };
    return { chatId: j.chatId || montado.chatId, temWhatsapp: true };
  } catch {
    return montado;
  }
}

async function chamar(c: Conexao, caminho: string, init: RequestInit, timeoutMs = 20000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(c.baseUrl + caminho, {
      ...init,
      headers: { ...cabecalhos(c), ...(init.headers ?? {}) },
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(t);
  }
}

/** Envia texto 1x1 ou para grupo (mesmo endpoint, muda o chatId). */
export async function enviarTexto(
  c: Conexao,
  destino: string,
  texto: string,
): Promise<ResultadoEnvio> {
  try {
    if (c.provider === "waha") {
      const r = await chamar(c, "/api/sendText", {
        method: "POST",
        body: JSON.stringify({ session: c.sessao, chatId: chatId(destino), text: texto }),
      });
      if (!r.ok) return { ok: false, erro: `HTTP ${r.status}: ${(await r.text()).slice(0, 200)}` };
      const j = (await r.json().catch(() => ({}))) as { id?: unknown; _data?: { id?: unknown } };
      const id = j?.id ?? (j?._data as { id?: unknown })?.id;
      return { ok: true, externalId: id ? String(id) : undefined };
    }

    if (c.provider === "cloud_api") {
      // Canal OFICIAL (WABA). `sessao` = phone_number_id, `baseUrl` = Graph.
      // So entrega texto livre DENTRO da janela de 24h; fora dela e template
      // (enviarTemplate) — mandar texto fora da janela volta erro 131047.
      const r = await chamar(c, `/${c.sessao}/messages`, {
        method: "POST",
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: destino.replace(/\D/g, ""),
          type: "text",
          text: { preview_url: true, body: texto },
        }),
      });
      const j = (await r.json().catch(() => ({}))) as {
        messages?: Array<{ id?: string }>;
        error?: { message?: string; code?: number };
      };
      if (!r.ok) {
        const cod = j?.error?.code ? ` (${j.error.code})` : "";
        return { ok: false, erro: `Cloud API${cod}: ${j?.error?.message ?? `HTTP ${r.status}`}` };
      }
      return { ok: true, externalId: j?.messages?.[0]?.id };
    }

    if (c.provider === "evolution") {
      // Mantido por paridade com o megaprompt. Nao usamos — ver CLAUDE.md.
      const r = await chamar(c, `/message/sendText/${c.sessao}`, {
        method: "POST",
        body: JSON.stringify({ number: destino.replace(/\D/g, ""), text: texto }),
      });
      if (!r.ok) return { ok: false, erro: `HTTP ${r.status}` };
      const j = (await r.json().catch(() => ({}))) as { key?: { id?: string } };
      return { ok: true, externalId: j?.key?.id };
    }

    return { ok: false, erro: `provider ${c.provider} ainda nao implementado` };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Envia TEMPLATE aprovado (Cloud API). E o unico caminho legal pra falar com
 * quem nao escreve ha mais de 24h — a razao de existir do numero oficial.
 * `variaveis` preenche {{1}}, {{2}}... do corpo, na ordem.
 */
export async function enviarTemplate(
  c: Conexao,
  destino: string,
  template: string,
  variaveis: string[] = [],
  idioma = "pt_BR",
): Promise<ResultadoEnvio> {
  if (c.provider !== "cloud_api") {
    return { ok: false, erro: `provider ${c.provider} nao envia template` };
  }
  try {
    const componentes = variaveis.length
      ? [{ type: "body", parameters: variaveis.map((v) => ({ type: "text", text: v })) }]
      : [];
    const r = await chamar(c, `/${c.sessao}/messages`, {
      method: "POST",
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: destino.replace(/\D/g, ""),
        type: "template",
        template: { name: template, language: { code: idioma }, components: componentes },
      }),
    });
    const j = (await r.json().catch(() => ({}))) as {
      messages?: Array<{ id?: string }>;
      error?: { message?: string; code?: number };
    };
    if (!r.ok) {
      const cod = j?.error?.code ? ` (${j.error.code})` : "";
      return { ok: false, erro: `Cloud API${cod}: ${j?.error?.message ?? `HTTP ${r.status}`}` };
    }
    return { ok: true, externalId: j?.messages?.[0]?.id };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : String(e) };
  }
}

export type Midia = {
  /** o que o WhatsApp mostra: imagem, áudio de voz ou arquivo */
  tipo: "image" | "voice" | "file" | "video";
  mimetype: string;
  filename?: string;
  /** conteúdo em base64 puro (sem o prefixo data:) */
  base64: string;
  legenda?: string;
};

/**
 * Envia mídia. O WAHA recebe o arquivo embutido em base64 — não precisa de URL
 * pública, o que evita expor os arquivos do CRM na internet só pra mandar foto.
 */
export async function enviarMidia(
  c: Conexao,
  destino: string,
  m: Midia,
): Promise<ResultadoEnvio> {
  if (c.provider !== "waha") {
    return { ok: false, erro: `envio de mídia não implementado para ${c.provider}` };
  }

  const rota =
    m.tipo === "image"
      ? "/api/sendImage"
      : m.tipo === "voice"
        ? "/api/sendVoice"
        : m.tipo === "video"
          ? "/api/sendVideo"
          : "/api/sendFile";

  const corpo: Record<string, unknown> = {
    session: c.sessao,
    chatId: chatId(destino),
    file: {
      mimetype: m.mimetype,
      filename: m.filename ?? "arquivo",
      data: m.base64,
    },
  };
  // Áudio de voz precisa virar ogg/opus pro WhatsApp tratar como PTT; o WAHA
  // converte se pedirmos. Sem isso vira "documento de áudio" no aparelho.
  if (m.tipo === "voice") corpo.convert = true;
  if (m.legenda) corpo.caption = m.legenda;

  try {
    // vídeo de alguns MB em base64: o prazo padrão de 20s não basta
    const r = await chamar(c, rota, { method: "POST", body: JSON.stringify(corpo) }, 120000);
    if (!r.ok) {
      return { ok: false, erro: `HTTP ${r.status}: ${(await r.text()).slice(0, 220)}` };
    }
    const j = (await r.json().catch(() => ({}))) as { id?: unknown; _data?: { id?: unknown } };
    const id = j?.id ?? (j?._data as { id?: unknown })?.id;
    return { ok: true, externalId: id ? String(id) : undefined };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : String(e) };
  }
}

export type GrupoRemoto = { externalId: string; name: string };

export async function listarGrupos(c: Conexao): Promise<GrupoRemoto[]> {
  if (c.provider === "waha") {
    const r = await chamar(c, `/api/${encodeURIComponent(c.sessao)}/groups`, { method: "GET" });
    if (!r.ok) throw new Error(`HTTP ${r.status} ao listar grupos`);
    const j = (await r.json()) as Array<{ id?: unknown; name?: string; subject?: string }>;
    return (Array.isArray(j) ? j : []).map((g) => {
      const id =
        typeof g.id === "string"
          ? g.id
          : ((g.id as { _serialized?: string })?._serialized ?? String(g.id));
      return { externalId: id, name: g.name ?? g.subject ?? id };
    });
  }
  if (c.provider === "evolution") {
    const r = await chamar(c, `/group/fetchAllGroups/${c.sessao}?getParticipants=false`, {
      method: "GET",
    });
    if (!r.ok) throw new Error(`HTTP ${r.status} ao listar grupos`);
    const j = (await r.json()) as Array<{ id: string; subject: string }>;
    return j.map((g) => ({ externalId: g.id, name: g.subject }));
  }
  throw new Error(`provider ${c.provider} nao lista grupos`);
}

export type EstadoSessao = {
  status: "desconectado" | "conectando" | "conectado";
  qr?: string;
  cru?: string;
  /** numero que a sessao esta logada, quando o provider informa */
  telefone?: string | null;
};


export async function estadoSessao(c: Conexao): Promise<EstadoSessao> {
  try {
    if (c.provider === "waha") {
      const r = await chamar(c, `/api/sessions/${encodeURIComponent(c.sessao)}`, { method: "GET" });
      if (!r.ok) return { status: "desconectado", cru: `HTTP ${r.status}` };
      const j = (await r.json()) as { status?: string; me?: { id?: string } | null };
      const s = (j.status ?? "").toUpperCase();
      const telefone = j.me?.id ? j.me.id.replace(/@.*$/, "") : null;
      if (s === "WORKING") return { status: "conectado", cru: s, telefone };
      if (s === "SCAN_QR_CODE" || s === "STARTING") return { status: "conectando", cru: s, telefone };
      return { status: "desconectado", cru: s, telefone };
    }
    if (c.provider === "cloud_api") {
      // Numero oficial nao tem sessao pra cair. "Conectado" = a Graph responde
      // pelo phone_number_id e a qualidade nao esta FLAGGED/RESTRICTED.
      const r = await chamar(
        c,
        `/${c.sessao}?fields=display_phone_number,verified_name,quality_rating,throughput`,
        { method: "GET" },
      );
      if (!r.ok) return { status: "desconectado", cru: `HTTP ${r.status}` };
      const j = (await r.json()) as { quality_rating?: string; display_phone_number?: string };
      const q = (j.quality_rating ?? "").toUpperCase();
      const cru = `${j.display_phone_number ?? ""} ${q}`.trim();
      if (q === "RED" || q === "FLAGGED") return { status: "conectando", cru };
      return { status: "conectado", cru };
    }
    if (c.provider === "evolution") {
      const r = await chamar(c, `/instance/connectionState/${c.sessao}`, { method: "GET" });
      const j = (await r.json()) as { instance?: { state?: string } };
      const s = j?.instance?.state ?? "";
      return { status: s === "open" ? "conectado" : "conectando", cru: s };
    }
    return { status: "desconectado" };
  } catch (e) {
    return { status: "desconectado", cru: e instanceof Error ? e.message : String(e) };
  }
}

/** QR em data URL, para exibir na tela de Configuracoes. */
export async function qrCode(c: Conexao): Promise<string | null> {
  try {
    if (c.provider === "waha") {
      const r = await chamar(c, `/api/${encodeURIComponent(c.sessao)}/auth/qr?format=image`, {
        method: "GET",
      });
      if (!r.ok) return null;
      const buf = Buffer.from(await r.arrayBuffer());
      return "data:image/png;base64," + buf.toString("base64");
    }
    if (c.provider === "evolution") {
      const r = await chamar(c, `/instance/connect/${c.sessao}`, { method: "GET" });
      const j = (await r.json()) as { base64?: string };
      return j?.base64 ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

/** Pausa curta — o WAHA leva alguns segundos entre STARTING e SCAN_QR_CODE. */
function esperar(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

type SessaoWaha = {
  existe: boolean;
  status: string;
  webhooks: string[];
};

export async function lerSessaoWaha(c: Conexao): Promise<SessaoWaha> {
  const r = await chamar(c, `/api/sessions/${encodeURIComponent(c.sessao)}`, { method: "GET" });
  if (r.status === 404) return { existe: false, status: "", webhooks: [] };
  if (!r.ok) return { existe: false, status: `HTTP ${r.status}`, webhooks: [] };
  const j = (await r.json().catch(() => ({}))) as {
    status?: string;
    config?: { webhooks?: Array<{ url?: string }> };
  };
  return {
    existe: true,
    status: (j.status ?? "").toUpperCase(),
    webhooks: (j.config?.webhooks ?? []).map((w) => w.url ?? "").filter(Boolean),
  };
}

export type SessaoListada = { name: string; status: string; me: { id?: string } | null };

/** Todas as sessoes do servidor WAHA (inclusive as paradas) — pro vigia. */
export async function listarSessoesWaha(c: Conexao): Promise<SessaoListada[]> {
  const r = await chamar(c, "/api/sessions?all=true", { method: "GET" });
  if (!r.ok) throw new Error(`WAHA /api/sessions HTTP ${r.status}`);
  const j = (await r.json()) as unknown;
  return Array.isArray(j) ? (j as SessaoListada[]) : [];
}

function acaoSessao(c: Conexao, acao: "start" | "stop" | "restart" | "logout") {
  return chamar(c, `/api/sessions/${encodeURIComponent(c.sessao)}/${acao}`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

/**
 * O WAHA valida a URL do webhook com `isURL(require_tld)`: hostname SEM ponto
 * (`crm_fera`, `localhost`) e recusado com 400. Mandar uma dessas nao so falha
 * como fazia o Conectar desistir no meio do caminho — ver iniciarSessao.
 */
function webhookAceitavel(url: string): boolean {
  if (!url) return false;
  try {
    const h = new URL(url);
    if (h.protocol !== "http:" && h.protocol !== "https:") return false;
    return h.hostname.includes(".") && !/^[\d.]+$/.test(h.hostname);
  } catch {
    return false;
  }
}

/** Config de sessao do WAHA. `message.any` cobre entrada E eco do que sai. */
/** Acrescenta `?token=` (WEBHOOK_TOKEN) à URL do webhook: o CRM recusa entrada sem ele. */
export function comTokenDoWebhook(url: string): string {
  const token = process.env.WEBHOOK_TOKEN;
  if (!url || !token) return url;
  const u = new URL(url);
  u.searchParams.set("token", token);
  return u.toString();
}

function configWaha(urlWebhook: string) {
  return {
    webhooks: urlWebhook ? [{ url: comTokenDoWebhook(urlWebhook), events: ["message.any"] }] : [],
    noweb: { markOnline: true, store: { enabled: true, fullSync: true } },
  };
}

/**
 * Garante que a sessao existe, tem o webhook certo e esta RODANDO.
 *
 * Tres caminhos, porque o WAHA trata cada um diferente:
 *  - nao existe  -> POST /api/sessions {start:true}
 *  - existe e caiu (FAILED/STOPPED) -> POST /api/sessions/<s>/restart
 *  - existe e roda -> so atualiza o webhook se ele mudou (PUT reinicia a sessao,
 *    entao nao se toca numa sessao WORKING a toa)
 */
export async function iniciarSessao(c: Conexao, urlWebhook: string): Promise<boolean> {
  try {
    if (c.provider === "waha") {
      const atual = await lerSessaoWaha(c);
      // URL que o WAHA nao aceita nao vira config nenhuma: sem isso o PUT abaixo
      // levava 400 e a sessao ficava sem religar.
      const webhook = webhookAceitavel(urlWebhook) ? urlWebhook : "";

      if (!atual.existe) {
        const r = await chamar(c, "/api/sessions", {
          method: "POST",
          body: JSON.stringify({ name: c.sessao, start: true, config: configWaha(webhook) }),
        });
        return r.ok || r.status === 422;
      }

      const webhookOk =
        !webhook || atual.webhooks.some((u) => u.split("?")[0] === webhook.split("?")[0]);
      if (!webhookOk) {
        const put = await chamar(c, `/api/sessions/${encodeURIComponent(c.sessao)}`, {
          method: "PUT",
          body: JSON.stringify({ config: configWaha(webhook) }),
        });
        // So o PUT ACEITO reinicia a sessao — e ai nao se reinicia duas vezes.
        // Se ele for recusado, seguir em frente: era exatamente aqui que a
        // sessao FAILED morria sem nunca receber restart, e o QR nunca vinha.
        if (put.ok) return true;
      }

      if (atual.status === "STOPPED") {
        const r = await acaoSessao(c, "start");
        return r.ok;
      }

      if (atual.status === "FAILED") {
        // 1ª tentativa: reiniciar. Resolve queda transitoria sem obrigar a
        // reler o QR.
        await acaoSessao(c, "restart");
        await esperar(4000);
        const depois = await lerSessaoWaha(c);
        if (depois.status !== "FAILED") return true;

        // Ainda FAILED significa credencial gravada invalida: o WAHA tenta
        // LOGAR com ela ("logging in... username 55…"), o WhatsApp recusa com
        // "Connection Failure" e a sessao morre sem NUNCA pedir QR. So o
        // logout limpa a credencial — e ai o start volta pro SCAN_QR_CODE.
        await acaoSessao(c, "logout");
        await esperar(1500);
        const r = await acaoSessao(c, "start");
        await esperar(3000);
        const depoisLogout = await lerSessaoWaha(c);
        if (depoisLogout.status !== "FAILED") return r.ok;

        // Ultimo recurso: sessao NOWEB que ficou ociosa em SCAN_QR_CODE entra
        // num loop STARTING->FAILED do qual nem restart nem logout tiram. So
        // apagar e recriar do zero volta pro SCAN_QR_CODE (medido 2026-07-20).
        await chamar(c, `/api/sessions/${encodeURIComponent(c.sessao)}`, { method: "DELETE" });
        await esperar(1500);
        const novo = await chamar(c, "/api/sessions", {
          method: "POST",
          body: JSON.stringify({ name: c.sessao, start: true, config: configWaha(urlWebhook) }),
        });
        return novo.ok || novo.status === 422;
      }

      return true;
    }
    if (c.provider === "evolution") {
      const r = await chamar(c, "/instance/create", {
        method: "POST",
        body: JSON.stringify({
          instanceName: c.sessao,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
        }),
      });
      return r.ok;
    }
    return false;
  } catch {
    return false;
  }
}

/** Encerra a sessao no provider (usado ao remover o numero do CRM). */
export async function apagarSessao(c: Conexao): Promise<boolean> {
  try {
    if (c.provider !== "waha") return false;
    const r = await chamar(c, `/api/sessions/${encodeURIComponent(c.sessao)}`, {
      method: "DELETE",
    });
    return r.ok || r.status === 404;
  } catch {
    return false;
  }
}

/**
 * Estado + QR com espera.
 *
 * Logo depois de criar/reiniciar, a sessao passa por STARTING, e nesse estado o
 * endpoint de QR responde erro. Sem essa espera a tela mostrava "conectando"
 * sem imagem nenhuma e o usuario ficava clicando no botao.
 */
export async function estadoComQr(
  c: Conexao,
  tentativas = 6,
  intervaloMs = 1500,
): Promise<EstadoSessao> {
  let ultimo: EstadoSessao = { status: "desconectado" };
  for (let i = 0; i < tentativas; i++) {
    ultimo = await estadoSessao(c);
    if (ultimo.status === "conectado") return ultimo;
    if (ultimo.cru === "SCAN_QR_CODE" || c.provider !== "waha") {
      const qr = await qrCode(c);
      if (qr) return { ...ultimo, qr };
    }
    if (i < tentativas - 1) await esperar(intervaloMs);
  }
  return ultimo;
}

/**
 * Intervalo anti-bloqueio entre mensagens 1x1.
 *
 * O megaprompt fixa 5-12s. Aqui a faixa é CONFIGURÁVEL porque a régua depende
 * do número: chip aquecido de disparo aguenta segundos; número principal de
 * quem atende cliente precisa de ritmo humano — dezenas de minutos. O sorteio
 * dentro da faixa evita o padrão regular, que é o que denuncia robô.
 */
export function intervaloAntiBloqueio(minMs = 5000, maxMs = 12000): number {
  const min = Math.max(1000, minMs);
  const max = Math.max(min + 1000, maxMs);
  return min + Math.floor(Math.random() * (max - min));
}
