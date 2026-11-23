import { db } from "@/lib/db";
import { gravarConfig } from "@/lib/config";
import { CATALOGO, chaveDoCatalogo } from "@/lib/chaves-catalogo";
import { cifrar, decifrar, mascarar } from "@/lib/cofre";
import { contasInstagramDoToken, testarChave, type ResultadoTeste } from "@/lib/chaves-teste";

/** Chaves do dono guardadas em `Setting`, cifradas. Estado do teste fica ao lado. */
const PREFIXO_VALOR = "chave:";
const PREFIXO_STATUS = "chave_status:";
/** Chave de API é uma linha de ASCII visível. Quebra de linha ou controle aqui é erro de cópia (ou ataque). */
const CHAVE_IMPRIMIVEL = /^[\x21-\x7e]+$/;

export type StatusChave = ResultadoTeste & { em: string };

export type ChaveNaTela = {
  env: string;
  salva: boolean;
  fim: string;
  status: StatusChave | null;
};

function lerStatus(bruto: string | undefined): StatusChave | null {
  if (!bruto) return null;
  try {
    const dado = JSON.parse(bruto) as StatusChave;
    return typeof dado.msg === "string" ? dado : null;
  } catch {
    return null;
  }
}

/** Todas as chaves salvas, decifradas. Só para uso no servidor. */
export async function chavesSalvas(): Promise<Record<string, string>> {
  const linhas = await db.setting.findMany({ where: { key: { startsWith: PREFIXO_VALOR } } });
  const mapa: Record<string, string> = {};
  for (const linha of linhas) {
    const env = linha.key.slice(PREFIXO_VALOR.length);
    if (!chaveDoCatalogo(env) || !linha.value) continue;
    try {
      mapa[env] = decifrar(linha.value);
    } catch {
      // Segredo do servidor trocado ou linha corrompida: a chave fica como "falta" e o dono
      // cola de novo. Uma linha ilegível não pode derrubar o painel inteiro.
      continue;
    }
  }
  return mapa;
}

export async function chavesNaTela(): Promise<ChaveNaTela[]> {
  const [valores, linhasStatus] = await Promise.all([
    chavesSalvas(),
    db.setting.findMany({ where: { key: { startsWith: PREFIXO_STATUS } } }),
  ]);
  const status = new Map(linhasStatus.map((l) => [l.key.slice(PREFIXO_STATUS.length), lerStatus(l.value)]));
  return CATALOGO.map((c) => ({
    env: c.env,
    salva: Boolean(valores[c.env]),
    fim: valores[c.env] ? mascarar(valores[c.env]) : "",
    status: status.get(c.env) ?? null,
  }));
}

/**
 * O que desce para o FERABOT do computador do dono: tudo que está salvo, menos a chave
 * que o serviço recusou (mandar chave errada só troca um erro claro aqui por um erro
 * confuso lá).
 */
export async function chavesParaOFerabot(): Promise<Record<string, string>> {
  const [valores, naTela] = await Promise.all([chavesSalvas(), chavesNaTela()]);
  const recusadas = new Set(naTela.filter((c) => c.status?.ok === false).map((c) => c.env));
  const liberadas = Object.fromEntries(Object.entries(valores).filter(([env]) => !recusadas.has(env)));
  // Um token só do Meta (usuário do sistema) serve também para o Instagram: os scripts do FERABOT
  // que leem IG_ACCESS_TOKEN (Direct, comentário, publicação) recebem o mesmo token.
  if (liberadas.META_ACCESS_TOKEN && !liberadas.IG_ACCESS_TOKEN) {
    return { ...liberadas, IG_ACCESS_TOKEN: liberadas.META_ACCESS_TOKEN };
  }
  return liberadas;
}

/** Nomes das chaves que o serviço confirmou que funcionam. */
export async function chavesFuncionando(): Promise<string[]> {
  return (await chavesNaTela()).filter((c) => c.salva && c.status?.ok === true).map((c) => c.env);
}

export async function salvarChave(env: string, valorBruto: string): Promise<StatusChave> {
  if (!chaveDoCatalogo(env)) throw new Error(`chave desconhecida: ${env}`);
  const valor = valorBruto.trim();
  if (!valor) throw new Error("valor vazio");
  if (valor.length > 4000) throw new Error("valor grande demais para ser uma chave");
  if (!CHAVE_IMPRIMIVEL.test(valor)) throw new Error("a chave tem espaço ou caractere inválido: copie de novo, só a chave");

  const outras = await chavesSalvas();
  const teste = await testarChave(env, valor, outras);
  const status: StatusChave = { ...teste, em: new Date().toISOString() };

  await gravarConfig(`${PREFIXO_VALOR}${env}`, cifrar(valor));
  await gravarConfig(`${PREFIXO_STATUS}${env}`, JSON.stringify(status));
  // Os robôs do WhatsApp leem a chave do Gemini pelo nome antigo de configuração.
  if (env === "GEMINI_API_KEY" && teste.ok !== false) await gravarConfig("gemini_api_key", valor);
  if (env === "META_ACCESS_TOKEN" && teste.ok === true) return ligarInstagram(valor, status, outras);
  return status;
}

/**
 * Token do Meta aceito: acha a conta do Instagram ligada à Página e grava o id sozinho.
 * Uma conta só = ligada. Mais de uma = o dono escolhe e cola o id. Nenhuma = explica o porquê.
 */
async function ligarInstagram(token: string, status: StatusChave, outras: Record<string, string>): Promise<StatusChave> {
  if (outras.IG_USER_ID) return status;
  const contas = await contasInstagramDoToken(token);
  let msg = status.msg;
  if (contas.length === 1) {
    const [conta] = contas;
    const statusIg: StatusChave = { ok: true, msg: `Achado pelo token do Meta: @${conta.usuario || conta.id} (Página ${conta.pagina}).`, em: status.em };
    await gravarConfig(`${PREFIXO_VALOR}IG_USER_ID`, cifrar(conta.id));
    await gravarConfig(`${PREFIXO_STATUS}IG_USER_ID`, JSON.stringify(statusIg));
    msg = `${msg} Instagram @${conta.usuario || conta.id} ligado sozinho.`;
  } else if (contas.length > 1) {
    const lista = contas.map((c) => `@${c.usuario || "?"} (id ${c.id})`).join(", ");
    msg = `${msg} Achei ${contas.length} contas do Instagram: ${lista}. Cole o id da sua em Instagram: id da conta.`;
  } else {
    msg = `${msg} Não achei Instagram ligado: confira se a conta do Instagram está ligada à Página e atribuída ao usuário do sistema.`;
  }
  const final: StatusChave = { ...status, msg };
  await gravarConfig(`${PREFIXO_STATUS}META_ACCESS_TOKEN`, JSON.stringify(final));
  return final;
}

export async function retestarChave(env: string): Promise<StatusChave | null> {
  const outras = await chavesSalvas();
  const valor = outras[env];
  if (!valor) return null;
  const status: StatusChave = { ...(await testarChave(env, valor, outras)), em: new Date().toISOString() };
  await gravarConfig(`${PREFIXO_STATUS}${env}`, JSON.stringify(status));
  if (env === "META_ACCESS_TOKEN" && status.ok === true) return ligarInstagram(valor, status, outras);
  return status;
}

export async function apagarChave(env: string): Promise<void> {
  if (!chaveDoCatalogo(env)) throw new Error(`chave desconhecida: ${env}`);
  await db.setting.deleteMany({ where: { key: { in: [`${PREFIXO_VALOR}${env}`, `${PREFIXO_STATUS}${env}`] } } });
}
