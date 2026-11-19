import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { STORY_SETS } from "../components/StoryRail";
import TrustBadge from "../components/TrustBadge";
import { useLang } from "../i18n";
import { ApplyModal, CompanyLogo, daysLeft, getCH, money } from "./Jobs";
import { BEAT_MS, GATE_STORIES, cartoonSrc } from "./internshipStories";
import InternSolar from "./InternSolar";

/**
 * INTERNSHIPS — its own layout (not the job list).
 * Theme: an airport. Categories are a live DEPARTURES board, every internship is a BOARDING PASS,
 * and the bottom of the page is the pre-flight checklist. Matches the paper-plane sky of the internship hero.
 */
const BN = "০১২৩৪৫৬৭৮৯";
const n2 = (n, L) => (L ? String(n).replace(/\d/g, (d) => BN[d]) : String(n));

export const MATCH = {
  paid: (j) => (j.salary_min || 0) > 0 || /paid|stipend|allowance/i.test(`${j.title} ${j.description || ""}`),
  unpaid: (j) => !(j.salary_min > 0) || /unpaid|learning|volunteer|certificate/i.test(`${j.title} ${j.description || ""}`),
  versity: (j) => /credit|versity|university|academic|final.?year|thesis|practicum/i.test(`${j.title} ${j.description || ""}`),
  corporate: (j) => j.company?.is_partner || /corporate|mnc|plc|limited|ltd|group|bank|telecom/i.test(`${j.company?.name || ""} ${j.title}`),
  remote: (j) => !!j.remote || /remote|work from home|wfh/i.test(`${j.title} ${j.location || ""}`),
};
const GATE = { paid: "P1", unpaid: "L2", versity: "V3", corporate: "C4", remote: "R5" };
const code3 = (name = "") => (name.replace(/[^A-Za-z]/g, "").slice(0, 3) || "SHR").toUpperCase();

