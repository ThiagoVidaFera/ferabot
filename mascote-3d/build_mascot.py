"""
Build the block mascot (see mascot.png) in 3D and render a 1920x1080 studio still.

Run headless, without opening the Blender UI:
    /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup -P build_mascot.py

Optional arguments go after "--":
    --output PATH      where to write the PNG (default: level-1.png next to this script)
    --samples N        Cycles samples (default 256)
    --percent P        resolution percentage, handy for quick previews (default 100)
    --exposure EV      brighten (+) or darken (-) the whole image in stops (default 0)
    --save-blend PATH  also save the built scene as a .blend file

Units are metres. The mascot faces -Y (towards the camera), +Z is up, and his
right-hand side is -X (the left of the picture).
"""

import argparse
import math
import os
import random
import sys
import time

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else os.getcwd()

ORANGE = (0.98, 0.09, 0.004, 1.0)  # linear version of the mascot's sRGB (253, 84, 6)
rng = random.Random(7)


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--output", default=os.path.join(SCRIPT_DIR, "level-1.png"))
    p.add_argument("--samples", type=int, default=256)
    p.add_argument("--percent", type=int, default=100)
    p.add_argument("--exposure", type=float, default=0.0)
    p.add_argument("--save-blend", default=None)
    return p.parse_args(argv)


# ---------------------------------------------------------------------------
# Scene reset
# ---------------------------------------------------------------------------

def reset_scene():
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras):
        for item in list(block):
            block.remove(item)
    return bpy.context.scene


# ---------------------------------------------------------------------------
# Materials
# ---------------------------------------------------------------------------

def new_material(name):
    mat = bpy.data.materials.new(name)
    nt = mat.node_tree  # Blender 5.x materials always have a node tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    return mat, nt, out


def math_node(nt, op, a=None, b=None):
    n = nt.nodes.new("ShaderNodeMath")
    n.operation = op
    for i, v in enumerate((a, b)):
        if v is None:
            continue
        if isinstance(v, (int, float)):
            n.inputs[i].default_value = v
        else:
            nt.links.new(v, n.inputs[i])
    return n.outputs[0]


def map_range(nt, value, from_min, from_max, to_min, to_max, interp="LINEAR"):
    n = nt.nodes.new("ShaderNodeMapRange")
    n.interpolation_type = interp
    n.clamp = True
    nt.links.new(value, n.inputs["Value"])
    n.inputs["From Min"].default_value = from_min
    n.inputs["From Max"].default_value = from_max
    n.inputs["To Min"].default_value = to_min
    n.inputs["To Max"].default_value = to_max
    return n.outputs["Result"]


