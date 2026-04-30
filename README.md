# Ferabot

Sistema de marketing com IA para mentores. 9 etapas, do conteúdo aos anúncios, tudo personalizado com o seu perfil.

## Instalação

### Requisitos
- Python 3.10+
- Node.js 18+
- Claude Code instalado
- Git

### Setup em 3 comandos

```bash
# 1. Configurar seu perfil (nome, nicho, produto, cores, APIs)
python SetupFera/setup_perfil.py

# 2. Verificar ambiente e criar estrutura de pastas
python SetupFera/setup_base.py

# 3. Instalar skills no Claude Code
python SetupFera/setup_skills.py
```

### Depois do setup

Abra o Claude Code na pasta raiz do Ferabot e invoque qualquer skill:

```
/squad-carrossel-fera    → carrosseis de feed
/squad-stories-fera      → stories de bastidores
/squad-caixinha-fera     → caixinha de perguntas
/jack-fera               → landing pages
/squad-isca-fera         → iscas digitais
/meta-ads-fera           → anúncios Meta Ads
/squad-slides-fera       → apresentações e slides
/zernio-fera             → automação de DMs
```

### Dashboard

Abra `DashboardFera/index.html` no browser para ver todas as etapas com os comandos.

## Estrutura

```
Ferabot/
├── CLAUDE.md              ← instruções do sistema
├── perfil.json            ← seu perfil (criado pelo setup, não commitar)
├── ScriptsFera/           ← funções utilitárias
├── SetupFera/             ← scripts de instalação
├── SkillsDoFera/          ← as 8 skills de conteúdo
├── DashboardFera/         ← painel de navegação
└── output/                ← todos os arquivos gerados
```

## Segurança

> **Importante:** o arquivo `perfil.json` contém suas chaves de API (Gemini, OpenAI). Ele está listado no `.gitignore` e **nunca deve ser commitado ou compartilhado**. Se acidentalmente subir esse arquivo pro git, revogue e regenere as chaves imediatamente.

Copie `.env.example` para `.env` e preencha com suas credenciais:
```bash
cp .env.example .env
```

## Dependências Python

```bash
pip install playwright python-dotenv requests facebook-business
playwright install chromium
```
