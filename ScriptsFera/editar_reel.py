#!/usr/bin/env python3
"""Edição do reel que o cliente gravou: transcreve, acha silêncio, legenda no centro e monta 1080x1920.

Precisa de FFmpeg no PATH. Transcrição: usa o Whisper local se existir (openai-whisper ou
faster-whisper). Sem nenhum dos dois, instala faster-whisper via pip na primeira vez.

Fluxo (cada passo grava um arquivo que dá pra revisar e editar antes do próximo):
  transcrever <video> [--modelo small]          -> transcricao.json + transcricao.txt
  cortes <video> [--silencio 0.6] [--ruido -35]  -> cortes.json (trechos que FICAM)
  legendas <pasta>                               -> legendas.json (blocos de até 2 linhas)
  montar <video> --pasta <pasta> [--out final.mp4]  -> MP4 1080x1920 com legenda queimada

Entre "cortes" e "legendas", tirar de cortes.json os trechos de erro e repetição (a transcrição
mostra onde estão). Entre "legendas" e "montar", conferir acento e grafia em legendas.json.
O texto da legenda é sempre a fala gravada: nunca inventar frase.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

for _stream in (sys.stdout, sys.stderr):
    if _stream and getattr(_stream, "encoding", "").lower() != "utf-8":
        try:
            _stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass

LARGURA, ALTURA = 1080, 1920
MAX_CARACTERES_LINHA = 22
MAX_LINHAS = 2
FOLGA_CORTE_S = 0.08  # respiro antes e depois de cada trecho mantido
TRECHO_MINIMO_S = 0.25


def erro(msg: str) -> None:
    print(f"[ERRO] {msg}", file=sys.stderr)
    sys.exit(1)


def exigir_ffmpeg() -> None:
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        erro("FFmpeg não encontrado. No Windows: winget install Gyan.FFmpeg (depois feche e abra o terminal).")


def duracao(video: Path) -> float:
    saida = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                            "-of", "default=nw=1:nk=1", str(video)], capture_output=True, text=True)
    try:
        return float(saida.stdout.strip())
    except ValueError:
        erro(f"Não consegui ler a duração de {video.name}.")
        return 0.0


def pasta_de(video: Path) -> Path:
    pasta = video.parent / f"{video.stem}-edicao"
    pasta.mkdir(exist_ok=True)
    return pasta


# ── Transcrição ───────────────────────────────────────────────────────────

def _transcrever_whisper(video: Path, modelo: str) -> list[dict]:
    import whisper  # openai-whisper
    resultado = whisper.load_model(modelo).transcribe(str(video), language="pt", word_timestamps=True)
    return [{"inicio": s["start"], "fim": s["end"], "texto": s["text"].strip(),
             "palavras": [{"inicio": w["start"], "fim": w["end"], "palavra": w["word"].strip()}
                          for w in s.get("words", [])]} for s in resultado["segments"]]


def _transcrever_faster(video: Path, modelo: str) -> list[dict]:
    from faster_whisper import WhisperModel
    segmentos, _info = WhisperModel(modelo, compute_type="int8").transcribe(
        str(video), language="pt", word_timestamps=True, vad_filter=True)
    return [{"inicio": s.start, "fim": s.end, "texto": s.text.strip(),
             "palavras": [{"inicio": w.start, "fim": w.end, "palavra": w.word.strip()} for w in (s.words or [])]}
            for s in segmentos]


def cmd_transcrever(args) -> None:
    video = Path(args.video)
    if not video.is_file():
        erro(f"Vídeo não encontrado: {video}")
    try:
        import whisper  # noqa: F401
        motor = _transcrever_whisper
    except ImportError:
        try:
            import faster_whisper  # noqa: F401
        except ImportError:
            print("[setup] Instalando faster-whisper (só na primeira vez, alguns minutos)...")
            subprocess.run([sys.executable, "-m", "pip", "install", "-q", "faster-whisper"], check=True)
        motor = _transcrever_faster
    segmentos = motor(video, args.modelo)
    pasta = pasta_de(video)
    (pasta / "transcricao.json").write_text(json.dumps(segmentos, ensure_ascii=False, indent=1), encoding="utf-8")
    linhas = [f"[{s['inicio']:7.2f} → {s['fim']:7.2f}] {s['texto']}" for s in segmentos]
    (pasta / "transcricao.txt").write_text("\n".join(linhas), encoding="utf-8")
    print(f"[ok] {pasta / 'transcricao.txt'}")


# ── Cortes de silêncio ────────────────────────────────────────────────────

def silencios_do_log(log: str) -> list[tuple[float, float]]:
    inicios = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", log)]
    fins = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
    return list(zip(inicios, fins))


def trechos_mantidos(silencios: list[tuple[float, float]], total: float) -> list[dict]:
    trechos, cursor = [], 0.0
    for inicio, fim in silencios:
        if inicio - cursor >= TRECHO_MINIMO_S:
            trechos.append({"inicio": round(max(0.0, cursor - FOLGA_CORTE_S), 3),
                            "fim": round(min(total, inicio + FOLGA_CORTE_S), 3)})
        cursor = fim
    if total - cursor >= TRECHO_MINIMO_S:
        trechos.append({"inicio": round(max(0.0, cursor - FOLGA_CORTE_S), 3), "fim": round(total, 3)})
    return trechos


def cmd_cortes(args) -> None:
    exigir_ffmpeg()
    video = Path(args.video)
    log = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(video), "-af",
                          f"silencedetect=noise={args.ruido}dB:d={args.silencio}", "-f", "null", "-"],
                         capture_output=True, text=True, encoding="utf-8", errors="replace").stderr
    trechos = trechos_mantidos(silencios_do_log(log), duracao(video))
    destino = pasta_de(video) / "cortes.json"
    destino.write_text(json.dumps(trechos, indent=1), encoding="utf-8")
    mantido = sum(t["fim"] - t["inicio"] for t in trechos)
    print(f"[ok] {destino}  ({len(trechos)} trechos, {mantido:.1f}s de {duracao(video):.1f}s)")


# ── Legendas ──────────────────────────────────────────────────────────────

def mapear_tempo(t: float, trechos: list[dict]) -> float | None:
    """Tempo no vídeo bruto -> tempo no vídeo cortado. None se caiu num trecho removido."""
    acumulado = 0.0
    for trecho in trechos:
        if trecho["inicio"] <= t <= trecho["fim"]:
            return acumulado + (t - trecho["inicio"])
        acumulado += trecho["fim"] - trecho["inicio"]
    return None


def quebrar_em_linhas(palavras: list[str]) -> list[str]:
    linhas, atual = [], ""
    for palavra in palavras:
        candidato = f"{atual} {palavra}".strip()
        if len(candidato) > MAX_CARACTERES_LINHA and atual:
            linhas.append(atual)
            atual = palavra
        else:
            atual = candidato
    if atual:
        linhas.append(atual)
    return linhas


def agrupar_blocos(palavras: list[dict]) -> list[dict]:
    """Palavras com tempo (já no vídeo cortado) -> blocos de no máximo 2 linhas."""
    blocos, atual = [], []
    for palavra in palavras:
        teste = [p["palavra"] for p in atual + [palavra]]
        if atual and len(quebrar_em_linhas(teste)) > MAX_LINHAS:
            blocos.append(atual)
            atual = []
        atual.append(palavra)
        if palavra["palavra"].endswith((".", "?", "!")):
            blocos.append(atual)
            atual = []
    if atual:
        blocos.append(atual)
    return [{"inicio": round(b[0]["inicio"], 3), "fim": round(b[-1]["fim"], 3),
             "texto": "\n".join(quebrar_em_linhas([p["palavra"] for p in b]))} for b in blocos]


def cmd_legendas(args) -> None:
    pasta = Path(args.pasta)
    transcricao = json.loads((pasta / "transcricao.json").read_text(encoding="utf-8"))
    trechos = json.loads((pasta / "cortes.json").read_text(encoding="utf-8"))
    palavras = []
    for segmento in transcricao:
        for p in segmento["palavras"]:
            inicio, fim = mapear_tempo(p["inicio"], trechos), mapear_tempo(p["fim"], trechos)
            if inicio is not None and fim is not None and p["palavra"]:
                palavras.append({"inicio": inicio, "fim": fim, "palavra": p["palavra"]})
    blocos = agrupar_blocos(palavras)
    (pasta / "legendas.json").write_text(json.dumps(blocos, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"[ok] {pasta / 'legendas.json'}  ({len(blocos)} blocos). Conferir acento antes de montar.")


# ── Montagem ──────────────────────────────────────────────────────────────

def _tempo_ass(t: float) -> str:
    h, resto = divmod(max(t, 0.0), 3600)
    m, s = divmod(resto, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def gerar_ass(blocos: list[dict], fonte: str, tamanho: int) -> str:
    # Alignment 5 = meio da tela. Legenda nunca no rodapé (a interface do Instagram cobre).
    cabecalho = (
        "[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\n\n"
        "[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, "
        "BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV\n"
        f"Style: Centro,{fonte},{tamanho},&H00FFFFFF,&H00000000,&H80000000,1,1,6,2,5,80,80,0\n\n"
        "[Events]\nFormat: Layer, Start, End, Style, Text\n"
    )
    eventos = [f"Dialogue: 0,{_tempo_ass(b['inicio'])},{_tempo_ass(b['fim'])},Centro,"
               + b["texto"].replace("\n", "\\N") for b in blocos]
    return cabecalho + "\n".join(eventos) + "\n"


def filtro_montagem(trechos: list[dict], com_legenda: bool) -> str:
    partes, entradas = [], []
    for i, t in enumerate(trechos):
        partes.append(f"[0:v]trim={t['inicio']}:{t['fim']},setpts=PTS-STARTPTS[v{i}]")
        partes.append(f"[0:a]atrim={t['inicio']}:{t['fim']},asetpts=PTS-STARTPTS[a{i}]")
        entradas.append(f"[v{i}][a{i}]")
    partes.append(f"{''.join(entradas)}concat=n={len(trechos)}:v=1:a=1[vc][ac]")
    quadro = (f"[vc]scale={LARGURA}:{ALTURA}:force_original_aspect_ratio=increase,"
              f"crop={LARGURA}:{ALTURA},setsar=1,fps=30")
    partes.append(quadro + (",subtitles=legendas.ass[vf]" if com_legenda else "[vf]"))
    return ";".join(partes)


def cmd_montar(args) -> None:
    exigir_ffmpeg()
    video = Path(args.video).resolve()
    pasta = Path(args.pasta).resolve()
    trechos = json.loads((pasta / "cortes.json").read_text(encoding="utf-8"))
    if not trechos:
        erro("cortes.json está vazio.")
    legendas = pasta / "legendas.json"
    com_legenda = legendas.is_file()
    if com_legenda:
        blocos = json.loads(legendas.read_text(encoding="utf-8"))
        (pasta / "legendas.ass").write_text(gerar_ass(blocos, args.fonte, args.tamanho), encoding="utf-8")
    destino = Path(args.out).resolve() if args.out else pasta / "final.mp4"
    comando = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(video),
               "-filter_complex", filtro_montagem(trechos, com_legenda), "-map", "[vf]", "-map", "[ac]",
               "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
               "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", str(destino)]
    # roda dentro da pasta: o filtro subtitles lê "legendas.ass" sem caminho (evita o escape do C: no Windows)
    resultado = subprocess.run(comando, cwd=pasta, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if resultado.returncode != 0:
        erro(f"FFmpeg falhou: {resultado.stderr[-600:]}")
    print(f"[ok] {destino}  ({duracao(destino):.1f}s, {LARGURA}x{ALTURA})")


def main() -> None:
    parser = argparse.ArgumentParser(prog="editar_reel", description="Edição do reel gravado (FFmpeg + Whisper)")
    sub = parser.add_subparsers(dest="comando", required=True)

    p = sub.add_parser("transcrever", help="transcreve com tempo por palavra")
    p.add_argument("video")
    p.add_argument("--modelo", default="small", help="tiny, base, small, medium (maior = mais lento e mais certo)")
    p.set_defaults(func=cmd_transcrever)

    p = sub.add_parser("cortes", help="acha os silêncios e grava os trechos que ficam")
    p.add_argument("video")
    p.add_argument("--silencio", type=float, default=0.6, help="pausa mínima em segundos para cortar")
    p.add_argument("--ruido", type=int, default=-35, help="nível em dB abaixo do qual conta como silêncio")
    p.set_defaults(func=cmd_cortes)

    p = sub.add_parser("legendas", help="gera blocos de legenda no tempo do vídeo cortado")
    p.add_argument("pasta")
    p.set_defaults(func=cmd_legendas)

    p = sub.add_parser("montar", help="corta, enquadra em 1080x1920 e queima a legenda no centro")
    p.add_argument("video")
    p.add_argument("--pasta", required=True, help="pasta <video>-edicao com cortes.json e legendas.json")
    p.add_argument("--out")
    p.add_argument("--fonte", default="Arial")
    p.add_argument("--tamanho", type=int, default=82)
    p.set_defaults(func=cmd_montar)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
