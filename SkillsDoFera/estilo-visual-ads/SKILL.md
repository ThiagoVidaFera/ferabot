---
name: estilo-visual-ads
version: 4.1
date: 2026-10-12
sources:
  - fontes/ESTILO-VISUAL-DE-ANUNCIO-EVA/ADS-2026-10/05-ANALISE/leitura.md
  - fontes/ESTILO-VISUAL-DE-ANUNCIO-EVA/ADS-2026-10/05-ANALISE/classificacao.md
  - fontes/ESTILO-VISUAL-DE-ANUNCIO-EVA/ADS-2026-10/05-ANALISE/classificacao.json
  - fontes/ESTILO-VISUAL-DE-ANUNCIO-EVA/ADS-2026-10/05-ANALISE/comparativo-maio-vs-outubro.md
  - fontes/ESTILO-VISUAL-DE-ANUNCIO-EVA/ADS-2026-10/05-ANALISE/dna-2026-10.md
  - fontes/ESTILO-VISUAL-DE-ANUNCIO-EVA/ADS-2026-10/05-ANALISE/estilos/
  - fontes/ESTILO-VISUAL-DE-ANUNCIO-EVA/ADS-2026-10/landing/FUNIL-2026-10.md
  - fontes/ESTILO-VISUAL-DE-ANUNCIO-EVA/ADS-2026-10/landing/serie/vsl/SERIE-RESUMO.md
  - fontes/ESTILO-VISUAL-DE-ANUNCIO-EVA/ADS-2026-10/landing/3perguntas/player-config.json
  - fontes/ESTILO-VISUAL-DE-ANUNCIO-EVA/ADS-2026-10/redes/analise.md
  - fontes/ESTILO-VISUAL-DE-ANUNCIO-EVA/ADS-2026-10/00-MAPA/mapa.md
  - conhecimento/analysis/eva-ads-v2/DOSSIER-v4-SINTESE.md (v3.0, histórico)
  - conhecimento/analysis/eva-ads-v2/visual/01-SC001-terror-absurdity.md (v3.0, histórico)
  - conhecimento/analysis/eva-ads-v2/visual/02-SC002-SC003-en.md (v3.0, histórico)
  - conhecimento/analysis/eva-ads-v2/visual/03-SC004-quick-course.md (v3.0, histórico)
  - conhecimento/analysis/eva-ads-v2/visual/04-SC005-SC006-SC007-ptbr.md (v3.0, histórico)
  - conhecimento/analysis/eva-ads-v2/visual/05-SC008-SC009-SC010-ptbr.md (v3.0, histórico)
  - conhecimento/analysis/eva-ads/06-visual-ptbr-1fps.md (legacy)
  - conhecimento/analysis/eva-ads/07-visual-en-1fps.md (legacy)
  - conhecimento/analysis/eva-vsl/03-dna-producao.md (legacy)
description: "Roteador 'qual estilo EVA para qual objetivo' de anúncio/VSL (HQ-IA, anúncio-dentro-do-anúncio, ensaio noir, POV do produto, remarketing) com o DNA visual e as regras de produção da referência. Aponta para as skills eva-*. Triggers: anúncio no estilo EVA, qual estilo usar, comparar com a referência."
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

> ⛔ **ORDEM DO autor (23/10/2026, global): a VSL é INTEIRA.** Nunca falar nem mostrar "capítulo" (nada de "São oito capítulos", "no capítulo quatro", cartela ou nome-recompensa de capítulo). CAP1..CAPn só como divisão INTERNA de render. Série/episódios/player de capítulos só se o autor pedir.

# Campanha 2026-10 (PT-BR) — v4.0 (12/10/2026)

> Uso: estudo competitivo para produzir os NOSSOS criativos. **Nunca** transportar texto, oferta, prova, marca, mascote, trilha
> ou asset deles. Toda peça sai na nossa IDV (`colors.*` de `@brand`: `darkbase #020408`, `cardBg #050812`, `border #1a2e55`,
> `brandCyan #00f0ff`, `brandGreen #34d399`; Sora 800 caixa alta + Roboto; grade 40 px; nunca roxo/lilás) e com prova NOSSA
> (`painel-do-comprador-na-cena`). Antes de qualquer vídeo: `python3 bin/motor-video.py "<pedido>"`. Só 9:16 para aprovar.
> Status: [observado] = está nos arquivos do estudo; [inferido] = hipótese. Evidência no formato **criativo @ segundo**
> (pastas `fontes/ESTILO-VISUAL-DE-ANUNCIO-EVA/ADS-2026-10/ads/CRIATIVO-NN-*`).

**Em uma frase:** a Estilo Visual de Anúncio (EVA) desligou a matriz em inglês de "manifestos" de 39 s e passou a vender uma **escada de ofertas em
PT-BR** com **vídeos longos (mediana ≈ 100 s) no mesmo universo de HQ por IA da página de destino** — a peça de venda é uma
amostra do método [observado, `05-ANALISE/leitura.md`].

## Matriz ativa (Biblioteca de Anúncios, 12/10/2026)
**90 anúncios ativos · 29 criativos (27 vídeos + 1 carrossel + 1 imagem) · 0 em inglês · 0 dos 185 anúncios de maio sobreviveu** [observado, `00-MAPA/mapa.md`].

| Campanha | Destino | Anúncios | Criativos | Desde | Preço |
|---|---|---|---|---|---|
| C1-RMK | checkout direto (RMK) | 2 | 2 vídeos | 08/06 | R$ 286 → R$ 199 |
| C2-CARROSSEL | mesmo checkout | 1 | 1 carrossel | 17/07 | idem |
| C3-LIVRO | /livro → VSL VTurb 5 min | 9 | 8 vídeos | 24/06 (lote 2: 14/09) | R$ 99 |
| C4A-SERIE | /serie → 3 episódios (22:41) | **65** (5 vídeos × 13 IDs) | 5 | 08/09 | R$ 286 (âncora R$ 835) |
| C4B-3PERGUNTAS | /3perguntas → VSL vertical 16 min, 9 capítulos | 4 | 3 vídeos + 1 imagem | 08/09 | R$ 286 |
| C5-APLICACAO | formulário de 12 perguntas (agência) | 9 | 9 vídeos (mesmo dia) | 11/10 | não divulgado |

| Estilo | Criativos | Anúncios | % dos IDs | Duração | Skill nossa |
|---|---|---|---|---|---|
| HQ-IA noir narrado | 12, 13, 14, 17, 18, 19 | 42 | 47 % | 63–108 s | `eva-hq-ia-noir` (variante A) |
| Ficção de mundo (trailer) | 15, 16, 20 | 27 | 30 % | 55–76 s (+1 pôster) | `eva-hq-ia-noir` (variante B) |
| Ensaio noir para empresário | 21, 22, 23, 26, 27, 28, 29 | 7 | 8 % | 71–140 s | `eva-ensaio-noir-empresario` |
| Anúncio-dentro-do-anúncio | 08, 09, 10, 11, 24, 25 | 6 | 7 % | 112–154 s | `eva-anuncio-dentro-do-anuncio` |
| POV do livro | 04, 05, 06, 07 | 5 | 6 % | 70–87 s | `eva-pov-produto` |
| Remarketing de escassez | 01, 02, 03 | 3 | 3 % | 62–63 s (+carrossel) | `eva-remarketing-escassez` |
| Funis série + capítulos | páginas `/serie`, `/3perguntas` | — | 77 % dos IDs levam a eles | 22:41 / 16:12 | `serie-de-vendas` |
Fonte: `05-ANALISE/classificacao.md` §1–2 [observado]. **77 % dos anúncios (69/90) estão em HQ-IA** e vendem um único produto [observado].
Ficção de mundo foi fundida no HQ-IA como variante: mesmo kit de imagem, mesma campanha, muda só o roteiro (justificativa na skill).

**Método de mídia** [observado, `mapa.md`; `dna-2026-10.md` M5/ME1]: texto e título **fixos por campanha** (4–45 palavras); o que varia é o
vídeo; teste = 1 anúncio por vídeo (C3, C5); escala = 13 IDs por vídeo (C4A); lote novo a cada ~3 meses; orgânico postado 2–34 dias
antes do pago (`redes/analise.md` §4).

