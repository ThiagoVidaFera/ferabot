#!/usr/bin/env python3
"""Build do funil Reunião Fantasma: perfil.json + funil.json -> pasta com index.html pronto.

Uso:
  python SkillsDoFera/funil-reuniao-fantasma/build.py --perfil perfil.json \
      --funil output/paginas/reuniao-fantasma/funil.json --out output/paginas/reuniao-fantasma

Regras:
  - Campo de prova que o dono não tem ("[FONTE OMISSA: ...]") some da página e vira aviso.
  - Campo obrigatório ainda em "[FONTE OMISSA" ou "[VERIFICAR" trava o build.
  - A página final nunca sai com placeholder: o gate final varre o HTML.
"""
from __future__ import annotations

import argparse
import html
import json
import re
import shutil
import sys
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    if _s and getattr(_s, "encoding", "").lower() != "utf-8":
        try:
            _s.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass

AQUI = Path(__file__).parent
TPL = AQUI / "templates"
DIAS = {"dom": 0, "seg": 1, "ter": 2, "qua": 3, "qui": 4, "sex": 5, "sab": 6}
PEND = ("[FONTE OMISSA", "[VERIFICAR")
PROIBIDAS = ("automático", "automatico", "piloto automático", "sem esforço", "você só loga",
             "a ia cuida de tudo", "enquanto você dorme", "sem precisar fazer nada")


class ErroFunil(Exception):
    pass


# ---------------------------------------------------------------- utilidades
def ler_json(caminho: Path) -> dict:
    try:
        return json.loads(caminho.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise ErroFunil(f"Arquivo não existe: {caminho}")
    except json.JSONDecodeError as e:
        raise ErroFunil(f"JSON inválido em {caminho}: {e}")


def e(txt: object) -> str:
    return html.escape(str(txt), quote=True)


def pendente(v: object) -> bool:
    return isinstance(v, str) and any(v.strip().startswith(p) for p in PEND)


def texto(d: dict, chave: str, padrao: str) -> str:
    v = d.get(chave)
    if v is None or (isinstance(v, str) and not v.strip()):
        return padrao
    if pendente(v):
        raise ErroFunil(f"copy.{chave} ainda está pendente: {v}")
    return str(v).strip()


def lista(v: object, nome: str, obrigatoria: bool = False) -> list[str]:
    itens = [str(x).strip() for x in (v or []) if str(x).strip()]
    if any(pendente(x) for x in itens):
        raise ErroFunil(f"{nome} tem item pendente ([FONTE OMISSA]/[VERIFICAR]). Resolva com o dono.")
    if obrigatoria and not itens:
        raise ErroFunil(f"{nome} é obrigatório (mínimo 1 item).")
    return itens


# ---------------------------------------------------------------- cores
def hex_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    if not re.fullmatch(r"[0-9a-fA-F]{6}", h):
        raise ErroFunil(f"Cor inválida: #{h}")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def rgb_hex(r: float, g: float, b: float) -> str:
    return "#%02X%02X%02X" % (round(r), round(g), round(b))


def mistura(h: str, alvo: tuple[int, int, int], t: float) -> str:
    r, g, b = hex_rgb(h)
    return rgb_hex(r + (alvo[0] - r) * t, g + (alvo[1] - g) * t, b + (alvo[2] - b) * t)


def lum(h: str) -> float:
    def c(v: int) -> float:
        s = v / 255
        return s / 12.92 if s <= 0.03928 else ((s + 0.055) / 1.055) ** 2.4
    r, g, b = hex_rgb(h)
    return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b)


