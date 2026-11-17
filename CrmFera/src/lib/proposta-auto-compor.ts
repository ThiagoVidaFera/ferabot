/**
 * Proposta automática (15/11/2026): o que o MODELO escreve (`ParteVariavel`) e o que é do CÓDIGO.
 *
 * Do código, nunca do modelo: oferta (a principal do negocio.json), marca, meta da garantia,
 * data de emissão, validade (o gerador calcula 3 dias) e a estrutura da página. Do modelo: o que foi
 * ouvido do lead, o fluxo, o cenário, a calculadora e o que muda em cada entrega.
 *
 * Os guardas rodam ANTES de gastar ~5 min gerando e publicando uma página pública: fala entre aspas só
 * se for trecho literal de mensagem do lead (regra 10 do skill / `prova-e-dado.md`), sem valor em reais,
 * sem "call", sem prazo de retorno, sem jargão que o gerador recusaria no `--estrito`.
 * Único import: o negocio.json (lido do disco, sem app), para continuar rodando em teste puro.
 */
import { negocio } from "./negocio";

export const TAG_AGUARDANDO_PODE = "aguardando-pode";
export const TAG_PROPOSTA_AUTO_ENVIADA = "proposta-auto-enviada";

/** Reais inteiros da primeira cifra de uma frase ("R$ 2.000 à vista" -> 2000; sem cifra -> 0). */
function reaisDe(frase: string): number {
  const m = frase.match(/R\$\s*([\d.]+)(?:,\d{2})?/i);
  return m ? Number(m[1].replace(/\./g, "")) || 0 : 0;
}

/** "10x de R$ 230" -> { parcelas: 10, parcela: 230 }; sem parcelamento -> zeros. */
function parcelamentoDe(frase: string): { parcelas: number; parcela: number } {
  const m = frase.match(/(\d+)\s*[x×]\s*(?:de\s*)?R\$\s*([\d.]+)/i);
  return m ? { parcelas: Number(m[1]), parcela: Number(m[2].replace(/\./g, "")) } : { parcelas: 0, parcela: 0 };
}

const PRINCIPAL = negocio().ofertas[0];

/** A oferta que a proposta automática apresenta: a principal do negocio.json. */
export const OFERTA_AUTO = {
  ofertaBase: PRINCIPAL?.slug ?? "principal",
  marca: "padrao",
  aVista: reaisDe(PRINCIPAL?.precoAVista || PRINCIPAL?.comoFalar || ""),
  ...parcelamentoDe(PRINCIPAL?.parcelamento || PRINCIPAL?.comoFalar || ""),
  /** Condição especial de quem decide rápido: no CRM FERA não existe (null) até o dono escrever. */
  especial: null as { horas: number; parcelas: number; parcela: number; pix: number } | null,
  garantiaMeta: PRINCIPAL?.garantiaCurta ?? "",
};

/** Ticket de exemplo quando o lead não disse o dele; a página avisa que é editável. */
const TICKET_EXEMPLO = 5000;
const TICKET_MIN = 300;
const TICKET_MAX = 500_000;

export type ParteVariavel = {
  linha_pessoal: string;
  hero: { destaque: string; lead: string };
  ouvi_lead: string;
  ouvi: { fala: string; explica: string }[];
  fluxo: { hoje_d: string; hoje: string; com: string; resultados: string[] };
  cenario: { cenas: { t: string; d: string }[] };
  calculadora: { ticket: number | null; unidade_plural: string; rotulo_valor: string; rotulo_qtd: string };
  personalizar_entregas: { muda: string }[];
};

export type ResultadoValidacao = { ok: boolean; erros: string[] };

// ---------------------------------------------------------------- texto

const semAcento = (t: string): string => t.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Minúsculo, sem acento nem pontuação, espaços colapsados: base da checagem de fala literal. */
export function normalizar(t: string): string {
  return semAcento(t.toLowerCase()).replace(/[^a-z0-9]+/g, " ").trim();
}

const TRECHO_MIN = 4;

/**
 * Todo trecho entre aspas está, palavra por palavra, numa ÚNICA mensagem do lead. Só as reticências
 * (“…”) ligam trechos, e cada trecho precisa caber inteiro numa mensagem (revisão de 15/11/2026:
 * juntar mensagens num corpo só deixava um trecho atravessar o fim de uma e o começo da outra).
 */
