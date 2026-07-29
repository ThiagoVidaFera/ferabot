# FERABOT v2 — Plano de atualização

> Documento de trabalho. Criado 2026-07-29.
> Produto: pacote instalável na máquina do cliente, distribuído por `github.com/ThiagoVidaFera/ferabot`.
> Status: **plano proposto — 3 decisões pendentes (§8)**.

---

## 1. O que existe hoje (diagnóstico da v1)

FERABOT v1 foi congelado em **30/04/2026** e não recebeu nada desde então. Três meses de arsenal
novo do workspace ficaram de fora.

**Fluxo de instalação que já funciona (manter, é bom):**

```
Cliente digita:  /instale https://github.com/ThiagoVidaFera/ferabot
   ↓  bootstrap/instale/SKILL.md
   ↓  detecta Python + Git (winget se faltar)
   ↓  git clone → %USERPROFILE%\ferabot
   ↓  python instalar.py
   ↓  SetupFera/setup_perfil.py     → perfil.json (10 campos)
   ↓  SetupFera/setup_skills.py     → copia SkillsDoFera/* → ~/.claude/skills/
   ↓  DashboardFera/index.html      → painel de navegação
```

**As 8 skills da v1:** `squad-carrossel-fera` · `squad-stories-fera` · `squad-caixinha-fera` ·
`jack-fera` (páginas) · `squad-isca-fera` · `meta-ads-fera` · `squad-slides-fera` · `zernio-fera` (DM).

**Os 5 furos reais:**

| # | Furo | Consequência |
|---|---|---|
| 1 | **Zero coach.** Não pergunta meta, não acompanha, não cobra. | O cliente ganha ferramenta e continua sem operar. |
| 2 | **Tom errado.** CLAUDE.md da v1 manda "falar como parceiro estratégico empolgado, celebrar cada entregável, usar fera". É o oposto do FERA.EXE (seco, confronta, anti-hype, sem emoji). | O bot bajula em vez de cobrar. Atrai o perfil que o FERA repele. |
| 3 | **Arsenal defasado.** Falta anúncios de ouro, PDF de proposta, vídeo Gathos, nanobanana, YouTube, disparo WhatsApp. | O cliente não tem o que o Thiago realmente usa. |
| 4 | **Painel morto.** DashboardFera é só menu de botões. | Nada prova o que foi entregue nem cobra o que falta. |
| 5 | **`zernio-fera` aponta pra Zernio**, que já está em migração pra API oficial (`meu-negocio/automacoes/migracao-zernio-para-oficial.md`). | Skill que quebra na mão do cliente. |

---

## 2. O que a v2 tem que ser

Uma frase:

> **O FERABOT v2 é o Thiago instalado na máquina do cliente: cobra a meta de R$10k/mês todo dia
> e constrói junto as peças que levam até ela.**

Duas metades inseparáveis:

- **Coach** — sabe a meta, sabe o que foi feito, sabe o que falta, e cobra. Herda a persona FERA.EXE.
- **Time de FeraBots** — os braços que produzem o ativo quando o cliente pede.

A doutrina que não muda: **done-with-you**. Os FeraBots removem o *construir* e o *decidir*. Não
removem o *executar* — gravar, publicar, responder lead, investir em ads continua sendo dele.
Proibido na UI e na copy: "automático", "piloto automático", "sem esforço", "você só loga".

---

## 3. Arquitetura — porta única + 6 FeraBots

O cliente aprende **um comando**: `/fera`. Todo o resto é roteado por baixo.

```
                        /fera   ← porta única (FERA.EXE do cliente)
                          │
        ┌─────────────────┼──── mentor-first: dúvida → mentora
        │                 │      pedido de ativo → dispara o bot
        │                 │
   ┌────┴────┬────────┬───┴────┬─────────┬──────────┐
   ▼         ▼        ▼        ▼         ▼          ▼
Copiloto  Propostas Páginas  Conteúdo  Roteiros   CRM
de Gestão   (PDF)   & Quiz  & Anúncios & Oratória de Leads
```

