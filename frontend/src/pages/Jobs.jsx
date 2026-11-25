import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import CategoryBoxes, { SUB_CATEGORIES } from "../components/CategoryBoxes";
import StoryRail from "../components/StoryRail";
import { MAJORS } from "../config";
import { useLang, useT } from "../i18n";
import { confetti, fmt, toast } from "../utils";

export const CATEGORIES = [
  { id: "", major: "", en: "All Categories", bn: "সকল ক্যাটাগরি" },
  { id: "it", major: "Computer Science & Engineering", en: "IT & Software", bn: "আইটি ও সফটওয়্যার" },
  { id: "business", major: "Business Administration (BBA)", en: "Business & Growth", bn: "বিজনেস ও মার্কেটিং" },
  { id: "agriculture", major: "Agriculture & Agribusiness", en: "Agriculture & Biotech", bn: "কৃষি ও এগ্রি-টেক" },
  { id: "textile", major: "Textile & Apparel", en: "Textile & Apparel", bn: "টেক্সটাইল ও গার্মেন্টস" },
  { id: "engineering", major: "Electrical / Mechanical", en: "Engineering & Tech", bn: "ইঞ্জিনিয়ারিং ও টেক" },
  // skill & service jobs: no degree major — matched by keywords instead
  { id: "driver", major: "", kw: "driver", en: "Driver", bn: "ড্রাইভার" },
  { id: "chef", major: "", kw: "chef cook kitchen", en: "Chef & Kitchen", bn: "শেফ ও কিচেন" },
  { id: "delivery", major: "", kw: "delivery rider courier", en: "Delivery", bn: "ডেলিভারি" },
  { id: "fitness", major: "", kw: "gym trainer fitness", en: "Gym Trainer", bn: "জিম ট্রেইনার" },
  { id: "legal", major: "", kw: "legal law lawyer", en: "Law & Legal", bn: "আইন ও লিগ্যাল" },
  { id: "education", major: "", kw: "teacher tutor trainer instructor", en: "Education & Training", bn: "শিক্ষা ও ট্রেনিং" },
  { id: "ngo", major: "", kw: "ngo development program project", en: "NGO / Development", bn: "এনজিও / ডেভেলপমেন্ট" },
  { id: "technician", major: "", kw: "mechanic technician", en: "Mechanic / Technician", bn: "মেকানিক / টেকনিশিয়ান" },
];

export const getCH = (L) => ({
  partner: {
    ic: "⚡",
    t: L ? "১-ক্লিক" : "1-click",
    d: L
      ? "সরাসরি নিয়োগকর্তার সোনারহরিণ ইনবক্সে পৌঁছাবে।"
      : "Lands in the employer's Sonarhorin inbox instantly.",
    cls: "c-partner",
  },
  email: {
    ic: "✉️",
    t: L ? "ইমেইল আবেদন" : "Email apply",
    d: L
      ? "আমরা তোমার সিভি ও কভার লেটার এইচআরের ইমেইলে পাঠিয়ে দেব।"
      : "We email HR your CV + a tailored cover letter. Replies come to you.",
    cls: "c-email",
  },
  portal: {
    ic: "🔗",
    t: L ? "কোম্পানি পোর্টাল" : "Company portal",
    d: L
      ? "কোম্পানির নিজস্ব ক্যারিয়ার সাইট। আমরা প্রস্তুত করে দেব—তুমি ১ মিনিটে সাবমিট করবে।"
      : "Their own career site. We prepare everything — you finish in ~1 minute.",
    cls: "c-portal",
  },
});
export const CH = getCH(0);

const getTypes = (L) => [
  ["", L ? "সকল ধরন" : "Any type"],
  ["full_time", L ? "ফুল-টাইম" : "Full-time"],
  ["trainee", L ? "ম্যানেজমেন্ট ট্রেইনি / MTO" : "Trainee / MTO"],
  ["internship", L ? "ইন্টার্নশিপ" : "Internship"],
  ["part_time", L ? "পার্ট-টাইম" : "Part-time"],
];

export const daysLeft = (d) =>
  d ? Math.ceil((new Date(d) - new Date(new Date().toDateString())) / 86400000) : null;

export const money = (a, b, L) =>
  a
    ? `৳${Math.round(a / 1000)}k${b ? `–${Math.round(b / 1000)}k` : "+"}`
    : L
    ? "বেতন আলোচনা সাপেক্ষে"
    : "Salary negotiable";

/** Internships have their own page/layout now — /jobs?type=internship forwards there. */
export default function Jobs() {
  const [sp] = useSearchParams();
  if (sp.get("type") === "internship") {
    const cat = sp.get("cat");
    return <Navigate to={`/internships${cat ? `?cat=${encodeURIComponent(cat)}` : ""}`} replace />;
  }
  return <JobsBoard />;
}

