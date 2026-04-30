# Ferabot — Como Obter suas Chaves de API

Cada etapa do Ferabot usa uma ferramenta diferente. Aqui está o guia completo para configurar cada uma.

**Você não precisa configurar todas de uma vez.** Configure só o que for usar agora.

---

## Qual API eu preciso para cada etapa?

| Etapa | Skill | API necessária |
|---|---|---|
| Gerar imagens com IA | Qualquer skill com imagem | Gemini (Google) |
| Landing pages com deploy | `/jack-fera` | Netlify |
| Anúncios Facebook/Instagram | `/meta-ads-fera` | Meta Ads |
| Automação de DMs | `/zernio-fera` | Zernio |
| Conteúdo avançado | Qualquer skill | OpenAI (opcional) |

---

## 1. Gemini (Google AI Studio)
**Usado para:** gerar imagens com IA nas skills de conteúdo

### Passo a passo:
1. Acesse **aistudio.google.com**
2. Faça login com sua conta Google
3. No menu lateral, clique em **"Get API key"**
4. Clique em **"Create API key"**
5. Selecione um projeto (ou crie um novo com o nome "Ferabot")
6. Copie a chave gerada — começa com `AIzaSy`

### Onde colocar:
No formulário de perfil, campo **"Chave API Gemini"**.
Ou no arquivo `.env`: `GEMINI_API_KEY=AIzaSy...`

### Custo:
Tier gratuito disponível (suficiente para começar). Planos pagos a partir de uso intenso.

---

## 2. Meta Ads (Facebook/Instagram Ads)
**Usado para:** criar e gerenciar campanhas de anúncios no `/meta-ads-fera`

### Passo a passo:
1. Acesse **business.facebook.com** e faça login
2. No menu superior, clique em **"Configurações"** (ícone de engrenagem)
3. No menu lateral, vá em **"Contas"** → **"Contas de anúncios"**
4. Copie o **ID da conta de anúncios** (formato: `act_XXXXXXXXX`) — esse é o `META_AD_ACCOUNT_ID`
5. Agora vá em **"Integrações"** → **"Meta Business"** → **"Tokens de acesso"**
6. Clique em **"Gerar token"**
7. Nas permissões, marque: `ads_management`, `ads_read`, `business_management`
8. Copie o token gerado — esse é o `META_ACCESS_TOKEN`

### Onde colocar:
No arquivo `.env` na pasta raiz do Ferabot:
```
META_ACCESS_TOKEN=EAAxxxx...
META_AD_ACCOUNT_ID=act_000000000000000
META_APP_ID=000000000000000
META_APP_SECRET=sua_secret_aqui
```

### Atenção:
O token de acesso expira. Se parar de funcionar, gere um novo seguindo os passos acima.

---

## 3. Netlify
**Usado para:** publicar landing pages online no `/jack-fera`

### Passo a passo:
1. Acesse **netlify.com** e crie uma conta gratuita (pode usar o login do GitHub ou email)
2. Após logar, clique no seu **ícone de perfil** no canto superior direito
3. Vá em **"User settings"**
4. No menu lateral, clique em **"Applications"**
5. Em **"Personal access tokens"**, clique em **"New access token"**
6. Dê um nome (ex: "Ferabot") e clique em **"Generate token"**
7. Copie o token imediatamente — ele não aparece mais depois

### Onde colocar:
No arquivo `.env`:
```
NETLIFY_TOKEN=seu_token_aqui
```

### Custo:
Plano gratuito suficiente para uso normal (100GB de banda/mês).

---

## 4. Zernio
**Usado para:** automação de DMs e comentários no Instagram (`/zernio-fera`)

### Passo a passo:
1. Acesse **zernio.com** e crie uma conta
2. Conecte sua conta do Instagram em **"Perfis"** → **"Adicionar perfil"**
3. Siga as instruções para autorizar o acesso (via Facebook)
4. Após conectar, vá em **"Configurações"** → **"API Keys"**
5. Clique em **"Gerar nova chave"** e copie — esse é o `ZERNIO_API_KEY`
6. Volte em **"Perfis"**, clique no seu perfil do Instagram
7. Copie o **ID do perfil** na URL ou nos detalhes — esse é o `ZERNIO_PROFILE_ID`

### Onde colocar:
No arquivo `.env`:
```
ZERNIO_API_KEY=sua_chave_aqui
ZERNIO_PROFILE_ID=id_do_perfil_aqui
```

### Atenção:
Para automação de comentários funcionar, o post precisa estar publicado (não agendado) e o perfil do Instagram precisa ser uma **conta profissional** (Criador de Conteúdo ou Empresa).

---

## 5. OpenAI (opcional)
**Usado para:** funcionalidades avançadas de geração de texto

### Passo a passo:
1. Acesse **platform.openai.com** e crie uma conta
2. No menu superior direito, clique no seu nome → **"API Keys"**
3. Clique em **"Create new secret key"**
4. Dê um nome (ex: "Ferabot") e copie a chave — começa com `sk-`

### Onde colocar:
No formulário de perfil, campo **"Chave API OpenAI"**.
Ou no arquivo `.env`: `OPENAI_API_KEY=sk-...`

### Custo:
Cobrado por uso (tokens). Modelo GPT-4o: ~R$ 0,10 por 1.000 palavras geradas.

---

## Como criar o arquivo `.env`

1. Abra a pasta do Ferabot no explorador de arquivos
2. Copie o arquivo `.env.example`
3. Renomeie a cópia para `.env` (sem o ".example")
4. Abra com o Bloco de Notas
5. Substitua os placeholders com suas chaves reais
6. Salve e feche

**Nunca compartilhe o arquivo `.env`.** Ele contém suas chaves de acesso.

---

## Dúvidas?

Abra o Claude Code no Ferabot e pergunte diretamente:
> "Como configuro a API do Zernio?"

O Claude vai te guiar passo a passo com base no seu sistema.
