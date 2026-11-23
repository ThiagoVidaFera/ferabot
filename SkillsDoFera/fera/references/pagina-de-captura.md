# Padrão de página de captura (regra do Thiago, 23/11/2026)

Vale para TODA página que gera lead, em qualquer skill (`/paginas-e-quiz`, `/funil-reuniao-fantasma`,
`/squad-onboarding`, `/squad-isca-fera`, página de vendas com reunião). Sem pedir de novo. Página que não segue
este padrão não sai.

## A ordem no começo do dono

1. Painel ligado (`painel.py conectar`) e **briefing do negócio respondido** na tela Briefing do painel
   (`painel.py puxar` traz para `output/fera/briefing.json`).
2. **Primeira página de captura** (este padrão), a partir do briefing e do plano.
3. **Posts que convidam para a página** (3 a 6, cada um com a chamada para o link da bio ou do story).
4. **Página de isca digital gratuita**: um PDF que o FERABOT cria (`/squad-isca-fera` ou `/webinar-pdf`), com
   página de obrigado que oferece a **reunião rápida de 20 minutos** para entender como aplicar o material.

## 1. Dois caminhos, sempre

Na primeira dobra, no fecho e na barra fixa que aparece depois de rolar:

> Escolha a opção mais adequada ao seu perfil.
> **[Marcar uma reunião de 20 minutos]**  **[Conversar direto no WhatsApp]**

## 2. Os dois abrem o mesmo formulário curto (modal)

Campos, nesta ordem:
1. Nome
2. WhatsApp com DDD
3. E-mail
4. Instagram (@)
5. **Uma pergunta que qualifica** (escolha única, 3 a 4 opções), tirada do briefing: o momento da pessoa, o que
   ela já tentou ou a faixa de investimento. Ex.: "Em que momento você está?" / "Já fez [x] antes?".
6. Campo invisível `company` (armadilha de robô; se vier preenchido, não envia).

Botão do formulário: **"Solicitar orçamento"** nos dois caminhos (pode completar: "Solicitar orçamento e
escolher horário" / "Solicitar orçamento pelo WhatsApp"). Nunca "Enviar".

## 3. Ao enviar: lead no painel + evento Lead, ANTES de sair da página

```js
const eventId = crypto.randomUUID();
fbq('track', 'Lead', { content_name: '<título da página>', escolha }, { eventID: eventId });
await fetch('<endereço do painel>/api/leads/entrada', {
  method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nome, whatsapp, email, instagram, company,
    funil: 'captura-<slug>', origem: 'pagina-captura', pagina: '<slug>',
    fonte: escolha === 'call' ? '<slug>-reuniao' : '<slug>-whatsapp',
    respostas_texto: { qualificacao: { pergunta: '<a pergunta>', resposta } },
    utm_source, utm_medium, utm_campaign, utm_content, utm_term, utm_id, ad_id, placement,
    fbclid, fbc, fbp, event_id: eventId, origem_url: location.href,
  }),
}).catch(() => {});   // painel fora do ar não segura a pessoa
```

- O endereço do painel vem do `painel.json` (campo `url`). O código de ligação NUNCA vai para a página.
- O mesmo `event_id` vai no Pixel e no painel: o painel manda o Lead pela API de Conversões e a Meta não conta
  em dobro. Precisa do **pixel** e do **token da Meta** na tela Chaves.
- Espere no máximo 1,5 s pelo painel e siga.

## 4. Depois do formulário

- **Reunião de 20 minutos:** abre o link de agendamento do dono (página de agendamento do Google Agenda ou o
  que estiver no perfil como `link_agenda`), com nome e e-mail já preenchidos quando o serviço aceita.
- **WhatsApp:** abre `https://wa.me/<número com 55>?text=<mensagem>` com mensagem personalizada e a origem:
  "Oi, <nome do dono>! Sou <nome>, vim pela página <título> (<utm_source> / <utm_campaign>). <resposta da
  qualificação>. Quero um orçamento."

## 5. Rastreamento (melhores práticas)

- Pixel com `PageView` em toda página. `Lead` só no envio do formulário, com `eventID`.
- Guardar as UTMs e o `fbclid` da URL de entrada em `sessionStorage` e mandar em todo envio. Com `fbclid` e sem
  cookie `_fbc`, montar `fb.1.<agora em ms>.<fbclid>`.
- Todo link de anúncio, post e bio leva UTM (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`).
- Página de obrigado não dispara `Lead` de novo.

## 6. Página e texto

Mobile-first (375px), primeira dobra com promessa + os dois botões, prova só real, rodapé com Política de
Privacidade e Termos. Texto aprovado pelo dono antes de montar. Publicar com a chave da Netlify.

## 7. Teste obrigatório antes de dizer que está no ar

Preencher pelos DOIS caminhos com o nome do dono e conferir com ele: o lead apareceu em Leads no painel com a
resposta da qualificação e a origem; o WhatsApp abriu com a mensagem certa; o agendamento abriu; o evento Lead
apareceu no Gerenciador de Eventos (aba Testar eventos). Depois:
`python ScriptsFera/painel.py marco pagina --link "<endereço da página>"`.
