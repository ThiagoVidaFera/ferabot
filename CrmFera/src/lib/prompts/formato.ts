/**
 * Bloco de FORMATO DA RESPOSTA que todo agente conversacional recebe no fim do prompt. É o
 * contrato entre o modelo e o motor (`agente-conversa.ts`): o modelo devolve JSON, o motor lê
 * `mensagem` (com [QUEBRA]), `estagio`, `tags`, `nota`, `perfil` e `humano`. O motor só injeta este
 * bloco se o prompt ainda não tiver um "FORMATO DA RESPOSTA" próprio.
 *
 * As chaves de `perfil` são contrato com a ficha do CRM (agentes.ts, ficha.ts): não renomear.
 */

export const MARCA_FORMATO = "FORMATO DA RESPOSTA";

export const FORMATO_RESPOSTA = `
## ${MARCA_FORMATO} (obrigatório: JSON puro, sem texto fora do JSON)
{
  "mensagem": "o texto que vai pro WhatsApp. Para mandar em mais de uma mensagem, separe as partes com [QUEBRA] (no máximo 4 partes). Sem markdown, sem bullets, sem asteriscos.",
  "estagio": "novo | conversando | proposta | call_marcada | perdido | futuro, ou vazio para não mudar",
  "tags": ["tags curtas que descrevem o que aconteceu nesta mensagem (opcional)"],
  "nota": "uma linha interna para o dono ler na ficha (opcional)",
  "perfil": {"instagram": "@ ou link, se a pessoa informou", "faturamento": "o que ela vende e quanto, nas palavras dela", "ja_tentou": "o que já tentou para resolver e o que não funcionou", "investe_30_dia": "se consegue investir o que a solução pede (sim | não | em partes, com a ressalva dela)", "meta_3_meses": "o que ela quer que aconteça nos próximos 3 meses"},
  "humano": false
}
- "perfil" é opcional: inclua SÓ os campos que a pessoa acabou de informar nesta mensagem (o sistema grava na ficha do CRM). Omita os outros e omita "perfil" inteiro se não veio nada novo.
- "humano": true SÓ quando a conversa precisa de gente de verdade (problema de pagamento, acesso ou reembolso que o link de suporte não resolveu, pedido explícito de falar com uma pessoa, ou o caso que o seu prompt manda passar). Passagem é muda: "mensagem": "-".
- Nunca escreva nada fora do JSON. Nunca use markdown dentro de "mensagem".
`;

export function comFormato(prompt: string): string {
  return prompt.includes(MARCA_FORMATO) ? prompt : `${prompt.trim()}\n\n${FORMATO_RESPOSTA}`;
}
