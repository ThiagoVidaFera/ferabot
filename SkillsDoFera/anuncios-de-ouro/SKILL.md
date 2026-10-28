---
name: anuncios-de-ouro
description: "Kit completo de anúncio no padrão-ouro: com fotos REAIS do dono, entrega feed 1080×1350 + story + capa de reel + carrosséis no mesmo design system, HTML→PNG, copy na voz do dono, ângulos distintos e QA com guarda de estouro. Perguntar antes se quer nesse padrão. Triggers \"kit de anúncio\", \"anúncio completo\", \"criativos com minhas fotos\". NÃO faz vídeo/VSL nem story nativo."
---

# Skill: Anúncios de Ouro 🏆

O jeito **padrão-ouro** de fazer anúncio: copy forte + design organizado + fotos reais do dono do negócio,
entregue em todos os formatos de uma vez, como uma campanha só.

**Pra quem é:** você, usuário do FERABOT, anunciando o seu negócio (ou o de um cliente seu). Ler
`perfil.json` na raiz do FERABOT (nome, nicho, produto, preço, @, cores, landing) como ponto de partida.
Se for pra um cliente, pedir os dados e as fotos dele e não usar o `perfil.json`.

**Qual skill de anúncio usar:**
- **Esta** → kit multiformato completo com fotos reais (feed + story + capa de reel + carrossel).
- `squad-anuncios-estaticos` → lote de teste só de feed: 3 ângulos × 3 execuções, sem depender de foto.
- `mix-estaticos` → 10+ conceitos em texto a partir de uma ideia, antes de produzir arte.
- `anuncio-nativo` → story ad com cara de post nativo do Instagram.

## Gate obrigatório (perguntar primeiro)

Assim que o pedido envolver **criar anúncio/criativo**, antes de produzir qualquer coisa, perguntar:

> **"Quer no padrão Anúncios de Ouro?**
> (kit multiformato com as suas fotos reais — **estático em Feed + Story + capa de Reel** e **carrosséis** —
> mesmo design, copy na sua voz, tudo numa pasta pronta pra subir)"

- **Sim** → seguir esta skill à risca (todos os formatos abaixo, salvo se o usuário restringir).
- **Não / só um formato** → produzir só o que ele pediu, mas ainda respeitando os 6 pilares de qualidade.

## ⛔ Gate do CATÁLOGO — antes de desenhar qualquer layout

**Não desenhe um design system do zero.** Abra `reference/formatos-de-anuncio.md`, escolha 1–3 dos 40
formatos e **descreva ao usuário o layout escolhido** (linha "quando usar" + esqueleto) antes de produzir.
Inventar um sistema editorial próprio é o erro que mais custa lote refeito; partir do catálogo resolve em
uma passada. **Sem formato escolhido do catálogo, não começa.**

Conferir sempre a lista **vivos e livres** no fim do catálogo — 14 formatos estão aposentados e 7
dependem de prova real de terceiro.

## Regras que valem pra todo o kit (inegociáveis)

- **Prova e dado.** Peça pública usa só prova real (print verdadeiro, número com fonte, interface real).
  Material didático pode usar cenário hipotético, desde que a peça diga que é hipotético. Dado que só o
  dono tem — preço, prazo, vagas, resultado, caso de cliente — nunca é inventado: vira pergunta ou
  `[A PREENCHER: o que falta]`. Sem prova real, a peça troca de formato ou sai do lote. Nunca
  placeholder publicável "pra trocar depois".
- **Zona morta de texto: 250px no topo e 250px na base.** Em story/reel 9:16 é obrigatório (a UI do
  Instagram cobre). Em feed e carrossel vale como padrão — se precisar invadir, só imagem ou elemento
  gráfico invade, nunca texto.
