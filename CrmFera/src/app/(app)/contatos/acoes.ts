"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { sessaoAtual } from "@/lib/auth";
import { auditar } from "@/lib/audit";
import { registrarEvento, mudarEstagio } from "@/lib/timeline";
import { normalizarTelefone, variantesTelefone } from "@/lib/telefone";
import { ehEstagio } from "@/lib/estagios";

async function exigirSessao() {
  const s = await sessaoAtual();
  if (!s) throw new Error("nao autenticado");
  return s;
}

function lerTags(v: FormDataEntryValue | null): string[] {
  return String(v ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Encontra contato existente pela chave canonica (telefone, senao e-mail). */
export async function acharContato(phone: string | null, email: string | null) {
  if (phone) {
    const porTel = await db.contact.findFirst({ where: { phone: { in: variantesTelefone(phone) } } });
    if (porTel) return porTel;
  }
  if (email) {
    const porEmail = await db.contact.findFirst({ where: { email } });
    if (porEmail) return porEmail;
  }
  return null;
}

export async function criarContato(form: FormData) {
  const s = await exigirSessao();

  const name = String(form.get("name") ?? "").trim();
  if (!name) throw new Error("nome obrigatorio");

  const phone = normalizarTelefone(String(form.get("phone") ?? ""));
  const emailBruto = String(form.get("email") ?? "").trim().toLowerCase();
  const email = emailBruto || null;

  const existente = await acharContato(phone, email);
  if (existente) {
    // LEI 1 — uma fonte unica por dado: nao duplicar pessoa.
    await auditar(s.email, "contato_duplicado_evitado", existente.id);
    revalidatePath("/contatos");
    return existente.id;
  }

  const estagioBruto = String(form.get("lifecycleStage") ?? "novo");
  const contato = await db.contact.create({
    data: {
      name,
      phone,
      email,
      company: String(form.get("company") ?? "").trim() || null,
      lifecycleStage: ehEstagio(estagioBruto) ? estagioBruto : "novo",
      origem: String(form.get("origem") ?? "outro").trim() || "outro",
      tags: lerTags(form.get("tags")) as never,
    },
  });

  await registrarEvento({
    contactId: contato.id,
    eventType: "note",
    channel: "sistema",
    metadata: { texto: "Contato criado", ator: s.email },
  });
  await auditar(s.email, "contato_criado", contato.id);

  revalidatePath("/contatos");
  return contato.id;
}

export async function atualizarContato(form: FormData) {
  const s = await exigirSessao();
  const id = String(form.get("id") ?? "");
  if (!id) throw new Error("id obrigatorio");

  await db.contact.update({
    where: { id },
    data: {
      name: String(form.get("name") ?? "").trim(),
      phone: normalizarTelefone(String(form.get("phone") ?? "")),
      email: String(form.get("email") ?? "").trim().toLowerCase() || null,
      company: String(form.get("company") ?? "").trim() || null,
      origem: String(form.get("origem") ?? "outro").trim() || "outro",
      tags: lerTags(form.get("tags")) as never,
    },
  });

  await auditar(s.email, "contato_editado", id);
  revalidatePath(`/contatos/${id}`);
}

export async function acaoMudarEstagio(form: FormData) {
  const s = await exigirSessao();
  const id = String(form.get("id") ?? "");
  const estagio = String(form.get("lifecycleStage") ?? "");
  if (!ehEstagio(estagio)) throw new Error("estagio invalido: " + estagio);

  await mudarEstagio(id, estagio, s.email);
  await auditar(s.email, "estagio_mudado", `${id} -> ${estagio}`);
  revalidatePath(`/contatos/${id}`);
  revalidatePath("/contatos");
}

export async function adicionarNota(form: FormData) {
  const s = await exigirSessao();
  const id = String(form.get("id") ?? "");
  const texto = String(form.get("texto") ?? "").trim();
  if (!texto) return;

  await registrarEvento({
    contactId: id,
    eventType: "note",
    channel: "sistema",
    metadata: { texto, ator: s.email },
  });
  revalidatePath(`/contatos/${id}`);
}

export async function registrarCall(form: FormData) {
  const s = await exigirSessao();
  const id = String(form.get("id") ?? "");
  const texto = String(form.get("texto") ?? "").trim();

  await registrarEvento({
    contactId: id,
    eventType: "call",
    channel: "sistema",
    metadata: { texto: texto || "Call registrada", ator: s.email },
  });
  revalidatePath(`/contatos/${id}`);
}

/**
 * Resultado da reunião de 20 min (26/10/2026). Sem isto o funil só sabia o custo
 * por reunião MARCADA — quem faltou contava igual a quem sentou e comprou.
 * Não mexe no estágio: "proposta" já é a gaveta do desqualificado do agente de
 * recepção. Vira evento `call` com `resultado` (append-only) + tag pra filtrar.
 */
export async function registrarReuniao(form: FormData) {
  const s = await exigirSessao();
  const id = String(form.get("id") ?? "");
  const resultado = String(form.get("resultado") ?? "");
  if (!id || !["compareceu", "no_show"].includes(resultado)) return;

  const c = await db.contact.findUnique({ where: { id }, select: { tags: true } });
  if (!c) return;
  await registrarEvento({
    contactId: id,
    eventType: "call",
    channel: "sistema",
    metadata: {
      resultado,
      texto: resultado === "compareceu" ? "Reunião realizada" : "Não compareceu à reunião",
      ator: s.email,
    },
  });
  const tag = resultado === "compareceu" ? "reuniao-realizada" : "no-show";
  const atuais = Array.isArray(c.tags) ? (c.tags as string[]) : [];
  if (!atuais.includes(tag)) {
    await db.contact.update({ where: { id }, data: { tags: [...atuais, tag] } });
  }
  await auditar(s.email, `reuniao_${resultado}`, id);
  revalidatePath(`/contatos/${id}`);
  revalidatePath("/aquisicao");
  revalidatePath("/reunioes");
}

/**
 * Qualificação da reunião na tela /reunioes: temperatura (quente/frio, uma só)
 * e se recebeu proposta. Guardado em tags — mesmo padrão de "reuniao-realizada".
 */
export async function qualificarReuniao(form: FormData) {
  const s = await exigirSessao();
  const id = String(form.get("id") ?? "");
  const campo = String(form.get("campo") ?? "");
  const valor = String(form.get("valor") ?? "");
  const c = await db.contact.findUnique({ where: { id }, select: { tags: true } });
  if (!c) return;

  const atuais = Array.isArray(c.tags) ? (c.tags as string[]) : [];
  let tags = atuais;
  if (campo === "temperatura" && ["quente", "frio", "limpar"].includes(valor)) {
    tags = atuais.filter((t) => t !== "reuniao-quente" && t !== "reuniao-fria");
    if (valor === "quente") tags = [...tags, "reuniao-quente"];
    if (valor === "frio") tags = [...tags, "reuniao-fria"];
  } else if (campo === "proposta" && ["sim", "nao"].includes(valor)) {
    tags = atuais.filter((t) => t !== "proposta-recebida");
    if (valor === "sim") tags = [...tags, "proposta-recebida"];
  } else {
    return;
  }
  await db.contact.update({ where: { id }, data: { tags } });
  await auditar(s.email, `reuniao_${campo}_${valor}`, id);
  revalidatePath("/reunioes");
  revalidatePath(`/contatos/${id}`);
}

export async function adicionarTag(form: FormData) {
  const s = await exigirSessao();
  const id = String(form.get("id") ?? "");
  const tag = String(form.get("tag") ?? "").trim();
  if (!tag) return;

  const c = await db.contact.findUnique({ where: { id }, select: { tags: true } });
  const atuais = Array.isArray(c?.tags) ? (c.tags as string[]) : [];
  if (atuais.includes(tag)) return;

  await db.contact.update({ where: { id }, data: { tags: [...atuais, tag] as never } });
  await registrarEvento({
    contactId: id,
    eventType: "note",
    channel: "sistema",
    metadata: { texto: `Tag adicionada: ${tag}`, ator: s.email },
  });
  revalidatePath(`/contatos/${id}`);
}

export async function registrarVendaManual(form: FormData) {
  const s = await exigirSessao();
  const id = String(form.get("id") ?? "");
  const product = String(form.get("product") ?? "").trim();
  const reais = Number(String(form.get("valor") ?? "0").replace(",", "."));
  if (!product || !Number.isFinite(reais)) throw new Error("produto e valor obrigatorios");

  // LEI: dinheiro sempre em CENTAVOS (Int), nunca Float.
  const valueCents = Math.round(reais * 100);

  await db.purchase.create({
    data: { contactId: id, product, valueCents, origem: "manual" },
  });
  await db.contact.update({
    where: { id },
    data: {
      totalRevenue: { increment: valueCents },
      purchaseCount: { increment: 1 },
      lastPurchaseAt: new Date(),
    },
  });
  await registrarEvento({
    contactId: id,
    eventType: "purchase",
    channel: "sistema",
    metadata: { product, valueCents, origem: "manual", ator: s.email },
  });
  await mudarEstagio(id, "cliente", s.email);
  await auditar(s.email, "venda_manual", `${id} ${product} ${valueCents}`);

  revalidatePath(`/contatos/${id}`);
  revalidatePath("/vendas");
}

export type PreviaCSV = {
  colunas: string[];
  linhas: Record<string, string>[];
  total: number;
};

/** Faz o parse do CSV e devolve a previa — NAO grava. */
export async function previaCSV(texto: string): Promise<PreviaCSV> {
  await exigirSessao();
  const linhas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!linhas.length) return { colunas: [], linhas: [], total: 0 };

  const sep = linhas[0].includes(";") && !linhas[0].includes(",") ? ";" : ",";
  const colunas = linhas[0].split(sep).map((c) => c.trim().toLowerCase());
  const dados = linhas.slice(1).map((l) => {
    const partes = l.split(sep);
    const obj: Record<string, string> = {};
    colunas.forEach((c, i) => (obj[c] = (partes[i] ?? "").trim()));
    return obj;
  });

  return { colunas, linhas: dados.slice(0, 20), total: dados.length };
}

/** Grava de verdade. Colunas aceitas: name, phone, email, tags. */
export async function importarCSV(texto: string) {
  const s = await exigirSessao();
  const previa = await previaCSV(texto);
  if (!previa.colunas.length) return { criados: 0, existentes: 0 };

  const sep = texto.split(/\r?\n/)[0].includes(";") ? ";" : ",";
  const todas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(1)
    .map((l) => {
      const partes = l.split(sep);
      const obj: Record<string, string> = {};
      previa.colunas.forEach((c, i) => (obj[c] = (partes[i] ?? "").trim()));
      return obj;
    });

  let criados = 0;
  let existentes = 0;

  for (const linha of todas) {
    const name = (linha.name || linha.nome || "").trim();
    const phone = normalizarTelefone(linha.phone || linha.telefone || linha.whatsapp);
    const email = (linha.email || "").trim().toLowerCase() || null;
    if (!name && !phone && !email) continue;

    const ja = await acharContato(phone, email);
    if (ja) {
      existentes++;
      continue;
    }

    const tags = (linha.tags || "")
      .split(/[;|]/)
      .map((t) => t.trim())
      .filter(Boolean);

    const contato = await db.contact.create({
      data: {
        name: name || phone || email || "Sem nome",
        phone,
        email,
        origem: "base",
        tags: tags as never,
      },
    });
    await registrarEvento({
      contactId: contato.id,
      eventType: "form_submit",
      channel: "sistema",
      metadata: { texto: "Importado por CSV", ator: s.email },
    });
    criados++;
  }

  await auditar(s.email, "csv_importado", `criados=${criados} existentes=${existentes}`);
  revalidatePath("/contatos");
  return { criados, existentes };
}


/** Puxa os leads de um painel antigo (URL em `painel_antigo_url`) pra dentro do CRM. */
export async function importarPainelAntigo() {
  const s = await exigirSessao();
  const { importarDoPainelAntigo } = await import("@/lib/importar-leads");
  const r = await importarDoPainelAntigo(s.email);
  revalidatePath("/contatos");
  revalidatePath("/aquisicao");
  return r;
}

/**
 * Exclui o lead da base de vez: mensagens, linha do tempo, compras, listas,
 * negócios e o resto do histórico (30/10/2026). A auditoria guarda nome e telefone,
 * porque depois disso o contato não existe mais pra consultar.
 */
export async function excluirContato(contactId: string) {
  const s = await exigirSessao();
  const c = await db.contact.findUnique({ where: { id: contactId }, select: { name: true, phone: true } });
  if (!c) return;

  await db.$transaction([
    db.whatsappMessage.deleteMany({ where: { contactId } }),
    db.agentAction.deleteMany({ where: { contactId } }),
    db.timelineEvent.deleteMany({ where: { contactId } }),
    db.purchase.deleteMany({ where: { contactId } }),
    db.contactListMember.deleteMany({ where: { contactId } }),
    db.emailSend.deleteMany({ where: { contactId } }),
    db.broadcastTarget.deleteMany({ where: { contactId } }),
    db.deal.deleteMany({ where: { contactId } }),
    db.contactIdentity.deleteMany({ where: { contactId } }),
    db.conversationState.deleteMany({ where: { contactId } }),
    db.ficha.deleteMany({ where: { contactId } }),
    db.contact.delete({ where: { id: contactId } }),
  ]);
  await auditar(s.email, "contato_excluido", `${c.name} · ${c.phone ?? "sem telefone"} (${contactId})`);
  revalidatePath("/contatos");
  revalidatePath("/inbox");
  revalidatePath("/");
}
