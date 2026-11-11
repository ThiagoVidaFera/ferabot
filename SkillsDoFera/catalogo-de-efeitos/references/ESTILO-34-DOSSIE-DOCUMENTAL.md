# Estilo 34 — Dossiê documental (receita para peça)

**O que é.** Documentário curto contado como investigação: cada fato vira um objeto de dossiê (data em quadro-negro, etiqueta de nome, manchete com marca-texto, TV, mural de fotos) e as transições nascem do próprio objeto (a cena vira a foto do jornal, o jornal sai da mão, a TV mergulha, a câmera desce, a fechadura fecha). Cena de IA fotorrealista em cor, documento em P&B, um vermelho como fio condutor, voz em off (a sua ou uma voz sintética), sem rosto de apresentador.

**Quando usar.** Anúncio ou Reel de 35–45 s em 9:16 que precisa de tensão e prova: "o caso", a virada ("mas havia um detalhe"), a contradição da versão oficial e a revelação do seu produto como objeto. Funciona bem para nichos com dor concreta e prova na tela (painel, número, print).

**Quando não usar.** Peça com pessoa falando para a câmera, conteúdo leve ou humorístico, peça com mais de 60 s, ou quando você não tem uma prova real para mostrar na revelação. Não misture este estilo com outros estilos de colagem ou de documentário retrô na mesma peça: ele tem gramática própria (investigação, contradição, revelação).

**Convenções deste arquivo.** q = quadro a 30 fps (1 q = 33 ms). Todos os valores foram medidos a 30 fps em uma referência e valem para 1080x1920. Os ids de efeito são os do seu `catalogo-de-efeitos`. Começar sempre por uma amostra de 5–15 s em 9:16 e só então estender.

---

## Estrutura em blocos

Duração-alvo: 42 s (100 %). Roteiro: 95–110 palavras, uma frase por bloco (cerca de 7 frases). A virada (bloco 6) cai entre 62 e 68 % do tempo. A revelação termina numa pergunta ou numa resposta curta. CTA nos 12–14 % finais.

| # | Bloco | % | Tempo | Função | Efeitos-âncora |
|---|---|---|---|---|---|
| 1 | Mistério | 15 % | 0,0–6,5 s | fato chocante em 1 frase; a imagem antecipa a palavra em 0–5 q | 01 · 02 · 03 · 04 · 05 |
| 2 | Data / etiqueta | 12 % | 6,5–11,5 s | situar no tempo e nomear quem | 06 · 07 · 08 |
| 3 | Manchete | 23 % | 11,5–21,4 s | "saiu no jornal": autoridade e palavra-chave isolada | 09 · 10 · 11 · 12 · 12b |
| 4 | Arquivo / TV | 5 % | 21,4–23,7 s | o assunto ganhou o público | 13 · 14 |
| 5 | Mural | 9 % | 23,7–27,5 s | volume de evidência | 15 |
| 6 | Virada vertical | 4 % | 27,5–29,1 s | "mas havia um detalhe" | 16 |
| 7 | Contradição | 12 % | 29,1–34,1 s | a versão oficial desmonta o medo | 17 (+ 24 cor seletiva) |
| 8 | Revelação | 7 % | 34,0–37,0 s | a pergunta que fica / a resposta escondida | 18 · 19 |
| 9 | CTA com produto-objeto | 13 % | 37,0–42,6 s | produto como objeto, nome digitado | 20 · 21 · 22 · 23 |

### Ritmo
- 18 planos e 17 trocas: 15 cortes duros e 3 transições contínuas (círculo de entrada no P&B, slide vertical e chicote). Cerca de 0,35 corte por segundo.
- Duração média por plano: 2,37 s (faixa 1,33–3,77 s). Portal 1,33 s; coluna de palavras 1,6 s; mural 3,77 s.
- Troca de estímulo média de ~2 por segundo. Pico de 4/s na virada vertical; mínimo de 1,3/s no reenquadramento. Regra prática: nunca mais de 2 s sem estímulo novo na tela.
- Miolo "em dois": TV e mural animados em `steps(2)` (15 fps efetivos). O resto roda a 30 fps suave.
- Corte duro tem SFX de 0 a +2 q depois; reenquadramento e chicote ficam mudos; graves caem +3 q depois do fim do gesto.

### Câmera: escalas e curvas (resumo)
| Movimento | Escala | Duração | Curva |
|---|---|---|---|
| Push-in de plano (cena viva) | 1,00 → 1,19 (ou 1,07 em plano largo) | 40–48 q e platô | `expo.out` |
| Cut-in de pessoa com contra-movimento | fundo 0,85 → 1,00; pessoa recua 1078 → 330 px | 16–18 q | `expo.out` |
| Documento que chega | 1,154 → 1,00, com blur nos primeiros 7 q | 16 q | `expo.out`, sem push-in depois |
| Punch-in P&B | 0,86 → 1,00, depois +2 %/s | 9 q | `power3.out`, sem tremor |
| Zoom-out do objeto | largura × 0,53 | 32 q até o corte | `power2.in` (acelera) |
| Reenquadramento | sobe 213 px, segura 7 q, 1,0 → 0,655 | 23 + 7 + 35 q | `power2.out` / `power4.in` |
| TV: recuo e mergulho | 1,86 → 0,93, segura 12 q, 0,93 → 1,65 | 36 + 12 + 18 q | `power3.out` / `power3.in` |
| Chicote tilt-down | translação pura, sem zoom | 26 q | `cubic-bezier(.7,0,.12,1)` |

