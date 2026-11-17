import { db } from "@/lib/db";
import { config } from "@/lib/config";
import { avisar } from "@/lib/notificacao";
import { internos } from "@/lib/followup-auto";
import { elegivel, type ContatoLeve } from "@/lib/fila-sem-resposta";
import { horaDeBrasilia } from "@/lib/resumo-diario";
import { tagsDe } from "@/lib/tags";
import { TAG_DISSE_SIM } from "@/lib/pode-tocar";
import { negocio } from "@/lib/negocio";

/**
 * RESUMO DAS 8H: conversas que esfriaram (04/11/2026).
 *
 * Os agentes respondem os leads, então os avisos a cada mensagem saíram. No lugar, uma vez por
 * dia o dono recebe dois blocos, cada conversa com o link direto do WhatsApp (wa.me; sem telefone
 * válido cai no Inbox). A ordem é por prioridade: bloco da pessoa que falou e ninguém respondeu vem
 * primeiro, e dentro de cada bloco proposta > call marcada > conversando > novo > frio > futuro.
 *   1. a última mensagem foi DA PESSOA há 24h ou mais e ninguém respondeu;
 *   2. a última mensagem foi NOSSA há 72h ou mais e a pessoa não falou mais nada.
 * Só entra conversa de verdade (a pessoa já escreveu alguma vez). O resumo de todos os números
 * conectados vai para o WhatsApp de avisos (Setting `notificar_whatsapp`) ou, sem ele, para o
 * WhatsApp do dono no negocio.json. Não envia nada ao lead.
 */

const HORA_MS = 3_600_000;
const DIA_MS = 24 * HORA_MS;
const HORA_ENVIO = 8;
const HORA_LIMITE = 12; // se o cron perdeu a manhã, não manda o "bom dia" à tarde
const DIAS_PADRAO = 30;
const HORAS_NOSSA_ULTIMA = 72;
const HORAS_DELE_ULTIMA = 24;
const TAMANHO_MENSAGEM = 3200;
const PAUSA_ENTRE_ENVIOS_MS = 2500;

export type Conversa = {
  contactId: string;
  nome: string;
  /** de quem foi a última mensagem */
  ultima: "nossa" | "dele";
  em: Date;
  /** celular (só dígitos) que recebe o resumo desta conversa */
  destino: string;
  /** telefone do lead, como está no CRM (vira o link do WhatsApp) */
  telefone: string | null;
  /** estágio do funil (lifecycleStage), define a prioridade */
  estagio: string;
  /** o lead disse sim ("vamos fechar") e não há venda: a régua não toca, quem fecha é gente (pode-tocar.ts) */
  disseSim?: boolean;
};

export type ListasDoDia = { nossaUltima: Conversa[]; deleUltima: Conversa[]; disseSim?: Conversa[] };

/** Quanto menor, mais quente. Estágio desconhecido vai pro fim. */
const PESO_ESTAGIO: Readonly<Record<string, number>> = {
  proposta: 0,
  call_marcada: 1,
  conversando: 2,
  novo: 3,
  frio: 4,
  futuro: 5,
};
const PESO_DESCONHECIDO = 6;
const ROTULO_ESTAGIO: Readonly<Record<string, string>> = {
  proposta: "proposta",
  call_marcada: "call marcada",
  conversando: "conversando",
  novo: "novo",
  frio: "frio",
  futuro: "futuro",
};
const ESTAGIOS_QUENTES: ReadonlySet<string> = new Set(["proposta", "call_marcada"]);

const pesoDe = (c: Conversa): number => PESO_ESTAGIO[c.estagio] ?? PESO_DESCONHECIDO;

/** Separa as duas listas: estágio mais quente primeiro e, dentro dele, a mais recente. Pura. */
export function separarListas(conversas: readonly Conversa[], agora: Date): ListasDoDia {
  const horas = (c: Conversa): number => (agora.getTime() - c.em.getTime()) / HORA_MS;
  const porPrioridade = (a: Conversa, b: Conversa): number =>
    pesoDe(a) - pesoDe(b) || b.em.getTime() - a.em.getTime();
  const resto = conversas.filter((c) => !c.disseSim);
  return {
    disseSim: conversas.filter((c) => c.disseSim).sort(porPrioridade),
    nossaUltima: resto.filter((c) => c.ultima === "nossa" && horas(c) >= HORAS_NOSSA_ULTIMA).sort(porPrioridade),
    deleUltima: resto.filter((c) => c.ultima === "dele" && horas(c) >= HORAS_DELE_ULTIMA).sort(porPrioridade),
  };
}

