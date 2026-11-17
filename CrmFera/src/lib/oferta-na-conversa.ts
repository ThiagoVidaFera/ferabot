/**
 * Lê a conversa do lead para o painel "Propostas em análise" (09/11/2026):
 *  1. qual OFERTA foi apresentada por último (a que vale como "valor da proposta"), inclusive o convite
 *     do produto de ENTRADA feito depois de o lead recusar a proposta maior;
 *  2. um RESUMO curto da última mensagem enviada.
 *
 * Funções puras, sem banco. Só olham mensagens que NÓS enviamos. Nada aqui inventa valor: sem sinal
 * claro na conversa, devolvem null. As ofertas e o produto de entrada vêm do negocio.json (ofertas.ts).
 *
 * O campo `sprint` (nome histórico) marca o produto de ENTRADA (o degrau menor).
 */
import { OFERTAS, PRODUTO_DE_ENTRADA } from "./ofertas";

/** Reais inteiros da primeira cifra de uma frase ("R$ 2.000 à vista" -> 2000). */
function reaisDe(frase: string): number {
  const m = frase.match(/R\$\s*([\d.]+)/i);
  return m ? Number(m[1].replace(/\./g, "")) || 0 : 0;
}

/** Preço do produto de entrada, em centavos (0 = não existe). */
export const PRECO_SPRINT_CENTAVOS = PRODUTO_DE_ENTRADA.disponivel ? reaisDe(PRODUTO_DE_ENTRADA.preco) * 100 : 0;

const hostDe = (link: string): string => {
  try {
    return new URL(link).host.toLowerCase();
  } catch {
    return "";
  }
};

/** Ofertas com página e preço conhecidos: a página enviada vale como apresentação da oferta. */
const PAGINAS_DAS_OFERTAS = OFERTAS.map((o) => ({ host: hostDe(o.link), nome: o.nome, centavos: reaisDe(o.precoAVista || o.comoFalar) * 100 }))
  .filter((o) => o.host && o.centavos > 0);

export type OfertaDetectada = {
  centavos: number;
  rotulo: string;
  /** de onde saiu, em uma frase (vai no tooltip do painel) */
  evidencia: string;
  quando: Date;
  sprint: boolean;
};

export type MensagemEnviada = { body: string; timestamp: Date };

function citaEntrada(texto: string): boolean {
  if (!PRODUTO_DE_ENTRADA.disponivel) return false;
  const nome = PRODUTO_DE_ENTRADA.nome.trim().toLowerCase();
  const host = hostDe(PRODUTO_DE_ENTRADA.link);
  const t = texto.toLowerCase();
  return (!!nome && t.includes(nome)) || (!!host && t.includes(host));
}
/** "fica em R$ 10 mil", "oferta de R$2.500", "investimento: R$ 2.500", "valor é de R$ 3.000"… */
const PRECO_EXPLICITO = /(?:fica em|custa|oferta de|investimento|valor)[^R\n]{0,24}?R\$\s?(\d[\d.]*)(?:,\d+)?\s?(mil|k)?/gi;
/** valor recorrente ou de outra coisa, não o preço da oferta: "R$ 500 por mês", "R$ 30 por dia" */
const NAO_E_PRECO_DA_OFERTA = /^\s*\*?\s*(?:por|\/|ao|a)\s?(?:mês|mes|dia|lead|mais)|^\s*de\s+(?:entrada|faturamento)/i;

const dia = (d: Date): string =>
  d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" });

const brl = (centavos: number): string =>
  (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).replace(/ /g, " ");

function precoExplicito(texto: string): number | null {
  for (const m of texto.matchAll(PRECO_EXPLICITO)) {
    const depois = texto.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 18);
    if (NAO_E_PRECO_DA_OFERTA.test(depois)) continue;
    const numero = Number(m[1].replace(/\./g, ""));
    if (!Number.isFinite(numero)) continue;
    const reais = m[2] ? numero * 1000 : numero;
    if (reais >= 1000 && reais <= 100_000) return Math.round(reais * 100);
  }
  return null;
}

/** Uma oferta por mensagem, na ordem de força: produto de entrada, páginas das ofertas, preço dito por extenso. */
function ofertaDaMensagem(m: MensagemEnviada): OfertaDetectada | null {
  if (citaEntrada(m.body) && PRECO_SPRINT_CENTAVOS > 0) {
    return {
      centavos: PRECO_SPRINT_CENTAVOS,
      rotulo: PRODUTO_DE_ENTRADA.nome,
      evidencia: `Convite de ${PRODUTO_DE_ENTRADA.nome} em ${dia(m.timestamp)}`,
      quando: m.timestamp,
      sprint: true,
    };
  }
  const corpo = m.body.toLowerCase();
  const pagina = PAGINAS_DAS_OFERTAS.find((o) => corpo.includes(o.host));
  if (pagina) {
    return { centavos: pagina.centavos, rotulo: pagina.nome, evidencia: `Página de ${pagina.nome} enviada em ${dia(m.timestamp)}`, quando: m.timestamp, sprint: false };
  }
  const preco = precoExplicito(m.body);
  if (preco !== null) {
    return { centavos: preco, rotulo: "valor informado", evidencia: `Valor ${brl(preco)} dito na conversa em ${dia(m.timestamp)}`, quando: m.timestamp, sprint: false };
  }
  return null;
}

