# Receitas de som — Estilo Visual de Anúncio (EVA) (consolidado)

> Fonte: `fontes/ESTILO-VISUAL-DE-ANUNCIO-EVA/CURSOS-2026-10/_sintese/{eva-sound,eva-ads,estilo-visual-de-anuncio-eva,eva-ia,do-zero-aos-100-mil}/receita-visual.json`
> (E.2, 13/10/2026). Valores com número foram lidos na tela do CapCut; "não visível" quer dizer que o professor diz
> "abaixa um pouquinho" sem mostrar o controle. As lives (imersao-de-estrategia, gravações 4, 6 e 12) entram na seção "Das lives (Imersão de Estratégia)".
> Os efeitos de som do catálogo (família `som`) apontam para cá.

**Princípio:** o som segue a frase. Tem impacto na abertura, silêncio onde a frase decide a compra, clique em cada virada,
o som do objeto quando a fala cita um objeto, e a música que foi plantada no gancho explode no CTA. A voz fica sempre acima da cama.

⚠️ **Licença:** a fonte usa música comercial baixada do YouTube (Queen, Guns N' Roses, Sting, Nelson Ned, Pink Floyd, Bee Gees,
Fleetwood Mac, Otyken). Aqui fica só o **papel** de cada música; em produção, só biblioteca licenciada (a nossa regra e a do
`estilo-visual-ads`, anti-padrão 3). "Música conhecida" = faixa licenciada que o público reconhece pelo gênero e pelo arranjo, nunca a faixa original.

## 1. Conversão dB → volume do Remotion
`volume = 10^(dB/20)` (o `volume` do `<Audio>` é multiplicador).

| dB | linear | onde aparece |
|---|---|---|
| +6,0 | 2,0 | pico do cue longo (keyframe) |
| 0,0 | 1,0 | clique de câmera, ding, plot da música no CTA |
| −5,4 | 0,537 | SFX sobre a emenda build-up → plot |
| −6,7 | 0,46 | clique de troca (eva-ads) |
| −7,9 | 0,403 | pista da música-tema na abertura |
| −10,1 | 0,313 | música de virada |
| −10,5 | 0,299 | base do cue longo |
| −11,9 | 0,254 | coral de vozes (eva-ia) |
| −18,5 | 0,119 | SFX do objeto (venda) |

Se o pipeline não aceitar volume > 1: normalizar a cena. O pico de +6 dB vira 1,0 e a base de −10,5 dB vira 10^(−16,5/20) = 0,15,
mantendo os 16,5 dB de diferença.

## 2. O arco do anúncio (mapa de 44 s, eva-sound HS-06/HS-07)
| Tempo | Momento | Som | Mix lido |
|---|---|---|---|
| 0–1,2 s | **Abertura de impacto** | só o ataque de um SFX de terror ("The shocking sound of horror…" 875238 / "Terror Halloween") | fade-out 0,4 s |
| ~1,2 s | fecho da abertura | clique de câmera (930981) | 0 dB |
| logo após | **pista da música-tema** | início da música que vai tocar no CTA, até a batida leve | −7,9 dB, fade-in 0,7 s; corte seco no início da 1ª tese |
| 2,08 s | tese de abertura | **silêncio** (corte no início da transição) | — |
| 2–9 s | denúncia (raiva/medo) | suspense ("A suspense movie!" 1538666 / "Notícia Policial…") | 0 dB, fades curtos; termina no corte do cartão |
| trocas | cada letra → vídeo | clique de câmera | 0 dB (eva-ads: −6,7 dB) |
| ~11–14 s | fala cita "notificação de venda" | **SFX do objeto** ("Amount display (payment)" 846097) | −18,5 dB |
| ~2 s antes da virada | chamado | build-up épico ("Epic" Metrow Ar / "Beat drop from epic buildup") | rampa crescente |
| 10–21 s | **virada** ("mas agora chegou a hora") | música épica com o pico sobre a palavra | −10,1 dB; deslocar 0,2 s muda o sentimento |
| ~19–21 s | **oferta anti-promessa** | **silêncio total** ("escrachar") | — (1–2 "microondas ding" na saída) |
| ~24–33 s | cartões vermelhos + tensão | ding ×3 (um por cartão) + terror esticado/0,8× | ding 0 dB; tensão baixa (não visível) |
| ~34–35 s | emenda build-up → plot | SFX "Disturbing and creepy…" com o pico **centralizado na junção** | −5,4 dB |
| ~34–44 s | **CTA** | **plot (clímax) da música-tema**, sem vocal, até o fim | 0 dB, fade-in 0,6 s (0,8 s na outra versão); vídeo do CTA a 0,4× para durar |

