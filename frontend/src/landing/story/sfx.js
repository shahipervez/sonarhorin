// Tiny Web Audio sound design for the story (no audio files). Created only after a user gesture.
export class SFX {
  constructor() {
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.out = this.ctx.createGain();
    this.out.gain.value = 0.55;
    this.out.connect(this.ctx.destination);
    this.rainNode = null;
  }
  now(d = 0) { return this.ctx.currentTime + d; }
  tone(freq, dur = 0.25, type = "sine", vol = 0.2, when = 0, slide = null) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, this.now(when));
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, this.now(when + dur));
    g.gain.setValueAtTime(0.0001, this.now(when));
    g.gain.exponentialRampToValueAtTime(vol, this.now(when + 0.015));
    g.gain.exponentialRampToValueAtTime(0.0001, this.now(when + dur));
    o.connect(g); g.connect(this.out);
    o.start(this.now(when)); o.stop(this.now(when + dur + 0.05));
  }
  noiseBuffer(sec) {
    const b = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * sec), this.ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  noise(dur = 0.2, vol = 0.25, freq = 1200, when = 0) {
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuffer(dur + 0.05); f.type = "lowpass"; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, this.now(when)); g.gain.exponentialRampToValueAtTime(0.0001, this.now(when + dur));
    s.connect(f); f.connect(g); g.connect(this.out); s.start(this.now(when));
  }
  pad(freqs, dur = 3.2, vol = 0.035) {
    freqs.forEach((f) => {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.type = "triangle"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, this.now()); g.gain.linearRampToValueAtTime(vol, this.now(0.6));
      g.gain.linearRampToValueAtTime(0.0001, this.now(dur));
      o.connect(g); g.connect(this.out); o.start(); o.stop(this.now(dur + 0.1));
    });
  }
  rain(on) {
    if (on && !this.rainNode) {
      const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = this.noiseBuffer(2); s.loop = true; f.type = "lowpass"; f.frequency.value = 1600; g.gain.value = 0.09;
      s.connect(f); f.connect(g); g.connect(this.out); s.start(); this.rainNode = s;
    } else if (!on && this.rainNode) { this.rainNode.stop(); this.rainNode = null; }
  }
  play(name) {
    switch (name) {
      case "sting": this.tone(196, 0.5, "sawtooth", 0.06, 0, 160); this.tone(90, 0.3, "sine", 0.3, 0, 50); break;
      case "heart": this.tone(392, 0.9, "sine", 0.12, 0, 196); break;
      case "buzz": [0, 0.16, 0.32].forEach((w) => this.tone(140, 0.11, "square", 0.04, w)); break;
      case "ping": this.tone(1318, 0.25, "sine", 0.16); this.tone(1760, 0.4, "sine", 0.13, 0.09); break;
      case "tap": this.tone(880, 0.06, "triangle", 0.12); break;
      case "success": [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.32, "triangle", 0.12, i * 0.08)); break;
      case "stamp": this.tone(70, 0.3, "sine", 0.5, 0, 40); this.noise(0.12, 0.2, 800); break;
      case "beep": this.tone(1000, 0.12, "square", 0.05); break;
      case "shutter": this.noise(0.05, 0.4, 4000); this.noise(0.05, 0.3, 3000, 0.08); break;
      case "bell": [0, 0.16, 0.32].forEach((w) => { this.tone(2350, 0.14, "triangle", 0.07, w); this.tone(2900, 0.12, "triangle", 0.05, w + 0.02); }); break;
      case "ring": [0, 0.22, 0.6, 0.82].forEach((w, i) => this.tone(i % 2 ? 1046 : 880, 0.18, "sine", 0.1, w)); break;
      case "whoosh": this.noise(0.35, 0.12, 2200); break;
      case "cheer": [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.5, "triangle", 0.1, i * 0.06)); break;
      default:
    }
  }
  /** Cartoon “voice”: little formant-filtered syllables at the speaker's pitch (used when no Bangla TTS voice exists). */
  babble(dur = 1.5, base = 180) {
    const c = this.ctx, n = Math.max(2, Math.floor(dur * 7.5));
    for (let i = 0; i < n; i++) {
      const when = i / 7.5 + Math.random() * 0.03, len = 0.08 + Math.random() * 0.05;
      const o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
      o.type = "sawtooth";
      const pitch = base * (0.85 + Math.random() * 0.35) * (i === n - 1 ? 1.15 : 1);
      o.frequency.setValueAtTime(pitch, this.now(when));
      o.frequency.linearRampToValueAtTime(pitch * (0.9 + Math.random() * 0.2), this.now(when + len));
      f.type = "bandpass"; f.frequency.value = 700 + Math.random() * 1400; f.Q.value = 4;
      g.gain.setValueAtTime(0.0001, this.now(when));
      g.gain.exponentialRampToValueAtTime(0.09, this.now(when + 0.015));
      g.gain.exponentialRampToValueAtTime(0.0001, this.now(when + len));
      o.connect(f); f.connect(g); g.connect(this.out);
      o.start(this.now(when)); o.stop(this.now(when + len + 0.02));
    }
  }
  close() { try { this.rain(false); this.ctx.close(); } catch { /* ignore */ } }
}

const Am = [220, 261.6, 329.6], F = [174.6, 220, 261.6], Dm = [146.8, 174.6, 220], E = [164.8, 207.7, 246.9];
const C = [261.6, 329.6, 392], G = [196, 246.9, 293.7], F2 = [349.2, 440, 523.3];
export const CUES = [
  [1.8, "pad", Am], [2.25, "sting"], [4.75, "sting"], [5.3, "pad", F], [7.25, "sting"], [8.8, "pad", Dm],
  [12.2, "pad", E], [14.4, "rain-on"], [15.5, "heart"], [15.6, "pad", Am], [17.4, "rain-off"],
  [18.0, "buzz"], [18.7, "ping"], [19.0, "pad", C], [22.2, "pad", G], [23.15, "tap"], [24.1, "tap"], [25.0, "tap"], [25.9, "tap"],
  [25.6, "pad", C], [28.95, "ping"], [29.0, "pad", F2], [30.4, "tap"], [30.5, "success"], [32.4, "pad", C], [35.0, "stamp"], [35.1, "success"],
  [36.6, "pad", F2], [39.7, "beep"], [40.33, "beep"], [40.96, "beep"], [41.6, "shutter"], [41.8, "cheer"], [42.0, "pad", C],
];
