// audio.js — every sound is synthesized with WebAudio; no audio files.
// Footsteps are panned by relative x and quieted by distance, so you can
// hear where a guard is without looking at it.
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.ambientNodes = null;
    this.enabled = true;
    this.noiseSeed = 1234567;
  }

  // Call from the first user gesture; browsers block audio before one.
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return true;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.startAmbient();
      return true;
    } catch (err) {
      this.ctx = null;
      return false;
    }
  }

  panner(pan) {
    if (!this.ctx) return null;
    try {
      const node = this.ctx.createStereoPanner();
      node.pan.value = Math.max(-1, Math.min(1, pan));
      node.connect(this.master);
      return node;
    } catch (err) {
      return this.master;
    }
  }

  tone(freq, dur, type, vol, when = 0, pan = 0, slideTo = null) {
    if (!this.ctx || !this.enabled) return;
    const t0 = this.ctx.currentTime + when;
    const out = this.panner(pan);
    if (!out) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(out);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  noiseBurst(dur, vol, pan, lowpass = 1200) {
    if (!this.ctx || !this.enabled) return;
    const t0 = this.ctx.currentTime;
    const out = this.panner(pan);
    if (!out) return;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Deterministic noise: a tiny LCG, not Math.random — gameplay stays seeded.
    let s = (this.noiseSeed = (this.noiseSeed * 1664525 + 1013904223) >>> 0);
    for (let i = 0; i < len; i += 1) {
      s = (s * 1664525 + 1013904223) >>> 0;
      data[i] = (s / 4294967296) * 2 - 1;
      data[i] *= 1 - i / len;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = this.ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    src.start(t0);
  }

  // A soft tap: the player's own step, quiet and close.
  playerStep(sneaking) {
    this.noiseBurst(0.05, sneaking ? 0.05 : 0.12, 0, sneaking ? 700 : 1000);
  }

  // A guard's step, panned and faded by where it stands relative to Moth.
  guardStep(dx, dy) {
    const dist = Math.hypot(dx, dy);
    if (dist > 520) return;
    const vol = 0.22 * (1 - dist / 520);
    const pan = Math.max(-1, Math.min(1, dx / 420));
    this.noiseBurst(0.06, vol, pan, 800);
  }

  // Suspicious blip when a guard's meter crosses the "?" line.
  suspiciousBlip() {
    this.tone(660, 0.12, 'sine', 0.16, 0, 0, 880);
  }

  // Alert sting: a rising two-tone when a guard hits full alarm.
  alertSting() {
    this.tone(392, 0.16, 'square', 0.14, 0, 0);
    this.tone(587, 0.28, 'square', 0.16, 0.15, 0, 740);
  }

  // Pickup chime: a short rising arpeggio for a relic.
  pickupChime() {
    this.tone(523, 0.12, 'sine', 0.18, 0);
    this.tone(659, 0.12, 'sine', 0.18, 0.09);
    this.tone(784, 0.22, 'sine', 0.2, 0.18);
  }

  // Level-clear fanfare.
  fanfare() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.2, i * 0.11));
  }

  // Caught: a low falling sting.
  caughtSting() {
    this.tone(220, 0.5, 'sawtooth', 0.16, 0, 0, 110);
    this.tone(165, 0.6, 'sawtooth', 0.12, 0.08, 0, 82);
  }

  // Win jingle for the clean getaway.
  winJingle() {
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.2, i * 0.12));
  }

  // Quiet night hum under everything: a low oscillator breathing slowly.
  startAmbient() {
    if (!this.ctx || this.ambientNodes) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 55;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.035;
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.12;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.015;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start();
    lfo.start();
    this.ambientNodes = { osc, lfo };
  }
}
