"""The orange voxel mascot, built from code with jointed limbs, 22 Oct 2026.

Built to match mascot.png: matte orange #F0531F,
a big cube head with two small cube ears, two black slot eyes, a neck block, a square torso, segmented
arms with block hands, block legs and boots. Every part is a softly bevelled box parented to a joint empty,
so a pose is just joint rotations.

    from mascot_rig import build_mascot, pose
    rig = build_mascot()                     # dict of joints, rig["root"] stands on the ground at its origin
    pose(rig, frame, {"hip_l": (-30, 0, 0), ...})   # degrees, keyframed

Facing: the face looks down local -Y. Lateral axis is local X, so swinging a limb forward is a negative
X rotation at the shoulder or hip, and bending a knee is a positive X rotation.
"""
import math

import bpy

ORANGE = (0.871, 0.0865, 0.0137)        # #F0531F in linear


def _mat(name, color, rough=0.55, emit=0.0):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Emission Color"].default_value = (*color, 1)
    b.inputs["Emission Strength"].default_value = emit
    return m


def _empty(name, parent, loc):
    o = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(o)
    o.empty_display_size = 0.2
    o.parent = parent
    o.location = loc
    o.rotation_mode = "XYZ"
    return o


def _box(name, size, loc, parent, material, bevel=0.045):
    mesh = bpy.data.meshes.new(name)
    sx, sy, sz = (s / 2 for s in size)
    verts = [(x, y, z) for x in (-sx, sx) for y in (-sy, sy) for z in (-sz, sz)]
    faces = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    mesh.from_pydata(verts, [], faces)
    mesh.materials.append(material)
    o = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(o)
    o.parent = parent
    o.location = loc
    if bevel:
        mod = o.modifiers.new("Bevel", "BEVEL")
        mod.width = min(bevel, min(size) * 0.3)
        mod.segments = 3
        mod.harden_normals = False
    for p in mesh.polygons:
        p.use_smooth = True
    return o


def build_mascot(name="mascot", location=(0, 0, 0), eye_glow=False):
    """Build the mascot. Returns a dict: joints by name, plus 'parts' (every mesh) and 'eye_mat'."""
    orange = _mat("mascot_orange", ORANGE, rough=0.5)
    eye = _mat("mascot_eye_glow" if eye_glow else "mascot_eye", (0.008, 0.008, 0.01), rough=0.25)
    rig = {"parts": [], "eye_mat": eye}

    root = _empty(f"{name}_root", None, location)
    body = _empty(f"{name}_body", root, (0, 0, 1.85))       # pivot for flips and leans, near the middle
    hips = _empty(f"{name}_hips", body, (0, 0, -0.35))
    spine = _empty(f"{name}_spine", hips, (0, 0, 0.15))
    neck = _empty(f"{name}_neck", spine, (0, 0, 0.95))
    head = _empty(f"{name}_head", neck, (0, 0, 0.14))
    rig.update(root=root, body=body, hips=hips, spine=spine, neck=neck, head=head)

    P = rig["parts"].append
    P(_box("pelvis", (0.9, 0.55, 0.3), (0, 0, 0.0), hips, orange))
    P(_box("torso", (1.0, 0.72, 0.95), (0, 0, 0.475), spine, orange, 0.06))
    P(_box("neckblock", (0.36, 0.32, 0.16), (0, 0, 0.07), neck, orange, 0.03))
    P(_box("headbox", (1.42, 1.18, 1.12), (0, 0, 0.56), head, orange, 0.08))
    for s in (-1, 1):
        P(_box(f"ear_{s}", (0.2, 0.2, 0.3), (0.48 * s, 0.08, 1.24), head, orange, 0.035))
        P(_box(f"eye_{s}", (0.19, 0.05, 0.38), (0.28 * s, -0.585, 0.58), head, eye, 0.015))

    for side, s in (("l", -1), ("r", 1)):
        sh = _empty(f"{name}_shoulder_{side}", spine, (0.64 * s, 0, 0.8))
        P(_box(f"shcap_{side}", (0.36, 0.42, 0.36), (0.03 * s, 0, -0.04), sh, orange))
        P(_box(f"uarm_{side}", (0.31, 0.33, 0.44), (0, 0, -0.38), sh, orange))
        el = _empty(f"{name}_elbow_{side}", sh, (0, 0, -0.62))
        P(_box(f"farm_{side}", (0.3, 0.31, 0.42), (0, 0, -0.22), el, orange))
        P(_box(f"hand_{side}", (0.37, 0.34, 0.33), (0, -0.02, -0.58), el, orange))
        hp = _empty(f"{name}_hip_{side}", hips, (0.24 * s, 0, -0.08))
        P(_box(f"tcap_{side}", (0.44, 0.5, 0.22), (0, 0, -0.08), hp, orange))
        P(_box(f"thigh_{side}", (0.38, 0.4, 0.52), (0, 0, -0.43), hp, orange))
        kn = _empty(f"{name}_knee_{side}", hp, (0, 0, -0.72))
        P(_box(f"shin_{side}", (0.36, 0.38, 0.46), (0, 0, -0.2), kn, orange))
        P(_box(f"boottop_{side}", (0.44, 0.52, 0.17), (0, -0.04, -0.5), kn, orange))
        P(_box(f"boot_{side}", (0.5, 0.74, 0.2), (0, -0.11, -0.6), kn, orange))
        rig.update({f"shoulder_{side}": sh, f"elbow_{side}": el, f"hip_{side}": hp, f"knee_{side}": kn})
    return rig


