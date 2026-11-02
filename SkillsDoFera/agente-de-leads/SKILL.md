---
name: agente-de-leads
description: FeraBot Agente de Leads. Um assistente de IA no WhatsApp do próprio usuário recebe o lead do funil Reunião Fantasma, faz poucas perguntas de qualificação, envia materiais, manda os lembretes da reunião e, depois dela, prepara a proposta para o dono aprovar. Triggers "agente de leads", "assistente do WhatsApp", "lembrete da reunião", "reunião do fulano foi", "no-show".
---

# FeraBot Agente de Leads

Persona e doutrina: `SkillsDoFera/fera/references/`. Ler `perfil.json` antes de tudo.

Esta skill SOBREPÕE a regra antiga "WhatsApp é só captação". Agora existe um assistente de IA que conversa com o lead que veio do funil. Ele se apresenta como assistente, nunca finge ser pessoa, e o dono continua sendo quem fala na reunião, fecha e manda a proposta. É um trabalho feito junto com o dono (done-with-you): o agente prepara e avisa, o dono decide.

## O que ele faz

1. Escuta o WhatsApp do dono. Quando chega uma mensagem com o marcador do funil, cria o lead no CRM e a reunião na agenda local, e abre a conversa.
2. Qualifica com poucas perguntas por vez (Instagram, o que vende, para quem, o que já tentou, objetivo), curtas e no celular.
3. Envia os materiais que o dono listou em `agente.json`, em momentos fixos.
4. Confirma a reunião só se o lead responder e mostrar o perfil (Reunião Fantasma). Quem não responde recebe no máximo 2 toques, dentro da janela, e o dono é avisado do risco de no-show.
5. Manda os lembretes: 24 horas, 1 hora e 10 minutos antes.
6. Sai da conversa quando o lead quer fechar, pede preço, pede ligação, pede uma pessoa ou digita "gente". Se o dono digitar no chat, o agente se cala naquele contato.
7. Depois da reunião, monta o `lead.json` e chama o gerador da proposta. O dono aprova antes de qualquer envio.

Marcador gerado pela página do funil (a mensagem que o lead dispara pelo botão):

```
[AGENDAMENTO] AAAA-MM-DD HH:MM | nome | @instagram | fone
```

O @ pode vir vazio, e então o agente pede. O número que vale é o de quem enviou a mensagem, não o digitado no marcador.

## Aviso que precisa ser dito ao cliente, com todas as letras

**Os lembretes só saem com o computador ligado, com a internet funcionando e com o agente aberto no terminal.** Computador desligado ou dormindo na hora do lembrete significa lembrete perdido, e o agente registra "perdido" em vez de mandar atrasado. Para uso sério, deixar o computador ligado nos horários das reuniões. Dois sistemas não podem usar o mesmo número ao mesmo tempo, então feche o disparador (`wpp/disparar.js`) antes de abrir o agente.

## Instalação (uma vez)

1. `cd ScriptsFera/agente && npm install`
2. Chave do Gemini no `.env` da raiz: `GEMINI_API_KEY` (veja `API_SETUP.md`). Modelo padrão `gemini-2.5-pro`, trocável por `GEMINI_MODEL` ou pelo campo `modelo`.
3. Copiar `ScriptsFera/agente/agente.exemplo.json` para `ScriptsFera/agente/agente.json` e trocar tudo pela voz do dono: nome, apresentação, materiais, perguntas, textos. Escrever junto com ele, usando `perfil.json`. Textos em `references/mensagens.md`.
4. Testar sem WhatsApp: `node ScriptsFera/agente/simular.js`.
5. Rodar em modo seguro: `node ScriptsFera/agente/agente.js` (conecta, escuta, imprime o que enviaria, não envia nada). Na primeira vez aparece o QR code para escanear com o WhatsApp do dono.
6. Só depois de ver o plano certo: `node ScriptsFera/agente/agente.js --enviar`.

## Arquitetura

Tudo local, nada passa por servidor de terceiro, exceto a chamada ao Gemini com a chave do próprio usuário.

| Arquivo (`ScriptsFera/agente/`) | Papel |
|---|---|
| `agente.js` | Liga o WhatsApp (whatsapp-web.js), repassa as mensagens e roda a rotina a cada minuto |
| `conversa.js` | Funil, qualificação, confirmação, passagem para humano |
| `rotina.js` | Lembretes, toques, avisos de no-show e de pós-reunião |
| `guardas.js` | Detecta intenção por palavra, barra resposta da IA com preço, link estranho ou promessa |
| `janela.js` | Janela de envio e cálculo da agenda de lembretes |
| `gemini.js` | Chamada ao Gemini e resposta stub marcada, quando não há chave |
| `envio.js` | Cap diário, pausa humana, silêncio e histórico |
| `pos-reuniao.js` | Monta `lead.json` e chama o gerador de proposta |
| `simular.js` | Teste completo sem WhatsApp |

