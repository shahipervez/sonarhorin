import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";

/**
 * Visual effect for the moment the girl in /wallpaper.mp4 pulls the curtain aside and peeks in.
 * Drawn on a full-screen canvas over the video:
 *  1. a light seam tears open at the right edge (the "curtain"),
 *  2. golden shards spray out with her hand,
 *  3. a shockwave + red lens glint lands on her eye when she settles.
 * `fire()` restarts it. Position is computed from the real video box (object-fit: contain).
 */
const EYE = { x: 0.835, y: 0.31 }; // her eye, as a fraction of the video frame
const DUR = 2.1; // seconds

const GateFX = forwardRef(function GateFX({ videoRef }, ref) {
  const cv = useRef(null);
  const st = useRef({ t0: -1, shards: [] });

  const box = () => {
    const v = videoRef.current, c = cv.current;
    const W = c.width, H = c.height;
    const vw = v?.videoWidth || 3840, vh = v?.videoHeight || 2160;
    const s = Math.min(W / vw, H / vh);
    const w = vw * s, h = vh * s;
    return { x: (W - w) / 2, y: (H - h) / 2, w, h, W, H };
  };

  useImperativeHandle(ref, () => ({
    fire() {
      const c = cv.current; if (!c) return;
      const b = box();
      const seamX = b.x + b.w * 0.985;
      const shards = [];
      for (let i = 0; i < 70; i++) {
        const a = Math.PI + (Math.random() - 0.5) * 1.5;
        const sp = 5 + Math.random() * 13;
        shards.push({
          x: seamX, y: b.y + b.h * (0.18 + Math.random() * 0.45),
          vx: Math.cos(a) * sp * (b.W / 1600), vy: Math.sin(a) * sp * (b.W / 1600) - 1.5,
          r: 1 + Math.random() * 2.6, life: 0.6 + Math.random() * 0.9,
          gold: Math.random() > 0.35, rot: Math.random() * 6,
        });
      }
      st.current = { t0: performance.now(), shards };
      const v = videoRef.current;
      if (v) { v.classList.remove("fx-hit"); void v.offsetWidth; v.classList.add("fx-hit"); }
    },
  }));

  useEffect(() => {
    const c = cv.current; const ctx = c.getContext("2d");
    let raf;
    const resize = () => { const d = Math.min(2, window.devicePixelRatio || 1); c.width = innerWidth * d; c.height = innerHeight * d; };
    resize(); addEventListener("resize", resize);
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const S = st.current;
      ctx.clearRect(0, 0, c.width, c.height);
      if (S.t0 < 0) return;
      const t = (now - S.t0) / 1000;
      if (t > DUR) { S.t0 = -1; return; }
      const b = box();
      const k = c.width / 1600;
      const seamX = b.x + b.w * 0.985;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      // 1 — the curtain seam: a vertical tear of light that opens then closes
      const open = t < 0.35 ? t / 0.35 : Math.max(0, 1 - (t - 0.35) / 0.9);
      if (open > 0) {
        const wid = 260 * k * open;
        const g = ctx.createLinearGradient(seamX - wid, 0, seamX + 30 * k, 0);
        g.addColorStop(0, "rgba(255,190,90,0)");
        g.addColorStop(0.75, `rgba(255,214,140,${0.35 * open})`);
        g.addColorStop(0.97, `rgba(255,255,255,${0.95 * open})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(seamX - wid, b.y, wid + 30 * k, b.h);
        // warm bloom where the curtain parts
        const bl = ctx.createRadialGradient(seamX, b.y + b.h * 0.38, 0, seamX, b.y + b.h * 0.38, 520 * k);
        bl.addColorStop(0, `rgba(255,220,150,${0.55 * open})`);
        bl.addColorStop(1, "rgba(255,160,60,0)");
        ctx.fillStyle = bl;
        ctx.fillRect(seamX - 520 * k, b.y + b.h * 0.38 - 520 * k, 1040 * k, 1040 * k);
        // flickering filaments along the seam
        ctx.strokeStyle = `rgba(255,240,200,${0.8 * open})`;
        ctx.lineWidth = 1.5 * k;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          for (let y = b.y; y <= b.y + b.h; y += 18 * k) {
            const x = seamX - 6 * k - Math.abs(Math.sin(y * 0.02 + t * 30 + i * 2)) * 16 * k * open;
            y === b.y ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }

      // light sweep: the opened curtain throws a soft band of light across the screen
      const sw = (t - 0.1) / 0.9;
      if (sw > 0 && sw < 1) {
        const x = seamX - sw * b.W * 1.05, bw = 240 * k;
        const lg = ctx.createLinearGradient(x - bw, 0, x + bw, 0);
        lg.addColorStop(0, "rgba(255,210,140,0)");
        lg.addColorStop(0.5, `rgba(255,225,170,${0.22 * (1 - sw)})`);
        lg.addColorStop(1, "rgba(255,210,140,0)");
        ctx.fillStyle = lg;
        ctx.fillRect(x - bw, 0, bw * 2, b.H);
      }

      // 2 — shards thrown out with the hand
      S.shards.forEach((p) => {
        const age = t - 0.12; if (age < 0 || age > p.life) return;
        const f = 1 - age / p.life;
        p.x += p.vx; p.y += p.vy; p.vy += 0.06 * k; p.vx *= 0.985; p.rot += 0.2;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.gold ? `rgba(255,200,90,${f})` : `rgba(255,255,255,${f})`;
        ctx.fillRect(-p.r * 3 * k, -p.r * 0.6 * k, p.r * 6 * k, p.r * 1.2 * k);
        ctx.restore();
      });

      // 3 — shockwave + red glint on her eye as she settles (~0.75s after the hand appears)
      const ex = b.x + b.w * EYE.x, ey = b.y + b.h * EYE.y;
      const w = (t - 0.7) / 0.9;
      if (w > 0 && w < 1) {
        for (let i = 0; i < 2; i++) {
          const ww = w - i * 0.12; if (ww <= 0) continue;
          ctx.strokeStyle = `rgba(255,${i ? 80 : 220},${i ? 80 : 180},${(1 - ww) * 0.75})`;
          ctx.lineWidth = (6 - i * 2) * k * (1 - ww);
          ctx.beginPath(); ctx.arc(ex, ey, 30 * k + ww * 520 * k, 0, Math.PI * 2); ctx.stroke();
        }
      }
      const gl = t > 0.7 ? Math.max(0, 1 - Math.abs(t - 0.85) / 0.45) : 0;
      if (gl > 0) {
        const r = 150 * k;
        const rg = ctx.createRadialGradient(ex, ey, 0, ex, ey, r);
        rg.addColorStop(0, `rgba(255,255,255,${gl})`);
        rg.addColorStop(0.15, `rgba(255,60,70,${0.8 * gl})`);
        rg.addColorStop(1, "rgba(255,0,0,0)");
        ctx.fillStyle = rg; ctx.fillRect(ex - r, ey - r, r * 2, r * 2);
        // anamorphic streak
        const sg = ctx.createLinearGradient(ex - 600 * k, 0, ex + 600 * k, 0);
        sg.addColorStop(0, "rgba(255,40,60,0)"); sg.addColorStop(0.5, `rgba(255,120,130,${0.7 * gl})`); sg.addColorStop(1, "rgba(255,40,60,0)");
        ctx.fillStyle = sg; ctx.fillRect(ex - 600 * k, ey - 2 * k, 1200 * k, 4 * k);
      }
      ctx.restore();
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={cv} className="gate-fx-canvas" aria-hidden="true" />;
});

export default GateFX;
