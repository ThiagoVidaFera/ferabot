/**
 * SEQUÊNCIA DAS ISCAS: parte pura (quem entra, qual material, que texto sai). Sem banco, sem rede
 * (a parte que envia vive em `sequencia-iscas.ts`). 4 mensagens: 1 na hora, 2 depois de 24h, 3
 * depois de 36h da segunda, 4 (vídeo do dono, se existir, ou convite para a reunião) 36h depois.
 *
 * Origem do contato: `funil:isca-<slug>` ou `funil:material-<slug>`. Nome, link e destaque do
 * material vêm do formulário (campos `material_nome`, `material_link`, `material_destaque`) ou, sem
 * eles, do slug humanizado e do `links.isca` do negocio.json.
 */

import { apresentacaoDoTrabalho, paginaDeCadastro } from "@/lib/primeira-mensagem";
import { negocio } from "@/lib/negocio";

export type Material = { nome: string; link: string; destaque: string };

export const ORIGEM_ISCA = "funil:isca-";
export const PREFIXO_ORIGEM_MATERIAL = "funil:material-";

function humanizar(slug: string): string {
  const t = slug.replace(/^\d+-/, "").split("-").filter(Boolean).join(" ");
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
}

function campo(campos: unknown, chave: string): string {
  const c = (campos ?? {}) as Record<string, unknown>;
  const direto = c[chave];
  if (typeof direto === "string" && direto.trim()) return direto.trim();
  const rt = (c as { respostas_texto?: Record<string, { resposta?: unknown }> }).respostas_texto;
  const r = rt?.[chave]?.resposta;
  return typeof r === "string" ? r.trim() : "";
}

type Contato = { origem: string; customFields: unknown };

