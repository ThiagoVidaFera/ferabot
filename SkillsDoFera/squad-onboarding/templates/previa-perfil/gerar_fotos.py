"""Gera ensaio por IA do cliente a partir de fotos REAIS dele (Master Twin).

Rota 1 da ordem de fallback: Gemini 3 Pro Image (Nano Banana).
Regras aplicadas (produção de mídia por IA):
- ancorar em foto real com slot-legend de 2+ referências citadas por número;
- formato 4:5 (é o formato que decide a semelhança) e enquadramento FECHADO
  (rosto pequeno no quadro = semelhança ruim, não se recupera com prompt);
- mãos fora de quadro (é onde a IA mais erra);
- nada de texto legível na cena; lista negativa colada em todo prompt;
- sidecar .gen.json com o prompt VERBATIM escrito no submit.

Chave: GEMINI_API_KEY (variável de ambiente ou `.env` da raiz do FERABOT). Sem ela, o script
para com a orientação do caminho manual (ver step-22, fase 2).

Uso: python -I gerar_fotos.py <dir_saida> <ref_rosto.jpg> <ref_corpo.jpg>
"""
import base64
import json
import pathlib
import sys
import urllib.request

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from ferabot_env import chave as ler_chave  # noqa: E402

for _f in (sys.stdout, sys.stderr):
    try:
        _f.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

MODELO = "gemini-3-pro-image-preview"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODELO}:generateContent"

# Direção de arte fixa do método: a pessoa aparece MAIS JOVEM e SORRINDO,
# sempre em contexto de trabalho ou ambiente de luxo, e NUNCA olhando para a lente.
# O avatar é a única exceção ao olhar — ver CENA_AVATAR.
IDENTIDADE = """Using BOTH reference images I attached, generate a new photograph of the SAME man.

Image 1 = close-up photograph of the man's face. This is the identity anchor.
Image 2 = photograph showing his build, posture and skin tone.

WHAT MUST STAY THE SAME as the references:
- same face shape and same facial features as Image 1: same nose, same mouth, same jawline,
  same eyebrows, same eye colour, same hairline
- same skin tone and same build as Image 2
- he must remain unmistakably the same person, recognisable at a glance by someone who knows him

HOW HE LOOKS IN THIS PHOTOGRAPH:
- visibly younger and better rested than in the references, as if photographed several years
  earlier: smoother skin, fewer and softer lines around the eyes and mouth, firmer jawline,
  hair slightly fuller, same colour and same style as in the references
- never so young that he stops looking like the same man; keep the bone structure untouched
- warm, genuine smile, relaxed and confident, with the smile reaching the eyes
- natural skin texture with visible pores and slight asymmetry; never plastic or airbrushed

GAZE — this is a hard requirement:
- he is NOT looking at the camera and NOT looking at the lens
- his eyes are directed off-frame, at something or someone in his own world
- the photograph reads as a candid moment caught by an observer, never as a posed headshot

FRAMING: tight portrait. Head and shoulders fill the frame and the face is large in frame.
Hands out of frame. 85mm lens look, shallow depth of field, background softly out of focus.

NEVER SHOW: no text, no captions, no titles, no watermark, no logos, no readable signage,
no readable book spines, no glowing edges, no flashes, no sparkles, no magic particles,
no morphing, no CGI look, no over-saturated grade."""

# Metade trabalho, metade luxo discreto. O luxo é o que o nicho do cliente reconhece como
# bem-sucedido — num B2B sério, lounge de hotel e sala de diretoria, nunca jatinho ou carro
# esportivo, que leem como guru e queimam a credibilidade da oferta.
CENAS = {
    "escritorio": "WHAT CHANGES: a bright modern office with a large window on the left. He wears a "
                  "well-fitted navy blue dress shirt, collar open, no tie. He is smiling at "
                  "someone standing off-frame to his right, mid-conversation, relaxed.",
    "palco": "WHAT CHANGES: he is speaking on a conference stage to a business audience. Warm "
             "directional stage light on his face, the dark auditorium falling away behind him. He "
             "wears a charcoal blazer over a white shirt. He smiles as he looks out over the "
             "audience, away from the camera.",
    "reuniao": "WHAT CHANGES: seated at a meeting table in a bright corporate room, an out-of-focus "
               "laptop edge in the near foreground. He wears a light blue shirt. He is smiling and "
               "listening to a colleague off-frame to his left.",
    "lounge": "WHAT CHANGES: the lounge of a high-end business hotel in the late afternoon — warm "
              "lamps, dark polished wood, deep leather armchairs, soft golden light. He wears a "
              "charcoal blazer over a black crew neck. He smiles at something off-frame, at ease, "
              "like a man between two good meetings.",
}

