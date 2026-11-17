import { db } from "@/lib/db";
import { config } from "@/lib/config";
import { conexaoDe, type Conexao } from "@/lib/whatsapp";

/**
 * NÚMERO ÚNICO POR ORIGEM (opcional, desligado por padrão).
 *
 * Quando um funil precisa falar SEMPRE pelo mesmo WhatsApp (ex.: o lead do funil X só recebe
 * mensagem do número comercial), configure `numero_unico_json` (tela de Configurações ou env
 * `NUMERO_UNICO_JSON`):
 *
 *   { "sessao": "comercial", "marcas": ["funil x", "outro funil"], "aviso": "Responda pelo número comercial" }
 *
 * `marcas` casa com a origem do contato normalizada (sem acento, minúscula, `funil:` e hífens fora).
 * Sem configuração: um número só, nenhuma trava.
 */

export type RegraNumeroUnico = { sessao: string; marcas: string[]; aviso: string };

const AVISO_PADRAO = "Este lead só fala pelo número comercial";

function ler(json: string | undefined | null): RegraNumeroUnico | null {
  if (!json) return null;
  try {
    const r = JSON.parse(json) as Partial<RegraNumeroUnico>;
    if (!r.sessao || !Array.isArray(r.marcas) || !r.marcas.length) return null;
    return { sessao: r.sessao, marcas: r.marcas.map((m) => normalizar(m)), aviso: r.aviso || AVISO_PADRAO };
  } catch (erro) {
    console.error("[numero-unico] numero_unico_json inválido, regra desligada:", erro);
    return null;
  }
}

let regra: RegraNumeroUnico | null = ler(process.env.NUMERO_UNICO_JSON);

/** Relê a regra do Setting (boot e antes de envio). */
export async function recarregarNumeroUnico(): Promise<RegraNumeroUnico | null> {
  regra = ler(await config("numero_unico_json", "NUMERO_UNICO_JSON"));
  return regra;
}

/** Só para testes. */
export function _definirNumeroUnico(r: RegraNumeroUnico | null): void {
  regra = r ? { ...r, marcas: r.marcas.map((m) => normalizar(m)) } : null;
}

function normalizar(origem: string | null | undefined): string {
  return (origem ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace("funil:", "")
    .replace(/[-_]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
}

/** Sessão do número único (vazio quando a regra está desligada). */
export function sessaoNumeroUnico(): string {
  return regra?.sessao ?? "";
}

/** O lead desta origem só pode receber mensagem do número único? */
export function exigeNumeroUnico(origem: string | null | undefined): boolean {
  if (!regra) return false;
  const o = normalizar(origem);
  return regra.marcas.some((m) => o.includes(m));
}

/** Esta sessão pode falar com este lead? */
export function sessaoPermitida(origem: string | null | undefined, sessao: string | null | undefined): boolean {
  return !exigeNumeroUnico(origem) || sessao === sessaoNumeroUnico();
}

/** Texto do aviso do Inbox, ou null quando não há o que avisar. */
export function avisoNumeroUnico(origem: string | null | undefined, sessaoQueResponde: string | null | undefined): string | null {
  return sessaoPermitida(origem, sessaoQueResponde) ? null : regra?.aviso ?? AVISO_PADRAO;
}

/** Conexão do número único, se ele estiver cadastrado no CRM. */
export async function conexaoDoNumeroUnico(): Promise<Conexao | null> {
  const sessao = sessaoNumeroUnico();
  if (!sessao) return null;
  const inst = await db.whatsappInstance.findFirst({ where: { instanceName: sessao } });
  return inst ? conexaoDe(inst) : null;
}
