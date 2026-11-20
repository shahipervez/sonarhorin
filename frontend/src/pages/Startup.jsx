import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import Scribble from "../components/Scribble";
import StartupStoryExperience from "../components/StartupStoryExperience";
import ClayScene from "../components/startup/ClayScene";
import { useLang } from "../i18n";
import { confetti, toast } from "../utils";
import "../styles/startup-clay.css";

const PENDING_KEY = "sh_pitch_name";

const SECTORS = [["edtech", "EdTech"], ["fintech", "FinTech"], ["agritech", "AgriTech"], ["health", "Health"], ["ecommerce", "E-commerce"], ["ai", "AI / SaaS"], ["logistics", "Logistics"], ["social", "Social impact"], ["other", "Other"]];
const STAGES = [["idea", "Just an idea"], ["prototype", "Prototype / MVP"], ["users", "Early users"], ["revenue", "Making revenue"]];
const FIELDS = [
  ["one_liner", "One-line pitch", "KrishiBondhu helps smallholder farmers sell straight to Dhaka restaurants.", 1],
  ["problem", "The problem", "Who suffers, how often, what it costs them. Add one number.", 4],
  ["solution", "Your solution", "What the product does on day one.", 4],
  ["market", "Market size", "Customers in Bangladesh × what they'd pay.", 3],
  ["business_model", "How you make money", "Who pays, how much, how often.", 3],
  ["traction", "Traction / proof", "Surveys, waitlist, pilot, orders — with numbers.", 3],
  ["team", "Why this team", "Skills, story, unfair advantage.", 3],
  ["use_of_funds", "Use of funds", "What the money buys in the next 6–12 months.", 3],
];
const FLOW = [["✍️", "Write", "Build your pitch here — the rubric tells you what's missing."], ["📊", "Score 45+", "A readiness score like an investor's first read."], ["📨", "Submit", "Our panel reviews every pitch within two weeks."],
  ["🎤", "Pitch day", "The strongest founders pitch live, monthly."], ["🏮", "Funded", "Funding, mentors and the সোনারহরিণ network."]];
const STATUS_STEP = { draft: 0, submitted: 2, review: 2, shortlisted: 3, pitch_day: 3, funded: 4, declined: 2 };

function Ring({ v }) {
  const C = 2 * Math.PI * 46;
  return (
    <svg className="rd-ring" viewBox="0 0 110 110"><circle cx="55" cy="55" r="46" /><circle className="f" cx="55" cy="55" r="46" style={{ strokeDasharray: `${(v / 100) * C} ${C}`, stroke: v >= 70 ? "#FFC23D" : v >= 45 ? "#E8B634" : "#E5484D" }} />
      <text x="55" y="62">{v}</text></svg>
  );
}

function Builder({ launchTick = 0 }) {
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
      <div className="pb-grid">
        <div className="pb-form">
          <div className="row2">
            <label className="field"><span>Startup name</span><input value={cur.name} disabled={locked} onChange={(e) => up("name", e.target.value)} /></label>
            <label className="field"><span>Ask (৳)</span><input type="number" min="0" value={cur.ask_amount || ""} disabled={locked} onChange={(e) => up("ask_amount", e.target.value ? +e.target.value : null)} placeholder="1000000" /></label>
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
          <label className="check"><input type="checkbox" checked={!!cur.public_story} disabled={locked} onChange={(e) => up("public_story", e.target.checked)} /> If we fund it, you may show my story publicly</label>
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
    </div>
  );
}