### Camadas (de trás para a frente)
1. Fundo ou superfície: cena de IA, quadro-negro, madeira, grade azul, papel quadriculado, parede de recortes (100 %).
2. Textura da superfície: giz, veio da madeira, linhas da grade (25–40 %, `overlay` ou `soft-light`).
3. Recorte (pessoa, objeto, mãos) com sombra de contato `0 18px 30px rgba(0,0,0,.45)`.
4. Moldura recortada (borda vermelha de 8–10 px) e documento (jornal, foto P&B com `grayscale(1) contrast(1.2)`).
5. Marcações: marca-texto (`multiply`, 85 %), círculo à mão, sublinhado, etiqueta.
6. Texto (palavra itálica, data, 3D), fora do filtro de grão.
7. Grão de filme: 6–8 PNGs em rodízio, 8–12 % `overlay` (15 % só no quadro-negro e no P&B).
8. Vinheta: `radial-gradient(transparent 55%, rgba(5,6,10,.55))`.

### Regra P&B × cor
- Cena viva = cor. Documento ou arquivo = P&B.
- Vai para P&B quando: (a) a cena vira documento (efeito 08, escoa em 9 q); (b) a frase nega ou contradiz (efeito 17, corte duro de 1 q); (c) o fato vira passado ou perda (efeito 03, corte duro de 1 q, saturação 101 → 33).
- O P&B é frio, nunca cinza puro: média `#2E3132`, saturação 11–22. Em CSS: `saturate(.45) contrast(1.4)` mais um tint frio.
- O vermelho é a única cor que sobrevive ao P&B (moldura, círculo, sublinhado).
- Voltar à cor só com corte e SFX, nunca com crossfade.

---

## Efeitos

Cada efeito traz o id do catálogo (seta indica que é variante de um efeito existente). Tempos em quadros a 30 fps.

### Ficha 01 · Cut-in e recuo de abertura
Id: `foco-que-assenta-na-troca` (variante `rack-focus-de-primeiro-plano-na-abertura`).
- 4–5 q de fundo desfocado; em 1 q o primeiro plano (cabeça ou objeto) ocupa a tela e recua de 1078 para 330 px de largura em 18 q, `expo.out`.
- Fundo faz push-in 0,85 → 1,00 em 16 q (contra-movimento). Foco trava, "respira" e trava de novo.
- SFX: tick +8 q depois do cut-in.
- HyperFrames: `gsap.fromTo('#fg',{scale:3.3},{scale:1,duration:.6,ease:'expo.out'})` e fundo `.85 → 1` em 16 q.
- Remotion: `interpolate(f,[5,23],[3.3,1],{easing:EASE.out})`.

### Ficha 02 · Objeto-silhueta sobe em volta da pessoa
Id: `recorte-encaixado-em-objeto-silhueta` (novo).
- O objeto que resume o destino sobe de baixo 803 px em 14 q, `expo.out`, sem overshoot.
- Em seguida um disco recortado abre de 715 para 1433 px em 5 q (`power2.inOut`) e cobre a tela; corte para P&B (efeito 03).
- Camadas: cenário, disco, objeto, pessoa.
- Uso do aluno: dono do negócio dentro de um celular gigante, de uma caixa de entrada ou de uma porta.

### Ficha 03 · Corte P&B e zoom-out acelerando
Id: `giro-para-vista-de-cima-com-zoom-out` (novo).
- Corte duro de 1 q para P&B frio (saturação 101 → 33) com borrão horizontal de 5 q.
- Câmera recua acelerando: largura × 0,53 em 32 q, `power2.in`, sem parar até o corte seguinte (o corte cai no pico de velocidade).
- Deslize lateral do objeto: `expo.out`, assenta em ~27 q.
- SFX: pulso +1 q depois do corte P&B; agudo +0,6 q no corte seguinte.
- Remotion: `interpolate(f,[0,32],[1,.53],{easing:EASE.in2})`; P&B `saturate(.2) contrast(1.35)` e tint `#2E3132`.

### Ficha 04 · Multidão em camadas com push-in
Id: `parallax-hq-2-camadas` (variante `multidao-em-camadas-push-in`).
- Fundo 0,85 → 1,00 em 18 q (`expo.out`) e platô 1,07. Não há pull.
- Pessoas entram de baixo e ganham foco em 8–10 q.
- SFX: agudo +0,6 q do corte.

