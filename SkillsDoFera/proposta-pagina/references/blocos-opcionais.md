# Blocos opcionais do `oferta.json`

Os dois blocos abaixo só aparecem se você escrever. O gerador nunca preenche por conta própria.

## `em_contrato` (seção 04, logo abaixo da garantia)

Diz com todas as letras o que fica por escrito. Serve para quem já foi enganado por promessa solta.

```json
"em_contrato": {
  "titulo": "O que fica escrito no contrato",
  "texto": "Aqui não existe combinado só de boca.",
  "itens": ["Cada entrega, uma por uma", "Quem faz o quê", "O que acontece se você quiser parar"],
  "link_texto": "Ver o modelo de contrato",
  "link": "https://..."
}
```

`titulo` e ao menos um item são obrigatórios. `texto`, `link_texto` e `link` são opcionais (o link precisa ser https).
Só prometa o que o seu contrato real diz.

## `dois_mundos` (seção 02, antes das entregas)

Contraste curto: o que continua se nada mudar × o que muda com a proposta.

```json
"dois_mundos": {
  "mundo1": {"titulo": "Se nada mudar", "itens": ["...", "..."]},
  "mundo2": {"titulo": "Com o plano", "itens": ["...", "..."]}
}
```

- **Máximo de 3 itens por mundo.** Contraste longo atrasa o preço, que é onde a leitura se concentra.
- Os itens saem das **falas do contato** (`lead.json`). Sem falas, o bloco não aparece e o gerador avisa.
- O mundo 2 descreve entrega e mudança observável. Resultado só com prova real.
- Não substitui o bloco "Depois do clique".
