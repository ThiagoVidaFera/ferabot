#!/usr/bin/env python3
"""CRM FERA: prepara, sobe e confere o CRM com WhatsApp e robôs (pasta CrmFera/).

Comandos:
  negocio                 gera CrmFera/negocio.json a partir de perfil.json (+ funil e agente, se existirem)
                          e lista os campos que faltam (o Claude pergunta e completa)
  faltando                só lista o que falta no negocio.json
  env                     cria CrmFera/.env com segredos aleatórios (não sobrescreve o que existe)
  docker                  confere se o Docker está instalado e rodando
  subir                   docker compose up -d --build
  parar                   docker compose down (os dados ficam)
  status                  containers + saúde do CRM
  logs [servico]          últimas linhas de log (crm, waha ou relogio)
  abrir                   abre o CRM no navegador
"""
from __future__ import annotations

import argparse
import json
import secrets
import shutil
import subprocess
import sys
import urllib.request
import webbrowser
from pathlib import Path
from typing import Any

for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[union-attr]
    except (AttributeError, ValueError):
        pass

ROOT = Path(__file__).resolve().parent.parent
CRM = ROOT / "CrmFera"
NEGOCIO = CRM / "negocio.json"
ENV = CRM / ".env"
PORTA_PADRAO = "3900"

# campo do negocio.json -> pergunta que o Claude faz à cliente quando falta
OBRIGATORIOS: dict[str, str] = {
    "nome": "Qual nome aparece no topo do CRM (o nome do seu negócio)?",
    "dono.nome": "Seu nome completo, como o lead conhece você?",
    "dono.primeiroNome": "Como o lead te chama (primeiro nome)?",
    "dono.whatsapp": "Seu WhatsApp para receber os avisos de lead (55 + DDD + número)?",
    "dono.instagram": "Seu @ no Instagram?",
    "nicho": "Qual o seu nicho?",
    "publico": "Quem compra de você (em uma frase)?",
    "promessa": "Qual resultado você entrega, em uma frase?",
    "links.agendamento": "Qual o link da sua página de agendamento?",
    "ofertas.0.nome": "Nome do seu serviço principal?",
    "ofertas.0.comoFalar": "Como você fala o preço (ex.: R$ 3.000 à vista ou 10x de R$ 330)?",
    "ofertas.0.link": "Link da página que vende o serviço (ou a de agendamento)?",
}
EXEMPLOS = {"Seu Nome", "Meu Negócio", "@seuperfil", "5511999999999", "o seu nicho", "quem compra de você",
            "o resultado que você entrega", "https://exemplo.com/agendar", "Seu serviço principal",
            "https://exemplo.com/oferta", "R$ 2.000 à vista ou 10x de R$ 230 no cartão"}


def ler_json(caminho: Path) -> dict[str, Any]:
    if not caminho.exists():
        return {}
    try:
        return json.loads(caminho.read_text(encoding="utf-8"))
    except json.JSONDecodeError as erro:
        print(f"[ERRO] {caminho} não é um JSON válido: {erro}", file=sys.stderr)
        sys.exit(1)


def pegar(dado: Any, chave: str) -> Any:
    for parte in chave.split("."):
        if isinstance(dado, list):
            dado = dado[int(parte)] if parte.isdigit() and int(parte) < len(dado) else None
        elif isinstance(dado, dict):
            dado = dado.get(parte)
        else:
            return None
    return dado


def so_digitos(valor: str) -> str:
    return "".join(c for c in str(valor or "") if c.isdigit())


