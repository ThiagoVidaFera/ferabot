---
name: conteudo-e-anuncios
description: FeraBot Conteúdo & Anúncios. Cria anúncios (kit feed + story), carrossel, stories, caixinha de perguntas, posts de feed, imagens com IA e sobe campanha no Meta Ads. Use quando o usuário pedir "anúncio", "criativo", "carrossel", "story", "stories", "post", "arte", "imagem", "campanha", "subir anúncio", "impulsionar".
---

# FeraBot Conteúdo & Anúncios

Persona e doutrina: `SkillsDoFera/fera/references/`. Ler `perfil.json` antes de tudo.

## Roteamento interno

| Pedido | Motor |
|---|---|
| Carrossel de feed | skill `squad-carrossel-fera` |
| Stories de bastidores | skill `squad-stories-fera` |
| Caixinha de perguntas | skill `squad-caixinha-fera` |
| Kit de anúncio (padrão ouro) | esta skill, seção Kit abaixo |
| Imagem com IA | seção Imagens abaixo |
| Subir campanha no Meta | skill `meta-ads-fera` (BYOK) |

A voz da conversa é sempre a do FERA. Copy aprovada ANTES de renderizar qualquer arte.

## Kit de anúncio — padrão ouro

Todo pedido de anúncio sai como KIT multiformato, nunca peça solta:

- **Feed 1080×1350** + **Story 1080×1920**, mesmo design system, no mínimo 2 ângulos.
- Estrutura fixa da peça: headline → sub → contexto/bullets → ponte → CTA.
- Copy na voz DELE (perfil.json: nicho, produto, público) — não na voz genérica de agência.
- **Checklist A/B/C/D em cada peça** (doutrina.md). Faltou categoria, reescreve.
- CTA com comando + seta pra baixo quando for tráfego pago ("clica em Saiba Mais ↓").
- Foto real do cliente quando existir (pedir UMA vez; guardar em `assets/fotos/`). Sem foto real,
  gerar com IA (seção Imagens) em plano médio, nunca close.

Build: HTML por peça (1080×1350 e 1080×1920) em `output/conteudo-e-anuncios/<data>-<slug>/`,
renderizar:

```bash
python ScriptsFera/render.py png output/conteudo-e-anuncios/<pasta>/feed-01.html --w 1080 --h 1350
python ScriptsFera/render.py png output/conteudo-e-anuncios/<pasta>/story-01.html --w 1080 --h 1920
```

**Safe zones story:** nada de texto/CTA nos 250px do topo e 340px do rodapé (UI do Instagram cobre).

**QA visual obrigatório:** abrir cada PNG gerado (Read) e conferir texto cortado, contraste,
acento errado. Junto de toda arte com texto, salvar `texto-puro.txt` com o texto cru das peças.

## Imagens com IA (BYOK — Gemini do CLIENTE)

Chave: `GEMINI_API_KEY` no `.env` (grátis em aistudio.google.com — guia no `API_SETUP.md`).

```bash
python ScriptsFera/imagem.py "<prompt em inglês, detalhado>" --out output/conteudo-e-anuncios/<pasta>/img-01.png --ratio 4:5
```

- Prompt sempre em inglês, específico (sujeito + cena + luz + estilo). Ratio: `1:1`, `4:5`, `9:16`, `16:9`.
- Modelo de imagem ERRA texto em português: nunca pedir texto dentro da imagem gerada. Texto entra
  depois, via HTML overlay.
- Sem chave no `.env`: não travar. Montar as peças com foto real ou design tipográfico puro, e
  sugerir `python SetupFera/setup_chaves.py`.

## Subir campanha (BYOK — Meta Ads do CLIENTE)

Delegar pra `meta-ads-fera` com as chaves `META_ACCESS_TOKEN` + `META_AD_ACCOUNT_ID` do `.env`.

Regras invioláveis:
- Campanha **nasce PAUSADA**. Ativa só com OK explícito dele depois de revisar no Gerenciador.
- Toda peça sobe com a copy do anúncio junto (texto principal, título, descrição) — sem isso não
  existe anúncio, existe imagem órfã.
- Sem chave: entregar o kit pronto + passo a passo de subir manual no Gerenciador de Anúncios.

## Entrega

1. Registrar em silêncio:
   `python ScriptsFera/metas-api.py entrega add "conteudo-e-anuncios" "<o que foi>" --link "output/conteudo-e-anuncios/<pasta>/"`
2. Caminho absoluto completo da pasta.
3. Próximo passo DELE: arte pronta que não foi publicada não existe. Data e hora de publicar, na
   mesma resposta.
