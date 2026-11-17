import { db } from "@/lib/db";
import { negocio } from "@/lib/negocio";
import { auditar } from "@/lib/audit";
import { config } from "@/lib/config";
import { registrarEvento } from "@/lib/timeline";
import { liberarPelaConexao } from "@/lib/guarda-numero";
import { conexaoPorId, enviarTexto, resolverDestino, intervaloAntiBloqueio } from "@/lib/whatsapp";
import { tagsDe, temControle } from "@/lib/tags";
import { reuniaoFutura } from "@/lib/seletor-agente";
import { telefoneValido } from "@/lib/atencao-manual";
import { horarioDeEnvio } from "@/lib/sequencia-iscas-copy";
import { podeTocarContato } from "@/lib/pode-tocar";
import { personaDaSessao } from "@/lib/numero-comercial";
import { nomeParaVocativo } from "@/lib/oferta-sazonal";

/**
 * Follow-up de ENTRADA: lead que entrou no CRM
 * por um funil e, 72h depois, nunca recebeu NENHUMA mensagem nossa (nem
 * automação, nem você) e também nunca escreveu, recebe um toque curto em TEXTO (o emoji solto
 * 👀/🆙/❓ foi aposentado: padrão de robô). Sai pelo número que originou o lead — lead com
 * número único sai por ele (`pode-tocar.ts`).
 *
 * Regras: um toque por lead; até 30 por número por dia; intervalo de 8 a 15 min
 * entre envios do mesmo número; só entre 8h e 21h (Brasília). Retroativo: vale
 * pra quem já passou das 72h, até 30 dias de idade.
 *
 * Desliga com Setting `followup_entrada_ativo` = "0". O número de um funil pode
 * ser forçado em `followup_entrada_numeros` ({"funil:slug": "<instanceId>"}).
 */

export const ESPERA_ENTRADA_MS = 72 * 3_600_000;
export const IDADE_MAXIMA_MS = 30 * 24 * 3_600_000;
export const LIMITE_POR_NUMERO_DIA = 30;
const INTERVALO_MIN_MS = 8 * 60_000;
const INTERVALO_MAX_MS = 15 * 60_000;
const TENTATIVAS_POR_TICK = 3;
const ESTAGIOS_FORA = ["perdido", "cliente", "pessoal", "sem_automacao"];

export type ContatoEntrada = {
  origem: string;
  lifecycleStage: string;
  phone: string | null;
  tags: unknown;
  customFields: unknown;
  createdAt: Date;
  mensagens: number;
};

export type Elegibilidade = { ok: true } | { ok: false; motivo: string };

export function elegivelEntrada(c: ContatoEntrada, agora: Date = new Date()): Elegibilidade {
  const nao = (motivo: string): Elegibilidade => ({ ok: false, motivo });
  if (!c.origem.startsWith("funil:")) return nao("não é lead de funil");
  if (ESTAGIOS_FORA.includes(c.lifecycleStage)) return nao(`estágio ${c.lifecycleStage}`);
  if (c.mensagens > 0) return nao("já tem mensagem registrada");
  const idade = agora.getTime() - c.createdAt.getTime();
  if (idade < ESPERA_ENTRADA_MS) return nao("ainda não fez 72h");
  if (idade > IDADE_MAXIMA_MS) return nao("lead antigo demais");
  if (!telefoneValido(c.phone)) return nao("telefone inválido");
  if (reuniaoFutura(c.customFields, agora)) return nao("reunião futura — só o robô da agenda fala");
  if (temControle(tagsDe(c.tags))) return nao("tag de controle (humano/opt-out)");
  if ((c.customFields as Record<string, unknown> | null)?.followup_entrada) return nao("já recebeu o toque");
  return { ok: true };
}

/**
 * Texto do toque (13/11/2026): o emoji solto foi aposentado (padrão de robô, e o guarda do número o
 * barra a frio). Uma pergunta fácil (a primeira da qualificação do negocio.json); num número com
 * persona ela se apresenta.
 */
export function textoDoToqueEntrada(nome: string | null | undefined, persona: { nome: string } | null): string {
  const n = nomeParaVocativo(nome);
  const oi = n ? `Oi, ${n}!` : "Oi!";
  const neg = negocio();
  const pergunta = neg.qualificacao[0] ? `Me conta: ${neg.qualificacao[0]}?` : "Me conta: o que você quer resolver agora?";
  return [
    persona ? `${oi} ${persona.nome} aqui, da equipe de ${neg.dono.primeiroNome}.` : oi,
    "Vi que você se cadastrou aqui esses dias e quero entender o seu momento.",
    pergunta,
  ].join("\n\n");
}

