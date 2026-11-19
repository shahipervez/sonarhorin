import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useLite } from "../lite";
import { catOf, clamp01, hexA, toBn } from "../landing/hero/JobStarSky";

/**
 * GALAXY RAIL — the job categories as five small, living galaxies (replaces the big story boxes).
 * Each category has its own galaxy shape:
 *   IT = barred spiral · Business = 3-arm spiral (growth) · Agriculture = ring galaxy (harvest circle)
 *   Textile = tightly-woven 4-arm spiral · Engineering = 2-arm spiral with a gear-like ring
 * Hover → the galaxy spins up and glows; click → that category's jobs.
 * During the intro story the galaxies are born: stars spiral in from far out.
 */
const SHAPES = {
  it: { arms: 2, wind: 2.6, bar: 0.32, tilt: 0.5, rot: -0.35 },
  business: { arms: 3, wind: 2.2, tilt: 0.58, rot: 0.35 },
  agriculture: { arms: 2, wind: 1.4, ring: 0.82, tilt: 0.46, rot: -0.15 },
  textile: { arms: 4, wind: 3.6, tilt: 0.6, rot: 0.2 },
  engineering: { arms: 2, wind: 1.9, ring: 0.95, teeth: 12, tilt: 0.44, rot: 0.75 },
};
const TAU = Math.PI * 2;

