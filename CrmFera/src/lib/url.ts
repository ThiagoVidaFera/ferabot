import type { NextRequest } from "next/server";

export function publicUrl(req: NextRequest, path: string): URL {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return new URL(path, proto + "://" + host);
}

/** true quando o request chegou por https (direto ou via proxy). */
export function ehHttps(req: NextRequest): boolean {
  return publicUrl(req, "/").protocol === "https:";
}

/**
 * Endereço público do CRM para links em avisos de WhatsApp ("Abrir: ..."). Vem de `CRM_URL_PUBLICA`
 * (ex.: https://crm.seudominio.com.br); sem ela, o CRM local na porta padrão.
 */
export function urlDoCrm(caminho = ""): string {
  const base = (process.env.CRM_URL_PUBLICA || `http://localhost:${process.env.CRM_PORTA || "3900"}`).replace(/\/+$/, "");
  return caminho ? `${base}/${caminho.replace(/^\/+/, "")}` : base;
}

/**
 * Webhook que o WAHA chama. Com CRM e WAHA no mesmo docker-compose, o WAHA alcança o CRM pelo
 * apelido de rede `crm.fera.local` (o WAHA recusa hostname sem ponto, como `crm` ou `localhost`).
 * Com WAHA em outra máquina, configure `webhook_url_publica` na tela ou `WEBHOOK_URL_PUBLICA`.
 */
export function urlDoWebhookPadrao(): string {
  return process.env.WEBHOOK_URL_PUBLICA || "http://crm.fera.local:3900/api/webhooks/evolution";
}
