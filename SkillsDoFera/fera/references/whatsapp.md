# WhatsApp do dono — numa VPS dele, ligado ao painel

O WhatsApp **não roda no painel nem neste computador**. Roda numa VPS do próprio dono: o número é
dele, o endereço de internet é só dele e, se um dia ele sair da consultoria, o WhatsApp continua dele.

São duas fases. **Sempre nesta ordem: QR code primeiro, API oficial depois.**

| | Fase 1: QR code (padrão) | Fase 2: API oficial da Meta |
|---|---|---|
| Quando | agora, no passo 4 da Jornada | quando for disparar para lista ou tiver volume todo dia |
| Custo | só a VPS (planos de entrada a partir de uns R$ 30 por mês) | sem VPS, mas a Meta cobra por mensagem (conferir a tabela atual da Meta antes de citar valor) |
| Montagem | 15 a 30 minutos | 1 a 3 dias, por causa da verificação da empresa |
| Risco de bloqueio | existe se disparar em massa | não existe por QR; mensagem fora de 24h só com modelo aprovado |

Nunca oferecer a Fase 2 antes da Fase 1 estar de pé, salvo se o dono pedir.

## Fase 1 — WhatsApp por QR code na VPS dele

Uma etapa por mensagem. Esperar ele confirmar antes da próxima.

1. **A VPS.** Ele contrata uma VPS com **Ubuntu 22.04 ou 24.04**, 2 GB de RAM ou mais (na Hostinger, o
   plano KVM 1 serve). Na hora de criar, escolhe Ubuntu sem painel extra. Ele te manda **só o IP**.
   Nunca pedir senha da VPS no chat.
2. **A chave de acesso.** Rodar:

   ```bash
   python ScriptsFera/whatsapp_vps.py chave-ssh
   ```

   Mostrar a linha que começa com `ssh-ed25519` e pedir para ele colar no painel da VPS, em
   "Chaves SSH" (na Hostinger: VPS, Configurações, Chaves SSH, Adicionar). Isso troca a senha por uma
   chave que só este computador tem.
3. **Endereço (opcional).** Se ele tem domínio, pedir um registro A `whatsapp` apontando para o IP e usar
   `--dominio whatsapp.dominiodele.com.br`. Sem domínio, seguir sem a opção: o script usa um nome
   automático que aponta para o IP e tira o certificado HTTPS sozinho.
4. **Instalar e ligar no painel:**

   ```bash
   python ScriptsFera/whatsapp_vps.py instalar --ip <IP> [--dominio <dominio>]
   ```

   Leva de 5 a 15 minutos na primeira vez. No fim, o servidor fica ligado ao painel. A chave do
   servidor fica em `whatsapp.json` (fora do git) e no painel. **Nunca mostrar essa chave no chat.**
5. **Ler o QR.** Mandar ele abrir o painel, em **Configurações > Seu WhatsApp**, clicar em **Conectar** e
   ler o QR com o celular do número (WhatsApp > Aparelhos conectados > Conectar um aparelho).
6. **Conferir:**

   ```bash
   python ScriptsFera/painel.py whatsapp-estado
   ```

   Tem que aparecer `conectado`. Pedir para ele mandar um "oi" de outro celular e ver chegar na Inbox
   do painel.

Deu erro de acesso na VPS: quase sempre é a chave pública que não foi colada, ou foi colada pela metade.
Deu "não respondeu por HTTPS" com domínio próprio: o registro A ainda não propagou. Esperar 10 minutos
e rodar o `instalar` de novo (ele é seguro de repetir e mantém a mesma chave).

**Regras da Fase 1, ditas na cara:** o número é de atendimento, não de disparo. Responder quem chegou
pela página e pelo anúncio, com ritmo de gente. Disparo para lista é Fase 2.

## Fase 2 — API oficial do WhatsApp (Meta)

Oferecer quando ele disser que quer disparar para lista, quando o volume diário passar de algumas
dezenas de conversas, ou se o número da Fase 1 tomar restrição.

1. **Número.** O número da API oficial não pode estar ativo no aplicativo do WhatsApp. Ou ele usa um
   número novo, ou migra o atual (perde o uso no aplicativo do celular). Explicar isso antes de tudo.
2. **Conta.** No Gerenciador de Negócios da Meta (business.facebook.com): verificar a empresa, criar a
   conta do WhatsApp Business (WABA) e adicionar o número.
3. **App e token.** Em developers.facebook.com, criar um app do tipo Negócios com o produto WhatsApp.
   Criar um usuário do sistema com as permissões `whatsapp_business_messaging` e
   `whatsapp_business_management` e gerar um **token permanente**.
4. **No painel:** em Configurações > Seu WhatsApp > "Depois: API oficial", colar o **ID do número**
   (phone_number_id) e o token. Ali também aparecem a **URL de retorno** e o **token de verificação**.
5. **Webhook no app da Meta:** em WhatsApp > Configuração, colar a URL de retorno e o token de
   verificação que o painel mostrou, e assinar o campo `messages`.
6. **Modelos.** Mensagem que começa a conversa, ou que sai depois de 24 horas sem resposta do lead,
   só com modelo aprovado pela Meta. Montar os modelos com ele (lembrete de reunião, retomada de
   conversa) e enviar para aprovação.
7. **Virar a chave.** Em Configurações, marcar o número oficial como padrão. Desligar a Fase 1 só
   depois de uma semana com a oficial funcionando.

Nunca citar preço da Meta de memória: a tabela muda. Abrir a página de preços da Meta com ele.
