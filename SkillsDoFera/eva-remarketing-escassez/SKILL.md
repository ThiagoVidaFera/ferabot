---
name: eva-remarketing-escassez
description: "Anúncio de remarketing HONESTO: nomeia a objeção do adiamento em 3 frases paralelas, dá UM motivo novo com prova real na tela, preço com âncora e só prazo/lote que existe (nunca urgência falsa). Inclui variante carrossel. Triggers: remarketing, RMK, recuperar quem não comprou."
---

> **Origem e adaptação (FeraBot).**
> - Skill do pacote "Sistema de Criativos FERA" (créditos no LEIA-ME desta pasta). No FeraBot ela entra como **direção
>   criativa**: roteiro, cena, regras e checklists.
> - Onde citar `bin/motor-video.py`, `motor-de-video`, `remotion-marca`, `kit/` ou `acervo/`: esses caminhos não existem
>   aqui. Use o que você tem: `ScriptsFera/render.py`, `ScriptsFera/narrar.py` e FFmpeg, ou o motor de vídeo que preferir
>   (HyperFrames ou Remotion, se estiver instalado).
> - Cores, fontes e marcas dos exemplos (MCT, MLC/Lead Certo, FCA, ciano #00f0ff, Sora) são do autor original: aqui valem
>   as do seu `perfil.json`.
> - Prova e número: número sem origem fica fora da peça. Nunca inventar print, depoimento ou resultado. Selo SIMULAÇÃO
>   não libera peça pública.
> - Copy de venda passa pelo checklist A/B/C/D do roteador; mídia gerada por IA tem o custo dito antes de gastar crédito.

# eva-remarketing-escassez — um motivo novo, um preço, um prazo real


**De onde vem:** C1-RMK (2 vídeos, desde 08/06/2026) e C2-carrossel (8 imagens, desde 17/07) → checkout direto R$ 286 → R$ 199
[observado, `00-MAPA/mapa.md`; `landing/checkout-ticto/analise.md`]. Na leitura inversa é **inferior** para nós como está:
a urgência é declarada e falsa ("o nosso pixel rastreia cada visualização… esse preço nunca mais volta" num anúncio no ar há 4 meses,
01 @ 33,9) [observado]. Para quem ensina pixel (MCT), repetir isso queima a autoridade técnica [inferido]. Fica a **estrutura**.

## Quando usar
- Público quente: viu a página/VSL/série, iniciou checkout, assistiu ≥ 50 % do anúncio frio.
- Existe um **motivo novo real**: bônus com data, lote que vira, turma que fecha, preço que sobe em data marcada, prova nova.
- MCT, MLC, FCA (pré-venda com preço especial — **sem falar data de liberação** na FCA, regra 09/10).

## Quando NÃO usar
- Não existe prazo/lote real → faça RMK de **prova** (`painel-do-comprador-na-cena`) sem escassez.
- Público frio → outro estilo.
- Disparo por WhatsApp/e-mail para a base: isso é automação, não anúncio (WABA com template; teste para o autor antes).

## Estrutura de roteiro (espinha CRIATIVO-01, 63,1 s)
| Tempo | Bloco | Regra | Evidência |
|---|---|---|---|
| 0–3 s | "Você viu [produto] e ficou esperando…" sobre imagem do personagem/cena | falar com quem já viu | 01 @ 0–2,9 [observado] |
| 3–8 s | **Anáfora da objeção**: 3 frases paralelas "quando…" em telas escuras, crescendo palavra a palavra, ícone de linha por frase | Sora 800 caixa alta 2 linhas | 01 @ 2,9–7,7 [observado] |
| 8–10 s | **Silêncio dramático** (música corta) sobre imagem quase parada | 2 s | 01 @ 7,7–10,3 [observado] |
| 10–20 s | Reenquadre: "não falta tempo, falta motivo" | legenda na faixa inferior com degradê | 01 @ 10,3–19,7 [observado] |
| 20–25 s | **O motivo**: prova real na tela (o custo de esperar: eventos perdidos, vendas do mês, criativos entregues) com número `colors.brandGreen` | deles: "hoje a gente vai te dar esse motivo" = desconto | 01 @ 19,8–25 [observado] → prova [inferido] |
| 25–30 s | **Preço**: antigo em branco riscado → novo grande `colors.brandGreen` no mesmo lugar + "à vista ou parcelado" | troca de número no lugar | 01 @ 25–29,3 [observado] |
| 30–44 s | **Prazo/lote REAL** (data ou quantidade verificável) | nunca "o pixel rastreia" | 01 @ 29,3–44 (escassez falsa) [observado] |
| 44–47 s | 2º silêncio dramático | — | analise.json 01: silêncios 8–10 e 44–47 s [observado] |
| 47–53 s | "O momento chegou" + CTA "TOQUE EM SAIBA MAIS" + seta dupla | — | 01 @ 44–52,8 [observado] |
| 53–63 s | **Coda** de 5–10 s só música sobre imagem (pôr do sol, porta, personagem de costas) | — | 01 @ 52,8–63,1 [observado] |

### Variante carrossel (C2, 8 imagens)
Balões de diálogo de HQ entre personagens + prints reais de conversa/plataforma + oferta em tipografia condensada [observado, 03].
Nós: 6–8 cartões 1080×1350 ou 1080×1920 — (1) objeção em balão, (2–5) prova real (print mascarado), (6) preço âncora → novo,
(7) prazo real, (8) CTA. Personagem da nossa ficha; prints nossos com data. Ver também `criativo-estatico-par`.

## Direção
- Texto sobre `colors.darkbase` em **25–30 % do tempo** [observado, 01: 30 %; 02: 25 %]. É o **único** estilo do lote que manteve a tipografia condensada CAIXA ALTA de maio [observado].
- Imagem: personagem-guia nosso em ambiente de "vigilância/espera" (eles: homem-câmera found-footage, cômodo amarelo-sujo com REC/data, 01 @ 0) [observado] → nós: personagem em sala escura com luz ciano de monitor; **sem** REC falso, sem cabeça de câmera.
- Meta-copy honesta no **texto do anúncio** combina com público que entende funil ("Você está no remarketing. De propósito.") [observado: "VOCÊ ESTA NO RMK 👀"; adaptação inferida]. A honestidade é o argumento; o vídeo não pode contradizê-la.
- Logo da Meta / de qualquer plataforma como "prova de rastreio": não usar [observado 01 @ 33,9 → proibido].

## Imagem — prompts
```
cinematic still, vertical 9:16, [personagem da ficha] sitting alone in a dark room lit only by a cyan monitor glow,
waiting posture, low-key, deep shadows #020408, cool cyan #00f0ff rim light, subtle film grain, quiet mood.
NEGATIVE: text, numbers, logos, REC overlay, timestamp, security camera head, purple, magenta, yellow-green cast.
```
- Ícones de linha das frases "quando…": set de ícones nosso (`kit/src/brand/TrackerIcons.tsx` ou Lucide), traço 2 px branco.
- Coda: `person seen from behind facing a city at dusk, cyan sky glow, wide shot` (5–10 s, push-in lento).

## Legenda e tipografia
- Frases da objeção: Sora 800 caixa alta branca, 2 linhas, revelação palavra a palavra (4 quadros/palavra) [observado, 01 @ 2,9–5].
- Sobre imagem: faixa inferior com **degradê** para `colors.darkbase` (~250 px até 0 %, nunca borda dura — regra da casa) [observado: degradê preto, 01 @ 13,4].
- 1 palavra-chave por frase em `colors.brandCyan` (eles: magenta, 01 @ 19,8) [observado → trocado].
- Preço: antigo `colors.textSecondary` riscado; novo `colors.brandGreen` Sora 800 ≥ 160 px; mesmo ponto da tela.

## Ritmo (medido)
| Trecho | Deles | Fazer |
|---|---|---|
| Gancho 0–5 s | 0,2 corte/s | 1 imagem + 1 tela de texto |
| Corpo | 0,35–0,42 | troca a cada 2–3 s |
| Últimos 15 s | 0,13–0,2 | CTA + coda parada |
Fonte: sync 01, 02 [observado]. Duração ~60 s (62–63 s) [observado].

## Som
- Cama instrumental sob a voz em 87–95 % da fala; voz 7,3 dB acima (mediana) [observado, `audio/analise.json` 01].
  Nossa regra: voz 12–15 dB acima; −14 LUFS.
- **Dois cortes de silêncio dramático** (≈2 s e ≈3 s) — o recurso de som mais forte do estilo [observado].
- Coda: música sobe +6 dB sozinha por 5–10 s após o CTA [observado].
- Trilha licenciada; eles usam faixa comercial (Shazam 01, 02) [observado] — proibido.

## CTA
- "TOQUE EM SAIBA MAIS" + seta dupla, 3–6 s, antes da coda. Destino: página -offer ou checkout do funil conforme `fop-tracking` (conferir UTM e evento).
- O preço da tela = o preço do checkout, ao centavo (eles divergem entre peças) [observado, `FUNIL-2026-10.md` §3].

## Tradução para a nossa IDV
Magenta → `colors.brandCyan`; verde-neon do preço → `colors.brandGreen`; cômodo amarelo-sujo → sala escura com luz ciano;
condensada → Sora 800; fundo `colors.darkbase`. Nunca roxo/magenta (faixa magenta do checkout deles) [observado].

## Exemplos (uso interno)
- `fontes/ESTILO-VISUAL-DE-ANUNCIO-EVA/ADS-2026-10/ads/CRIATIVO-01-C1-RMK-9e55dc/` (contato-01; `audio/analise.json` com os silêncios), `CRIATIVO-02-C1-RMK-8d8b75/`
- Carrossel: `ads/CRIATIVO-03-C2-CARROSSEL-33d6c0/`
- Receita: `05-ANALISE/estilos/remarketing-de-escassez/`; checkout de destino: `landing/checkout-ticto/analise.md`

## Prompt-modelo
```
Remarketing honesto para [destino], formato [formato], oferta [oferta]. Rode bin/motor-video.py antes.
Público: [quem viu o quê]. Motivo novo REAL: [bônus/lote/data — com a fonte]. Prova: [assets/provas/...]. Preço:
[antigo] → [novo] (igual ao checkout). Estrutura da skill eva-remarketing-escassez (~60 s): objeção em 3 frases
"quando…" → silêncio 2 s → "não falta tempo, falta motivo" → prova na tela → preço riscado → novo em verde → prazo real
→ silêncio → CTA com seta dupla → coda de música 5–10 s. Texto sobre darkbase 25–30 % do tempo; acento ciano.
Sem "pixel rastreia", sem relógio falso. Só 9:16. Amostra de 15 s do bloco preço + prazo.
```

## Checklist da amostra
- [ ] Fala com quem já viu (não explica o produto do zero)
- [ ] Prazo/lote é verdadeiro e tem fonte; nenhuma frase de urgência inventada
- [ ] Prova real antes do preço
- [ ] Preço da tela = checkout; âncora é um preço que existiu
- [ ] 2 silêncios dramáticos; coda de música depois do CTA
- [ ] Degradê suave na faixa de legenda; acento ciano; zero magenta
- [ ] FCA: nenhuma data de liberação falada ou escrita

## Armadilhas
- "Esse preço nunca mais volta" com link fixo que mostra o preço sempre: o público quente percebe e a Meta pode reprovar.
- Cronômetro na página que reinicia a cada visita: mesma mentira, outro lugar.
- Desconto grande demais no RMK treina o público a esperar o RMK [inferido].
- Usar logo da Meta como selo de "rastreio": marca de terceiro e prova falsa.


## ⛔ Arquivo final sem rótulo interno de produção (regra do autor, 14/10/2026)
Na hora de renderizar o ARQUIVO FINAL, retirar todo rótulo/numeração de controle da produção: etiquetas tipo "PL 001", códigos de cena/beat (B042, AD21-07), ids de take, nomes de plano, contadores. Esses números são só do processo interno; o público final não pode vê-los.
Fica só o que faz parte da CENA (texto que existe no mundo da história: tela do Gerenciador, comentário real, cardápio, placa, selo do anúncio dentro do anúncio) e os selos legais ("exemplo · números ilustrativos").
Rascunho/prévia pode ter rótulo; o render final, não. Conferir na folha de contato antes de entregar.