/** Número com mais conversa daquele funil (ignora a API oficial: ela não manda texto livre a frio). */
export function numeroDominante(
  contagens: ReadonlyArray<{ instanceId: string; n: number }>,
  permitidas: ReadonlySet<string>,
): string | null {
  const melhor = [...contagens].filter((c) => permitidas.has(c.instanceId)).sort((a, b) => b.n - a.n)[0];
  return melhor?.instanceId ?? null;
}

export type ResultadoEntrada = { ligado: boolean; candidatos: number; enviados: number; motivo?: string };

async function enviadosHoje(instanceId: string, agora: Date): Promise<number> {
  const inicio = new Date(agora);
  inicio.setHours(0, 0, 0, 0);
  return db.whatsappMessage.count({
    where: {
      instanceId,
      direction: "outbound",
      timestamp: { gte: inicio },
      metadata: { path: "$.followup", equals: "entrada-72h" },
    },
  });
}

async function marcar(contactId: string, valor: Record<string, unknown> | null) {
  const c = await db.contact.findUnique({ where: { id: contactId }, select: { customFields: true } });
  if (!c) return;
  const { followup_entrada: _antigo, ...resto } = (c.customFields ?? {}) as Record<string, unknown>;
  await db.contact.update({
    where: { id: contactId },
    data: { customFields: (valor ? { ...resto, followup_entrada: valor } : resto) as never },
  });
}

async function numerosDosFunis(): Promise<Map<string, Array<{ instanceId: string; n: number }>>> {
  const linhas = await db.$queryRaw<Array<{ origem: string; instanceId: string; n: number | bigint }>>`
    SELECT c.origem AS origem, m.instanceId AS instanceId, COUNT(*) AS n
    FROM WhatsappMessage m JOIN Contact c ON c.id = m.contactId
    WHERE c.origem LIKE 'funil:%' AND m.instanceId IS NOT NULL
    GROUP BY c.origem, m.instanceId`;
  const mapa = new Map<string, Array<{ instanceId: string; n: number }>>();
  for (const l of linhas) {
    mapa.set(l.origem, [...(mapa.get(l.origem) ?? []), { instanceId: l.instanceId, n: Number(l.n) }]);
  }
  return mapa;
}

/**
 * Uma rodada por vez. O cron chama a cada minuto e uma chamada manual pode cair
 * junto: sem esta trava as duas liam o mesmo lead e mandavam o toque DUAS vezes
 * (aconteceu em 29/10/2026 com 3 leads).
 */
let emAndamento = false;

export async function processarFollowupEntrada(agora: Date = new Date()): Promise<ResultadoEntrada> {
  if (emAndamento) return { ligado: true, candidatos: 0, enviados: 0, motivo: "rodada anterior ainda em andamento" };
  emAndamento = true;
  try {
    return await rodarFollowupEntrada(agora);
  } finally {
    emAndamento = false;
  }
}

