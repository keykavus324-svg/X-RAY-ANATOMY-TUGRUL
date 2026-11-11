"""
Stage 2 of the anatomy build: add the full skeleton to the head model.

Stage 1 (`build_geometry.py`) produces `models/anatomy.{bin,json}` from the
Z-Anatomy skull/brain and the BodyParts3D facial muscles, eyes and cervical spine.
This script appends the rest of the BodyParts3D skeleton — spine, ribs, pelvis and
limbs — so the mirror can show the whole body instead of only the head.

Both stages share the same canonical frame (origin = inter-ocular midpoint,
1 unit = inter-ocular distance, +Y up, +Z anterior, X mirrored), and the frame is
recomputed here from the same BodyParts3D eyeball mesh stage 1 used, so the new
parts land exactly underneath the existing neck.

Usage
    XRM_WORK=/path/to/sources python tools/build_skeleton.py [models]

`XRM_WORK/stl/FMA<id>.stl` must contain the BodyParts3D STLs listed in
SKELETON below (mirror: Kevin-Mattheus-Moerman/BodyParts3D,
assets/BodyParts3D_data/stl/).  Output: `models/anatomy.{bin,json}` rewritten
in place — keep a copy if you need to rebuild stage 1.
"""
import json
import os
import sys

import numpy as np
import trimesh
from fast_simplification import simplify

HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.environ.get('XRM_WORK', os.path.join(HERE, 'sources'))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', 'models')
FIT = json.load(open(os.path.join(HERE, 'bpd_to_za.json')))
SCALE = FIT['scale']
ROT = np.array(FIT['R'])
TRANS = np.array(FIT['t'])
MIRROR = np.array([-1.0, 1.0, 1.0])          # must match build_geometry.py

VERT_LIMIT_16 = 65536

# ---------------------------------------------------------------------------
# source table: id, layer, BodyParts3D ids, target triangles per output part,
# `pair` = split left/right by X (otherwise every id is merged into one part).
# Bones come from BodyParts3D only, so they share one coordinate frame.
# ---------------------------------------------------------------------------
T = 'skeleton'
SKELETON = [
    ('thoracic',   T, [9165, 9187, 9209, 9248, 9922, 9945, 9968, 9991, 10014, 10037, 10059, 10081], 2400, False),
    ('lumbar',     T, [13072, 13073, 13074, 13075, 13076], 2200, False),
    ('sacrum',     T, [16202], 2200, False),
    ('ribs',       T, [7857, 7882, 7909, 7957, 8066, 8175, 8229, 8283, 8364, 8445, 8531, 8533,
                       7987, 8012, 8039, 8148, 8093, 8202, 8256, 8310, 8391, 8472, 8532, 8534], 3400, True),
    ('sternum',    T, [7486, 7487], 1800, False),
    ('clavicle',   T, [13322, 13323], 900, True),
    ('scapula',    T, [13395, 13396], 2600, True),
    ('humerus',    T, [23130, 23131], 2200, True),
    ('radius',     T, [23464, 23465], 1200, True),
    ('ulna',       T, [23467, 23468], 1200, True),
    ('hip',        T, [16586, 16587], 3000, True),
    ('femur',      T, [24474, 24475], 2800, True),
    ('patella',    T, [24486, 24487], 700, True),
    ('tibia',      T, [24477, 24478], 2000, True),
    ('fibula',     T, [24480, 24481], 900, True),
    ('carpals',    T, [24447, 24449, 24438, 24442, 24436, 24444, 24445,
                       24446, 24448, 24437, 24441, 24435, 24443, 23725], 2200, True),
    ('metacarpals', T, [24465, 24467, 24469, 24471, 24473, 24464, 24466, 24468, 24470, 24472], 1600, True),
    ('hand',       T, [65470, 71915, 71908, 71916, 66791, 23938, 23940, 23942, 23944,
                       23951, 23953, 23955, 23957, 23959,
                       24450, 24451, 24452, 24453, 24454, 24455, 24456, 24457, 24458,
                       24459, 24460, 24461, 24462, 24463], 2200, True),
    ('tarsals',    T, [24498, 24483, 24529, 24501, 24522, 24524, 24526,
                       24497, 24482, 24528, 24500, 24521, 24523, 24525], 3000, True),
    ('metatarsals', T, [24508, 24510, 24512, 24514, 24516, 24507, 24509, 24511, 24513, 24515], 1600, True),
    ('foot',       T, [43254, 32635, 32637, 32639, 32641, 32643, 32645, 32647, 230988,
                       32651, 32653, 32655, 32657, 32659,
                       43253, 32634, 32636, 32638, 32640, 32642, 32644, 32646, 230986,
                       32650, 32652, 32654, 32656, 32658], 2200, True),
]

