import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import Scribble from "../components/Scribble";
import StartupStoryExperience from "../components/StartupStoryExperience";
import ClayScene from "../components/startup/ClayScene";
import FounderStory from "../components/startup/FounderStory";
import FunderBoard from "../components/startup/FunderBoard";
import { FUNDERS, stageOf } from "./startupFunders";
import { useLang } from "../i18n";
import { confetti, toast } from "../utils";
import "../styles/startup-clay.css";

const PENDING_KEY = "sh_pitch_name";

const SECTORS = [["edtech", "EdTech"], ["fintech", "FinTech"], ["agritech", "AgriTech"], ["health", "Health"], ["ecommerce", "E-commerce"], ["ai", "AI / SaaS"], ["logistics", "Logistics"], ["social", "Social impact"], ["other", "Other"]];
const STAGES = [["idea", "Just an idea"], ["prototype", "Prototype / MVP"], ["users", "Early users"], ["revenue", "Making revenue"]];
// Step 1 — the idea card: Idea (Submit your Business Idea), Problem, Concept Note (Solution, budget, etc.)
const IDEA = [
  ["one_liner", ["💡 Idea (Submit your Business Idea)", "💡 বিজনেস আইডিয়া (Submit your Business Idea)"], ["Detail your business idea: what is your product or service, who is it for, and what makes it special.", "তোমার বিজনেস আইডিয়া বিস্তারিত লেখো: কী প্রোডাক্ট বা সার্ভিস, কার জন্য এবং বিশেষত্ব কী।"], 3],
  ["problem", ["❗ Problem", "❗ সমস্যা"], ["What exact problem does your customer face, how severe is it, and why do current options fail?", "কাস্টমারের কোন বড় সমস্যার সমাধান করছো এবং বর্তমান উপায়ে কেন সমাধান হচ্ছে না?"], 4],
  ["solution", ["📋 Concept Note (Solution, budget, etc.)", "📋 কনসেপ্ট নোট (সমাধান, বাজেট ইত্যাদি)"], ["Explain your solution, execution plan, required seed budget/ask amount, and key milestones.", "তোমার সমাধান, বাস্তবায়নের উপায়, প্রয়োজনীয় বাজেট/ফান্ড এবং পরবর্তী মাইলস্টোনসমূহ।"], 4],
];
const ideaDone = (p) => (p.one_liner || "").trim().length >= 15 && (p.problem || "").trim().length >= 25 && (p.solution || "").trim().length >= 25;
// Step 2 — everything an investor asks before a pitch
const FIELDS = [
  ["one_liner", "One-line pitch", "", 1],
  ["problem", "The problem", "", 4],
  ["solution", "Your solution", "", 4],
  ["market", "Market size", "Customers in Bangladesh × what they'd pay.", 3],
  ["business_model", "How you make money", "Who pays, how much, how often.", 3],
  ["traction", "Traction / proof", "Surveys, waitlist, pilot, orders — with numbers.", 3],
  ["team", "Why this team", "Skills, story, unfair advantage.", 3],
  ["use_of_funds", "Use of funds", "What the money buys in the next 6–12 months.", 3],
];
const FLOW = [["💡", "Idea card"], ["📊", "Score 45+"], ["🔍", "Review"], ["🤝", "Investor intros"], ["🏮", "Raised"]];
const STATUS_STEP = { draft: 0, submitted: 2, review: 2, shortlisted: 3, pitch_day: 3, funded: 4, declined: 2 };

function Ring({ v }) {
  const C = 2 * Math.PI * 46;
  return (
    <svg className="rd-ring" viewBox="0 0 110 110"><circle cx="55" cy="55" r="46" /><circle className="f" cx="55" cy="55" r="46" style={{ strokeDasharray: `${(v / 100) * C} ${C}`, stroke: v >= 70 ? "#FFC23D" : v >= 45 ? "#E8B634" : "#E5484D" }} />
      <text x="55" y="62">{v}</text></svg>
  );
}

