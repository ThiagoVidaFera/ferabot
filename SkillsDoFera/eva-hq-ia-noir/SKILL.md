---
name: eva-hq-ia-noir
description: "Anúncio em vídeo 'HQ-IA noir narrado': graphic novel gerada por IA cena a cena, locutor em off, personagem-guia, teses em tela escura, CTA com seta dupla; variante 'trailer de mundo'. Estilo, não prova: tela e número dentro dele são reais. Triggers: anúncio em HQ, graphic novel com IA."
---

> **Origem e adaptação (FeraBot).**
> - Skill do pacote "Sistema de Criativos FERA" (créditos no LEIA-ME desta pasta). No FeraBot ela entra como **direção
>   criativa**: roteiro, cena, regras e checklists.
> - Onde citar `bin/motor-video.py`, `motor-de-video`, `remotion-marca`, `kit/` ou `acervo/`: esses caminhos não existem
>   aqui. Use o que você tem: `ScriptsFera/render.py`, `ScriptsFera/narrar.py` e FFmpeg, ou o motor de vídeo que preferir
>   (HyperFrames ou Remotion, se estiver instalado).
> - Cores, fontes e marcas dos exemplos (MCT, MLC/Lead Certo, FERA, ciano #00f0ff, Sora) são do autor original: aqui valem
>   as do seu `perfil.json`.
> - Prova e número: número sem origem fica fora da peça. Nunca inventar print, depoimento ou resultado. Selo SIMULAÇÃO
>   não libera peça pública.
> - Copy de venda passa pelo checklist A/B/C/D do roteador; mídia gerada por IA tem o custo dito antes de gastar crédito.

# eva-hq-ia-noir — a tese contada como graphic novel


**De onde vem:** estilo dominante da Estilo Visual de Anúncio (EVA) em 12/10/2026 — 6 criativos, 42 anúncios (47 % dos IDs visíveis);
somado à variante trailer (3 criativos, 27 anúncios) = **69 de 90 anúncios (77 %)** [observado, `05-ANALISE/classificacao.md` §2].
Copiamos a **gramática**, nunca o texto, a oferta, a prova, o mascote ou a trilha deles.

## Por que a variante "trailer de mundo" está fundida aqui
A pasta de estudo separa "ficção de mundo" (15, 16, 20) como estilo próprio. Aqui ela é **variante B** desta skill porque:
(1) usa o **mesmo kit de imagem** — mesmo traço HQ, mesma paleta, mesma legenda, mesmo personagem-guia (15 @ 48 s) [observado];
(2) roda na **mesma campanha e destino** (C4A → série) [observado, `00-MAPA/mapa.md`]; (3) só muda o **roteiro**
(3ª pessoa, produto escondido até o payoff, 50–75 s). Uma skill = um pipeline de imagem; duas estruturas de roteiro.
Manter separado duplicaria prompts, paleta e checklist. Receitas originais continuam em `estilos/ficcao-de-mundo/`.

## Quando usar
- Anúncio **frio** que defende uma **tese** (por que o jeito comum falha) para produto próprio: FERA, MCT, MLC.
- **FERA**: escala sem rosto — o autor NUNCA aparece em criativo de cliente nem precisa aparecer aqui (personagem-guia próprio).
- Quando a página de destino / VSL / série vai usar o **mesmo universo visual** (anúncio = pedaço da página) [inferido, ME2 do `dna-2026-10.md`].
- Variante B (trailer): atenção fria **sem promessa**, público cético e saturado.

## Quando NÃO usar
- A prova cabe em 30 s e é a própria tela → `eva-pov-produto` ou `painel-do-comprador-na-cena` direto.
- Remarketing → `eva-remarketing-escassez`. Demonstração por profissão → `eva-anuncio-dentro-do-anuncio`.
- Sem ficha de personagem aprovada (`ficha-de-personagem`): o estilo depende de consistência; faça a ficha antes.
- Peça com o autor falando em câmera → receita talking-head v2 (outra linguagem; não misturar).

## Estrutura de roteiro
### A — Manifesto/tese (60–110 s; espinha CRIATIVO-12, 99,7 s)
| Tempo | Bloco | Regra | Evidência |
|---|---|---|---|
| 0–5 s | Gancho: pergunta ou número que o comprador reconhece; **nunca a marca** | 1 frase = 1 cena literal | 12 @ 0–3,6; 13 @ 0; 18 @ 0–5 [observado] |
| 5–15 s | Identificação: o comprador e o problema, em close | close ¾, Ken Burns | 12 @ 3,7–11 [observado] |
| 1–3 s | **Tela escura de tese**: frase fina + 1 palavra em destaque | 1 por tese | 12 @ 11,2–15,5 [observado] |
| 15–55 s | Causas/regras, uma cena por frase | planos 2–5 s com push-in | 12 @ 15–47; 17 @ 36–71 [observado] |
| ~55–62 s | Virada pessoal curta com o personagem-guia ("passei anos… e fiz") | plano parado, gesto mínimo | 12 @ 55,7–61,2 [observado] |
| 60–75 s | **Prova NOSSA**: a tela real (painel, criativo gerado) emoldurada no traço HQ, número comparável em `colors.brandGreen` | a IA nunca desenha números | eles usam cards de "amostra" sem número (12 @ 61–69, "prova fraca") [observado]; trocar é a nossa vantagem [inferido] |
| 75–88 s | Contraste com o jeito antigo (1 tela escura) + promessa-síntese em close | — | 12 @ 72–89,6 [observado] |
| últimos 4–9 s | CTA visual sobre o personagem-guia | ver CTA | 12 @ 95,3–99,7; 18 @ 96–104 [observado] |

### B — Trailer de mundo (50–75 s; espinha CRIATIVO-15, 54,6 s)
| Tempo | Bloco | Evidência |
|---|---|---|
| 0–4 s | Premissa impossível + consequência humana numa frase ("Num mundo onde…"), narrador de trailer em 3ª pessoa | 15 @ 0–4,2 [observado] |
| 4–27 s | 3–4 cenas de "como o mundo ficou" (~2 s cada, push-in); flashback/futuro em P&B se precisar | 15 @ 4,4–26,6 [observado] |
| 1 s | Tela escura de respiro | 15 @ 14,0–15,2 [observado] |
| 27–41 s | Virada: "até que alguém reparou num detalhe" | 15 @ 26,6–41 [observado] |
| 41–48 s | Payoff: o detalhe É o que o nosso produto mostra → **última cena = tela real** com número em verde; frase final em tela escura com 1 palavra em ciano | 15 @ 41,3–47,7 (deles: "fortuna" abstrata, sem prova) [observado]; prova real = nossa troca [inferido] |
| 48–55 s | CTA **sem fala** em cartão de player (play ciano + barra de progresso andando) "Veja como" + "TOQUE EM SAIBA MAIS" | 15 @ 48–54,5 [observado] |
O produto não é citado antes do payoff (15 tem 0 "você" na transcrição) [observado].

## Direção
- **Um personagem-guia nosso** em todo o vídeo e na página (ficha em `ficha-de-personagem`; na FERA, os assistentes aprovados). Nunca mascote de terceiro, nunca cabeça de câmera [observado que eles usam em 18 criativos; proibido para nós].
- **1 frase falada = 1 cena literal**: a imagem ilustra exatamente o que é dito (dinheiro "pago por ele" = mão entregando; "sobe o anúncio" = pessoa no painel) [observado, 17 @ 36–56].
- Telas de software aparecem **dentro** do traço HQ (eles: Google Ads/Notion desenhados, 17 @ 52–56) [observado]. Nós: tela virada para a câmera NUNCA vazia/branca — ou **print real** composto no Remotion (mapeado em perspectiva, legível), ou painel escuro abstrato gerado (gráfico/linhas, sem letras). Luz: só a face da tela emite luz; tampa/costas do aparelho escuras (regra do autor 15/10).
- Personagem-guia em poses repetíveis: sentado em poltrona, de costas para a janela, escrevendo, diante de um tabuleiro [observado, 12 @ 20/69,7/89,9/95,3] — crie as 4 poses na ficha.

## Imagem — prompts de geração (imagem e vídeo IA)
> Pipeline completo de imagem → vídeo com IA (âncora do personagem, modelo i2v por tipo de plano, custo, portões): skill `eva-ia-plus`.

**Bloco de estilo fixo (colar em toda cena):**
```
graphic novel panel, noir comic book art, bold black ink outlines, flat cel shading, halftone dot texture and
film grain, high contrast chiaroscuro. Limited palette ONLY: near-black #020408 shadows, deep navy #0d1a33 and
#1a2e55 midtones, single cyan #00f0ff key light / rim light / screen glow, off-white #f8fafc highlights,
mint green #34d399 only on positive numbers or success objects. Vertical 9:16 composition, subject in the central
square (y 420–1500 of 1920), empty space at top 180 px and bottom 250 px.
NEGATIVE: text, letters, words, numbers, captions, logos, watermark, purple, violet, lilac, magenta, pink,
orange or teal cast, photorealistic skin, 3D render look, anime style, extra fingers.
```
**Cena:** `[enquadramento: close ¾ | plano médio | plano aberto | detalhe de mãos] of [personagem da ficha: descrição fixa
+ roupa fixa] [ação literal da frase], [cenário], [luz: cyan monitor glow | cyan rim light from window | single desk lamp cool white]`.
- Enquadramentos que o estilo usa: close ¾ cansado, plano aberto de cômodo, detalhe de mãos/objeto, personagem de costas
  diante de janela/painel, close de olhos com faixa de luz (antes do CTA, 12 @ 86,3; 15 @ 41,3) [observado].
- Paleta deles (teal #2E8B83 + laranja #E8873A) **não** entra; a nossa é navy + ciano, sem laranja [decisão de IDV].
- **Variante B:** mesmo bloco; futuro/flashback = `black and white, desaturated, only cyan accents` (eles usam P&B, 15 @ 4,4–14) [observado].
- **Animar (vídeo IA)**, 2–5 s por plano: `slow push-in, minimal motion: [piscar | fumaça | braço que fecha o notebook | página que vira],
  camera locked, keep line art and palette, no new objects, no text`. Mais barato e quase igual: **Ken Burns no Remotion** (scale 1,00→1,08 em 3 s).
  Use IA só nos planos com ação (fechar notebook 12 @ 7,8; gesto do guia 12 @ 55,7).
- Gerar: `higgsfield-generate` / `muapi-nano-banana` / `imagen` (o que estiver com crédito). Confira o crédito antes de lote; nada pago sem aviso.
- Consistência: mesma seed/referência de personagem; folha de contato numerada de todas as cenas **antes** de animar.

## Legenda e tipografia
- Legenda: **Roboto 700 minúscula branca, 2–4 palavras por vez, 1 linha, centro a ~55–58 % da altura (y ≈ 1060–1110 px)**,
  sem caixa nem máscara [observado, 12 @ 0–3,6; 17 @ 36–71]. Nossa adição: sombra 0 2 8 px 60 % preto para ler sobre cena clara.
- Telas de tese: fundo `colors.darkbase`, frase em Roboto 300 `colors.textSecondary`, 2 linhas, + **1 palavra** em Sora 800 caixa alta
  `colors.brandCyan` (eles: vermelho/amarelo, 12 @ 13,9; 18 @ 0–5) [observado → cor trocada]. No máximo 1 palavra em cor por tela.
- Cards de amostra (eles: cartões sobre branco trocando ~1/s, 12 @ 61–69) → nós: cartões `colors.cardBg` borda 1 px `colors.border`,
  cantos 20–24 px, sobre `colors.darkbase`, trocando a cada 0,8–1,2 s, só com tela/criativo **real**.
- Tokens sempre por `colors.*` de `@brand`; grade de fundo 40 px a 6 % só nas telas de tese.

## Ritmo de cortes (medido)
| Trecho | Deles (cortes/s) | Fazer |
|---|---|---|
| Gancho 0–5 s | 0,6–0,8 (manifesto); ~1,0 (trailer) | 3–4 planos nos 5 s |
| Corpo | 0,3–0,5 (planos 2–5 s) | push-in contínuo; corte seco entre cenas |
| Últimos 15 s | 0,13–0,2 | planos longos; CTA parado |
Fonte: sync 12–19 corrigidos [observado]. 1 fade para preto por bloco (12 @ 41,8–47) [observado]. Preto total 2–11 % do vídeo [observado].
Dissolve é permitido (regra "nunca dissolve" caiu) [observado, comparativo #24].

## Som
- Locutor em off contínuo; ninguém fala em câmera (27/27 vídeos) [observado].
- **Cama sob a voz em 86–96 % dos segundos com fala; voz só 3–8 dB acima (mediana)** [observado, stems 12, 17, 19].
  Nossa regra: **voz 12–15 dB acima no gancho, 8–10 dB no corpo**; deles a 3 dB fica no limite da inteligibilidade [inferido].
  Voz em −14 LUFS no master.
- Cama cai 0,5–1 s antes de cada tela de tese (respiro) e volta na frase seguinte [inferido do padrão de pausa, 12 @ 11–15].
- Música **sobe sozinha só depois do CTA**: +6 dB, 4–7 s [observado, 12 @ 95–99; 15 @ 48–54].
- SFX: whoosh grave na entrada da tela de tese; "click" de play no cartão de player (variante B). Discretos, abaixo da voz.
- **Trilha só da nossa biblioteca licenciada** (`acervo/sons/musicas` ou biblioteca de música licenciada).
  Eles usam faixas comerciais e trechos de série (Shazam: tema de série no 12 @ 1–13) [observado, `trilha.md`] — **proibido** para nós.

## CTA
- Últimos 4–9 s, sem fala ou com a fala terminando: "TOQUE EM" branco + "SAIBA MAIS" `colors.brandCyan`, Sora 800 caixa alta, 2 linhas,
  **seta dupla ▼▼** pulsando (loop de 30 quadros) logo acima da zona de 250 px do botão [observado, regra #26 manteve].
- Variante B: cartão de player `colors.cardBg` + borda `colors.border` + play ciano + barra de progresso andando, "Veja como" [observado, 15 @ 48].
- Orgânico (par): mesma peça com CTA "Digite [PALAVRA]" falado e escrito — nunca "toque no botão" no feed (erro deles, `redes/analise.md` §4) [observado].

## Tradução para a nossa IDV
| Deles | Nosso |
|---|---|
| teal #2E8B83 + laranja #E8873A | navy `colors.cardBg`/`colors.border` + luz ciano `colors.brandCyan` |
| vermelho/amarelo de ênfase | 1 palavra `colors.brandCyan`; número positivo `colors.brandGreen` |
| mascote cabeça-de-câmera | personagem-guia da nossa ficha (FERA: assistentes aprovados) |
| cards de amostra sem número | cartões com tela/criativo real + rótulo de fonte e período |
| CTA amarelo | "SAIBA MAIS" ciano |
| trechos de série/filme | cena IA nossa ou motion próprio |
Proibido roxo, lilás, violeta, magenta.

## Exemplos (referência de estilo, uso interno)
- Manifesto: `fontes/ESTILO-VISUAL-DE-ANUNCIO-EVA/ADS-2026-10/ads/CRIATIVO-12-C4A-SERIE-d566e9/` (sync.md, contato-01..03), `CRIATIVO-13-…`, `CRIATIVO-14-…`
- Aula-desafio: `ads/CRIATIVO-17-C4B-3PERGUNTAS-467e11/` (contato-02 = melhor folha do traço), `CRIATIVO-18-…`, `CRIATIVO-19-…`
- Trailer: `ads/CRIATIVO-15-C4A-SERIE-7924a4/` (contato-01), `CRIATIVO-16-C4A-SERIE-a52817/`, pôster `CRIATIVO-20-…`
- Receitas: `05-ANALISE/estilos/hq-ia-noir-narrado/` e `05-ANALISE/estilos/ficcao-de-mundo/` (receita-visual.json, mapa-de-cenas.csv, prompt-de-recriacao.txt)
- Mesmo universo na página: `landing/serie/vsl/SERIE-RESUMO.md`

## Prompt-modelo
```
Produza um anúncio no estilo HQ-IA noir (variante [A manifesto | B trailer de mundo]) para [destino], formato [formato],
vendendo [oferta]. Antes: rode bin/motor-video.py e me avise a decisão em 1 linha.
Personagem-guia: [ficha aprovada em ...]. Roteiro em unidades "1 frase = 1 cena", duração alvo [60–100 s | 50–75 s],
seguindo a tabela de tempos da skill eva-hq-ia-noir. Prova: [print/gravação real em assets/provas/...] composta
dentro de um monitor desenhado, número em verde, fonte e período abaixo. Imagens com o bloco de estilo fixo da skill
(navy + ciano, sem texto na imagem, sem roxo/laranja). Legenda Roboto 700 minúscula 2–4 palavras a 55 % da altura;
telas de tese em darkbase com 1 palavra ciano. Cama licenciada sob a voz (voz 12–15 dB acima no gancho, 8–10 no corpo),
música sobe só depois do CTA. CTA "TOQUE EM / SAIBA MAIS" + seta dupla. Só 9:16. Primeiro: roteiro + folha de contato
das cenas geradas para eu aprovar; depois amostra de 10–15 s do trecho da prova.
```

## Checklist da amostra
- [ ] Gancho é pergunta/número/premissa, sem marca, entendível no mudo
- [ ] Toda cena ilustra literalmente a frase; personagem igual em todas (folha numerada conferida)
- [ ] Nenhuma letra/número gerado por IA dentro da imagem; números só do print real
- [ ] Prova nossa na tela, com fonte e período (ou selo SIMULAÇÃO)
- [ ] Paleta navy + ciano; zero roxo/laranja/teal; tokens `colors.*`
- [ ] Legenda 2–4 palavras a ~55 %; ≤ 1 palavra colorida por tela de tese
- [ ] Ritmo: gancho 0,6–1,0 corte/s; corpo planos 2–5 s; fim ≥ 0,13
- [ ] Voz 12–15 dB acima da cama no gancho; música só sobe após o CTA; trilha licenciada
- [ ] CTA com seta dupla fora dos 250 px de baixo; versão orgânica com "Digite X"
- [ ] Sem costura seca (`python3 bin/detectar-costuras.py VIDEO.mp4`)

## Armadilhas
- Personagem que muda de rosto entre cenas: o estilo morre. Ficha + referência fixa antes de gerar.
- IA escrevendo na imagem (placas, telas com texto falso): sempre no NEGATIVE; tela real entra no Remotion.
- Copiar a "prova fraca" deles (cards sem número, "100 milhões" falado): o nosso diferencial é a tela do comprador.
- Herdar o teal-laranja "porque fica bonito": sai com cara de Estilo Visual de Anúncio (EVA).
- Trailer que nunca chega ao produto: o payoff tem de cair na tela real; senão é só entretenimento.
- Voz enterrada na trilha (3 dB): no celular sem fone ninguém entende.
- Usar música comercial ou trecho de série: risco de bloqueio e de direitos.


## ⛔ Arquivo final sem rótulo interno de produção (regra do autor, 14/10/2026)
Na hora de renderizar o ARQUIVO FINAL, retirar todo rótulo/numeração de controle da produção: etiquetas tipo "PL 001", códigos de cena/beat (B042, AD21-07), ids de take, nomes de plano, contadores. Esses números são só do processo interno; o público final não pode vê-los.
Fica só o que faz parte da CENA (texto que existe no mundo da história: tela do Gerenciador, comentário real, cardápio, placa, selo do anúncio dentro do anúncio) e os selos legais ("exemplo · números ilustrativos").
Rascunho/prévia pode ter rótulo; o render final, não. Conferir na folha de contato antes de entregar.
