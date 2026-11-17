import { db } from "@/lib/db";
import { enviarConviteAulaSeElegivel } from "@/lib/convite-aula";
import { auditar } from "@/lib/audit";
import { registrarEvento, mudarEstagio } from "@/lib/timeline";
import { liberarPelaConexao } from "@/lib/guarda-numero";
import { sessaoPermitida } from "@/lib/numero-unico";

/** O guarda do número recusou: não é falha de envio, a ação volta pra fila e tenta de novo depois. */
class GuardaRecusou extends Error {}
import { conexaoPorId, enviarTexto } from "@/lib/whatsapp";
import { ehEstagio } from "@/lib/estagios";
import { destinoCloudApi } from "@/lib/telefone";

/**
 * LEI 5 — acao de agente nasce como PROPOSTA; humano aprova; recuo em 1 clique;
 * tudo auditado. Este arquivo e o unico caminho de acao de agente.
 */

export type AcaoAgente =
  | "enviar_mensagem"
  | "mover_estagio"
  | "adicionar_tag"
  | "registrar_nota"
  | "registrar_perfil";

export const ACOES: AcaoAgente[] = [
  "enviar_mensagem",
  "mover_estagio",
  "adicionar_tag",
  "registrar_nota",
  "registrar_perfil",
];

export const ROTULO_ACAO: Record<string, string> = {
  enviar_mensagem: "Enviar mensagem",
  mover_estagio: "Mover de estágio",
  adicionar_tag: "Adicionar tag",
  registrar_nota: "Registrar nota",
  registrar_perfil: "Registrar perfil do lead",
};

/**
 * Campos do perfil que o agente grava na ficha (`customFields`) conforme a
 * conversa avanca. Lista fechada: o modelo nao cria campo novo. Os rotulos que
 * o agente le de volta ficam em `atalhos.ts` (CAMPOS_DO_CASO).
 */
export const CAMPOS_DE_PERFIL = [
  "instagram",
  "faturamento",
  "ja_tentou",
  "investe_30_dia",
  "meta_3_meses",
] as const;

export type CampoDePerfil = (typeof CAMPOS_DE_PERFIL)[number];

export function ehCampoDePerfil(c: string): c is CampoDePerfil {
  return (CAMPOS_DE_PERFIL as readonly string[]).includes(c);
}

export function ehAcao(v: string): v is AcaoAgente {
  return (ACOES as string[]).includes(v);
}

/** Descricao legivel do payload, pra trilha de aprovacao. */
export function descreverPayload(acao: string, payload: Record<string, unknown>): string {
  if (acao === "enviar_mensagem") {
    if (Array.isArray(payload.partes) && payload.partes.length > 1) {
      return (payload.partes as unknown[]).map((p, i) => `(${i + 1}) ${String(p)}`).join("\n");
    }
    return String(payload.texto ?? "");
  }
  if (acao === "mover_estagio") return `→ ${String(payload.estagio ?? "?")}`;
  if (acao === "adicionar_tag") return String(payload.tag ?? "");
  if (acao === "registrar_nota") return String(payload.texto ?? "");
  if (acao === "registrar_perfil") {
    const campos = (payload.campos ?? {}) as Record<string, unknown>;
    return Object.entries(campos).map(([k, v]) => `${k}: ${String(v)}`).join("\n");
  }
  return JSON.stringify(payload);
}

export type ResultadoAcao = { ok: boolean; erro?: string };

