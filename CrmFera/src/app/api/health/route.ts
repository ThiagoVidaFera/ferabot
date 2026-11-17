import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const contatos = await db.contact.count();
    const instancia = await db.whatsappInstance.findFirst({ where: { isDefault: true } });
    return NextResponse.json({
      ok: true,
      contatos,
      instancia: instancia?.status ?? "desconectado",
    });
  } catch (e) {
    return NextResponse.json({ ok: false, erro: String(e) }, { status: 500 });
  }
}
