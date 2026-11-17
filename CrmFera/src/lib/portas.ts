import { db } from "@/lib/db";
import {
  adicionarTag,
  tagsDe,
  tagInteresse,
  tagCheckoutAbandonado,
  tagQuente,
  tagInscritoEvento,
  tagComprou,
  PRODUTOS,
} from "@/lib/tags";
import { lerEvento } from "@/lib/evento";
import { negocio } from "@/lib/negocio";

/**
 * AS PORTAS — por onde o lead entra define quem atende (playbook, pag. 4).
 * Cada porta carimba UMA tag; cada tag liga UM agente. Este arquivo e o
 * contrato entre as paginas, o checkout e o CRM.
 *
 * | porta                          | tag                               | agente |
 * |--------------------------------|-----------------------------------|--------|
 * | captura do evento/aula         | inscrito-evento-c[NN]             | nutricao |
 * | checkout abandonado (entrada)  | checkout-abandonado-entrada       | recuperacao |
 * | formulario/agenda da oferta    | interesse-principal               | qualificacao |
 * | anuncio CTWA (sem tag)         | origem anuncio                    | recepcao |
 * | botao da pagina de vendas      | quente-principal                  | fechamento |
 * | compra (webhook)               | comprou-[produto]                 | ninguem vende |
 *
 * Frases dos botoes de WhatsApp das paginas do negocio (env, regex sem barras, sem diferenciar
 * maiuscula). Ancore na frase EXATA do botao: palavra solta casaria com um amigo perguntando e
 * ligaria o robo na conversa dele.
 *   PORTAS_JSON='[{"frase": "vim da p[aá]gina da mentoria", "tag": "interesse-principal"}]'
 *   FRASES_QUENTES='["quero garantir minha vaga"]'   (botao da pagina de vendas -> quente-principal)
 *   PALAVRAS_DO_SERVICO='mentoria|consultoria'        (estranho perguntando do servico)
 */

const PRINCIPAL = PRODUTOS.principal.slug;

type Porta = { re: RegExp; tag: string };

function jsonDaEnv<T>(chave: string, padrao: T): T {
  try {
    return JSON.parse(process.env[chave] || "null") ?? padrao;
  } catch (erro) {
    console.error(`[portas] ${chave} invalido, ignorado:`, erro);
    return padrao;
  }
}

function regexSegura(fonte: string): RegExp | null {
  try {
    return new RegExp(fonte, "i");
  } catch {
    return null;
  }
}

/** Texto pre-preenchido do botao de WhatsApp da pagina de vendas (vira quente-principal). */
const ABERTURAS_QUENTES: RegExp[] = jsonDaEnv<string[]>("FRASES_QUENTES", [])
  .map(regexSegura)
  .filter((x): x is RegExp => x !== null);

/** Portas por texto de botao: as configuradas + o descadastro (vale sempre). */
export const PORTAS_DE_BOTAO: Porta[] = [
  ...jsonDaEnv<Array<{ frase?: string; tag?: string }>>("PORTAS_JSON", [])
    .map((x) => ({ re: x.frase ? regexSegura(x.frase) : null, tag: String(x.tag ?? "").toLowerCase() }))
    .filter((x): x is Porta => x.re !== null && x.tag !== ""),
  // Descadastro pedido pelo botão: tag de controle tira todos os agentes e réguas.
  { re: /^\s*n[aã]o quero receber\s*[.!]?\s*$/i, tag: "controle-optout" },
];

/** Tag de agente pelo texto do botão da página, ou null. */
export function tagDaMensagem(corpo: string): string | null {
  return PORTAS_DE_BOTAO.find((x) => x.re.test(String(corpo ?? "")))?.tag ?? null;
}

/**
 * Tag de agente pela página do formulário. Todas as agendas gravam no mesmo funil, então é o
 * `nicho` do formulário que separa as ofertas: nicho igual ao slug de uma oferta do negocio.json
 * liga o interesse dela (a primeira oferta é sempre `principal`).
 */
