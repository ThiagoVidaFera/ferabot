#!/usr/bin/env python3
"""gerar_personagem.py — cria o personagem do estilo 36 (Avatar explica): a SUA caricatura (de 1 foto) ou um personagem genérico,
nas 6 poses x boca fechada/falando que o projeto-modelo usa.

API PAGA (OpenAI, gpt-image, ~US$ 0,03-0,05 por imagem). Sem --pode o script NÃO chama a API: só mostra o que faria e o custo.
Cada gasto vai para assets/personagem/GASTO.json e o script para no teto (padrão US$ 1,50).

Uso (rode de dentro da pasta da peça, a cópia de modelo/):
    python3 gerar_personagem.py base --foto minha-foto.jpg [--ref-traco traco.png] [--descricao "..."] [--pode]
    python3 gerar_personagem.py generico --descricao "mulher, 30 anos, cabelo cacheado, blusa verde" [--ref-traco traco.png] [--pode]
    python3 gerar_personagem.py poses [--pode]          # 6 poses a partir de assets/personagem/base.png
    python3 gerar_personagem.py bocas [--pode]          # 5 versões "-falando" a partir das poses
    python3 gerar_personagem.py uma <nome> [--pode]     # refaz 1 imagem (ex.: p3-aponta ou p3-aponta-falando)
Opções: --teto 1.50 · --modelo gpt-image-1.5 (ou OPENAI_IMAGE_MODEL no .env) · --qualidade medium|high · --pasta <saída>

Chave: OPENAI_API_KEY lida do ambiente ou do .env da Fábrica (procura .env subindo a partir desta pasta e depois em
~/Fabrica-de-Criativos/.env). A chave nunca é impressa. Stdlib apenas.
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.request
import uuid
from pathlib import Path

AQUI = Path(__file__).resolve().parent
CUSTO_ESTIMADO = 0.05          # US$ por imagem (teto da estimativa; medium 1024x1536 costuma sair menos)

TRACO = ("flat 2D caricature in a friendly sticker/avatar style: thick clean dark outline (about 8 px), flat colors, "
         "one soft shadow tone done as a halftone dot pattern on the shaded side, slightly big head (about 1/3 of the figure), "
         "big expressive eyes, simplified hands, no gradients, no text, no logo, transparent background")
ENQUADRAMENTO = ("portrait 2:3, the character seen from the waist up, centered, cut by the bottom edge of the image, "
                 "head in the upper third, nothing else in the scene")

POSES = {
    "p1-apresenta": "friendly expression, mouth closed, one open hand raised to the side as if presenting something",
    "p2-surpreso": "surprised: eyebrows up, eyes wide open, small round 'o' mouth, hands slightly raised",
    "p3-aponta": "confident, mouth closed, index finger pointing up and to the left, as if showing a card above the head",
    "p4-ombros": "shrugging shoulders with both palms up, mouth closed, ironic half smile",
    "p5-pensa": "thinking: one hand on the chin, eyes looking up, mouth closed",
    "p6-cabeca": "one hand on top of the head, 'I can't believe it' expression, mouth closed",
}
SEM_FALANDO = {"p2-surpreso"}


def achar_env() -> None:
    if os.environ.get("OPENAI_API_KEY"):
        return
    candidatos = [p / ".env" for p in [AQUI, *AQUI.parents]] + [Path.home() / "Fabrica-de-Criativos" / ".env"]
    for env in candidatos:
        if not env.is_file():
            continue
        for linha in env.read_text(encoding="utf-8", errors="replace").splitlines():
            linha = linha.strip()
            if not linha or linha.startswith("#") or "=" not in linha:
                continue
            k, _, v = linha.partition("=")
            v = v.strip().strip('"').strip("'")
            if k.strip() and v:
                os.environ.setdefault(k.strip(), v)
        if os.environ.get("OPENAI_API_KEY"):
            return


def multipart(campos: dict, arquivos: list[tuple[str, Path]]) -> tuple[bytes, str]:
    b = uuid.uuid4().hex
    corpo = b""
    for k, v in campos.items():
        corpo += f"--{b}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode()
    for k, p in arquivos:
        tipo = "image/jpeg" if p.suffix.lower() in (".jpg", ".jpeg") else "image/webp" if p.suffix.lower() == ".webp" else "image/png"
        corpo += (f"--{b}\r\nContent-Disposition: form-data; name=\"{k}\"; filename=\"{p.name}\"\r\n"
                  f"Content-Type: {tipo}\r\n\r\n").encode() + p.read_bytes() + b"\r\n"
    return corpo + f"--{b}--\r\n".encode(), f"multipart/form-data; boundary={b}"


class Gerador:
    def __init__(self, a):
        self.a = a
        self.pasta = Path(a.pasta).resolve() if a.pasta else AQUI / "assets" / "personagem"
        self.pasta.mkdir(parents=True, exist_ok=True)
        self.gasto_arq = self.pasta / "GASTO.json"
        self.gasto = json.loads(self.gasto_arq.read_text()) if self.gasto_arq.exists() else {"usd_real": 0.0, "itens": []}
        self.modelo = a.modelo or os.environ.get("OPENAI_IMAGE_MODEL") or "gpt-image-1.5"
        self.fila: list[tuple[str, str, list[Path]]] = []   # (nome, prompt, imagens de entrada; vazio = gerar do zero)

    def plano(self, nome: str, prompt: str, refs: list[Path]) -> None:
        for r in refs:
            if not r.is_file() and (self.a.pode or r.parent != self.pasta):
                sys.exit(f"Não achei a imagem {r.name}. Confira o nome do arquivo (ou gere antes a etapa anterior).")
        self.fila.append((nome, prompt, refs))

    def rodar(self) -> None:
        estimado = len(self.fila) * CUSTO_ESTIMADO
        print(f"{len(self.fila)} imagem(ns) · modelo {self.modelo} · estimativa até US$ {estimado:.2f} "
              f"· já gasto US$ {self.gasto['usd_real']:.2f} de US$ {self.a.teto:.2f}")
        for nome, _, refs in self.fila:
            print(f"  - {nome}.png" + (f"  (a partir de {', '.join(r.name for r in refs)})" if refs else "  (do zero)"))
        if not self.a.pode:
            print("SIMULAÇÃO: nada foi gerado. Mostre o custo ao aluno; com o 'pode' dele, rode de novo com --pode.")
            return
        achar_env()
        if not os.environ.get("OPENAI_API_KEY"):
            sys.exit("Falta OPENAI_API_KEY no .env da Fábrica. Digite /fca-conectar openai e cole a chave lá (nunca no chat).")
        for nome, prompt, refs in self.fila:
            if self.gasto["usd_real"] + CUSTO_ESTIMADO > self.a.teto:
                sys.exit(f"TETO: já gasto US$ {self.gasto['usd_real']:.4f} de US$ {self.a.teto:.2f}. Parei antes de {nome}.")
            self.uma(nome, prompt, refs)

    def uma(self, nome: str, prompt: str, refs: list[Path]) -> None:
        campos = {"model": self.modelo, "prompt": prompt, "size": "1024x1536", "quality": self.a.qualidade,
                  "background": "transparent", "output_format": "png", "n": "1"}
        if refs:
            corpo, ct = multipart(campos, [("image[]", r) for r in refs])
            url = "https://api.openai.com/v1/images/edits"
        else:
            corpo, ct = json.dumps(campos | {"n": 1}).encode(), "application/json"
            url = "https://api.openai.com/v1/images/generations"
        req = urllib.request.Request(url, data=corpo, headers={"Authorization": "Bearer " + os.environ["OPENAI_API_KEY"],
                                                               "Content-Type": ct})
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                d = json.loads(r.read())
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="replace")[:500]
            if "model" in msg.lower():
                msg += "\nDica: troque o modelo com --modelo gpt-image-1.5 (ou OPENAI_IMAGE_MODEL no .env)."
            sys.exit(f"ERRO da API em {nome}: {msg}")
        (self.pasta / f"{nome}.png").write_bytes(base64.b64decode(d["data"][0]["b64_json"]))
        u = d.get("usage") or {}
        custo = u.get("output_tokens", 0) * 40e-6 + u.get("input_tokens", 0) * 5e-6 or CUSTO_ESTIMADO
        self.gasto["usd_real"] = round(self.gasto["usd_real"] + custo, 4)
        self.gasto["itens"].append({"arquivo": f"{nome}.png", "usd": round(custo, 4)})
        self.gasto_arq.write_text(json.dumps(self.gasto, indent=1))
        print(f"ok {nome}.png · US$ {custo:.4f} · total US$ {self.gasto['usd_real']:.4f}")


def prompt_base(descricao: str, com_foto: bool, com_ref: bool) -> str:
    quem = ("Turn the person in the FIRST image into a caricature that is clearly recognizable as the same person "
            "(same face shape, hair, beard, skin tone, glasses if any)." if com_foto
            else f"Create an original character: {descricao or 'adult, friendly, casual clothes'}.")
    if com_foto and descricao:
        quem += f" Extra details: {descricao}."
    traco = (" Copy ONLY the drawing style (line, colors, shading) of the LAST image, never its character, clothes or text."
             if com_ref else "")
    return f"{quem} Style: {TRACO}.{traco} Framing: {ENQUADRAMENTO}. Neutral friendly expression, mouth closed, arms relaxed."


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("acao", choices=["base", "generico", "poses", "bocas", "uma"])
    ap.add_argument("nome", nargs="?", help="só para 'uma': p1-apresenta, p3-aponta-falando...")
    ap.add_argument("--foto")
    ap.add_argument("--ref-traco")
    ap.add_argument("--descricao", default="")
    ap.add_argument("--pode", action="store_true", help="o aluno viu o custo e disse 'pode'")
    ap.add_argument("--teto", type=float, default=1.50)
    ap.add_argument("--modelo")
    ap.add_argument("--qualidade", default="medium", choices=["low", "medium", "high"])
    ap.add_argument("--pasta", help="pasta de saída (padrão: assets/personagem/ ao lado deste script)")
    a = ap.parse_args()
    g = Gerador(a)
    ref = [Path(a.ref_traco).resolve()] if a.ref_traco else []
    base = g.pasta / "base.png"

    def pose(nome: str) -> None:
        g.plano(nome, f"Same character as the image, same face, hair, clothes, colors and line style, same framing "
                      f"({ENQUADRAMENTO}). Pose: {POSES[nome]}. Style: {TRACO}.", [base])

    def boca(nome: str) -> None:
        g.plano(f"{nome}-falando", "Exactly the same image, identical pose, body, clothes, colors and framing. Change ONLY the "
                                   "mouth: open mid-speech (talking), teeth slightly visible. Keep the transparent background.",
                [g.pasta / f"{nome}.png"])

    if a.acao == "base":
        if not a.foto:
            sys.exit("Falta --foto (ou use: gerar_personagem.py generico --descricao \"...\").")
        g.plano("base", prompt_base(a.descricao, True, bool(ref)), [Path(a.foto).resolve(), *ref])
    elif a.acao == "generico":
        g.plano("base", prompt_base(a.descricao, False, bool(ref)), ref)
    elif a.acao == "poses":
        if not base.is_file() and a.pode:
            sys.exit("Falta assets/personagem/base.png: rode 'base' (com foto) ou 'generico' primeiro.")
        for n in POSES:
            pose(n)
    elif a.acao == "bocas":
        for n in POSES:
            if n not in SEM_FALANDO:
                boca(n)
    else:
        if not a.nome:
            sys.exit("Diga qual: gerar_personagem.py uma p3-aponta (ou p3-aponta-falando).")
        if a.nome.endswith("-falando") and a.nome[:-8] in POSES:
            boca(a.nome[:-8])
        elif a.nome in POSES:
            pose(a.nome)
        else:
            sys.exit("Nome desconhecido. Use um de: " + ", ".join(list(POSES) + [f"{p}-falando" for p in POSES if p not in SEM_FALANDO]))
    g.rodar()


if __name__ == "__main__":
    main()
