# Ferabot — Suas chaves de API (passo a passo)

Todas as chaves são **suas**: das suas contas Google, Netlify e Meta. Elas ficam no arquivo `.env`
na sua máquina e não saem dela.

**Nenhuma é obrigatória.** Sem a chave, o FeraBot entrega a peça pronta e ensina o caminho manual.
Com a chave, ele automatiza o último passo.

Pra preencher: `python SetupFera/setup_chaves.py` (pode rodar quantas vezes quiser).

## Qual chave desbloqueia o quê

| Chave | Desbloqueia | Custo |
|---|---|---|
| `GEMINI_API_KEY` | imagens com IA nos anúncios e conteúdos | grátis (free tier) |
| `NETLIFY_AUTH_TOKEN` | publicar páginas e quiz com um comando | grátis |
| `META_ACCESS_TOKEN` + `META_AD_ACCOUNT_ID` | subir campanhas no Gerenciador | grátis (paga só o anúncio) |
| `YT_CLIENT_ID` + `YT_CLIENT_SECRET` + `YT_REFRESH_TOKEN` | subir vídeos no seu canal | grátis |
| `IG_USER_ID` + `IG_ACCESS_TOKEN` | comentário → DM automático (captação de lead) | grátis |

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

## Onde as chaves ficam

No arquivo `.env` na raiz do Ferabot. Ele está no `.gitignore` — não sobe pra lugar nenhum.
Pra ver o estado de cada uma: `python SetupFera/setup_chaves.py`.
