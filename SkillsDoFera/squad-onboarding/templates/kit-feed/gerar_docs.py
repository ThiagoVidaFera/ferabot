"""Gera a documentação do Kit de Feed Inicial a partir do feed.json.

Escreve o COMO-POSTAR.md (ordem, o que fixar, campanhas, modelos de resposta) e um COPY.md por
carrossel, com a legenda pronta. É o que faz o kit funcionar sem o cliente perguntar nada.

Uso: python -I gerar_docs.py <pasta-do-run>
"""
import json
import pathlib
import sys

for _f in (sys.stdout, sys.stderr):
    try:
        _f.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

raiz = pathlib.Path(sys.argv[1]).resolve()
d = json.loads((raiz / "feed.json").read_text(encoding="utf-8"))
kit = raiz / "kit-feed-inicial"
cliente = d.get("cliente", "")
camp = d.get("campanhas", {})
resp = d.get("respostas", {})

# Links reais do Drive (gravados pelo subir_drive.mjs — automático ou modo --manual). Sem eles, o marcador fica visível:
# resposta de keyword com link vazio é pior que resposta atrasada.
links_path = raiz / "drive-links.json"
links = json.loads(links_path.read_text(encoding="utf-8")) if links_path.exists() else {}
isca = d.get("isca") or {}
_pdfs = links.get("pdfs") or {}
link_pdf = _pdfs.get(f"{isca.get('arquivo', '')}.pdf", "") or (next(iter(_pdfs.values())) if len(_pdfs) == 1 else "")


def com_links(texto):
    return texto.replace("[LINK DO PDF]", link_pdf) if link_pdf else texto


resp = {k: {c: (com_links(v) if isinstance(v, str) else v) for c, v in r.items()} for k, r in resp.items()}
if not link_pdf and isca:
    print("AVISO: PDF da isca ainda sem link do Drive — suba o kit (subir_drive.mjs, ou à mão + modo --manual)"
          " e rode gerar_docs.py de novo")

# ───────────────────────────── COPY por carrossel ─────────────────────────────
for c in d["carrosseis"]:
    pasta = kit / c["pasta"]
    linhas = [f"# {c['titulo']}", ""]
    linhas += [f"**{len(c['slides'])} slides** · 1080×1440 · pasta `png/`",
               f"**Palavra-chave:** `{c['keyword']}` · resposta **manual**, modelo no COMO-POSTAR.md",
               f"**Fixar no perfil:** {'sim' if c.get('fixar') else 'não'}"
               + (f" · linha {c['linha']} da grade" if c.get("linha") else ""), "",
               "---", "", "## Legenda (copiar e colar)", "", "```", c["legenda"], "```", "",
               "## Os slides", ""]
    for i, s in enumerate(c["slides"], 1):
        titulo = (s.get("titulo") or "").replace("<em>", "").replace("</em>", "")
        linhas.append(f"- **{i:02d}** · {s.get('tipo', 'texto')} — {titulo[:86]}")
    (pasta / "COPY.md").write_text("\n".join(linhas) + "\n", encoding="utf-8")

# ───────────────────────────── COPY dos estáticos ─────────────────────────────
est = kit / "estaticos"
est.mkdir(parents=True, exist_ok=True)
linhas = ["# Estáticos — feed e anúncio", "",
          "Cada peça tem **dois usos**: post no feed e criativo da campanha. A arte é a mesma.", ""]
por_camp = {}
for i, e in enumerate(d["estaticos"], 1):
    por_camp.setdefault(e["campanha"], []).append((i, e))
for ch, itens in sorted(por_camp.items()):
    info = camp.get(ch, {})
    linhas += [f"## Campanha {ch} — {info.get('nome', '')}", "",
               f"- **Destino:** {info.get('destino', '')}",
               f"- **Orçamento:** {info.get('orcamento', 'R$ 20/dia')}",
               f"- **Estrutura:** 1 campanha · 1 conjunto · 3 criativos", ""]
    for i, e in itens:
        t = e["titulo"].replace("<em>", "").replace("</em>", "")
        linhas += [f"**{i:02d}-{e['slug']}.png**", "", f"- Arte: `estaticos/{i:02d}-{e['slug']}.png`",
                   f"- Headline: {t}", f"- Legenda/texto do anúncio: {e.get('corpo') or e['cta']}",
                   f"- CTA: {e['cta']}", ""]
(est / "COPY.md").write_text("\n".join(linhas) + "\n", encoding="utf-8")

# ───────────────────────────── COMO POSTAR ─────────────────────────────
fixados = [c for c in d["carrosseis"] if c.get("fixar")]
l1 = [c for c in fixados if c.get("linha") == 1]
l2 = [c for c in fixados if c.get("linha") == 2]

