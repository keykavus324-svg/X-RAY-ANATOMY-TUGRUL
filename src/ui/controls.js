/**
 * Binds the DOM panel to the app state.  Pure plumbing: it never touches WebGL, it
 * only reports intentions through the callbacks it is given.
 */
const $ = (id) => document.getElementById(id);

export function initControls({ state, onChange, actions, t }) {
  const layerBoxes = {
    skull: $('L_skull'), brain: $('L_brain'), muscles: $('L_muscles'), eyes: $('L_eyes'), neck: $('L_neck'),
    skeleton: $('L_skeleton'),
  };
  const viewButtons = Array.from(document.querySelectorAll('[data-view]'));
  const labelsBox = $('labels');
  const brightInput = $('bright');
  const realMeInput = $('realMe');
  const featherInput = $('feather');
  const revealSelect = $('reveal');
  const cutInput = $('cut');
  const cutRow = $('cutRow');
  const autoFitBox = $('autoFit');
  const fitSize = $('fitSize');
  const fitX = $('fitX');
  const fitY = $('fitY');
  const fitZ = $('fitZ');
  const showDataBox = $('showData');
  const dataEl = $('data');
  const styleButtons = Array.from(document.querySelectorAll('#style button'));
  const presetButtons = Array.from(document.querySelectorAll('[data-preset]'));
  const statusDot = $('statusDot');
  const statusText = $('statusText');

  const setStatus = (key, kind = 'idle') => {
    statusDot.dataset.state = kind;
    statusText.textContent = t(key);
    statusText.dataset.key = key;
  };

  /* ---------------------------------------------------------------- layers */
  const syncLayerBoxes = () => {
    for (const [layer, box] of Object.entries(layerBoxes)) {
      if (box) box.checked = !!state.layers[layer];
    }
    if (labelsBox) labelsBox.checked = !!state.labels;
    presetButtons.forEach((b) => {
      const preset = b.dataset.preset;
      const L = state.layers;
      const only = (...keys) => {
        const want = new Set(keys);
        return ['skull', 'brain', 'muscles', 'eyes', 'neck', 'skeleton']
          .filter((k) => L[k]).every((k) => want.has(k)) && keys.every((k) => L[k]);
      };
      const match =
        preset === 'skull' ? only('skull', 'eyes')
        : preset === 'brain' ? only('brain')
        : preset === 'muscles' ? only('muscles')
        : preset === 'skeleton' ? only('skull', 'neck', 'skeleton')
        : preset === 'head' ? only('skull', 'brain', 'eyes', 'neck')
        : preset === 'chest' ? only('skeleton', 'neck')
        : only('skull', 'brain', 'muscles', 'eyes', 'skeleton', 'neck');
      b.classList.toggle('on', !!match);
    });
    viewButtons.forEach((b) => b.classList.toggle('on', b.dataset.view === state.view));
  };

  for (const [layer, box] of Object.entries(layerBoxes)) {
    box?.addEventListener('change', () => {
      state.layers[layer] = box.checked;
      syncLayerBoxes();
      onChange({ type: 'layers' });
    });
  }
  labelsBox?.addEventListener('change', () => {
    state.labels = labelsBox.checked;
    onChange({ type: 'labels' });
  });
  presetButtons.forEach((b) => {
    b.addEventListener('click', () => {
      const p = b.dataset.preset;
      const base = { skull: false, brain: false, muscles: false, eyes: false, neck: false, skeleton: false };
      state.layers = p === 'all'
        ? { ...base, skull: true, brain: true, muscles: true, eyes: true, skeleton: true, neck: true }
        : p === 'skull' ? { ...base, skull: true, eyes: true }
        : p === 'brain' ? { ...base, brain: true }
        : p === 'muscles' ? { ...base, muscles: true }
        : p === 'head' ? { ...base, skull: true, brain: true, eyes: true, neck: true }
        : p === 'chest' ? { ...base, skeleton: true, neck: true }
        : { ...base, skull: true, neck: true, skeleton: true };   // skeleton
      syncLayerBoxes();
      onChange({ type: 'layers' });
    });
  });

  /* ------------------------------------------------------------------ look */
  styleButtons.forEach((b) => {
    b.addEventListener('click', () => {
      state.look = b.dataset.style;
      syncStyle();
      onChange({ type: 'look' });
    });
  });
  const syncStyle = () => {
    styleButtons.forEach((b) => b.classList.toggle('on', b.dataset.style === state.look));
    if (brightInput) brightInput.value = String(state.brightness);
  };

  brightInput?.addEventListener('input', () => {
    state.brightness = Number(brightInput.value);
    onChange({ type: 'brightness' });
  });

  /* -------------------------------------------------------------- reality */
  realMeInput?.addEventListener('input', () => {
    state.realMe = Number(realMeInput.value);
    onChange({ type: 'realMe' });
  });
  featherInput?.addEventListener('input', () => {
    state.feather = Number(featherInput.value);
    onChange({ type: 'feather' });
  });
  revealSelect?.addEventListener('change', () => {
    state.reveal = revealSelect.value;
    syncCutRow();
    onChange({ type: 'reveal' });
  });
  cutInput?.addEventListener('input', () => {
    state.cut = Number(cutInput.value);
    onChange({ type: 'cut' });
  });
  const syncCutRow = () => {
    if (cutRow) cutRow.style.display = state.reveal === 'lens' || state.reveal === 'whole' ? 'none' : '';
  };

  /* ------------------------------------------------------------- body view */
  viewButtons.forEach((b) => {
    b.addEventListener('click', () => {
      state.view = b.dataset.view;
      viewButtons.forEach((x) => x.classList.toggle('on', x === b));
      onChange({ type: 'view' });
    });
  });

  /* ------------------------------------------------------------------- fit */
  autoFitBox?.addEventListener('change', () => {
    state.autoFit = autoFitBox.checked;
    onChange({ type: 'fit' });
  });
  const fitInputs = [['scale', fitSize], ['dx', fitX], ['dy', fitY], ['dz', fitZ]];
  fitInputs.forEach(([key, el]) => {
    el?.addEventListener('input', () => {
      state.fit[key] = Number(el.value);
      onChange({ type: 'fit' });
    });
  });
  $('fitReset')?.addEventListener('click', () => {
    state.fit = { scale: 0.94, dx: 0, dy: 0, dz: 0 };
    state.autoFit = true;
    syncFit();
    onChange({ type: 'fit' });
  });
  const syncFit = () => {
    if (autoFitBox) autoFitBox.checked = state.autoFit;
    if (fitSize) fitSize.value = String(state.fit.scale);
    if (fitX) fitX.value = String(state.fit.dx);
    if (fitY) fitY.value = String(state.fit.dy);
    if (fitZ) fitZ.value = String(state.fit.dz);
  };

  /* ------------------------------------------------------------------ data */
  showDataBox?.addEventListener('change', () => {
    state.showData = showDataBox.checked;
    if (dataEl) dataEl.hidden = !state.showData;
    onChange({ type: 'data' });
  });

  /* --------------------------------------------------------------- buttons */
  $('startBtn')?.addEventListener('click', () => actions.startCamera());
  $('startBtn2')?.addEventListener('click', () => actions.startCamera());
  $('camBtn')?.addEventListener('click', () => actions.toggleCamera());
  $('demoBtn')?.addEventListener('click', () => actions.demo());
  $('demoBtn2')?.addEventListener('click', () => actions.demo());
  $('snapBtn')?.addEventListener('click', () => actions.snapshot());
  $('fsBtn')?.addEventListener('click', () => actions.fullscreen());
  $('resetBtn')?.addEventListener('click', () => actions.reset());
  $('keysBtn')?.addEventListener('click', (e) => {
    const pop = $('keysPop');
    const open = pop.hidden;
    pop.hidden = !open;
    e.currentTarget.setAttribute('aria-expanded', String(open));
  });

  /* ------------------------------------------------------------------ sync */
  const sync = () => {
    syncLayerBoxes();
    syncStyle();
    syncFit();
    syncCutRow();
    if (realMeInput) realMeInput.value = String(state.realMe);
    if (featherInput) featherInput.value = String(state.feather);
    if (revealSelect) revealSelect.value = state.reveal;
    if (cutInput) cutInput.value = String(state.cut);
    if (showDataBox) showDataBox.checked = state.showData;
    if (dataEl) dataEl.hidden = !state.showData;
  };

  const setMeters = ({ fps, face, tris }) => {
    const f = $('fpsVal'); const fa = $('faceVal'); const tr = $('triVal');
    if (f && fps !== undefined) f.textContent = fps > 0 ? String(fps) : '—';
    if (fa && face !== undefined) fa.textContent = face ? (face === true ? '1' : String(face)) : '—';
    if (tr && tris !== undefined) tr.textContent = tris;
    const hudFps = $('hudFps');
    if (hudFps) hudFps.textContent = `${fps > 0 ? fps : '—'} FPS`;
  };

  const setTrackingData = (text) => {
    if (dataEl && state.showData) dataEl.textContent = text;
  };

  sync();
  return { sync, setStatus, setMeters, setTrackingData };
}
