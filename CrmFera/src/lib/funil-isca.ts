/**
 * Funil de isca digital (guia, PDF, livro, webinar em PDF, materiais gratuitos).
 *
 * Quem só baixou isca não gera aviso para o dono: o volume é alto e o lead ainda não pediu
 * conversa. O lead entra no CRM normalmente, e se RESPONDER no WhatsApp o aviso de resposta continua.
 */
export function ehFunilIsca(funil?: string | null): boolean {
  const f = String(funil ?? "").toLowerCase().replace(/^funil:/, "").replace(/-/g, "_");
  return /^(isca|pdf|material|webinar)_/.test(f);
}
