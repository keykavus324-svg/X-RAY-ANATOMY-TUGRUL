"""
Build the web-ready anatomy asset.

Sources
Sources (not vendored; see tools/README.md, override the folder with XRM_WORK)
  * Z-Anatomy (CC BY-SA 4.0) skull + brain -> GLB from the anatomyverse repo, decoded to JSON
    by decode_glb.mjs (zanatomy-skull/-cerebrum/-cerebellum/-brainstem.json)
  * BodyParts3D (CC BY-SA 2.1 JP) facial muscles, eyes, cervical spine -> STL mirror (stl/FMA<id>.stl)
Both atlases share the BodyParts3D coordinate frame, so the STL parts are mapped into the
Z-Anatomy frame with the fitted similarity transform (tools/fit.py).

Output: models/anatomy.bin + models/anatomy.json
Canonical frame: origin at the inter-ocular midpoint, +Y up, +Z anterior, 1 unit = inter-ocular
distance, X mirrored so the model reads correctly in a mirrored (selfie) view.
"""
import json, os, re, sys
import numpy as np
import trimesh
from fast_simplification import simplify

HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.environ.get('XRM_WORK', os.path.join(HERE, 'sources'))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', 'models')
FIT_PATH = os.path.join(HERE, 'bpd_to_za.json')

def read_stl(p):
    d = np.fromfile(p, dtype=np.uint8)
    n = int(np.frombuffer(d[80:84].tobytes(), dtype='<u4')[0])
    rec = np.frombuffer(d[84:84+n*50].tobytes(), dtype=np.dtype([('n','<3f4'),('v','<9f4'),('a','<u2')]))
    return rec['v'].reshape(-1,3,3).astype(np.float64)

def weld(v, f):
    m = trimesh.Trimesh(vertices=v, faces=f, process=False)
    m.merge_vertices()
    return np.asarray(m.vertices), np.asarray(m.faces)

def from_glb_part(p):
    pos = np.array(p['pos'], dtype=np.float64).reshape(-1,3)
    idx = np.array(p['idx'], dtype=np.int64).reshape(-1,3)
    return weld(pos, idx)

FIT = json.load(open(FIT_PATH))
S = FIT['scale']; R = np.array(FIT['R']); T = np.array(FIT['t'])
def bpd_to_za(tri):
    v = tri.reshape(-1,3)
    m = np.stack([v[:,0], v[:,2], -v[:,1]], axis=1)/1000.0
    return (S*(R@m.T).T + T).reshape(-1,3,3)

# ---------------------------------------------------------------- source loading
ZA = {p['name']: p for p in json.load(open(f'{WORK}/zanatomy-skull.json'))}
CEREBRUM = json.load(open(f'{WORK}/zanatomy-cerebrum.json'))[0]
CEREBELLUM = json.load(open(f'{WORK}/zanatomy-cerebellum.json'))[0]
BRAINSTEM = json.load(open(f'{WORK}/zanatomy-brainstem.json'))[0]

