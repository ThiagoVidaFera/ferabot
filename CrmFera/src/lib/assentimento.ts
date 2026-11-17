/**
 * O lead disse "sim" ao convite do resumo? (15/11/2026)
 *
 * Só conta quando a mensagem INTEIRA é feita de palavras de assentimento: "Pode", "Pode mandar
 * sim!", "Bom dia! Pode", "👍". Qualquer palavra fora da lista (pergunta, preço, dúvida, recusa,
 * texto longo) devolve `false` e a conversa vai para gente. Preferimos errar para o lado de
 * passar pro humano: a proposta é pública e o prazo dela começa a correr.
 */

const MAX_PALAVRAS = 8;

/** Palavras que, sozinhas, já dizem "sim". */
const FORTES = new Set([
  "pode", "sim", "manda", "mande", "mandar", "envia", "envie", "enviar", "claro", "quero", "queria",
  "gostaria", "adoraria", "bora", "vamos", "ok", "okay", "blz", "beleza", "combinado", "show", "perfeito",
  "otimo", "certeza", "favor", "aguardo", "aguardando", "topo", "topado", "aham", "uhum", "pf", "pfv",
]);

/** Palavras neutras que podem acompanhar um "sim" sem mudar o sentido. */
const NEUTRAS = new Set([
  "vai", "la", "ai", "aqui", "mesmo", "certo", "legal", "top", "isso", "com", "por", "favor", "obrigado",
  "obrigada", "valeu", "fico", "no", "na", "ja", "so", "tudo", "bem", "bom", "boa", "dia", "tarde", "noite",
  "oi", "ola", "e", "o", "a", "um", "me", "que", "mais", "uma", "vez", "ver", "resumo", "de", "para", "pra",
  "se", "quiser", "puder", "pode", "obg", "agradeco",
]);

const EMOJIS_SIM = /[👍🙏✅👏🤝💪🙌]/gu;

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(EMOJIS_SIM, " pode ")
    .replace(/[^a-z0-9\s?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function ehAssentimento(texto: string | null | undefined): boolean {
  if (!texto) return false;
  const limpo = normalizar(texto);
  if (!limpo || limpo.includes("?")) return false;
  const palavras = limpo.split(" ");
  if (palavras.length > MAX_PALAVRAS) return false;
  if (!palavras.every((p) => FORTES.has(p) || NEUTRAS.has(p))) return false;
  return palavras.some((p) => FORTES.has(p));
}
