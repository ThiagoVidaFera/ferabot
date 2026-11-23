#!/usr/bin/env python3
"""WhatsApp do dono numa VPS DELE, ligado ao painel.

Fase 1 (este script): WhatsApp por QR code (WAHA) com HTTPS automático (Caddy).
Fase 2 (depois, guiada pelo /fera): API oficial do WhatsApp da Meta, sem servidor.

O dono contrata a VPS (Ubuntu 22.04 ou 24.04). Nenhuma senha passa pelo chat: o FERABOT
cria uma chave SSH neste computador e o dono cola a parte pública no painel da VPS.

Uso:
  python ScriptsFera/whatsapp_vps.py chave-ssh
  python ScriptsFera/whatsapp_vps.py instalar --ip 203.0.113.10 [--dominio whatsapp.seudominio.com.br]
  python ScriptsFera/whatsapp_vps.py estado
"""
from __future__ import annotations

import argparse
import ipaddress
import json
import re
import secrets
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

import painel

ROOT_DIR = Path(__file__).resolve().parent.parent
ESTADO_PATH = ROOT_DIR / "whatsapp.json"
CHAVE_SSH = Path.home() / ".ssh" / "ferabot_whatsapp"
IMAGEM_WAHA = "devlikeapro/waha:noweb"
IMAGEM_CADDY = "caddy:2.8"
SESSAO = "principal"
TEMPO_INSTALACAO_S = 1200
TENTATIVAS_HTTPS = 30
PAUSA_HTTPS_S = 10
DOMINIO_VALIDO = re.compile(r"^(?=.{4,200}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$")


class ErroWhatsapp(Exception):
    """Falha com a mensagem que o dono pode ler."""


# ── regras puras ────────────────────────────────────────────────────────────
def validar_ip(ip: str) -> str:
    try:
        endereco = ipaddress.IPv4Address(ip.strip())
    except ValueError as erro:
        raise ErroWhatsapp("IP inválido. Copie o IPv4 da VPS no painel do provedor (ex.: 203.0.113.10).") from erro
    if not endereco.is_global:
        raise ErroWhatsapp("Esse IP não é público. Use o IP da VPS que aparece no painel do provedor.")
    return str(endereco)


def validar_dominio(dominio: str) -> str:
    limpo = dominio.strip().lower().rstrip(".")
    if not DOMINIO_VALIDO.match(limpo):
        raise ErroWhatsapp("Domínio inválido. Use algo como whatsapp.seudominio.com.br")
    return limpo


def dominio_padrao(ip: str) -> str:
    """Sem domínio próprio, o sslip.io dá um nome que aponta para o IP, e o Caddy tira o certificado."""
    return f"{ip.replace('.', '-')}.sslip.io"


def caddyfile(dominio: str) -> str:
    # só a API sai para a internet: painel, swagger e qualquer outra rota do WAHA ficam de fora
    return f"""{dominio} {{
\t@api path /api/* /ping
\thandle @api {{
\t\treverse_proxy waha:3000
\t}}
\thandle {{
\t\trespond 404
\t}}
}}
"""


def compose(chave: str) -> str:
    return f"""services:
  waha:
    image: {IMAGEM_WAHA}
    restart: unless-stopped
    environment:
      WHATSAPP_DEFAULT_ENGINE: NOWEB
      WHATSAPP_API_KEY: "{chave}"
      WAHA_PRINT_QR: "False"
      WHATSAPP_SWAGGER_ENABLED: "False"
      WAHA_DASHBOARD_ENABLED: "False"
      TZ: America/Sao_Paulo
    volumes:
      - sessoes:/app/.sessions
  caddy:
    image: {IMAGEM_CADDY}
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-dados:/data
    depends_on:
      - waha
volumes:
  sessoes:
  caddy-dados:
"""


def script_remoto(dominio: str, chave: str) -> str:
    """Roda na VPS como root. Idempotente: rodar de novo só reaplica a configuração."""
    return f"""set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh >/dev/null
fi
if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  ufw allow 22/tcp >/dev/null; ufw allow 80/tcp >/dev/null; ufw allow 443/tcp >/dev/null
fi
mkdir -p /opt/whatsapp && cd /opt/whatsapp && umask 077
cat > Caddyfile <<'FERABOT_CADDY'
{caddyfile(dominio)}FERABOT_CADDY
cat > docker-compose.yml <<'FERABOT_COMPOSE'
{compose(chave)}FERABOT_COMPOSE
chmod 644 Caddyfile
docker compose pull -q
docker compose up -d --remove-orphans >/dev/null
echo whatsapp-ok
"""


