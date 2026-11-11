---
name: video-redaction-seguranca
description: "Varre gravação de tela em busca de dado sensível exposto (token, .env, senha, cartão, CPF, telefone, chave), reporta tempo+local sem reproduzir o segredo e aplica borrão/tarja/corte via ffmpeg em arquivo novo. Triggers: vê se expus dados, borra, tarja, limpar vídeo antes de publicar."
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

# Video Redaction — segurança em gravações de tela

> ⛔ **Aula gravada sua (curso, módulo, bônus): use a skill `blur-preciso-aula`.** Para aula ela SUBSTITUI deste arquivo: "borrar a faixa inteira da barra de endereço", "caixa grande cobrindo toda a zona", "blur de conteúdo inteiro curto", folga ≥ 20 px e caixa por tesseract — a regra é tarja só no dado, acompanhando a tela, aprovada por agente revisor. Esta skill segue valendo para gravação de encontro/mentoria e para as partes de corte, Vimeo, Ticto e material de apoio.

Pipeline validado em gravações reais de mentoria (ver "Pipeline completo" no fim p/ acelerar+dividir+entregar). **Nunca reproduzir o valor do segredo no terminal** : descrever só TIPO + LOCAL + gravidade.

## Passo 1 — Extrair frames com timestamp
Resolução NATIVA (nitidez p/ ler token/cartão), 1 frame a cada 2s. Mapa: **t_seg = (N−1)×2**.
```
ffmpeg -nostdin -i IN.mp4 -vf "fps=1/2" -q:v 2 OUT/f_%05d.jpg
```

## Passo 2 — Localizar janelas de risco pela legenda (barato, antes da visão)
Grep no `.srt` por: `token|\.env|chave|api|senha|cart[aã]o|fatura|cvv|c[oó]digo|cpf|endere[cç]o|ssh|prepago`. Converter timestamp da legenda → frame index para focar a varredura.

## Passo 3 — Varredura por visão (subagentes em paralelo, 1 por janela)
Cada subagente lê os frames da janela em resolução cheia e reporta lista:
`frame f_XXXXX (tempo MM:SS) | TIPO | LOCAL na tela + REGIÃO (x0–x1,y0–y1 no original) | LEGIBILIDADE | SEVERIDADE (CRÍTICO/ALTO/MÉDIO/BAIXO)`.
Regra dura no prompt: **não transcrever o valor real** (token/cartão/senha), só tipo+local.
Alvos: token/chave de API, bloco `.env` com valores, senha/root, chave SSH **privada** (CRÍTICO) vs **pública** (baixo/médio), nº cartão/CVV/validade/últimos-4 (LastPass popup!), CPF/CNPJ, telefone, OTP, endereço/CEP, nº e fatura, JWT na URL.

## Passo 4 — Censurar / cortar (ffmpeg → PASTA NOVA, originais intactos)
Sempre gravar em `.../<projeto>/<VIDEO>-EDITADO/` + `MUDANCAS.md`.

**Borrão que "segue o dado" (preferido — elegante):** cobrir a ZONA INTEIRA por onde o dado pode rolar (ex.: viewport do navegador, faixa do terminal), não só o retângulo exato.
```
-filter_complex "[0:v]crop=W:H:X:Y,avgblur=24[c1];[0:v][c1]overlay=X:Y:enable='between(t,S,E)',split[a][b];[a]crop=W2:H2:X2:Y2,avgblur=22[c2];[b][c2]overlay=X2:Y2:enable='between(t,S1,E1)+between(t,S2,E2)'[vout]" -map "[vout]" -map 0:a -c:v libx264 -crf 20 -preset fast -c:a copy
```
GOTCHAs: `[0:v]` pode ser referenciado 2× (auto-split); a saída de um overlay que alimenta 2 filtros PRECISA de `split`; `enable='between(t,a,b)+between(t,c,d)'` = OR. Aplicar drawbox/overlay ANTES do trim mantém os tempos no timeline original.

**Tarja (definitiva, p/ dado curto tipo 4 dígitos):** `drawbox=x:y:w:h:color=black@1:t=fill:enable='between(t,S,E)'`.

**Corte (trecho morto+sensível):** melhor que borrar quando é dead air.
```
-filter_complex "[0:v]trim=0:C1,setpts=PTS-STARTPTS[v0];[0:a]atrim=0:C1,asetpts=PTS-STARTPTS[a0];[0:v]trim=C2,setpts=PTS-STARTPTS[v1];[0:a]atrim=C2,asetpts=PTS-STARTPTS[a1];[v0][v1]concat=n=2:v=1:a=0[v];[a0][a1]concat=n=2:v=0:a=1[a]" -map "[v]" -map "[a]"
```

