---
id: step-18-drive-materiais-3-subpastas
agent: danilo-drive
execution: subagent
outputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-drive-report.md
---

# Step 18 — Upload Drive · 3 Subpastas com Materiais (PNGs + PDFs)

## Contexto

**v4:** o Danilo Drive sobe **PNGs (criativos)** + **PDFs (documentos longos)** — não mais screenshots PNG dos documentos.

**Este step é opcional.** O FERABOT não traz credencial do Google Drive. Sem credencial configurada, o Danilo monta a mesma estrutura de 3 subpastas **localmente** em `<FERABOT>/output/onboarding/{client-slug}-{data}/drive/` e o fallback é manual: abrir drive.google.com, arrastar a pasta principal pra dentro do Drive, clicar em Compartilhar → "Qualquer pessoa com o link — Leitor" e colar o link no relatório (e na mensagem de entrega do step-20).

Razão da mudança: cliente lê PDF muito melhor que screenshot. Documento longo (livro, proposta, sequência WhatsApp, roteiro YouTube) merece vir formatado como PDF, não fatiado em capturas de tela. PNG fica reservado pra criativos visuais reais (stories, caixinhas, slides de carrossel, thumbs).

## Estrutura fixa no Drive (v4)

```
{Cliente Nome} — {Mês} {Ano} (Materiais)/
  Carrossel/
    Carrossel 01 — {tema}/   ← 8 PNGs
    Carrossel 02 — {tema}/   ← 8 PNGs
    Carrossel 03 — {tema}/   ← 8 PNGs
  Thumbnail/
    thumb-01-{angulo}.png
    thumb-02-{angulo}.png
    thumb-03-{angulo}.png
  Outros materiais/
    Stories/                  ← 10 PNGs
    Caixinhas de perguntas/   ← 10 PNGs
    Documentos PDF/
      {Cliente} — Livro-Funil {Título}.pdf
      {Cliente} — Proposta Comercial.pdf
      {Cliente} — Sequência WhatsApp.pdf
      {Título atraente do vídeo YouTube}.pdf  ← roteiro do agente Renata
```

**Total típico v4:** 47 PNGs + 4 PDFs.

## O que MUDOU vs v3

| Item | v3 (deprecated) | v4 (atual) |
|---|---|---|
| Documentos longos | screenshots PNG (4-5) | **PDFs** (4) |
| Capas do livro como PNG separado | sim (5-6 PNGs) | **não** — capa fica embedded no PDF do livro |
| Roteiro YouTube no Drive | não existia | **PDF com nome de título atraente do vídeo** |
| Total | ~58 PNGs | 47 PNGs + 4 PDFs |
| Pasta-mãe nome | "(PNGs)" | **"(Materiais)"** |

## Nome da pasta principal

`{Cliente Nome Completo} — {Mês em PT} {Ano} (Materiais)`

Exemplo: `[Nome do Cliente] — Maio 2026 (Materiais)`

## Pasta-mãe (opcional)

`{{drive_pasta_mae}}` — [A PREENCHER: ID ou link da pasta do seu Drive onde ficam os clientes, se usar upload automático]. Todos os clientes do squad onboarding criam pasta dentro desse parent. Sem pasta-mãe definida, o upload é manual (ver Contexto).

## Conversão HTML → PDF

Antes do upload, converter os 4 HTMLs em PDF via Playwright `page.pdf()`:

```js
// Padrão (rodar localmente no run dir antes do upload)
const pdfs = [
  { html: '{client-slug}-livro-{slug-livro}.html', pdf: '{Cliente} — Livro-Funil {Título}.pdf' },
  { html: '{client-slug}-proposta-comercial.html', pdf: '{Cliente} — Proposta Comercial.pdf' },
  { html: '{client-slug}-mensagens-whatsapp.html', pdf: '{Cliente} — Sequência WhatsApp.pdf' },
  { html: '{client-slug}-roteiro-youtube.html', pdf: '{Título atraente do vídeo}.pdf' },
];

for (const { html, pdf } of pdfs) {
  await page.goto('file://' + path.resolve(html));
  await page.emulateMedia({ media: 'print' });
  await page.pdf({
    path: pdf,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
}
```

PDFs ficam salvos em `pdfs/` no run dir antes do upload.

## Ferramenta: googleapis Node + stream

Se houver credencial do Drive configurada pelo próprio usuário: usar um script `drive-upload.mjs` (googleapis + stream) no run dir. Sem credencial: fallback manual (ver Contexto).

**NUNCA** usar `mcp__claude_ai_Google_Drive__create_file` com base64Content para upload em batch — cada PNG/PDF vira context burn.

## Credencial (opcional)

- O FERABOT não inclui OAuth do Google Drive. Upload automático só se o usuário tiver configurado a própria credencial — nunca salvar token dentro da pasta da skill nem no repositório.
- Sem credencial → upload manual (arrastar a pasta pro drive.google.com, compartilhar "qualquer pessoa com o link — leitor", colar o link).

## Estratégia de versionamento

Quando o cliente pede rework grande:
- **NÃO deletar** a pasta antiga no Drive
- Criar pasta NOVA ao lado: `{Cliente} — {Mês} {Ano} (Materiais)` ou similar
- Cliente decide depois qual descartar

## Output do step: relatório de upload

`{client-slug}-drive-report.md` com:
- Status (sucesso/parcial/falha)
- Link da pasta principal
- Tabela de arquivos uploadeados por subpasta
- Totais separados (PNGs vs PDFs)

## Veto Conditions

- NUNCA subir HTMLs ou MDs no Drive — só PNGs (criativos) + PDFs (documentos)
- NUNCA gerar screenshot PNG de documento longo (livro/proposta/WhatsApp/roteiro) — sempre PDF
- NUNCA deletar pasta de cliente sem confirmação explícita
- NUNCA usar MCP create_file com base64 para batch upload
- NUNCA omitir alguma das 3 subpastas raiz, mesmo vazia — criar a pasta vazia ou avisar no relatório
- SEMPRE confirmar autenticação antes de prosseguir com upload automático — sem credencial, cair no fallback manual em vez de travar
- SEMPRE nomear o PDF do roteiro YouTube com o título atraente do vídeo (não com slug genérico tipo "roteiro.pdf")
