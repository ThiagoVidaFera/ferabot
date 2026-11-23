import { headers } from "next/headers";
import { tokenDoFerabot } from "@/lib/jornada-estado";
import type { PassoJornada } from "@/lib/jornada";
import { promptCompleto } from "@/lib/prompts-jornada";

/** Endereço público deste painel, como o navegador do dono o enxerga. */
export async function enderecoDoPainel(): Promise<string> {
  if (process.env.PAINEL_URL) return process.env.PAINEL_URL.replace(/\/+$/, "");
  const cabecalhos = await headers();
  const host = cabecalhos.get("x-forwarded-host") ?? cabecalhos.get("host") ?? "localhost:3900";
  const protocolo = cabecalhos.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocolo}://${host}`;
}

/**
 * O prompt de cada passo. O do passo 1 leva o endereço e o código de ligação, porque é
 * com ele que o FERABOT do computador aprende onde fica o painel.
 */
export async function promptDoPasso(passo: PassoJornada): Promise<string> {
  if (!passo.prompt) return "";
  if (passo.id !== "chaves") return promptCompleto(passo.id);
  const [endereco, token] = await Promise.all([enderecoDoPainel(), tokenDoFerabot()]);
  return promptCompleto("chaves", endereco, token);
}
