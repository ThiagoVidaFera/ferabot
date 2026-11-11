---
name: catalogo-de-efeitos
description: "Catálogo de efeitos de motion (ids, durações, props) para pedir ao motor de vídeo: comparação, diagrama, prova na tela, legenda, transições. Referência de prova-na-tela e das skills eva-*. Triggers: catálogo de efeitos, qual efeito usar, id do efeito."
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

# catalogo-de-efeitos — o efeito é escolhido pelo que a fala AFIRMA

Princípio: **o efeito nasce da relação dita, não da aparência que agrada.** Antes de olhar qualquer
efeito, responda: *"quando o autor fala esta frase, o que precisa mudar na tela?"*. Se nada precisa mudar
(fala pessoal, emoção, história), não há efeito: fica o take, legenda e tracking.

Arquivos desta skill:
- `catalogo.json` — os 391 efeitos (fonte única; quem roteia lê dele).
- `RECEITAS-SOM-EVA.md` — receita sonora consolidada (abertura, silêncios, clique, SFX, emenda, plot no CTA, duck, A/B) com `<Audio volume={(f)=>…}>`.
- `RECEITAS-IA-EVA.md` — prompts reutilizáveis (ChatGPT de copy, Veo 3 com continuidade de personagem, ElevenLabs TTS e Voice Changer).
- `PADRAO-DE-MOVIMENTO.md` — tempos, curvas, tipografia em 1080x1920 e 1080x1350, zonas seguras, paletas por produto.
- `VERTICAL.md` — como cada família vira 9:16 e 4:5.

## Ordem de decisão (sempre)
1. **A prova já existe em print ou gravação real?** → `prova-na-tela` (a tela real fica, só a atenção se move).
2. **Senão, a relação cabe num efeito do catálogo?** → árvore abaixo.
3. **Senão, o volume/espaço é a resposta?** → `motion-explicativo-3d` (3D ou 2,5D declarado).

