import { db } from "@/lib/db";
import { auditar } from "@/lib/audit";
import { normalizarTelefone } from "@/lib/telefone";
import { conexaoPorId, instancias, type Conexao } from "@/lib/whatsapp";

/**
 * Importa o histórico de conversa do WhatsApp (store do WAHA) para o CRM.
 *
 * Existe porque o CRM só passou a registrar conversa em 18/08 — tudo que foi
 * falado antes disso era invisível, e "689 leads nunca contatados" na verdade
 * era "sem registro". Com o histórico, a régua de follow-up passa a decidir
 * sobre fato.
 *
 * DUAS REGRAS DE ESCOPO, deliberadas:
 *
 * 1. Só importa conversa de quem JÁ É contato no CRM. Criar contato a partir de
 *    qualquer chat do WhatsApp pessoal traria família, fornecedor e amigo pra
 *    dentro da base — e todo número de CPA passaria a mentir.
 * 2. Grupos e status ficam de fora: o inbox 1x1 é sobre pessoa.
 */

const TETO_MSGS_POR_CONVERSA = 300;

export type ResultadoHistorico = {
  ok: boolean;
  instancia: string;
  chats: number;
  conversasCasadas: number;
  conversasIgnoradas: number;
  mensagens: number;
  eventos: number;
  erro?: string;
};

type ChatRemoto = { id?: unknown; name?: string };
type MsgRemota = {
  id?: string;
  timestamp?: number;
  fromMe?: boolean;
  body?: string;
  hasMedia?: boolean;
  _data?: { key?: { remoteJidAlt?: string }; pushName?: string };
};

function jid(c: ChatRemoto): string {
  const v = c.id;
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const o = v as { _serialized?: string };
    return o._serialized ?? String(v);
  }
  return String(v ?? "");
}

async function chamar<T>(c: Conexao, caminho: string): Promise<T | null> {
  try {
    const r = await fetch(c.baseUrl + caminho, {
      headers: { "X-Api-Key": c.apiKey, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(45000),
    });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export async function importarHistorico(
  instanceId?: string,
  ator = "sistema",
): Promise<ResultadoHistorico> {
  const insts = await instancias();
  const inst = instanceId ? insts.find((i) => i.id === instanceId) : insts.find((i) => i.isDefault);
  const vazio: ResultadoHistorico = {
    ok: false,
    instancia: inst?.name ?? "?",
    chats: 0,
    conversasCasadas: 0,
    conversasIgnoradas: 0,
    mensagens: 0,
    eventos: 0,
  };
  if (!inst) return { ...vazio, erro: "instancia nao encontrada" };

  const conexao = await conexaoPorId(inst.id);
  if (!conexao) return { ...vazio, erro: "conexao nao configurada" };

  const chats = await chamar<ChatRemoto[]>(conexao, `/api/${conexao.sessao}/chats?limit=3000`);
  if (!Array.isArray(chats)) {
    return { ...vazio, erro: "nao consegui ler os chats (store habilitado?)" };
  }

  const pessoais = chats.filter((c) => {
    const id = jid(c);
    return id && !id.includes("@g.us") && !id.includes("broadcast");
  });

  let casadas = 0;
  let ignoradas = 0;
  let mensagens = 0;
  let eventos = 0;

  for (const chat of pessoais) {
    const id = jid(chat);
    const numeroBruto = id.split("@")[0];
    const phone = normalizarTelefone(numeroBruto);
    if (!phone) {
      ignoradas++;
      continue;
    }

    // REGRA 1: só quem já é contato. Sem isso a agenda pessoal entra na base.
    const contato = await db.contact.findFirst({ where: { phone } });
    if (!contato) {
      ignoradas++;
      continue;
    }

    const msgs = await chamar<MsgRemota[]>(
      conexao,
      `/api/${conexao.sessao}/chats/${encodeURIComponent(id)}/messages?limit=${TETO_MSGS_POR_CONVERSA}&downloadMedia=false`,
    );
    if (!Array.isArray(msgs) || !msgs.length) {
      ignoradas++;
      continue;
    }

    casadas++;
    let maisRecente: Date | null = null;

    for (const m of msgs) {
      const texto = String(m.body ?? "").trim();
      if (!texto) continue;

      const externalId = m.id ?? `${id}-${m.timestamp ?? 0}`;
      const quando = m.timestamp ? new Date(m.timestamp * 1000) : new Date();
      if (!maisRecente || quando > maisRecente) maisRecente = quando;

      try {
        await db.whatsappMessage.create({
          data: {
            contactId: contato.id,
            instanceId: inst.id,
            fromNumber: m.fromMe ? (inst.phoneNumber ?? "crm") : phone,
            toNumber: m.fromMe ? phone : (inst.phoneNumber ?? "crm"),
            body: texto,
            type: m.hasMedia ? "image" : "text",
            direction: m.fromMe ? "outbound" : "inbound",
            status: m.fromMe ? "sent" : "read",
            externalId,
            metadata: { origem: "historico", chatId: id } as never,
            timestamp: quando,
          },
        });
        mensagens++;
      } catch {
        continue; // @@unique(externalId) — já importada
      }

      // Evento com a data ORIGINAL. É isso que faz a régua de follow-up parar
      // de tratar conversa de junho como se fosse de hoje.
      await db.timelineEvent.create({
        data: {
          contactId: contato.id,
          eventType: "whatsapp_message",
          channel: "whatsapp",
          metadata: {
            direcao: m.fromMe ? "enviada" : "recebida",
            texto,
            origem: "historico",
          } as never,
          timestamp: quando,
        },
      });
      eventos++;
    }

    // lastActivityAt nunca retrocede
    if (maisRecente && (!contato.lastActivityAt || contato.lastActivityAt < maisRecente)) {
      await db.contact.update({
        where: { id: contato.id },
        data: { lastActivityAt: maisRecente },
      });
    }
  }

  await auditar(
    ator,
    "historico_importado",
    `${inst.name}: ${casadas} conversas · ${mensagens} mensagens · ${ignoradas} fora do CRM`,
  );

  return {
    ok: true,
    instancia: inst.name,
    chats: pessoais.length,
    conversasCasadas: casadas,
    conversasIgnoradas: ignoradas,
    mensagens,
    eventos,
  };
}
