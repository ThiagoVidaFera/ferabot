---
name: funil-reuniao-fantasma
description: FeraBot Funil Reunião Fantasma. Cria a página de agendamento de reunião de 20 minutos em que o lead trava o horário primeiro e só tem reunião se responder no WhatsApp e provar o perfil. Use para "página de agendamento", "agendar reunião", "reunião fantasma", "primeira página", "funil de reunião", "marcar call".
---

# FeraBot Funil Reunião Fantasma

Persona e doutrina: `SkillsDoFera/fera/references/`. Ler `perfil.json` antes de tudo.
Deploy e QA: skill `paginas-e-quiz`. Esta é a PRIMEIRA página que o cliente cria.

## O mecanismo

O lead escolhe o horário e ele fica RESERVADO no nome dele. A reunião só vira confirmada se ele responder
no WhatsApp e provar o perfil. Se não responder, o no-show é do dono, e a agenda volta a ficar livre.
Três microcomprometimentos: escolher horário, responder, se justificar.
Detalhe de copy, seções e checklist A/B/C/D: `references/copy-reuniao-fantasma.md`.
Mensagens prontas (confirmação, prova de perfil, lembretes, no-show do dono): `references/mensagens-whatsapp.md`.

## Como funciona, sem servidor

Página estática. O lead preenche nome, WhatsApp, Instagram e uma pergunta de contexto. O envio abre
`wa.me/<número do dono>?text=<mensagem pronta>` com um marcador que o agente de leads lê:

```
[AGENDAMENTO] AAAA-MM-DD HH:MM | Nome | @instagram | 55DDDNUMERO
[CONTEXTO] <pergunta> | <resposta>
```

A linha `[AGENDAMENTO]` tem sempre 5 partes separadas por ` | `. Data e hora no fuso do negócio, Instagram
em minúsculas com `@` (ou `-`), WhatsApp só com dígitos começando em 55. `[CONTEXTO]` é opcional e
repete uma vez por pergunta. O parser é `parse_marcador.py` (fonte única do contrato).

## Limitações (dizer ao dono ANTES de gerar)

1. Dois leads podem escolher o mesmo horário. A página não tem servidor, então não sabe. Quem mandou a
   mensagem primeiro fica com o horário e o dono resolve o outro na conversa (mensagem 7 de
   `mensagens-whatsapp.md`). Para reduzir, depois de cada confirmação o Claude adiciona o horário em
   `disponibilidade.bloqueios` e publica de novo.
2. O horário só fica reservado quando a mensagem chega no WhatsApp do dono. Se o lead fechar o WhatsApp sem enviar, nada existe.
3. Lembretes (24h, 1h, 10 min) saem do computador do dono. Computador desligado, lembrete não sai.
   O fluxo é done-with-you: o Claude monta a fila e o dono revisa e envia.
4. A página não guarda dado nenhum. O registro do lead acontece quando o dono recebe a mensagem.

## Fluxo (nesta ordem, sem pular)

1. **Briefing do funil.** Conversa, uma pergunta por vez, conforme `references/copy-reuniao-fantasma.md`
   (seção "O que o Claude pergunta ao dono"). Crie `output/paginas/reuniao-fantasma/` e grave `funil.json`
   a partir de `SkillsDoFera/funil-reuniao-fantasma/funil.exemplo.json`. Dado que só o dono tem (WhatsApp,
   horários, prova, caso, número) nunca é inventado: vira pergunta ou `[FONTE OMISSA: o que falta]`.
2. **COPY aprovada.** Mostre h1, sub, passos, dores, filtro, FAQ e as 2 perguntas de prova de perfil no chat.
   Rode o checklist A/B/C/D. Só avance com OK explícito do dono. Nunca gere antes.
3. **Imagem ilustrativa (opcional, nunca bloqueante).** Se o dono tem `GEMINI_API_KEY`:
   `python ScriptsFera/imagem.py "<prompt nascido do texto da seção Por que é assim>" --out output/paginas/reuniao-fantasma/ilustracao.png --ratio 16:9`
   e aponte `imagens.ilustracao` no `funil.json`. Sem chave ou com erro, siga sem imagem.
   Foto de pessoa só se for foto real do próprio dono.
4. **Build.**
   ```bash
   python SkillsDoFera/funil-reuniao-fantasma/build.py --perfil perfil.json \
     --funil output/paginas/reuniao-fantasma/funil.json --out output/paginas/reuniao-fantasma
   ```
   Lê `perfil.json` (nome, nicho, produto, handle_instagram, cor_primaria, cor_secundaria, landing_page) e
   `funil.json`. O build trava se sobrar `[FONTE OMISSA]`, `[VERIFICAR]`, placeholder, travessão, ponto e
   vírgula ou expressão proibida ("automático" e afins). Prova sem fonte é removida e vira aviso.
5. **QA.** `python ScriptsFera/render.py qa output/paginas/reuniao-fantasma/index.html`, ABRIR o
   `qa-375.png` e conferir: 1ª dobra com 1 CTA, nada cortado, sem overflow horizontal. Testar o fluxo:
   escolher horário, preencher, e conferir o link `wa.me` gerado (número do dono, marcador na mensagem).
6. **Deploy** pela skill `paginas-e-quiz` (seção Deploy, Netlify do cliente, ou arrastar a pasta em
   `app.netlify.com/drop` se não houver token). Abrir a URL publicada e repetir o teste do passo 5.
7. **Registro silencioso de entrega:**
   `python ScriptsFera/metas-api.py entrega add "funil-reuniao-fantasma" "Página de reunião de 20 min" --link "<url ou pasta>"`
   Depois mostrar o caminho absoluto completo da pasta e a URL.

## Depois que a página está no ar

- Cada mensagem com `[AGENDAMENTO]` que chegar no WhatsApp do dono vira lead. O agente de leads (skill
  `agente-de-leads`, quando instalada) lê o marcador. Sem ele, o dono ou o Claude rodam:
  ```bash
  python SkillsDoFera/funil-reuniao-fantasma/parse_marcador.py "<texto da mensagem>" --registrar
  ```
  Isso executa `python ScriptsFera/leads-api.py add "<nome>" --tel <55...> --origem funil-reuniao-fantasma --nota "..."`.
  Se a mensagem não tem marcador, o parser sai com código 2 e nada é gravado.
- Responder o lead é do dono, em até 15 minutos em horário comercial (`mensagens-whatsapp.md`, mensagem 1).
- Página sem tráfego não gera reunião. Apontar o passo de tráfego (conteúdo ou anúncio) na mesma resposta.

## Pixel Meta (opcional)

`pixel_id` no `funil.json` (só dígitos). O evento `Lead` dispara no envio do formulário, antes de abrir o
WhatsApp. Sem `pixel_id` nenhum script de terceiro é carregado.

## Regras duras

- Mobile-first, desenhado em 375px, 1 CTA na primeira dobra, hero com a conversa animada (CSS, respeita
  `prefers-reduced-motion`).
- Sem preço na página. Sem número, prova ou depoimento inventado. A conversa do hero é ilustração e diz isso.
- Texto ao cliente: português do Brasil acentuado, sem emoji, sem travessão, sem ponto e vírgula.
- Nunca "automático" nem derivados. Done-with-you: o Claude monta, o dono executa.
- Disponibilidade só com horários que o dono realmente vai cumprir.
