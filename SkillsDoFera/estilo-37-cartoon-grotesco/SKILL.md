---
name: estilo-37-cartoon-grotesco
description: "Estilo 'Cartoon grotesco de humor (POV)': ilustração 2D chapada, olhos gigantes, zoom contínuo e troca de bocas; piada de situação do público com corte seco para P&B. Anúncio 12-20 s, orgânico 30-60 s. Triggers: estilo 37, cartoon grotesco, POV humor, esquete."
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

# Estilo 37 · Cartoon grotesco de humor (POV)

Ilustração 2D chapada de traço grosso, olhos gigantes e pele "suja" de pintinhas, animada quase só por **zoom contínuo da câmera
e troca de 2–3 bocas**. O humor vem de uma **situação do cotidiano do seu público narrada por voz crua** (gravada ou dublada com
exagero), com **silêncio de voz no rosto de quem reage antes do punch**. Cada choque vira **corte seco para preto e branco com um
boom grave**, e o vídeo acaba em ≤ 1 s depois da piada (crash zoom nos olhos ou fade).

90 % do estilo é edição (zoom, bocas, cortes, mergulho no preto, P&B, íris, crash zoom, título, áudio) e sai de graça em código.
O que custa é desenhar os personagens (gerador de imagem) e, se quiser, a voz.

Convenção: q = quadro a 30 fps (1 q ≈ 33 ms). Valores medidos a 30 fps e válidos para 1080×1920. Efeito por efeito: `EFEITOS.md`.

## Quando usar / não usar
- **Usar:** topo de funil e Reels orgânico. Anúncio: **12–20 s, 1 piada**. Orgânico: **30–60 s, 2–3 piadas** (regra de 3: a 3ª
  repetição quebra o padrão). A dor do seu público vira esquete: o cliente que some, o lead curioso, o chefe que não entende o número.
- **Não usar:** prova com número real (estilo 1), oferta de fundo de funil, nicho em que humor pega mal (saúde grave, luto, finanças
  de quem está endividado). Sem CTA falado dentro da piada; o CTA vai na legenda/copy.

## Antes de começar
1. `python3 bin/motor-video.py "estilo 37 cartoon grotesco"` (skill `motor-de-video`): HyperFrames ou Remotion servem igual
   (é tudo transform/filter/opacity). Peça curta de motion → HyperFrames; já tem template Remotion aprovado → reuse.
2. Identidade: a paleta do desenho é por episódio (abaixo); a faixa do título e o selo usam as cores de `## Minha identidade`.
3. **Amostra de 5–15 s em 9:16 antes do vídeo inteiro. Um render por vez.**

## 1. Formato
| item | valor |
|---|---|
| Tela | 1080×1920, 30 fps, −14 LUFS |
| Título | "POV: …" branco, CAIXA-ALTA, sans extra-negrito ~52 px, até 2 linhas, faixa preta no topo, **fixo o vídeo inteiro**, em **y ≥ 300** (área que o feed 4:5 mostra) |
| Quadro útil | **1080×1080** logo abaixo do título (ex.: y 440–1520) — ou 1080×865 (5:4) com legenda de fala ~24 px no pé |
| Fora do quadro | preto; nada importante abaixo de y 1635 |

## 2. Personagens (como gerar)
- **Elenco de 2:** quem fala (o "monstro" da situação) + quem reage (o "você" do POV, quase não fala, reage com os olhos).
  Nunca mais de 2 no mesmo quadro. Quem é alvo da piada é desenhado mais "feio" que o "você".
- **Prompt de estilo** (inglês funciona melhor no gerador): *"2D cartoon, thick dark navy outline 8px, flat cel shading with one
  magenta-purple shadow tone, colored rim light line (neon green or yellow) on the lit edge, huge white googly eyes touching each
  other with tiny dot pupils, freckles and skin speckle dots, stubble dots, stains on clothes, slightly ugly exaggerated adult
  proportions, big head, flat 2-tone background, no gradients, no text"*.
- **Paleta:** ambiente análogo de 2 tons (verde-petróleo, roxo ou ocre) + **1 cor complementar no alvo da piada** + rim light
  amarelo ou verde-neon. Sombra em 1 tom só, puxado para o magenta/roxo.
- **Peças por personagem (~7 PNG):** corpo em plano médio (1) + close de rosto (1) + bocas (3: fechada, aberta, dentes) +
  close extremo dos olhos (1) + 1–2 caretas. Gere as bocas e caretas **editando a mesma imagem** (gpt-image `/v1/images/edits`
  com a imagem do personagem como entrada), nunca imagem nova — senão o rosto muda.