function Builder({ launchTick = 0, L = 0 }) {
  const [showFull, setShowFull] = useState({});
  const [list, setList] = useState(null);
  const [cur, setCur] = useState(null);
  const [saving, setSaving] = useState("");
  const dirty = useRef(false);
  const fileRef = useRef(null);
  useEffect(() => { api("/api/startups/pitches/").then((l) => { setList(l); setCur(l[0] || null); }).catch(() => setList([])); }, []);
  useEffect(() => {
    if (!cur || !dirty.current) return;
    const id = setTimeout(async () => {
      setSaving("Saving…");
      try {
        const body = Object.fromEntries(["name", "sector", "stage", "ask_amount", "video_url", "public_story", ...FIELDS.map((f) => f[0])].map((k) => [k, cur[k]]));
        if (!body.ask_amount) body.ask_amount = null;
        if (!body.video_url) delete body.video_url;
        const r = await api(`/api/startups/pitches/${cur.id}/`, { method: "PUT", body });
        dirty.current = false; setCur((c) => ({ ...c, readiness: r.readiness })); setList((l) => l.map((x) => (x.id === r.id ? r : x))); setSaving("Saved ✓");
      } catch (x) { setSaving(""); toast(x.message); }
    }, 1100);
    return () => clearTimeout(id);
  }, [cur]);

  const create = async (name = "My startup") => {
    try {
      const r = await api("/api/startups/pitches/", { method: "POST", body: { name: String(name).slice(0, 120) } });
      setList((l) => [r, ...(l || [])]); setCur(r);
    } catch (x) { toast(x.message); }
  };
  // A name typed into the hero ("My startup | …") becomes a fresh pitch — also after login/register round-trips.
  const loaded = !!list;
  useEffect(() => {
    if (!loaded) return;
    let n = null;
    try { n = sessionStorage.getItem(PENDING_KEY); sessionStorage.removeItem(PENDING_KEY); } catch { /* storage disabled */ }
    if (n) { create(n); toast(`“${n}” — pitch started`); }
  }, [loaded, launchTick]); // eslint-disable-line react-hooks/exhaustive-deps
  const up = (k, v) => { dirty.current = true; setSaving(""); setCur((c) => ({ ...c, [k]: v })); };
  const upload = async (f) => {
    if (!f) return;
    const fd = new FormData(); fd.append("file", f);
    try { const r = await api(`/api/startups/pitches/${cur.id}/deck/`, { method: "POST", form: fd }); setCur(r); setList((l) => l.map((x) => (x.id === r.id ? r : x))); toast("Deck uploaded"); }
    catch (x) { toast(x.message); }
  };
  const submit = async () => {
    try { const r = await api(`/api/startups/pitches/${cur.id}/submit/`, { method: "POST" }); setCur(r); setList((l) => l.map((x) => (x.id === r.id ? r : x))); confetti(); toast("Submitted! We'll review it within two weeks."); }
    catch (x) { toast(x.message); }
  };

  if (!list) return <p className="muted">Loading your pitches…</p>;
  if (!cur) return (
    <div className="st-empty"><Scribble text="তোমার প্রথম পিচ — এখান থেকে শুরু" arrow="down" color="#E64BD2" />
      <button className="btn btn-lime" onClick={() => create()}>+ Start a pitch</button></div>
  );
  const rd = cur.readiness || { score: 0, checks: [] };
  const locked = !["draft", "declined"].includes(cur.status);
  const step = STATUS_STEP[cur.status] ?? 0;
  const ideaOk = ideaDone(cur);
  const full = locked || showFull[cur.id] || (cur.market || cur.team || cur.traction || cur.business_model || cur.deck_name);
  return (
    <div className="pb">
      <div className="pb-tabs">
        {list.map((p) => <button key={p.id} className={p.id === cur.id ? "on" : ""} onClick={() => setCur(p)}>{p.name}<small>{p.status_label}</small></button>)}
        <button className="add" onClick={() => create()}>+ New</button>
      </div>
      {cur.status !== "draft" && (
        <div className="pb-status">
          {FLOW.map(([ic, l], i) => <span key={l} className={i <= step ? "on" : ""}><i>{ic}</i>{l}</span>)}
          <b>{cur.status_label}</b>{cur.feedback && <p className="fb"><b>Panel feedback:</b> {cur.feedback}</p>}
        </div>
      )}
      {!full ? (
        <div className="pb-idea">
          <div className="pb-idea-head">
            <span className="pb-step-chip">1 / 2</span>
            <input className="pb-idea-name" value={cur.name} onChange={(e) => up("name", e.target.value)} aria-label="Startup name" />
            <span className="muted small">{saving}</span>
          </div>
          <div className="pb-idea-cards">
            {IDEA.map(([k, t, ph, rows], i) => {
              const ok = (cur[k] || "").trim().length >= (k === "one_liner" ? 15 : 40);
              return (
                <label key={k} className={`pb-idea-card ${ok ? "ok" : ""}`} style={{ "--i": i }}>
                  <span className="pb-idea-t">{t[L]}{ok && <i>✓</i>}</span>
                  {rows === 1 ? <input value={cur[k] || ""} onChange={(e) => up(k, e.target.value)} placeholder={ph[L]} maxLength={160} />
                    : <textarea rows={rows} value={cur[k] || ""} onChange={(e) => up(k, e.target.value)} placeholder={ph[L]} />}
                </label>
              );
            })}
          </div>
          <div className="pb-idea-foot">
            <span>{L ? "বাকিটা (মার্কেট, টিম, ডেক…) পিচের আগে দিলেই হবে।" : "The rest (market, team, deck…) comes later, before you pitch."}</span>
            <button type="button" className="btn btn-lime" disabled={!ideaOk} onClick={() => setShowFull((m) => ({ ...m, [cur.id]: true }))}>
              {ideaOk ? (L ? "পরের ধাপ: পুরো পিচ →" : "Next: full pitch →") : (L ? "৩টা ঘর পূরণ করো" : "Fill the 3 boxes")}
            </button>
          </div>
        </div>
      ) : (
      <div className="pb-grid">
        <div className="pb-form">
          <p className="pb-step2"><span className="pb-step-chip">2 / 2</span>{L ? "পিচের আগে বাকি তথ্য" : "Before you pitch"}</p>
          <div className="row2">
            <label className="field"><span>Startup name</span><input value={cur.name} disabled={locked} onChange={(e) => up("name", e.target.value)} /></label>
            <label className="field"><span>Raising (৳)</span><input type="number" min="0" value={cur.ask_amount || ""} disabled={locked} onChange={(e) => up("ask_amount", e.target.value ? +e.target.value : null)} placeholder="1000000" /></label>
          </div>
          <div className="row2">
            <label className="field"><span>Sector</span><select value={cur.sector} disabled={locked} onChange={(e) => up("sector", e.target.value)}>{SECTORS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            <label className="field"><span>Stage</span><select value={cur.stage} disabled={locked} onChange={(e) => up("stage", e.target.value)}>{STAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          </div>
          {FIELDS.map(([k, l, ph, rows]) => (
            <label key={k} className="field"><span>{l}</span>
              {rows === 1 ? <input value={cur[k] || ""} disabled={locked} onChange={(e) => up(k, e.target.value)} placeholder={ph} maxLength={160} />
                : <textarea rows={rows} value={cur[k] || ""} disabled={locked} onChange={(e) => up(k, e.target.value)} placeholder={ph} />}
            </label>
          ))}
          <div className="deck-up" onClick={() => !locked && fileRef.current.click()} role="button" tabIndex={0}>
            <input ref={fileRef} type="file" accept=".pdf" hidden onChange={(e) => upload(e.target.files[0])} />
            <span>📎</span><div><b>{cur.deck_name || "Upload your pitch deck (PDF, max 10 MB)"}</b><small>10–12 slides</small></div>
          </div>
          <label className="check"><input type="checkbox" checked={!!cur.public_story} disabled={locked} onChange={(e) => up("public_story", e.target.checked)} /> If I raise money, you may show my story publicly</label>
        </div>
        <aside className="pb-score">
          <div className="sticky">
            <p className="eyebrow light">Pitch readiness</p>
            <Ring v={rd.score} />
            <b className="verdict">{rd.verdict}</b>
            <ul className="rubric">{rd.checks.map((c) => <li key={c.key} className={c.ok ? "ok" : ""}><i>{c.ok ? "✓" : "·"}</i><span><b>{c.label}</b>{!c.ok && <small>{c.tip}</small>}</span><em>{c.points}/{c.max}</em></li>)}</ul>
            <span className="muted small">{saving}</span>
            {locked ? <p className="small">Locked while we review it.</p>
              : <button className="btn btn-lime wide" disabled={rd.score < 45} onClick={submit}>{rd.score < 45 ? `Reach 45 to submit (${rd.score})` : "Submit for review →"}</button>}
          </div>
        </aside>
      </div>
      )}
    </div>
  );
}


/* ------------------------------------------------------------------ */
/* Startup track — soft clay / isometric "startup HQ" theme.           */
/* ------------------------------------------------------------------ */
const JOURNEY = [
  ["write", ["Idea card", "আইডিয়া কার্ড"]],
  ["score", ["Score it", "স্কোর"]],
  ["pitch", ["Pitch kit", "পিচ কিট"]],
  ["submit", ["Match funders", "ফান্ডার ম্যাচ"]],
  ["funded", ["Raise", "ফান্ড তোলো"]],
];
const JICON = {
  write: <path d="M5 19l1-5L16 4l4 4-10 10-5 1zM14 6l4 4" />,
  score: <><circle cx="12" cy="12" r="8" /><path d="M12 12l4-3" /></>,
  submit: <path d="M3 11l18-8-8 18-2-8-8-2z" />,
  pitch: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
  funded: <><path d="M8 4h8l-1 3H9zM7 8h10c1 4 2 8 2 10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2c0-2 1-6 2-10z" /><path d="M12 11v6M10 13h3a1 1 0 0 1 0 2h-2" /></>,
};
const STATS = [
  ["", FUNDERS.length, "", ["funders · BD + global", "ফান্ডার · দেশ + বিদেশ"]],
  ["$", 500, "K", ["Y Combinator deal", "Y Combinator ডিল"]],
  ["৳", 50, "L", ["max BD govt grant", "সর্বোচ্চ সরকারি অনুদান"]],
  ["", 3, "", ["boxes to start", "ঘর দিয়ে শুরু"]],
];
function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (!("IntersectionObserver" in window)) { setOn(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, on];
}

function Reveal({ children, className = "", as: Tag = "div", delay = 0, style, ...rest }) {
  const [ref, on] = useInView(0.15);
  return <Tag ref={ref} className={`sc-rv ${on ? "in" : ""} ${className}`} style={{ "--d": `${delay}ms`, ...style }} {...rest}>{children}</Tag>;
}

function CountUp({ to, run }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (to === 0) { setV(0); return; }
    let raf; const t0 = performance.now(); const dur = 1300;
    const tick = (t) => { const p = Math.min(1, (t - t0) / dur); setV(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, run]);
  return <>{v}</>;
}

function Hero({ L, user, onLaunch }) {
  const [name, setName] = useState("");
  const [launch, setLaunch] = useState(0);
  const busy = useRef(false);
  const heroRef = useRef(null);
  const onMove = (e) => {
    const el = heroRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    el.style.setProperty("--my", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };
  const onLeave = () => { heroRef.current?.style.setProperty("--mx", 0); heroRef.current?.style.setProperty("--my", 0); };
  // scroll = camera: the view dollies into the kiosk as you scroll past the hero
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = heroRef.current; if (!el) return;
        const p = Math.min(1, Math.max(0, -el.getBoundingClientRect().top / (el.offsetHeight * 0.8)));
        el.style.setProperty("--sp", p.toFixed(3));
      });
    };
    on(); addEventListener("scroll", on, { passive: true });
    return () => { removeEventListener("scroll", on); cancelAnimationFrame(raf); };
  }, []);
  // Enter = the idea launches out of the kiosk, then we go to the pitch builder
  const submit = (e) => {
    e.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setLaunch((n) => n + 1);
    // the whole view rumbles at lift-off
    heroRef.current?.querySelector(".sc-scene-wrap")?.animate(
      [{ transform: "none" }, { transform: "translate(-6px, 3px) rotate(-.4deg)" }, { transform: "translate(5px, -3px) rotate(.4deg)" }, { transform: "translate(-3px, 2px)" }, { transform: "none" }],
      { duration: 600, delay: 450, easing: "ease-in-out" });
    setTimeout(() => { busy.current = false; onLaunch(name); }, 1700);
  };
  return (
    <section className={`sc-hero ${launch ? "launched" : ""}`} ref={heroRef} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div className="sc-scene-wrap"><ClayScene name={name} bn={!!L} launch={launch} /></div>
      <div className="sc-hero-fade" />
      <div className="sc-hero-copy">
        <h1 className={`sc-hero-creative ${L ? "bn" : ""}`}>
          <span className="sh-c-item sh-c-guide">{L ? "গাইড করি" : "Guide you"}</span>
          <span className="sh-c-sep">·</span>
          <span className="sh-c-item sh-c-connect">{L ? "কানেক্ট করি" : "Connect you"}</span>
          <span className="sh-c-sep">·</span>
          <span className="sh-c-item sh-c-fund">{L ? "ফান্ড পাইয়ে দিই" : "Fund you"}</span>
        </h1>
        <p className="sc-hero-sub">{L ? "আইডিয়া লেখো → পিচ বানাও → সঠিক ফান্ডারের কাছে যাও।" : "Write the idea → build the pitch → reach the right funders."}</p>
        <form className="sc-namebar" onSubmit={submit}>
          <span className="sc-namebar-tag">
            <svg viewBox="0 0 24 24"><path d="M4 10l1.5-5h13L20 10M4 10h16M4 10v9h16v-9M9 19v-5h6v5" /></svg>
            {L ? "আমার স্টার্টআপ" : "My startup"}
          </span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40}
            placeholder={L ? "স্টার্টআপের নাম লেখো" : "Enter your startup name"} aria-label={L ? "স্টার্টআপের নাম" : "Startup name"} />
          <button type="submit" aria-label={L ? "পিচ শুরু করো" : "Start pitch"}>
            <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </form>
        <small className="sc-hint">{L ? "নাম লেখো → Enter → লঞ্চ 🚀" : "Type a name → Enter → launch 🚀"}</small>
      </div>
    </section>
  );
}

