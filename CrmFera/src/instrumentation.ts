/**
 * Relógio do servidor.
 *
 * - 30s   : dispara os broadcasts agendados (exigência da F3 do megaprompt)
 * - 5min  : acorda os agentes cuja agenda venceu
 * - 15min : espelha o WAGM (grupos, campanhas, entregas)
 * - 15min : reabre janela de 24h (Cloud API) antes dela fechar
 * - 1x/dia: importa os leads do painel antigo
 *
 * O guard global evita instâncias duplicadas quando o Next recarrega em dev.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const g = globalThis as unknown as {
    __crmFila?: NodeJS.Timeout;
    __crmAgentes?: NodeJS.Timeout;
    __crmWagm?: NodeJS.Timeout;
    __crmJanela24h?: NodeJS.Timeout;
  };
  if (g.__crmFila) return;

  const { processarAgendados } = await import("@/lib/broadcast");
  const { rodarAgendados } = await import("@/lib/rodada");
  const { sincronizarWagm, wagmDisponivel } = await import("@/lib/wagm");
  const { reabrirJanelas24h } = await import("@/lib/janela24h");

  g.__crmFila = setInterval(() => {
    processarAgendados().catch((e) => console.error("[fila] erro:", e));
  }, 30_000);

  g.__crmAgentes = setInterval(() => {
    rodarAgendados()
      .then((r) => {
        for (const x of r) {
          console.log(`[agente:${x.agente}] ${x.propostas} proposta(s) de ${x.analisados}`);
        }
      })
      .catch((e) => console.error("[agentes] erro:", e));
  }, 5 * 60_000);

  // Espelho do WAGM: leitura de uma cópia do banco, não atrapalha quem dispara.
  g.__crmWagm = setInterval(() => {
    if (!wagmDisponivel()) return;
    sincronizarWagm("cron")
      .then((r) => {
        if (r.entregas) console.log(`[wagm] ${r.entregas} entrega(s) nova(s)`);
      })
      .catch((e) => console.error("[wagm] erro:", e));
  }, 15 * 60_000);

  g.__crmJanela24h = setInterval(() => {
    reabrirJanelas24h()
      .then((r) => {
        if (r.enviados || r.falhas) console.log(`[janela24h] ${r.enviados} reaberta(s), ${r.falhas} falha(s)`);
      })
      .catch((e) => console.error("[janela24h] erro:", e));
  }, 15 * 60_000);

  // A importação do painel antigo saiu do automático em 2026-08-19: todo
  // produtor de lead passou a escrever direto no CRM, então puxar de lá seria
  // reprocessar o que já entrou. O botão em Contatos continua, pra resgate.

  // Personas, número único e listas de agentes por número (Setting/env) já valem no boot.
  Promise.all([
    import("@/lib/seletor-agente").then((m) => m.recarregarListasDeAgentes()),
    import("@/lib/numero-unico").then((m) => m.recarregarNumeroUnico()),
  ]).catch((e) => console.error("[config] leitura de personas/numero unico falhou:", e));

  // Broadcast que venceu com o servidor parado sai assim que ele volta.
  processarAgendados().catch(() => {});

  // Os agentes do playbook existem em todo ambiente sem depender de seed manual
  // (gotcha 28: script solto contra o banco de producao nao roda). Idempotente:
  // nunca sobrescreve prompt de agente que ja existe.
  import("@/lib/instalar-agentes")
    .then(({ garantirAgentesPadrao }) => garantirAgentesPadrao("boot"))
    .then((r) => {
      if (r.criados.length || r.ajustados.length) {
        console.log(`[agentes] instalados: ${r.criados.join(", ") || "-"} · ajustados: ${r.ajustados.join(", ") || "-"}`);
      }
    })
    .catch((e) => console.error("[agentes] instalacao falhou:", e));
}
