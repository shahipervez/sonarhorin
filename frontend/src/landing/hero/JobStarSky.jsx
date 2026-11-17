import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { useLang } from "../../i18n";
import { STORY_SETS, storyLink } from "../../components/StoryRail";

/**
 * JOB STAR SKY — the living background of the "Find a Job" hero (replaces the old CV rain).
 * Every star is a real job open today. Stars gather into one glowing constellation per category
 * (IT, Business, Agriculture, Textile, Engineering) along the bottom of the hero.
 *  - hover a category card above → its constellation lights up, the rest dim
 *  - hover a star → see the job; click → open it
 *  - click a constellation label → that category's listings
 * Falls back to the category vacancy counts when the jobs API is unavailable.
 */
const TAU = Math.PI * 2;
const FALLBACK = { it: 42, business: 38, agriculture: 19, textile: 31, engineering: 27 };
// constellation anchors: x = fraction of hero width, y = px up from the hero's bottom edge
const SPOTS = [
  [0.13, 215], [0.32, 255], [0.5, 200], [0.68, 255], [0.87, 215],
];
const KEYS = {
  it: /(software|developer|engineer.*(software|web|data)|it\b|computer|cse|data|qa|devops|frontend|backend|programmer|ai|ml)/i,
  business: /(business|bba|marketing|sales|finance|account|hr|management|trainee|executive|brand)/i,
  agriculture: /(agri|farm|crop|fisher|livestock|food)/i,
  textile: /(textile|garment|rmg|merchandis|apparel|knit|fabric|fashion)/i,
  engineering: /(eee|electrical|civil|mechanical|engineer|electronic|power|site)/i,
};

function catOf(job) {
  const s = `${job.title || ""} ${(job.major_list || []).join(" ")} ${job.category || ""}`;
  for (const k of Object.keys(KEYS)) if (KEYS[k].test(s)) return k;
  return null;
}

