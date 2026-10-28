# -*- coding: utf-8 -*-
"""Motor do MODO DISTRIBUIÇÃO (story ad nativo, sem CTA) — 1080x1920.

Foto crua + texto em caixa de destaque do próprio Instagram (uma caixa por linha, centralizada, pequena).
Caixa 1 = branca/texto preto (o problema, no passado). Caixa 2 = preta/texto branco (a solução, no presente).

GATE DE ROSTO: detecta o rosto na foto (YuNet, maior score; cai pro Haar do OpenCV se o modelo faltar) e só
começa o texto em queixo + FOLGA px (nunca acima da zona morta de 250px); encolhe a fonte até caber acima de
y=1540 (zona do botão do story); reprova se não couber ou se algum pixel do recorte do rosto mudar.
Sem rosto detectado = REPROVA (conferir à mão ou trocar a foto). Foto sem pessoa: passar "topo" no JSON.

Uso:
  python render_nativo.py pecas.json saida/
pecas.json = [{"id": "c01", "foto": "fotos/foto.jpg", "caixa1": "linha\\nlinha", "caixa2": "linha"}]
             (opcional por peça: "topo": 600 -> pula o gate de rosto e começa o texto nesse y)
Caminho de "foto" relativo é resolvido a partir da pasta do pecas.json.
Sai: saida/nativo_<id>.png + saida/rosto_<id>.png (recorte pra QA visual). Exit 1 se algum reprovar.

Requer: pip install playwright opencv-python  &&  python -m playwright install chromium
"""
import json
import sys
from pathlib import Path

for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

try:
    import cv2
    from playwright.sync_api import sync_playwright
except ImportError as erro:
    print(f"[ERRO] Falta dependência: {erro.name}. Rode: pip install playwright opencv-python "
          "&& python -m playwright install chromium", file=sys.stderr)
    sys.exit(2)

AQUI = Path(__file__).resolve().parent
YUNET = AQUI / "face_detection_yunet_2023mar.onnx"
LARGURA, ALTURA = 1080, 1920
FOLGA = 70           # px entre o queixo e o início do texto
ZONA_MORTA = 250     # px livres de texto no topo e na base
BASE_MAX = 1540      # o texto termina acima da zona do botão do story
ESCALAS = [1.0, .94, .88, .82, .76, .7, .64]
FONT = '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap" rel="stylesheet">'


def rosto(png):
    """(x, y, w, h) do rosto principal, ou None."""
    img = cv2.imread(str(png))
    if YUNET.exists() and hasattr(cv2, "FaceDetectorYN"):
        det = cv2.FaceDetectorYN.create(str(YUNET), "", (img.shape[1], img.shape[0]), score_threshold=0.6)
        _, faces = det.detect(img)
        if faces is None or len(faces) == 0:
            return None
        return tuple(float(v) for v in max(faces, key=lambda r: r[14])[:4])
    cascata = cv2.CascadeClassifier(str(Path(cv2.data.haarcascades) / "haarcascade_frontalface_default.xml"))
    faces = cascata.detectMultiScale(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), 1.1, 6, minSize=(60, 60))
    if len(faces) == 0:
        return None
    return tuple(float(v) for v in max(faces, key=lambda r: r[2] * r[3]))


def caixa(cls, t):
    t = t.replace("R$ ", "R$ ").replace("follow-up", "follow‑up")
    return f'<div class="cx {cls}"><span>' + "<br>".join(t.split("\n")) + "</span></div>"


