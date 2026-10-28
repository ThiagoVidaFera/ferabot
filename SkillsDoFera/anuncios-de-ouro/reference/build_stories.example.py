# -*- coding: utf-8 -*-
"""Gerador de STORIES 1080x1920 (9:16) — espelham os anúncios de feed, com copy enxuta (story é glanceable).
Fotos reais em ../assets/. Zona morta: nada de texto nos 250px do topo nem na faixa de baixo (ver stories.css).

EXEMPLO HIPOTÉTICO (didático): troque tudo pelos dados REAIS do dono. [A PREENCHER] = dado que só o dono tem.
Uso: dentro de <lote>/stories/, copie story.css como stories.css e este arquivo como build_stories.py.
"""
import json
import pathlib
import sys

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

OUT = pathlib.Path(__file__).parent


def carregar_perfil() -> dict:
    for pasta in [OUT, *OUT.parents]:
        arq = pasta / "perfil.json"
        if arq.exists():
            return json.loads(arq.read_text(encoding="utf-8"))
    return {}


PERFIL = carregar_perfil()
NOME = PERFIL.get("nome", "[A PREENCHER: seu nome]")
PRODUTO = PERFIL.get("produto", "[A PREENCHER: nome da oferta]")

ST = [
    dict(id="01-dor", accent="emerald", photo="p1.jpg", objpos="58% 20%",
         tag="// pra psicólogas com consultório",
         headline='Agenda vazia<br>não é falta de talento.<br><span class="hl">É falta de método.</span>',
         sub="Você atende bem. Falta o caminho pro paciente certo te encontrar.",
         ctx="posicionamento · rotina de 2h/semana · <b>roteiro de primeira conversa</b>",
         price=dict(line1="[A PREENCHER: preço cheio]", big="[A PREENCHER: preço]", cond="[A PREENCHER: condição]"),
         cta="Chama no direct", seal="[A PREENCHER:<br><b>garantia</b>]"),

    dict(id="02-transformacao", accent="gold", photo="p2.jpg", objpos="60% 24%",
         tag="// de indicação a agenda previsível",
         headline='Antes: esperar indicação.<br><span class="hl">Depois: saber de onde vem o próximo.</span>',
         sub="O que muda não é o seu atendimento. É o caminho até ele.",
         ctx="encontros ao vivo · <b>[A PREENCHER: duração real]</b>",
         price=dict(line1=PRODUTO, big="[A PREENCHER: preço]", cond="[A PREENCHER: condição]"),
         cta="Fala comigo no direct", seal=""),
]

TPL = """<!doctype html>
<html lang="pt-br"><head><meta charset="utf-8">
<link rel="stylesheet" href="stories.css"></head>
<body>
<div class="st accent-{accent}" style="--objpos:{objpos}">
  <div class="photo"><img src="../assets/{photo}" alt="{nome}"></div>
  <div class="kicker">{produto}</div>
  {seal_float}
  <div class="content">
    <div class="topbar"><span class="tag">{tag}</span></div>
    <h1 class="headline">{headline}</h1>
    <p class="sub">{sub}</p>
    <p class="ctx">{ctx}</p>
    <div class="offerbar">
      <div class="price">
        <span class="line1">{line1}</span>
        <span class="big">{big}</span>
        <span class="cond">{cond}</span>
      </div>
      <div class="cta"><span class="wa"></span>{cta} →</div>
    </div>
  </div>
</div>
</body></html>"""

if __name__ == "__main__":
    pendentes = 0
    for s in ST:
        seal = f'<div class="seal-float">{s["seal"]}</div>' if s.get("seal") else ""
        p = s["price"]
        html = TPL.format(accent=s["accent"], objpos=s["objpos"], photo=s["photo"], nome=NOME,
                          produto=PRODUTO, seal_float=seal, tag=s["tag"], headline=s["headline"],
                          sub=s["sub"], ctx=s["ctx"], line1=p["line1"], big=p["big"],
                          cond=p["cond"], cta=s["cta"])
        pendentes += html.count("[A PREENCHER")
        (OUT / f'story-{s["id"]}.html').write_text(html, encoding="utf-8")
        print("gerado story-" + s["id"])
    print(f"OK — {len(ST)} stories")
    if pendentes:
        print(f"!! {pendentes} campo(s) [A PREENCHER] — não publicar antes de preencher com dado real.")
