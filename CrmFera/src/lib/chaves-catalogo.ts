/**
 * Catálogo das chaves que o sistema usa. É a fonte única: a tela Chaves, a Jornada e o
 * FERABOT na máquina do dono leem daqui. `env` é o nome que os scripts do FERABOT esperam.
 */
export type GrupoChave = "primeiro-dia" | "anuncios" | "publicar" | "agenda-youtube" | "midia" | "pesquisa" | "vendas";

export type ChaveDoCatalogo = {
  env: string;
  nome: string;
  grupo: GrupoChave;
  /** o que passa a funcionar quando ela entra */
  libera: string;
  /** como reconhecer a chave certa e quanto custa */
  dica: string;
  /** onde o dono clica para pegar */
  onde?: string;
  passos: string[];
};

export const GRUPOS: { id: GrupoChave; titulo: string; quando: string }[] = [
  { id: "primeiro-dia", titulo: "Primeiro dia", quando: "As duas são grátis. Com elas você já gera imagem e publica página." },
  { id: "anuncios", titulo: "Anúncios", quando: "Na hora de subir a primeira campanha." },
  { id: "publicar", titulo: "Publicação nas redes", quando: "Quando quiser agendar posts e automatizar o Direct." },
  { id: "agenda-youtube", titulo: "Agenda e YouTube", quando: "Quando a reunião tiver que virar evento ou o vídeo subir pelo FERABOT. São as chaves mais chatas: deixe o FERABOT fazer pelo Chrome com a extensão do Claude." },
  { id: "midia", titulo: "Voz, imagem e vídeo", quando: "Opcional. Só se a versão grátis não bastar." },
  { id: "pesquisa", titulo: "Pesquisa de concorrentes", quando: "Opcional. Para espiar anúncio e perfil de quem já vende." },
  { id: "vendas", titulo: "Checkout e e-mail", quando: "Quando for vender com link de pagamento ou enviar e-mail." },
];

