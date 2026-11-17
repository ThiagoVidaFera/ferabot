/**
 * Regra da casa: lead mandou áudio, foto, vídeo, documento ou figurinha,
 * nenhum robô responde. O robô só avisa e fica calado, em qualquer número e com qualquer agente.
 */
export type MensagemResumo = { direction: string; type: string };

const NOME_DA_MIDIA: Record<string, string> = {
  audio: "áudio",
  image: "foto",
  video: "vídeo",
  document: "documento",
  sticker: "figurinha",
};

/** Mensagens da mais nova para a mais antiga: nome da mídia do lead depois da nossa última mensagem, ou null. */
export function midiaSemResposta(mensagens: MensagemResumo[]): string | null {
  for (const m of mensagens) {
    if (m.direction !== "inbound") return null;
    if (NOME_DA_MIDIA[m.type]) return NOME_DA_MIDIA[m.type];
  }
  return null;
}