export function tagDoNicho(nicho: string | null | undefined): string | null {
  const n = String(nicho ?? "").toLowerCase().trim();
  if (!n) return null;
  const ofertas = negocio().ofertas;
  if (ofertas[0] && (n === ofertas[0].slug.toLowerCase() || n === PRINCIPAL)) return tagInteresse(PRINCIPAL);
  const outra = ofertas.slice(1).find((o) => o.slug.toLowerCase() === n);
  return outra ? `interesse-${outra.slug.toLowerCase()}` : null;
}

/** O funil/oferta do formulario fala da oferta principal (slug ou nome)? */
function casaFunilPrincipal(v: string): boolean {
  const o = negocio().ofertas[0];
  if (!o) return false;
  const t = v.toLowerCase();
  return t.includes(PRINCIPAL) || t.includes(o.slug.toLowerCase()) || (o.nome.length >= 4 && t.includes(o.nome.toLowerCase()));
}

/** Funil de material gratuito (isca, pdf, guia, ebook) -> `isca-<slug>`; senão null. */
export function tagDeIsca(funil: string): string | null {
  const f = funil.toLowerCase().trim();
  if (!/\b(isca|pdf|guia|material|e-?book|checklist)\b/.test(f.replace(/[-_:]/g, " "))) return null;
  const slug = f
    .split(/\s+/)[0]
    .replace(/^funil:/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/^isca-/, "")
    .slice(0, 40);
  return slug ? `isca-${slug}` : "isca-material";
}

function casaEvento(v: string): boolean {
  return /evento|workshop|aula[- ]ao[- ]vivo|masterclass|webinar|inscri/i.test(v);
}

/** O lead entrou pela página de um evento/aula (ingresso/inscrição do ciclo)? */
export function ehLeadDoEvento(d: Pick<DadosDeLead, "funil" | "oferta" | "campanha">): boolean {
  return casaEvento(`${d.funil ?? ""} ${d.oferta ?? ""} ${d.campanha ?? ""}`.trim());
}

const MAX_MENSAGENS_DO_DESCONHECIDO = 6;
const MAX_PALAVRAS_DA_PERGUNTA = 12;

/**
 * Quem chama o número direto (anúncio com botão de WhatsApp) e escreve uma pergunta curta com uma
 * palavra do serviço (PALAVRAS_DO_SERVICO), sem funil nem tag, ganha o interesse do principal.
 * Só entra quem é claramente um estranho: contato novo, origem `whatsapp`, nenhuma mensagem nossa
 * na conversa. Amigo/família/cliente antigo não casam. Sem a env, ninguém entra por aqui.
 */
export async function tagDoDesconhecidoDoServico(contactId: string, texto: string): Promise<string | null> {
  const palavras = process.env.PALAVRAS_DO_SERVICO ? regexSegura(process.env.PALAVRAS_DO_SERVICO) : null;
  if (!palavras || !palavras.test(texto) || texto.split(/\s+/).length > MAX_PALAVRAS_DA_PERGUNTA) return null;
  const contato = await db.contact.findUnique({
    where: { id: contactId },
    select: { origem: true, lifecycleStage: true, tags: true },
  });
  if (!contato || contato.origem !== "whatsapp" || contato.lifecycleStage !== "novo") return null;
  if (tagsDe(contato.tags).length) return null;
  const mensagens = await db.whatsappMessage.findMany({
    where: { contactId },
    select: { direction: true },
    take: MAX_MENSAGENS_DO_DESCONHECIDO + 1,
  });
  if (mensagens.length > MAX_MENSAGENS_DO_DESCONHECIDO) return null;
  if (mensagens.some((m) => m.direction === "outbound")) return null;
  return tagInteresse(PRINCIPAL);
}

/**
 * Porta pela MENSAGEM recebida: o botao da pagina de vendas abre a conversa
 * com intencao declarada. Chamado pelo webhook antes do seletor.
 */
