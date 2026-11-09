import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useLang } from "../i18n";

/**
 * JOB GALAXY — a scroll-driven, live data story.
 *   Chapter 1  every star is a real job open today (spiral galaxy, parallax to the cursor)
 *   Chapter 2  stars fly into clusters by degree/major; lines join majors that share a job
 *   Chapter 3  all stars converge into the golden deer constellation
 * Hover a star to see the job; click to open it. Pure canvas, no libraries.
 */
const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const COLORS = ["#FFC23D", "#7CC4FF", "#F472B6", "#34D399", "#B9A6FF", "#FB923C", "#22D3EE", "#F87171"];

function deerPoints(n) {
  const S = 420, c = document.createElement("canvas"); c.width = c.height = S;
  const g = c.getContext("2d"); g.scale(S / 40, S / 40);
  g.lineWidth = 2.6; g.lineCap = "round"; g.strokeStyle = g.fillStyle = "#000";
  g.stroke(new Path2D("M14 15c-2-3-5-5-6-9M10 9l-4-1M12 12l-5 1M26 15c2-3 5-5 6-9M30 9l4-1M28 12l5 1"));
  g.fill(new Path2D("M13 15c2-1.5 4.5-2 7-2s5 .5 7 2c1 3-1 6-2.5 9.5L22 34c-.6 1.4-3.4 1.4-4 0l-2.5-9.5C14 21 12 18 13 15z"));
  const d = g.getImageData(0, 0, S, S).data, pts = [];
  for (let y = 0; y < S; y += 7) for (let x = 0; x < S; x += 7) if (d[(y * S + x) * 4 + 3] > 128) pts.push([x / S - 0.5, y / S - 0.5]);
  // spread n picks evenly through the shape
  const out = [];
  for (let i = 0; i < n; i++) out.push(pts[Math.floor((i * 7919) % pts.length)]);
  return out;
}

