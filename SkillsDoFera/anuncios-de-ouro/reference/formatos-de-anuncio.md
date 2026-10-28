# Catálogo de 40 formatos de anúncio estático

Biblioteca de **layouts** de anúncio estático, cada um com "quando usar" + esqueleto de layout
parametrizado. As imagens de referência originais eram anúncios de marcas reais e não são distribuídas
aqui — o esqueleto em texto descreve o layout por completo.

Adaptado do `ad-director-kit` (mrdainami).

---

## Como usar (Diretor)

1. **Na etapa de conceito**, varra este catálogo e proponha **1–3 formatos** que sirvam ao briefing.
2. **Mostre ao usuário** o esqueleto + a linha "quando usar" antes de produzir qualquer peça. Se ele
   quiser ver um exemplo, montar um rascunho rápido em HTML com o esqueleto (sem gastar crédito).
3. **O esqueleto NÃO é prompt pronto.** Ele assume "use as imagens anexas como referência de marca".
   Antes de gerar imagem:
   - Escreva o prompt em inglês, nomeando cada imagem anexa pelo papel (Image 1 = produto/pessoa,
     Image 2+ = referências da marca), se a ferramenta aceitar anexo.
   - Injete a voz do dono e a **física do produto literal** (forma, rótulo, cor, tamanho).
   - Troque cada `[PLACEHOLDER]` por valor concreto do briefing — dado que só o dono tem e não veio
     vira `[A PREENCHER]` e pergunta, nunca chute.
   - Diga a escala dos elementos e o que NUNCA pode aparecer (texto gerado, logo de terceiro, mãos extras).
   - Texto da peça sai em HTML por cima da imagem, não do modelo de imagem.
4. **Proporção é sugestão.** O formato manda no layout; a proporção vem da campanha
   (feed 1080×1350 · story/reel 1080×1920 · quadrado 1080×1080).

---

## ⚠️ Regra 1 — o formato define o LAYOUT, não a COPY

Este catálogo **não revoga** a regra dura de criativo do workspace. Toda peça continua obrigada a:

1. **Headline com identificação imediata do público + dor/desejo direto.** Nomear o público na headline
   ("Empresário:", "Maestra:", "Corredor:", "Psicóloga:", "Mamá:"). Headline de produto sem público
   nomeado é reprovada — inclusive nos formatos que o original abre com claim genérica.
2. **Estrutura fixa:** headline → subheadline → bullets/contexto → ponte → CTA.
3. **Checklist A/B/C/D** (anti-medo · anti-procrastinação · anti-preguiça · anti-problema-futuro).
4. Modelos "inventário" e "que-no-es" continuam **CANCELADOS** — nenhum formato daqui autoriza listar
   o que vem no acesso antes de gerar desejo.

Ou seja: o formato 31 (grade de comparação) continua abrindo com `Empresário:` — o layout muda, o esqueleto de copy não.

5. **Política da Meta:** nada de afirmar atributo pessoal de quem vê ("você que está endividado"); nomear o
   público pela profissão/situação ou falar em 1ª pessoa.

---

## 🚫 Regra 2 — lista negra de prova social fabricada

Vários formatos do acervo original pedem **review, comentário, print ou manchete inventados**. Regra de
prova e dado: peça pública usa só prova real · material didático pode usar cenário hipotético declarado na
própria peça · dado que só o dono tem (preço, resultado, caso) vira `[A PREENCHER]` e pergunta · sem prova
real, a peça sai do lote. Em saúde, finanças e outras áreas reguladas, vale também a regra do conselho/órgão
da profissão.

**Adotar o layout. Nunca o conteúdo fabricado.**

| Status | Formatos | Regra |
|---|---|---|
| 🚫 **Proibido inteiro** | **33** (falso print de matéria) | Imita a identidade de um veículo real. É falsificação, não criativo. Não usar em nenhum cliente. |
| 🟡 **Só com material REAL** | 03, 06, 09, 11, 15, 16, 17, 19, 24, 29, 38 | Layout liberado; o depoimento/print/comentário tem que existir de verdade e estar arquivado (com autorização de quem falou). Sem material real → escolher outro formato. |
| 🟡 **Só com fonte nomeada** | 10 ("As Featured In"), 13, 18, 22, 26, 30, 35 (barras de estatística) | Só entra veículo que de fato publicou; todo número precisa de fonte checável. |
| 🟡 **Enquadramento editorial** | 20 (advertorial) | O visual pode parecer conteúdo orgânico; a **claim** tem que ser verdadeira e sustentável. |
| ✅ **Livre** | Todos os demais | Valem as regras 1 e 4. |

Em produto de saúde: nunca prometer cura nem resultado garantido.

---

## Regra 3 — mix de teste

O catálogo é de estáticos. A regra do mix continua: **mínimo 3 imagens + 3 vídeos por campanha**, e
**todo vídeo sai com narração**. Em low ticket, o kit ainda exige **mínimo 2 peças de Demonstração do Produto**
(moldura sobre gravação de tela do produto real — ver `anuncios-de-ouro`) — este catálogo não substitui isso.

---

## Índice por família

