---
name: carrossel-ilustrado
description: Carrossel de card de tweet com PROVA VISUAL em todo slide (print real de busca, desenho de quadro branco com elemento em aberto), headline em manchete e capa conversacional. Use em "carrossel ilustrado", "carrossel com prints e diagramas", "card de tweet com prova". Motor JSON para PNG 1080x1440 com a cor e o @ do perfil.json. Não é story, reel nem anúncio.
---

# Carrossel Ilustrado

Fera, esse é o carrossel que explica um raciocínio e mostra a prova em cada slide. Toda peça sai com card de tweet limpo, manchete técnica e uma prova visual por slide de miolo.

## Pré-requisito

Ler `perfil.json` da raiz do FeraBot (nome, nicho, produto, handle_instagram, cor_primaria, cor_secundaria, landing_page). O motor lê nome, @ e cores sozinho. Sem foto de perfil, ele desenha um círculo com a inicial da marca. Se o fera quiser a foto dele, ele manda o arquivo e entra em `kit.avatar` do spec.

## Quando usar este formato e quando usar os outros

| Pedido | Skill |
|---|---|
| Explicar um mecanismo com prova (print real, diagrama) | esta skill |
| História com personagem fictício e piada | `carrossel-historinha` |
| Carrossel de 10 slides educativo ou storytelling sem prova visual | `squad-carrossel-fera` |
| Story, caixinha, anúncio | `squad-stories-fera`, `squad-caixinha-fera`, `anuncios-de-ouro` |

## Fluxo obrigatório

```
[01] Briefing > [02] Pauta > [03] Copy aprovada > [04] Provas > [05] Render > [06] QA > [07] Entrega
```

NUNCA renderizar antes de o fera aprovar a copy slide a slide.

1. **Briefing.** Perguntar uma vez: tema, quem é o público, a pessoa gramatical (conta pessoal fala "eu", conta de empresa fala "a gente"), a palavra-chave do CTA e se a conta tem selo de verificado. Selo azul só se a conta for verificada de verdade, nunca por padrão.
2. **Pauta.** Propor 3 pautas, cada uma com 1 mecanismo e 1 prova que dá pra capturar. Escrever o slide 1 de cada (headline, subline, ponte). O fera escolhe.
3. **Copy.** Escrever tudo em `copy.md`, slide a slide, dizendo qual prova visual vai em cada um. Orçamento: capa 18 a 40 palavras, miolo 40 a 90, CTA 20 a 45. Mostrar ao fera e esperar o "aprovado".
4. **Provas.** Prints reais com `capturar_busca.py` e escolha dos desenhos.
5. **Render.** Montar o `spec.json` e rodar o motor.
6. **QA** pelo PNG, não pelo HTML (checklist abaixo).
7. **Entrega** (abaixo).

## O formato

- **Card de tweet:** avatar redondo, nome e @ no topo de todo slide, menos o de apresentação.
- **Headline em manchete**, Title Case, 8 a 14 palavras: termo do nicho, um fato ou número e uma pergunta que cutuca. Uma expressão sublinhada (`<u>`). Nunca frase de conversa na headline.
- **Subline** diz o que a pessoa leva ao ler. **Ponte** no rodapé do slide, com linha de dentro e comando físico: "Bora começar pela busca que ele faz quando a dor aparece, arrasta →". Subline que só justifica por que é urgente reprova.
- **Miolo:** slide numerado "1) Tema: Frase Manchete", 1 a 2 parágrafos curtos, negrito na frase que carrega o slide, 1 prova visual, mini-ponte. Fundo alterna claro e escuro. Slide de cor chapada para apresentação e CTA.
- **Apresentação** perto do meio (slide 4 a 6 de 8 a 10): uma frase de quem você é e, se o fera tiver, uma foto dele.
- **CTA** no penúltimo, **recibo** (tabela salvável) no último.
- 1080x1440, texto só entre y=250 e y=1190 (zona morta de 250px em cima e embaixo).

## Regra de prova visual

Todo slide de miolo carrega exatamente 1 prova visual (2 só se couber sem a fonte cair abaixo de 0,7).

| Tipo | O que é | Regras |
|---|---|---|
| `print` | print REAL de busca no YouTube feito no dia | só barra de busca e texto do resultado, sem miniatura nem rosto de terceiro. Legenda "Print real, busca no YouTube, data". Marcador na cor de destaque. Query inteira visível |
| `escada` `split` `caminhos` `cadeia` `cartaz` `boxes` | desenho de quadro branco à mão | sempre com 1 elemento em aberto (`?`, nó ou degrau tracejado). Uma só cor de destaque |

