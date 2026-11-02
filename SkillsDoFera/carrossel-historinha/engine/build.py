# -*- coding: utf-8 -*-
"""Motor do carrossel HISTORINHA: card de tweet preto, 1080x1440, zona morta de 250px no topo e na base.

A marca (nome, @, cores) vem do perfil.json do FeraBot. O spec traz so a historia.

Uso:  python build.py <spec.json>     ->  <pasta-do-spec>/png/NN.png + _contato.jpg + texto-puro.txt

Spec:
{
  "kit": {"avatar": "foto.jpg"},                       # opcional, sobrescreve o perfil.json
  "personagem": {"nome": "Rodrigo"},                   # fictício, declarado na capa pelo motor
  "slides": [["paragrafo 1", "paragrafo 2"], ...],     # 6 a 9 slides de historia (o 1o e a capa)
  "cta": {"titulo": "Precisa de ajuda?", "palavra": "CAMINHO", "texto": "Comenta ...", "selo": "..."}
}
O motor reprova (sai com erro) se: texto invadir a zona morta, houver resultado/venda atribuido ao personagem,
ou a voz quebrar (emoji, travessao, ponto e virgula, "automatico").
"""
import base64
import html
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import kit_perfil  # noqa: E402

kit_perfil.garantir_deps()
from PIL import Image  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402

Y_MIN, Y_MAX = 250, 1190
FS_MAX, FS_MIN = 46, 34
MIN_SLIDES, MAX_SLIDES = 6, 9

# Prova real e dado: personagem fictício nunca leva resultado, venda ou número de cliente.
PROIBIDO_RESULTADO = (r"r\$", r"%", r"faturou", r"faturamento", r"vendeu", r"bateu a meta", r"lucro de", r"case de sucesso")
EMOJI = re.compile("[\U0001F300-\U0001FAFF☀-➿⭐⬆✅❌]")


def checar_voz(textos: list) -> list:
    """Regras de voz do texto que o cliente ve: sem emoji, travessao, ponto e virgula, 'automatico'."""
    erros, junto = [], "\n".join(textos)
    if EMOJI.search(junto):
        erros.append("emoji no texto")
    if "—" in junto or "–" in junto:
        erros.append("travessao no texto")
    if ";" in junto:
        erros.append("ponto e virgula no texto")
    if re.search(r"autom[aá]tic", junto, re.I):
        erros.append("palavra 'automático' (o jeito é fazer junto)")
    return erros


def checar_ficcao(textos: list) -> list:
    junto = "\n".join(textos).lower()
    return [f"resultado/venda atribuído ao personagem: '{t}'" for t in PROIBIDO_RESULTADO if re.search(t, junto)]


def esc(t: str) -> str:
    return html.escape(t, quote=False).replace("\n", "<br>")


def css(k: dict) -> str:
    ac = k["accent_escuro"]
    txt_pill = "#111111" if kit_perfil.luminancia(ac) > 0.3 else "#FFFFFF"
    return f"""
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{width:1080px;height:1440px;overflow:hidden;background:#000}}
:root{{--fs:44}}
body{{font-family:'{k['fonte']}',Inter,Arial,sans-serif;color:#E7E9EA;-webkit-font-smoothing:antialiased}}
.z{{position:absolute;left:0;right:0;top:{Y_MIN - 20}px;bottom:{1440 - Y_MAX - 20}px;display:flex;flex-direction:column;
  justify-content:center;padding:0 78px}}
.hd{{display:flex;align-items:center;gap:22px;margin-bottom:38px}}
.av{{width:104px;height:104px;border-radius:50%;object-fit:cover;object-position:50% 20%;flex:none}}
.nm{{font-weight:700;font-size:32px;color:{ac}}}.hn{{color:#71767B;font-size:28px}}
.tx p{{font-size:calc(var(--fs)*1px);line-height:1.3;margin-bottom:calc(var(--fs)*.68px);font-weight:500}}
.tx p:last-child{{margin-bottom:0}}
.tx p.cap{{font-weight:800;color:#fff;font-size:calc(var(--fs)*1.32px);line-height:1.15}}
.ficcao{{margin-top:34px;align-self:flex-start;border:3px solid {ac};color:{ac};
  border-radius:999px;padding:8px 26px;font-weight:700;font-size:26px;letter-spacing:.04em}}
.cta .av{{width:130px;height:130px;border:4px solid {ac}}}
.cta .z{{align-items:flex-start;gap:30px}}
.cta h1{{font-weight:800;font-size:92px;line-height:1.04;letter-spacing:-.02em;color:#fff}}
.pill{{background:{ac};color:{txt_pill};font-weight:900;
  font-size:84px;padding:6px 52px 12px;border-radius:999px;letter-spacing:2px}}
.cta p.ex{{font-weight:600;font-size:40px;line-height:1.3}}
.cta .selo{{font-weight:800;font-size:30px;letter-spacing:.04em;color:{ac}}}
"""


def cabecalho(k: dict, avatar: str) -> str:
    return (f'<div class="hd"><img class="av" src="{avatar}"><div><div class="nm">{esc(k["nome"])}</div>'
            f'<div class="hn">{esc(k["handle"])}</div></div></div>')


def tweet(paragrafos: list, capa: bool, k: dict, avatar: str, ficcao: str) -> str:
    ps = "".join(f'<p class="{"cap" if (capa and i == 0) else ""}">{esc(x)}</p>' for i, x in enumerate(paragrafos))
    chip = f'<div class="ficcao">{esc(ficcao)}</div>' if capa else ""
    return f'<div class="z">{cabecalho(k, avatar)}<div class="tx">{ps}</div>{chip}</div>'


