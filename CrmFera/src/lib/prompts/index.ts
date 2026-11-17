import { AGENTE_QUALIFICACAO } from "./agente-qualificacao";
import { AGENTE_CONFIRMACAO, AGENTE_NOSHOW } from "./agente-reuniao";
import { AGENTE_PROPOSTA } from "./agente-proposta";
import { AGENTE_FOLLOWUP, AGENTE_NUTRICAO, AGENTE_CARRINHO } from "./agente-relacionamento";
import type { DefinicaoAgente } from "./tipos";

/**
 * O roster padrão do CRM FERA. A recepção (porta de quem chega sem tag nenhuma) nasce do
 * `prompt-recepcao.ts`, fora desta lista.
 *
 * Prioridade = "quem está mais perto de fechar vence":
 * no-show 75 > confirmação 70 > proposta 60 > qualificação 50 > carrinho 40 > follow-up 20 > nutrição 10 > recepção.
 */
export const AGENTES_PADRAO: DefinicaoAgente[] = [
  AGENTE_QUALIFICACAO,
  AGENTE_CONFIRMACAO,
  AGENTE_NOSHOW,
  AGENTE_PROPOSTA,
  AGENTE_FOLLOWUP,
  AGENTE_NUTRICAO,
  AGENTE_CARRINHO,
];

/** Slugs do roster (a frente de roteamento usa para liberar os agentes nos números WAHA). */
export const SLUGS_AGENTES_PADRAO: string[] = AGENTES_PADRAO.map((a) => a.slug);

export function definicaoPorSlug(slug: string): DefinicaoAgente | undefined {
  return AGENTES_PADRAO.find((a) => a.slug === slug);
}

export type { DefinicaoAgente, TesteDeMesa } from "./tipos";
