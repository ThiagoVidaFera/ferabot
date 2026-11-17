---
name: squad-carrossel-fera
description: Gera carrosseis de feed para Instagram personalizados com o nicho, produto e paleta do mentor. 10 slides por leva, copy aprovada antes de renderizar. Agenda pelo Post for Me quando a chave existe, senão entrega para publicar à mão.
---

# Squad Carrossel Fera

Fera, vamos criar carrosseis pra bombar o seu feed!

## Antes do briefing: qual formato?

Esta skill faz o carrossel clássico de 10 slides. O Ferabot tem mais três formatos, e o cliente
deve testar formatos diferentes no perfil dele. Se o pedido for aberto ("faz um carrossel"),
perguntar UMA vez qual formato e mostrar a tabela:

| Formato | Skill | Quando |
|---|---|---|
| Clássico 10 slides | esta | ensinar, listar, quebrar crença |
| Ilustrado (modelo Greco) | `carrossel-ilustrado` | método com prova visual em cada slide |
| Historinha (modelo Vaz) | `carrossel-historinha` | erro comum contado por personagem fictícia declarada |
| Tela viva (modelo Lucas Lopes) | `carrossel-tela-viva` | sistema funcionando, tela em vídeo em cada slide |

Cliente novo: sugerir testar os 3 formatos que combinam com o nicho em 2 semanas, cada um com uma
palavra-chave de comentário diferente, e comparar comentários e conversas depois de 48 horas.
Ninguém garante qual vence no perfil dele. Quem decide é o número.

## Pré-requisito

Ler `perfil.json` da pasta raiz do Ferabot antes de qualquer coisa.

## Fluxo obrigatório

```
[01] Briefing → [02] Copy (aprovação) → [03] Design → [04] Render → [05] Entrega
```

**NUNCA pular a aprovação de copy antes de renderizar.**

## [01] Briefing

Perguntar ao fera:
1. **Tema/assunto** do carrossel (ou "pode escolher" pra sugerir)
2. **Formato:** storytelling (história/caso real) ou educativo (dicas/lista)?
3. **CTA final:** capturar lead, vender produto, ou engajamento?

Se o fera disser "pode escolher", sugerir o tema mais alinhado ao nicho do `perfil.json`.

## [02] Geração de Copy

Gerar a estrutura completa dos slides com base no `perfil.json`:

### Slide 1 — Gancho (marco temporal ou manchete)
- Marco temporal: "Semana passada, [cliente do nicho] fez [ação específica] e [resultado concreto]"
- Manchete: atacar uma crença errada ou revelar uma contradição do nicho
- Nunca começar com "Você sabia que..." ou pergunta genérica

### Slides 2-8 — Desenvolvimento
- Máx 3 linhas por bloco de texto
- Diferenciação visual entre blocos (negrito / normal / destaque)
- Progressão lógica: problema → causa → solução → evidência → resultado

### Slide 9 — Virada / Momento fera
- Transformação concreta que o produto/mentoria entrega
- Específico ao nicho: nunca genérico

### Slide 10 — CTA
- Frase conversacional com keyword de identificação
- Formato: "[verbo imperativo] [ação concreta] [benefício imediato]"
- Se capturar lead: incluir keyword para a automação comentário → DM do `/crm-de-leads`

### Apresentar ao fera para aprovação antes de continuar.

## [03] Design do carrossel

Após APROVADO explícito, gerar HTML para cada slide.

### Especificações técnicas
- Dimensões: 1080×1350px
- Paleta: usar `cor_primaria` e `cor_secundaria` do perfil
- Fonte headline: bold, 80-100px
- Fonte corpo: 34-40px
- Padding lateral: 64px mínimo
- Background: dark premium ou branco — alternar entre slides
- Handle `{{handle_instagram}}` sempre presente (rodapé ou pill no topo)
- Número do slide (1/10, 2/10...) no canto superior

### Estrutura do HTML (cada slide)
```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1080px; height: 1350px; overflow: hidden;
         font-family: 'Inter', sans-serif; }
  /* estilos do slide */
</style>
</head>
<body>
  <!-- conteúdo do slide -->
</body>
</html>
```

