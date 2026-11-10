"""Blocos HTML da proposta (layout "dossiê vivo"): capa, menu lateral e sete seções.

Seções: capa, 01 Resumo, 02 O plano, 03 O percurso, 04 Investimento (preço e garantia), 05 Como começamos,
06 Quem assina, 07 Aceite. O preço só aparece na 04 (e no resumo do aceite, que vem depois dela).
"""
from __future__ import annotations

import urllib.parse

import diagramas
from util import brl, dmy, e, lista_html

SECOES = [("s1", "01", "Resumo"), ("s2", "02", "O plano"), ("s3", "03", "O percurso"),
          ("investimento", "04", "Investimento"), ("s5", "05", "Como começamos"),
          ("s6", "06", "Quem assina"), ("aceite", "07", "Aceite")]


def cap(texto: str) -> str:
    return texto[:1].upper() + texto[1:]


def iniciais(nome: str) -> str:
    partes = [x for x in nome.split() if x]
    return (partes[0][0] + partes[-1][0]).upper() if len(partes) > 1 else nome[:2].upper()


def doc_id(c: dict, emitida) -> str:
    return f"{iniciais(c['lead']['nome'])}-{emitida:%y%m%d}"


def wa_link(c: dict, texto: str) -> str:
    return f"https://wa.me/{c['dono']['whatsapp']}?text={urllib.parse.quote(texto)}"


def botao(c: dict, classe: str = "btn") -> str:
    return f'<a class="{classe} js-comecar" href="{e(c["cta_url"])}" rel="noopener">Vamos começar</a>'


def _sec(id_: str, n: str, rotulo: str, corpo: str) -> str:
    return (f'<section class="band" id="{id_}" data-sec data-n="{n}" data-l="{e(rotulo)}">'
            f'<div class="sec"><div class="sh"><span class="n">{n}</span><span class="l">{e(rotulo)}</span></div>'
            f'{corpo}</div></section>')


def topbar() -> str:
    return ('<div class="topbar" id="topbar" role="status"><span class="tb-n" id="tbn">01</span>'
            '<span class="tb-l" id="tbl">Resumo</span><span class="tb-v" data-restam></span></div>')


def capa(c: dict, fim_txt: str, emitida) -> str:
    ld, dn = c["lead"], c["dono"]
    ig = f"<dt>Instagram</dt><dd>@{e(ld['instagram'])}</dd>" if ld.get("instagram") else ""
    return f"""<header class="capa" id="topo">
  <svg class="capa-art" viewBox="0 0 600 600" aria-hidden="true">
    <circle cx="300" cy="300" r="120"/><circle cx="300" cy="300" r="200"/><circle class="dash" cx="300" cy="300" r="280"/>
    <circle class="dash2" cx="300" cy="300" r="360"/>
    <path d="M300 20 V580 M20 300 H580"/>
  </svg>
  <div class="wrap">
    <dl class="meta">
      <dt>Proposta nº</dt><dd>{doc_id(c, emitida)}</dd>
      <dt>Preparada para</dt><dd>{e(ld["empresa"] or ld["nome"])}</dd>
      {ig}
      <dt>Preparada por</dt><dd>{e(dn["nome"])}</dd>
      <dt>Emitida em</dt><dd>{dmy(emitida)}</dd>
      <dt>Válida até</dt><dd>{fim_txt} · <span data-restam></span></dd>
    </dl>
    <div class="capa-txt">
      <h1>{e(ld["primeiro_nome"])}, este é o plano para {e(ld["objetivo"])}.</h1>
      <p class="sub">Montado a partir do que você me contou. A gente faz junto, uma parte de cada vez.</p>
    </div>
    <a class="cue" href="#s1">Role para ler a proposta ↓</a>
  </div>
</header>"""


def rail(c: dict, fim_txt: str, emitida) -> str:
    itens = "".join(f'<li><a href="#{i}"><span>{n}</span>{e(l)}</a></li>' for i, n, l in SECOES)
    return f"""<aside class="rail" aria-label="Seções da proposta">
  <div>
    <p class="rid">Proposta nº {doc_id(c, emitida)}</p>
    <p class="rcli">{e(c["lead"]["empresa"] or c["lead"]["nome"])}</p>
  </div>
  <nav><ol>{itens}</ol></nav>
  <div class="rbot">
    <p class="rval">Válida até {fim_txt}<br><b data-restam></b></p>
    {botao(c)}
  </div>
</aside>"""


