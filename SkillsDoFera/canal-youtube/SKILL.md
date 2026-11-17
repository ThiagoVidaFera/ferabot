---
name: canal-youtube
description: Arruma o canal do YouTube do cliente para virar porta de entrada de reunião. @ e nome, descrição com as 2 primeiras linhas certas, palavras-chave, banner 2560x1440 com área segura, foto, playlists pelas dúvidas do cliente, roteiro de trailer de 60s e reescrita de título e descrição dos vídeos antigos com o link de agendamento na primeira linha. Use quando o usuário pedir "arrumar meu canal", "canal do YouTube", "banner do YouTube", "descrição do canal", "playlist", "trailer do canal", "otimizar vídeos antigos".
---

# Canal do YouTube

Persona e doutrina: `SkillsDoFera/fera/references/`. Ler `perfil.json` antes de tudo.

Canal bagunçado não é problema de estética. É lead que chega pelo vídeo, olha o canal e não acha
o próximo passo. Cada peça aqui aponta para a página de agendamento da reunião de 20 minutos.

## Regras duras

1. **Link de agendamento em tudo.** Pegar de `perfil.json` (ou da página do
   `/funil-reuniao-fantasma`). Sem página no ar, fazer ela primeiro: canal arrumado sem destino é
   vitrine sem porta.
2. **`[VERIFICAR]` em todo número sem fonte** (anos de experiência, clientes atendidos). Nada de
   número inventado na descrição.
3. **Texto aprovado antes de qualquer arte.**
4. Quem aplica no YouTube Studio é ele. Eu entrego cada campo pronto para copiar, em ordem.

## Fluxo

```
[01] Diagnóstico → [02] Identidade (@, nome, descrição, palavras-chave) → [03] Banner e foto
→ [04] Playlists → [05] Trailer → [06] Vídeos antigos → [07] Entrega
```

Pasta: `output/canal-youtube/<data>/`. Tudo que é texto vai em `canal.md`, um bloco por campo.

### [01] Diagnóstico

Pedir o link do canal. Listar o que está lá: @, nome, descrição, banner, foto, playlists,
os 10 vídeos com mais visualização. Apontar os 3 furos mais caros primeiro (geralmente: descrição
sem link, banner sem promessa, vídeos sem próximo passo).

### [02] Identidade

- **Nome do canal:** nome dele + o que resolve, até 50 caracteres. Ex.: "Ana Souza | Contabilidade para Dentistas".
- **@:** curto, sem número, igual ao Instagram quando possível. Propor 3, conferir disponibilidade com ele.
- **Descrição:** as 2 primeiras linhas aparecem na busca e no topo do canal. Linha 1: para quem é
  e o resultado. Linha 2: o link da reunião de 20 minutos com o convite. Depois: o método em 3
  linhas, frequência de vídeo, contato. Até 1.000 caracteres.
- **Palavras-chave do canal:** 10 a 15 termos que o cliente dele digita na busca (dúvida real, não
  jargão do dono). Separadas por vírgula, para o campo do Studio (Configurações > Canal).

### [03] Banner 2560x1440 e foto

Banner em HTML 2560x1440. **Área segura 1546x423 no centro** (é o que aparece no celular):
promessa curta, nome e frequência ("vídeo novo toda terça") dentro dela. Fora da área segura,
só fundo e cor. Nada de texto fora dela.

```css
.seguro { position: absolute; width: 1546px; height: 423px;
          left: 507px; top: 508px; }   /* (2560-1546)/2 e (1440-423)/2 */
```

```bash
python ScriptsFera/render.py png output/canal-youtube/<data>/banner.html --w 2560 --h 1440 --out output/canal-youtube/<data>/banner.png
```

QA: gerar também a versão recortada da área segura e abrir as duas (Read). Texto cortado no
recorte é refazer.

```bash
python ScriptsFera/render.py png output/canal-youtube/<data>/banner.html --w 2560 --h 1440 --seletor ".seguro" --out output/canal-youtube/<data>/banner-celular.png
```

**Foto:** 800x800, rosto dele centralizado com folga (o YouTube corta em círculo). Foto real dele,
nunca logotipo. Se a foto vier de arquivo, montar em HTML 800x800 e renderizar com `--w 800 --h 800`.
Junto, `texto-puro.txt` com o texto do banner.

### [04] Playlists

Uma playlist por dúvida do cliente dele, não por tema do dono. Pedir as 5 perguntas que mais
ouve em reunião e transformar cada uma numa playlist: título em forma de pergunta ou resultado,
descrição de 2 linhas com o link da reunião na primeira. Distribuir os vídeos existentes nelas
(listar quais entram em cada uma). Playlist vazia não entra: vira pauta de vídeo.

### [05] Trailer de 60 segundos

Roteiro para ELE gravar (regras da seção Roteiro do `/roteiros-e-oratoria`):

- 0 a 5s: para quem é o canal, direto.
- 5 a 40s: o problema que ele resolve e o que a pessoa aprende aqui.
- 40 a 60s: convite para a reunião de 20 minutos, link na descrição.

Roteiro só com o que sai da boca. Direção de gravação em bloco separado. Gravou: editar com a skill
`editar-reel` (ou montar em 16:9 se ele preferir horizontal).

### [06] Vídeos antigos

Para cada um dos 10 vídeos com mais visualização:

- **Título novo:** até 60 caracteres, a dúvida do cliente na língua dele. 3 opções, recomendar 1.
- **Descrição nova:** primeira linha é o link da página de agendamento com convite
  ("Quer aplicar isso no seu caso? Reunião de 20 minutos: <link>"). Depois, resumo de 2 linhas e
  capítulos se o vídeo tiver mais de 5 minutos.
- Tabela no `canal.md`: vídeo atual, título novo, descrição nova, playlist.

Com as chaves do YouTube no `.env` (`YT_CLIENT_ID`, `YT_CLIENT_SECRET`, `YT_REFRESH_TOKEN`), ainda
assim quem cola no Studio é ele: o `youtube_upload.py` sobe vídeo novo, não edita vídeo antigo.

### [07] Entrega

1. Registrar em silêncio:
   `python ScriptsFera/metas-api.py entrega add "canal-youtube" "<canal arrumado: o que foi>" --link "output/canal-youtube/<data>/"`
2. Caminho absoluto completo da pasta.
3. Ordem de aplicação para ele seguir no Studio (nome, @, descrição, palavras-chave, banner, foto,
   playlists, vídeos antigos) e o prazo: hoje. O trailer só conta quando ele gravar: cobrar a data.
