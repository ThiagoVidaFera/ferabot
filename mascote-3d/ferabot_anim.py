"""
FERABOT narrador — animação 9:16 com fundo transparente, sincronizada com a narração.

Usa o rig articulado do mascot_rig.py (base Skool) e põe a identidade FERABOT: antena, placa com o
wordmark branco no peito, olhos-visor que PULSAM com a voz.

    blender -b --factory-startup -P ferabot_anim.py -- --out C:/.../frames --frames 1-1190
    blender -b --factory-startup -P ferabot_anim.py -- --out C:/.../teste --frames 45,200,330 --width 540

Argumentos após "--":
    --out DIR        pasta dos PNGs RGBA (f_0001.png ...)
    --frames A-B | lista   intervalo ou lista de frames (padrão: tudo)
    --audio WAV      narração (envelope do volume anima o brilho dos olhos)
    --width/--height resolução (padrão 1080x1920)
    --samples N      amostras EEVEE (padrão 24)
"""
import argparse
import math
import os
import sys
import wave

import bpy
import numpy as np
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else os.getcwd()
sys.path.insert(0, HERE)
import mascot_rig as mr  # noqa: E402

FPS = 30
FERA_ORANGE = (0.871, 0.076, 0.007)  # #F04E14 linear
WORDMARK_FONTS = (r"C:\Windows\Fonts\impact.ttf", r"C:\Windows\Fonts\arialbd.ttf")

# --- poses (graus, XYZ). Lado "r" = +X = direita da imagem; frente do boneco = -Y (câmera). ---------
HANG = {"shoulder_l": (0, 0, -6), "shoulder_r": (0, 0, 6), "elbow_l": (-10, 0, 0), "elbow_r": (-10, 0, 0)}
WAVE = {"shoulder_l": (0, 0, -6), "elbow_l": (-10, 0, 0), "shoulder_r": (0, -145, 0), "elbow_r": (0, -15, 0),
        "head": (-4, 0, 6), "spine": (-2, 0, 2)}
OPEN_SMALL = {"shoulder_l": (0, 52, 0), "shoulder_r": (0, -52, 0), "elbow_l": (-25, 0, 0), "elbow_r": (-25, 0, 0),
              "head": (-6, 0, 0)}
OPEN_WIDE = {"shoulder_l": (0, 88, 0), "shoulder_r": (0, -88, 0), "elbow_l": (-12, 0, 0), "elbow_r": (-12, 0, 0),
             "head": (-8, 0, 0), "spine": (-3, 0, 0)}
CHEER_LITE = {"shoulder_l": (0, 128, 0), "shoulder_r": (0, -128, 0), "elbow_l": (-10, 0, 0), "elbow_r": (-10, 0, 0),
              "head": (-12, 0, 0), "spine": (-5, 0, 0)}
SHRUG = {"shoulder_l": (0, 34, 0), "shoulder_r": (0, -34, 0), "elbow_l": (-85, 0, 0), "elbow_r": (-85, 0, 0),
         "head": (0, 0, 9), "spine": (0, 0, -2)}
SERIOUS = {"shoulder_l": (0, 0, -6), "shoulder_r": (0, 0, 6), "elbow_l": (-18, 0, 0), "elbow_r": (-18, 0, 0),
           "head": (10, 0, 0), "spine": (6, 0, 0)}
POINT_UP_R = {"shoulder_r": (0, -142, 0), "elbow_r": (0, 0, 0), "shoulder_l": (0, 0, -6), "elbow_l": (-12, 0, 0),
              "head": (-8, 0, 8), "spine": (-3, 0, 3)}
POINT_UP_L = {"shoulder_l": (0, 142, 0), "elbow_l": (0, 0, 0), "shoulder_r": (0, 0, 6), "elbow_r": (-12, 0, 0),
              "head": (-8, 0, -8), "spine": (-3, 0, -3)}
POINT_YOU = {"shoulder_r": (-88, -6, 4), "elbow_r": (-4, 0, 0), "shoulder_l": (0, 0, -6), "elbow_l": (-12, 0, 0),
             "head": (-2, 0, 0), "spine": (3, 0, 0)}
