import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { useLang } from "../i18n";
import { hasChosenTrack, useTrack } from "../track";
import FunnyTyper, {
  STARTUP_HEADLINES,
  STARTUP_HEADLINES_EN,
} from "./FunnyTyper";
import JobStarSky, { toBn } from "./hero/JobStarSky";
import JobStoryIntro, { useJobStory } from "./hero/JobStoryIntro";
import LanternSky from "./hero/LanternSky";
import PlaneSky from "./hero/PlaneSky";
import StoryRail from "../components/StoryRail";

// 5 Job Categories (Clean & Highlighted, Fully Bilingual)
export const HERO_JOB_CATEGORIES = [
  {
    id: "it",
    titleEn: "IT Job",
    titleBn: "IT Job (আইটি)",
    subEn: "Software & AI",
    subBn: "সফটওয়্যার ও এআই",
    icon: "💻",
    salaryEn: "৳35k–৳85k+",
    salaryBn: "৳৩৫k–৳৮৫k+",
    vacanciesEn: "42+ Roles",
    vacanciesBn: "৪২+ পদ",
    major: "Computer Science & Engineering",
    query: "it developer software",
    accent: "#3B82F6",
  },
  {
    id: "business",
    titleEn: "Business Job",
    titleBn: "Business Job (বিজনেস)",
    subEn: "Marketing & Growth",
    subBn: "মার্কেটিং ও গ্রোথ",
    icon: "📈",
    salaryEn: "৳25k–৳65k",
    salaryBn: "৳২৫k–৳৬৫k",
    vacanciesEn: "38+ Roles",
    vacanciesBn: "৩৮+ পদ",
    major: "Business Administration (BBA)",
    query: "business marketing sales finance",
    accent: "#F59E0B",
  },
  {
    id: "agriculture",
    titleEn: "Agriculture Job",
    titleBn: "Agriculture Job (কৃষি)",
    subEn: "Agri-Tech & Farming",
    subBn: "এগ্রি-টেক ও ফার্মিং",
    icon: "🌾",
    salaryEn: "৳22k–৳52k",
    salaryBn: "৳২২k–৳৫২k",
    vacanciesEn: "19+ Roles",
    vacanciesBn: "১৯+ পদ",
    major: "Agriculture & Agribusiness",
    query: "agriculture agritech farming",
    accent: "#10B981",
  },
  {
    id: "textile",
    titleEn: "Textile Job",
    titleBn: "Textile Job (টেক্সটাইল)",
    subEn: "Merchandising & RMG",
    subBn: "মার্চেন্ডাইজিং ও আরএমজি",
    icon: "🧵",
    salaryEn: "৳25k–৳62k",
    salaryBn: "৳২৫k–৳৬২k",
    vacanciesEn: "31+ Roles",
    vacanciesBn: "৩১+ পদ",
    major: "Textile Engineering",
    query: "textile garment merchandising",
    accent: "#8B5CF6",
  },
  {
    id: "engineering",
    titleEn: "Engineering Job",
    titleBn: "Engineering Job (ইঞ্জিনিয়ারিং)",
    subEn: "EEE, Civil & Mechanical",
    subBn: "EEE, সিভিল ও মেকানিক্যাল",
    icon: "⚙️",
    salaryEn: "৳28k–৳75k",
    salaryBn: "৳২৮k–৳৭৫k",
    vacanciesEn: "27+ Roles",
    vacanciesBn: "২৭+ পদ",
    major: "Electrical & Electronic (EEE)",
    query: "engineering mechanical civil electrical",
    accent: "#EC4899",
  },
];

// 5 Internship Categories (Clean & Highlighted, Fully Bilingual)
export const HERO_INTERN_CATEGORIES = [
  {
    id: "paid",
    titleEn: "Paid Internship",
    titleBn: "পেইড ইন্টার্নশিপ",
    subEn: "Monthly Paid",
    subBn: "পেইড ইন্টার্ন",
    icon: "💵",
    highlightEn: "৳10k–৳25k Stipend",
    highlightBn: "৳১০k–৳২৫k স্টাইপেন্ড",
    query: "paid",
    accent: "#10B981",
  },
  {
    id: "unpaid",
    titleEn: "Unpaid Internship",
    titleBn: "আনপেইড ইন্টার্নশিপ",
    subEn: "Hands-on Projects",
    subBn: "লার্নিং ও প্রজেক্ট",
    icon: "📜",
    highlightEn: "Verified Certificate",
    highlightBn: "হ্যান্ডস-অন সার্টিফিকেট",
    query: "unpaid",
    accent: "#6366F1",
  },
  {
    id: "versity",
    titleEn: "Versity Internship",
    titleBn: "ভার্সিটি ক্রেডিট ইন্টার্ন",
    subEn: "Academic Credit",
    subBn: "ভার্সিটি ক্রেডিট ইন্টার্ন",
    icon: "🏫",
    highlightEn: "Graduation Compliance",
    highlightBn: "গ্র্যাজুয়েশন কমপ্লায়েন্স",
    query: "versity",
    accent: "#F59E0B",
  },
  {
    id: "corporate",
    titleEn: "Corporate Internship",
    titleBn: "কর্পোরেট ইন্টার্নশিপ",
    subEn: "Top Corporate & MNC",
    subBn: "শীর্ষ কর্পোরেট ও MNC",
    icon: "🏢",
    highlightEn: "Corporate Grooming + PPO",
    highlightBn: "কর্পোরেট গ্রুমিং + PPO",
    query: "corporate",
    accent: "#3B82F6",
  },
  {
    id: "remote",
    titleEn: "Remote Internship",
    titleBn: "রিমোট ইন্টার্নশিপ",
    subEn: "Work From Home",
    subBn: "ঘরে বসে কাজের সুযোগ",
    icon: "🌐",
    highlightEn: "100% Remote / WFH",
    highlightBn: "১০০% রিমোট সুবিধা",
    query: "remote",
    accent: "#EC4899",
  },
];

