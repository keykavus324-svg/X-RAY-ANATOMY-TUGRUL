// Headless checks for the anatomy asset + site wiring (no browser needed).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(ROOT);

const files = {
  'models/anatomy.json': fs.readFileSync('models/anatomy.json'),
  'models/anatomy.bin': fs.readFileSync('models/anatomy.bin'),
};
globalThis.fetch = async (url) => {
  const key = String(url).replace(/^\.\//, '').split('?')[0];
  const buf = files[key];
  if (!buf) return { ok: false, status: 404, statusText: 'not found' };
  return {
    ok: true,
    status: 200,
    headers: { get: (h) => (h === 'content-length' ? String(buf.length) : null) },
    arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length),
    json: async () => JSON.parse(buf.toString('utf8')),
  };
};

const { loadAnatomy, LAYER_ORDER, LAYER_COLORS } = await import('../src/gl/anatomy.js');
const { STRUCTURES, LAYERS } = await import('../src/data/structures.js');
const { DICT } = await import('../src/i18n.js');

const fail = [];
const ok = (cond, msg) => { if (!cond) fail.push(msg); };

const anatomy = await loadAnatomy({ base: 'models/' });
const meta = anatomy.meta;

ok(anatomy.parts.size === meta.counts.parts, 'part count mismatch');
ok(meta.counts.parts === 102, `expected 102 parts, got ${meta.counts.parts}`);
ok(meta.counts.tris === 251894, `unexpected triangle count ${meta.counts.tris}`);
ok(LAYER_ORDER.length === 6 && LAYER_ORDER.includes('skeleton'), 'skeleton layer missing from LAYER_ORDER');

// every layer used by the model must be known to the renderer and the catalogue
for (const layer of new Set(meta.parts.map((p) => p.layer))) {
  ok(LAYER_ORDER.includes(layer), `unknown layer ${layer}`);
  ok(LAYER_COLORS[layer], `no colour for ${layer}`);
  ok(LAYERS[layer], `no catalogue entry for ${layer}`);
}

// geometry: indices in range, finite positions, sane normals, correct parent node
for (const part of meta.parts) {
  const mesh = anatomy.parts.get(part.id);
  const geo = mesh.geometry;
  const pos = geo.getAttribute('position');
  const nrm = geo.getAttribute('normal');
  const idx = geo.getIndex();
  ok(pos.count === part.vCount, `${part.id}: vCount`);
  ok(nrm.count === part.vCount, `${part.id}: normals`);
  ok(idx.count === part.iCount, `${part.id}: index count`);
  let maxIdx = 0;
  for (let i = 0; i < idx.count; i++) maxIdx = Math.max(maxIdx, idx.getX(i));
  ok(maxIdx < part.vCount, `${part.id}: index out of range`);
  for (let i = 0; i < pos.count; i += 97) {
    ok(Number.isFinite(pos.getX(i)) && Number.isFinite(pos.getY(i)) && Number.isFinite(pos.getZ(i)),
      `${part.id}: NaN position`);
    const n = Math.hypot(nrm.getX(i), nrm.getY(i), nrm.getZ(i));
    ok(Math.abs(n - 1) < 0.06, `${part.id}: normal length ${n.toFixed(3)}`);
  }
  const expected = LAYER_ORDER.includes(part.layer) && ['skull', 'brain', 'muscles', 'eyes', 'neck'].includes(part.layer)
    ? 'head' : 'body';
  ok(mesh.parent?.name === expected, `${part.id}: parented to ${mesh.parent?.name}, expected ${expected}`);
}

// head and body pivots exist, body sits far below the head
ok(anatomy.headNode.parent === anatomy.group && anatomy.bodyNode.parent === anatomy.group, 'pivot nodes');
ok(anatomy.modelBounds?.isEmpty?.() !== true, 'model bounds');