TYPE = {"shoulder_l": (-58, 0, -10), "shoulder_r": (-58, 0, 10), "elbow_l": (-78, 0, 0), "elbow_r": (-78, 0, 0),
        "head": (6, 0, 0), "spine": (4, 0, 0)}

# (segundo, pose). Âncoras = palavras do words.json (ver README do vídeo).
TIMELINE = [
    (0.00, WAVE), (1.40, WAVE), (1.90, HANG), (2.10, OPEN_SMALL), (4.30, OPEN_SMALL), (4.75, CHEER_LITE),
    (5.60, CHEER_LITE), (6.10, HANG), (7.90, SHRUG), (8.90, SHRUG), (9.20, SERIOUS), (10.70, SERIOUS),
    (11.10, POINT_UP_R), (14.10, POINT_UP_R), (14.60, TYPE), (21.20, TYPE), (21.90, POINT_UP_L),
    (25.90, POINT_UP_L), (26.30, POINT_YOU), (27.90, POINT_YOU), (28.30, OPEN_WIDE), (32.40, OPEN_WIDE),
    (33.00, POINT_UP_L), (35.40, POINT_UP_L), (35.80, POINT_YOU), (38.50, POINT_YOU), (38.90, CHEER_LITE),
    (39.70, CHEER_LITE),
]
WAVE_WINDOW = (0.0, 1.5)   # o aceno oscila só aqui
TYPE_WINDOW = (14.6, 21.2)  # mãos "digitando"


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--out", required=True)
    p.add_argument("--frames", default="")
    p.add_argument("--audio", default=os.path.join(HERE, "..", "videos", "2026-10-28-leads-alto-ticket",
                                                   "audio", "narracao.wav"))
    p.add_argument("--width", type=int, default=1080)
    p.add_argument("--height", type=int, default=1920)
    p.add_argument("--samples", type=int, default=24)
    p.add_argument("--duration", type=float, default=39.7)
    p.add_argument("--crop", type=float, default=0.0,
                   help="renderiza só a faixa de baixo (fração da altura, ex. 0.62): menos pixels, mesmo enquadramento")
    return p.parse_args(argv)


def parse_frames(spec: str, total: int) -> list[int]:
    if not spec:
        return list(range(1, total + 1))
    if "-" in spec and "," not in spec:
        a, b = spec.split("-")
        return list(range(int(a), int(b) + 1))
    return [int(x) for x in spec.split(",")]


def smooth(u: float) -> float:
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def pose_at(t: float) -> dict:
    """Mistura os keyframes do TIMELINE com easing + idle + gestos oscilantes."""
    if t <= TIMELINE[0][0]:
        base = dict(TIMELINE[0][1])
    elif t >= TIMELINE[-1][0]:
        base = dict(TIMELINE[-1][1])
    else:
        for (t0, a), (t1, b) in zip(TIMELINE, TIMELINE[1:]):
            if t0 <= t <= t1:
                base = mr.blend(a, b, smooth((t - t0) / max(t1 - t0, 1e-6)))
                break
    pose = {j: tuple(v) for j, v in base.items()}
    for j in mr.REST:
        pose.setdefault(j, mr.REST[j])

    # respiração + leve balanço da cabeça
    sx, sy, sz = pose["spine"]
    pose["spine"] = (sx + 1.4 * math.sin(t * 2.6), sy, sz + 0.8 * math.sin(t * 1.3))
    hx, hy, hz = pose["head"]
    pose["head"] = (hx + 1.2 * math.sin(t * 2.0 + 1.0), hy, hz + 1.8 * math.sin(t * 1.5))

    if WAVE_WINDOW[0] <= t <= WAVE_WINDOW[1]:
        w = math.sin((t - WAVE_WINDOW[0]) * 11.0)
        ex, ey, ez = pose["elbow_r"]
        pose["elbow_r"] = (ex, -15 + 30 * w, ez)
    if TYPE_WINDOW[0] <= t <= TYPE_WINDOW[1]:
        k = smooth(min((t - TYPE_WINDOW[0]) / 0.5, (TYPE_WINDOW[1] - t) / 0.5))
        for side, ph in (("l", 0.0), ("r", math.pi)):
            ex, ey, ez = pose[f"elbow_{side}"]
            pose[f"elbow_{side}"] = (ex + k * 16 * math.sin(t * 14.0 + ph), ey, ez)
    return pose