- **Grotesco = expressão e textura, não nojo:** olheira hachurada, dentes tortos, rugas, lágrima em cachoeira. Nada de gosma,
  sangue ou veia saltada (o Meta reprova e não é o que faz rir).
- Custo de referência: ~14–18 imagens (2 personagens × 7 + 2–3 fundos) a US$ 0,05–0,20 cada ≈ **US$ 1–3,50**.
  Mostre o custo e só gere com o "pode" do aluno; teste qualidade medium × high em 2 imagens antes do lote.
- Recorte do fundo: o próprio gerador com fundo transparente, ou rembg local (grátis).

## 3. Montagem (números de projeto)
| regra | valor |
|---|---|
| Câmera em todo plano | **push-in linear +16 %/s** + deriva lateral 60–90 px/s, sem ease, já em movimento no 1º quadro |
| Duração do plano | média 1,5–2 s, mediana 1,2–1,4 s; **rajada de 3 cortes em 1 s** no auge; **1 plano longo de reação muda** (3–8 s) por piada |
| Boca | troca pelo volume da voz, mínimo 2 q por estado (2–3 q no grito, 5–10 q na fala normal); sem sincronia de fonema |
| Cortes comuns | **mudos**, 1 q, sem transição |
| Mergulho no preto | 11 q desce, 2 q preto, 18 q sobe; ≤ 1 a cada 15 s; o punch vem 7–20 q depois do preto |
| Choque | corte de 1 q para P&B (`grayscale(1) contrast(1.1)`) + boom grave 40–60 Hz no mesmo quadro |
| Silêncio antes do punch | 1,5–3 s numa peça de 15 s / 3–4,5 s numa de 60 s, com zoom no rosto calado (a imagem nunca para) |
| Revelação | a imagem chega 25–35 q depois do gatilho; corte para quem reage 2–4 q ANTES da fala dele (o olho chega primeiro) |
| Fim | ≤ 1 s depois do punch: **crash zoom nos olhos em 20 q `power2.in` até ×3,5, sem fade** (gera loop) ou fade de 13 q |
| Close estourado | ampliar o PNG de 1080 até ×3 e deixar borrar: é parte da graça (não use vetor nem upscale) |

## 4. Timing do humor (a estrutura que se repete)
**Setup falado (rápido, sem pausa) → gatilho (frase curta) → SILÊNCIO DE VOZ com zoom no rosto de quem reage → (mergulho no
preto ou corte seco) → punch → reação muda curta → fim/loop.**
1. Setup em fala corrida, sem pausas ≥ 0,3 s.
2. Gatilho curto (≤ 1 s de fala).
3. Silêncio de voz de 1,5–3 s numa peça de 10–15 s, com push-in de 16 %/s no rosto de quem reage.
4. Imagem da revelação 25–35 q depois do gatilho; corte para quem reage 2–4 q antes da fala dele.
5. Mergulho no preto: descida 11 q, preto 2 q, punch 7–20 q depois do preto.
6. Choque = 1 corte para P&B com boom grave (0 a +2 q). Nunca mais de 1 boom a cada ~7 s.
7. Fim em ≤ 1 s depois do punch. Nada de explicar a piada.
**Gancho:** a legenda "POV: …" + a primeira fala já absurda no quadro 0. Não é um efeito que segura; é a situação.

## 5. Som
| camada | nível | regra |
|---|---|---|
| Voz | a mais alta, 14–24 dB acima do fundo; pico −6 dBFS | voz natural com interpretação exagerada, sotaque, **sem pitch** ("voz de esquilo" mata a piada) |
| Ambiente | −45 a −55 dB contínuo | ruído leve de sala/rua o tempo todo (dá "gravação real") |
| Trilha | −12 a −16 dB **só** nos 1–8 s de reação/fantasia, com a voz parada | entra no corte/preto e sai seco; no diálogo fica muda |
| Boom | pico −12 a −18 dBFS, grave 40–60 Hz | 1 por choque (corte para P&B) |
| Cortes comuns | — | mudos (sem whoosh por corte) |
Voz: o melhor é **gravada crua** (você ou alguém da equipe, no celular). Voz sintética bem atuada chega perto; voz de "locutor"
mata a piada — teste 2 takes. Nunca use áudio viral de terceiros (direito de voz e imagem).

## 6. Exemplo de amostra (13 s) · "POV: O LEAD PERGUNTOU 'QUANTO FICA?'"
Elenco: **Gestor** (o "você": jovem, camiseta lisa, fone no pescoço, olheira hachurada; cor-alvo laranja) e **Curioso**
(tiozão de regata, óculos escuros na testa, palito no dente, barba por fazer, celular colado no rosto; ambiente verde-petróleo, rim amarelo).