function Stats({ L, fundedCount }) {
  const [ref, on] = useInView(0.3);
  const rows = fundedCount > 0 ? [...STATS, ["", fundedCount, "", ["founders raised", "ফাউন্ডার ফান্ড পেয়েছে"]]] : STATS;
  return (
    <section className="sc-stats" ref={ref}>
      {rows.map(([pre, n, suf, lab], i) => (
        <div key={lab[0]} className={`sc-stat ${on ? "in" : ""}`} style={{ transitionDelay: `${i * 90}ms` }}>
          <b>{pre}<CountUp to={n} run={on} />{suf}</b>
          <span>{lab[L]}</span>
        </div>
      ))}
    </section>
  );
}

function Journey({ L, onStart }) {
  // the idea box travels the track as you scroll through the section
  const ref = useRef(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current; if (!el) return;
        const r = el.getBoundingClientRect();
        const v = (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.3);
        setP(Math.min(1, Math.max(0, v)));
      });
    };
    on(); addEventListener("scroll", on, { passive: true });
    return () => { removeEventListener("scroll", on); cancelAnimationFrame(raf); };
  }, []);
  const act = Math.min(JOURNEY.length - 1, Math.floor(p * JOURNEY.length));
  return (
    <section className="sc-sec" id="how" ref={ref}>
      <Reveal className="sc-head">
        <h2 className={L ? "bn" : ""}>{L ? <>আইডিয়া থেকে <em>ফান্ডিং</em></> : <>Idea to <em>funded</em></>}</h2>
      </Reveal>
      <div className="sc-track">
        <div className="sc-track-line"><span style={{ width: `${p * 100}%` }} /></div>
        <span className="sc-rider" style={{ left: `calc(10% + ${p * 80}%)` }} aria-hidden="true">{act === JOURNEY.length - 1 ? "🚀" : "📦"}</span>
        {JOURNEY.map(([k, t], i) => (
          <div key={k} className={`sc-step ${i === act ? "on" : ""} ${i < act ? "done" : ""}`}>
            <div className="sc-step-cube"><svg viewBox="0 0 24 24">{JICON[k]}</svg></div>
            <small>0{i + 1}</small>
            <b>{t[L]}</b>
          </div>
        ))}
      </div>
      <div className="sc-perks">
        <button type="button" className="sc-btn pink" onClick={onStart}>{L ? "শুরু করো →" : "Start now →"}</button>
      </div>
    </section>
  );
}