## As 30 regras de maio (v3.0) em outubro — placar: MANTEVE 6 · MUDOU 16 · CAIU 6 · não verificável 2
Detalhe e evidência regra a regra: `fontes/ESTILO-VISUAL-DE-ANUNCIO-EVA/ADS-2026-10/05-ANALISE/comparativo-maio-vs-outubro.md`.

| # | Regra v3.0 (resumo) | Veredito | Outubro, em uma linha |
|---|---|---|---|
| 1 | 9:16 1080×1920 30 fps | MANTEVE | anúncios 9:16; série 16:9; VSL capitulada 9:16 |
| 2 | 39–49 s | MUDOU | 55–154 s, mediana ≈ 100 s |
| 3 | ritmo EN 3→1,5→0,5 corte/s | CAIU | gancho 0–1, corpo 0,2–0,5, fim 0,1–0,3 + rajadas de 3 s no meio |
| 4 | PT-BR plano 1–1,5 → 2–2,5 → 3–4 s | MUDOU | HQ: planos 2–5 s; POV: plano-sequência 20–40 s; CTA 4–10 s |
| 5 | 1–3 quadros de preto como pontuação | MUDOU | preto virou **tela tipográfica** de 1–3 s com a tese |
| 6 | fim em fade para preto | MUDOU | fecha numa imagem com o CTA por cima |
| 7 | headline condensada 110–140 px | MUDOU | só no RMK, palavras-chave da C5 e CTA |
| 8 | corpo em sans fina | MANTEVE | texto fino nas telas escuras e no POV |
| 9 | CAIXA ALTA sempre | CAIU | legenda **minúscula** em 16 dos 27 vídeos |
| 10 | 2–3 linhas, nunca 1 | MUDOU | legenda de 2–4 palavras em 1 linha no HQ |
| 11 | branco + vermelho (EN) | MUDOU | vermelho migrou para palavras-chave PT-BR (C5) |
| 12 | uma cor de acento por anúncio | MUDOU | nos demos a cor marca a **camada** (moldura × exemplo) |
| 13 | slam-in com mola | não verificável | folhas a 1 q/s |
| 14 | revelação palavra a palavra | MANTEVE | 01, 08, 23 |
| 15 | motion-blur slide-in | não verificável | indício no orgânico |
| 16 | glitch RGB | MANTEVE | pontual (16, 23, 09) |
| 17 | degradê no terço inferior | MUDOU | só no RMK; no HQ a legenda vai solta |
| 18 | preto > 60 % | CAIU | 2–30 % |
| 19 | LUT verde EN | MUDOU | virou paleta **pintada** (teal + laranja do HQ) |
| 20 | 3 LUTs PT-BR | MUDOU | uma paleta por estilo (HQ teal/laranja, noir P&B + vermelho, POV creme) |
| 21 | verde vapor de sódio | MANTEVE | variante no cômodo do RMK |
| 22 | metade imagem + barra preta | CAIU | imagem em tela cheia + legenda sobreposta |
| 23 | letterbox 55/45 | CAIU | só o filme do 26 |
| 24 | nunca dissolve | CAIU | dissolves e fades em 04, 08, 12, 15, 16, 17 |
| 25 | logo ausente | MUDOU | marca entra como **objeto de cena** (livro, placa, mascote) |
| 26 | seta dupla ▼▼ | MANTEVE | "TOQUE EM SAIBA MAIS" + seta dupla em 25 vídeos |
| 27 | metáforas de mecanismo | MUDOU | a câmera de vigilância virou **mascote** (18 criativos) |
| 28 | close de olho no fim | MUDOU | olho no meio/rajada ou antes do CTA |
| 29 | VO off, nunca música sob a voz, 220–230 ppm | MUDOU | off mantido (27/27); **cama sob a voz em 23/27** (68–99 % da fala, voz 3–10 dB acima); 145–200 ppm |
| 30 | "FAÇA SUA APLICAÇÃO." | MUDOU | "TOQUE EM SAIBA MAIS"; aplicação só no título da C5; preço voltou no RMK e livro |

## Regras novas (v4.0)
| # | Regra | Status · evidência |
|---|---|---|
| N1 | **A peça de venda é a amostra do produto**: anúncio, página e VSL no mesmo universo visual (mesmo traço, personagem, legenda). | observado · 12–20 × `SERIE-RESUMO.md` ("estilo visual iguais") |
| N2 | **Abrir com pergunta, número ou premissa — nunca com a marca.** | observado · 12, 13, 15, 16, 17, 23, 27 |
| N3 | **Uma tela escura com uma frase por tese** (1–3 s); máx. 1 palavra colorida por tela. | observado · 12 @ 11,2; 14 @ 8; 15 @ 45,9; 22, 23, 25 |
| N4 | **Rajada de 3–4 s no meio** (~4–10 imagens/s) para religar a atenção; uma por vídeo. | observado · 08 @ 59,6; 23 @ 43,5; 24 @ 7,2/48,3; 25 @ 83,8; 28 @ 47,3; 29 @ 10/22,5 |
| N5 | **Nomeie o mecanismo** com nome próprio curto e mostre-o grande. | observado · 08 @ 57,7; 13 @ 67; 23 @ 32 |
| N6 | **CTA repetido**: interno/meio + final, com seta dupla. | observado · 08–11 (interno); 23, 25, 26, 28, 29 (2–3×) |
| N7 | **Cama musical sob a locução**; música sobe sozinha só depois do CTA (coda 4–10 s). Nós: voz 12–15 dB acima no gancho, 8–10 no corpo; POV quase seco. | observado (stems 23/27; codas 01, 15, 18, 19, 29) · nossa dosagem inferida |
| N8 | **A cor marca a camada** quando o vídeo tem duas vozes (moldura × exemplo). | observado · 08 azul, 09 verde-neon, 10 amarelo, 25 azul × vermelho |
| N9 | **Personagem-guia no lugar do apresentador** (deles: mascote cabeça-de-câmera). Nós: personagem da nossa ficha; FCA nunca com o autor. | observado · 18 criativos; regra da casa 11/10 |
| N10 | **Texto fixo, vídeo variável**: teste = 1 anúncio por vídeo; escala = vários IDs por vídeo vencedor. | observado · mapa.md |
| N11 | **Funil por episódios/capítulos** com cliffhanger, nome-recompensa, mensagem de pausa e checkout no pitch. | observado · `SERIE-RESUMO.md`; `player-config.json` → `serie-de-vendas` |
| N12 | **Um link de checkout por formato** (atribuição sem UTM) e checkout que repete a metáfora do vídeo. | observado · `ssl_id`/`vsl_id`; checkout "interrogatório" |
| N13 | **Demonstração por profissão nomeada** (o produto aplicado a um nicho, com CTA próprio). | observado · 08–11, 24, 25; reels de maior engajamento (`redes/analise.md`) |
| N14 | **Prova na tela, sempre nossa** — o buraco deles (prova declarada, famosos, "100 milhões" falado) é o nosso padrão vencedor. | observado o buraco (sync 12–16, 21, 27–29) · vantagem inferida |

