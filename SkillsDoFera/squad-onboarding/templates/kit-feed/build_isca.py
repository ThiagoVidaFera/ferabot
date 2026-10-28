"""Gera o PDF da isca digital (A4) a partir do `isca` do feed.json.

A isca é o que a pessoa recebe ao comentar a keyword ou entrar no grupo. O carrossel, a página do
grupo e a resposta da keyword PROMETEM esse material — por isso ele faz parte do kit, não é
opcional: sem PDF, a resposta da keyword sai com um link vazio.

Mesmo visual do kit (tokens da marca, Inter pesada, zona de respiro), peça de documento:
capa → como usar → as situações (3 por página, cada uma com onde procurar / como calcular /
mensagem pronta) → a conta (tabela pra preencher) → priorizar e rotina → exemplo → próximo passo.

Uso: python -I build_isca.py <pasta-do-run>
Saída: <run>/kit-feed-inicial/isca/<arquivo>.pdf  (+ _qa/pgNN.png pra conferência visual)
"""
import base64
import json
import pathlib
import re
import sys

from playwright.sync_api import sync_playwright

for _f in (sys.stdout, sys.stderr):
    try:
        _f.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

raiz = pathlib.Path(sys.argv[1]).resolve()
dados = json.loads((raiz / "feed.json").read_text(encoding="utf-8"))
isca = dados["isca"]
m = dados["marca"]

ACENTO = m.get("acento", "#17365D")
ESCURO = m.get("escuro", "#0E1116")
CLARO = m.get("claro", "#F4F1EA")
CLARO2 = m.get("claro2", "#E6E2D7")
NOME, PAPEL = m.get("nome", ""), m.get("papel", "")


def datauri(rel):
    caminho = raiz / rel
    if not rel or not caminho.exists():
        return ""
    mime = "image/png" if caminho.suffix.lower() == ".png" else "image/jpeg"
    return f"data:{mime};base64," + base64.b64encode(caminho.read_bytes()).decode()


FOTO = datauri((m.get("fotos") or {}).get(isca.get("foto_capa", "escritorio"), m.get("avatar", "")))
AVATAR = datauri(m.get("avatar", ""))


def realce(t):
    """**palavra** vira destaque colorido — mesma convenção do resto do kit."""
    t = (t or "").replace("&", "&amp;").replace("<", "&lt;")
    return re.sub(r"\*\*(.+?)\*\*", r"<em>\1</em>", t).replace("\n", "<br>")


