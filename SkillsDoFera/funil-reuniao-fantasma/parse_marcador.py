#!/usr/bin/env python3
"""Lê o marcador [AGENDAMENTO] de uma mensagem de WhatsApp e (opcional) registra o lead no CRM local.

Contrato (uma linha, campos separados por " | "):
  [AGENDAMENTO] AAAA-MM-DD HH:MM | Nome | @instagram | 55DDDNUMERO
Linhas opcionais logo abaixo, uma por pergunta:
  [CONTEXTO] <pergunta> | <resposta>

Uso:
  python SkillsDoFera/funil-reuniao-fantasma/parse_marcador.py "<texto da mensagem>"
  python SkillsDoFera/funil-reuniao-fantasma/parse_marcador.py --arquivo msg.txt --registrar
Saída: JSON em stdout. Sem marcador: código de saída 2 (mensagem comum, não é agendamento).
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

MARCADOR = re.compile(
    r"^\[AGENDAMENTO\]\s+(\d{4}-\d{2}-\d{2})\s+([01]\d|2[0-3]):([0-5]\d)\s+\|\s+(.+?)\s+\|\s+(@[A-Za-z0-9._]{1,30}|-)\s+\|\s+(55\d{10,11})\s*$",
    re.M,
)
CONTEXTO = re.compile(r"^\[CONTEXTO\]\s+(.+?)\s+\|\s+(.+?)\s*$", re.M)
ORIGEM = "funil-reuniao-fantasma"
RAIZ = Path(__file__).resolve().parents[2]


def parse(texto: str) -> dict | None:
    m = MARCADOR.search(texto)
    if not m:
        return None
    data, hh, mm, nome, insta, zap = m.groups()
    return {
        "data": data, "hora": f"{hh}:{mm}", "nome": nome, "instagram": insta, "whatsapp": zap,
        "contexto": [{"pergunta": p, "resposta": r} for p, r in CONTEXTO.findall(texto)],
    }


def registrar(ag: dict) -> int:
    nota = f"Reunião {ag['data']} {ag['hora']} | {ag['instagram']}"
    for c in ag["contexto"]:
        nota += " | " + c["pergunta"] + ": " + c["resposta"]
    cmd = [sys.executable, str(RAIZ / "ScriptsFera" / "leads-api.py"), "add", ag["nome"],
           "--tel", ag["whatsapp"], "--origem", ORIGEM, "--nota", nota]
    return subprocess.run(cmd, check=False).returncode


def principal() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("texto", nargs="?", default="")
    ap.add_argument("--arquivo")
    ap.add_argument("--registrar", action="store_true", help="grava no CRM local (leads-api.py add)")
    a = ap.parse_args()
    texto = Path(a.arquivo).read_text(encoding="utf-8") if a.arquivo else a.texto
    ag = parse(texto)
    if ag is None:
        print("[SEM MARCADOR] não é um agendamento do funil.", file=sys.stderr)
        return 2
    print(json.dumps(ag, ensure_ascii=False, indent=2))
    return registrar(ag) if a.registrar else 0


if __name__ == "__main__":
    sys.exit(principal())