| Família | Formatos |
|---|---|
| **Copy-first** (a escrita é o anúncio) | 01 · 21 · 23 · 39 |
| **Oferta / promoção** | 02 · 35 · 37 |
| **Prova social** | 03 · 06 · 09 · 11 · 15 · 16 · 17 · 19 · 24 · 38 |
| **Comparação** | 07 · 25 · 31 |
| **Educacional / anotado** | 04 · 05 · 27 · 28 · 36 |
| **Dados / estatística** | 13 · 18 · 26 · 30 |
| **Nativo / UGC** (finge que não é anúncio) | 08 · 20 · 29 · 32 · 33 · 34 · 40 |
| **Produto / lifestyle** | 10 · 12 · 14 · 22 |

---

# Os 40 formatos

## 01 — Headline pura
**Quando usar:** teste de renderização de texto. Se voltar limpo, o modelo aguenta copy pesada. Bom primeiro teste com cliente novo.
**Status:** ✅ livre
**Esqueleto:** fundo `[COR]`. Terço superior: headline sans-serif bold enorme com `[PÚBLICO]: [DOR/DESEJO]` (≤10 palavras). Abaixo, menor: `[SUBHEADLINE, uma frase]`. Metade inferior: `[PRODUTO]` sobre a superfície com `[DETALHES]`. 50mm f/2.8, levemente de cima. Logo `[MARCA]` inferior direito. Limpo, autoritário.

## 02 — Oferta / promoção
**Quando usar:** o formato que faz dinheiro. Para testar a oferta central.
**Status:** ✅ livre
**Esqueleto:** fundo dividido — 60% superior em `[COR PRIMÁRIA]`, 40% inferior em `[COR DE CONTRASTE]`. `[PRODUTO]` centralizado onde as cores se encontram, luz de estúdio suave. Área superior: sans-serif grande em `[COR DE TEXTO]` com `[OFERTA]`. Abaixo: `[DETALHES DA OFERTA]`. Rodapé: texto pequeno com `[ITENS DE VALOR AGREGADO]`. Logo inferior direito.

## 03 — Depoimento em ambiente real
**Quando usar:** ambiente real + texto sobreposto. Testa profundidade de composição.
**Status:** 🟡 só com depoimento real
**Esqueleto:** cena em `[AMBIENTE]` com luz natural quente. `[PRODUTO]` sobre `[SUPERFÍCIE]`, levemente fora de foco. Sobreposto: `[HEADLINE CURTA]` em sans-serif branco bold. Abaixo: `"[CITAÇÃO REAL, 2-3 frases]" — [NOME], [CREDENCIAL]`. Cinco estrelas preenchidas em `[COR DA MARCA]`. Logo inferior direito em branco. 35mm f/2.0.

## 04 — Diagrama de recursos / benefícios
**Quando usar:** layout educacional tipo diagrama. Explica mecanismo.
**Status:** ✅ livre
**Esqueleto:** fundo branco. Topo: `[HEADLINE — o que torna [PRODUTO] diferente]` em bold `[COR DA MARCA]`. `[PRODUTO]` centralizado, luz de estúdio uniforme. Quatro caixas de callout ligadas por linhas: `[BENEFÍCIO 1-4]`, cada uma com um círculo pequeno na cor da marca. `[SITE]` centralizado no rodapé. Diagrama científico redesenhado por agência de luxo.

## 05 — Lista de benefícios (split)
**Quando usar:** composição dividida. Produto à esquerda, benefícios à direita. Denso e escaneável.
**Status:** ✅ livre
**Esqueleto:** fundo `[COR]`. 40% esquerda: `[PRODUTO]` sobre `[SUPERFÍCIE]`, 85mm f/2.8. 60% direita: pilha vertical de cinco linhas com marcadores circulares em `[COR DA MARCA]`: `[BENEFÍCIO 1-5]`. Sans-serif limpo, espaçamento generoso. Logo inferior direito.

## 06 — Pilha de prova social
**Quando usar:** contagem de membros + card de review + logos de imprensa. A pilha de confiança inteira.
**Status:** 🟡 só com números e review reais
**Esqueleto:** fundo `[COR CLARA]`. Topo: `[HEADLINE com número REAL de clientes/alunos]` em bold `[COR DA MARCA]`. Cinco estrelas + "Avaliado [X] de 5". Centro: `[PRODUTO]` a 50mm f/4. Abaixo: card branco fosco com estrelas, `[TÍTULO DO REVIEW]`, `[REVIEW REAL 2-3 frases]`, `[ATRIBUIÇÃO]` em itálico. Abaixo do card: "Já apareceu em" + logos em escala de cinza **de veículos que publicaram de fato**.

## 07 — Nós vs Eles
**Quando usar:** comparação lado a lado. A diferença de qualidade fotográfica **é** o argumento.
**Status:** ✅ livre
**Esqueleto:** dividido verticalmente. Esquerda: fundo cinza-azulado fosco. Direita: `[COR PRIMÁRIA]`. Topo central: círculo branco com "VS". Cabeçalho esquerdo: `[CATEGORIA DO CONCORRENTE]` + produto genérico + lista com X: `[FRAQUEZA 1-5]`. Cabeçalho direito: `[MARCA]` + `[PRODUTO]` + lista com checks: `[FORÇA 1-5]`. Logo inferior direito.
**Nota:** headline por cima continua nomeando o público. Nunca citar concorrente pelo nome — usar categoria genérica.

