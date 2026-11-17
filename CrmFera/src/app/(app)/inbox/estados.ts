/**
 * Estados de atendimento da conversa. Fica FORA de acoes.ts porque um arquivo
 * "use server" só pode exportar funções async — constante e tipo quebram o build.
 */
export type EstadoConversa = "andamento" | "destacada" | "arquivada" | "excluida";

/**
 * A aba de CALL MARCADA não é um estado próprio: ela é derivada do
 * `lifecycleStage` do contato. Assim a conversa entra lá sozinha, não importa
 * por onde a call foi marcada — tela do contato, agente, funil ou aqui. Um
 * estado paralelo criaria duas verdades sobre o mesmo fato.
 */
export type AbaInbox = EstadoConversa | "call_marcada";

export const ESTADOS_CONVERSA: Array<{ key: AbaInbox; label: string; icone: string }> = [
  { key: "andamento", label: "Em andamento", icone: "💬" },
  { key: "call_marcada", label: "Call marcada", icone: "📅" },
  { key: "destacada", label: "Destacadas", icone: "⭐" },
  { key: "arquivada", label: "Arquivadas", icone: "📦" },
];