Quantidade de silêncios: ≈5 num anúncio de 38,8 s (tese, reviravolta, "sem prometer carro", "mansão ou essas balelas",
"falta de promessa" + CTA). Na VSL do eva-ads: silêncios de ~−55 dB antes de cada bloco (17–23 s, 122–127 s, 320–333 s, 346–354 s).

## 2b. O arco sonoro de uma VSL longa (11–13 min) — template do MCT
Fonte: `MANUAL-HC-PARA-VSL-MCT.md` §4.1 (L14), com SFX do pack EVA (§4.2 do manual) e números de `BIBLIA-EVA-VSL.md`. Os tempos são do roteiro do MCT; para outra VSL, manter a **ordem** e recalcular os tempos pelas porcentagens (twist 45–55 %, preço 73–79 %). A faixa musical é escolhida à parte; aqui ficam papel, entrada, nível e plot.

| Tempo | Momento (roteiro) | Emoção-alvo | Cama / música | Voz − cama | SFX (arquivo, nível) | Silêncio | Fonte |
|---|---|---|---|---|---|---|---|
| 0:00,0–0:01,2 | quadro 0: aba "gasto afetado" | choque | — | voz entra ≤ 0,3 s | **boom** `BASS_&_Explosion_Impact_SEU_ACT_ID.wav` só o ataque 1,2 s, keyframe +6 dB no ataque → −10,5 dB, fade-out 0,4 s | — | HSOUND-HEUR-001/002 |
| 0:01,2 | fecha a abertura | — | — | — | **clique** `Mouse Click Single.mp3` −6,7 dB | — | HSOUND-HEUR-001 · HADS-HEUR-019 |
| 0:01,2–~0:08 | 1ª notícia ruim | apreensão | **pista 1 da música-tema** (batida leve), −7,9 dB, fade-in 0,7 s, corte seco no início da 1ª tese | 11–12 dB | — | — | HSOUND-HEUR-003 |
| ~0:08–0:12 | 1ª tela de tese | medo | **queda de cama** 0,6–1,0 s | — | whoosh grave `…Whoosh Drone 01.wav` −14 dB na entrada da tese | queda | skill hq-ia-noir · §4.0 r.4 |
| 0:10,0 | (pista do twist) | — | — | — | **ping do evento** ViewContent −20 dB, 0,15 s | — | HSOUND-MM-006 · §2.4 |
| 0:15–0:30 | 1ª rajada 3–4 s (vende → para → clona) | aceleração | cama de tensão sobe +2 dB | 10 dB | clique por corte −12 dB (não −6,7: são 10+ cliques); `Audio Shut Down.wav` −16 dB em "e **para**" | — | medido 3perguntas · HSOUND-MM-006 |
| 0:30,0 | (pista do twist) | — | — | — | **ping** AddToWishlist −20 dB | — | §2.4 |
| 0:30–1:45 | resto do KI: identificação, vestígio, motivo para ficar | apreensão → curiosidade | cama suspense contido, duck por keyframe (−7 a −9,6 dB relativos) | 11–12 dB | `Relógio.wav` (tic-tac) −24 dB sob "esta semana, de novo"; clique −6,7 em cada troca letra→imagem | 2 quedas de 0,5–1 s nas notícias ruins | HC2-EXP-HEUR-023 · HSOUND-HEUR-009 |
| 1:45–1:50 | custo de assistir + cartela de capítulo 1 | promessa | — | só voz | `Slam_Short_02.wav` −12 dB na cartela | **queda** 1 s na frase do custo | Z100K-HEUR-004 |
| 1:50–3:30 | SHŌ: a semana do Gestor (HQ) | cansaço → raiva | troca de música (drama/suspense), entra no pico | 9–10 dB | `Mouse Click Double.mp3` −14 dB em "Duplicar"; `CASH.mp3` (só o ka-ching) −18,5 dB em "dia 1 vendeu"; `Rewind Broken Tape.wav` −16 dB no flashback P&B | 1 queda/min | HSOUND-MM-006 · HADS-HEUR-023 |
| ~2:30 · ~3:30 · ~4:30 · ~5:30 | rajadas 3–4 s (a cada ~50–70 s) | aceleração | cama sobe +2 dB | 10 dB | `Glitches_7.wav` −14 dB no 1º quadro da rajada | — | medido 3perguntas (§5 D11) |
| 3:30–4:40 | invalidação do mercado + tela real | indignação contida → atenção | **música "informativa"** (nem épica, nem suspense) | 9–10 dB | `Windows Error.wav` −18 dB em "os números não batem" | queda 0,6 s antes da tela real | EXP-HEUR-024 |
| 4:40–6:10 | o retrato errado se formando em pontos; pergunta que dói | inquietação | drone: `Dark scary drone.wav` −22 dB em loop + `Radio snow 03.wav` −28 dB | 9 dB | — | **queda** 1 s depois da pergunta | estilo-visual-ads §SOUND DESIGN |
| ~6:20 | véspera do TEN ("até que alguém abriu a aba") | expectativa | **pista 2 da música-tema** (trecho leve), −7,9 dB | 10 dB | — | — | HSOUND-MM-002 |
| 6:10–6:30 | junção + quebra: "Não é o público. Não é o criativo. Não é a verba." | tensão máxima | música sai | só voz | `Slam_Electric_Short_01.wav` −10 dB em cada "não é" (3×, palavra-clipe §3.3); **build-up 2 s** `…Whoosh Long 01.wav` + `Bell reverse 02, sharp.wav` (últimos 2 s) terminando no silêncio | — | EVAHC-FW-005 · HSOUND-HEUR-014 |
| **6:30** | **REVELAÇÃO** "Esta página acabou de contar ao Meta…" | arrepio | **nada** | só voz | nenhum | **SILÊNCIO TOTAL 1,5–2 s** antes + durante a frase; imagem dessatura para P&B | HSOUND-MM-004 · Z100K-FW-004 |
| 6:35–6:45 | os eventos acendem (3 reais + 6 "aguardando") | reconhecimento | — | só voz | **ping** −16 dB para cada um dos 3 disparados (0,5 s entre eles); os 6 apagados sem som | — | §2.4 |
| 6:45 | nome-mecanismo ("o Retrato do Comprador"); volta à cor | revelação | **plot da trilha do mecanismo** no quadro do nome, fade-in 0,6–0,8 s | 9 dB | **emenda** `Slam_Tech_01.wav` −5,4 dB com o pico centrado na junção build-up→plot | — | EXP-HEUR-022 · HSOUND-HEUR-004/012 |
| 6:50–8:00 | explicação = quebra de objeções; POV real do Claude Code | alívio/clareza | cama de solução calma | 9 dB | `Keyboard.mp3` em blocos de 0,4–0,5 s **só enquanto o terminal digita**; `Slam_Unlock_01.wav` −14 dB quando o FOP fica "Ativo" | — | Z100K-HEUR-029 |
| 8:00–9:10 | PITCH: explicação + 3 ofertas (1 item por vez) | desejo | épico contido / emocional | 9–10 dB | `Mouse Click Single.mp3` −8 dB por item do stack; `BASS_Impact_SEU_ACT_ID.wav` (0,8 s) −14 dB em cada número de âncora | — | EVAHC-FW-012 ("cliques nos benefícios") |
| ~9:20 | **PREÇO** (bloco A/B/C, mesma duração) | decisão | **nada**; build-up 2 s antes | só voz | `Foley Bell Metal Handbell Short Ring 01.wav` (0,6 s, fade 0,3) −14 dB **na saída** da frase | **SILÊNCIO TOTAL** na frase do preço | HSOUND-HEUR-008 · EVAHC-HEUR-026 |
| 9:30–10:00 | âncora/comparação, "o tempo e o problema são seus", ferida | reflexão | piano/emocional (volume ↑: "piano é baixo") | 9 dB | — | queda 1 s antes da ferida | HADS-HEUR-021 |
| 10:00–10:40 | KETSU: callback do twist | reconhecimento | música-tema volta em build (ressurreição) | 9 dB | 1 **ping** −16 dB em "esta página fez isso com você"; `Speed Rewind Kick.wav` −12 dB em "lembra do começo?" | **queda** 1 s antes do callback | HSOUND-MM-003 · HADS-FW-014 |
| 10:40–11:30 | objeção (cursos não terminados), entrega real, autocrítica honesta | confiança | cama baixa | 10 dB | `Paper turn.wav` −18 dB no "e-mail de acesso" | — | SURP doc (KETSU) |
| 11:30–12:00 | CTA 1 → build-up 2 s → **PLOT da música-tema** sob o CTA 2 até o fim | solução | **plot 0 dB**, fade-in 0,6 s; vídeo do CTA pode ir a 0,4× para caber o plot | 8–9 dB | chevron: `Quick_Whip_1.wav` −16 dB em stagger (3 toques) | — | HSOUND-HEUR-004/013 |
| 12:00–fim | frase final + CTA digitado sem voz | eco | cauda do plot | — | `Keyboard.mp3` por letra (−14 dB), para na última letra | — | plano §2 |

