---
name: formatos-criativos-por-perfil
description: "Monta o perfil do criador/cliente (nicho, público, formatos fixos, subtemas, jeito de falar) e escolhe o formato de cada vídeo num catálogo de 8 (tela dividida, lista rápida, assunto do momento, viral adaptado, workshop, bastidor, dilema, jornada). Triggers: perfil do criador, qual formato, formato do vídeo."
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

# formatos-criativos-por-perfil — quem fala, em que formato, com que cara

> Fonte do método: EVIA A08 (formatos), A09 (perfil e identidade), A15 (um projeto por identidade) e o anexo de pautas e roteiros —
> reescrito com estrutura e palavras nossas. Literais em `conhecimento/dossiers/themes/PROCEDIMENTOS/PROC-EVIA-A09-perfil-de-criador-e-identidade-visual.md`.

**Princípio:** com o formato e o perfil definidos, o agente já sabe que edição fazer quando o bruto chega — menos perguntas, menos
retrabalho, menos limite gasto. O perfil é feito **uma vez** por criador/cliente e nunca é perguntado de novo.

## Quando usar
- Projeto novo (criador próprio, mentorado, cliente de edição): antes do primeiro roteiro ou edição.
- Uma skill de roteiro/edição não achou `perfil-do-criador.md` na raiz do projeto.
- Escolher o formato de um vídeo ("isso vira lista rápida ou tela dividida?").
- **Produtos do autor** (MCT, FCA, Lead Certo, TFA): a IDV já existe (`kit/src/brand/`, IDVs por produto) — aqui só o perfil e os formatos; a identidade visual NÃO é recriada.

## 1. Perfil do criador (`perfil-do-criador.md` na raiz do projeto)
**Um projeto/pasta por identidade visual ou cliente** — nunca dois clientes no mesmo projeto. Mesmo criador com identidades diferentes
(conteúdo educativo × vlog autêntico) = dois projetos; mudar só de 16:9 para 9:16 não pede projeto novo, só se declara o formato no pedido.

Coleta em **uma rodada só**:
1. Antes de perguntar, ler o que já existe: Instagram/TikTok, página de vendas, vídeos já editados (navegador com a extensão do Claude; ou
   prints). Quem manda link responde bem menos.
2. Perguntar só o que faltou, agrupado (o dono pode responder por áudio/ditado).
3. Gravar no modelo abaixo; confirmar em 1 linha; **não pedir roteiro nem edição nesta etapa** (escopo travado no perfil).

Modelo (preencher; o que não se sabe fica `[a confirmar]`):
```
# Perfil do criador — <nome/marca>
## Quem fala e para quem
- Nicho: … · Público: quem é · o que quer · onde trava
- Plataformas: Reels / TikTok / Shorts / YouTube (quais e com que prioridade)
## Formatos fixos (do catálogo abaixo) e frequência por semana
- <formato> × <n>/semana · …
## Subtemas fixos (5 a 10)
## Como fala
- Gírias e expressões que usa · palavras que nunca usa · tom (ex.: direto, bem-humorado, técnico)
## Iscas que pode entregar (para o CTA de orgânico)
- prompt · checklist · planilha · modelo · aula · episódio
## Fatos verdadeiros que podem entrar nos roteiros
- Só o que o dono contou. O agente nunca inventa história, número ou conquista do criador.
## Regras da marca
- Proibições (ex.: sem preço no criativo, sem citar concorrente) · palavra do CTA orgânico (Digite "PALAVRA")
```