| tempo | imagem | voz / som | efeitos |
|---|---|---|---|
| 0,0–1,4 s | fade do preto 8 q; curioso em plano médio, celular no rosto | CURIOSO (arrastado): "Opa, boa tarde… quanto fica?" | 01 push-in · 02 bocas |
| 1,4–4,6 s | gestor digitando animado (tela **preenchida**: WhatsApp com um textão de proposta) | GESTOR (rápido, empolgado): "Boa tarde! Então, depende do seu objetivo: eu monto a campanha, o pixel, o público…" | 01 · 02 · rajada de 2 cortes |
| 4,6–5,7 s | smash-in nos olhos do gestor; inserto da tela "✓✓ visualizado" | silêncio de voz; som de leitura | 03 · 15 |
| 5,7–8,2 s | gestor calado em push-in; relógio na parede | **silêncio de voz 2,5 s**; só ambiente e tique-taque | 11 |
| 8,2–9,2 s | mergulho no preto → "3 MESES DEPOIS" escrito à mão, sílaba a sílaba | — | 04 · 08 |
| 9,2–10,6 s | o **mesmo** curioso, mesma pose, agora numa rede de praia | CURIOSO (idêntico, 20 q depois do preto): "Opa, boa tarde… quanto fica?" | 01 · 02 (o punch é a repetição) |
| 10,6–12,3 s | corte seco para o gestor em P&B com lágrima em cachoeira | **boom grave** no quadro do corte; voz parada | 05 · 12 |
| 12,3–13,0 s | crash zoom nos olhos do gestor, 20 q, sem fade | trilha de "climão" sobe e corta | 06 (loop) |
Silêncio antes do punch: 4,6 → 9,2 s, com rosto calado + mergulho + cartela; fim 0,7 s depois do boom. Troque a situação pela
dor do SEU público e mantenha a estrutura (setup → gatilho → silêncio → repetição/revelação → P&B → crash zoom).

## 7. Pipeline
| etapa | ferramenta | custo |
|---|---|---|
| Roteiro (1 piada, 30–45 palavras de voz) | Claude | 0 |
| Personagens e fundos | gpt-image (OpenAI, chave no `.env`), 1 referência de estilo, bocas por edição | US$ 1–3,50 |
| Recorte | rembg local / fundo transparente do gerador | 0 |
| Vozes | gravada no celular (0) ou voz sintética com emoção | 0 ou créditos da sua assinatura |
| Animação, título, áudio | HyperFrames ou Remotion | 0 |
| Movimento "de verdade" (poeira, aura, lágrima viva) | 2–3 desenhos em `steps` no código (0) ou 1 clipe curto de vídeo IA (opcional) | 0 ou centavos |
| Efeitos e trilha | `acervo/sons/` (skill `catalogo-de-efeitos`) | 0 |
**Difícil, sendo honesto:** (1) manter o mesmo rosto em plano médio, close e close extremo — preveja 2–3 rodadas e edição sobre a
mesma imagem; (2) o gerador tende a "limpar" o traço — reforce *speckle dots, rim light, thick outline*; (3) a atuação da voz.

## 8. Checklist antes de entregar
- [ ] Personagens, falas e situação SEUS: nada de personagem, avatar, marca, fala ou áudio de outro criador.
- [ ] Título "POV" dentro da área 4:5 (y ≥ 300) e quadro útil acima de y 1635.
- [ ] Toda tela de celular/computador desenhada está **preenchida** (mensagem, "visualizado", painel) — tela vazia é defeito.
- [ ] Nenhum plano parado (a câmera sempre em push-in).
- [ ] Cortes mudos; 1 boom por choque.
- [ ] Silêncio antes do punch medido (≥ 1,5 s numa peça de 15 s).
- [ ] Fim ≤ 1 s depois do punch.
- [ ] −14 LUFS; sem preço falado; sem CTA dentro da piada.

## O que este estilo NÃO tem (para não inventar)
Shake de câmera, whip pan, freeze frame, smear, squash and stretch, boing, apito, arranhão de disco, risada de claque, legenda
palavra a palavra estilizada, CTA falado.

## Prompt de recriação
"Faça [destino] no ESTILO 37 · Cartoon grotesco de humor (POV), 9:16 1080×1920, [12–20 s anúncio | 30–60 s orgânico],
público: [quem], situação: [a dor do dia a dia dele]. Siga a skill estilo-37-cartoon-grotesco: elenco de 2, título POV fixo em
y ≥ 300, push-in de 16 %/s em todo plano, bocas pelo volume, silêncio de voz antes do punch, corte para P&B com boom, crash zoom
final. Mostre o roteiro e o custo das imagens antes de gerar. Amostra de 5–15 s antes do vídeo inteiro; um render por vez."