/** wa.me/<número com DDI>; sem telefone utilizável devolve null. */
export function linkWhatsapp(telefone: string | null): string | null {
  const d = soDigitos(telefone);
  if (d.length === 10 || d.length === 11) return `https://wa.me/55${d}`;
  if (d.length >= 12 && d.length <= 15) return `https://wa.me/${d}`;
  return null;
}

function haQuanto(em: Date, agora: Date): string {
  const h = Math.floor((agora.getTime() - em.getTime()) / HORA_MS);
  return h < 48 ? `${h}h` : `${Math.floor(h / 24)} dias`;
}

function linhaDaConversa(c: Conversa, agora: Date, urlBase: string): string {
  const marca = ESTAGIOS_QUENTES.has(c.estagio) ? "🔥 " : "";
  const estagio = ROTULO_ESTAGIO[c.estagio] ?? c.estagio;
  const link = linkWhatsapp(c.telefone) ?? `${urlBase}/inbox?c=${c.contactId}`;
  return `• ${marca}${c.nome} · ${estagio} · há ${haQuanto(c.em, agora)}\n${link}`;
}

/** Monta as mensagens (cada uma abaixo do teto) com o link do WhatsApp por conversa. Pura. */
export function montarMensagens(listas: ListasDoDia, agora: Date, urlBase: string, rotulo = ""): string[] {
  const sim = listas.disseSim ?? [];
  const blocos: Array<{ titulo: string; itens: Conversa[] }> = [
    ...(sim.length ? [{ titulo: "🟢 *Disse sim e ainda não comprou: fechar na mão (a régua não toca)*", itens: sim }] : []),
    { titulo: `🔴 *A pessoa falou por último há ${HORAS_DELE_ULTIMA}h ou mais e ninguém respondeu*`, itens: listas.deleUltima },
    { titulo: `🟡 *Você falou por último há ${HORAS_NOSSA_ULTIMA}h ou mais e a pessoa não respondeu*`, itens: listas.nossaUltima },
  ];
  if (!blocos.some((b) => b.itens.length)) return [];

  const cabecalho = rotulo ? `*${rotulo}*

` : "";
  const linhas: string[] = [];
  for (const b of blocos) {
    linhas.push(`${b.titulo} (${b.itens.length})`);
    if (!b.itens.length) linhas.push("Nenhuma.");
    for (const c of b.itens) linhas.push(linhaDaConversa(c, agora, urlBase));
    linhas.push("");
  }

  const mensagens: string[] = [];
  let atual = cabecalho;
  for (const linha of linhas) {
    if (atual.length > cabecalho.length && atual.length + linha.length + 1 > TAMANHO_MENSAGEM) {
      mensagens.push(atual.trimEnd());
      atual = cabecalho;
    }
    atual += linha + "\n";
  }
  if (atual.length > cabecalho.length && atual.trim()) mensagens.push(atual.trimEnd());
  return mensagens;
}

type LinhaBruta = { contactId: string; direction: string; timestamp: string; instanceId: string | null };

/** Última mensagem de cada contato que já escreveu alguma vez, dentro da janela. */
async function ultimasMensagens(desde: Date): Promise<LinhaBruta[]> {
  return db.$queryRaw<LinhaBruta[]>`
    SELECT contactId, direction, timestamp, instanceId FROM (
      SELECT m.contactId AS contactId, m.direction AS direction, m.timestamp AS timestamp,
             m.instanceId AS instanceId,
             ROW_NUMBER() OVER (PARTITION BY m.contactId ORDER BY m.timestamp DESC) AS rn,
             MAX(CASE WHEN m.direction = 'inbound' THEN 1 ELSE 0 END)
               OVER (PARTITION BY m.contactId) AS temInbound
      FROM WhatsappMessage m
      WHERE m.contactId IS NOT NULL
    )
    WHERE rn = 1 AND temInbound = 1 AND timestamp >= ${desde.toISOString()}
  `;
}

