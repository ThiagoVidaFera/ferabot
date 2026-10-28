# Template — Mensagem WhatsApp Final pro Cliente

> **Uso:** último artefato do squad ONBOARDING (após Step 18). O agente Danilo Drive (ou quem fechar o run) gera a mensagem final substituindo os placeholders `{{...}}`. Salvar em `<FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-mensagem-entrega.md`.
>
> **Versão:** v4.1 — 5 links (workshop low-ticket obrigatório como link de entrada). O link da Jornada é opcional.
>
> **Tom:** conversacional + mega didático. É você (o operador — mentor, consultor, agência) apresentando o pacote pro seu cliente. Se você está rodando o onboarding no próprio negócio, adapte pra 1ª pessoa como resumo pra você mesmo. Não é lista técnica. Explica O QUE é cada coisa e POR QUÊ — não só joga links.

---

## Variáveis a preencher

| Placeholder | Significado | Exemplo (hipotético) |
|---|---|---|
| `{{primeiro_nome}}` | Primeiro nome do cliente | [Nome] |
| `{{periodo_saudacao}}` | bom dia / boa tarde / boa noite | boa tarde |
| `{{amarra_marca}}` | 1 frase ligando inimigo + mecanismo + diferencial do dossiê | "o [Inimigo]™ como inimigo, o Método [SIGLA]™ como mecanismo, e [diferencial] como o seu grande diferencial" |
| `{{link_jornada}}` | *(opcional)* Área de membros/checklist da sua metodologia | [A PREENCHER: link da sua área de membros/checklist, se tiver] |
| `{{link_vendas}}` | Netlify página de vendas | https://{{slug}}-vendas.netlify.app |
| `{{link_workshop}}` | Netlify página do workshop | https://{{slug}}-workshop.netlify.app |
| `{{link_plano}}` | Netlify plano marketing | https://{{slug}}-plano.netlify.app |
| `{{link_drive}}` | Pasta Drive (automática ou upload manual) | https://drive.google.com/drive/folders/{{folder_id}} |
| `{{link_suporte}}` | *(opcional)* Seu grupo/canal de suporte | [A PREENCHER: link do seu grupo/canal de suporte] |
| `{{nome_workshop}}` | Nome do workshop/protocolo | "Protocolo [Nome]™" |
| `{{tema_workshop}}` | 1 frase do que o workshop entrega | "estruturar [resultado] com os 5 pilares" |
| `{{data_workshop}}` | Data por extenso (próximo sábado) | "sábado, 24 de maio, das 9h às 12h" |
| `{{big_idea_curta}}` | Big idea resumida entre aspas | "o problema não é falta de [X]" |
| `{{inimigo}}` | Nome do inimigo da marca | [Inimigo]™ |
| `{{mecanismo}}` | Nome do mecanismo + nº pilares | Método [SIGLA] (6 pilares) |
| `{{tema_carrossel_1/2/3}}` | Temas dos 3 carrosséis | "[Abordagem errada] vs [Abordagem certa]" etc |
| `{{titulo_livro}}` | Título do livro-funil | [Título do livro] |
| `{{palavras_livro}}` | Tamanho do livro | ~12.000 palavras (11 capítulos) |
| `{{titulo_roteiro_yt}}` | Título atraente do vídeo YouTube | "Por Que Você [comportamento] — e Como Parar" |
| `{{ig_handle_sugerido}}` | Handle sugerido | @[handle] |
| `{{dados_rascunho}}` | Resumo dos placeholders ainda no ar | WhatsApp, e-mail e registro profissional ainda em [A PREENCHER] |
| `{{nome_operador}}` | Quem assina a mensagem | [Seu nome] |

---

## TEMPLATE (copiar e preencher)