## 08 — Antes e depois (UGC nativo)
**Quando usar:** transformação em selfie de espelho. Tem que parecer post de pessoa real.
**Status:** ✅ livre (se a transformação for real)
**Esqueleto:** use as refs só para a cor do produto. **Isto deve parecer post de pessoa real.** Antes/depois estilo TikTok. ESQUERDA: selfie de espelho granulada de celular, `[PESSOA]` em ambiente mal iluminado, `[ESTADO ANTES]`, luz dura. Texto branco manuscrito: `[DATA ANTES]`. DIREITA: mesma pessoa, mesmo ambiente, luz natural, `[ESTADO DEPOIS]`, `[PRODUTO]` visível. Texto: `[DATA DEPOIS]`. Topo central: `[PRAZO] com [MARCA]`. Parece montado no CapCut.

## 09 — Marketing negativo (isca e virada)
**Quando usar:** review que soa ruim mas é elogio. Para o scroll.
**Status:** 🟡 só com review real
**Esqueleto:** fundo é close do `[PRODUTO]`, levemente desfocado. Centro: card branco de review com cantos arredondados. Ícone de usuário cinza, `[NOME]`, uma estrela dourada + quatro cinzas, selo "Compra verificada", texto bold: `[ISCA que soa negativa mas é positiva]`. Rodapé: `[PUNCHLINE]` em sans-serif branco bold. Logo inferior direito.
**Nota:** a frase-isca tem que ser uma citação real de cliente. Sem review real, use o formato 39.

## 10 — Imprensa / editorial
**Quando usar:** jogada de autoridade. Energia de contracapa de revista.
**Status:** 🟡 só veículo que publicou de fato
**Esqueleto:** fundo linho off-white. Topo: "Já apareceu em" em caixa alta pequena com tracking largo. Abaixo: logos em escala de cinza. Centro: citação de imprensa em serifada itálica com atribuição. Terço inferior: `[PRODUTO]` a 85mm f/2.8, luz lateral suave. Logo inferior esquerdo. Muito espaço em branco.

## 11 — Card de review com citação em destaque
**Quando usar:** citação emocional gigante sobre um card de review truncado. O "...Ler mais" abre um loop.
**Status:** 🟡 só com review real
**Esqueleto:** bloco de cor sólida `[COR DA MARCA, tom suave]` preenchendo a imagem. Metade superior: `"[CITAÇÃO — a frase de 4-8 palavras mais emocional do review real]"` em serifada itálica branca bold com aspas curvas. Abaixo: cinco estrelas douradas grandes. Inferior esquerdo, sobrepondo o fundo: card branco arredondado com avatar cinza, `[PRIMEIRO NOME + INICIAL]`, selo de verificado, corpo do review em 4-6 linhas terminando em "...Ler mais". Abaixo: "Isso foi útil?" com contador. Inferior direito, sobrepondo card e fundo: `[PRODUTO]` levemente angulado.

## 12 — Ação lifestyle + leque de variantes
**Quando usar:** foto de ação vende o caso de uso; leque de variantes vende a linha. Dois trabalhos de conversão num quadro.
**Status:** ✅ livre
**Esqueleto:** `[FOTO LIFESTYLE EM AÇÃO]` ocupando dois terços à esquerda, `[CENÁRIO]`, luz natural. Logo `[MARCA]` no topo central. Abaixo: `[HEADLINE DE ENDOSSO]` em sans-serif bold. Primeiro plano inferior direito: três `[VARIANTES]` em leque sobreposto mostrando `[COR 1-3]`. Produtos nítidos e iluminados em estúdio sobre o fundo lifestyle. 50mm f/2.0.

## 13 — Estatísticas radiais (produto herói)
**Quando usar:** o produto é o sol, as estatísticas são os planetas. Escaneável em menos de 2 segundos.
**Status:** 🟡 números com fonte
**Esqueleto:** gradiente branco→`[COR CLARA]`. Topo: `[HEADLINE]` em sans-serif bold `[COR DE TEXTO]`. Centro: `[PRODUTO]` com luz de estúdio suave. Flutuando perto: selo circular com `[ÂNCORA DE PREÇO/VALOR]`. Ladeando o produto: quatro callouts com setas curvas apontando pra ele — `[NÚMERO 1-4]` em corpo enorme com `[RÓTULO]` abaixo. Setas em traço desenhado à mão. Primeiro plano: `[PROPS]` para apetite visual.

## 14 — Vitrine de bundle + barra de benefícios
**Quando usar:** vende o sistema, não o item. A caixa aberta é a heroína; a barra resolve o "o que eu ganho".
**Status:** ✅ livre
**Esqueleto:** fundo `[GRADIENTE]`. Topo: `[HEADLINE]` em caixa alta branca bold. Abaixo: faixa horizontal `[COR DE ACENTO]` dividida em `[N]` segmentos por linhas finas, cada um com um benefício de duas palavras. Centro-inferior: `[EMBALAGEM]` aberta em ângulo levemente superior mostrando `[N] [PRODUTOS]` dentro, cada um numa variante de cor. Primeiro plano: `[PROP LIFESTYLE]` entrando por baixo. Logo inferior esquerdo.

