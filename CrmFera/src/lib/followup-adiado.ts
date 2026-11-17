/**
 * O follow-up de 48h deve esperar por este lead? (02/11/2026)
 *
 * O agente voltava a falar com quem tinha pedido pra esperar: o Osmar disse
 * "só em novembro" em 29/10 e recebeu toque em 31/10; o Felipe Duran ("estou
 * amadurecendo") e o Edson (`nao-qualificado-orcamento`) também. Resposta do
 * lead continua sendo atendida — isto vale só pro toque que o agente puxa.
 */
const MESES = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

const semAcento = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * `retornar-novembro` -> primeiro dia do mês. Mês corrente ou já passado há mais de
 * 6 meses = data passada (libera); mês até 6 meses à frente = próxima ocorrência
 * (janeiro visto em outubro é 2027).
 */
export function dataDeRetorno(tags: string[], agora: Date): Date | null {
  for (const t of tags) {
    const m = semAcento(t).match(/^retornar-([a-z]+)$/);
    const mes = m ? MESES.indexOf(m[1]) : -1;
    if (mes < 0) continue;
    const atual = agora.getUTCMonth();
    const adiante = (mes - atual + 12) % 12;
    const ano = adiante > 0 && adiante <= 6 && mes < atual ? agora.getUTCFullYear() + 1 : agora.getUTCFullYear();
    return new Date(Date.UTC(ano, mes, 1, 11));
  }
  return null;
}

export function followupAdiado(c: { tags: string[]; lifecycleStage: string }, agora: Date): boolean {
  // Bloqueios que nenhuma data de retorno desfaz.
  if (c.tags.some((t) => t.startsWith("nao-qualificado") || t === "defletiu" || t === "optout")) return true;
  const retorno = dataDeRetorno(c.tags, agora);
  if (retorno) return agora.getTime() < retorno.getTime();
  if (c.tags.includes("sem-condicoes-agora")) return true;
  // `futuro` sem data combinada: o lead pediu pra deixar pra depois, quem retoma é gente.
  return c.lifecycleStage === "futuro";
}