- **Rosto nunca cortado nem coberto por texto** (detalhe no QA abaixo).
- **Política da Meta.** Nunca afirmar atributo pessoal de quem vê ("você que está endividado", "você que
  tem diabetes"). Nomear o público pela profissão/situação ("Psicóloga:", "Dono de clínica:") ou falar em
  1ª pessoa. Nada de ganho ou cura garantidos; antes/depois corporal não.

## Os 4 formatos do Anúncio de Ouro

Um kit completo entrega **os quatro** (o usuário pode pedir um subconjunto):

| Formato | Dimensão | Uso | Observação |
|---|---|---|---|
| **Feed (estático)** | 1080×1350 (4:5) | Feed Instagram/Facebook, Meta Ads | Base do kit — 1 peça por ângulo |
| **Story (estático)** | 1080×1920 (9:16) | Stories IG/FB | Zona morta 250px topo e base, sem exceção |
| **Reel (9:16)** | 1080×1920 | Reels/Shorts/TikTok | A **capa** 9:16 faz parte do kit sempre; o vídeo de fato é com `roteiros-e-oratoria` |
| **Carrossel** | 1080×1350 × N slides | Feed carrossel | 6–8 slides: capa → desenvolvimento → oferta/escassez → CTA |

> "Apresentar resultado nos formatos Feed, Story e Reel (estáticos) **e** em Carrossel" é a assinatura do padrão.

### 5º formato — obrigatório quando o produto é LOW TICKET (produto de entrada)

Kit de low ticket leva ainda **2+ peças de Demonstração do Produto**: uma moldura (PNG com o miolo
transparente) por cima de uma gravação de tela mostrando o produto por dentro — faixa de dor/promessa em
cima, miolo transparente no meio, faixa de bônus + mockup + CTA embaixo. Mínimo 1 feed 1080×1080 + 1
story/reel 1080×1920, em 2 moldes diferentes quando o kit tiver 6+ criativos. Sai em `demonstracao/`
dentro da pasta do kit (HTML com `background: transparent` no miolo → PNG com
`python ScriptsFera/render.py png`). A gravação é o produto REAL rodando — nada de tela inventada.

Não substitui os 4 formatos acima — soma. Low ticket vende mostrando o produto por dentro.

## Os 6 pilares de qualidade (o que faz ser "de ouro")

1. **Fotos REAIS do dono** — nunca genérico. Rosto legível; cenários de autoridade (palco, sala de aula,
   ambiente de trabalho). Full-bleed com scrim OU foto-topo + bloco de texto.
2. **Design system coeso** — 1 paleta + tipografia editorial + textura sutil repetida em todos os
   formatos, de modo que Feed/Story/Reel/Carrossel pareçam a MESMA campanha. Paleta da marca: partir de
   `cor_primaria`/`cor_secundaria` do `perfil.json` (não colar a paleta do exemplo em todo mundo).
3. **Copy na VOZ do dono** — como ele fala de verdade, não voz genérica de agência. Estrutura fixa
   obrigatória: **headline → subheadline → contexto/bullets → ponte → CTA**.
4. **Checklist do lead preguiçoso, medroso e procrastinador em cada peça:** **A** anti-medo
   (garantia/prova real), **B** anti-procrastinação (urgência real/custo de não agir), **C** anti-preguiça
   (entrego pronto), **D** anti-problema-futuro (suporte/sem dor de cabeça depois). Se faltar um,
   reescrever antes de renderizar.
5. **Múltiplos ângulos** — um kit tem N ângulos **distintos**, não N variações da mesma ideia.
   Use a lista canônica dos 8 (abaixo). Mínimo num kit: **Dor + Transformação + Prova Social + Curiosidade**
   (Prova Social só com prova real — sem ela, ver "Linha NATIVA").
6. **QA visual + guarda-corpos** — conferir cada PNG antes de fechar (ver checklist). Nenhuma promessa
   proibida; todo número com fonte conferível.

### Gates estratégicos (antes de fechar o kit)

- **Política Meta:** antes de entregar criativos que vão pra Meta Ads, gerar `preflight-meta.md` na pasta
  do lote: cada peça marcada OK / Ajustar / Barrado (atributo pessoal, promessa de ganho/cura, antes/depois,
  número sem fonte, saúde/finanças sensíveis). Reescrever todo Ajustar/Barrado antes do render final.
- **Message match:** se o anúncio aponta pra landing, página de vendas ou WhatsApp com promessa
  específica, a primeira dobra do destino precisa repetir a promessa/oferta do criativo. Se quebrar,
  ajustar o criativo ou avisar o usuário pra ajustar o destino.
- **Voz do cliente:** se o briefing vier genérico, pedir ao usuário 5–10 frases reais do público
  (comentários, DMs, mensagens, perguntas de call) antes da matriz de ângulos.
- **Aposta declarada:** pra oferta nova ou público sem clareza, escrever qual premissa o kit está testando
  e transformar o principal risco em um ângulo de teste.
- **Custo:** geração de imagem usa a GEMINI_API_KEY do próprio usuário — avisar quantas imagens vai gerar
  antes de gerar.

## Os 8 ângulos canônicos

Mesmo produto, contado de 8 formas → 8 fatias de público, sem uma peça canibalizar a outra.

| # | Ângulo | O que é |
|---|---|---|
| 1 | **DOR / PROBLEMA** | amplia a frustração que a oferta resolve — **o que mais vende, sempre o 1º a testar** |
| 2 | **TRANSFORMAÇÃO** | antes × depois **tangível** (o olho precisa validar) |
| 3 | **AUTORIDADE** | credencial, tempo de estrada, volume já entregue |
| 4 | **COMUNIDADE** | pertencimento — "junte-se a quem já está dentro" |
| 5 | **URGÊNCIA / ESCASSEZ** | só se for **real e explicável** (ex.: 8 vagas/mês porque ilimitado não escala) |
| 6 | **CURIOSIDADE** | open loop que só fecha no clique |
| 7 | **PROVA SOCIAL** | depoimento, print, número real |
| 8 | **CONTRÁRIO / POLÊMICO** | desafia a crença do mercado |

**Manutenção:** o ângulo de Dor saturou? **Não troque o público — troque o ângulo.**

## Split test de hooks — 1 corpo, 5–7 aberturas

A jogada de maior alavancagem do kit: **mesma arte, só a headline muda.** 5–7 anúncios pelo custo de
produção de 1. No `build_ads.py`, isso é uma peça-base + uma lista de headlines, não 7 specs completas.

- Sobe cada hook como **anúncio separado** — senão não dá pra ler qual abertura ganhou.
- Nomeie pra ler depois: `<oferta>_<angulo>_hook<N>` (ex.: `mentoria_dor_hook03`).
- Leitura: no Gerenciador, comparar CTR do link e custo por resultado de cada hook com volume parecido.

## Linha NATIVA — 1–2 peças por lote que não parecem anúncio

O kit inteiro é design system caprichado. **Adicione 1–2 peças da linha oposta** por lote: cara de post
orgânico, nota, screenshot de material real, foto crua com texto simples — sem moldura, sem wordmark
grande, sem "cara de peça publicitária". (Pra story nativo de verdade, ver `anuncio-nativo`.)

Motivo: existe a tese de que o cérebro identifica anúncio em meio segundo e pula. **Não é verdade
revelada** (a tese oposta, do efeito halo, diz que design bom gera confiança) — por isso as duas linhas
rodam juntas e **o dinheiro decide**. Sem a peça nativa no lote, o teste nunca acontece.

> ⚠️ **Nativa NÃO é depoimento inventado.** O erro fácil é escrever a peça como um cliente fictício
> elogiando o produto. Isso é prova social fabricada — indefensável.
>
> A peça nativa parece orgânica **porque é texto cru sem design**, não porque finge ser alguém falando
> bem do produto. Formatos seguros: nota do autor, lista do que tem dentro sem adorno, "o que este
> material NÃO é", print de material real. Depoimento só com material real (print de conversa,
> comentário real, DM real, com autorização) — e aí é o ângulo Prova Social.
>
> **Quando ainda não há comprador**, o lote roda sem Prova Social e usa **prova pelo material** (índice
> real, páginas reais, contagens conferidas). O ângulo 7 entra depois da primeira venda real.

