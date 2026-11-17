/**
 * O que o LEAD escreveu, lido por código (13/11/2026).
 *
 * A auditoria das conversas de 12/11 achou réguas mandando toque pra quem tinha pedido
 * pra sair ("me tire"), pedido data ("fim de novembro") ou dito sim ("vamos fechar").
 * Estas funções puras leem a fala do lead; quem decide o que fazer com isso é
 * `pode-tocar.ts`. Tudo aqui é sem acento e em minúscula antes de casar.
 */

export const semAcento = (t: string): string =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

const DESCADASTRO: readonly RegExp[] = [
  /\bme (tira|tire|remove|remova|exclui|exclua|descadastra|descadastre)\b(?! (uma|um|a|o) (duvida|pergunta))/,
  /\bnao quero (mais )?(receber|mensage)/,
  /\bsair da (sua |dessa |desta )?lista\b/,
  /\bpar[ae] de (me )?(mandar|enviar)\b/,
  /\bdescadastr/,
  /\bnao me (mande|mandem|envie|enviem|chame|chamem)\b/,
  /^(remover|sair|stop|parar|pare)[.! ]*$/,
];

/** "me tire", "remover", "não quero mais receber", "sair da lista"… */
export function pediuDescadastro(texto: string | null | undefined): boolean {
  const t = semAcento(texto ?? "");
  if (!t) return false;
  return DESCADASTRO.some((r) => r.test(t));
}

const NEGACAO = /\b(nao|ainda nao|nem)\b[^.!?]{0,20}\b(quero|vamos|bora|vou|to|estou)\b/;
const SIM: readonly RegExp[] = [
  /\bvamos (fechar|comecar|nessa|seguir)\b/,
  /\bbora\b/,
  /\bquero (comecar|fechar|entrar|contratar|seguir)\b/,
  /\bvou fechar\b/,
  /\b(pode )?mand(a|e|ar) (o |a )?(link|pix|contrato|dados pra pagamento)\b/,
  /\bt[oô] dentro\b|\bestou dentro\b/,
  /^fechad[oa][.! ]*$/,
  /^fechamos[.! ]*$/,
];

/** "vamos fechar", "bora", "quero começar", "pode mandar o link"… (negação não conta). */
export function disseSim(texto: string | null | undefined): boolean {
  const t = semAcento(texto ?? "");
  if (!t || NEGACAO.test(t)) return false;
  return SIM.some((r) => r.test(t));
}

const OUTRO =
  /\b(ja )?(fechei|fechamos|contratei|contratamos) com (outr[oa]s?|uma? (outr[oa]|agencia|empresa|profissional))\b|\bcontratei (outr[oa]|uma agencia|outra empresa|alguem)\b|\b(optei|decidi|escolhi|fui) (por|com) outr[oa]\b|\bresolvi de outro jeito\b/;

/** "já fechei com outra empresa", "contratei outra agência", "optei por outro caminho". */
export function fechouComOutro(texto: string | null | undefined): boolean {
  return OUTRO.test(semAcento(texto ?? ""));
}

const PRECO =
  /\bquanto (custa|e|fica|sai|seria|cobra|voce cobra|vai custar|que e)\b|\bvalor(es)?\b|\bpreco\b|\binvestimento\b|\bparcel|\bdesconto\b|\b(forma|formas|condicao|condicoes) de pagamento\b|\bpix\b|\bboleto\b/;

/** O lead perguntou preço, valor, investimento, parcela ou desconto. */
export function perguntouPreco(texto: string | null | undefined): boolean {
  return PRECO.test(semAcento(texto ?? ""));
}

// ---------------------------------------------------------------------------
// Adiamento com data
// ---------------------------------------------------------------------------

const MESES = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const RE_MES = MESES.join("|");
const DIA_MS = 86_400_000;
/** Adiamento reconhecido mas sem dia calculável segura por este tempo. */
export const ESPERA_SEM_DATA_MS = 30 * DIA_MS;

/** Dia/mês/ano em Brasília (a data da mensagem decide "este mês"). */
function partes(em: Date): { y: number; m: number; d: number } {
  const s = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(em);
  const [y, m, d] = s.split("-").map(Number);
  return { y, m: m - 1, d };
}

/** 9h de Brasília (12h UTC) do dia pedido; mês/dia que estouram rolam pra frente. */
const data = (y: number, m: number, d: number): Date => new Date(Date.UTC(y, m, d, 12));

