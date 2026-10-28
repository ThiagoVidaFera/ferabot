"""Troca os posts da prévia pelas ARTES REAIS do Kit de Feed Inicial.

O protótipo do perfil passa a mostrar exatamente o que o cliente vai publicar: as capas dos 6
carrosséis fixados e as 9 artes estáticas, na mesma ordem do COMO-POSTAR. Clicar no post abre os
slides de verdade, em PNG.

Uso: python -I feed_do_kit.py <pasta-do-run>
"""
import json
import pathlib
import re
import sys

for _f in (sys.stdout, sys.stderr):
    try:
        _f.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

raiz = pathlib.Path(sys.argv[1]).resolve()
feed = json.loads((raiz / "feed.json").read_text(encoding="utf-8"))
kit = raiz / "kit-feed-inicial"

sem_tag = lambda t: re.sub(r"<[^>]+>", "", t or "")
posts = []

# ── 6 carrosséis fixados ────────────────────────────────────────────────────
for c in feed["carrosseis"]:
    pasta = kit / c["pasta"] / "png"
    pngs = sorted(pasta.glob("*.png"))
    if not pngs:
        print("  sem PNG:", c["pasta"])
        continue
    posts.append({
        "id": c["pasta"],
        "kind": "carousel",
        "fixado": bool(c.get("fixar")),
        "title": sem_tag(c["slides"][0].get("titulo", c["titulo"])),
        "caption": c["legenda"],
        "cta": "guia",
        "mediaNote": f"Carrossel de {len(pngs)} slides · arte pronta, {c['pasta']}/png/",
        "slides": [{"id": f"{c['pasta']}-{p.stem}",
                    "export": f"kit-feed-inicial/{c['pasta']}/png/{p.name}",
                    "alt": f"{c['titulo']} — slide {p.stem}"} for p in pngs],
    })

# ── 9 estáticos (post e criativo de anúncio) ────────────────────────────────
CAMP = {"A": "Campanha A · reunião", "B": "Campanha B · isca", "C": "Campanha C · vídeo"}
for i, e in enumerate(feed["estaticos"], 1):
    arquivo = f"{i:02d}-{e['slug']}.png"
    if not (kit / "estaticos" / arquivo).exists():
        print("  sem PNG:", arquivo)
        continue
    titulo = sem_tag(e["titulo"])
    posts.append({
        "id": f"est-{e['slug']}",
        "kind": "photo",
        "fixado": False,
        "title": titulo,
        "caption": f"{titulo}\n\n{e.get('corpo', '')}\n\n{e['cta']}".replace("\n\n\n", "\n\n").strip(),
        "cta": None,
        "mediaNote": f"Arte dupla: post do feed e criativo da {CAMP.get(e['campanha'], '')}.",
        "slides": [{"id": f"est-{e['slug']}",
                    "export": f"kit-feed-inicial/estaticos/{arquivo}",
                    "alt": titulo}],
    })

# ── destaques: capa dedicada + os slides dos carrosséis que ela guarda ──────
destaques = []
for i, c in enumerate(feed.get("capas_destaque", []), 1):
    capa = f"kit-feed-inicial/destaques/{i:02d}-{c['slug']}.png"
    if not (raiz / capa).exists():
        print("  sem capa:", capa)
        continue
    slides = []
    for pasta in c.get("carrosseis", []):
        for png in sorted((kit / pasta / "png").glob("*.png")):
            slides.append({"id": f"d-{c['slug']}-{pasta}-{png.stem}",
                           "export": f"kit-feed-inicial/{pasta}/png/{png.name}",
                           "alt": f"{c.get('rotulo', c['slug'])} — {pasta} {png.stem}"})
    destaques.append({"id": c["slug"], "title": c.get("rotulo", c["slug"]),
                      "cover": capa, "slides": slides})

# ── grava no content.js, preservando o resto ────────────────────────────────
p = raiz / "assets" / "content.js"
s = p.read_text(encoding="utf-8")


def bloco(chave, dados):
    corpo = json.dumps(dados, ensure_ascii=False, indent=2)
    corpo = "\n".join(("  " + l) if k else l for k, l in enumerate(corpo.split("\n")))
    return f'  "{chave}": {corpo},\n'


ini = s.index('  "posts": [')
fim_posts = s.index('  "highlights": [', ini)
fim_dest = s.index('  "dm": {', fim_posts)
miolo = bloco("posts", posts) + (bloco("highlights", destaques) if destaques else s[fim_posts:fim_dest])
p.write_text(s[:ini] + miolo + s[fim_dest:], encoding="utf-8", newline="\n")

fixados = sum(1 for x in posts if x["fixado"])
slides = sum(len(x["slides"]) for x in posts)
print(f"feed do protótipo: {len(posts)} posts ({fixados} fixados) · {slides} artes")
if destaques:
    print(f"destaques: {len(destaques)} · {sum(len(d['slides']) for d in destaques)} slides")
