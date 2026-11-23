/**
 * Painel hospedado: o painel do cliente da consultoria roda na VPS do mentor e o
 * WhatsApp roda numa VPS do próprio cliente. Nesse modo a tela de Configurações é
 * a do cliente e o endereço do servidor do WhatsApp tem que ser público.
 */
export function painelHospedado(): boolean {
  return process.env.PAINEL_HOSPEDADO === "1";
}

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;
const IPV4_PRIVADO = [/^10\./, /^127\./, /^0\./, /^169\.254\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./];
const NOMES_INTERNOS = /(^localhost$|\.local$|\.internal$|\.lan$|\.home$)/i;

/**
 * Endereço do servidor de WhatsApp do cliente. Devolve o motivo da recusa, ou null se serve.
 * Só HTTPS e só endereço público: o painel chama esse endereço com a chave do WhatsApp,
 * então endereço interno ou sem criptografia ficam de fora.
 */
export function motivoServidorRecusado(bruto: string): string | null {
  let url: URL;
  try {
    url = new URL(bruto.trim());
  } catch {
    return "Endereço inválido. Cole o endereço completo, começando com https://";
  }
  if (url.protocol !== "https:") return "O endereço do servidor precisa começar com https://";
  if (url.username || url.password) return "Tire usuário e senha do endereço. A chave vai no campo próprio.";
  const host = url.hostname.toLowerCase();
  if (host.startsWith("[")) return "Use o nome do servidor, não um endereço IPv6.";
  if (NOMES_INTERNOS.test(host) || !host.includes(".")) return "Esse endereço é interno. Use o endereço público do seu servidor.";
  if (IPV4.test(host) && IPV4_PRIVADO.some((faixa) => faixa.test(host))) {
    return "Esse IP é de rede interna. Use o endereço público do seu servidor.";
  }
  return null;
}

export function normalizarServidor(bruto: string): string {
  const url = new URL(bruto.trim());
  return `${url.protocol}//${url.host}${url.pathname}`.replace(/\/+$/, "");
}

/**
 * Senha de entrada combinada para os painéis de cliente (vem do ambiente, nunca do código, porque o
 * repositório é público). Entrou com ela: o painel obriga a trocar. Vazia = regra desligada.
 */
export const SENHA_INICIAL = process.env.PAINEL_SENHA_INICIAL ?? "";

/**
 * Quem monta a parte técnica (chaves, página, WhatsApp, anúncio) deste painel:
 * - "equipe": a equipe do Thiago (Estrutura Digital / "Eu coloco no ar"). O cliente só cuida do conteúdo.
 * - "autoexecutavel" (padrão): o cliente, com o FERABOT conduzindo.
 */
export type NivelDoPainel = "autoexecutavel" | "equipe";

export function nivelDoPainel(): NivelDoPainel {
  return process.env.PAINEL_NIVEL === "equipe" ? "equipe" : "autoexecutavel";
}

/** WhatsApp de quem dá suporte ao cliente (só dígitos, com 55). Vazio = sem botão de ajuda. */
export function whatsappDoSuporte(): string {
  return (process.env.PAINEL_SUPORTE_WHATSAPP ?? "").replace(/\D/g, "");
}
