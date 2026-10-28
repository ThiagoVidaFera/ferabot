---
name: squad-onboarding
description: Monta o sistema de captação pronto — prévia do perfil com feed, 4 páginas, kit de feed (~55 artes + PDF da isca), 3 campanhas de R$20/dia e fluxo WhatsApp E0–E7 — pro seu negócio ou de um cliente. Triggers "onboarding", "monta meu sistema", "prévia do perfil", "kit de feed", "sistema de captação". NÃO é o briefing de primeiro uso do FERABOT (fera/references/onboarding.md).
---

# Squad Onboarding v5 — o sistema de captação pronto

Você entrega (pra você mesmo ou pra um cliente seu) o sistema inteiro já ligado: perfil do
Instagram, páginas, feed, anúncios e conversas. O dono do perfil não produz nada — só publica, liga
as campanhas e responde. Onde os docs dizem "cliente", leia "o dono do perfil" (pode ser você).

## Ordem de leitura

1. `METODOLOGIA-V5.md` — o que se entrega, por quê, as 8 fases e os gates.
2. `pipeline/steps/step-22-previa-perfil.md` — o procedimento fase a fase, com os comandos.
3. `PADROES-COPY.md` e `PADROES-DESIGN.md` — a barra de qualidade.
4. `KIT-FEED-INICIAL.md` e `templates/previa-perfil/CONTRATO-DE-CONTEUDO.md` — os formatos de dado.
5. `OTIMIZACOES.md` — o que ainda falta, em ordem. `README.md` — mapa dos motores.

Agente que conduz: `agents/pedro-perfil.agent.md`. O acervo v4 (página de vendas, plano, livro,
stories, caixinhas, thumbs, roteiro, workshop) está em `pipeline/steps/step-01` a `step-21` e só
entra quando pedirem uma dessas peças.

## Onde o run vive

Cada run é uma pasta em **`<FERABOT>/output/onboarding/<slug>-<data>/`** (um cliente = uma pasta;
conferir antes de criar). Os motores ficam aqui na skill e são chamados com caminho absoluto
(`<SKILL>/templates/...`), apontando pra pasta do run. **Nenhum motor escreve dentro da pasta da
skill.** Se o run é do seu próprio negócio, `perfil.json` da raiz do FERABOT é o ponto de partida.

## Chaves por fase (BYOK — nenhuma é obrigatória)

As chaves ficam no `.env` da raiz do FERABOT (ver `API_SETUP.md`). Os scripts acham a raiz sozinhos
(`FERABOT_DIR`, ou a pasta acima do run que tem `ScriptsFera/lib.py`, ou `~/ferabot`). Sem a chave,
o passo entrega a peça e mostra o caminho manual.

| Fase | Script | Chave | Sem a chave |
|---|---|---|---|
| 2 · Ensaio por IA | `gerar_fotos.py` / `gerar_fotos_mulher.py` | `GEMINI_API_KEY` | gerar no gemini.google.com com o mesmo prompt + as 2 fotos reais |
| 4 · Publicar | `publicar.py` | `NETLIFY_AUTH_TOKEN` (ou `netlify login`) | arrastar `<run>/_publicar/` em app.netlify.com/drop |
| 5 · Kit no Drive | `subir_drive.mjs` | OAuth do Google Drive (o FERABOT não traz) | subir `kit-feed-inicial/` à mão no Drive e gravar os links com `--manual` |
| 6 · Molde dos criativos | `puxar_criativos.py` | `META_ACCESS_TOKEN` + `META_AD_ACCOUNT_ID` | decupar os anúncios ativos na Biblioteca de Anúncios da Meta |

Render das artes e QA usam Playwright (`pip install playwright` + `python -m playwright install chromium`).
Campanhas no Gerenciador: skill `meta-ads-fera`. Variações de criativo: `anuncios-de-ouro`,
`anuncio-nativo`, `squad-anuncios-estaticos`, `mix-estaticos`.

## Regras duras (não se pula)

- **Prova e dado.** Peça pública (post, story, anúncio, página) usa só prova real: print verdadeiro,
  número com fonte. Dado que só o dono tem (preço, prazo, vaga, caso, número de cliente) nunca é
  inventado — vira pergunta ou `[A PREENCHER: …]` visível. Cenário hipotético só em material didático,
  e rotulado como hipotético no próprio corpo da peça.
- **Zona morta.** Carrossel é 1080×1440; nenhum texto nos 250px do topo nem nos 250px da base (área
  útil de texto: 940px). O `build_feed.py` reprova a peça que viola. Foto clara pede caixa atrás do texto.
- **Rosto.** Rosto inteiro, nunca cortado, nunca coberto por texto; foto nunca repetida no feed.
  `recortar45.py` em toda foto; conferir no grid renderizado, não peça a peça.
- **Mobile-first.** Toda página nasce pro celular; QA com screenshot em 375px (e 1280px) antes de
  dizer pronto — o `qa_run.py` faz os dois, local e no ar.
- **"Deploy is live" não é prova.** Verificar por HTTP na URL pública; `.md` internos em 404.
- **Um fato, um lugar.** Conteúdo se escreve em `<run>/fonte/`; `assets/content.js` e `feed.json` são
  gerados pelo `montar_cliente.py` e nunca editados à mão.
- **Peça do cliente não critica o material dele** — o diagnóstico fica no `OFERTA-*.md` interno.

Gate final: `python -I <SKILL>/templates/qa_run.py <run> --url https://<slug>.netlify.app --entrega`
sem nenhuma FALHA, depois olhar `_qa/grid.png` e `_qa/circulos.jpg`.
