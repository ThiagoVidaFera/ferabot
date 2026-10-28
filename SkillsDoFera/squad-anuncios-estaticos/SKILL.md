---
name: squad-anuncios-estaticos
description: Squad de estáticos de feed pra Meta Ads em lote de teste. Mapeia dores/desejos/objeções, escolhe 3 ângulos distintos e gera 3 execuções visuais de cada (editorial, blocos, scroll stopper) = 9 peças HTML→PNG com aprovação por etapa. Triggers "anúncios estáticos", "testar ângulos", "criativos pro Meta". NÃO é story nativo, kit multiformato com fotos nem mix rápido de ideias.
---

# Squad Anúncios Estáticos

Gerador de criativos estáticos orientado por **ângulo + variação visual**. Cada run entrega uma copy-mãe
(baseada em dor/desejo/objeção + fórmula validada) e 3 execuções visuais diferentes da mesma essência,
renderizadas de HTML autocontido pra PNG.

Não é squad de "fazer banner bonito". É squad de **direção criativa de performance**: cada peça parece
nativa, conversacional, e serve pra testar um ângulo específico.

**Pra quem é:** você, usuário do FERABOT, anunciando o seu negócio (ou o de um cliente seu). Ler
`perfil.json` na raiz do FERABOT (nome, nicho, produto, preço, @, cores, landing) e usar como briefing de
partida. Se for pra um cliente, pedir os dados dele e não usar o `perfil.json`.

**Qual skill de anúncio usar:**
- **Esta** → lote de teste de feed: 3 ângulos × 3 execuções visuais, aprovação por etapa.
- `mix-estaticos` → 10+ conceitos rápidos em texto a partir de uma ideia solta, antes de produzir arte.
- `anuncio-nativo` → story ad 9:16 com cara de post nativo do Instagram.
- `anuncios-de-ouro` → kit completo (feed + story + reel + carrossel) com fotos reais do dono.

---

## Stories

Se o briefing pedir **stories**, este squad cuida só do feed. Pros stories, oferecer UMA vez:
`anuncio-nativo` (story ad com cara de post nativo) ou `squad-stories-fera` (story de bastidor com foto real).

---

## Quando usar

- Briefing de produto/oferta pedindo criativos estáticos pra Meta Ads (feed)
- Teste A/B/C de ângulos — mesma oferta, três tensões diferentes
- Teste A/B/C de execução visual — mesmo ângulo, três linguagens gráficas
- Substituir criativos que cansaram sem mudar o ângulo central
- Validar hipótese de público descobrindo qual dor/desejo performa melhor

Não usar pra: vídeo (`roteiros-e-oratoria`), carrossel educativo (`squad-carrossel-fera` / `squad-isca-fera`),
story (`anuncio-nativo` / `squad-stories-fera`).

---

## Entradas esperadas

O usuário fornece briefing (ou ele vem do `perfil.json`). Usar o máximo possível destes itens; o que
faltar, assumir com base no contexto e sinalizar.

- **Produto / oferta** — o que é e o que entrega
- **Público-alvo** — quem é, idade, contexto, nível de consciência
- **Transformação prometida** — estado atual → estado desejado
- **Dores / desejos / objeções** — se o usuário já mapeou
- **Mecanismo único** — o "como" diferente que o produto usa
- **Estilo visual desejado** — premium, raw, clean, provocador. Cores: `cor_primaria`/`cor_secundaria` do perfil
- **Imagem por IA?** — perguntar: "Quer que alguma das peças tenha uma imagem gerada por IA (cena, objeto)?"
  Se sim: `python ScriptsFera/imagem.py "<prompt em inglês>" --ratio 4:5 --out <pasta>/img-01.png`
  (usa a GEMINI_API_KEY do `.env`; sem chave, a peça sai só com texto + forma). Nunca pedir ao modelo de
  imagem que escreva a headline — texto é sempre HTML por cima.
- **Proporção** — 1:1 (1080x1080), 4:5 (1080x1350) ou 9:16 (1080x1920). Default: **4:5**
- **Idioma** — default: português BR
- **Nível de agressividade da copy** — suave / médio / alto. Default: médio
- **Quantos ângulos testar** — default: **3 ângulos distintos** (cada um com 3 variações = 9 criativos totais)

