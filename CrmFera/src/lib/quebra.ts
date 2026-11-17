/**
 * [QUEBRA] — o marcador do playbook que divide UMA resposta do modelo em
 * varias mensagens de WhatsApp, enviadas com intervalo, como gente digita.
 *
 * Regras:
 * - cada parte passa pelo guarda SOZINHA (paragrafo ≤4 linhas, sem link fora
 *   da tabela, sem truncar…);
 * - teto de 4 partes: mais que isso e textao disfarcado;
 * - parte vazia some (modelo que manda "[QUEBRA][QUEBRA]" nao cria mensagem
 *   em branco).
 */

export const MARCADOR_QUEBRA = "[QUEBRA]";
export const MAX_PARTES = 4;

export function dividirQuebra(texto: string): string[] {
  return String(texto ?? "")
    .split(/\s*\[\s*QUEBRA\s*\]\s*/i)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function temQuebra(texto: string): boolean {
  return /\[\s*QUEBRA\s*\]/i.test(String(texto ?? ""));
}

/** Junta as partes pra exibicao na trilha (o que o humano le antes de aprovar). */
export function juntarPartes(partes: string[]): string {
  return partes.join("\n\n");
}

/** Teto de caracteres de um paragrafo (~3 linhas de celular a 46 colunas). */
export const MAX_CHARS_PARAGRAFO = 170;
/** Teto de uma mensagem (o mesmo do guarda). */
export const MAX_CHARS_PARTE = 900;

/**
 * Quebra um paragrafo comprido em paragrafos menores NA FRONTEIRA DE FRASE.
 * Nao reescreve nada: so troca "frase. frase" por "frase.\n\nfrase" ate cada
 * bloco caber no teto. Frase unica maior que o teto fica como esta (o guarda
 * decide).
 */
function agrupar(pedacos: string[], teto: number): string[] {
  const blocos: string[] = [];
  let atual = "";
  for (const f of pedacos) {
    const candidato = atual ? `${atual} ${f}` : f;
    if (candidato.length <= teto || !atual) {
      atual = candidato;
    } else {
      blocos.push(atual);
      atual = f;
    }
  }
  if (atual) blocos.push(atual);
  return blocos;
}

/** Fronteiras, da mais natural pra mais agressiva. So desce um nivel se ainda estourar. */
const FRONTEIRAS: RegExp[] = [
  // fim de frase: . ! ? … + espaco + maiuscula/emoji/aspas/digito
  /(?<=[.!?…])\s+(?=[\p{Lu}\p{Emoji}"“(]|\d)/u,
  // clausula: travessao (some — a quebra de paragrafo faz o papel dele), ponto
  // e virgula e dois-pontos (ficam no fim do pedaco anterior)
  /\s+[—–]\s+|(?<=;)\s+|(?<=:)\s+(?=[\p{L}])/u,
  // ultimo recurso: virgula
  /,\s+/u,
];

function quebrarParagrafo(p: string, teto = MAX_CHARS_PARAGRAFO, nivel = 0): string[] {
  const limpo = p.replace(/\s+/g, " ").trim();
  if (limpo.length <= teto || nivel >= FRONTEIRAS.length) return [limpo];
  const pedacos = limpo.split(FRONTEIRAS[nivel]).map((f) => f.trim()).filter(Boolean);
  // virgula some no split — devolve nos pedacos, menos no ultimo
  const comPontuacao =
    nivel === 2 ? pedacos.map((f, i) => (i < pedacos.length - 1 ? `${f},` : f)) : pedacos;
  if (comPontuacao.length <= 1) return quebrarParagrafo(limpo, teto, nivel + 1);
  return agrupar(comPontuacao, teto).flatMap((b) =>
    b.length > teto ? quebrarParagrafo(b, teto, nivel + 1) : [b],
  );
}

/**
 * ARRUMA O FORMATO da resposta do modelo antes do guarda — determinístico,
 * sem mexer em conteudo:
 *  1. paragrafo comprido vira paragrafos curtos (fronteira de frase);
 *  2. parte com mais de 900 caracteres vira duas partes (fronteira de
 *     paragrafo), respeitando o teto de partes.
 * Nasceu do teste de mesa: o Gemini Flash escreve paragrafo de 300 caracteres
 * mesmo com o prompt pedindo 150, e o retry "corrigia" apagando a pergunta
 * final. Formato e trabalho de maquina; conteudo e do modelo.
 */
export function arrumarFormato(partes: string[]): string[] {
  const saida: string[] = [];
  for (const parte of partes) {
    const paragrafos = parte
      .split(/\n{2,}|\n(?=\S)/)
      .map((p) => p.trim())
      .filter(Boolean)
      .flatMap((p) => quebrarParagrafo(p));

    // agrupa paragrafos em partes de ate MAX_CHARS_PARTE
    let atual: string[] = [];
    let tamanho = 0;
    for (const p of paragrafos) {
      if (atual.length && tamanho + p.length + 2 > MAX_CHARS_PARTE) {
        saida.push(atual.join("\n\n"));
        atual = [];
        tamanho = 0;
      }
      atual.push(p);
      tamanho += p.length + 2;
    }
    if (atual.length) saida.push(atual.join("\n\n"));
  }
  return saida;
}
