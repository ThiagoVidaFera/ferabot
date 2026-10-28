---
id: step-10-publish-netlify
agent: netuno-netlify
execution: subagent
inputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/client-briefing.md
outputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-netlify-report.md
context_files:
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-sales-page.html
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-marketing-plan.html
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-workshop.html
---

# Step 10 — Publicar no Netlify

## Contexto

Netuno Netlify é executado como subagente após aprovação no checkpoint step-09. Ele usa o Netlify CLI para publicar **três sites separados** — página de vendas, plano de marketing e página do workshop low-ticket — em subdomínios dedicados, gerando URLs públicas para o cliente.

**3 sites Netlify (v4.1):**
- `{slug}-vendas.netlify.app` — página de vendas
- `{slug}-plano.netlify.app` — plano de marketing
- `{slug}-workshop.netlify.app` — página do workshop (R$37, próximo sábado 9h-12h)

Este step roda em paralelo com o step-11 (Google Drive).

## Dados de Referência

- `<FERABOT>/output/onboarding/{client-slug}-{data}/client-briefing.md` — para extrair nome e slug do cliente
- `<FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-sales-page.html` — arquivo a publicar
- `<FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-marketing-plan.html` — arquivo a publicar

## Instruções para Netuno Netlify

### Passo 1 — Verificar pré-requisitos
```bash
# Token vem do .env na raiz do FERABOT (BYOK)
FERABOT_DIR="<FERABOT>"   # raiz do FERABOT no PC do usuário
RUN_DIR="$FERABOT_DIR/output/onboarding/{client-slug}-{data}"
[ -z "$NETLIFY_AUTH_TOKEN" ] && NETLIFY_AUTH_TOKEN=$(grep -E '^NETLIFY_AUTH_TOKEN=' "$FERABOT_DIR/.env" | cut -d= -f2-)
if [ -z "$NETLIFY_AUTH_TOKEN" ]; then
  echo "NETLIFY_AUTH_TOKEN não encontrado no .env do FERABOT."
  echo "Fallback manual: abrir app.netlify.com/drop e arrastar cada pasta de deploy (vendas / plano / workshop)."
  exit 1
fi

# Verificar se netlify-cli está disponível
if ! command -v netlify &> /dev/null; then
  echo "netlify-cli não encontrado. Instalando via npm..."
  npm install -g netlify-cli
fi

netlify --version
```

### Passo 2 — Extrair slug do cliente do briefing
Ler o arquivo `client-briefing.md` e extrair o campo `Slug para URLs`. Exemplo de extração:
```bash
CLIENT_SLUG=$(grep "Slug para URLs" <FERABOT>/output/onboarding/{client-slug}-{data}/client-briefing.md | sed 's/.*: //')
echo "Slug do cliente: $CLIENT_SLUG"
```

Validar que o slug:
- Está em minúsculas
- Não contém espaços (substituir por hífens)
- Não contém caracteres especiais ou acentos
- Tem entre 3 e 30 caracteres

### Passo 3 — Criar diretório de deploy temporário
```bash
DEPLOY_DIR="${RUN_DIR}/netlify-${CLIENT_SLUG}"
mkdir -p "$DEPLOY_DIR"

# Copiar arquivos para o diretório de deploy
cp "${RUN_DIR}/${CLIENT_SLUG}-sales-page.html" "$DEPLOY_DIR/index.html"
cp "${RUN_DIR}/${CLIENT_SLUG}-marketing-plan.html" "$DEPLOY_DIR/plano.html"

# Criar página index simples se necessário
echo "Arquivos no diretório de deploy:"
ls -la "$DEPLOY_DIR"
```

### Passo 4 — Deploy dos 3 sites (vendas · plano · workshop)

Cada artefato vai pra um subdomínio próprio. Repetir o fluxo abaixo para os 3 (`vendas`, `plano`, `workshop`). No Windows/PowerShell, criar o site antes via `netlify sites:create --name {slug}-{tipo} --account-slug <seu-account-slug>` e deployar com `--site <PROJECT_ID>` (o working dir pode estar linkado a outro projeto — sempre passar o ID/site explícito).

```bash
# Exemplo (repetir para vendas / plano / workshop):
echo "Deploy: ${CLIENT_SLUG}-workshop..."
netlify deploy --prod \
  --dir "$DEPLOY_DIR_WORKSHOP" \
  --auth "$NETLIFY_AUTH_TOKEN" \
  --site "${CLIENT_SLUG}-workshop" 2>&1
```

Diretórios de deploy:
- `netlify-${CLIENT_SLUG}-vendas/index.html`  ← `{slug}-sales-page.html`
- `netlify-${CLIENT_SLUG}-plano/index.html`   ← `{slug}-marketing-plan.html`
- `netlify-${CLIENT_SLUG}-workshop/index.html` ← `{slug}-workshop.html`

Capturar as 3 URLs (`{slug}-vendas.netlify.app`, `{slug}-plano.netlify.app`, `{slug}-workshop.netlify.app`) e validar HTTP 200 em cada.

### Passo 5 — Salvar relatório de deploy
Gerar o arquivo de output com as URLs e status:

```markdown
# Relatório de Deploy Netlify — {Nome do Cliente}

**Data**: {data atual}
**Status**: {SUCESSO/FALHA}

## URLs Publicadas

- **Página de Vendas**: https://{slug}-vendas.netlify.app
- **Plano de Marketing**: https://{slug}-plano.netlify.app
- **Workshop (R$37 · sábado 9h-12h)**: https://{slug}-workshop.netlify.app

## Detalhes do Deploy

- Site ID: {client-slug}-vendas
- Diretório: {caminho do diretório de deploy}
- Arquivos publicados: {lista de arquivos}
- Timestamp: {timestamp do deploy}

## Log do Deploy

{output completo do netlify deploy}
```

### Passo 6 — Tratamento de erros
Se o deploy falhar:
1. Registrar o erro completo no relatório
2. Tentar criar o site primeiro se for o primeiro deploy: `netlify sites:create --name {client-slug}-vendas --auth $NETLIFY_AUTH_TOKEN`
3. Tentar o deploy novamente
4. Se falhar de novo, registrar todos os detalhes para diagnóstico manual

## Veto Conditions

- NUNCA tentar deploy sem verificar NETLIFY_AUTH_TOKEN (no `.env` do FERABOT)
- Sem token: NÃO travar o pipeline — gerar as 3 pastas de deploy (cada uma com `index.html`) e orientar o upload manual em app.netlify.com/drop (uma pasta por site), depois colar as URLs geradas no relatório
- NUNCA usar slug com caracteres inválidos para URL
- NUNCA sobrescrever o deploy de um cliente diferente
- SEMPRE registrar o resultado (sucesso ou falha) no outputFile
- SEMPRE limpar o diretório temporário após o deploy (sucesso ou falha)
