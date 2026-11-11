"""Offline sanity render (point-splat z-buffer) of models/anatomy.bin — no browser needed."""
import json, sys, numpy as np
from PIL import Image

MODELS = sys.argv[1] if len(sys.argv) > 1 else '/home/user/work/out'
OUT = sys.argv[2] if len(sys.argv) > 2 else '/home/user/work/preview.png'
meta = json.load(open(f'{MODELS}/anatomy.json'))
buf = open(f'{MODELS}/anatomy.bin', 'rb').read()
LAYER_COL = {'skull': (200, 228, 255), 'brain': (255, 150, 190), 'muscles': (255, 110, 96),
             'eyes': (255, 245, 170), 'neck': (150, 200, 240)}

def decode_part(p):
    v = np.frombuffer(buf, dtype='<i2', count=p['vCount']*3, offset=p['vOff']).reshape(-1, 3).astype(np.float32)
    v = np.array(p['min'], np.float32) + (v + 32767) / 65534 * np.array(p['ext'], np.float32)
    dt, sz = ('<u2', 2) if p['idxType'] == 16 else ('<u4', 4)
    f = np.frombuffer(buf, dtype=dt, count=p['iCount'], offset=p['iOff']).reshape(-1, 3).astype(np.int64)
    return v, f

parts = [dict(meta=p, vv=decode_part(p)[0], ff=decode_part(p)[1]) for p in meta['parts']]
bmin = np.array(meta['bounds']['min']); bmax = np.array(meta['bounds']['max'])
ctr = (bmin + bmax) / 2
rng = np.random.default_rng(7)

def samples(p, per_tri=26):
    v, f = p['vv'], p['ff']
    a, b, c = v[f[:, 0]], v[f[:, 1]], v[f[:, 2]]
    r1 = np.sqrt(rng.random((len(f), per_tri))).astype(np.float32)
    r2 = rng.random((len(f), per_tri)).astype(np.float32)
    w0 = (1 - r1)[..., None]; w1 = (r1 * (1 - r2))[..., None]; w2 = (r1 * r2)[..., None]
    pts = a[:, None, :]*w0 + b[:, None, :]*w1 + c[:, None, :]*w2
    nrm = np.cross(b - a, c - a)
    nrm /= (np.linalg.norm(nrm, axis=1, keepdims=True) + 1e-12)
    return pts.reshape(-1, 3).astype(np.float32), np.repeat(nrm, per_tri, axis=0).astype(np.float32)

def rot_for(view):
    if view == 'top':
        return np.array([[1, 0, 0], [0, 0, -1], [0, 1, 0]], np.float32)
    ang = dict(front=0, q35=35, side=90, back=180, q315=-35)[view]
    a = np.deg2rad(ang)
    return np.array([[np.cos(a), 0, np.sin(a)], [0, 1, 0], [-np.sin(a), 0, np.cos(a)]], np.float32)

def render(view, W=480, H=620, layers=None, zoom=3.4, ctr_override=None, cy=0.0):
    R = rot_for(view)
    C = ctr if ctr_override is None else np.array(ctr_override, np.float32)
    light = np.array([0.3, 0.42, 0.86], np.float32); light /= np.linalg.norm(light)
    img = np.full((H, W, 3), 0.02, np.float32)
    zbuf = np.full(H*W, -1e9, np.float32)
    chosen = {}
    for p in parts:
        ly = p['meta']['layer']
        if layers and ly not in layers: continue
        pts, nrm = samples(p)
        pp = (pts - C) @ R.T
        nn = nrm @ R.T
        x = ((pp[:, 0] / zoom + 0.5) * W).astype(np.int32)
        y = ((0.5 - (pp[:, 1] - cy)/ zoom) * H).astype(np.int32)
        ok = (x >= 0) & (x < W) & (y >= 0) & (y < H)
        x, y, z, nn, pp = x[ok], y[ok], pp[ok, 2], nn[ok], pp[ok]
        pix = y*W + x
        np.maximum.at(zbuf, pix, z)
        # shade
        lam = np.abs((nn*light).sum(1))
        dep = np.clip((z - zbuf.min()) / (zbuf.max() - zbuf.min() + 1e-6), 0, 1)
        col = np.array(LAYER_COL[ly], np.float32)/255
        shade = (0.28 + 0.72*lam) * (0.75 + 0.35*(1-dep))
        rgb = np.clip(col[None, :]*shade[:, None], 0, 1)
        chosen.setdefault(ly, []).append((pix, z, rgb))
    # second pass: write only samples that are (near) the front-most
    order = ['neck', 'brain', 'muscles', 'eyes', 'skull']
    for ly in order:
        for pix, z, rgb in chosen.get(ly, []):
            m = z >= zbuf[pix] - 1e-4
            img.reshape(-1, 3)[pix[m]] = rgb[m]
    return img

brain_only = np.concatenate([p['vv'] for p in parts if p['meta']['layer']=='brain'])
bc = (brain_only.min(0)+brain_only.max(0))/2
skull_only = np.concatenate([p['vv'] for p in parts if p['meta']['layer']=='skull'])
sc = (skull_only.min(0)+skull_only.max(0))/2
views = [
  ('front', None, 2.9, sc, 0.0),
  ('q35', None, 2.9, sc, 0.0),
  ('side', None, 2.9, sc, 0.0),
  ('front', {'brain'}, 1.75, bc, 0.0),
  ('side', {'brain'}, 1.75, bc, 0.0),
  ('q35', {'brain','skull'}, 2.9, sc, 0.0),
]
tiles = [render(v, layers=l, zoom=z, ctr_override=c) for v, l, z, c, _ in views]
W, H = 480, 620
sheet = Image.new('RGB', (W*3, H*2), (5, 6, 10))
for i, t in enumerate(tiles):
    sheet.paste(Image.fromarray((np.clip(t, 0, 1)*255).astype('uint8')), ((i % 3)*W, (i//3)*H))
sheet.save(OUT)
print('wrote', OUT, sheet.size)
