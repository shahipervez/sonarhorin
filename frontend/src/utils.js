export const fmt = (n) => Number(n).toLocaleString("en-US");
export const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, Math.floor(s % 60))).padStart(2, "0")}`;

export function toast(msg) {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("on");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("on"), 3000);
}

let bits = [], running = false, cv, cx;
export function confetti(x = innerWidth / 2, y = innerHeight / 3) {
  if (!cv) {
    cv = document.createElement("canvas"); cv.id = "confetti"; document.body.appendChild(cv); cx = cv.getContext("2d");
  }
  const d = Math.min(devicePixelRatio || 1, 2);
  cv.width = innerWidth * d; cv.height = innerHeight * d; cx.setTransform(d, 0, 0, d, 0, 0);
  const C = ["#FFC23D", "#4B2FD6", "#FFB86B", "#7CC4FF", "#FF8FB1", "#0E0F0C"];
  for (let i = 0; i < 130; i++) bits.push({ x, y, vx: (Math.random() - 0.5) * 13, vy: -Math.random() * 13 - 3, s: Math.random() * 6 + 4, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: C[i % C.length], l: 110 });
  if (!running) { running = true; requestAnimationFrame(loop); }
}
function loop() {
  cx.clearRect(0, 0, innerWidth, innerHeight);
  bits.forEach((b) => {
    b.vy += 0.38; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.r += b.vr; b.l--;
    cx.save(); cx.translate(b.x, b.y); cx.rotate(b.r); cx.globalAlpha = Math.min(1, b.l / 30); cx.fillStyle = b.c;
    cx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2); cx.restore();
  });
  bits = bits.filter((b) => b.l > 0 && b.y < innerHeight + 40);
  if (bits.length) requestAnimationFrame(loop); else { running = false; cx.clearRect(0, 0, innerWidth, innerHeight); }
}

/** Pick an English (or Bangla) voice for speechSynthesis. */
export function pickVoice(lang = "en") {
  const vs = (window.speechSynthesis?.getVoices() || []).filter((v) => v.lang?.toLowerCase().startsWith(lang === "bn" ? "bn" : "en"));
  return vs.find((v) => /female|samantha|zira|aria|jenny|natural/i.test(v.name)) || vs.find((v) => /en-(in|gb)/i.test(v.lang)) || vs[0] || null;
}

export function speak(text, { lang = "en", onend, rate = 1.03 } = {}) {
  const synth = window.speechSynthesis;
  const v = pickVoice(lang);
  if (!synth || !v) { if (onend) setTimeout(onend, Math.max(1800, text.split(" ").length * 380)); return null; }
  const u = new SpeechSynthesisUtterance(text);
  u.voice = v; u.lang = v.lang; u.rate = rate; u.pitch = 1.1;
  u.onend = u.onerror = () => onend && onend();
  synth.cancel(); synth.speak(u);
  return u;
}
