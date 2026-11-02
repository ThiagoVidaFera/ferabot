# Como desenhar as telas

É nas telas que este formato ganha ou perde. Referência: `exemplo/cenas.py`, 4 telas de exemplo com dados fictícios.

## Cada tela conta uma cena

Três tempos em 12 segundos:

1. **Chega algo:** uma transcrição, um áudio, uma resposta.
2. **O agente trabalha:** linhas se preenchem, barras crescem, trechos acendem.
3. **Fecha com um resultado visível:** um carimbo (PRONTA, NO AR), um aviso, a frase final.

Se a tela só "aparece aos poucos" sem esse fecho, é enfeite. A pessoa precisa conseguir dizer o que aconteceu.

A tela mostra o que o título do slide promete, sem contradizer nem acrescentar outra ideia.

## Visual próprio por item

Mude a paleta e o tipo de interface a cada slide: painel escuro, página no celular, formulário, WhatsApp, folha com faixa de obra. Se todas parecerem o mesmo dashboard, o carrossel vira uma tela só repetida. Isso também fica mais fácil de ler no mosaico final.

A paleta respeita o dono da peça. O card fica branco em qualquer perfil. As telas podem usar `var(--p)` e `var(--s)`, que são a `cor_primaria` e a `cor_secundaria` do `perfil.json`.

## Legibilidade

A caixa tem 930×600 e será vista com cerca de 36% desse tamanho no celular. Texto importante com 24 px ou mais, e nada abaixo de 20 px. Corte conteúdo antes de reduzir a fonte. Toda tela tem respiro e poucos elementos.

## O kit de animação

Os atributos estão em `motor/timeline.py`. Na prática:

```html
<div data-in="1.6">entra deslizando no segundo 1,6</div>
<div data-type="0.6,1.4">digita a partir de 0,6 s, durante 1,4 s</div>
<div data-bar="1,7,75"></div>                 <!-- barra de 0 a 75% -->
<span data-count="1,7,9">0</span>             <!-- conta até 9 -->
<span class="mk" data-hl="1.2">trecho</span>  <!-- marca-texto -->
<div class="stamp" data-stamp="9">PRONTA</div>
```

Tudo depende de `window.seek(t)`, nunca de relógio ou transição CSS. Assim todo render sai igual.

## Tempo

- Termine a animação até o segundo 10 da timeline, para sobrar tempo de leitura na tela completa.
- Defina `INICIO` em `peca.py` para o primeiro quadro já mostrar a tela montada. O vídeo parte desse ponto e estica o resto da timeline por 12 s, então ele **desacelera**: com `INICIO` 3, os 9 s restantes tocam a 75% da velocidade. Não passe de uns 3,5 s, ou a ação acaba cedo e a tela fica parada no fim.
- **`INICIO` sozinho não resolve capa vazia.** Nos dois testes, 4 de 5 telas saíram com o quadro 0 pobre mesmo com `INICIO` de 2 a 3 s. O que resolve é projetar a tela para que a **estrutura exista desde o começo** (rótulos, perguntas, caixa tracejada, rodapé, cartões) e só os **valores e o estado** animem (marcas de conferido, barras, carimbos, números).
- Em quase todo carrossel, a primeira tela é a capa no feed e no grid do perfil. Ela merece o melhor quadro.

## Erros que já aconteceram

- **Tela vazia no quadro 0:** a capa do post sai branca. Corrija com `INICIO`.
- **Texto provisório que fica:** um "Respondendo…" continuou na tela depois do resultado. Olhe sempre o último quadro.
- **Emoji ou seta sozinhos numa linha:** cole com `&nbsp;` na última palavra.
- **Botão quebrando em duas linhas:** encurte o texto.
- **Mosaico cortando telas:** o motor já monta sem corte. Não recorte à mão.
- **Linha de varredura no quadro 0:** a barra do `data-scan` passando sobre o texto na capa parece texto riscado. Ou comece a varredura depois do `INICIO`, ou não use.
- **Valor digitado pela metade na capa:** "R$ 7" parece um dado real. Valor que digita ou conta só entra depois do `INICIO`, ou a estrutura mostra o valor já completo.
- **"R$" separado do número na quebra de linha:** use `&nbsp;` entre os dois.
- **Expressão partida entre linhas:** trave com `white-space:nowrap` e confira o card.
- **Contador sem milhar:** use `data-fmt="br"` junto do `data-count`.
- **Nicho regulado (saúde, finanças):** mostre processo e estrutura, nunca preço, resultado ou prazo. Valor mascarado (`R$ ••••`) mantém a estrutura.

## Dados de tela

Todo dado inventado fica marcado: crédito abaixo da caixa ("Dados de exemplo") e nome claramente fictício. Nunca use cliente real, print real alterado ou número que pareça resultado do dono. Tela de exemplo demonstra como funciona. Ela nunca prova que funcionou.

## Nomes de classe

Dê a cada tela um prefixo próprio (`.tg`, `.k`, `.w`, `.f` no exemplo). Nunca use `.t`, `.hd`, `.nm`, `.at`, `.cred` nem `p`: o card usa esses nomes e a tela bagunça o texto do slide.
