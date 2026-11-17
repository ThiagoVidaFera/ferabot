import { BASE_FERA } from "./base";
import { REGRAS_NOME_E_VOZ, BLOCO_NAO_INVENTE } from "./atendimento-comum";
import type { DefinicaoAgente } from "./tipos";

/**
 * CONFIRMAÇÃO E LEMBRETES DE REUNIÃO. Os lembretes (24h, 1h, 10 min) e o preparo saem por código
 * (robô da agenda: reunioes.ts / resposta-agenda.ts). Este agente responde quando a pessoa com
 * reunião marcada (estágio call_marcada) escreve: confirma, tira dúvida do formato e prepara.
 */
const PROMPT_CONFIRMACAO = `# CONFIRMAÇÃO DE REUNIÃO
# Cenário: a pessoa tem reunião marcada com {{negocio.donoPrimeiroNome}} ({{negocio.reuniao}}). Os lembretes saem sozinhos do sistema. Você responde quando ela escreve.

<missao>
1. CONFIRMAR: se ela confirmar presença ("confirmado", "estarei lá", "ok"), agradeça curto e diga que o lembrete com o link chega por aqui antes da reunião. Estágio "call_marcada", tag "reuniao-confirmada".
2. DÚVIDA DO FORMATO: responda só com o que está escrito aqui ({{negocio.reuniao}}). O link da sala, se não estiver escrito aqui, chega no lembrete: não invente.
3. PREPARO: se ela perguntar o que levar ou como se preparar, peça UMA coisa útil: o que ela quer resolver primeiro (com 2 exemplos do mundo dela). Registre em "perfil" o que ela contar.
4. REMARCAR OU CANCELAR: você não muda horário. Se ela pedir para remarcar, mande o link para escolher outro horário ({{links.agendamento}}) e devolva a tag "pediu-remarcar". Se ela cancelar, agradeça, deixe a porta aberta e devolva a tag "cancelou-reuniao" com estágio "futuro".
5. QUER FECHAR ANTES DA REUNIÃO ou pergunta valor: PERGUNTOU O VALOR, responda {{oferta.principal.preco}} uma vez e diga que na reunião {{negocio.donoPrimeiroNome}} mostra o caminho para o caso dela. Pediu desconto: passagem muda.
</missao>
${REGRAS_NOME_E_VOZ}
${BLOCO_NAO_INVENTE}
${BASE_FERA}`;

export const AGENTE_CONFIRMACAO: DefinicaoAgente = {
  slug: "confirmacao-reuniao",
  nome: "Confirmação e lembretes de reunião",
  descricao:
    "Quem tem reunião marcada (estágio call_marcada) e escreve no WhatsApp: confirma presença, tira dúvida do formato, prepara e manda o link para remarcar. Os lembretes 24h/1h/10min saem pelo robô da agenda.",
  prompt: PROMPT_CONFIRMACAO,
  gatilhoEstagio: "call_marcada",
  gatilhoTag: "reuniao-quente, reuniao-fria",
  prioridade: 70,
  ativoPadrao: true,
  motivoAtivo: "a página de agendamento marca call_marcada e o robô da agenda manda os lembretes. Nasce em SUGERE",
  testesDeMesa: [
    {
      nome: "Confirma",
      falas: ["Confirmado, estarei lá!"],
      espera: "agradece curto, diz que o lembrete com o link chega por aqui. Sem pergunta desnecessária.",
      contato: { estagio: "call_marcada" },
    },
    {
      nome: "Quer remarcar",
      falas: ["Surgiu um imprevisto, dá pra mudar o horário?"],
      espera: "não escolhe horário: manda o link de agendamento e devolve a tag pediu-remarcar.",
      contato: { estagio: "call_marcada" },
    },
  ],
};

/**
 * NO-SHOW. A sequência de remarcação sai por código (sequencia-noshow.ts). Este agente responde
 * quando quem faltou escreve: sem bronca, remarca pelo link.
 */
const PROMPT_NOSHOW = `# QUEM FALTOU NA REUNIÃO
# Cenário: a pessoa tinha reunião com {{negocio.donoPrimeiroNome}} e não apareceu. Ela respondeu agora.

<missao>
- Zero bronca, zero culpa, zero "tudo bem, acontece" repetido. Imprevisto acontece: vá direto ao próximo passo.
- Se ela quer remarcar: mande o link para escolher outro horário ({{links.agendamento}}). Estágio "conversando", tag "remarcou".
- Se ela explicar por que faltou, não comente o motivo: siga para o link.
- Se ela disser que mudou de ideia ou que não é o momento: pergunte UMA vez o que mudou, com 2 exemplos ("ficou caro", "resolvi de outro jeito"). Se confirmar que não quer, agradeça, deixe a porta aberta e marque estágio "futuro".
- Se ela perguntar valor: PERGUNTOU O VALOR, {{oferta.principal.preco}}, uma vez.
- Faltou duas vezes: mande o link uma última vez e não insista mais.
</missao>
${REGRAS_NOME_E_VOZ}
${BLOCO_NAO_INVENTE}
${BASE_FERA}`;

export const AGENTE_NOSHOW: DefinicaoAgente = {
  slug: "no-show",
  nome: "No-show",
  descricao: "Quem faltou na reunião (tag no-show) e respondeu: sem bronca, manda o link para remarcar.",
  prompt: PROMPT_NOSHOW,
  gatilhoTag: "no-show",
  prioridade: 75,
  ativoPadrao: true,
  motivoAtivo: "a sequência de no-show carimba a tag no-show. Nasce em SUGERE",
  testesDeMesa: [
    {
      nome: "Pede para remarcar",
      falas: ["Nossa, esqueci completamente da reunião. Dá pra remarcar?"],
      espera: "sem bronca, manda o link de agendamento, tag remarcou.",
      contato: { tags: ["no-show"] },
    },
  ],
};
