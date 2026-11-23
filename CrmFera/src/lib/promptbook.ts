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

/** Junta as linhas do briefing. A tela mostra cada linha separada (pre-wrap). */
const p = (...linhas: string[]): string => linhas.join("\n");

/*
 * Blocos que se repetem nos briefings. Cada um nasceu de uma peça reprovada e refeita:
 * prova só real, texto antes da arte, zona de 250px, lead frio, checklist dos 4 medos,
 * conferir no celular. Mudou a regra, muda aqui e vale para todos os prompts.
 */
const PLANO =
  "Use o meu perfil e o meu plano do painel (big idea, mecanismo, contracrença e headlines). Se faltar alguma informação, me pergunte, uma pergunta por vez.";
const LEAD_FRIO =
  "Fale com quem nunca me viu: a primeira linha é a frase que essa pessoa já pensa sobre o problema, do jeito que ela fala, e não um título de aula.";
const PROVA =
  "Prova só real: número, print e depoimento só os que eu te mandar. O que faltar fica marcado [FALTA PROVA] e sai da peça, nunca é inventado.";
const QUATRO_MEDOS =
  "Antes de me mostrar, confira se a peça tem os 4: algo que tira o medo, um motivo para agir agora, o que eu entrego pronto e o que acontece depois da compra.";
const TEXTO_PRIMEIRO = "Me mostre o texto antes de fazer a arte. Só depois do meu ok, produza.";
const ZONA =
  "Nenhum texto nos 250px do topo e da base (a tela do Instagram cobre ali). Foto clara leva caixa de cor atrás do texto. Rosto nunca cortado e nunca coberto por texto ou legenda.";
const CELULAR = "Abra no tamanho do celular (375px) e me mande o print antes de dizer que está pronto.";
const RODAPE = "No rodapé, link para a minha política de privacidade e os termos de uso.";
const DOIS_CAMINHOS =
  "Siga o padrão de página de captura do FERABOT (SkillsDoFera/fera/references/pagina-de-captura.md): dois botões, marcar uma reunião de 20 minutos ou conversar direto no WhatsApp. Os dois abrem o mesmo formulário curto: nome, WhatsApp, e-mail, Instagram e uma pergunta que qualifica, tirada do meu briefing. Botão do formulário: Solicitar orçamento. Ao enviar, o lead vai para o meu painel e dispara o evento Lead para a Meta com eventID, guardando UTM e fbclid. Depois abre a minha agenda ou o meu WhatsApp com uma mensagem personalizada que diz de onde a pessoa veio.";
const SEM_REPETIR =
  "Nunca dois slides seguidos com a mesma forma de frase: alterne pergunta, contraste, número, fala entre aspas e frase direta.";

