"""
Sonarhorin — internship story cartoons, built and rendered in Blender.

Builds friendly, stylised chibi characters (the five story students + a mentor) and the props
used in the /internships "every gate has a story" player, cel-shades them (flat 3-band toon
shading done with emission shaders, so it renders noise-free on CPU Cycles), outlines them with
an inverted hull, renders each one on a transparent background and writes small WebP files to
frontend/public/cartoons/.

Run (Blender 4.2+ as a Python module, or inside Blender):
    python tools/blender/render_intern_cartoons.py            # everything
    python tools/blender/render_intern_cartoons.py rafi-win   # only matching names (substring)
or
    blender -b -P tools/blender/render_intern_cartoons.py -- rafi

Needs Pillow in the same Python for the WebP step (pip install pillow). Without Pillow it keeps PNGs.
Everything here is original, generic artwork — no real people, no existing characters.
"""
import math
import os
import sys
import tempfile

import bpy  # noqa: I001 — bpy must be imported before bmesh/mathutils when running as a module
import bmesh
from mathutils import Euler, Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "..", "frontend", "public", "cartoons"))
TMP = os.path.join(tempfile.gettempdir(), "sonarhorin_cartoons")
CHAR_PX = 460   # characters: tallest side in px
PROP_PX = 300   # props: longest side in px
SAMPLES = 12

LIGHT = Vector((-0.5, -0.62, 0.78)).normalized()   # key light: upper-left, in front
INK = "#1D1733"                                     # outline / line colour


# --------------------------------------------------------------------------- colour + materials
def lin(hex_):
    hex_ = hex_.lstrip("#")
    c = [int(hex_[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x / 12.92) if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4) for x in c) + (1.0,)


def mix(a, b, t):
    return tuple(a[i] * (1 - t) + b[i] * t for i in range(3)) + (1.0,)


_MATS = {}


def toon(hex_, shade=0.58, hi=None, flat=False):
    """Three-band cel material: shadow / base / small highlight, lit by LIGHT. flat=True → one colour."""
    key = (hex_, shade, hi, flat)
    if key in _MATS:
        return _MATS[key]
    m = bpy.data.materials.new(f"toon_{hex_}_{len(_MATS)}")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    base = lin(hex_)
    if hi is None:  # dark colours get a subtler highlight so hair/trousers don't turn grey
        lum = 0.2126 * base[0] + 0.7152 * base[1] + 0.0722 * base[2]
        hi = 0.06 + 0.3 * min(1.0, lum * 1.6)
    if flat:
        em.inputs["Color"].default_value = base
    else:
        geo = nt.nodes.new("ShaderNodeNewGeometry")
        dot = nt.nodes.new("ShaderNodeVectorMath")
        dot.operation = "DOT_PRODUCT"
        dot.inputs[1].default_value = LIGHT
        rem = nt.nodes.new("ShaderNodeMath")
        rem.operation = "MULTIPLY_ADD"
        rem.inputs[1].default_value = 0.5
        rem.inputs[2].default_value = 0.5
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.interpolation = "CONSTANT"
        el = ramp.color_ramp.elements
        shadow = (base[0] * shade * 0.92, base[1] * shade * 0.9, min(1, base[2] * shade * 1.12 + 0.012), 1.0)
        el[0].position = 0.0
        el[0].color = shadow
        el[1].position = 0.44
        el[1].color = base
        e3 = el.new(0.87)
        e3.color = mix(base, (1, 1, 1), hi)
        nt.links.new(geo.outputs["Normal"], dot.inputs[0])
        nt.links.new(dot.outputs["Value"], rem.inputs[0])
        nt.links.new(rem.outputs[0], ramp.inputs[0])
        nt.links.new(ramp.outputs["Color"], em.inputs["Color"])
    nt.links.new(em.outputs[0], out.inputs[0])
    _MATS[key] = m
    return m


def outline_mat():
    if "outline" in _MATS:
        return _MATS["outline"]
    m = bpy.data.materials.new("outline")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = lin(INK)
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    mx = nt.nodes.new("ShaderNodeMixShader")
    # inverted hull: the shell faces turned toward the camera are see-through, the far side draws the ink line
    nt.links.new(geo.outputs["Backfacing"], mx.inputs[0])
    nt.links.new(em.outputs[0], mx.inputs[1])
    nt.links.new(tr.outputs[0], mx.inputs[2])
    nt.links.new(mx.outputs[0], out.inputs[0])
    _MATS["outline"] = m
    return m


# --------------------------------------------------------------------------- geometry helpers
LINE = 0.028   # outline thickness (scene units) — set per render


def _finish(name, bm, mat, smooth=True, outline=True, bevel=0.0, matrix=None):
    if matrix is not None:
        bm.transform(matrix)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if smooth:
        me.shade_smooth()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    ob.data.materials.append(mat)
    if bevel:
        bv = ob.modifiers.new("bevel", "BEVEL")
        bv.width = bevel
        bv.segments = 2
        bv.limit_method = "ANGLE"
    if outline:
        ob.data.materials.append(outline_mat())
        so = ob.modifiers.new("outline", "SOLIDIFY")
        so.thickness = LINE
        so.offset = 1.0
        so.use_flip_normals = True
        so.use_rim = False
        so.material_offset = 1
    return ob


def trs(loc=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1)):
    return Matrix.LocRotScale(Vector(loc), Euler([math.radians(a) for a in rot]), Vector(scale))


def sphere(name, mat, loc, scale=(1, 1, 1), rot=(0, 0, 0), seg=28, **kw):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=max(8, seg // 2 + 2), radius=1.0)
    return _finish(name, bm, mat, matrix=trs(loc, rot, scale), **kw)


def box(name, mat, loc, size, rot=(0, 0, 0), bevel=0.04, **kw):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    kw.setdefault("smooth", False)
    return _finish(name, bm, mat, matrix=trs(loc, rot, size), bevel=bevel, **kw)


def cyl(name, mat, loc, r1, r2, depth, rot=(0, 0, 0), seg=28, scale=(1, 1, 1), **kw):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r1, radius2=r2, depth=depth)
    kw.setdefault("smooth", True)
    ob = _finish(name, bm, mat, matrix=trs(loc, rot, scale), **kw)
    if kw.get("smooth", True):
        # keep caps crisp
        for p in ob.data.polygons:
            if abs(p.normal.z) > 0.99:
                p.use_smooth = False
    return ob


