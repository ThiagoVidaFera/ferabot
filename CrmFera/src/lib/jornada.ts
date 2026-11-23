import { CHAVES_ANUNCIOS, CHAVES_PRIMEIRO_DIA } from "@/lib/chaves-catalogo";

/**
 * A Jornada: os 7 passos do dono depois de receber o painel, em DUAS TRILHAS que andam juntas:
 * conteúdo (narrativa, YouTube, posts: a parte dele, gravar e aparecer) e técnica (chaves, página,
 * WhatsApp, anúncio: o FERABOT ou a equipe montam). Assim o servidor travado não segura o vídeo.
 * Cada item se marca pelo estado real (chave testada, marco avisado, lead que chegou), nunca por
 * caixinha clicada. Regras puras: quem lê o banco é `jornada-estado.ts`.
 */
export const MARCOS = [
  "narrativa",
  "pagina",
  "canal_youtube",
  "video_youtube",
  "criativos",
  "posts",
  "campanha",
  // só valem quando a equipe monta a parte técnica (painel em modo "equipe")
  "whatsapp",
  "lead_real",
] as const;
export type Marco = (typeof MARCOS)[number];

export type RegistroMarco = { em: string; link?: string; resumo?: string };

export type EstadoJornada = {
  ferabotConectado: boolean;
  chavesFuncionando: string[];
  marcos: Partial<Record<Marco, RegistroMarco>>;
  totalLeads: number;
  /** WhatsApp do dono, que roda num servidor dele (ou na API oficial da Meta) */
  whatsapp: { servidor: boolean; conectado: boolean };
  /** o dono aprovou o plano (big idea e mecanismo) entregue no onboarding */
  planoAprovado: boolean;
  /** leads que vieram de anúncio ou do YouTube (com UTM): o lead de teste não conta */
  leadsReais: number;
  /** a equipe do Thiago monta a trilha técnica; o dono só cuida do conteúdo */
  equipeFazTecnica?: boolean;
  /** o plano (big idea, roteiros, posts) já está no painel */
  planoEntregue?: boolean;
  /** o dono respondeu as 7 perguntas do briefing do negócio, com as palavras dele */
  briefingRespondido?: boolean;
};

export type Trilha = "tecnica" | "conteudo";
export const NOME_DA_TRILHA: Record<Trilha, string> = { tecnica: "Trilha técnica", conteudo: "Trilha de conteúdo" };

export type ItemJornada = { texto: string; feito: boolean; link?: string; detalhe?: string };

export type PassoJornada = {
  numero: number;
  id: "chaves" | "narrativa" | "pagina" | "whatsapp" | "youtube" | "conteudo" | "anuncios";
  trilha: Trilha;
  /** quem põe a mão neste passo, para a tela dizer com clareza */
  quemFaz: "voce" | "equipe";
  titulo: string;
  porque: string;
  itens: ItemJornada[];
  /** o que colar no Claude Code para andar este passo (vazio quando não há FERABOT no caminho) */
  prompt: string;
  /** tela do painel onde o passo se resolve, quando existe */
  tela?: { href: string; rotulo: string };
  feito: boolean;
  /** é o passo da vez na trilha dele */
  atual: boolean;
};

export type Jornada = {
  passos: PassoJornada[];
  feitos: number;
  total: number;
  concluida: boolean;
  /** o primeiro passo que falta, na ordem dos números (compatível com o FERABOT antigo) */
  atual: PassoJornada | null;
  /** o passo da vez em cada trilha */
  atuais: Record<Trilha, PassoJornada | null>;
};

function temTodas(estado: EstadoJornada, chaves: readonly string[]): boolean {
  return chaves.every((c) => estado.chavesFuncionando.includes(c));
}

function itemDeMarco(estado: EstadoJornada, marco: Marco, texto: string): ItemJornada {
  const registro = estado.marcos[marco];
  return { texto, feito: Boolean(registro), link: registro?.link, detalhe: registro?.resumo };
}

type PassoBase = Omit<PassoJornada, "feito" | "atual" | "numero" | "quemFaz">;
type PassoComDono = Omit<PassoJornada, "feito" | "atual" | "numero">;

/**
 * Painel em modo "equipe": a trilha técnica é feita pela equipe do Thiago (os itens fecham pelos
 * marcos que a equipe registra) e nenhum passo pede o FERABOT. O conteúdo continua com o dono,
 * pelos botões do painel (Aprovei, Gravei, Publiquei).
 */