### Ficha 05 · Tilt-down acelerando com fatias
Id: `empurrao-vertical-com-foco` (variante `tilt-down-ate-o-chao-com-fatias`).
- A câmera desce acelerando de 8 para 36 px/q (`power2.in`) por ~40 q (~1040 px, 54 % da altura).
- Fatias horizontais deslocadas nos 14 q finais; blur crescente; corta no pico.
- SFX: whoosh ou glitch +2 a +7 q depois do corte, terminando na primeira letra do plano seguinte.
- O mesmo id serve ao wipe de entrada (borda sobe 1862 → 0 em 9 q, `expo.out`, grave no primeiro quadro) e ao reenquadramento (12b).

### Ficha 06 · Data em quadro-negro
Id: `data-em-quadro-negro-com-sublinhado` (novo).
- 5–6 q de quadro vazio. A data é digitada uma vez só, a 1,85 q por caractere (13 caracteres em 24 q), sem apagar nem redigitar.
- Cursor "I" com período de 12 q (6 aceso, 6 apagado).
- O bloco sobe 645 px em 24 q (`expo.out`), deriva ~6 px/q e encolhe 13 % em 18 q.
- Sublinhado vermelho cresce linear a 25 px/q (~22 q).
- A data completa aparece ~2 q antes da voz.
- SFX: tique de tecla por caractere (-18 dB); grave no início do wipe seguinte.
- HyperFrames: TextPlugin com `duration = n*1.85/30`, `ease:'none'`; `gsap.from('#bloco',{y:645,duration:.8,ease:'expo.out'})`.
- Remotion: `txt.slice(0,Math.floor((f-6)/1.85))`; cursor `f%12<6`.

### Ficha 07 · Etiqueta vermelha de nome
Id: `etiqueta-de-nome-com-seta-manuscrita` (variante `etiqueta-vermelha-que-abre-por-wipe`).
- Nasce como fenda vermelha de 6 px; sobe 430 px em 10 q (`expo.out`).
- Abre de 130 para 502 px de largura em 14 q com `cubic-bezier(.3,0,.1,1)`, simétrica a partir do centro.
- O texto é revelado do centro para as bordas ~10 q depois. Leve blur nos 4 q de abertura.
- Sem SFX próprio.
- Remotion: `width` interpolado; texto com `clipPath: inset(0 X% 0 X%)`.

### Ficha 08 · Cena vira foto recortada
Id: `cena-vira-foto-recortada-na-manchete` (novo).
- A cena escoa para P&B em 9 q (`expo.out`; saturação 96 → 28; metade em 4 q).
- A moldura (hexágono, escudo ou caixão) com borda vermelha nasce maior que a tela e encolhe de 1042 para 526 px em 10 q (`power1.out`). O corte duro cai com ela a ~49 % da largura.
- SFX: swell grave cobre a dessaturação e o recuo; sem agudo no corte.

### Ficha 09 · Documento que chega nas mãos
Id: `mao-recortada-entra-em-cena` (variante `maos-seguram-o-documento`).
- Corte com blur radial de 7 q (12/10/8/6/4/2/1 px) e quadro estourado de claro.
- O jornal recua 1,154 → 1,0 em 16 q (`expo.out`, decai 0,89 por quadro) e fica parado, sem push-in.
- Marca-texto amarelo em 3 linhas, uma a uma.
- Sem SFX no corte.

### Ficha 10 · Documento cai e sai com blur
Id: `arremesso-para-fora` (variante `documento-baixado-sai-com-blur`).
- Queda quadrática pura `y = 0,6·t²` px (t em q) por ~45 q, girando até -15°.
- Blur proporcional à velocidade (forte acima de ~29 px/q). Sai do quadro ~4 q antes do corte.
- SFX: whoosh começa ~15 q depois do início do movimento e tem pico no corte.

### Ficha 11 · Palavra isolada na grade azul
Id: `palavra-sob-holofote` (variante `palavra-italica-sobre-grade-azul`).
- A grade entra girada ~-25° e endireita em ~30 q; 5 q de grade vazia.
- Cada palavra entra por corte duro de 1 q, sem pop e sem fade. Só a primeira anima: entra a 1,40×, inclinada (-12° → -6°), e cai para 1,0 em 7 q (`expo.out`). As demais derivam ~1,1 px/q.
- Cada palavra dura o tempo da fala dela (5–15 q).
- SFX: tick agudo (-10 dB) +1 q depois do quadro da palavra.
- Remotion: `palavraAtual = palavras.findLast(p => f >= p.q)`.

### Ficha 12 · Manchete cai na mesa
Id: `trecho-de-fonte-marcado` (variante `manchete-cai-na-mesa-marca-verde-e-circulo`).
- Mesa vazia por 8 q. O jornal entra girado (-20° → -3°) e desliza em 27 q (`power3.out`), sem overshoot.
- Marca-texto verde começa 16 q depois da chegada (~16 q por linha, `power2.inOut`, `multiply`).
- O círculo vermelho é desenhado em 5 q (`stroke-dashoffset` linear) no número ou trecho-prova.
- SFX: marcador durante o traço; grave +3 q depois de o círculo fechar.

### Ficha 12b · Reenquadramento do mesmo papel
Usa `empurrao-vertical-com-foco`.
- Corte mudo. O papel (maior) sobe 213 px em 23 q (`power2.out`), segura 7 q e recua 1,0 → 0,655 em 35 q (`power4.in`).
- Escurece 21 % e desfoca nos 2 q finais, antes do corte.

