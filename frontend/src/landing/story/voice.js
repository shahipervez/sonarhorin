// Voices for the story films. Priority: your own recordings → a Bangla TTS voice on the device → cartoon babble.
//
// Recordings: put files in frontend/public/voice/<film>/ and list them in manifest.json, keyed by line index:
//   { "1": "01.mp3", "2": "02.mp3" }   (index = position in the film's LINES array)

const pickBangla = () => {
  const vs = (window.speechSynthesis?.getVoices?.() || []).filter((v) => /^bn/i.test(v.lang) || /bangla|bengali/i.test(v.name));
  return vs.find((v) => /bn[-_]BD/i.test(v.lang)) || vs[0] || null;
};

export class Voices {
  constructor(film) {
    this.film = film; this.files = {}; this.audio = null; this.bn = null; this.on = false;
    try {
      this.bn = pickBangla();
      window.speechSynthesis?.addEventListener?.("voiceschanged", () => { this.bn = pickBangla(); });
    } catch { /* no TTS */ }
    fetch(`/voice/${film}/manifest.json`).then((r) => (r.ok ? r.json() : {})).then((m) => { this.files = m || {}; }).catch(() => {});
  }
  get mode() { return Object.keys(this.files).length ? "recorded" : this.bn ? "tts" : "babble"; }
  say(line, idx, sfx) {
    if (!this.on || !line.who && !line.vo) return;
    this.stop();
    const v = line.voice || {};
    const file = this.files[String(idx)];
    if (file) {
      this.audio = new Audio(`/voice/${this.film}/${file}`); this.audio.play().catch(() => {});
      return;
    }
    const text = (line.say || line.bn).replace(/[“”"*]/g, "");
    if (this.bn && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(text);
      u.voice = this.bn; u.lang = this.bn.lang; u.pitch = v.pitch ?? 1; u.rate = v.rate ?? 1.05; u.volume = 1;
      window.speechSynthesis.speak(u);
      return;
    }
    sfx?.babble(Math.max(0.6, (line.b - line.a) * 0.8), v.babble ?? 190);
  }
  stop() {
    try { window.speechSynthesis?.cancel(); } catch { /* */ }
    if (this.audio) { this.audio.pause(); this.audio = null; }
  }
}
