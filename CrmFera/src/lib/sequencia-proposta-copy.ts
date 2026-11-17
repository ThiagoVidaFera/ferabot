import { ofertaVigente, LINK_CHECKOUT_CONSULTORIA, nomeParaVocativo } from "@/lib/oferta-sazonal";
import { negocio } from "@/lib/negocio";
import type { OfertaDoCatalogo } from "@/lib/proposta-contato";
import type { ConteudoSugerido } from "@/lib/conteudos-followup";

/**
 * Textos da sequência pós-proposta v2 (D+1, D+3, D+7, D+15, D+30, D+60, D+90 e o toque do esqueleto).
 *
 * Funções puras. Cada uma devolve o texto, ou `null` quando faltam dados reais (nunca inventamos:
 * novidade, conteúdo, ticket e condição da estação só entram se existirem). Regras que valem aqui:
 *  - nada de "dúvida?", "10 minutos", "sem compromisso", "pode ignorar" nem pedido de desculpa;
 *  - uma piada por mensagem, na primeira linha ou no fecho, e nunca na garantia, na parcela ou na conta;
 *  - `tomSerio` troca a primeira linha por uma neutra e remove a piada;
 *  - parágrafo de até 4 linhas, linha em branco entre blocos, sem emoji com seletor de variação;
 *  - VALOR E LINK DE PAGAMENTO SÓ PARA QUEM PERGUNTOU PREÇO (`perguntouPreco`, 13/11/2026): os demais
 *    recebem a versão sem R$ e sem checkout; a mensagem da proposta (D+1) termina em validação;
 *  - aposentados em 13/11/2026: "relacionamento tóxico" e a "Conta de guardanapo" com preço.
 */

export type DiaSequencia = 1 | 3 | 7 | 15 | 30 | 60 | 90;

export type ContextoTexto = {
  nome: string | null | undefined;
  oferta: OfertaDoCatalogo;
  ofertaBase: string;
  /** preço total da oferta registrada, em centavos */
  precoTotalCentavos: number;
  /** parcela mensal (ex.: 15x de R$ 500); null quando a oferta não tem parcelamento definido */
  parcelaCentavos: number | null;
  linkProposta: string;
  /** dia em que a proposta foi enviada */
  inicio: Date;
  agora: Date;
  tomSerio: boolean;
  /** "o que mais trava", nas palavras do lead (formulário/conversa) */
  trava?: string | null;
  /** "pelo YouTube", "pelo digital"… */
  canal: string;
  /** novidade real e datada (Setting); sem ela o D+30 só sai se houver condição vigente */
  novidade?: string | null;
  /** conteúdo nosso que o lead ainda não recebeu (biblioteca ou Setting); null = o D+15 usa o dado real */
  conteudo?: ConteudoSugerido | null;
  /** quantos toques já saíram (para o D+90 dizer a verdade) */
  nToques: number;
  /** o lead perguntou preço/valor na conversa: só então valor e link de pagamento entram */
  perguntouPreco?: boolean;
};

/** Pergunta final da mensagem de proposta: validação, não opções. */
export const VALIDACAO = "Faz sentido pro teu momento?";

/**
 * Dado real do negócio que os toques podem citar (ambiente `FATO_FUNIL`, com fonte e data no próprio
 * texto). Vazio = os toques saem sem dado. Nunca inventar: número sem fonte não entra.
 */
export const FATO_FUNIL = String(process.env.FATO_FUNIL ?? "").trim();

/** Junta os blocos tirando os vazios (o FATO_FUNIL pode não existir). */
const juntar = (blocos: string[]): string => blocos.filter((b) => b && b.trim()).join("\n\n");

const VALIDADE_DIAS = 3;

// O formatador do pt-BR separa "R$" do número com espaço não separável; WhatsApp e guardas esperam espaço comum.
const brl = (centavos: number): string =>
  (centavos / 100)
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
    .replace(/ /g, " ");

function ddmm(d: Date): string {
  return d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" });
}

/** "09/11, 23h59": a proposta vale 3 dias. */
export function validadeDaProposta(inicio: Date): string {
  return `${ddmm(new Date(inicio.getTime() + VALIDADE_DIAS * 86_400_000))}, 23h59`;
}