### Ficha 13 · TV que recua e mergulha
Id: `recuo-tela-cheia-revela-tv-crt` (variante `tv-com-espectadores-de-costas`). Em dois (`steps(2)`).
- Corte com 2 q borrados (TV a ~3,2×), desborra em 8 q.
- Recua 1,86 → 0,93 em 36 q (`power3.out`) até a sala com cabeças de costas; segura 12 q; push-in 0,93 → 1,65 em 18 q (`power3.in`) com blur nos 3 q finais; corta.
- A tela da TV nunca fica vazia: coloque a sua interface, painel ou página composta.
- SFX: agudo +1,7 q do corte; whoosh grave cobre o mergulho e termina no corte seguinte.

### Ficha 14 · Painel com barra clara (estática de TV)
Id: `estatica-de-tv-como-corte` (novo). Em dois.
- Não é ruído: é um painel texturizado onde uma barra clara sobe 300 px em 8 q (53 → 30 px/q, desacelera) e some. Segue 14 q de painel até as fotos.
- Vale também 6 PNGs de ruído com luminância ≤ 55 %. Conta como um dos flashes da peça.
- SFX: fim do whoosh +0,4 q.

### Ficha 15 · Mural de fotos
Id: `foto-voadora-de-papel` (variante `mural-quatro-fotos-dos-cantos-que-oscilam`). Em dois.
- 4 fotos P&B com borda branca entram espelhadas, aos pares e simultâneas, sem overshoot: posição `exp(-t/9)`, rotação ±6° → 0, blur e keystone nos 8 q iniciais.
- O conjunto cresce 1,0 → 1,3 em 41 q.
- Flash negativo de 2 q (`filter: invert(1)`) com o impacto de SFX (a primeira aparição não tem som).
- Cada foto faz um balanço lento de ±2,7° (período ~60 q, defasagem de 16 q entre fotos).
- Saída: rotação `-0,018·t²` graus (até -14° em 28 q, `power2.in`), escala -18 %, blur só nos 2 q finais.
- SFX: whoosh +0,9 q do corte seguinte.

### Ficha 16 · Coluna de palavras da virada
Id: `coluna-de-palavras-que-desce` (novo).
- No corte o brilho cai 50 %. A primeira palavra entra a 1,77× e +27°, assentando em 1,0 e 0° em 10 q (`expo.out`).
- Cada palavra nova nasce no topo, com intervalos de 10, 5, 5 e 5 q. As de baixo descem acelerando (`dy = 1,9·t²`) e crescem × 1,2–1,8 em perspectiva (`scale = 1 + 0,0011·max(0, y-800)`).
- Palavra entra 0–5 q antes da voz. Sem SFX por palavra, só o whoosh do corte.
- A cena seguinte entra por slide vertical (efeito 17).

### Ficha 17 · Slide vertical e punch-in P&B
Id: `punch-in-que-escoa-para-pb` (novo).
- Slide: a nova camada sobe de baixo em 9 q (`power3.in`, pico de 310 px/q), assenta com `134 + 968·0,68^t` e escala 1,27 → 1,0. O painel de trás sobe só 22 px/q (parallax).
- Na palavra que nega: corte duro de 1 q para P&B frio. O quadro entra a 0,86 e chega a 1,0 em 9 q (`power3.out`), com flash de luminância 72 → 44 em 5 q e depois push-in de ~2 %/s.
- Sem tremor (0 px): nada de `noise` ou `shake`.
- SFX: grave (0 dB) +0,5 a +3,8 q do corte; whoosh suave do slide começa 4 q antes da borda.
- Remotion: `scale = interpolate(f-fP,[0,9],[.86,1],{easing:EASE.out3})`; `brightness` 1,55 → 1 em 5 q; filtro P&B condicional a `f >= fP`.

### Ficha 18 · Portal circular
Id: `portal-que-nasce-de-ponto-da-cena` (variante `portal-circular-com-raios-radiais`).
- Uma mancha vermelha de 26 px nasce num ponto da cena e vira círculo de borda dura com o plano seguinte dentro.
- Diâmetros: 216 → 412 → 694 → 972 → 1190 → 1356 → 1492 → 1600 → 1690 px, `cubic-bezier(.55,0,.1,1)`, 13 q.
- Halo de raios com blur radial; pico de brilho (luminância 49 → 107).
- SFX: agudo/whoosh -2 dB, +1 q depois da mancha.
- Remotion: `clipPath: circle(${d/2}px at X Y)` com `EASE.portal`.

### Ficha 19 · Fechadura que respira
Id: `buraco-de-fechadura-revela` (novo).
- Corte com flash que decai em 8 q (luminância 85 → 36). A máscara aparece na palavra, fecha de 1078 para 792 px em ~17 q (`expo.out`), segura 3 q e reabre em `power3.in` até sair da tela em 18 q.
- O interior encolhe ~25 % e volta +10 %. Arco de borda quente suave só no arco superior; fora da máscara, quase preto.
- SFX: grave -2 dB, +1,5 a +2,4 q do corte, 1 q antes de a máscara aparecer.

