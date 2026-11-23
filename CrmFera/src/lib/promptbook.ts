/**
 * Guia de prompts do painel (tela /prompts). Porta o promptbook do FERABOT para quem usa o
 * sistema sozinho no Claude Code: o FERABOT abre na pasta Documentos/ferabot, chama-se com /fera
 * e toda chave entra pela tela Chaves do painel, nunca pelo chat.
 */

export interface ItemDePrompt {
  titulo: string;
  /** para que serve, em uma linha */
  para: string;
  prompt: string;
}

export interface SecaoDePrompts {
  id: string;
  titulo: string;
  resumo: string;
  itens: ItemDePrompt[];
}

export interface RegraDePedido {
  titulo: string;
  texto: string;
}

export interface TutorialDeChave {
  id: string;
  titulo: string;
  tempo: string;
  para: string;
  /** nomes das chaves na tela Chaves (mesmos `env` de chaves-catalogo.ts) */
  envs: string[];
  passos: string[];
}

export const COMO_ABRIR =
  "Abra o Claude Code na pasta Documentos/ferabot, digite /fera e cole o prompt na caixa de conversa. Um prompt por vez.";

export const REGRAS: RegraDePedido[] = [
  { titulo: "Um prompt por vez", texto: "Cole, espere ele terminar e só então cole o próximo." },
  {
    titulo: "Troque os [colchetes]",
    texto: "Tudo que está entre colchetes é seu: nome, preço, link, foto. Escreva o seu e apague os colchetes.",
  },
  { titulo: "Leia antes de aprovar", texto: "Ele mostra o texto antes da arte. A peça sai com o seu nome." },
  {
    titulo: "Prova só de verdade",
    texto: "Print, número e depoimento só se forem reais. Na dúvida, a frase sai.",
  },
];

export const MODELO_DE_PROMPT: { parte: string; pergunta: string }[] = [
  { parte: "O que eu quero", pergunta: "Qual peça ou tarefa: carrossel, página, roteiro, campanha." },
  { parte: "Para quem", pergunta: "Quem vai ver e o que essa pessoa quer resolver." },
  { parte: "Com o quê", pergunta: "O que você já tem: fotos, link, preço, assunto, pasta." },
  { parte: "Como sei que ficou bom", pergunta: "O que a pessoa tem que fazer no fim e o que você quer ver antes de aprovar." },
];

export const EXEMPLO_RUIM = "Faz um post pra mim.";

export const EXEMPLO_BOM =
  "/fera Quero um carrossel para mulheres de 30 a 45 anos que querem voltar a treinar depois da gravidez. " +
  "Usa as fotos da pasta [nome da pasta] e o link da minha página de agendamento [link]. " +
  "Ficou bom se a pessoa terminar de ler e comentar a palavra TREINO. Me mostra o texto antes da arte.";

const ANTES_DA_ARTE = "Me mostra o texto antes de montar a arte.";