function minuscula(t: string): string {
  const s = t.trim().replace(/[.!?\s]+$/u, "");
  if (!s) return s;
  const primeira = s.split(/\s+/)[0] ?? "";
  // sigla (CRM, SDR) ou marca com maiúscula no meio (WhatsApp, YouTube) fica como está
  if (/^[A-ZÀ-Ú]{2,}/u.test(primeira) || /^[A-ZÀ-Ú][a-zà-ú]+[A-ZÀ-Ú]/u.test(primeira)) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/**
 * A "maior trava" vem de campo livre do formulário e muitas vezes é um rótulo curto ou truncado
 * ("onde obter", "Fontes de aquisicao"). Só entra na mensagem com 2+ palavras e 12+ letras, e
 * sempre entre aspas, do jeito que o lead marcou (nunca reescrita numa frase nossa).
 */
export function travaUtil(t: string | null | undefined): string | null {
  const limpa = (t ?? "").trim().replace(/[.!?\s]+$/u, "");
  if (limpa.length < 12 || limpa.split(/\s+/).length < 2) return null;
  return limpa.slice(0, 140);
}

/** Vocativo com vírgula ("Pedro, ") ou vazio quando o nome não parece nome de gente. */
function voc(nome: string | null | undefined): string {
  const n = nomeParaVocativo(nome);
  return n ? `${n}, ` : "";
}

/** "Pedro" ou "" */
function so(nome: string | null | undefined): string {
  return nomeParaVocativo(nome);
}

/** Maiúscula na primeira letra, pulando o asterisco de negrito ("*o que…" vira "*O que…"). */
function cap(t: string): string {
  return t.replace(/^(\*?)(.)/u, (_m, a: string, b: string) => `${a}${b.toUpperCase()}`);
}

/** D+1 · resumo da conversa (aspas). */
export function textoD1(c: ContextoTexto): string {
  const nome = so(c.nome);
  const abertura = c.tomSerio
    ? cap(`*${voc(nome)}resumi a nossa conversa em 1 minuto, com as suas palavras.*`)
    : [
        "*“Li rápido e depois eu volto com calma.”*",
        "É a frase mais dita depois de uma proposta, e a gente respeita. Só que proposta lida às 22h, depois de um dia de trabalho, vira leitura de bula.",
      ].join("\n\n");

  // Entregas neutras de gênero (a do canal fala "antes de ela gravar") e só duas, para a lista caber.
  const entregas = c.oferta.entregas.filter((e) => !/\bela\b/i.test(e)).slice(0, 2);
  const fecho = c.oferta.garantia
    ? `E a gente não larga no meio: ${c.oferta.garantia}.`
    : "Escopo fechado e escrito, tudo combinado antes de começar.";
  const travaLead = travaUtil(c.trava);
  const trava = travaLead
    ? `Então resumi do jeito que a gente conversou. Você marcou como a sua maior trava: “${travaLead}”.`
    : "Então resumi do jeito que a gente conversou.";

  return [
    abertura,
    trava,
    `Por isso a gente monta com você:\n${entregas.map((e) => `• ${e}`).join("\n")}`,
    fecho,
    `🔗 Proposta completa: ${c.linkProposta}`,
    `A proposta vale até ${validadeDaProposta(c.inicio)}.`,
    VALIDACAO,
  ].join("\n\n");
}

/** Primeira linha (humor) de cada janela da oferta da estação. */
const ABERTURA_JANELA: Record<string, string> = {
  "black-friday-2026": "*Black Friday dura um mês. Decisão adiada dura o ano inteiro.*",
  "natal-2026": "*Papai Noel não parcela. A gente parcela.* 🎅",
  "ano-novo-2027": "*Em 31/12 todo mundo começa em 1º de janeiro. Em 2 de janeiro, quase ninguém.*",
  "carnaval-2027": "*Carnaval passa em 4 dias. Funil montado fica o ano todo.*",
  "pascoa-2027": "*O coelho esconde ovo. A gente deixa a condição à vista.* 🐰",
  "dia-das-maes-2027": "*Presente de Dia das Mães dura um domingo. Cliente novo dura o mês.*",
  "dia-dos-namorados-2027": "*Jantar romântico dura uma noite. Funil rodando namora o ano todo.*",
  "dia-dos-pais-2027": "*Gravata o pai ganha todo ano. Funil rodando, nenhum.*",
};

const ROTULO_JANELA: Record<string, string> = {
  "black-friday-2026": "da Black Friday",
  "natal-2026": "do Natal",
  "ano-novo-2027": "do Ano Novo",
  "carnaval-2027": "do Carnaval",
  "pascoa-2027": "da Páscoa",
  "dia-das-maes-2027": "do Dia das Mães",
  "dia-dos-namorados-2027": "do Dia dos Namorados",
  "dia-dos-pais-2027": "do Dia dos Pais",
};

/**
 * D+3 · oferta da estação. Só sai com janela vigente em `oferta-sazonal.ts` (que nasce vazia no CRM
 * FERA): o texto da condição é o que o dono escreveu lá. Fora do calendário, null.
 */
export function textoD3(c: ContextoTexto): string | null {
  if (c.ofertaBase !== "padrao") return null;
  const janela = ofertaVigente(c.agora);
  if (!janela) return null;
  const nome = so(c.nome);
  const abertura = c.tomSerio
    ? cap(`*${voc(nome)}a condição de pagamento mudou e queremos que você saiba antes de decidir.*`)
    : (ABERTURA_JANELA[janela.id] ?? "*A condição de pagamento mudou e preferimos te avisar.*");
  const corpo = c.perguntouPreco ? janela.texto(nome) : janela.textoSemPreco(nome);
  return juntar([abertura, corpo]);
}

/** D+7 · a conta (número). Sem ticket do lead, a conta vira a pergunta "quanto vale um cliente novo?". */
export function textoD7(c: ContextoTexto): string {
  const nome = so(c.nome);
  const opcoes = ["1️⃣ O valor", "2️⃣ Se as vendas vão vir", "3️⃣ Outra coisa (me diz em uma linha)"].join("\n");
  if (!c.perguntouPreco) {
    return juntar([
      cap(`*${voc(nome)}uma pergunta que costuma destravar a decisão:*`),
      "Quanto vale um cliente novo pra você? Quando o primeiro cliente do mês cobre o investimento, cada um que vem depois é ganho.",
      FATO_FUNIL,
      "O que pesa mais aí?",
      opcoes,
    ]);
  }
  const abertura = cap(`*${voc(nome)}uma conta rápida antes de você decidir.*`);
  const conta =
    c.parcelaCentavos !== null
      ? `A parcela é de *${brl(c.parcelaCentavos)} por mês*. Então a pergunta é simples: quanto vale um cliente novo pra você? Se vale mais que ${brl(c.parcelaCentavos)}, o primeiro cliente do mês já paga a parcela.`
      : `O investimento é de *${brl(c.precoTotalCentavos)}*. A pergunta é simples: quantos clientes novos pagam isso pra você?`;
  return juntar([abertura, conta, FATO_FUNIL, "O que pesa mais aí?", opcoes]);
}

/**
 * D+15 · presente útil (pergunta). Sempre sai na melhor versão possível: com um conteúdo que o lead ainda
 * não recebeu; sem ele, com um dado real do nosso lado (nunca a pergunta seca, nunca link repetido).
 */
export function textoD15(c: ContextoTexto): string {
  const nome = so(c.nome);
  const pergunta = cap(`*${voc(nome)}o que mudou no seu negócio desde a nossa conversa?*`);
  const exemplos = 'Ex.: "continua igual", "contratei alguém", "ainda quero começar"';
  if (!c.conteudo) {
    return juntar([
      pergunta,
      FATO_FUNIL
        ? "Faz duas semanas que a gente conversou e queremos saber como ficou aí. Enquanto isso, um dado real do nosso lado:"
        : "Faz duas semanas que a gente conversou e queremos saber como ficou aí.",
      FATO_FUNIL,
      exemplos,
    ]);
  }
  const travaLead = travaUtil(c.trava);
  const porque = travaLead
    ? `Você marcou “${travaLead}” como a sua maior trava, então separei ${c.conteudo.descricao}:`
    : `Pergunto porque separei ${c.conteudo.descricao}:`;
  const presente = c.tomSerio
    ? "É um material nosso, de graça."
    : "Presente, sem pegadinha (a única pegadinha seria cobrar por isso).";
  return [pergunta, porque, `🔗 ${c.conteudo.url}`, presente, exemplos].join("\n\n");
}

/**
 * D+30 · bastidor. Nunca é pulado: com novidade real e/ou condição da estação vigente usa as duas; sem
 * nenhuma, mostra o dado real do funil e o que a proposta entrega (tudo verdadeiro, nada inventado).
 */
export function textoD30(c: ContextoTexto): string {
  const nome = so(c.nome);
  const janela = c.ofertaBase === "padrao" ? ofertaVigente(c.agora) : null;
  const novidade = c.novidade?.trim() || null;

  const abertura = c.tomSerio
    ? cap(`*${voc(nome)}faz um mês da nossa conversa.*`)
    : "*Fechamos o mês aqui e a sua proposta continua na nossa lista de pendências boas.*";
  const blocos = [abertura];
  if (novidade) {
    blocos.push(`Desde a nossa conversa: ${minuscula(novidade)}.`);
    const travaLead = travaUtil(c.trava);
    if (travaLead) blocos.push(`Pelo que você marcou como trava (“${travaLead}”), isso encaixa no seu caso.`);
  } else if (!janela) {
    const entregas = c.oferta.entregas.filter((e) => !/\bela\b/i.test(e)).slice(0, 2);
    if (FATO_FUNIL) blocos.push(`Um mês depois da nossa conversa, o dado mais concreto que temos pra te mostrar é este: ${minuscula(FATO_FUNIL)}.`);
    if (entregas.length) blocos.push(`A proposta segue de pé: ${entregas.join(" e ")}.`);
  }
  if (janela) {
    const rotulo = ROTULO_JANELA[janela.id] ?? "desta data";
    blocos.push(
      c.perguntouPreco && LINK_CHECKOUT_CONSULTORIA
        ? `E a condição ${rotulo} segue de pé.\n\n🔗 ${LINK_CHECKOUT_CONSULTORIA}`
        : `E a condição ${rotulo} segue de pé.`,
    );
  }
  blocos.push('Vale retomar de onde paramos?\nEx.: "vale", "mês que vem", "decidi por outro caminho"');
  return blocos.join("\n\n");
}

/** D+60 · convite de volta (direto). */
export function textoD60(c: ContextoTexto): string {
  const nome = so(c.nome);
  const abertura = c.tomSerio
    ? cap(`*${voc(nome)}faz dois meses. Se ainda fizer sentido, me responde “voltei”.*`)
    : cap(`*${voc(nome)}me responde “voltei” que a gente tira a poeira da sua proposta.* 🧹`);
  return [
    abertura,
    "Faz dois meses. Nesse tempo, o que a gente conversou continuou sendo prioridade, ou outra coisa passou na frente?",
    "Retomo de onde a gente parou, com a proposta atualizada.",
    ["1️⃣ Voltei", "2️⃣ Ainda não (me diz em que mês te chamo)", "3️⃣ Resolvi de outro jeito"].join("\n"),
  ].join("\n\n");
}

/** D+90 · despedida (afirmação). `nToques` é o número real de mensagens enviadas. */
export function textoD90(c: ContextoTexto): string {
  const nome = so(c.nome);
  const n = Math.max(1, c.nToques);
  const contagem = `Foram ${n} ${n === 1 ? "mensagem nossa" : "mensagens nossas"} desde a proposta.`;
  const piada = c.tomSerio ? "" : " Pelas regras da boa vizinhança, a próxima só se você chamar. 😄";
  return [
    cap(`*${voc(nome)}vamos arquivar o seu atendimento por aqui.*`),
    `${contagem}${piada}`,
    "A porta fica aberta: é só mandar “voltei” que a gente continua de onde parou.",
    "Antes de arquivar, me diz:",
    ["1️⃣ Voltei", "2️⃣ Ainda quero (me diz em que mês te chamo)", "3️⃣ Pode arquivar"].join("\n"),
  ].join("\n\n");
}

/** Toque do esqueleto: legenda da imagem (o esqueleto no banco da praça esperando a proposta). */
export function textoEsqueleto(c: ContextoTexto): string {
  const nome = so(c.nome);
  return [
    cap(`*${voc(nome)}esse aí no banco da praça somos nós, guardando a sua proposta.* 😅`),
    `Brincadeira à parte: ${negocio().promessa.replace(/[.!]+$/, "").toLowerCase()} ainda está nos seus planos pra agora?`,
    ["1️⃣ Quero começar", "2️⃣ Travei em algo (me diz em uma linha)", "3️⃣ Agora não (me diz em que mês te chamo)"].join("\n"),
  ].join("\n\n");
}

/** Texto do passo `d`; null = não há o que dizer de verdade agora (o passo é pulado). */
export function textoDoPasso(d: number, c: ContextoTexto): string | null {
  switch (d) {
    case 1:
      return textoD1(c);
    case 3:
      return textoD3(c);
    case 7:
      return textoD7(c);
    case 15:
      return textoD15(c);
    case 30:
      return textoD30(c);
    case 60:
      return textoD60(c);
    case 90:
      return textoD90(c);
    default:
      return null;
  }
}

export const MOTIVO_SEM_TEXTO: Record<number, string> = {
  3: "sem condição da estação para esta oferta ou fora do calendário",
};
