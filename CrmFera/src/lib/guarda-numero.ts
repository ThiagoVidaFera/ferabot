import { db } from "@/lib/db";
import { config, gravarConfig } from "@/lib/config";
import { variantesTelefone } from "@/lib/telefone";
import { conexaoDe, estadoSessao, type Conexao } from "@/lib/whatsapp";

/**
 * GUARDA ÚNICO DE ENVIO POR NÚMERO.
 *
 * Um WhatsApp da operação original foi desconectado e bloqueado por 24h. Em 7 dias
 * saíram 393 mensagens para 172 pessoas e só 22 escreveram de volta (~95% a frio),
 * por 6 emissores independentes (iscas, follow-up de entrada, convite de aula,
 * agente, primeiro contato, celular), cada um com o teto e o intervalo dele e
 * nenhum enxergando os outros. As iscas saíam de 2 em 2 minutos cravados, o
 * follow-up mandava "👀" / "❓" / "🆙" soltos e o número subiu de 42 para 68
 * saídas/dia em dois dias.
 *
 * Regras (valem para TODO emissor automático que passa por aqui):
 *  - sessão fora do ar => ninguém envia (antes cada emissor queimava tentativas);
 *  - 24h de quarentena depois que o número volta e rampa 10→20→30→40→50→60/dia a frio;
 *  - teto a frio COMPARTILHADO; a rotina só usa 60% dele, o que é prioritário usa tudo;
 *  - 5 a 9 min (sorteados) entre envios a frio, 9h–18h de Brasília, nunca domingo;
 *  - mensagem de só emoji nunca sai a frio;
 *  - quem escreveu pro número é conversa: sem teto a frio, sem janela (teto duro 80/dia).
 */

export type PerfilEnvio = "resposta" | "prioritario" | "rotina";

export type EntradaGuarda = {
  agora: Date;
  sessaoOk: boolean;
  /** Quando o número voltou ao ar depois de uma queda (null = nunca caiu). */
  retornoEm: Date | null;
  perfil: PerfilEnvio;
  /** O destino escreveu pra este número nas últimas 72h (JANELA_CONVERSA_MS). Mais velho que isso é a frio. */
  destinoJaEscreveu: boolean;
  texto?: string;
  frioHoje: number;
  totalHoje: number;
  ultimoFrioEm: Date | null;
  /** Sorteio do próximo envio a frio permitido (memória do processo). */
  proximoFrioApos: Date | null;
  /** Setting `numero_cap_frio_dia`, quando preenchida. */
  capFrioConfigurado: number | null;
};

export type DecisaoGuarda = { liberado: boolean; motivo: string };

const HORA_MS = 3_600_000;
const MIN_MS = 60_000;
export const CAP_FRIO_NORMAL = 60;
export const CAP_FRIO_MAXIMO = 60;
export const TETO_TOTAL_DIA = 150;
const RAMPA_POS_RETORNO = [0, 10, 20, 30, 40, 50] as const;
const QUARENTENA_MS = 24 * HORA_MS;
export const JANELA_CONVERSA_MS = 72 * HORA_MS;
/** Sessão fora por menos que isso é oscilação (restart do WAHA), não queda: não gera quarentena. */
const QUEDA_MINIMA_MS = 10 * MIN_MS;
const ESPACO_MIN_MS = 5 * MIN_MS;
const ESPACO_SORTEIO_MS = 4 * MIN_MS;
const FRACAO_ROTINA = 0.6;
const HORA_INICIO = 9;
const HORA_FIM = 18;

/** Só emoji, pontuação ou até 3 caracteres ("👀", "❓", "ok"): isso é padrão de robô. */
export function ehSoEmoji(texto: string): boolean {
  const limpo = texto.trim();
  if (!limpo) return true;
  if (limpo.length <= 3) return true;
  return !/[\p{L}\p{N}]/u.test(limpo);
}

function partesBrasilia(agora: Date): { hora: number; domingo: boolean } {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    hour: "numeric",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(agora);
  const hora = Number(f.find((p) => p.type === "hour")?.value ?? 0);
  return { hora, domingo: f.find((p) => p.type === "weekday")?.value === "Sun" };
}

