---
name: anuncio-nativo
description: >-
  Story ad 9:16 com cara de post nativo do Instagram, não de anúncio. Dois modos: DISTRIBUIÇÃO (sem CTA,
  caixa de texto do próprio IG sobre foto real, gate de rosto, campanha de visita ao perfil) e OFERTA
  (stickers, urgência real, CTA por palavra-chave na DM). Triggers "anúncio nativo", "story ad", "sem cara
  de anúncio". NÃO é estático de feed nem vídeo.
---

# Anúncio Nativo

Cria copy e direção de arte para anúncios verticais que parecem story real, print de bastidor ou publicação
espontânea. O objetivo é vender sem cara de peça publicitária.

**Pra quem é:** você, usuário do FERABOT, fazendo anúncio do seu negócio (ou de um cliente seu). Antes de
começar, ler `perfil.json` na raiz do FERABOT (nome, nicho, produto, @ do Instagram, cores). Se for pra um
cliente seu, perguntar nome, nicho e oferta dele e não usar o `perfil.json`.

**Não é a skill certa se:** você quer lote de estáticos de feed pra teste de ângulo (`squad-anuncios-estaticos`),
variações a partir de uma ideia (`mix-estaticos`) ou o kit completo feed + story + reel + carrossel com
fotos reais (`anuncios-de-ouro`).

## Dois modos — escolher antes de escrever

| Modo | Quando | CTA na arte |
|---|---|---|
| **DISTRIBUIÇÃO** (padrão pra story ad de alcance) | gerar visita ao perfil, seguidor, aquecer público; "sem cara de anúncio" | **NENHUM** |
| **OFERTA** | workshop, últimas vagas, seleção 1:1 com data/vaga real | palavra-chave por DM |

Na dúvida, perguntar UMA vez. O resto deste arquivo, a partir de "## Fluxo do modo OFERTA", é o modo OFERTA.

## Regras que valem pros dois modos

- **Prova e dado.** Peça pública usa só prova real (print verdadeiro, número com fonte, interface real).
  Dado que só o dono tem — preço, prazo, vagas, resultado, caso de cliente — nunca é inventado: vira pergunta
  ao dono ou `[A PREENCHER: o que falta]`. Sem prova real, a peça troca de formato ou sai do lote.
- **Zona morta de texto: 250px no topo e 250px na base** (de 1920). Nenhum texto nessas faixas — a UI do
  Instagram cobre. Foto e elemento gráfico podem.
- **Rosto nunca cortado nem coberto por texto.** Cabeça inteira no quadro, com folga; texto começa abaixo
  do queixo. Conferir no PNG final, no recorte do rosto, nunca na miniatura.
