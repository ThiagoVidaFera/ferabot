# Geradores do Anúncio de Ouro — como usar as referências

Estes arquivos são um **design system que funciona** (paleta navy + esmeralda, tipografia Sora + Inter +
JetBrains Mono). Os geradores vêm com uma oferta **hipotética** só pra mostrar a estrutura: todo dado que só
o dono tem está como `[A PREENCHER]`, e o gerador avisa quantos faltam. Nada vai pro ar com `[A PREENCHER]`.

Os geradores leem `perfil.json` (subindo pastas a partir do lote) pra puxar nome, produto, @ e landing.

## Arquivos
| Arquivo | O que é |
|---|---|
| `feed.css` | Design system do **feed** 1080×1350. Layouts `ad--top` (foto topo + conteúdo) e `ad--hero` (foto full-bleed). Classes de accent `accent-emerald/blue/gold/red`. |
| `build_feed.example.py` | Gerador do feed: lista `ADS` de specs + 1 template → N HTML. |
| `render_feed.example.py` | Playwright → PNG (2×) + `jpg/*.jpg` (q92), com guarda de estouro. Screenshot do elemento `.ad`. |
| `story.css` | Design system do **story** 1080×1920. Elemento `.st`. |
| `build_stories.example.py` | Gerador dos stories (copy enxuta, glanceable). |
| `carrossel.css` | Design system do **carrossel** 1080×1350. Kinds de slide: `cover / text / photo / cta`. Elemento `.slide`. |
| `build_carrosseis.example.py` | Gerador dos carrosséis: dict `CARROSSEIS` (cada valor = lista de slides). |

O render dos stories/carrosséis segue o mesmo padrão do feed — copiar `render_feed.example.py` e trocar
viewport, glob e seletor: `.st` a 1080×1920 (`story-*.html`); `.slide` a 1080×1350 (`c*-s*.html`).

## Passo a passo (da raiz do FERABOT)
1. Criar a pasta do lote: `output/anuncios/ouro/AAAA-MM-DD-<tema>/` + `assets/`. Copiar as fotos reais
   pra `assets/` (nomes p1.jpg…pN.jpg).
2. Copiar os CSS e os `build_*.example.py` (feed: `styles.css` + `build_ads.py` + `render.py`; stories em
   `stories/`; carrosséis em `carrosseis/`).
3. **Editar as specs**: oferta, preço, garantia, dados-âncora, CTA — só dado real; e `objpos` por foto
   (rosto inteiro, com folga). Trocar a paleta no `:root` do CSS pelas cores da marca (`perfil.json`).
4. `python build_ads.py && python render.py` (idem stories e carrosséis).
5. QA: folha de contato do lote, ajustar, re-renderizar.
6. Entregar a pasta local (caminho absoluto). Subir no Drive/Gerenciador é manual e opcional.

## Estrutura de copy (obrigatória em toda peça)
`headline → subheadline → contexto/bullets → ponte → CTA` + checklist **A/B/C/D**
(anti-medo / anti-procrastinação / anti-preguiça / anti-problema-futuro).

## Ângulos de kit (banco pra variar — escolher N distintos)
oferta completa · ancoragem de preço (valor × retorno) · escassez explicada · autoridade/"feito por X" ·
garantia/risk-reversal · urgência/calendário · quebra de objeção · você-já-tem-metade (falta o mapa) ·
prova (só real) · convite direto (lista quente) · CTA puro/decisão agora.

## Paleta — como adaptar
Trocar as variáveis do `:root`. Manter contraste alto e 1 cor de accent semântica. Exemplos:
- Tech/institucional → navy `#0A1B3D` + esmeralda `#10B981` (o do molde).
- Saúde → verde/dourado ou branco clínico + azul frio.
- Finanças/investimentos → escuro sóbrio + verde floresta.
Fontes do molde: Sora (títulos) + Inter (corpo) + JetBrains Mono (labels). Trocar quando a marca pedir.