export default function JobStarSky({ onCount, introT0 = null }) {
  const [lang] = useLang();
  const L = lang === "bn" ? 1 : 0;
  const nav = useNavigate();
  const wrap = useRef(null), cv = useRef(null);
  const [jobs, setJobs] = useState(null);
  const [hot, setHot] = useState(null); // category id highlighted from the cards above
  const [tip, setTip] = useState(null);
  const hotRef = useRef(null);
  const hoverRef = useRef(null);
  const introRef = useRef(introT0);
  introRef.current = introT0;
  const cats = STORY_SETS.job;

  useEffect(() => {
    api("/api/jobs/").then((d) => setJobs(d.jobs || [])).catch(() => setJobs([]));
  }, []);

  // listen for hovers coming from the category story cards
  useEffect(() => {
    const on = (e) => { hotRef.current = e.detail || null; setHot(e.detail || null); };
    addEventListener("sr-hover", on);
    return () => removeEventListener("sr-hover", on);
  }, []);

  // group jobs → categories (or synthesize stars from counts)
  const groups = useMemo(() => {
    const g = Object.fromEntries(cats.map((c) => [c.id, []]));
    (jobs || []).forEach((j) => { const k = catOf(j); if (k && g[k]) g[k].push(j); });
    cats.forEach((c) => {
      if (!g[c.id].length) g[c.id] = Array.from({ length: FALLBACK[c.id] }, () => null);
    });
    return g;
  }, [jobs, cats]);

  const total = cats.reduce((n, c) => n + groups[c.id].length, 0);
  useEffect(() => { onCount?.(total); }, [total, onCount]);

  useEffect(() => {
    if (!jobs) return;
    const canvas = cv.current, ctx = canvas.getContext("2d");
    const still = matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, dpr = 1, raf, visible = true;
    const rnd = ((s) => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);

    // build constellations
    const clusters = cats.map((c, ci) => {
      const list = groups[c.id].slice(0, 64);
      const stars = list.map((job, i) => {
        // golden-angle spiral → organic, evenly-filled cluster
        const a = i * 2.39996 + rnd() * 0.4, r = Math.sqrt((i + 0.6) / list.length);
        return { job, a, r, size: 1.6 + rnd() * 2.1, tw: rnd() * TAU, x: 0, y: 0, s0: 1.7 + rnd() * 1.3, fx: rnd(), fy: -0.05 - rnd() * 0.25 };
      });
      // constellation lines: each star links to its nearest earlier star
      const links = [];
      for (let i = 1; i < stars.length; i++) {
        let best = 0, bd = 9;
        for (let j = 0; j < i; j++) {
          const d = Math.hypot(Math.cos(stars[i].a) * stars[i].r - Math.cos(stars[j].a) * stars[j].r, Math.sin(stars[i].a) * stars[i].r - Math.sin(stars[j].a) * stars[j].r);
          if (d < bd) { bd = d; best = j; }
        }
        if (bd < 0.5) links.push([i, best]);
      }
      return { c, ci, stars, links, glow: 0.35 };
    });
    const dust = Array.from({ length: 260 }, () => ({ x: rnd(), y: rnd() * 0.95, s: 0.4 + rnd() * 1.3, tw: rnd() * TAU }));
    let shoot = null, nextShoot = performance.now() + 1800;

    const resize = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
    };
    resize(); addEventListener("resize", resize);
    const io = new IntersectionObserver((e) => (visible = e[0].isIntersecting)); io.observe(canvas);

    const onMove = (e) => {
      const b = canvas.getBoundingClientRect(), px = e.clientX - b.left, py = e.clientY - b.top;
      let best = null, bd = 14;
      clusters.forEach((cl) => cl.stars.forEach((s) => { const d = Math.hypot(s.x - px, s.y - py); if (d < bd) { bd = d; best = { s, cl }; } }));
      hoverRef.current = best;
      setTip(best ? { x: best.s.x, y: best.s.y, c: best.cl.c, job: best.s.job } : null);
      canvas.style.cursor = best ? "pointer" : "default";
    };
    const onLeave = () => { hoverRef.current = null; setTip(null); };
    const onClick = () => {
      const h = hoverRef.current; if (!h) return;
      if (h.s.job?.title) nav(`/jobs?q=${encodeURIComponent(h.s.job.title)}`);
      else nav(storyLink("job", h.cl.c));
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("click", onClick);

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const t = still ? 0 : now / 1000;
      // story intro clock (seconds since the intro started; 99 = no intro → everything settled)
      const it = introRef.current != null && !still ? (now - introRef.current) / 1000 : 99;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const unit = Math.min(W, 1400);

      // twinkling sky dust
      dust.forEach((d) => {
        ctx.globalAlpha = (0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 1.6 + d.tw))) * (0.35 + 0.65 * clamp01((it - 1.6) / 1.2));
        ctx.fillStyle = "#E9E4FF"; ctx.fillRect(d.x * W, d.y * H, d.s, d.s);
      });
      ctx.globalAlpha = 1;

      // shooting star = "a new job just landed"
      if (!still && now > nextShoot && !shoot) {
        shoot = { x: W * (0.1 + Math.random() * 0.5), y: H * (0.05 + Math.random() * 0.2), t: 0 };
        nextShoot = now + 4200 + Math.random() * 3500;
      }
      if (shoot) {
        shoot.t += 0.016;
        const k = shoot.t / 1.1, x = shoot.x + k * W * 0.32, y = shoot.y + k * H * 0.26;
        const g = ctx.createLinearGradient(x - 120, y - 98, x, y);
        g.addColorStop(0, "rgba(255,210,100,0)"); g.addColorStop(1, `rgba(255,226,150,${1 - k})`);
        ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 120, y - 98); ctx.lineTo(x, y); ctx.stroke();
        if (k >= 1) shoot = null;
      }

      const hotId = hotRef.current, hov = hoverRef.current;
      const linesK = clamp01((it - 3.0) / 0.9);
      // card rects (for the light beams that carry each card out of its constellation)
      const beamK = it < 99 ? bump(it, 4.0, 5.7) : 0;
      let cards = null;
      if (beamK > 0 || hotId) {
        const cb = canvas.getBoundingClientRect();
        cards = {};
        canvas.closest(".hero")?.querySelectorAll(".sr-card").forEach((el, i) => {
          const r = el.getBoundingClientRect();
          const id = cats[i]?.id; if (id) cards[id] = [r.left - cb.left + r.width / 2, r.bottom - cb.top];
        });
      }
      clusters.forEach((cl) => {
        const on = hotId ? hotId === cl.c.id : false;
        const dim = hotId && !on;
        cl.glow += ((on ? 1 : dim ? 0.12 : 0.42) - cl.glow) * 0.08;
        const [fx, fy] = SPOTS[cl.ci];
        const cx = fx * W, cy = H - fy + Math.sin(t * 0.6 + cl.ci) * 4;
        const R = unit * (W < 760 ? 0.1 : 0.075) * (1 + cl.glow * 0.18);
        const rot = t * 0.05 * (cl.ci % 2 ? 1 : -1);

        // nebula halo
        const neb = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.9);
        neb.addColorStop(0, hexA(cl.c.c, (0.32 * cl.glow + 0.06) * clamp01((it - 2.2) / 1.2))); neb.addColorStop(1, hexA(cl.c.c, 0));
        ctx.fillStyle = neb; ctx.fillRect(cx - R * 2, cy - R * 2, R * 4, R * 4);

        cl.stars.forEach((s) => {
          const a = s.a + rot;
          const tx = cx + Math.cos(a) * s.r * R * 1.25, ty = cy + Math.sin(a) * s.r * R * 0.85;
          s.k = clamp01((it - s.s0) / 0.95);
          const e = 1 - Math.pow(1 - s.k, 3);
          const sx = s.fx * W, sy = s.fy * H;
          s.px = s.x; s.py = s.y;
          s.x = sx + (tx - sx) * e; s.y = sy + (ty - sy) * e;
          // falling streak while the star is flying in
          if (s.k > 0 && s.k < 1) {
            const g = ctx.createLinearGradient(s.x - (tx - sx) * 0.12, s.y - (ty - sy) * 0.12, s.x, s.y);
            g.addColorStop(0, hexA(cl.c.c, 0)); g.addColorStop(1, hexA(cl.c.c, 0.85));
            ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.beginPath();
            ctx.moveTo(s.x - (tx - sx) * 0.12, s.y - (ty - sy) * 0.12); ctx.lineTo(s.x, s.y); ctx.stroke();
          }
        });
        // light beam: constellation → its card (story intro, and on hover)
        const card = cards?.[cl.c.id];
        const bk = Math.max(beamK, hotId === cl.c.id ? 0.55 : 0);
        if (card && bk > 0.01) {
          const [bx, by] = card;
          const g = ctx.createLinearGradient(cx, cy, bx, by);
          g.addColorStop(0, hexA(cl.c.c, 0.55 * bk)); g.addColorStop(1, hexA(cl.c.c, 0));
          ctx.fillStyle = g; ctx.beginPath();
          ctx.moveTo(cx - R * 0.35, cy); ctx.lineTo(bx - 70, by); ctx.lineTo(bx + 70, by); ctx.lineTo(cx + R * 0.35, cy); ctx.closePath(); ctx.fill();
          // sparks travelling up the beam
          for (let k = 0; k < 4; k++) {
            const u = (t * 0.9 + k / 4 + cl.ci * 0.13) % 1;
            ctx.globalAlpha = bk * (1 - u); ctx.fillStyle = "#fff";
            ctx.beginPath(); ctx.arc(cx + (bx - cx) * u + Math.sin(u * 9 + k) * 10, cy + (by - cy) * u, 1.8, 0, TAU); ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
        // lines (draw themselves during the story)
        ctx.strokeStyle = hexA(cl.c.c, (0.12 + cl.glow * 0.45) * linesK); ctx.lineWidth = 0.8 + cl.glow * 0.6;
        ctx.beginPath();
        const nl = Math.floor(cl.links.length * linesK);
        for (let q = 0; q < nl; q++) { const [i, j] = cl.links[q]; ctx.moveTo(cl.stars[i].x, cl.stars[i].y); ctx.lineTo(cl.stars[j].x, cl.stars[j].y); }
        ctx.stroke();
        // stars
        cl.stars.forEach((s) => {
          if (s.k <= 0) return;
          const tw = 0.7 + 0.3 * Math.sin(t * 2.6 + s.tw);
          const big = hov && hov.s === s ? 2.4 : 1;
          const sz = s.size * big * (0.85 + cl.glow * 0.5);
          const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, sz * 5);
          g.addColorStop(0, hexA(cl.c.c, 0.9)); g.addColorStop(1, hexA(cl.c.c, 0));
          ctx.globalAlpha = (0.35 + cl.glow * 0.65) * tw;
          ctx.fillStyle = g; ctx.fillRect(s.x - sz * 5, s.y - sz * 5, sz * 10, sz * 10);
          ctx.globalAlpha = Math.min(1, 0.45 + cl.glow);
          ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(s.x, s.y, sz * 0.55, 0, TAU); ctx.fill();
        });
        ctx.globalAlpha = 1;
      });
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf); io.disconnect(); removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onMove); canvas.removeEventListener("pointerleave", onLeave); canvas.removeEventListener("click", onClick);
    };
  }, [jobs, groups, cats, nav]);

  return (
    <div className="jss" ref={wrap} aria-label={L ? "প্রতিটা তারা একটা আসল চাকরি" : "Every star is a real job, open today"}>
      <canvas ref={cv} className="jss-canvas" />
      <div className="jss-labels">
        {cats.map((c, i) => (
          <button
            key={c.id}
            type="button"
            className={`jss-lbl ${hot === c.id ? "on" : hot ? "dim" : ""}`}
            style={{ "--c": c.c, left: `${SPOTS[i][0] * 100}%`, bottom: `${SPOTS[i][1]}px` }}
            onClick={() => nav(storyLink("job", c))}
            onMouseEnter={() => { hotRef.current = c.id; setHot(c.id); }}
            onMouseLeave={() => { hotRef.current = null; setHot(null); }}
          >
            <i>{c.icon}</i>
            <b className={L ? "bn" : ""}>{c.name[L]}</b>
            <small>{toBn(groups[c.id].length, L)} {L ? "টি পদ" : "open"}</small>
          </button>
        ))}
      </div>
      {tip && (
        <div className="jss-tip" style={{ left: tip.x, top: tip.y, "--c": tip.c.c }}>
          {tip.job?.title ? (
            <><b>{tip.job.title}</b><span>{tip.job.company?.name || tip.c.name[L]}</span></>
          ) : (
            <><b>{tip.c.icon} {tip.c.name[L]}</b><span>{L ? "ট্যাপ করো — এই ক্যাটাগরির জব দেখো" : "Tap to see these openings"}</span></>
          )}
        </div>
      )}
    </div>
  );
}

const BN = "০১২৩৪৫৬৭৮৯";
export const toBn = (n, L) => (L ? String(n).replace(/\d/g, (d) => BN[d]) : String(n));

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const bump = (x, a, b) => (x <= a || x >= b ? 0 : Math.sin(((x - a) / (b - a)) * Math.PI));

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a))})`;
}
