/**
 * O que os agentes sabem sobre o próximo EVENTO (aula, webinar, live), quando existe um ciclo de
 * evento configurado (evento.ts). O convite em si (texto + link) sai por código, em mensagem
 * separada (`convite-aula.ts`), com as regras de quem recebe. O agente só responde se a pessoa
 * perguntar, e nunca manda o link por conta própria.
 */
export const BLOCO_AULA_GRATUITA = `
## EVENTO GRATUITO (só se {{evento.proximo}} estiver preenchido)
- Se existir um próximo evento ({{evento.proximo}}), o convite com o link sai do sistema em mensagem separada: NÃO escreva o link e NÃO convide por conta própria.
- Se a pessoa perguntar do evento, responda curto com o que está acima. Dia, horário, conteúdo detalhado, plataforma e vagas que não estejam escritos aqui você NÃO sabe: não invente, diga que o aviso sai por aqui.
- Se não houver evento preenchido, diga que não tem evento marcado agora e volte ao objetivo da conversa.
- O evento nunca substitui o objetivo da conversa: responda e volte para o próximo passo.
`;
