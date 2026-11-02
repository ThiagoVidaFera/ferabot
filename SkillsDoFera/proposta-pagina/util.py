"""Funções pequenas compartilhadas pelos layouts da proposta."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from html import escape as _esc

VALIDADE_DIAS = 3  # regra fixa: a proposta sempre vale 3 dias
FUSO = timezone(timedelta(hours=-3))


def e(texto: str) -> str:
    return _esc(str(texto), quote=True)


def brl(n: float) -> str:
    return "R$ " + f"{n:,.0f}".replace(",", ".")


def dmy(d: date) -> str:
    return d.strftime("%d/%m/%Y")


def validade(emitida: date) -> tuple[datetime, str]:
    fim = datetime.combine(emitida + timedelta(days=VALIDADE_DIAS), datetime.max.time().replace(microsecond=0), FUSO)
    return fim, f"{dmy(fim.date())}, 23h59"


def lista_html(itens: list[dict]) -> str:
    return "".join(f'<li><strong>{e(i["t"])}</strong> {i.get("d_html") or e(i.get("d", ""))}</li>' for i in itens)
