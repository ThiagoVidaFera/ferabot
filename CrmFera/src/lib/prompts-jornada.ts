/**
 * Os prompts completos de cada passo da Jornada. O dono copia e cola no Claude Code e o FERABOT
 * tem tudo o que precisa: contexto, ordem dos passos, regras e como confirmar que terminou.
 * Escritos para quem nunca mexeu com tecnologia: o FERABOT guia clique a clique.
 */

export type IdPasso = "chaves" | "narrativa" | "pagina" | "whatsapp" | "youtube" | "conteudo" | "anuncios" | "email";

const REGRAS = `Regras para você seguir comigo o tempo todo:
- Eu não sou da área de tecnologia. Me guie um clique por vez, dizendo o nome exato do botão e onde ele fica na tela.
- Uma pergunta por vez. Espere eu responder antes de seguir.
- Antes de instalar ou mudar qualquer coisa no meu computador, me diga o que vai fazer e espere o meu ok.
- Nunca me peça senha nem chave aqui no chat. Chave de serviço eu colo na tela Chaves do meu painel.
- Se der erro, me explique em português simples o que aconteceu e o que fazer, sem colar código técnico.
- Quando o passo for cheio de cliques no navegador (criar conta, app, chave, DNS, Google Cloud, YouTube, Meta), me ofereça usar a extensão do Claude no Chrome para você assumir a tela e fazer por mim. Se eu não tiver, me ensine a instalar. Eu só entro nas minhas contas e confirmo.
- No fim, confira se funcionou de verdade e me diga qual é o próximo passo da minha Jornada.`;

const INSTALACAO = (painel: string, codigo: string) => `Quero instalar o FERABOT no meu computador e ligar ele ao meu painel. Faça nesta ordem:

1. Descubra se o meu computador é Windows ou Mac e me diga.
2. Confira se já tenho Python 3.10 ou mais novo e o Git. O que faltar, instale (no Windows pelo winget, no Mac pelo Homebrew), me avisando antes.
3. Baixe o FERABOT de https://github.com/ThiagoVidaFera/ferabot para a pasta Documentos/ferabot. Se a pasta já existir, só atualize.
4. Entre na pasta e rode o instalador (python instalar.py). Quando ele pedir dados do meu negócio, me faça as perguntas aqui na conversa, uma por vez, e preencha você mesmo.
5. Ligue o FERABOT ao meu painel com este comando, dentro da pasta ferabot:
   python ScriptsFera/painel.py conectar ${painel} ${codigo}
6. Rode python ScriptsFera/painel.py estado e me mostre, em português simples, o que já está pronto e o que falta.
7. Me ensine a abrir o FERABOT nas próximas vezes (qual pasta abrir no Claude Code) e a usar o comando /fera.
8. Depois me guie para criar as duas chaves grátis, uma de cada vez, e colar na tela Chaves do painel (${painel}/chaves):
   - Gemini (Google AI Studio): serve para criar imagens.
   - Netlify: serve para publicar as minhas páginas.
   Para cada uma: abra o site certo, me diga onde clicar para criar a chave, espere eu colar no painel e apertar Testar. Só siga quando o painel mostrar a chave funcionando.
9. Rode python ScriptsFera/painel.py sincronizar para trazer as chaves para o computador.

${REGRAS}`;

