# Jornada — os 7 passos depois do painel

O dono recebe um **painel na internet** (link, e-mail e senha chegam por quem vendeu a consultoria).
O painel é a casa das chaves, dos leads e da Jornada. O FERABOT, no computador dele, é quem constrói
e avisa o painel de cada coisa que ficou pronta.

A Jornada tem 7 passos em **duas trilhas que andam juntas**:

| Trilha de conteúdo (a parte dele: gravar e aparecer) | Trilha técnica (o FERABOT conduz, ou a equipe monta) |
|---|---|
| 2. Narrativa e mecanismo | 1. FERABOT e chaves |
| 5. YouTube | 3. Página de captura |
| 6. Criativos e posts | 4. WhatsApp |
| | 7. Anúncios (fecha com o primeiro lead REAL, de anúncio ou do YouTube) |

Dentro de cada trilha, **nunca pular passo**. Entre as trilhas, as duas andam: servidor travado no
passo 4 não segura o vídeo do passo 5. Se a conversa travar numa trilha, oferecer o passo da vez da outra.
O painel entrega o plano já pronto no onboarding: quando o dono aprova a narrativa na tela Seu perfil,
o passo 2 fecha sozinho. Quem diz em que passo ele está é o painel, não a memória da conversa:

```bash
python ScriptsFera/painel.py estado
```

Rodar isso no começo de toda conversa em que o painel já está conectado (existe `painel.json` na raiz)
e abrir a resposta pelo passo da vez de cada trilha e pelo que falta neles.
Gravou ou publicou um vídeo do plano? Ele marca "Gravei" e "Publiquei" no roteiro, na tela Seu perfil:
o primeiro publicado fecha o vídeo do passo 5.

## Passo 1 — Ligar o FERABOT e as duas chaves grátis

O dono cola um prompt que o painel entrega pronto, neste formato:

> /fera conecta o meu FERABOT ao painel: https://nome.painel.exemplo.com código abc123...

1. Rodar `python ScriptsFera/painel.py conectar "<endereço>" "<código>"`.
   **Nunca repetir o código de volta no chat.**
2. Deu erro de código recusado: pedir para ele copiar o prompt de novo na tela Jornada do painel.
3. Conectou: mandar ele abrir a tela **Chaves** do painel e colar a do Gemini e a da Netlify. Cada
   cartão tem o "Como pegar" e o botão "Salvar e testar". As duas são grátis.
4. Quando ele disser que salvou: `python ScriptsFera/painel.py sincronizar` e depois `estado`.
   As chaves descem sozinhas para o `.env`. O dono cola uma vez só, no painel.

**Chave é sempre no painel.** Se ele colar uma chave no chat, não gravar no `.env`: pedir para colar
na tela Chaves, que testa na hora e guarda cifrada. Nunca repetir chave no chat.

As outras chaves (Meta Ads, Post for Me, YouTube) ficam para o passo em que forem necessárias.

## Passo 2 — Narrativa e mecanismo único

Aqui é mentoria, não formulário. Uma pergunta por vez, sempre confrontando resposta genérica.
Sair com isto aprovado por ele, por escrito:

- **Para quem** ele vende e qual é a dor que essa pessoa já sabe que tem.
- **Contracrença:** o que o mercado dele repete e que ele discorda, com o motivo.
- **Mecanismo único:** o jeito dele de resolver, com nome próprio e 3 a 5 etapas.
- **Bandeira:** a frase curta que resume a tese (cabe numa capa de carrossel).
- **Prova:** só o que é real e ele consegue mostrar. Sem prova, a frase sai.

Gravar em `output/fera/narrativa.md` e em `perfil.json` (campos `bandeira`, `mecanismo`, `contracrenca`).
Depois de ele aprovar:

```bash
python ScriptsFera/painel.py marco narrativa --resumo "Bandeira: <a frase>"
```

Depois, levar a narrativa para a tela **Seu perfil** do painel (é lá que ele relê a big idea, o
mecanismo e as headlines): gravar `output/fera/plano.json` com `bigIdea`, `mecanismo` (`nome`,
`explicacao`) e `headlines` (as 5 a 10 frases que ele mais vai repetir) e rodar
`python ScriptsFera/painel.py plano output/fera/plano.json`. Campo que não for no arquivo continua
como está no painel (o plano pode ter nascido no onboarding do Thiago).

Toda peça dos passos seguintes parte desse arquivo. Peça que não usa a bandeira nem o mecanismo
está errada.

## Passo 3 — Página de captura no ar

Disparar `/paginas-e-quiz` (ou `/funil-reuniao-fantasma`, se o destino for reunião). A página deste
passo tem um contrato fixo:

1. Formulário com **nome e WhatsApp** (e-mail opcional), mais um campo invisível `company`, que é a
   armadilha de robô.