## Anti-padrões revistos (v4.0)
**Caíram da lista v3.0** (eles fazem e não é erro): música sob a voz (com voz acima da cama) · dissolve/fade pontual · legenda de 1 linha ·
preço na tela no RMK e no produto de entrada.
**Continuam valendo:** logo gráfico frequente · URL/telefone na tela · talking-head com sincronia labial no estilo dele (a nossa receita
talking-head v2 é OUTRA linguagem, não misturar) · CTA verboso · mais de 1 cor de acento por camada · saturação de "cinema padrão".
**Novos (não fazer, mesmo que eles façam):**
1. Urgência falsa ("o pixel rastreia… nunca mais volta") e cronômetro que reinicia [observado 01 @ 33,9; checkout RMK].
2. Material de terceiros: trechos de série/filme, famosos, logos de outras marcas, telejornal [observado 12, 21, 22, 24, 26, 29].
3. Música comercial (Shazam identificou faixas de artistas em 17 vídeos) — só biblioteca licenciada [observado, `ads/*/trilha.md`].
4. Prova declarada sem tela ("100 milhões", "8 em cada 10") [observado 04, 08–11, 13].
5. Conjuntura política como gancho [observado 21, 22].
6. "Toque no botão" / "Saiba mais" falado no orgânico, onde não há botão; link da bio quebrado [observado, `redes/analise.md` §4; `landing/bio`].
7. Preço/ficha da oferta divergente entre vídeo, página e checkout [observado, `FUNIL-2026-10.md` §3].
8. Nota/avaliação inventada na página ("★ 9.8") e barra de progresso agressiva [observado, `landing/serie/analise.md`].
9. Paleta deles: teal + laranja, vermelho #D4101C de acento, magenta do RMK, roxo do checkout — nunca na nossa peça.
10. Mascote cabeça-de-câmera ou qualquer personagem deles.
11. Voz enterrada na cama (12: 3,4 dB; 21: áudio 2,8 dB **acima** da voz) [observado].

## Roteador — qual estilo para qual objetivo
| Objetivo / situação | Estilo | Skill | Produto típico |
|---|---|---|---|
| Frio, defender uma tese, sem rosto, universo único com a página | HQ-IA noir (A manifesto) | `eva-hq-ia-noir` | FCA, MCT |
| Frio cético, atenção sem promessa | Trailer de mundo (B) | `eva-hq-ia-noir` | MCT, FCA |
| Mostrar o output do produto para uma profissão | Anúncio-dentro-do-anúncio | `eva-anuncio-dentro-do-anuncio` | **FCA**, MLC, MCT |
| Prova barata e crível, "gravado agora" | POV do produto (tela) | `eva-pov-produto` + `painel-do-comprador-na-cena` | **MCT**, MLC, FCA |
| Dono de negócio → conversa/diagnóstico | Ensaio noir para empresário | `eva-ensaio-noir-empresario` | MCT (tracking), Diagnóstico da Escala |
| Quente, recuperar quem não comprou | Remarketing honesto | `eva-remarketing-escassez` | MCT, MLC, FCA |
| VSL longa, público cético, testar formato de página | Série de vendas / player de capítulos | `serie-de-vendas` | MCT, FCA |
| Só o gancho / os 3 primeiros segundos | — | `gancho-dos-tres-segundos` | todos |
| Analisar outro vídeo de referência | — | `estilo-por-referencia` (1 vídeo) / `map-editing-style` (lote, rota gratuita 2026-10) | — |
Encadeamento: `motor-de-video` → skill do estilo → `direcao-de-edicao-ia` (briefing e amostra) → `gancho-dos-tres-segundos` +
`painel-do-comprador-na-cena` + `cta-e-fechamento` → `variacoes-de-criativo-ia` (1 vídeo por anúncio no teste).

### Roteiro e processo de escrita (fora desta skill)
- **Roteiro** (atos KI/SHŌ/TEN/KETSU, tipos de lead e de plot twist, pitch, números de duração e palavras, divergência de urgência) → use `vsl-kishotenketsu` (+ `REFERENCIA.md` com 6 VSLs reais decupadas).
- **Processo de escrita** (ideia → pesquisa de dor → oferta antes → rascunho → voz alta → contagem → enxugar → 5 perguntas → teste de lead/hook) → use `copy-do-zero-backstage`.
- Esta skill cuida do visual e da escolha de estilo; as duas acima cuidam do texto.

**5 apostas para testar primeiro** (`05-ANALISE/leitura.md`): (1) FCA "um [profissional] pediu; a fábrica entregou isto";
(2) MCT POV da tela com o número; (3) MCT analogia do rastreio → Events Manager; (4) VSL em capítulos com nome-recompensa;
(5) personagem-guia em HQ-IA para a série de anúncios da FCA.

## Números de VSL medidos (v4.1 — 15/10/2026)
Fonte: `projetos/vsl-mct/00-estudo/BIBLIA-EVA-VSL.md` (medições 2026 das VSLs Estilo Visual de Anúncio (EVA); chaves em `receita-medida.json`). Substituem as estimativas antigas do curso (110–120 ppm; revelação ≈ 58 %; garantia só ≥ 30 dias) nas VSLs longas.

| Número | Valor medido | Antes (curso) |
|---|---|---|
| Velocidade de fala | **165 ppm** (158–169; só fala, sem pausas: 172–182) | 110–120 ppm |
| Twist (revelação do mecanismo) | **45–55 % da VSL** | ≈ 55–60 % |
| Nome do produto | **≤ 65 %** (medido 42–63 %) | ≈ 58 % |
| Preço | **73–79 %** | ≈ 78 % |
| Garantia | ≥ 30 dias; **7 dias só reenquadrada como teste** (CDC art. 49), dita 1× depois do preço | só ≥ 30 dias |
| Cortes/s, quedas de cama, voz − cama, rajadas | por ato, na bíblia (voz − cama 9–10 dB no corpo; rajada a cada ~50–70 s só no KI/SHŌ) | — |

Texto da VSL e uso dos números: `vsl-kishotenketsu`. Efeitos, som e grade medidos: `catalogo-de-efeitos`.

## Regras da casa ao aplicar qualquer estilo
- 9:16 primeiro; 4:5 só se pedir. Transcrição só local (`bin/transcrever.py`). Nunca API paga sem autorização.
- Criativo em PAR (pago "Saiba mais" + orgânico "Digite X", 3 capas, legenda .txt) — exceto anúncio por profissão/avatar (só pago).
- Anúncio por profissão: profissão GRANDE como 1ª palavra + símbolo da classe; só em campanha aberta, nunca em públicos personalizados.
- FCA: o autor nunca aparece em criativo de cliente; criativo nunca fala data de liberação.
- Voz clonada nunca sobre vídeo do autor falando. B-roll sóbrio. Faixa de topo com degradê, nunca borda dura.
- Depois do lote de renders: `python3 bin/economia-disco.py --limpar`.

---

# HISTÓRICO — matriz EN desligada em 2026 (v3.0, 15/05/2026)

> Tudo abaixo descreve a matriz de maio/2026 (185 anúncios, 97 % em inglês). Em 12/10/2026 **nenhum** desses anúncios estava ativo.
> Vale como referência histórica e para as regras que MANTIVERAM (ver tabela acima). Não usar como padrão atual.

# 🆕 v3.0 — Insight crítico (2026-05-15)

**Estilo Visual de Anúncio (EVA) NÃO produz centenas de ads. Produz ~10 master MP4s e os multiplexa em 200+ ad IDs no Meta** (re-uploads byte-idênticos verificados via MD5 hash em frames). Cada cluster de scripts (SC001-SC010) = 1 master que roda em 2-89 ad IDs distintos pra resetar learning phase / bypass frequency caps.

**Modelo darwinista**: 167 ads sobreviveram 8+ meses, 33 pausados desde Abril, 18 ressuscitados, **ZERO criativos novos em 35 dias**.

**Implicação operacional**: produzir UM master excelente > produzir 89 variantes. Multiplexar via ad IDs múltiplos. Replicar disciplina de pause/resurrect.

---

## v3.0 MATRIZ ATIVA — 10 SCRIPTS CANÔNICOS (Maio/2026)

| ID | Nome | Lang | Dur | Airings | Hook |
|---|---|---|---|---|---|
| **SC001** | Terror & Absurdity | EN | 39s | **89** (48%) | "I'm the first in the US to sell digital product without promises..." |
| **SC002** | Copywriting Deep | EN | 49s | 46 (25%) | "Think you're good at copywriting? Alright, but how deep..." |
| **SC003** | Promises Don't Slap | EN | 59s | 43 (23%) | "A promise that used to slap but now don't mean jack..." |
| **SC004** | Quick Course | EN | 43s | 28 (15%) | "Putting together a quick online course and thinking it's gonna blow up..." |
| SC005 | EVA no feed | PT | 51s | 2 | "Quando o anúncio da EVA aparece no seu feed..." |
| SC006 | É só traquear | PT | 80s | 2 | "É só traquear a campanha. Foi isso que eu ouvi..." |
| SC007 | Escala infinita ROID 10 | PT | 65s | 2 | "A escala infinita com ROID 10 começa em um escritório fedido..." |
| SC008 | ROI cai com escala | PT | 54s | 2 | "Você fica aí tentando escalar seus produtos..." |
| SC009 | Pasta de anúncios (SHORT) | PT | 26s | 2 | "Pega a sua pasta de anúncios... quantos validou..." |
| SC010 | EVA na sua empresa | PT | 44s | 2 | "Você já imaginou o poder dos seus anúncios se a EVA estivesse..." |

