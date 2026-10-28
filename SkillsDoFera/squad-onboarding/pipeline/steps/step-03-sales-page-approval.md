---
id: step-03-sales-page-approval
type: checkpoint
execution: checkpoint
inputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-sales-page.html
title: "Aprovação da Página de Vendas"
---

# Step 03 — Aprovação da Página de Vendas

## Contexto

A página de vendas HTML foi gerada por Paula Página no step anterior. Agora precisamos da aprovação do operador (você, ou quem estiver rodando o onboarding) antes de avançar para o plano de marketing.

Este checkpoint garante que ajustes na copy, no tom, nos dados ou no design sejam feitos antes de criar os outros materiais — que devem ser consistentes com a página de vendas aprovada.

## Instruções para o Checkpoint

1. Apresente ao usuário o resumo do que foi criado:
   - Nome do cliente
   - Headline principal
   - Estrutura de seções incluídas
   - Preço e oferta apresentados
   - Tom utilizado
   - Caminho do arquivo gerado

2. Faça as seguintes perguntas:

**Pergunta 1 — Aprovação geral**
> "A página de vendas foi gerada para [Nome do Cliente]. Você revisou o arquivo `{client-slug}-sales-page.html`?
>
> **Opções:**
> - `APROVADO` — Está ótimo, pode avançar
> - `AJUSTAR: [descreva o que mudar]` — Paula Página refaz com as instruções
> - `CANCELAR` — Encerrar o pipeline"

**Pergunta 2 — Se AJUSTAR foi escolhido**
> "Descreva com precisão o que precisa ser ajustado na página:
> - Headline? (proponha uma alternativa ou diga o que está errado)
> - Copy de alguma seção específica?
> - Informação incorreta ou faltando?
> - Tom ou estilo?
> - Design ou estrutura?"

## Comportamento Esperado

- Se `APROVADO`: avançar para step-04 (plano de marketing)
- Se `AJUSTAR`: retornar para Paula Página com as instruções de ajuste, regerar a página, apresentar novamente para aprovação
- Se `CANCELAR`: encerrar pipeline e registrar motivo no log

## Veto Conditions

- NÃO avançar sem aprovação explícita (`APROVADO` ou equivalente)
- NÃO avançar se o arquivo HTML não foi gerado com sucesso no step anterior
- NÃO avançar se houver inconsistências graves (nome errado, preço errado, nicho errado)