## Gates antes de produzir

- **Linguagem real do público.** Se não houver, pedir ao usuário 5–10 frases reais (comentários, DMs,
  mensagens de WhatsApp, perguntas de call) antes do Agente 1. Sem isso, sinalizar que o diagnóstico é
  hipótese.
- **Aposta declarada.** Se o ângulo/oferta for novo ou arriscado, escrever em uma linha qual premissa o
  lote está testando (ex.: "a dor é tempo, não dinheiro") — isso vai pro RESUMO.md.
- **Prova e dado.** Peça pública usa só prova real (print verdadeiro, número com fonte). Dado que só o
  dono tem — preço, prazo, vagas, resultado, caso de cliente — nunca é inventado: vira pergunta ou
  `[A PREENCHER: o que falta]`. Sem prova real, a peça troca de ângulo.

---

## Pipeline de 6 agentes

Cada agente é uma fase. Rodar em ordem. Não pular etapas.

### Agente 1 — Diagnóstico do Público

**Input:** briefing.
**Output:** mapa de tensões.

Mapear:

- **Dores latentes** — o que dói hoje (sem verbalizar ainda)
- **Desejos urgentes** — o que querem agora, não "algum dia"
- **Objeções silenciosas** — o que trava a compra
- **Ganhos imediatos** — o que mudaria em 24/48h
- **O que já tentaram** — e por que não funcionou
- **Linguagem interna** — como falam do problema entre amigos
- **Estágio de consciência** — Schwartz 1-5 (unaware → most aware)

Regra: nada genérico. Se escrever "quer resultado", reescrever com especificidade.

### Agente 2 — Seleção de Ângulos

**Input:** mapa de tensões.
**Output:** N ângulos selecionados (default 3), cada um com:

- **Nome do ângulo** — etiqueta curta memorável
- **Emoção dominante** — frustração, medo, cobiça, orgulho, vergonha, alívio, curiosidade, urgência
- **Estágio de consciência** alvo
- **Mecanismo de persuasão** — escolher 1 da biblioteca abaixo

**Biblioteca de ângulos:**

| Categoria | Exemplos |
|-----------|----------|
| Dor | frustração por tentar e não conseguir, sensação de atraso, desperdício invisível, vergonha silenciosa, exaustão |
| Desejo | resultado rápido, clareza, previsibilidade, controle, vantagem oculta |
| Objeção quebrada | "já tentei", "não tenho tempo", "é mais do mesmo", "não sei se vale" |
| Gancho | erro oculto, simplificação extrema, efeito imediato, comparação dolorosa, padrão que ninguém percebe |

**Regra de diversidade:** os N ângulos escolhidos devem vir de categorias diferentes. Não testar 3 dores parecidas.

### Agente 3 — Copy-mãe por Ângulo

**Input:** ângulo selecionado.
**Output:** uma copy-mãe estruturada pra cada ângulo.

Cada copy-mãe tem:

- **Headline** — a frase principal, lida em 1 segundo
- **Subheadline** — contexto ou reforço, lido em 2 segundos
- **Reforços** — 2 a 4 microfrases de apoio (bullet, grifo, destaque)
- **CTA** — curto, conversacional, nunca "Compre agora" varejo barato
- **Microfrases auxiliares** — palavras/blocos pra compor o design

**Fórmulas de copy validadas (escolher 1 e combinar com o ângulo):**

1. **Pergunta incômoda** — "Por que você ainda...?" / "Até quando...?"
2. **Diagnóstico direto** — "Seu problema não é X. É Y."
3. **Quebra de crença** — "Não é sobre fazer mais."
4. **Lista rápida** — "3 sinais de que..."
5. **Antes vs depois mental** — "Antes você X. Agora o foco é Y."
6. **Frase-verdade compartilhável** — algo que dá vontade de printar
7. **Confissão / bastidor** — "Foi só quando eu percebi X que..."
8. **Alerta de perda invisível** — "O custo de continuar assim..."
9. **Mini-rant elegante** — provocação sem grosseria
10. **Oportunidade negligenciada** — "Tem gente crescendo só porque entendeu isso antes"
11. **"Ninguém te fala isso"** — revelação de bastidor
12. **Check-list rápido** — "Se isso acontece, presta atenção"
13. **"Isso explica por que..."** — conecta sintoma a causa
14. **"Se você sente X, provavelmente Y"** — diagnóstico empático (cuidado com a política da Meta, abaixo)

