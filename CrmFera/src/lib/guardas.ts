/**
 * Guarda-corpos executaveis da mensagem gerada por IA que sai no WhatsApp.
 *
 * Portado de `crm-leads/web/netlify/functions/lib/guardas.js`, com UMA diferenca
 * de fundo: la a IA escrevia so a abertura e NUNCA podia citar preco ou link
 * (vinham da oferta fixa). Aqui o agente conversa, entao preco e link sao
 * PERMITIDOS — mas somente os valores exatos da tabela autorizada. Numero ou
 * URL inventados continuam sendo bloqueio.
 *
 * Toda regra daqui nasceu de defeito observado em producao, nao de teoria.
 *
 * O nome do dono (negocio.json) entra nas regras de identidade: o robo nunca diz que e o dono,
 * nunca avisa que vai "passar pro <dono>" e, nos agentes com a voz do dono, nao fala dele em
 * terceira pessoa.
 */
import { negocio } from "./negocio";

function escaparRegex(t: string): string {
  return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Primeiro nome do dono, minúsculo e escapado ("" quando o negocio.json ainda é o exemplo). */
function nomeDono(): string {
  const n = negocio().dono.primeiroNome.trim().split(/\s+/)[0] ?? "";
  return n && n !== "Seu" ? escaparRegex(n.toLowerCase()) : "";
}

const RECUSA_MIDIA = [
  /n[aã]o\s+(consigo|consegui|posso|d[aá]\s+pra)\s+(ouvir|escutar|abrir|ler|ver)[^.\n]{0,25}([aá]udio|foto|imagem|v[ií]deo|documento|arquivo|figurinha)/i,
  /s[oó]\s+(consigo\s+|consegue\s+|posso\s+)?l[eê]\w*\s+(mensagens?\s+de\s+)?texto/i,
  /escrev\w*[^.\n]{0,30}(em vez|ao inv[eé]s)[^.\n]{0,20}[aá]udio/i,
  /[aá]udio[^.\n]{0,40}(escreva|digite|por escrito|em texto)/i,
];
const DESCULPA = [/desculpa/i, /desculpe/i, /falha minha/i, /eu sumi/i, /perd[aã]o/i];

const FUGA = [
  /pode ignorar/i,
  /sem compromisso/i,
  /se n[ãa]o for (o )?(seu|teu) momento/i,
  /sem press[ãa]o/i,
  /fica[r]? [àa] vontade para ignorar/i,
];

const ESCASSEZ = [/agenda lotada/i, /[úu]ltimas vagas/i, /s[óo] hoje/i, /vagas? limitadas?/i];

/** O robô nunca avisa que vai passar a conversa pra gente (a passagem é muda). */
function avisaPassagem(): RegExp[] {
  const nome = nomeDono();
  const quem = ["time", "equipe", "gente", nome].filter(Boolean).join("|");
  const lista = [
    new RegExp(`(vou|vamos) (te )?pass(ar|o)\\b.{0,30}\\b(pro|pra|para o|para a|ao) (${quem})`, "i"),
    /passei (essa|a) conversa/i,
  ];
  if (nome) lista.push(new RegExp(`(o |a )?${nome} (vai|vem) (te )?(chamar|responder|falar|assumir|entrar em contato)`, "i"));
  return lista;
}

/** O robô nunca se apresenta como assistente. */
const SE_APRESENTA_COMO_ASSISTENTE = [
  /\b(sou|eu sou|aqui [ée]|meu nome [ée])\s+(o|a|um|uma)?\s*assistente/i,
  /assistente\s+(virtual|digital|de ia|da equipe)/i,
];

/** O agente atende NO numero da marca. Fingir ser o dono queima a confianca
 *  no momento em que a pessoa descobre — e ela sempre descobre na reuniao. */
function fingeDono(): RegExp[] {
  const nome = nomeDono();
  if (!nome) return [];
  return [
    new RegExp(`aqui [ée] (o |a )?${nome}\\b`, "i"),
    new RegExp(`(sou|eu sou) (o |a )?${nome}\\b`, "i"),
    new RegExp(`quem fala [ée] (o |a )?${nome}\\b`, "i"),
  ];
}

/**
 * Dono em TERCEIRA pessoa ("o <dono> monta", "com o <dono>"): nos agentes que falam com a voz
 * dele a fala e em primeira pessoa ("eu monto", "comigo"). Exige artigo/preposicao antes, entao
 * o lead com o mesmo nome ("Entendi, Ana.") nao bate. Num numero com persona a terceira pessoa
 * e natural e o guarda fica desligado.
 */
function donoTerceiraPessoa(): RegExp | null {
  const nome = nomeDono();
  return nome
    ? new RegExp(`\\b(?:o|a|do|da|ao|no|na|pelo|pela|pro|pra|com o|com a|para o|para a|de o)\\s+${nome}\\b`, "i")
    : null;
}

/**
 * INVENÇÃO (auditoria de 12/11/2026): o robô dizia que olhou o perfil sem ter aberto nada
 * ("Olhando aqui seu perfil", Rafael), citava "a maioria dos meus clientes" (Romeu), prometia
 * meta ("é totalmente pé no chão", Adriana), soltava prova sem fonte ("dezenas de vendas") e
 * inventava fluxo ("Faltam 7 perguntas", Edinalva). O prompt já proibia parte disso e o
 * Gemini fazia mesmo assim — por isso guarda.
 */
const OLHOU_PERFIL = [
  /olhando\s+(?:aqui\s+)?(?:o\s+|no\s+)?(?:seu|teu)\s+(?:perfil|canal|instagram|insta|site|@)/i,
  /\b(?:vi|olhei|conferi|analisei)\s+(?:aqui\s+)?(?:no\s+|o\s+|em\s+)?(?:seu|teu)\s+(?:perfil|canal|instagram|insta|site)/i,
  /\bdei\s+uma\s+olhada\s+(?:aqui\s+)?(?:no|em|o)\s+(?:seu|teu)\s+(?:perfil|canal|instagram|insta|site)/i,
  /\bvou\s+(?:dar\s+uma\s+olhada|olhar|analisar)\b[^.?!\n]{0,25}\b(?:perfil|canal|instagram|insta|site|@)/i,
  /\bcerto,?\s+vou\s+dar\s+uma\s+olhada/i,
];
const OUTROS_CLIENTES = [
  /\b(?:a\s+)?maioria\s+(?:dos|das)\s+(?:meus|minhas|nossos|nossas)\s+(?:clientes|alunos|alunas|mentorad[oa]s)/i,
  /\boutros\s+clientes\b/i,
  /\bmuita\s+gente\s+que\s+(?:chega|atendo|eu\s+atendo|me\s+procura|vem)/i,
  /\bmeus\s+clientes\s+(?:costumam|geralmente|normalmente|sempre)/i,
  /\ba\s+maioria\s+das\s+pessoas\s+que\s+(?:eu\s+)?(?:ajudo|atendo)/i,
];
/** Promessa de meta: vale só em frase afirmativa ("isso é possível pra você?" é pergunta). */
const PROMETE_META = [
  /p[ée]\s+no\s+ch[ãa]o/i,
  /\btotalmente\s+(?:poss[íi]vel|vi[áa]vel|realista|alcan[çc][áa]vel)/i,
  /\bcom\s+certeza\s+(?:voc[êe]\s+)?(?:chega|vai\s+chegar|consegue|vai\s+conseguir|bate|atinge)/i,
  /\b(?:sua\s+meta|essa\s+meta|a\s+meta)\s+(?:[ée]|e)\s+(?:bem\s+|super\s+|muito\s+)?(?:poss[íi]vel|vi[áa]vel|realista|alcan[çc][áa]vel)/i,
];
const PROVA_SEM_FONTE = [/\b(?:dezenas|centenas|milhares)\s+de\s+(?:vendas|clientes|alunos|mentorad[oa]s|reuni[õo]es)/i];
const FLUXO_INVENTADO = [
  /\bfalta(?:m)?\s+(?:s[óo]\s+|apenas\s+)?(?:\d+|uma|duas|tr[êe]s|quatro|cinco|seis|sete|oito|nove|dez)\s+perguntas/i,
  /\b(?:\d+|duas|tr[êe]s|quatro|cinco|seis|sete)\s+delas\s+[ée]\s+s[óo]\s+tocar/i,
];

function frasesAfirmativas(t: string): string[] {
  return t
    .split(/(?<=[.!?])\s+|\n+/)
    .map((f) => f.trim())
    .filter((f) => f && !f.endsWith("?"));
}

/** Promessa de entrega futura deixa o lead esperando algo que ninguem manda. */
const PROMESSA = [
  /vou te (mandar|enviar|ligar|chamar|passar) (mais tarde|depois|amanh[ãa])/i,
  /te (mando|envio|ligo|chamo) (mais tarde|depois|amanh[ãa]|em seguida)/i,
  /no pr[óo]ximo ([áa]udio|v[íi]deo|e-?mail|whats|contato)/i,
];

/**
 * TURNO MORTO: a mensagem ANUNCIA a entrega em vez de entregar ("agora vamos
 * estruturar sua oferta.") e acaba ali — sem pergunta, sem conteudo. O lead
 * responde "ok" e a conversa anda pra tras. Observado 2× na simulacao do fluxo
 * de mentoria; o prompt sozinho nao segurou.
 */
const ANUNCIO_VAZIO =
  /\b(vamos|vou|consigo te ajudar a|posso te ajudar a)\s+\w*\s*(estruturar|montar|criar|desenhar|construir|mostrar|organizar)/i;

const MAX_LINHAS_PARAGRAFO = 4;
const MAX_CARACTERES = 900;

/** Aproxima o numero de linhas que o paragrafo ocupa na tela do celular. */
function contarLinhas(p: string, largura = 46): number {
  return p
    .split("\n")
    .reduce((soma, l) => soma + Math.max(1, Math.ceil(l.trim().length / largura)), 0);
}

/**
 * Termina em letra, numero ou virgula = quase sempre resposta cortada pelo teto
 * de tokens. Fim legitimo e pontuacao final, emoji ou interrogacao.
 */
function pareceTruncado(t: string): boolean {
  // Terminar em link e legitimo — e o fim natural da mensagem de checkout.
  // Sem essa excecao, TODA mensagem com CTA no fim era barrada como truncada.
  const ultimo = t.split(/\s+/).pop() ?? "";
  if (/^(https?:\/\/|www\.)/i.test(ultimo)) return false;
  return /[\p{L}\p{N},;:–—-]$/u.test(t);
}

function bate(regras: RegExp[], texto: string): boolean {
  return regras.some((r) => r.test(texto));
}

export type Autorizado = {
  /** URLs que o agente pode mandar. Qualquer outra e bloqueio. */
  links: string[];
  /** Valores em reais que o agente pode citar, so digitos: ["1997", "197"]. */
  precos: string[];
};

/** Extrai as URLs do texto pra comparar com a whitelist. */
function urlsDe(texto: string): string[] {
  const achadas = texto.match(/(https?:\/\/[^\s)]+|www\.[^\s)]+|[a-z0-9-]+\.(?:com|br|io|app)[^\s)]*)/gi);
  return (achadas ?? []).map((u) => u.replace(/[.,;:]+$/, "").toLowerCase());
}