export default function JobGalaxy() {
  const [lang] = useLang();
  const L = lang === "bn" ? 1 : 0;
  const nav = useNavigate();
  const wrap = useRef(null), cv = useRef(null);
  const [jobs, setJobs] = useState(null);
  const [chapter, setChapter] = useState(0);
  const [tip, setTip] = useState(null);
  const hoverRef = useRef(null);

  useEffect(() => { api("/api/jobs/").then((d) => setJobs(d.jobs || [])).catch(() => setJobs([])); }, []);

  useEffect(() => {
    if (!jobs?.length) return;
    const canvas = cv.current, ctx = canvas.getContext("2d");
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
    };
    resize(); addEventListener("resize", resize);

    // --- data → stars
    const majorCount = {};
    jobs.forEach((j) => (j.major_list?.length ? j.major_list : ["Any"]).forEach((m) => (majorCount[m] = (majorCount[m] || 0) + 1)));
    const majors = Object.entries(majorCount).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([m]) => m);
    const idx = (m) => { const i = majors.indexOf(m); return i < 0 ? majors.length - 1 : i; };
    const deer = deerPoints(jobs.length + 520);
    const r = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(9);
    const stars = jobs.map((j, i) => {
      const ml = j.major_list?.length ? j.major_list : ["Any"], m = ml[i % ml.length], arm = i % 3, rad = 0.12 + r() * 0.42, ang = arm * (TAU / 3) + rad * 7 + r() * 0.5;
      return {
        job: j, major: m, mi: idx(m), others: ml.filter((x) => x !== m).map(idx),
        g: [Math.cos(ang) * rad, Math.sin(ang) * rad * 0.62], c: [(r() - 0.5) * 0.16, (r() - 0.5) * 0.16], d: deer[i],
        size: 2.8 + r() * 2.2, tw: r() * TAU, col: COLORS[idx(m) % COLORS.length], x: 0, y: 0,
      };
    });
    const dust = Array.from({ length: 520 }, (_, i) => {
      // spiral arms + a bright core, like a real galaxy
      const arm = i % 3, rad = Math.pow(r(), 0.7) * 0.62, ang = arm * (TAU / 3) + rad * 7 + (r() - 0.5) * 0.7;
      const core = i < 90;
      const rr = core ? r() * 0.08 : rad;
      return { g: [Math.cos(ang) * rr, Math.sin(ang) * rr * 0.62], d: deer[jobs.length + i], tw: r() * TAU, s: 0.6 + r() * 1.3, core };
    });
    const clusterPos = (i) => {
      const n = majors.length, a = -Math.PI / 2 + (i / n) * TAU;
      return [Math.cos(a) * 0.42, Math.sin(a) * 0.29 + 0.03];
    };

    let mx = 0, my = 0, raf, p = 0, lastCh = -1;
    const onMove = (e) => {
      const b = canvas.getBoundingClientRect();
      mx = (e.clientX - b.left) / b.width - 0.5; my = (e.clientY - b.top) / b.height - 0.5;
      let best = null, bd = 18;
      stars.forEach((s) => { const d = Math.hypot(s.x - (e.clientX - b.left), s.y - (e.clientY - b.top)); if (d < bd) { bd = d; best = s; } });
      hoverRef.current = best;
      setTip(best ? { x: best.x, y: best.y, title: best.job.title, co: best.job.company?.name, major: best.major } : null);
      canvas.style.cursor = best ? "pointer" : "default";
    };
    const onClick = () => { const s = hoverRef.current; if (s) nav(`/jobs?q=${encodeURIComponent(s.job.title)}`); };
    canvas.addEventListener("pointermove", onMove); canvas.addEventListener("click", onClick);
    canvas.addEventListener("pointerleave", () => { hoverRef.current = null; setTip(null); });

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const el = wrap.current; if (!el) return;
      const b = el.getBoundingClientRect();
      p = clamp(-b.top / Math.max(1, b.height - innerHeight));
      const ch = p < 0.34 ? 0 : p < 0.68 ? 1 : 2;
      if (ch !== lastCh) { lastCh = ch; setChapter(ch); }
      const k1 = ease(clamp((p - 0.22) / 0.2)), k2 = ease(clamp((p - 0.58) / 0.22));
      const t = still ? 0 : now / 1000;
      const S = Math.min(W * 0.62, H * 1.15), cx = W * (W > 760 ? 0.64 : 0.5) + mx * -18, cy = H * (W > 760 ? 0.5 : 0.4) + my * -12;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      // nebula
      const neb = ctx.createRadialGradient(cx, cy, 0, cx, cy, S * 0.6);
      neb.addColorStop(0, `rgba(${120 + k2 * 120},${70 + k2 * 120},${200 - k2 * 150},.22)`); neb.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = neb; ctx.fillRect(0, 0, W, H);
      // dust
      const spin = t * 0.04 * (1 - k2);
      dust.forEach((d) => {
        const gx = d.g[0] * Math.cos(spin) - d.g[1] * Math.sin(spin), gy = d.g[0] * Math.sin(spin) + d.g[1] * Math.cos(spin);
        const x = cx + (gx * (1 - k2) + d.d[0] * 1.15 * k2) * S, y = cy + (gy * (1 - k2) + d.d[1] * 1.15 * k2) * S;
        ctx.globalAlpha = (0.35 + 0.3 * Math.sin(t * 2 + d.tw)) * (d.core ? 1 : 0.75) * (1 - k1 * 0.55 * (1 - k2)) + k2 * 0.3;
        const ds = d.s * (1 + k2 * 0.9);
        ctx.fillStyle = k2 > 0.4 ? "#FFE3A0" : d.core ? "#FFE9C2" : "#D9D2FF"; ctx.fillRect(x, y, ds, ds);
      });
      ctx.globalAlpha = 1;
      // positions
      stars.forEach((s) => {
        const a = spin * 1.6;
        const gx = s.g[0] * Math.cos(a) - s.g[1] * Math.sin(a), gy = s.g[0] * Math.sin(a) + s.g[1] * Math.cos(a);
        const [px, py] = clusterPos(s.mi);
        const clx = px + s.c[0], cly = py + s.c[1];
        let x = gx + (clx - gx) * k1, y = gy + (cly - gy) * k1;
        x = x + (s.d[0] * 1.15 - x) * k2; y = y + (s.d[1] * 1.15 - y) * k2;
        s.x = cx + x * S; s.y = cy + y * S;
      });
      // cross-major links (chapter 2)
      const linkA = k1 * (1 - k2);
      if (linkA > 0.02) {
        ctx.lineWidth = 1;
        stars.forEach((s) => s.others.forEach((o) => {
          const [ox, oy] = clusterPos(o);
          ctx.strokeStyle = `rgba(255,255,255,${0.05 * linkA})`;
          ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(cx + ox * S, cy + oy * S); ctx.stroke();
        }));
      }
      // constellation lines (chapter 3)
      if (k2 > 0.05) {
        ctx.strokeStyle = `rgba(255,214,120,${0.22 * k2})`; ctx.lineWidth = 1;
        for (let i = 1; i < stars.length; i++) {
          const a = stars[i], b2 = stars[i - 1];
          if (Math.hypot(a.x - b2.x, a.y - b2.y) < S * 0.09) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b2.x, b2.y); ctx.stroke(); }
        }
      }
      // stars
      const hov = hoverRef.current;
      stars.forEach((s) => {
        const tw = 0.75 + 0.25 * Math.sin(t * 3 + s.tw), col = k2 > 0.5 ? "#FFD36A" : s.col;
        const sz = s.size * (s === hov ? 2.2 : 1) * (1 + k2 * 0.3);
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, sz * 6);
        g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalAlpha = 0.45 * tw; ctx.fillStyle = g; ctx.fillRect(s.x - sz * 6, s.y - sz * 6, sz * 12, sz * 12);
        ctx.globalAlpha = 1; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(s.x, s.y, sz * 0.7, 0, TAU); ctx.fill();
      });
      // cluster labels
      const la = k1 * (1 - k2);
      if (la > 0.02) {
        ctx.font = "700 13px Inter, 'Hind Siliguri', sans-serif"; ctx.textAlign = "center";
        majors.forEach((m, i) => {
          const [px, py] = clusterPos(i), x = cx + px * S, y = cy + py * S + S * 0.12;
          ctx.globalAlpha = la; ctx.fillStyle = COLORS[i % COLORS.length];
          ctx.fillText(m.toUpperCase(), x, y);
          ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.font = "500 12px Inter, sans-serif"; ctx.fillText(`${majorCount[m]} ${L ? "পদ" : "roles"}`, x, y + 17);
          ctx.font = "700 13px Inter, 'Hind Siliguri', sans-serif";
        });
        ctx.globalAlpha = 1;
      }
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); };
  }, [jobs, L, nav]);

  if (!jobs || jobs.length < 5) return null;
  const copy = [
    [L ? "প্রতিটা তারা" : "Every star is", L ? "আজকের একটা আসল চাকরি।" : "a real job, open today.", L ? `${jobs.length}টি পদ এখন খোলা — নড়াচড়া করাও, ছুঁয়ে দেখো।` : `${jobs.length} openings right now — hover one to see it.`],
    [L ? "কোন ডিগ্রি" : "Which degree", L ? "সবচেয়ে বেশি চাওয়া হচ্ছে?" : "is hiring most?", L ? "তারাগুলো মেজর অনুযায়ী জড়ো হয়। রেখা মানে একটা জব কয়েকটা মেজরের জন্য খোলা।" : "Stars gather by major. Lines mean one job is open to several majors."],
    [L ? "তোমার তারাটাও" : "Your star is", L ? "এখানেই আছে।" : "out there.", L ? "সব তারা মিলে সোনারহরিণ।" : "Together, they make the golden deer."],
  ];
  return (
    <section className="jg" ref={wrap} aria-label="Job Galaxy — live jobs visualised">
      <div className="jg-sticky">
        <canvas ref={cv} className="jg-canvas" />
        <div className="jg-copy">
          <p className="jg-k">LIVE · JOB GALAXY</p>
          {copy.map(([a, b, c], i) => (
            <div key={i} className={`jg-ch ${chapter === i ? "on" : ""}`} aria-hidden={chapter !== i}>
              <h2 className={L ? "bn" : ""}>{a} <em>{b}</em></h2>
              <p>{c}</p>
              {i === 2 && <button type="button" className="jg-cta" onClick={() => nav("/jobs")}>{L ? "তোমারটা খোঁজো" : "Find yours"} →</button>}
            </div>
          ))}
          <div className="jg-dots">{[0, 1, 2].map((i) => <i key={i} className={chapter === i ? "on" : ""} />)}</div>
        </div>
        {tip && (
          <div className="jg-tip" style={{ left: tip.x, top: tip.y }}>
            <b>{tip.title}</b><span>{tip.co} · {tip.major}</span>
          </div>
        )}
      </div>
    </section>
  );
}
