---
name: mix-estaticos
description: Transforma UMA ideia, oferta ou texto solto num mix de 10+ conceitos de posts/anúncios estáticos, variando ângulo de copy e direção de design (8 famílias), entregue em .md pra escolher antes de produzir arte. Triggers "mix de estáticos", "variações de post", "ângulos de copy/design". NÃO renderiza lote de teste (squad-anuncios-estaticos), não faz story nem carrossel.
---

# Mix Estáticos

## O que entrega
Um arquivo `.md` com um mix de conceitos de posts estáticos: cada conceito traz ângulo de copy, texto da
arte em camadas, direção visual, elementos obrigatórios, CTA e critério de aprovação. É a etapa de
**ideação**: o usuário escolhe os melhores e depois produz a arte.

**Pra quem é:** você, usuário do FERABOT, criando pro seu negócio (ou pra um cliente seu). Ler
`perfil.json` na raiz do FERABOT (nome, nicho, produto, preço, @, cores, landing) como contexto de marca.
Se for pra um cliente, pedir os dados dele.

Salvar em (caminho relativo à raiz do FERABOT):

```text
output/anuncios/mix-estaticos/AAAA-MM-DD-mix-<slug>.md
```

Se for de cliente: `output/anuncios/mix-estaticos/<cliente>/AAAA-MM-DD-mix-<slug>.md`.
No fim, mostrar o caminho absoluto da pasta.

**Próximo passo depois do mix:**
- Produzir os escolhidos como lote de teste (3 ângulos × 3 execuções, HTML→PNG) → `squad-anuncios-estaticos`.
- Kit completo com fotos reais (feed + story + reel + carrossel) → `anuncios-de-ouro`.
- Uma peça só: montar o HTML 1080×1350 e renderizar com
  `python ScriptsFera/render.py png <arquivo.html> --w 1080 --h 1350`.

## Antes de escrever
1. Ler `perfil.json` (marca, cores, oferta). Se faltar algo de marca, perguntar ou usar as cores do perfil.
2. Ler `references/padroes-copy-design.md` antes de criar o mix.
3. Aplicar em todo conceito o **checklist do lead preguiçoso, medroso e procrastinador** — cada peça
   precisa ter, explícito:
   - **anti-medo:** garantia, prova real, aviso honesto;
   - **anti-procrastinação:** por que agir agora (data, vaga ou custo real de esperar);
   - **anti-preguiça:** o que vem pronto, o pouco que a pessoa precisa fazer;
   - **anti-problema-futuro:** suporte, acompanhamento, "não fica sozinho depois".
4. **Prova e dado:** peça pública usa só prova real (print verdadeiro, número com fonte). Dado que não
   veio no briefing e que só o dono tem — preço, prazo, vagas, resultado, caso — entra como
   `[A PREENCHER: o que falta]` ou o conceito vira versão sem número. Nunca inventar.

## Input mínimo
Aceitar uma inserção inicial curta e inferir o resto quando o risco for baixo. Extrair:

- Oferta/produto/mecanismo vendável.
- Público nomeado.
- Resultado desejado.
- Prova disponível.
- CTA/destino.
- Restrições de marca, canal e formato.

Se faltar o mecanismo ou a oferta (e o `perfil.json` não resolver), fazer uma pergunta curta antes de
produzir. Sem isso a skill vira geradora de frases genéricas.

## Mix obrigatório
Gerar no mínimo 10 conceitos, cobrindo pelo menos 6 famílias:

1. **Não é X. É Y pronto.** Reposiciona categoria e remove esforço.
2. **Sistema pronto / método pronto / ferramenta pronta.** Vende unidade concreta, não ideia abstrata.
3. **Diagnóstico / escala operacional.** Para público que já vende e quer crescer sem inchar.
4. **Evento/aula/desafio com data.** Urgência honesta + promessa de implementação (só com data real).
5. **Cultura do nicho.** Visual que gera pertencimento pra quem é do meio (terminal/pixel pra tech,
   caderno de campo, quadro de obra, prontuário…) — parar o scroll por reconhecimento.