CSS = f"""
@page{{size:A4;margin:0}}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{font-family:Inter,sans-serif;-webkit-font-smoothing:antialiased;color:#14171C}}
.pg{{width:210mm;height:297mm;position:relative;overflow:hidden;page-break-after:always;
  padding:20mm 18mm 22mm;display:flex;flex-direction:column;gap:6mm}}
.pg:last-child{{page-break-after:auto}}
.cla{{background:{CLARO}}} .esc{{background:{ESCURO};color:#fff}} .ace{{background:{ACENTO};color:#fff}}
em{{font-style:normal;color:{ACENTO}}} .esc em,.ace em{{color:#8FC0F0}}
.eb{{font-size:3.3mm;font-weight:800;letter-spacing:.17em;text-transform:uppercase;color:{ACENTO}}}
.esc .eb,.ace .eb{{color:#8FC0F0}}
h1{{font-size:15mm;line-height:1.02;letter-spacing:-.035em;font-weight:900}}
h2{{font-size:9.4mm;line-height:1.06;letter-spacing:-.03em;font-weight:900}}
h3{{font-size:5mm;line-height:1.16;letter-spacing:-.02em;font-weight:800}}
p,li{{font-size:3.8mm;line-height:1.5;font-weight:500;color:#3C424B}}
.esc p,.esc li,.ace p{{color:#D5DCE6}}
.rod{{position:absolute;left:18mm;right:18mm;bottom:9mm;display:flex;justify-content:space-between;
  font-size:2.9mm;font-weight:700;color:#7B828C;letter-spacing:.02em}}
.esc .rod{{color:#8A93A0}}
.card{{background:#fff;border-radius:3.4mm;padding:5mm 6mm;border:.3mm solid {CLARO2}}}
.esc .card{{background:#191D24;border-color:#262C35}}
.marca b{{display:block;font-size:4.4mm;font-weight:900}}
.marca span{{display:block;font-size:2.8mm;font-weight:800;letter-spacing:.22em;opacity:.6;text-transform:uppercase}}
.tag{{display:inline-block;font-size:2.7mm;font-weight:800;letter-spacing:.12em;text-transform:uppercase;
  color:{ACENTO};margin-bottom:1.2mm}}
.msg{{background:{CLARO};border-left:1.4mm solid {ACENTO};border-radius:0 2.4mm 2.4mm 0;
  padding:3mm 4mm;font-size:3.6mm;line-height:1.45;font-weight:600;color:#14171C}}
.sit{{display:grid;grid-template-columns:13mm minmax(0,1fr);gap:4mm}}
.sit>b{{width:13mm;height:13mm;border-radius:50%;background:{ACENTO};color:#fff;display:flex;
  align-items:center;justify-content:center;font-size:6.6mm;font-weight:900}}
.sit h3{{margin-bottom:2.2mm}}
.sit .lin{{margin-bottom:2.2mm}} .sit .lin p{{font-size:3.5mm;line-height:1.42}}
table{{width:100%;border-collapse:collapse}}
th{{font-size:2.9mm;letter-spacing:.1em;text-transform:uppercase;text-align:left;color:#6B727C;
  padding:2.6mm 3mm;border-bottom:.5mm solid #14171C}}
td{{font-size:3.7mm;font-weight:600;padding:3mm;border-bottom:.3mm dashed #BFC3C9;vertical-align:middle}}
td.v{{width:30mm;color:#9AA0A8}}
tr.tot td{{font-weight:900;border-bottom:.5mm solid #14171C;font-size:4.2mm}}
.passo{{display:grid;grid-template-columns:11mm minmax(0,1fr);gap:4mm;align-items:start}}
.passo>b{{width:11mm;height:11mm;border-radius:50%;background:{ACENTO};color:#fff;display:flex;
  align-items:center;justify-content:center;font-size:5.6mm;font-weight:900}}
.campo{{display:flex;gap:3mm;align-items:baseline;font-size:3.8mm;font-weight:700;margin-top:2.4mm}}
.campo i{{flex:1;border-bottom:.3mm solid #14171C;height:5.2mm;display:block}}
.hipo{{display:inline-block;background:#F4C443;color:#14171C;font-size:2.7mm;font-weight:900;
  letter-spacing:.08em;text-transform:uppercase;padding:1.1mm 2.6mm;border-radius:1.4mm}}
.pill{{background:#fff;color:#14171C;border-radius:99mm;padding:5mm 9mm;font-size:8.6mm;font-weight:900;
  letter-spacing:-.02em;align-self:flex-start}}
.pill b{{color:{ACENTO}}}
"""


def pagina(classe, corpo, n, total, sem_rodape=False):
    rodape = "" if sem_rodape else f'<div class="rod"><span>{NOME} · {PAPEL}</span><span>{n} / {total}</span></div>'
    return f'<section class="pg {classe}">{corpo}{rodape}</section>'


