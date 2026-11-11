# REGRAS — estilo-visual-ads (anúncio 100 % b-roll + texto de impacto)

> Leia junto com `REGRAS-GERAIS.md` (raiz do pacote). Aqui está o que é específico deste estilo.

## Onde está no kit
| A skill cita | No kit, o equivalente é |
|---|---|
| componentes de cena do estilo (`BRollOverlay`, `TextImpact`, `MechanismReveal`, `NumberReveal`, `CTAChevron`) | `kit/src/estilo/` |
| demo do estilo | `kit/src/estilo/EstiloImpactoDemo.tsx` |
| tokens de marca (cores, fontes, espaçamento, animações) | `kit/src/brand/` |
| pacote de efeitos sonoros | `kit/public/sfx/` (Pacote de Efeitos EVA) |
| análises dos anúncios de referência (`.md` e `script_clusters.json`) | `conhecimento/analysis/` (neste pacote) |
| quadros extraídos (`frames-4fps/…`), relatório HTML e a análise dos produtos do autor (`novos-ads/…`) | **não vão no pacote** (pesados/pessoais). Gere os seus com a skill `map-editing-style` |

## Paleta com intenção
- **Branco** = contexto/neutro · **vermelho** = problema, ruptura, negação · **verde** = solução, resultado, CTA · **creme** = apoio/subtítulo.
- **Uma cor de destaque por bloco, no máximo duas no anúncio inteiro.**
- **Não faça** duas cenas seguidas só com texto branco — o vídeo perde hierarquia. Por quê: a cor é o que diz ao olho "isto é o problema / isto é a saída".

## Fundo nunca é "slide"
- **Não faça** duas ou mais cenas seguidas com fundo preto + texto. Cada cena de texto leva um destes: b-roll com overlay escuro (preferido), ícone grande (80–120 px) do conceito, ou degradê de duas cores.
- Todo vídeo de fundo em tela cheia tem **zoom lento** (`scale 1.0 → 1.09`, com `overflow: hidden` no pai). Sem isso parece foto com texto.
- **Pilha obrigatória** de cena com vídeo: vídeo com zoom → overlay escuro sólido (~0,6) → degradê na base (transparente → preto) → scanlines (~0,65). O overlay escurece, o degradê suaviza a base; os dois são necessários.
- Mesmo b-roll em cenas vizinhas: a segunda continua de onde a primeira parou (`startFrom`), para não "pular".

## Texto
- Camada de texto = `<div style={{position:"absolute", top:0, bottom:0, left:PAD, right:PAD}}>`. **Não use `AbsoluteFill` como camada de texto** — ele ignora o padding do pai e o texto vai até a borda.
- Texto em `<span>` com `maxWidth: "100%"` e `textAlign: "center"`, sem `<div>` extra em volta.
- Rodapé morto dinâmico por cena (`Math.round(height * 0.12)`), preenchido com um bloco preto separado; a camada de texto recebe `paddingBottom: DEAD + 36`.
- Molas (spring) de entrada: `from 1.28–1.5 → 1`. Suave: `damping 13, stiffness 220, mass 0.65`; agressiva: `damping 8, stiffness 400, mass 0.4`. **Não use `from: 2.5`** — o texto nasce gigante e parece bug.
- Animação central (telas, números, faturas) renderiza **depois** de scanlines/vinheta/degradê — senão o degradê cobre a parte de baixo dela.

## B-roll
- Antes de codar: leia a copy, marque os 3–5 momentos visuais principais, defina **uma busca específica** para cada um e baixe os clipes **antes** de abrir o código. Pelo menos 2 clipes novos por vídeo.
- **B-roll combina com o tom da frase.** Narração "destrutiva" (fim de era, morte de mercado) pede tela rachada, dinheiro queimando, glitch — não gente sorrindo no escritório.
- **Olhe cada clipe numa tira de 6 quadros** antes de usar: `ffmpeg -i clipe.mp4 -vf "fps=1/1.6,scale=170:-1,tile=6x1" -frames:v 1 tira.jpg`. Um quadro só não basta: o nome do arquivo mente (um "money.mp4" pode ser chroma key verde; um "calendar" pode ser tema de ciclo menstrual) e **logo de marca** (streaming, refrigerante) pode entrar no meio do clipe — marca de terceiro é reprovação quase certa no gerenciador de anúncios. Expressão errada também reprova (pessoa sorrindo numa fala de frustração).
- Coloque na lista de proibidos do kit (`kit/config/broll_proibidos.txt`) todo clipe que você reprovou, para ele não voltar.

## Cada vídeo tem uma ideia visual própria
- Pelo menos **um elemento visual novo** criado para o claim central da copy (ex.: "virou um botão" → botão animado com toque; "revelação" → zoom dramático). Derivado do significado, não do estilo. Sem isso o vídeo parece reuso de peça velha.

## CTA
- End card de **8–10 s depois da última palavra** (≈ 240–300 quadros a 30 fps), com a trilha cobrindo tudo. Botão com pulso contínuo e um tique sutil a cada ~30 quadros.
- Fundo do CTA: um olhar fixo para a câmera funciona bem (pressão + intimidade no fechamento).