### Ficha 20 · Título 3D extrudado
Id: `titulo-3d-extrudado` (variante `pilha-3d-tres-cores-em-papel-quadriculado`).
- A primeira letra entra no onset exato da palavra falada. Letras com fade de 2 q e ritmo acelerando: 2,7 → 2,1 → 1,7 q por letra (linhas 1, 2 e 3).
- Cada linha cresce +27 % em 40 q (`expo.out`) e sobe ~80 px.
- Extrusão de ~6 px para baixo e direita (6 camadas de `text-shadow` de 1 px) mais sombra macia de 40–50 px a -30 %. Linhas sobrepostas em 8–10 px.
- Cores: `#FFC21A` (só sobre escuro), `#FF2E4D` e um azul só se necessário.
- SFX: agudo -4 dB, +0,3 q do corte; sem tick por letra.

### Ficha 21 · Chicote até o produto-objeto
Id: `cta-ponte-da-moral-com-produto-objeto` (variante `computador-retro-em-parede-de-recortes`).
- Translação vertical pura (escala 1,00, sem zoom) de 26 q: 4 q de aceleração e 22 q de `expo.out` (razão 0,85 por quadro), pico de 272 px/q.
- Sem SFX. A fala entra 1 q depois do pico. Depois a cena fica parada.
- A tela do computador mostra a SUA página rolando (uma troca a cada ~12 q).
- Remotion: `interpolate(f,[0,26],[1920,0],{easing:EASE.chicote})`.

### Ficha 22 · Etiqueta pendular
Id: `etiqueta-pendular` (variante `icone-de-arquivo-pendurado-por-corda`).
- Entra 3–4 q antes da palavra; queda de 24 q em `expo.out`.
- Pêndulo em seno puro: período de 55 q, ±13° (±115 px), quase sem amortecer; pivô ~510 px acima do centro da etiqueta.
- Rack-focus do fundo: nitidez cai e volta em 4 + 9 + 4 q.
- SFX: grave +3 dB junto do rack-focus (~+8 q após o início da queda), não no pouso.
- Use a SUA sigla ou marca na etiqueta.
- Fórmula: `x = 115·cos(2π(t-t0)/55)`.

### Ficha 23 · Barra de busca de vidro
Id: `LETED-EF-06` (variante `barra-de-busca-de-vidro-digitando`).
- Pílula de vidro (`backdrop-filter: blur(20px)`, borda de 2 px clara) abre do centro de 290 para 600 px em 19 q (`expo.out`).
- Digitação a 1,5 q por caractere em rajadas de 2, sem cursor, colada à fala (0 a -2 q).
- SFX: clique (-10 dB) no primeiro caractere e +1,5 q depois do último.
- Digite o nome do SEU produto.

### Ficha 24 · Cor seletiva em camadas
Id: `cor-seletiva-em-camadas` (novo).
- P&B e cor convivem no mesmo quadro: a cena escoa para P&B em 6–9 q (`expo.out`, saturação 1 → 0,28) e UMA camada fica em cor (a moldura vermelha, o marcador, a pessoa "eleita").
- Interior P&B ("o arquivo") com moldura, marca-texto e círculo em cor ("o agora").
- Regras: recorte limpo, sem contorno, com sombra suave; a camada colorida entra 0–2 q antes da palavra que a nomeia; no máximo 1 "eleito" em cor mais os marcadores do sistema.
- Blocos onde cabe: abertura (personagem), manchete (marcadores), virada (o cliente certo em cor no meio de uma fila P&B), prova (só o número bom em verde).
- Uso do aluno: o cliente ideal em COR no meio de uma multidão P&B de curiosos; painel P&B com só o número bom em verde.

### Ficha 25 · Close extremo de detalhe
Id: `close-extremo-de-detalhe`.
- Corte de 1 q para o detalhe (olho de quem decide, dedo no botão, número na tela) já a 1,15× e assenta em 1,0 em 9 q (`power3.out`), com push-in de 2 %/s.
- Segura 12–18 q, sem tremor e sem overshoot. Máximo de 2 por peça.
- SFX: agudo 0–2 q depois do corte.
- Variante: o portal circular (efeito 18) nasce da pupila.

---

## Sincronia e som

**Trilha.** Drone documental tenso, sem bumbo, ~117 BPM nominal (não dirige o corte). Mix final em -14 a -15 LUFS, true peak ≤ -1 dBTP. A trilha cai a -35/-40 dB em 3 respiros: depois do mistério (4–7 s), no meio da manchete e 1 s antes do CTA, para o impacto da etiqueta. Duck da trilha de -8 dB sob a voz.

