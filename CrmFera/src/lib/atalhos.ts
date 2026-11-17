import { aplicarVariaveis } from "@/lib/config";

/**
 * Resposta rápida já preenchida com o que o CRM sabe do lead.
 *
 * As respostas rápidas carregam dois tipos de lacuna: `{{nome}}` (que o envio
 * já resolvia) e os colchetes escritos pra humano — `[TRAVA DO FORMULÁRIO]`,
 * `[DIA]`, `[LINK DO MEET]`… Antes o atendente abria a ficha, copiava e colava.
 * Aqui cada colchete conhecido busca o dado no `customFields`; o que o lead não
 * respondeu FICA entre colchetes, e o composer recusa enviar com colchete
 * sobrando (`colchetesPendentes`). Lacuna visível é melhor que lacuna inventada.
 */

type Contato = { name: string; customFields?: unknown };

/**
 * O que a primeira mensagem do lead já diz. As páginas abrem o WhatsApp com
 * texto pronto ("meu nome é X… minha maior dificuldade pra captar leads é: Y")
 * — e quando o WhatsApp e o formulário viram contatos diferentes, essa
 * mensagem é o único lugar onde o dado está ao lado da conversa.
 */
export type PrimeiraMensagem = { nome: string; dificuldade: string };

export function lerPrimeiraMensagem(texto: string | null | undefined): PrimeiraMensagem {
  const t = texto ?? "";
  const nome = t.match(/meu nome (?:é|e)\s+([^(.,\n]+)/i)?.[1]?.trim() ?? "";
  const dificuldade =
    t.match(/maior dificuldade[^:\n]*:\s*([^\n]+)/i)?.[1]?.trim().replace(/[.\s]+$/, "") ?? "";
  return { nome, dificuldade };
}

type Campos = Record<string, unknown>;

/** `{pergunta, resposta}` (contrato do `respostas_texto`), lista ou valor solto. */
function textoDe(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.map(textoDe).filter(Boolean).join(" · ");
  if (typeof v === "object") return textoDe((v as Campos).resposta);
  const s = String(v).trim();
  // Valor de código de quiz (`1k_5k`, `pauta`) não é frase pra mandar pro lead.
  return /^[a-z0-9]+(_[a-z0-9]+)+$/.test(s) ? "" : s;
}

/** Procura pela chave e, se não achar, pelo enunciado da pergunta. */
function buscar(campos: Campos, chaves: string[], pergunta: RegExp): string {
  for (const k of chaves) {
    const t = textoDe(campos[k]);
    if (t) return t;
  }
  const respostas =
    campos.respostas_texto && typeof campos.respostas_texto === "object"
      ? Object.entries(campos.respostas_texto as Campos)
      : [];
  for (const [k, v] of [...Object.entries(campos), ...respostas]) {
    const enunciado =
      v && typeof v === "object" && !Array.isArray(v) ? String((v as Campos).pergunta ?? "") : k;
    if (pergunta.test(enunciado)) {
      const t = textoDe(v);
      if (t) return t;
    }
  }
  return "";
}

/** Campos soltos que os formulários dos funis gravam e que dizem algo do caso. */
const CAMPOS_DO_CASO: Array<[string, string]> = [
  ["dificuldade", "Maior dificuldade"],
  ["maior_trava", "Maior trava"],
  ["trava", "Trava"],
  ["nicho", "Nicho"],
  ["profissao", "Profissão"],
  ["ticket", "Ticket"],
  ["ticket_atual", "Ticket atual"],
  ["faturamento", "Faturamento"],
  ["instagram", "Instagram"],
  ["ja_tentou", "O que já tentou pra gerar clientes e o que não funcionou"],
  ["investe_30_dia", "Consegue investir o que a solução pede"],
  ["meta_3_meses", "O que quer que aconteça nos próximos 3 meses"],
];

/**
 * O que o lead já contou no formulário, em linhas legíveis pro agente. Sem
 * isso o agente pergunta de novo o que a pessoa acabou de preencher — e ela
 * some. Código de quiz (`1k_5k`) fica de fora, como no atalho.
 */
export function resumoDoFormulario(campos: Campos): string[] {
  const linhas: string[] = [];
  const { dia, hora } = dataDaReuniao(campos);
  if (dia) linhas.push(`REUNIÃO JÁ AGENDADA: ${dia}, às ${hora}`);

  const vistos = new Set<string>();
  for (const [chave, rotulo] of CAMPOS_DO_CASO) {
    const t = textoDe(campos[chave]);
    if (t && !vistos.has(t)) {
      vistos.add(t);
      linhas.push(`${rotulo}: ${t}`);
    }
  }
  const respostas =
    campos.respostas_texto && typeof campos.respostas_texto === "object"
      ? Object.entries(campos.respostas_texto as Campos)
      : [];
  for (const [k, v] of respostas) {
    const t = textoDe(v);
    if (!t || vistos.has(t)) continue;
    vistos.add(t);
    const pergunta = v && typeof v === "object" ? String((v as Campos).pergunta ?? k) : k;
    linhas.push(`${pergunta}: ${t}`);
  }
  return linhas;
}

const FUSO = "America/Sao_Paulo";

function saudacao(agora: Date): string {
  const h = Number(
    new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hourCycle: "h23", timeZone: FUSO }).format(agora),
  );
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function dataDaReuniao(campos: Campos): { dia: string; hora: string } {
  const bruto = textoDe(campos.evento_data);
  const d = bruto ? new Date(bruto) : null;
  if (!d || Number.isNaN(d.getTime())) return { dia: "", hora: "" };
  const dia = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    timeZone: FUSO,
  }).format(d);
  const [h, m] = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: FUSO,
  })
    .format(d)
    .split(":");
  return { dia, hora: m === "00" ? `${Number(h)}h` : `${Number(h)}h${m}` };
}

