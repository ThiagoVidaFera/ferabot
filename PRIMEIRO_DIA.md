# Ferabot — Guia do Primeiro Dia

Do zero até a primeira peça pronta e a sua meta no painel. Leva cerca de 20 minutos.

---

## Antes de começar

Você precisa ter instalado:

- **Claude Code** — o aplicativo onde o Ferabot roda → https://claude.ai/code
- **Python 3.10 ou mais novo** → https://python.org/downloads
  (na instalação, **marque "Add Python to PATH"**)

Se instalou pelo comando `/instale`, isso já foi resolvido pra você.

---

## Passo 1 — Instalar (uma vez só)

1. Abra a pasta do Ferabot
2. Dê **duplo-clique** em `instalar.py` (se perguntar o programa, escolha Python)
3. São 4 etapas: ambiente → **seu perfil** → **sua meta** → instalação dos FeraBots

A parte da meta é a mais importante. Você vai dizer quanto quer faturar por mês e quanto custa o
que você vende — e o sistema te mostra a conta na hora:

```
R$ 10.000 ÷ ticket de R$ 2.500 = 4 clientes por mês
4 clientes ÷ 4 semanas = 1 venda por semana
```

**É esse número que o Ferabot vai cobrar de você.** Não os 10 mil.

No fim, o **Painel do Operador** abre no navegador. Ele tem duas colunas:

- **Pronto e no ar** — o que os FeraBots construíram. Se preenche sozinha.
- **Só anda se você andar** — gravar, publicar, responder lead. Essa é sua, e não se preenche nunca.

---

## Passo 2 — Abrir o Ferabot

1. Duplo-clique em `ABRIR_FERABOT.bat`
2. O Claude Code abre na pasta certa

---

## Passo 3 — Um comando só: `/fera`

Digite `/fera` no chat e converse. É o único comando que você precisa decorar.

- Chegou com dúvida ou travado → ele mentora.
- Pediu uma peça ("faz minha proposta", "monta o anúncio") → ele chama o FeraBot certo por baixo.

**Missão do primeiro dia:** sair com UMA peça real pronta. Sugestão — digite:

> /fera quero fechar minha primeira venda da semana. Monta a proposta do meu serviço.

Regra de ouro: ele mostra a copy ANTES de gerar a arte. Leia e aprove (ou mande mexer). Nunca
aprove sem ler — a peça sai com a sua cara e o seu nome.

---

## Os 6 FeraBots (o /fera chama sozinho, mas dá pra chamar direto)

| Você quer | Comando direto |
|---|---|
| Saber como está a meta, o que fazer hoje, relatório | `/copiloto-de-gestao` |
| Proposta em PDF pra mandar pro cliente | `/propostas` |
| Landing, página de venda, quiz | `/paginas-e-quiz` |
| Anúncio, carrossel, story, post, campanha | `/conteudo-e-anuncios` |
| Roteiro, vídeo, YouTube, slides | `/roteiros-e-oratoria` |
| Leads, disparo de WhatsApp, comentário → DM | `/crm-de-leads` |
| Criar um agente novo do zero (qualquer área) | `/criar-ferabot` |

---

## Chaves de API (opcional, quando quiser)

Sem chave nenhuma o Ferabot já produz propostas, páginas, anúncios, carrosséis, roteiros e vídeo
narrado. As chaves (todas **suas**, das suas contas) só automatizam o último passo — publicar
página, subir campanha, subir vídeo, gerar imagem com IA.

Quando quiser: `python SetupFera/setup_chaves.py` · guia de cada chave em `API_SETUP.md`.

---

## O dia a dia (o ritmo que funciona)

1. Abrir com `/fera` — ele te diz quanto falta pra meta e qual o gargalo.
2. Fazer O gargalo primeiro (geralmente: responder leads parados).
3. Produzir a peça do dia com o FeraBot certo.
4. Registrar o que VOCÊ fez: "gravei 2 vídeos", "fiz a call", "fechei uma venda de 2500".
5. Olhar o painel: `python ScriptsFera/metas-api.py painel` e abrir `DashboardFera/index.html`.

O Ferabot constrói as peças e cobra o caminho. Quem grava, publica, responde e vende é você.
É assim que a meta sai do papel.
