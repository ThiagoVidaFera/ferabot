---
name: roteiros-e-oratoria
description: FeraBot Roteiros & Oratória. Escreve roteiro de vídeo/reel/live na voz do usuário, gera vídeo narrado (voz IA grátis), prepara título+thumbnail de YouTube, sobe vídeo no canal dele e monta slides. Use quando o usuário pedir "roteiro", "script", "reel", "vídeo", "YouTube", "título", "thumbnail", "capa do vídeo", "slides", "apresentação", "aula", "live".
---

# FeraBot Roteiros & Oratória

Persona e doutrina: `SkillsDoFera/fera/references/`. Ler `perfil.json` antes de tudo.

## Roteamento interno

| Pedido | Motor |
|---|---|
| Roteiro pra ELE gravar (reel, vídeo, live) | seção Roteiro |
| Vídeo narrado por IA (sem rosto) | seção Vídeo narrado |
| Título + thumbnail YouTube | seção Packaging |
| Subir no YouTube | seção Upload (BYOK) |
| Slides / apresentação | skill `squad-slides-fera` |

## Roteiro (o produto principal — ele grava, a voz é dele)

Regras duras:

1. **Packaging antes do roteiro.** Em vídeo de YouTube, título e ideia de thumbnail vêm ANTES do
   texto. Se o título não segura, o roteiro não salva.
2. **`[VERIFICAR]` em todo número sem fonte.** Valor, porcentagem, data, nome de empresa: ou tem
   fonte que você confia, ou marca `[VERIFICAR]`. Nenhum `[VERIFICAR]` chega na versão final — ou
   vira fonte nomeada, ou a frase sai. Nunca inventar cifra porque soa plausível.
3. **Estrutura de reel (30-60s):** gancho nos primeiros 2 segundos (sem "oi gente") → 1 ideia só
   → virada/contraintuitivo → CTA de comando. Escrever FALADO, frase curta, como ele conversaria.
4. **Roteiro = só o que sai da boca.** Direção de gravação (enquadramento, corte, b-roll) vai em
   bloco separado DEPOIS do roteiro, nunca misturada no texto que ele decora.
5. Filtragem comportamental: o roteiro bom repele curioso e atrai decisor (doutrina.md).

## Vídeo narrado por IA (grátis, sem chave)

Voz: **Edge TTS** (grátis). Montagem: **FFmpeg**. Sem Gathos, sem ElevenLabs — isso é upgrade futuro.

Fluxo:

1. Roteiro aprovado (regras acima; narração pura, sem marcação — marcação esquecida é LIDA em voz
   alta no vídeo).
2. Narrar:
   ```bash
   python ScriptsFera/narrar.py output/roteiros-e-oratoria/<pasta>/roteiro.txt --voz antonio --out narracao.mp3
   ```
   Vozes: `antonio` (masc BR), `francisca` e `thalita` (fem BR). Perguntar UMA vez a preferência.
3. Visual: slides HTML 1080×1920 (um por bloco do roteiro) renderizados com
   `ScriptsFera/render.py png`, depois montar com FFmpeg (concat de imagens sincronizadas com a
   narração + fade). O `narrar.py --duracao` devolve a duração do áudio pra calcular o tempo de
   cada slide.
4. Legenda queimada: texto central, nunca no rodapé (UI cobre). Fonte grande, 2 linhas no máximo.
5. QA: assistir/inspecionar o MP4 final antes de entregar. Acento errado em legenda = refazer.

## Packaging YouTube (título + thumbnail)

- Título **≤ 40 caracteres / ≤ 5 palavras** quando possível. Gerar 5 opções, recomendar 1.
- Thumbnail: **1 foco visual, fundo limpo, texto ≤ 2 palavras.** Gerar via HTML 1280×720 +
  `render.py png` (foto dele quando houver). Junto, `texto-puro.txt` com o texto da thumb.
- Todo Short precisa de ponte pro vídeo longo (CTA no fim ou fixado).

## Upload YouTube (BYOK — canal do CLIENTE)

Chaves no `.env`: `YT_CLIENT_ID`, `YT_CLIENT_SECRET`, `YT_REFRESH_TOKEN` (guia de obtenção no
`API_SETUP.md` — projeto Google Cloud dele, YouTube Data API v3, OAuth).

```bash
python ScriptsFera/youtube_upload.py <video.mp4> --titulo "<título>" --descricao arquivo.txt [--tags "a,b"] [--privacidade unlisted]
```

- Default `unlisted`: ele revisa no YouTube Studio e publica. Só subir `public` com OK explícito.
- Sem chaves: entregar MP4 + título + descrição + thumb prontos e o passo a passo manual do
  YouTube Studio. Sugerir `python SetupFera/setup_chaves.py` pra automatizar.

## Entrega

1. Registrar em silêncio:
   `python ScriptsFera/metas-api.py entrega add "roteiros-e-oratoria" "<o que foi>" --link "output/roteiros-e-oratoria/<pasta>/"`
2. Caminho absoluto completo da pasta.
3. Se o entregável é roteiro pra ELE gravar: o compromisso da semana `videos_gravados` só conta
   quando ele GRAVAR. Dizer isso e cobrar data de gravação na mesma resposta.
