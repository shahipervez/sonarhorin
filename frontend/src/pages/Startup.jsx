import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import BeyondStartupHero from "../components/BeyondStartupHero";
import Scribble from "../components/Scribble";
import StartupStoryExperience from "../components/StartupStoryExperience";
import { useLang } from "../i18n";
import { confetti, toast } from "../utils";

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

function Builder() {
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

  const create = async () => {
    const r = await api("/api/startups/pitches/", { method: "POST", body: { name: "My startup" } });
    setList((l) => [r, ...(l || [])]); setCur(r);
  };
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
    <div className="st-empty"><Scribble text="তোমার প্রথম পিচ — এখান থেকে শুরু" arrow="down" color="#FFE27A" />
      <button className="btn btn-lime" onClick={create}>+ Start a pitch</button></div>
  );
  const rd = cur.readiness || { score: 0, checks: [] };
  const locked = !["draft", "declined"].includes(cur.status);
  const step = STATUS_STEP[cur.status] ?? 0;
  return (
    <div className="pb">
      <div className="pb-tabs">
        {list.map((p) => <button key={p.id} className={p.id === cur.id ? "on" : ""} onClick={() => setCur(p)}>{p.name}<small>{p.status_label}</small></button>)}
        <button className="add" onClick={create}>+ New</button>
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
/* Startup track — minimal, visual layout.                             */
/* ------------------------------------------------------------------ */
const JOURNEY = [
  ["write", ["Write", "লেখো"]],
  ["score", ["Score 45+", "স্কোর ৪৫+"]],
  ["submit", ["Submit", "জমা দাও"]],
  ["pitch", ["Pitch Day", "পিচ ডে"]],
  ["funded", ["Funded", "ফান্ডেড"]],
];
const JICON = {
  write: <path d="M5 19l1-5L16 4l4 4-10 10-5 1zM14 6l4 4" />,
  score: <><circle cx="12" cy="12" r="8" /><path d="M12 12l4-3" /></>,
  submit: <path d="M3 11l18-8-8 18-2-8-8-2z" />,
  pitch: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
  funded: <><path d="M8 4h8l-1 3H9zM7 8h10c1 4 2 8 2 10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2c0-2 1-6 2-10z" /><path d="M12 11v6M10 13h3a1 1 0 0 1 0 2h-2" /></>,
};
const STATS = [
  ["45+", ["readiness to submit", "স্কোর হলে সাবমিট"]],
  ["14", ["days to review", "দিনে রিভিউ"]],
  ["৳0", ["to apply", "আবেদন ফি"]],
];

function Reveal({ children, className = "", as: Tag = "div", ...rest }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={`stx-rv ${on ? "in" : ""} ${className}`} {...rest}>{children}</Tag>;
}

function Film({ L }) {
  const v = useRef(null);
  const [playing, setPlaying] = useState(false);
  const play = () => { const el = v.current; if (!el) return; el.currentTime = 0; el.play(); setPlaying(true); };
  return (
    <div className={`stx-film ${playing ? "playing" : ""}`}>
      <video ref={v} src="/stories/intro.mp4" poster="/stories/intro.jpg" muted playsInline onEnded={() => setPlaying(false)} />
      {!playing && (
        <button type="button" className="stx-play" onClick={play} aria-label="Play">
          <span>▶</span>
          <b>{L ? "৩ বন্ধুর গল্প" : "3 friends. 1 tea stall."}</b>
        </button>
      )}
    </div>
  );
}

export default function Startup() {
  const { user } = useAuth();
  const [lang] = useLang();
  const L = lang === "bn" ? 1 : 0;
  const [funded, setFunded] = useState([]);
  const [showFullStory, setShowFullStory] = useState(false);

  useEffect(() => {
    api("/api/startups/funded/")
      .then(setFunded)
      .catch(() => {});
  }, []);

  const handleCardClick = (cardId) => {
    if (cardId === "spark" || cardId === "settle") {
      setShowFullStory(true);
      setTimeout(() => {
        document.getElementById("story-experience")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else if (cardId === "pitch") {
      document.getElementById("builder")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="by-page">
      {/* 1. Cinematic Beyond-Style Minimal Hero with 3D Video Animation */}
      <BeyondStartupHero
        onSelectCard={handleCardClick}
        onStartPitch={() => document.getElementById("builder")?.scrollIntoView({ behavior: "smooth" })}
      />

      {/* 2. Interactive Anime Cartoon Story / Video (Cleanly togglable or expandable) */}
      <section className="stx-sec" id="story-section" style={{ maxWidth: 1100, margin: "1rem auto 3rem", padding: "0 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <span style={{ fontSize: "0.85rem", color: "#8f98af", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
            {L ? "💡 ভিজ্যুয়াল অ্যানিমে স্টোরি" : "💡 Visual Anime Story"}
          </span>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ fontSize: "0.82rem", padding: "0.3rem 0.8rem", color: "#ffc23d", borderColor: "rgba(255,194,61,0.3)" }}
            onClick={() => setShowFullStory(!showFullStory)}
          >
            {showFullStory ? (L ? "সংক্ষেপ করো ▲" : "Collapse ▲") : (L ? "কার্টুন গল্প ও ভিডিও দেখুন ▼" : "Watch Anime Story & Video ▼")}
          </button>
        </div>

        {showFullStory && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <StartupStoryExperience />
          </div>
        )}
      </section>

      {/* 3. Streamlined Clean Pitch Builder */}
      <section className="by-builder-sec" id="builder">
        <div className="by-builder-card">
          <div className="by-builder-header">
            <div>
              <h2 className="by-builder-title">
                {L ? <>পিচ <em>বিল্ডার</em></> : <>Pitch <em>Builder.</em></>}
              </h2>
              <p style={{ margin: "0.4rem 0 0", color: "#8f98af", fontSize: "0.88rem" }}>
                {L
                  ? "তোমার স্টার্টআপ আইডিয়া জমা দাও — রেডিনেস স্কোর ৪৫+ হলেই সরাসরি প্যানেল রিভিউ।"
                  : "Submit your startup idea — reach readiness 45+ to qualify for panel review."}
              </p>
            </div>
            <span style={{ fontSize: "0.8rem", color: "#ffc23d", background: "rgba(255,194,61,0.1)", border: "1px solid rgba(255,194,61,0.3)", padding: "4px 12px", borderRadius: 999, fontWeight: 700 }}>
              PRE-SEED ৳10L
            </span>
          </div>

          {user ? (
            <Builder />
          ) : (
            <Reveal className="stx-login" style={{ margin: "2rem auto" }}>
              <div className="stx-ring" aria-hidden="true">
                <svg viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" />
                  <circle className="f" cx="60" cy="60" r="50" />
                </svg>
                <b>45+</b>
              </div>
              <div className="stx-login-actions">
                <Link className="stx-btn gold" to="/login?next=/startup">
                  {L ? "লগইন করে পিচ করো" : "Log in to Pitch"}
                </Link>
                <Link className="stx-btn ghost" to="/register?next=/startup">
                  {L ? "ফ্রি অ্যাকাউন্ট তৈরি করো" : "Create free account"}
                </Link>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* 4. Minimal Funded Founders Showcase */}
      {funded.length > 0 && (
        <section className="stx-sec stx-funded" id="funded" style={{ maxWidth: 1100, margin: "3rem auto 0", padding: "0 1.5rem" }}>
          <h2 className={`stx-h2 ${L ? "bn" : ""}`} style={{ fontSize: "1.5rem" }}>
            {L ? <>ফান্ডেড <em>ফাউন্ডার</em></> : <>Funded <em>Founders.</em></>}
          </h2>
          <div className="stx-lanterns">
            {funded.map((f, i) => (
              <div key={f.name} className="stx-lantern" style={{ "--i": i }}>
                <span className="lan" />
                <b>{f.name}</b>
                <small>{f.founder} · {f.sector}</small>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