# part table: (out id, layer, source kind, source ref, target triangle count)
ZA_BONES = [
    ('frontal',   'za_frontal',            5200),
    ('parietal',  'za_parietal',           5200),
    ('temporal',  'za_temporal',           5200),
    ('occipital', 'za_occipital',          5000),
    ('sphenoid',  'za_sphenoid',           4600),
    ('ethmoid',   'za_ethmoid',            2500),
    ('nasal',     'za_nasal',              1400),
    ('maxilla',   'za_maxilla',            4000),
    ('zygomatic', 'za_zygomatic',          2600),
    ('lacrimal',  'za_lacrimal_bone',      1200),
    ('palatine',  'za_palatine',           2200),
    ('concha',    'za_inf_concha',         1800),
    ('vomer',     'za_vomer',              1200),
    ('mandible',  'za_mandible',           6000),
    ('hyoid',     'za_hyoid',              1500),
]
BPD_PARTS = [
    # id prefix, layer, stl ids, target tris each, structure key
    ('frontalis',        'muscles', ['FMA46759','FMA46760'], 2200),
    ('occipitalis',      'muscles', ['FMA46761','FMA46762'], 1500),
    ('temporalis',       'muscles', ['FMA49007','FMA49008'], 4000),
    ('orbicularis_oculi','muscles', ['FMA46782','FMA46783','FMA46785','FMA46786'], 1500),
    ('zygomaticus_major','muscles', ['FMA46812','FMA46813'], 900),
    ('zygomaticus_minor','muscles', ['FMA46814','FMA46815'], 800),
    ('orbicularis_oris', 'muscles', ['FMA46841'], 2600),
    ('masseter_sup',     'muscles', ['FMA49001','FMA49002'], 1200),
    ('masseter_deep',    'muscles', ['FMA49004','FMA49005'], 1000),
    ('pterygoid_lat',    'muscles', ['FMA49022','FMA49023','FMA49024','FMA49025'], 700),
    ('nasalis',          'muscles', ['FMA55606','FMA55607'], 800),
    ('platysma',         'muscles', ['FMA45739','FMA45740'], 3000),
    ('atlas',            'neck',    ['FMA12519'], 1800),
    ('axis',             'neck',    ['FMA12520'], 1800),
    ('cervical',         'neck',    ['FMA12521','FMA12522','FMA12523','FMA12524','FMA12525'], 1500),
]

parts = []   # dicts: id, layer, verts, faces

def compact(v, f):
    """Drop vertices no triangle references (simplification leaves some behind)."""
    used = np.unique(f)
    remap = -np.ones(len(v), dtype=np.int64)
    remap[used] = np.arange(len(used), dtype=np.int64)
    return v[used], remap[f]

def add_part(pid, layer, verts, faces, target):
    verts = np.asarray(verts, np.float64)
    faces = np.asarray(faces, np.int64)
    if len(faces) > target*1.05:
        v, f = simplify(verts.astype(np.float32), faces.astype(np.int32),
                        target_reduction=1.0 - target/len(faces))
        verts, faces = np.asarray(v, dtype=np.float64), np.asarray(f, dtype=np.int64)
    verts, faces = compact(verts, faces)
    parts.append({'id': pid, 'layer': layer, 'verts': verts, 'faces': faces})

# ---- skull (Z-Anatomy): bilateral parts are split by the sign of their mean X
for base, prefix, target in ZA_BONES:
    matches = [n for n in ZA if re.fullmatch(prefix + r'(_\d+)?', n)]
    for n in sorted(matches):
        v, f = from_glb_part(ZA[n])
        side = 'l' if v[:,0].mean() > 0 else 'r'          # +X = subject's left (before mirroring)
        pid = f'{base}_{side}' if prefix in ('za_parietal','za_temporal','za_nasal','za_maxilla',
                                            'za_zygomatic','za_lacrimal_bone','za_palatine','za_inf_concha') else base
        add_part(pid, 'skull', v, f, target)

# ---- teeth
teeth_u_v, teeth_u_f, teeth_l_v, teeth_l_f = [], [], [], []
off_u = off_l = 0
for n in sorted(ZA):
    if not n.startswith('za_tooth_'): continue
    v, f = from_glb_part(ZA[n])
    tgt = 420
    if len(f) > tgt:
        v, f = simplify(v.astype(np.float32), f.astype(np.int32), target_reduction=1.0-tgt/len(f))
        v, f = np.asarray(v, np.float64), np.asarray(f, np.int64)
    if n.startswith('za_tooth_u'):
        teeth_u_v.append(v); teeth_u_f.append(f+off_u); off_u += len(v)
    else:
        teeth_l_v.append(v); teeth_l_f.append(f+off_l); off_l += len(v)
add_part('teeth_upper', 'skull', np.concatenate(teeth_u_v), np.concatenate(teeth_u_f), 10**9)
add_part('teeth_lower', 'skull', np.concatenate(teeth_l_v), np.concatenate(teeth_l_f), 10**9)
assert len({p['id'] for p in parts}) == len(parts), 'duplicate part ids'

