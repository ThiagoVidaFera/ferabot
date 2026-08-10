# Ferabot — Suas chaves de API (passo a passo)

Todas as chaves são **suas**, das suas próprias contas. Elas ficam no arquivo `.env` na sua
máquina e não saem dela.

**Nenhuma é obrigatória.** Sem a chave, o FeraBot entrega a peça pronta e ensina o caminho manual.
Com a chave, ele automatiza o último passo.

Pra preencher: `python SetupFera/setup_chaves.py` (pergunta em blocos, pode rodar quantas vezes
quiser).

> **Comece pelas duas primeiras e pare.** Gemini e Netlify levam 8 minutos, são grátis, e já te
> dão arte pronta e página publicada. O resto desta página é pra depois — pegue cada uma **quando
> doer**, não antes. Ninguém precisa de 23 chaves no primeiro dia.

## Qual chave desbloqueia o quê

### As cinco do começo — todas grátis

| Chave | Desbloqueia | Custo |
|---|---|---|
| `GEMINI_API_KEY` | imagens com IA nos anúncios e conteúdos | grátis (free tier) |
| `NETLIFY_AUTH_TOKEN` | publicar páginas e quiz com um comando | grátis |
| `META_ACCESS_TOKEN` + `META_AD_ACCOUNT_ID` | subir campanhas no Gerenciador | grátis (paga só o anúncio) |
| `YT_CLIENT_ID` + `YT_CLIENT_SECRET` + `YT_REFRESH_TOKEN` | subir vídeos no seu canal | grátis |
| `IG_USER_ID` + `IG_ACCESS_TOKEN` | comentário → DM automático (captação de lead) | grátis |

### As opcionais — só quando bater o limite

| Chave | Desbloqueia | Custo |
|---|---|---|
| `POSTFORME_API_KEY` | publicar feed, carrossel, story e TikTok | pago barato |
| `GATHOS_API_KEY` + `GATHOS_TTS_API_KEY` + `GATHOS_VIDEO_API_KEY` | imagem, voz e vídeo **ilimitados** | US$45/mês |
| `ELEVENLABS_API_KEY` | voz premium em português | free tier |
| `FAL_KEY` | modelos de imagem e vídeo que o Gemini não tem | por uso |
| `WAHA_BASE_URL` + `WAHA_API_KEY` | WhatsApp multi-conta ⚠️ exige servidor próprio | ~R$30/mês de VPS |
| `RESEND_API_KEY` | e-mail e relatório automático | free tier |
| `APIDIRECT_API_KEY` | dados reais de perfil em qualquer rede social | pago |
| `SCRAPECREATORS_API_KEY` | ver o anúncio que o concorrente está rodando | crédito por busca |
| `NICHEFINDER_API_KEY` | achar nicho de YouTube por dado | pago |
| `APIFY_TOKEN` | puxar dados do Instagram (perfil, posts, comentários) | free tier |
| `CLOUDFLARE_ANALYTICS_TOKEN` | visitas na sua página, sem cookie | grátis |
| `CAKTO_CLIENT_ID` + `CAKTO_CLIENT_SECRET` | criar produto e gerar link de checkout (PIX, cartão, boleto) | grátis (paga só a taxa da venda) |

---

# Parte 1 — As cinco do começo

---

## 1. Gemini (imagens com IA) — 3 minutos

1. Acesse **aistudio.google.com** e faça login com sua conta Google.
2. Clique em **Get API key** → **Create API key**.
3. Copie a chave (começa com `AIzaSy`).

Free tier tem limite por minuto/dia. Se aparecer erro de limite, é esperar alguns minutos ou
ativar billing no próprio AI Studio.

---

## 2. Netlify (publicar páginas) — 5 minutos

1. Crie conta grátis em **app.netlify.com** (pode entrar com Google ou GitHub).
2. **User settings → Applications → Personal access tokens → New access token.**
3. Dê um nome ("ferabot") e copie o token.

Sem token também funciona: dá pra publicar arrastando a pasta da página em
**app.netlify.com/drop**. O token só automatiza isso.

---

## 3. Meta Ads (subir campanhas) — 15 minutos

Você precisa já ter uma **conta de anúncios** no Gerenciador (business.facebook.com).

1. Acesse **developers.facebook.com** → **My Apps** → **Create App** (tipo Business).
2. No app, adicione o produto **Marketing API**.
3. Em **Ferramentas → Graph API Explorer**, gere um token com as permissões `ads_management`
   e `ads_read`. Depois troque por um token de longa duração em
   **Ferramentas → Access Token Debugger → Extend Access Token**.