# structure catalogue entries emitted into anatomy.json (anchors are placed on the
# surface point that faces the camera; words live in src/data/structures.js)
STRUCTURES = [
    ('thoracic',    ['thoracic'],                    (0.0, 0.0, 1.0)),
    ('lumbar',      ['lumbar'],                      (0.0, 0.0, 1.0)),
    ('sacrum',      ['sacrum'],                      (0.0, 0.0, -1.0)),
    ('ribs',        ['ribs_l', 'ribs_r'],            (0.55, 0.0, 0.85)),
    ('sternum',     ['sternum'],                     (0.0, 0.0, 1.0)),
    ('clavicle',    ['clavicle_l', 'clavicle_r'],    (0.35, 0.45, 0.8)),
    ('scapula',     ['scapula_l', 'scapula_r'],      (-0.3, 0.3, -0.9)),
    ('humerus',     ['humerus_l', 'humerus_r'],      (0.9, 0.0, 0.4)),
    ('radius',      ['radius_l', 'radius_r'],        (0.9, -0.2, 0.4)),
    ('ulna',        ['ulna_l', 'ulna_r'],            (0.9, -0.2, -0.4)),
    ('hip',         ['hip_l', 'hip_r'],              (0.85, 0.2, 0.45)),
    ('femur',       ['femur_l', 'femur_r'],          (0.6, 0.0, 0.8)),
    ('patella',     ['patella_l', 'patella_r'],      (0.2, 0.0, 1.0)),
    ('tibia',       ['tibia_l', 'tibia_r'],          (0.35, 0.0, 0.95)),
    ('fibula',      ['fibula_l', 'fibula_r'],        (0.95, -0.2, 0.25)),
    ('hand',        ['carpals_l', 'carpals_r', 'metacarpals_l', 'metacarpals_r',
                     'hand_l', 'hand_r'],            (0.0, -0.85, 0.5)),
    ('foot',        ['tarsals_l', 'tarsals_r', 'metatarsals_l', 'metatarsals_r',
                     'foot_l', 'foot_r'],            (0.3, -0.5, 0.8)),
]


# --------------------------------------------------------------------- helpers
def read_stl(path):
    """Binary STL -> (n, 3, 3) triangle soup."""
    d = np.fromfile(path, dtype=np.uint8)
    n = int(np.frombuffer(d[80:84].tobytes(), dtype='<u4')[0])
    rec = np.frombuffer(d[84:84 + n * 50].tobytes(),
                        dtype=np.dtype([('n', '<3f4'), ('v', '<9f4'), ('a', '<u2')]))
    return rec['v'].reshape(-1, 3, 3).astype(np.float64)


def bpd_to_za(tris):
    """BodyParts3D millimetre frame -> Z-Anatomy metre frame (see fit.py)."""
    v = tris.reshape(-1, 3)
    m = np.stack([v[:, 0], v[:, 2], -v[:, 1]], axis=1) / 1000.0
    return (SCALE * (ROT @ m.T).T + TRANS).reshape(-1, 3, 3)


def weld(tris):
    v = tris.reshape(-1, 3)
    m = trimesh.Trimesh(vertices=v, faces=np.arange(len(v)).reshape(-1, 3), process=False)
    m.merge_vertices()
    return np.asarray(m.vertices, dtype=np.float64), np.asarray(m.faces, dtype=np.int64)


