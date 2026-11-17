---
name: editar-reel
description: Edita o reel que o próprio cliente gravou no celular. Corta silêncio, erro e repetição, põe legenda grande no centro da tela (máx 2 linhas, acento conferido), faz a capa 1080x1920 com título e entrega MP4 1080x1920. Usa FFmpeg e Whisper local. Use quando o usuário disser "editar meu reel", "gravei o vídeo", "corta e legenda", "edita esse vídeo", "legenda no meu reel".
---

# Editar Reel

Persona e doutrina: `SkillsDoFera/fera/references/`. Ler `perfil.json` antes de tudo.

Ele gravou. Isso é a parte que só ele faz, e já fez. Eu corto, legendo e devolvo pronto para
publicar. Nada sai sem ele ver antes.

## Regras duras

1. **Nunca inventar fala.** A legenda é o que saiu da boca dele, palavra por palavra. Posso
   corrigir grafia e acento. Não posso trocar, completar nem "melhorar" frase.
2. **Legenda no centro, nunca no rodapé.** A interface do Instagram cobre a base. Fonte grande,
   no máximo 2 linhas por bloco.
3. **Acento conferido.** O Whisper erra acento e nome próprio. Leio cada bloco antes de queimar.
   Acento errado em legenda é refazer.
4. **Mostrar antes de finalizar.** Ele vê os cortes e a legenda antes do MP4 final, e vê o MP4
   antes de eu registrar a entrega.
5. Saída sempre **1080x1920, MP4**.

## Pré-requisitos

- **FFmpeg** no PATH. Faltou: `winget install Gyan.FFmpeg`, fechar e abrir o terminal.
- **Whisper:** o script usa o `openai-whisper` se estiver instalado. Senão, instala o
  `faster-whisper` via pip na primeira vez (alguns minutos, roda no computador, sem chave).

## Fluxo

```
[01] Receber o vídeo → [02] Transcrever → [03] Cortes (aprovação) → [04] Legenda (aprovação)
→ [05] Capa (aprovação) → [06] Montar → [07] QA → [08] Entrega
```

Pasta de trabalho: copiar o vídeo bruto para `output/editar-reel/<data>-<slug>/bruto.mp4`.
O script grava tudo em `bruto-edicao/` ao lado.

### [01] Receber o vídeo

Pedir o arquivo (caminho no computador). Perguntar UMA vez: qual o título da capa e qual a
palavra do CTA, se tiver.

### [02] Transcrever

```bash
python ScriptsFera/editar_reel.py transcrever output/editar-reel/<pasta>/bruto.mp4
```

Gera `transcricao.json` (tempo por palavra) e `transcricao.txt` (para ler). Ler o `.txt` inteiro.

### [03] Cortes

```bash
python ScriptsFera/editar_reel.py cortes output/editar-reel/<pasta>/bruto.mp4
```

Gera `cortes.json` com os trechos que FICAM (silêncio já fora). Depois, pela transcrição:

- Frase começada e repetida: fica só a última tentativa (a boa).
- "Ééé", "né", tosse, "corta isso", "de novo": sai.
- Ajustar `inicio` e `fim` dos trechos em `cortes.json` com os tempos do `transcricao.txt`.

Mostrar a ele a lista do que saiu ("cortei 0:12 a 0:15, você repetiu a frase do preço") e o
texto que ficou. Pausa curta demais ou corte agressivo: `--silencio 0.9` deixa mais respiro.

### [04] Legenda

```bash
python ScriptsFera/editar_reel.py legendas output/editar-reel/<pasta>/bruto-edicao
```

Gera `legendas.json` (blocos de até 2 linhas, no tempo do vídeo já cortado). Abrir e conferir
bloco a bloco: acento, nome próprio, nome do produto dele (`perfil.json`), número. Corrigir só
grafia. Mostrar a ele o texto final das legendas e pedir OK.

### [05] Capa 1080x1920

HTML 1080x1920 com o título aprovado (até 6 palavras, fonte grande, centro da tela, cores de
`perfil.json`), usando um frame do próprio vídeo como fundo quando ajudar:

```bash
ffmpeg -ss 2 -i output/editar-reel/<pasta>/bruto.mp4 -frames:v 1 output/editar-reel/<pasta>/frame.jpg
python ScriptsFera/render.py png output/editar-reel/<pasta>/capa.html --w 1080 --h 1920 --out output/editar-reel/<pasta>/capa.png
```

Rosto nunca cortado nem coberto pelo título. Imagem em base64 no HTML, nunca `file://`.
Junto, `texto-puro.txt` com o título cru.

### [06] Montar

```bash
python ScriptsFera/editar_reel.py montar output/editar-reel/<pasta>/bruto.mp4 --pasta output/editar-reel/<pasta>/bruto-edicao --out output/editar-reel/<pasta>/reel-final.mp4
```

Corta, enquadra em 1080x1920 (preenche e recorta as sobras) e queima a legenda no centro.
Opções: `--fonte` e `--tamanho` (padrão Arial 82).

### [07] QA (antes de mostrar)

- Extrair 3 frames (início, meio, fim) com `ffmpeg -ss <t> -i reel-final.mp4 -frames:v 1 qa-<t>.png`
  e abrir cada um (Read): legenda no centro, 2 linhas no máximo, nada cortado na borda, rosto livre.
- Duração final bate com a soma dos cortes.
- Mostrar a ele o MP4 e a capa. Só com OK sigo para a entrega.

### [08] Entrega

1. Registrar em silêncio:
   `python ScriptsFera/metas-api.py entrega add "editar-reel" "<reel editado: tema>" --link "output/editar-reel/<pasta>/"`
2. Caminho absoluto completo da pasta.
3. Publicar é com ele. Com a chave do Post for Me, oferecer agendar:
   `python ScriptsFera/publicar.py agendar output/editar-reel/<pasta>/reel-final.mp4 --formato reel --quando "AAAA-MM-DD HH:MM" --legenda <legenda.txt> --capa output/editar-reel/<pasta>/capa.png`
   (plano primeiro, OK dele, depois `--enviar`, igual à seção Agendar do `/conteudo-e-anuncios`).
   Sem a chave: data e hora de publicar na mesma resposta, e a capa escolhida no app na hora de postar.