Roster idêntico ao que já foi validado comercialmente em 14/07 (memória
`feedback_ferabots_sem_atendimento`) — **nada de FeraBot de "atendimento" nem "financeiro"**.

### 3.1 O que cada FeraBot faz

| FeraBot | Entrega | Origem no workspace |
|---|---|---|
| **Copiloto de Gestão** | metas, índice de execução, painel, cobrança diária, relatório semanal | `produtividade` + `imperio-solo` + esboço Hub FERA |
| **Propostas** | PDF de proposta comercial / oferta (deck 16:9, 11 páginas) | `pdf-de-oferta` |
| **Páginas & Quiz** | landing, página de venda, quiz repelente, deploy | `jack-fera` + `squad-funil-quiz` + Netlify |
| **Conteúdo & Anúncios** | anúncios de ouro (feed/story/reel/carrossel), stories, posts, campanha Meta | `anuncios-de-ouro` + `squad-carrossel-fera` + `squad-stories-fera` + `meta-ads-fera` + `nanobanana` |
| **Roteiros & Oratória** | roteiro de vídeo/reel/live, vídeo gerado, YouTube (título+thumb+upload), slides | Gathos + `youtube-packaging` + `youtube-thumbnail` + `uploadyoutube` + `squad-slides-fera` |
| **CRM de Leads** | captura de lead, disparo de WhatsApp, comentário→DM no Instagram, follow-up | CRM leads + WAGM (local) + DM oficial |

**Onde WhatsApp e DM entram — e por que não viram "atendimento":** ambos ficam no **CRM de Leads**
como *captação e distribuição* (outbound: eu disparo, eu capturo). Nunca como *atendimento*
(inbound: o robô responde e qualifica sozinho). A regra de 14/07 continua valendo — o que muda é
só o eixo: campanha e captura, não suporte.

### 3.2 A dupla camada (obrigatória em toda peça de venda)

1. **Pronto no dia 1** — os 6 FeraBots instalados e funcionando.
2. **Capacitação** — o cliente aprende a fabricar os próprios agentes.
   Frase-âncora aprovada: *"a diferença entre ganhar um funcionário e virar o dono da fábrica de funcionários."*

Isso exige uma 7ª skill, não comercial: **`/criar-ferabot`** — o cliente descreve um agente e o
sistema escreve a skill dele. Sem isso a camada 2 é promessa vazia.

---

## 4. O Coach — o coração da v2

### 4.1 Setup pergunta a META, não só o perfil

`setup_perfil.py` ganha uma segunda etapa, **`setup_metas.py`**, que grava `metas.json`:

```jsonc
{
  "meta_faturamento_mes": 10000,          // default sugerido: R$ 10.000
  "o_que_vende": ["mentoria", "consultoria", "implementacao"],
  "ticket_medio": 2500,
  "clientes_necessarios_mes": 4,          // calculado: meta ÷ ticket, mostrado na tela
  "prazo_meses": 3,
  "compromissos_semanais": {
    "videos_gravados": 3,
    "conteudos_publicados": 5,
    "leads_respondidos_24h": true,
    "verba_ads_ativa": true,
    "calls_realizadas": 2
  },
  "metas_extras": []                      // o cliente adiciona as dele
}
```

A tela do setup faz a conta na frente dele:

> Meta R$ 10.000/mês ÷ ticket R$ 2.500 = **4 clientes por mês**.
> 4 clientes ÷ 4 semanas = **1 venda por semana**.
> Pra 1 venda por semana você precisa de leads. É isso que os FeraBots vão construir.

Isso transforma "10 mil por mês" (abstrato, adiável) em "1 venda por semana" (concreto, cobrável).
É a peça anti-procrastinação do setup.

### 4.2 Painel do Operador — "Pronto × Seu"