Resumo do desenho: boom no quadro 0 → pista leve do tema → cama de suspense com quedas → rajadas a cada ~50–70 s no KI/SHŌ → troca de gênero na revelação (**silêncio total** de 1,5–2 s) → plot da trilha do mecanismo no nome → cama de solução → PREÇO em silêncio total → tema volta em build (ressurreição) → plot 0 dB sob o CTA 2. Só **3 silêncios totais** na peça (revelação, preço, véspera do callback); o resto são quedas de cama.

## 3. Regras fixas
1. **Abertura de impacto ~1,2 s:** só o ataque do SFX (Ctrl+B e apagar o resto), fade-out 0,4 s, clique fechando. "Tem que ter esse puff de início e depois vai se acalmando." SFX longo: keyframe com pico de +6,0 dB no ataque (~0–0,3 s) e volta para −10,5 dB como cama de tensão.
2. **Silêncio estratégico:** música e SFX saem **no início da transição** (troca de cartão, take ou fala), nunca no meio da frase. Vale para tese, virada, oferta e CTA. A música volta quando muda o conceito ou com o plot.
3. **Clique nas viradas:** um clique em cada troca de cartela ou foto, no quadro exato. EVA Ads: "Click (set, button sound, click)(1014281)" a **−6,7 dB**, fade 0 ("diminuir esse clique porque ele é bem alto"). EVA Sound: clique de câmera a 0 dB. Não usar no bloco de calmaria. VSL tipográfica: uma tecla por palavra (~0,2–0,3 s, estimado), pulando a tela preta; o som de teclado para quando a digitação para (do-zero-aos-100-mil: toques de 0,4–0,5 s a 8,7 dB).
4. **SFX do objeto a −18,5 dB:** quando a fala cita um som do mundo (venda, micro-ondas, geladeira, coração), ele entra baixinho na palavra. O coração pode **substituir** a música na frase emocional (eva-ads: ×2, 4,3 dB visto).
5. **Emenda a −5,4 dB:** para esconder a junção entre o build-up e o plot, centralizar o pico ("a parte laranja") de um SFX sobre a junção.
6. **Plot/clímax da música no CTA:** plantar o início da música-tema no gancho (−7,9 dB, fade-in 0,7 s) e pagar no CTA com o clímax dela, sem vocal, "sempre no máximo da música" (0 dB, fade-in 0,6–0,8 s), até o fim. Deixar um final sem voz para a música. "Quando não casa, nem adianta."
7. **Pico alinhado à palavra:** a música de virada é arrastada até o pico cair na palavra ("mas agora **chegou** a hora"); 0,2 s de diferença muda o sentimento.
8. **Duck por keyframe:** cama instrumental (vocal removido) baixa sob a voz e sobe nas pausas; keyframe no trecho que fica alto demais. Valores vistos: música 4,2 dB no keyframe (eva-ads, pet), música base +7,3 dB com curva (eva-ia), voz sempre acima (do-zero-aos-100-mil). Nossa dosagem (do `estilo-visual-ads` N7): voz 12–15 dB acima no gancho e 8–10 dB no corpo; a música só sobe sozinha depois do CTA.
9. **Música conhecida sem vocal:** abertura com "só o iniciozinho, volume baixo" (reconhecimento) e o clímax sem vocal no CTA. Para tirar o vocal: Isolamento vocal → Remover voz (só no trecho dividido) ou Separar áudio → Vocais → apagar. No nosso pipeline: stem instrumental com demucs.
10. **Trilha por sentimento:** orgulho = épica; dor/ameaça = suspense/terror; reflexão = piano (volume ↑, "piano é baixo"); solução = feliz/motivação. Cortar a música quando muda o conceito; a nova entra no pico dela, com fade-out bem curto na anterior.
11. **Build-up como chamado:** ~2 s de crescendo épico terminando exatamente onde começa o silêncio, o plot ou a virada ("isso vai dar um chamado, presta atenção"). EVA IA: riser antes da virada.
12. **A/B só trocando a música:** depois de validar o criativo, duplicar o projeto e trocar só a trilha e os SFX; imagem e copy fixas; fica a que mais performar. Também vale para voz (mesmo texto em 2 vozes).
13. **Ping-pista do twist (L4):** quando o twist é verificável no aparelho do espectador (eventos de Pixel), planta-se **antes** da revelação um som semântico curto que será pago depois: ping do evento (ViewContent aos 10,00 s, AddToWishlist aos 30,00 s; `Aleatórios (90)/Beep.mp3`, ~0,15 s, **−20 dB**), sem a fala explicar. Na revelação, o mesmo ping volta a −16 dB para cada evento que disparou de verdade (0,5 s entre eles) e **silêncio** para os que não dispararam. Só soa o que dispara de verdade; os tempos 10,00/30,00 s são medidos no áudio final, e a PAUSA do roteiro é ajustada para a palavra-gatilho cair em 9,0–11,5 s e 29,0–31,0 s.
14. **Quedas de cama como unidade de pausa da VSL longa (L13):** na VSL o "respiro" não é silêncio, é **queda de cama**: música < −50 dBFS por **0,4–1,5 s** com a voz seguindo, ~**2–2,5 por minuto** (2 no KI), no início da transição (nunca no meio da frase), antes de prova/tela real, nas notícias ruins e antes da frase de custo; volta com corte seco na troca de conceito ou com hit. Silêncio **total** (voz também) fica reservado aos 3 pontos do §2b. O arco do anúncio de 44 s (§2) continua valendo só para anúncio.