# ── estado local ────────────────────────────────────────────────────────────
def ler_estado(caminho: Path | None = None) -> dict[str, str]:
    caminho = caminho or ESTADO_PATH
    if not caminho.exists():
        return {}
    try:
        dado = json.loads(caminho.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return dado if isinstance(dado, dict) else {}


def gravar_estado(dado: dict[str, str], caminho: Path | None = None) -> None:
    caminho = caminho or ESTADO_PATH
    caminho.write_text(json.dumps(dado, ensure_ascii=False, indent=2), encoding="utf-8")


def chave_do_servidor(estado: dict[str, str]) -> str:
    """Reaproveita a chave de uma instalação anterior: trocar a chave desligaria o painel."""
    return estado.get("chave") or secrets.token_hex(24)


# ── VPS ─────────────────────────────────────────────────────────────────────
def rodar_na_vps(ip: str, script: str, usuario: str = "root") -> str:
    if not CHAVE_SSH.exists():
        raise ErroWhatsapp("Falta a chave SSH. Rode primeiro: python ScriptsFera/whatsapp_vps.py chave-ssh")
    r = subprocess.run(
        ["ssh", "-i", str(CHAVE_SSH), "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=accept-new",
         "-o", "ConnectTimeout=20", f"{usuario}@{ip}", "bash -s"],
        input=script.encode("utf-8"), capture_output=True, timeout=TEMPO_INSTALACAO_S,
    )
    if r.returncode == 255:
        raise ErroWhatsapp(
            "Não consegui entrar na VPS. Confira se colou a chave pública no painel do provedor "
            "e se a VPS está ligada."
        )
    if r.returncode != 0:
        raise ErroWhatsapp(f"A instalação parou na VPS: {r.stderr.decode('utf-8', 'replace').strip()[-400:]}")
    return r.stdout.decode("utf-8", "replace")


def servidor_responde(url: str, chave: str) -> bool:
    pedido = urllib.request.Request(f"{url}/api/sessions?all=true", headers={"X-Api-Key": chave})
    try:
        with urllib.request.urlopen(pedido, timeout=15) as resposta:  # noqa: S310 (https montado aqui)
            return resposta.status == 200
    except (urllib.error.URLError, TimeoutError, OSError):
        return False


def esperar_https(url: str, chave: str) -> bool:
    for tentativa in range(1, TENTATIVAS_HTTPS + 1):
        if servidor_responde(url, chave):
            return True
        print(f"  aguardando o certificado HTTPS ({tentativa}/{TENTATIVAS_HTTPS})…")
        time.sleep(PAUSA_HTTPS_S)
    return False


# ── comandos ────────────────────────────────────────────────────────────────
def cmd_chave_ssh(_: argparse.Namespace) -> None:
    if not CHAVE_SSH.exists():
        CHAVE_SSH.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            ["ssh-keygen", "-t", "ed25519", "-N", "", "-C", "ferabot-whatsapp", "-f", str(CHAVE_SSH)],
            check=True, capture_output=True,
        )
    publica = CHAVE_SSH.with_suffix(".pub").read_text(encoding="utf-8").strip()
    print("Cole esta chave pública no painel da sua VPS (Chaves SSH / SSH keys):\n")
    print(publica)


def cmd_instalar(args: argparse.Namespace) -> None:
    ip = validar_ip(args.ip)
    dominio = validar_dominio(args.dominio) if args.dominio else dominio_padrao(ip)
    url = f"https://{dominio}"
    estado = ler_estado()
    chave = chave_do_servidor(estado)
    gravar_estado({**estado, "ip": ip, "dominio": dominio, "url": url, "chave": chave})

    print(f"Instalando o WhatsApp na VPS {ip} (5 a 15 minutos na primeira vez)…")
    rodar_na_vps(ip, script_remoto(dominio, chave), args.usuario)
    if not esperar_https(url, chave):
        raise ErroWhatsapp(
            f"O servidor subiu, mas {url} não respondeu por HTTPS. Se usou domínio próprio, confira se o "
            f"registro A aponta para {ip} e rode de novo."
        )
    print(f"Servidor no ar: {url}")

    if not painel.conectado():
        print("FERABOT ainda não está ligado ao painel. Ligue pelo passo 1 da Jornada e rode de novo.")
        return
    resposta = painel.ligar_whatsapp(url, chave, SESSAO)
    print(resposta.get("msg", "Servidor ligado ao painel."))


def cmd_estado(_: argparse.Namespace) -> None:
    estado = ler_estado()
    if not estado.get("url"):
        print("Nenhum WhatsApp instalado por aqui ainda.")
        return
    no_ar = servidor_responde(estado["url"], estado.get("chave", ""))
    print(f"Servidor {estado['url']}: {'respondendo' if no_ar else 'sem resposta'}")
    if painel.conectado():
        print(f"No painel: {painel.estado_whatsapp().get('status', 'desconhecido')}")


def main() -> None:
    for fluxo in (sys.stdout, sys.stderr):
        try:
            fluxo.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)
        except (AttributeError, ValueError):
            pass
    parser = argparse.ArgumentParser(description="WhatsApp do dono numa VPS dele, ligado ao painel.")
    sub = parser.add_subparsers(dest="comando", required=True)
    sub.add_parser("chave-ssh").set_defaults(fn=cmd_chave_ssh)
    instalar = sub.add_parser("instalar")
    instalar.add_argument("--ip", required=True)
    instalar.add_argument("--dominio", default="")
    instalar.add_argument("--usuario", default="root")
    instalar.set_defaults(fn=cmd_instalar)
    sub.add_parser("estado").set_defaults(fn=cmd_estado)
    args = parser.parse_args()
    try:
        args.fn(args)
    except (ErroWhatsapp, painel.ErroPainel, subprocess.TimeoutExpired) as erro:
        print(f"[ERRO] {erro}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