def html(foto, c1, c2, top, k, mostrar=True):
    css = f"""*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:{LARGURA}px;height:{ALTURA}px;overflow:hidden;background:#000}}
.foto{{position:absolute;inset:0}} .foto img{{width:100%;height:100%;object-fit:cover;display:block}}
.txt{{position:absolute;left:110px;right:110px;top:{top}px;text-align:center;text-wrap:balance;font-family:Inter,sans-serif;
font-weight:600;font-size:{44 * k:.0f}px;line-height:1.78;{'' if mostrar else 'display:none'}}}
.cx{{margin-bottom:{34 * k:.0f}px}} .cx span{{padding:.16em .55em;border-radius:.5em;-webkit-box-decoration-break:clone;box-decoration-break:clone}}
.b span{{background:#fff;color:#111}} .p span{{background:#000;color:#fff}}"""
    return (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">{FONT}<style>{css}</style></head><body>'
            f'<div class="foto"><img src="{Path(foto).resolve().as_uri()}"></div>'
            f'<div class="txt" id="t">{caixa("b", c1)}{caixa("p", c2) if c2 else ""}</div></body></html>')


def abrir(pg, arq):
    pg.goto(arq.resolve().as_uri())
    pg.wait_for_load_state("networkidle")
    pg.evaluate("document.fonts.ready")
    pg.wait_for_timeout(400)


def montar(p, out, pg, base_dir):
    foto = Path(p["foto"])
    foto = foto if foto.is_absolute() else (base_dir / foto)
    if not foto.exists():
        print(f"{p['id']}: foto não encontrada ({foto}) — REPROVADO")
        return False
    arq = out / f"_n_{p['id']}.html"
    fundo = out / f"_fundo_{p['id']}.png"
    arq.write_text(html(foto, "", "", 0, 1, mostrar=False), encoding="utf-8")
    abrir(pg, arq)
    pg.screenshot(path=str(fundo))

    box = None
    if "topo" in p:
        top = max(ZONA_MORTA, int(p["topo"]))
    else:
        box = rosto(fundo)
        if box is None:
            print(f"{p['id']}: SEM ROSTO detectado — REPROVADO (troque a foto ou passe \"topo\" se não há pessoa)")
            arq.unlink(missing_ok=True); fundo.unlink(missing_ok=True)
            return False
        x, y, w, h = box
        top = max(ZONA_MORTA, int(y + h) + FOLGA)

    base, k = None, ESCALAS[0]
    for k in ESCALAS:
        arq.write_text(html(foto, p["caixa1"], p.get("caixa2", ""), top, k), encoding="utf-8")
        abrir(pg, arq)
        base = pg.evaluate("()=>Math.round(document.getElementById('t').getBoundingClientRect().bottom)")
        if base <= BASE_MAX:
            break
    final = out / f"nativo_{p['id']}.png"
    pg.screenshot(path=str(final))

    dif = 0.0
    if box is not None:
        a, b = cv2.imread(str(final)), cv2.imread(str(fundo))
        x0, y0 = max(0, int(x - .15 * w)), max(0, int(y - .45 * h))
        x1, y1 = min(LARGURA, int(x + 1.15 * w)), min(ALTURA, int(y + 1.1 * h))
        dif = float(abs(a[y0:y1, x0:x1].astype(int) - b[y0:y1, x0:x1].astype(int)).mean())
        cv2.imwrite(str(out / f"rosto_{p['id']}.png"), a[y0:y1, x0:x1])
    arq.unlink(missing_ok=True); fundo.unlink(missing_ok=True)

    ok = base <= BASE_MAX and dif < 1.0
    faixa_rosto = f"rosto {int(box[1])}..{int(box[1] + box[3])}" if box else "sem gate de rosto (topo fixo)"
    print(f"{p['id']}: {faixa_rosto} · texto {top}..{base} · escala {k} · diff rosto {dif:.2f} · "
          f"{'OK' if ok else 'REPROVADO'}")
    return ok


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(2)
    arq_pecas = Path(sys.argv[1]).resolve()
    pecas = json.loads(arq_pecas.read_text(encoding="utf-8"))
    out = Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={"width": LARGURA, "height": ALTURA})
        res = [montar(p, out, pg, arq_pecas.parent) for p in pecas]
        b.close()
    print(f"Saída: {out.resolve()}")
    sys.exit(0 if all(res) else 1)


if __name__ == "__main__":
    main()
