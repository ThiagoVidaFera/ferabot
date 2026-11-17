import { negocio } from "./negocio";

/**
 * Conteúdos que o D+15 da sequência pós-proposta oferece como "presente".
 *
 * Só entram páginas NO AR e SEM formulário (o lead já está conversando: pedir e-mail antes de
 * entregar seria atrito). Padrão: o material gratuito do negocio.json (`links.isca`). O Setting
 * `sequencia_proposta_conteudo` (URL https) e `sequencia_proposta_conteudo_descricao` sobrepõem
 * quando o dono quiser mandar outro material.
 */

export type ConteudoSugerido = {
  url: string;
  /** frase pronta para "Separei ___:" */
  descricao: string;
};

function itensPadrao(): ConteudoSugerido[] {
  const isca = negocio().links.isca;
  return /^https:\/\//i.test(isca) ? [{ url: isca, descricao: "um material gratuito que ajuda a dar o primeiro passo" }] : [];
}

/** A URL (sem a barra final) já apareceu em alguma mensagem que enviamos a este lead? */
export function jaFoiEnviado(url: string, mensagensEnviadas: readonly string[]): boolean {
  const alvo = url.replace(/\/+$/, "").toLowerCase();
  return mensagensEnviadas.some((m) => m.toLowerCase().includes(alvo));
}

/**
 * O melhor conteúdo AINDA NÃO enviado a este lead: o material escolhido à mão (Setting) primeiro,
 * depois o padrão. Tudo já enviado = null (o D+15 cai no dado real, nunca repete link).
 */
export function escolherConteudo(
  _tags: string[],
  mensagensEnviadas: readonly string[],
  escolhido?: ConteudoSugerido | null,
): ConteudoSugerido | null {
  const candidatos: ConteudoSugerido[] = [...(escolhido ? [escolhido] : []), ...itensPadrao()];
  return candidatos.find((c) => !jaFoiEnviado(c.url, mensagensEnviadas)) ?? null;
}
