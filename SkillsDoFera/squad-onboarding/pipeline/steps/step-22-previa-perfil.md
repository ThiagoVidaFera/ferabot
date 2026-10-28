# Step 22 — Prévia do Perfil e Kit de Feed (o núcleo da entrega v5)

**Agente:** Pedro Perfil (`agents/pedro-perfil.agent.md`)
**Leia antes:** `METODOLOGIA-V5.md` (o porquê) · `PADROES-COPY.md` · `PADROES-DESIGN.md`
**Onde roda:** `<FERABOT>/output/onboarding/<slug>-<data>/` (o run). `<SKILL>` = a pasta desta skill
(em geral `~/.claude/skills/squad-onboarding`). Os motores nunca escrevem dentro de `<SKILL>`.

Este step era uma lista de regras acumuladas em seis rodadas. Foi reescrito como procedimento em
2026-10-26. As regras continuam valendo — estão agrupadas na seção 3, por tema.

---

## 1. Entradas

- Pasta do run em `<FERABOT>/output/onboarding/<slug>-<data>/` (**um cliente = uma pasta**; conferir
  antes de criar se já não existe uma pra mesma pessoa com outro nome).
- Fotos reais dele (qualquer qualidade: servem de referência de identidade).
- O que já existe: `perfil.json` do FERABOT (se o run é do seu próprio negócio) ou o briefing do
  cliente (`pipeline/data/client-briefing.md` como modelo), posicionamento, perfil do Instagram (puxar métricas reais dos
  últimos 60 dias — views, curtidas, frequência; é o diagnóstico que sustenta a oferta).
- Suas decisões sobre a oferta de entrada (prazo, ticket) — quando houver.

## 2. As fases, com os comandos

Trabalhar em `<FERABOT>/output/onboarding/<slug>-<data>/` (o `<run>`). Os comandos abaixo usam
caminho absoluto pros motores (`<SKILL>/templates/...`), então rodam de qualquer pasta.

### Fase 1 — Diagnóstico e oferta de entrada
Definir o posicionamento (Big Idea, contracrença, mecanismo nomeado, inimigo, vocabulário próprio).
Ler o perfil real. Escrever `OFERTA-<nome>.md` com: diagnóstico (interno),
Big Idea, inimigo, mecanismo em 4 peças nomeadas, entrega por semana, promessa de entrega, preço,
como encaixa na oferta principal, **pendências que só o cliente tem**. Fechar com a mensagem de
coleta dos dados dele (`OTIMIZACOES.md` §4).

### Fase 2 — Ensaio por IA
```bash
python -I <SKILL>/templates/previa-perfil/gerar_fotos.py <run>/fotos/crus <ref_rosto.jpg> <ref_corpo.jpg>          # homem
python -I <SKILL>/templates/previa-perfil/gerar_fotos_mulher.py <run>/fotos/crus <ref_rosto.jpg> <ref_corpo.jpg>   # mulher
python -I <SKILL>/templates/previa-perfil/recortar45.py <SKILL>/templates/previa-perfil/haarcascade_frontalface_default.xml <run>/fotos/normalizadas <run>/fotos/crus/*.jpg
```
**Chave:** `GEMINI_API_KEY` no `.env` do FERABOT. **Sem ela:** gerar à mão no Gemini
(gemini.google.com) colando o prompt `IDENTIDADE` + a cena do `gerar_fotos.py`, com as 2 fotos reais
anexadas, e salvar os `.jpg` em `<run>/fotos/crus/` — o resto segue igual.

Regras de imagem: ancorar em 2+ fotos reais citadas por número; 4:5, enquadramento fechado; mãos
fora de quadro; nada de texto legível na cena; prompt verbatim salvo junto (`.gen.json`); flag de
moderação → parar e reportar, nunca reescrever o prompt pra driblar. **Grade de cor:** a mesma
correção em todas as fotos do lote (num editor), pra parecerem um ensaio só. Gate de curadoria em cada imagem. Avatar: folha em círculo
a 110/56/32px. Lote substituído vai pra `archive/<data>-<motivo>/` com `WHY.md`, nunca se apaga.

### Fonte única (vale da fase 3 em diante)
Desde 26/10/2026 o conteúdo do cliente **não é escrito nos arquivos que vão pro ar**. Escreve-se em
`<run>/fonte/`:

