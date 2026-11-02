# Mensagens de WhatsApp do funil Reunião Fantasma

Voz: a do DONO do negócio, em primeira pessoa, lida em `perfil.json`. Antes de usar, ajuste ao jeito
dele de falar (peça 2 mensagens reais dele no WhatsApp e copie o ritmo). Sem emoji, sem travessão, sem
ponto e vírgula. Linha em branco entre blocos, nenhum bloco com mais de 3 linhas.

Variáveis: `{nome}` primeiro nome do lead · `{dia}` "quinta, 5 de novembro" · `{hora}` "15:00" ·
`{dono}` primeiro nome do dono · `{link}` link da sala (Meet, Zoom ou o que ele usa) · `{produto}` de `perfil.json`.

Regras de quem usa estas mensagens (o dono ou o agente de leads, sempre com o dono vendo):

- Preço só quando o lead perguntar.
- Nenhuma promessa de resultado. Nenhuma escassez inventada.
- A reunião só vira confirmada depois da resposta do lead (passo 2). Até lá o horário está RESERVADO, não confirmado.
- Quem quebra o combinado nunca é o lead por esquecimento educado. Na dúvida, a mensagem convida, não acusa.

---

## 1. Recebi o agendamento (resposta imediata ao marcador [AGENDAMENTO])

Quando usar: chegou no seu WhatsApp a mensagem com `[AGENDAMENTO]`. Responda em até 15 minutos em horário comercial.

```
Oi {nome}, aqui é {dono}.

Recebi o seu pedido e reservei {dia}, às {hora}, no seu nome.

Pra eu confirmar a reunião, preciso de duas coisas por aqui:

*1.* {pergunta_de_prova_1}
*2.* {pergunta_de_prova_2}

Me responde hoje que eu te mando o link da sala.
```

`{pergunta_de_prova_1}` e `{pergunta_de_prova_2}` vêm do briefing (ver `copy-reuniao-fantasma.md`, seção Prova de perfil).
Exemplos de tipo de pergunta: o que ele vende hoje e por quanto, como o cliente dele o encontra, quantos clientes atende por mês.
Escolha perguntas cuja resposta você consegue conferir no Instagram dele.

---

## 2. Cobrança de prova de perfil (lead respondeu pela metade ou não respondeu em 3 horas)

```
{nome}, passando pra fechar a nossa reunião de {dia}, às {hora}.

Falta só a resposta da pergunta {numero}.

Sem ela eu não consigo confirmar e o horário volta pra agenda.
```

Se respondeu com algo vago ("trabalho com marketing"):

```
{nome}, ficou genérico pra eu preparar a conversa.

Me dá um exemplo concreto: o último cliente que você atendeu, o que ele comprou e por quanto?
```

---

## 3. Confirmação da reunião (perfil comprovado)

```
Fechado, {nome}.

Reunião confirmada: {dia}, às {hora}, {duracao} minutos.

Link da sala: {link}

Eu li o que você mandou e já vou chegar com a conversa adiantada. Chega 2 minutos antes.
```

---

## 4. Lembretes

Honestidade sobre o mecanismo: estes lembretes saem do computador do dono. Se o computador estiver
desligado ou sem internet na hora, o lembrete não sai. O dono que depende de lembrete pontual deve deixar o
computador ligado nos horários de reunião, ou mandar à mão. O combinado do FeraBot é o seguinte: o Claude monta a fila, o dono revisa e envia.

### 24 horas antes

```
{nome}, lembrete da nossa reunião amanhã, {dia}, às {hora}.

Link: {link}

Se algo mudou, me avisa hoje e a gente remarca sem problema.
```

### 1 hora antes

```
{nome}, em 1 hora a gente se fala. Às {hora}.

Link: {link}
```

### 10 minutos antes

```
Daqui a 10 minutos, {nome}.

Já estou na sala: {link}
```

---

## 5. No-show do dono (a polaridade invertida)

Quando usar: o lead agendou, NÃO respondeu o passo 2 (ou a prova de perfil não fechou) e a hora chegou.
O dono não aparece na reunião. Quem deu o no-show foi o dono, e ele avisa isso com naturalidade, sem acusação.
Mande até 30 minutos antes do horário.

```
{nome}, passando pra te avisar.

Como eu não recebi as respostas que combinamos, não vou abrir a sala às {hora}. A falta é minha, o horário volta pra agenda.

Se ainda fizer sentido, me responde essas perguntas aqui e eu te encaixo em outro horário.
```

Variação de segunda tentativa (48 horas depois, uma única vez):

```
{nome}, última mensagem sobre a reunião.

Se o seu momento mudou, tudo bem. Se ainda quer conversar, me manda as respostas e eu abro um horário novo.
```

Depois disso o lead sai da fila. Atualize o status no CRM: `python ScriptsFera/leads-api.py status <id> perdido`.

---

## 6. Perfil que não encaixa (decisão do dono depois de ler as respostas)

```
{nome}, li com atenção o que você mandou.

Hoje eu seria honesto com você: {produto} não é o passo certo agora, porque {motivo_curto_e_verdadeiro}.

Em vez de gastar os seus 20 minutos, te indico {proximo_passo}. Se isso mudar, o meu WhatsApp está aqui.
```

Nunca invente motivo. Se o dono não sabe o motivo, ele escreve a verdade ("ainda não vendo para esse perfil").

---

## 7. Dois leads no mesmo horário (limitação conhecida)

A página não tem servidor, então não sabe quando um horário já foi pego. Se dois leads chegarem para o mesmo
horário, o primeiro que mandou a mensagem fica com ele. Ao segundo:

```
{nome}, o horário de {dia}, às {hora} acabou de ser pego por outra pessoa.

Te encaixo em {alternativa_1} ou {alternativa_2}. Qual fica melhor?
```

Depois de confirmar cada reunião, peça ao Claude para bloquear o horário na página: ele adiciona a data
em `disponibilidade.bloqueios` do `funil.json` e publica de novo. Isso reduz o conflito, não elimina.
