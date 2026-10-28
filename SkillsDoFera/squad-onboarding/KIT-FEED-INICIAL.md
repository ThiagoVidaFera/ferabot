# Kit de Feed Inicial — plano

Padrão fechado em 2026-10-26 e validado num run completo (51 PNGs no ar).
Decisões de método: **grade 3+3** · **respostas sempre manuais a partir de keyword**, com o modelo
pronto no kit · o feed existe para **ligar as campanhas**.

**Motor:** `templates/kit-feed/build_feed.py` (conteúdo em `feed.json`, render com checagem de zona
morta), `gerar_docs.py` (COMO-POSTAR + COPY por peça) e `subir_drive.mjs` (sobe a pasta e devolve o
link de leitura — opcional: sem credencial do Drive, você sobe a pasta à mão e grava o link com
`--manual`). A seção 06 da prévia (`previa-perfil/kit.js`) explica tudo isso pro cliente.

O que é: o lote de artes prontas que o cliente recebe no fim do onboarding e só publica. Entra
depois que ele aprova a Prévia do Perfil (step-22) — a prévia mostra como o feed vai ficar, o kit
é o feed de verdade.

---

## 1. A primeira decisão: pensar em GRADE, não em lista

O Instagram mostra 3 posts por linha. Os 6 fixados são **duas linhas**, e é assim que a pessoa vê
— não como uma sequência de 1 a 6. A linha de cima é a primeira coisa que alguém que nunca ouviu
falar do cliente encontra.

Por isso a proposta abaixo divide os 6 em **3 que constroem + 3 que convidam**, em vez de 1 que
constrói + 5 que convidam.

**Por que mudar a divisão original:** com 5 dos 6 fixados pedindo uma ação, o perfil inteiro vira
um balcão. Quem chega não sabe quem é a pessoa, o que ela faz nem se funciona — e já recebe três
convites diferentes. A linha de cima precisa responder *o que é · como funciona · funciona mesmo*
antes de a linha de baixo oferecer os caminhos.

### A grade proposta

```
┌─────────────────┬─────────────────┬─────────────────┐
│ 1. A PROPOSTA   │ 2. COMO FUNCIONA│ 3. A PROVA      │  ← quem é e por que acreditar
│ o que faz,      │ o mecanismo     │ resultado real  │
│ pra quem        │ por dentro      │ + autoridade    │
├─────────────────┼─────────────────┼─────────────────┤
│ 4. A ISCA       │ 5. O VÍDEO      │ 6. A REUNIÃO    │  ← as três portas
│ PDF grátis      │ 18 min no       │ conversa de     │
│ → grupo         │ YouTube         │ 30 min          │
└─────────────────┴─────────────────┴─────────────────┘
```

Cada post da linha de baixo tem **uma porta só** — e as três já existem como página na prévia:
`grupo.html`, `slides.html`/YouTube e `agendar.html`. O feed deixa de ser conteúdo solto e vira a
boca do funil que já está montado.

**Se você preferir a variação original** (1 apresentação + 5 alternando as 3 categorias), a
distribuição que menos repete CTA em sequência é: apresentação · isca · vídeo · reunião · isca ·
vídeo. Mas aí a prova e o mecanismo saem dos fixados e viram estáticos, o que enfraquece a linha de
cima.

---

## 2. Os 6 carrosséis, um a um

Formato: **1080×1440**, zona morta de 250px no topo e na base (regra dura do FERABOT).
Padrão visual: o do carrossel de referência do padrão FERA — fundo alternando escuro e claro,
headline pesada com **uma palavra em destaque** na cor de acento do cliente, eyebrow em caixa alta,
cards numerados, ponte no rodapé de cada slide. Adaptado à paleta e à foto de cada cliente.

| # | Papel | Gancho (o que a capa promete) | Slides | CTA |
|---|---|---|---|---|
| 1 | **A proposta** | O que ele faz, pra quem, e o que muda — a peça que a pessoa lê se só ler uma | 10 | Keyword da isca |
| 2 | **Como funciona** | O mecanismo por dentro: as peças e a ordem em que se encaixam | 8 | Link da bio |
| 3 | **A prova** | O resultado documentado + de onde vem a autoridade | 8 | Link da bio |
| 4 | **A isca** | A dor que o PDF resolve + o que tem dentro | 7 | Keyword → grupo |
| 5 | **O vídeo** | O que o vídeo de 18 min responde, e por que vale o tempo | 7 | "Link na bio → YouTube" |
| 6 | **A reunião** | O que acontece nos 30 min e o que a pessoa leva mesmo sem fechar | 7 | Link da bio → agendar |

**O carrossel #1 usa a fórmula completa do de referência:**
capa → virada (o jeito comum × o jeito dele) → mecanismo → as peças → o plano por fases →
apresentação com foto real → prova → filtro (o que ele faz × o que fica com o cliente) →
CTA com keyword → recibo salvável.

