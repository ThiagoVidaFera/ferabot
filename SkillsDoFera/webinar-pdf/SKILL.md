---
name: webinar-pdf
description: Webinar digital em PDF. Uma aula de 20 a 30 slides 1280x720, feita para ser lida no celular, que ensina uma coisa de verdade e termina convidando para a reunião de 20 minutos. Esqueleto e texto aprovados antes do design, render em PDF e QA página a página, com página de captura. Use quando o usuário pedir "webinar em PDF", "aula em PDF", "webinar digital", "material pra mandar antes da reunião", "PDF que vende a reunião".
---

# Webinar em PDF

Persona e doutrina: `SkillsDoFera/fera/references/`. Ler `perfil.json` e `metas.json` antes de tudo.

Webinar ao vivo pede hora marcada e plateia. Este é o webinar que o lead lê no celular, na fila do
banco, e chega na reunião já sabendo por que precisa dela. Ensina de verdade. Não é folheto.

## Regras duras

1. **20 a 30 slides, 1280x720.** Menos que 20 não ensina. Mais que 30 ninguém termina.
2. **Máximo 25 palavras por slide.** Lido no celular, deitado. Passou de 25, divide em dois slides.
   Fonte de corpo nunca abaixo de 34px (no celular, 1280px vira ~375px de largura).
3. **`[VERIFICAR]` em todo número sem fonte.** Nenhum `[VERIFICAR]` chega no PDF final: ou vira
   fonte nomeada no próprio slide, ou a frase sai.
4. **Exemplo hipotético só declarado no slide.** "Exemplo hipotético:" escrito no corpo do slide,
   nunca em nota de rodapé removível. Caso real só com dado que ele mesmo forneceu.
5. **Termina na reunião de 20 minutos.** O último bloco convida para a reunião com o link da página
   de agendamento (`perfil.json` ou a página do `/funil-reuniao-fantasma`). Sem página de
   agendamento no ar, fazer ela primeiro.
6. Checklist A/B/C/D do `CLAUDE.md` no bloco final (convite). Faltou categoria, reescreve.
7. Nada de arte antes do texto aprovado.

## Fluxo

```
[01] Tema → [02] Esqueleto (aprovação) → [03] Texto (aprovação) → [04] HTML
→ [05] PDF → [06] QA página a página → [07] Página de captura → [08] Entrega
```

Pasta: `output/webinar-pdf/<data>-<slug>/`.

### [01] Tema

Uma promessa só, ligada ao que ele vende (`perfil.json`). Formato do título: o resultado que o
lead quer + o mecanismo dele. Propor 3 títulos, recomendar 1. Perguntar UMA vez qual a dúvida que
os clientes dele mais trazem: ela vira o centro da aula.

### [02] Esqueleto

Lista numerada de slides, uma linha cada, em 5 blocos:

| Bloco | Slides | Função |
|---|---|---|
| Abertura | 1 a 3 | capa, a promessa, para quem é (e para quem não é) |
| Problema | 4 a 8 | o erro comum, por que acontece, quanto custa não resolver |
| Método | 9 a 20 | os passos do mecanismo dele, um passo por slide, com exemplo |
| Prova | 21 a 24 | caso real com dado dele, ou exemplo hipotético declarado |
| Convite | 25 a 30 | o que muda depois, o que acontece na reunião de 20 min, CTA com link |

Mostrar o esqueleto e pedir OK antes de escrever texto.

### [03] Texto

Salvar em `texto.md`, um bloco por slide (`## Slide 07` + texto). Contar palavras de cada slide.
Marcar `[VERIFICAR]` onde couber. Mostrar o texto inteiro e pedir OK. Depois do OK, resolver
cada `[VERIFICAR]` com ele.

### [04] HTML

Um arquivo `webinar.html` com todos os slides, cada um numa `.pagina` de 1280x720:

```html
<style>
  @page { size: 1280px 720px; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  .pagina { width: 1280px; height: 720px; overflow: hidden; position: relative;
            page-break-after: always; break-after: page; padding: 64px 80px; }
  .pagina:last-child { page-break-after: auto; break-after: auto; }
</style>
```

- Cores e fonte de `perfil.json`. Título 64 a 80px, corpo 34 a 44px.
- Número do slide no canto (07/26) e o @ dele no rodapé discreto.
- Imagens em base64, nunca `file://`.
- Link do CTA clicável (`<a href>`): no PDF ele continua clicável.

### [05] PDF

```bash
python ScriptsFera/render.py pdf output/webinar-pdf/<pasta>/webinar.html --paisagem --out output/webinar-pdf/<pasta>/webinar.pdf
```

### [06] QA página a página

Renderizar cada slide em PNG para olhar (o `--seletor` pega a página certa):

```bash
python ScriptsFera/render.py png output/webinar-pdf/<pasta>/webinar.html --w 1280 --h 720 --seletor ".pagina:nth-of-type(7)" --out output/webinar-pdf/<pasta>/qa/slide-07.png
```

Abrir cada PNG (Read) e conferir:

- [ ] Nenhum texto cortado ou saindo da página
- [ ] Nenhum `[VERIFICAR]` restante
- [ ] Máximo 25 palavras, acento certo
- [ ] Exemplo hipotético declarado no próprio slide
- [ ] Número de páginas do PDF = número de slides do esqueleto
- [ ] Último slide com o link da reunião de 20 minutos funcionando

### [07] Página de captura

O PDF é a isca. A página que entrega o PDF em troca do nome e WhatsApp sai pela skill
`squad-isca-fera` (passo [05] dela), com este PDF como material. Publicar segue as regras do
`/paginas-e-quiz` (mobile-first, QA em 375px).

### [08] Entrega

1. Registrar em silêncio:
   `python ScriptsFera/metas-api.py entrega add "webinar-pdf" "<webinar: título>" --link "output/webinar-pdf/<pasta>/"`
2. Caminho absoluto completo da pasta.
3. PDF parado na pasta não agenda reunião. Cobrar na mesma resposta: para quem ele manda hoje e em
   qual post ou story o PDF aparece esta semana.