def build():
    paginas = []

    # 1 · capa
    paginas.append(("esc", f"""
<div style="position:absolute;inset:0">
  <img src="{FOTO}" style="position:absolute;right:0;top:0;width:100%;height:62%;object-fit:cover;object-position:center 16%">
  <div style="position:absolute;right:0;top:0;width:100%;height:62%;
    background:linear-gradient(180deg,{ESCURO}B0 0%,{ESCURO}00 28%,{ESCURO}40 66%,{ESCURO} 99%)"></div>
</div>
<div class="marca" style="position:relative;z-index:2"><span>{PAPEL}</span><b>{NOME}</b></div>
<div style="margin-top:auto;position:relative;z-index:2;display:flex;flex-direction:column;gap:6mm">
  <div class="eb">{realce(isca.get('selo', 'Material gratuito'))}</div>
  <h1>{realce(isca['titulo'])}</h1>
  <p style="font-size:4.8mm;max-width:150mm">{realce(isca['subtitulo'])}</p>
</div>""", True))

    # 2 · como usar + separar
    sep = isca["separar"]
    paginas.append(("cla", f"""
<div class="eb">{realce(isca.get('eyebrow_uso', 'Antes de começar'))}</div>
<h2>{realce(isca['intro_titulo'])}</h2>
<p style="font-size:4.2mm">{realce(isca['intro'])}</p>
<div class="card" style="margin-top:2mm">
  <div class="tag">Leva 20 minutos</div>
  <p>{realce(isca['como_usar'])}</p>
</div>
<div class="eb" style="margin-top:5mm">{realce(sep['eyebrow'])}</div>
<h2 style="font-size:7.6mm">{realce(sep['titulo'])}</h2>
<p>{realce(sep['texto'])}</p>
<div style="display:grid;gap:3mm">
{''.join(f'<div class="card" style="padding:3.6mm 5mm"><h3 style="font-size:4.3mm">{realce(i["titulo"])}</h3><p style="font-size:3.5mm;line-height:1.4">{realce(i["texto"])}</p></div>' for i in sep['itens'])}
</div>""", False))

    # 3-5 · as situações, 3 por página
    sits = isca["situacoes"]
    for p in range(0, len(sits), 3):
        bloco = sits[p:p + 3]
        cards = ""
        for k, s in enumerate(bloco, p + 1):
            cards += f"""
<div class="card sit">
  <b>{k}</b>
  <div>
    <h3>{realce(s['titulo'])}</h3>
    <div class="lin"><div class="tag">Onde procurar</div><p>{realce(s['onde'])}</p></div>
    <div class="lin"><div class="tag">Como calcular o valor</div><p>{realce(s['calculo'])}</p></div>
    <div class="lin" style="margin-bottom:0"><div class="tag">Mensagem pronta</div><div class="msg">{realce(s['mensagem'])}</div></div>
  </div>
</div>"""
        paginas.append(("cla", f"""
<div class="eb">{realce(isca.get('eyebrow_situacoes', 'As 9 situações'))} · {p + 1} a {p + len(bloco)}</div>
<div style="display:grid;gap:5mm">{cards}</div>""", False))

    # 6 · a conta
    c = isca["conta"]
    # Tabela configurável por cliente (padrão = quantas × valor).
    cols = c.get("colunas", ["Quantas", "Valor"])
    cel = c.get("celulas", ["____ un.", "R$ ________"])
    tot_rot = c.get("total", "Total parado")
    tot_cel = c.get("total_celula", "R$ ________")
    campos = c.get("campos", ["Meta de faturamento do trimestre: R$<i></i>",
                              'Total parado ÷ meta = <i style="max-width:30mm"></i> %'])
    campos_html = "".join(f'<div class="campo">{x}</div>' for x in campos)
    linhas = "".join(
        f'<tr><td style="width:10mm;color:{ACENTO};font-weight:900">{i}</td><td>{realce(s["curto"])}</td>'
        f'<td class="v">{cel[0]}</td><td class="v">{cel[1]}</td></tr>'
        for i, s in enumerate(sits, 1))
    paginas.append(("cla", f"""
<div class="eb">{realce(c['eyebrow'])}</div>
<h2>{realce(c['titulo'])}</h2>
<p>{realce(c['texto'])}</p>
<div class="card" style="padding:2mm 3mm">
<table>
  <tr><th></th><th>Situação</th><th>{cols[0]}</th><th>{cols[1]}</th></tr>
  {linhas}
  <tr class="tot"><td></td><td>{tot_rot}</td><td class="v"></td><td class="v">{tot_cel}</td></tr>
</table></div>
<div class="card" style="display:grid;gap:1mm">{campos_html}</div>
<p style="font-size:3.5mm">{realce(c['leitura'])}</p>""", False))

    # 7 · priorizar + rotina
    pr, ro = isca["priorizar"], isca["rotina"]
    paginas.append(("esc", f"""
<div class="eb">{realce(pr['eyebrow'])}</div>
<h2>{realce(pr['titulo'])}</h2>
<p>{realce(pr['texto'])}</p>
<div style="display:grid;gap:3.4mm">
{''.join(f'<div class="card passo"><b>{i}</b><div><h3 style="font-size:4.4mm">{realce(x["titulo"])}</h3><p style="font-size:3.5mm">{realce(x["texto"])}</p></div></div>' for i, x in enumerate(pr['itens'], 1))}
</div>
<div class="eb" style="margin-top:6mm">{realce(ro['eyebrow'])}</div>
<h2 style="font-size:7.6mm">{realce(ro['titulo'])}</h2>
<p>{realce(ro['texto'])}</p>
<div class="card" style="background:#fff;color:#14171C">
  <div class="campo" style="margin-top:0;color:#14171C">Quem faz (nome e sobrenome): <i></i></div>
  <div class="campo" style="color:#14171C">Dia e horário fixos: <i></i></div>
  <div class="campo" style="color:#14171C">Regra: {realce(ro['regra'])}</div>
</div>""", False))

    # 8 · exemplo
    ex = isca["exemplo"]
    ck = isca.get("checklist")
    checklist_html = ""
    if ck:
        itens = "".join(f'<div class="campo" style="margin-top:0;align-items:flex-start">'
                        f'<span style="font-size:5mm;line-height:1">☐</span><span>{realce(i)}</span></div>'
                        for i in ck["itens"])
        checklist_html = (f'<div class="eb" style="margin-top:4mm">{realce(ck["eyebrow"])}</div>'
                          f'<h2 style="font-size:7mm">{realce(ck["titulo"])}</h2>'
                          f'<div class="card" style="display:grid;gap:3mm">{itens}</div>')
    paginas.append(("cla", f"""
<span class="hipo">{realce(ex['selo'])}</span>
<h2>{realce(ex['titulo'])}</h2>
<p>{realce(ex['texto'])}</p>
<div class="card" style="display:grid;gap:3mm">
{''.join(f'<div><div class="tag">{realce(l["rotulo"])}</div><p style="color:#14171C;font-weight:600">{realce(l["texto"])}</p></div>' for l in ex['linhas'])}
</div>
<p style="font-size:3.4mm;color:#6B727C">{realce(ex['aviso'])}</p>
{checklist_html}""", False))

    # 9 · próximo passo
    f = isca["fecho"]
    paginas.append(("ace", f"""
<div class="marca" style="color:#fff"><span>{PAPEL}</span><b>{NOME}</b></div>
<div style="margin-top:auto;display:flex;flex-direction:column;gap:6mm">
  <h1 style="font-size:13mm">{realce(f['titulo'])}</h1>
  <p style="font-size:4.6mm;max-width:155mm">{realce(f['texto'])}</p>
  <div class="pill">{realce(f['prefixo'])} <b>{realce(f['keyword'])}</b></div>
  <p style="font-size:4mm;max-width:150mm">{realce(f['onde'])}</p>
  <div style="display:flex;align-items:center;gap:4mm;margin-top:4mm">
    <img src="{AVATAR}" style="width:15mm;height:15mm;border-radius:50%;object-fit:cover;border:.8mm solid #fff">
    <p style="color:#fff;font-size:3.8mm"><b>{NOME}</b><br>{PAPEL}</p>
  </div>
</div>""", True))

    total = len(paginas)
    html = "".join(pagina(cls, corpo, i, total, sem) for i, (cls, corpo, sem) in enumerate(paginas, 1))
    return (f'<html><head><meta charset="utf-8"><link rel="stylesheet" '
            f'href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800;900&display=swap">'
            f'<style>{CSS}</style></head><body>{html}</body></html>'), total