def compact(v, f):
    used = np.unique(f)
    remap = -np.ones(len(v), dtype=np.int64)
    remap[used] = np.arange(len(used), dtype=np.int64)
    return v[used], remap[f]


def decimate(v, f, target):
    if len(f) <= target * 1.05:
        return v, f
    sv, sf = simplify(v.astype(np.float32), f.astype(np.int32),
                      target_reduction=1.0 - target / len(f))
    return np.asarray(sv, dtype=np.float64), np.asarray(sf, dtype=np.int64)


def merge(meshes):
    vs, fs, off = [], [], 0
    for v, f in meshes:
        vs.append(v)
        fs.append(f + off)
        off += len(v)
    return np.concatenate(vs), np.concatenate(fs)


def vertex_normals(v, f):
    n = np.zeros_like(v)
    a, b, c = v[f[:, 0]], v[f[:, 1]], v[f[:, 2]]
    fn = np.cross(b - a, c - a)
    fl = np.linalg.norm(fn, axis=1, keepdims=True)
    fl[fl == 0] = 1.0
    fn = fn / fl
    for i in range(3):
        np.add.at(n, f[:, i], fn)
    ln = np.linalg.norm(n, axis=1)
    good = ln > 1e-9
    fallback = np.array([0.0, 0.0, 1.0])
    if good.any():
        avg = n[good].mean(0)
        nrm = np.linalg.norm(avg)
        if nrm > 0:
            fallback = avg / nrm
    n[~good] = fallback
    ln = np.linalg.norm(n, axis=1)
    ln[ln < 1e-9] = 1.0
    return n / ln[:, None]


def stl_path(fma):
    return os.path.join(WORK, 'stl', f'FMA{fma}.stl')


