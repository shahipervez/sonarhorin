/* =====================================================================
   সোনারহরিণ — "Episode 01: প্রথম সুযোগ"
   A ~24-second anime short, drawn live on a 1280×720 canvas.

   Look: cel shading (hard two-tone shadows), ink outlines, big glossy
   anime eyes, manga panels with screentone, speed lines, an inverted
   impact frame, Bangla comic SFX and krishnachura petals for Dhaka.

   Beats
     0.0  Golden-hour Dhaka, metro rail, krishnachura, title "EPISODE 01"
     3.6  Manga page: rejection email · shock · gloom
     7.8  Night rain, alone under a streetlight
    10.6  A golden glint in the puddle → the deer in his eye
    13.6  Impact frame "ধুম!"
    14.2  The run: dawn breaks, speed lines, the golden deer leads
    18.6  Three gates: Job · Internship · Startup — the leap
    21.0  Title card: সোনারহরিণ
   ===================================================================== */

export const STORY_LEN = 24;

const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const eio = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const eout = (k) => 1 - Math.pow(1 - k, 3);
const back = (k) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
function rnd(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

const INK = "#16101A";
const SKIN = "#DDA57C", SKIN_SH = "#B47A55", SKIN_HI = "#F2C9A4";
const HAIR = "#191B2C", HAIR_HI = "#3D4F86";
const GOLD = "#FFC23D";
const BN = "'Galada', 'Hind Siliguri', sans-serif";
const BNB = "'Hind Siliguri', sans-serif";

/* --------------------------------------------------------------- basics */
function grad(ctx, W, H, stops, x0 = 0, y0 = 0, x1 = 0, y1 = H) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}
function glow(ctx, x, y, r, col, a = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}
function inked(ctx, fill, lw = 4, col = INK) {
  ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.stroke();
}
function star4(ctx, x, y, r, col = "#fff", a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = col; ctx.beginPath();
  ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill(); ctx.restore();
}
function sfx(ctx, txt, x, y, size, rot, fill = "#fff", k = 1) {
  if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(back(k), back(k));
  ctx.font = `400 ${size}px ${BN}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.lineJoin = "round"; ctx.lineWidth = size * 0.22; ctx.strokeStyle = INK; ctx.strokeText(txt, 0, 0);
  ctx.fillStyle = fill; ctx.fillText(txt, 0, 0); ctx.restore();
}
function caption(ctx, W, H, txt, sub, k) {
  if (k <= 0) return;
  ctx.save(); ctx.globalAlpha = k;
  ctx.font = `600 30px ${BNB}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.lineWidth = 7; ctx.strokeStyle = "rgba(0,0,0,.85)"; ctx.lineJoin = "round";
  ctx.strokeText(txt, W / 2, H - 70); ctx.fillStyle = "#fff"; ctx.fillText(txt, W / 2, H - 70);
  if (sub) { ctx.font = `500 17px ${BNB}`; ctx.lineWidth = 5; ctx.strokeText(sub, W / 2, H - 36); ctx.fillStyle = "rgba(255,236,190,.95)"; ctx.fillText(sub, W / 2, H - 36); }
  ctx.restore();
}

let TONE = null;
function screentone(ctx, x, y, w, h, col = "rgba(0,0,0,.18)", size = 7) {
  if (!TONE) {
    const c = document.createElement("canvas"); c.width = c.height = 14;
    const g = c.getContext("2d"); g.fillStyle = "#000";
    [[3.5, 3.5], [10.5, 10.5]].forEach(([a, b]) => { g.beginPath(); g.arc(a, b, 2.2, 0, TAU); g.fill(); });
    TONE = c;
  }
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.globalAlpha *= 0.22; ctx.fillStyle = ctx.createPattern(TONE, "repeat"); ctx.fillRect(x, y, w, h);
  ctx.restore();
}
function focusLines(ctx, cx, cy, W, H, t, n = 90, col = "rgba(255,255,255,.85)", inner = 220) {
  const r = rnd(41 + Math.floor(t * 12));
  ctx.save(); ctx.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const a = r() * TAU, w = 0.004 + r() * 0.012, r0 = inner + r() * 120, r1 = Math.hypot(W, H);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a - w) * r1, cy + Math.sin(a - w) * r1);
    ctx.lineTo(cx + Math.cos(a + w) * r1, cy + Math.sin(a + w) * r1);
    ctx.fill();
  }
  ctx.restore();
}
function speedLinesH(ctx, W, H, t, col = "rgba(255,255,255,.7)", n = 40, dir = -1) {
  const r = rnd(7);
  ctx.save(); ctx.strokeStyle = col; ctx.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const y = r() * H, len = 120 + r() * 380, sp = 1600 + r() * 1400;
    const x = ((r() * W * 2 + dir * t * sp) % (W * 2) + W * 2) % (W * 2) - W * 0.5;
    ctx.lineWidth = 1 + r() * 3; ctx.globalAlpha = 0.3 + r() * 0.6;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
  }
  ctx.restore();
}

