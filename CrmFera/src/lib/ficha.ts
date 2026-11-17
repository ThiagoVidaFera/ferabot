import { db } from "@/lib/db";
import { normalizarTelefone } from "@/lib/telefone";

/**
 * Ficha do lead — a tela que o dono (ou a equipe) abre pelo aviso no WhatsApp.
 *
 * O link e um CODIGO curto, nao o id do lead: o aviso sai pelo CallMeBot, que
 * corta em ~750 caracteres e agrupa envios. Id de lead vira URL de 100
 * caracteres; o codigo de 7 deixa em ~38. E o codigo nao carrega dado nenhum —
 * quem ve a URL nao descobre telefone nem funil antes de abrir.
 *
 * Sem senha, de proposito: quem atende abre pelo celular num toque. A protecao e
 * o codigo ser aleatorio (~35 bits com o alfabeto abaixo, sorteado num espaco
 * que ninguem enumera) e nunca aparecer em lugar publico.
 */

export const VALIDADE_DIAS = 30;

// sem 0/O/1/l/I: codigo pode precisar ser ditado no telefone
const ALFABETO = "23456789abcdefghijkmnpqrstuvwxyz";

function codigoNovo(n = 7): string {
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  let s = "";
  for (let i = 0; i < n; i++) s += ALFABETO[bytes[i] % ALFABETO.length];
  return s;
}

export type DadosLead = Record<string, unknown>;

/**
 * Cria a ficha e devolve a URL curta. `dados` e o snapshot do lead como quem
 * avisa recebeu — quanto mais cru, melhor: e o unico registro do que a pessoa
 * respondeu naquele dia.
 */
export async function criarFicha(
  dados: DadosLead,
  base: string,
): Promise<{ code: string; url: string; expiraEm: Date }> {
  const telefone = normalizarTelefone(
    String(dados.telefone ?? dados.whatsapp ?? "") || null,
  );
  const contato = telefone ? await db.contact.findFirst({ where: { phone: telefone } }) : null;

  const expiraEm = new Date(Date.now() + VALIDADE_DIAS * 86400000);
  // colisao de codigo e improvavel, mas o @id nao perdoa: tenta de novo
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const code = codigoNovo();
    try {
      await db.ficha.create({
        data: { code, contactId: contato?.id ?? null, dados: dados as never, expiraEm },
      });
      return { code, url: `${base.replace(/\/$/, "")}/f/${code}`, expiraEm };
    } catch {
      // codigo repetido — sorteia outro
    }
  }
  throw new Error("nao consegui gerar codigo de ficha");
}

/* ── De onde veio ───────────────────────────────────────────────────────────
   Quem atende abre a ficha pra decidir o que falar. A primeira coisa que ele
   precisa e lembrar POR QUE essa pessoa esta falando com ele — o nome tecnico
   do funil ("quiz_v2") nao conta isso. Aqui vira frase. */
const ORIGEM: Record<string, { titulo: string; frase: string }> = {
  ctwa: {
    titulo: "Anúncio no WhatsApp (CTWA)",
    frase:
      "Clicou num anúncio do Instagram/Facebook que abre a conversa no WhatsApp " +
      "e mandou a primeira mensagem. É lead pago — o clique custou dinheiro.",
  },
  ...origensConfiguradas(),
};

/**
 * Frases das origens do negócio (env ORIGENS_FICHA_JSON):
 *   {"quiz-da-mentoria": {"titulo": "Quiz da mentoria", "frase": "Respondeu o quiz e deixou o contato."}}
 * A chave é o nome do funil em minúsculas, como chega no lead.
 */
function origensConfiguradas(): Record<string, { titulo: string; frase: string }> {
  try {
    const bruto = JSON.parse(process.env.ORIGENS_FICHA_JSON || "{}") as Record<string, { titulo?: string; frase?: string }>;
    return Object.fromEntries(
      Object.entries(bruto)
        .filter(([, v]) => v?.titulo)
        .map(([k, v]) => [k.toLowerCase(), { titulo: String(v.titulo), frase: String(v.frase ?? "") }]),
    );
  } catch {
    return {};
  }
}

export function origemDoLead(l: DadosLead): { titulo: string; frase: string } {
  for (const campo of ["funil", "fonte_origem", "fonte", "form_id", "origem"]) {
    const k = String(l[campo] ?? "").trim().toLowerCase();
    if (ORIGEM[k]) return ORIGEM[k];
  }
  const nome = String(l.funil ?? l.fonte_origem ?? l.fonte ?? "").trim();
  return { titulo: nome || "Origem não identificada", frase: "" };
}

/* ── As respostas ──────────────────────────────────────────────────────────
   Cada funil guarda de um jeito. Em vez de um parser por funil, varremos o
   registro e mostramos tudo que for resposta de gente: `respostas_texto`
   (pergunta -> opcao escolhida, o formato bom), `respostas` (as abertas) e os
   campos soltos conhecidos. Chave desconhecida aparece crua — melhor mostrar
   feio do que esconder uma resposta que quem atende precisava ler. */
