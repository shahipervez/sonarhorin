import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLite } from "../../lite";
import { fmt } from "../../utils";

const IDEAS = ["কৃষকের অনলাইন বাজার", "বাংলা AI টিউটর", "গ্রামে ফুড ডেলিভারি", "হোম শেফ অ্যাপ", "ছাত্রদের মেস ফাইন্ডার", "রিকশা রাইড অ্যাপ",
  "মোবাইল ক্লিনিক", "হ্যান্ডমেড শপ", "পার্ট-টাইম জব অ্যাপ", "বাংলা পডকাস্ট", "সোলার ভাড়া", "লোকাল ট্যুর গাইড", "ঔষধ ডেলিভারি", "টিউশন ম্যাচিং"];
const DIE = ["ফান্ড নেই", "কেউ বিশ্বাস করেনি", "“চাকরি কর!”", "টিম ভেঙে গেছে", "ভয় পেয়েছি"];

// golden-deer constellation (normalised 0..1 in its box)
const DEER = [[0.1, 0.62], [0.28, 0.5], [0.5, 0.5], [0.66, 0.42], [0.74, 0.22], [0.86, 0.14], [0.8, 0.32], [0.92, 0.3], [0.66, 0.58], [0.6, 0.86], [0.3, 0.62], [0.26, 0.9]];
const DEER_EDGES = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [4, 6], [6, 7], [2, 8], [8, 9], [1, 10], [10, 11]];

/**
 * Startup mode: night over Dhaka. Every idea is a sky lantern (ফানুস). Most flicker out — no money, no one believed.
 * Tap one and it turns gold, rises and becomes a star in the golden-deer constellation.
 */
