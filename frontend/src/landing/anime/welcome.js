/* =====================================================================
   Login welcome stage — "Tara", Sonarhorin's anime host.
   Original character (shonen-anime style): high spiky ponytail, golden
   cloth headband with the deer mark, navy jacket with gold trim.

   Modes
     intro    slides in, waves "Hi!" → opens the login card with a sparkle
     idle     breathes, blinks, eyes follow the cursor
     cover    hands over her eyes while you type a password  🙈
     peek     one hand down — peeking (password made visible)
     oops     wrong password: sweat drop, wobbly smile
     success  wink + throws a bouquet at the screen → petal burst
   ===================================================================== */

const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const eout = (k) => 1 - Math.pow(1 - k, 3);
const back = (k) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
function rnd(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

const INK = "#1A1020";
const SKIN = "#F1C4A0", SKIN_SH = "#D79A78";
const HAIR = "#1E2244", HAIR_HI = "#4B5BA8";
const JACKET = "#24305C", JACKET_SH = "#1A2346", GOLD = "#FFC23D", CREAM = "#FFF4E2";
const BNB = "'Hind Siliguri', sans-serif";

function inked(ctx, fill, lw = 4) {
  ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.stroke();
}
function glow(ctx, x, y, r, col, a = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}
function star4(ctx, x, y, r, col = "#fff", a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = col; ctx.beginPath();
  ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill(); ctx.restore();
}

/* --------------------------------------------------------------- background */
function background(ctx, W, H, t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#3B2A6B"); g.addColorStop(0.35, "#B4508A"); g.addColorStop(0.65, "#FF9A76"); g.addColorStop(1, "#FFD8A0");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  glow(ctx, W * 0.72, H * 0.78, Math.max(W, H) * 0.55, "rgba(255,214,150,.65)");
  // soft bokeh
  const r = rnd(5);
  for (let i = 0; i < 26; i++) {
    const x = r() * W, y = r() * H * 0.8, s = 20 + r() * 60, ph = r() * TAU;
    glow(ctx, x + Math.sin(t * 0.3 + ph) * 20, y + Math.cos(t * 0.25 + ph) * 14, s, ["rgba(255,236,190,.35)", "rgba(255,180,200,.3)", "rgba(200,180,255,.28)"][i % 3]);
  }
  // fairy-light string
  ctx.strokeStyle = "rgba(60,30,60,.55)"; ctx.lineWidth = 2;
  for (const [y0, sag, off] of [[H * 0.1, 70, 0], [H * 0.2, 50, 0.5]]) {
    ctx.beginPath(); ctx.moveTo(-20, y0); ctx.quadraticCurveTo(W / 2, y0 + sag * 2, W + 20, y0); ctx.stroke();
    for (let i = 0; i <= 22; i++) {
      const k = i / 22, x = lerp(-20, W + 20, k), y = (1 - k) * (1 - k) * y0 + 2 * (1 - k) * k * (y0 + sag * 2) + k * k * y0;
      const on = 0.6 + 0.4 * Math.sin(t * 2.4 + i * 1.7 + off * 9);
      glow(ctx, x, y + 6, 16, "rgba(255,214,120,.9)", on);
      ctx.fillStyle = "#FFF0C2"; ctx.beginPath(); ctx.arc(x, y + 6, 3.2, 0, TAU); ctx.fill();
    }
  }
  // floating lanterns
  for (let i = 0; i < 7; i++) {
    const k = ((t * 0.035 + i / 7) % 1), x = W * (0.08 + ((i * 0.37) % 0.9)) + Math.sin(t * 0.6 + i) * 18, y = H * (1.05 - k * 1.2);
    const a = Math.sin(k * Math.PI);
    glow(ctx, x, y, 46, "rgba(255,160,70,.7)", a);
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = "#FF9A3D"; ctx.beginPath(); ctx.roundRect(x - 11, y - 15, 22, 28, 8); ctx.fill();
    ctx.fillStyle = "rgba(255,240,200,.7)"; ctx.fillRect(x - 6, y - 9, 12, 16); ctx.restore();
  }
  // rolling hills
  ctx.fillStyle = "rgba(120,50,90,.55)"; ctx.beginPath(); ctx.moveTo(0, H * 0.8); ctx.quadraticCurveTo(W * 0.3, H * 0.7, W * 0.6, H * 0.82); ctx.quadraticCurveTo(W * 0.85, H * 0.9, W, H * 0.78); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
  ctx.fillStyle = "rgba(80,30,70,.7)"; ctx.beginPath(); ctx.moveTo(0, H * 0.9); ctx.quadraticCurveTo(W * 0.5, H * 0.8, W, H * 0.92); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
}
function krishnachura(ctx, W, t) {
  ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1); ctx.translate(Math.sin(t * 0.7) * 3, 0);
  ctx.strokeStyle = "#3A1E18"; ctx.lineCap = "round";
  ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(-20, 30); ctx.quadraticCurveTo(170, 60, 360, 14); ctx.stroke();
  ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(150, 52); ctx.quadraticCurveTo(220, 110, 280, 124); ctx.stroke();
  const r = rnd(13);
  [[60, 40], [130, 72], [210, 40], [260, 118], [320, 26], [190, 100], [20, 54]].forEach(([cx, cy]) => {
    for (let i = 0; i < 8; i++) { ctx.fillStyle = r() < 0.4 ? "#2F6B2A" : "#3E8A33"; ctx.beginPath(); ctx.ellipse(cx + (r() - 0.5) * 70, cy + (r() - 0.5) * 44, 14, 4, r() * 3, 0, TAU); ctx.fill(); }
    for (let i = 0; i < 6; i++) {
      const x = cx + (r() - 0.5) * 56, y = cy + (r() - 0.5) * 34, s = 6 + r() * 4;
      ctx.fillStyle = r() < 0.5 ? "#E8452C" : "#FF6A2B";
      for (let p = 0; p < 5; p++) { const a = p / 5 * TAU + i; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * s * 0.8, y + Math.sin(a) * s * 0.8, s * 0.7, s * 0.45, a, 0, TAU); ctx.fill(); }
    }
  });
  ctx.restore();
}
function petals(ctx, W, H, t, n = 22) {
  const r = rnd(3);
  for (let i = 0; i < n; i++) {
    const sx = r() * W * 1.3, sy = r() * H, sp = 30 + r() * 60, ph = r() * TAU, sz = 4 + r() * 5;
    const x = ((sx - t * sp * 1.2) % (W * 1.3) + W * 1.3) % (W * 1.3) - W * 0.15;
    const y = ((sy + t * sp) % (H + 40) + H + 40) % (H + 40) - 20 + Math.sin(t * 1.6 + ph) * 16;
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * 2 + ph); ctx.scale(1, 0.45 + 0.4 * Math.sin(t * 3 + ph));
    ctx.fillStyle = i % 3 ? "#F0553A" : "#FFB0C0"; ctx.beginPath(); ctx.ellipse(0, 0, sz, sz * 0.6, 0, 0, TAU); ctx.fill(); ctx.restore();
  }
}