```
{{primeiro_nome}}, {{periodo_saudacao}} 🤍

Acabei de finalizar o pacote completo da sua mentoria — construído inteiro em cima do dossiê de marca que você me passou ({{amarra_marca}}).

Quero te explicar com calma o que você está recebendo, pra você não se perder e conseguir tirar o máximo de cada peça. São **5 links** — abre eles na ordem que eu te passar:

═══════════════════════
<!-- BLOCO OPCIONAL: só inclua se {{link_jornada}} existir. Sem ele, renumere os links (4 links) e ajuste o "São 5 links". -->
**1️⃣ A SUA JORNADA NA METODOLOGIA — comece por aqui**

👉 {{link_jornada}}

Esse é o **checklist e os tutoriais** da nossa metodologia. É a primeira coisa que você precisa abrir, antes de qualquer outra. Aqui está o **passo a passo** do que você vai fazer com tudo o que estou te entregando — quando configurar a bio, quando publicar o primeiro post, quando ativar o WhatsApp Business, quando rodar o tráfego pago, na ordem certa.

Trata essa página como o **mapa**. Os links abaixo são os ativos prontos. Esse aqui é o que diz o que fazer com eles.

═══════════════════════
**2️⃣ A SUA PÁGINA DE VENDAS**

👉 {{link_vendas}}

Essa é a página onde a pessoa interessada na mentoria vai chegar (vinda do Instagram, do YouTube ou de uma indicação). Foi escrita em tom de **autoridade tranquila** — nada de marketing gritante ou promessa milagrosa, porque o seu público repele isso na hora.

Como ela funciona:
• Abre com a Big Idea ({{big_idea_curta}})
• Nomeia o inimigo ({{inimigo}})
• Apresenta o mecanismo ({{mecanismo}})
• (Se aplicável) Posiciona como **Turma Fundadora** — isso justifica o ticket sem você ter alunos formados ainda e cria urgência genuína sem precisar mentir
• Termina com CTAs pro WhatsApp pra qualificação direta

Esse é o link que você vai colar na bio do Instagram e na descrição dos vídeos.

═══════════════════════
**3️⃣ A PÁGINA DO SEU WORKSHOP — {{nome_workshop}}**

👉 {{link_workshop}}

Essa é a página de captação do seu **workshop de entrada**: um intensivo ao vivo de 3 horas, **{{data_workshop}}**, por **R$ 37**. O tema é {{tema_workshop}} — bem específico, amarrado ao que te diferencia, não um "workshop genérico".

Pra que serve: é a **porta de entrada barata** do seu funil. A pessoa que ainda não confia em você o suficiente pra fechar a mentoria entra no workshop por R$37, vive uma amostra do seu método, e sai querendo o acompanhamento completo. Filtra curioso, gera compromisso e aquece o lead — sem você precisar vender no grito.

Esse link você usa em campanha, story e quando alguém pede "como começo com você?".

═══════════════════════
**4️⃣ O SEU PLANO DE MARKETING DIGITAL**

👉 {{link_plano}}

Esse é o seu **mapa estratégico dos próximos 90 dias**. Não é pra cliente — é pra você. Tem diagnóstico, 3 sugestões de bio, manifesto da marca, 10 frases-assinatura, 5 pilares de conteúdo, 5 Reels com roteiro completo, 3 carrosséis, 3 posts estáticos e 6 Tarefas Imediatas.

A parte mais importante pra você ler primeiro é a **Seção 13** (as 6 Tarefas Imediatas). Tudo está em ordem de prioridade. **Não tente fazer tudo no domingo à noite** — vai uma tarefa por semana e o canal cresce.

═══════════════════════
**5️⃣ A PASTA DRIVE COM TUDO PRONTO PRA USAR**

👉 {{link_drive}}

Essa pasta é o seu **arsenal pronto**. Você baixa o que precisa e sobe direto no Instagram, no YouTube ou compartilha com a pessoa interessada. Está organizada em **3 subpastas**:

📂 **Carrossel/** — 3 carrosséis × 8 slides (24 imagens). Cada carrossel é um post inteiro. Temas:
   1. "{{tema_carrossel_1}}"
   2. "{{tema_carrossel_2}}"
   3. "{{tema_carrossel_3}}"

📂 **Thumbnail/** — 3 thumbnails 1280×720 pra capa de vídeo do YouTube (3 ângulos).

📂 **Outros materiais/**
   • **Stories/** — 10 stories texto-only 9:16, cada um com uma dor específica do seu público. Posta 1 por dia, dura 2 semanas.
   • **Caixinhas de perguntas/** — 10 caixinhas "pergunta seguidor + resposta autoridade". Use nas terças/quintas pra interagir.
   • **Documentos PDF/** — 4 PDFs:
     ◦ **{{titulo_livro}} (Livro-Funil)** — livro digital de {{palavras_livro}}, sua **isca de captura**. A pessoa baixa, e o convite pra mentoria está no último capítulo. É a peça mais importante do funil
     ◦ **Proposta Comercial** — pitch personalizado pra quando alguém pedir os detalhes. Você manda esse PDF — é a peça que fecha venda
     ◦ **Sequência WhatsApp** — 9 mensagens prontas do quebra-gelo ao fechamento. Configura como Resposta Rápida no WhatsApp Business
     ◦ **"{{titulo_roteiro_yt}}"** — roteiro completo do seu primeiro vídeo do YouTube, em 20 slides numerados (5-9 min). Cada slide tem o que falar + bloco visual + tempo. Use como prompter. Sugeri esse título por ter alta taxa de clique, mas pode mudar.

═══════════════════════

**O que eu preciso de você pra finalizar:**

A página de vendas e a sequência WhatsApp estão com **dados-rascunho** que coloquei no lugar dos seus reais ({{dados_rascunho}}). Antes de a gente divulgar pra qualquer pessoa, me manda:

1. **WhatsApp comercial** com DDD (o número que vai receber as mensagens da qualificação)
2. **E-mail comercial**
3. **Registro profissional** (CRM/CRP/CREF/etc — número + estado, se aplicável ao nicho)
4. **Instagram handle** que você vai usar (sugeri {{ig_handle_sugerido}} — confirma se é esse)
5. **Linha de credenciais institucionais** pra seção "História" — os 4-6 itens mais fortes
6. **1 a 3 depoimentos curtos** de colegas ou ex-alunos (com nome e cidade) — prova social pré-mentoria, já que estamos posicionando como turma fundadora

═══════════════════════

**Próximo passo, na ordem:**

1. Abre o **link 1** (a jornada, se tiver) e dá uma passada de olho no roteiro do que vamos construir juntos
2. Lê a **página de vendas** (link 2) com calma
3. Olha a **página do workshop** (link 3) — é a sua oferta de entrada
4. Passa o olho no **plano de marketing** (link 4) — só pra ter o mapa na cabeça
5. Baixa o livro **{{titulo_livro}}** do Drive (link 5) e lê — primeira coisa que você precisa aprovar, o funil inteiro depende dele
6. Me manda os 6 dados do bloco acima
7. Quando tiver os dados, eu atualizo tudo de uma vez e a gente combina o dia da gravação do primeiro vídeo do YouTube (com o roteiro pronto, é uma manhã de gravação)

Se em qualquer parte do texto você sentir que o tom não te representa, ou que tem uma frase que você jamais diria, **me fala sem cerimônia** — esse pacote é seu, não meu, e o tom precisa ser o seu.

Lê com calma. Pode dormir em cima. Travou em qualquer coisa? Me chama: {{link_suporte}}

Abraço,
{{nome_operador}}
```

