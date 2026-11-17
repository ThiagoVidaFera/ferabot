import { db } from "@/lib/db";
import { auditar } from "@/lib/audit";
import { registrarEvento } from "@/lib/timeline";
import { adicionarTag, ehControle, tagsDe } from "@/lib/tags";
import { semAutomacao } from "@/lib/estagios";
import { liberarPelaConexao } from "@/lib/guarda-numero";
import { enviarTexto, type Conexao } from "@/lib/whatsapp";
import { podeTocarContato } from "@/lib/pode-tocar";
import { negocio } from "@/lib/negocio";

/**
 * Convite para o GRUPO do próximo evento gratuito (aula, webinar, live): todo robô que conversa
 * com lead chama o grupo, uma vez, quando a conversa já andou. Só liga quando o negocio.json tem
 * `links.grupo` preenchido.
 *
 * Mora aqui, num lugar só, porque a regra de QUEM recebe é de código (prompt não segura "uma vez
 * por contato" nem "15 dias depois da proposta"):
 *
 *  - uma vez por contato (tag `convite-aula-enviado`);
 *  - quem já fechou (estágio cliente ou `comprou-*`) não recebe;
 *  - quem está em negociação só recebe 15 dias depois da proposta enviada;
 *  - quem veio do funil do grupo já está lá dentro;
 *  - opt-out, controle humano, perdido e sem automação ficam de fora;
 *  - nunca na 1ª mensagem nossa: só quando a conversa já está andando;
 *  - só quem está na base há pelo menos 10 dias (lead recém-chegado não recebe convite de grupo).
 *
 * O convite sai como mensagem SEPARADA, logo depois da mensagem do robô, com
 * `origem: "convite-aula"` (não conta como gente falando, ver `ehEnvioHumano`).
 */

/** O link do grupo do negocio.json (vazio = convite desligado). */
export const LINK_GRUPO_BASTIDORES = negocio().links.grupo;
export const TAG_CONVITE_AULA = "convite-aula-enviado";
export const ESPERA_APOS_PROPOSTA_MS = 15 * 24 * 60 * 60 * 1000;
const DELAY_ANTES_DO_CONVITE_MS = 1500;
const MINIMO_MENSAGENS_ANTERIORES = 1;
export const DIAS_MINIMOS_NA_BASE = 10;
export const MINIMO_NA_BASE_MS = DIAS_MINIMOS_NA_BASE * 24 * 60 * 60 * 1000;
/** Mensagem "de turno anterior" = gravada há mais que isso (as partes de um mesmo turno saem com poucos segundos). */
const JANELA_MESMO_TURNO_MS = 2 * 60 * 1000;

export const TEXTO_CONVITE_AULA = [
  `${negocio().dono.primeiroNome} avisa no grupo quando abre o próximo evento gratuito, com conteúdo prático sobre ${negocio().nicho}.`,
  `Entra no grupo para não perder: ${LINK_GRUPO_BASTIDORES}`,
].join("\n\n");

/** Origens que não recebem: o grupo (já estão lá). */
const ORIGENS_FORA = ["funil:grupo"];
const ESTAGIOS_FORA = ["cliente", "perdido"];

export type ContatoConvite = {
  origem: string;
  lifecycleStage: string;
  tags: string[];
  /** quando o contato entrou na base */
  criadoEm: Date;
  /** quando o contato entrou em `proposta` pela última vez */
  propostaEm: Date | null;
  /** mensagens nossas ENVIADAS em turnos anteriores (fora o convite e o turno que está saindo) */
  mensagensAnteriores: number;
};

export type DecisaoConvite = { enviar: true } | { enviar: false; motivo: string };

function normalizar(origem: string): string {
  return origem.toLowerCase().replace(/_/g, "-");
}

/** Regra pura: este contato recebe o convite agora? */
export function decidirConviteAula(c: ContatoConvite, agora: Date): DecisaoConvite {
  if (c.tags.includes(TAG_CONVITE_AULA)) return { enviar: false, motivo: "já recebeu" };
  if (c.tags.some((t) => ehControle(t))) return { enviar: false, motivo: "opt-out ou controle humano" };
  if (c.tags.some((t) => t.startsWith("comprou-"))) return { enviar: false, motivo: "já comprou" };
  if (ESTAGIOS_FORA.includes(c.lifecycleStage)) return { enviar: false, motivo: `estágio ${c.lifecycleStage}` };
  if (semAutomacao(c.lifecycleStage)) return { enviar: false, motivo: "sem automação" };
  const origem = normalizar(c.origem);
  if (ORIGENS_FORA.some((o) => origem === o || origem.startsWith(`${o}-`))) return { enviar: false, motivo: "já está no grupo" };
  if (agora.getTime() - c.criadoEm.getTime() < MINIMO_NA_BASE_MS) {
    return { enviar: false, motivo: `menos de ${DIAS_MINIMOS_NA_BASE} dias na base` };
  }
  if (c.mensagensAnteriores < MINIMO_MENSAGENS_ANTERIORES) return { enviar: false, motivo: "1ª interação da conversa" };

  const emProposta = c.lifecycleStage === "proposta";
  if (emProposta && !c.propostaEm) return { enviar: false, motivo: "proposta sem data conhecida" };
  if (c.propostaEm && agora.getTime() - c.propostaEm.getTime() < ESPERA_APOS_PROPOSTA_MS) {
    return { enviar: false, motivo: "menos de 15 dias da proposta" };
  }
  return { enviar: true };
}