/* --------------------------------------------------------------- bouquet */
export function bouquet(ctx, x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  // stems peek out of the wrap
  ctx.strokeStyle = "#2F7A35"; ctx.lineWidth = 5; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 4, 70); ctx.lineTo(i * 6, 110); ctx.stroke(); }
  // leaves
  ctx.fillStyle = "#3E9A44";
  [[-46, -6, -0.9], [46, -8, 0.9], [-30, -40, -0.5], [34, -42, 0.6]].forEach(([a, b, r2]) => { ctx.beginPath(); ctx.ellipse(a, b, 24, 9, r2, 0, TAU); ctx.fill(); });
  // flowers
  const rose = (fx, fy, r, c1, c2) => {
    ctx.beginPath(); ctx.arc(fx, fy, r, 0, TAU); inked(ctx, c1, 2.5);
    ctx.strokeStyle = c2; ctx.lineWidth = 2.4;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(fx + 1, fy + 1, r * (0.75 - i * 0.22), i, i + 4.2); ctx.stroke(); }
  };
  const daisy = (fx, fy, r) => {
    ctx.fillStyle = "#fff"; for (let p = 0; p < 9; p++) { const a = p / 9 * TAU; ctx.beginPath(); ctx.ellipse(fx + Math.cos(a) * r * 0.7, fy + Math.sin(a) * r * 0.7, r * 0.45, r * 0.2, a, 0, TAU); ctx.fill(); }
    ctx.fillStyle = "#FFC23D"; ctx.beginPath(); ctx.arc(fx, fy, r * 0.32, 0, TAU); ctx.fill();
  };
  rose(-24, -30, 20, "#E8455A", "#A51E37"); rose(22, -36, 22, "#FF7AA2", "#C93D6B"); rose(0, -60, 19, "#E8455A", "#A51E37");
  daisy(-44, -48, 18); daisy(42, -66, 17); daisy(4, -20, 15);
  rose(-8, -84, 15, "#FFB347", "#D97A10");
  ctx.fillStyle = "#FF6A2B"; [[30, -10], [-36, -8], [16, -88]].forEach(([a, b]) => { for (let p = 0; p < 5; p++) { const an = p / 5 * TAU; ctx.beginPath(); ctx.ellipse(a + Math.cos(an) * 6, b + Math.sin(an) * 6, 5, 3, an, 0, TAU); ctx.fill(); } });
  // wrapping paper cone
  ctx.beginPath(); ctx.moveTo(-58, -14); ctx.lineTo(58, -18); ctx.lineTo(10, 86); ctx.lineTo(-10, 86); ctx.closePath(); inked(ctx, "#FFD6E2", 3.5);
  ctx.beginPath(); ctx.moveTo(-58, -14); ctx.lineTo(-20, -6); ctx.lineTo(-10, 86); ctx.closePath(); ctx.fillStyle = "rgba(220,140,170,.45)"; ctx.fill();
  // gold ribbon + bow
  ctx.fillStyle = GOLD; ctx.fillRect(-22, 40, 44, 10);
  ctx.beginPath(); ctx.ellipse(-16, 44, 16, 9, -0.4, 0, TAU); inked(ctx, GOLD, 2.5);
  ctx.beginPath(); ctx.ellipse(16, 44, 16, 9, 0.4, 0, TAU); inked(ctx, GOLD, 2.5);
  ctx.beginPath(); ctx.moveTo(-4, 48); ctx.lineTo(-14, 76); ctx.lineTo(-4, 70); ctx.moveTo(4, 48); ctx.lineTo(14, 76); ctx.lineTo(4, 70); ctx.strokeStyle = "#E0A010"; ctx.lineWidth = 4; ctx.stroke();
  ctx.restore();
}