function GalaxyOrb({ s, i, L, count, introT0, onGo, mode = "" }) {
  const cv = useRef(null);
  const hot = useRef(0);
  const lite = useLite();
  const introRef = useRef(introT0);
  introRef.current = introT0;

  useEffect(() => {
    const canvas = cv.current, ctx = canvas.getContext("2d");
    const still = matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const sh = SHAPES[s.id] || SHAPES.it;
    let seed = 97 + i * 131;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;
    const P = [];
    for (let k = 0; k < 560; k++) {
      const u = rnd();
      let r, th, kind = "arm";
      if (u < 0.22) { r = Math.pow(rnd(), 2) * 0.28; th = rnd() * TAU; kind = "core"; }
      else if (sh.bar && u < 0.34) { r = gauss() * sh.bar; th = 0; kind = "bar"; }
      else if (sh.ring && u < 0.52) { r = sh.ring + gauss() * 0.05; th = rnd() * TAU; kind = "ring"; }
      else {
        const arm = k % sh.arms;
        r = 0.12 + Math.pow(rnd(), 0.8) * 0.88;
        th = (arm * TAU) / sh.arms + sh.wind * Math.log(1 + r * 5) + gauss() * 0.32 * (1.1 - r * 0.5);
      }
      if (sh.teeth && kind === "ring") r += Math.cos(th * sh.teeth) > 0.6 ? 0.07 : 0; // gear teeth
      P.push({ r, th, kind, size: kind === "core" ? 0.7 + rnd() * 1.2 : 0.5 + rnd() * 1.3, tw: rnd() * TAU, b: 0.45 + rnd() * 0.55 });
    }
    let W = 0, H = 0, dpr = 1, raf, visible = true, spin = 0, last = performance.now(), drawn = false;
    const resize = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      // lite mode: the orb is a single still frame — redraw it once after a resize
      if (lite && drawn) { drawn = false; cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
    };
    resize(); addEventListener("resize", resize);
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    const io = new IntersectionObserver((e) => (visible = e[0].isIntersecting)); io.observe(canvas);
    const cr = Math.cos(sh.rot), sr = Math.sin(sh.rot);

    function frame(now) {
      if (lite && drawn) return; // lite mode: no animation loop
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!visible) return;
      const t = now / 1000;
      const it = introRef.current != null && !still ? (now - introRef.current) / 1000 : 99;
      const born = clamp01((it - (2.6 + i * 0.16)) / 1.5);
      const e = 1 - Math.pow(1 - born, 3);
      const h = hot.current;
      spin += dt * (still ? 0 : 0.12 + h * 0.55 + (1 - e) * 2.2);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (born <= 0) return;
      const cx = W / 2, cy = H / 2, R = Math.min(W, H / sh.tilt) * 0.46 * (1 + h * 0.06);

      // halo
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.05);
      halo.addColorStop(0, hexA(s.c, (0.32 + h * 0.25) * e));
      halo.addColorStop(0.45, hexA(s.c, 0.09 * e));
      halo.addColorStop(1, hexA(s.c, 0));
      ctx.fillStyle = halo; ctx.fillRect(0, 0, W, H);

      ctx.globalCompositeOperation = "lighter";
      for (const p of P) {
        const rr = p.r * (1 + (1 - e) * 2.4);
        const th = p.th + spin * (p.kind === "bar" ? 1 : 1 + (1 - Math.min(1, p.r)) * 0.35) + (1 - e) * 2.5;
        const lx = Math.cos(th) * rr * R, ly = Math.sin(th) * rr * R * sh.tilt;
        const x = cx + lx * cr - ly * sr, y = cy + lx * sr + ly * cr;
        const tw = 0.75 + 0.25 * Math.sin(t * 2.2 + p.tw);
        ctx.globalAlpha = p.b * tw * e * (0.8 + h * 0.4);
        ctx.fillStyle = p.kind === "core" || p.r < 0.18 ? "#FFF4D6" : p.r > 0.75 && p.kind === "arm" ? "#C7D2FE" : s.c;
        const z = p.size * (1 + h * 0.25) * Math.max(1, Math.min(2.1, R / 75));
        ctx.fillRect(x - z / 2, y - z / 2, z, z);
      }
      // bright nucleus
      ctx.globalAlpha = e;
      const nuc = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.2);
      nuc.addColorStop(0, "rgba(255,250,235,0.95)"); nuc.addColorStop(0.4, hexA(s.c, 0.5)); nuc.addColorStop(1, hexA(s.c, 0));
      ctx.fillStyle = nuc; ctx.beginPath(); ctx.arc(cx, cy, R * 0.2, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      if (lite && W > 0) { drawn = true; cancelAnimationFrame(raf); }
    }
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); removeEventListener("resize", resize); };
  }, [s, i, lite]);

  // ease the hover value so the spin-up feels physical
  const [isHot, setHot] = useState(false);
  useEffect(() => {
    let raf; const step = () => { hot.current += ((isHot ? 1 : 0) - hot.current) * 0.08; if (Math.abs(hot.current - (isHot ? 1 : 0)) > 0.01) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
  }, [isHot]);

  return (
    <button
      type="button"
      className={`gal-orb ${isHot ? "hot" : ""} ${mode}`}
      style={{ "--c": s.c, "--i": i, viewTransitionName: `gal-${s.id}` }}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      onClick={() => onGo(s)}
      aria-label={`${s.name[L]} — ${count} ${L ? "টি পদ" : "open jobs"}`}
    >
      <canvas ref={cv} />
      <span className="gal-lbl">
        <span className="gal-name"><i>{s.icon}</i><b className={L ? "bn" : ""}>{s.name[L]}</b></span>
        <span className="gal-meta">
          <em>{s.chip[L]}</em>
          <small><i />{toBn(count, L)} {L ? "পদ" : "open"}</small>
        </span>
      </span>
      <span className="gal-go" aria-hidden="true">{mode === "big" ? (L ? "সব গ্যালাক্সি" : "All galaxies") + " ✕" : (L ? "জব দেখো" : "See jobs") + " ↓"}</span>
    </button>
  );
}

// smooth morph between layouts where the browser supports View Transitions
const morph = (fn) => (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches
  ? document.startViewTransition(() => flushSync(fn))
  : fn());

const fmtPay = (j, L) => {
  const k = (n) => (n >= 1000 ? `${Math.round(n / 1000)}k` : n);
  if (!j.salary_min) return L ? "আলোচনা সাপেক্ষে" : "Negotiable";
  return `৳${toBn(k(j.salary_min), L)}${j.salary_max ? `–${toBn(k(j.salary_max), L)}` : "+"}`;
};
const daysTo = (d) => (d ? Math.ceil((new Date(d) - new Date()) / 864e5) : null);

