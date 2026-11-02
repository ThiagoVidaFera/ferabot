# -*- coding: utf-8 -*-
"""Motor do carrossel ILUSTRADO: card de tweet + prova visual em todo slide. 1080x1440, zona morta 250px.

Marca (nome, @, cores) vem do perfil.json do FeraBot; o "kit" do spec so sobrescreve.

Uso:  python build.py <spec.json>        -> <pasta-do-spec>/png/NN.png + _contato.jpg
Spec = {"kit": {...marca...}, "slides": [...]}  (ver SKILL.md e exemplos/*.json)
Todo texto vive em y=250..1190; o auto-fit encolhe a tipografia ate caber (aviso se u<0.7).
"""
import base64
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import kit_perfil  # noqa: E402

kit_perfil.garantir_deps()
from PIL import Image  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402

CINZA = "#6B7280"
TRACEJADO = ' stroke-dasharray="12 9"'
KIT_PADRAO = {
    "nome": "Nome da conta", "handle": "@conta", "avatar": "", "selo": False,
    "ink": "#14171A", "claro_bg": "#FFFFFF", "escuro_bg": "#000000",
    "accent": "#FF4F00", "accent_escuro": "#FF4F00",   # accent = sobre claro · accent_escuro = sobre escuro
    "cor_bg": "#FF4F00", "cor_txt": "#FFFFFF",         # slide de cor chapada (apresentacao/CTA)
    "fonte": "Figtree", "pesos": "400;500;700;800;900", "pill_bg": "#FFFFFF", "pill_txt": "",
    "legenda_print": "Print real · busca no YouTube · {data}", "data": "",
}


def data_uri(p: Path, mime: str = "image/jpeg") -> str:
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def css(k: dict) -> str:
    f = k["fonte"]
    return f"""
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{width:1080px;height:1440px;overflow:hidden}}
:root{{--u:1}}
body{{font-family:'{f}',Inter,sans-serif;-webkit-font-smoothing:antialiased}}
.s{{position:relative;width:1080px;height:1440px;overflow:hidden}}
.light{{background:{k['claro_bg']};color:{k['ink']};--ac:{k['accent']}}}
.dark{{background:{k['escuro_bg']};color:#fff;--ac:{k['accent_escuro']}}}
.cor{{background:{k['cor_bg']};color:{k['cor_txt']};--ac:{k['cor_txt']}}}
.z{{position:absolute;left:70px;right:70px;top:250px;bottom:250px;display:flex;flex-direction:column;gap:calc(var(--u)*22px)}}
.z>*{{flex-shrink:0}}
.hd{{display:flex;align-items:center;gap:26px}}
.hd img{{width:96px;height:96px;border-radius:50%;object-fit:cover;background:#fff}}
.hd b{{display:block;font-size:40px;font-weight:800;letter-spacing:-.5px}}
.hd i{{display:block;font-style:normal;font-size:33px;color:{CINZA};margin-top:2px}}
.dark .hd i{{color:#9CA3AF}} .cor .hd i{{color:{k['cor_txt']};opacity:.8}}
.selo{{display:inline-block;vertical-align:middle;margin-left:10px}}
h1{{font-size:calc(var(--u)*76px);line-height:1.1;font-weight:800;letter-spacing:-1.5px}}
h2{{font-size:calc(var(--u)*54px);line-height:1.12;font-weight:800;letter-spacing:-1px}}
.sub{{font-size:calc(var(--u)*38px);line-height:1.28;font-weight:500}}
p{{font-size:calc(var(--u)*40px);line-height:1.3;font-weight:500}}
p b,h1 b,h2 b{{font-weight:800}}
u{{text-decoration:underline;text-decoration-thickness:7px;text-underline-offset:8px}}
mark{{background:none;color:var(--ac)}}
.ponte{{margin-top:auto;font-size:calc(var(--u)*32px);font-style:italic;font-weight:600;color:var(--ac)}}
.print{{position:relative;background:#fff;border-radius:18px;overflow:visible}}
.print img{{display:block;width:100%;border-radius:18px}}
.print svg{{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible}}
.cap{{font-size:24px;color:{CINZA};margin-top:-8px}} .dark .cap{{color:#9CA3AF}}
.row2{{display:grid;grid-template-columns:1fr 1fr;gap:26px}}
.box{{border:5px solid currentColor;border-radius:16px;padding:18px 22px}}
.box.ac{{border-color:var(--ac);color:var(--ac)}}
.box h3{{font-size:calc(var(--u)*34px);font-weight:800;margin-bottom:8px}}
.box li{{font-size:calc(var(--u)*29px);line-height:1.25;font-weight:500;margin:6px 0 0 24px}}
table{{width:100%;border-collapse:collapse}}
td{{padding:calc(var(--u)*16px) 10px;border-top:3px solid #D9DCE0;font-size:calc(var(--u)*29px);line-height:1.2;vertical-align:top}}
td.n{{font-weight:900;color:var(--ac);font-size:calc(var(--u)*40px);width:56px}} td.q{{font-weight:800}} td.o{{color:#4B5563}}
.pill{{align-self:flex-start;background:{k['pill_bg']};color:{k['pill_txt'] or k['cor_bg']};font-weight:900;font-size:calc(var(--u)*108px);padding:10px 56px 14px;border-radius:999px;letter-spacing:2px}}
"""