## Árvore única (vale o primeiro ramo que casar)
```
A fala...
├─ é pessoal/emocional ou não explica nada ............... SEM EFEITO (take + legenda); só TRATAMENTO e SOM, se a emoção pede
├─ aponta para uma prova que JÁ está em print/gravação ... família EVIDÊNCIA → prova-na-tela
│    números do painel ................ prova-circular-metricas · numero-ao-detalhe-na-tela
│    um campo/trecho .................. regiao-com-nota · trecho-de-fonte-marcado · comentario-com-marcador
│    conserto ......................... problema-resposta-resolvido
│    ação na tela ..................... checklist-sincronizado-com-tela · toques-no-celular · atalho-e-alvo · voz-vira-texto-no-campo
├─ MEDE ou COMPARA com número ............................ família COMPARAÇÃO
│    "X vezes" ........................ barras-de-razao (sem zero)
│    evolução no tempo ................ barras-sequenciais (aceita zero) · linha-e-tendencia · atual-depois-historico
│    ranking/ordem da história ........ barras-em-foco · tour-entre-dois-cartoes
│    várias métricas/unidades ......... barras-agrupadas-por-metrica · matriz-a-contra-b
│    funil/queda ...................... perda-por-etapa
│    soma/conta/retorno ............... livro-caixa-total · conta-ate-o-retorno · meta-ultrapassada · de-x-a-y
│    partes de 100% ................... tira-de-composicao · registros-e-anel · icones-contaveis
│    antes/depois com imagem .......... antes-depois-em-pares · mesma-busca-tres-telas · linha-a-linha-antes-depois
├─ CONECTA coisas (processo, causa, estrutura) ........... família DIAGRAMA
│    fluxo entre sistemas ............. pistas-de-mensagens · tudo-passa-pelo-centro
│    muitos → um ...................... entradas-viram-um-resultado · funil-absorve · fontes-convergem-na-prova
│    um → muitos ...................... material-vira-varias-pecas · tres-raios-do-centro · ramo-a-ramo
│    ciclo / linha do tempo ........... ciclo-que-fecha · ciclo-em-rodadas · linha-do-tempo-marcos · marco-com-detalhe
│    hierarquia ....................... escopo-aninhado · nivel-em-destaque · piramide-com-notas
│    explicar partes .................. chamadas-ancoradas · decompor-e-varrer · soma-das-partes · velho-sai-novo-explica
├─ ACUMULA itens/estados ................................. família CARTÕES
│    status de etapas ................. status-por-etapa · grade-com-prioridade · matriz-afirmacao-prova
│    contagem que sobe ................ recibos-e-contador · razao-entre-pontas
│    lista simples .................... lista-em-capsulas · centro-e-quatro-cantos · cartoes-pousam-na-frente
├─ A PALAVRA é o argumento ............................... família TIPOGRAFIA
│    corrigir/redefinir ............... copy-riscada-e-corrigida · redefinicao-de-termo
│    nomear tema ...................... titulo-toma-a-tela · titulo-atras-da-pessoa · nuvem-de-topicos-atras
│    impacto .......................... choque-e-afirmacao · pergunta-no-ar · termos-que-sufocam
│    lista de públicos ................ etiquetas-que-acumulam (profissão-alvo MAIOR)
│    número sobre o take .............. numero-e-veredito-sobre-video
├─ PESSOA + explicação juntas ............................ família DIVISÃO
│    lista ............................ lista-progressiva-apresentador · veredito-tres-afirmacoes
│    celular .......................... celular-com-etiquetas · celular-conclui-e-recua
│    texto/citação .................... citacao-sublinhada · faixa-de-leitura-documento
│    história real com prova contínua . tela-dividida-midia-em-cima
├─ DEMONSTRAÇÃO maior que a pessoa ....................... família JANELA
├─ IMAGENS/DOCUMENTOS reais como material ................ família COLAGEM (depoimentos, parede de provas)
│    quem é a pessoa real ............. foto-real-sobe-sobre-titulo
│    por que um exemplo funcionou ..... clipe-viral-com-camada-explicativa (só orgânico)
│    símbolo com peso físico (3D) ..... objeto-3d-real-com-contorno
├─ ABRE SEÇÃO / localiza na série ........................ família CAPÍTULO (aula/VSL; nota 0–1 em anúncio)
├─ O CORTE é o ponto ..................................... família TRANSIÇÃO
│    separar blocos .................. separador-estroboscopico-negativo · flash-de-brilho-unico · gesto-acelerado-como-transicao
│    revelação ........................ olho-abre-congela-revela · fecho-lento-com-fade
│    ideias encadeadas sem cortar ..... cena-nasce-da-anterior
│    troca de layout sem virada ....... assentamento-minimo-entre-blocos
├─ a FRASE é a tela (anúncio de cartela, VSL de texto) ... TIPOGRAFIA Estilo Visual de Anúncio (EVA)
│    cada frase ....................... cartela-frase-palavra-colorida (+ entrada-sobria-da-cartela)
│    impacto/termo central ............ golpe-de-cor-chapado · palavra-desembaca · zoom-na-palavra-final
│    enumerar ......................... palavra-gigante-em-rajada · callback-das-perguntas
│    escrita/ironia/número ............ frase-digitada-com-tecla · ironia-que-treme · marca-texto-no-numero · icone-acima-da-frase
├─ o CLIMA ou o FOCO do take/b-roll ...................... família TRATAMENTO
│    grade-escura-da-marca · grade-de-clima · flashback-preto-e-branco · vinheta-foco-central · micro-zoom-por-frase · ocultar-rosto
│    instante decisivo num vídeo real . zoom-na-regiao-da-acao · peça sem rosto chapada ... mundo-de-papel-em-tres-camadas
├─ o autor pediu o efeito PELO NOME (orbit, pull-back…) .. dicionário em `estilo-efeitos-nomeados` → REF-EDICAO-IA-EF-xx ou entrada com `ref_edicao_ia`
├─ CHAMA PARA A AÇÃO ..................................... família CTA (chevron-duplo-cta · cta-tela-verde-alternada · cta-final-em-loop · orgânico: REF-EDICAO-IA-EF-24 caixa de comentário)
└─ a camada de SOM da peça ............................... família SOM → RECEITAS-SOM-EVA.md
```
Desempate: maior nota no uso da peça (`notas.anuncio|reels|vsl|aula`); depois menor duração; depois o
que exige menos insumo. Em **anúncio**, só efeitos com nota ≥ 2.

