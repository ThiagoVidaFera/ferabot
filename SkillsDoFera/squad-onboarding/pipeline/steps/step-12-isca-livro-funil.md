---
id: step-12-isca-livro-funil
agent: lara-livro
execution: inline
inputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/client-briefing.md
outputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-livro-{slug-livro}.html
format: html
context_files:
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-sales-page.html
  - <FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-marketing-plan.html
external_skill: squad-isca-fera (opcional — PDF + página de captura)
---

# Step 12 — Isca Digital · Livro-Funil (Tipo 4)

## Contexto

Lara Livro é a agente do squad responsável por construir a **isca digital principal** do cliente em formato livro-funil — seguindo a estrutura de livro-funil descrita neste step (7 zonas, 5 movimentos, 5 gatilhos). Para exportar em PDF e montar a página de captura, pode usar a skill `squad-isca-fera`, se estiver instalada.

A isca digital nesse formato é **muito superior a um PDF de 5 páginas ou um inventário solto**: ela funciona simultaneamente como ativo de autoridade, lead magnet de profundidade, e funil completo até a oferta principal. É o que faz a diferença entre um cliente que captura leads e um cliente que **converte leitor em mentorando**.

## Quando usar Tipo 4

**SEMPRE** para clientes do squad onboarding cuja oferta principal é mentoria/programa/acompanhamento de alto valor (R$ 1.000+).

O formato livro-funil tem 4 tipos (1 — vende produto de entrada · 2 — vende curso · 3 — vende serviço · 4 — vende mentoria/programa de alto valor). O squad onboarding usa quase sempre **Tipo 4 — Livro que vende mentoria/programa de alto valor**, porque:
- O leitor precisa criar **identificação pessoal com o autor**, não apenas comprar conteúdo
- A oferta final é de **acesso a uma relação de desenvolvimento**, não a um produto
- O livro funciona como filtro: leitor que termina o livro = leitor que está pronto para mentoria

## Dados de Referência

- `<FERABOT>/output/onboarding/{client-slug}-{data}/client-briefing.md` — história, dores, transformação prometida
- `<FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-sales-page.html` — posicionamento e voz já validados
- `<FERABOT>/output/onboarding/{client-slug}-{data}/{client-slug}-marketing-plan.html` — pilares de conteúdo, frases de efeito
- **Estrutura obrigatória**: as 7 zonas, os 5 movimentos e os 5 gatilhos descritos abaixo (Passos 4 e 5)

## Instruções para Lara Livro

### Passo 1 — Internalizar a estrutura

Antes de escrever qualquer linha, ler este step inteiro. Os 5 movimentos de cada capítulo (Passo 5), os 5 gatilhos embutidos e as regras de escrita absolutas são **obrigatórios** para a entrega.

### Passo 2 — Extrair do briefing

- Nome do cliente, marca, programa principal
- Avatar (avatar do programa = leitor do livro)
- Dor central que o programa resolve
- Transformação concreta prometida
- História pessoal do mentor
- Diferenciais únicos
- Provas sociais

### Passo 3 — Definir título + tese central

Propor 2-3 títulos para o livro e aguardar escolha do usuário (ou confirmar se o briefing já indica). O título deve:
- Capturar uma **ideia grande, original e corajosa**
- Conversar diretamente com a dor do avatar
- Não soar como livro de autoajuda genérico

Exemplo de formato (hipotético): uma metáfora curta + subtítulo que nomeia a dor.
> **"[Metáfora em 1-2 palavras] — [O que o leitor não percebe sobre a própria dor]"**

### Passo 4 — Estrutura obrigatória do Livro-Funil Tipo 4

Seguir as **7 zonas estratégicas**, mapeadas para capítulos:

```
ZONA 1 — A PROMESSA
  Introdução: começa pela dor do leitor (não pela bio do autor)

ZONA 2 — O DIAGNÓSTICO
  Capítulo 1: nomeia o problema central com precisão
  Capítulo 2: explica por que soluções comuns falham (livros, autoajuda, coaching)

ZONA 3 — A MUDANÇA DE PERCEPÇÃO
  Capítulo 3: nova forma de enxergar o problema (quebra crença)
  Capítulo 4: questão paralela (ex: coach vs profissional regulamentado)

ZONA 4 — O MÉTODO
  Capítulo 5: arquitetura geral do método proprietário
  Capítulo 6: aprofundamento de uma técnica-chave (ex: TCC)
  Capítulo 7: aprofundamento de outra técnica-chave (ex: PNL)

ZONA 5 — A APLICAÇÃO
  Capítulo 8: caso real (anonimizado, com autorização) com resultado mensurável — sem caso real, `[A PREENCHER: caso real do cliente]`; nunca inventar
  Capítulo 9: padrões que aparecem em quase todo cliente

ZONA 6 — O PRÓXIMO NÍVEL
  Capítulo 10: o que existe depois do programa (plano de manutenção, etc)

ZONA 7 — O CONVITE
  Capítulo Final: convite para mentoria, com CTA + WhatsApp + links + agenda
```

