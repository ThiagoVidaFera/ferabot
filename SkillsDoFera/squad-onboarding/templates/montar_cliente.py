"""Monta o conteúdo de um cliente a partir da FONTE ÚNICA.

Por que existe: quando o conteúdo vive em dois arquivos escritos à mão, com fatos repetidos, o
mesmo exemplo sai com dois valores (um no criativo, outro no PDF).
Agora:

    fonte/fatos.json         os fatos que aparecem em mais de um lugar — UMA vez, aqui
    fonte/content.tpl.js     a prévia, com {{tokens}} no lugar dos fatos
    fonte/feed.tpl.json      o kit, com {{tokens}} no lugar dos fatos

    → assets/content.js  e  feed.json   (GERADOS — nunca editar à mão)

Além de trocar tokens, o montador DERIVA os blocos que antes eram copiados entre os arquivos:
  · content.guide              ← feed.isca              (o guia da prévia e o PDF dizem o mesmo)
  · content.plano.kit.campanhas ← feed.campanhas
  · content.plano.kit.drive/isca ← drive-links.json + feed.isca.arquivo
  · calculadora da proposta     ← fatos.exemplo
  · posts e destaques           ← artes do kit (roda o feed_do_kit.py, se o kit existir)

Valores do exemplo são CALCULADOS (valor = quantidade × ticket), não digitados.

Uso: python -I montar_cliente.py <pasta-do-run>
Falha (exit 1) se sobrar token sem fato, ou se um token citar um fato que não existe.
"""
import json
import pathlib
import re
import subprocess
import sys

for _f in (sys.stdout, sys.stderr):
    try:
        _f.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

AQUI = pathlib.Path(__file__).resolve().parent
EXTENSO = {1: "uma", 2: "duas", 3: "três", 4: "quatro", 5: "cinco", 6: "seis",
           7: "sete", 8: "oito", 9: "nove", 10: "dez"}


def reais(valor):
    """12000 → 'R$ 12 mil' · 180000 → 'R$ 180 mil' · 3000 → 'R$ 3.000'."""
    if valor >= 10_000 and valor % 1000 == 0:
        return f"R$ {valor // 1000:,} mil".replace(",", ".")
    return f"R$ {valor:,.0f}".replace(",", ".")


def derivar_fatos(fatos):
    """Acrescenta os fatos calculados. O que é conta não se digita."""
    ex = fatos.get("exemplo")
    if ex:
        ex["valor"] = reais(ex["qtd"] * ex["ticket"])
        ex["ticket_fmt"] = reais(ex["ticket"])
        ex["sem_motivo"] = ex["qtd"] - ex["com_motivo"]
        taxa = ex.get("taxa_pct")
        if taxa:
            ex["taxa_fmt"] = f"{taxa}%"
            ex["mesa"] = reais(round(ex["sem_motivo"] * ex["ticket"] * taxa / 100))
        preco = (fatos.get("oferta") or {}).get("preco_num")
        if preco:
            vezes = ex["ticket"] // preco
            ex["paga_vezes"] = f"{EXTENSO.get(vezes, vezes)} vezes"
    of = fatos.get("oferta")
    if of and of.get("preco_num"):
        of["preco"] = reais(of["preco_num"])
    return fatos


def achatar(d, prefixo=""):
    plano = {}
    for k, v in d.items():
        chave = f"{prefixo}{k}"
        if isinstance(v, dict):
            plano.update(achatar(v, chave + "."))
        else:
            plano[chave] = v
    return plano


def renderizar(texto, fatos_planos, origem):
    faltam = set()

    def troca(m):
        nome = m.group(1).strip()
        if nome not in fatos_planos:
            faltam.add(nome)
            return m.group(0)
        return str(fatos_planos[nome])

    saida = re.sub(r"\{\{\s*([\w.]+)\s*\}\}", troca, texto)
    if faltam:
        raise SystemExit(f"{origem}: token(s) sem fato em fatos.json → {sorted(faltam)}")
    return saida


def sem_md(t):
    return re.sub(r"\*\*(.+?)\*\*", r"\1", t or "")


