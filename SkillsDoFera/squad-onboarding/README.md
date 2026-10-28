# Squad ONBOARDING — v5

**Versão atual: 5.0 (2026-10-26)** · adaptada pro FERABOT em 2026-10-28.
**Leia primeiro:** [`SKILL.md`](SKILL.md) e [`METODOLOGIA-V5.md`](METODOLOGIA-V5.md).

Você roda isto no **seu próprio negócio** ou no de **um cliente seu**. Onde está escrito "cliente",
leia "o dono do perfil" — que pode ser você.

---

## O que a gente entrega

> O cliente recebe o sistema inteiro pronto — perfil, páginas, anúncios, feed e conversas — para
> ligar as campanhas, falar com os primeiros leads e fazer as primeiras vendas. Ele não produz
> nada: só publica, liga e responde.

Concretamente, três coisas:

1. **Um link** — a prévia publicada: o perfil do Instagram dele montado com as artes reais
   (6 carrosséis fixados com alfinete + 9 estáticos + 4 destaques), as 4 páginas abertas em aba
   nova (agendamento · grupo com isca · slides do vídeo de 18 minutos · proposta), e 6 seções
   que explicam o sistema de forma didática — incluindo 3 criativos por porta e o plano das
   3 campanhas de R$ 20/dia.
2. **Uma pasta no Drive** — ≈55 artes (carrosséis, estáticos, capas de destaque, foto de perfil),
   **o PDF da isca (A4, 9 páginas)**, as legendas de cada peça e o `COMO-POSTAR.md` com ordem, grade, campanhas e os modelos de
   resposta das keywords.
3. **Duas mensagens de WhatsApp** prontas para você mandar: a entrega e a cobrança dos dados
   que só o cliente tem.

Onde fica cada run: `<FERABOT>/output/onboarding/<slug>-<data>/`.

## A tese

O feed existe para sustentar o anúncio. O anúncio leva até a página; o perfil é o que a pessoa
abre antes de confiar. Por isso **as mesmas artes aparecem no feed e nas campanhas**, e as páginas
usam o mesmo argumento dos carrosséis. Três portas (reunião · isca · vídeo), um fluxo de WhatsApp,
uma oferta de entrada.

## Os documentos

| Arquivo | O que é |
|---|---|
| [`METODOLOGIA-V5.md`](METODOLOGIA-V5.md) | o que entregamos, por quê, as 8 fases, os 5 gates |
| [`pipeline/steps/step-22-previa-perfil.md`](pipeline/steps/step-22-previa-perfil.md) | o procedimento, fase a fase, com os comandos |
| [`PADROES-COPY.md`](PADROES-COPY.md) | tom, anatomia da oferta, fórmula do carrossel, keyword, legenda, WhatsApp, páginas |
| [`PADROES-DESIGN.md`](PADROES-DESIGN.md) | tokens, foto, formatos, tipos de peça, regras de composição, QA |
| [`KIT-FEED-INICIAL.md`](KIT-FEED-INICIAL.md) | spec do kit: grade 3+3, estáticos de duplo uso, campanhas, destaques |
| [`templates/previa-perfil/CONTRATO-DE-CONTEUDO.md`](templates/previa-perfil/CONTRATO-DE-CONTEUDO.md) | o formato do `content.js` |
| [`OTIMIZACOES.md`](OTIMIZACOES.md) | **o que ainda falta pro cliente vender mais rápido**, em ordem |
| [`pipeline/pipeline.yaml`](pipeline/pipeline.yaml) | as fases em YAML (v4 preservado em `pipeline-v4.yaml`) |
| [`agents/pedro-perfil.agent.md`](agents/pedro-perfil.agent.md) | o agente que conduz a entrega |

## Os motores