export const SECOES: SecaoDePrompts[] = [
  {
    id: "base",
    titulo: "A base (uma vez só)",
    resumo: "Antes de qualquer peça, o FERABOT precisa saber quem é você, o que você vende e quanto quer faturar.",
    itens: [
      {
        titulo: "Conferir a instalação",
        para: "O Claude testa o que foi instalado, conserta o que conseguir e te mostra um resumo simples.",
        prompt:
          "/fera Acabei de instalar o FERABOT. Confere se está tudo funcionando: Python, Node, Playwright, FFmpeg e as pastas do sistema. Me responde em linguagem simples o que está ok e o que falta, e conserta o que você conseguir.",
      },
      {
        titulo: "As duas chaves grátis",
        para: "Gemini gera imagens e Netlify coloca suas páginas no ar. Leva uns 8 minutos.",
        prompt:
          "/fera Quero configurar as duas chaves grátis: Gemini e Netlify. Me guia um passo de cada vez, com o link exato de cada site. Eu vou colar cada chave na tela Chaves do painel e apertar Salvar e testar. Não me peça para colar a chave aqui no chat. No fim, confere se as duas funcionaram.",
      },
      {
        titulo: "Meu briefing",
        para: "Transforma o faturamento que você quer em número de vendas por semana.",
        prompt:
          "/fera Quero fazer meu briefing. Eu vendo [o que você vende], para [quem compra], por [preço]. Quero faturar [valor] por mês. Meu Instagram é @[seu perfil]. Me faz as perguntas que faltam, uma de cada vez, e no fim me mostra a conta de quantas vendas por semana eu preciso.",
      },
      {
        titulo: "Mapa das chaves",
        para: "Mostra o que cada chave destrava e quais ainda faltam, sem precisar fazer todas hoje.",
        prompt:
          "/fera Me mostra numa tabela simples as chaves que eu vou usar: nome, o que ela destrava, se é grátis ou paga, quanto tempo leva e se já está configurada no meu painel. Depois me guia na ordem que você recomenda, uma por vez. Eu colo cada chave na tela Chaves do painel e aperto Salvar e testar.",
      },
      {
        titulo: "O que eu estou deixando de fazer",
        para: "Serve para qualquer dia: mostra as chaves que faltam e o que elas liberariam.",
        prompt: "/fera Quais chaves eu ainda não configurei e o que eu estou deixando de fazer por causa disso?",
      },
    ],
  },
  {
    id: "funil",
    titulo: "Funil de vendas do começo ao fim",
    resumo: "Oferta clara, página de agendamento, proposta, conteúdo, posts agendados e anúncio. Siga na ordem.",
    itens: [
      {
        titulo: "Oferta numa frase",
        para: "Sem oferta clara, nenhuma página converte. Você sai com 3 versões e uma recomendada.",
        prompt:
          "/fera Antes de criar qualquer página, quero deixar minha oferta clara numa frase. Me ajuda a escrever para quem é, o que a pessoa ganha, em quanto tempo e por quanto. Me dá 3 versões e recomenda uma.",
      },
      {
        titulo: "Página de agendamento",
        para: "A primeira página do funil: o lead escolhe um horário de reunião de 20 minutos.",
        prompt:
          "/funil-reuniao-fantasma Quero minha página de reunião de 20 minutos. Meu WhatsApp é [55 + DDD + número]. Atendo [dias da semana] das [hora] às [hora]. Me faz as perguntas da página uma por vez e me mostra o texto completo antes de montar.",
      },
      {
        titulo: "Colocar a página no ar",
        para: "Publica na sua conta Netlify e testa no tamanho de celular. Precisa da chave da Netlify.",
        prompt:
          "/paginas-e-quiz Publica a página de agendamento na minha conta Netlify, me manda o link e testa no tamanho de celular o caminho inteiro: escolher horário, preencher e abrir o WhatsApp com a mensagem certa.",
      },
      {
        titulo: "Página no meu domínio",
        para: "Opcional. Domínio próprio passa mais confiança que o endereço netlify.app.",
        prompt:
          "/paginas-e-quiz Tenho o domínio [seudominio.com.br]. Coloca a página em [agenda.seudominio.com.br] e me diz exatamente o que eu preciso mudar no site onde comprei o domínio, um clique de cada vez.",
      },
      {
        titulo: "Leads do dia",
        para: "Todo dia de manhã: quem pediu para falar com você, quem está parado e o que fazer primeiro.",
        prompt:
          "/crm-de-leads Como estão meus leads hoje no painel? Quem pediu para falar comigo, quem está parado e quais reuniões eu tenho hoje? Me diz o que fazer primeiro.",
      },
      {
        titulo: "Mensagens para quem sumiu",
        para: "Três mensagens para quem parou de responder: dia 2, dia 5 e dia 9, cada uma com um motivo diferente.",
        prompt:
          "/crm-de-leads Escreve as mensagens de follow-up para quem parou de responder: dia 2, dia 5 e dia 9, cada uma com um motivo diferente para voltar a conversar, na minha voz. Sem preço e sem pressão. Me mostra as três antes de usar.",
      },
      {
        titulo: "Proposta em página",
        para: "Montada com as palavras que o próprio lead usou. O preço fica só na página, nunca na mensagem.",
        prompt:
          "/proposta-pagina A reunião do [nome do lead] foi. Na conversa ele disse: \"[cole frases que ele falou]\". O que ele quer é [objetivo dele] e o que trava é [o problema dele]. Monta a proposta em página para eu aprovar.",
      },
      {
        titulo: "Proposta em PDF",
        para: "A mesma proposta em PDF, para mandar por e-mail.",
        prompt: "/propostas Quero também a versão em PDF dessa proposta para mandar por e-mail.",
      },
      {
        titulo: "Ensaio de fotos com IA",
        para: "A partir de 3 a 6 fotos reais suas, cenas suas trabalhando para usar nos posts. Precisa da chave do Gemini.",
        prompt:
          "/ensaio-ia Quero um ensaio de fotos meu com IA para usar nos posts. Aqui estão minhas fotos [arraste de 3 a 6 fotos suas: rosto de frente, meio corpo e uma sorrindo]. Eu trabalho em [onde você atende: consultório, escritório, online], uso [a roupa que você usa com cliente] e quero um clima [sério, próximo ou premium]. Me mostra o plano das cenas antes de gerar.",
      },
      {
        titulo: "Roteiros de reel",
        para: "Cinco roteiros curtos para você gravar, respondendo às dúvidas de quem está quase comprando.",
        prompt:
          "/roteiros-e-oratoria Escreve 5 roteiros de reel de 30 a 45 segundos para eu gravar, respondendo às dúvidas que meu cliente tem antes de comprar [seu serviço]. Gancho nos 2 primeiros segundos e, no fim, chamada para comentar [PALAVRA].",
      },
      {
        titulo: "Editar o reel que eu gravei",
        para: "Corta pausas e erros, coloca legenda grande no centro e gera a capa.",
        prompt:
          "/editar-reel Gravei este vídeo [arraste o arquivo aqui]. Corta as pausas e os erros, coloca legenda grande no centro da tela e gera uma capa com o título. Me mostra antes de finalizar.",
      },
      {
        titulo: "Agendar os posts da semana",
        para: "Os posts entram na fila do Post for Me e saem no dia e hora marcados. Precisa da chave do Post for Me.",
        prompt:
          "/conteudo-e-anuncios Agenda o carrossel da pasta [nome da pasta] para [dia] às [hora], o reel [nome do arquivo] para [dia] às [hora] e os stories da pasta [nome da pasta] para [dia] a partir das [hora], um a cada 2 horas. Antes de agendar, me mostra a lista com data, hora, formato e legenda para eu aprovar.",
      },
      {
        titulo: "O que está agendado",
        para: "Lista do que vai sair nos próximos 7 dias.",
        prompt: "/conteudo-e-anuncios O que está agendado no Post for Me para os próximos 7 dias? Me mostra em lista com data, hora e formato.",
      },
      {
        titulo: "Subir a campanha",
        para: "A campanha sobe com o rastreamento conferido e nasce pausada. Precisa da chave do Meta Ads.",
        prompt:
          "/meta-ads-fera Quero subir uma campanha de R$ [20] por dia levando para a minha página de agendamento [link da página]. Usa os criativos da pasta [nome da pasta]. Roda a checagem de rastreamento antes e deixa a campanha pausada para eu revisar.",
      },
      {
        titulo: "Como estão as campanhas",
        para: "Custo por reunião agendada e o que pausar ou manter.",
        prompt:
          "/meta-ads-fera Como estão minhas campanhas nos últimos 7 dias? Quanto custou cada reunião agendada? O que eu pauso e o que eu mantenho?",
      },
      {
        titulo: "Relatório da semana",
        para: "Quanto falta para a meta, qual é o gargalo e o que fazer primeiro amanhã.",
        prompt:
          "/copiloto-de-gestao Me dá o relatório da semana: quanto falta para a meta, quantos leads estão parados e o que eu faço primeiro amanhã.",
      },
      {
        titulo: "Registrar uma venda",
        para: "Anota a venda para o painel cobrar o resto da meta.",
        prompt: "/copiloto-de-gestao Registra: fechei uma venda de R$ [valor] com [nome do cliente].",
      },
    ],
  },
  {
    id: "artes",
    titulo: "Criar as artes",
    resumo:
      "Carrossel, anúncio estático e story com as suas fotos. Precisa da chave do Gemini para as imagens. Ele sempre mostra o texto antes da arte.",
    itens: [
      {
        titulo: "Testar uma ideia em todos os formatos",
        para: "A Galeria de Artes mostra a mesma ideia em vários formatos lado a lado, para você escolher pelo olho.",
        prompt:
          "/galeria-de-artes Usa as fotos do meu ensaio e testa a ideia \"[tema que seu cliente quer resolver]\" em todos os formatos de carrossel. Depois faz o mesmo com a minha oferta nos formatos de anúncio. Monta a galeria lado a lado com o ranking e me diz qual formato combina mais com o meu perfil.",
      },
      {
        titulo: "Carrossel ilustrado",
        para: "Carrossel que explica um assunto com desenhos simples e leva para a sua página.",
        prompt:
          `/carrossel-ilustrado Faz um carrossel sobre [assunto que seu cliente quer resolver] para [seu público], em 1080 x 1440, com o texto longe do topo e da base para os botões do Instagram não cobrirem. No último slide, chamada para comentar [PALAVRA] e receber o link da minha página. ${ANTES_DA_ARTE}`,
      },
      {
        titulo: "Três carrosséis para comparar",
        para: "Ilustrado, historinha e tela viva sobre o mesmo assunto. Depois de 48 horas você repete o que gerou conversa.",
        prompt:
          `/conteudo-e-anuncios Quero testar 3 formatos de carrossel no meu perfil para levar gente para a minha página de agendamento. Faz um carrossel ilustrado, um de historinha e um de tela viva sobre [assunto que seu cliente quer resolver], cada um com uma palavra diferente para comentar. ${ANTES_DA_ARTE}`,
      },
      {
        titulo: "Anúncio estático",
        para: "Kit de anúncio com as suas fotos reais, em feed e story, pronto para a campanha.",
        prompt:
          `/anuncios-de-ouro Faz um kit de anúncio estático para a minha oferta: [sua oferta numa frase]. Público: [quem compra]. Usa as fotos da pasta [nome da pasta]. Quero 3 versões de headline, cada uma falando de uma dor diferente, em feed 1080 x 1350 e em story 1080 x 1920. O destino é a minha página [link]. Nada de número ou depoimento que eu não te mandar. ${ANTES_DA_ARTE}`,
      },
      {
        titulo: "Variações de um anúncio que já funciona",
        para: "Pega um anúncio bom e testa mudanças de texto e de imagem, uma de cada vez.",
        prompt:
          "/mix-estaticos Este anúncio está indo bem [arraste a imagem ou cole o caminho]. Faz 4 variações mudando uma coisa por vez: a headline, a foto, a cor do fundo e a chamada. Me mostra as 4 lado a lado antes de salvar.",
      },
      {
        titulo: "Stories de bastidor",
        para: "Stories com as suas fotos reais e o texto no lugar certo, longe dos botões do Instagram.",
        prompt:
          "/squad-stories-fera Faz 5 stories de bastidor para esta semana com estas fotos [arraste as fotos aqui ou cole o caminho da pasta]. O último convida para a reunião de 20 minutos. Me mostra o texto de cada um antes da arte.",
      },
      {
        titulo: "Story que parece post do Instagram",
        para: "Anúncio em story com cara de post normal, para não parecer propaganda.",
        prompt:
          `/anuncio-nativo Faz 3 stories de anúncio com cara de post nativo do Instagram para a minha oferta [sua oferta numa frase], levando para [link da página]. Usa só fotos minhas ou do meu trabalho [pasta das fotos]. ${ANTES_DA_ARTE}`,
      },
      {
        titulo: "Destaques do perfil",
        para: "Cinco destaques que respondem às dúvidas do cliente antes da reunião, com capas na sua cor.",
        prompt:
          "/squad-stories-fera Planeja 5 destaques para o meu perfil: Comece aqui, Resultados, Como funciona, Dúvidas e Agendar. Cria as capas na minha cor e 3 stories para cada destaque. No de Resultados, usa só prints e números reais que eu te mandar.",
      },
    ],
  },
  {
    id: "perfil",
    titulo: "Instagram e YouTube arrumados",
    resumo: "Antes de mandar gente nova para o seu perfil, ele precisa explicar em 3 segundos o que você faz. Faça antes dos anúncios.",
    itens: [
      {
        titulo: "Diagnóstico do perfil",
        para: "O Claude olha o seu perfil como um cliente novo e diz o que atrapalha, em ordem de prioridade.",
        prompt:
          "/fera Meu Instagram é @[seu perfil]. Olha estes prints do meu perfil [arraste os prints: topo do perfil, grade de posts e destaques abertos] e me diz, em ordem de prioridade, o que um cliente novo entende nos primeiros 3 segundos e o que está atrapalhando ele de me chamar.",
      },
      {
        titulo: "Bio nova",
        para: "Quem você ajuda, o resultado e o convite para o link, em até 150 caracteres.",
        prompt:
          "/conteudo-e-anuncios Reescreve minha bio do Instagram em até 150 caracteres: quem eu ajudo, o resultado que eu entrego e um convite para o link. Me dá 5 versões e recomenda uma. O link da bio vai ser [link da sua página de agendamento].",
      },
      {
        titulo: "Nome do perfil e foto",
        para: "O campo nome aparece na busca. Ele sugere a palavra certa e avalia a sua foto.",
        prompt:
          "/conteudo-e-anuncios Sugere o campo nome do meu perfil com a palavra que meu cliente pesquisa, por exemplo [nutricionista em Brasília]. E me diz se esta foto [arraste a foto] funciona como foto de perfil, e o que mudar se não funcionar.",
      },
      {
        titulo: "Três posts fixados",
        para: "Um explica o que você faz, um mostra prova real e um leva para a reunião.",
        prompt:
          "/conteudo-e-anuncios Planeja os 3 posts fixados do meu perfil: um que explica o que eu faço e para quem, um de prova real (vou te mandar [prints ou depoimentos]) e um que convida para a reunião de 20 minutos. Escreve o texto, me mostra e depois monta as artes.",
      },
      {
        titulo: "Comentou a palavra, recebe o link",
        para: "Quem comenta uma palavra no post recebe na DM o link da sua página.",
        prompt:
          "/crm-de-leads Quero que quem comentar [PALAVRA] nos meus posts receba na DM o link da minha página de agendamento. Me guia para configurar, um passo de cada vez. Se o caminho com chave for complicado para mim, me ensina pelas Automações do Meta Business Suite.",
      },
      {
        titulo: "Resposta pronta no Direct por palavra",
        para: "A pessoa manda uma palavra no Direct e recebe a sua mensagem com o link. De graça, pelo Meta Business Suite.",
        prompt:
          "/crm-de-leads Quero configurar a resposta do meu Direct do Instagram por palavra-chave, pelas Automações do Meta Business Suite (Caixa de Entrada, Automações, modelo de palavras-chave). Antes, confere se a Página do Facebook está ligada ao Instagram @[seu perfil]. Se não estiver, para e me diz o que eu faço no celular. Se estiver, me pergunta uma coisa por vez: qual palavra a pessoa vai mandar, o que ela deve receber e qual é o link.",
      },
      {
        titulo: "Texto da resposta no Direct",
        para: "Mensagem curta que o Meta não corta no meio: entrega, link e próximo passo.",
        prompt:
          "/crm-de-leads Escreve a mensagem que a pessoa recebe quando mandar [PALAVRA]. No máximo 500 caracteres, porque o Meta corta o resto sem avisar. Primeira linha entrega o que ela pediu, depois o link sozinho numa linha, depois uma linha dizendo o próximo passo. Sem preço. Linha em branco entre os blocos. Me mostra o texto e o número de caracteres antes de criar.",
      },
      {
        titulo: "Testar a resposta no Direct",
        para: "Confere as três causas mais comuns quando a mensagem não chega.",
        prompt:
          "/crm-de-leads Me guia no teste. Eu vou mandar [PALAVRA] de outro perfil do Instagram, não do meu. Se não chegar nada, confere as três causas mais comuns: conversa parada há menos de 15 minutos, palavra diferente da cadastrada e automação desligada.",
      },
      {
        titulo: "Descrição do canal do YouTube",
        para: "As primeiras linhas aparecem na busca e precisam falar a língua de quem está quase te contratando.",
        prompt:
          "/canal-youtube Meu canal do YouTube é [link do canal]. Escreve a descrição do canal (as 2 primeiras linhas são as mais importantes), sugere o @ e as palavras-chave do canal, pensando no que meu cliente digita no YouTube antes de me contratar.",
      },
      {
        titulo: "Banner do canal",
        para: "A frase e o rosto ficam na área do meio, que aparece em qualquer tela.",
        prompt:
          "/canal-youtube Cria o banner do meu canal em 2560 x 1440 com a frase [sua promessa em poucas palavras] e esta foto minha [arraste a foto]. Tudo que é importante fica na área segura do meio (1546 x 423), que aparece no celular.",
      },
      {
        titulo: "Vídeos antigos com o link",
        para: "Título e descrição novos para os vídeos antigos, com o link da sua página na primeira linha.",
        prompt:
          "/canal-youtube Aqui estão os títulos dos meus últimos vídeos: [cole os títulos]. Reescreve título e descrição de cada um, com o link da minha página de agendamento na primeira linha da descrição, e sugere a thumbnail dos 3 mais importantes.",
      },
      {
        titulo: "Playlists e trailer",
        para: "Playlists pelas dúvidas do cliente e um trailer curto para quem nunca te viu.",
        prompt:
          "/canal-youtube Organiza meus vídeos em 3 playlists, uma para cada dúvida que meu cliente tem antes de comprar, e escreve o roteiro de um trailer de 60 segundos para quem ainda não me conhece. O trailer termina convidando para a reunião.",
      },
      {
        titulo: "Vídeo novo para o YouTube",
        para: "Título e thumbnail primeiro, roteiro depois. Com a chave do YouTube, sobe como não listado.",
        prompt:
          "/roteiros-e-oratoria Quero um vídeo de YouTube respondendo à pergunta \"[pergunta que o cliente faz antes de comprar]\". Título e thumbnail primeiro, roteiro depois. Quando eu gravar e te mandar o arquivo, sobe como não listado no meu canal para eu revisar. Se a chave do YouTube não estiver no painel, me ensina a subir pelo YouTube Studio.",
      },
    ],
  },
  {
    id: "webinar",
    titulo: "Webinar em PDF",
    resumo: "Uma aula em slides que a pessoa lê no celular em 15 minutos e termina convidada para a reunião. Sem data e sem ao vivo.",
    itens: [
      {
        titulo: "Escolher o tema",
        para: "O melhor tema é a dúvida que a pessoa tem logo antes de te contratar.",
        prompt:
          "/webinar-pdf Quero criar um webinar digital em PDF para [seu público]. Me sugere 5 temas que respondem à dúvida que a pessoa tem logo antes de me contratar, cada um com título de até 8 palavras. Recomenda um e me diz por quê.",
      },
      {
        titulo: "Ordem dos slides",
        para: "Você aprova só os títulos antes de qualquer texto. É mais fácil mudar agora.",
        prompt:
          "/webinar-pdf Monta a estrutura do webinar \"[título escolhido]\" em 20 a 30 slides: abertura com a promessa, o problema, 3 ideias que mudam o jeito de pensar, um exemplo passo a passo, o que a pessoa pode fazer hoje e o convite para a reunião de 20 minutos. Me mostra só o título de cada slide primeiro.",
      },
      {
        titulo: "Texto dos slides",
        para: "Texto curto, na sua voz. Número sem fonte fica marcado para você confirmar ou tirar.",
        prompt:
          "/webinar-pdf Aprovado. Agora escreve o texto de cada slide, no máximo 25 palavras por slide, na minha voz. Número ou dado sem fonte fica marcado [VERIFICAR]. Exemplo inventado só se estiver escrito no slide que é um exemplo. Me mostra tudo antes de montar.",
      },
      {
        titulo: "Montar o PDF",
        para: "Os slides ganham a sua cor e a sua foto e viram um PDF deitado que abre bem no celular.",
        prompt:
          "/squad-slides-fera Monta esses slides em 1280 x 720, com a minha cor e a minha foto [arraste a foto] na abertura, e exporta tudo num PDF só, em paisagem. Abre o PDF, confere página por página e me manda o caminho da pasta.",
      },
      {
        titulo: "Página para baixar o webinar",
        para: "A pessoa deixa nome e WhatsApp, baixa o PDF e vira lead no painel. Precisa da chave da Netlify.",
        prompt:
          "/squad-isca-fera Usa o PDF [caminho do PDF] como isca. Cria a página de captura com nome e WhatsApp, entrega o PDF depois do envio, manda o lead para o meu painel com a origem webinar e publica na minha conta Netlify. Testa no tamanho de celular.",
      },
      {
        titulo: "Divulgar o webinar",
        para: "Stories e carrossel chamando para o webinar, e a mensagem que a pessoa recebe junto com o PDF.",
        prompt:
          "/conteudo-e-anuncios Faz 3 stories e 1 carrossel anunciando o webinar \"[título]\", com a palavra [WEBINAR] para comentar e receber o link. Escreve também a mensagem de WhatsApp que a pessoa recebe junto com o PDF.",
      },
      {
        titulo: "Mensagem do dia seguinte",
        para: "Pergunta o que a pessoa achou e convida para a reunião.",
        prompt:
          "/crm-de-leads Quem baixou o webinar entrou no painel com origem webinar. Escreve a mensagem do dia seguinte perguntando o que a pessoa achou do material e convidando para a reunião de 20 minutos. Me mostra antes de enviar.",
      },
      {
        titulo: "Webinar em vídeo",
        para: "O mesmo conteúdo vira vídeo narrado por IA para o YouTube.",
        prompt:
          "/roteiros-e-oratoria Transforma o webinar em PDF num vídeo narrado por IA de 8 a 12 minutos para o YouTube, um slide por trecho, com título e thumbnail. Me mostra o roteiro da narração antes de gerar a voz.",
      },
    ],
  },
  {
    id: "iscas",
    titulo: "Iscas digitais",
    resumo: "O material grátis que a pessoa recebe em troca do nome e do WhatsApp. Comece pelo mais simples.",
    itens: [
      {
        titulo: "Ideias de isca em texto",
        para: "Cinco ideias que resolvem um problema pequeno em menos de 10 minutos de leitura.",
        prompt:
          "/squad-isca-fera Quero uma isca digital em texto para [seu público]. Me sugere 5 ideias que resolvem um problema pequeno em menos de 10 minutos de leitura e que levam para [seu serviço]. Cada ideia com título de até 8 palavras. Recomenda uma e me diz por quê. Não escreve nada ainda.",
      },
      {
        titulo: "Escrever a isca",
        para: "Promessa no título, passos curtos, um exemplo e o convite para a reunião.",
        prompt:
          "/squad-isca-fera Escolhi a ideia [número]. Escreve a isca completa: a promessa no título, passos curtos, um exemplo claro e, no fim, o convite para a reunião de 20 minutos. Número ou dado sem fonte fica marcado [VERIFICAR]. Me mostra o texto antes de montar a página.",
      },
      {
        titulo: "Publicar a isca",
        para: "Página para celular, na sua cor, no ar pela Netlify.",
        prompt:
          "/paginas-e-quiz Monta a isca como página para celular, na minha cor, publica na minha conta Netlify e testa no tamanho de celular. Me manda o link e o caminho da pasta.",
      },
      {
        titulo: "Checklist",
        para: "Uma lista que a pessoa marca na hora e vê o que já faz e o que falta. É a isca que mais gera conversa.",
        prompt:
          "/squad-isca-fera Quero uma isca em checklist para [seu público] sobre [o assunto]. Cria de 8 a 12 itens que a pessoa consegue responder sozinha com sim ou não. Agrupa em 3 blocos e me mostra a lista antes de montar. Depois de eu aprovar, monta como página para celular com o progresso em cima e um resultado em 3 faixas, cada faixa com uma frase e o convite certo. Publica na Netlify e testa no tamanho de celular.",
      },
      {
        titulo: "Calculadora",
        para: "A pessoa digita 2 ou 3 números e vê o resultado dela. Nenhum número de mercado entra sem fonte.",
        prompt:
          "/squad-isca-fera Quero uma calculadora como isca para [seu público]. A conta é: [o que a pessoa quer descobrir, por exemplo quanto ela precisa vender por mês para bater a meta]. Antes de montar, me mostra em linguagem simples a fórmula, os dados que a pessoa digita e o que aparece no resultado. Depois de eu aprovar, testa com 3 exemplos conferidos à mão e publica na Netlify.",
      },
      {
        titulo: "Mini app",
        para: "Um aplicativo leve que a pessoa instala na tela do celular, sem login. Comece com 1 função só.",
        prompt:
          "/squad-isca-fera Quero um mini app como isca para [seu público] sobre [o assunto]. Me pergunta o que a pessoa faz dentro dele: consultar uma lista, acompanhar uma rotina por dias ou responder perguntas e receber um plano. Escolhe comigo o formato mais simples e me mostra as telas em texto antes de montar. Sem login, guarda o progresso no celular e abre sem internet depois da primeira vez.",
      },
      {
        titulo: "Página de captura da isca",
        para: "Sem esta página, a isca não vira conversa: o lead cai no painel com a origem certa.",
        prompt:
          "/squad-isca-fera Usa a isca [qual isca] e cria a página de captura com nome e WhatsApp. Libera a isca logo depois do envio, manda o lead para o meu painel com a origem [nome da isca] e publica na minha conta Netlify. Testa no tamanho de celular o caminho inteiro.",
      },
    ],
  },
  {
    id: "slides",
    titulo: "Slides",
    resumo: "Apresentação para ensinar, vender ou mostrar um serviço. Você aprova a ordem, depois o texto, e só então vem a arte.",
    itens: [
      {
        titulo: "Ordem da apresentação",
        para: "Você recebe só os títulos, para mudar a ordem sem custo.",
        prompt:
          "/squad-slides-fera Quero uma apresentação sobre [assunto] para [quem vai ver], no formato [aula, proposta para cliente ou apresentação do meu serviço]. A pessoa tem que sair entendendo [o que ela precisa entender] e fazendo [o que você quer que ela faça]. Me mostra só o título de cada slide, entre 10 e 20 slides, antes de escrever qualquer texto.",
      },
      {
        titulo: "Texto dos slides",
        para: "Um assunto por slide, na sua voz. Número sem fonte fica marcado.",
        prompt:
          "/squad-slides-fera Aprovado. Escreve o texto de cada slide, no máximo 25 palavras por slide, na minha voz. Número ou dado sem fonte fica marcado [VERIFICAR]. Exemplo inventado só se estiver escrito no slide que é um exemplo. Me mostra tudo antes de montar.",
      },
      {
        titulo: "Montar e exportar",
        para: "Sai em PDF e em imagens. O Claude confere página por página.",
        prompt:
          "/squad-slides-fera Monta os slides em 1280 x 720 com a minha cor e a minha foto [arraste a foto] na abertura. Exporta em PDF e em imagens. Abre o PDF, confere página por página se algum texto ficou cortado ou sobreposto e me manda o caminho da pasta.",
      },
      {
        titulo: "Mudar um slide só",
        para: "Ajusta um slide sem refazer a apresentação.",
        prompt:
          "/squad-slides-fera O slide [número] ficou [o que não gostou]. Muda só ele, mantém os outros como estão e me mostra de novo antes de exportar o PDF.",
      },
    ],
  },
];

