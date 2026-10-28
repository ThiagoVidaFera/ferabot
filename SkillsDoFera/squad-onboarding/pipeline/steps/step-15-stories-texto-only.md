---
id: step-15-stories-texto-only
agent: sofia-stories
execution: inline
inputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/client-briefing.md
outputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/stories-texto/
format: png
context_files:
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-sales-page.html
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-marketing-plan.html
---

# Step 15 — 10 Stories Texto-Only (formato anúncio-texto adaptado pra story)

## Contexto

Pós-rework v3, o step de stories foi separado em duas categorias:
- **Stories texto-only** (este step 15) — sem imagem de fundo, copy estilo anúncio texto, viewport 1080×1920
- **Caixinhas de perguntas** (step 16) — formato sticker IG simulado, com pergunta + resposta viral

Este step usa o formato **anúncio-texto** (só tipografia, sem foto, copy em camadas) adaptado do feed (1080×1350) para story (1080×1920). Toda a especificação necessária está neste step — não depende de skill externa.

## Output: 10 PNGs de stories texto-only

Cada story representa **uma dor diferente do avatar**, em formato **5 camadas de copy** do anúncio-texto:

| Camada | Função | Tamanho |
|---|---|---|
| `headline` | Gancho em 2 linhas (linha 1 branca + linha 2 cor de destaque) | ~6-10 palavras/linha |
| `sub` | Elaboração da dor — o que a pessoa já tentou, o que persiste | 1-2 linhas |
| `edu` | Mecanismo de ação — como a solução funciona | 1 frase |
| `nuance` | Caveat ou aprofundamento — o que poucos sabem | 1 frase itálica |
| `cta` | Chamada com contato — 2 linhas (convite + benefício final) | 2 linhas |

**Adicional**: cada story tem um `deco` (emoji 5% opacidade no canto inferior, ~560px) refletindo o tema emocional.

## Diferenças vs. anúncio-texto de feed (formato-base)

| Spec | Anúncio-texto feed (base) | Adaptado squad onboarding (step 15) |
|---|---|---|
| Viewport | 1080×1350 (feed 4:5) | **1080×1920 (story 9:16)** |
| Logo | Pill no header | Marca "[ícone da marca] [Cliente]" no canto superior esquerdo |
| Tag | Header com emoji + categoria | Tag flutuante no canto superior direito (pill na cor de destaque do cliente) |
| Handle | Branco 30%, no rodapé | Cor de destaque 50%, canto inferior direito |
| Padding | 60px lateral × 72px vertical | **160px topo × 84px lateral × 200px rodapé** (mais ar pra texto vertical) |
| Headline | 70px, 900 | **96px, 900** (texto domina vertical) |
| Sub | 30px | **38px** |

## Distribuição padrão de 10 stories (template)

10 dores que aparecem no avatar. Padrão para clientes do nicho clínico/transformação emocional:

1. Validação externa (consulta 5 pessoas antes de decidir)
2. Voz amaciada ("talvez seja só impressão minha…")
3. Síndrome impostora (elogio incomoda mais que crítica)
4. Pedir desculpa por existir
5. Transição adiada (decisão importante há anos)
6. Cansaço crônico (acorda já cansada)
7. Medo do julgamento ("e se acharem que…")
8. Relação tóxica (sabe que precisa sair, não sai)
9. Não cobrar valor (cobra menos do que vale)
10. Crise de identidade (fez tudo certo e não se reconhece)

Para outros nichos (negócios, marketing, finanças), adaptar as 10 dores ao avatar específico do briefing.

## Renderização

Script padrão `build-stories.mjs` (Playwright Node, chromium):
- Viewport 1080×1920
- Wait 2000ms (Google Fonts Montserrat + Inter)
- Screenshot clip exato 1080×1920
- Output: `<FERABOT>/output/onboarding/{client-slug}-{data}/v3/stories-texto/{slug}.html` + `.png`

## Veto Conditions

- NUNCA usar imagem de fundo (foto)
- NUNCA usar headline de 1 linha só — sempre 2 linhas (com 2ª em cor de destaque)
- NUNCA omitir a camada `nuance` (é o que diferencia de copy comum)
- NUNCA fonte menor que 30px (story tem que ser legível em mobile sem zoom)
- SEMPRE 10 dores diferentes — nunca 2 stories sobre a mesma dor