/* --------------------------------------------------------------- scenery */
function cloud(ctx, x, y, s, lit, shade, rim = "rgba(255,255,255,.85)") {
  const blobs = [[0, 0, 60], [55, -18, 52], [105, 4, 46], [-50, 8, 42], [20, -48, 44], [78, -40, 34]];
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = shade; ctx.beginPath(); blobs.forEach(([a, b, r]) => { ctx.moveTo(a + r, b); ctx.arc(a, b, r, 0, TAU); }); ctx.fill();
  ctx.fillStyle = lit; ctx.beginPath(); blobs.forEach(([a, b, r]) => { ctx.moveTo(a - 8 + r * 0.8, b - 14); ctx.arc(a - 8, b - 14, r * 0.8, 0, TAU); }); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); blobs.slice(0, 5).forEach(([a, b, r]) => { ctx.moveTo(a - 16 + r * 0.45, b - 24); ctx.arc(a - 16, b - 24, r * 0.45, 0, TAU); }); ctx.fill();
  ctx.strokeStyle = rim; ctx.lineWidth = 3; ctx.lineCap = "round";
  blobs.slice(0, 4).forEach(([a, b, r]) => { ctx.beginPath(); ctx.arc(a - 6, b - 10, r * 0.86, Math.PI * 1.15, Math.PI * 1.55); ctx.stroke(); });
  ctx.restore();
}
function skyline(ctx, W, base, col, seed, lit, t, litCol = "#FFD27A", hMax = 230, xOff = 0) {
  const r = rnd(seed); let x = -60 - (xOff % 400);
  while (x < W + 60) {
    const w = 40 + r() * 80, h = 70 + r() * hMax;
    ctx.fillStyle = col; ctx.fillRect(x, base - h, w, h);
    if (r() < 0.25) ctx.fillRect(x + w * 0.4, base - h - 22, 4, 22);
    if (lit) for (let wy = base - h + 12; wy < base - 10; wy += 15) for (let wx = x + 7; wx < x + w - 7; wx += 12) {
      const v = r(); if (v < lit) { ctx.globalAlpha = 0.55 + 0.45 * Math.sin(t * 1.3 + v * 50); ctx.fillStyle = litCol; ctx.fillRect(wx, wy, 5, 7); ctx.globalAlpha = 1; ctx.fillStyle = col; }
    }
    x += w + 2;
  }
}
function petals(ctx, W, H, t, n, seed = 3, wind = 1) {
  const r = rnd(seed);
  for (let i = 0; i < n; i++) {
    const sx = r() * W * 1.4, sy = r() * H, sp = 60 + r() * 120, ph = r() * TAU, sz = 4 + r() * 6;
    const x = ((sx - t * sp * 1.6 * wind) % (W * 1.4) + W * 1.4) % (W * 1.4) - W * 0.2;
    const y = ((sy + t * sp) % (H + 40) + H + 40) % (H + 40) - 20 + Math.sin(t * 2 + ph) * 18;
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * 3 + ph); ctx.scale(1, 0.45 + 0.4 * Math.sin(t * 4 + ph));
    ctx.fillStyle = i % 3 ? "#E8452C" : "#FF7A3D"; ctx.beginPath(); ctx.ellipse(0, 0, sz, sz * 0.6, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
}
function krishnachura(ctx, t) {
  // branch framing the top-left corner
  ctx.save(); ctx.translate(Math.sin(t * 0.8) * 3, 0);
  ctx.strokeStyle = "#2A1712"; ctx.lineCap = "round";
  ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(-20, 40); ctx.quadraticCurveTo(160, 60, 330, 20); ctx.stroke();
  ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(140, 55); ctx.quadraticCurveTo(200, 110, 260, 120); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(250, 32); ctx.quadraticCurveTo(300, 70, 380, 70); ctx.stroke();
  const r = rnd(11);
  const clusters = [[60, 40], [120, 70], [200, 40], [250, 115], [300, 25], [360, 70], [180, 100], [20, 60]];
  clusters.forEach(([cx, cy]) => {
    for (let i = 0; i < 9; i++) {
      const x = cx + (r() - 0.5) * 70, y = cy + (r() - 0.5) * 46;
      ctx.fillStyle = r() < 0.4 ? "#2F6B2A" : "#3E8A33";
      ctx.beginPath(); ctx.ellipse(x, y, 14, 4, r() * 3, 0, TAU); ctx.fill();
    }
    for (let i = 0; i < 6; i++) {
      const x = cx + (r() - 0.5) * 56, y = cy + (r() - 0.5) * 36, s = 6 + r() * 4;
      ctx.fillStyle = r() < 0.5 ? "#E8452C" : "#FF6A2B";
      for (let p = 0; p < 5; p++) { const a = p / 5 * TAU + i; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * s * 0.8, y + Math.sin(a) * s * 0.8, s * 0.7, s * 0.45, a, 0, TAU); ctx.fill(); }
      ctx.fillStyle = "#FFD23F"; ctx.beginPath(); ctx.arc(x, y, 2.2, 0, TAU); ctx.fill();
    }
  });
  ctx.restore();
}
function metro(ctx, W, t, y) {
  ctx.fillStyle = "#3A2442"; ctx.fillRect(0, y, W, 14);
  for (let x = 40; x < W; x += 170) { ctx.fillRect(x, y + 14, 16, 120); }
  const tx = ((t * 260) % (W + 900)) - 160;
  for (let c = 0; c < 4; c++) {
    const x = tx + c * 158;
    ctx.fillStyle = "#F2EEF6"; ctx.beginPath(); ctx.roundRect(x, y - 44, 150, 42, c === 3 ? [6, 22, 6, 6] : 6); ctx.fill();
    ctx.fillStyle = "#2B2140"; for (let w = 0; w < 5; w++) ctx.fillRect(x + 12 + w * 27, y - 36, 18, 14);
    ctx.fillStyle = GOLD; ctx.fillRect(x, y - 16, 150, 4);
  }
}