## Catálogo de 40 formatos de layout — `reference/formatos-de-anuncio.md`

Cada um dos 40 tem linha "quando usar" e esqueleto de layout parametrizado (as imagens de referência
originais eram anúncios de marcas reais e não vêm no FERABOT — o esqueleto em texto basta).

Como usar no fluxo:

1. Na etapa de conceito, escolha os formatos e **mostre ao usuário** o esqueleto antes de produzir.
2. O formato define o **layout**; a estrutura de copy (headline com público nomeado → sub →
   contexto/bullets → ponte → CTA) e o checklist A/B/C/D continuam valendo por cima, sem exceção.
3. Se uma camada virar prompt de imagem: escrever em inglês, descrever a cena e a física do objeto
   literalmente, dizer o que NUNCA pode aparecer (texto, logo, mãos extras), e nunca pedir ao modelo que
   escreva a headline.

**Guarda-corpo de prova social.** O formato **33** (falso print de matéria de jornal) é **proibido** —
imita a identidade de um veículo real. Os formatos **03, 06, 09, 11, 15, 16, 17, 19, 24, 29 e 38** só
entram **com depoimento/print/comentário que existe de verdade e está arquivado**; sem material real,
escolher outro formato. Estatística (10, 13, 18, 22, 26, 30, 35) só com fonte nomeada.

Atalhos úteis por situação:
- Oferta de mentoria/consultoria → **23** (manifesto) e **36** (quadro branco: vende o mecanismo).
- Funil onde a oferta só aparece na DM/VSL → **39** (curiosidade pura, zero oferta no criativo).
- Linha nativa do lote → **34** (Notas do iPhone), **40** (post-it).
- Comparação → **31** (grade).
- Low ticket mostrando volume → **27** (checklist de benefícios), **28** (setas apontando).

## Territórios visuais — 3 nomeados por lote (regra dura)

O catálogo define **layout** (onde cada coisa fica). Território visual define **estética** (paleta,
textura, grid, peso tipográfico, granulação, temperatura da luz). São eixos diferentes — o mesmo formato
23 pode sair em três territórios e parecer de três anunciantes distintos.

**Por que é regra em anúncio:** variação de layout com a mesma estética continua lendo como "o mesmo
anunciante insistindo". Quem quebra fadiga de criativo é a variação **estética**. Trocar só a headline
não renova nada — o scroll reconhece a peça antes de ler.

**Todo lote sai com no mínimo 3 territórios nomeados e deliberadamente distantes entre si.** Nomear é o
que trava as microdecisões: cor, ruído, grid e peso saem do nome, não de adjetivo genérico ("moderno",
"clean", "premium" não são território).

