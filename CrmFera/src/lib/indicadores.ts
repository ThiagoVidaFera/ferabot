import { config, gravarConfig } from "@/lib/config";

/**
 * "Meus números": cartões que o FERABOT do dono calcula na máquina dele e manda para o painel
 * (uso, posts feitos, custo das ferramentas de IA, integrações, leads). O dono personaliza a tela
 * pedindo ao FERABOT, sem mexer no código do painel.
 */
export type Indicador = {
  id: string;
  titulo: string;
  valor: string;
  detalhe?: string;
  /** "estimado" quando o número é conta do FERABOT e não vem do serviço */
  tipo?: "medido" | "estimado";
  atualizadoEm: string;
};

const K_INDICADORES = "painel_indicadores";
export const MAX_INDICADORES = 12;
const ID = /^[a-z0-9-]{2,40}$/;

function texto(v: unknown, limite: number): string {
  return typeof v === "string" ? v.trim().slice(0, limite) : typeof v === "number" ? String(v).slice(0, limite) : "";
}

/** Normaliza um cartão vindo do FERABOT. Devolve null se faltar id, título ou valor. */
export function indicadorValido(bruto: unknown, agora = new Date()): Indicador | null {
  if (!bruto || typeof bruto !== "object") return null;
  const o = bruto as Record<string, unknown>;
  const id = texto(o.id, 40).toLowerCase();
  const titulo = texto(o.titulo, 60);
  const valor = texto(o.valor, 40);
  if (!ID.test(id) || !titulo || !valor) return null;
  const detalhe = texto(o.detalhe, 160);
  return {
    id,
    titulo,
    valor,
    ...(detalhe ? { detalhe } : {}),
    tipo: o.tipo === "estimado" ? "estimado" : "medido",
    atualizadoEm: agora.toISOString(),
  };
}

/** Atualiza pelo id (o mais novo primeiro), apaga quando vem `remover: true`, respeita o teto. */
export function mesclarIndicadores(atuais: Indicador[], entrada: unknown, agora = new Date()): Indicador[] {
  const lista = Array.isArray(entrada) ? entrada : [entrada];
  let resultado = [...atuais];
  for (const bruto of lista) {
    const o = (bruto ?? {}) as Record<string, unknown>;
    const id = texto(o.id, 40).toLowerCase();
    if (o.remover === true && id) {
      resultado = resultado.filter((i) => i.id !== id);
      continue;
    }
    const novo = indicadorValido(bruto, agora);
    if (!novo) continue;
    resultado = [novo, ...resultado.filter((i) => i.id !== novo.id)];
  }
  return resultado.slice(0, MAX_INDICADORES);
}

export async function lerIndicadores(): Promise<Indicador[]> {
  const bruto = await config(K_INDICADORES);
  if (!bruto) return [];
  try {
    const dado = JSON.parse(bruto) as unknown;
    return Array.isArray(dado) ? (dado as Indicador[]) : [];
  } catch {
    return [];
  }
}

export async function gravarIndicadores(entrada: unknown): Promise<Indicador[]> {
  const novos = mesclarIndicadores(await lerIndicadores(), entrada);
  await gravarConfig(K_INDICADORES, JSON.stringify(novos));
  return novos;
}
