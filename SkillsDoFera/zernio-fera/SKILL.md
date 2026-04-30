---
name: zernio-fera
description: Configura e gerencia automações de DM no Instagram via Zernio. Cria keyword triggers pra responder automaticamente quem comenta ou manda mensagem com palavras-chave. Setup de webhook via Cloudflare Worker opcional.
---

# Zernio Fera

Fera, vamos fazer o Instagram trabalhar enquanto você dorme!

## Pré-requisito

Ler `perfil.json` antes de qualquer coisa.

## O que o Zernio Fera faz

Configura automações de resposta no Instagram:
1. **Comentário → DM:** quando alguém comenta com uma keyword, recebe DM automático
2. **DM → resposta:** quando alguém manda mensagem com keyword, recebe resposta automática
3. **Gerenciar keywords:** listar, criar, pausar automações existentes

## Setup inicial (uma vez)

Verificar se `.env` existe com:
```
ZERNIO_API_KEY=sua-chave-aqui
ZERNIO_PROFILE_ID=id-do-perfil-instagram
```

Se não existir, guiar o fera:
1. Acessar [zernio.com](https://zernio.com) e criar conta
2. Conectar conta do Instagram (perfil `{{handle_instagram}}`)
3. Em Configurações → API Keys → gerar nova chave
4. Em Perfis → copiar o ID do perfil conectado

## Comandos disponíveis

Quando o fera invocar `/zernio-fera`, perguntar o que quer fazer:

**1. Criar automação nova**
**2. Listar automações ativas**
**3. Pausar automação**
**4. Ver logs de disparos**
**5. Setup completo (primeira vez)**

## [Criar Automação Nova]

Perguntar ao fera:
1. **Keyword:** qual palavra vai acionar a automação? (ex: GUIA, CONSULTORIA, MENTORIA)
2. **Mensagem de resposta:** o que o seguidor vai receber?
3. **Tipo:** comentário em post específico / qualquer post / DM direto?
4. **Post específico?** Se sim, qual a URL ou ID do post?

### Mensagem padrão (adaptar pro nicho)
```
Oi [nome]! Aqui está o [produto/material] que você pediu:

[link ou próximo passo]

Qualquer dúvida, é só responder aqui! 🔥
```

### Criar automação via API

```python
import requests, os

ZERNIO_API_KEY = os.environ["ZERNIO_API_KEY"]
ZERNIO_PROFILE_ID = os.environ["ZERNIO_PROFILE_ID"]

headers = {"x-api-key": ZERNIO_API_KEY, "Content-Type": "application/json"}

payload = {
    "profileId": ZERNIO_PROFILE_ID,
    "keyword": keyword.upper(),
    "message": mensagem,
    "type": "comment",  # ou "dm"
    # "platformPostId": post_id  # omitir para funcionar em qualquer post
}

r = requests.post(
    "https://api.zernio.com/v1/comment-automations",
    headers=headers,
    json=payload
)

if r.status_code == 200:
    print(f"[OK] Automação criada para keyword: {keyword}")
    print(f"     ID: {r.json()['_id']}")
else:
    print(f"[ERRO] {r.status_code}: {r.text}")
```

**Importante:** omitir `platformPostId` cria automação global (funciona em qualquer post). Usar isso como padrão.

## [Listar Automações]

```python
r = requests.get(
    "https://api.zernio.com/v1/comment-automations",
    headers=headers,
    params={"profileId": ZERNIO_PROFILE_ID}
)
automations = r.json()
for a in automations:
    status = "✓ ATIVA" if a.get("active", True) else "✗ PAUSADA"
    print(f"  {status} | {a['keyword']} | ID: {a['_id'][:8]}...")
```

## [Ver Logs]

```python
r = requests.get(
    "https://api.zernio.com/v1/comment-automations/logs",
    headers=headers,
    params={"profileId": ZERNIO_PROFILE_ID, "limit": 20}
)
logs = r.json()
for log in logs:
    print(f"  {log.get('createdAt', '')[:10]} | {log.get('keyword', '')} | {log.get('status', '')}")
```

## Evitar keywords duplicadas

Antes de criar uma keyword nova, sempre verificar se já existe:
```python
existing = [a["keyword"].upper() for a in automations]
if keyword.upper() in existing:
    print(f"[AVISO] Keyword '{keyword}' já existe. Quer substituir?")
```

## Salvar keywords configuradas

Manter registro em `output/zernio/keywords.json`:
```json
{
  "keywords": [
    {
      "keyword": "GUIA",
      "automation_id": "xxx",
      "criado_em": "2026-01-01",
      "descricao": "Isca digital - Guia do nicho"
    }
  ]
}
```

## Integração com outras skills

Quando o fera cria conteúdo com CTA que usa keyword:
- `/squad-carrossel-fera` → slide 10 pode ter keyword no CTA
- `/squad-stories-fera` → camada 5 (CTA) usa keyword
- `/squad-isca-fera` → keyword pra entregar o material
- `/jack-fera` → CTA da landing page pode usar keyword

Quando uma skill mencionar keyword, verificar se já está configurada no Zernio. Se não estiver, oferecer: "Quer que eu configure a automação dessa keyword agora?"

## QA antes de ativar

- [ ] Keyword em CAPS_LOCK (padrão Zernio)
- [ ] Mensagem sem links quebrados
- [ ] Automação global (sem platformPostId específico), salvo se intencional
- [ ] Não há duplicata da keyword

## Comunicação após criar automação

> "Fera, automação ativa! Agora toda vez que alguém comentar ou mandar '[keyword]' você, ele vai receber a mensagem automaticamente. Quer criar mais alguma keyword ou ver os disparos de automações existentes?"
