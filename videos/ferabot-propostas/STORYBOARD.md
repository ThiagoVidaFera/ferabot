---
format: 1080x1920
message: "Fala o que precisa. O FeraBot monta a proposta pronta, sozinho."
arc: Demo Loop
audience: profissional liberal que fecha cliente sozinho, sem equipe, leigo em tecnologia
mode: collaborative
music: confident warm minimal underscore
---

## Video direction

- palette: `{colors.cream}` ground throughout every frame; content gathers on the half-step `{colors.tile}` surface; `{colors.ink}` voice; `{colors.coral}` is the single voltage per frame (never two coral moments in one frame); `{colors.navy}` reserved exclusively for the Claude Code terminal/code-surface in Frame 3.
- motion grammar: long-tail `power3` eases everywhere; reveals are cued to the voiceover — nothing appears before the VO names it. The one sanctioned spring is the CTA release-ripple in Frame 6 (cta-morph-press's own signature).
- rhythm: Frames 1-2 brisk (type lands, mark assembles) -> Frames 3-4 are the demo engine, the busiest and most detailed -> Frame 5 is the deliberate held breather (titlecard-reveal; calm, low motion is the point) -> Frame 6 closes on the CTA morph + press.
- negative list: no cool gray / pure white / pure black; no floating bokeh or purple-blue "AI" gradient cliches; no browser chrome or real OS cursor (only the composed cursor actor in Frame 3); no slideshow (front-load-then-freeze) and no screensaver (independently floating elements) failure modes.


## Frame 1 — Hook

- scene: Tela cheia cor creme, tipografia grande batendo pergunta por pergunta
- voiceover: "Quantas propostas você já perdeu — só por demorar pra mandar?"
- duration: 5.1s
- transition_in: cut
- status: outline
- src: compositions/frames/01-hook.html
- type: hook
- persuasion: Pain validation
- beat: frustration
- asset_candidates:

- blueprint: kinetic-type-beats (Adapt)

Adapt: keep the fixed-line flash-in + accent-underline signature from the hook-flash sub-shape; single complete line, no token-swap escalation (the question is already the whole beat).
Scene 1 (0.0-1.2s): cream ground; bold ink headline hard-cut FLASHES in dead-center as the VO opens the line — no fade, no slide. Centered, ~50% of frame, 1 depth layer.
Scene 2 (1.2s-end): as the VO lands the back half of the line, a coral underline draws left-to-right beneath the key phrase; the line holds still and reads — no further motion.

narrativeRole: Abre com a dor específica de quem perde venda por lentidão operacional.
keyMessage: Demorar pra mandar proposta custa cliente.

## Frame 2 — Product intro

- scene: Terminal Claude Code some no centro, badge "FeraBot Propostas" desenha ao lado
- voiceover: "Isso aqui é o Claude Code — com o FeraBot Propostas instalado."
- duration: 5.1s
- transition_in: zoom-through
- status: outline
- src: compositions/frames/02-product-intro.html
- type: product_intro
- persuasion: Authority by association
- beat: curiosity
- asset_candidates:

- blueprint: logo-assemble-lockup (Adapt)

Adapt: keep the ignite + cascade signature from product-intro-logo-system-assemble; drop the isometric camera tilt (too heavy for a ~5s beat) — hold flat, front-facing throughout.
Scene 1 (0.0-1.0s): cream ground; faint concentric coral guide rings pulse outward from center as the VO says "Isso aqui é o Claude Code" — the coral spike mark (kicker glyph) ignites dead-center. Centered, ~40% of frame.
Scene 2 (1.0s-end): as the VO names "com o FeraBot Propostas instalado", a mono-label badge pill (FeraBot Propostas, JetBrains Mono, coral border) cascades in beside the mark and the lockup settles static, holds.

narrativeRole: Nomeia o produto e o agente específico antes da demo.
keyMessage: Claude Code + FeraBot Propostas, rodando de verdade.

## Frame 3 — Demo: o pedido

- scene: Superfície de terminal (code-surface) recebe o comando digitado/falado em português
- voiceover: "Fala o que precisa: 'gera a proposta pro Ricardo, plano premium.'"
- duration: 5.3s
- transition_in: crossfade
- status: outline
- src: compositions/frames/03-demo-pedido.html
- type: feature_showcase
- persuasion: Show-don't-tell proof
- beat: intrigue
- asset_candidates:

- blueprint: cursor-ui-demo (Adapt)

Adapt: keep the cursor-driven live-response signature from key-feature-cursor-ui-demo; a single surface (the warm-navy code-surface terminal) and a single typed beat, not the full 2-4 beat chase (the line is one short command).
Scene 1 (0.0-~1.5s): the warm-navy code-surface terminal establishes centered on cream ground (title bar + traffic-light dots + mono filename chrome) as the VO says "Fala o que precisa:" — a coral caret blinks at the empty prompt. Centered, ~55% of frame, code-surface dense.
Scene 2 (~1.5s-end): as the VO speaks the quoted command, "gera a proposta pro Ricardo, plano premium" types on character-by-character after the coral `>` prompt glyph; camera holds static on the surface; ends on the full typed line holding, caret still blinking.

narrativeRole: Mostra a simplicidade do pedido — linguagem natural, não código.
keyMessage: Você só precisa saber pedir, em português.

## Frame 4 — Demo: o resultado

- scene: PDF da proposta se monta e folheia sozinho, com a marca do cliente
- voiceover: "Em segundos, o PDF sai pronto — sua marca, seu preço, sua voz."
- duration: 7.3s
- transition_in: crossfade
- status: outline
- src: compositions/frames/04-demo-resultado.html
- type: feature_showcase
- persuasion: Show-don't-tell proof
- beat: awe
- asset_candidates:

- blueprint: device-surface-showcase (Adapt)

Adapt: keep the static-tour screen-establish + single screen-advance signature from key-feature-device-screen-tour; no camera move (a 4-5s beat doesn't support the continuous 3D push variant) and one advance beat, not 2-4.
Scene 1 (0.0-~1.5s): a document page (PDF cover) establishes centered on cream ground, settling with a coral accent shape scaling up behind it, as the VO opens the line. Centered, ~50% of frame, coral accent shape 1 layer behind.
Scene 2 (~1.5s-end): as the VO names "sua marca, seu preço, sua voz", the PDF pages flip through in sequence (cover -> escopo -> investimento -> assinatura), each page settling before the next; holds static on the final settled state — no camera move, no cursor.

narrativeRole: Paga a promessa do hook — o resultado tangível e rápido.
keyMessage: O trabalho sai pronto, não só uma resposta de chat.

## Frame 5 — Benefício / confiança

- scene: Três linhas de benefício empilham em cartões limpos sobre fundo creme
- voiceover: "Sem equipe. Sem saber programar. Menos de 2 horas por dia."
- duration: 7.1s
- transition_in: crossfade
- status: outline
- src: compositions/frames/05-beneficio.html
- type: benefit_highlight
- persuasion: Friction reduction
- beat: relief + control
- asset_candidates:

- blueprint: titlecard-reveal (Reproduce)

Reproduce: the Benefits sub-shape exactly — empty-to-text open, one slide-up crossfade between the line's two halves, static camera throughout.
Scene 1 (0.0-0.4s): cream ground, static, empty — nothing on screen yet.
Scene 2 (0.4s-~mid): as the VO speaks the first clause, it fades in centered while scaling ~95%->100% (smooth ease-out), holds.
Scene 3 (~mid-end): the first clause translates up and fades out as the closing clause ("Menos de 2 horas por dia") translates up from below center and fades in to take its place; holds to end.

narrativeRole: Remove a última objeção — "isso não é pra mim, sou leigo".
keyMessage: Funciona pra quem não é técnico e tem pouco tempo.

## Frame 6 — CTA

- scene: Wordmark Claude Code assenta no centro, linha de CTA sobe embaixo
- voiceover: "Eu instalo isso na sua máquina, ao vivo. Claude Code, no link."
- duration: 6.4s
- transition_in: crossfade
- status: outline
- src: compositions/frames/06-cta.html
- type: cta
- persuasion: Risk reversal
- beat: motivation
- asset_candidates:

- blueprint: cta-morph-press (Reproduce)

Reproduce: the full four-scene signature — presence, morph, cursor approach, press. Camera static throughout (a camera move would compete with the click as the climax).
Scene 1 (0.0-1.4s): the Claude Code wordmark holds dead-center, alive with only a faint rotational breath, as the VO opens "Eu instalo isso na sua máquina, ao vivo."
Scene 2 (1.4-2.4s): as the VO lands "ao vivo", the wordmark CONDENSES at the same screen center into a smaller, brighter coral CTA pill — shared transform-origin so the eye reads one element transforming.
Scene 3 (2.4-3.4s): as the VO says "Claude Code,", a cursor arrives on a decelerating path from off-stage, landing a few px off the CTA's geometric center — the aim reads human.
Scene 4 (3.4s-end): as the VO lands "no link", the cursor presses — cursor and CTA compress together in lockstep, then release with a soft coral ripple / glow bloom; holds on the clicked state.

narrativeRole: Fecha com ação clara e de baixo risco (instalação ao vivo, garantia já comunicada na página).
keyMessage: Clica e eu instalo pessoalmente.