def speech_envelope(path: str, fps: int, frames: int) -> np.ndarray:
    """Volume (0-1) por frame, suavizado, para animar o brilho dos olhos."""
    try:
        with wave.open(path, "rb") as w:
            sr, ch = w.getframerate(), w.getnchannels()
            raw = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32)
        if ch > 1:
            raw = raw.reshape(-1, ch).mean(axis=1)
    except (OSError, wave.Error) as exc:
        print(f"[ferabot] sem envelope de voz ({exc})")
        return np.zeros(frames)
    hop = sr // fps
    env = np.array([np.sqrt(np.mean(raw[i * hop:(i + 1) * hop] ** 2)) if i * hop < len(raw) else 0.0
                    for i in range(frames)])
    env = env / (env.max() or 1.0)
    kernel = np.array([0.25, 0.5, 0.25])
    return np.convolve(env, kernel, mode="same")


# --- construção da cena -----------------------------------------------------------------------------

def emission_material(name, color, strength):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = (*color, 1.0)
    em.inputs["Strength"].default_value = strength
    nt.links.new(em.outputs[0], out.inputs["Surface"])
    return m, em


def build_ferabot():
    rig = mr.build_mascot("ferabot")
    orange = bpy.data.materials["mascot_orange"]
    bsdf = orange.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*FERA_ORANGE, 1.0)
    bsdf.inputs["Emission Color"].default_value = (*FERA_ORANGE, 1.0)
    bsdf.inputs["Emission Strength"].default_value = 0.0
    bsdf.inputs["Roughness"].default_value = 0.5

    # olhos-visor: emissivos, creme
    eye = rig["eye_mat"]
    eb = eye.node_tree.nodes["Principled BSDF"]
    eb.inputs["Base Color"].default_value = (1.0, 0.86, 0.66, 1.0)
    eb.inputs["Emission Color"].default_value = (1.0, 0.86, 0.66, 1.0)
    eb.inputs["Emission Strength"].default_value = 6.0
    rig["eye_strength"] = eb.inputs["Emission Strength"]

    # antena
    tip_mat, _ = emission_material("antenna_glow", (1.0, 0.45, 0.12), 7.0)
    mr._box("antenna_stem", (0.09, 0.09, 0.34), (0.0, 0.06, 1.12 + 0.17), rig["head"], orange, 0.02)
    mr._box("antenna_tip", (0.22, 0.22, 0.22), (0.0, 0.06, 1.12 + 0.45), rig["head"], tip_mat, 0.05)

    # placa + wordmark branco no peito (frente do torso: y = -0.36 no espaço da coluna)
    plate = bpy.data.materials.new("plate")
    plate.use_nodes = True
    pb = plate.node_tree.nodes["Principled BSDF"]
    pb.inputs["Base Color"].default_value = (0.004, 0.004, 0.005, 1.0)
    pb.inputs["Roughness"].default_value = 0.3
    mr._box("chest_plate", (0.86, 0.03, 0.32), (0.0, -0.375, 0.5), rig["spine"], plate, 0.012)
    white, _ = emission_material("wordmark_white", (1.0, 1.0, 1.0), 2.4)
    add_wordmark("FERABOT", (0.0, -0.395, 0.5), 0.74, white, rig["spine"])
    return rig


