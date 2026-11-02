# -*- coding: utf-8 -*-
"""Motor do carrossel de tela viva do FeraBot.

Card de tweet branco e parado, com uma caixa em que uma tela animada conta uma cena de 12 s.
Lê o perfil.json da raiz do FeraBot (ou --perfil) e o peca.py da pasta da peça.

Uso:
  python build.py <pasta-da-peca> [--so 2] [--perfil caminho/perfil.json] [--fps 30]

Saída em <pasta>/saida/: 01.mp4 ... NN.mp4, o slide final em JPG, legenda.txt, texto-puro.txt,
_contato.jpg (fim de cada cena), _quadro0.jpg (capas) e _check_NN.jpg (primeiro e último quadro).

Instala sozinho Playwright, Chromium e Pillow na primeira execução. O FFmpeg o cliente
instala antes: winget install Gyan.FFmpeg
"""
import argparse
import base64
import glob
import html
import importlib
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

RAIZ = Path(__file__).resolve().parents[3]
DUR = 12
CAIXA_L, CAIXA_A = 930, 600
GAP = 4
COR_PADRAO = ("#1D4ED8", "#FFD84D")


def garantir_dependencias() -> None:
    """Instala Pillow, Playwright e Chromium se faltarem (como o render.py do pacote)."""
    try:
        import PIL  # noqa: F401
    except ImportError:
        print("[setup] Instalando Pillow...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-q", "pillow"], check=True)
    try:
        import playwright.sync_api  # noqa: F401
    except ImportError:
        print("[setup] Instalando Playwright (só na primeira vez, ~1 min)...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-q", "playwright"], check=True)
        subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"], check=True)


def achar_ffmpeg() -> str:
    """FFmpeg no PATH ou na pasta do winget (o PATH só atualiza em terminal novo)."""
    achado = shutil.which("ffmpeg")
    if achado:
        return achado
    base = os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg*\*\bin\ffmpeg.exe")
    for caminho in glob.glob(base):
        return caminho
    raise SystemExit("FFmpeg não encontrado. Rode no terminal: winget install Gyan.FFmpeg  "
                     "(depois feche e abra o terminal e tente de novo)")


def carregar_perfil(caminho: str | None) -> dict:
    p = Path(caminho) if caminho else RAIZ / "perfil.json"
    if not p.exists():
        raise SystemExit(f"perfil.json não encontrado em {p}. Rode: python SetupFera/setup_perfil.py")
    dados = json.loads(p.read_text(encoding="utf-8"))
    for campo in ("nome", "handle_instagram"):
        if not dados.get(campo):
            raise SystemExit(f"perfil.json sem o campo '{campo}'")
    return dados


def cor_valida(valor: str | None, padrao: str) -> str:
    return valor if valor and re.fullmatch(r"#[0-9a-fA-F]{6}", valor.strip()) else padrao


def avatar_html(perfil: dict, pasta: Path) -> str:
    """Foto do cliente se o perfil trouxer 'foto' (caminho), senão círculo com as iniciais."""
    foto = perfil.get("foto")
    if foto:
        caminho = (pasta / foto) if not Path(foto).is_absolute() else Path(foto)
        if caminho.exists():
            tipo = "png" if caminho.suffix.lower() == ".png" else "jpeg"
            b64 = base64.b64encode(caminho.read_bytes()).decode()
            return f'<img src="data:image/{tipo};base64,{b64}">'
    iniciais = "".join(w[0] for w in perfil["nome"].split()[:2]).upper()
    return f'<div class="ini">{html.escape(iniciais)}</div>'


FONTES = ('<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800'
          '&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">')