**Top 4 EN = 80% das airings totais.** PT-BR é 6% do budget. **39s é o sweet spot validado.**

---

## v3.0 REGRAS CANÔNICAS — 30 specs (extraídas de 42.706 frames @ 4fps)

### A. Estrutura & Cadência
1. **Formato:** 9:16 vertical 1080×1920 @ 30fps
2. **Duração ótima:** 39-49s EN / 26-80s PT-BR (39s sweet spot)
3. **Cut rhythm tri-fase EN:** 3 cuts/sec hook (0-10s) → 1.5/sec body → 0.5/sec CTA dwell
4. **Cut rhythm PT-BR:** 1-1.5s hook → 2-2.5s body → 3-4s CTA (mais lecture-y)
5. **Pontuação preta:** 1-3 single-frame full-black "punctuation beats" sincronizados a respiros do VO
6. **Tail preto:** últimos 1.5-2s sempre fade-to-black (memory imprint)

### B. Tipografia (v4 — atualizado)
7. **Headline slam:** Druk Wide Bold / Anton Black / Bebas Neue Pro Expanded — 110-140px em frame de 720w
8. **Body narration:** Inter Regular / SF Pro Display — 36-44px (secondary system)
9. **Tratamento:** ALL CAPS sempre, `letter-spacing: -0.02em`, `font-weight: 900`, `line-height: 0.95`
10. **Layout:** 2-3 linhas stacked, dead-center horizontal. NUNCA single line. NUNCA italics.
11. **Cores texto EN:** branco `#FFFFFF` default + vermelho `#E0223A`/`#E5252C` em palavra-bomba
12. **Cores texto PT-BR:** branco default + UMA accent por ad (amarelo `#F7E516` decisão / magenta `#E91E63` data / mint `#7FFFD4` emoção / verde `#3FE875` payoff / vermelho `#E63946` ação)
13. **Reveal slam-in:** `spring({damping:12, stiffness:220})` em scale [1.15→1.0] em 6 frames
14. **Reveal word-by-word:** 4-frame fade por palavra
15. **Motion-blur slide-in (PT-BR opener):** 300ms da esquerda
16. **RGB-split glitch transition:** 3 cópias offset ±3px (`#FF0040`/`#00FFFF`/`#FFFFFF`)
17. **Lower-third gradient mask:** `linear-gradient(to top, rgba(0,0,0,0.8), transparent)` quando texto sobre B-roll

### C. Color & Grading
18. **Background dominante:** `#000000` puro >60% screen time
19. **LUT EN:** `filter: hue-rotate(-15deg) saturate(0.7) brightness(0.85)` (green-shift Magic Bullet)
20. **LUT PT-BR:** 3 variantes — yellow-green duotone (controle) / white-shock+magenta (data) / amber tungsten (psicologia)
21. **Sodium-vapor green** `#7A7A35`: signature em corredores horror

### D. Composição & Overlay
22. **Padrão majoritário:** top-half live action + bottom-third black caption bar
23. **Letterbox 9:16:** image top ~55%, bottom 45% reservado para caption zone preta
24. **NUNCA usar:** dissolves, fade-to-color, picture-in-picture tradicional, split-screen 50/50

### E. Assets recorrentes
25. **Brand presence:** Estilo Visual de Anúncio (EVA) logo **AUSENTE** em 95% dos ads. Branding via tipografia + ritmo
26. **CTA pointer:** **double/triple-chevron `▼▼`** brancos animados (bouncing 30-frame loop) apontando pro Learn More do Meta
27. **Metáforas mecanismo:** Fire emoji = "fire copy" / Brain anatômico = "triggers" / Siren = pattern interrupt / CCTV = surveillance/autoridade (PT-BR) / Laser-eyes = villain reveal
28. **Eye/iris extreme close-up:** signature ending (SC001) — "look me in the eye"

### F. Audio
29. **VO non-diegetic:** narrador nunca aparece em câmera. Music drop **pós-CTA** (2Pac, Queen, lyrical chorus). Speech density 220-230 WPM. NUNCA música durante VO.
30. **CTA verbiage:** EN = "HIT THE LINK / CLICK THE BUTTON BELOW" / PT-BR = **"FAÇA SUA APLICAÇÃO."** (com período — application gate high-ticket). NUNCA URL/phone/price on-screen.

---

## v3.0 TEMPLATES REMOTION (3 specs prontos)

### Template A — EN Estilo Visual de Anúncio (EVA)-style (SC001 base, 39s)
```ts
// composition: 1080×1920 @ 30fps, durationInFrames = 1170
const BG = '#000000', FG = '#FFFFFF', RED = '#E0223A';
const LUT = 'hue-rotate(-15deg) saturate(0.7) brightness(0.85)';

// Headline
<h1 style={{
  fontFamily: 'Druk Wide, Anton, Impact',
  fontWeight: 900, fontSize: 130, letterSpacing: '-0.02em',
  textTransform: 'uppercase', color: FG, lineHeight: 0.95,
  transform: `scale(${spring({frame, fps, config:{damping:12, stiffness:220}})})`
}}>LIES</h1>

// Cut schedule: <Series.Sequence durationInFrames={[40,30,30,30,30,...,120,120]} />
// CTA: eye-closeup top half + chevron ▼▼ bottom (4s dwell)
// Punctuation beats: single-frame black at frame 90, 150, 712
```

### Template B — PT-BR low-ticket (SC009 short-form, 26s)
```ts
// 780 frames @ 30fps
// Cold open with motion blur (0.5-1s) → 3-card spine
// 1. Hook caption 3s | 2. Typography statement 5s | 3. Mockup proof 5s | 4. B-roll + spoken CTA 8s
const ACCENT_GREEN = '#3FE875';  // payoff color
// No on-screen CTA card — relies on Meta button
// Font: Anton Black 110-130pt, white default, ONE keyword green
```

### Template C — PT-BR high-ticket (SC006 application gate, 80s)
```ts
// 2400 frames @ 30fps
// White-frame motion-blur opener (2s) → snap to black → 3-line stacked typo
// Body: stock B-roll + bespoke talent (suit, brick wall, glasses, coffee)
// Magenta keyword #E91E63 for "PIXEL/DATA/CONVERSÃO"
// CTA: "FAÇA SUA APLICAÇÃO." (period) + triple-chevron ▼▼▼ over cinematic suited man shot
// Hold CTA 6-10s. Fade to black 1.5s final.
```

---

## v3.0 PIPELINE OPERACIONAL (engenharia reversa)

**Como Estilo Visual de Anúncio (EVA) realmente opera** (validado por MD5 + cross-section):
1. **Roteiriza** 1 script novo a cada 4-6 meses (~10 scripts vivos)
2. **Produz UM master MP4** por script (custo estimado $5-15k: motion design + B-roll commissioned + VFX)
3. **Multiplexa** via re-upload do mesmo master sob 30-89 ad IDs distintos
4. **Cada ad ID** começa learning phase fresca no Meta
5. **Pausa por fadiga** (não por má performance) — 33 pausados Abr→Mai
6. **Ressuscita** ads inativos quando o algoritmo "esquece" (18 ressuscitados Abr→Mai)

**Replicar pro o autor:**
- ❌ NÃO produzir 89 variantes
- ✅ Produzir UM master excelente seguindo 30 regras acima
- ✅ Re-upload sob 5-20 ad IDs distintos no mesmo ad account
- ✅ Pausar por fadiga (CTR cai 30%+ do baseline), não por má performance inicial
- ✅ Ressuscitar 60 dias depois