# ---------------------------------------------------------------- primitivas SVG (whiteboard a mao)
def fig(x, y, cor, s=1.0, q=False, ac="#f00", sw=5):
    h = 70 * s
    o = (f'<g stroke="{cor}" stroke-width="{sw}" stroke-linecap="round" fill="none"><circle cx="{x}" cy="{y-h+9*s}" r="{9*s}"/>'
         f'<line x1="{x}" y1="{y-h+18*s}" x2="{x}" y2="{y-26*s}"/><line x1="{x-15*s}" y1="{y-h+32*s}" x2="{x+15*s}" y2="{y-h+32*s}"/>'
         f'<line x1="{x}" y1="{y-26*s}" x2="{x-12*s}" y2="{y}"/><line x1="{x}" y1="{y-26*s}" x2="{x+12*s}" y2="{y}"/></g>')
    if q:
        o += txt(x, y - h - 8 * s, "?", ac, 40 * s)
    return o


def seta(x1, y1, x2, y2, cor, sw=6):
    return (f'<g stroke="{cor}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" fill="none">'
            f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"/><polyline points="{x2-18},{y2-14} {x2},{y2} {x2-18},{y2+14}"/></g>')


def txt(x, y, t, cor, tam=34, anchor="middle"):
    return (f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="Caveat" font-weight="700" '
            f'font-size="{tam}" fill="{cor}">{t}</text>')


def xis(x, y, cor):
    return f'<g stroke="{cor}" stroke-width="8" stroke-linecap="round"><line x1="{x}" y1="{y}" x2="{x+38}" y2="{y+38}"/><line x1="{x+38}" y1="{y}" x2="{x}" y2="{y+38}"/></g>'


def certo(x, y, cor):
    return f'<polyline points="{x},{y+24} {x+28},{y+54} {x+70},{y}" fill="none" stroke="{cor}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>'


def svg(w, h, corpo, larg=100, y0=0):
    return f'<svg viewBox="0 {y0} {w} {h}" width="{larg}%" style="display:block;margin:0 auto">{corpo}</svg>'


# ---------------------------------------------------------------- visuais (cada um com 1 elemento em aberto)
def v_escada(v, ink, ac):
    nomes, n = v["labels"], len(v["labels"])
    larg = (940 - 10) // n - 10
    c = ""
    for i, nome in enumerate(nomes):
        x, h = 10 + i * (larg + 10), 70 + i * (220 // max(n - 1, 1))
        top, ult = 330 - h, i == n - 1
        cor = ac if ult else ink
        c += (f'<rect x="{x}" y="{top}" width="{larg}" height="{h}" rx="10" fill="none" stroke="{cor}" stroke-width="6"'
              f'{TRACEJADO if ult else ""}/>')
        c += txt(x + larg / 2, top + 44, nome, cor, 31)
    c += fig(10 + larg / 2, 330 - 70, ink, 1.0)
    c += seta(10 + larg + 20, 205, 10 + larg + 100, 170, ac)
    c += txt(10 + (n - 1) * (larg + 10) + larg / 2, 330 - (70 + 220) - 12, "?", ac, 120)
    return svg(940, 410, c, 100, -70)


def v_split(v, ink, ac):
    e, d = v["esq"], v["dir"]
    c = f'<line x1="470" y1="20" x2="470" y2="320" stroke="{ink}" stroke-width="5"/>'
    c += xis(20, 12, ac) + txt(235, 46, e["titulo"], ac, 38)
    for r in range(3):
        for k in range(6):
            c += fig(55 + k * 70, 150 + r * 62, "#9CA3AF", 0.62, sw=4)
    c += txt(235, 320, e["legenda"], "#9CA3AF", 34)
    c += certo(500, 8, ink) + txt(740, 46, d["titulo"], ink, 38)
    for xx in (590, 705, 820):
        c += fig(xx, 230, ac, 1.15, q=True, ac=ac)
    c += txt(705, 320, d["legenda"], ink, 34)
    return svg(940, 340, c, 82)


def v_caminhos(v, ink, ac):
    dest, esc = v["destinos"], v["escolhido"]
    c = fig(70, 235, ink, 1.4)
    for i, nome in enumerate(dest):
        y, ok = 40 + i * 110, i == esc
        cor = ac if ok else ink
        c += seta(130, 190, 380, y + 28, ac if ok else "#9CA3AF", 5)
        c += f'<rect x="390" y="{y}" width="330" height="62" rx="12" fill="none" stroke="{cor}" stroke-width="{7 if ok else 4}"/>'
        c += txt(555, y + 44, nome, cor, 40)
        if ok:
            c += certo(760, y - 10, ac)
    return svg(940, 340, c, 62)


def v_cadeia(v, ink, ac):
    nomes, n = v["nodos"], len(v["nodos"])
    larg = (940 - 12) // n - 38
    c = ""
    for i, nome in enumerate(nomes):
        x, ult = 6 + i * (larg + 38), i == n - 1
        cor = ac if ult else ink
        c += (f'<rect x="{x}" y="40" width="{larg}" height="86" rx="14" fill="none" stroke="{cor}" stroke-width="5"'
              f'{TRACEJADO if ult else ""}/>')
        c += txt(x + larg / 2, 96, "?" if ult else nome, cor, 70 if ult else (25 if len(nome) > 11 else 31))
        if i < n - 1:
            c += seta(x + larg + 4, 83, x + larg + 34, 83, ac, 5)
    return svg(940, 150, c, 70)


def v_cartaz(v, ink, ac):
    e, d = v["esq"], v["dir"]
    c = f'<line x1="470" y1="20" x2="470" y2="330" stroke="{ink}" stroke-width="5"/>'
    c += xis(20, 12, ac) + txt(235, 46, e["titulo"], ac, 40)
    c += f'<rect x="165" y="95" width="130" height="190" rx="14" fill="none" stroke="{ink}" stroke-width="5"/>' + txt(230, 200, e.get("objeto", "post"), ink, 36)
    for k, xx in enumerate((60, 150, 330, 420)):
        c += fig(xx, 310, "#9CA3AF", 0.8, sw=4)
        c += seta(xx - 28, 250, xx + 30, 250, "#9CA3AF", 3) if k % 2 == 0 else ""
    c += txt(235, 345, e["legenda"], "#6B7280", 31)
    c += certo(500, 8, ink) + txt(740, 46, d["titulo"], ink, 40)
    c += (f'<circle cx="690" cy="160" r="62" fill="none" stroke="{ink}" stroke-width="8"/>'
          f'<line x1="735" y1="205" x2="790" y2="262" stroke="{ink}" stroke-width="12" stroke-linecap="round"/>') + txt(690, 172, "?", ac, 66)
    for xx in (560, 600, 640):
        c += fig(xx, 310, ac, 0.8, sw=4)
    c += txt(705, 345, d["legenda"], ink, 31)
    return svg(940, 360, c, 70)


def v_print(v, ink, ac, base: Path, kit: dict):
    p = base / v["arquivo"]
    w, h = Image.open(p).size
    marcas = json.loads((p.parent / "marcas.json").read_text(encoding="utf-8")) if (p.parent / "marcas.json").exists() else {}
    m0, m1 = marcas.get(p.stem, [0.47, 0.50])
    rect = f'<rect x="10" y="{int(h*m0)}" width="{int(w*0.97)}" height="{int(h*m1)}" rx="26" fill="none" stroke="{ac}" stroke-width="8"/>'
    nota = ""
    if v.get("nota"):
        t, x = v["nota"]
        nota = txt(x, h + 75, t, ac, 64)
    leg = v.get("legenda") or kit["legenda_print"].format(data=kit["data"])
    return (f'<div class="print"><img src="{data_uri(p, "image/png")}"><svg viewBox="0 0 {w} {h}">{rect}{nota}</svg></div>'
            f'<div class="cap">{leg}</div>')


def v_boxes(v, ink, ac):
    def box(b, cls):
        return f'<div class="box {cls}"><h3>{b["titulo"]}</h3><ul>' + "".join(f"<li>{i}</li>" for i in b["itens"]) + "</ul></div>"
    return f'<div class="row2">{box(v["esq"], "")}{box(v["dir"], "ac")}</div>'


VISUAIS = {"escada": v_escada, "split": v_split, "caminhos": v_caminhos, "cadeia": v_cadeia, "cartaz": v_cartaz, "boxes": v_boxes}


# ---------------------------------------------------------------- slides
def header(k: dict, avatar: str) -> str:
    selo = ('<svg class="selo" width="34" height="34" viewBox="0 0 24 24"><path fill="#1D9BF0" d="M22.5 12.5l-2-2.3.3-3-3-.7-1.6-2.6-2.8 1.2L10.6 2.5 9 5.1l-3 .7.3 3-2 2.2 2 2.3-.3 3 3 .7 1.6 2.6 2.8-1.2 2.8 1.2 1.6-2.6 3-.7-.3-3z"/><path fill="#fff" d="M10.5 16l-3-3 1.2-1.2 1.8 1.8 4.3-4.3 1.2 1.2z"/></svg>'
            if k["selo"] else "")
    return f'<div class="hd"><img src="{avatar}"><div><b>{k["nome"]}{selo}</b><i>{k["handle"]}</i></div></div>'


def montar(sl: dict, k: dict, avatar: str, foto_fn, base: Path) -> str:
    tema = sl.get("tema", "light")
    ink = k["cor_txt"] if tema == "cor" else "#fff" if tema == "dark" else k["ink"]
    ac = {"light": k["accent"], "dark": k["accent_escuro"], "cor": k["cor_txt"]}[tema]
    tipo = sl.get("tipo", "corpo")
    ponte = f'<div class="ponte">{sl["ponte"]}</div>' if sl.get("ponte") else ""
    vis = ""
    for v in sl.get("visuais", []):
        h = v_print(v, ink, ac, base, k) if v["tipo"] == "print" else VISUAIS[v["tipo"]](v, ink, ac)
        if v.get("larg"):  # ampliar/reduzir o desenho quando o slide tem pouco texto
            h = re.sub(r'width="\d+%"', f'width="{v["larg"]}%"', h, count=1)
        vis += h
    paras = "".join(f"<p>{p}</p>" for p in sl.get("blocos", []))
    if tipo == "capa":
        corpo = f'{header(k, avatar)}<h1>{sl["h1"]}</h1><div class="sub">{sl["sub"]}</div>{vis}{ponte}'
    elif tipo == "apresentacao":
        foto = (f'<img src="{foto_fn(sl["foto"])}" style="width:100%;height:520px;object-fit:cover;'
                f'object-position:{sl.get("pos", "50% 0%")};border-radius:22px">') if sl.get("foto") else ""
        corpo = f'<h1 style="font-size:calc(var(--u)*84px)">{sl["h1"]}</h1>{foto}{paras}{ponte}'
        corpo = f'<div style="display:contents">{corpo}</div>'
    elif tipo == "cta":
        pill = f'<div class="pill">{sl["pill"]}</div>' if sl.get("pill") else ""
        corpo = f'{header(k, avatar)}<p style="font-size:calc(var(--u)*50px);font-weight:800;line-height:1.18">{sl["pergunta"]}</p>{pill}{paras}{ponte}'
    elif tipo == "recibo":
        tab = "".join(f'<tr><td class="n">{a}</td><td class="q">{b}<br><span style="font-weight:500">{c}</span></td><td class="o">{d}</td></tr>' for a, b, c, d in sl["linhas"])
        corpo = (f'{header(k, avatar)}<h2>{sl["titulo"]}</h2><table>{tab}</table>'
                 f'<div class="ponte" style="color:{ink};font-style:normal;font-weight:900;font-size:calc(var(--u)*46px)">{sl["fecho"]}</div>')
    else:  # corpo
        h2 = f'<h2>{sl["titulo"]}</h2>' if sl.get("titulo") else ""
        corpo = f'{header(k, avatar)}{h2}{paras}{vis}{ponte}'
    extra = ' style="justify-content:center"' if tipo == "apresentacao" else ""
    return f'<div class="s {tema}"><div class="z"{extra}>{corpo}</div></div>'


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    spec_path = Path(sys.argv[1]).resolve()
    base = spec_path.parent
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    do_perfil = {x: v for x, v in kit_perfil.kit_do_perfil().items() if not x.startswith("_")}
    k = {**KIT_PADRAO, **do_perfil, **spec.get("kit", {})}
    if k["avatar"]:
        ap = Path(k["avatar"]) if Path(k["avatar"]).is_absolute() else (base / k["avatar"]).resolve()
        avatar = data_uri(ap, "image/png" if ap.suffix.lower() == ".png" else "image/jpeg")
    else:
        avatar = kit_perfil.avatar_inicial(k["nome"], k["cor_bg"], k["cor_txt"])
    foto_fn = lambda f: data_uri((base / f).resolve() if not Path(f).is_absolute() else Path(f))  # noqa: E731
    fonts = (f'<link href="https://fonts.googleapis.com/css2?family={k["fonte"].replace(" ", "+")}:wght@{k["pesos"]}'
             '&family=Caveat:wght@600;700&display=swap" rel="stylesheet">')
    out = base / "png"
    out.mkdir(exist_ok=True)
    avisos, n = [], len(spec["slides"])
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={"width": 1080, "height": 1440})
        for i, sl in enumerate(spec["slides"], 1):
            pg.set_content(f"<!doctype html><html><head><meta charset='utf-8'>{fonts}<style>{css(k)}</style></head>"
                           f"<body>{montar(sl, k, avatar, foto_fn, base)}</body></html>")
            pg.wait_for_load_state("networkidle")
            pg.evaluate("document.fonts.ready")
            u, sh, ch = pg.evaluate("""() => { const z=document.querySelector('.z'); let u=1;
                const set=v=>document.documentElement.style.setProperty('--u',v.toFixed(2));
                while(z.scrollHeight>z.clientHeight+1 && u>0.5){u-=0.03;set(u);}
                return [u, z.scrollHeight, z.clientHeight]; }""")
            if sh > ch + 1:
                avisos.append(f"slide {i}: NAO CABE ({sh}>{ch}) - corte copy")
            elif u < 0.7:
                avisos.append(f"slide {i}: fonte encolheu a {u:.2f} - enxugar copy ou visual")
            print(f"slide {i:02d} u={u:.2f}")
            pg.screenshot(path=str(out / f"{i:02d}.png"))
        b.close()
    cols = 5
    c = Image.new("RGB", (270 * cols, 360 * ((n + cols - 1) // cols)), "white")
    for j in range(n):
        c.paste(Image.open(out / f"{j+1:02d}.png").convert("RGB").resize((270, 360)), ((j % cols) * 270, (j // cols) * 360))
    c.save(base / "_contato.jpg", quality=90)
    print("AVISOS:", avisos or "nenhum")


if __name__ == "__main__":
    main()