def main():
    html, total = build()
    destino = raiz / "kit-feed-inicial" / "isca"
    qa = destino / "_qa"
    qa.mkdir(parents=True, exist_ok=True)
    pdf = destino / f"{isca['arquivo']}.pdf"

    with sync_playwright() as pw:
        nav = pw.chromium.launch()
        pg = nav.new_page(viewport={"width": 794, "height": 1123})
        pg.set_content(html, wait_until="networkidle")
        pg.evaluate("document.fonts.ready")
        pg.wait_for_timeout(500)

        # Conteúdo que passa da página é cortado em silêncio pelo overflow:hidden — o gate pega.
        estouro = pg.evaluate("""() => [...document.querySelectorAll('.pg')].map((el, i) => {
            const rod = el.querySelector('.rod');
            const limite = rod ? rod.getBoundingClientRect().top - el.getBoundingClientRect().top : el.clientHeight;
            // decoração em position:absolute (foto de fundo, marca d'água) não é conteúdo: não entra na medida
            const filhos = [...el.children].filter(c => !c.classList.contains('rod')
                && getComputedStyle(c).position !== 'absolute');
            const base = Math.max(...filhos.map(c => c.getBoundingClientRect().bottom - el.getBoundingClientRect().top));
            return {pagina: i + 1, folga: Math.round(limite - base)};
        })""")
        ruins = [e for e in estouro if e["folga"] < 4]

        pg.pdf(path=str(pdf), format="A4", print_background=True, prefer_css_page_size=True)
        for i, el in enumerate(pg.query_selector_all(".pg"), 1):
            el.screenshot(path=str(qa / f"pg{i:02d}.png"))
        nav.close()

    print(f"{total} páginas → {pdf}")
    print("folga mínima por página (mm≈px/3.78):", " ".join(f"p{e['pagina']}={e['folga']}" for e in estouro))
    if ruins:
        print("ESTOURO / sem respiro em:", [e["pagina"] for e in ruins])
        return 1
    print("respiro OK em todas as páginas")
    return 0


if __name__ == "__main__":
    sys.exit(main())
