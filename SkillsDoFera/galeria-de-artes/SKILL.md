---
name: galeria-de-artes
description: Pega UMA ideia (tema ou oferta) e gera a capa dela em cada formato de carrossel do FeraBot, ou o anúncio estático da oferta nos 17 formatos de oferta direta, e monta uma galeria HTML lado a lado com ranking para o dono escolher. Triggers "galeria de artes", "capa em todos os formatos", "testa esse tema em cada formato", "galeria de anúncios", "anúncio em todos os formatos". Não publica nem agenda.
---

# Galeria de artes

Uma ideia entra. Saem as artes dela em cada formato que o FeraBot tem, e uma galeria para você escolher pelo olho,
não por palpite. Serve para descobrir **qual formato combina com o seu perfil** antes de produzir o lote inteiro.

Persona e doutrina: `SkillsDoFera/fera/references/`. Ler `perfil.json` antes de tudo (nome, @, nicho, produto, cores).

## Entradas (perguntar só o que faltar)

1. **Modo:** capas de carrossel **ou** anúncios de oferta direta.
2. **Carrossel:** o tema (um só, para comparar formato com formato) ou "temas variados" (cada formato um tema, em 4 eixos:
   dor, prova/bastidor, educativo, opinião/oferta). Sem tema dado, use temas variados.
3. **Anúncio:** a oferta: produto, para quem, promessa, prazo, link de destino. Dado que faltar vira pergunta ou
   `[FONTE OMISSA: ...]`. Nunca inventado.
4. **Formatos:** por padrão todos os do modo (`references/modelos.md` ou `references/modelos-anuncio.md`). Aceita subconjunto.

## Como rodar

1. Ler o catálogo do modo e o `perfil.json`. Confirmar com o dono a lista de formatos e o tema ou a oferta.
2. Criar o lote em `output/galeria-de-artes-AAAA-MM-DD/` e gravar um `PLANO.md` curto: modo, formatos, tema ou oferta,
   regras comuns (abaixo).
3. Produzir **um formato por vez, ou em levas de até 8 em paralelo** (agentes em segundo plano). Acima de 8 o fluxo trava por
   tempo. Cada formato segue a skill dele (a coluna "Skill" do catálogo) e grava
   `output/galeria-de-artes-AAAA-MM-DD/NN-<formato>/slide1.png` (carrossel) ou `arte.png` (anúncio) + `NOTA.md`
   com tema ou ângulo, headline, adaptações, **"Nota: X"** (de 0 a 10) e o defeito principal.
4. Quando tudo estiver pronto, montar a galeria:
   ```
   python SkillsDoFera/galeria-de-artes/scripts/galeria.py --lote galeria-de-artes-AAAA-MM-DD \
     --out output/galeria-de-artes-AAAA-MM-DD/GALERIA.html --titulo "Galeria de artes · <tema>"
   ```
   Anúncio: acrescentar `--arquivo arte.png --proporcao 4/5`. Abrir o HTML no navegador.
5. **Olhar a folha de contato antes de reportar o ranking.** As notas são autoavaliação e tendem a se comprimir em 8 e 9.
   Quem dá a nota final é o dono, olhando.
6. Entregar: o caminho absoluto completo da pasta, os 5 melhores, os 3 últimos e as pendências que precisam de decisão.

Quem atende mais de uma marca roda a galeria com uma pasta por marca e junta tudo repetindo `--conta "Nome=pasta"`.

## Regras comuns (valem para toda peça da galeria)

- Segue o método do PRÓPRIO formato (é comparação), mas **marca, paleta, vocabulário e fotos são os do dono**. Formato
  desenhado para outro perfil: trocar nome, @, avatar e cores.
- **Carrossel:** 1080×1440 PNG, zona morta de 250 px em cima e embaixo sem texto, rosto inteiro e nunca coberto. Foto clara
  pede caixa atrás do texto.
- **Anúncio:** `arte.png` 1080×1350 (feed 4:5). Story 9:16 só se pedido.
- **Fotos:** use as do dono. Foto de pessoa gerada por IA só se ele pediu, e a peça é marcada como gerada.
- **Prova e dado:** nada inventado. Número só com fonte. Personagem fictícia vem declarada na capa. Print ou tela só
  se for real, e o texto legível do print confere com a oferta (promessa de outro produto no print derruba a peça).
- **Preço nunca na arte** (nem número, nem por extenso, nem "de X por Y"). Ele mora na página. A urgência vem de prazo,
  vaga ou data **reais**, nunca de desconto inventado.
- **Anúncio, copy de resposta direta:** a arte sozinha diz para quem, o que ganha, como e em quanto tempo. A headline nomeia
  o público e promete. Um só CTA de clicar (nunca "comenta"). Antes de fechar, o checklist A/B/C/D do roteador.
- **Meta:** sem "você" acusatório sobre atributo pessoal, sem antes e depois corporal, sem promessa de ganho garantido.
  Antes de subir, conferir se a promessa do anúncio continua na página. Subir campanha é outro pedido (`meta-ads-fera`,
  com o rastreamento obrigatório).
- Não publicar e não agendar. Virar carrossel completo ou campanha é outro pedido.

## O que aprendemos nos testes reais

- **Foto forte + headline grande vence.** Capas só de texto ou só de card ficam no fim do ranking.
- A zona morta de 250 px enfraquece os formatos de "print de tela": viram cartão pequeno.
- **Os agentes convergem para o mesmo molde.** No lote de anúncios, vários formatos saíram quase idênticos porque cada um
  reaproveitou o template da oferta. O brief tem que dizer: "o layout é o do formato; a marca entra só na cor e na fonte".
- Os que mais se destacam são os que fogem do molde (declaração ousada, quadro branco, post-it nativo, manifesto).
- Falta de ativo real limita o formato: mão segurando celular, print do seu painel, foto de bastidor. **Levante esses
  ativos antes de rodar o lote.**
- Escolha pela **posição na galeria** (a ordem do ranking), não pelo número do formato. Converta antes de agir.
- Arte de oferta com compra direta não vira campanha de reunião só trocando o link: objetivo diferente pede copy nova.
- Custo: só gera imagem o formato que precisa de foto nova. Diga o preço antes de gastar crédito de qualquer chave.

## Arquivos

`references/modelos.md` (formatos de carrossel) · `references/modelos-anuncio.md` (17 formatos de anúncio de oferta direta) ·
`scripts/galeria.py` (monta a galeria).