## 2. Catálogo de formatos (escolher 1 por vídeo)
| Formato | Duração | Abertura | Meio | Fim | Gravação | Edição dominante (efeitos/skills) |
|---|---|---|---|---|---|---|
| **História em tela dividida** | 50–70 s | o número ou a contradição central escrito antes de 3 s | a história em ordem de **tensão**, 1 prova real por afirmação, sem opinião | o que isso ensina + CTA | 1 take, de preferência decupado | `tela-dividida-midia-em-cima` + `zoom-na-regiao-da-acao` + `foto-real-sobe-sobre-titulo` |
| **Lista rápida** | 15–30 s | a 1ª palavra já é o item 1; título com o número fixo no topo | 1 item a cada 2–3 s, escrito na palavra dita | último item = o mais forte/surpresa, entrega a isca | 1 take lendo a lista | `lista-progressiva-apresentador` / `lista-em-capsulas` + barra de progresso |
| **Assunto do momento** | 30–45 s | o fato em 1 frase com o print da notícia antes de 3 s | o que está por trás (lente do nicho) + opinião | isca só se ensinar | rosto + print | `prova-na-tela` · validade 24–48 h, 2 fontes ou a primária |
| **Viral de fora adaptado** | livre | a forma que funcionou lá fora, com assunto nosso | formato aberto | conforme a peça | conforme a referência | `estilo-por-referencia` (modos A/B) |
| **Workshop na prática** | 30–45 s | problema ou o resultado pronto por 1 s | no máximo 3 passos, cortes rápidos e zoom no que importa | antes → depois lado a lado + **isca obrigatória** (o prompt, o arquivo) | criador + tela | `antes-depois-em-pares` · `toques-no-celular` · `atalho-e-alvo` |
| **Bastidor (construindo)** | 30–60 s | a situação que o público vive, não a história do criador | o criador falando enquanto faz algo real, cortes secos a cada 2–5 s | "me segue para ver no que vai dar", sem isca | lo-fi, celular | take + legenda; quase sem efeito |
| **Dilema** | 10–25 s | "A ou B?" com as duas opções na tela | 1 argumento curto de cada lado | pedido de resposta nos comentários (só orgânico) | 1 take | `matriz-a-contra-b` / `rotulos-opostos-rosto-no-meio` |
| **Jornada / resumo de episódio** | 45–70 s | o momento mais forte (começar no meio da cena ou contradição com número) | contexto em 1 frase + 2–4 melhores momentos costurados pela narração; para antes da resolução | "o episódio inteiro está no canal" + palavra para receber o link | corte do vídeo longo | cortes + legenda + `cena-nasce-da-anterior` entre momentos |
Regras: um formato por vídeo; **se não cabe em nenhum, mudar a ideia**. Anúncio pago usa os formatos com prova (história, workshop, lista);
dilema, bastidor e jornada são de orgânico. Todo criativo continua sendo PAR (pago + orgânico), exceto avatar/profissão.
O roteiro sai pela `brief-to-script` (ordem fixa, brevidade, fatos com fonte); o gancho pela `gancho-dos-tres-segundos`.

## 3. Identidade visual como página HTML (só para quem ainda não tem IDV)
Gerar uma página (artefato HTML) com:
1. **Paleta por papel**: fundo, tinta, tinta-mudo, fio, **um** acento, um sinal de alerta — nomes que falem do universo do cliente (ex.: "papel",
   "latão"), cada um com hex e onde usa.
2. **Tipografia**: 1 display (título/capa), 1 de apoio (legenda/corpo), 1 mono opcional (etiquetas), com uma frase real do nicho em cada.
3. **Como fica no vídeo**: 3 mockups 9:16 (abertura, meio com prova, CTA) + etiqueta de formato no topo (ex.: CASO REAL, LISTA RÁPIDA).
4. **Capas que formam conjunto** (grade de 9) e **Sempre / Nunca** (ex.: sempre o documento na tela, número como protagonista, uma palavra
   no acento por frase; nunca cantos arredondados se a marca é "carimbo", nunca preço no criativo se a regra proíbe).
5. Tokens exportáveis (`tokens.css` / `tokens.ts`) para Remotion/HyperFrames — as cenas consomem variável, nunca hex solto.
**Não engessar:** identidade = tokens + regras de marca; layout, motion e composição ficam livres por peça. Depois de aprovar a página,
registrar no perfil: "elementos fixos só os tokens; liberdade total de motion". Ajuste de gosto (ex.: legenda sem caixa de fundo) entra na hora
como regra no perfil, não como correção peça a peça.

## 4. Referências do perfil
Pasta fixa `referencias/edicoes/` no projeto, cada arquivo nomeado pelo que se quer copiar dele (`03 - legenda diferente no início.mp4`);
análise pela `estilo-por-referencia`. Nunca colar vários vídeos no chat.

## Checklist
- [ ] `perfil-do-criador.md` na raiz, sem campo inventado (o que falta está `[a confirmar]`)
- [ ] Formatos fixos com frequência; cada vídeo novo declara o formato do catálogo
- [ ] Um projeto por identidade/cliente
- [ ] IDV: tokens exportados + página HTML aprovada; nenhum elemento fixo além dos tokens e regras
- [ ] Fatos do criador só os que ele contou

## Ligações
`brief-to-script` (roteiro) · `gancho-dos-tres-segundos` · `estilo-por-referencia` · `direcao-de-edicao-ia` (o formato entra no briefing
como "formato dominante") · `catalogo-de-efeitos` · `design-dna-extractor` (quando a identidade vem de um site) · `motor-de-video`.
