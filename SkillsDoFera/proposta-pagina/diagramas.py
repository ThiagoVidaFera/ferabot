"""Diagramas SVG animados das entregas. O texto é SVG (nunca vem de gerador de imagem por IA).

Quatro moldes, todos 600x400, fundo escuro, loop de 7 s, parados com prefers-reduced-motion.
Cada função recebe só os textos. Texto curto: no celular o SVG encolhe para ~55%.
"""
from __future__ import annotations

from html import escape

_DEFS = ('<defs><marker id="{m}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" '
         'orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9" fill="none" stroke="#7A7166" stroke-width="2" '
         'stroke-linecap="round" stroke-linejoin="round"/></marker></defs>')


def _no(x: int, y: int, w: int, h: int, linhas: list[str], atraso: float, tam: int = 24) -> str:
    cx, cy, n = x + w / 2, y + h / 2, len(linhas)
    tspans = "".join(
        f'<tspan x="{cx}" y="{cy + (i - (n - 1) / 2) * (tam + 4) + tam * 0.35:.0f}">{escape(t)}</tspan>'
        for i, t in enumerate(linhas))
    return (f'<rect class="nd" style="--d:{atraso}s" x="{x}" y="{y}" width="{w}" height="{h}" rx="16"/>'
            f'<text text-anchor="middle" font-size="{tam}" fill="#fff">{tspans}</text>')


def _seta(x1: int, y1: int, x2: int, y2: int, m: str) -> str:
    return f'<path class="ar" d="M{x1} {y1} L{x2} {y2}" marker-end="url(#{m})"/>'


def _svg(rotulo: str, m: str, corpo: str) -> str:
    return (f'<svg viewBox="0 0 600 400" role="img" aria-label="{escape(rotulo)}">'
            + _DEFS.format(m=m) + corpo + "</svg>")


