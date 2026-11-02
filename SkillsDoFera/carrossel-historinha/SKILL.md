---
name: carrossel-historinha
description: Carrossel de historinha com personagem FICTÍCIO declarado na capa, todos os slides em card de tweet preto e último slide com CTA por palavra-chave. Use em "carrossel de historinha", "história do fulano que...", "carrossel com personagem", "carrossel engraçado que vira venda". Motor JSON para PNG 1080x1440 com a cor e o @ do perfil.json.
---

# Carrossel Historinha

Fera, esse é o carrossel que conta a história de um personagem que comete o erro do seu cliente. O leitor ri do outro, se reconhece, e só no meio do caminho percebe que a história é sobre ele.

## Pré-requisito

Ler `perfil.json` da raiz do FeraBot (nome, nicho, produto, handle_instagram, cor_primaria, cor_secundaria, landing_page). O motor lê nome, @ e cores sozinho. Sem foto de perfil, desenha um círculo com a inicial da marca.

## Quando usar este formato e quando usar os outros

| Pedido | Skill |
|---|---|
| Erro comum do público contado como história, com humor | esta skill |
| Explicar um mecanismo com print real e diagrama | `carrossel-ilustrado` |
| Educativo ou storytelling sem personagem inventado | `squad-carrossel-fera` |
| Prova de resultado, depoimento, caso de aluno | NÃO é esta skill. Personagem fictício nunca leva resultado |

## Fluxo obrigatório

```
[01] Briefing > [02] Pauta e copy > [03] Aprovação > [04] Render > [05] QA > [06] Entrega
```

NUNCA renderizar antes de o fera aprovar a copy completa.

1. **Briefing.** Perguntar uma vez: qual erro ou crença do público o fera quer atacar, qual a palavra-chave do CTA e se o tom aceita caixa alta e gíria. Se o fera disser "pode escolher", propor 3 erros comuns do nicho do `perfil.json`.
2. **Copy** em `copy.md`, slide a slide, no molde abaixo. Mostrar tudo ao fera.
3. **Aprovação** explícita. Só então rodar o motor.
4. **Render, QA e entrega** nas seções abaixo.

## O molde (8 a 9 slides de história + 1 de CTA)

| Slide | Função | Como escrever |
|---|---|---|
| 1 | **Contradição na capa** | A pessoa tinha um objetivo e fez tudo menos o que leva até ele. Caixa alta na primeira frase, número específico, uma frase seca de fecho. O motor põe o selo "PERSONAGEM FICTÍCIO: NOME NÃO EXISTE" na capa |
| 2 | **Apresenta o personagem e o autoengano** | "Vamos chamar esse [papel] de [Nome]. Ele não existe, mas você conhece uns cinco." Mostrar o que ele sabe fazer bem e a frase de autoengano entre aspas. Interjeição do narrador ("LÁ VEM.") |
| 3 | **Linha do tempo** | Segunda, terça, quarta, quinta, sexta, cada dia com uma fala entre aspas. Fecho de riso ("KKKKKKKK") |
| 4 | **O absurdo em números** | Número específico e ridículo (63 títulos, 12 etapas). Nada de resultado. Fecho irônico em caixa alta |
| 5 | **Defende o personagem** | "[Nome] não é burro", "não é preguiçoso". O alvo é o comportamento, nunca a pessoa |
| 6 | **A verdade incômoda** | Uma frase de insight ("Equipamento dá uma sensação deliciosa de progresso") e a pergunta ao personagem em caixa alta |
| 7 | **Por que ele foge do que importa** | O confortável contra o que expõe. A parte que dá medo |
| 8 | **Regra prática** | Um passo pequeno e concreto, com o tempo ou o tamanho da tarefa |
| 9 | **Fecho** | O leitor chamado de "você" pela primeira vez, com a piada final. "NÃO, [NOME]. FAZ A COISA." |
| CTA | **Chamada** | Pergunta curta, palavra-chave em pílula, o que acontece depois do comentário, selo de uma linha |

## 6 recursos que fazem funcionar

1. **Ninguém é acusado.** O leitor vê o erro em outra pessoa, depois é chamado de "você".
2. **O narrador interrompe** ("LÁ VEM.", "MEU AMIGO.", "ADIVINHA QUEM LEVA A CULPA."). Soa como história contada numa mesa de bar.
3. **Número específico e ridículo** vale mais que adjetivo.
4. **Falas entre aspas** em que o leitor reconhece a própria voz.
5. **Uma imagem que resume o erro** ("Montou a vitrine antes de descobrir o que o cliente procura").
6. **Piada no fim** que acerta até quem concordou.