def add_wordmark(text, location, max_width, mat, parent):
    curve = bpy.data.curves.new("wordmark", "FONT")
    curve.body, curve.align_x, curve.align_y = text, "CENTER", "CENTER"
    curve.extrude, curve.bevel_depth = 0.02, 0.003
    for path in WORDMARK_FONTS:
        if os.path.exists(path):
            curve.font = bpy.data.fonts.load(path)
            break
    obj = bpy.data.objects.new("wordmark", curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    obj.parent = parent
    obj.rotation_euler = (math.radians(90), 0.0, 0.0)
    obj.location = location
    bpy.context.view_layer.update()
    scale = max_width / max(obj.dimensions.x, 1e-6)
    obj.scale = (scale, scale, 1.0)


def add_area(name, loc, target, size, size_y, power, color):
    d = bpy.data.lights.new(name, "AREA")
    d.shape, d.size, d.size_y, d.energy, d.color = "RECTANGLE", size, size_y, power, color
    o = bpy.data.objects.new(name, d)
    bpy.context.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    o.visible_camera = False


def setup_scene(args):
    scene = bpy.context.scene
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    rig = build_ferabot()

    target = (0.0, 0.0, 2.6)
    add_area("Key", (-4.0, -9.0, 7.5), target, 5.0, 5.0, 1300, (1.0, 0.95, 0.9))
    add_area("Fill", (6.0, -7.0, 3.5), target, 5.0, 5.0, 260, (0.9, 0.95, 1.0))
    add_area("RimL", (-3.5, 6.0, 7.0), target, 1.2, 4.0, 700, (1.0, 0.92, 0.85))
    add_area("RimR", (4.0, 5.0, 7.0), target, 1.2, 4.0, 700, (1.0, 0.92, 0.85))
    add_area("Top", (0.0, -2.0, 9.0), target, 4.0, 4.0, 260, (1.0, 0.97, 0.94))

    world = bpy.data.worlds.new("amb")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.55, 0.55, 0.6, 1.0)
    bg.inputs["Strength"].default_value = 0.35
    scene.world = world

    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens = 50
    cam_data.sensor_width = 36
    cam = bpy.data.objects.new("cam", cam_data)
    bpy.context.collection.objects.link(cam)
    cam.location = (0.0, -9.5, 4.27)
    cam.rotation_euler = (math.radians(90), 0.0, 0.0)  # olha reto pra +Y
    scene.camera = cam

    scene.render.engine = "BLENDER_EEVEE"
    try:
        scene.eevee.taa_render_samples = args.samples
    except AttributeError:
        pass
    scene.render.film_transparent = True
    scene.render.resolution_x, scene.render.resolution_y = args.width, args.height
    scene.render.resolution_percentage = 100
    scene.view_settings.view_transform = "Khronos PBR Neutral"
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.fps = FPS
    if args.crop > 0:
        scene.render.use_border = True
        scene.render.use_crop_to_border = True
        scene.render.border_min_x, scene.render.border_max_x = 0.0, 1.0
        scene.render.border_min_y, scene.render.border_max_y = 0.0, args.crop
    return scene, rig


def animate(scene, rig, frames: list[int], total: int, audio: str):
    env = speech_envelope(audio, FPS, total)
    for f in frames:
        t = (f - 1) / FPS
        mr.pose(rig, f, pose_at(t))
        rig["eye_strength"].default_value = 5.0 + 9.0 * float(env[min(f - 1, len(env) - 1)])
        rig["eye_strength"].keyframe_insert("default_value", frame=f)
    # Já amostramos quadro a quadro, então Bezier entre chaves vizinhas é praticamente linear.
    # (Blender 5.x trocou action.fcurves por channelbags; não vale o código só pra forçar LINEAR.)


def main():
    args = parse_args()
    total = int(round(args.duration * FPS))
    frames = parse_frames(args.frames, total)
    scene, rig = setup_scene(args)
    animate(scene, rig, frames, total, args.audio)
    args.out = os.path.abspath(args.out)
    os.makedirs(args.out, exist_ok=True)
    for f in frames:
        scene.frame_set(f)
        scene.render.filepath = os.path.join(args.out, f"f_{f:04d}.png")
        bpy.ops.render.render(write_still=True)
    print(f"[ferabot] {len(frames)} frames em {args.out}")


if __name__ == "__main__":
    main()
