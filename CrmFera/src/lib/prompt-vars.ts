import { OFERTAS, PRODUTO_DE_ENTRADA, SUPORTE_HUMANO, autorizadoGeral } from "@/lib/ofertas";
import { lerEvento, linksDoEvento, precosDoEvento, type Evento } from "@/lib/evento";
import { negocio } from "@/lib/negocio";
import type { Autorizado } from "@/lib/guardas";

/**
 * Variaveis do prompt — `{{oferta.yt.preco}}`, `{{evento.data}}`,
 * `{{suporte.link}}`… resolvidas NA HORA da chamada, a partir da fonte unica
 * (ofertas.ts + Setting). E o que faz o prompt do mentor (que manda preencher
 * colchete por colchete) virar um prompt que nunca fica com data velha no ar:
 * mudou no CRM, mudou pra todos os agentes na proxima mensagem.
 *
 * Variavel desconhecida NAO some em silencio: vira `[VARIÁVEL DESCONHECIDA: x]`
 * no texto, e o guarda de links/precos nao deixa isso virar mensagem valida —
 * o erro aparece na trilha em modo sugere, onde deve aparecer.
 */

type Dicionario = Record<string, string>;

function achatar(prefixo: string, obj: unknown, saida: Dicionario) {
  if (obj === null || obj === undefined) return;
  if (Array.isArray(obj)) {
    saida[prefixo] = obj
      .map((x) => (typeof x === "object" && x ? Object.values(x as object).join(" — ") : String(x)))
      .join("; ");
    obj.forEach((x, i) => achatar(`${prefixo}.${i}`, x, saida));
    return;
  }
  if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      achatar(prefixo ? `${prefixo}.${k}` : k, v, saida);
    }
    return;
  }
  saida[prefixo] = String(obj);
}

export async function contextoDeVariaveis(): Promise<{ vars: Dicionario; evento: Evento }> {
  const evento = await lerEvento();
  const n = negocio();
  const raiz: Record<string, unknown> = {
    negocio: {
      nome: n.nome,
      dono: n.dono.nome,
      donoPrimeiroNome: n.dono.primeiroNome,
      instagram: n.dono.instagram,
      assistente: n.assistente.apresentacao,
      nicho: n.nicho,
      publico: n.publico,
      promessa: n.promessa,
      qualificacao: n.qualificacao.map((q, i) => `${i + 1}. ${q}`).join("\n"),
      reuniao: `${n.reuniao.duracaoMin} minutos, por ${n.reuniao.formato}`,
    },
    links: n.links,
    suporte: SUPORTE_HUMANO,
    evento,
    // `oferta.principal` é sempre a PRIMEIRA oferta do negocio.json (os prompts padrão usam esse nome)
    oferta: Object.fromEntries(
      [...OFERTAS.slice(0, 1).map((o) => ({ ...o, slug: "principal" })), ...OFERTAS].map((o) => [
        o.slug,
        {
          nome: o.nome,
          preco: o.comoFalar,
          avista: o.precoAVista,
          parcelamento: o.parcelamento,
          link: o.link,
          garantia: o.garantia,
          garantiaCurta: o.garantiaCurta,
          acesso: o.acesso,
          posicionamento: o.posicionamento,
          transformacao: o.transformacao,
          paraQuem: o.paraQuem,
          entregas: o.entregas.map((e, i) => `${i + 1}. ${e}`).join("\n"),
          bonus: o.bonus.map((b) => `${b.nome} (${b.valor})`).join("; "),
          bonusAncora: o.bonusAncora,
          urgencia: o.urgenciaReal,
          naoDizer: o.naoDizer.map((n) => `- ${n}`).join("\n"),
        },
      ]),
    ),
    // Produto de ENTRADA: num ciclo de evento PAGO, o ingresso E o produto de
    // entrada — preco e checkout vem do Setting (muda sem deploy). So fica
    // "disponivel" quando o link do checkout existe. Fora de ciclo pago, vale
    // o placeholder estatico de ofertas.ts.
    entrada: evento.pago
      ? {
          disponivel: evento.linkIngresso ? "true" : "false",
          slug: "entrada",
          nome: `Ingresso — ${evento.nome}`,
          preco: `${evento.ingresso}, pagamento único`,
          link: evento.linkIngresso,
          garantia: "7 dias pela plataforma",
        }
      : PRODUTO_DE_ENTRADA,
  };
  const vars: Dicionario = {};
  achatar("", raiz, vars);
  return { vars, evento };
}

const RE_VAR = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

export function aplicarVars(prompt: string, vars: Dicionario): string {
  return prompt.replace(RE_VAR, (_, chave: string) =>
    chave in vars ? vars[chave] : `[VARIÁVEL DESCONHECIDA: ${chave}]`,
  );
}

/** Quais variaveis um prompt usa — pra tela mostrar o que esta faltando. */
export function variaveisDe(prompt: string): string[] {
  return Array.from(new Set(Array.from(prompt.matchAll(RE_VAR)).map((m) => m[1])));
}

export async function renderizarPrompt(prompt: string): Promise<string> {
  const { vars } = await contextoDeVariaveis();
  return aplicarVars(prompt, vars);
}

/**
 * Whitelist completa do guarda: a tabela de ofertas + os links do ciclo do
 * evento (sala, grupo, brinde, inscricao) que o Setting define.
 */
export async function autorizadoCompleto(): Promise<Autorizado> {
  const base = autorizadoGeral();
  const evento = await lerEvento();
  return {
    links: [...base.links, ...linksDoEvento(evento)],
    precos: [...base.precos, ...precosDoEvento(evento)],
  };
}