def guia_da_isca(isca):
    """O guia que a prévia mostra no DM é a versão curta do PDF — gerado dele, nunca reescrito."""
    sep, conta = isca["separar"], isca["conta"]
    pri, rot, ex, fecho = isca["priorizar"], isca["rotina"], isca["exemplo"], isca["fecho"]
    return {
        "title": f"{sem_md(isca['titulo']).rstrip('.')}: {sem_md(isca['subtitulo'])}",
        "intro": f"{sem_md(isca['intro'])}\n\n{sem_md(isca['como_usar'])}",
        "sections": [
            {"title": f"1. {sem_md(sep['titulo'])}", "body": sem_md(sep["texto"]),
             "items": [f"{sem_md(i['titulo'])}: {sem_md(i['texto'])}" for i in sep["itens"]]},
            {"title": f"2. As {len(isca['situacoes'])} situações. Procure cada uma.",
             "body": "Para cada uma, o PDF traz onde procurar, como dar valor à linha e a mensagem pronta.",
             "items": [sem_md(s["titulo"]) for s in isca["situacoes"]]},
            {"title": f"3. {sem_md(conta['titulo'])}", "body": sem_md(conta["texto"]),
             "items": [sem_md(conta["leitura"])]},
            {"title": "4. Retome pelo motivo de origem, nunca por \"tudo bem?\".",
             "body": "A mensagem volta no motivo que fez a pessoa procurar vocês e oferece duas saídas honestas.",
             "items": [sem_md(s["mensagem"]) for s in isca["situacoes"][:3]]},
            {"title": f"5. {sem_md(pri['titulo'])}", "body": sem_md(pri["texto"]),
             "items": [f"{sem_md(i['titulo'])}: {sem_md(i['texto'])}" for i in pri["itens"]]},
            {"title": f"6. {sem_md(rot['titulo'])}", "body": sem_md(rot["texto"]),
             "items": [f"Regra: {sem_md(rot['regra'])}"]},
        ],
        "example": {"title": sem_md(ex["titulo"]),
                    "body": "\n\n".join(f"{sem_md(l['rotulo'])}: {sem_md(l['texto'])}" for l in ex["linhas"])
                            + f"\n\n{sem_md(ex['aviso'])}"},
        "closing": sem_md(fecho["texto"]),
    }


def carregar_content(js):
    """content.js é `window.PROFILE = {...};` — JSON puro depois do prefixo."""
    corpo = js[js.index("{"): js.rstrip().rstrip(";").rindex("}") + 1]
    return json.loads(corpo)


def main():
    run = pathlib.Path(sys.argv[1]).resolve()
    fonte = run / "fonte"
    fatos = derivar_fatos(json.loads((fonte / "fatos.json").read_text(encoding="utf-8")))
    planos = achatar(fatos)

    # 1) tokens
    feed = json.loads(renderizar((fonte / "feed.tpl.json").read_text(encoding="utf-8"), planos, "feed.tpl.json"))
    content = carregar_content(renderizar((fonte / "content.tpl.js").read_text(encoding="utf-8"),
                                          planos, "content.tpl.js"))

    # 2) blocos derivados
    if feed.get("isca"):
        content["guide"] = guia_da_isca(feed["isca"])
    plano = content.setdefault("plano", {})
    kit = plano.get("kit")
    if kit is not None and feed.get("campanhas"):
        kit["campanhas"] = [{"letra": k, "nome": v["nome"], "orcamento": v["orcamento"],
                             "objetivo": v["objetivo"], "destino": v["destino"], "artes": v["artes"]}
                            for k, v in sorted(feed["campanhas"].items())]
    links_path = run / "drive-links.json"
    if kit is not None and links_path.exists():
        links = json.loads(links_path.read_text(encoding="utf-8"))
        kit["drive"] = links.get("pasta", kit.get("drive"))
        if feed.get("isca") and kit.get("isca"):
            kit["isca"]["arquivo"] = f"kit-feed-inicial/isca/{feed['isca']['arquivo']}.pdf"
    calc = (plano.get("proposta") or {}).get("calculadora")
    ex = fatos.get("exemplo")
    if calc is not None and ex:
        calc["ticketPadrao"] = ex["ticket"]
        calc["multiplicador"] = ex["qtd"]

    # 3) grava os gerados
    (run / "feed.json").write_text(json.dumps(feed, ensure_ascii=False, indent=2), encoding="utf-8")
    (run / "assets" / "content.js").write_text(
        "window.PROFILE = " + json.dumps(content, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")

    # 4) posts e destaques apontando pras artes reais
    if (run / "kit-feed-inicial").is_dir():
        subprocess.run([sys.executable, "-I", str(AQUI / "kit-feed" / "feed_do_kit.py"), str(run)], check=True)

    print(f"montado: {len(planos)} fatos · feed.json + assets/content.js gerados da fonte")
    if ex:
        print(f"exemplo: {ex['qtd']} × {ex['ticket_fmt']} = {ex['valor']} "
              f"({ex['com_motivo']} com motivo, {ex['sem_motivo']} sem)")


if __name__ == "__main__":
    main()
