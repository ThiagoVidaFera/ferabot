import { negocio } from "./negocio";

/**
 * Mensagens da proposta automática. Texto fixo em código: só o nome, o link, uma frase pessoal
 * (validada) e o número de vendas (calculado) mudam. Nada de valor em reais do investimento na
 * mensagem: o preço fica só na página.
 */

/** Acima disso "N vendas" deixa de soar como bom lucro e o parágrafo sai. */
const MAX_VENDAS_NA_MENSAGEM = 8;

function investimentoReais(): number {
  const o = negocio().ofertas[0];
  const m = (o?.precoAVista || o?.comoFalar || "").match(/R\$\s*([\d.]+)/i);
  return m ? Number(m[1].replace(/\./g, "")) || 0 : 0;
}

/** Quantas vendas do ticket do lead dobram o investimento. Null se o ticket é desconhecido ou o número é absurdo. */
export function nVendasParaLucro(ticket: number | null | undefined): number | null {
  const investimento = investimentoReais();
  if (!investimento || !ticket || !Number.isFinite(ticket) || ticket <= 0) return null;
  const n = Math.max(1, Math.ceil((2 * investimento) / ticket));
  return n > MAX_VENDAS_NA_MENSAGEM ? null : n;
}

export function mensagemInicial(nome: string): string {
  return [
    `Legal, ${nome}. Em vez de uma reunião longa só para descobrir o preço, a gente monta a proposta com o seu caso e manda por aqui.`,
    "Já te mando. 👊",
  ].join("\n\n");
}

export type DadosMensagemFinal = {
  nome: string;
  link: string;
  /** uma frase sobre o que foi observado no caso dela; vazia ou com "R$" é descartada */
  linha: string;
  ticket: number | null;
};

const linhaSegura = (linha: string): string => {
  const t = linha.trim();
  return t && !/R\$/.test(t) && t.length <= 280 ? t : "";
};

export function mensagemFinal(d: DadosMensagemFinal): string {
  const n = negocio();
  const garantia = n.ofertas[0]?.garantiaCurta ?? "";
  const linha = linhaSegura(d.linha);
  const vendas = nVendasParaLucro(d.ticket);
  return [
    `Fala, ${d.nome}! 👊`,
    "Com base no que você contou, esta é a proposta que mais se encaixa no seu momento 🤝",
    `Dê uma olhada 👇\n${d.link}`,
    ...(linha ? [`${linha} 🎯`] : []),
    ...(garantia ? [`E o seu risco é pequeno 🛡️ ${garantia.charAt(0).toUpperCase()}${garantia.slice(1)}.`] : []),
    ...(vendas !== null
      ? [`Na conta simples: com *${vendas} ${vendas === 1 ? "venda" : "vendas"}* do que você vende, o investimento já se paga com folga 💰`]
      : []),
    "Clique no link e toque em *Vamos começar!* ✅ Ou me mande aqui qualquer dúvida que esteja te impedindo de decidir agora.",
  ].join("\n\n");
}
