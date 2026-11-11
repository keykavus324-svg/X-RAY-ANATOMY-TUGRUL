"""Render the social/OG card and the app icons straight from models/anatomy.bin."""
import json, os, sys, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
MODELS = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', 'models')
OUTDIR = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, '..', 'assets')
meta = json.load(open(f'{MODELS}/anatomy.json'))
buf = open(f'{MODELS}/anatomy.bin', 'rb').read()

COL = {'skull': (146, 206, 255), 'brain': (255, 120, 172), 'muscles': (255, 96, 84),
       'eyes': (255, 232, 156), 'neck': (140, 190, 236)}

def dec(p):
    v = np.frombuffer(buf, dtype='<i2', count=p['vCount']*3, offset=p['vOff']).reshape(-1, 3).astype(np.float32)
    v = np.array(p['min'], np.float32) + (v + 32767) / 65534 * np.array(p['ext'], np.float32)
    dt = '<u2' if p['idxType'] == 16 else '<u4'
    f = np.frombuffer(buf, dtype=dt, count=p['iCount'], offset=p['iOff']).reshape(-1, 3).astype(np.int64)
    return v, f

parts = [(p, *dec(p)) for p in meta['parts']]
rng = np.random.default_rng(11)

def render(W, H, zoom, ctr, ang_deg, layers, per_tri=30, glow=True):
    a = np.deg2rad(ang_deg)
    R = np.array([[np.cos(a), 0, np.sin(a)], [0, 1, 0], [-np.sin(a), 0, np.cos(a)]], np.float32)
    C = np.array(ctr, np.float32)
    light = np.array([0.32, 0.44, 0.84], np.float32); light /= np.linalg.norm(light)
    img = np.zeros((H, W, 3), np.float32)
    zb = np.full(H*W, -1e9, np.float32)
    store = []
    for p, v, f in parts:
        ly = p['layer']
        if ly not in layers: continue
        A, B, Cc = v[f[:,0]], v[f[:,1]], v[f[:,2]]
        r1 = np.sqrt(rng.random((len(f), per_tri))); r2 = rng.random((len(f), per_tri))
        pts = (A[:, None]*((1-r1)*(1-r2))[..., None] + B[:, None]*(r1*(1-r2))[..., None] + Cc[:, None]*(r1*r2)[..., None]).reshape(-1, 3)
        n = np.cross(B-A, Cc-A); n /= (np.linalg.norm(n, axis=1, keepdims=True) + 1e-12)
        n = np.repeat(n, per_tri, axis=0)
        pp = (pts - C) @ R.T; nn = n @ R.T
        x = ((pp[:, 0]/zoom + 0.5) * W).astype(np.int32)
        y = ((0.5 - pp[:, 1]/zoom) * H).astype(np.int32)
        ok = (x >= 0) & (x < W) & (y >= 0) & (y < H)
        pix = (y*W + x)[ok]; z = pp[ok, 2]; lam = np.abs((nn[ok]*light).sum(1))
        np.maximum.at(zb, pix, z)
        col = np.array(COL[ly], np.float32)/255
        shade = (0.34 + 0.66*lam) ** 1.4
        store.append((ly, pix, z, np.clip(col[None]*shade[:, None]*1.25, 0, 1)))
    for ly in ['neck', 'brain', 'muscles', 'eyes', 'skull']:
        for l2, pix, z, rgb in store:
            if l2 != ly: continue
            m = z >= zb[pix] - 1e-4
            img.reshape(-1, 3)[pix[m]] = rgb[m]
    if glow:
        g = Image.fromarray((np.clip(img, 0, 1)*255).astype('uint8')).filter(ImageFilter.GaussianBlur(6))
        img = np.clip(img*0.92 + np.asarray(g, np.float32)/255*0.42, 0, 1)
    return img

def vignette(img, strength=0.85):
    H, W = img.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W]
    cx, cy = W/2, H/2
    r = np.sqrt(((xx-cx)/cx)**2 + ((yy-cy)/cy)**2)
    m = np.clip(1 - (r*strength)**2.1, 0.05, 1)[..., None]
    return img*m

# ------------------------------------------------------------------ OG card
W, H = 1200, 630
skull = np.concatenate([p['vv'] for p in []]) if False else None
head = np.concatenate([v for p, v, f in parts if p['layer'] == 'skull'])
c = (head.min(0) + head.max(0))/2
img = render(W, H, 7.5, [c[0] - 2.25, c[1] - 0.03, c[2]], 22, {'skull', 'brain', 'eyes'}, per_tri=70)
img = vignette(img, 0.95)
base = np.zeros((H, W, 3), np.float32)
yy, xx = np.mgrid[0:H, 0:W]
gx = (xx/W - 0.70)
gy = (yy/H - 0.46)
grad = np.clip(1.4 - np.sqrt((gx*1.15)**2 + gy**2)*1.55, 0, 1)
base[:] = np.array([18, 30, 48], np.float32)/255 * grad[..., None]
# keep the left third dark so the type stays legible
scrim = np.clip((0.52 - xx/W) / 0.30, 0, 1)[..., None] ** 1.15
img = np.clip((base + img*1.05) * (1 - 0.72*scrim), 0, 1)
tile = Image.fromarray((img*255).astype('uint8'))
d = ImageDraw.Draw(tile, 'RGBA')

def font(path, size):
    try: return ImageFont.truetype(path, size)
    except Exception: return ImageFont.load_default()

F = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FR = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
d.text((64, 74), 'X-RAY MIRROR', font=font(F, 30), fill=(127, 209, 255, 255))
d.line([(64, 124), (196, 124)], fill=(127, 209, 255, 150), width=2)
for i, line in enumerate(['Kendi röntgeninize', 'aynadan bakın.']):
    d.text((64, 176 + i*62), line, font=font(F, 54), fill=(240, 247, 255, 255))
d.text((64, 344), 'Kafatası · beyin · yüz kasları · gözler', font=font(FR, 23), fill=(158, 182, 210, 255))
d.text((64, 380), 'Gerçek 3B anatomi, kameranızda canlı.', font=font(FR, 23), fill=(158, 182, 210, 255))
d.rounded_rectangle([64, 448, 430, 496], radius=11, outline=(127, 209, 255, 120), width=1)
d.text((84, 460), 'github.com/keykavus324-svg', font=font(F, 20), fill=(190, 226, 250, 255))
d.text((64, 556), 'Z-Anatomy + BodyParts3D · CC BY-SA', font=font(FR, 17), fill=(110, 132, 160, 255))
tile.save(f'{OUTDIR}/og.png', optimize=True)

# ------------------------------------------------------------------ icons
icon = render(512, 512, 3.0, [c[0], c[1]-0.02, c[2]], 20, {'skull', 'eyes'}, per_tri=32, glow=False)
icon = vignette(icon, 0.75)
ic = Image.fromarray((np.clip(icon, 0, 1)*255).astype('uint8'))
ic.save(f'{OUTDIR}/icon-512.png', optimize=True)
ic.resize((192, 192), Image.LANCZOS).save(f'{OUTDIR}/icon-192.png', optimize=True)
print('wrote og.png, icon-512.png, icon-192.png')