function soDigitos(v: string | null | undefined): string {
  return (v ?? "").replace(/\D/g, "");
}

/** Instância -> celular que recebe o resumo dela: o WhatsApp de avisos, ou o do dono. */
async function destinosPorInstancia(): Promise<Map<string, string>> {
  const padrao = soDigitos(await config("notificar_whatsapp", "NOTIFICAR_WHATSAPP", negocio().dono.whatsapp));
  const todas = await db.whatsappInstance.findMany({ select: { id: true } });
  const mapa = new Map<string, string>();
  if (padrao.length < 12) return mapa;
  for (const i of todas) mapa.set(i.id, padrao);
  return mapa;
}

export async function conversasDoDia(agora: Date): Promise<Conversa[]> {
  const dias = Number(await config("resumo_silencio_dias"));
  const desde = new Date(agora.getTime() - (Number.isFinite(dias) && dias > 0 ? dias : DIAS_PADRAO) * DIA_MS);
  const [brutas, numerosInternos, destinos] = await Promise.all([ultimasMensagens(desde), internos(), destinosPorInstancia()]);
  const candidatas = brutas.filter((m) => m.instanceId && destinos.has(m.instanceId));

  const contatos = new Map<string, ContatoLeve>();
  for (let i = 0; i < candidatas.length; i += 100) {
    const lote = await db.contact.findMany({
      where: { id: { in: candidatas.slice(i, i + 100).map((m) => m.contactId) } },
      select: { id: true, name: true, phone: true, lifecycleStage: true, origem: true, tags: true, conversa: { select: { estado: true } } },
    });
    for (const c of lote) contatos.set(c.id, c);
  }

  const saida: Conversa[] = [];
  for (const m of candidatas) {
    const c = contatos.get(m.contactId);
    if (!c || !elegivel(c, numerosInternos)) continue;
    saida.push({
      contactId: c.id,
      nome: c.name || c.phone || "Sem nome",
      ultima: m.direction === "inbound" ? "dele" : "nossa",
      em: new Date(m.timestamp),
      destino: destinos.get(m.instanceId as string) as string,
      telefone: c.phone,
      estagio: c.lifecycleStage,
      disseSim: c.lifecycleStage !== "cliente" && tagsDe(c.tags).includes(TAG_DISSE_SIM),
    });
  }
  return saida;
}

const esperar = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** Chamado a cada rodada do cron (5 min): age entre 8h e 12h e uma vez por dia. */
export async function enviarResumoSilencio(agora = new Date()): Promise<{ enviado: boolean; motivo?: string; mensagens?: number }> {
  const hora = horaDeBrasilia(agora);
  if (hora < HORA_ENVIO || hora >= HORA_LIMITE) return { enviado: false, motivo: "fora da janela das 8h" };

  const dia = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(agora);

  const base = await config("crm_url", "APP_URL", "http://localhost:3900");
  const todas = await conversasDoDia(agora);
  const celulares = Array.from(new Set(todas.map((c) => c.destino)));

  let enviadas = 0;
  let motivo: string | undefined;
  for (const celular of celulares) {
    const jaSaiu = await db.notificacao.findFirst({ where: { tipo: "silencio", chave: { startsWith: `silencio:${dia}:${celular}:` } } });
    if (jaSaiu) continue;
    const listas = separarListas(todas.filter((c) => c.destino === celular), agora);
    const mensagens = montarMensagens(listas, agora, base, `WhatsApp final ${celular.slice(-4)}`);
    for (const [i, texto] of mensagens.entries()) {
      const r = await avisar("silencio", `silencio:${dia}:${celular}:${i}`, texto, { para: celular });
      if (!r.enviado) {
        motivo = r.motivo;
        break;
      }
      enviadas += 1;
      if (i < mensagens.length - 1) await esperar(PAUSA_ENTRE_ENVIOS_MS);
    }
  }
  return { enviado: enviadas > 0, motivo: enviadas ? motivo : (motivo ?? "ja avisado ou nenhuma conversa parada"), mensagens: enviadas };
}
