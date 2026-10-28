---
id: step-04-marketing-plan
agent: marco-marketing
execution: inline
inputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/client-briefing.md
outputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-marketing-plan.html
format: html
context_files:
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-sales-page.html
---

# Step 04 — Criar Plano de Marketing Digital HTML

## Contexto

Marco Marketing recebe o briefing do cliente e a página de vendas aprovada (para garantir consistência de posicionamento) e cria um plano de marketing digital completo, visual e personalizado em HTML.

Este documento é entregue ao cliente como um ativo premium — deve parecer que foi construído especificamente para ele, não um template com nome preenchido.

## Dados de Referência

Consulte antes de gerar:
- `pipeline/data/research-brief.md` — melhores práticas de marketing para mentorias
- `pipeline/data/quality-criteria.md` — checklist de qualidade do plano
- `pipeline/data/output-examples.md` — exemplos de bios, roteiros e estruturas
- `pipeline/data/tone-of-voice.md` — tom adequado ao perfil do cliente
- `<FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-sales-page.html` — posicionamento já definido na página de vendas

## Instruções para Marco Marketing

### 1. Leia e interprete o briefing
Extraia todos os dados do `client-briefing.md` e identifique:
- Estágio atual do negócio (iniciante, crescimento, escala)
- Plataformas principais (Instagram, YouTube, LinkedIn)
- Nível de consciência do público-alvo
- Gaps de posicionamento e comunicação
- Diferenciais que podem virar pilares de conteúdo

### 2. Estrutura obrigatória do plano (todas as seções abaixo)

#### Seção 1 — Capa
- Nome completo do cliente
- Nome da marca/programa
- Título: "Plano de Marketing Digital — [Ano]"
- Subtítulo: "Criado por {nome de quem entrega o plano — você ou sua marca}"
- Data de criação
- Design premium com cor de destaque

#### Seção 2 — Sumário Executivo
- Visão geral em 1 parágrafo
- 5 principais recomendações em lista
- Meta principal dos próximos 90 dias
- Links de âncora para cada seção do plano

#### Seção 3 — Diagnóstico Atual
- Análise honesta do posicionamento atual
- O que está funcionando (mesmo que seja pouco)
- Principais gaps: posicionamento, conteúdo, oferta, distribuição
- Benchmark com o mercado

#### Seção 4 — Posicionamento e Nicho Definido
- Nicho específico (não genérico)
- Proposta de valor única (em 1 frase)
- Arquétipo de marca (Herói, Sábio, Criador, etc.)
- Diferencial competitivo central

#### Seção 5 — Bio do Instagram (3 Sugestões)
Criar 3 versões completas de bio (máximo 150 caracteres por bio + link):
- Opção 1: Foco em autoridade e resultado
- Opção 2: Foco em identificação com o problema do público
- Opção 3: Foco em identidade e movimento

#### Seção 6 — Manifesto da Marca
- 1 parágrafo de 5-8 linhas que captura a essência, valores e missão do cliente
- Deve soar como voz do próprio mentor, não como copy corporativo
- Inclui o que o mentor acredita, contra o que luta e para quem é

#### Seção 7 — Frases de Efeito (10 Sugestões)
- 10 frases/taglines originais que refletem o posicionamento
- Podem ser usadas em bio, posts, stories, thumbnails, página de vendas
- Mix de: provocação, resultado, identidade, método

#### Seção 8 — Estratégia de Conteúdo
- 5 pilares de conteúdo definidos e explicados
- Frequência por plataforma e formato
- Funil de conteúdo: topo, meio e fundo
- Proporção sugerida: educativo vs. autoridade vs. conversão

#### Seção 9 — Sugestões de Reels (5 ideias com roteiros)
Para cada Reel:
- Título e gancho (primeiros 3 segundos — o que falar/mostrar)
- Desenvolvimento (o que entregar de valor)
- CTA final
- Legenda sugerida
- Hashtags (5-8 específicas do nicho)

