/**
 * Sound effects — mix of real audio files + Web Audio API fallbacks
 *
 * Place files in client/public/sounds/:
 *   ambient-loop.mp3   — background music (loops)
 *   ui-click.mp3       — button click
 *   order-placed.mp3   — order submitted
 *   key-unlock.mp3     — key delivered
 *   rank-up.mp3        — rank/level up
 *   killfeed-pop.mp3   — kill feed new entry
 *   spin-tick.mp3      — spin wheel tick
 */

let ctx = null;
let enabled = true;

function getCtx() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
  }
  return ctx;
}

export function setSoundEnabled(val) {
  enabled = val;
  try { localStorage.setItem('sounds_enabled', val ? '1' : '0'); } catch {}
}

export function isSoundEnabled() {
  try { return localStorage.getItem('sounds_enabled') !== '0'; } catch { return true; }
}

// ── Audio file player (with Web Audio API fallback) ───────────────────────
function playFile(filename, volume = 1.0) {
  if (!isSoundEnabled()) return;
  try {
    const audio = new Audio(`/sounds/${filename}`);
    audio.volume = Math.min(1, Math.max(0, volume));
    audio.play().catch(() => {}); // silently ignore if file missing
  } catch {}
}

function playFallback(fn) {
  if (!isSoundEnabled()) return;
  try {
    const c = getCtx();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    fn(c);
  } catch {}
}

// ── UI Click ─────────────────────────────────────────────────────────────
export function playUiClick() {
  playFile('ui-click.mp3', 0.5);
}

// ── Cash Register / Order Placed ─────────────────────────────────────────
export function playCashRegister() {
  playFile('order-placed.mp3', 0.8);
}

// ── Key Delivered ─────────────────────────────────────────────────────────
export function playKeyDelivered() {
  playFile('key-unlock.mp3', 0.9);
}

// ── Level / Rank Up ───────────────────────────────────────────────────────
export function playLevelUp() {
  playFile('rank-up.mp3', 0.85);
}

// ── Kill Feed Pop ─────────────────────────────────────────────────────────
export function playKillFeedPop() {
  playFile('killfeed-pop.mp3', 0.35);
}

// ── Spin Wheel Tick ───────────────────────────────────────────────────────
// Returns a controller so SpinWheel can start/stop ticking
export function startSpinTick(onStop) {
  if (!isSoundEnabled()) return { stop: () => {} };
  let running = true;
  let interval = 80; // ms between ticks — starts fast
  let count = 0;
  const MAX_TICKS = 40;

  const tick = () => {
    if (!running) return;
    playFile('spin-tick.mp3', 0.4);
    count++;
    // Slow down gradually
    interval = 80 + Math.pow(count / MAX_TICKS, 2) * 600;
    if (count < MAX_TICKS) {
      setTimeout(tick, interval);
    } else {
      running = false;
      onStop?.();
    }
  };

  setTimeout(tick, 0);
  return {
    stop: () => { running = false; }
  };
}

// ── Notification pop ──────────────────────────────────────────────────────
export function playNotif() {
  // No dedicated file — use Web Audio API blip
  playFallback(c => {
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.setValueAtTime(1100, t + 0.08);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.start(t); osc.stop(t + 0.25);
  });
}

// ── Check-in click ────────────────────────────────────────────────────────
export function playCheckIn() {
  playFallback(c => {
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.1);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.start(t); osc.stop(t + 0.2);
  });
}

// ── Error buzz ────────────────────────────────────────────────────────────
export function playError() {
  playFallback(c => {
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.2);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.start(t); osc.stop(t + 0.2);
  });
}

// ── Background Ambient Music ──────────────────────────────────────────────
let bgAudio = null;

export function startBgSound() {
  if (bgAudio) return;
  try {
    bgAudio = new Audio('/sounds/ambient-loop.mp3');
    bgAudio.loop = true;
    bgAudio.volume = 0;
    bgAudio.play().catch(() => {});
    // Fade in to 18%
    let vol = 0;
    const fadeIn = setInterval(() => {
      vol = Math.min(vol + 0.01, 0.18);
      if (bgAudio) bgAudio.volume = vol;
      if (vol >= 0.18) clearInterval(fadeIn);
    }, 80);
  } catch {}
}

export function stopBgSound() {
  if (!bgAudio) return;
  const audio = bgAudio;
  bgAudio = null;
  let vol = audio.volume;
  const fadeOut = setInterval(() => {
    vol = Math.max(vol - 0.02, 0);
    audio.volume = vol;
    if (vol <= 0) {
      clearInterval(fadeOut);
      audio.pause();
      audio.currentTime = 0;
    }
  }, 60);
}

export function setBgVolume(vol) {
  if (bgAudio) bgAudio.volume = Math.max(0, Math.min(1, vol));
}

export function isBgSoundPlaying() {
  return !!bgAudio && !bgAudio.paused;
}
