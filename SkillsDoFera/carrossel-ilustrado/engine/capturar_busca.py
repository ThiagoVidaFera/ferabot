# -*- coding: utf-8 -*-
"""Prints REAIS de busca no YouTube: barra de busca + so o TEXTO do resultado (sem thumbnail/rosto de terceiro).

Uso: python capturar_busca.py <buscas.json> <pasta_saida>
buscas.json = [{"id": "p3", "query": "pergunta que o seu cliente digita", "match": "trecho do titulo"}, ...]
  match = trecho do titulo/canal do resultado que serve de prova (case-insensitive); sem match usa o 1o organico.
Saida: <pasta>/<id>.png + marcas.json (posicao do marcador). A ORDEM dos resultados muda a cada execucao:
sempre escolha por match e confira o PNG final.
"""
import io
import json
import sys
import urllib.parse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import kit_perfil  # noqa: E402

kit_perfil.garantir_deps()
from PIL import Image  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402


def png(el):
    return Image.open(io.BytesIO(el.screenshot())).convert("RGB")


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    alvos = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    out = Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    marcas = {}
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        ctx = b.new_context(viewport={"width": 1300, "height": 900}, locale="pt-BR", device_scale_factor=2,
                            timezone_id="America/Sao_Paulo")
        for a in alvos:
            pg = ctx.new_page()
            pg.goto("https://www.youtube.com/results?search_query=" + urllib.parse.quote(a["query"]), wait_until="domcontentloaded")
            pg.wait_for_timeout(3500)
            cards = pg.query_selector_all("ytd-video-renderer")
            m = (a.get("match") or "").lower()
            res = next((c for c in cards if m and m in c.inner_text().lower()), cards[0])
            print(a["id"], "->", res.query_selector("#video-title").inner_text().strip()[:80].encode("ascii", "replace").decode())
            res.scroll_into_view_if_needed()
            pg.wait_for_timeout(1500)
            meta = png(res.query_selector("#meta"))
            pg.evaluate("window.scrollTo(0,0)")
            pg.wait_for_timeout(600)
            bar = png(pg.query_selector("ytd-searchbox #search-form") or pg.query_selector("#center"))
            bar = bar.crop((185, 0, 1385, bar.height))
            meta = meta.crop((0, 0, 1260, meta.height))
            w, h = 1260, bar.height + meta.height + 100
            card = Image.new("RGB", (w, h), "white")
            card.paste(bar, ((w - bar.width) // 2, 24))
            card.paste(meta, (24, 24 + bar.height + 36))
            card.save(out / f"{a['id']}.png")
            marcas[a["id"]] = [(24 + bar.height + 8) / h, (meta.height + 56) / h]
            pg.close()
        b.close()
    (out / "marcas.json").write_text(json.dumps(marcas), encoding="utf-8")


if __name__ == "__main__":
    main()