## 15 — Print de comentário + produto
**Quando usar:** comentário printado = credibilidade instantânea. Parece orgânico; a headline bold para o scroll.
**Status:** 🟡 só com comentário real
**Esqueleto:** fundo branco limpo. Topo: `[HEADLINE-GANCHO]` em sans-serif preto bold enorme. Centro: card de comentário com fundo cinza claro arredondado — avatar circular, nome bold, review real de 3-4 frases em peso regular, timestamp cinza. Inferior central: `[PRODUTO]` levemente angulado sobre branco, luz suave. Sem logo, sem estrelas. **A crueza é o ponto.**

## 16 — Lacuna de curiosidade / citação-gancho
**Quando usar:** o depoimento com virada. Headline provocativa força a segunda leitura; a revelação reenquadra.
**Status:** 🟡 só com depoimento real
**Esqueleto:** fundo branco. Topo central: aspas de abertura grandes em `[COR DE ACENTO]`. Abaixo, headline de pesos mistos: primeira linha em serifada itálica `[SETUP]`, duas linhas em sans-serif caixa alta pesadíssimo `[FRASE-ISCA]`, depois linha menor `[REVELAÇÃO]`. Aspas de fechamento + `[ATRIBUIÇÃO]`. Terço inferior esquerdo: `[PRODUTO]` angulado + `[SELO DE GARANTIA]`. Terço inferior direito: cinco estrelas + `[Nº REAL DE AVALIAÇÕES]`.

## 17 — Card de avaliação verificada
**Quando usar:** imita a UI de plataforma de review. O selo e o contador de "útil" fazem o trabalho de confiança.
**Status:** 🟡 só com review real
**Esqueleto:** fundo sólido `[COR DA MARCA]`. Topo: citação em destaque branca bold entre aspas. Abaixo: cinco estrelas douradas grandes. Centro-esquerda: card branco arredondado com avatar, `[NOME]`, selo de verificado, 3-4 frases do review, link "...Ler mais" e "Isso foi útil? 👍 [N]". Direita, sobrepondo a borda do card: `[PRODUTO]` angulado com sombra suave. Sem logo — **a UI de review é o mecanismo de confiança**.

## 18 — Estatísticas radiais (flatlay lifestyle)
**Quando usar:** mesmo formato do 13, mas com flatlay e produto na mão — vende a experiência, não só a especificação.
**Status:** 🟡 números com fonte
**Esqueleto:** fundo branco com flatlay. Topo: faixa preenchida `[COR DE ACENTO]` em toda a largura com `[HEADLINE]` em caixa alta branca. Centro: `[MÃO]` segurando `[PRODUTO]`. Espalhados nas bordas: `[PROPS]` levemente fora de foco. Quatro callouts com setas curvas apontando ao produto: `[NÚMERO]` bold preto + `[RÓTULO]` em caixa alta regular. Luz de estúdio plana e clara.

## 19 — Depoimento grifado (marca-texto)
**Quando usar:** o marca-texto faz o trabalho. Review longo com as frases-chave destacadas — dirige o olho às linhas que vendem.
**Status:** 🟡 só com depoimento real
**Esqueleto:** fundo branco. Topo esquerdo: foto circular do cliente. À direita: `[NOME]` bold + ícone de verificado. Abaixo: citação longa em sans-serif preto regular grande ocupando quase o quadro. Frases-chave grifadas com retângulo `[COR DE DESTAQUE]` atrás do texto. Inferior direito: `[PRODUTO]` angulado, cortado na borda. À esquerda dele: selo circular de `[GARANTIA]`. Logo pequeno no canto inferior esquerdo.

## 20 — Advertorial / card editorial
**Quando usar:** parece post de veículo, não anúncio. O enquadramento editorial cria curiosidade e autoridade. Feito pra se misturar no feed.
**Status:** 🟡 claim tem que ser verdadeira
**Esqueleto:** use as refs só pra tom. **Nada de layout de anúncio polido.** Retrato em sangria total de `[PESSOA]`, luz âmbar quente, 50mm f/1.8, profundidade rasa, gradação cinematográfica. 45% inferior é zona de texto: pílula branca arredondada com `[TAG DE CATEGORIA]` em caixa alta centralizada. Abaixo: headline em caixa alta condensada bold DOMINANTE (≥35% da altura do quadro) com palavras-chave em `[COR DE DESTAQUE]`. Rodapé: `[@PERFIL]` em branco pequeno. Sem produto, sem botão de CTA, sem estrelas.

## 21 — Declaração ousada / headline de reação
**Quando usar:** energia pura de marca. Sem estatística, sem review — só uma frase provocativa, um gradiente quente e o produto. **A copy É o anúncio.**
**Status:** ✅ livre
**Esqueleto:** gradiente vibrante `[COR A → COR B]` na diagonal. Superior esquerdo: headline branca em `[FONTE EXPRESSIVA]` com `[DECLARAÇÃO OUSADA]` — o texto deve parecer solto e expressivo, não corporativo. Direita: `[MÃO/PESSOA]` interagindo com `[PRODUTO]`. Produto centro-direita, um pouco abaixo da linha média. Inferior esquerdo: logo + `[DESCRITOR DO PRODUTO]` menor. **Sem estatística, sem review, sem selo.** O gradiente e a headline fazem tudo.

