import { config, gravarConfig } from "@/lib/config";
import {
  aprovarPlano,
  lerPlanoBruto,
  mesclarPlano,
  type PlanoCliente,
  type ResultadoPlano,
} from "@/lib/plano-cliente";

const K_PLANO = "plano_cliente";
const K_PROGRESSO = "plano_progresso";

/** O que o dono já fez com cada roteiro do YouTube, pelo título. */
export type ProgressoRoteiro = { gravado?: string; publicado?: string; link?: string };
export type ProgressoRoteiros = Record<string, ProgressoRoteiro>;

export async function lerPlano(): Promise<PlanoCliente> {
  return lerPlanoBruto(await config(K_PLANO));
}

/** Mescla e grava. Devolve o erro de validação sem gravar nada. */
export async function salvarPlano(entrada: unknown): Promise<ResultadoPlano> {
  const resultado = mesclarPlano(await lerPlano(), entrada);
  if (resultado.ok) await gravarConfig(K_PLANO, JSON.stringify(resultado.plano));
  return resultado;
}

export async function aprovarPlanoAtual(): Promise<boolean> {
  const aprovado = aprovarPlano(await lerPlano());
  if (!aprovado) return false;
  await gravarConfig(K_PLANO, JSON.stringify(aprovado));
  return true;
}

export async function lerProgresso(): Promise<ProgressoRoteiros> {
  const bruto = await config(K_PROGRESSO);
  if (!bruto) return {};
  try {
    const dado = JSON.parse(bruto) as unknown;
    return dado && typeof dado === "object" && !Array.isArray(dado) ? (dado as ProgressoRoteiros) : {};
  } catch {
    return {};
  }
}

export async function marcarRoteiro(titulo: string, etapa: "gravado" | "publicado", link?: string): Promise<ProgressoRoteiros> {
  const plano = await lerPlano();
  if (!plano.roteirosYoutube.some((r) => r.titulo === titulo)) throw new Error("roteiro não está no plano");
  const atual = await lerProgresso();
  const agora = new Date().toISOString();
  const anterior = atual[titulo] ?? {};
  const novo: ProgressoRoteiro = {
    ...anterior,
    gravado: anterior.gravado ?? agora,
    ...(etapa === "publicado" ? { publicado: anterior.publicado ?? agora, ...(link ? { link } : {}) } : {}),
  };
  const progresso = { ...atual, [titulo]: novo };
  await gravarConfig(K_PROGRESSO, JSON.stringify(progresso));
  return progresso;
}

/** Posts usam o mesmo registro, com a chave `post:<título>`. */
export const chaveDoPost = (titulo: string) => `post:${titulo}`;

export async function marcarPostPublicado(titulo: string): Promise<void> {
  const plano = await lerPlano();
  if (!plano.postsInstagram.some((p) => p.titulo === titulo)) throw new Error("post não está no plano");
  const atual = await lerProgresso();
  const chave = chaveDoPost(titulo);
  if (atual[chave]?.publicado) return;
  const agora = new Date().toISOString();
  await gravarConfig(K_PROGRESSO, JSON.stringify({ ...atual, [chave]: { gravado: agora, publicado: agora } }));
}

export function contarProgresso(plano: PlanoCliente, progresso: ProgressoRoteiros) {
  const titulos = plano.roteirosYoutube.map((r) => r.titulo);
  return {
    roteiros: titulos.length,
    gravados: titulos.filter((t) => progresso[t]?.gravado).length,
    publicados: titulos.filter((t) => progresso[t]?.publicado).length,
    postsPublicados: plano.postsInstagram.filter((p) => progresso[chaveDoPost(p.titulo)]?.publicado).length,
  };
}