function JobsBoard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [lang] = useLang();
  const L = lang === "bn" ? 1 : 0;
  const t = useT();

  const CH = getCH(L);
  const TYPES = getTypes(L);

  const initialType = sp.get("type") || "";
  const [f, setF] = useState({
    q: sp.get("q") || "",
    major: sp.get("major") || (sp.get("q") ? "" : user?.major || ""),
    channel: "",
    type: initialType,
    kw: "",
  });

  const [trackMode, setTrackMode] = useState(initialType === "internship" ? "internship" : "job");
  const [activeJobCat, setActiveJobCat] = useState(initialType === "internship" ? null : sp.get("cat"));
  const [activeInternCat, setActiveInternCat] = useState(initialType === "internship" ? sp.get("cat") : null);
  const [activeSubCat, setActiveSubCat] = useState("any");
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const q = sp.get("q");
    if (q != null) setF((o) => ({ ...o, q, major: "" }));
    const m = sp.get("major");
    if (m) setF((o) => ({ ...o, major: m, q: "" }));
    const t = sp.get("type");
    if (t === "internship") {
      setTrackMode("internship");
      setF((o) => ({ ...o, type: "internship" }));
    }
  }, [sp]);

  const [data, setData] = useState(null);
  const [open, setOpen] = useState(null);
  const [matches, setMatches] = useState(null);
  const [bulk, setBulk] = useState(false);
  const [scraping, setScraping] = useState(false);

  const load = useCallback(() => {
    const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
    api(`/api/jobs/${qs ? `?${qs}` : ""}`)
      .then(setData)
      .catch(() => setData({ jobs: [], by_channel: {} }));
    if (user) api("/api/jobs/matches/").then(setMatches).catch(() => {});
  }, [f, user]);

  const triggerScraperSync = async () => {
    setScraping(true);
    try {
      const res = await api("/api/jobs/scraper/run/", {
        method: "POST",
        body: {
          queries: trackMode === "internship"
            ? ["Internship Bangladesh", "Trainee Bangladesh"]
            : ["Fresher Bangladesh", "Junior Software Engineer Bangladesh", "Trainee Bangladesh"],
          limit: 6,
        },
      });
      load();
      confetti();
      toast(
        L
          ? `সফলভাবে আপডেট হয়েছে! ${res?.created ?? 0}টি নতুন ও ${res?.updated ?? 0}টি পদ স্ক্র্যাপ ও যুক্ত হয়েছে।`
          : `Sync complete! Added ${res?.created ?? 0} new jobs & updated ${res?.updated ?? 0} from BD career sites.`
      );
    } catch (err) {
      toast(L ? "স্ক্র্যাপ প্রক্রিয়া ব্যাকগ্রাউন্ডে চলছে।" : "Sync is processing in background.");
      load();
    } finally {
      setScraping(false);
    }
  };

  useEffect(() => {
    const id = setTimeout(load, 200);
    return () => clearTimeout(id);
  }, [load]);

  const onApplied = () => {
    load();
  };
  const eligible = matches?.auto_eligible?.length || 0;

  // Handle Job Category Selection
  const handleSelectJobCat = (cat) => {
    if (!cat) {
      setActiveJobCat(null);
      setActiveSubCat("any");
      setF((o) => ({ ...o, major: "", q: "", kw: "" }));
      return;
    }
    setActiveJobCat(cat.id);
    setActiveSubCat("any");
    setF((o) => ({
      ...o,
      major: cat.major || "",
      q: "",
      kw: cat.kw || "",
    }));
  };

  // Handle Internship Category Selection
  const handleSelectInternCat = (cat) => {
    if (!cat) {
      setActiveInternCat(null);
      setActiveSubCat("any");
      setF((o) => ({ ...o, q: "", type: "internship" }));
      return;
    }
    setActiveInternCat(cat.id);
    setActiveSubCat("any");
    setF((o) => ({
      ...o,
      type: "internship",
      q: cat.query,
    }));
  };

  // Handle Sub-category Selection (e.g. Frontend, Backend, or Any type)
  const handleSelectSubCat = (sub) => {
    setActiveSubCat(sub.id);
    if (sub.kw) {
      setF((o) => ({ ...o, q: "", kw: sub.kw }));
    } else if (sub.id === "any") {
      setF((o) => ({ ...o, q: "" }));
    } else {
      setF((o) => ({ ...o, q: sub.query || sub.name?.[0] || sub.id }));
    }
  };

  // Switch between Jobs and Internship Mode
  const switchMode = (mode) => {
    if (mode === "internship") { nav("/internships"); return; }
    setTrackMode(mode);
    if (mode === "internship") {
      setF((o) => ({ ...o, type: "internship", major: "" }));
      setActiveJobCat(null);
    } else {
      setF((o) => ({ ...o, type: "", q: "" }));
      setActiveInternCat(null);
    }
  };

  return (
    <div className="page jobs-page">
      <div className="wrap">
        {/* Category Boxes — small compact cards + sub-categories */}
        <CategoryBoxes
          kind={trackMode}
          active={trackMode === "job" ? activeJobCat : activeInternCat}
          activeSubCat={activeSubCat}
          onSelectSubCat={handleSelectSubCat}
          onSwitch={switchMode}
          onSelect={(s) => {
            if (!s) {
              if (trackMode === "job") handleSelectJobCat(null);
              else handleSelectInternCat(null);
              return;
            }
            const cat = { ...s, major: s.major };
            if (trackMode === "job") {
              if (activeJobCat === s.id) handleSelectJobCat(null);
              else handleSelectJobCat(cat);
            } else {
              if (activeInternCat === s.id) handleSelectInternCat(null);
              else handleSelectInternCat(cat);
            }
          }}
          title={
            <h1 className={`sr-title ${L ? "bn" : ""}`} style={{ color: "#0F172A", textShadow: "none" }}>
              {trackMode === "job" ? (L ? <>ফ্রেশার <em>জব</em></> : <>Fresher <em>Jobs.</em></>) : (L ? <><em>ইন্টার্নশিপ</em></> : <><em>Internships.</em></>)}
            </h1>
          }
        />

        {/* Compact Action Bar right after Category: Live Scraper Sync & Auto-Apply */}
        <div className="jobs-bottom-bar">
          <div className="jbb-left">
            <button
              type="button"
              className={`jbb-btn scraper-btn ${scraping ? "busy" : ""}`}
              onClick={triggerScraperSync}
              disabled={scraping}
              title={L ? "বিডি ক্যারিয়ার পোর্টাল থেকে লাইভ নতুন জব স্ক্র্যাপ করো" : "Sync latest jobs from Bangladesh portals"}
            >
              <span>{scraping ? "⏳" : "⚡"}</span>
              <span>
                {scraping
                  ? (L ? "স্ক্র্যাপ হচ্ছে…" : "Syncing live jobs…")
                  : (L ? "লাইভ জব স্ক্র্যাপার সিঙ্ক" : "Sync Live BD Jobs")}
              </span>
            </button>

            <button
              type="button"
              className="jbb-btn auto-btn"
              onClick={() => setShowAutoModal(true)}
              title={L ? "অটো-অ্যাপ্লাই সেটিংস ও রুলস" : "Auto-apply settings"}
            >
              <span>🤖</span>
              <span>{L ? "অটো-অ্যাপ্লাই" : "Auto-Apply"}</span>
              {eligible > 0 && <span className="jbb-badge">{eligible}</span>}
            </button>
          </div>

          <div className="jbb-right">
            <div className="jbb-channels">
              <span className="jbb-ch-label">{L ? "চ্যানেল:" : "Channel:"}</span>
              {Object.entries(CH).map(([k, c]) => (
                <button
                  key={k}
                  type="button"
                  className={`jbb-ch-pill ${f.channel === k ? "active" : ""}`}
                  onClick={() => setF({ ...f, channel: f.channel === k ? "" : k })}
                >
                  <span>{c.ic}</span>
                  <span>{c.t}</span>
                  <small>{data?.by_channel?.[k] ?? 0}</small>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search bar immediately below Toolbar */}
        <div className="job-filters" style={{ marginTop: 10 }}>
          <div style={{ flex: "1 1 260px", position: "relative" }}>
            <input
              className="inp"
              style={{ width: "100%", paddingRight: f.q ? 32 : 12 }}
              placeholder={L ? "পদবী, কোম্পানি, স্কিল দিয়ে সরাসরি সার্চ করো…" : "Search title, company, skill…"}
              value={f.q}
              onChange={(e) => {
                setF((o) => ({ ...o, q: e.target.value }));
                if (activeSubCat !== "any") setActiveSubCat("any");
              }}
            />
            {f.q && (
              <button
                type="button"
                onClick={() => {
                  setF((o) => ({ ...o, q: "" }));
                  setActiveSubCat("any");
                }}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#94A3B8",
                  fontSize: 13,
                  padding: 2,
                }}
                title={L ? "মুছে ফেলো" : "Clear search"}
              >
                ✕
              </button>
            )}
          </div>
          {/* Category Dropdown (Replaces All Majors) */}
          <select
            className="inp"
            value={activeJobCat || ""}
            onChange={(e) => {
              const catId = e.target.value;
              setActiveJobCat(catId || null);
              setActiveSubCat("any");
              const found = CATEGORIES.find((c) => c.id === catId);
              setF((o) => ({
                ...o,
                major: found ? found.major : "",
                q: "",
                kw: found?.kw || "",
              }));
            }}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {L ? cat.bn : cat.en}
              </option>
            ))}
          </select>

          {/* Dynamic Role / Sub-category Dropdown */}
          <select
            className="inp"
            value={activeSubCat || "any"}
            onChange={(e) => {
              const subId = e.target.value;
              setActiveSubCat(subId);
              const list = (activeJobCat && SUB_CATEGORIES[activeJobCat]) || [];
              const found = list.find((s) => s.id === subId);
              if (found?.kw) {
                setF((o) => ({ ...o, q: "", kw: found.kw }));
              } else if (!found || found.id === "any") {
                setF((o) => ({ ...o, q: "" }));
              } else {
                setF((o) => ({ ...o, q: found.query || found.name[0] }));
              }
            }}
          >
            {activeJobCat && SUB_CATEGORIES[activeJobCat] ? (
              SUB_CATEGORIES[activeJobCat].map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id === "any"
                    ? L
                      ? `সকল ${CATEGORIES.find((c) => c.id === activeJobCat)?.bn || "রোল"} (Any type)`
                      : `All ${CATEGORIES.find((c) => c.id === activeJobCat)?.en || "roles"} (Any type)`
                    : s.name[L]}
                </option>
              ))
            ) : (
              <>
                <option value="any">{L ? "সকল রোল ও পদবী (Any role)" : "All Roles & Positions (Any role)"}</option>
                <option value="swe">{L ? "Software Engineer (SWE)" : "Software Engineer (SWE)"}</option>
                <option value="web_dev">{L ? "Web Developer" : "Web Developer"}</option>
                <option value="data_eng">{L ? "Data Engineer" : "Data Engineer"}</option>
                <option value="ai_eng">{L ? "AI Engineer" : "AI Engineer"}</option>
                <option value="it_sol">{L ? "IT Solution & Network" : "IT Solution & Network"}</option>
                <option value="mto">{L ? "Management Trainee (MTO)" : "Management Trainee (MTO)"}</option>
                <option value="marketing">{L ? "Digital Marketing" : "Digital Marketing"}</option>
              </>
            )}
          </select>

          {/* Employment Type Dropdown (Full-time, Internship, Trainee) */}
          <select
            className="inp"
            value={f.type}
            onChange={(e) => setF({ ...f, type: e.target.value })}
          >
            {TYPES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          {user && eligible > 0 && (
            <button className="btn btn-lime sm" onClick={() => setBulk(true)}>
              ⚡ {L ? `একসাথে ${eligible}টি পদে আবেদন করো` : `Apply to all ${eligible} matches`}
            </button>
          )}
        </div>

        <p className="muted small">
          {data
            ? L
              ? `${data.count}টি সার্কুলার পাওয়া গেছে`
              : `${data.count} fresher ${trackMode === "internship" ? "internship" : "job"}${data.count === 1 ? "" : "s"}`
            : L
            ? "লোড হচ্ছে…"
            : "Loading…"}
          {user && (
            <>
              {" "}
              ·{" "}
              <Link className="link" to="/applications">
                {L ? "আমার আবেদনসমূহ →" : "My applications →"}
              </Link>
            </>
          )}
        </p>

        <div className="job-grid">
          {data?.jobs.map((j) => (
            <JobCard
              key={j.id}
              j={j}
              L={L}
              CH={CH}
              onOpen={() => (user ? setOpen(j) : nav(`/login?next=/jobs`))}
            />
          ))}
          {data && data.jobs.length === 0 && (
            <p className="muted">
              {L ? "এই ফিল্টারের সাথে কোনো সার্কুলার পাওয়া যায়নি।" : "No jobs match these filters yet."}
            </p>
          )}
        </div>
      </div>

      {/* Tutorial & Guidance Modal */}
      {showTutorial && (
        <div className="modal-bg" onClick={() => setShowTutorial(false)}>
          <div className="modal job-tutorial-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-x" onClick={() => setShowTutorial(false)}>✕</button>
            <span className="jch-kicker">
              {L ? "🎓 ফ্রেশার জব পাওয়ার সহজ মেথড" : "🎓 Fresher Job Success Secret"}
            </span>
            <h2 className="h3 bn" style={{ marginTop: 8 }}>
              {L ? "সোনারহরিণ ৩-স্টেপ ক্যারিয়ার সাকসেস গাইড" : "Sonarhorin 3-Step Career Success Guide"}
            </h2>
            <p className="muted">
              {L
                ? "অভিজ্ঞতা ছাড়াই প্রথম চাকরিতে নিশ্চিত ইন্টারভিউ কল পাওয়ার সিক্রেট গাইডলাইন:"
                : "Proven guidelines to get interview callbacks for 0-experience fresher roles:"}
            </p>

            <div className="jt-steps-list">
              <div className="jt-step-card">
                <span className="jt-badge">{L ? "ধাপ ১" : "Step 1"}</span>
                <div>
                  <b>{L ? "সিভি স্কোর ৮০+ নিয়ে আসো (CV Judge)" : "Get your CV score 80+ (CV Judge)"}</b>
                  <p>
                    {L
                      ? "আমাদের এআই সিভি জাজে সিভি আপলোড করো। এটি গ্রামার, কি-ওয়ার্ডস ও ফরম্যাট ঠিক করে এইচআর-ফ্রেন্ডলি করে তুলবে।"
                      : "Upload your CV to AI CV Judge. It optimizes keywords, grammar and formatting to ensure top HR response."}
                  </p>
                  <Link to="/cv" className="link small" onClick={() => setShowTutorial(false)}>
                    {L ? "সিভি স্কোর চেক করো →" : "Check CV score →"}
                  </Link>
                </div>
              </div>

              <div className="jt-step-card">
                <span className="jt-badge">{L ? "ধাপ ২" : "Step 2"}</span>
                <div>
                  <b>{L ? "সঠিক ক্যাটাগরি ও ফিল্টার বেছে নাও" : "Choose the right category & filters"}</b>
                  <p>
                    {L
                      ? "তোমার ফিল্ড অনুযায়ী (IT, Business, Agriculture, Textile, Engineering) ফিল্টার করো। শুধু ফ্রেশারদের জন্য উন্মুক্ত পদগুলো দেখো।"
                      : "Filter according to your field (IT, Business, Agriculture, Textile, Engineering). View only 0-experience fresher roles."}
                  </p>
                </div>
              </div>

              <div className="jt-step-card">
                <span className="jt-badge">{L ? "ধাপ ৩" : "Step 3"}</span>
                <div>
                  <b>{L ? "১-ক্লিকে সরাসরি আবেদন" : "Direct 1-Click Apply"}</b>
                  <p>
                    {L
                      ? "ম্যানুয়ালি শত শত ফর্ম পূরণের দিন শেষ। ১-ট্যাপে তোমার সিভি ও কাস্টম কভার লেটার সরাসরি কোম্পানির এইচআর ইনবক্সে পৌঁছে যাবে!"
                      : "No more repetitive manual forms. 1-tap instantly sends your CV and tailored cover letter to the HR inbox!"}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-lime wide"
              style={{ marginTop: 18 }}
              onClick={() => setShowTutorial(false)}
            >
              {L ? "বুঝেছি! সরাসরি জব ব্রাউজ শুরু করো →" : "Got it! Start Browsing Jobs →"}
            </button>
          </div>
        </div>
      )}

      {/* Auto-Apply Settings Modal (Triggered by compact bottom button) */}
      {showAutoModal && (
        <div className="modal-bg" onClick={() => setShowAutoModal(false)}>
          <div className="modal auto-apply-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-x" onClick={() => setShowAutoModal(false)}>✕</button>
            {user ? (
              <AutoApplyPanel matches={matches} onRun={load} L={L} CH={CH} />
            ) : (
              <div className="card auto-cta" style={{ border: "none", boxShadow: "none", margin: 0, padding: "8px 0" }}>
                <div>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: 18, color: "#0F172A" }}>
                    {L ? "🤖 ঘুমের মধ্যেও অটো-অ্যাপ্লাই" : "🤖 Auto-apply while you sleep"}
                  </h3>
                  <p className="muted small" style={{ margin: 0, lineHeight: 1.5 }}>
                    {L
                      ? "তোমার প্রোফাইল ও সিভির ভিত্তিতে প্রতিদিন স্বয়ংক্রিয়ভাবে নতুন ফ্রেশার সার্কুলারে আবেদন পাঠানো হবে।"
                      : "Automatically apply to matching fresher jobs & internships as soon as they are posted."}
                  </p>
                </div>
                <Link to="/register?next=/jobs" className="btn btn-ink sm" style={{ marginTop: 14 }}>
                  {L ? "ফ্রি অ্যাকাউন্ট তৈরি করো →" : "Create free account →"}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
      {open && (
        <ApplyModal
          j={open}
          L={L}
          CH={CH}
          onClose={() => setOpen(null)}
          onApplied={onApplied}
        />
      )}
      {bulk && (
        <BulkModal
          ids={matches.auto_eligible}
          jobs={matches.jobs}
          L={L}
          CH={CH}
          onClose={() => setBulk(false)}
          onDone={load}
        />
      )}
    </div>
  );
}

export function CompanyLogo({ company, className = "clogo2" }) {
  const [err, setErr] = useState(false);
  const slug = company?.slug;
  const src = !err && slug ? `/logos/${slug}.svg` : company?.logo;
  if (!src || err) {
    return (
      <span className={className} style={{ "--cc": company?.color || "#FFC23D" }}>
        {company?.name ? company.name[0] : "?"}
      </span>
    );
  }
  return (
    <span className={`${className} clogo-img-wrap`} style={{ "--cc": company?.color || "#FFC23D" }}>
      <img
        src={src}
        alt={company?.name || "Company"}
        loading="lazy"
        onError={() => setErr(true)}
      />
    </span>
  );
}

function JobCard({ j, onOpen, L, CH }) {
  const c = CH[j.channel];
  const dl = daysLeft(j.deadline);
  const st = j.my_status;
  return (
    <article className="jcard" style={{ "--cc": j.company.color }}>
      <header>
        <CompanyLogo company={j.company} />
        <div>
          <h3>{j.title}</h3>
          <p>
            {j.company.name}
            {j.company.is_partner && <span className="partner">✓ Partner</span>}
          </p>
        </div>
      </header>
      <div className="jmeta">
        <span>📍 {j.remote ? (L ? "রিমোট" : "Remote") : j.location}</span>
        <span>🗂 {j.job_type_label}</span>
        <span>💸 {money(j.salary_min, j.salary_max, L)}</span>
        {dl != null && (
          <span className={dl <= 5 ? "urgent" : ""}>
            ⏳ {L ? `${dl} দিন বাকি` : `${dl}d left`}
          </span>
        )}
      </div>
      <div className="tags">
        <span className="tag g">{L ? "০ বছর অভিজ্ঞতা" : "0 yrs exp"}</span>
        {j.major_list.slice(0, 3).map((m) => (
          <span key={m} className="tag">
            {m}
          </span>
        ))}
        {j.requirements.slice(0, 2).map((r) => (
          <span key={r} className="tag">
            {r}
          </span>
        ))}
      </div>
      <footer>
        <span className={`chbadge ${c.cls}`} title={c.d}>
          {c.ic} {c.t}
        </span>
        {st === "needs_action" ? (
          <button className="btn btn-out sm" onClick={onOpen}>
            {L ? "পোর্টালে শেষ করো →" : "Finish on portal →"}
          </button>
        ) : st ? (
          <span className="applied">
            ✓ {st === "sent" ? (L ? "ইমেইল পাঠানো হয়েছে" : "Emailed") : st === "done" ? (L ? "সাবমিট করা হয়েছে" : "Submitted") : (L ? "আবেদন সম্পন্ন" : "Applied")}
          </span>
        ) : (
          <button className="btn btn-ink sm" onClick={onOpen}>
            {j.channel === "portal" ? (L ? "অ্যাসিস্টেড আবেদন" : "Assisted apply") : (L ? "১-ট্যাপে আবেদন" : "Apply in 1 tap")}
          </button>
        )}
      </footer>
    </article>
  );
}

function Copy({ label, value, L }) {
  if (!value) return null;
  return (
    <div className="copyrow">
      <span>{label}</span>
      <b>{value}</b>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(String(value));
          toast(L ? `${label} কপি করা হয়েছে` : `${label} copied`);
        }}
      >
        {L ? "কপি" : "Copy"}
      </button>
    </div>
  );
}

