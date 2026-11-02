# Mensagens do agente

Os textos reais ficam em `ScriptsFera/agente/agente.json`, campos `apresentacao`, `confirmacao_horario` e `textos`. Aqui estão as versões modelo e as regras para adaptar à voz do dono. Variáveis aceitas: `{nome}` (primeiro nome do lead), `{dono}`, `{dia}`, `{hora}`, `{preco_texto}`.

## Regras para escrever

- Português do Brasil, tom de conversa, frase curta, no máximo 3 linhas.
- Sem emoji, sem travessão, sem ponto e vírgula.
- Nada de promessa de resultado, nada de urgência falsa, nada de culpa ("você sumiu").
- Cada lembrete traz uma informação útil (dia, hora, o que fazer) e nenhuma venda.
- Escrever como o dono escreveria para um conhecido. Se o dono nunca diria, não entra.

## Apresentação (obrigatória, o agente nunca finge ser pessoa)

> Oi, {nome}. Eu sou o assistente de inteligência artificial do {dono}, não sou uma pessoa. Cuido do seu agendamento e de algumas perguntas rápidas pra reunião render. Quem conversa com você na reunião é o próprio {dono}.

Logo depois, na mesma abertura:

> Vi aqui que você marcou {dia} às {hora}. (próxima pergunta pendente)

## Confirmação (só depois que o lead responde e dá o perfil)

> Combinado, {nome}. Sua reunião com o {dono} está confirmada para {dia} às {hora}.

## Qualificação concluída

> Obrigado pelas respostas, {nome}. Já passei tudo pro {dono}, ele chega na reunião sabendo do seu cenário.

## Lembretes (só para reunião confirmada)

24 horas antes:

> Oi, {nome}. Lembrando que sua reunião com o {dono} é amanhã, {dia} às {hora}.

1 hora antes:

> {nome}, sua reunião com o {dono} começa em 1 hora, às {hora}. Separe um lugar tranquilo pra gente conversar.

10 minutos antes:

> {nome}, faltam 10 minutos pra reunião com o {dono}. Já pode se preparar.

Lembrete que passou do horário (computador desligado, por exemplo) não é enviado atrasado. Fica registrado como perdido.

## Toques para quem não respondeu (máximo 2, de 9h às 20h, segunda a sábado)

Toque 1:

> Oi, {nome}. Passando pra confirmar sua reunião de {dia} às {hora}. Me responde com o @ do seu Instagram e eu deixo tudo certo?

Toque 2:

> {nome}, última mensagem minha por aqui. Se ainda fizer sentido a reunião de {dia} às {hora}, é só me mandar o @ do seu Instagram. Se não der, sem problema.

Depois do segundo toque o agente não escreve mais. O dono recebe o aviso de risco de no-show e decide.

## Passagem para humano

> Entendi, {nome}. Vou chamar o {dono} pra seguir com você, ele responde por aqui.

## Pedido para parar

> Tudo bem, {nome}. Não te mando mais mensagens. Se mudar de ideia, é só chamar.

## Materiais

Cada item de `materiais` em `agente.json` tem `id`, `quando`, `texto` e `url` (link) ou `arquivo` (caminho de um PDF ou imagem do dono). Momentos disponíveis:

- `apos_primeira_resposta`: logo depois que o lead responde pela primeira vez. Bom para um guia ou isca.
- `apos_qualificacao`: quando todas as perguntas foram respondidas. Bom para um vídeo do método.
- `no_lembrete_24h`: junto com o lembrete de 24 horas. Bom para um checklist do que levar.

O agente só envia link que esteja nessa lista. Texto do material em frase curta, dizendo o que é e por que vale abrir.

## Mensagem com o link da proposta (quem envia é o dono)

Modelo para o dono usar depois de aprovar a página. Sem preço, o valor fica só na página:

> {nome}, montei a proposta com tudo o que você me contou na reunião. Está aqui: (link). Dá uma olhada com calma e me diz o que achou.