async function rodarFollowupEntrada(agora: Date): Promise<ResultadoEntrada> {
  if ((await config("followup_entrada_ativo", "FOLLOWUP_ENTRADA_ATIVO", "1")) === "0") {
    return { ligado: false, candidatos: 0, enviados: 0, motivo: "desligado" };
  }
  if (!horarioDeEnvio(agora)) return { ligado: true, candidatos: 0, enviados: 0, motivo: "fora do horário (8h–21h)" };

  const instancias = await db.whatsappInstance.findMany({ where: { provider: "waha", status: "conectado" } });
  const permitidas = new Set(instancias.map((i) => i.id));
  if (!permitidas.size) return { ligado: true, candidatos: 0, enviados: 0, motivo: "nenhum número WAHA conectado" };

  let forcados: Record<string, string> = {};
  try {
    forcados = JSON.parse((await config("followup_entrada_numeros", "FOLLOWUP_ENTRADA_NUMEROS", "{}")) || "{}");
  } catch {
    forcados = {};
  }

  const [contatos, porFunil] = await Promise.all([
    db.contact.findMany({
      where: {
        origem: { startsWith: "funil:" },
        createdAt: { lte: new Date(agora.getTime() - ESPERA_ENTRADA_MS), gte: new Date(agora.getTime() - IDADE_MAXIMA_MS) },
      },
      select: {
        id: true, name: true, phone: true, origem: true, lifecycleStage: true, tags: true,
        customFields: true, createdAt: true, _count: { select: { messages: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    numerosDosFunis(),
  ]);

  // candidatos agrupados pelo número que originou o lead (mais novos primeiro)
  const fila = new Map<string, typeof contatos>();
  let candidatos = 0;
  for (const c of contatos) {
    if (!elegivelEntrada({ ...c, mensagens: c._count.messages }, agora).ok) continue;
    const forcado = forcados[c.origem];
    const instanceId = forcado && permitidas.has(forcado) ? forcado : numeroDominante(porFunil.get(c.origem) ?? [], permitidas);
    if (!instanceId) continue; // funil sem histórico: número desconhecido, não chuta
    candidatos++;
    fila.set(instanceId, [...(fila.get(instanceId) ?? []), c]);
  }

  let enviados = 0;
  for (const [instanceId, lista] of fila) {
    const chaveProx = `followup_entrada_prox_${instanceId}`;
    const prox = new Date((await config(chaveProx)) || 0);
    if (agora < prox) continue;
    if ((await enviadosHoje(instanceId, agora)) >= LIMITE_POR_NUMERO_DIA) continue;
    const conexao = await conexaoPorId(instanceId);
    if (!conexao) continue;

    for (const c of lista.slice(0, TENTATIVAS_POR_TICK)) {
      // Guarda central: estágio, compra, opt-out, adiamento, número único.
      const toque = await podeTocarContato({ contactId: c.id, regua: "followup-entrada", conexao, agora });
      if (!toque.liberado) {
        await marcar(c.id, { status: "pulado", motivo: `${toque.motivo}: ${toque.detalhe}`, em: agora.toISOString() });
        continue;
      }
      const envio = toque.conexao ?? conexao;
      const texto = textoDoToqueEntrada(c.name, personaDaSessao(envio.sessao));
      const liberado = await liberarPelaConexao(envio, "rotina", c.phone as string, texto);
      if (!liberado.liberado) break;
      const destino = await resolverDestino(envio, c.phone as string);
      if (!destino.temWhatsapp) {
        await marcar(c.id, { status: "pulado", motivo: "número sem WhatsApp", em: agora.toISOString() });
        await auditar("cron:followup-entrada", "toque_pulado", `${c.id}: número sem WhatsApp`);
        continue;
      }
      // reconfere logo antes de enviar: outro processo pode ter marcado este lead
      const atual = await db.contact.findUnique({ where: { id: c.id }, select: { customFields: true } });
      if ((atual?.customFields as Record<string, unknown> | null)?.followup_entrada) continue;
      const instanciaEnvio = envio.instanceId ?? instanceId;
      await marcar(c.id, { status: "enviando", instanceId: instanciaEnvio, em: agora.toISOString() });
      const r = await enviarTexto(envio, destino.chatId, texto);
      if (!r.ok) {
        await marcar(c.id, null); // tenta de novo no próximo tick
        await auditar("cron:followup-entrada", "toque_falhou", `${c.id}: ${r.erro ?? "?"}`);
        break;
      }
      await db.whatsappMessage.create({
        data: {
          contactId: c.id,
          instanceId: instanciaEnvio,
          fromNumber: "crm",
          toNumber: c.phone as string,
          body: texto,
          direction: "outbound",
          status: "sent",
          externalId: r.externalId ?? null,
          metadata: { origem: "followup", followup: "entrada-72h", ator: "cron", fonte: "api" } as never,
        },
      });
      await registrarEvento({
        contactId: c.id,
        eventType: "whatsapp_message",
        channel: "whatsapp",
        metadata: { direcao: "enviada", texto, followup: "entrada-72h", ator: "cron" },
      });
      await marcar(c.id, { status: "enviado", instanceId: instanciaEnvio, em: agora.toISOString() });
      await db.setting.upsert({
        where: { key: chaveProx },
        update: { value: new Date(agora.getTime() + intervaloAntiBloqueio(INTERVALO_MIN_MS, INTERVALO_MAX_MS)).toISOString() },
        create: { key: chaveProx, value: new Date(agora.getTime() + intervaloAntiBloqueio(INTERVALO_MIN_MS, INTERVALO_MAX_MS)).toISOString() },
      });
      await auditar("cron:followup-entrada", "toque_enviado", c.id);
      enviados++;
      break; // 1 envio por número por tick; o intervalo vem do próximo horário liberado
    }
  }
  return { ligado: true, candidatos, enviados };
}
