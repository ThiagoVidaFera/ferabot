import { db } from "@/lib/db";
import { negocio } from "@/lib/negocio";
import { ROTEIROS_SEMENTE, type Beat } from "@/lib/roteiros-semente";

/** Contas onde os roteiros são publicados: o @ do dono (negocio.json). */
export const CONTAS: ReadonlyArray<{ id: string; rotulo: string }> = [
  { id: "principal", rotulo: negocio().dono.instagram || "Perfil principal" },
];

export const STATUS = [
  { id: "a_gravar", rotulo: "A gravar" },
  { id: "gravado", rotulo: "Gravado" },
  { id: "publicado", rotulo: "Publicado" },
] as const;

export type RoteiroTela = {
  id: string;
  slug: string;
  conta: string;
  titulo: string;
  headline: string | null;
  palavra: string | null;
  mecanica: string | null;
  origem: string | null;
  beats: Beat[];
  pendencias: string | null;
  status: string;
};

/** Semente só entra com a tabela vazia: editar/apagar roteiro nunca é desfeito por uma visita. */
export async function semearSeVazio() {
  if ((await db.roteiro.count()) > 0) return;
  for (const r of ROTEIROS_SEMENTE) {
    await db.roteiro.upsert({
      where: { slug: r.slug },
      update: {},
      create: { ...r, beats: JSON.stringify(r.beats) },
    });
  }
}

function lerBeats(texto: string): Beat[] {
  try {
    const v: unknown = JSON.parse(texto);
    return Array.isArray(v) ? (v as Beat[]) : [];
  } catch {
    return [];
  }
}

export async function listarRoteiros(): Promise<RoteiroTela[]> {
  await semearSeVazio();
  const linhas = await db.roteiro.findMany({ orderBy: [{ conta: "asc" }, { ordem: "asc" }] });
  return linhas.map((l) => ({ ...l, beats: lerBeats(l.beats) }));
}