function passoComEquipe(p: PassoBase, estado: EstadoJornada): PassoComDono {
  const semPrompt = { ...p, prompt: "" };
  switch (p.id) {
    case "chaves":
      return {
        ...semPrompt,
        quemFaz: "equipe",
        titulo: "Painel pronto e plano entregue",
        porque: "A equipe criou o seu painel e colocou aqui o seu plano: a sua ideia central, o método, os roteiros e os posts.",
        itens: [{ texto: "Painel criado e plano entregue pela equipe", feito: Boolean(estado.planoEntregue) }],
        tela: { href: "/configuracoes#plano", rotulo: "Ver meu plano" },
      };
    case "pagina":
      return { ...semPrompt, quemFaz: "equipe", itens: [itemDeMarco(estado, "pagina", "Página publicada pela equipe")] };
    case "whatsapp":
      return {
        ...semPrompt,
        quemFaz: "equipe",
        itens: [
          {
            ...itemDeMarco(estado, "whatsapp", "Conversa no WhatsApp ligada pela equipe"),
            feito: Boolean(estado.marcos.whatsapp) || estado.whatsapp.conectado,
          },
        ],
        tela: undefined,
      };
    case "anuncios":
      return {
        ...semPrompt,
        quemFaz: "equipe",
        porque: "É o que traz gente nova todo dia. A equipe monta, acompanha e ajusta. A verba é sua e vai direto para a plataforma.",
        itens: [
          itemDeMarco(estado, "campanha", "Campanha no ar, montada pela equipe"),
          {
            ...itemDeMarco(estado, "lead_real", "Primeira pessoa de verdade chegou pelo anúncio ou pelo YouTube"),
            feito: Boolean(estado.marcos.lead_real) || estado.leadsReais > 0,
          },
        ],
        tela: { href: "/leads", rotulo: "Ver quem chegou" },
      };
    case "youtube":
      return {
        ...semPrompt,
        quemFaz: "voce",
        itens: [
          itemDeMarco(estado, "canal_youtube", "Canal arrumado pela equipe (nome, descrição, capa)"),
          itemDeMarco(estado, "video_youtube", "Você gravou e publicou o primeiro vídeo do seu plano"),
        ],
      };
    case "conteudo":
      return {
        ...semPrompt,
        quemFaz: "voce",
        itens: [
          itemDeMarco(estado, "criativos", "Criativos da campanha prontos (a equipe faz)"),
          itemDeMarco(estado, "posts", "Você publicou os primeiros posts do seu plano"),
        ],
      };
    default:
      return { ...semPrompt, quemFaz: "voce" };
  }
}

/** Narrativa vale quando o FERABOT registrou o marco OU o dono aprovou o plano entregue no onboarding. */
function itemNarrativa(estado: EstadoJornada): ItemJornada {
  const marco = itemDeMarco(estado, "narrativa", "Narrativa, bandeira e mecanismo único aprovados por você");
  return estado.planoAprovado ? { ...marco, feito: true } : marco;
}