| Território | O que ele trava |
|---|---|
| **Editorial de papel** | Papel creme, serifa alta, ar de 40%, acento raro, foto com grão |
| **Risograph zine** | 2–3 tintas chapadas fora de registro, textura de papel, sem gradiente |
| **Sinalização de aeroporto** | Sans pesada, setas, alto contraste, grid rígido, zero foto |
| **Terminal / dado cru** | Mono, fundo escuro, números grandes, réguas finas, verde/âmbar de fósforo |
| **Print de conversa** | UI nativa, balões, timestamp, screenshot-like (só com material real) |
| **Caderno de campo** | Manuscrito, marcação a mão, post-it, papel pautado |
| **Clínico** | Branco, azul frio, ícone de linha, tipografia neutra, muita margem |

Como aplicar:
1. Na etapa de conceito, **junto** com os 1–3 formatos do catálogo, propor os 3 territórios e mostrar ao
   usuário antes de produzir.
2. Formato × território é combinação: `23 · manifesto` em *editorial de papel*, *terminal* e *risograph*.
3. O Brand DNA (Passo 0) tem precedência — território escolhe a **variação dentro** do que a marca
   permite, nunca contra a paleta e a tipografia travadas.

**Fonte de referência:** estrutura de anúncio vem da **Biblioteca de Anúncios da Meta**
(facebook.com/ads/library — anúncio que está rodando de verdade). Pinterest/Dribbble só pra acabamento
(textura, grid, tipografia), nunca pra decidir a estrutura.

## Passo 0 — Brand DNA (obrigatório, antes de qualquer conceito)

Nenhum lote começa sem o DNA visual da marca em disco: **cor com hex, tipografia, luz da foto, slot do
produto e regras duras**, para que dois lotes da mesma marca saiam iguais sem redecidir.

**Onde vive:** `output/anuncios/marca/<slug>/brand-dna.md` + `output/anuncios/marca/<slug>/product-dna/<oferta>.md`
(slug = nome da marca do `perfil.json`, ou do cliente).

1. **Existe?** → ler os dois arquivos inteiros e segurar cor/tipografia/regra dura como contexto vivo.
2. **Não existe?** → montar em 2 minutos antes de produzir:
   - Ponto de partida: `perfil.json` (nome, nicho, produto, preço, cores, landing).
   - Pedir **a URL da marca** (ou "manual"). Com URL (a `landing_page` do perfil serve): ler a home + uma
     página de oferta + a página "sobre"; extrair voz (5 adjetivos do jeito que a marca escreve de
     verdade), sistema de cor com **hex** (estimado se preciso), tipografia descrita por estilo/peso,
     fotografia (luz, cenário, enquadramento), público em uma frase, e 4 **Hard Rules** (2 "sempre",
     2 "nunca").
   - Escrever `brand-dna.md` e `product-dna/<oferta>.md` **separados** — identidade da marca não é fato
     de produto. Marcar com ⚠️ tudo que foi assumido.
   - Confirmar em UMA mensagem compacta (nome, voz, cores, oferta) e seguir.
3. **Marca ganhou fato novo** (cor nova, foto nova, regra travada) → editar o `brand-dna.md`, não abrir
   arquivo paralelo.

### ⛔ Auditar o acervo de fotos ANTES de prometer variação por peça

"Uma foto diferente em cada arte" quase nunca fecha. Contagem de arquivos não é contagem de fotos usáveis:

- foto de evento vira **silhueta perdida** em qualquer recorte de coluna;
- close de rosto vem **sem folga no topo na própria fonte** — corta a testa, e nenhum `object-position`
  conserta fonte cortada;
- acervo do feed é quase todo **slide com texto queimado**, foto de família ou foto com terceiros.

**Antes de aceitar "uma foto por peça", rodar a conta:** abrir cada candidata, testar no enquadramento
real da peça (não no thumbnail) e contar quantas passam em *rosto inteiro + sem texto queimado + sem
terceiros*. Se não fecha, dizer isso **antes** de produzir e oferecer: (a) fotos novas — meia hora de
celular com luz de janela resolve; (b) ensaio por IA ancorado no rosto real, só com pedido explícito do
dono, numa ferramenta que aceite imagem de referência, arquivo marcado `_PROVISORIA-IA`.

Quando o acervo não fecha, a variedade vem do **layout** (coluna direita / coluna esquerda / full-bleed)
com enquadramento diferente por peça — e isso se **declara** na entrega, não se disfarça.

## Passo 0.5 — Slot do produto (só para INFOPRODUTO / serviço)

Mentoria, consultoria ou implementação **não tem packshot**, e mockup de e-book flutuando é a estética
mais queimada que existe. Antes da copy, decidir **o que ocupa o lugar do produto**: 👤 pessoa ·
🖥️ tela (rótulo "Simulação" quando não for tela real) · ✍️ artefato (quadro, nota, post-it, diagrama) · ⬛ nada.

Dos 40 formatos, **12, 14 e 22** dependem de produto físico (descartar em serviço). Primeiros a testar em
alto ticket: **23 · 39 · 36 · 34 · 40 · 21**.

**Regra:** o slot é escolhido antes da copy. Peça que pede tela e não tem tela vira peça de slot ⬛ NADA —
não se inventa a tela.

## Passo 3.5 — Briefing pré-preenchido (produzir antes de perguntar)

