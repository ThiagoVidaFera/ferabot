// Estagios do funil de vida do contato — definidos na FASE 0 (ver CONFIG.md).
// Fusao do conjunto do megaprompt com os status que o crm-leads ja opera.

export type EstagioKey =
  | "novo"
  | "frio"
  | "conversando"
  | "call_marcada"
  | "proposta"
  | "cliente"
  | "perdido"
  | "futuro"
  | "sem_resposta"
  | "pessoal"
  | "sem_automacao";

export type Estagio = {
  key: EstagioKey;
  label: string;
  cor: string;
};

export const ESTAGIOS: Estagio[] = [
  { key: "novo", label: "Novo", cor: "#6B7280" },
  { key: "frio", label: "Frio", cor: "#3B82F6" },
  { key: "conversando", label: "Conversando", cor: "#F59E0B" },
  { key: "call_marcada", label: "Call marcada", cor: "#8B5CF6" },
  { key: "proposta", label: "Analisando proposta", cor: "#EA580C" },
  { key: "cliente", label: "Cliente", cor: "#10B981" },
  { key: "perdido", label: "Perdido", cor: "#EF4444" },
  { key: "futuro", label: "Futuro", cor: "#64748B" },
  // Lead que recebeu nosso contato e sumiu — marcado à mão no painel de Leads.
  { key: "sem_resposta", label: "Sem resposta", cor: "#A855F7" },
  // Contato pessoal (família, amigos): NUNCA entra em automação — agente, régua, follow-up, disparo.
  { key: "pessoal", label: "Pessoal", cor: "#0EA5E9" },
  // Retirado das automações pelo botão do Follow-up: mesma trava do Pessoal, mas é lead de verdade.
  { key: "sem_automacao", label: "Sem automação", cor: "#78716C" },
];

export const ESTAGIO_KEYS = ESTAGIOS.map((e) => e.key);

/** Estágios em que NENHUM robô fala com o contato (agente, régua, follow-up, disparo, aviso). */
export const ESTAGIOS_SEM_AUTOMACAO = ["pessoal", "sem_automacao"];

export function semAutomacao(lifecycleStage: string | null | undefined): boolean {
  return ESTAGIOS_SEM_AUTOMACAO.includes(String(lifecycleStage ?? ""));
}

export function ehEstagio(v: string): v is EstagioKey {
  return (ESTAGIO_KEYS as string[]).includes(v);
}

export function estagio(key: string): Estagio {
  return ESTAGIOS.find((e) => e.key === key) ?? ESTAGIOS[0];
}

// Mapa de migracao vindo do crm-leads (Netlify Blobs `crm-status`).
export const MAPA_STATUS_CRM_LEADS: Record<string, EstagioKey> = {
  novo: "novo",
  frio: "frio",
  quente: "conversando",
  desqualificado: "perdido",
  futuro: "futuro",
  ganho: "cliente",
};
