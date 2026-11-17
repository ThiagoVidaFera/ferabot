/**
 * PERGUNTOU O VALOR → O ROBÔ RESPONDE NA HORA (13/11/2026, auditoria das conversas).
 *
 * Antes: pergunta de preço = passagem muda, e o lead esperava o humano de 15 a 42 horas
 * por horas. A regra é "valor só quando o lead perguntar": então, quando ELE pergunta, o agente
 * responde com o valor da FONTE ÚNICA (`ofertas.ts`, a partir do negocio.json), termina em
 * "faz sentido pro seu momento?" e o dono é avisado para acompanhar (tag `revisar`). Nunca valor
 * antes da pergunta.
 *
 * Só vale para agente cuja oferta tem preço canônico. Agente sem oferta mapeada aqui mantém a
 * passagem muda (o dono responde).
 *
 * Este arquivo não importa nada do app (db/ia/next): roda nos testes unitários.
 */
import { OFERTAS, oferta, PRODUTO_DE_ENTRADA, type Oferta } from "./ofertas";
import { perguntaPreco } from "./pergunta-robo";

/** Agente → chave da oferta em `ofertas.ts`. Todos os agentes padrão respondem pela oferta principal. */
const PRINCIPAL = OFERTAS[0]?.key ?? "principal";
export const OFERTA_DO_AGENTE: Readonly<Record<string, string>> = Object.fromEntries(
  [
    "recepcao",
    "qualificacao-agendamento",
    "confirmacao-reuniao",
    "no-show",
    "proposta",
    "followup",
    "nutricao",
    "recuperacao-carrinho",
  ].map((slug) => [slug, PRINCIPAL]),
);

/** A oferta do agente, só se ela tiver preço canônico (à vista + dígitos pro guarda). */
export function ofertaComPrecoDoAgente(slug: string): Oferta | null {
  const chave = OFERTA_DO_AGENTE[slug];
  const o = chave ? oferta(chave) : undefined;
  if (!o || !o.precoAVista || !o.precoDigitos.length) return null;
  return o;
}

/** Pedido de desconto/condição especial: continua passagem muda (o dono decide). */
export function pedeDesconto(texto: string | null | undefined): boolean {
  return /desconto|condi[çc][ãa]o\s+(?:especial|melhor|diferente)|abaixa(?:r)?\s+(?:o\s+)?(?:valor|pre[çc]o)|faz\s+por\s+menos/i.test(
    String(texto ?? ""),
  );
}

/** O lead perguntou o valor e este agente tem preço canônico pra responder na hora? */
export function respondePrecoNaHora(slug: string, ultimaDoLead: string | null | undefined): Oferta | null {
  if (!perguntaPreco(ultimaDoLead) || pedeDesconto(ultimaDoLead)) return null;
  return ofertaComPrecoDoAgente(slug);
}

/**
 * O gate antigo (silêncio + humano) ainda vale? Só quando o lead pede preço e o agente NÃO
 * tem preço canônico, ou quando pede desconto/condição especial.
 */
export function calaPorPreco(slug: string, ultimaDoLead: string | null | undefined): boolean {
  if (!perguntaPreco(ultimaDoLead)) return false;
  return pedeDesconto(ultimaDoLead) || !ofertaComPrecoDoAgente(slug);
}

const digitos = (s: string): string => s.replace(/,\d{2}\b/g, "").replace(/\D/g, "");

/**
 * A resposta traz o valor à vista da oferta? Compara por dígitos ("R$ 2.500" = "2500",
 * "R$ 10 mil" = "10"), então o modelo pode escrever com ou sem ponto.
 */
export function respondeuOPreco(texto: string, o: Oferta): boolean {
  const alvo = digitos(o.precoAVista);
  if (!alvo) return false;
  const achados = String(texto ?? "").match(/r\$\s*[\d.,]+/gi) ?? [];
  return achados.some((a) => digitos(a) === alvo);
}

/** Instrução que entra em "SITUAÇÃO AGORA" quando o lead pergunta o valor. */
export function instrucaoDePreco(o: Oferta): string {
  const entrada = PRODUTO_DE_ENTRADA.disponivel ? PRODUTO_DE_ENTRADA : null;
  return [
    `O LEAD ACABOU DE PERGUNTAR O VALOR. Responda AGORA, nesta mensagem, com o valor exato da fonte única: "${o.comoFalar}".`,
    "Escreva o valor exatamente assim (com o R$), sem arredondar, sem desconto, sem condição inventada e sem \"sem juros\".",
    "Em 1 frase antes do valor, lembre o que a pessoa leva (com o que ela já contou). Depois do valor, termine com UMA pergunta: \"Faz sentido pro seu momento?\".",
    "Não ofereça outra coisa nesta mensagem." +
      (entrada ? ` Se ela responder que o valor não cabe agora, aí sim ofereça uma vez ${entrada.nome} (${entrada.preco}).` : ""),
    "NÃO devolva \"humano\": true por causa da pergunta de valor: você responde e o dono do número é avisado pra acompanhar.",
  ].join("\n");
}

/** Motivo do aviso ao humano depois que o robô respondeu o valor. */
export function avisoDePrecoRespondido(o: Oferta): string {
  return `o lead perguntou o valor e o robô respondeu ${o.comoFalar} — acompanhe a conversa`;
}