| Arquivo | O quê |
|---|---|
| `fonte/fatos.json` | todo fato que aparece em mais de um lugar, **uma vez**: `oferta` (nome, `preco_num`, prazo, encontros), `keywords`, `autoridade`, `exemplo` (`qtd`, `com_motivo`, `ticket`) e `_lint_ignorar` |
| `fonte/content.tpl.js` | a prévia, com `{{oferta.nome}}`, `{{exemplo.valor}}`… no lugar dos fatos |
| `fonte/feed.tpl.json` | o kit, com os mesmos tokens |

```bash
python -I <SKILL>/templates/montar_cliente.py <run>   # gera assets/content.js + feed.json
```
O montador **calcula** o que é conta (`exemplo.valor` = qtd × ticket, `sem_motivo`, `paga_vezes`,
`oferta.preco`), **deriva** o que antes se copiava à mão (`guide` ← `feed.isca`; `plano.kit.campanhas`
← `feed.campanhas`; link do Drive e do PDF ← `drive-links.json`; calculadora da proposta ←
`exemplo`) e roda o `feed_do_kit.py`. Falha se um token não tiver fato.

**`assets/content.js` e `feed.json` são GERADOS — nunca editar à mão.** Toda correção vai na fonte e
o montador roda de novo. Origem: quando o fato fica digitado em dois arquivos, o mesmo exemplo sai
com um valor no criativo e outro no PDF.

### Fase 3 — Prévia do Perfil
Copiar os arquivos de `<SKILL>/templates/previa-perfil/` (menos os `.py`, o `.xml` e o `.md`) pra pasta do run.
Escrever `fonte/content.tpl.js` pelo `CONTRATO-DE-CONTEUDO.md`: perfil, posts de exemplo, destaques,
DM, `guide` (a isca escrita), `offer`, e `plano` com as seções `agendamento`, `campanhaGrupo`,
`videoYoutube` (beats como cenas), `conversasWhatsApp` (regras + mapa E0–E7 + exemplos),
`proposta` e os `criativos[]` de cada porta.

```bash
python -I <SKILL>/templates/previa-perfil/puxar_criativos.py <run>/_referencias/criativos   # decupar o molde VIVO antes de escrever os criativos
```
**Opcional.** Chaves: `META_ACCESS_TOKEN` + `META_AD_ACCOUNT_ID`. Sem elas o script avisa e sai: decupe
à mão na Biblioteca de Anúncios da Meta (facebook.com/ads/library) — título, corpo, CTA e destino
dos anúncios ativos que funcionam no nicho.

**Checkpoint:** você (e depois o cliente, se o run é de um cliente seu) aprova a prévia antes da fase 5.

### Fase 4 — Publicar
```bash
python -I <SKILL>/templates/previa-perfil/publicar.py <run> <slug-do-site> "<Nome do Cliente>"
```
**Chave:** `NETLIFY_AUTH_TOKEN` no `.env` do FERABOT (ou `netlify login`). Precisa do Netlify CLI
(`npm i -g netlify-cli`). **Sem token:** o script para e diz o caminho manual — arrastar a pasta
`<run>/_publicar/` em app.netlify.com/drop e conferir a URL no celular.
Cria/reusa o site, grava `.netlify/state.json` local, deploya com `--site` e `--auth`, desliga
badge/HUD, publica só a prévia (aborta se um `.md` entrar), marca `noindex`, verifica por HTTP.
Idempotente.

### Fase 5 — Kit de Feed Inicial
Escrever `fonte/feed.tpl.json` (marca com tokens e fotos · 6 carrosséis com `slides[]` tipados · 9 estáticos
com `campanha` A/B/C · `capas_destaque` com `carrosseis[]` · `campanhas` · `respostas` · `isca`). Spec em
`KIT-FEED-INICIAL.md`.
```bash
python -I <SKILL>/templates/montar_cliente.py <run>          # fonte → feed.json + content.js
python -I <SKILL>/templates/kit-feed/build_feed.py <run>      # render + zona morta
python -I <SKILL>/templates/kit-feed/build_isca.py <run>      # o PDF da isca (A4, 9 páginas)
python -I <SKILL>/templates/montar_cliente.py <run>          # de novo: posts e destaques da prévia passam a usar as artes reais
node <SKILL>/templates/kit-feed/subir_drive.mjs <run> "<Nome> — Kit de Feed Inicial"   # 1ª vez: gera o link do PDF
python -I <SKILL>/templates/kit-feed/gerar_docs.py <run>      # COMO-POSTAR + COPY, já com o link real do PDF
node <SKILL>/templates/kit-feed/subir_drive.mjs <run> "<Nome> — Kit de Feed Inicial"   # 2ª vez: sobe os docs atualizados
```
Render precisa de Playwright (`pip install playwright` + `python -m playwright install chromium`).

