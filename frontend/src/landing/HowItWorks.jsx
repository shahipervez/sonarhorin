import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { confetti, fmt, toast } from "../utils";
import { ART_BEES, ART_CLOCHE, ART_STORY } from "./arts";

const DECK = [
  { k: "remote", e: "🏠", q: "Remote or hybrid?", b: "বাসা থেকে কাজ করতে চাও?", y: "Remote / Hybrid" },
  { k: "dhaka", e: "🏙️", q: "Stay inside Dhaka?", b: "ঢাকার ভেতরেই থাকতে চাও?", y: "Dhaka-based" },
  { k: "startup", e: "🚀", q: "Startup vibes over corporate?", b: "স্টার্টআপ নাকি কর্পোরেট?", y: "Startup vibes" },
  { k: "learn", e: "📚", q: "Learning over salary — for now?", b: "এখন শেখাটাই আগে?", y: "Learning first" },
  { k: "mentor", e: "🧑‍🏫", q: "Need a real mentor?", b: "একজন মেন্টর চাই?", y: "Mentor needed" },
  { k: "shift", e: "🌙", q: "Night shifts are okay?", b: "নাইট শিফট চলবে?", y: "Night shift OK" },
];
const ROLES = {
  CSE: ["Junior Software Engineer", "Trainee ML Engineer", "QA Engineer (Fresher)", "Frontend Developer"],
  EEE: ["Graduate Engineer Trainee", "Network Operations Engineer", "Junior Electrical Engineer", "Field Support Engineer"],
  BBA: ["Management Trainee Officer", "Junior Executive, Marketing", "HR Associate", "Sales Associate"],
  English: ["Content Writer", "Junior Copywriter", "Customer Experience Associate", "Social Media Executive"],
  Pharmacy: ["Medical Promotion Officer", "QC Officer Trainee", "Regulatory Affairs Associate", "Production Officer"],
  Textile: ["Merchandiser Trainee", "Junior Production Officer", "IE Trainee", "Quality Assurance Officer"],
  Other: ["Operations Trainee", "Customer Success Associate", "Data Analyst Trainee", "Admin Executive"],
};
const COS = [["Nodi Labs", "#C8F560"], ["Shapla Systems", "#FFB86B"], ["Padma Pay", "#7CC4FF"], ["Kolom Media", "#FF8FB1"], ["Doyel Works", "#B9A6FF"], ["Megh Cloud", "#9BE7C4"]];
const JOBCOUNT = { CSE: 412, EEE: 186, BBA: 538, English: 149, Pharmacy: 97, Textile: 221, Other: 305 };

const STEP_INFO = [
  { art: ART_STORY, title: "Tell us what matters", body: <>We get to know your degree, skills and must-haves. No experience? Perfect. The more you tell us, <b>the better your matches will be</b>.</>, chip: "6 quick swipes · ~20 sec" },
  { art: ART_CLOCHE, title: "Let us do the work", body: <>No more endless scrolling. We sort thousands of listings and company reviews to <b>weed out every “2+ years” job</b> that ignores freshers.</>, chip: "weed" },
  { art: ART_BEES, title: "Get roles built for you", body: <>Instantly, you get a <b>shortlist of fresher jobs</b>, each with a match score that explains why. Want a bigger shortcut? Let recruiters find and contact you.</>, chip: <>Shortlist ready in&nbsp;<b>0.8s</b></> },
];