async function lerContato(contactId: string): Promise<ContatoConvite | null> {
  const contato = await db.contact.findUnique({
    where: { id: contactId },
    select: { origem: true, lifecycleStage: true, tags: true, customFields: true, createdAt: true },
  });
  if (!contato) return null;
  const limiteTurno = new Date(Date.now() - JANELA_MESMO_TURNO_MS);
  const [proposta, mensagensAnteriores] = await Promise.all([
    db.timelineEvent.findFirst({
      where: { contactId, eventType: "stage_change", metadata: { path: "$.para", equals: "proposta" } },
      orderBy: { timestamp: "desc" },
      select: { timestamp: true },
    }),
    db.whatsappMessage.count({
      where: {
        contactId,
        direction: "outbound",
        status: "sent",
        timestamp: { lt: limiteTurno },
        NOT: { metadata: { path: "$.origem", equals: "convite-aula" } },
      },
    }),
  ]);
  // proposta marcada pelo botão do Inbox também vale, mesmo se o estágio mudou depois
  // (`toque_proposta` é o registro antigo do 👀 de 48h; `lembrete_proposta` é o D+3 que o substituiu)
  const campos = contato.customFields as Record<string, { agendadoEm?: string } | undefined> | null;
  const toquesEm = [campos?.toque_proposta, campos?.lembrete_proposta].map((t) =>
    t?.agendadoEm ? new Date(t.agendadoEm) : null,
  );
  const datas = [proposta?.timestamp, ...toquesEm].filter((d): d is Date => !!d && !Number.isNaN(d.getTime()));
  const propostaEm = datas.length ? new Date(Math.max(...datas.map((d) => d.getTime()))) : null;
  return {
    origem: contato.origem,
    criadoEm: contato.createdAt,
    lifecycleStage: contato.lifecycleStage,
    tags: tagsDe(contato.tags),
    propostaEm,
    mensagensAnteriores,
  };
}

/**
 * Chamado pelos robôs DEPOIS de a mensagem deles sair com sucesso. Nunca lança:
 * convite é bônus, não pode derrubar o envio principal.
 */
export async function enviarConviteAulaSeElegivel(args: {
  contactId: string;
  conexao: Conexao;
  destino: string;
  agora?: Date;
}): Promise<boolean> {
  const { contactId, conexao, destino } = args;
  const agora = args.agora ?? new Date();
  if (!/^https?:\/\//i.test(LINK_GRUPO_BASTIDORES)) return false;
  try {
    const contato = await lerContato(contactId);
    if (!contato) return false;
    if (!decidirConviteAula(contato, agora).enviar) return false;

    const dono = await db.contact.findUnique({ where: { id: contactId }, select: { phone: true } });
    if (!dono?.phone) return false;

    // Guarda central: compra, opt-out, "vamos fechar", adiamento, número único (sem trocar).
    const toque = await podeTocarContato({ contactId, regua: "convite-aula", conexao, semTrocarNumero: true, agora });
    if (!toque.liberado) return false;

    const liberado = await liberarPelaConexao(conexao, "rotina", dono.phone);
    if (!liberado.liberado) return false;

    // Carimba ANTES de enviar: dois robôs na mesma janela não mandam duas vezes.
    const carimbo = await adicionarTag(contactId, TAG_CONVITE_AULA, "convite-aula");
    if (!carimbo.adicionada) return false;

    await new Promise((ok) => setTimeout(ok, DELAY_ANTES_DO_CONVITE_MS));
    const r = await enviarTexto(conexao, destino, TEXTO_CONVITE_AULA);
    if (!r.ok) {
      // falhou: devolve a vez, pra tentar na próxima mensagem do robô
      const atual = await db.contact.findUnique({ where: { id: contactId }, select: { tags: true } });
      if (atual) {
        await db.contact.update({
          where: { id: contactId },
          data: { tags: tagsDe(atual.tags).filter((t) => t !== TAG_CONVITE_AULA) as never },
        });
      }
      await auditar("sistema", "convite_aula_falhou", `${contactId}: ${r.erro ?? "?"}`);
      return false;
    }
    await db.whatsappMessage.create({
      data: {
        contactId,
        instanceId: conexao.instanceId ?? null,
        fromNumber: "crm",
        toNumber: dono.phone,
        body: TEXTO_CONVITE_AULA,
        direction: "outbound",
        status: "sent",
        externalId: r.externalId ?? null,
        metadata: { origem: "convite-aula", fonte: "api", ator: "sistema" } as never,
      },
    });
    await registrarEvento({
      contactId,
      eventType: "whatsapp_message",
      channel: "whatsapp",
      metadata: { direcao: "enviada", texto: TEXTO_CONVITE_AULA, origem: "convite-aula", ator: "sistema" },
    });
    return true;
  } catch (e) {
    await auditar("sistema", "convite_aula_erro", `${contactId}: ${e instanceof Error ? e.message : String(e)}`).catch(
      () => {},
    );
    return false;
  }
}
