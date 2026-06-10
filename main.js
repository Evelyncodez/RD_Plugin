// ── Presets ──────────────────────────────────────────────
const PRESETS = {
  mazes:        { iter:6,  hp:6,  th:127, bl:9,  mo:0,  angle:0 },
  fingerprints: { iter:8,  hp:6,  th:127, bl:7,  mo:0,  angle:0 },
  spots:        { iter:5,  hp:4,  th:127, bl:12, mo:0,  angle:0 },
  coral:        { iter:10, hp:5,  th:127, bl:8,  mo:0,  angle:0 },
  waves:        { iter:12, hp:8,  th:127, bl:6,  mo:0,  angle:0 },
  worms:        { iter:7,  hp:6,  th:127, bl:10, mo:0,  angle:0 },
  turing:       { iter:9,  hp:5,  th:127, bl:8,  mo:0,  angle:0 },
  solitons:     { iter:14, hp:7,  th:127, bl:7,  mo:0,  angle:0 },
  chaos:        { iter:15, hp:4,  th:127, bl:5,  mo:0,  angle:0 },
  soft:         { iter:6,  hp:10, th:127, bl:20, mo:0,  angle:0 },
  directional:  { iter:6,  hp:6,  th:127, bl:9,  mo:70, angle:0 },
  directional_s:{ iter:6,  hp:6,  th:127, bl:6,  mo:14, angle:0 },
  spin:         { iter:6,  hp:6,  th:127, bl:9,  mo:0,  angle:45 },
  custom:       null,
};

// ── State ─────────────────────────────────────────────────
let colorMode  = 'bw';
let outputMode = 'new';
let stepMode   = false;  // true = step-by-step
let workLayerName = null; // tracks the working layer for step mode

// ── Elements ──────────────────────────────────────────────
const presetSel  = document.getElementById('preset-sel');
const slIter     = document.getElementById('sl-iter');
const slHp       = document.getElementById('sl-hp');
const slTh       = document.getElementById('sl-th');
const slBl       = document.getElementById('sl-bl');
const slMo       = document.getElementById('sl-mo');
const slAn       = document.getElementById('sl-an');
const slOp       = document.getElementById('sl-op');
const vIter      = document.getElementById('v-iter');
const vHp        = document.getElementById('v-hp');
const vTh        = document.getElementById('v-th');
const vBl        = document.getElementById('v-bl');
const vMo        = document.getElementById('v-mo');
const vAn        = document.getElementById('v-an');
const vOp        = document.getElementById('v-op');
const btnApply   = document.getElementById('btn-apply');
const btnStep    = document.getElementById('btn-step');
const btnReset   = document.getElementById('btn-reset-step');
const statusEl   = document.getElementById('status');
const tintSec    = document.getElementById('tint-section');
const opRow      = document.getElementById('op-row');
const colDark    = document.getElementById('col-dark');
const colLight   = document.getElementById('col-light');
const stepCtr    = document.getElementById('step-ctr');

// ── Sliders ───────────────────────────────────────────────
function bindSlider(sl, val, suffix) {
  sl.addEventListener('input', function() {
    val.textContent = this.value + (suffix || '');
    presetSel.value = 'custom';
  });
}
bindSlider(slIter, vIter, '');
bindSlider(slHp,   vHp,   '');
bindSlider(slTh,   vTh,   '');
bindSlider(slBl,   vBl,   '');
bindSlider(slMo,   vMo,   'px');
bindSlider(slAn,   vAn,   '°');
bindSlider(slOp,   vOp,   '%');

// ── Preset select ─────────────────────────────────────────
presetSel.addEventListener('change', function() {
  const p = PRESETS[this.value];
  if (!p) return;
  slIter.value = p.iter;  vIter.textContent = p.iter;
  slHp.value   = p.hp;    vHp.textContent   = p.hp;
  slTh.value   = p.th;    vTh.textContent   = p.th;
  slBl.value   = p.bl;    vBl.textContent   = p.bl;
  slMo.value   = p.mo;    vMo.textContent   = p.mo + 'px';
  slAn.value   = p.angle; vAn.textContent   = p.angle + '°';
});

