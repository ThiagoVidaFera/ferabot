# Padrão de movimento — Sistema FCA (o autor)

Este é o nosso padrão para todo efeito do `catalogo.json`, em qualquer motor. Números de tempo valem em
segundos e em quadros a 30 fps (Remotion trabalha em quadros; HyperFrames em segundos). Os componentes
importam estas constantes; nenhum efeito escreve tempo "solto".

## 1. Constantes de tempo
| Constante | Segundos | Quadros @30 | Para quê |
|---|---|---|---|
| `INICIO` | 0,16 | 5 | nada se move antes; o quadro 0 mostra a cena-fonte (em anúncio, já com o gancho inteiro) |
| `ENTRADA` | 0,18–0,45 | 6–14 | elemento novo chegando |
| `TROCA_FOCO` | 0,40–0,70 | 12–21 | atenção muda de um alvo para outro |
| `MASCARA_LINHA` | 0,25–0,62 | 8–19 | texto revelado da esquerda para a direita |
| `TRACO` | 0,36–0,60 por marca · 1,1–1,2 por linha de gráfico | 11–18 · 33–36 | círculo, risco, seta, linha |
| `CADENCIA_SERIE` | 0,43–0,95 entre itens | 13–29 | lista, cartões, nós de diagrama |
| `LEITURA_MIN` | ≥ 1,2 | ≥ 36 | pausa final sem nenhum movimento |
| `LEITURA_DIAGRAMA` | 2,0–3,0 | 60–90 | estrutura inteira parada no fim (aula/VSL) |
| `CORTE_CHEIO` | 1 quadro | 1 | troca de cena seca; nunca quadro intermediário |

Ordem narrativa fixa: **estrutura antes do dado · desenhar antes de rotular · revelar antes de comparar ·
mover antes de resolver · concluir antes de mudar de tamanho.**

Durações: aula/VSL usa `duracao_16x9_s` do catálogo (6–12 s). **Anúncio usa `duracao_anuncio_9x16_s`**
(≈ 60% do original): entrada + mudança principal + `LEITURA_MIN`. Nos 6 primeiros segundos de anúncio,
estímulo novo a cada 1,5–2,5 s (regra do `gancho-dos-tres-segundos`).

Sincronia com a fala: a mudança principal de cada efeito acontece no tempo da **palavra-gatilho** tirada
da transcrição com tempo por palavra (`bin/transcrever.py`). A animação se ajusta à fala, nunca o contrário.

## 2. Curvas por intenção (Remotion `Easing.bezier`)
| Intenção | Curva | Bezier |
|---|---|---|
| Entrada confiante (padrão) | saída cúbica | `(0.215, 0.61, 0.355, 1)` |
| Revelação decisiva, número que chega | saída exponencial = `brandEasing` | `(0.16, 1, 0.3, 1)` |
| Revelação forte de título | saída quártica | `(0.165, 0.84, 0.44, 1)` |
| Viagem de câmera / painel largo | senoidal ida-e-volta | `(0.445, 0.05, 0.55, 0.95)` |
| Troca de lado, recuo, compactação | cúbica ida-e-volta | `(0.645, 0.045, 0.355, 1)` |
| Traço de gráfico contínuo | linear | `Easing.linear` |
| Marca rápida de revisão (círculo, risco) | saída quadrática | `(0.25, 0.46, 0.45, 0.94)` |
| Pop físico (só selo/carimbo) | leve passada | `(0.34, 1.4, 0.64, 1)` |
| Cobertura de transição (fecha) | entrada cúbica | `(0.55, 0.055, 0.675, 0.19)` |

Proibido: mola com quique, flutuação repetida, tremor em texto assentado, pulsos, brilho girando, partículas,
desfoque global, fade final até o preto vazio, crossfade entre títulos grandes (gera letra dupla).
Spring do Remotion só com `damping` alto (sem passar do alvo) e só onde a skill `apresentador-em-cena` pede.

