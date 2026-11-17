import { db } from "@/lib/db";
import { avisar } from "@/lib/notificacao";
import { config } from "@/lib/config";
import { urlDoWebhookPadrao } from "@/lib/url";
import { conexaoDe, listarSessoesWaha, lerSessaoWaha, type Conexao, type SessaoListada } from "@/lib/whatsapp";

/**
 * VIGIA DE NUMERO CAIDO (28/10/2026).
 *
 * Um WhatsApp conectado caiu (`device_removed`) e ficou 2 dias
 * fora sem ninguem saber: o WAHA marca FAILED e nao reconecta sozinho, e lead
 * que escreve nesse meio-tempo nao entra no CRM. Agora, a cada rodada do cron
 * de agentes (5 min), toda sessao que JA FOI PAREADA e nao esta WORKING gera
 * um aviso — uma vez por dia por sessao, ate alguem religar.
 *
 * Sessao nunca pareada (sem `me`, ex.: as dc-* criadas e abandonadas) fica de
 * fora: avisar todo dia de numero que nunca existiu e ruido.
 */

export type SessaoCaida = { name: string; status: string; numero: string };

export function sessoesCaidas(lista: SessaoListada[]): SessaoCaida[] {
  return lista
    .filter((s) => s.me?.id && String(s.status).toUpperCase() !== "WORKING")
    .map((s) => ({ name: s.name, status: String(s.status).toUpperCase(), numero: s.me!.id!.replace(/@.*$/, "") }));
}

/** 5511988887777 -> (11) 98888-7777 */
function telefoneLegivel(n: string): string {
  const so = n.replace(/\D/g, "").replace(/^55/, "");
  if (so.length < 10) return n;
  const ddd = so.slice(0, 2);
  const resto = so.slice(2);
  return `(${ddd}) ${resto.slice(0, resto.length - 4)}-${resto.slice(-4)}`;
}

export function textoSessaoCaiu(s: SessaoCaida, rotulo?: string): string {
  return [
    `O WhatsApp *${rotulo ?? s.name}* — ${telefoneLegivel(s.numero)} — está fora do ar (status ${s.status}).`,
    "",
    "Mensagem que chega nesse número não entra no CRM e o agente não responde.",
    `Pra religar: pede um QR code novo da sessão \`${s.name}\` e lê no celular desse número (Aparelhos conectados).`,
  ].join("\n");
}

/**
 * Sessão conectada mas SEM o webhook do CRM: duas sessões já ficaram com
 * `config: {}` por ~25h e nada que entrava ou
 * saía dos dois números chegou ao CRM — sem erro, sem aviso. O WAHA está
 * WORKING, então o vigia de "número caído" não vê.
 */
export function semWebhookDoCrm(webhooks: string[], urlEsperada: string): boolean {
  const chave = (u: string) => {
    try {
      const x = new URL(u);
      return `${x.host}${x.pathname}`.replace(/\/+$/, "");
    } catch {
      return u;
    }
  };
  return !webhooks.some((w) => chave(w) === chave(urlEsperada));
}

export function textoSemWebhook(sessao: string, rotulo?: string): string {
  return [
    `⚠️ O WhatsApp *${rotulo ?? sessao}* está conectado, mas perdeu o webhook do CRM (sessão \`${sessao}\`).`,
    "",
    "Enquanto isso, nada que chega ou sai por esse número (texto, áudio) entra no CRM e o agente não responde.",
    "Pra corrigir: Configurações → Números → clique em Conectar nesse número (ele reaplica o webhook).",
  ].join("\n");
}

function hojeBrasilia(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}

export type ResultadoVigia = { caidas: string[]; avisadas: string[]; semWebhook?: string[]; erro?: string };

export async function vigiarSessoes(): Promise<ResultadoVigia> {
  const insts = await db.whatsappInstance.findMany({
    where: { provider: "waha" },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  const conexoes = insts.map((i) => ({ inst: i, c: conexaoDe(i) })).filter((x): x is { inst: (typeof insts)[number]; c: Conexao } => !!x.c);
  if (!conexoes.length) return { caidas: [], avisadas: [], erro: "nenhuma instancia WAHA" };

  let lista: SessaoListada[];
  try {
    lista = await listarSessoesWaha(conexoes[0].c);
  } catch (e) {
    return { caidas: [], avisadas: [], erro: e instanceof Error ? e.message : String(e) };
  }

  const caidas = sessoesCaidas(lista);

  // Sessões de pé mas sem o webhook do CRM.
  const urlEsperada = await config("webhook_url_publica", "WEBHOOK_URL_PUBLICA", urlDoWebhookPadrao());
  const deP0 = new Set(lista.filter((s) => String(s.status).toUpperCase() === "WORKING").map((s) => s.name));
  const semWebhook: string[] = [];
  for (const x of conexoes) {
    if (!deP0.has(x.c.sessao)) continue;
    const info = await lerSessaoWaha(x.c).catch(() => null);
    if (info?.existe && semWebhookDoCrm(info.webhooks, urlEsperada)) semWebhook.push(x.c.sessao);
  }
  if (!caidas.length && !semWebhook.length) return { caidas: [], avisadas: [] };

  // O aviso sai por um numero que ESTA de pe (o padrao primeiro). Se o padrao
  // for o que caiu, o `avisar` normal nao mandaria nada.
  const deP = new Set(lista.filter((s) => String(s.status).toUpperCase() === "WORKING").map((s) => s.name));
  const remetente = conexoes.find((x) => deP.has(x.c.sessao))?.c;
  if (!remetente) return { caidas: caidas.map((c) => c.name), avisadas: [], semWebhook, erro: "nenhum numero de pe pra avisar" };

  const avisadas: string[] = [];
  for (const nome of semWebhook) {
    const rotulo = insts.find((i) => i.instanceName === nome)?.name;
    const r = await avisar("erro", `sessao-sem-webhook:${nome}:${hojeBrasilia()}`, textoSemWebhook(nome, rotulo), {
      conexao: remetente,
    });
    if (r.enviado) avisadas.push(nome);
  }
  for (const s of caidas) {
    const rotulo = insts.find((i) => i.instanceName === s.name)?.name;
    const r = await avisar("erro", `sessao-caiu:${s.name}:${hojeBrasilia()}`, textoSessaoCaiu(s, rotulo), {
      conexao: remetente,
    });
    if (r.enviado) avisadas.push(s.name);
  }
  return { caidas: caidas.map((c) => c.name), avisadas, semWebhook };
}