/* --------------------------------------------------------------- the hero: Rafi */
/** Anime face, 3/4 front. Origin = centre of face; s=1 → head ≈ 300px tall. */
function face(ctx, x, y, s, o = {}) {
  const wind = o.wind || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(o.tilt || 0);
  // back hair
  ctx.beginPath();
  ctx.moveTo(-138, 20); ctx.bezierCurveTo(-176, -190, 172, -205, 140, 10);
  ctx.lineTo(150, 70); ctx.lineTo(118, 40); ctx.lineTo(126, 96); ctx.lineTo(96, 50); ctx.lineTo(-96, 50); ctx.lineTo(-128, 100); ctx.lineTo(-118, 46); ctx.lineTo(-150, 74); ctx.closePath();
  inked(ctx, HAIR, 5);
  // neck + shirt
  ctx.beginPath(); ctx.moveTo(-38, 100); ctx.lineTo(-40, 215); ctx.lineTo(40, 215); ctx.lineTo(36, 100); ctx.closePath(); inked(ctx, SKIN, 4);
  ctx.beginPath(); ctx.moveTo(-38, 112); ctx.lineTo(36, 130); ctx.lineTo(36, 100); ctx.lineTo(-38, 100); ctx.fillStyle = SKIN_SH; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-160, 260); ctx.quadraticCurveTo(-120, 180, -40, 176); ctx.lineTo(0, 225); ctx.lineTo(40, 176); ctx.quadraticCurveTo(120, 180, 160, 260); ctx.closePath(); inked(ctx, "#F4F2F8", 4);
  ctx.beginPath(); ctx.moveTo(-40, 176); ctx.lineTo(-12, 232); ctx.lineTo(0, 225); ctx.closePath(); inked(ctx, "#DCD8E6", 3);
  ctx.beginPath(); ctx.moveTo(40, 176); ctx.lineTo(12, 232); ctx.lineTo(0, 225); ctx.closePath(); inked(ctx, "#DCD8E6", 3);
  ctx.beginPath(); ctx.moveTo(-160, 260); ctx.quadraticCurveTo(-140, 205, -96, 186); ctx.lineTo(-70, 262); ctx.closePath(); inked(ctx, "#1F2A4D", 4);
  ctx.beginPath(); ctx.moveTo(160, 260); ctx.quadraticCurveTo(140, 205, 96, 186); ctx.lineTo(70, 262); ctx.closePath(); inked(ctx, "#1F2A4D", 4);
  // ear
  ctx.beginPath(); ctx.ellipse(100, 20, 15, 25, 0.2, 0, TAU); inked(ctx, SKIN, 4);
  // face shape
  ctx.beginPath();
  ctx.moveTo(-96, -40); ctx.bezierCurveTo(-100, 34, -64, 92, 4, 140); ctx.bezierCurveTo(66, 96, 98, 34, 96, -40);
  ctx.bezierCurveTo(92, -124, -92, -124, -96, -40); inked(ctx, SKIN, 5);
  // cel shadow on the far cheek + under fringe
  ctx.save(); ctx.clip();
  ctx.fillStyle = SKIN_SH; ctx.globalAlpha = 0.55;
  ctx.beginPath(); ctx.moveTo(60, -60); ctx.bezierCurveTo(90, 20, 80, 80, 4, 140); ctx.lineTo(120, 140); ctx.lineTo(120, -60); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-120, -44); ctx.quadraticCurveTo(0, -6, 120, -44); ctx.lineTo(120, -80); ctx.lineTo(-120, -80); ctx.fill();
  ctx.globalAlpha = 1; ctx.restore();
  // blush
  if (!o.gloom) { ctx.strokeStyle = "rgba(230,90,90,.55)"; ctx.lineWidth = 3; for (const sx of [-62, 46]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(sx + i * 9, 62); ctx.lineTo(sx + i * 9 + 6, 52); ctx.stroke(); } }
  // eyes
  for (const side of [-1, 1]) eye(ctx, side * 46 + (side > 0 ? 4 : 0), 20, side, o);
  // brows
  ctx.strokeStyle = HAIR; ctx.lineWidth = 7; ctx.lineCap = "round";
  const bd = o.determined ? 12 : o.shock ? -10 : o.gloom ? -4 : 0;
  ctx.beginPath(); ctx.moveTo(-84, -26 - (o.shock ? 10 : 0)); ctx.quadraticCurveTo(-56, -40 - (o.shock ? 10 : 0), -24, -30 + bd); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(84, -26 - (o.shock ? 10 : 0)); ctx.quadraticCurveTo(56, -40 - (o.shock ? 10 : 0), 28, -30 + bd); ctx.stroke();
  // nose + mouth
  ctx.strokeStyle = SKIN_SH; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(10, 52); ctx.lineTo(16, 74); ctx.lineTo(6, 78); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 4;
  if (o.determined) {
    ctx.beginPath(); ctx.moveTo(-16, 100); ctx.quadraticCurveTo(4, 92, 24, 98); ctx.lineTo(18, 108); ctx.quadraticCurveTo(2, 112, -12, 107); ctx.closePath(); inked(ctx, "#6B1E24", 3.5);
    ctx.fillStyle = "#fff"; ctx.fillRect(-8, 98, 26, 5);
  } else if (o.shock) {
    ctx.beginPath(); ctx.ellipse(4, 104, 10, 13, 0, 0, TAU); inked(ctx, "#5A1820", 3.5);
  } else {
    ctx.beginPath(); ctx.moveTo(-10, 104); ctx.quadraticCurveTo(4, o.gloom ? 98 : 108, 18, 103); ctx.stroke();
  }
  // gloom shadow over the eyes
  if (o.gloom) {
    ctx.save(); ctx.beginPath(); ctx.moveTo(-96, -40); ctx.bezierCurveTo(-100, 34, -64, 92, 4, 140); ctx.bezierCurveTo(66, 96, 98, 34, 96, -40); ctx.bezierCurveTo(92, -124, -92, -124, -96, -40); ctx.clip();
    const g = ctx.createLinearGradient(0, -60, 0, 60); g.addColorStop(0, "rgba(30,20,70,.85)"); g.addColorStop(1, "rgba(30,20,70,0)");
    ctx.fillStyle = g; ctx.fillRect(-120, -80, 240, 140);
    ctx.strokeStyle = "rgba(20,10,40,.6)"; ctx.lineWidth = 2; for (let i = -100; i < 110; i += 9) { ctx.beginPath(); ctx.moveTo(i, -80); ctx.lineTo(i, -10 + (i % 3) * 8); ctx.stroke(); }
    ctx.restore();
  }
  // fringe: pointed strands, swaying in the wind
  ctx.beginPath(); ctx.moveTo(-150, 10);
  const tips = [[-128, 44], [-112, -16], [-92, 18], [-70, -24], [-48, 10], [-26, -28], [-4, 14], [20, -26], [44, 6], [66, -26], [88, 12], [110, -16], [132, 42], [150, 6]];
  let px = -150;
  tips.forEach(([tx, ty], i) => {
    const sw = wind ? Math.sin(wind * 6 + i) * 9 : 0;
    ctx.quadraticCurveTo((px + tx) / 2 + sw * 0.5, ty < 0 ? -74 : -60, tx + sw, ty); px = tx;
  });
  ctx.bezierCurveTo(176, -200, -176, -200, -150, 10); ctx.closePath();
  inked(ctx, HAIR, 5);
  // side locks framing the face
  for (const sd of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(sd * 96, -40); ctx.quadraticCurveTo(sd * 118, 30, sd * (106 + (wind ? Math.sin(wind * 5 + sd) * 6 : 0)), 104);
    ctx.quadraticCurveTo(sd * 100, 40, sd * 82, -10); ctx.closePath(); inked(ctx, HAIR, 4);
  }
  // angel-ring highlight (the classic glossy anime band)
  ctx.save();
  ctx.beginPath(); ctx.moveTo(-150, 10); ctx.bezierCurveTo(-176, -200, 176, -200, 150, 6); ctx.lineTo(150, -40); ctx.lineTo(-150, -40); ctx.closePath(); ctx.clip();
  ctx.strokeStyle = HAIR_HI; ctx.lineCap = "butt";
  ctx.lineCap = "round";
  [[1.18, 1.38, 9], [1.42, 1.62, 13], [1.66, 1.84, 9]].forEach(([a0, a1, w]) => {
    ctx.lineWidth = w; ctx.beginPath(); ctx.ellipse(0, -60, 126, 84, 0, Math.PI * a0, Math.PI * a1); ctx.stroke();
  });
  ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(0, -60, 126, 84, 0, Math.PI * 1.45, Math.PI * 1.58); ctx.stroke();
  ctx.restore();
  // ahoge (the one stubborn strand)
  ctx.beginPath(); ctx.moveTo(-10, -128); ctx.quadraticCurveTo(10 + Math.sin(wind * 9) * 6, -190, 52, -176); ctx.quadraticCurveTo(20, -170, 12, -126); inked(ctx, HAIR, 4);
  // sweat drop
  if (o.sweat) {
    ctx.beginPath(); ctx.moveTo(122, -50); ctx.quadraticCurveTo(140, -10, 124, 6); ctx.quadraticCurveTo(104, -10, 122, -50); inked(ctx, "#9ED8FF", 3);
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(118, -8, 3, 6, 0.3, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

function eye(ctx, x, y, side, o) {
  ctx.save(); ctx.translate(x, y); ctx.scale(side, 1);
  if (o.closed) {
    ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-34, 10); ctx.quadraticCurveTo(0, 22, 34, 6); ctx.stroke(); ctx.restore(); return;
  }
  const open = o.shock ? 1.18 : 1;
  // white
  ctx.beginPath(); ctx.moveTo(-36, 4); ctx.bezierCurveTo(-30, -26 * open, 26, -30 * open, 38, -6); ctx.bezierCurveTo(30, 26, -24, 34, -36, 4);
  ctx.fillStyle = "#FBFAFF"; ctx.fill();
  ctx.save(); ctx.clip();
  // iris
  const ir = o.shock ? 15 : 24;
  const g = ctx.createLinearGradient(0, -24, 0, 30);
  if (o.gold) { g.addColorStop(0, "#5A3204"); g.addColorStop(0.55, "#E89A14"); g.addColorStop(1, "#FFE38A"); }
  else { g.addColorStop(0, "#1D1208"); g.addColorStop(0.6, "#6B3A1A"); g.addColorStop(1, "#C47B3E"); }
  ctx.beginPath(); ctx.ellipse(2, 4, ir, ir * 1.25, 0, 0, TAU); ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = "#140A04"; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(2, 2, ir * 0.42, ir * 0.55, 0, 0, TAU); ctx.fillStyle = "#0B0604"; ctx.fill();
  // lid shadow
  ctx.fillStyle = "rgba(60,40,90,.28)"; ctx.fillRect(-40, -34, 80, 14);
  // highlights
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.ellipse(-8, -8, ir * 0.34, ir * 0.42, -0.4, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(12, 18, ir * 0.16, 0, TAU); ctx.fill();
  if (o.gold) star4(ctx, 8, -2, 9, "#FFF6D5");
  ctx.restore();
  // upper lash (thick, with flick)
  ctx.beginPath(); ctx.moveTo(-40, 6); ctx.bezierCurveTo(-32, -30 * open, 26, -36 * open, 42, -8); ctx.lineTo(50, -16); ctx.lineTo(40, -2);
  ctx.bezierCurveTo(24, -24 * open, -26, -22 * open, -36, 8); ctx.closePath(); ctx.fillStyle = INK; ctx.fill();
  // lower lash
  ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-18, 30); ctx.quadraticCurveTo(10, 34, 30, 18); ctx.stroke();
  if (o.tear) { ctx.beginPath(); ctx.moveTo(-26, 30); ctx.quadraticCurveTo(-34, 52, -24, 60); ctx.quadraticCurveTo(-16, 48, -26, 30); ctx.fillStyle = "rgba(170,225,255,.9)"; ctx.fill(); }
  ctx.restore();
}

/** Extreme close-up of one eye; the golden deer appears reflected in the iris. */
function bigEye(ctx, W, H, t, k, deerK) {
  const cx = W / 2, cy = H / 2 + 20;
  grad(ctx, W, H, [[0, SKIN_HI], [1, SKIN]]);
  ctx.fillStyle = SKIN_SH; ctx.globalAlpha = 0.5; ctx.fillRect(0, 0, W, 120); ctx.globalAlpha = 1;
  // hair strands crossing the frame
  ctx.fillStyle = HAIR;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(i * 240 - 80, -10); ctx.quadraticCurveTo(i * 240 + 40, 70, i * 240 + 110 + Math.sin(t * 3 + i) * 10, 150); ctx.lineTo(i * 240 + 60, -10); ctx.fill(); }
  ctx.save(); ctx.translate(cx, cy);
  ctx.beginPath(); ctx.moveTo(-560, 40); ctx.bezierCurveTo(-420, -230, 400, -250, 580, -30); ctx.bezierCurveTo(420, 210, -380, 250, -560, 40);
  ctx.fillStyle = "#FCFBFF"; ctx.fill(); ctx.save(); ctx.clip();
  const pr = lerp(120, 64, eout(k));
  const g = ctx.createRadialGradient(0, 0, pr * 0.5, 0, 10, 250);
  g.addColorStop(0, "#3A2004"); g.addColorStop(0.45, lerp(0, 1, deerK) > 0.3 ? "#C97A10" : "#6B3A1A"); g.addColorStop(0.9, "#FFD36A"); g.addColorStop(1, "#2A1404");
  ctx.beginPath(); ctx.arc(0, 10, 250, 0, TAU); ctx.fillStyle = g; ctx.fill();
  // iris striations
  ctx.strokeStyle = "rgba(255,220,140,.35)"; ctx.lineWidth = 2;
  for (let i = 0; i < 90; i++) { const a = i / 90 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * pr * 1.2, 10 + Math.sin(a) * pr * 1.2); ctx.lineTo(Math.cos(a) * 236, 10 + Math.sin(a) * 236); ctx.stroke(); }
  ctx.lineWidth = 10; ctx.strokeStyle = "#1A0C02"; ctx.beginPath(); ctx.arc(0, 10, 250, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 10, pr, 0, TAU); ctx.fillStyle = "#080402"; ctx.fill();
  // reflection: the deer, leaping across the iris
  if (deerK > 0) {
    ctx.save(); ctx.globalAlpha = deerK; ctx.beginPath(); ctx.arc(0, 10, 240, 0, TAU); ctx.clip();
    glow(ctx, 0, -20, 220, "rgba(255,210,90,.7)");
    deer(ctx, lerp(-150, 110, eout(deerK)), -10 - Math.sin(deerK * Math.PI) * 40, 1.0, t * 14, true);
    ctx.restore();
  }
  // highlights
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(-110, -70, 70, 54, -0.5, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(120, 120, 26, 0, TAU); ctx.fill();
  ctx.fillStyle = "rgba(60,40,100,.3)"; ctx.fillRect(-600, -260, 1200, 70);
  ctx.restore();
  // lash
  ctx.beginPath(); ctx.moveTo(-580, 50); ctx.bezierCurveTo(-430, -250, 420, -276, 610, -40); ctx.lineTo(660, -90); ctx.lineTo(600, -10);
  ctx.bezierCurveTo(420, -220, -400, -210, -556, 64); ctx.closePath(); ctx.fillStyle = INK; ctx.fill();
  ctx.restore();
  if (deerK > 0.4) { star4(ctx, cx - 60, cy - 110, 60 * (deerK - 0.4), "#FFF7D6"); star4(ctx, cx + 170, cy + 60, 30 * (deerK - 0.4), "#FFF7D6"); }
}

