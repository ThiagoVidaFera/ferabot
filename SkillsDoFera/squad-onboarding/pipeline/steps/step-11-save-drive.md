---
id: step-11-save-drive
agent: danilo-drive
execution: subagent
inputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/client-briefing.md
outputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-drive-report.md
context_files:
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-netlify-report.md
---

# Step 11 — Salvar Tudo no Google Drive

## Contexto

Danilo Drive é executado como subagente após aprovação no checkpoint step-09, em paralelo com o step-10 (Netlify). Ele usa Playwright para navegar para a pasta do Google Drive do operador, criar uma subpasta com o nome do cliente e fazer upload de todos os arquivos gerados no run.

**Este step é opcional.** O FERABOT não traz credencial do Google Drive. Se você não tiver sessão de navegador logada/credencial do Drive configurada, o fallback é manual: abrir drive.google.com, arrastar a pasta `<FERABOT>/output/onboarding/{client-slug}-{data}/` pra dentro do Drive, clicar em Compartilhar → "Qualquer pessoa com o link — Leitor" e colar o link no relatório (e na mensagem de entrega do step-20).

## Pasta de Destino

- **URL da pasta mãe**: `{{drive_pasta_mae}}` — [A PREENCHER: link da pasta do seu Drive onde ficam os clientes, se usar]
- **Nome da subpasta a criar**: `[Nome do Cliente] — [Data]` (ex: "Carlos Mendes — 2026-03")

## Dados de Referência

- `<FERABOT>/output/onboarding/{client-slug}-{data}/client-briefing.md` — para extrair nome do cliente
- Todos os arquivos em `<FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-*.html`

## Instruções para Danilo Drive

### Passo 1 — Listar arquivos a fazer upload
Identificar todos os arquivos HTML gerados para este cliente:
- `{client-slug}-sales-page.html`
- `{client-slug}-marketing-plan.html`
- `{client-slug}-story-01.html` até `{client-slug}-story-10.html`
- `{client-slug}-stories.html` (índice)
- `{client-slug}-carousel-01.html` até `{client-slug}-carousel-03.html`
- `{client-slug}-carousels.html` (índice)
- `{client-slug}-thumb-01.html` até `{client-slug}-thumb-03.html`
- `{client-slug}-thumbnails.html` (índice)
- `{client-slug}-netlify-report.md` (se existir)

Total esperado: ~18-20 arquivos

### Passo 2 — Navegar para a pasta do Drive
```javascript
// Usar mcp__playwright__browser_navigate
navigate to: "{{drive_pasta_mae}}"
```

Verificar se está logado. Se não estiver:
1. Aguardar redirecionamento para login do Google
2. A sessão do browser persistente deve já ter login salvo
3. Se não estiver logado, pausar e notificar o usuário para fazer login — ou seguir o fallback manual descrito no Contexto

### Passo 3 — Criar nova pasta para o cliente
```javascript
// Tirar screenshot para verificar estado atual
screenshot()

// Clicar em "Novo" (botão + New)
click "Novo" ou "+ New"

// Selecionar "Nova pasta"
click "Nova pasta" ou "New folder"

// Digitar o nome da pasta
type: "{Nome do Cliente} — {Mês/Ano}"

// Confirmar
click "Criar" ou "Create"

// Aguardar a pasta aparecer
wait_for(selector: '[data-tooltip="{Nome do Cliente}"]')

// Abrir a pasta criada
click on the new folder
```

### Passo 4 — Fazer upload dos arquivos
```javascript
// Clicar em "Fazer upload de arquivos" ou "Upload files"
click "Novo" → "Upload de arquivo" ou arrastar arquivos

// Usar browser_file_upload para selecionar todos os arquivos
file_upload(files: [lista de todos os caminhos absolutos dos arquivos])

// Aguardar conclusão dos uploads
wait_for_upload_complete()

// Tirar screenshot do resultado
screenshot()
```

### Passo 5 — Verificar uploads e obter link da pasta
```javascript
// Verificar que todos os arquivos aparecem na pasta
// Contar itens visíveis vs itens esperados

// Obter o link compartilhável da pasta
right_click on folder → "Obter link" ou "Get link"
copy link
```

### Passo 6 — Gerar relatório de upload

```markdown
# Relatório de Upload Google Drive — {Nome do Cliente}

**Data**: {data atual}
**Status**: {SUCESSO/PARCIAL/FALHA}

## Pasta Criada

- **Nome**: {Nome do Cliente} — {Data}
- **Link**: {URL do Drive da pasta}
- **Pasta mãe**: {{drive_pasta_mae}}

## Arquivos Enviados

{lista de arquivos com status de upload}

## Arquivos com Falha (se houver)

{lista de arquivos que falharam}

## Log de Execução

{passos executados e resultados}
```

### Tratamento de Erros

- Se não estiver logado: pausar e solicitar login ao usuário, não prosseguir sozinho
- Se a pasta mãe não for encontrada: verificar URL e ID, notificar usuário
- Se upload falhar para algum arquivo: tentar novamente 1x, registrar no relatório
- Se a sessão expirar no meio do upload: notificar e solicitar reautenticação

## Veto Conditions

- NUNCA fazer upload para a pasta errada (sempre verificar URL antes)
- NUNCA criar pasta dentro de outra pasta de cliente (sempre na pasta mãe)
- NUNCA prosseguir sem verificar se está autenticado no Google Drive
- SEMPRE confirmar que os arquivos aparecem na pasta após upload
- SEMPRE registrar resultado (sucesso ou falha) no outputFile
- NUNCA deletar arquivos existentes na pasta mãe
