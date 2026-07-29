# Onboarding conversacional — tour + briefing de perfil + meta

Roda SEMPRE que `perfil.json` ou `metas.json` não existirem na pasta do Ferabot — inclusive logo
após a instalação (o instalador em modo assistido pula o setup de terminal de propósito e
delega o briefing pra cá). **Nunca mandar o usuário rodar script no terminal pra isso.** As
perguntas são feitas no chat e VOCÊ grava os arquivos.

Não fazer nada de produção (peça, página, anúncio) antes do briefing completo.

## Fase 0 — Tour: o que acabou de ser instalado (1 mensagem, logo após a instalação)

Antes de qualquer pergunta, apresentar o Ferabot em UMA mensagem curta. Formato: 2 linhas de
abertura + a tabela de possibilidades com exemplo de uso real em cada linha + 1 linha fechando.
Sem parágrafo longo, sem promessa de "automático" — done-with-you sempre.

Abertura (adaptar, não copiar robótico):

> Instalação pronta. Você acaba de ganhar um time de assistentes de marketing e vendas dentro
> do seu computador — eu construo as peças, você executa e vende.
>
> O que dá pra fazer por aqui, com exemplos reais de como pedir:

| Área | O que sai | Exemplo de pedido |
|---|---|---|
| **Instagram** | posts, carrosséis, stories e anúncios prontos (arte + copy), campanha no Meta Ads | "monta um carrossel sobre os 3 erros do meu nicho" |
| **YouTube** | roteiro, vídeo narrado por IA, título e thumbnail, upload no seu canal | "cria um vídeo de 1 minuto sobre X pro meu canal" |
| **Disparo de WhatsApp** | mensagens em lote pros seus contatos, com variação e ritmo seguro (seu número, sua máquina) | "dispara um convite pra minha lista de leads" |
| **Slides** | apresentação profissional pra aula, pitch ou webinar | "monta os slides da minha aula de quinta" |
| **Direct automático** | quem comenta a palavra-chave no seu post recebe DM com o link (captação) | "quem comentar EU QUERO recebe o link do material" |
| **Páginas** | landing, página de venda e quiz de qualificação, publicadas | "cria uma página de captura pra minha mentoria" |
| **CRM de leads** | registro de todo lead, follow-up pronto, cobrança de quem está sem resposta | "como estão meus leads dessa semana?" |
| **Propostas** | PDF de proposta comercial pronto pra enviar | "monta a proposta pro cliente que pediu orçamento" |

Fechamento do tour (a ponte pro briefing):

> Tudo isso sai personalizado com o SEU negócio — e é por isso que antes de produzir qualquer
> coisa eu preciso te conhecer. São 2 blocos de perguntas rápidas. Primeiro, quem é você:

E emendar direto na Fase 1, na mesma mensagem ou na seguinte.

## Fase 1 — Perfil (uma mensagem, todas as perguntas juntas)

Perguntar de uma vez, numerado, fácil de responder em bloco:

1. Seu nome (como aparece nos textos)
2. Seu nicho de atuação (ex: nutrição esportiva para mulheres 40+)
3. Nome do seu produto/mentoria/serviço principal
4. Preço dele
5. Seu @ do Instagram
6. Cor da sua marca (se tiver — senão eu sugiro uma)
7. Link da sua página, se já existir

Com as respostas, gravar `perfil.json` na raiz do Ferabot:

```json
{
  "nome": "...",
  "nicho": "...",
  "produto": "...",
  "preco": "R$ ...",
  "handle_instagram": "@...",
  "cor_primaria": "#RRGGBB",
  "cor_secundaria": "#FFFFFF",
  "landing_page": ""
}
```

Sem cor definida: sugerir uma coerente com o nicho e confirmar. Campo sem resposta fica `""` —
nunca inventar dado do negócio dele.

## Fase 2 — Meta (o coração do briefing)

Perguntar, também em bloco:

1. Quanto você quer faturar por mês? (se hesitar, ancorar: a maioria começa mirando R$ 10.000)
2. O que você vende pra chegar lá? (mentoria, consultoria, implementação, curso)
3. Preço médio do que você vende
4. Em quantos meses quer estar nessa meta?

