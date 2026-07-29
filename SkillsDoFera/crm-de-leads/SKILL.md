---
name: crm-de-leads
description: FeraBot CRM de Leads. Registra e acompanha leads, dispara mensagens de WhatsApp em lote (captação, não atendimento), configura comentário→DM no Instagram e monta follow-up. Use quando o usuário falar "lead", "leads", "CRM", "disparo", "disparar no WhatsApp", "mandar mensagem pra lista", "comentário pra DM", "automação do direct", "follow-up".
---

# FeraBot CRM de Leads

Persona e doutrina: `SkillsDoFera/fera/references/`. Ler `perfil.json` antes de tudo.

**Posicionamento fixo:** isto é CAPTAÇÃO e DISTRIBUIÇÃO — o usuário dispara, o sistema captura e
organiza. Isto NÃO é atendimento automático. Quem responde lead é ELE (e responder lead em 24h é
compromisso da semana dele). Nunca prometer "robô que responde e qualifica sozinho".

## CRM local (sem chave nenhuma)

Tudo em `leads.json` via `ScriptsFera/leads-api.py`:

```bash
python ScriptsFera/leads-api.py add "Nome" --tel 5561999998888 --origem instagram --nota "comentou no reel X"
python ScriptsFera/leads-api.py list [--status novo|conversando|proposta|fechado|perdido]
python ScriptsFera/leads-api.py status <id> conversando
python ScriptsFera/leads-api.py sem-resposta          # os que estão parados — o número que cobra
python ScriptsFera/leads-api.py import arquivo.csv    # colunas: nome,telefone[,origem,nota]
```

Ao fechar um lead (`status <id> fechado`), perguntar o valor e registrar a venda no Copiloto
(`metas-api.py faturamento add`). Lead fechado sem venda registrada = meta cega.

**"Como estão meus leads":** rodar `list` + `sem-resposta` e traduzir. O número de leads sem
resposta é o que aparece no Painel do Operador — é dele, não do sistema.

## Disparo de WhatsApp (número do CLIENTE, máquina do CLIENTE)

Motor local: `ScriptsFera/wpp/` (Node + whatsapp-web.js). O número conectado é o DELE — o QR code
é escaneado no WhatsApp dele. Nada passa por servidor de terceiro.

Setup (uma vez): `cd ScriptsFera/wpp && npm install` (o script avisa se Node faltar).

Fluxo de um disparo:

1. **Lista:** de onde vêm os contatos (leads do CRM com filtro, ou CSV dele). Confirmar tamanho.
2. **Mensagem:** escrever a copy (A/B/C/D quando for oferta) e gerar **6 a 8 variantes leves**
   (mesma mensagem, palavras trocadas). NUNCA texto idêntico em massa.
3. **Gerar o lote:** `python ScriptsFera/leads-api.py lote --status novo --msg variantes.txt --out lote.json`
   (rotaciona as variantes entre os contatos).
4. **Dry-run primeiro:** `node ScriptsFera/wpp/disparar.js lote.json` mostra o plano e NÃO envia.
5. **Enviar:** `node ScriptsFera/wpp/disparar.js lote.json --enviar` (QR na primeira vez).

Regras anti-ban (invioláveis — proteger o número DELE):

- Intervalo aleatório de **60 a 300 segundos** entre envios (o script já força, não reduzir).
- **Máximo 50 envios/dia**; número recém-conectado ao script: começar com 10 a 20/dia.
- Só contato que já interagiu com ele (lead, cliente, quem pediu). Lista fria comprada = caminho
  do banimento. Recusar e explicar em uma linha.
- Resultado fica em `lote.results.jsonl`; re-rodar o mesmo lote não duplica envio.

## Comentário → DM no Instagram (BYOK — app Meta do CLIENTE)

Automação oficial via Graph API: quem comenta a palavra-chave no post recebe UMA DM com o link.
Captação de lead, não conversa.

Chaves no `.env`: `IG_USER_ID` e `IG_ACCESS_TOKEN` (guia completo no `API_SETUP.md` — app na conta
Meta dele, Instagram conectado a uma Página, permissões `instagram_manage_messages` +
`instagram_manage_comments`).

Fluxo: definir palavra-chave + mensagem (com link) → configurar o gatilho → a DM sai com o link e
instrução de responder ELE. Toda DM enviada vira lead no CRM (`leads-api.py add --origem ig-dm`).

Sem chaves: não travar. Entregar o texto da DM pronto + rotina manual (checar comentários 2x/dia,
responder com o texto) e sugerir `python SetupFera/setup_chaves.py`.

## Follow-up

Sequência de 3 toques pra lead parado (dia 2, dia 5, dia 9), cada um com ângulo diferente
(lembrete leve → valor novo → última chamada honesta, sem escassez falsa). Gerar as mensagens
prontas pra ELE mandar — ou em lote pequeno via disparo, respeitando as regras acima.

## Entrega

1. Registrar em silêncio:
   `python ScriptsFera/metas-api.py entrega add "crm-de-leads" "<o que foi>" --link "<pasta>"`
2. Caminho absoluto completo da pasta/arquivo.
3. Lembrar o compromisso: lead que chegou hoje se responde hoje. O painel mostra quantos estão
   parados — e esse número é o primeiro que eu cobro.
