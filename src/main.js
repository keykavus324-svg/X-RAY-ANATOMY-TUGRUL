import { loadAnatomy, LAYER_ORDER } from './gl/anatomy.js';
import { Stage } from './gl/stage.js';
import { Labels } from './gl/labels.js';
import { CameraFeed } from './vision/camera.js';
import { FaceTracker } from './vision/tracker.js';
import { HeadPose, measure } from './vision/pose.js';
import { STRUCTURES, LAYERS } from './data/structures.js';
import { applyI18n, autoLang, getLang, setLang, t } from './i18n.js';
import { initControls } from './ui/controls.js';
import { initExplorer } from './ui/explorer.js';

const $ = (id) => document.getElementById(id);
const STORE_KEY = 'xrm.prefs.v1';

/* ------------------------------------------------------------------ state */
const DEFAULTS = {
  layers: { skull: true, brain: true, muscles: false, eyes: true, neck: false },
  labels: true,
  look: 'xray',
  brightness: 1.15,
  realMe: 0.42,
  feather: 0.3,
  reveal: 'whole',
  cut: 0.55,
  autoFit: true,
  fit: { scale: 0.94, dx: 0, dy: 0, dz: 0 },
  showData: false,
};

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    return {
      ...DEFAULTS,
      ...raw,
      layers: { ...DEFAULTS.layers, ...(raw.layers || {}) },
      fit: { ...DEFAULTS.fit, ...(raw.fit || {}) },
    };
  } catch {
    return { ...DEFAULTS, layers: { ...DEFAULTS.layers }, fit: { ...DEFAULTS.fit } };
  }
}

const state = loadState();

let anatomy = null;
let stage = null;
let labels = null;
let camera = null;
let tracker = null;
let ui = null;
let explorer = null;
let headPose = null;
let mode = 'present';
let statusKey = 'status.idle';
let rafId = 0;
let lastT = 0;
let detecting = false;
let faceSeen = false;
let lostFrames = 0;
let saveTimer = 0;

const el = {
  stage: $('stage'),
  video: $('video'),
  gl: $('gl'),
  labelLayer: $('labelLayer'),
  intro: $('intro'),
  toasts: $('toasts'),
  data: $('data'),
};

/* ------------------------------------------------------------------ utils */
function toast(message, kind = '') {
  if (!el.toasts || !message) return;
  const node = document.createElement('div');
  node.className = `toast ${kind}`;
  node.textContent = message;
  el.toasts.appendChild(node);
  setTimeout(() => {
    node.style.transition = 'opacity .3s, transform .3s';
    node.style.opacity = '0';
    node.style.transform = 'translateY(-4px)';
    setTimeout(() => node.remove(), 320);
  }, 2600);
}

function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* private mode */ }
  }, 250);
}

function setStatus(key, kind) {
  statusKey = key;
  ui?.setStatus(key, kind ?? (kindOf(key)));
}

function kindOf(key) {
  if (key === 'status.live') return 'live';
  if (key === 'status.noface' || key === 'status.demo' || key === 'status.stopped') return 'loading';
  if (key.startsWith('status.error') || key === 'status.denied' || key === 'status.nocam'
    || key === 'status.insecure' || key === 'status.unsupported') return 'error';
  return 'idle';
}

const fmt = (n) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));

function hideIntro() {
  el.intro?.classList.add('hidden');
}

function showFatal(title, detail) {
  if (!el.intro) return;
  el.intro.classList.remove('hidden');
  el.intro.innerHTML = `
    <div class="intro-inner">
      <p class="intro-kicker">X-RAY MIRROR</p>
      <h2 style="font-size:26px;letter-spacing:.02em">${title}</h2>
      <p>${detail}</p>
      <div class="intro-actions">
        <button class="btn primary" type="button" id="retryBoot">${getLang() === 'tr' ? 'Yeniden dene' : 'Try again'}</button>
      </div>
    </div>`;
  $('retryBoot')?.addEventListener('click', () => window.location.reload());
}

