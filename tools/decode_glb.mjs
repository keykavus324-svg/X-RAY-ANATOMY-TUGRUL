import fs from 'fs';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const [,, inp, outp] = process.argv;
const buf = fs.readFileSync(inp);
const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
let off = 12, json = null, bin = null;
while (off < buf.length) {
  const len = dv.getUint32(off, true), type = dv.getUint32(off + 4, true);
  const chunk = buf.subarray(off + 8, off + 8 + len);
  if (type === 0x4E4F534A) json = JSON.parse(chunk.toString('utf8'));
  else if (type === 0x004E4942) bin = chunk;
  off += 8 + len;
}
// Decompress meshopt bufferViews into plain buffers
const bvs = json.bufferViews.map((bv, i) => {
  const ext = bv.extensions && bv.extensions.EXT_meshopt_compression;
  if (ext) {
    const src = bin.subarray(ext.byteOffset, ext.byteOffset + ext.byteLength);
    const count = ext.count, stride = ext.byteStride;
    const dst = new Uint8Array(count * stride);
    MeshoptDecoder.decodeGltfBuffer(dst, count, stride, src, ext.mode, ext.filter || 'NONE');
    return { data: dst, byteStride: bv.byteStride || stride };
  }
  const start = bv.byteOffset || 0;
  return { data: bin.subarray(start, start + bv.byteLength), byteStride: bv.byteStride || 0 };
});
const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const CTs = { 5120: [Int8Array, 1], 5121: [Uint8Array, 1], 5122: [Int16Array, 2], 5123: [Uint16Array, 2], 5125: [Uint32Array, 4], 5126: [Float32Array, 4] };
function acc(i) {
  const a = json.accessors[i], bv = bvs[a.bufferView];
  const [Ctor, sz] = CTs[a.componentType], nc = NC[a.type];
  const n = a.count, stride = bv.byteStride || sz * nc;
  const out = new Float32Array(n * nc);
  const view = new DataView(bv.data.buffer, bv.data.byteOffset, bv.data.byteLength);
  const ao = a.byteOffset || 0;
  const norm = a.normalized ? (a.componentType === 5122 ? 32767 : (a.componentType === 5120 ? 127 : 65535)) : 0;
  for (let k = 0; k < n; k++) {
    for (let c = 0; c < nc; c++) {
      const p = ao + k * stride + c * sz;
      let v;
      switch (a.componentType) {
        case 5120: v = view.getInt8(p); break;
        case 5121: v = view.getUint8(p); break;
        case 5122: v = view.getInt16(p, true); break;
        case 5123: v = view.getUint16(p, true); break;
        case 5125: v = view.getUint32(p, true); break;
        default: v = view.getFloat32(p, true);
      }
      out[k * nc + c] = norm ? Math.max(v / norm, -1) : v;
    }
  }
  return out;
}
// node TRS
function trs(n) {
  if (n.matrix) return n.matrix.slice();
  return null;
}
const parts = [];
for (const node of json.nodes) {
  if (node.mesh === undefined) continue;
  const mesh = json.meshes[node.mesh];
  for (const prim of mesh.primitives) {
    const pos = acc(prim.attributes.POSITION);
    const idx = prim.indices !== undefined ? acc(prim.indices) : null;
    const s = node.scale || [1, 1, 1], t = node.translation || [0, 0, 0];
    for (let i = 0; i < pos.length; i += 3) {
      pos[i] = pos[i] * s[0] + t[0];
      pos[i + 1] = pos[i + 1] * s[1] + t[1];
      pos[i + 2] = pos[i + 2] * s[2] + t[2];
    }
    parts.push({ name: node.name || mesh.name, pos: Array.from(pos), idx: idx ? Array.from(idx) : null });
  }
}
fs.writeFileSync(outp, JSON.stringify(parts));
console.log('wrote', outp, parts.length, 'parts', 'verts', parts.reduce((a, p) => a + p.pos.length / 3, 0));