def fluxo_grade(id_: str, rotulo: str, nos: list[list[str]], legenda: str, azulejos: int = 12) -> str:
    """3 caixas em linha + seta para uma grade de azulejos que acendem (ex.: 12 posts)."""
    m = f"a{id_}"
    xs = (24, 218, 412)
    corpo = ""
    for i, linhas in enumerate(nos[:3]):
        corpo += _no(xs[i], 30, 164, 92, linhas, i)
        if i < 2:
            corpo += _seta(xs[i] + 166, 76, xs[i + 1] - 4, 76, m)
    corpo += _seta(300, 128, 300, 170, m)
    corpo += f'<text x="300" y="204" text-anchor="middle" font-size="22" class="mut">{escape(legenda)}</text>'
    for i in range(azulejos):
        x, y = 42 + (i % 6) * 88, 218 + (i // 6) * 66
        corpo += f'<rect class="tile" style="--d:{0.15 * i:.2f}s" x="{x}" y="{y}" width="76" height="56" rx="10"/>'
    return _svg(rotulo, m, corpo)


def barras_crescendo(id_: str, rotulo: str, titulo: str, destino: str, barras: int = 7) -> str:
    """Barras com ícone de play que crescem em sequência e levam a um destino (ex.: WhatsApp)."""
    m = f"a{id_}"
    passo = 35
    corpo = f'<text x="28" y="44" font-size="26">{escape(titulo)}</text>'
    pontos = []
    for i in range(barras):
        h = 70 + i * passo
        x, y = 28 + i * 56, 320 - h
        corpo += (f'<g class="bar" style="--d:{0.18 * i:.2f}s"><rect class="barfill" x="{x}" y="{y}" width="46" '
                  f'height="{h}" rx="8"/><path d="M{x + 17} {y + 12} l16 10 l-16 10 z" fill="#fff"/></g>')
        corpo += f'<text x="{x + 23}" y="354" text-anchor="middle" font-size="22" class="mut">{i + 1}</text>'
        pontos.append(f"{x + 23},{y - 12}")
    corpo += f'<polyline class="trend" points="{" ".join(pontos)}"/>'
    corpo += '<path class="ar" d="M420 100 C 440 100 446 120 466 120" marker-end="url(#%s)"/>' % m
    corpo += '<rect class="nd" style="--d:3s" x="466" y="82" width="120" height="76" rx="16"/>'
    corpo += f'<text x="526" y="128" text-anchor="middle" font-size="21" fill="#fff">{escape(destino)}</text>'
    return _svg(rotulo, m, corpo)


def fluxo_progresso(id_: str, rotulo: str, nos: list[list[str]], legenda: str, legenda_fim: str,
                    etapas: int = 8) -> str:
    """3 caixas em linha + barra de etapas que se enche (ex.: capítulos de um livro)."""
    m = f"a{id_}"
    xs = (24, 218, 412)
    corpo = ""
    for i, linhas in enumerate(nos[:3]):
        corpo += _no(xs[i], 44, 164, 112, linhas, i, 22 if i == 1 else 24)
        if i < 2:
            corpo += _seta(xs[i] + 166, 100, xs[i + 1] - 4, 100, m)
    corpo += f'<text x="300" y="232" text-anchor="middle" font-size="22" class="mut">{escape(legenda)}</text>'
    for i in range(etapas):
        corpo += f'<rect class="cap" style="--d:{0.3 * i:.1f}s" x="{41 + i * 66}" y="262" width="56" height="40" rx="8"/>'
    corpo += f'<text x="300" y="352" text-anchor="middle" font-size="22" class="mut">{escape(legenda_fim)}</text>'
    return _svg(rotulo, m, corpo)


def duas_pistas(id_: str, rotulo: str, pista_a: dict, pista_b: dict, rodape: str) -> str:
    """Pista A: caixa -> decisão -> caixa. Pista B: três caixas. Cada nó acende em sequência."""
    m = f"a{id_}"
    a, b = pista_a, pista_b
    corpo = f'<text x="24" y="30" font-size="21" class="mut">{escape(a["titulo"])}</text>'
    corpo += _no(24, 44, 160, 96, a["inicio"], 0, 21) + _seta(186, 92, 204, 92, m)
    corpo += '<polygon class="nd dm" style="--d:1s" points="300,40 392,92 300,144 208,92"/>'
    linhas = a["decisao"]
    corpo += f'<text x="300" y="88" text-anchor="middle" font-size="20" fill="#fff">{escape(linhas[0])}</text>'
    corpo += f'<text x="300" y="112" text-anchor="middle" font-size="20" fill="#fff">{escape(linhas[1])}</text>'
    corpo += _seta(394, 92, 412, 92, m) + _no(416, 44, 160, 96, a["fim"], 2, 21)
    corpo += f'<text x="300" y="172" text-anchor="middle" font-size="19" class="mut">{escape(a["senao"])}</text>'
    corpo += f'<text x="24" y="226" font-size="21" class="mut">{escape(b["titulo"])}</text>'
    corpo += _no(24, 240, 160, 96, b["nos"][0], 3, 21) + _seta(186, 288, 204, 288, m)
    corpo += _no(208, 240, 184, 96, b["nos"][1], 4, 21) + _seta(394, 288, 412, 288, m)
    corpo += _no(416, 240, 160, 96, b["nos"][2], 5, 21)
    corpo += f'<text x="300" y="378" text-anchor="middle" font-size="21" class="mut">{escape(rodape)}</text>'
    return _svg(rotulo, m, corpo)


def montar(id_: str, d: dict) -> str:
    """Escolhe o molde pelo campo `tipo` do JSON da proposta."""
    tipo = d["tipo"]
    if tipo == "fluxo_grade":
        return fluxo_grade(id_, d["rotulo"], d["nos"], d["legenda"], d.get("azulejos", 12))
    if tipo == "barras":
        return barras_crescendo(id_, d["rotulo"], d["titulo"], d["destino"], d.get("barras", 7))
    if tipo == "fluxo_progresso":
        return fluxo_progresso(id_, d["rotulo"], d["nos"], d["legenda"], d["legenda_fim"], d.get("etapas", 8))
    if tipo == "duas_pistas":
        return duas_pistas(id_, d["rotulo"], d["pista_a"], d["pista_b"], d["rodape"])
    raise ValueError(f"diagrama de tipo desconhecido: {tipo}")


def diagrama_padrao(titulo: str, n_itens: int) -> dict:
    """Diagrama usado quando a entrega não traz um próprio: ponto de partida, a entrega e uma grade que acende."""
    import textwrap
    todas = textwrap.wrap(titulo, 13) or [titulo[:13]]
    linhas = todas[:2]
    if len(todas) > 2:
        linhas[1] = linhas[1][:12].rstrip() + "…"
    return {
        "tipo": "fluxo_grade",
        "rotulo": f"Diagrama: do seu ponto de partida até a entrega {titulo}",
        "nos": [["Seu ponto", "de partida"], linhas, ["Entrega", "pronta"]],
        "legenda": f"{n_itens} partes entregues" if n_itens != 1 else "1 parte entregue",
        "azulejos": min(max(n_itens, 3), 12),
    }