`DashboardFera/index.html` deixa de ser menu e vira a tela desenhada no esboço do Hub FERA
(`meu-negocio/hub-fera/ESBOCO.md`, 27/07). **Fase 1 estática, local, sem backend — custo zero.**

```
┌──────────────────────────────────────────────────────────────────────┐
│  FERA · <Cliente>            Meta: R$10k/mês  ▓▓▓▓▓░░  R$6.200       │
├───────────────────────────────┬──────────────────────────────────────┤
│  ✅ PRONTO E NO AR            │  ⚡ SÓ ANDA SE VOCÊ ANDAR            │
│  (o que os FeraBots fizeram)  │  (irredutível seu — ~2h/dia)         │
│                               │                                      │
│  ● Proposta em PDF            │  □ Gravar 3 vídeos da semana    0/3  │
│  ● Página de captura no ar ↗  │  □ Responder leads novos       12 ⚠  │
│  ● 8 anúncios prontos         │  □ Publicar 5 conteúdos         3/5  │
│  ● Campanha rodando           │  □ Manter verba de ads ativa    ✓    │
│  ● CRM recebendo lead         │  □ Fazer as calls agendadas     2/2  │
│                               │                                      │
│  Última entrega: hoje 14:20   │  Índice de execução:  ▓▓▓▓▓░ 78%     │
└───────────────────────────────┴──────────────────────────────────────┘
```

**Por que isso resolve o furo nº4:** a coluna esquerda se preenche sozinha — todo FeraBot registra
a entrega ao terminar (mesmo protocolo silencioso do Kanban do workspace). O cliente abre e vê a
máquina trabalhando. A coluna direita não se preenche sozinha nunca, e é esse o ponto.

**As 6 regras de linguagem do índice (do esboço, não-negociáveis):** nunca "nota"/"score"/
"desempenho" · número nunca aparece sozinho, sempre com causa + ação · zero comparação com outros
clientes · queda se explica pelo sistema, não pela pessoa · nunca gamificar (sem medalha, streak,
confete) · o teto não é 100, a faixa saudável é 80+.

### 4.3 Motor

Reaproveita `kanban-api.py` (já existe, já é atômico, já roda em Windows com UTF-8 forçado).
Acrescenta `metas-api.py` para o índice de execução e o progresso da meta. Ambos gravam JSON local.

---

## 5. Persona — a decisão mais delicada

O FERA.EXE foi calibrado pro **Thiago**: confronta, corta desculpa, recusa desistência da meta,
gate de validação ("não dou veredito sobre peça que não vi"), sem emoji, respiro mobile-first.

Na máquina de um **cliente pagante** isso tem dois caminhos possíveis, e a escolha muda todos os
arquivos de persona:

- **(A) FERA.EXE puro** — o cliente compra o Thiago sem filtro. Coerente com filtragem
  comportamental; quem não aguenta não era cliente. Risco: cliente novo interpreta como grosseria.
- **(B) FERA.EXE calibrado** — mesma doutrina, mesmo gate, mesma recusa de desistência, mesmo
  anti-hype; tira a dureza de mentor íntimo (o "não sou sua babá"). Confronta o trabalho, não a pessoa.

**Recomendação: (B).** O confronto que funciona no FERA.EXE vem da relação — o Thiago escolheu ser
cobrado. O cliente escolheu comprar uma ferramenta. O que carrega o resultado é o **gate de
validação** e a **recusa de desistir da meta**, e os dois sobrevivem inteiros na versão calibrada.

Em ambos os casos o CLAUDE.md da v1 (o "parceiro empolgado que celebra") é **reescrito do zero**.

---

## 6. Matriz de credenciais — o que trava e o que não trava

Esse é o ponto que decide o tamanho real da v2. Muita skill do workspace roda com chave do Thiago.

### 6.1 Roda de graça / local (sem chave) — 100% portável

