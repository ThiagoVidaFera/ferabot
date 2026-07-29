---
name: propostas
description: FeraBot Propostas. Cria PDF de proposta comercial ou de oferta pronto pra mandar pro cliente. Use quando o usuário pedir "proposta", "orçamento", "PDF pra mandar pro cliente", "apresentar meu serviço", "documento da oferta". Deck landscape 16:9, HTML→PDF via Playwright, sem chave de API nenhuma.
---

# FeraBot Propostas

Persona e doutrina: `SkillsDoFera/fera/references/`. Ler `perfil.json` antes de tudo.

## Fluxo (4 fases, nessa ordem)

### 1. Intake (perguntar só o que falta)

- Pra QUEM é a proposta (nome do cliente destino, empresa, contexto).
- O que está sendo oferecido (se for o produto do `perfil.json`, confirmar; senão, colher).
- Preço e condições (à vista, parcelas, prazo de validade da proposta).
- Entregáveis concretos (o que ele recebe, item por item).
- Prazo de entrega e forma de trabalho.

Não perguntar o que já está no `perfil.json`. Máximo de 5 perguntas numa mensagem só.

### 2. Copy (aprovar ANTES de renderizar)

Estrutura fixa das páginas (deck 16:9, 8 a 11 páginas):

1. **Capa** — nome do destino, nome da oferta, data. Sem preço na capa.
2. **O problema** — a dor específica do destino, nomeada em dinheiro ou tempo quando possível.
3. **A solução** — o mecanismo, como funciona, em linguagem de entrega ("você sai com X no ar").
4. **Entregáveis** — lista concreta, um por linha. Nada de competência vaga.
5. **Como funciona** — etapas/timeline (3 a 5 passos com prazo).
6. **O que É e o que NÃO é** — filtro honesto de expectativa.
7. **Investimento** — preço com âncora de custo de não agir. Condições claras.
8. **Garantia / risco reverso** — o compromisso, com nome.
9. **Próximo passo** — CTA de comando: "responde esse e-mail", "chama no WhatsApp <número>".

**Checklist A/B/C/D obrigatório** (doutrina.md): anti-medo (garantia, prova), anti-procrastinação
(validade da proposta, custo de não agir), anti-preguiça (o que EU entrego pronto vs. o que ele
faz), anti-problema-futuro (suporte nomeado). Faltou um, reescrever antes de mostrar.

Anti-hype: número só com fonte. Sem promessa de resultado garantido.

Apresentar a copy página por página e esperar OK explícito.

### 3. Render (só depois do OK)

Gerar `output/propostas/<data>-<slug>/proposta.html`:

- Página = `<section class="pagina">` de **1280×720px** cada, uma por página do deck.
- Design: fundo escuro premium OU claro editorial (perguntar preferência UMA vez, lembrar no
  perfil), cor primária de `perfil.json` (`cor_primaria`) como acento, tipografia system-ui,
  hierarquia forte (número/preço grande, corpo enxuto).
- Sem emoji nas artes. Sem rótulos de estrutura visíveis ("headline:", "CTA:").

Renderizar:

```bash
python ScriptsFera/render.py pdf output/propostas/<pasta>/proposta.html --paisagem
```

Sai `proposta.pdf` na mesma pasta. Conferir abrindo o PDF (ou screenshot da primeira página) antes
de entregar.

### 4. Entrega

1. Registrar em silêncio:
   `python ScriptsFera/metas-api.py entrega add "propostas" "Proposta para <destino>" --link "output/propostas/<pasta>/"`
2. Mostrar o **caminho absoluto completo da pasta**.
3. Falar sobre a peça na voz FERA: o que ela ataca, e o próximo passo DELE (mandar hoje, não
   "quando der"). Proposta parada na pasta não vende.
