# Receitas de IA — Estilo Visual de Anúncio (EVA) (prompts reutilizáveis)

> Fonte: `fontes/ESTILO-VISUAL-DE-ANUNCIO-EVA/CURSOS-2026-10/_sintese/eva-ia/receita-visual.json` (seção `prompts`) e `eva-ia/DNA-V2.md`
> (HEUR-013 a 020, FW-004/005), mais `eva-ads` (RV-HADS-044) e `do-zero-aos-100-mil/DNA-V2.md` (HEUR-023) para o ElevenLabs.
> Tudo entre `[COLCHETES]` é para preencher. A estrutura é deles; o conteúdo é sempre nosso.

⚠️ **O que não se replica:** os exemplos da fonte usam voz e imagem de político real, vídeo de criança real (exemplo 1) e um
produto fictício de saúde com garantia (exemplo 2). Aqui ficou só a estrutura, com personagens fictícios ou próprios. Clone de
voz só da própria voz ou de personagem gerado; o ElevenLabs exige confirmar direitos e consentimento. Regras da casa: FERA nunca
com o autor em criativo de cliente; voz clonada nunca sobre o take do autor; imagem de IA nunca é prova.

## 1. Copy com ChatGPT

**1.1 Meta-prompt do agente** (chat novo; a saída vai colada no GPT personalizado que tem a base de conhecimento)
```
Crie um prompt para que um agente de IA ChatGPT seja especializado em fazer copies para o meu [NICHO/PRODUTO].
```
Mesmo método para o agente de vídeo e o de fotos. Um agente por função, com nome "[EMPRESA] – [FUNÇÃO]".

**1.2 Meta-prompt do agente de vídeo**
```
Vamos fazer um prompt para um agente de IA criar prompts para vídeos criados em IA.
A regra é sempre escrever o prompt em inglês, porém o avatar do vídeo fala [PORTUGUÊS DO BRASIL].
Deixe bem claro que o prompt precisa ter o máximo de características e ser ultra-realista.
```

**1.3 Briefing que o agente deve fazer antes de escrever** (5 perguntas)
```
1) O que exatamente você quer vender com essa copy?
2) Qual dor real essa oferta resolve? (a dor crua, sem filtro)
3) O que te irrita nos anúncios do mercado hoje?
4) Por que suas copies são diferentes?
5) Quem seria o cliente perfeito?
```

**1.4 Revisão travada** (a IA corrige sem mudar a ideia; depois comparar linha a linha e ficar só com o que melhorou)
```
Vou te enviar um anúncio abaixo. Corrija o texto e melhore o encaixe narrativo. Troque palavras para deixar mais fluido,
mas mantenha o anúncio com a mesma ideia: "[ROTEIRO]"
```
Versão com marcadores (instruções entre aspas dentro do roteiro, ex.: "dar uma explicação rápida e plausível…"):
```
Revise esse anúncio, melhore o encaixe narrativo dele, não mude nada relevante, porém corrija os erros de português
e coloque tudo o que eu pedi dentro das aspas: [ROTEIRO COM INSTRUÇÕES ENTRE ASPAS]
```

**1.5 Teste de hook em 2 rodadas** (sobre criativo já validado)
```
Rodada 1: Eu validei este anúncio para o [PRODUTO]. Vamos criar variações de hooks para ele com base no que funcionou.
          Me dê várias opções. [ANÚNCIO]
Rodada 2: Com base nas três variações acima, me dê várias opções de hooks ainda melhores. [HOOK 1] [HOOK 2] [HOOK 3]
```

**1.6 Headlines e sub-headline**
```
Quando a 1ª rodada vier "normal":  tudo normal e simples, sem novidades. Vamos juntar um pouco de [TERROR] com [MECANISMO ÚNICO]. Me dê várias opções.
Refinar as 2 melhores:              [HEAD A] [HEAD B] — quero que essa head seja percebida como [VIRADA DE CHAVE]; que o lead entre na página,
                                    olhe para essa head e pense: [SÓ DE LER ISSO EU JÁ GANHEI O MEU DIA]. Me dê mais variações e melhores.
Quando a IA explicar em vez de variar: quero mais variações e não explicações, por favor.
Sub-headline:                       vamos criar uma boa sub-head. Não responda a pergunta acima. Deixe o lead mais curioso e faça o CTA "[APERTE O PLAY]".
```
De 10 headlines sobram 2: devolver as boas com contexto. O filtro final é a experiência do nicho ("já vi?" e "ele entende?").