/* --------------------------------------------------------------- Tara */
function hand(ctx, x, y, rot, open = 1, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  for (let i = 0; i < 4; i++) {
    const a = -0.5 + i * 0.33 * open;
    ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.roundRect(-6, -48, 12, 34, 6); inked(ctx, SKIN, 3); ctx.restore();
  }
  ctx.save(); ctx.rotate(-1.3); ctx.beginPath(); ctx.roundRect(-6, -38, 12, 26, 6); inked(ctx, SKIN, 3); ctx.restore();
  ctx.beginPath(); ctx.ellipse(0, -6, 22, 20, 0, 0, TAU); inked(ctx, SKIN, 3);
  ctx.restore();
}
function armSeg(ctx, pts, col, w) {
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.strokeStyle = INK; ctx.lineWidth = w + 7; ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.stroke();
}
function drawArm(ctx, sh, a) {
  armSeg(ctx, [sh, a.e, a.h], JACKET, 40);
  // gold cuff
  const dx = a.h[0] - a.e[0], dy = a.h[1] - a.e[1], d = Math.hypot(dx, dy) || 1;
  const cx = a.h[0] - (dx / d) * 18, cy = a.h[1] - (dy / d) * 18;
  ctx.strokeStyle = GOLD; ctx.lineWidth = 10; ctx.lineCap = "butt";
  ctx.beginPath(); ctx.moveTo(cx - (dy / d) * 21, cy + (dx / d) * 21); ctx.lineTo(cx + (dy / d) * 21, cy - (dx / d) * 21); ctx.stroke();
  hand(ctx, a.h[0], a.h[1], a.rot, a.open);
}

