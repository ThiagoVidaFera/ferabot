---
name: instale
description: Instala um projeto a partir de um repositório GitHub. Detecta dependências (Python, Git), instala via winget se faltar, clona o repo e roda o instalador do projeto. Use quando o usuário digitar "instale <url-github>" ou "/instale <url-github>".
---

# /instale — One-liner de instalação de projetos

Skill global de bootstrap. Pega qualquer repo GitHub e deixa rodando localmente, sem o usuário precisar entender de Python, Git ou linha de comando.

## Quando usar

Quando o usuário escrever algo no formato:

- `instale https://github.com/owner/repo.git`
- `/instale https://github.com/owner/repo`
- `instala o https://github.com/...`

Mesmo se faltar `.git` no fim, mesmo se for só `owner/repo`.

## O que fazer (passo a passo)

### 1. Extrair URL e nome do projeto

Da mensagem do usuário, isolar a URL e derivar:

- `repo_url` = URL completa (adicionar `https://github.com/` se vier só `owner/repo`, adicionar `.git` no fim se faltar)
- `repo_name` = última parte do path (ex: `ferabot` de `ThiagoVidaFera/ferabot`)
- `target_dir` = `$env:USERPROFILE\<repo_name>` no Windows (`~/<repo_name>` em macOS/Linux)

### 2. Detectar Python e Git

Rodar em paralelo:

```powershell
python --version
git --version
```

Se algum retornar erro / "command not found" / abrir Microsoft Store, marcar como faltando.

### 3. Instalar dependências faltantes via winget

Se Python faltar:

```powershell
winget install -e --id Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements
```

Se Git faltar:

```powershell
winget install -e --id Git.Git --silent --accept-package-agreements --accept-source-agreements
```

**IMPORTANTE:** depois do winget instalar, o PATH só atualiza em novos shells. Se acabou de instalar Python ou Git, avisar o usuário:

> "Acabei de instalar Python/Git, fera. Fecha e abre o VS Code uma vez (File → Close Folder → reabre o folder), aí roda `/instale` denovo. É chato mas é uma vez só."

E parar aqui. NÃO tentar continuar nesse mesmo shell — vai falhar com "command not found" mesmo com binário no disco.

### 4. Clonar o repositório

Se já tem Python e Git:

```powershell
git clone <repo_url> <target_dir>
```

Se a pasta já existe, perguntar:

> "Pasta `<target_dir>` já existe. Quer que eu (a) rode `git pull` pra atualizar ou (b) apague e clone do zero?"

### 5. Detectar e rodar o instalador do projeto

Procurar na raiz do repo, em ordem de prioridade:

1. `instalar.py` → `python instalar.py`
2. `install.py` → `python install.py`
3. `setup.py` (se NÃO for um setuptools clássico — ver shebang/conteúdo) → `python setup.py`
4. `install.sh` → `bash install.sh`
5. `install.bat` → executar direto
6. `package.json` com script `install` → `npm install && npm run install`
7. Nada disso → mostrar README e pedir orientação

Rodar o instalador no terminal e mostrar a saída pro usuário.

### 6. Confirmar sucesso

Ao final:

```
Pronto, fera!

✓ Python ok
✓ Git ok
✓ <repo_name> clonado em <target_dir>
✓ Instalador rodou sem erro

Próximo passo: abre essa pasta no VS Code (File → Open Folder → <target_dir>)
e o projeto tá pronto pra uso.
```

Se o repo for o **Ferabot** (`ThiagoVidaFera/ferabot`), o passo final é mais específico:

```
Próximo passo, fera:

1. File → Open Folder → <target_dir>
2. Painel Claude (ícone na lateral)
3. Digita /fera pra começar
```

## Tratamento de erros

| Problema | Resposta |
|----------|----------|
| URL malformada | "Não entendi a URL `<x>`. Tenta no formato `https://github.com/owner/repo`." |
| `winget` não existe | "Tua máquina é antiga (sem winget). Vou te dar o link manual: <link>." Não tentar baixar instalador binário sozinho. |
| `git clone` 404 | "Repo não existe ou é privado. Confere a URL ou roda `gh auth login` antes." |
| `git clone` falha por permissão | "Repo é privado. Roda `gh auth login` e chama `/instale` denovo." |
| Instalador retorna erro | Mostrar stderr completo + perguntar "Quer que eu tente diagnosticar?" |

## Tom

Mesmo tom do Ferabot: parceiro empolgado, "fera", instrução clara de próximo passo, sem corporativês.

## O que NÃO fazer

- Não baixar binários de fora do winget (risco de segurança).
- Não rodar comandos com `--no-verify`, `--force`, ou que destruam pastas sem confirmação.
- Não instalar Python ou Git globalmente sem checar se já existem (winget já pula se já tem, mas check antes pra evitar barulho).
- Não assumir que o user é Thiago — outras pessoas podem usar essa skill.