# O que ainda falta para o cliente vender mais rápido

Diagnóstico honesto do que a entrega v5 **ainda não faz**, em ordem do que mais acelera a primeira
venda. Escrito em 2026-10-26, depois do run de referência.

A pergunta que organiza a lista: *entre o cliente receber o link e a primeira venda, onde ele
trava?* Hoje ele trava em três lugares — e os três são nossos de resolver.

## ✅ RESOLVIDO em 26/10 — Fonte única + QA único

O mesmo exemplo saía com dois valores (R$ 180 mil no criativo, R$ 212 mil no PDF) e cada rodada
montava um teste diferente. Agora: `fonte/` + `montar_cliente.py` (fato uma vez, conta calculada,
blocos derivados) e `qa_run.py` (todos os gates numa passada). No run de referência: 13 passam, 2 avisos
(pendências reais do cliente), 0 falhas. Calibrado com erro plantado: pega fonte desatualizada,
token sem resolver e fato digitado fora do token.

---

## 1. As páginas são protótipos. Precisam ser páginas. ⚠️ maior gargalo

`agendar.html` tem grade de horário ilustrativa, `grupo.html` tem formulário que não envia,
`proposta.html` leva para a agenda ilustrativa. O cliente aprova a prévia e **não tem onde ligar
o anúncio**. Ele vai montar página sozinho — ou não vai montar.

O caminho no FERABOT: a skill `paginas-e-quiz` faz página de captura com deploy na Netlify e a
`crm-de-leads` registra e acompanha o lead. O que falta é **parametrizar por cliente**: calendário
dele (Calendly, Google Agenda ou similar), WhatsApp dele, link do grupo dele, CRM dele.

**Proposta:** fase 9 do run — *"publicar as páginas vivas"*. Mesmo template, mesmo `content.js`,
mas com o backend ligado e no domínio do cliente (ou um subdomínio seu enquanto ele não tem).
A prévia continua sendo a demonstração; as páginas vivas são o que o anúncio aponta.

## 2. As campanhas são orientação. Precisam estar no Gerenciador, pausadas.

O `COMO-POSTAR.md` explica as três campanhas, mas o cliente ainda precisa criar campanha, conjunto
e anúncio na mão. É onde a maioria trava: errar o objetivo, o evento de conversão, o público.

O FERABOT já tem a skill `meta-ads-fera` (com META_ACCESS_TOKEN e META_AD_ACCOUNT_ID no `.env`). **Proposta:** subir as
3 campanhas **pausadas**, com os 9 criativos, o pixel e o destino certos. O cliente só liga. O
`COMO-POSTAR.md` passa de "crie assim" para "aperte o botão".

## 3. ✅ RESOLVIDO em 26/10/2026 — a isca existe. (era: "prometemos um PDF")

O carrossel, o grupo e a resposta da keyword `CARTEIRA` prometem o mapa das 9 situações — e não
há PDF. Quem comentar vai receber um `[LINK DO PDF]`.

**Feito.** `templates/kit-feed/build_isca.py` gera o PDF A4 de 9 páginas a partir do bloco `isca`
do `feed.json`, no visual do kit. O gate mede o respiro de cada página (conteúdo que passa do
limite seria cortado em silêncio). O `subir_drive.mjs` devolve o link (ou grava o link colado, no modo `--manual`) e o
`gerar_docs.py` o põe nas respostas-modelo. No run de referência: PDF da isca com link público conferido.

**O que o PDF ainda não tem, e é decisão de conteúdo, não de motor:** um caso real autorizado no
lugar do exemplo hipotético da página 8. Quando o cliente trouxer, troca-se no `feed.json` e
regenera-se — um comando.

## 4. Um checklist de coleta no briefing

Todos os `[A PREENCHER]` do run de referência eram dados que podiam ter sido pedidos no primeiro dia:
caso real com valor e prazo, link do vídeo, link da agenda, número de WhatsApp, limite de vagas,
parcelamento. **Proposta:** a fase 1 termina com uma mensagem única de coleta, com os 8 itens que
só o cliente tem. Sem isso, a entrega sai com buracos que atrasam a publicação.

## 5. O cliente precisa de um lugar para ver os leads

O fluxo E0–E7 pressupõe que ele sabe quem está em que etapa. Sem isso, lead some no WhatsApp.
**Mínimo viável:** uma planilha-modelo no Drive (nome · origem · etapa E0–E7 · última mensagem ·
próxima ação · data). **Ideal:** o CRM do FERABOT (skill `crm-de-leads`) por cliente, com a recepção já
pareada — o que resolve o item 1 junto.

## 6. Respostas-modelo como "respostas rápidas" do WhatsApp Business

Os modelos E0–E7 estão num `.md`. O cliente vai copiar e colar do Drive no meio da conversa.
**Proposta:** no `COMO-POSTAR.md`, instrução de salvar cada modelo como resposta rápida (`/carta`,
`/valor`, `/proposta`) no WhatsApp Business — é o mesmo mecanismo de resposta rápida de qualquer CRM.

## 7. A semana zero, dia a dia

O cliente recebe 55 artes e um link. Mesmo com o `COMO-POSTAR.md`, falta o roteiro de **o que
fazer em cada dia da primeira semana**: dia 1 troca foto e bio, dia 2 publica o carrossel 1…
dia 7 fixa os seis e liga as campanhas. **Proposta:** seção "Sua primeira semana" na prévia e no
`COMO-POSTAR.md`, com 7 cards de um dia cada.

## 8. Meta de tempo declarada

Sem critério, "funcionou?" vira opinião. **Proposta:** a entrega declara a meta — primeiro lead em
7 dias, primeira reunião em 14, primeira venda em 30 — e o que fazer se não acontecer (trocar
criativo da campanha que não trouxe lead; nunca as três ao mesmo tempo).

## 9. Um placar simples

O cliente precisa ver custo por lead e reuniões marcadas sem abrir o Gerenciador. O
modelo é um placar mensal de dois números, com a tela real. **Proposta:** quando o
item 5 existir (CRM), o placar sai dele; antes disso, uma linha no `COMO-POSTAR.md` ensinando a
ler os dois números no Gerenciador.

## 10. Gate final de "pronto para ligar"

Antes de mandar a mensagem de entrega, uma lista de 10 verificações que só passa se **tudo
funciona de verdade**: link da bio abre a agenda real · agenda grava no calendário · form do
grupo registra e abre o convite · PDF existe e abre · vídeo existe e abre · WhatsApp do cliente
responde · 3 campanhas pausadas no Gerenciador · pixel disparando · 55 artes no Drive · zero
`[A PREENCHER]` sobrando.

---

## Em que ordem atacar

Os itens **1 e 2** (o 3 já está fechado) são os que separam "entrega bonita" de "cliente vendendo": sem página viva
e sem campanha no ar, o resto é demonstração. O **4** evita que os três atrasem. Os
demais são refinamento — importantes, mas depois.

Estimativa honesta: 1 e 2 são trabalho de infraestrutura (parametrizar o que já existe), 3 é
produção de conteúdo (um dia), 4 é um documento. Dá para fechar os quatro no próximo run.