## Como consultar o catálogo
```bash
# efeitos de comparação bons para anúncio
python3 -c "import json;d=json.load(open('SkillsDoFera/catalogo-de-efeitos/catalogo.json'));[print(e['id'],e['duracao_anuncio_9x16_s'],e['limites_9x16']) for e in d if e['familia']=='comparacao' and e['notas']['anuncio']>=3]"
```
Campos: `id`, `nome`, `familia`, `relacao`, `gatilhos`, `insumos` (apresentador/recorte/imagens/dado/texto),
`exige_origem`, `duracao_16x9_s`, `duracao_anuncio_9x16_s`, `limites_9x16`, `assinatura`, `invariantes`,
`proibicoes`, `notas`, `ref_ficha` (item da ficha de estudo, só para rastreio).
Campos opcionais (entradas Estilo Visual de Anúncio (EVA)): `origem` (`editor-visual-ads` = nova; `interno+editor-visual-ads` = nossa entrada enriquecida),
`editor-visual-ads` {`ferramenta`, `valores` exatos lidos no CapCut/Canva, `evidencias` "<produto> · <aula> @ mm:ss", `riscos` ⚠️},
`traducao` {`remotion`, `hyperframes`}, `duracao_fonte` (texto da fonte; nas faixas, `duracao_*_s` guarda o meio da faixa;
`null` = a fonte não deu duração).

## Efeitos das lives (Imersão de Estratégia) — entram na mesma árvore
Novos (13): `base-9x16-preto-centro` · `serifa-leve-branca-sobre-preto` · `dores-empilhadas-que-se-completam` · `foto-sem-fundo-com-degrade-sombra` ·
`pergunta-na-tela-diferente-da-fala` · `colagem-caotica-de-videos` · `fecho-por-duvida-desfocada` (CTA) · `clipe-encolhido-bordas-suaves` ·
`cartela-entra-na-palavra-dita` · `congelar-quadro-na-palavra` · som: `som-tratamento-da-narracao` · `som-tic-tac-e-hit-de-relogio` · `som-musica-tematica-com-suspense`.
As demais técnicas das lives enriqueceram entradas existentes (`editor-visual-ads.valores.imersao-de-estrategia`, ids `RV-EXP-xxx`).

## Efeitos de edição com especialista e de referências profissionais (fonte: EVIA A10–A14, 17/10/2026)
Novos (8), `origem: evia`, com tradução Remotion/HyperFrames: `cena-nasce-da-anterior` · `assentamento-minimo-entre-blocos` (transição) ·
`tela-dividida-midia-em-cima` (divisão) · `zoom-na-regiao-da-acao` · `mundo-de-papel-em-tres-camadas` (tratamento) ·
`foto-real-sobe-sobre-titulo` · `clipe-viral-com-camada-explicativa` · `objeto-3d-real-com-contorno` (colagem).
Como usar bem:
- **Formato tela dividida** = `tela-dividida-midia-em-cima` dominante + `zoom-na-regiao-da-acao` na metade de cima (a mesma cena 2–3 vezes) +
  `assentamento-minimo-entre-blocos` em toda troca de layout + `ocultar-rosto` em quem não deve aparecer. Motion entra numa metade, nunca em tela cheia.
- **Peça sem rosto que ficou chapada** → `mundo-de-papel-em-tres-camadas` e, entre ideias que derivam uma da outra, `cena-nasce-da-anterior`
  (cada emenda com portador registrado no `EMENDAS.md`).
- **Referência com objeto 3D** → `objeto-3d-real-com-contorno`; licença do modelo no `build.json`.
- Os tempos de `assentamento-minimo-entre-blocos` foram lidos aproximados na tela da fonte: conferir na amostra antes de fixar.

## Efeitos nomeados de referências de edição com IA (fonte: 19 reels, 17/10/2026)
Fonte: um perfil de referência que ensina a editar dentro do Claude e diz o nome de cada efeito, mais um segundo criador do mesmo nicho. Gramática: `artefatos/estudo-efeitos-nomeados/GRAMATICA.md`. Estilo completo e receitas Remotion: skill `estilo-efeitos-nomeados`.

