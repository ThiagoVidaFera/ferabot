---
name: proposta-pagina
description: Gera a página de proposta comercial de um contato, no layout "dossiê vivo" (menu lateral, preço só depois das entregas, garantia logo após o preço, um botão "Vamos começar", falas literais do contato, diagramas animados, validade de 3 dias), com a oferta do SEU perfil.json e oferta.json. Triggers: "proposta página", "proposta comercial pro lead".
---

# FeraBot Proposta Página

Cria uma página única (mobile-first, noindex) com a proposta para UM contato, com as suas cores e a sua oferta.
Diferente da skill `propostas` (PDF em deck), esta gera uma página para publicar e mandar o link.
Publicação: `SkillsDoFera/paginas-e-quiz` (Netlify). A mensagem que acompanha o link nunca leva o valor.

## Entradas (3 arquivos)

1. `perfil.json` (raiz do FeraBot): `nome`, `nicho`, `produto`, `preco`, `handle_instagram`, `cor_primaria`,
   `cor_secundaria`, `landing_page`. Opcionais: `whatsapp`, `sobre` (lista de frases verdadeiras sobre você).
2. `oferta.json` (raiz do FeraBot, definido no briefing com o cliente). Modelo em `exemplos/oferta.json`:
   - `entregaveis` (obrigatório): lista de `{titulo, nome_curto, preco (opcional), muda, itens:[{t,d}], diagrama (opcional)}`.
     Sem `diagrama`, a página usa um desenho padrão. Com `preco` em todas as entregas, a seção 04 mostra a soma avulsa e o desconto.
   - `valor_avista` (ou `preco` do perfil), `parcelas` + `valor_parcela` (opcionais, sempre juntos), `nota` (opcional).
   - `checkout_url` (link de pagamento https) e/ou `whatsapp` do dono. Um dos dois é obrigatório: é o destino do botão.
   - `garantia`: `{texto, destaque, itens}`. Sem garantia no arquivo, o bloco não aparece (nunca inventamos).
   - Opcionais: `quem_faz {eu, voce}`, `jornada [{t,d}]`, `depois [{t,d}]`, `glossario [{termo, significa}]`,
     `entregas_titulo`, `entregas_lead`, `jornada_titulo`, `em_contrato` (o que fica por escrito, abaixo da garantia) e
     `dois_mundos` (contraste curto antes das entregas, máximo 3 itens por lado). Detalhes em `references/blocos-opcionais.md`.
3. `lead.json` (quem chama esta skill, por exemplo a skill `agente-de-leads`):

```json
{"nome": "", "empresa": "", "instagram": "", "whatsapp": "",
 "falas": ["citação literal do contato, do jeito que ele escreveu"],
 "objetivo": "frase no infinitivo, completa a frase 'este é o plano para ...'",
 "dor": "frase que descreve o hoje do contato",
 "oferta_override": {"valor_avista": 0}}
```

`oferta_override` é opcional e troca qualquer chave do `oferta.json` só para este contato.

## Comando (contrato fixo)

```
python SkillsDoFera/proposta-pagina/gerar_proposta.py --lead <lead.json> --out <dir>
```

Opcionais: `--perfil`, `--oferta` (padrão: raiz do FeraBot), `--emitida AAAA-MM-DD`, `--estrito` (jargão vira erro).

Saída em `<dir>`: `index.html` (tudo embutido, fontes do Google), `robots.txt` e `resumo.json`:
`{titulo, validade_ate, arquivos, publicavel, pendencias, avisos, botao}`. O `resumo.json` nunca traz valores.

Código de saída: `0` gerada e publicável. `2` gerada com pendências, NÃO publicar (veja `pendencias`).
`1` erro de validação, nada foi gerado (a causa sai no terminal).

## Regras que o gerador aplica

- Validade sempre 3 dias a partir da emissão. Depois do prazo a página sozinha troca o botão por "Pedir uma nova proposta".
- Valor só dentro da página, a partir da seção 04. Nunca na mensagem, no título, no `resumo.json` ou no cartão do link.
- Nunca prazo de retorno do investimento ("se paga em", "payback"): o gerador barra.
- Texto ao cliente em português com acento, sem emoji, sem travessão, sem ponto e vírgula. Falas literais do contato ficam como vieram.
- Dado que só o dono tem (história, resultados, falas) e não veio: aparece como `[FONTE OMISSA: ...]`, entra em `pendencias`
  e o código de saída é 2. Nunca se inventa prova, número, garantia ou caso de cliente.
- Jargão (funil, lead, CRM, tráfego, etc.) sem explicação gera aviso. Explique no `glossario` ou troque por palavra simples.
- Um botão só: "Vamos começar". Leva ao `checkout_url`, ou ao WhatsApp do dono se não houver checkout.
- Cores: derivadas de `cor_primaria` e `cor_secundaria` com checagem de contraste.
- Tom done-with-you: "a gente faz junto", com a voz do dono em primeira pessoa.

## Fluxo

1. Confirmar que `perfil.json` e `oferta.json` existem. Se faltar `oferta.json`, conduzir o briefing da oferta na conversa
   (entregas, valor, parcelamento, garantia, link de pagamento) e gravar o arquivo.
2. Montar o `lead.json` com as falas literais.
3. Rodar o gerador. Corrigir erros e preencher pendências com o dono (nunca inventar).
4. Rodar o QA: `python SkillsDoFera/proposta-pagina/qa_proposta.py <dir>` (precisa de `pip install playwright` e
   `playwright install chromium`). Gera `375-pagina.png`, `375-topo.png` e `1280-pagina.png` em `<dir>/_qa/`.
   Abrir o print de 375px e conferir a olho: primeira dobra, preço, botão e diagramas.
5. Publicar com `SkillsDoFera/paginas-e-quiz` (apague `_qa/` antes). Mostrar ao dono o caminho absoluto da pasta e o link.
   Enviar o link ao contato com mensagem curta, sem valor (modelo e follow-up em `references/mensagem-e-followup.md`).

## Arquivos

`gerar_proposta.py` (CLI e validação) · `paginas.py` (blocos HTML) · `paleta.py` (cores) · `diagramas.py` (SVG animado) ·
`util.py` · `qa_proposta.py` · `assets/` (CSS e JS) · `exemplos/` (perfil, oferta e lead fictícios) ·
`references/mensagem-e-followup.md` (mensagem do link, follow-up do dia 3, travou pelo dinheiro, de onde vêm as falas) ·
`references/blocos-opcionais.md`.
