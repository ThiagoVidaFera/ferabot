# Squad Onboarding v5 — a metodologia

Consolidado em 2026-10-26 a partir de um run completo (6 rodadas de feedback em dois dias).
**Este é o documento que se lê primeiro em qualquer run.** Os outros detalham. Você roda no seu
próprio negócio ou no de um cliente seu — "cliente" aqui é o dono do perfil.

---

## O que a gente entrega, em uma frase

> O cliente recebe o sistema inteiro pronto — perfil, páginas, anúncios, feed e conversas — para
> ligar as campanhas, falar com os primeiros leads e fazer as primeiras vendas. Ele não produz
> nada: só publica, liga e responde.

Antes (v4) a entrega era um conjunto de peças (página de vendas, plano de marketing, livro, stories,
caixinhas…) que o cliente precisava entender e ligar entre si. Agora a entrega é **um caminho
único, já ligado**, que ele vê funcionando antes de existir.

## A tese que organiza tudo

O feed existe para sustentar o anúncio. O anúncio leva a pessoa até a página; o perfil é o que
ela abre antes de decidir se confia. **Os dois precisam dizer a mesma coisa** — por isso as mesmas
artes aparecem no feed e nas campanhas, e as páginas usam o mesmo argumento dos carrosséis.

Três portas, uma oferta:

```
                    ┌──────────────┐
   anúncio A ──────▶│  /agendar    │──▶ reunião de 30 min ──┐
                    └──────────────┘                        │
                    ┌──────────────┐                        ▼
   anúncio B ──────▶│  /grupo      │──▶ PDF + grupo ──▶  WhatsApp E0–E7 ──▶ venda
                    └──────────────┘                        ▲
                    ┌──────────────┐                        │
   anúncio C ──────▶│  vídeo 18min │──▶ keyword ───────────┘
                    └──────────────┘
         ▲
         │  o feed (6 fixados + 9 estáticos) é o que a pessoa vê antes de clicar
```

Quem está pronto entra pela A. Quem precisa amadurecer entra pela B. Quem precisa entender entra
pela C. Todas desembocam no mesmo fluxo de WhatsApp e na mesma oferta de entrada.

## As 8 fases do run

| # | Fase | Produz | Motor |
|---|---|---|---|
| 1 | **Diagnóstico e oferta de entrada** | `OFERTA-<nome>.md` com Big Idea, mecanismo, entrega por semana, preço, pendências | Big Idea · contracrença · mecanismo · inimigo · vocabulário (step-22, fase 1) + leitura do perfil real |
| 2 | **Ensaio por IA** | 4–5 retratos do cliente, gradeados, mais o avatar | `gerar_fotos.py` (Gemini) → grade de cor → `recortar45.py` |
| 3 | **Prévia do Perfil** | `index.html` navegável: bio, destaques, feed, DM, guia, oferta + 6 seções de plano | `content.js` sobre o template `previa-perfil/` |
| 4 | **As 3 páginas + slides** | `agendar.html` · `grupo.html` · `proposta.html` · `slides.html` | mesmos templates, mesmo `content.js` |
| 5 | **Kit de Feed Inicial** | 6 carrosséis + 9 estáticos + 4 capas de destaque + foto de perfil (≈55 PNGs) + **PDF da isca** (A4, 9 págs) | `feed.json` → `build_feed.py` · `build_isca.py` |
| 6 | **Campanhas e criativos** | 3 campanhas documentadas (A reunião · B isca · C vídeo), 9 criativos = os estáticos | `puxar_criativos.py` (opcional) para decupar o molde vivo |
| 7 | **Fluxo de WhatsApp** | E0–E7 adaptado à oferta + 3 modelos de resposta por keyword | esqueleto E0–E7 de `PADROES-COPY.md` §7 |
| 8 | **Publicação e entrega** | link da prévia no ar · Drive com o kit · `COMO-POSTAR.md` · mensagem de WhatsApp | `publicar.py` · `gerar_docs.py` · `subir_drive.mjs` (ou upload manual) |

Ordem importa: a fase 3 depende da 1 e da 2; a 5 depende da 3 aprovada; a 6 e a 7 alimentam a 3
e a 5. O cliente **aprova a prévia (fase 3) antes** de o kit ser produzido — é o checkpoint que
evita refazer 55 artes.

## O que o cliente recebe, concretamente

1. **Um link** — a prévia publicada, com o feed dele montado com as artes reais, as 4 páginas
   abertas em aba nova, e as 6 seções que explicam o sistema de forma didática.
2. **Uma pasta no Drive** — carrosséis, estáticos, capas de destaque, foto de perfil, **o PDF da
   isca**, legendas e o `COMO-POSTAR.md` com a ordem, a grade, as campanhas e os modelos de resposta
   (já com o link real do PDF).
3. **Duas mensagens de WhatsApp** prontas para você mandar: a entrega e a cobrança dos dados
   que só o cliente tem.

## Os cinco gates que não se pula

1. **Prova e dado**: peça pública usa só prova real; número de cliente sem fonte vira
   `[A PREENCHER]` visível — o marcador é o que puxa o dado real; cenário hipotético só em
   material didático, rotulado no corpo.
2. **Zona morta de 250px** (checada no render): peça que viola não sai.
3. **Rosto inteiro, nunca coberto, foto nunca repetida no feed**: conferido no grid renderizado,
   não peça a peça.
4. **A peça do cliente não critica o material dele**: diagnóstico vai no doc interno; na peça, a
   forma é propositiva.
5. **"Deploy is live" não é prova**: verificação por HTTP na URL pública, docs internos em 404.

Desde 26/10/2026 os cinco **rodam**, não só estão escritos: `templates/qa_run.py` checa numa
passada fonte, kit, pendências, prévia renderizada local e no ar, URL e Drive (exit 1 em falha).
E um sexto, de origem: **um fato, um lugar** — o conteúdo se escreve em `fonte/`
(`fatos.json` + templates com `{{tokens}}`) e o `montar_cliente.py` gera o que vai pro ar.

## Onde está cada coisa

- Procedimento passo a passo: `pipeline/steps/step-22-previa-perfil.md`
- Padrões de copy: `PADROES-COPY.md` · de design: `PADROES-DESIGN.md`
- Spec do kit: `KIT-FEED-INICIAL.md` · contrato do `content.js`: `templates/previa-perfil/CONTRATO-DE-CONTEUDO.md`
- O que ainda falta para o cliente vender mais rápido: `OTIMIZACOES.md`
- Onde fica o run: `<FERABOT>/output/onboarding/<slug>-<data>/` · chaves e caminhos manuais: `SKILL.md`