| Evento | SFX | Nível | Sincronia |
|---|---|---|---|
| Corte duro entre blocos | impacto agudo + whoosh curto | 0 dB | 0 a +2 q depois do corte |
| Reenquadramento · chicote | nenhum | n/a | mudos |
| Saída por tilt ou glitch | whoosh/glitch | -4 dB | +2 a +7 q depois do corte, acabando na 1ª letra do plano seguinte |
| Abertura (cut-in) | tick/clique | -6 dB | +8 q depois do cut-in |
| Objeto que pousa (jornal, círculo fechado) | impacto grave | +3 dB (o mais alto) | +3 q depois do fim do gesto |
| Etiqueta pendular | impacto grave | +3 dB | junto do rack-focus do fundo |
| Palavra isolada na grade | tick agudo curto | -10 dB | +1 q depois do quadro da palavra |
| Coluna de palavras | só o whoosh do corte | n/a | sem batida por palavra |
| Data digitando | tique de tecla | -18 dB | por caractere (1,85 q) |
| Marca-texto, círculo à mão | marcador | -8 dB | durante o traço; grave +3 q após fechar |
| TV: mergulho + painel | whoosh grave + agudo | -6 dB | cobre o push-in de 18 q e termina no corte |
| Fotos do mural | impacto curto | -4 dB | no flash negativo de 2 q, não na 1ª aparição |
| Slide vertical | whoosh suave | -8 dB | começa 4 q antes da borda |
| Punch-in P&B | impacto grave | 0 dB | +0,5 a +3,8 q do corte |
| Portal | agudo/whoosh | -2 dB | +1 q depois da mancha |
| Fechadura | impacto grave | -2 dB | +1,5 a +2,4 q do corte |
| Título 3D | agudo | -4 dB | +0,3 q no corte; sem tick por letra |
| Busca | clique | -10 dB | 1º caractere (0 q) e +1,5 q depois do último |

Regras gerais de sincronia:
- A palavra na tela entra 0–5 q antes da voz.
- SFX nunca em cima de sílaba tônica da locução.
- Impacto em corte: depois do quadro do corte, não no mesmo quadro.

---

## Paleta e letras

### Paleta
| Papel | Cor | Uso |
|---|---|---|
| Preto/carvão | `#05060A` (superfícies `#12141F`) | quadro-negro, mural, fundo da coluna de palavras |
| Branco-papel | `#F4F1E8` | texto, borda das fotos, papel |
| Vermelho (fio condutor) | `#FF2E4D` | sublinhado, etiqueta, moldura, círculo à mão, borda da fechadura; presente em todos os blocos |
| Verde marca-texto | `#B6FF3B` a 85 % `multiply` | 1 por peça, no número ou trecho-prova |
| Amarelo marca-texto | `#FFC21A`, só sobre escuro | data e palavra-herói em fundo escuro; nunca sobre papel claro |
| Azul blueprint | `#0D255C` com linhas `#2563EB` a 35 % | grade das palavras isoladas |
| Clima por plano | 1 matiz forte sobre base escura | cena de IA |

Regra de ouro: um matiz forte por plano sobre base escura; o vermelho costura todos os blocos. Adapte os tokens à identidade visual do seu produto mantendo os papéis (escuro, papel, 1 acento recorrente, 1 marca-texto).

### Tipografia
| Papel | Fonte | Tamanho em 1080x1920 | Detalhe |
|---|---|---|---|
| Palavra isolada, virada | Instrument Serif Italic (alt.: DM Serif Display Italic) | 96–140 px; termo da virada 1,4× | minúscula, cor papel |
| Data, etiqueta, rótulo | Oswald 600 (alt.: Bebas Neue) | data 64–80 px; etiqueta 40–48 px | caixa-alta, tracking +2 %; etiqueta em retângulo vermelho |
| 3D extrudado | Archivo Black | 140–200 px | extrusão ~6 px + sombra macia 40–50 px a -30 % |
| Manchete do documento | serif de jornal (Playfair Display 800 ou DM Serif Display) | 56–72 px dentro do papel | texto seu, em português |

**Sombra única de todas as letras:** `text-shadow: 0 4px 14px rgba(0,0,0,.55)`. Sem contorno grosso (nada de `-webkit-text-stroke`).

### Texturas
Grão de filme (sempre) · quadro-negro com pó de giz e riscos · madeira escura e madeira avermelhada vista de cima · grade azul de projeto com leve barril · papel quadriculado cinza-claro com sombra de janela · painel verde-escuro riscado · parede de pôsteres ou recortes. Gere cada textura uma vez e reuse. Grão e ruído de TV em PNG pré-gerado (nunca `feTurbulence` por quadro).

---

## Regras de anúncio

