"""Motor do Kit de Feed Inicial — carrosséis e estáticos 1080x1440 a partir de um JSON.

No padrão FERA de carrossel (PAS -> Prova -> Oferta -> Filtro -> CTA), com os tokens de cor e a foto trocados por cliente. O conteúdo é DADO (`feed.json`), não
código: o mesmo motor serve qualquer cliente do onboarding.

Zona morta de 250px no topo e na base é checada no render e reprova a peça.

Uso:
    python -I build_feed.py <pasta-do-run>
    # lê <pasta>/feed.json e escreve <pasta>/kit-feed-inicial/**/png/NN.png
"""
import base64
import json
import pathlib
import sys

from playwright.sync_api import sync_playwright

for _f in (sys.stdout, sys.stderr):
    try:
        _f.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

LARGURA, ALTURA, ZONA = 1080, 1440, 250


def datauri(caminho: pathlib.Path):
    if not caminho or not caminho.exists():
        return ""
    mime = "image/png" if caminho.suffix.lower() == ".png" else "image/jpeg"
    return f"data:{mime};base64," + base64.b64encode(caminho.read_bytes()).decode()


class Motor:
    def __init__(self, raiz: pathlib.Path, dados: dict):
        self.raiz = raiz
        self.d = dados
        m = dados["marca"]
        self.ACENTO = m.get("acento", "#17365D")
        self.ACENTO2 = m.get("acento2", "#0B2038")
        self.ESCURO = m.get("escuro", "#0E1116")
        self.CLARO = m.get("claro", "#F4F1EA")
        self.CLARO2 = m.get("claro2", "#E6E2D7")
        self.NOME = m.get("nome", "")
        self.PAPEL = m.get("papel", "")
        self.AVATAR = datauri(raiz / m["avatar"]) if m.get("avatar") else ""
        self.FOTOS = {k: datauri(raiz / v) for k, v in (m.get("fotos") or {}).items()}

    # ---------------------------------------------------------------- base
    @property
    def css(self):
        return f"""
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:{LARGURA}px;height:{ALTURA}px;font-family:Inter,sans-serif;-webkit-font-smoothing:antialiased}}
.s{{width:{LARGURA}px;height:{ALTURA}px;position:relative;overflow:hidden}}
.safe{{position:absolute;top:{ZONA + 10}px;bottom:{ZONA + 10}px;left:84px;right:84px;
  display:flex;flex-direction:column;justify-content:center;gap:32px}}
.esc{{background:{self.ESCURO};color:#fff}}
.cla{{background:{self.CLARO};color:#14171C}}
.ace{{background:{self.ACENTO};color:#fff}}
h1{{font-weight:900;letter-spacing:-.035em;line-height:1.02;font-size:86px}}
h2{{font-weight:900;letter-spacing:-.03em;line-height:1.05;font-size:64px}}
h3{{font-weight:800;font-size:34px;line-height:1.15;letter-spacing:-.02em}}
p{{font-size:33px;line-height:1.38;font-weight:500}}
em{{font-style:normal;color:{self.ACENTO}}}
.esc em,.ace em{{color:#8FC0F0}}
.eb{{font-size:22px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:{self.ACENTO}}}
.esc .eb{{color:#8FC0F0}} .ace .eb{{color:#D7E6F6}}
.ponte{{font-size:27px;font-weight:700;padding-top:20px;border-top:2px solid {self.ACENTO}}}
.chip{{display:flex;align-items:center;gap:16px;font-size:24px}}
.av{{width:62px;height:62px;border-radius:50%;background-size:cover;background-position:50% 18%;
  border:3px solid {self.ACENTO};flex:none;background-color:#2a2a2a}}
.card{{border-radius:22px;padding:26px 30px;background:#fff}}
.esc .card{{background:#191D24}}
.marca{{font-size:26px;font-weight:900;letter-spacing:-.01em}}
.marca span{{display:block;font-size:17px;font-weight:800;letter-spacing:.22em;opacity:.62}}
"""

    def pagina(self, classe, corpo, extra=""):
        return (f'<html><head><meta charset="utf-8"><link rel="stylesheet" '
                f'href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&display=swap">'
                f'<style>{self.css}{extra}</style></head><body><div class="s {classe}">{corpo}</div></body></html>')

    def chip(self, escuro=True):
        cor = "#FFFFFF" if escuro else "#14171C"
        return (f'<div class="chip"><span class="av" style="background-image:url({self.AVATAR})"></span>'
                f'<span style="color:{cor}"><b>{self.NOME}</b> · {self.PAPEL}</span></div>')

    def marca(self, escuro=True):
        cor = "#FFFFFF" if escuro else "#14171C"
        return (f'<div class="marca" style="color:{cor}"><span>{self.PAPEL.upper()}</span>{self.NOME}</div>')

    def ponte(self, txt, escuro):
        cor = "#BDBDBD" if escuro else "#5A5A5A"
        return f'<div class="ponte" style="color:{cor}">{txt} <b style="color:{self.ACENTO if not escuro else "#8FC0F0"}">→</b></div>'

    def marca_dagua(self, escuro):
        cor = "#8FC0F0" if escuro else self.ACENTO
        return (f'<div style="position:absolute;right:-90px;bottom:-110px;width:620px;height:620px;'
                f'border:70px solid {cor};border-radius:50%;opacity:.07"></div>')

    # ---------------------------------------------------------------- blocos
    def bloco(self, s):
        t = s.get("tipo", "texto")
        return getattr(self, f"_{t}", self._texto)(s)

    def _capa(self, s):
        return self.pagina("esc", self.marca_dagua(True) + f"""
<div class="safe" style="gap:38px">
  {self.marca(True)}
  <h1>{s['titulo']}</h1>
  <div style="background:#191D24;border-left:8px solid {self.ACENTO};border-radius:14px;padding:26px 30px">
    <p style="font-size:31px;color:#E6EAF0">{s['contexto']}</p>
  </div>
  {self.chip(True)}
</div>""")

    def _capa_foto(self, s):
        """Capa com a foto do cliente na metade de cima e o texto embaixo.
        O rosto nunca é coberto: a faixa de texto começa onde a foto termina."""
        foto = self.FOTOS.get(s.get("foto", ""), self.AVATAR)
        return self.pagina("esc", f"""
<div style="position:absolute;inset:0">
  <img src="{foto}" style="position:absolute;top:0;left:0;width:100%;height:46%;object-fit:cover;
    object-position:center 16%">
  <div style="position:absolute;top:0;left:0;right:0;height:46%;
    background:linear-gradient(180deg,#0E1116CC 0%,#0E111600 26%,#0E111633 60%,{self.ESCURO} 99%)"></div>
</div>
<div class="safe" style="top:690px;bottom:255px;justify-content:flex-start;gap:26px">
  <h1 style="font-size:68px">{s['titulo']}</h1>
  <div style="background:#191D24;border-left:8px solid {self.ACENTO};border-radius:14px;padding:22px 26px">
    <p style="font-size:27px;color:#E6EAF0">{s['contexto']}</p>
  </div>
  {self.chip(True)}
</div>""")

    def _capa_coluna(self, s):
        """Capa em duas colunas: foto numa, texto na outra. Nada passa por cima do rosto."""
        foto = self.FOTOS.get(s.get("foto", ""), self.AVATAR)
        return self.pagina("cla", f"""
<img src="{foto}" style="position:absolute;right:0;top:0;width:46%;height:100%;object-fit:cover;
  object-position:center 18%">
<div class="safe" style="right:52%;gap:30px">
  {self.marca(False)}
  <h1 style="font-size:62px;color:#14171C">{s['titulo']}</h1>
  <div style="border-left:7px solid {self.ACENTO};padding-left:22px">
    <p style="font-size:27px;color:#3E444D">{s['contexto']}</p>
  </div>
</div>""")

    def _capa_clara(self, s):
        """Capa tipográfica em fundo claro — entra pra quebrar a sequência de capas escuras."""
        return self.pagina("cla", self.marca_dagua(False) + f"""
<div class="safe" style="gap:34px">
  {self.marca(False)}
  <h1 style="font-size:84px;color:#14171C">{s['titulo']}</h1>
  <div style="background:#fff;border-left:8px solid {self.ACENTO};border-radius:14px;padding:26px 30px">
    <p style="font-size:30px;color:#3E444D">{s['contexto']}</p>
  </div>
  {self.chip(False)}
</div>""")

    def _texto(self, s):
        esc = s.get("fundo") == "escuro"
        return self.pagina("esc" if esc else "cla", self.marca_dagua(esc) + f"""
<div class="safe">
  {f'<div class="eb">{s["eyebrow"]}</div>' if s.get("eyebrow") else ""}
  <h2>{s['titulo']}</h2>
  {f"<p>{s['corpo']}</p>" if s.get("corpo") else ""}
  {self.ponte(s["ponte"], esc) if s.get("ponte") else ""}
</div>""")

    def _passos(self, s):
        esc = s.get("fundo") == "escuro"
        itens = "".join(
            f'<div class="ps"><b>{i}</b><div><h3>{p["titulo"]}</h3><span>{p["texto"]}</span></div></div>'
            for i, p in enumerate(s["itens"], 1))
        return self.pagina("esc" if esc else "cla", self.marca_dagua(esc) + f"""
<div class="safe" style="gap:22px">
  {f'<div class="eb">{s["eyebrow"]}</div>' if s.get("eyebrow") else ""}
  <h2>{s['titulo']}</h2>
  <div style="display:flex;flex-direction:column;gap:16px">{itens}</div>
  {self.ponte(s["ponte"], esc) if s.get("ponte") else ""}
</div>""", f""".ps{{display:flex;gap:24px;align-items:flex-start;background:{"#191D24" if esc else "#fff"};
  border-radius:20px;padding:24px 28px}}
.ps>b{{width:58px;height:58px;border-radius:50%;background:{self.ACENTO};color:#fff;font-size:30px;
  font-weight:900;display:flex;align-items:center;justify-content:center;flex:none}}
.ps span{{display:block;font-size:27px;line-height:1.34;margin-top:8px;color:{"#AEB7C2" if esc else "#4A515B"}}}""")

    def _comparacao(self, s):
        esc = s.get("fundo") == "escuro"
        col = lambda lado, cor: (
            f'<div class="cmp" style="border-top:7px solid {cor}"><b style="color:{cor}">{lado["titulo"]}</b>'
            + "".join(f"<span>{x}</span>" for x in lado["itens"]) + "</div>")
        return self.pagina("esc" if esc else "cla", self.marca_dagua(esc) + f"""
<div class="safe" style="gap:26px">
  {f'<div class="eb">{s["eyebrow"]}</div>' if s.get("eyebrow") else ""}
  <h2>{s['titulo']}</h2>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:22px">
    {col(s['esquerda'], '#9AA3AE')}{col(s['direita'], self.ACENTO if not esc else '#8FC0F0')}
  </div>
  {self.ponte(s["ponte"], esc) if s.get("ponte") else ""}
</div>""", f""".cmp{{background:{"#191D24" if esc else "#fff"};border-radius:0 0 20px 20px;padding:26px 28px}}
.cmp b{{display:block;font-size:23px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;margin-bottom:18px}}
.cmp span{{display:block;font-size:28px;line-height:1.32;font-weight:600;padding:12px 0;
  border-bottom:2px dashed {"#2A313A" if esc else self.CLARO2}}}
.cmp span:last-child{{border:0}}""")

    def _apresentacao(self, s):
        foto = self.FOTOS.get(s.get("foto", ""), self.AVATAR)
        marcos = "".join(f'<div><b>{m["numero"]}</b><span>{m["rotulo"]}</span></div>' for m in s.get("marcos", []))
        return self.pagina("esc", f"""
<div style="position:absolute;inset:0"><img src="{foto}" style="position:absolute;right:0;top:0;
  width:58%;height:100%;object-fit:cover;object-position:center 18%;
  -webkit-mask-image:linear-gradient(265deg,#000 50%,transparent 94%)"></div>
<div class="safe" style="gap:28px;right:46%">
  <div class="eb">{s.get('eyebrow', 'Quem conduz')}</div>
  <h2 style="font-size:54px">{s['titulo']}</h2>
  <p style="font-size:29px;color:#C6CEDA">{s['corpo']}</p>
  <div class="mk">{marcos}</div>
</div>""", f""".mk{{display:grid;gap:14px}}
.mk div{{display:grid;grid-template-columns:210px minmax(0,1fr);align-items:baseline;gap:18px}}
.mk b{{font-size:46px;font-weight:900;letter-spacing:-.03em;color:#8FC0F0}}
.mk span{{font-size:25px;color:#AEB7C2;font-weight:600}}""")

    def _cta(self, s):
        return self.pagina("ace", self.marca_dagua(True) + f"""
<div class="safe" style="gap:30px">
  <h2 style="font-size:68px">{s['titulo']}</h2>
  <div class="pill">{s['prefixo']} <b>{s['keyword']}</b></div>
  <p style="font-size:31px;color:#EAF1F8">{s['explica']}</p>
  {f'<div class="filtro">{s["filtro"]}</div>' if s.get("filtro") else ""}
  {self.chip(True)}
</div>""", f""".pill{{background:#fff;color:#14171C;border-radius:999px;padding:24px 42px;font-size:50px;
  font-weight:900;letter-spacing:-.02em;align-self:flex-start;max-width:100%}}
.pill b{{color:{self.ACENTO}}}
.filtro{{background:{self.ACENTO2};border-radius:16px;padding:22px 26px;font-size:27px;line-height:1.34;color:#C9DAEC}}""")

    def _recibo(self, s):
        linhas = "".join(f'<div class="rc"><span>{l["rotulo"]}</span><p>{l["texto"]}</p></div>'
                         for l in s["linhas"])
        return self.pagina("cla", f"""
<div class="safe" style="gap:24px">
  {self.marca(False)}
  <div class="rb">{linhas}</div>
  <div style="font-size:27px;color:#3A4049"><b>{s.get('rodape', 'Salva pra lembrar.')}</b></div>
</div>""", f""".rb{{background:#fff;border-radius:24px;padding:12px 32px;border:2px solid {self.CLARO2}}}
.rc{{display:flex;gap:22px;padding:19px 0;border-bottom:2px dashed {self.CLARO2}}} .rc:last-child{{border:0}}
.rc span{{font-size:20px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:{self.ACENTO};
  width:176px;flex:none;padding-top:6px}}
.rc p{{font-size:27px;line-height:1.3;font-weight:600}}""")

    # ------------------------------------------------- estático (feed + anúncio)
    def _estatico(self, s):
        """Peça dupla: post de feed e criativo de anúncio. Mesma arte nos dois usos."""
        esc = s.get("fundo", "escuro") == "escuro"
        foto = self.FOTOS.get(s.get("foto", ""), "")
        bullets = "".join(f"<li>{b}</li>" for b in s.get("bullets", []))
        return self.pagina("esc" if esc else "cla", (
            f'<img src="{foto}" style="position:absolute;right:-4%;top:0;width:62%;height:54%;'
            f'object-fit:cover;object-position:center 16%;'
            f'-webkit-mask-image:linear-gradient(255deg,#000 52%,transparent 92%)">' if foto else ""
        ) + self.marca_dagua(esc) + f"""
<div class="safe" style="gap:24px;justify-content:flex-start;padding-top:{s.get('recuo', 300)}px">
  <div class="eb">{s.get('eyebrow', '')}</div>
  <h2 style="font-size:{s.get('tamanho', 62)}px;max-width:{s.get('largura', '78')}%">{s['titulo']}</h2>
  {f"<p style='color:{'#B6BFCA' if esc else '#4A515B'};max-width:84%'>{s['corpo']}</p>" if s.get("corpo") else ""}
  {f'<ul class="bl">{bullets}</ul>' if bullets else ""}
  <div style="margin-top:auto;display:flex;flex-direction:column;gap:22px">
    <div class="cta-l">{s['cta']}</div>
    {self.chip(esc)}
  </div>
</div>""", f""".bl{{list-style:none;display:flex;flex-direction:column;gap:12px}}
.bl li{{position:relative;padding-left:40px;font-size:30px;line-height:1.4;font-weight:700}}
.bl li:before{{content:"";position:absolute;left:0;top:.62em;width:24px;height:4px;
  background:{self.ACENTO if not esc else "#8FC0F0"}}}
.cta-l{{font-size:30px;font-weight:800;color:{self.ACENTO if not esc else "#8FC0F0"};line-height:1.3}}""")


    # ---------------------------------------------- capa de destaque
    def _capa_destaque(self, s):
        """1080×1920. O Instagram recorta a capa em CÍRCULO no centro, então todo o conteúdo
        fica numa área segura central e o resto é fundo chapado — serve de capa e de story."""
        escuro = s.get("fundo", "escuro") == "escuro"
        fundo = self.ESCURO if escuro else self.CLARO
        tinta = "#FFFFFF" if escuro else "#14171C"
        acento = "#8FC0F0" if escuro else self.ACENTO
        sub = s.get("sub", "")
        bloco_sub = f'<div class="sb">{sub}</div>' if sub else ""
        estilo = f"""*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1080px;height:1920px;font-family:Inter,sans-serif;background:{fundo};
  -webkit-font-smoothing:antialiased;position:relative}}
.aro{{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:910px;height:910px;
  border-radius:50%;border:3px dashed {acento};opacity:.22}}
.circ{{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:840px;height:840px;
  border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:48px;text-align:center;padding:96px}}
.ic{{width:206px;height:206px;border:15px solid {acento};border-radius:50%;display:flex;
  align-items:center;justify-content:center;font-size:96px;font-weight:900;color:{acento};
  letter-spacing:-.04em}}
.tx{{font-size:84px;font-weight:900;letter-spacing:-.04em;line-height:1.02;color:{tinta}}}
.sb{{font-size:32px;font-weight:700;color:{acento};letter-spacing:.14em;text-transform:uppercase;
  margin-top:24px}}"""
        corpo = (f'<div class="circ">'
                 f'<div class="ic">{s.get("icone", "")}</div>'
                 f'<div><div class="tx">{s["titulo"]}</div>{bloco_sub}</div></div>')
        return ('<html><head><meta charset="utf-8"><link rel="stylesheet" '
                'href="https://fonts.googleapis.com/css2?family=Inter:wght@700;800;900&display=swap">'
                f'<style>{estilo}</style></head><body>{corpo}</body></html>')