/* ------------------------------------------------------------------- boot */
async function boot() {
  setLang(autoLang());
  bindLanguageButton();
  applyI18n();

  ui = initControls({
    state,
    t,
    onChange: handleChange,
    actions: {
      startCamera,
      toggleCamera: () => (camera?.running ? stopCamera() : startCamera()),
      demo,
      snapshot,
      fullscreen,
      reset,
    },
  });

  setStatus('status.loading3d', 'loading');

  try {
    anatomy = await loadAnatomy({
      base: './models/',
      onProgress: (p) => {
        const pct = Math.round(p * 100);
        ui.setStatus('status.loading3d');
        const el2 = $('statusText');
        if (el2) el2.textContent = `${t('status.loading3d')} ${pct}%`;
      },
    });
  } catch (err) {
    console.error(err);
    showFatal(
      getLang() === 'tr' ? 'Anatomi yüklenemedi' : 'Could not load the anatomy',
      getLang() === 'tr'
        ? 'models/anatomy.bin dosyasına ulaşılamadı. Sayfayı yenileyin; sorun sürerse tarayıcı konsoluna bakın.'
        : 'The file models/anatomy.bin could not be fetched. Reload the page; if it persists check the browser console.',
    );
    return;
  }

  try {
    stage = new Stage({ canvas: el.gl, host: el.stage, anatomy });
  } catch (err) {
    console.error(err);
    showFatal(
      getLang() === 'tr' ? 'WebGL başlatılamadı' : 'WebGL could not start',
      getLang() === 'tr'
        ? 'Tarayıcınızda donanım hızlandırma kapalı olabilir. Güncel bir tarayıcıda tekrar deneyin.'
        : 'Hardware acceleration may be disabled. Try again in an up-to-date browser.',
    );
    return;
  }

  labels = new Labels(el.labelLayer, el.stage);
  headPose = new HeadPose();

  applyAll();
  setStatus('status.idle');
  ui.setMeters({ fps: 0, face: false, tris: fmt(anatomy.triangles) });

  explorer = initExplorer({
    t,
    getLang,
    onHighlight: (id) => highlightStructure(id),
    onHover: () => {},
  });

  observeResize();
  startLoop();

  if (!window.WebGLRenderingContext) {
    setStatus('status.unsupported', 'error');
  }
}

function handleChange(change) {
  switch (change.type) {
    case 'layers':
      for (const layer of LAYER_ORDER) anatomy.setLayerVisible(layer, !!state.layers[layer]);
      break;
    case 'look':
      anatomy.setLook(state.look);
      break;
    case 'brightness':
      stage.setBrightness(state.brightness);
      break;
    case 'realMe':
      applyRealMe();
      break;
    case 'feather':
    case 'reveal':
    case 'cut':
      applyReveal();
      break;
    case 'fit':
      stage.setFit(state.fit);
      break;
    case 'labels':
      if (!state.labels) labels.clear();
      break;
    default:
      break;
  }
  persist();
}

function applyAll() {
  for (const layer of LAYER_ORDER) anatomy.setLayerVisible(layer, !!state.layers[layer]);
  anatomy.setLook(state.look);
  stage.setBrightness(state.brightness);
  stage.setFit(state.fit);
  applyRealMe();
  applyReveal();
  ui.sync();
}

function applyRealMe() {
  el.video?.style.setProperty('--video-opacity', String(state.realMe));
}

function applyReveal() {
  stage.setReveal({ mode: state.reveal, cut: state.cut, feather: state.feather });
  if (state.reveal === 'lens') {
    stage.lensRadiusPx = Math.max(70, Math.min(stage.width, stage.height) * 0.17);
    if (!stage.lens.active) stage.setLens(stage.width / 2, stage.height / 2, stage.lensRadiusPx, true);
  }
}

