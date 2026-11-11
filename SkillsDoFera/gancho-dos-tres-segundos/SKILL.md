---
name: gancho-dos-tres-segundos
description: "Decide a IMAGEM e o TEMPO da abertura de anúncio em vídeo: quadro 0 que vira miniatura, mudança visual até 1,5 s, 10 padrões de abertura, gancho em 3 camadas com gatilho. Complementa ganchos-de-videos-visuais (efeito impossível). Triggers: abertura do anúncio, primeiros segundos, taxa de gancho baixa."
---

> **Origem e adaptação (FeraBot).**
> - Skill do pacote "Sistema de Criativos FCA" (créditos no LEIA-ME desta pasta). No FeraBot ela entra como **direção
>   criativa**: roteiro, cena, regras e checklists.
> - Onde citar `bin/motor-video.py`, `motor-de-video`, `remotion-marca`, `kit/` ou `acervo/`: esses caminhos não existem
>   aqui. Use o que você tem: `ScriptsFera/render.py`, `ScriptsFera/narrar.py` e FFmpeg, ou o motor de vídeo que preferir
>   (HyperFrames ou Remotion, se estiver instalado).
> - Cores, fontes e marcas dos exemplos (MCT, MLC/Lead Certo, FCA, ciano #00f0ff, Sora) são do autor original: aqui valem
>   as do seu `perfil.json`.
> - Prova e número: número sem origem fica fora da peça. Nunca inventar print, depoimento ou resultado. Selo SIMULAÇÃO
>   não libera peça pública.
> - Copy de venda passa pelo checklist A/B/C/D do roteador; mídia gerada por IA tem o custo dito antes de gastar crédito.

# gancho-dos-tres-segundos — o anúncio se decide antes da segunda frase


Princípio: **o olho chega antes do ouvido.** Muita gente assiste no mudo: o que se vê nos 3 primeiros
segundos precisa funcionar sem som, e o quadro 0 é a miniatura.

## Quando usar
- Todo anúncio novo, antes da amostra.
- Taxa de gancho (3 s ÷ impressões) abaixo da média da conta.
- Montar a matriz de ganchos para `variacoes-de-criativo-ia`.

## Entradas
- Público e dor (do briefing), prova disponível (painel real?), primeira frase gravada (ou opções gravadas).
- Para texto de gancho: `gerador-de-ganchos` / `copy-headline-formula`.

## Catálogo de padrões de abertura
| # | Padrão | Quadro 0 | Quando funciona |
|---|---|---|---|
| 1 | **Painel com número** | a tela que o comprador usa, número grande destacado | sempre que há prova real (nosso padrão mais forte) |
| 2 | **Comando ao vivo** | a pessoa fala uma ordem e a tela obedece no mesmo segundo | produto de ferramenta/IA |
| 3 | **Callout do público** | "GESTOR DE TRÁFEGO:" + rosto | público definido, frio |
| 4 | **Pergunta que dói** | pergunta em 2 linhas + rosto sério | dor conhecida |
| 5 | **Quebra de crença** | afirmação contraintuitiva riscada/corrigida | mercado saturado |
| 6 | **Resultado em comparação** | dois números lado a lado, mesma janela de datas | antes/depois legítimo com dado |
| 7 | **Demonstração antes da fala** | o resultado já acontecendo na tela | produto visual |
| 8 | **Cena reconhecível** | a conversa/notificação que o público vive (logo real do app) | serviço local, WhatsApp |
| 9 | **Objeção derrubada** | "MAS [OBJEÇÃO]?" → prova em 1 s | remarketing |

**Padrão 10 · Rótulo de story com âncora** (fonte: estudo de efeitos nomeados, 17/10/2026, `artefatos/estudo-efeitos-nomeados/GRAMATICA.md` §2):
- **O que é:** afirmação de 3–7 palavras em CAIXA ALTA branca sobre faixas pretas arredondadas, uma por linha, sem animação. Fica sobre o take em selfie ou sobre o painel real.
- **Medidas:** 34–44 px, raio 8–12. Aparece do quadro 0 até ≈ 3 s. No orgânico fica em y 6–15 %; no pago desce para y ≥ 420.
- **Quando funciona:** em tema com âncora conhecida (valor "R$ 10 mil → grátis", analogia "X = Y", resultado na tela).
- **Medido:** foi o gancho dos 3 reels de maior alcance do estudo (≈ 1 mi, 801 mil e 538 mil views), todos com edição quase nula. As perguntas ("A IA consegue…?") ficaram no grupo de baixo.
- **Catálogo:** `REF-EDICAO-IA-EF-14`.

## Gancho em 3 camadas (fonte: EVIA A07 + anexo de pautas e roteiros)
Todo gancho tem **três camadas que dizem a mesma coisa** — use no mínimo duas, de preferência as três:
| Camada | O que é | Regra |
|---|---|---|
| Falada | a 1ª frase, começando direto no assunto | ≤ 8 palavras; contém **objeto, número ou contradição**; nada de "oi, eu sou", "hoje vou falar", "você sabia" |
| Visual | o que se vê antes de 3 s | o objeto, a cena real, o contraste, o resultado pronto por 1 s — entra junto com a fala, não depois |
| Escrita | o texto na tela (o feed assiste no mudo) | as mesmas palavras-chave da falada, no quadrado central |
**Tipos de abertura falada** e o padrão de quadro 0 que casa com cada um: número que surpreende → #1/#6 · contradição ("fez certo e deu
errado") → #5 · começar no meio da cena → #7/#8 · objeto na mão → #7 · resultado antes ("isto levou 20 min, olha como") → #7 · identificação
("se você…") → #3/#4 · erro caro com prova → #1/#9 · lista direta (abre falando o primeiro item, sem preâmbulo) → contador "N de X" fixo no topo.
**Gatilho declarado:** cada gancho diz qual gatilho aciona (recompensa pelo tempo, mistério, reconhecimento do perfil, popularidade de um
assunto em alta com ligação real, crença antiga × dado novo, autoridade pela experiência, disrupção "não é A, não é B, é C"). Gancho que não
aciona nenhum é **morno** (frase de suspense vazia, sem objeto nem número — "isso vai te surpreender") e não passa.
**Regras extras:** afirmação falsa que se corrige tem de se corrigir em até ~5 s; nome de marca/pessoa famosa vai na 1ª palavra **só no
orgânico** (no pago, logo e marca de terceiro não entram); a cena real mais forte do material (o fato, o print) vai no quadro 0 e volta depois
como callback (fonte: EVIA A11, A12).
**Escreva 3, suba 1:** o roteiro traz o gancho principal + 2 de reserva; a reserva fica guardada para a próxima rodada (regra 16/10: 1 anúncio
por criativo, sem variações A/B/C salvo pedido). Contraponto EVIA: a fonte também guarda 2 alternativas, mas para teste — aqui só a pedido.

## Passo a passo
1. Escolha **3 padrões** diferentes para o criativo (um deles, se houver prova, é o nº 1). As 3 servem para **escolher** a abertura; sobe 1
   por criativo, salvo pedido de teste do autor.
2. Para cada um, defina: texto do quadro 0 (máx. 7 palavras, 2 linhas, acento ciano numa palavra), imagem
   do quadro 0, primeira mudança visual (≤ 1,5 s: corte, zoom 1,0→1,12, entrada do painel, whip) e a
   frase falada que casa com a imagem.
3. **Regras de montagem:**
   - Quadro 0 com o gancho **inteiro** — nada de fade do preto, título digitando ou logo de abertura.
   - Texto do gancho dentro do quadrado central (y 420–1500 em 1080×1920), lateral ≥ 90 px,
     `fontSize_max ≈ 750 / (caracteres × 0,7)`; Sora 800 caixa alta branca com uma palavra ciano.
   - Lido em 1 s: contraste alto (fundo `#020408` ou scrim 55% sobre vídeo).
   - Som: primeira palavra até 0,3 s; SFX de impacto discreto no primeiro corte (se houver trilha
     autorizada); voz 12–15 dB acima da trilha.
   - Estímulo novo a cada 1,5–2,5 s nos primeiros 6 s.
4. **Teste de mudo:** exporte os 3 primeiros segundos sem áudio; se não dá para entender de quem é e o que
   promete, refaça.
5. **Folha de miniaturas:** quadro 0 das 3 aberturas lado a lado em tamanho de celular.
6. Escolha 1 pela folha e pelo teste de mudo; registre as outras 2 no `DIRECAO.md` como reserva. Matriz de
   `variacoes-de-criativo-ia` (variável = gancho) só se o autor pedir teste.

## Prompt-modelo
```
Monte 3 aberturas para render/[base]-v[N] (o resto do vídeo igual): [padrão A], [padrão B], [padrão C].
Quadro 0 com o gancho inteiro (sem fade), texto máx. 7 palavras em 2 linhas, Sora 800, uma palavra em
ciano #00f0ff, dentro de y 420–1500 e a ≥ 90 px das laterais. Primeira mudança visual até 1,5 s.
Exporte os 3 s iniciais de cada uma sem áudio + a folha com o quadro 0 das três. Nada de número
inventado: o painel é assets/[print real].
```

## Checklist
- [ ] Quadro 0 entendível sozinho (vira miniatura)
- [ ] Primeira mudança visual ≤ 1,5 s
- [ ] Gancho legível em 1 s no celular, dentro do quadrado central
- [ ] Funciona no mudo
- [ ] Promessa do gancho é cumprida pelo vídeo (sem isca)
- [ ] 3 aberturas diferentes de verdade (padrões distintos, não sinônimos)
- [ ] As 3 camadas (falada ≤ 8 palavras, visual antes de 3 s, escrita) dizem a mesma coisa; gatilho declarado; nenhum gancho morno
- [ ] Sem costura seca (02/10/2026): faixa de título/selo sobre mídia em degradê ≥ 220 px, mídia encaixada com bordas esfumadas ≥ 120 px, troca de mídia na mesma cena com crossfade 8–12 quadros — regra em `remotion-marca` → "Costura sem degradê"; rodar `python3 bin/detectar-costuras.py VIDEO.mp4`

## Armadilhas
- Abrir com logo, "Olá, tudo bem?" ou contexto: o público já foi.
- Gancho que o resto do vídeo não entrega derruba retenção e qualidade do anúncio.
- Número no gancho sem fonte real = reprovação e risco de conta.
- Encenar o problema em vez de mostrar a tela: nos nossos testes, encenação não vendeu.

## Saída
`revisao/ganchos/<slug>-G0X-<padrao>-3s.mp4`, `revisao/ganchos/folha-quadro0.jpg`, linhas na matriz de variações.