6. **Dor visual do operacional.** Mostra o caos antes da solução.
7. **Oferta direta.** Preço, garantia, acesso, entregáveis e CTA grande, somente quando esses dados forem reais.
8. **Curiosidade escondida.** Biblioteca, arquivo, recurso pouco usado, oportunidade ignorada.

Para cada conceito, entregar:

```markdown
### Conceito NN - <nome>
Formula: <PAS | AIDA | BAB | 4Ps | Segmentacao -> Qualificacao -> Oferta>
Angulo: <1 frase>
Design: <familia visual + composicao>
Texto da arte:
- Selo/topo:
- Headline:
- Subheadline:
- Prova/entregaveis:
- Ponte:
- CTA:
Elementos visuais:
Risco se errar:
Por que pode funcionar:
```

## Regras de copy
- Escrever em português brasileiro correto quando a peça for em PT-BR: acentos, cedilha e pontuação
  natural são obrigatórios. Nunca normalizar criativo para ASCII.
- Começar pela unidade concreta: método, sistema, ferramenta, arquivo, biblioteca, playbook, diagnóstico,
  sprint, treinamento, consulta, projeto.
- Headline deve ter contraste de categoria, promessa operacional ou curiosidade específica.
- Preferir verbos de baixa fricção: copiar, configurar, aplicar, montar, destravar, centralizar,
  automatizar, organizar.
- Mostrar o "sem": sem teoria, sem enrolação, sem contratar, sem depender de equipe, sem começar do zero.
- CTA deve ser comando conversacional e específico: "Quero o método", "Quero meu diagnóstico", "Comece
  hoje", "Quero escalar sem inchar".
- Evitar "saiba mais" como CTA principal, exceto em evento gratuito de topo de funil.
- Não vender "velocidade de resposta" ou "estou sempre disponível" como diferencial — vende tempo do
  dono, não resultado.
- **Política da Meta:** nunca afirmar atributo pessoal de quem vê ("você que está endividado", "você
  que tem ansiedade"). Nomear o público pela profissão/situação ou falar em 1ª pessoa. Nada de ganho
  ou cura garantidos.

## Regras de design
- Arte precisa sustentar o argumento sozinha: headline + subheadline + contexto/entregáveis + ponte + CTA.
- Toda peça precisa de um herói visual dominante além do texto: mockup, objeto 3D, celular, print, card
  empilhado, personagem, terminal, folha/anotação ou cena de caos operacional. Texto sozinho reprova.
  (Imagem por IA, quando fizer sentido: `python ScriptsFera/imagem.py "<prompt em inglês>" --ratio 4:5
  --out <pasta>/img.png`, com GEMINI_API_KEY no `.env`. O texto vai sempre em HTML por cima.)
- Negativo sim, vazio não: se há espaço livre, compensar com headline grande, objeto grande, mockup,
  print, pessoa, interface ou textura intencional.
- Usar uma hierarquia clara: selo pequeno, headline dominante, subheadline curta, prova/entregáveis em
  chips/cards, CTA visível.
- **Zona morta de texto: 250px no topo e 250px na base.** Em 9:16 é obrigatório; em feed vale como
  padrão — se precisar invadir a borda, só imagem/elemento gráfico invade, nunca texto.
- **Rosto nunca cortado nem coberto por texto** quando houver pessoa na arte.
- Misturar direções de design dentro do lote: não entregar 10 peças com o mesmo fundo e a mesma composição.
- Cada conceito deve indicar formato recomendado: 1080x1350, 1080x1080 ou 1080x1920 quando fizer sentido.

## Validação antes de entregar
Reprovar e corrigir se:

- Mais de 2 conceitos usam o mesmo ângulo com outras palavras.
- O tema aparece abstrato sem virar produto/mecanismo concreto.
- Falta CTA ou o CTA está genérico.
- Há número, preço, prazo, prova ou garantia inventada.
- O design depende de texto pequeno demais para entender no feed.
- O visual descrito fica vazio: sem objeto, print, mockup, pessoa, ícone, textura ou composição forte.
- O texto em PT-BR perdeu acentos ou cedilha por "segurança técnica".
- Algum conceito não passa no checklist anti-medo / anti-procrastinação / anti-preguiça / anti-problema-futuro.
- Alguma headline afirma atributo pessoal de quem vê.