/** Back view, standing in the rain, rim-lit. Origin = feet. */
function figureBack(ctx, x, y, s, t, rim = "#7FE0FF") {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const D = "#0B0E1C", D2 = "#141A30";
  // legs
  ctx.fillStyle = D; ctx.beginPath(); ctx.roundRect(-34, -170, 30, 170, 12); ctx.fill(); ctx.beginPath(); ctx.roundRect(4, -170, 30, 170, 12); ctx.fill();
  // jacket body (slightly flared hem)
  ctx.fillStyle = D2; ctx.beginPath(); ctx.moveTo(-58, -150); ctx.lineTo(-66, -300); ctx.quadraticCurveTo(-60, -350, 0, -356); ctx.quadraticCurveTo(60, -350, 66, -300); ctx.lineTo(58, -150); ctx.closePath(); ctx.fill();
  // arms hanging
  ctx.beginPath(); ctx.roundRect(-84, -340, 24, 150, 12); ctx.fill(); ctx.beginPath(); ctx.roundRect(60, -340, 24, 150, 12); ctx.fill();
  // backpack
  ctx.fillStyle = "#2B1A12"; ctx.beginPath(); ctx.roundRect(-40, -320, 80, 110, 18); ctx.fill();
  ctx.fillStyle = "#3D2618"; ctx.beginPath(); ctx.roundRect(-30, -270, 60, 40, 10); ctx.fill();
  // neck + head with spiky hair
  ctx.fillStyle = D; ctx.fillRect(-14, -372, 28, 22);
  ctx.beginPath(); ctx.arc(0, -404, 40, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-44, -396);
  for (let i = 0; i <= 8; i++) { const a = Math.PI * (1.05 + i * 0.11); const r1 = i % 2 ? 50 : 62; ctx.lineTo(Math.cos(a) * r1, -404 + Math.sin(a) * r1); }
  ctx.lineTo(44, -396); ctx.lineTo(36, -366); ctx.lineTo(18, -378); ctx.lineTo(0, -362); ctx.lineTo(-18, -378); ctx.lineTo(-36, -366); ctx.closePath(); ctx.fill();
  // neon rim light on the right edge
  ctx.strokeStyle = rim; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.globalAlpha = 0.9;
  ctx.beginPath(); ctx.moveTo(84, -200); ctx.lineTo(84, -330); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(66, -300); ctx.quadraticCurveTo(60, -350, 10, -356); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -404, 42, -Math.PI * 0.5, Math.PI * 0.2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(34, -10); ctx.lineTo(34, -160); ctx.stroke();
  ctx.restore();
}

