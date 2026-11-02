---
name: carrossel-tela-viva
description: Carrossel de feed em card de tweet branco com uma tela animada em vídeo em cada slide (1080x1350, cena de 12 s). Use em "carrossel com vídeo", "tela animada", "carrossel de agentes", "se eu fosse X, esses são os agentes", "carrossel que mostra o processo". Só cenas próprias com dados de exemplo. CTA por palavra-chave.
---

# Carrossel de tela viva

Fera, esse formato prende a atenção porque cada slide mostra uma cena acontecendo: um card de tweet branco e parado, com uma caixa em que a tela conta uma história de 12 segundos.

A qualidade vem de três coisas: um título que descreve uma cena filmável, uma tela que encena esse título e o motor, que garante o acabamento. O motor cuida só da terceira. As outras duas são o trabalho de verdade.

## Quando usar (e quando usar outro formato)

- Use quando o seu processo ou o seu método pode ser mostrado em tela (ficha, página, conversa, folha, painel).
- Carrossel educativo de texto e lista: use `squad-carrossel-fera`.
- Anúncio estático: use `anuncios-de-ouro` ou `squad-anuncios-estaticos`.
- Story, caixinha, slides de aula: têm skills próprias.
- Vídeo de terceiros dentro da caixa: não faz parte desta skill. Só cenas próprias.

## Pré-requisitos

Ler `perfil.json` da raiz do FeraBot: `nome`, `handle_instagram`, `cor_primaria`, `cor_secundaria`, `produto`. Campos opcionais: `foto` (caminho de uma foto sua, senão o card usa um círculo com as suas iniciais) e `verificado: true` (só se o seu perfil tem o selo de verdade).

Dependências: Python, Playwright e Pillow (o motor instala sozinho na primeira vez, ~1 min) e FFmpeg. Se faltar o FFmpeg, rode no terminal `winget install Gyan.FFmpeg`, feche e abra o terminal e tente de novo.

Antes de escrever, leia `references/copy.md` e `references/cenas.md`.

## Fluxo

```
[01] Briefing -> [02] Título e cena aprovados -> [03] Render -> [04] Checklist -> [05] Entrega
```

**Nunca renderizar antes da aprovação do fera.**

### [01] Briefing

Perguntar, sem enrolar:
1. Tema e os 4 a 6 itens (ou "pode escolher", e você sugere pelo nicho do perfil).
2. Palavra-chave do CTA. Ela precisa levar a algo que já existe e funciona, com a automação de comentário para DM ligada. Se ainda não existe, ajude o fera a criar a automação antes de publicar.
3. Conta que fala em primeira pessoa ("eu") ou institucional.

### [02] Título e cena aprovados

Mostrar em texto, antes de renderizar:
- A copy, slide a slide.
- A legenda.
- Uma frase por slide descrevendo a cena da tela.

Passar a copy pelo checklist A/B/C/D da skill `copy-premissa-cliente` (se estiver instalada) e dizer onde ficou fraca. Só seguir com o OK explícito do fera.

### [03] Render

1. Crie a pasta `output/conteudo-e-anuncios/AAAA-MM-DD/carrossel-<tema>/`.
2. Copie `exemplo/peca.py` e `exemplo/cenas.py` para ela. Troque a copy, a legenda e as telas. Em `cenas.py`, o caminho do `sys.path` precisa apontar para a pasta `motor/` desta skill (o motor também a coloca no caminho, então o import funciona de qualquer jeito).
3. Ajuste uma cena de cada vez, que é bem mais rápido:
   ```
   python SkillsDoFera/carrossel-tela-viva/motor/build.py <pasta> --so 1
   ```
4. Com todas certas, rode sem `--so`. Leva alguns minutos. Para um teste rápido use `--fps 12`, mas o final sai sempre com 30.

O motor para sozinho se o card passar de 1350 px, se algum texto sair da caixa ou se algum texto da tela ficar abaixo de 20 px. Corte a copy, não reduza a fonte.

Saída em `<pasta>/saida/`: `01.mp4` ... `NN.mp4` (um vídeo por slide), o slide final em `.jpg`, `legenda.txt`, `texto-puro.txt`, `_contato.jpg`, `_quadro0.jpg` e `_check_NN.jpg`.

### [04] Checklist antes de entregar

Abrir `saida/_contato.jpg` e `saida/_quadro0.jpg`. Em cada slide:

- [ ] O primeiro quadro já mostra a tela montada, sem área vazia nem valor digitado pela metade?
- [ ] O último quadro fecha a cena, sem texto provisório sobrando?
- [ ] A tela encena o que o título diz?
- [ ] Dá para ler a tela com a imagem pequena?
- [ ] O visual é diferente entre os slides?
- [ ] Todo dado inventado está marcado como exemplo (crédito abaixo da caixa e na legenda)?
- [ ] Nenhum número ou resultado inventado parece prova real? Tela de exemplo mostra como funciona, nunca prova que funcionou.
- [ ] Acentos certos no quadro renderizado?

Checklist A/B/C/D da copy (elemento explícito em cada ponto):
- [ ] A, anti-preguiça: o próximo passo é um comentário só.
- [ ] B, anti-medo: o texto diz o que a pessoa recebe e que não precisa programar nem contratar ninguém.
- [ ] C, anti-procrastinação: motivo claro para comentar agora.
- [ ] D, anti-problema-futuro: o que continua dando trabalho se ela deixar para depois.

Assista a pelo menos um MP4 inteiro. Quadros soltos não mostram o movimento.

### [05] Entrega

1. A pasta da peça já fica em `output/conteudo-e-anuncios/<data>/`. O `texto-puro.txt` (slides e legenda sem formatação) já foi gerado pelo motor, para copiar e colar.
2. Registrar a entrega, sem comentar no chat:
   ```
   python ScriptsFera/metas-api.py entrega add "carrossel-tela-viva" "Carrossel de tela viva: <tema>" --link "<pasta>"
   ```
3. Mostrar ao fera o caminho completo da pasta.
4. Publicação é manual: no Meta Business Suite ou no app do Instagram, novo post em carrossel, os vídeos `01.mp4` a `NN.mp4` e o slide final `.jpg`, nessa ordem, com a legenda do `texto-puro.txt`. Depois, teste a palavra-chave comentando de outra conta.

## CTA

Último slide: pergunta de escolha, a palavra-chave em negrito, o que a pessoa recebe ao comentar, o que você faz por ela (passo a passo, junto com ela) e "E salva esse post". Uma palavra por post. A legenda repete só esse pedido.

## Regras de prova

- Peça pública só com prova real. Cenário hipotético só se a própria peça disser que é hipotético ("Se eu...", crédito "Dados de exemplo").
- Nada de cliente real, print alterado ou número que pareça resultado seu.
- Preço, prazo, vaga e número de cliente que só você tem: pergunte, nunca invente.
- Só cenas desenhadas pelo motor. Sem vídeo de terceiros e sem foto de pessoa real que não seja sua.

## Canvas

1080x1350, sem zona morta, só neste formato.