**Filtros obrigatórios da copy:**

- Frases curtas, palavras concretas
- Tom conversacional (papo, não panfleto)
- Zero jargão de marketing
- Zero caixa alta gratuita
- Zero clichê de IA ("descubra", "desbloqueie", "revolucione")
- Leitura escaneável em 2-4 segundos
- 1 ideia principal por peça
- **Checklist do lead preguiçoso, medroso e procrastinador** — cada copy-mãe precisa ter, explícito:
  **anti-medo** (garantia, prova real, aviso honesto) · **anti-procrastinação** (por que agir agora, com
  motivo real) · **anti-preguiça** (o que vem pronto, o pouco que ele precisa fazer) · **anti-problema-futuro**
  (suporte, acompanhamento, "não fica sozinho depois"). Faltou um, reescrever.
- **Política da Meta:** nunca afirmar atributo pessoal de quem vê ("você que está endividado", "você que
  tem ansiedade", "você que está acima do peso"). Nomear o público pela profissão/situação escolhida
  ("Psicóloga:", "Dono de clínica:") ou falar em 1ª pessoa. Nada de promessa de ganho garantido.

### Agente 4 — Direção de Arte

**Input:** copy-mãe.
**Output:** briefing visual das 3 variações.

**Regra inegociável:** as 3 variações precisam mudar **pelo menos 3 fatores** entre si:

- direção de leitura
- composição
- hierarquia tipográfica
- distribuição dos blocos
- presença ou ausência de card
- formato de destaque
- densidade de texto
- uso de ícones
- linguagem gráfica
- clima visual

**Templates obrigatórios das 3 variações:**

**Variação A — Editorial Enxuta**
- Tipografia dominante (headline gigante)
- Muito respiro (padding alto)
- Poucos elementos
- Sensação premium, revista
- 2 cores principais
- Sem cards, sem ícones pesados
- Pode ter grifo sutil, underline, ou destaque por peso

**Variação B — Sistema de Blocos**
- Cards, chips, etiquetas, divisões
- Leitura em blocos curtos
- Visual de framework / checklist / mapa rápido
- Ícones SVG inline simples
- Hierarquia por label + conteúdo
- 3 cores permitidas
- Densidade média

**Variação C — Scroll Stopper**
- Assimetria visual
- Contraste agressivo (fundo escuro/neon, ou palavra gigante)
- Uma palavra ou bloco dominante
- Sensação de interrupção — "isso não parece anúncio comum"
- Pode usar rotação sutil, offset, tachado, destaque em bloco colorido
- Provocativa sem ser gritada

**Regras de composição que valem pras 3:**
- **Zona morta de texto: 250px no topo e 250px na base.** Em 9:16 é obrigatório (a UI do Instagram cobre).
  Em feed (4:5, 1:1) vale como padrão também — se o layout precisar invadir a borda, só imagem ou elemento
  gráfico invade, nunca texto.
- **Rosto nunca cortado nem coberto por texto** (se houver foto de pessoa): cabeça inteira com folga,
  texto fora do rosto. Conferir no PNG.

### Agente 5 — HTML Generator

**Input:** copy-mãe + briefing visual das 3 variações.
**Output:** 3 arquivos HTML autocontidos, prontos pra renderizar em PNG.

**Especificação técnica:**

- Cada variação em arquivo separado: `variacao-a.html`, `variacao-b.html`, `variacao-c.html`
- Container `.ad` com dimensão fixa conforme proporção solicitada (default 1080x1350)
- `box-sizing: border-box` em tudo
- CSS embutido em `<style>` — sem dependências externas além de Google Fonts
- Ícones em SVG inline (se usar)
- Fontes via `@import` do Google Fonts ou stack local (Inter, DM Sans, Space Grotesk, Manrope, Archivo)
- Máximo 2 famílias de fonte por peça
- Máximo 2-3 cores principais (partir das cores do perfil)
- Sem imagens externas (a menos que solicitado; imagem gerada fica na pasta do ângulo, caminho relativo)
- Container centralizado no viewport (só pra preview — o PNG recorta só o `.ad`)

**Template base:**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Variação A — [nome do ângulo]</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #0a0a0a; font-family: 'Inter', sans-serif; }
  .ad { width: 1080px; height: 1350px; /* ... */ }
  /* ... */
</style>
</head>
<body>
  <div class="ad">
    <!-- conteúdo da variação -->
  </div>
</body>
</html>
```

### Agente 6 — Render + QA

**Input:** 3 HTMLs.
**Output:** 3 PNGs + relatório de QA.

**Render** (motor do FERABOT, rodar da raiz do FERABOT — instala o Playwright sozinho na primeira vez):

```
python ScriptsFera/render.py png output/anuncios/estaticos/<pasta>/angulo-1-<slug>/variacao-a.html --w 1080 --h 1350 --seletor .ad
```

Repetir pra cada variação (ajustar `--h` se a proporção for 1:1 ou 9:16).

**Checagem de política Meta (antes de entregar, se vai pra Meta Ads):** reler cada peça procurando
atributo pessoal afirmado sobre quem vê, promessa de ganho/cura garantida, antes/depois corporal, número
sem fonte. Marcar cada peça como OK / Ajustar / Barrado e reescrever o que não for OK.

**Message match (se o anúncio aponta pra landing, página ou WhatsApp específico):** a primeira coisa que
o lead vê no destino precisa repetir a promessa/oferta do criativo. Se quebrar, ajustar o criativo ou
avisar o usuário pra ajustar o destino.

Registrar no RESUMO.md quais variações testam ângulo, formato ou headline. Trocar palavra não é teste.

**QA — validar cada peça antes de entregar:**

- [ ] Ideia central clara em 2-4 segundos?
- [ ] Contraste visual suficiente pra interromper scroll?
- [ ] As 3 variações parecem **realmente** diferentes? (não só cor trocada)
- [ ] Copy coerente com o ângulo?
- [ ] Tom conversacional mantido?
- [ ] Zero clichê de IA ou corporativismo?
- [ ] Leitura sem explicação externa?
- [ ] Tipografia legível mesmo em miniatura 400x500?
- [ ] Zona morta de 250px respeitada e nenhum rosto cortado/coberto?
- [ ] Anti-medo / anti-procrastinação / anti-preguiça / anti-problema-futuro presentes?
- [ ] Nenhum dado inventado (ou marcado `[A PREENCHER]`)?

Se qualquer item falhar, **reescrever** aquela variação. Não entregar fraco.

---

## Estrutura de saída do run

Tudo dentro da pasta `output/` do FERABOT:

```
output/anuncios/estaticos/AAAA-MM-DD-[slug-campanha]/
├── 00-briefing.md                # o que o usuário pediu
├── 01-diagnostico.md             # Agente 1 output
├── 02-angulos.md                 # Agente 2 output (3 ângulos escolhidos)
├── angulo-1-[slug]/
│   ├── copy-mae.md               # Agente 3
│   ├── direcao-arte.md           # Agente 4
│   ├── variacao-a.html / .png
│   ├── variacao-b.html / .png
│   └── variacao-c.html / .png
├── angulo-2-[slug]/ ...
├── angulo-3-[slug]/ ...
└── RESUMO.md                     # o que testar primeiro, hipóteses, prioridade
```

Se for pra um cliente do usuário: `output/anuncios/estaticos/<cliente>/AAAA-MM-DD-[slug]/`.

---

## Fluxo operacional

1. **Receber briefing** — ler `perfil.json` + o pedido; listar o que tem e o que falta
2. **Apresentar plano** — mostrar os 3 ângulos selecionados ANTES de gerar copy. Esperar OK do usuário
3. **Gerar copy-mãe** dos 3 ângulos — apresentar em texto corrido, esperar OK
4. **Gerar direção de arte** das 9 variações (3x3) — apresentar briefing visual, esperar OK
5. **Gerar HTML** das 9 peças
6. **Renderizar PNG** com `ScriptsFera/render.py`
7. **QA** — revisar cada peça contra checklist. Reescrever fracas
8. **Entregar** — mostrar o caminho absoluto da pasta + RESUMO.md com prioridade de teste. Opcional:
   `python ScriptsFera/metas-api.py entrega add "squad-anuncios-estaticos" "<o que foi>" --link "<pasta>"`
9. **Subir (opcional)** — manual no Gerenciador de Anúncios, ou pela skill `meta-ads-fera` se
   `META_ACCESS_TOKEN` e `META_AD_ACCOUNT_ID` estiverem no `.env`. Sem chave, a entrega é a pasta.

**Regra de aprovação por etapas (obrigatória):** não pular do briefing direto pro HTML. Aprovar ângulo →
copy → direção de arte → então renderizar.

---

## Princípios inegociáveis

**O criativo precisa parecer específico, não genérico.** Se a headline funcionaria pra qualquer produto, reescrever.

**O tom é conversacional.** Parece observação afiada, print inteligente, verdade incômoda. Nunca panfleto, nunca banner corporativo.

**A quebra de padrão é obrigatória.** Cada peça interrompe o scroll com: contraste forte, frase inesperada, estrutura incomum, assimetria, destaque isolado, ou "cara de post que não parece anúncio".

**Design minimalista mas não pobre.** Tipografia, blocos, ícones simples, contraste. Sem foto (a menos que pedido). Foco total em **texto + forma + hierarquia**.

**Variação de verdade.** Trocar só cor ou posição de botão **não é variação**. Mudar direção de leitura, composição, hierarquia, densidade — **é**.

**Zero clichê de IA.** Nada de "descubra", "desbloqueie", "revolucione", "com certeza", "mergulhe em". Linguagem de gente, não de prompt mal escrito.

---

## Prompt mestre (referência interna pro agente)

> Com base no produto, público e objetivo informado, identifique os 3 melhores ângulos de criativo estático pra teste. Cada ângulo combina uma dor/desejo/objeção central com uma fórmula de copy validada. Gere uma copy-mãe conversacional, específica e escaneável pra cada ângulo. Depois, transforme cada copy-mãe em 3 variações visuais realmente diferentes (editorial, blocos, scroll stopper). Cada variação usa texto, ícones, contraste tipográfico, blocos e elementos gráficos minimalistas. Entregue HTML completo com CSS embutido, pronto pra render em PNG. Resultado final: 9 peças (3 ângulos × 3 execuções) que parecem anúncios atuais de performance, com quebra de padrão e cara de peça testável.

---

## Exemplo de trigger

- "cria anúncios estáticos pra [produto]"
- "quero testar 3 ângulos diferentes pra [oferta]"
- "preciso de criativos estáticos pra rodar no Meta"
- "gera variações de anúncio pra [campanha]"
- "squad de anúncios estáticos pra [cliente]"

---

## Regras duras de criativo (obrigatórias)

1. **Headline com identificação imediata + dor/desejo.** Toda headline (na arte E no título do anúncio)
   nomeia o público-alvo ("Psicóloga:", "Dono de clínica:", "Corretor:", "Nutricionista:") e menciona
   diretamente uma dor ou um desejo. Headline de produto/feature sem público nomeado = reprovada.
   (Nomear o público pela profissão é ok; afirmar condição pessoal de quem vê não é — ver política Meta.)
2. **Estrutura fixa do estático:** headline → subheadline → bullets OU contexto → ponte → CTA. Nunca
   começar listando o que vem no acesso ("inventário") antes de gerar desejo.
3. **Criativo de produto de entrada (low ticket) precisa das 3 forças:** gerar CURIOSIDADE (levar pro
   próximo passo), demonstrar a QUANTIDADE de coisas dentro do produto, e mostrar FACILIDADE (já vem pronto).
4. **Funil de DM/VSL (oferta só aparece no final):** o criativo NÃO fala da oferta — só curiosidade que leva
   ao próximo passo. Exemplo hipotético de estrutura: "Esqueça cursos e mentorias. Existe um jeito mais
   simples de [resultado] em [ano]. Eu te mostro em poucos segundos."
5. **Mix de teste recomendado: mínimo 3 imagens + 3 vídeos por conjunto.** Estático sozinho limita o
   teste. Vídeo pode sair da skill `roteiros-e-oratoria` (vídeo narrado).
6. **Vídeo de anúncio sempre com narração** + trilha. Vídeo mudo ou só com trilha não sobe.
