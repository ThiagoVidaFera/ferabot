# Prévia do Perfil — contrato de conteúdo

Template do entregável **Prévia do Perfil** (step-22 do squad onboarding). Motor no padrão FERA de
"perfil proposto": um Instagram navegável que mostra o negócio funcionando antes de existir.

## Arquivos

| Arquivo | O que é | Mexe? |
|---|---|---|
| `index.html` | Casca da página | Só o `<title>` (o `publicar.py` troca sozinho) |
| `agendar.html` / `.js` | **Página de agendamento** — destino do link da bio | Só o `<title>` |
| `grupo.html` / `.js` | **Página de captura do grupo** — destino dos anúncios da seção 02 | Só o `<title>` |
| `slides.html` / `.js` / `slides.css` | **Slides animados do vídeo** — substituem o roteiro escrito | Só o `<title>` |
| `proposta.html` / `.js` / `proposta.css` | **Página da proposta** (estrutura padrão FERA) | Só o `<title>` |
| `paginas.css` | Padrão visual das páginas (padrão FERA) | NÃO |
| `criativos.js` / `criativos.css` | Os 3 moldes de criativo de anúncio (feed-resultado · story-nativo · feed-editorial) | NÃO |
| `publicar.py` | Publica no Netlify com as armadilhas resolvidas | NÃO |
| `recortar45.py` | Normaliza foto pra 4:5 com guarda de rosto | NÃO |
| `gerar_fotos.py` | Gera o ensaio por IA a partir das fotos reais do cliente | NÃO |
| `styles.css` | Tema dark IG + seções do plano | NÃO (genérico) |
| `app.js` | Motor do perfil/feed/DM (bio-link → `agenda`) | NÃO |
| `plan.js` | Renderiza as 4 seções do plano abaixo do feed | NÃO |
| `fonte/content.tpl.js` | **TODO o conteúdo do cliente** (`window.PROFILE`), com `{{tokens}}` | SIM — é o que o agente escreve |
| `fonte/fatos.json` | os fatos que se repetem, uma vez (oferta, keywords, autoridade, exemplo) | SIM |
| `assets/content.js` | gerado pelo `montar_cliente.py` | NUNCA à mão |
| `assets/*.png/jpg/mp4` | Fotos e vídeos do cliente | SIM |

Pra montar um run: copiar os 4 arquivos da prévia (`index.html`, `app.js`, `plan.js`, `styles.css`)
pra pasta do run, escrever `fonte/` e rodar `python -I <SKILL>/templates/montar_cliente.py <run>` (o run fica em
`<FERABOT>/output/onboarding/<slug>-<data>/`).
Os `.py` ficam no template e se chamam de lá, apontando pra pasta do run.

**Tokens disponíveis:** `{{oferta.nome}}` `{{oferta.preco}}` (de `preco_num`) `{{oferta.prazo}}`
`{{oferta.encontros}}` · `{{keywords.isca|video|reuniao}}` · `{{autoridade.*}}` ·
`{{exemplo.qtd}}` `{{exemplo.com_motivo}}` `{{exemplo.sem_motivo}}` `{{exemplo.ticket_fmt}}`
`{{exemplo.valor}}` (= qtd × ticket) `{{exemplo.paga_vezes}}` (= ticket ÷ preço, por extenso).
Fato novo que se repete → acrescentar no `fatos.json` e tokenizar. Nome que contém outro fato
(ex.: "GUIA DO FECHAMENTO" contém a keyword GUIA) vai em `_lint_ignorar`.

**Não escrever à mão (o montador deriva):** `guide` (← `feed.isca`), `plano.kit.campanhas`
(← `feed.campanhas`), `plano.kit.drive` e `plano.kit.isca.arquivo` (← `drive-links.json`),
`calculadora.ticketPadrao/multiplicador` (← `exemplo`), `posts[]` e `highlights[]` depois do kit.

**Toda foto de pessoa é gerada por IA** a partir das fotos reais do cliente — `gerar_fotos.py`,
depois a grade de cor (`--perfil fera --ia`), depois `recortar45.py`. A direção é fixa: **mais
jovem, sorrindo, em contexto de trabalho ou luxo, sem olhar para a câmera** — e o **avatar é a
única exceção**, com contato visual e fundo mais claro que a pessoa (a 32px, olhar desviado some).
O `gerar_fotos.py` já gera o avatar como cena própria no mesmo lote. Frame de vídeo e foto de
WhatsApp são referência de identidade, nunca arte final
(`feedback_foto_de_pessoa_sempre_gerada_por_ia`). O avatar tem QA próprio em círculo a 110/56/32px.