/** Teto de envios a frio do dia, pela rampa depois do retorno (ou o valor configurado). */
export function capFrioDoDia(agora: Date, retornoEm: Date | null, configurado: number | null): number {
  if (configurado && configurado > 0) return Math.min(configurado, CAP_FRIO_MAXIMO);
  if (!retornoEm) return CAP_FRIO_NORMAL;
  const dias = Math.floor((agora.getTime() - retornoEm.getTime()) / (24 * HORA_MS));
  return RAMPA_POS_RETORNO[dias] ?? CAP_FRIO_NORMAL;
}

function bloquear(motivo: string): DecisaoGuarda {
  return { liberado: false, motivo };
}

export function decidirEnvio(e: EntradaGuarda): DecisaoGuarda {
  if (!e.sessaoOk) return bloquear("sessao_fora");
  if (e.totalHoje >= TETO_TOTAL_DIA) return bloquear("teto_total_dia");

  // Conversa: o lead escreveu pra este número. Responder não é disparo.
  if (e.destinoJaEscreveu) return { liberado: true, motivo: "conversa" };

  if (e.texto !== undefined && ehSoEmoji(e.texto)) return bloquear("so_emoji_a_frio");

  const { hora, domingo } = partesBrasilia(e.agora);
  if (domingo || hora < HORA_INICIO || hora >= HORA_FIM) return bloquear("fora_da_janela");

  if (e.retornoEm && e.agora.getTime() - e.retornoEm.getTime() < QUARENTENA_MS) {
    return bloquear("quarentena_pos_retorno");
  }

  const cap = capFrioDoDia(e.agora, e.retornoEm, e.capFrioConfigurado);
  const limite = e.perfil === "rotina" ? Math.floor(cap * FRACAO_ROTINA) : cap;
  if (e.frioHoje >= limite) return bloquear("cap_frio_dia");

  const livreEm = Math.max(
    e.ultimoFrioEm ? e.ultimoFrioEm.getTime() + ESPACO_MIN_MS : 0,
    e.proximoFrioApos ? e.proximoFrioApos.getTime() : 0,
  );
  if (e.agora.getTime() < livreEm) return bloquear("espacamento");

  return { liberado: true, motivo: "ok" };
}

// ---------------------------------------------------------------------------
// Camada com banco
// ---------------------------------------------------------------------------

const chaveEstado = (sessao: string) => `numero_${sessao}_estado`;
const chaveRetorno = (sessao: string) => `numero_${sessao}_retorno_em`;
const chaveForaDesde = (sessao: string) => `numero_${sessao}_fora_desde`;
const CACHE_SESSAO_MS = 60_000;
/** Sessões sob o guarda (Setting `guarda_numero_sessoes`, separadas por vírgula). Padrão: a sessão do
 *  WAHA_SESSION (o número principal do docker-compose). */
const SESSOES_VIGIADAS_PADRAO = process.env.WAHA_SESSION || "principal";

const cacheSessao = new Map<string, { ok: boolean; em: number }>();
const proximoFrio = new Map<string, Date>();

function inicioDoDiaBrasilia(agora: Date): Date {
  const dia = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(agora);
  return new Date(`${dia}T03:00:00.000Z`);
}

/**
 * Lê o estado da sessão e, ao ver FORA -> OK, carimba `numero_<sessao>_retorno_em`:
 * é daí que sai a quarentena e a rampa. Setting `numero_<sessao>_retorno_em` à mão
 * também vale (pra forçar quarentena ou liberar).
 */
async function sessaoEstaOk(instanciaId: string, sessao: string, agora: Date): Promise<boolean> {
  const cache = cacheSessao.get(sessao);
  if (cache && agora.getTime() - cache.em < CACHE_SESSAO_MS) return cache.ok;

  const inst = await db.whatsappInstance.findUnique({ where: { id: instanciaId } });
  const conexao = inst ? conexaoDe(inst) : null;
  const ok = conexao ? (await estadoSessao(conexao)).status === "conectado" : false;
  cacheSessao.set(sessao, { ok, em: agora.getTime() });

  const anterior = await config(chaveEstado(sessao), undefined, "ok");
  if (!ok && anterior !== "fora") {
    await gravarConfig(chaveEstado(sessao), "fora");
    await gravarConfig(chaveForaDesde(sessao), agora.toISOString());
  }
  if (ok && anterior === "fora") {
    await gravarConfig(chaveEstado(sessao), "ok");
    const desde = new Date(await config(chaveForaDesde(sessao), undefined, ""));
    const durou = Number.isNaN(desde.getTime()) ? Infinity : agora.getTime() - desde.getTime();
    if (durou >= QUEDA_MINIMA_MS) await gravarConfig(chaveRetorno(sessao), agora.toISOString());
  }
  return ok;
}