function face(ctx, st, t) {
  const { look = [0, 0], expr = "smile", blink = 0 } = st;
  // face
  ctx.beginPath(); ctx.moveTo(-92, -30); ctx.bezierCurveTo(-94, 40, -56, 100, 0, 128); ctx.bezierCurveTo(56, 100, 94, 40, 92, -30);
  ctx.bezierCurveTo(88, -120, -88, -120, -92, -30); inked(ctx, SKIN, 5);
  ctx.save(); ctx.clip(); ctx.fillStyle = SKIN_SH; ctx.globalAlpha = 0.45;
  ctx.beginPath(); ctx.moveTo(-120, -40); ctx.quadraticCurveTo(0, 0, 120, -40); ctx.lineTo(120, -90); ctx.lineTo(-120, -90); ctx.fill(); ctx.restore();
  // blush
  ctx.fillStyle = "rgba(255,120,140,.35)"; ctx.beginPath(); ctx.ellipse(-54, 58, 22, 11, 0, 0, TAU); ctx.ellipse(54, 58, 22, 11, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = "rgba(230,90,110,.5)"; ctx.lineWidth = 2.5; for (const sx of [-66, 42]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(sx + i * 9, 64); ctx.lineTo(sx + i * 9 + 6, 54); ctx.stroke(); }
  // eyes
  const eyeAt = (x, side, closedHappy, winkClosed) => {
    ctx.save(); ctx.translate(x, 16); ctx.scale(side, 1);
    if (closedHappy || winkClosed || blink > 0.6) {
      ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath();
      if (closedHappy) ctx.arc(0, 14, 26, Math.PI * 1.15, Math.PI * 1.85); else ctx.moveTo(-30, 8), ctx.quadraticCurveTo(0, 18, 32, 4);
      ctx.stroke();
      ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(30, -4); ctx.lineTo(42, -12); ctx.stroke();
      ctx.restore(); return;
    }
    ctx.beginPath(); ctx.moveTo(-34, 6); ctx.bezierCurveTo(-30, -30, 28, -36, 38, -4); ctx.bezierCurveTo(30, 30, -24, 38, -34, 6);
    ctx.fillStyle = "#FDFBFF"; ctx.fill(); ctx.save(); ctx.clip();
    const lx = look[0] * side * 7, ly = look[1] * 5;
    const g = ctx.createLinearGradient(0, -26, 0, 32); g.addColorStop(0, "#4A2604"); g.addColorStop(0.55, "#D98A12"); g.addColorStop(1, "#FFE08A");
    ctx.beginPath(); ctx.ellipse(2 + lx, 6 + ly, 24, 30, 0, 0, TAU); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = "#2A1404"; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(2 + lx, 4 + ly, 10, 13, 0, 0, TAU); ctx.fillStyle = "#1A0C02"; ctx.fill();
    ctx.fillStyle = "rgba(70,40,110,.3)"; ctx.fillRect(-40, -36, 80, 14);
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(-8 + lx, -8 + ly, 9, 11, -0.4, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(12 + lx, 20 + ly, 4, 0, TAU); ctx.fill();
    star4(ctx, 10 + lx, -2 + ly, 6, "#FFF6D5", 0.9);
    ctx.restore();
    // lashes (long, feminine flicks)
    ctx.beginPath(); ctx.moveTo(-38, 8); ctx.bezierCurveTo(-32, -34, 28, -40, 44, -8); ctx.lineTo(54, -20); ctx.lineTo(46, -2); ctx.bezierCurveTo(26, -28, -26, -26, -34, 10); ctx.closePath(); ctx.fillStyle = INK; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(40, -12); ctx.lineTo(54, -8); ctx.moveTo(36, -18); ctx.lineTo(50, -24); ctx.stroke();
    ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-18, 32); ctx.quadraticCurveTo(10, 36, 30, 20); ctx.stroke();
    ctx.restore();
  };
  const happy = expr === "happy", wink = expr === "wink";
  eyeAt(-44, -1, happy, false);
  eyeAt(46, 1, happy, wink);
  // brows
  ctx.strokeStyle = HAIR; ctx.lineWidth = 4.5; ctx.lineCap = "round";
  const by = expr === "oops" ? -6 : 0;
  ctx.beginPath(); ctx.moveTo(-74, -32 + by); ctx.quadraticCurveTo(-46, -46, -20, -36 - by); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(74, -32 + by); ctx.quadraticCurveTo(46, -46, 22, -36 - by); ctx.stroke();
  // nose
  ctx.strokeStyle = SKIN_SH; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(4, 54); ctx.lineTo(8, 66); ctx.stroke();
  // mouth
  if (expr === "smile" || expr === "happy" || expr === "wink") {
    ctx.beginPath(); ctx.moveTo(-22, 88); ctx.quadraticCurveTo(0, 86, 22, 88); ctx.quadraticCurveTo(0, 118, -22, 88); inked(ctx, "#B83A4E", 3.5);
    ctx.fillStyle = "#FF8FA0"; ctx.beginPath(); ctx.ellipse(0, 104, 9, 5, 0, 0, TAU); ctx.fill();
  } else if (expr === "oops") {
    ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(-16, 98);
    for (let i = 0; i < 4; i++) ctx.quadraticCurveTo(-12 + i * 9, i % 2 ? 92 : 104, -8 + i * 9, 98); ctx.stroke();
  } else {
    ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(-12, 96); ctx.quadraticCurveTo(0, 104, 12, 96); ctx.stroke();
  }
}

/** Draw Tara. Origin = bottom-centre of the half-body frame; s=1 → ~780px tall. */
function tara(ctx, x, y, s, st, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const breathe = Math.sin(t * 2) * 3;
  // ponytail (behind) — big spiky shonen ponytail swinging
  ctx.save(); ctx.translate(70, -640 + breathe); ctx.rotate(0.35 + Math.sin(t * 1.6) * 0.08);
  ctx.beginPath(); ctx.moveTo(0, 0);
  const spikes = [[150, 40], [110, 70], [190, 120], [120, 140], [170, 220], [90, 200], [110, 300], [50, 230], [20, 120]];
  spikes.forEach(([a, b], i) => ctx.lineTo(a + Math.sin(t * 2.4 + i) * 6, b));
  ctx.closePath(); inked(ctx, HAIR, 5);
  ctx.strokeStyle = HAIR_HI; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(30, 40); ctx.quadraticCurveTo(90, 90, 100, 180); ctx.stroke();
  ctx.restore();
  // back hair falling past the shoulders
  ctx.beginPath(); ctx.moveTo(-150, -520 + breathe);
  [[-170, -400], [-150, -380], [-176, -300], [-140, -310], [-150, -230], [-110, -280]].forEach(([a, b]) => ctx.lineTo(a, b + breathe));
  ctx.lineTo(110, -280 + breathe);
  [[150, -230], [140, -310], [176, -300], [150, -380], [170, -400], [150, -520]].forEach(([a, b]) => ctx.lineTo(a, b + breathe));
  ctx.closePath(); inked(ctx, HAIR, 5);
  // headband tails flowing
  ctx.save(); ctx.translate(-120, -590 + breathe);
  for (let i = 0; i < 2; i++) {
    ctx.beginPath(); ctx.moveTo(0, i * 14);
    ctx.bezierCurveTo(-60, 10 + i * 20 + Math.sin(t * 3 + i) * 14, -110, 40 + i * 30, -160, 30 + i * 40 + Math.sin(t * 3.4 + i) * 24);
    ctx.lineTo(-150, 50 + i * 40 + Math.sin(t * 3.4 + i) * 24); ctx.bezierCurveTo(-100, 60 + i * 30, -50, 30 + i * 20, 0, 18 + i * 14); ctx.closePath();
    inked(ctx, GOLD, 3.5);
  }
  ctx.restore();
  // torso
  ctx.save(); ctx.translate(0, breathe * 0.5);
  ctx.beginPath(); ctx.moveTo(-96, 0); ctx.lineTo(-110, -220); ctx.quadraticCurveTo(-130, -296, -66, -312); ctx.lineTo(66, -312); ctx.quadraticCurveTo(130, -296, 110, -220); ctx.lineTo(96, 0); ctx.closePath();
  inked(ctx, JACKET, 5);
  ctx.beginPath(); ctx.moveTo(-34, -312); ctx.lineTo(0, -200); ctx.lineTo(34, -312); ctx.closePath(); inked(ctx, CREAM, 4);
  ctx.strokeStyle = GOLD; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(-34, -310); ctx.lineTo(-6, -200); ctx.lineTo(-10, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(34, -310); ctx.lineTo(6, -200); ctx.lineTo(10, 0); ctx.stroke();
  ctx.fillStyle = JACKET_SH; ctx.beginPath(); ctx.moveTo(60, -300); ctx.quadraticCurveTo(120, -280, 104, -200); ctx.lineTo(96, 0); ctx.lineTo(70, 0); ctx.fill();
  // gold deer pin
  ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(-64, -230, 11, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.restore();
  // neck
  ctx.beginPath(); ctx.roundRect(-26, -360 + breathe, 52, 60, 12); inked(ctx, SKIN, 4);
  ctx.fillStyle = SKIN_SH; ctx.fillRect(-24, -334 + breathe, 48, 14);
  // head
  ctx.save(); ctx.translate(0, -470 + breathe); ctx.rotate(st.tilt || 0);
  face(ctx, st, t);
  // spiky bangs (the headband sits on top of them)
  ctx.beginPath(); ctx.moveTo(-118, -40);
  [[-100, 30], [-86, -34], [-62, 20], [-44, -40], [-20, 8], [0, -44], [22, 10], [44, -40], [64, 22], [86, -32], [104, 34], [120, -40]].forEach(([a, b], i) => {
    const sw = Math.sin(t * 1.8 + i) * 3; ctx.lineTo(a + sw, b);
  });
  ctx.bezierCurveTo(150, -200, -150, -200, -118, -40); ctx.closePath(); inked(ctx, HAIR, 5);
  // glossy shine, kept inside the bangs
  ctx.save(); ctx.clip();
  ctx.strokeStyle = HAIR_HI; ctx.lineWidth = 9; ctx.lineCap = "round";
  ctx.beginPath(); ctx.ellipse(0, -96, 96, 46, 0, Math.PI * 1.2, Math.PI * 1.45); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, -96, 96, 46, 0, Math.PI * 1.55, Math.PI * 1.8); ctx.stroke();
  ctx.restore();
  // headband across the forehead with a metal plate + deer mark
  ctx.beginPath(); ctx.moveTo(-112, -78); ctx.quadraticCurveTo(0, -112, 112, -78); ctx.lineTo(110, -52); ctx.quadraticCurveTo(0, -84, -110, -52); ctx.closePath(); inked(ctx, GOLD, 4);
  ctx.beginPath(); ctx.roundRect(-42, -104, 84, 42, 8); inked(ctx, "#D7DCE8", 3.5);
  ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.fillRect(-36, -100, 30, 5);
  ctx.save(); ctx.translate(0, -83); ctx.scale(0.75, 0.75); ctx.translate(-20, -20);
  ctx.strokeStyle = "#7A4300"; ctx.fillStyle = "#B7791F"; ctx.lineWidth = 2.8; ctx.lineCap = "round";
  ctx.stroke(new Path2D("M14 15c-2-3-5-5-6-9M10 9l-4-1M12 12l-5 1M26 15c2-3 5-5 6-9M30 9l4-1M28 12l5 1"));
  ctx.fill(new Path2D("M13 15c2-1.5 4.5-2 7-2s5 .5 7 2c1 3-1 6-2.5 9.5L22 34c-.6 1.4-3.4 1.4-4 0l-2.5-9.5C14 21 12 18 13 15z"));
  ctx.restore();
  // side locks
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 92, -30); ctx.quadraticCurveTo(sd * 118, 60, sd * 104, 150 + Math.sin(t * 2 + sd) * 6); ctx.quadraticCurveTo(sd * 96, 60, sd * 78, -6); ctx.closePath(); inked(ctx, HAIR, 4); }
  // sweat drop
  if (st.expr === "oops") { ctx.beginPath(); ctx.moveTo(108, -60); ctx.quadraticCurveTo(128, -14, 110, 2); ctx.quadraticCurveTo(90, -14, 108, -60); inked(ctx, "#9ED8FF", 3); }
  ctx.restore();
  // arms (on top)
  const shL = [-104, -286 + breathe], shR = [104, -286 + breathe];
  drawArm(ctx, shL, st.armL);
  drawArm(ctx, shR, st.armR);
  ctx.restore();
}

