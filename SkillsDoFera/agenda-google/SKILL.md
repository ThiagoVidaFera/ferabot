---
name: agenda-google
description: FeraBot Agenda. Conecta o Google Agenda do dono, cria e organiza as agendas do negócio (reuniões de venda, clientes, produção de conteúdo, rotina), marca reunião com link do Meet e convite para o lead, e mostra horários livres. Triggers "agenda", "Google Agenda", "calendário", "marcar reunião", "marca uma call", "organiza minha semana", "horário livre", "bloquear horário".
---

# Agenda Google

A agenda é onde o funil vira compromisso. Toda reunião confirmada vira evento com link do Meet e
convite para o lead. Todo bloco de produção vira horário fixo na semana, senão não acontece.

## Chave necessária

`GCAL_REFRESH_TOKEN` (e Client ID/Secret do Google). Sem ela: guiar pelo `API_SETUP.md`, seção 4b,
um passo de cada vez. Gerar o link com `python ScriptsFera/agenda.py link`, receber o `code=` que ele
colar e rodar `python ScriptsFera/agenda.py token "<code>"`. Testar com `agenda.py agendas`.

## O que fazer

| Pedido | Comando |
|---|---|
| Organizar as agendas | `python ScriptsFera/agenda.py organizar` (mostra o plano) → OK dele → `--enviar` |
| Ver a semana | `python ScriptsFera/agenda.py eventos --dias 7` |
| Horário livre | `python ScriptsFera/agenda.py livre --de "AAAA-MM-DD 09:00" --ate "AAAA-MM-DD 18:00"` |
| Marcar reunião com lead | `python ScriptsFera/agenda.py marcar "Reunião 20 min · <nome>" --inicio "AAAA-MM-DD HH:MM" --minutos 20 --convidado <email> --meet --agenda <id da agenda Reuniões de venda>` (dry-run primeiro, `--enviar` depois do OK) |

Agendas padrão do `organizar`: Reuniões de venda, Clientes, Produção de conteúdo, Rotina do negócio.

## Rotina da semana (oferecer depois de organizar)

Montar com ele, e só criar depois do OK:
- 2 blocos de **Produção de conteúdo** de 90 minutos (gravar e revisar).
- 1 bloco diário de 30 minutos de **Rotina**: responder lead parado e olhar o CRM.
- Os horários da página de agendamento (`funil.json`) reservados na agenda **Reuniões de venda**.
Bloco recorrente: criar um evento por data (o script não faz recorrência), no máximo 4 semanas por vez.

## Regras

- Nunca marcar, mover ou apagar evento sem mostrar o plano e ter o OK.
- Convite para o lead só com o e-mail que o próprio lead deu. Sem e-mail: evento sem convidado, e o link do Meet vai pelo WhatsApp.
- Conflito no horário: avisar e propor 2 alternativas a partir do `livre`.
- Reunião que veio do CRM ou do `/agente-de-leads`: o título leva o nome do lead e a descrição leva o @ e a origem.

## Entrega

1. Registrar em silêncio:
   `python ScriptsFera/metas-api.py entrega add "agenda-google" "<o que foi>" --link "https://calendar.google.com"`
2. Mostrar o link do evento ou o resumo da semana.
3. Cobrar: bloco de produção marcado é compromisso dele. Perguntar o que ele vai gravar no primeiro bloco.
