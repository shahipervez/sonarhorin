import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n";
import { useTrack } from "../track";

/* ---------- data per track ---------- */
const JOB = {
  url: "sonarhorin.com/jobs",
  q: "frontend developer",
  chips: [["0–1 yr", "০–১ বছর"], ["Dhaka", "ঢাকা"], ["Full-time", "ফুল-টাইম"], ["Remote", "রিমোট"]],
  list: [
    { t: "Junior Frontend Developer", c: "Nodi Labs", loc: "Dhaka · Full-time", m: 92, keep: 1, sk: ["React", "JS", "Git"] },
    { t: "Frontend Intern", c: "Kolom Media", loc: "Chattogram · Internship", m: 60, keep: 0, sk: ["HTML", "CSS"] },
    { t: "React Developer Trainee", c: "Padma Pay", loc: "Dhaka · Full-time", m: 81, keep: 1, sk: ["React", "API"] },
    { t: "Web Developer (Fresher)", c: "Shapla Systems", loc: "Dhaka · Full-time", m: 74, keep: 1, sk: ["JS", "PHP"] },
  ],
};
const INTERN = {
  url: "sonarhorin.com/jobs?type=internship",
  q: "marketing intern",
  chips: [["Internship", "ইন্টার্নশিপ"], ["Dhaka", "ঢাকা"], ["Paid", "পেইড"], ["Remote", "রিমোট"]],
  list: [
    { t: "Marketing Intern", c: "Kolom Media", loc: "Dhaka · 3 months · Paid", m: 90, keep: 1, sk: ["Canva", "Excel"] },
    { t: "Sales Executive", c: "Megh Pharma", loc: "Sylhet · Full-time", m: 55, keep: 0, sk: ["Sales"] },
    { t: "Brand Intern", c: "Padma Pay", loc: "Dhaka · 4 months · Paid", m: 84, keep: 1, sk: ["Social", "Copy"] },
    { t: "Content Intern", c: "Nodi Labs", loc: "Dhaka · 3 months · Paid", m: 76, keep: 1, sk: ["Writing"] },
  ],
};
const PITCH = { url: "sonarhorin.com/startup", q: "Krishi Bondhu — prices for farmers", rows: [["Problem", "সমস্যা"], ["Customer", "কাস্টমার"], ["Market", "মার্কেট"], ["Team", "টিম"]] };

const STEPS = {
  job: { h: [<>Your first job in <em>4 steps.</em></>, <>৪ ধাপে <em>প্রথম চাকরি।</em></>],
    s: [["Search", "খোঁজো", "Type a role.", "রোলের নাম লেখো।"], ["Filter", "ফিল্টার", "Fresher filters on.", "ফ্রেশার ফিল্টার চালু।"], ["Match", "ম্যাচ", "See how well you fit.", "কতটা মিলছে দেখো।"], ["Apply", "অ্যাপ্লাই", "One tap. Done.", "এক ট্যাপ। শেষ।"]],
    cta: ["/jobs", "Try it now", "এখনই ট্রাই করো"] },
  internship: { h: [<>An internship in <em>4 steps.</em></>, <>৪ ধাপে <em>ইন্টার্নশিপ।</em></>],
    s: [["Search", "খোঁজো", "Type a field.", "ফিল্ডের নাম লেখো।"], ["Filter", "ফিল্টার", "Paid, near you.", "পেইড, কাছাকাছি।"], ["Match", "ম্যাচ", "See how well you fit.", "কতটা মিলছে দেখো।"], ["Apply", "অ্যাপ্লাই", "One tap. Done.", "এক ট্যাপ। শেষ।"]],
    cta: ["/jobs?type=internship", "Try it now", "এখনই ট্রাই করো"] },
  startup: { h: [<>Idea to funding in <em>4 steps.</em></>, <>৪ ধাপে <em>আইডিয়া থেকে ফান্ড।</em></>],
    s: [["Write", "লেখো", "Your idea, 4 boxes.", "৪টা বক্সে আইডিয়া।"], ["Score", "স্কোর", "See your readiness.", "রেডিনেস স্কোর দেখো।"], ["Submit", "সাবমিট", "45+ unlocks it.", "৪৫+ হলেই সাবমিট।"], ["Get funded", "ফান্ড", "Pitch day → funded.", "পিচ ডে → ফান্ড।"]],
    cta: ["/startup", "Pitch my idea", "আইডিয়া পিচ করো"] },
};

