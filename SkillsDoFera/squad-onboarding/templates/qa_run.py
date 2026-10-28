"""QA único do onboarding — todos os gates de um run, numa passada.

Antes, cada rodada montava um teste diferente, e por isso escaparam o `<b>` literal na tela, os
asteriscos vazando, as pastas `_qa` no Drive do cliente e um exemplo com dois valores. Os gates
estavam escritos nos docs; agora eles rodam.

Uso:
    python -I qa_run.py <pasta-do-run>                      # local: fonte, kit, prévia renderizada
    python -I qa_run.py <run> --url https://x.netlify.app   # + URL pública e auditoria do Drive
    python -I qa_run.py <run> --url ... --entrega           # pendência vira FALHA (gate final)

Exit 1 se houver qualquer FALHA. Gera folhas de conferência visual em <run>/_qa/ (grid, círculos)
— o que o código não julga (composição, ritmo do grid) continua sendo olho, mas sobre a folha certa.
"""
import argparse
import filecmp
import json
import pathlib
import re
import subprocess
import sys
import urllib.error
import urllib.request

for _f in (sys.stdout, sys.stderr):
    try:
        _f.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

AQUI = pathlib.Path(__file__).resolve().parent
TEMPLATE = AQUI / "previa-perfil"
MOTOR = ["app.js", "plan.js", "styles.css", "criativos.js", "criativos.css", "kit.js",
         "agendar.js", "grupo.js", "slides.js", "proposta.js", "paginas.css", "slides.css", "proposta.css"]
PAGINAS = ["", "agendar.html", "grupo.html", "slides.html", "proposta.html"]

resultados = []


def registra(nivel, gate, detalhe=""):
    resultados.append((nivel, gate, detalhe))


def passa(gate, detalhe=""):
    registra("PASSA", gate, detalhe)


def aviso(gate, detalhe=""):
    registra("AVISO", gate, detalhe)


def falha(gate, detalhe=""):
    registra("FALHA", gate, detalhe)


def ler_content(p):
    t = p.read_text(encoding="utf-8")
    return json.loads(t[t.index("{"): t.rstrip().rstrip(";").rindex("}") + 1])


# ───────────────────────────────────────────── A. fonte única
def gate_fonte(run):
    fonte = run / "fonte"
    arquivos = [fonte / "fatos.json", fonte / "content.tpl.js", fonte / "feed.tpl.json"]
    if not all(a.exists() for a in arquivos):
        aviso("fonte única", "run sem fonte/ — conteúdo editado direto nos gerados (formato antigo)")
        return
    gerados = [run / "assets/content.js", run / "feed.json"]
    mais_nova = max(a.stat().st_mtime for a in arquivos)
    if any(g.stat().st_mtime < mais_nova for g in gerados):
        falha("fonte única", "a fonte mudou depois do último montar_cliente.py — rode o montador")
    else:
        passa("fonte única", "gerados mais novos que a fonte")

    restos = [g.name for g in gerados if re.search(r"\{\{\s*[\w.]+\s*\}\}", g.read_text(encoding="utf-8"))]
    (falha if restos else passa)("tokens resolvidos", f"sobrou {{{{token}}}} em {restos}" if restos else "")

    # lint: valor de fato escrito por extenso no template = fato duplicado esperando divergir
    fatos = json.loads(arquivos[0].read_text(encoding="utf-8"))
    ignorar = fatos.get("_lint_ignorar", [])
    valores = set()

    def coleta(o):
        if isinstance(o, dict):
            for k, v in o.items():
                if not k.startswith("_"):
                    coleta(v)
        elif isinstance(o, str) and len(o) >= 4:
            valores.add(o)
    coleta(fatos)
    soltos = {}
    for tpl in arquivos[1:]:
        texto = re.sub(r"\{\{[^}]+\}\}", "", tpl.read_text(encoding="utf-8"))
        for ig in ignorar:
            texto = texto.replace(ig, "")
        for v in valores:
            n = texto.count(v)
            if n:
                soltos[f"{tpl.name}: {v!r}"] = n
    if soltos:
        aviso("fato duplicado no template", "; ".join(f"{k} ×{n}" for k, n in soltos.items())
              + " — trocar pelo {{token}}")
    else:
        passa("fato duplicado no template", "nenhum valor de fato escrito por extenso")