## Passo 5 — SEMPRE mostrar exemplo antes do lote
Gerar 1 frame tarja + 1 frame blur + 1 clipe ~6s, abrir a pasta, pedir aprovação de estilo. Blur seguro = `avgblur≥22` ou `gblur=sigma≥30` (radius > altura do texto ⇒ ilegível).

## Passo 6 — Verificar
Re-extrair frames só das janelas tratadas e confirmar "limpo" (0 legível); `ffprobe` p/ durações; recomendar **rotacionar credenciais** que apareceram (torna a censura irrelevante como defesa dupla).

## Operação, verificação & entrega — aprendizados críticos (caso real)
- **VERIFICAR DENSO, nunca por amostra.** Amostra (1 frame) deixou passar CPF/IP/IDs → susto real. Ao terminar, re-extrair TODOS os frames das janelas tratadas (fps≥2-3) + OCR confirmando 0 legível, **incluindo o 1º e o ÚLTIMO frame de cada bloco/corte**.
- **Rastreamento por OCR tem que ser DENSO:** 1 frame/2s (0,5fps) é coarse demais → buracos. Extrair rastreamento a **≥3fps**. Onde o OCR ainda perde frames isolados (token teimoso: IP/ID em tela estável), aplicar **blur de conteúdo inteiro CURTO na janela exata** — janelas calculadas do REPORT: `orig = block_start + ((frame-1)/fps)*1.2`, cluster gap≤5s, ±1,5s de margem.
- **Borda de corte:** estender o `enable` do blur ALÉM do 1º/último frame do bloco (`if janela toca borda -> s=-2, e=dur+3`). Senão o último frame vaza (vazou CPF).
- **Container (Zoom):** grava 3ª track `bin_data` que quebra a duração (Vimeo/Finder leem 2h48 num vídeo de 9min). SEMPRE remux final: `ffmpeg -i tmp.mp4 -map 0:v:0 -map 0:a:0 -c copy -map_chapters -1 -movflags +faststart out.mp4`.
- **Mac dormindo MATA jobs longos.** `caffeinate -dimsu bash <script>` + **tampa aberta** + energia. Tampa FECHADA força sleep (caffeinate não vence). `nohup ... & disown` pra o processo sobreviver ao fim da sessão. Backup dos scripts+dados de OCR numa pasta durável (a temp `/private/tmp` some no reboot). `sudo pmset -a disablesleep 0` restaura sleep normal (mochila).
- **AUTOPILOT gated (blindagem):** loop `build→render→verify`; se REPORT>0, calcula janelas e re-processa (até N passes); **só com REPORT=0** extrai áudio (`ffmpeg -i mp4 -vn -c:a libmp3lame -q:a 2 mp3`) e sobe Vimeo. Nunca publica com resíduo. Vigia opcional que toca `afplay Glass.aiff` no fim.
- **Vimeo (upload grande):** API tus com `VIMEO_ACCESS_TOKEN` (.env), `folder_uri` do projeto (achar/criar a pasta via API), `privacy view=unlisted embed=public`, nomes "Curso — Aula X.Y — Título". Escreva o script de upload com a API tus. (file_upload do navegador NÃO serve p/ vídeo: cap 10MB.)
- **Área de membros (ex.: Ticto)**: módulo "ENCONTRO - N [DD/MM/AAAA | HH:MM]" + capa; aula = nome "N.M — Título" + capa Horizontal(341×194)+Vertical(474×1000) + data liberação + elementos VÍDEO(fornecedor Vimeo + URL) / ÁUDIO(mp3) / "Legendas e Transcrições"(srt+txt) / "Playbook"(guia+comandos PDF). VIDEO só precisa da URL Vimeo.
- **Capas:** gpt-image-2 (fundo tech navy #070b14 + rede azul + servidores verde-ciano, sem texto) + PIL compõe anel ciano #00f0ff + triângulo PLAY branco centralizado. Reusar 1 H + 1 V p/ todas as aulas + 1 do módulo.
- **Privacidade de PRODUTO real:** aula que mostra produto/funil do autor como caso de exemplo → anexar SÓ vídeo + áudio (sem docs/guia/transcrição/legenda que permitam copiar o produto); descrição genérica. Perguntar/confirmar se uma aula é "produto a proteger".

## Material de apoio por aula — GUIA/RESUMO (visão + transcrição + legenda) [obrigatório p/ área de membros]
Cada aula da área de membros leva: vídeo + áudio(mp3) + legenda(.srt) + transcrição(.txt) + **GUIA HTML+PDF** + comandos. O GUIA NÃO é só resumo da transcrição — é fruto de **método tríplice, combinar os 3**:
1. **Transcrição (.txt)** — o que foi DITO.
2. **Legenda (.srt)** — timestamps p/ ancorar seções/capítulos e "aos X:XX ele mostra…".
3. **ASSISTIR pelos FRAMES** (extrair ~1 frame/2-3s, ler por VISÃO, subagentes em paralelo por janela) — o que foi MOSTRADO na tela que a fala não captura: comandos digitados, telas, URLs, resultados, cliques, código. Ancorar cada achado no timestamp da legenda.
Só DEPOIS de entender o contexto pelos 3, escrever o GUIA com: resumo executivo · guia passo-a-passo · **comandos importantes (transcritos da TELA, não inventados)** · observações/insights · **links úteis** (ditos e mostrados) · "o que aparece na tela" com timestamp. Saída: HTML estruturado (IDV) + PDF (Chrome `--headless --print-to-pdf`), 1 por aula. Nunca inventar; se só está na tela, pegar do frame. Extrair áudio: `ffmpeg -i aula.mp4 -vn -c:a libmp3lame -q:a 2 aula.mp3`.

## ⛔ REGRA DE OURO — caixa fixa NUNCA em página que rola (falha real)
Dado sensível em **página/terminal que dá scroll** (checkout, formulário, e-mail, terminal) **muda de posição vertical** ao rolar. Uma `drawbox`/overlay com X,Y fixos cobre só UMA posição de scroll → nas outras o dado aparece embaixo/acima da caixa. **Isso vazou um CPF num caso real.**
**Obrigatório:** rastrear CADA dado sensível por **OCR frame-a-frame** e a caixa **segue o dado** (como um editor que assiste e move o blur). Nunca confiar em caixa fixa para dado rolável.
1. Montar lista de **strings sensíveis literais** (CPF, telefone, e-mail, IP, IDs, nome). 
2. OCR de **todos** os frames (`tesseract f.jpg stdout --psm 11 tsv`, filtrar tokens) → posição (x,y,w,h) por frame.
3. **Amostragem densa** nas janelas roláveis: extrair a 8–10 fps (`fps=10`) e OCR denso — 2s de intervalo NÃO acompanha scroll rápido.
4. Caixa = box detectado **+ padding ≥20px** e **ponte temporal** (±0.4s) entre detecções pra não piscar; se um dado tem >1 posição na janela, gerar **track por posição** (não uma caixa gigante estática — a menos que seja o único jeito seguro).
5. **Verificar densamente:** reextrair **TODOS** os frames da janela tratada (não amostras) e confirmar 0 legível. Conferir INÍCIO e FIM de cada bloco e as duas bordas de qualquer corte.
6. Rodar essa revisão em **todos** os vídeos do lote, não só onde "achou" na primeira passada.

## Anti-erros
- Blur de POUCA informação (ex.: 4 dígitos) pode ser atacado → preferir tarja ou corte nesses.
- Confirmar bordas de corte na legenda p/ não cortar frase no meio.
- Popup de gerenciador de senha (LastPass/1Password) costuma vazar bandeira + últimos 4 dígitos — checar cantos.

## Pipeline completo "Encontro / aula longa" (validado em gravações reais)
Quando for editar gravação de mentoria p/ área de membros (Vimeo), além da censura:
1. **Acelerar 1.2× preservando a voz:** `[0:v]setpts=PTS/1.2` + `[0:a]atempo=1.2` (atempo mantém o tom — sem chipmunk; A/V em sync). "Acelerar 20% sem mudar o áudio" = isto.
2. **Token recorrente (IP/hostname) em terminal que rola → OCR, não caixa fixa:** `tesseract frame.jpg stdout --psm 11 tsv` filtrando o token → agrupar hits por posição (célula ~110×55px) + janelas temporais (OR). Blur eficiente = **1 blur do frame inteiro → `split=N` → crops sobrepostos** por região (`enable='between(t,a,b)+...'`), NÃO N blurs por frame.
3. **Dividir em blocos temáticos** nos silêncios do `.srt` (gap ≥0.6s, nunca cortar frase). Renderizar cada bloco direto da fonte com `-ss t0 -t dur`; **enable usa tempo LOCAL** (S−t0) porque `-ss` reseta o relógio. Ordem: blur (tempo original) → `setpts/1.2`.
4. **Janela que cruza corte de bloco** (ex.: checkout no limite): a mesma janela de censura tem que existir nos DOIS blocos + **começar 1-2s antes** de o dado aparecer (a página carrega antes da fala). Verificar o FIM de um bloco e o INÍCIO do próximo.
5. **Encoder:** `h264_videotoolbox -b:v 12000k` (Mac HW, ~2.5× realtime) p/ não levar horas. Extrair frame de conferência como **PNG** (mjpeg reclama do range do videotoolbox).
6. **Entrega padrão para área de membros:** `ENTREGA-AREA-DE-MEMBROS/Aula X.Y - Título/` com `.mp4` + PDF/HTML de comandos da aula + `_LEIA-PRIMEIRO.txt` na raiz + `MUDANCAS.md`. Comandos ensinados → PDF master + HTMLs por seção (Chrome `--headless --print-to-pdf`), com valores sensíveis (IP/e-mail/repo) trocados por placeholder.

## Relacionado
- **`ticto-area-membros`** — passo seguinte: publicar o vídeo/áudio/guias na área de membros (ex.: Ticto). Rode DEPOIS desta.

## Passada de LIMPEZA por VISÃO (cleanup pass) — validado em caso real (o mais importante)
Depois da 1ª censura, SEMPRE rode uma passada de limpeza sobre os vídeos FINAIS (os que vão/estão no ar). Aprendizado duro: **OCR sozinho não basta** — num caso real ele deu falso-positivo (cabeçalho de coluna "Assinaturas" lido como e-mail) E **deixou passar PII real**: o **e-mail pessoal (Gmail) do apresentador** num banner sem blur, **dados financeiros de campanha**, **IDs de conta em barras de endereço** e um **2º IP de servidor**. Só a leitura por VISÃO pegou tudo.

Método (por vídeo, subagentes por janela):
1. **Isolar por VISÃO, não por OCR.** Extrair frames nativos nas janelas suspeitas e LER; reportar tipo + tempo + região (x,y,w,h) + estável/rola. OCR serve só pra achar candidatos e depois confirmar 0 — nunca como veredito sozinho.
2. **IDs de conta moram na BARRA DE ENDEREÇO.** Toda aba de console/ads (Meta Ads Manager, Google Ads, Business) tem `act=`, `business_id`, `ocid`, `uscid`, `euid` na URL. A URL **rola horizontalmente** → borrar a **faixa inteira da barra de endereço** (ex.: `crop=1800:64:160:66`), não um retângulo estreito. Se a aba aparece de forma intermitente, use **UMA faixa contínua** cobrindo todo o intervalo em vez de caçar bordas.
3. **Scroll derruba caixa fixa (2 casos reais num caso real):** (a) o e-mail no banner subiu de y538→y489 ao rolar e ainda aparecia num 2º lugar (campo "e-mail de teste", y723) → precisou de **caixa grande cobrindo toda a zona** por onde o dado passa; (b) a linha `@` da tabela DNS apareceu mais embaixo (y~1000) por 1 frame no **assentamento do scroll** → caixa que cobre **todas as linhas da coluna**. Regra: para qualquer painel rolável, cobrir a zona inteira e **verificar os frames de transição/assentamento do scroll**.
4. **Re-verificação densa pega vazamento de BORDA.** Após renderizar, OCR denso (≥3–4 fps) das janelas + **margem além do blur**: num caso real o dado ainda era legível **logo após** o fim do blur (`act=` em 509–512s) e **logo antes** do início (ID em 545s). Estenda a janela e re-verifique até 0, sempre conferindo início/fim.
5. **Loop até 0, sem amostra.** Achou vazamento → ajusta caixa/janela → re-renderiza SÓ o afetado → re-verifica denso. Nunca publicar/substituir antes de 0 legível confirmado por OCR + visão nas transições.
6. **Substituir no Vimeo mantendo a URL:** usar a **versions API** (`POST /videos/{id}/versions` + upload tus) para trocar a FONTE do vídeo já publicado — a URL/embed **não muda**, então não precisa mexer no Ticto.  Áudio não muda no re-blur (`-c:a copy`), então mp3/legendas seguem válidos. Guardar o original como `_ORIGINAL-pre-redacao.mp4` antes de promover.