export default function Hero({ ready = true }) {
  const [track, setTrack] = useTrack();
  const { user } = useAuth();
  const [lang] = useLang();
  const L = lang === "bn" ? 1 : 0;
  const nav = useNavigate();

  // Modals for neat, un-cluttered interaction
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [skillTools, setSkillTools] = useState([]);
  const [hasProj, setHasProj] = useState(null);
  const [starCount, setStarCount] = useState(157);
  const [catCounts, setCatCounts] = useState({});
  const onStars = useCallback((n, per) => { setStarCount(n); setCatCounts(per); }, []);
  const story = useJobStory((track === "job" || track === "internship") && ready, track);

  const toggleTool = (t) => {
    setSkillTools((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };
  const skillScore = Math.min(
    100,
    skillTools.length * 20 + (hasProj === "yes" ? 40 : hasProj === "wip" ? 20 : 0)
  );

  return (
    <header className={`hero hero-${track} hero-integrated-categories ${track !== "startup" ? (story.playing ? "jx-play" : story.played ? "jx-after" : "") : ""}`}>
      {/* Visual Effect as the Living Background */}
      {track === "job" && <JobStarSky key="job" onCount={onStars} introT0={story.t0} />}
      {track === "internship" && <PlaneSky key="internship" />}
      {track === "startup" && <LanternSky key="startup" />}

      {/* ================= 1 + 2. JOB / INTERNSHIP: VIDEO STORY CATEGORIES ================= */}
      {(track === "job" || track === "internship") && (
        <div className="hero-category-overlay sr-host">
          <StoryRail
            kind={track}
            galaxy={track === "job" ? { counts: catCounts, introT0: story.t0 } : null}
          />
        </div>
      )}

      {/* ================= 3. STARTUP TRACK ================= */}
      {track === "startup" && (
        <div className="hero-copy">
          <button
            type="button"
            className="eyebrow-pill eyebrow-pill-btn"
            onClick={() => window.dispatchEvent(new CustomEvent("open_track_gate"))}
            title={L ? "অন্য অপশনে যেতে ক্লিক করুন" : "Click to switch track"}
          >
            🚀 {L ? "আইডিয়া থেকে বিজনেস" : "Idea to Business"}{" "}
            <span className="pill-arrow">▾</span>
          </button>
          <h1 className="sr">
            {L
              ? "সোনারহরিণ — ফ্রেশারদের জন্য চাকরি, ইন্টার্নশিপ এবং স্টার্টআপ ফান্ডিং।"
              : "Sonarhorin — first jobs, internships and startup funding for freshers in Bangladesh."}
          </h1>
          <FunnyTyper
            key={track + lang}
            lines={L ? STARTUP_HEADLINES : STARTUP_HEADLINES_EN}
            className={`hero-type ${L ? "" : "en-type"}`}
            typeMs={22}
            holdMs={2600}
          />
          <div className="hero-ctas">
            <a href="#builder" className="btn btn-lime">
              {L ? "আইডিয়া পিচ করো →" : "Pitch my idea →"}
            </a>
            <a href="#three-friends" className="btn btn-ghost">
              🎬 {L ? "৩ বন্ধুর গল্প" : "3 Friends Story"}
            </a>
          </div>
        </div>
      )}

      {/* ================= MODAL: 3-STEP JOB TUTORIAL ================= */}
      {showTutorialModal && (
        <div className="modal-bg" onClick={() => setShowTutorialModal(false)}>
          <div className="modal job-tutorial-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-x" onClick={() => setShowTutorialModal(false)}>✕</button>
            <span className="jch-kicker">
              {L ? "🎓 ফ্রেশার জব পাওয়ার সিক্রেট মেথড" : "🎓 Fresher Job Success Secret"}
            </span>
            <h2 className="h3 bn" style={{ marginTop: 8 }}>
              {L
                ? "সোনারহরিণ ৩-স্টেপ ক্যারিয়ার সাকসেস গাইড"
                : "Sonarhorin 3-Step Career Success Guide"}
            </h2>
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
                  <Link to="/cv" className="link small" onClick={() => setShowTutorialModal(false)}>
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
                      ? "তোমার ফিল্ড অনুযায়ী (IT, Business, Agriculture, Textile, Engineering) ফিল্টার করো। শুধু ফ্রেশারদের পদগুলো দেখো।"
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
                      ? "ম্যানুয়ালি শত শত ফর্ম পূরণের দিন শেষ। ১-ট্যাপে তোমার সিভি ও কাস্টম কভার লেটার সরাসরি এইচআর ইনবক্সে পৌঁছে যাবে!"
                      : "No more repetitive manual forms. 1-tap instantly sends your CV and tailored cover letter to the HR inbox!"}
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-lime wide"
              onClick={() => {
                setShowTutorialModal(false);
                nav("/jobs");
              }}
            >
              {L ? "বুঝেছি! সরাসরি জব ব্রাউজ শুরু করো →" : "Got it! Start Browsing Jobs →"}
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: PRE-INTERNSHIP SKILL-READY CHECK ================= */}
      {showSkillModal && (
        <div className="modal-bg" onClick={() => setShowSkillModal(false)}>
          <div className="modal job-tutorial-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-x" onClick={() => setShowSkillModal(false)}>✕</button>
            <span className="jch-kicker">
              {L ? "⚡ প্রি-ইন্টার্নশিপ প্রস্তুতি টেস্ট" : "⚡ Pre-Internship Readiness Test"}
            </span>
            <h2 className="h3 bn" style={{ marginTop: 8 }}>
              {L ? (
                <>ইন্টার্নশিপ করতে এসেছো — <span className="gold-text">তুমি কি স্কিলফুল?</span></>
              ) : (
                <>Starting an internship — <span className="gold-text">Are you skill-ready?</span></>
              )}
            </h2>
            <p className="muted small">
              {L
                ? "কোম্পানিগুলো চায় তুমি যেন কাজ শুরু করার মতো বেসিক টুল ও নিয়মানুবর্তিতা জানো। নিচের তথ্যগুলো পূরণ করো:"
                : "Companies expect you to know basic workplace tools and disciplined fundamentals. Fill out below:"}
            </p>

            <div className="jt-steps-list">
              <div className="jt-step-card">
                <span className="jt-badge">{L ? "ধাপ ১" : "Step 1"}</span>
                <div>
                  <b>{L ? "তুমি কোন কোন বেসিক টুলস ও দক্ষতায় আত্মবিশ্বাসী?" : "Which foundational tools are you confident with?"}</b>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                    {[
                      ["git", "Git / GitHub"],
                      ["excel", "Excel / Sheets"],
                      ["coding", L ? "বেসিক কোড / টেক" : "Basic Code / Tech"],
                      ["comm", L ? "ইমেইল ও যোগাযোগ" : "Email & Communication"],
                    ].map(([id, lbl]) => (
                      <label key={id} style={{ display: "flex", gap: 6, fontSize: 13, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={skillTools.includes(id)}
                          onChange={() => toggleTool(id)}
                        />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="jt-step-card">
                <span className="jt-badge">{L ? "ধাপ ২" : "Step 2"}</span>
                <div>
                  <b>{L ? "তোমার কি অন্তত ১টি বাস্তব প্রজেক্ট বা পোর্টফোলিও কাজ রেডি আছে?" : "Do you have at least 1 real project or portfolio item ready?"}</b>
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    {[
                      ["yes", L ? "✓ হ্যাঁ, রেডি আছে" : "✓ Yes, Ready"],
                      ["wip", L ? "🔄 কাজ চলছে" : "🔄 In Progress"],
                      ["no", L ? "✕ এখনও নেই" : "✕ Not yet"],
                    ].map(([val, lbl]) => (
                      <button
                        key={val}
                        type="button"
                        className={`hcs-pill ${hasProj === val ? "active" : ""}`}
                        onClick={() => setHasProj(val)}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Score */}
              <div className="jt-step-card" style={{ background: "rgba(255,215,0,0.08)", borderColor: "rgba(255,215,0,0.3)" }}>
                <span className="jt-badge" style={{ background: "#FFD700", color: "#1E1B4B" }}>
                  {L ? "রেজাল্ট" : "Result"}
                </span>
                <div>
                  <b>
                    {L ? "তোমার ইন্টার্নশিপ স্কিল স্কোর:" : "Your Internship Readiness Score:"}{" "}
                    <span style={{ color: "#FFD700", fontSize: 18 }}>{skillScore}%</span>
                  </b>
                  <p style={{ margin: "4px 0 0 0" }}>
                    {skillScore >= 60
                      ? L
                        ? "🎉 দুর্দান্ত! তুমি যেকোনো ইন্টার্নশিপে সরাসরি আবেদনের জন্য প্রস্তুত।"
                        : "🎉 Excellent! You are ready to apply for competitive internships."
                      : L
                      ? "💡 আবেদনের আগে গিটহাবে অন্তত ১টি বাস্তব প্রজেক্ট আপলোড করো।"
                      : "💡 Upload at least 1 real project to GitHub or your portfolio before applying."}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-lime wide"
              onClick={() => {
                setShowSkillModal(false);
                nav("/internships");
              }}
            >
              {L ? "ইন্টার্নশিপ ব্রাউজ শুরু করো →" : "Start Browsing Internships →"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