A entrega é por link: `publicar.py <pasta-do-run> <slug> "<Nome>"`.

## `window.PROFILE` — chaves do perfil

`handle · name · category · avatar · bio[] · bioLink · topNote · posts[] · highlights[] · dm{} ·
guide{} · offer{}` — ver as funções de render do `app.js` pros formatos de slide
(`editorial/paper`, `photo`, `video`, `conversation`, `flow`, `split`), roteiro de reel (`script[]`)
e a conversa de DM simulada.

- **`bioLink`**: o rótulo do link da bio. SEMPRE descreve agendamento (ex.: "Agendar uma conversa").
  O clique abre **`agendar.html` numa aba nova** — a página completa, nunca uma rolagem.
- **`topNote`**: obrigatório — "Prévia ilustrativa · casos e números para demonstração".

## `PROFILE.plano` — as 4 seções novas (renderizadas pelo `plan.js`)

```js
plano: {
  kicker: "O plano por trás do perfil",
  titulo: "O perfil é a vitrine. Isto aqui é o sistema que transforma seguidor em reunião.",
  intro: "…",

  // 01 — destino do link da bio (modelo: /agendar/ do FERA)
  agendamento: {
    kicker, title, intro,
    url: "agendar.<cliente>.com",                  // sugestão, não precisa existir ainda
    pagina: {
      headline,                                     // promessa no nicho do cliente
      subheadline,
      bullets: ["…", "…"],                          // 2-4
      portao: "…",                                  // pergunta de qualificação (filtra curioso)
      botao: "Confirmar no WhatsApp",                // botão da confirmação, depois do horário
      botaoHero: "Ver horários disponíveis",         // CTA do topo: só leva até a grade
      kicker, tituloAgenda, reforcoCta,              // microcopy da página completa
      nota: "Horários ilustrativos — a agenda real puxa do Google Calendar.",
      // Blocos exclusivos da página completa (agendar.html):
      comoFunciona: { titulo, etapas: [{titulo, texto}] },      // antes · durante · depois
      autoridade:  { titulo, texto, marcos: [{numero, rotulo}] },
      duvidas:     [{pergunta, resposta}]                        // FAQ que derruba objeção
    },
    passos: [{label, text}, …],                     // como o fluxo funciona, 3-5 passos
    nota: "…"
  },

  // 02 — campanha que leva pro grupo + isca PDF (modelo: funil grupo Bastidores)
  campanhaGrupo: {
    kicker, title, intro,
    caminho: [{label, text}, …],                    // anúncio → página de captura → grupo → isca, 4 passos
    anuncio: { headline, corpo, cta },              // exemplo de criativo
    isca: { titulo, descricao, capitulos: ["…"] },  // o PDF gratuito, 4-6 capítulos
    grupo: "…"                                      // nome sugerido + dinâmica (frequência, o que posta)
  },

  // 03 — roteiro do vídeo de 18 minutos (SEMPRE "18 minutos") com CTA pro WhatsApp
  videoYoutube: {
    kicker, title, intro,
    beats: [{ tempo: "0:00", naTela: "…", fala: "…", visual: "…" }, …],  // 8-12 beats
    cta: "…"                                        // convite final: palavra-chave + WhatsApp
  },

  // 04 — conversas de WhatsApp simuladas (modelo: esqueleto E0–E7 de PADROES-COPY.md §7)
  conversasWhatsApp: {
    kicker, title, intro,
    conversas: [
      { titulo, contexto, mensagens: [{de: "lead"|"dono", texto}, …] }
    ],
    nota: "Conversas de demonstração."
  },

  fechamento: "…",            // amarra: perfil + agendamento + grupo + vídeo = um sistema só
  fechamentoCta: "Como trabalhar comigo"   // abre a oferta (offer{})
}
```

## Regras duras de conteúdo