**Novos (29)**, com `origem: ref-edicao-ia`, ids `REF-EDICAO-IA-EF-01..29` e o nome em inglês entre parênteses (é como o autor pede):
- **colagem:** órbita (orbit) · parede atrás (couch wall) · muro de manchetes (headline wall) · pessoa sobre a prova (green screen) · colagem de papel (paper cut)
- **janela:** mundo de interface (UI world) · recuo que revela a ferramenta (pull-back reveal) · cartão entre as mãos · linha do tempo que limpa os erros (NLE timeline)
- **transição:** zoom-through cut · do bruto ao final (raw clip)
- **tratamento:** doodle boil · vertigo · eyedropper grade · paródia do erro
- **tipografia:** cover story · rótulo preto de story · gravity drop · giant captions · kinetic hook · legenda que troca de estilo (cool girl/cool dude)
- **evidência:** freeze and label · file drop
- **comparação:** before and after com alça · recibos com total riscado
- **cartões:** índice lateral com contador · requisitos riscados com check final
- **diagrama:** especialista que se clona
- **cta:** caixa de comentário que digita a palavra (comment drop; só orgânico)

**Já existiam e ganharam o campo `ref_edicao_ia`** com os valores medidos e os gatilhos pelo nome (20):
- `LETED-EF-10` (frame break)
- `micro-zoom-por-frase` (digital zoom)
- `celular-com-etiquetas` (phone mockup)
- `checklist-sincronizado-com-tela` (checklist)
- `linha-e-tendencia` (chart grow)
- `titulo-atras-da-pessoa` (glass type)
- `vinheta-foco-central` (spotlight)
- `grade-de-clima` (film look)
- `capitulo-selo-titulo-subtitulo` (title card)
- `colagem-caotica-de-videos` (playing grid / reel feed)
- `LETED-EF-06` (prompt bar)
- `LETED-EF-17` (contador)
- `LETED-EF-20` (icon strike / jiggle delete)
- `recibos-e-contador`
- `prova-circular-metricas`
- `legenda-palavra-chave` (palavra-herói)
- `mesmo-pedido-dois-resultados` (dele × meu)
- `tela-dividida-midia-em-cima`
- `zoom-na-regiao-da-acao` (tour do painel)
- `trecho-de-fonte-marcado`

Regras de uso:
- **Exceções ao PADRAO §2** (orbit, doodle boil, gravity drop, paródia) estão escritas no campo `excecao_padrao` de cada entrada. Valem para 1 efeito por peça, nunca no gancho de anúncio com prova.
- **No pago:** ícone genérico no lugar de logo de terceiro, e nada de caixa "comenta".
- **O alcance veio do tema:** os 3 reels mais vistos do estudo quase não tinham efeito. Use estes efeitos para segurar e explicar, não para trazer gente.

## Como escolher um efeito Estilo Visual de Anúncio (EVA)
1. **Mesma árvore, mesma pergunta**: a família continua sendo a relação que a fala afirma. Por isso as 63 entradas com origem Estilo Visual de Anúncio (EVA)
   foram distribuídas nas famílias (em vez de uma família "editor-visual-ads") e marcadas com `origem`; só nasceram 3 famílias para o que o
   catálogo não cobria: **tratamento** (grade, filtro, vinheta, zoom de câmera), **cta** e **som**.
2. **Peça de cartela** (anúncio de b-roll + frase, VSL de texto): base = `cartela-frase-palavra-colorida` em toda frase, com
   `entrada-sobria-da-cartela`; um `golpe-de-cor-chapado` no termo central; `grade-escura-da-marca` em todo b-roll;
   `chevron-duplo-cta` no fim; som pela RECEITAS-SOM-EVA.md. O resto entra só quando a frase pede.
3. **Valores Estilo Visual de Anúncio (EVA) calibram tamanho, tempo e mix — não a cor.** Paleta, fonte e marca saem do nosso produto
   (PADRAO-DE-MOVIMENTO §6) e o DNA visual/estilo de campanha fica no `estilo-visual-ads` (não duplicado aqui).
4. **Regra do PADRAO vence**, salvo exceção escrita na entrada (o tremor de `ironia-que-treme` e o loop do chevron são as únicas).
5. **⚠️ riscos** (`editor-visual-ads.riscos`: música comercial, b-roll baixado do TikTok, figura pública, menor, saúde, antes/depois como
   forma de passar pela revisão) são **nota**, nunca receita: use a técnica com material próprio ou licenciado, ou não use.