Não perguntar "o que você quer que escreva". **Propor todo o texto de todas as peças de uma vez**, numa
mensagem só, e aceitar "vai" como aprovação de tudo.

- Cada slot (headline, sub, bullets, stat, quote, oferta, CTA) vem preenchido com valor concreto tirado de
  `brand-dna.md` (voz) e `product-dna/*.md` (claims, números).
- Slot que nenhuma fonte tinha: dado do dono (preço, prazo, resultado) vira `[A PREENCHER]`; texto de
  copy pode ser proposto, marcado com ⚠️. Em slot de PROVA é bloqueante: troca-se o formato por um ⬛/✍️.
- Abrir com: *"Briefing preenchido a partir do DNA da marca e da oferta. Item com ⚠️ fui eu que propus —
  prova com ⚠️ eu troco de formato. Diz 'vai' pra eu produzir, ou corrige o que quiser."*

## Duas regras de prompt de imagem

**Âncora de referência.** Quando a ferramenta aceita imagem de referência, o prompt abre travando a
imagem anexada como verdade, ANTES do pedido: *"A imagem de referência mostra exatamente o
[produto/pessoa/tela] que deve aparecer. Não inventar, alterar nem substituir — forma, rótulo, cores e
proporção idênticos."* (O `ScriptsFera/imagem.py` gera só por texto — serve pra cena, fundo e objeto, não
pra replicar rosto ou produto real.)

**Contraste declarado.** Escrever a cor do texto dentro do prompt, sempre: fundo claro → texto escuro;
fundo escuro → texto claro.

## Render híbrido — IA faz a imagem, HTML faz o texto (regra dura)

Anúncio de infoproduto é denso de texto. Modelo de imagem erra letra. **IA gera a camada de imagem**
(cena, objeto, fundo) via `python ScriptsFera/imagem.py "<prompt em inglês>" --ratio 4:5 --out assets/img-01.png`
(GEMINI_API_KEY no `.env`; sem chave, o kit sai só com as fotos reais) · **HTML/Playwright rende a camada
de texto** por cima. **Nunca** pedir ao modelo de imagem que escreva a headline.

## Pipeline de produção (HTML → PNG via Playwright)

Padrão DRY: **1 design system (CSS) + 1 gerador (Python) com uma lista de specs + 1 render (Playwright)**.
Rápido, versionável e consistente. Nunca desenhar 10 peças à mão. Molde pronto em `reference/`
(ver `reference/GENERATORS.md`).

1. **Coletar contexto**: oferta (preço, garantia, entregáveis, escassez — só o que for real), voz do
   dono, dados-âncora com fonte, contato/CTA (WhatsApp/link). Fonte: `perfil.json` + o que o usuário mandar.
2. **Copiar as fotos** pra `assets/` da pasta do lote, com nomes limpos (p1, p2…). Escolher
   `object-position` por foto pra não cortar o rosto.
3. **Escrever as specs** (uma lista de dicts): id, layout, accent, foto, objpos, tag, headline, sub,
   body(bullets|contexto), ponte, price(âncora/valor/cond), cta, selo.
4. **Gerar** os HTML a partir de 1 template + o CSS do design system, que expõe a estética como **tokens
   CSS** (abaixo) — o território entra trocando o bloco de tokens, não o template.
5. **Renderizar** com Playwright (`device_scale_factor=2`): PNG master + JPG q92 em `jpg/` (pronto pra
   subir no Gerenciador).
6. **QA visual** — folha de contato do lote inteiro, corrigir overflow/enquadramento, re-renderizar.
7. **Entregar a pasta local** (mostrar o caminho absoluto). Subir no Drive/WhatsApp é manual e opcional.
   Opcional: `python ScriptsFera/metas-api.py entrega add "anuncios-de-ouro" "<o que foi>" --link "<pasta>"`.
8. **Subir (opcional):** manual no Gerenciador de Anúncios, ou com a skill `meta-ads-fera` se
   `META_ACCESS_TOKEN` e `META_AD_ACCOUNT_ID` estiverem no `.env`. Sempre PAUSADO primeiro.

### Tokens CSS — a estética é variável, não hardcode (regra dura)

Nenhuma cor, peso ou tracking entra cravado na regra CSS. O design system abre com um bloco de tokens em
`:root`, e **território visual = um bloco de tokens**:

```css
:root {
  --paper: #F4EFE6; --ink: #14110E; --accent: #FF4F00;
  --font-display: "Fraunces", serif; --font-ui: "Archivo", sans-serif;
  --kicker-track: .18em; --headline-weight: 800; --grain: .06;
}
```

Com tokens, "clareia o papel, engorda a headline, tira o grão" é uma troca de bloco e um re-render de
segundos — dá pra rodar **a mesma copy aprovada em 4 paletas** como teste barato.

Regras:
- Toda peça do lote lê os mesmos nomes de token; muda o valor, nunca o seletor.
- O gerador (Python) recebe o território como um dict de tokens e injeta no `<style>` da peça.
- Variação de token **não substitui** cobertura de ângulo — é teste dentro do mesmo ângulo.