1. **Link da bio = agendamento, sempre.** Nunca link direto pra venda, isca ou "link na bio" genérico.
2. **Vídeo é sempre "o vídeo de 18 minutos"** — nunca "vídeo curto/simples".
3. **As 3 conversas mínimas do WhatsApp:** (a) lead que chegou do vídeo/agendamento — primeira
   resposta que SEPARA o que ele procura antes de apresentar qualquer coisa; (b) qualificação —
   pedir as 3 coisas (o que vende, como atrai clientes, quanto custa) antes de marcar reunião;
   (c) retomada de lead sumido — retomar pelo motivo que o trouxe, nunca "Conseguiu ver?" seco nem
   adivinhar objeção. Modelar no esqueleto E0–E7 (`PADROES-COPY.md` §7).
4. **Prova e dado:** peça pública usa só prova real. Número/case que só o cliente tem → pergunta
   ao cliente ou `[A PREENCHER: …]`. Cenário hipotético só em material didático, rotulado no corpo. O `topNote` de demonstração é obrigatório e as
   conversas levam `nota` de simulação.
5. **Mobile-first:** QA com screenshot em 375px antes de considerar pronto.
6. Copy no padrão FERA: frases curtas, específicas, zero clichê de IA. Headline da página de
   agendamento, anúncio do grupo e CTA do vídeo levam, cada um, um elemento explícito anti-medo
   (risco zero/garantia), anti-procrastinação (por que agora), anti-preguiça (o próximo passo é
   pequeno) e anti-problema-futuro (o que acontece se não fizer).

## Design dos slides — o motor ajusta a fonte sozinho

`titleSize` e `bodySize` são o PONTO DE PARTIDA, não o tamanho final: o `ajustarEscala()` do
`app.js` multiplica os dois por um fator até o texto ocupar ~95% da altura útil do slide. Por isso
não se calibra fonte slide a slide — escreva a copy e deixe o motor resolver. Se um slide ainda
parecer vazio, o problema é a copy curta demais, não o tamanho da fonte.

## Nenhum post sem legenda

Todo post do feed leva `caption` que se sustenta sozinha, inclusive os de foto/bastidor. Legenda de
duas palavras faz o perfil parecer abandonado — que é exatamente o contrário do que a prévia vende.


## As três páginas satélites

Além do perfil, a prévia publica três páginas no padrão visual FERA de `paginas.css`
(Fraunces + Archivo, off-white com navy, hero de foto escurecida com chip, CTA em pílula com seta):

| Página | Lê de | Papel |
|---|---|---|
| `agendar.html` | `plano.agendamento.pagina` | destino do link da bio |
| `grupo.html` | `plano.campanhaGrupo.pagina` + `.isca` | destino dos anúncios do grupo |
| `slides.html` | `plano.videoYoutube.beats` | os slides animados do vídeo de 18 minutos |
| `proposta.html` | `plano.proposta` + `offer` | a página que apresenta a oferta |

Campos de `campanhaGrupo.pagina`: `url · kicker · headline · subheadline · botaoHero · reforcoCta ·
tituloIsca · tituloRotina · rotina[{titulo,texto}] · tituloNaoE · naoE[] · tituloForm · textoForm ·
botao · nota`. O que o grupo **não** é importa tanto quanto o que ele é: filtra antes de entrar.

## O fluxo de WhatsApp tem padrão fechado

`plano.conversasWhatsApp` segue o esqueleto E0–E7 de `PADROES-COPY.md` §7
e leva três campos: `regras[]` (as três que atravessam tudo), `mapa[{etapa,nome,gatilho,quem,objetivo}]`
(E0 a E7) e `conversas[]` com os exemplos das etapas que mais pesam. Adaptar gatilhos e condições à
oferta do cliente; o esqueleto não muda.


## Cada beat do vídeo é uma CENA

Nada de frase solta e nada de tempo na tela (tempo é dado de produção, fica no prompter):

```js
{ rotulo: "O diagnóstico",              // sobrelinha curta
  naTela: "Seu funil não está vazio.",  // a frase que o espectador vê
  contexto: "São duas coisas diferentes, e só uma você resolve comprando lead.",
  visualTipo: "comparacao",             // o visual que carrega o argumento
  dados: { antes: {...}, depois: {...} },
  fala: "…",                            // prompter, não vai pra tela
  visual: "Corte pra reunião" }         // nota de produção, também no prompter
```

Tipos de `visualTipo`: `numero` · `barras` · `fluxo` · `pilhas` · `comparacao` · `lista` ·
`mensagem` (bolha de WhatsApp) · `foto`. O formato de `dados` de cada um está em `slides.js`,
no objeto `VISUAL`. A tipografia de cada tela se auto-ajusta — escreva a cena, não calibre fonte.

