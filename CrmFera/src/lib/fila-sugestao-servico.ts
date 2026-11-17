import { db } from "@/lib/db";
import { config, gravarConfig } from "@/lib/config";
import { gerar } from "@/lib/ia";
import { autorizadoCompleto } from "@/lib/prompt-vars";
import { auditar } from "@/lib/audit";
import { janelaWhatsapp } from "@/lib/fila-prioridade";
import { filaSemResposta, textoDaMensagem } from "@/lib/fila-sem-resposta";
import {
  gerarSugestao,
  type ContextoSugestao,
  type Gerador,
  type Fala,
} from "@/lib/fila-sugestao";
import {
  CHAVE_CACHE,
  lerCache,
  cacheValido,
  comEntrada,
  podar,
  type Cache,
} from "@/lib/fila-sugestao-cache";

/**
 * Cola entre a fila, o gerador de sugestao e o cache. NUNCA envia mensagem:
 * so le conversa, pede texto a IA e guarda o resultado.
 */

const HORA_MS = 3_600_000;
const HISTORICO_MENSAGENS = 20;
const TOPO_PADRAO = 10;

export type Dependencias = { gerarFn?: Gerador; agora?: Date };

export type ResultadoSugestao =
  | { ok: true; texto: string; doCache: boolean }
  | { ok: false; erro: string };

export async function sugestoesGuardadas(): Promise<Cache> {
  return lerCache(await config(CHAVE_CACHE));
}

async function guardar(cache: Cache, agora: Date): Promise<void> {
  await gravarConfig(CHAVE_CACHE, JSON.stringify(podar(cache, agora)));
}

type ContextoCompleto = { contexto: ContextoSugestao; ultimaEntrada: Date };

/** Monta o contexto direto das mensagens. `null` = ja foi respondido (ou nao ha o que responder). */
async function contextoDoContato(contactId: string, agora: Date): Promise<ContextoCompleto | null> {
  const contato = await db.contact.findUnique({ where: { id: contactId } });
  if (!contato) return null;

  const recentes = await db.whatsappMessage.findMany({
    where: { contactId },
    orderBy: { timestamp: "desc" },
    take: HISTORICO_MENSAGENS,
  });

  const semResposta: typeof recentes = [];
  for (const m of recentes) {
    if (m.direction !== "inbound") break;
    semResposta.push(m);
  }
  if (!semResposta.length) return null;

  const ultima = semResposta[0];
  const primeira = semResposta[semResposta.length - 1];
  const instancia = ultima.instanceId
    ? await db.whatsappInstance.findUnique({ where: { id: ultima.instanceId }, select: { provider: true } })
    : null;
  const janela = janelaWhatsapp(ultima.timestamp, agora);
  const historico: Fala[] = [...recentes].reverse().map((m) => ({
    de: m.direction === "inbound" ? "lead" : "nos",
    texto: textoDaMensagem(m),
  }));

  return {
    ultimaEntrada: ultima.timestamp,
    contexto: {
      nome: contato.name,
      estagio: contato.lifecycleStage,
      origem: contato.origem,
      horasParado: Math.max(0, (agora.getTime() - primeira.timestamp.getTime()) / HORA_MS),
      janela,
      exigeTemplate: instancia?.provider === "cloud_api" && janela.estado === "fechada",
      historico,
    },
  };
}

export async function sugerirParaContato(
  contactId: string,
  deps: Dependencias & { forcar?: boolean } = {},
): Promise<ResultadoSugestao> {
  const agora = deps.agora ?? new Date();
  const completo = await contextoDoContato(contactId, agora);
  if (!completo) return { ok: false, erro: "esse contato já foi respondido (ou não existe)" };

  const cache = await sugestoesGuardadas();
  if (!deps.forcar) {
    const guardado = cacheValido(cache, contactId, completo.ultimaEntrada);
    if (guardado) return { ok: true, texto: guardado, doCache: true };
  }

  const resultado = await gerarSugestao(completo.contexto, {
    gerarFn: deps.gerarFn ?? gerar,
    autorizado: await autorizadoCompleto(),
  });
  if (!resultado.ok) return { ok: false, erro: resultado.erros.join("; ") };

  await guardar(
    comEntrada(cache, contactId, {
      texto: resultado.texto,
      ultimaEntradaEm: completo.ultimaEntrada.toISOString(),
      geradoEm: agora.toISOString(),
    }),
    agora,
  );
  return { ok: true, texto: resultado.texto, doCache: false };
}

export type ResumoDoDia = {
  analisados: number;
  geradas: number;
  jaEmCache: number;
  ignoradas: number;
  falhas: number;
};

/**
 * Rotina diaria: gera sugestao para os N primeiros da fila. Sequencial de
 * proposito (tier gratis da IA; N pequeno). Quem so agradeceu nao gasta IA.
 */
export async function gerarSugestoesDoDia(
  deps: Dependencias & { topo?: number } = {},
): Promise<ResumoDoDia> {
  const agora = deps.agora ?? new Date();
  const fila = await filaSemResposta({ agora, limite: deps.topo ?? TOPO_PADRAO });
  const resumo = { analisados: fila.length, geradas: 0, jaEmCache: 0, ignoradas: 0, falhas: 0 };

  for (const item of fila) {
    if (item.encerramento) {
      resumo.ignoradas += 1;
      continue;
    }
    const r = await sugerirParaContato(item.contactId, deps);
    if (!r.ok) resumo.falhas += 1;
    else if (r.doCache) resumo.jaEmCache += 1;
    else resumo.geradas += 1;
  }

  await auditar(
    "cron:fila-sem-resposta",
    "sugestoes_do_dia",
    `${resumo.geradas} geradas · ${resumo.jaEmCache} em cache · ${resumo.falhas} falhas · ${resumo.ignoradas} ignoradas`,
  );
  return resumo;
}
