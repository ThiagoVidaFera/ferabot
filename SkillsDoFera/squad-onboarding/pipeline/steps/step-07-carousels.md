---
id: step-07-carousels
agent: carlos-carrossel
execution: inline
inputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/client-briefing.md
outputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-carousels.html
format: html
context_files:
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-sales-page.html
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-marketing-plan.html
output_files:
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-carousel-01.html
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-carousel-02.html
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-carousel-03.html
---

# Step 07 — Criar 3 Carrosséis Instagram HTML

## Contexto

Carlos Carrossel recebe o briefing, a página de vendas e o plano de marketing para criar 3 carrosséis Instagram HTML completos. Os carrosséis são estruturados para serem renderizados como imagens (via screenshot ou puppeteer) — portanto cada slide deve ser um bloco visual independente.

## Objetivo dos 3 Carrosséis

Cada carrossel cobre um ângulo diferente de conteúdo para Instagram:
1. **Carrossel 01**: Listicle de erros/problemas — gera identificação e virabilidade
2. **Carrossel 02**: Passo a passo do método — constrói autoridade e educa
3. **Carrossel 03**: Antes/depois ou transformação — prova social em formato visual

## Dados de Referência

- `pipeline/data/research-brief.md` — tipos e estrutura de carrosséis
- `pipeline/data/quality-criteria.md` — critérios por carrossel
- `<FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-marketing-plan.html` — pilares de conteúdo definidos
- `pipeline/data/tone-of-voice.md` — tom do cliente

## Instruções para Carlos Carrossel

### Especificações técnicas obrigatórias
- Cada carrossel em arquivo HTML separado
- Cada slide: `width: 1080px; height: 1080px; overflow: hidden;` (proporção 1:1)
- Slides apresentados em sequência vertical no arquivo (para facilitar screenshot)
- Separador visual entre slides (margem ou linha)
- HTML autossuficiente, zero dependências externas
- Identidade visual consistente entre slides do mesmo carrossel
- Identidade de marca consistente entre os 3 carrosséis

### Estrutura obrigatória de cada carrossel

#### Slide 1 (Capa) — Obrigatório em todos
- Título que promete e gera curiosidade
- Nome/logo da marca no canto (simples, sem dominar)
- Design impactante que "convida ao deslize"
- Seta ou texto "➡ deslize" no canto inferior

#### Slides intermediários (4-8 slides por carrossel)
- Número do item em destaque (grande, bold, cor de acento)
- Título do ponto (bold, máximo 6 palavras)
- Corpo curto: 2-3 linhas explicando o ponto
- Consistência de layout entre slides do carrossel

#### Penúltimo slide — Síntese
- Resumo ou o ponto mais impactante
- Citação ou frase de efeito
- Visual de destaque diferente dos slides anteriores

#### Último slide (CTA) — Obrigatório em todos
- Handle do Instagram (@handle do cliente)
- CTA claro: "Segue para mais" + "Link na bio para [resultado]"
- Foto do mentor (placeholder: avatar com iniciais)
- Logo/marca da mentoria

### Carrossel 01 — Listicle (erros, mitos ou verdades)
**Tema baseado no nicho**: "X erros que [avatar] comete que impedem [resultado]"
- Capa + 6-7 slides de erro + slide de síntese + slide de CTA = 9-10 slides total
- Tom provocador — cada erro deve gerar um "nossa, eu faço isso"
- Cada erro: nome do erro (bold) + por que é um erro + consequência
- Legenda sugerida incluída ao final do arquivo

### Carrossel 02 — Passo a Passo (método do mentor)
**Tema**: "Como [fazer resultado do mentor] em [número] passos"
- Capa + slides de cada passo + slide de síntese + slide de CTA
- Cada passo: número + nome do passo + o que fazer + resultado esperado desse passo
- Tom educativo — entrega valor real, não apenas teaser
- Número de passos: 4-6 (ideal para carrossel)

### Carrossel 03 — Transformação / Antes e Depois
**Tema**: Jornada de um aluno ou a jornada típica de quem passa pelo método
- Capa: "De [situação anterior] para [situação atual]"
- Slides alternados: slide "ANTES" (situação problema) + slide "DEPOIS" (transformação)
- Design visual com cores contrastantes: ANTES em tons frios/escuros, DEPOIS em tons quentes/dourados
- Final: depoimento real (sem depoimento real → `[A PREENCHER: depoimento real — nome, profissão, cidade]`) + CTA

### Legenda para cada carrossel
Incluir ao final de cada arquivo HTML (como comentário ou seção separada):
```html
<!-- LEGENDA SUGERIDA:
[copy da legenda com 3-5 parágrafos, emojis estratégicos, hashtags]
-->
```

## Veto Conditions

- NUNCA criar slides sem o número/marcador de posição clara
- NUNCA criar carrossel com menos de 7 slides (capa + conteúdo + CTA)
- NUNCA criar último slide sem CTA e handle do Instagram
- NUNCA criar 3 carrosséis com o mesmo ângulo/tema
- NUNCA usar fontes externas ou imagens de URLs externas
- NUNCA criar corpo de slide com mais de 4 linhas de texto

### ⚠️ Regra v3 — Estrutura obrigatória de 7 partes ("conteúdo repelente")

Os 3 carrosséis usam **OBRIGATORIAMENTE** a estrutura de 7 partes abaixo (o render pode ser feito com a skill `squad-carrossel-fera`, se estiver instalada — mas a estrutura de copy é esta):

1. **Abertura** — Marco temporal OU Manchete (perguntar antes!)
2. **Constatação** — acusação que quebra crença
3. **Exposição** — dor reconhecível, não genérica
4. **Reenquadramento** — "Não é X. É Y."
5. **Aprendizado** — ação aplicável HOJE
6. **Projeção** — o que muda depois
7. **CTA filtro de exclusão** — "...mas se você ainda está X, melhor nem chamar"

**SEMPRE perguntar antes de gerar:**
- Marco temporal vs Manchete (1 escolha por carrossel)
- Keyword filtro do CTA (ex: METODO, DIFERENCA, uma palavra ligada à marca do cliente)
- Deliverable concreto que a pessoa recebe ao comentar a keyword

Saída em `<FERABOT>/output/onboarding/{client-slug}-{data}/carrosseis/`.