---

## v3.0 ANTI-PATTERNS (não fazer)

1. ❌ Logo Estilo Visual de Anúncio (EVA) on-screen frequente — eles escondem brand, prejudica nativo-feel
2. ❌ URL/phone/preço on-screen — quebra Meta-native flow
3. ❌ Dissolves/fades suaves — só hard cuts
4. ❌ Texto serifado — quebra DNA tipográfico
5. ❌ Talking-head com mouth-sync — VO sempre non-diegetic
6. ❌ Música durante VO — music drop é pós-CTA
7. ❌ CTA verboso ("Compre agora") — usar minimal pointer
8. ❌ Single-line caption — sempre 2-3 linhas stacked
9. ❌ Múltiplas accent colors num ad só — UMA cor por criativo
10. ❌ Saturação cinematográfica padrão — Estilo Visual de Anúncio (EVA) é low-sat + crushed blacks

---

## v3.0 ARQUIVOS DE REFERÊNCIA (v2 análise — Maio 2026)

```
conhecimento/analysis/eva-ads-v2/DOSSIER-v4-SINTESE.md            ← síntese 30 regras + insight multiplexing
conhecimento/analysis/eva-ads-v2/00-catalogo.md                   ← 218 ads catalogados (SURVIVOR/RESURRECTED/PAUSED)
conhecimento/analysis/eva-ads-v2/visual/01-SC001-terror-absurdity.md     ← DNA detalhado #1 EN
conhecimento/analysis/eva-ads-v2/visual/02-SC002-SC003-en.md             ← DNA #2-3 EN
conhecimento/analysis/eva-ads-v2/visual/03-SC004-quick-course.md         ← DNA #4 EN
conhecimento/analysis/eva-ads-v2/visual/04-SC005-SC006-SC007-ptbr.md     ← DNA PT-BR 5-7
conhecimento/analysis/eva-ads-v2/visual/05-SC008-SC009-SC010-ptbr.md     ← DNA PT-BR 8-10
conhecimento/analysis/eva-ads-v2/transcripts/script_clusters.json        ← clusters de scripts únicos
conhecimento/analysis/eva-ads-v2/frames-4fps/{ad_id}/{hash}/             ← 42.706 frames @ 4fps
conhecimento/analysis/eva-ads-v2/relatorio_anuncios_v2.html              ← navegável com filtros
```

---

# Estilo Visual de Anúncio (EVA) Style — DNA de Produção de Vídeo (legacy v2.1 — referência histórica)

> A Estilo Visual de Anúncio (EVA) não produz vídeos — produz **manifestos visuais**. Cada peça é tratada como trailer de filme noir. Identificável em 2 segundos: preto absoluto, tipografia de impacto tela cheia, avatar câmera, cor só onde importa, zero talking head.

---

## REGRAS INVIOLÁVEIS

| # | Regra |
|---|-------|
| 1 | Fundo padrão = preto absoluto `#000000` |
| 2 | Overlay `rgba(0,0,0,0.5)` em todo footage |
| 3 | Zona morta inferior preta (espaço do botão da plataforma) — só ads 9:16 |
| 4 | Abertura nunca apresenta a empresa — apresenta a dor, o símbolo, ou a crença a destruir |
| 5 | Uma ideia por frame — máximo 4 palavras em texto de impacto |
| 6 | CTA = texto bold caps + chevrons animados + mesmo b-roll do bloco anterior |
| 7 | Verde = semântica de sucesso/dinheiro/criativos — NUNCA decorativo |
| 8 | Vermelho = marcador semântico central (PT-BR: mecanismo/prova; EN: contexto define) |
| 9 | Corte seco como transição padrão — fade preto de 1s entre BLOCOS (não entre frames) |
| 10 | Peso tipográfico conta a história: Light=virada/problema, ExtraBold/Black=impacto/CTA |

## REGRAS ALTAS

| # | Regra |
|---|-------|
| 11 | Avatar câmera = símbolo de marca recorrente, pode abrir e fechar o vídeo |
| 12 | Números de prova aparecem sozinhos, tela cheia, vermelho |
| 13 | Screenshots são capturados ao vivo (handheld, tremido) — nunca mockup |
| 14 | Prova visual > descrição verbal |
| 15 | Virada narrativa obrigatória com adversativa ("Porém", "Mas", "However") |
| 16 | B-roll P&B = máx 2–3s, função de pausa de autoridade — nunca bloco inteiro |
| 17 | Variante A/B testa exatamente 1 variável por vez |
| 18 | CTA = último 25% do vídeo — mantém o MESMO b-roll durante todo o bloco |
| 19 | Paleta tem função narrativa, não estética |
| 20 | Texto sobre preto puro pode ocupar até 45% do vídeo |

## REGRAS MÉDIAS

| # | Regra |
|---|-------|
| 21 | Ícones vetoriais simples substituem b-roll em momentos conceituais/técnicos |
| 22 | Infográfico puro (sem b-roll humano) funciona para argumentos técnicos/educativos |
| 23 | Split-screen vertical: dois vídeos empilhados = poder + resultado simultaneamente |
| 24 | Fundo branco = pattern interrupt máximo — único entre os 6 ads PT-BR (AD6 hook) |
| 25 | Mecanismo único apresentado com tipografia vertical empilhada |
| 26 | Meta-copy: o vídeo demonstra ao vivo o que vende |
| 27 | Elemento surreal (máscara cavalo, skull emoji) entra APÓS toda a argumentação |
| 28 | Escalada de chevrons (↓ → ↓↓ → ↓↓↓) em CTAs de vídeos >40s |
| 29 | Fechamento circular: CTA volta ao símbolo/b-roll de abertura quando possível |
| 30 | Fade-in gradual de texto (1s) antes do peso bold = suspense + leitura forçada |

---

## PALETA CANÔNICA

| Camada | Hex | Uso |
|--------|-----|-----|
| Fundo master | `#000000` | 70-80% de qualquer vídeo |
| Texto principal | `#FFFFFF` | Corpo de texto e impacto geral |
| Texto editorial | `#F5F0E8` | Textos de destaque em VSL |
| Acento narrativo | `#E80000` | Mecanismo único, números, prova (PT-BR); verdade ou mentira (EN) |
| Semântica positiva | `#00E060` | Sucesso/validação/dinheiro — 1 uso por vídeo |
| Overlay B-roll | `rgba(0,0,0,0.5)` | Sobre todo footage |

### Paletas de acento por ad (PT-BR — HC original)

| Ad | Cor de acento | Função |
|----|--------------|--------|
| AD1 | Verde `#00CC66` | "SÃO VALIDADOS" — único acento do ad |
| AD2 | Preto + logo câmera | Autoridade via símbolo |
| AD3 | Verde dominante `#00CC66` | Paleta verde completa (criativos) |
| AD4 | Amarelo/verde `#C8E000` | Color grade unificado em 100% do footage |
| AD5 | Neutro | Contraste via peso tipográfico |
| AD6 | Verde em "CRIATIVOS" | Conceito de valor positivo |

### Paletas de acento por produto (o autor — validado 26 vídeos)

> **Regra:** 1 cor de acento fixa por série. Mantida em TODOS os vídeos da série sem exceção.

| Produto | Acento Principal | Acento Secundário | Uso |
|---------|-----------------|-------------------|-----|
| Mkt Digital do Zero | Verde `#3ECF00` | Âmbar `#C87800` | Verde = solução/dinheiro; Âmbar = problema passado |
| Campanhas de Controle | Laranja `#FF6B00` | Vermelho `#FF2020` | Laranja = alerta; Vermelho = perda/prejuízo |
| Pixel Otimização | Teal `#00B4CC` | Pink neon `#FF2D78` | Teal = era dourada; Pink = borda de callout |
| Super Públicos | Âmbar/Ouro `#D4900A` | Vermelho `#CC0000` | Âmbar = público/segmentação; Vermelho = ROI negativo |

---

## SEMÂNTICA DE CORES