CHECA_ZONA = """() => {
  const ruins = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) {
    const n = w.currentNode; if (!n.textContent.trim()) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    for (const b of r.getClientRects()) {
      if (b.top < 250 || b.bottom > 1190 || b.left < 40 || b.right > 1040)
        ruins.push(n.textContent.trim().slice(0, 44));
    }
  }
  return [...new Set(ruins)];
}"""


def main():
    raiz = pathlib.Path(sys.argv[1]).resolve()
    dados = json.loads((raiz / "feed.json").read_text(encoding="utf-8"))
    motor = Motor(raiz, dados)
    destino = raiz / "kit-feed-inicial"
    falhas, total = {}, 0

    with sync_playwright() as pw:
        navegador = pw.chromium.launch()
        pagina = navegador.new_page(viewport={"width": LARGURA, "height": ALTURA})

        def render(html, caminho, rotulo):
            nonlocal total
            pagina.set_content(html, wait_until="networkidle")
            pagina.evaluate("document.fonts.ready")
            pagina.wait_for_timeout(260)
            if not rotulo.startswith("destaque/"):   # capa de destaque tem geometria própria
                ruins = pagina.evaluate(CHECA_ZONA)
                if ruins:
                    falhas[rotulo] = ruins
            caminho.parent.mkdir(parents=True, exist_ok=True)
            pagina.screenshot(path=str(caminho))
            total += 1

        for carrossel in dados.get("carrosseis", []):
            pasta = destino / carrossel["pasta"] / "png"
            for i, slide in enumerate(carrossel["slides"], 1):
                render(motor.bloco(slide), pasta / f"{i:02d}.png", f"{carrossel['pasta']}/{i:02d}")
            print(f"  {carrossel['pasta']}: {len(carrossel['slides'])} slides")

        for i, cap in enumerate(dados.get("capas_destaque", []), 1):
            nome = f"{i:02d}-{cap['slug']}.png"
            pagina.set_viewport_size({"width": 1080, "height": 1920})
            render(motor._capa_destaque(cap), destino / "destaques" / nome, f"destaque/{nome}")
        if dados.get("capas_destaque"):
            pagina.set_viewport_size({"width": LARGURA, "height": ALTURA})
            print(f"  destaques: {len(dados['capas_destaque'])} capas")

        for i, est in enumerate(dados.get("estaticos", []), 1):
            nome = f"{i:02d}-{est['slug']}.png"
            render(motor._estatico(est), destino / "estaticos" / nome, f"estatico/{nome}")
        if dados.get("estaticos"):
            print(f"  estaticos: {len(dados['estaticos'])} peças")

        navegador.close()

    print(f"\n{total} PNGs em {destino}")
    print("zona morta:", "OK em todas" if not falhas else f"FALHOU em {len(falhas)}")
    for k, v in falhas.items():
        print("  -", k, v[:2])
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