/** Executa de verdade. So e chamado depois de aprovado (ou no modo autonomo). */
export async function executarAcao(actionId: string, ator: string): Promise<ResultadoAcao> {
  const acao = await db.agentAction.findUnique({
    where: { id: actionId },
    include: { agent: true, contact: true },
  });
  if (!acao) return { ok: false, erro: "acao nao encontrada" };
  if (acao.status === "executada") return { ok: false, erro: "ja executada" };
  if (!acao.contact) return { ok: false, erro: "acao sem contato" };

  const payload = (acao.payload ?? {}) as Record<string, unknown>;
  const contato = acao.contact;

  try {
    if (acao.acao === "enviar_mensagem") {
      const texto = String(payload.texto ?? "").trim();
      if (!texto) throw new Error("payload sem texto");
      if (!contato.phone) throw new Error("contato sem telefone");

      // O agente responde SEMPRE pelo numero que RECEBEU a conversa. Usar a
      // conexao padrao aqui foi um defeito real (18/08/2026): a resposta do
      // agente de recepcao, que atende no numero oficial, saiu pelo WhatsApp
      // PESSOAL do dono — que e a instancia default. Sem instancia conhecida
      // o envio e RECUSADO; adivinhar canal e pior que falhar.
      const ultimaEntrada = await db.whatsappMessage.findFirst({
        where: { contactId: contato.id, direction: "inbound", instanceId: { not: null } },
        orderBy: { timestamp: "desc" },
        select: { instanceId: true, fromNumber: true },
      });
      if (!ultimaEntrada?.instanceId) {
        throw new Error("nao sei por qual numero essa conversa entrou — envio recusado");
      }
      const conexao = await conexaoPorId(ultimaEntrada.instanceId);
      if (!conexao) throw new Error("WhatsApp nao conectado");
      // Número único (numero-unico.ts): lead dessa origem só fala pelo número configurado.
      if (!sessaoPermitida(contato.origem, conexao.sessao)) {
        throw new GuardaRecusou("numero unico: este lead so fala pelo numero unico configurado");
      }
      const liberado = await liberarPelaConexao(conexao, "resposta", contato.phone, texto);
      if (!liberado.liberado) throw new GuardaRecusou(`guarda do numero recusou o envio: ${liberado.motivo}`);

      const campos =
        contato.customFields && typeof contato.customFields === "object"
          ? (contato.customFields as Record<string, unknown>)
          : {};
      // No canal oficial o destino e o telefone em digitos; `@c.us` e coisa do
      // WAHA e a Cloud API recusa.
      const destino =
        conexao.provider === "cloud_api"
          ? destinoCloudApi(ultimaEntrada.fromNumber, contato.phone)
          : typeof campos.whatsapp_chat_id === "string" && campos.whatsapp_chat_id
            ? campos.whatsapp_chat_id
            : contato.phone;

      // [QUEBRA]: a resposta pode vir em partes — cada uma vira UMA mensagem
      // de WhatsApp, com intervalo, como gente digita. Uma parte que falhar
      // interrompe as seguintes (melhor mensagem faltando do que fora de ordem)
      // e o erro fica com o que ja saiu registrado.
      const partes =
        Array.isArray(payload.partes) && payload.partes.length
          ? (payload.partes as unknown[]).map((p) => String(p ?? "").trim()).filter(Boolean)
          : [texto];
      const delayMs = Math.min(
        Math.max(Number(payload.delayMs ?? acao.agent.delayQuebraMs ?? 2500) || 0, 0),
        15_000,
      );

      for (const [i, parte] of partes.entries()) {
        if (i > 0 && delayMs) await new Promise((ok) => setTimeout(ok, delayMs));
        const r = await enviarTexto(conexao, destino, parte);
        if (!r.ok) {
          throw new Error(
            `${r.erro ?? "falha no envio"}${partes.length > 1 ? ` (parte ${i + 1}/${partes.length})` : ""}`,
          );
        }

        // Se o eco do WAHA chegou antes e ja gravou este externalId, nao
        // estoura a unicidade (e nao interrompe as partes seguintes).
        const jaGravado = r.externalId
          ? await db.whatsappMessage.findUnique({ where: { externalId: r.externalId }, select: { id: true } })
          : null;
        if (!jaGravado) await db.whatsappMessage.create({
          data: {
            contactId: contato.id,
            instanceId: conexao.instanceId ?? null,
            fromNumber: "crm",
            toNumber: contato.phone,
            body: parte,
            direction: "outbound",
            status: "sent",
            externalId: r.externalId ?? null,
            metadata: {
              origem: "agente",
              agente: acao.agent.slug,
              acaoId: acao.id,
              ...(partes.length > 1 ? { parte: i + 1, partes: partes.length } : {}),
              ...(payload.followup ? { followup: String(payload.followup) } : {}),
            } as never,
          },
        });
        await registrarEvento({
          contactId: contato.id,
          eventType: "whatsapp_message",
          channel: "agente",
          metadata: {
            direcao: "enviada",
            texto: parte,
            agente: acao.agent.slug,
            // a regua (followup.ts) le `followup` da linha do tempo pra nao repetir etapa
            ...(payload.followup ? { followup: String(payload.followup) } : {}),
          },
        });
      }
      await enviarConviteAulaSeElegivel({ contactId: contato.id, conexao, destino });
    } else if (acao.acao === "mover_estagio") {
      const estagio = String(payload.estagio ?? "");
      if (!ehEstagio(estagio)) throw new Error(`estagio invalido: ${estagio}`);
      await mudarEstagio(contato.id, estagio, `agente:${acao.agent.slug}`);
    } else if (acao.acao === "adicionar_tag") {
      const tag = String(payload.tag ?? "").trim();
      if (!tag) throw new Error("payload sem tag");
      const atuais = Array.isArray(contato.tags) ? (contato.tags as string[]) : [];
      if (!atuais.includes(tag)) {
        await db.contact.update({
          where: { id: contato.id },
          data: { tags: [...atuais, tag] as never },
        });
      }
      await registrarEvento({
        contactId: contato.id,
        eventType: "acao_agente",
        channel: "agente",
        metadata: { texto: `Tag adicionada: ${tag}`, agente: acao.agent.slug },
      });
    } else if (acao.acao === "registrar_nota") {
      const texto = String(payload.texto ?? "").trim();
      if (!texto) throw new Error("payload sem texto");
      await registrarEvento({
        contactId: contato.id,
        eventType: "note",
        channel: "agente",
        metadata: { texto, agente: acao.agent.slug },
      });
    } else if (acao.acao === "registrar_perfil") {
      const campos = Object.fromEntries(
        Object.entries((payload.campos ?? {}) as Record<string, unknown>)
          .filter(([k, v]) => ehCampoDePerfil(k) && typeof v === "string" && v.trim())
          .map(([k, v]) => [k, String(v).trim().slice(0, 500)]),
      );
      if (!Object.keys(campos).length) throw new Error("payload sem campos de perfil");
      const atuais =
        contato.customFields && typeof contato.customFields === "object"
          ? (contato.customFields as Record<string, unknown>)
          : {};
      await db.contact.update({
        where: { id: contato.id },
        data: { customFields: { ...atuais, ...campos } as never },
      });
      await registrarEvento({
        contactId: contato.id,
        eventType: "acao_agente",
        channel: "agente",
        metadata: {
          texto: `Perfil registrado: ${Object.entries(campos).map(([k, v]) => `${k} = ${v}`).join(" · ")}`,
          agente: acao.agent.slug,
        },
      });
    } else {
      throw new Error(`acao desconhecida: ${acao.acao}`);
    }

    await db.agentAction.update({
      where: { id: actionId },
      data: { status: "executada", aprovadoPor: ator, resolvedAt: new Date() },
    });
    await auditar(ator, "acao_agente_executada", `${acao.agent.slug}/${acao.acao} -> ${contato.id}`);
    return { ok: true };
  } catch (e) {
    const erro = e instanceof Error ? e.message : String(e);
    if (e instanceof GuardaRecusou) {
      await db.agentAction.update({ where: { id: actionId }, data: { status: "proposta" } });
      await auditar(ator, "acao_agente_adiada_guarda", `${acao.agent.slug}/${acao.acao}: ${erro}`);
      return { ok: false, erro };
    }
    await db.agentAction.update({
      where: { id: actionId },
      data: { status: "erro", aprovadoPor: ator, resolvedAt: new Date() },
    });
    await auditar(ator, "acao_agente_erro", `${acao.agent.slug}/${acao.acao}: ${erro}`);
    return { ok: false, erro };
  }
}