# ---- brain
for pid, src, target in [('cerebrum', CEREBRUM, 26000), ('cerebellum', CEREBELLUM, 10000), ('brainstem', BRAINSTEM, 7000)]:
    v, f = from_glb_part(src)
    add_part(pid, 'brain', v, f, target)

# ---- BodyParts3D derived parts, mapped into the Z-Anatomy frame
for base, layer, ids, target in BPD_PARTS:
    built = []
    for sid in ids:
        tri = bpd_to_za(read_stl(f'{WORK}/stl/{sid}.stl'))
        v2 = tri.reshape(-1,3)
        v, f = weld(v2, np.arange(len(v2)).reshape(-1,3))
        built.append((v, f))
    sides = ['l' if v[:,0].mean() > 0 else 'r' for v, f in built]
    seen = {'l': 0, 'r': 0}
    for (v, f), side in zip(built, sides):
        seen[side] += 1
        if len(ids) == 1:
            pid = base
        elif sides.count(side) > 1:
            pid = f'{base}_{side}{seen[side]}'
        else:
            pid = f'{base}_{side}'
        add_part(pid, layer, v, f, target)

# ---- eyes: the BodyParts3D eyeball mesh holds both globes
tri = bpd_to_za(read_stl(f'{WORK}/stl/FMA12513.stl'))
v = tri.reshape(-1,3)
m = trimesh.Trimesh(vertices=v, faces=np.arange(len(v)).reshape(-1,3), process=False)
m.merge_vertices()
comps = m.split(only_watertight=False)
eye_centres = []
for c in comps:
    cv, cf = np.asarray(c.vertices), np.asarray(c.faces)
    side = 'l' if cv[:,0].mean() > 0 else 'r'
    add_part(f'eyeball_{side}', 'eyes', cv, cf, 2600)
    eye_centres.append(cv.mean(0) * 0.4 + (cv.min(0)+cv.max(0))/2 * 0.6)
eye_centres = np.array(eye_centres)

# ---------------------------------------------------------------- canonical frame
origin = eye_centres.mean(0)
iod = np.linalg.norm(eye_centres[0] - eye_centres[1])
k = 1.0 / iod
MIRROR = np.array([-1.0, 1.0, 1.0])          # mirrored (selfie) view
def canon(v):
    return ((v - origin) * k) * MIRROR

for p in parts:
    p['verts'] = canon(p['verts'])
    p['faces'] = p['faces'][:, ::-1]          # mirrored -> restore outward winding
    # drop degenerate triangles
    v, f = p['verts'], p['faces']
    a, b, c = v[f[:,0]], v[f[:,1]], v[f[:,2]]
    area = np.linalg.norm(np.cross(b-a, c-a), axis=1)
    keep = area > 1e-12
    v2, f2 = compact(v, f[keep])
    p['verts'], p['faces'] = v2, f2

# ---------------------------------------------------------------- normals + pack
total_v = sum(len(p['verts']) for p in parts)
total_t = sum(len(p['faces']) for p in parts)
print(f'parts {len(parts)}  verts {total_v}  tris {total_t}')

def vertex_normals(v, f):
    n = np.zeros_like(v)
    a, b, c = v[f[:,0]], v[f[:,1]], v[f[:,2]]
    fn = np.cross(b-a, c-a)
    fl = np.linalg.norm(fn, axis=1, keepdims=True)
    fl[fl == 0] = 1.0
    fn = fn / fl                      # unit face normals: tiny triangles weigh the same
    for i in range(3):
        np.add.at(n, f[:,i], fn)
    ln = np.linalg.norm(n, axis=1)
    good = ln > 1e-9
    if good.any():
        avg = n[good].mean(0)
        nrm = np.linalg.norm(avg)
        avg = avg / nrm if nrm > 0 else np.array([0.0, 0.0, 1.0])
    else:
        avg = np.array([0.0, 0.0, 1.0])
    n[~good] = avg
    ln = np.linalg.norm(n, axis=1)
    ln[ln < 1e-9] = 1.0
    return n / ln[:, None]