export function personalizarAtalho(
  corpo: string,
  contato: Contato,
  agora = new Date(),
  primeira: PrimeiraMensagem = { nome: "", dificuldade: "" },
): string {
  const campos: Campos =
    contato.customFields && typeof contato.customFields === "object"
      ? (contato.customFields as Campos)
      : {};
  const { dia, hora } = dataDaReuniao(campos);

  const lacunas: Array<[RegExp, string]> = [
    [/\[\s*bom dia\s*\/\s*boa tarde\s*\/\s*boa noite\s*\]/gi, saudacao(agora)],
    [/\[\s*dia\s*\]/gi, dia],
    [/\[\s*hora\s*\]/gi, hora],
    [/\[\s*link do meet\s*\]/gi, textoDe(campos.link_reuniao)],
    [/\[\s*trava do formul[áa]rio\s*\]/gi, buscar(campos, ["maior_trava", "trava"], /trava/i)],
    [
      /\[\s*dificuldade dele\s*\]/gi,
      (buscar(campos, ["dificuldade"], /dificuldade/i) || primeira.dificuldade).replace(/[.\s]+$/, ""),
    ],
    [/\[\s*ticket dele\s*\]/gi, buscar(campos, ["ticket"], /ticket/i)],
    [/\[\s*o que ele vende\s*\]/gi, buscar(campos, [], /o que voc[êe] vende/i)],
    [/\[\s*como (ele )?atrai( cliente hoje)?\s*\]/gi, buscar(campos, [], /cliente te encontra/i)],
  ];

  let texto = corpo;
  for (const [padrao, valor] of lacunas) {
    if (valor) texto = texto.replace(padrao, valor);
  }

  // Lead de WhatsApp tem o próprio número como nome: "Oi 5511987654321!"
  // seria pior que perguntar. Vira lacuna pro atendente preencher.
  // O nome que a pessoa escreveu ("meu nome é Henrick Cunha") vale mais que o
  // apelido do perfil do WhatsApp ("HC").
  const pessoa = primeira.nome ? { ...contato, name: primeira.nome } : contato;
  const semNomeReal = !/[a-zA-ZÀ-ú]/.test(pessoa.name ?? "");
  if (semNomeReal) texto = texto.replace(/\{\{\s*nome(_completo)?\s*\}\}/gi, "[NOME]");
  return aplicarVariaveis(texto, pessoa);
}