Arquivos de dados, todos fora do git, em `ScriptsFera/agente/dados/`: `agente-estado.json` (contatos, histórico, etapa), `agenda.json` (reuniões, lembretes, toques), `avisos.json` (avisos ao dono), `agente.log`. A sessão do WhatsApp fica em `ScriptsFera/wpp/.sessao`, a mesma do disparador.

Prompt do Gemini: `references/prompt-agente.md`. Textos: `references/mensagens.md`.

## Guardas de segurança

- Lista branca: só responde quem entrou pelo marcador do funil (ou já está no estado). Número desconhecido é ignorado. Grupo é sempre ignorado.
- Modo padrão é DRY-RUN. `--enviar` liga o envio real e exige `agente.json` próprio e `GEMINI_API_KEY`. Sem a chave, o agente nunca envia a resposta stub.
- Anti-ban: máximo de envios por dia (`limites.max_envios_dia`, padrão 40), pausa aleatória antes de cada envio (6 a 20 segundos em resposta, 20 a 90 em lembrete, toque e material), envio um por vez, janela de 9h às 20h de segunda a sábado para toques e para o lembrete de 24 horas. Os lembretes de 1 hora e 10 minutos ficam colados no horário da reunião. Teto de leads novos por dia. Os 60 a 300 segundos do disparador existem para lote frio e não se aplicam a conversa 1 a 1, mas a regra de ouro continua: nunca falar com lista fria.
- Preço: o agente não fala de valor. Se o dono liberar (`preco_liberado` e `preco_texto`), responde só com o texto escrito pelo dono. Fora isso, pergunta de preço passa para o humano.
- Horário: o agente não marca nem muda horário. Pedido de outro horário passa para o humano.
- Link: só os links listados em `materiais`. Qualquer outro link na resposta da IA barra a mensagem e chama o dono.
- Pedido de parar ("parar", "sair", "cancelar"): o agente confirma uma vez, cancela a reunião da agenda local e nunca mais escreve.
- Erro da IA: o agente não responde nada, registra e avisa o dono. Nunca improvisa.
- Dado do negócio do dono: nunca inventado. O que a IA não sabe vira "o dono responde na reunião".

## Passagem para humano e avisos

O agente sai da conversa quando o lead quer fechar, pede preço, pede ligação, pede uma pessoa, digita "gente" sozinho, a IA sinaliza handoff ou uma resposta é barrada. O lead recebe uma frase curta de passagem, o contato fica silenciado e o aviso vai para `avisos.json` e para o console. O dono lê os avisos com `node ScriptsFera/agente/agente.js --avisos`. Tipos: `handoff`, `risco-no-show`, `no-show`, `pos-reuniao`, `parar`, `erro-ia`, `marcador-invalido`.

Se o dono digitar no chat de um lead, o agente detecta e se cala naquele contato. Depois de passar para humano, ele também para os lembretes daquele contato: quem conduz agora é o dono.

## Pós-reunião e proposta

Quando o dono disser "reunião do fulano foi":

1. Rodar `node ScriptsFera/agente/pos-reuniao.js --lead "fulano"`. Ele monta `lead.json` com nome, empresa, instagram, whatsapp, falas literais do lead (só o que ele escreveu), objetivo e dor, e marca a reunião como realizada.
2. Se faltar dor, objetivo ou falas, o script para. Perguntar ao dono e passar `--dor "..."` e `--empresa "..."` com as palavras do lead. Nunca inventar.
3. Gerar a página: `python SkillsDoFera/proposta-pagina/gerar_proposta.py --lead <lead.json> --out <pasta>` (ou `--gerar` no pos-reuniao). Saída: `index.html` e `resumo.json`.
4. Mostrar a página e o resumo ao dono. Ele aprova ou pede ajuste.
5. Publicar pela skill `paginas-e-quiz` somente depois da aprovação.
6. A mensagem com o link da proposta NÃO cita preço. O valor mora só na página. Quem manda a mensagem é o dono, o agente nunca envia a proposta sozinho.
7. Atualizar o CRM: `python ScriptsFera/leads-api.py status <id> proposta`.

Contrato do `lead.json`: `{nome, empresa, instagram, whatsapp, falas[], objetivo, dor, oferta_override?}`.

## Regras de texto para o cliente

Português do Brasil acentuado, sem emoji, sem travessão, sem ponto e vírgula. Falar em "junto com você", nunca em "automático". Não prometer que o agente "vende sozinho": ele prepara a reunião, quem fecha é o dono.

## Entrega

1. Registrar em silêncio:
   `python ScriptsFera/metas-api.py entrega add "agente-de-leads" "<o que foi>" --link "<pasta>"`
2. Mostrar o caminho absoluto completo da pasta do que foi gerado.
3. Lembrar o aviso do computador ligado e que o primeiro uso é sempre em dry-run.