## 2. Vídeo com Veo 3 (Flow)

**Regras de uso (lidas na tela):**
- Prompt em inglês; a fala entre aspas no idioma do mercado; conferir se o sotaque saiu brasileiro.
- Ao pedir o prompt ao ChatGPT, **não usar a palavra "anúncio"** (senão ele escreve um anúncio junto).
- Nomear o sentimento, a frase em que ele muda e a pausa em segundos ("dois segundos de silêncio").
- Veo 3 – Quality custa 100 créditos por geração; com 4 respostas por comando, 400: usar **1 resposta**. Veo 3 Fast = 20; Veo 2 Fast = 10.
- Clipes de ~6–8 s; baixar em 720p (original) ou 1080p (ampliada). A legenda queimada pelo Veo sai com erro de português: descartar na edição.
- Na edição: zoom lento por keyframe no clipe e cortar o trecho em que o Veo "fala errado" (efeito `micro-zoom-por-frase`).

**Estrutura do prompt devolvido (FW-004):** cena / personagem / câmera / luz (EN) → `The [CHARACTER] speaks in Portuguese (Brazil) and says: "…"`
→ Voice / Emotional / Performance direction → Environment & Mood → Note → lip sync.

**2.1 Pedido do 1º clipe (personagem-base)** — ao ChatGPT
```
Crie um prompt para criação de vídeo VEO 3 GOOGLE para [TEMA]. [PERSONAGEM: idade, cabelo, olhos, roupa peça a peça,
calçado, postura] em [CENÁRIO], olhar [CONFIANTE], boa dicção. Faça o prompt em inglês, porém ela dizendo em português
a seguinte frase: "[FALA]"
```

**2.2 Bloco 1 em inglês (modelo devolvido)** — colar no Flow
```
A [CONFIDENT FEMALE TV PRESENTER] is [SITTING AT A MORNING SHOW NEWS DESK]. She has [SHOULDER-LENGTH DARK HAIR, STYLED NEATLY],
and is wearing [A CLEAN, ELEGANT WHITE OUTFIT]. The lighting is [BRIGHT AND PROFESSIONAL, RESEMBLING A REAL TV STUDIO].
Her expression is [FIRM AND COMPOSED], speaking directly to the camera with clarity and conviction. The background features
[A SUBTLE BLURRED BANNER], without showing any specific branding. The woman is speaking in Portuguese (Brazil), and says:
"[FALA]" Make sure her lip sync matches the Portuguese sentence perfectly. Her tone should be [SERIOUS, CLEAR, AND EMOTIONAL].
```

**2.3 Continuação com print (mesmo rosto entre clipes, HEUR-016)** — colar o print do último quadro no chat
```
Foi esse avatar que o Veo 3 criou. Vamos continuar com a mesma [MULHER] e o mesmo cenário, porém agora ela dizendo "[FALA 2]".
Na parte onde ela fala "[TRECHO]", sentimento: [ESPERANÇA].
```
A saída começa por `Use the same woman from the previous scene: …` e traz `⚠ Pay attention: – Her tone should be [FIRM] in the
beginning… On the last sentence… [SOFTEN SLIGHTLY, CONVEYING HOPE]`.

**2.4 Clipe do CTA (bloco de direção emocional)**
```
Use the same [WOMAN] as before — [ATRIBUTOS DO PROMPT-BASE], seated in [CENÁRIO]. Maintain the same lighting, background,
and close-up framing. She speaks directly to the camera in Portuguese (Brazil) with clarity and purpose. The woman says: "[CTA]"
Emotional direction:
– Keep her tone [MOTIVATIONAL AND INSPIRATIONAL], with a soft smile near the end to convey [POSSIBILITY].
– Her body language should remain composed, but her eyes should show [WARMTH AND ENCOURAGEMENT].
Lip sync must align perfectly with the Portuguese sentence. The overall mood should feel like [A HOPEFUL PUBLIC SERVICE ANNOUNCEMENT].
```

