/**
 * Head pose maths.
 *
 * face-api.js gives 68 landmarks per frame.  We only need a handful of stable
 * measurements: the eye centres (position + scale + roll), the nose tip (yaw) and the
 * chin distance (pitch).  Everything runs through a 1€ filter so the anatomy does not
 * shake while the detector jitters.
 */

const IDX_RIGHT_EYE = [36, 37, 38, 39, 40, 41];
const IDX_LEFT_EYE = [42, 43, 44, 45, 46, 47];
const IDX_NOSE_TIP = 30;
const IDX_CHIN = 8;
const IDX_MOUTH_L = 48;
const IDX_MOUTH_R = 54;

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

class LowPass {
  constructor() { this.y = null; this.s = null; }
  filter(x, dt, minCutoff, beta, dCutoff = 1.0) {
    if (this.y === null) { this.y = x; this.s = x; return x; }
    const alpha = (cutoff, d) => {
      const tau = 1 / (2 * Math.PI * cutoff);
      return 1 / (1 + tau / d);
    };
    const dx = (x - this.s) / dt;
    const aD = alpha(dCutoff, dt);
    this.s = aD * x + (1 - aD) * this.s;
    const cutoff = minCutoff + beta * Math.abs(dx);
    const a = alpha(cutoff, dt);
    this.y = a * x + (1 - a) * this.y;
    return this.y;
  }
  reset() { this.y = null; this.s = null; }
}

function meanPoint(pts, idxs) {
  let x = 0; let y = 0;
  for (const i of idxs) { x += pts[i].x; y += pts[i].y; }
  return { x: x / idxs.length, y: y / idxs.length };
}

/** Raw, per-frame measurements in video pixel space. */
export function measure(landmarks) {
  const pts = landmarks?.positions || landmarks;
  if (!pts || pts.length < 68) return null;
  let eyeA = meanPoint(pts, IDX_RIGHT_EYE);
  let eyeB = meanPoint(pts, IDX_LEFT_EYE);
  if (eyeA.x > eyeB.x) { const t = eyeA; eyeA = eyeB; eyeB = t; }
  const ex = (eyeA.x + eyeB.x) / 2;
  const ey = (eyeA.y + eyeB.y) / 2;
  const dx = eyeB.x - eyeA.x;
  const dy = eyeB.y - eyeA.y;
  const iod = Math.hypot(dx, dy);
  if (!Number.isFinite(iod) || iod < 4) return null;

  const nose = pts[IDX_NOSE_TIP];
  const chin = pts[IDX_CHIN];
  const mouth = {
    x: (pts[IDX_MOUTH_L].x + pts[IDX_MOUTH_R].x) / 2,
    y: (pts[IDX_MOUTH_L].y + pts[IDX_MOUTH_R].y) / 2,
  };

  // A face that is half out of frame (or a rotated camera) yields landmarks whose eye
  // line is nearly vertical; every offset measured from it would be nonsense, so the
  // frame is skipped instead of tipping the model over.
  const roll = Math.atan2(dy, dx);
  if (Math.abs(Math.abs(roll) - Math.PI / 2) < 0.35) return null;

  // Measure in the head's own frame: rotating the offsets by -roll makes yaw/pitch
  // independent of how the head (or the camera) is tilted in the picture.
  const c = Math.cos(roll);
  const s = Math.sin(roll);
  const at = (p) => {
    const nx = (p.x - ex) / iod;
    const ny = (p.y - ey) / iod;
    return { x: c * nx + s * ny, y: -s * nx + c * ny };
  };
  const noseOff = at(nose);
  const mouthOff = at(mouth);
  const chinOff = at(chin);
  const eyeballCentre = at({ x: ex, y: ey });

  return {
    x: ex,
    y: ey,
    iod,
    roll,
    noseOffX: noseOff.x,
    noseOffY: noseOff.y,
    mouthOffX: mouthOff.x,
    chinRatio: chinOff.y,
    mouthRatio: mouthOff.y,
    eyeOffY: eyeballCentre.y,
  };
}