- **Print é prova real ou não existe.** Nunca fabricar tela, resultado, comentário, depoimento ou número. Se a busca real não sustenta o ponto, troque a pergunta por uma variação próxima. Nunca invente.
- Cenário hipotético só aparece se a própria peça disser que é hipotético, no corpo do texto.
- Número ou dado que só o fera tem (preço, vagas, resultado de aluno) vira pergunta ao fera. Nunca é inventado.
- Dado de terceiro com nome é público, mas nunca para criticar.
- A ordem dos resultados do YouTube muda a cada busca. Capturar por `match` (trecho do título) e conferir o PNG.

## Motor (`engine/`)

Roda com o que o FeraBot já instala (Python e Playwright). Se faltar o Pillow, o motor instala sozinho na primeira vez.

```bash
# prints reais (opcional). buscas.json = [{"id":"p3","query":"...","match":"trecho do título"}]
python SkillsDoFera/carrossel-ilustrado/engine/capturar_busca.py buscas.json <pasta>/assets

# render: gera png/NN.png, _contato.jpg e avisa se algo não coube
python SkillsDoFera/carrossel-ilustrado/engine/build.py <pasta>/spec.json
```

- `spec.json` = `{"kit": {...}, "slides": [...]}`. O `kit` é opcional: sobrescreve nome, handle, avatar, selo, accent, accent_escuro, cor_bg, cor_txt, fonte, data. O resto vem do `perfil.json`.
- Tipos de slide: `capa`, `corpo` (titulo, blocos, visuais, ponte), `apresentacao` (foto opcional), `cta` (pergunta, pill), `recibo`.
- Referência completa de campos: `exemplos/exemplo-spec.json` (8 slides, só desenhos, sem print, sem dado real).
- O auto-fit encolhe a fonte até caber e AVISA (`NAO CABE`, `encolheu a 0.7`). Aviso é para enxugar a copy, nunca para esconder texto.
- `cadeia`: o último nodo sempre vira `?`. `escada`: o último degrau é o tracejado.
- Foto no slide de apresentação: o quadro é largo (940x520). Use foto de rosto inteiro, de preferência 16:9, e confira no PNG de 1080.
- Fontes vêm do Google Fonts (precisa de internet no render).
- Nunca barra invertida dentro de f-string (Python 3.11).

## Voz do texto que o fera vê

PT-BR com acento, sem emoji, sem travessão, sem ponto e vírgula. Conversar com "a gente monta junto", "fazemos juntos". Nunca prometer "automático". O fera continua no comando de cada etapa.

## Checklist A/B/C/D (antes de entregar)

- **A. Anti-medo:** o slide diz o que o leitor não precisa saber, comprar ou fazer antes de começar.
- **B. Anti-procrastinação:** ponte com comando físico em cada slide e CTA com um único próximo passo.
- **C. Anti-preguiça:** o passo é pequeno e já vem mastigado (palavra no comentário, não formulário).
- **D. Anti-problema-futuro:** o CTA diz o que acontece depois do comentário (a conversa no direct).

QA no PNG: capa passa no teste dos 3 segundos, nada na zona morta, fonte acima de 0,7, print legível com o marcador dentro do quadro, rosto inteiro, acentuação, zero número sem fonte.

## CTA com palavra-chave (comentário vira direct)

Escolher UMA palavra curta e específica do tema (ex.: CAMINHO, ROTEIRO). No slide de CTA vai `pill` com a palavra e uma frase como "Comenta CAMINHO aqui embaixo e eu te chamo no direct". Na legenda, repetir a palavra e o que a pessoa recebe. Para o direct sair sozinho a cada comentário, o fera configura a automação nativa do Meta Business Suite (comentário com palavra-chave dispara a mensagem), com um passo a passo que a gente faz junto. Sem a automação, o fera responde os comentários à mão.

## Entrega

1. Pasta do dia: `output/conteudo-e-anuncios/<AAAA-MM-DD>-carrossel-ilustrado-<slug>/` com `copy.md`, `spec.json`, `assets/`, `png/`, `_contato.jpg`, `legenda.md` e `texto-puro.txt` (todos os textos dos slides em sequência, sem formatação, para copiar e colar).
2. Registro silencioso, sem comentar no chat:
   `python ScriptsFera/metas-api.py entrega add "carrossel-ilustrado" "<o que foi entregue>" --link "<pasta>"`
3. Dizer ao fera o caminho absoluto completo da pasta e como publicar: abrir o app do Instagram ou o Meta Business Suite, escolher os PNGs na ordem e colar a legenda. A publicação é dele.

## Armadilhas

- Headline em tom de conversa em vez de manchete: refazer.
- Zoom do navegador trunca a query do print: recortar a imagem, não dar zoom.
- Selo de verificado em conta não verificada é credibilidade inventada.
- Avatar local não carrega em `set_content`: o motor já embute em base64.
- Marca com logo branco: montar o avatar quadrado sobre o fundo escuro da marca.
- Cor primária muito escura some no slide preto: o motor clareia sozinho, conferir no PNG.