def montar_negocio(perfil: dict[str, Any], funil: dict[str, Any], atual: dict[str, Any]) -> dict[str, Any]:
    """Novo negocio.json: o que já existe vence, o perfil preenche o vazio."""
    nome = perfil.get("nome", "")
    whatsapp = so_digitos(pegar(funil, "dono.whatsapp") or pegar(funil, "whatsapp") or "")
    preco = perfil.get("preco", "")
    link = perfil.get("landing_page", "")
    base: dict[str, Any] = {
        "nome": perfil.get("negocio") or nome,
        "dono": {
            "nome": nome,
            "primeiroNome": nome.split(" ")[0] if nome else "",
            "instagram": perfil.get("handle_instagram", ""),
            "whatsapp": whatsapp,
            "email": perfil.get("email", ""),
        },
        "assistente": {"apresentacao": f"da equipe de {nome.split(' ')[0]}" if nome else ""},
        "nicho": perfil.get("nicho", ""),
        "publico": perfil.get("publico", ""),
        "promessa": perfil.get("promessa", ""),
        "qualificacao": ["o que a pessoa faz", "o que ela quer resolver", "o que já tentou"],
        "links": {"agendamento": pegar(funil, "url") or "", "suporte": f"https://wa.me/{whatsapp}" if whatsapp else "",
                  "proposta": "", "isca": "", "grupo": ""},
        "reuniao": {"duracaoMin": 20, "formato": "Google Meet"},
        "ofertas": [{
            "slug": "principal", "nome": perfil.get("produto", ""), "paraQuem": perfil.get("publico", ""),
            "comoFalar": preco, "precoAVista": preco, "parcelamento": "", "link": link, "fecha": "call",
            "garantia": "", "garantiaCurta": "", "acesso": "", "posicionamento": "", "transformacao": "",
            "entregas": [], "bonus": [], "urgenciaReal": "", "naoDizer": [],
        }],
        "entrada": {"slug": "", "nome": "", "preco": "", "link": "", "garantia": ""},
        "valoresDeQualificacao": [],
        "fusoHorario": "America/Sao_Paulo",
        "janela": {"inicio": 9, "fim": 19, "diasSemana": [1, 2, 3, 4, 5, 6]},
    }
    return mesclar(base, atual)


def mesclar(base: dict[str, Any], atual: dict[str, Any]) -> dict[str, Any]:
    saida = dict(base)
    for chave, valor in atual.items():
        if isinstance(valor, dict) and isinstance(base.get(chave), dict):
            saida[chave] = mesclar(base[chave], valor)
        elif valor not in ("", None, [], {}):
            saida[chave] = valor
    return saida


def faltando(negocio: dict[str, Any]) -> list[tuple[str, str]]:
    falta = []
    for chave, pergunta in OBRIGATORIOS.items():
        valor = pegar(negocio, chave)
        if not valor or str(valor).strip() in EXEMPLOS:
            falta.append((chave, pergunta))
    return falta