export default function LanternSky() {
  const rootRef = useRef(null), cvRef = useRef(null), floatRef = useRef(null), fundRef = useRef(null);
  const [toast, setToast] = useState(null);
  const lite = useLite();

  useEffect(() => {
    if (lite) return; // lite mode: static gradient, no canvas loop
    const root = rootRef.current, cv = cvRef.current, ctx = cv.getContext("2d");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W, H, dpr, bg, stars = [], lanterns = [], sparks = [], raf, last = 0, acc = 0, t = 0, visible = true, floating = 1204, funded = 27, lit = 3, box;

    function build() {
      dpr = Math.min(2, devicePixelRatio || 1);
      const r = root.getBoundingClientRect(); W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bg = document.createElement("canvas"); bg.width = W * dpr; bg.height = H * dpr;
      const b = bg.getContext("2d"); b.setTransform(dpr, 0, 0, dpr, 0, 0);
      const g = b.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#05081A"); g.addColorStop(0.55, "#151245"); g.addColorStop(0.85, "#3B1E52"); g.addColorStop(1, "#5A2A55");
      b.fillStyle = g; b.fillRect(0, 0, W, H);
      // moon
      b.fillStyle = "#FFF3C9"; b.shadowColor = "#FFF3C9"; b.shadowBlur = 40;
      b.beginPath(); b.arc(W * 0.86, H * 0.2, 26, 0, 7); b.fill(); b.shadowBlur = 0;
      b.fillStyle = "#0b0d26"; b.beginPath(); b.arc(W * 0.86 + 11, H * 0.2 - 6, 24, 0, 7); b.fill();
      // skyline
      const gy = H * 0.9; let x = -10;
      while (x < W + 20) {
        const w = 28 + Math.random() * 60, h = H * (0.06 + Math.random() * (x > W * 0.3 && x < W * 0.7 ? 0.09 : 0.2));
        b.fillStyle = "#0b0a22"; b.fillRect(x, gy - h, w, h + 4);
        if (Math.random() < 0.3) { b.fillRect(x + w * 0.4, gy - h - 14, 3, 14); }
        b.fillStyle = "rgba(255,206,120,.55)";
        for (let wy = gy - h + 8; wy < gy - 8; wy += 13) for (let wx = x + 5; wx < x + w - 6; wx += 10) if (Math.random() < 0.18) b.fillRect(wx, wy, 4, 5);
        x += w + 2;
      }
      b.fillStyle = "#07061a"; b.fillRect(0, gy, W, H - gy);
      stars = Array.from({ length: Math.round(W * H / 5000) }, () => ({ x: Math.random() * W, y: Math.random() * H * 0.7, r: Math.random() * 1.3 + 0.2, p: Math.random() * 6 }));
      const bw = Math.min(260, W * 0.3);
      box = { x: W < 700 ? W * 0.62 : W * 0.06, y: H * (W < 700 ? 0.08 : 0.16), w: bw, h: bw * 0.7 };
      lanterns = []; sparks = [];
    }
    function spawn() {
      const big = Math.random() < 0.3;
      lanterns.push({ x: W * (0.05 + Math.random() * 0.9), y: H * 0.88, vy: 18 + Math.random() * 22, ph: Math.random() * 6, s: (big ? 1.25 : 0.85) * (W < 600 ? 0.8 : 1),
        idea: IDEAS[(Math.random() * IDEAS.length) | 0], st: "rise", dieAt: H * (0.25 + Math.random() * 0.45), dies: Math.random() < 0.62, glow: 1, why: "", label: big || Math.random() < 0.35 });
      floating++; if (floatRef.current) floatRef.current.textContent = fmt(floating);
    }
    function drawLantern(l) {
      const { x, y, s } = l, gold = l.st === "funded";
      const fl = 0.85 + Math.sin(t * 13 + l.ph) * 0.08 + Math.sin(t * 7.3 + l.ph) * 0.06;
      const halo = ctx.createRadialGradient(x, y, 0, x, y, 70 * s);
      halo.addColorStop(0, gold ? `rgba(255,214,90,${0.55 * l.glow})` : `rgba(255,150,60,${0.4 * l.glow * fl})`); halo.addColorStop(1, "rgba(255,150,60,0)");
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, 70 * s, 0, 7); ctx.fill();
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(Math.sin(t * 1.3 + l.ph) * 0.06 + (l.st === "fall" ? l.rot : 0));
      const body = ctx.createLinearGradient(0, -24, 0, 22);
      if (gold) { body.addColorStop(0, "#FFF2B8"); body.addColorStop(1, "#E8B634"); }
      else if (l.glow < 0.4) { body.addColorStop(0, "#6b5a6e"); body.addColorStop(1, "#3c3046"); }
      else { body.addColorStop(0, `rgba(255,236,190,${0.6 + 0.4 * l.glow})`); body.addColorStop(1, `rgba(255,140,60,${0.5 + 0.5 * l.glow * fl})`); }
      ctx.fillStyle = body;
      ctx.beginPath(); ctx.moveTo(-15, -24); ctx.quadraticCurveTo(0, -30, 15, -24); ctx.lineTo(11, 20); ctx.quadraticCurveTo(0, 23, -11, 20); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(120,60,20,.35)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -27); ctx.lineTo(0, 21); ctx.stroke();
      if (l.glow > 0.3) { ctx.fillStyle = `rgba(255,255,220,${l.glow})`; ctx.beginPath(); ctx.ellipse(0, 24, 3, 4.5 * fl, 0, 0, 7); ctx.fill(); }
      ctx.restore();
      if (!l.label && l.st === "rise") return;
      const label = l.st === "funded" ? "Funded! 🎉" : l.why || l.idea;
      ctx.font = `600 ${W < 600 ? 10.5 : 12}px 'Hind Siliguri', Inter, sans-serif`; ctx.textAlign = "center";
      ctx.fillStyle = l.st === "funded" ? "#FFE27A" : l.why ? "rgba(255,140,140,.95)" : `rgba(255,236,200,${0.55 + 0.4 * l.glow})`;
      ctx.fillText(label, x, y + 44 * s);
    }
    const onDown = (e) => {
      const r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
      const l = lanterns.find((q) => (q.st === "rise" || q.st === "fall") && Math.hypot(q.x - mx, q.y - my) < 40 * q.s);
      if (!l) return;
      e.preventDefault();
      l.st = "funded"; l.glow = 1; l.vy = 160; l.why = "";
      for (let i = 0; i < 16; i++) sparks.push({ x: l.x, y: l.y, vx: (Math.random() - 0.5) * 120, vy: (Math.random() - 0.5) * 120, life: 0.9 });
      setToast({ at: Date.now(), idea: l.idea });
    };
    cv.addEventListener("pointerdown", onDown);

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!visible) { last = now; return; }
      const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now; t += dt;
      acc += dt; const every = (W < 600 ? 1.1 : 0.62) * (reduce ? 3 : 1);
      while (acc > every) { acc -= every; spawn(); }
      ctx.drawImage(bg, 0, 0, W, H);
      for (const s of stars) { ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.35 * Math.sin(t * 1.8 + s.p)})`; ctx.fillRect(s.x, s.y, s.r, s.r); }
      // constellation: one more star lights up per funded idea
      const pts = DEER.map(([px, py]) => [box.x + px * box.w, box.y + py * box.h]);
      ctx.strokeStyle = "rgba(232,182,52,.22)"; ctx.lineWidth = 1;
      DEER_EDGES.forEach(([a, b]) => { if (a < lit && b < lit) { ctx.beginPath(); ctx.moveTo(...pts[a]); ctx.lineTo(...pts[b]); ctx.stroke(); } });
      pts.forEach(([px, py], i) => {
        const on = i < lit; ctx.fillStyle = on ? "#FFE27A" : "rgba(255,255,255,.18)";
        if (on) { ctx.shadowColor = "#E8B634"; ctx.shadowBlur = 12; }
        ctx.beginPath(); ctx.arc(px, py, on ? 2.6 : 1.4, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      });
      for (const l of lanterns) {
        if (l.st === "rise") {
          l.y -= l.vy * dt; l.x += Math.sin(t * 0.7 + l.ph) * 12 * dt;
          if (l.dies && l.y < l.dieAt) { l.glow -= dt * 0.6; if (l.glow <= 0.15) { l.st = "fall"; l.why = DIE[(Math.random() * DIE.length) | 0]; l.rot = 0; l.vy = 0; } }
          if (l.y < -60) l.st = "gone";
        } else if (l.st === "fall") {
          l.vy += 40 * dt; l.y += l.vy * dt; l.rot = Math.sin(t * 3 + l.ph) * 0.4; l.glow = Math.max(0.1, l.glow - dt * 0.2);
          if (l.y > H * 0.92) l.st = "gone";
        } else if (l.st === "funded") {
          l.y -= l.vy * dt; l.vy += 120 * dt;
          if (Math.random() < 0.5) sparks.push({ x: l.x + (Math.random() - 0.5) * 10, y: l.y + 20, vx: 0, vy: 30, life: 0.7 });
          if (l.y < box.y + box.h * 0.5) {
            l.st = "gone"; funded++; lit = Math.min(DEER.length, lit + 1); if (lit >= DEER.length) lit = 3;
            if (fundRef.current) fundRef.current.textContent = fmt(funded);
          }
        }
        if (l.st !== "gone") drawLantern(l);
      }
      lanterns = lanterns.filter((l) => l.st !== "gone").slice(-40);
      for (const s of sparks) { s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; ctx.fillStyle = `rgba(255,226,122,${Math.max(0, s.life)})`; ctx.beginPath(); ctx.arc(s.x, s.y, 2.2, 0, 7); ctx.fill(); }
      sparks = sparks.filter((s) => s.life > 0).slice(-240);
    }
    build();
    let rt; const onResize = () => { clearTimeout(rt); rt = setTimeout(build, 200); };
    addEventListener("resize", onResize);
    const io = new IntersectionObserver((e) => (visible = e[0].isIntersecting)); io.observe(root);
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); io.disconnect(); removeEventListener("resize", onResize); clearTimeout(rt); cv.removeEventListener("pointerdown", onDown); };
  }, [lite]);

  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 5000); return () => clearTimeout(id); }, [toast]);

  return (
    <div className="hero-scene scene-startup" ref={rootRef}>
      {lite ? <div className="scene-canvas lite-sky lite-sky-startup" aria-hidden="true" /> : <canvas ref={cvRef} className="scene-canvas" aria-hidden="true" />}
      {toast && (
        <div className="rescue-toast" key={toast.at} role="status">
          <span className="ic">🏮</span>
          <div><b><span className="bn">“{toast.idea}”</span> just got funded!</b><span>Pitch yours on সোনারহরিণ — readiness score, pitch day, funding.</span></div>
          <Link to="/startup" className="btn btn-lime sm">Pitch my idea →</Link>
        </div>
      )}
    </div>
  );
}
