import * as THREE from 'three';
import { LAYER_ORDER, HEAD_LAYERS } from './anatomy.js';
import { MODEL_SHOULDER_Y } from '../vision/bodypose.js';

const DEG = Math.PI / 180;

/**
 * The WebGL stage.
 *
 * World units are CSS pixels of the stage at z = 0, so a model whose inter-ocular
 * distance is 1.0 can be scaled by "measured pixels between the eyes" and it will line
 * up with the video without any extra projection maths.  A mild perspective camera
 * (frustum tuned so 1 px at z = 0 equals 1 px on screen) keeps the 3D readable.
 */
export class Stage {
  constructor({ canvas, host, anatomy }) {
    this.canvas = canvas;
    this.host = host;
    this.anatomy = anatomy;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 1, 40000);
    this.camera.position.set(0, 0, 2600);
    this.camera.lookAt(0, 0, 0);

    this.scene.add(anatomy.group);

    this.width = 1;
    this.height = 1;
    this.pixelRatio = 1;

    this.mode = 'present';
    this.pose = { x: 0, y: 0, iod: 100, yaw: 0, pitch: 0, roll: 0, hasFace: false };
    this.fit = { scale: 1, dx: 0, dy: 0, dz: 0 };
    this.autoFit = true;
    this.viewMode = 'mirror';      // 'mirror' = head-aligned, 'full' = whole body on stage
    const mb = anatomy?.meta?.bounds;
    this.modelBounds = new THREE.Box3(
      new THREE.Vector3(mb?.min?.[0] ?? -2.4, mb?.min?.[1] ?? -3.3, mb?.min?.[2] ?? -2.9),
      new THREE.Vector3(mb?.max?.[0] ?? 2.4, mb?.max?.[1] ?? 2.0, mb?.max?.[2] ?? 0.7),
    );

    this.present = { yaw: 0, pitch: -2 * DEG, dragging: false, lastX: 0, lastY: 0, velYaw: 0, velPitch: 0, zoom: 1 };
    this.lens = { x: 0.5, y: 0.5, radius: 0.16, active: false };
    this.revealMode = 0;
    this.captureCb = null;
    this.fps = 0;
    this._frames = 0;
    this._fpsAt = 0;

    // Whole-body anchor (shoulder midline in stage px + shoulder span), fed by the pose
    // estimator.  When it is present the entire skeleton is placed from it, so the ribs
    // land on a chest even if the face is out of frame.
    this.body = { hasBody: false, x: 0, y: 0, scale: 0, hands: [] };
    this.hands = { l: null, r: null };
    this._tmp = new THREE.Vector3();
    this._box = new THREE.Box3();

