/**
 * A mensagem do lead é uma RESPOSTA AUTOMÁTICA (ausência, "deixe sua mensagem",
 * saudação do WhatsApp Business)? (02/11/2026)
 *
 * Nenhum agente responde robô: num número comercial o agente conversava com
 * autoresponder de "não estou disponível" (Estela, Luiz Henrique) e ainda
 * disparava o texto de contorno em cima dele. Checagem determinística, antes
 * do modelo. Só frases típicas de ausência/caixa postal: na dúvida, NÃO casa
 * (o custo de errar pro outro lado é o agente ficar mudo numa fala de gente,
 * e o follow-up de 48h cobre).
 */
const ANTES = "(?<![\\p{L}\\p{N}])";
const DEPOIS = "(?![\\p{L}\\p{N}])";

const PADROES: RegExp[] = [
  new RegExp(`${ANTES}(?:mensagem|resposta|atendimento) autom[áa]tic[ao]${DEPOIS}`, "iu"),
  new RegExp(`deixe (?:a\\s+)?(?:sua|seu)\\s+(?:mensagem|recado)`, "iu"),
  new RegExp(`n[ãa]o estou dispon[íi]vel no momento`, "iu"),
  new RegExp(`no momento n[ãa]o (?:posso|consigo) (?:interagir|atender|responder)`, "iu"),
  new RegExp(`(?:logo que|assim que) (?:poss[íi]vel|eu puder)[^.]{0,30}(?:retorn|respond|respondo)`, "iu"),
  new RegExp(`fora do hor[áa]rio (?:de )?(?:atendimento|comercial)`, "iu"),
  new RegExp(`hor[áa]rio de atendimento`, "iu"),
  new RegExp(`estamos (?:ausentes|fora)${DEPOIS}`, "iu"),
  new RegExp(`agrade[çc]o a sua mensagem[^.]{0,40}n[ãa]o estou`, "iu"),
];

export function ehRespostaAutomatica(texto: string | null | undefined): boolean {
  const t = String(texto ?? "").trim();
  if (!t || t.length > 600) return false;
  return PADROES.some((p) => p.test(t));
}

/**
 * Quem respondeu parece ser secretária/assistente/equipe do lead, não o lead?
 * Caso real: "Oi! Aqui é o Argon, da equipe do Renato…" — o agente respondeu o
 * Argon duas vezes, chamando-o pelo nome. Decisão: o robô cala e o dono assume (mesmo tratamento de "é robô?"). Exige AUTO-APRESENTAÇÃO
 * ("aqui é o X, da equipe do Y" / "sou a secretária do Dr. Y"): fala solta tipo
 * "preciso de equipe de vendas" ou "sou assistente de marketing" não casa, porque
 * cada acerto vira `humano` (permanente).
 */
const PADROES_ASSISTENTE: RegExp[] = [
  /(?:aqui\s+[ée]|sou|falo)\s+(?:o|a)?\s*\p{L}+[^.!?]{0,25}?,?\s*(?:da|de)\s+equipe\s+d[oae]\s+\p{L}+/iu,
  /(?:[Ss]ou|[Aa]qui\s+[ée])\s+(?:a|o)?\s*(?:assistente|secret[áa]ri[ao])\s+(?:do|da|de)\s+(?:Dr\.?|Dra\.?|Sr\.?|Sra\.?)?\s*\p{Lu}\p{Ll}+/u,
];

export function pareceAssistente(texto: string | null | undefined): boolean {
  const t = String(texto ?? "").trim();
  if (!t || t.length > 600) return false;
  return PADROES_ASSISTENTE.some((p) => p.test(t));
}

/**
 * A fala do lead só encerra a conversa (agradecimento, "ok", ".", emoji)?
 * (02/11/2026) O agente tentava puxar pergunta em cima de "Tranquilo. Grato pelo
 * apoio", os guardas barravam e saía o texto de contorno. Encerramento não pede
 * resposta. A fala INTEIRA tem de ser só agradecimento/aceite: "Obrigado, quero
 * sim, me manda o link" não encerra. "ok/certo" sem agradecimento só encerra
 * quando a nossa última fala NÃO foi pergunta — se foi, é a resposta dele.
 */
const AGRADECE = /^(?:obrigad[oa]s?|grat[oa]s?|valeu|agrade[çc]o|agradecid[oa])$/iu;
const ACEITA = /^(?:ok(?:ay)?|blz|beleza|certo|tranquilo|combinado|show|top|perfeito|fechado|tmj|entendi|entendido)$/iu;
const LIGACAO = /^(?:muito|mto|bem|tudo|pelo|pela|a|o|ajuda|apoio|atenção|atencao|retorno|tempo|t[áa]|bom|de|nada)$/iu;

export function ehEncerramento(texto: string | null | undefined, nossaUltimaFoiPergunta: boolean): boolean {
  const t = String(texto ?? "").trim();
  if (!t) return true;
  // sem nenhuma letra ou número: ".", "👍", "🙏🙏"
  if (!/[\p{L}\p{N}]/u.test(t)) return true;
  if (t.includes("?") || t.length > 80) return false;
  const palavras = t.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  if (palavras.length > 6) return false;
  const soCasa = palavras.every((w) => AGRADECE.test(w) || ACEITA.test(w) || LIGACAO.test(w));
  if (!soCasa) return false;
  if (palavras.some((w) => AGRADECE.test(w))) return true;
  return palavras.some((w) => ACEITA.test(w)) && !nossaUltimaFoiPergunta;
}
