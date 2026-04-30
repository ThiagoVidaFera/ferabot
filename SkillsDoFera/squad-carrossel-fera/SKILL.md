---
name: squad-carrossel-fera
description: Gera carrosseis de feed para Instagram personalizados com o nicho, produto e paleta do mentor. 10 slides por leva, copy aprovada antes de renderizar. Publicação manual pelo mentor via Meta app.
---

# Squad Carrossel Fera

Fera, vamos criar carrosseis pra bombar o seu feed!

## Pré-requisito

Ler `perfil.json` da pasta raiz do Ferabot antes de qualquer coisa.

## Fluxo obrigatório

```
[01] Briefing → [02] Copy (aprovação) → [03] Design → [04] Render → [05] Entrega
```

**NUNCA pular a aprovação de copy antes de renderizar.**

## [01] Briefing

Perguntar ao fera:
1. **Tema/assunto** do carrossel (ou "pode escolher" pra sugerir)
2. **Formato:** storytelling (história/caso real) ou educativo (dicas/lista)?
3. **CTA final:** capturar lead, vender produto, ou engajamento?

Se o fera disser "pode escolher", sugerir o tema mais alinhado ao nicho do `perfil.json`.

## [02] Geração de Copy

Gerar a estrutura completa dos slides com base no `perfil.json`:

### Slide 1 — Gancho (marco temporal ou manchete)
- Marco temporal: "Semana passada, [cliente do nicho] fez [ação específica] e [resultado concreto]"
- Manchete: atacar uma crença errada ou revelar uma contradição do nicho
- Nunca começar com "Você sabia que..." ou pergunta genérica

### Slides 2-8 — Desenvolvimento
- Máx 3 linhas por bloco de texto
- Diferenciação visual entre blocos (negrito / normal / destaque)
- Progressão lógica: problema → causa → solução → evidência → resultado

### Slide 9 — Virada / Momento fera
- Transformação concreta que o produto/mentoria entrega
- Específico ao nicho: nunca genérico

### Slide 10 — CTA
- Frase conversacional com keyword de identificação
- Formato: "[verbo imperativo] [ação concreta] [benefício imediato]"
- Se capturar lead: incluir keyword pra DM automation (ver /zernio-fera)

### Apresentar ao fera para aprovação antes de continuar.

## [03] Design do carrossel

Após APROVADO explícito, gerar HTML para cada slide.

### Especificações técnicas
- Dimensões: 1080×1350px
- Paleta: usar `cor_primaria` e `cor_secundaria` do perfil
- Fonte headline: bold, 80-100px
- Fonte corpo: 34-40px
- Padding lateral: 64px mínimo
- Background: dark premium ou branco — alternar entre slides
- Handle `{{handle_instagram}}` sempre presente (rodapé ou pill no topo)
- Número do slide (1/10, 2/10...) no canto superior

### Estrutura do HTML (cada slide)
```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1080px; height: 1350px; overflow: hidden;
         font-family: 'Inter', sans-serif; }
  /* estilos do slide */
</style>
</head>
<body>
  <!-- conteúdo do slide -->
</body>
</html>
```

### Salvar em
`output/carrossel/YYYY-MM-DD/slide-01.html` ... `slide-10.html`

## [04] Renderização

Usar Playwright para converter HTML → PNG:

```python
from playwright.sync_api import sync_playwright
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "ScriptsFera"))
from lib import load_perfil, ensure_output_dir

perfil = load_perfil()
output = ensure_output_dir("carrossel")

with sync_playwright() as p:
    browser = p.chromium.launch()
    for i in range(1, 11):
        page = browser.new_page(viewport={"width": 1080, "height": 1350})
        html_path = output / f"slide-{i:02d}.html"
        page.goto(f"file:///{html_path}")
        page.screenshot(path=str(output / f"slide-{i:02d}.png"), full_page=False)
    browser.close()
```

**Imagens externas:** sempre base64 inline. Nunca `file://` em `src`.

## [05] Entrega

Após renderizar:
1. Confirmar: "Fera, seus 10 slides estão prontos em `output/carrossel/YYYY-MM-DD/`"
2. Abrir a pasta automaticamente se possível
3. Instrução de publicação:
   > "Para publicar: abra o Meta Business Suite ou o app do Instagram. Crie um novo post, selecione os 10 PNGs na ordem (slide-01 → slide-10) e publique como carrossel. A legenda vai abaixo."
4. Gerar legenda pra copiar e colar (3-5 linhas + emojis + hashtags do nicho)

## Regras de qualidade (QA antes de entregar)

- [ ] Nenhuma palavra cortada na borda
- [ ] Handle `{{handle_instagram}}` presente em todos os slides
- [ ] Safe zone respeitada (nenhum conteúdo nos 60px das bordas)
- [ ] Slide 1 tem gancho específico (não genérico)
- [ ] Slide 10 tem CTA com ação clara
- [ ] Paleta `cor_primaria` e `cor_secundaria` usadas
- [ ] Fontes legíveis em mobile (corpo mínimo 34px)

## Exemplo de comunicação

Após entregar:
> "Fera, carrossel pronto! 10 slides na pasta. Copia os arquivos pro celular e sobe pelo app. Quer que eu gere os stories de divulgação desse carrossel também?"