## 4. Voz (antes da mix)
- **Voz gravada:** Isolamento vocal "Manter voz" · Reduzir ruído · Aprimorar voz intensidade 75 · volume final +9,7 dB · Normalizar desligado · fades 0,0 s (eva-ads). No nosso pipeline: ffmpeg `afftdn` + `loudnorm I=-16` (e demucs para isolar) antes do Remotion.
- **Voz de IA (ElevenLabs):** não tratar — painel em 0,0 dB, sem normalizar/aprimorar/reduzir ruído; só cortar silêncios e subir um pouco (fade-in 0,2 s visto).
- **Corte de silêncios:** cortar pausas e estalos e deixar "um espacinho pra não ficar muito diretão"; sem fade entre cortes. No pipeline: `auto-editor --margin 0.08s` ou ffmpeg `silenceremove`, gerando o mapa de frases que alimenta as `<Sequence>`.
- **Filtros de personagem** (telefone 46, distorção Tom 65/Timbre 78, coral 3,0–3,3× a −11,9 dB, Sweetie 100): ver o efeito `som-voz-com-filtro`. Sempre pré-renderizados.
- Regra do autor: voz clonada nunca sobre o take do autor falando.

## 5. Tradução Remotion
```tsx
import {Audio, Sequence, interpolate, staticFile, useVideoConfig} from 'remotion';

const db = (v: number) => Math.pow(10, v / 20);          // −6,7 dB → 0,46
const rampa = (f: number, dur: number, vol: number, q = 6) =>
  interpolate(f, [0, q, dur - q, dur], [0, vol, vol, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

export const TrilhaEstilo Visual de Anúncio (EVA): React.FC<{
  fps: number; cortes: number[]; silencios: {de: number; ate: number}[];
  palavraObjeto: number; ctaInicio: number; plotQuadro: number; batidaLeve: number; juncao: number; picoEmenda: number;
}> = (p) => {
  const emSilencio = (f: number) => p.silencios.some((s) => f >= s.de && f < s.ate);
  return (
    <>
      {/* 1. Abertura de impacto: ataque de 1,2 s com fade-out de 0,4 s, clique fechando */}
      <Sequence from={0} durationInFrames={36}>
        <Audio src={staticFile('sfx/boom.mp3')} volume={(f) => interpolate(f, [24, 36], [1, 0], {extrapolateLeft: 'clamp'})} />
      </Sequence>
      <Sequence from={36} durationInFrames={12}><Audio src={staticFile('sfx/clique-camera.mp3')} /></Sequence>

      {/* 2. Pista da música-tema: −7,9 dB, fade-in 0,7 s (21 quadros), some no 1º silêncio */}
      <Sequence from={36} durationInFrames={p.silencios[0].de - 36}>
        <Audio src={staticFile('musica/tema-instrumental.mp3')} startFrom={p.batidaLeve}
          volume={(f) => db(-7.9) * interpolate(f, [0, 21], [0, 1], {extrapolateRight: 'clamp'})} />
      </Sequence>

      {/* 3. Clique em cada virada: −6,7 dB */}
      {p.cortes.map((c) => (
        <Sequence key={c} from={c} durationInFrames={12}><Audio src={staticFile('sfx/clique.mp3')} volume={db(-6.7)} /></Sequence>
      ))}

      {/* 4. SFX do objeto na palavra: −18,5 dB */}
      <Sequence from={p.palavraObjeto} durationInFrames={p.fps * 2}>
        <Audio src={staticFile('sfx/caixa-registradora.mp3')} volume={db(-18.5)} />
      </Sequence>

      {/* 5. Cama com duck por keyframe e silêncios (mute com rampa de 4 quadros) */}
      <Audio src={staticFile('musica/cama-instrumental.mp3')} loop
        volume={(f) => (emSilencio(f) ? 0 : interpolate(f, [0, p.ctaInicio - 6, p.ctaInicio], [0.2, 0.2, 0], {extrapolateRight: 'clamp'}))} />

      {/* 6. Emenda: pico do SFX centralizado na junção, −5,4 dB */}
      <Sequence from={p.juncao - p.picoEmenda}><Audio src={staticFile('sfx/emenda.mp3')} volume={db(-5.4)} /></Sequence>

      {/* 7. Plot da música-tema no CTA: 0 dB, fade-in 0,6 s (18 quadros), até o fim */}
      <Sequence from={p.ctaInicio}>
        <Audio src={staticFile('musica/tema-instrumental.mp3')} startFrom={p.plotQuadro}
          volume={(f) => interpolate(f, [0, 18], [0, 1], {extrapolateRight: 'clamp'})} />
      </Sequence>
    </>
  );
};
```
- `cortes`, `silencios`, `palavraObjeto`, `ctaInicio` saem da transcrição com tempo por palavra (`bin/transcrever.py`) e da montagem; nunca número mágico no componente.
- `plotQuadro`/`picoEmenda`: medir na forma de onda (`@remotion/media-utils` `getAudioData` + maior RMS, ou librosa onset no build).
- Cue longo com pico: `volume={(f) => interpolate(f, [0, 4, 10], [1, 1, 0.15], {extrapolateRight: 'clamp'})}` (normalizado).
- Build-up de 2 s: `<Sequence from={alvo - 60} durationInFrames={60}><Audio … volume={(f) => interpolate(f, [0, 60], [0.3, 1])}/></Sequence>`.
- Tensão alongada: `playbackRate={0.8}` e `volume={(f) => 0.4 * rampa(f, dur, 1)}`.
- Recorte: `startFrom`/`endAt` (`trimBefore`/`trimAfter` nas versões novas). Velocidade: `playbackRate`.
- A/B: prop `trilha: 'A' | 'B'` na Composition e N renders por `inputProps`, mesmo vídeo.

