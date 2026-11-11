# Personagem do estilo 36

Esta pasta recebe o SEU personagem (o pacote não traz nenhum). Enquanto ela estiver vazia, o vídeo mostra o marcador cinza
"SUA CARICATURA AQUI" (`marcador.svg`) — não renderize a peça final assim.

Arquivos que o `index.html` procura (1024×1536, PNG com fundo transparente, da cintura para cima, cortado embaixo):

| pose | boca fechada | falando |
|---|---|---|
| apresenta (mão aberta) | `p1-apresenta.png` | `p1-apresenta-falando.png` |
| surpreso | `p2-surpreso.png` | — |
| aponta para cima | `p3-aponta.png` | `p3-aponta-falando.png` |
| dá de ombros | `p4-ombros.png` | `p4-ombros-falando.png` |
| pensa (mão no queixo) | `p5-pensa.png` | `p5-pensa-falando.png` |
| mão na cabeça | `p6-cabeca.png` | `p6-cabeca-falando.png` |

Como gerar (API paga, ~US$ 0,40–0,60 no total; o script só gasta com `--pode`):
1. `python3 gerar_personagem.py base --foto minha-foto.jpg` (sua caricatura) ou
   `python3 gerar_personagem.py generico --descricao "..."` (personagem genérico) → confira `base.png`.
2. `python3 gerar_personagem.py poses --pode` → as 6 poses.
3. `python3 gerar_personagem.py bocas --pode` → as 5 versões "falando".
4. Copie tudo para `acervo/meu-personagem/` e reaproveite nas próximas peças.

Traço: o script já descreve o traço do estilo (contorno grosso, cor chapada, sombra em retícula). Se quiser outro traço, passe
`--ref-traco <imagem>` com um desenho SEU (ou que você tenha direito de usar) — nunca o personagem de outro criador.
Sem programa de desenho? Também vale desenhar/encomendar as 11 imagens e só colocar aqui com estes nomes.

Dica: peça a roupa em cor (blazer, camisa colorida). Roupa branca sai semitransparente no fundo transparente. Modelo testado: gpt-image-1.5.