export const SOCORRO: ItemDePrompt[] = [
  {
    titulo: "Deu erro",
    para: "Cole a mensagem de erro do jeito que apareceu.",
    prompt: "Deu este erro: [cole o erro aqui]. Me explica em uma frase o que aconteceu e conserta.",
  },
  {
    titulo: "Não entendi",
    para: "Pede a explicação de novo, mais simples.",
    prompt: "Não entendi. Me explica de novo como se eu nunca tivesse feito isso, e me diz só o próximo clique.",
  },
  {
    titulo: "Perdi o arquivo",
    para: "Mostra onde ficou o que ele acabou de criar.",
    prompt: "Onde está o arquivo que você acabou de criar? Me mostra o caminho completo e abre a pasta para mim.",
  },
  {
    titulo: "Me perdi no meio",
    para: "Faz ele parar e resumir onde vocês estão.",
    prompt: "Para tudo. Me diz o que você já fez, o que falta e onde estão os arquivos.",
  },
  {
    titulo: "Ficou ruim",
    para: "Muda só o que você não gostou, sem refazer tudo.",
    prompt: "Não gostei de [o que não gostou]. Muda só isso e me mostra de novo antes de gerar.",
  },
  {
    titulo: "Atualizar o sistema",
    para: "Traz a versão mais nova do FERABOT.",
    prompt: "/fera Atualiza o ferabot.",
  },
];