export const SECOES: SecaoDePrompts[] = [
  {
    id: "base",
    titulo: "A base (uma vez só)",
    resumo:
      "Antes de qualquer peça, o FERABOT precisa saber quem é você, o que você vende, para quem e quanto quer faturar. Sem isso, tudo sai genérico.",
    itens: [
      {
        titulo: "Conferir a instalação",
        para: "O Claude testa o que foi instalado, conserta o que conseguir e te mostra um resumo simples.",
        prompt: p(
          "/fera Acabei de instalar o FERABOT. Confere se está tudo funcionando: Python, Node, Playwright, FFmpeg e as pastas do sistema.",
          "Me responde numa lista curta: o que está ok, o que falta e o que você já consertou.",
          "Se precisar que eu faça alguma coisa, me diz um passo de cada vez, em linguagem simples.",
          "Ficou bom quando: a lista não tem nenhum item vermelho ou cada item vermelho tem o próximo clique escrito.",
        ),
      },
      {
        titulo: "As duas chaves grátis",
        para: "Gemini gera imagens e Netlify coloca suas páginas no ar. Leva uns 8 minutos.",
        prompt: p(
          "/fera Quero configurar as duas chaves grátis: Gemini e Netlify.",
          "Se der, faça pelo meu Chrome com a extensão do Claude: eu entro nas minhas contas e digito senha e código.",
          "Se não der, me guia um passo de cada vez, com o link exato de cada site.",
          "Eu colo cada chave na tela Chaves do painel e aperto Salvar e testar. Não me peça para colar a chave aqui no chat.",
          "No fim, confere se as duas passaram no teste.",
        ),
      },
      {
        titulo: "Meu briefing",
        para: "Transforma o faturamento que você quer em número de vendas e de reuniões por semana.",
        prompt: p(
          "/fera Quero fazer meu briefing. Eu vendo [o que você vende], para [quem compra], por [preço]. Quero faturar [valor] por mês. Meu Instagram é @[seu perfil].",
          "Me faz as perguntas que faltam, uma de cada vez: a dor que o meu cliente já sabe que tem, o que ele já tentou e não deu certo, e a prova real que eu tenho (só a que existe).",
          "No fim, me mostra a conta: quantas vendas por semana eu preciso e quantas reuniões isso pede, com a taxa de fechamento que eu te informar.",
          "Ficou bom quando: eu leio o resumo e reconheço o meu cliente, não um cliente qualquer.",
        ),
      },
      {
        titulo: "Minha big idea e meu mecanismo",
        para: "A frase que só você pode dizer. É dela que saem as headlines de página, anúncio e carrossel.",
        prompt: p(
          "/fera Com o meu briefing, monta o meu posicionamento: a crença antiga do meu mercado que eu derrubo, a minha big idea numa frase, o nome do meu mecanismo (o jeito como eu faço) e o inimigo, que é um modelo errado e nunca uma pessoa.",
          "Depois escreve 10 headlines para quem nunca me viu, cada uma nomeando o público ou a dor. Variar a forma: pergunta, contraste, \"você não precisa de X, precisa de Y\", frase que o cliente fala.",
          "Promessa só do que eu entrego. Nada de prometer faturamento ou número de clientes.",
          "Me mostre 3 versões da big idea e recomenda uma. Ficou bom quando: a frase não serviria para o meu concorrente.",
        ),
      },
      {
        titulo: "Mapa das chaves",
        para: "Mostra o que cada chave destrava e quais ainda faltam, sem precisar fazer todas hoje.",
        prompt: p(
          "/fera Me mostra numa tabela simples as chaves que eu vou usar: nome, o que ela destrava, se é grátis ou paga, quanto tempo leva e se já está configurada no meu painel.",
          "Depois me guia na ordem que você recomenda, uma por vez. Eu colo cada chave na tela Chaves do painel e aperto Salvar e testar.",
        ),
      },
      {
        titulo: "O que eu estou deixando de fazer",
        para: "Serve para qualquer dia: mostra as chaves que faltam e o que elas liberariam.",
        prompt: p(
          "/fera Quais chaves eu ainda não configurei e o que eu estou deixando de fazer por causa disso?",
          "Me diz qual delas destrava mais coisa para a minha meta e começa por ela.",
        ),
      },
    ],
  },
  {
    id: "funil",
    titulo: "Funil de vendas do começo ao fim",
    resumo:
      "Oferta clara, página, conferência do anúncio, proposta, conteúdo, posts agendados e campanha. Siga na ordem: cada passo usa o anterior.",
    itens: [
      {
        titulo: "Oferta numa frase",
        para: "Sem oferta clara, nenhuma página converte. Você sai com 3 versões e uma recomendada.",
        prompt: p(
          "/fera Antes de criar qualquer página, quero a minha oferta clara numa frase. " + PLANO,
          "A frase diz: para quem é, o problema que resolve, como eu faço (o meu mecanismo), o que a pessoa recebe pronto e em quanto tempo eu entrego.",
          "Promessa só do que eu faço e entrego. Nada de \"você vai faturar X\" nem resultado garantido.",
          "Me dá 3 versões e recomenda uma. Ficou bom quando: eu leio em voz alta em 10 segundos e alguém de fora entende o que eu vendo.",
        ),
      },
      {
        titulo: "Página de agendamento",
        para: "A primeira página do funil: o lead escolhe um horário de reunião de 20 minutos.",
        prompt: p(
          "/funil-reuniao-fantasma Quero minha página de reunião de 20 minutos. Meu WhatsApp é [55 + DDD + número]. Atendo [dias da semana] das [hora] às [hora]. " + PLANO,
          "Primeira dobra no celular: a promessa em uma frase, uma linha de apoio e um botão só. " + LEAD_FRIO,
          "Formulário curto. " + DOIS_CAMINHOS,
          PROVA,
          "Valor do meu serviço não aparece na página. " + RODAPE,
          "Me faz as perguntas da página uma por vez e me mostra o texto completo antes de montar.",
        ),
      },
      {
        titulo: "Página de captura",
        para: "Dois caminhos (reunião de 20 min ou WhatsApp), formulário que qualifica, lead no painel e evento Lead para a Meta.",
        prompt: p(
          "/paginas-e-quiz Quero a minha página de captura para [seu público]. Puxe do painel o meu briefing e o meu plano (python ScriptsFera/painel.py puxar) e escreva com as minhas palavras. " + PLANO,
          "Mobile-first: desenha em 375px. Primeira dobra com a promessa, uma linha de apoio e os dois botões. " + LEAD_FRIO,
          DOIS_CAMINHOS,
          "A pergunta que qualifica: [ex.: em que momento você está?] com 3 ou 4 opções. Link da minha agenda: [link]. Meu WhatsApp: [número com DDD].",
          PROVA + " " + RODAPE,
          "Me mostra o texto da página antes de montar. Depois, testa pelos DOIS caminhos com o meu nome e me mostra: o lead no painel com a resposta da qualificação e a origem, a mensagem do WhatsApp e o evento Lead em Testar eventos da Meta.",
          CELULAR,
        ),
      },
      {
        titulo: "Posts que convidam para a página",
        para: "Logo depois da página no ar: 3 a 6 posts que levam gente até ela.",
        prompt: p(
          "/conteudo-e-anuncios A minha página de captura está no ar em [link]. Crie 6 posts que convidam para ela: 2 carrosséis, 2 reels e 2 sequências de stories com link.",
          "Cada post parte de uma dor do meu briefing, com as palavras que o meu público usa, e termina chamando para a página (link na bio ou figurinha de link no story). " + PLANO,
          "Todo link leva UTM: utm_source=instagram, utm_medium=organico, utm_campaign=[nome da página], utm_content=[nome do post].",
          ZONA,
          TEXTO_PRIMEIRO,
        ),
      },
      {
        titulo: "Página de vendas",
        para: "Para oferta que fecha na página. Cada imagem nasce do texto do bloco e pelo menos um elemento se mexe.",
        prompt: p(
          "/paginas-e-quiz Quero a página de vendas de [sua oferta numa frase], para [seu público]. " + PLANO,
          "Ordem: promessa, a dor que a pessoa já sabe que tem, por que o que ela tentou não funcionou, o meu mecanismo, o que ela recebe pronto, prova real, garantia, perguntas frequentes e o botão.",
          "Cada imagem ilustra o bloco em que ela está (gerada por IA a partir do texto do bloco, sem banco de imagem). No topo, um elemento animado leve, em loop, que mostra o resultado ou o processo.",
          PROVA,
          QUATRO_MEDOS,
          "Me mostra o texto bloco por bloco antes de montar. " + RODAPE,
          CELULAR,
        ),
      },
      {
        titulo: "Colocar a página no ar",
        para: "Publica na sua conta Netlify e testa no tamanho de celular. Precisa da chave da Netlify.",
        prompt: p(
          "/paginas-e-quiz Publica a página [qual página] na minha conta Netlify e me manda o link.",
          "Testa no tamanho de celular o caminho inteiro: abrir, preencher, escolher horário (se tiver) e abrir o WhatsApp com a mensagem certa.",
          "Confere também se o rodapé com a política de privacidade está lá e se nenhum texto ficou cortado.",
          "Me manda o print de cada etapa. Ficou bom quando: um lead de teste aparece no meu painel com a origem certa.",
        ),
      },
      {
        titulo: "Página no meu domínio",
        para: "Domínio próprio passa mais confiança que o endereço netlify.app e é o que o anúncio deve usar.",
        prompt: p(
          "/paginas-e-quiz Tenho o domínio [seudominio.com.br]. Coloca a página em [agenda.seudominio.com.br].",
          "Me diz exatamente o que eu preciso mudar no site onde comprei o domínio, um clique de cada vez. Se der, faça pelo meu Chrome com a extensão do Claude.",
          "Depois confere se o endereço abre com cadeado (https) no celular e me avisa quando estiver valendo.",
        ),
      },
      {
        titulo: "Conferir o anúncio antes de subir",
        para: "Duas checagens que evitam dinheiro jogado fora: risco de reprovação na Meta e se a página continua a promessa do anúncio.",
        prompt: p(
          "/conteudo-e-anuncios Antes de subir, confere estes anúncios [pasta dos criativos] contra a página [link].",
          "1. Risco de reprovação: frase que afirma algo sobre a pessoa (\"você que está endividado\"), promessa de ganho, antes e depois, número sem fonte, palavra de clickbait. Para cada risco, o trecho exato e uma reescrita que mantém a venda.",
          "2. Continuidade: a primeira dobra da página repete a promessa do anúncio em até 3 segundos? A oferta, o público, a prova e o botão são os mesmos? Me dá uma nota de 0 a 100 e o que muda.",
          "3. Rastreamento: o link tem UTM, o pixel certo está na página e o evento de lead dispara.",
          "Veredito por anúncio: liberado, ajustar antes de subir ou barrado. Não sobe nada, só me mostra.",
        ),
      },
      {
        titulo: "Leads do dia",
        para: "Todo dia de manhã: quem pediu para falar com você, quem está parado e o que fazer primeiro.",
        prompt: p(
          "/crm-de-leads Como estão meus leads hoje no painel? Quem pediu para falar comigo, quem está parado há mais de 2 dias e quais reuniões eu tenho hoje?",
          "Me dá a lista em ordem de prioridade, com o motivo de cada um estar ali e a primeira frase que eu mando para cada um.",
        ),
      },
      {
        titulo: "Mensagens para quem sumiu",
        para: "Três mensagens para quem parou de responder: dia 2, dia 5 e dia 9, cada uma com um motivo diferente.",
        prompt: p(
          "/crm-de-leads Escreve as mensagens de follow-up para quem parou de responder: dia 2, dia 5 e dia 9, na minha voz.",
          "Cada uma traz um motivo novo para voltar a conversar: uma dúvida comum respondida, um exemplo do meu trabalho, uma pergunta simples de sim ou não.",
          "Sem preço (valor só quando a pessoa perguntar), sem pedir desculpa por mandar mensagem e sem frase que dá licença para sumir (\"se não for o momento, tudo bem\").",
          "Formato de WhatsApp: parágrafos de no máximo 3 linhas e linha em branco entre eles. Me mostra as três antes de usar.",
        ),
      },
      {
        titulo: "Proposta em página",
        para: "Montada com as palavras que o próprio lead usou. O preço fica só na página, nunca na mensagem.",
        prompt: p(
          "/proposta-pagina A reunião do [nome do lead] foi. Na conversa ele disse: \"[cole frases que ele falou]\". O que ele quer é [objetivo dele] e o que trava é [o problema dele].",
          "Abre com as palavras dele, mostra o que eu vou fazer em etapas, o que ele recebe pronto, o que continua sendo dele e a garantia que eu ofereço de verdade.",
          "Validade real, com o motivo explicado. Nada de urgência inventada.",
          "Monta a proposta em página para eu aprovar e escreve a mensagem curta que leva o link, sem o valor no texto.",
        ),
      },
      {
        titulo: "Proposta em PDF",
        para: "A mesma proposta em PDF, para mandar por e-mail.",
        prompt: p(
          "/propostas Quero também a versão em PDF dessa proposta para mandar por e-mail.",
          "Mesmo texto da página, sem link quebrado, e confere página por página se nada ficou cortado antes de me mandar o caminho da pasta.",
        ),
      },
      {
        titulo: "Ensaio de fotos com IA",
        para: "A partir de 3 a 6 fotos reais suas, cenas suas trabalhando para usar nos posts. Precisa da chave do Gemini.",
        prompt: p(
          "/ensaio-ia Quero um ensaio de fotos meu com IA para usar nos posts. Aqui estão minhas fotos [arraste de 3 a 6 fotos suas: rosto de frente, meio corpo e uma sorrindo].",
          "Eu trabalho em [onde você atende: consultório, escritório, online], uso [a roupa que você usa com cliente] e quero um clima [sério, próximo ou premium].",
          "Cenas do meu trabalho de verdade, no meu nicho. Rosto inteiro no quadro, nunca cortado, e espaço livre em cima e embaixo para texto.",
          "Me mostra o plano das cenas antes de gerar. Ficou bom quando: quem me conhece olha e diz que sou eu.",
        ),
      },
      {
        titulo: "Roteiros de reel",
        para: "Cinco roteiros curtos para você gravar, respondendo às dúvidas de quem está quase comprando.",
        prompt: p(
          "/roteiros-e-oratoria Escreve 5 roteiros de reel de 30 a 45 segundos para eu gravar, respondendo às dúvidas que meu cliente tem antes de comprar [seu serviço]. " + PLANO,
          "Gancho nos 3 primeiros segundos contrariando uma crença do meu público, direto e sem rodeio: \"Você não precisa de X. Precisa de Y.\" ou \"O problema não é X. É Y.\" Nada de \"muita gente acha\".",
          "Depois: por que a crença está errada, um exemplo concreto e, no fim, chamada para comentar [PALAVRA].",
          "Texto só com o que eu vou falar, sem marcação de cena no meio. Número sem fonte fica marcado [VERIFICAR].",
          "Me dá 3 opções de gancho para cada roteiro, para eu escolher.",
        ),
      },
      {
        titulo: "Abertura do vídeo em 3 segundos",
        para: "Decide o primeiro quadro e a primeira frase do reel ou do anúncio em vídeo, onde a pessoa decide ficar ou passar.",
        prompt: p(
          "/gancho-dos-tres-segundos Tenho este roteiro [cole o roteiro ou arraste o vídeo]. Me propõe 4 aberturas diferentes: tela real com número (se eu tiver), chamada do público (\"[PÚBLICO]:\"), quebra de crença e cena que o meu cliente vive.",
          "Para cada uma: o que aparece no primeiro quadro, a frase dos 3 primeiros segundos e o que muda na tela até 1,5 segundo.",
          "O primeiro quadro vira a capa: nunca preto, com a frase legível e o rosto inteiro.",
          PROVA,
        ),
      },
      {
        titulo: "Editar o reel que eu gravei",
        para: "Corta pausas e erros, coloca legenda grande no centro e gera a capa.",
        prompt: p(
          "/editar-reel Gravei este vídeo [arraste o arquivo aqui]. Corta as pausas e os erros sem mudar nenhuma fala.",
          "Legenda grande no centro da tela, que nunca cobre o meu rosto. Capa em 1080 x 1920 com o título, e ela é o primeiro quadro do vídeo (nunca tela preta).",
          "Me mostra antes de finalizar. Ficou bom quando: dá para entender o vídeo sem som.",
        ),
      },
      {
        titulo: "Agendar os posts da semana",
        para: "Os posts entram na fila do Post for Me e saem no dia e hora marcados. Precisa da chave do Post for Me.",
        prompt: p(
          "/conteudo-e-anuncios Agenda o carrossel da pasta [nome da pasta] para [dia] às [hora], o reel [nome do arquivo] para [dia] às [hora] e os stories da pasta [nome da pasta] para [dia] a partir das [hora], um a cada 2 horas.",
          "Antes de agendar, me mostra a lista com data, hora, formato (feed, reel ou story), legenda e capa de cada um para eu aprovar.",
          "Confere se o reel tem capa própria e se nenhum texto do carrossel caiu nos 250px do topo e da base.",
        ),
      },
      {
        titulo: "O que está agendado",
        para: "Lista do que vai sair nos próximos 7 dias.",
        prompt: p(
          "/conteudo-e-anuncios O que está agendado no Post for Me para os próximos 7 dias? Me mostra em lista com data, hora e formato.",
          "Se tiver dia sem nada ou dois posts colados no mesmo horário, me avisa.",
        ),
      },
      {
        titulo: "Subir a campanha",
        para: "A campanha sobe com o rastreamento conferido e nasce pausada. Precisa da chave do Meta Ads.",
        prompt: p(
          "/meta-ads-fera Quero subir uma campanha de R$ [20] por dia levando para a minha página [link da página, no meu domínio]. Usa os criativos da pasta [nome da pasta], com pelo menos 3 formatos diferentes.",
          "Antes de subir, roda a checagem de rastreamento (UTM no link, pixel certo no conjunto e na página, evento de lead disparando) e a conferência do anúncio contra a página.",
          "Se alguma checagem falhar, não sobe e me diz o que corrigir. Se passar, deixa a campanha pausada para eu revisar.",
        ),
      },
      {
        titulo: "Como estão as campanhas",
        para: "Custo por reunião agendada e o que pausar ou manter.",
        prompt: p(
          "/meta-ads-fera Como estão minhas campanhas nos últimos 7 dias? Quanto custou cada reunião agendada e cada lead?",
          "Por anúncio: quanto gastou, quantos pararam nos 3 primeiros segundos (se for vídeo) e quantos viraram lead.",
          "Me diz o que eu pauso, o que eu mantenho e qual criativo merece uma variação, com o motivo em uma linha.",
        ),
      },
      {
        titulo: "Relatório da semana",
        para: "Quanto falta para a meta, qual é o gargalo e o que fazer primeiro amanhã.",
        prompt: p(
          "/copiloto-de-gestao Me dá o relatório da semana: quanto falta para a meta, quantos leads entraram, quantas reuniões aconteceram e quantos estão parados.",
          "Me diz qual é o gargalo (pouca gente chegando, pouca reunião ou pouca venda) e as 3 coisas que eu faço primeiro amanhã.",
        ),
      },
      {
        titulo: "Registrar uma venda",
        para: "Anota a venda para o painel cobrar o resto da meta.",
        prompt: "/copiloto-de-gestao Registra: fechei uma venda de R$ [valor] com [nome do cliente], que chegou por [origem: anúncio, Instagram, indicação].",
      },
    ],
  },
  {
    id: "artes",
    titulo: "Criar as artes",
    resumo:
      "Carrossel, anúncio estático e story com as suas fotos. Precisa da chave do Gemini para as imagens. O texto sempre vem antes da arte, e você escolhe entre variações.",
    itens: [
      {
        titulo: "Testar uma ideia em todos os formatos",
        para: "A Galeria de Artes mostra a mesma ideia em vários formatos lado a lado, para você escolher pelo olho.",
        prompt: p(
          "/galeria-de-artes Usa as fotos do meu ensaio e testa a ideia \"[tema que seu cliente quer resolver]\" em todos os formatos de carrossel. Depois faz o mesmo com a minha oferta nos formatos de anúncio. " + PLANO,
          "A capa fala com quem nunca me viu: assunto do meu nicho, foto do meu nicho, tom de conversa. " + LEAD_FRIO,
          ZONA,
          "Monta a galeria lado a lado com o ranking e me diz qual formato combina mais com o meu perfil e por quê.",
        ),
      },
      {
        titulo: "Carrossel ilustrado",
        para: "Carrossel que explica um assunto com desenhos simples e leva para a sua página.",
        prompt: p(
          "/carrossel-ilustrado Faz um carrossel sobre [assunto que seu cliente quer resolver] para [seu público], em 1080 x 1440. " + PLANO,
          "Capa: a frase que o meu cliente pensa + a consequência concreta + uma ponte que promete o slide 2 de forma contável (\"Os 4 erros, um por slide\"). Nada de \"arrasta pro lado\".",
          "Uma ideia por slide. " + SEM_REPETIR,
          ZONA,
          "Último slide: chamada para comentar [PALAVRA] e receber o link da minha página.",
          TEXTO_PRIMEIRO + " Faça 3 versões de capa para eu escolher.",
        ),
      },
      {
        titulo: "Carrossel de autoridade",
        para: "Mostra que você entende do assunto derrubando uma crença do seu mercado. Gera seguidor certo e conversa.",
        prompt: p(
          "/squad-carrossel-fera Quero um carrossel de autoridade de 8 a 10 slides em 1080 x 1440 para [seu público]. " + PLANO,
          "O tema é uma crença do meu mercado que eu derrubo: [a crença]. Capa no formato \"Você não precisa de X. Precisa de Y.\" ou \"X não resolve. Y resolve.\", com o meu nome e o que eu faço visíveis para quem não me conhece.",
          "Slides: por que a crença parece certa, o custo dela na vida do meu cliente, o meu jeito (o mecanismo) em passos, um exemplo real e o convite.",
          "Uma ideia por slide. " + SEM_REPETIR + " Uma frase de destaque por slide, em caixa.",
          ZONA + " " + PROVA,
          TEXTO_PRIMEIRO + " Faça 3 versões de capa para eu escolher.",
        ),
      },
      {
        titulo: "Carrossel de estudo de caso",
        para: "Prova em forma de história. A capa abre com o resultado real e a tese vem depois.",
        prompt: p(
          "/squad-carrossel-fera Quero um carrossel de estudo de caso em 1080 x 1440 com este caso real: [nicho do cliente, o que ele tinha antes, o que fizemos, o resultado com número e prazo, e de onde vem o número: print, relatório, data].",
          "Capa em 3ª pessoa com o resultado (nicho + número + prazo), nunca em tom de desabafo meu. Slide 2 diz de onde vem o número e que é o resultado daquele caso, não garantia.",
          "Depois: o ponto de partida, o que travava, as decisões que mudaram o jogo (uma por slide), o que o cliente fez e o que eu fiz, e o convite para comentar [PALAVRA].",
          "Sem autorização do cliente, sem nome dele: só o nicho. Print real com dado sensível borrado.",
          ZONA + " " + SEM_REPETIR,
          TEXTO_PRIMEIRO + " Se o caso não tiver fonte, para e me avisa em vez de escrever.",
        ),
      },
      {
        titulo: "Três carrosséis para comparar",
        para: "Ilustrado, historinha e tela viva sobre o mesmo assunto. Depois de 48 horas você repete o que gerou conversa.",
        prompt: p(
          "/conteudo-e-anuncios Quero testar 3 formatos de carrossel no meu perfil para levar gente para a minha página [link]. Faz um carrossel ilustrado, um de historinha (personagem fictício dito na capa) e um de tela viva sobre [assunto que seu cliente quer resolver].",
          "Cada um com uma palavra diferente para comentar, para eu saber qual trouxe a conversa. Capas diferentes entre si na forma da frase.",
          ZONA,
          TEXTO_PRIMEIRO + " Daqui a 48 horas, me lembra de comparar comentários e salvamentos.",
        ),
      },
      {
        titulo: "Kit de anúncio com as minhas fotos",
        para: "Kit de anúncio com as suas fotos reais, em feed e story, pronto para a campanha.",
        prompt: p(
          "/anuncios-de-ouro Faz um kit de anúncio para a minha oferta: [sua oferta numa frase]. Público: [quem compra]. Usa as fotos da pasta [nome da pasta]. " + PLANO,
          "Antes de desenhar, escolhe 3 formatos diferentes do catálogo de formatos e me mostra a referência de cada um. Nada de layout inventado do zero.",
          "Headline nomeia o público ou a dor, em tom de conversa, e promete o que eu entrego. Nada de frase de efeito solta.",
          "Composição compacta: letra grande, sem vão branco no meio, botão colado no texto. Sem preço na arte. Feed 1080 x 1350 e story 1080 x 1920. " + ZONA,
          PROVA + " " + QUATRO_MEDOS,
          "O destino é a minha página [link]. " + TEXTO_PRIMEIRO,
        ),
      },
      {
        titulo: "Anúncio estático de oferta",
        para: "Lote de teste para o feed: 3 ângulos diferentes, 3 jeitos de desenhar cada um. Você descobre o ângulo antes de gastar muito.",
        prompt: p(
          "/squad-anuncios-estaticos Quero um lote de anúncios estáticos de feed (1080 x 1350) para [sua oferta numa frase], público [quem compra]. " + PLANO,
          "Mapeia as dores, os desejos e as objeções do meu público e escolhe 3 ângulos bem diferentes. Cada ângulo em 3 visuais: editorial, blocos e um que para o dedo.",
          "Headline de cada ângulo no formato \"Se você [situação do público], eu [o que eu faço por você]\" ou na frase que o cliente fala. " + LEAD_FRIO,
          "Letra grande, sem vão branco, sem preço na arte. " + ZONA + " " + PROVA,
          QUATRO_MEDOS,
          "Me mostra os 3 ângulos em texto primeiro. Ficou bom quando: dá para tampar o logo e ainda saber para quem é o anúncio.",
        ),
      },
      {
        titulo: "Variações de um anúncio que já funciona",
        para: "Pega um anúncio bom e testa mudanças de texto e de imagem, uma de cada vez.",
        prompt: p(
          "/mix-estaticos Este anúncio está indo bem [arraste a imagem ou cole o caminho]. Faz 4 variações mudando uma coisa por vez: a headline, a foto, a cor do fundo e a chamada.",
          "A promessa e a oferta continuam as mesmas, senão o teste não diz nada. " + ZONA,
          "Me mostra as 4 lado a lado com a original antes de salvar, e o nome de cada arquivo diz o que mudou.",
        ),
      },
      {
        titulo: "Stories de bastidor",
        para: "Stories com as suas fotos reais e o texto no lugar certo, longe dos botões do Instagram.",
        prompt: p(
          "/squad-stories-fera Faz 5 stories de bastidor (1080 x 1920) para esta semana com estas fotos reais [arraste as fotos aqui ou cole o caminho da pasta].",
          "Cada story em camadas: headline curta que para o dedo, uma explicação de 2 a 3 linhas, a ponte (o que existe do outro lado, sem pedir nada ainda) e o pedido com a palavra entre aspas.",
          "Cada um se explica sozinho para quem nunca me viu: quem eu sou e o que eu faço aparecem antes do assunto. " + ZONA,
          "O último convida para a call de 20 minutos. " + TEXTO_PRIMEIRO,
        ),
      },
      {
        titulo: "Sequência de stories",
        para: "Seis a oito stories em sequência que levam a pessoa de \"nunca pensei nisso\" até \"quero conversar\".",
        prompt: p(
          "/squad-stories-fera Quero uma sequência de 6 a 8 stories para o meu público [seu público] sobre [o problema]. " + PLANO,
          "Ordem: a frase que o meu cliente pensa, a consequência que ele sente, por que o que ele tentou não funcionou, o meu jeito em 3 passos, uma prova real, o que eu entrego pronto e o convite com a palavra [PALAVRA].",
          "Um ponto por story, com texto suficiente para fazer sentido mesmo se a pessoa pular os outros. Uma enquete ou caixinha no meio para a pessoa responder.",
          ZONA + " " + PROVA,
          TEXTO_PRIMEIRO,
        ),
      },
      {
        titulo: "Story que parece post do Instagram",
        para: "Anúncio em story com cara de post normal, para não parecer propaganda.",
        prompt: p(
          "/anuncio-nativo Faz 3 stories de anúncio com cara de post nativo do Instagram para a minha oferta [sua oferta numa frase], levando para [link da página].",
          "Caixas de texto no estilo do próprio Instagram: headline branca, explicação em caixa preta, ponte e chamada.",
          "Foto: minha ou do meu trabalho [pasta das fotos], ou uma cena de bastidor realista gerada por IA sem rosto, mesa de trabalho real e tela ilegível. Nada de foto de banco.",
          ZONA + " " + PROVA,
          TEXTO_PRIMEIRO,
        ),
      },
      {
        titulo: "Destaques do perfil",
        para: "Cinco destaques que respondem às dúvidas do cliente antes da reunião, com capas na sua cor.",
        prompt: p(
          "/squad-stories-fera Planeja 5 destaques para o meu perfil: Comece aqui, Resultados, Como funciona, Dúvidas e Agendar.",
          "Cria as capas na minha cor e 3 stories para cada destaque. Cada story se explica sozinho e o último de cada destaque leva para a reunião.",
          "No de Resultados, usa só prints e números reais que eu te mandar. " + ZONA,
        ),
      },
      {
        titulo: "Legenda do post",
        para: "A legenda que continua a capa, entrega o conteúdo e termina pedindo uma ação só.",
        prompt: p(
          "/conteudo-e-anuncios Escreve a legenda deste post [arraste o carrossel ou cole o texto dele] para o meu público [seu público].",
          "A primeira linha continua a capa (é ela que aparece antes do \"mais\"), em tom de conversa. Depois, o resumo do que a pessoa aprende, em parágrafos de até 3 linhas com linha em branco entre eles.",
          "Termina com uma ação só: comentar [PALAVRA] para receber [o que ela recebe]. Sem pedir curtida, salvamento e compartilhamento ao mesmo tempo.",
          "Até 5 hashtags do meu nicho. Me dá 2 versões, uma curta e uma longa.",
        ),
      },
    ],
  },
  {
    id: "perfil",
    titulo: "Instagram e YouTube arrumados",
    resumo:
      "Antes de mandar gente nova para o seu perfil, ele precisa explicar em 3 segundos o que você faz. Faça antes dos anúncios. No YouTube, cada vídeo responde a uma pergunta de quem está quase comprando.",
    itens: [
      {
        titulo: "Diagnóstico do perfil",
        para: "O Claude olha o seu perfil como um cliente novo e diz o que atrapalha, em ordem de prioridade.",
        prompt: p(
          "/fera Meu Instagram é @[seu perfil]. Olha estes prints do meu perfil [arraste os prints: topo do perfil, grade de posts e destaques abertos].",
          "Me diz, em ordem de prioridade, o que um cliente novo entende nos primeiros 3 segundos e o que está atrapalhando ele de me chamar.",
          "Para cada problema, a correção em uma linha e qual prompt deste guia resolve.",
        ),
      },
      {
        titulo: "Bio nova",
        para: "Quem você ajuda, o resultado e o convite para o link, em até 150 caracteres.",
        prompt: p(
          "/conteudo-e-anuncios Reescreve minha bio do Instagram em até 150 caracteres: quem eu ajudo, o que eu entrego e um convite para o link. " + PLANO,
          "Linguagem do meu cliente, sem jargão do meu mercado. Promessa só do que eu faço.",
          "Me dá 5 versões com o número de caracteres de cada uma e recomenda uma. O link da bio vai ser [link da sua página].",
        ),
      },
      {
        titulo: "Nome do perfil e foto",
        para: "O campo nome aparece na busca. Ele sugere a palavra certa e avalia a sua foto.",
        prompt: p(
          "/conteudo-e-anuncios Sugere o campo nome do meu perfil com a palavra que meu cliente pesquisa, por exemplo [nutricionista em Brasília].",
          "E me diz se esta foto [arraste a foto] funciona como foto de perfil: rosto inteiro, fundo limpo e reconhecível pequena. Se não funcionar, o que mudar.",
        ),
      },
      {
        titulo: "Três posts fixados",
        para: "Um explica o que você faz, um mostra prova real e um leva para a reunião.",
        prompt: p(
          "/conteudo-e-anuncios Planeja os 3 posts fixados do meu perfil: um que explica o que eu faço e para quem, um de prova real (vou te mandar [prints ou depoimentos]) e um que convida para a reunião de 20 minutos.",
          "Cada capa fala com quem nunca me viu. " + LEAD_FRIO,
          ZONA + " " + PROVA,
          TEXTO_PRIMEIRO,
        ),
      },
      {
        titulo: "Comentou a palavra, recebe o link",
        para: "Quem comenta uma palavra no post recebe na DM o link da sua página.",
        prompt: p(
          "/crm-de-leads Quero que quem comentar [PALAVRA] nos meus posts receba na DM o link da minha página. Me guia para configurar, um passo de cada vez.",
          "Se o caminho com chave for complicado para mim, me ensina pelas Automações do Meta Business Suite.",
          "Uma palavra por post, sem repetir entre posts, para eu saber de onde veio cada conversa.",
        ),
      },
      {
        titulo: "Resposta pronta no Direct por palavra",
        para: "A pessoa manda uma palavra no Direct e recebe a sua mensagem com o link. De graça, pelo Meta Business Suite.",
        prompt: p(
          "/crm-de-leads Quero configurar a resposta do meu Direct do Instagram por palavra-chave, pelas Automações do Meta Business Suite (Caixa de Entrada, Automações, modelo de palavras-chave).",
          "Antes, confere se a Página do Facebook está ligada ao Instagram @[seu perfil]. Se não estiver, para e me diz o que eu faço no celular.",
          "Se estiver, me pergunta uma coisa por vez: qual palavra a pessoa vai mandar, o que ela deve receber e qual é o link.",
        ),
      },
      {
        titulo: "Texto da resposta no Direct",
        para: "Mensagem curta que o Meta não corta no meio: entrega, link e próximo passo.",
        prompt: p(
          "/crm-de-leads Escreve a mensagem que a pessoa recebe quando mandar [PALAVRA]. No máximo 500 caracteres, porque o Meta corta o resto sem avisar.",
          "Primeira linha entrega o que ela pediu, depois o link sozinho numa linha, depois uma linha dizendo o próximo passo. Sem preço. Linha em branco entre os blocos.",
          "Me mostra o texto e o número de caracteres antes de criar.",
        ),
      },
      {
        titulo: "Testar a resposta no Direct",
        para: "Confere as três causas mais comuns quando a mensagem não chega.",
        prompt: p(
          "/crm-de-leads Me guia no teste. Eu vou mandar [PALAVRA] de outro perfil do Instagram, não do meu.",
          "Se não chegar nada, confere as três causas mais comuns: conversa parada há menos de 15 minutos, palavra diferente da cadastrada e automação desligada.",
        ),
      },
      {
        titulo: "Descrição do canal do YouTube",
        para: "As primeiras linhas aparecem na busca e precisam falar a língua de quem está quase te contratando.",
        prompt: p(
          "/canal-youtube Meu canal do YouTube é [link do canal]. Escreve a descrição do canal: as 2 primeiras linhas dizem para quem é e que dúvida o canal responde.",
          "Sugere o @ e as palavras-chave do canal pensando no que meu cliente digita no YouTube antes de me contratar, não no que eu acho bonito.",
          "Termina com o link da minha página. Me mostra antes de eu colar no YouTube Studio.",
        ),
      },
      {
        titulo: "Banner do canal",
        para: "A frase e o rosto ficam na área do meio, que aparece em qualquer tela.",
        prompt: p(
          "/canal-youtube Cria o banner do meu canal em 2560 x 1440 com a frase [sua promessa em poucas palavras] e esta foto minha [arraste a foto].",
          "Tudo que é importante fica na área segura do meio (1546 x 423), que aparece no celular. Rosto inteiro, nunca cortado.",
          "Me mostra como fica no celular, no computador e na TV antes de salvar.",
        ),
      },
      {
        titulo: "Vídeos antigos com o link",
        para: "Título e descrição novos para os vídeos antigos, com o link da sua página na primeira linha.",
        prompt: p(
          "/canal-youtube Aqui estão os títulos dos meus últimos vídeos: [cole os títulos]. Reescreve título e descrição de cada um com a pergunta que o meu cliente digitaria para achar aquele vídeo.",
          "O link da minha página vai na primeira linha da descrição. Sugere a thumbnail dos 3 mais importantes.",
        ),
      },
      {
        titulo: "Playlists e trailer",
        para: "Playlists pelas dúvidas do cliente e um trailer curto para quem nunca te viu.",
        prompt: p(
          "/canal-youtube Organiza meus vídeos em 3 playlists, uma para cada dúvida que meu cliente tem antes de comprar.",
          "Escreve o roteiro de um trailer de 60 segundos para quem ainda não me conhece: abre contrariando uma crença do meu público, diz para quem é o canal e termina convidando para a reunião.",
        ),
      },
      {
        titulo: "Vídeo de intenção para o YouTube",
        para: "Um vídeo que responde à pergunta que o cliente digita antes de comprar. Atrai menos curioso e mais comprador.",
        prompt: p(
          "/roteiros-e-oratoria Quero um vídeo de YouTube de 8 a 15 minutos respondendo à pergunta \"[pergunta que o cliente faz antes de comprar]\". " + PLANO,
          "Primeiro, me dá 5 títulos com as palavras que o meu cliente digitaria na busca e recomenda um.",
          "Roteiro: nos primeiros 30 segundos confirma a promessa do título e diz para quem é. Depois, as crenças que a pessoa já tem, por que o que ela tentou não funcionou, o jeito certo em passos e um exemplo real.",
          "O vídeo ensina pela explicação: nunca peço para a pessoa pausar e fazer um exercício. O convite para a reunião vem no fim e o link vai na primeira linha da descrição.",
          "Texto só com o que eu vou falar. Número sem fonte fica marcado [VERIFICAR].",
          "Me mostra título e estrutura antes do roteiro completo. Quando eu gravar e te mandar o arquivo, sobe como não listado para eu revisar. Se a chave do YouTube não estiver no painel, me ensina pelo YouTube Studio.",
        ),
      },
      {
        titulo: "Thumbnail do vídeo",
        para: "Quatro capas diferentes para o mesmo vídeo. A thumbnail completa o título, não repete.",
        prompt: p(
          "/roteiros-e-oratoria Faz a thumbnail do vídeo \"[título do vídeo]\" em 1280 x 720, com esta foto minha [arraste a foto] ou sem pessoa, se eu preferir.",
          "Me dá 4 conceitos bem diferentes: rosto com expressão forte, antes e depois, objeto ou tela do assunto, e frase de contraste.",
          "No máximo 4 palavras na imagem, que completam o título e não repetem o título. Letra grande que se lê no tamanho de uma miniatura de celular. Rosto inteiro, sem texto em cima dele.",
          "Sem preço e sem número inventado. Monta as 4 lado a lado, no tamanho pequeno, para eu escolher.",
        ),
      },
    ],
  },
  {
    id: "webinar",
    titulo: "Webinar em PDF",
    resumo:
      "Uma aula em slides que a pessoa lê no celular em 15 minutos e termina convidada para a reunião. Sem data, sem ao vivo e sem tarefa para quem lê.",
    itens: [
      {
        titulo: "Escolher o tema",
        para: "O melhor tema é a dúvida que a pessoa tem logo antes de te contratar.",
        prompt: p(
          "/webinar-pdf Quero criar um webinar digital em PDF para [seu público]. " + PLANO,
          "Me sugere 5 temas que respondem à dúvida que a pessoa tem logo antes de me contratar, cada um com título de até 8 palavras na língua dela.",
          "Recomenda um e me diz por quê. Ficou bom quando: o título faria o meu cliente parar de rolar a tela.",
        ),
      },
      {
        titulo: "Ordem dos slides",
        para: "Você aprova só os títulos antes de qualquer texto. É mais fácil mudar agora.",
        prompt: p(
          "/webinar-pdf Monta a estrutura do webinar \"[título escolhido]\" em 20 a 30 slides.",
          "Ordem: a promessa, as frases que o meu cliente já pensa, as 3 tentativas que ele fez e por que cada uma falhou, o que há de comum entre elas, o meu jeito diferente, um exemplo passo a passo e o convite para a reunião de 20 minutos.",
          "A aula ensina pela explicação: nada de \"pegue uma folha\" ou \"faça o teste agora\". Sem data no material.",
          "Me mostra só o título de cada slide primeiro.",
        ),
      },
      {
        titulo: "Texto dos slides",
        para: "Texto curto, na sua voz. Número sem fonte fica marcado para você confirmar ou tirar.",
        prompt: p(
          "/webinar-pdf Aprovado. Agora escreve o texto de cada slide, no máximo 25 palavras por slide, na minha voz.",
          "Um assunto por slide. Número ou dado sem fonte fica marcado [VERIFICAR]. Exemplo inventado só se estiver escrito no slide que é um exemplo.",
          "O slide do convite tem o que eu entrego pronto e o que acontece na reunião. Me mostra tudo antes de montar.",
        ),
      },
      {
        titulo: "Montar o PDF",
        para: "Os slides ganham a sua cor e a sua foto e viram um PDF deitado que abre bem no celular.",
        prompt: p(
          "/squad-slides-fera Monta esses slides em 1280 x 720, com a minha cor e a minha foto [arraste a foto] na abertura, e exporta tudo num PDF só, em paisagem.",
          "Letra grande o bastante para ler no celular sem dar zoom. Rosto inteiro, nunca cortado.",
          "Abre o PDF, confere página por página se algum texto ficou cortado ou sobreposto e me manda o caminho da pasta.",
        ),
      },
      {
        titulo: "Página para baixar o webinar",
        para: "A pessoa deixa nome e WhatsApp, baixa o PDF e vira lead no painel. Precisa da chave da Netlify.",
        prompt: p(
          "/squad-isca-fera Usa o PDF [caminho do PDF] como isca. Cria a página de captura mobile-first: primeira dobra com o título do webinar, uma linha do que a pessoa vai entender e um botão só.",
          "Formulário com nome e WhatsApp. Entrega o PDF logo depois do envio e manda o lead para o meu painel com a origem webinar. " + RODAPE,
          "Publica na minha conta Netlify. " + CELULAR,
        ),
      },
      {
        titulo: "Divulgar o webinar",
        para: "Stories e carrossel chamando para o webinar, e a mensagem que a pessoa recebe junto com o PDF.",
        prompt: p(
          "/conteudo-e-anuncios Faz 3 stories e 1 carrossel anunciando o webinar \"[título]\", com a palavra [WEBINAR] para comentar e receber o link.",
          "A arte não leva data nem \"ao vivo\": o material está sempre disponível. " + LEAD_FRIO,
          ZONA,
          "Escreve também a mensagem de WhatsApp que a pessoa recebe junto com o PDF, em parágrafos curtos. " + TEXTO_PRIMEIRO,
        ),
      },
      {
        titulo: "Mensagem do dia seguinte",
        para: "Pergunta o que a pessoa achou e convida para a reunião.",
        prompt: p(
          "/crm-de-leads Quem baixou o webinar entrou no painel com origem webinar. Escreve a mensagem do dia seguinte perguntando qual parte do material fez mais sentido para a pessoa.",
          "Depois da resposta, o convite para a reunião de 20 minutos. Sem preço e sem pressão. Me mostra antes de enviar.",
        ),
      },
      {
        titulo: "Webinar em vídeo",
        para: "O mesmo conteúdo vira vídeo narrado por IA para o YouTube.",
        prompt: p(
          "/roteiros-e-oratoria Transforma o webinar em PDF num vídeo narrado por IA de 8 a 12 minutos para o YouTube, um slide por trecho, com título e thumbnail.",
          "Roteiro só com o texto da narração, sem marcação de cena no meio (a voz leria em voz alta). Número sem fonte fica marcado [VERIFICAR].",
          "Me mostra o roteiro da narração antes de gerar a voz.",
        ),
      },
    ],
  },
  {
    id: "iscas",
    titulo: "Iscas digitais",
    resumo: "O material grátis que a pessoa recebe em troca do nome e do WhatsApp. Comece pelo mais simples e resolva um problema pequeno de verdade.",
    itens: [
      {
        titulo: "Ideias de isca em texto",
        para: "Cinco ideias que resolvem um problema pequeno em menos de 10 minutos de leitura.",
        prompt: p(
          "/squad-isca-fera Quero uma isca digital em texto para [seu público]. " + PLANO,
          "Me sugere 5 ideias que resolvem um problema pequeno em menos de 10 minutos de leitura e que deixam a pessoa querendo o meu serviço [seu serviço] para o problema grande.",
          "Cada ideia com título de até 8 palavras, na língua do meu cliente. Recomenda uma e me diz por quê. Não escreve nada ainda.",
        ),
      },
      {
        titulo: "Escrever a isca",
        para: "Promessa no título, passos curtos, um exemplo e o convite para a reunião.",
        prompt: p(
          "/squad-isca-fera Escolhi a ideia [número]. Escreve a isca completa: a promessa no título, passos curtos, um exemplo claro e, no fim, o convite para a reunião de 20 minutos.",
          "Cumpre o que o título promete dentro da própria isca: nada de esconder a resposta para vender depois.",
          "Número ou dado sem fonte fica marcado [VERIFICAR]. Me mostra o texto antes de montar a página.",
        ),
      },
      {
        titulo: "Publicar a isca",
        para: "Página para celular, na sua cor, no ar pela Netlify.",
        prompt: p(
          "/paginas-e-quiz Monta a isca como página para celular, na minha cor, com letra grande e parágrafos curtos. " + RODAPE,
          "Publica na minha conta Netlify. " + CELULAR + " Me manda o link e o caminho da pasta.",
        ),
      },
      {
        titulo: "Checklist",
        para: "Uma lista que a pessoa marca na hora e vê o que já faz e o que falta. É a isca que mais gera conversa.",
        prompt: p(
          "/squad-isca-fera Quero uma isca em checklist para [seu público] sobre [o assunto]. Cria de 8 a 12 itens que a pessoa consegue responder sozinha com sim ou não, na língua dela.",
          "Agrupa em 3 blocos e me mostra a lista antes de montar.",
          "Depois de eu aprovar, monta como página para celular com o progresso em cima e um resultado em 3 faixas, cada faixa com uma frase e o convite certo para aquela faixa.",
          "Publica na Netlify. " + CELULAR,
        ),
      },
      {
        titulo: "Calculadora",
        para: "A pessoa digita 2 ou 3 números e vê o resultado dela. Nenhum número de mercado entra sem fonte.",
        prompt: p(
          "/squad-isca-fera Quero uma calculadora como isca para [seu público]. A conta é: [o que a pessoa quer descobrir, por exemplo quanto ela precisa vender por mês para bater a meta].",
          "Antes de montar, me mostra em linguagem simples a fórmula, os dados que a pessoa digita e o que aparece no resultado. Número de mercado só com fonte nomeada.",
          "Depois de eu aprovar, testa com 3 exemplos conferidos à mão, publica na Netlify e confere no tamanho de celular.",
        ),
      },
      {
        titulo: "Mini app",
        para: "Um aplicativo leve que a pessoa instala na tela do celular, sem login. Comece com 1 função só.",
        prompt: p(
          "/squad-isca-fera Quero um mini app como isca para [seu público] sobre [o assunto]. Me pergunta o que a pessoa faz dentro dele: consultar uma lista, acompanhar uma rotina por dias ou responder perguntas e receber um plano.",
          "Escolhe comigo o formato mais simples e me mostra as telas em texto antes de montar.",
          "Sem login, guarda o progresso no celular e abre sem internet depois da primeira vez. " + CELULAR,
        ),
      },
      {
        titulo: "Página de captura da isca",
        para: "A isca vira conversa: a página de obrigado oferece a reunião rápida de 20 minutos.",
        prompt: p(
          "/squad-isca-fera Depois da minha página de captura, quero a página da isca digital gratuita [qual isca]. O PDF você mesmo cria a partir do meu briefing e do meu plano (python ScriptsFera/painel.py puxar).",
          "Página mobile-first: primeira dobra com a promessa da isca e um botão. Formulário curto com nome, WhatsApp, e-mail, Instagram e uma pergunta que qualifica. Ao enviar, o lead vai para o meu painel com a origem [nome da isca] e dispara o evento Lead com eventID, guardando UTM e fbclid. " + RODAPE,
          "Página de obrigado: botão para baixar o PDF e, logo abaixo, o convite para uma reunião rápida de 20 minutos para entender como aplicar o material, com os dois caminhos (agenda ou WhatsApp com mensagem personalizada dizendo que veio da isca). O obrigado não dispara Lead de novo.",
          "Publica na minha conta Netlify e testa no celular o caminho inteiro, com o meu nome.",
        ),
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
        prompt: p(
          "/squad-slides-fera Quero uma apresentação sobre [assunto] para [quem vai ver], no formato [aula, proposta para cliente ou apresentação do meu serviço].",
          "A pessoa tem que sair entendendo [o que ela precisa entender] e fazendo [o que você quer que ela faça].",
          "Começa pelo problema de quem assiste, não pela minha história. Me mostra só o título de cada slide, entre 10 e 20 slides, antes de escrever qualquer texto.",
        ),
      },
      {
        titulo: "Texto dos slides",
        para: "Um assunto por slide, na sua voz. Número sem fonte fica marcado.",
        prompt: p(
          "/squad-slides-fera Aprovado. Escreve o texto de cada slide, no máximo 25 palavras por slide, na minha voz. Um assunto por slide.",
          "Número ou dado sem fonte fica marcado [VERIFICAR]. Exemplo inventado só se estiver escrito no slide que é um exemplo.",
          "Me mostra tudo antes de montar.",
        ),
      },
      {
        titulo: "Montar e exportar",
        para: "Sai em PDF e em imagens. O Claude confere página por página.",
        prompt: p(
          "/squad-slides-fera Monta os slides em 1280 x 720 com a minha cor e a minha foto [arraste a foto] na abertura. Exporta em PDF e em imagens.",
          "Abre o PDF, confere página por página se algum texto ficou cortado, sobreposto ou pequeno demais para ler no celular, e me manda o caminho da pasta.",
        ),
      },
      {
        titulo: "Mudar um slide só",
        para: "Ajusta um slide sem refazer a apresentação.",
        prompt:
          "/squad-slides-fera O slide [número] ficou [o que não gostou]. Muda só ele, mantém os outros como estão e me mostra de novo antes de exportar o PDF.",
      },
    ],
  },
  {
    id: "personalizar",
    titulo: "Personalize o seu painel",
    resumo:
      "O quadro Meus números, na tela inicial do painel, é seu: o FERABOT calcula os números no seu computador e manda para lá. Peça os que te ajudam a decidir. Número que é conta do FERABOT aparece como estimado.",
    itens: [
      {
        titulo: "Monitorar o meu uso",
        para: "Quantas peças o FERABOT fez por você e em que você mais usa.",
        prompt: p(
          "/fera Monte no meu painel o quadro do meu uso. Conte, nos últimos 30 dias, o que você entregou para mim (entregas.json e a pasta output): páginas, artes, roteiros, posts e anúncios.",
          "Mande para o painel um número por tipo, com: python ScriptsFera/painel.py numero <id> \"<título>\" \"<valor>\" --detalhe \"últimos 30 dias\"",
          "Use ids curtos (uso-paginas, uso-artes, uso-roteiros). Atualize os mesmos ids toda segunda-feira, quando eu abrir o FERABOT.",
        ),
      },
      {
        titulo: "Quantos posts eu fiz",
        para: "Posts publicados no mês, para ver o ritmo da sua semana.",
        prompt: p(
          "/fera Conte quantos posts eu publiquei este mês: os que marquei como Publiquei no painel (Meu plano) e os que você agendou para mim (Calendário de posts, se eu tiver a chave do Post for Me).",
          "Mande para o painel: python ScriptsFera/painel.py numero posts-mes \"Posts publicados no mês\" \"<quantos>\" --detalhe \"meta: <minha meta por semana> por semana\"",
          "Se eu estiver abaixo do ritmo, me diga qual post do plano publicar hoje.",
        ),
      },
      {
        titulo: "Custo das ferramentas de IA",
        para: "Quanto as ferramentas conectadas estão custando por mês.",
        prompt: p(
          "/fera Calcule quanto eu gastei este mês com as ferramentas de IA e serviços conectados (Gemini, ElevenLabs, fal, Post for Me, ScrapeCreators, servidor do WhatsApp e o que mais eu usar).",
          "Onde o serviço mostra o gasto no painel dele, me guie para olhar e me pergunte o valor (se for muito clique, ofereça a extensão do Claude no Chrome). Onde não mostra, estime pelo que você gerou para mim e pelo preço oficial do site, dizendo a fonte.",
          "Mande um número por ferramenta e o total: python ScriptsFera/painel.py numero custo-total \"Custo das ferramentas no mês\" \"R$ <valor>\" --estimado (tire o --estimado só do que veio da fatura).",
        ),
      },
      {
        titulo: "Minhas integrações",
        para: "O que está ligado e o que falta ligar, e para que serve cada coisa.",
        prompt: p(
          "/fera Confira as minhas integrações: rode python ScriptsFera/painel.py sincronizar e python ScriptsFera/painel.py estado e me diga, em português simples, quais chaves estão funcionando, quais estão salvas sem teste e quais faltam, e o que cada uma libera.",
          "Mande para o painel: python ScriptsFera/painel.py numero integracoes \"Integrações funcionando\" \"<x> de <y>\" --detalhe \"falta: <as que faltam>\"",
          "Se alguma estiver recusada, me guie para refazer, uma de cada vez (oferecendo a extensão do Claude no Chrome).",
        ),
      },
      {
        titulo: "Mais ou menos informações dos leads",
        para: "Escolher o que o formulário pergunta e o que aparece na ficha de cada lead.",
        prompt: p(
          "/paginas-e-quiz Quero mudar o que a minha página de captura pergunta. Hoje ela pede nome, WhatsApp, e-mail, Instagram e uma pergunta que qualifica. Quero [acrescentar / tirar]: [ex.: cidade, faixa de investimento, o que já tentou].",
          "Mantenha o padrão de página de captura (dois caminhos, Solicitar orçamento, evento Lead, UTM). Pergunta nova vai em respostas_texto, para aparecer na ficha do lead no painel. Formulário com no máximo 6 campos: cada campo a mais derruba conversão.",
          "Publique, teste com o meu nome e me mostre a ficha do lead no painel com a informação nova. Depois mande para o painel um resumo dos leads do mês: python ScriptsFera/painel.py numero leads-qualificados \"Leads qualificados no mês\" \"<quantos>\" --detalhe \"<a resposta mais comum>\"",
        ),
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
    titulo: "Meta, parte 1: o aplicativo (Facebook, Instagram, anúncios e Direct)",
    tempo: "15 minutos · grátis",
    para: "O app é a porta por onde o FERABOT fala com a Meta: anúncios, publicação no Facebook e no Instagram, comentários e Direct. Faça uma vez só.",
    envs: [],
    passos: [
      "Antes: a sua Página do Facebook, a conta de anúncios e a conta do Instagram precisam estar no mesmo portfólio empresarial (business.facebook.com). O Instagram tem que ser conta profissional e estar ligado à Página. Se não estiver, peça no Claude Code: /fera me ajuda a juntar Página, Instagram e conta de anúncios no meu portfólio.",
      "Abra developers.facebook.com e entre com o Facebook de quem administra o portfólio. Na primeira vez, aceite os termos de desenvolvedor.",
      "Em Meus apps, clique em Criar app. Nome: FERABOT mais o seu nome. E-mail: um que você lê.",
      "No caso de uso, escolha Outro. No tipo de app, escolha Empresa. Escolha o seu portfólio empresarial e clique em Criar app.",
      "No painel do app, em Adicionar produtos (ou Casos de uso), adicione: API de Marketing (anúncios), API do Instagram com login do Facebook (publicar, comentários e Direct), Webhooks (para o Direct e os comentários chegarem) e Login do Facebook para empresas.",
      "Em Configurações do app > Básico, preencha a URL da sua Política de Privacidade (a da sua página serve) e a categoria. Salve.",
      "Para a automação de Direct e de comentários receber mensagens, o app precisa ficar no modo Ao vivo: chave no topo do painel do app, de Desenvolvimento para Ao vivo.",
      "Em Configurações do portfólio > Contas > Apps, confira que o app aparece no seu portfólio. Pronto: agora a parte 2, o token.",
    ],
  },
  {
    id: "meta-token",
    titulo: "Meta, parte 2: usuário do sistema e o token que nunca vence",
    tempo: "10 minutos · grátis",
    para: "Um token só para tudo da Meta. Ele não vence e não depende da sua senha do Facebook. É o único que vai na tela Chaves.",
    envs: ["META_ACCESS_TOKEN", "META_AD_ACCOUNT_ID"],
    passos: [
      "Abra business.facebook.com/settings, no mesmo portfólio do app.",
      "Em Usuários > Usuários do sistema, clique em Adicionar. Nome FERABOT, função Administrador.",
      "Com o FERABOT selecionado, clique em Atribuir ativos e dê controle total de cada um: o seu app (Apps), a sua conta de anúncios, a sua Página, a sua conta do Instagram e o seu pixel (Conjuntos de dados). Salve.",
      "Clique em Gerar token. Escolha o seu app e a validade Nunca.",
      "Marque estas permissões: ads_management, ads_read, business_management, pages_show_list, pages_read_engagement, pages_manage_posts, pages_manage_metadata, pages_manage_engagement, pages_messaging, instagram_basic, instagram_content_publish, instagram_manage_comments, instagram_manage_messages, instagram_manage_insights e read_insights. Se alguma não aparecer, volte na parte 1 e confira os produtos do app.",
      "O token aparece uma vez só. Copie e cole na tela Chaves, no campo Meta: token único. Aperte Salvar e testar: o painel acha sozinho a sua conta do Instagram.",
      "Em Contas > Contas de anúncios, copie o número da conta e escreva act_ na frente (fica act_ e o número). Cole no campo Meta Ads: conta de anúncio e aperte Salvar e testar.",
      "Não precisa de token do Instagram: o mesmo token do Meta serve para o Instagram.",
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
