import { config, gravarConfig } from "@/lib/config";

/**
 * O briefing do negócio, respondido pelo dono com as palavras dele, logo depois de receber o painel.
 * É a matéria-prima da primeira página de captura e dos posts que convidam para ela.
 * O FERABOT puxa daqui (`painel.py puxar`).
 */
export const PERGUNTAS_BRIEFING = [
  {
    id: "identidade_visual",
    titulo: "Identidade visual",
    ajuda: "Cores, fontes, logo, o clima das suas fotos. Tem um perfil ou site que você admira? Cole o link.",
  },
  {
    id: "estilo_comunicacao",
    titulo: "Estilo de comunicação",
    ajuda: "Como você fala: próxima, técnica, provocadora, acolhedora? Palavras que você usa e palavras que você nunca usaria.",
  },
  {
    id: "quem_atrair",
    titulo: "Pessoas que você quer atrair",
    ajuda: "Quem é o cliente ideal: momento de vida, o que já tentou, o que deseja. Pense em um cliente real que você adoraria repetir.",
  },
  {
    id: "quem_nao_atrair",
    titulo: "Pessoas que você não quer atrair",
    ajuda: "Quem dá trabalho e não combina com o seu jeito. Ajuda a página a afastar quem não é para você.",
  },
  {
    id: "problemas",
    titulo: "Problemas do mercado que você resolve",
    ajuda: "As dores que as pessoas já sabem que têm, com as palavras delas. E o que o mercado faz de errado sobre isso.",
  },
  {
    id: "resultados",
    titulo: "Resultados que você já gerou",
    ajuda: "Casos reais: quem era, como estava, o que mudou. Só o que aconteceu de verdade e que você pode mostrar.",
  },
  {
    id: "por_que_confiar",
    titulo: "Por que confiar em você",
    ajuda: "Sua história, formação, anos de prática, quantas pessoas atendeu, o que te diferencia. Só o que é real.",
  },
] as const;

export type IdBriefing = (typeof PERGUNTAS_BRIEFING)[number]["id"];
export type BriefingCliente = Partial<Record<IdBriefing, string>> & { atualizadoEm?: string };

const K_BRIEFING = "briefing_cliente";
const LIMITE_RESPOSTA = 4000;
/** Resposta curta demais não ajuda a página: abaixo disto a pergunta conta como em aberto. */
export const MINIMO_RESPOSTA = 20;

export function limparBriefing(entrada: Record<string, unknown>, agora = new Date()): BriefingCliente {
  const respostas = Object.fromEntries(
    PERGUNTAS_BRIEFING.map((p) => [p.id, typeof entrada[p.id] === "string" ? (entrada[p.id] as string).trim().slice(0, LIMITE_RESPOSTA) : ""]).filter(
      ([, v]) => v !== "",
    ),
  );
  return { ...respostas, atualizadoEm: agora.toISOString() };
}

export function respondidas(briefing: BriefingCliente): number {
  return PERGUNTAS_BRIEFING.filter((p) => (briefing[p.id] ?? "").length >= MINIMO_RESPOSTA).length;
}

export function briefingCompleto(briefing: BriefingCliente): boolean {
  return respondidas(briefing) === PERGUNTAS_BRIEFING.length;
}

export async function lerBriefing(): Promise<BriefingCliente> {
  const bruto = await config(K_BRIEFING);
  if (!bruto) return {};
  try {
    const dado = JSON.parse(bruto) as unknown;
    return dado && typeof dado === "object" ? (dado as BriefingCliente) : {};
  } catch {
    return {};
  }
}

export async function salvarBriefing(entrada: Record<string, unknown>): Promise<BriefingCliente> {
  const briefing = limparBriefing(entrada);
  await gravarConfig(K_BRIEFING, JSON.stringify(briefing));
  return briefing;
}
