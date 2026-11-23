import { db } from "@/lib/db";
import { config, gravarConfig } from "@/lib/config";
import { chavesFuncionando } from "@/lib/chaves";
import { nivelDoPainel, painelHospedado } from "@/lib/hospedado";
import { temConteudo } from "@/lib/plano-cliente";
import { novoToken, tokensIguais } from "@/lib/cofre";
import { lerPlano, lerProgresso } from "@/lib/plano-cliente-banco";
import { ehMarco, montarJornada, type EstadoJornada, type Jornada, type Marco, type RegistroMarco } from "@/lib/jornada";

/** Estado da Jornada e do vínculo com o FERABOT, guardado em `Setting` (sem migration). */
const K_MARCOS = "jornada_marcos";
const K_ENTREGAS = "ferabot_entregas";
const K_VISTO = "ferabot_visto_em";
const K_PERFIL = "ferabot_perfil";
const K_TOKEN = "ferabot_token";
const MAX_ENTREGAS = 60;
const MAX_TEXTO = 400;

export type Entrega = { em: string; bot: string; oque: string; link?: string };

function lerJson<T>(bruto: string, padrao: T): T {
  if (!bruto) return padrao;
  try {
    return JSON.parse(bruto) as T;
  } catch {
    return padrao;
  }
}

function texto(valor: unknown, limite = MAX_TEXTO): string {
  return typeof valor === "string" ? valor.trim().slice(0, limite) : "";
}

function linkSeguro(valor: unknown): string | undefined {
  const bruto = texto(valor, 500);
  return /^https?:\/\//i.test(bruto) ? bruto : undefined;
}

export async function lerMarcos(): Promise<Partial<Record<Marco, RegistroMarco>>> {
  return lerJson(await config(K_MARCOS), {});
}

export async function lerEntregas(): Promise<Entrega[]> {
  return lerJson<Entrega[]>(await config(K_ENTREGAS), []);
}

/**
 * Lê o estado gravado do número padrão (Configurações e o FERABOT atualizam ao consultar).
 * Não chama o servidor do WhatsApp aqui: a tela inicial não pode esperar servidor alheio.
 */
async function estadoDoWhatsapp(): Promise<EstadoJornada["whatsapp"]> {
  const numero = await db.whatsappInstance.findFirst({ where: { isDefault: true }, orderBy: { createdAt: "desc" } });
  const url = numero?.evolutionApiUrl ?? "";
  const oficial = numero?.provider === "cloud_api";
  const servidor = Boolean(url) && (oficial || !painelHospedado() || url.startsWith("https://"));
  return { servidor, conectado: servidor && numero?.status === "conectado" };
}

/**
 * Lead real = chegou com UTM (anúncio, YouTube, link rastreado). O lead de teste que o dono
 * preenche na própria página não leva UTM. É o lead que vale para a garantia de implementação.
 */
export async function contarLeadsReais(): Promise<number> {
  const linhas = await db.$queryRaw<{ n: bigint | number }[]>`
    SELECT COUNT(*) AS n FROM "Contact"
    WHERE COALESCE(json_extract("customFields", '$.utm_source'), '') <> ''`;
  return Number(linhas[0]?.n ?? 0);
}

/**
 * Última vez que o dono AVANÇOU: marco, entrega, roteiro gravado/publicado ou plano aprovado.
 * O FERABOT só abrir e consultar não conta: é para o alerta de cliente parado.
 */
export async function ultimaAtividade(): Promise<string | null> {
  const [marcos, entregas, plano, progresso] = await Promise.all([lerMarcos(), lerEntregas(), lerPlano(), lerProgresso()]);
  const datas = [
    ...Object.values(marcos).map((m) => m?.em),
    ...entregas.map((e) => e.em),
    plano.aprovadoEm,
    ...Object.values(progresso).flatMap((r) => [r.gravado, r.publicado]),
  ].filter((d): d is string => typeof d === "string" && !Number.isNaN(Date.parse(d)));
  if (datas.length === 0) return null;
  return datas.reduce((a, b) => (Date.parse(a) > Date.parse(b) ? a : b));
}

export async function estadoDaJornada(): Promise<EstadoJornada> {
  const [visto, funcionando, marcos, totalLeads, whatsapp, plano, leadsReais] = await Promise.all([
    config(K_VISTO),
    chavesFuncionando(),
    lerMarcos(),
    db.contact.count(),
    estadoDoWhatsapp(),
    lerPlano(),
    contarLeadsReais(),
  ]);
  return {
    ferabotConectado: Boolean(visto),
    chavesFuncionando: funcionando,
    marcos,
    totalLeads,
    whatsapp,
    planoAprovado: Boolean(plano.aprovadoEm),
    leadsReais,
    equipeFazTecnica: painelHospedado() && nivelDoPainel() === "equipe",
    planoEntregue: temConteudo(plano),
  };
}

export async function jornadaAtual(): Promise<Jornada> {
  return montarJornada(await estadoDaJornada());
}

export async function registrarMarco(marco: unknown, dados: { link?: unknown; resumo?: unknown; desfazer?: unknown }) {
  if (!ehMarco(marco)) throw new Error("marco desconhecido");
  const marcos = await lerMarcos();
  const novos = { ...marcos };
  if (dados.desfazer === true) {
    delete novos[marco];
  } else {
    novos[marco] = {
      em: new Date().toISOString(),
      link: linkSeguro(dados.link),
      resumo: texto(dados.resumo) || undefined,
    };
  }
  await gravarConfig(K_MARCOS, JSON.stringify(novos));
}

export async function registrarEntrega(dados: { bot?: unknown; oque?: unknown; link?: unknown }) {
  const oque = texto(dados.oque);
  if (!oque) throw new Error("entrega sem descrição");
  const nova: Entrega = {
    em: new Date().toISOString(),
    bot: texto(dados.bot, 60) || "ferabot",
    oque,
    link: linkSeguro(dados.link),
  };
  const entregas = [nova, ...(await lerEntregas())].slice(0, MAX_ENTREGAS);
  await gravarConfig(K_ENTREGAS, JSON.stringify(entregas));
}

export async function registrarPerfil(perfil: unknown) {
  if (!perfil || typeof perfil !== "object") return;
  const origem = perfil as Record<string, unknown>;
  const limpo = Object.fromEntries(
    ["nome", "nicho", "oferta", "instagram", "meta_mensal", "ticket"].map((c) => [c, texto(String(origem[c] ?? ""), 200)]),
  );
  await gravarConfig(K_PERFIL, JSON.stringify(limpo));
}

export async function marcarFerabotVisto() {
  await gravarConfig(K_VISTO, new Date().toISOString());
}

export async function ferabotVistoEm(): Promise<string> {
  return config(K_VISTO);
}

/** Código que liga o FERABOT do dono a este painel. Nasce na primeira leitura. */
export async function tokenDoFerabot(): Promise<string> {
  const atual = await config(K_TOKEN, "FERABOT_TOKEN");
  if (atual) return atual;
  const novo = novoToken();
  await gravarConfig(K_TOKEN, novo);
  return novo;
}

export async function tokenDoFerabotConfere(recebido: string | null): Promise<boolean> {
  const esperado = await config(K_TOKEN, "FERABOT_TOKEN");
  return tokensIguais(recebido ?? "", esperado);
}
