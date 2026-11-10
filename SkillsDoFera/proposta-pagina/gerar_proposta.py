#!/usr/bin/env python
"""proposta-pagina: gera a página de proposta de um lead (HTML estático) a partir do perfil, da oferta e do lead.

Uso (de qualquer pasta):
  python SkillsDoFera/proposta-pagina/gerar_proposta.py --lead lead.json --out <pasta> [--perfil perfil.json]
         [--oferta oferta.json] [--emitida AAAA-MM-DD] [--estrito]

Saída em <pasta>: index.html, robots.txt e resumo.json ({titulo, validade_ate, arquivos, publicavel, pendencias...}).
Código de saída: 0 = gerada e publicável; 2 = gerada com pendências ([FONTE OMISSA], não publicar);
1 = erro de validação (nada foi gerado).
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import diagramas  # noqa: E402
import paginas  # noqa: E402
import paleta  # noqa: E402
from util import e, validade  # noqa: E402

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parent.parent  # raiz do FeraBot, onde ficam perfil.json e oferta.json

JARGAO = ("ticket", "lead", "leads", "follow-up", "no-show", "funil", "funis", "payback", "cpl", "roi", "cac",
          "ltv", "landing", "cta", "mql", "criativos", "tráfego", "crm", "sdr")
PROIBIDO_RETORNO = re.compile(
    r"se pag[ao]\b|cobre?m? o investimento|pag(?:a|am) o investimento|ajudam? a pagar|"
    r"retorno (?:do|sobre o) investimento|tempo de retorno|payback|se paga")
EMOJI = re.compile("[\U0001F000-\U0001FAFF☀-➿⬀-⯿️]")
CHAVES_SEM_TEXTO = {"diagrama", "checkout_url", "whatsapp", "landing_page", "handle", "instagram", "falas"}
OMISSA = "[FONTE OMISSA: {}]"


# ---------------------------------------------------------------- leitura e normalização


def ler_json(caminho: Path) -> dict:
    return json.loads(caminho.read_text(encoding="utf-8-sig"))


def so_digitos(v: object) -> str:
    return re.sub(r"\D", "", str(v or ""))


def parse_preco(v: object) -> int:
    """Aceita 7000, "7000", "R$ 7.000", "R$ 1.997,00". Devolve reais inteiros, 0 se não entender."""
    if isinstance(v, (int, float)):
        return round(v)
    t = re.sub(r"[^\d.,]", "", str(v or ""))
    if not t:
        return 0
    if "," in t:
        t = t.replace(".", "").replace(",", ".")
    elif re.fullmatch(r"\d{1,3}(\.\d{3})+", t):
        t = t.replace(".", "")
    try:
        return round(float(t))
    except ValueError:
        return 0


def https(url: object) -> str:
    u = str(url or "").strip()
    if not u:
        return ""
    return u if u.startswith("https://") else ("https://" + u if "://" not in u else "")


def whatsapp(v: object) -> str:
    d = so_digitos(v)
    return ("55" + d if len(d) in (10, 11) else d) if len(d) >= 10 else ""


def itens_norm(itens: list, titulo: str, pend: list[str]) -> list[dict]:
    out = []
    for it in itens or []:
        out.append({"t": it, "d": ""} if isinstance(it, str) else {"t": it.get("t", ""), "d": it.get("d", "")})
    if not out:
        out = [{"t": OMISSA.format(f"o que está incluso em {titulo}"), "d": ""}]
    return out


def normalizar_entregas(of: dict, pend: list[str], erros: list[str]) -> list[dict]:
    brutas = of.get("entregaveis") or []
    if not brutas:
        erros.append("oferta.json sem 'entregaveis' (lista com titulo, muda e itens de cada entrega)")
    out = []
    for i, b in enumerate(brutas, 1):
        titulo = str(b.get("titulo") or "").strip()
        if not titulo:
            erros.append(f"entregaveis[{i - 1}] sem titulo")
            continue
        muda = str(b.get("muda") or "").strip() or OMISSA.format(f"o que muda para o cliente com {titulo}")
        itens = itens_norm(b.get("itens"), titulo, pend)
        out.append({
            "titulo": titulo, "nome_curto": str(b.get("nome_curto") or titulo), "preco": parse_preco(b.get("preco")),
            "muda": muda, "itens": itens, "temas": b.get("temas"),
            "diagrama": b.get("diagrama") or diagramas.diagrama_padrao(str(b.get("nome_curto") or titulo), len(itens)),
        })
    return out


def depois_padrao(cta_checkout: bool, dono: str, primeira: str) -> list[dict]:
    if cta_checkout:
        return [
            {"t": "Você clica em “Vamos começar”", "d": "Abre a página de pagamento de " + dono + ". Você revisa o que está incluso e confirma."},
            {"t": "Você recebe a confirmação", "d": "Logo depois do pagamento a gente combina juntos o primeiro encontro, pelo WhatsApp."},
            {"t": "A gente começa pela primeira entrega", "d": f"O primeiro passo é: {primeira}."},
        ]
    return [
        {"t": "Você clica em “Vamos começar”", "d": "Abre uma conversa no WhatsApp com " + dono + "."},
        {"t": "A gente alinha os detalhes", "d": "Você tira as dúvidas e eu ajusto o que for preciso para caber no seu momento."},
        {"t": "A gente começa pela primeira entrega", "d": f"O primeiro passo é: {primeira}."},
    ]


def normalizar_em_contrato(bruto: object, erros: list[str]) -> dict | None:
    """Bloco opcional 'Em contrato': o que fica escrito no contrato. Só aparece se o dono escreveu."""
    if not bruto:
        return None
    itens = [str(x).strip() for x in (bruto.get("itens") if isinstance(bruto, dict) else None) or [] if str(x).strip()]
    titulo = str(bruto.get("titulo") or "").strip() if isinstance(bruto, dict) else ""
    if not titulo or not itens:
        erros.append("em_contrato precisa de 'titulo' e de ao menos um item em 'itens'")
        return None
    return {"titulo": titulo, "texto": str(bruto.get("texto") or "").strip(), "itens": itens,
            "link_texto": str(bruto.get("link_texto") or "").strip(), "link": https(bruto.get("link"))}


def normalizar_dois_mundos(bruto: object, falas: list[str], erros: list[str], avisos: list[str]) -> dict | None:
    """Bloco opcional 'Dois mundos': contraste curto montado das falas do lead (máximo 3 itens por mundo)."""
    if not bruto:
        return None
    if not falas:
        avisos.append("dois_mundos ignorado: sem falas do lead não se escreve o contraste (nada inventado)")
        return None
    mundos = {}
    for chave in ("mundo1", "mundo2"):
        m = bruto.get(chave) if isinstance(bruto, dict) else None
        itens = [str(x).strip() for x in (m or {}).get("itens") or [] if str(x).strip()]
        titulo = str((m or {}).get("titulo") or "").strip()
        if not titulo or not itens:
            erros.append(f"dois_mundos.{chave} precisa de 'titulo' e 'itens'")
        elif len(itens) > 3:
            erros.append(f"dois_mundos.{chave} tem {len(itens)} itens: o máximo é 3 (contraste longo atrasa o preço)")
        mundos[chave] = {"titulo": titulo, "itens": itens}
    return mundos


def normalizar(perfil: dict, oferta_in: dict, lead_in: dict) -> tuple[dict, list[str], list[str], list[str]]:
    """Junta perfil, oferta e lead num contexto único. Devolve (contexto, erros, pendências, avisos)."""
    erros: list[str] = []
    pend: list[str] = []
    avisos: list[str] = []
    of = {**oferta_in, **(lead_in.get("oferta_override") or {})}

    for campo in ("nome", "nicho", "produto"):
        if not str(perfil.get(campo) or "").strip():
            erros.append(f"perfil.json sem '{campo}'")
    for campo in ("nome", "objetivo", "dor"):
        if not str(lead_in.get(campo) or "").strip():
            erros.append(f"lead.json sem '{campo}'")

    entregas = normalizar_entregas(of, pend, erros)
    a_vista = parse_preco(of.get("valor_avista")) or parse_preco(perfil.get("preco"))
    if a_vista <= 0:
        erros.append("sem valor à vista: preencha 'valor_avista' no oferta.json (ou 'preco' no perfil.json)")
    parcelas, parcela = int(so_digitos(of.get("parcelas")) or 0), parse_preco(of.get("valor_parcela"))
    if bool(parcelas) != bool(parcela):
        erros.append("parcelamento incompleto: informe 'parcelas' e 'valor_parcela' juntos")
    elif parcelas and parcelas * parcela < a_vista:
        erros.append("parcelas x valor_parcela é menor que o valor à vista: confira os valores")

    checkout = https(of.get("checkout_url"))
    if of.get("checkout_url") and not checkout:
        erros.append("checkout_url precisa ser um link https")
    wa = whatsapp(of.get("whatsapp") or perfil.get("whatsapp"))
    cta = checkout or (f"https://wa.me/{wa}?text=" + "Ol%C3%A1%2C%20vi%20a%20proposta%20e%20quero%20come%C3%A7ar." if wa else "")
    if not cta:
        erros.append("sem destino para o botão: informe 'checkout_url' ou 'whatsapp' (do dono) no oferta.json")

    precos = [x["preco"] for x in entregas]
    soma = sum(precos)
    avulso = soma if entregas and all(precos) and soma > a_vista else 0

    sobre = perfil.get("sobre") or of.get("sobre") or []
    sobre = [sobre] if isinstance(sobre, str) else list(sobre)
    if not sobre:
        sobre = [OMISSA.format("sua história, tempo de atuação e resultados reais (só você tem esse dado)")]

    nome_lead = str(lead_in.get("nome") or "").strip()
    falas = [str(f).strip() for f in lead_in.get("falas") or [] if str(f).strip()]
    if not falas:
        pend.append("falas do lead ausentes: a seção 'O que você me contou' sai sem as citações literais")

    prim = entregas[0]["titulo"] if entregas else "a primeira entrega"
    nome_dono = str(perfil.get("nome") or "").strip()
    jornada = of.get("jornada") or [{"t": x["titulo"], "d": paginas.cap(x["muda"])} for x in entregas]
    if not of.get("garantia"):
        avisos.append("sem garantia no oferta.json: a seção de garantia não aparece (não inventamos garantia)")

    ctx = {
        "dono": {
            "nome": nome_dono, "nicho": str(perfil.get("nicho") or "").strip(), "produto": str(perfil.get("produto") or "").strip(),
            "handle": str(perfil.get("handle_instagram") or "").strip().lstrip("@").split("instagram.com/")[-1].strip("/"),
            "landing_page": https(perfil.get("landing_page")), "whatsapp": wa, "sobre": sobre,
        },
        "lead": {
            "nome": nome_lead, "primeiro_nome": nome_lead.split()[0] if nome_lead else "",
            "empresa": str(lead_in.get("empresa") or "").strip(),
            "instagram": str(lead_in.get("instagram") or "").strip().lstrip("@").split("instagram.com/")[-1].strip("/"),
            "falas": falas, "objetivo": str(lead_in.get("objetivo") or "").strip().rstrip("."),
            "dor": str(lead_in.get("dor") or "").strip().rstrip("."),
        },
        "oferta": {
            "entregas": entregas, "a_vista": a_vista, "parcelas": parcelas, "parcela": parcela, "avulso_total": avulso,
            "nota": str(of.get("nota") or "").strip(), "garantia": of.get("garantia") or None,
            "entregas_titulo": of.get("entregas_titulo") or "O que a gente monta junto.",
            "entregas_lead": of.get("entregas_lead") or f"{perfil.get('produto', '')}: cada parte resolve uma etapa e se encaixa na próxima.",
            "jornada_titulo": of.get("jornada_titulo") or "Do primeiro dia até o objetivo.",
            "jornada": jornada or [], "quem_faz": of.get("quem_faz") or None,
            "depois": of.get("depois") or depois_padrao(bool(checkout), nome_dono, prim),
            "glossario": of.get("glossario") or [],
            "em_contrato": normalizar_em_contrato(of.get("em_contrato"), erros),
            "dois_mundos": normalizar_dois_mundos(of.get("dois_mundos"), falas, erros, avisos),
        },
        "cta_url": cta,
    }
    if of.get("quem_faz") is None:
        avisos.append("sem 'quem_faz' no oferta.json: o bloco 'Quem faz o quê' não aparece")
    return ctx, erros, pend, avisos


# ---------------------------------------------------------------- regras de texto


def textos(o: object, saida: list[str] | None = None) -> list[str]:
    saida = [] if saida is None else saida
    if isinstance(o, str):
        saida.append(re.sub(r"<[^>]+>", " ", o))
    elif isinstance(o, dict):
        for k, v in o.items():
            if k not in CHAVES_SEM_TEXTO:
                textos(v, saida)
    elif isinstance(o, list):
        for v in o:
            textos(v, saida)
    return saida


def checar_texto(ctx: dict) -> tuple[list[str], list[str], list[str]]:
    """Regras de texto ao cliente. Devolve (erros, avisos de jargão, pendências [FONTE OMISSA])."""
    todo = " \n ".join(textos({k: v for k, v in ctx.items() if k != "cta_url"}))
    erros = []
    if re.search("[—–;]", todo):
        erros.append("texto com travessão ou ponto e vírgula: reescreva com ponto ou vírgula")
    if EMOJI.search(todo):
        erros.append("texto com emoji: tire")
    m = PROIBIDO_RETORNO.search(todo.lower())
    if m:
        erros.append(f"proibido falar em prazo de retorno do investimento ('{m.group(0)}')")
    gl = {g["termo"].lower() for g in ctx["oferta"]["glossario"]}
    avisos = [f"jargão sem explicação: '{t}' (troque por palavra simples ou ponha no glossario do oferta.json)"
              for t in JARGAO if t not in gl and re.search(rf"(?<![\wÀ-ÿ-]){re.escape(t)}(?![\wÀ-ÿ-])", todo.lower())]
    pend = [f"FONTE OMISSA: {m}" for m in re.findall(r"\[FONTE OMISSA: ([^\]]+)\]", todo)]
    return erros, avisos, pend


# ---------------------------------------------------------------- montagem


def montar_pagina(ctx: dict, emitida: date, fim_iso: str, fim_txt: str, pal: dict) -> str:
    css = "\n".join((AQUI / f"assets/{n}.css").read_text(encoding="utf-8") for n in ("base", "extra", "v3"))
    css = paleta.aplicar(css, pal)
    js = (AQUI / "assets/app.js").read_text(encoding="utf-8")
    cfg = {"valida_ate": fim_iso, "wa": ctx["dono"]["whatsapp"]}
    lead = ctx["lead"]
    main = "\n".join([paginas.resumo(ctx), paginas.plano(ctx), paginas.percurso(ctx), paginas.investimento(ctx),
                      paginas.comecar(ctx), paginas.quem(ctx), paginas.aceite(ctx, fim_txt, emitida)])
    corpo = "\n\n".join([
        '<div class="prog" id="prog"></div>', paginas.topbar(), paginas.capa(ctx, fim_txt, emitida),
        f'<div class="doc">{paginas.rail(ctx, fim_txt, emitida)}<main class="main">{main}</main></div>',
        paginas.barra(ctx),
    ])
    nome = lead["empresa"] or lead["nome"]
    desc = f"Proposta preparada por {ctx['dono']['nome']} para {nome}. Válida até {fim_txt}."
    fontes = ("family=Inter:wght@400;500;600;700;800;900&family=Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400..600"
              "&family=JetBrains+Mono:wght@400;500;600")
    return f"""<!doctype html>