# ───────────────────────────────────────────── B. kit
def gate_kit(run):
    feed_p = run / "feed.json"
    kit = run / "kit-feed-inicial"
    if not feed_p.exists() or not kit.is_dir():
        aviso("kit de feed", "ainda não produzido")
        return None
    feed = json.loads(feed_p.read_text(encoding="utf-8"))
    faltas = []
    for c in feed.get("carrosseis", []):
        n = len(list((kit / c["pasta"] / "png").glob("*.png")))
        if n != len(c["slides"]):
            faltas.append(f"{c['pasta']}: {n}/{len(c['slides'])} slides")
    est = len(list((kit / "estaticos").glob("*.png")))
    if est != len(feed.get("estaticos", [])):
        faltas.append(f"estáticos: {est}/{len(feed.get('estaticos', []))}")
    dest = len(list((kit / "destaques").glob("[0-9]*.png")))
    if dest != len(feed.get("capas_destaque", [])):
        faltas.append(f"capas de destaque: {dest}/{len(feed.get('capas_destaque', []))}")
    if not (kit / "perfil" / "foto-de-perfil.jpg").exists():
        faltas.append("foto de perfil")
    isca = feed.get("isca")
    if not isca:
        faltas.append("bloco isca no feed.json (o PDF é obrigatório)")
    elif not (kit / "isca" / f"{isca['arquivo']}.pdf").exists():
        faltas.append("PDF da isca")
    if not (kit / "COMO-POSTAR.md").exists():
        faltas.append("COMO-POSTAR.md")
    (falha if faltas else passa)("kit completo", "; ".join(faltas) if faltas else
                                 f"{len(feed.get('carrosseis', []))} carrosséis · {est} estáticos · "
                                 f"{dest} capas · foto de perfil · PDF · COMO-POSTAR")
    return feed


# ───────────────────────────────────────────── C. pendências
def gate_pendencias(run, entrega):
    textos = [p for p in (run / "assets/content.js", run / "feed.json") if p.exists()]
    preencher = sum(len(re.findall(r"\[A PREENCHER", p.read_text(encoding="utf-8"))) for p in textos)
    como = run / "kit-feed-inicial" / "COMO-POSTAR.md"
    links = sorted(set(re.findall(r"\[LINK D[^\]]*\]", como.read_text(encoding="utf-8")))) if como.exists() else []
    nivel = falha if entrega else aviso
    if preencher:
        nivel("[A PREENCHER] abertos", f"{preencher} — dado que só o cliente tem; cobrar antes de publicar")
    else:
        passa("[A PREENCHER] abertos", "nenhum")
    if links:
        nivel("links vazios nas respostas", ", ".join(links))
    else:
        passa("links vazios nas respostas", "nenhum")


# ───────────────────────────────────────────── D. motor
def gate_motor(run):
    diferentes = [f for f in MOTOR if (run / f).exists() and (TEMPLATE / f).exists()
                  and not filecmp.cmp(run / f, TEMPLATE / f, shallow=False)]
    (aviso if diferentes else passa)("motor igual ao template",
                                     f"divergiram: {diferentes} — copiar do template" if diferentes else "")


