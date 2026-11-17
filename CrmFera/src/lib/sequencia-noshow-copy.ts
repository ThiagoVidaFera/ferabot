import { nomeParaVocativo } from "@/lib/oferta-sazonal";
import { negocio } from "@/lib/negocio";

/**
 * Textos da sequência de quem agendou e NÃO compareceu à reunião. Voz da equipe do dono.
 *
 * Sem prova inventada: nenhum número, caso ou resultado que não esteja no negocio.json. Resultado
 * real o dono acrescenta à mão, com fonte. Formato: parágrafo de até 4 linhas, linha em branco entre
 * blocos, emoji sem seletor de variação e com espaço depois. Nada de "imagino que a correria do dia
 * a dia…" (a pessoa pode ter faltado por um motivo sério).
 */

/** Para onde a sequência leva: a página de agendamento (remarcar). */
export function linkNoShow(): string {
  return negocio().links.agendamento;
}

/** Mantido por compatibilidade com quem importa a constante. */
export const LINK_ESTRUTURA_DIGITAL = linkNoShow();

export const DIAS_NOSHOW = [1, 7, 15, 30, 60] as const;
export type DiaNoShow = (typeof DIAS_NOSHOW)[number];

type Nome = string | null | undefined;

/** "Carlos, tenho…" com nome; sem nome aproveitável, a frase só ganha a inicial maiúscula. */
function comNome(nome: Nome, resto: string): string {
  const n = nomeParaVocativo(nome);
  return n ? `${n}, ${resto}` : resto.charAt(0).toUpperCase() + resto.slice(1);
}

const link = (): string => `🔗 ${linkNoShow()}`;

const TEXTOS: Record<DiaNoShow, (nome: Nome, recente: boolean) => string> = {
  1: (nome, recente) => {
    const n = negocio();
    return [
      comNome(nome, `${recente ? "recentemente " : ""}você tinha agendado uma reunião com ${n.dono.primeiroNome} e a gente acabou não se falando.`),
      `A reunião é de ${n.reuniao.duracaoMin} minutos e serve para entender o seu caso e mostrar o caminho.`,
      "Se ainda fizer sentido, é só escolher um novo horário aqui:",
      link(),
      "Quer que a gente remarque?",
    ].join("\n\n");
  },

  7: (nome) => {
    const n = negocio();
    return [
      comNome(nome, `passando para lembrar do que ${n.dono.primeiroNome} faz: ${n.promessa.replace(/[.!]+$/, "")}.`),
      "Se isso ainda é uma prioridade para você, o horário está aberto:",
      link(),
    ].join("\n\n");
  },

  15: (nome) => {
    const isca = negocio().links.isca;
    return [
      comNome(nome, "uma pergunta rápida: o que você queria resolver quando agendou a reunião continua sendo prioridade?"),
      ...(isca ? ["Se quiser adiantar, separei um material gratuito que ajuda no primeiro passo:", `🔗 ${isca}`] : []),
      "Pode responder com as suas palavras, curtinho mesmo.",
    ].join("\n\n");
  },

  30: (nome) => {
    const n = negocio();
    return [
      comNome(nome, `faz um mês que a gente não conversa. ${n.dono.primeiroNome} continua com horários para quem quer ${n.promessa.replace(/[.!]+$/, "").toLowerCase()}.`),
      "Se fizer sentido agora, é por aqui:",
      link(),
    ].join("\n\n");
  },

  60: (nome) =>
    [
      comNome(nome, "esta é a última mensagem sobre a reunião, para não ocupar o seu WhatsApp."),
      "Se um dia fizer sentido conversar sobre o seu caso, o link fica aqui:",
      link(),
      "Se preferir, me responde com *quero* que a gente abre um novo horário.",
    ].join("\n\n"),
};

export function textoNoShow(passo: number, nome: Nome, recente = true): string | null {
  const f = (TEXTOS as Record<number, (n: Nome, r: boolean) => string>)[passo];
  return f ? f(nome, recente) : null;
}