def resumo(c: dict) -> str:
    ld, of = c["lead"], c["oferta"]
    quotes = "".join(f'<div class="q"><blockquote>“{e(x)}”</blockquote></div>' for x in ld["falas"])
    bloco_falas = f'<div class="qs">{quotes}</div>' if quotes else ""
    res = "".join(f"<li>{e(x['nome_curto'])}</li>" for x in of["entregas"])
    corpo = f"""<h2>O que você me contou.</h2>
    <p class="lead">São as suas palavras, do jeito que você falou. Foi a partir delas que eu montei o plano.</p>
    {bloco_falas}
    <div class="ad rv">
      <div class="antes"><span class="tag">Hoje</span><h3>{e(cap(ld["dor"]))}</h3></div>
      <div class="depois3"><span class="tag">Com o plano montado</span><h3>{e(cap(ld["objetivo"]))}</h3>
        <ul>{res}</ul></div>
    </div>"""
    return _sec("s1", "01", "Resumo", corpo)


def glossario_html(c: dict) -> str:
    gl = c["oferta"].get("glossario") or []
    if not gl:
        return ""
    dl = "".join(f"<dt>{e(g['termo'])}</dt><dd>{e(g['significa'])}</dd>" for g in gl)
    return f'<details class="gloss"><summary>Palavras que eu uso aqui, em português claro</summary><dl>{dl}</dl></details>'


def dois_mundos_html(dm: dict | None) -> str:
    """Contraste curto antes das entregas: o que continua se nada mudar x o que muda com a proposta."""
    if not dm:
        return ""
    def col(m: dict, classe: str) -> str:
        lis = "".join(f"<li>{e(x)}</li>" for x in m["itens"])
        return f'<div class="dmx {classe}"><h3>{e(m["titulo"])}</h3><ul>{lis}</ul></div>'
    return f'<div class="dmundos rv">{col(dm["mundo1"], "um")}{col(dm["mundo2"], "dois")}</div>'


def em_contrato_html(ec: dict | None) -> str:
    """Logo abaixo da garantia: o que fica por escrito. Só aparece se o dono escreveu o bloco."""
    if not ec:
        return ""
    texto = f'<p>{e(ec["texto"])}</p>' if ec["texto"] else ""
    link = f'<p><a href="{e(ec["link"])}" target="_blank" rel="noopener">{e(ec["link_texto"] or "Ver o modelo de contrato")}</a></p>' if ec["link"] else ""
    lis = "".join(f"<li>{e(x)}</li>" for x in ec["itens"])
    return (f'<div class="emc rv"><span class="tag">Em contrato</span><h3>{e(ec["titulo"])}</h3>{texto}'
            f'<ul>{lis}</ul>{link}</div>')


def plano(c: dict) -> str:
    of = c["oferta"]
    mods = ""
    for i, en in enumerate(of["entregas"], 1):
        temas = ""
        if en.get("temas"):
            lis = "".join(f"<li>{e(t)}</li>" for t in en["temas"]["lista"])
            temas = f'<details class="escopo"><summary>{e(en["temas"]["titulo"])}</summary><ul>{lis}</ul></details>'
        mods += f"""
      <article class="mod rv">
        <div class="mtxt">
          <div class="mh"><span class="mnum">Entrega {i:02d}</span></div>
          <h3>{e(en["titulo"])}</h3>
          <p class="muda3">{e(cap(en["muda"]))}</p>
          <details class="escopo"><summary>O que está incluso</summary><ul>{lista_html(en["itens"])}</ul></details>
          {temas}
        </div>
        <div class="mfig diag">{diagramas.montar(str(i), en["diagrama"])}</div>
      </article>"""
    corpo = f"""{dois_mundos_html(of.get("dois_mundos"))}<h2>{e(of["entregas_titulo"])}</h2>
    <p class="lead">{e(of["entregas_lead"])}</p>
    <div class="mods">{mods}
    </div>
    {glossario_html(c)}"""
    return _sec("s2", "02", "O plano", corpo)


