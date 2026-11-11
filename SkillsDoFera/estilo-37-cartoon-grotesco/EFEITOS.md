# EFEITOS — estilo 37 · Cartoon grotesco de humor (POV)

15 efeitos com número de montagem e o código para HyperFrames (GSAP) e Remotion. q = quadro a 30 fps. Os ids conversam com a
skill `catalogo-de-efeitos` (quando há um parecido lá, está indicado como "variante de").

| # | id | o que é | número de projeto | som |
|---|---|---|---|---|
| 01 | `push-in-linear-em-ilustracao` (variante de `gravura-push-in-continuo`) | ilustração parada ampliada sem parar | +16 %/s linear, deriva 60–90 px/s, sem ease | nenhum |
| 02 | `boca-de-dois-desenhos-pelo-volume` | boca fechada/aberta/dentes trocada pelo volume | 2–3 q no grito, 5–10 q na fala; mínimo 2 q por estado | — |
| 03 | `smash-in-nos-olhos-de-quem-reage` (variante de `close-extremo-de-detalhe`) | corte seco para close extremo dos olhos | corte 1 q, segura ~33 q em push-in, volta 1 q | nenhum |
| 04 | `mergulho-no-preto-entre-blocos` | o plano afunda no preto e o próximo nasce dele | 11 q desce, 1–2 q preto, 15–30 q sobe | trilha/stinger entra no preto |
| 05 | `corte-para-pb-de-vergonha` (variante de `flashback-preto-e-branco`) | "morri por dentro": P&B em corte seco | 1 q; dura 15–80 q ou até o fim | boom grave no quadro do corte |
| 06 | `crash-zoom-final-nos-olhos` | fim: zoom acelerando até só os olhos | 20 q, `power2.in`, ×3,5, sem fade | trilha subindo |
| 07 | `pov-titulo-fixo-sobre-quadro-quadrado` (variante de `base-9x16-preto-centro`) | título POV fixo + quadro 1:1 | título em y ≥ 300; quadro 1080×1080 | — |
| 08 | `palavra-manuscrita-silaba-a-silaba` (variante de `script-manuscrito-que-se-escreve`) | palavra à mão aparecendo por sílabas | sílabas a cada 10–12 q, sem traçado | nenhum |
| 09 | `fantasia-de-ego-com-aura` | o personagem se imagina poderoso | 4–8 s sem fala, mergulhos no preto a cada ~1,6–2,3 s | trilha forte −14/−16 dB com sub-grave |
| 10 | `iris-de-desenho-classico-no-rosto` | círculo fecha no rosto do alvo da piada | da tela cheia a ~1/3 em ~50 q, segura ~10 q | trilha segue; voz parada |
| 11 | `reacao-muda-com-zoom-antes-do-punch` (variante de `som-silencio-estrategico`) | a voz para; o rosto calado em zoom | 1,5–3 s em peça de 15 s | só ambiente |
| 12 | `lagrima-em-cachoeira` | dois jatos de lágrima do olho ao queixo | desenho fixo + push-in | boom grave |
| 13 | `primeiro-plano-desfocado-de-costas` | ombro/cabeça do outro de costas, borrado | 20–35 % do quadro na borda, desfoque forte | — |
| 14 | `esquete-repetida-em-loop` | a esquete toca de novo inteira | só no orgânico | áudio repete igual |
| 15 | `inserto-do-objeto-desmentido` (variante de `som-sfx-do-objeto`) | close do objeto que desmente a fala | corte 5 q depois da palavra, segura ~27 q | 1 efeito discreto no corte |

## Fichas

### 01 · Push-in linear em ilustração
Em **todo plano** a ilustração é ampliada sem parar a **+16 %/s** (faixa medida +13 a +19 %/s), **linear**, já em movimento no 1º
quadro, com deriva lateral de 60–90 px/s. Um plano de 8 s chega a ~×2,3 e o desenho borra — desejado. Imagem-base em 1080 de
largura (não 4K), para borrar no close.
- HyperFrames: `gsap.fromTo('#plano',{scale:1,x:0},{scale:1+0.16*dur,x:-75*dur,duration:dur,ease:'none'})`.
- Remotion: `const s=1+0.16*(frame/30); const x=-2.5*frame;` em `transform: translateX(${x}px) scale(${s})`, origem no rosto.

