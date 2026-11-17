import { db } from "@/lib/db";
import { podeTocarContato } from "@/lib/pode-tocar";
import { registrarEvento } from "@/lib/timeline";
import { auditar } from "@/lib/audit";
import { aplicarVariaveis, config, variantes, escolherVariante } from "@/lib/config";
import { enviarEmail } from "@/lib/email";
import {
  conexaoPadrao,
  enviarMidia,
  enviarTexto,
  intervaloAntiBloqueio,
  type Conexao,
  type Midia,
} from "@/lib/whatsapp";

/**
 * Motor de disparo. Processa UM broadcast por vez, um alvo por vez.
 * Nunca dispara em paralelo: numero novo com disparo rapido = banimento
 * (regra explicita do megaprompt).
 */

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

const MIMES: Record<string, { tipo: Midia["tipo"]; mimetype: string }> = {
  mp4: { tipo: "video", mimetype: "video/mp4" },
  png: { tipo: "image", mimetype: "image/png" },
  jpg: { tipo: "image", mimetype: "image/jpeg" },
  jpeg: { tipo: "image", mimetype: "image/jpeg" },
};

/** Baixa a mídia do broadcast uma vez só e reaproveita nos alvos seguintes. */
const cacheMidia = new Map<string, Omit<Midia, "legenda">>();

async function carregarMidia(url: string): Promise<Omit<Midia, "legenda">> {
  const guardada = cacheMidia.get(url);
  if (guardada) return guardada;
  const ext = new URL(url).pathname.split(".").pop()?.toLowerCase() ?? "";
  const tipo = MIMES[ext];
  if (!tipo) throw new Error(`mediaUrl com extensao nao suportada: .${ext}`);
  const r = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!r.ok) throw new Error(`mediaUrl respondeu HTTP ${r.status}`);
  const midia = {
    ...tipo,
    filename: new URL(url).pathname.split("/").pop() ?? "arquivo",
    base64: Buffer.from(await r.arrayBuffer()).toString("base64"),
  };
  cacheMidia.set(url, midia);
  return midia;
}

/** Monta os alvos a partir da lista, sem duplicar quem ja esta na fila. */
/**
 * Lista DINAMICA por tag: `ContactList.source = "tag:<tag>"` e re-sincronizada
 * na hora do disparo — quem ganhou a tag depois que a lista foi criada entra;
 * quem tem `controle-*`/optout fica de fora. E o que permite agendar a regua
 * do lancamento hoje e o publico crescer ate o dia do envio.
 */
export async function sincronizarListaPorTag(listId: string): Promise<number> {
  const lista = await db.contactList.findUnique({ where: { id: listId } });
  const tag = lista?.source?.startsWith("tag:") ? lista.source.slice(4).trim() : "";
  if (!tag) return 0;
  const { tagsDe, temControle } = await import("@/lib/tags");
  // Playbook: "quem comprou continuando na regua de venda" e erro que custa
  // dinheiro. Lista de abandono exclui quem ja comprou AQUELE produto —
  // a tag de abandono nunca some, entao o corte e aqui, na hora do disparo.
  const slugAbandono = tag.startsWith("checkout-abandonado-")
    ? tag.slice("checkout-abandonado-".length)
    : "";
  const contatos = await db.contact.findMany({ select: { id: true, tags: true } });
  let novos = 0;
  for (const c of contatos) {
    const tags = tagsDe(c.tags);
    if (!tags.includes(tag) || temControle(tags)) continue;
    if (slugAbandono && tags.includes(`comprou-${slugAbandono}`)) continue;
    try {
      await db.contactListMember.create({ data: { listId, contactId: c.id } });
      novos++;
    } catch {
      /* @@unique([listId, contactId]) — ja esta na lista */
    }
  }

  // O caminho inverso: quem entrou na lista e DEPOIS comprou (ou pediu pra
  // parar) sai antes do disparo. Sem isso a exclusao acima so vale pra quem
  // nunca foi sincronizado.
  const membros = await db.contactListMember.findMany({
    where: { listId }, include: { contact: { select: { tags: true } } },
  });
  for (const m of membros) {
    const tags = tagsDe(m.contact.tags);
    const desqualificado =
      !tags.includes(tag) ||
      temControle(tags) ||
      (slugAbandono && tags.includes(`comprou-${slugAbandono}`));
    if (desqualificado) {
      await db.contactListMember.delete({ where: { id: m.id } });
    }
  }
  return novos;
}