/* ------------------------------------------------------------------ */
/* Startup track — soft clay / isometric "startup HQ" theme.           */
/* ------------------------------------------------------------------ */
const JOURNEY = [
  ["write", ["Write", "লেখো"], ["Build your pitch here — the rubric tells you what's missing.", "এখানেই পিচ লেখো — রুব্রিক বলে দেবে কী বাকি।"]],
  ["score", ["Score 45+", "স্কোর ৪৫+"], ["A readiness score like an investor's first read.", "ইনভেস্টরের প্রথম চোখের মতো রেডিনেস স্কোর।"]],
  ["submit", ["Submit", "জমা দাও"], ["Our panel reviews every pitch within two weeks.", "প্যানেল দুই সপ্তাহে প্রতিটি পিচ রিভিউ করে।"]],
  ["pitch", ["Pitch Day", "পিচ ডে"], ["The strongest founders pitch live, monthly.", "সেরা ফাউন্ডাররা প্রতি মাসে লাইভ পিচ করে।"]],
  ["funded", ["Funded", "ফান্ডেড"], ["Funding, mentors and the সোনারহরিণ network.", "ফান্ডিং, মেন্টর আর সোনারহরিণ নেটওয়ার্ক।"]],
];
const JICON = {
  write: <path d="M5 19l1-5L16 4l4 4-10 10-5 1zM14 6l4 4" />,
  score: <><circle cx="12" cy="12" r="8" /><path d="M12 12l4-3" /></>,
  submit: <path d="M3 11l18-8-8 18-2-8-8-2z" />,
  pitch: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
  funded: <><path d="M8 4h8l-1 3H9zM7 8h10c1 4 2 8 2 10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2c0-2 1-6 2-10z" /><path d="M12 11v6M10 13h3a1 1 0 0 1 0 2h-2" /></>,
};
const STATS = [
  ["৳", 10, "L", ["pre-seed per startup", "প্রতি স্টার্টআপে প্রি-সিড"]],
  ["", 45, "+", ["readiness to submit", "স্কোর হলে সাবমিট"]],
  ["", 14, "", ["days to review", "দিনে রিভিউ"]],
  ["৳", 0, "", ["to apply", "আবেদন ফি"]],
];
const PERKS = [
  ["৳10L Pre-Seed", "৳১০ লাখ প্রি-সিড"], ["1:1 VC Mentorship", "১:১ ভিসি মেন্টরশিপ"], ["Co-Founder match", "কো-ফাউন্ডার ম্যাচ"],
  ["Monthly Pitch Day", "মাসিক পিচ ডে"], ["0% Equity Cut", "০% ইকুইটি কাট"],
];
const FAQ = [
  [["Who can apply?", "কে আবেদন করতে পারবে?"], ["Students and fresh graduates in Bangladesh with an idea, a prototype or early users. Solo founders are welcome.", "বাংলাদেশের শিক্ষার্থী ও ফ্রেশ গ্র্যাজুয়েট — আইডিয়া, প্রোটোটাইপ বা প্রথম ইউজার থাকলেই হবে। একা ফাউন্ডারও চলবে।"]],
  [["What does 45+ mean?", "৪৫+ মানে কী?"], ["The builder scores your pitch out of 100 against an investor-style rubric. At 45 you can submit; the tips show exactly what to add.", "বিল্ডার ইনভেস্টর-স্টাইল রুব্রিকে ১০০-তে স্কোর দেয়। ৪৫ হলেই সাবমিট — টিপস দেখাবে কী যোগ করতে হবে।"]],
  [["Does it cost anything?", "কোনো খরচ আছে?"], ["No. Applying is free and your draft autosaves while you write.", "না। আবেদন ফ্রি, আর লেখার সময় ড্রাফট নিজে থেকেই সেভ হয়।"]],
  [["What happens after I submit?", "সাবমিটের পর কী হয়?"], ["The panel reviews within 14 days. Shortlisted founders are invited to the monthly Pitch Day; feedback appears right on your pitch.", "প্যানেল ১৪ দিনে রিভিউ করে। শর্টলিস্টেডরা মাসিক পিচ ডে-তে ডাক পায়; ফিডব্যাক তোমার পিচেই দেখা যাবে।"]],
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
  const heroRef = useRef(null);
  const onMove = (e) => {
    const el = heroRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    el.style.setProperty("--my", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };
  const submit = (e) => { e.preventDefault(); onLaunch(name); };
  return (
    <section className="sc-hero" ref={heroRef} onPointerMove={onMove}>
      <ClayScene name={name} bn={!!L} />
      <div className="sc-hero-fade" />
      <div className="sc-hero-copy">
        <span className="sc-live"><i />{L ? "আবেদন চলছে · প্রি-সিড ৳১০ লাখ" : "Applications open · ৳10L pre-seed"}</span>
        <h1 className={L ? "bn" : ""}>
          {L ? <>তোমার স্টার্টআপ<br />লঞ্চ করো <em>আজই!</em></> : <>Launch your<br />startup <em>now!</em></>}
        </h1>
        <p>
          {L
            ? "সোনারহরিণে যেকোনো ফ্রেশার একটা আইডিয়া থেকে ফান্ডেড স্টার্টআপ বানাতে পারে। পিচ লেখো, ৪৫+ স্কোর করো, আসল ইনভেস্টরের সামনে পিচ করো — একদম ফ্রি।"
            : "With সোনারহরিণ, any fresher can turn an idea into a funded startup. Write your pitch, score 45+, and pitch to real investors. It's free."}
        </p>
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
        <small className="sc-hint">
          {user ? (L ? "নামটা দোকানের সাইনবোর্ডে দেখো — Enter দিলেই পিচ শুরু।" : "Watch your name go up on the sign — press Enter to start the pitch.")
            : (L ? "ফ্রি অ্যাকাউন্ট লাগবে — নামটা আমরা মনে রাখবো।" : "Needs a free account — we'll keep the name for you.")}
        </small>
      </div>
      <div className="sc-chip c1"><b>45+</b>{L ? "রেডিনেস → সাবমিট" : "readiness → submit"}</div>
      <div className="sc-chip c2"><i className="ok">✓</i>{L ? "১৪ দিনে প্যানেল রিভিউ" : "Panel review in 14 days"}</div>
    </section>
  );
}

function SubNav({ L, user, onStart }) {
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const on = () => setStuck(scrollY > 140);
    on(); addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);
  return (
    <div className={`sc-subnav ${stuck ? "stuck" : ""}`}>
      <a className="sc-brand" href="#top">startup<b>.</b>{L ? "সোনারহরিণ" : "sonarhorin"}</a>
      <nav>
        <a href="#how">{L ? "কিভাবে কাজ করে" : "How it works"}</a>
        <a href="#builder">{L ? "পিচ বিল্ডার" : "Pitch builder"}</a>
        <a href="#funded">{L ? "ফান্ডেড" : "Funded"}</a>
        <a href="#faq">FAQ</a>
      </nav>
      <div className="sc-subnav-r">
        {!user && <Link className="sc-btn soft" to="/login?next=/startup">{L ? "লগইন" : "Login"}</Link>}
        <button type="button" className="sc-btn navy" onClick={onStart}>{L ? "পিচ শুরু করো" : "Start pitching"}</button>
      </div>
    </div>
  );
}