/** Side-view run cycle with cel shading and streaming hair. ph = cycle phase. */
function runner(ctx, x, y, s, ph) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const limb = (pts, col, w) => {
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = INK; ctx.lineWidth = w + 7; ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.stroke();
  };
  const leg = (p, col) => {
    const th = Math.sin(p) * 0.9, kn = Math.max(0, -Math.cos(p)) * 1.4 + 0.2;
    const kx = Math.sin(th) * 70, ky = Math.cos(th) * 70;
    const fx = kx + Math.sin(th - kn) * 66, fy = ky + Math.cos(th - kn) * 66;
    limb([[0, 0], [kx, ky], [fx, fy]], col, 24);
    ctx.fillStyle = "#F4F2F8"; ctx.beginPath(); ctx.ellipse(fx + 10, fy + 4, 20, 9, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
  };
  const arm = (p, col) => {
    const th = -Math.sin(p) * 1.1;
    const ex = Math.sin(th) * 52, ey = Math.cos(th) * 52;
    limb([[0, 0], [ex, ey], [ex + 40, ey - 20]], col, 18);
    ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(ex + 42, ey - 22, 10, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
  };
  ctx.save(); ctx.translate(0, -10); leg(ph + Math.PI, "#18213F"); ctx.restore();
  ctx.save(); ctx.translate(26, -150); ctx.rotate(0.35); arm(ph, "#1F2A4D"); ctx.restore();
  // torso (leaning forward) + jacket tail
  ctx.save(); ctx.translate(0, -10); ctx.rotate(0.35);
  ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(-90 - Math.sin(ph * 2) * 10, 20); ctx.lineTo(-40, -60); ctx.closePath(); ctx.fillStyle = "#1F2A4D"; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke();
  ctx.beginPath(); ctx.roundRect(-30, -150, 62, 156, 24); inked(ctx, "#F4F2F8", 5);
  ctx.fillStyle = "#D2CDE0"; ctx.fillRect(-28, -150, 22, 150);
  ctx.beginPath(); ctx.roundRect(-38, -152, 30, 150, 14); inked(ctx, "#1F2A4D", 4);
  ctx.restore();
  ctx.save(); ctx.translate(0, -10); leg(ph, "#22305A"); ctx.restore();
  // head
  ctx.save(); ctx.translate(62, -204); ctx.scale(1.28, 1.28);
  ctx.beginPath(); ctx.moveTo(-30, -24); for (let i = 0; i < 6; i++) { ctx.lineTo(-90 - i * 6 - Math.sin(ph * 3 + i) * 8, -40 + i * 12); ctx.lineTo(-40, -30 + i * 10); } ctx.closePath(); inked(ctx, HAIR, 4);
  ctx.beginPath(); ctx.ellipse(0, 0, 38, 44, 0.15, 0, TAU); inked(ctx, SKIN, 4);
  ctx.fillStyle = SKIN_SH; ctx.beginPath(); ctx.ellipse(-12, 6, 22, 36, 0.15, 0, TAU); ctx.globalAlpha = 0.5; ctx.fill(); ctx.globalAlpha = 1;
  ctx.beginPath(); ctx.moveTo(-40, 6); ctx.bezierCurveTo(-48, -60, 40, -66, 44, -10); ctx.lineTo(30, -16); ctx.lineTo(24, 2); ctx.lineTo(10, -14); ctx.lineTo(-20, -6); ctx.closePath(); inked(ctx, HAIR, 4);
  ctx.strokeStyle = HAIR_HI; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(-4, -18, 30, Math.PI * 1.15, Math.PI * 1.5); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(24, 4, 8, 11, 0, 0, TAU); ctx.fillStyle = "#fff"; ctx.fill();
  ctx.beginPath(); ctx.ellipse(26, 6, 5.5, 8, 0, 0, TAU); ctx.fillStyle = "#B8741F"; ctx.fill();
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(24, 2, 2.4, 0, TAU); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(12, -6); ctx.quadraticCurveTo(24, -12, 36, -4); ctx.stroke();
  ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(14, -16); ctx.lineTo(34, -12); ctx.stroke();
  ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(26, 28); ctx.lineTo(34, 26); ctx.stroke();
  ctx.restore();
  ctx.save(); ctx.translate(26, -150); ctx.rotate(0.35); arm(ph + Math.PI, "#2A3866"); ctx.restore();
  ctx.restore();
}

/** The golden deer — anime-lit, with optional glow. */
function deer(ctx, x, y, s, ph, bright = false) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (bright) glow(ctx, 0, -30, 170, "rgba(255,205,90,.55)");
  const g = ctx.createLinearGradient(-60, -100, 60, 40); g.addColorStop(0, "#FFF4C2"); g.addColorStop(0.5, GOLD); g.addColorStop(1, "#E08A00");
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  const L = (bx, by, a1, a2) => {
    const kx = bx + Math.sin(a1) * 24, ky = by + Math.cos(a1) * 24, fx = kx + Math.sin(a2) * 24, fy = ky + Math.cos(a2) * 24;
    ctx.strokeStyle = "#7A4300"; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
    ctx.strokeStyle = g; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
  };
  L(-30, 0, 0.9 + Math.sin(ph) * 0.8, 0.2 + Math.sin(ph) * 0.6); L(-22, 2, 0.7 + Math.sin(ph + 0.6) * 0.8, 0.1 + Math.sin(ph + 0.6) * 0.6);
  L(26, 0, -0.6 + Math.sin(ph + 2.6) * 0.9, 0.4 + Math.sin(ph + 2.6) * 0.6); L(34, 0, -0.5 + Math.sin(ph + 3.2) * 0.9, 0.3 + Math.sin(ph + 3.2) * 0.6);
  ctx.beginPath(); ctx.ellipse(0, -8, 48, 21, -0.05, 0, TAU);
  ctx.moveTo(28, -20); ctx.quadraticCurveTo(44, -42, 52, -62); ctx.lineTo(64, -56); ctx.quadraticCurveTo(54, -32, 40, -6);
  ctx.moveTo(80, -64); ctx.ellipse(64, -64, 18, 10, 0.35, 0, TAU);
  ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = "#7A4300"; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = "rgba(160,90,0,.35)"; ctx.beginPath(); ctx.ellipse(4, 0, 44, 10, -0.05, 0, Math.PI); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.75)"; [[-18, -14], [-2, -18], [12, -12], [-28, -4]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(a, b, 3, 0, TAU); ctx.fill(); });
  ctx.strokeStyle = g; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(58, -74); ctx.quadraticCurveTo(52, -100, 66, -118); ctx.moveTo(55, -90); ctx.lineTo(42, -100); ctx.moveTo(59, -104); ctx.lineTo(50, -116);
  ctx.moveTo(62, -74); ctx.quadraticCurveTo(72, -96, 90, -104); ctx.moveTo(72, -90); ctx.lineTo(80, -108); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(68, -66, 2.6, 0, TAU); ctx.fill();
  ctx.restore();
}

function deerMark(ctx, x, y, s, col = GOLD) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s / 40, s / 40); ctx.translate(-20, -20);
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.4; ctx.lineCap = "round";
  ctx.stroke(new Path2D("M14 15c-2-3-5-5-6-9M10 9l-4-1M12 12l-5 1M26 15c2-3 5-5 6-9M30 9l4-1M28 12l5 1"));
  ctx.fill(new Path2D("M13 15c2-1.5 4.5-2 7-2s5 .5 7 2c1 3-1 6-2.5 9.5L22 34c-.6 1.4-3.4 1.4-4 0l-2.5-9.5C14 21 12 18 13 15z"));
  ctx.restore();
}