1. **Leitura a 360 px de largura.** Texto ≥ 64 px; palavra isolada ≥ 96 px; contraste ≥ 4,5:1; manchete curta (até 7 palavras), escrita por você.
2. **Zona 4:5.** Todo conteúdo importante (data, etiqueta, palavra, número circulado, botão, nome digitado) dentro de y 285–1635 de 1920, com margem de ~30 px. Fora disso, só ambiente. Gere uma prévia 4:5 (recorte y 285–1635) e confira antes de entregar. Entregue sempre a arte 9:16 inteira, preenchida até as bordas.
3. **Letras só com sombra suave.** `0 4px 14px rgba(0,0,0,.55)`; sem contorno.
4. **Tela nunca vazia.** TV, computador, celular e monitor sempre com interface sua composta, coerente com a fala (gerenciador de anúncios, WhatsApp, página do produto). Tela branca ou cinza vazia é defeito bloqueante.
5. **Prova = tela que o comprador já usa.** O "documento" da manchete e a revelação são o painel real do seu cliente ou do seu produto, com número verdadeiro; o círculo vermelho vai no número.
6. **Selos honestos.** Jornal ou caso fictício só como moldura dramática, com selo "DRAMATIZAÇÃO" ou "EXEMPLO", nunca imitando veículo real. Depoimento ou resultado real: "caso real · não é promessa de resultado". Personagens de IA são ilustrativos. Nada de logo de terceiro.
7. **Sem overshoot.** Nenhum gesto do estilo passa do ponto: troque `back.out` e `spring` com rebote por `expo.out` ou `power3.out`.
8. **Fotossensibilidade.** No máximo 2 picos de brilho por peça e ≤ 3 flashes por segundo; painel ou estática com luminância ≤ 55 %. O flash negativo do mural só entra se não houver portal.
9. **Loudness.** -14 LUFS, true peak ≤ -1 dBTP.
10. **Roteiro.** Sem preço na voz (o preço fica na página). CTA do tipo "clique em Saiba mais"; produto como objeto (3D mais tela com a página).
11. **Ritmo.** Nunca mais de 2 s sem estímulo novo.

### Checklist de QA
Conferir stills em 0 s, 0,5 s, cada corte ±1 q, virada, revelação, CTA e último quadro.
- [ ] 1 matiz forte por plano; vermelho em todos os blocos; amarelo só sobre escuro.
- [ ] Documento em P&B frio, cena em cor; P&B da contradição por corte de 1 q no quadro da palavra, sem tremor.
- [ ] Todo corte duro com SFX 0 a +2 q depois (reenquadramento e chicote mudos); graves +3 q depois do gesto; palavra 0–5 q antes da voz; trilha cai antes do CTA.
- [ ] Nenhum overshoot; miolo TV + mural em `steps(2)`.
- [ ] Texto ≥ 64 px dentro de y 285–1635, só sombra suave.
- [ ] Nenhuma tela vazia; selos de dramatização presentes onde há caso fictício.
- [ ] Amostra 9:16 aprovada antes de estender.

---

## Tradução HyperFrames e Remotion

### Constantes (Remotion)
```ts
const FPS = 30;
const EASE = {
  out:  Easing.bezier(.16, 1, .3, 1),        // expo.out
  out3: Easing.bezier(.33, 1, .68, 1),       // power3.out
  in2:  Easing.bezier(.55, .085, .68, .53),  // power2.in
  in3:  Easing.bezier(.55, .055, .675, .19), // power3.in
  in4:  Easing.bezier(.895, .03, .685, .22), // power4.in
  etiqueta: Easing.bezier(.3, 0, .1, 1),
  portal:   Easing.bezier(.55, 0, .1, 1),
  chicote:  Easing.bezier(.7, 0, .12, 1),
};
```
Em dois (TV e mural): `const fe = f - (f % 2)` e use `fe` no lugar de `f`. Props em quadros (`entradaQ`, `leituraQ`, `saidaQ`). Sem `spring` com rebote em nenhum gesto.