const FIM_DA_CHAVE = "Cole na tela Chaves do painel, no campo dessa chave, e aperte Salvar e testar.";

export const TUTORIAIS: TutorialDeChave[] = [
  {
    id: "gemini",
    titulo: "Chave do Gemini",
    tempo: "3 minutos · grátis",
    para: "Gera as imagens dos posts e anúncios e faz os robôs do WhatsApp pensarem.",
    envs: ["GEMINI_API_KEY"],
    passos: [
      "Abra aistudio.google.com/apikey e entre com a sua conta Google.",
      "Clique em Criar chave de API.",
      "Copie a chave. Ela começa com AIzaSy.",
      FIM_DA_CHAVE,
    ],
  },
  {
    id: "netlify",
    titulo: "Token da Netlify",
    tempo: "3 minutos · grátis",
    para: "Coloca as suas páginas e iscas no ar com um link.",
    envs: ["NETLIFY_AUTH_TOKEN"],
    passos: [
      "Abra app.netlify.com. Se ainda não tem conta, crie uma grátis (dá para entrar com o Google).",
      "Clique no seu nome ou na sua foto e escolha User settings. São as configurações da sua conta, não as de um site.",
      "No menu da esquerda, clique em Applications e role até Personal access tokens.",
      "Clique em New access token, dê o nome FERABOT e escolha a validade mais longa. Se vencer, as páginas param de ser publicadas.",
      "O token aparece uma vez só. Copie na hora.",
      FIM_DA_CHAVE,
    ],
  },
  {
    id: "meta-app",
    titulo: "App da Meta (Facebook e Instagram)",
    tempo: "10 minutos · grátis",
    para: "É a porta de entrada para o FERABOT falar com os seus anúncios. Primeiro passo do token do Meta Ads.",
    envs: [],
    passos: [
      "Abra developers.facebook.com e entre com o Facebook de quem administra a Página e a conta de anúncios. Na primeira vez, aceite os termos de desenvolvedor.",
      "Em Meus apps, clique em Criar app.",
      "Dê um nome que você reconheça, como FERABOT mais o seu nome, e coloque um e-mail que você lê.",
      "No caso de uso, escolha Outro. No tipo de app, escolha Empresa. Sem esse tipo, as permissões de anúncio não aparecem.",
      "Escolha o portfólio empresarial onde estão a sua Página e a sua conta de anúncios (se não tiver, crie em business.facebook.com antes) e clique em Criar app.",
      "Esse app não vai para a tela Chaves. Ele é usado no próximo passo a passo, o do token do Meta Ads.",
    ],
  },
  {
    id: "meta-token",
    titulo: "Usuário do sistema e token do Meta Ads",
    tempo: "10 minutos · grátis",
    para: "O token do usuário do sistema não vence. É ele que deixa o FERABOT subir e acompanhar campanhas. Faça depois do app.",
    envs: ["META_ACCESS_TOKEN", "META_AD_ACCOUNT_ID"],
    passos: [
      "Abra business.facebook.com/settings, no mesmo portfólio do app.",
      "Em Usuários, Usuários do sistema, clique em Adicionar. Nome FERABOT, função Administrador.",
      "Com o FERABOT selecionado, clique em Atribuir ativos. Em Apps, marque o seu app e ligue Gerenciar app. Salve.",
      "Atribua também a sua conta de anúncios (Gerenciar contas de anúncios), a sua Página e o seu pixel. Salve.",
      "Clique em Gerar token, escolha o seu app, validade Nunca e marque ads_management, ads_read e business_management.",
      "O token aparece uma vez só. Copie e cole na tela Chaves, no campo Meta Ads: token.",
      "Em Contas, Contas de anúncios, copie o número da conta e escreva act_ na frente (fica assim: act_ e o número). Cole no campo Meta Ads: conta de anúncio.",
      "Aperte Salvar e testar.",
    ],
  },
  {
    id: "postforme",
    titulo: "Chave do Post for Me",
    tempo: "5 minutos · pago, plano barato",
    para: "Agenda carrossel, reel e story para saírem no dia e hora marcados, sem você abrir o Instagram.",
    envs: ["POSTFORME_API_KEY"],
    passos: [
      "Abra postforme.dev e crie a conta.",
      "Conecte o seu Instagram dentro do Post for Me.",
      "No painel deles, gere a chave de API e copie.",
      FIM_DA_CHAVE,
    ],
  },
  {
    id: "scrapecreators",
    titulo: "Chave do ScrapeCreators",
    tempo: "5 minutos · grátis para começar, depois pago por uso",
    para: "Opcional. Deixa o FERABOT espiar perfis do Instagram e os anúncios dos concorrentes na Biblioteca de Anúncios da Meta.",
    envs: ["SCRAPECREATORS_API_KEY"],
    passos: [
      "Abra scrapecreators.com e crie a conta (dá para entrar com o Google). A conta nova costuma vir com créditos de teste.",
      "Se chegar um e-mail de confirmação, abra e clique no link. Sem isso a chave não aparece.",
      "No painel, copie a API key, um código comprido de letras e números. Ali também aparece o seu saldo de créditos.",
      FIM_DA_CHAVE,
      "Quando o saldo acabar, o teste avisa créditos esgotados: é só recarregar no mesmo painel.",
    ],
  },
];

/** Depois que a chave do ScrapeCreators passa no teste. */
export const PROMPT_ESPIAR_CONCORRENTE =
  "/conteudo-e-anuncios Espia os anúncios que o concorrente [nome ou @ do concorrente] está rodando agora na Biblioteca de Anúncios da Meta. Me mostra há quantos dias cada um está no ar, quantos criativos ele roda ao mesmo tempo e o que se repete na copy.";

export const AVISO_TELAS_MUDAM =
  "A Meta e os outros sites mudam o nome de botões de vez em quando. Se algo estiver diferente, tire um print da tela e cole no Claude Code: ele te mostra onde clicar.";

export function totalDePrompts(): number {
  return SECOES.reduce((soma, s) => soma + s.itens.length, 0);
}