export function ApplyModal({ j, onClose, onApplied, L, CH }) {
  const [pv, setPv] = useState(null);
  const [letter, setLetter] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [app, setApp] = useState(null);
  const c = CH[j.channel];

  useEffect(() => {
    api(`/api/jobs/${j.id}/preview/`)
      .then((p) => {
        setPv(p);
        setLetter(p.cover_letter);
      })
      .catch((x) => setErr(x.message));
    if (j.my_status === "needs_action")
      api("/api/jobs/applications/")
        .then((d) => setApp(d.applications.find((a) => a.job.id === j.id)))
        .catch(() => {});
    const esc = (e) => e.key === "Escape" && onClose();
    addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [j, onClose]);

  const send = async () => {
    setBusy(true);
    setErr("");
    try {
      const r = await api(`/api/jobs/${j.id}/apply/`, {
        method: "POST",
        body: { cover_letter: letter },
      });
      setApp(r);
      onApplied();
      if (r.channel !== "portal") {
        const b = document.querySelector(".modal .btn-lime");
        const rc = b?.getBoundingClientRect();
        confetti(rc ? rc.left + rc.width / 2 : innerWidth / 2, rc ? rc.top : 200);
      }
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  };

  const done = async () => {
    const r = await api(`/api/jobs/applications/${app.id}/done/`, { method: "POST" });
    setApp(r);
    onApplied();
    confetti();
    toast(L ? "সাবমিট করা হয়েছে!" : "Nice! Marked as submitted.");
  };

  const packet = app?.packet || pv?.packet;

  return (
    <div className="modal-bg" onClick={onClose}>
      <div
        className="modal apply-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button className="modal-x" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <span className={`chbadge ${c.cls}`}>
          {c.ic} {c.t}
        </span>
        <h2 className="h3">{j.title}</h2>
        <p className="muted">
          {j.company.name} · {j.remote ? (L ? "রিমোট" : "Remote") : j.location} · {money(j.salary_min, j.salary_max, L)}
        </p>
        <p className="small">{c.d}</p>
        <div className="ai-prep">
          <Link to={`/studio?job=${j.id}`} className="ai-prep-b gold">✦ {L ? "এই জবের জন্য সিভি টেইলর" : "Tailor my CV for this job"}</Link>
          <Link to={`/coach?job=${j.id}`} className="ai-prep-b">🎤 {L ? "ইন্টারভিউ প্রস্তুতি" : "Prepare the interview"}</Link>
        </div>
        {!pv && !err && (
          <p className="muted">
            {L ? "আবেদনের ফাইল প্রস্তুত হচ্ছে…" : "Preparing your application…"}
          </p>
        )}
        {err && (
          <p className="err">
            {err}{" "}
            {err.includes("CV") && (
              <Link className="link" to="/cv">
                {L ? "সিভি আপলোড করো →" : "Upload CV →"}
              </Link>
            )}
          </p>
        )}

        {pv && !app && j.my_status !== "needs_action" && (
          <>
            <div className="cvline">
              {pv.cv ? (
                <>
                  📎 <b>{pv.cv.name}</b> · {L ? "সিভি স্কোর" : "CV score"} {pv.cv.score}/100{" "}
                  <Link className="link small" to="/cv">
                    {L ? "পরিবর্তন" : "change"}
                  </Link>
                </>
              ) : (
                <span className="err">
                  {L ? "এখনও কোনো সিভি নেই — " : "No CV yet — "}
                  <Link className="link" to="/cv">
                    {L ? "প্রথমে আপলোড করো" : "upload it first"}
                  </Link>
                  .
                </span>
              )}
            </div>
            {pv.to && (
              <p className="small">
                {L ? "প্রাপক:" : "To:"} <b>{pv.to}</b> · {L ? "উত্তর তোমার ইমেইলে যাবে" : "replies go to your email"}
              </p>
            )}
            <label className="field">
              <span>
                {L ? "কভার লেটার — চাকরির জন্য সাজানো (ইচ্ছা মতো এডিট করো)" : "Cover letter — tailored to this job (edit freely)"}
              </span>
              <textarea rows={10} value={letter} onChange={(e) => setLetter(e.target.value)} />
            </label>
            <button
              className="btn btn-lime"
              disabled={busy || (!pv.cv && pv.channel !== "portal")}
              onClick={send}
            >
              {busy
                ? L
                  ? "পাঠানো হচ্ছে…"
                  : "Sending…"
                : pv.channel === "portal"
                ? L
                  ? "আবেদন প্রস্তুত করো →"
                  : "Prepare my application →"
                : pv.channel === "email"
                ? L
                  ? "এইচআরে পাঠাও ✉️"
                  : "Send to HR ✉️"
                : L
                ? "১-ট্যাপে আবেদন করো ⚡"
                : "Apply in 1 tap ⚡"}
            </button>
          </>
        )}

        {app && app.channel !== "portal" && (
          <div className="sent-ok">
            <span>🎉</span>
            <div>
              <b>
                {app.status === "failed"
                  ? L
                    ? "পাঠানো যায়নি"
                    : "Couldn't send"
                  : app.channel === "email"
                  ? L
                    ? "এইচআরে ইমেইল পাঠানো হয়েছে!"
                    : "Emailed to HR!"
                  : L
                  ? "আবেদন জমা হয়েছে!"
                  : "Application submitted!"}
              </b>
              <p className="small">
                {app.status === "failed"
                  ? app.error
                  : L
                  ? "আমার আবেদন অপশনে ট্র্যাক করতে পারো।"
                  : "Track it in My applications. We'll show updates there."}
              </p>
            </div>
            <Link className="btn btn-out sm" to="/applications">
              {L ? "আমার আবেদনসমূহ" : "My applications"}
            </Link>
          </div>
        )}

        {app && app.channel === "portal" && packet && (
          <div className="portal-steps">
            <ol>
              <li>
                <b>{L ? "কোম্পানির ক্যারিয়ার পোর্টাল ওপেন করো" : "Open the company portal"}</b>{" "}
                <a
                  className="btn btn-ink sm"
                  href={packet.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {L ? "পোর্টাল খোলো ↗" : "Open career portal ↗"}
                </a>
              </li>
              <li>
                <b>{L ? "১-ক্লিকে কপি করে পেস্ট করো:" : "Paste your details — one click each:"}</b>
                <div className="copygrid">
                  <Copy label={L ? "নাম" : "Name"} value={packet.full_name} L={L} />
                  <Copy label={L ? "ইমেইল" : "Email"} value={packet.email} L={L} />
                  <Copy label={L ? "ফোন" : "Phone"} value={packet.phone} L={L} />
                  <Copy label={L ? "ভার্সিটি" : "University"} value={packet.university} L={L} />
                  <Copy label={L ? "মেজর" : "Major"} value={packet.major} L={L} />
                  <Copy label={L ? "পাসের সন" : "Graduation"} value={packet.graduation_year} L={L} />
                  <Copy label="CGPA" value={packet.cgpa} L={L} />
                  <Copy label="LinkedIn" value={packet.linkedin} L={L} />
                  <Copy label={L ? "দক্ষতা" : "Skills"} value={packet.skills} L={L} />
                  <Copy label={L ? "কভার লেটার" : "Cover letter"} value={app.cover_letter} L={L} />
                </div>
              </li>
              <li>
                <b>{L ? "সিভি আপলোড করো এবং তাদের সাইটে সাবমিট করো।" : "Upload your CV and submit on their site."}</b>
              </li>
            </ol>
            {app.status === "done" ? (
              <p className="cert-note">{L ? "✓ সাবমিট করা হিসেবে চিহ্নিত" : "✓ Marked as submitted"}</p>
            ) : (
              <button className="btn btn-lime" onClick={done}>
                {L ? "আমি সাবমিট করেছি ✓" : "I've submitted it ✓"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BulkModal({ ids, jobs, onClose, onDone, L, CH }) {
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);
  const list = jobs.filter((j) => ids.includes(j.id));
  const go = async () => {
    setBusy(true);
    try {
      const r = await api("/api/jobs/apply-bulk/", { method: "POST", body: { job_ids: ids } });
      setRes(r);
      onDone();
      if (r.applied) confetti();
    } catch (x) {
      setRes({ error: x.message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="modal-x" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2 className="h3">
          {L ? `একসাথে ${list.length}টি পদে আবেদন করতে চাও?` : `Apply to ${list.length} jobs at once?`}
        </h2>
        <p className="muted">
          {L
            ? "প্রতিটি পদে তোমার সর্বশেষ সিভি ও কাস্টম কভার লেটার পাঠানো হবে।"
            : "Each gets your latest CV and its own tailored cover letter. Company-portal jobs aren't included — finish those one by one."}
        </p>
        <ul className="bulk-list">
          {list.map((j) => (
            <li key={j.id}>
              <span className={`chbadge ${CH[j.channel].cls}`}>{CH[j.channel].ic}</span> {j.title} ·{" "}
              <span className="muted">{j.company.name}</span>
              {res?.results && (
                <em>{res.results.find((r) => r.job_id === j.id)?.ok ? " ✓" : " ✕"}</em>
              )}
            </li>
          ))}
        </ul>
        {res?.error && <p className="err">{res.error}</p>}
        {res?.results ? (
          <p className="cert-note">
            {L ? `${res.applied}টি পদে আবেদন করা হয়েছে 🎉 ` : `Applied to ${res.applied} jobs 🎉 `}
            <Link className="link" to="/applications">
              {L ? "আবেদনসমূহ দেখো →" : "Track them →"}
            </Link>
          </p>
        ) : (
          <button className="btn btn-lime" disabled={busy} onClick={go}>
            {busy ? (L ? "আবেদন করা হচ্ছে…" : "Applying…") : (L ? `হ্যাঁ, ${list.length}টিতেই আবেদন করো` : `Yes, apply to ${list.length}`)}
          </button>
        )}
      </div>
    </div>
  );
}

function AutoApplyPanel({ matches, onRun, L, CH }) {
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);
  const [run, setRun] = useState(null);
  const [openP, setOpenP] = useState(false);

  useEffect(() => {
    api("/api/jobs/auto-apply/")
      .then(setS)
      .catch(() => {});
  }, []);

  if (!s) return null;

  const save = async (patch) => {
    const next = { ...s, ...patch };
    setS(next);
    setSaving(true);
    try {
      setS(await api("/api/jobs/auto-apply/", { method: "PUT", body: next }));
    } finally {
      setSaving(false);
    }
  };

  const ch = (s.channels || "").split(",");
  const toggleCh = (c) =>
    save({
      channels:
        (ch.includes(c) ? ch.filter((x) => x !== c) : [...ch, c]).filter(Boolean).join(",") ||
        "partner",
    });

  const runNow = async () => {
    setRun({ busy: true });
    try {
      const r = await api("/api/jobs/auto-apply/run/", { method: "POST" });
      setRun(r);
      onRun();
      if (r.applied) confetti();
    } catch (x) {
      setRun({ error: x.message });
    }
  };

  return (
    <div id="auto" className={`card auto-panel ${s.enabled ? "on" : ""}`}>
      <div className="ap-head">
        <div>
          <b>{L ? "🤖 অটো-অ্যাপ্লাই" : "🤖 Auto-apply"}</b>
          <span>
            {s.enabled
              ? L
                ? `চালু — দিনে সর্বোচ্চ ${s.max_per_day}টি নতুন সার্কুলারে স্বয়ংক্রিয় আবেদন।`
                : `On — up to ${s.max_per_day} applications a day to new matching 1-click & email jobs.`
              : L
              ? "বন্ধ রয়েছে। চালু করলে প্রতিদিন নতুন সার্কুলারে স্বয়ংক্রিয়ভাবে আবেদন হবে।"
              : "Off. Turn it on and we apply for you every day."}
            {s.last_run && (
              <> {L ? "সর্বশেষ রান:" : "Last run"} {new Date(s.last_run).toLocaleString()}.</>
            )}
          </span>
        </div>
        <button
          className={`switch ${s.enabled ? "on" : ""}`}
          role="switch"
          aria-checked={s.enabled}
          onClick={() => save({ enabled: !s.enabled })}
        >
          <i />
        </button>
      </div>
      {matches && !matches.has_cv && (
        <p className="err small">
          {L ? "প্রথমে সিভি আপলোড করো — " : "Upload your CV first — "}
          <Link className="link" to="/cv">
            {L ? "সিভি চেক →" : "Judge my CV →"}
          </Link>
        </p>
      )}
      <div className="ap-row">
        <span className="small">
          <b>{matches?.auto_eligible?.length ?? "…"}</b>{" "}
          {L ? "ম্যাচিং সার্কুলার অটো-অ্যাপ্লাইয়ের জন্য রেডি" : "matching jobs ready to auto-apply"}
        </span>
        <button className="link small" onClick={() => setOpenP(!openP)}>
          {openP ? (L ? "সেটিংস লুকাও" : "Hide settings") : (L ? "সেটিংস" : "Settings")}
        </button>
        <button
          className="btn btn-ink sm"
          disabled={!s.enabled || run?.busy}
          onClick={runNow}
        >
          {run?.busy ? (L ? "আবেদন হচ্ছে…" : "Applying…") : (L ? "এখনই রান করো" : "Run now")}
        </button>
        {saving && <span className="muted small">{L ? "সংরক্ষণ হচ্ছে…" : "Saving…"}</span>}
      </div>
      {run?.results && (
        <p className="cert-note">
          {L ? `${run.applied}টি চাকরিতে আবেদন করা হয়েছে` : `Applied to ${run.applied} jobs`}
          {run.results.length ? `: ${run.results.map((r) => r.job).join(", ")}` : L ? " — আজকে আবেদন করার মতো নতুন কিছু নেই।" : " — nothing new to apply to today."}
        </p>
      )}
      {run?.error && <p className="err small">{run.error}</p>}
      {openP && (
        <div className="ap-settings">
          <label className="field">
            <span>{L ? `প্রতিদিন সর্বোচ্চ: ${s.max_per_day}টি` : `Max per day: ${s.max_per_day}`}</span>
            <input
              type="range"
              min="1"
              max="20"
              value={s.max_per_day}
              onChange={(e) => setS({ ...s, max_per_day: +e.target.value })}
              onMouseUp={() => save({})}
              onTouchEnd={() => save({})}
            />
          </label>
          <label className="field">
            <span>{L ? "লোকেশন (কমা দিয়ে লিখুন, ফাঁকা = যেকোনো জায়গা)" : "Locations (comma separated, blank = anywhere)"}</span>
            <input
              defaultValue={s.locations}
              onBlur={(e) => save({ locations: e.target.value })}
              placeholder={L ? "ঢাকা, রিমোট" : "Dhaka, Remote"}
            />
          </label>
          <label className="field">
            <span>{L ? "ন্যূনতম বেতন (৳/মাস)" : "Minimum salary (৳/month)"}</span>
            <input
              type="number"
              defaultValue={s.min_salary || ""}
              onBlur={(e) => save({ min_salary: e.target.value ? +e.target.value : null })}
              placeholder="25000"
            />
          </label>
          <div className="field">
            <span>{L ? "আবেদনের মাধ্যম" : "Channels"}</span>
            <div className="row">
              {["partner", "email"].map((c) => (
                <label key={c} className="check">
                  <input
                    type="checkbox"
                    checked={ch.includes(c)}
                    onChange={() => toggleCh(c)}
                  />{" "}
                  {CH[c].ic} {CH[c].t}
                </label>
              ))}
            </div>
          </div>
          <label className="field">
            <span>{L ? "কভার লেটারের ব্যক্তিগত লাইন" : "A personal line for every cover letter"}</span>
            <textarea
              rows={2}
              defaultValue={s.note}
              onBlur={(e) => save({ note: e.target.value })}
              placeholder={L ? "যেমন: আমি থিসিসের জন্য ৯২% নির্ভুল বাংলা সেন্টিমেন্ট মডেল তৈরি করেছি।" : "e.g. I built a machine learning model with 92% accuracy for my thesis."}
            />
          </label>
        </div>
      )}
    </div>
  );
}

export function Applications() {
  const [d, setD] = useState(null);
  const [view, setView] = useState(null);
  const [lang] = useLang();
  const L = lang === "bn" ? 1 : 0;
  const CH = getCH(L);

  const load = () =>
    api("/api/jobs/applications/")
      .then(setD)
      .catch(() => setD({ applications: [], counts: {} }));

  useEffect(() => {
    load();
  }, []);

  const act = async (id, action) => {
    await api(`/api/jobs/applications/${id}/${action}/`, { method: "POST" });
    load();
  };

  const total = d?.applications?.length || 0;

  return (
    <div className="page">
      <div className="wrap">
        <div className="page-head">
          <div>
            <p className="eyebrow">{L ? "আমার আবেদনসমূহ" : "My applications"}</p>
            <h1 className="h2">
              {total ? (
                L ? (
                  <>মোট {fmt(total)}টি আবেদন <em>চলমান।</em></>
                ) : (
                  <>{fmt(total)} applications <em>out there.</em></>
                )
              ) : L ? (
                "এখনও কোনো আবেদন করা হয়নি।"
              ) : (
                "No applications yet."
              )}
            </h1>
            <p className="muted lead2">
              {L
                ? "তোমার সকল চাকরির আবেদন — ১-ক্লিক, ইমেইল বা পোর্টাল — এক ছাদের নিচে ট্র্যাক করো।"
                : "Every job you applied to — 1-click, email or portal — in one place."}
            </p>
          </div>
          <Link to="/jobs" className="btn btn-ink">
            {L ? "আরও চাকরি ব্রাউজ করো →" : "Find more jobs →"}
          </Link>
        </div>
        {d && total > 0 && (
          <div className="app-counts">
            {Object.entries(d.counts).map(([k, v]) => (
              <span key={k} className={`status s-${k}`}>
                {v} {k.replace("_", " ")}
              </span>
            ))}
          </div>
        )}
        <div className="app-list">
          {d?.applications.map((a) => (
            <div key={a.id} className="app-row">
              <CompanyLogo company={a.job.company} />
              <div className="app-main">
                <b>{a.job.title}</b>
                <span>
                  {a.job.company.name} · {new Date(a.created_at).toLocaleDateString()}{" "}
                  {a.auto && <em className="autotag">🤖 auto</em>}
                </span>
              </div>
              <span className={`chbadge ${CH[a.channel]?.cls || ""}`}>
                {CH[a.channel]?.ic} {CH[a.channel]?.t}
              </span>
              <span className={`status s-${a.status}`}>{a.status_label}</span>
              <div className="app-act">
                {a.status === "needs_action" && (
                  <>
                    <a
                      className="btn btn-out sm"
                      href={a.job.apply_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {L ? "পোর্টাল ↗" : "Portal ↗"}
                    </a>
                    <button className="btn btn-lime sm" onClick={() => act(a.id, "done")}>
                      {L ? "সাবমিট করেছি ✓" : "Mark submitted ✓"}
                    </button>
                  </>
                )}
                <button className="link small" onClick={() => setView(a)}>
                  {L ? "কভার লেটার" : "Letter"}
                </button>
                {["needs_action", "submitted", "sent", "done"].includes(a.status) && (
                  <button className="link small" onClick={() => act(a.id, "withdraw")}>
                    {L ? "প্রত্যাহার" : "Withdraw"}
                  </button>
                )}
              </div>
            </div>
          ))}
          {d && total === 0 && (
            <div className="card share-cta">
              <p className="muted">
                {L
                  ? "তোমার প্রথম ফ্রেশার চাকরিতে আবেদন করো — মাত্র এক ক্লিকেই।"
                  : "Apply to your first fresher job — it takes one tap."}
              </p>
              <Link className="btn btn-ink" to="/jobs">
                {L ? "চাকরি ব্রাউজ করো" : "Browse jobs"}
              </Link>
            </div>
          )}
        </div>
        {view && (
          <div className="modal-bg" onClick={() => setView(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-x" onClick={() => setView(null)} aria-label="Close">
                ✕
              </button>
              <h2 className="h3">
                {L ? `কভার লেটার — ${view.job.title}` : `Cover letter — ${view.job.title}`}
              </h2>
              <pre className="letter">{view.cover_letter}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
