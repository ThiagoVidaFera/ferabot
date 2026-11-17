import { db } from "@/lib/db";
import { auditar } from "@/lib/audit";
import { adicionarTag, tagsDe } from "@/lib/tags";
import { dataDeRetorno } from "@/lib/followup-adiado";
import { adiamentoNaFala, disseSim, fechouComOutro, pediuDescadastro } from "@/lib/fala-do-lead";
import { conexaoDoNumeroUnico, exigeNumeroUnico, recarregarNumeroUnico, sessaoNumeroUnico } from "@/lib/numero-unico";
import type { Conexao } from "@/lib/whatsapp";

/**
 * GUARDA CENTRAL DE TOQUE AUTOMÁTICO (13/11/2026).
 *
 * Toda régua e todo disparo que sai sozinho (sem alguém digitando no Inbox) pergunta aqui antes
 * de enviar. Nasceu da auditoria das conversas de 12/11: oferta pra cliente (Camila),
 * "relacionamento tóxico" pra quem disse "vamos fechar" (Henrick), follow-up pra quem fechou com
 * outra empresa (Andrezza), pra quem pediu "fim de novembro" (Débora), pra quem pediu "me tire"
 * (marcelo) e em cima de áudio do lead esperando resposta.
 *
 * `podeTocar` é a regra pura (testada em `scripts/testes/pode-tocar.test.ts`);
 * `podeTocarContato` lê o banco, carimba tag quando a fala pede, registra o bloqueio na auditoria
 * e aplica o número único (troca a conexão pela do número único ou bloqueia; ver numero-unico.ts).
 * Régua nova = chamar `podeTocarContato` logo antes do envio e usar a conexão devolvida.
 */

export type MensagemToque = { direction: string; body: string | null; type?: string | null; timestamp: Date };
export type ContatoToque = { lifecycleStage: string; tags: string[]; compras: number };

export type MotivoToque =
  | "estagio"
  | "comprou"
  | "optout"
  | "ultima_do_lead"
  | "fechou_com_outro"
  | "adiou"
  | "disse_sim"
  | "numero_unico";

export type DecisaoToque =
  | { liberado: true }
  | { liberado: false; motivo: MotivoToque; detalhe: string; carimbarTag?: string };

export const ESTAGIOS_SEM_TOQUE = ["cliente", "perdido", "sem_automacao", "pessoal"];
export const TAGS_OPTOUT = ["optout", "controle-optout", "controle-nao-perturbe", "descadastro"];
export const TAG_DISSE_SIM = "disse-sim";
const DIA_MS = 86_400_000;
/** "Vamos fechar" vale por este tempo; depois disso a conversa já é outra. */
export const JANELA_SIM_MS = 30 * DIA_MS;
/** Adiamento escrito há mais que isso não segura mais nada. */
const JANELA_ADIAMENTO_MS = 180 * DIA_MS;

const bloqueio = (motivo: MotivoToque, detalhe: string, carimbarTag?: string): DecisaoToque => ({
  liberado: false,
  motivo,
  detalhe,
  ...(carimbarTag ? { carimbarTag } : {}),
});

const curto = (t: string | null | undefined) => `"${(t ?? "").replace(/\s+/g, " ").trim().slice(0, 60)}"`;

/** Regra pura: este contato pode receber um toque automático agora? */
export function podeTocar(c: ContatoToque, mensagens: readonly MensagemToque[], agora: Date): DecisaoToque {
  if (ESTAGIOS_SEM_TOQUE.includes(c.lifecycleStage)) return bloqueio("estagio", `estágio ${c.lifecycleStage}`);
  if (c.compras > 0 || c.tags.some((t) => t.startsWith("comprou-"))) return bloqueio("comprou", "já comprou");
  const tagOptout = c.tags.find((t) => TAGS_OPTOUT.includes(t));
  if (tagOptout) return bloqueio("optout", `tag ${tagOptout}`);

  const ordenadas = [...mensagens].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  const dele = ordenadas.filter((m) => m.direction === "inbound");

  const pediuSair = dele.find((m) => pediuDescadastro(m.body));
  if (pediuSair) return bloqueio("optout", `o lead escreveu ${curto(pediuSair.body)}`, "optout");

  const ultima = ordenadas[0];
  if (ultima?.direction === "inbound") {
    const tipo = ultima.type && ultima.type !== "text" ? ` (${ultima.type})` : "";
    return bloqueio("ultima_do_lead", `a última mensagem é do lead${tipo}: quem responde é gente`);
  }

  const outro = dele.find((m) => fechouComOutro(m.body));
  if (outro) return bloqueio("fechou_com_outro", `o lead escreveu ${curto(outro.body)}`, "fechou-com-outro");

  const retornoTag = dataDeRetorno(c.tags, agora);
  if (retornoTag && agora < retornoTag) return bloqueio("adiou", `tag de retorno até ${retornoTag.toISOString().slice(0, 10)}`);
  for (const m of dele) {
    if (agora.getTime() - m.timestamp.getTime() > JANELA_ADIAMENTO_MS) break;
    const ate = adiamentoNaFala(m.body, m.timestamp);
    if (ate && agora < ate) return bloqueio("adiou", `o lead pediu ${curto(m.body)}, espera até ${ate.toISOString().slice(0, 10)}`);
  }

  const sim = dele.find((m) => agora.getTime() - m.timestamp.getTime() <= JANELA_SIM_MS && disseSim(m.body));
  if (sim) {
    return bloqueio("disse_sim", `o lead disse ${curto(sim.body)} e não há venda: toque humano (resumo das 8h)`, TAG_DISSE_SIM);
  }
  return { liberado: true };
}

