"""
FERABOT em 3D — still de estúdio. Reaproveita o construtor de blocos do build_mascot.py
(base do vídeo da Skool) e troca a identidade: corpo, antena, olhos-visor e "F" no peito.

Rodar sem abrir o Blender:
    blender -b --factory-startup -P ferabot_still.py -- --skin grafite --percent 50 --samples 64

Argumentos após "--":
    --skin grafite|laranja   corpo escuro com acentos laranja (padrão) ou corpo laranja Fera
    --output PATH            PNG de saída (padrão: saida/ferabot-<skin>.png)
    --samples N / --percent P / --exposure EV
    --save-blend PATH
"""

import argparse
import math
import os
import sys
import time

import bpy
from mathutils import Euler, Vector

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else os.getcwd()
sys.path.insert(0, SCRIPT_DIR)
import build_mascot as bm  # noqa: E402

# Cores da marca (marca/design-guide.md), já em linear.
FERA_ORANGE = (0.871, 0.076, 0.007, 1.0)   # #F04E14
GRAFITE = (0.018, 0.018, 0.020, 1.0)       # ~#1C1C1C
CREME_GLOW = (1.0, 0.86, 0.66, 1.0)
WORDMARK_FONTS = (r"C:\Windows\Fonts\impact.ttf", r"C:\Windows\Fonts\arialbd.ttf")


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--skin", choices=("grafite", "laranja"), default="laranja")
    p.add_argument("--output", default=None)
    p.add_argument("--samples", type=int, default=128)
    p.add_argument("--percent", type=int, default=100)
    p.add_argument("--exposure", type=float, default=0.0)
    p.add_argument("--save-blend", default=None)
    args = p.parse_args(argv)
    if args.output is None:
        args.output = os.path.join(SCRIPT_DIR, "saida", f"ferabot-{args.skin}.png")
    return args


def make_body_material(skin):
    mat = bm.make_orange_material()
    mat.name = f"FerabotBody_{skin}"
    bsdf = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    if skin == "grafite":
        bsdf.inputs["Base Color"].default_value = GRAFITE
        bsdf.inputs["Roughness"].default_value = 0.42
        bsdf.inputs["Specular IOR Level"].default_value = 0.5
    else:
        bsdf.inputs["Base Color"].default_value = FERA_ORANGE
    return mat


def make_glow_material(name, color, strength):
    mat, nt, out = bm.new_material(name)
    emit = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = color
    emit.inputs["Strength"].default_value = strength
    nt.links.new(emit.outputs[0], out.inputs["Surface"])
    return mat


def add_identity(body_mat, glow_mat, tip_mat):
    """Antena central + "F" em blocos no peito. O resto do corpo vem do build_mascot."""
    head_c = Vector((0.0, 0.0, 1.672))
    # Antena: haste fina + bulbo emissivo, entre as duas orelhas-pino.
    bm.make_block("AntennaStem", (0.045, 0.045, 0.16), (0.0, 0.02, head_c.z + 0.275 + 0.08), None, body_mat, 0.008)
    bm.make_block("AntennaTip", (0.095, 0.095, 0.095), (0.0, 0.02, head_c.z + 0.275 + 0.205), None, tip_mat, 0.02)

    # Placa do peito (escura) + wordmark FERABOT em 3D. Frente do torso: y = -0.20.
    fy = -0.205
    bm.make_block("BadgePlate", (0.47, 0.016, 0.17), (0.0, fy, 1.12), None, make_plate_material(), 0.01)
    add_wordmark("FERABOT", (0.0, fy - 0.010, 1.12), 0.425, glow_mat)


def add_wordmark(text, location, max_width, mat):
    """Texto extrudado e achatado na frente do torso, ajustado à largura da placa."""
    curve = bpy.data.curves.new("Wordmark", "FONT")
    curve.body = text
    curve.align_x = "CENTER"
    curve.align_y = "CENTER"
    curve.extrude = 0.012
    curve.bevel_depth = 0.002
    for path in WORDMARK_FONTS:
        if os.path.exists(path):
            curve.font = bpy.data.fonts.load(path)
            break
    obj = bpy.data.objects.new("Wordmark", curve)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(mat)
    obj.rotation_euler = (math.radians(90), 0.0, 0.0)  # em pé, legível de frente (-Y)
    obj.location = location
    bpy.context.view_layer.update()
    width = max(obj.dimensions.x, 1e-6)
    scale = max_width / width
    obj.scale = (scale, scale, 1.0)
    return obj


def make_plate_material():
    mat, nt, out = bm.new_material("BadgePlate")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (0.004, 0.004, 0.005, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.3
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def main():
    args = parse_args()
    scene = bm.reset_scene()
    body = make_body_material(args.skin)
    eye_glow = make_glow_material("EyeGlow", CREME_GLOW, 14.0)
    chest_glow = make_glow_material("ChestGlow", (1.0, 1.0, 1.0, 1.0), 2.2)  # wordmark branco: leitura
    tip_glow = make_glow_material("AntennaGlow", FERA_ORANGE, 6.0)

    bm.build_mascot(body, eye_glow)
    add_identity(body, chest_glow, tip_glow)
    bm.build_set()
    bm.build_camera(scene)
    bm.setup_render(scene, args)
    # Sem GPU compatível o setup do Metal falha e cai pra CPU; mantém Khronos Neutral (laranja saturado).

    if args.save_blend:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(args.save_blend))

    start = time.time()
    bpy.ops.render.render(write_still=True)
    print(f"[ferabot] Saved {scene.render.filepath} in {time.time() - start:.1f}s")


if __name__ == "__main__":
    main()
