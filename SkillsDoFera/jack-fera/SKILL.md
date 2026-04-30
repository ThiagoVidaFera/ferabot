---
name: jack-fera
description: Gera landing pages e páginas de venda completas personalizadas para o mentor. 9 seções: hero, dor, solução, mecanismo, prova social, oferta, bônus, garantia, CTA. Dark premium. Deploy via Netlify opcional.
---

# Jack Fera

Fera, vamos construir sua página de venda! Isso aqui vai converter.

## Pré-requisito

Ler `perfil.json` antes de qualquer coisa.

## O que o Jack Fera entrega

Uma landing page HTML completa, dark premium, responsiva, com copy personalizada pro nicho e produto do mentor. Pode ser usada como:
- Página de vendas da mentoria
- Página de captura de lead
- Página de obrigado pós-opt-in
- Página de apresentação de proposta

## Fluxo obrigatório

```
[01] Briefing → [02] Copy (aprovação) → [03] HTML → [04] Deploy (opcional) → [05] Entrega
```

## [01] Briefing

Perguntar ao fera:
1. **Tipo de página:** vendas / captura / obrigado / proposta
2. **Produto/oferta:** usar `produto` e `preco` do perfil ou outro?
3. **CTA principal:** comprar / agendar call / baixar material / entrar no grupo?
4. **Deploy automático?** Sim (Netlify) ou só o arquivo HTML?

## [02] Copy das 9 seções

Gerar toda a copy antes de criar o HTML:

### Seção 1 — Hero
- Headline: entrega o resultado final em 1 linha (específico ao nicho)
- Subheadline: para quem é + o que vai acontecer
- CTA hero: botão primário
- Nunca genérico — usar nicho e produto do perfil

### Seção 2 — Dor
- 3 situações de dor que o avatar sente hoje
- Formato: "Você está cansado de [situação concreta]?"
- Específicas ao nicho

### Seção 3 — Solução
- O que muda com o produto
- 3 transformações concretas
- Antes/depois do avatar

### Seção 4 — Mecanismo Único
- Como o produto funciona diferente dos outros
- Nomear o mecanismo (ex: "Método X", "Sistema Y")
- 3-5 passos do processo

### Seção 5 — Prova Social
- 3 depoimentos (usar genéricos se não tiver reais, com aviso)
- Nome + foto placeholder + resultado específico
- Evitar "mudou minha vida" sem dados

### Seção 6 — Oferta
- O que está incluído (lista com checkmarks)
- Preço do `perfil.json`
- Ancoragem de valor (o que custaria separado)

### Seção 7 — Bônus (se aplicável)
- Máx 3 bônus
- Cada um com valor monetário

### Seção 8 — Garantia
- Garantia de satisfação (tempo e condições)
- Tom: "Risco zero pra você"

### Seção 9 — CTA Final
- Repetir headline do hero com urgência
- Botão final com `landing_page` do perfil

**Apresentar ao fera para aprovação antes de criar o HTML.**

## [03] Geração do HTML

Após APROVADO:

### Design system
```css
:root {
  --bg: #0A0A0F;
  --surface: #1A1A24;
  --text: #FFFFFF;
  --muted: #8B8B95;
  --accent: {{cor_primaria}};        /* do perfil */
  --accent2: {{cor_secundaria}};     /* do perfil */
  --radius: 16px;
  --max-width: 860px;
}
```

### Estrutura de seções
- Cada seção é um `<section>` com `id` semântico
- Padding vertical: `clamp(60px, 8vw, 120px)`
- Container: `max-width: var(--max-width); margin: 0 auto; padding: 0 24px;`
- Títulos de seção: 48-64px bold, cor accent
- Corpo: 18-22px, line-height 1.7, cor muted
- CTAs: pill larga, `background: var(--accent)`, texto dark, font-weight 700

### Responsividade obrigatória
- Mobile-first
- Imagens: `max-width: 100%`
- Grid de 2 colunas colapsa pra 1 em mobile

### Salvar em
`output/landing-pages/YYYY-MM-DD/index.html`

## [04] Deploy Netlify (opcional)

Se o fera quiser deploy:

```python
import hashlib, requests, os, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "ScriptsFera"))
from lib import load_perfil

perfil = load_perfil()
NETLIFY_TOKEN = os.environ.get("NETLIFY_TOKEN")  # via .env
handle = perfil["handle_instagram"].replace("@", "")
site_name = f"{handle}-fera"

html_path = Path("output/landing-pages") / ...  # caminho gerado

# 1. Criar site
r = requests.post(
    "https://api.netlify.com/api/v1/sites",
    headers={"Authorization": f"Bearer {NETLIFY_TOKEN}"},
    json={"name": site_name}
)
site_id = r.json()["id"]

# 2. Deploy arquivo
content = html_path.read_bytes()
sha1 = hashlib.sha1(content).hexdigest()
r = requests.put(
    f"https://api.netlify.com/api/v1/deploys/{site_id}/files/index.html",
    headers={
        "Authorization": f"Bearer {NETLIFY_TOKEN}",
        "Content-Type": "text/html",
        "X-Content-SHA1": sha1,
    },
    data=content
)
print(f"Deploy: https://{site_name}.netlify.app")
```

## [05] Entrega

1. Confirmar: "Fera, sua página está em `output/landing-pages/YYYY-MM-DD/index.html`"
2. Se deploy feito: fornecer URL Netlify
3. Instrução: "Abra o arquivo no browser pra revisar antes de colocar no ar."

## QA antes de entregar

- [ ] Todas as 9 seções presentes
- [ ] `{{handle_instagram}}`, `{{produto}}` e `{{preco}}` substituídos
- [ ] CTA principal linkado para `{{landing_page}}` do perfil
- [ ] Responsivo (testado mentalmente em 390px e 1440px)
- [ ] Nenhum link quebrado
- [ ] Dark premium visualmente coerente

## Comunicação após entrega

> "Fera, página de venda pronta! Está salva em `output/landing-pages/`. Abre no browser pra revisar antes de publicar. Quer que eu gere os anúncios pro Meta Ads apontando pra essa página?"