4. O ID da conta de anúncio está no Gerenciador de Anúncios, no seletor de contas — use no
   formato `act_XXXXXXXXX`.

Importante: toda campanha criada pelo Ferabot **nasce pausada**. Você revisa no Gerenciador e
ativa quando quiser. O Ferabot nunca liga verba sozinho.

---

## 4. YouTube (subir vídeos no seu canal) — 20 minutos, uma vez só

1. Acesse **console.cloud.google.com** → crie um projeto ("ferabot").
2. **APIs e serviços → Biblioteca** → ative **YouTube Data API v3**.
3. **APIs e serviços → Tela de consentimento OAuth** → tipo Externo → preencha o mínimo →
   em **Test users**, adicione o seu próprio e-mail.
4. **APIs e serviços → Credenciais → Criar credenciais → ID do cliente OAuth** → tipo
   **App para computador**. Copie o **Client ID** e o **Client Secret**.
5. Gere o Refresh Token — abra no navegador (troque SEU_CLIENT_ID):

   ```
   https://accounts.google.com/o/oauth2/auth?client_id=SEU_CLIENT_ID&redirect_uri=http://localhost:8080&response_type=code&scope=https://www.googleapis.com/auth/youtube.upload&access_type=offline&prompt=consent
   ```

   Faça login com a conta do canal, autorize, e copie o `code=...` da URL de retorno.
   Depois peça no Claude Code: *"troca esse code por um refresh token do YouTube"* — o Ferabot
   faz a chamada e te devolve o token (começa com `1//`).

Vídeos sobem como **não listado** por padrão: você revisa no YouTube Studio e publica.

---

## 5. Instagram comentário → DM (captação) — 20 minutos

Pré-requisito: Instagram **profissional** conectado a uma **Página do Facebook**.

1. No mesmo app do passo 3 (developers.facebook.com), adicione o produto **Messenger** →
   **Instagram settings** e conecte sua conta.
2. Gere um token com as permissões `instagram_basic`, `instagram_manage_messages` e
   `instagram_manage_comments`.
3. O `IG_USER_ID` é o ID numérico da sua conta profissional (o Ferabot descobre pra você:
   peça *"descobre meu IG user id"* com o token já no `.env`).

Uso: quem comenta a palavra-chave no seu post recebe **uma** DM com o link. Isso é captação —
quem conversa com o lead depois é **você**.

---

---

# Parte 2 — As opcionais (só quando fizer falta)

As cinco de cima resolvem 80% do dia. As de baixo entram quando você bater num limite específico.
**Não configure tudo de uma vez.** Configure quando doer.

---

## 6. Post for Me (publicar sem abrir o app) — 5 minutos

**Dói quando:** você produz 10 peças por semana e perde 20 minutos por dia postando na mão.

1. Crie conta em **postforme.dev**.
2. Painel → **API keys** → copie.
3. Conecte suas contas (Instagram, TikTok).

Publica feed, carrossel, story e TikTok num comando só.

**Três armadilhas que já derrubaram entrega:**
- O status `connected` **não prova** que a conexão com a Meta está viva. Testar antes de agendar.
- Token morto fica **45 minutos** dizendo "processando" antes de avisar que falhou.
- Conecte pelo **Instagram nativo**, não pelo Facebook — conexão via Facebook cai muito mais.

---

## 7. Gathos (imagem, voz e vídeo ilimitados) — 5 minutos

**Dói quando:** o free tier do Gemini trava no meio de um lote, ou você quer clipes de vídeo.

1. Assine em **gathos.com** — plano **Creator, US$ 45/mês**.
2. Painel → **API keys**.
3. São **três chaves diferentes**, uma por capacidade — copie as três:
   `img_live_…` (imagem) · `tts_live_…` (voz) · `vid_live_…` (vídeo).

No plano Creator os três são **ilimitados**: depois de assinar, gerar mais uma imagem custa zero.
É o motor padrão de quem produz em volume.

Sem ele o Ferabot continua fazendo vídeo — com voz grátis (Edge TTS) e FFmpeg. O Gathos é o
upgrade de quem já produz toda semana, não o ponto de partida.

---

## 8. ElevenLabs (voz premium) — 3 minutos

**Dói quando:** a narração grátis soa robótica no seu nicho.

1. Crie conta em **elevenlabs.io**.
2. **Profile → API Keys → Create.**

⚠️ **A armadilha que pega todo mundo:** o código hexadecimal que aparece na coluna KEY do painel
é o **ID da chave**, não a chave. A chave real começa com **`sk_`** e só aparece **uma vez**, no
pop-up de *Create*. Se você fechou sem copiar, use *Rotate* pra gerar de novo.

