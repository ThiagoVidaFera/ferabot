---
name: ensaio-ia
description: FeraBot Ensaio com IA. Gera um ensaio de fotos do PRÓPRIO dono a partir de 3 a 6 fotos reais dele (rosto mantido), em cenários do negócio dele, para usar em post, carrossel, story, anúncio e página. Depois alimenta a /galeria-de-artes. Triggers "ensaio", "ensaio de fotos", "fotos minhas com IA", "foto profissional", "fotos pro post", "banco de fotos".
---

# Ensaio com IA

Doze fotos suas, com o seu rosto, em cenas que contam o que você faz. Saem de 3 a 6 fotos reais que
você já tem no celular. Servem de matéria-prima para todo criativo do FERABOT.

## Regras (antes de gerar qualquer coisa)

- **Só o rosto do dono, com fotos que ele mandou.** Foto de outra pessoa só com autorização dela. Nunca.
- **Ensaio é retrato, não prova.** A foto pode ilustrar a tese do post. Nunca vira resultado, depoimento,
  print, cliente ou número. Prova continua sendo real (print, número com origem).
- **IA não escreve texto na imagem.** Texto entra depois, na arte (render HTML).
- **Custo:** cada foto é uma chamada na chave Gemini DELE. O nível grátis tem limite por minuto e por dia:
  avisar antes ("12 fotos, gera em lotes de 4").

## Chave necessária

`GEMINI_API_KEY` no `.env` da raiz. Sem ela: guiar a criação em aistudio.google.com/apikey (um passo
por vez), gravar com `python SetupFera/setup_chaves.py` e testar com uma foto antes do lote.

## Fluxo

1. **Fotos de referência.** Pedir de 3 a 6 fotos dele: rosto de frente bem iluminado, um meio corpo,
   uma sorrindo. Sem óculos escuros, sem filtro, sem boné cobrindo o rosto. Salvar em
   `output/ensaio-ia/<data>/referencias/`. Escolher as 3 melhores para o `--ref`.
2. **Briefing curto (uma pergunta por vez):** onde ele trabalha (consultório, escritório, online, obra,
   cozinha), roupa que usa com cliente, 2 cores da marca (`perfil.json`), e o clima (sério, próximo, premium).
3. **Plano das 12 cenas:** mostrar a lista ANTES de gerar e pedir OK. Mistura que funciona:
   - 3 retratos (fundo limpo, para capa e foto de perfil), 4:5 e 1:1
   - 4 trabalhando (atendendo, explicando no quadro, no computador, gravando no celular), 4:5
   - 3 bastidor (café, chegando, olhando anotações), 9:16 para story
   - 2 horizontais com espaço vazio de um lado para texto, 16:9 (banner, YouTube, página)
4. **Gerar** cada cena, sempre com as mesmas referências:
   ```bash
   python ScriptsFera/imagem.py "Photorealistic photo of the same person from the reference images, <cena em inglês>, natural light, shot on 50mm, realistic skin texture, no text" --ref ref1.jpg --ref ref2.jpg --ref ref3.jpg --ratio 4:5 --out output/ensaio-ia/<data>/01-retrato.png
   ```
   Prompt em inglês, sempre "the same person from the reference images", sempre "no text".
5. **QA, foto por foto (abrir cada imagem):** o rosto é ele? mãos com 5 dedos? texto falso no fundo?
   rosto cortado na borda? Reprovou, gera de novo aquela cena (no máximo 2 tentativas, depois troca a cena).
6. **Galeria:** montar `output/ensaio-ia/<data>/index.html` com as fotos aprovadas lado a lado
   (render com `python ScriptsFera/render.py qa` não é preciso: é só abrir no navegador).
7. **Usar:** perguntar se já quer testar uma ideia nos formatos de carrossel com essas fotos:
   chamar `/galeria-de-artes` passando a pasta do ensaio como fonte de fotos.

## Entrega

1. Registrar em silêncio:
   `python ScriptsFera/metas-api.py entrega add "ensaio-ia" "Ensaio com <n> fotos" --link "output/ensaio-ia/<data>/"`
2. Caminho absoluto completo da pasta.
3. Lembrar: foto pronta que não vira post não existe. Data do primeiro post com elas, na mesma resposta.
