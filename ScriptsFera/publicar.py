#!/usr/bin/env python3
"""Agenda feed, carrossel, story e reel pelo Post for Me, com a chave DO CLIENTE (BYOK).

Chave: POSTFORME_API_KEY no .env da raiz (guia no API_SETUP.md, seção 6).
Documentação da API usada aqui: https://api.postforme.dev/docs

Comandos:
  contas                                    lista as contas sociais conectadas
  agendar <pasta-ou-arquivos...> --formato feed|carrossel|story|reel
          --quando "AAAA-MM-DD HH:MM" [--legenda arquivo.txt] [--capa capa.png] [--conta <id>] [--enviar]
                                            padrão: só imprime o plano (DRY-RUN)
                                            com --enviar: sobe a mídia e cria o post agendado
  listar                                    posts agendados
  cancelar <id>                             apaga um post agendado

O horário de --quando é sempre de Brasília (America/Sao_Paulo). A API recebe em UTC.
"""
from __future__ import annotations

import argparse
import mimetypes
import os
import re
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib import carregar_env  # noqa: E402

for _stream in (sys.stdout, sys.stderr):
    if _stream and getattr(_stream, "encoding", "").lower() != "utf-8":
        try:
            _stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass

BASE_URL = "https://api.postforme.dev/v1"
ENV_CHAVE = "POSTFORME_API_KEY"
TIMEOUT_S = 60
FUSO_NOME = "America/Sao_Paulo"
# Brasil sem horário de verão desde 2019: -03:00 é o fallback quando o Windows não tem tzdata.
FUSO_FALLBACK = timezone(timedelta(hours=-3), "BRT")
MIN_ANTECEDENCIA = timedelta(minutes=5)

EXT_IMAGEM = {".png", ".jpg", ".jpeg", ".webp"}
EXT_VIDEO = {".mp4", ".mov", ".m4v"}
EXT_MIDIA = EXT_IMAGEM | EXT_VIDEO
NOME_LEGENDA = "legenda.txt"
LIMITE_CARROSSEL = 10  # limite do Instagram para carrossel

# formato do Ferabot -> placement do Instagram/Facebook na API (enum: reels, stories, timeline)
PLACEMENT = {"feed": "timeline", "carrossel": "timeline", "story": "stories", "reel": "reels"}
FORMATOS = tuple(PLACEMENT)


class ErroPublicar(Exception):
    """Erro com mensagem pronta para o dono ler."""


# ── Horário ───────────────────────────────────────────────────────────────

def fuso_brasilia():
    try:
        from zoneinfo import ZoneInfo
        return ZoneInfo(FUSO_NOME)
    except Exception:
        return FUSO_FALLBACK


def converter_quando(texto: str, agora_utc: datetime | None = None) -> datetime:
    """'AAAA-MM-DD HH:MM' de Brasília -> datetime em UTC. Recusa formato errado e horário passado."""
    try:
        local = datetime.strptime(texto.strip(), "%Y-%m-%d %H:%M")
    except ValueError as erro:
        raise ErroPublicar(f'Horário "{texto}" fora do formato. Use "AAAA-MM-DD HH:MM", ex.: "2026-11-20 18:30".') from erro
    em_utc = local.replace(tzinfo=fuso_brasilia()).astimezone(timezone.utc)
    agora = agora_utc or datetime.now(timezone.utc)
    if em_utc < agora + MIN_ANTECEDENCIA:
        raise ErroPublicar(f'Horário "{texto}" já passou ou está a menos de 5 minutos. Escolha um horário futuro.')
    return em_utc


def iso_utc(momento: datetime) -> str:
    return momento.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ── Mídia ─────────────────────────────────────────────────────────────────

def _chave_natural(caminho: Path):
    partes = re.split(r"(\d+)", caminho.name.lower())
    return [int(p) if p.isdigit() else p for p in partes]


def coletar_midias(entradas: list[str]) -> list[Path]:
    """Pasta ou arquivos -> lista de mídia na ordem certa.

    Numa pasta com slide-01, slide-02... só os slides entram, em ordem numérica
    (slide-2 antes de slide-10). Sem slides, entra toda imagem e vídeo da pasta.
    """
    arquivos: list[Path] = []
    for entrada in entradas:
        caminho = Path(entrada)
        if caminho.is_dir():
            da_pasta = [p for p in caminho.iterdir() if p.is_file() and p.suffix.lower() in EXT_MIDIA]
            slides = [p for p in da_pasta if re.match(r"slide[-_ ]?\d+", p.stem, re.IGNORECASE)]
            arquivos.extend(sorted(slides or da_pasta, key=_chave_natural))
        elif caminho.is_file():
            if caminho.suffix.lower() not in EXT_MIDIA:
                raise ErroPublicar(f"{caminho.name} não é imagem nem vídeo ({', '.join(sorted(EXT_MIDIA))}).")
            arquivos.append(caminho)
        else:
            raise ErroPublicar(f"Não achei: {caminho}")
    if not arquivos:
        raise ErroPublicar("Nenhuma imagem ou vídeo encontrado no que foi passado.")
    return arquivos