6. Prompts de Veo 3/ElevenLabs/ChatGPT para gerar os insumos: RECEITAS-IA-EVA.md.
```bash
# efeitos Estilo Visual de Anúncio (EVA) bons para anúncio, com a tradução Remotion
python3 -c "import json;d=json.load(open('SkillsDoFera/catalogo-de-efeitos/catalogo.json'));[print(e['id'],'|',e['traducao']['remotion'][:90]) for e in d if 'editor-visual-ads' in e.get('origem','') and 'traducao' in e and e['notas']['anuncio']>=3]"
```

## Como pedir o efeito ao motor
1. Rode o roteador: `python3 bin/motor-video.py "<pedido>"` (skill `motor-de-video`). Motion curto sem pessoa → HyperFrames; com apresentador ou lote → Remotion; os dois → combinado (clipe HF em WebM com alpha dentro do Remotion).
2. Monte o **pedido de efeito** (vale para os dois motores):
```
EFEITO: <id do catálogo>  ·  FORMATO: 1080x1920 (depois 1080x1350)  ·  PALETA: <mct|lead-certo|fca>
FALA: "<frase>" (palavra-gatilho "<palavra>" em <t> s, da transcrição com tempo por palavra)
CONTEÚDO: <campos dentro de limites_9x16>
NÚMEROS: cada valor com origem {arquivo do print/export, tela, data de captura}
ASSINATURA: <assinatura do catálogo>  ·  INVARIANTES: <lista>  ·  PROIBIDO: <lista>
TEMPOS: PADRAO-DE-MOVIMENTO.md (início 0,16 s, leitura final ≥ 1,2 s)  ·  LAYOUT: VERTICAL.md (família <x>)
DURAÇÃO: <duracao_anuncio_9x16_s> em anúncio · <duracao_16x9_s> em aula/VSL
```
3. Em **Remotion**: tempos viram props nomeadas (`entradaQ`, `trocaQ`, `leituraQ`, em quadros) lidas das
   constantes do padrão — nunca número mágico no componente. Componente por efeito em
   `kit/src/efeitos/<id>/`, com `defaults` que passam nos limites.
4. Em **HyperFrames**: o mesmo pedido vira o prompt; render só do trecho, na duração exata.
5. Um efeito por execução, um trecho por batida. Montagem (voz, legenda, trilha) é outra etapa.

## Honestidade de dado (inegociável)
- Todo número na tela tem `origem` (print, export, planilha, depoimento autorizado) registrada no
  `build.json` da peça (ver `motor-de-video`). **Sem origem = selo SIMULAÇÃO visível** e a peça não sobe como prova.
- Derivados (razão, total, %, ROI, variação) **calculados por script** das entradas e conferidos com a legenda/fala.
- Zero em razão não existe: trocar `barras-de-razao` por `barras-sequenciais` ou `barras-em-foco`.
- Unidades diferentes = escalas separadas. Ponto de gráfico na coordenada literal.
- Imagem de IA nunca é prova. Depoimento verbatim. Blur só no dado sensível (tela quase toda borrada não serve).
- MCT: a dor é o **aprendizado** do algoritmo, não contagem de compras; sem preço no criativo.

## Aceite por quadros-chave
"Renderizou e abre" não é aceite. Para cada efeito, extrair e olhar:
1. **Quadro 0** (cena-fonte; em anúncio já com o gancho inteiro);
2. **Mudança principal** (o instante da `assinatura`);
3. **±1 quadro de cada corte** (sujeito não pode aparecer pela metade; título não pode duplicar);
4. **Leitura assentada** (meio da pausa final);
5. **Último quadro** (nunca vazio nem a meio caminho).
```bash
for t in 0 1.8 1.83 3.0 5.3; do ffmpeg -v error -ss $t -i PECA.mp4 -frames:v 1 revisao/q_$t.png; done
```
Conferir na folha: zona segura, tamanhos mínimos, número igual ao print, selo SIMULAÇÃO quando faltar origem,
costura sem borda dura (`python3 bin/detectar-costuras.py`). Depois `ffprobe` do arquivo final.

