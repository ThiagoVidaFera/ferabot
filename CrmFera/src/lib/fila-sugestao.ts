import { negocio } from "@/lib/negocio";
import { validarMensagem, temProximoPasso, type Autorizado } from "@/lib/guardas";
import { dividirQuebra, arrumarFormato, juntarPartes, MAX_PARTES } from "@/lib/quebra";
import { primeiroNome } from "@/lib/telefone";
import type { Janela } from "@/lib/fila-prioridade";

/**
 * Sugestao de resposta para a fila "falou e ninguem respondeu".
 *
 * REUTILIZA o que ja existe: `guardas.ts` (preco/link so da tabela autorizada,
 * sem desculpa, sem licenca de fuga, sem escassez, sem fingir ser o dono,
 * paragrafo curto, termina com proximo passo) e `quebra.ts` ([QUEBRA]).
 * NAO passa por `agente-conversa.ts` de proposito: la toda saida vira
 * `propor()`, e num agente em modo `autonomo` isso EXECUTA o envio. Aqui a
 * sugestao e so texto devolvido — enviar e ato humano.
 *
 * O gerador de IA entra por parametro (testavel sem rede nem chave).
 */

export type Gerador = (
  prompt: string,
  entrada: string,
) => Promise<{ ok: boolean; texto?: string; erro?: string }>;

export type Fala = { de: "lead" | "nos"; texto: string };

export type ContextoSugestao = {
  nome: string;
  estagio: string;
  origem: string;
  horasParado: number;
  janela: Janela;
  exigeTemplate: boolean;
  historico: Fala[];
};

export type Sugestao =
  | { ok: true; texto: string; partes: string[] }
  | { ok: false; erros: string[] };

export const PROMPT_SUGESTAO = `Você escreve a PRÓXIMA mensagem de WhatsApp de ${negocio().dono.nome} (${negocio().nome}, ${negocio().nicho}) para um lead que falou e ficou sem resposta. Quem vai ler e enviar é um humano — você só sugere.

COMO ESCREVER
- Tom de conversa de WhatsApp entre pessoas: humano, direto, sem robotismo, sem linguagem corporativa.
- Responda ao que o lead DISSE por último, usando as palavras dele. Se ele fez uma pergunta, responda primeiro e só depois pergunte.
- Abra em continuidade ("Dando continuidade ao que a gente conversou…", "Voltando de onde a gente parou…") e feche gerando desejo ou ação.
- NUNCA peça desculpa pela demora ("desculpa", "falha minha", "eu sumi"). NUNCA dê licença de fuga ("pode ignorar", "sem compromisso", "se não for seu momento").
- NUNCA invente preço, prazo, vaga, resultado, caso ou link. Só cite o que estiver no contexto. Sem dado, faça UMA pergunta curta.
- NUNCA prometa algo para "depois" ("te mando mais tarde"). NUNCA use escassez falsa. Não se apresente como o ${negocio().dono.primeiroNome}.
- Termine SEMPRE com UMA pergunta fácil de responder (ou um próximo passo claro).

FORMATO
- Parágrafos de no máximo 3 linhas, uma linha em branco entre eles. Nunca bloco único.
- Para mandar em mais de uma mensagem, separe com [QUEBRA] (no máximo 4 partes).
- No máximo 1 emoji por bloco, sempre com espaço depois. Sem markdown, sem bullets.
- Responda SOMENTE com o texto da mensagem, nada antes nem depois.`;

const SEM_NOME = "(desconhecido)";
const TENTATIVAS = 2;

/** Nome so se for nome de pessoa; telefone nao e nome. */
function nomeUsavel(nome: string): string {
  const primeiro = primeiroNome(nome);
  if (!primeiro || /\d/.test(primeiro) || primeiro.length < 2) return SEM_NOME;
  return primeiro;
}

function descreverJanela(j: Janela, exigeTemplate: boolean): string {
  if (j.estado === "fechada") {
    return exigeTemplate
      ? "janela de 24h FECHADA (número oficial: só template aprovado entrega; a mensagem será enviada por outro caminho)"
      : "janela de 24h FECHADA (número comum: pode responder normalmente)";
  }
  const h = Math.max(1, Math.round(j.horasRestantes ?? 0));
  return j.estado === "fechando"
    ? `janela de 24h aberta, fecha em ${h}h`
    : `janela de 24h aberta (${h}h restantes)`;
}

export function montarEntrada(ctx: ContextoSugestao): string {
  const historico = ctx.historico
    .map((f) => `${f.de === "lead" ? "LEAD" : "NOS"}: ${f.texto}`)
    .join("\n");
  return [
    `NOME: ${nomeUsavel(ctx.nome)}`,
    `ESTÁGIO: ${ctx.estagio}`,
    `ORIGEM: ${ctx.origem}`,
    `SITUAÇÃO: lead parado ha ${Math.floor(ctx.horasParado)}h sem resposta nossa; ${descreverJanela(ctx.janela, ctx.exigeTemplate)}`,
    "",
    "CONVERSA ATÉ AQUI (a última fala é do lead e ainda não foi respondida):",
    historico || "(sem histórico)",
  ].join("\n");
}

function limpar(bruto: string): string {
  return bruto
    .trim()
    .replace(/^```[a-z]*\s*/i, "")
    .replace(/```$/, "")
    .replace(/️/g, "") // seletor de variacao vira caixinha em aparelho antigo
    .trim();
}

function validarPartes(partes: string[], autorizado: Autorizado): string[] {
  if (!partes.length) return ["mensagem vazia"];
  if (partes.length > MAX_PARTES) return [`mais de ${MAX_PARTES} partes — junte em menos mensagens`];
  const erros = partes.flatMap((p, i) => {
    const v = validarMensagem(p, autorizado);
    return v.ok ? [] : v.erros.map((e) => (partes.length > 1 ? `parte ${i + 1}: ${e}` : e));
  });
  if (!temProximoPasso(partes[partes.length - 1])) {
    erros.push("termina sem pergunta nem próximo passo — feche com UMA pergunta");
  }
  return erros;
}

export async function gerarSugestao(
  ctx: ContextoSugestao,
  deps: { gerarFn: Gerador; autorizado: Autorizado },
): Promise<Sugestao> {
  const base = montarEntrada(ctx);
  let ultimosErros: string[] = ["sem tentativa"];

  for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
    const reforco =
      tentativa > 1
        ? `\n\nA SUA RESPOSTA ANTERIOR FOI RECUSADA POR: ${ultimosErros.join("; ")}. Reescreva corrigindo SÓ isso, mantendo o conteúdo e a pergunta final.`
        : "";

    let resposta: Awaited<ReturnType<Gerador>>;
    try {
      resposta = await deps.gerarFn(PROMPT_SUGESTAO, base + reforco);
    } catch (e) {
      ultimosErros = [e instanceof Error ? e.message : String(e)];
      continue;
    }
    if (!resposta.ok || !resposta.texto) {
      ultimosErros = [resposta.erro ?? "IA sem resposta"];
      continue;
    }

    const partes = arrumarFormato(dividirQuebra(limpar(resposta.texto)));
    const erros = validarPartes(partes, deps.autorizado);
    if (erros.length) {
      ultimosErros = erros;
      continue;
    }
    return { ok: true, texto: juntarPartes(partes), partes };
  }

  return { ok: false, erros: ultimosErros };
}