/* --------------------------------------------------------------- poses */
const POSES = {
  down: { L: { e: [-150, -170], h: [-130, -60], rot: 3.0, open: 0.6 }, R: { e: [150, -170], h: [130, -60], rot: -3.0, open: 0.6 } },
  wave: { L: { e: [-230, -320], h: [-250, -500], rot: -0.3, open: 1 }, R: { e: [150, -170], h: [130, -60], rot: -3.0, open: 0.6 } },
  offer: { L: { e: [-150, -170], h: [-130, -60], rot: 3.0, open: 0.6 }, R: { e: [230, -260], h: [330, -330], rot: 1.35, open: 1 } },
  cover: { L: { e: [-170, -330], h: [-46, -470], rot: 0.5, open: 0.9 }, R: { e: [170, -330], h: [48, -470], rot: -0.5, open: 0.9 } },
  peek: { L: { e: [-170, -330], h: [-46, -470], rot: 0.5, open: 0.9 }, R: { e: [170, -250], h: [110, -380], rot: -0.9, open: 0.9 } },
  oops: { L: { e: [-170, -300], h: [-110, -560], rot: 0.2, open: 0.7 }, R: { e: [150, -170], h: [130, -60], rot: -3.0, open: 0.6 } },
  windup: { L: { e: [-150, -170], h: [-130, -60], rot: 3.0, open: 0.6 }, R: { e: [200, -420], h: [150, -620], rot: 0.4, open: 0.4 } },
  throw: { L: { e: [-150, -170], h: [-130, -60], rot: 3.0, open: 0.6 }, R: { e: [180, -320], h: [210, -440], rot: 1.2, open: 1 } },
};
const SAY = {
  hi: ["Hi! 👋", "Hi! 👋"], welcome: ["Welcome to Sonarhorin!", "সোনারহরিণে স্বাগতম!"], cover: ["I'm not looking! 🙈", "আমি দেখছি না! 🙈"],
  peek: ["…just a tiny peek 👀", "একটুখানি দেখি… 👀"], oops: ["Oops! Try again", "উফ! আবার চেষ্টা করো"], yay: ["Congratulations! 💐", "অভিনন্দন! 💐"],
};

