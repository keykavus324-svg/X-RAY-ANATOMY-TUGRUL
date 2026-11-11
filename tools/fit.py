"""Fit the BodyParts3D (mm, Z-up, +Y posterior) frame to the Z-Anatomy (m, Y-up, +Z anterior) frame."""
import json, numpy as np, glob, os, re

def read_stl(p):
    d = np.fromfile(p, dtype=np.uint8)
    n = int(np.frombuffer(d[80:84].tobytes(), dtype='<u4')[0])
    rec = np.frombuffer(d[84:84+n*50].tobytes(), dtype=np.dtype([('n','<3f4'),('v','<9f4'),('a','<u2')]))
    return rec['v'].reshape(-1,3,3).astype(np.float64)

def load_za(name):
    d = json.load(open(f'/home/user/work/{name}.json'))
    return d

PAIRS = {
 'frontal': ['FMA52734'], 'occipital': ['FMA52735'], 'sphenoid': ['FMA52736'],
 'ethmoid': ['FMA52740'], 'mandible': ['FMA52748'], 'hyoid': ['FMA52749'],
 'vomer': ['FMA9710'], 'parietal': ['FMA52788','FMA52789'],
 'temporal': ['FMA52738','FMA52739'], 'zygomatic': ['FMA52892','FMA52893'],
 'maxilla': ['FMA53649','FMA53650'], 'nasal': ['FMA53647','FMA53648'],
 'palatine': ['FMA53655','FMA53656'], 'lacrimal': ['FMA53645','FMA53646'],
 'concha': ['FMA54737','FMA54738'],
}
ZA_PARTS = {'frontal':'za_frontal','occipital':'za_occipital','sphenoid':'za_sphenoid','ethmoid':'za_ethmoid',
 'mandible':'za_mandible','hyoid':'za_hyoid','vomer':'za_vomer','parietal':'za_parietal','temporal':'za_temporal',
 'zygomatic':'za_zygomatic','maxilla':'za_maxilla','nasal':'za_nasal','palatine':'za_palatine',
 'lacrimal':'za_lacrimal_bone','concha':'za_inf_concha'}

skull = load_za('zanatomy-skull')
def za_pts(prefix):
    return np.concatenate([np.array(p['pos']).reshape(-1,3) for p in skull if re.fullmatch(prefix+r'(_\d+)?', p['name'])])

# BPD3D -> metric Z-up-anatomical frame: x'=x, y'=z, z'=-y  (metres)
def to_metric(v):
    v = v.reshape(-1,3)
    return np.stack([v[:,0], v[:,2], -v[:,1]], axis=1)/1000.0

P, Q = [], []
rows = []
for key, ids in PAIRS.items():
    tri = np.concatenate([read_stl(f'/home/user/work/stl/{i}.stl') for i in ids])
    b = to_metric(tri).reshape(-1,3)
    p = (b.min(0)+b.max(0))/2
    qa = za_pts(ZA_PARTS[key]); q = (qa.min(0)+qa.max(0))/2
    P.append(p); Q.append(q); rows.append((key, p, q))
P = np.array(P); Q = np.array(Q)

# Umeyama (scale + rotation + translation)
mu_p, mu_q = P.mean(0), Q.mean(0)
Pc, Qc = P-mu_p, Q-mu_q
C = Qc.T @ Pc / len(P)
U, S, Vt = np.linalg.svd(C)
d = np.sign(np.linalg.det(U @ Vt))
D = np.diag([1,1,d])
R = U @ D @ Vt
var_p = (Pc**2).sum()/len(P)
s = float(np.trace(np.diag(S) @ D) / var_p)
t = mu_q - s*R@mu_p
print('scale', s)
print('rotation\n', np.round(R,4))
print('translation', np.round(t,5))
res = np.linalg.norm((s*(R@P.T).T + t) - Q, axis=1)
for (k,p,q),r in zip(rows, res):
    print(f'  {k:10s} residual {r*1000:6.2f} mm')
print('max residual mm', res.max()*1000)
json.dump({'scale':s,'R':R.tolist(),'t':t.tolist()}, open('/home/user/work/build/bpd_to_za.json','w'), indent=1)