/* --------------------------------------------------------------- panels */
function panel(ctx, x, y, w, h, k, from, draw) {
  if (k <= 0) return;
  const e = back(clamp(k));
  const dx = from === "l" ? -1 : from === "r" ? 1 : 0, dy = from === "t" ? -1 : from === "b" ? 1 : 0;
  ctx.save();
  ctx.translate((1 - e) * dx * 260, (1 - e) * dy * 200);
  ctx.globalAlpha = clamp(k * 3);
  ctx.fillStyle = "#fff"; ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.save(); ctx.clip(); draw(x, y, w, h); ctx.restore();
  ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

/* =============================================================== SCENES */
function sceneDusk(ctx, W, H, t) {
  const cam = eio(seg(t, 0, 3.8));
  ctx.save(); ctx.translate(-cam * 40, 0); ctx.scale(1 + cam * 0.05, 1 + cam * 0.05);
  grad(ctx, W + 80, H, [[0, "#2B1B5A"], [0.32, "#7A2E79"], [0.58, "#F0627A"], [0.8, "#FFB36B"], [1, "#FFE2A8"]]);
  // sun + flare
  glow(ctx, 860, 420, 420, "rgba(255,190,110,.55)");
  ctx.fillStyle = "#FFF1C6"; ctx.beginPath(); ctx.arc(860, 420, 70, 0, TAU); ctx.fill();
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.35;
  ctx.globalAlpha = 0.18; for (let i = 0; i < 3; i++) { const k = 0.5 + i * 0.4; ctx.fillStyle = ["#FFB3E6", "#9FD7FF", "#FFE08A"][i]; ctx.beginPath(); ctx.arc(lerp(860, 420, k), lerp(420, 230, k), 14 + i * 9, 0, TAU); ctx.fill(); }
  ctx.fillStyle = "rgba(255,240,210,.6)"; ctx.fillRect(0, 418, W + 80, 4); ctx.restore();
  cloud(ctx, 220 + t * 6, 160, 1.25, "#FFE1C4", "#B04A78"); cloud(ctx, 1000 - t * 4, 120, 1.6, "#FFE7CC", "#9E3F72"); cloud(ctx, 600 + t * 3, 250, 0.9, "#FFD6B8", "#8E3A6E");
  skyline(ctx, W + 80, 560, "#5A2758", 21, 0.08, t, "#FFD27A", 250);
  metro(ctx, W + 80, t, 575);
  skyline(ctx, W + 80, 720, "#2A1236", 9, 0.12, t, "#FFD27A", 40);
  ctx.restore();
  krishnachura(ctx, t);
  petals(ctx, W, H, t, 26, 5, 1);
  // title card
  const k = seg(t, 0.7, 1.3) * (1 - seg(t, 3.2, 3.6));
  if (k > 0) {
    ctx.save(); ctx.globalAlpha = k;
    ctx.translate(lerp(-60, 0, eout(seg(t, 0.7, 1.3))), 0);
    ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(60, 520); ctx.lineTo(560, 500); ctx.lineTo(540, 640); ctx.lineTo(40, 650); ctx.closePath(); ctx.fill();
    ctx.fillStyle = GOLD; ctx.font = "700 20px 'Hind Siliguri', sans-serif"; ctx.textBaseline = "middle"; ctx.fillText("EPISODE 01", 90, 540);
    ctx.font = `400 74px ${BN}`; ctx.fillStyle = "#fff"; ctx.fillText("প্রথম সুযোগ", 86, 598);
    ctx.restore();
  }
}

function sceneManga(ctx, W, H, t) {
  ctx.fillStyle = "#F5F1E8"; ctx.fillRect(0, 0, W, H);
  screentone(ctx, 0, 0, W, H);
  // P1 — the phone
  panel(ctx, 30, 30, 470, 660, seg(t, 3.6, 4.0), "l", (x, y, w, h) => {
    grad(ctx, W, H, [[0, "#2A2440"], [1, "#0F0D1A"]]);
    ctx.save(); ctx.translate(x + w / 2, y + h / 2 + 30); ctx.rotate(-0.08);
    ctx.beginPath(); ctx.roundRect(-150, -280, 300, 540, 38); inked(ctx, "#1B1B22", 6);
    ctx.beginPath(); ctx.roundRect(-134, -262, 268, 500, 26); ctx.fillStyle = "#F7F7FB"; ctx.fill();
    ctx.fillStyle = "#E5484D"; ctx.beginPath(); ctx.roundRect(-118, -236, 236, 64, 14); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "700 20px sans-serif"; ctx.textBaseline = "middle"; ctx.fillText("✉  Application update", -100, -204);
    ctx.fillStyle = "#222"; ctx.font = "600 21px sans-serif"; ctx.fillText("We regret to inform", -110, -132); ctx.fillText("you that…", -110, -102);
    ctx.fillStyle = "#C7C9D3"; for (let i = 0; i < 5; i++) ctx.fillRect(-110, -60 + i * 26, 220 - (i % 2) * 60, 10);
    ctx.fillStyle = "rgba(229,72,77,.18)"; ctx.fillRect(-116, 84, 232, 46);
    ctx.fillStyle = "#C81E2E"; ctx.font = "800 22px sans-serif"; ctx.fillText("Experience: 2+ years", -104, 107);
    // thumb
    ctx.beginPath(); ctx.ellipse(150, 170, 46, 80, -0.4, 0, TAU); inked(ctx, SKIN, 5);
    ctx.restore();
    sfx(ctx, "টুং!", x + 380, y + 90, 64, 0.2, "#FFE36A", seg(t, 3.9, 4.2));
  });
  // P2 — shock
  panel(ctx, 530, 30, 720, 330, seg(t, 4.5, 4.9), "r", (x, y, w, h) => {
    ctx.fillStyle = "#fff"; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = INK; ctx.lineWidth = 2; for (let i = x; i < x + w; i += 11) { ctx.beginPath(); ctx.moveTo(i, y); ctx.lineTo(i, y + h * (0.35 + 0.3 * ((i * 7) % 5) / 5)); ctx.stroke(); }
    face(ctx, x + w * 0.5 + Math.sin(t * 60) * 3, y + 210, 0.95, { shock: true, sweat: true });
    sfx(ctx, "কী?!", x + 120, y + 110, 70, -0.15, "#fff", seg(t, 4.8, 5.1));
  });
  // P3 — gloom
  panel(ctx, 530, 390, 720, 300, seg(t, 5.6, 6.0), "b", (x, y, w, h) => {
    grad(ctx, W, H, [[0, "#3A3560"], [1, "#16142A"]]);
    screentone(ctx, x, y, w, h);
    face(ctx, x + w * 0.62, y + 190, 0.9, { gloom: true, tilt: 0.12 });
    ctx.save(); ctx.font = `600 34px ${BNB}`; ctx.fillStyle = "#EDE9FF"; ctx.globalAlpha = seg(t, 6.2, 6.8);
    ctx.fillText("আবারও না…", x + 50, y + h - 60); ctx.restore();
  });
}

function rainLayer(ctx, W, H, t, n = 220, col = "rgba(190,215,255,.55)") {
  const r = rnd(17); ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1.6;
  for (let i = 0; i < n; i++) {
    const x0 = r() * (W + 200), sp = 1100 + r() * 600, len = 18 + r() * 26;
    const y = ((r() * H + t * sp) % (H + 60)) - 30, x = x0 - y * 0.18 - 60;
    ctx.globalAlpha = 0.35 + r() * 0.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - len * 0.18, y + len); ctx.stroke();
  }
  ctx.restore();
}