/* --------------------------------------------------------------- engine */
export function createWelcome(canvas, { L = 0, onOpenCard, reduced = false, fxCanvas = null } = {}) {
  const ctx = canvas.getContext("2d");
  const fx = fxCanvas ? fxCanvas.getContext("2d") : ctx;
  let W = 0, H = 0, dpr = 1, raf = 0, t0 = performance.now();
  let mode = reduced ? "idle" : "intro", modeAt = 0, opened = reduced, look = [0, 0], lookT = [0, 0];
  let say = reduced ? "welcome" : null, sayAt = 0, nextBlink = 2;
  const arms = JSON.parse(JSON.stringify(POSES.down));
  let fly = null, burst = [], flash = 0, onThrown = null;

  const resize = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    if (fxCanvas) { fxCanvas.width = innerWidth * dpr; fxCanvas.height = innerHeight * dpr; }
  };
  resize(); addEventListener("resize", resize);
  const onMove = (e) => { lookT = [clamp((e.clientX / W - 0.3) * 2, -1, 1), clamp((e.clientY / H - 0.4) * 2, -1, 1)]; };
  addEventListener("pointermove", onMove, { passive: true });
  if (reduced && onOpenCard) setTimeout(onOpenCard, 0);

  const layout = () => {
    const mobile = W < 860;
    const s = mobile ? Math.min(W / 760, H / 1400) : Math.min(H / 980, W / 1500);
    const x = mobile ? W * 0.5 : Math.max(W * 0.24, 300 * s);
    const y = mobile ? H * 0.42 : H + 10;
    return { s, x, y, mobile };
  };

  const setSay = (k, t) => { say = k; sayAt = t; };

  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    const t = (now - t0) / 1000, mt = t - modeAt;
    // --- choreography
    let pose = "down", expr = "smile", tilt = 0;
    if (mode === "intro") {
      if (mt < 0.5) pose = "down";
      else if (mt < 2.6) { pose = "wave"; expr = mt < 1.4 ? "happy" : "smile"; if (!say) setSay("hi", t); }
      else { pose = "offer"; if (say === "hi") setSay("welcome", t); }
      if (mt > 2.9 && !opened) { opened = true; onOpenCard?.(); }
      if (mt > 4.2) { mode = "idle"; modeAt = t; }
    } else if (mode === "idle") { pose = Math.sin(t * 0.5) > 0.96 ? "wave" : "down"; tilt = Math.sin(t * 0.7) * 0.03; }
    else if (mode === "cover") { pose = "cover"; expr = "smile"; tilt = -0.05; }
    else if (mode === "peek") { pose = "peek"; expr = "wink"; tilt = 0.06; }
    else if (mode === "oops") { pose = "oops"; expr = "oops"; tilt = 0.08; if (mt > 2.4) { mode = "idle"; modeAt = t; } }
    else if (mode === "success") {
      pose = mt < 0.45 ? "windup" : "throw"; expr = mt < 0.45 ? "happy" : "wink";
      if (mt > 0.42 && !fly) {
        const { s, x, y } = layout();
        fly = { t: t, x0: x + 210 * s, y0: y - 470 * s, s0: 0.9 * s };
      }
    }
    if (mode === "intro" && mt > 0.3 && mt < 2.6) {
      // waving: rotate the raised hand back and forth
      POSES.wave.L.h = [-250 + Math.sin(mt * 11) * 26, -500 + Math.abs(Math.cos(mt * 11)) * 8];
      POSES.wave.L.rot = -0.3 + Math.sin(mt * 11) * 0.35;
    }
    const target = POSES[pose];
    const k = mode === "success" && mt > 0.42 ? 0.45 : 0.16;
    for (const side of ["L", "R"]) for (const key of ["e", "h"]) { arms[side][key][0] = lerp(arms[side][key][0], target[side][key][0], k); arms[side][key][1] = lerp(arms[side][key][1], target[side][key][1], k); }
    for (const side of ["L", "R"]) { arms[side].rot = lerp(arms[side].rot, target[side].rot, k); arms[side].open = lerp(arms[side].open, target[side].open, k); }
    look = [lerp(look[0], lookT[0], 0.08), lerp(look[1], lookT[1], 0.08)];
    let blink = 0;
    if (t > nextBlink) { blink = 1; if (t > nextBlink + 0.12) nextBlink = t + 2.5 + Math.random() * 2.5; }

    // --- draw
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    background(ctx, W, H, t);
    krishnachura(ctx, W, t);
    petals(ctx, W, H, t);
    const { s, x, y, mobile } = layout();
    const enter = mode === "intro" ? eout(clamp(mt / 0.8)) : 1;
    ctx.save(); ctx.globalAlpha = enter; ctx.translate(-(1 - enter) * 160 * s, (1 - enter) * 60 * s);
    glow(ctx, x, y - 420 * s, 520 * s, "rgba(255,230,180,.45)");
    tara(ctx, x, y, s, { armL: arms.L, armR: arms.R, expr, tilt, look, blink }, t);
    // sparkle from the offering hand when the card opens
    if (mode === "intro" && mt > 2.6 && mt < 3.8) {
      const hx = x + arms.R.h[0] * s, hy = y + arms.R.h[1] * s, kk = clamp((mt - 2.6) / 1.2);
      glow(ctx, hx, hy, 160 * s * (1 - kk) + 40 * s, "rgba(255,214,120,.9)", 1 - kk);
      for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + mt * 3; star4(ctx, hx + Math.cos(a) * 160 * s * kk, hy + Math.sin(a) * 120 * s * kk, 14 * s * (1 - kk) + 4, "#FFF4C8", 1 - kk); }
    }
    ctx.restore();

    // --- speech bubble
    if (say) {
      const bk = back(clamp((t - sayAt) / 0.35));
      const txt = SAY[say][L];
      ctx.font = `700 ${mobile ? 15 : Math.round(Math.max(18, 30 * s))}px ${BNB}`;
      const w = ctx.measureText(txt).width + 44, h = mobile ? 40 : Math.max(44, 64 * s);
      // desktop: above-right of her head · mobile: across her chest, clear of the face and the card
      let bx = mobile ? x : x + 140 * s, by = mobile ? y - 150 * s : y - 760 * s;
      bx = clamp(bx, w / 2 + 10, W - w / 2 - 10);
      ctx.save(); ctx.translate(bx, by); ctx.scale(bk, bk);
      ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, h / 2);
      ctx.moveTo(-14, h / 2 - 2); ctx.lineTo(-30, h / 2 + 22); ctx.lineTo(6, h / 2 - 2);
      ctx.fillStyle = "#fff"; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(txt, 0, 2);
      ctx.restore();
    }

    // --- bouquet flight + burst (drawn on the top-most fx canvas so it flies over the login card)
    if (fxCanvas) { fx.setTransform(dpr, 0, 0, dpr, 0, 0); fx.clearRect(0, 0, innerWidth, innerHeight); }
    const off = fxCanvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
    const FW = fxCanvas ? innerWidth : W, FH = fxCanvas ? innerHeight : H;
    if (fly) {
      const fk = clamp((t - fly.t) / 0.85);
      const e = fk * fk;
      const bx = lerp(fly.x0 + off.left, FW / 2, eout(fk)), byy = lerp(fly.y0 + off.top, FH * 0.45, eout(fk)) - Math.sin(fk * Math.PI) * 160 * s;
      if (fk < 1) {
        bouquet(fx, bx, byy, lerp(fly.s0, 7, e), -0.4 + fk * 5.2);
      } else if (!burst.length) {
        flash = 1;
        const r = rnd(Math.floor(t * 1000) % 99991 + 1);
        for (let i = 0; i < 220; i++) {
          const a = r() * TAU, sp = 300 + r() * 1100;
          burst.push({ x: FW / 2, y: FH * 0.45, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 200, rot: r() * TAU, vr: (r() - 0.5) * 10, size: 6 + r() * 12,
            col: ["#E8455A", "#FF7AA2", "#FFC23D", "#fff", "#FF6A2B", "#3E9A44", "#B9A6FF"][i % 7], kind: i % 3, born: t });
        }
        setSay("yay", t);
        setTimeout(() => onThrown?.(), 1500);
      }
    }
    if (burst.length) {
      const dt = 1 / 60;
      burst.forEach((p) => {
        p.vy += 900 * dt; p.vx *= 0.985; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        const age = t - p.born; fx.save(); fx.globalAlpha = clamp(1.8 - age); fx.translate(p.x, p.y); fx.rotate(p.rot); fx.fillStyle = p.col;
        if (p.kind === 0) { fx.beginPath(); fx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, TAU); fx.fill(); }
        else if (p.kind === 1) fx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        else star4(fx, 0, 0, p.size * 0.8, p.col);
        fx.restore();
      });
    }
    if (flash > 0) { fx.fillStyle = `rgba(255,248,230,${flash * 0.85})`; fx.fillRect(0, 0, FW, FH); flash = Math.max(0, flash - 0.06); }
  };
  raf = requestAnimationFrame(frame);

  return {
    setMode(m) {
      if (m === mode || mode === "success") return;
      if (mode === "intro" && m !== "success") { if (!opened) { opened = true; onOpenCard?.(); } }
      mode = m; modeAt = (performance.now() - t0) / 1000;
      const t = modeAt;
      if (m === "cover") setSay("cover", t); else if (m === "peek") setSay("peek", t); else if (m === "oops") setSay("oops", t);
      else if (m === "idle") say = say === "welcome" ? say : null;
    },
    skipIntro() { if (mode === "intro") { this.setMode("idle"); setSay("welcome", (performance.now() - t0) / 1000); } },
    celebrate(cb) { onThrown = cb; mode = "success"; modeAt = (performance.now() - t0) / 1000; say = null; if (reduced) setTimeout(cb, 300); },
    destroy() { cancelAnimationFrame(raf); removeEventListener("resize", resize); removeEventListener("pointermove", onMove); },
  };
}
