---
name: estilo-36-avatar-explica
description: "Estilo 'Avatar explica': caricatura ilustrada (de 1 foto ou genérica) fixa embaixo explica a fala com cartões de interface brancos que nascem acima da cabeça, papel claro com retícula. Reel orgânico/anúncio de topo, 15-45 s, em HyperFrames. Triggers: estilo 36, avatar explica, caricatura explica."
---

> **Origem e adaptação (FeraBot).**
> - Skill do pacote "Sistema de Criativos FERA" (créditos no LEIA-ME desta pasta). No FeraBot ela entra como **direção
>   criativa**: roteiro, cena, regras e checklists.
> - Onde citar `bin/motor-video.py`, `motor-de-video`, `remotion-marca`, `kit/` ou `acervo/`: esses caminhos não existem
>   aqui. Use o que você tem: `ScriptsFera/render.py`, `ScriptsFera/narrar.py` e FFmpeg, ou o motor de vídeo que preferir
>   (HyperFrames ou Remotion, se estiver instalado).
> - Cores, fontes e marcas dos exemplos (MCT, MLC/Lead Certo, FCA, ciano #00f0ff, Sora) são do autor original: aqui valem
>   as do seu `perfil.json`.
> - Prova e número: número sem origem fica fora da peça. Nunca inventar print, depoimento ou resultado. Selo SIMULAÇÃO
>   não libera peça pública.
> - Copy de venda passa pelo checklist A/B/C/D do roteador; mídia gerada por IA tem o custo dito antes de gastar crédito.
> - **Chave OpenAI:** `modelo/gerar_personagem.py` procura `.env` do pacote; no FeraBot a chave vive no `.env` da raiz (nunca no repositório). Exporte `OPENAI_API_KEY` na sessão antes de rodar, diga o custo (~US$ 0,40 a 0,60 para 12 imagens) e espere o "go" do dono. Retrato do dono em IA parte de foto real dele como referência.

# Estilo 36 · Avatar explica

Uma caricatura ilustrada (traço de figurinha: contorno grosso, cores chapadas, sombra em retícula) fica fixa na parte de baixo
da tela e "explica" a fala. Acima da cabeça nascem cartões de interface brancos (conversa, painel, prompt, contador) coerentes
com o que a voz diz. Fundo papel claro com retícula de pontos; no capítulo-chave o fundo inteiro vira a cor de destaque ou preto.

**O personagem é seu.** Duas opções, o aluno escolhe uma vez:
- **A) Sua caricatura** — a partir de 1 foto sua (rosto de frente, boa luz, sem óculos escuros). É a opção que mais gera
  reconhecimento: o público passa a associar o boneco a você.
- **B) Personagem genérico** — sem foto; você descreve (idade, cabelo, roupa) e a Fábrica cria um personagem da sua marca.

O pacote NÃO traz personagem pronto: o projeto-modelo usa um marcador cinza ("sua caricatura aqui") até você gerar o seu.

## Quando usar / não usar
- **Usar:** explicar um mecanismo em 15–45 s (meio de funil, público morno), Reels orgânico, anúncio de topo com um número de choque.
- **Não usar:** prova com print real do comprador (use o estilo 1), depoimento, oferta direta de fundo de funil.
- Roteiro: funciona muito bem em kishōtenketsu curto (skill `vsl-kishotenketsu`): 4 capítulos de 3–5 s.

## Antes de começar
1. `python3 bin/motor-video.py "estilo 36 avatar explica"` (skill `motor-de-video`): este estilo é **HyperFrames**.
2. Identidade: cores e fontes da seção `## Minha identidade` do `CLAUDE.md`. A paleta abaixo é só o padrão do modelo:
   troque `--claro` (fundo), `--destaque` e `--tinta` no topo do `index.html` pelas suas cores.
3. Personagem: se ainda não existe `acervo/meu-personagem/` com as 11 imagens, faça a seção **Gerar o personagem** primeiro.

## Gerar o personagem (uma vez só; depois reaproveita em todas as peças)
API paga (OpenAI, gpt-image): ~US$ 0,03–0,05 por imagem, 12 imagens ≈ **US$ 0,40–0,60** no total.