## 22 — História de sabor / "tem gosto de"
**Quando usar:** herói indulgente ao fundo, produto como recompensa. Para marca de comida/bebida vendendo associação de sabor.
**Status:** 🟡 números com fonte
**Esqueleto:** fundo inteiro é close fotorrealista de `[COMIDA INDULGENTE]`. 50mm f/2.8, profundidade rasa, luz de padaria quente. Terço superior: `[HEADLINE]` em sans-serif branco bold com uma palavra-chave em itálico bold. `[PRODUTO]` no inferior direito, angulado 15° como se largado na cena. Rodapé: barra branca semitransparente com três colunas de estatística separadas por linhas finas. Borda inferior: `[CLAIM DE RÓTULO LIMPO]`. **A comida é a heroína; o produto é a recompensa.**

## 23 — Manifesto / carta longa
**Quando usar:** só copy. Para marca em que a escrita É o anúncio. Jogada de convicção alta e posicionamento premium.
**Status:** ✅ livre
**Esqueleto:** fundo branco limpo, sem imagem de fundo — o texto é o criativo inteiro. Topo: `[HEADLINE PROVOCATIVA]` em serifada ou sans bold preta enorme ocupando os 15% de cima. Abaixo: corpo alinhado à esquerda em regular menor, estruturado como frases curtas com quebras de linha (**não** parágrafos), construindo o argumento sobre `[TENSÃO CENTRAL]`. O texto percorre: reconhecer a objeção → o que se perde cortando caminho → reenquadrar como positivo → fechar com declaração confiante. ~12-18 linhas. 20% inferior: `[PRODUTO]` centralizado ou à direita, foto limpa sobre branco. Sem ícone, sem selo, sem botão.
**Nota:** o melhor formato do catálogo pra oferta de mentoria/consultoria. Casa com a doutrina anti-hype.

## 24 — Produto + comentário destacado
**Quando usar:** produto herói limpo em cima, card de comentário embaixo. Prova social que ainda respeita a foto do produto.
**Status:** 🟡 só com comentário real
**Esqueleto:** 55% superior: `[PRODUTO]` centralizado sobre branco, luz de estúdio, 85mm f/2.8 com sombra suave. `[UNIDADES SOLTAS]` caindo casualmente na base. 45% inferior: card de comentário realista — foto de perfil circular de `[PESSOA]`, `[PRIMEIRO NOME + INICIAL]` bold, comentário em peso regular, `[PRAZO]` · Curtir · Responder em cinza. Inferior direito: emojis de reação com `[CONTADOR]`.

## 25 — Nós vs Eles em blocos de cor
**Quando usar:** variante mais limpa e gráfica do 07. Metades em bloco de cor. Mais forte quando a comparação é o argumento central.
**Status:** ✅ livre
**Esqueleto:** dividido verticalmente em duas metades iguais. Metade esquerda: fundo `[COR PRIMÁRIA]`, `[PRODUTO]` fotografado com energia (`[DETALHE EM AÇÃO]`), logo branco bold superior esquerdo, pilha de 4 benefícios com check verde em caixa alta branca bold. Metade direita: fundo `[COR NEUTRA]`, produto genérico sem marca, cabeçalho `[CATEGORIA DO CONCORRENTE]`, pilha de 4 fraquezas com X vermelho. Divisória central: explosão "VS" em `[COR DE ACENTO]`.

## 26 — Estatística lifestyle
**Quando usar:** foto lifestyle em cima, headline com número embaixo. Para marca que lidera com número duro e resultado de público.
**Status:** 🟡 % exige fonte nomeada
**Esqueleto:** 50% superior: fotografia lifestyle — `[CENA]` em fundo `[MOOD]`, embalagem visível. Meio: logo centralizado com fios horizontais finos dos dois lados como divisória. 50% inferior: sobreposição em gradiente escuro. Texto em caixa alta sans-serif bold: `[HEADLINE COM % REAL]`. Frases de resultado destacadas em `[COR DE ACENTO]`.

## 27 — Checklist de benefícios (split produto + info)
**Quando usar:** anúncio denso de informação. Produto visto de cima à esquerda, pilha de benefício/estrelas/CTA à direita. Bom pra quem rola como se fosse landing.
**Status:** ✅ livre
**Esqueleto:** 45% esquerda: foto do produto vista de cima — `[DESCRIÇÃO DO ARRANJO]`, 50mm f/4, superfície branca limpa. 55% direita: fundo branco. Topo: `[ESTRELAS]` com `[Nº REAL DE AVALIAÇÕES]` em `[COR DA MARCA]`. Logo. Abaixo: `[HEADLINE]`. Depois três linhas de benefício com check circular preenchido + texto bold. Inferior direito: botão arredondado grande em `[COR DE ACENTO]` com `[CTA]`.