### 02 · Boca de 2–3 desenhos pelo volume
Corpo fixo; a boca alterna entre **fechada / aberta (trapézio preto) / dentes**. No grito ~12 trocas/s (intervalos 2-3-2-3 q,
segurando 5–8 q nas respirações); na fala normal ~4 trocas/s (5–10 q). Sem fonemas, sem piscada; o corpo não acompanha.
- HyperFrames: pré-calcule o volume da voz por quadro (RMS) num JSON; `tl.set('#boca-aberta',{opacity: v>lim?1:0},t)` por
  quadro, com histerese de 2 q.
- Remotion: `visualizeAudio({fps,frame,audioData,numberOfSamples:16})`; `aberta = media(v) > 0.12`; segure o estado no mínimo
  2 q; 3º desenho ("dentes") quando `v` está entre os dois limiares.

### 03 · Smash-in nos olhos de quem reage
Logo depois da fala absurda, corte de **1 q** do plano médio para o **close extremo dos olhos** (olho ≈ metade da largura), que
segura ~**33 q** em push-in e borra; volta seca em 1 q. Também serve de gancho no 1º segundo.
- HyperFrames: `tl.set('#close',{opacity:1},t).set('#close',{opacity:0},t+1.1)` + `gsap.fromTo('#close',{scale:1},{scale:1.18,duration:1.1,ease:'none'})`.
- Remotion: `<Sequence from={t0} durationInFrames={33}><Img src="close-olhos.png" style={{transform:`scale(${1+0.006*f})`}}/></Sequence>`.

### 04 · Mergulho no preto entre blocos
Opacidade do preto 0 → 1 em **11 q linear**, **1–2 q** cheio, 1 → 0 em **18 q**. Não é fusão: o próximo plano nasce do preto.
Separa blocos; no máximo 1 numa peça de 15 s, antes do punch. A trilha/stinger entra no preto.
- HyperFrames: `tl.to('#preto',{opacity:1,duration:11/30,ease:'none'}).to('#preto',{opacity:0,duration:18/30,ease:'none'},'+=0.05')`, troca de cena no meio.
- Remotion: `opacity = f<11 ? f/11 : f<13 ? 1 : Math.max(0,1-(f-13)/18)`; corte da `Sequence` no q12.

### 05 · Corte para P&B de vergonha
Estado emocional ("morri por dentro"): saturação some em **1 q**, dura 15–80 q ou fica até o fim. Pode ganhar um 💀 desenhado.
- Som: **boom grave** (40–60 Hz, pico −12 a −18 dBFS) no mesmo quadro; trilha de "climão" a −12 dB pode entrar junto.
- HyperFrames: `tl.set('#plano',{filter:'grayscale(1) contrast(1.1)'},t)` + áudio do boom em t.
- Remotion: `filter: frame>=corte ? 'grayscale(1) contrast(1.1)' : 'none'` + `<Audio>` do boom numa `Sequence` em `corte`.

### 06 · Crash zoom final nos olhos
Corte de 1 q para o rosto já em close; zoom **acelerando** até só os olhos em **20 q** (≈ ×3,5), borrado; o vídeo acaba no último
quadro do zoom, sem fade, e o Reel recomeça (loop).
- HyperFrames: `gsap.fromTo('#rosto',{scale:1},{scale:3.5,duration:20/30,ease:'power2.in',transformOrigin:'50% 38%'})`.
- Remotion: `scale = interpolate(f,[0,20],[1,3.5],{easing:Easing.in(Easing.quad)})`, origem nos olhos; a peça termina em f=20.