def percurso(c: dict) -> str:
    jor = c["oferta"]["jornada"]
    n = len(jor)
    xs = [30 + i * (540 / n) for i in range(n + 1)]
    ys = [185 - i * (150 / n) for i in range(n + 1)]
    caminho = "M" + " L".join(f"{x:.0f} {y:.0f}" for x, y in zip(xs, ys))
    pontos = ""
    for i, (x, y) in enumerate(zip(xs, ys)):
        meta = i == n
        pontos += (f'<g class="pt" style="--d:{0.35 * i:.2f}s"><circle cx="{x:.0f}" cy="{y:.0f}" r="{17 if meta else 15}" '
                   f'class="{"meta" if meta else ""}"/><text x="{x:.0f}" y="{y + 5:.0f}" text-anchor="middle">{"★" if meta else i + 1}</text></g>')
    fases = "".join(
        f'<li class="fase rv"><span class="f">FASE {i:02d}</span><div><b>{e(x["t"])}</b><p>{e(x["d"])}</p></div></li>'
        for i, x in enumerate(jor, 1))
    corpo = f"""<h2>{e(c["oferta"]["jornada_titulo"])}</h2>
    <p class="lead">Uma coisa de cada vez, na ordem em que cada parte destrava a próxima.</p>
    <figure class="curva rv" aria-label="Curva do percurso até o objetivo">
      <svg viewBox="0 0 600 220" role="img" aria-label="{n} fases em sequência até o objetivo combinado">
        <path class="base" d="M30 200 H570"/>
        <path class="linha" d="{caminho}"/>
        {pontos}
        <text class="alvo" x="570" y="16" text-anchor="end">Objetivo combinado</text>
      </svg>
      <figcaption>Ilustração do percurso, sem datas nem projeção de resultado.</figcaption>
    </figure>
    <ol class="fases">{fases}</ol>"""
    return _sec("s3", "03", "O percurso", corpo)


def investimento(c: dict) -> str:
    of = c["oferta"]
    avulso = of.get("avulso_total")
    tabela = ""
    if avulso:
        linhas = "".join(f'<div class="r"><span>{i:02d} · {e(x["nome_curto"])}</span><b>{brl(x["preco"])}</b></div>'
                         for i, x in enumerate(of["entregas"], 1))
        tabela = f"""<div class="tab3">
      {linhas}
      <div class="r"><span>Soma avulsa</span><b>{brl(avulso)}</b></div>
      <div class="r d"><span>Desconto de fechamento geral</span><b>- {brl(avulso - of["a_vista"])}</b></div>
    </div>"""
        titulo = "Cada parte tem seu preço. Junto, você paga menos."
    else:
        titulo = "O investimento para fazer tudo isso junto."
    alt = ""
    if of.get("parcelas") and of.get("parcela"):
        total = of["parcelas"] * of["parcela"]
        menos = f" À vista você paga {brl(total - of['a_vista'])} a menos." if total > of["a_vista"] else ""
        alt = f'<p class="alt3">ou <b>{of["parcelas"]}× {brl(of["parcela"])}</b> (total de {brl(total)}).{menos}</p>'
    nota = f'<p class="nota3">{e(of["nota"])}</p>' if of.get("nota") else ""
    gar = ""
    g = of.get("garantia")
    if g:
        big = e(g["texto"])
        if g.get("destaque") and e(g["destaque"]) in big:
            big = big.replace(e(g["destaque"]), f'<em class="hl">{e(g["destaque"])}</em>', 1)
        lis = "".join(f"<li>{e(x)}</li>" for x in g.get("itens", []))
        gar = f'<div class="gar rv"><span class="tag">Garantia</span><p class="big">{big}</p><ul>{lis}</ul></div>'
    corpo = f"""<h2>{titulo}</h2>
    {tabela}
    <div class="price3 rv"><span class="tag">Pacote completo</span>
      <strong data-count="{of["a_vista"]}">{brl(of["a_vista"])}</strong><small>à vista</small></div>
    {alt}
    {nota}
    {gar}
    {em_contrato_html(of.get("em_contrato"))}"""
    return (f'<section class="band inv" id="investimento" data-sec data-n="04" data-l="Investimento">'
            f'<div class="sec"><div class="sh"><span class="n">04</span><span class="l">Investimento</span></div>{corpo}</div></section>')