| Capacidade | Como |
|---|---|
| Anúncios de ouro, carrossel, stories, posts | HTML→PNG via Playwright |
| PDF de proposta | HTML→PDF via Playwright |
| Slides | MARP local |
| Landing / quiz | HTML gerado local |
| Narração de vídeo | Edge TTS (grátis) |
| Coach, painel, índice | JSON local |

### 6.2 Cliente traz a própria chave (BYOK) — natural, é a conta dele

| Capacidade | Chave | Observação |
|---|---|---|
| Imagens (nanobanana) | Gemini API | tem free tier |
| Subir anúncios | Meta Ads token + ad account | tem que ser a conta dele |
| Publicar YouTube | OAuth do canal | tem que ser o canal dele |
| Deploy de página | Netlify token | free tier resolve |
| DM Instagram | app Meta do cliente | via API oficial, não Zernio |

### 6.3 ⚠️ Trava de verdade — precisa de decisão

| Capacidade | Problema | Saídas |
|---|---|---|
| **Vídeo IA (Gathos)** | API paga, chave é do Thiago. Não dá pra distribuir. | (a) cliente cria conta própria · (b) Thiago revende crédito por gateway · (c) v2 sai só com a via grátis (Edge TTS + FFmpeg + motion HTML, sem text-to-video) |
| **Disparo de WhatsApp** | WAGM roda no VPS do Thiago, com o número dele. | **Instância local do whatsapp-web.js na máquina do cliente, com o número dele.** Mesmo motor, sem VPS, sem custo, e o risco de ban fica na conta de quem dispara. É a saída certa. |
| **Voz clonada (ElevenLabs)** | paga, voz é do Thiago | cortar da v2. Edge TTS cobre o cliente. |

**Recomendação:** v2 nasce com §6.1 + §6.2 completos e a via grátis de vídeo (§6.3c). Gathos entra
como upgrade opcional depois que o modelo de revenda estiver decidido — senão a v2 trava esperando
uma decisão comercial que não é técnica.

---

## 7. Estrutura de arquivos da v2

```
ferabot/
├── CLAUDE.md                    ← REESCRITO (persona FERA.EXE + doutrina + gates)
├── perfil.json                  ← perfil do cliente
├── metas.json                   ← NOVO — meta R$10k, ticket, compromissos
├── entregas.json                ← NOVO — log do que os bots entregaram (coluna esquerda)
├── instalar.py
├── bootstrap/instale/           ← mantém como está (funciona)
├── SetupFera/
│   ├── setup_perfil.py          ← ampliado
│   ├── setup_metas.py           ← NOVO — a conversa sobre a meta
│   ├── setup_chaves.py          ← NOVO — BYOK guiado, uma API por vez
│   └── setup_skills.py          ← mantém
├── ScriptsFera/
│   ├── lib.py
│   ├── kanban-api.py            ← portado do workspace
│   └── metas-api.py             ← NOVO — índice de execução
├── SkillsDoFera/
│   ├── fera/                    ← NOVO — a porta única
│   ├── copiloto-de-gestao/      ← NOVO
│   ├── propostas/               ← NOVO
│   ├── paginas-e-quiz/          ← evolui do jack-fera
│   ├── conteudo-e-anuncios/     ← funde carrossel+stories+ads+anúncios de ouro
│   ├── roteiros-e-oratoria/     ← NOVO (vídeo + YouTube + slides)
│   ├── crm-de-leads/            ← NOVO (leads + WhatsApp + DM) — substitui zernio-fera
│   └── criar-ferabot/           ← NOVO — a camada de capacitação
├── DashboardFera/index.html     ← REESCRITO — Painel do Operador
├── tutorial/index.html          ← atualizado
└── PRIMEIRO_DIA.md              ← reescrito em cima da meta
```

---

## 8. Decisões — TRAVADAS em 2026-07-29