## 6. Tradução HyperFrames
Cada som vira um clip de áudio `{src, start, trimIn, trimOut, gainDb, fadeIn, fadeOut, rate, keyframes:[{t, gainDb}]}`, com `start`
amarrado ao timestamp da palavra:
```json
[
 {"src":"boom","start":0,"trimOut":1.2,"gainDb":0,"fadeOut":0.4},
 {"src":"clique-camera","start":1.2},
 {"src":"tema","start":1.2,"trimIn":"batidaLeve","gainDb":-7.9,"fadeIn":0.7,"trimOut":"inicioTese"},
 {"src":"clique","on":"scene_change","gainDb":-6.7},
 {"src":"payment","start":"word('notificação')","gainDb":-18.5},
 {"src":"epic-music","alignPeakTo":"word('chegou')","gainDb":-10.1},
 {"src":"emenda","alignPeakTo":"juncao","gainDb":-5.4},
 {"src":"tema","start":"ctaStart","trimIn":"plot","gainDb":0,"fadeIn":0.6}
]
```
Silêncios = `track.mute` nos intervalos, com cortes alinhados às fronteiras de cena.

## 7. Onde procurar os sons
- Pack EVA (pastas e quantidades lidas): Aleatórios 90 · Cartoon 270 · Efeitos Analógicos 15 · Foley 530 · Glitches 50 · Impactos e Explosões 60 · Líquidos 295 · Transições 230 (≈1.540).
  Caminho local e mapa KI-SHŌ-TEN-KETSU → arquivos: `estilo-visual-ads` §SOUND DESIGN (não duplicado aqui).
