// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Read aloud with the device's own voice (speechSynthesis, built into browsers). It helps kids who
// are still learning to read. We ship no audio: the device speaks the text at runtime.
// Voices that run on the device (localService) come first, so the text normally stays on the device.

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

function pickVoice() {
  const voices = synth?.getVoices() || [];
  const en = voices.filter((v) => /^en([-_]|$)/i.test(v.lang));
  const rank = (v) => (v.localService ? 0 : 2) + (/^en[-_](GB|US)/i.test(v.lang) ? 0 : 1);
  return en.sort((a, b) => rank(a) - rank(b))[0] || null;
}

export const voice = {
  available: Boolean(synth && typeof window.SpeechSynthesisUtterance === 'function'),

  speak(text) {
    if (!this.available || !text) return;
    try {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = pickVoice();
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-GB';
      u.rate = 0.95;
      u.pitch = 1.1;
      synth.speak(u);
    } catch { /* reading aloud is a bonus */ }
  },

  stop() {
    try { synth?.cancel(); } catch { /* ignore */ }
  },
};

// Some browsers load the voice list late.
synth?.addEventListener?.('voiceschanged', () => {});
