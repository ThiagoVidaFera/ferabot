---
name: painel-do-comprador-na-cena
description: "Captura, mascara e (se preciso) reconstrói fielmente em Remotion o painel que o comprador usa, para entrar numa cena de vídeo. Vem antes de prova-na-tela. Triggers: painel na cena, reconstruir painel, tela do comprador, mascarar print."
---

> **Origem e adaptação (FeraBot).**
> - Skill do pacote "Sistema de Criativos FCA" (créditos no LEIA-ME desta pasta). No FeraBot ela entra como **direção
>   criativa**: roteiro, cena, regras e checklists.
> - Onde citar `bin/motor-video.py`, `motor-de-video`, `remotion-marca`, `kit/` ou `acervo/`: esses caminhos não existem
>   aqui. Use o que você tem: `ScriptsFera/render.py`, `ScriptsFera/narrar.py` e FFmpeg, ou o motor de vídeo que preferir
>   (HyperFrames ou Remotion, se estiver instalado).
> - Cores, fontes e marcas dos exemplos (MCT, MLC/Lead Certo, FCA, ciano #00f0ff, Sora) são do autor original: aqui valem
>   as do seu `perfil.json`.
> - Prova e número: número sem origem fica fora da peça. Nunca inventar print, depoimento ou resultado. Selo SIMULAÇÃO
>   não libera peça pública.
> - Copy de venda passa pelo checklist A/B/C/D do roteador; mídia gerada por IA tem o custo dito antes de gastar crédito.

# painel-do-comprador-na-cena — o herói é a tela dele, não a nossa

Princípio (medido em campanhas reais): **vende o criativo que mostra o painel que o comprador abre
toda semana, com números que ele compara com os dele na hora.** Mesmo anúncio, mesma headline: com o
Gerenciador de Eventos vendeu; com um terminal (a tela de quem vende), não. Quase todas as vendas
vieram de criativos com painel.

## Quando usar
- Todo anúncio com prova disponível. Antes de qualquer outra cena de prova.
- Criativo que "não vende" e só encena o problema.

## Entradas
- Print/gravação real da tela (conta própria ou de cliente com autorização), com data.
- O número que importa e o período. Se for comparação, as duas janelas com o **mesmo tamanho de período**.
- Qual tela o comprador usa (gestor = Gerenciador de Anúncios/Eventos; dono de negócio = WhatsApp,
  agenda, planilha de vendas; corretor = conversas e visitas).

## Passo a passo
1. **Escolha a tela do comprador**, não a do vendedor (terminal, código, painel interno não vendem).
2. **Captura limpa:** resolução nativa, zoom do navegador em 100–125%, sem notificação, sem barra de
   favoritos. Grave a tela se a prova é movimento (filtro aplicado, número mudando).
3. **Mascarar:** nome de cliente, ID de conta, e-mail, telefone, token, URL com ID — tarja sólida
   `#050812` com rótulo discreto, nunca blur fraco (use `blur-preciso-aula` se for vídeo).
4. **Reconstruir em Remotion quando houver muito número** (gerador de imagem troca dígito: "0E" no lugar
   de "DE"). Reproduza layout, fonte do sistema e cores da tela original fielmente — é para o comprador
   reconhecer; os números vêm do print real. Guarde o print original em `assets/provas/` como fonte.
5. **Composição na cena** (9:16): painel grande no quadrado central (y 420–1500), ocupando 80–90% da
   largura útil; headline curta em 2 linhas **acima**, acento ciano numa palavra; **uma linha de contexto
   abaixo** do painel (período e fonte: "Gerenciador de Eventos · 01–30/09"); fundo `#020408`; sem moldura
   futurista, sem selo colorido, sem o apresentador por cima do número.
6. **Destaque um número por vez:** zoom 1,0→1,35 até a célula (spring, ~18 quadros), contorno ciano 3 px
   em volta, contador `interpolate` do valor anterior ao real (só se o real já aparece no print), segura
   ≥ 1,5 s. Próximo número só depois.
7. **Comparação justa:** mesmo trecho, mesma escala, mesmo período; rótulos neutros "ANTES"/"DEPOIS" com
   datas; nunca degradar um lado. O número pior que o comprador reconhece fica visível.
8. **Inimigo só ao lado da prova:** logos de concorrente/alternativa nunca sozinhos; sempre ao lado do
   painel que os supera.
9. **Sem dado real?** Monte exemplo construído com selo **SIMULAÇÃO** fixo no canto do painel e diga
   isso na fala ou legenda. Não use em anúncio de renda/saúde.

## Prompt-modelo
```
Cena de prova de [T1–T2] com assets/provas/[print].png (fonte real, [período]). Reconstrua o painel em
Remotion fiel ao original (layout, fonte de sistema, cores da ferramenta), números copiados do print —
confira dígito a dígito. Mascarar [campos] com tarja #050812. Painel no quadrado central, headline 2
linhas acima (Sora 800, "[palavra]" em ciano), linha de contexto abaixo: "[ferramenta] · [período]".
Destaque [número 1] e depois [número 2], um por vez, zoom + contorno ciano, 1,5 s cada. Sem o
apresentador sobre o painel. Still de cada destaque para eu conferir os números.
```

## Checklist
- [ ] É a tela que o comprador usa (ele reconhece em 1 s)
- [ ] Todo número confere com o print original (dígito a dígito no still)
- [ ] Período e fonte visíveis abaixo do painel
- [ ] Dados pessoais e IDs mascarados com tarja sólida
- [ ] Um número destacado por vez, ≥ 1,5 s cada
- [ ] Comparação com o mesmo período; nada degradado
- [ ] Sem promessa de resultado ("você vai ter X"); o painel mostra, não promete
- [ ] Sem costura seca (02/10/2026): faixa de título/selo sobre mídia em degradê ≥ 220 px, mídia encaixada com bordas esfumadas ≥ 120 px, troca de mídia na mesma cena com crossfade 8–12 quadros — regra em `remotion-marca` → "Costura sem degradê"; rodar `python3 bin/detectar-costuras.py VIDEO.mp4`

## Armadilhas
- Print do nosso terminal/código: é a nossa tela, não vende.
- Imagem gerada por IA de painel: dígitos corrompidos e cara de falso.
- Número "redondo" inventado para ficar bonito: risco de reprovação e de conta.
- Painel pequeno no canto com o apresentador grande: o comprador não lê.
- Legenda passando por cima do número.

## Saída
Componente `Painel<Ferramenta>` parametrizado (números via props, cores por `@brand`) em
`kit/src/<projeto>/` — referência já aprovada: `kit/src/mlc/MLC_IMG_PAINEL.tsx`
(painel MLC, 20/09) —, `assets/provas/` com o print original e `PROVAS.md` (fonte, período, autorização,
campos mascarados).