def validar_formato(formato: str, midias: list[Path]) -> None:
    videos = [m for m in midias if m.suffix.lower() in EXT_VIDEO]
    if formato == "feed" and len(midias) != 1:
        raise ErroPublicar(f"Feed é 1 arquivo só. Recebi {len(midias)}. Para vários, use --formato carrossel.")
    if formato == "carrossel":
        if len(midias) < 2:
            raise ErroPublicar("Carrossel precisa de pelo menos 2 arquivos.")
        if len(midias) > LIMITE_CARROSSEL:
            raise ErroPublicar(f"Carrossel aceita até {LIMITE_CARROSSEL} arquivos no Instagram. Recebi {len(midias)}.")
    if formato == "reel" and (len(midias) != 1 or len(videos) != 1):
        raise ErroPublicar("Reel é 1 vídeo só (.mp4 ou .mov).")


def ler_legenda(arquivo: str | None, midias: list[Path], formato: str) -> str:
    if arquivo:
        caminho = Path(arquivo)
        if not caminho.is_file():
            raise ErroPublicar(f"Legenda não encontrada: {caminho}")
        return caminho.read_text(encoding="utf-8-sig").strip()
    vizinha = midias[0].parent / NOME_LEGENDA
    if vizinha.is_file():
        return vizinha.read_text(encoding="utf-8-sig").strip()
    if formato == "story":
        return ""
    raise ErroPublicar(f"Faltou a legenda. Passe --legenda arquivo.txt ou salve {NOME_LEGENDA} na pasta da peça.")


# ── Plano ─────────────────────────────────────────────────────────────────

@dataclass
class Plano:
    formato: str
    quando_local: str
    quando_utc: datetime
    midias: list[Path]
    legenda: str
    contas: list[dict] = field(default_factory=list)
    capa: Path | None = None

    @property
    def placement(self) -> str:
        return PLACEMENT[self.formato]


def montar_plano(entradas: list[str], formato: str, quando: str, legenda_arquivo: str | None,
                 agora_utc: datetime | None = None, capa: str | None = None) -> Plano:
    if formato not in PLACEMENT:
        raise ErroPublicar(f"Formato inválido: {formato}. Use {', '.join(FORMATOS)}.")
    midias = coletar_midias(entradas)
    validar_formato(formato, midias)
    legenda = ler_legenda(legenda_arquivo, midias, formato)
    capa_path = None
    if capa:
        if formato != "reel":
            raise ErroPublicar("--capa só vale para reel.")
        capa_path = Path(capa)
        if not capa_path.is_file() or capa_path.suffix.lower() not in EXT_IMAGEM:
            raise ErroPublicar(f"Capa inválida: {capa_path} (precisa ser imagem .png ou .jpg).")
    return Plano(formato, quando.strip(), converter_quando(quando, agora_utc), midias, legenda, capa=capa_path)


def montar_payload(plano: Plano, urls_midia: list[str], ids_contas: list[str],
                   url_capa: str | None = None) -> dict:
    """Corpo do POST /v1/social-posts (campos conferidos em https://api.postforme.dev/docs)."""
    configuracao = {"placement": plano.placement}
    midia = [{"url": url, "index": i} for i, url in enumerate(urls_midia)]
    if url_capa and midia:
        midia[0] = {**midia[0], "thumbnail_url": url_capa}
    return {
        # caption é obrigatório na API. Story não mostra legenda, então espaço basta.
        "caption": plano.legenda or " ",
        "social_accounts": ids_contas,
        "scheduled_at": iso_utc(plano.quando_utc),
        "media": midia,
        "platform_configurations": {"instagram": dict(configuracao), "facebook": dict(configuracao)},
    }


