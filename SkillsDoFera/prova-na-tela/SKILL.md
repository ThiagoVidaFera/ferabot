---
name: prova-na-tela
description: "Anima print ou gravação REAL de painel (Ads Manager, CRM, WhatsApp, GA4) sem redesenhar: círculo no número, região+nota, número→detalhe, problema→resposta, checklist sincronizado, em 9:16. Todo número exige origem; sem origem a peça sai do lote. Triggers: anima o print, circula os números, prova no vídeo."
---

> **Origem e adaptação (FeraBot).**
> - Skill do pacote "Sistema de Criativos FERA" (créditos no LEIA-ME desta pasta). No FeraBot ela entra como **direção
>   criativa**: roteiro, cena, regras e checklists.
> - Onde citar `bin/motor-video.py`, `motor-de-video`, `remotion-marca`, `kit/` ou `acervo/`: esses caminhos não existem
>   aqui. Use o que você tem: `ScriptsFera/render.py`, `ScriptsFera/narrar.py` e FFmpeg, ou o motor de vídeo que preferir
>   (HyperFrames ou Remotion, se estiver instalado).
> - Cores, fontes e marcas dos exemplos (MCT, MLC/Lead Certo, FCA, ciano #00f0ff, Sora) são do autor original: aqui valem
>   as do seu `perfil.json`.
> - Prova e número: número sem origem fica fora da peça. Nunca inventar print, depoimento ou resultado. Selo SIMULAÇÃO
>   não libera peça pública.
> - Copy de venda passa pelo checklist A/B/C/D do roteador; mídia gerada por IA tem o custo dito antes de gastar crédito.

# prova-na-tela — a tela real fica; só o olhar anda

Princípio (a nossa regra de ouro): **vende o criativo que mostra a tela que o comprador já abre, com
números que ele compara com os dele.** Quando essa tela existe em print ou gravação, ela é a cena. O motion
não desenha um painel novo: ele **leva o olho** ao número, ao campo, ao erro e ao conserto, nessa ordem.

Posição no fluxo: `painel-do-comprador-na-cena` (captura limpa, blur, reconstrução fiel) → **prova-na-tela**
(animação da atenção) → montagem (`remotion-marca` / `motor-de-video`). Se não houver print/gravação real,
saia daqui para `catalogo-de-efeitos` (famílias comparação/diagrama) com selo SIMULAÇÃO quando faltar dado.

## Os cinco movimentos (ids do `catalogo-de-efeitos`)
| Movimento | id | A fala diz | Duração 9:16 anúncio · aula |
|---|---|---|---|
| Círculo nas métricas | `prova-circular-metricas` | "aqui o CTR, aqui o CPA… dentro da meta" | 4,8 s · 8 s |
| Região + nota | `regiao-com-nota` | "repara neste campo" | 5,4 s · 9 s |
| Número → detalhe | `numero-ao-detalhe-na-tela` | "esse é o número; olha onde ele nasce" | 6 s · 10 s |
| Problema → resposta → resolvido | `problema-resposta-resolvido` | "o erro está aqui… a correção… resolvido" | 6 s · 10 s |
| Checklist sincronizado | `checklist-sincronizado-com-tela` | "marca comigo enquanto eu faço" | 4,2 s · 7 s |

Complementares da mesma família: `trecho-de-fonte-marcado` (política/contrato), `toques-no-celular`
(tutorial com gravação), `atalho-e-alvo`, `comentario-com-marcador`, `voz-vira-texto-no-campo`.

## Insumos (sem eles, não começa)
1. **Print ou gravação real, legível**, na resolução nativa (print ≥ 1,5x a área exibida para aguentar o zoom).
   Tela da conta do autor, do cliente com autorização, ou de aluno com termo (alertar em 1 linha e executar).
2. **Blur só no dado sensível** (nome, telefone, e-mail, ID de conta, valor de terceiro). Tela quase toda
   borrada não serve: se não há tela limpa, use diagrama/capa ou reconstrução fiel com selo SIMULAÇÃO.
3. **Alvos medidos no print** em coordenadas normalizadas (0–1) — `[x, y, raio]` para círculo,
   `[x, y, largura, altura]` para região. Medir no arquivo, não "a olho" no preview.
4. **Origem de cada número** (ver `build.json` abaixo).
5. **Transcrição com tempo por palavra** do trecho (palavra-gatilho de cada marcação).
6. Paleta do produto (`PADRAO-DE-MOVIMENTO.md` §6): marcações na cor do `acento`; erro na cor `erro`.

## Passos
1. **Escolher o movimento** pela fala (tabela acima). Uma prova por batida; no máximo 4 alvos.
2. **Recortar para 9:16:** o print ocupa a largura (margem 48–72 px); a altura é recortada na região dos alvos;
   se o painel é largo, a câmera aproxima até 1,6x em vez de encolher o painel inteiro (ver `VERTICAL.md`).
   Alvos dentro do núcleo y 420–1500. Nota e status embaixo do print, nunca sobre o alvo.
3. **Preencher o `build.json`** (origem de cada número, alvos, tempos) antes de abrir o código.
4. **Pedir ao motor** com o bloco de pedido do `catalogo-de-efeitos` (efeito, formato, paleta, fala, números com origem).
5. **Amostra 9:16** do trecho (5–10 s) → aprovação → 4:5 por props → par pago + orgânico.
6. **Revisão por quadros-chave** (abaixo) e `ffprobe` do final.

## Tempos em 9:16 (anúncio; aula usa os do catálogo)
| Movimento | Sequência (s) |
|---|---|
| Círculos | print parado já no quadro 0 · 1º círculo desenha em 0,45 s a partir de 0,5 · próximos a cada 0,6 · visto final (traço, 0,35 s) · status · leitura ≥ 1,2 |
| Região + nota | print no quadro 0 · resto escurece e borda desenha em 0,4 (a partir de 0,4) · empurrão conjunto 1,0→1,025 · linha 0,35 · nota por máscara 0,3 · leitura ≥ 1,5 |
| Número → detalhe | anel e número contam juntos (1,2 s) enquanto a câmera viaja ao alvo; o anel termina antes da câmera parar · anel sai (0,3) · molduras de canto nos detalhes a cada 0,5 · leitura ≥ 1,2 |
| Problema → resolvido | círculo no erro (0,6) · cartão de resposta por máscara (1,6) · etapas preenchem a cada 0,35 · círculo do erro sai · carimbo "resolvido" com pop · leitura ≥ 1,2 |
| Checklist | layout parado desde o quadro 0 · cada check (traço de 0,2 s) **no segundo medido na gravação** em que a ação acontece · leitura ≥ 1,2 |

Curvas: traço de círculo = saída quadrática; câmera = senoidal ida-e-volta; número que chega = `brandEasing`;
carimbo = pop leve. Sem pulsos, sem brilho, sem círculo que "escala" no lugar de desenhar.

## `origem` obrigatória — `build.json` da peça
```json
{
  "peca": "MCT-AD21-prova-eventos",
  "efeito": "prova-circular-metricas",
  "formato": "1080x1920",
  "paleta": "mct",
  "midia": {"arquivo": "assets/prints/events-manager-2026-10-08.png", "sha256": "<hash>", "blur": ["id-do-pixel"]},
  "numeros": [
    {"rotulo": "Nota do evento Purchase", "valor": "<como está no print>",
     "origem": {"tipo": "print", "tela": "Gerenciador de Eventos > Visão geral", "conta": "<conta>", "capturado_em": "2026-10-08", "arquivo": "assets/prints/events-manager-2026-10-08.png"}}
  ],
  "alvos": [[0.62, 0.41, 0.06]],
  "gatilhos": [{"palavra": "nota", "t": 1.84}],
  "selo_simulacao": false
}
```
- Valor **copiado como aparece no print** (mesma vírgula, mesma unidade, mesmo arredondamento).
- Qualquer número sem `origem` → `selo_simulacao: true` → selo SIMULAÇÃO visível e a peça não sobe como prova.
- Derivado (variação %, razão) calculado por script a partir dos valores com origem.

## Exemplos
**MCT (Missão Claude Tracking)** — dor = o Pixel ensina o comportamento errado ao Meta. Print do Gerenciador de
Eventos da conta de aluno com termo: `prova-circular-metricas` em três alvos — evento de compra, parâmetros
recebidos, nota do evento — fala "olha o que o seu Pixel está contando para o Meta". Fecha em
`problema-resposta-resolvido`: círculo no evento sem parâmetro → cartão "evento com valor, moeda e ID" →
carimbo "aprendendo certo". Paleta MCT; **sem preço** em nenhum quadro; nada de contagem "X compras × 0".

**Lead Certo (MLC)** — print real do painel de conversas do cliente (WhatsApp/CRM): `numero-ao-detalhe-na-tela`
do número de conversas para a coluna de qualificados, com os valores **exatamente como estão no print**
(a copy cita "2.402 mensagens → 563, conversão 19% → 46%": só entra com o print correspondente na `origem`).
Paleta Lead Certo (fundo `#020408`, acento `#00f0ff`). Em anúncio por profissão, a profissão grande abre o
gancho antes da prova.

**FCA (Fábrica de Criativos Automáticos)** — gravação de tela real da fábrica gerando um anúncio a partir de uma URL:
`checklist-sincronizado-com-tela` com "colar a URL · escolher o produto · gerar · anúncio pronto", cada check no
segundo medido da gravação. Depois `regiao-com-nota` no anúncio gerado ("pronto para subir"). Paleta FCA
(dourado `#FFC21A` como acento único, ciano só no selo "IA ligada"). Número de criativos/tempo só se vier da
própria gravação.

## Revisão por quadros-chave
Extrair e montar folha (com máscara de zona segura sobreposta):
1. Quadro 0 — print legível, gancho inteiro, nada se movendo;
2. cada marcação no instante da palavra-gatilho (círculo fechado sobre o número certo);
3. ±1 quadro de cada corte/troca (sem quadro vazio entre print e resultado);
4. meio da leitura final;
5. último quadro.
Conferir: número na tela = número no print = número na fala/legenda; blur só onde precisa; alvo não coberto
pela nota; marcações dentro de y 420–1500; selo SIMULAÇÃO presente se algum número não tem origem.

## Armadilhas
- Redesenhar o painel "mais bonito" quando o print existe: perde o reconhecimento do comprador.
- gpt-image para tela com número: corrompe dígito. Reconstrução, se necessária, é Remotion (`painel-do-comprador-na-cena`).
- Print pequeno ampliado: dígito borrado. Capturar em resolução maior.
- Painel inteiro encolhido no 9:16: ilegível. Recortar e aproximar.
- Voz clonada sobre take do autor falando: proibido; prova com voz clonada vai sem o rosto dele.

## Lições de campo — proposta/página real rolando em 9:16 (09/11/2026, Reel "proposta na tela")
- **Página com animação de entrada sai em branco no screenshot.** Abrir com `reduced_motion="reduce"` e adicionar a classe de revelação (`.in`) em tudo; esconder barras fixas (`.topbar`, `.barra`, `.prog`) por CSS, senão cobrem o texto.
- **Borrão por DOM, não por pixel:** trocar nome, valor e nicho por `<span>` com `filter:blur` antes do screenshot; borrar o corpo inteiro das seções pessoais do lead (nome sozinho deixa a história identificável).
- **Tela alta = recortes por seção** (`clip` por âncora) + `crop` do ffmpeg com easing, não um screenshot único de 20 mil px. Cache dos PNGs: a montagem completa leva ~7 min.
- **Legenda de 3 linhas no máximo** na faixa 1514–1670 (Arial 44, 40 colunas); 4 linhas invade a zona morta.
- **Python `-I` ignora `PYTHONUTF8`:** usar `-X utf8 -I`, senão emoji derruba o print no Windows.
- **Proposta de lead real em peça pública:** só com o OK do dono sobre qual lead; sempre com nome, valor e nicho borrados.

## Ligações
`painel-do-comprador-na-cena` · `catalogo-de-efeitos` (`PADRAO-DE-MOVIMENTO.md`, `VERTICAL.md`) · `motor-de-video` ·
`gancho-dos-tres-segundos` (padrão de abertura nº 1 "Painel com número") · `blur-preciso-aula` · `remotion-marca`.