// ---------------------------------------------------------------------------
// Camada com banco
// ---------------------------------------------------------------------------

export type PedidoToque = {
  contactId: string;
  /** nome curto da régua/disparo, vai pra auditoria (ex.: "sequencia-proposta") */
  regua: string;
  /** conexão que vai enviar: lead com número único troca pela conexão dele (ou bloqueia) */
  conexao?: Conexao | null;
  /** só a sessão, quando quem envia é outro módulo: confere sem trocar */
  sessao?: string | null;
  /** convite que sai colado em outra mensagem não troca de número: só confere */
  semTrocarNumero?: boolean;
  /** modo teste das réguas: decide sem carimbar tag nem gravar auditoria */
  seco?: boolean;
  agora?: Date;
};

export type ResultadoToque =
  | { liberado: true; conexao: Conexao | null }
  | { liberado: false; motivo: MotivoToque | "sem_contato"; detalhe: string };

const MENSAGENS_LIDAS = 60;
/** Um registro de bloqueio por régua/contato/motivo por dia: o cron roda a cada minuto. */
const jaRegistrado = new Set<string>();

async function registrarBloqueio(p: PedidoToque, motivo: string, detalhe: string, agora: Date): Promise<void> {
  if (p.seco) return;
  const chave = `${p.regua}:${p.contactId}:${motivo}:${agora.toISOString().slice(0, 10)}`;
  if (jaRegistrado.has(chave)) return;
  if (jaRegistrado.size > 5000) jaRegistrado.clear();
  jaRegistrado.add(chave);
  await auditar(`regua:${p.regua}`, "toque_bloqueado", `${p.contactId}: ${motivo} — ${detalhe}`.slice(0, 300)).catch(() => {});
}

/** Número único: devolve a conexão que pode falar com o lead, ou null se nenhuma pode. */
async function conexaoPermitida(origem: string, p: PedidoToque): Promise<{ ok: boolean; conexao: Conexao | null }> {
  const atual = p.conexao ?? null;
  await recarregarNumeroUnico();
  if (!exigeNumeroUnico(origem)) return { ok: true, conexao: atual };
  const sessao = atual?.sessao ?? p.sessao ?? null;
  if (sessao === sessaoNumeroUnico()) return { ok: true, conexao: atual };
  if (!atual || p.semTrocarNumero) return { ok: false, conexao: null };
  const unico = await conexaoDoNumeroUnico();
  return unico ? { ok: true, conexao: unico } : { ok: false, conexao: null };
}

/**
 * Pergunta à guarda antes de qualquer toque automático. Nunca lança: erro de leitura = não envia.
 * Use SEMPRE a `conexao` devolvida (lead com número único pode ter trocado de conexão).
 */
export async function podeTocarContato(p: PedidoToque): Promise<ResultadoToque> {
  const agora = p.agora ?? new Date();
  try {
    const contato = await db.contact.findUnique({
      where: { id: p.contactId },
      select: { lifecycleStage: true, tags: true, origem: true, purchaseCount: true, _count: { select: { purchases: true } } },
    });
    if (!contato) return { liberado: false, motivo: "sem_contato", detalhe: "contato não existe" };
    const mensagens = await db.whatsappMessage.findMany({
      where: { contactId: p.contactId },
      orderBy: { timestamp: "desc" },
      take: MENSAGENS_LIDAS,
      select: { direction: true, body: true, type: true, timestamp: true },
    });
    const tags = tagsDe(contato.tags);
    const decisao = podeTocar(
      { lifecycleStage: contato.lifecycleStage, tags, compras: Math.max(contato.purchaseCount, contato._count.purchases) },
      mensagens,
      agora,
    );
    if (!decisao.liberado) {
      if (!p.seco && decisao.carimbarTag && !tags.includes(decisao.carimbarTag)) {
        await adicionarTag(p.contactId, decisao.carimbarTag, `pode-tocar:${p.regua}`).catch(() => {});
      }
      await registrarBloqueio(p, decisao.motivo, decisao.detalhe, agora);
      return { liberado: false, motivo: decisao.motivo, detalhe: decisao.detalhe };
    }

    const numero = await conexaoPermitida(contato.origem, p);
    if (!numero.ok) {
      const detalhe = "este lead só fala pelo número único configurado";
      await registrarBloqueio(p, "numero_unico", detalhe, agora);
      return { liberado: false, motivo: "numero_unico", detalhe };
    }
    return { liberado: true, conexao: numero.conexao };
  } catch (e) {
    const detalhe = `erro na guarda: ${e instanceof Error ? e.message : String(e)}`;
    await registrarBloqueio(p, "sem_contato", detalhe, agora);
    return { liberado: false, motivo: "sem_contato", detalhe };
  }
}