export type NovaProposta = {
  agentId: string;
  contactId: string;
  acao: string;
  payload: Record<string, unknown>;
};

/**
 * Cria a acao. Modo `sugere` -> fica como proposta esperando humano.
 * Modo `autonomo` -> executa na hora. Nos dois casos, AuditEvent SEMPRE.
 */
export async function propor(nova: NovaProposta) {
  const agente = await db.agent.findUnique({ where: { id: nova.agentId } });
  if (!agente) throw new Error("agente nao encontrado");
  if (!agente.ativo) throw new Error("agente desativado");
  if (!ehAcao(nova.acao)) throw new Error(`acao invalida: ${nova.acao}`);

  const acao = await db.agentAction.create({
    data: {
      agentId: nova.agentId,
      contactId: nova.contactId,
      acao: nova.acao,
      payload: nova.payload as never,
      status: "proposta",
    },
  });

  await auditar(
    `agente:${agente.slug}`,
    "acao_agente_proposta",
    `${nova.acao} -> ${nova.contactId}`,
  );

  if (agente.modo === "autonomo") {
    const r = await executarAcao(acao.id, `agente:${agente.slug}`);
    return { acao, executada: r.ok, erro: r.erro };
  }

  return { acao, executada: false };
}

export async function recusar(actionId: string, ator: string) {
  const acao = await db.agentAction.findUnique({ where: { id: actionId }, include: { agent: true } });
  if (!acao || acao.status !== "proposta") return;
  await db.agentAction.update({
    where: { id: actionId },
    data: { status: "recusada", aprovadoPor: ator, resolvedAt: new Date() },
  });
  await auditar(ator, "acao_agente_recusada", `${acao.agent.slug}/${acao.acao}`);
}

