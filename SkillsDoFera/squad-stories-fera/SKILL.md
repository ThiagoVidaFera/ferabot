---
name: squad-stories-fera
description: Gera stories de bastidores para Instagram. Usa foto real fornecida pelo mentor como fundo, com safe zones corretas para anúncio. Copy em 5 camadas: headline, subheadline, contexto em bullets, ponte e CTA.
---

# Squad Stories Fera

Stories de bastidores com a sua foto real, fera. Esse é o formato que mais gera DMs.

## Pré-requisito

Ler `perfil.json` antes de qualquer coisa.

## O que são stories de bastidores

Stories que mostram o mentor em ação: atendendo cliente, gravando aula, no computador, em reunião. A foto é real (tirada pelo mentor), o texto é posicionado nos espaços vazios da imagem respeitando as safe zones do Instagram.

## Fluxo obrigatório

```
[01] Briefing + Foto → [02] Copy (aprovação) → [03] Design → [04] Render → [05] Entrega
```

## [01] Briefing

Perguntar ao fera:
1. **Foto de fundo:** "Qual foto de bastidor quer usar? Pode ser uma do celular que você tirou hoje."
2. **Objetivo do story:** engajamento, captura de lead, ou divulgação de produto?
3. **Tom:** sério/autoridade ou descontraído/bastidores reais?

Se o fera não tiver foto, sugerir que tire uma nos próximos dias e usar uma cor sólida como placeholder agora.

## [02] Copy em 5 camadas

Gerar copy personalizada com base no `perfil.json`:

### Camada 1 — Headline (1 linha, impacto imediato)
- Específica ao nicho: mencionar o problema ou resultado concreto
- Máx 40 caracteres
- Nunca genérica

### Camada 2 — Subheadline (1-2 linhas de contexto)
- O que está acontecendo nesse bastidor
- Liga a foto ao universo do fera
- Máx 60 caracteres por linha

### Camada 3 — Contexto em bullets (2-3 pontos)
- O que o fera está fazendo / o resultado que está gerando
- Formato: ✓ [conquista ou dado concreto]
- Evitar genérico: usar nicho e produto específicos

### Camada 4 — Ponte (1 linha)
- Transição da situação pra oferta / lead magnet
- "Se você quer [resultado]..."

### Camada 5 — CTA (1 linha com keyword)
- Ação específica com keyword pra DM automation
- Formato: "[verbo] [keyword] no Direct"
- Keyword deve ser alinhada com /zernio-fera

**Apresentar ao fera para aprovação antes de continuar.**

## [03] Design do story

Após APROVADO:

### Especificações técnicas
- Dimensões: 1080×1920px
- Safe zone topo: 280px (UI do Instagram)
- Safe zone base: 260px (área de CTA do IG)
- Área útil: 280px → 1660px (1380px de altura)
- Foto de fundo: `object-fit: cover`, escurecida com overlay 50-60% `rgba(0,0,0,X)`
- Handle `{{handle_instagram}}` em pill colorida no topo (310px do topo)

### Posicionamento do texto
- Headline: topo da área útil (300px), branco, bold, 64-72px
- Subheadline: 380px, branco, 36px
- Bullets: 500-700px, branco, 34px
- Ponte: 780px, `cor_primaria`, italic, 34px
- CTA: base da área útil (~1580px), branco, bold, 44px, pill com `cor_primaria`

### Estrutura HTML
```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1080px; height: 1920px; overflow: hidden;
    position: relative; font-family: 'Inter', sans-serif;
  }
  .bg { position: absolute; inset: 0; background-size: cover;
        background-position: center; filter: brightness(0.5); }
  .content { position: absolute; inset: 0; padding: 0 64px; }
  /* ... */
</style>
</head>
<body>
  <div class="bg" style="background-image: url('data:image/jpeg;base64,...')"></div>
  <div class="content">
    <!-- camadas de copy -->
  </div>
</body>
</html>
```

**Sempre usar base64 para a foto de fundo. Nunca `file://`.**

Para converter foto em base64:
```python
import base64
with open("foto.jpg", "rb") as f:
    b64 = base64.b64encode(f.read()).decode()
```

### Salvar em
`output/stories/YYYY-MM-DD/story-01.html`

## [04] Renderização

```python
from playwright.sync_api import sync_playwright
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "ScriptsFera"))
from lib import ensure_output_dir

output = ensure_output_dir("stories")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1080, "height": 1920})
    page.goto(f"file:///{output}/story-01.html")
    page.screenshot(path=str(output / "story-01.png"), full_page=False)
    browser.close()
```

## [05] Entrega

1. "Fera, o story está pronto em `output/stories/YYYY-MM-DD/`"
2. Instrução: "Salva o PNG no celular e publica direto do app do Instagram."
3. Se tiver keyword de DM: "Lembra de ativar a automação no /zernio-fera antes de publicar."

## QA antes de entregar

- [ ] Texto não cobre o rosto nem parte importante da foto
- [ ] Safe zones respeitadas (nada acima de 280px ou abaixo de 1660px)
- [ ] Handle presente em pill no topo
- [ ] CTA com keyword definida
- [ ] Overlay escuro suficiente pra texto ser legível (testar mentalmente)
- [ ] Nenhuma palavra cortada

## Comunicação após entrega

> "Fera, story de bastidor prontíssimo! Salva o PNG no celular. Se já tiver a automação de DM ativa pra keyword [keyword], é só publicar. Quer criar mais stories ou partir pro carrossel?"