#### Seção 10 — Sugestões de Carrosséis (3 ideias com estrutura)
Para cada carrossel:
- Título da capa
- Estrutura slide a slide (título + 1 frase de corpo por slide)
- CTA do último slide
- Legenda sugerida

#### Seção 11 — Posts Estáticos (3 ideias)
Para cada post estático:
- Conceito visual
- Copy da imagem
- Legenda completa
- Hashtags

#### Seção 12 — Adaptação da Página de Vendas para o Nicho
- 3 sugestões de ângulo de headline alternativo
- Público secundário que pode ser targetado
- Ajustes de copy para cada plataforma de tráfego (orgânico Instagram, YouTube, anúncios)

#### Seção 13 — Plano de Execução — 6 Tarefas Imediatas (v3)
**Regra:** no lugar de um calendário diário de 30 dias, o plano traz 6 Tarefas Imediatas com checklist + links/ferramentas fixas.

Estrutura padrão (não mudar):
1. **🎥 Gravação do Vídeo** — tutoriais de gravação (Zoom, FocuSee ou equivalente) + `{{link_jornada}}` se você tiver área de membros/checklist
2. **🔗 Bio do Instagram** — escolher 1 das 3 versões da Seção 5
3. **📲 9 Posts** — 3 Reels + 3 Carrosséis + 3 Estáticos (Canva templates)
4. **📈 Turbinar R$ 10/dia × 3 dias** = R$ 270 total para os 9 posts
5. **📈 Geração de Leads** — Pixel + 1 campanha Advanced+ R$ 10/dia
6. **🤖 IA pra produção** — FERABOT, Genspark, transcrição

Encerrar com callout verde "Travou? → `{{link_suporte}}`" — [A PREENCHER: link do seu grupo/canal de suporte]. Opcional: sem link de suporte, o callout aponta pro WhatsApp do próprio operador ou é omitido.

#### Seção 14 — Métricas e KPIs · ⛔ REMOVIDA EM v3
**Regra:** não incluir seção de KPIs/métricas/painel. O acompanhamento é por execução e sensação de progresso (com acompanhamento semanal), não por painel de números projetados.

**Pós-v3, o plano tem 12 seções, não 14.** Fim do plano = Seção 13 (Plano de Execução — 6 Tarefas Imediatas) + bloco final "O Próximo Passo Concreto Para Hoje É" + rodapé.

**Também na Seção 2 (Sumário Executivo)**, NÃO usar bullets com "Mês 1: X vendas (R$ Y)" / "Mês 2: ..." / "Mês 3: ...". Usar 4 bullets qualitativos sobre **foco** dos 90 dias (validar oferta, presença consistente, ligar tráfego, construir prova social).

### 3. Design do documento HTML
- Capa com fundo colorido (cor de marca do cliente) e título em branco
- Sumário clicável com âncoras `#secao-X`
- Cada seção com: ícone emoji + número + título + cor de fundo de seção
- Tipografia hierárquica: H1 > H2 > H3 > corpo
- Tabelas estilizadas com cabeçalho colorido
- Callouts/boxes para informações mais importantes
- Largura máxima 900px, centrado, espaçamento generoso
- CSS inline, autossuficiente

### 4. Personalização obrigatória
- Nome do cliente aparece em pelo menos 5 seções
- Dados específicos do briefing usados em cada seção (não texto genérico)
- Frases de efeito criadas especificamente para o nicho do cliente
- Calendário com temas relevantes ao nicho (não temas genéricos de "coach")

## Veto Conditions

- NUNCA criar plano genérico que poderia ser de qualquer mentor
- NUNCA omitir nenhuma das seções obrigatórias (1 a 13 — a antiga Seção 14 de KPIs não existe mais)
- NUNCA criar frases de efeito que poderiam ser de um competidor qualquer
- NUNCA criar calendário sem temas específicos do nicho
- NUNCA incluir seção de KPIs ou metas numéricas projetadas ("Mês 1: X vendas")
- NUNCA omitir os roteiros completos das 5 sugestões de Reel