function sceneRain(ctx, W, H, t) {
  const k = seg(t, 7.8, 10.6);
  ctx.save(); const z = 1 + k * 0.12; ctx.translate(W / 2, H * 0.62); ctx.scale(z, z); ctx.translate(-W / 2, -H * 0.62);
  grad(ctx, W, H, [[0, "#05070F"], [0.6, "#0E1630"], [1, "#1B2650"]]);
  skyline(ctx, W, 470, "#0B1226", 33, 0.18, t, "#5EC8FF", 240);
  // neon bokeh
  const r = rnd(5);
  for (let i = 0; i < 22; i++) glow(ctx, r() * W, 200 + r() * 260, 20 + r() * 40, ["rgba(255,80,160,.5)", "rgba(80,200,255,.5)", "rgba(255,200,80,.45)"][i % 3], 0.6 + 0.4 * Math.sin(t * 2 + i));
  // street + puddle reflections
  const st = ctx.createLinearGradient(0, 470, 0, 720); st.addColorStop(0, "#111a33"); st.addColorStop(1, "#05080F");
  ctx.fillStyle = st; ctx.fillRect(0, 470, W, 250);
  ctx.save(); ctx.globalAlpha = 0.18; ctx.translate(0, 940); ctx.scale(1, -1); skyline(ctx, W, 470, "#1A2C55", 33, 0.18, t, "#5EC8FF", 240); ctx.restore();
  // zebra crossing in perspective
  ctx.fillStyle = "rgba(230,236,255,.55)";
  for (let i = 0; i < 9; i++) { const x0 = 220 + i * 100; ctx.beginPath(); ctx.moveTo(x0, 560); ctx.lineTo(x0 + 56, 560); ctx.lineTo(x0 + 80 + (x0 - 640) * 0.25, 700); ctx.lineTo(x0 + 8 + (x0 - 640) * 0.25, 700); ctx.closePath(); ctx.fill(); }
  // streetlight
  ctx.fillStyle = "#1A2238"; ctx.fillRect(820, 140, 10, 340); ctx.fillRect(760, 140, 70, 8);
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const cone = ctx.createLinearGradient(0, 150, 0, 520); cone.addColorStop(0, "rgba(255,214,140,.55)"); cone.addColorStop(1, "rgba(255,214,140,0)");
  ctx.fillStyle = cone; ctx.beginPath(); ctx.moveTo(770, 150); ctx.lineTo(500, 600); ctx.lineTo(1000, 600); ctx.closePath(); ctx.fill();
  ctx.restore();
  figureBack(ctx, 700, 590, 0.95, t);
  // ripples
  for (let i = 0; i < 14; i++) { const rr = rnd(i + 3); const x = rr() * W, y = 500 + rr() * 200, ph = ((t * 1.2 + rr()) % 1); ctx.strokeStyle = `rgba(200,225,255,${0.5 * (1 - ph)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, y, 30 * ph, 8 * ph, 0, 0, TAU); ctx.stroke(); }
  rainLayer(ctx, W, H, t);
  ctx.restore();
  caption(ctx, W, H, "সবাই চায় অভিজ্ঞতা… কিন্তু প্রথম সুযোগটা কে দেবে?", "Everyone wants experience… but who gives the first chance?", seg(t, 8.2, 8.7) * (1 - seg(t, 10.2, 10.6)));
}

function scenePuddle(ctx, W, H, t) {
  grad(ctx, W, H, [[0, "#0A1022"], [1, "#152040"]]);
  const k = seg(t, 10.6, 12.2);
  // puddle surface
  ctx.save(); ctx.beginPath(); ctx.ellipse(W / 2, H / 2 + 40, 560, 230, 0, 0, TAU); ctx.clip();
  grad(ctx, W, H, [[0, "#132448"], [1, "#0B1430"]]);
  glow(ctx, W / 2, H / 2, 380 * k + 40, "rgba(255,200,80,.85)", k);
  deer(ctx, lerp(W / 2 - 220, W / 2 + 60, eout(k)), H / 2 + 60, 1.6, t * 10, true);
  for (let i = 0; i < 5; i++) { const ph = ((t * 0.7 + i / 5) % 1); ctx.strokeStyle = `rgba(255,230,170,${0.6 * (1 - ph)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(W / 2 + 120, H / 2 + 30, 420 * ph, 140 * ph, 0, 0, TAU); ctx.stroke(); }
  ctx.restore();
  rainLayer(ctx, W, H, t, 120, "rgba(190,215,255,.4)");
  sfx(ctx, "ঝিক!", W / 2 + 330, 150, 90, 0.18, "#FFE36A", seg(t, 11.4, 11.8));
}

function sceneEye(ctx, W, H, t) {
  bigEye(ctx, W, H, t, seg(t, 12.2, 12.9), eout(seg(t, 12.4, 13.4)));
}

function sceneImpact(ctx, W, H, t) {
  const k = seg(t, 13.6, 14.2);
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);
  focusLines(ctx, W / 2, H / 2, W, H, t, 140, "#0B0710", 180);
  ctx.save(); const sh = (1 - k) * 14; ctx.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);
  // inverted silhouette face, determined
  ctx.filter = "grayscale(1) contrast(2.4) brightness(1.08)";
  face(ctx, W / 2, H / 2 + 50, 1.25, { determined: true, gold: true, wind: t });
  ctx.filter = "none";
  ctx.restore();
  sfx(ctx, "ধুম!", W / 2 + 300, 170, 150, -0.14, "#fff", seg(t, 13.62, 13.85));
}

function sceneRun(ctx, W, H, t) {
  const k = seg(t, 14.2, 18.6);
  const day = eout(seg(t, 14.2, 15.4));
  // sky: storm clears into dawn
  grad(ctx, W, H, [[0, `rgba(${lerp(20, 98, day)},${lerp(30, 190, day)},${lerp(70, 255, day)},1)`], [0.6, `rgba(${lerp(30, 200, day)},${lerp(40, 232, day)},${lerp(80, 255, day)},1)`], [1, `rgba(${lerp(40, 255, day)},${lerp(40, 214, day)},${lerp(70, 150, day)},1)`]]);
  glow(ctx, W * 0.8, 160, 360, "rgba(255,236,170,.8)", day);
  cloud(ctx, 1040 - t * 120 % 1600 + 400, 140, 1.4, "#FFFFFF", "#BFD9F2", "rgba(255,255,255,.9)");
  cloud(ctx, 400 - (t * 90 % 1500) + 700, 230, 1.0, "#FFFFFF", "#C9E0F5", "rgba(255,255,255,.9)");
  skyline(ctx, W, 560, "#7E95C7", 3, 0, t, "#fff", 220, t * 420);
  skyline(ctx, W, 640, "#4F6597", 8, 0, t, "#fff", 140, t * 900);
  ctx.fillStyle = "#2D3B62"; ctx.fillRect(0, 610, W, 110);
  ctx.fillStyle = "#3F5183"; for (let i = 0; i < 12; i++) { const x = ((i * 160 - t * 1400) % (W + 160) + W + 160) % (W + 160) - 160; ctx.fillRect(x, 640, 90, 8); }
  speedLinesH(ctx, W, H, t, "rgba(255,255,255,.75)", 46);
  petals(ctx, W, H, t * 1.6, 30, 9, 3);
  // golden deer leads, Rafi follows
  const dx = lerp(560, 900, eio(k)), bob = Math.abs(Math.sin(t * 8)) * 26;
  for (let i = 0; i < 18; i++) glow(ctx, dx - 40 - i * 34, 560 - bob - Math.sin(i * 0.8 + t * 6) * 10, 30 - i, "rgba(255,210,90,.75)", 1 - i / 18);
  deer(ctx, dx, 580 - bob, 1.5, t * 18, true);
  runner(ctx, lerp(200, 520, eio(k)), 640, 1.15, t * 13);
  caption(ctx, W, H, "এক সোনালি হরিণ পথ দেখাল।", "A golden deer showed the way.", seg(t, 15.0, 15.5) * (1 - seg(t, 18.0, 18.5)));
}

