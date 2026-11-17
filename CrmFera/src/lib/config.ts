import { db } from "@/lib/db";

/**
 * Leitura de configuracao com precedencia: Setting (editavel na tela) > .env > padrao.
 * O megaprompt manda guardar as chaves em Setting; o .env fica como semente e
 * como caminho de emergencia se o banco estiver vazio.
 */
export async function config(chave: string, envKey?: string, padrao = ""): Promise<string> {
  const linha = await db.setting.findUnique({ where: { key: chave } });
  if (linha?.value) return linha.value;
  if (envKey && process.env[envKey]) return process.env[envKey] as string;
  return padrao;
}

export async function gravarConfig(chave: string, valor: string) {
  return db.setting.upsert({
    where: { key: chave },
    update: { value: valor },
    create: { key: chave, value: valor },
  });
}

export async function configMuitas(chaves: string[]): Promise<Record<string, string>> {
  const linhas = await db.setting.findMany({ where: { key: { in: chaves } } });
  const mapa: Record<string, string> = {};
  for (const c of chaves) mapa[c] = linhas.find((l) => l.key === c)?.value ?? "";
  return mapa;
}

/**
 * Substitui as variáveis da mensagem.
 *   {{nome}} · {{nome_completo}} · {{objetivo}}
 * `objetivo` é o que o lead respondeu no funil ("qual tarefa você queria nunca
 * mais fazer na mão") — citar isso de volta é a diferença entre disparo e
 * conversa.
 */
export function aplicarVariaveis(
  texto: string,
  contato: { name: string; customFields?: unknown },
): string {
  const primeiro = (contato.name ?? "").trim().split(/\s+/)[0] ?? "";
  const campos =
    contato.customFields && typeof contato.customFields === "object"
      ? (contato.customFields as Record<string, unknown>)
      : {};
  const objetivo = typeof campos.objetivo === "string" ? campos.objetivo.trim() : "";

  return texto
    .replace(/\{\{\s*nome\s*\}\}/gi, primeiro)
    .replace(/\{\{\s*nome_completo\s*\}\}/gi, contato.name ?? "")
    .replace(/\{\{\s*objetivo\s*\}\}/gi, objetivo);
}


/**
 * Um conteúdo de disparo pode carregar VÁRIAS variantes, separadas por uma
 * linha com `---`. Texto idêntico em massa é o caminho mais curto pro
 * banimento — a regra anti-ban do WAGM existe por isso e vale igual aqui.
 */
export function variantes(conteudo: string): string[] {
  const partes = conteudo
    .split(/^\s*---\s*$/m)
    .map((v) => v.trim())
    .filter(Boolean);
  return partes.length ? partes : [conteudo];
}

/** O contato tem nome de gente, ou só o telefone no lugar do nome? */
export function temNomeDeVerdade(c: { name: string; phone: string | null }): boolean {
  const n = (c.name ?? "").trim();
  if (!n) return false;
  if (c.phone && n.replace(/\D/g, "") === c.phone) return false;
  return !/^\+?\d[\d\s()-]*$/.test(n);
}

/**
 * Escolhe a variante para ESTE contato. Rotaciona pelo índice na fila e evita
 * mandar variante com {{nome}} pra quem entrou só com telefone — senão a
 * mensagem abre "Oi , tudo bem?".
 */
export function escolherVariante(
  lista: string[],
  indice: number,
  contato: { name: string; phone: string | null; customFields?: unknown },
): string {
  if (lista.length === 1) return lista[0];

  const campos =
    contato.customFields && typeof contato.customFields === "object"
      ? (contato.customFields as Record<string, unknown>)
      : {};
  const temObjetivo = typeof campos.objetivo === "string" && campos.objetivo.trim().length > 3;

  // Variante que usa uma variável que este contato não tem sai da rotação —
  // senão a mensagem chega com buraco ("Oi , ..." / "você disse que queria .").
  const elegiveis = lista.filter((v) => {
    if (v.includes("{{nome}}") && !temNomeDeVerdade(contato)) return false;
    if (v.includes("{{objetivo}}") && !temObjetivo) return false;
    return true;
  });
  const alvo = elegiveis.length ? elegiveis : lista.filter((v) => !v.includes("{{"));

  return (alvo.length ? alvo : lista)[indice % (alvo.length || lista.length)];
}