## A proposta segue a estrutura padrão FERA

`plano.proposta` monta, nesta ordem: `kicker · headline` (com `**destaque**` nas palavras-chave) ·
`subheadline · botaoHero · foto · assinatura{quem,texto} · diagrama[] + diagramaLegendas[]` →
`reconhecimento[]` (checklist que conta) → `emJogo[{rotulo,texto}]` → `calculadora{pergunta,
ticketPadrao,multiplicador,…}` → `pecas[{titulo,texto}]` → `prova{titulo,texto,marcos[]}` →
`insight{titulo,texto}` → `primeirosDias[{quando,texto}]` → `naoSou{titulo,texto,itens[]}` →
`preco{valor,condicao} + incluso[] + garantia` → FAQ `duvidas[]` → `tituloFecho/textoFecho` +
barra fixa. O `fit` e o título da oferta vêm de `offer`.


## Três criativos por página do funil

`criativos[]` existe dentro de `plano.agendamento`, `plano.campanhaGrupo` e `plano.proposta` — três
peças cada, uma de cada molde. `**palavra**` vira destaque colorido em eyebrow, headline, caixa de
story, card e dado.

```js
// feed-resultado — 4:5 escuro, o molde dos anúncios de resultado por nicho
{ formato:"feed-resultado", foto, eyebrow, headline, sub, corpo, bullets[], ctaLinha, botao, legenda }
// story-nativo — 9:16 chapado; CADA LINHA é uma caixa, como no Instagram
{ formato:"story-nativo", fundo, foto, publico, selo, caixas[], card, caixasFim[], dado, fonte, botao, legenda }
// feed-editorial — 4:5 claro, dor em serifada + mecanismo
{ formato:"feed-editorial", foto, eyebrow, headline, corpo, bullets[], assina, botao, legenda }
```

**Antes de escrever, baixe os criativos ativos da conta e confira o molde** — eles mudam, e a graça
é a peça do cliente sair no mesmo formato que já está rodando. A `legenda` de cada peça diz de qual
anúncio ela saiu, pra o cliente entender que não é invenção.


## Quando o Kit de Feed Inicial existe, o feed da prévia usa as artes dele

O `montar_cliente.py` chama o `templates/kit-feed/feed_do_kit.py <run>` quando o kit existe: ele reescreve o
`posts[]` apontando pros PNGs (`slides[].export`), marca `fixado: true` nos 6 carrosséis e põe a
legenda pronta em cada post. O `publicar.py` leva os PNGs junto.

Antes do kit existir, os posts são conteúdo de exemplo renderizado em HTML — serve pra aprovar a
direção. Depois do kit, o protótipo passa a ser o feed de verdade.


## O PDF da isca — bloco `isca` do `feed.json`

Lido pelo `build_isca.py`. Cada situação leva as três coisas que o carrossel prometeu:

```js
isca: {
  arquivo: "dinheiro-parado-9-situacoes",   // nome do PDF, sem extensão
  foto_capa: "escritorio",                  // chave de marca.fotos
  selo, titulo, subtitulo,                  // capa — **palavra** vira destaque
  intro_titulo, intro, como_usar,           // página 2
  separar: { eyebrow, titulo, texto, itens: [{titulo, texto}] },
  situacoes: [                              // 9, em 3 páginas
    { curto,                                // rótulo da tabela da conta
      titulo,
      onde,                                 // onde procurar
      calculo,                              // como dar valor à linha
      mensagem }                            // retomada pelo MOTIVO DE ORIGEM, com {campos}
  ],
  conta: { eyebrow, titulo, texto, leitura },
  priorizar: { eyebrow, titulo, texto, itens: [{titulo, texto}] },
  rotina: { eyebrow, titulo, texto, regra },
  exemplo: { selo, titulo, texto, linhas: [{rotulo, texto}], aviso },   // SEMPRE hipotético e rotulado
  checklist: { eyebrow, titulo, itens: [] },
  fecho: { titulo, texto, prefixo, keyword, onde }                      // keyword, nunca URL não confirmada
}
```

E no `content.js`: `plano.kit.isca = { arquivo: "kit-feed-inicial/isca/<nome>.pdf", texto }` — é o
que faz a seção 06 da prévia mostrar o botão "Abrir o PDF da isca".
