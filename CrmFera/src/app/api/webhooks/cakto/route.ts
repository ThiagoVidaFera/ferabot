import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { registrarVenda } from "@/lib/vendas";
import { registrarEvento, mudarEstagio } from "@/lib/timeline";
import { auditar } from "@/lib/audit";
import { normalizarTelefone } from "@/lib/telefone";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * ADAPTADOR OPCIONAL da plataforma de checkout Cakto. O caminho genérico de venda é
 * /api/webhooks/venda (qualquer plataforma ou automação, header x-webhook-token). Este
 * adaptador só liga com CAKTO_WEBHOOK_SECRET configurado.
 *
 * Webhook da Cakto. Traduz o payload dela para o contrato do megaprompt e
 * entrega em `registrarVenda` — o mesmo caminho da venda manual e do
 * /api/webhooks/venda. Uma fonte única por dado (LEI 1).
 *
 * Payload da Cakto:
 *   { secret, event, data: { id, refId, amount, baseAmount,
 *                            customer:{name,email,phone,docNumber},
 *                            product:{id,name}, offer:{...} } }
 * Eventos assinados: purchase_approved | refund | chargeback
 */

type Cliente = { name?: string; email?: string; phone?: string; docNumber?: string };
type Pedido = {
  id?: string;
  refId?: string;
  amount?: number | string;
  baseAmount?: number | string;
  customer?: Cliente;
  product?: { id?: string; name?: string };
  offer?: { id?: string; name?: string };
  paymentMethod?: string;
};
type CorpoCakto = { secret?: string; event?: string; type?: string; data?: Pedido };

/** A Cakto manda o valor em REAIS (297.0). O CRM guarda CENTAVOS, sempre Int. */
function emCentavos(v: number | string | undefined): number {
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : (v ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export async function POST(req: NextRequest) {
  let corpo: CorpoCakto;
  try {
    corpo = (await req.json()) as CorpoCakto;
  } catch {
    return NextResponse.json({ ok: false, erro: "json invalido" }, { status: 400 });
  }

  // A Cakto manda o secret no PRÓPRIO payload; sem conferir, qualquer um forjaria venda.
  // Sem secret configurado o adaptador fica DESLIGADO: aceitar sem conferir abriria venda forjada.
  const esperado = await config("cakto_webhook_secret", "CAKTO_WEBHOOK_SECRET");
  if (!esperado) {
    return NextResponse.json({ ok: false, erro: "adaptador Cakto desligado: configure CAKTO_WEBHOOK_SECRET" }, { status: 503 });
  }
  if (corpo.secret !== esperado) {
    await auditar("webhook:cakto", "secret_invalido", corpo.event ?? "?");
    return NextResponse.json({ ok: false, erro: "secret invalido" }, { status: 401 });
  }

  const evento = corpo.event ?? corpo.type ?? "";
  const pedido = corpo.data ?? {};
  const cliente = pedido.customer ?? {};
  const externalId = pedido.id ?? pedido.refId;

  // --- Reembolso e chargeback: desfazem a receita e ficam registrados.
  if (evento === "refund" || evento === "chargeback") {
    const compra = externalId
      ? await db.purchase.findUnique({ where: { externalId } })
      : null;

    if (!compra) {
      await auditar("webhook:cakto", `${evento}_sem_compra`, externalId ?? "?");
      return NextResponse.json({ ok: true, ignorado: "compra nao encontrada" });
    }

    await db.contact.update({
      where: { id: compra.contactId },
      data: {
        totalRevenue: { decrement: compra.valueCents },
        purchaseCount: { decrement: 1 },
      },
    });
    await registrarEvento({
      contactId: compra.contactId,
      eventType: "refund",
      channel: "sistema",
      metadata: {
        texto: `${evento === "refund" ? "Reembolso" : "Chargeback"} de ${compra.product}`,
        valueCents: compra.valueCents,
        externalId,
      },
    });
    // Quem pediu dinheiro de volta não é cliente ativo — sai do estágio "cliente".
    await mudarEstagio(compra.contactId, "perdido", `webhook:cakto/${evento}`);
    await auditar("webhook:cakto", evento, `${compra.product} ${compra.valueCents}`);

    return NextResponse.json({ ok: true, evento, contactId: compra.contactId });
  }

  // --- Só compra aprovada vira venda. Responder 200 nos demais evita reenfileiramento.
  if (evento !== "purchase_approved") {
    return NextResponse.json({ ok: true, ignorado: evento || "sem evento" });
  }

  const whatsapp = normalizarTelefone(cliente.phone);
  const email = (cliente.email ?? "").trim().toLowerCase() || undefined;
  if (!whatsapp && !email) {
    await auditar("webhook:cakto", "venda_sem_identificacao", externalId ?? "?");
    return NextResponse.json(
      { ok: false, erro: "venda sem telefone nem e-mail" },
      { status: 400 },
    );
  }

  try {
    const r = await registrarVenda({
      nome: cliente.name,
      email,
      whatsapp: whatsapp ?? undefined,
      produto: pedido.product?.name ?? pedido.offer?.name ?? "Produto Cakto",
      valorCentavos: emCentavos(pedido.amount ?? pedido.baseAmount),
      origem: "cakto",
      externalId,
    });

    await auditar(
      "webhook:cakto",
      r.duplicada ? "venda_duplicada_ignorada" : "venda_registrada",
      `${pedido.product?.name ?? "?"} · ${cliente.email ?? cliente.phone ?? "?"}`,
    );
    return NextResponse.json(r);
  } catch (e) {
    const erro = e instanceof Error ? e.message : String(e);
    await auditar("webhook:cakto", "venda_erro", erro);
    return NextResponse.json({ ok: false, erro }, { status: 400 });
  }
}

/** A Cakto testa o endpoint antes de assinar. */
export async function GET() {
  return NextResponse.json({ ok: true, pronto: true });
}