<html lang="pt-BR" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Proposta · {e(nome)}</title>
<meta name="description" content="{e(desc)}">
<meta property="og:type" content="website"><meta property="og:locale" content="pt_BR">
<meta property="og:title" content="{e('Proposta para ' + nome)}"><meta property="og:description" content="{e(desc)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?{fontes}&display=swap" rel="stylesheet">
<style>
{css}
</style>
<script>document.documentElement.classList.add('js')</script>
</head>
<body class="v3">
{corpo}
<script>window.PROPOSTA={json.dumps(cfg, ensure_ascii=False)};</script>
<script>
{js}
</script>
</body>
</html>
"""


def achar(arg: str | None, env: str, nome: str) -> Path:
    for c in (arg, os.environ.get(env), RAIZ / nome, Path.cwd() / nome):
        if c and Path(c).is_file():
            return Path(c)
    raise SystemExit(f"ERRO: {nome} não encontrado (passe --{nome.split('.')[0]} ou ponha na raiz do FeraBot: {RAIZ})")


def main() -> int:
    for fluxo in (sys.stdout, sys.stderr):
        fluxo.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--lead", required=True, help="lead.json")
    ap.add_argument("--out", required=True, help="pasta de saída")
    ap.add_argument("--perfil", help="perfil.json (padrão: raiz do FeraBot)")
    ap.add_argument("--oferta", help="oferta.json (padrão: raiz do FeraBot)")
    ap.add_argument("--emitida", help="AAAA-MM-DD (padrão: hoje)")
    ap.add_argument("--estrito", action="store_true", help="avisos de jargão viram erro")
    a = ap.parse_args()

    try:
        lead = ler_json(Path(a.lead))
        perfil = ler_json(achar(a.perfil, "FERABOT_PERFIL", "perfil.json"))
        oferta = ler_json(achar(a.oferta, "FERABOT_OFERTA", "oferta.json"))
    except (OSError, json.JSONDecodeError) as ex:
        print(f"ERRO: não consegui ler um dos JSONs: {ex}")
        return 1

    ctx, erros, pend, avisos = normalizar(perfil, oferta, lead)
    if not erros:
        e_txt, av_jarg, pend_txt = checar_texto(ctx)
        erros += e_txt
        avisos += av_jarg
        pend = [p for p in pend if not p.startswith("FONTE OMISSA")] + pend_txt
        if a.estrito:
            erros += av_jarg
    for av in avisos:
        print("AVISO:", av)
    for er in erros:
        print("ERRO:", er)
    if erros:
        return 1

    emitida = date.fromisoformat(a.emitida) if a.emitida else date.today()
    fim, fim_txt = validade(emitida)
    pal = paleta.derivar(perfil.get("cor_primaria"), perfil.get("cor_secundaria"))
    out = Path(a.out).resolve()
    out.mkdir(parents=True, exist_ok=True)
    (out / "index.html").write_text(montar_pagina(ctx, emitida, fim.isoformat(), fim_txt, pal), encoding="utf-8")
    (out / "robots.txt").write_text("User-agent: *\nDisallow: /\n", encoding="utf-8")
    nome = ctx["lead"]["empresa"] or ctx["lead"]["nome"]
    resumo = {
        "titulo": f"Proposta para {nome}", "validade_ate": fim.isoformat(), "arquivos": ["index.html", "robots.txt"],
        "publicavel": not pend, "pendencias": pend, "avisos": avisos,
        "botao": "whatsapp" if ctx["cta_url"].startswith("https://wa.me") else "checkout",
    }
    (out / "resumo.json").write_text(json.dumps(resumo, ensure_ascii=False, indent=2), encoding="utf-8")
    for p in pend:
        print("PENDENCIA:", p)
    print(f"OK -> {out / 'index.html'} (válida até {fim_txt})")
    return 2 if pend else 0


if __name__ == "__main__":
    sys.exit(main())
