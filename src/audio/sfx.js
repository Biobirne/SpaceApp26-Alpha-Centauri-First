// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Sound effects made live in the browser with the Web Audio API: oscillators, a little noise and
// short envelopes. No sound files, so nothing to download and no license to track.
// Kids-ux rules: quiet by default, nothing harsh, every sound has a visual twin, and audio only
// starts after the first tap (browsers require that anyway).

const NOTE = (n) => 440 * 2 ** ((n - 69) / 12); // MIDI note → Hz

export function createSfx({ enabled = true } = {}) {
  let ctx = null;
  let master = null;
  let on = enabled;
  let lastPlay = {};

  /** Create the audio context on the first tap (autoplay rules). */
  function unlock() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.32;
      // A gentle low-pass keeps every effect soft, even on phone speakers.
      const soft = ctx.createBiquadFilter();
      soft.type = 'lowpass';
      soft.frequency.value = 5200;
      master.connect(soft).connect(ctx.destination);
    } catch { ctx = null; }
  }

  function tone(freq, { at = 0, dur = 0.12, type = 'sine', vol = 0.5, slideTo = null, attack = 0.008 } = {}) {
    const t0 = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise({ at = 0, dur = 0.4, vol = 0.25, from = 3000, to = 600 } = {}) {
    const t0 = ctx.currentTime + at;
    const len = Math.ceil(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(from, t0);
    bp.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(bp).connect(g).connect(master);
    src.start(t0);
  }

  const SOUNDS = {
    tap: () => tone(NOTE(84), { dur: 0.05, vol: 0.18, type: 'triangle' }),
    // A problem appeared: two soft "boop" notes going down, plus a short hiss.
    alert: () => {
      tone(NOTE(76), { dur: 0.16, type: 'triangle', vol: 0.45 });
      tone(NOTE(71), { at: 0.17, dur: 0.22, type: 'triangle', vol: 0.45 });
      noise({ at: 0.05, dur: 0.45, vol: 0.12, from: 4500, to: 1800 });
    },
    // Fixed: a happy rising chord.
    fixed: () => [72, 76, 79, 84].forEach((n, i) => tone(NOTE(n), { at: i * 0.07, dur: 0.22, vol: 0.32 })),
    // A choice card: a calm two-note chime.
    card: () => { tone(NOTE(81), { dur: 0.5, vol: 0.28 }); tone(NOTE(88), { at: 0.12, dur: 0.6, vol: 0.2 }); },
    // Solar flare: a slow, warm swell (no scary siren).
    flare: () => { noise({ dur: 1.2, vol: 0.18, from: 400, to: 2600 }); tone(NOTE(55), { dur: 1.1, vol: 0.2, attack: 0.4, type: 'sine' }); },
    // Something ran out: three notes going down, gently.
    setback: () => [67, 64, 60].forEach((n, i) => tone(NOTE(n), { at: i * 0.14, dur: 0.24, type: 'triangle', vol: 0.32 })),
    warn: () => { tone(NOTE(69), { dur: 0.12, type: 'triangle', vol: 0.3 }); tone(NOTE(69), { at: 0.2, dur: 0.12, type: 'triangle', vol: 0.3 }); },
    upgrade: () => [67, 72, 76, 79, 84].forEach((n, i) => tone(NOTE(n), { at: i * 0.06, dur: 0.3, vol: 0.28 })),
    // Mission Control answers: a little radio blip.
    radio: () => { tone(NOTE(90), { dur: 0.06, type: 'square', vol: 0.08 }); tone(NOTE(86), { at: 0.08, dur: 0.06, type: 'square', vol: 0.08 }); },
    star: () => [79, 84, 88, 91].forEach((n, i) => tone(NOTE(n), { at: i * 0.09, dur: 0.35, vol: 0.25 })),
    fun: () => { tone(NOTE(84), { dur: 0.1, vol: 0.22, slideTo: NOTE(91) }); },
  };

  return {
    unlock,
    get on() { return on; },
    set(value) { on = value; if (on) unlock(); },
    play(name) {
      if (!on || !ctx || ctx.state !== 'running' || !SOUNDS[name]) return;
      // The same sound twice within 120 ms is noise, not information.
      const now = performance.now();
      if (now - (lastPlay[name] || 0) < 120) return;
      lastPlay[name] = now;
      try { SOUNDS[name](); } catch { /* audio is a bonus, never a crash */ }
    },
  };
}