## Regras duras

- **Personagem fictício DECLARADO na capa** (o motor faz isso pelo `personagem.nome`) e de novo no slide 2 ("ele não existe").
- **Personagem nunca leva resultado, venda, faturamento ou número de cliente.** O motor reprova texto com R$, %, "faturou", "vendeu", "bateu a meta". Isso é prova inventada e não entra em peça pública.
- Não use o nome de ninguém real que o fera conheça, nem de cliente, aluno ou sócio. O alvo é o comportamento, nunca uma pessoa reconhecível.
- Se o fera quiser mostrar resultado real, isso vira outra peça, com print ou dado real e fonte. Nunca dentro da historinha.
- Dado que só o fera tem (preço, vagas, prazo) vira pergunta ao fera. Nunca é inventado.
- Palavrão e caixa alta: o fera decide o grau. Na dúvida, trocar o palavrão por uma frase seca.
- Voz do texto: PT-BR com acento, sem emoji, sem travessão, sem ponto e vírgula, nunca prometer "automático". O motor reprova emoji, travessão, ponto e vírgula e a palavra "automático".

## Motor (`engine/`)

Roda com o que o FeraBot já instala (Python e Playwright). Se faltar o Pillow, o motor instala sozinho na primeira vez.

```bash
python SkillsDoFera/carrossel-historinha/engine/build.py <pasta>/spec.json
```

Saída na pasta do spec: `png/01.png ... NN.png`, `_contato.jpg` (folha de contato) e `texto-puro.txt`.

Spec (ver `exemplos/exemplo-spec.json`, 9 slides + CTA, tudo fictício):

```json
{
 "kit": {"avatar": "foto.jpg"},
 "personagem": {"nome": "Rodrigo"},
 "slides": [["parágrafo 1", "parágrafo 2"], ["..."]],
 "cta": {"titulo": "Precisa de ajuda?", "palavra": "ROTEIRO", "texto": "Comenta a palavra ROTEIRO...", "selo": "VOCÊ GRAVA. A GENTE MONTA JUNTO."}
}
```

- `kit` é opcional e sobrescreve o que vem do `perfil.json` (nome, handle, avatar, accent_escuro, fonte).
- De 6 a 9 slides de história, mais o CTA. `\n` quebra linha dentro do parágrafo. O primeiro parágrafo do slide 1 sai em negrito maior.
- O motor usa a maior fonte (46 a 34) que cabe entre y=250 e y=1190. Se nem a menor couber, reprova e diz qual slide enxugar.
- Fontes do Google Fonts (precisa de internet no render).

## Checklist A/B/C/D (antes de entregar)

- **A. Anti-medo:** o slide 7 nomeia o medo real e o 8 mostra que o passo é pequeno.
- **B. Anti-procrastinação:** o slide 3 mostra o custo de empurrar para a semana que vem e o 9 dá o comando.
- **C. Anti-preguiça:** o CTA pede só um comentário com uma palavra.
- **D. Anti-problema-futuro:** o CTA diz o que acontece depois (a conversa no direct) e quem faz o quê, juntos.

QA no PNG: selo de personagem fictício visível na capa, nenhum número de resultado, texto dentro da zona morta, acentuação, o alvo é o comportamento.

## CTA com palavra-chave (comentário vira direct)

Uma palavra curta e específica da história (ex.: ROTEIRO). A pílula mostra a palavra, o texto diz "Comenta ROTEIRO aqui embaixo e eu te chamo no direct". A legenda repete a palavra e diz o que a pessoa recebe. Para o direct sair a cada comentário, o fera ativa a automação nativa do Meta Business Suite (comentário com palavra-chave dispara a mensagem), e a gente configura junto. Sem a automação, o fera responde à mão.

## Legenda

Abre com a declaração: "O [Nome] não existe. Mas o [erro dele], talvez você conheça." Depois 2 linhas com o passo prático e a chamada da palavra-chave. Sem emoji, sem hashtag em excesso (3 a 5 do nicho).

## Entrega

1. Pasta do dia: `output/conteudo-e-anuncios/<AAAA-MM-DD>-carrossel-historinha-<slug>/` com `copy.md`, `spec.json`, `png/`, `_contato.jpg`, `legenda.md` e `texto-puro.txt`.
2. Registro silencioso, sem comentar no chat:
   `python ScriptsFera/metas-api.py entrega add "carrossel-historinha" "<o que foi entregue>" --link "<pasta>"`
3. Dizer ao fera o caminho absoluto completo da pasta e como publicar: abrir o app do Instagram ou o Meta Business Suite, escolher os PNGs na ordem e colar a legenda. A publicação é dele.