export const CATALOGO: ChaveDoCatalogo[] = [
  {
    env: "GEMINI_API_KEY",
    nome: "Gemini (Google AI Studio)",
    grupo: "primeiro-dia",
    libera: "As imagens dos posts e anúncios e a inteligência dos robôs do WhatsApp.",
    dica: "Começa com AIzaSy. Grátis.",
    onde: "https://aistudio.google.com/apikey",
    passos: ["Entre com a sua conta Google.", "Clique em Criar chave de API.", "Copie a chave e cole aqui."],
  },
  {
    env: "NETLIFY_AUTH_TOKEN",
    nome: "Netlify",
    grupo: "primeiro-dia",
    libera: "Colocar página e quiz no ar com um comando.",
    dica: "Personal access token. Conta grátis.",
    onde: "https://app.netlify.com/user/applications#personal-access-tokens",
    passos: [
      "Crie a conta grátis na Netlify.",
      "Em User settings, Applications, clique em New access token.",
      "Dê um nome, escolha a validade mais longa e copie o token.",
    ],
  },
  {
    env: "META_ACCESS_TOKEN",
    nome: "Meta: token único (usuário do sistema)",
    grupo: "anuncios",
    libera:
      "Um token só para tudo da Meta: subir e acompanhar anúncio, publicar no Facebook e no Instagram, responder comentário e Direct. Toda campanha nasce pausada.",
    dica: "Token do usuário do sistema, validade Nunca. O guia completo está no Guia de prompts, em Como pegar cada chave.",
    onde: "https://developers.facebook.com/apps",
    passos: [
      "Crie o app da Meta (tipo Empresa) no seu portfólio, com os casos de uso de anúncios, Página e Instagram (passo a passo no Guia de prompts).",
      "Em business.facebook.com/settings, crie o usuário do sistema FERABOT (Administrador).",
      "Atribua a ele: o app (controle total), a conta de anúncios, a Página, a conta do Instagram e o pixel.",
      "Gere o token com o seu app, validade Nunca e todas as permissões da lista do guia.",
      "Cole aqui e aperte Salvar e testar. O painel acha sozinho a sua conta do Instagram.",
      "São muitas telas da Meta: se preferir, peça no chat /fera cria o meu app e o token da Meta usando a extensão do Claude no Chrome.",
    ],
  },
  {
    env: "META_AD_ACCOUNT_ID",
    nome: "Meta Ads: conta de anúncio",
    grupo: "anuncios",
    libera: "Diz em qual conta as campanhas entram. Faz par com o token.",
    dica: "Formato act_123456789.",
    onde: "https://business.facebook.com/settings/ad-accounts",
    passos: ["Abra Contas de anúncios.", "Copie o número da conta e escreva act_ na frente."],
  },
  {
    env: "POSTFORME_API_KEY",
    nome: "Post for Me",
    grupo: "publicar",
    libera: "Agendar carrossel, reel e story para saírem sozinhos no dia e hora marcados.",
    dica: "Serviço pago, plano barato.",
    onde: "https://postforme.dev",
    passos: ["Crie a conta e conecte o seu Instagram.", "No painel, gere a chave de API e cole aqui."],
  },
  {
    env: "IG_USER_ID",
    nome: "Instagram: id da conta",
    grupo: "anuncios",
    libera: "Diz qual conta do Instagram o token do Meta usa para publicar e responder o Direct.",
    dica: "O painel preenche sozinho quando o token do Meta passa no teste. Só cole à mão se ele achar mais de uma conta.",
    passos: [
      "Salve o token do Meta primeiro. Se o Instagram estiver ligado à Página e atribuído ao usuário do sistema, este campo se preenche sozinho.",
      "Achou mais de uma conta? O aviso do token mostra os ids: cole aqui o da sua.",
    ],
  },
  {
    env: "YT_CLIENT_ID",
    nome: "Google: Client ID",
    grupo: "agenda-youtube",
    libera: "Base do YouTube e do Google Agenda.",
    dica: "Termina com .apps.googleusercontent.com.",
    onde: "https://console.cloud.google.com/apis/credentials",
    passos: [
      "É a chave mais chata: são várias telas no Google Cloud (projeto, APIs do YouTube e da Agenda, tela de consentimento, credencial).",
      "Peça no chat: /fera cria o meu projeto do Google (YouTube e Agenda) usando a extensão do Claude no Chrome.",
      "Ele abre o Google Cloud no seu Chrome e faz os cliques. Você só entra na sua conta e confirma quando ele pedir.",
      "No fim ele te mostra o Client ID e o Client Secret para colar aqui.",
    ],
  },
  {
    env: "YT_CLIENT_SECRET",
    nome: "Google: Client Secret",
    grupo: "agenda-youtube",
    libera: "Faz par com o Client ID.",
    dica: "Começa com GOCSPX-.",
    passos: ["Sai da mesma tela do Client ID."],
  },
  {
    env: "YT_REFRESH_TOKEN",
    nome: "YouTube: autorização",
    grupo: "agenda-youtube",
    libera: "Subir vídeo no seu canal. Sobe como não listado.",
    dica: "Começa com 1//.",
    passos: [
      "Depois do Client ID e do Secret: peça no chat /fera autoriza o meu canal do YouTube.",
      "Ele abre a tela de autorização do Google no Chrome (com a extensão do Claude, se você quiser que ele clique). Você escolhe a conta do canal e aceita.",
      "Ele te entrega o valor que começa com 1// para colar aqui.",
    ],
  },
  {
    env: "GCAL_REFRESH_TOKEN",
    nome: "Google Agenda: autorização",
    grupo: "agenda-youtube",
    libera: "A reunião confirmada vira evento com link do Meet e convite para o lead.",
    dica: "Começa com 1//.",
    passos: [
      "Peça no chat: /fera autoriza a minha agenda do Google.",
      "Ele abre a autorização no Chrome (com a extensão do Claude, se você quiser que ele clique). Você escolhe a conta e aceita.",
      "Ele te entrega o valor que começa com 1// para colar aqui.",
    ],
  },
  {
    env: "ELEVENLABS_API_KEY",
    nome: "ElevenLabs",
    grupo: "midia",
    libera: "Narração em português que não parece robô.",
    dica: "Começa com sk_. O código em hexadecimal do painel é o ID, não a chave.",
    onde: "https://elevenlabs.io/app/settings/api-keys",
    passos: ["Em API Keys, crie uma chave e copie na hora (ela só aparece uma vez)."],
  },
  {
    env: "FAL_KEY",
    nome: "fal.ai",
    grupo: "midia",
    libera: "Modelos de imagem e vídeo que o Gemini não tem.",
    dica: "Formato id:segredo. Pago por uso.",
    onde: "https://fal.ai/dashboard/keys",
    passos: ["Crie a chave no painel e cole aqui."],
  },
  {
    env: "SCRAPECREATORS_API_KEY",
    nome: "ScrapeCreators",
    grupo: "pesquisa",
    libera: "Ver os anúncios que o concorrente está rodando e espiar perfis.",
    dica: "Grátis para começar, depois consome crédito por busca.",
    onde: "https://scrapecreators.com",
    passos: ["Crie a conta, copie a chave do painel e cole aqui."],
  },
  {
    env: "CAKTO_CLIENT_ID",
    nome: "Cakto: client id",
    grupo: "vendas",
    libera: "Criar produto e gerar link de checkout (Pix, cartão, boleto).",
    dica: "Em app.cakto.com.br, menu API.",
    onde: "https://app.cakto.com.br",
    passos: ["No menu API, crie uma credencial e copie o client id."],
  },
  {
    env: "CAKTO_CLIENT_SECRET",
    nome: "Cakto: client secret",
    grupo: "vendas",
    libera: "Faz par com o client id.",
    dica: "Aparece junto do client id.",
    passos: ["Sai da mesma tela do client id."],
  },
  {
    env: "RESEND_API_KEY",
    nome: "Resend",
    grupo: "vendas",
    libera: "Enviar e-mail e receber relatório automático.",
    dica: "Começa com re_.",
    onde: "https://resend.com/api-keys",
    passos: ["Crie a conta, gere a chave e cole aqui."],
  },
];

const POR_ENV = new Map(CATALOGO.map((c) => [c.env, c]));

export function chaveDoCatalogo(env: string): ChaveDoCatalogo | undefined {
  return POR_ENV.get(env);
}

/** As que a Jornada exige em cada passo. */
export const CHAVES_PRIMEIRO_DIA = ["GEMINI_API_KEY", "NETLIFY_AUTH_TOKEN"] as const;
export const CHAVES_ANUNCIOS = ["META_ACCESS_TOKEN", "META_AD_ACCOUNT_ID"] as const;
