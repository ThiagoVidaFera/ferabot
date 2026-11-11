---
name: eva-ia-plus
version: 1.0
date: 2026-10-15
sources:
  - projetos/vsl-mct/00-estudo/MANUAL-HC-PARA-VSL-MCT.md (§8 a–d)
  - projetos/vsl-mct/04-assets/personagem/FICHA-CAIO.md (exemplo real)
  - memória REGRAS.md (13/10/2026)
description: "Pipeline de imagem e vídeo com IA para peças sem rosto real (HQ noir, personagem-guia): ficha+âncora, prompt-base, imagens por beat, prévia, image-to-video por tipo de plano, custo. IA nunca desenha texto/número. Triggers: cenas com IA, i2v, Kling, Hailuo, âncora do personagem."
---

> **Origem e adaptação (FeraBot).**
> - Skill do pacote "Sistema de Criativos FCA" (créditos no LEIA-ME desta pasta). No FeraBot ela entra como **direção
>   criativa**: roteiro, cena, regras e checklists.
> - Onde citar `bin/motor-video.py`, `motor-de-video`, `remotion-marca`, `kit/` ou `acervo/`: esses caminhos não existem
>   aqui. Use o que você tem: `ScriptsFera/render.py`, `ScriptsFera/narrar.py` e FFmpeg, ou o motor de vídeo que preferir
>   (HyperFrames ou Remotion, se estiver instalado).
> - Cores, fontes e marcas dos exemplos (MCT, MLC/Lead Certo, FCA, ciano #00f0ff, Sora) são do autor original: aqui valem
>   as do seu `perfil.json`.
> - Prova e número: número sem origem fica fora da peça. Nunca inventar print, depoimento ou resultado. Selo SIMULAÇÃO
>   não libera peça pública.
> - Copy de venda passa pelo checklist A/B/C/D do roteador; mídia gerada por IA tem o custo dito antes de gastar crédito.

# eva-ia-plus — imagem barata + vídeo barato + montagem no Remotion

Pipeline de IA para peças **sem rosto real e sem avatar falando**: voz em off, personagem em HQ/ilustração, telas reais em Remotion. Independe do estilo; o estilo (HQ noir, ensaio noir) vem das skills `eva-hq-ia-noir` e `eva-ensaio-noir-empresario`. Aqui ficam o **processo, a escolha de modelo, os portões e o custo**. Exemplo real preenchido: `projetos/vsl-mct/04-assets/personagem/FICHA-CAIO.md` (Caio, protagonista da VSL do MCT).

## 1. Ficha e âncora (antes de qualquer cena)
Use a skill `ficha-de-personagem` (3 travas: ficha colada inteira · âncora única · 1 mudança por vez). A ficha vira arquivo em `<projeto>/04-assets/personagem/FICHA-<NOME>.md` com:

| Bloco | O que registrar |
|---|---|
| Quem é / papel na peça | nome próprio, função (protagonista ≈ 60 %), batidas em que aparece |
| Silhueta e rosto | proporção (cabeça ≈ 1/7,5), idade, pele, cabelo, barba, olheiras. **Nunca o rosto do autor** |
| Paleta | hex de sombras, meios-tons, luz-chave, altas, 1 cor de alerta pequena, contorno |
| Técnica e luz | contorno grosso, cel shading 2–3 tons, retícula e grão; luz-chave ciano do monitor |
| Figurino / objeto-assinatura | peça que identifica a 48 px (ex.: fone over-ear no pescoço) |
| Expressões e poses | P1 (âncora) a P6; expressões da peça |
| Proibido | rosto do autor, texto/número/logo/interface desenhados, cores fora da paleta, 2º personagem, mascote |
| Teste 48 px | o que tem de ser reconhecível reduzido |

**Âncora:** gerar P1 em `quality: medium` (1024×1536, no máximo 1 referência), 3–4 variações de silhueta em rodadas separadas, 1 aprovada (o autor, ou escolha interna registrada em `ESCOLHA.md` com troca possível na amostra). Salvar `ANCORA-<NOME>.png` + `.md5`. Depois P2–P6 com "mude só a pose" → banco de poses em PNG transparente (rembg, borda conferida a 200 %).

## 2. Prompt-base (colar inteiro em toda geração)
**STYLE** (exemplo HQ noir ciano; trocar paleta/estilo conforme a skill de estilo):
```
STYLE: graphic novel panel, noir comic book art, bold black ink outlines, flat cel shading in 2-3 tones,
halftone dot texture and fine film grain, high contrast chiaroscuro. Limited palette ONLY: near-black navy
#030817 shadows, deep navy #0a1228 and #1a2e55 midtones, single cyan #00f0ff key light / rim light /
screen glow, off-white #f8fafc highlights; amber #ffb020 allowed only as one small warning light.
Vertical 9:16, subject inside the central area (y 420-1500 of 1920), empty space at top 180 px and
bottom 250 px.
LIGHT PHYSICS (mandatory): a screen emits light ONLY from its display face; the person looking at it is lit on the face, chest and hands; the BACK of a laptop lid, monitor or phone is a matte DARK unlit surface, never glowing, never cyan. SCREENS: never an empty white or flat cyan rectangle; a display that faces the camera shows a dim abstract dark-mode ads dashboard (navy panels, a thin cyan line chart, short bar rows, small status dots), shapes only, no readable characters. NEGATIVE: text, letters, words, numbers, captions, logos, readable interface labels, glowing back of a laptop lid, watermark, purple, violet,
magenta, pink, orange, teal, warm sepia, photorealistic skin, 3D render look, anime style, extra fingers,
second character.
```
**CHARACTER** (sempre com a âncora anexada como 1ª e única referência):
```
CHARACTER (series anchor attached - do not redesign): "<NOME>", <descrição da ficha>. Keep face,
proportions, outfit and line weight identical to the anchor. Change only: [pose Pn / expression / scene].
```
Em prompt de vídeo, escrever em inglês e nunca pedir fala (voz é em off). A IA **nunca desenha texto nem número**: toda tela, número e rótulo é real e entra no Remotion.

## 3. Imagens por beat
A decupagem marca cada beat com tipo de plano; só os beats `IA` geram imagem. Regras: 1 frase = 1 cena literal; **1 imagem serve 2–3 batidas** (cortes e enquadramentos diferentes no Remotion). Geração em `gpt-image-2.5` direto na OpenAI, 1024×1536, `medium` (padrão), `high` só se um painel falhar, `low` para storyboard; 1 referência no máximo. Estimativa: ~60 cenas + 30 % de refação. Alimentar tela: o monitor sai como retângulo ciano vazio e a gravação real é mapeada pelos 4 cantos no Remotion.

## 4. Prévia de quadros (portão antes de animar)
Folha de contato numerada de todas as imagens do bloco + folha só dos rostos + **md5 da âncora usada** em cada pedido + teste de 48 px nos closes. Nada vai para i2v sem OK do Opus/o autor na folha. Prévia de 6 quadros contra a âncora quando o personagem tem objeto-assinatura que não pode sumir (óculos, fone).

## 5. Image-to-video por tipo de plano
| Tipo de plano | Modelo | Custo (referência 13–14/10) | Quando sobe de nível |
|---|---|---|---|
| Rosto/gesto (close, ¾, olhos, mão no mouse) | **Kling 2.5 turbo standard** (fal; atenção: a chave `kling25` do `i2v.py` aponta para o Pro, usar `kling25std`) | US$ 0,21 / 5 s | Kling 3 (com Elements) só se o 2.5 falhar 2× no mesmo gesto: US$ 0,14/s |
| Cenário sem gente (multidão em silhueta, cidade, sala vazia) | **Hailuo 2.3 fast** (`fal-ai/minimax/hailuo-2.3-fast/standard/image-to-video`) | US$ 0,19 / 6 s | Hailuo 2.3 std (US$ 0,28) só se o fast falhar; rosto em Hailuo fast não foi testado |
| Ação (mãos, notebook fechando, cadeira girando) | Kling 2.5 turbo std | US$ 0,21 / 5 s | idem |
| Tese, cartela, tela real, gráfico, retrato em pontos | **Remotion/HyperFrames** (Ken Burns 1,00→1,08 em 3 s, parallax §8) | US$ 0 | — |
| Física complexa / áudio nativo | Veo 3.1 Fast | US$ 0,50–0,75 / 5 s (informado) | não previsto em VSL sem avatar |

**Conferir o preço no fal no dia:** os valores acima são de 13–14/10/2026 e mudam. Antes do lote, 1 chamada de preço por endpoint na API do fal e conferir o saldo informado pelo autor; nunca estimar de memória. Transição entre dois estados no mesmo prompt é o ponto mais difícil da IA: preferir **2 clipes curtos + transição do catálogo no Remotion**, ou i2v com quadro inicial e final entre duas imagens aprovadas.

## 6. Prompts de câmera (i2v)
Sempre incluir: "keep the exact line art, halftone, palette and face from the first frame; no new objects, no text, no morphing".
- **Push-in:** `Slow push-in toward his face over 5 seconds, camera otherwise locked. Minimal motion: one slow blink, the cyan screen glow flickers softly. Keep the exact line art, halftone, palette and face from the first frame. No new objects, no text, no camera shake, no morphing.`
- **Parallax (só quando o Remotion não basta):** `Very slow lateral truck to the left; the desk edge and coffee mug in the foreground slide slightly faster than the window in the background, creating gentle depth. Character stays still except breathing. Keep line art and palette. No text.`
- **Tilt:** `Slow tilt up from his hands on the keyboard to his tired eyes, 5 seconds, smooth, no zoom. His fingers stop typing as the camera reaches his face. Keep line art, palette and face identical. No text.`
- **Cenário:** `Very slow drone push forward over the crowd. Phone glows flicker irregularly, fog drifts slowly. Nobody turns to the camera, nobody walks. Keep palette, line art and halftone. No text, no new objects.`

## 7. Upscale seletivo
Saídas de i2v costumam vir abaixo de 1080×1920 (Hailuo fast 768×1152; conferir a de cada modelo no fal). Traço chapado + retícula + grão tolera ampliação de 1,25–1,5× sem IA. **Upscale de IA só** em plano em tela cheia que fica > 3 s **e** é close de rosto ou detalhe de mão; **nunca** em plano que vai receber parallax (a ampliação acontece no Remotion).

## 8. Montagem 2.5D no Remotion (parallax por camadas recortadas)
Em vez de recortar uma imagem pronta (deixa buraco), **gerar camadas separadas**: (a) cenário vazio com o mesmo prompt e a mesma luz ("same room, no person"); (b) o personagem na pose, fundo liso da cor de sombra → rembg → PNG. Cena de 3–5 s:
```tsx
const p = interpolate(frame, [0, dur], [0, 1], {easing: Easing.inOut(Easing.sin)});
// fundo: 1.00→1.04 e −12 px; personagem: 1.00→1.08 e +18 px; frente (mesa/caneca): 1.00→1.12 e +30 px
<AbsoluteFill style={{transform: `scale(${1 + 0.04 * p}) translateX(${-12 * p}px)`}}><Img src={fundo}/></AbsoluteFill>
<AbsoluteFill style={{transform: `scale(${1 + 0.08 * p}) translateX(${18 * p}px)`}}><Img src={personagemPng}/></AbsoluteFill>
<GrainVignette/>
```
Desfoque leve no fundo (`blur(1.5px)`), sombra de contato sob o personagem, `@remotion/motion-blur` desligado nas camadas lentas. Teste de 5 s em MP4 antes de usar. Efeito no catálogo: `parallax-hq-2-camadas`.

## 9. Grade de cor única
Uma camada global sobre toda a composição (nunca por cena) para unificar clipes de modelos diferentes: `filter: contrast(1.12) saturate(0.85) brightness(0.96)` + sobreposição `#0a1228` a 10 % em `mix-blend-mode: color` + `GrainVignette` (grão 6 %, queda de borda 12 %). Metas medidas: contraste 56–65, vinheta (anel/centro) 0,72–0,88, preto 26–43 % do quadro (`catalogo-de-efeitos/PADRAO-DE-MOVIMENTO.md` §8). Revelação em `grayscale(1)` com volta à cor em corte seco. Valores iniciais: travar na amostra aprovada.

## 10. Custos (VSL de 12 min, referência 13–14/10/2026)
| Item | Qtd. | Unitário | Total |
|---|---|---|---|
| Imagens (ficha + poses + ~60 cenas + 30 % refação), `medium` | ~85 | US$ 0,02 | US$ 1,70 |
| Painéis que falham em `medium` (`high`) | ~10 | US$ 0,055 | US$ 0,55 |
| i2v rosto/ação, Kling 2.5 turbo std | ~30 de 5 s | US$ 0,21 | US$ 6,30 |
| i2v cenário, Hailuo 2.3 fast | ~8 de 6 s | US$ 0,19 | US$ 1,52 |
| Closes críticos, Kling 3 (só se o 2.5 falhar 2×) | até 4 × 5 s | US$ 0,70 | até US$ 2,80 |
| Upscale seletivo | ~10 planos | — | ~US$ 3,00 |
| Refação de i2v (30 %) | — | — | US$ 2,35 |
| **Total** | | | **≈ US$ 18–19 (≈ US$ 1,5–1,6 por minuto de VSL)** |

Registrar cada geração em `04-assets/CUSTOS.json` (modelo, preço conferido no dia, saída). Reabrir o cálculo se o preço do fal mudou.

## 11. Portões
1. **Folha de quadros** numerada aprovada antes do i2v (§4).
2. **md5 da âncora** registrado em cada pedido; um rosto por peça.
3. **Teste de 48 px** nos closes.
4. **Amostra de 5 s em MP4** antes de qualquer técnica nova (parallax, trajeto, 3D).
5. **Custo estimado + 30 %** de refação aprovado antes do lote; preço conferido no fal no dia.
6. **Lote G2 (amostra) antes do lote completo.**
7. Arquivo final sem rótulo interno de produção.

## 12. Regras da casa
- ⛔ **Tela nunca vazia + luz da tela (o autor, 15/10):** celular, tablet, notebook, monitor ou "carta" virados para a câmera NUNCA aparecem brancos/ciano chapado — mostram painel escuro abstrato gerado (gráfico, linhas, pontos de status, sem letras) ou recebem o print real no Remotion. Só a FACE da tela emite luz: quem olha fica iluminado; a tampa/costas do aparelho são escuras. Conferir a âncora antes de usá-la como ref (a âncora v1 do Caio tinha a tampa acesa e contaminou as cenas) e, no i2v, escrever "the laptop does NOT rotate" (o Kling virou o notebook e inventou texto).
- A IA nunca desenha texto nem número; **IA nunca é prova** (prova é print/gravação real com origem).
- Zero avatar e zero rosto do autor; voz clonada nunca sobre o autor falando; 1 take de voz.
- Um rosto por peça (conferir md5 da âncora no `public`); objeto-assinatura sempre visível (nada de mão na frente).
- Rosto em Kling 2.5 turbo **standard**; Kling 3 só depois de 2 falhas; nunca Veo 3 Quality.
- Não animar com fal/Kling/Hailuo em robôs de imagem em lote (ex.: robô FCA): movimento só local no Remotion.
- 1 clipe de 5–6 s serve 2–3 batidas; motion sem personagem no Remotion/HyperFrames a custo zero.
- Gerar `9:16` primeiro; b-roll sóbrio; sem cor fora da paleta da ficha.

## Curso × EVA IA+ (por que não copiar o curso)
| O curso faz | Falha | EVA IA+ faz |
|---|---|---|
| Consistência por print + "use the same…" em text-to-video | o rosto deriva a cada clipe | imagem âncora aprovada → i2v; folha de 6 quadros contra a âncora |
| Estética ultra-realista | mostra a costura; refação cara | HQ noir 2D chapado, que a própria Estilo Visual de Anúncio (EVA) usa nas peças de 2026 |
| Veo 3 Quality (100 créditos/clipe) | caro; o diferencial (lip sync) é inútil sem avatar | imagem + i2v barato; 1 clipe serve 2–3 batidas |
| Transição num prompt só | perde o clipe inteiro quando erra | 2 clipes curtos + transição no Remotion, ou quadro inicial e final |
| Mix "no olho" | sem referência | mix por números (`catalogo-de-efeitos/RECEITAS-SOM-EVA.md`) |
| Legenda amarela / CTA flash | datado; flash pode passar de 3/s | legenda 2026 minúscula; qualquer flash ≤ 3/s |

## Saída
`custos.json`, folha de contato, banco de poses, clipes nomeados por beat (`<beat>-<asset_id>.mp4`), `PROMPTS.json`. Processo de ligação com a decupagem: `(plano interno)` (F5d).