// ── Color mode ────────────────────────────────────────────
document.getElementById('color-chips').addEventListener('click', function(e) {
  const b = e.target.closest('.chip');
  if (!b) return;
  colorMode = b.dataset.cm;
  document.querySelectorAll('#color-chips .chip').forEach(c => c.classList.toggle('on', c === b));
  tintSec.style.display = colorMode === 'tint' ? 'flex' : 'none';
  opRow.style.display   = colorMode === 'keep' ? 'flex' : 'none';
});

// ── Output mode ───────────────────────────────────────────
document.getElementById('out-chips').addEventListener('click', function(e) {
  const b = e.target.closest('.chip');
  if (!b) return;
  outputMode = b.dataset.out;
  document.querySelectorAll('#out-chips .chip').forEach(c => c.classList.toggle('on', c === b));
});

// ── Invert ────────────────────────────────────────────────
const chkInvert = document.getElementById('chk-invert');

// ── Status ────────────────────────────────────────────────
function setStatus(msg, color) {
  statusEl.textContent = msg;
  statusEl.style.color = color || '#555';
}

// ── Hex → PS RGB ──────────────────────────────────────────
function hexToRGB(hex) {
  return {
    red:   parseInt(hex.slice(1,3), 16),
    green: parseInt(hex.slice(3,5), 16),
    blue:  parseInt(hex.slice(5,7), 16),
  };
}

// ── One RD iteration ─────────────────────────────────────
async function runOneIteration(action, hp, th, bl, mo, angle) {
  await action.batchPlay([{
    _obj: 'highPass',
    radius: { _unit: 'pixel', _value: hp },
  }], { synchronousExecution: true });

  await action.batchPlay([{
    _obj: 'thresholdClassEvent',
    level: th,
  }], { synchronousExecution: true });

  if (mo > 0) {
    await action.batchPlay([{
      _obj: 'motionBlur',
      angle: angle,
      distance: { _unit: 'pixel', _value: mo },
    }], { synchronousExecution: true });
  }

  await action.batchPlay([{
    _obj: 'gaussianBlur',
    radius: { _unit: 'pixel', _value: bl },
  }], { synchronousExecution: true });
}

// ── Prepare working layer (duplicate + rasterize) ────────
async function prepareWorkLayer(action) {
  await action.batchPlay([{
    _obj: 'duplicate',
    _target: [{ _ref: 'layer', _enum: 'ordinal', _value: 'targetEnum' }],
  }], { synchronousExecution: true });

  await action.batchPlay([{
    _obj: 'rasterizeLayer',
    _target: [{ _ref: 'layer', _enum: 'ordinal', _value: 'targetEnum' }],
  }], { synchronousExecution: true });

  await action.batchPlay([{
    _obj: 'desaturate',
  }], { synchronousExecution: true });
}

// ── Apply color mode ──────────────────────────────────────
async function applyColorMode(action, app) {
  if (chkInvert.checked) {
    await action.batchPlay([{
      _obj: 'invert',
    }], { synchronousExecution: true });
  }

  if (colorMode === 'keep') {
    const opacity = parseInt(slOp.value);
    await action.batchPlay([{
      _obj: 'set',
      _target: [{ _ref: 'layer', _enum: 'ordinal', _value: 'targetEnum' }],
      to: {
        _obj: 'layer',
        mode: { _enum: 'blendMode', _value: 'multiply' },
        opacity: { _unit: 'percentUnit', _value: opacity },
      },
    }], { synchronousExecution: true });

  } else if (colorMode === 'tint') {
    const dark  = hexToRGB(colDark.value);
    const light = hexToRGB(colLight.value);
    await action.batchPlay([{
      _obj: 'make',
      _target: [{ _ref: 'adjustmentLayer' }],
      using: {
        _obj: 'adjustmentLayer',
        type: {
          _obj: 'gradientMap',
          gradient: {
            _obj: 'gradient',
            gradientForm: { _enum: 'gradientForm', _value: 'customStops' },
            interfaceIconFrameDimmed: 4096,
            colors: [
              { _obj: 'colorStop', color: { _obj: 'RGBColor', red: dark.red, green: dark.green, blue: dark.blue }, type: { _enum: 'colorStopType', _value: 'userStop' }, location: 0, midpoint: 50 },
              { _obj: 'colorStop', color: { _obj: 'RGBColor', red: light.red, green: light.green, blue: light.blue }, type: { _enum: 'colorStopType', _value: 'userStop' }, location: 4096, midpoint: 50 },
            ],
            transparency: [
              { _obj: 'transparencyStop', opacity: { _unit: 'percentUnit', _value: 100 }, location: 0, midpoint: 50 },
              { _obj: 'transparencyStop', opacity: { _unit: 'percentUnit', _value: 100 }, location: 4096, midpoint: 50 },
            ],
          },
        },
      },
    }], { synchronousExecution: true });

    await action.batchPlay([{
      _obj: 'groupEvent',
      _target: [{ _ref: 'layer', _enum: 'ordinal', _value: 'targetEnum' }],
    }], { synchronousExecution: true });
  }
}