**Drive é opcional — e o FERABOT não traz credencial do Google Drive.** Sem ela, o `subir_drive.mjs`
não falha: imprime o caminho manual, que é o padrão:
1. arrastar a pasta `<run>/kit-feed-inicial/` pro drive.google.com (sem as pastas `_qa*`);
2. compartilhar a pasta e o PDF da isca como "Qualquer pessoa com o link — Leitor";
3. `node <SKILL>/templates/kit-feed/subir_drive.mjs <run> --manual "<link da pasta>" "<link do PDF>"` — grava o
   `drive-links.json`;
4. rodar `gerar_docs.py` de novo e substituir na pasta do Drive o `COMO-POSTAR.md` atualizado.
(Quem já tem OAuth do Google: `GOOGLE_DRIVE_CLIENT_ID`/`GOOGLE_DRIVE_CLIENT_SECRET` no `.env`, token em
`<FERABOT>/drive-token.json` e `npm i googleapis` — aí o upload é automático.)
**A isca em PDF faz parte do kit, não é opcional** (regra do método): o carrossel da
isca, a página do grupo e a resposta da keyword PROMETEM o material — sem o arquivo, a resposta sai
com link vazio. `build_isca.py` lê o bloco `isca` do `feed.json` e gera o PDF A4 de 9 páginas (capa ·
como usar · as 9 situações em 3 páginas, cada uma com **onde procurar / como calcular / mensagem
pronta** · a conta pra preencher · priorizar e rotina · exemplo hipotético rotulado + checklist ·
próximo passo). O `subir_drive.mjs` grava `drive-links.json`; o `gerar_docs.py` lê dele e troca o
`[LINK DO PDF]` das respostas-modelo pelo link real. Por isso o upload roda **duas vezes**: a
primeira gera o link, a segunda leva os docs que já o contêm. Antes de mandar o kit, abrir o link
**sem estar logado** (janela anônima) — o PDF herda a permissão `anyone → reader` da pasta (com
credencial, o QA confere pela API; o HTML do Drive mente: mostra "Sign in" mesmo com o arquivo público).

Foto de perfil 1080×1080 em `kit-feed-inicial/perfil/`. `plano.kit` vive no `content.tpl.js`
(grade, passos); campanhas e link do Drive o montador preenche. Rodar o montador e republicar (fase 4).

> **Notas de campo:** (1) cliente MULHER → `gerar_fotos_mulher.py` (o `gerar_fotos.py` é "the same man"); (2) a cascata do `recortar45.py` está em `templates/previa-perfil/haarcascade_frontalface_default.xml` (o OpenCV 5 não traz; o script agora cria a pasta de destino e aborta se a cascata for vazia); (3) a tabela "A conta" da isca é configurável em `isca.conta` (`colunas`, `celulas`, `total`, `total_celula`, `campos`) — o padrão é quantas × valor; outra métrica exige configurar; (4) a foto de perfil 1080×1080 NÃO sai do `build_feed.py`: recortar o `avatar` em `kit-feed-inicial/perfil/foto-de-perfil.jpg`.

