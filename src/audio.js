// =============================================================================
// Procedural audio for S.T.A.R. Earthquake Rescue Lab
// -----------------------------------------------------------------------------
// All sound is synthesized with the Web Audio API - no audio files, so it keeps
// the "procedural / no external assets" rule and works fully offline.
//   * startAmbient()  - looping low rumble + drone + random drips/creaks
//   * click/hover/open/correct/incorrect/submit() - UI + feedback cues
//   * toggleMute()    - master mute (persisted in localStorage)
// The AudioContext must be created from a user gesture, so call unlock() on the
// first click (we do this from the intro "Enter" button).
// =============================================================================

const MUTE_KEY = 'star-muted';

let ctx = null;
let master = null;
let muted = localStorage.getItem(MUTE_KEY) === 'true';
let ambientStarted = false;

export function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.85;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

export function isMuted() {
  return muted;
}

export function setMuted(m) {
  muted = m;
  localStorage.setItem(MUTE_KEY, String(m));
  if (master) master.gain.setTargetAtTime(m ? 0 : 0.85, ctx.currentTime, 0.05);
}

export function toggleMute() {
  setMuted(!muted);
  return muted;
}

// -----------------------------------------------------------------------------
// Synthesis helpers
// -----------------------------------------------------------------------------
function noiseBuffer(seconds = 3) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

// A short synthesized note.
function tone({ freq = 440, dur = 0.15, type = 'sine', gain = 0.18, slideTo = null, delay = 0 }) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

// A filtered noise burst (used for creaks / debris settling).
function noiseBurst({ dur = 0.4, freq = 600, q = 1, gain = 0.12, sweepTo = null }) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(dur + 0.1);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(freq, t0);
  bp.Q.value = q;
  if (sweepTo) bp.frequency.exponentialRampToValueAtTime(sweepTo, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(bp);
  bp.connect(g);
  g.connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

// -----------------------------------------------------------------------------
// Ambient bed
// -----------------------------------------------------------------------------
export function startAmbient() {
  if (!ctx || ambientStarted) return;
  ambientStarted = true;

  // Low rumble: looping noise through a lowpass, slowly modulated.
  const rumble = ctx.createBufferSource();
  rumble.buffer = noiseBuffer(4);
  rumble.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 105;
  const rg = ctx.createGain();
  rg.gain.value = 0.10;
  rumble.connect(lp);
  lp.connect(rg);
  rg.connect(master);
  rumble.start();

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.05;
  lfo.connect(lfoGain);
  lfoGain.connect(rg.gain);
  lfo.start();

  // Sub drone for tension.
  const drone = ctx.createOscillator();
  drone.type = 'sine';
  drone.frequency.value = 52;
  const dg = ctx.createGain();
  dg.gain.value = 0.035;
  drone.connect(dg);
  dg.connect(master);
  drone.start();

  scheduleAmbientEvents();
}

function scheduleAmbientEvents() {
  const next = 7000 + Math.random() * 12000;
  setTimeout(() => {
    if (ctx && !muted) {
      if (Math.random() < 0.5) drip();
      else creak();
    }
    scheduleAmbientEvents();
  }, next);
}

// -----------------------------------------------------------------------------
// Public one-shot cues
// -----------------------------------------------------------------------------
export function click() {
  tone({ freq: 330, dur: 0.06, type: 'square', gain: 0.10 });
}
export function hover() {
  tone({ freq: 880, dur: 0.04, type: 'sine', gain: 0.04 });
}
export function open() {
  tone({ freq: 520, slideTo: 700, dur: 0.14, type: 'triangle', gain: 0.12 });
}
export function close() {
  tone({ freq: 440, slideTo: 300, dur: 0.12, type: 'triangle', gain: 0.10 });
}
export function correct() {
  // Bright ascending arpeggio.
  [523.25, 659.25, 783.99].forEach((f, i) =>
    tone({ freq: f, dur: 0.18, type: 'sine', gain: 0.16, delay: i * 0.09 })
  );
}
export function incorrect() {
  tone({ freq: 180, slideTo: 110, dur: 0.32, type: 'sawtooth', gain: 0.14 });
}
export function submit() {
  // Short fanfare.
  [392, 523.25, 659.25, 783.99].forEach((f, i) =>
    tone({ freq: f, dur: 0.22, type: 'triangle', gain: 0.15, delay: i * 0.1 })
  );
}
export function unlocked() {
  [659.25, 987.77].forEach((f, i) =>
    tone({ freq: f, dur: 0.16, type: 'sine', gain: 0.14, delay: i * 0.1 })
  );
}
export function drip() {
  tone({ freq: 1400, slideTo: 420, dur: 0.16, type: 'sine', gain: 0.08 });
}
export function creak() {
  noiseBurst({ dur: 0.6, freq: 320, q: 6, gain: 0.07, sweepTo: 140 });
}