### Verde
- Aparece SEMPRE junto ao conceito de sucesso com criativos, validação, dinheiro
- Nunca decorativo — cada uso comunica um conceito
- PT-BR e EN: mesmo significado de sucesso/dinheiro
- Exemplos: "SÃO VALIDADOS" (AD1), paleta dominante (AD3), ícone mão+moeda (COPY4)

### Vermelho
- PT-BR: mecanismo único, número de prova, o dado mais importante
- EN: **contexto define o sentido**
  - COPY2: vermelho = verdade ardente ("SELLING THE TRUTH WITH A FIRE")
  - COPY3: vermelho = mentira do mercado ("LOSE WEIGHT." = promessa falsa)
- Regra EN: vermelho é marcador semântico do conceito central — nunca decorativo

### Preto
- 70-80% de todo vídeo — não é ausência de design, é convicção
- Fundo preto + texto = argumento puro sem distração visual

---

## TIPOGRAFIA — REGRAS DE PESO

| Peso | Momento | Função |
|------|---------|--------|
| ExtraBold/Black | Perguntas, CTAs, títulos de impacto | Urgência, certeza, impacto |
| Regular/Medium | Copy de desenvolvimento | Leitura contínua |
| Light/Thin | Viradas, adversativas ("PORÉM") | Respiração, contraste, vulnerabilidade |
| Fade-in gradual 1s | Entrada de argumento principal | Suspense, leitura forçada |

**Regra:** Light sinaliza virada/contradição. É a única vez que a fonte perde peso — e é calculada, não acidental.

---

## ESTRUTURA UNIVERSAL — 5 BLOCOS

```
[HOOK visual] → [ARGUMENTO/PROVA] → [VIRADA emocional] → [PRÉ-CTA] → [CTA dominante]
     1–3s            10–25s               ~5s                ~3s           8–16s
```

### Proporções por duração de ad

| Ad | Duração | Hook | Argumento | Virada | Pré-CTA | CTA |
|----|---------|------|-----------|--------|---------|-----|
| AD1 | 35s | 0-1s | 2-18s | — | 19-24s | 25-34s (9s, 26%) |
| AD2 | 51s | 0-6s | 7-36s | — | 36-41s | 42-51s (~10s, 20%) |
| AD3 | 57s | 0-15s | 15-44s | — | — | 45-57s (~13s, 23%) |
| AD4 | 52s | 0-3s | 3-44s | — | — | 45-52s (~8s, 15%) |
| AD5 | 65s | 0-5s | 5-54s | ~20s | — | 55-65s (~10s, 15%) |
| AD6 | 80s | 0-1s | 1-64s | — | — | 65-80s (~16s, 20%) |

**Regra:** CTA aparece quando sobram ~25% do vídeo. Ads mais longos = CTA começa mais tarde em segundos, mesma proporção.

### Estrutura detalhada (versão completa)

```
0-5s    HOOK       → Dor, crença errada, objeto simbólico, ou fato incomum. NUNCA apresentação da marca.
5-35%   PROBLEMA   → Aprofunda. Usa B-roll de dor ou screenshot de erro.
35-65%  ARGUMENTO  → Texto puro fundo preto. Infográfico se conceitual.
65-75%  VIRADA     → "Porém" / "Mas" / adversativa obrigatória. Fonte light.
75-85%  SOLUÇÃO    → Auto-referencial. Prova visual se disponível.
85-100% CTA        → Mesmo b-roll. Texto bold + chevrons escalonados.
```

---

## CTA — REGRAS PRECISAS

1. **Timing:** aparece nos últimos 25% do vídeo
2. **B-roll:** mantém o MESMO footage do bloco anterior — não corta para novo visual
3. **Texto:** CAPS + ExtraBold + cor de acento do ad
4. **Chevrons:** escalada progressiva (↓ → ↓↓ → ↓↓↓) em vídeos >40s
5. **Duração mínima:** 8s (PT-BR), ~7s (EN)
6. **CTA duplo:** válido — primeiro CTA leve em ~50% do vídeo, CTA dominante nos últimos 25%
7. **PT-BR examples:** "TOQUE EM SAIBA MAIS", "CLIQUE NO BOTÃO ABAIXO", "TOCANDO EM"
8. **EN examples:** "OR HIT THE LINK IN", "HIT THE LINK"

---

## B-ROLL — REGRAS

### Tipos e funções

| Tipo | Função | Duração |
|------|--------|---------|
| B-roll P&B | Pausa de autoridade/seriedade — nunca dura mais de 2-3s | 2–3s max |
| Close extremo (olho/boca) | Intimidade/contato direto — usado no CTA ou virada | 3–5s |
| Split-screen vertical | Mostrar autoridade vs. cotidiano simultaneamente | 5–10s |
| Color footage | Cenas emocionais — sempre com overlay `rgba(0,0,0,0.5)` | Livre |
| Elemento surreal | Quebra de padrão calculada — entra APÓS argumentação completa | 3–10s |
| Infográfico puro | Argumentos técnicos/conceituais — zero b-roll humano | Livre |

### Progressão de intimidade (padrão EN — COPY3)

```
Frame 0:  Distância (estátua + pessoa, split-screen)
Frame 20: Close médio (boca/fragmento do rosto)
Frame 38: Close extremo de olho → CTA
```

Intimidade cresce junto com urgência de compra.

---

## PT-BR vs EN — COMPARATIVO COMPLETO

| Dimensão | PT-BR | EN |
|----------|-------|-----|
| **Prova social** | Screenshots reais (alunos, arquivos de trabalho) | Ausente — argumento simbólico/estético |
| **Abertura** | Pergunta direta à dor ("Quantos anúncios?") | Objeto simbólico ou personagem estilizado |
| **B-roll humano** | Amplo — situações cotidianas do lead | Mínimo — closes extremos ou simbólico |
| **Verde** | Semântica de sucesso/validação | Semântica de dinheiro/desejo |
| **Vermelho** | Mecanismo/prova (não comum nos ads) | Verdade OU mentira — contexto define |
| **Duração CTA** | 8–16s (25% do vídeo) | ~7s (mais curto) |
| **Split-screen** | AD2 (logo câmera + resultado) | COPY3 (estátua + pessoa — autoridade) |
| **Elemento surreal** | Máscara de cavalo (AD1) | Skull emoji (COPY2), closes de partes do corpo |
| **Infográfico** | AD3 (setas/ícones ADS), AD4 (funil) | COPY2 (chama), COPY4 (mão+moeda) |
| **Tom geral** | Didático + emocional + prova explícita | Desafiador + simbólico + argumento estético |
| **Screenshots** | 5s no meio do ad (AD1: alunos + sistema) | Zero — audiência EN rejeita |
| **B-roll P&B** | Inserido no meio (lupa AD1, mulher AD2) | Abertura intelectual (COPY4) |

---

## REGRAS DE PRODUÇÃO PT-BR (10 regras — análise 1fps)

1. **Fade preto de 1s entre blocos** — sempre. Respira o argumento.
2. **Texto verde = conceito de ganho** — nunca usar verde decorativamente.
3. **CTA = último 25% do vídeo** — mantém o mesmo b-roll durante todo o bloco.
4. **Fonte light para virada** — uma palavra/frase em peso leve cria contraste semântico ("PORÉM").
5. **B-roll P&B = 2–3s máximo** — pausa de autoridade, não bloco inteiro.
6. **Escalada de chevrons** (↓ → ↓↓ → ↓↓↓) em CTAs de vídeos >40s.
7. **Hook de inversão** (fundo branco/espelho/elemento incomum) funciona como abertura — quebra padrão antes do scroll.
8. **Prova social via screenshot** = 5s no meio do ad (após argumento, antes de CTA) — PT-BR obrigatório quando disponível.
9. **Split-screen vertical** é formato válido para mostrar "poder + resultado" simultaneamente.
10. **Infográfico puro** (sem b-roll humano) funciona para argumentos conceituais/técnicos.

---

## REGRAS DE PRODUÇÃO EN (8 regras — análise 1fps)

