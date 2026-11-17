import { NextResponse } from "next/server";
import { recusaSemTokenDeCron } from "@/lib/cron-token";
import { processarFollowup } from "@/lib/followup-auto";
import { processarFollowupAgentes } from "@/lib/followup-agente";
import { processarSequenciaIscas } from "@/lib/sequencia-iscas";
import { processarSequenciasProposta } from "@/lib/sequencia-proposta";
import { processarNoShows } from "@/lib/sequencia-noshow";
import { processarFollowupEntrada } from "@/lib/followup-entrada";
import { processarPrimeiroContato } from "@/lib/primeiro-contato";
import { processarRespostasAgendadas } from "@/lib/resposta-agendada";
import { responderAgendado } from "@/lib/agente-conversa";
import { processarPropostasAuto } from "@/lib/proposta-auto";

export const dynamic = "force-dynamic";

/**
 * Gatilho da regua de follow-up (cron do host chama a cada minuto).
 *
 * AGUARDA o processamento de proposito, pelo mesmo motivo do cron de disparos:
 * em Next 16 promise solta apos a resposta e descartada. Cada tick manda
 * poucos toques — o espacamento anti-ban vem da frequencia do cron, nao de um
 * `sleep` pendurado numa rota HTTP.
 *
 * Nasce DESLIGADO: sem `followup_auto = "1"` no Setting, responde e nao envia.
 */
async function rodar() {
  // Respostas do robô com atraso humano (1–3 min): primeiro, pra não esperar atrás de outro trabalho.
  const respostas = await processarRespostasAgendadas(responderAgendado).catch((e: unknown) => ({
    erro: e instanceof Error ? e.message : String(e),
  }));
  // Proposta automática depois do "pode" (15/11/2026): compõe, acompanha a página e envia.
  const propostasAuto = await processarPropostasAuto().catch((e: unknown) => ({
    erro: e instanceof Error ? e.message : String(e),
  }));
  const r = await processarFollowup();
  // Conversas paradas ha 48h nos numeros pessoais (agentes das consultorias, 28/10/2026).
  const agentes = await processarFollowupAgentes().catch((e: unknown) => ({
    ligado: true,
    motivo: `erro: ${e instanceof Error ? e.message : String(e)}`,
  }));
  // Sequencia das iscas (sequencia-iscas.ts); nasce desligada.
  const iscas = await processarSequenciaIscas().catch((e: unknown) => ({
    ligado: true,
    motivo: `erro: ${e instanceof Error ? e.message : String(e)}`,
  }));
  // Sequência pós-proposta D+1 a D+90 (09/11/2026); nasce desligada (Setting `sequencia_proposta`).
  const sequenciaProposta = await processarSequenciasProposta()
    .then((r) => ({ modo: r.modo, adotadas: r.adotadas, enviados: r.enviados, ...(r.ocupado ? { ocupado: true } : {}) }))
    .catch((e: unknown) => ({ erro: e instanceof Error ? e.message : String(e) }));
  // Sequência de quem agendou e não compareceu, D+1/7/15/30/60 (10/11/2026); nasce desligada (Setting `sequencia_noshow`).
  const noShow = await processarNoShows()
    .then((r) => ({ modo: r.modo, adotados: r.adotados, enviados: r.enviados, ...(r.ocupado ? { ocupado: true } : {}) }))
    .catch((e: unknown) => ({ erro: e instanceof Error ? e.message : String(e) }));
  // Toque de 1 emoji 72h depois da entrada, pra quem nunca recebeu nada (29/10/2026).
  const entrada = await processarFollowupEntrada().catch((e: unknown) => ({
    ligado: true,
    motivo: `erro: ${e instanceof Error ? e.message : String(e)}`,
  }));
  // Abertura do robô 1h depois do cadastro, pra quem não mandou o primeiro WhatsApp (08/11/2026).
  const primeiroContato = await processarPrimeiroContato().catch((e: unknown) => ({
    ligado: true,
    motivo: `erro: ${e instanceof Error ? e.message : String(e)}`,
  }));
  return NextResponse.json({ ok: true, ...r, agentes, iscas, sequenciaProposta, noShow, entrada, primeiroContato, respostas, propostasAuto });
}

export async function POST(req: Request) {
  return recusaSemTokenDeCron(req) ?? rodar();
}

export async function GET(req: Request) {
  return recusaSemTokenDeCron(req) ?? rodar();
}