### Fase 5b — QA único (gate antes de mandar qualquer coisa)
```bash
python -I <SKILL>/templates/qa_run.py <run> --url https://<slug>.netlify.app             # rodada de trabalho
python -I <SKILL>/templates/qa_run.py <run> --url https://<slug>.netlify.app --entrega   # gate final
```
Roda numa passada o que antes era teste montado à mão: fonte em dia, token sem sobra, fato digitado
fora do token · kit completo (PNG por slide, 9 estáticos, 4 capas, foto de perfil, PDF, COMO-POSTAR) ·
`[A PREENCHER]` e `[LINK …]` abertos (AVISO; FALHA com `--entrega`) · motor igual ao template ·
prévia renderizada em 375 e 1280px, local e no ar (erro de JS, imagem quebrada, `**`/`<b>` literal,
todo post aberto e todo slide percorrido) · páginas e PDF em 200 no ar · `.md`, `fonte/`, `feed.json`,
`drive-links.json` e `_qa` em 404 · Drive com pasta e PDF públicos pela API e sem `_qa*` (sem credencial do Drive: AVISO, e você confere à mão).
Exit 1 em qualquer FALHA. Gera `_qa/grid.png` e `_qa/circulos.jpg` — **olhar as duas**: composição
e ritmo do grid continuam sendo olho, mas sobre a folha certa.

### Fase 6 — Entrega
`MENSAGEM-ENTREGA.md` com as duas mensagens (entrega + cobrança dos dados), prontas pra você
mandar: nunca bloco único, parágrafos de até 4 linhas, linha em branco entre blocos, negrito e emoji
só com função. `README.md` do run com o mapa dos arquivos.

## 3. As regras duras, por tema

### Copy e prova
- `PADROES-COPY.md` inteiro. Em especial: oferta com anatomia fixa, carrossel na fórmula
  PAS → Prova → Oferta → Filtro → CTA, uma keyword por porta, "vídeo de 18 minutos" sempre.
- Prova e dado: peça pública usa só prova real; dado que só o dono tem vira pergunta ou
  `[A PREENCHER]` **visível** — é o que puxa o dado real; cenário hipotético só em material didático
  e rotulado no corpo. `topNote` de demonstração obrigatório na prévia.
- A peça do cliente **não critica o material dele**. Diagnóstico vai no `OFERTA-*.md`; na peça, a
  forma é propositiva ("ligar o que você já tem num caminho só").
- WhatsApp: esqueleto E0–E7 (`PADROES-COPY.md` §7), três regras, nunca licença de
  fuga. Respostas manuais, modelo pronto no kit.

### Foto
- Sempre gerada por IA a partir das reais; direção fixa (mais jovem, sorrindo, trabalho ou luxo,
  sem olhar pra câmera; avatar é a exceção). Grade de cor obrigatória. `recortar45.py` em tudo.
- Uma foto por post no feed. Rosto inteiro, nunca coberto.

### Composição
- Zona morta 250px (gate no render). Marca nunca na borda — o chip do rodapé identifica.
- As 6 capas em xadrez de tipo e de fundo; pelo menos duas com foto. Conferir no grid renderizado.
- Tipografia se auto-ajusta; slide vazio é copy curta, não fonte pequena.
- Capa de destaque: conteúdo em área segura central; sem guias de produção na arte final.

### Páginas e referência
- Visual das páginas = o padrão FERA de `paginas.css` (Fraunces + Archivo, off-white e navy,
  trocando o acento pela cor do cliente). Proposta = estrutura de `PADROES-COPY.md` §8.
- Link da bio abre `agendar.html` em aba nova. Seção 02 abre `grupo.html`. Seção 03 abre
  `slides.html` (cenas com infográfico, sem tempo). Fecho abre `proposta.html`.
- Cada porta mostra 3 criativos nos moldes vivos (`feed-resultado` · `story-nativo` ·
  `feed-editorial`), decupados dos anúncios ativos no dia (ou da Biblioteca de Anúncios).

### Publicação
- Entrega por link, nunca zip. Só a prévia e as artes vão pro ar; `.md` dá 404.
- "Deploy is live" não é prova: QA na URL pública em 375px e 1280px, todos os posts clicados.

## 4. Saída do step

- `<FERABOT>/output/onboarding/<slug>-<data>/` com: `index.html` + 4 páginas + `assets/` + `feed.json` +
  `kit-feed-inicial/` (≈55 PNGs + docs) + `OFERTA-*.md` + `MENSAGEM-ENTREGA.md` + `README.md`.
- Link público da prévia. Link do Drive. As duas mensagens prontas pra você mandar.
- Lista do que o cliente ainda precisa fornecer (os `[A PREENCHER]`).

O que **ainda não** sai deste step e deveria — páginas vivas, campanhas pausadas no Gerenciador —
está em `OTIMIZACOES.md`, em ordem de prioridade.
