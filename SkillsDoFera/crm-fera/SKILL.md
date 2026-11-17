---
name: crm-fera
description: FeraBot CRM FERA. Instala e opera o CRM completo com WhatsApp conectado (inbox, contatos, funil de leads, reuniões, robôs que qualificam, agendam, confirmam e lembram, follow-up, disparos, propostas, vendas e anúncios). Use quando o usuário falar "CRM", "instalar o CRM", "abrir o CRM", "conectar o WhatsApp no CRM", "robôs do WhatsApp", "agentes", "inbox", "lembrete de reunião", "follow-up automático", "colocar o CRM na VPS", "/crm-fera".
---

# CRM FERA

O mesmo CRM que o Thiago usa na operação dele, com a identidade do SEU negócio. Roda em três peças
(pasta `CrmFera/`): o CRM (tela + robôs), o WAHA (a ponte com o seu WhatsApp) e o relógio (chama as
filas dos robôs a cada minuto).

Relação com o resto do FERABOT: o `/crm-de-leads` (leads.json por linha de comando) e o
`/agente-de-leads` (robô local da Reunião Fantasma) continuam funcionando para quem não quer Docker.
Quem instala o CRM FERA passa a usar ESTE como casa dos leads. Não rodar os dois robôs no mesmo
número: escolher um.

## Onde roda (dizer ANTES de instalar, com estas palavras)

| Onde | Custo | O que acontece |
|---|---|---|
| **No seu computador** | grátis | Funciona enquanto o computador estiver ligado, com o Docker Desktop aberto. Desligou, os robôs param e os lembretes daquele horário não saem. |
| **Numa VPS** (servidor alugado) | a partir de uns R$ 30 por mês | Roda 24 horas, como o do Thiago. Recomendado depois que o funil estiver gerando lead todo dia. |

Começar no computador é o caminho certo para testar. Passar para a VPS é a seção "Mudar para a VPS".

## Instalação (uma vez, nesta ordem)

1. **Docker:** `python ScriptsFera/crm.py docker`. Se faltar, guiar a instalação do Docker Desktop
   (https://www.docker.com/products/docker-desktop/), um clique por vez, e pedir para abrir e esperar
   ficar verde. No Windows pode pedir para reiniciar o computador e ativar o WSL: avisar antes.
2. **Identidade do negócio:** `python ScriptsFera/crm.py negocio`. Ele cria `CrmFera/negocio.json`
   a partir do `perfil.json` e lista o que falta. Perguntar cada item que falta, UM POR VEZ, e gravar
   no `negocio.json`. Nunca inventar preço, link, garantia ou entrega: é o que os robôs vão repetir.
   Rodar `python ScriptsFera/crm.py faltando` até não faltar nada.
3. **Segredos:** `python ScriptsFera/crm.py env`. Cria `CrmFera/.env` com senhas aleatórias e puxa a
   `GEMINI_API_KEY` do `.env` da raiz. Mostrar o login e a senha do CRM UMA vez e pedir para guardar.
4. **Subir:** `python ScriptsFera/crm.py subir`. A primeira vez demora (baixa e monta tudo, 5 a 15
   minutos). Depois `python ScriptsFera/crm.py status` até aparecer "CRM respondendo".
5. **Abrir:** `python ScriptsFera/crm.py abrir`, entrar com o login do passo 3.
6. **Conectar o WhatsApp:** no CRM, Configurações > WhatsApp > Conectar. Aparece o QR code: escanear
   com o WhatsApp do número que vai atender (Aparelhos conectados > Conectar aparelho). Confirmar
   que o status ficou "conectado". Pedir para mandar um "oi" de outro celular e conferir que apareceu
   na Inbox.
7. **Robôs:** em Agentes, clicar em "Instalar agentes padrão". Todos nascem em modo **Sugere**: o
   robô escreve a resposta e ELE aprova na Inbox antes de sair. Só passar um agente para Autônomo
   depois de umas 20 respostas aprovadas sem correção.

## Os robôs que vêm instalados

| Agente | O que faz |
|---|---|
| Recepção | recebe quem chega de anúncio ou do link, entende o caso e convida para a reunião |
| Qualificação e agendamento | faz as perguntas do `negocio.json`, manda o link de agendamento |
| Confirmação e lembretes | confirma a reunião e lembra 24h, 1h e 10 min antes; avisa o dono do risco de no-show |
| No-show | quem faltou recebe uma remarcação, sem bronca |
| Follow-up | retoma quem parou de responder, com motivo novo a cada toque |
| Proposta | depois da reunião, acompanha a proposta enviada até a resposta |
| Nutrição | entrega a isca ou o material e puxa conversa |

Regras que valem para todos (guardas no código, não dá para desligar pela conversa):
- Preço, link e garantia só os do `negocio.json`. A IA citou outro valor ou outro link, a mensagem é barrada.
- Perguntou preço fora da hora, pediu uma pessoa, perguntou se é robô: o robô para e avisa o dono.
- O dono digitou na conversa: o robô se cala naquele contato.
- Anti-bloqueio: janela de horário, pausa entre envios e teto por dia.

## Uso do dia a dia (o que pedir)

- "Abre o CRM": `python ScriptsFera/crm.py abrir`.
- "Os robôs pararam": `status`, depois `logs crm` e `logs waha`. Sessão do WhatsApp caiu (status
  FAILED ou desconectado) = escanear o QR de novo em Configurações. Conferir isso ANTES de culpar o robô.
- "Mudei o preço/link": editar `CrmFera/negocio.json` com ele e rodar `python ScriptsFera/crm.py subir` de novo.
- "Importar meus contatos": Contatos > Importar (CSV com nome e telefone). Os do `leads.json` antigo:
  exportar com `python ScriptsFera/leads-api.py list` e importar.

## Mudar para a VPS

1. Ele contrata a VPS (Ubuntu 22.04 ou 24.04, 2 GB de RAM no mínimo) e te passa IP, usuário e senha.
2. Você instala o Docker no servidor (`curl -fsSL https://get.docker.com | sh`), copia a pasta
   `CrmFera/` inteira (com `negocio.json` e `.env`) e roda `docker compose up -d --build` lá.
3. Endereço próprio: um subdomínio (ex.: `crm.seudominio.com.br`) apontando para o IP, com HTTPS
   (Caddy ou Traefik na frente da porta 3900). Guiar o registro DNS um clique por vez.
4. Reconectar o WhatsApp pelo QR no CRM novo e desligar o do computador (`crm.py parar`). Dois CRMs
   no mesmo número = mensagem em dobro.

## Entrega

1. Registrar em silêncio:
   `python ScriptsFera/metas-api.py entrega add "crm-fera" "<o que foi>" --link "http://localhost:3900"`
2. Mostrar o caminho absoluto completo da pasta `CrmFera/`.
3. Lembrar o compromisso: o robô prepara, quem fecha é ele. Lead que pediu uma pessoa se responde no mesmo dia.