CSS = f"""
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{width:1080px;height:1350px;overflow:hidden;background:#fff}}
body{{font-family:Inter,'Segoe UI',sans-serif;color:#0F1419;-webkit-font-smoothing:antialiased;
display:flex;flex-direction:column;justify-content:center;padding:0 75px}}
.hd{{display:flex;align-items:center;gap:30px;margin-bottom:34px}}
.hd img,.ini{{width:136px;height:136px;border-radius:50%;object-fit:cover;flex-shrink:0}}
.ini{{background:var(--p);color:#fff;font-size:54px;font-weight:800;display:flex;align-items:center;justify-content:center}}
.nm{{display:flex;align-items:center;gap:12px;font-size:42px;font-weight:700;letter-spacing:-.8px}}
.nm svg{{width:38px;height:38px}}
.at{{font-size:35px;color:#71767B;margin-top:4px}}
p{{font-size:41px;line-height:1.24;letter-spacing:-.5px;margin-bottom:28px}}
p.t{{font-weight:700}}
#palco{{width:{CAIXA_L}px;height:{CAIXA_A}px;border-radius:24px;overflow:hidden;position:relative;background:#fff;flex-shrink:0}}
.cred{{font-size:23px;color:#8B9198;margin-top:14px}}
"""

SELO = ('<svg viewBox="0 0 24 24"><path fill="#1D9BF0" d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91'
        's-2.52-1.27-3.91-.81C14.67 2.63 13.43 1.75 12 1.75s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91'
        'C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19'
        's2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"/>'
        '<path fill="#fff" d="M10.54 16.2l-3.74-3.74 1.41-1.41 2.33 2.33 5.25-5.25 1.41 1.41z"/></svg>')


def cabecalho(perfil: dict, pasta: Path) -> str:
    # O selo só entra se o perfil for verificado de verdade (campo opcional "verificado": true).
    selo = SELO if perfil.get("verificado") is True else ""
    return (f'<div class="hd">{avatar_html(perfil, pasta)}<div>'
            f'<div class="nm">{html.escape(perfil["nome"])}{selo}</div>'
            f'<div class="at">{html.escape(perfil["handle_instagram"])}</div></div></div>')


def html_slide(topo: str, texto: list, palco: str, cores: tuple, cred: str = "") -> str:
    from timeline import JS_TIMELINE
    ps = "".join(f'<p class="{c}">{t}</p>' for c, t in texto)
    credito = f'<div class="cred">{cred}</div>' if cred else ""
    raiz = f"<style>:root{{--p:{cores[0]};--s:{cores[1]}}}</style>"
    return (f'<!doctype html><meta charset="utf-8">{FONTES}<style>{CSS}</style>{raiz}'
            f'<body>{topo}{ps}<div id="palco">{palco}</div>{credito}{JS_TIMELINE}</body>')


def abrir(pg, conteudo: str, nome: str, tmp: Path) -> None:
    f = tmp / f"{nome}.html"
    f.write_text(conteudo, encoding="utf-8")
    pg.goto(f.as_uri())
    pg.wait_for_timeout(900)
    pg.evaluate("document.fonts.ready")
    altura = pg.evaluate("document.body.scrollHeight")
    if altura > 1350:
        raise SystemExit(f"Slide {nome}: o card estoura o canvas ({altura}px). Corte a copy, não diminua a fonte.")
    vaza = pg.evaluate("""() => {
        const c = document.querySelector('#palco');
        if (!c || !window.seek) return [];
        window.seek(window.DUR);
        const box = c.getBoundingClientRect();
        return [...c.querySelectorAll('.c *')].filter(e => e.children.length === 0 && e.textContent.trim())
            .filter(e => { const r = e.getBoundingClientRect();
                return r.width && (r.right > box.right + 1 || r.bottom > box.bottom + 1 || r.left < box.left - 1 || r.top < box.top - 1); })
            .map(e => e.textContent.trim().slice(0, 40));
    }""")
    if vaza:
        raise SystemExit(f"Slide {nome}: texto saindo da caixa: {vaza}")
    pequeno = pg.evaluate("""() => [...document.querySelectorAll('#palco .c *')]
        .filter(e => e.children.length === 0 && e.textContent.trim() && parseFloat(getComputedStyle(e).fontSize) < 20)
        .map(e => e.textContent.trim().slice(0, 40))""")
    if pequeno:
        raise SystemExit(f"Slide {nome}: texto abaixo de 20 px, ilegível no celular: {pequeno}")