1. **Abertura com símbolo**, não com pessoa comum — objeto que representa o ofício ou autoridade (máquina de escrever, estátua, personagem neon).
2. **Close de olho no CTA** = padrão do script mais lucrativo (COPY3, 89 ads rodando). Replicar.
3. **Split-screen de autoridade**: objeto cultural/permanente (estátua, monumento) + humano real. Cria "eu sou diferente" sem dizer.
4. **Vermelho = marcador semântico** — usa para o conceito central (verdade ou mentira), nunca decorativo.
5. **Verde = dinheiro/desejo** — ícone de moeda/mão basta para acionar o gatilho.
6. **Zero screenshots** no EN — audiência EN rejeita prova social explícita, prefere argumento estético.
7. **B-roll P&B na abertura** = tom intelectual/desafio. Usar quando o hook é ego challenge.
8. **Intimidade progressiva**: distância → close médio → close extremo ao longo do vídeo.

---

## FORMATOS VISUAIS POR AD (referência)

| Ad | Formato principal | Diferencial |
|----|------------------|-------------|
| AD1 | B-roll color + texto overlay | Máscara de cavalo (surreal), CTA duplo |
| AD2 | Split-screen vertical | Logo câmera Estilo Visual de Anúncio (EVA) no split |
| AD3 | Infográfico puro + ícones | Zero b-roll humano na parte central |
| AD4 | Color grade unificado (duotone) | Fundo amarelo claro único (inversão) |
| AD5 | Texto bold + close extremo | Fonte thin para virada ("PORÉM") |
| AD6 | Fundo branco na abertura | Myth-busting hook entre aspas |
| COPY1 | B-roll warm + texto fragmentado | Abertura silenciosa (sem overlay de texto) |
| COPY2 | Paleta magenta/neon | Ícone chama vermelha + skull Easter egg |
| COPY3 | Split-screen + closes progressivos | Intimidade boca→olho até CTA |
| COPY4 | B-roll P&B + infográfico | Máquina de escrever como símbolo do ofício |

---

## ESTRUTURAS NARRATIVAS

### Ad (30-80s)

```
0-5s    HOOK    → Dor, crença errada, objeto simbólico, ou elemento incomum.
5-35%   AGITAÇÃO → Aprofunda. B-roll colorido + perguntas provocativas.
35-65%  ARGUMENTO → Texto puro fundo preto. Infográfico se conceitual.
65-75%  VIRADA  → "Porém" / adversativa. Fonte light. B-roll P&B opcional (2-3s).
75-85%  PRÉ-CTA → Promessa / prova social (screenshot 5s se PT-BR).
85-100% CTA     → Mesmo b-roll. Texto bold + chevrons escalonados.
```

### VSL (5-20min)

```
ABERTURA   → Avatar/símbolo de marca. Escuro, cinematográfico. Sem apresentação.
HOOK       → Credencial de exclusividade. "Único vídeo do Brasil que..."
MECANISMO  → Nome próprio (ICO, etc). Apresentado em texto vertical empilhado.
INIMIGO    → Screenshots ao vivo do que não funciona. Analisado criticamente.
PROOF      → Número gigante tela cheia (vermelho). Depois contexto.
DEMO       → Área de membros real. Thumbnails. Episódios. Estrutura visível.
STACK      → Cada produto com preço. Soma total. Revela preço final menor.
CTA #1     → Botão verde. Mencionado verbalmente + referência visual.
META-COPY  → "Percebeu que não usei urgência falsa?" — demonstração ao vivo.
CTA #2     → Repetição com urgência implícita. Avatar fecha o arco.
```

---

## GUIA POR FERRAMENTA

### REMOTION — Templates disponíveis

**Localização:** `kit/src/estilo/`

| Template | Arquivo | Uso |
|----------|---------|-----|
| `TextImpact` | `TextImpact.tsx` | Texto único tela cheia, bold caps, cor configurável, entrada spring |
| `NumberReveal` | `NumberReveal.tsx` | Número gigante vermelho, animação scale |
| `CTAChevron` | `CTAChevron.tsx` | Texto CTA + chevrons stagger + fundo preto |
| `MechanismReveal` | `MechanismReveal.tsx` | Letras empilhadas verticalmente (ICO pattern) |
| `BRollOverlay` | `BRollOverlay.tsx` | Video + overlay escuro + texto zona inferior |

**Composição demo:** `kit/src/estilo/EstiloImpactoDemo.tsx` (30s funcionando)

| Elemento | Como reproduzir no Remotion |
|----------|-----------------------------|
| Texto tela cheia animado | `<AbsoluteFill>` + `useCurrentFrame` + spring/interpolate |
| Número gigante vermelho | Font Black Condensed + `#E80000` + scale spring |
| ICO vertical empilhado | Mapeamento de array com stagger delay |
| Fade to black entre blocos | `<Sequence>` com `opacity` interpolado (30 frames = 1s) |
| Overlay sobre B-roll | `<Video>` + `<AbsoluteFill style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>`|
| Chevrons escalonados | SVG com `strokeDasharray` ou stagger por item |
| Seta verde CTA | SVG `#00E060` com `translateY` spring |
| Fade-in gradual de texto | `opacity: interpolate(frame, [0, 30], [0, 1])` |
| Color grade duotone | CSS filter `sepia()` + `hue-rotate()` + `saturate()` |

### KLING — Geração de B-roll

**Regra:** sempre pedir `black and white` ou `monochromatic` + `cinematic noir` + `dramatic lighting`

| Cena | Prompt |
|------|--------|
| Avatar câmera | `"A figure wearing a security camera as a head, formal suit and tie, white robe, dramatic spotlight from above, dark background, cinematic, noir, photorealistic"` |
| Silhuetas abstratas | `"Three featureless human silhouettes standing in an abandoned industrial warehouse, monochromatic, cinematic lighting from above, noir aesthetic"` |
| Homem de fedora neon | `"Man in fedora hat and suit under intense purple/magenta neon lighting, dark background, cinematic noir, thriller aesthetic"` |
| Close de olho (CTA EN) | `"Extreme close-up of human eye, natural light, intense gaze directly at camera, cinematic, intimate, shallow depth of field"` |
| Máquina de escrever | `"Vintage typewriter with blank paper, moody dramatic lighting from side, black and white, cinematic, craft aesthetic"` |
| Jovem frustrado | `"Young man pressing both hands on his head in despair, dark background, dramatic lighting, close crop, cinematic"` |
| Mulher olhar direto | `"Woman with intense gaze looking directly at camera, close-up, cinematic, natural light, intimate"` |

### SEEDANCE V2 — Animar imagens estáticas

**Prompts padrão Estilo Visual de Anúncio (EVA):**
- Avatar câmera: `"slow cinematic camera push-in, subtle"`
- Close de olho: `"micro subtle movement, blink, intimate, cinematic"`
- Pessoas: `"micro facial movements, breathing, cinematic"`
- Ambientes: `"slow parallax, atmospheric, cinematic noir"`
- Máquina de escrever: `"slow zoom-in, atmospheric, noir"`

---

## PIPELINE DE PRODUÇÃO

### Ad PT-BR (30-80s)

```
1. ROTEIRO  → Hook (inversão/dor) → Argumento (texto preto ou infográfico)
              → Virada (adversativa + fonte light) → Prova social (screenshot 5s)
              → CTA (25% final, mesmo b-roll, chevrons escalonados)
2. ASSETS   → Kling: 3-4 cenas (dor, aspiração, close CTA) + Screenshots reais
3. MONTAGEM → Remotion: TextImpact (hook/argumento) + BRollOverlay (b-roll)
              + CTAChevron (CTA final) | Duração: 35-80s
4. ÁUDIO    → ElevenLabs | Testar: música vs silêncio
5. VARIANTE → Mudar 1 variável: abertura OU paleta OU b-roll central
```

### Ad EN (40-60s)

```
1. ROTEIRO  → Símbolo de abertura (não pessoa comum) → Argumento desafiador
              → Progressão de intimidade (distância → close → olho CTA)
2. ASSETS   → Kling: objeto simbólico + closes progressivos (boca → olho)
3. MONTAGEM → Split-screen se autoridade necessária | Zero screenshots
4. ÁUDIO    → Minimalista — silêncio nos momentos-chave
5. VARIANTE → Testar objeto de abertura (simbólico A vs B)
```