---

## Regras invioláveis

- **NUNCA** chamar o link da Jornada (1️⃣, opcional) de "página de vendas" — ele é o checklist/tutorial da sua metodologia. A página de vendas é o link Netlify (2️⃣).
- **NUNCA** mencionar custo de produção ou tokens pro cliente. Se você entrega o pacote como serviço, ele é o seu trabalho — decida você como (e se) comunica o uso de IA.
- Placeholders opcionais (`{{link_jornada}}`, `{{link_suporte}}`) sem valor → remover a frase/bloco inteiro, nunca deixar `{{...}}` na mensagem.
- **NUNCA** entregar só lista de links — cada link tem bloco próprio explicando o que é e por quê.
- **SEMPRE** links na ordem: Jornada (opcional) → Vendas → Workshop → Plano → Drive.
- **NUNCA** chamar a página do workshop (3️⃣) de "página de vendas" — a 2️⃣ é a venda da mentoria; a 3️⃣ é a oferta de entrada de R$37. São coisas diferentes.
- **SEMPRE** adaptar `{{amarra_marca}}`, big idea, inimigo, mecanismo ao dossiê real do cliente (vem do client-briefing.md).
- **SEMPRE** adaptar "registro profissional" ao nicho (CRM médico, CRP psicólogo, CREF educador físico, OAB advogado, ou omitir se não-regulamentado).
- Separadores `═══════════════════════` entre blocos (renderiza bem no WhatsApp).
- Entregar a mensagem em bloco de texto puro, pronta pra copiar/colar — sem markdown de código ao redor quando exibir pro operador.
