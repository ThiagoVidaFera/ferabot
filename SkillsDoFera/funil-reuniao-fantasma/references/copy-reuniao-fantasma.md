# Copy da página Reunião Fantasma: estrutura e padrão

A página tem UM trabalho: levar o lead a escolher um horário e mandar a mensagem no WhatsApp. Tudo o
mais existe para tirar uma objeção ou filtrar quem não deve entrar.

## O mecanismo em uma frase

O lead agenda e trava o horário primeiro. A reunião só acontece se ele responder no WhatsApp e provar o
perfil. Se não responder, o no-show é do dono, e o dono não perde nada: a agenda volta a ficar livre.

Três microcomprometimentos, nesta ordem: escolher o horário, responder no WhatsApp, se justificar
(a pergunta de contexto e as perguntas de prova). Cada um custa pouco e o conjunto filtra o curioso.

## Estrutura de seções (a ordem é fixa)

| # | Seção | Função | Fonte do conteúdo |
|---|---|---|---|
| 1 | Topo + chip "Reunião de 20 minutos" | dizer o que é em 1 segundo | duracao_min |
| 2 | Hero: H1 + 1 linha + 1 CTA + conversa animada | primeira dobra, 1 CTA só | copy.h1, copy.sub, copy.cta |
| 3 | Como funciona (3 passos) | tirar o medo do processo (A) | copy.passos |
| 4 | Você se reconhece? (opcional) | linha de dentro do lead | funil.dores |
| 5 | Por que é assim | explicar a inversão sem soar arrogante | copy.porque |
| 6 | Prova (opcional) | só prova real com fonte | funil.provas |
| 7 | Entre se / Não entre se | filtrar (doutrina seção 4) | funil.para_quem, nao_para_quem |
| 8 | Agenda + formulário | o único lugar onde o lead age | disponibilidade, perguntas |
| 9 | Perguntas | objeções restantes | copy.faq_extra |
| 10 | Fecho + CTA | repetir o comando | copy.fecho_* |

Barra fixa de CTA aparece fora do hero e da agenda. Não adicione um segundo CTA com outro destino.

## Padrão de copy

- H1 promete a REUNIÃO e o filtro, nunca o resultado do negócio. Fórmula: `{duração} com {dono}. Só para quem {condição}.`
- Subhead de uma linha: o que acontece agora (escolhe, reserva) e o que condiciona a reunião (responder).
- CTA é comando: "Escolher meu horário", nunca "Saiba mais".
- Voz do dono em primeira pessoa, frases curtas, um assunto por parágrafo.
- Sem emoji, sem travessão, sem ponto e vírgula. Nunca "automático", "sem esforço", "a IA cuida de tudo".
- Preço fora da página. Só quando o lead perguntar no WhatsApp.
- Número só com fonte. Depoimento só real, de cliente contatável.

## Prova de perfil (definir antes de gerar)

As 2 perguntas que o dono fará no WhatsApp (mensagem 1 de `mensagens-whatsapp.md`) precisam ter resposta
que ele consiga conferir sozinho. Pergunte ao dono: "o que, no Instagram ou na conversa, te faz dizer
sim ou não para uma reunião?". As respostas viram as perguntas.

Campos de prova que o dono não tem (caso de cliente, número, depoimento) NÃO entram na página.
Anote no briefing como `[FONTE OMISSA: <o que falta>]` e entregue sem a seção. O `build.py` já tira a
prova sem fonte e avisa.

## Checklist A/B/C/D (rodar antes de pedir aprovação)

**A. Anti-medo** (precisa de pelo menos um)
- [ ] "Como funciona" mostra o que acontece em cada passo
- [ ] FAQ diz o que acontece se o lead não responder e se o perfil não encaixar
- [ ] Seção Entre se / Não entre se presente
- [ ] Prova real com fonte, ou a página assume que não tem e segue sem ela

**B. Anti-procrastinação** (precisa de pelo menos um)
- [ ] CTA de comando e igual em todos os pontos
- [ ] O horário reservado funciona como custo de adiar: o lead vê a agenda se esvaziar (só se a disponibilidade for real)
- [ ] Microcopy "leva menos de 1 minuto" é verdadeira (testado)

**C. Anti-preguiça** (precisa de pelo menos um)
- [ ] A mensagem do WhatsApp vem pronta: o lead só aperta enviar
- [ ] O formulário tem no máximo 3 campos fixos mais 1 ou 2 perguntas
- [ ] O que o dono faz (prepara a conversa antes) está dito

**D. Anti-problema-futuro** (precisa de pelo menos um)
- [ ] Remarcar é permitido e está dito
- [ ] A página diz honestamente que dois leads podem pedir o mesmo horário e que o dono resolve na conversa
- [ ] O próximo passo depois da reunião não promete nada além do que o dono entrega

Faltou uma letra: reescreva o trecho, não o checklist.

## O que o Claude pergunta ao dono no briefing (uma pergunta por vez)

1. Número de WhatsApp que recebe os agendamentos (o mesmo que ele atende).
2. Dias e horários em que ele topa fazer reunião de 20 minutos de verdade, e quantas por semana no máximo.
3. Quem é o lead ideal. Quem NÃO é.
4. As 2 perguntas de prova de perfil (ver acima).
5. A pergunta de contexto da página (uma frase).
6. Dores reais que ele ouve dos leads, nas palavras deles (para a seção 4, opcional).
7. Prova real disponível, com fonte. Se não tiver, `[FONTE OMISSA: ...]`.
8. Pixel da Meta, se ele já tiver (opcional).

Com as respostas, o Claude escreve o `funil.json` e MOSTRA a copy completa. Só gera depois do OK explícito.

## Campos de copy que o funil.json aceita (tudo opcional, há padrão)

`titulo_pagina` `descricao` `h1` `sub` `cta` `cta_enviar` `microcopy` `anim_1` a `anim_4` (texto da
conversa ilustrativa do hero) `como_titulo` `passos` (lista de pares titulo/texto) `dores_titulo`
`porque_titulo` `porque` (lista de parágrafos) `prova_titulo` `filtro_titulo` `agenda_titulo`
`agenda_sub` `compromisso` (texto do checkbox) `privacidade` `faq_extra` (lista de pergunta/resposta)
`fecho_titulo` `fecho_sub`.

A conversa animada do hero é ilustração do conceito. Nunca coloque nome, foto ou horário que pareça conversa real de um cliente.