# Exceção deliberada à regra do olhar. O avatar do Instagram é lido a 32px, e olhar desviado
# vira silhueta e lê como esquiva nesse tamanho. Aqui o contato visual é função, não pose.
CENA_AVATAR = ("WHAT CHANGES: a bright modern office, softly out of focus behind him, with a window "
               "behind his shoulder making the background LIGHTER than he is. He wears a navy blue "
               "dress shirt. Warm open smile.\n\n"
               "GAZE — this photograph OVERRIDES the gaze rule above: here he looks straight into "
               "the lens, making direct eye contact with the viewer. This one is a portrait, and "
               "it is read at 32 pixels wide, where an averted gaze becomes an unreadable "
               "silhouette.")


def chave(inicio=None):
    valor = ler_chave("GEMINI_API_KEY", inicio)
    if valor:
        return valor
    raise SystemExit(
        "GEMINI_API_KEY não encontrada (nem no ambiente, nem no .env da raiz do FERABOT).\n"
        "Esta etapa é opcional. Caminhos:\n"
        "  1. colocar GEMINI_API_KEY=... no .env do FERABOT (grátis em aistudio.google.com/apikey) e rodar de novo;\n"
        "  2. ou gerar os retratos à mão no Gemini (gemini.google.com) com o prompt de IDENTIDADE + CENAS\n"
        "     deste arquivo, anexando as 2 fotos reais, e salvar os .jpg na pasta de saída.")


def parte_imagem(caminho: pathlib.Path):
    return {"inlineData": {"mimeType": "image/jpeg",
                           "data": base64.b64encode(caminho.read_bytes()).decode()}}


def gerar(nome, prompt, refs, destino: pathlib.Path, api_key):
    corpo = {
        "contents": [{"parts": [parte_imagem(r) for r in refs] + [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["IMAGE"],
                             "imageConfig": {"aspectRatio": "4:5"}},
    }
    req = urllib.request.Request(
        f"{URL}?key={api_key}", method="POST",
        data=json.dumps(corpo).encode(),
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            resposta = json.loads(r.read())
    except Exception as e:
        detalhe = getattr(e, "read", lambda: b"")()[:400].decode("utf-8", "replace")
        print(f"  {nome}: ERRO {e} {detalhe}")
        return False

    cands = resposta.get("candidates") or []
    if not cands:
        print(f"  {nome}: sem candidato — {str(resposta)[:300]}")
        return False
    motivo = cands[0].get("finishReason")
    if motivo and motivo not in ("STOP", "MAX_TOKENS"):
        # Flag de moderação: para e reporta, nunca re-submete mudando o prompt sozinho.
        print(f"  {nome}: PAROU por '{motivo}' — reportar, não re-submeter")
        return False

    for parte in cands[0].get("content", {}).get("parts", []):
        dados = (parte.get("inlineData") or {}).get("data")
        if dados:
            saida = destino / f"{nome}.jpg"
            saida.write_bytes(base64.b64decode(dados))
            # Sidecar com o prompt verbatim, escrito no submit.
            (destino / f"{nome}.gen.json").write_text(json.dumps({
                "modelo": MODELO, "aspect": "4:5", "cena": nome,
                "refs": [r.name for r in refs], "prompt_verbatim": prompt,
            }, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"  {nome}: OK ({saida.stat().st_size // 1024} KB)")
            return True
    print(f"  {nome}: resposta sem imagem")
    return False


def main():
    destino = pathlib.Path(sys.argv[1]).resolve()
    destino.mkdir(parents=True, exist_ok=True)
    refs = [pathlib.Path(sys.argv[2]).resolve(), pathlib.Path(sys.argv[3]).resolve()]
    for r in refs:
        if not r.exists():
            raise SystemExit(f"Referência não encontrada: {r}")
    api_key = chave(destino)
    # O avatar sai no mesmo lote: ele é a exceção da regra do olhar e precisa existir sempre.
    lote = dict(CENAS, avatar=CENA_AVATAR)
    print(f"gerando {len(lote)} cenas em {destino}")
    ok = sum(gerar(nome, f"{IDENTIDADE}\n\n{cena}", refs, destino, api_key)
             for nome, cena in lote.items())
    print(f"{ok}/{len(lote)} geradas")


if __name__ == "__main__":
    main()
