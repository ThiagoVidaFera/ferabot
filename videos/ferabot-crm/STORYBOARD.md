---
format: 1080x1920
message: "Nenhum lead esfria. O FeraBot organiza e avisa sozinho."
arc: Demo Loop
audience: profissional liberal que recebe lead mas perde venda por falta de follow-up, sem equipe, leigo em tecnologia
mode: collaborative
music: confident warm minimal underscore
---

## Video direction

- palette: `{colors.cream}` ground throughout every frame; content gathers on the half-step `{colors.tile}` surface; `{colors.ink}` voice; `{colors.coral}` is the single voltage per frame (never two coral moments in one frame); `{colors.navy}` reserved exclusively for the Claude Code terminal/code-surface in Frame 3.
- motion grammar: long-tail `power3` eases everywhere; reveals are cued to the voiceover — nothing appears before the VO names it. The one sanctioned spring is the CTA release-ripple in Frame 6 (cta-morph-press's own signature).
- rhythm: Frames 1-2 brisk (type lands, mark assembles) -> Frames 3-4 are the demo engine, the busiest and most detailed -> Frame 5 is the deliberate held breather (titlecard-reveal; calm, low motion is the point) -> Frame 6 closes on the CTA morph + press.
- negative list: no cool gray / pure white / pure black; no floating bokeh or purple-blue "AI" gradient cliches; no browser chrome or real OS cursor (only the composed cursor actor in Frame 3); no slideshow (front-load-then-freeze) and no screensaver (independently floating elements) failure modes.


## Frame 1 — Hook

- scene: Tela cheia cor creme, tipografia grande batendo a dor do lead esquecido
- voiceover: "Cada lead que você não responde rápido... foi pro concorrente."
- duration: 4.5s
- transition_in: cut
- status: outline
- src: compositions/frames/01-hook.html
- type: hook
- persuasion: Pain validation
- beat: anxiety
- asset_candidates:

- blueprint: kinetic-type-beats (Adapt)

Adapt: keep the fixed-line flash-in + accent-underline signature from the hook-flash sub-shape; single complete line, no token-swap escalation (the question is already the whole beat).
Scene 1 (0.0-1.2s): cream ground; bold ink headline hard-cut FLASHES in dead-center as the VO opens the line — no fade, no slide. Centered, ~50% of frame, 1 depth layer.
Scene 2 (1.2s-end): as the VO lands the back half of the line, a coral underline draws left-to-right beneath the key phrase; the line holds still and reads — no further motion.

narrativeRole: Nomeia a dor concreta — lead perdido por lentidão de organização, não de vontade.
keyMessage: Não é falta de lead. É falta de follow-up.

## Frame 2 — Product intro

- scene: Terminal Claude Code some no centro, badge "FeraBot CRM de Leads" desenha ao lado
- voiceover: "Isso aqui é o Claude Code — com o FeraBot CRM instalado."
- duration: 5.2s
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
Scene 2 (1.0s-end): as the VO names "com o FeraBot CRM instalado", a mono-label badge pill (FeraBot CRM, JetBrains Mono, coral border) cascades in beside the mark and the lockup settles static, holds.

narrativeRole: Nomeia o agente antes da demo.
keyMessage: Claude Code + FeraBot CRM, rodando de verdade.

## Frame 3 — Demo: o pedido

- scene: Superfície de terminal recebe o comando; ao lado, um quadro de leads (novo/em conversa/fechado) aparece
- voiceover: "Fala o que precisa: 'organiza os leads da semana e me avisa quem esfriou.'"
- duration: 5.7s
- transition_in: crossfade
- status: outline
- src: compositions/frames/03-demo-pedido.html
- type: feature_showcase
- persuasion: Show-don't-tell proof
- beat: intrigue
- asset_candidates:

- blueprint: cursor-ui-demo (Adapt)

Adapt: keep the cursor-driven live-response signature from key-feature-cursor-ui-demo; a single surface (the warm-navy code-surface terminal, with a slim kanban strip docked below it) and a single typed beat, not the full 2-4 beat chase (the line is one short command).
Scene 1 (0.0-~1.5s): the warm-navy code-surface terminal, with a slim kanban strip docked below it establishes centered on cream ground (title bar + traffic-light dots + mono filename chrome) as the VO says "Fala o que precisa:" — a coral caret blinks at the empty prompt. Centered, ~55% of frame, code-surface dense.
Scene 2 (~1.5s-end): as the VO speaks the quoted command, "organiza os leads da semana e me avisa quem esfriou" types on character-by-character after the coral `>` prompt glyph; camera holds static on the surface; ends on the full typed line holding, caret still blinking.

narrativeRole: Mostra o pedido em linguagem natural organizando dado bagunçado.
keyMessage: Organizar CRM vira um pedido, não uma tarde de planilha.

## Frame 4 — Demo: o resultado

- scene: Cards de lead se movem sozinhos entre colunas do quadro; um alerta destaca "sem resposta há 2 dias"
- voiceover: "Cada lead no lugar certo — e um aviso pra quem tá esfriando."
- duration: 5.8s
- transition_in: crossfade
- status: outline
- src: compositions/frames/04-demo-resultado.html
- type: feature_showcase
- persuasion: Show-don't-tell proof
- beat: relief
- asset_candidates:

- blueprint: device-surface-showcase (Adapt)

Adapt: keep the static-tour screen-establish + single screen-advance signature from key-feature-device-screen-tour; no camera move (a 4-5s beat doesn't support the continuous 3D push variant) and one advance beat, not 2-4.
Scene 1 (0.0-~1.5s): a kanban board (Novo / Em conversa / Fechado columns) establishes centered on cream ground, settling with a coral accent shape scaling up behind it, as the VO opens the line. Centered, ~50% of frame, coral accent shape 1 layer behind.
Scene 2 (~1.5s-end): as the VO names the result, lead cards slide from Novo into Em conversa one by one, and a coral alert badge ("sem resposta há 2 dias") pops onto the one card that's stalling; holds static on the final settled state — no camera move, no cursor.

narrativeRole: Paga a promessa — o sistema não só guarda dado, ele avisa e organiza.
keyMessage: O CRM cuida de não deixar ninguém esquecido.

## Frame 5 — Benefício / confiança

- scene: Três linhas de benefício empilham em cartões limpos sobre fundo creme
- voiceover: "Sem planilha. Sem CRM caro. Menos de 2 horas por dia."
- duration: 7.3s
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

narrativeRole: Remove a objeção "eu preciso de um CRM pago ou de alguém pra cuidar disso".
keyMessage: Funciona sem ferramenta extra nem contratação.

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

narrativeRole: Fecha com ação clara e de baixo risco.
keyMessage: Clica e eu instalo pessoalmente.