# ───────────────────────────────────────────── E. prévia renderizada
def gate_render(run, base, rotulo):
    from playwright.sync_api import sync_playwright
    qa = run / "_qa"
    qa.mkdir(exist_ok=True)
    with sync_playwright() as pw:
        nav = pw.chromium.launch()
        for nome, vp in (("375", {"width": 375, "height": 812}), ("1280", {"width": 1280, "height": 900})):
            pg = nav.new_page(viewport=vp)
            erros = []
            pg.on("pageerror", lambda e: erros.append(str(e)[:90]))
            pg.on("requestfailed", lambda r: None if "fonts.g" in r.url else erros.append("falhou " + r.url.split("/")[-1]))
            pg.goto(base + "index.html" if base.startswith("file") else base, wait_until="networkidle")
            pg.evaluate("""async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) {
                window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } window.scrollTo(0, 0); }""")
            pg.wait_for_timeout(700)
            info = pg.evaluate("""() => ({
                quebradas: [...document.images].filter(i => !i.complete || i.naturalWidth === 0).length,
                marcacao: (document.body.innerText.match(/<\\/?b>|\\*\\*/g) || []).length,
                posts: document.querySelectorAll('.post-tile').length,
                fixados: document.querySelectorAll('.tile-fixo').length,
                destaques: document.querySelectorAll('.highlight-button').length,
                secoes: document.querySelectorAll('.plan-section').length })""")
            # abre cada post e percorre todos os slides
            ids = pg.evaluate("() => [...document.querySelectorAll('[data-post]')].map(e => e.dataset.post)")
            slides = 0
            for i in ids:
                pg.click(f'[data-post="{i}"]')
                pg.wait_for_timeout(120)
                n = pg.evaluate("() => document.querySelectorAll('#slideDots .slide-dot').length || 1")
                for _ in range(n - 1):
                    pg.click('[data-action="next"]')
                    pg.wait_for_timeout(40)
                slides += n
                pg.keyboard.press("Escape")
                pg.wait_for_timeout(80)
            problemas = []
            if info["quebradas"]:
                problemas.append(f"{info['quebradas']} imagem(ns) quebrada(s)")
            if info["marcacao"]:
                problemas.append(f"{info['marcacao']} marcação literal (** ou <b>) na tela")
            if erros:
                problemas.append(f"erros: {erros[:3]}")
            gate = f"prévia {rotulo} {nome}px"
            if problemas:
                falha(gate, "; ".join(problemas))
            else:
                passa(gate, f"{info['posts']} posts ({info['fixados']} fixados) · {slides} slides percorridos · "
                            f"{info['destaques']} destaques · {info['secoes']} seções")
            if nome == "1280":
                pg.locator("#feedGrid").screenshot(path=str(qa / "grid.png"))
            pg.close()
        nav.close()