function StepCard({ i, info, active, done, onClick }) {
  const artRef = useRef(null);
  const [weed, setWeed] = useState(1204);
  useEffect(() => {
    if (info.chip !== "weed") return;
    const id = setInterval(() => setWeed((w) => w + 1 + ((Math.random() * 4) | 0)), 900);
    return () => clearInterval(id);
  }, [info.chip]);
  const move = (e) => {
    const a = artRef.current, r = a.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    a.style.setProperty("--ry", `${(x - 0.5) * 18}deg`); a.style.setProperty("--rx", `${(0.5 - y) * 14}deg`);
    a.style.setProperty("--gx", `${x * 100}%`); a.style.setProperty("--gy", `${y * 100}%`);
  };
  const leave = () => { artRef.current.style.setProperty("--ry", "0deg"); artRef.current.style.setProperty("--rx", "0deg"); };
  return (
    <button className={`step ${active ? "active" : ""} ${done ? "done" : ""}`} onClick={onClick}>
      <div className="art" ref={artRef} onPointerMove={move} onPointerLeave={leave}>
        <div style={{ position: "absolute", inset: 0 }} dangerouslySetInnerHTML={{ __html: info.art }} />
        <div className="glare" />
      </div>
      <span className="no">0{i + 1}</span>
      <h3>{info.title}</h3>
      <p>{info.body}</p>
      <span className="livechip"><i />{info.chip === "weed" ? <><b>{fmt(weed)}</b>&nbsp;jobs weeded out today</> : info.chip}</span>
    </button>
  );
}

