# -*- coding: utf-8 -*-
"""Renderiza os ad-*.html em PNG (2x) e JPG q92 (pasta jpg/, pronto pra subir), 1080x1350.
Com guarda de estouro: reprova peça cujo conteúdo não cabe (e reprova se não mediu nada).
Requer: pip install playwright && python -m playwright install chromium
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

HERE = pathlib.Path(__file__).parent
JPG = HERE / "jpg"
JPG.mkdir(exist_ok=True)

GUARDA = """() => {
  let medidos = 0, pior = 99999;
  for (const sel of ['.content', '.inner', '.hero']) {
    const el = document.querySelector(sel);
    if (el) { medidos++; pior = Math.min(pior, el.clientHeight - el.scrollHeight); }
  }
  return medidos ? pior : -99999;
}"""

htmls = sorted(HERE.glob("ad-*.html"))
if not htmls:
    print("Nenhum ad-*.html. Rode build_ads.py antes.")
    sys.exit(1)

estouros = 0
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1080, "height": 1350}, device_scale_factor=2)
    for h in htmls:
        page.goto(h.as_uri())
        page.wait_for_timeout(700)  # deixa Google Fonts carregar
        folga = page.evaluate(GUARDA)
        if folga < 0:
            estouros += 1
            print(f"!! ESTOURO {h.name}: {folga}px (ou nenhum seletor medido)")
        el = page.query_selector(".ad")
        png = HERE / f"{h.stem}.png"
        jpg = JPG / f"{h.stem}.jpg"
        el.screenshot(path=str(png))
        el.screenshot(path=str(jpg), type="jpeg", quality=92)
        print("OK", png.name, "+ jpg/" + jpg.name)
    browser.close()
print(f"OK — {len(htmls)} criativos renderizados (PNG + JPG) · estouros: {estouros}")
print(f"Pasta: {HERE.resolve()}")
sys.exit(1 if estouros else 0)
