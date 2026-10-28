---
id: step-19-roteiro-youtube
agent: renata-roteiro
execution: inline
inputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/client-briefing.md
outputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-roteiro-youtube.html
format: html
context_files:
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-sales-page.html
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-marketing-plan.html
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-livro-{slug-livro}.html
introduced_in_squad_version: "4.0"
---

# Step 19 — Roteiro YouTube (v5.0 · 2026-06-12)

## Contexto

Renata Roteiro entrega **1 DECK DE SLIDES LIMPO** de vídeo YouTube em formato apresentação HTML 20 slides. O Step 18 (Drive) converte esse HTML em PDF e nomeia o PDF com o **título atraente sugerido para o vídeo**.

Esse deck vira a **primeira coisa que o cliente grava** depois de receber o pacote — porta de entrada do funil orgânico. **Ele já será o que o apresentador irá utilizar na tela**: o cliente fala em cima de cada slide limpo, sem precisar editar nada.

## ⚠️ REGRA DE OURO v5.0 (2026-06-12) — Deck limpo único, zero scaffolding na tela

O entregável é um **único deck atraente contendo APENAS a mensagem editorial que vai pra tela**. **Não existe mais a camada PROMPTER no arquivo.** Sem painel de prompter, sem fala em 1ª pessoa, sem notas de produção/B-roll, sem rótulo de beat/estrutura, sem marcação de tempo. O apresentador apenas fala por cima de cada slide limpo.

Cada slide mostra **só a mensagem editorial limpa** — uma frase/título curto de impacto, palavra de destaque, no máximo 1 apoio. **PROIBIDO** qualquer rótulo de estrutura ou engenharia de persuasão: "Gancho", "Hook", "Promessa", "Identificação", "Quebra de objeção", "Filtro de exclusão", "Filtro", "CTA", "Autoridade", "Slide 14 — O obstáculo comum", os parênteses de função dos títulos do roteiro-fonte, numeração que revele estágio persuasivo, marcação de tempo (15-30s) ou nome do beat. Se o espectador/apresentador ler isso, percebe o funil e o feitiço quebra.

A função narrativa (Hook → ... → Filtro → CTA) continua existindo **só como referência interna de quem escreve** (o agente Renata), nunca como texto no deck. O PDF/screenshot de qualquer slide tem que sair 100% limpo de scaffolding.

Único andaime permitido na tela: um **índice discreto de slide** (ex.: "01 / 20" pequeno no canto) e um rodapé/marca minúsculo do cliente. Nada além disso.

## Por que esse step existe (v4)

Pré-v4 o squad entregava ideias de roteiro embutidas no plano de marketing (Seção 9 — 5 Reels). Mas vídeo YouTube longo é diferente de Reel: precisa de roteiro completo, prompter-friendly, com filtragem de público e CTA WhatsApp claro.

Regra: o pacote sempre traz uma sugestão de roteiro pra gravação no YouTube, salva com um nome que já seja a sugestão de título atraente pro vídeo.

## Instruções pra Renata

### 1. Ler contexto

Em ordem:
1. `client-briefing.md` (base obrigatória — Big Idea, inimigo, mecanismo, frases-assinatura)
2. Sales page (pra ler tom)
3. Plano de marketing (pra reusar pilares + frases-efeito)
4. Livro-funil (pra referenciar tese central)

### 2. Definir título atraente

Critério: nome de título **clicável no YouTube** (curiosidade + identificação + número se possível).

3 fórmulas validadas:
- **"Por que [comportamento]" + "e como parar"** — ex: *"Por Que Você Adia a Decisão Que Já Tomou — e Como Parar"*
- **"O erro que [resultado negativo]"** — ex: *"O Erro Que Trava Toda Primeira Venda de Mentoria"*
- **"[Frase-assinatura forte] — [contexto]"** — ex: *"Planilha Não Substitui Decisão — O Caso do Salário Que Some"*

