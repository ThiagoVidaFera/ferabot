---
id: step-05-plan-approval
type: checkpoint
execution: checkpoint
inputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-marketing-plan.html
title: "Aprovação do Plano de Marketing"
---

# Step 05 — Aprovação do Plano de Marketing

## Contexto

O plano de marketing digital HTML foi gerado por Marco Marketing. Este checkpoint garante que o documento esteja correto, personalizado e completo antes de avançar para a criação dos criativos (stories, carrosséis, thumbnails).

Os criativos que virão nos steps 06, 07 e 08 devem ser consistentes com o plano — por isso é importante aprovar o posicionamento, as frases de efeito e os pilares de conteúdo antes.

## Instruções para o Checkpoint

1. Apresente ao usuário o resumo do plano criado:
   - Nome do cliente e nicho
   - Posicionamento definido (proposta de valor única)
   - Arquétipo de marca escolhido
   - Bio selecionada (apresente as 3 opções)
   - 3 frases de efeito de destaque
   - Pilares de conteúdo definidos
   - Caminho do arquivo gerado

2. Perguntas do checkpoint:

**Pergunta 1 — Aprovação do posicionamento**
> "O posicionamento definido para [Nome do Cliente] foi:
>
> **Proposta de valor**: [proposta gerada]
> **Arquétipo**: [arquétipo]
> **Bio recomendada**: [bio opção 1]
>
> Isso está correto e alinhado com a visão do cliente?"

**Pergunta 2 — Aprovação geral do plano**
> "O plano de marketing completo foi gerado em `{client-slug}-marketing-plan.html`. Você revisou o documento?
>
> **Opções:**
> - `APROVADO` — Está completo, pode avançar para os criativos
> - `AJUSTAR: [o que mudar]` — Marco Marketing refaz com as instruções
> - `CANCELAR` — Encerrar o pipeline"

## Comportamento Esperado

- Se `APROVADO`: avançar para step-06 (stories)
- Se `AJUSTAR`: retornar para Marco Marketing com as instruções de ajuste, regerar o plano, apresentar novamente
- Se `CANCELAR`: encerrar pipeline e registrar motivo

## Informação Passada para os Steps Seguintes

Após aprovação, registrar para uso dos agentes de criativo:
- Posicionamento aprovado (proposta de valor)
- Frases de efeito aprovadas (para usar em stories/thumbnails)
- Paleta de cores de marca sugerida no plano
- Pilares de conteúdo (para definir temas dos carrosséis)

## Veto Conditions

- NÃO avançar sem aprovação explícita
- NÃO avançar se o posicionamento definido estiver vago ou genérico
- NÃO avançar se faltar alguma das seções obrigatórias (1 a 13)