### Ambiente (gotchas)
- **Playwright é via Python** (`from playwright.sync_api import sync_playwright`). Se faltar:
  `pip install playwright && python -m playwright install chromium` (o `ScriptsFera/render.py` instala sozinho).
- **Windows + acento:** gravar todo arquivo com `encoding="utf-8"` e rodar Python com `PYTHONUTF8=1` se
  o terminal reclamar de caractere.
- **Assets em HTML renderizado:** caminho de imagem é relativo ao arquivo `.html`, não ao script. Se os
  HTMLs ficam em `html/`, usar `../assets/...`; carrossel em subpasta por ID sobe **dois** níveis
  (`../../`). Conferir a folha de contato pra pegar imagem ausente que vira bloco vazio.

## QA — checklist antes de fechar

### A. Os 8 pontos (responder em voz alta — qualquer "não" volta pra prancheta)
- [ ] 1. A ideia é entendida em **menos de 1 segundo**?
- [ ] 2. Tem um elemento que **para o scroll** (rosto, contraste forte, frase de impacto)?
- [ ] 2.0. Tem gancho visual antes da leitura (imagem, cena, objeto, print, interface)? Arte só
      tipográfica reprova, salvo formato copy-first escolhido de propósito (01, 21, 23, 39).
- [ ] 2.1. A escala visual está agressiva o bastante no thumbnail da folha de contato? Espaço negativo é
      bom; arte vazia, letra pequena e elemento perdido no canvas reprovam.
- [ ] 2.2. O bloco principal está no centro óptico da área útil? Assimetria só se parecer intencional.
- [ ] 3. **Teste do fundo preto:** a headline sozinha num fundo preto ainda chama? Se não, **reescreve a
      headline**, não o layout.
- [ ] 4. Tem pelo menos **uma prova** visual ou social (real)?
- [ ] 5. O CTA é **conversacional, sem grito**? (nunca "COMPRE AGORA")
- [ ] 6. Ativa pelo menos **uma emoção** — desejo, medo ou alívio? Se está neutra, descarta.
- [ ] 7. Tem **identificação**? A pessoa sente que foi feito pra ela?
- [ ] 8. A peça vende o **resultado**, não as features/módulos? (venda o destino, não o barco)

### B. Técnico

> **Guarda de estouro automática no render (obrigatória).** Conferir 20+ peças no olho não funciona —
> preço e CTA truncados só aparecem quando alguém abre o PNG. Medir no Playwright, antes do screenshot:
> ```python
> folga = pagina.evaluate("""() => {
>   let medidos = 0, pior = 99999;
>   const i = document.querySelector('.inner');
>   if (i) { medidos++; pior = Math.min(pior, i.clientHeight - i.scrollHeight); }
>   const h = document.querySelector('.hero');   // a heroi tambem precisa caber
>   if (h) { medidos++; pior = Math.min(pior, h.clientHeight - h.scrollHeight); }
>   return medidos ? pior : -99999; }""")
> if folga < 0: print(f"!! ESTOURO {nome}: {folga}px")
> ```
> Medir **só o `.inner` não basta**: grade de imagens com `aspect-ratio` fixa vaza por cima do texto sem
> mudar o `scrollHeight` do pai. Por isso a heroi entra na conta.
>
> ⚠️ **GUARDA CEGA É PIOR QUE GUARDA REPROVANDO.** Ao trocar o layout, os seletores do medidor deixam de
> casar e a guarda passa a devolver "zero estouros" sem medir nada. Duas travas:
> 1. **Contar quantos elementos foram medidos.** Zero = `-99999`, ou seja **reprova**.
> 2. **Desconfiar de folga suspeita.** Se TODAS as peças dão exatamente o mesmo número, conferir o seletor.
>
> Sempre que o layout mudar, **rodar a guarda contra uma peça que você sabe que estoura** — se passar, a
> guarda está quebrada, não a peça.
>
> **Contraste a guarda não vê:** um bloco com `background` herdado de outro layout pode cobrir o fundo e
> deixar texto escuro sobre escuro — folga 0, peça ilegível. **Contraste só se confere olhando o PNG.**
>
> ⚠️ **`min-height:0` no heroi faz a IMAGEM SUMIR — e a guarda não acusa.** Headline mais longa empurra o
> heroi `flex` com `min-height:0`, que **encolhe até zero** em vez de estourar. Encolher não é estourar.
> **Regra:** todo bloco que **PRECISA aparecer** leva `min-height` real (ex.: `min-height:392px` num
> 1080×1350). Aí headline grande demais volta a ser estouro de verdade e a guarda pega.
>
> A guarda numérica não vê contraste nem elemento que sumiu. **A folha de contato do lote inteiro pega os
> dois** — etapa obrigatória, não opcional.

