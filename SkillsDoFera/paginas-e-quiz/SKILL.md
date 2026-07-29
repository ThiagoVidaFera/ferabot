---
name: paginas-e-quiz
description: FeraBot Páginas & Quiz. Cria landing page, página de venda, página de captura e quiz de qualificação, com deploy opcional na Netlify. Use quando o usuário pedir "landing", "página", "site", "página de captura", "página de vendas", "quiz", "funil de quiz", "coloca no ar".
---

# FeraBot Páginas & Quiz

Persona e doutrina: `SkillsDoFera/fera/references/`. Ler `perfil.json` antes de tudo.

## Roteamento interno

| Pedido | Motor |
|---|---|
| Página de venda completa (9 seções) | skill `jack-fera` (motor da v1, continua valendo) |
| Página de captura de lead (isca) | skill `squad-isca-fera` |
| Quiz de qualificação | esta skill, seção Quiz abaixo |
| Deploy / "coloca no ar" | seção Deploy abaixo |

Ao delegar pro motor: a VOZ da conversa continua sendo a do FERA (persona.md), não a do motor.
Copy aprovada antes de renderizar, sempre.

## Regras duras de toda página

1. **Mobile-first.** Desenhar em 375px e escalar. Primeira dobra: diz o que é em 1 segundo,
   headline curta + subhead de 1 linha + UM CTA. Coluna única, toque grande, fontes com clamp().
2. **QA obrigatório** com screenshot em 375px via Playwright antes de considerar pronto:
   ```bash
   python ScriptsFera/render.py qa output/paginas/<pasta>/index.html
   ```
   Sai `qa-375.png` e `qa-1440.png` + alerta de overflow horizontal. Overflow = corrigir antes.
3. **Checklist A/B/C/D** na copy (doutrina.md). Seção "NÃO entre se... / Entre se..." antes do CTA
   em página de venda.
4. CTA de comando, nunca "saiba mais" solto.
5. Tudo self-contained: CSS inline ou no próprio arquivo, sem CDN que quebra.

## Quiz de qualificação

Quiz repelente: qualifica E filtra. 5 a 7 perguntas, uma por tela.

1. **Intake:** o que o quiz decide (lead bom vs. curioso), pra onde vai o aprovado (WhatsApp com
   mensagem pré-preenchida `https://wa.me/<numero>?text=...`), o que desqualifica.
2. **Perguntas:** misturar diagnóstico (situação atual, faturamento, tempo disponível) com filtro
   comportamental (disposição a executar, a investir). Sem pergunta de CPF/dados sensíveis.
3. **Resultado:** 2 ou 3 saídas — qualificado (CTA WhatsApp direto), quase (isca digital),
   desqualificado (conteúdo gratuito, saída honesta e educada).
4. **Build:** um único `index.html` com JS vanilla (state em memória, barra de progresso,
   uma pergunta por tela, botões grandes). Mobile-first. QA 375px.

## Deploy (BYOK — Netlify do CLIENTE)

Chave: `NETLIFY_AUTH_TOKEN` no `.env` (o cliente cria a conta grátis dele — guia no `API_SETUP.md`).

```bash
npx -y netlify-cli deploy --prod --dir output/paginas/<pasta> --auth $NETLIFY_AUTH_TOKEN --site <site-id>
```

- Primeira vez sem site: `npx -y netlify-cli sites:create --name <slug> --auth $NETLIFY_AUTH_TOKEN`
  e guardar o site-id retornado no `.env` (`NETLIFY_SITE_<SLUG>=<id>`).
- Sem token no `.env`: NÃO travar a entrega. Entregar a pasta pronta e ensinar o caminho manual:
  arrastar a pasta em `app.netlify.com/drop` (zero configuração). Depois sugerir
  `python SetupFera/setup_chaves.py` pra automatizar da próxima vez.
- Confirmar a URL publicada abrindo com o QA do render.py apontado pra URL.

## Entrega

1. Registrar em silêncio:
   `python ScriptsFera/metas-api.py entrega add "paginas-e-quiz" "<o que foi>" --link "<url ou pasta>"`
2. Mostrar o caminho absoluto completo da pasta (e a URL, se subiu).
3. Próximo passo DELE: página no ar sem tráfego não gera lead. Apontar o passo de tráfego
   (conteúdo ou anúncio) na mesma resposta.
