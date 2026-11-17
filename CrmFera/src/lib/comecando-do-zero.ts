/**
 * LEAD COMEÇANDO DO ZERO: quem ainda não vende, está "se organizando" ou não tem oferta não é
 * descartado na hora. Os agentes listados em `AGENTES_COMECANDO_DO_ZERO` recebem o bloco abaixo no
 * fim do prompt: alinham expectativa (investimento de tempo, dinheiro e energia) e perguntam se
 * encaixa.
 *
 * No CRM FERA a lista nasce VAZIA (cada negócio decide se atende quem está começando). Para ligar,
 * coloque os slugs no ambiente `AGENTES_COMECANDO_DO_ZERO` (separados por vírgula). O texto não cita
 * valor: número só entra se o dono escrever, com o guarda autorizando.
 */

export type VozZero = "primeira" | "terceira";

export const AGENTES_COMECANDO_DO_ZERO: readonly string[] = String(process.env.AGENTES_COMECANDO_DO_ZERO ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const PERGUNTA_ENCAIXA = "Isso encaixa no seu momento atual?";

export const TAG_COMECANDO_DO_ZERO = "comecando-do-zero";

// Cada parte é uma mensagem ([QUEBRA]); cada parágrafo tem no máximo ~180 caracteres
// (guarda: 4 linhas de 46).
const TEXTO: readonly string[] = [
  "Se você está começando do zero, dá para começar do jeito certo.\n\n" +
    "O primeiro passo é deixar a sua oferta clara e atraente, e ligar o caminho que leva a pessoa até ela.",
  "Mas já precisamos alinhar uma coisa: não existe fórmula mágica.\n\n" +
    "Como qualquer negócio, exige investimento de tempo, dinheiro e energia. É preciso plantar para depois colher.\n\n" +
    PERGUNTA_ENCAIXA,
];

/** O texto em partes ([QUEBRA]). A voz não muda o texto (ele não fala em primeira pessoa). */
export function textoComecandoDoZero(_voz: VozZero = "primeira"): string[] {
  return [...TEXTO];
}

/** A pergunta de encaixe pode voltar depois dos combinados: não conta como pergunta repetida. */
export function ehPerguntaDeEncaixe(pergunta: string): boolean {
  return /encaixa\s+no\s+seu\s+momento\s+atual/i.test(pergunta);
}

/** Bloco que vai no fim do prompt dos agentes de `AGENTES_COMECANDO_DO_ZERO`. */
export function blocoComecandoDoZero(voz: VozZero = "primeira"): string {
  return [
    "## QUEM ESTÁ COMEÇANDO DO ZERO (vale mais que qualquer outra regra deste prompt)",
    "Quem ainda não vende, está começando do zero, está \"se organizando pra vender\" ou ainda não tem oferta NÃO é descartado na hora.",
    "Na primeira vez que a pessoa disser que está começando (ou que ainda não vende), responda com o texto abaixo, palavra por palavra (pode ajustar só a concordância). Cada bloco é uma parte separada por [QUEBRA]:",
    textoComecandoDoZero(voz).join("\n[QUEBRA]\n"),
    `Junto com essa mensagem, devolva a tag "${TAG_COMECANDO_DO_ZERO}" e estágio "conversando". A pergunta "${PERGUNTA_ENCAIXA}" é a ÚNICA pergunta dessa mensagem e fecha a mensagem.`,
    "Esse texto sai UMA vez na conversa. Se ela responder que encaixa, siga os objetivos normais adaptados a quem está começando: o que ela quer vender e para quem, o @ do Instagram, a meta dos próximos 3 meses, e então o próximo passo.",
    "Se ela disser que não encaixa, agradeça com respeito, deixe a porta aberta (\"qualquer coisa, me chama aqui\") e marque estágio \"futuro\". Sem insistir.",
  ].join("\n");
}