> Testado em 28/10/2026: o modelo que funcionou com fundo transparente foi o **gpt-image-1.5** (padrão do gerador). Peça a roupa do personagem em COR (blazer, camisa colorida): roupa branca sai semitransparente no fundo transparente.
**Mostre o custo e só rode com o aluno dizendo "pode".** O script tem teto (padrão US$ 1,50) e anota cada gasto em `GASTO.json`.
A chave vem do `.env` da Fábrica (`OPENAI_API_KEY`; se estiver vazia: `/fca-conectar openai`). Nada é impresso da chave.

1. Copie o modelo para a peça: `saidas/<nome-da-peca>/` ← `skills/estilo-36-avatar-explica/modelo/` (inteira).
2. Opção A (foto): o aluno arrasta a foto; salve como `saidas/<nome-da-peca>/minha-foto.jpg` e rode, de dentro da pasta da peça:
   `python3 gerar_personagem.py base --foto minha-foto.jpg` (sem `--pode` ele só mostra o que faria e o custo) →
   mostre `assets/personagem/base.png` ao aluno. Parecido e no traço certo? Siga. Não ficou? Ajuste com `--descricao "..."` (máx. 2 tentativas).
   Opção B (genérico): `python3 gerar_personagem.py generico --descricao "homem, 40 anos, careca, barba curta, camisa azul"`.
3. Opcional: se o aluno tiver uma imagem do TRAÇO que ele quer (um desenho próprio ou que ele tenha direito de usar — nunca o
   personagem de outro criador), passe `--ref-traco arquivo.png` no passo 2. Sem ela, o traço vem da descrição embutida no script.
4. `python3 gerar_personagem.py poses --pode` → 6 poses a partir do `base.png`; `python3 gerar_personagem.py bocas --pode` → as
   5 versões "falando" (a pose surpreso não tem). Confira as 11 imagens lado a lado: mesmo rosto, mesma roupa, mesmo contorno.
   Uma pose saiu diferente? Refaça só ela: `python3 gerar_personagem.py uma p3-aponta --pode`.
5. Guarde uma cópia em `acervo/meu-personagem/` (todas as `p*.png` + `base.png`). Na próxima peça, copie de lá; não gere de novo.

| arquivo (em `assets/personagem/`) | pose |
|---|---|
| `p1-apresenta.png` / `p1-apresenta-falando.png` | mão aberta apresentando |
| `p2-surpreso.png` | surpresa (só boca fechada/"o") |
| `p3-aponta.png` / `p3-aponta-falando.png` | aponta para cima, para o cartão |
| `p4-ombros.png` / `p4-ombros-falando.png` | dá de ombros, palmas para cima |
| `p5-pensa.png` / `p5-pensa-falando.png` | mão no queixo, pensando |
| `p6-cabeca.png` / `p6-cabeca-falando.png` | mão na cabeça, "não acredito" |
Todas em 1024×1536, fundo transparente, enquadradas da cintura para cima, cortadas embaixo, sombra em retícula embutida.

## Regras medidas (não negociar)
1. **Paleta padrão:** fundo claro `#f6f4f0` + retícula de pontos (6 px, 7,5 % preto); destaque ÚNICO `#ff4b1c`; texto `#121110`;
   cinza mono `#8a8784`. Capítulo-chave: fundo inteiro na cor de destaque (texto claro) ou `#121110` com brilho radial do destaque
   em retícula. Com a sua identidade: mantenha 1 fundo claro + 1 destaque + 1 tinta escura.
2. **Tipografia:** fala em sans condensada semibold ~70 px (modelo: Inter Tight 600); palavra-chave em serifada itálica ~82 px na cor
   de destaque (modelo: Instrument Serif Italic); números gigantes ~210–240 px bold na cor de destaque; faixa do topo em mono 25 px:
   `// 0N — capítulo` à esquerda e `CONTADOR N` em maiúsculas à direita (o N sobe e fica na cor de destaque).
