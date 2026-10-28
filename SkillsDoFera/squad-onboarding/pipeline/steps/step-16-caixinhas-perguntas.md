---
id: step-16-caixinhas-perguntas
agent: clara-caixinhas
execution: inline
inputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/client-briefing.md
outputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/caixinhas/
format: png
context_files:
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-sales-page.html
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-marketing-plan.html
external_skill: squad-caixinha-fera (opcional — render)
---

# Step 16 — 10 Caixinhas de Perguntas

## Contexto

Clara Caixinhas gera 10 stories simulando **sticker "Pergunta" do Instagram + resposta viral**, cobrindo 4 ângulos emocionais e 6+ formatos visuais por run.

O processo tem 5 etapas internas ([01] Estrategista → [02] Copywriter de Perguntas → [03] Copywriter Viral → [04] Diretor de Arte → [05] Renderizador), descritas abaixo. Para a parte visual (sticker simulado, 4 estilos de bloco de resposta, safe zones) pode usar a skill `squad-caixinha-fera` do FERABOT, se estiver instalada — os gates e a distribuição deste step continuam valendo.

## Input fixo do squad onboarding

| Param | Valor padrão |
|---|---|
| **Título da caixinha** | "Pergunte à psicóloga" / "Pergunte ao [@]" / "Caixinha aberta" — adaptar ao cliente |
| **@do perfil** | `@{instagram-handle-do-cliente}` |
| **Quantas caixinhas** | 10 |
| **Agendar publicação?** | Não (squad onboarding entrega arquivos prontos; agendamento é decisão do cliente) |
| **Logo do cliente** | (do briefing) |
| **Biblioteca visual** | Não (sem fotos do cliente disponíveis) |

## Distribuição obrigatória por run de 10

Cobertura mínima para 9+ caixinhas:
- **4 ângulos emocionais**: DOR ×3 · DESEJO ×3 · GATILHO ×2 · EMOÇÃO ×2
- **6+ formatos visuais diferentes** (combinações de layout × estilo de bloco de resposta — nunca 2 iguais em sequência)
- **3 modos de fundo**: como sem biblioteca de fotos → **todas em F1 (preto sólido)**

## Pipeline de execução

### [01] Estrategista
Distribui os 10 temas em uma tabela `tema × ângulo × formato × fundo` e aguarda **GATE de aprovação explícito** do usuário antes de prosseguir.

### [02] Copywriter de Perguntas
Para cada tema, escreve **1 pergunta realista** de 60-140 caracteres, em 1ª pessoa, simulando seguidor honesto. Gera username fictício e varia o título do sticker entre as 10.

### [03] Copywriter Viral — Respostas
Gera respostas que ativem pelo menos 2 elementos virais (identificação imediata, quebra de crença, frase printável, especificidade, reenquadramento) e passem no **PRINT CHECK** (a frase merece print/compartilhamento) + **EMOTION CHECK** (provoca reação emocional reconhecível). Aguarda **GATE de aprovação explícito** antes de gerar arte.

### [04] Diretor de Arte
Aplica o formato visual definido em [01]. Respeita safe zones obrigatórias (0-280px topo, 1660-1920px rodapé).

### [05] Renderizador
Gera HTML por arte + renderiza PNG 1080×1920 via Playwright.

### [05.5] QA Visual obrigatório
Roda 3 checks bloqueantes:
- Check 1: palavras NUNCA cortadas (última linha de cada bloco termina inteira)
- Check 2: safe zones respeitadas (zero conteúdo nos primeiros 280px e últimos 260px)
- Check 3: rosto livre em fotos (não aplicável quando todas as artes são F1 preto)

## Output: 10 PNGs em `<FERABOT>/output/onboarding/{client-slug}-{data}/v3/caixinhas/`

Estrutura nomeação: `{NN}-{tema-slug}.png` (ex: `01-trava-decisao.png`).

## Veto Conditions

- NUNCA pular o gate de aprovação do [01] Estrategista (distribuição × ângulo × formato)
- NUNCA pular o gate de aprovação do [03] Copywriter Viral (perguntas + respostas em md)
- NUNCA repetir o mesmo `ângulo × formato` em 2 caixinhas consecutivas
- NUNCA rodar sem variar pelo menos 6 formatos visuais por run
- **NUNCA exibir na arte quem fez a pergunta** — sem @username, nome, avatar ou "respondendo a fulano". O sticker "Pergunta" do IG é anônimo pro público. A arte mostra só o texto da pergunta + título do sticker
- SEMPRE rodar QA visual ([05.5]) antes de entregar PNGs ao usuário