buf = bytearray()
meta_parts = []
def align4():
    while len(buf) % 4: buf.append(0)

for p in parts:
    v, f = p['verts'], p['faces']
    n = vertex_normals(v, f)
    vmin, vmax = v.min(0), v.max(0)
    ext = np.maximum(vmax - vmin, 1e-9)
    q = np.round((v - vmin) / ext * 65534 - 32767).astype(np.int16)
    nq = np.round(np.clip(n, -1, 1) * 127).astype(np.int8)

    idx_type = 16 if len(v) <= 65536 else 32
    fi = f.astype(np.uint16 if idx_type == 16 else np.uint32)
    align4(); v_off = len(buf); buf.extend(q.tobytes())
    align4(); n_off = len(buf); buf.extend(nq.tobytes())
    align4(); i_off = len(buf); buf.extend(fi.tobytes())
    meta_parts.append({
        'id': p['id'], 'layer': p['layer'], 'vCount': len(v), 'iCount': int(fi.size),
        'vOff': v_off, 'nOff': n_off, 'iOff': i_off, 'idxType': idx_type,
        'min': [round(float(x), 6) for x in vmin], 'ext': [round(float(x), 6) for x in ext],
    })

os.makedirs(OUT, exist_ok=True)
open(f'{OUT}/anatomy.bin', 'wb').write(bytes(buf))

# ---------------------------------------------------------------- anchors + structures
def head_center():
    V = np.concatenate([p['verts'] for p in parts if p['layer'] == 'skull'])
    return (V.min(0) + V.max(0)) / 2
HC = head_center()

def outward_anchor(p, direction=None):
    v = p['verts']
    if direction is None:
        d = v.mean(0) - HC
    else:
        d = np.array(direction, float)
    d = d / (np.linalg.norm(d) + 1e-9)
    score = v @ d
    return v[np.argmax(score)]

by_id = {p['id']: p for p in parts}
import collections
Groups = collections.defaultdict(list)
for p in parts:
    Groups[p['id']] = [p]
    if '_' in p['id']:
        Groups[p['id'].rsplit('_', 1)[0]].append(p)
        Groups[p['id'][:-2] if p['id'][-2:] in ('_l', '_r') else p['id']].append(p)

def group_verts(pid):
    base = pid
    for cand in sorted(Groups, key=len, reverse=True):
        if pid == cand or pid.startswith(cand + '_'):
            pass
    ps = [p for p in parts if p['id'] == pid or p['id'].startswith(pid + '_')]
    assert ps, pid
    return np.concatenate([p['verts'] for p in ps])

def anchor_for(pid, direction=None):
    v = group_verts(pid)
    if direction is None:
        d = v.mean(0) - HC
    else:
        d = np.array(direction, float)
    d = d / (np.linalg.norm(d) + 1e-9)
    return [round(float(x), 4) for x in v[np.argmax(v @ d)]]

def anchor_pair(base, direction=None):
    out = []
    for s in ('l', 'r'):
        ps = [p for p in parts if p['id'] == f'{base}_{s}' or p['id'].startswith(f'{base}_{s}')]
        if not ps: continue
        v = np.concatenate([p['verts'] for p in ps])
        if direction is None:
            d = v.mean(0) - HC
        else:
            d = np.array(direction, float)
        d = d / (np.linalg.norm(d) + 1e-9)
        out.append([round(float(x), 4) for x in v[np.argmax(v @ d)]])
    return out

# lobe anchors: extreme points of the cerebrum in characteristic directions
CER = by_id['cerebrum']['verts']
def lobe_anchor(direction, inset=0.035):
    d = np.array(direction, float); d /= np.linalg.norm(d)
    v = CER[np.argmax(CER @ d)]
    c = CER.mean(0)
    return [round(float(x), 4) for x in (v + (c - v) * inset)]

