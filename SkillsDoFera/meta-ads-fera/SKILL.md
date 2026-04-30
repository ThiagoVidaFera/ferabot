---
name: meta-ads-fera
description: Gerencia campanhas de anúncios no Meta Ads (Facebook/Instagram) para o mentor. Cria, atualiza, lê resultados e pausa campanhas via facebook-business SDK. Configurado com os dados do perfil.
---

# Meta Ads Fera

Fera, vamos colocar dinheiro trabalhando pelos seus anúncios!

## Pré-requisito

Ler `perfil.json` antes de qualquer coisa.

## O que o Meta Ads Fera faz

1. **Setup:** configura credenciais Meta (uma vez só)
2. **Criar campanha:** campanha completa (campanha → conjunto → anúncio)
3. **Ler resultados:** performance dos últimos 7/30 dias
4. **Pausar/ativar:** controlar campanhas pelo Claude Code
5. **Subir criativos:** upload de imagens e vídeos pra biblioteca

## Dependências

```bash
pip install facebook-business python-dotenv
```

## Setup inicial (uma vez)

Verificar se `.env` existe na raiz do Ferabot com:
```
META_ACCESS_TOKEN=EAAxxxx
META_AD_ACCOUNT_ID=act_XXXXXXXX
META_APP_ID=XXXXXXXX
META_APP_SECRET=XXXXXXXX
```

Se não existir, guiar o fera:
1. Abrir [business.facebook.com](https://business.facebook.com) → Configurações → Integrações → Meta Business
2. Criar app ou usar existente
3. Gerar token de acesso com permissões: `ads_management`, `ads_read`, `business_management`
4. Copiar Ad Account ID do Gerenciador de Anúncios (formato: act_XXXXXXXXX)

## Padrão de campanha (Lead Generation)

Estrutura padrão validada para mentorias:

### Campanha
```python
campaign = {
    "name": f"{perfil['produto']} — Leads — {hoje}",
    "objective": "LEAD_GENERATION",
    "status": "PAUSED",  # ativa manualmente após revisar
    "special_ad_categories": [],
}
```

### Conjunto de anúncios
```python
ad_set = {
    "name": "Público Frio — Interesses",
    "campaign_id": campaign_id,
    "billing_event": "IMPRESSIONS",
    "optimization_goal": "LEAD_GENERATION",
    "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
    "daily_budget": 5000,  # R$ 50,00 em centavos
    "targeting": {
        "age_min": 25,
        "age_max": 55,
        "genders": [1, 2],
        "geo_locations": {"countries": ["BR"]},
        "interests": [],  # fera preenche com interesses do nicho
    },
    "status": "PAUSED",
}
```

### Anúncio
```python
ad = {
    "name": f"Criativo 01 — {perfil['produto']}",
    "adset_id": ad_set_id,
    "creative": {"creative_id": creative_id},
    "status": "PAUSED",
}
```

## Criativo de anúncio

Gerar criativos usando artes das outras skills:
- **Imagem:** `/squad-carrossel-fera` (slide 1) ou arte de 1080×1350 do `/squad-stories-fera`
- **Vídeo:** reels gerados por `/squad-slides-fera`

Para subir imagem:
```python
from facebook_business.adobjects.adaccount import AdAccount
from facebook_business.adobjects.adimage import AdImage

image = AdImage(parent_id=f"act_{AD_ACCOUNT_ID}")
image[AdImage.Field.filename] = "path/to/image.png"
image.remote_create()
image_hash = image[AdImage.Field.hash]
```

## Comandos disponíveis

Quando o fera invocar `/meta-ads-fera`, perguntar o que quer fazer:

**1. Criar campanha nova**
- Briefing: objetivo, público-alvo, orçamento diário, criativo
- Gerar estrutura completa (campanha + conjunto + anúncio) com status PAUSED
- Confirmar antes de criar

**2. Ver resultados**
- Pedir período: 7 dias / 30 dias / personalizado
- Mostrar: gasto, impressões, cliques, CPL, leads

**3. Pausar / ativar campanha**
- Listar campanhas ativas
- Confirmar qual pausar/ativar

**4. Subir criativo**
- Receber path de imagem/vídeo
- Upload pra biblioteca Meta
- Retornar hash/ID para usar em anúncios

**5. Relatório de saúde**
- Top 3 campanhas por CPL
- Campanhas com gasto alto e zero resultado (sinalizar pra pausar)

## Leitura de resultados

```python
from facebook_business.adobjects.adaccount import AdAccount

account = AdAccount(f"act_{AD_ACCOUNT_ID}")
campaigns = account.get_campaigns(fields=[
    "name", "status", "insights{spend,impressions,clicks,cost_per_lead}"
])
```

## Salvar configuração de campanha

Após criar campanha, salvar em:
`output/meta-ads/YYYY-MM-DD/campanha-[nome].json`

## QA antes de ativar qualquer campanha

- [ ] Status inicial = PAUSED (sempre)
- [ ] Orçamento diário revisado pelo fera
- [ ] Criativo aprovado visualmente
- [ ] URL de destino funcionando
- [ ] Público-alvo alinhado com nicho do perfil

## Comunicação após criar campanha

> "Fera, campanha criada no Meta Ads! Está pausada pra você revisar no Gerenciador de Anúncios antes de ativar. Nome: [nome da campanha]. Quer que eu gere um relatório de saúde das suas campanhas existentes?"