## Regras do autor que valem para todo efeito
- Todo criativo é **par** (pago "Saiba mais" + orgânico "Digite <PALAVRA>"), exceto anúncio por avatar/profissão (só pago).
- Amostra **só 9:16** até aprovar; 4:5 depois.
- Voz clonada **nunca** sobre take do autor falando: efeitos com apresentador exigem a voz real daquele take.
- Lettering atrás da pessoa: pessoa cobre só a base das letras; faixa de topo sempre com degradê.
- Anúncio por profissão: profissão GRANDE como primeira palavra e símbolo visual da classe.
- **Fotossensibilidade (L11):** nenhum efeito pode passar de **3 flashes/s** (troca claro↔escuro de tela cheia, strobe, whip de luz, flash de CTA em loop); rajadas de corte ≤ 4–5 cortes/s com imagens de luminância parecida; `whip-de-luz-diagonal` e `flash-de-brilho-unico` valem 1 por peça. Vale para qualquer efeito, inclusive os de origem Estilo Visual de Anúncio (EVA)/EDIA/perfil de referência de lettering editorial.
- Famílias novas (15/10/2026): `lettering-editorial` (LETED-EF-01..09, lettering de perfil de referência de lettering editorial sem rosto; **17/10: +LETED-EF-10..20 com pessoa e recorte** — cartão com cabeça vazando, texto atrás, PiP, punch-in, fundo por função, preço riscado, selo, contador/slot, eyebrow de módulo, skins por nicho, substituição — medidos em 20 reels, `artefatos/estudo-lettering-editorial/GRAMATICA-LETTERING-EDITORIAL.md`; o estilo completo com receita está em `estilo-camadas-editorial`; **17/10 tarde: +LETED-EF-21..28 do reel 21 (Del0Q8vjxqz)** — mascote que reage, notch que vira notificação, cursor + toast, timer da dor, morph cartão↔tela cheia, árvore de compatibilidade, micro-interações de sistema, fecho R$ 0 + checklist + CTA digitado; análise em `artefatos/estudo-lettering-editorial/reels-novos/Del0Q8vjxqz/ANALISE.md`) e entradas `origem: meia` da gramática da VSL do MCT (13) + `prova-zoom-congela-anel` + `parallax-hq-2-camadas`. Notas 0–3 são provisórias até a amostra G2.

## Ligações
`prova-na-tela` · `painel-do-comprador-na-cena` · `motor-de-video` · `motion-explicativo-3d` · `apresentador-em-cena` ·
`gancho-dos-tres-segundos` · `remotion-marca` · `filme-de-lancamento` · `estilo-visual-ads` (DNA visual e estilos de campanha) · fichas de estudo em
Origem: estudo interno de referências de mercado (09/10/2026), escrito com estrutura e redação próprias; entradas `origem: editor-visual-ads` da reingestão Estilo Visual de Anúncio (EVA) (Frente E.3, 13/10/2026), fonte `fontes/ESTILO-VISUAL-DE-ANUNCIO-EVA/CURSOS-2026-10/_sintese/`.