### 07 · Título "POV" fixo sobre quadro quadrado
Faixa preta no topo com o título branco em até 2 linhas, CAIXA-ALTA, sans geométrica extra-negrito (~52 px), centralizado, em
**y ≥ 300**; quadro útil **1080×1080** logo abaixo; preto embaixo. Variação: quadro 5:4 (1080×865) com legenda de fala pequena
(~24 px, caixa-alta branca) no pé. Título longo: corte com reticências.
- `<div style="position:absolute;top:300px;width:1080px;text-align:center;font:800 52px Montserrat,sans-serif;text-transform:uppercase;color:#fff">`; quadro em `top:440px;height:1080px`.

### 08 · Palavra manuscrita sílaba a sílaba
Corte seco para folha branca; a palavra (letra de caneta, caixa-alta torta) aparece **por sílabas inteiras** a cada 10–12 q,
casando com a voz, sem traçado progressivo; a câmera desliza devagar. Bom para cartela "3 MESES DEPOIS" ou o lead escrevendo "qnt fica?".
- Código: `txt.slice(0, silabasAte(frame))`, com os tempos tirados da transcrição por palavra (`bin/transcrever.py ... --palavras`).

### 09 · Fantasia de ego com aura
O personagem se imagina poderoso (corpo de baixo para cima, óculos escuros, leque de notas): **fundo branco estourado com manchas
roxas desfocadas pulsando**, rótulo minúsculo fixo no centro, mergulhos no preto no ritmo da música, **sem fala por 4–8 s**.
- Som: trilha forte a −14/−16 dB com sub-grave; a voz volta em corte seco e a realidade "quebra" a fantasia.
- HyperFrames: 3–4 PNGs em sequência com mergulhos; manchas = 6 `div` roxos com `filter:blur(40px)` e
  `gsap.to(...,{scale:1.2,opacity:.6,yoyo:true,repeat:-1,duration:.5})`.

### 10 · Íris de desenho clássico no rosto
Já em P&B, máscara circular encolhe da tela cheia até ~1/3 da largura em **~50 q**, centrada no rosto do alvo da piada; segura
~10 q e escurece.
- HyperFrames: `gsap.fromTo('#plano',{clipPath:'circle(110% at 50% 40%)'},{clipPath:'circle(18% at 50% 40%)',duration:50/30,ease:'power1.in'})`.
- Remotion: `clipPath: circle(${interpolate(f,[0,50],[110,18])}% at 50% 40%)`.

### 11 · Reação muda com zoom antes do punch
A voz para; a imagem é o rosto de quem vai reagir (ou o "intruso" entrando) em push-in contínuo. O punch vem 7–20 q depois de
um mergulho no preto, ou 2–4 q depois do corte para quem fala. Some **a voz**, não a imagem. 1,5–3 s numa peça de 15 s; só ambiente.

### 12 · Lágrima em cachoeira
Dois jatos largos azul-claro com contorno saem dos olhos e descem até o queixo; desenho fixo, o movimento é o push-in.
Para mais vida: 2 desenhos da lágrima alternando em `steps(2)` a cada 6 q. Boom grave junto.

### 13 · Primeiro plano desfocado de costas
Cabeça/ombro do outro personagem de costas, **borrado**, ocupando 20–35 % do quadro na borda; quem fala fica nítido no outro
terço. Dá plano e contraplano com 1 desenho por personagem.
- Código: o mesmo PNG do outro personagem, espelhado, `filter: blur(18px)`, escala 1,8, ancorado no canto.

### 14 · Esquete repetida em loop
A esquete inteira toca de novo, idêntica. Só no orgânico (dobra o tempo assistido); nunca em anúncio pago.

### 15 · Inserto do objeto desmentido
5 q depois da palavra, corte para o close do objeto que desmente a fala (o "visualizado ✓✓", a taça de "vinho" que é
refrigerante), segura ~27 q com o push-in do efeito 01; o único efeito sonoro do diálogo, discreto.

## O que NÃO usar neste estilo
Shake de câmera, whip pan, freeze frame, smear, squash and stretch, boing, apito, arranhão de disco, risada de claque, legenda
palavra a palavra estilizada, CTA falado.