### Tabela de tradução
| Técnica | HyperFrames (GSAP/CSS) | Remotion |
|---|---|---|
| Push-in de plano | `gsap.fromTo('#plano',{scale:1},{scale:1.19,duration:1.33,ease:'expo.out'})` | `interpolate(f,[0,40],[1,1.19],{easing:EASE.out})` |
| Cut-in e recuo | primeiro plano `scale 3.3 → 1` em 18 q `expo.out`; fundo `.85 → 1` em 16 q | `interpolate(f,[0,18],[3.3,1],{easing:EASE.out})` mais fundo em contra-movimento |
| Objeto-silhueta sobe | `gsap.from('#objeto',{y:803,duration:14/30,ease:'expo.out'})`; disco 715 → 1433 px em 5 q | `y` interpolado, sem `spring` |
| Corte P&B e zoom-out | `set` P&B no quadro; `scale:.53` em 32 q `power2.in` | `<Sequence>` e `interpolate(f,[0,32],[1,.53],{easing:EASE.in2})` |
| Cena vira foto | `saturate` 1 → .28 em 9 q `expo.out`; moldura `polygon` com SVG `stroke` vermelho encolhendo 1042 → 526 px em 10 q | idem com `interpolate` |
| Data digitada | TextPlugin `duration = n*1.85/30`, `ease:'none'`; cursor `steps(1)` de 0,4 s; bloco `y:645 → 0` em 24 q | `txt.slice(0, Math.floor(f/1.85))`; cursor `f%12<6` |
| Wipe de entrada | `clip-path: inset(100% 0 0 0) → inset(0)` em 9 q `expo.out` | `inset` com `interpolate(f,[0,9],[100,0],{easing:EASE.out})` |
| Etiqueta | fenda `y:+430 → 0` em 10 q; `width 130 → 502` em 14 q `cubic-bezier(.3,0,.1,1)`; texto por máscara do centro | `width` com `EASE.etiqueta`; `clipPath inset(0 X% 0 X%)` |
| Palavra isolada | troca por `set` (corte de 1 q); só a 1ª: `from({scale:1.4,rotation:-12},{duration:7/30,ease:'expo.out'})` | `findLast` por quadro; deriva `x += 1.1*f` |
| Marca-texto | `scaleX 0 → 1`, ~16 q por linha, `power2.inOut`, `multiply` | `interpolate(f,[0,16],[0,1],{easing:Easing.inOut(Easing.quad)})` |
| Círculo à mão | SVG `stroke-dashoffset L → 0` em 5 q linear | `strokeDashoffset: interpolate(f,[0,5],[L,0])` |
| Documento que chega | blur 7 q e `scale 1.154 → 1` em 16 q `expo.out` | `interpolate(f,[0,16],[1.154,1],{easing:EASE.out})` |
| Queda na mesa | 8 q de mesa vazia; 27 q `power3.out`; `rotation -20 → -3` | `interpolate` com `EASE.out3` |
| Saída do documento | `onUpdate`: `y = 0.6*t*t`, rotação até -15°, blur proporcional à velocidade | mesma fórmula; rastro só quando v > 29 px/q |
| Reenquadramento | `y:-213` em 23 q `power2.out` → hold 7 q → `scale:.655` em 35 q `power4.in` → blur 2 q | `interpolate` com `EASE.in4` |
| TV | `scale 1.86 → .93` em 36 q `power3.out`, hold 12 q, `scale 1.65` em 18 q `power3.in` + blur 3 q; `steps(2)` | `interpolate` em `fe` |
| Painel com barra | barra clara `y:300 → 0` em 8 q `power2.out` sobre PNG texturizado | `<Sequence>` com `interpolate(f,[0,8],[300,0])` |
| Fotos do mural | posição `exp(-t/9)`, rotação ±6° → 0, conjunto `scale 1 → 1.3` em 41 q; flash `filter: invert(1)` por 2 q; balanço `2.7*sin(2π(t-16i)/60)`; saída `rotation = -0.018*t*t` | idem em `fe` |
| Coluna de palavras | 1ª `scale 1.77 → 1, rotation 27 → 0` em 10 q `expo.out`; novas no topo; coluna desce `1.9*t²` | `y` por palavra com as duas curvas |
| Slide vertical | camada nova `y:1862 → 0` em 9 q `power3.in`, assenta `134+968*0.68^t`, `scale 1.27 → 1` | `interpolate` mais fórmula exponencial |
| Punch-in P&B | corte para `saturate(.45) contrast(1.4)` com tint frio; `scale .86 → 1` em 9 q `power3.out`; `brightness 1.55 → 1` em 5 q; sem tremor | `filter` condicional `f >= fPunch`; sem `noise` |
| Portal circular | `clip-path: circle()` com diâmetros 216 → 412 → 694 → 972 → 1190 → 1356 → 1492 → 1600 → 1690 px, `cubic-bezier(.55,0,.1,1)`, 13 q | `circle(${d/2}px at X Y)` com `EASE.portal` |
| Fechadura | `mask-size` fecha em 17 q `expo.out`, hold 3 q, reabre em 18 q `power3.in` | `<clipPath>` SVG com largura 1078 → 792 → fora |
| 3D extrudado | 6 `text-shadow` de 1 px + sombra macia 40–50 px; letras 2,7/2,1/1,7 q com fade de 2 q; linha `scale +27 %` em 40 q | mesmo `textShadow` em loop; `q = inicio + i*passo` |
| Chicote | `y:1920 → 0` em 26 q `cubic-bezier(.7,0,.12,1)`, sem zoom, sem SFX | `interpolate(f,[0,26],[1920,0],{easing:EASE.chicote})` |
| Pêndulo | queda 24 q `expo.out`; `x = 115*cos(2π(t-t0)/55)`; pivô 510 px acima; fundo `blur 0 → 6px` em 4 q, hold 9 q, volta em 4 q | mesma fórmula com `t = f` |
| Busca de vidro | pílula `width 290 → 600` em 19 q `expo.out`; `backdrop-filter: blur(20px)`; texto 1,5 q/car | `slice` por palavra da fala mais `backdropFilter` |
| Grão e vinheta | PNG em rodízio `steps(6)`, `mix-blend-mode: overlay`, opacidade .1 | `<Img>` por `f % 6`, opacidade .1 |
| Cor seletiva | camada eleita fora do filtro `saturate`; resto `saturate(.28)` | `filter` por camada; eleita entra 0–2 q antes da palavra |
| Close extremo | corte; `scale 1.15 → 1` em 9 q `power3.out`; push-in 2 %/s | `interpolate(f,[0,9],[1.15,1],{easing:EASE.out3})` |

### Qual motor usar
- Peça com pessoa, avatar, legenda longa ou lote: Remotion monta tudo.
- Clipes curtos de motion sem pessoa (data, etiqueta, 3D, portal, fechadura): HyperFrames gera o clipe e o Remotion monta.
- Se o miolo (TV e mural) usar `steps(2)`, aplique em um único wrapper para não duplicar a lógica.