def render_video(pg, ctx: dict, i: int, s: dict) -> None:
    peca, topo, saida, tmp, fps, ffmpeg = (ctx[k] for k in ("peca", "topo", "saida", "tmp", "fps", "ffmpeg"))
    nome = f"{i:02d}"
    abrir(pg, html_slide(topo, s["texto"], peca.CENAS[s["cena"]], ctx["cores"], s.get("cred", "")), nome, tmp)
    inicio = peca.INICIO[s["cena"]]  # o quadro 0 é a capa: a tela já nasce montada
    pg.evaluate(f"window.seek({inicio})")
    card = tmp / f"{nome}_card.png"
    pg.screenshot(path=str(card))
    caixa = pg.locator("#palco").bounding_box()
    x, y = round(caixa["x"]), round(caixa["y"])
    cmd = [ffmpeg, "-y", "-loglevel", "error", "-loop", "1", "-t", str(DUR), "-i", str(card),
           "-f", "image2pipe", "-framerate", str(fps), "-c:v", "png", "-i", "-",
           "-f", "lavfi", "-t", str(DUR), "-i", "anullsrc=r=44100:cl=stereo",
           "-filter_complex", f"[0:v][1:v]overlay={x}:{y}:shortest=1,format=yuv420p[v]",
           "-map", "[v]", "-map", "2:a", "-r", str(fps), "-c:v", "libx264", "-crf", "17", "-preset", "medium",
           "-g", "15", "-c:a", "aac", "-b:a", "96k", "-shortest", "-movflags", "+faststart", str(saida / f"{nome}.mp4")]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    alvo = pg.locator("#palco")
    total = DUR * fps
    for n in range(total):
        pg.evaluate(f"window.seek({inicio + n / total * (DUR - inicio)})")
        proc.stdin.write(alvo.screenshot(type="png"))
    pg.evaluate(f"window.seek({DUR})")
    alvo.screenshot(path=str(tmp / f"{nome}_fim.png"))
    pg.screenshot(path=str(tmp / f"{nome}_final.png"))
    proc.stdin.close()
    if proc.wait():
        raise SystemExit(f"ffmpeg falhou no slide {nome}")
    from PIL import Image
    par = Image.new("RGB", (2180, 1350), "#BBB")
    par.paste(Image.open(card).convert("RGB"), (0, 0))
    par.paste(Image.open(tmp / f"{nome}_final.png").convert("RGB"), (1100, 0))
    par.resize((1090, 675)).save(saida / f"_check_{nome}.jpg", quality=88)


def mosaico(fins: list):
    """Telas inteiras, sem corte, em 2 linhas com a mesma proporção da caixa."""
    from PIL import Image
    cima = len(fins) // 2
    linhas = [l for l in (fins[:cima], fins[cima:]) if l]
    alturas = [round(((CAIXA_L - GAP * (len(l) - 1)) / len(l)) * CAIXA_A / CAIXA_L) for l in linhas]
    img = Image.new("RGB", (CAIXA_L, sum(alturas) + GAP * (len(linhas) - 1)), "white")
    y = 0
    for linha, alt in zip(linhas, alturas):
        larg = (CAIXA_L - GAP * (len(linha) - 1)) / len(linha)
        for k, f in enumerate(linha):
            img.paste(Image.open(f).convert("RGB").resize((round(larg), alt), Image.LANCZOS), (round(k * (larg + GAP)), y))
        y += alt + GAP
    return img


def render_final(pg, ctx: dict) -> str:
    from PIL import Image
    peca, tmp, saida = ctx["peca"], ctx["tmp"], ctx["saida"]
    n = len(peca.SLIDES)
    img = mosaico([tmp / f"{i:02d}_fim.png" for i in range(1, n + 1)])
    mos = tmp / "mosaico.png"
    img.save(mos)
    b64 = base64.b64encode(mos.read_bytes()).decode()
    palco = (f'<style>#palco{{height:{img.height}px}}</style>'
             f'<img src="data:image/png;base64,{b64}" style="width:100%;display:block">')
    nome = f"{n + 1:02d}"
    abrir(pg, html_slide(ctx["topo"], peca.FINAL, palco, ctx["cores"]), nome, tmp)
    png = tmp / f"{nome}.png"
    pg.screenshot(path=str(png))
    Image.open(png).convert("RGB").save(saida / f"{nome}.jpg", quality=95)
    return nome


