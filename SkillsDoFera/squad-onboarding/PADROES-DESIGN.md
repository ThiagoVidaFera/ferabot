# Padrões de design do onboarding v5

O que faz as peças de qualquer run saírem com o mesmo acabamento. Padrão FERA de design do
onboarding.

---

## 1. Tokens por cliente

Cada cliente tem **uma paleta**, declarada uma vez (`feed.json → marca` e `paginas.css`) e herdada
por tudo. Exemplo: acento `#2F6DA8`, acento escuro `#0B2038`, escuro `#0E1116`, claro `#F4F1EA`.
A regra é trocar o acento e manter a estrutura — a identidade vem da cor e da foto, não de
layout novo.

Tipografia das **páginas**: Fraunces (headline) + Archivo (corpo), no padrão FERA. Das **artes** (carrossel, estático, criativo): Inter em peso 800–900, como o
carrossel de referência do padrão FERA. Não misturar: página é serifada, arte é sans pesada.

## 2. Foto do cliente

- **Sempre gerada por IA** a partir das fotos reais dele. Frame de vídeo e foto de WhatsApp são
  referência de identidade, não arte final.
- Direção fixa: **mais jovem** (sem deixar de ser reconhecível), **sorrindo**, em **trabalho ou
  ambiente de luxo discreto**, **sem olhar para a câmera**. Exceção única: o avatar, com contato
  visual e fundo mais claro que a pessoa.
- 4:5, enquadramento fechado, mãos fora de quadro, nada de texto legível na cena.
- Grade de cor obrigatória antes de qualquer uso: a mesma correção (temperatura, contraste,
  saturação contida) aplicada a todas as fotos do lote, num editor de foto, pra parecerem um ensaio só.
- QA do avatar em círculo a 110/56/32px — fundo escuro vira borrão no tamanho real.
- Pelo menos 4 cenas distintas por cliente; uma foto nunca repete no feed.

## 3. Os formatos

| Peça | Tamanho | Fundo | Observação |
|---|---|---|---|
| Carrossel / estático | 1080×1440 | alterna escuro e claro | zona morta 250px topo e base |
| Criativo feed | 1080×1350 (4:5) | escuro ou claro | o estático do kit serve direto |
| Criativo story | 1080×1920 | chapado na cor do cliente | caixas de texto uma por linha |
| Capa de destaque | 1080×1920 | escuro ou claro | conteúdo em área segura central, recorte circular |
| Foto de perfil | 1080×1080 | — | o retrato aprovado no QA de círculo |
| Slide do vídeo | 16:9 no player | navy | frase + contexto + infográfico, sem tempo |
| PDF da isca | A4 retrato, 9 páginas | capa e fecho escuros/acento, miolo claro | Inter pesada, tokens do cliente; o gate mede o respiro por página |

## 4. Os tipos de peça no motor (`build_feed.py`)

**Capas** — quatro tipos, distribuídos em xadrez para o grid não repetir composição:
`capa_foto` (foto na metade de cima, texto embaixo) · `capa_coluna` (foto numa coluna, fundo
claro) · `capa` (escura tipográfica) · `capa_clara`. Pelo menos duas das seis com foto.

**Miolo** — `texto` · `passos` (numerados em círculo) · `comparacao` (dois lados com borda
colorida) · `apresentacao` (foto mascarada à direita + marcos) · `cta` (chapado na cor de acento,
keyword em pílula branca) · `recibo` (5 linhas salváveis).

**Estático** — foto mascarada no topo-direita, eyebrow, headline com destaque, corpo ou bullets,
linha de CTA e chip ancorados na base. Com foto o texto começa em 300px; sem foto, em 40px.

**Criativos de anúncio (`criativos.js`)** — três moldes decupados dos anúncios ativos:
`feed-resultado` · `story-nativo` · `feed-editorial`. Baixar os ativos antes de escrever; eles mudam.

## 5. Regras de composição que são gate

- **Zona morta de 250px** no topo e na base de toda arte 1080×1440. Checada no render.
- **Rosto nunca cortado** (cabeça inteira com folga) e **nunca coberto** por texto ou painel.
  Na capa com foto, a faixa de texto começa onde a foto termina.
- **O grid se lê como grade.** Seis capas iguais parecem um post seis vezes. Alternar
  escuro/claro e tipo de capa em xadrez; conferir no grid renderizado, nunca peça a peça.
- **Uma foto por post no feed**, sem repetir nos últimos ~15 posts.
- **Texto preenche o quadro.** Slide com metade vazia parece inacabado — a tipografia se
  auto-ajusta (`ajustarEscala`); se ainda sobrar espaço, o problema é copy curta demais.
- **Marca não vai na borda.** Quem identifica é o chip do rodapé (avatar + nome + papel).

## 6. As páginas

Hero de **foto em fundo inteiro escurecida** com véu navy, chip de categoria, headline Fraunces
branca com `**destaque**` em azul claro, CTA em **pílula clara com seta →**. Blocos alternando
off-white, navy e azul pálido. Barra fixa de CTA na proposta. Tudo mobile-first: QA em 375px
antes de considerar pronto.

## 7. O PDF

Documento, não arte: margens de 18–20 mm, rodapé com nome e `n / total`, cards brancos sobre fundo
creme, tabela com linhas tracejadas pra preencher. Capa com a foto do cliente (mesma regra do
carrossel: rosto inteiro, texto só depois da foto). Páginas de miolo ocupam a folha — folga acima
de ~1/3 é sinal de conteúdo faltando, e a solução é **conteúdo útil** (um checklist, não mais
espaçamento).

## 8. O QA que não se pula

1. Zona morta no render (automático).
2. Guarda de rosto no `recortar45.py` (automático, só reprova corte real).
3. Grid inteiro renderizado — olhar as 15 capas lado a lado.
4. Avatar e capas de destaque mascarados em círculo, nos três tamanhos.
5. Prévia em 375px e 1280px: todos os posts clicados, todos os slides percorridos, zero imagem
   quebrada, zero erro de console, zero `**` ou `<b>` literal.
6. URL pública: páginas em 200, docs internos em 404.
7. PDF: respiro medido por página, conferido página a página, e **link do Drive aberto sem login**.
8. Drive do cliente: só entregável. Nada de `_qa*` (capturas de conferência) na pasta que ele baixa.
