---
name: eva-pov-produto
description: "Anúncio 'POV do produto': plano-sequência de celular na mão, sem rosto, mostrando a TELA real em uso enquanto a voz explica, dedo apontando o número, CTA em tela escura. Exige tela real. Triggers: POV da tela, filmar o painel com o celular, anúncio crível gravado agora."
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

# eva-pov-produto — a mão, a tela e o número


**De onde vem:** "POV do livro" — 4 criativos, 5 anúncios (C3), 70–87 s, celular na mão, só mãos e o livro físico [observado,
`classificacao.md` §2.5]. Eles não mostram resultado; nós trocamos o livro pela **tela que o comprador usa** — aposta nº 2 do estudo
(quase todas as vendas vieram de criativo com painel) [inferido, `leitura.md`].

## Quando usar
- **MCT**: celular filmando o Gerenciador de Eventos / Ads Manager, dedo no número comparável.
- **MLC/Lead Certo**: painel do Lead Certo, conversa de lead chegando (mascarada).
- **FCA**: celular do "cliente" tocando o criativo gerado; tela do `/gerar-criativo/` do pedido à entrega.
- Precisa de peça rápida (1 tomada), crível ("gravado agora") e sem rosto.

## Quando NÃO usar
- Sem tela real para mostrar → outro estilo (POV de tela inventada não existe).
- Mensagem que depende de tese/analogia longa → `eva-ensaio-noir-empresario` ou `eva-hq-ia-noir`.
- Criativo de cliente FCA: o autor não aparece — mão neutra (sem anel/relógio/tatuagem reconhecível) e voz que não seja a dele.

## Estrutura de roteiro (espinha CRIATIVO-04, 75,3 s)
| Tempo | Bloco | Regra | Evidência |
|---|---|---|---|
| 0–13 s | **Já no uso**: a tela/produto em mão, dedo seguindo o que a voz lê | 0 corte; abrir pela amostra, não falando dele | 04 @ 0–13,5 [observado] |
| 13–26 s | "Imagina se…": o que essa tela significa para o comprador | gesto troca o quadro (rolar, tocar) | 04 @ 13,7–25,8 [observado] |
| 26–37 s | **Número comparável** apontado com o dedo (destaque `colors.brandGreen` na legenda) | eles: autoridade só falada ("já gerou…") | 04 @ 25,8–36,5 [observado] → prova na tela [inferido] |
| 37–54 s | Oferta mostrada tocando a interface (o que tem dentro) | câmera afasta/gira | 04 @ 36,8–54 [observado] |
| 54–69 s | O que recebe + preço **falado e legendado** | preço não vira cartaz | 04 @ 54–68,7 [observado] |
| 69–70 s | Convite curto ("te espero lá") | — | 04 @ 68,8–70,1 [observado] |
| últimos 5 s | CTA em tela `colors.darkbase`: "TOQUE EM SAIBA MAIS" + seta dupla | sem fala | 04 @ 70,5; 05 @ 81,5; 06 @ 72; 07 @ 65 [observado] |
**Duração:** 60–90 s [observado]. 06 usa tablet com anúncio-exemplo sobre o livro (demonstração dentro do POV) [observado] — combinação possível com `eva-anuncio-dentro-do-anuncio`.

## Direção e captação
- **Um plano** com câmera na mão, leve balanço, sem rosto [observado, 04 contato-01]. As trocas visuais são **gestos**: rolar, tocar, girar o celular, aproximar.
- O dedo aponta exatamente o que a voz diz (legenda, voz e dedo dizem a mesma coisa) [observado, 04 @ 0–13,5].
- **Moiré/reflexo ao filmar monitor**: prefira (1) o celular filmando **outro celular** com a tela, ou (2) **gravação de tela** limpa + mão filmada em fundo verde/escuro composta por cima, ou (3) monitor com brilho alto, câmera em 30 fps, 1/60, levemente fora de paralelo [inferido; limitação da receita].
- Dados sensíveis: tarja sólida `colors.cardBg` (não blur fraco); vídeo → `blur-preciso-aula` [regra `painel-do-comprador-na-cena`].
- Ambiente sóbrio: mesa limpa, teclado, sem objetos de terceiro com marca à vista.
- Se a tela é pequena demais para ler no celular: reconstrução fiel em Remotion do trecho do número + corte de 1 s de volta ao POV [inferido].

## Legenda e tipografia
- Roboto 400 **minúscula fina** branca, **1–3 palavras**, centro-baixo (y ≈ 1350–1450, ≥ 300 px da base), sem caixa e sem destaque [observado, 04–07].
- Exceção nossa: o **número** da prova aparece em `colors.brandGreen` Roboto 700 por 1,5 s.
- CTA: Sora 800 caixa alta, "TOQUE EM" branco + "SAIBA MAIS" `colors.brandCyan`, seta dupla ▼▼.