def comecar(c: dict) -> str:
    of = c["oferta"]
    passos = "".join(f'<li class="passo"><b>{e(x["t"])}</b><p>{e(x["d"])}</p></li>' for x in of["depois"])
    quem_faz = ""
    q = of.get("quem_faz")
    if q:
        eu = "".join(f"<li>{e(x)}</li>" for x in q.get("eu", []))
        voce = "".join(f"<li>{e(x)}</li>" for x in q.get("voce", []))
        quem_faz = f"""<h3 class="sub3">Quem faz o quê.</h3>
    <div class="quem"><div class="duas">
      <div class="col"><h3>Eu faço</h3><ul>{eu}</ul></div>
      <div class="col"><h3>Você faz</h3><ul>{voce}</ul></div>
    </div></div>"""
    corpo = f"""<h2>O que acontece quando você clica em “Vamos começar”.</h2>
    <p class="lead">Nada de surpresa. Você sabe cada passo antes de decidir.</p>
    <div class="depois"><ol class="passos">{passos}</ol></div>
    {quem_faz}"""
    return _sec("s5", "05", "Como começamos", corpo)


def quem(c: dict) -> str:
    dn = c["dono"]
    itens = [(f"Atuo com {dn['nicho']}.", f"Meu trabalho aqui: {dn['produto']}.")]
    itens += [(x, "") for x in dn["sobre"]]
    caixas = "".join(f'<div class="item"><b>{e(t)}</b>{e(d)}</div>' for t, d in itens)
    links = ""
    if dn.get("handle"):
        links += (f'<div class="item"><b>Me acompanhe no Instagram.</b>'
                  f'<a href="https://instagram.com/{e(dn["handle"])}" target="_blank" rel="noopener">@{e(dn["handle"])}</a></div>')
    if dn.get("landing_page"):
        links += (f'<div class="item"><b>Conheça mais do meu trabalho.</b>'
                  f'<a href="{e(dn["landing_page"])}" target="_blank" rel="noopener">{e(dn["landing_page"])}</a></div>')
    corpo = f"""<h2>Eu sou {e(dn["nome"])}.</h2>
    <div class="sobre"><div class="sobre-grid"><div><div class="faixa">{caixas}{links}</div></div></div></div>"""
    return _sec("s6", "06", "Quem assina", corpo)


def aceite(c: dict, fim_txt: str, emitida) -> str:
    of, ld = c["oferta"], c["lead"]
    pacote = " · ".join(x["nome_curto"] for x in of["entregas"])
    inv = brl(of["a_vista"]) + " à vista"
    if of.get("parcelas") and of.get("parcela"):
        inv += f' ou {of["parcelas"]}× {brl(of["parcela"])}'
    linhas = [("Proposta nº", doc_id(c, emitida)), ("Cliente", ld["empresa"] or ld["nome"]), ("Pacote", pacote),
              ("Investimento", inv), ("Validade", fim_txt)]
    sumario = "".join(f"<div><dt>{e(k)}</dt><dd>{e(v)}</dd></div>" for k, v in linhas)
    conversa = ""
    if c["dono"].get("whatsapp"):
        conversa = (f' Prefere conversar antes? <a href="{e(wa_link(c, "Olá, li a proposta e tenho uma dúvida."))}" '
                    f'data-wa>Me chama no WhatsApp</a>.')
    return f"""<section class="band fim3 final" id="aceite" data-sec data-n="07" data-l="Aceite">
  <div class="sec">
    <div class="sh"><span class="n">07</span><span class="l">Aceite</span></div>
    <h2>Faz sentido para o seu momento?</h2>
    <p class="lead">Se sim, clica em “Vamos começar” e a gente dá o primeiro passo juntos.</p>
    <dl class="sum">{sumario}</dl>
    <div class="cta">{botao(c, "btn grande")}</div>
    <p class="peq">Proposta válida até {fim_txt} (<span data-restam></span>).{conversa}</p>
  </div>
</section>"""


def barra(c: dict) -> str:
    return (f'<div class="barra" id="barra"><span><b>Proposta {e(c["lead"]["primeiro_nome"])}</b>'
            f'{e(c["dono"]["produto"])}</span>{botao(c)}</div>')
