#!/usr/bin/env python3
"""Google Agenda do dono (BYOK): cria e organiza agendas e marca eventos com link do Meet.

Chaves no .env da raiz: GCAL_CLIENT_ID, GCAL_CLIENT_SECRET (ou reaproveita YT_CLIENT_ID/YT_CLIENT_SECRET,
mesmo projeto do Google Cloud) e GCAL_REFRESH_TOKEN (gerado com `link` + `token`).

Comandos:
  link                                   imprime o link de autorização (abrir, autorizar, copiar o code=)
  token <code>                           troca o code pelo refresh token e grava GCAL_REFRESH_TOKEN no .env
  agendas                                lista as agendas
  organizar [--enviar]                   cria as agendas padrão do negócio (dry-run sem --enviar)
  eventos [--dias 7] [--agenda ID]       lista os próximos eventos
  livre --de "AAAA-MM-DD HH:MM" --ate "AAAA-MM-DD HH:MM"   horários ocupados no período
  marcar "<título>" --inicio "AAAA-MM-DD HH:MM" [--minutos 20] [--agenda ID] [--convidado email]
         [--descricao txt] [--meet] [--enviar]          cria o evento (dry-run sem --enviar)
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

from lib import carregar_env

for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[union-attr]
    except (AttributeError, ValueError):
        pass

ROOT = Path(__file__).resolve().parent.parent
FUSO = ZoneInfo("America/Sao_Paulo")
API = "https://www.googleapis.com/calendar/v3"
ESCOPO = "https://www.googleapis.com/auth/calendar"
REDIRECT = "http://localhost:8080"

# Agendas que o `organizar` cria. Cores: ids da paleta do Google Agenda (1 a 24).
AGENDAS_PADRAO = [
    ("Reuniões de venda", "reuniões de 20 minutos com lead (o que vem da página de agendamento)", "11"),
    ("Clientes", "entregas, calls e prazos de quem já comprou", "10"),
    ("Produção de conteúdo", "gravar, editar, publicar: bloco fixo na semana", "6"),
    ("Rotina do negócio", "responder leads, revisar anúncios, relatório da semana", "8"),
]


def cliente() -> tuple[str, str]:
    carregar_env()
    cid = os.environ.get("GCAL_CLIENT_ID") or os.environ.get("YT_CLIENT_ID", "")
    seg = os.environ.get("GCAL_CLIENT_SECRET") or os.environ.get("YT_CLIENT_SECRET", "")
    if not cid or not seg:
        sys.exit("[ERRO] Falta o Client ID/Secret do Google. Siga o API_SETUP.md, seção Google Agenda.")
    return cid, seg


def gravar_env(chave: str, valor: str) -> None:
    arquivo = ROOT / ".env"
    linhas = arquivo.read_text(encoding="utf-8").splitlines() if arquivo.exists() else []
    linhas = [l for l in linhas if not l.startswith(f"{chave}=")] + [f"{chave}={valor}"]
    arquivo.write_text("\n".join(linhas) + "\n", encoding="utf-8")


def post_form(url: str, campos: dict[str, str]) -> dict[str, Any]:
    corpo = urllib.parse.urlencode(campos).encode()
    try:
        with urllib.request.urlopen(urllib.request.Request(url, data=corpo), timeout=30) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as erro:
        sys.exit(f"[ERRO] Google respondeu {erro.code}: {erro.read().decode('utf-8', 'replace')[:300]}")


def access_token() -> str:
    cid, seg = cliente()
    refresh = os.environ.get("GCAL_REFRESH_TOKEN", "")
    if not refresh:
        sys.exit("[ERRO] Falta GCAL_REFRESH_TOKEN. Rode: python ScriptsFera/agenda.py link")
    dados = post_form("https://oauth2.googleapis.com/token", {
        "client_id": cid, "client_secret": seg, "refresh_token": refresh, "grant_type": "refresh_token"})
    return dados["access_token"]


def api(metodo: str, caminho: str, corpo: dict[str, Any] | None = None, query: dict[str, str] | None = None) -> dict[str, Any]:
    url = f"{API}{caminho}" + (f"?{urllib.parse.urlencode(query)}" if query else "")
    req = urllib.request.Request(url, method=metodo, data=json.dumps(corpo).encode() if corpo is not None else None,
                                 headers={"Authorization": f"Bearer {access_token()}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            texto = r.read()
            return json.loads(texto) if texto else {}
    except urllib.error.HTTPError as erro:
        detalhe = erro.read().decode("utf-8", "replace")[:300]
        if erro.code in (401, 403):
            sys.exit(f"[ERRO] Sem permissão na agenda ({erro.code}). Gere o token de novo: agenda.py link. {detalhe}")
        sys.exit(f"[ERRO] Google Agenda {erro.code}: {detalhe}")


def quando(texto: str) -> datetime:
    try:
        return datetime.strptime(texto, "%Y-%m-%d %H:%M").replace(tzinfo=FUSO)
    except ValueError:
        sys.exit(f"[ERRO] Data inválida: {texto!r}. Use AAAA-MM-DD HH:MM")


def montar_evento(titulo: str, inicio: datetime, minutos: int, convidado: str, descricao: str, meet: bool) -> dict[str, Any]:
    evento: dict[str, Any] = {
        "summary": titulo,
        "description": descricao,
        "start": {"dateTime": inicio.isoformat(), "timeZone": str(FUSO)},
        "end": {"dateTime": (inicio + timedelta(minutes=minutos)).isoformat(), "timeZone": str(FUSO)},
        "reminders": {"useDefault": False, "overrides": [{"method": "popup", "minutes": 60}, {"method": "popup", "minutes": 10}]},
    }
    if convidado:
        evento["attendees"] = [{"email": convidado}]
    if meet:
        evento["conferenceData"] = {"createRequest": {"requestId": uuid.uuid4().hex,
                                                      "conferenceSolutionKey": {"type": "hangoutsMeet"}}}
    return evento


def cmd_link(_: argparse.Namespace) -> None:
    cid, _ = cliente()
    q = urllib.parse.urlencode({"client_id": cid, "redirect_uri": REDIRECT, "response_type": "code",
                                "scope": ESCOPO, "access_type": "offline", "prompt": "consent"})
    print("Abra, entre com a conta da agenda, autorize e copie o valor de code= da página que abrir:")
    print(f"https://accounts.google.com/o/oauth2/auth?{q}")


def cmd_token(args: argparse.Namespace) -> None:
    cid, seg = cliente()
    code = urllib.parse.unquote(args.code.split("code=")[-1].split("&")[0])
    dados = post_form("https://oauth2.googleapis.com/token", {
        "client_id": cid, "client_secret": seg, "code": code, "grant_type": "authorization_code", "redirect_uri": REDIRECT})
    refresh = dados.get("refresh_token")
    if not refresh:
        sys.exit("[ERRO] O Google não devolveu refresh token. Gere o link de novo (ele já pede prompt=consent).")
    gravar_env("GCAL_REFRESH_TOKEN", refresh)
    print("GCAL_REFRESH_TOKEN gravado no .env. Teste: python ScriptsFera/agenda.py agendas")


def cmd_agendas(_: argparse.Namespace) -> None:
    for a in api("GET", "/users/me/calendarList").get("items", []):
        print(f"{a['id']}  |  {a.get('summary')}{'  (principal)' if a.get('primary') else ''}")


def cmd_organizar(args: argparse.Namespace) -> None:
    existentes = {a.get("summary") for a in api("GET", "/users/me/calendarList").get("items", [])}
    for nome, descricao, cor in AGENDAS_PADRAO:
        if nome in existentes:
            print(f"já existe: {nome}")
            continue
        if not args.enviar:
            print(f"[dry-run] criaria: {nome} ({descricao})")
            continue
        criada = api("POST", "/calendars", {"summary": nome, "description": descricao, "timeZone": str(FUSO)})
        api("PATCH", f"/users/me/calendarList/{urllib.parse.quote(criada['id'])}", {"colorId": cor}, {"colorRgbFormat": "false"})
        print(f"criada: {nome}  ->  {criada['id']}")


def cmd_eventos(args: argparse.Namespace) -> None:
    agora = datetime.now(FUSO)
    dados = api("GET", f"/calendars/{urllib.parse.quote(args.agenda)}/events", query={
        "timeMin": agora.isoformat(), "timeMax": (agora + timedelta(days=args.dias)).isoformat(),
        "singleEvents": "true", "orderBy": "startTime"})
    for e in dados.get("items", []):
        inicio = e.get("start", {}).get("dateTime") or e.get("start", {}).get("date")
        print(f"{inicio}  {e.get('summary', '(sem título)')}  {e.get('hangoutLink', '')}")


def cmd_livre(args: argparse.Namespace) -> None:
    ids = [a["id"] for a in api("GET", "/users/me/calendarList").get("items", [])]
    dados = api("POST", "/freeBusy", {"timeMin": quando(args.de).isoformat(), "timeMax": quando(args.ate).isoformat(),
                                      "timeZone": str(FUSO), "items": [{"id": i} for i in ids]})
    ocupado = sorted({(b["start"], b["end"]) for c in dados.get("calendars", {}).values() for b in c.get("busy", [])})
    print("Livre o período todo." if not ocupado else "\n".join(f"ocupado: {a} até {b}" for a, b in ocupado))


def cmd_marcar(args: argparse.Namespace) -> None:
    evento = montar_evento(args.titulo, quando(args.inicio), args.minutos, args.convidado, args.descricao, args.meet)
    if not args.enviar:
        print("[dry-run] evento que seria criado:")
        print(json.dumps(evento, ensure_ascii=False, indent=2))
        return
    criado = api("POST", f"/calendars/{urllib.parse.quote(args.agenda)}/events", evento,
                 {"conferenceDataVersion": "1", "sendUpdates": "all" if args.convidado else "none"})
    print(f"marcado: {criado.get('htmlLink')}")
    if criado.get("hangoutLink"):
        print(f"Meet: {criado['hangoutLink']}")


def main() -> None:
    p = argparse.ArgumentParser(description="Google Agenda do FERABOT")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("link").set_defaults(fn=cmd_link)
    t = sub.add_parser("token")
    t.add_argument("code")
    t.set_defaults(fn=cmd_token)
    sub.add_parser("agendas").set_defaults(fn=cmd_agendas)
    o = sub.add_parser("organizar")
    o.add_argument("--enviar", action="store_true")
    o.set_defaults(fn=cmd_organizar)
    e = sub.add_parser("eventos")
    e.add_argument("--dias", type=int, default=7)
    e.add_argument("--agenda", default="primary")
    e.set_defaults(fn=cmd_eventos)
    lv = sub.add_parser("livre")
    lv.add_argument("--de", required=True)
    lv.add_argument("--ate", required=True)
    lv.set_defaults(fn=cmd_livre)
    m = sub.add_parser("marcar")
    m.add_argument("titulo")
    m.add_argument("--inicio", required=True)
    m.add_argument("--minutos", type=int, default=20)
    m.add_argument("--agenda", default="primary")
    m.add_argument("--convidado", default="")
    m.add_argument("--descricao", default="")
    m.add_argument("--meet", action="store_true")
    m.add_argument("--enviar", action="store_true")
    m.set_defaults(fn=cmd_marcar)
    args = p.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