### Salvar em
`output/carrossel/YYYY-MM-DD/slide-01.html` ... `slide-10.html`

## [04] Renderização

Usar Playwright para converter HTML → PNG:

```python
from playwright.sync_api import sync_playwright
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "ScriptsFera"))
from lib import load_perfil, ensure_output_dir

perfil = load_perfil()
output = ensure_output_dir("carrossel")

with sync_playwright() as p:
    browser = p.chromium.launch()
    for i in range(1, 11):
        page = browser.new_page(viewport={"width": 1080, "height": 1350})
        html_path = output / f"slide-{i:02d}.html"
        page.goto(f"file:///{html_path}")
        page.screenshot(path=str(output / f"slide-{i:02d}.png"), full_page=False)
    browser.close()
```

**Imagens externas:** sempre base64 inline. Nunca `file://` em `src`.

## [05] Entrega

Após renderizar:
1. Confirmar: "Fera, seus 10 slides estão prontos em `output/carrossel/YYYY-MM-DD/`"
2. Abrir a pasta automaticamente se possível
3. Instrução de publicação:
   > "Para publicar: abra o Meta Business Suite ou o app do Instagram. Crie um novo post, selecione os 10 PNGs na ordem (slide-01 → slide-10) e publique como carrossel. A legenda vai abaixo."
4. Gerar legenda pra copiar e colar (3-5 linhas + emojis + hashtags do nicho) e salvar em
   `output/carrossel/YYYY-MM-DD/legenda.txt` (o agendador lê esse arquivo)
5. Seguir para a seção Agendar abaixo

## Agendar

Conferir se `POSTFORME_API_KEY` existe no `.env` da raiz.

**Sem a chave:** entrega manual como no passo [05]. Os 10 PNGs na ordem, legenda pronta, e a
cobrança de data e hora de publicar na mesma resposta. Quem quiser agendar daqui pra frente roda
`python SetupFera/setup_chaves.py` (guia no `API_SETUP.md`, seção 6).

**Com a chave:**

1. Perguntar data e hora de publicar (horário de Brasília). Sem data, não agenda.
2. Rodar o plano, que não envia nada:
   ```bash
   python ScriptsFera/publicar.py agendar output/carrossel/YYYY-MM-DD/ --formato carrossel --quando "AAAA-MM-DD HH:MM"
   ```
   Os slides entram na ordem do nome (slide-01, slide-02 ... slide-10) e a legenda vem do
   `legenda.txt` da pasta.
3. Mostrar ao dono, em lista: data e hora, formato, conta (@), ordem dos slides e a legenda inteira.
4. Pedir OK explícito. Sem OK, nada sobe.
5. Com OK, rodar o mesmo comando com `--enviar`. Guardar o id que voltar.
6. Conferir com `python ScriptsFera/publicar.py listar`. Errou: `python ScriptsFera/publicar.py cancelar <id>`.

Mais de uma conta de Instagram conectada: listar com `python ScriptsFera/publicar.py contas` e
passar `--conta <id>`. O status `connected` não prova que a conexão com a Meta está viva: no
primeiro agendamento, conferir no painel do Post for Me se o post saiu.

## Regras de qualidade (QA antes de entregar)

- [ ] Nenhuma palavra cortada na borda
- [ ] Handle `{{handle_instagram}}` presente em todos os slides
- [ ] Safe zone respeitada (nenhum conteúdo nos 60px das bordas)
- [ ] Slide 1 tem gancho específico (não genérico)
- [ ] Slide 10 tem CTA com ação clara
- [ ] Paleta `cor_primaria` e `cor_secundaria` usadas
- [ ] Fontes legíveis em mobile (corpo mínimo 34px)

## Exemplo de comunicação

Após entregar:
> "Fera, carrossel pronto! 10 slides na pasta. Me diz o dia e a hora que ele sai e eu deixo agendado (ou, sem a chave do Post for Me, copia pro celular e sobe pelo app). Quer que eu gere os stories de divulgação desse carrossel também?"
