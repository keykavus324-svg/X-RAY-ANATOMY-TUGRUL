/** Webcam wrapper with friendly error codes. */
export class CameraError extends Error {
  constructor(code, message) {
    super(message || code);
    this.code = code;
  }
}

export class CameraFeed {
  constructor(video) {
    this.video = video;
    this.stream = null;
    this.running = false;
  }

  get width() {
    return this.video.videoWidth || 0;
  }

  get height() {
    return this.video.videoHeight || 0;
  }

  async start() {
    if (this.running) return this.stream;
    if (!window.isSecureContext) throw new CameraError('insecure');
    if (!navigator.mediaDevices?.getUserMedia) throw new CameraError('unsupported');

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: false,
      });
    } catch (err) {
      const name = err?.name || '';
      if (name === 'NotAllowedError' || name === 'SecurityError') throw new CameraError('denied');
      if (name === 'NotFoundError' || name === 'OverconstrainedError') throw new CameraError('notfound');
      if (name === 'NotReadableError' || name === 'AbortError') throw new CameraError('busy');
      throw new CameraError('error', err?.message);
    }

    this.stream = stream;
    const video = this.video;
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    try {
      await video.play();
    } catch {
      /* autoplay can be refused until a gesture; the caller retries */
    }
    await this._waitForFrame();
    this.running = true;
    return stream;
  }

  _waitForFrame(timeout = 4000) {
    return new Promise((resolve) => {
      const video = this.video;
      if (video.videoWidth > 0 && video.readyState >= 2) return resolve();
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        video.removeEventListener('loadedmetadata', finish);
        video.removeEventListener('resize', finish);
        resolve();
      };
      video.addEventListener('loadedmetadata', finish, { once: true });
      video.addEventListener('resize', finish, { once: true });
      const t = setInterval(() => {
        if (video.videoWidth > 0) { clearInterval(t); finish(); }
      }, 60);
      setTimeout(() => { clearInterval(t); finish(); }, timeout);
    });
  }

  stop() {
    if (this.stream) {
      for (const track of this.stream.getTracks()) track.stop();
      this.stream = null;
    }
    if (this.video.srcObject) this.video.srcObject = null;
    this.running = false;
  }
}
