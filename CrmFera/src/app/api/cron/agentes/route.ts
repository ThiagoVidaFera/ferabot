import { NextResponse } from "next/server";
import { recusaSemTokenDeCron } from "@/lib/cron-token";
import { rodarAgendados } from "@/lib/rodada";
import { vigiarSessoes } from "@/lib/vigia-sessoes";
import { enviarResumoDiario } from "@/lib/resumo-diario";
import { enviarResumoSilencio } from "@/lib/resumo-silencio";
import { vigiarRastreamento } from "@/lib/vigia-rastreamento";

export const dynamic = "force-dynamic";

/** Gatilho manual da rodada — útil pra testar sem esperar o horário.
 *  O cron da VPS chama a cada 5 min; o vigia de numero caido e o resumo diario
 *  (depois das 18h, uma vez por dia) pegam carona. */
async function rodar() {
  const sessoes = await vigiarSessoes().catch((e: unknown) => ({
    caidas: [],
    avisadas: [],
    erro: e instanceof Error ? e.message : String(e),
  }));
  const rodadas = await rodarAgendados();
  const resumo = await enviarResumoDiario().catch((e: unknown) => ({
    enviado: false,
    motivo: e instanceof Error ? e.message : String(e),
  }));
  const silencio = await enviarResumoSilencio().catch((e: unknown) => ({
    enviado: false,
    motivo: e instanceof Error ? e.message : String(e),
  }));
  const rastreio = await vigiarRastreamento().catch((e: unknown) => ({
    enviado: false,
    motivo: e instanceof Error ? e.message : String(e),
  }));
  return NextResponse.json({ ok: true, rodadas, sessoes, resumo, silencio, rastreio });
}
export async function POST(req: Request) {
  return recusaSemTokenDeCron(req) ?? rodar();
}

export async function GET(req: Request) {
  return recusaSemTokenDeCron(req) ?? rodar();
}
