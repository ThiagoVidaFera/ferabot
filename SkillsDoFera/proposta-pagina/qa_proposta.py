#!/usr/bin/env python
"""QA da proposta gerada: abre em 375px e 1280px, tira screenshot e confere as regras.

Uso: python qa_proposta.py <pasta-com-index.html> [--saida <pasta-de-prints>]
Confere: sem rolagem lateral, sem erro de JS, imagens carregam, sem [FONTE OMISSA], sem travessão, ponto e vírgula
ou emoji no texto, preço só da seção 04 em diante, um botão "Vamos começar" que leva ao destino, validade de 3 dias
e a proposta vencendo sozinha depois do prazo. Prints: <saida>/375-pagina.png, 375-topo.png e 1280-pagina.png.
Sai com código 1 se algo falhar. Precisa de: pip install playwright && playwright install chromium
"""
from __future__ import annotations

import argparse
import re
import sys
from datetime import date
from pathlib import Path

from playwright.sync_api import sync_playwright

PROIBIDOS = re.compile("[—–;]|[\U0001F000-\U0001FAFF☀-➿️]")


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("pasta")
    ap.add_argument("--saida")
    a = ap.parse_args()
    pasta = Path(a.pasta).resolve()
    saida = Path(a.saida).resolve() if a.saida else pasta / "_qa"
    saida.mkdir(parents=True, exist_ok=True)
    pagina = (pasta / "index.html").as_uri()
    falhas: list[str] = []

    def checa(ok: bool, nome: str, extra: str = "") -> None:
        print(("OK     " if ok else "FALHOU ") + nome + (f"  [{extra}]" if extra else ""))
        if not ok:
            falhas.append(nome)

    with sync_playwright() as pw:
        b = pw.chromium.launch()
        for largura, altura in ((375, 812), (1280, 800)):
            pg = b.new_page(viewport={"width": largura, "height": altura})
            erros: list[str] = []
            pg.on("pageerror", lambda e: erros.append(str(e)))
            pg.goto(pagina)
            pg.wait_for_timeout(500)
            for y in range(0, 40000, 600):
                pg.evaluate(f"window.scrollTo(0,{y})")
                pg.wait_for_timeout(40)
            pg.wait_for_timeout(1500)
            pg.evaluate("window.scrollTo(0,0)")
            checa(pg.evaluate("document.documentElement.scrollWidth-innerWidth") <= 0, f"{largura}px sem rolagem lateral")
            checa(not erros, f"{largura}px sem erro de JS", "; ".join(erros))
            quebradas = pg.evaluate("[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src)")
            checa(not quebradas, f"{largura}px imagens carregam", ",".join(quebradas))
            if largura == 375:
                pg.screenshot(path=str(saida / "375-topo.png"))
            pg.evaluate("document.getElementById('barra').style.display='none'")
            pg.screenshot(path=str(saida / f"{largura}-pagina.png"), full_page=True)
            if largura == 375:
                texto = pg.evaluate("document.body.innerText")
                livre = pg.evaluate("(()=>{const c=document.body.cloneNode(true);c.querySelectorAll('blockquote,svg,script,style').forEach(x=>x.remove());return c.innerText})()")
                checa("FONTE OMISSA" not in texto, "sem [FONTE OMISSA] na página")
                checa(not PROIBIDOS.search(livre), "sem travessão, ponto e vírgula ou emoji (fora das falas do lead)")
                antes_preco = pg.evaluate("(()=>{const s=document.getElementById('investimento');let t='';"
                                          "for(const el of document.querySelectorAll('.capa,[data-sec]')){if(el===s)break;t+=el.innerText}return t})()")
                checa("R$" not in antes_preco, "nenhum valor antes da seção 04 · Investimento")
                checa(not re.search(r"retorno d[oa] investimento|payback|se paga", texto.lower()), "sem promessa de retorno do investimento")
                blocos = pg.evaluate("[...document.querySelectorAll('[data-sec]')].map(s=>s.id)")
                checa(blocos[:4] == ["s1", "s2", "s3", "investimento"], "ordem: resumo, plano, percurso, investimento", ",".join(blocos))
                gar = pg.locator(".gar").count()
                ordem = pg.evaluate("(()=>{const p=document.querySelector('.price3'),g=document.querySelector('.gar');"
                                    "return !g||(p.compareDocumentPosition(g)&Node.DOCUMENT_POSITION_FOLLOWING)>0})()")
                checa(ordem, "garantia logo depois do preço" if gar else "garantia ausente (oferta sem garantia)")
            pg.close()

        pg = b.new_page(viewport={"width": 375, "height": 812})
        pg.goto(pagina)
        botoes = pg.locator(".js-comecar")
        hrefs = {botoes.nth(i).get_attribute("href") for i in range(botoes.count())}
        textos = {botoes.nth(i).inner_text().strip() for i in range(botoes.count())}
        checa(botoes.count() >= 3 and textos == {"Vamos começar"}, "um só botão 'Vamos começar' (capa lateral, barra e aceite)", f"{botoes.count()}")
        checa(len(hrefs) == 1 and next(iter(hrefs), "").startswith("https://"), "todos os botões levam ao mesmo link (pagamento ou WhatsApp)", ",".join(map(str, hrefs)))
        cfg = pg.evaluate("window.PROPOSTA")
        m = re.search(r"Emitida em\s+(\d\d)/(\d\d)/(\d{4})", pg.inner_text("body"), re.I)
        emitida = date(int(m.group(3)), int(m.group(2)), int(m.group(1))) if m else None
        dias = (date.fromisoformat(cfg["valida_ate"][:10]) - emitida).days if emitida else -1
        checa(dias == 3, "validade sempre de 3 dias", f"{dias} dias, até {cfg['valida_ate']}")
        pg.close()

        # relógio depois do prazo: a proposta vence; no último dia ainda vale
        pg = b.new_page(viewport={"width": 375, "height": 812})
        pg.clock.install(time="2035-01-01T12:00:00-03:00")
        pg.goto(pagina)
        pg.wait_for_timeout(400)
        checa(pg.evaluate("document.body.classList.contains('vencida')"), "proposta vence sozinha depois da validade")
        checa(pg.locator(".js-comecar").first.inner_text().strip() in ("Pedir uma nova proposta", "Proposta vencida"),
              "botão muda depois de vencida")
        pg.close()
        pg = b.new_page(viewport={"width": 375, "height": 812})
        pg.clock.install(time=cfg["valida_ate"][:10] + "T10:00:00-03:00")
        pg.goto(pagina)
        pg.wait_for_timeout(400)
        checa(not pg.evaluate("document.body.classList.contains('vencida')"), "no último dia a proposta ainda vale")
        pg.close()
        b.close()

    print("\nFALHAS: " + ", ".join(falhas) if falhas else "\nTudo certo.")
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
