# Do 16:9 para 9:16 e 4:5 — como cada família vira vertical

Os efeitos foram estudados em 1920x1080. Nada sobe para anúncio nesse formato: cada família tem uma
regra de reorganização. **A mecânica e a ordem de prova ficam; muda a geometria.** Amostra sempre em
1080x1920 primeiro; o 4:5 (1080x1350) sai do mesmo componente por props depois da aprovação.

Regras gerais:
1. **Lado a lado vira empilhado** (em cima/embaixo). Lado a lado só para 2 itens curtos dentro do núcleo 1:1.
2. **Movimento horizontal longo vira vertical** (pan lateral → pan para baixo), porque o quadro tem mais altura.
3. **Apresentador pequeno = círculo/janela no canto inferior** dentro do núcleo (nunca no rodapé do app),
   ~300–360 px de diâmetro em 9:16, ~260–300 px em 4:5; moldura lateral 42% x 34% quando a fala pede rosto.
4. Tudo que é essencial cabe no núcleo y 420–1500; o 4:5 corta o resto sem perder nada.
5. Limites de itens já estão apertados em `limites_9x16`; não "espremer" para caber.

| Família | 9:16 (1080x1920) | 4:5 (1080x1350) |
|---|---|---|
| **divisão** (pessoa + explicação) | Apresentador em cima (≈ 40% da altura, rosto no terço superior do núcleo), explicação embaixo. Lista e veredito empilham 1 coluna. Gráfico largo desliza **para cima** sob a janela. Celular entra de baixo, ocupando a metade inferior. | Apresentador vira janela 42% x 34% no canto inferior; explicação ocupa o resto. |
| **janela** (demonstração manda) | Demonstração em tela quase cheia no núcleo; apresentador em **círculo no canto inferior** (lado oposto ao alvo da atenção). Painel de registro aparece embaixo do celular, não ao lado. | Igual, círculo menor; registro sobreposto em faixa. |
| **tipografia** | Título atrás da pessoa: até 2 linhas, ≤ 15 caracteres cada, letras na metade superior do núcleo; a pessoa cobre só a base das letras. Etiquetas e termos ocupam faixas acima e abaixo do rosto (não as laterais). Rótulos opostos: um acima, outro abaixo do rosto. | Títulos −12%; máximo 2 linhas; nuvem com 1 termo a menos. |
| **capítulo** | Grade de capítulos vira coluna (2x2 no máximo); título e número centrados no núcleo. Só aula/VSL/Reels; em anúncio é proibido. | Igual. |
| **transição** | Mosaico 5x8 (mais linhas que colunas); polígonos vêm dos cantos superior e inferior. | Mosaico 5x6. |
| **evidência** | Print/gravação real preenche a largura (margem 48–72 px), **altura recortada na região que importa**; câmera aproxima (até 1,6x) em vez de mostrar o painel inteiro ilegível. Nota e status abaixo do print, nunca por cima do alvo. | Print com recorte mais justo; nota em faixa inferior. |
| **comparação** | Barras **horizontais** empilhadas (rótulo em cima da barra, número na ponta). Gráfico de linha com eixo x curto (≤ 7 pontos visíveis, câmera desce se houver mais). Duas telas/pares: uma acima da outra com rótulo ANTES/DEPOIS. Três telas: carrossel vertical (uma por vez) ou 3 em coluna só se legíveis. | Barras horizontais; pares lado a lado só se cada lado ≥ 470 px de largura e legível. |
| **diagrama** | Fluxos de cima para baixo (entradas no alto, resultado embaixo). Pistas de mensagens: 3 colunas estreitas com mensagens descendo. Ciclo em círculo central de ~760 px. Linha do tempo vertical. | Fluxos de cima para baixo, 1 nó a menos se apertar. |
| **cartões** | Cartões em coluna (máx. 4) ou grade 2x2; checklist ao lado do celular vira checklist **abaixo** da tela gravada. Cartões que pousam na frente do apresentador: faixa inferior do núcleo, rosto livre. | Grade 2x2 compacta. |
| **colagem** | Colagem ao redor do apresentador recortado: 2 imagens acima e 2 abaixo do rosto. Parede de depoimentos: 2 colunas, recortes desiguais, câmera desce devagar (linear). Paralaxe: planos empilhados em profundidade, câmera vertical. | 2 colunas, 1 depoimento a menos. |

## Checklist de porte
- [ ] Mesma ordem de prova e mesma assinatura do catálogo
- [ ] Nada essencial fora de y 420–1500; laterais ≥ 90 px; coluna de botões do Reels livre
- [ ] Rótulo ≥ 40 px, secundário ≥ 34 px; número herói legível na miniatura do feed
- [ ] Apresentador com rosto livre e voz real daquele take
- [ ] 4:5 gerado por props do mesmo componente (sem segunda animação)
- [ ] Quadros-chave conferidos com a máscara de zona segura sobreposta
