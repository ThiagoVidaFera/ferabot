---
id: step-09-creatives-approval
type: checkpoint
execution: checkpoint
title: "Aprovação de Todos os Criativos"
context_files:
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-stories.html
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-carousels.html
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-thumbnails.html
---

# Step 09 — Aprovação de Todos os Criativos

## Contexto

Todos os criativos foram gerados: 10 stories, 3 carrosséis e 3 thumbnails. Este é o último checkpoint antes da publicação no Netlify e do upload no Google Drive — portanto é o momento de revisar tudo e solicitar ajustes finais.

Após esta aprovação, o step-10 (Netlify) e o step-11 (Drive) rodam automaticamente como subagentes.

## Instruções para o Checkpoint

Apresente um resumo completo de tudo que foi criado até agora:

### Resumo do que foi produzido para [Nome do Cliente]
- Página de vendas: `{client-slug}-sales-page.html` ✅ (aprovada no step-03)
- Plano de marketing: `{client-slug}-marketing-plan.html` ✅ (aprovado no step-05)
- 10 Stories Instagram: `{client-slug}-story-01.html` até `{client-slug}-story-10.html`
- 3 Carrosséis Instagram: `{client-slug}-carousel-01.html` até `{client-slug}-carousel-03.html`
- 3 Thumbnails YouTube: `{client-slug}-thumb-01.html` até `{client-slug}-thumb-03.html`

**Total de arquivos a publicar**: 18 HTML + índices

### Perguntas do checkpoint

**Pergunta 1 — Revisão dos stories**
> "Os 10 stories foram criados. Você revisou o arquivo índice `{client-slug}-stories.html`?
>
> - `APROVADO` — Todos os stories estão OK
> - `AJUSTAR STORY [número]: [o que mudar]` — Sofia Stories refaz o story específico"

**Pergunta 2 — Revisão dos carrosséis**
> "Os 3 carrosséis foram criados. Você revisou o arquivo `{client-slug}-carousels.html`?
>
> - `APROVADO` — Todos os carrosséis estão OK
> - `AJUSTAR CARROSSEL [1/2/3]: [o que mudar]` — Carlos Carrossel refaz o carrossel específico"

**Pergunta 3 — Revisão das thumbnails**
> "As 3 thumbnails YouTube foram criadas. Você revisou o arquivo `{client-slug}-thumbnails.html`?
>
> - `APROVADO` — Todas as thumbnails estão OK
> - `AJUSTAR THUMB [1/2/3]: [o que mudar]` — Tânia Thumb refaz a thumbnail específica"

**Pergunta 4 — Autorização para publicação**
> "Todos os criativos foram revisados. Posso prosseguir com:
> 1. Publicação no Netlify (página de vendas + plano de marketing)
> 2. Upload de todos os arquivos no Google Drive (pasta do cliente)
>
> - `SIM, PUBLICAR TUDO` — Autoriza steps 10 e 11
> - `APENAS NETLIFY` — Apenas step 10
> - `APENAS DRIVE` — Apenas step 11
> - `NÃO PUBLICAR` — Encerrar sem publicação (arquivos ficam locais)"

## Comportamento Esperado

- Se `SIM, PUBLICAR TUDO`: executar step-10 e step-11 em paralelo (subagentes)
- Se `APENAS NETLIFY`: executar apenas step-10
- Se `APENAS DRIVE`: executar apenas step-11
- Se `NÃO PUBLICAR`: encerrar pipeline, gerar relatório final de arquivos locais
- Se houver ajustes solicitados: regenerar os criativos específicos e retornar ao checkpoint

## Veto Conditions

- NÃO publicar sem autorização explícita ("SIM, PUBLICAR TUDO" ou equivalente)
- NÃO pular ajustes solicitados antes de publicar
- Verificar ANTES de confirmar: `NETLIFY_AUTH_TOKEN` no `.env` da raiz do FERABOT. Sem o token, avisar e oferecer o fallback manual (arrastar a pasta em app.netlify.com/drop)
- Drive é opcional: sem credencial do Google Drive configurada, o step-11 vira upload manual (arrastar a pasta pro drive.google.com e colar o link)