---

## 9. fal.ai (modelos que o Gemini não tem) — 3 minutos

**Dói quando:** você precisa de um estilo de imagem ou vídeo específico.

1. Crie conta em **fal.ai**.
2. **Dashboard → Keys → Add key.**

Pago por uso, sem mensalidade.

---

## 10. WAHA (WhatsApp em escala) — avançado, 1 hora

**Dói quando:** o disparo local não dá conta — você quer vários números e envio contínuo.

⚠️ **Isto exige um servidor seu** (VPS de ~R$30/mês). Se você tem um número só e uma lista
pequena, **não faça isto** — o disparo local que já vem no Ferabot resolve.

1. Contrate uma VPS (Hostinger, Contabo, DigitalOcean).
2. Suba o WAHA por Docker: `docker run -p 3000:3000 devlikeapro/waha:noweb`
3. Documentação completa: **waha.devlike.pro**

**Aqui a chave funciona ao contrário de todas as outras: você não gera, você inventa.**
Não existe painel do WAHA. O software roda no seu servidor e a chave é uma senha que você
escolhe e coloca na variável `WHATSAPP_API_KEY` do container. É um cadeado que você comprou e
você mesmo trancou. Coloque a mesma senha no `.env` do Ferabot.

**REGRA DURA anti-ban** — o limite não é técnico, é o WhatsApp:
comece em **12 mensagens/dia**, suba **2 por dia**, teto em **45**, mínimo **2 minutos** entre
uma e outra. Um número comercial oficial já foi restringido por 24h com **49 envios num dia**.
Só suba o teto depois de **semanas** estáveis. E "enviado" no painel **não** é "entregue".

---

## 11. Resend (e-mail) — 5 minutos

**Dói quando:** você quer receber o resumo do dia por e-mail, ou disparar pra lista.

1. Crie conta em **resend.com**.
2. **API Keys → Create API Key** (começa com `re_`).
3. Verifique seu domínio em **Domains** pra enviar como `voce@seudominio.com`.

Free tier: 3.000 e-mails/mês.

---

## 12. apidirect (dados de rede social) — 3 minutos

**Dói quando:** você quer saber o número real de um perfil em vez de chutar.

Puxa perfil, posts e métricas de Instagram, TikTok, YouTube, LinkedIn, Reddit, X e Facebook.
Crie conta no painel do apidirect e copie a chave.

Uso típico: o lead digita o @ dele no seu quiz e a página confirma quem é, com dado real.

---

## 13. ScrapeCreators (espionar anúncio de concorrente) — 3 minutos

**Dói quando:** você não sabe o que está funcionando no seu nicho e fica adivinhando.

1. Crie conta em **scrapecreators.com**.
2. Copie a API key do painel.

Lê a Biblioteca de Anúncios pública da Meta e mostra o que o concorrente roda **hoje** — e há
quanto tempo. Anúncio que roda há meses é anúncio validado; é essa a informação que vale.

**Consome crédito por busca** (~1 por página de ~10 anúncios; busca por palavra-chave gasta
mais). O Ferabot avisa antes de uma busca grande.

**Isto é leitura de mercado, nunca cópia.** Serve pra entender o ângulo, não pra clonar a peça.

---

## 14. NicheFinder (nicho de YouTube por dado) — 3 minutos

**Dói quando:** você vai começar um canal e está escolhendo tema no achismo.

Base de 65 mil canais com quanto cada um fatura, se é faceless e o quanto performa acima da
própria média. Crie conta em **myagentsbuddy.com** e copie a chave (começa com `nf_`).

---

## 15. Apify (puxar dados do Instagram) — 5 minutos

**Dói quando:** você precisa dos dados de um perfil do Instagram — o seu, o de um concorrente ou
o de um lead — e está copiando número na mão.

1. Crie conta em **console.apify.com**.
2. **Settings → Integrations → API token** (começa com `apify_api_`).

O robô é o **`apify/instagram-scraper`**, que já vem pronto na plataforma. Puxa:

| O que | Serve pra |
|---|---|
| Perfil (seguidores, bio, link, verificado) | qualificar lead que chega pelo Instagram — audiência **medida**, não declarada |
| Posts (legenda, curtidas, comentários, data) | ver o que engaja de verdade no seu nicho |
| Comentários de um post | achar quem já interage e virar lista de abordagem |
| Hashtag e localização | mapear quem produz no seu tema |

Uso mais direto no dia a dia: o lead digita o **@** dele no seu quiz ou na conversa, e a página
confirma quem é com dado real em vez de aceitar o que ele diz.