/* ------------------------------------------------------------------ loop */
function startLoop() {
  if (rafId) return;
  lastT = performance.now();
  let meterAt = 0;
  const tick = (now) => {
    rafId = requestAnimationFrame(tick);
    const dt = Math.min((now - lastT) / 1000, 0.1);
    lastT = now;
    if (!stage) return;

    if (mode === 'track' && tracker?.ready && camera?.running && !detecting) {
      detecting = true;
      const runAt = now;
      tracker
        .detect(el.video, now)
        .then((landmarks) => {
          if (landmarks === undefined) return;           // throttled, keep previous pose
          const metrics = landmarks ? measure(landmarks) : null;
          const pose = headPose.update(metrics, runAt, {
            videoW: camera.width,
            videoH: camera.height,
            stageW: stage.width,
            stageH: stage.height,
          });
          if (pose.hasFace) {
            if (!stage.pose.hasFace || !faceSeen) {
              faceSeen = true;
              setStatus('status.live', 'live');
            }
            lostFrames = 0;
            stage.setPose(pose);
          } else {
            lostFrames++;
            if (lostFrames === 30) setStatus('status.noface', 'loading');
          }
          if (state.showData) {
            ui.setTrackingData(
              `face ${metrics ? 'ok' : '—'}  iod ${pose.iod.toFixed(1)}px\n` +
              `x ${pose.x.toFixed(1)}  y ${pose.y.toFixed(1)}\n` +
              `yaw ${(pose.yaw * 57.3).toFixed(1)}°  pitch ${(pose.pitch * 57.3).toFixed(1)}°  roll ${(pose.roll * 57.3).toFixed(1)}°\n` +
              `video ${camera.width}×${camera.height}  stage ${stage.width}×${stage.height}\n` +
              `fps ${stage.fps}`,
            );
          }
        })
        .catch(() => {})
        .finally(() => { detecting = false; });
    }

    stage.frame(dt, now);
    drawLabels();

    if (now - meterAt > 500) {
      meterAt = now;
      ui.setMeters({
        fps: stage.fps,
        face: mode === 'track' ? (headPose?.pose.hasFace ? '1' : '0') : '—',
        tris: fmt(anatomy.triangles),
      });
    }
  };
  rafId = requestAnimationFrame(tick);
}

function drawLabels() {
  if (!labels || !stage) return;
  if (!state.labels) { labels.clear(); return; }
  const lang = getLang();
  const items = [];
  for (const s of STRUCTURES) {
    if (!state.layers[s.layer]) continue;
    const geo = anatomy.structureById.get(s.id);
    if (!geo || !geo.anchors?.length) continue;
    const names = s.labels ? s.labels[lang] : null;
    if (s.labels) {
      geo.anchors.forEach((a, i) => {
        const p = stage.project({ x: a[0], y: a[1], z: a[2] });
        if (!p.visible || p.x < 0 || p.x > stage.width || p.y < 0 || p.y > stage.height) return;
        items.push({ id: `${s.id}-${i}`, text: names[i] || names[0], x: p.x, y: p.y, color: LAYERS[s.layer].color });
      });
    } else {
      const a = geo.anchors[0];
      const p = stage.project({ x: a[0], y: a[1], z: a[2] });
      if (!p.visible || p.x < 0 || p.x > stage.width || p.y < 0 || p.y > stage.height) return;
      items.push({ id: s.id, text: s[lang].name, x: p.x, y: p.y, color: LAYERS[s.layer].color });
    }
  }
  labels.draw(items);
}

/* ---------------------------------------------------------------- camera */
async function startCamera() {
  if (!stage) return;
  hideIntro();
  setStatus('status.requesting', 'loading');
  camera = camera || new CameraFeed(el.video);

  try {
    await camera.start();
  } catch (err) {
    const code = err?.code || 'error';
    const key = code === 'denied' ? 'status.denied'
      : code === 'notfound' ? 'status.nocam'
      : code === 'insecure' ? 'status.insecure'
      : code === 'unsupported' ? 'status.unsupported'
      : 'status.error';
    setStatus(key, 'error');
    demo({ silent: true });
    toast(t(key), 'bad');
    return;
  }

  el.video.classList.add('ready');
  el.stage.classList.add('live');
  mode = 'track';
  stage.setMode('track');
  faceSeen = false;
  lostFrames = 0;
  headPose?.reset();

  setStatus('status.loading', 'loading');
  try {
    tracker = tracker || new FaceTracker();
    await tracker.load();
  } catch (err) {
    console.error(err);
    setStatus('status.error', 'error');
    toast(t('status.error'), 'bad');
    mode = 'present';
    stage.setMode('present');
    return;
  }

  setStatus('status.noface', 'live');
  ui.setMeters({ tris: fmt(anatomy.triangles) });
  toast(t('toast.camOn'), 'ok');
}

function stopCamera() {
  camera?.stop();
  el.video.classList.remove('ready');
  el.stage.classList.remove('live');
  mode = 'present';
  stage?.setMode('present');
  headPose?.reset();
  setStatus('status.stopped', 'loading');
  toast(t('toast.camOff'));
}

