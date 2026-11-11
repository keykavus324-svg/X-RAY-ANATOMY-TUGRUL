/**
 * Face tracking, loaded lazily so the landing page stays light.
 * Everything runs locally: the model weights are served from this repository and the
 * inference happens in the browser (TensorFlow.js WebGL backend).
 */

const MODEL_DIR = './vendor/face-api/models/';

let apiPromise = null;

async function loadFaceApi(onProgress) {
  if (!apiPromise) {
    apiPromise = (async () => {
      onProgress?.('script');
      const mod = await import('../../vendor/face-api/face-api.esm.js');
      const faceapi = mod.default && mod.default.nets ? mod.default : mod;
      const tf = faceapi.tf;
      if (tf) {
        try { await tf.setBackend('webgl'); } catch { /* wasm / cpu fallback */ }
        try { await tf.ready(); } catch { /* ignore */ }
      }
      onProgress?.('weights');
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_DIR);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_DIR);
      return faceapi;
    })().catch((err) => {
      apiPromise = null;
      throw err;
    });
  }
  return apiPromise;
}

export class FaceTracker {
  constructor() {
    this.faceapi = null;
    this.options = null;
    this.ready = false;
    this.lastRun = 0;
    this.minInterval = 1000 / 24;
    this.lostFrames = 0;
  }

  async load(onProgress) {
    this.faceapi = await loadFaceApi(onProgress);
    const opts = this.faceapi.TinyFaceDetectorOptions || this.faceapi.tinyFaceDetector.TinyFaceDetectorOptions;
    this.options = new opts({ inputSize: 320, scoreThreshold: 0.32 });
    this.ready = true;
    return this;
  }

  /** Returns landmark measurements for the most prominent face, or null. */
  async detect(video, now) {
    if (!this.ready || !video || video.readyState < 2) return null;
    if (now - this.lastRun < this.minInterval) return undefined; // caller keeps the last result
    this.lastRun = now;
    if (!video.videoWidth) return null;

    let result = null;
    try {
      result = await this.faceapi
        .detectSingleFace(video, this.options)
        .withFaceLandmarks();
    } catch {
      return null;
    }
    if (!result) { this.lostFrames++; return null; }
    this.lostFrames = 0;
    return result.landmarks;
  }

  dispose() {
    this.ready = false;
  }
}