def make_orange_material():
    """Satin, slightly grainy painted plastic like the reference render."""
    mat, nt, out = new_material("MascotOrange")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = ORANGE
    bsdf.inputs["Roughness"].default_value = 0.56
    bsdf.inputs["Specular IOR Level"].default_value = 0.32

    coord = nt.nodes.new("ShaderNodeTexCoord")
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 90.0
    noise.inputs["Detail"].default_value = 6.0
    nt.links.new(coord.outputs["Object"], noise.inputs["Vector"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.035
    bump.inputs["Distance"].default_value = 0.002
    nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def make_eye_material():
    mat, nt, out = new_material("EyeBlack")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (0.006, 0.006, 0.008, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.22
    bsdf.inputs["Coat Weight"].default_value = 0.6
    bsdf.inputs["Coat Roughness"].default_value = 0.08
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def make_floor_material():
    """Near-black base with a lacquer clear coat: crisp but slightly soft reflections."""
    mat, nt, out = new_material("GlossyFloor")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (0.010, 0.010, 0.012, 1.0)
    bsdf.inputs["Specular IOR Level"].default_value = 0.15  # the coat does most of the reflecting
    bsdf.inputs["Coat Weight"].default_value = 1.0
    bsdf.inputs["Coat IOR"].default_value = 1.5

    # Fine, faint roughness variation so the reflection doesn't look like a perfect mirror.
    coord = nt.nodes.new("ShaderNodeTexCoord")
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 6.0
    noise.inputs["Detail"].default_value = 4.0
    nt.links.new(coord.outputs["Object"], noise.inputs["Vector"])
    nt.links.new(map_range(nt, noise.outputs["Fac"], 0.3, 0.7, 0.4, 0.46), bsdf.inputs["Roughness"])
    nt.links.new(map_range(nt, noise.outputs["Fac"], 0.3, 0.7, 0.014, 0.022), bsdf.inputs["Coat Roughness"])

    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def make_panel_material(half_w, half_h, radius, halo, color, strength, see_through=True, edge=0.5):
    """Emissive rounded rectangle with a soft halo, drawn with a signed distance field.

    The panel mesh is larger than the visible panel; the extra margin carries the halo,
    which fades to exactly zero before the mesh edge so no rectangle outline shows.
    see_through=False makes it a plain opaque emitter, which EEVEE's screen-space ray
    tracing can see in reflections (it only matches the look against a black world).
    edge is the brightness at the panel edge relative to its centre.
    """
    mat, nt, out = new_material("GlowPanel")
    coord = nt.nodes.new("ShaderNodeTexCoord")

    def vmath(op, a, b=None):
        n = nt.nodes.new("ShaderNodeVectorMath")
        n.operation = op
        nt.links.new(a, n.inputs[0])
        if b is not None:
            n.inputs[1].default_value = b
        return n

    # Rounded-box SDF: d = |max(q, 0)| + min(max(qx, qy), 0) - r, with q = |p| - (b - r).
    q = vmath("SUBTRACT", vmath("ABSOLUTE", coord.outputs["Object"]).outputs["Vector"],
              (half_w - radius, half_h - radius, 0.0)).outputs["Vector"]
    outside = vmath("LENGTH", vmath("MAXIMUM", q, (0.0, 0.0, 0.0)).outputs["Vector"]).outputs["Value"]
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(q, sep.inputs["Vector"])
    inside = math_node(nt, "MINIMUM", math_node(nt, "MAXIMUM", sep.outputs["X"], sep.outputs["Y"]), 0.0)
    dist = math_node(nt, "SUBTRACT", math_node(nt, "ADD", outside, inside), radius)

    core = map_range(nt, dist, -0.012, 0.012, 1.0, 0.0, "SMOOTHSTEP")

    # Softbox look: brighter centre fading towards the edges. Uses an elliptical radius
    # rather than the box SDF, whose gradient creases along the diagonals.
    scaled = vmath("DIVIDE", coord.outputs["Object"], (half_w, half_h, 1.0)).outputs["Vector"]
    r2 = vmath("DOT_PRODUCT", scaled, None)
    nt.links.new(scaled, r2.inputs[1])
    centre_boost = map_range(nt, r2.outputs["Value"], 0.0, 2.0, 1.0, edge, "SMOOTHSTEP")

    # Halo: exponential falloff starting dimmer than the panel edge, windowed to zero
    # before the mesh border.
    dist_out = math_node(nt, "MAXIMUM", dist, 0.0)
    falloff = math_node(nt, "EXPONENT", math_node(nt, "MULTIPLY", dist_out, -1.0 / (0.28 * halo)))
    window = map_range(nt, dist, 0.45 * halo, halo, 1.0, 0.0, "SMOOTHSTEP")
    glow_halo = math_node(nt, "MULTIPLY", math_node(nt, "MULTIPLY", falloff, window), 0.76 * edge)
    glow = math_node(
        nt, "ADD",
        math_node(nt, "MULTIPLY", core, centre_boost),
        math_node(nt, "MULTIPLY", glow_halo, math_node(nt, "SUBTRACT", 1.0, core)),
    )

    emit = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = color
    nt.links.new(math_node(nt, "MULTIPLY", glow, strength), emit.inputs["Strength"])
    if not see_through:
        nt.links.new(emit.outputs[0], out.inputs["Surface"])
        return mat
    transparent = nt.nodes.new("ShaderNodeBsdfTransparent")
    add = nt.nodes.new("ShaderNodeAddShader")
    nt.links.new(transparent.outputs[0], add.inputs[0])
    nt.links.new(emit.outputs[0], add.inputs[1])
    nt.links.new(add.outputs[0], out.inputs["Surface"])
    return mat


# ---------------------------------------------------------------------------
# Block building
# ---------------------------------------------------------------------------

def jitter(deg=1.2, yaw_only=False):
    """Tiny random tilt so the figure looks hand-assembled rather than CAD-perfect."""
    r = lambda: math.radians(rng.uniform(-deg, deg))
    if yaw_only:
        return Euler((0.0, 0.0, r())).to_matrix()
    return Euler((r(), r(), r())).to_matrix()


def frame_along(direction):
    """Rotation whose local Z follows `direction` and whose local Y stays close to world Y."""
    z = Vector(direction).normalized()
    x = Vector((0.0, 1.0, 0.0)).cross(z).normalized()
    y = z.cross(x)
    return Matrix((x, y, z)).transposed()


def make_block(name, dims, location, rotation=None, mat=None, bevel=0.012):
    """Bevelled box with its dimensions baked into the mesh so bevels stay uniform."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * dims[0], v.co.y * dims[1], v.co.z * dims[2]))
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for poly in mesh.polygons:
        poly.use_smooth = True
    if mat:
        mesh.materials.append(mat)

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    rot = rotation if rotation is not None else Matrix.Identity(3)
    obj.matrix_world = Matrix.Translation(Vector(location)) @ rot.to_4x4()

    mod = obj.modifiers.new("Bevel", "BEVEL")
    mod.width = bevel
    mod.segments = 3
    mod.limit_method = "ANGLE"
    mod.harden_normals = True
    return obj


def block_between(name, p0, p1, w, d, mat, gap=0.008, bevel=0.012):
    """Limb segment spanning joint p0 -> p1. Returns (centre, rotation, length) for attachments."""
    p0, p1 = Vector(p0), Vector(p1)
    length = (p1 - p0).length - gap
    rot = frame_along(p1 - p0) @ jitter()
    centre = (p0 + p1) / 2
    make_block(name, (w, d, length), centre, rot, mat, bevel)
    return centre, rot, length


def attach(name, centre, rot, offset, dims, mat, local_rot=None, bevel=0.01):
    """Place a block in another block's local frame."""
    r = rot @ local_rot if local_rot is not None else rot
    return make_block(name, dims, centre + rot @ Vector(offset), r, mat, bevel)


def build_fist(name, p0, p1, mat):
    """Palm block plus two knuckles on top, curled fingertips in front and a thumb on the inside.

    In the palm's frame +Z points towards the knuckles, -Y is the front and -X faces the body.
    """
    w, d = 0.175, 0.18
    c, rot, length = block_between(f"{name}_Palm", p0, p1, w, d, mat, bevel=0.011)
    top = length / 2
    for i, sx in enumerate((-1, 1)):
        attach(f"{name}_Knuckle{i}", c, rot, (sx * 0.046, 0.006, top + 0.03), (0.086, 0.09, 0.084), mat,
               jitter(3.0))
    attach(f"{name}_Fingers", c, rot, (0.0, -(d / 2 + 0.022), top - 0.028), (w * 0.94, 0.062, 0.09), mat)
    attach(f"{name}_Thumb", c, rot, (-(w / 2 + 0.024), -d / 2 + 0.04, -0.004), (0.072, 0.08, 0.1), mat,
           Euler((0.0, math.radians(18), 0.0)).to_matrix())


# Joints of a hanging arm, for his right side (x is mirrored for the left):
# shoulder top, shoulder/upper-arm, elbow, elbow/forearm, wrist, fist tip.
ARM_CHAIN = [(0.33, 0.0, 1.36), (0.385, 0.0, 1.175), (0.43, -0.005, 0.99),
             (0.455, -0.01, 0.87), (0.468, -0.015, 0.745), (0.465, -0.02, 0.56)]
ARM_SIZES = [(0.18, 0.2), (0.18, 0.19), (0.2, 0.2), (0.185, 0.19)]


def build_hanging_arm(side, s, mat):
    """Arm blocks Arm{side}0..3 plus Fist{side}_*; s = -1 for his right (picture left), +1 for his left."""
    pts = [(s * x, y, z) for x, y, z in ARM_CHAIN]
    for i, (w, d) in enumerate(ARM_SIZES):
        block_between(f"Arm{side}{i}", pts[i], pts[i + 1], w, d, mat)
    build_fist(f"Fist{side}", pts[4], pts[5], mat)


def build_mascot(orange, eye_mat, arms_down=False):
    """Build the figure. arms_down=True gives the neutral pose used for rigging and animation."""
    # Head with ear studs and slot eyes. The head leans a touch towards the waving hand.
    head_c = Vector((0.0, 0.0, 1.672))
    head_rot = Euler((math.radians(-1.0), math.radians(1.5), math.radians(2.0))).to_matrix()
    make_block("Head", (0.61, 0.53, 0.55), head_c, head_rot, orange, bevel=0.016)
    for i, sx in enumerate((-1, 1)):
        attach(f"Ear{i}", head_c, head_rot, (sx * 0.19, 0.02, 0.275 + 0.045), (0.105, 0.105, 0.11), orange,
               jitter(1.5))
        attach(f"Eye{i}", head_c, head_rot, (sx * 0.13, -0.265 + 0.007, 0.022), (0.088, 0.02, 0.172), eye_mat,
               bevel=0.004)

    make_block("Neck", (0.29, 0.26, 0.10), (0.0, 0.0, 1.372), jitter(), orange)
    make_block("Torso", (0.52, 0.40, 0.48), (0.0, 0.0, 1.12), jitter(0.6), orange, bevel=0.016)
    make_block("Pelvis", (0.42, 0.32, 0.14), (0.0, 0.0, 0.818), None, orange)

    # Right arm (picture left) hangs at his side, slightly splayed out.
    build_hanging_arm("R", -1, orange)

    if arms_down:
        # Mirrored fist puts the thumb outward at rest, so it ends up facing his head once
        # the animation swings the arm up into the wave.
        build_hanging_arm("L", 1, orange)
    else:
        build_waving_arm(orange)

    build_legs(orange, left_foot_yaw=5 if arms_down else 28)


def build_waving_arm(orange):
    # Left arm (picture right) raised in a wave: shoulder, upper arm out to the side, forearm up.
    block_between("ArmL0", (0.30, 0.0, 1.17), (0.35, 0.0, 1.36), 0.18, 0.2, orange)
    block_between("ArmL1", (0.36, -0.01, 1.285), (0.56, -0.03, 1.385), 0.17, 0.19, orange)
    tilt = math.radians(18)
    up = Vector((math.sin(tilt), -0.06, math.cos(tilt))).normalized()
    elbow = Vector((0.565, -0.04, 1.41))
    wrist_a = elbow + up * 0.13
    wrist_b = wrist_a + up * 0.13
    block_between("ArmL2", elbow, wrist_a, 0.2, 0.2, orange)
    block_between("ArmL3", wrist_a, wrist_b, 0.19, 0.19, orange)
    build_fist("FistL", wrist_b, wrist_b + up * 0.165, orange)


def build_legs(orange, left_foot_yaw):
    # Legs: hip cap, thigh, shin, ankle, foot. His left foot (picture right) can turn outward.
    for side, s in (("R", -1), ("L", 1)):
        make_block(f"Hip{side}", (0.22, 0.27, 0.11), (s * 0.215, 0.0, 0.78), jitter(0.8), orange)
        knee = (s * 0.226, -0.005, 0.545)
        ankle_x = s * 0.262 if s < 0 else 0.236
        block_between(f"Thigh{side}", (s * 0.215, 0.0, 0.726), knee, 0.19, 0.21, orange)
        block_between(f"Shin{side}", knee, (ankle_x, 0.0, 0.322), 0.21, 0.23, orange)

        yaw = math.radians(-5 if s < 0 else left_foot_yaw)
        foot_rot = Euler((0.0, 0.0, yaw)).to_matrix()
        ankle_c = Vector((ankle_x + s * 0.008, 0.02, 0.245))
        make_block(f"Ankle{side}", (0.26, 0.27, 0.15), ankle_c, foot_rot @ jitter(1.0, yaw_only=True), orange)
        toe_offset = foot_rot @ Vector((s * 0.025, -0.08, 0.0))
        foot_c = Vector((ankle_c.x + toe_offset.x, ankle_c.y + toe_offset.y, 0.0855))
        make_block(f"Foot{side}", (0.34, 0.42, 0.17), foot_c, foot_rot, orange, bevel=0.014)


# ---------------------------------------------------------------------------
# Set, lights, camera
# ---------------------------------------------------------------------------

def make_plane(name, half_w, half_h, location, rotation, mat):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([(-half_w, -half_h, 0), (half_w, -half_h, 0), (half_w, half_h, 0), (-half_w, half_h, 0)],
                     [], [(0, 1, 2, 3)])
    mesh.materials.append(mat)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = rotation
    return obj


def aim(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def add_area_light(name, location, target, size, size_y, power, color, spread_deg=180.0):
    data = bpy.data.lights.new(name, type="AREA")
    data.shape = "RECTANGLE"
    data.size = size
    data.size_y = size_y
    data.energy = power
    data.color = color
    try:
        data.spread = math.radians(spread_deg)
    except Exception:
        pass
    obj = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location
    aim(obj, target)
    obj.visible_camera = False  # light the scene without showing the softbox itself
    return obj


def build_set():
    make_plane("Floor", 30.0, 30.0, (0.0, 0.0, 0.0), (0.0, 0.0, 0.0), make_floor_material())

    half_w, half_h, halo = 1.4, 0.92, 0.7
    panel_mat = make_panel_material(half_w, half_h, radius=0.2, halo=halo,
                                    color=(0.78, 0.87, 1.0, 1.0), strength=1.3)
    # Offset and turned towards the camera so it sits centred behind him in frame.
    make_plane("GlowPanel", half_w + halo, half_h + halo, (0.55, 2.3, 1.45),
               (math.radians(90), 0.0, math.radians(-9)), panel_mat)

    world = bpy.data.worlds.new("StudioDark")
    bpy.context.scene.world = world
    bg = world.node_tree.nodes.get("Background") if world.node_tree else None
    if bg:
        bg.inputs["Color"].default_value = (0.004, 0.0045, 0.006, 1.0)
        bg.inputs["Strength"].default_value = 1.0
    else:
        world.color = (0.004, 0.0045, 0.006)

    target = (0.05, 0.0, 1.05)
    # Key front-left and high, cool fill low on the right, two rim strips behind, soft top light.
    # The rim strips stay above ~1.9 m so the floor never mirrors them into frame.
    add_area_light("Key", (-2.3, -4.6, 3.5), target, 2.4, 2.4, 330, (1.0, 0.95, 0.9))
    add_area_light("Fill", (3.8, -3.6, 1.5), target, 3.0, 3.0, 75, (0.88, 0.94, 1.0))
    add_area_light("RimL", (-1.2, 3.2, 3.0), (-0.1, 0.0, 1.3), 0.45, 1.8, 120, (0.85, 0.92, 1.0), 60)
    add_area_light("RimR", (1.9, 2.7, 3.0), (0.2, 0.0, 1.3), 0.45, 1.8, 170, (0.85, 0.92, 1.0), 60)
    add_area_light("Top", (0.0, -0.3, 4.6), (0.0, 0.0, 1.0), 2.0, 2.0, 85, (1.0, 0.97, 0.94))


def build_camera(scene):
    data = bpy.data.cameras.new("Camera")
    data.lens = 50
    data.sensor_width = 36
    cam = bpy.data.objects.new("Camera", data)
    scene.collection.objects.link(cam)
    cam.location = (-1.45, -6.6, 1.5)
    target = Vector((0.1, 0.0, 1.0))
    aim(cam, target)
    data.dof.use_dof = True
    data.dof.focus_distance = (Vector((0.0, -0.2, 1.2)) - cam.location).length
    data.dof.aperture_fstop = 4.0
    scene.camera = cam


# ---------------------------------------------------------------------------
# Render
# ---------------------------------------------------------------------------

def setup_render(scene, args):
    scene.render.engine = "CYCLES"
    device = "CPU"
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "METAL"
        prefs.get_devices()
        for dev in prefs.devices:
            dev.use = dev.type == "METAL"
            if dev.use:
                device = "GPU"
    except Exception as exc:
        print(f"[mascot] GPU setup failed, rendering on CPU: {exc}")
    scene.cycles.device = device
    print(f"[mascot] Cycles device: {device}")

    scene.cycles.samples = args.samples
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = args.percent
    scene.render.film_transparent = False

    # Khronos PBR Neutral keeps the brand orange saturated; AgX washes it out towards salmon.
    scene.view_settings.view_transform = "Khronos PBR Neutral"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = args.exposure

    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.filepath = os.path.abspath(args.output)


def main():
    args = parse_args()
    scene = reset_scene()
    orange = make_orange_material()
    build_mascot(orange, make_eye_material())
    build_set()
    build_camera(scene)
    setup_render(scene, args)

    if args.save_blend:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(args.save_blend))

    start = time.time()
    bpy.ops.render.render(write_still=True)
    print(f"[mascot] Saved {scene.render.filepath} in {time.time() - start:.1f}s")


if __name__ == "__main__":
    main()