export function literalNasFalas(textoComAspas: string, falasDoLead: readonly string[]): boolean {
  const interno = textoComAspas.replace(/["“”]/g, " ");
  const trechos = interno.split(/…|\.{3}/).map(normalizar).filter(Boolean);
  if (!trechos.length) return false;
  const mensagens = falasDoLead.map((f) => ` ${normalizar(f)} `);
  return trechos.every((t) => t.length >= TRECHO_MIN && mensagens.some((m) => m.includes(` ${t} `)));
}

/** Citação completa: aspas retas ou curvas. */
const ASPAS = /["“]([^"”]+)["”]/g;
/** Outros tipos de aspas e aspa sem par: o guarda não sabe validar, então recusa. */
const ASPAS_ESTRANHAS = /[«»„‘’]|(?<![\p{L}])'|'(?![\p{L}])/u;

function trechosEntreAspas(texto: string): string[] {
  return Array.from(texto.matchAll(ASPAS), (m) => m[0]);
}

/** Texto sem as citações: jargão e "Instagram/site" só valem fora do que o lead escreveu. */
const semCitacoes = (texto: string): string => texto.replace(ASPAS, " ");

function aspasSemPar(texto: string): boolean {
  const resto = semCitacoes(texto);
  return /[“”"]/.test(resto);
}

const MARCADOR_META = /^(?:tua|sua)\s+meta\b/i;

/** A fala é UMA citação inteira (ou várias ligadas por reticências) ou um resumo que começa com "Tua meta". */
function ehFalaValida(fala: string): boolean {
  const t = fala.trim();
  if (MARCADOR_META.test(t)) return !/["“”]/.test(t);
  return /^["“][^"”]+["”][.!?…]?$/.test(t);
}

/** Primeiro nome + sufixo aleatório: duas "Maria" nunca dividem página, e a URL não é adivinhável. */
export function slugDoNome(nome: string, telefone = "", sufixo = ""): string {
  const primeiro = normalizar(nome).split(" ")[0]?.replace(/[^a-z0-9]/g, "") ?? "";
  const base = primeiro ? primeiro.slice(0, 20) : `lead-${telefone.replace(/\D/g, "").slice(-7) || "novo"}`;
  return sufixo ? `${base}-${sufixo}` : base;
}

/** O ticket só vale se o lead escreveu (formulário ou conversa): "3 mil", "3000", "3.000", "3k", "2,5 mil". */
export function ticketConfirmado(ticket: number | null, textosDoLead: readonly string[]): number | null {
  if (ticket === null || !Number.isFinite(ticket)) return null;
  const base = textosDoLead.join(" ").toLowerCase();
  const inteiro = Math.round(ticket);
  const mil = inteiro / 1000;
  const formas = [String(inteiro), inteiro.toLocaleString("pt-BR")];
  if (inteiro % 1000 === 0) formas.push(`${mil} mil`, `${mil}k`, `${mil} k`);
  else if (inteiro % 100 === 0) formas.push(`${String(mil).replace(".", ",")} mil`, `${mil}k`);
  return formas.some((f) => new RegExp(`(?<![\\d.,])${f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\d])`).test(base)) ? ticket : null;
}

const escapar = (t: string): string =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ---------------------------------------------------------------- guardas

const PROIBIDOS: readonly [RegExp, string][] = [
  [/R\$\s*\d/, "valor em reais (o preço é do código)"],
  [/\bcalls?\b/i, "a palavra 'call' (dizer 'reunião de vendas')"],
  [/\b(?:ticket|leads?|no-show|payback|cpl|roi|cac|ltv|landing|cta|mql|criativos|tr[aá]fego)\b/i, "jargão sem explicação"],
  [/se\s+pag(?:a|am)\b|retorno\s+(?:do|sobre)\s+(?:o\s+)?investimento|cobr(?:e|em)\s+o\s+investimento/i, "prazo de retorno do investimento"],
  [/https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|br|me|io|net|org|app|link|site|ly)\b|wa\.me/i, "link ou endereço dentro do texto"],
  [/@\w|\b[\w.+-]+@[\w-]+\.\w+/, "e-mail ou @ dentro do texto"],
  [/\(?\b\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}\b/, "telefone dentro do texto"],
  [/\b(?:pix|chave\s+pix)\b/i, "chave Pix"],
  [/\d\s*%|\b(?:desconto|gr[aá]tis|gratuito|reembolso|b[oô]nus|promo[cç][aã]o|cupom)\b/i, "promessa de preço/condição (a condição é do código)"],
  [/\bgarant(?:ia|imos|ido|e)\b|\breais\b|\b\d+\s*k\b/i, "garantia ou valor por extenso (isso é do código)"],
];

/** Limites por campo: o que o lead e o modelo escrevem vai para uma página pública. */
const MAX_TEXTO = 600;
const MAX_NOME = 40;

/** Nome que entra na página: só letras, espaço, hífen e apóstrofo (WhatsApp traz emoji, dígito e @). */
export function nomeSeguro(nome: string): string {
  return nome.normalize("NFC").replace(/[^\p{L}\s'-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, MAX_NOME);
}

function textosDa(p: ParteVariavel): string[] {
  return [
    p.linha_pessoal,
    p.hero.destaque,
    p.hero.lead,
    p.ouvi_lead,
    ...p.ouvi.flatMap((o) => [o.fala, o.explica]),
    p.fluxo.hoje_d,
    p.fluxo.hoje,
    p.fluxo.com,
    ...p.fluxo.resultados,
    ...p.cenario.cenas.flatMap((c) => [c.t, c.d]),
    p.calculadora.unidade_plural,
    p.calculadora.rotulo_valor,
    p.calculadora.rotulo_qtd,
    ...p.personalizar_entregas.map((e) => e.muda),
  ];
}

function errosDeEstrutura(p: ParteVariavel): string[] {
  const erros: string[] = [];
  if (p.ouvi.length < 3 || p.ouvi.length > 4) erros.push("ouvi precisa de 3 ou 4 falas");
  if (p.fluxo.resultados.length !== 3) erros.push("fluxo.resultados precisa de 3 itens");
  if (p.cenario.cenas.length !== 3) erros.push("cenario.cenas precisa de 3 itens");
  if (p.personalizar_entregas.length !== 4) erros.push("personalizar_entregas precisa de 4 itens (uma por entrega)");
  if (textosDa(p).some((t) => typeof t !== "string" || !t.trim())) erros.push("há campo de texto vazio");
  if (p.hero.destaque.length > 70) erros.push("hero.destaque passa de 70 caracteres");
  if (textosDa(p).some((t) => t.length > MAX_TEXTO)) erros.push(`algum campo passa de ${MAX_TEXTO} caracteres: encurte`);
  if (p.linha_pessoal.length > 280) erros.push("linha_pessoal passa de 280 caracteres");
  const t = p.calculadora.ticket;
  if (t !== null && (!Number.isFinite(t) || t < TICKET_MIN || t > TICKET_MAX)) erros.push("ticket fora do razoável (use null se o lead não disse)");
  return erros;
}

/** O que o modelo pode afirmar sobre o perfil/site só existe se o dado chegou (revisão de 15/11/2026). */
export type ContextoValidacao = { temInstagram: boolean; temSite: boolean };

const SEM_INSTAGRAM: readonly [RegExp, string][] = [[/\b(?:instagram|perfil|bio|seguidores|posts?|stories|reels)\b/i, "falou do Instagram sem ter o perfil"]];
const SEM_SITE: readonly [RegExp, string][] = [[/\b(?:site|link da bio|p[aá]gina de vendas|loja)\b/i, "falou do site sem ter lido o site"]];

/** Onde o modelo AFIRMA o que observou do lead; nos outros campos "Instagram" é só o nome da entrega. */
const camposDeObservacao = (p: ParteVariavel): string[] => [p.linha_pessoal, p.hero.lead, p.ouvi_lead, ...p.ouvi.map((o) => o.explica)];

function errosDeTexto(texto: string, falas: readonly string[], ctx: ContextoValidacao): string[] {
  const erros: string[] = [];
  const fora = semCitacoes(texto);
  const regras = [...PROIBIDOS, ...(ctx.temInstagram ? [] : SEM_INSTAGRAM), ...(ctx.temSite ? [] : SEM_SITE)];
  for (const [re, motivo] of regras) {
    if (re.test(fora)) erros.push(`${motivo}: "${texto.slice(0, 60)}"`);
  }
  if (ASPAS_ESTRANHAS.test(texto) || aspasSemPar(texto)) erros.push(`aspas que o guarda não valida: "${texto.slice(0, 60)}"`);
  for (const citado of trechosEntreAspas(texto)) {
    if (!literalNasFalas(citado, falas)) erros.push(`fala entre aspas não é literal do lead: ${citado.slice(0, 80)}`);
  }
  return erros;
}

export function validarParte(
  p: ParteVariavel,
  falasDoLead: readonly string[],
  ctx: ContextoValidacao = { temInstagram: true, temSite: true },
): ResultadoValidacao {
  const erros = errosDeEstrutura(p);
  if (erros.length) return { ok: false, erros };
  for (const o of p.ouvi) {
    if (!ehFalaValida(o.fala)) erros.push(`ouvi.fala precisa ser UMA citação literal entre “ ” ou um resumo que comece com "Tua meta": ${o.fala.slice(0, 60)}`);
  }
  const observacao = new Set(camposDeObservacao(p));
  const livre: ContextoValidacao = { temInstagram: true, temSite: true };
  for (const texto of textosDa(p)) erros.push(...errosDeTexto(texto, falasDoLead, observacao.has(texto) ? ctx : livre));
  return { ok: erros.length === 0, erros: Array.from(new Set(erros)) };
}

/**
 * Último recurso depois de 2 tentativas. Fala de lead que não é literal NUNCA vira resumo: o item sai
 * (se sobrarem 3). Nos textos do dono (explicação, linha pessoal) a citação inventada perde as aspas.
 */
export function removerAspasNaoLiterais(p: ParteVariavel, falasDoLead: readonly string[]): ParteVariavel {
  const limpar = (t: string): string =>
    trechosEntreAspas(t).reduce(
      (acc, citado) => (literalNasFalas(citado, falasDoLead) ? acc : acc.replace(citado, citado.replace(/["“”]/g, ""))),
      t,
    );
  const falaLiteral = (f: string): boolean => ehFalaValida(f) && (MARCADOR_META.test(f.trim()) || trechosEntreAspas(f).every((c) => literalNasFalas(c, falasDoLead)));
  return {
    ...p,
    linha_pessoal: limpar(p.linha_pessoal),
    ouvi_lead: limpar(p.ouvi_lead),
    ouvi: p.ouvi.filter((o) => falaLiteral(o.fala)).map((o) => ({ fala: o.fala, explica: limpar(o.explica) })),
  };
}

// ---------------------------------------------------------------- montagem

export type DadosDoLead = {
  nome: string;
  telefone: string;
  empresa: string;
  /** AAAA-MM-DD da emissão */
  hoje: string;
  canal: string;
  /** slug ÚNICO deste lead (`slugDoNome` com sufixo aleatório), guardado no estado para os retries */
  slug: string;
};

export function montarPropostaJson(d: DadosDoLead, p: ParteVariavel): Record<string, unknown> {
  const primeiro = d.nome.trim().split(/\s+/)[0] ?? d.nome;
  const ticket = p.calculadora.ticket ?? TICKET_EXEMPLO;
  const lead = escapar(p.hero.lead);
  return {
    oferta_base: OFERTA_AUTO.ofertaBase,
    cliente: { nome: d.nome, primeiro_nome: primeiro, slug: d.slug, whatsapp: d.telefone, empresa: d.empresa },
    marca: OFERTA_AUTO.marca,
    origem: {
      canal: d.canal,
      marca_sugerida: OFERTA_AUTO.marca,
      marca_escolhida: OFERTA_AUTO.marca,
      motivo_da_escolha: "proposta automática depois do 'pode'",
    },
    emitida_em: d.hoje,
    hero: {
      h1_html: `Montar a sua estrutura digital significa atrair <em class="hl">${escapar(p.hero.destaque)}</em>, e não só curiosos.`,
      lead_html: lead,
      lead_curto_html: lead,
    },
    ouvi_titulo: "O que você me contou, nas tuas palavras.",
    ouvi_lead: p.ouvi_lead,
    ouvi: p.ouvi.map((o) => ({ fala: o.fala, explica: o.explica })),
    fluxo: { ...p.fluxo },
    cenario: { titulo: "Uma segunda-feira ilustrativa, com a estrutura no ar.", cenas: p.cenario.cenas.map((c) => ({ ...c })) },
    calculadora: {
      ticket,
      qtd: 2,
      unidade_plural: p.calculadora.unidade_plural,
      rotulo_valor: p.calculadora.rotulo_valor,
      rotulo_qtd: p.calculadora.rotulo_qtd,
      tx_venda: 0.2,
      tx_prop: 0.1,
      origem_taxas: "uma conta simples de referência",
      tx_venda_txt: "1 venda a cada 5 propostas, 1 proposta a cada 10 contatos interessados",
      destaque_t: "Você coloca o teu número.",
      destaque_d:
        p.calculadora.ticket === null
          ? "O valor acima é só um exemplo. Troque pelo teu e veja a conta."
          : "O valor acima é o que você me contou. Troque por outro e veja a conta.",
    },
    garantia: { meta: OFERTA_AUTO.garantiaMeta },
    oferta: {
      a_vista: OFERTA_AUTO.aVista,
      parcelas: OFERTA_AUTO.parcelas,
      parcela: OFERTA_AUTO.parcela,
      ...(OFERTA_AUTO.especial ? { especial: { ...OFERTA_AUTO.especial } } : {}),
    },
    personalizar_entregas: p.personalizar_entregas.map((e) => ({ muda: e.muda })),
  };
}

// ---------------------------------------------------------------- leitura da saída do modelo

const ehTexto = (v: unknown): v is string => typeof v === "string";
const listaDe = <T>(v: unknown, ler: (x: unknown) => T | null): T[] | null => {
  if (!Array.isArray(v)) return null;
  const itens = v.map(ler);
  return itens.every((i) => i !== null) ? (itens as T[]) : null;
};
const obj = (v: unknown): Record<string, unknown> | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);

/** Lê o JSON do modelo (aceita bloco ```json). Devolve null se faltar qualquer campo: o chamador tenta de novo. */
export function lerParte(bruto: string): ParteVariavel | null {
  let j: Record<string, unknown> | null;
  try {
    j = obj(JSON.parse(bruto.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim()));
  } catch {
    return null;
  }
  const hero = obj(j?.hero);
  const fluxo = obj(j?.fluxo);
  const cenario = obj(j?.cenario);
  const calc = obj(j?.calculadora);
  const ouvi = listaDe(j?.ouvi, (x) => {
    const o = obj(x);
    return o && ehTexto(o.fala) && ehTexto(o.explica) ? { fala: o.fala, explica: o.explica } : null;
  });
  const resultados = listaDe(fluxo?.resultados, (x) => (ehTexto(x) ? x : null));
  const cenas = listaDe(cenario?.cenas, (x) => {
    const c = obj(x);
    return c && ehTexto(c.t) && ehTexto(c.d) ? { t: c.t, d: c.d } : null;
  });
  const entregas = listaDe(j?.personalizar_entregas, (x) => {
    const e = obj(x);
    return e && ehTexto(e.muda) ? { muda: e.muda } : null;
  });
  if (!j || !hero || !fluxo || !cenario || !calc || !ouvi || !resultados || !cenas || !entregas) return null;
  if (![j.linha_pessoal, j.ouvi_lead, hero.destaque, hero.lead, fluxo.hoje_d, fluxo.hoje, fluxo.com].every(ehTexto)) return null;
  if (![calc.unidade_plural, calc.rotulo_valor, calc.rotulo_qtd].every(ehTexto)) return null;
  const ticket = typeof calc.ticket === "number" ? calc.ticket : null;
  return {
    linha_pessoal: j.linha_pessoal as string,
    hero: { destaque: hero.destaque as string, lead: hero.lead as string },
    ouvi_lead: j.ouvi_lead as string,
    ouvi,
    fluxo: { hoje_d: fluxo.hoje_d as string, hoje: fluxo.hoje as string, com: fluxo.com as string, resultados },
    cenario: { cenas },
    calculadora: { ticket, unidade_plural: calc.unidade_plural as string, rotulo_valor: calc.rotulo_valor as string, rotulo_qtd: calc.rotulo_qtd as string },
    personalizar_entregas: entregas,
  };
}
