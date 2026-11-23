---
name: teste-geral
description: Teste geral do FERABOT. Entende o perfil do dono, pergunta só o que faltar e cria UM exemplo de cada formato que o FERABOT faz (slides, vídeo do YouTube, cada estilo de carrossel, cada estilo de reel, cada estilo de story, anúncio estático), salvando cada resultado numa pasta com o nome da skill que o gerou. Use quando o dono disser "teste geral", "/teste-geral", "quero ver todos os formatos", "mostra tudo o que você faz".
---

# Teste geral: um exemplo de cada formato, no caso dele

Objetivo: o dono ver, com o negócio DELE, como fica cada formato antes de escolher em quais investir.
Não é para publicar. É uma vitrine.

## Antes de começar (nesta ordem)

1. **Painel:** se existe `painel.json`, rodar `python ScriptsFera/painel.py puxar`. Isso traz redes, big idea,
   mecanismo, headlines, roteiros e posts do plano dele para `perfil.json` e `output/fera/plano.json`.
2. **Ler** `perfil.json`, `metas.json` (se houver) e `output/fera/plano.json`.
3. **Perguntar só o que faltar**, uma pergunta por vez: o @ do Instagram, 3 a 6 fotos reais dele (pasta),
   a cor da marca, o link para onde as peças levam (página ou WhatsApp). Sem foto real, os formatos que
   pedem rosto usam o estilo ilustrado ou ficam de fora, avisando por quê.
4. **Escolher UM tema** para tudo: o 1º post ou o 1º roteiro do plano. Mesmo tema em todos os formatos = ele
   compara o formato, não o assunto.
5. **Mostrar o plano e pedir o OK:** a lista abaixo, quais chaves cada um usa (Gemini para imagem; vídeo com
   voz e animação pode pedir chave paga) e o tempo aproximado. Formato que precisa de chave que ele não tem:
   faz a versão possível (roteiro + quadros estáticos) e anota o que falta. Nunca gastar crédito pago sem o OK.

## O que criar (uma peça por skill, cada uma na pasta `output/teste-geral/<nome-da-skill>/`)

| Grupo | Skill | O que sai |
|---|---|---|
| Carrossel | `squad-carrossel-fera` | carrossel clássico (capa + 4 slides, 1080x1440) |
| Carrossel | `carrossel-ilustrado` | card de tweet com prova visual em cada slide |
| Carrossel | `carrossel-historinha` | historinha com personagem fictício declarado |
| Carrossel | `carrossel-tela-viva` | card com tela animada (se faltar recurso de vídeo: só os quadros) |
| Carrossel | `galeria-de-artes` | a capa do mesmo tema em todos os formatos, com galeria HTML |
| Story | `squad-stories-fera` | sequência de 3 stories de bastidor com foto real |
| Story | `squad-caixinha-fera` | story de caixinha de perguntas |
| Story | `anuncio-nativo` | story com cara de post nativo do Instagram |
| Reel | `roteiros-e-oratoria` | roteiro de reel de 30 a 45 s com gancho de 3 s |
| Reel | `estilo-36-avatar-explica` | reel avatar explica (roteiro + quadros; vídeo se houver recurso) |
| Reel | `estilo-37-cartoon-grotesco` | reel cartoon de humor (roteiro + quadros; vídeo se houver recurso) |
| Reel | `eva-pov-produto` | roteiro POV do produto com a tela real dele |
| Anúncio | `anuncios-de-ouro` | kit: feed 1080x1350 + story + capa de reel |
| Anúncio | `mix-estaticos` | 3 conceitos de estático do mesmo tema |
| YouTube | `roteiros-e-oratoria` (em `output/teste-geral/youtube-roteiro/`) | roteiro de vídeo de intenção de 8 a 10 min |
| YouTube | `canal-youtube` | thumbnail 1280x720 e banner 2560x1440 do canal |
| Slides | `squad-slides-fera` | apresentação de 8 a 10 slides do mesmo tema |
| Slides | `webinar-pdf` | primeiras 8 páginas do webinar em PDF |

Regras que valem para todos (as mesmas do Guia de prompts do painel): texto aprovado antes da arte quando o
dono estiver acompanhando; 250px sem texto no topo e na base; caixa atrás do texto em foto clara; rosto nunca
coberto nem cortado; prova só real; nada de preço na arte.

Para não travar no meio: faça um grupo de cada vez (carrosséis, stories, reels, anúncios, YouTube, slides),
mostre o grupo pronto e siga. Se uma skill falhar, anote o erro em `output/teste-geral/<skill>/ERRO.txt` e
siga para a próxima.

## No fim

1. Gere `output/teste-geral/INDICE.html`: uma página com um bloco por skill (nome, para que serve, miniatura
   ou link do arquivo, o que faltou), na ordem da tabela.
2. Abra o índice no navegador para ele ver.
3. Pergunte quais 3 formatos ele quer usar primeiro e registre em silêncio:
   `python ScriptsFera/metas-api.py entrega add "teste-geral" "um exemplo de cada formato" --link "output/teste-geral/INDICE.html"`
   (com painel: `python ScriptsFera/painel.py entrega teste-geral "teste geral: um exemplo de cada formato"`).
4. Mostre o caminho absoluto completo da pasta `output/teste-geral/`.

Modelo: o teste geral é execução. Rode no **Sonnet**.
