import { db } from "@/lib/db";
import { reuniaoFutura } from "@/lib/seletor-agente";

/**
 * Leads que o CRM NÃO vê pela fila "falou e ninguém respondeu" (29/10/2026):
 * a fila nasce de mensagem registrada, e estes casos têm o buraco justamente aí.
 *
 *  - `sem_mensagem`: clicou em "chamar no WhatsApp" na página, mas nenhuma
 *    mensagem dele chegou ao CRM (webhook caído, número errado, desistiu).
 *  - `telefone_invalido`: agendou reunião futura com um número que não é de
 *    WhatsApp — o robô da agenda não consegue mandar preparo nem lembrete.
 *
 * Nenhum robô fala com eles por causa disso: o sinal chama gente.
 */

export type MotivoAtencao = "sem_mensagem" | "telefone_invalido";

export type ContatoAtencao = {
  origem: string;
  lifecycleStage: string;
  phone: string | null;
  customFields: unknown;
  createdAt: Date;
  mensagens: number;
};

const ESPERA_SEM_MENSAGEM_MS = 20 * 60_000;
const JANELA_SEM_MENSAGEM_MS = 3 * 24 * 3_600_000;
const JANELA_CONSULTA_MS = 30 * 24 * 3_600_000;

/** Celular BR: 55 + DDD + 9 dígitos começando em 9; fixo/antigo: 55 + DDD + 8 dígitos. */
export function telefoneValido(phone: string | null | undefined): boolean {
  const d = String(phone ?? "").replace(/\D/g, "");
  if (!d.startsWith("55")) return d.length >= 10 && d.length <= 15;
  if (d.length === 13) return d[4] === "9" && Number(d.slice(2, 4)) >= 11;
  if (d.length === 12) return /[2-9]/.test(d[4]) && Number(d.slice(2, 4)) >= 11;
  return false;
}

export function motivoAtencao(c: ContatoAtencao, agora: Date = new Date()): MotivoAtencao | null {
  if (!c.origem.startsWith("funil:") || c.lifecycleStage === "perdido") return null;

  if (reuniaoFutura(c.customFields, agora) && !telefoneValido(c.phone)) return "telefone_invalido";

  const objetivo = String((c.customFields as Record<string, unknown> | null)?.objetivo ?? "");
  const idade = agora.getTime() - c.createdAt.getTime();
  if (
    c.mensagens === 0 &&
    /chamou no whatsapp/i.test(objetivo) &&
    idade >= ESPERA_SEM_MENSAGEM_MS &&
    idade <= JANELA_SEM_MENSAGEM_MS
  ) {
    return "sem_mensagem";
  }
  return null;
}

export const ROTULO_ATENCAO: Record<MotivoAtencao, string> = {
  sem_mensagem: "Chamou no WhatsApp pela página, mas nenhuma mensagem dele chegou ao CRM",
  telefone_invalido: "Reunião marcada com telefone inválido — o robô da agenda não consegue falar com ele",
};

export type ItemAtencao = {
  contactId: string;
  nome: string;
  telefone: string | null;
  motivo: MotivoAtencao;
  desde: Date;
};

export async function leadsParaAtencao(agora: Date = new Date()): Promise<ItemAtencao[]> {
  const contatos = await db.contact.findMany({
    where: {
      origem: { startsWith: "funil:" },
      createdAt: { gte: new Date(agora.getTime() - JANELA_CONSULTA_MS) },
    },
    select: {
      id: true,
      name: true,
      phone: true,
      origem: true,
      lifecycleStage: true,
      customFields: true,
      createdAt: true,
      _count: { select: { messages: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const itens: ItemAtencao[] = [];
  for (const c of contatos) {
    const motivo = motivoAtencao({ ...c, mensagens: c._count.messages }, agora);
    if (motivo) itens.push({ contactId: c.id, nome: c.name, telefone: c.phone, motivo, desde: c.createdAt });
  }
  return itens;
}
