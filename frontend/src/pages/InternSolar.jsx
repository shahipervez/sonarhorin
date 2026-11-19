import { useEffect, useRef, useState } from "react";

/**
 * SONARHORIN SOLAR SYSTEM — the internship categories as planets orbiting the Sonarhorin deer (the sun),
 * set inside a Milky Way band, the way humans live in a galaxy.
 *  - each planet = one internship type (Paid, Learning, Versity Credit, Corporate, Remote)
 *  - planet size grows with the number of open internships
 *  - the planet whose story is playing on the left wears a progress ring
 *  - hover the system → orbits slow down so a planet is easy to catch; click → play its story
 */
const TAU = Math.PI * 2;
const BN = "০১২৩৪৫৬৭৮৯";
const n2 = (n, L) => (L ? String(n).replace(/\d/g, (d) => BN[d]) : String(n));

export default function InternSolar({ cats, gate, counts, onPick, L, gateCodes, progressMs, progressFrom, paused, progKey }) {
  const box = useRef(null);
  const sky = useRef(null);
  const planets = useRef([]);
  const slow = useRef(1);
  const [size, setSize] = useState({ w: 600, h: 520 });

  // orbit geometry, recomputed on resize
  useEffect(() => {
    const el = box.current;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const cx = size.w / 2, cy = size.h / 2;
  const maxR = Math.min(size.w * 0.47, size.h * 0.95);
  const orbits = cats.map((_, k) => {
    const rx = maxR * (0.37 + k * 0.158);
    return { rx, ry: rx * 0.43, speed: 0.22 / Math.pow(1 + k, 0.7), phase: k * 1.37 };
  });

  // planets move every frame (DOM writes, no React re-render)
  useEffect(() => {
    const still = matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let raf, last = performance.now(), t = 0;
    const tilt = -0.16; // whole system is tipped slightly, like a real orbital plane
    const ct = Math.cos(tilt), st = Math.sin(tilt);
    const step = (now) => {
      raf = requestAnimationFrame(step);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!still) t += dt * slow.current;
      orbits.forEach((o, k) => {
        const el = planets.current[k]; if (!el) return;
        const a = o.phase + t * o.speed;
        const lx = Math.cos(a) * o.rx, ly = Math.sin(a) * o.ry;
        const x = cx + lx * ct - ly * st, y = cy + lx * st + ly * ct;
        const depth = (Math.sin(a) + 1) / 2; // 0 = behind the sun, 1 = in front
        el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${0.72 + depth * 0.38})`;
        el.style.zIndex = depth > 0.5 ? 6 : 2;
        el.style.filter = `brightness(${0.7 + depth * 0.45})`;
      });
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [cx, cy, orbits.map((o) => o.rx).join()]); // eslint-disable-line react-hooks/exhaustive-deps

  // Milky Way: a tilted band of dust + twinkling stars behind everything
  useEffect(() => {
    const c = sky.current, ctx = c.getContext("2d");
    const still = matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let raf, seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const g = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;
    const stars = Array.from({ length: 900 }, () => {
      const band = rnd() < 0.72;
      const u = rnd();
      return { u, v: band ? g() * 0.13 : rnd() * 2 - 1, band, s: 0.3 + rnd() * (band ? 1.1 : 1.5), tw: rnd() * TAU, hue: rnd() };
    });
    const draw = (now) => {
      raf = requestAnimationFrame(draw);
      const dpr = Math.min(2, devicePixelRatio || 1), W = c.clientWidth, H = c.clientHeight;
      if (c.width !== W * dpr) { c.width = W * dpr; c.height = H * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      const t = still ? 0 : now / 1000;
      // band glow
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-0.42);
      const L2 = Math.hypot(W, H);
      const bg = ctx.createLinearGradient(0, -H * 0.3, 0, H * 0.3);
      bg.addColorStop(0, "rgba(120,90,200,0)"); bg.addColorStop(0.42, "rgba(150,120,230,.16)"); bg.addColorStop(0.5, "rgba(255,226,170,.2)");
      bg.addColorStop(0.58, "rgba(150,120,230,.16)"); bg.addColorStop(1, "rgba(120,90,200,0)");
      ctx.fillStyle = bg; ctx.fillRect(-L2 / 2, -H * 0.3, L2, H * 0.6);
      // dark dust lane
      const dl = ctx.createLinearGradient(0, -14, 0, 14);
      dl.addColorStop(0, "rgba(5,8,25,0)"); dl.addColorStop(0.5, "rgba(5,8,25,.35)"); dl.addColorStop(1, "rgba(5,8,25,0)");
      ctx.fillStyle = dl; ctx.fillRect(-L2 / 2, -14, L2, 28);
      stars.forEach((s) => {
        const x = (s.u - 0.5) * L2, y = s.v * (s.band ? H * 0.9 : H * 0.8);
        ctx.globalAlpha = (0.35 + 0.5 * (0.5 + 0.5 * Math.sin(t * 1.7 + s.tw))) * (s.band ? 0.9 : 0.55);
        ctx.fillStyle = s.hue > 0.85 ? "#FFE3A8" : s.hue > 0.7 ? "#B9C8FF" : "#FFFFFF";
        ctx.fillRect(x, y, s.s, s.s);
      });
      ctx.restore(); ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  const maxCount = Math.max(1, ...cats.map((c) => counts[c.id] || 0));

  return (
    <div
      className="is-sys"
      ref={box}
      onMouseEnter={() => (slow.current = 0.18)}
      onMouseLeave={() => (slow.current = 1)}
      role="tablist"
      aria-label={L ? "ইন্টার্নশিপ ক্যাটাগরি" : "Internship categories"}
    >
      <canvas ref={sky} className="is-sky" aria-hidden="true" />

      {/* orbit paths */}
      <svg className="is-orbits" width={size.w} height={size.h} aria-hidden="true">
        <g transform={`rotate(${(-0.16 * 180) / Math.PI} ${cx} ${cy})`}>
          {orbits.map((o, k) => (
            <ellipse key={k} cx={cx} cy={cy} rx={o.rx} ry={o.ry}
              className={cats[k].id === gate ? "on" : ""} style={{ "--c": cats[k].c }} />
          ))}
        </g>
      </svg>

      {/* the sun: Sonarhorin */}
      <div className="is-sun" style={{ left: cx, top: cy }}>
        <span className="is-sun-rays" aria-hidden="true" />
        <img src="/logo-gold.png" alt="" />
        <b lang="bn">সোনারহরিণ</b>
      </div>

      {cats.map((c, k) => {
        const n = counts[c.id] || 0;
        const d = 38 + Math.round((n / maxCount) * 22);
        const on = c.id === gate;
        return (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={on}
            ref={(el) => (planets.current[k] = el)}
            className={`is-planet p-${c.id} ${on ? "on" : ""}`}
            style={{ "--c": c.c, "--d": `${d}px` }}
            onClick={() => onPick(c.id)}
          >
            <span className="is-ball">
              <i>{c.icon}</i>
              {on && (
                <svg className="is-ring" viewBox="0 0 100 100" aria-hidden="true">
                  <circle key={progKey} cx="50" cy="50" r="47" pathLength="100"
                    style={{ "--from": 100 - progressFrom * 100, animationDuration: `${progressMs}ms`, animationPlayState: paused ? "paused" : "running" }} />
                </svg>
              )}
              {c.id === "corporate" && <span className="is-saturn" aria-hidden="true" />}
              {c.id === "remote" && <span className="is-moon" aria-hidden="true" />}
            </span>
            <span className="is-tag">
              <em>{gateCodes[c.id]}</em>
              <b className={L ? "bn" : ""}>{c.name[L]}</b>
              <small>{n2(n, L)}</small>
            </span>
          </button>
        );
      })}
    </div>
  );
}
