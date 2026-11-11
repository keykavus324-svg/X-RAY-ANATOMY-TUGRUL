import * as THREE from 'three';
import { createGlobals, createLookSet } from './materials.js';

export const LAYER_COLORS = {
  skull: '#cfe6ff',
  brain: '#ff9ec4',
  muscles: '#ff6a5a',
  eyes: '#ffe9a8',
  neck: '#a8c8ea',
};

export const LAYER_ORDER = ['skull', 'brain', 'muscles', 'eyes', 'neck'];

/** Streamed fetch with a byte-progress callback (used for the loading state). */
async function fetchWithProgress(url, onProgress) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} · ${url}`);
  if (!onProgress || !res.body || !res.headers.get('content-length')) {
    const buf = await res.arrayBuffer();
    onProgress?.(1);
    return buf;
  }
  const total = Number(res.headers.get('content-length'));
  const reader = res.body.getReader();
  const chunks = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    onProgress(Math.min(1, received / total));
  }
  const out = new Uint8Array(received);
  let at = 0;
  for (const c of chunks) { out.set(c, at); at += c.length; }
  return out.buffer;
}

function geometryFromPart(buf, part) {
  const { vCount, iCount, vOff, nOff, iOff, idxType, min, ext } = part;
  const q = new Int16Array(buf, vOff, vCount * 3);
  const pos = new Float32Array(vCount * 3);
  for (let i = 0; i < vCount; i++) {
    pos[i * 3] = min[0] + ((q[i * 3] + 32767) / 65534) * ext[0];
    pos[i * 3 + 1] = min[1] + ((q[i * 3 + 1] + 32767) / 65534) * ext[1];
    pos[i * 3 + 2] = min[2] + ((q[i * 3 + 2] + 32767) / 65534) * ext[2];
  }
  const nq = new Int8Array(buf, nOff, vCount * 3);
  const nrm = new Float32Array(vCount * 3);
  for (let i = 0; i < nq.length; i++) nrm[i] = Math.max(-1, nq[i] / 127);

  const index = idxType === 16
    ? new Uint16Array(buf.slice(iOff, iOff + iCount * 2))
    : new Uint32Array(buf.slice(iOff, iOff + iCount * 4));

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  geo.setIndex(new THREE.BufferAttribute(index, 1));
  geo.computeBoundingSphere();
  geo.computeBoundingBox();
  return geo;
}

export class Anatomy {
  constructor(meta) {
    this.meta = meta;
    this.globals = createGlobals();
    this.group = new THREE.Group();
    this.group.name = 'anatomy';
    this.parts = new Map();          // partId -> mesh
    this.byLayer = new Map(LAYER_ORDER.map((l) => [l, []]));
    this.structures = meta.structures;
    this.structureById = new Map(meta.structures.map((s) => [s.id, s]));
    this.looks = {};                 // layer -> { normal: {xray,solid,wire}, hi: {...}, ghost }
    this.look = 'xray';
    this.highlightId = null;
    this.layerState = { skull: true, brain: true, muscles: true, eyes: true, neck: true };
    this.triangles = meta.counts?.tris ?? 0;
  }

  addPart(part, geo) {
    let lookSet = this.looks[part.layer];
    if (!lookSet) {
      const color = LAYER_COLORS[part.layer] || '#cfe6ff';
      lookSet = {
        normal: createLookSet(color, this.globals, 0),
        hi: createLookSet(color, this.globals, 1),
      };
      lookSet.ghost = lookSet.normal.ghost;
      this.looks[part.layer] = lookSet;
    }
    const mesh = new THREE.Mesh(geo, lookSet.normal[this.look]);
    mesh.userData = { partId: part.id, layer: part.layer };
    mesh.frustumCulled = true;
    mesh.matrixAutoUpdate = false;
    this.group.add(mesh);
    this.parts.set(part.id, mesh);
    this.byLayer.get(part.layer)?.push(mesh);
    return mesh;
  }

  setLook(look) {
    this.look = look;
    this.refreshMaterials();
  }

  setLayerVisible(layer, visible) {
    this.layerState[layer] = visible;
    for (const mesh of this.byLayer.get(layer) || []) mesh.visible = visible;
    this.refreshMaterials();
  }

  /** Highlight one structure (by catalogue id) and let everything else step back. */
  setHighlight(structureId) {
    this.highlightId = structureId;
    this.refreshMaterials();
  }

  refreshMaterials() {
    const hl = this.highlightId;
    const hlParts = hl ? new Set(this.structureById.get(hl)?.parts || []) : null;
    for (const [layer, meshes] of this.byLayer) {
      const lookSet = this.looks[layer];
      if (!lookSet) continue;
      for (const mesh of meshes) {
        const isHl = hlParts ? hlParts.has(mesh.userData.partId) : false;
        if (!hlParts) mesh.material = lookSet.normal[this.look];
        else if (isHl) mesh.material = lookSet.hi[this.look];
        else mesh.material = hl === null ? lookSet.normal[this.look] : lookSet.ghost;
        mesh.visible = this.layerState[layer];
      }
    }
  }

  /** Bounding box of everything currently visible, in local model space. */
  visibleBounds(target = new THREE.Box3()) {
    target.makeEmpty();
    const box = new THREE.Box3();
    for (const [layer, meshes] of this.byLayer) {
      if (!this.layerState[layer]) continue;
      for (const mesh of meshes) {
        box.copy(mesh.geometry.boundingBox);
        target.union(box);
      }
    }
    if (target.isEmpty()) {
      target.min.set(-1.3, -2.4, -1.2);
      target.max.set(1.3, 1.3, 0.8);
    }
    return target;
  }

  dispose() {
    for (const mesh of this.parts.values()) mesh.geometry.dispose();
    for (const layer of Object.values(this.looks)) {
      for (const set of [layer.normal, layer.hi]) {
        for (const m of Object.values(set)) if (m?.isMaterial) m.dispose();
      }
    }
  }
}

export async function loadAnatomy({ base = './models/', onProgress, onStage } = {}) {
  onStage?.('meta');
  const metaRes = await fetch(`${base}anatomy.json`, { cache: 'force-cache' });
  if (!metaRes.ok) throw new Error(`anatomy.json · ${metaRes.status}`);
  const meta = await metaRes.json();

  onStage?.('bin');
  const buf = await fetchWithProgress(`${base}anatomy.bin`, onProgress);

  const anatomy = new Anatomy(meta);
  for (const part of meta.parts) {
    anatomy.addPart(part, geometryFromPart(buf, part));
  }
  anatomy.refreshMaterials();
  return anatomy;
}
