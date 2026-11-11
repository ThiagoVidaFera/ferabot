---
name: eva-anuncio-dentro-do-anuncio
description: "Anúncio 'dentro do anúncio': moldura nomeia uma profissão/nicho, mostra o EXEMPLO COMPLETO que o produto gerou (pedido real, com data) e volta para a oferta. Sem exemplo real a peça sai do lote. Triggers: demonstração por nicho, um [profissional] pediu e saiu isto."
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

# eva-anuncio-dentro-do-anuncio — o produto prova a si mesmo


**De onde vem:** 6 criativos, 6 anúncios (C3 livro: 08–11; C5 agência: 24, 25), 115–154 s [observado, `classificacao.md` §2.4].
Na leitura inversa é a peça **superior** para nós: mostra o resultado aplicado a uma profissão nomeada — para a FERA é o argumento
inteiro [inferido, `dna-2026-10.md` (c)]. Aposta nº 1 do estudo (`05-ANALISE/leitura.md`).

## Quando usar
- **FERA**: "Um [DENTISTA] pediu; a fábrica entregou isto" — o exemplo é o criativo gerado, exibido inteiro.
- **MCT**: "Vou montar a campanha de [nicho] na sua frente" — o exemplo é a montagem na tela do Gerenciador, fechando no número.
- **MLC/Lead Certo**: "uma [clínica] ligou o Lead Certo; olha o que chegou" — exemplo = conversa/lead real mascarado.
- Ampliar público para profissionais liberais que não se veem no anúncio genérico.

## Quando NÃO usar
- Sem exemplo real e sem aceitar o selo SIMULAÇÃO → não faça (o exemplo deles é ficcional; o nosso não pode fingir) [observado, limitação da receita].
- Campanha de **públicos personalizados** → criativo por profissão só em campanha aberta (regra da casa 03/10).
- Orgânico: anúncio por profissão é **só pago** (regra da casa 03/10). Eles postam no orgânico antes (`redes/analise.md` §4), nós não.
- Remarketing → `eva-remarketing-escassez`.

## Estrutura de roteiro (espinha CRIATIVO-08, 132 s)
| Tempo | Bloco | Regra | Evidência |
|---|---|---|---|
| 0–15 s | **Moldura**: profissão GRANDE como 1ª palavra (regra da casa) + "veja o que saiu" / "vou montar na sua frente"; mostra o produto em uso | ≤ 15 s; POV de tela ou cena noir | 08 @ 0–15; 10 @ 0–8; 24 @ 0–14,4; 25 @ 0–18 [observado] |
| 15–16,5 s | **Separador**: 1 s de `colors.darkbase` | o exemplo muda de voz/tom | 08 @ 15,1–16,5 [observado] |
| 16–33 s | Exemplo — dor do cliente do nicho (crítica ao jeito comum) | b-roll IA + cartões | 08 @ 16,8–32,7 [observado] |
| 33–57 s | Exemplo — mecanismo por etapas | cartões crescendo | 08 @ 33,3–57,4 [observado] |
| 57–63 s | **Nome do mecanismo + rajada** de ~15 imagens em 3,5 s (≈0,23 s cada) | 1 rajada só, no clímax | 08 @ 57,7–63,2; 24 @ 48,3; 25 @ 83,8 [observado] |
| 63–81 s | Exemplo — diferencial/autoridade do exemplo | — | 08 @ 65,9–81 [observado] |
| 81–87 s | **CTA interno do exemplo** com seta | o exemplo é um anúncio completo | 08 @ 81,3–86,6; 10 @ 73–94 [observado] |
| 87–92 s | **Retorno**: "isso foi feito com [produto]" | volta à moldura | 08 @ 87,4–92,1 [observado] |
| 92–122 s | **Prova + oferta na tela real** (página/checkout nosso), dedo ou cursor apontando | prova = criativo publicado / painel com número | 08 @ 92,8–122 (deles: checkout refilmado, sem resultado) [observado] |
| últimos 6–10 s | CTA final "TOQUE EM SAIBA MAIS" + seta dupla | CTA duplo (interno + final) | 08 @ 124,5–132 [observado] |

**Duração:** eles 115–154 s [observado]. Nós: versão **completa 100–120 s** + versão **curta 60–75 s** (exemplo de 30 s) para o teste
decidir — 1 vídeo por anúncio, texto do anúncio fixo [inferido do método deles, ME1].