/** Ano da próxima ocorrência do mês (o mês corrente é deste ano). */
function anoDoMes(mes: number, hoje: { y: number; m: number }): number {
  return mes < hoje.m ? hoje.y + 1 : hoje.y;
}

const FUTURO = /\b(vou|volto|voltamos|retomo|retomamos|chama|chame|fala comigo|falamos|conversamos|vamos|podemos|consigo|posso|quero|pretendo|penso em|comeco|comecar|fechar|fecho)\b/;

/**
 * Se o lead pediu pra deixar pra depois COM DATA, devolve até quando esperar; senão null.
 * "fim de novembro" -> 25/11 · "só em janeiro" -> 01/01 · "depois do dia 20" -> 21 ·
 * "semana que vem" -> +7 dias · "mês que vem" -> dia 1 · "depois das festas" -> 05/01.
 */
export function adiamentoNaFala(texto: string | null | undefined, em: Date): Date | null {
  const t = semAcento(texto ?? "");
  if (!t) return null;
  const hoje = partes(em);

  const fimMes = t.match(new RegExp(`\\b(fim|final|inicio|comeco|meados|metade) (de|do mes de|do) (${RE_MES})\\b`));
  if (fimMes) {
    const mes = MESES.indexOf(fimMes[3]);
    const dia = /fim|final/.test(fimMes[1]) ? 25 : /meados|metade/.test(fimMes[1]) ? 15 : 1;
    return data(anoDoMes(mes, hoje), mes, dia);
  }
  if (/\b(fim|final) do mes\b/.test(t) && !/\bmes que vem\b/.test(t)) {
    return hoje.d < 25 ? data(hoje.y, hoje.m, 25) : data(hoje.y, hoje.m + 1, 1);
  }
  if (/\b(mes que vem|proximo mes)\b/.test(t)) return data(hoje.y, hoje.m + 1, 1);
  if (/\b(semana que vem|proxima semana)\b/.test(t)) return new Date(em.getTime() + 7 * DIA_MS);
  if (/\b(ano que vem|proximo ano)\b/.test(t)) return data(hoje.y + 1, 0, 1);
  if (/\bdepois (das festas|do natal|do ano novo|da virada|das ferias de fim de ano)\b/.test(t)) {
    return data(hoje.m >= 10 ? hoje.y + 1 : hoje.y, 0, 5);
  }
  if (/\bdepois do carnaval\b/.test(t)) return data(hoje.m >= 2 ? hoje.y + 1 : hoje.y, 2, 1);

  const daqui = t.match(/\bdaqui a (\d{1,2}|uma|um|duas|dois|tres) (dias?|semanas?|mes|meses)\b/);
  if (daqui) {
    const n = ({ uma: 1, um: 1, duas: 2, dois: 2, tres: 3 } as Record<string, number>)[daqui[1]] ?? Number(daqui[1]);
    const unidade = daqui[2].startsWith("dia") ? DIA_MS : daqui[2].startsWith("semana") ? 7 * DIA_MS : 30 * DIA_MS;
    return new Date(em.getTime() + n * unidade);
  }

  const diaX = t.match(/\b(depois|a partir|so) (do|de) dia (\d{1,2})\b/) ?? t.match(/\b(depois|a partir) (do|de) (\d{1,2})\b(?! (dias|semanas|meses|horas))/);
  if (diaX) {
    const n = Number(diaX[3]);
    if (n >= 1 && n <= 31) {
      const alvo = diaX[1] === "depois" ? n + 1 : n;
      return n > hoje.d ? data(hoje.y, hoje.m, alvo) : data(hoje.y, hoje.m + 1, alvo);
    }
  }

  const depoisDoMes = t.match(new RegExp(`\\bdepois de (${RE_MES})\\b`));
  if (depoisDoMes) {
    const mes = MESES.indexOf(depoisDoMes[1]);
    return data(anoDoMes(mes, hoje), mes + 1, 1);
  }
  const mesMarcado = t.match(new RegExp(`\\b(so|somente|apenas|a partir de|la pra|la para|pra|para|ate|so em|so no|so la em|em) (${RE_MES})\\b`));
  if (mesMarcado) {
    // "em janeiro" sozinho só vale com verbo de futuro ("comecei em janeiro" não é adiamento)
    if (mesMarcado[1] === "em" && !FUTURO.test(t)) return null;
    const mes = MESES.indexOf(mesMarcado[2]);
    return data(anoDoMes(mes, hoje), mes, 1);
  }
  return null;
}