def folha(quadros: list, destino: Path) -> None:
    from PIL import Image
    cols = 3
    linhas = (len(quadros) + cols - 1) // cols
    img = Image.new("RGB", (cols * 720 + (cols - 1) * 20, linhas * 900 + (linhas - 1) * 20), "#DDD")
    for n, q in enumerate(quadros):
        img.paste(q.resize((720, 900)), ((n % cols) * 740, (n // cols) * 920))
    img.save(destino, quality=88)


def quadro(ffmpeg: str, video: Path, instante: float, tmp: Path):
    from PIL import Image
    q = tmp / f"_q_{video.stem}_{instante}.png"
    subprocess.run([ffmpeg, "-y", "-loglevel", "error", "-ss", str(instante), "-i", str(video),
                    "-frames:v", "1", str(q)], check=True)
    return Image.open(q).convert("RGB")


def texto_puro(peca) -> str:
    """Slides + legenda sem HTML, pronto para copiar e colar."""
    def limpo(t: str) -> str:
        return html.unescape(re.sub(r"<[^>]+>", "", t)).replace("\xa0", " ")
    blocos = []
    for n, s in enumerate(peca.SLIDES, 1):
        blocos.append(f"SLIDE {n}\n" + "\n".join(limpo(t) for _, t in s["texto"]))
    blocos.append(f"SLIDE {len(peca.SLIDES) + 1}\n" + "\n".join(limpo(t) for _, t in peca.FINAL))
    blocos.append("LEGENDA\n" + peca.LEGENDA.strip())
    return "\n\n".join(blocos) + "\n"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("pasta", help="pasta da peça, com peca.py e cenas.py")
    ap.add_argument("--so", type=int, help="renderiza só este slide, para ajustar uma cena")
    ap.add_argument("--perfil", help="perfil.json alternativo (padrão: o da raiz do FeraBot)")
    ap.add_argument("--fps", type=int, default=30, help="quadros por segundo (use 12 para um teste rápido)")
    a = ap.parse_args()
    garantir_dependencias()
    ffmpeg = achar_ffmpeg()
    from playwright.sync_api import sync_playwright
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    pasta = Path(a.pasta).resolve()
    sys.path.insert(0, str(pasta))
    perfil = carregar_perfil(a.perfil)
    os.environ["FERABOT_PERFIL_JSON"] = json.dumps(perfil, ensure_ascii=False)
    peca = importlib.import_module("peca")
    cores = (cor_valida(perfil.get("cor_primaria"), COR_PADRAO[0]), cor_valida(perfil.get("cor_secundaria"), COR_PADRAO[1]))
    saida, tmp = pasta / "saida", pasta / "_tmp"
    saida.mkdir(exist_ok=True)
    tmp.mkdir(exist_ok=True)
    (saida / "legenda.txt").write_text(peca.LEGENDA.strip() + "\n", encoding="utf-8")
    (saida / "texto-puro.txt").write_text(texto_puro(peca), encoding="utf-8")
    ctx = dict(peca=peca, topo=cabecalho(perfil, pasta), saida=saida, tmp=tmp, fps=a.fps, ffmpeg=ffmpeg, cores=cores)
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={"width": 1080, "height": 1350})
        for i, s in enumerate(peca.SLIDES, 1):
            if a.so and a.so != i:
                continue
            render_video(pg, ctx, i, s)
            print("slide", i, "ok. Conferir", saida / f"_check_{i:02d}.jpg", flush=True)
        final = None if a.so else render_final(pg, ctx)
        b.close()
    if final:
        videos = [saida / f"{i:02d}.mp4" for i in range(1, len(peca.SLIDES) + 1)]
        from PIL import Image
        folha([quadro(ffmpeg, v, 11, tmp) for v in videos] + [Image.open(saida / f"{final}.jpg")], saida / "_contato.jpg")
        folha([quadro(ffmpeg, v, 0, tmp) for v in videos], saida / "_quadro0.jpg")
        print("Conferir:", saida / "_contato.jpg", "e", saida / "_quadro0.jpg")
        print("Pasta da peça:", saida)


if __name__ == "__main__":
    main()
