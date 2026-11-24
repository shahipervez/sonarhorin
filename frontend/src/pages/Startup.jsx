import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import Scribble from "../components/Scribble";
import { StoryPlayer } from "../landing/StoryAnimation";
import { STARTUP } from "../landing/story/startup";
import ClayScene from "../components/startup/ClayScene";
import FunderBoard from "../components/startup/FunderBoard";
import StartupVideos from "../components/startup/StartupVideos";
import { FUNDERS, stageOf } from "./startupFunders";
import { useLang } from "../i18n";
import { confetti, toast } from "../utils";
import "../styles/startup-clay.css";

const PENDING_KEY = "sh_pitch_name";

const SECTORS = [["edtech", "EdTech"], ["fintech", "FinTech"], ["agritech", "AgriTech"], ["health", "Health"], ["ecommerce", "E-commerce"], ["ai", "AI / SaaS"], ["logistics", "Logistics"], ["social", "Social impact"], ["other", "Other"]];
const STAGES = [["idea", "Just an idea"], ["prototype", "Prototype / MVP"], ["users", "Early users"], ["revenue", "Making revenue"]];
// Step 1 — the idea card: Box 1 is just Your Business Idea with placeholder "Name of you Business", and the rest is structured Concept Note
const IDEA = [
  ["one_liner", ["💡 Your Business Idea", "💡 Your Business Idea"], ["Name of you Business", "Name of you Business"], 3],
  ["problem", ["❗ Problem Statement", "❗ সমস্যা (Problem Statement)"], ["What critical pain point or market inefficiency does your customer face daily? Why do current alternatives fail?", "কাস্টমার প্রতিদিন কোন জটিল সমস্যার মুখোমুখি হচ্ছে? বর্তমান বাজার ব্যবস্থার ঘাটতি কোথায়?"], 4],
  ["solution", ["📋 Concept Note (Execution, Market & Budget)", "📋 কনসেপ্ট নোট (সমাধান, মার্কেট ও বাজেট)"], ["Standard Concept Note components:\n• Proposed Solution & Value Proposition: How your product solves the core problem\n• Target Market & Beneficiaries: Target user segment and estimated demand\n• Execution Roadmap: Key milestones for the next 6-12 months\n• Budget & Use of Funds: Total funding ask and cost allocation (Tech, Team, Marketing)", "একটি প্রফেশনাল কনসেপ্ট নোটের আবশ্যক বিষয়সমূহ:\n• সমাধান ও ভ্যালু প্রপোজিশন: প্রোডাক্ট কীভাবে মূল সমস্যার সমাধান দেবে\n• মার্কেট ও বেনিফিশিয়ারি: টার্গেট গ্রাহক এবং সম্ভাব্য চাহিদার সাইজ\n• বাস্তবায়নের রোডম্যাপ: আগামী ৬-১২ মাসের মূল মাইলস্টোনসমূহ\n• বাজেট ও তহবিলের ব্যবহার: প্রয়োজনীয় ফান্ড এবং খরচের খাতসমূহ (ডেভেলপমেন্ট, টিম, মার্কেটিং)"], 6],
];
const ideaDone = (p) => (p.one_liner || "").trim().length >= 3 && (p.problem || "").trim().length >= 25 && (p.solution || "").trim().length >= 25;
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
  const removePitch = async (e, pitchId) => {
    e.stopPropagation();
    if (!window.confirm(L ? "এই ড্রাফট পিচটি মুছে ফেলতে চাও?" : "Delete this draft pitch?")) return;
    try {
      await api(`/api/startups/pitches/${pitchId}/`, { method: "DELETE" });
      setList((prev) => {
        const next = (prev || []).filter((x) => x.id !== pitchId);
        if (cur?.id === pitchId) {
          setCur(next[0] || null);
        }
        return next;
      });
      toast(L ? "পিচ মুছে ফেলা হয়েছে" : "Pitch deleted");
    } catch (x) {
      toast(x.message);
    }
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
        {list.map((p) => {
          const isDraft = p.status === "draft";
          return (
            <div key={p.id} className={`pb-tab-pill ${p.id === cur.id ? "on" : ""} ${!isDraft ? "no-del" : ""}`}>
              <button
                type="button"
                className="pb-tab-main"
                onClick={() => setCur(p)}
              >
                <span>{p.name}</span>
                <small>{p.status_label}</small>
              </button>
              {isDraft && (
                <button
                  type="button"
                  className="pb-tab-del"
                  onClick={(e) => removePitch(e, p.id)}
                  title={L ? "পিচ মুছে ফেলুন" : "Delete pitch"}
                  aria-label={L ? "পিচ মুছে ফেলুন" : "Delete pitch"}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
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
              const ok = (cur[k] || "").trim().length >= (k === "one_liner" ? 3 : 25);
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
/* Startup track — 3 boxes: Generate Idea, Pitch your Startup, Match Funders */
/* ------------------------------------------------------------------ */
const JOURNEY = [
  {
    k: "idea",
    num: "01",
    t: ["Generate Idea", "আইডিয়া জেনারেট করো"],
    desc: [
      "Validate high-impact business concepts, define urgent customer pain points, and test market willingness to pay.",
      "হাই-ইমপ্যাক্ট বিজনেস আইডিয়া ভ্যালিডেট করো, কাস্টমারের আসল সমস্যা চিহ্নিত করো এবং মার্কেট ডিমান্ড যাচাই করো।"
    ],
    icon: (
      <svg viewBox="0 0 24 24"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z" /></svg>
    ),
    color: "#F59E0B",
    bg: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
  },
  {
    k: "pitch",
    num: "02",
    t: ["Pitch your Startup", "স্টার্টআপ পিচ বানাও"],
    desc: [
      "Draft an investor-grade pitch deck, structured concept note, operational roadmap, and seed budget breakdown.",
      "ইনভেস্টর-গ্রেড পিচ ডেক, কমপ্লিট কনসেপ্ট নোট, অপারেশন্স রোডম্যাপ ও সিড বাজেটের পূর্ণাঙ্গ হিসাব প্রস্তুত করো।"
    ],
    icon: (
      <svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8" /></svg>
    ),
    color: "#E23FB8",
    bg: "linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)",
  },
  {
    k: "funders",
    num: "03",
    t: ["Match your Funders", "ফান্ডারের সাথে ম্যাচ করো"],
    desc: [
      "Connect with active angel syndicates, govt grants, and global programs like Microsoft, AWS & Google.",
      "অ্যাঞ্জেল নেটওয়ার্ক, সরকারি অনুদান এবং মাইক্রোসফট, এডব্লিউএস ও গুগলের মতো বিশ্বসেরা ফান্ডিংয়ের সাথে সরাসরি যুক্ত হও।"
    ],
    icon: (
      <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
    ),
    color: "#3B82F6",
    bg: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
  },
];
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
  return (
    <section className="sc-sec" id="how">
      <Reveal className="sc-head">
        <h2 className={L ? "bn" : ""}>
          {L ? <>আইডিয়া থেকে <em>ফান্ডিং যাত্রা</em></> : <>Idea to <em>funded</em></>}
        </h2>
        <p>
          {L
            ? "৩টি সহজ পদক্ষেপে তোমার উদ্যোগকে ইনভেস্টমেন্ট ও অনুদানের জন্য প্রস্তুত করো।"
            : "Three direct steps from raw idea to landing your first funding cheque."}
        </p>
      </Reveal>
      <div className="sc-track-3">
        {JOURNEY.map((step) => (
          <div
            key={step.k}
            className="sc-step-3"
            style={{ "--step-c": step.color, "--step-bg": step.bg }}
            onClick={onStart}
            role="button"
            tabIndex={0}
          >
            <div className="sc-step-3-head">
              <div className="sc-step-3-cube">{step.icon}</div>
              <span className="sc-step-3-num">{step.num}</span>
            </div>
            <b>{step.t[L]}</b>
            <p>{step.desc[L]}</p>
          </div>
        ))}
      </div>
      <div className="sc-perks">
        <button type="button" className="sc-btn pink" onClick={onStart}>
          {L ? "শুরু করো →" : "Start now →"}
        </button>
      </div>
    </section>
  );
}

const RAISED_FOUNDERS = [
  {
    startup: "AeroShield AI",
    founder: "Sarah Lin",
    credentials: "Co-Founder & CEO · Stanford AI Lab",
    backer: "google",
    backerBadge: "Google for Startups Accelerator",
    amount: "$150,000 Equity-Free Grant + $200K Cloud",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    projectTitle: "Autonomous industrial greenhouse emission detection",
    description: "AeroShield processes high-resolution satellite and drone thermal imaging to spot methane and pipeline leaks in real time across 12 industrial energy plants.",
    metrics: "12 Enterprise Plants · 48,000 Tons Monitored",
    ctaUrl: "https://startup.google.com/programs/accelerator/",
  },
  {
    startup: "Novus Health AI",
    founder: "Dr. Ryan Thorne",
    credentials: "Founder & Lead Researcher · MIT & Johns Hopkins",
    backer: "microsoft",
    backerBadge: "Microsoft for Startups Founders Hub",
    amount: "$350,000 Capital & Azure OpenAI Credits",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    projectTitle: "Automated clinical triage and medical documentation",
    description: "Novus integrates directly with hospital EHR systems, listening during doctor-patient visits to generate HIPAA-compliant records and triage scores automatically.",
    metrics: "45 Hospital Clinics · 68% Paperwork Cut",
    ctaUrl: "https://www.microsoft.com/en-us/startups",
  },
  {
    startup: "LogiFlow Autonomous",
    founder: "Marcus Vance",
    credentials: "Founder & CEO · Ex-Amazon Supply Chain",
    backer: "aws",
    backerBadge: "AWS Activate Portfolio Grant",
    amount: "$100,000 AWS Grant + $1.2M Seed Round",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    projectTitle: "Dynamic multi-stop fleet dispatching algorithm",
    description: "LogiFlow recalculates complex delivery routes every 90 seconds considering live traffic, driver shifts, and parcel priority, reducing carbon footprint and delays.",
    metrics: "1,200+ Fleet Vehicles · 32% Fuel Savings",
    ctaUrl: "https://aws.amazon.com/activate/",
  },
  {
    startup: "FinScale Payments",
    founder: "Kwame Osei",
    credentials: "Co-Founder · Imperial College London",
    backer: "google",
    backerBadge: "Google for Startups Black Founders Fund",
    amount: "$100,000 Cash Grant + Google Mentor",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    projectTitle: "Alternative credit underwriting API for emerging markets",
    description: "Evaluates unbanked merchant transactions via mobile money telemetry to provide instant working capital loans, backed by equity-free funding from Google.",
    metrics: "9,000+ Merchants · $4.8M Loans Disbursed",
    ctaUrl: "https://startup.google.com/",
  },
  {
    startup: "Synthetix Voice",
    founder: "David Chen",
    credentials: "Founder · Carnegie Mellon AI Researcher",
    backer: "microsoft",
    backerBadge: "Microsoft Pegasus AI Accelerator",
    amount: "$250,000 Grant + Azure Supercomputing",
    image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80",
    projectTitle: "Ultra-low latency conversational AI voice agent",
    description: "Synthesizes human-grade emotional voice responses in 30+ languages for enterprise call centers and gaming NPCs with sub-50ms latency.",
    metrics: "18 Enterprise Clients · 2.4M Monthly Calls",
    ctaUrl: "https://www.microsoft.com/en-us/startups",
  },
  {
    startup: "BioPulse Therapeutics",
    founder: "Dr. Ananya Sen",
    credentials: "Lead Scientist · Oxford PhD Biology",
    backer: "aws",
    backerBadge: "AWS Healthcare & Life Sciences",
    amount: "$150,000 AWS Tier + $2.5M Seed",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
    projectTitle: "AI-driven small molecule candidate screening",
    description: "Simulates complex protein-ligand interactions in cloud GPU clusters, shrinking initial cancer drug discovery timelines from years to weeks.",
    metrics: "4 Validated Targets · 14 Patents Filed",
    ctaUrl: "https://aws.amazon.com/health/",
  },
];

function BackerIcon({ backer }) {
  if (backer === "google") {
    return (
      <svg viewBox="0 0 24 24" className="sc-backer-icon">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
      </svg>
    );
  }
  if (backer === "microsoft") {
    return (
      <svg viewBox="0 0 24 24" className="sc-backer-icon">
        <path fill="#F25022" d="M1 1h10v10H1z" />
        <path fill="#7FBA00" d="M13 1h10v10H13z" />
        <path fill="#00A4EF" d="M1 13h10v10H1z" />
        <path fill="#FFB900" d="M13 13h10v10H13z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="sc-backer-icon">
      <path fill="#FF9900" d="M18.8 17.5c-3.7 2.7-9.1 4.1-13.8 2.1-.2-.1-.4-.3-.2-.5.5-.6 1.4-1.6 1.9-2.2.1-.2.4-.2.6-.1 3.5 1.7 7.7.7 10.8-1.5.3-.2.6 0 .7.3.3.6.8 1.4 1 1.6.2.2.1.3 0 .3z" />
      <path fill="#232F3E" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm6.9 14.5c-.3.4-1.8.8-2.6.9-.3 0-.4-.2-.2-.4 1-.9 2.1-1.3 2.1-1.3s-.1 1.1.7.8z" />
    </svg>
  );
}

function FundedWall() {
  return (
    <section className="sc-sec" id="funded">
      <Reveal className="sc-head">
        <span className="sc-eyebrow sc-eyebrow-raised">GLOBAL CAPITAL</span>
        <h2>Founders who <em>raised</em></h2>
        <p>
          Meet startup founders who successfully secured funding, equity-free grants, and cloud capital from <b>Microsoft, AWS, and Google</b>.
        </p>
      </Reveal>
      <div className="sc-raised-grid">
        {RAISED_FOUNDERS.map((f, i) => (
          <Reveal key={f.startup} delay={i * 80} className="sc-raised-card">
            <div className="sc-raised-top">
              <img src={f.image} alt={f.founder} className="sc-founder-img" loading="lazy" />
              <div className="sc-raised-meta">
                <h4>{f.startup}</h4>
                <p className="sc-founder-creds">
                  <b>{f.founder}</b> · {f.credentials}
                </p>
              </div>
            </div>

            <div className={`sc-backer-pill ${f.backer}`}>
              <BackerIcon backer={f.backer} />
              <span>{f.backerBadge}</span>
            </div>

            <div className="sc-amount-badge">{f.amount}</div>

            <h5 className="sc-proj-title">{f.projectTitle}</h5>
            <p className="sc-proj-desc">{f.description}</p>

            <div className="sc-raised-foot">
              <span className="sc-metrics-tag">⚡ {f.metrics}</span>
              <a href={f.ctaUrl} target="_blank" rel="noopener noreferrer">
                Program Details ↗
              </a>
            </div>
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

      {/* 2. 3-Box Startup Pipeline: Generate Idea, Pitch your Startup, Match your Funders (no line over boxes) */}
      <Journey L={L} onStart={() => launch("")} />

      {/* 3. Pitch builder: Your Business Idea, Problem, Concept Note (Execution, Market & Budget) */}
      <section className="sc-sec" id="builder">
        <div className="sc-builder">
          <div className="sc-builder-head">
            <div>
              <span className="sc-eyebrow">{L ? "পিচ বিল্ডার" : "Pitch builder"}</span>
              <h2 className={L ? "bn" : ""}>
                {L ? (
                  <>বিজনেস আইডিয়া <em>(Your Business Idea)</em> ও কনসেপ্ট নোট</>
                ) : (
                  <>Your Business Idea <em>& Concept Note</em></>
                )}
              </h2>
            </div>
            <span className="sc-badge">{L ? "আইডিয়া · সমস্যা · কনসেপ্ট নোট ও বাজেট" : "YOUR BUSINESS IDEA · PROBLEM · CONCEPT NOTE"}</span>
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

      {/* 4. The funding wall */}
      <section className="sc-sec" id="funders">
        <Reveal className="sc-head">
          <h2 className={L ? "bn" : ""}>{L ? <>ফান্ডিং <em>ওয়াল</em></> : <>The funding <em>wall</em></>}</h2>
          <p>{L ? "বাংলাদেশ ও আন্তর্জাতিক সরকারি অনুদান, অ্যাঞ্জেল ইনভেস্টর ও শীর্ষ অ্যাক্সেলারেটরদের সম্পূর্ণ তালিকা।" : "Verified grants, VCs, angel networks and accelerators in Bangladesh & globally."}</p>
        </Reveal>
        <FunderBoard L={L} />
      </section>

      {/* 5. Animated Startup Story Film & Global Talks */}
      <section className="sc-sec" id="story">
        <Reveal className="sc-head">
          <h2 className={L ? "bn" : ""}>{L ? "স্টোরিজ" : "Stories"}</h2>
          <p>{L ? "আইডিয়া থেকে ফান্ডিং — পুলকের সফলতার পুরো গল্প (৪৮ সেকেন্ড) ও গ্লোবাল মাস্টারক্লাস।" : "From Idea to Funding — Pulok's Journey to Success (48s animated film) and Global Masterclasses."}</p>
        </Reveal>
        <div className="sc-story-frame">
          <StoryPlayer film={STARTUP} autoplay={false} />
        </div>
        <StartupVideos L={L} />
      </section>

      {/* 6. Founders who raised: Microsoft, AWS, Google backed (In English) */}
      <FundedWall />
    </div>
  );
}
