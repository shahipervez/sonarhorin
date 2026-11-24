import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import QRCode from "qrcode";
import { api } from "../api";
import { useAuth } from "../auth";
import { STORY_SETS } from "../components/StoryRail";
import { useLang } from "../i18n";
import { ApplyModal, CompanyLogo, daysLeft, getCH, money } from "./Jobs";
import "../styles/internships-guide.css";
import "../styles/intern-planets.css";
import InternSystem from "../components/InternSystem";
import "../styles/intern-system.css";

/**
 * INTERNSHIPS — its own layout (not the job list).
 * Theme: an airport. Categories are a live DEPARTURES board, every internship is a BOARDING PASS,
 * and the bottom of the page is the pre-flight checklist. Matches the paper-plane sky of the internship hero.
 */
const BN = "০১২৩৪৫৬৭৮৯";
const n2 = (n, L) => (L ? String(n).replace(/\d/g, (d) => BN[d]) : String(n));

const MATCH = {
  paid: (j) => (j.salary_min || 0) > 0 || /paid|stipend|allowance/i.test(`${j.title} ${j.description || ""}`),
  unpaid: (j) => !(j.salary_min > 0) || /unpaid|learning|volunteer|certificate/i.test(`${j.title} ${j.description || ""}`),
  versity: (j) => /credit|versity|university|academic|final.?year|thesis|practicum/i.test(`${j.title} ${j.description || ""}`),
  corporate: (j) => j.company?.is_partner || /corporate|mnc|plc|limited|ltd|group|bank|telecom/i.test(`${j.company?.name || ""} ${j.title}`),
  remote: (j) => !!j.remote || /remote|work from home|wfh/i.test(`${j.title} ${j.location || ""}`),
};
const code3 = (name = "") => (name.replace(/[^A-Za-z]/g, "").slice(0, 3) || "SHR").toUpperCase();

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
  const topFor = (id, n = 3) => (all || []).filter(MATCH[id]).sort((a, b) => (daysLeft(a.deadline) ?? 999) - (daysLeft(b.deadline) ?? 999)).slice(0, n);
  const apply = (j) => (user ? setOpen(j) : nav(`/login?next=/internships?apply=${j.id}`));

  useEffect(() => {
    const applyId = sp.get("apply");
    if (applyId && all && all.length > 0) {
      const target = all.find((x) => String(x.id) === String(applyId));
      if (target) {
        setOpen(target);
      }
    }
  }, [sp, all]);

  return (
    <div className={`ip-page ${L ? "bn" : ""}`}>
      {/* ============ HERO: pick what you need → see what it means → see the matches ============ */}
      <section className="ip-hero ig-hero">
        <svg className="ip-path" viewBox="0 0 1200 400" preserveAspectRatio="none" aria-hidden="true">
          <path id="ipFly" d="M-40 330 C 220 120, 460 380, 700 170 S 1100 60, 1260 120" />
          <g className="ip-plane"><path d="M0 0 L22 8 L0 16 L5 8 Z" /></g>
        </svg>
        <div className="ip-clouds" aria-hidden="true"><i /><i /><i /><i /></div>

        <div className="ip-wrap ig-in">
          <div className="ig-top" style={{ justifyContent: "center", textAlign: "center", marginBottom: "0.5rem" }}>
            <h1 className={`ip-title ${L ? "bn" : ""}`} style={{ textAlign: "center", margin: "0 auto" }}>
              {L ? "ইন্টার্নশিপ" : "Internships"}
            </h1>
          </div>

          <InternSystem
            cats={cats}
            sel={cat}
            counts={counts}
            L={L}
            n2={n2}
            top={(id) => topFor(id, 4)}
            daysLeft={daysLeft}
            onSelect={(id) => { setCat(id); setSp(id ? { cat: id } : {}, { replace: true }); }}
            onSeeAll={() => document.querySelector(".ip-board-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            onOpenJob={(j) => document.getElementById(`pass-${j.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
          />
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
              {cat && <button type="button" className="ip-clear" onClick={() => pick(cat)}>✕ {L ? "সব ক্যাটাগরি দেখো" : "show all categories"}</button>}
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

        <div className="ip-cat-pills" role="tablist" aria-label={L ? "ক্যাটাগরি ফিল্টার" : "Filter categories"}>
          <button
            type="button"
            className={`ip-cat-pill ${!cat ? "on" : ""}`}
            onClick={() => { setCat(""); setSp({}, { replace: true }); }}
          >
            ✦ {L ? "সব ক্যাটাগরি" : "All Categories"} ({n2((all || []).length, L)})
          </button>
          {cats.map((c) => {
            const on = cat === c.id;
            return (
              <button
                key={c.id}
                type="button"
                className={`ip-cat-pill ${on ? "on" : ""}`}
                style={{ "--c": c.c }}
                onClick={() => pick(c.id)}
              >
                {c.icon} {c.name[L]} ({n2(counts[c.id] || 0, L)})
              </button>
            );
          })}
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
            <b>{L ? "এই গ্রহে এখন কোনো ইন্টার্নশিপ নেই" : "No internships on this planet right now"}</b>
            <p>{L ? "অন্য গ্রহ দেখো, বা গ্র্যাজুয়েট প্রোগ্রাম ও ট্রেনিং দেখো।" : "Try another planet, or check graduate programs & trainings."}</p>
            <div className="ip-hero-ctas">
              {cat && <button type="button" className="ip-btn gold" onClick={() => pick(cat)}>{L ? "সব গ্রহ দেখো" : "Show all planets"}</button>}
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

function PassQR({ url, onClick, L }) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(url, {
      width: 180,
      margin: 1,
      color: {
        dark: "#0B1026",
        light: "#FFFFFF",
      },
    }).then((uri) => {
      if (alive) setDataUrl(uri);
    }).catch(() => {});
    return () => { alive = false; };
  }, [url]);

  return (
    <div
      className="ip-qr-wrap"
      onClick={onClick}
      title={L ? "ক্লিক অথবা স্ক্যান করে আবেদন করো" : "Click or scan with phone to apply"}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      {dataUrl ? (
        <img src={dataUrl} alt="Apply QR Code" className="ip-qr-img" />
      ) : (
        <div className="ip-qr-skel" />
      )}
      <span className="ip-qr-label">{L ? "স্ক্যান কোড 📲" : "Scan QR 📲"}</span>
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

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
  const applyUrl = `${origin}/internships?apply=${j.id}`;

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
        </header>

        {/* Highlighted Job / Internship Title Spot (Replaces YOU ... LAF) */}
        <div className="ip-role-spot">
          <div className="ip-role-kicker">
            <span className="ip-role-tag">
              <i>{c.icon}</i> {c.name[L]}
            </span>
            <span className="ip-role-loc">
              {j.remote ? "🌐 " : "📍 "}{mode}
            </span>
          </div>
          <h3 className="ip-role-title">{j.title}</h3>
        </div>

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
        <div className="ip-stub-top">
          <small>{L ? "সিট" : "SEAT"}</small>
          <b>0-YR</b>
        </div>
        <PassQR url={applyUrl} onClick={board} L={L} />
        {st ? (
          <span className="ip-applied">✓ {L ? "আবেদন হয়েছে" : "Applied"}</span>
        ) : (
          <button type="button" className="ip-apply" onClick={board}>{L ? "বোর্ড করো" : "Board"} ✈</button>
        )}
      </div>
    </article>
  );
}
