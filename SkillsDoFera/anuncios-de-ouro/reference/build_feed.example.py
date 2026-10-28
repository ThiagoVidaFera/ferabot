# -*- coding: utf-8 -*-
"""Gerador de anúncios de FEED 1080x1350 — molde do Anúncio de Ouro.
HTML -> (render.py) -> PNG/JPG. DRY: 1 template, N specs.

EXEMPLO HIPOTÉTICO (didático): a oferta abaixo não existe. Troque tudo pelos dados REAIS do dono.
Todo dado que só o dono tem (preço, prazo, vagas, garantia, resultado) está como [A PREENCHER] —
a peça NÃO vai pro ar enquanto sobrar um [A PREENCHER].

Uso: copie este arquivo pra pasta do lote como build_ads.py, coloque as fotos em assets/ (p1.jpg, p2.jpg…),
copie feed.css como styles.css, edite MARCA e ADS, e rode: python build_ads.py && python render.py
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
    """Procura o perfil.json do FERABOT subindo as pastas a partir do lote."""
    for pasta in [OUT, *OUT.parents]:
        arq = pasta / "perfil.json"
        if arq.exists():
            return json.loads(arq.read_text(encoding="utf-8"))
    return {}


PERFIL = carregar_perfil()
MARCA = {
    "nome": PERFIL.get("nome", "[A PREENCHER: seu nome]"),
    "produto": PERFIL.get("produto", "[A PREENCHER: nome da oferta]"),
    "contato": PERFIL.get("handle_instagram", "[A PREENCHER: @ ou WhatsApp]"),
    "site": PERFIL.get("landing_page", "[A PREENCHER: link]"),
}


def body_bullets(items):
    lis = "".join(f"<li>{i}</li>" for i in items)
    return f'<ul class="bullets">{lis}</ul>'


def body_ctx(txt):
    return f'<p class="ctx">{txt}</p>'


# Exemplo hipotético: mentoria de agenda cheia pra psicólogas. Trocar pelos fatos reais.
ADS = [
    # 1 — DOR / PROBLEMA (layout foto-topo) ------------------------------------
    dict(id="01-dor", layout="top", accent="emerald",
         photo="p1.jpg", objpos="58% 24%",
         tag="// pra psicólogas com consultório",
         headline='Psicóloga: agenda vazia não é falta de talento. <span class="hl">É falta de método.</span>',
         sub="Você atende bem. O que falta é um caminho previsível pro paciente certo te encontrar.",
         body=body_bullets([
             "Um posicionamento que explica em 1 frase quem você atende",
             "Uma rotina de conteúdo que cabe em 2h por semana",
             "Um roteiro de primeira conversa que não parece venda",
         ]),
         bridge="Você não monta nada do zero. O plano vem pronto — você só executa.",
         price=dict(line1="[A PREENCHER: preço cheio]", big="[A PREENCHER: preço]",
                    cond="[A PREENCHER: condição]"),
         cta="Chama no direct",
         seal="[A PREENCHER: garantia real]"),

    # 2 — TRANSFORMAÇÃO (layout hero, foto full-bleed) -------------------------
    dict(id="02-transformacao", layout="hero", accent="gold",
         photo="p2.jpg", objpos="62% 30%",
         tag="// de indicação esporádica a agenda previsível",
         headline='Antes: esperar indicação.<br><span class="hl">Depois: saber de onde vem o próximo paciente.</span>',
         sub="O que muda não é o seu atendimento. É o caminho até ele.",
         body=body_ctx("Acompanhamento em grupo · encontros ao vivo · <b>[A PREENCHER: duração real]</b>"),
         bridge="Cada mês sem método é mais um mês dependendo da sorte.",
         price=dict(line1=MARCA["produto"], big="[A PREENCHER: preço]", cond="[A PREENCHER: condição]"),
         cta="Fala comigo no direct",
         seal=""),

    # 3 — CURIOSIDADE ---------------------------------------------------------
    dict(id="03-curiosidade", layout="top", accent="blue",
         photo="p1.jpg", objpos="52% 20%",
         tag="// o erro que quase toda clínica pequena comete",
         headline='Psicóloga: o problema não está no seu Instagram. <span class="hl">Está no que vem depois dele.</span>',
         sub="Te mostro em 5 minutos onde o paciente desiste — e como fechar esse buraco.",
         body=body_ctx("Sem fórmula mágica · sem dancinha · <b>sem virar influencer</b>"),
         bridge="Quem entende isso para de postar no escuro.",
         price=dict(line1=MARCA["produto"], big="[A PREENCHER: preço]", cond="[A PREENCHER: condição]"),
         cta="Me manda \"AGENDA\"",
         seal=""),
]

TEMPLATE = """<!doctype html>
<html lang="pt-br"><head><meta charset="utf-8">
<link rel="stylesheet" href="styles.css"></head>
<body>
<div class="ad ad--{layout} accent-{accent}" style="--objpos:{objpos}">
  <div class="photo">
    <img src="assets/{photo}" alt="{nome}">
    {accentline}
    {seal_float}
  </div>
  <div class="content">
    <div class="topbar">
      <span class="brand">{produto}</span>
      <span class="tag">{tag}</span>
    </div>
    <h1 class="headline">{headline}</h1>
    <p class="sub">{sub}</p>
    {body}
    <p class="bridge">{bridge}</p>
    <div class="offerbar">
      <div class="price">
        <span class="line1">{price_line1}</span>
        <span class="big">{price_big}</span>
        <span class="cond">{price_cond}</span>
      </div>
      <div class="cta"><span class="wa"></span>{cta} →</div>
    </div>
    <div class="foot">
      <span>{nome}</span><span class="sep">·</span>
      <span>{contato}</span><span class="sep">·</span>
      <span>{site}</span>
    </div>
  </div>
</div>
</body></html>"""


def render_one(ad):
    accentline = '<span class="accentline"></span>' if ad["layout"] == "top" else ""
    seal_float = ""
    if ad.get("seal") and ad["layout"] == "top":
        seal_float = f'<div class="seal-float">{ad["seal"]}</div>'
    p = ad["price"]
    return TEMPLATE.format(
        layout=ad["layout"], accent=ad["accent"], objpos=ad["objpos"],
        photo=ad["photo"], accentline=accentline, seal_float=seal_float,
        tag=ad["tag"], headline=ad["headline"], sub=ad["sub"], body=ad["body"],
        bridge=ad["bridge"], price_line1=p["line1"], price_big=p["big"],
        price_cond=p["cond"], cta=ad["cta"], nome=MARCA["nome"], produto=MARCA["produto"],
        contato=MARCA["contato"], site=MARCA["site"],
    )


if __name__ == "__main__":
    pendentes = 0
    for ad in ADS:
        html = render_one(ad)
        pendentes += html.count("[A PREENCHER")
        fn = OUT / f'ad-{ad["id"]}.html'
        fn.write_text(html, encoding="utf-8")
        print("gerado", fn.name)
    print(f"OK — {len(ADS)} anúncios")
    if pendentes:
        print(f"!! {pendentes} campo(s) [A PREENCHER] — não publicar antes de preencher com dado real.")
