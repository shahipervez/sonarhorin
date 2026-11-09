import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fmt } from "../../utils";
import StormCloud from "../StormCloud";

const REASONS = ["REJECTED", "2+ YRS EXP", "NO REPLY", "SEEN ✓✓", "POSITION FILLED", "OVERQUALIFIED?"];

// Illustrative composite characters — the patterns come from BBS LFS 2024 / BIDS findings, the people are fictional.
export const PERSONAS = [
  { n: "Tania", m: "BBA", u: "National University", d: 212, a: 63, r: 0, q: "প্রতিটা বিজ্ঞাপনে লেখা — ২ বছরের অভিজ্ঞতা লাগবে।" },
  { n: "Arif", m: "CSE", u: "Private university", d: 147, a: 47, r: 1, q: "গিটহাবে প্রজেক্ট আছে, কিন্তু কেউ খুলেও দেখে না।" },
  { n: "Mitali", m: "EEE", u: "Rajshahi", d: 330, a: 58, r: 2, q: "ঢাকায় কাউকে চিনি না — রেফারেন্স ছাড়া কে ডাকবে?" },
  { n: "Sabbir", m: "Textile", u: "Gazipur", d: 180, a: 34, r: 1, q: "বাবা প্রতিদিন জিজ্ঞেস করেন — কোনো খবর আছে?" },
  { n: "Nusrat", m: "English", u: "Savar", d: 210, a: 41, r: 0, q: "সবাই বলে ইংরেজিতে পড়ে কোনো ভবিষ্যৎ নেই।" },
  { n: "Rahim", m: "Pharmacy", u: "Chattogram", d: 270, a: 52, r: 3, q: "ইন্টারভিউয়ে গেলেই হাত-পা কাঁপে।" },
  { n: "Jannat", m: "CSE", u: "Sylhet", d: 95, a: 30, r: 0, q: "সিভিতে কী লিখতে হয়, কেউ কোনোদিন শেখায়নি।" },
  { n: "Fahim", m: "BBA", u: "Comilla", d: 400, a: 88, r: 2, q: "তিন বছর বিসিএসের প্রস্তুতি — এখন বয়সও চলে যাচ্ছে।" },
  { n: "Priya", m: "BBA", u: "Chattogram", d: 160, a: 39, r: 1, q: "ঢাকায় ইন্টারভিউ দিতে যাওয়ার ভাড়াটাও কষ্টে জোগাড় করি।" },
  { n: "Sakib", m: "EEE", u: "Khulna", d: 240, a: 61, r: 2, q: "৬১টা অ্যাপ্লিকেশন, ২টা উত্তর — দুটোই 'না'।" },
  { n: "Lamia", m: "English", u: "Barishal", d: 120, a: 27, r: 0, q: "টিউশনি করে চলি, কিন্তু এটা তো ক্যারিয়ার না।" },
  { n: "Imran", m: "Textile", u: "Narayanganj", d: 300, a: 45, r: 1, q: "বন্ধুরা সবাই চাকরি পেয়ে গেছে, আমি এখনো বাসায়।" },
];

const DEER = `<svg viewBox="0 0 120 90" aria-hidden="true">
<g stroke-linecap="round" fill="none" stroke-width="5">
<path d="M38 55 L14 68" stroke="#B88A10"/><path d="M73 54 L95 70" stroke="#B88A10"/>
<path d="M35 52 L10 57" stroke="#E8B634"/><path d="M76 51 L100 61" stroke="#E8B634"/></g>
<ellipse cx="55" cy="45" rx="30" ry="15" fill="#E8B634"/>
<path d="M74 36 L87 16 L97 21 L84 47 Z" fill="#E8B634"/>
<ellipse cx="96" cy="19" rx="11" ry="7" transform="rotate(-18 96 19)" fill="#E8B634"/>
<path d="M88 13 L84 6 L91 10 Z" fill="#E8B634"/>
<g stroke="#F4CF5C" stroke-width="3" stroke-linecap="round" fill="none"><path d="M93 12 L89 -3 M91 3 L83 -1 M90 -1 L94 -8"/><path d="M98 11 L102 -5 M100 1 L108 -3 M101 -2 L99 -9"/></g>
<circle cx="99" cy="17" r="1.8" fill="#0E0F0C"/><ellipse cx="25" cy="38" rx="5" ry="3.5" fill="#F4CF5C"/>
<g fill="#FFF3C4" opacity=".8"><circle cx="48" cy="40" r="2.2"/><circle cx="58" cy="36" r="1.8"/><circle cx="64" cy="44" r="2"/><circle cx="42" cy="47" r="1.6"/></g></svg>`;