/* ---------- scripts: base state for each step + timed actions inside it ---------- */
const typing = (q, from = 350, gap = 55) => [...q].map((_, i) => [from + i * gap, { typed: i + 1 }]);
function jobScript(d) {
  const n = d.q.length, t = 350 + n * 55;
  return {
    base: [
      { typed: 0, results: 0, chips: 0, filtered: 0, match: 0, applied: 0, toast: 0, cur: "search" },
      { typed: n, results: 1, chips: 0, filtered: 0, match: 0, applied: 0, toast: 0, cur: "go" },
      { typed: n, results: 1, chips: 2, filtered: 1, match: 0, applied: 0, toast: 0, cur: "chip1" },
      { typed: n, results: 1, chips: 2, filtered: 1, match: 1, applied: 0, toast: 0, cur: "card0" },
    ],
    run: [
      [...typing(d.q), [t + 150, { cur: "go" }], [t + 650, { click: 1 }], [t + 800, { results: 1 }]],
      [[250, { cur: "chip0" }], [800, { click: 1, chips: 1 }], [1400, { cur: "chip1" }], [1950, { click: 1, chips: 2, filtered: 1 }]],
      [[250, { cur: "card0" }], [700, { match: 1 }]],
      [[250, { cur: "apply" }], [1050, { click: 1 }], [1200, { applied: 1 }], [1800, { toast: 1 }]],
    ],
  };
}
function pitchScript() {
  const n = PITCH.q.length, t = 350 + n * 45;
  return {
    base: [
      { typed: 0, filled: 0, score: 0, submitted: 0, track: 0, cur: "idea" },
      { typed: n, filled: 4, score: 0, submitted: 0, track: 0, cur: "row3" },
      { typed: n, filled: 4, score: 72, submitted: 0, track: 0, cur: "ring" },
      { typed: n, filled: 4, score: 72, submitted: 1, track: 1, cur: "submit" },
    ],
    run: [
      [...typing(PITCH.q, 350, 45), ...[0, 1, 2, 3].flatMap((i) => [[t + 100 + i * 420, { cur: `row${i}` }], [t + 300 + i * 420, { filled: i + 1 }]])],
      [[250, { cur: "ring" }], [650, { score: 72 }]],
      [[250, { cur: "submit" }], [1000, { click: 1 }], [1150, { submitted: 1 }], [1500, { track: 1 }]],
      [[500, { track: 2 }], [1300, { track: 3 }], [2100, { track: 4 }]],
    ],
  };
}
const STEP_MS = 4800;

/* ---------- the two demo screens ---------- */
function JobScreen({ d, s, L }) {
  return (
    <>
      <div className="tm-search">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2.4" /><path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
        <span className="tm-q" data-t="search">{d.q.slice(0, s.typed)}<i className="caret" /></span>
        <span className="tm-go" data-t="go">{L ? "খোঁজো" : "Search"}</span>
      </div>
      <div className="tm-chips">{d.chips.map((c, i) => <span key={c[0]} data-t={`chip${i}`} className={i < s.chips ? "on" : ""}>{i < s.chips && "✓ "}{c[L]}</span>)}</div>
      <div className={`tm-list ${s.results ? "in" : ""}`}>
        {!s.results && [0, 1, 2].map((i) => <div key={i} className="tm-job sk"><span className="lg" /><div className="tx"><b /><small /></div></div>)}
        {!!s.results && d.list.map((j, i) => (
          <div key={j.t} data-t={`card${i}`} className={`tm-job ${s.filtered && !j.keep ? "out" : ""} ${s.match && i === 0 ? "best" : ""}`} style={{ "--i": i }}>
            <span className="lg">{j.c[0]}</span>
            <div className="tx"><b>{j.t}</b><small>{j.c} · {j.loc}</small><span className="sks">{j.sk.map((k) => <i key={k} className={s.match ? "ok" : ""}>{k}</i>)}</span></div>
            <span className={`mring ${s.match ? "on" : ""}`} style={{ "--m": s.match ? j.m : 0 }}><em>{s.match ? `${j.m}%` : ""}</em></span>
            {i === 0 && <span data-t="apply" className={`tm-apply ${s.applied ? "done" : ""}`}>{s.applied ? (L ? "অ্যাপ্লাইড ✓" : "Applied ✓") : (L ? "এক ট্যাপে অ্যাপ্লাই" : "1-tap apply")}</span>}
          </div>
        ))}
      </div>
      <div className={`tm-toast ${s.toast ? "in" : ""}`}>
        <b>✓ {d.list[0].c}</b>
        <span className="trk"><i className="on">{L ? "অ্যাপ্লাইড" : "Applied"}</i><i>{L ? "দেখেছে" : "Viewed"}</i><i>{L ? "ইন্টারভিউ" : "Interview"}</i></span>
      </div>
    </>
  );
}
function PitchScreen({ s, L }) {
  const TR = [["Submitted", "সাবমিটেড"], ["Shortlisted", "শর্টলিস্ট"], ["Pitch day", "পিচ ডে"], ["Funded 🎉", "ফান্ডেড 🎉"]];
  return (
    <div className={`tm-pitch ${s.track >= 4 ? "won" : ""}`}>
      <div className="tp-form">
        <span className="tm-q idea" data-t="idea">{PITCH.q.slice(0, s.typed)}<i className="caret" /></span>
        {PITCH.rows.map((r, i) => <div key={r[0]} className={`tp-row ${i < s.filled ? "on" : ""}`} data-t={`row${i}`}><small>{r[L]}</small><i /></div>)}
      </div>
      <div className="tp-side">
        <span className={`mring big ${s.score ? "on" : ""}`} data-t="ring" style={{ "--m": s.score }}><em className="cnt" /></span>
        <span data-t="submit" className={`tm-apply ${s.submitted ? "done" : s.score ? "" : "off"}`}>{s.submitted ? (L ? "সাবমিটেড ✓" : "Submitted ✓") : (L ? "পিচ সাবমিট" : "Submit pitch")}</span>
      </div>
      <div className="tp-track">{TR.map((x, i) => <span key={x[0]} className={i < s.track ? "on" : ""}><i />{x[L]}</span>)}</div>
      {s.track >= 4 && <div className="tm-confetti" aria-hidden="true">{[...Array(18)].map((_, i) => <i key={i} style={{ "--k": i }} />)}</div>}
    </div>
  );
}