/**
 * Recuo em 1 clique (LEI 5). Nao desfaz o que ja saiu pro mundo — mensagem
 * enviada nao volta — mas reverte o efeito no CRM e registra o desfazimento.
 */
export async function desfazer(actionId: string, ator: string): Promise<ResultadoAcao> {
  const acao = await db.agentAction.findUnique({
    where: { id: actionId },
    include: { agent: true, contact: true },
  });
  if (!acao || acao.status !== "executada") return { ok: false, erro: "nada a desfazer" };
  if (!acao.contact) return { ok: false, erro: "acao sem contato" };

  const payload = (acao.payload ?? {}) as Record<string, unknown>;

  if (acao.acao === "mover_estagio") {
    const anterior = await db.timelineEvent.findFirst({
      where: { contactId: acao.contactId ?? "", eventType: "stage_change" },
      orderBy: { timestamp: "desc" },
    });
    const meta = (anterior?.metadata ?? {}) as Record<string, unknown>;
    const de = String(meta.de ?? "");
    if (de && ehEstagio(de)) await mudarEstagio(acao.contact.id, de, `desfazer:${ator}`);
  } else if (acao.acao === "adicionar_tag") {
    const tag = String(payload.tag ?? "");
    const atuais = Array.isArray(acao.contact.tags) ? (acao.contact.tags as string[]) : [];
    await db.contact.update({
      where: { id: acao.contact.id },
      data: { tags: atuais.filter((t) => t !== tag) as never },
    });
  }

  await db.agentAction.update({ where: { id: actionId }, data: { status: "recusada" } });
  await registrarEvento({
    contactId: acao.contact.id,
    eventType: "acao_agente",
    channel: "sistema",
    metadata: {
      texto: `Ação do agente ${acao.agent.slug} desfeita (${acao.acao})`,
      ator,
    },
  });
  await auditar(ator, "acao_agente_desfeita", `${acao.agent.slug}/${acao.acao}`);

  const irreversivel = acao.acao === "enviar_mensagem";
  return {
    ok: true,
    erro: irreversivel ? "a mensagem ja tinha saido — o registro foi marcado, mas ela nao volta" : undefined,
  };
}

/** Autentica pelo header x-agent-token. */
export async function agentePorToken(token: string | null) {
  if (!token) return null;
  return db.agent.findUnique({ where: { apiToken: token } });
}
