# Ferabot

Time de assistentes de marketing e vendas rodando na sua máquina, com uma meta declarada e um
painel que mostra todo dia o que já está pronto e o que só anda se você andar.

Um comando: **`/fera`**. Ele mentora, e chama o FeraBot certo quando você pede uma peça.

## Instalação

### Caminho rápido (recomendado)

No Claude Code, digite:

```
/instale https://github.com/ThiagoVidaFera/ferabot
```

Ele resolve Python, Git, clona e roda o instalador sozinho.

### Caminho manual

Requisitos: Python 3.10+, Claude Code. (Node.js 18+ só pra disparo de WhatsApp.)

```bash
python instalar.py
```

São 4 etapas: ambiente → seu perfil → **sua meta** → instalação dos FeraBots. No fim, o Painel do
Operador abre no navegador.

## Os 6 FeraBots

| Comando | Entrega |
|---|---|
| `/copiloto-de-gestao` | meta, índice de execução, painel, relatório semanal |
| `/propostas` | PDF de proposta comercial |
| `/paginas-e-quiz` | landing, página de venda, quiz, deploy |
| `/conteudo-e-anuncios` | anúncios, carrossel, stories, posts, campanha Meta |
| `/roteiros-e-oratoria` | roteiro, vídeo narrado, YouTube, slides |
| `/crm-de-leads` | leads, disparo WhatsApp, comentário → DM |

E `/criar-ferabot` — você descreve um agente novo e o sistema escreve a skill dele. É a parte que
te torna dono da fábrica, não só usuário dos robôs.

## Chaves de API (opcionais, todas SUAS)

Sem chave nenhuma o Ferabot já produz proposta, página, anúncio, carrossel, roteiro e vídeo
narrado (voz IA grátis). As chaves — das **suas** contas — automatizam o último passo:

| Chave | Automatiza |
|---|---|
| Gemini (grátis) | imagens com IA |
| Netlify (grátis) | publicar páginas |
| Meta Ads | subir campanhas (nascem pausadas) |
| YouTube OAuth | subir vídeos no seu canal |
| Instagram | comentário → DM (captação) |

Configurar: `python SetupFera/setup_chaves.py` · guia: `API_SETUP.md`.

O `.env` e o `perfil.json` ficam só na sua máquina (`.gitignore`). Se algum subir pro git por
acidente, revogue e regenere as chaves.

## Estrutura

```
ferabot/
├── CLAUDE.md          ← doutrina do sistema (persona, regras)
├── perfil.json        ← seu perfil (setup, não commitar)
├── metas.json         ← sua meta e compromissos (setup)
├── entregas.json      ← o que os FeraBots entregaram
├── SetupFera/         ← instalação, perfil, metas, chaves
├── ScriptsFera/       ← motores (render, narração, CRM, WhatsApp, YouTube)
├── SkillsDoFera/      ← /fera + os 6 FeraBots + fábrica
├── DashboardFera/     ← Painel do Operador
└── output/            ← tudo que é gerado
```

## Primeiro dia

Leia o `PRIMEIRO_DIA.md`. Missão: sair do dia 1 com a meta no painel e UMA peça real pronta.