/** Extrai valores monetarios citados, normalizados pra digitos sem centavos. */
function precosDe(texto: string): string[] {
  const achados = texto.match(/r\$\s*[\d.,]+/gi) ?? [];
  return achados.map((p) =>
    p
      .replace(/^r\$\s*/i, "")
      .trim()
      .replace(/,\d{2}$/, "") // "1.997,00" -> "1.997"
      .replace(/\D/g, ""),
  );
}

/**
 * Numeros que o PROPRIO LEAD escreveu ("mentoria de 6 mil", "R$ 250 a
 * sessao"), no mesmo formato de `precosDe`. Espelhar o ticket dele e o
 * coracao da qualificacao — sem isso o guarda barraria o agente por repetir o
 * que a pessoa acabou de dizer (o defeito de 18/08, por outro caminho).
 * Libera so o que veio dele: numero inventado continua barrado.
 */
export function numerosDoLead(textos: string[]): string[] {
  const achados = textos.join("\n").match(/\d[\d.,]*/g) ?? [];
  return Array.from(
    new Set(achados.map((n) => n.replace(/,\d{1,2}$/, "").replace(/\D/g, "")).filter(Boolean)),
  );
}

export type Veredito = { ok: boolean; erros: string[] };

/** Palavras que nao carregam o assunto de uma pergunta (4+ letras, sem acento). */
const PALAVRAS_VAZIAS = new Set([
  "voce", "voces", "para", "pelo", "pela", "pelas", "pelos", "como", "qual", "quais", "quanto",
  "quantos", "quantas", "quando", "onde", "esse", "essa", "esses", "essas", "isso", "mais", "ainda",
  "entao", "tambem", "algo", "alguma", "algum", "alguns", "seria", "esta", "estao", "tinha",
  "pode", "poderia", "hoje", "gostaria", "queria", "seu", "sua", "suas", "seus", "caso", "coisa",
  "parte", "mesmo", "muito", "menos", "sobre", "ficou", "fazer", "feito", "tudo", "todo", "toda",
]);

