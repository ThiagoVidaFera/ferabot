# -*- coding: utf-8 -*-
"""Gerador de CARROSSÉIS 1080x1350 — molde do Anúncio de Ouro.
Cada carrossel = lista de slides; kinds: cover | text | photo | cta. Fotos reais em ../assets/.

EXEMPLO HIPOTÉTICO (didático): troque tudo pelos dados REAIS do dono. [A PREENCHER] = dado que só o dono tem.
Uso: dentro de <lote>/carrosseis/, copie carrossel.css e este arquivo como build_carrosseis.py.
Cada card é um hook; o CTA fica só no último.
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
BRAND = PERFIL.get("produto", "[A PREENCHER: nome da oferta]")
CONTATO = PERFIL.get("handle_instagram", "[A PREENCHER: @ ou WhatsApp]")

CARROSSEIS = {
 "c1-objecoes": [
   dict(kind="cover", accent="emerald", photo="p1.jpg", objpos="52% 18%",
        kicker=BRAND,
        h1='&ldquo;Já tentei postar todo dia.&rdquo; <span class="hl">O problema não era frequência.</span>'),
   dict(kind="text", accent="emerald", num="", kick="objeção 1",
        h2='&ldquo;Não tenho tempo <span class="hl">pra conteúdo.</span>&rdquo;',
        p='Você não precisa de mais tempo. Precisa de uma rotina de <b>2h por semana</b> que já vem pronta.'),
   dict(kind="text", accent="blue", num="", kick="objeção 2",
        h2='&ldquo;Tenho vergonha <span class="hl">de vender.</span>&rdquo;',
        p='A primeira conversa não é venda. É um <b>roteiro de acolhimento</b> que deixa o paciente decidir.'),
   dict(kind="photo", accent="emerald", photo="p2.jpg", objpos="62% 20%",
        kick="a real",
        h2='O que falta não é capacidade. <span class="hl">É o mapa.</span>',
        p='Você já sabe atender. O método te dá o caminho até o paciente certo.'),
   dict(kind="cta", accent="emerald", photo="p1.jpg", objpos="58% 24%",
        kicker=BRAND,
        h1='[A PREENCHER: vagas reais]. <span class="hl">Comigo do começo ao fim.</span>',
        price=dict(line1="[A PREENCHER: preço cheio]", big="[A PREENCHER: preço]", cond="[A PREENCHER: condição]"),
        cta="Chama no direct", sub=CONTATO),
 ],
}


def render_cover(s):
    return f'''<div class="slide slide--cover accent-{s["accent"]}" style="--objpos:{s["objpos"]}">
  <div class="bg"><img src="../assets/{s["photo"]}" alt="{NOME}"></div>
  <div class="capcontent">
    <span class="kicker">{s["kicker"]}</span>
    <h1>{s["h1"]}</h1>
    <span class="hint">arraste <span class="arrow">→→</span></span>
  </div>
</div>'''


def render_text(s, brand_foot):
    num = f'<div class="num">{s["num"]}</div>' if s.get("num") else '<div class="rule"></div>'
    kick = f'<div class="kick">{s["kick"]}</div>' if s.get("kick") else ""
    return f'''<div class="slide slide--text accent-{s["accent"]}">
  {num}
  {kick}
  <h2>{s["h2"]}</h2>
  <p>{s["p"]}</p>
  <div class="foot"><span class="b">{brand_foot}</span><span>{s["_pg"]}</span></div>
</div>'''


def render_photo(s, brand_foot):
    kick = f'<div class="kick">{s["kick"]}</div>' if s.get("kick") else ""
    return f'''<div class="slide slide--photo accent-{s["accent"]}" style="--objpos:{s["objpos"]}">
  <div class="ph"><img src="../assets/{s["photo"]}" alt="{NOME}"><span class="bar"></span></div>
  <div class="body">
    {kick}
    <h2>{s["h2"]}</h2>
    <p>{s["p"]}</p>
  </div>
  <div class="foot"><span class="b">{brand_foot}</span><span>{s["_pg"]}</span></div>
</div>'''


def render_cta(s):
    p = s["price"]
    return f'''<div class="slide slide--cta accent-{s["accent"]}" style="--objpos:{s["objpos"]}">
  <div class="bg"><img src="../assets/{s["photo"]}" alt="{NOME}"></div>
  <div class="capcontent">
    <span class="kicker">{s["kicker"]}</span>
    <h1>{s["h1"]}</h1>
    <div class="ctarow">
      <div class="price"><span class="line1">{p["line1"]}</span><span class="big">{p["big"]}</span><span class="cond">{p["cond"]}</span></div>
      <div class="cta"><span class="wa"></span>{s["cta"]} →</div>
    </div>
    <span class="sub">{s["sub"]}</span>
  </div>
</div>'''


PAGE = """<!doctype html>
<html lang="pt-br"><head><meta charset="utf-8"><link rel="stylesheet" href="carrossel.css"></head>
<body>{slide}</body></html>"""

if __name__ == "__main__":
    total = pendentes = 0
    for cid, slides in CARROSSEIS.items():
        n = len(slides)
        for i, s in enumerate(slides, 1):
            pagina = {**s, "_pg": f"{i:02d} / {n:02d}"}
            if pagina["kind"] == "cover":
                body = render_cover(pagina)
            elif pagina["kind"] == "cta":
                body = render_cta(pagina)
            elif pagina["kind"] == "photo":
                body = render_photo(pagina, BRAND)
            else:
                body = render_text(pagina, BRAND)
            html = PAGE.format(slide=body)
            pendentes += html.count("[A PREENCHER")
            (OUT / f"{cid}-s{i:02d}.html").write_text(html, encoding="utf-8")
            total += 1
        print(f"gerado {cid}: {n} slides")
    print(f"OK — {total} slides ({len(CARROSSEIS)} carrosséis)")
    if pendentes:
        print(f"!! {pendentes} campo(s) [A PREENCHER] — não publicar antes de preencher com dado real.")