def capsule(name, mat, p1, p2, r, seg=20, squash=(1, 1), **kw):
    p1, p2 = Vector(p1), Vector(p2)
    d = p2 - p1
    L = d.length
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=max(8, seg // 2 + 2), radius=r)
    for v in bm.verts:
        v.co.x *= squash[0]
        v.co.y *= squash[1]
        v.co.z += L / 2 if v.co.z >= -1e-6 else -L / 2
    q = Vector((0, 0, 1)).rotation_difference(d.normalized()) if L > 1e-6 else Matrix.Identity(3).to_quaternion()
    m = Matrix.Translation((p1 + p2) / 2) @ q.to_matrix().to_4x4()
    return _finish(name, bm, mat, matrix=m, **kw)


def torus(name, mat, loc, R, r, rot=(0, 0, 0), seg=32, rseg=12, arc=360.0, scale=(1, 1, 1), **kw):
    bm = bmesh.new()
    rings = []
    closed = arc >= 359.9
    n = seg if closed else seg + 1
    for i in range(n):
        a = math.radians(arc) * i / seg
        ring = []
        for j in range(rseg):
            b = 2 * math.pi * j / rseg
            ring.append(bm.verts.new(((R + r * math.cos(b)) * math.cos(a), (R + r * math.cos(b)) * math.sin(a), r * math.sin(b))))
        rings.append(ring)
    for i in range(seg if closed else seg):
        a, b = rings[i], rings[(i + 1) % n]
        for j in range(rseg):
            bm.faces.new((a[j], b[j], b[(j + 1) % rseg], a[(j + 1) % rseg]))
    if not closed:
        bm.faces.new(list(reversed(rings[0])))
        bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return _finish(name, bm, mat, matrix=trs(loc, rot, scale), **kw)


def prism(name, mat, loc, w, h, d, rot=(0, 0, 0), **kw):
    """Triangular prism (roof / pediment): triangle in XZ, extruded along Y."""
    bm = bmesh.new()
    pts = [(-w / 2, 0), (w / 2, 0), (0, h)]
    f = [bm.verts.new((x, -d / 2, z)) for x, z in pts]
    b = [bm.verts.new((x, d / 2, z)) for x, z in pts]
    bm.faces.new(f)
    bm.faces.new(list(reversed(b)))
    for i in range(3):
        j = (i + 1) % 3
        bm.faces.new((f[j], f[i], b[i], b[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    kw.setdefault("smooth", False)
    return _finish(name, bm, mat, matrix=trs(loc, rot), **kw)


def curve(name, mat, pts, bevel=0.03):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = bevel
    cu.bevel_resolution = 3
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for p, c in zip(sp.points, pts):
        p.co = (c[0], c[1], c[2], 1)
    ob = bpy.data.objects.new(name, cu)
    ob.data.materials.append(mat)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def text(name, mat, body, loc, size=1.0, depth=0.08, rot=(90, 0, 0), outline=True):
    cu = bpy.data.curves.new(name, "FONT")
    cu.body = body
    cu.size = size
    cu.extrude = depth
    cu.align_x = "CENTER"
    cu.align_y = "CENTER"
    cu.bevel_depth = 0.01
    tmp = bpy.data.objects.new(name + "_t", cu)
    bpy.context.scene.collection.objects.link(tmp)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
    bpy.data.objects.remove(tmp)
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    return _finish(name, bm, mat, smooth=False, outline=outline, matrix=trs(loc, rot))


def arc_pts(c, rx, rz, a0, a1, n=14, y=0.0):
    return [(c[0] + rx * math.cos(math.radians(a0 + (a1 - a0) * i / (n - 1))), c[1] + y,
             c[2] + rz * math.sin(math.radians(a0 + (a1 - a0) * i / (n - 1)))) for i in range(n)]


# --------------------------------------------------------------------------- characters
CHARS = {
    # who: outfit + hair. Colours are hand-picked to match each gate's planet colour on the page.
    "rafi":   dict(sex="m", skin="#C88A5A", hair="#231A17", top="#2F7FD6", top2="#10B981", pants="#2A3350", shoe="#6B3F25", bag="#10B981", sleeve="short"),
    "mitu":   dict(sex="f", skin="#D29A68", hair="#1E1514", top="#7C6CF2", top2="#F7C948", pants="#F2E6D8", shoe="#B4466B", sleeve="long", style="dupatta"),
    "sakib":  dict(sex="m", skin="#B97A4F", hair="#1A1412", top="#F59E0B", top2="#FFF4DD", pants="#3A3F4F", shoe="#3B2A20", glasses=True, sleeve="short"),
    "tania":  dict(sex="f", skin="#C98E60", hair="#2B1D18", top="#2E5FB8", top2="#E9F0FF", pants="#24304F", shoe="#1F2433", sleeve="long", style="hijab", hijab="#E86A8F"),
    "arif":   dict(sex="m", skin="#A96C44", hair="#1C1513", top="#EC4899", top2="#FFE1EF", pants="#33415C", shoe="#2B2B2B", bag="#F59E0B", sleeve="short"),
    "mentor": dict(sex="m", skin="#B77B50", hair="#C9C4BC", top="#8B3A3A", top2="#F1E3C8", pants="#3B3B46", shoe="#3B2A20", glasses=True, sleeve="long", beard=True),
}

POSES = {
    #        right arm (screen-left) elbow, hand          left arm (screen-right) elbow, hand        lift
    "think": dict(r=((-0.62, -0.30, 1.20), (-0.20, -0.62, 1.86)), l=((0.62, 0.0, 1.10), (0.66, -0.05, 0.86)), lift=0.0, face="think"),
    "go":    dict(r=((-0.62, -0.02, 1.10), (-0.66, -0.08, 0.84)), l=((0.88, -0.06, 1.86), (0.88, -0.10, 2.38)), lift=0.0, face="smile"),
    "win":   dict(r=((-0.86, -0.02, 1.98), (-0.98, -0.08, 2.52)), l=((0.86, -0.02, 1.98), (0.98, -0.08, 2.52)), lift=0.12, face="joy"),
}


def on_head(H, R, az, el, k=1.0):
    a, e = math.radians(az), math.radians(el)
    return Vector((H.x + R * k * math.sin(a) * math.cos(e), H.y - R * k * math.cos(a) * math.cos(e), H.z + R * k * math.sin(e)))


def build_character(cid, pose):
    c = CHARS[cid]
    P = POSES[pose]
    lift = P["lift"]
    skin, hair, top, top2 = toon(c["skin"]), toon(c["hair"], shade=0.7, hi=0.07), toon(c["top"]), toon(c["top2"])
    pants, shoe = toon(c["pants"]), toon(c["shoe"], hi=0.3)
    ink = toon(INK, flat=True)
    white = toon("#FFFFFF", flat=True)
    female = c["sex"] == "f"

    # legs + shoes
    for s in (-1, 1):
        capsule(f"leg{s}", pants, (s * 0.19, 0, 1.0 + lift), (s * 0.21, 0, 0.30 + lift), 0.15)
        sphere(f"shoe{s}", shoe, (s * 0.23, -0.07, 0.14 + lift), (0.19, 0.27, 0.13))

    # torso
    if female:
        cyl("kameez", top, (0, 0, 1.15 + lift), 0.56, 0.36, 1.05, seg=32)
        cyl("hem", top2, (0, 0, 0.66 + lift), 0.565, 0.56, 0.07, seg=32, outline=False)
        capsule("chest", top, (0, 0, 1.45 + lift), (0, 0, 1.62 + lift), 0.37)
    else:
        capsule("torso", top, (0, 0, 1.05 + lift), (0, 0, 1.55 + lift), 0.42)
        if cid == "mentor":
            # sweater-vest look: collar v
            prism("collar", top2, (0, -0.41, 1.66 + lift), 0.36, -0.26, 0.05, outline=False)
        else:
            # shirt collar + placket
            prism("collarL", top2, (-0.1, -0.39, 1.86 + lift), 0.2, -0.16, 0.06, rot=(0, 0, 8))
            prism("collarR", top2, (0.1, -0.39, 1.86 + lift), 0.2, -0.16, 0.06, rot=(0, 0, -8))
        torus("belt", toon("#3A2A22"), (0, 0, 0.99 + lift), 0.41, 0.045, outline=False)

    # backpack straps / bag
    if c.get("bag"):
        bag = toon(c["bag"])
        box("bag", bag, (0, 0.38, 1.35 + lift), (0.62, 0.28, 0.7), bevel=0.1)
        for s in (-1, 1):
            capsule(f"strap{s}", bag, (s * 0.24, -0.33, 1.78 + lift), (s * 0.26, -0.36, 1.05 + lift), 0.045, outline=False)

    # arms (shoulder → elbow → hand)
    for side, key in ((-1, "r"), (1, "l")):
        sh = Vector((side * 0.42, 0, 1.62 + lift))
        el, hd = (Vector(v) + Vector((0, 0, lift)) for v in P[key])
        upper = top if c["sleeve"] == "short" else top
        lower = skin if c["sleeve"] == "short" else top
        capsule(f"up{key}", upper, sh, el, 0.125)
        capsule(f"lo{key}", lower, el, hd + (el - hd).normalized() * 0.1, 0.105)
        sphere(f"hand{key}", skin, hd, (0.14, 0.13, 0.15))

    if female and c.get("style") == "dupatta":
        torus("dupatta", top2 if cid != "mitu" else toon("#F7C948"), (0, -0.02, 1.62 + lift), 0.44, 0.075, rot=(14, -18, 0))
        capsule("dupTail", toon("#F7C948"), (0.36, 0.05, 1.62 + lift), (0.44, 0.22, 0.95 + lift), 0.08, squash=(1, 0.5))

    # head
    R = 0.66
    H = Vector((0, 0, 2.4 + lift))
    sphere("neck", skin, (0, 0, 1.8 + lift), (0.17, 0.17, 0.2), outline=False)
    sphere("head", skin, H, (R, R * 0.96, R * 0.98))
    for s in (-1, 1):
        if not c.get("style") == "hijab":
            sphere(f"ear{s}", skin, on_head(H, R, s * 88, 0, 0.98), (0.09, 0.08, 0.14))

    # hair / hijab / cap
    if c.get("style") == "hijab":
        hj = toon(c["hijab"])
        sphere("hijab", hj, H + Vector((0, 0.32, 0.08)), (R * 1.14, R * 1.1, R * 1.14))
        cyl("drape", hj, (0, 0.04, 1.72 + lift), 0.64, 0.42, 0.42, seg=32)
        sphere("pin", toon("#FFD23F"), on_head(H, R, -48, -42, 1.06), (0.05, 0.05, 0.05), outline=False)
    else:
        hc = H + Vector((0, 0.12, 0.13))
        sphere("hair", hair, hc, (R * 1.05, R * 1.0, R * 0.98))
        # fringe tufts across the forehead
        for i, az in enumerate((-38, -14, 10, 34)):
            p = on_head(H, R, az, 40 - abs(az) * 0.15, 1.0)
            sphere(f"fringe{i}", hair, p, (0.2, 0.12, 0.13), rot=(0, (-1 if az < 0 else 1) * -25, 0), outline=True)
        if female:
            capsule("longhair", hair, (0, 0.32, 2.45 + lift), (0, 0.38, 1.55 + lift), 0.5, squash=(1, 0.45))
            for i in range(4):  # braid over the shoulder
                sphere(f"braid{i}", hair, (0.5 + i * 0.02, -0.22, 1.85 - i * 0.17 + lift), (0.11, 0.1, 0.12))
            sphere("flower", toon("#FF7AA2"), on_head(H, R, 52, 46, 1.02), (0.09, 0.06, 0.09))
        if c.get("cap"):
            cp = toon(c["cap"])
            sphere("cap", cp, H + Vector((0, 0.05, 0.3)), (R * 1.06, R * 1.04, R * 0.62))
            sphere("brim", cp, on_head(H, R, 0, 36, 1.0) + Vector((0, -0.2, 0.02)), (0.4, 0.28, 0.045), rot=(-8, 0, 0))
            sphere("capbtn", toon("#FFD23F"), H + Vector((0, 0.05, 0.92)), (0.06, 0.06, 0.04), outline=False)

    # face
    face = P["face"]
    ey = 2 if face != "think" else 8
    for s in (-1, 1):
        if face == "joy":
            # happy closed eyes ^ ^
            e = on_head(H, R, s * 22, 4, 1.0)
            curve(f"eye{s}", ink, [(e.x - 0.09, e.y - 0.01, e.z - 0.03), (e.x, e.y - 0.02, e.z + 0.05), (e.x + 0.09, e.y - 0.01, e.z - 0.03)], 0.026)
        else:
            e = on_head(H, R, s * 22, ey - 6, 0.985)
            sphere(f"eye{s}", ink, e, (0.075, 0.05, 0.11), outline=False)
            sphere(f"glint{s}", white, e + Vector((-0.025, -0.045, 0.04)), (0.026, 0.02, 0.03), outline=False)
        # brows
        b = on_head(H, R, s * 22, 22, 1.0)
        tilt = {"think": (s * 0.04 if s < 0 else -0.05), "smile": 0.0, "joy": 0.0}[face]
        curve(f"brow{s}", hair if not c.get("style") == "hijab" else toon(c["hair"]),
              [(b.x - 0.08, b.y - 0.01, b.z - tilt), (b.x + 0.08, b.y - 0.01, b.z + tilt + (0.03 if face == "think" and s > 0 else 0))], 0.03)
        # cheeks
        sphere(f"blush{s}", toon("#F08A8A", flat=True), on_head(H, R, s * 38, -14, 0.965), (0.09, 0.03, 0.055), outline=False)

    if face == "joy":
        m = on_head(H, R, 0, -20, 0.97)
        sphere("mouth", toon("#7A1E2C", flat=True), m, (0.15, 0.05, 0.1), outline=False)
        sphere("tongue", toon("#F26D7D", flat=True), m + Vector((0, -0.02, -0.04)), (0.08, 0.035, 0.04), outline=False)
    elif face == "smile":
        m = on_head(H, R, 0, -16, 1.0)
        curve("mouth", ink, arc_pts((m.x, m.y - 0.01, m.z + 0.07), 0.13, 0.09, 205, 335), 0.024)
    else:
        m = on_head(H, R, 6, -19, 1.0)
        curve("mouth", ink, [(m.x - 0.06, m.y, m.z), (m.x + 0.02, m.y, m.z + 0.01), (m.x + 0.07, m.y, m.z + 0.03)], 0.022)

    if c.get("glasses"):
        gl = toon("#1D1733", flat=True)
        for s in (-1, 1):
            e = on_head(H, R, s * 22, -1, 1.03)
            torus(f"lens{s}", gl, e, 0.135, 0.018, rot=(90, 0, s * -22), outline=False)
        a, b = on_head(H, R, -10, 2, 1.04), on_head(H, R, 10, 2, 1.04)
        curve("bridge", gl, [tuple(a), tuple(b)], 0.016)
    if c.get("beard"):
        sphere("moustache", toon(c["hair"]), on_head(H, R, 0, -12, 0.99), (0.17, 0.05, 0.05), outline=False)


# --------------------------------------------------------------------------- props
def prop_laptop():
    body, screen = toon("#C9D2E3"), toon("#1F3B73", flat=True)
    box("base", body, (0, 0, 0.05), (1.7, 1.15, 0.1))
    box("keys", toon("#7C879E", flat=True), (0, -0.05, 0.11), (1.35, 0.6, 0.02), bevel=0.005, outline=False)
    box("lid", body, (0, 0.56, 0.62), (1.7, 0.08, 1.12), rot=(-14, 0, 0))
    box("screen", screen, (0, 0.5, 0.64), (1.5, 0.02, 0.95), rot=(-14, 0, 0), bevel=0.01, outline=False)
    cols = ["#7CF5B8", "#FFD23F", "#7CC4FF", "#FF8FB1", "#7CF5B8", "#FFFFFF"]
    for i, (x, w) in enumerate([(-0.35, 0.5), (0.05, 0.9), (-0.2, 0.7), (0.1, 0.6), (-0.3, 0.45), (0.0, 0.8)]):
        z = 0.98 - i * 0.13
        y = 0.5 - 0.04 - (z - 0.64) * math.tan(math.radians(14))
        box(f"code{i}", toon(cols[i], flat=True), (x - 0.25 + w / 2 - 0.2, y, z), (w * 0.8, 0.02, 0.05), rot=(-14, 0, 0), bevel=0.0, outline=False)


def prop_plane():
    white, gold, blue = toon("#F7F9FF"), toon("#FFD23F"), toon("#3B82F6")
    capsule("fuselage", white, (-1.1, 0, 0.5), (1.1, 0, 0.5), 0.36)
    sphere("nose", white, (1.32, 0, 0.47), (0.3, 0.3, 0.28))
    box("wing", white, (0.05, -0.55, 0.38), (0.75, 1.3, 0.07), rot=(0, 0, -20), bevel=0.03)
    box("wing2", white, (0.15, 0.55, 0.42), (0.6, 1.0, 0.06), rot=(0, 0, 20), bevel=0.03)
    box("fin", gold, (-1.15, 0, 0.98), (0.45, 0.07, 0.6), rot=(0, -28, 0), bevel=0.03)
    box("stab", white, (-1.15, -0.28, 0.6), (0.35, 0.5, 0.05), rot=(0, 0, -15), bevel=0.02)
    cyl("engine", gold, (0.15, -0.62, 0.22), 0.13, 0.13, 0.4, rot=(0, 90, 0))
    capsule("stripe", gold, (-0.95, -0.08, 0.38), (0.95, -0.08, 0.38), 0.31, outline=False, squash=(1, 1))
    for i in range(5):
        sphere(f"win{i}", blue, (0.75 - i * 0.32, -0.335, 0.6), (0.075, 0.03, 0.085), outline=False)
    sphere("cockpit", toon("#1E3A8A", flat=True), (1.38, -0.17, 0.6), (0.12, 0.08, 0.08), outline=False)


def prop_money():
    note, band, coin = toon("#55B88A"), toon("#E9F7EF"), toon("#FFC93C", hi=0.35)
    for k, (x, y, n) in enumerate([(-0.45, 0.1, 4), (0.4, 0.15, 3)]):
        for i in range(n):
            box(f"note{k}{i}", note, (x + (i % 2) * 0.03, y, 0.08 + i * 0.13), (0.95, 0.55, 0.11), rot=(0, 0, (i % 3 - 1) * 4), bevel=0.02)
        box(f"band{k}", band, (x, y, 0.08 + (n - 1) * 0.065), (0.2, 0.57, n * 0.13 + 0.02), bevel=0.01)
    for i, (x, y) in enumerate([(0.05, -0.45), (0.38, -0.5), (0.22, -0.55)]):
        for j in range(3 - i):
            cyl(f"coin{i}{j}", coin, (x, y, 0.05 + j * 0.09), 0.22, 0.22, 0.08)


def prop_calendar():
    paper, red, ink = toon("#FFFFFF"), toon("#EF4444"), toon("#94A3B8", flat=True)
    box("page", paper, (0, 0, 0.75), (1.3, 0.12, 1.4), bevel=0.05)
    box("head", red, (0, -0.02, 1.32), (1.32, 0.14, 0.32), bevel=0.04)
    for s in (-1, 1):
        torus(f"ring{s}", toon("#64748B"), (s * 0.35, -0.08, 1.5), 0.09, 0.025, rot=(0, 90, 0))
    for r in range(3):
        for col in range(4):
            box(f"d{r}{col}", ink, (-0.42 + col * 0.28, -0.07, 0.95 - r * 0.26), (0.16, 0.02, 0.13), bevel=0.0, outline=False)
    torus("circle", red, (0.14, -0.1, 0.69), 0.15, 0.03, rot=(90, 0, 0), outline=False)
    text("due", toon("#FFFFFF", flat=True), "DUE", (0, -0.1, 1.31), size=0.22, depth=0.01, outline=False)


def prop_cv():
    paper = toon("#FFFFFF")
    box("paper", paper, (0, 0, 0.8), (1.1, 0.08, 1.5), rot=(0, 0, 0), bevel=0.03)
    box("photo", toon("#CBD5E1", flat=True), (-0.3, -0.05, 1.3), (0.3, 0.02, 0.32), bevel=0.0, outline=False)
    for i in range(5):
        box(f"ln{i}", toon("#CBD5E1", flat=True), (0.05 if i < 2 else 0, -0.05, 1.38 - i * 0.2 - (0.15 if i >= 2 else 0)), (0.5 if i < 2 else 0.8, 0.02, 0.05), bevel=0.0, outline=False)
    text("q", toon("#F97316"), "?", (0.42, -0.25, 0.42), size=0.95, depth=0.12)


def prop_question():
    text("q", toon("#FFD23F"), "?", (0, 0, 0.6), size=1.4, depth=0.18)


def prop_letter():
    env, paper, green = toon("#F8E7C8"), toon("#FFFFFF"), toon("#22C55E")
    box("paper", paper, (0, 0.04, 0.95), (1.05, 0.04, 0.9), rot=(0, 0, 0), bevel=0.02)
    for i in range(3):
        box(f"ln{i}", toon("#94A3B8", flat=True), (0, 0.01, 1.2 - i * 0.14), (0.7 - i * 0.1, 0.02, 0.05), bevel=0.0, outline=False)
    box("env", env, (0, -0.02, 0.45), (1.4, 0.1, 0.9), bevel=0.04)
    prism("flapL", toon("#EED7AF"), (0, -0.08, 0.01), 1.38, 0.62, 0.02, outline=False)
    sphere("badge", green, (0.62, -0.18, 0.95), (0.3, 0.1, 0.3))
    curve("tick", toon("#FFFFFF", flat=True), [(0.48, -0.29, 0.96), (0.58, -0.29, 0.85), (0.77, -0.29, 1.08)], 0.04)


def prop_books():
    cols = ["#EF4444", "#3B82F6", "#F59E0B", "#10B981"]
    for i, c in enumerate(cols):
        w = 1.3 - i * 0.08
        box(f"b{i}", toon(c), (0.04 * (i % 2), 0, 0.12 + i * 0.24), (w, 0.9, 0.22), rot=(0, 0, (i % 2 * 2 - 1) * 5), bevel=0.04)
        box(f"p{i}", toon("#FFF8E7", flat=True), (0.04 * (i % 2) + 0.03, -0.02, 0.12 + i * 0.24), (w - 0.06, 0.9, 0.15), rot=(0, 0, (i % 2 * 2 - 1) * 5), bevel=0.0, outline=False)
    sphere("apple", toon("#E11D48"), (0.2, 0, 1.17), (0.22, 0.22, 0.2))
    capsule("stem", toon("#7C4A26"), (0.2, 0, 1.33), (0.23, 0, 1.45), 0.025, outline=False)


def prop_certificate():
    paper, gold = toon("#FFF8E1"), toon("#F5B700", hi=0.4)
    box("paper", paper, (0, 0, 0.75), (1.6, 0.06, 1.15), bevel=0.03)
    box("frame", toon("#E7C873", flat=True), (0, -0.035, 0.75), (1.42, 0.01, 0.98), bevel=0.0, outline=False)
    box("inner", toon("#FFF8E1", flat=True), (0, -0.045, 0.75), (1.34, 0.01, 0.9), bevel=0.0, outline=False)
    for i, w in enumerate([0.9, 0.6, 0.7]):
        box(f"ln{i}", toon("#A3A3A3", flat=True), (0, -0.06, 1.0 - i * 0.16), (w, 0.01, 0.05 if i else 0.09), bevel=0.0, outline=False)
    for s in (-1, 1):
        capsule(f"rib{s}", toon("#DC2626"), (0.45, -0.1, 0.32), (0.45 + s * 0.14, -0.1, 0.0), 0.06, squash=(1, 0.4))
    cyl("seal", gold, (0.45, -0.12, 0.38), 0.2, 0.2, 0.06, rot=(90, 0, 0))
    text("star", toon("#B45309", flat=True), "*", (0.45, -0.17, 0.33), size=0.38, depth=0.01, outline=False)


def prop_rocket():
    body, red, win = toon("#F1F5F9"), toon("#EF4444"), toon("#38BDF8")
    capsule("body", body, (0, 0, 0.75), (0, 0, 1.55), 0.36)
    cyl("nose", red, (0, 0, 1.95), 0.32, 0.0, 0.55)
    torus("winring", toon("#94A3B8"), (0, -0.33, 1.35), 0.15, 0.04, rot=(90, 0, 0))
    sphere("win", win, (0, -0.31, 1.35), (0.13, 0.05, 0.13), outline=False)
    for i, a in enumerate((0, 120, 240)):
        r = math.radians(a + 90)
        box(f"fin{i}", red, (math.cos(r) * 0.36, math.sin(r) * 0.36, 0.62), (0.07, 0.42, 0.5), rot=(0, 0, a + 90), bevel=0.03)
    cyl("nozzle", toon("#64748B"), (0, 0, 0.34), 0.22, 0.28, 0.16)
    cyl("flame", toon("#FFB020", flat=True), (0, 0, 0.0), 0.0, 0.24, 0.55, rot=(0, 0, 0), outline=False)
    cyl("flame2", toon("#FFE680", flat=True), (0, -0.05, 0.08), 0.0, 0.13, 0.35, outline=False)


def prop_university():
    brick, cream, roof = toon("#C2553B"), toon("#F6E7CF"), toon("#8C2F1F")
    box("steps", cream, (0, -0.1, 0.07), (2.3, 1.0, 0.14))
    box("hall", brick, (0, 0.1, 0.65), (2.0, 0.8, 1.05))
    for i in range(5):
        x = -0.8 + i * 0.4
        cyl(f"col{i}", cream, (x, -0.38, 0.65), 0.08, 0.08, 1.05)
    box("lintel", cream, (0, -0.25, 1.25), (2.15, 0.6, 0.16))
    prism("ped", roof, (0, -0.25, 1.33), 2.15, 0.5, 0.6)
    cyl("drum", brick, (0, 0.15, 1.55), 0.32, 0.32, 0.35)
    sphere("dome", toon("#E8B04A"), (0, 0.15, 1.72), (0.34, 0.34, 0.34))
    capsule("flagpole", toon("#64748B"), (0, 0.15, 2.0), (0, 0.15, 2.45), 0.02, outline=False)
    box("flag", toon("#006A4E"), (0.17, 0.15, 2.33), (0.3, 0.02, 0.2), bevel=0.0)
    sphere("sun", toon("#F42A41", flat=True), (0.15, 0.13, 2.33), (0.06, 0.02, 0.06), outline=False)
    box("door", toon("#5B2A1A", flat=True), (0, -0.31, 0.5), (0.3, 0.02, 0.6), bevel=0.0, outline=False)


def prop_hourglass():
    wood, glass, sand = toon("#8B5A2B"), toon("#DFF3FF", hi=0.5), toon("#F4B740", flat=True)
    cyl("top", wood, (0, 0, 1.5), 0.55, 0.55, 0.12)
    cyl("bot", wood, (0, 0, 0.06), 0.55, 0.55, 0.12)
    for s in (-1, 1):
        cyl(f"post{s}", wood, (s * 0.45, 0, 0.78), 0.05, 0.05, 1.4)
    cyl("g1", glass, (0, 0, 1.12), 0.06, 0.42, 0.62)
    cyl("g2", glass, (0, 0, 0.44), 0.42, 0.06, 0.62)
    cyl("s1", sand, (0, -0.05, 1.22), 0.1, 0.24, 0.2, outline=False)
    cyl("s2", sand, (0, -0.05, 0.24), 0.36, 0.08, 0.22, outline=False)
    capsule("stream", sand, (0, -0.05, 0.4), (0, -0.05, 0.85), 0.02, outline=False)


def prop_clipboard():
    board, paper = toon("#B7793F"), toon("#FFFFFF")
    box("board", board, (0, 0, 0.85), (1.15, 0.08, 1.6), bevel=0.05)
    box("paper", paper, (0, -0.05, 0.8), (0.95, 0.02, 1.32), bevel=0.0)
    box("clip", toon("#94A3B8", hi=0.5), (0, -0.07, 1.6), (0.5, 0.08, 0.2), bevel=0.04)
    for i in range(4):
        z = 1.25 - i * 0.28
        box(f"ln{i}", toon("#CBD5E1", flat=True), (0.12, -0.07, z), (0.55, 0.01, 0.06), bevel=0.0, outline=False)
        if i < 3:
            curve(f"tick{i}", toon("#16A34A", flat=True), [(-0.38, -0.08, z), (-0.32, -0.08, z - 0.06), (-0.22, -0.08, z + 0.07)], 0.025)
    capsule("pencil", toon("#FACC15"), (0.65, -0.15, 0.25), (0.25, -0.15, 1.15), 0.05)


def prop_gradcap():
    blk, gold = toon("#2B2D42", shade=0.6, hi=0.3), toon("#FFD23F")
    cyl("band", blk, (0, 0, 0.25), 0.5, 0.48, 0.42)
    box("board", blk, (0, 0, 0.5), (1.45, 1.45, 0.08), rot=(10, 0, 45), bevel=0.02)
    sphere("button", gold, (0, -0.02, 0.56), (0.08, 0.08, 0.05), outline=False)
    curve("cord", gold, [(0, -0.02, 0.56), (0.55, -0.3, 0.5), (0.68, -0.38, 0.2)], 0.03)
    cyl("tassel", gold, (0.68, -0.38, 0.05), 0.09, 0.05, 0.3)


def prop_grade():
    paper = toon("#FFFFFF")
    box("paper", paper, (0, 0, 0.8), (1.15, 0.06, 1.5), rot=(0, 0, 0), bevel=0.03)
    text("A", toon("#16A34A"), "A", (-0.05, -0.12, 0.85), size=1.1, depth=0.1)
    torus("ring", toon("#EF4444", flat=True), (-0.05, -0.08, 0.85), 0.45, 0.03, rot=(90, 0, 0), outline=False)
    for i in range(2):
        box(f"ln{i}", toon("#CBD5E1", flat=True), (0, -0.04, 1.4 - i * 0.12 + (0.0 if i else 0)), (0.7 - i * 0.2, 0.01, 0.05), bevel=0.0, outline=False)
    for i in range(2):
        box(f"lb{i}", toon("#CBD5E1", flat=True), (0, -0.04, 0.28 - i * 0.12), (0.8 - i * 0.3, 0.01, 0.05), bevel=0.0, outline=False)


def prop_tower():
    glass, frame = toon("#5BA4F0", hi=0.35), toon("#E2E8F0")
    box("t1", frame, (0, 0, 0.9), (1.0, 0.8, 1.8))
    box("t2", frame, (0, 0, 2.1), (0.72, 0.6, 0.6))
    for r in range(6):
        for c in range(3):
            box(f"w{r}{c}", glass, (-0.3 + c * 0.3, -0.41, 0.35 + r * 0.27), (0.2, 0.02, 0.18), bevel=0.0, outline=False)
    for c in range(2):
        box(f"wt{c}", glass, (-0.15 + c * 0.3, -0.31, 2.12), (0.2, 0.02, 0.3), bevel=0.0, outline=False)
    capsule("ant", toon("#64748B"), (0, 0, 2.4), (0, 0, 2.85), 0.03, outline=False)
    sphere("light", toon("#EF4444", flat=True), (0, 0, 2.88), (0.06, 0.06, 0.06), outline=False)
    box("small", toon("#93C5FD"), (0.85, 0.15, 0.55), (0.6, 0.6, 1.1))
    for r in range(3):
        box(f"sw{r}", toon("#E0F2FE", flat=True), (0.85, -0.16, 0.3 + r * 0.3), (0.4, 0.02, 0.14), bevel=0.0, outline=False)
    box("door", toon("#1E3A8A", flat=True), (0, -0.41, 0.15), (0.3, 0.02, 0.3), bevel=0.0, outline=False)


def prop_target():
    for i, (r, c) in enumerate([(0.7, "#EF4444"), (0.54, "#FFFFFF"), (0.38, "#EF4444"), (0.2, "#FFFFFF"), (0.08, "#EF4444")]):
        cyl(f"r{i}", toon(c), (0, -i * 0.025, 0.8), r, r, 0.1, rot=(90, 0, 0), outline=(i == 0))
    capsule("stand", toon("#8B5A2B"), (-0.3, 0.2, 0.0), (-0.1, 0.15, 0.45), 0.05)
    capsule("stand2", toon("#8B5A2B"), (0.3, 0.2, 0.0), (0.1, 0.15, 0.45), 0.05)
    capsule("dart", toon("#1E3A8A"), (0.02, -0.15, 0.8), (0.55, -0.75, 1.15), 0.035)
    for s in (-1, 1):
        box(f"fl{s}", toon("#FFD23F"), (0.52, -0.72, 1.13), (0.04, 0.22, 0.14), rot=(0, s * 45, -40), bevel=0.0)


def prop_trophy():
    gold = toon("#FFC83D", hi=0.45)
    cyl("cup", gold, (0, 0, 1.2), 0.2, 0.52, 0.72)
    sphere("bowl", gold, (0, 0, 0.92), (0.38, 0.38, 0.25))
    for s in (-1, 1):
        torus(f"h{s}", gold, (s * 0.52, 0, 1.18), 0.2, 0.05, rot=(90, 0, 0), arc=360)
    cyl("stem", gold, (0, 0, 0.6), 0.08, 0.12, 0.3)
    box("base", toon("#7C4A26"), (0, 0, 0.25), (0.7, 0.55, 0.3), bevel=0.04)
    box("plate", gold, (0, -0.28, 0.25), (0.4, 0.02, 0.12), bevel=0.0, outline=False)
    text("star", toon("#FFF3B0", flat=True), "*", (0, -0.47, 1.12), size=0.6, depth=0.01, outline=False)


def prop_badge():
    card, blue = toon("#FFFFFF"), toon("#3B82F6")
    box("card", card, (0, 0, 0.7), (0.95, 0.06, 1.25), bevel=0.05)
    box("top", blue, (0, -0.02, 1.18), (0.97, 0.07, 0.28), bevel=0.03)
    box("photo", toon("#FDE68A", flat=True), (0, -0.05, 0.78), (0.42, 0.02, 0.42), bevel=0.0, outline=False)
    sphere("face", toon("#C98E60", flat=True), (0, -0.06, 0.82), (0.11, 0.01, 0.12), outline=False)
    sphere("shoulders", toon("#2E5FB8", flat=True), (0, -0.06, 0.6), (0.18, 0.01, 0.09), outline=False)
    for i in range(2):
        box(f"ln{i}", toon("#CBD5E1", flat=True), (0, -0.05, 0.38 - i * 0.12), (0.6 - i * 0.2, 0.01, 0.05), bevel=0.0, outline=False)
    curve("lanyard", toon("#EC4899", flat=True), arc_pts((0, 0, 1.35), 0.45, 0.85, 180, 0, n=18), 0.05)
    box("clip", toon("#94A3B8"), (0, -0.02, 1.38), (0.14, 0.06, 0.16), bevel=0.02)


def prop_home():
    wall, roof, door = toon("#FDE7C2"), toon("#E4572E"), toon("#7C4A26")
    box("walls", wall, (0, 0, 0.5), (1.4, 1.0, 1.0))
    prism("roof", roof, (0, 0, 0.98), 1.7, 0.75, 1.15)
    box("door", door, (0.2, -0.51, 0.33), (0.3, 0.03, 0.6), bevel=0.02)
    box("win", toon("#7CC4FF"), (-0.35, -0.51, 0.55), (0.34, 0.03, 0.3), bevel=0.02)
    capsule("trunk", toon("#7C4A26"), (1.05, 0.1, 0.0), (1.05, 0.1, 0.65), 0.07)
    sphere("leaves", toon("#22A35A"), (1.05, 0.1, 0.95), (0.42, 0.42, 0.48))
    sphere("leaves2", toon("#2BB673"), (0.9, 0.0, 0.75), (0.28, 0.28, 0.28))


def prop_bus():
    red, green, glass = toon("#E63946"), toon("#2A9D8F"), toon("#BDE0FE", hi=0.4)
    box("body", red, (0, 0, 0.6), (2.4, 0.95, 0.85), bevel=0.12)
    box("stripe", green, (0, 0, 0.42), (2.42, 0.97, 0.16), bevel=0.02, outline=False)
    box("roof", toon("#FFD23F"), (0, 0, 1.08), (2.2, 0.85, 0.14), bevel=0.05)
    for i in range(5):
        box(f"w{i}", glass, (-0.9 + i * 0.4, -0.48, 0.78), (0.3, 0.02, 0.28), bevel=0.0, outline=False)
    box("wind", glass, (1.21, 0, 0.75), (0.02, 0.8, 0.35), bevel=0.0, outline=False)
    for x in (-0.75, 0.75):
        cyl(f"wh{x}", toon("#2B2B2B", shade=0.6), (x, -0.45, 0.2), 0.22, 0.22, 0.14, rot=(90, 0, 0))
        cyl(f"hub{x}", toon("#CBD5E1", flat=True), (x, -0.53, 0.2), 0.09, 0.09, 0.02, rot=(90, 0, 0), outline=False)
    sphere("lamp", toon("#FFF3B0", flat=True), (1.21, -0.32, 0.35), (0.03, 0.08, 0.08), outline=False)


def prop_wifi():
    body = toon("#F1F5F9")
    box("router", body, (0, 0, 0.18), (1.3, 0.75, 0.3), bevel=0.1)
    for i, c in enumerate(["#22C55E", "#22C55E", "#FACC15"]):
        sphere(f"led{i}", toon(c, flat=True), (-0.35 + i * 0.18, -0.38, 0.2), (0.04, 0.02, 0.04), outline=False)
    for s in (-1, 1):
        capsule(f"ant{s}", toon("#334155"), (s * 0.48, 0.2, 0.3), (s * 0.6, 0.2, 1.0), 0.05)
    for i, r in enumerate((0.3, 0.55, 0.8)):
        curve(f"arc{i}", toon("#22C55E", flat=True), arc_pts((0, -0.1, 0.75), r, r, 45, 135, n=16), 0.06)
    sphere("dot", toon("#22C55E", flat=True), (0, -0.1, 0.8), (0.08, 0.04, 0.08), outline=False)


def prop_globe():
    sea, land = toon("#38BDF8", hi=0.35), toon("#22C55E")
    sphere("sea", sea, (0, 0, 1.05), (0.7, 0.7, 0.7), seg=36)
    for i, (az, el, sx, sz) in enumerate([(-25, 25, 0.28, 0.22), (20, -10, 0.2, 0.3), (-40, -30, 0.15, 0.12), (35, 35, 0.16, 0.1)]):
        p = on_head(Vector((0, 0, 1.05)), 0.7, az, el, 0.97)
        sphere(f"land{i}", land, p, (sx, 0.09, sz), rot=(0, 0, az), outline=False)
    sphere("pin", toon("#EF4444"), on_head(Vector((0, 0, 1.05)), 0.7, 16, 6, 1.12), (0.09, 0.09, 0.09))
    torus("ring", toon("#F59E0B"), (0, 0.0, 1.05), 0.82, 0.04, rot=(90, 0, 0), arc=230, scale=(1, 1, 1))
    cyl("stem", toon("#B45309"), (0, 0, 0.18), 0.06, 0.06, 0.3)
    cyl("base", toon("#B45309"), (0, 0, 0.05), 0.42, 0.34, 0.1)


PROPS = {
    "laptop": prop_laptop, "plane": prop_plane, "money": prop_money, "calendar": prop_calendar, "cv": prop_cv,
    "letter": prop_letter, "books": prop_books, "certificate": prop_certificate, "rocket": prop_rocket,
    "university": prop_university, "hourglass": prop_hourglass, "clipboard": prop_clipboard, "gradcap": prop_gradcap,
    "grade": prop_grade, "tower": prop_tower, "target": prop_target, "trophy": prop_trophy, "badge": prop_badge,
    "home": prop_home, "bus": prop_bus, "wifi": prop_wifi, "globe": prop_globe, "question": prop_question,
}

# view rotation per prop (degrees about Z) so boxy props read in 3/4 view
PROP_YAW = {"laptop": -22, "tower": -18, "home": -24, "bus": -28, "university": -16, "money": -14, "books": -14,
            "wifi": -16, "trophy": 0, "plane": 8, "gradcap": 0, "hourglass": -10, "rocket": 0}


# --------------------------------------------------------------------------- scene / camera / render
def reset_scene():
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.curves, bpy.data.cameras):
        for d in list(coll):
            if d.users == 0:
                coll.remove(d)


def setup_render():
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = SAMPLES
    sc.cycles.use_adaptive_sampling = False
    sc.cycles.use_denoising = False
    sc.cycles.max_bounces = 0
    sc.cycles.transparent_max_bounces = 24
    sc.cycles.filter_width = 1.2
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    if sc.world is None:
        sc.world = bpy.data.worlds.new("w")
    sc.world.color = (0, 0, 0)


def frame_and_render(name, px, yaw=0.0, fixed=None, pitch=80.0):
    """Ortho camera; fixed=(xmin,xmax,zmin,zmax) keeps a constant frame (characters), else tight auto-fit."""
    sc = bpy.context.scene
    # rotate the whole subject around Z for a 3/4 view
    if yaw:
        rz = Matrix.Rotation(math.radians(yaw), 4, "Z")
        for ob in sc.objects:
            ob.matrix_world = rz @ ob.matrix_world
    cam_data = bpy.data.cameras.new("cam")
    cam_data.type = "ORTHO"
    cam = bpy.data.objects.new("cam", cam_data)
    sc.collection.objects.link(cam)
    cam.rotation_euler = (math.radians(pitch), 0, 0)
    cam.location = (0, -20, 1.5)
    sc.camera = cam
    bpy.context.view_layer.update()
    inv = cam.matrix_world.inverted()
    if fixed:
        xs, ys = [fixed[0], fixed[1]], []
        # convert world z range to camera y at x=0, y=0
        for z in (fixed[2], fixed[3]):
            ys.append((inv @ Vector((0, 0, z))).y)
    else:
        dg = bpy.context.evaluated_depsgraph_get()
        xs, ys = [], []
        for ob in sc.objects:
            if ob.type not in {"MESH", "CURVE"}:
                continue
            ev = ob.evaluated_get(dg)
            me = ev.to_mesh()
            mw = ev.matrix_world
            for v in me.vertices:
                p = inv @ (mw @ v.co)
                xs.append(p.x)
                ys.append(p.y)
            ev.to_mesh_clear()
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    pad = 0.04 * max(x1 - x0, y1 - y0)
    x0, x1, y0, y1 = x0 - pad, x1 + pad, y0 - pad, y1 + pad
    w, h = x1 - x0, y1 - y0
    cam.location = cam.matrix_world @ Vector(((x0 + x1) / 2, (y0 + y1) / 2, 0))
    cam_data.ortho_scale = max(w, h)
    if w >= h:
        sc.render.resolution_x, sc.render.resolution_y = px, max(8, round(px * h / w))
    else:
        sc.render.resolution_x, sc.render.resolution_y = max(8, round(px * w / h)), px
    sc.render.resolution_percentage = 100
    sc.render.filepath = os.path.join(TMP, name + ".png")
    bpy.ops.render.render(write_still=True)
    return sc.render.filepath


def to_webp(png, name):
    try:
        from PIL import Image
    except ImportError:
        import shutil
        dst = os.path.join(OUT, name + ".png")
        shutil.copy(png, dst)
        return dst
    im = Image.open(png).convert("RGBA")
    bb = im.getchannel("A").getbbox()
    if bb and name.split("-")[0] not in CHARS:
        im = im.crop(bb)
    dst = os.path.join(OUT, name + ".webp")
    im.save(dst, "WEBP", quality=82, method=6, alpha_quality=90)
    return dst


def jobs():
    for cid in CHARS:
        poses = ["go"] if cid == "mentor" else list(POSES)
        for p in poses:
            yield f"{cid}-{p}" if cid != "mentor" else "mentor", "char", (cid, p)
    for k in PROPS:
        yield k, "prop", k


def main(filters):
    global LINE
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(TMP, exist_ok=True)
    setup_render()
    total = 0
    for name, kind, arg in jobs():
        if filters and not any(f in name for f in filters):
            continue
        reset_scene()
        _MATS.clear()
        if kind == "char":
            LINE = 0.032
            build_character(*arg)
            png = frame_and_render(name, CHAR_PX, yaw=-12, fixed=(-1.45, 1.45, -0.02, 3.42), pitch=84)
        else:
            LINE = 0.03
            PROPS[arg]()
            png = frame_and_render(name, PROP_PX, yaw=PROP_YAW.get(arg, -8), pitch=78)
        dst = to_webp(png, name)
        sz = os.path.getsize(dst)
        total += sz
        print(f"[cartoon] {name:14s} {sz / 1024:6.1f} KB → {dst}")
    print(f"[cartoon] total {total / 1024:.1f} KB")


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    main([a for a in argv if not a.startswith("-")])