export type PedidoEnvio = {
  /** id da WhatsappInstance que vai enviar */
  instanciaId: string;
  /** nome da sessão no WAHA (ex.: principal) */
  sessao: string;
  perfil: PerfilEnvio;
  /** telefone do destinatário, qualquer formato */
  telefone: string;
  texto?: string;
  agora?: Date;
};

/** Pergunta ao guarda; se liberar um envio a frio, já reserva o próximo espaço sorteado. */
export async function liberarEnvio(p: PedidoEnvio): Promise<DecisaoGuarda> {
  const agora = p.agora ?? new Date();
  const vigiadas = (await config("guarda_numero_sessoes", undefined, SESSOES_VIGIADAS_PADRAO))
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  if (!vigiadas.includes(p.sessao)) return { liberado: true, motivo: "nao_vigiado" };
  const sessaoOk = await sessaoEstaOk(p.instanciaId, p.sessao, agora);

  const variantes = variantesTelefone(p.telefone);
  const recente = new Date(agora.getTime() - JANELA_CONVERSA_MS);
  const escreveu = await db.whatsappMessage.findFirst({
    where: { instanceId: p.instanciaId, direction: "inbound", fromNumber: { in: variantes }, timestamp: { gte: recente } },
    select: { id: true },
  });

  const saidasHoje = await db.whatsappMessage.findMany({
    where: { instanceId: p.instanciaId, direction: "outbound", timestamp: { gte: inicioDoDiaBrasilia(agora) } },
    select: { toNumber: true, timestamp: true },
  });
  // O mesmo celular chega com e sem o 9º dígito: compara por variantes, nunca por string exata.
  const todasVariantes = Array.from(new Set(saidasHoje.flatMap((s) => variantesTelefone(s.toNumber))));
  const quemEscreveu = new Set(
    (
      await db.whatsappMessage.findMany({
        where: { instanceId: p.instanciaId, direction: "inbound", fromNumber: { in: todasVariantes }, timestamp: { gte: recente } },
        select: { fromNumber: true },
        distinct: ["fromNumber"],
      })
    ).map((m) => m.fromNumber),
  );
  const frias = saidasHoje.filter((s) => !variantesTelefone(s.toNumber).some((v) => quemEscreveu.has(v)));
  const ultimoFrio = frias.reduce<Date | null>((a, s) => (!a || s.timestamp > a ? s.timestamp : a), null);

  const retornoBruto = await config(chaveRetorno(p.sessao), undefined, "");
  const retornoEm = retornoBruto ? new Date(retornoBruto) : null;
  const capBruto = Number(await config("numero_cap_frio_dia", undefined, "")) || null;

  const decisao = decidirEnvio({
    agora,
    sessaoOk,
    retornoEm: retornoEm && !Number.isNaN(retornoEm.getTime()) ? retornoEm : null,
    perfil: p.perfil,
    destinoJaEscreveu: Boolean(escreveu),
    texto: p.texto,
    frioHoje: frias.length,
    totalHoje: saidasHoje.length,
    ultimoFrioEm: ultimoFrio,
    proximoFrioApos: proximoFrio.get(p.sessao) ?? null,
    capFrioConfigurado: capBruto,
  });

  if (decisao.liberado && decisao.motivo === "ok") {
    const sorteio = ESPACO_MIN_MS + Math.floor(Math.random() * ESPACO_SORTEIO_MS);
    proximoFrio.set(p.sessao, new Date(agora.getTime() + sorteio));
  }
  return decisao;
}

/** Atalho para quem já tem a Conexao em mãos (a maioria dos emissores). */
export async function liberarPelaConexao(
  c: Conexao,
  perfil: PerfilEnvio,
  telefone: string,
  texto?: string,
): Promise<DecisaoGuarda> {
  if (!c.instanceId) return { liberado: true, motivo: "sem_instancia" };
  return liberarEnvio({ instanciaId: c.instanceId, sessao: c.sessao, perfil, telefone, texto });
}

/** O envio liberado não aconteceu (número sem WhatsApp, reconferência): devolve o espaço reservado. */
export function devolverReserva(c: Conexao): void {
  proximoFrio.delete(c.sessao);
}