**Free tier mensal** resolve uso ocasional. Serve também pra raspar qualquer outro site — o
catálogo de robôs prontos é grande — mas o Instagram é o que você vai usar toda semana.

---

## 16. Cloudflare Web Analytics (visitas na sua página) — 5 minutos

**Dói quando:** você publicou a página e não sabe se alguém entrou.

1. Crie conta grátis em **dash.cloudflare.com**.
2. **Analytics & Logs → Web Analytics → Add a site.**

Grátis, sem cookie e sem banner de consentimento.

---

## 17. Cakto (receber pagamento) — 10 minutos

**Dói quando:** você tem o produto pronto e não tem onde cobrar.

**A recomendação é Cakto.** É o checkout que eu uso e o que o Ferabot cria por comando. PIX,
cartão e boleto, em real, com valor mínimo de R$5 — funciona tanto pra um produto de R$27 quanto
pra uma mentoria.

1. Crie conta em **app.cakto.com.br**.
2. Complete o cadastro de recebimento (dados bancários e documento).
3. No painel, vá em **API** e gere as credenciais: **Client ID** e **Client Secret**.

Com as duas no `.env`, você pede *"cria o checkout do meu produto de R$97"* e recebe o link
`pay.cakto.com.br/xxxxx` pronto pra colar na página e no anúncio.

### Três coisas que economizam uma tarde

**A imagem do checkout não entra por comando.** Eu crio o produto, o preço e o link por API — mas
a imagem só renderiza pelo **Checkout Builder do painel** (Produto → aba Checkout → Personalizar).
Eu monto o banner pra você; colar leva 2 minutos.

**O Builder tem layout de desktop e de celular separados.** Colou no desktop e achou que acabou?
No celular continua sem imagem — e é de onde vem quase toda a sua venda. No modo mobile tem o
botão **"Copiar Do Desktop"**, que resolve num clique.

**Antes de rodar tráfego, faça uma compra-teste no PIX.** É a única forma de confirmar que o
e-mail de entrega chega no comprador. Checkout no ar não prova entrega funcionando.

### O padrão de banner que converte melhor

Uma imagem tipo **"O QUE VOCÊ RECEBE HOJE"**, acima do formulário: uma linha de hero + print do
produto + 3 ou 4 benefícios em cards + selos (Vitalício · Acesso imediato · Garantia de 7 dias).
Explicar antes de pedir o cartão gera desejo — formulário seco só coleta desistência.

**Já usa outra plataforma?** Kiwify, Hotmart, Guru, PerfectPay funcionam igual: o link entra na
página como link e nada quebra. Você só não ganha o "cria o checkout por comando".

**Uma regra que vale de graça:** a régua de decisão de campanha é o **painel do checkout**, nunca
o Gerenciador de Anúncios. O Gerenciador conta o que ele quer contar.

---

---

# Parte 3 — O que já funciona sem chave nenhuma

Instalado junto com o Ferabot, custo zero, sem conta:

| Ferramenta | O que faz |
|---|---|
| **Playwright** | transforma HTML em imagem — é o motor de todo carrossel, story e slide |
| **FFmpeg** | corta, junta, queima legenda e converte vídeo |
| **Edge TTS** | narração em português, grátis e ilimitada |
| **yt-dlp** | baixa vídeo e transcrição do YouTube, TikTok, Instagram |
| **Hyperframes** | animação (HTML + GSAP → MP4), sem After Effects |
| **Remotion** | vídeo programático em React, pra peça repetível |
| **Marp** | slides a partir de texto |
| **Jina Reader** | lê qualquer página como texto limpo (`r.jina.ai/<url>`) |

Não peça chave pra nada disso. Só peça o trabalho.

---

## Onde as chaves ficam

No arquivo `.env` na raiz do Ferabot. Ele está no `.gitignore` — não sobe pra lugar nenhum.
Pra ver o estado de cada uma: `python SetupFera/setup_chaves.py`.

O setup pergunta em **blocos**: o básico sempre, e os outros só se você disser que quer. Pode
rodar quantas vezes quiser — ENTER pula e mantém o que já está lá.

## Por que isto tudo é a camada "Recursos"

Um agente tem quatro camadas: **Fontes** (o que ele lê) · **Especializações** (o que ele faz e o
que não faz) · **Recursos** (o acesso) · **Automações** (o que roda sem você pedir).

Cada chave desta página é a terceira camada. É a diferença entre um agente que **te dá conselho**
e um que **faz**. Sem chave, o Ferabot te entrega o post pronto e você publica. Com chave, ele
publica.

Por isso nenhuma é obrigatória — e por isso vale a pena ir pegando uma por vez.
