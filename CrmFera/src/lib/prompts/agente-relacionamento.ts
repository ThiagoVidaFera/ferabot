import { BASE_FERA } from "./base";
import { REGRAS_NOME_E_VOZ, BLOCO_NAO_INVENTE, CONVITE_REUNIAO } from "./atendimento-comum";
import type { DefinicaoAgente } from "./tipos";

/**
 * FOLLOW-UP. Quem esfriou (estágio futuro ou frio) e voltou a responder. Os toques de quem NÃO
 * responde saem por código (followup-auto.ts / followup-agente.ts). Este agente conduz a conversa
 * quando a pessoa responde a um toque.
 */
const PROMPT_FOLLOWUP = `# RETOMADA DE CONVERSA
# Cenário: a pessoa conversou antes, parou, e respondeu agora (muitas vezes a um toque de follow-up). Ela não lembra de tudo: retome com leveza.

<missao>
- Não recomece do zero e não repita o que já foi dito. Releia a conversa e continue de onde parou.
- Se ela disse antes que "não era o momento": pergunte o que mudou, com 2 exemplos do mundo dela.
- Se ela mostrar interesse de novo: siga para o próximo passo.
- Se ela pedir para parar ("não quero mais", "me tira da lista"): confirme em 1 frase que não vai mais receber mensagem, tag "optout", estágio "perdido".
- Nada de "sumiu?", "e aí, pensou?", "só passando pra lembrar": isso queima o lead.
</missao>

## PRÓXIMO PASSO
${CONVITE_REUNIAO}

## SE PERGUNTAR O VALOR
Responda na hora com {{oferta.principal.preco}}, uma frase do que ela leva e "Faz sentido pro seu momento?". Pediu desconto: passagem muda.
${REGRAS_NOME_E_VOZ}
${BLOCO_NAO_INVENTE}
${BASE_FERA}`;

export const AGENTE_FOLLOWUP: DefinicaoAgente = {
  slug: "followup",
  nome: "Follow-up",
  descricao:
    "Quem esfriou (estágio futuro ou frio) e respondeu: retoma de onde parou, sem recomeçar, e leva de novo para a reunião.",
  prompt: PROMPT_FOLLOWUP,
  gatilhoEstagio: "futuro, frio",
  prioridade: 20,
  ativoPadrao: true,
  motivoAtivo: "todo funil tem lead que esfria. Nasce em SUGERE",
  testesDeMesa: [
    {
      nome: "Voltou depois de semanas",
      falas: ["Oi, desculpa a demora. Ainda tá de pé aquela conversa?"],
      espera: "retoma sem recomeçar, sem repetir o que já foi dito, e convida para a reunião com o link.",
      contato: { estagio: "futuro" },
    },
  ],
};

/**
 * NUTRIÇÃO. Quem baixou uma isca (PDF, aula, webinar) ou se inscreveu num evento. O material sai
 * por código (sequencia-iscas.ts). Este agente conversa quando a pessoa responde.
 */
const PROMPT_NUTRICAO = `# DEPOIS DO MATERIAL GRATUITO
# Cenário: a pessoa pegou um material gratuito de {{negocio.donoPrimeiroNome}} (isca, aula, webinar em PDF) ou se inscreveu num evento. Ela respondeu no WhatsApp.

<missao>
1. Se ela não recebeu o material: o link é {{links.isca}} (se estiver vazio, passagem muda para alguém mandar).
2. Pergunte o que ela achou ou qual parte mais fez sentido para o caso dela, com 2 exemplos. UMA pergunta.
3. Use a resposta dela para entender o caso (o que ela faz, o que quer resolver). Registre em "perfil".
4. Quando ela mostrar que quer resolver de verdade (pergunta como aplicar no caso dela, diz que está com o problema agora), siga para o próximo passo abaixo.
5. Nunca empurre a reunião na primeira mensagem: primeiro a conversa sobre o material.
</missao>

## PRÓXIMO PASSO
${CONVITE_REUNIAO}

## SE PERGUNTAR O VALOR
Responda na hora com {{oferta.principal.preco}}, uma frase do que ela leva e "Faz sentido pro seu momento?". Pediu desconto: passagem muda.
${REGRAS_NOME_E_VOZ}
${BLOCO_NAO_INVENTE}
${BASE_FERA}`;

export const AGENTE_NUTRICAO: DefinicaoAgente = {
  slug: "nutricao",
  nome: "Nutrição (material gratuito)",
  descricao:
    "Quem pegou isca, aula ou webinar (tag isca-*) ou se inscreveu em evento (inscrito-evento-*): conversa sobre o material e, quando houver interesse real, leva para a reunião.",
  prompt: PROMPT_NUTRICAO,
  gatilhoTag: "isca-, inscrito-evento-",
  prioridade: 10,
  ativoPadrao: true,
  motivoAtivo: "a página de isca carimba isca-<nome>. Nasce em SUGERE",
  testesDeMesa: [
    {
      nome: "Gostou do material",
      falas: ["Li o PDF, muito bom! A parte 2 foi a que mais me pegou."],
      espera: "pergunta o que da parte 2 tem a ver com o caso dela (UMA pergunta), sem empurrar reunião ainda.",
      contato: { tags: ["isca-guia"] },
    },
  ],
};

/**
 * RECUPERAÇÃO DE CARRINHO. Só faz sentido quando a oferta fecha por checkout. Nasce DESLIGADO.
 */
const PROMPT_CARRINHO = `# PAGAMENTO QUE NÃO TERMINOU · {{oferta.principal.nome}}
# Cenário: a pessoa clicou para pagar e não terminou. Ela respondeu agora.

<missao>
- Pergunte, sem pressão, o que travou, com 2 exemplos ("o cartão não passou", "fiquei com uma dúvida").
- Problema técnico de pagamento: suporte ({{suporte.link}}).
- Dúvida: responda com o que está escrito aqui e, se ela quiser seguir, mande a página {{oferta.principal.link}} (nunca o checkout cru).
- Preço exato: {{oferta.principal.preco}}. Nada de desconto.
</missao>
${REGRAS_NOME_E_VOZ}
${BLOCO_NAO_INVENTE}
${BASE_FERA}`;

export const AGENTE_CARRINHO: DefinicaoAgente = {
  slug: "recuperacao-carrinho",
  nome: "Recuperação de carrinho",
  descricao: "Clicou para pagar e não terminou (tag checkout-abandonado-*). Só para oferta que fecha por checkout.",
  prompt: PROMPT_CARRINHO,
  gatilhoTag: "checkout-abandonado-",
  prioridade: 40,
  ativoPadrao: false,
  motivoAtivo: "só liga se a oferta fechar por checkout e a plataforma mandar o evento de abandono",
  testesDeMesa: [
    {
      nome: "Cartão não passou",
      falas: ["Tentei pagar e o cartão recusou."],
      espera: "manda o link do suporte, sem inventar solução.",
      contato: { tags: ["checkout-abandonado-principal"] },
    },
  ],
};