```
templates/previa-perfil/        a prévia e as 4 páginas
├── index.html · app.js · plan.js · styles.css          o perfil navegável (motor do perfil + plano)
├── agendar · grupo · slides · proposta (.html/.js)     as páginas satélites
├── paginas.css · slides.css · proposta.css             visual das páginas (padrão FERA)
├── criativos.js · criativos.css · kit.js               3 criativos por porta · seção do kit
├── gerar_fotos.py · gerar_fotos_mulher.py · recortar45.py   ensaio por IA (Gemini) + guarda de rosto
├── puxar_criativos.py                                  decupa os anúncios ativos (o molde vivo) — opcional
└── publicar.py                                         Netlify com as armadilhas resolvidas

templates/kit-feed/             o Kit de Feed Inicial
├── build_feed.py               feed.json → ≈55 PNGs 1080×1440 com gate de zona morta
├── build_isca.py               feed.json → PDF da isca, A4, 9 páginas, com gate de respiro
├── gerar_docs.py               COMO-POSTAR.md + COPY.md por peça
├── feed_do_kit.py              a prévia passa a usar as artes reais (chamado pelo montador)
├── subir_drive.mjs             sobe a pasta (sem _qa*) e grava drive-links.json — opcional; --manual grava o link colado
└── auditar_drive.mjs           permissão pública da pasta/PDF e lixo _qa* (chamado pelo QA; sem credencial vira aviso)

templates/montar_cliente.py     fonte/ → assets/content.js + feed.json (calcula e deriva)
templates/qa_run.py             QA único: todos os gates numa passada, exit 1 em falha
templates/ferabot_env.py        acha a raiz do FERABOT e lê as chaves do .env (BYOK)
```

Conteúdo por cliente vive na **fonte única** `<run>/fonte/`: `fatos.json` (todo fato que se repete,
uma vez) + `content.tpl.js` e `feed.tpl.json` com `{{tokens}}`. O `montar_cliente.py` gera
`assets/content.js` e `feed.json` — **gerados, nunca editados à mão**. Os motores não mudam por cliente.

## Regras que viraram gate (não se pula)

1. **Prova e dado** — peça pública só com prova real; número sem fonte vira `[A PREENCHER]` visível.
2. **Zona morta de 250px** — checada no render.
3. **Rosto inteiro, nunca coberto, foto nunca repetida** — conferido no grid.
4. **Peça de cliente não critica o material dele** — diagnóstico vai no doc interno.
5. **"Deploy is live" não é prova** — QA na URL pública, docs internos em 404.
6. **Um fato, um lugar** — número/nome que se repete mora no `fatos.json`; conta é calculada.

Os seis rodam juntos no `qa_run.py <run> --url <site> [--entrega]` (os de composição geram a
folha `_qa/grid.png` e `_qa/circulos.jpg` pra olhar).

Mais: foto sempre por IA com direção fixa · 6 capas em xadrez · keyword uma por porta ·
"vídeo de 18 minutos" sempre · WhatsApp E0–E7 com as 3 regras · entrega por link, nunca zip.

## O que ainda não fazemos e deveríamos

Em [`OTIMIZACOES.md`](OTIMIZACOES.md). Os dois que separam "entrega bonita" de "cliente
vendendo": **páginas vivas com backend** (hoje são protótipos) e **campanhas pausadas no
Gerenciador** (hoje é orientação). O terceiro — o PDF da isca — foi fechado em 26/10 e é padrão.

---

## Acervo v4 (continua disponível, não é a entrega padrão)

Os 9 entregáveis da v4 — página de vendas Netlify, plano de marketing (12 seções, sem KPIs),
livro-funil, proposta comercial, 10 stories texto-only, 3 carrosséis Conteúdo Repelente,
10 caixinhas, 3 thumbnails, roteiro YouTube 20 slides, página de workshop — seguem nos
`steps/step-02` a `step-21` e em `pipeline/pipeline-v4.yaml`, com seus agentes (Paula, Marco,
Lara, Walter, Patrícia, Sofia, Carlos, Tania, Clara, Renata, Rita, Netuno, Danilo). Usar quando
um cliente pedir uma dessas peças especificamente. Regras que continuam valendo de lá: nicho
clínico nunca cita número de sessões; Drive só com PNG em 3 subpastas quando for esse formato;
rework grande cria pasta nova; skills com gate interno respeitam o gate.

Gotchas de infra (versão do Playwright casada com a do Chromium instalado; Netlify `sites:create`
com `--site` explícito; domínio próprio via `custom_domain`) seguem válidos.
