/** Definição de um agente padrão (o roster instalado pelo botão "Instalar agentes padrão"). */
export type TesteDeMesa = {
  nome: string;
  /** falas do lead, em ordem */
  falas: string[];
  /** o que o agente precisa fazer: lido por gente, não por asserção */
  espera: string;
  /** tags/estágio/origem do contato de teste antes da 1ª fala */
  contato?: { tags?: string[]; estagio?: string; origem?: string; campos?: Record<string, unknown> };
};

export type DefinicaoAgente = {
  slug: string;
  nome: string;
  descricao: string;
  prompt: string;
  gatilhoTag?: string;
  gatilhoEstagio?: string;
  gatilhoOrigem?: string;
  prioridade: number;
  /** modelo ao nascer; padrão gemini-2.5-flash. `claude-*` usa a API da Anthropic. */
  modelo?: string;
  /** modo ao nascer; padrão `sugere`. `autonomo` só por decisão explícita do dono. */
  modoPadrao?: "sugere" | "autonomo";
  /** nasce ligado? (só quando a porta existe de verdade) */
  ativoPadrao: boolean;
  /** por que nasce ligado/desligado: aparece no log da instalação */
  motivoAtivo: string;
  testesDeMesa: TesteDeMesa[];
};
