#!/usr/bin/env python3
"""Upload de vídeo pro YouTube — canal e credenciais DO UTILIZADOR (BYOK).

Chaves no .env (guia de obtenção no API_SETUP.md):
  YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN

Uso:
  python ScriptsFera/youtube_upload.py video.mp4 --titulo "Título" \
      [--descricao desc.txt] [--tags "a,b,c"] [--privacidade unlisted|private|public] \
      [--thumb thumb.png]
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from lib import carregar_env

for _stream in (sys.stdout, sys.stderr):
    if _stream and getattr(_stream, "encoding", "").lower() != "utf-8":
        try:
            _stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass

CHUNK = 8 * 1024 * 1024  # 8 MB


def obter_access_token() -> str:
    carregar_env()
    faltando = [c for c in ("YT_CLIENT_ID", "YT_CLIENT_SECRET", "YT_REFRESH_TOKEN")
                if not os.environ.get(c)]
    if faltando:
        print(f"[ERRO] Faltam no .env: {', '.join(faltando)}", file=sys.stderr)
        print("       Roda: python SetupFera/setup_chaves.py  (guia completo no API_SETUP.md)",
              file=sys.stderr)
        sys.exit(1)

    corpo = urllib.parse.urlencode({
        "client_id": os.environ["YT_CLIENT_ID"],
        "client_secret": os.environ["YT_CLIENT_SECRET"],
        "refresh_token": os.environ["YT_REFRESH_TOKEN"],
        "grant_type": "refresh_token",
    }).encode()
    try:
        with urllib.request.urlopen(
            urllib.request.Request("https://oauth2.googleapis.com/token", data=corpo), timeout=30
        ) as resposta:
            return json.loads(resposta.read())["access_token"]
    except urllib.error.HTTPError as erro:
        print(f"[ERRO] OAuth recusou ({erro.code}): {erro.read().decode()[:300]}", file=sys.stderr)
        print("       O refresh token pode ter expirado. Refaz o passo YouTube do API_SETUP.md.",
              file=sys.stderr)
        sys.exit(1)


def upload(args: argparse.Namespace) -> None:
    video = Path(args.video)
    if not video.exists():
        print(f"[ERRO] Vídeo não existe: {video}", file=sys.stderr)
        sys.exit(1)

    descricao = ""
    if args.descricao:
        desc_path = Path(args.descricao)
        descricao = desc_path.read_text(encoding="utf-8") if desc_path.exists() else args.descricao

    token = obter_access_token()
    cabecalhos = {"Authorization": f"Bearer {token}"}
    metadados = {
        "snippet": {
            "title": args.titulo[:100],
            "description": descricao[:5000],
            "tags": [t.strip() for t in args.tags.split(",") if t.strip()] if args.tags else [],
            "categoryId": "22",
        },
        "status": {"privacyStatus": args.privacidade, "selfDeclaredMadeForKids": False},
    }

    # 1. Abre a sessão resumable
    inicio = urllib.request.Request(
        "https://www.googleapis.com/upload/youtube/v3/videos"
        "?uploadType=resumable&part=snippet,status",
        data=json.dumps(metadados).encode("utf-8"),
        headers={**cabecalhos, "Content-Type": "application/json; charset=UTF-8",
                 "X-Upload-Content-Type": "video/*",
                 "X-Upload-Content-Length": str(video.stat().st_size)},
        method="POST",
    )
    try:
        with urllib.request.urlopen(inicio, timeout=60) as resposta:
            url_upload = resposta.headers["Location"]
    except urllib.error.HTTPError as erro:
        detalhe = erro.read().decode()[:400]
        if erro.code == 403 and "quota" in detalhe.lower():
            print("[ERRO] Quota diária da SUA API do YouTube esgotada. Tenta amanhã ou sobe "
                  "manual no YouTube Studio.", file=sys.stderr)
        else:
            print(f"[ERRO] YouTube recusou o início do upload ({erro.code}): {detalhe}",
                  file=sys.stderr)
        sys.exit(1)

    # 2. Sobe o arquivo em blocos
    tamanho = video.stat().st_size
    enviado = 0
    video_id = ""
    with video.open("rb") as arquivo:
        while enviado < tamanho:
            bloco = arquivo.read(CHUNK)
            fim = enviado + len(bloco) - 1
            requisicao = urllib.request.Request(
                url_upload, data=bloco,
                headers={**cabecalhos, "Content-Type": "video/*",
                         "Content-Range": f"bytes {enviado}-{fim}/{tamanho}"},
                method="PUT",
            )
            try:
                with urllib.request.urlopen(requisicao, timeout=300) as resposta:
                    video_id = json.loads(resposta.read()).get("id", "")
            except urllib.error.HTTPError as erro:
                if erro.code == 308:  # bloco aceito, continua
                    pass
                else:
                    print(f"[ERRO] Upload falhou no byte {enviado} ({erro.code}).", file=sys.stderr)
                    sys.exit(1)
            enviado = fim + 1
            print(f"  … {100 * enviado // tamanho}%", end="\r")

    print()
    if not video_id:
        print("[ERRO] Upload terminou sem id de vídeo. Confere no YouTube Studio.", file=sys.stderr)
        sys.exit(1)

    # 3. Thumbnail opcional
    if args.thumb:
        thumb = Path(args.thumb)
        if thumb.exists():
            req_thumb = urllib.request.Request(
                f"https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId={video_id}",
                data=thumb.read_bytes(),
                headers={**cabecalhos, "Content-Type": "image/png"},
                method="POST",
            )
            try:
                urllib.request.urlopen(req_thumb, timeout=60)
                print("[ok] Thumbnail aplicada.")
            except urllib.error.HTTPError as erro:
                print(f"[aviso] Thumbnail falhou ({erro.code}) — canal sem verificação de thumb "
                      "custom? Aplica manual no Studio.", file=sys.stderr)

    print(f"[ok] https://youtu.be/{video_id}  (privacidade: {args.privacidade})")
    if args.privacidade != "public":
        print("     Revisa no YouTube Studio e publica quando aprovar.")


def main() -> None:
    parser = argparse.ArgumentParser(prog="youtube_upload",
                                     description="MP4 → YouTube (credenciais do usuário)")
    parser.add_argument("video")
    parser.add_argument("--titulo", required=True)
    parser.add_argument("--descricao", default="")
    parser.add_argument("--tags", default="")
    parser.add_argument("--privacidade", default="unlisted",
                        choices=("unlisted", "private", "public"))
    parser.add_argument("--thumb", default="")
    upload(parser.parse_args())


if __name__ == "__main__":
    main()
