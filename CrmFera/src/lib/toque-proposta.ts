import { db } from "@/lib/db";
import { horarioDeEnvio } from "@/lib/sequencia-iscas-copy";
import { cancelarSequenciaProposta } from "@/lib/sequencia-proposta";

/**
 * Marca "Proposta enviada" do Inbox.
 *
 * Até 08/11/2026 este arquivo agendava, 72h depois do botão, o lembrete da oferta da estação (D+3) e o
 * processava a cada minuto. Em 09/11/2026 esse lembrete virou um dos 7 passos da sequência pós-proposta
 * (`sequencia-proposta.ts`, D+1 a D+90), que se cria sozinha quando a proposta está registrada
 * (`proposta-contato.ts`). O motor de envio daqui foi apagado.
 *
 * O que ficou:
 *  - `customFields.lembrete_proposta`: só a MARCA, já resolvida. `convite-aula.ts` lê o `agendadoEm` dela
 *    (e o de `toque_proposta`, registro antigo do 👀 de 48h) para saber que a proposta foi marcada pelo botão;
 *  - `lerToque` e `decidirToque`, regras puras que têm teste.
 */

export const CHAVE_LEMBRETE = "lembrete_proposta";
/** chave do toque de 48h, aposentado: só limpada quando o botão é desligado */
const CHAVE_LEGADA = "toque_proposta";
const OPT_OUT = ["controle-optout", "optout", "controle-nao-perturbe"];

export type ToqueProposta = {
  agendadoEm: string;
  devidoEm: string;
  status: "pendente" | "enviado" | "cancelado" | "pulado";
  motivo?: string;
  resolvidoEm?: string;
};

export type ContextoToque = {
  lifecycleStage: string;
  tags: string[];
  /** última mensagem recebida do lead */
  ultimaDoLead: Date | null;
  /** número oficial (Cloud API): só aceita template depois de 24h sem o lead falar */
  oficial: boolean;
};

export type Decisao =
  | { acao: "esperar"; motivo: string }
  | { acao: "cancelar"; motivo: string }
  | { acao: "enviar" };

export function lerToque(campos: unknown, chave: string = CHAVE_LEMBRETE): ToqueProposta | null {
  const t = (campos as Record<string, unknown> | null)?.[chave];
  if (!t || typeof t !== "object") return null;
  const r = t as Partial<ToqueProposta>;
  return typeof r.devidoEm === "string" && typeof r.agendadoEm === "string" && r.status
    ? (r as ToqueProposta)
    : null;
}

/** Regra pura: o que fazer com um toque pendente neste instante. */
export function decidirToque(t: ToqueProposta, c: ContextoToque, agora: Date): Decisao {
  if (t.status !== "pendente") return { acao: "esperar", motivo: "já resolvido" };
  if (agora.getTime() < new Date(t.devidoEm).getTime()) return { acao: "esperar", motivo: "ainda não venceu" };
  if (c.lifecycleStage !== "proposta") return { acao: "cancelar", motivo: `estágio mudou pra ${c.lifecycleStage}` };
  if (c.tags.some((x) => OPT_OUT.includes(x))) return { acao: "cancelar", motivo: "pediu pra não receber mensagem" };
  if (c.ultimaDoLead && c.ultimaDoLead.getTime() > new Date(t.agendadoEm).getTime()) {
    return { acao: "cancelar", motivo: "lead respondeu depois da proposta" };
  }
  if (!horarioDeEnvio(agora)) return { acao: "esperar", motivo: "fora do horário (8h–21h)" };
  // Passaram 72h sem o lead falar: na API oficial a janela de 24h já fechou.
  if (c.oficial) return { acao: "cancelar", motivo: "número oficial: fora da janela de 24h" };
  return { acao: "enviar" };
}

async function gravarMarca(contactId: string, marca: ToqueProposta | null, chave: string) {
  const c = await db.contact.findUnique({ where: { id: contactId }, select: { customFields: true } });
  if (!c) return;
  const resto = { ...((c.customFields ?? {}) as Record<string, unknown>) };
  delete resto[chave];
  await db.contact.update({
    where: { id: contactId },
    data: { customFields: (marca ? { ...resto, [chave]: marca } : resto) as never },
  });
}

/**
 * Botão "Proposta enviada" ligado: grava só a marca `lembrete_proposta`, já resolvida (não reagenda se
 * existe). A sequência de follow-up se cria sozinha, pelo cron, quando a proposta está REGISTRADA no CRM.
 */
export async function agendarToqueProposta(contactId: string, agora = new Date()) {
  const c = await db.contact.findUnique({ where: { id: contactId }, select: { customFields: true } });
  if (!c || lerToque(c.customFields, CHAVE_LEMBRETE)) return;
  await gravarMarca(
    contactId,
    {
      agendadoEm: agora.toISOString(),
      devidoEm: agora.toISOString(),
      status: "cancelado",
      motivo: "absorvido pela sequência pós-proposta (D+1 a D+90)",
      resolvidoEm: agora.toISOString(),
    },
    CHAVE_LEMBRETE,
  );
}

/** Desliga o botão: as marcas somem e a sequência de follow-up do contato é encerrada. */
export async function cancelarToqueProposta(contactId: string) {
  await gravarMarca(contactId, null, CHAVE_LEGADA);
  await gravarMarca(contactId, null, CHAVE_LEMBRETE);
  await cancelarSequenciaProposta(contactId);
}