| # | Decisão | Consequência prática |
|---|---|---|
| 1 | **Persona: FERA.EXE calibrado** | Mantém gate de validação, recusa de desistir da meta e anti-hype. Confronta o trabalho, não a pessoa. Sai o "não sou sua babá". |
| 2 | **Vídeo: v2 sai com a via grátis** | Edge TTS + FFmpeg + motion HTML. Sem Gathos, sem ElevenLabs. Gathos vira upgrade quando o modelo de revenda for decidido — a v2 não espera por isso. |
| 3 | **WhatsApp e DM dentro do CRM de Leads, como captação** | Roster fica em 6 bots. Outbound de campanha e captura de lead. Proibido posicionar como "o robô responde e qualifica sozinho". |

**Interpretação a confirmar:** li "vídeos com gatos" como **Gathos** (o pipeline de vídeo IA).
Com a decisão 2, isso deixa de bloquear a v2 de qualquer forma.

**Não registrado no Google Tasks** por decisão do Thiago. Rastreio pelo Kanban: `thi-455`.

---

## 9. Fases de build

| Fase | Entrega | Status |
|---|---|---|
| **1. Cérebro** | CLAUDE.md reescrito, skill `/fera` (porta única), persona + doutrina + roteador + coach | ✅ **feito** |
| **2. Coach** | `setup_metas.py`, `metas-api.py`, Painel do Operador, wiring no `instalar.py` | ✅ **feito** (falta a skill `/copiloto-de-gestao`) |
| **3. Braços grátis** | propostas, páginas & quiz, conteúdo & anúncios, slides | pendente |
| **4. Braços BYOK** | `setup_chaves.py`, Meta Ads, YouTube, Netlify, DM oficial, WhatsApp local | pendente |
| **5. Capacitação** | `criar-ferabot` | pendente |
| **6. Distribuição** | tutorial, PRIMEIRO_DIA, README, `atualizar.bat`, push pro GitHub, teste em máquina limpa | pendente |

Fases 3 e 4 são paralelizáveis por bot.

### O que já foi construído (2026-07-29)

| Arquivo | O que é |
|---|---|
| `CLAUDE.md` | reescrito do zero — persona calibrada, doutrina done-with-you, A/B/C/D, protocolo de registro de entregas. Saiu o "piloto automático" que estava na hero da v1. |
| `SkillsDoFera/fera/SKILL.md` | a porta única `/fera`, mentor-first |
| `SkillsDoFera/fera/references/persona.md` | voz, protocolo do operador, gate de validação, meta inegociável, checklist de 9 itens |
| `SkillsDoFera/fera/references/doutrina.md` | done-with-you, anti-hype, A/B/C/D, filtragem, mobile-first |
| `SkillsDoFera/fera/references/roteador.md` | mapa dos 6 FeraBots, fallback, gates obrigatórios |
| `SkillsDoFera/fera/references/coach.md` | a conta meta→venda semanal, índice de execução, 6 regras de linguagem, abertura do dia, regra da ordem |
| `SetupFera/setup_metas.py` | pergunta a meta e mostra a conta na frente do cliente |
| `ScriptsFera/metas-api.py` | motor: entregas, compromissos, faturamento, índice, geração do painel |
| `DashboardFera/index.html` | Painel do Operador "Pronto × Seu" |
| `instalar.py` | virou 4 passos (entrou a meta), gera o painel no fim |
| `.gitignore` | passou a ignorar metas.json, entregas.json, painel.js, checkpoints.json |

**Testado:** motor end-to-end (entrega, compromisso, faturamento, status, painel) e `setup_metas.py`
com respostas default. QA visual do painel em 375px e 1440px, sem overflow horizontal.

**Ainda NÃO testado:** instalação completa em máquina limpa (fase 6).

**Teste de aceite (sem ele não sobe pro Hub):** máquina limpa, sem Python, sem Git.
`/instale` → setup → o cliente sai com meta definida, painel aberto e **uma peça real produzida no
primeiro dia**. Se ele terminar o dia 1 sem um ativo na mão, a v2 falhou.
