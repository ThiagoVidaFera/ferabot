import { db } from "@/lib/db";
import { auditar } from "@/lib/audit";
import { config } from "@/lib/config";
import { registrarEvento } from "@/lib/timeline";
import { devolverReserva, liberarPelaConexao } from "@/lib/guarda-numero";
import { podeTocarContato } from "@/lib/pode-tocar";
import { conexaoPorId, enviarTexto, resolverDestino, intervaloAntiBloqueio } from "@/lib/whatsapp";
import { tagsDe, temControle } from "@/lib/tags";
import { reuniaoFutura } from "@/lib/seletor-agente";
import { telefoneValido } from "@/lib/atencao-manual";
import { horarioDeEnvio, nomeParaSaudacao } from "@/lib/sequencia-iscas-copy";
import { apresentacaoDoTrabalho, combinadosDaAbertura, paginaDeCadastro } from "@/lib/primeira-mensagem";

/**
 * Primeiro contato do robô: lead de funil (origem `funil:*`) que se cadastrou e, 1h depois, não
 * mandou o primeiro WhatsApp (e nunca recebeu nada nosso) recebe uma abertura do robô, pelo número
 * que atende aquele funil. Só pega lead criado depois de `primeiro_contato_desde`: a regra não é
 * retroativa sozinha.
 *
 * Desliga com Setting `primeiro_contato_ativo` = "0".
 */

export const ESPERA_PRIMEIRO_CONTATO_MS = 60 * 60_000;
export const LIMITE_POR_NUMERO_DIA = 30;
const INTERVALO_MIN_MS = 8 * 60_000;
const INTERVALO_MAX_MS = 15 * 60_000;
const DESDE_PADRAO = "2026-11-08T00:00:00-03:00";
const ESTAGIOS_FORA = ["perdido", "cliente", "pessoal", "sem_automacao"];
const MARCA = "primeiro-contato-1h";

export type ContatoPrimeiroContato = {
  origem: string;
  lifecycleStage: string;
  phone: string | null;
  tags: unknown;
  customFields: unknown;
  createdAt: Date;
  mensagens: number;
};

export type Elegibilidade = { ok: true } | { ok: false; motivo: string };

type Campos = Record<string, unknown> | null | undefined;

/** Abertura: saudação + página de cadastro + apresentação do trabalho + a primeira pergunta. */
export function ehFunilComAbertura(origem: string | null | undefined): boolean {
  const o = (origem ?? "").toLowerCase();
  return o.startsWith("funil:") && o.length > "funil:".length;
}

export function mensagemPrimeiroContato(nomeBruto: string | null, _campos: Campos, origem = "funil:pagina"): string | null {
  if (!ehFunilComAbertura(origem)) return null;
  const nome = nomeParaSaudacao(nomeBruto);
  const saudacao = nome ? `Oi, ${nome}!` : "Oi!";
  return [
    `${saudacao} Vi que você se cadastrou na ${paginaDeCadastro(origem) ?? "nossa página"} e ainda não mandou a mensagem por aqui.`,
    ...combinadosDaAbertura("terceira"),
    apresentacaoDoTrabalho("padrao", "terceira"),
    "Me conta: o que fez você se cadastrar?",
  ].join("\n\n");
}

export function elegivelPrimeiroContato(c: ContatoPrimeiroContato, agora: Date, desde: Date): Elegibilidade {
  const nao = (motivo: string): Elegibilidade => ({ ok: false, motivo });
  if (!ehFunilComAbertura(c.origem)) return nao("funil sem abertura");
  if (ESTAGIOS_FORA.includes(c.lifecycleStage)) return nao(`estágio ${c.lifecycleStage}`);
  if (c.mensagens > 0) return nao("já tem mensagem registrada");
  if (c.createdAt < desde) return nao("anterior à regra");
  if (agora.getTime() - c.createdAt.getTime() < ESPERA_PRIMEIRO_CONTATO_MS) return nao("ainda não fez 1h");
  if (!telefoneValido(c.phone)) return nao("telefone inválido");
  if (reuniaoFutura(c.customFields, agora)) return nao("reunião futura — só o robô da agenda fala");
  if (temControle(tagsDe(c.tags))) return nao("tag de controle (humano/opt-out)");
  if ((c.customFields as Record<string, unknown> | null)?.primeiro_contato) return nao("já recebeu");
  return { ok: true };
}

