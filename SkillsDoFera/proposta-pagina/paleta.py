"""Paleta da proposta a partir de cor_primaria e cor_secundaria do perfil.json.

O CSS-base foi escrito com uma paleta literal. Aqui os valores literais são trocados por tons derivados das
duas cores do cliente, com checagem de contraste para o texto continuar legível.
"""
from __future__ import annotations

import re

PADRAO_PRIMARIA = "#2A5C9A"
PADRAO_SECUNDARIA = "#0F1E33"
_HEX = re.compile(r"^#?([0-9a-fA-F]{6})$")


def parse_hex(valor: str | None, padrao: str) -> tuple[int, int, int]:
    m = _HEX.match((valor or "").strip())
    h = m.group(1) if m else padrao.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def hexa(c: tuple[int, int, int]) -> str:
    return "#{:02X}{:02X}{:02X}".format(*(max(0, min(255, round(v))) for v in c))


def misturar(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    """t=0 devolve a, t=1 devolve b."""
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))  # type: ignore[return-value]


def luminancia(c: tuple[int, int, int]) -> float:
    def f(v: float) -> float:
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2])


def contraste(a: tuple[int, int, int], b: tuple[int, int, int]) -> float:
    la, lb = sorted((luminancia(a), luminancia(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def garantir_contraste(cor, fundo, minimo: float, alvo=None):
    """Clareia ou escurece `cor` (em direção a `alvo`) até atingir o contraste mínimo contra `fundo`."""
    branco, preto = (255, 255, 255), (0, 0, 0)
    alvo = alvo or (branco if luminancia(fundo) < 0.4 else preto)
    atual = cor
    for i in range(21):
        if contraste(atual, fundo) >= minimo:
            return atual
        atual = misturar(cor, alvo, (i + 1) / 20)
    return atual


def texto_sobre(cor) -> str:
    return "#FFFFFF" if contraste(cor, (255, 255, 255)) >= contraste(cor, (20, 18, 16)) else "#141210"


def derivar(primaria: str | None, secundaria: str | None) -> dict:
    p = parse_hex(primaria, PADRAO_PRIMARIA)
    s = parse_hex(secundaria, PADRAO_SECUNDARIA)
    noite = s if luminancia(s) < 0.06 else misturar(s, (0, 0, 0), 0.78)
    branco = (255, 255, 255)
    papel = (246, 245, 241)
    acc = garantir_contraste(p, papel, 3.0, (0, 0, 0))
    return {
        "p": p, "acc": acc, "acc_escuro": misturar(acc, (0, 0, 0), 0.24),
        "acc_sobre_noite": garantir_contraste(p, noite, 4.5, branco),
        "tinta_acc": texto_sobre(acc), "noite": noite,
        "n2": misturar(noite, branco, 0.07), "n3": misturar(noite, branco, 0.11),
        "n4": misturar(noite, branco, 0.2), "n5": misturar(noite, branco, 0.3),
        "tint": misturar(acc, branco, 0.88), "claro": misturar(acc, branco, 0.55),
    }


def aplicar(css: str, pal: dict) -> str:
    """Troca os valores literais do CSS-base pelos tons derivados e acrescenta os ajustes de contraste."""
    n = pal["noite"]
    mapa = {
        "#F04E14": hexa(pal["acc"]), "#C23A0A": hexa(pal["acc_escuro"]), "#FBE3D8": hexa(pal["tint"]),
        "#FFB69A": hexa(pal["claro"]), "240,78,20": "{},{},{}".format(*(round(v) for v in pal["acc"])),
        "#141210": hexa(n), "#0B0A09": hexa(misturar(n, (0, 0, 0), 0.4)), "#12110F": hexa(misturar(n, (0, 0, 0), 0.2)),
        "#221F1B": hexa(pal["n2"]), "#2A2622": hexa(pal["n3"]), "#2A2824": hexa(pal["n3"]),
        "#3B3631": hexa(pal["n4"]), "#4A443D": hexa(pal["n5"]), "20,18,16": "{},{},{}".format(*(round(v) for v in n)),
    }
    for velho, novo in mapa.items():
        css = css.replace(velho, novo).replace(velho.lower(), novo)
    sn, ti = hexa(pal["acc_sobre_noite"]), pal["tinta_acc"]
    extra = f"""
.capa,.inv,.fim3,.diag{{--acc:{sn};--acc-2:{sn}}}
.btn:not(.ghost){{color:{ti}}}
.capa .btn:not(.ghost),.inv .btn:not(.ghost),.fim3 .btn:not(.ghost){{color:{texto_sobre(pal['acc_sobre_noite'])}}}
.rail .btn,.barra .btn{{color:{ti}}}
.sobre-grid{{grid-template-columns:1fr!important}}
"""
    return css + extra