## 3. Tipografia e tamanhos
Base: a menor dimensão é 1080 px nos dois formatos verticais; o celular mostra o quadro inteiro, então os
tamanhos sobem em relação ao 16:9 e o **número de caracteres por linha cai**.

| Papel | 1080x1920 (9:16) | 1080x1350 (4:5) | Caracteres por linha (9:16) |
|---|---|---|---|
| Título de impacto (tela cheia) | 110–140 px, peso 800 | 96–120 px | 12–15 |
| Título de efeito | 84–110 px, peso 700–800 | 76–96 px | 15–18 |
| Número herói | 140–220 px, algarismos tabulares | 120–180 px | — |
| Rótulo de diagrama/cartão | 40–52 px, peso 600 | 38–48 px | 24–30 |
| Legenda falada | 60–66 px, 1–2 linhas | 56–60 px | 22–26 |
| Secundário (mínimo absoluto) | **34 px** | **32 px** | 34 |

- Ajuste de espaço entre letras: título −0,02 a −0,04 em; corpo 0 a −0,01 em. Entrelinha do título 0,95–1,05.
- Uma palavra de acento por frase (cor do acento da paleta); o resto em texto principal.
- Se o texto não cabe nos `limites_9x16`, **corta-se o texto**, nunca a fonte.
- Fontes locais no projeto (sem rede no render). Acentos do português conferidos no quadro (Ç, Ã, É).

## 4. Zonas seguras (Reels, Stories, Feed)
Regra do autor (Meta): o essencial no **quadrado central 1:1**; apoio até o 4:5; fora disso, só fundo.

| Faixa em 1080x1920 | y | O que pode |
|---|---|---|
| Topo do app | 0–240 | só fundo/degradê (nome do perfil e barra do Stories) |
| Apoio superior | 240–420 | título de apoio, selo de fonte |
| **Núcleo 1:1** | **420–1500** | gancho, número herói, CTA, marcação da prova |
| Apoio inferior | 1500–1680 | legenda, linha de contexto |
| Rodapé do app | 1680–1920 | só fundo (legenda do Reels, botão de ação) |

- Laterais ≥ 90 px. Coluna direita **x > 940 entre y 1100 e 1700** livre (botões de curtir/comentar do Reels).
- Em 1080x1350: núcleo y 135–1215; margem 72 px nas laterais.
- Faixa de topo sobre mídia: **degradê suave ≥ 220–250 px até 0%**, nunca borda dura.
- Ao portar um efeito, sobrepor a máscara de zona segura na folha de quadros-chave.

## 5. Densidade
- Uma ideia por batida; um movimento principal por vez.
- Máximo de itens e caracteres = `limites_9x16` do catálogo (o limite é a regra de design).
- Legenda some enquanto o quadro tem 3+ textos e volta no take.
- Tela final sempre composta: nada vazio, nada a meio caminho.
- Linhas: régua de painel 2–3 px; traço de diagrama 4–6 px em 9:16 (afinam no celular).

## 6. Paletas por produto (tokens semânticos — movimento idêntico em todas)
Tokens: `fundo · superficie · regua · texto · texto_suave · acento · tinta_acento · ok · alerta · erro`.
Override só de token conhecido; contraste conferido depois de trocar.