doc = [f"# Como postar — {cliente}", "",
       "Tudo o que está nesta pasta já está pronto. Este arquivo diz a ordem e o que fazer com cada peça.", "",
       "---", "",
       "## 1. O que é este kit", "",
       f"- **{len(d['carrosseis'])} carrosséis** para fixar no topo do perfil",
       f"- **{len(d['estaticos'])} artes estáticas** que servem **de post E de anúncio** — a mesma imagem nos dois",
       "- As legendas prontas, em cada pasta, no arquivo `COPY.md`", "",
       "**O objetivo do feed é ligar as campanhas.** O anúncio leva a pessoa para a página; o perfil",
       "é o que ela olha antes de decidir se confia. Os dois precisam dizer a mesma coisa — por isso",
       "as artes são as mesmas.", "",
       "---", "", "## 2. A ordem de publicação", "",
       "**Primeiro os 6 carrosséis**, um por dia, nesta ordem:", ""]
for i, c in enumerate(fixados, 1):
    doc.append(f"{i}. `{c['pasta']}` — {c['titulo']}")
doc += ["",
        "Depois de publicar todos, **fixe os 6** (nos três pontinhos do post → Fixar no perfil).",
        "Eles vão formar esta grade:", "", "```",
        "┌──────────────┬──────────────┬──────────────┐"]
nomes = lambda lista: "│" + "│".join(f" {c['titulo'][:12]:<12} " for c in lista) + "│"
doc += [nomes(l1), "├──────────────┼──────────────┼──────────────┤", nomes(l2),
        "└──────────────┴──────────────┴──────────────┘", "```", "",
        "A linha de cima mostra quem você é e por que acreditar. A de baixo dá os três caminhos.", "",
        "⚠️ A posição entre os fixados segue a **data de publicação**. Se a grade sair fora de ordem,",
        "desafixe e fixe de novo na ordem inversa — leva um minuto.", "",
        "**Depois, os 9 estáticos**, um por dia útil. Eles já vêm na ordem certa (01 a 09): a sequência",
        "alterna as três campanhas pra não empilhar o mesmo convite na mesma coluna do perfil.", "",
        "---", "", "## 3. As três campanhas", "",
        "Cada campanha usa **os 3 criativos da sua letra** — as mesmas artes que você postou no feed.", ""]
for ch in sorted(camp):
    c = camp[ch]
    doc += [f"### Campanha {ch} — {c.get('nome','')}", "",
            f"- **Orçamento:** {c.get('orcamento','R$ 20/dia')}",
            f"- **Estrutura:** 1 campanha · 1 conjunto · 3 criativos",
            f"- **Destino:** {c.get('destino','')}",
            f"- **Artes:** {c.get('artes','')}",
            f"- **Objetivo:** {c.get('objetivo','')}", ""]
doc += ["Suba as três juntas. São R$ 60 por dia no total. Deixe rodar pelo menos 7 dias antes de",
        "mexer em qualquer coisa — mudar criativo todo dia reinicia o aprendizado e você não aprende nada.", "",
        "---", "", "## 4. Quando alguém comentar a palavra-chave", "",
        "As respostas são **manuais**: você mesmo responde no direct. É isso que faz a conversa começar",
        "do jeito certo. Abaixo o modelo de cada uma — copie, troque o nome e envie.", ""]
for k, r in resp.items():
    doc += [f"### Comentou `{k}`", "",
            f"**1. Responda o comentário** (público, curto):", "", "```", r["comentario"], "```", "",
            f"**2. Mande no direct:**", "", "```", r["direct"], "```", ""]
    if r.get("segunda"):
        doc += ["**3. Se a pessoa responder, a próxima mensagem:**", "", "```", r["segunda"], "```", ""]
if isca:
    doc += ["---", "", "## 5. A isca em PDF", "",
            f"**{isca.get('titulo', '').replace('**', '')}** — {len(isca.get('situacoes', []))} situações, "
            "9 páginas, gratuito.", "",
            "É o que a pessoa recebe quando comenta a palavra da isca ou entra no grupo. "
            "Está na pasta `isca/` e **o link já está nas respostas-modelo acima**.", "",
            f"- **Arquivo:** `isca/{isca.get('arquivo', '')}.pdf`",
            f"- **Link pra mandar:** {link_pdf or '[ainda sem link — suba o kit no Drive]'}", "",
            "Quando você tiver um caso real autorizado, ele substitui o exemplo hipotético da página 8 — "
            "me peça que eu regero o PDF.", ""]
    secao = 6
else:
    secao = 5
doc += ["---", "", f"## {secao}. Checklist da primeira semana", "",
        "- [ ] Publicar os 6 carrosséis (um por dia)",
        "- [ ] Fixar os 6 e conferir se a grade ficou na ordem certa",
        "- [ ] Subir as 3 campanhas (R$ 20/dia cada)",
        "- [ ] Abrir o link do PDF da isca no celular, sem estar logado, e conferir que carrega",
        "- [ ] Conferir se o link da bio está na página de agendamento",
        "- [ ] Deixar as 3 respostas-modelo salvas no celular, prontas pra colar", "",
        "> As artes também estão no Google Drive, na pasta que você recebeu junto com este link.", ""]
(kit / "COMO-POSTAR.md").write_text("\n".join(doc) + "\n", encoding="utf-8")

print(f"docs: COMO-POSTAR.md + {len(d['carrosseis'])} COPY.md + estaticos/COPY.md")
