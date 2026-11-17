import { db } from "@/lib/db";
import { config } from "@/lib/config";
import { conexaoPadrao, enviarTexto } from "@/lib/whatsapp";
import { registrarEvento } from "@/lib/timeline";
import { auditar } from "@/lib/audit";
import { adicionarTag } from "@/lib/tags";
import { apresentacaoDoTrabalho } from "@/lib/primeira-mensagem";
import { negocio } from "@/lib/negocio";
import { podeTocarContato } from "@/lib/pode-tocar";

/**
 * Funil do GRUPO: lead que preenche a página do grupo (funil `grupo` ou `grupo_*`) não gera aviso
 * para o dono. Alguns minutos depois, a mensagem do número PRINCIPAL dá as boas-vindas e convida
 * para a reunião (link de agendamento do negocio.json).
 *
 * O atraso é para a mensagem chegar DEPOIS de ele entrar no grupo (a página de obrigado manda
 * direto para o link do grupo). Fica em memória: se o container reiniciar nessa janela, aquele
 * convite se perde. Aceito, é um toque só.
 */

export const FUNIL_GRUPO = "grupo";

/** Para onde o convite leva: a página de agendamento do negocio.json. */
export function linkConvite(): string {
  const base = negocio().links.agendamento;
  if (!base) return "";
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}utm_source=whatsapp&utm_medium=convite&utm_campaign=grupo`;
}

/** Mantido por compatibilidade com quem importa a constante. */
export const LINK_CONVITE = linkConvite();
const TITULOS = new Set(["professor", "professora", "prof", "dr", "dra", "doutor", "doutora", "coach", "mentor", "mentora"]);

export function ehFunilGrupo(funil?: string | null): boolean {
  const f = String(funil ?? "").toLowerCase().replace(/-/g, "_").replace(/^funil:/, "");
  return f === FUNIL_GRUPO || f.startsWith(`${FUNIL_GRUPO}_`);
}

/** Nome do Facebook não é nome de pessoa: sem nome utilizável, sai sem vocativo. */
function vocativo(nome: string): string {
  const limpo = nome.normalize("NFKC").split(/[|/·–—]/)[0].trim();
  for (const token of limpo.split(/\s+/)) {
    const t = token.replace(/[^\p{L}]/gu, "");
    if (TITULOS.has(t.toLowerCase().replace(/\.$/, ""))) continue;
    if (t.length < 3 || /\d/.test(token)) return "";
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  }
  return "";
}

export function mensagem(nome: string): string {
  const v = vocativo(nome);
  const link = linkConvite();
  return [
    `Oi${v ? `, ${v}` : ""}! 👋`,
    "Vi que você se cadastrou na página do grupo e já entrou. Seja muito bem-vindo(a)!",
    apresentacaoDoTrabalho("padrao", "terceira"),
    ...(link ? ["Se quiser conversar sobre o seu caso, é só escolher um horário aqui:", `🔗 ${link}`] : []),
    "Me conta: o que fez você entrar no grupo?",
  ].join("\n\n");
}

async function enviarConvite(contactId: string, nome: string): Promise<void> {
  const contato = await db.contact.findUnique({ where: { id: contactId } });
  if (!contato?.phone) return;

  const conexao = await conexaoPadrao();
  if (!conexao) {
    await db.notificacao.deleteMany({ where: { tipo: "convite_grupo", chave: contactId } });
    await auditar("sistema", "convite_grupo_falhou", `${contactId}: sem WhatsApp principal`);
    return;
  }

  // Guarda central: cliente, opt-out, lead que já escreveu, número único.
  const toque = await podeTocarContato({ contactId, regua: "convite-grupo", conexao, semTrocarNumero: true });
  if (!toque.liberado) return;

  // Quem responde o convite fala com o agente de qualificação, não com o do grupo.
  await adicionarTag(contactId, "interesse-principal", "porta:convite-grupo").catch(() => {});

  const texto = mensagem(nome || contato.name || "");
  const r = await enviarTexto(conexao, contato.phone, texto);
  if (!r.ok) {
    // libera pra tentar de novo se ele preencher outra vez
    await db.notificacao.deleteMany({ where: { tipo: "convite_grupo", chave: contactId } });
    await auditar("sistema", "convite_grupo_falhou", `${contactId}: ${r.erro ?? "?"}`);
    return;
  }

  await db.whatsappMessage.create({
    data: {
      contactId,
      instanceId: conexao.instanceId ?? null,
      fromNumber: "crm",
      toNumber: contato.phone,
      body: texto,
      direction: "outbound",
      status: "sent",
      externalId: r.externalId ?? null,
      metadata: { origem: "convite_grupo", ator: "sistema" } as never,
    },
  });
  await registrarEvento({
    contactId,
    eventType: "whatsapp_message",
    channel: "whatsapp",
    metadata: { direcao: "enviada", texto, origem: "convite_grupo" },
  });
  await auditar("sistema", "convite_grupo_enviado", contactId);
}

/**
 * Agenda o convite. Um por pessoa (`Notificacao` @@unique[tipo, chave]) —
 * quem reenvia o formulário não recebe de novo.
 */
export async function agendarConviteGrupo(contactId: string, nome: string): Promise<boolean> {
  if ((await config("convite_grupo_ativo", "CONVITE_GRUPO_ATIVO", "1")) === "0") return false;
  try {
    await db.notificacao.create({
      data: { tipo: "convite_grupo", chave: contactId, detalhe: linkConvite() || "sem-link" },
    });
  } catch {
    return false; // já convidado
  }
  const atrasoS = Number(await config("convite_grupo_atraso_s", "CONVITE_GRUPO_ATRASO_S", "180")) || 180;
  setTimeout(() => {
    enviarConvite(contactId, nome).catch((e) =>
      auditar("sistema", "convite_grupo_falhou", `${contactId}: ${e instanceof Error ? e.message : String(e)}`),
    );
  }, atrasoS * 1000);
  return true;
}
