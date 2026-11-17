/**
 * Reconhece, numa mensagem ENVIADA, se ela é um toque de follow-up pós-proposta.
 *
 * Os toques novos carregam `metadata.followup` (`proposta-d7-a`…). Os antigos do robô Python da VPS
 * (`rotina_pos_reuniao.py`) saíam pelo WAHA sem rótulo, então são reconhecidos pelo texto. Serve ao
 * painel de propostas (contador "x de 7") e à adoção das propostas que já estavam em andamento.
 */

const PADROES_LEGADOS: readonly RegExp[] = [
  /Voltei na proposta que te mandei/i,
  /o que ainda falta pra você decidir sobre a proposta/i,
  /última mensagem minha sobre a proposta/i,
  /Lembrete importante[\s\S]*condição/i,
  /Gravei um vídeo curto que mostra/i,
  /enquanto você avalia a proposta/i,
];

export function ehToqueDeFollowupProposta(body: string | null | undefined, meta: unknown): boolean {
  const m = (meta ?? {}) as Record<string, unknown>;
  const rotulo = typeof m.followup === "string" ? m.followup : "";
  if (rotulo.startsWith("proposta-") || rotulo === "agente-48h") return true;
  const texto = body ?? "";
  return PADROES_LEGADOS.some((p) => p.test(texto));
}