Os #2 a #6 são versões enxutas: um objetivo só, 7–8 slides, mesma anatomia de capa e de CTA.

---

### As 6 capas NÃO podem ter a mesma composição

Lição do primeiro lote de referência: as seis capas saíram todas escuras e com a
mesma estrutura, e o topo do perfil ficou achatado. **O grid se lê como grade, não como peça
isolada** — seis capas iguais parecem um post repetido seis vezes.

Quatro tipos de capa no motor, distribuídos em xadrez:

| Tipo | Como é | Quando usar |
|---|---|---|
| `capa_foto` | foto do cliente na metade de cima, texto embaixo | a apresentação e o vídeo — onde o rosto vende |
| `capa_coluna` | foto numa coluna, texto na outra, fundo claro | a prova/autoridade |
| `capa` | escura, tipográfica | o mecanismo, onde o argumento é abstrato |
| `capa_clara` | clara, tipográfica | quebra a sequência de escuras |

Exemplo de lote aprovado: foto · escura · coluna / clara · foto · clara. **Pelo menos duas das seis levam
a foto do cliente**, e nenhuma linha repete o mesmo tipo. Confira no grid renderizado, nunca peça
a peça — o defeito só aparece quando as seis estão lado a lado.

⚠️ Na `capa_foto` a marca não vai no topo: cai dentro da zona morta de 250px (o gate reprova). Quem
identifica é o chip do rodapé.

## 3. Os estáticos: 9 peças, 3 linhas

Carrossel desenvolve um argumento; estático **afirma uma coisa só**. Não é carrossel de um slide —
é lâmina: uma frase que se entende sem arrastar e que dá vontade de salvar.

```
┌───────────┬───────────┬───────────┐
│ isca      │ vídeo     │ reunião   │  linha 3
├───────────┼───────────┼───────────┤
│ vídeo     │ reunião   │ isca      │  linha 4   ← rotaciona pra não empilhar
├───────────┼───────────┼───────────┤           o mesmo CTA na vertical
│ reunião   │ isca      │ vídeo     │  linha 5
└───────────┴───────────┴───────────┘
```

A rotação importa: no grid, a coluna também se lê. Três posts de isca na mesma coluna fazem o
perfil parecer um outdoor da mesma oferta.

**Ângulos sugeridos por categoria** (3 cada):
- **Isca:** a dor em uma frase · o número com fonte · o checklist "quantas dessas você tem?"
- **Vídeo:** a pergunta que o vídeo responde · o contraste (o que todo mundo faz × o que funciona) · o bastidor
- **Reunião:** o que acontece nos 30 min · pra quem NÃO serve (filtro) · a promessa de baixa fricção ("mesmo que não feche nada")

---

## 4. Ritmo e ordem de publicação

15 peças ao todo. A 5 posts por semana, cobre **3 semanas** de feed.

**Ordem de publicação ≠ ordem da grade.** Os fixados aparecem no topo, mas a posição entre eles
segue a data de publicação. Na prática: publicar os 6 carrosséis primeiro, na ordem inversa da
grade desejada, e fixar todos. ⚠️ Conferir isso na conta antes de instruir o cliente — o Instagram
já mudou esse comportamento mais de uma vez.

Depois, os estáticos entram na cadência normal, um por dia útil.

---

## 5. O que o cliente recebe

```
kit-feed-inicial/
├── COMO-POSTAR.md          ← ordem, o que fixar, o que vai em cada legenda
├── 01-proposta/
│   ├── png/01.png … 10.png
│   └── COPY.md             ← legenda pronta + keyword + resposta do direct
├── 02-como-funciona/  …
├── …
└── estaticos/
    ├── 01-isca.png  … 09-reuniao.png
    └── COPY.md             ← as 9 legendas
```

O `COMO-POSTAR.md` é o que faz o kit funcionar sozinho: ordem de publicação, quais fixar, qual
keyword responde o quê, e o que fazer quando alguém comenta.

---

## 6. As três campanhas — o motivo de o feed existir

O feed não é conteúdo solto: **ele sustenta o anúncio.** A campanha leva a pessoa até a página; o
perfil é o que ela abre antes de decidir se confia. Por isso as 9 artes estáticas têm **dois usos**
— são post no feed e criativo de campanha, a mesma imagem, sem retrabalho.

| Campanha | Orçamento | Destino | Criativos |
|---|---|---|---|
| **A** · reunião | R$ 20/dia | página de agendamento | estáticos 01, 02, 03 |
| **B** · isca | R$ 20/dia | página do grupo + PDF | estáticos 04, 05, 06 |
| **C** · vídeo | R$ 20/dia | o vídeo no YouTube | estáticos 07, 08, 09 |

