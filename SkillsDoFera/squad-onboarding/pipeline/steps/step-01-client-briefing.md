---
id: step-01-client-briefing
type: checkpoint
execution: checkpoint
outputFile: <FERABOT>/output/onboarding/{client-slug}-{data}/client-briefing.md
title: "Briefing do Cliente"
---

# Step 01 — Briefing do Cliente

## Contexto

Este é o ponto de entrada do pipeline ONBOARDING. Antes de qualquer geração de conteúdo, precisamos coletar as informações essenciais do cliente (mentor, coach ou consultor) que vai receber os materiais.

As respostas deste checkpoint alimentam TODOS os steps seguintes — página de vendas, plano de marketing, stories, carrosséis e thumbnails. Quanto mais específico e detalhado, melhor o resultado final.

## Instruções para o Checkpoint

Apresente ao usuário as seguintes perguntas em sequência, coletando cada resposta antes de avançar. Ao final, gere o arquivo `client-briefing.md` com todas as informações organizadas no formato definido abaixo.

## Perguntas a Fazer (AskUserQuestion)

**1. Nome do cliente e nome da marca**
> "Qual é o nome completo do seu cliente? E como ele chama sua marca, método ou programa? (Ex: Nome: Carlos Mendes / Marca: Método Clareza Total)"

**2. Nicho e especialidade específica**
> "Qual é o nicho exato e a especialidade do seu cliente? Seja bem específico — não 'coach de negócios', mas 'coach especialista em vendas consultivas para B2B' por exemplo."

**3. Público-alvo (avatar ideal)**
> "Descreva o cliente ideal do seu cliente. Quem é essa pessoa? Profissão, estágio de vida, principais frustrações, sonhos, como passa o dia. Quanto mais detalhe, melhor."

**4. Problema principal que o cliente resolve**
> "Qual é O problema número 1 que o seu cliente resolve? Qual é a dor central, o que mantém o público-alvo acordado à noite relacionado a essa área?"

**5. Resultado/transformação principal que entrega**
> "Qual é a transformação concreta que o cliente entrega? Seja específico: números, prazos, mudanças objetivas. Ex: 'Fecha a primeira mentoria de R$ 8.000 em 60 dias'"

**6. Oferta principal: nome do produto/programa + preço**
> "Como se chama o programa/mentoria principal? Qual é o preço? Qual é a duração? (Ex: Mentoria ESCALA — R$ 12.000 — 3 meses)"

**7. Diferenciais únicos**
> "O que torna o seu cliente diferente de outros mentores/coaches no mesmo nicho? O que ele faz que outros não fazem? Qual é o método proprietário, se tiver?"

**8. Provas sociais: números, resultados, depoimentos**
> "Quais são as principais provas sociais disponíveis? Número de alunos, resultados específicos de ex-alunos (com nome e resultado se possível), prêmios, certificações relevantes, aparições em mídia."

**9. Urgência, bônus ou benefícios extras**
> "Existe alguma urgência real (turma com data de início, vagas limitadas) ou bônus que podem ser incluídos na oferta? Descreva cada bônus e seu valor percebido."

**10. Redes sociais e contatos**
> "Quais são as redes sociais do cliente (Instagram, YouTube, LinkedIn)? Tem site? Qual é o e-mail de contato ou WhatsApp para o CTA da página?"

## Formato do Arquivo de Output (client-briefing.md)

```markdown
# Briefing do Cliente — {Nome do Cliente}

**Data de criação**: {data atual}
**Squad run ID**: {run_id}

## Identidade

- **Nome do cliente**: {resposta 1a}
- **Nome da marca/método**: {resposta 1b}
- **Slug para URLs**: {nome-em-minusculas-sem-acento-com-hifens}

## Nicho e Especialidade

{resposta 2 — detalhada}

## Público-Alvo (Avatar Ideal)

{resposta 3 — detalhada}

## Problema Principal

{resposta 4}

## Transformação/Resultado Entregue

{resposta 5}

## Oferta Principal

- **Nome do programa**: {resposta 6a}
- **Preço**: {resposta 6b}
- **Duração**: {resposta 6c}

## Diferenciais Únicos

{resposta 7}

## Provas Sociais

{resposta 8}

## Urgência e Bônus

{resposta 9}

## Redes Sociais e Contatos

{resposta 10}
```

## Veto Conditions

- NÃO avançar para o step-02 se o nome do cliente estiver vazio
- NÃO avançar se a oferta principal não tiver nome e preço
- NÃO avançar se o resultado/transformação estiver vago ("ajuda as pessoas a crescerem" — nível de especificidade insuficiente)
- Perguntar novamente se alguma resposta crítica estiver ausente (itens 1, 2, 3, 5, 6 são obrigatórios)
