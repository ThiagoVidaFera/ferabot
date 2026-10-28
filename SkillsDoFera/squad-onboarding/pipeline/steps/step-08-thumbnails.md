---
id: step-08-thumbnails
agent: tania-thumb
execution: inline
inputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/client-briefing.md
outputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-thumbnails.html
format: html
context_files:
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-sales-page.html
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-marketing-plan.html
output_files:
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-thumb-01.html
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-thumb-02.html
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-thumb-03.html
---

# Step 08 — Criar 3 Thumbnails YouTube HTML

## Contexto

Tânia Thumb recebe o briefing e os materiais aprovados para criar 3 thumbnails YouTube HTML no formato 1280x720, com design impactante e identidade visual consistente.

As thumbnails são para vídeos YouTube que o mentor pode criar como conteúdo de topo de funil — cada thumbnail corresponde a um tema estratégico para atrair o público-alvo e direcioná-lo para a mentoria.

## Objetivo das 3 Thumbnails

Thumbnails que representam 3 tipos de vídeo YouTube de alta conversão para mentorias:
1. **Thumb 01**: Problema/provocação — "Por que [avatar] não consegue [resultado]"
2. **Thumb 02**: Método/resultado — "Como eu/meu aluno conseguiu [resultado específico]"
3. **Thumb 03**: Oportunidade — "A estratégia que [nicho de sucesso] usa e você não sabe"

## Dados de Referência

- `pipeline/data/research-brief.md` — elementos de thumbnail que convertem
- `pipeline/data/quality-criteria.md` — critérios de thumbnail
- `pipeline/data/output-examples.md` — exemplos de conceito de thumbnail
- `<FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-marketing-plan.html` — frases de efeito aprovadas

## Instruções para Tânia Thumb

### Especificações técnicas obrigatórias
- Dimensões exatas: `width: 1280px; height: 720px; overflow: hidden;`
- HTML autossuficiente, zero dependências externas
- Cada thumbnail em arquivo HTML separado
- Consistência de marca entre as 3 thumbnails (paleta, fonte, estilo geral)
- Texto: máximo 5 palavras, mínimo 80px, contraste máximo (fundo escuro/texto claro ou vice-versa)

### Elementos obrigatórios em cada thumbnail

**1. Zona do rosto/foto do mentor** (lado esquerdo ou direito, 40-50% da largura)
- Placeholder visual: retângulo arredondado com gradiente representando silhueta humana
- Cor: gradiente que remeta ao esquema de cores da marca
- Texto alternativo: `[FOTO DO MENTOR AQUI]` como overlay semi-transparente

**2. Zona de texto** (lado oposto ao rosto)
- Máximo 5 palavras em 2-3 linhas
- Fonte extrabold (weight 800-900)
- Cor contrastante com o fundo
- Tamanho: pelo menos 80px para a palavra principal, 60px para as demais

**3. Cor de fundo** (toda a thumbnail ou gradiente)
- Cor vibrante que se destaca no feed cinza do YouTube
- NÃO usar: branco puro, cinza, bege — cores que se perdem no YouTube
- Opções por perfil: vermelho para urgência/provocação, azul escuro para autoridade, preto+dourado para premium

**4. Elemento de destaque** (opcional mas recomendado)
- Seta, borda, moldura, tag ou shape geométrico que guia o olhar para o texto
- Cor de acento diferente do fundo principal

**5. Identidade de marca** (discreta)
- Handle ou logo no canto inferior (máximo 120px de largura)
- Não deve competir com o texto principal

### Thumbnail 01 — Provocação / Problema
**Tema**: Ângulo de provocação — questiona por que o avatar não chega ao resultado
**Conceito visual**: Fundo vermelho saturado / texto branco com 1 palavra em amarelo
**Texto sugerido**: "POR QUE VOCÊ NÃO COBRA MAIS" (máximo 5 palavras adaptadas ao nicho)
**Emoção**: Indignação controlada, urgência de descoberta

### Thumbnail 02 — Resultado / Método
**Tema**: Resultado concreto que o mentor entregou (próprio ou de aluno)
**Conceito visual**: Fundo escuro (preto ou azul) / texto dourado ou branco
**Texto sugerido**: "R$ [VALOR] EM [PRAZO]" ou "COMO EU FIZ [RESULTADO]"
**Emoção**: Aspiração, prova, curiosidade

### Thumbnail 03 — Estratégia / Oportunidade
**Tema**: Revela algo que o avatar não sabe mas deveria
**Conceito visual**: Fundo gradiente (azul escuro para preto) / texto branco com acento colorido
**Texto sugerido**: "O SEGREDO DO [RESULTADO NICHO]" ou "[NÚMERO] PASSOS PARA [RESULTADO]"
**Emoção**: Curiosidade, oportunidade, FOMO

### Arquivo de índice (outputFile principal)
O arquivo `{client-slug}-thumbnails.html` deve ser um índice visual que mostra as 3 thumbnails em sequência para aprovação rápida, com os títulos dos vídeos sugeridos abaixo de cada uma.

## Veto Conditions

- NUNCA criar thumbnail com mais de 5 palavras no texto principal
- NUNCA usar cores claras que se perdem no fundo do YouTube (branco, cinza claro, bege)
- NUNCA criar thumbnail sem zona clara para rosto/foto do mentor
- NUNCA criar 3 thumbnails com o mesmo esquema de cores
- NUNCA usar fonte em peso menor que 700 (bold é o mínimo)
- NUNCA criar texto menor que 60px (ilegível em mobile)
- NUNCA usar imagens externas — apenas CSS gradients, formas geométricas CSS e texto
