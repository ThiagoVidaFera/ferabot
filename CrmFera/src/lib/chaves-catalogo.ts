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
  { id: "agenda-youtube", titulo: "Agenda e YouTube", quando: "Quando a reunião tiver que virar evento ou o vídeo subir sozinho." },
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
    nome: "Meta Ads: token",
    grupo: "anuncios",
    libera: "Subir e acompanhar campanha direto da conversa. Toda campanha nasce pausada.",
    dica: "Token de usuário do sistema, sem validade.",
    onde: "https://business.facebook.com/settings/system-users",
    passos: [
      "No Gerenciador de Negócios, crie um usuário do sistema (Admin).",
      "Dê a ele acesso à conta de anúncios, à Página e ao pixel.",
      "Gere o token com as permissões ads_management, ads_read e business_management.",
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
    grupo: "publicar",
    libera: "Comentário que vira Direct automático. Faz par com o token do Instagram.",
    dica: "Número da conta profissional do Instagram.",
    passos: ["Peça no chat: /fera me ajuda a pegar o id e o token do meu Instagram."],
  },
  {
    env: "IG_ACCESS_TOKEN",
    nome: "Instagram: token",
    grupo: "publicar",
    libera: "Faz par com o id da conta.",
    dica: "Token do app da Meta.",
    passos: ["Sai do mesmo passo a passo do id da conta."],
  },
  {
    env: "YT_CLIENT_ID",
    nome: "Google: Client ID",
    grupo: "agenda-youtube",
    libera: "Base do YouTube e do Google Agenda.",
    dica: "Termina com .apps.googleusercontent.com.",
    onde: "https://console.cloud.google.com/apis/credentials",
    passos: ["Peça no chat: /fera me guia para criar o projeto do Google (YouTube e Agenda)."],
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
    passos: ["O FERABOT gera esse valor quando você autoriza o canal pelo chat."],
  },
  {
    env: "GCAL_REFRESH_TOKEN",
    nome: "Google Agenda: autorização",
    grupo: "agenda-youtube",
    libera: "A reunião confirmada vira evento com link do Meet e convite para o lead.",
    dica: "Começa com 1//.",
    passos: ["O FERABOT gera esse valor quando você autoriza a agenda pelo chat."],
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