    this._buildHands();
    this._bindPointer();
    this.resize();
  }

  /**
   * Detached copies of the left/right hand, pivoted at the wrist and parked until the
   * pose estimator sees that hand.  They share geometry and material with the skeleton,
   * so they are lit by the same x-ray shader.
   */
  _buildHands() {
    const mk = (side, wrist) => {
      const node = new THREE.Group();
      node.name = `hand-${side}`;
      node.visible = false;
      const ids = side === 'l'
        ? ['carpals_l', 'metacarpals_l', 'hand_l']
        : ['carpals_r', 'metacarpals_r', 'hand_r'];
      for (const id of ids) {
        const src = this.anatomy.parts.get(id);
        if (!src) continue;
        const mesh = new THREE.Mesh(src.geometry, src.material);
        mesh.position.set(-wrist.x, -wrist.y, -wrist.z);
        mesh.renderOrder = src.renderOrder;
        node.add(mesh);
      }
      this.anatomy.group.add(node);
      return node;
    };
    // wrist centres measured from the shipped model
    this.hands.l = mk('l', { x: -4.62, y: -12.9, z: -0.7 });
    this.hands.r = mk('r', { x: 4.62, y: -12.9, z: -0.7 });
  }

  /** The skeleton's own hand meshes, which step aside while a tracked hand is drawn. */
  _builtinHand(side) {
    return [`carpals_${side}`, `metacarpals_${side}`, `hand_${side}`]
      .map((id) => this.anatomy.parts.get(id))
      .filter(Boolean);
  }

  /** Parks the detached hands at the wrists the pose estimator reported. */
  _updateHands(s) {
    const skeletonOn = this.anatomy.layerState?.skeleton !== false;
    const on = new Map((this.body.hands || []).map((h) => [h.side, h]));
    for (const side of ['l', 'r']) {
      const node = this.hands[side];
      const h = on.get(side);
      const show = !!h && skeletonOn;
      if (node) {
        if (show) {
          const mx = (h.x - this.width / 2 - this.anatomy.group.position.x) / s;
          const my = (this.height / 2 - h.y - this.anatomy.group.position.y) / s;
          node.position.set(mx, my, 0);
          // fingers point along the wrist -> knuckles line, whichever way the arm is
          node.rotation.z = Math.atan2(h.dx, h.dy);
        }
        node.visible = show;
      }
      // no doubled hands: the model's own hand hides under the tracked one
      for (const mesh of this._builtinHand(side)) mesh.visible = skeletonOn && !show;
    }
  }

  _hideHands() {
    const skeletonOn = this.anatomy.layerState?.skeleton !== false;
    if (this.hands.l) this.hands.l.visible = false;
    if (this.hands.r) this.hands.r.visible = false;
    for (const side of ['l', 'r']) {
      for (const mesh of this._builtinHand(side)) mesh.visible = skeletonOn;
    }
  }

  /** Body anchor from the pose estimator, already smoothed by the caller. */
  setBody(body) {
    Object.assign(this.body, body || { hasBody: false, hands: [] });
  }

  /* ------------------------------------------------------------------ size */
  resize() {
    const rect = this.host.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = w;
    this.height = h;
    this.pixelRatio = dpr;

    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    // 1 world unit === 1 css pixel on the z = 0 plane
    const dist = this.camera.position.z;
    this.camera.aspect = w / h;
    this.camera.fov = (2 * Math.atan(h / 2 / dist)) / DEG;
    this.camera.updateProjectionMatrix();

    const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    this.anatomy.globals.uResolution.value.set(size.x, size.y);
  }

  setMode(mode) {
    this.mode = mode;
    if (mode === 'present') {
      this.present.yaw = 0;
      this.present.pitch = -2 * DEG;
      this.present.velYaw = 0;
      this.present.velPitch = 0;
    }
  }

  setPose(pose) {
    Object.assign(this.pose, pose);
  }

  setFit(fit) {
    Object.assign(this.fit, fit);
  }

  setReveal({ mode, cut, feather }) {
    const g = this.anatomy.globals;
    if (mode !== undefined) {
      this.revealMode = mode === 'whole' ? 0 : (mode === 'left' || mode === 'right') ? 1 : (mode === 'top' || mode === 'bottom') ? 2 : 3;
      g.uRevealMode.value = this.revealMode;
      const axis = new THREE.Vector3(0, 0, 0);
      if (mode === 'left') axis.set(-1, 0, 0);
      else if (mode === 'right') axis.set(1, 0, 0);
      else if (mode === 'top') axis.set(0, 1, 0);
      else if (mode === 'bottom') axis.set(0, -1, 0);
      g.uAxis.value.copy(axis);
    }
    if (cut !== undefined) this.cutValue = cut;
    if (feather !== undefined) g.uFeather.value = feather * 0.12;

    // map the 0..1 slider onto the model's extent along the chosen axis
    const box = this._box;
    // in mirror mode the cut plane belongs to the head, not to the whole skeleton
    this.anatomy.visibleBounds(box, this.viewMode === 'mirror' ? HEAD_LAYERS : null);
    const axis = g.uAxis.value;
    let lo = 0; let hi = 0;
    if (this.revealMode === 1) { lo = box.min.x; hi = box.max.x; }
    else if (this.revealMode === 2) { lo = box.min.y; hi = box.max.y; }
    const t = this.cutValue ?? 0.5;
    g.uCut.value = lo + (hi - lo) * (1 - t);
    void axis;
  }

  /** Lens centre in CSS px relative to the stage. */
  setLens(xCss, yCss, radiusCss, active = true) {
    const g = this.anatomy.globals;
    this.lens.x = xCss / this.width;
    this.lens.y = yCss / this.height;
    this.lens.active = active;
    g.uLensCenter.value.set(xCss * this.pixelRatio, (this.height - yCss) * this.pixelRatio);
    g.uLensRadius.value = Math.max(24, radiusCss) * this.pixelRatio;
  }

  setBrightness(value) {
    this.anatomy.globals.uBrightness.value = value;
  }

  /* --------------------------------------------------------------- pointer */
  _bindPointer() {
    const el = this.host;
    const down = (e) => {
      if (this.mode !== 'present') return;
      this.present.dragging = true;
      this.present.lastX = e.clientX;
      this.present.lastY = e.clientY;
      el.classList.add('dragging');
      el.setPointerCapture?.(e.pointerId);
    };
    const move = (e) => {
      if (this.mode === 'present' && this.present.dragging) {
        const dx = e.clientX - this.present.lastX;
        const dy = e.clientY - this.present.lastY;
        this.present.lastX = e.clientX;
        this.present.lastY = e.clientY;
        this.present.yaw += dx * 0.006;
        this.present.pitch = THREE.MathUtils.clamp(this.present.pitch + dy * 0.005, -0.7, 0.7);
        this.present.velYaw = dx * 0.006;
        this.present.velPitch = dy * 0.005;
      }
      if (this.revealMode === 3) {
        const rect = el.getBoundingClientRect();
        this.setLens(e.clientX - rect.left, e.clientY - rect.top, this.lensRadiusPx || 110, true);
      }
    };
    const up = () => {
      this.present.dragging = false;
      el.classList.remove('dragging');
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', () => { if (this.revealMode === 3) this.lens.active = false; });
    el.addEventListener('touchstart', (e) => {
      if (this.revealMode === 3 && e.touches[0]) {
        const rect = el.getBoundingClientRect();
        this.setLens(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top, this.lensRadiusPx || 110, true);
      }
    }, { passive: true });
  }

  /* ------------------------------------------------------------------ frame */
  frame(dt, now) {
    const anatomy = this.anatomy;
    const g = anatomy.group;

    if (this.mode === 'present') {
      if (!this.present.dragging) {
        // gentle idle sway, plus inertia from the last drag
        this.present.yaw += this.present.velYaw;
        this.present.pitch = THREE.MathUtils.clamp(this.present.pitch + this.present.velPitch, -0.7, 0.7);
        this.present.velYaw *= 0.94;
        this.present.velPitch *= 0.9;
        this.present.yaw += Math.sin(now / 5200) * 0.00055;
        if (Math.abs(this.present.velYaw) < 1e-5 && Math.abs(this.present.yaw) > 0.5) this.present.velYaw = -Math.sign(this.present.yaw) * 0.0006;
      }
      const box = anatomy.visibleBounds(this._box);
      const bw = Math.max(box.max.x - box.min.x, 0.6);
      const bh = Math.max(box.max.y - box.min.y, 0.6);
      const scale = Math.min((this.width * 0.80) / bw, (this.height * 0.86) / bh) * this.present.zoom;
      g.scale.setScalar(scale);
      g.position.set(
        -(box.min.x + box.max.x) / 2 * scale,
        -(box.min.y + box.max.y) / 2 * scale,
        -(box.min.z + box.max.z) / 2 * scale,
      );
      g.rotation.set(this.present.pitch * 0.45, this.present.yaw, 0, 'YXZ');
      anatomy.headNode.rotation.set(0, 0, 0);
      anatomy.bodyNode.rotation.set(0, 0, 0);
      this._hideHands();
    } else {
      const p = this.pose;
      // Only yaw and pitch are used. A webcam estimate of head roll is noisy and tips the
      // whole figure on its side, which is never what the mirror should show.
      const yaw = THREE.MathUtils.clamp(p.yaw || 0, -0.95, 0.95);
      const pitch = THREE.MathUtils.clamp(p.pitch || 0, -0.6, 0.6);
      g.rotation.set(0, 0, 0);

      if (this.viewMode === 'full') {
        // The whole skeleton, standing on the floor of the stage and following you
        // sideways, so it reads as a figure in front of you rather than a floating toy.
        const b = this.modelBounds;
        const bw = Math.max(b.max.x - b.min.x, 1);
        const bh = Math.max(b.max.y - b.min.y, 1);
        const s = Math.min((this.width * 0.90) / bw, (this.height * 0.97) / bh) * this.fit.scale;
        g.scale.setScalar(s);
        const cx = (b.min.x + b.max.x) / 2;
        // feet just above the bottom edge, head x over the tracked head x
        const floorY = -this.height * 0.485;
        const swayX = p.hasFace ? (p.x - this.width / 2) * 0.55 : 0;
        const limitX = Math.max(0, this.width / 2 - (bw * s) / 2 - 12);
        const px = THREE.MathUtils.clamp(swayX - cx * s, -limitX, limitX) + this.fit.dx * 120;
        g.position.set(px, -b.min.y * s + floorY + this.fit.dy * 120, this.fit.dz * 260);
        anatomy.headNode.rotation.set(pitch * 0.30, yaw * 0.32, 0, 'YXZ');
        anatomy.bodyNode.rotation.set(0, yaw * 0.12, 0, 'YXZ');
        this._hideHands();
      } else if (this.body.hasBody && this.body.scale > 0) {
        // Whole-body anchor: the shoulder line of the model is dropped onto the measured
        // shoulder line, so the whole skeleton is life size on the real body — ribs on
        // the chest, pelvis on the hips, feet wherever the camera reaches.
        const minSide = Math.min(this.width, this.height);
        const s = THREE.MathUtils.clamp(this.body.scale, minSide * 0.02, minSide * 0.40) * this.fit.scale;
        g.scale.setScalar(s);
        g.position.set(
          this.body.x - this.width / 2 + this.fit.dx * s,
          this.height / 2 - this.body.y - MODEL_SHOULDER_Y * s + this.fit.dy * s,
          this.fit.dz * 260,
        );
        anatomy.headNode.rotation.set(pitch * 0.85, yaw * 0.85, 0, 'YXZ');
        anatomy.bodyNode.rotation.set(0, 0, 0);
        this._updateHands(s);
      } else {
        // No body yet: fall back to the tracked eyes.  One model unit *is* the measured
        // inter-ocular distance, so the skull lands on the skull and the spine and ribs
        // land on the chest, whatever the camera shows of you.
        this._hideHands();
        const minSide = Math.min(this.width, this.height);
        const hasFace = !!p.hasFace && p.iod > 0;
        // A lost face used to mean iod = 0, i.e. an 11 px/unit figure pushed half off
        // the left edge. Until the detector finds you again, stand in for the eyes with
        // a comfortable placeholder so the body stays readable and centred.
        const fallback = minSide * 0.115;
        const iod = THREE.MathUtils.clamp(hasFace ? p.iod : fallback, minSide * 0.055, minSide * 0.55);
        const s = iod * this.fit.scale;
        g.scale.setScalar(s);
        const cx = hasFace ? p.x : this.width / 2;
        const cy = hasFace ? p.y : this.height * 0.40;
        const px = cx - this.width / 2 + this.fit.dx * iod;
        const py = this.height / 2 - cy + this.fit.dy * iod;
        g.position.set(px, py, this.fit.dz * 260);
        anatomy.headNode.rotation.set(pitch * 0.85, yaw * 0.85, 0, 'YXZ');
        anatomy.bodyNode.rotation.set(0, yaw * 0.16, 0, 'YXZ');
      }
    }

    if (this.revealMode === 3) {
      const g2 = anatomy.globals;
      if (!this.lens.active) {
        g2.uLensCenter.value.set(this.width * 0.5 * this.pixelRatio, this.height * 0.5 * this.pixelRatio);
      }
    }

    this.renderer.render(this.scene, this.camera);

    if (this.captureCb) {
      const cb = this.captureCb;
      this.captureCb = null;
      cb(this.renderer.domElement);
    }

    this._frames++;
    if (now - this._fpsAt > 500) {
      this.fps = Math.round((this._frames * 1000) / (now - this._fpsAt));
      this._frames = 0;
      this._fpsAt = now;
    }
  }

  /** Grab the current frame.  The copy happens inside the render callback, while the
   *  WebGL drawing buffer is still valid, so no `preserveDrawingBuffer` is needed. */
  capture() {
    return new Promise((resolve) => {
      this.captureCb = (canvas) => {
        const copy = document.createElement('canvas');
        copy.width = canvas.width;
        copy.height = canvas.height;
        const ctx = copy.getContext('2d');
        if (ctx) ctx.drawImage(canvas, 0, 0);
        resolve(copy);
      };
    });
  }

  /** World (model-local) point -> CSS pixels inside the stage. */
  project(vector, out = { x: 0, y: 0, visible: false }, node = null) {
    const v = this._tmp.set(vector.x, vector.y, vector.z);
    (node || this.anatomy.group).localToWorld(v);
    v.project(this.camera);
    out.x = (v.x * 0.5 + 0.5) * this.width;
    out.y = (1 - (v.y * 0.5 + 0.5)) * this.height;
    out.visible = v.z > -1 && v.z < 1;
    return out;
  }

  setViewMode(mode) {
    this.viewMode = mode === 'full' ? 'full' : 'mirror';
  }

  layerMeshes(layer) {
    return this.anatomy.byLayer.get(layer) || [];
  }

  get layerOrder() { return LAYER_ORDER; }

  dispose() {
    this.renderer.dispose();
  }
}