2. Ao enviar, a página manda o lead para o painel **antes** de sair dali:

   ```js
   await fetch("<endereço do painel>/api/leads/entrada", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
       nome, whatsapp, email, company,
       funil: "captura-<slug>", origem: "pagina-captura",
       utm_source, utm_medium, utm_campaign, utm_content, utm_term,
     }),
   });
   ```

   O endereço do painel está em `painel.json` (campo `url`). O código de ligação **nunca** vai para a página.
3. Em seguida abre o WhatsApp do dono: `https://wa.me/<número com 55>?text=<mensagem pronta>`.
   Se o envio ao painel falhar, a página abre o WhatsApp do mesmo jeito. Lead não se perde por causa do painel.
4. Publicar com a chave da Netlify e conferir no celular (375px).
5. **Teste obrigatório:** preencher a página com o nome dele e conferir, com ele, que o lead apareceu
   na tela Leads do painel e que o WhatsApp abriu.

Depois do teste:

```bash
python ScriptsFera/painel.py marco pagina --link "<endereço da página>" --resumo "<título da página>"
```

Neste passo o lead ainda cai no WhatsApp normal do dono, pelo link `wa.me`.

## Passo 4 — WhatsApp ligado ao painel

O WhatsApp do dono passa a rodar numa **VPS dele** e fica ligado ao painel: a conversa aparece na Inbox
e os robôs do painel podem confirmar e lembrar a reunião.

Seguir `references/whatsapp.md`, **Fase 1 (QR code)**. A Fase 2 (API oficial da Meta) não entra aqui:
fica para quando ele for disparar para lista ou tiver volume diário.

O passo fecha sozinho quando o servidor está ligado e o QR foi lido. Conferir com
`python ScriptsFera/painel.py whatsapp-estado`. Não tem marco para registrar.

## Passo 5 — YouTube: canal arrumado e primeiro vídeo

O YouTube é peça-chave: o vídeo continua trazendo lead meses depois de publicado. Os roteiros ficam
na tela Seu perfil do painel (bloco Roteiros do YouTube).

1. **Canal:** disparar `/canal-youtube` (nome, descrição, banner, link para a página do passo 3).
   Arrumado: `python ScriptsFera/painel.py marco canal_youtube --link "<link do canal>"`
2. **Roteiros:** se a tela ainda não tem roteiro, disparar `/roteiros-e-oratoria` para escrever os
   3 primeiros a partir da narrativa e mandar para o painel com `painel.py plano` (campo
   `roteirosYoutube`: lista de `titulo`, `gancho`, `roteiro`). Mandar a lista inteira: ela substitui a anterior.
3. **Primeiro vídeo:** a gravação é dele. Cobrar a data. Publicado:
   `python ScriptsFera/painel.py marco video_youtube --link "<link do vídeo>"`

## Passo 6 — Criativos e postagens

Disparar `/conteudo-e-anuncios`. Dois lotes, cada um com a copy aprovada antes da arte:

- **Criativos da campanha**, apontando para a página do passo 3. Ao aprovar:
  `python ScriptsFera/painel.py marco criativos --resumo "<quantos e em que formato>"`
- **Postagens da semana** para o perfil. Só marcar quando estiverem publicadas ou agendadas:
  `python ScriptsFera/painel.py marco posts --resumo "<quantas e quando saem>"`

Sugestões de post que ele ainda não usou vão para a tela Seu perfil pelo `painel.py plano` (campo
`postsInstagram`: lista de `formato`, `titulo`, `texto`).

Para agendar sozinho ele precisa da chave do Post for Me na tela Chaves. Sem ela, ele publica à mão
e o marco vale do mesmo jeito.

## Passo 7 — Anúncios no ar

1. Mandar ele salvar na tela Chaves o token e a conta do Meta Ads. O painel testa os dois.
2. `python ScriptsFera/painel.py sincronizar` e disparar `/meta-ads-fera`, com o pré-voo de rastreamento.
3. A campanha nasce **pausada**. Ele confere no Gerenciador e é ele quem liga.
4. Campanha criada e conferida:
   `python ScriptsFera/painel.py marco campanha --link "<link da campanha>" --resumo "<orçamento por dia>"`

## Depois dos 7 passos

A Jornada fechou, a rotina começa: lead respondido no mesmo dia, criativo novo toda semana, número
da meta na frente. O próximo degrau é a Fase 2 do WhatsApp (API oficial, `references/whatsapp.md`),
quando ele quiser disparar para lista ou o volume diário pedir.

## Regras

- Marco só se registra depois de **ele aprovar e a coisa existir**. Marcar antes é mentir no painel dele.
- O registro do marco é silencioso. Não comentar o comando no chat.
- Painel fora do ar ou sem internet: seguir o trabalho e registrar o marco depois. Nunca travar a
  entrega por causa do painel.
- Sem `painel.json` na raiz: ele ainda não conectou. Pedir o prompt do passo 1, que está na tela
  inicial do painel.