- **Política da Meta.** Nunca afirmar atributo pessoal de quem vê ("você que está endividado", "você que
  sofre de ansiedade"). Falar em 1ª pessoa ("eu passei por isso") ou descrever a situação, não a pessoa.
  Número próprio não pode soar como promessa de ganho ao leitor.
- **Checklist do lead preguiçoso, medroso e procrastinador** — toda peça de OFERTA precisa ter, explícito:
  - **anti-medo:** garantia, prova real ou aviso honesto que tira o risco;
  - **anti-procrastinação:** por que agir agora (data, vaga ou custo real de esperar);
  - **anti-preguiça:** o que vem pronto / o quão pouco ele precisa fazer;
  - **anti-problema-futuro:** suporte, acompanhamento, "não fica sozinho depois".
  No modo DISTRIBUIÇÃO (sem CTA) o checklist não se aplica à arte; aplica-se ao texto principal do anúncio.

---

## MODO DISTRIBUIÇÃO — story ad que não parece anúncio

Filosofia: o story patrocinado já mostra o perfil no topo e o botão da Meta embaixo. Tudo que a arte
acrescenta de "anúncio" só ajuda o dedo a pular. Então a arte é foto crua + duas caixas de texto do próprio
Instagram, fecho seco, sem pedir nada.

### O que SAI da arte (tudo que denuncia anúncio)
Chip de credencial · etiquetas ANTES/HOJE · faixa de métricas com divisória · véu/gradiente sobre a foto ·
itálico colorido e negrito · "Toque em Saiba mais" ou qualquer CTA (o botão é da Meta) · texto grande · logo.

### O que FICA
- **Foto crua, escura e afastada, em ângulo fora do padrão:** plano médio-aberto, câmera baixa ou fora do
  eixo, luzes práticas quentes no escuro, **objeto desfocado em primeiro plano** na faixa de baixo e **uma
  diagonal** (balcão, porta, trilho, mesa). Rosto ocupando ~13–20% da largura. Sem espelho (o reflexo vira
  "segunda pessoa"). Sem texto legível na foto.
  - **A foto é real, do dono do perfil**, tirada no celular seguindo essa receita de cena. O texto é em
    1ª pessoa — uma pessoa gerada por IA se passando pelo dono não vale.
  - Se o dono **pedir** foto por IA, gerar com `python ScriptsFera/imagem.py "<cena em inglês>" --ratio 9:16
    --out <pasta>/foto-01.png` (GEMINI_API_KEY no `.env`), salvar com sufixo `_PROVISORIA-IA` e avisar.
    Descrever a CENA ("wide shot, low angle, warm practical lights, blurred object in foreground…") funciona;
    pedir "cabeça pequena" não funciona. Gerar 3–4 candidatas por cena e escolher a que passa no gate.
- **Texto = caixa de destaque do Instagram, uma caixa por linha**, centralizada, Inter 600 ~44px, margens
  110px. Caixa 1 branca/texto preto = **problema no PASSADO**. Caixa 2 preta/texto branco = **solução no
  PRESENTE**. Fecho seco: a última linha é o fato, sem pedir nada.
- **Copy em PAS, com tempo verbal fixo:** P no passado ("antes", "por anos", "eu achava") · A = custo
  concreto · S no presente ("hoje eu", "agora", "com o que eu faço hoje"). Gatilhos: especificidade (número
  exato, cena) + identificação (1ª pessoa = linha de dentro; nunca "você que…").
- **Passado em 1ª pessoa é FATO da vida do dono:** nunca inventar. Marcar `[A PREENCHER: confirmar]` e
  perguntar. Número de mercado entra como "a conta que o mercado ensina", nunca como resultado do dono.

Exemplo hipotético (didático — trocar pelos fatos reais do dono):
> Caixa 1: `Por 3 anos eu respondi\ncada orçamento na mão, à noite.`
> Caixa 2: `Hoje o orçamento sai\nsozinho em 5 minutos.`

### Gate de rosto (obrigatório, mecânico)
O motor detecta o rosto na foto (YuNet, maior score), começa o texto em **queixo + 70px** (nunca acima de
y=250), encolhe a fonte até caber acima de **y=1540**, e reprova se não couber ou se algum pixel do recorte
do rosto mudar. QA visual no **recorte 1:1 do rosto** (`rosto_<id>.png`), nunca na miniatura.
Sem rosto detectado = reprova. Foto sem pessoa (objeto, ambiente) é permitida passando `"topo"` no JSON.

**Motor:** `motor/render_nativo.py` (dentro da pasta desta skill — em `~/.claude/skills/anuncio-nativo/`).

```
python ~/.claude/skills/anuncio-nativo/motor/render_nativo.py pecas.json output/anuncios/nativo/<AAAA-MM-DD>-<slug>/
```

`pecas.json` = lista de `{"id": "c01", "foto": "caminho/da/foto.jpg", "caixa1": "linha\nlinha", "caixa2": "linha"}`
(opcional `"topo": 600` pra foto sem rosto). Quebra de linha com `\n`; o motor protege "R$ " e "follow-up" de
quebrar. Requer `playwright` e `opencv-python` (`pip install playwright opencv-python` +
`python -m playwright install chromium`). Sai `nativo_<id>.png` + `rosto_<id>.png`; exit 1 se alguma reprovar.

### Campanha: comparar artes por custo de visita ao perfil
- **Gerenciador de Anúncios, não "Turbinar":** turbinar cria um anúncio isolado por post (hora e leilão
  diferentes), então não compara.
- Objetivo **Tráfego** (`OUTCOME_TRAFFIC`) · conjunto com destino **Perfil do Instagram**
  (`destination_type=INSTAGRAM_PROFILE`, `optimization_goal=VISIT_INSTAGRAM_PROFILE`) · posicionamento só
  Instagram Stories · CTA "Ver perfil do Instagram" · **aprimoramentos automáticos de criativo desligados**
  (preserva o visual nativo). Texto principal: uma linha em 1ª pessoa (a do "hoje").
- **Fase 1 (peneira, 3 dias):** 1 conjunto com todas as artes. **Fase 2:** as 4–5 melhores, conjuntos com
  orçamento igual (ou Teste A/B), ~50–100 visitas por arte antes de declarar. Julgar custo por visita
  **junto com seguidores ganhos e DMs**, não só a visita barata.
- Subir: manual no Gerenciador (passo a passo acima), ou pela skill `meta-ads-fera` se `META_ACCESS_TOKEN`
  e `META_AD_ACCOUNT_ID` estiverem no `.env`. Sempre criar PAUSADO e conferir antes de ativar.
- Antes de subir, reler as "Regras que valem pros dois modos" (1ª pessoa não afirma nada sobre quem vê).

---

## Fluxo do modo OFERTA

1. Ler `references/padrao-story.md` antes de produzir.
2. Ler `perfil.json` (ou o briefing do cliente) e aplicar o tom do dono: conversacional, sem hype.
3. Coletar ou inferir o mínimo necessário: oferta, público, promessa prática, mecanismo, data/prazo,
   preço/vagas/bônus **somente se forem reais** (senão `[A PREENCHER]`), palavra-chave do CTA e destino da ação.
4. Escolher uma das estruturas:
   - Workshop/evento: urgência → promessa prática → data → bullets → bônus/preço/vagas reais → CTA por palavra.
   - Últimas vagas/bio: urgência → nome da oferta → promessa → data → print/prova de destino → CTA.
   - Seleção 1:1/mesa: "procuro X pessoas" → contexto de bastidor → bônus/ganho → aviso honesto → CTA de candidatura.
5. Entregar em blocos prontos para composição:
   - texto por camada da arte;
   - layout 9:16 com posição de cada camada (respeitando a zona morta de 250px);
   - legenda curta opcional;
   - variações de headline/CTA se o usuário pedir teste.

## Regras duras do modo OFERTA

- Parecer story antes de parecer anúncio.
- Não simular interface do Instagram. Nunca colocar nome do perfil, avatar, tempo de postagem, horário,
  dados do celular, barra de progresso, campo "Enviar mensagem", ícones de curtir/comentar/compartilhar ou
  qualquer elemento de UI do app.
- Texto grande, centralizado e escaneável em celular.
- Usar caixas tipo sticker, não cards sofisticados.
- Emojis funcionais com moderação: alerta, check, calendário, dinheiro, aviso, presente, dedo apontando.
- CTA sempre conversacional: "Me manda \"PALAVRA\"..." ou "me responde aqui \"PALAVRA\"...".
- Filtro honesto entra quando a oferta é seletiva: quem não serve deve se reconhecer e sair.
- Não inventar preço, prazo, bônus, número de vagas, resultado financeiro, print, depoimento ou prova.
- Não usar visual de landing page, mockup polido, gradiente premium, excesso de logo, ícones decorativos ou texto pequeno.

## Saída padrão (modo OFERTA)

```markdown
## Variante A

### Copy na arte
Topo/alerta:
...
Contexto:
...
Bullets:
...
Filtro/ponte:
...
CTA:
...

### Direção de arte
Formato:
Fundo:
Camadas:
Hierarquia:
Cores:

### Legenda opcional
...
```

Se o usuário pedir arquivo visual: montar o HTML 1080×1920 em `output/anuncios/nativo/<AAAA-MM-DD>-<slug>/`
e renderizar com `python ScriptsFera/render.py png <arquivo.html> --w 1080 --h 1920`. Mostrar o caminho
absoluto da pasta no fim. Se quiser registrar a entrega no painel:
`python ScriptsFera/metas-api.py entrega add "anuncio-nativo" "<o que foi>" --link "<pasta>"`.

## Referências

- `references/padrao-story.md` — anatomia completa do padrão nativo (modo OFERTA), com estruturas de copy.
