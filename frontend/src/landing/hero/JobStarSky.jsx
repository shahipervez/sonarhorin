import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../api";
import { useLang } from "../../i18n";
import { STORY_SETS } from "../../components/StoryRail";

/**
 * JOB STAR SKY — night-sky background of the "Find a Job" hero.
 * Twinkling dust + shooting stars ("a new job just landed").
 * During the intro story, a rain of stars falls and is swallowed by the category galaxies
 * (the galaxies themselves are drawn by <GalaxyRail/>).
 * Also counts today's jobs per category and reports them via onCount(total, perCategory).
 */
const TAU = Math.PI * 2;
export const FALLBACK = { it: 42, business: 38, agriculture: 19, textile: 31, engineering: 27 };
const KEYS = {
  it: /(software|developer|engineer.*(software|web|data)|it\b|computer|cse|data|qa|devops|frontend|backend|programmer|ai|ml)/i,
  business: /(business|bba|marketing|sales|finance|account|hr|management|trainee|executive|brand)/i,
  agriculture: /(agri|farm|crop|fisher|livestock|food)/i,
  textile: /(textile|garment|rmg|merchandis|apparel|knit|fabric|fashion)/i,
  engineering: /(eee|electrical|civil|mechanical|engineer|electronic|power|site)/i,
};

export function catOf(job) {
  const s = `${job.title || ""} ${(job.major_list || []).join(" ")} ${job.category || ""}`;
  for (const k of Object.keys(KEYS)) if (KEYS[k].test(s)) return k;
  return null;
}

export default function JobStarSky({ onCount, introT0 = null }) {
  useLang();
  const cv = useRef(null);
  const [jobs, setJobs] = useState(null);
  const introRef = useRef(introT0);
  introRef.current = introT0;
  const cats = STORY_SETS.job;

  useEffect(() => {
    api("/api/jobs/").then((d) => setJobs(d.jobs || [])).catch(() => setJobs([]));
  }, []);

  const counts = useMemo(() => {
    const g = Object.fromEntries(cats.map((c) => [c.id, 0]));
    (jobs || []).forEach((j) => { const k = catOf(j); if (k && k in g) g[k]++; });
    cats.forEach((c) => { if (!g[c.id]) g[c.id] = FALLBACK[c.id]; });
    return g;
  }, [jobs, cats]);

  useEffect(() => {
    if (!jobs) return;
    onCount?.(Object.values(counts).reduce((a, b) => a + b, 0), counts);
  }, [jobs, counts, onCount]);

  useEffect(() => {
    const canvas = cv.current, ctx = canvas.getContext("2d");
    const still = matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, dpr = 1, raf, visible = true;
    const rnd = ((s) => () => (s = (s * 16807) % 2147483647) / 2147483647)(11);
    const dust = Array.from({ length: 280 }, () => ({ x: rnd(), y: rnd(), s: 0.4 + rnd() * 1.3, tw: rnd() * TAU }));
    // falling stars for the intro: each one is caught by one of the galaxies
    const rain = Array.from({ length: 150 }, (_, i) => ({ g: i % 5, s0: 1.75 + rnd() * 1.35, fx: rnd(), fy: -0.05 - rnd() * 0.3, d: 0.8 + rnd() * 0.5, c: cats[i % 5].c }));
    let shoot = null, nextShoot = performance.now() + 2500;

    const resize = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
    };
    resize(); addEventListener("resize", resize);
    const io = new IntersectionObserver((e) => (visible = e[0].isIntersecting)); io.observe(canvas);

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const t = still ? 0 : now / 1000;
      const it = introRef.current != null && !still ? (now - introRef.current) / 1000 : 99;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const dustK = 0.35 + 0.65 * clamp01((it - 1.6) / 1.2);
      dust.forEach((d) => {
        ctx.globalAlpha = (0.22 + 0.38 * (0.5 + 0.5 * Math.sin(t * 1.6 + d.tw))) * dustK;
        ctx.fillStyle = "#E9E4FF"; ctx.fillRect(d.x * W, d.y * H, d.s, d.s);
      });
      ctx.globalAlpha = 1;

      if (!still && it > 6 && now > nextShoot && !shoot) {
        shoot = { x: W * (0.05 + Math.random() * 0.55), y: H * (0.04 + Math.random() * 0.25), t: 0 };
        nextShoot = now + 4200 + Math.random() * 4000;
      }
      if (shoot) {
        shoot.t += 0.016;
        const k = shoot.t / 1.1, x = shoot.x + k * W * 0.32, y = shoot.y + k * H * 0.22;
        const g = ctx.createLinearGradient(x - 120, y - 82, x, y);
        g.addColorStop(0, "rgba(255,210,100,0)"); g.addColorStop(1, `rgba(255,226,150,${1 - k})`);
        ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 120, y - 82); ctx.lineTo(x, y); ctx.stroke();
        if (k >= 1) shoot = null;
      }

      // intro rain → galaxies
      if (it < 4.6) {
        const cb = canvas.getBoundingClientRect();
        const targets = [...(canvas.closest(".hero")?.querySelectorAll(".gal-orb canvas") || [])].map((el) => {
          const r = el.getBoundingClientRect(); return [r.left - cb.left + r.width / 2, r.top - cb.top + r.height / 2];
        });
        if (targets.length) rain.forEach((p) => {
          const k = clamp01((it - p.s0) / p.d); if (k <= 0 || k >= 1) return;
          const e = k * k, [tx, ty] = targets[p.g % targets.length], sx = p.fx * W, sy = p.fy * H;
          const x = sx + (tx - sx) * e, y = sy + (ty - sy) * e, bx = x - (tx - sx) * 0.08, by = y - (ty - sy) * 0.08;
          const g = ctx.createLinearGradient(bx, by, x, y);
          g.addColorStop(0, hexA(p.c, 0)); g.addColorStop(1, hexA(p.c, 0.9 * (1 - k * 0.6)));
          ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(x, y); ctx.stroke();
          ctx.fillStyle = "#fff"; ctx.globalAlpha = 1 - k * 0.5; ctx.fillRect(x - 1, y - 1, 2, 2); ctx.globalAlpha = 1;
        });
      }
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); io.disconnect(); removeEventListener("resize", resize); };
  }, [cats]);

  return (
    <div className="jss" aria-hidden="true">
      <canvas ref={cv} className="jss-canvas" />
    </div>
  );
}

const BN = "০১২৩৪৫৬৭৮৯";
export const toBn = (n, L) => (L ? String(n).replace(/\d/g, (d) => BN[d]) : String(n));
export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a))})`;
}
