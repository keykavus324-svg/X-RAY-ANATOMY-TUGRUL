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
    this.missSince = 0;
  }

  async load(onProgress) {
    this.faceapi = await loadFaceApi(onProgress);
    const opts = this.faceapi.TinyFaceDetectorOptions || this.faceapi.tinyFaceDetector.TinyFaceDetectorOptions;
    // A bigger input plus a lower score gate finds faces in dim light and at arm's
    // length; the old 320 / 0.32 pair regularly lost the face on a phone camera.
    this.options = new opts({ inputSize: 416, scoreThreshold: 0.26 });
    // one heavier pass, only used once the cheap pass has been blind for a while
    this.wideOptions = new opts({ inputSize: 512, scoreThreshold: 0.18 });
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
    const blindFor = this.missSince ? now - this.missSince : 0;
    try {
      result = await this.faceapi
        .detectSingleFace(video, blindFor > 1200 ? this.wideOptions : this.options)
        .withFaceLandmarks();
      if (!result && blindFor > 1200) {
        // second chance on the cheap settings in the same tick
        result = await this.faceapi
          .detectSingleFace(video, this.options)
          .withFaceLandmarks();
      }
    } catch {
      return null;
    }
    if (!result) {
      this.lostFrames++;
      if (!this.missSince) this.missSince = now;
      return null;
    }
    this.lostFrames = 0;
    this.missSince = 0;
    return result.landmarks;
  }

  dispose() {
    this.ready = false;
  }
}