Estrutura de cada uma: **1 campanha · 1 conjunto · 3 criativos.** R$ 60/dia no total. Sobem juntas
e rodam 7 dias antes de qualquer ajuste — trocar criativo todo dia reinicia o aprendizado.

A ordem dos estáticos no feed **rotaciona as três campanhas** (A·B·C, B·C·A, C·A·B), pra não
empilhar o mesmo convite na mesma coluna do perfil.

## 7. Respostas: manuais, com modelo pronto

Decisão de método: a resposta é sempre do dono do perfil, nunca automação. O que o kit entrega é o
**modelo pronto pra colar** — resposta pública curta no comentário, mensagem de direct, e a
segunda mensagem caso a pessoa responda. Uma keyword por categoria (exemplo: `GUIA`, `VIDEO`,
`DIAGNOSTICO`), o que também evita a queda de comentário que a gente mede quando a mesma isca
repete em sequência.

## 8. Destaques e foto de perfil

Os destaques não ganham conteúdo novo: eles **reusam os carrosséis que já existem**. O cliente
republica o carrossel como story e salva no destaque — é o que a maioria faz na prática, e assim
quem chega no perfil encontra o mesmo argumento em dois lugares.

| Destaque | Guarda |
|---|---|
| **Comece aqui** | o carrossel da proposta |
| **Como funciona** | o carrossel do mecanismo |
| **Materiais** | a isca e o vídeo |
| **Falar comigo** | a reunião e a prova |

As **capas** são peças próprias, 1080×1920 com o conteúdo numa área segura central (o Instagram
recorta a capa em círculo). Alternam fundo escuro e claro, e levam só um ícone e uma palavra —
capa de destaque é lida a 60px. Tipo `capa-destaque` no `build_feed.py`; conferir sempre na folha
`destaques/_qa-circulo.jpg`, que mostra as quatro já mascaradas em círculo.

A **foto de perfil** sai do mesmo retrato aprovado no QA de avatar, em 1080×1080, e vai na pasta
`perfil/` do kit.

## 9. A isca em PDF

A porta B (grupo) e a keyword da isca **prometem um material**. Ele existe, e entra no kit:
`templates/kit-feed/build_isca.py`, bloco `isca` do `feed.json`. A4, 9 páginas, mesmo visual do kit.

| Pág. | O que tem | Por quê |
|---|---|---|
| 1 | Capa com a foto do cliente, título curto, selo "material gratuito" | quem abre precisa reconhecer de quem é |
| 2 | Como usar (leva 20 minutos) + a regra de ouro (sumiu × esquecido) | tira a dúvida "o que eu faço com isso?" |
| 3–5 | **As 9 situações, 3 por página** — cada uma com *onde procurar*, *como calcular o valor* e *mensagem pronta* | é a promessa do carrossel; sem as três, o PDF é só uma lista |
| 6 | A conta: tabela pra preencher + meta do trimestre + leitura do percentual | é o que muda a prioridade do dono |
| 7 | Priorizar por valor × temperatura + a rotina de 20 min com campos pra preencher | evita o buraco voltar a crescer |
| 8 | Exemplo **hipotético e rotulado** + checklist do dia | ensina o formato sem fabricar caso (`prova-e-dado`, item 2) |
| 9 | Próximo passo: keyword da reunião + onde responder | a isca existe pra levar à conversa |

**Regras do conteúdo.** As mensagens prontas voltam no **motivo que fez a pessoa procurar a
empresa** e oferecem duas saídas honestas — nunca "conseguiu ver?". Os campos `{entre chaves}` são
o dado do cliente do dono. O exemplo é sempre rotulado como hipotético no corpo da página, não em
selo removível. O CTA final usa a **keyword**, não uma URL: domínio proposto que ainda não existe
deixaria link morto num material que circula sozinho.

**Gate.** O motor mede o respiro de cada página; conteúdo que passa do limite seria cortado em
silêncio pelo `overflow:hidden`. Decoração em posição absoluta (foto da capa) não conta como conteúdo.

**Entrega.** Vai na pasta `isca/` do Drive; o `subir_drive.mjs` grava `drive-links.json` (sozinho,
se houver credencial do Drive; ou com `--manual "<link da pasta>" "<link do PDF>"` depois de subir
à mão) e o `gerar_docs.py` troca o `[LINK DO PDF]` das respostas-modelo pelo link real. Como o link
só existe depois do primeiro upload, o upload roda **duas vezes**. Conferir a permissão
(`anyone → reader`, herdada da pasta) — pela API, ou abrindo o link numa janela anônima: o HTML do
Drive mostra "Sign in" mesmo com o arquivo público, então a janela anônima precisa abrir o PDF.

## 10. Entrega

PNGs e textos vão pro **Google Drive** (automático ou à mão), numa pasta por cliente com link de leitura, e o link entra
na seção 06 da prévia. O cliente baixa e posta.
