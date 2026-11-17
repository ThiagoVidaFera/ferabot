import { createHash } from "node:crypto";

/**
 * Rastreamento Meta do lead de PÁGINA (o de WhatsApp mora em `ctwa.ts`/`capi.ts`).
 *
 * Diagnóstico de 05/11/2026: 99% dos leads de funil chegavam com UTM e 0% com
 * `fbc`. Sem o identificador do clique a Meta não casa nenhuma conversão que o
 * CRM devolva, então ela otimiza por "quem preenche formulário" e nunca por
 * "quem marca call" ou "quem compra". Este módulo é puro (sem banco) de
 * propósito: é o contrato que os testes conferem.
 */

export type CamposClique = {
  fbc?: string;
  fbp?: string;
  event_id?: string;
  ad_id?: string;
  utm_id?: string;
  placement?: string;
  client_ip?: string;
  client_ua?: string;
};

export type EventoMeta = "Lead" | "Schedule" | "QualifiedLead" | "Purchase";

export type ContatoRastreio = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  customFields: unknown;
};

export type EventoWeb = {
  event_name: EventoMeta;
  event_time: number;
  event_id: string;
  action_source: "website" | "system_generated";
  event_source_url?: string;
  user_data: Record<string, unknown>;
  custom_data?: { currency: string; value: number };
};

const LIMITE = 300;

const texto = (v: unknown): string => (v === undefined || v === null ? "" : String(v).trim().slice(0, LIMITE));

const sha = (v: string): string => createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

/** E.164 sem "+": 10–11 dígitos (DDD + número) ganham o 55. */
export function telefoneE164(telefone: string | null | undefined): string {
  const d = String(telefone ?? "").replace(/\D/g, "").replace(/^0+/, "");
  if (!d) return "";
  return d.length === 10 || d.length === 11 ? `55${d}` : d;
}

/**
 * Tira do payload da página o que liga o lead ao clique no anúncio.
 * IP/UA do corpo vencem o cabeçalho: quando a página posta por uma função
 * Netlify, o cabeçalho é o IP do servidor, não o do lead.
 */
export function extrairClique(
  d: Record<string, unknown>,
  cab: { ip?: string | null; ua?: string | null },
): CamposClique {
  const fbclid = texto(d.fbclid);
  const fbcMontado = fbclid ? `fb.1.${Number(d.fbclid_em) || Date.now()}.${fbclid}` : "";
  const bruto: CamposClique = {
    fbc: texto(d.fbc) || fbcMontado,
    fbp: texto(d.fbp),
    event_id: texto(d.event_id),
    ad_id: texto(d.ad_id),
    utm_id: texto(d.utm_id),
    placement: texto(d.placement),
    client_ip: texto(d.client_ip) || texto(cab.ip),
    client_ua: texto(d.client_user_agent) || texto(cab.ua),
  };
  return Object.fromEntries(Object.entries(bruto).filter(([, v]) => v)) as CamposClique;
}

/** Etapa do CRM que vira evento de otimização na Meta. */
export function eventoDoEstagio(estagio: string): EventoMeta | null {
  if (estagio === "call_marcada") return "Schedule";
  if (estagio === "proposta") return "QualifiedLead";
  return null;
}

function nomeSobrenome(nome: string | null): { fn?: string; ln?: string } {
  const partes = String(nome ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (!partes.length) return {};
  return { fn: partes[0], ln: partes.length > 1 ? partes[partes.length - 1] : undefined };
}

export function montarEventoWeb(p: {
  evento: EventoMeta;
  contato: ContatoRastreio;
  agoraSeg: number;
  eventId: string;
  valorCentavos?: number;
  moeda?: string;
  actionSource?: "website" | "system_generated";
  /** IP/UA do momento do formulário. Não ficam gravados no contato (LGPD). */
  cliente?: { ip?: string; ua?: string };
}): EventoWeb {
  const cf = (p.contato.customFields && typeof p.contato.customFields === "object"
    ? p.contato.customFields
    : {}) as Record<string, unknown>;

  const ud: Record<string, unknown> = { external_id: [sha(p.contato.id)] };
  const email = texto(p.contato.email);
  if (email) ud.em = [sha(email)];
  const fone = telefoneE164(p.contato.phone);
  if (fone) ud.ph = [sha(fone)];
  const { fn, ln } = nomeSobrenome(p.contato.name);
  // Nome igual ao telefone (lead de WhatsApp sem nome) não é nome.
  if (fn && !/^\d+$/.test(String(p.contato.name))) ud.fn = [sha(fn)];
  if (ln) ud.ln = [sha(ln)];
  // fbc/fbp vão crus: são identificadores da própria Meta, não dado pessoal.
  if (texto(cf.fbc)) ud.fbc = texto(cf.fbc);
  if (texto(cf.fbp)) ud.fbp = texto(cf.fbp);
  if (texto(p.cliente?.ip)) ud.client_ip_address = texto(p.cliente?.ip);
  if (texto(p.cliente?.ua)) ud.client_user_agent = texto(p.cliente?.ua);

  const ev: EventoWeb = {
    event_name: p.evento,
    event_time: p.agoraSeg,
    event_id: p.eventId,
    action_source: p.actionSource ?? "system_generated",
    user_data: ud,
  };
  if (ev.action_source === "website" && texto(cf.origem_url)) ev.event_source_url = texto(cf.origem_url);
  if (p.valorCentavos !== undefined) {
    ev.custom_data = { currency: p.moeda ?? "BRL", value: p.valorCentavos / 100 };
  }
  return ev;
}

/** Só vale mandar evento web de quem tem algum elo com o clique ou com a pessoa. */
export function temSinalWeb(customFields: unknown): boolean {
  const cf = (customFields && typeof customFields === "object" ? customFields : {}) as Record<string, unknown>;
  // fbp sozinho não conta: todo visitante da página tem, inclusive o orgânico.
  return Boolean(texto(cf.fbc) || texto(cf.utm_source) === "meta" || texto(cf.ad_id));
}

/** Lead de WhatsApp já é atribuído pelo `capi.ts` — o caminho web pula pra não contar em dobro. */
export function temCliqueWhatsapp(customFields: unknown): boolean {
  const cf = (customFields && typeof customFields === "object" ? customFields : {}) as Record<string, unknown>;
  return Boolean(texto(cf.ctwa_clid));
}

/**
 * Funil de cliente com pixel e CAPI próprios (ex.: um cliente seu) — o CRM recebe o lead, mas o evento
 * não pode sair no pixel FERA. Lista em Setting `capi_web_origens_fora`, separada por vírgula.
 */
export function origemComPixelProprio(origem: string | null | undefined, lista: string): boolean {
  if (!origem) return false;
  return lista.split(",").map((s) => s.trim()).filter(Boolean).includes(origem);
}
