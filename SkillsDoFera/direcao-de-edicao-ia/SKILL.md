---
name: direcao-de-edicao-ia
description: "Transforma a ideia de uma edição de vídeo em pedido completo ao agente (briefing em 10 eixos), conduz o ritual amostra → aprovação → vídeo inteiro → lote e revisa com ficha observável. Triggers: edita esse vídeo, monta o prompt da edição, revisa essa amostra, deixa dinâmico."
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

# direcao-de-edicao-ia — do pedido vago à edição aprovada


Princípio: **o agente é literal.** Tudo que o pedido não decide, ele decide sozinho — e é isso que vira
retrabalho e token gasto. Esta skill fecha as decisões antes do primeiro render.
Método completo: `conhecimento/playbooks/PLAYBOOK-EDICAO-COM-IA.md`.

## Quando usar
- Vídeo gravado (talking head, aula, VSL, reel) que precisa de cortes, legenda, inserções ou motion.
- Revisar uma amostra/versão e transformar impressão em correção.
- Replicar um padrão aprovado em lote.
- **Não é aqui:** filme de lançamento sem o autor na frente da câmera (motion/UI/tela, 15–40 s, pré-venda,
  vinheta, objeção, antes/depois) → skill **`filme-de-lancamento`** (8 moldes em 9:16 com portões).
  Quando a peça mistura gravação + trecho de lançamento, o trecho de motion segue os portões de lá.

## Entradas
- Bruto em `originais/` (nunca editado), assets em `assets/`, roteiro opcional.
- Oferta e próximo passo **reais** (o que a pessoa falou ou forneceu).
- Destino: anúncio frio, remarketing, orgânico, aula.

## Passo a passo
1. **Inventário (só leitura):** ffprobe do bruto (duração, dimensão, fps, áudio), lista de assets por função
   — *prova real* / *demonstração* / *ilustração* / *estilo* —; aponte duplicata, baixa resolução e o que falta.
2. **Briefing em 10 eixos** (pergunte só o que não dá para inferir; uma pergunta agrupada):
   material · objetivo e público · oferta/próximo passo reais · formato (CONFIRMAR proporção; padrão = só 9:16 para aprovar, 4:5/outro só sob pedido) · estilo em critérios · sequência
   visual amarrada à fala · regra de corte · o que preservar · o que não entra · entrega.
3. **Unidades de sentido:** transcreva (`python3 bin/transcrever.py <video> --finalidade lote`, motor local, tempo por
   palavra — regra de transcrição do CLAUDE.md; nunca API paga) e quebre a fala por ideia, não por
   intervalo. Para cada unidade, 4 respostas: *o que entender · o que olhar · o que muda · o que fica*.
   Uma ação visual principal por unidade; sem função clara, fica a imagem do apresentador.
3.1 **Áudio antes da imagem:** a fala transcrita (ou a trilha com BPM e grade medidos, drop marcado no quadro) é o
   relógio. Nenhum tempo de cena sai de número redondo; volumes e SFX anotados no quadro do evento.
4. **Lista de cortes antes de cortar:** `início · fim · texto mantido · motivo`. Última tomada completa
   vence; nunca colar pedaços que inventem frase; respiro útil fica (~0,3 s entre frases).
4.1 **Emendas antes do código** (todo corte com motion, inserção ou troca de cena): uma linha por corte com
   `instante · eixo (x/y/z) · sentido saída→entrada · velocidade dos dois lados · o que atravessa o corte`.
   Nada pousa antes do corte nem começa parado depois; corte seco a partir de parado só se anotado. Conferir
   com still 2 quadros antes e 2 depois de cada emenda.
5. **Pedido final** = preâmbulo de regras (uma vez por chat) + pedido da etapa (modelos abaixo).
5.1 **Antes de inventar a animação, procurar na biblioteca** (skill `biblioteca-videos-ia`): `TOP-PARA-ANUNCIOS.md` por uso ou `python3 bin/biblioteca-de-referencia-de-videos-ia-biblioteca.py --buscar`. Pegar 1 molde ✅ (remake confere com o original) e escrever o pedido na gramática dela (`<inputs>/<direction>/<structure>/<build>/<gotchas>/<start>`, BPM real, lista de proibidos, folha por batida). Motor: HyperFrames, Remotion ou os dois com comparação.
6. **Amostra do trecho mais difícil** (8–15 s com transição + inserção + legenda + volta). Técnica nova
   (3D, recorte) passa antes por teste de 5 s.