function sceneGates(ctx, W, H, t) {
  const k = seg(t, 18.6, 21);
  grad(ctx, W, H, [[0, "#0D0A2A"], [0.6, "#3A1E5A"], [1, "#F59E0B"]]);
  const r = rnd(4); for (let i = 0; i < 90; i++) { ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i)); ctx.fillStyle = "#fff"; ctx.fillRect(r() * W, r() * H * 0.6, 2, 2); } ctx.globalAlpha = 1;
  // hill
  ctx.fillStyle = "#130C24"; ctx.beginPath(); ctx.moveTo(0, 560); ctx.quadraticCurveTo(W / 2, 420, W, 560); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
  const gates = [[300, "#3B82F6", "JOB", "চাকরি"], [640, "#10B981", "INTERNSHIP", "ইন্টার্নশিপ"], [980, GOLD, "STARTUP", "স্টার্টআপ"]];
  gates.forEach(([gx, col, en, bn], i) => {
    const gk = back(seg(t, 18.8 + i * 0.25, 19.4 + i * 0.25)); if (gk <= 0) return;
    const gy = 470 - (i === 1 ? 40 : 0);
    ctx.save(); ctx.translate(gx, gy); ctx.scale(gk, gk);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const pill = ctx.createLinearGradient(0, -460, 0, 0); pill.addColorStop(0, "rgba(255,255,255,0)"); pill.addColorStop(1, col);
    ctx.globalAlpha = 0.45; ctx.fillStyle = pill; ctx.fillRect(-46, -460, 92, 460); ctx.restore();
    glow(ctx, 0, -90, 160, col + "AA");
    ctx.beginPath(); ctx.moveTo(-70, 0); ctx.lineTo(-70, -130); ctx.arc(0, -130, 70, Math.PI, 0); ctx.lineTo(70, 0); ctx.closePath(); inked(ctx, "rgba(255,255,255,.12)", 5, col);
    ctx.fillStyle = col; ctx.globalAlpha = 0.35; ctx.fill(); ctx.globalAlpha = 1;
    ctx.font = "800 22px 'Hind Siliguri', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.fillText(en, 0, 40);
    ctx.font = `400 26px ${BN}`; ctx.fillStyle = col; ctx.fillText(bn, 0, 74);
    ctx.restore();
  });
  // the leap — freeze frame with halftone
  const lk = seg(t, 19.6, 20.6);
  if (lk > 0) {
    const fx = lerp(420, 600, eout(lk)), fy = 560 - Math.sin(lk * Math.PI) * 220;
    runner(ctx, fx, fy, 0.75, 1.2);
    deer(ctx, fx + 180, fy - 60, 1.1, 2.0, true);
    if (lk > 0.45 && lk < 0.75) { screentone(ctx, 0, 0, W, H); focusLines(ctx, fx, fy - 100, W, H, 3, 40, "rgba(255,255,255,.28)", 300); }
  }
  caption(ctx, W, H, "তোমার পথ, তুমিই বেছে নাও।", "Choose your path.", seg(t, 19.0, 19.5) * (1 - seg(t, 20.6, 21)));
}

function sceneTitle(ctx, W, H, t) {
  const k = seg(t, 21, 21.6), idle = Math.max(0, t - 22);
  ctx.fillStyle = "#0B0710"; ctx.fillRect(0, 0, W, H);
  // diagonal slashes
  ctx.save();
  ctx.fillStyle = GOLD; ctx.beginPath(); const s1 = eout(seg(t, 21, 21.35)) * (W + 400);
  ctx.moveTo(-200, 700); ctx.lineTo(-200 + s1, 610); ctx.lineTo(-200 + s1, 650); ctx.lineTo(-200, 740); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.beginPath(); const s2 = eout(seg(t, 21.15, 21.5)) * (W + 400);
  ctx.moveTo(W + 200, 150); ctx.lineTo(W + 200 - s2, 230); ctx.lineTo(W + 200 - s2, 246); ctx.lineTo(W + 200, 166); ctx.fill();
  ctx.restore();
  petals(ctx, W, H, t, 18, 21, 0.6);
  focusLines(ctx, W / 2, 300, W, H, Math.floor(t * 4) / 4, 50, "rgba(255,194,61,.12)", 300);
  const lk = back(seg(t, 21.3, 21.9));
  if (lk > 0) {
    ctx.save(); ctx.translate(W / 2, 250 + Math.sin(idle * 1.5) * 6); ctx.scale(lk, lk);
    glow(ctx, 0, 0, 200, "rgba(255,194,61,.5)"); deerMark(ctx, 0, 0, 130); ctx.restore();
  }
  const tk = seg(t, 21.6, 22.2);
  if (tk > 0) {
    ctx.save(); ctx.globalAlpha = tk; ctx.translate(W / 2, 420); ctx.rotate(-0.04); ctx.scale(lerp(1.3, 1, eout(tk)), lerp(1.3, 1, eout(tk)));
    ctx.font = `400 120px ${BN}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
    ctx.lineWidth = 18; ctx.strokeStyle = INK; ctx.strokeText("সোনারহরিণ", 0, 0);
    ctx.lineWidth = 6; ctx.strokeStyle = "#fff"; ctx.strokeText("সোনারহরিণ", 0, 0);
    const g = ctx.createLinearGradient(0, -60, 0, 60); g.addColorStop(0, "#FFF2B8"); g.addColorStop(0.5, GOLD); g.addColorStop(1, "#E07B00");
    ctx.fillStyle = g; ctx.fillText("সোনারহরিণ", 0, 0);
    // glint sweep
    const gx = ((idle * 380) % 1400) - 700;
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.rect(gx, -70, 60, 140); ctx.clip(); ctx.fillStyle = "#fff"; ctx.fillText("সোনারহরিণ", 0, 0); ctx.restore();
    ctx.restore();
  }
  const sk = seg(t, 22.2, 22.8);
  if (sk > 0) {
    ctx.save(); ctx.globalAlpha = sk; ctx.textAlign = "center"; ctx.fillStyle = "#fff";
    ctx.font = "600 26px 'Hind Siliguri', sans-serif"; ctx.fillText("তোমার প্রথম সোনালি সুযোগ  ·  Your first golden chance", W / 2, 540);
    ctx.font = "700 15px 'Hind Siliguri', sans-serif"; ctx.fillStyle = GOLD; ctx.fillText("EPISODE 01  —  START", W / 2, 580);
    ctx.restore();
  }
  for (let i = 0; i < 6; i++) { const a = idle * 0.8 + i; star4(ctx, W / 2 + Math.cos(a) * 380, 300 + Math.sin(a * 1.3) * 150, 10 + 6 * Math.sin(idle * 3 + i), "#FFF2C0", sk); }
}

/* =============================================================== director */
/** Draw frame `t` (seconds). After STORY_LEN the title card keeps idling. */
export function drawAnime(ctx, t, W = 1280, H = 720) {
  ctx.save();
  if (t < 3.6) sceneDusk(ctx, W, H, t);
  else if (t < 7.8) sceneManga(ctx, W, H, t);
  else if (t < 10.6) sceneRain(ctx, W, H, t);
  else if (t < 12.2) scenePuddle(ctx, W, H, t);
  else if (t < 13.6) sceneEye(ctx, W, H, t);
  else if (t < 14.2) sceneImpact(ctx, W, H, t);
  else if (t < 18.6) sceneRun(ctx, W, H, t);
  else if (t < 21) sceneGates(ctx, W, H, t);
  else sceneTitle(ctx, W, H, t);
  ctx.restore();
  // cuts: quick white/black flashes between beats
  const cuts = [[3.6, "#fff"], [7.8, "#000"], [10.6, "#000"], [12.2, "#fff"], [14.2, "#fff"], [18.6, "#fff"], [21, "#000"]];
  for (const [c, col] of cuts) {
    const d = t - c;
    if (d >= 0 && d < 0.28) { ctx.globalAlpha = 1 - d / 0.28; ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }
  // cinematic vignette + fade-in
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.98);
  v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.45)");
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  const fi = 1 - seg(t, 0, 0.5);
  if (fi > 0) { ctx.fillStyle = `rgba(0,0,0,${fi})`; ctx.fillRect(0, 0, W, H); }
}
