# Rastreamento obrigatório de toda campanha

Regra do FeraBot: **campanha que você manda subir já nasce rastreada.** Não é pergunta e não é item opcional. Se o
rastreamento não fecha, a campanha não sobe, e o motivo vai para o chat em uma linha. Sem rastreamento você paga o anúncio
e não sabe qual anúncio trouxe o cliente.

## Checklist (tudo isto vai em toda campanha)

### 1. UTM no anúncio (`url_tags`)

Importe a constante, nunca reescreva à mão:

```python
import sys; sys.path.insert(0, "SkillsDoFera/meta-ads-fera/scripts")
from rastreamento import URL_TAGS
# no POST /adcreatives (ou /ads): "url_tags": URL_TAGS
```

`utm_source=meta&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_term={{adset.name}}&utm_content={{ad.name}}&utm_id={{campaign.id}}&ad_id={{ad.id}}&placement={{placement}}`

- `utm_source=meta` é o que o seu CRM ou planilha usa para contar contato vindo de anúncio pago. Não troque.
- **O nome do anúncio vira `utm_content`.** Se a sua página usa o `utm_content` para decidir algo (qual versão mostrar,
  qual oferta), o nome do anúncio tem que ser exatamente a chave que a página espera.
- Nomes de campanha, conjunto e anúncio legíveis e sem acento estranho: eles viram a UTM.

### 2. Pixel no conjunto e no anúncio

- Conjunto de conversão: `promoted_object = {pixel_id, custom_event_type}`. O pixel tem que ser o **mesmo que está instalado na
  página**. Produto novo começa a otimizar em `INITIATED_CHECKOUT` ou `LEAD`, não em `PURCHASE` (o evento de otimização não
  se edita depois de criado o conjunto).
- Anúncio: mande `tracking_specs` com o pixel, inclusive em campanha de tráfego ou engajamento, para a conversão aparecer
  no relatório:
  `"tracking_specs": [{"action.type": ["offsite_conversion"], "fb_pixel": ["<SEU_PIXEL>"]}]`
- O ID do pixel está no Gerenciador de Eventos. Não invente e não copie o de outra pessoa; o pré-voo mostra qual está
  instalado na sua página.

### 3. Página de destino: use o `rastreio.js`

Copie `SkillsDoFera/meta-ads-fera/assets/rastreio.js` para a raiz do seu site e carregue **depois** do pixel:

`<script src="/rastreio.js" data-pixel="SEU_PIXEL_ID" defer></script>`

Ele faz sozinho: guarda a origem (UTM, `fbclid`, `ad_id`) por 90 dias, primeiro e último toque; monta o `_fbc` a partir
do `fbclid`; repassa as UTMs para links de checkout (Hotmart, Cakto, Guru, Kiwify, PerfectPay).

Na página, três chamadas:

- no envio do formulário: `rastreio: FeraRastreio.dados("Lead")`
- antes do envio: `FeraRastreio.identificar({email, telefone, nome})` (correspondência avançada)
- no pixel: `fbq('track','Lead',{...},{eventID: FeraRastreio.eventId("Lead")})`
- se o `Lead` dispara em OUTRA página (a de obrigado), passe o id pelo `sessionStorage`.

Regras que continuam valendo:

- `fbq('init')` e `PageView` em toda página do funil.
- Evento de otimização disparado no momento real da conversão, **com `eventID`**.
- Ler o `fbclid` da URL e montar `_fbc` (`fb.1.<timestamp_ms>.<fbclid>`) quando o cookie ainda não existe. Mandar `_fbp`,
  `_fbc` e `event_id` ao backend junto com o formulário.
- Redirect que descarta a query string mata a UTM e o `fbclid`. O pré-voo pega.

### 4. API de Conversões (CAPI)

O pixel do navegador perde conversões (bloqueador, iOS, cookie). A CAPI manda o mesmo evento pelo servidor.

