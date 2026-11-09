import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n";
import { DeerMark, Person } from "./story/people";

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (p, a, b) => clamp((p - a) / (b - a));
const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, k) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(",")})`; };

// strokes as cubic segments so the brush can follow them exactly
const RED = [[[690, 470], [760, 330], [850, 520], [930, 400]], [[930, 400], [1000, 290], [1080, 300], [1150, 290]]];
const BLUE = [[[700, 250], [790, 380], [880, 230], [960, 380]], [[960, 380], [1030, 500], [1100, 500], [1150, 470]]];
const SWIRL = [[[760, 380], [820, 250], [1000, 250], [1040, 360]], [[1040, 360], [1080, 470], [880, 520], [840, 420]], [[840, 420], [810, 340], [960, 320], [960, 390]]];
const d = (segs) => `M ${segs[0][0].join(" ")} ` + segs.map(([, a, b, c]) => `C ${a.join(" ")} ${b.join(" ")} ${c.join(" ")}`).join(" ");
function at(segs, f) {
  const n = segs.length, x = clamp(f) * n, i = Math.min(n - 1, Math.floor(x)), t = x - i;
  const [p0, p1, p2, p3] = segs[i], u = 1 - t;
  return [0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]);
}

const ARTIST = { skin: "#C48C66", hair: "bob", hairColor: "#1d120c", outfit: { type: "kurti", color: "#7A2E8C", scarf: "#F2C14E", pants: "#F3E9DC" } };
const X = 455, Y = 830, S = 0.78;

function armTo([hx, hy]) {
  const hand = [(hx - X) / S, (hy - Y) / S], sh = [58, -420];
  const mid = [(sh[0] + hand[0]) / 2, (sh[1] + hand[1]) / 2 + 46];
  return { L: [[-100, -330], [-128, -292]], R: [mid, hand] };
}

const CAPS = [
  [0.02, 0.26, "লাল — রিজেকশনের রং।", "Red — the colour of rejection."],
  [0.26, 0.5, "নীল — হতাশার রং।", "Blue — the colour of giving up."],
  [0.5, 0.72, "বিজ্ঞান বলে মেশালে বেগুনি হবে…", "Science says red + blue makes purple…"],
  [0.72, 1.01, "সোনারহরিণ বলে — সোনালি। তোমার সময় এসেছে!", "Sonarhorin says gold. Your time has come."],
];

/** Scene 6 — an artist paints red + blue… and it turns gold. “You're in the right place.” Scroll-driven. */
export default function Painter() {
  const ref = useRef(null);
  const [lang] = useLang();
  const bnL = lang === "bn";
  const [p, setP] = useState(0);
  const [tt, setTt] = useState(0);
  const [narrow, setNarrow] = useState(() => typeof window !== "undefined" && innerWidth < 760);
  useEffect(() => { const f = () => setNarrow(innerWidth < 760); addEventListener("resize", f); return () => removeEventListener("resize", f); }, []);
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf, s = performance.now();
    const loop = (n) => {
      raf = requestAnimationFrame(loop);
      const r = ref.current.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const v = reduce ? 1 : clamp(-r.top / (r.height - innerHeight));
      setP((o) => (Math.abs(o - v) > 0.001 ? v : o));
      setTt((n - s) / 1000);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const red = ease(prog(p, 0.04, 0.24)), blue = ease(prog(p, 0.28, 0.48)), swirl = ease(prog(p, 0.52, 0.7)), green = ease(prog(p, 0.56, 0.72));
  const wash = ease(prog(p, 0.72, 0.9)), words = ease(prog(p, 0.84, 0.95));
  const phase = p < 0.26 ? "red" : p < 0.5 ? "blue" : p < 0.72 ? "swirl" : "done";
  const tip = phase === "red" ? at(RED, red) : phase === "blue" ? at(BLUE, blue) : phase === "swirl" ? at(SWIRL, swirl) : [1240, 520];
  const arms = phase === "done" ? "wave" : armTo([tip[0] - 26, tip[1] + 30]);
  const brush = phase !== "done";
  const R = mix("#E5484D", "#FFB627", green), B = mix("#2D6CDF", "#F08A1C", green);
  const cap = CAPS.find(([a, b]) => p >= a && p < b) || CAPS[0];

  return (
    <section className="painter" ref={ref} aria-label="An artist paints red and blue, and it becomes gold: you are in the right place.">
      <div className="painter-stage">
        <svg viewBox={narrow ? "300 60 980 800" : "0 0 1600 900"} preserveAspectRatio={narrow ? "xMidYMid meet" : "xMidYMid slice"} className="painter-svg">
          <defs>
            <linearGradient id="pt-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFB3C7" /><stop offset=".55" stopColor="#FFD58A" /><stop offset="1" stopColor="#FFF1CF" /></linearGradient>
            <radialGradient id="pt-light" cx=".2" cy="0" r="1"><stop offset="0" stopColor="#fff" stopOpacity=".55" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
            <clipPath id="pt-canvas"><rect x="640" y="150" width="540" height="460" rx="4" /></clipPath>
            <clipPath id="pt-wash"><circle cx="910" cy="380" r={wash * 430} /></clipPath>
          </defs>
          <rect width="1600" height="900" fill="#F3EBDD" />
          <path d="M 1300 0 L 1560 0 L 1300 900 L 900 900 Z" fill="url(#pt-light)" />
          <rect x="1300" y="110" width="220" height="280" rx="6" fill="#DCEBF5" stroke="#B9A07E" strokeWidth="10" />
          <path d="M 1410 110 L 1410 390 M 1300 250 L 1520 250" stroke="#B9A07E" strokeWidth="8" />
          <rect y="740" width="1600" height="160" fill="#C9A27A" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <rect key={i} x={i * 200} y="740" width="3" height="160" fill="#b18b62" />)}
          {/* plant + paint cans */}
          <path d="M 1420 760 L 1440 680 L 1500 680 L 1520 760 Z" fill="#C2410C" />
          {[[-30, -60], [0, -90], [30, -70], [-10, -110], [20, -120]].map(([dx, dy], i) => <ellipse key={i} cx={1470 + dx} cy={680 + dy} rx="16" ry="34" fill="#2F9E44" transform={`rotate(${dx} ${1470 + dx} ${680 + dy})`} />)}
          {[["#E5484D", 1290], ["#2D6CDF", 1340], ["#FFB627", 1390]].map(([c, x]) => <g key={x}><rect x={x - 20} y="720" width="40" height="44" rx="4" fill="#ddd" /><rect x={x - 20} y="716" width="40" height="12" rx="3" fill={c} /></g>)}
          {/* easel */}
          <path d="M 760 640 L 700 860 M 1060 640 L 1120 860 M 910 120 L 910 860" stroke="#7a5230" strokeWidth="14" strokeLinecap="round" />
          <rect x="620" y="610" width="580" height="22" rx="4" fill="#8B5A2B" />
          <rect x="630" y="140" width="560" height="480" rx="6" fill="#fff" stroke="#d8cdb8" strokeWidth="6" />
          <g clipPath="url(#pt-canvas)">
            <rect x="640" y="150" width="540" height="460" fill="#FBF8F1" />
            <path d={d(RED)} stroke={R} strokeWidth="46" strokeLinecap="round" fill="none" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - red} />
            <path d={d(BLUE)} stroke={B} strokeWidth="46" strokeLinecap="round" fill="none" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - blue} opacity=".92" />
            {swirl > 0 && <path d={d(SWIRL)} stroke={mix("#7B4FD0", "#FFC23D", green)} strokeWidth="34" strokeLinecap="round" fill="none" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - swirl} />}
            {/* the painting that the gold reveals */}
            <g clipPath="url(#pt-wash)">
              <rect x="640" y="150" width="540" height="460" fill="url(#pt-sky)" />
              <circle cx="1040" cy="330" r="62" fill="#FFF3C4" />
              {[...Array(10)].map((_, i) => <line key={i} x1={1040 + Math.cos(i * 0.63) * 80} y1={330 + Math.sin(i * 0.63) * 80} x2={1040 + Math.cos(i * 0.63) * 104} y2={330 + Math.sin(i * 0.63) * 104} stroke="#F2C14E" strokeWidth="6" strokeLinecap="round" opacity={0.6 + 0.4 * Math.sin(tt * 3 + i)} />)}
              <path d="M 640 470 Q 760 390 880 450 T 1180 430 L 1180 610 L 640 610 Z" fill="#F4B63F" />
              <path d="M 640 530 Q 800 470 960 520 T 1180 500 L 1180 610 L 640 610 Z" fill="#D9861A" />
              {[...Array(9)].map((_, i) => <path key={i} d={`M ${660 + i * 60} 610 q 8 -40 2 -70 M ${672 + i * 60} 610 q 10 -34 18 -58`} stroke="#B86A10" strokeWidth="3" fill="none" opacity=".5" />)}
              <g transform="translate(800 400)"><DeerMark x={0} y={0} s={2.6} /></g>
              <text x="910" y="580" textAnchor="middle" fontSize="40" fill="#fff" fontFamily="'Galada', 'Hind Siliguri', cursive" opacity={words}>তুমি ঠিক জায়গায় এসেছো</text>
            </g>
          </g>
          {/* labels */}
          <text x="1196" y="300" fontSize="44" fill={R} fontFamily="'Galada', cursive" opacity={red * (1 - wash)}>রিজেকশন</text>
          <text x="1196" y="490" fontSize="44" fill={B} fontFamily="'Galada', cursive" opacity={blue * (1 - wash)}>হতাশা</text>
          {green > 0 && wash < 1 && [...Array(14)].map((_, i) => {
            const a = i * 0.45 + tt * 1.5, r = 140 + 120 * ((i * 37) % 10) / 10;
            return <circle key={i} cx={910 + Math.cos(a) * r} cy={380 + Math.sin(a) * r * 0.8} r={3 + (i % 3)} fill="#FFC23D" opacity={green * (1 - wash) * (0.5 + 0.5 * Math.sin(tt * 6 + i))} />;
          })}
          {/* the artist */}
          <Person x={X} y={Y} s={S} p={ARTIST} tt={tt} arms={arms} mood={phase === "done" ? "happy" : phase === "blue" ? "sad" : "neutral"} lookX={phase === "done" ? 0 : 8} />
          <ellipse cx={X - 22} cy={Y - 568 * S} rx={58 * S} ry={20 * S} fill="#E5484D" transform={`rotate(-12 ${X - 22} ${Y - 568 * S})`} />
          <circle cx={X - 6} cy={Y - 588 * S} r={7 * S} fill="#E5484D" />
          <g transform={`translate(${X - 128 * S} ${Y - 292 * S}) rotate(-16)`}>
            <ellipse rx="62" ry="40" fill="#E9D3A8" stroke="#B9A07E" strokeWidth="3" />
            {[["#E5484D", -30, -12], ["#2D6CDF", -4, -20], ["#F2C14E", 22, -12], ["#FFB627", 30, 10]].map(([c, dx, dy]) => <circle key={c} cx={dx} cy={dy} r="10" fill={c} />)}
            <ellipse cx="-24" cy="16" rx="12" ry="9" fill="#F3EBDD" />
          </g>
          {brush && (
            <g>
              <line x1={tip[0] - 26 - 60} y1={tip[1] + 30 + 54} x2={tip[0]} y2={tip[1]} stroke="#7a5230" strokeWidth="9" strokeLinecap="round" />
              <circle cx={tip[0]} cy={tip[1]} r="9" fill={phase === "red" ? R : phase === "blue" ? B : mix("#7B4FD0", "#FFC23D", green)} />
            </g>
          )}
        </svg>
        <div className="painter-copy">
          <p className={bnL ? "pc-bn" : "pc-bn pc-hand-en"} key={cap[2] + lang}>{bnL ? cap[2] : cap[3]}</p>
        </div>
        <div className={`painter-final ${p > 0.9 ? "in" : ""}`}>
          <h2 className={`h2 ${bnL ? "bn-h" : ""}`}>{bnL ? <>তুমি <em>ঠিক জায়গায়</em> এসেছো।</> : <>You're in the <em>right place.</em></>}</h2>
          <div className="row"><Link className="btn btn-lime" to="/register">{bnL ? "এখান থেকে শুরু — ফ্রি →" : "Start here — it's free →"}</Link><a className="btn btn-ghost" href="#services">{bnL ? "সার্ভিস দেখো ↑" : "See services ↑"}</a></div>
        </div>
        <div className="painter-progress"><i style={{ width: `${p * 100}%` }} /></div>
      </div>
    </section>
  );
}