def folha_circulos(run):
    """Avatar e capas de destaque mascarados em círculo no tamanho real — conferência a olho."""
    from PIL import Image, ImageDraw
    pecas = []
    avatar = run / "assets" / "avatar.jpg"
    if avatar.exists():
        pecas.append(("avatar", Image.open(avatar)))
    for capa in sorted((run / "kit-feed-inicial" / "destaques").glob("[0-9]*.png")):
        im = Image.open(capa)
        w, h = im.size
        pecas.append((capa.stem, im.crop((0, (h - w) // 2, w, (h - w) // 2 + w))))
    if not pecas:
        return
    folha = Image.new("RGB", (40 + 230 * len(pecas), 200), (16, 17, 15))
    d = ImageDraw.Draw(folha)
    for i, (nome, im) in enumerate(pecas):
        x = 30 + i * 230
        for t, dx in ((110, 0), (56, 124), (32, 192)):
            c = im.convert("RGB").resize((t, t), Image.LANCZOS)
            m = Image.new("L", (t, t), 0)
            ImageDraw.Draw(m).ellipse((0, 0, t - 1, t - 1), fill=255)
            folha.paste(c, (x + dx - (0 if dx == 0 else 0), 30 + (110 - t) // 2), m)
        d.text((x, 160), nome, fill=(200, 205, 195))
    folha.save(run / "_qa" / "circulos.jpg", quality=92)


# ───────────────────────────────────────────── F. URL pública
def http(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, method="GET"), timeout=30) as r:
            return r.status, r.headers.get("Content-Type", "")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception as e:
        return 0, str(e)[:40]


def gate_url(run, url, feed):
    url = url.rstrip("/") + "/"
    ruins = [f"{p or '/'}={s}" for p in PAGINAS for s, _ in [http(url + p)] if s != 200]
    if feed and feed.get("isca"):
        s, tipo = http(url + f"kit-feed-inicial/isca/{feed['isca']['arquivo']}.pdf")
        if s != 200 or "pdf" not in tipo:
            ruins.append(f"PDF={s} {tipo}")
    (falha if ruins else passa)("páginas no ar", "; ".join(ruins) if ruins else
                                "perfil + 4 páginas + PDF em 200")

    internos = [p.relative_to(run).as_posix() for p in run.rglob("*.md")
                if "_publicar" not in p.parts and "node_modules" not in p.parts]
    internos += ["feed.json", "fonte/fatos.json", "drive-links.json", "kit-feed-inicial/isca/_qa/pg01.png"]
    vazou = [p for p in internos if http(url + p)[0] == 200]
    (falha if vazou else passa)("interno fora do ar", f"VAZOU: {vazou}" if vazou else
                                f"{len(internos)} arquivos internos em 404")


# ───────────────────────────────────────────── G. Drive
def gate_drive(run):
    if not (run / "drive-links.json").exists():
        aviso("Drive", "sem drive-links.json — kit ainda não subiu (subir_drive.mjs ou modo --manual)")
        return
    r = subprocess.run(["node", str(AQUI / "kit-feed" / "auditar_drive.mjs"), str(run)],
                       capture_output=True, text=True, encoding="utf-8", errors="replace",
                       cwd=str(run), shell=True)
    try:
        a = json.loads(r.stdout.strip().splitlines()[-1])
    except Exception:
        falha("Drive", f"auditoria não rodou: {(r.stderr or r.stdout)[-160:]}")
        return
    if a.get("indisponivel"):
        # Drive é opcional no FERABOT: sem credencial, a conferência é manual (não reprova).
        aviso("Drive", a.get("motivo", "sem credencial do Drive — conferir à mão"))
        return
    privados = [n for n, ok in a["pdfs_publicos"].items() if not ok]
    if not a["pasta_publica"] or privados:
        falha("Drive público", f"pasta pública={a['pasta_publica']} · PDFs privados={privados}")
    else:
        passa("Drive público", f"pasta e {len(a['pdfs_publicos'])} PDF(s) com anyone→reader")
    (falha if a["lixo"] else passa)("Drive sem lixo", f"_qa* na pasta do cliente: {a['lixo']}" if a["lixo"]
                                    else f"{a['arquivos']} arquivos, nenhum _qa*")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("run")
    ap.add_argument("--url")
    ap.add_argument("--entrega", action="store_true")
    a = ap.parse_args()
    run = pathlib.Path(a.run).resolve()

    gate_fonte(run)
    feed = gate_kit(run)
    gate_pendencias(run, a.entrega)
    gate_motor(run)
    gate_render(run, run.as_uri() + "/", "local")
    folha_circulos(run)
    if a.url:
        gate_url(run, a.url, feed)
        gate_render(run, a.url.rstrip("/") + "/", "no ar")
        gate_drive(run)

    largura = max(len(g) for _, g, _ in resultados)
    print()
    for nivel, gate, det in resultados:
        marca = {"PASSA": "✓", "AVISO": "!", "FALHA": "✗"}[nivel]
        print(f" {marca} {nivel:<5}  {gate:<{largura}}  {det}")
    n = {k: sum(1 for r in resultados if r[0] == k) for k in ("PASSA", "AVISO", "FALHA")}
    print(f"\n {n['PASSA']} passam · {n['AVISO']} avisos · {n['FALHA']} falhas")
    print(f" conferir a olho: {run / '_qa' / 'grid.png'}  e  {run / '_qa' / 'circulos.jpg'}")
    return 1 if n["FALHA"] else 0


if __name__ == "__main__":
    sys.exit(main())
