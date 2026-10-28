---
id: step-20-mensagem-entrega
agent: danilo-drive
execution: inline
inputFile: pipeline/data/client-message-template.md
outputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-mensagem-entrega.md
introduced_in_squad_version: "4.0"
---

# Step 20 — Mensagem de Entrega WhatsApp (v4)

## Contexto

Último artefato do squad. Depois do deploy (Netlify vendas + Netlify plano) e do upload Drive, o squad gera a **mensagem que você (o operador) vai mandar pro cliente no WhatsApp** apresentando o pacote. Se você está rodando o onboarding no seu próprio negócio, a mensagem vira o seu resumo do pacote.

Sem essa mensagem o cliente recebe um monte de link sem contexto. A mensagem é o que transforma "pacote técnico" em "entrega de mentor".

## Instruções

1. Ler `pipeline/data/client-message-template.md` (template canônico v4)
2. Ler `client-briefing.md` pra extrair: primeiro nome, amarra de marca (inimigo + mecanismo + diferencial), big idea, temas dos carrosséis, título do livro, título do roteiro YouTube, IG handle sugerido, nicho (pra adaptar "registro profissional")
3. Coletar os links reais do run:
   - `{{link_jornada}}` *(opcional)* = [A PREENCHER: link da sua área de membros/checklist, se tiver]. Sem link, o bloco da Jornada sai da mensagem.
   - `{{link_vendas}}` = URL Netlify do site vendas
   - `{{link_workshop}}` = URL Netlify do site workshop
   - `{{link_plano}}` = URL Netlify do site plano
   - `{{link_drive}}` = URL da pasta Drive (automática no Step 18 ou colada pelo usuário no upload manual)
   - `{{link_suporte}}` *(opcional)* = [A PREENCHER: link do seu grupo/canal de suporte]
4. Preencher TODOS os placeholders `{{...}}` do template
5. Salvar em `<FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-mensagem-entrega.md`
6. Exibir a mensagem final pro operador em bloco de texto puro, pronta pra copiar/colar

## Regras invioláveis (do template)

- Link da Jornada (se houver) é checklist/área de membros da sua metodologia — NUNCA chamar de "página de vendas"
- Links na ordem fixa: Jornada (opcional) → Vendas → Workshop → Plano → Drive
- Tom conversacional + mega didático — explicar o que é cada coisa e por quê
- Nunca mencionar custo/tokens/IA pro cliente
- Adaptar "registro profissional" ao nicho (CRM/CRP/CREF/OAB ou omitir)
- Fechar com permissão de editar o tom + "Abraço, {nome do operador}"

## Veto Conditions

- NUNCA entregar a mensagem com placeholders `{{...}}` não preenchidos
- NUNCA inverter a ordem dos links
- NUNCA chamar o link da Jornada de página de vendas
- NUNCA pular a explicação individual de cada PDF do Drive
- SEMPRE adaptar a amarra de marca ao dossiê real do cliente (nunca reaproveitar a de outro run)