// anatomy.json structures <-> catalogue
const jsonIds = new Set(meta.structures.map((s) => s.id));
const catIds = new Set(STRUCTURES.map((s) => s.id));
for (const id of jsonIds) ok(catIds.has(id), `structure ${id} has no catalogue entry`);
for (const id of catIds) ok(jsonIds.has(id), `catalogue entry ${id} has no anchors`);
for (const s of meta.structures) {
  ok(LAYER_ORDER.includes(s.layer), `structure ${s.id}: layer ${s.layer}`);
  ok(s.anchors.length > 0, `structure ${s.id}: no anchors`);
  for (const p of s.parts) ok(anatomy.parts.has(p), `structure ${s.id}: unknown part ${p}`);
}
for (const s of STRUCTURES) {
  ok(s.tr?.name && s.tr?.desc && s.en?.name && s.en?.desc, `catalogue ${s.id}: missing text`);
}

// bounds: full body, skeleton well below the eyes, nothing absurd
const [minX, minY, minZ] = meta.bounds.min;
const [maxX, maxY, maxZ] = meta.bounds.max;
ok(minY < -24 && minY > -30, `feet at ${minY} (expected below -24)`);
ok(maxY > 1.5 && maxY < 2.6, `skull top at ${maxY}`);
ok(maxX > 3 && minX < -3, 'body width');
const height = maxY - minY;
ok(height > 27 && height < 32, `body height ${height}`);

// the two view modes fit into a 320x480 stage
const stageW = 320; const stageH = 480;
const fullScale = Math.min((stageW * 0.88) / (maxX - minX), (stageH * 0.94) / (maxY - minY));
ok(fullScale * (maxY - minY) <= stageH * 0.96, 'full-body mode does not fit vertically');
ok(fullScale * (maxX - minX) <= stageW * 0.9, 'full-body mode does not fit horizontally');

// ---------------------------------------------------------------- site wiring
const html = fs.readFileSync('index.html', 'utf8');
for (const file of ['src/main.js', 'src/ui/controls.js', 'src/ui/explorer.js', 'src/gl/stage.js']) {
  const code = fs.readFileSync(file, 'utf8');
  for (const m of code.matchAll(/\$\('([A-Za-z0-9_]+)'\)/g)) {
    // ids that the JS injects itself (error card) are allowed to be absent
    if (['retryBoot'].includes(m[1])) continue;
    ok(new RegExp(`id="${m[1]}"`).test(html), `${file}: #${m[1]} missing in index.html`);
  }
  for (const m of code.matchAll(/\bt\('([a-zA-Z0-9.]+)'/g)) {
    ok(m[1] in DICT.tr && m[1] in DICT.en, `i18n key ${m[1]} missing (${file})`);
  }
}
for (const m of html.matchAll(/data-i18n="([^"]+)"/g)) {
  ok(m[1] in DICT.tr, `i18n TR missing ${m[1]}`);
  ok(m[1] in DICT.en, `i18n EN missing ${m[1]}`);
}
for (const m of html.matchAll(/data-filter="([^"]+)"/g)) {
  ok(m[1] === 'all' || LAYER_ORDER.includes(m[1]), `filter chip ${m[1]} is not a layer`);
}
for (const m of html.matchAll(/data-preset="([^"]+)"/g)) {
  ok(['all', 'skull', 'brain', 'muscles', 'skeleton', 'head', 'chest'].includes(m[1]), `preset chip ${m[1]}`);
}
ok(/id="L_skeleton"/.test(html), 'skeleton layer checkbox missing');
ok(/data-view="full"/.test(html) && /data-view="mirror"/.test(html), 'view mode buttons missing');

console.log(`parts ${meta.counts.parts}  verts ${meta.counts.verts}  tris ${meta.counts.tris}`);
console.log(`bin ${(files['models/anatomy.bin'].length / 1e6).toFixed(2)} MB  json ${(files['models/anatomy.json'].length / 1024).toFixed(1)} KB`);
console.log(`bounds ${JSON.stringify(meta.bounds)}`);
console.log(`layers ${LAYER_ORDER.join(', ')}`);
console.log(`full-body scale @320x480 ${fullScale.toFixed(2)} px/unit`);
if (fail.length) {
  console.error('FAILURES:');
  for (const f of fail.slice(0, 40)) console.error('  -', f);
  process.exit(1);
}
console.log('all checks passed');