## 28 — Setas de anotação no produto
**Quando usar:** produto na mão, setas curvas apontando pra quatro rótulos de benefício. Mais suave que o diagrama do 04.
**Status:** ✅ livre
**Esqueleto:** fundo `[COR TEXTURIZADA CLARA]`. Topo: `[DECLARAÇÃO DE BENEFÍCIO]` em serifada itálica `[COR DA MARCA]`. Abaixo, em sans-serif bold massivo: `[PROPOSTA DE VALOR]`. Centro: `[MÃO]` segurando `[PRODUTO]` em ângulo natural. Quatro setas curvas em `[COR DA MARCA]` saindo do produto até quatro rótulos ao redor. Setas devem parecer desenhadas à mão, não rígidas. Rodapé: faixa `[COR DE CONTRASTE]` em toda a largura com `[TEXTO PROMOCIONAL]`.

## 29 — UGC + post viral sobreposto
**Quando usar:** selfie casual + post do Reddit/X sobreposto. Formato de reação — a opinião é o gancho, sem produto à vista.
**Status:** 🟡 só com post real (ou opinião própria assumida)
**Esqueleto:** use as refs só pra cor do produto. **Nada de layout ou polimento de anúncio — isto tem que parecer completamente nativo.** Selfie casual de `[PESSOA]` fazendo algo banal (`[AÇÃO]`). Câmera frontal de celular, levemente granulada, luz de banheiro/cozinha, zero produção. Sobreposto ao centro: print realista de um post de `[PLATAFORMA]` — `[DETALHES DO POST]`, título bold com `[OPINIÃO PROVOCATIVA]`, corpo em 2-3 frases. O post deve parecer que a pessoa está reagindo a ele, **não vendendo um produto**. Sem produto visível, sem logo, sem CTA. **O gancho é a opinião.**
**Nota:** se o post não existe, a saída honesta é assumir a opinião como sua — post do próprio perfil do cliente, não de terceiro inventado.

## 30 — Declaração herói + barra de ícones
**Quando usar:** frase de força curta, herói lifestyle grande, barra de três ícones embaixo. Sanduíche de resposta direta limpo.
**Status:** 🟡 número no ticker com fonte
**Esqueleto:** 15% superior: faixa branca com `[DECLARAÇÃO DE 2-3 PALAVRAS]` em caixa alta sans-serif bold massiva `[COR DA MARCA]`, com ponto final pra impacto. 55% do meio: foto lifestyle do produto — `[CENA]`, marca claramente visível. 25% inferior: fundo `[COR SUAVE DA MARCA]` com três colunas de ícone+texto igualmente espaçadas. Ícones em traço dentro de círculos `[COR DA MARCA]`. Borda inferior: ticker com `[PROVA SOCIAL REAL]`.

## 31 — Grade de comparação (tabela)
**Quando usar:** tabela de comparação em formato meme. Dois produtos no topo, três linhas de atributo. Viraliza no X/Reddit.
**Status:** ✅ livre
**Esqueleto:** fundo branco. Linha superior dividida 50/50: esquerda `[SEU PRODUTO]` limpo sobre branco com `[DETALHE]`; direita `[PRODUTO CONCORRENTE GENÉRICO]`. Abaixo: três linhas horizontais em toda a largura, cada uma dividida 50/50 por linha vertical fina e separada por linhas horizontais finas. Cada linha compara um atributo: `[SUA VANTAGEM]` vs `[FRAQUEZA DO CONCORRENTE]`. Todo texto em serifada preta bold ou sans pesada, centralizado. **Sem ícone, sem cor, sem check — o contraste da copy faz o trabalho.**

## 32 — Story com balões de texto
**Quando usar:** layout de Story do Instagram forjado. Produto na mão + 5 balões de texto destacados. Formato educativo nativo.
**Status:** ✅ livre
**Esqueleto:** use as refs só pra cor e embalagem. **Nada de layout de anúncio — isto tem que parecer o Story real de uma pessoa.** Foto casual de celular de `[MÃO]` segurando `[PRODUTO]` levemente angulado sobre `[SUPERFÍCIE/CENÁRIO]`. Luz natural de cima, levemente quente, qualidade de iPhone. Espalhados pelo quadro: 5 balões usando a ferramenta de texto destacado do Story, cada um com fundo colorido diferente. Balão 1: `[TEMA + EMOJI]`. 2: `[GANCHO EDUCATIVO]`. 3: `[POR QUE ESTE PRODUTO]`. 4: `[RESULTADO PESSOAL]`. 5: `[ENDOSSO]`. Deve parecer colocado à mão, não desenhado.

## 33 — Falso print de matéria de jornal
**Quando usar:** 🚫 **NUNCA.** Formato proibido no workspace.
**Status:** 🚫 **PROIBIDO**
**Motivo:** imita a identidade visual e o mastro de um veículo de imprensa real (Daily Mail, TODAY, etc.). Não é criativo, é falsificação de marca de terceiro — risco jurídico e de reprovação no Gerenciador, e incompatível com a doutrina anti-hype.
**Substitutos legítimos:** formato **10** (imprensa real, com veículo que de fato publicou) ou formato **20** (advertorial editorial com claim verdadeira).