### VSL (5-20min)

```
1. ROTEIRO  → Estrutura 10 blocos (ver seção acima) | Mecanismo único primeiro
2. ABERTURA → Kling: Avatar câmera + 5-8 cenas b-roll emocional
3. TEXTO    → Remotion: MechanismReveal + NumberReveal + TextImpact
4. DEMO     → Screen recording real | ScreenshotDoc para ChatGPT/comparativos
5. ANIMAÇÃO → Seedance: animar avatar Kling + b-roll estático
6. MONTAGEM → Sequenciar no Remotion OU editar no CapCut/Premiere
```

---

## SOUND DESIGN (EVA Sound)

> **Princípio:** 80% do poder emocional de uma VSL/anúncio vem do som.

**Regra mestre:** nunca música/efeito contínuo — sempre cortes cirúrgicos em momentos específicos. Silêncio nas frases mais importantes.

### Mapeamento KI-SHO-TEN-KETSU → pack EVA

| Fase | Momento | Arquivos |
|------|---------|----------|
| **KI** (gancho) | Abertura / texto entrando | `BASS_Impact_*.wav`, `Slam_Deep_*.wav` |
| **SHO** (dor) | Tensão subliminar | `Dark scary drone.wav`, `Radio snow*.wav` (vol. 20-30%) |
| **SILÊNCIO** | Frases mais importantes | remover todo som — 1-2s de silêncio absoluto |
| **TEN** (virada) | Frame do "Porém" / adversativa | `Glitches_*.wav`, `Speed Rewind Kick.wav` |
| **KETSU** (CTA) | Botão / clique / recompensa | `CASH.mp3`, `Slam_Unlock_01.wav`, `Zoom_*.wav` |

| Elemento | Som |
|----------|-----|
| Texto CAPS bold entrando | `Slam_Short_*.wav` |
| Número gigante (vermelho) | `BASS_Impact_*.wav` |
| Chevrons do CTA (escalonados) | `Quick_Whip_*.wav` em stagger |
| Seta verde aparecendo | `Slam_Unlock_01.wav` |
| Screenshot "ao vivo" | `Film camera.mp3` |
| Dashboard aparecendo | `Mouse Click Double.mp3` |
| Crença sendo quebrada (hook branco) | `Glass break 01.wav` → silêncio |

**Pack localização:** `kit/public/sfx/`

---

## ELEMENTOS VISUAIS VALIDADOS (o autor — 26 vídeos / 2026-04-12)

> Fonte: `conhecimento/analysis/novos-ads/08-o autor-produtos-visual.md`

### Tipos de cena validados (além dos existentes)
| Tipo | Descrição | Frequência |
|------|-----------|-----------|
| Screenshot plataforma | Hotmart/Meta Pixel com border neon colorido no acento do produto | ~10% |
| Gráfico ROI negativo | Barras vermelhas caindo + linha lightning, dark dashboard | ~5% |
| Ícone isolado em preto | Solo, 30% da altura da tela, cor de acento | ~10% |
| Referência cultural | Clipe externo 4:3 emoldurado em preto (TV dentro do vídeo) | ~2% |

### Biblioteca de B-Roll validada
| Intenção narrativa | Imagem | Colour grade |
|-------------------|--------|-------------|
| Guru/vilão | Balaclava com olhos vermelhos brilhando | Dark, vinheta 60%, sem saturação |
| Empregado CLT | Trabalhador com capacete em armazém | Industrial escuro, tom frio |
| Vida aspiracional (gurus) | Iate aéreo no mar azul | Saturado, azul profundo, contraste |
| Promessa falsa/ilusão | Mulher deitada na grama | Outdoor, verde, luz suave |
| Urgência/prejuízo | Lâmpada de alarme siren (vermelho pulsante) | Alto contraste, vermelho dominante |
| Hook de atenção/suspense | Olhos de animal extreme close-up | Escuro, destaque nos olhos |
| Mistério/identidade oculta | Silhueta com capuz no escuro | Silhueta pura, sem detalhes |
| Revelação/solução | Fechadura com luz entrando pelo buraco | Contraste luz/escuro, hopeful |
| Sonho/ilusão vendida | Mulher em campo de flores/grama | Suave, cores quentes, out of focus |

### Ícones validados e uso
| Ícone | Estilo | Cor | Quando usar |
|-------|--------|-----|-------------|
| Check mark em círculo (brush stroke) | Outline orgânico | Verde acento | Confirmação de solução |
| Setas para baixo (múltiplas) | Flat fill | Vermelho-escuro | Queda de ROI/métricas |
| Dedo apontando (cartoon outline) | Outline branco | Branco | "Por menos de..." / preço |
| Emoji nativo isolado (💩, 🔥, etc.) | Emoji Apple nativo | Original | Momento de humor/impacto |
| Mapa 3D animado | 3D render | Cores da bandeira | Contexto nacional/Brasil |
| X sobre rosto (brush stroke) | Pincelada | Laranja `#FF4500` | Denunciar guru/inimigo |
| Gráfico de barras em queda | Flat + linha lightning | Vermelho `#8B0000` | ROI negativo / campanha que não escala |

### Regras de ícones (novas)
- Ícone NUNCA tem fundo — sempre sobre preto ou footage escurecido
- Tamanho solo: 30–40% da altura da tela
- Cor = acento do produto (positivo) ou vermelho (negativo) — nunca neutro
- Emojis nativos: usar sem estilização, tamanho grande, posição central-inferior
- Screenshots: sempre com border colorida (2–4px, cor de acento) — nunca sem frame

---

## ARQUIVOS DE REFERÊNCIA

```
conhecimento/dossiers/themes/DOSSIER-EVA-ADS-DNA.md     ← dossier 1fps completo (novo)
conhecimento/dossiers/system/DOSSIER-EVA-ESTILO.md      ← dossier completo v3.0 + seção 9
conhecimento/analysis/eva-ads/06-visual-ptbr-1fps.md              ← análise 1fps PT-BR (6 ads, 692 frames)
conhecimento/analysis/eva-ads/07-visual-en-1fps.md                ← análise 1fps EN (4 scripts, 196 frames)
conhecimento/analysis/novos-ads/08-o autor-produtos-visual.md            ← análise 26 vídeos o autor (3fps)
conhecimento/analysis/eva-vsl/01-mapeamento.md                    ← estrutura copy VSL
conhecimento/analysis/eva-vsl/02-visual-vsl.md                    ← análise visual 632 frames
conhecimento/analysis/eva-vsl/03-dna-producao.md                  ← DNA síntese completa
conhecimento/analysis/eva-ads/01-copy-timing.md                   ← DNA copy ads PT-BR
conhecimento/analysis/eva-ads/04-en-copy-timing.md                ← DNA copy EN (194 ads)
kit/src/estilo/                  ← 5 templates prontos
kit/src/estilo/EstiloImpactoDemo.tsx                  ← demo 30s funcionando
```


## ⛔ Arquivo final sem rótulo interno de produção (regra do autor, 14/10/2026)
Na hora de renderizar o ARQUIVO FINAL, retirar todo rótulo/numeração de controle da produção: etiquetas tipo "PL 001", códigos de cena/beat (B042, AD21-07), ids de take, nomes de plano, contadores. Esses números são só do processo interno; o público final não pode vê-los.
Fica só o que faz parte da CENA (texto que existe no mundo da história: tela do Gerenciador, comentário real, cardápio, placa, selo do anúncio dentro do anúncio) e os selos legais ("exemplo · números ilustrativos").
Rascunho/prévia pode ter rótulo; o render final, não. Conferir na folha de contato antes de entregar.


---

> **Antes de executar esta skill, leia `REGRAS.md` (nesta pasta) e `REGRAS-GERAIS.md` (raiz do pacote).**
> Eles trazem as regras de qualidade aprendidas em vídeos reprovados e dizem o que, no kit do curso,
> substitui cada arquivo citado acima que não veio no pacote.