**2.5 Cena de tensão com pausa (estrutura do exemplo 2, tema trocado)** — pedido ao ChatGPT
```
Vamos criar um prompt para a criação de vídeos no VEO 3: [PERSONAGEM, IDADE, CABELO, OLHOS] em [LUGAR ESCURO], [ENQUADRAMENTO].
Ela diz "[FALA 1]". Logo após, [2] segundos de silêncio. Ela diz [DESESPERADA, OLHANDO PARA TRÁS] "[FALA 2]".
Faça o prompt ultra-realista, com o máximo de informações possíveis, em inglês, porém a personagem falando em português do Brasil.
```
Blocos que a saída deve ter (modelo devolvido, com placeholders):
```
A [AGE]-year-old [CHARACTER] is [ACTION] in [DARK SETTING]. The camera captures [ANGLE]; only [WHAT IS LIT] is lit by
[FAINT, MOODY LIGHT]. The rest of the room is immersed in shadows. [APPEARANCE]. Her eyes [EXPRESS FEAR AND TENSION].
She speaks softly and slowly, in Portuguese (Brazil), with suspense: "[FALA 1]"
→ Then, [2] seconds of complete silence.
She continues, [WHISPERING WITH SUBTLE DESPAIR]: "[FALA 2]"
Direction notes: The tone must be [WHISPERED, TENSE]. Pause for exactly [2] seconds. Complete silence. No background music.
Voice Direction: [QUIET WHISPER → BREATHY DESPERATE WHISPER]. Emotion: [INCREASING FEAR]; eyes shift nervously.
Environment & Mood: [ROOM ALMOST PITCH BLACK]; [SLIGHT CREAKING SOUND OR DISTANT HUM AFTER THE PAUSE].
Note: No music. Just silence, breath, and voice. The scene should feel raw, personal, and unsettling.
```

**2.6 Transição de cena num único prompt (FW-005)** — o ponto mais difícil para a IA
```
Mesma coisa com a mesma [PERSONAGEM], porém ela diz "[FALA]". Nessa parte, vamos fazer com que ela pareça estar em um estúdio:
ela ainda está [NA MESMA POSIÇÃO], porém, do nada, chega um [ESPECIALISTA] de [IDADE] anos; a câmera sai do rosto dela e vai
para o [ESPECIALISTA]. O [ESPECIALISTA] anda, a câmera o segue focando no rosto e ele diz "[FALA]".
```
Frases-chave da saída: `the light begins to shift, like stage lights coming on, revealing… a controlled studio setting` ·
`The camera slowly pulls away from her face` · `The camera now follows the [EXPERT] in a smooth cinematic tracking shot`;
a atmosfera muda de [HORROR] para [SCIENCE AND CLARITY] (luz neutra, sem sombras duras).

**2.7 Recriar o mesmo personagem a partir do print (outro plano)**
```
Agora o [PERSONAGEM] que ela criou está na foto acima. Dê todos os detalhes possíveis para ela fazer o mesmo [PERSONAGEM],
porém agora ele está [ANDANDO PARA A FRENTE]; a câmera pega [O CORPO TODO] e ele diz "[FALA]".
```
A saída lista atributos (idade, cabelo, barba, roupa peça a peça, sapato, postura) e o movimento de câmera
(`walking slowly toward the camera… The camera tracks him`).

**Sora (ChatGPT Plus):** para foto e clipe de 3–5 s, por velocidade e preço. Truque: abrir no feed uma peça boa → "Edit prompt" →
pegar o prompt e completar com o agente de fotos.

## 3. Voz com ElevenLabs

