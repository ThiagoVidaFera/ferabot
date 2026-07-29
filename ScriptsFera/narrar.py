#!/usr/bin/env python3
"""Narração grátis via Edge TTS (vozes Microsoft, sem chave de API).

Uso:
  python ScriptsFera/narrar.py roteiro.txt --voz antonio --out narracao.mp3
  python ScriptsFera/narrar.py narracao.mp3 --duracao      # só mede a duração

Vozes PT-BR: antonio (masc) · francisca (fem) · thalita (fem).
O arquivo de roteiro deve conter SÓ o que vai ser lido — marcação vira fala.
"""
from __future__ import annotations

import argparse
import asyncio
import subprocess
import sys
from pathlib import Path

for _stream in (sys.stdout, sys.stderr):
    if _stream and getattr(_stream, "encoding", "").lower() != "utf-8":
        try:
            _stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass

VOZES = {
    "antonio": "pt-BR-AntonioNeural",
    "francisca": "pt-BR-FranciscaNeural",
    "thalita": "pt-BR-ThalitaNeural",
}


def garantir_edge_tts():
    try:
        import edge_tts  # noqa: F401
        return
    except ImportError:
        print("[setup] Instalando edge-tts (só na primeira vez)...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-q", "edge-tts"], check=True)


def duracao_segundos(caminho: Path) -> float:
    """Duração do áudio via ffprobe (vem com o FFmpeg)."""
    resultado = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(caminho)],
        capture_output=True, text=True,
    )
    if resultado.returncode != 0:
        print("[ERRO] ffprobe falhou. FFmpeg está instalado? (winget install Gyan.FFmpeg)",
              file=sys.stderr)
        sys.exit(1)
    return float(resultado.stdout.strip())


async def narrar(texto: str, voz: str, destino: Path) -> None:
    import edge_tts
    await edge_tts.Communicate(texto, voz).save(str(destino))


def main() -> None:
    parser = argparse.ArgumentParser(prog="narrar", description="Roteiro → MP3 (Edge TTS, grátis)")
    parser.add_argument("arquivo", help="roteiro .txt (ou .mp3 com --duracao)")
    parser.add_argument("--voz", default="antonio", choices=sorted(VOZES))
    parser.add_argument("--out", default="")
    parser.add_argument("--duracao", action="store_true", help="só medir a duração do áudio")
    args = parser.parse_args()

    origem = Path(args.arquivo)
    if not origem.exists():
        print(f"[ERRO] Arquivo não existe: {origem}", file=sys.stderr)
        sys.exit(1)

    if args.duracao:
        print(f"{duracao_segundos(origem):.2f}")
        return

    texto = origem.read_text(encoding="utf-8").strip()
    if not texto:
        print("[ERRO] Roteiro vazio.", file=sys.stderr)
        sys.exit(1)
    if any(marca in texto for marca in ("[VERIFICAR]", "[VERIFY]")):
        print("[ERRO] Roteiro ainda tem [VERIFICAR] pendente. Resolver antes de narrar.",
              file=sys.stderr)
        sys.exit(1)

    garantir_edge_tts()
    destino = Path(args.out) if args.out else origem.with_suffix(".mp3")
    asyncio.run(narrar(texto, VOZES[args.voz], destino))
    print(f"[ok] {destino.resolve()}  ({duracao_segundos(destino):.1f}s)")


if __name__ == "__main__":
    main()
