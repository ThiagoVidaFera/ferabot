import { db } from "@/lib/db";

/**
 * Painel de leads por IDADE — quando o lead chegou (`createdAt`), não quando
 * falou por último. A pergunta que ele responde é "o que entrou e ninguém
 * pegou?", então cada cartão carrega também o status de resposta.
 *
 * "Sem resposta" tem duas caras, e elas pedem ações diferentes:
 *   - `esperando`: ele escreveu depois do nosso último contato (a bola é nossa);
 *   - `nunca`: nunca recebeu nada nosso — nem WhatsApp, nem disparo, nem e-mail.
 * A régua de "nosso contato" é a mesma do Follow-up (`lerMarcos`), lida direto
 * no SQL pra contar a base inteira, não só os cartões que cabem na tela.
 */

export type Marca = "fera" | "lsc";
export type StatusResposta = "esperando" | "nunca" | "ok";
export type ChaveColuna = "hoje" | "semana" | "mes" | "antigos";

export type CartaoLead = {
  id: string;
  nome: string;
  phone: string | null;
  origem: string;
  estagio: string;
  marca: Marca;
  criadoEm: Date;
  status: StatusResposta;
  /** precisa de ação nossa — conta no "sem resposta" e passa no filtro */
  pendente: boolean;
};

export type ColunaLeads = {
  chave: ChaveColuna;
  titulo: string;
  total: number;
  semResposta: number;
  cartoes: CartaoLead[];
};

/** Cliente e perdido já não são lead — ficam fora do painel. */
const ESTAGIOS_FORA = ["cliente", "perdido"];

/**
 * Status que o atendente marca à mão no cartão. Eles VENCEM o status
 * calculado: quem marcou "Futuro" já decidiu que não é pra responder agora.
 * "Sem resposta" manual (o lead sumiu depois do nosso contato) segue pendente.
 */
export const STATUS_MANUAIS = ["proposta", "futuro", "sem_resposta"] as const;
export type StatusManual = (typeof STATUS_MANUAIS)[number];

export function ehStatusManual(v: string): v is StatusManual {
  return (STATUS_MANUAIS as readonly string[]).includes(v);
}

function estaPendente(estagio: string, status: StatusResposta): boolean {
  if (estagio === "sem_resposta") return true;
  if (ehStatusManual(estagio)) return false;
  return status !== "ok";
}

/** Cartões por coluna. A contagem do cabeçalho é sempre da base inteira. */
export const LIMITE_CARTOES = 60;

/**
 * Negócio com DUAS marcas no mesmo CRM: os funis da segunda marca casam com a regex de
 * `MARCA_SECUNDARIA_FUNIS` (env, ex.: "marca2|outro-funil"). Sem a env, tudo é a marca principal.
 * O CRM não guarda marca, então ela sai do slug do funil.
 */
const FUNIL_SECUNDARIO: RegExp | null = (() => {
  try {
    return process.env.MARCA_SECUNDARIA_FUNIS ? new RegExp(process.env.MARCA_SECUNDARIA_FUNIS, "i") : null;
  } catch {
    return null;
  }
})();

export function marcaDaOrigem(origem: string): Marca {
  return FUNIL_SECUNDARIO?.test(origem) ? "lsc" : "fera";
}

type MarcoSql = { contactId: string; nosso: string | null; dele: string | null };

/** Último contato nosso e última mensagem dele, por contato, numa consulta só. */
async function marcosDeResposta(): Promise<Map<string, StatusResposta>> {
  const linhas = await db.$queryRaw<MarcoSql[]>`
    SELECT contactId,
      MAX(CASE WHEN eventType IN ('broadcast', 'email_sent')
                 OR (eventType = 'whatsapp_message' AND json_extract(metadata, '$.direcao') = 'enviada')
               THEN timestamp END) AS nosso,
      MAX(CASE WHEN eventType = 'whatsapp_message' AND json_extract(metadata, '$.direcao') = 'recebida'
               THEN timestamp END) AS dele
    FROM TimelineEvent
    GROUP BY contactId`;

  const mapa = new Map<string, StatusResposta>();
  for (const l of linhas) {
    const nosso = l.nosso ? new Date(l.nosso).getTime() : null;
    const dele = l.dele ? new Date(l.dele).getTime() : null;
    if (dele !== null && (nosso === null || dele > nosso)) mapa.set(l.contactId, "esperando");
    else if (nosso === null) mapa.set(l.contactId, "nunca");
    else mapa.set(l.contactId, "ok");
  }
  return mapa;
}

function inicioDoDia(diasAtras: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diasAtras);
  return d;
}

function colunaDe(criadoEm: Date, cortes: { hoje: Date; semana: Date; mes: Date }): ChaveColuna {
  if (criadoEm >= cortes.hoje) return "hoje";
  if (criadoEm >= cortes.semana) return "semana";
  if (criadoEm >= cortes.mes) return "mes";
  return "antigos";
}

const TITULOS: Record<ChaveColuna, string> = {
  hoje: "Hoje",
  semana: "Últimos 7 dias",
  mes: "8 a 30 dias",
  antigos: "Mais de 30 dias",
};

/** Esperando você vem primeiro, depois nunca contatado; dentro de cada um, o mais novo. */
const PESO: Record<StatusResposta, number> = { esperando: 0, nunca: 1, ok: 2 };

function peso(c: CartaoLead): number {
  return c.pendente ? PESO[c.status] : 3;
}

export async function painelLeads(filtro: {
  marca?: Marca;
  soSemResposta?: boolean;
}): Promise<ColunaLeads[]> {
  const [contatos, status] = await Promise.all([
    db.contact.findMany({
      where: {
        lifecycleStage: { notIn: ESTAGIOS_FORA },
        // Excluído no cartão (ou no Inbox) some daqui; o histórico fica.
        OR: [{ conversa: null }, { conversa: { estado: { not: "excluida" } } }],
      },
      select: {
        id: true,
        name: true,
        phone: true,
        origem: true,
        lifecycleStage: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    marcosDeResposta(),
  ]);

  const cortes = { hoje: inicioDoDia(0), semana: inicioDoDia(7), mes: inicioDoDia(30) };
  const colunas = new Map<ChaveColuna, ColunaLeads>(
    (Object.keys(TITULOS) as ChaveColuna[]).map((chave) => [
      chave,
      { chave, titulo: TITULOS[chave], total: 0, semResposta: 0, cartoes: [] },
    ]),
  );

  for (const c of contatos) {
    const marca = marcaDaOrigem(c.origem);
    if (filtro.marca && marca !== filtro.marca) continue;

    // Contato sem nenhum evento na linha do tempo nunca recebeu nada nosso.
    const st = status.get(c.id) ?? "nunca";
    const pendente = estaPendente(c.lifecycleStage, st);
    if (filtro.soSemResposta && !pendente) continue;

    const col = colunas.get(colunaDe(c.createdAt, cortes))!;
    col.total += 1;
    if (pendente) col.semResposta += 1;
    col.cartoes.push({
      id: c.id,
      nome: c.name,
      phone: c.phone,
      origem: c.origem,
      estagio: c.lifecycleStage,
      marca,
      criadoEm: c.createdAt,
      status: st,
      pendente,
    });
  }

  return [...colunas.values()].map((col) => ({
    ...col,
    cartoes: [...col.cartoes]
      .sort((a, b) => peso(a) - peso(b) || b.criadoEm.getTime() - a.criadoEm.getTime())
      .slice(0, LIMITE_CARTOES),
  }));
}