**3.1 Text to Speech (narração)** — RV-HADS-044
- Modelo: **Eleven Multilingual v2** ("sempre multilingual 2 ou 1"); evitar English/Turbo (uma aula mostrou Turbo v2.5, exceção).
- Texto: sem rótulos; números por extenso (Ctrl+F de 0 a 9 até "0 de 0"); abreviações por extenso; nome do produto com maiúscula;
  pontuação e reticências para pausa; texto "dissertado".
- Parâmetros lidos nos nomes dos arquivos (s = stability, sb = similarity boost, se = style exaggeration):

| Voz | s | sb | se |
|---|---|---|---|
| Rachel | 85 | 89 | 0 |
| George | 60 | 75 | 0 |
| Velha | 50 | 75 | 0 |
| Hope | 86 | 75 | — |
| Jacob Dayi | 36 | 74 | 15 |
| Brian · Matilda · voz doce | 50 | 75 | 0 |
| Hélène | 25 | 80 | 46 (+ Speaker boost; aviso de instabilidade abaixo de 30%) |

  Slider visto na tela (T3E4): Stability ~90%, Similarity ~92%.
- Vozes por nicho: idosa (mãe/avó), doce/suave (pet), calma feminina jovem (sono), Brian/Callum (serviço B2B). Voz "normal",
  nunca irritante ou forçada.
- Via API no build: `eleven_multilingual_v2`, `voice_settings {stability: .5, similarity_boost: .75, style: 0}` e `num2words(lang='pt_BR')` antes.

**3.2 Voz longa da personagem do Veo (HEUR-019)** ⚠️
Extrair o áudio dos clipes, juntar ~2 min, Instant Voice Clone, Text to Speech com **Eleven v3 (alpha)** + **Enhance** (insere tags
`[emphatic]` / `[determined]` / `[powerful]`); CAIXA ALTA e "!" forçam ênfase; gerar 2+ versões e escolher. Só personagem gerado ou voz própria.

**3.3 Voice Changer — voz emocional gravada por você (HEUR-020)**
Sussurro, medo e fala baixa não saem bem no TTS: gravar a fala com a interpretação certa e passar no Voice Changer com a voz
clonada ou de banco. Também é o plano B quando o clone erra a entonação de frase curta.

| Parâmetro | eva-ia (IA2-05) | do-zero-aos-100-mil (T3-03) |
|---|---|---|
| Modelo | Eleven Multilingual v2 | Eleven Multilingual v2 |
| Stability | 50–70% | ~50% |
| Similarity | 85–100% | ~88% |
| Style | 0 | ~20% |
| Speaker boost | ligado | ligado |
| Remover ruído | desligado | desligado |
| Registro no arquivo | `sp100_s50_sb75_se0_m2` | — |

- Áudio longo: cortar em partes de **até 3 min, sempre numa pausa** (acima disso "dá pipocadas": a voz cai, trava ou volta ao inglês);
  renomear cada saída e conferir as emendas. Uma parte de 3:02 ≈ 3.000 créditos.
- Na edição: cada cena vira clipe composto (vídeo mudo + voz trocada). Em Remotion: `<Scene>` com `<OffthreadVideo muted/>` + `<Audio src={vozTrocada}/>` na mesma `<Sequence>`.

## 4. Montagem do anúncio com IA (ordem da fonte, FW-006)
Copy ao lado da timeline → gancho mais chocante primeiro → apresentadora IA (zoom por keyframe) → depoimentos em janela horizontal
(`janela-sobre-fundo-desfocado`) ou lado a lado (`tela-dividida-confronto`) → ocultação de rosto quando cabe (`ocultar-rosto`) e voz
telefone (`som-voz-com-filtro`) → frase final em tela preta com legenda central (`legenda-palavra-chave`) → CTA piscando
(`cta-final-em-loop`). Som: `som-cama-com-duck`, `som-build-up-antes-da-frase`, `som-trilha-por-sentimento` (ver RECEITAS-SOM-EVA.md).
Export da fonte: 1080P · HEVC · mp4 · 30 fps · Rec.709 SDR (1:01 ≈ 44 MB); para o Meta, h264 é a opção compatível.