## Direção
- **Duas camadas visíveis**: moldura (nossa IDV, ciano) × exemplo (outra cor/linguagem). O espectador tem de sentir a troca [observado: 08 azul, 09 verde-neon, 10 amarelo, 25 azul × vermelho].
  - FERA: o exemplo é o criativo gerado **como saiu** (cores do cliente) dentro de moldura de celular; a troca de camada é natural.
  - MCT/MLC (exemplo montado por nós): destaque do exemplo = `colors.brandGreen`; moldura = `colors.brandCyan`.
- Moldura: POV de celular/tela (`eva-pov-produto`) ou cena noir (`eva-ensaio-noir-empresario`) [observado: livro = POV; agência = noir].
- Exemplo: b-roll IA cinematográfico + cartões `colors.cardBg` borda `colors.border` com texto Sora 800 caixa alta 2 linhas [observado: cartões brancos com vinheta, 08 @ 20,8/42/57 → trocado para a nossa IDV].
- **Símbolo visual da classe** na moldura e no exemplo (cadeira odontológica, odontograma, prancheta do corretor) — regra da casa para anúncio por profissão.
- B-roll sóbrio (regra da casa 02/10): nada vulgar, nada fora de contexto, nada em inglês; conferir em folha numerada.

## Imagem — prompts (b-roll IA do exemplo)
```
cinematic vertical 9:16 still, [profissional: dentista de jaleco | corretora com pasta | nutricionista em consultório]
in a Brazilian [consultório | imobiliária | clínica], [ação literal da frase], soft key light, shallow depth of field,
natural skin, sober clothing, realistic, film grain light. Color grade: deep shadows near #020408, cool highlights.
NEGATIVE: text, letters, logos, watermark, English signage, purple, violet, magenta, revealing clothing, beach, mask.
```
- Rajada (15 imagens): mesmo prompt com rostos/objetos do nicho variando; gere em lote, escolha 15 coerentes.
- Animação: 2–3 s por plano, `subtle push-in, camera locked` (ou Ken Burns no Remotion). Rajada não precisa animar.
- Nunca gere por IA a tela de resultado, o criativo do cliente ou números: isso é sempre real.

## Legenda e tipografia
- Moldura: legenda Roboto minúscula fina branca, 1–3 palavras, centro-baixo (eles: minúscula fina sem destaque, 08 @ 0–15) [observado].
- Exemplo: Sora 800 caixa alta, 2 linhas, **1 palavra** na cor do exemplo; mecanismo do exemplo com **nome próprio curto** em destaque grande (08 @ 57,7 sigla) [observado].
- Profissão no quadro 0: Sora 800 caixa alta, a maior palavra da tela, + símbolo da classe.

## Ritmo de cortes (medido)
| Trecho | Deles | Fazer |
|---|---|---|
| Gancho | 0 corte/s (moldura POV, 08–11) · 0,6 (moldura noir, 24–25) | POV: plano único; noir: 3 planos em 5 s |
| Corpo | 0,24–0,5 | cartão/cena a cada 2–4 s |
| Rajada | ~4,3 imagens/s por 3,5 s | 1 vez, no nome do mecanismo |
| Últimos 15 s | 0,07–0,3 | oferta parada, dedo/cursor guiando |
Fonte: `classificacao.md` §1 [observado]. Preto total 5–22 % [observado].

## Som
- Cama sob a voz em 68–93 % dos segundos com fala; voz 4,2–7,8 dB acima (mediana) [observado, stems 08, 10, 24, 25].
  Nossa regra: voz 12–15 dB acima no gancho, 8–10 dB no corpo; −14 LUFS.
- **Troca de camada também no som**: no separador de 1 s a cama corta; o exemplo entra com outra cama (ou o áudio do próprio criativo gerado) [observado: "o exemplo muda de voz/tom", 08 @ 15,1] .
- Rajada: 1 riser curto de 3 s + impacto no nome do mecanismo.
- Voz clonada só sobre b-roll/motion, nunca sobre vídeo do autor falando (regra da casa 03/10).
- Trilha licenciada (biblioteca local). Eles usam faixas comerciais (Shazam: 09, 10, 11) [observado] — proibido.