structures = []
def S_(sid, layer, anchors, parts_=None):
    structures.append({'id': sid, 'layer': layer, 'parts': parts_ or ([sid] if sid in by_id else []),
                       'anchors': anchors})

S_('frontal', 'skull', [anchor_for('frontal')])
S_('parietal', 'skull', anchor_pair('parietal'))
S_('temporal', 'skull', anchor_pair('temporal'))
S_('occipital', 'skull', [anchor_for('occipital')])
S_('sphenoid', 'skull', [anchor_for('sphenoid', (0.2, 0.5, 0.6))])
S_('ethmoid', 'skull', [anchor_for('ethmoid', (0, -0.2, 1))])
S_('nasal', 'skull', anchor_pair('nasal'))
S_('maxilla', 'skull', anchor_pair('maxilla'))
S_('zygomatic', 'skull', anchor_pair('zygomatic'))
S_('lacrimal', 'skull', anchor_pair('lacrimal'))
S_('palatine', 'skull', anchor_pair('palatine'))
S_('concha', 'skull', anchor_pair('concha'))
S_('vomer', 'skull', [anchor_for('vomer', (0, -0.4, 1))])
S_('mandible', 'skull', [anchor_for('mandible', (0.3, -1, 0.35))])
S_('teeth', 'skull', [anchor_for('teeth_upper', (0, -0.2, 1))], ['teeth_upper', 'teeth_lower'])
S_('hyoid', 'skull', [anchor_for('hyoid', (0, -1, 0))])
S_('cerebrum', 'brain', [lobe_anchor((0.35, 0.5, 1)), lobe_anchor((1, 0.9, -0.2)), lobe_anchor((1, -0.5, 0.4)), lobe_anchor((0.2, 0.0, -1))])
S_('cerebellum', 'brain', [anchor_for('cerebellum', (0.4, -0.3, -1))])
S_('brainstem', 'brain', [anchor_for('brainstem', (0, -1, 0.25))])
S_('eyeball', 'eyes', anchor_pair('eyeball'))
for base in ('frontalis','occipitalis','temporalis','orbicularis_oculi','zygomaticus_major',
             'zygomaticus_minor','orbicularis_oris','masseter','pterygoid_lat','nasalis','platysma'):
    if base == 'masseter':
        S_(base, 'muscles', anchor_pair('masseter_sup'), [p['id'] for p in parts if p['id'].startswith('masseter')])
    else:
        S_(base, 'muscles', anchor_pair(base) if any(p['id'].startswith(base + '_') for p in parts) else [anchor_for(base)])
S_('atlas', 'neck', [anchor_for('atlas', (0.4, 0, -1))])
S_('axis', 'neck', [anchor_for('axis', (0.4, 0, -1))])
S_('cervical', 'neck', [anchor_for('cervical', (0.4, 0, -1))], [p['id'] for p in parts if p['id'].startswith('cervical')])

meta = {
    'version': 1,
    'frame': {'origin': 'inter-ocular midpoint', 'up': '+Y', 'anterior': '+Z',
              'unit': 'inter-ocular distance', 'mirrored': True},
    'bounds': {'min': [round(float(x), 4) for x in np.min([p['verts'].min(0) for p in parts], axis=0)],
               'max': [round(float(x), 4) for x in np.max([p['verts'].max(0) for p in parts], axis=0)]},
    'counts': {'verts': int(total_v), 'tris': int(total_t), 'parts': len(parts)},
    'parts': meta_parts,
    'structures': structures,
}
json.dump(meta, open(f'{OUT}/anatomy.json', 'w'), separators=(',', ':'))
print('bin MB', round(len(buf)/1e6, 2), 'json KB', round(os.path.getsize(f'{OUT}/anatomy.json')/1e3, 1))
print('parts with >65535 verts:', [p['id'] for p in meta_parts if p['vCount'] > 65536])
print('structures', len(structures))