## Efeitos de estudos de estilo (18/10/2026): colagem de papel (Vox), TV retrô e colagem rápida
Passo 5 do pipeline de aprendizado de estilo. Entraram **31 efeitos novos** (`origem: estudo-estilo-vox` = 14; `origem: estudo-tv-retro` = 17; este grupo inclui a forma da colagem rápida de apresentadores sintéticos). Mais **7 variantes** de efeitos que já existiam: não viraram entrada, ficam no campo `variantes_estudo` do efeito original (receita completa lá). Total do catálogo: 260 → 291 (o estudo de arquivo editorial, abaixo, levou a 318; o earn edits, a 354). Todos estão no estado "ESTUDADO, receita pronta, sem amostra nossa": testar numa amostra Remotion de 5–15 s em 9:16 antes de usar em peça.
- **Colagem de papel (Vox)** → skill `estilo-colagem-vox`; doc `docs/estudos/2026-10-18-estilo-vox-colagem/GRAMATICA-VOX-COLAGEM.md`: `zoom-blur-radial-abertura` · `tarjas-amarelas-rasgadas-palavra-a-palavra` · `recorte-sobe-e-encaixa-push-in` · `troca-de-fundo-por-varredura` · `troca-de-recorte-por-deslize-lateral` · `legenda-em-tira-de-papel-rasgado-digitada` · `polaroid-fita-e-zoom-through` · `halftone-com-desalinhamento-cromatico` · `texto-em-arco-atras-do-recorte` · `traco-de-pincel-amarelo-destaque` · `stop-motion-em-dois` · `grao-de-papel-animado` · `silhueta-em-marcha-em-loop` · `push-in-com-borrao-de-movimento-recompoe`
- **TV retrô** → skill `abertura-tv-retro`; doc `docs/estudos/2026-10-18-estilo-tv-retro-e-influenciadores/GRAMATICA-TV-RETRO.md`: `recuo-tela-cheia-revela-tv-crt` · `grade-crt-aperture-que-some-no-recuo` · `barril-crt-displacement` · `legenda-corre-durante-recuo-de-camera` · `titulo-duas-faces-sans-serifa-sobre-tv` · `palavra-brilho-de-fosforo-escurece-entorno` · `clipe-arrastado-com-cursor-encaixa-no-vidro` · `layout-tv-em-cima-rosto-embaixo`
- **Colagem rápida com apresentadores sintéticos** (só a forma, sem promessa de renda); doc `.../GRAMATICA-INFLUENCIADORES-IA.md`: `scan-de-luz-revela-rosto-gerado` · `galeria-mesma-pose-troca-rapida` · `colagem-de-topo-cadencia-rapida` · `logo-citado-com-glitch-rgb` · `calendario-vira-faixa-de-contagem` · `pilulas-numeradas-em-cascata` · `cartao-comentario-cai-no-bolso` · `cartela-textura-trocando` · `cta-fundo-preto-palavra-entre-aspas-parada`
- **Variantes anexadas (7):** `REF-EDICAO-IA-EF-08` (tira de céu rasgada) · `titulo-atras-da-pessoa` (letra serifa gigante revelada por corte) · `LETED-EF-08` (disco de cor que cresce) · `janela-sobre-fundo-desfocado` (pulso de desfoque na troca) · `LETED-EF-16` (carimbo e rabiscos desenhados) · `marca-texto-no-numero` (etiqueta amarela que digita) · `cta-final-em-loop` (bookend do quadro inicial).
- Marca: trocar o amarelo/azul/verde-oliva das referências pelos tokens da IDV (FCA: #05060A #12141F #F4F1E8 #FFC21A #00F0FF #FF2E4D). Os efeitos com promessa de valor (calendário, cartão no bolso) só valem para prazo de TESTE e para a PALAVRA do CTA, nunca para dinheiro.

## Efeitos do estudo "arquivo editorial" (18/10/2026, rodada c)
Entraram **27 efeitos novos** (`origem: estudo-arquivo-editorial`, campo `dialeto`: ARQUIVO / CINEMA-GLOW / CHOQUE) e **13 variantes** (`variantes_estudo`) em efeitos existentes (total 291 → 318; depois earn edits → 354). Skill: `estilo-arquivo-editorial`; doc: `docs/estudos/2026-10-18-estilo-arquivo-editorial/GRAMATICA-ARQUIVO-EDITORIAL.md`. Estado de todos: ESTUDADO, receita pronta, sem amostra nossa. Alvo do autor = dialeto ARQUIVO (ex.: `tarja-marca-texto-que-cresce`, `figura-tingida-de-amarelo`, `gravura-push-in-continuo`, `aberracao-cromatica-no-grao`, `foco-que-assenta-na-troca`, `interludio-de-papel-com-texto`, `fecho-em-preto-com-frase-final`). Não misturar dois dialetos na mesma peça.

## Efeitos do estudo "earn edits" (18/10/2026, rodada d)
Entraram **36 efeitos novos** (`origem: estudo-earn-edits`, campo `dialeto`: DOCUMENTARIO-RETRO / DIDATICO-DEMONSTRATIVO / PROMO / TODOS) e **30 variantes** (`variantes_estudo` com `origem: estudo-earn-edits`) em efeitos existentes (total 318 → 354). Skill: `estilo-earn-edits`; doc: `docs/estudos/2026-10-18-estilo-earn-edits/GRAMATICA-EARN-EDITS.md`. Estado: ESTUDADO, receita pronta, sem amostra nossa. Núcleo (transições que nascem da cena): `zoom-continuo-por-janela`, `portal-que-nasce-de-ponto-da-cena`, `empurrao-vertical-com-foco`, `coluna-de-anos-presa-ao-objeto`, `cortina-de-nuvem-ou-fumaca`, `wipe-por-primeiro-plano`, variante `elemento-vira-fundo` em `cena-nasce-da-anterior`. Demonstrações de conceito do dialeto didático: `demo-*` (8), com `demo-saturacao-unica` como ponte para o painel do comprador. Não misturar dois dialetos na mesma peça; PROMO só com pedido e nunca com dinheiro na tela.

### Referência do autor · muro de texto com frase marcada (18/10/2026)
Entrou **1 efeito novo**, `muro-de-texto-com-frase-marcada` (família tipografia, `origem: estudo-referencia-o autor-1810`), com **componente pronto** em `kit/src/efeitos/MuroDeTextoFraseMarcada.tsx` e demo em `src/portfolio/` (amostra na lista de estilos). Muro de linhas serifadas em profundidades de foco diferentes que reembaralha a cada ~0,3 s com pulso de desfoque; só a frase da narração fica parada, nítida, em sans sobre marca-texto. Variantes: `legenda-palavra-ativa-em-pilula` (em LETED-EF-04) e `personagem-de-traco-fervendo` (em REF-EDICAO-IA-EF-09). Ficha: `docs/estudos/2026-10-18-efeito-video-1828/FICHA-MURO-DE-TEXTO-FRASE-MARCADA.md`. Backup do catálogo: `catalogo.json.bak-2026-10-18e`.

## Efeito da skill anatomy (25/10/2026)
`maquina-isometrica-explica-mecanismo` (família diagrama, `origem: skill-anatomy (MIT, wheresryan22)`; total 390 → 391). Use quando a fala diz "como funciona", "por dentro", "o mecanismo", "o que acontece quando" e o mecanismo cabe como máquina física. Figura gerada pela skill `anatomy` (`.claude/skills/anatomy/SKILL.md`); regras de marca e os 6 mecanismos nossos em `anatomy/NOTA-Sistema FERA.md`. Estado: INSTALADO, sem amostra nossa; captura em vídeo PENDENTE DE PROVA (ver `motor-de-video`, rota 6).

## Efeitos do estudo "Dossiê documental" (25/10/2026)
Entraram **8 efeitos novos** (`origem: estudo-dossie-documental`, `dialeto: DOSSIE-DOCUMENTAL`) e **15 variantes** (`variantes_estudo` com essa origem) em efeitos existentes (total 380 → 388). Em 25/10 (revisão a pedido do autor) +2: `cor-seletiva-em-camadas` (P&B + cor no mesmo quadro, medido) e `close-extremo-de-detalhe` (close de olho/mão/objeto — adição nossa, o Reel não tem close de olho) → 390. Receita: `projetos/exemplo/2510-referencia-externa/RECEITA.md`; fichas: `.../EFEITOS.md`. Estado: ESTUDADO, receita pronta, sem amostra nossa. Gramática: mistério → data/etiqueta → manchete → TV/arquivo → mural → virada vertical → contradição em P&B → revelação → CTA com produto como objeto; cena em cor, documento em P&B, vermelho `#FF2E4D` como fio condutor; letras só com sombra suave.
Receita completa do estilo 34 para uso em peça: `references/ESTILO-34-DOSSIE-DOCUMENTAL.md`.
- **Novos:** `recorte-encaixado-em-objeto-silhueta` · `giro-para-vista-de-cima-com-zoom-out` · `data-em-quadro-negro-com-sublinhado` · `cena-vira-foto-recortada-na-manchete` · `estatica-de-tv-como-corte` · `coluna-de-palavras-que-desce` · `punch-in-que-escoa-para-pb` · `buraco-de-fechadura-revela`.
- **Variantes em:** `foco-que-assenta-na-troca` · `parallax-hq-2-camadas` · `empurrao-vertical-com-foco` · `etiqueta-de-nome-com-seta-manuscrita` · `mao-recortada-entra-em-cena` · `arremesso-para-fora` · `palavra-sob-holofote` · `trecho-de-fonte-marcado` · `recuo-tela-cheia-revela-tv-crt` · `foto-voadora-de-papel` · `portal-que-nasce-de-ponto-da-cena` · `titulo-3d-extrudado` · `cta-ponte-da-moral-com-produto-objeto` · `etiqueta-pendular` · `LETED-EF-06`.
- No anúncio: a "manchete" e a revelação são o painel real do comprador (círculo vermelho no número com origem); jornal só como moldura com selo DRAMATIZAÇÃO, nunca imitando veículo real.
