#!/usr/bin/env python3
"""Motor de render do FERABOT — HTML vira PNG, PDF ou QA de página.

Usa Playwright (Chromium). Instala sozinho na primeira execução se faltar.

Comandos:
  png <arquivo.html> [--w 1080] [--h 1350] [--out saida.png] [--seletor css]
  pdf <arquivo.html> [--paisagem] [--out saida.pdf]
  qa  <arquivo.html | url>            # screenshots 375px e 1440px + alerta de overflow
"""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

for _stream in (sys.stdout, sys.stderr):
    if _stream and getattr(_stream, "encoding", "").lower() != "utf-8":
        try:
            _stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass


def garantir_playwright():
    """Importa o Playwright; instala pacote e Chromium se for a primeira vez."""
    try:
        from playwright.sync_api import sync_playwright  # noqa: F401
        return
    except ImportError:
        pass
    print("[setup] Instalando Playwright (só na primeira vez, ~1 min)...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", "playwright"], check=True)
    subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"], check=True)


def alvo_para_url(alvo: str) -> str:
    if alvo.startswith(("http://", "https://")):
        return alvo
    caminho = Path(alvo).resolve()
    if not caminho.exists():
        print(f"[ERRO] Arquivo não existe: {caminho}", file=sys.stderr)
        sys.exit(1)
    return caminho.as_uri()


def cmd_png(args: argparse.Namespace) -> None:
    garantir_playwright()
    from playwright.sync_api import sync_playwright

    origem = Path(args.arquivo)
    destino = Path(args.out) if args.out else origem.with_suffix(".png")
    with sync_playwright() as p:
        navegador = p.chromium.launch()
        pagina = navegador.new_page(viewport={"width": args.w, "height": args.h})
        pagina.goto(alvo_para_url(args.arquivo))
        pagina.wait_for_timeout(700)  # fontes e imagens
        if args.seletor:
            pagina.locator(args.seletor).first.screenshot(path=str(destino))
        else:
            pagina.screenshot(path=str(destino), clip={"x": 0, "y": 0, "width": args.w, "height": args.h})
        navegador.close()
    print(f"[ok] {destino.resolve()}")


def cmd_pdf(args: argparse.Namespace) -> None:
    garantir_playwright()
    from playwright.sync_api import sync_playwright

    origem = Path(args.arquivo)
    destino = Path(args.out) if args.out else origem.with_suffix(".pdf")
    with sync_playwright() as p:
        navegador = p.chromium.launch()
        pagina = navegador.new_page()
        pagina.goto(alvo_para_url(args.arquivo))
        pagina.wait_for_timeout(700)
        pagina.emulate_media(media="screen")
        if args.paisagem:
            # deck 16:9 — cada .pagina de 1280×720 vira uma página do PDF
            pagina.pdf(path=str(destino), width="1280px", height="720px",
                       print_background=True, page_ranges="")
        else:
            pagina.pdf(path=str(destino), format="A4", print_background=True)
        navegador.close()
    print(f"[ok] {destino.resolve()}")


def cmd_qa(args: argparse.Namespace) -> None:
    garantir_playwright()
    from playwright.sync_api import sync_playwright

    base = Path(args.arquivo)
    pasta = base.parent if base.exists() else Path.cwd()
    problemas = []
    with sync_playwright() as p:
        navegador = p.chromium.launch()
        for nome, largura in (("375", 375), ("1440", 1440)):
            pagina = navegador.new_page(viewport={"width": largura, "height": 900})
            pagina.goto(alvo_para_url(args.arquivo))
            pagina.wait_for_timeout(700)
            overflow = pagina.evaluate(
                "document.documentElement.scrollWidth > document.documentElement.clientWidth"
            )
            saida = pasta / f"qa-{nome}.png"
            pagina.screenshot(path=str(saida), full_page=True)
            print(f"[ok] qa-{nome}.png  overflow-horizontal={'SIM' if overflow else 'não'}")
            if overflow:
                problemas.append(nome)
            pagina.close()
        navegador.close()
    if problemas:
        print(f"[FALHA] Overflow horizontal em {', '.join(problemas)}px. Corrigir antes de entregar.")
        sys.exit(2)
    print("[ok] QA passou. Conferir visualmente os PNGs antes de fechar.")


def main() -> None:
    parser = argparse.ArgumentParser(prog="render", description="HTML → PNG/PDF/QA")
    sub = parser.add_subparsers(dest="cmd", required=True)

    png = sub.add_parser("png")
    png.add_argument("arquivo")
    png.add_argument("--w", type=int, default=1080)
    png.add_argument("--h", type=int, default=1350)
    png.add_argument("--out")
    png.add_argument("--seletor")
    png.set_defaults(func=cmd_png)

    pdf = sub.add_parser("pdf")
    pdf.add_argument("arquivo")
    pdf.add_argument("--paisagem", action="store_true")
    pdf.add_argument("--out")
    pdf.set_defaults(func=cmd_pdf)

    qa = sub.add_parser("qa")
    qa.add_argument("arquivo")
    qa.set_defaults(func=cmd_qa)

    argumentos = parser.parse_args()
    argumentos.func(argumentos)


if __name__ == "__main__":
    main()
