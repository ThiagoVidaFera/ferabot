import type { OfertaDoCatalogo } from "@/lib/proposta-contato";
import { negocio } from "@/lib/negocio";

/**
 * Copy do follow-up de PROPOSTA.
 *
 * O follow-up de 48h do agente (`followup-agente.ts`) retomava a conversa com
 * "uma pergunta de resposta curta". Para lead em estágio `proposta` isso virou
 * regra nova: nada de "tem alguma dúvida?" nem "10 minutos". A mensagem mostra
 * o custo de adiar, o que a pessoa recebe (entregas com quantidade), o risco
 * baixo e um clique.
 *
 * As entregas e a garantia vêm da OFERTA GUARDADA no contato
 * (`customFields.proposta`, ver `proposta-contato.ts`). Sem ela, o texto cai na
 * lista da oferta principal do negocio.json com a regra condicional ("só se a conversa já citou").
 *
 * Aqui só mora o TEXTO da situação que o agente recebe — função pura, testada
 * em `scripts/testes/followup-proposta-copy.test.ts`.
 */

export type ContextoFollowupProposta = {
  /** horas de silêncio desde a última mensagem */
  horas: number;
  /** quantos toques já saíram desde a última fala do lead (0 = primeiro) */
  toque: number;
  /** a última fala foi do dono (ou de alguém do time), escrita na mão */
  ultimaFoiHumana: boolean;
  /** oferta guardada no contato; ausente = proposta antiga, sem registro */
  oferta?: OfertaDoCatalogo | null;
};

/** Entregas da oferta principal (negocio.json), quando a proposta não deixou registro. */
function entregasPadrao(): string {
  const entregas = negocio().ofertas[0]?.entregas ?? [];
  return entregas.length ? entregas.join(", ") : "o que foi combinado na proposta";
}

const PROIBIDO = [
  'PROIBIDO. Esta lista vale mais que a regra geral de "depois de mandar um link, diga qualquer dúvida, me chama aqui": ela NÃO vale neste toque.',
  '- perguntar se a pessoa "tem alguma dúvida" ou escrever "qualquer dúvida, me chama";',
  '- oferecer conversa, ligação ou "10 minutos" para tirar dúvida;',
  '- "sem compromisso", "pode ignorar", "fica à vontade", pedir desculpa pelo sumiço;',
  "- falar de validade, prazo ou data da proposta (nada de urgência falsa);",
  "- falar de preço, valor ou parcela (valor só se a pessoa perguntar);",
  "- falar de retorno do investimento ou prometer resultado, faturamento ou número de clientes;",
  "- usar asteriscos, markdown ou lista com marcadores (o guarda do agente barra).",
].join("\n");

const DIVISAO = "- Divisão do trabalho, quando couber: diga o que fica com a pessoa e o que fica com o time, só com o que está na proposta ou na conversa.";
const LINK =
  "- O link da proposta é o que já está na conversa: copie exatamente. Se não houver link na conversa, NÃO invente um; diga que está na proposta que a pessoa recebeu.";

/** Entregas e garantia: da oferta guardada, ou a regra condicional quando não há registro. */
function regrasDeFato(oferta: OfertaDoCatalogo | null | undefined): string {
  if (!oferta) {
    return [
      "REGRAS DE FATO:",
      "- Só cite garantia se a mensagem da proposta ou a conversa já citou garantia; se citou, diga do jeito que foi combinado, sem aumentar. Se não citou, não fale de garantia.",
      "- Liste só entregas que a proposta ou a conversa já combinou. Se a oferta da pessoa for outra, adapte a lista a ela. NÃO invente entrega, quantidade ou prazo.",
      LINK,
      DIVISAO,
    ].join("\n");
  }
  const garantia = oferta.garantia
    ? `- A garantia desta proposta é: ${oferta.garantia}. Diga assim, sem aumentar nem prometer mais.`
    : "- Esta oferta NÃO tem garantia: nunca cite garantia, nem fale em risco zero ou em devolução. O risco baixo aqui é outro: o escopo é fechado, tudo está escrito na proposta e o trabalho é feito junto.";
  return [
    "REGRAS DE FATO (esta é a oferta que o lead recebeu, registrada no CRM):",
    "- Liste só estas entregas, sem acrescentar nenhuma e sem inventar quantidade ou prazo.",
    garantia,
    LINK,
    DIVISAO,
  ].join("\n");
}

function abertura(c: ContextoFollowupProposta): string {
  const quem = c.ultimaFoiHumana
    ? `depois da última mensagem de ${negocio().dono.primeiroNome} (escrita à mão)`
    : "depois da SUA última mensagem";
  return `FOLLOW-UP DE PROPOSTA: a proposta já foi enviada e o lead parou de responder há ${c.horas} horas, ${quem}.`;
}

function primeiroToque(oferta: OfertaDoCatalogo | null | undefined): string {
  const entregas = oferta ? oferta.entregas.join(", ") : entregasPadrao();
  const parte3 = oferta?.garantia === null
    ? "PARTE 3, risco baixo e clique: sem falar de garantia (esta oferta não tem), mostre o escopo fechado e escrito, a divisão do trabalho e o próximo passo concreto, que é clicar em Vamos começar na proposta, com o link. Nunca termine com pergunta de dúvida."
    : "PARTE 3, risco baixo e clique: garantia (veja REGRAS DE FATO), a divisão do trabalho e o próximo passo concreto, que é clicar em Vamos começar na proposta, com o link. Nunca termine com pergunta de dúvida.";
  return [
    "Este é o primeiro toque depois do silêncio. Escreva UMA mensagem em 3 partes, separadas por [QUEBRA], no tom de conversa (sem asteriscos, sem markdown, sem lista; parágrafo com no máximo 2 frases curtas):",
    "PARTE 1, o custo de adiar: o que acontece enquanto a pessoa pensa. Use o problema que o lead contou na conversa, com as palavras dele, e mostre o que continua igual enquanto a decisão espera. Sem exagero e sem prometer resultado.",
    `PARTE 2, o depois, com entregas específicas e quantidade, em frases corridas (nunca lista): "Com a proposta andando, você passa a ter: ${entregas}."`,
    parte3,
  ].join("\n");
}

function segundoToque(oferta: OfertaDoCatalogo | null | undefined): string {
  const risco = oferta?.garantia === null
    ? "depois o escopo fechado e escrito (sem falar de garantia, esta oferta não tem)"
    : "depois o risco baixo (garantia, veja REGRAS DE FATO)";
  const escolha = oferta
    ? `escolha UMA das entregas registradas (${oferta.entregas.join("; ")}) que mais combina com o que o lead contou`
    : "escolha UMA entrega que mais combina com o que o lead contou";
  return [
    "Você já mandou um toque e ela também ficou sem responder. Este é o ÚLTIMO: depois dele você não insiste mais.",
    `Não repita o toque anterior nem as mesmas palavras. Escreva UMA mensagem mais curta, em 2 partes separadas por [QUEBRA] (sem asteriscos, sem markdown, sem lista): ${escolha} e descreva o que ela passa a ter com essa entrega, ${risco} e o clique em Vamos começar, com o link.`,
  ].join("\n");
}

/** Texto da situação enviado ao agente quando o lead parado está em `proposta`. */
export function situacaoProposta(c: ContextoFollowupProposta): string {
  return [
    abertura(c),
    c.toque === 0 ? primeiroToque(c.oferta) : segundoToque(c.oferta),
    regrasDeFato(c.oferta),
    PROIBIDO,
    'Não mude o estágio (deixe "estagio" vazio) e humano false.',
  ].join("\n");
}