> **Layout que não estoura:** `.inner` em coluna com topo (`flex:0 0 auto`), heroi
> (`flex:1 1 auto; min-height:<real>`) e base (`flex:0 0 auto`). A imagem cede espaço e o preço/CTA ficam
> ancorados. Grade de capas: `grid-template-rows` + `height:100%` + imagem com `height:100%; object-fit:cover`
> — nunca `aspect-ratio` nos filhos. Se estourar mesmo assim, **corte bullet antes de encolher fonte**:
> 3 bullets é o teto do feed com mockup, 2 com grade de capas.

> ⚠️ **BLOCO ABSOLUTO NÃO CLIPA — medir `scrollHeight` dele MENTE.** Em layout com `position:absolute`,
> o `scrollHeight` acusa 8–13px a mais por overhang de glifo itálico e `letter-spacing` — reprova peça
> perfeita. Em layout absoluto o risco real é **colisão**; medir a distância entre os blocos:
> ```js
> const h = document.querySelector('h1'), pe = document.querySelector('.pe');
> if (h && pe) { medidos++;
>   const gap = pe.getBoundingClientRect().top - h.getBoundingClientRect().bottom;
>   if (gap < pior) { pior = gap; } }
> ```
> **Só entra no medidor de estouro o que de fato clipa** (container com `overflow:hidden`). O que é
> absoluto entra no medidor de **colisão**. Misturar os dois gera falso positivo — e falso positivo treina
> a ignorar a guarda.

- [ ] Rodou o render e **zero estouros** reportados.
- [ ] Rodou folha de contato e reprovou peça com muito branco morto, fonte pequena, objeto mal
      centralizado ou peso visual tímido. Negativo sim, vazio não.
- [ ] Na folha de contato, cada thumbnail tem um gancho visual dominante antes da leitura da copy.
- [ ] Em story, o bloco principal está no centro da área segura, não do canvas inteiro.
- [ ] **ROSTO NUNCA CORTADO — reprova a peça.** Cabeça inteira no quadro: testa, cabelo, queixo, as duas
      orelhas, com folga (~10% da altura). Vale contra a borda do canvas E contra qualquer
      painel/bloco/faixa por cima. **Nenhum texto sobre o rosto.**
      - `object-fit: cover` cego é a causa raiz. **Recompor**: ancorar a foto embaixo, reduzir a altura
        dela e deixar fundo chapado da marca ACIMA da cabeça. Se a fonte não tem folga, não existe
        `object-position` que resolva.
      - **Conferir a FONTE antes de usar.** Foto gerada por IA quase sempre vem com a cabeça encostada no topo.
      - **Guarda automática:** detectar o rosto no PNG renderizado com OpenCV (o modelo YuNet já vem em
        `~/.claude/skills/anuncio-nativo/motor/face_detection_yunet_2023mar.onnx`; alternativa:
        `haarcascade_frontalface_default.xml` de `cv2.data.haarcascades`), expandir a caixa pra aproximar
        a cabeça e separar **CABEÇA CORTADA** (reprova) de **folga curta** (aviso).
      - Conferir no **PNG renderizado**, nunca no HTML.
- [ ] **Zona morta:** nenhum texto nos 250px do topo nem nos 250px da base (story: obrigatório).
- [ ] Sem overflow: rodapé/preço/CTA visíveis, texto não estourando o card.
- [ ] Preço em 1 linha (`white-space:nowrap` no valor grande quando o CTA for longo).
- [ ] Estrutura fixa presente + A/B/C/D presentes em cada peça.
- [ ] Carrossel: capa com "arraste →", numeração de página, capa+CTA com foto, coesão visual.
      **Cada card é um hook** e o CTA fica só no último.
- [ ] Guarda-corpo: sem promessa proibida; números com fonte; nenhum `[A PREENCHER]` esquecido em peça final.

### C. Cobertura do lote
- [ ] Ângulos cobrem no mínimo **Dor + Transformação + Curiosidade** (+ **Prova Social** se houver prova real).
- [ ] O lote tem **no mínimo 3 territórios visuais nomeados** e distantes entre si. Os nomes aparecem no RESUMO.
- [ ] O design system está em **tokens CSS** — dá pra trocar paleta/peso sem editar seletor.
- [ ] Tem **1–2 peças da linha nativa** pra testar contra o design system.
- [ ] Se houver split test de hooks: cada hook é um **anúncio separado**, nomeado `<oferta>_<angulo>_hook<N>`.

## Convenção de pastas

Tudo dentro de `output/` na raiz do FERABOT (pra cliente: `output/anuncios/ouro/<cliente>/...`):

```
output/anuncios/ouro/AAAA-MM-DD-<tema>/
├── assets/                 # fotos reais do dono (p1…, pN) + imagens IA
├── styles.css              # design system (feed)
├── build_ads.py            # specs + gerador (feed)
├── render.py               # Playwright → PNG + jpg/*.jpg
├── ad-*.png / jpg/*.jpg    # feed
├── stories/  (stories.css + build_stories.py + render.py)
├── carrosseis/ (carrossel.css + build_carrosseis.py + render.py)
├── demonstracao/           # só low ticket
├── preflight-meta.md
└── RESUMO.md               # tabela de ângulos + territórios + oferta usada + guarda-corpos
```

