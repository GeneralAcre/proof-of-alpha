"use client";

// Synthesized sound effects via Web Audio API — no audio files required.
// Reads poa_sound_enabled from localStorage on init; call setSoundEnabled() to update.

let _ctx: AudioContext | null = null;
let _muted = false;

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!_ctx) {
    try { _ctx = new AudioContext(); } catch { return null; }
  }
  if (_ctx.state === "suspended") _ctx.resume().catch(() => {});
  return _ctx;
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  vol = 0.25,
  delay = 0,
): void {
  if (_muted) return;
  const ac = ctx();
  if (!ac) return;
  try {
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.value = freq;
    const t0 = ac.currentTime + delay;
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  } catch {}
}

// ── Initialise mute state from localStorage (call once on client) ─────────────
export function initSounds(): void {
  try {
    _muted = localStorage.getItem("poa_sound_enabled") === "false";
  } catch {}
}

export function setSoundEnabled(enabled: boolean): void {
  _muted = !enabled;
  try { localStorage.setItem("poa_sound_enabled", String(enabled)); } catch {}
}

export function isSoundEnabled(): boolean {
  try { return localStorage.getItem("poa_sound_enabled") !== "false"; } catch { return true; }
}

// ── Individual sound effects ──────────────────────────────────────────────────
export const sfx = {
  moveSelect: ()   => tone(523, 0.07, "square", 0.12),

  moveConfirm: ()  => {
    tone(440, 0.08, "square", 0.18);
    tone(660, 0.12, "square", 0.12, 0.08);
  },

  tax: ()   => tone(523, 0.12, "square", 0.15),
  fold: ()  => tone(220, 0.2,  "sine",   0.10),

  steal: () => {
    tone(330, 0.07, "sawtooth", 0.18);
    tone(494, 0.10, "sawtooth", 0.15, 0.07);
  },

  rob: () => {
    tone(220, 0.10, "sawtooth", 0.20);
    tone(165, 0.18, "sawtooth", 0.18, 0.10);
  },

  bluff: () => {
    tone(660, 0.10, "sine", 0.18);
    tone(880, 0.08, "sine", 0.10, 0.10);
  },

  counter: () => {
    tone(440, 0.05, "square", 0.20);
    tone(880, 0.12, "square", 0.15, 0.05);
  },

  nuke: () => {
    [0, 1, 2, 3, 4].forEach((i) =>
      tone(110 + i * 22, 0.22, "sawtooth", 0.35, i * 0.05),
    );
  },

  elimination: () => {
    tone(440, 0.10, "sine",   0.20);
    tone(370, 0.10, "sine",   0.18, 0.12);
    tone(220, 0.30, "sine",   0.25, 0.25);
  },

  roundWin: () => {
    [523, 659, 784, 1047].forEach((f, i) =>
      tone(f, 0.15, "sine", 0.28, i * 0.10),
    );
  },

  matchWin: () => {
    [523, 659, 784, 1047, 1319, 1047, 784].forEach((f, i) =>
      tone(f, 0.18, "sine", 0.32, i * 0.12),
    );
  },

  matchLoss: () => {
    [440, 392, 349, 262].forEach((f, i) =>
      tone(f, 0.22, "sine", 0.20, i * 0.16),
    );
  },

  rankUp: () => {
    [440, 554, 659, 880, 1108].forEach((f, i) =>
      tone(f, 0.20, "sine", 0.30, i * 0.14),
    );
  },

  unlock: () => {
    [523, 784, 1047].forEach((f, i) =>
      tone(f, 0.18, "sine", 0.28, i * 0.10),
    );
  },
};
