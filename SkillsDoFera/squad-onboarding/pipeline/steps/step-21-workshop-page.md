---
id: step-21-workshop-page
agent: paula-pagina
execution: inline
inputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/client-briefing.md
outputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-workshop.html
context_files:
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-sales-page.html
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-livro-funil.html
---

# Step 21 — Página do Workshop (entregável obrigatório v4)

## Contexto

Paula Página gera **uma página de captação de workshop** — sempre, para todo cliente do squad onboarding. O workshop é a **oferta de entrada low-ticket** que filtra curioso, gera microcompromisso e funila para a mentoria principal.

Roda **depois** da sales page (step-02) e do livro-funil (step-12), porque herda voz, paleta, inimigo, mecanismo e metáforas desses dois artefatos. Entra no pacote **antes** do checkpoint de criativos (step-09).

## Parâmetros FIXOS do workshop (padrão imutável do squad)

| Param | Valor padrão | Observação |
|---|---|---|
| **Data** | **Próximo sábado** | Calcular o próximo sábado a partir da data de execução do run. Escrever data por extenso na página (ex: "sábado, 24 de maio") |
| **Horário** | **09h às 12h** | Janela de 3h, ao vivo |
| **Preço** | **R$ 37** | Low-ticket fixo. Nunca gratuito, nunca outro valor |
| **Formato** | Ao vivo, online | Intensivo |
| **Destino** | Funila para a oferta principal da mentoria | Mencionado de forma honesta no fim, não é o CTA primário |

> Se o cliente/operador quiser outra data/preço, troca depois — mas o **padrão gerado** é sempre próximo sábado, 9h-12h, R$37.

## Tema — REGRA CRÍTICA: específico e amarrado ao cliente

O tema do workshop **NUNCA** é genérico ("workshop de produtividade"). Deve ser **muito específico e amarrado ao dossiê do cliente**:

- Usa o **mecanismo proprietário** do cliente (ex: "Método [SIGLA]™", "Protocolo [Nome]™") como espinha
- Ataca o **inimigo nomeado** da marca (ex: "[Nome do Inimigo]™" — o vilão que a marca combate)
- Promete uma **transformação concreta com prazo/marco** (ex: "estruturar sua aprovação até o fim do ano que vem", "destravar a primeira consulta de alto valor em 30 dias")
- Inclui, quando fizer sentido no nicho, um **mecanismo de entrada diferenciado** (diagnóstico/avaliação de perfil que personaliza o conteúdo — ex: "Diagnóstico de Perfil [do avatar]™")

Fórmula do título: `{Nome do mecanismo/protocolo} — {intensivo de 3h} para {transformação concreta} {marco temporal}`.
Exemplo hipotético (nicho concursos): *"Protocolo [Nome]™ — o intensivo de 3h com os 5 pilares para estruturar sua aprovação até o fim do ano que vem"*.

## Estrutura da página (adaptar o framework de sales page de Paula para EVENTO)

1. Pre-headline (qualifica o avatar pela dor)
2. Headline: promessa concreta + marco temporal + nome do protocolo/workshop
3. Subheadline: o mecanismo (pilares + diferencial de entrada) + data/horário/preço
4. Lead (identificação com o inimigo nomeado da marca)
5. Bloco de **estatísticas/realidade do mercado** — dados direcionalmente verdadeiros e conhecidos do nicho. **Integridade anti-guru**: nada inventado atribuído a estudo falso. Número específico sem fonte → marcar `[INSERIR: confirmar dado/fonte]`. Metáforas/analogias são livres (retóricas)
6. Agitação (custo de não resolver)
7. O que é o workshop: detalhar o mecanismo/protocolo pilar a pilar (o que é → como funciona no workshop → o que a pessoa sai tendo)
8. O diferencial de entrada (diagnóstico/avaliação) explicado com analogia forte (raio-X antes da cirurgia, GPS vs dirigir no escuro)
9. Quem conduz (autoridade real do cliente — do briefing, sem inventar)
10. O que você leva (8-10 bullets de transformação concreta)
11. Pra quem é / pra quem NÃO é (filtro de público, afasta atalho/fórmula mágica)
12. Inscrição: **sábado, 09h-12h, R$ 37** + `[INSERIR: link de checkout/inscrição]`. CTA secundário discreto = WhatsApp `[INSERIR: WhatsApp cliente]`
13. CTA repetido em 3+ posições
14. Bloco honesto "depois do workshop": quem quiser conduzir o processo completo entra na mentoria principal (citar nome + preço da oferta principal do briefing) — natural, sem pressão, NÃO é o CTA primário
15. FAQ (6-8 objeções reais do nicho)
16. Rodapé: @handle do cliente + aviso honesto (workshop educacional, sem garantia de resultado)

## Especificações técnicas

- `<!DOCTYPE html>`, meta charset+viewport, CSS 100% inline, ZERO dependências externas, system fonts
- Paleta consistente com a sales page do cliente (herdar do `{client-slug}-sales-page.html`)
- Responsivo mobile-first, container central máx 760-820px
- Botões CTA com hover state
- TODOS os placeholders marcados visivelmente em destaque vermelho: `[INSERIR: ...]`
- Tom anti-guru: zero contador regressivo, zero "última vaga hoje", zero promessa irreal. Escassez só se verdadeira (turma limitada porque há análise individual é honesto)

## Publicação

A página é publicada no Netlify pelo step-10 (Netuno) em **subdomínio dedicado**: `https://{slug}-workshop.netlify.app`. O link entra na mensagem final do cliente (step-20) na ordem Jornada (opcional) → Vendas → **Workshop** → Plano → Drive.

## Veto Conditions

- NUNCA gerar tema genérico — sempre amarrado ao inimigo + mecanismo do dossiê
- NUNCA mudar os parâmetros fixos (próximo sábado, 9h-12h, R$37) sem instrução explícita do operador
- NUNCA inventar estatística com fonte falsa — marcar `[INSERIR: confirmar dado/fonte]`
- NUNCA tornar a mentoria principal o CTA primário da página (o CTA primário é a inscrição no workshop R$37)
- SEMPRE herdar paleta/voz/inimigo/mecanismo da sales page e livro-funil já gerados
- SEMPRE deixar data por extenso calculada a partir do próximo sábado real
