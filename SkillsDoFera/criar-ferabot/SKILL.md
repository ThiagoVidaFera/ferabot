---
name: criar-ferabot
description: Fábrica de FeraBots. Ensina e executa a criação de um agente novo sob medida (RH, financeiro, jurídico, atendimento interno, o que o negócio pedir). Use quando o usuário disser "quero um agente pra X", "cria um bot de", "automatiza X pra mim", "queria que o Claude fizesse X sempre do mesmo jeito", "/criar-ferabot".
---

# Criar FeraBot — a fábrica

Persona: `SkillsDoFera/fera/references/persona.md`.

Isto é a camada de capacitação do FERABOT: a diferença entre ganhar um funcionário e virar o dono
da fábrica de funcionários. O usuário sai daqui com um agente novo instalado E entendendo como fez.

## Fase 1 — Entrevista (máximo 5 perguntas, de uma vez)

1. **O que o agente faz?** Uma frase. Se vier vago ("me ajuda com o financeiro"), afunilar:
   qual TAREFA repetitiva, com começo e fim, ele executa?
2. **Gatilho:** quando ele deve acordar? Que frases o usuário vai digitar?
3. **Entrada:** o que ele recebe (um texto, um arquivo, uma planilha, uma pergunta)?
4. **Saída:** o que ele entrega, em que formato, salvo onde?
5. **Regras do negócio:** o que ele NUNCA pode fazer? Que tom usa?

Repetir de volta o desenho em 5 linhas e pedir OK antes de escrever.

## Fase 2 — Escrever a skill

Criar `~/.claude/skills/<nome-kebab>/SKILL.md` (skill global — funciona em qualquer pasta):

```markdown
---
name: <nome-kebab>
description: <o que faz + QUANDO usar, com as frases-gatilho da entrevista. A descrição é o que faz o Claude acordar a skill: específica e com verbos.>
---

# <Nome>

<1 parágrafo: o papel do agente.>

## Antes de tudo
<o que ler/verificar: perfil.json se precisar do contexto do negócio, arquivos de entrada.>

## Passo a passo
<numerado, uma decisão por passo. Onde houver escolha, o critério da escolha.>

## Regras
<os NUNCA da entrevista + as regras herdadas abaixo.>

## Saída
<formato exato + onde salvar (output/<nome>/<data>/) + mostrar o caminho absoluto da pasta.>
```

Regras herdadas que TODO FeraBot criado carrega (escrever na skill nova):
- Português acentuado, sem emoji em arquivo de entregável.
- Nunca inventar número ou fato: sem certeza, marcar `[VERIFICAR]`.
- Saída salva em `output/`, caminho absoluto completo exibido no fim.
- Se produz peça de venda: checklist A/B/C/D (apontar pra doutrina do FERABOT).

## Fase 3 — Testar na hora

1. Rodar a skill recém-criada com um caso real que o usuário der.
2. Saiu errado → corrigir a skill (não o output) e rodar de novo. A skill é a fonte da verdade.
3. Só declarar pronto depois de UMA execução real bem-sucedida.

## Fase 4 — Entregar ensinando

1. Mostrar o arquivo criado e o caminho completo.
2. Explicar em 3 linhas o que faz cada bloco (description = gatilho, passo a passo = execução,
   regras = limites). É isso que o torna dono da fábrica.
3. Registrar: `python ScriptsFera/metas-api.py entrega add "criar-ferabot" "Agente <nome> criado" --link "<caminho>"`
4. Avisar: pra editar o agente depois, é só pedir "ajusta o agente <nome>" — ou abrir o arquivo
   e mexer no texto. Skill é texto, não código.

## Limites

- Agente que envia mensagem pra fora (WhatsApp, e-mail, post) nasce com confirmação humana antes
  do envio. Sempre.
- Agente que mexe em dinheiro de verdade (pagar, cobrar, transferir): recusar. Registrar e
  calcular sim, executar transação não.
- Nome não pode colidir com skill existente (`ls ~/.claude/skills/`). Colidiu, sufixar com o
  negócio dele.