// ── APPLY ALL ─────────────────────────────────────────────
btnApply.addEventListener('click', async function() {
  btnApply.disabled = true;
  btnStep.disabled  = true;
  setStatus('Running...', '#e8832a');

  try {
    const ps     = require('photoshop');
    const app    = ps.app;
    const action = ps.action;

    if (!app.documents.length) {
      setStatus('No document open!', '#f87171');
      btnApply.disabled = false; btnStep.disabled = false; return;
    }

    const iter  = parseInt(slIter.value);
    const hp    = parseInt(slHp.value);
    const th    = parseInt(slTh.value);
    const bl    = parseInt(slBl.value);
    const mo    = parseInt(slMo.value);
    const angle = parseInt(slAn.value);

    await require('photoshop').core.executeAsModal(async () => {
      await prepareWorkLayer(action);

      for (let i = 0; i < iter; i++) {
        setStatus(`Step ${i + 1} / ${iter}...`, '#e8832a');
        await runOneIteration(action, hp, th, bl, mo, angle);
      }

      // Final threshold
      await action.batchPlay([{
        _obj: 'thresholdClassEvent', level: th,
      }], { synchronousExecution: true });

      await applyColorMode(action, app);

    }, { commandName: 'RD Studio — Apply' });

    // Reset step counter
    workLayerName = null;
    stepCtr.textContent = 'steps: 0';
    setStatus('Done ✓', '#4ade80');

  } catch(err) {
    console.error(err);
    setStatus('Error: ' + err.message, '#f87171');
  }

  btnApply.disabled = false;
  btnStep.disabled  = false;
});

// ── STEP (one iteration at a time) ───────────────────────
let currentSteps = 0;

btnStep.addEventListener('click', async function() {
  btnApply.disabled = true;
  btnStep.disabled  = true;
  setStatus('Step...', '#e8832a');

  try {
    const ps     = require('photoshop');
    const app    = ps.app;
    const action = ps.action;

    if (!app.documents.length) {
      setStatus('No document open!', '#f87171');
      btnApply.disabled = false; btnStep.disabled = false; return;
    }

    const hp    = parseInt(slHp.value);
    const th    = parseInt(slTh.value);
    const bl    = parseInt(slBl.value);
    const mo    = parseInt(slMo.value);
    const angle = parseInt(slAn.value);

    await require('photoshop').core.executeAsModal(async () => {

      // First step: duplicate + rasterize
      if (currentSteps === 0) {
        await prepareWorkLayer(action);
      }

      await runOneIteration(action, hp, th, bl, mo, angle);
      currentSteps++;

    }, { commandName: 'RD Studio — Step' });

    stepCtr.textContent = `steps: ${currentSteps}`;
    setStatus(`Step ${currentSteps} done`, '#4ade80');

  } catch(err) {
    console.error(err);
    setStatus('Error: ' + err.message, '#f87171');
  }

  btnApply.disabled = false;
  btnStep.disabled  = false;
});

// ── RESET STEP ────────────────────────────────────────────
btnReset.addEventListener('click', function() {
  currentSteps = 0;
  workLayerName = null;
  stepCtr.textContent = 'steps: 0';
  setStatus('Reset — select layer and step', '#555');
});
