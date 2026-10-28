---
id: step-14-proposta-comercial
agent: patricia-proposta
execution: inline
inputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/client-briefing.md
outputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-proposta-comercial.html
format: html
context_files:
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-sales-page.html
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-mensagens-whatsapp.html
---

# Step 14 — Proposta Comercial · Documento Pitch 1:1

## Contexto

Patrícia Proposta cria um **documento formal personalizado** para o cliente enviar a leads quentes — depois da qualificação no WhatsApp e antes do fechamento. **Não é a página de vendas** (essa é pública e genérica). É um **pitch 1:1 escrito** que parece ter sido feito especificamente para a pessoa que vai receber.

## Diferença entre página de vendas e proposta comercial

| | Página de vendas (step 02) | Proposta comercial (step 14) |
|---|---|---|
| Público | Qualquer um que clica no link | Lead já qualificada por WhatsApp |
| Tom | Construção de autoridade + persuasão | Reconhecimento + endereçamento direto |
| Aborda | Dor genérica do avatar | A situação específica que a pessoa contou |
| Inclui | "[Nome da Cliente]" placeholder | Espaço para o cliente personalizar com nome real |
| CTA | "Entre na próxima janela" | "Vamos começar?" + 4 passos práticos |
| Validade | Permanente | 14 dias a partir do envio |

## Output: HTML formato proposta comercial

### Estrutura padrão de seções

1. **Capa** — fundo escuro, marca + nº de proposta + data + meta-row (Para/Validade/Investimento)
2. **O contexto da sua jornada** — endereçamento direto à situação que a lead compartilhou (com pull quote da dor central comum: "Sei que tenho capacidade. Mas não consigo dar o próximo passo.")
3. **Como vamos trabalhar juntos** — explicação do método em 5 fases (do programa do cliente)
4. **O que você recebe** — stack de valor detalhado com items + sub-descrições + preços individuais (formato escuro/dark card)
5. **Garantia e segurança** — selo + texto + disclaimer regulatório
6. **Próximos passos** — 4 passos numerados em CTA box destacado
7. **Uma palavra pessoal** — fundo escuro, tom íntimo, assinatura manuscrita simulada
8. **Colofon** — ficha técnica + handle + WhatsApp + selo de "Documento personalizado · Confidencial"

### Variáveis-chave que ficam como placeholder

- `[INSERIR: Nome da Cliente]` no canto superior da capa
- Validade: 14 dias (fixo)
- Tudo o mais é pré-preenchido com dados do cliente do squad

### CTA box (Passo 1 dos próximos passos)

Deve incluir botão `wa.me/{phone}?text={mensagem-pré-preenchida}` que, ao clicar, abre WhatsApp do cliente com a mensagem "[Primeiro nome do cliente], li a proposta e quero começar. Vamos conversar?" já formatada.

### Tom

**Mais íntimo que a página de vendas, mais formal que as mensagens WhatsApp**. Como uma carta profissional — mas escrita pelo próprio especialista (mentor, terapeuta, consultor) que conhece a pessoa.

> Se quiser a versão em PDF (deck 16:9 pronto pra mandar), a skill `propostas` do FERABOT faz a conversão.

A última seção (Uma palavra pessoal) deve ser confessional, autoral, e fechar com uma assinatura tipo:

```
Com cuidado,
[Nome]
[Título profissional]
```

## Veto Conditions

- NUNCA reusar a copy literal da página de vendas — proposta tem voz mais íntima
- NUNCA omitir a seção "Uma palavra pessoal" — é o que diferencia de uma proposta comercial genérica
- NUNCA fazer proposta com prazo de validade indefinido — sempre 14 dias (gera urgência saudável)
- SEMPRE incluir o disclaimer regulatório quando o cliente é profissional regulamentado (CRP, CRM, OAB, CRA, etc.)
- SEMPRE usar `wa.me/...?text=...` no CTA principal (não link genérico)
