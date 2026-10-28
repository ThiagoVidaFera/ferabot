"""Recorta fotos para 4:5 mantendo a CABEÇA inteira com folga (regra: rosto nunca cortado).

Descarta pillarbox/letterbox borrado antes de enquadrar: frames de vídeo vertical costumam vir
dentro de um canvas com as bordas desfocadas, e recortar por cima delas suja a peça.

Uso: python -I recortar45.py <cascata.xml> <destino_dir> <foto1> [foto2 ...]
"""
import os
import sys
import cv2
import numpy as np

CASCATA, DESTINO = sys.argv[1], sys.argv[2]
ALVO_W, ALVO_H = 1080, 1350  # 4:5
FOLGA_TOPO = 0.10  # folga mínima acima da cabeça, fração da altura do recorte

os.makedirs(DESTINO, exist_ok=True)  # imwrite não cria pasta e falha em silêncio
det = cv2.CascadeClassifier(CASCATA)
if det.empty():
    raise SystemExit(f'cascata vazia/ausente: {CASCATA} (OpenCV 5 não traz; usar haarcascade_frontalface_default.xml desta pasta)')


def area_nitida(img):
    """Faixa horizontal de conteúdo real, descartando pillarbox borrado (baixa energia de borda)."""
    cinza = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    energia = np.abs(cv2.Laplacian(cinza, cv2.CV_32F, ksize=3)).mean(axis=0)
    limiar = energia.max() * 0.18
    nitidas = np.where(energia > limiar)[0]
    if nitidas.size == 0:
        return 0, img.shape[1]
    return int(nitidas[0]), int(nitidas[-1]) + 1


def cabeca(img):
    """Caixa aproximada da CABEÇA a partir do rosto frontal (hair +55%, lados 22%, queixo +18%)."""
    cinza = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    rostos = det.detectMultiScale(cinza, scaleFactor=1.08, minNeighbors=6, minSize=(80, 80))
    if len(rostos) == 0:
        return None
    x, y, w, h = max(rostos, key=lambda r: r[2] * r[3])
    return (
        max(0, int(x - 0.22 * w)),
        max(0, int(y - 0.55 * h)),
        min(img.shape[1], int(x + w + 0.22 * w)),
        min(img.shape[0], int(y + h + 0.18 * h)),
    )


def recortar(caminho, saida):
    img = cv2.imread(caminho)
    if img is None:
        return f"ERRO leitura {caminho}"
    alt, larg = img.shape[:2]

    # Foto gerada por IA já sai em 4:5: aí não há recorte a fazer, só normalizar o tamanho.
    # Recortar assim mesmo só inventaria corte onde o enquadramento já está certo.
    if abs((larg / alt) - (ALVO_W / ALVO_H)) < 0.02:
        cv2.imwrite(saida, cv2.resize(img, (ALVO_W, ALVO_H), interpolation=cv2.INTER_AREA),
                    [cv2.IMWRITE_JPEG_QUALITY, 92])
        cx = cabeca(img)
        nota = "conferir cabeça a olho" if cx and cx[1] <= 2 else "cabeça com folga"
        return f"JA-4:5 {saida.split('/')[-1]} | só redimensionada | {nota}"

    x0, x1 = area_nitida(img)
    cx = cabeca(img)
    if cx is None:
        return f"SEM ROSTO {caminho} — recorte manual"
    hx0, hy0, hx1, hy1 = cx
    head_cx, head_h = (hx0 + hx1) / 2, hy1 - hy0

    # Maior janela 4:5 que cabe na área nítida.
    cw = min(x1 - x0, int(alt * ALVO_W / ALVO_H))
    ch = int(cw * ALVO_H / ALVO_W)

    # Ancoragem vertical: topo da cabeça FOLGA_TOPO abaixo do topo do recorte.
    top = max(0, min(int(hy0 - FOLGA_TOPO * ch), alt - ch))
    left = max(x0, min(int(head_cx - cw / 2), x1 - cw))

    corte = cv2.resize(img[top:top + ch, left:left + cw], (ALVO_W, ALVO_H), interpolation=cv2.INTER_AREA)
    cv2.imwrite(saida, corte, [cv2.IMWRITE_JPEG_QUALITY, 92])

    folga_topo = (hy0 - top) / ch
    folga_base = (top + ch - hy1) / ch
    corta_lado = hx0 < left or hx1 > left + cw
    # Só é corte MEU quando a janela de fato se deslocou (top > 0). Com top encostado no 0 a
    # foto já começava assim, e a estimativa de cabeça (rosto + 55%) extrapola em retrato
    # fechado — reprovar aí é falso positivo, e gate que mente é gate que se aprende a ignorar.
    if top > 0 and (folga_topo < 0.02 or corta_lado) or folga_base < 0.02:
        status = "REPROVA cabeça cortada"
    elif folga_topo < 0.02:
        status = "AVISO conferir cabeça a olho (foto já começava sem folga)"
    elif folga_topo < 0.06:
        status = "AVISO folga curta no topo"
    else:
        status = "OK"
    return (f"{status} {saida.split('/')[-1]} | nitido x{x0}-{x1} | cabeca {int(head_h)}px "
            f"({head_h / ch:.0%} do quadro) | folga topo {folga_topo:.0%} base {folga_base:.0%}")


for origem in sys.argv[3:]:
    nome = origem.replace("\\", "/").split("/")[-1]
    print(recortar(origem, f"{DESTINO}/{nome}"))
