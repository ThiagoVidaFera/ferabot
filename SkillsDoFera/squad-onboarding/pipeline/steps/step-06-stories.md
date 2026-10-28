---
id: step-06-stories
agent: sofia-stories
execution: inline
inputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/client-briefing.md
outputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-stories.html
format: html
context_files:
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-sales-page.html
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-marketing-plan.html
output_files:
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-story-01.html
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-story-02.html
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-story-03.html
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-story-04.html
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-story-05.html
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-story-06.html
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-story-07.html
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-story-08.html
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-story-09.html
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-story-10.html
---

# Step 06 — Criar 10 Stories Instagram HTML

## Contexto

Sofia Stories recebe o briefing do cliente, a página de vendas aprovada e o plano de marketing para criar 10 stories HTML que funcionem como funil de atração para a página de vendas.

Os stories devem ser visualmente distintos mas coerentes como série — todos representando a mesma marca, com paleta e identidade consistentes.

## Objetivo dos 10 Stories

Criar um conjunto de stories que cobrindo diferentes ângulos de persuasão:
- Identificação (leitor se vê no story)
- Autoridade (prova de que o mentor entrega resultado)
- Educação (valor antes da venda)
- Provocação (questiona crença limitante)
- Urgência (CTA para a página)

## Dados de Referência

- `pipeline/data/research-brief.md` — psicologia e tipos de stories
- `pipeline/data/quality-criteria.md` — critérios por story
- `<FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-sales-page.html` — headline e copy aprovados
- `pipeline/data/tone-of-voice.md` — tom do cliente

## Instruções para Sofia Stories

### Especificações técnicas obrigatórias
- Cada story em arquivo HTML separado (`{client-slug}-story-01.html` até `{client-slug}-story-10.html`)
- Viewport: simular 375x667px (proporção mobile) via CSS: `body { width: 375px; min-height: 667px; overflow: hidden; margin: 0; }`
- Fonte mínima: 24px (legível sem zoom)
- HTML autossuficiente (zero dependências externas)
- Identidade visual consistente nos 10 stories: mesma paleta de cores, mesma família de fonte

### Distribuição dos 10 stories

**Story 01 — Identificação com o Problema**
- Copy que descreve o dia a dia do avatar com precisão cirúrgica
- Pergunta retórica que provoca reflexão
- Sem CTA ainda (propósito: identificação)

**Story 02 — Prova Social (Resultado de Aluno)**
- Resultado específico de um aluno — só real; sem prova real, usar `[A PREENCHER: resultado real de aluno — nome, nicho, número]` ou trocar o story de formato (nunca inventar)
- Nome e nicho do aluno
- Número concreto: valor, prazo ou transformação
- Micro-CTA: "Deslize para saber como"

**Story 03 — Mini-Aula (Valor Gratuito)**
- 1 insight poderoso que entrega valor imediato
- Relacionado ao método do mentor
- Termina com cliffhanger para o próximo story

**Story 04 — Provocação / Mudança de Crença**
- Questiona uma crença limitante que o avatar tem
- Tom direto e sem medo de gerar desconforto produtivo
- Sem CTA — propósito é criar dissonância cognitiva

**Story 05 — Autoridade do Mentor**
- Números e credenciais do mentor
- Visual de "bastidores" ou conquista
- Construção de por que o mentor está qualificado

**Story 06 — Antes/Depois (Transformação)**
- Contraste claro: onde o aluno estava vs. onde chegou
- Específico e com contexto de tempo
- CTA: "Você pode ser o próximo"

**Story 07 — O Problema com a Solução Convencional**
- Por que as soluções que o avatar já tentou não funcionaram
- Posiciona o método do mentor como diferente
- Curiosidade para o próximo story

**Story 08 — Apresentação do Método/Programa**
- Nome do programa destacado
- Resultado principal prometido
- Chamada para a página de vendas

**Story 09 — Depoimento em Texto**
- Print ou citação de depoimento REAL de aluno (sem depoimento real → `[A PREENCHER: depoimento real — nome, profissão, cidade]`)
- Visual de "captura de tela" ou card elegante
- Resultado específico no destaque

**Story 10 — CTA Direto para a Página de Vendas**
- Urgência real (vagas, data, período)
- Link/instrução clara: "Link na bio" ou "Arraste para cima"
- Design mais impactante da série — o mais energy alto

### Paleta de Cores
Extrair do briefing ou do plano de marketing a paleta do cliente. Se não definida:
- Padrão para mentorias de negócios/high ticket: fundo preto ou azul escuro, acentos em dourado (#D4AF37) ou vermelho (#CC0000)
- Tipografia: bold/extrabold para títulos, regular para corpo
- No mínimo 1 cor de destaque por story para criar hierarquia visual

### Instrução de Entrega
Gerar cada story como arquivo HTML individual. O outputFile principal (`{client-slug}-stories.html`) deve ser um índice HTML que lista e linka todos os 10 stories com preview (iframe ou link).

## Veto Conditions

- NUNCA criar story com texto menor que 24px
- NUNCA criar stories sem identidade visual consistente entre eles
- NUNCA omitir algum dos 10 stories
- NUNCA criar CTA genérico ("siga o perfil") — sempre direcionar para a página de vendas
- NUNCA criar stories sem referência ao nicho específico do cliente
- NUNCA usar imagens externas — apenas CSS, SVG inline ou emoji para elementos visuais
