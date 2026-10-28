---
id: step-02-sales-page
agent: paula-pagina
execution: inline
inputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/client-briefing.md
outputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-sales-page.html
format: html
---

# Step 02 — Criar Página de Vendas HTML

## Contexto

Paula Página recebe o briefing completo do cliente e deve criar uma página de vendas HTML autossuficiente em formato text sales letter de alta conversão para a mentoria/programa do cliente.

Esta página será publicada no Netlify com a URL `{client-slug}-vendas.netlify.app` e deve ser o principal ativo de conversão do cliente.

## Dados de Referência

Consulte os seguintes arquivos antes de gerar:
- `pipeline/data/domain-framework.md` — estrutura obrigatória da sales letter
- `pipeline/data/anti-patterns.md` — erros a evitar
- `pipeline/data/output-examples.md` — exemplos de referência
- `pipeline/data/tone-of-voice.md` — tom baseado no perfil do cliente

## Instruções para Paula Página

### 1. Leia o briefing completo
Extraia do `client-briefing.md`:
- Nome do cliente e da marca/método
- Nicho e especialidade exata
- Avatar do público-alvo (quem vai ler a página)
- Problema principal (o que mantém o leitor acordado)
- Transformação entregue (o resultado concreto prometido)
- Nome, preço e duração da oferta
- Diferenciais únicos e método proprietário
- Provas sociais (números, nomes, resultados)
- Urgência e bônus disponíveis
- Contatos para CTA (WhatsApp, link de compra, e-mail)

### 2. Defina o tom
Com base no nicho e no perfil do cliente, escolha entre:
- Tom Direto e Provocador (padrão para mentorias de negócios/high ticket)
- Tom Transformacional (para mentorias de vida/propósito)
- Tom Educativo (para nichos técnicos)

### 3. Escreva a copy antes de montar o HTML
Defina internamente:
- Pre-headline
- Headline principal (com número)
- Subheadline
- Lead (3 parágrafos)
- Identificação com o problema
- História do mentor
- Apresentação do método
- 10 benefícios
- 3+ depoimentos — só reais; se não houver, usar `[A PREENCHER: depoimento real — nome, profissão, cidade]` (nunca inventar)
- Stack de valor com preços
- 3-5 bônus
- Garantia
- Urgência
- 6 FAQs
- CTAs (3 posicionamentos)

### 4. Monte o HTML com as especificações técnicas
- HTML5 completo com `<!DOCTYPE html>`
- CSS inline na tag `<style>` do `<head>`
- Sem dependências externas (sem Google Fonts via CDN, sem Bootstrap)
- Fontes: system fonts stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`) ou @font-face base64
- Design escuro com acentos em cor vibrante (vermelho, dourado, laranja — baseado no perfil do cliente)
- Responsivo com media queries
- Largura máxima de 760px para texto, centrado
- Seções alternadas (fundo escuro e fundo claro) para ritmo visual
- Botões de CTA: grande, bold, cor de contraste alto
- Seção de depoimentos com cards visuais
- Stack de valor em tabela ou lista estilizada com risca no preço original

### 5. Estrutura de seções HTML obrigatórias (nesta ordem)
```
1. <section id="header"> — Pre-headline + Headline + Subheadline
2. <section id="lead"> — Abertura/Lead
3. <section id="problema"> — Identificação com o problema
4. <section id="agitacao"> — Agitação + promessa de saída
5. <section id="historia"> — História e credenciais do mentor
6. <section id="metodo"> — Apresentação do método/programa
7. <section id="beneficios"> — Benefícios (com ícones/checkmarks)
8. <section id="prova-social"> — Depoimentos
9. <section id="oferta"> — Stack de valor + preço
10. <section id="bonus"> — Bônus detalhados
11. <section id="garantia"> — Garantia
12. <section id="urgencia"> — Urgência + CTA final
13. <section id="faq"> — FAQ
14. <footer> — Informações legais básicas
```

### 6. Nomenclatura do arquivo
Salve como `{client-slug}-sales-page.html` onde `{client-slug}` é o nome do cliente em minúsculas, sem acentos, hífens no lugar de espaços (ex: "Carlos Mendes" → `carlos-mendes-sales-page.html`).

## Veto Conditions

- NUNCA criar página sem headline principal com número específico
- NUNCA criar página com depoimentos completamente genéricos ("foi ótimo!")
- NUNCA usar dependências externas de CDN
- NUNCA revelar o preço antes do stack de valor completo
- NUNCA criar página sem pelo menos 3 posicionamentos de CTA
- NUNCA usar template genérico que não reflita o nicho específico do cliente
- Se informações críticas estiverem faltando no briefing, use placeholders destacados com `[INSERIR: ...]` para que o mentor preencha

### ⚠️ Regra v3 (2026-05-05) — Nicho clínico/saúde mental

Para clientes que são **psicólogos, terapeutas, psiquiatras, mentores de saúde mental** ou similares:
- **NÃO mencionar número de sessões** ("12 sessões", "12 encontros", "Sessão 1", etc.)
- **USAR**: "12 semanas individual 1:1", "encontros 1:1 ao vivo", "primeiro encontro"
- **Stack de valor**: "Acompanhamento individual 1:1 ao vivo, durante 12 semanas — R$ 4.800" (não "12 sessões 1:1 (60 min cada) — R$ 4.800")

### ⚠️ Regra v4 (2026-06-12) — Visual clean por padrão + faixa de preço → WhatsApp

Validada em consultoria individual com valor variável (faixa de preço). Dois pontos permanentes pros próximos clientes:

**1. VISUAL — clean/minimalista por padrão.**
A página de vendas nasce com design **CLEAN/MINIMALISTA**: whitespace generoso (var `--space` folgada), contenção dos acentos e das sombras (glows radiais suaves, `box-shadow` discreta, acento de cor usado com parcimônia), tipografia editorial conduzindo a hierarquia em vez de molduras/bordas em tudo. Manter **alta qualidade anti-template** (nada de cara de tema genérico), mas priorizar **respiro, calma e clareza** acima de densidade visual e ruído. Mesmo conteúdo e seções — porém arejado.

**2. PREÇO + WHATSAPP — comunicar a FAIXA e levar pro WhatsApp.**
Quando a oferta é **consultoria/mentoria individual com valor variável**, a página DEVE comunicar a **FAIXA de investimento** de forma honesta (ex.: "R$ X a R$ Y · valor exato acertado no WhatsApp") e **TODOS os CTAs vão pro WhatsApp**. O objetivo da página é **qualificar e levar o lead pro WhatsApp JÁ SABENDO a faixa de preço** — sem surpresa de valor na conversa. Mostrar a faixa em pelo menos 3 pontos: bloco de preço da oferta, FAQ ("Quanto custa?") e perto do CTA final.

> **Sobrepõe** a Veto Condition "NUNCA revelar o preço antes do stack de valor completo" **neste modelo específico** (consultoria/mentoria individual → WhatsApp com pré-qualificação por faixa). Para produtos de preço fixo/checkout direto, a regra antiga continua valendo.