def contraste(a: str, b: str) -> float:
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def paleta(perfil: dict) -> dict[str, str]:
    p = perfil.get("cor_primaria") or "#1F3A5F"
    s = perfil.get("cor_secundaria") or ""
    hex_rgb(p)
    deep = mistura(p, (0, 0, 0), 0.62) if lum(p) > 0.04 else p
    # CTA do hero: a secundária se tiver contraste com o fundo escuro, senão branco
    cta = s if s and contraste(s, deep) >= 3 else "#FFFFFF"
    cta_ink = "#111111" if contraste(cta, "#111111") >= contraste(cta, "#FFFFFF") else "#FFFFFF"
    return {
        "p": p, "deep": deep, "deep2": mistura(deep, (255, 255, 255), 0.08),
        "soft": mistura(p, (255, 255, 255), 0.7), "cta_bg": cta, "cta_ink": cta_ink,
    }


# ---------------------------------------------------------------- validação do funil
def validar(funil: dict) -> dict:
    zap = re.sub(r"\D", "", str(funil.get("whatsapp_dono", "")))
    if zap.startswith("55") and len(zap) > 11:
        zap = zap[2:]
    if len(zap) not in (10, 11):
        raise ErroFunil("whatsapp_dono inválido: use DDD + número (ex.: 11999998888).")
    disp = funil.get("disponibilidade") or {}
    dias = [DIAS[d.lower()[:3]] for d in disp.get("dias", []) if d.lower()[:3] in DIAS]
    if not dias:
        raise ErroFunil('disponibilidade.dias vazio. Ex.: ["seg","ter","qua","qui","sex"].')
    horarios = [h for h in disp.get("horarios", []) if re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d", str(h))]
    if not horarios:
        raise ErroFunil('disponibilidade.horarios vazio ou fora do formato "HH:MM".')
    bloqueios = [b for b in disp.get("bloqueios", []) if re.fullmatch(r"\d{4}-\d{2}-\d{2}( \d{2}:\d{2})?", str(b))]
    pixel = str(funil.get("pixel_id") or "").strip()
    if pixel and not re.fullmatch(r"\d{8,20}", pixel):
        raise ErroFunil("pixel_id deve ter só dígitos (8 a 20).")
    perguntas = []
    for q in (funil.get("perguntas") or [])[:2]:
        rot = str(q.get("rotulo", "")).strip()
        if not rot or pendente(rot):
            raise ErroFunil("Toda pergunta precisa de 'rotulo'.")
        perguntas.append({"rotulo": rot, "placeholder": str(q.get("placeholder", "")),
                          "minimo": int(q.get("minimo", 8))})
    if not perguntas:
        raise ErroFunil("Defina ao menos 1 pergunta de contexto em funil.json (perguntas).")
    return {
        "whatsapp_dono": "55" + zap,
        "duracao": int(funil.get("duracao_min", 20)),
        "fuso": str(funil.get("fuso", "America/Sao_Paulo")),
        "dias_semana": sorted(set(dias)), "horarios": sorted(set(horarios)),
        "antecedencia_horas": int(disp.get("antecedencia_horas", 12)),
        "janela_dias": min(int(disp.get("janela_dias", 10)), 30),
        "bloqueios": bloqueios, "pixel_id": pixel, "perguntas": perguntas,
    }


# ---------------------------------------------------------------- blocos de HTML
def bloco_passos(c: dict, dono: str) -> str:
    padrao = [
        ("Escolha o horário", f"Ele fica reservado no seu nome assim que a sua mensagem chega no WhatsApp de {dono}."),
        ("Responda no WhatsApp", "Você manda a mensagem pronta e responde duas perguntas rápidas sobre o seu perfil."),
        ("A reunião acontece", f"Se o seu perfil encaixar, {dono} confirma e manda o link. Se não encaixar, avisa antes e libera o horário."),
    ]
    itens = c.get("passos") or padrao
    out = []
    for p in itens:
        t, d = (p if isinstance(p, (list, tuple)) else (p.get("titulo", ""), p.get("texto", "")))
        if pendente(t) or pendente(d):
            raise ErroFunil("copy.passos tem item pendente.")
        out.append(f"<li><b>{e(t)}</b>{e(d)}</li>")
    return "\n".join(out)


def bloco_faq(c: dict, dono: str) -> str:
    padrao = [
        ("O horário já fica garantido?", "Ele fica reservado quando a sua mensagem chega no meu WhatsApp. Se duas pessoas escolherem o mesmo horário, eu aviso na conversa e a gente encaixa outro."),
        ("E se eu não responder no WhatsApp?", "O horário é liberado e eu não apareço na reunião. Sem cobrança e sem constrangimento."),
        ("E se o meu perfil não encaixar?", "Eu te digo com franqueza antes da reunião. Se fizer sentido, indico o próximo passo."),
        ("Preciso preparar alguma coisa?", "Só as respostas do WhatsApp. É com elas que eu preparo a conversa antes de nos falarmos."),
    ] + [(q.get("pergunta", ""), q.get("resposta", "")) for q in c.get("faq_extra", [])]
    out = []
    for q, r in padrao:
        if pendente(q) or pendente(r):
            raise ErroFunil("copy.faq_extra tem item pendente.")
        if q and r:
            out.append(f"<details><summary>{e(q)}</summary><p>{e(r)}</p></details>")
    return "\n".join(out)


def bloco_perguntas(perguntas: list[dict]) -> str:
    out = []
    for i, q in enumerate(perguntas):
        out.append(f'<label>{e(q["rotulo"])}<textarea name="pergunta{i}" required maxlength="400" '
                   f'placeholder="{e(q["placeholder"])}"></textarea></label>')
    return "\n".join(out)


def bloco_provas(provas: list[dict], avisos: list[str]) -> str:
    ok = []
    for i, p in enumerate(provas or []):
        titulo, txt, fonte = (str(p.get(k, "")).strip() for k in ("titulo", "texto", "fonte"))
        if not (titulo and txt and fonte) or any(pendente(x) for x in (titulo, txt, fonte)):
            avisos.append(f"prova #{i + 1} fora da página: falta titulo, texto ou fonte. "
                          "Peça ao dono o dado real. Sem fonte, a prova não entra.")
            continue
        ok.append(f'<div class="prova"><b>{e(titulo)}</b>{e(txt)}<small>Fonte: {e(fonte)}</small></div>')
    return "\n".join(ok)


def secao(tpl: str, nome: str, manter: bool) -> str:
    padrao = re.compile(rf"<!--SEC:{nome}-->(.*?)<!--/SEC:{nome}-->", re.S)
    return padrao.sub(lambda m: m.group(1) if manter else "", tpl)


def preencher(tpl: str, simples: dict[str, str], brutos: dict[str, str]) -> str:
    tpl = re.sub(r"\{\{\{(\w+)\}\}\}", lambda m: brutos.get(m.group(1), m.group(0)), tpl)
    return re.sub(r"\{\{(\w+)\}\}", lambda m: e(simples[m.group(1)]) if m.group(1) in simples else m.group(0), tpl)


def copiar_imagem(origem: str, base: Path, out: Path, nome: str, avisos: list[str]) -> str:
    if not origem or pendente(origem):
        return ""
    src = (base / origem).resolve()
    if not src.is_file():
        avisos.append(f"imagem '{origem}' não encontrada. Página sai sem ela (imagem é opcional).")
        return ""
    destino = out / "img" / f"{nome}{src.suffix.lower()}"
    destino.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(src, destino)
    return f"img/{destino.name}"


# ---------------------------------------------------------------- montagem
def montar(perfil: dict, funil: dict, base: Path, out: Path) -> tuple[str, list[str]]:
    avisos: list[str] = []
    cfg = validar(funil)
    c = funil.get("copy") or {}
    nome = str(perfil.get("nome", "")).strip()
    if not nome or pendente(nome):
        raise ErroFunil("perfil.json sem 'nome'.")
    dono = nome.split()[0]
    cor = paleta(perfil)
    d = cfg["duracao"]

    para = lista(funil.get("para_quem"), "para_quem", True)
    nao = lista(funil.get("nao_para_quem"), "nao_para_quem", True)
    dores = lista(funil.get("dores"), "dores")
    provas_html = bloco_provas(funil.get("provas", []), avisos)
    if not provas_html:
        avisos.append("Página sem seção de prova. Registre no briefing: [FONTE OMISSA: prova real do dono].")
    ilus = copiar_imagem((funil.get("imagens") or {}).get("ilustracao", ""), base, out, "ilustracao", avisos)

    h = (perfil.get("handle_instagram") or "").lstrip("@").strip()
    links = []
    if re.fullmatch(r"[A-Za-z0-9._]{1,30}", h):
        links.append(f' &middot; <a href="https://instagram.com/{e(h)}" rel="noopener">@{e(h)}</a>')
    lp = str(perfil.get("landing_page") or "")
    if lp.startswith("https://"):
        links.append(f' &middot; <a href="{e(lp)}" rel="noopener">Site</a>')

    cta = texto(c, "cta", "Escolher meu horário")
    produto = str(perfil.get("produto", "")).strip()
    sub_padrao = (f"Você escolhe o horário agora e ele fica reservado. A reunião acontece depois que você "
                  f"responde duas perguntas no WhatsApp.")
    simples = {
        "titulo": texto(c, "titulo_pagina", f"Reunião de {d} minutos com {nome}"),
        "descricao": texto(c, "descricao", f"Agende {d} minutos com {nome}" + (f" para conversar sobre {produto}." if produto else ".")),
        "marca": nome, "dono": dono, "duracao": str(d),
        "h1": texto(c, "h1", f"{d} minutos com {dono}. Só para quem vai se preparar."),
        "sub": texto(c, "sub", sub_padrao),
        "cta": cta, "cta_enviar": texto(c, "cta_enviar", "Reservar meu horário e abrir o WhatsApp"),
        "microcopy": texto(c, "microcopy", "Leva menos de 1 minuto. Sem pagar nada para reservar."),
        "anim_1": texto(c, "anim_1", "Quinta, 15:00. Reservado."),
        "anim_2": texto(c, "anim_2", "Antes de confirmar: o que você quer resolver na reunião?"),
        "anim_3": texto(c, "anim_3", "Respondi. Esse é o meu momento."),
        "anim_4": texto(c, "anim_4", "Reunião confirmada"),
        "como_titulo": texto(c, "como_titulo", "Três passos. O primeiro é seu."),
        "dores_titulo": texto(c, "dores_titulo", "Isso soa familiar?"),
        "porque_titulo": texto(c, "porque_titulo", "Por que você escolhe o horário antes de conversar"),
        "prova_titulo": texto(c, "prova_titulo", "O que dá pra abrir e conferir"),
        "filtro_titulo": texto(c, "filtro_titulo", "Esta reunião não é para todo mundo"),
        "agenda_titulo": texto(c, "agenda_titulo", "Escolha o dia e o horário"),
        "agenda_sub": texto(c, "agenda_sub", f"Reunião de {d} minutos. Horários de Brasília."),
        "compromisso": texto(c, "compromisso", f"Entendi que a reunião só acontece depois que eu responder no WhatsApp."),
        "privacidade": texto(c, "privacidade", f"Ao enviar, o WhatsApp abre com a mensagem pronta para {dono}. Nada fica salvo nesta página."),
        "fecho_titulo": texto(c, "fecho_titulo", "O horário é seu antes da conversa começar."),
        "fecho_sub": texto(c, "fecho_sub", "Reserve agora. Se não rolar, quem desmarca sou eu, e você não perde nada."),
        "ilustracao": ilus,
    }
    porque_pad = [
        f"Reunião boa é a que junta duas pessoas preparadas. Por isso o horário fica no seu nome antes de qualquer conversa, mas a reunião só acontece depois que você responde no WhatsApp e eu entendo o seu momento.",
        "Isso protege o seu tempo e o meu. Quem não responde não ocupa a agenda de ninguém. Quem responde chega com a conversa já adiantada.",
    ]
    porque = c.get("porque") or porque_pad
    if any(pendente(x) for x in porque):
        raise ErroFunil("copy.porque tem item pendente.")
    brutos = {
        "css": "", "js": "",
        "pixel": "",
        "passos": bloco_passos(c, dono),
        "dores": "\n".join(f"<li>{e(x)}</li>" for x in dores),
        "porque": "\n".join(f"<p>{e(x)}</p>" for x in porque),
        "prova": provas_html,
        "nao_para_quem": "\n".join(f"<li>{e(x)}</li>" for x in nao),
        "para_quem": "\n".join(f"<li>{e(x)}</li>" for x in para),
        "perguntas": bloco_perguntas(cfg["perguntas"]),
        "faq": bloco_faq(c, dono),
        "rodape_links": "".join(links),
    }
    if cfg["pixel_id"]:
        pid = cfg["pixel_id"]
        brutos["pixel"] = ("<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?"
                           "n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;"
                           "n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;"
                           "s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',"
                           f"'https://connect.facebook.net/en_US/fbevents.js');fbq('init','{pid}');fbq('track','PageView');</script>")

    publico = {"whatsapp_dono": cfg["whatsapp_dono"], "dono": dono, "duracao": d, "fuso": cfg["fuso"],
               "dias_semana": cfg["dias_semana"], "horarios": cfg["horarios"],
               "antecedencia_horas": cfg["antecedencia_horas"], "janela_dias": cfg["janela_dias"],
               "bloqueios": cfg["bloqueios"], "perguntas": cfg["perguntas"]}
    brutos["config"] = json.dumps(publico, ensure_ascii=False).replace("</", "<\\/")
    brutos["css"] = preencher((TPL / "style.css").read_text(encoding="utf-8"), cor, {})
    brutos["js"] = (TPL / "app.js").read_text(encoding="utf-8").replace("</script", "<\\/script")

    pagina = (TPL / "index.html").read_text(encoding="utf-8")
    pagina = secao(pagina, "dores", bool(dores))
    pagina = secao(pagina, "prova", bool(provas_html))
    pagina = secao(pagina, "ilustracao", bool(ilus))
    return preencher(pagina, simples, brutos), avisos


def gate_final(pagina: str) -> None:
    problemas = []
    for p in PEND:
        if p in pagina:
            problemas.append(f"sobrou '{p}' na página")
    if re.search(r"\{\{\{?\w+\}\}\}?", pagina):
        problemas.append("sobrou placeholder {{...}} sem preencher")
    baixa = re.sub(r"<script>.*?</script>|<style>.*?</style>", "", pagina, flags=re.S).lower()
    for t in PROIBIDAS:
        if t in baixa:
            problemas.append(f"expressão proibida na copy: '{t}'")
    for ch, nome in (("—", "travessão"), ("–", "travessão"), (";", "ponto e vírgula")):
        if ch in re.sub(r"<script>.*?</script>|<style>.*?</style>|&\w+;|&#\d+;", "", pagina, flags=re.S):
            problemas.append(f"{nome} na copy")
    if problemas:
        raise ErroFunil("Gate final reprovou: " + "; ".join(problemas))


def principal() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--perfil", default="perfil.json")
    ap.add_argument("--funil", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    try:
        perfil = ler_json(Path(a.perfil))
        fp = Path(a.funil)
        funil = ler_json(fp)
        out = Path(a.out)
        out.mkdir(parents=True, exist_ok=True)
        pagina, avisos = montar(perfil, funil, fp.parent, out)
        gate_final(pagina)
    except ErroFunil as err:
        print(f"[ERRO] {err}", file=sys.stderr)
        return 1
    (out / "index.html").write_text(pagina, encoding="utf-8")
    for av in avisos:
        print(f"[AVISO] {av}")
    cfg = validar(funil)
    print(f"[OK] {out / 'index.html'} ({len(pagina) // 1024} KB)")
    print(f"     link de teste do WhatsApp: https://wa.me/{cfg['whatsapp_dono']}")
    return 0


if __name__ == "__main__":
    sys.exit(principal())