export default function HowItWorks({ field }) {
  const [step, setStep] = useState(0);
  const [deckI, setDeckI] = useState(0);
  const [, setPrefs] = useState({});
  const prefsRef = useRef({});
  const [chips, setChips] = useState([]);
  const [log, setLog] = useState([]);
  const [dots, setDots] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applied, setApplied] = useState({});
  const stepsRef = useRef(null);
  const timers = useRef([]);
  const f = field || "CSE";

  useEffect(() => {
    const el = stepsRef.current;
    const io = new IntersectionObserver((es, o) => es.forEach((e) => { if (e.isIntersecting) { el.classList.add("in"); o.disconnect(); } }), { threshold: 0.2 });
    io.observe(el);
    return () => { io.disconnect(); timers.current.forEach(clearTimeout); };
  }, []);

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  function go(n) {
    timers.current.forEach(clearTimeout); timers.current = [];
    setStep(n);
    if (n === 1) runRadar();
    if (n === 2) buildJobs();
  }

  function decide(yes) {
    if (deckI >= DECK.length) return;
    const c = DECK[deckI];
    const np = { ...prefsRef.current, [c.k]: yes };
    prefsRef.current = np; setPrefs(np);
    setChips((x) => [...x, { yes, t: c.y }]);
    const ni = deckI + 1;
    setDeckI(ni);
    if (ni >= DECK.length) later(() => go(1), 900);
  }

  function runRadar() {
    setDots([]); setLog([]);
    for (let i = 0; i < 16; i++) later(() => setDots((d) => [...d, { a: Math.random() * 6.28, r: 12 + Math.random() * 34, x: Math.random() < 0.4 }]), i * 180);
    const prefs = prefsRef.current;
    const vibe = [prefs.remote && "Remote ✓", prefs.dhaka && "Dhaka ✓", prefs.startup && "Startup ✓", prefs.mentor && "Mentor ✓"].filter(Boolean).join("  ") || "Open to anything ✓";
    const lines = [["", `> Mitu.match --field ${f} --level fresher`], ["", "Scanning 3,912 companies…"],
      ["bad", '✕ Removed 1,204 posts asking for "2+ years experience"'], ["bad", "✕ Removed 318 posts with no salary range"],
      ["", `Matching your vibe: ${vibe}`], ["", "Reading 41,000 fresher reviews…"],
      ["ok", `✓ Found ${JOBCOUNT[f]} fresher-friendly roles`], ["ok", "✓ Shortlisted your top 4. Opening…"]];
    lines.forEach((l, i) => later(() => setLog((x) => [...x, l]), 400 + i * 620));
    later(() => { setStep(2); buildJobs(); }, 400 + lines.length * 620 + 700);
  }

  function buildJobs() {
    const p = prefsRef.current;
    const locs = p.remote ? ["Remote", "Hybrid · Dhaka", "Remote", "Hybrid · Banani"] : p.dhaka === false ? ["Chattogram", "Sylhet", "Dhaka · Mirpur", "Khulna"] : ["Dhaka · Gulshan", "Dhaka · Banani", "Dhaka · Mirpur DOHS", "Dhaka · Tejgaon"];
    const base = { CSE: 28, EEE: 25, BBA: 22, English: 20, Pharmacy: 24, Textile: 21, Other: 20 }[f];
    const cos = [...COS].sort(() => Math.random() - 0.5);
    setJobs(ROLES[f].map((r, i) => {
      const lo = base + Math.floor(Math.random() * 5);
      const tags = ["0 yrs exp", `★ ${(4.2 + Math.random() * 0.7).toFixed(1)} fresher rating`];
      if (p.mentor) tags.push("Mentor assigned"); if (p.startup) tags.push("Startup"); if (p.learn) tags.push("Paid training"); if (p.shift === false) tags.push("Day shift");
      return { role: r, co: cos[i], loc: locs[i], lo, hi: lo + 6 + Math.floor(Math.random() * 6), m: [96, 91, 88, 84][i], tags };
    }));
  }

  const restart = () => { setDeckI(0); prefsRef.current = {}; setPrefs({}); setChips([]); setApplied({}); go(0); };
  const pct = Math.round((deckI / DECK.length) * 100);

  return (
    <section className="how" id="how">
      <div className="wrap">
        <div className="how-head">
          <h2 className="h2">Sharper matches<br />for first-timers.</h2>
          <p>We know freshers. You know what you want. <b>সোনারহরিণ</b> connects the dots and brings you roles that actually say yes to zero experience.</p>
        </div>
        <div className="steps" ref={stepsRef}>
          {STEP_INFO.map((info, i) => <StepCard key={i} i={i} info={info} active={step === i} done={i < step} onClick={() => go(i)} />)}
        </div>

        <div className="stagebox">
          <div className={`panel ${step === 0 ? "on" : ""}`}>
            <div className="p-grid">
              <div>
                <Deck index={deckI} onDecide={decide} />
                <div className="deck-btns">
                  <button className="round" onClick={() => decide(false)} aria-label="No">✕</button>
                  <button className="round y" onClick={() => decide(true)} aria-label="Yes">✓</button>
                </div>
              </div>
              <div className="vibe">
                <h4>Your vibe</h4>
                <p>Swipe right for yes, left for nope. We build your match profile live.</p>
                <div className="vchips">{chips.map((c, i) => <span key={i} className={`vchip ${c.yes ? "yes" : "no"}`}>{c.yes ? "✓ " : ""}{c.t}</span>)}</div>
                <div className="meter"><div className="bar"><i style={{ width: `${pct}%` }} /></div><small>Profile {pct}% complete</small></div>
              </div>
            </div>
          </div>
          <div className={`panel ${step === 1 ? "on" : ""}`}>
            <div className="p-grid">
              <div className="radar">
                <div className="ring" style={{ "--i": "15%" }} /><div className="ring" style={{ "--i": "30%" }} /><div className="ring" style={{ "--i": "42%" }} />
                <div className="sweep" />
                {dots.map((d, i) => <i key={i} className={`cdot ${d.x ? "x" : ""}`} style={{ left: `${50 + Math.cos(d.a) * d.r}%`, top: `${50 + Math.sin(d.a) * d.r}%` }} />)}
              </div>
              <div className="log">{log.map(([c, t], i) => <div key={i} className={c}>{t}</div>)}</div>
            </div>
          </div>
          <div className={`panel ${step === 2 ? "on" : ""}`}>
            <div className="res-head">
              <h4>Your first-job matches · {f}</h4>
              <button className="btn btn-out sm" onClick={restart}>↻ Swipe again</button>
            </div>
            <div className="jobs">
              {jobs.map((j, i) => (
                <div key={j.role} className="job" style={{ animationDelay: `${i * 110}ms` }}>
                  <div className="clogo" style={{ background: j.co[1] }}>{j.co[0][0]}</div>
                  <div><h5>{j.role}</h5><div className="meta">{j.co[0]} · {j.loc}</div>
                    <div className="tags">{j.tags.map((t, k) => <span key={t} className={`tag ${k === 0 || t === "Mentor assigned" ? "g" : ""}`}>{t}</span>)}</div></div>
                  <div className="ring" style={{ "--p": j.m }}><span>{j.m}%</span></div>
                  <div className="apply"><span><b>৳{j.lo}k–{j.hi}k</b> /month</span>
                    <button className={`btn btn-ink sm ${applied[i] ? "done" : ""}`} onClick={(e) => {
                      if (applied[i]) return; setApplied({ ...applied, [i]: true });
                      const r = e.currentTarget.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top);
                      toast(`Applied to ${j.co[0]}! Mitu will prep you for the interview 🎯`);
                    }}>{applied[i] ? "Applied ✓" : "Apply in 1 tap"}</button></div>
                </div>
              ))}
            </div>
            <p className="demo-note">Demo data — companies shown are fictional. <Link to="/programs">See real Sonarhorin programs →</Link></p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Deck({ index, onDecide }) {
  const topRef = useRef(null);
  const drag = useRef({ on: false, sx: 0, sy: 0, dx: 0 });
  const [leaving, setLeaving] = useState(null);

  const down = (e) => { drag.current = { on: true, sx: e.clientX, sy: e.clientY, dx: 0 }; e.currentTarget.setPointerCapture(e.pointerId); e.currentTarget.style.transition = "none"; };
  const move = (e) => {
    const d = drag.current; if (!d.on) return;
    d.dx = e.clientX - d.sx; const dy = e.clientY - d.sy, el = e.currentTarget;
    el.style.transform = `translate(${d.dx}px,${dy * 0.3}px) rotate(${d.dx / 14}deg)`;
    el.style.setProperty("--yes", Math.max(0, Math.min(1, d.dx / 110))); el.style.setProperty("--no", Math.max(0, Math.min(1, -d.dx / 110)));
  };
  const up = (e) => {
    const d = drag.current; if (!d.on) return; d.on = false; const el = e.currentTarget; el.style.transition = "";
    if (Math.abs(d.dx) > 90) fly(d.dx > 0);
    else { el.style.transform = ""; el.style.setProperty("--yes", 0); el.style.setProperty("--no", 0); }
  };
  const fly = (yes) => {
    setLeaving({ i: index, yes });
    setTimeout(() => { setLeaving(null); onDecide(yes); }, 320);
  };
  useEffect(() => { if (topRef.current) { topRef.current.style.transform = ""; topRef.current.style.setProperty("--yes", 0); topRef.current.style.setProperty("--no", 0); } }, [index]);

  if (index >= DECK.length) return <div className="deck"><div className="swipe" style={{ cursor: "default" }}><div className="em">✅</div><div className="sq">Profile done!</div><div className="sb">Matching you now…</div></div></div>;
  const cards = [];
  for (let j = Math.min(DECK.length - 1, index + 2); j >= index; j--) {
    const c = DECK[j], depth = j - index, top = depth === 0, gone = leaving && leaving.i === j;
    const style = gone ? { transform: `translate(${leaving.yes ? 150 : -150}%,-20px) rotate(${leaving.yes ? 24 : -24}deg)`, opacity: 0, zIndex: 10, "--yes": leaving.yes ? 1 : 0, "--no": leaving.yes ? 0 : 1 }
      : { transform: top ? undefined : `translateY(${depth * 12}px) scale(${1 - depth * 0.05})`, zIndex: 10 - depth };
    cards.push(
      <div key={c.k} ref={top ? topRef : null} className="swipe" style={style}
           {...(top ? { onPointerDown: down, onPointerMove: move, onPointerUp: up, onPointerCancel: up } : {})}>
        <span className="stamp2 s-yes">YES</span><span className="stamp2 s-no">NOPE</span>
        <div className="em">{c.e}</div><div className="sq">{c.q}</div><div className="sb bn">{c.b}</div>
      </div>,
    );
  }
  return <div className="deck">{cards}</div>;
}