/**
 * Turns raw measurements into the smoothed pose the renderer wants, in stage pixels.
 */
export class HeadPose {
  constructor() {
    this.fx = new LowPass();
    this.fy = new LowPass();
    this.fi = new LowPass();
    this.fr = new LowPass();
    this.fyaw = new LowPass();
    this.fpitch = new LowPass();
    this.baseline = null;
    this.last = 0;
    this.missing = 0;
    this.pose = { x: 0, y: 0, iod: 0, yaw: 0, pitch: 0, roll: 0, hasFace: false };
  }

  reset() {
    [this.fx, this.fy, this.fi, this.fr, this.fyaw, this.fpitch].forEach((f) => f.reset());
    this.baseline = null;
    this.missing = 0;
    this.pose.hasFace = false;
  }

  /**
   * @param {object|null} m raw measurement or null when no face was found
   * @param {number} now performance.now()
   * @param {{videoW:number, videoH:number, stageW:number, stageH:number}} view
   */
  update(m, now, view) {
    const dt = this.last ? clamp((now - this.last) / 1000, 1 / 120, 0.25) : 1 / 30;
    this.last = now;

    if (!m) {
      this.missing++;
      if (this.missing > 12) this.pose.hasFace = false;
      return this.pose;
    }
    this.missing = 0;

    if (!this.baseline) {
      this.baseline = { chin: m.chinRatio, mouth: m.mouthRatio };
    } else {
      // very slow adaptation keeps the neutral pose calibrated per person
      this.baseline.chin += (m.chinRatio - this.baseline.chin) * 0.006;
      this.baseline.mouth += (m.mouthRatio - this.baseline.mouth) * 0.006;
    }

    // Signs, once, in one place — the picture is mirrored before it reaches the screen,
    // so a nose that drifts to the right of the raw frame has to turn the model to the
    // left. Getting this backwards made the skull stare away from the face it sits on.
    // Pitch: chin approaching the eyes means the head is tilting down, which is a
    // positive rotation about X for a model whose front is +Z.
    const yawRaw = clamp(-2.3 * m.noseOffX, -0.95, 0.95);
    const pitchRaw = clamp(
      -(1.15 * (m.chinRatio - this.baseline.chin) + 0.6 * (m.mouthRatio - this.baseline.mouth)),
      -0.6,
      0.6,
    );

    const iod = this.fi.filter(m.iod, dt, 0.9, 0.05);
    const vx = this.fx.filter(m.x, dt, 1.1, 0.03);
    const vy = this.fy.filter(m.y, dt, 1.1, 0.03);
    const roll = this.fr.filter(m.roll, dt, 1.2, 0.04);
    const yaw = this.fyaw.filter(yawRaw, dt, 0.8, 0.9);
    const pitch = this.fpitch.filter(pitchRaw, dt, 0.8, 0.9);

    const mapped = mapToStage(vx, vy, view);

    this.pose.x = mapped.x;
    this.pose.y = mapped.y;
    this.pose.iod = iod * mapped.scale;
    this.pose.roll = roll;
    this.pose.yaw = yaw;
    this.pose.pitch = pitch;
    this.pose.hasFace = true;
    return this.pose;
  }
}

/**
 * Mirrored video space -> stage space, matching `object-fit: cover`.
 * Returns the scale factor applied to distances.
 */
export function mapToStage(x, y, { videoW, videoH, stageW, stageH }) {
  if (!videoW || !videoH) return { x: stageW / 2, y: stageH / 2, scale: 1 };
  const scale = Math.max(stageW / videoW, stageH / videoH);
  const drawW = videoW * scale;
  const drawH = videoH * scale;
  const offsetX = (stageW - drawW) / 2;
  const offsetY = (stageH - drawH) / 2;
  const mirroredX = videoW - x;              // the video element is flipped with CSS
  return {
    x: offsetX + mirroredX * scale,
    y: offsetY + y * scale,
    scale,
  };
}