export async function carimbarPortaDaMensagem(contactId: string, corpo: string) {
  const texto = String(corpo ?? "").trim();
  if (!texto) return { tag: null };

  // Botao de WhatsApp das paginas: o lead chega com origem `whatsapp` (wa.me direto, sem
  // formulario) e so o texto pre-preenchido diz de onde veio (PORTAS_JSON).
  const doBotao = tagDaMensagem(texto);
  if (doBotao) {
    await adicionarTag(contactId, doBotao, "porta:botao-pagina");
    return { tag: doBotao };
  }

  const desconhecido = await tagDoDesconhecidoDoServico(contactId, texto);
  if (desconhecido) {
    await adicionarTag(contactId, desconhecido, "porta:desconhecido-servico");
    return { tag: desconhecido };
  }

  if (!ABERTURAS_QUENTES.some((re) => re.test(texto))) return { tag: null };

  const contato = await db.contact.findUnique({ where: { id: contactId }, select: { tags: true } });
  const tags = tagsDe(contato?.tags);
  if (tags.includes(tagComprou(PRINCIPAL))) return { tag: null };

  const tag = tagQuente(PRINCIPAL);
  await adicionarTag(contactId, tag, "porta:botao-pagina");
  return { tag };
}

/**
 * Porta pela COMPRA (webhook de venda). Comprar o INGRESSO do evento e a
 * inscricao do playbook: alem de `comprou-entrada`, a pessoa entra no ciclo
 * (`inscrito-evento-cNN`) — e a tag que liga o Agente 01 e a regua.
 */
export async function carimbarPortaDeCompra(contactId: string, slugProduto: string) {
  if (slugProduto !== PRODUTOS.entrada.slug) return { tags: [] as string[] };
  const evento = await lerEvento();
  const tag = tagInscritoEvento(evento.ciclo);
  const r = await adicionarTag(contactId, tag, "porta:compra-ingresso");
  return { tags: r.adicionada ? [tag] : [] };
}

export type DadosDeLead = {
  funil?: string | null;
  oferta?: string | null;
  etapa?: string | null;
  origem?: string | null;
  campanha?: string | null;
  nicho?: string | null;
};

/**
 * Porta pelo LEAD que entra em /api/leads/entrada (quiz, formulario, carta,
 * captura do evento). Devolve as tags carimbadas — o caller grava no evento.
 */
export async function carimbarPortaDeLead(contactId: string, d: DadosDeLead): Promise<string[]> {
  const funil = `${d.funil ?? ""} ${d.oferta ?? ""} ${d.campanha ?? ""}`.trim();
  const etapa = String(d.etapa ?? "").toLowerCase();
  const carimbadas: string[] = [];

  const contato = await db.contact.findUnique({ where: { id: contactId }, select: { tags: true } });
  const tags = tagsDe(contato?.tags);

  const carimba = async (tag: string) => {
    if (tags.includes(tag)) return;
    const r = await adicionarTag(contactId, tag, "porta:lead");
    if (r.adicionada) carimbadas.push(tag);
  };

  const tagNicho = tagDoNicho(d.nicho);
  if (tagNicho) await carimba(tagNicho);

  // Material gratuito (isca): tag isca-<slug do funil> liga o agente de nutrição.
  const isca = tagDeIsca(funil);
  if (isca) await carimba(isca);

  if (ehLeadDoEvento(d)) {
    const evento = await lerEvento();
    if (evento.pago) {
      // Evento PAGO: inscrito e quem PAGOU (webhook de venda). Lead que deixou
      // contato na LP do ingresso e ainda nao comprou = carrinho aberto do
      // produto de entrada — e o Agente 03 quem fala com ele.
      if (!tags.includes(tagComprou(PRODUTOS.entrada.slug)) && !tags.includes(tagInscritoEvento(evento.ciclo))) {
        await carimba(tagCheckoutAbandonado(PRODUTOS.entrada.slug));
      }
    } else {
      await carimba(tagInscritoEvento(evento.ciclo));
    }
  }

  if (casaFunilPrincipal(funil) && !tags.includes(tagComprou(PRINCIPAL))) {
    // Clicou no CTA da pagina e foi pro checkout = carrinho aberto. Se a compra
    // nao vier, e o agente de recuperacao quem fala com essa pessoa (tag de produto,
    // permanente). Sem clique, e interesse.
    if (/clicou[_-]?checkout|checkout/.test(etapa)) {
      await carimba(tagCheckoutAbandonado(PRINCIPAL));
    } else {
      await carimba(tagInteresse(PRINCIPAL));
    }
  }

  return carimbadas;
}