export type ResultadoPrimeiroContato = { ligado: boolean; candidatos: number; enviados: number; motivo?: string };

async function numeroDoFunil(origem: string, permitidas: ReadonlySet<string>): Promise<string | null> {
  const linhas = await db.$queryRaw<Array<{ instanceId: string; n: number | bigint }>>`
    SELECT m.instanceId AS instanceId, COUNT(*) AS n
    FROM WhatsappMessage m JOIN Contact c ON c.id = m.contactId
    WHERE c.origem = ${origem} AND m.instanceId IS NOT NULL
    GROUP BY m.instanceId`;
  const melhor = linhas
    .filter((l) => permitidas.has(l.instanceId))
    .sort((a, b) => Number(b.n) - Number(a.n))[0];
  return melhor?.instanceId ?? null;
}

async function marcar(contactId: string, valor: Record<string, unknown> | null): Promise<void> {
  const c = await db.contact.findUnique({ where: { id: contactId }, select: { customFields: true } });
  if (!c) return;
  const { primeiro_contato: _antigo, ...resto } = (c.customFields ?? {}) as Record<string, unknown>;
  await db.contact.update({
    where: { id: contactId },
    data: { customFields: (valor ? { ...resto, primeiro_contato: valor } : resto) as never },
  });
}

async function enviadosHoje(instanceId: string, agora: Date): Promise<number> {
  const inicio = new Date(agora);
  inicio.setHours(0, 0, 0, 0);
  return db.whatsappMessage.count({
    where: { instanceId, direction: "outbound", timestamp: { gte: inicio }, metadata: { path: "$.followup", equals: MARCA } },
  });
}

/** Trava contra o cron de 1 min e uma chamada manual lerem o mesmo lead (ver desafio de 29/10/2026). */
let emAndamento = false;

export async function processarPrimeiroContato(agora: Date = new Date()): Promise<ResultadoPrimeiroContato> {
  if (emAndamento) return { ligado: true, candidatos: 0, enviados: 0, motivo: "rodada anterior ainda em andamento" };
  emAndamento = true;
  try {
    return await rodar(agora);
  } finally {
    emAndamento = false;
  }
}