function termosDe(frase: string): Set<string> {
  return new Set(
    frase
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 4 && !PALAVRAS_VAZIAS.has(w)),
  );
}

/** As frases que terminam em "?" (os "Ex.: ..." de exemplo nao entram). */
export function perguntasDe(texto: string): string[] {
  return String(texto ?? "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((f) => f.trim())
    .filter((f) => f.endsWith("?"));
}

const MIN_TERMOS_EM_COMUM = 3;
const SIMILARIDADE_MINIMA = 0.6;

/**
 * A pergunta nova e a mesma que uma anterior, mesmo reescrita? Mede quantas
 * palavras de assunto as duas dividem em relacao a MENOR (coeficiente de
 * sobreposicao). Exige 3+ palavras em comum pra "voce investe em anuncios?" nao
 * bater com "quanto custa o anuncio?".
 */
export function repetePergunta(nova: string, anteriores: string[]): string | null {
  const a = termosDe(nova);
  if (a.size < MIN_TERMOS_EM_COMUM) return null;
  for (const ant of anteriores) {
    const b = termosDe(ant);
    if (b.size < MIN_TERMOS_EM_COMUM) continue;
    let comum = 0;
    for (const t of a) if (b.has(t)) comum++;
    if (comum >= MIN_TERMOS_EM_COMUM && comum / Math.min(a.size, b.size) >= SIMILARIDADE_MINIMA) return ant;
  }
  return null;
}

/** Texto reduzido a letras e números, pra comparar mensagens sem ligar pra pontuação/emoji. */
function normalizarMensagem(t: string): string {
  return String(t ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const SIMILARIDADE_MENSAGEM = 0.85;
const MIN_TERMOS_MENSAGEM = 6;

/**
 * A mensagem nova repete uma que JÁ saiu nesta conversa? Igual depois de normalizar, ou
 * com 85%+ das palavras de assunto em comum (Jaccard) quando as duas têm 6+ palavras.
 * Nasceu das 12 duplicatas da auditoria de 12/11/2026 (Victor Pitzer recebeu a mesma
 * frase às 15:04 e às 15:10; 554800006476 recebeu a mesma resposta 3 vezes).
 */
export function repeteMensagem(nova: string, anteriores: string[]): string | null {
  const n = normalizarMensagem(nova);
  if (!n) return null;
  const a = termosDe(nova);
  for (const ant of anteriores) {
    if (normalizarMensagem(ant) === n) return ant;
    const b = termosDe(ant);
    if (a.size < MIN_TERMOS_MENSAGEM || b.size < MIN_TERMOS_MENSAGEM) continue;
    let comum = 0;
    for (const t of a) if (b.has(t)) comum++;
    const uniao = a.size + b.size - comum;
    if (uniao && comum / uniao >= SIMILARIDADE_MENSAGEM) return ant;
  }
  return null;
}

/** Quantas vezes `nome` aparece como palavra inteira em `texto`. */
export function vezesQueCitaNome(texto: string, nome: string): number {
  const n = nome.trim();
  if (n.length < 3) return 0;
  const escapado = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (texto.match(new RegExp(`(^|[^\\p{L}])${escapado}(?=$|[^\\p{L}])`, "giu")) ?? []).length;
}

/**
 * Checagens da RESPOSTA INTEIRA (todas as partes do [QUEBRA] juntas), que o guarda por
 * parte não enxerga: no máximo N perguntas, o nome da pessoa no máximo uma vez e nada
 * repetido do que já foi enviado. Auditoria de 12/11/2026: 51 mensagens com 2+ perguntas,
 * 23 nomes repetidos, 12 duplicatas.
 */
export type OpcoesResposta = {
  /** máximo de perguntas na resposta inteira (padrão 1) */
  maxPerguntas?: number;
  /** candidatos a nome da pessoa: cada um pode aparecer no máximo 1 vez na resposta */
  nomes?: string[];
  /** mensagens que já saíram nesta conversa (qualquer origem) */
  mensagensJaEnviadas?: string[];
};

export function validarResposta(partes: string[], opcoes: OpcoesResposta = {}): Veredito {
  const erros: string[] = [];
  const texto = partes.join("\n\n");
  const max = opcoes.maxPerguntas ?? 1;
  const perguntas = partes.flatMap(perguntasDe);
  if (perguntas.length > max) {
    erros.push(`faz ${perguntas.length} perguntas na mesma resposta — UMA pergunta por mensagem: escolha a mais importante e tire as outras`);
  }
  for (const nome of opcoes.nomes ?? []) {
    if (vezesQueCitaNome(texto, nome) > 1) {
      erros.push(`repete o nome "${nome}" dentro da mesma resposta — no máximo uma vez`);
      break;
    }
  }
  const anteriores = opcoes.mensagensJaEnviadas ?? [];
  if (anteriores.length) {
    const repetida = [texto, ...partes].map((p) => repeteMensagem(p, anteriores)).find(Boolean);
    if (repetida) {
      erros.push(`repete uma mensagem que já foi enviada ("${repetida.slice(0, 70)}") — nunca mande a mesma mensagem duas vezes; avance a conversa`);
    }
  }
  return { ok: erros.length === 0, erros };
}

/**
 * Teto de perguntas ANTES da oferta, por origem. Lead que chega pedindo proposta ("quero
 * receber a proposta") morria no meio de 5–6 perguntas. Pergunta que é o convite do resumo ou
 * "faz sentido…?" (valor) não conta.
 */
// configurável: env LIMITE_PERGUNTAS_POR_ORIGEM='{"funil:minha-pagina": 3}'
export const LIMITE_PERGUNTAS_POR_ORIGEM: Readonly<Record<string, number>> = (() => {
  try {
    return JSON.parse(process.env.LIMITE_PERGUNTAS_POR_ORIGEM || "{}") as Record<string, number>;
  } catch {
    return {};
  }
})();

const PERGUNTA_DE_FECHO = /resumo\s+de\s+como\s+funciona|faz\s+sentido/i;

export function estourouLimiteDePerguntas(
  origem: string | null | undefined,
  perguntasJaFeitas: string[],
  partes: string[],
): string | null {
  const limite = LIMITE_PERGUNTAS_POR_ORIGEM[String(origem ?? "")];
  if (!limite) return null;
  const feitas = perguntasJaFeitas.filter((p) => !PERGUNTA_DE_FECHO.test(p)).length;
  const novas = partes.flatMap(perguntasDe).filter((p) => !PERGUNTA_DE_FECHO.test(p));
  if (feitas >= limite && novas.length) {
    return `já foram ${feitas} perguntas (o teto desta origem é ${limite}): não pergunte mais nada — faça a oferta (item 6) e termine no convite do resumo`;
  }
  return null;
}

export type OpcoesValidacao = {
  /** perguntas que o agente JA fez nesta conversa: refazer (ate reescrita) e
   *  erro. Vazio no follow-up. */
  perguntasJaFeitas?: string[];
  /** agente fala com a voz do dono: o dono em terceira pessoa e erro */
  proibirTerceiraPessoa?: boolean;
  /** primeiros nomes que o agente JA disse nesta conversa: repetir e erro
   *  (so o follow-up pode repetir o nome) */
  nomesJaDitos?: string[];
  /** numero com persona (numero-comercial.ts): o agente PODE se apresentar como
   *  a persona — dizer que e o dono continua proibido. */
  personaSeApresenta?: boolean;
};

/** Ha `nome` como palavra inteira em `texto`? (sem depender de \b com acento) */
export function citaNome(texto: string, nome: string): boolean {
  const n = nome.trim();
  if (n.length < 3) return false;
  const escapado = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}])${escapado}($|[^\\p{L}])`, "iu").test(texto);
}

export function validarMensagem(
  texto: string,
  autorizado: Autorizado,
  opcoes: OpcoesValidacao = {},
): Veredito {
  const erros: string[] = [];
  const t = String(texto ?? "").trim();

  if (!t) return { ok: false, erros: ["mensagem vazia"] };
  if (t.length > MAX_CARACTERES) erros.push(`passou de ${MAX_CARACTERES} caracteres`);

  for (const u of urlsDe(t)) {
    const permitida = autorizado.links.some((l) => {
      const alvo = l.toLowerCase().replace(/^https?:\/\//, "");
      return u.replace(/^https?:\/\//, "").startsWith(alvo);
    });
    if (!permitida) erros.push(`link nao autorizado: ${u}`);
  }

  for (const p of precosDe(t)) {
    if (!p) continue;
    if (!autorizado.precos.includes(p)) erros.push(`preco fora da tabela: R$ ${p}`);
  }

  if (bate(RECUSA_MIDIA, t)) erros.push("diz que não ouve ou não abre mídia, ou pede para escrever — com mídia o robô fica calado");
  if (bate(DESCULPA, t)) erros.push("pede desculpa — proibido em copy 1:1");
  if (bate(FUGA, t)) erros.push("da licenca de fuga — proibido em copy 1:1");
  if (bate(ESCASSEZ, t)) erros.push("usa escassez falsa — proibido pelo anti-hype");
  if (bate(fingeDono(), t)) erros.push("se apresenta como o dono do negócio — proibido");
  if (bate(avisaPassagem(), t)) erros.push("avisa que vai passar a conversa pra alguém — a passagem é muda");
  if (bate(SE_APRESENTA_COMO_ASSISTENTE, t)) erros.push("se apresenta como assistente — proibido");
  if (bate(PROMESSA, t)) erros.push("promete entrega futura que ninguem vai cumprir");
  if (bate(OLHOU_PERFIL, t)) erros.push("diz que olhou (ou vai olhar) o perfil/canal/site — você não abre link: não diga isso");
  if (bate(OUTROS_CLIENTES, t)) erros.push('fala de outros clientes ("a maioria dos meus clientes", "outros clientes") — a única prova é a escrita no prompt');
  if (frasesAfirmativas(t).some((f) => bate(PROMETE_META, f))) erros.push('promete ou confirma a meta ("pé no chão", "totalmente possível") — anti-hype: reconheça a meta e siga');
  if (bate(PROVA_SEM_FONTE, t)) erros.push('cita número/prova sem fonte ("dezenas de vendas") — use só a prova escrita no prompt, sem quantidade');
  if (bate(FLUXO_INVENTADO, t)) erros.push('inventa fluxo ("faltam N perguntas") — você não sabe como o formulário/gerador funciona');
  const terceira = donoTerceiraPessoa();
  if (opcoes.proibirTerceiraPessoa && terceira?.test(t)) {
    erros.push('fala do dono em terceira pessoa — fale em primeira pessoa: "eu", "comigo", "meu trabalho"');
  }
  for (const pergunta of perguntasDe(t)) {
    const anterior = repetePergunta(pergunta, opcoes.perguntasJaFeitas ?? []);
    if (anterior) {
      erros.push(`repete uma pergunta que você já fez ("${anterior.slice(0, 70)}") — nunca pergunte a mesma coisa; aceite o que a pessoa respondeu e passe pro próximo objetivo`);
      break;
    }
  }
  const repetido = (opcoes.nomesJaDitos ?? []).find((n) => citaNome(t, n));
  if (repetido) {
    erros.push(`repete o nome "${repetido}" — o nome só vai na primeira mensagem (e no follow-up); tire o nome desta`);
  }
  if (pareceTruncado(t)) erros.push("termina no meio da frase — resposta truncada");

  const paragrafos = t.split(/\n{2,}/);

  // Anuncio sem entrega. O que separa "anunciei e parei" de "anunciei e
  // entreguei" nao e o tamanho — e a POSICAO: se o anuncio esta no ULTIMO
  // paragrafo, nao veio nada depois dele. Com pergunta ou link a mensagem tem
  // proximo passo e passa.
  const ultimoParagrafo = paragrafos[paragrafos.length - 1] ?? "";
  if (ANUNCIO_VAZIO.test(ultimoParagrafo) && !t.includes("?") && !urlsDe(t).length) {
    erros.push("anuncia a entrega em vez de entregar — turno morto");
  }

  if (paragrafos.some((p) => contarLinhas(p) > MAX_LINHAS_PARAGRAFO)) {
    erros.push(`paragrafo com mais de ${MAX_LINHAS_PARAGRAFO} linhas`);
  }

  return { ok: erros.length === 0, erros };
}

/**
 * "Toda conversa termina apontando pra UM proximo passo" (playbook) e a regra
 * 9 do CLAUDE.md: mensagem que acaba em afirmacao seca ("a garantia e bem
 * forte.") faz o lead responder "ok" e a conversa morrer. Visto 3x no teste de
 * mesa do Agente 04 com o Gemini — o prompt sozinho nao segurou.
 *
 * Conta como proximo passo: pergunta, link, ou despedida/disponibilidade
 * ("qualquer coisa me chama aqui"). Checado SO na ultima parte da resposta.
 */
const DESPEDIDA = [
  /me chama/i,
  /t[ôo] por aqui/i,
  /estou por aqui/i,
  /fico por aqui/i,
  /qualquer coisa/i,
  /qualquer d[úu]vida/i,
  /at[ée] (mais|logo|amanh[ãa]|l[áa])/i,
  /bo[am] (dia|tarde|noite|descanso|semana|final de semana)/i,
  /vai l[áa]/i,
  /vou passar (o seu caso|isso|essa conversa) pr[oa]? \p{L}+/iu,
  /algu[ée]m do time (vai|assume)/i,
];

export function temProximoPasso(texto: string): boolean {
  const t = String(texto ?? "").trim();
  if (!t) return false;
  if (t.includes("?")) return true;
  if (urlsDe(t).length) return true;
  return bate(DESPEDIDA, t);
}

export { MAX_LINHAS_PARAGRAFO, MAX_CARACTERES };