## Molde de referência

`reference/` desta skill tem um design system completo funcionando (`feed.css`, `story.css`,
`carrossel.css`) + geradores de exemplo com uma oferta **hipotética** (todos os dados do dono como
`[A PREENCHER]`) + `GENERATORS.md` com o passo a passo.

## O que esta skill NÃO faz
- Vídeo, VSL, talking-head, reel animado → `roteiros-e-oratoria`.
- Story ad com cara de post nativo → `anuncio-nativo`.

---

## Regras duras de criativo (obrigatórias)

1. **Headline com identificação imediata + dor/desejo.** Toda headline (na arte E no título do anúncio)
   nomeia o público ("Psicóloga:", "Dono de clínica:", "Corretor:", "Nutricionista:") e menciona
   diretamente uma dor ou um desejo. Headline de produto/feature sem público nomeado = reprovada.
2. **Estrutura fixa do estático:** headline → subheadline → bullets OU contexto → ponte → CTA. Nunca
   listar o que vem no acesso ("inventário") antes de gerar desejo.
3. **Criativo de low ticket precisa das 3 forças:** CURIOSIDADE (levar pro próximo passo), QUANTIDADE de
   coisas dentro do produto, e FACILIDADE (já vem pronto).
4. **Funil de DM/VSL (oferta só aparece no final):** o criativo NÃO fala da oferta — só curiosidade que
   leva ao próximo passo. Exemplo hipotético de estrutura: "Esqueça cursos e mentorias. Existe um jeito
   mais simples de [resultado]. Eu te mostro em poucos segundos."
5. **Mix de teste recomendado: mínimo 3 imagens + 3 vídeos por conjunto.** Sem vídeo pronto, um estático
   aprovado + narração + trilha fecha o gap (`roteiros-e-oratoria`). Em vídeo derivado de estático **denso
   de texto**, nada de zoom vai-e-volta (corta a leitura): câmera parada + texto entrando em estágios
   sincronizado com a narração.
6. **Vídeo de anúncio sempre com narração** + trilha. Vídeo mudo ou só com trilha não sobe.

---

## Anúncio CTWA (Click-to-WhatsApp) pela API — o que quebra em silêncio

Vale pra quem sobe pela API (`meta-ads-fera`). Cada ponto abaixo já custou lead real.

### 1. A mensagem pré-preenchida NÃO vem do link

`https://api.whatsapp.com/send?phone=X&text=Y` — a Meta **ignora o `text=`** em anúncio com
`destination_type: WHATSAPP`. O lead chega com o padrão dela, *"Olá! Posso ter mais informações sobre
isso?"*, que atrai curioso.

Quem manda é **`object_story_spec.link_data.page_welcome_message`**, uma string JSON:

```json
{"type":"VISUAL_EDITOR","version":2,"landing_screen_type":"welcome_message","media_type":"text",
 "text_format":{"customer_action_type":"autofill_message",
 "message":{"autofill_message":{"content":"<a frase que o lead envia>"},
            "text":"<a mesma frase>","quick_replies":[]}}}
```

A API aceita e persiste verbatim — mas **aceitar não prova que a Meta usa**. A prova é a 1ª mensagem do
próximo lead real. Conferir antes de escalar verba.

### 2. Campos hoje OBRIGATÓRIOS que antes eram opcionais

| Nível | Campo | Erro se faltar |
|---|---|---|
| campanha | `is_adset_budget_sharing_enabled` | `4834011` |
| conjunto | `bid_strategy` | `2490487` |
| conjunto | `targeting.targeting_automation.advantage_audience` (0 ou 1) | `1870189` |
| conjunto | com Advantage+ ligado, **não** mandar `age_max` < 65 | `1870189` |

### 3. Aprimoramentos automáticos: opt-out é recurso a recurso

`standard_enhancements` foi **descontinuado** e a API recusa o criativo. Desligar um a um:
`image_touchups`, `image_brightness_and_contrast`, `image_templates`, `text_optimizations`,
`enhance_cta`, `media_type_automation`. **Sem opt-out a Meta recorta e reescreve peça desenhada.** Deixar
fallback que reenvia sem o spec se a Meta recusar algum nome (os nomes mudam).

### 4. A página do anúncio tem que ser a do número

CTWA entrega no WhatsApp conectado à **Página** escolhida no conjunto, e a Graph API não informa qual é.
Só a tela do Gerenciador mostra, na seção **Conversão** do conjunto. Conferir ANTES de criar o anúncio.

### 5. Trocar criativo sem perder aprendizado

`POST /{ad_id}` com `creative: {"creative_id": novo}` mantém o anúncio e o histórico de entrega. Criar
anúncio novo zera. O anúncio volta pra `PENDING_REVIEW` — normal.

### 6. Se o destino for um atendente automático, o anúncio é metade do trabalho

Custo por conversa bom não significa funil funcionando. **Ler as primeiras conversas inteiras antes de
escalar verba** — um filtro mal configurado no atendimento pode barrar todo lead qualificado.