## 34 — Falso print do app Notas
**Quando usar:** disfarçado de Notas do iOS. Headline + checklist + produto quebrando a moldura. Para o scroll por mimetismo de formato.
**Status:** ✅ livre
**Esqueleto:** disfarçado de print do app Notas do iPhone. Topo: barra de status iOS realista (hora, sinal, wi-fi, bateria). Abaixo: navegação do Notas — seta azul "< Todas", ícones de compartilhar e menu. Timestamp cinza pequeno. Conteúdo sobre branco: `[HEADLINE]` em serifada preta bold. Abaixo: `[3 LINHAS DE BENEFÍCIO]`, cada uma com check circular `[COR DA MARCA]` + emoji + texto preto bold. Direita, sobrepondo levemente o texto: `[PRODUTO]` angulado, quebrando a moldura de leve.
**Nota:** mimetiza a UI da Apple, não a identidade de uma empresa — diferente do 33. Liberado, desde que o conteúdo da nota seja verdadeiro.

## 35 — Vitrine herói + barra de estatísticas
**Quando usar:** headline com claim superlativa, produto herói com ingredientes explodidos, barra de três estatísticas. Vitrine de uso geral forte.
**Status:** 🟡 estatística com fonte
**Esqueleto:** fundo `[COR QUENTE]`. Topo: `[CLAIM SUPERLATIVA]` em caixa alta sans-serif bold `[COR DA MARCA]`. Abaixo: botão de CTA branco arredondado com `[CTA]` em caixa alta. Centro: `[PRODUTO]` em embalagem completa, levemente angulado, iluminação de herói. Ao redor: `[ELEMENTOS ESPALHADOS]` em padrão radial/explodido. Rodapé: barra-pílula clara em toda a largura com três métricas separadas por linhas finas — números grandes e dominantes, rótulos menores abaixo.
**Nota:** claim superlativa ("o melhor do mundo") é reprovada em saúde e em qualquer conta com compliance. Trocar por claim específica e sustentável.

## 36 — Quadro branco antes/depois + produto na mão
**Quando usar:** antes/depois desenhado à mão num quadro branco + produto segurado. Jogada educacional casual — **vende o mecanismo**.
**Status:** ✅ livre
**Esqueleto:** use as refs só pra embalagem. **Nada de layout de anúncio — isto tem que parecer a foto de uma pessoa real.** Foto lifestyle em `[CENÁRIO]`. Ao fundo: quadro branco pequeno apoiado em `[SUPERFÍCIE]`. No quadro: dois desenhos simples a marcador preto lado a lado — esquerda rotulada `[ANTES]` mostrando `[ESTADO ANTES]`, seta apontando pra direita, segundo desenho `[DEPOIS]` mostrando `[ESTADO DEPOIS]`. Abaixo dos desenhos: `[CTA MANUSCRITO]` em marcador. Primeiro plano: `[MÃO]` segurando `[PRODUTO]` ao lado do quadro, inferior direito, rótulo visível. Foto de celular, luz natural, casual e educativo.
**Nota:** excelente pra explicar mecanismo de mentoria/consultoria (o seu método em etapas) sem parecer anúncio.

## 37 — Declaração herói + explosão de oferta (variante promo)
**Quando usar:** variante promocional do 30. Fundo escuro + selo estourado de desconto em neon + ticker de oferta. Para janela de venda.
**Status:** ✅ livre
**Esqueleto:** fundo `[ESCURO/DRAMÁTICO]`. 12% superior: faixa clara com `[DECLARAÇÃO PROVOCATIVA DE 2-3 PALAVRAS]` em caixa alta bold massiva, com ponto final. Superior esquerdo da área do produto: selo estourado estilo HQ em `[COR NEON]` levemente girado com `[DESCONTO]` em preto bold. Centro: `[MÃO]` segurando `[PRODUTO]`, marca visível. Luz dramática. 20% inferior: três colunas de ícone+texto sobre faixa escura semitransparente. Rodapé: faixa `[COR NEON]` em toda a largura com `[PROMOÇÃO]`.
**Nota:** escassez tem que ser real (vaga limitada de verdade, janela de turma real). Escassez falsa é reprovada.

## 38 — UGC lifestyle + produto + card de review (split)
**Quando usar:** esquerda foto lifestyle espontânea, direita bloco de cor da marca com produto herói + card de review curto. Híbrido UGC/limpo.
**Status:** 🟡 só com review real
**Esqueleto:** 55% esquerda: foto UGC casual de `[PESSOA]` usando o produto em contexto (`[AÇÃO]`). Luz natural, qualidade de celular, a pessoa parecendo genuinamente feliz, não posada. 45% direita: fundo sólido `[COR PRIMÁRIA DA MARCA]`. Superior direito: acentos decorativos em `[COR DE ACENTO]`. Centro-direita flutuando: `[PRODUTO]` angulado, iluminado em estúdio. Abaixo: card branco arredondado com cinco estrelas + `[CITAÇÃO CURTA REAL]`. Inferior central: logo em branco.

## 39 — Lacuna de curiosidade / trava-scroll
**Quando usar:** topo com headline truncada "...mais", embaixo foto de problema incômoda. Sem produto. Curiosidade pura.
**Status:** ✅ livre
**Esqueleto:** use as refs só pra tom visual. **Não incluir produto, logo ou marca.** Feito pra parecer post truncado. 35% superior: fundo branco com `[HEADLINE-GANCHO]` em sans-serif preto bold pesado, entrelinha apertada, terminando em "...mais" em cinza claro, imitando legenda truncada do Facebook/Instagram. 65% inferior: foto em close de `[VISUAL DO PROBLEMA]`, levemente incômoda e chamativa. Deve parecer real e editorial, não banco de imagem. Sem texto na foto, sem produto, sem logo, sem CTA.
**Nota:** este é **o** formato pro funil em que a oferta só aparece na DM/VSL — curiosidade pura, zero oferta no criativo.