- Mesmo `event_name` e **mesmo `event_id`** do navegador: a Meta junta os dois e conta uma vez (deduplicação).
- `POST https://graph.facebook.com/v21.0/<PIXEL>/events`, com `action_source: "website"`, `event_source_url` e `event_time`.
- `user_data`: `em` e `ph` em SHA-256 (minúsculo, sem espaço; telefone com DDI 55 e só dígitos), `fn` e `ln` com hash quando
  tiver, `fbp` e `fbc` CRUS, `client_ip_address` e `client_user_agent`.
- Falha da CAPI nunca derruba a captura do lead (o contato vale mais), mas **registra o erro**: silêncio esconde token vencido.
- O token fica em variável de ambiente (`META_CAPI_TOKEN` no `.env`), nunca no código nem no repositório.
- Endpoint novo: valide uma vez com `test_event_code` (Gerenciador de Eventos, Testar eventos) e confira que o evento aparece
  como "Navegador e Servidor, deduplicado".
- Sem backend (página estática sem função)? Faça o pixel do navegador com `eventID` e, quando puder, uma função
  serverless (Netlify Functions) só para a CAPI. Pixel sem CAPI sobe, mas o pré-voo avisa.

### 5. Variações de destino

| Destino | Rastreamento |
|---|---|
| Página própria | itens 1 a 4 completos |
| Checkout externo (Hotmart, Cakto, Guru, PerfectPay) | UTM repassada ao checkout (`src`, `sck` ou utm), pixel configurado na plataforma, compra via CAPI ou webhook da plataforma |
| WhatsApp (clique para mensagem) | sem página: nome do anúncio identificável e o `ctwa_clid` da conversa guardado onde você registra o contato |
| Formulário instantâneo | contato sincronizado com `ad_id` e nome do anúncio |

### 6. Qualidade de correspondência e valor

- Todo evento leva o máximo de identificadores: e-mail, telefone, nome, `fbc`, `fbp`, IP e navegador do momento. A meta é
  qualidade de correspondência (EMQ) de pelo menos 6 no evento de otimização, no Gerenciador de Eventos.
- `Purchase` sempre com `value` e `currency`. `Lead` com valor só quando você tiver o número real (ticket × taxa de
  fechamento). Não estime.

### 7. Padrão de nome (vira a UTM)

`AAAA-MM-DD_<oferta>_<publico>_<objetivo>` na campanha · `<publico>_<geo>_<idade>` no conjunto · `<nn>-<angulo>-<formato>`
no anúncio (ex.: `03-medo-de-aparecer-video`). Sem acento; espaço vira `-`.

### 8. Domínio e privacidade (confira uma vez por domínio)

- Domínio verificado no Gerenciador de Negócios.
- A política de privacidade da página cita pixel, API de Conversões e uso de dados para anúncio.
- Não guarde IP nem navegador do lead: eles só vão no evento da hora.

## Pré-voo: rode antes de subir (obrigatório)

```bash
PYTHONUTF8=1 python SkillsDoFera/meta-ads-fera/scripts/rastreamento.py \
  --url <página de destino> --pixel <pixel do conjunto> --evento <LEAD|PURCHASE|INITIATED_CHECKOUT...>
```

- **FALHA** (pixel ausente ou errado, evento de otimização ausente, sem PageView, redirect que come a UTM, `url_tags` sem UTM):
  **não suba.** Corrija a página ou diga ao dono o que falta.
- **ALERTA** (sem `eventID`, sem `fbclid`, `_fbp` e `_fbc` não vão ao servidor): sobe, mas corrija a página na mesma
  tarefa quando ela for sua.
- Evento que dispara em outra página do funil (obrigado): `--tambem <url-da-página-de-obrigado>`.
- Precisa de `pip install requests`. Testes: `python -m pytest SkillsDoFera/meta-ads-fera/scripts -q`.

## Relato no fim da subida

Uma linha por campanha: `rastreamento: UTM ✓ · pixel <id> ✓ · <Evento> c/ eventID ✓ · CAPI ✓/✗`. O que ficou ✗ vai com o motivo.

## Depois de 24 a 48 horas

Confira no Gerenciador de Eventos: o evento chegando por navegador **e** servidor, deduplicado, e a qualidade de
correspondência. Cruze com o seu registro de contatos (`utm_source=meta`): essa é a verdade de campo, porque o evento da
Meta costuma contar menos do que o real.