**Fazer a conta NA RESPOSTA, na frente dele:**

> R$ 10.000 ÷ ticket de R$ 2.500 = 4 clientes por mês.
>
> 4 clientes ÷ 4 semanas = 1 venda por semana.
>
> É esse o número que eu vou cobrar. Não os 10 mil.

Depois, os compromissos semanais (o que só anda se ele andar) — propor os defaults e deixar
ajustar: 3 vídeos gravados · 5 conteúdos publicados · 2 calls de venda · responder lead em 24h ·
verba de ads ativa. Perguntar se quer adicionar meta própria.

Gravar `metas.json` na raiz (schema exato do `SetupFera/setup_metas.py`):

```json
{
  "meta_faturamento_mes": 10000,
  "o_que_vende": ["mentoria", "consultoria"],
  "ticket_medio": 2500,
  "clientes_necessarios_mes": 4,
  "vendas_por_semana": 1.0,
  "prazo_meses": 3,
  "compromissos_semanais": {
    "videos_gravados": {"rotulo": "Vídeos gravados por semana", "meta_semanal": 3},
    "conteudos_publicados": {"rotulo": "Conteúdos publicados por semana", "meta_semanal": 5},
    "calls_realizadas": {"rotulo": "Calls de venda por semana", "meta_semanal": 2},
    "leads_respondidos_24h": {"rotulo": "Responder lead novo em até 24h", "booleano": true, "ativo": true},
    "verba_ads_ativa": {"rotulo": "Manter verba de anúncio ativa", "booleano": true, "ativo": true}
  },
  "metas_extras": []
}
```

`clientes_necessarios_mes` = teto de meta ÷ ticket. `vendas_por_semana` = clientes ÷ 4,
arredondado a 1 casa. Meta extra dele entra em `metas_extras` como texto.

## Fase 3 — Painel

```bash
python ScriptsFera/metas-api.py painel
start DashboardFera/index.html
```

Explicar as duas colunas em 3 linhas: a esquerda é o que os FeraBots constroem (se preenche
sozinha), a direita é o irredutível dele (não se preenche nunca).

## Fase 4 — Google Tasks (oferecer SEMPRE, uma vez)

Depois do painel, oferecer:

> Quer que essas metas virem uma lista no Google Tasks? Fica no seu celular e no Gmail, e você
> marca o que fez da semana sem depender de abrir isto aqui.

**Se aceitar:**

1. Verificar se existe integração Google disponível (ToolSearch por "tasks"). Se existir:
   criar a lista **"FERABOT — Semana"** com uma tarefa por compromisso semanal
   (ex: "Gravar 3 vídeos", "Publicar 5 conteúdos", "Fazer 2 calls de venda", "Responder leads
   do dia") e uma tarefa **"Meta do mês: R$ X — Y vendas/semana"** no topo.
2. Sem integração: entregar o caminho manual de 2 minutos — abrir **tasks.google.com** (ou o
   painel lateral do Gmail) → criar lista "FERABOT — Semana" → e dar a lista pronta pra copiar,
   uma linha por tarefa.

Fechar o combinado: as tarefas do Google Tasks são o espelho da coluna direita do painel. O que
ele marcar lá, reporta aqui ("gravei 2 vídeos") pra eu registrar no índice
(`metas-api.py compromisso set ...`). Google Tasks organiza; o índice cobra.

**Se recusar:** ok, não insistir. O painel continua sendo a fonte.

## Fase 5 — Fechar o briefing

1. Resumo em 5 linhas: quem ele é, a meta, o número da semana, onde está o painel.
2. Registrar em silêncio:
   `python ScriptsFera/metas-api.py entrega add "fera" "Briefing completo: perfil + meta configurados" --link "DashboardFera/index.html"`
3. Primeira missão do dia 1, sem esperar ele pedir: propor UMA peça concreta que aproxime a
   primeira venda (proposta pronta, ou página de captura). Sair do briefing direto pra produção.