def texto_plano(plano: Plano, enviar: bool) -> str:
    linhas = [
        "",
        "  PLANO DE AGENDAMENTO" + ("" if enviar else "  (DRY-RUN: nada foi enviado)"),
        f"  Formato : {plano.formato} (placement {plano.placement})",
        f"  Quando  : {plano.quando_local} em Brasília = {iso_utc(plano.quando_utc)} UTC",
    ]
    if plano.contas:
        for conta in plano.contas:
            linhas.append(f"  Conta   : {conta.get('platform')} @{conta.get('username')} ({conta.get('id')})")
    else:
        linhas.append("  Conta   : a definir no envio (use --conta <id>, veja `publicar.py contas`)")
    linhas.append(f"  Mídias  : {len(plano.midias)}")
    for i, midia in enumerate(plano.midias, 1):
        linhas.append(f"    {i:02d}. {midia.name}")
    if plano.capa:
        linhas.append(f"  Capa    : {plano.capa.name}")
    if plano.formato == "story" and len(plano.midias) > 1:
        linhas.append("  Obs.    : story com várias mídias vira um story por arquivo, na ordem acima.")
    legenda = plano.legenda or "(sem legenda)"
    linhas.append("  Legenda :")
    linhas.extend(f"    {l}" for l in legenda.splitlines())
    if not enviar:
        linhas += ["", "  Para agendar de verdade, rode o mesmo comando com --enviar."]
    return "\n".join(linhas)


# ── API ───────────────────────────────────────────────────────────────────

def _requests():
    try:
        import requests
        return requests
    except ImportError:
        print("[setup] Instalando requests (só na primeira vez)...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-q", "requests"], check=True)
        import requests
        return requests


def chave_api() -> str:
    carregar_env()
    chave = os.environ.get(ENV_CHAVE, "").strip()
    if not chave:
        raise ErroPublicar(f"{ENV_CHAVE} não configurada. Rode: python SetupFera/setup_chaves.py "
                           "(a conta é sua, em postforme.dev, guia no API_SETUP.md seção 6).")
    return chave


def api(metodo: str, caminho: str, chave: str, **kwargs):
    requests = _requests()
    url = f"{BASE_URL}{caminho}"
    cabecalhos = {"Authorization": f"Bearer {chave}", "Content-Type": "application/json"}
    try:
        resposta = requests.request(metodo, url, headers=cabecalhos, timeout=TIMEOUT_S, **kwargs)
    except requests.RequestException as erro:
        raise ErroPublicar(f"Sem resposta do Post for Me ({erro.__class__.__name__}). Confira a internet e tente de novo.") from erro
    if resposta.status_code == 401:
        raise ErroPublicar("A chave do Post for Me foi recusada (401). Gere outra no painel e rode setup_chaves.py.")
    if resposta.status_code == 404:
        raise ErroPublicar(f"O Post for Me não achou {caminho} (404).")
    if resposta.status_code >= 400:
        raise ErroPublicar(f"O Post for Me recusou {metodo} {caminho} ({resposta.status_code}): {resposta.text[:400]}")
    return resposta.json() if resposta.content else {}


def listar_contas(chave: str) -> list[dict]:
    return api("GET", "/social-accounts", chave, params={"limit": 100}).get("data", [])


def resolver_contas(chave: str, conta_id: str | None) -> list[dict]:
    contas = listar_contas(chave)
    if conta_id:
        achadas = [c for c in contas if c.get("id") == conta_id]
        if not achadas:
            raise ErroPublicar(f"Conta {conta_id} não está no seu Post for Me. Veja: python ScriptsFera/publicar.py contas")
        if achadas[0].get("status") != "connected":
            raise ErroPublicar(f"Conta {conta_id} está desconectada. Reconecte no painel do Post for Me.")
        return achadas
    instagram = [c for c in contas if c.get("platform") == "instagram" and c.get("status") == "connected"]
    if len(instagram) == 1:
        return instagram
    if not instagram:
        raise ErroPublicar("Nenhuma conta de Instagram conectada no Post for Me. Conecte pelo Instagram nativo no painel.")
    raise ErroPublicar("Tem mais de uma conta de Instagram conectada. Escolha com --conta <id> (veja `publicar.py contas`).")


def subir_midia(chave: str, arquivo: Path) -> str:
    """URL assinada: POST /media/create-upload-url, PUT do arquivo, devolve media_url."""
    requests = _requests()
    assinatura = api("POST", "/media/create-upload-url", chave)
    upload_url, media_url = assinatura.get("upload_url"), assinatura.get("media_url")
    if not upload_url or not media_url:
        raise ErroPublicar("O Post for Me não devolveu upload_url e media_url. Upload abortado.")
    tipo = mimetypes.guess_type(arquivo.name)[0] or "application/octet-stream"
    with arquivo.open("rb") as conteudo:
        resposta = requests.put(upload_url, data=conteudo, headers={"Content-Type": tipo}, timeout=300)
    if resposta.status_code >= 400:
        raise ErroPublicar(f"Falhou o upload de {arquivo.name} ({resposta.status_code}).")
    return media_url


# ── Comandos ──────────────────────────────────────────────────────────────