- Busca por emoção: terror · suspense · epic · payment · transição · pancada · flashback · sad emotional drama · futurista.

## 8. Das lives (Imersão de Estratégia)
> Fonte: `_sintese/imersao-de-estrategia/receita-visual.json` (RV-EXP-011/012/017–022/029/030; L04, L06, L12). Só o que complementa as seções acima; regras já
> iguais (silêncio, plot, duck, arco) ficam nelas. Evidência no catálogo: `editor-visual-ads.valores.imersao-de-estrategia` de cada efeito `som-*`.
- **Narração (RV-EXP-011, L12 @ 40:34):** Áudio > Básico > Separar áudio (vocais) · Aprimorar voz intensidade 75 · volume +3,4 dB (≈ ×1,48) · fade 0,0 s · Reduzir ruído desligado · cortes com agulha > Ctrl+B > Delete. "O áudio manda o ritmo." Pipeline: ffmpeg `afftdn`/demucs fora do Remotion, `<Audio volume={1.48}/>`. (Difere dos +9,7 dB do eva-ads da seção 4: cada gravação tem seu ganho.)
- **Voz do vídeo contradito (RV-EXP-012, L12 @ 46:20):** Filtros de voz > Distorcido, Tom 84, Timbre 16, depois de Separar áudio para tirar a música de fundo do TikTok. Marca a fala que o anúncio vai contradizer e despersonaliza terceiro. Pré-renderizar com ffmpeg.
- **Camadas de suspense + SFX por transição (RV-EXP-017, L12 @ 68:14):** fundo a −9,6 dB ("só para ficar de fundo", ≈ ×0,33), voz sempre no centro; um hit/whoosh curto em cada texto e em cada troca de página; a trilha estica até cobrir o fecho. Faixas vistas (só como papel): ação e suspense, épica, clímax de filme de terror, flashback de choque, épica motivacional.
- **Ênfase por silêncio (RV-EXP-018, L04 @ 06:15):** remover a música na palavra-chave; às vezes sem efeito, às vezes com 1 SFX (teclado mecânico, obturador de câmera, terror ameaçador, creepy). `volume={(f)=>interpolate(f,[t-3,t,t+dur,t+dur+3],[v,0,0,v])}` + `<Audio src={sfx}/>` em t.
- **Plot (RV-EXP-019, L04 @ 08:18):** pico ("parte laranja") colado entre dois frames na palavra ("estou grávida", olho abrindo); fade-out no fim do trecho e fade-in no seguinte; faixas a −7,0 dB, fade 0,0 s no clipe final; transição de brilho entre as cenas. `<Audio startFrom={plotFrame - revelacaoFrame}/>`.
- **Duck por keyframe (RV-EXP-020, L06 @ 18:16):** um keyframe no início e outro onde a fala volta; assunto igual = não cortar a música; se ela encobre o texto, trocar. `volume={(f)=>interpolate(f,[a,a+8,b,b+8],[1,0.35,0.35,1])}`.
- **Arco (RV-EXP-021, L06 @ 21:32 / L04 @ 38:50):** problema = suspense; no nome da solução para todo o som; depois música animada; resolução = piano/épico; CTA volta o tic-tac; informação = silêncio e depois música "informativa" (nem épica nem suspense). Nunca música triste no plot do produto.
- **Tic-tac + hit de relógio (RV-EXP-022, L04 @ 36:17):** tic-tac baixo por cima da música, `<Audio volume={0.25} loop/>` (0,25 é a tradução da fonte, o volume exato não aparece); hit de relógio na virada ("30 dias viram 6 anos"); tirar a música onde a personagem fala; volta no CTA como urgência.
- **Música temática + suspense (RV-EXP-029, L06 @ 13:17):** trilha do assunto ("oriental") com suspense por baixo quando o personagem pensa; troca música sobre música com fade-out de uma e entrada da outra ("fade pra não assustar"); crossfade de ~15 frames no Remotion.
- **A/B de trilha (RV-EXP-030, L04 @ 16:50):** ADS 04 com trilha conhecida + "Epic" + "Rain" (−7,0 dB) × ADS 06 com biblioteca do CapCut ("Epic Motivation", "Epic Sport"); a conhecida foi "infinitamente melhor"; favoritar as trilhas na estrela. Render duplo com `inputProps.trilha="A"|"B"`. ⚠️ trilha conhecida da fonte = só o papel, em produção faixa licenciada (aviso de licença no topo).

## Pendências
- Valores "não visíveis" (volume da tensão alongada, da tecla, do clique de payment no HS-07) seguem sem número.
