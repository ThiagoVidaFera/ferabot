#!/usr/bin/env python3
"""Geração de imagem via Google Gemini — com a chave DO UTILIZADOR (BYOK).

Chave: GEMINI_API_KEY no .env da raiz (grátis em aistudio.google.com — ver API_SETUP.md).

Uso:
  python ScriptsFera/imagem.py "cinematic photo of ..." --out saida.png --ratio 4:5
  python ScriptsFera/imagem.py "same person, ..." --ref foto1.jpg --ref foto2.jpg --out ensaio-01.png --ratio 4:5

Com --ref (até 3 fotos REAIS do dono), o modelo mantém o rosto da pessoa: é assim que sai o ensaio.
Foto de outra pessoa sem autorização dela: proibido.
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

from lib import carregar_env

for _stream in (sys.stdout, sys.stderr):
    if _stream and getattr(_stream, "encoding", "").lower() != "utf-8":
        try:
            _stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass

RATIOS = ("1:1", "4:5", "9:16", "16:9", "3:4", "4:3")
MODELO_PADRAO = "gemini-2.5-flash-image"


MIME = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
MAX_REFS = 3


def partes_de_referencia(refs: list[str]) -> list[dict]:
    """Fotos de referência viram inlineData (antes do texto, como pede a API)."""
    partes = []
    for ref in refs[:MAX_REFS]:
        caminho = Path(ref)
        mime = MIME.get(caminho.suffix.lower())
        if not caminho.is_file() or not mime:
            print(f"[ERRO] Foto de referência inválida: {ref} (use .jpg, .png ou .webp)", file=sys.stderr)
            sys.exit(1)
        dados = base64.b64encode(caminho.read_bytes()).decode("ascii")
        partes.append({"inlineData": {"mimeType": mime, "data": dados}})
    return partes


def gerar(prompt: str, destino: Path, ratio: str, refs: list[str] | None = None) -> None:
    carregar_env()
    chave = os.environ.get("GEMINI_API_KEY", "")
    if not chave:
        print("[ERRO] GEMINI_API_KEY não configurada.", file=sys.stderr)
        print("       Roda: python SetupFera/setup_chaves.py  (a chave é sua, grátis no aistudio.google.com)",
              file=sys.stderr)
        sys.exit(1)

    modelo = os.environ.get("GEMINI_IMAGE_MODEL", MODELO_PADRAO)
    url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
           f"{modelo}:generateContent?key={chave}")
    corpo = {
        "contents": [{"parts": [*partes_de_referencia(refs or []), {"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
            "imageConfig": {"aspectRatio": ratio},
        },
    }
    requisicao = urllib.request.Request(
        url,
        data=json.dumps(corpo).encode("utf-8"),
        headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0 (FeraBot)"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(requisicao, timeout=180) as resposta:
            dados = json.loads(resposta.read().decode("utf-8"))
    except urllib.error.HTTPError as erro:
        detalhe = erro.read().decode("utf-8", errors="replace")[:400]
        if erro.code in (401, 403):
            print("[ERRO] Chave Gemini inválida ou sem permissão. Confere no aistudio.google.com "
                  "e roda setup_chaves.py de novo.", file=sys.stderr)
        elif erro.code == 429:
            print("[ERRO] Limite de uso da SUA chave Gemini atingido. Espera alguns minutos "
                  "(free tier) ou ativa billing no Google AI Studio.", file=sys.stderr)
        else:
            print(f"[ERRO] Gemini HTTP {erro.code}: {detalhe}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as erro:
        print(f"[ERRO] Sem conexão com a API do Gemini: {erro.reason}", file=sys.stderr)
        sys.exit(1)

    for candidato in dados.get("candidates", []):
        for parte in candidato.get("content", {}).get("parts", []):
            imagem = parte.get("inlineData", {}).get("data")
            if imagem:
                destino.parent.mkdir(parents=True, exist_ok=True)
                destino.write_bytes(base64.b64decode(imagem))
                print(f"[ok] {destino.resolve()}")
                return

    bloqueio = dados.get("promptFeedback", {}).get("blockReason", "")
    if bloqueio:
        print(f"[ERRO] Prompt bloqueado pela API ({bloqueio}). Reescreve o prompt.", file=sys.stderr)
    else:
        print("[ERRO] A API respondeu sem imagem. Tenta um prompt mais descritivo.", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(prog="imagem", description="Prompt → PNG (Gemini, chave do usuário)")
    parser.add_argument("prompt", help="descrição da imagem, em inglês, detalhada")
    parser.add_argument("--out", default="imagem.png")
    parser.add_argument("--ratio", default="1:1", choices=RATIOS)
    parser.add_argument("--ref", action="append", default=[],
                        help=f"foto real de referência (repita até {MAX_REFS} vezes) para manter o rosto")
    args = parser.parse_args()
    gerar(args.prompt, Path(args.out), args.ratio, args.ref)


if __name__ == "__main__":
    main()