7. **Revisão com a ficha** (abaixo). Correção = *o que não quero + regra no lugar + intervalo*.
8. **Aprovado → vídeo inteiro → lote no mesmo chat** ("mesmas regras"). Registre o padrão em `DIRECAO.md`.

## Direção que o agente executa na 1ª vez (fonte: EVIA A11, A12, A15)
- **Bruto que economiza:** 1 take contínuo vale mais que 10 clipes soltos (o agente entende a ordem). Melhor ainda: decupar antes (tirar
  silêncios e erros, ordem final — ~3 min de quem gravou poupa 10–20 min de agente). Se mandar bruto com takes repetidos, dizer qual vale
  ("use o take 2 da frase X"); sem isso o agente escolhe sozinho e vira ajuste.
- **Pasta da peça:** perguntar ao agente onde pôr o bruto para seguir o padrão das anteriores (`videos/NN/`); material real do caso (fotos,
  vídeo do fato, prints) em `videos/NN/material/`, nomeado pelo que é. Sem material, o agente pesquisa — então exigir origem de cada imagem.
- **Direcionamento em 3 blocos** (fecha o que o agente decidiria errado):
  1. *Formato dominante* — ex.: "majoritariamente tela dividida" (efeito `tela-dividida-midia-em-cima`), dito como proporção, não como regra absoluta.
  2. *Os 3 primeiros segundos* — qual cena real mais forte entra no quadro 0 + headline centralizada (ficha de `gancho-dos-tres-segundos`).
  3. *Alternância e prioridades* — ordem dos layouts (dividida → só a pessoa → motion → foto → dividida), qual foto entra primeiro, o que
     ocultar (`ocultar-rosto` em agressor, vítima, menor) e o que nunca escrever na tela.
  Fechar com "se faltar algo, pergunte antes de renderizar": o agente faz 2–3 perguntas (número exato, palavra do CTA, trilha); responder curto.
- **Revisão pelo segundo exato:** assistir o MP4 em tela cheia, anotar `mm:ss` de cada defeito e mandar **um** pedido com todos. Defeitos que
  mais aparecem e como pedir: a ação acontece num canto → "zoom exatamente no quadrante X" (`zoom-na-regiao-da-acao`); cena-chave vista 1 vez →
  "repita 2–3 vezes com o mesmo zoom" (gancho, meio, clímax); troca de layout quebrada → "efeito mínimo e rápido entre os blocos"
  (`assentamento-minimo-entre-blocos`); texto informativo que não vende → "tire o texto X"; motion em tela cheia num formato dividido → "motion
  na metade de baixo, vídeo em cima".
- **Número contestável:** usar o da fonte confiável, arredondado para baixo ("mais de 240") e registrar a fonte no `build.json`.
- **Trilha como dúvida de gosto:** entregar a versão sem música junto da com música (não é variação de teste; é a mesma peça).
- **Tempo medido na fonte** (para estimar): 1ª versão ~13 min (7 até as perguntas + 5 depois), ajustes ~5 min, < 6% da janela de 5 h.
  Registre o nosso no `DIRECAO.md`.
- Contraponto EVIA A11–A13: a fonte dá "liberdade total" e deixa o agente renderizar o vídeo inteiro de primeira; aqui continua valendo a
  **amostra do trecho mais difícil** antes do completo (passo 6) — a liberdade vale para propor, não para pular a amostra.
- Literais dos pedidos da fonte (para consulta, não para colar): `conhecimento/dossiers/themes/PROCEDIMENTOS/PROC-EVIA-A11-A12-edicao-com-especialista.md`.

## Prompts-modelo

**Preâmbulo (uma vez por chat)**
```
Regras deste projeto: carregue a skill Remotion instalada (sem afirmar skill que não carregou); cores e
fontes só pelos tokens de remotion/shared/brand (`@brand`), nunca hex solto no código; use só
originais/ e assets/; sincronize pela transcrição da gravação real (roteiro só confere termos); nada de
número, preço, depoimento ou tela inventados (ilustração = selo SIMULAÇÃO); sem serviço pago; original
preservado e render numerado em render/; texto a ≥ 90 px das laterais, legenda ≥ 300 px da base;
stills de cada cena antes de me entregar; se não conseguir ver/ouvir algo, diga.
```
**Etapa**
```
[arquivo] → 1080×1920, 30 fps, duração natural. Cortes: [regra]. Enquadramento: rosto com tracking
suave. Legenda: 1 linha, Roboto 700 branca, contorno fino, palavra-chave ciano #00f0ff.
Inserções pela fala: "[frase]" → assets/[x]; "[frase]" → assets/[y]. Amostra de [10] s do trecho
[mm:ss–mm:ss] em revisao/. [Aguarde meu ok | Se a amostra passar na ficha, siga para o completo].
```
**Correção**
```
Entre [T1] e [T2], não quero [defeito observável]. No lugar: [regra]. Mantenha todo o resto.
Prévia só desse trecho com 2 s de contexto.
```
**Lote**
```
Aprovado. Mesmas regras para [arquivos]. Sem pedir permissão no meio. Entregue lista com nome,
duração e o que foi diferente em cada um.
```