O título sugerido aparece no:
- Header do HTML
- Slide 01 (hook visual)
- Será o nome do PDF gerado pelo Step 18 (sem prefixo cliente)

### 3. Estruturar 20 slides

Seguir estrutura fixa do agente Renata (vide `agents/renata-roteiro.agent.md`):
- 01 Hook
- 02 Promessa
- 03 Identificação
- 04 Big problem
- 05 Causa raiz
- 06 Custo de não resolver
- 07 Reframe
- 08 Apresenta método
- 09-11 Pilares 1, 2, 3
- 12 Caso real
- 13 Antes/depois
- 14 Objeção comum
- 15 Autoridade
- 16 Diferencial competitivo
- 17 Pra quem é
- 18 Pra quem NÃO é (filtro)
- 19 CTA WhatsApp
- 20 Despedida + frase-assinatura

### 4. HTML output — DECK LIMPO ÚNICO

Cada slide ocupa 1 viewport (`page-break-after: always` — PDF 1 slide/página), proporção 16:9 (paisagem, ex.: 1280×720 px) — é um deck que aparece NA TELA de um vídeo. Cada slide contém **uma só coisa**: a mensagem editorial limpa que vai pra tela.

**O slide do vídeo:**
- Visual acabado, premium, na identidade do cliente (não rascunho)
- Só a mensagem editorial: frase curta de impacto, palavra-chave em destaque, no máximo 1 apoio
- Tipografia grande, legível à distância no vídeo, hierarquia forte
- **ZERO** rótulo de função, número de estágio persuasivo, tempo, fala de prompter, nota de produção, ou nome de beat
- Deve poder ser exportado/printado sozinho sem revelar nada da estrutura

**Variação visual entre slides** pra não ficar monótono (alguns centralizados, outros com a palavra-chave gigante em destaque, slides de "lista de dores" com itens empilhados, slides de contraste antes/depois), mantendo coesão na identidade do cliente. Capriche: é o material que o apresentador usa na tela.

**Único andaime permitido na tela:** índice discreto de slide ("01 / 20" pequeno no canto) e um rodapé/marca minúsculo do cliente. Header/footer do documento (cliente + run id) pode ficar num comentário HTML ou num rodapé minúsculo discreto — nunca poluindo a tela.

### 5. Tempo

Cada slide = ~15-30 segundos de fala do apresentador por cima.
Vídeo total = 5-10 minutos. (O tempo é só dimensionamento interno do arco — **nunca aparece no deck**.)

## Veto Conditions

- **NUNCA renderizar na tela rótulo de estrutura/persuasão** (Gancho, Hook, Promessa, Objeção, Filtro, Filtro de exclusão, CTA, Autoridade, "Slide X — função", parênteses de função dos títulos), marcação de tempo, ou numeração de estágio persuasivo — o espectador/apresentador só vê a mensagem
- **NUNCA incluir camada de prompter, fala em 1ª pessoa, notas de produção/B-roll ou tempo no deck** — o entregável é deck limpo único, esse material não existe mais no arquivo
- NUNCA mencionar valor/preço do programa
- NUNCA chamar pra link de checkout/página de vendas — só WhatsApp, como mensagem ("me chama no WhatsApp"), sem a palavra "CTA"
- NUNCA pular slide 18 (pra quem NÃO é) ou slide 19 (WhatsApp) — mas o slide 18 é uma frase editorial de "pra quem isso não é", nunca a palavra "filtro"
- NUNCA usar título técnico/genérico ("roteiro-{cliente}.html" não vira "roteiro-{cliente}.pdf" — vira o título atraente, que nomeia o PDF)
- SEMPRE 20 slides no mesmo arco narrativo, design atraente na identidade do cliente, `page-break-after:always` (1 slide/página no PDF)

## Output

`{client-slug}-roteiro-youtube.html` no run dir.

Step 18 lê esse arquivo e converte em PDF nomeado `{Título atraente extraído do header}.pdf`.