## Ritmo (medido)
| Trecho | Deles | Fazer |
|---|---|---|
| Gancho 0–5 s | **0 corte** | plano único com movimento de dedo já no quadro 0 |
| Corpo | 0,05–0,12 corte/s | 1 corte suave a cada 10–20 s, no máximo |
| Últimos 15 s | 0,10–0,20 | corte para o CTA escuro |
Fonte: sync 04–07 [observado]. Preto 6–7 % (só o CTA) [observado]. Dissolve aceito (04 @ 54) [observado].

## Som
- **Voz quase seca**: cama em só 22–46 % da fala, voz **10,8–13,4 dB** acima (mediana) — o estilo com menos música do lote [observado, stems 04, 05].
  Nossa regra: cama baixa a −26/−30 dB sob a voz ou nenhuma; som ambiente leve do toque/rolagem ajuda o "gravado agora" [inferido].
- Voz em −14 LUFS; sem SFX de impacto (quebra o realismo).
- Voz clonada só se o rosto do autor não aparecer (aqui nunca aparece) — regra da casa.

## CTA
- 5 s em tela escura com seta dupla; fala "te espero lá" antes [observado].
- Orgânico (par, exceto anúncio por profissão): CTA "Digite [PALAVRA]" falado e escrito.

## Tradução para a nossa IDV
Livro físico + papel creme → **tela real** do produto/painel; legenda branca fina; destaque só no número (`colors.brandGreen`) e no CTA
(`colors.brandCyan`); tela final `colors.darkbase`. Nada de roxo (botão roxo-laranja da página do livro deles) [observado].

## Exemplos (uso interno)
- `fontes/ESTILO-VISUAL-DE-ANUNCIO-EVA/ADS-2026-10/ads/CRIATIVO-04-C3-LIVRO-b40d6e/` (contato-01 = plano-sequência com dedo lendo), `CRIATIVO-05-…` (tour), `CRIATIVO-06-…` (POV + tablet com exemplo), `CRIATIVO-07-…`
- Receita: `05-ANALISE/estilos/pov-do-livro/`; página de destino deles: `landing/livro/analise.md`
- Nosso componente de painel aprovado: `kit/src/mlc/MLC_IMG_PAINEL.tsx`

## Prompt-modelo
```
POV do produto para [destino], formato [formato], oferta [oferta]. Rode bin/motor-video.py antes.
Gravação: [arquivo em originais/ — celular filmando (tela X)]. Roteiro em 6 blocos da skill eva-pov-produto (60–90 s):
já no uso com o dedo → "imagina se" → número comparável apontado → oferta tocando a interface → preço falado e
legendado → CTA escuro 5 s com seta dupla. Edição mínima: nenhum corte no gancho, ≤ 1 corte a cada 10–20 s.
Legenda Roboto minúscula fina 1–3 palavras centro-baixo; número em verde 1,5 s. Mascarar [campos] com tarja sólida.
Cama a −26/−30 dB ou nenhuma. Só 9:16. Amostra dos primeiros 15 s + still do número para conferir dígito a dígito.
```

## Checklist da amostra
- [ ] Quadro 0 já mostra a tela em uso (sem introdução)
- [ ] Tela legível no celular; sem moiré forte; número confere com a fonte (still)
- [ ] Dedo aponta o que a voz diz
- [ ] Dados mascarados com tarja sólida; fonte e período ditos ou legendados
- [ ] Sem rosto; na FCA mão neutra e voz que não é do autor
- [ ] Cortes ≤ 0,12/s no corpo
- [ ] Voz ≥ 10 dB acima de qualquer cama
- [ ] CTA escuro com seta dupla; preço igual ao do checkout

## Armadilhas
- Filmar o monitor de frente: moiré e reflexo deixam o número ilegível.
- "Editar demais" (cortes, zoom, SFX): perde o "gravado agora", que é o valor do estilo.
- Mostrar a nossa tela (código, terminal) em vez da do comprador: não vende.
- Preço falado diferente do checkout (erro deles: R$ 289 falado × R$ 286, `landing/serie/analise.md`) [observado].


## ⛔ Arquivo final sem rótulo interno de produção (regra do autor, 14/10/2026)
Na hora de renderizar o ARQUIVO FINAL, retirar todo rótulo/numeração de controle da produção: etiquetas tipo "PL 001", códigos de cena/beat (B042, AD21-07), ids de take, nomes de plano, contadores. Esses números são só do processo interno; o público final não pode vê-los.
Fica só o que faz parte da CENA (texto que existe no mundo da história: tela do Gerenciador, comentário real, cardápio, placa, selo do anúncio dentro do anúncio) e os selos legais ("exemplo · números ilustrativos").
Rascunho/prévia pode ter rótulo; o render final, não. Conferir na folha de contato antes de entregar.
