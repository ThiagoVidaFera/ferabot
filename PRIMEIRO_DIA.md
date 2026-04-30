# Ferabot — Guia do Primeiro Dia

Bem-vindo ao Ferabot, fera! Esse guia te leva do zero até o primeiro conteúdo gerado.
Leva cerca de 15 minutos. Sem mistério.

---

## Antes de começar

Você precisa ter instalado no seu computador:

- **Claude Code** — o aplicativo onde o Ferabot roda
  → Baixe em: https://claude.ai/code
- **Python 3.10 ou mais novo**
  → Baixe em: https://python.org/downloads
  → Na instalação, **marque a opção "Add Python to PATH"**

Se já instalou tudo, siga em frente.

---

## Passo 1 — Instalar o Ferabot (só uma vez)

1. Abra a pasta onde você baixou/clonou o Ferabot
2. Dê **duplo-clique** no arquivo `instalar.py`
   - Se pedir "com qual programa abrir?", escolha **Python**
3. Um formulário vai abrir no seu navegador
4. Preencha seus dados e clique em **Salvar**
5. Aguarde a instalação terminar (aparece a mensagem de sucesso)

**Pronto. Você não precisa fazer isso nunca mais.**

---

## Passo 2 — Abrir o Ferabot

1. Dê **duplo-clique** no arquivo `ABRIR_FERABOT.bat`
2. O Claude Code vai abrir automaticamente na pasta do Ferabot
3. Aguarde carregar (pode demorar alguns segundos na primeira vez)

> Se aparecer uma janela pedindo permissão do Windows, clique em **Sim** ou **Executar assim mesmo**.

---

## Passo 3 — Criar seu primeiro carrossel

Agora você está dentro do Claude Code com o Ferabot ativo.

1. **Clique na área de chat** do Claude Code
2. **Digite exatamente:** `/squad-carrossel-fera`
3. Pressione **Enter**
4. O Claude vai perguntar sobre o tema do carrossel — responda normalmente, como se estivesse conversando
5. Ele vai gerar a copy, te mostrar para aprovar
6. Depois de você aprovar, gera os 10 slides em PNG na pasta `output/carrossel/`

**Regra de ouro:** espere o Claude te mostrar a copy antes de mandar renderizar. Sempre aprove antes.

---

## Como usar cada etapa

| O que você quer criar | O que digitar no Claude Code |
|---|---|
| Carrossel de feed (10 slides) | `/squad-carrossel-fera` |
| Stories de bastidores | `/squad-stories-fera` |
| Caixinha de perguntas | `/squad-caixinha-fera` |
| Landing page ou página de venda | `/jack-fera` |
| Isca digital (PDF + página) | `/squad-isca-fera` |
| Anúncios no Meta Ads | `/meta-ads-fera` |
| Slides de apresentação | `/squad-slides-fera` |
| Automação de DMs no Instagram | `/zernio-fera` |

---

## Onde ficam os arquivos gerados?

Tudo fica na pasta `output/` dentro do Ferabot:

```
Ferabot/
└── output/
    ├── carrossel/     ← seus carrosseis (PNGs)
    ├── stories/       ← seus stories (PNGs)
    ├── caixinha/      ← suas caixinhas (PNGs)
    ├── landing-pages/ ← suas páginas (HTML)
    ├── iscas/         ← suas iscas (PDF + HTML)
    └── slides/        ← suas apresentações (PNG ou MP4)
```

---

## Dúvidas frequentes

**O Claude não reconheceu o comando `/squad-carrossel-fera`**
→ Verifique se o `instalar.py` terminou com sucesso. Se não, rode novamente.

**O formulário de perfil não abriu no navegador**
→ Abra manualmente: duplo-clique em `instalar.py`, se pedir o programa, escolha Python.

**A arte gerou com erro ou ficou feia**
→ Descreva o problema para o Claude no chat. Ele vai corrigir e regenerar.

**Quero mudar meu perfil (nome, cores, produto)**
→ Abra o Claude Code, digite: `python SetupFera/setup_form.py` e salve novamente.

**Não sei se o conteúdo ficou bom antes de publicar**
→ Abra os PNGs na pasta `output/` e revise. Só publique quando estiver satisfeito.

---

## Fluxo da semana recomendado

```
Segunda   → /squad-carrossel-fera     (conteúdo educativo)
Quarta    → /squad-stories-fera       (bastidores)
Sexta     → /squad-caixinha-fera      (engajamento)
Qualquer  → /meta-ads-fera            (tráfego pago quando precisar)
```

---

Qualquer dúvida, abra o Claude Code e fale diretamente com ele.
Ele conhece o seu negócio e está aqui pra te ajudar. 🔥
