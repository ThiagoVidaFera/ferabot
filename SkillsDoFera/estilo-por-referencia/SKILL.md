---
name: estilo-por-referencia
description: "Extrai a gramática visual de um vídeo de referência (cenas, enquadramento, tipografia, ritmo, som) num pacote de 4 arquivos e reaplica com a identidade do cliente/marca; copia decisões, nunca a obra. Triggers: faz igual a esse vídeo, quero esse estilo, analisa essa referência."
---

> **Origem e adaptação (FeraBot).**
> - Skill do pacote "Sistema de Criativos FCA" (créditos no LEIA-ME desta pasta). No FeraBot ela entra como **direção
>   criativa**: roteiro, cena, regras e checklists.
> - Onde citar `bin/motor-video.py`, `motor-de-video`, `remotion-marca`, `kit/` ou `acervo/`: esses caminhos não existem
>   aqui. Use o que você tem: `ScriptsFera/render.py`, `ScriptsFera/narrar.py` e FFmpeg, ou o motor de vídeo que preferir
>   (HyperFrames ou Remotion, se estiver instalado).
> - Cores, fontes e marcas dos exemplos (MCT, MLC/Lead Certo, FCA, ciano #00f0ff, Sora) são do autor original: aqui valem
>   as do seu `perfil.json`.
> - Prova e número: número sem origem fica fora da peça. Nunca inventar print, depoimento ou resultado. Selo SIMULAÇÃO
>   não libera peça pública.
> - Copy de venda passa pelo checklist A/B/C/D do roteador; mídia gerada por IA tem o custo dito antes de gastar crédito.

# estilo-por-referencia — copiar a gramática, nunca a obra


Princípio: **a referência ensina decisões, não pixels.** "Faz parecido" vira uma lista de decisões medidas
que o agente consegue executar e você consegue conferir.

## Quando usar
- Um vídeo (ou print, ou link baixado) de inspiração + um vídeo nosso para editar.
- Antes de propor estilo novo para um produto (ver o que o mercado usa).
- Não usar para lote de dezenas de anúncios de uma marca → `map-editing-style`.

## Entradas
- Referência em `referencias/` (arquivo local; se for link, baixar primeiro).
- Nosso vídeo em `originais/` + destino (anúncio, reel, aula).
- Identidade: a do aluno (seção "Minha identidade" do CLAUDE.md; se vazia, perguntar uma vez e gravar lá); sem resposta, os tokens de `kit/src/brand/`.

## Passo a passo
0. **A referência é um vídeo PROGRAMADO (motion/UI/kinetic type)?** Procure antes na biblioteca de 513 vídeos com prompt real (skill `biblioteca-videos-ia`, `python3 bin/biblioteca-de-referencia-de-videos-ia-biblioteca.py --buscar`): se houver um molde parecido com remake confiável, parta do prompt dele em vez de engenharia reversa.
1. **Identidade técnica da referência:** ffprobe (duração, dimensão, fps, faixas), hash curto do arquivo
   (se o arquivo mudar, a análise não vale mais).
2. **Cobertura separada:** visual (folha de contato a cada 1 s + cortes por `select='gt(scene,0.3)'`),
   áudio (música, SFX, silêncios), transcrição (whisper local). Diga o que **não** foi possível cobrir.
3. **Linha do tempo por unidade de sentido**, não só por corte: `id · início · fim · fala · foco visual ·
   texto na tela · movimento · áudio`.
4. **12 dimensões de edição** — cada uma com achado ou "não verificável": formato · enquadramento do
   apresentador · moldura/layout · paleta · tipografia · hierarquia de texto · legenda · inserções · motion
   · transições · ritmo (troca de estímulo em s) · som.
5. **6 dimensões de venda** (o que análises comuns esquecem): gancho 0–3 s · ângulo · tipo de prova (tela
   do comprador? demonstração? depoimento?) · oferta · CTA (texto, momento, duração) · curva de ritmo.
6. **Marque cada achado:** `observado` (visto/ouvido/medido) · `inferido` (hipótese de como foi feito) ·
   `nao_verificavel`. Aparência não prova método: "texto atrás da pessoa" é observado; "usou o modelo X
   de recorte" é inferido. Regra recorrente só com 2+ ocorrências.
7. **Mapa de transferência** — tabela `evidência → regra → adaptação nossa → como verificar`. Adjetivo
   vira decisão ("dinâmico" = estímulo novo a cada 2–3 s; "limpo" = máx. 2 elementos de texto na tela).
8. **Tradução para a identidade do aluno (nunca a do autor do curso):** use as cores e fontes de "Minha identidade" no CLAUDE.md do aluno; os valores a seguir são só o padrão do kit para quem não definiu: paleta deles → `darkbase #020408` / `cardBg #050812` / borda `#1a2e55`
   / destaque `brandCyan #00f0ff` / sucesso `brandGreen #34d399`; fonte condensada deles → Sora 800 caixa
   alta (título) + Roboto (apoio e legenda); grade de fundo 40 px a 6% de opacidade; cantos 20–24 px;
   CTA ciano→verde. Os hex acima são os valores de `kit/src/brand/colors.ts`; no código entram como
   `colors.*` de `@brand`, nunca soltos. Nunca roxo/lilás herdado da referência.
9. **Amostra** (via `direcao-de-edicao-ia`) e comparação **lado a lado** referência × nossa amostra por
   dimensão — compara-se gramática, não cor.

## Remodelar uma referência em peça nossa (fonte: EVIA A10, A14)
Quando o pedido é "faz um igual a esse para o meu produto" (e não só "pega o estilo"), o pacote acima vira **tabela cena a cena**.
1. **Achar e guardar.** Buscar no Pinterest/Reels pelo tema do nicho **em inglês** ("business", "marketing agency") rende mais motion
   profissional. Link curto (`pin.it/…`) → baixar para `referencias/edicoes/` (`yt-dlp <link>`; se falhar, gravação de tela). Nunca colar vários
   vídeos no chat (gasta contexto): pasta fixa + **nome do arquivo = o que copiar** (`07 - transicao continua tipo mapa.mp4`). Pedido futuro:
   "siga a edição da referência 07, respeitando a nossa identidade".
2. **Escolher o modo** (escrever no BRIEFING qual é):
   | Modo | Quando | Mantém | Troca |
   |---|---|---|---|
   | A · mesmo nicho | a referência fala com o nosso público | modelo, ritmo, tipo de prova | cores/fontes (passo 8), copy do produto, provas nossas |
   | B · fora do nicho | só a forma serve | ordem das cenas, tempos, ritmo, transições | cores, copy, narração e **cada objeto** por um equivalente do nosso nicho |
   | C · vitrine | testar o teto do motor (15 s, sem produto) | nada | tudo; serve para colher técnicas, não vai ao ar |
3. **Tabela de substituição** (`referencias/<slug>/substituicoes.csv`: `cena · na referência · no nosso · por quê`). Marca famosa → ícone
   genérico do nosso universo; objeto clássico (coluna, estátua) → objeto da nossa marca (pedestal no acento); gráfico genérico → a tela que o
   nosso comprador usa; assinatura final → cartão de CTA nosso. Nenhum elemento passa sem linha na tabela.
4. **3D da referência continua 3D:** se a referência tem objeto 3D, não aceitar foto 2D no lugar — `objeto-3d-real-com-contorno` com modelo
   de licença livre; se o objeto não existe no repositório, substituto de mesma função, declarado na tabela.
5. **Narração:** casar a velocidade da referência só com voz de catálogo; narração na voz do autor segue o perfil B (regra global).
6. Comparar referência × nossa versão cena a cena (folha lado a lado) antes de aprovar.
- **Padrões medidos em 9 referências profissionais** (fonte: EVIA A10), já traduzidos para efeitos do catálogo: troca de estímulo a cada ~1 s ·
  uma ideia por frase · continuidade "mapa" (`cena-nasce-da-anterior`) · 2–3 cores + neutro · palavra-chave em outra família tipográfica
  (`LETED-EF-02`) · metáfora editorial recortada por frase · pessoa recortada com texto atrás (`LETED-EF-11`) · foto real que sobe
  (`foto-real-sobe-sobre-titulo`) · clipe viral com camada explicativa (só orgânico) · CTA com palavra-chave.
- Contraponto EVIA A14: a fonte pede "faça um igual"; aqui segue valendo **copiar a gramática, nunca a obra** — a tabela de substituição é obrigatória.
- Literais da fonte: `conhecimento/dossiers/themes/PROCEDIMENTOS/PROC-EVIA-A14-remodelar-referencia.md` e `PROC-EVIA-A10-pasta-de-referencias-e-analise.md`.

> **Pacote pronto (exemplo):** o estilo camadas editorial já virou a skill `estilo-camadas-editorial` (gramática medida em 20 reels em `artefatos/estudo-lettering-editorial/GRAMATICA-LETTERING-EDITORIAL.md`): use-a direto em vez de refazer a análise.

## Saída (pacote de 4 arquivos em `referencias/<slug>/`)
- `relatorio.md` — resumo, cobertura, as 18 dimensões, limitações.
- `mapa-de-cenas.csv` — `inicio,fim,fala,foco_visual,asset,acao_visual,texto_tela,audio,criterio,status`.
- `receita-visual.json` — `{reference, coverage, evidence[], findings[], rules[], transfer[], limitations[]}`
  com `status` em cada item; todo `evidence_id` citado existe.
- `prompt-de-recriacao.txt` — o pedido pronto para o agente, já com a identidade do aluno, deixando em branco só
  `[destino] [formato] [oferta]`.
O pacote é reutilizável: próxima sessão parte dele e só reabre lacunas.

## Prompt-modelo
```
Analise referencias/[ref].mp4 como referência de ESTILO para o nosso [vídeo]. Se não conseguir ver ou
ouvir alguma parte, diga e siga sem fingir. Cubra visual, áudio e transcrição separadamente.
Entregue o pacote de 4 arquivos (relatório, mapa-de-cenas.csv, receita-visual.json, prompt) marcando
cada achado como observado/inferido/não verificável, incluindo gancho 0–3 s, tipo de prova e CTA.
Traduza a paleta e a tipografia para a identidade do aluno (seção "Minha identidade" do CLAUDE.md dele). Não transporte texto,
oferta, preço, prova nem asset da referência. Não edite nada ainda.
```

## Checklist da amostra
- [ ] As 3–5 regras essenciais da referência aparecem (as decorativas podem ficar de fora)
- [ ] Nenhum texto, número, logo ou asset da referência no nosso vídeo
- [ ] Paleta e fontes são as nossas
- [ ] Ritmo medido parecido (troca de estímulo ±0,5 s)
- [ ] O que a referência vende (gancho, prova, CTA) foi adaptado ao nosso produto com dado nosso
- [ ] Sem costura seca (02/10/2026): faixa de título/selo sobre mídia em degradê ≥ 220 px, mídia encaixada com bordas esfumadas ≥ 120 px, troca de mídia na mesma cena com crossfade 8–12 quadros — regra em `remotion-marca` → "Costura sem degradê"; rodar `python3 bin/detectar-costuras.py VIDEO.mp4`

## Armadilhas
- Agente "analisa" vídeo que não abriu → exija cobertura com intervalos e a frase "se não conseguir, diga".
- Copiar efeito sem a função dele (cartão que não explica nada).
- Herdar a paleta da referência e sair com cara de terceiro.
- Copiar a prova do outro ("edição anterior", print de resultado alheio) — a prova tem de ser nossa.
- Estilo didático (cartões passo a passo) em fala pessoal: não serve; peça à IA qual linguagem combina antes.
