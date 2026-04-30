---
name: squad-caixinha-fera
description: Gera stories de caixinha de perguntas personalizados para o mentor. Background dark com padrão SVG da marca, sticker simulado do Instagram, 4 estilos de bloco de resposta. Sem CTA no conteúdo.
---

# Squad Caixinha Fera

Fera, caixinha de perguntas é o formato que mais gera conversa e autoridade. Bora criar!

## Pré-requisito

Ler `perfil.json` antes de qualquer coisa.

## O que o Squad Caixinha entrega

Stories 1080×1920px simulando a caixinha de perguntas nativa do Instagram. Cada arte tem:
- Pergunta real do seguidor (ou simulada)
- Resposta do mentor em 2-4 blocos de texto diferenciados
- Handle e identidade visual da marca
- Safe zones respeitadas

## Fluxo obrigatório

```
[01] Briefing → [02] Perguntas + Respostas (aprovação) → [03] Design → [04] Render → [05] Entrega
```

## [01] Briefing

Perguntar ao fera:
1. **Quantas caixinhas?** (sugestão: 5-10 por leva)
2. **Perguntas:** o fera tem perguntas reais pra responder, ou quer que eu sugira as mais comuns do nicho?
3. **Tom das respostas:** didático/educativo, direto/prático, ou provocativo?

Se o fera quiser sugestões, gerar 10 perguntas frequentes do nicho baseadas no `perfil.json`.

## [02] Copy (perguntas + respostas)

Gerar todas as perguntas e respostas antes de criar qualquer arte.

### Estrutura de cada caixinha
- **Pergunta:** máx 80 caracteres, como um seguidor real escreveria
- **Resposta em 2-4 blocos diferenciados** (ver estilos abaixo)
- Máx 3 linhas por bloco
- Específico ao nicho — nunca genérico

### Exemplo
```
Pergunta: "Como você cobra sua mentoria sem medo?"

Bloco .ba (afirmação crua):
"Você não cobra pelo tempo. Cobra pela transformação."

Bloco .bb (explicação):
"Quem pergunta 'quanto você cobra?' ainda não entendeu o valor.
O seu trabalho é mostrar o valor ANTES de falar o preço."

Bloco .bc (argumento central):
"Mentor que cobra caro não justifica — ele demonstra resultado."

Bloco .bd (frase printable):
"Preço alto filtra quem não vai se comprometer."
```

**Apresentar ao fera para aprovação antes de criar as artes.**

## [03] Design do story

Após copy APROVADA:

### Especificações técnicas
- Dimensões: 1080×1920px
- Background: `#0A0A0F` (dark) com padrão SVG sutil
- Safe zone topo: 280px | Safe zone base: 260px

### Estrutura visual
```
[safe zone 0-280px]

[handle pill 310px]  →  "@{{handle_instagram}}"  (pill cor_primaria)
[divider 350px]      →  linha fina cor_primaria

[sticker simulado 470-680px]
  header: #1C1C1E + "Pergunte ao [nome]" pill
  corpo: fundo branco, pergunta dark bold 48-54px

[blocos resposta 700-1620px]
  .ba → fundo branco, texto dark, bold
  .bb → sem fundo, texto branco flutuante
  .bc → fundo cor_primaria, texto dark bold
  .bd → borda cor_primaria 2px, italic cor_primaria

[safe zone 1660-1920px]
```

### 4 estilos de bloco (nunca 2 consecutivos iguais)
```css
.ba { background: #FFFFFF; color: #0A0A0F; font-weight: 700; }
.bb { background: transparent; color: #FFFFFF; }
.bc { background: {{cor_primaria}}; color: #0A0A0F; font-weight: 700; }
.bd { background: transparent; border: 2px solid {{cor_primaria}};
      color: {{cor_primaria}}; font-style: italic; }
```

### Padrão SVG no fundo (losangos subtis)
```html
<svg style="position:absolute;inset:0;opacity:0.06" width="1080" height="1920">
  <defs>
    <pattern id="d" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
      <polygon points="30,5 55,30 30,55 5,30" fill="{{cor_primaria}}"/>
    </pattern>
  </defs>
  <rect width="1080" height="1920" fill="url(#d)"/>
</svg>
```

### Salvar em
`output/caixinha/YYYY-MM-DD/caixinha-01.html` ... `caixinha-NN.html`

## [04] Renderização

```python
from playwright.sync_api import sync_playwright
from lib import ensure_output_dir

output = ensure_output_dir("caixinha")
htmls = sorted(output.glob("caixinha-*.html"))

with sync_playwright() as p:
    browser = p.chromium.launch()
    for html in htmls:
        page = browser.new_page(viewport={"width": 1080, "height": 1920})
        page.goto(f"file:///{html}")
        png = html.with_suffix(".png")
        page.screenshot(path=str(png), full_page=False)
    browser.close()
print(f"[OK] {len(htmls)} caixinhas renderizadas")
```

## [05] Entrega

1. "Fera, [N] caixinhas prontas em `output/caixinha/YYYY-MM-DD/`"
2. Instrução: "Salva os PNGs no celular e publica como stories sequenciais."
3. "Quer agendar pelo OnlySocial ou prefere publicar manualmente?"

## Regras inegociáveis

- **Sem CTA** em nenhuma caixinha da leva — só pergunta + resposta
- Handle em pill colorida no topo (nunca no rodapé)
- Palavras nunca cortadas (QA bloqueante)
- Safe zones respeitadas (280px topo, 260px base)
- Cada bloco: máx 3 linhas
- 2 blocos consecutivos nunca do mesmo estilo

## QA antes de entregar

- [ ] Nenhuma palavra cortada
- [ ] Handle `{{handle_instagram}}` em todos os stories
- [ ] 0 CTAs (sem "comente X", sem links, sem "acesse")
- [ ] Blocos com estilos alternados
- [ ] Safe zones respeitadas

## Comunicação após entrega

> "Fera, [N] caixinhas prontas! Esse formato engaja muito — seguidores adoram ver o mentor respondendo perguntas reais. Quer criar mais ou partir pra outro formato?"
