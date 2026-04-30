---
name: squad-slides-fera
description: Gera apresentações de slides para o mentor. Slides HTML premium com animações CSS. Usos: pitch de venda ao vivo, aula/conteúdo, webinar, apresentação de proposta. Exporta PNG por slide ou vídeo animado via FFmpeg.
---

# Squad Slides Fera

Fera, vamos montar a apresentação que vai vender sua mentoria!

## Pré-requisito

Ler `perfil.json` antes de qualquer coisa.

## O que o Squad Slides faz

Gera apresentações em HTML com:
- Design dark premium com paleta da marca
- Animações CSS profissionais (entrada de elementos, transições)
- Exportação como PNG por slide (para Meta Ads, PDF, etc)
- Exportação como vídeo animado via FFmpeg (para Reels, Stories Ads)

## Fluxo obrigatório

```
[01] Briefing → [02] Estrutura (aprovação) → [03] Copy (aprovação) → [04] Design → [05] Export → [06] Entrega
```

## [01] Briefing

Perguntar ao fera:
1. **Tipo de apresentação:**
   - Pitch de venda ao vivo (reunião/call com prospect)
   - Aula/conteúdo (webinar, módulo de curso)
   - Apresentação de proposta (follow-up após call)
   - Reels educativo (1-2 min, para redes sociais)
2. **Tema:** o que vai ser apresentado
3. **Formato de saída:** PNG por slide / vídeo animado / ambos?
4. **Duração** (se vídeo): quantos segundos por slide?

## [02] Estrutura da Apresentação

Sugerir estrutura conforme o tipo:

### Pitch de Venda (15-20 slides)
1. Capa — produto + quem é o mentor
2. O problema — situação atual do avatar
3. Por que ainda não resolveu — crenças limitantes
4. A solução — mecanismo único
5-8. Prova social — 4 resultados/depoimentos
9-12. O que está incluído — módulos/entregas
13. Bônus
14. Investimento + condições
15. Garantia
16. CTA — próximo passo

### Aula/Webinar (20-30 slides)
1. Capa
2-3. Contextualização
4-25. Conteúdo principal (blocos temáticos)
26-28. Recapitulação
29-30. CTA

### Proposta (8-10 slides)
1. Capa personalizada (nome do prospect)
2. Desafio identificado
3. Solução proposta
4-5. Metodologia
6. O que está incluído
7. Investimento
8. Próximos passos

**Apresentar estrutura ao fera para aprovação.**

## [03] Copy de cada slide

Após estrutura APROVADA, gerar copy de cada slide:
- Título: 1 linha, impacto máximo
- Corpo: máx 3 pontos ou 2-3 linhas
- Evitar paredes de texto — slides são pra apresentar, não ler

**Apresentar copy completa ao fera para aprovação antes de criar HTML.**

## [04] Design HTML

Após copy APROVADA:

### Especificações
- Dimensões: 1920×1080px (widescreen)
- Background: `#0A0A0F` (dark)
- Accent: `{{cor_primaria}}` e `{{cor_secundaria}}`
- Fonte display: bold, 64-80px para títulos
- Fonte corpo: 28-36px
- Padding: 80px horizontal, 60px vertical

### Animações CSS
```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate { animation: fadeUp 0.6s ease forwards; }
.delay-1 { animation-delay: 0.2s; }
.delay-2 { animation-delay: 0.4s; }
```

### Salvar em
`output/slides/YYYY-MM-DD/slide-01.html` ... `slide-NN.html`

## [05] Exportação

### PNG por slide
```python
from playwright.sync_api import sync_playwright
from lib import ensure_output_dir

output = ensure_output_dir("slides")
with sync_playwright() as p:
    browser = p.chromium.launch()
    for i, html in enumerate(sorted((output).glob("slide-*.html"))):
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        page.goto(f"file:///{html}")
        page.wait_for_timeout(800)  # aguarda animações ficarem visíveis
        page.screenshot(path=str(output / f"slide-{i+1:02d}.png"))
    browser.close()
```

### Vídeo animado (FFmpeg)
Após gerar PNGs:
```bash
ffmpeg -framerate 0.5 -pattern_type glob -i "output/slides/YYYY-MM-DD/slide-*.png" \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 -pix_fmt yuv420p output/slides/YYYY-MM-DD/apresentacao.mp4
```

## [06] Entrega

1. "Fera, [N] slides prontos em `output/slides/YYYY-MM-DD/`"
2. Se PNG: "Você pode importar os PNGs no Canva, PowerPoint ou Google Slides pra apresentar ao vivo."
3. Se vídeo: "O MP4 está pronto pra usar como Reels ou Stories Ad."

## QA antes de entregar

- [ ] Títulos nunca cortados
- [ ] Corpo com máx 3 pontos por slide
- [ ] Paleta da marca usada consistentemente
- [ ] Handle do fera presente na capa e no slide de CTA
- [ ] CTA final com link correto do `landing_page`

## Comunicação após entrega

> "Fera, apresentação pronta! [N] slides, design premium com as cores da sua marca. Se quiser transformar em Reels, peça o vídeo animado. Quer mais alguma coisa?"