export function montarJornada(estado: EstadoJornada): Jornada {
  const base: Omit<PassoJornada, "feito" | "atual" | "numero" | "quemFaz">[] = [
    {
      id: "chaves",
      trilha: "tecnica",
      titulo: "Ligar o FERABOT e as duas chaves grátis",
      porque: "Sem isso o FERABOT só dá conselho. Com isso ele gera imagem e publica página no seu nome.",
      itens: [
        { texto: "FERABOT do seu computador conectado a este painel", feito: estado.ferabotConectado },
        { texto: "Chave do Gemini funcionando", feito: estado.chavesFuncionando.includes(CHAVES_PRIMEIRO_DIA[0]) },
        { texto: "Chave da Netlify funcionando", feito: estado.chavesFuncionando.includes(CHAVES_PRIMEIRO_DIA[1]) },
      ],
      prompt: "/fera conecta o meu FERABOT ao painel",
      tela: { href: "/chaves", rotulo: "Abrir Chaves" },
    },
    {
      id: "narrativa",
      trilha: "conteudo",
      titulo: "Briefing do negócio e narrativa",
      porque:
        "Você conta o seu negócio com as suas palavras e aprova a sua narrativa. É disso que nascem a primeira página e os primeiros posts.",
      itens: [
        { texto: "Briefing do negócio respondido com as suas palavras (7 perguntas)", feito: Boolean(estado.briefingRespondido) },
        itemNarrativa(estado),
      ],
      prompt: "/fera vamos refinar a minha narrativa e o meu mecanismo único",
      tela: { href: "/briefing", rotulo: "Responder o briefing" },
    },
    {
      id: "pagina",
      trilha: "tecnica",
      titulo: "Página de captura no ar",
      porque: "O lead deixa nome e WhatsApp, cai aqui no painel e já é levado para a conversa com você.",
      itens: [
        itemDeMarco(estado, "pagina", "Página publicada com endereço próprio"),
        { texto: "Lead de teste chegou no painel (preencha a página você mesmo)", feito: estado.totalLeads > 0 },
      ],
      prompt: "/fera monta a minha página de captura ligada ao painel e ao meu WhatsApp",
      tela: { href: "/leads", rotulo: "Ver Leads" },
    },
    {
      id: "whatsapp",
      trilha: "tecnica",
      titulo: "WhatsApp ligado ao painel",
      porque:
        "É por ele que o painel responde o lead, confirma e lembra a reunião. Roda num servidor seu: o número é seu e não divide endereço com ninguém.",
      itens: [
        { texto: "Servidor do seu WhatsApp ligado ao painel", feito: estado.whatsapp.servidor },
        { texto: "WhatsApp conectado (QR code lido)", feito: estado.whatsapp.conectado },
      ],
      prompt: "/fera monta o meu WhatsApp numa VPS minha e liga no painel",
      tela: { href: "/configuracoes", rotulo: "Abrir Configurações" },
    },
    {
      id: "youtube",
      trilha: "conteudo",
      titulo: "YouTube: canal arrumado e primeiro vídeo",
      porque:
        "O vídeo do YouTube continua trazendo lead meses depois de publicado. Quem chega pelo vídeo já chega sabendo quem você é.",
      itens: [
        itemDeMarco(estado, "canal_youtube", "Canal arrumado: nome, descrição, banner e link para falar com você"),
        itemDeMarco(estado, "video_youtube", "Primeiro vídeo publicado com o roteiro do seu plano"),
      ],
      prompt: "/fera arruma o meu canal do YouTube e me ajuda a gravar o primeiro vídeo do meu plano",
      tela: { href: "/configuracoes#youtube", rotulo: "Ver roteiros" },
    },
    {
      id: "conteudo",
      trilha: "conteudo",
      titulo: "Criativos e postagens",
      porque: "Os criativos alimentam a campanha. As postagens fazem quem clicar no seu perfil encontrar prova e clareza.",
      itens: [
        itemDeMarco(estado, "criativos", "Criativos da campanha prontos e aprovados"),
        itemDeMarco(estado, "posts", "Primeiras postagens publicadas ou agendadas"),
      ],
      prompt: "/fera cria os criativos da campanha e as postagens da semana",
      tela: { href: "/configuracoes#posts", rotulo: "Ver sugestões de posts" },
    },
    {
      id: "anuncios",
      trilha: "tecnica",
      titulo: "Anúncios no ar",
      porque: "É o que traz lead todo dia para a página. A campanha nasce pausada e você liga depois de conferir.",
      itens: [
        { texto: "Token e conta do Meta Ads funcionando", feito: temTodas(estado, CHAVES_ANUNCIOS) },
        itemDeMarco(estado, "campanha", "Campanha criada com rastreamento conferido"),
        {
          texto: "Primeiro lead real chegou (de anúncio ou do YouTube, fora o seu teste)",
          feito: estado.leadsReais > 0,
        },
      ],
      prompt: "/fera sobe a campanha no Meta Ads com os criativos aprovados",
      tela: { href: "/chaves", rotulo: "Abrir Chaves" },
    },
  ];

  const ajustados = estado.equipeFazTecnica ? base.map((p) => passoComEquipe(p, estado)) : base.map((p) => ({ ...p, quemFaz: "voce" as const }));
  const comFeito = ajustados.map((p, i) => ({ ...p, numero: i + 1, feito: p.itens.every((item) => item.feito) }));
  const primeiroQueFalta = (trilha: Trilha) => comFeito.find((p) => p.trilha === trilha && !p.feito)?.id;
  const daVez = new Set([primeiroQueFalta("tecnica"), primeiroQueFalta("conteudo")]);
  const passos = comFeito.map((p) => ({ ...p, atual: daVez.has(p.id) }));
  const feitos = passos.filter((p) => p.feito).length;
  const atualDa = (trilha: Trilha) => passos.find((p) => p.trilha === trilha && p.atual) ?? null;

  return {
    passos,
    feitos,
    total: passos.length,
    concluida: feitos === passos.length,
    atual: passos.find((p) => !p.feito) ?? null,
    atuais: { tecnica: atualDa("tecnica"), conteudo: atualDa("conteudo") },
  };
}

export function ehMarco(valor: unknown): valor is Marco {
  return typeof valor === "string" && (MARCOS as readonly string[]).includes(valor);
}