export async function montarAlvos(broadcastId: string): Promise<number> {
  const b = await db.broadcast.findUnique({ where: { id: broadcastId } });
  if (!b?.listId) return 0;

  const membros = await db.contactListMember.findMany({
    where: { listId: b.listId },
    include: { contact: true },
  });

  let criados = 0;
  for (const m of membros) {
    // contato pessoal / retirado das automações nunca entra em disparo
    if (["pessoal", "sem_automacao"].includes(m.contact.lifecycleStage)) continue;
    // canal define o campo obrigatorio do contato
    if (b.canal === "email" && !m.contact.email) continue;
    if (b.canal === "whatsapp_1x1" && !m.contact.phone) continue;
    try {
      await db.broadcastTarget.create({
        data: { broadcastId, contactId: m.contactId },
      });
      criados++;
    } catch {
      // @@unique([broadcastId, contactId]) — ja estava na fila
    }
  }
  return criados;
}

async function entregar(
  canal: string,
  contato: { id: string; name: string; email: string | null; phone: string | null },
  conteudo: string,
  titulo: string,
  conexao: Conexao | null,
  indice = 0,
  mediaUrl: string | null = null,
): Promise<{ ok: boolean; erro?: string; externalId?: string }> {
  const escolhida = escolherVariante(variantes(conteudo), indice, contato);
  const texto = aplicarVariaveis(escolhida, contato);

  if (canal === "email") {
    if (!contato.email) return { ok: false, erro: "contato sem e-mail" };
    const r = await enviarEmail(contato.email, aplicarVariaveis(titulo, contato), texto);
    if (r.ok) {
      await db.emailSend.create({
        data: { contactId: contato.id, subject: titulo, status: "enviado" },
      });
    }
    return r;
  }

  if (canal === "whatsapp_1x1") {
    if (!contato.phone) return { ok: false, erro: "contato sem telefone" };
    if (!conexao) return { ok: false, erro: "WhatsApp nao conectado" };
    let midia: Omit<Midia, "legenda"> | null = null;
    if (mediaUrl) {
      // Mídia que não carrega NÃO cai pra texto puro: o texto promete "esse
      // vídeo/print" e sem o anexo vira mensagem quebrada (toque 2 do Bastidores).
      try {
        midia = await carregarMidia(mediaUrl);
      } catch (e) {
        return { ok: false, erro: `midia: ${e instanceof Error ? e.message : String(e)}` };
      }
    }
    const r = midia
      ? await enviarMidia(conexao, contato.phone, { ...midia, legenda: texto })
      : await enviarTexto(conexao, contato.phone, texto);
    if (r.ok) {
      await db.whatsappMessage.create({
        data: {
          contactId: contato.id,
          instanceId: conexao.instanceId ?? null,
          fromNumber: "sistema",
          toNumber: contato.phone,
          body: texto,
          type: midia ? midia.tipo : "text",
          direction: "outbound",
          status: "sent",
          externalId: r.externalId ?? null,
          metadata: { origem: "disparo", titulo } as never,
        },
      });
    }
    return r;
  }

  return { ok: false, erro: `canal ${canal} nao entrega 1x1` };
}

