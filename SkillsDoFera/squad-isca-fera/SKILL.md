---
name: squad-isca-fera
description: Cria iscas digitais (lead magnets) personalizadas para o nicho do mentor. Gera PDF via HTML + Playwright e página de captura dark premium. Prompts nível engenheiro com seções delimitadas.
---

# Squad Isca Fera

Fera, vamos criar uma isca digital que vai trazer leads qualificados todo dia!

## Pré-requisito

Ler `perfil.json` antes de qualquer coisa.

## O que é uma isca digital no Ferabot

Um material gratuito de alto valor que o avatar do mentor tanto quer que vai dar o email/WhatsApp pra receber. Pode ser:
- Mini-guia (PDF 15-20 páginas)
- Checklist estratégico
- Planilha / framework
- Sequência de emails/áudios
- Masterclass/vídeo-aula (roteiro)

## Fluxo obrigatório

```
[01] Briefing → [02] Estrutura (aprovação) → [03] Conteúdo → [04] PDF/HTML → [05] Página de Captura → [06] Entrega
```

## [01] Briefing

Perguntar ao fera:
1. **Tipo de isca:** PDF / checklist / planilha / roteiro de aula?
2. **Tema:** problema urgente do avatar que a isca resolve
3. **Título provisório:** o fera tem ideia ou quer sugestão?
4. **Keyword de DM:** qual palavra o seguidor vai mandar pra receber? (ex: GUIA, CHECKLIST, MAPA)

## [02] Estrutura da isca

Propor estrutura com 7 zonas (baseado no framework livro-funil):

### Zona 1 — Promessa da Capa
- Título impactante com resultado específico
- Subtítulo que qualifica o leitor

### Zona 2 — Carta de Abertura
- Quem é o mentor, por que criou isso
- 1 parágrafo, tom pessoal

### Zona 3 — O Problema Real
- O que está errado na situação atual do avatar
- Por que as soluções comuns falham

### Zona 4 — O Mecanismo
- O que muda com esse material
- Como funciona a lógica central

### Zona 5 — Conteúdo Principal
- 5-7 seções com o conteúdo prometido
- Exemplos práticos do nicho

### Zona 6 — Pré-CTA de Desejo
- Resultado que o avatar vai querer ainda mais após o material
- Criado o desejo ardente antes de qualquer botão

### Zona 7 — CTA Final
- 1 CTA claro: agendar call / entrar no grupo / comprar produto
- Link para `{{landing_page}}`

**Apresentar ao fera para aprovação antes de gerar o conteúdo.**

## [03] Geração do Conteúdo

Após estrutura APROVADA, gerar todo o conteúdo da isca:
- Tom conversacional, como o mentor falaria
- Específico ao nicho (nunca genérico)
- Exemplos reais ou verossímeis do nicho
- Cada seção: 300-600 palavras

## [04] PDF via HTML

Gerar HTML para diagramação A4 (794px × 1123px por página):

```css
@page { size: A4; margin: 0; }
.page {
  width: 794px; min-height: 1123px;
  padding: 60px 80px;
  background: #0A0A0F;  /* dark premium */
  color: #FFFFFF;
  font-family: 'Inter', sans-serif;
  page-break-after: always;
}
h1 { font-size: 42px; color: {{cor_primaria}}; font-weight: 800; }
h2 { font-size: 28px; color: {{cor_primaria}}; font-weight: 700; }
p  { font-size: 16px; line-height: 1.8; color: #D0D0D0; }
```

**Regras de diagramação (anti-overflow):**
- `page-break-inside: avoid` em elementos atômicos (listas, imagens)
- `orphans: 4; widows: 4` nos parágrafos
- `break-after: avoid` nos headings
- NUNCA `overflow: hidden` no `.page`

Renderizar PDF via Playwright:
```python
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto(f"file:///{html_path}")
    page.pdf(path=str(output / "isca.pdf"), format="A4", print_background=True)
    browser.close()
```

Salvar em: `output/iscas/YYYY-MM-DD/`

## [05] Página de Captura

Gerar página HTML de captura dark premium:
- Hero com título da isca + mockup do material (CSS)
- Formulário: nome + WhatsApp (ou email)
- Submit: enviar pra webhook (Zapier/Make) ou exibir instrução de DM
- Seção pré-CTA: o que o avatar vai descobrir
- CTA: botão grande `cor_primaria`

Salvar em: `output/iscas/YYYY-MM-DD/captura.html`

## [06] Entrega

1. "Fera, isca pronta! PDF + página de captura em `output/iscas/YYYY-MM-DD/`"
2. Instrução de publicação da página: "Sobe o `captura.html` no Netlify ou no seu servidor."
3. Instrução de DM automation: "Configure a keyword `[keyword]` no /zernio-fera pra enviar o link da página automaticamente."
4. Instrução de stories: "Use o /squad-stories-fera pra criar stories divulgando a isca."

## QA antes de entregar

- [ ] Título da isca reflete nicho específico (não genérico)
- [ ] Zona 6 (pré-CTA de desejo) presente e forte
- [ ] CTA final linkado para `{{landing_page}}`
- [ ] PDF renderiza sem overflow de texto
- [ ] Página de captura responsiva
- [ ] Keyword de DM definida

## Comunicação após entrega

> "Fera, isca digital completa! PDF + página de captura prontos. Agora é configurar a automação no /zernio-fera pra distribuir automaticamente. Quer que eu faça isso agora?"
