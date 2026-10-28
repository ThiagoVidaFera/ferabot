---
id: step-13-mensagens-whatsapp
agent: walter-whatsapp
execution: inline
inputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/client-briefing.md
outputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-mensagens-whatsapp.html
format: html
context_files:
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-sales-page.html
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-marketing-plan.html
---

# Step 13 — Mensagens de WhatsApp · Sequência de Funil

## Contexto

Walter WhatsApp recebe o briefing + a página de vendas + o tom-de-voz aprovado e produz uma sequência de **9 mensagens de WhatsApp prontas para uso**, cobrindo do quebra-gelo até o fechamento (ou despedida elegante).

A sequência substitui scripts genéricos de "vendas no DM" por um **funil estruturado em 5 momentos**: quebra-gelo → qualificação → pitch → proposta → follow-up → fechamento. Cada mensagem tem variações com placeholders `{nome}`, `{interpretação}`, etc., para o cliente substituir antes de enviar.

## Output: 9 mensagens organizadas em 5 momentos

| Mensagem | Momento | Quando dispara |
|---|---|---|
| **M1** | Quebra-gelo | Pessoa entra no DM ou manda palavra-chave da isca |
| **M2** | Qualificação | Após receber pontuação/diagnóstico inicial |
| **M3** | Pitch curto | Após pessoa contar contexto real (filtro) |
| **M4** | Proposta detalhada | Quando pessoa pede mais info |
| **M5** | Follow-up D+1 | 24h sem resposta — reativação leve |
| **M6** | Follow-up D+3 | 3 dias sem fechar — entrega valor (Reel/post) |
| **M7** | Follow-up D+7 | Escassez real (próxima janela fechando) |
| **M8** | Fechamento "sim" | Pessoa aceitou — celebração + 3 passos práticos |
| **M9** | Despedida elegante "agora não" | Mantém porta aberta sem ressentimento |

## Instruções para Walter WhatsApp

### Estrutura visual de cada mensagem

Cada mensagem é apresentada como **bloco HTML** com:
- Header com número (M1-M9), título descritivo e tag de momento
- Contexto explicativo (italic, em quadro destacado)
- **Chat bubble simulando WhatsApp** (verde-claro `#DCF8C6`, border-radius assimétrico) — exatamente como aparece visualmente no app
- Box de **dica de uso** com atalhos do WhatsApp Business (ex: `/m1`)
- Variáveis em destaque colorido `<span class="variavel">{nome}</span>`

### Tom adaptado ao cliente

O Walter ajusta o tom conforme o tom-de-voz aprovado para o cliente (ver `tone-of-voice.md`):
- **Tom 1 (Transformacional)**: linguagem acolhedora, "te entendo", "faz sentido", emoji suave da marca
- **Tom 2 (Direto)**: linguagem assertiva, frases curtas, sem rodeios
- **Tom 3 (Educativo)**: linguagem técnica, dados, referências

### Variáveis padrão por mensagem

| Variável | Onde aparece | Exemplo |
|---|---|---|
| `{nome}` | Todas | "Mariana" |
| `{link da isca digital}` | M1 | `https://...netlify.app/livro` |
| `{interpretação curta da faixa}` | M2 | "Sua nota tá na faixa de autoestima baixa..." |
| `{1 frase reconhecendo a dor específica}` | M3 | "O que você me contou sobre a transição..." |
| `{link da página de vendas}` | M4 | `https://...netlify.app` |
| `{1 frase específica, mostrando que lembrou}` | M5 | "Pensei na situação do trabalho que você me contou ontem" |
| `{link de Reel/post relevante}` | M6 | "instagram.com/p/..." |
| `{mês}` / `{mês seguinte}` | M7 | "junho" / "julho" |
| `{link / chave PIX}` / `{link da agenda}` | M8 | PIX + Calendly/Cal.com |

### Box de dica WhatsApp Business

Em pelo menos **3 das 9 mensagens**, sugerir atalhos de resposta rápida (ex: `/m1` → M1). O Walter conhece o WhatsApp Business e ensina o cliente a usar a ferramenta.

### Layout HTML

- Capa com título "Mensagens de Venda Prontas Para WhatsApp"
- Intro com instruções de uso e fluxo recomendado
- Cada mensagem como um `<div class="msg-block">` com seu próprio header colorido por momento
- Footer com handle/contato

## Veto Conditions

- NUNCA usar mensagens genéricas tipo "oi! tudo bem? qual sua dúvida?"
- NUNCA usar pitch agressivo no quebra-gelo (M1)
- NUNCA fazer follow-up cobrando "você ainda quer?" — sempre entregar valor
- NUNCA encerrar relação com "agora não" de forma fria — sempre manter porta aberta
- SEMPRE incluir filtro de qualificação (M3 só dispara se pessoa demonstrou dor real e está no perfil ideal)
- SEMPRE adaptar tom de voz ao cliente
- SEMPRE usar variáveis explícitas `{...}` para o cliente substituir