# ------------------------------------------------------------------ canonical frame
# Same recipe as build_geometry.py: the eyeball mesh holds both globes, and the
# midpoint of the two globes is the origin of the model.
vb = bpd_to_za(read_stl(stl_path(12513)))
mb = trimesh.Trimesh(vertices=vb.reshape(-1, 3), faces=np.arange(vb.size // 3).reshape(-1, 3), process=False)
mb.merge_vertices()
centres = []
for comp in mb.split(only_watertight=False):
    cv = np.asarray(comp.vertices)
    centres.append(cv.mean(0) * 0.4 + (cv.min(0) + cv.max(0)) / 2 * 0.6)
centres = np.array(centres)
ORIGIN = centres.mean(0)
IOD = float(np.linalg.norm(centres[0] - centres[1]))
print(f'frame origin {np.round(ORIGIN, 4)}  iod {IOD * 1000:.1f} mm')
assert 0.04 < IOD < 0.08, 'eyeball reference looks wrong'


def canon(v):
    return ((v - ORIGIN) / IOD) * MIRROR


# ------------------------------------------------------------------ load stage 1
meta = json.load(open(os.path.join(OUT, 'anatomy.json')))
buf = bytearray(open(os.path.join(OUT, 'anatomy.bin'), 'rb').read())
existing = {p['id'] for p in meta['parts']}
assert 'cervical_l1' in existing, 'run build_geometry.py first (stage 1 output missing)'


def align4():
    while len(buf) % 4:
        buf.append(0)


new_parts = []
def emit(pid, layer, verts, faces):
    assert pid not in existing, f'duplicate part id {pid}'
    v, f = verts, faces
    if len(f) == 0:
        return
    nrm = vertex_normals(v, f)
    vmin, vmax = v.min(0), v.max(0)
    ext = np.maximum(vmax - vmin, 1e-9)
    q = np.round((v - vmin) / ext * 65534 - 32767).astype(np.int16)
    nq = np.round(np.clip(nrm, -1, 1) * 127).astype(np.int8)
    idx_type = 16 if len(v) <= VERT_LIMIT_16 else 32
    fi = f.astype(np.uint16 if idx_type == 16 else np.uint32)
    align4(); v_off = len(buf); buf.extend(q.tobytes())
    align4(); n_off = len(buf); buf.extend(nq.tobytes())
    align4(); i_off = len(buf); buf.extend(fi.tobytes())
    part = {
        'id': pid, 'layer': layer, 'vCount': len(v), 'iCount': int(fi.size),
        'vOff': v_off, 'nOff': n_off, 'iOff': i_off, 'idxType': idx_type,
        'min': [round(float(x), 6) for x in vmin], 'ext': [round(float(x), 6) for x in ext],
    }
    meta['parts'].append(part)
    new_parts.append(part)


for base, layer, ids, target, pair in SKELETON:
    meshes = []
    for fma in ids:
        v, f = weld(bpd_to_za(read_stl(stl_path(fma))))
        meshes.append((v, f, float(v[:, 0].mean())))
    if pair:
        buckets = {'l': [m for m in meshes if m[2] > 0], 'r': [m for m in meshes if m[2] <= 0]}
        for side in ('l', 'r'):
            group = buckets[side]
            assert group, f'{base}:{side} empty'
            v, f = merge([(m[0], m[1]) for m in group])
            v, f = decimate(v, f, target)
            v = canon(v)
            f = f[:, ::-1]
            a, b, c = v[f[:, 0]], v[f[:, 1]], v[f[:, 2]]
            keep = np.linalg.norm(np.cross(b - a, c - a), axis=1) > 1e-12
            v, f = compact(v, f[keep])
            emit(f'{base}_{side}', layer, v, f)
    else:
        v, f = merge([(m[0], m[1]) for m in meshes])
        v, f = decimate(v, f, target)
        v = canon(v)
        f = f[:, ::-1]
        a, b, c = v[f[:, 0]], v[f[:, 1]], v[f[:, 2]]
        keep = np.linalg.norm(np.cross(b - a, c - a), axis=1) > 1e-12
        v, f = compact(v, f[keep])
        emit(base, layer, v, f)

# ------------------------------------------------------------------ structures
by_id = {}
for p in meta['parts']:
    by_id[p['id']] = p
meta['structures'] = [s for s in meta['structures'] if s['id'] not in {s[0] for s in STRUCTURES}]


def part_verts(pid):
    p = by_id[pid]
    q = np.frombuffer(bytes(buf[p['vOff']:p['vOff'] + p['vCount'] * 6]), dtype=np.int16).astype(np.float64)
    q = (q + 32767) / 65534
    v = np.stack([p['min'][i] + q[i::3] * p['ext'][i] for i in range(3)], axis=1)
    return v


for sid, parts_, direction in STRUCTURES:
    parts_ = [p for p in parts_ if p in by_id]
    if not parts_:
        print(f'  ! structure {sid} has no parts')
        continue
    d = np.array(direction, dtype=float)
    d /= np.linalg.norm(d)
    anchors = []
    for pid in parts_:
        v = part_verts(pid)
        anchors.append([round(float(x), 4) for x in v[int(np.argmax(v @ d))]])
    meta['structures'].append({'id': sid, 'layer': 'skeleton', 'parts': parts_, 'anchors': anchors})

# ------------------------------------------------------------------ counts, bounds
meta['counts'] = {
    'verts': sum(p['vCount'] for p in meta['parts']),
    'tris': sum(p['iCount'] // 3 for p in meta['parts']),
    'parts': len(meta['parts']),
}
lo = np.array([p['min'] for p in meta['parts']]).min(0)
hi = np.array([np.array(p['min']) + np.array(p['ext']) for p in meta['parts']]).max(0)
meta['bounds'] = {'min': [round(float(x), 4) for x in lo], 'max': [round(float(x), 4) for x in hi]}

open(os.path.join(OUT, 'anatomy.bin'), 'wb').write(bytes(buf))
json.dump(meta, open(os.path.join(OUT, 'anatomy.json'), 'w'), separators=(',', ':'))

print(f'added parts {len(new_parts)}  total parts {meta["counts"]["parts"]}  '
      f'verts {meta["counts"]["verts"]}  tris {meta["counts"]["tris"]}')
print(f'bin {len(buf) / 1e6:.2f} MB   json {os.path.getsize(os.path.join(OUT, "anatomy.json")) / 1024:.1f} KB')
print(f'bounds {meta["bounds"]}')
print(f'structures {len(meta["structures"])}')