async function rodar(agora: Date): Promise<ResultadoPrimeiroContato> {
  if ((await config("primeiro_contato_ativo", "PRIMEIRO_CONTATO_ATIVO", "1")) === "0") {
    return { ligado: false, candidatos: 0, enviados: 0, motivo: "desligado" };
  }
  if (!horarioDeEnvio(agora)) return { ligado: true, candidatos: 0, enviados: 0, motivo: "fora do horário (8h–21h)" };

  const desde = new Date((await config("primeiro_contato_desde", "PRIMEIRO_CONTATO_DESDE", DESDE_PADRAO)) || DESDE_PADRAO);
  const instancias = await db.whatsappInstance.findMany({ where: { provider: "waha", status: "conectado" } });
  const permitidas = new Set(instancias.map((i) => i.id));
  if (!permitidas.size) return { ligado: true, candidatos: 0, enviados: 0, motivo: "nenhum número WAHA conectado" };

  const contatos = await db.contact.findMany({
    where: {
      origem: { startsWith: "funil:" },
      createdAt: { gte: desde, lte: new Date(agora.getTime() - ESPERA_PRIMEIRO_CONTATO_MS) },
    },
    select: {
      id: true, name: true, phone: true, origem: true, lifecycleStage: true, tags: true,
      customFields: true, createdAt: true, _count: { select: { messages: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const fila = new Map<string, typeof contatos>();
  let candidatos = 0;
  for (const c of contatos) {
    if (!elegivelPrimeiroContato({ ...c, mensagens: c._count.messages }, agora, desde).ok) continue;
    const instanceId = await numeroDoFunil(c.origem, permitidas);
    if (!instanceId) continue; // funil sem histórico: número desconhecido, não chuta
    candidatos++;
    fila.set(instanceId, [...(fila.get(instanceId) ?? []), c]);
  }

  let enviados = 0;
  for (const [instanceId, lista] of fila) {
    const chaveProx = `primeiro_contato_prox_${instanceId}`;
    if (agora < new Date((await config(chaveProx)) || 0)) continue;
    if ((await enviadosHoje(instanceId, agora)) >= LIMITE_POR_NUMERO_DIA) continue;
    const conexao = await conexaoPorId(instanceId);
    if (!conexao) continue;
    if (await enviarUm(lista, instanceId, conexao, agora, chaveProx)) enviados++;
  }
  return { ligado: true, candidatos, enviados };
}

async function enviarUm(
  lista: ReadonlyArray<{ id: string; name: string | null; phone: string | null; origem: string; customFields: unknown }>,
  instanceId: string,
  conexao: NonNullable<Awaited<ReturnType<typeof conexaoPorId>>>,
  agora: Date,
  chaveProx: string,
): Promise<boolean> {
  for (const c of lista.slice(0, 3)) {
    // Guarda central. Lead que exige outro número (número único) é pulado, nunca trocado:
    // (a régua dele mora em outro número).
    const toque = await podeTocarContato({ contactId: c.id, regua: "primeiro-contato", conexao, semTrocarNumero: true, agora });
    if (!toque.liberado) {
      await marcar(c.id, { status: "pulado", motivo: `${toque.motivo}: ${toque.detalhe}`, em: agora.toISOString() });
      continue;
    }
    const liberado = await liberarPelaConexao(conexao, "prioritario", c.phone as string);
    if (!liberado.liberado) return false;
    const destino = await resolverDestino(conexao, c.phone as string);
    if (!destino.temWhatsapp) {
      devolverReserva(conexao);
      await marcar(c.id, { status: "pulado", motivo: "número sem WhatsApp", em: agora.toISOString() });
      await auditar("cron:primeiro-contato", "contato_pulado", `${c.id}: número sem WhatsApp`);
      continue;
    }
    // reconfere logo antes de enviar: outro processo pode ter marcado este lead ou ele já ter escrito
    const atual = await db.contact.findUnique({
      where: { id: c.id },
      select: { customFields: true, _count: { select: { messages: true } } },
    });
    if ((atual?.customFields as Record<string, unknown> | null)?.primeiro_contato || (atual?._count.messages ?? 0) > 0) continue;

    const texto = mensagemPrimeiroContato(c.name, c.customFields as Campos, c.origem);
    if (!texto) continue;
    await marcar(c.id, { status: "enviando", instanceId, em: agora.toISOString() });
    const r = await enviarTexto(conexao, destino.chatId, texto);
    if (!r.ok) {
      await marcar(c.id, null); // tenta de novo no próximo tick
      await auditar("cron:primeiro-contato", "contato_falhou", `${c.id}: ${r.erro ?? "?"}`);
      return false;
    }
    await db.whatsappMessage.create({
      data: {
        contactId: c.id, instanceId, fromNumber: "crm", toNumber: c.phone as string, body: texto,
        direction: "outbound", status: "sent", externalId: r.externalId ?? null,
        metadata: { origem: "followup", followup: MARCA, ator: "cron" } as never,
      },
    });
    await registrarEvento({
      contactId: c.id, eventType: "whatsapp_message", channel: "whatsapp",
      metadata: { direcao: "enviada", texto, followup: MARCA, ator: "cron" },
    });
    await marcar(c.id, { status: "enviado", instanceId, em: agora.toISOString() });
    const proximo = new Date(agora.getTime() + intervaloAntiBloqueio(INTERVALO_MIN_MS, INTERVALO_MAX_MS)).toISOString();
    await db.setting.upsert({ where: { key: chaveProx }, update: { value: proximo }, create: { key: chaveProx, value: proximo } });
    await auditar("cron:primeiro-contato", "contato_enviado", c.id);
    return true;
  }
  return false;
}