REST = {k: (0.0, 0.0, 0.0) for k in
        ("body", "hips", "spine", "neck", "head", "shoulder_l", "shoulder_r", "elbow_l", "elbow_r",
         "hip_l", "hip_r", "knee_l", "knee_r")}


def pose(rig, frame, angles):
    """Set joint rotations in degrees (missing joints go to rest) and keyframe them all."""
    for j, rest in REST.items():
        a = angles.get(j, rest)
        o = rig[j]
        o.rotation_euler = tuple(math.radians(v) for v in a)
        o.keyframe_insert("rotation_euler", frame=frame)


def blend(a, b, u):
    """Mix two pose dicts, u from 0 (a) to 1 (b)."""
    out = {}
    for j in REST:
        va, vb = a.get(j, REST[j]), b.get(j, REST[j])
        out[j] = tuple(x + (y - x) * u for x, y in zip(va, vb))
    return out


def run_pose(phase, lean=10.0):
    """One point of a run cycle. phase in radians; a full cycle is two steps."""
    s, c = math.sin(phase), math.cos(phase)
    return {
        "spine": (lean, 0, 4 * s),
        "head": (-lean * 0.6, 0, -3 * s),
        "hip_l": (-38 * s - 5, 0, 0), "hip_r": (38 * s - 5, 0, 0),
        "knee_l": (12 + 62 * max(0.0, c), 0, 0), "knee_r": (12 + 62 * max(0.0, -c), 0, 0),
        "shoulder_l": (42 * s, 0, -8), "shoulder_r": (-42 * s, 0, 8),
        "elbow_l": (-75, 0, 0), "elbow_r": (-75, 0, 0),
    }


CROUCH = {"spine": (22, 0, 0), "head": (-12, 0, 0), "hip_l": (-62, 0, 0), "hip_r": (-62, 0, 0),
          "knee_l": (88, 0, 0), "knee_r": (88, 0, 0), "shoulder_l": (55, 0, -12), "shoulder_r": (55, 0, 12),
          "elbow_l": (-30, 0, 0), "elbow_r": (-30, 0, 0)}
LAUNCH = {"spine": (-6, 0, 0), "head": (-8, 0, 0), "hip_l": (8, 0, 0), "hip_r": (-10, 0, 0),
          "knee_l": (10, 0, 0), "knee_r": (25, 0, 0), "shoulder_l": (-160, 0, -18), "shoulder_r": (-160, 0, 18),
          "elbow_l": (-15, 0, 0), "elbow_r": (-15, 0, 0)}
TUCK = {"spine": (25, 0, 0), "head": (-10, 0, 0), "hip_l": (-95, 0, 0), "hip_r": (-95, 0, 0),
        "knee_l": (115, 0, 0), "knee_r": (115, 0, 0), "shoulder_l": (-70, 0, -25), "shoulder_r": (-70, 0, 25),
        "elbow_l": (-60, 0, 0), "elbow_r": (-60, 0, 0)}
REACH = {"spine": (4, 0, 0), "head": (-6, 0, 0), "hip_l": (-35, 0, 0), "hip_r": (-12, 0, 0),
         "knee_l": (30, 0, 0), "knee_r": (40, 0, 0), "shoulder_l": (-105, 0, -40), "shoulder_r": (-105, 0, 40),
         "elbow_l": (-20, 0, 0), "elbow_r": (-20, 0, 0)}
LAND = {"spine": (28, 0, 0), "head": (-14, 0, 0), "hip_l": (-70, 0, 0), "hip_r": (-70, 0, 0),
        "knee_l": (100, 0, 0), "knee_r": (100, 0, 0), "shoulder_l": (-35, 0, -45), "shoulder_r": (-35, 0, 45),
        "elbow_l": (-40, 0, 0), "elbow_r": (-40, 0, 0)}
CHEER = {"spine": (-6, 0, 0), "head": (-10, 0, 0), "hip_l": (0, 0, -4), "hip_r": (0, 0, 4),
         "shoulder_l": (-165, 0, -28), "shoulder_r": (-165, 0, 28), "elbow_l": (-10, 0, 0), "elbow_r": (-10, 0, 0)}
STAND = {"shoulder_l": (0, 0, -6), "shoulder_r": (0, 0, 6), "elbow_l": (-12, 0, 0), "elbow_r": (-12, 0, 0)}


def wave_pose(t):
    """Right arm raised to the side and waving from the elbow; t in seconds since the wave started."""
    w = math.sin(t * 10.0)
    return {"spine": (-3, 0, 2), "head": (-6, 0, 6), "shoulder_l": (0, 0, -6), "elbow_l": (-12, 0, 0),
            "shoulder_r": (0, -150, 0), "elbow_r": (0, -15 + 28 * w, 0),
            "hip_l": (0, 0, -3), "hip_r": (0, 0, 3)}