## CTA
- **Interno** (dentro do exemplo, 5 s, seta) + **final** (6–10 s, "TOQUE EM / SAIBA MAIS" ciano + seta dupla ▼▼) [observado, H6].
- Fala do CTA final aponta o destino real; nunca "link da bio" no pago (eles misturam, 08–10) [observado].

## Tradução para a nossa IDV
Moldura branca/ciano sobre `colors.darkbase`; cartões `colors.cardBg` + borda `colors.border`; exemplo com `colors.brandGreen`
ou com as cores do criativo real; nunca roxo/magenta (eles usam magenta no RMK e roxo no botão do livro) [observado].

## Exemplos (uso interno)
- Livro, moldura POV: `fontes/ESTILO-VISUAL-DE-ANUNCIO-EVA/ADS-2026-10/ads/CRIATIVO-08-C3-LIVRO-d9ad5a/` (contato-02 = rajada e cartões), `CRIATIVO-09-…`, `CRIATIVO-10-…`, `CRIATIVO-11-…`
- Agência, moldura noir: `ads/CRIATIVO-24-C5-APLICACAO-040d9c/`, `ads/CRIATIVO-25-C5-APLICACAO-500768/` (contato-01)
- Receita: `05-ANALISE/estilos/anuncio-dentro-do-anuncio/`

## Prompt-modelo
```
Anúncio-dentro-do-anúncio para [destino], formato [formato], vendendo [oferta]. Rode bin/motor-video.py antes.
Profissão: [PROFISSÃO] (1ª palavra do gancho, grande, + símbolo da classe). Exemplo REAL: [arquivo do criativo gerado /
gravação da montagem em assets/...] — se não for real, selo SIMULAÇÃO fixo. Estrutura da skill: moldura ≤ 15 s → 1 s
darkbase → exemplo completo com CTA interno e 1 rajada de 3 s no nome do mecanismo → retorno "isso foi feito com [produto]"
→ prova real (criativo publicado / painel com número, fonte e período) → oferta na nossa página → CTA final com seta dupla.
Moldura em ciano, exemplo em verde (ou cores do criativo real). Duas versões: completa 100–120 s e curta 60–75 s. Só pago
(anúncio por profissão). Primeiro: roteiro + folha de cenas; depois amostra de 15 s da passagem moldura → exemplo.
```

## Checklist da amostra
- [ ] Profissão é a 1ª palavra e a maior; símbolo da classe visível no quadro 0
- [ ] O exemplo é real (arquivo/gravação com data) ou tem selo SIMULAÇÃO o tempo todo
- [ ] Troca de camada percebida (separador 1 s + cor/som diferentes)
- [ ] Exemplo tem começo, mecanismo nomeado e CTA interno
- [ ] Prova nossa depois do retorno (não só o checkout)
- [ ] 1 rajada só; nenhum flash branco cheio em sequência (> 3 por segundo)
- [ ] Dados do cliente mascarados (tarja `colors.cardBg`); autorização registrada (alertar em 1 linha e seguir)
- [ ] Voz 12–15 dB acima no gancho; trilha licenciada
- [ ] CTA interno + final; nenhum "link da bio" no pago

## Armadilhas
- Exemplo ficcional apresentado como caso real: risco de reprovação e de confiança. Selo ou não usa.
- Moldura longa (> 15 s): o espectador não chega ao exemplo.
- Exemplo bonito e oferta sem prova: eles fecham no checkout; nós fechamos no número.
- Duas cores na moldura e duas no exemplo: a troca de camada some.
- Criativo de cliente da FERA com o autor dentro: proibido (regra 11/10).


## ⛔ Arquivo final sem rótulo interno de produção (regra do autor, 14/10/2026)
Na hora de renderizar o ARQUIVO FINAL, retirar todo rótulo/numeração de controle da produção: etiquetas tipo "PL 001", códigos de cena/beat (B042, AD21-07), ids de take, nomes de plano, contadores. Esses números são só do processo interno; o público final não pode vê-los.
Fica só o que faz parte da CENA (texto que existe no mundo da história: tela do Gerenciador, comentário real, cardápio, placa, selo do anúncio dentro do anúncio) e os selos legais ("exemplo · números ilustrativos").
Rascunho/prévia pode ter rótulo; o render final, não. Conferir na folha de contato antes de entregar.