/**
 * Every CV in the pile is someone's story. Hover a landed CV to read it; click/tap to have the
 * সোনারহরিণ (golden deer) leap out of the portal and carry it in.
 */
export default function JobRain() {
  const heroRef = useRef(null), layerRef = useRef(null), tableRef = useRef(null), portalRef = useRef(null), deerRef = useRef(null); // portalRef = the storm cloud
  const ignRef = useRef(null), matRef = useRef(null);
  const [tip, setTip] = useState(null);
  const [rescue, setRescue] = useState(null); // { persona, count }
  const rescuedCount = useRef(0);

  useEffect(() => {
    const hero = heroRef.current, layer = layerRef.current, tableEl = tableRef.current, portal = portalRef.current, deer = deerRef.current;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W, H, T, P, C, buckets, pw, ph, BW = 18, papers = [], landed = [], acc = 0, last = 0, visible = true, raf, nextPersona = 0, sparkAt = 0;
    let ign = 12847, mat = 312, job = null;
    const byEl = new WeakMap();
    const timers = new Set();
    const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };

    function measure() {
      const hr = hero.getBoundingClientRect(); W = hr.width; H = hr.height;
      const t = tableEl.getBoundingClientRect(); T = { x: t.left - hr.left, y: t.top - hr.top, w: t.width };
      const p = portal.getBoundingClientRect();
      // the cloud: CVs rain from its underside, rescued CVs fly back into its heart
      C = { l: p.left - hr.left + p.width * 0.18, r: p.left - hr.left + p.width * 0.82, bottom: p.top - hr.top + p.height * 0.78 };
      P = { x: p.left - hr.left + p.width / 2, y: p.top - hr.top + p.height * 0.5 };
      pw = W < 600 ? 38 : 54; ph = Math.round(pw * 1.32);
      hero.style.setProperty("--pw", pw + "px"); hero.style.setProperty("--ph", ph + "px");
      buckets = new Array(Math.ceil(T.w / BW) + 2).fill(0);
      papers.forEach((p) => p.el.remove()); papers = []; landed = []; job = null; deer.style.opacity = 0;
    }
    function makeEl(pi) {
      const el = document.createElement("div"); el.className = "paper";
      let html = `<div class="pa"></div><div class="nm">${PERSONAS[pi].n}</div>`;
      for (let i = 0; i < 4; i++) html += `<div class="l" style="width:${55 + Math.random() * 40}%"></div>`;
      el.innerHTML = html + `<div class="stamp">${REASONS[(Math.random() * REASONS.length) | 0]}</div>`;
      layer.appendChild(el); return el;
    }
    function spawn() {
      const base = (Math.random() - 0.5) * 80, pi = nextPersona++ % PERSONAS.length;
      const x0 = C.l + Math.random() * (C.r - C.l - pw), tx = T.x + Math.random() * (T.w - pw);
      const p = { el: makeEl(pi), pi, x: x0, y: C.bottom - ph * 0.9, vx: (tx - x0) / 1.7, vy: 10 + Math.random() * 40,
        base, rot: base, ph: Math.random() * 6.28, st: "fall", hire: Math.random() < 0.08, s: 0.4, t: 0 };
      byEl.set(p.el, p); papers.push(p);
    }
    const bi = (p) => Math.max(0, Math.min(buckets.length - 1, Math.floor((p.x + pw / 2 - T.x) / BW)));
    function unstack(p) { (p.adds || []).forEach(([k, v]) => (buckets[k] -= v)); p.adds = []; landed = landed.filter((q) => q !== p); }
    function land(p) {
      p.st = "land"; p.b = bi(p); p.adds = [];
      [[0, 3], [-1, 1.5], [1, 1.5]].forEach(([o, v]) => { const k = p.b + o; if (k >= 0 && k < buckets.length && buckets[k] < 90) { buckets[k] += v; p.adds.push([k, v]); } });
      p.target = p.base * 0.35;
      later(() => { p.el.classList.add("stamped"); p.el.classList.add("landed"); }, 250);
      ign++; if (ignRef.current) ignRef.current.textContent = fmt(ign);
      landed.push(p);
      if (landed.length > (W < 600 ? 40 : 65)) {
        const o = landed.find((q) => q.st === "land");
        if (o) { o.el.classList.add("fade"); unstack(o); o.st = "dying"; later(() => { o.el.remove(); papers = papers.filter((q) => q !== o); }, 650); }
      }
    }
    function pulse() { portal.classList.add("gold"); later(() => portal.classList.remove("gold"), 900); }
    // lightning: flash + a short burst of extra CVs
    let nextBolt = performance.now() + 2500;
    function bolt(now) {
      if (reduce || now < nextBolt) return;
      nextBolt = now + 5000 + Math.random() * 4000;
      portal.classList.add("flash"); later(() => portal.classList.remove("flash"), 260);
      for (let k = 0; k < 3; k++) later(spawn, 120 + k * 90);
    }
    function spark(x, y) {
      const s = document.createElement("i"); s.className = "spark";
      s.style.transform = `translate(${x + (Math.random() - 0.5) * 30}px,${y + (Math.random() - 0.5) * 20}px)`;
      layer.appendChild(s); later(() => s.remove(), 700);
    }

    // rescue on click / tap
    const onClick = (e) => {
      const el = e.target.closest(".paper.landed"); if (!el) return;
      const p = byEl.get(el); if (!p || p.st !== "land" || job) return;
      unstack(p); p.st = "grabbed"; p.el.classList.add("chosen");
      job = { p, t: 0, sx: P.x, sy: P.y, tx: p.x + pw / 2, ty: p.y + ph / 2 };
      deer.style.opacity = 1; setTip(null);
    };
    const onOver = (e) => {
      if (e.pointerType !== "mouse") return; // touch: the rescue toast tells the story instead
      const el = e.target.closest(".paper.landed"); if (!el) return;
      const p = byEl.get(el); if (!p || p.st !== "land") return;
      setTip({ ...PERSONAS[p.pi], x: Math.max(150, Math.min(W - 150, p.x + pw / 2)), y: p.y });
    };
    const onOut = (e) => { if (e.target.closest(".paper.landed")) setTip(null); };
    layer.addEventListener("click", onClick); layer.addEventListener("pointerover", onOver); layer.addEventListener("pointerout", onOut);

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!visible) { last = now; return; }
      const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
      bolt(now);
      acc += dt; const every = (W < 600 ? 0.3 : 0.17) * (reduce ? 4 : 1);
      while (acc > every) { acc -= every; spawn(); }
      for (const p of papers) {
        p.t += dt;
        if (p.st === "fall") {
          if (p.s < 1) p.s = Math.min(1, p.s + dt * 2.2);
          p.vy = Math.min(p.vy + 420 * dt, 320);
          p.y += p.vy * dt; p.x += p.vx * dt + Math.sin(p.t * 2.4 + p.ph) * 26 * dt;
          p.rot = p.base + Math.sin(p.t * 3 + p.ph) * 28;
          if (p.hire && p.y > C.bottom + 140) { p.st = "hire"; p.el.classList.add("hired"); p.sx = p.x; p.sy = p.y; p.t = 0; }
          else { const ly = T.y - ph + 4 - buckets[bi(p)]; if (p.y >= ly) { p.y = ly; land(p); } }
        } else if (p.st === "land") {
          p.rot += (p.target - p.rot) * Math.min(1, dt * 10);
        } else if (p.st === "hire") {
          const k = Math.min(1, p.t / 1.4), e = k * k * (3 - 2 * k);
          p.x = p.sx + (P.x - pw / 2 - p.sx) * e; p.y = p.sy + (P.y - ph / 2 - p.sy) * e - Math.sin(e * Math.PI) * 60;
          p.s = 1 - e * 0.85; p.rot += dt * 240;
          if (k >= 1) { p.st = "gone"; p.el.remove(); mat++; if (matRef.current) matRef.current.textContent = fmt(mat); pulse(); }
        }
        if (p.st !== "gone" && p.st !== "grabbed") p.el.style.transform = `translate(${p.x}px,${p.y}px) rotate(${p.rot}deg) scale(${p.s})`;
      }
      // golden-deer rescue: portal → CV (0–0.6s), CV + deer → portal (0.6–1.5s)
      if (job) {
        job.t += dt;
        const out = Math.min(1, job.t / 0.6), back = Math.max(0, Math.min(1, (job.t - 0.6) / 0.9));
        const eo = 1 - Math.pow(1 - out, 3), eb = back * back * (3 - 2 * back);
        let x, y, dir, sc;
        if (back <= 0) { x = job.sx + (job.tx - job.sx) * eo; y = job.sy + (job.ty - job.sy) * eo - Math.sin(eo * Math.PI) * 160; dir = job.tx >= job.sx ? 1 : -1; sc = 0.35 + 0.65 * eo; }
        else { x = job.tx + (job.sx - job.tx) * eb; y = job.ty + (job.sy - job.ty) * eb - Math.sin(eb * Math.PI) * 180; dir = job.sx >= job.tx ? 1 : -1; sc = 1 - 0.8 * eb; }
        const dw = W < 600 ? 90 : 130;
        deer.style.width = dw + "px";
        deer.style.transform = `translate(${x - dw / 2}px,${y - dw * 0.45}px) scale(${dir * sc},${sc}) rotate(${Math.sin(job.t * 14) * 4}deg)`;
        if (back > 0) {
          const p = job.p; p.x = x - pw / 2 + dir * 8; p.y = y + 4; p.rot = Math.sin(job.t * 10) * 12; p.s = sc;
          p.el.style.transform = `translate(${p.x}px,${p.y}px) rotate(${p.rot}deg) scale(${p.s})`;
        }
        if (!reduce && now - sparkAt > 35) { sparkAt = now; spark(x, y); }
        if (job.t >= 1.5) {
          const p = job.p; p.st = "gone"; p.el.remove(); papers = papers.filter((q) => q !== p);
          deer.style.opacity = 0; pulse(); mat++; if (matRef.current) matRef.current.textContent = fmt(mat);
          rescuedCount.current += 1; setRescue({ persona: PERSONAS[p.pi], count: rescuedCount.current, at: Date.now() }); setTip(null);
          job = null;
        }
      }
      papers = papers.filter((p) => p.st !== "gone");
    }
    measure();
    let rt; const onResize = () => { clearTimeout(rt); rt = setTimeout(measure, 200); };
    addEventListener("resize", onResize);
    const io = new IntersectionObserver((e) => (visible = e[0].isIntersecting)); io.observe(hero);
    const onVis = () => (visible = !document.hidden); document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf); io.disconnect(); removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis); timers.forEach(clearTimeout); clearTimeout(rt);
      layer.removeEventListener("click", onClick); layer.removeEventListener("pointerover", onOver); layer.removeEventListener("pointerout", onOut);
      layer.innerHTML = "";
    };
  }, []);

  useEffect(() => {
    if (!rescue) return;
    const id = setTimeout(() => setRescue(null), 6500);
    return () => clearTimeout(id);
  }, [rescue]);

  return (
    <div className="hero-scene scene-job" ref={heroRef}>
      <div className="floor" />
      <StormCloud ref={portalRef} />
      <div className="table" ref={tableRef} />
      <div className="papers" ref={layerRef} />
      <div className="hero-deer" ref={deerRef} dangerouslySetInnerHTML={{ __html: DEER }} />
      {tip && (
        <div className="cv-tip" style={{ left: tip.x, top: tip.y }} role="tooltip">
          <div className="t-head"><span className="av">{tip.n[0]}</span><div><b>{tip.n}</b><small>{tip.m} · {tip.u}</small></div><span className="day">Day {tip.d}</span></div>
          <p className="bn">“{tip.q}”</p>
          <div className="t-stats"><span>📨 {tip.a} applications</span><span>📭 {tip.r} replies</span></div>
          <div className="t-foot">Tap to rescue this CV 🦌 <em>· illustrative story</em></div>
        </div>
      )}
      {rescue && (
        <div className="rescue-toast" key={rescue.at} role="status">
          <span className="ic">🦌</span>
          <div>
            <b>You rescued {rescue.persona.n}'s CV!</b>
            <span>Day {rescue.persona.d} · {rescue.persona.a} applications · {rescue.persona.m}. {rescue.count > 1 ? `${rescue.count} rescued so far.` : ""}</span>
          </div>
          <Link to="/cv" className="btn btn-lime sm">Now rescue yours →</Link>
        </div>
      )}
    </div>
  );
}