## Ficha de revisão da amostra
- [ ] Mensagem entendida sem ler vários elementos ao mesmo tempo
- [ ] Cada inserção explica a fala e é asset real (ou tem selo SIMULAÇÃO)
- [ ] B-roll de banco SÓBRIO e no contexto do público (nada vulgar ou sensual demais — alcinha/regata avaliar caso a caso —, praia/cidade errada, placa/texto em inglês, máscara) — conferido em folha numerada
- [ ] Rosto enquadrado, sem salto nem gambiarra (janela reduzida, fundo desfocado)
- [ ] Legenda fiel ao áudio (número, negação, nome) e fora da inserção
- [ ] Título destaca uma ideia; não repete a legenda
- [ ] Motion termina antes da próxima ideia; nenhuma linha/enfeite sem função
- [ ] Cada emenda da lista confere no still antes/depois (mesmo eixo e sentido, os dois lados em movimento)
- [ ] Texto medido: lateral ≥ 90 px, nada cortado, nada sobreposto (stills de início/meio/fim)
- [ ] Voz inteligível; −14 LUFS no anúncio
- [ ] Fala real ESCUTADA inteira: sem gagueira/repetição ("o o o"), sem palavra cortada — disfluência vai para a lista de cortes
- [ ] Gesto e mão inteiros dentro do quadro/moldura (desloque o apresentador antes de cortar a mão)
- [ ] Correção mexe SÓ no defeito — nunca remove a técnica que o usuário aprovou (ex.: texto atrás da pessoa)
- [ ] Faixa/overlay de topo com DEGRADÊ suave (~250 px até 0%), sem linha dura visível — still sobre fundo claro
- [ ] Lettering atrás da silhueta LEGÍVEL (pessoa cobre ≤25% de cada palavra, nunca o miolo; acentos corretos) e NENHUMA sombra/glow/halo sobre rosto ou pele
- [ ] Setas/linhas de diagrama chegam em pontos distintos, pontas limpas, sem se embolar sobre rótulo
- [ ] CTA de orgânico: palavra-chave da automação em destaque próprio (ex.: Digite "EVENTO") e falada
- [ ] Sem costura seca: faixa de título, mídia encaixada e troca de mídia na mesma cena com degradê/crossfade — `bin/detectar-costuras.py` rodado e candidatos conferidos
- [ ] Visto no tamanho do celular, incluindo entrada e saída
- [ ] Decisão escrita: aprovado / ajuste em T1–T2 / direção a rever
Anúncio: somar a ficha de `gancho-dos-tres-segundos`, `painel-do-comprador-na-cena` e `cta-e-fechamento`.

## Armadilhas
- "Mantenha o rosto centralizado" virou janela reduzida + fundo desfocado durante a inserção → diga o que
  fazer na inserção (enquadramento padrão com espaço acima da cabeça).
- Amostra dos primeiros segundos não testa nada; pegue o trecho mais difícil.
- Pedir "mil coisas" num prompt: o agente erra mais e gasta mais. Etapas.
- Esquecer o roteiro no começo: mande no meio (botão de orientar) em vez de recomeçar.
- Aprovar pelo Studio ou por um frame. Aprovação é sobre o MP4 exportado.
- Legenda de transcrição automática erra nome de produto/ferramenta: dê o glossário.
- O agente responde em outro idioma ou muda de padrão no meio: corrigir na hora ("responda em português") — ele grava a preferência.
- Chat da semana inteira: contexto lotado deixa tudo caro e confuso. Uma peça por chat; `/clear` ao trocar (fonte: EVIA A15).

## Saída
- `revisao/amostra-vNN.mp4` → `render/<slug>-vNN.mp4` (nunca sobrescrever) + SRT + transcrição revisada.
- `DIRECAO.md` com briefing, lista de cortes, decisões, custo medido (% do limite antes/depois) e o padrão
  aprovado para reuso.
