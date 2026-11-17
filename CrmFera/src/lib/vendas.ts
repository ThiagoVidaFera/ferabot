import { db } from "@/lib/db";
import { registrarEvento, mudarEstagio } from "@/lib/timeline";
import { normalizarTelefone, variantesTelefone } from "@/lib/telefone";
import { avisarVenda } from "@/lib/notificacao";
import { adicionarTag, tagComprou, produtoSlugDe } from "@/lib/tags";

export type EntradaVenda = {
  nome?: string;
  email?: string;
  whatsapp?: string;
  produto: string;
  valorCentavos: number;
  origem?: string;
  externalId?: string;
  /** venda marcada na tela: o contato já é conhecido, não precisa achar por telefone */
  contactId?: string;
  /** quem registrou — vai pra linha do tempo da troca de estágio */
  ator?: string;
};

export type ResultadoVenda = {
  ok: true;
  contactId: string;
  purchaseId: string;
  duplicada: boolean;
};

/**
 * Caminho unico de entrada de venda — usado pelo webhook do checkout e por
 * qualquer integracao futura. Faz upsert do contato (por telefone OU e-mail),
 * grava Purchase com dedup por externalId, registra o evento e move o contato
 * para `cliente`.
 */
export async function registrarVenda(entrada: EntradaVenda): Promise<ResultadoVenda> {
  const phone = normalizarTelefone(entrada.whatsapp);
  const email = (entrada.email ?? "").trim().toLowerCase() || null;
  const nome = (entrada.nome ?? "").trim();

  if (!phone && !email && !entrada.contactId) {
    throw new Error("venda precisa de whatsapp OU email para identificar o contato");
  }
  if (!entrada.produto?.trim()) throw new Error("produto obrigatorio");
  if (!Number.isInteger(entrada.valorCentavos) || entrada.valorCentavos < 0) {
    throw new Error("valorCentavos deve ser inteiro em CENTAVOS");
  }

  // Dedup: mesma venda reenviada pelo checkout nao vira receita dobrada.
  if (entrada.externalId) {
    const ja = await db.purchase.findUnique({ where: { externalId: entrada.externalId } });
    if (ja) {
      return { ok: true, contactId: ja.contactId, purchaseId: ja.id, duplicada: true };
    }
  }

  // Upsert do contato pela chave canonica.
  let contato =
    (entrada.contactId ? await db.contact.findUnique({ where: { id: entrada.contactId } }) : null) ??
    (phone ? await db.contact.findFirst({ where: { phone: { in: variantesTelefone(phone) } } }) : null) ??
    (email ? await db.contact.findFirst({ where: { email } }) : null);

  if (!contato) {
    contato = await db.contact.create({
      data: {
        name: nome || phone || email || "Sem nome",
        phone,
        email,
        origem: entrada.origem ?? "outro",
        lifecycleStage: "novo",
      },
    });
  } else {
    // Completa buracos sem sobrescrever o que ja existe.
    const remendo: Record<string, string> = {};
    if (!contato.phone && phone) remendo.phone = phone;
    if (!contato.email && email) remendo.email = email;
    if (contato.name === "Sem nome" && nome) remendo.name = nome;
    if (Object.keys(remendo).length) {
      contato = await db.contact.update({ where: { id: contato.id }, data: remendo });
    }
  }

  const compra = await db.purchase.create({
    data: {
      contactId: contato.id,
      product: entrada.produto.trim(),
      valueCents: entrada.valorCentavos,
      origem: entrada.origem ?? null,
      externalId: entrada.externalId ?? null,
    },
  });

  await db.contact.update({
    where: { id: contato.id },
    data: {
      totalRevenue: { increment: entrada.valorCentavos },
      purchaseCount: { increment: 1 },
      lastPurchaseAt: new Date(),
    },
  });

  await registrarEvento({
    contactId: contato.id,
    eventType: "purchase",
    channel: "sistema",
    metadata: {
      product: compra.product,
      valueCents: compra.valueCents,
      origem: compra.origem,
      externalId: compra.externalId,
    },
  });

  await mudarEstagio(contato.id, "cliente", entrada.ator ?? "webhook:venda");

  // Quem compra muda de lugar NA HORA (playbook, principio 04): a tag
  // `comprou-<produto>` e o que desliga os agentes de venda daquele produto
  // no seletor — ninguem recebe oferta do que ja comprou. Tag permanente: fica
  // pra sempre na historia do contato.
  const slugProduto = produtoSlugDe(compra.product);
  await adicionarTag(contato.id, tagComprou(slugProduto), "webhook:venda");

  // Ingresso comprado = inscricao no evento (tag do ciclo -> Agente 01 + regua).
  try {
    const { carimbarPortaDeCompra } = await import("@/lib/portas");
    await carimbarPortaDeCompra(contato.id, slugProduto);
  } catch {
    /* porta nunca derruba o registro da venda */
  }

  try {
    await avisarVenda(contato.id, compra.product, compra.valueCents, compra.externalId ?? undefined);
  } catch {
    /* aviso nunca derruba o registro da venda */
  }

  // Devolve a venda pra Meta amarrada ao clique do anuncio (WhatsApp ou pagina).
  // Sem isso a Meta otimiza mirando "quem conversa/preenche" em vez de "quem compra".
  try {
    const { devolverConversaoSemEsperar } = await import("@/lib/capi-web");
    devolverConversaoSemEsperar(contato.id, "Purchase", {
      valorCentavos: compra.valueCents,
      chaveDedup: compra.externalId ?? compra.id,
    });
  } catch {
    /* atribuicao nunca derruba o registro da venda */
  }

  return { ok: true, contactId: contato.id, purchaseId: compra.id, duplicada: false };
}