/** Split-flap (Solari board) text: letters rattle through random glyphs before settling. */
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·";
function Flap({ text, className = "" }) {
  const [shown, setShown] = useState(text);
  useEffect(() => {
    const target = String(text);
    if (/[\u0980-\u09FF]/.test(target) || matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setShown(target); return; }
    let f = 0;
    const id = setInterval(() => {
      f++;
      setShown(target.split("").map((ch, i) => (ch === " " || f > 3 + i * 0.6 ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join(""));
      if (f > 4 + target.length * 0.6) clearInterval(id);
    }, 45);
    return () => clearInterval(id);
  }, [text]);
  // Bangla letters combine (কার/ফলা), so never split them into separate tiles
  if (/[\u0980-\u09FF]/.test(String(text))) return <span className={`ip-flap bn ${className}`}>{text}</span>;
  return <span className={`ip-flap ${className}`}>{shown.split("").map((c, i) => <i key={i}>{c}</i>)}</span>;
}

/** A Blender-rendered cartoon; falls back to its emoji if the image can't load. */
function Cartoon({ name, emoji, className }) {
  const [bad, setBad] = useState(false);
  useEffect(() => setBad(false), [name]);
  if (bad || !name) return <span className={`${className} emo`} role="img" aria-label={emoji}>{emoji}</span>;
  return <img className={className} src={cartoonSrc(name)} alt={emoji} draggable="false" decoding="async" onError={() => setBad(true)} />;
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  return now;
}

function useTick(ms) {
  const [n, setN] = useState(0);
  useEffect(() => { const id = setInterval(() => setN((x) => x + 1), ms); return () => clearInterval(id); }, [ms]);
  return n;
}

export default function Internships() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [lang] = useLang();
  const L = lang === "bn" ? 1 : 0;
  const CH = getCH(L);
  const cats = STORY_SETS.internship;

  const [all, setAll] = useState(null);
  const [cat, setCat] = useState(sp.get("cat") || "");
  const [q, setQ] = useState(sp.get("q") || "");
  const [open, setOpen] = useState(null);
  const [sort, setSort] = useState("soon");
  const [shown, setShown] = useState(12);
  useEffect(() => setShown(12), [cat, q, sort]);

  const load = () =>
    api("/api/jobs/?type=internship")
      .then((d) => setAll(d.jobs || []))
      .catch(() => setAll([]));
  useEffect(() => { load(); }, []);
  useEffect(() => { setCat(sp.get("cat") || ""); }, [sp]);

  const pick = (id) => {
    const next = cat === id ? "" : id;
    setCat(next);
    setSp(next ? { cat: next } : {}, { replace: true });
    setTimeout(() => document.querySelector(".ip-board-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const counts = useMemo(() => Object.fromEntries(cats.map((c) => [c.id, (all || []).filter(MATCH[c.id]).length])), [all, cats]);

  const list = useMemo(() => {
    let r = (all || []).filter((j) => (cat ? MATCH[cat]?.(j) : true));
    if (q.trim()) {
      const k = q.trim().toLowerCase();
      r = r.filter((j) => `${j.title} ${j.company?.name} ${j.location} ${(j.major_list || []).join(" ")}`.toLowerCase().includes(k));
    }
    if (sort === "soon") r = [...r].sort((a, b) => (daysLeft(a.deadline) ?? 999) - (daysLeft(b.deadline) ?? 999));
    if (sort === "pay") r = [...r].sort((a, b) => (b.salary_max || b.salary_min || 0) - (a.salary_max || a.salary_min || 0));
    return r;
  }, [all, cat, q, sort]);

  const activeCat = cats.find((c) => c.id === cat);
  const clock = useClock();
  const tick = useTick(3600);
  const STATUS = L ? ["বোর্ডিং", "গেট খোলা", "শেষ ডাক", "সময়মতো"] : ["BOARDING", "GATE OPEN", "FINAL CALL", "ON TIME"];
  const statusOf = (id, i) => (counts[id] ? STATUS[(tick + i) % STATUS.length] : L ? "শীঘ্রই" : "SOON");
  const topFor = (id) => (all || []).filter(MATCH[id]).sort((a, b) => (daysLeft(a.deadline) ?? 999) - (daysLeft(b.deadline) ?? 999)).slice(0, 3);
  const ticker = (all || []).slice(0, 14);
  const apply = (j) => (user ? setOpen(j) : nav(`/login?next=/internships`));

  // ---- gate stories: auto-play 3 beats per gate, then move to the next gate ----
  const [gate, setGate] = useState(sp.get("cat") || "paid");
  const [beat, setBeat] = useState(0);
  const [paused, setPaused] = useState(false);
  const [beatKey, setBeatKey] = useState(0);
  useEffect(() => {
    if (paused) return;
    const id = setTimeout(() => {
      if (beat < 2) setBeat(beat + 1);
      else { const k = cats.findIndex((c) => c.id === gate); setGate(cats[(k + 1) % cats.length].id); setBeat(0); }
      setBeatKey((n) => n + 1);
    }, BEAT_MS);
    return () => clearTimeout(id);
  }, [beat, gate, paused, beatKey, cats]);
  const playGate = (id, b = 0) => { setGate(id); setBeat(b); setBeatKey((n) => n + 1); };
  const gateCat = cats.find((c) => c.id === gate) || cats[0];
  const story = GATE_STORIES[gate];
  const gi = cats.findIndex((c) => c.id === gate);
  // warm the cache for the next beat's cartoons so they never pop in late
  useEffect(() => {
    const next = beat < 2 ? GATE_STORIES[gate].beats[beat + 1] : GATE_STORIES[cats[(gi + 1) % cats.length].id].beats[0];
    next.art.forEach((n) => { const im = new Image(); im.src = cartoonSrc(n); });
  }, [gate, beat]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`ip-page ${L ? "bn" : ""}`}>
      {/* ============ HERO + DEPARTURES BOARD ============ */}
      <section className="ip-hero">
        <svg className="ip-path" viewBox="0 0 1200 400" preserveAspectRatio="none" aria-hidden="true">
          <path id="ipFly" d="M-40 330 C 220 120, 460 380, 700 170 S 1100 60, 1260 120" />
          <g className="ip-plane"><path d="M0 0 L22 8 L0 16 L5 8 Z" /></g>
        </svg>
        <div className="ip-clouds" aria-hidden="true"><i /><i /><i /><i /></div>

        <div className="ip-wrap ip-hero-in">
          <div className="ip-hero-head">
            <p className="ip-kicker">✈ {L ? "ইন্টার্নশিপ টার্মিনাল" : "INTERNSHIP TERMINAL"}</p>
            <h1 className={`ip-title sm ${L ? "bn" : ""}`}>
              {L ? <>প্রতিটা ইন্টার্নশিপের পেছনে <em>একটা গল্প।</em></> : <>Every internship has <em>a story.</em></>}
            </h1>
            <p className={`ip-lede ${L ? "bn" : ""}`}>
              {L ? "কোন ধরনের ইন্টার্নশিপ তোমার জন্য? প্রতিটার ছোট্ট গল্প দেখো, তারপর বেছে নাও।" : "Not sure which type fits you? Watch a short story for each one, then pick."}
            </p>
          </div>

          {/* STORY PLAYER — explains the selected gate in 3 beats */}
          <div
            className="ip-story"
            style={{ "--c": gateCat.c }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="ip-story-bars">
              {[0, 1, 2].map((k) => (
                <button key={k} type="button" aria-label={`Beat ${k + 1}`} onClick={() => playGate(gate, k)}
                  className={k < beat ? "done" : k === beat ? "cur" : ""}>
                  <i key={beatKey} style={{ animationDuration: `${BEAT_MS}ms`, animationPlayState: paused ? "paused" : "running" }} />
                </button>
              ))}
            </div>
            <div className="ip-story-top">
              <span className="ip-gate-badge"><Flap text={GATE[gate]} /></span>
              <b className={L ? "bn" : ""}>{gateCat.name[L]} {L ? "ইন্টার্নশিপ" : "internship"}</b>
              <small className={L ? "bn" : ""}>{L ? `দৃশ্য ${["১", "২", "৩"][beat]}/৩` : `Scene ${beat + 1} of 3`} · {story.who[L]}</small>
            </div>

            <div className={`ip-stage b${beat}`} key={gate + beat} aria-hidden="true">
              <span className="ip-glow" />
              <span className="ip-floor" />
              {story.beats[beat].art.map((name, k) => (
                <Cartoon key={k} name={name} emoji={story.beats[beat].actors[k]}
                  className={`ip-actor a${k} ${name === "plane" ? "plane" : name === "mentor" ? "buddy" : ""} ${k === 1 ? "lead" : ""}`} />
              ))}
            </div>

            <p className={`ip-story-line ${L ? "bn" : ""}`} key={"t" + gate + beat}>{story.beats[beat].t[L]}</p>

            <div className="ip-story-foot">
              <p className={`ip-meaning ${L ? "bn" : ""}`}><span aria-hidden="true">💡</span>{story.meaning[L]}</p>
              <button type="button" className="ip-btn gold sm" onClick={() => pick(gate)}>
                {L ? `${n2(counts[gate] || 0, L)}টি ${gateCat.name[L]} ইন্টার্নশিপ দেখো` : `See ${counts[gate] || 0} ${gateCat.name[0]} internship${counts[gate] === 1 ? "" : "s"}`} →
              </button>
            </div>
            <button type="button" className="ip-story-nav l" onClick={() => (beat > 0 ? playGate(gate, beat - 1) : playGate(cats[(gi + cats.length - 1) % cats.length].id))} aria-label={L ? "আগের দৃশ্য" : "Previous scene"}>‹</button>
            <button type="button" className="ip-story-nav r" onClick={() => (beat < 2 ? playGate(gate, beat + 1) : playGate(cats[(gi + 1) % cats.length].id))} aria-label={L ? "পরের দৃশ্য" : "Next scene"}>›</button>
          </div>

          <div className="ip-board ip-cosmos">
            <div className="ip-board-top">
              <div>
                <b className={L ? "bn" : ""}>{L ? "৫ ধরনের ইন্টার্নশিপ" : "5 types of internship"}</b>
                <p className={L ? "bn" : ""}>{L ? "যেকোনো গ্রহে চাপ দাও — তার গল্প চলবে" : "Tap a planet to play its story"}</p>
              </div>
              <span><i />{L ? "লাইভ" : "Live"} · {n2((all || []).length, L)} {L ? "টি খোলা" : "open"}
                <time className="ip-clock">{clock.toLocaleTimeString("en-GB", { timeZone: "Asia/Dhaka", hour: "2-digit", minute: "2-digit" })} <small>{L ? "ঢাকা" : "Dhaka"}</small></time>
              </span>
            </div>

            <InternSolar
              cats={cats}
              gate={gate}
              counts={counts}
              onPick={(id) => playGate(id)}
              L={L}
              gateCodes={GATE}
              progressMs={BEAT_MS * (3 - beat)}
              progressFrom={beat / 3}
              paused={paused}
              progKey={beatKey}
            />

            {/* the planet you're on: its brightest internships right now */}
            <div className="ip-orbiting" style={{ "--c": gateCat.c }} key={gate}>
              <div className="ip-orbiting-head">
                <span className="ip-gate-badge sm">{GATE[gate]}</span>
                <b className={L ? "bn" : ""}>{L ? `${gateCat.name[L]} — শীঘ্রই শেষ হচ্ছে` : `${gateCat.name[0]} — closing soonest`}</b>
                <em className={`ip-status s${tick % 4}`}><i />{statusOf(gate, 0)}</em>
              </div>
              {topFor(gate).map((j, k) => (
                <a key={j.id} href="#passes" className="ip-peek-row" style={{ animationDelay: `${k * 0.07}s` }}
                  onClick={(e) => { e.preventDefault(); pick(gate); setTimeout(() => document.getElementById(`pass-${j.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 300); }}>
                  <span>✈</span><b>{j.title}</b><small>{j.company?.name}</small>
                  <em>{daysLeft(j.deadline) != null ? `${n2(daysLeft(j.deadline), L)}${L ? " দিন" : "d"}` : ""}</em>
                </a>
              ))}
              {!topFor(gate).length && <p className="ip-peek-empty">{L ? "এই ধরনের ইন্টার্নশিপ এখন খোলা নেই — শীঘ্রই আসছে" : "None open in this type right now — new ones are coming soon"}</p>}
            </div>

            {ticker.length > 0 && (
              <div className="ip-ticker" aria-hidden="true">
                <div>
                  {[...ticker, ...ticker].map((j, k) => (
                    <span key={k}>✈ <b>{j.company?.name}</b> — {j.title} <i>{L ? "এখন বোর্ডিং" : "now boarding"}</i></span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============ BOARDING PASSES ============ */}
      <section className="ip-wrap ip-passes" id="passes">
        <span className="ip-board-anchor" />
        <div className="ip-bar">
          <div>
            <h2 className={`ip-h2 ${L ? "bn" : ""}`}>
              {activeCat ? <>{activeCat.icon} {activeCat.name[L]} <em>{L ? "ইন্টার্নশিপ" : "internships"}</em></> : <>{L ? "সব" : "All"} <em>{L ? "বোর্ডিং পাস" : "boarding passes"}</em></>}
            </h2>
            <p className="ip-count">
              {all ? (L ? `${n2(list.length, L)}টি পাস পাওয়া গেছে` : `${list.length} pass${list.length === 1 ? "" : "es"} found`) : L ? "লোড হচ্ছে…" : "Loading…"}
              {cat && <button type="button" className="ip-clear" onClick={() => pick(cat)}>✕ {L ? "ফিল্টার মুছো" : "clear gate"}</button>}
            </p>
          </div>
          <div className="ip-tools">
            <label className="ip-search">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={L ? "রোল, কোম্পানি, স্কিল…" : "Role, company, skill…"} />
            </label>
            <div className="ip-seg">
              <button type="button" className={sort === "soon" ? "on" : ""} onClick={() => setSort("soon")}>{L ? "শেষ হচ্ছে" : "Closing soon"}</button>
              <button type="button" className={sort === "pay" ? "on" : ""} onClick={() => setSort("pay")}>{L ? "বেশি স্টাইপেন্ড" : "Top stipend"}</button>
            </div>
          </div>
        </div>

        <div className="ip-grid">
          {all === null && Array.from({ length: 4 }, (_, i) => <div key={i} className="ip-pass skel" />)}
          {list.slice(0, shown).map((j, i) => (
            <Pass key={j.id} j={j} i={i} L={L} CH={CH} c={activeCat || cats.find((c) => MATCH[c.id](j)) || cats[0]} onApply={() => apply(j)} />
          ))}
        </div>

        {list.length > shown && (
          <div className="ip-more">
            <button type="button" className="ip-btn ghost dark" onClick={() => setShown((n) => n + 12)}>
              {L ? `আরও পাস দেখো (${n2(list.length - shown, L)})` : `Show more passes (${list.length - shown})`} ↓
            </button>
          </div>
        )}

        {all && list.length === 0 && (
          <div className="ip-empty">
            <span>🛫</span>
            <b>{L ? "এই গেট থেকে এখন কোনো ফ্লাইট নেই" : "No flights boarding from this gate right now"}</b>
            <p>{L ? "অন্য গেট দেখো, বা গ্র্যাজুয়েট প্রোগ্রাম ও ট্রেনিং দেখো।" : "Try another gate, or check graduate programs & trainings."}</p>
            <div className="ip-hero-ctas">
              {cat && <button type="button" className="ip-btn gold" onClick={() => pick(cat)}>{L ? "সব গেট দেখো" : "Show all gates"}</button>}
              <Link to="/programs" className="ip-btn ghost dark">{L ? "প্রোগ্রাম দেখো →" : "Browse programs →"}</Link>
            </div>
          </div>
        )}
      </section>

      {/* ============ PRE-FLIGHT CHECKLIST ============ */}
      <section className="ip-wrap ip-pre">
        <h2 className={`ip-h2 ${L ? "bn" : ""}`}>{L ? <>উড়াল দেওয়ার আগে <em>চেকলিস্ট</em></> : <>Pre-flight <em>checklist</em></>}</h2>
        <ol className="ip-steps">
          {[
            ["🧳", L ? "সিভি প্যাক করো" : "Pack your CV", L ? "এক পাতার সিভি, ৮০+ স্কোর।" : "One page, score 80+.", "/cv"],
            ["🛠️", L ? "১টা প্রজেক্ট রেডি রাখো" : "Carry one real project", L ? "গিটহাব বা পোর্টফোলিওতে।" : "On GitHub or your portfolio.", "/portfolio"],
            ["🎙️", L ? "ইন্টারভিউ রিহার্সাল" : "Rehearse the interview", L ? "১০ মিনিটের এআই মক।" : "A 10-minute AI mock.", "/interview"],
            ["🎫", L ? "পাস নাও, আবেদন করো" : "Grab a pass & apply", L ? "১-ট্যাপে আবেদন।" : "Apply in one tap.", "#passes"],
          ].map(([ic, t, d, to], i) => (
            <li key={t} style={{ "--i": i }}>
              <span className="ip-step-ic">{ic}</span>
              <b>{t}</b>
              <small>{d}</small>
              {to.startsWith("#") ? <a href={to}>{L ? "চলো" : "Go"} →</a> : <Link to={to}>{L ? "চলো" : "Go"} →</Link>}
            </li>
          ))}
        </ol>
      </section>

      {open && <ApplyModal j={open} L={L} CH={CH} onClose={() => setOpen(null)} onApplied={() => { setOpen(null); load(); }} />}
    </div>
  );
}

function Pass({ j, i, L, c, onApply }) {
  const ref = useRef(null);
  const [tear, setTear] = useState(false);
  const dl = daysLeft(j.deadline);
  const st = j.my_status;
  const stipend = j.salary_min ? money(j.salary_min, j.salary_max, L) : L ? "লার্নিং + সার্টিফিকেট" : "Learning + Certificate";
  const mode = j.remote ? (L ? "রিমোট" : "Remote") : j.location || (L ? "অন-সাইট" : "On-site");
  const urgent = dl != null && dl <= 3;
  const chip = urgent ? (L ? "শেষ ডাক" : "FINAL CALL") : dl != null && dl <= 7 ? (L ? "বোর্ডিং" : "BOARDING") : (L ? "গেট খোলা" : "GATE OPEN");

  // 3D tilt + holographic glare following the pointer
  const move = (e) => {
    const el = ref.current; if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - y) * 7}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 9}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  };
  const leave = () => { const el = ref.current; if (!el) return; el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); };
  const board = () => { setTear(true); setTimeout(() => { onApply(); setTear(false); }, 650); };

  return (
    <article
      id={`pass-${j.id}`}
      ref={ref}
      onPointerMove={move}
      onPointerLeave={leave}
      className={`ip-pass ${tear ? "tear" : ""} ${urgent ? "urgent" : ""}`}
      style={{ "--c": c.c, "--cc": j.company?.color || c.c, "--i": i % 8 }}
    >
      <span className="ip-holo" aria-hidden="true" />
      <div className="ip-main">
        <header>
          <CompanyLogo company={j.company} className="ip-logo" />
          <div>
            <small>{L ? "ইন্টার্নশিপ বোর্ডিং পাস" : "INTERNSHIP BOARDING PASS"}</small>
            <b>{j.company?.name}{j.company?.is_partner && <span className="ip-partner">✓</span>}</b>
          </div>
          <span className={`ip-chip ${urgent ? "red" : ""}`}><i />{chip}</span>
          <TrustBadge job={j} L={L} compact />
        </header>
        <div className="ip-route">
          <div><b>YOU</b><small>{L ? "ফ্রেশার" : "Fresher"}</small></div>
          <span className="ip-fly"><i /><em>✈</em><i /></span>
          <div className="r"><b>{code3(j.company?.name)}</b><small>{mode}</small></div>
        </div>
        <h3>{j.title}</h3>
        <dl>
          <div><dt>{L ? "স্টাইপেন্ড" : "STIPEND"}</dt><dd>{stipend}</dd></div>
          <div><dt>{L ? "ধরন" : "MODE"}</dt><dd>{j.remote ? "🌐 " : "📍 "}{mode}</dd></div>
          <div><dt>{L ? "বোর্ডিং শেষ" : "BOARDS BY"}</dt><dd className={dl != null && dl <= 5 ? "urgent" : ""}>{dl != null ? (L ? `${n2(dl, L)} দিন` : `${dl} day${dl === 1 ? "" : "s"}`) : L ? "খোলা" : "Open"}</dd></div>
        </dl>
        <div className="ip-tags">
          <span className="ip-cat"><i>{c.icon}</i>{c.name[L]}</span>
          {(j.major_list || []).slice(0, 2).map((m) => <span key={m}>{m}</span>)}
        </div>
      </div>
      <div className="ip-stub">
        <small>{L ? "সিট" : "SEAT"}</small>
        <b>0-YR</b>
        <span className="ip-barcode" aria-hidden="true"><i /></span>
        {st ? (
          <span className="ip-applied">✓ {L ? "আবেদন হয়েছে" : "Applied"}</span>
        ) : (
          <button type="button" className="ip-apply" onClick={board}>{L ? "বোর্ড করো" : "Board"} ✈</button>
        )}
      </div>
    </article>
  );
}
