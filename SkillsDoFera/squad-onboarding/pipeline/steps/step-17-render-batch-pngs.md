---
id: step-17-render-batch-pngs
agent: rita-render
execution: subagent
outputDir: <FERABOT>/output/onboarding/{client-slug}-{data}/
---

# Step 17 — Render Batch · Todos os PNGs do Squad

## Contexto

Rita Render é a agente que executa **renderização batch de todos os ativos visuais** do squad em PNG, a partir dos HTMLs gerados nos steps anteriores. Roda como subagente após aprovação dos criativos.

A renderização usa **Playwright Node** (Chromium). Se não estiver instalado: `npm i playwright` + `npx playwright install chromium`. Todos os caminhos `v3/...` abaixo são relativos à pasta do run: `<FERABOT>/output/onboarding/{client-slug}-{data}/`.

## Inventário de PNGs por cliente (~58 PNGs típicos)

| Origem (HTML) | Output (PNGs) | Resolução | Quantidade |
|---|---|---|---|
| `{slug}-story-XX.html` (step 06 antigo) ou `v3/stories-texto/*.html` (step 15) | `v3/stories-texto/*.png` | 1080×1920 | 10 |
| `v3/caixinhas/*.html` (step 16) | `v3/caixinhas/*.png` | 1080×1920 | 10 |
| `v3/carrosseis/{folder}/slide-NN-{tipo}.html` (step 07) | `v3/carrosseis/{folder}/*.png` | 1080×1080 | 24 (3×8) |
| `{slug}-thumb-XX.html` (step 08) | `v3/thumbnails/thumb-XX-*.png` | 1280×720 | 3 |
| `livro-{slug}.html` (step 12) | `v3/isca-livro-{slug}/capa-*.png` + `livro-completo-720w.png` | varia | 5-6 |
| 4 documentos textuais (sales/plano/proposta/mensagens) | `v3/documentos/*-screenshot.png` | full-page | 4-5 |

**Total: ~58 PNGs.**

## Scripts de render padrão (Node ESM)

O squad mantém 4 scripts canônicos em `v3/`, todos importáveis via `import { chromium } from 'playwright'`:

1. **`build-stories.mjs`** — renderiza 10 stories texto-only
2. **`build-carrosseis.mjs`** — renderiza 3 carrosséis × 8 slides = 24 PNGs
3. **`build-caixinhas.mjs`** — renderiza 10 caixinhas em 7 formatos visuais
4. **`build-thumbs-and-docs.mjs`** — renderiza 3 thumbs (clip 1280×720) + screenshots full-page dos 4-5 documentos
5. **`build-livro.mjs`** — renderiza capas + livro completo em diferentes formatos

Padrão de execução:
```js
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.goto('file:///' + htmlPath.replace(/\\/g, '/'));
await page.waitForTimeout(2000-3500); // varia conforme complexidade fonts
await page.screenshot({ path: pngPath, clip: { x:0, y:0, width:W, height:H } });
// OU para documentos longos:
await page.screenshot({ path: pngPath, fullPage: true });
```

## Tempos de espera por tipo

| Tipo | waitForTimeout |
|---|---|
| Stories simples | 2000ms |
| Carrosséis | 1500ms |
| Caixinhas (Google Fonts pesadas) | 2000ms |
| Thumbnails | 2000ms |
| Documentos longos | 3000ms |
| Livro inteiro | 3500-4500ms |

## Veto Conditions

- NUNCA renderizar antes da aprovação explícita das copies (steps 06, 07, 08, 15, 16 têm gates)
- NUNCA usar emoji que dependa de Apple Color Emoji ou Segoe UI Emoji em browser headless — Playwright Chromium não tem essas fontes, vai renderizar quadrado vazio. Solução: substituir por SVG inline OU aceitar como elemento minimalista
- NUNCA exceder 4500ms de wait — se a página não carregou nesse tempo, há problema de fonte/CSS
- SEMPRE conferir output (ler primeiro PNG de cada batch) antes de declarar concluído

## Output final esperado

```
v3/
  stories-texto/        ← 10 PNGs + 10 HTMLs
  carrosseis/
    carrossel-01-{tema}/   ← 8 PNGs + 8 HTMLs
    carrossel-02-{tema}/
    carrossel-03-{tema}/
  caixinhas/             ← 10 PNGs + 10 HTMLs
  thumbnails/            ← 3 PNGs
  documentos/            ← 4-5 PNGs (full-page screenshots)
  isca-livro-{slug}/     ← 5-6 PNGs (capas + livro completo)
```
