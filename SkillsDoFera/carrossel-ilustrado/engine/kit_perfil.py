# -*- coding: utf-8 -*-
"""Monta o kit de marca a partir do perfil.json do FeraBot (nome, handle, cores) e garante as dependencias.

Sem foto de avatar, gera um circulo com a inicial da marca (nada pessoal e embutido no pacote).
"""
import base64
import json
import os
import subprocess
import sys
from pathlib import Path

RAIZ = Path(os.environ.get("FERABOT_RAIZ") or Path(__file__).resolve().parents[3])  # engine -> skill -> SkillsDoFera -> raiz do FeraBot


def garantir_deps() -> None:
    """Pillow e Playwright (o pacote ja instala o Playwright; Pillow entra aqui se faltar)."""
    try:
        import PIL  # noqa: F401
    except ImportError:
        print("[setup] Instalando Pillow (so na primeira vez)...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-q", "pillow"], check=True)
    try:
        from playwright.sync_api import sync_playwright  # noqa: F401
    except ImportError:
        print("[setup] Instalando Playwright (so na primeira vez, ~1 min)...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-q", "playwright"], check=True)
        subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"], check=True)


def _rgb(h: str) -> tuple:
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def _lum(h: str) -> float:
    r, g, b = (c / 255 for c in _rgb(h))
    f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4  # noqa: E731
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def _clarear(h: str, t: float = 0.45) -> str:
    return "#%02X%02X%02X" % tuple(int(c + (255 - c) * t) for c in _rgb(h))


def _valida(c, padrao: str) -> str:
    c = (c or "").strip()
    ok = len(c) in (4, 7) and c.startswith("#") and all(x in "0123456789abcdefABCDEF" for x in c[1:])
    return c if ok else padrao


def avatar_inicial(nome: str, cor: str, txt: str) -> str:
    ini = (nome.strip()[:1] or "F").upper()
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="{cor}"/>'
           f'<text x="100" y="138" text-anchor="middle" font-family="Arial" font-weight="700" font-size="110" fill="{txt}">{ini}</text></svg>')
    return "data:image/svg+xml;base64," + base64.b64encode(svg.encode()).decode()


def kit_do_perfil() -> dict:
    """Le perfil.json da raiz do FeraBot. Retorna campos de kit (nome, handle, accent...) e a landing."""
    p = RAIZ / "perfil.json"
    if not p.exists():
        raise SystemExit("[ERRO] perfil.json nao encontrado na raiz do FeraBot. Rode primeiro: python SetupFera/setup_perfil.py")
    d = json.loads(p.read_text(encoding="utf-8"))
    prim = _valida(d.get("cor_primaria"), "#E8590C")
    sec = _valida(d.get("cor_secundaria"), "#111111")
    claro_sobre_prim = _lum(prim) > 0.45
    handle = (d.get("handle_instagram") or "").strip()
    if handle and not handle.startswith("@"):
        handle = "@" + handle
    return {
        "nome": d.get("nome") or "Sua marca", "handle": handle or "@suamarca",
        "accent": prim if _lum(prim) < 0.55 else sec,
        "accent_escuro": prim if _lum(prim) > 0.25 else _clarear(prim),
        "cor_bg": prim, "cor_txt": "#111111" if claro_sobre_prim else "#FFFFFF",
        "_perfil": d,
    }


def luminancia(h: str) -> float:
    return _lum(h)