def fecho(cta: dict, avatar: str) -> str:
    pill = f'<div class="pill">{esc(cta["palavra"].upper())}</div>'
    selo = f'<div class="selo">{esc(cta["selo"])}</div>' if cta.get("selo") else ""
    return (f'<div class="z"><img class="av" src="{avatar}"><h1>{esc(cta["titulo"])}</h1>{pill}'
            f'<p class="ex">{esc(cta["texto"])}</p>{selo}</div>')


MEDIR = """() => { const r=[...document.querySelectorAll('.z > *')].map(e=>e.getBoundingClientRect());
  return [Math.round(Math.min(...r.map(x=>x.top))), Math.round(Math.max(...r.map(x=>x.bottom)))]; }"""


def carregar_avatar(k: dict, base: Path) -> str:
    if not k["avatar"]:
        return kit_perfil.avatar_inicial(k["nome"], k["cor_bg"], k["cor_txt"])
    ap = Path(k["avatar"]) if Path(k["avatar"]).is_absolute() else (base / k["avatar"]).resolve()
    mime = "png" if ap.suffix.lower() == ".png" else "jpeg"
    return f"data:image/{mime};base64," + base64.b64encode(ap.read_bytes()).decode()


def validar(spec: dict) -> tuple:
    slides, cta, pers = spec["slides"], spec["cta"], spec.get("personagem", {})
    if not pers.get("nome"):
        raise SystemExit("REPROVADO: spec sem personagem.nome (a historia precisa de personagem fictício declarado)")
    if not MIN_SLIDES <= len(slides) <= MAX_SLIDES:
        raise SystemExit(f"REPROVADO: {len(slides)} slides de historia (use de {MIN_SLIDES} a {MAX_SLIDES}, mais o CTA)")
    ficcao = f"PERSONAGEM FICTÍCIO: {pers['nome'].upper()} NÃO EXISTE"
    textos = [x for s in slides for x in s] + [cta["titulo"], cta["palavra"], cta["texto"], cta.get("selo", ""), ficcao]
    erros = checar_voz(textos) + checar_ficcao(textos)
    if erros:
        raise SystemExit("REPROVADO (gate de texto): " + " | ".join(erros))
    return slides, cta, ficcao


def contato(out: Path, base: Path, n_total: int) -> None:
    w, h, cols = 432, 576, 5
    folha = Image.new("RGB", (w * cols, h * ((n_total + cols - 1) // cols)), "#333")
    for i in range(1, n_total + 1):
        im = Image.open(out / f"{i:02d}.png").convert("RGB").resize((w - 6, h - 6))
        folha.paste(im, (((i - 1) % cols) * w + 3, ((i - 1) // cols) * h + 3))
    folha.save(base / "_contato.jpg", quality=88)


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    spec_path = Path(sys.argv[1]).resolve()
    base = spec_path.parent
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    do_perfil = {x: v for x, v in kit_perfil.kit_do_perfil().items() if not x.startswith("_")}
    k = {"fonte": "Inter", "avatar": "", **do_perfil, **spec.get("kit", {})}
    avatar = carregar_avatar(k, base)
    slides, cta, ficcao = validar(spec)

    out = base / "png"
    out.mkdir(exist_ok=True)
    pecas = {f"{i:02d}": (tweet(s, i == 1, k, avatar, ficcao), False) for i, s in enumerate(slides, 1)}
    pecas[f"{len(slides) + 1:02d}"] = (fecho(cta, avatar), True)
    fonts = (f'<link href="https://fonts.googleapis.com/css2?family={k["fonte"].replace(" ", "+")}:wght@500;600;700;800;900'
             '&display=swap" rel="stylesheet">')
    falhas = []
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={"width": 1080, "height": 1440})
        for n in sorted(pecas):
            corpo, e_cta = pecas[n]
            pg.set_content(f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">{fonts}<style>{css(k)}</style></head>'
                           f'<body class="{"cta" if e_cta else ""}">{corpo}</body></html>')
            pg.wait_for_load_state("networkidle")
            pg.evaluate("document.fonts.ready")
            pg.wait_for_timeout(250)
            fs = FS_MAX
            while True:
                pg.evaluate(f"document.documentElement.style.setProperty('--fs','{fs}')")
                y = pg.evaluate(MEDIR)
                if (Y_MIN <= y[0] and y[1] <= Y_MAX) or fs <= FS_MIN:
                    break
                fs -= 1
            ok = Y_MIN <= y[0] and y[1] <= Y_MAX
            pg.screenshot(path=str(out / f"{n}.png"))
            print(f"{n} fs={fs} texto y={y} {'OK' if ok else '<-- ZONA MORTA, enxugue a copy'}")
            if not ok:
                falhas.append(f"{n}: {y}")
        b.close()

    contato(out, base, len(pecas))
    puro = "\n\n".join(f"[{i}]\n" + "\n\n".join(s) for i, s in enumerate(slides, 1))
    puro += f"\n\n[{len(pecas)}]\n{cta['titulo']}\n\n{cta['palavra'].upper()}\n\n{cta['texto']}"
    (base / "texto-puro.txt").write_text(puro + "\n", encoding="utf-8")
    if falhas:
        raise SystemExit("REPROVADO: " + " | ".join(falhas))
    print(f"OK {len(pecas)} slides em {out}")


if __name__ == "__main__":
    main()