/** Qual material o contato baixou. `null` = fora da sequência (ou material sem link). */
export function materialDoContato(c: Contato): Material | null {
  const origem = c.origem.toLowerCase();
  const prefixo = origem.startsWith(ORIGEM_ISCA)
    ? ORIGEM_ISCA
    : origem.startsWith(PREFIXO_ORIGEM_MATERIAL)
      ? PREFIXO_ORIGEM_MATERIAL
      : "";
  if (!prefixo) return null;
  const slug = origem.slice(prefixo.length);
  const nome = campo(c.customFields, "material_nome") || humanizar(slug);
  const link = campo(c.customFields, "material_link") || negocio().links.isca;
  if (!nome || !/^https?:\/\//i.test(link)) return null;
  return { nome, link, destaque: campo(c.customFields, "material_destaque") };
}

const TITULOS = new Set(["professor", "professora", "prof", "dr", "dra", "doutor", "doutora", "coach", "mentor", "mentora"]);
const PALAVRAS_DE_MARCA = new Set(["fera", "obra", "loja", "studio", "estudio", "clinica", "consultoria", "oficial"]);

/** Nome de formulario de Facebook/Instagram nao e nome de pessoa: so passa o que parece primeiro nome. */
export function nomeParaSaudacao(bruto?: string | null): string {
  const limpo = (bruto ?? "").normalize("NFKC").split(/[|/·–—]/)[0].trim();
  for (const token of limpo.split(/\s+/)) {
    const t = token.replace(/[.,:;!?]+$/g, "");
    if (!t || TITULOS.has(t.toLowerCase())) continue;
    if (t.length < 3 || /\d/.test(t) || !/^\p{L}[\p{L}'-]*$/u.test(t)) return "";
    if (PALAVRAS_DE_MARCA.has(t.toLowerCase())) return "";
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  return "";
}

export type Passo = 1 | 2 | 3 | 4;

/** Espera minima desde o passo anterior. */
export const ESPERA_MS: Record<2 | 3 | 4, number> = {
  2: 24 * 60 * 60 * 1000,
  3: 36 * 60 * 60 * 1000,
  4: 36 * 60 * 60 * 1000,
};

/** Passo 4 é um vídeo do dono, se este arquivo existir na pasta de mídia do CRM. Sem ele, o passo 4 é o convite em texto. */
export const ARQUIVO_VIDEO_PASSO4 = "sequencia-iscas-video.mp4";

/** Passo 1 so para quem baixou ha menos que isso: nao reabre lead antigo. */
export const JANELA_PASSO1_MS = 48 * 60 * 60 * 1000;

export type EstadoSequencia = {
  criadoEm: Date;
  /** quando saiu cada passo ja enviado */
  enviados: Partial<Record<Passo, Date>>;
  encerrada: boolean;
  /** lead escreveu (ou gente do time falou) depois que a sequencia comecou */
  conversou: boolean;
};

/** Proximo passo devido agora, ou null. */
export function proximoPasso(e: EstadoSequencia, agora: Date): Passo | null {
  if (e.encerrada || e.conversou) return null;
  const { 1: p1, 2: p2, 3: p3, 4: p4 } = e.enviados;
  if (p4) return null;
  if (!p1) return agora.getTime() - e.criadoEm.getTime() <= JANELA_PASSO1_MS ? 1 : null;
  if (!p2) return agora.getTime() - p1.getTime() >= ESPERA_MS[2] ? 2 : null;
  if (!p3) return agora.getTime() - p2.getTime() >= ESPERA_MS[3] ? 3 : null;
  return agora.getTime() - p3.getTime() >= ESPERA_MS[4] ? 4 : null;
}

/** Janela de envio: 8h às 21h de Brasília. */
export function horarioDeEnvio(agora: Date): boolean {
  const hora = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", hour: "numeric", hourCycle: "h23" })
      .formatToParts(agora)
      .find((p) => p.type === "hour")?.value ?? 0,
  );
  return hora >= 8 && hora < 21;
}

/** Legenda do vídeo do dono (passo 4 e último toque do follow-up dos agentes). */
export function legendaVideoJornada(nome: string): string {
  const n = nomeParaSaudacao(nome);
  const dono = negocio().dono.primeiroNome;
  return [
    `${n ? `${n}, ` : ""}${dono} gravou um vídeo curto mostrando como funciona o trabalho, do primeiro contato até o resultado.`,
    "Vale dar o play ainda hoje 👆",
    "Depois me diz: é isso que você quer para o seu caso?",
  ].join("\n\n");
}

/** Passo 4 sem vídeo: o convite para a reunião, em texto. */
export function conviteReuniaoPasso4(nome: string): string {
  const n = negocio();
  const s = nomeParaSaudacao(nome);
  return [
    `${s ? `${s}, se` : "Se"} fizer sentido conversar sobre o seu caso, ${n.dono.primeiroNome} separa ${n.reuniao.duracaoMin} minutos para entender o que você precisa e mostrar o caminho.`,
    `É só escolher o horário aqui:\n🔗 ${n.links.agendamento}`,
  ].join("\n\n");
}

/** Texto de cada passo. Parágrafos curtos, \n\n entre eles, sem emoji com U+FE0F. */
export function montarMensagem(passo: Passo, nome: string, m: Material, origem?: string): string {
  const n = nomeParaSaudacao(nome);
  const dono = negocio().dono.primeiroNome;
  if (passo === 1) {
    return [
      n ? `Oi, ${n}! 👋` : "Oi! 👋",
      `Vi que você baixou o material *"${m.nome}"* na ${paginaDeCadastro(origem) ?? `página dos materiais gratuitos de ${dono}`}.`,
      apresentacaoDoTrabalho("padrao", "terceira"),
      "Deixo o link do material aqui pra você abrir quando quiser:",
      `🔗 ${m.link}`,
      "Qualquer dúvida na hora de aplicar, é só chamar por aqui.",
    ].join("\n\n");
  }
  if (passo === 2) {
    return [
      `${n ? `${n}, conseguiu` : "Conseguiu"} abrir o *"${m.nome}"*?`,
      ...(m.destaque ? [`Um ponto que costuma chamar atenção: ${m.destaque}.`] : []),
      `Se ainda não abriu, vale dar uma olhada hoje:\n🔗 ${m.link}`,
      "Pra eu te indicar o que faz mais sentido: qual é a sua situação hoje com isso?",
    ].join("\n\n");
  }
  if (passo === 4) return legendaVideoJornada(nome);
  return [
    `${n ? `${n}, uma` : "Uma"} pergunta rápida pra eu te indicar o próximo passo.`,
    "Se você pudesse resolver só uma coisa nos próximos 30 dias, qual seria?",
    "Pode responder com as suas palavras, curtinho mesmo.",
  ].join("\n\n");
}