| Token | Lead Certo / IDV o autor | MCT | FCA |
|---|---|---|---|
| fundo | `#020408` + grade 40 px a 2–6% | `#070F1A` | `#05060A` + grade 40 px `#12141F` |
| superficie | `#050812` | `#0F1F2E` | `#12141F` |
| regua | `#1a2e55` | `#1E3A5F` | `#2A2F45` |
| texto | `#f8fafc` | `#F8FAFC` | `#F4F1E8` |
| texto_suave | `#94a3b8` | `#94A3B8` | `#8A8FA3` |
| acento | `#00f0ff` | `#00D4FF` | `#FFC21A` (acento único) |
| tinta_acento | `#020408` | `#070F1A` | `#05060A` |
| ok | `#34d399` | `#22C55E` | `#00F0FF` (só "IA ligada"/pronto) |
| alerta | `#fbbf24` | `#FACC15` | `#FF8A1A` |
| erro | `#f87171` | `#EF4444` | `#FF2E4D` (só "antes"/perda) |
| títulos | Sora 800 (tokens `@brand`) | Space Grotesk 700 | Chakra Petch 700 caixa alta |
| números/HUD | Sora 700 tabular | JetBrains Mono | VT323 (até 4 palavras) |
| assinatura | — | mascote Claw Comandante (nunca o logo de pétalas) | esteira dourada/preta de 14 px no rodapé |

- Fonte dos tokens: `kit/src/brand/colors.ts` (o autor/Lead Certo), memória IDV MCT, `projetos/exemplo/idv/IDV-FCA-v2.md`.
- Laranja MCT `#F94E03` só em traço; dourado FCA até 15% da área; ciano FCA até 5%.
- Texto sobre vídeo fica branco neutro em qualquer paleta e passa à cor da paleta quando o plano vira fundo chapado.
- Para comparar paletas sem confundir com ritmo: renderizar o mesmo efeito, mesmo conteúdo, só trocando a paleta.
- Variante P&B para teste: séries em cinzas distintos e excesso de meta com hachura (não só cor).

## 7. Proibições de padrão
- Logo/marca d'água de terceiro e pele de interface que não seja a tela do comprador.
- Foto falsa feita de formas CSS; documento "desenhado" fingindo ser real.
- Loop de take do apresentador com emenda visível; voz clonada sobre o autor falando.
- "Cartão animado universal" que só troca o título: cada efeito tem a sua assinatura.
- Vidro fosco em excesso, bolhas de degradê, mini-rótulos ilegíveis.
- Número sem origem fora de peça rotulada SIMULAÇÃO.

## 8. Grade de cor, vinheta e grão (valores medidos — VSL Estilo Visual de Anúncio (EVA))
Fonte: `projetos/vsl-mct/00-estudo/BIBLIA-EVA-VSL.md` §8 (`receita-medida.json` · `R.atos.*`). Uma camada **global única** sobre a composição, nunca por cena.

| Token | KI | SHŌ | TEN | PITCH | KETSU |
|---|---|---|---|---|---|
| saturação HC (0–1) | 0,04 | 0,15 | 0,17 | 0,24 | 0,23 |
| contraste HC (desvio de luminância) | 56 | 62 | 59 | 57 | 65 |
| vinheta HC (anel/centro) | 0,83 | 0,87 | 0,72 | 0,78 | 0,84 |

- Série × clássico (medição de 2026): saturação 0,33 × 0,10 · contraste 63,9 × 51,2 · vinheta 0,88 × 0,81 · preto 26,2 % × 57,4 % dos pixels.
- **CSS inicial:** `filter: contrast(1.12) saturate(0.85) brightness(0.96)` + sobreposição `#0a1228` a 10 % em `mix-blend-mode: color` (unifica clipes de modelos diferentes) + vinheta/grão (grão 6 %, queda de borda 12 %). Cena tensa: `contrast(1.25) brightness(0.92)`; dramática: `contrast(1.45) brightness(0.62)` + `#030817` 35 % multiply.
- **Meta de conferência na amostra:** contraste 56–65, vinheta (anel/centro) 0,72–0,88, preto 26–43 % do quadro. Saturação não tem meta numérica (navy é saturado em HSV): vale "≤ 3 cores + ciano".
- **P&B** só na revelação (`grayscale(1)`); a cor volta em corte seco no nome do mecanismo. Valores iniciais: travar na amostra aprovada.
- **Fotossensibilidade:** ≤ 3 flashes/s em qualquer efeito (ver `SKILL.md`).