export default function GalaxyRail({ items, L, counts = {}, introT0, onGo }) {
  const nav = useNavigate();
  const [sel, setSel] = useState(null);
  const [jobs, setJobs] = useState(null);
  const panel = useRef(null);

  useEffect(() => {
    if (!sel || jobs) return;
    api("/api/jobs/").then((d) => setJobs(d.jobs || [])).catch(() => setJobs([]));
  }, [sel, jobs]);

  const list = useMemo(() => (jobs || []).filter((j) => catOf(j) === sel).slice(0, 9), [jobs, sel]);
  const cur = items.find((x) => x.id === sel);

  const choose = (s) => {
    morph(() => setSel((v) => (v === s.id ? null : s.id)));
    setTimeout(() => panel.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 450);
  };
  // order: small galaxies first (as a row of tabs), the chosen one last (big, centre stage)
  const ordered = sel ? [...items.filter((x) => x.id !== sel), cur] : items;

  return (
    <div className={`gal-wrap ${sel ? "focus" : ""}`} style={cur ? { "--c": cur.c } : undefined}>
      <div className={`gal-rail ${sel ? "focus" : ""}`}>
        {ordered.map((s) => {
          const i = items.indexOf(s);
          return (
            <GalaxyOrb key={s.id} s={s} i={i} L={L} count={counts[s.id] ?? 0} introT0={introT0}
              mode={sel ? (s.id === sel ? "big" : "mini") : ""} onGo={choose} />
          );
        })}
      </div>

      {cur && (
        <section className="gal-jobs" ref={panel} aria-live="polite">
          <header>
            <h3 className={L ? "bn" : ""}>
              <i>{cur.icon}</i> {cur.name[L]} <em>{L ? "গ্যালাক্সির তারারা" : "galaxy — its stars"}</em>
            </h3>
            <span className="gal-jobs-n">{toBn(counts[cur.id] ?? list.length, L)} {L ? "টি পদ খোলা" : "open today"}</span>
          </header>

          {jobs === null && <div className="gal-jobs-grid">{[0, 1, 2].map((k) => <div key={k} className="gal-job skel" />)}</div>}

          {jobs && list.length > 0 && (
            <div className="gal-jobs-grid">
              {list.map((j, k) => {
                const dl = daysTo(j.deadline);
                return (
                  <button type="button" key={j.id} className="gal-job" style={{ "--k": k }} onClick={() => nav(`/jobs?q=${encodeURIComponent(j.title)}`)}>
                    <span className="gal-job-star" aria-hidden="true">✦</span>
                    <span className="gal-job-logo" style={{ background: j.company?.color || cur.c }}>
                      {j.company?.logo ? <img src={j.company.logo} alt="" /> : (j.company?.name || "?").slice(0, 2).toUpperCase()}
                    </span>
                    <span className="gal-job-body">
                      <b>{j.title}</b>
                      <small>{j.company?.name}{j.location ? ` · ${j.location}` : ""}</small>
                    </span>
                    <span className="gal-job-side">
                      <em>{fmtPay(j, L)}</em>
                      {dl != null && <small className={dl <= 5 ? "hot" : ""}>{dl > 0 ? (L ? `${toBn(dl, L)} দিন বাকি` : `${dl}d left`) : (L ? "আজ শেষ" : "ends today")}</small>}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {jobs && list.length === 0 && (
            <p className="gal-jobs-empty">{L ? "এই গ্যালাক্সিতে এখন নতুন তারা নেই — শীঘ্রই আসছে।" : "No new stars in this galaxy right now — check back soon."}</p>
          )}

          <div className="gal-jobs-foot">
            <button type="button" className="gal-btn ghost" onClick={() => choose(cur)}>← {L ? "সব গ্যালাক্সি" : "All galaxies"}</button>
            <button type="button" className="gal-btn" onClick={() => onGo(cur)}>{L ? `সব ${cur.name[L]} জব দেখো` : `All ${cur.name[0]} jobs`} →</button>
          </div>
        </section>
      )}
    </div>
  );
}