const PROMPTS: Record<Exclude<IdPasso, "chaves">, string> = {
  narrativa: `/fera Vamos fechar a minha narrativa e o meu mecanismo único, que é o passo 2 da minha Jornada.

1. Leia o meu perfil.json e o plano que já está no meu painel (python ScriptsFera/painel.py estado).
2. Me mostre a big idea, o nome do mecanismo e as headlines que estão lá, e me pergunte o que soa como eu e o que não soa.
3. Me faça as perguntas que faltam, uma por vez: para quem eu vendo, a dor que essa pessoa já sabe que tem, o que o meu mercado repete e eu discordo, o meu jeito de resolver (em 3 a 5 etapas) e a prova real que eu tenho.
4. Reescreva só o que eu pedir para mudar. Nada de número, caso ou depoimento inventado.
5. Com a minha aprovação, grave em output/fera/plano.json (bigIdea, mecanismo com nome e explicação, headlines) e mande para o painel: python ScriptsFera/painel.py plano output/fera/plano.json
6. Me peça para abrir o painel em Meu plano e apertar "Aprovei a minha narrativa".

${REGRAS}`,

  pagina: `/fera Monte a minha página de captura e ligue no meu painel. É o passo 3 da minha Jornada.

1. Leia o meu perfil.json e o meu plano (big idea, mecanismo e headlines). A página nasce disso.
2. Me pergunte, uma por vez: o que a pessoa ganha ao deixar o contato (uma conversa, uma reunião, um material), o meu número de WhatsApp com DDD e se eu tenho domínio próprio.
3. Escreva o texto da página e me mostre antes de montar. Só monte depois do meu ok.
4. A página tem: título com a minha promessa, 3 a 5 blocos curtos, formulário com nome e WhatsApp (e-mail opcional) e um botão.
5. Ao enviar o formulário, a página manda o contato para o meu painel (endereço em painel.json, rota /api/leads/entrada) e depois abre o meu WhatsApp com uma mensagem pronta. Se o painel falhar, o WhatsApp abre do mesmo jeito.
6. Publique com a minha chave da Netlify. Se eu tiver domínio, me guie para apontar o domínio, um clique por vez.
7. Me mande abrir a página no celular e preencher com o meu nome. Confira comigo que o contato apareceu em Leads no painel.
8. Registre o marco: python ScriptsFera/painel.py marco pagina --link "<endereço da página>"

${REGRAS}`,

  whatsapp: `/fera Monte o meu WhatsApp num servidor meu e ligue no meu painel. É o passo 4 da minha Jornada. Siga o guia SkillsDoFera/fera/references/whatsapp.md, começando pela Fase 1 (QR code).

1. Me explique em 3 linhas por que o WhatsApp roda num servidor meu (VPS) e quanto custa por mês.
2. Me guie para contratar a VPS (Ubuntu 22.04 ou 24.04, 2 GB de memória), um clique por vez no site do provedor. Eu não te passo senha: em vez disso,
3. gere a chave de acesso no meu computador (python ScriptsFera/whatsapp_vps.py chave-ssh) e me diga onde colar a parte pública no painel do provedor.
4. Me pergunte o IP do servidor e se eu quero usar um subdomínio meu (ex.: whatsapp.meudominio.com.br). Se sim, me guie no DNS.
5. Instale: python ScriptsFera/whatsapp_vps.py instalar --ip <IP> (com --dominio se eu tiver). Ele já liga o servidor ao meu painel.
6. Me mande abrir o painel em Meu perfil, ver o QR code e escanear com o WhatsApp do número que vai atender (WhatsApp > Aparelhos conectados > Conectar aparelho).
7. Confira com python ScriptsFera/painel.py whatsapp-estado e me peça para mandar um "oi" de outro celular. Confira comigo que a mensagem apareceu em Conversas no painel.

${REGRAS}`,

  youtube: `/fera Vamos colocar o meu YouTube para trabalhar. É o passo 5 da minha Jornada. Os roteiros estão no meu painel, em Meu plano > Roteiros do YouTube.

1. Me pergunte se eu já tenho canal. Se não, me guie para criar com o meu nome, um clique por vez.
2. Arrume o canal comigo: nome, descrição (com o link da minha página de captura), foto e capa (2560x1440, feita com a minha chave do Gemini). Use a skill /canal-youtube.
3. Registre: python ScriptsFera/painel.py marco canal_youtube --link "<link do canal>"
4. Abra o roteiro 1 do plano e me prepare para gravar: como posicionar o celular, luz de janela, som, e um ensaio rápido em voz alta comigo.
5. Depois que eu gravar, me ajude a publicar: título (o do roteiro), descrição com o link da página, capa e playlist.
6. Me lembre de marcar "Gravei" e "Publiquei" no roteiro, no painel. Isso fecha o passo.
7. Combine comigo o dia da semana do próximo vídeo.

${REGRAS}`,

  conteudo: `/fera Vamos fazer os criativos da campanha e as postagens da semana. É o passo 6 da minha Jornada.

1. Leia o meu plano no painel (big idea, headlines e Posts para o Instagram).
2. Criativos da campanha: escreva primeiro os textos de 3 anúncios que levam para a minha página de captura e me mostre. Só depois do meu ok, faça as artes com a minha chave do Gemini (1080x1350), sem texto em cima do meu rosto.
3. Aprovados os criativos: python ScriptsFera/painel.py marco criativos --resumo "<quantos e em que formato>"
4. Postagens: escolha comigo 3 posts do plano para esta semana, ajuste o texto ao meu jeito e me diga em que dia publicar cada um.
5. Me ensine a publicar no Instagram, um clique por vez, e a marcar "Publiquei este post" no painel.

${REGRAS}`,

  anuncios: `/fera Vamos subir a minha primeira campanha no Meta Ads. É o passo 7 da minha Jornada.

1. Me guie para criar (ou achar) a minha conta de anúncios e o token do Meta, um clique por vez, e colar os dois na tela Chaves do painel. Só siga quando o painel mostrar os dois funcionando.
2. Rode python ScriptsFera/painel.py sincronizar.
3. Me pergunte a verba por dia que eu topo (a verba é minha e vai direto para o Meta) e para quem é o anúncio (cidade, idade, interesse).
4. Monte a campanha com os criativos aprovados, apontando para a minha página de captura, com o rastreamento conferido antes de subir (/meta-ads-fera).
5. A campanha nasce PAUSADA. Me mostre onde conferir no Gerenciador e me deixe ligar.
6. Registre: python ScriptsFera/painel.py marco campanha --link "<link da campanha>" --resumo "<verba por dia>"
7. Me explique o que olhar nos primeiros 3 dias e quando NÃO mexer.

${REGRAS}`,

  email: `/fera Quero ligar o e-mail do meu painel pelo Resend, para o painel mandar e-mail com o meu nome.

1. Me pergunte se eu tenho domínio próprio (ex.: meunegocio.com.br) e onde ele está registrado. Sem domínio não dá para mandar e-mail com o meu nome: nesse caso, pare e me explique.
2. Me guie para criar a conta em https://resend.com (grátis até 3 mil e-mails por mês), um clique por vez.
3. Em Domains > Add Domain, me ajude a cadastrar o domínio e a copiar os registros (TXT e MX) para o lugar onde o meu domínio está registrado. Espere comigo o Resend mostrar Verified.
4. Em API Keys > Create API Key, crie uma chave com permissão de envio. Eu copio na hora (ela só aparece uma vez).
5. Me guie no painel em Meu perfil > E-mail (opcional): servidor smtp.resend.com, porta 465, conexão segura ligada, usuário resend, senha = a chave que eu copiei, remetente = um endereço do meu domínio (ex.: contato@meunegocio.com.br). Salvar.
6. Me peça para mandar um e-mail de teste e confira comigo que chegou (olhe também o spam).

${REGRAS}`,
};

export function promptCompleto(id: IdPasso, painel = "", codigo = ""): string {
  if (id === "chaves") return INSTALACAO(painel, codigo);
  return PROMPTS[id];
}

/** Primeira linha, para a tela mostrar o resumo antes de abrir o prompt inteiro. */
export function resumoDoPrompt(prompt: string): string {
  return prompt.split("\n")[0] ?? "";
}