### Passo 5 — Escrita

**Aplicar os 5 movimentos** em cada capítulo:
1. Abertura com tensão ou insight (não bio, não introdução genérica)
2. Desenvolvimento com profundidade real
3. Conexão com a realidade do leitor
4. Expansão de consciência
5. Fechamento que direciona para o próximo capítulo

**Aplicar os 5 gatilhos embutidos**:
1. Autoridade demonstrada (nunca declarada)
2. Identificação máxima (dores nomeadas com precisão)
3. Gap estratégico (entre onde o leitor está e onde poderia estar)
4. Prova através de resultados (caso real, dados concretos)
5. Antecipação progressiva (cada capítulo deixa querer o próximo)

**Padrão de escrita obrigatório**:
- Parágrafos de 3-5 linhas
- Escrita contínua e fluida
- Nada motivacional vazio
- Sem listas decorativas
- Tom inteligente, direto, profundo

### Passo 6 — Estrutura visual HTML

Construir como **livro digital navegável**:
- Capa em fundo escuro (paleta de marca do cliente)
- Folha de rosto + dedicatória + sumário
- 1 capítulo por seção HTML, com `<h2 class="cap-titulo">` e `<p class="capitulo-numero">`
- Tipografia serif (Fraunces) para corpo, sans (Inter) para metadados
- Drop cap no parágrafo inicial de cada capítulo
- Pull quotes em rose-gold/cor de destaque
- Convite final em fundo escuro com CTA box
- Colofon (ficha técnica) no final

Largura máxima 720px (formato livro). Responsivo.

### Passo 7 — Tamanho

**Padrão squad onboarding**: ~12-15 mil palavras = 50-70 páginas físicas equivalentes. Mas pode variar:
- Versão **enxuta** (12k palavras): cliente que precisa lançar rápido
- Versão **completa** (20k palavras): cliente premium ou nicho técnico

### Passo 8 — Renderização (PNGs)

Após finalizar o HTML, renderizar via Playwright Node:
1. **Capa post 1080×1350** (4:5 IG feed)
2. **Capa post 1080×1080** (quadrado)
3. **Capa story 1080×1920** (9:16)
4. **Capa formato livro 720×1100** (sem padding)
5. **Livro completo full-page** em 720w (referência visual)

Output: `<FERABOT>/output/onboarding/{client-slug}-{data}/isca-livro-{slug-livro}/`.

## Veto Conditions

- NUNCA gerar livro sem aplicar a estrutura deste step (7 zonas + 5 movimentos + 5 gatilhos)
- NUNCA omitir alguma das 7 zonas
- NUNCA escrever em parágrafos curtos isolados em sequência (estilo proibido no livro-funil)
- NUNCA usar autoridade declarada ("eu sou o melhor") — sempre demonstrada
- NUNCA fazer convite final como publicidade — deve ser extensão coerente da jornada
- SEMPRE rodar o checklist de revisão antes de entregar: fluidez, clareza, profundidade, ritmo, conexão, direção
- Prova e dado: peça pública usa só prova real; dado que só o dono tem vira pergunta ou `[A PREENCHER]`

### ⚠️ Regra v2 (2026-06-12) — O livro é só conteúdo pro leitor final

O livro é lido pelo **cliente final** (lead/leitor). As 7 Zonas, os 5 Movimentos e os 5 Gatilhos são **andaime interno pra ESCREVER** o livro — **NUNCA aparecem no livro renderizado**.

- **PROIBIDO em qualquer texto visível** (índice, cabeçalhos de capítulo, dek, colofon, corpo): "Zona X", "Arquitetura: N Zonas", "N Movimentos", "N Gatilhos", "Movimento", "Gatilho", "Gancho/Hook", "Promessa" (como rótulo), "Quebra de objeção", "Filtro/Filtro de exclusão", "funil", "lead magnet", "CTA", "persuasão" e afins. Se o leitor ler o jargão, o feitiço quebra.
- O índice e os cabeçalhos mostram **só número + título limpo** do capítulo (ex.: "Capítulo 1 — O painel não é o motor", nunca "Capítulo 1 · Zona 2 — O Diagnóstico"). Sem coluna/box de "zona".
- O convite final continua sendo extensão coerente da jornada (nunca anúncio), leva pro **WhatsApp** e informa a **FAIXA de investimento** do programa (ex.: "entre R$ X e R$ Y, valor exato acertado na conversa") — escrito como conteúdo natural, pra o leitor chegar no WhatsApp já sabendo a faixa.
- A persuasão segue embutida (é o ofício), mas **só os efeitos** aparecem no texto; **nenhum rótulo da engenharia**.
