import fs from "node:fs";
import path from "node:path";

/**
 * NEGÓCIO — a fonte única de identidade do CRM (quem é o dono, o que vende, por quanto, links).
 *
 * Tudo o que antes era texto fixo do negócio original mora aqui. O arquivo é `negocio.json`
 * na raiz do CrmFera (ou no caminho de `NEGOCIO_JSON`). O FERABOT gera esse arquivo a partir do
 * `perfil.json` da cliente (`python ScriptsFera/crm.py negocio`). Sem arquivo, vale o exemplo,
 * e a tela de Configurações avisa que está usando dados de exemplo.
 *
 * Este módulo NÃO importa nada do app (db/ia/next): o seed roda via tsx e importa por caminho relativo.
 */

export type OfertaNegocio = {
  /** sufixo das tags de produto: interesse-<slug>, quente-<slug>, comprou-<slug> */
  slug: string;
  nome: string;
  paraQuem: string;
  /** frase exata de preço/condição que o agente repete */
  comoFalar: string;
  precoAVista: string;
  parcelamento: string;
  /** página que vende (nunca o checkout cru) */
  link: string;
  /** `checkout` fecha sozinho; `call` exige reunião com o dono */
  fecha: "checkout" | "call";
  garantia: string;
  garantiaCurta: string;
  acesso: string;
  posicionamento: string;
  transformacao: string;
  entregas: string[];
  bonus: Array<{ nome: string; valor: string }>;
  urgenciaReal: string;
  naoDizer: string[];
};

export type Negocio = {
  /** nome que aparece no topo do CRM e nas mensagens */
  nome: string;
  dono: {
    nome: string;
    /** primeiro nome, como o lead chama ("a Ana", "o Pedro") */
    primeiroNome: string;
    instagram: string;
    /** WhatsApp do dono, só dígitos com 55: recebe os avisos de lead */
    whatsapp: string;
    email: string;
  };
  /** como o assistente se apresenta quando precisa ("assistente da Ana") */
  assistente: { apresentacao: string };
  nicho: string;
  publico: string;
  /** a promessa em uma frase, na voz do dono */
  promessa: string;
  /** o que o lead precisa responder para ser qualificado */
  qualificacao: string[];
  links: {
    agendamento: string;
    suporte: string;
    proposta: string;
    isca: string;
    grupo: string;
  };
  reuniao: { duracaoMin: number; formato: string };
  ofertas: OfertaNegocio[];
  /** produto de entrada (opcional): slug vazio = não existe */
  entrada: { slug: string; nome: string; preco: string; link: string; garantia: string };
  /** valores numéricos que o agente pode citar ao qualificar (faixas de faturamento etc.) */
  valoresDeQualificacao: string[];
  fusoHorario: string;
  janela: { inicio: number; fim: number; diasSemana: number[] };
};

export const NEGOCIO_EXEMPLO: Negocio = {
  nome: "Meu Negócio",
  dono: {
    nome: "Seu Nome",
    primeiroNome: "Seu Nome",
    instagram: "@seuperfil",
    whatsapp: "5511999999999",
    email: "voce@exemplo.com",
  },
  assistente: { apresentacao: "da equipe de Seu Nome" },
  nicho: "o seu nicho",
  publico: "quem compra de você",
  promessa: "o resultado que você entrega",
  qualificacao: ["o que a pessoa faz", "o que ela quer resolver", "o que já tentou"],
  links: {
    agendamento: "https://exemplo.com/agendar",
    suporte: "https://wa.me/5511999999999",
    proposta: "",
    isca: "",
    grupo: "",
  },
  reuniao: { duracaoMin: 20, formato: "Google Meet" },
  ofertas: [
    {
      slug: "principal",
      nome: "Seu serviço principal",
      paraQuem: "quem precisa do seu serviço",
      comoFalar: "R$ 2.000 à vista ou 10x de R$ 230 no cartão",
      precoAVista: "R$ 2.000 à vista",
      parcelamento: "10x de R$ 230 no cartão",
      link: "https://exemplo.com/oferta",
      fecha: "call",
      garantia: "",
      garantiaCurta: "",
      acesso: "",
      posicionamento: "",
      transformacao: "",
      entregas: ["entrega 1", "entrega 2"],
      bonus: [],
      urgenciaReal: "",
      naoDizer: [],
    },
  ],
  entrada: { slug: "", nome: "", preco: "", link: "", garantia: "" },
  valoresDeQualificacao: [],
  fusoHorario: "America/Sao_Paulo",
  janela: { inicio: 9, fim: 19, diasSemana: [1, 2, 3, 4, 5, 6] },
};

function caminho(): string {
  return process.env.NEGOCIO_JSON || path.join(process.cwd(), "negocio.json");
}

function mesclar(base: Negocio, dado: Partial<Negocio>): Negocio {
  return {
    ...base,
    ...dado,
    dono: { ...base.dono, ...(dado.dono ?? {}) },
    assistente: { ...base.assistente, ...(dado.assistente ?? {}) },
    links: { ...base.links, ...(dado.links ?? {}) },
    reuniao: { ...base.reuniao, ...(dado.reuniao ?? {}) },
    entrada: { ...base.entrada, ...(dado.entrada ?? {}) },
    janela: { ...base.janela, ...(dado.janela ?? {}) },
    ofertas: dado.ofertas?.length ? dado.ofertas : base.ofertas,
  };
}

let cache: { negocio: Negocio; exemplo: boolean } | null = null;

function carregar(): { negocio: Negocio; exemplo: boolean } {
  if (cache) return cache;
  const arquivo = caminho();
  try {
    const dado = JSON.parse(fs.readFileSync(arquivo, "utf8")) as Partial<Negocio>;
    cache = { negocio: mesclar(NEGOCIO_EXEMPLO, dado), exemplo: false };
  } catch (erro) {
    const semArquivo = (erro as NodeJS.ErrnoException)?.code === "ENOENT";
    if (!semArquivo) console.error(`[negocio] ${arquivo} ilegível, usando o exemplo:`, erro);
    cache = { negocio: NEGOCIO_EXEMPLO, exemplo: true };
  }
  return cache;
}

/** A identidade do negócio (lida uma vez por processo). */
export function negocio(): Negocio {
  return carregar().negocio;
}

/** true quando não existe `negocio.json`: a tela de Configurações mostra o aviso. */
export function usandoExemplo(): boolean {
  return carregar().exemplo;
}

/** Só para testes. */
export function _definirNegocioParaTeste(n: Negocio | null): void {
  cache = n ? { negocio: n, exemplo: false } : null;
}
