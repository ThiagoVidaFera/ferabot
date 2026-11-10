"""Monta a galeria (HTML) de slides 1 gerados pela skill galeria-de-artes.

Uso (um perfil, o caso comum):
  python galeria.py --lote galeria-de-artes-2026-11-07 --out output/galeria-de-artes-2026-11-07/GALERIA.html

Vários perfis (quem atende mais de uma marca): repetir --conta "Nome=pasta".

Cada perfil deve ter <pasta>/<lote>/NN-<modelo>/slide1.png (+ NOTA.md com "Nota: 7,5").
Sem --conta, usa "Meu perfil=output". Modo anúncio: --arquivo arte.png --proporcao 4/5 (feed 1080x1350).
Ordena os modelos pela nota média entre os perfis. Rodar da raiz do FeraBot.
"""
import argparse
import glob
import html
import os
import re
import statistics as st
import sys
from pathlib import Path

# 1º a linha canônica "Nota: X" (com ou sem **); só depois os padrões frouxos.
# O frouxo exige "nota" como palavra inteira: "anotação" e "app Notas" pegavam o número errado (06/11).
PADROES_NOTA = [
    r"(?im)^\W*nota\W*:\W*(\d{1,2}(?:[,.]\d)?)",
    r"(?i)\bnota\b[^0-9\n]{0,40}?(\d{1,2}(?:[,.]\d)?)",
    r"(\d{1,2}(?:[,.]\d)?)\s*/\s*10",
]


def ler_nota(caminho):
    try:
        texto = open(caminho, encoding="utf-8").read()
    except OSError:
        return None
    for padrao in PADROES_NOTA:
        for m in re.finditer(padrao, texto):
            valor = float(m.group(1).replace(",", "."))
            if 0 < valor <= 10:
                return valor
    return None


def fmt(valor):
    return ("%.1f" % valor).replace(".", ",") if valor else "–"


def coletar(contas, lote, arquivo):
    dados, nomes = {}, {}
    for nome_conta, base in contas:
        for pasta in sorted(glob.glob(f"{base}/{lote}/[0-9][0-9]-*")):
            png = os.path.join(pasta, arquivo)
            if not os.path.exists(png):
                continue
            nn = os.path.basename(pasta)[:2]
            nomes.setdefault(nn, os.path.basename(pasta)[3:])
            dados.setdefault(nn, {})[nome_conta] = (png, ler_nota(os.path.join(pasta, "NOTA.md")))
    return dados, nomes


def media(itens):
    notas = [n for _, n in itens.values() if n]
    return st.mean(notas) if notas else 0


CSS = """body{font:14px system-ui;margin:0;padding:20px 16px;background:#F8F8F6;color:#1B1B1B}
h1{color:#2B2B2B;margin:0 0 4px}p{margin:0 0 16px;color:#555}.w{overflow-x:auto}table{border-collapse:collapse}
th,td{border:1px solid #e2e2dd;padding:6px;vertical-align:top;text-align:center;background:#fff}
thead th{position:sticky;top:0;background:#2B2B2B;color:#fff}tbody th{text-align:left;min-width:170px}
em{display:block;font-style:normal;font-size:22px;color:#2B2B2B;font-weight:700}
img{width:170px;aspect-ratio:var(--ar);object-fit:cover;display:block}td span{display:block;font-weight:700;margin-top:4px}"""


def montar(contas, dados, nomes, saida, titulo, proporcao):
    ranking = sorted(dados, key=lambda nn: -media(dados[nn]))
    linhas = []
    for pos, nn in enumerate(ranking, 1):
        celulas = []
        for nome_conta, _ in contas:
            if nome_conta not in dados[nn]:
                celulas.append("<td>–</td>")
                continue
            png, nota = dados[nn][nome_conta]
            rel = os.path.relpath(png, saida.parent).replace(os.sep, "/")
            celulas.append(f'<td><a href="{rel}"><img loading="lazy" src="{rel}"></a><span>{fmt(nota)}</span></td>')
        linhas.append(f'<tr><th><b>{pos}º</b> {nn} {html.escape(nomes[nn])}<em>{fmt(media(dados[nn]))}</em></th>{"".join(celulas)}</tr>')
    cab = "".join(f"<th>{html.escape(c)}</th>" for c, _ in contas)
    saida.write_text(
        f'<!doctype html><meta charset="utf-8"><title>{html.escape(titulo)}</title><style>:root{{--ar:{proporcao}}}{CSS}</style>'
        f'<h1>{html.escape(titulo)}</h1><p>Ordenado pela nota média (autoavaliação de cada NOTA.md). Clique para abrir.</p>'
        f'<div class="w"><table><thead><tr><th>Modelo · média</th>{cab}</tr></thead><tbody>{"".join(linhas)}</tbody></table></div>',
        encoding="utf-8",
    )
    return ranking


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lote", required=True, help="nome da subpasta do lote em cada conta")
    ap.add_argument("--conta", action="append", default=[], help='"Nome=pasta/base" (repetir; padrão: Meu perfil=output)')
    ap.add_argument("--out", required=True)
    ap.add_argument("--titulo", default="Galeria de artes")
    ap.add_argument("--arquivo", default="slide1.png", help="PNG dentro de cada NN-modelo/ (anúncio: arte.png)")
    ap.add_argument("--proporcao", default="3/4", help="proporção da miniatura (anúncio feed: 4/5)")
    a = ap.parse_args()
    contas = []
    for item in a.conta or ["Meu perfil=output"]:
        if "=" not in item:
            sys.exit(f"--conta inválido (use Nome=pasta): {item}")
        nome, base = item.split("=", 1)
        contas.append((nome.strip(), base.strip()))
    if not re.fullmatch(r"\d+/\d+", a.proporcao):
        sys.exit(f"--proporcao inválida (use L/A, ex.: 4/5): {a.proporcao}")
    dados, nomes = coletar(contas, a.lote, a.arquivo)
    if not dados:
        sys.exit(f"Nenhum {a.arquivo} encontrado. Confira --lote, --conta e --arquivo.")
    saida = Path(a.out)
    saida.parent.mkdir(parents=True, exist_ok=True)
    ranking = montar(contas, dados, nomes, saida, a.titulo, a.proporcao)
    faltando = [(nn, c) for nn in dados for c, _ in contas if c not in dados[nn]]
    sem_nota = [(nn, c) for nn in dados for c, (_, n) in dados[nn].items() if n is None]
    for pos, nn in enumerate(ranking, 1):
        print(f"{pos:2} {nn} {nomes[nn][:30]:30} {media(dados[nn]):.2f}")
    print("faltando:", faltando or "nada")
    print("sem nota:", sem_nota or "nada")
    print("galeria:", saida.resolve())


if __name__ == "__main__":
    main()
