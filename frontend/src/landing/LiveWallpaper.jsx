import { useEffect, useRef, useState } from "react";
import { MAJORS } from "../config";
import { useLite } from "../lite";
import { fmt } from "../utils";

const STEPS = [
  { q: "Are you looking for a JOB?", key: "intent", opts: [["job", "Yes — my first one 🙋"], ["intern", "An internship first"], ["browse", "Just looking around 👀"]] },
  { q: "What did you study?", key: "field", opts: MAJORS.map((m) => [m, m]) },
  { q: "Perfect. Mitu is making your video.", key: null, opts: [["go", "▶ Watch my video"]] },
];

/**
 * Black live wallpaper. Frozen until it comes into view / is hovered — then it moves
 * and the question appears. Drop your own video at frontend/public/wallpaper.mp4 to use it.
 */
export default function LiveWallpaper({ onAnswer }) {
  const wallRef = useRef(null), vidRef = useRef(null), cvRef = useRef(null);
  const [live, setLive] = useState(false);
  const [asked, setAsked] = useState(false);
  const [step, setStep] = useState(0);
  const [typed, setTyped] = useState("");
  const [picked, setPicked] = useState(null);
  const goLiveRef = useRef(() => {});
  const lite = useLite();

  // ------- wallpaper engine
  useEffect(() => {
    if (lite) { setAsked(true); return; } // lite mode: static gradient, no video / canvas
    const wall = wallRef.current, vid = vidRef.current, cv = cvRef.current, ctx = cv.getContext("2d");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let useVideo = false, isLive = false, visible = false, W = 0, H = 0, parts = [], t = 0, last = 0, sweep = -1, raf, askT;

    const onLoaded = () => { useVideo = true; vid.style.display = "block"; cv.style.display = "none"; try { vid.pause(); vid.currentTime = 0; } catch { /* */ } };
    const onErr = () => { useVideo = false; };
    vid.addEventListener("loadeddata", onLoaded); vid.addEventListener("error", onErr);

    function seed(p) {
      p.x = W * (0.35 + Math.random() * 0.75); p.y = Math.random() * H; p.life = 60 + Math.random() * 160;
      p.c = Math.random() < 0.16 ? "rgba(142,197,255," : "rgba(235,238,245,"; p.a = 0.05 + Math.random() * 0.12; p.w = Math.random() < 0.08 ? 1.6 : 0.7; return p;
    }
    const field = (x, y) => { const s = 0.0042, k = t * 0.22; return Math.sin(x * s + k) * 1.3 + Math.cos(y * s * 1.4 - k * 1.2) * 1.1 + Math.sin((x + y) * s * 0.6 + k * 0.7) * 0.8 + 2.3; };
    function step(dt, speed) {
      t += dt * speed;
      ctx.fillStyle = `rgba(0,0,0,${0.05 + 0.04 * (1 - speed)})`; ctx.fillRect(0, 0, W, H); ctx.lineCap = "round";
      for (const p of parts) {
        const a = field(p.x, p.y), v = 1.4 + speed * 1.8;
        const nx = p.x + Math.cos(a) * v * 60 * dt * speed * 1.6, ny = p.y + Math.sin(a) * v * 60 * dt * speed * 1.6;
        ctx.strokeStyle = p.c + p.a + ")"; ctx.lineWidth = p.w; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny); ctx.stroke();
        p.x = nx; p.y = ny; p.life -= speed;
        if (p.life < 0 || p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) seed(p);
      }
      if (sweep >= 0) {
        sweep += dt * 0.75; const x = -W * 0.3 + sweep * W * 1.8;
        const g = ctx.createLinearGradient(x - 90, 0, x + 90, H * 0.35);
        g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.5, "rgba(190,220,255,.22)"); g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); if (sweep > 1) sweep = -1;
      }
      for (let i = 0; i < 3; i++) {
        const gx = W * (0.62 + 0.22 * Math.sin(t * 0.5 + i * 2.1)), gy = H * (0.3 + 0.4 * ((i * 0.37 + t * 0.03) % 1));
        ctx.fillStyle = "rgba(142,197,255,.5)"; ctx.beginPath(); ctx.arc(gx, gy, Math.max(0.5, 2 + 1.5 * Math.sin(t * 3 + i)), 0, 7); ctx.fill();
      }
    }
    function size() {
      const dpr = Math.min(devicePixelRatio || 1, 1.5); W = wall.clientWidth; H = wall.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
      parts = Array.from({ length: Math.round(Math.min(1400, (W * H) / 260)) }, () => seed({}));
      for (let i = 0; i < 140; i++) step(1 / 30, 0.9);
      const g = ctx.createRadialGradient(W * 0.65, H * 0.5, H * 0.2, W * 0.5, H * 0.5, W * 0.8);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.55)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    function loop(now) {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
      if (useVideo || !isLive || !visible) return;
      step(dt, reduce ? 0.3 : 1);
    }
    function goLive() {
      if (isLive) return; isLive = true; sweep = 0; setLive(true);
      if (useVideo) vid.play().catch(() => {});
      askT = setTimeout(() => setAsked(true), 1700);
    }
    goLiveRef.current = goLive;
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      visible = e.isIntersecting;
      if (e.intersectionRatio >= 0.6) goLive();
      if (useVideo && isLive) e.isIntersecting ? vid.play().catch(() => {}) : vid.pause();
    }), { threshold: [0, 0.6] });
    io.observe(wall);
    size(); raf = requestAnimationFrame(loop);
    let rt; const onResize = () => { clearTimeout(rt); rt = setTimeout(() => { if (!useVideo) size(); }, 200); };
    addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf); io.disconnect(); removeEventListener("resize", onResize); clearTimeout(rt); clearTimeout(askT);
      vid.removeEventListener("loadeddata", onLoaded); vid.removeEventListener("error", onErr);
    };
  }, [lite]);

  // ------- typewriter
  useEffect(() => {
    if (!asked) return;
    setTyped(""); setPicked(null);
    const text = STEPS[step].q; let i = 0;
    const id = setInterval(() => { i++; setTyped(text.slice(0, i)); if (i >= text.length) clearInterval(id); }, 34);
    return () => clearInterval(id);
  }, [asked, step]);

  const s = STEPS[step];
  const doneTyping = typed.length === s.q.length;
  const choose = (v) => {
    if (!s.key) { document.getElementById("bot")?.scrollIntoView({ behavior: "smooth" }); return; }
    setPicked(v); onAnswer?.(s.key, v);
    try { localStorage.setItem(`prothom_${s.key}`, v); } catch { /* */ }
    setTimeout(() => setStep(step + 1), 350);
  };

  return (
    <section className="why" id="why">
      <div className="wrap grid">
        <div>
          <div ref={wallRef} className={`wall ${live ? "live" : ""} ${asked ? "asked" : ""}`} aria-label="Live wallpaper"
               onPointerEnter={() => goLiveRef.current()} onClick={() => goLiveRef.current()}>
            {lite ? <div className="lite-sky lite-sky-job" aria-hidden="true" style={{ position: "absolute", inset: 0 }} /> : <>
              <video ref={vidRef} src="/wallpaper.mp4" muted playsInline loop preload="auto" />
              <canvas ref={cvRef} />
            </>}
            <div className="shade" />
            <div className="live-tag"><i />LIVE</div>
            <div className="idle"><i />Hover or tap to wake it up</div>
            <div className="wq">
              <div className="eb">{step < 2 ? `Question ${step + 1} of 2` : "All set"}</div>
              <h3 className="q"><span>{typed}</span><i className="cur" /></h3>
              <div className="opts">
                {doneTyping && s.opts.map(([v, label], k) => (
                  <button key={v} className={`opt ${picked === v ? "sel" : ""}`} style={{ animationDelay: `${k * 60}ms` }}
                          onClick={(e) => { e.stopPropagation(); choose(v); }}>{label}</button>
                ))}
              </div>
            </div>
          </div>
          <p className="wall-cap">✦ A live wallpaper with a question hiding inside.</p>
        </div>
        <div>
          <h2 className="h2">Why our<br />matches work.</h2>
          <div className="stats">
            <Stat to={18400} suf="+" label="fresher-only jobs" sup />
            <Stat to={2600} suf="+" label="companies hiring freshers" sup />
            <Stat to={0} suf="" label="years of experience required. Ever." />
            <Stat to={48} suf="h" label="average time to first reply" sup />
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ to, suf, label, sup }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; let raf;
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return; io.disconnect();
      const t0 = performance.now();
      const st = (tt) => { const k = Math.min(1, (tt - t0) / 1400); el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - k, 3)))) + suf; if (k < 1) raf = requestAnimationFrame(st); };
      raf = requestAnimationFrame(st);
    }), { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to, suf]);
  return (
    <div className="stat"><span className="num" ref={ref}>0</span><span className="lbl">{label}{sup && <sup>1</sup>}</span></div>
  );
}