3. **Personagem:** largura 980 px, topo em y≈960, cortado embaixo. Troca de pose a cada frase; a boca alterna a cada ~3 quadros
   durante a palavra; muda de lugar (centro/direita/esquerda) no corte de capítulo, com 1 quadro de "fantasma" a 38 %.
4. **Cartões:** brancos, canto 16 px, borda `#e4e0da`, **sombra em retícula** deslocada (14, 16). Interface realista coerente com a
   fala (conversa, painel, prompt escuro com botão na cor de destaque) — nunca cartão vazio. Carimbo tracejado batendo sobre o cartão.
5. **Fala vira título** no topo-esquerda (x 132, y 238): só o capítulo atual, palavra por palavra.
6. **Ritmo:** algo novo a cada ~1 s; capítulo de 3–5 s.
7. **Zona segura:** nada importante fora de y 285–1635 (área que o feed 4:5 mostra), exceto a faixa do topo.

## Transições (lidas a 30 fps — obrigatórias)
- Palavra: 4 quadros de desfoque 7 px → 0 com opacidade.
- Número: dígitos rolam como odômetro, com desfoque durante o giro.
- Cartão: nasce a 20 % perto do personagem, cresce em 6 quadros com passagem (back) e giro −6° → 0, eco claro nos 2 primeiros quadros.
- Saída de capítulo: tudo sobe 220 px em 5 quadros deixando 2 ecos (42 % e 21 %).
- Troca de capítulo: 1 quadro de véu a 50 % da cor nova e corte seco de cor.
- Carimbo: entra a 160 % e bate em 4 quadros.

## Som
Narração (a sua voz gravada ou a sua voz clonada) + trilha tensa a −17 dB + efeitos nos eventos visíveis: papel deslizando no
cartão, carimbo, clique no balão, whoosh na saída de capítulo, contador girando no número. Master −14 LUFS
(skill `catalogo-de-efeitos` e `acervo/sons/`). Sem preço falado na peça.

## Montar a peça no modelo (`saidas/<nome-da-peca>/index.html`)
Troque só estes blocos (o resto é o motor do estilo):
- `W` — palavras com tempo da narração `[texto, início, fim]` em segundos (tire da transcrição local:
  `python3 bin/transcrever.py <narração> --finalidade critico --palavras`, que grava `<narração>.words.json` com o tempo de cada palavra).
- `CAP` — capítulos: início, rótulo (`// 01 — ...`), faixa de palavras, palavras-chave, cores, x do personagem.
- `PS` — a pose da vez `[segundo, "p3-aponta"]`, uma troca por frase.
- Os cartões de cada capítulo (HTML dentro de `#palco`) e as chamadas `cartao(...)`/`carimbo(...)` em `frame(t)`.
- `data-duration` (duas vezes) e a duração da timeline no fim do arquivo.
A narração e a trilha entram em `assets/audio/` (mixe e normalize a −14 LUFS antes; veja `assets/audio/LEIA-ME.md`).
Conferir: `npx --yes hyperframes@0.8.192 check` · Render: `npx --yes hyperframes@0.8.192 render` (skill `hyperframes-cli`).

## Prompt de recriação
"Faça [destino] no ESTILO 36 · Avatar explica, 9:16 1080×1920, [duração], oferta: [oferta]. Copie skills/estilo-36-avatar-explica/modelo
para saidas/[nome] e use o meu personagem de acervo/meu-personagem/ (se não existir, gere seguindo a skill, mostrando o custo antes).
Troque só W, CAP, PS e os cartões por interfaces coerentes com a fala, com as cores da minha identidade. Siga as regras e transições
da skill estilo-36-avatar-explica. Quadro 0 com o gancho e o número. Amostra de 5–15 s antes do vídeo inteiro; um render por vez."

## Checklist antes de entregar
- [ ] Quadro 0 com o gancho (fala + número), nada vazio.
- [ ] Personagem é o do aluno (ou o genérico dele): nenhum personagem de outro criador, nenhum marcador cinza no render final.
- [ ] Todo cartão/tela preenchido com conteúdo coerente com a fala.
- [ ] Uma cor de destaque só; capítulo-chave com corte seco de cor.
- [ ] Tudo importante dentro de y 285–1635; −14 LUFS; sem preço falado.