## 40 — Post-it nativo colado no produto
**Quando usar:** foto de produto "encontrada" com um post-it manuscrito colado. **O formato mais orgânico do catálogo.**
**Status:** ✅ livre
**Esqueleto:** foto lifestyle do produto em `[CENÁRIO REAL]` com `[LUZ NATURAL]` e fundo desfocado. Enquadramento levemente descentralizado — o produto não está perfeitamente centrado, a borda `[LADO]` levemente cortada; **parece encontrado, não composto**. Grão natural leve de câmera de celular. Vinheta sutil nos cantos. Centro do quadro, grande e dominante: `[PRODUTO COMPLETO]` sobre `[SUPERFÍCIE]`, levemente angulado. `[DETALHE ESPALHADO]` na superfície ao redor da base. Colado na frente do produto: post-it `[COR]` quadrado, levemente torto e não perfeitamente reto — trapezoidal pelo ângulo em que foi pressionado. Textura de papel realista com um vinco horizontal no meio. Leve curvatura só no canto inferior direito. Preso no topo por um pedaço de fita levemente amassada. Uma palavra da caligrafia com tinta mais pesada ou sublinhada, por pressão natural da caneta. Escrito em marcador preto grosso, imperfeito e irregular, minúsculas naturais — não formatado, não centralizado, não espaçado: `[LINHA 1 — setup]` / `[LINHA 2 — virada]` / `[LINHA 3 — punchline]` / `[LINHA 4 — beat final opcional]`. Sem assinatura. Rodapé, fora da foto, sobre faixa branca: `[url] — [legenda casual de 3-5 palavras]`. Sem logo sobreposto — a identidade vem só da embalagem visível.

---

## Regra 4 — checklist antes de fechar qualquer peça

- [ ] Headline nomeia o público? (Regra 1)
- [ ] Estrutura headline → sub → contexto/bullets → ponte → CTA?
- [ ] A / B / C / D presentes (anti-medo · anti-procrastinação · anti-preguiça · anti-problema-futuro)?
- [ ] Todo depoimento / print / número / veículo é **real** e está arquivado? (Regra 2)
- [ ] Formato 33 fora?
- [ ] Prompt de imagem com física literal, escala e lista do que nunca pode aparecer?
- [ ] Zona morta de 250px no topo e na base sem texto? Nenhum rosto cortado ou coberto por texto?
- [ ] O kit tem no mínimo 3 imagens + 3 vídeos, e todo vídeo com narração?

---

## Infoproduto — qual formato sobrevive sem packshot

Os 40 formatos assumem uma foto de embalagem como âncora. Para oferta de serviço/mentoria/
consultoria, escolher primeiro o **slot do produto** (👤 pessoa · 🖥️ tela · ✍️ artefato · ⬛ nada).
**12, 14 e 22** dependem de produto físico — descartar em serviço. Primeiros a testar em alto ticket:
**23 · 39 · 36 · 34 · 40 · 21**.


---

## 🛑 Formatos APOSENTADOS

Reprovados em revisão de lote real: performam como "anúncio de varejo genérico" e quase sempre
dependem de prova que infoprodutor não tem. **Não produzir nessa linha.**

| # | Formato | |
|---|---|---|
| **02** | Oferta/Promoção (split de cor, oferta no meio) | aposentado |
| **06** | Prova social stack (contagem + review + logos) | aposentado |
| **07** | Nós vs Eles (comparação com produto concorrente) | aposentado |
| **09** | Marketing negativo (bait & switch de review) | aposentado |
| **10** | Press/Editorial ("As Featured In") | aposentado |
| **11** | Pull-quote review card | aposentado |

### Segunda leva de aposentados

| # | Formato | |
|---|---|---|
| **13** | Stat radial (produto herói) | aposentado |
| **14** | Bundle / caixa com o kit | aposentado |
| **16** | Curiosity gap + quote | aposentado |
| **18** | Stat radial em flatlay | aposentado |
| **25** | Nós vs Eles (split de cor) | aposentado — caiu junto com o 07, mesma mecânica |
| **32** | Story com balões | aposentado |
| **35** | Herói + barra de stats | aposentado |
| **37** | Declaração + selo de oferta | aposentado |

### Placar do catálogo

| | |
|---|---|
| Aposentados | **14** (02, 06, 07, 09, 10, 11, 13, 14, 16, 18, 25, 32, 35, 37) |
| Dependem de prova real de terceiro | **7** (03, 15, 17, 19, 24, 29, 38) — só produzir com material arquivado e autorizado |
| Falsificação proibida | **1** (33) — só como editorial próprio assinado, nunca imitando veículo real |
| **Vivos e livres** | **18** (01, 04, 05, 08, 12, 20, 21, 22, 23, 26, 27, 28, 30, 31, 34, 36, 39, 40) |