def cmd_negocio(_: argparse.Namespace) -> None:
    perfil = ler_json(ROOT / "perfil.json")
    funil = ler_json(ROOT / "output" / "paginas" / "reuniao-fantasma" / "funil.json")
    novo = montar_negocio(perfil, funil, ler_json(NEGOCIO))
    NEGOCIO.write_text(json.dumps(novo, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"negocio.json salvo em {NEGOCIO}")
    imprimir_faltando(novo)


def imprimir_faltando(negocio: dict[str, Any]) -> None:
    falta = faltando(negocio)
    if not falta:
        print("Nada faltando.")
        return
    print(f"Faltam {len(falta)} campo(s). Pergunte à cliente, um por vez, e grave no negocio.json:")
    for chave, pergunta in falta:
        print(f"  - {chave}: {pergunta}")


def cmd_faltando(_: argparse.Namespace) -> None:
    imprimir_faltando(ler_json(NEGOCIO))


def cmd_env(_: argparse.Namespace) -> None:
    existentes: dict[str, str] = {}
    if ENV.exists():
        for linha in ENV.read_text(encoding="utf-8").splitlines():
            if "=" in linha and not linha.strip().startswith("#"):
                k, v = linha.split("=", 1)
                existentes[k.strip()] = v.strip()
    raiz_env = {}
    if (ROOT / ".env").exists():
        for linha in (ROOT / ".env").read_text(encoding="utf-8").splitlines():
            if "=" in linha and not linha.strip().startswith("#"):
                k, v = linha.split("=", 1)
                raiz_env[k.strip()] = v.strip().strip('"').strip("'")
    perfil = ler_json(ROOT / "perfil.json")
    padrao = {
        "CRM_PORTA": PORTA_PADRAO,
        "SESSION_SECRET": secrets.token_hex(32),
        "WAHA_APIKEY": secrets.token_hex(24),
        "WAHA_SESSION": "principal",
        "CRON_FILA_TOKEN": secrets.token_hex(16),
        "WEBHOOK_VENDA_TOKEN": secrets.token_hex(16),
        "WEBHOOK_TOKEN": secrets.token_hex(16),
        "GEMINI_API_KEY": raiz_env.get("GEMINI_API_KEY", perfil.get("api_gemini", "")),
        "SEED_EMAIL": perfil.get("email", "") or "dono@crm.local",
        "SEED_NOME": perfil.get("nome", "") or "Dono",
        "SEED_SENHA": secrets.token_urlsafe(9),
    }
    final = {**padrao, **{k: v for k, v in existentes.items() if v}}
    ENV.write_text("".join(f"{k}={v}\n" for k, v in final.items()), encoding="utf-8")
    print(f".env do CRM salvo em {ENV}")
    print(f"Login do CRM: {final['SEED_EMAIL']}  senha: {final['SEED_SENHA']}  (troque depois em Configurações)")
    if not final["GEMINI_API_KEY"]:
        print("[AVISO] Sem GEMINI_API_KEY: os robôs não respondem. Rode SetupFera/setup_chaves.py.")


def docker_ok() -> bool:
    if not shutil.which("docker"):
        print("Docker não está instalado. Baixe o Docker Desktop: https://www.docker.com/products/docker-desktop/")
        return False
    r = subprocess.run(["docker", "info"], capture_output=True, text=True)
    if r.returncode != 0:
        print("O Docker está instalado mas não está rodando. Abra o Docker Desktop e espere ficar verde.")
        return False
    return True


def compose(*args: str) -> int:
    return subprocess.run(["docker", "compose", *args], cwd=CRM).returncode


def cmd_docker(_: argparse.Namespace) -> None:
    print("Docker ok." if docker_ok() else "")


def cmd_subir(_: argparse.Namespace) -> None:
    if not NEGOCIO.exists():
        sys.exit("Falta o negocio.json. Rode: python ScriptsFera/crm.py negocio")
    if not ENV.exists():
        sys.exit("Falta o .env do CRM. Rode: python ScriptsFera/crm.py env")
    if faltando(ler_json(NEGOCIO)):
        print("[AVISO] O negocio.json ainda tem campos de exemplo. Os robôs vão falar com dados errados.")
    if not docker_ok():
        sys.exit(1)
    sys.exit(compose("up", "-d", "--build"))


def cmd_parar(_: argparse.Namespace) -> None:
    sys.exit(compose("down"))


def porta() -> str:
    for linha in (ENV.read_text(encoding="utf-8").splitlines() if ENV.exists() else []):
        if linha.startswith("CRM_PORTA="):
            return linha.split("=", 1)[1].strip() or PORTA_PADRAO
    return PORTA_PADRAO


def cmd_status(_: argparse.Namespace) -> None:
    compose("ps")
    url = f"http://localhost:{porta()}/api/health"
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            print(f"CRM respondendo ({r.status}) em http://localhost:{porta()}")
    except OSError as erro:
        print(f"CRM não respondeu em {url}: {erro}")


def cmd_logs(args: argparse.Namespace) -> None:
    sys.exit(compose("logs", "--tail", "80", *( [args.servico] if args.servico else [])))


def cmd_abrir(_: argparse.Namespace) -> None:
    url = f"http://localhost:{porta()}"
    webbrowser.open(url)
    print(url)


def main() -> None:
    p = argparse.ArgumentParser(description="CRM FERA")
    sub = p.add_subparsers(dest="cmd", required=True)
    for nome, fn in [("negocio", cmd_negocio), ("faltando", cmd_faltando), ("env", cmd_env),
                     ("docker", cmd_docker), ("subir", cmd_subir), ("parar", cmd_parar),
                     ("status", cmd_status), ("abrir", cmd_abrir)]:
        sub.add_parser(nome).set_defaults(fn=fn)
    lg = sub.add_parser("logs")
    lg.add_argument("servico", nargs="?")
    lg.set_defaults(fn=cmd_logs)
    args = p.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
