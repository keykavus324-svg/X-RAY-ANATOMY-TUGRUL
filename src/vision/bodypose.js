/**
 * Whole-body tracking (MediaPipe BlazePose, vendored — no CDN, nothing leaves the
 * device).  33 landmarks give shoulders, elbows, wrists, hips, knees and ankles, which
 * is exactly what the mirror needs: enough to sit the life-size skeleton on the real
 * body even when the face is out of frame, and enough to hang the hand bones off a
 * raised wrist.
 *
 * The solution is a classic script (not an ES module), so it is injected on demand and
 * read back from `window.Pose`.  Every failure is non-fatal: the head tracker keeps
 * working on its own.
 */

import { mapToStage } from './pose.js';

const POSE_DIR = './vendor/mediapipe/pose/';

/** MediaPipe BlazePose landmark indices we care about. */
export const LM = {
  nose: 0,
  lShoulder: 11,
  rShoulder: 12,
  lElbow: 13,
  rElbow: 14,
  lWrist: 15,
  rWrist: 16,
  lPinky: 17,
  rPinky: 18,
  lIndex: 19,
  rIndex: 20,
  lHip: 23,
  rHip: 24,
};

/** Clavicle span of the model, in model units (1 unit = one inter-ocular distance). */
export const MODEL_SHOULDER_WIDTH = 5.36;
/** Height of that shoulder line above the model origin (the eye midpoint). */
export const MODEL_SHOULDER_Y = -3.19;

let scriptPromise = null;

function loadScript() {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = `${POSE_DIR}pose.js`;
    el.async = true;
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve();
    el.onerror = () => {
      scriptPromise = null;
      reject(new Error('pose.js yüklenemedi'));
    };
    document.head.appendChild(el);
  });
  return scriptPromise;
}

const seen = (p, min = 0.35) => !!p && (p.visibility === undefined || p.visibility >= min);

export class BodyPose {
  constructor() {
    this.ready = false;
    this.last = 0;
    this.latest = null;
    this.minInterval = 1000 / 16;   // 16 fps is plenty for a body, and leaves the GPU to the renderer
  }

  async load() {
    await loadScript();
    const Pose = globalThis.Pose;
    if (!Pose) throw new Error('Pose çözümü bulunamadı');
    const pose = new Pose({ locateFile: (file) => `${POSE_DIR}${file}` });
    pose.setOptions({
      modelComplexity: 0,            // the lite landmark model we ship
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.45,
      selfieMode: false,             // the mirroring is ours to undo, not MediaPipe's
    });
    pose.onResults((results) => { this.latest = results; });
    // Not awaited: `send()` initialises internally, and a slow first frame must not
    // hold the camera UI hostage.
    if (typeof pose.initialize === 'function') pose.initialize().catch(() => {});
    this.pose = pose;
    this.ready = true;
    return this;
  }

  /** Returns 33 landmarks, `null` when nobody was found, `undefined` when throttled. */
  async detect(video, now) {
    if (!this.ready || !video || video.readyState < 2 || !video.videoWidth) return null;
    if (now - this.last < this.minInterval) return undefined;
    this.last = now;
    this.latest = null;
    try {
      await this.pose.send({ image: video });
    } catch {
      return null;
    }
    return this.latest?.poseLandmarks || null;
  }

  dispose() {
    this.ready = false;
    this.pose = null;
  }
}

/**
 * Turns landmarks into a stage-space anchor for the body and a list of raised hands.
 *
 * @returns {null | {x:number, y:number, width:number, hands:Array<{side:'l'|'r', x:number, y:number, dx:number, dy:number}>}}
 *          `x`/`y` are the shoulder midline in stage pixels, `width` the shoulder span.
 */
export function bodyAnchor(landmarks, view) {
  if (!landmarks || landmarks.length < 25) return null;
  const lS = landmarks[LM.lShoulder];
  const rS = landmarks[LM.rShoulder];
  if (!seen(lS) || !seen(rS)) return null;

  const toStage = (p) => mapToStage(p.x * view.videoW, p.y * view.videoH, view);
  const a = toStage(lS);
  const b = toStage(rS);
  const width = Math.hypot(a.x - b.x, a.y - b.y);
  if (!(width > 10)) return null;

  const hands = [];
  for (const [wrist, pinky, index, side] of [
    [LM.lWrist, LM.lPinky, LM.lIndex, 'l'],
    [LM.rWrist, LM.rPinky, LM.rIndex, 'r'],
  ]) {
    const w = landmarks[wrist];
    if (!seen(w, 0.3)) continue;
    const p = toStage(w);
    const k1 = seen(landmarks[pinky]) ? toStage(landmarks[pinky]) : null;
    const k2 = seen(landmarks[index]) ? toStage(landmarks[index]) : null;
    // fingers point from the wrist towards the knuckles; without knuckles, straight down
    let dx = 0;
    let dy = 1;
    if (k1 && k2) { dx = (k1.x + k2.x) / 2 - p.x; dy = (k1.y + k2.y) / 2 - p.y; }
    const len = Math.hypot(dx, dy) || 1;
    hands.push({ side, x: p.x, y: p.y, dx: dx / len, dy: dy / len });
  }

  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, width, hands };
}