function FundedWall({ L, funded, onStart }) {
  const ghosts = funded.length === 0;
  const list = ghosts ? [0, 1, 2] : funded;
  return (
    <section className="sc-sec" id="funded">
      <Reveal className="sc-head">
        <span className="sc-eyebrow">{L ? "ফান্ড পেয়েছে" : "Raised"}</span>
        <h2 className={L ? "bn" : ""}>{L ? <>যারা <em>ফান্ড তুলেছে</em></> : <>Founders who <em>raised</em></>}</h2>
      </Reveal>
      <div className="sc-shops">
        {list.map((f, i) => ghosts ? (
          <Reveal key={i} delay={i * 90} className="sc-shop ghost">
            <div className="sc-awn" />
            <b>{L ? "তোমার স্টার্টআপ" : "Your startup"}</b>
            <small>{L ? "এই জায়গাটা খালি" : "This spot is open"}</small>
            <button type="button" className="sc-btn soft" onClick={onStart}>{L ? "দাবি করো" : "Claim it"} →</button>
          </Reveal>
        ) : (
          <Reveal key={f.name + i} delay={(i % 6) * 70} className="sc-shop" style={{ "--hue": (i * 47) % 360 }}>
            <div className="sc-awn" />
            <b>{f.name}</b>
            {f.one_liner && <p>{f.one_liner}</p>}
            <small>{f.founder}{f.university ? ` · ${f.university}` : ""}</small>
            <div className="sc-shop-foot"><span>{f.sector}</span>{f.amount ? <em>৳{Number(f.amount).toLocaleString("en-IN")}</em> : null}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export default function Startup() {
  const { user } = useAuth();
  const [lang] = useLang();
  const L = lang === "bn" ? 1 : 0;
  const nav = useNavigate();
  const [funded, setFunded] = useState([]);
  const [showStory, setShowStory] = useState(false);
  const [launchTick, setLaunchTick] = useState(0);

  useEffect(() => { api("/api/startups/funded/").then(setFunded).catch(() => {}); }, []);

  const toBuilder = () => document.getElementById("builder")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const launch = (raw) => {
    const name = (raw || "").trim();
    if (name) { try { sessionStorage.setItem(PENDING_KEY, name); } catch { /* storage disabled */ } }
    if (!user) { nav("/register?next=/startup"); return; }
    if (name) setLaunchTick((t) => t + 1);
    setTimeout(toBuilder, 60);
  };

  return (
    <div className="sc-page" id="top">
      {/* 1. Hero: Guide you · Connect you · Fund you (higher up) */}
      <Hero L={L} user={user} onLaunch={launch} />

      {/* 2. First image part: Idea to funded (5-step Journey pipeline) */}
      <Journey L={L} onStart={() => launch("")} />

      {/* 3. The funding wall */}
      <section className="sc-sec" id="funders">
        <Reveal className="sc-head">
          <span className="sc-eyebrow">{L ? "কারা ফান্ড দেয়" : "Who funds startups"}</span>
          <h2 className={L ? "bn" : ""}>{L ? <>ফান্ডিং <em>ওয়াল</em></> : <>The funding <em>wall</em></>}</h2>
          <p>{L ? "বাংলাদেশ ও আন্তর্জাতিক সরকারি অনুদান, অ্যাঞ্জেল ইনভেস্টর ও শীর্ষ অ্যাক্সেলারেটরদের সম্পূর্ণ তালিকা।" : "Verified grants, VCs, angel networks and accelerators in Bangladesh & globally."}</p>
        </Reveal>
        <FunderBoard L={L} />
      </section>

      {/* 4. Pitch builder: Idea (Submit your Business Idea), Problem, Concept Note (Solution, budget, etc.) */}
      <section className="sc-sec" id="builder">
        <div className="sc-builder">
          <div className="sc-builder-head">
            <div>
              <span className="sc-eyebrow">{L ? "পিচ বিল্ডার" : "Pitch builder"}</span>
              <h2 className={L ? "bn" : ""}>
                {L ? (
                  <>আইডিয়া <em>(Submit your Business Idea)</em>, সমস্যা ও কনসেপ্ট নোট</>
                ) : (
                  <>Idea <em>(Submit your Business Idea)</em>, Problem & Concept Note</>
                )}
              </h2>
            </div>
            <span className="sc-badge">{L ? "আইডিয়া · সমস্যা · কনসেপ্ট নোট (বাজেট)" : "IDEA · PROBLEM · CONCEPT NOTE (BUDGET)"}</span>
          </div>
          {user ? <Builder launchTick={launchTick} L={L} /> : (
            <div className="sc-gate">
              <div className="sc-gate-ring" aria-hidden="true"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" /><circle className="f" cx="60" cy="60" r="50" /></svg><b>45+</b></div>
              <div>
                <b>{L ? "বিজনেস আইডিয়া জমা দিতে লগইন করো" : "Log in to submit your business idea & pitch"}</b>
                <p className="muted small" style={{ marginTop: 4 }}>
                  {L ? "আইডিয়া, সমস্যা ও কনসেপ্ট নোট লিখে সরাসরি ফান্ডারদের কাছে পৌঁছে যাও।" : "Write your idea, problem and concept note to reach 20+ active funding sources."}</p>
                <div className="sc-gate-actions" style={{ marginTop: 12 }}>
                  <Link className="sc-btn navy" to="/login?next=/startup">{L ? "লগইন" : "Log in"}</Link>
                  <Link className="sc-btn soft" to="/register?next=/startup">{L ? "ফ্রি অ্যাকাউন্ট" : "Create free account"}</Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. Real Stories from YouTube (Founder Stories + Anime Experience) */}
      <section className="sc-sec" id="story">
        <Reveal className="sc-head">
          <h2 className={L ? "bn" : ""}>{L ? "স্টোরিজ" : "Stories"}</h2>
          <p>{L ? "বাস্তব অভিজ্ঞতার গল্প ও ফান্ডিং পাওয়ার দিকনির্দেশনা দেখুন সরাসরি ভিডিওতে।" : "Watch real startup founders share how they went from idea to raising millions."}</p>
        </Reveal>
        <FounderStory L={L} onStart={() => launch("")} />
        <div className="sc-anime">
          <button type="button" className="sc-btn soft" onClick={() => setShowStory((v) => !v)}>
            {showStory ? (L ? "অ্যানিমে বন্ধ করো ▲" : "Close anime ▲") : (L ? "অ্যানিমে ভার্সন দেখো ▶" : "Watch the anime version ▶")}
          </button>
        </div>
        {showStory && <div className="sc-story-frame"><StartupStoryExperience /></div>}
      </section>

      {/* Raised Founders */}
      <FundedWall L={L} funded={funded} onStart={() => launch("")} />
    </div>
  );
}