def cmd_contas(_args) -> None:
    contas = listar_contas(chave_api())
    if not contas:
        print("Nenhuma conta no seu Post for Me. Conecte no painel (app.postforme.dev).")
        return
    for conta in contas:
        print(f"{conta.get('id')}  {conta.get('platform'):<10} @{conta.get('username')}  [{conta.get('status')}]")
    print("\nAtenção: 'connected' não prova que a conexão com a Meta está viva. Teste antes de agendar lote.")


def cmd_agendar(args) -> None:
    plano = montar_plano(args.entradas, args.formato, args.quando, args.legenda, capa=args.capa)
    chave = None
    # Com chave, o DRY-RUN já mostra a conta certa (GET é só leitura). Sem chave, o plano sai mesmo assim.
    if args.enviar or _env_tem_chave():
        chave = chave_api()
        plano.contas = resolver_contas(chave, args.conta)
    print(texto_plano(plano, args.enviar))
    if not args.enviar:
        return
    urls = []
    for midia in plano.midias:
        print(f"  subindo {midia.name}...")
        urls.append(subir_midia(chave, midia))
    url_capa = None
    if plano.capa:
        print(f"  subindo capa {plano.capa.name}...")
        url_capa = subir_midia(chave, plano.capa)
    payload = montar_payload(plano, urls, [c["id"] for c in plano.contas], url_capa)
    post = api("POST", "/social-posts", chave, json=payload)
    print(f"\n[ok] agendado. id {post.get('id')}  status {post.get('status')}  quando {post.get('scheduled_at')}")
    print("     Para cancelar: python ScriptsFera/publicar.py cancelar " + str(post.get("id")))


def _env_tem_chave() -> bool:
    carregar_env()
    return bool(os.environ.get(ENV_CHAVE, "").strip())


def cmd_listar(_args) -> None:
    posts = api("GET", "/social-posts", chave_api(), params={"status": "scheduled", "limit": 100}).get("data", [])
    if not posts:
        print("Nenhum post agendado.")
        return
    fuso = fuso_brasilia()
    for post in sorted(posts, key=lambda p: p.get("scheduled_at") or ""):
        quando = post.get("scheduled_at") or ""
        try:
            quando = datetime.fromisoformat(quando.replace("Z", "+00:00")).astimezone(fuso).strftime("%Y-%m-%d %H:%M")
        except ValueError:
            pass
        ig = (post.get("platform_configurations") or {}).get("instagram") or {}
        contas = ", ".join("@" + str(c.get("username")) for c in post.get("social_accounts") or [])
        legenda = (post.get("caption") or "").strip().replace("\n", " ")[:50]
        print(f"{post.get('id')}  {quando}  {ig.get('placement') or '-':<9} {len(post.get('media') or [])} mídia(s)  {contas}  {legenda}")


def cmd_cancelar(args) -> None:
    resultado = api("DELETE", f"/social-posts/{args.id}", chave_api())
    if resultado.get("success"):
        print(f"[ok] post {args.id} cancelado.")
    else:
        raise ErroPublicar(f"O Post for Me não confirmou o cancelamento de {args.id}.")


def criar_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="publicar",
        description="Agenda feed, carrossel, story e reel pelo Post for Me (chave POSTFORME_API_KEY no .env).")
    sub = parser.add_subparsers(dest="comando", required=True)

    sub.add_parser("contas", help="lista as contas sociais conectadas").set_defaults(func=cmd_contas)

    agendar = sub.add_parser("agendar", help="agenda um post (DRY-RUN sem --enviar)")
    agendar.add_argument("entradas", nargs="+", help="pasta da peça ou arquivos de mídia")
    agendar.add_argument("--formato", required=True, choices=FORMATOS)
    agendar.add_argument("--quando", required=True, help='horário de Brasília, "AAAA-MM-DD HH:MM"')
    agendar.add_argument("--legenda", help=f"arquivo .txt com a legenda (padrão: {NOME_LEGENDA} na pasta)")
    agendar.add_argument("--capa", help="imagem de capa do reel (vai como thumbnail_url)")
    agendar.add_argument("--conta", help="id da conta no Post for Me (padrão: a única conta de Instagram conectada)")
    agendar.add_argument("--enviar", action="store_true", help="sobe a mídia e cria o post agendado de verdade")
    agendar.set_defaults(func=cmd_agendar)

    sub.add_parser("listar", help="lista os posts agendados").set_defaults(func=cmd_listar)

    cancelar = sub.add_parser("cancelar", help="cancela (apaga) um post agendado")
    cancelar.add_argument("id")
    cancelar.set_defaults(func=cmd_cancelar)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = criar_parser().parse_args(argv)
    try:
        args.func(args)
    except ErroPublicar as erro:
        print(f"[ERRO] {erro}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
