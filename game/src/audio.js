// Lantern Keep — procedural sound effects via WebAudio. No audio files.
// All sounds are tiny oscillator envelopes, created on first user gesture.

let ctx = null;
let muted = false;

function ensureCtx() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function unlockAudio() {
  ensureCtx();
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function blip(freq, dur, type, vol, slideTo) {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
  gain.gain.setValueAtTime(vol || 0.08, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export const sfx = {
  shoot() { blip(660, 0.07, 'triangle', 0.035, 420); },
  frost() { blip(880, 0.12, 'sine', 0.04, 1200); },
  prism() { blip(320, 0.14, 'sawtooth', 0.03, 140); },
  kill() { blip(520, 0.09, 'square', 0.03, 180); },
  coin() { blip(990, 0.08, 'sine', 0.04, 1320); },
  place() { blip(392, 0.1, 'triangle', 0.06, 523); },
  upgrade() { blip(523, 0.1, 'triangle', 0.06, 784); blip(784, 0.12, 'triangle', 0.05, 1046); },
  deny() { blip(160, 0.12, 'square', 0.05, 110); },
  lanternHit() { blip(220, 0.25, 'sawtooth', 0.09, 70); },
  waveStart() { blip(330, 0.12, 'triangle', 0.07, 440); blip(440, 0.14, 'triangle', 0.06, 660); },
  waveClear() { blip(523, 0.12, 'triangle', 0.07, 659); blip(659, 0.12, 'triangle', 0.06, 784); blip(784, 0.18, 'triangle', 0.06, 1046); },
  victory() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => {
      setTimeout(() => blip(f, 0.22, 'triangle', 0.07), i * 130);
    });
  },
  defeat() {
    [392, 330, 262, 196].forEach((f, i) => {
      setTimeout(() => blip(f, 0.3, 'sawtooth', 0.06), i * 180);
    });
  },
};