function demo({ silent } = {}) {
  hideIntro();
  if (camera?.running) stopCamera();
  mode = 'present';
  stage?.setMode('present');
  setStatus('status.demo');
  if (!silent) toast(t('status.demo'));
}

/* --------------------------------------------------------------- actions */
function highlightStructure(id) {
  if (!anatomy) return;
  const s = STRUCTURES.find((x) => x.id === id);
  if (!s) return;
  anatomy.setHighlight(id);
  // make sure the layer is on, otherwise nothing would be visible
  if (!state.layers[s.layer]) {
    state.layers[s.layer] = true;
    ui.sync();
    for (const layer of LAYER_ORDER) anatomy.setLayerVisible(layer, !!state.layers[layer]);
  }
  document.getElementById('app')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  toast(t('toast.highlight', { name: s[getLang()].name }), 'ok');
  setTimeout(() => anatomy?.setHighlight(null), 6000);
}

async function snapshot() {
  if (!stage) return;
  try {
    const gl = await stage.capture();
    const out = document.createElement('canvas');
    out.width = gl.width;
    out.height = gl.height;
    const ctx = out.getContext('2d');

    // background: the live video, mirrored and cropped like the stage
    if (camera?.running && el.video.videoWidth) {
      const vw = el.video.videoWidth;
      const vh = el.video.videoHeight;
      const scale = Math.max(out.width / vw, out.height / vh);
      const dw = vw * scale;
      const dh = vh * scale;
      ctx.save();
      ctx.translate(out.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(el.video, (out.width - dw) / 2, (out.height - dh) / 2, dw, dh);
      ctx.restore();
    } else {
      const g = ctx.createRadialGradient(out.width / 2, out.height * 0.42, 0, out.width / 2, out.height * 0.42, out.width * 0.7);
      g.addColorStop(0, '#101a2b');
      g.addColorStop(1, '#05070c');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, out.width, out.height);
    }

    ctx.drawImage(gl, 0, 0);
    ctx.drawImage(el.labelLayer, 0, 0);

    const pad = Math.round(out.width * 0.02);
    ctx.font = `${Math.round(out.width * 0.016)}px ui-monospace, monospace`;
    ctx.fillStyle = 'rgba(180,220,255,0.75)';
    ctx.fillText('X-RAY MIRROR · bodyparts3d / z-anatomy', pad, out.height - pad);

    out.toBlob((blob) => {
      if (!blob) { toast(t('toast.noSnap'), 'bad'); return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `x-ray-mirror-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast(t('toast.snapshot'), 'ok');
    }, 'image/png');
  } catch (err) {
    console.error(err);
    toast(t('toast.noSnap'), 'bad');
  }
}

function fullscreen() {
  const node = el.stage;
  if (!node) return;
  if (document.fullscreenElement) {
    document.exitFullscreen?.();
  } else if (node.requestFullscreen) {
    node.requestFullscreen().catch(() => toast(t('toast.fs'), 'bad'));
  }
}

function reset() {
  state.layers = { ...DEFAULTS.layers };
  state.look = DEFAULTS.look;
  state.brightness = DEFAULTS.brightness;
  state.realMe = DEFAULTS.realMe;
  state.feather = DEFAULTS.feather;
  state.reveal = DEFAULTS.reveal;
  state.cut = DEFAULTS.cut;
  state.autoFit = DEFAULTS.autoFit;
  state.fit = { ...DEFAULTS.fit };
  anatomy?.setHighlight(null);
  applyAll();
  persist();
}

/* ---------------------------------------------------------------- layout */
function observeResize() {
  const onChange = () => {
    stage?.resize();
    labels?.resize();
    if (state.reveal === 'lens') applyReveal();
  };
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => onChange());
    ro.observe(el.stage);
  }
  window.addEventListener('resize', onChange);
  window.addEventListener('orientationchange', () => setTimeout(onChange, 250));
}

/* -------------------------------------------------------------- language */
function bindLanguageButton() {
  const btn = $('langBtn');
  if (!btn) return;
  btn.textContent = getLang() === 'tr' ? 'EN' : 'TR';
  btn.addEventListener('click', () => {
    const next = getLang() === 'tr' ? 'en' : 'tr';
    setLang(next);
    try { localStorage.setItem('xrm.lang', next); } catch { /* ignore */ }
    btn.textContent = getLang() === 'tr' ? 'EN' : 'TR';
    applyI18n();
    ui?.setStatus(statusKey, kindOf(statusKey));
    explorer?.refresh();
    persist();
  });
}

/* --------------------------------------------------------------- keyboard */
function bindKeyboard() {
  window.addEventListener('keydown', (e) => {
    const tag = (e.target?.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
    const k = e.key.toLowerCase();
    const setLayer = (layer) => {
      state.layers[layer] = !state.layers[layer];
      anatomy?.setLayerVisible(layer, state.layers[layer]);
      ui?.sync();
      persist();
    };
    if (k === '1') setLayer('skull');
    else if (k === '2') setLayer('brain');
    else if (k === '3') setLayer('muscles');
    else if (k === '4') setLayer('eyes');
    else if (k === '5') setLayer('neck');
    else if (k === 'x') {
      state.look = state.look === 'xray' ? 'solid' : state.look === 'solid' ? 'wire' : 'xray';
      anatomy?.setLook(state.look);
      ui?.sync();
    } else if (k === 'l') {
      state.labels = !state.labels;
      ui?.sync();
      if (!state.labels) labels?.clear();
    } else if (k === 'v') {
      const modes = ['whole', 'left', 'right', 'top', 'bottom', 'lens'];
      state.reveal = modes[(modes.indexOf(state.reveal) + 1) % modes.length];
      ui?.sync();
      applyReveal();
    } else if (k === 'f') fullscreen();
    else if (k === 'r') reset();
    else if (k === '?' || k === '/') {
      const pop = $('keysPop');
      if (pop) pop.hidden = !pop.hidden;
    }
  });
}

/* ------------------------------------------------------------------- go */
window.addEventListener('error', (e) => {
  if (e?.message && /WebGL|shader/i.test(e.message)) toast(e.message.slice(0, 90), 'bad');
});
document.addEventListener('visibilitychange', () => { lastT = performance.now(); });

/* ------------------------------------------------------------------ debug */
/** `?debug=1` lists elements that cover more than half of the viewport. Handy when a
 *  browser paints something at the wrong size; it is inert in normal use. */
function inspectLayout() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const rows = [];
  for (const node of document.querySelectorAll('body *')) {
    const r = node.getBoundingClientRect();
    if (r.width * r.height < vw * vh * 0.5) continue;
    const id = node.id ? `#${node.id}` : '';
    const cls = typeof node.className === 'string' && node.className.trim()
      ? `.${node.className.trim().split(/\s+/).join('.')}` : '';
    rows.push(`${node.tagName.toLowerCase()}${id}${cls} ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  const box = document.createElement('pre');
  box.style.cssText = 'position:fixed;left:10px;bottom:10px;z-index:9999;max-width:70vw;max-height:40vh;'
    + 'overflow:auto;background:#000d;color:#9fe0ff;font:11px/1.45 ui-monospace,monospace;'
    + 'padding:10px 12px;border-radius:8px;white-space:pre-wrap;margin:0';
  const pseudo = ['.eyebrow .dot', '.ck input', '.nav a'];
  const extra = pseudo.map((sel) => {
    const node = document.querySelector(sel);
    if (!node) return '';
    const after = getComputedStyle(node, '::after');
    const before = getComputedStyle(node, '::before');
    const desc = (name, st) => (st.content && st.content !== 'none'
      ? `${name}{content:${st.content} pos:${st.position} inset:${st.top}/${st.right}/${st.bottom}/${st.left} bg:${st.backgroundColor}}`
      : '');
    return `\n${sel}: ${desc('::before', before)} ${desc('::after', after)}`.trimEnd();
  }).join('');
  box.textContent = `viewport ${vw}x${vh}\n${rows.slice(0, 14).join('\n') || 'no oversized elements'}${extra}`;
  document.body.appendChild(box);
}

if (new URLSearchParams(window.location.search).has('debug')) inspectLayout();

bindKeyboard();
boot().catch((err) => {
  console.error(err);
  showFatal(getLang() === 'tr' ? 'Beklenmeyen hata' : 'Unexpected error', String(err?.message || err));
});