/** Dispara um broadcast inteiro. Retorna os contadores finais. */
export async function processarBroadcast(broadcastId: string) {
  const b = await db.broadcast.findUnique({ where: { id: broadcastId } });
  if (!b) throw new Error("broadcast nao encontrado");
  if (b.status === "enviando" || b.status === "concluido") return b;

  await db.broadcast.update({ where: { id: broadcastId }, data: { status: "enviando" } });
  const conexao = await conexaoPadrao();

  // Faixa de espera entre mensagens. Lida aqui em cima porque tanto o ramo de
  // grupo quanto o de 1x1 dependem dela.
  const espera = Number(await config("disparo_intervalo_ms", "DISPARO_INTERVALO_MS", "0"));
  const minMs = Number(await config("disparo_intervalo_min_ms", undefined, "5000"));
  const maxMs = Number(await config("disparo_intervalo_max_ms", undefined, "12000"));

  // Canal de GRUPO nao usa fila de contatos: manda uma mensagem por grupo.
  if (b.canal === "whatsapp_grupo") {
    const ids = Array.isArray(b.groupIds) ? (b.groupIds as string[]) : [];
    let enviados = 0;
    let falhas = 0;
    for (const gid of ids) {
      if (!conexao) {
        falhas++;
        continue;
      }
      const r = await enviarTexto(conexao, gid, b.conteudo);
      r.ok ? enviados++ : falhas++;
      await dormir(intervaloAntiBloqueio(minMs, maxMs));
    }
    const fim = await db.broadcast.update({
      where: { id: broadcastId },
      data: { status: "concluido", enviados, falhas },
    });
    await auditar("sistema", "broadcast_grupo_concluido", `${b.titulo}: ${enviados}/${ids.length}`);
    return fim;
  }

  if (b.listId) await sincronizarListaPorTag(b.listId);
  await montarAlvos(broadcastId);

  // Retomada de broadcast orfao: os contadores partem do que ja saiu, senao o
  // fechamento sobrescreve o total com so o que esta execucao enviou.
  let enviados = await db.broadcastTarget.count({
    where: { broadcastId, status: "enviado" },
  });
  let falhas = await db.broadcastTarget.count({
    where: { broadcastId, status: "falha" },
  });

  // Um alvo por vez, sempre.
  for (;;) {
    const alvo = await db.broadcastTarget.findFirst({
      where: { broadcastId, status: "pendente" },
      include: { contact: true },
      orderBy: { id: "asc" },
    });
    if (!alvo) break;

    // Guarda central (13/11/2026) no disparo 1x1 de WhatsApp: cliente, perdido, compra, opt-out, adiamento,
    // "vamos fechar", última fala do lead e número único (o disparo sai do número padrão: lead do
    // origem com número único configurado é pulada, nunca recebe por outro número). Fica `pulado` com o motivo.
    if (b.canal === "whatsapp_1x1") {
      const toque = await podeTocarContato({ contactId: alvo.contactId, regua: `broadcast:${broadcastId}`, conexao, semTrocarNumero: true });
      if (!toque.liberado) {
        await db.broadcastTarget.update({
          where: { id: alvo.id },
          data: { status: "pulado", error: `guarda: ${toque.motivo} (${toque.detalhe})`.slice(0, 300) },
        });
        continue;
      }
    }

    // Teto duro por alvo: um envio pendurado (26/08: alvo travou 15+ min com o
    // lock preso e calou a fila inteira) vira falha e a fila anda. A promise
    // pendurada fica orfa — vazamento pontual e aceitavel; fila parada nao e.
    const r = await Promise.race([
      entregar(b.canal, alvo.contact, b.conteudo, b.titulo, conexao, enviados + falhas, b.mediaUrl),
      new Promise<{ ok: false; erro: string }>((res) =>
        setTimeout(
          () => res({ ok: false, erro: "timeout de processamento" }),
          b.mediaUrl ? 180_000 : 90_000, // vídeo em base64 leva mais que texto
        ),
      ),
    ]);

    await db.broadcastTarget.update({
      where: { id: alvo.id },
      data: {
        status: r.ok ? "enviado" : "falha",
        sentAt: r.ok ? new Date() : null,
        error: r.erro ?? null,
      },
    });

    if (r.ok) {
      enviados++;
      await registrarEvento({
        contactId: alvo.contactId,
        eventType: b.canal === "email" ? "email_sent" : "broadcast",
        channel: b.canal === "email" ? "email" : "whatsapp",
        metadata: {
          broadcastId,
          titulo: b.titulo,
          texto: aplicarVariaveis(
            escolherVariante(variantes(b.conteudo), enviados + falhas, alvo.contact),
            alvo.contact,
          ),
        },
      });
    } else {
      falhas++;
    }

    await db.broadcast.update({ where: { id: broadcastId }, data: { enviados, falhas } });

    // Anti-bloqueio so no 1x1 de WhatsApp; e-mail nao precisa e a config permite
    // encurtar o intervalo em teste.
    if (b.canal === "whatsapp_1x1") {
      await dormir(espera > 0 ? espera : intervaloAntiBloqueio(minMs, maxMs));
    } else if (espera > 0) {
      await dormir(espera);
    }
  }

  const fim = await db.broadcast.update({
    where: { id: broadcastId },
    data: { status: "concluido", enviados, falhas },
  });
  await auditar("sistema", "broadcast_concluido", `${b.titulo}: ${enviados} enviados, ${falhas} falhas`);
  return fim;
}

let rodando = false;

/**
 * Varre os agendados vencidos e dispara. Chamado pelo setInterval de 30s
 * (src/instrumentation.ts) e tambem por /api/cron/disparos.
 */
export async function processarAgendados(): Promise<number> {
  if (rodando) {
    console.log("[fila] tick pulado: execucao anterior ainda em curso");
    return 0;
  }
  rodando = true;
  try {
    // Broadcast preso em "enviando" e orfao (processo anterior morreu no meio
    // — abort do client HTTP, restart do container) volta pra fila. Seguro:
    // instancia unica + lock `rodando`; alvo ja "enviado" nunca repete.
    const presos = await db.broadcast.updateMany({
      where: { status: "enviando" },
      data: { status: "agendado" },
    });
    const vencidos = await db.broadcast.findMany({
      where: { status: "agendado", agendadoPara: { lte: new Date() } },
      orderBy: { agendadoPara: "asc" },
      take: 5,
    });
    console.log(`[fila] tick: retomados=${presos.count} vencidos=${vencidos.length}`);
    for (const b of vencidos) {
      try {
        console.log(`[fila] processando: ${b.titulo}`);
        await processarBroadcast(b.id);
        console.log(`[fila] terminou: ${b.titulo}`);
      } catch (e) {
        await db.broadcast.update({ where: { id: b.id }, data: { status: "erro" } });
        await auditar("sistema", "broadcast_erro", `${b.titulo}: ${String(e)}`);
      }
    }
    return vencidos.length;
  } finally {
    rodando = false;
  }
}