/** Todas as ofertas apresentadas na conversa, da mais antiga para a mais nova. */
export function ofertasDaConversa(saidas: readonly MensagemEnviada[]): OfertaDetectada[] {
  return [...saidas]
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .map(ofertaDaMensagem)
    .filter((o): o is OfertaDetectada => o !== null);
}

/**
 * A oferta mais recente da conversa. `depoisDe`: só vale o que veio depois (a proposta registrada);
 * `soSprint`: só o convite do produto de entrada conta (quem tem proposta registrada mantém o valor do
 * catálogo, a menos que tenha sido convidado para o produto de entrada depois dela).
 */
export function ofertaMaisRecente(
  saidas: readonly MensagemEnviada[],
  opcoes: { depoisDe?: Date; soSprint?: boolean } = {},
): OfertaDetectada | null {
  const lista = ofertasDaConversa(saidas).filter(
    (o) => (!opcoes.soSprint || o.sprint) && (!opcoes.depoisDe || o.quando.getTime() > opcoes.depoisDe.getTime()),
  );
  return lista.length ? lista[lista.length - 1] : null;
}

// ---------- resumo da última mensagem ----------

const ROTULO_DO_TOQUE: Readonly<Record<string, string>> = {
  "1": "D+1 · resumo da proposta",
  "3": "D+3 · condição da estação",
  "7": "D+7 · a conta",
  "15": "D+15 · presente útil",
  "30": "D+30 · bastidor",
  "60": "D+60 · convite de volta",
  "90": "D+90 · despedida",
};

const ICONE_DA_MIDIA: Readonly<Record<string, string>> = {
  audio: "🎧 áudio",
  video: "🎬 vídeo",
  image: "🖼 imagem",
  document: "📄 documento",
};

export type ResumoDaMensagem = { curto: string; completo: string };

/** "Bom dia, Pedro." / "Oi, Jader!" no começo não diz nada sobre o conteúdo. */
const SAUDACAO = /^(?:bom dia|boa tarde|boa noite|oi|olá|ola|e aí)[^.!?\n]{0,40}[.!?]\s*/i;

function cortar(texto: string, maximo: number): string {
  if (texto.length <= maximo) return texto;
  const ate = texto.slice(0, maximo);
  const espaco = ate.lastIndexOf(" ");
  return `${(espaco > maximo * 0.6 ? ate.slice(0, espaco) : ate).replace(/[,;:\s]+$/u, "")}…`;
}

/**
 * Resumo de UMA linha da mensagem enviada: toque da sequência pelo nome do passo; mídia pelo tipo;
 * texto sem saudação, sem formatação do WhatsApp e com links trocados por "link", cortado em palavra.
 */
export function resumirMensagem(
  body: string | null | undefined,
  tipo: string | null | undefined,
  metadata: unknown,
  maximo = 110,
): ResumoDaMensagem {
  const meta = (metadata ?? {}) as Record<string, unknown>;
  const followup = typeof meta.followup === "string" ? meta.followup : "";
  const passo = followup.match(/^proposta-d(\d+)-/);
  if (passo && ROTULO_DO_TOQUE[passo[1]]) {
    const r = ROTULO_DO_TOQUE[passo[1]];
    return { curto: r, completo: r };
  }
  if (followup.startsWith("proposta-esqueleto")) return { curto: "Toque do esqueleto (imagem)", completo: "Toque do esqueleto (imagem)" };

  const limpo = (body ?? "")
    .replace(/https?:\/\/\S+/g, "[link]")
    .replace(/[*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const semSaudacao = limpo.replace(SAUDACAO, "");
  const texto = semSaudacao.length >= 20 ? semSaudacao : limpo;

  const midia = tipo ? ICONE_DA_MIDIA[tipo] : undefined;
  const soPlaceholder = /^\[(?:áudio|audio|vídeo|video|imagem|documento)\]$/i.test(texto);
  if (midia) {
    const legenda = soPlaceholder || !texto ? "" : ` · ${cortar(texto, maximo - 14)}`;
    return { curto: `${midia}${legenda}`, completo: `${midia}${texto && !soPlaceholder ? ` · ${texto.slice(0, 400)}` : ""}` };
  }
  if (!texto) return { curto: "(mensagem vazia)", completo: "(mensagem vazia)" };
  if (texto === "[link]") return { curto: "🔗 link", completo: "🔗 link" };
  return { curto: cortar(texto, maximo), completo: texto.slice(0, 400) };
}