/** Right after the hero: a self-playing walkthrough of how the site finds you a job (or funds your idea). */
export default function Tutorial() {
  const [track] = useTrack();
  const [lang] = useLang();
  const L = lang === "bn" ? 1 : 0;
  const isPitch = track === "startup";
  const data = track === "internship" ? INTERN : JOB;
  const S = STEPS[track];
  const script = useRef(null);
  script.current = isPitch ? pitchScript() : jobScript(data);

  const [step, setStep] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [s, setS] = useState(script.current.base[0]);
  const [clicks, setClicks] = useState(0);
  const [live, setLive] = useState(false);
  const secRef = useRef(null), winRef = useRef(null), curRef = useRef(null);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { threshold: 0.35 });
    io.observe(secRef.current); return () => io.disconnect();
  }, []);
  useEffect(() => { setStep(0); setCycle((c) => c + 1); }, [track]);

  // play the current step
  useEffect(() => {
    const sc = script.current;
    setS(sc.base[step]);
    if (!live) return;
    const timers = sc.run[step].map(([ms, patch]) => setTimeout(() => {
      if (patch.click) setClicks((c) => c + 1);
      const { click, ...rest } = patch; // eslint-disable-line no-unused-vars
      setS((p) => ({ ...p, ...rest }));
    }, ms));
    const last = step === 3 ? STEP_MS + 1400 : STEP_MS;
    timers.push(setTimeout(() => { setStep((x) => (x + 1) % 4); setCycle((c) => c + 1); }, last));
    return () => timers.forEach(clearTimeout);
  }, [step, cycle, live, track]);

  // move the cursor to its target
  useLayoutEffect(() => {
    const w = winRef.current, c = curRef.current;
    if (!w || !c) return;
    const place = () => {
      const el = w.querySelector(`[data-t="${s.cur}"]`);
      if (!el) return;
      const a = w.getBoundingClientRect(), b = el.getBoundingClientRect();
      const x = b.left - a.left + Math.min(b.width * 0.5, 60), y = b.top - a.top + b.height * 0.55;
      c.style.transform = `translate(${x}px,${y}px)`;
    };
    place();
    const id = setTimeout(place, 420); // after layout animations (filtering) settle
    return () => clearTimeout(id);
  }, [s.cur, s.results, s.filtered, s.applied, s.submitted, track, lang]);

  const go = (i) => { setStep(i); setCycle((c) => c + 1); };
  return (
    <section className={`tut tut-${track}`} ref={secRef} id="how">
      <div className="wrap">
        <div className="tut-head">
          <p className="eyebrow">{L ? "কীভাবে কাজ করে" : "How it works"}</p>
          <h2 className={`h2 ${L ? "bn-h" : ""}`}>{S.h[L]}</h2>
        </div>

        <div className="tut-stage">
          <div className="tut-glow" aria-hidden="true" />
          <div className="tm-win" ref={winRef} aria-hidden="true">
            <div className="tm-bar"><i /><i /><i /><span>🔒 {isPitch ? PITCH.url : data.url}</span></div>
            <div className="tm-body">{isPitch ? <PitchScreen s={s} L={L} /> : <JobScreen d={data} s={s} L={L} />}</div>
            <span className="tm-cur" ref={curRef}>
              <svg viewBox="0 0 24 24"><path d="M4 2 L4 20 L9 15.5 L12.5 22.5 L15.5 21 L12 14 L19 14 Z" fill="#12101C" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" /></svg>
              <i key={clicks} className={clicks ? "tap" : ""} />
            </span>
          </div>
          <div className="tut-floor" aria-hidden="true" />
        </div>

        <ol className="tut-steps">
          {S.s.map((x, i) => (
            <li key={x[0]}>
              <button className={`${i === step ? "on" : ""} ${i < step ? "done" : ""}`} onClick={() => go(i)} aria-current={i === step ? "step" : undefined}>
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <b className={L ? "bn" : ""}>{x[L]}</b>
                <small className={L ? "bn" : ""}>{x[2 + L]}</small>
                <span className="bar"><i key={`${cycle}-${i}`} style={{ animationDuration: `${step === 3 ? STEP_MS + 1400 : STEP_MS}ms`, animationPlayState: live ? "running" : "paused" }} /></span>
              </button>
            </li>
          ))}
        </ol>
        <div className="tut-cta"><Link to={S.cta[0]} className="btn btn-ink">{S.cta[1 + L]} →</Link></div>
      </div>
    </section>
  );
}