const ROTULO: Record<string, string> = {
  profissao: "Profissão hoje",
  objetivo: "Profissão / objetivo",
  tarefa: "Tarefas que queria tirar da mesa",
  visao: "O que já vê que dá pra fazer com IA e não faz",
  segmento: "Como se descreve",
  perfil: "Perfil calculado",
  score: "Score de qualificação",
  faixa: "Faixa",
  gargalo: "Gargalo",
  faturamento: "Faturamento",
  oferta: "Oferta que pediu",
  livre: "Resposta livre",
};

const SEGMENTO: Record<string, string> = {
  empresario: "Tem empresa com equipe e depende demais de gente",
  mentor: "Autônomo, mentor ou consultor sem equipe — faz tudo sozinho",
  mentor_pronto: "Mentor/consultor pronto pra implementar",
  colaborador: "CLT ou servidor — quer usar IA pra ser melhor no trabalho",
  frio: "Ainda definindo o próprio caminho",
};

// Infraestrutura do registro: nunca e resposta do lead.
const IGNORAR = new Set([
  "nome", "email", "telefone", "whatsapp", "instagram", "funil", "funil_cor",
  "fonte", "fonte_cor", "fonte_emoji", "form_id", "ad", "id", "_id", "origem",
  "_ingested_at", "origem_url", "dataISO", "respostas", "respostas_texto",
  "abertura", "abertura_ok", "temp", "temp_emoji", "temp_label", "chips",
  "criado_rel", "criado_local", "created_time", "numero_suspeito", "primeiro_nome",
  "whatsapp_url", "fonte_origem", "event_id", "fbp", "fbc", "contexto_aviso",
  // o CTWA aparece no bloco "De onde ele veio", nao como resposta do lead
  "ctwa_ad_id", "ctwa_clid", "ctwa_headline", "ctwa_url", "ctwa_tipo", "ctwa_em",
  // score ja aparece como marcador no bloco de origem — repetir aqui embaixo
  // faz quem atende ler duas vezes a mesma coisa procurando diferenca
  "score",
]);

export type ParPerguntaResposta = { pergunta: string; resposta: string };

function texto(v: unknown): string {
  const s = String(v ?? "").trim();
  return SEGMENTO[s.toLowerCase()] ?? s;
}

export function coletarRespostas(l: DadosLead): ParPerguntaResposta[] {
  const itens: ParPerguntaResposta[] = [];

  const rt = l.respostas_texto;
  if (rt && typeof rt === "object") {
    for (const [k, v] of Object.entries(rt as Record<string, unknown>)) {
      // pergunta de multipla escolha chega como lista
      if (Array.isArray(v)) {
        const juntas = v.map((x) => String(x ?? "").trim()).filter(Boolean).join(" · ");
        if (juntas) itens.push({ pergunta: ROTULO[k] ?? k, resposta: juntas });
      } else if (v && typeof v === "object") {
        const o = v as { pergunta?: string; resposta?: unknown };
        // resposta de multipla escolha tambem chega como lista dentro do par
        const resposta = Array.isArray(o.resposta)
          ? o.resposta.map((x) => String(x ?? "").trim()).filter(Boolean).join(" · ")
          : String(o.resposta ?? "").trim();
        if (resposta) itens.push({ pergunta: o.pergunta || k, resposta });
      } else if (String(v ?? "").trim()) {
        itens.push({ pergunta: ROTULO[k] ?? k, resposta: String(v) });
      }
    }
  }

  const r = l.respostas;
  if (r && typeof r === "object") {
    for (const [k, v] of Object.entries(r as Record<string, unknown>)) {
      if (v && typeof v === "object") {
        for (const [k2, v2] of Object.entries(v as Record<string, unknown>)) {
          if (String(v2 ?? "").trim()) itens.push({ pergunta: ROTULO[k2] ?? k2, resposta: texto(v2) });
        }
      } else if (String(v ?? "").trim()) {
        itens.push({ pergunta: ROTULO[k] ?? k, resposta: texto(v) });
      }
    }
  }

  for (const [k, v] of Object.entries(l)) {
    if (IGNORAR.has(k) || v == null || typeof v === "object") continue;
    if (String(v).trim() === "") continue;
    itens.push({ pergunta: ROTULO[k] ?? k, resposta: texto(v) });
  }

  const vistos = new Set<string>();
  return itens.filter((i) => {
    const chave = i.pergunta.toLowerCase();
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });
}

/** "@fulano", "fulano" ou "instagram.com/fulano" -> "fulano". */
export function handleInstagram(bruto: unknown): string {
  const s = String(bruto ?? "").trim();
  if (!s) return "";
  const m = s.match(/(?:instagram\.com\/)?@?([A-Za-z0-9._]{1,40})\/?$/);
  return m ? m[1] : "";
}

export function apenasDigitos(v: unknown): string {
  return String(v ?? "").replace(/\D/g, "");
}