function Stats({ L, fundedCount }) {
  const [ref, on] = useInView(0.3);
  const rows = fundedCount > 0 ? [...STATS, ["", fundedCount, "", ["founders funded", "ফাউন্ডার ফান্ডেড"]]] : STATS;
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
  const [act, setAct] = useState(0);
  const [hold, setHold] = useState(false);
  useEffect(() => {
    if (hold) return;
    const id = setInterval(() => setAct((a) => (a + 1) % JOURNEY.length), 2400);
    return () => clearInterval(id);
  }, [hold]);
  return (
    <section className="sc-sec" id="how">
      <Reveal className="sc-head">
        <span className="sc-eyebrow">{L ? "কিভাবে কাজ করে" : "How it works"}</span>
        <h2 className={L ? "bn" : ""}>{L ? <>আইডিয়া থেকে <em>ফান্ডিং</em> — ৫ ধাপে</> : <>From idea to <em>funded</em> in 5 steps</>}</h2>
      </Reveal>
      <div className="sc-track" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}>
        <div className="sc-track-line"><span style={{ width: `${(act / (JOURNEY.length - 1)) * 100}%` }} /></div>
        {JOURNEY.map(([k, t, d], i) => (
          <Reveal key={k} delay={i * 80} className={`sc-step ${i === act ? "on" : ""} ${i < act ? "done" : ""}`} onMouseEnter={() => setAct(i)}>
            <div className="sc-step-cube">
              <svg viewBox="0 0 24 24">{JICON[k]}</svg>
            </div>
            <small>0{i + 1}</small>
            <b>{t[L]}</b>
            <p>{d[L]}</p>
          </Reveal>
        ))}
      </div>
      <div className="sc-perks">
        {PERKS.map((p) => <span key={p[0]}>{p[L]}</span>)}
        <button type="button" className="sc-btn pink" onClick={onStart}>{L ? "এখনই শুরু করো →" : "Start now →"}</button>
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
        <span className="sc-eyebrow">{L ? "ফান্ডেড ফাউন্ডার" : "Funded founders"}</span>
        <h2 className={L ? "bn" : ""}>{L ? <>সোনারহরিণ <em>স্ট্রিট</em></> : <>The সোনারহরিণ <em>street</em></>}</h2>
        <p>{ghosts ? (L ? "প্রথম ব্যাচের দোকানগুলো এখনো খালি — তোমারটা হতে পারে প্রথম।" : "The first shops on the street are still empty — yours could open first.")
          : (L ? "যারা পিচ থেকে ফান্ডিং পর্যন্ত পৌঁছেছে।" : "Founders who went from pitch to pre-seed.")}</p>
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

function Faq({ L }) {
  return (
    <section className="sc-sec sc-faq" id="faq">
      <Reveal className="sc-head">
        <span className="sc-eyebrow">FAQ</span>
        <h2 className={L ? "bn" : ""}>{L ? <>যা সবাই <em>জানতে চায়</em></> : <>Questions founders <em>ask</em></>}</h2>
      </Reveal>
      <div className="sc-faq-list">
        {FAQ.map(([q, a], i) => (
          <Reveal key={q[0]} as="details" delay={i * 60}>
            <summary>{q[L]}<i>+</i></summary>
            <p>{a[L]}</p>
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
      <SubNav L={L} user={user} onStart={() => launch("")} />
      <Hero L={L} user={user} onLaunch={launch} />
      <Stats L={L} fundedCount={funded.length} />
      <Journey L={L} onStart={() => launch("")} />

      <section className="sc-sec" id="story">
        <Reveal className="sc-story-bar">
          <div>
            <span className="sc-eyebrow">{L ? "৩ বন্ধুর গল্প" : "A founder story"}</span>
            <b>{L ? "চায়ের দোকান থেকে স্টার্টআপ — অ্যানিমে স্টোরি" : "From a tea stall to a startup — the anime story"}</b>
          </div>
          <button type="button" className="sc-btn soft" onClick={() => setShowStory((v) => !v)}>
            {showStory ? (L ? "বন্ধ করো ▲" : "Close ▲") : (L ? "গল্পটা দেখো ▶" : "Watch the story ▶")}
          </button>
        </Reveal>
        {showStory && <div className="sc-story-frame"><StartupStoryExperience /></div>}
      </section>

      <section className="sc-sec" id="builder">
        <div className="sc-builder">
          <div className="sc-builder-head">
            <div>
              <span className="sc-eyebrow">{L ? "পিচ বিল্ডার" : "Pitch builder"}</span>
              <h2 className={L ? "bn" : ""}>{L ? <>তোমার পিচ, <em>লাইভ স্কোর</em> সহ</> : <>Your pitch, <em>scored live</em></>}</h2>
              <p>{L ? "লিখতে থাকো — অটোসেভ হবে, আর রেডিনেস স্কোর ৪৫+ হলেই প্যানেল রিভিউতে জমা দাও।" : "Keep writing — it autosaves, and once readiness hits 45+ you can submit for panel review."}</p>
            </div>
            <span className="sc-badge">PRE-SEED ৳10L</span>
          </div>
          {user ? <Builder launchTick={launchTick} /> : (
            <div className="sc-gate">
              <div className="sc-gate-ring" aria-hidden="true"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" /><circle className="f" cx="60" cy="60" r="50" /></svg><b>45+</b></div>
              <div>
                <b>{L ? "পিচ লিখতে লগইন করো" : "Log in to start your pitch"}</b>
                <p>{L ? "ড্রাফট তোমার অ্যাকাউন্টে সেভ থাকবে — যেকোনো ডিভাইস থেকে চালিয়ে যাও।" : "Drafts are saved to your account — continue from any device."}</p>
                <div className="sc-gate-actions">
                  <Link className="sc-btn navy" to="/login?next=/startup">{L ? "লগইন" : "Log in"}</Link>
                  <Link className="sc-btn soft" to="/register?next=/startup">{L ? "ফ্রি অ্যাকাউন্ট" : "Create free account"}</Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <FundedWall L={L} funded={funded} onStart={() => launch("")} />
      <Faq L={L} />

      <section className="sc-sec">
        <Reveal className="sc-cta">
          <div className="sc-cta-boxes" aria-hidden="true"><i /><i /><i /></div>
          <h2 className={L ? "bn" : ""}>{L ? <>পরের দোকানটা <em>তোমার</em>।</> : <>The next shop on the street is <em>yours</em>.</>}</h2>
          <p>{L ? "আবেদন ফ্রি · ১৪ দিনে রিভিউ · ০% ইকুইটি কাট" : "Free to apply · 14-day review · 0% equity cut"}</p>
          <button type="button" className="sc-btn pink big" onClick={() => launch("")}>{L ? "পিচ শুরু করো →" : "Start your pitch →"}</button>
        </Reveal>
      </section>
    </div>
  );
}
