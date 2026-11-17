// Roteiros que a aba Roteiros semeia no primeiro uso. O CRM FERA nasce sem roteiros prontos:
// os roteiros da cliente entram pela própria aba (ou pelo /roteiros-e-oratoria do FERABOT).

export type Beat = { tempo: string; tela: string; fala: string };
export type RoteiroSemente = { slug: string; conta: string; ordem: number; titulo: string; headline: string | null; palavra: string | null; mecanica: string | null; origem: string | null; beats: Beat[]; pendencias: string | null };

export const ROTEIROS_SEMENTE: RoteiroSemente[] = [];
