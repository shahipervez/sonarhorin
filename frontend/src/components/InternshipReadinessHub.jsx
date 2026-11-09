import { useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n";

export const INTERNSHIP_CATEGORIES = [
  {
    id: "paid",
    titleBn: "পেইড ইন্টার্নশিপ",
    titleEn: "Paid Internship",
    icon: "💵",
    stipendBn: "৳১০,০০০ – ৳২৫,০০০ / মাস",
    stipendEn: "৳10,000 – ৳25,000 / mo",
    tagBn: "মাসিক নিশ্চিত স্টাইপেন্ড",
    tagEn: "Monthly Stipend · Guaranteed",
    descBn: "মাসিক নিশ্চিত স্টাইপেন্ডসহ হ্যান্ডস-অন কাজের সুযোগ ও মেন্টরশিপ।",
    descEn: "Hands-on commercial projects with guaranteed monthly stipend & mentorship.",
    query: "paid",
    color: "#10B981",
  },
  {
    id: "unpaid",
    titleBn: "আনপেইড ও লার্নিং ইন্টার্ন",
    titleEn: "Unpaid / Learning Internship",
    icon: "📜",
    stipendBn: "রিয়েল প্রজেক্ট + লাইভ সার্টিফিকেট",
    stipendEn: "Real Projects + Live Certificate",
    tagBn: "হ্যান্ডস-অন লার্নিং",
    tagEn: "Hands-on Learning · Portfolio",
    descBn: "অভিজ্ঞ লিডদের সরাসরি গাইডেন্সে লাইভ প্রজেক্ট তৈরি ও পোর্টফোলিও সমৃদ্ধকরণ।",
    descEn: "Build real portfolio projects under guidance of senior team leads.",
    query: "unpaid",
    color: "#6366F1",
  },
  {
    id: "versity",
    titleBn: "ভার্সিটি ক্রেডিট ইন্টার্ন",
    titleEn: "Academic Credit Internship",
    icon: "🏫",
    stipendBn: "একাডেমিক ক্রেডিট ফুলফিলমেন্ট",
    stipendEn: "Academic Credit Fulfillment",
    tagBn: "গ্র্যাজুয়েশন রিকোয়ারমেন্ট",
    tagEn: "Graduation Requirement",
    descBn: "বিশ্ববিদ্যালয়ের ফাইনাল সেমিস্টার বা গ্র্যাজুয়েশন রিকোয়ারমেন্টের অনুমোদিত রিপোর্ট সুবিধা।",
    descEn: "Approved enterprise internship reports compliant with university graduation credits.",
    query: "versity",
    color: "#F59E0B",
  },
  {
    id: "corporate",
    titleBn: "কর্পোরেট ও এমএনসি ইন্টার্ন",
    titleEn: "Corporate & MNC Internship",
    icon: "🏢",
    stipendBn: "শীর্ষ কর্পোরেট গ্রুমিং + PPO",
    stipendEn: "Top Corporate Grooming + PPO",
    tagBn: "টপ টায়ার ব্র্যান্ডস",
    tagEn: "Top Tier Brands · PPO Track",
    descBn: "শীর্ষস্থানীয় বহুজাতিক ও দেশীয় শীর্ষ প্রতিষ্ঠানে ফুলটাইম জবে রূপান্তরের সুযোগ।",
    descEn: "High-visibility placements with pre-placement offer (PPO) conversion potential.",
    query: "corporate",
    color: "#3B82F6",
  },
  {
    id: "remote",
    titleBn: "রিমোট ইন্টার্নশিপ",
    titleEn: "Remote / Work From Home",
    icon: "🌐",
    stipendBn: "ঘরে বসে কাজের ফ্লেক্সিবল সুবিধা",
    stipendEn: "Flexible Work From Home",
    tagBn: "ফ্লেক্সিবল সময়সূচী",
    tagEn: "Flexible Hours · Global / Local",
    descBn: "ক্লাস বা অন্যান্য কাজের পাশাপাশি দেশের যেকোনো প্রান্ত থেকে অনলাইনে ইন্টার্নশিপ।",
    descEn: "Complete remote projects with flexible hours from anywhere in Bangladesh.",
    query: "remote",
    color: "#EC4899",
  },
];

const SKILL_CHECKLIST = [
  {
    id: "git",
    labelEn: "Git & GitHub / Version control basics",
    labelBn: "Git & GitHub / Version Control বা ফাইল ভার্সনিং",
  },
  {
    id: "excel",
    labelEn: "Excel, Google Sheets & data organization",
    labelBn: "Excel, Google Sheets বা ডেটা অর্গানাইজেশন",
  },
  {
    id: "tech",
    labelEn: "Domain-specific code, tools or design software",
    labelBn: "ফিল্ড অনুযায়ী বেসিক সফটওয়্যার / কোডিং / ডিজাইন টুল",
  },
  {
    id: "comm",
    labelEn: "Professional email writing & team communication",
    labelBn: "প্রফেশনাল ইমেইল রাইটিং ও টিম কমিউনিকেশন",
  },
];

export default function InternshipReadinessHub({ activeInternCategory, onSelectInternCategory }) {
  const [lang] = useLang();
  const L = lang === "bn" ? 1 : 0;

  // Pre-internship skill assessment state
  const [selectedTools, setSelectedTools] = useState([]);
  const [hasProject, setHasProject] = useState(null); // 'yes' | 'wip' | 'no'
  const [showResult, setShowResult] = useState(false);

  const toggleTool = (id) => {
    setSelectedTools((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Compute readiness score (0-100)
  const toolScore = selectedTools.length * 15; // max 60
  const projScore = hasProject === "yes" ? 40 : hasProject === "wip" ? 20 : 0; // max 40
  const totalScore = Math.min(100, toolScore + projScore);
  const isReady = totalScore >= 70;

  return (
    <div className="internship-readiness-hub-wrap">
      {/* ================= PRE-INTERNSHIP "ARE YOU SKILL-READY?" SHOWCASE ================= */}
      <div className="irh-assessment-banner">
        <div className="irh-banner-top">
          <div className="irh-banner-title-box">
            <span className="irh-pulse-badge">
              {L
                ? "⚡ ইন্টার্নশিপের আগে নিজেকে যাচাই করো · Skill-Ready First"
                : "⚡ PRE-INTERNSHIP ASSESSMENT · SKILL-READY FIRST"}
            </span>
            <h2 className={`irh-title ${L ? "bn" : ""}`}>
              {L ? (
                <>ইন্টার্নশিপ করতে এসেছো — <span className="gold-text">তুমি কি স্কিলফুল?</span></>
              ) : (
                <>Looking for an internship — <span className="gold-text">Are you skill-ready?</span></>
              )}
            </h2>
            <p className="irh-desc">
              {L
                ? "অনেকে কোনো প্রস্তুতি বা প্রজেক্ট ছাড়াই ডজন ডজন ইন্টার্নশিপে আবেদন করে হতাশ হয়। কোম্পানিগুলো চায় ইন্টার্ন যেন শুরুতেই অন্তত কাজের মৌলিক টুলসগুলো জানে।"
                : "Avoid rejections by verifying workplace fundamentals before applying. Top employers look for candidates ready with basic professional tools."}
            </p>
          </div>

          <div className="irh-score-meter">
            <div className="irh-meter-circle">
              <span className="irh-meter-num">{totalScore}%</span>
              <span className="irh-meter-lbl">{L ? "স্কিল রেডি" : "Readiness"}</span>
            </div>
          </div>
        </div>

        {/* The Quick Interactive Checklist */}
        <div className="irh-checklist-grid">
          <div className="irh-check-col">
            <b className="irh-col-title">
              {L ? "১. নিচের কোন টুলগুলো তুমি ব্যবহার করতে পারো?" : "1. Which tools can you comfortably use?"}
            </b>
            <div className="irh-checkboxes">
              {SKILL_CHECKLIST.map((item) => {
                const checked = selectedTools.includes(item.id);
                return (
                  <label key={item.id} className={`irh-label ${checked ? "checked" : ""}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTool(item.id)}
                    />
                    <span className="irh-custom-box">{checked ? "✓" : ""}</span>
                    <span>{L ? item.labelBn : item.labelEn}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="irh-check-col">
            <b className="irh-col-title">
              {L ? "২. তোমার কি অন্তত ১টি প্রজেক্ট বা পোর্টফোলিও লিঙ্ক আছে?" : "2. Do you have at least 1 real project or portfolio link?"}
            </b>
            <div className="irh-project-radios">
              {[
                { val: "yes", en: "Yes, live & ready to share", bn: "হ্যাঁ, লাইভ লিঙ্ক / গিটহাব রেডি আছে" },
                { val: "wip", en: "Currently in progress", bn: "কাজ চলছে, এখনো শেষ হয়নি" },
                { val: "no", en: "Not yet", bn: "না, এখনো কোনো প্রজেক্ট করিনি" },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  className={`irh-radio-btn ${hasProject === opt.val ? "active" : ""}`}
                  onClick={() => setHasProject(opt.val)}
                >
                  <span className="radio-dot" />
                  <span>{L ? opt.bn : opt.en}</span>
                </button>
              ))}
            </div>

            <div className="irh-eval-action">
              <button
                type="button"
                className="irh-evaluate-btn"
                onClick={() => setShowResult(true)}
              >
                <span>{L ? "রেজাল্ট ও প্রস্তুতি গাইড দেখো" : "View Results & Readiness Guide"}</span>
                <span className="arrow">→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Evaluation Result Dropdown */}
        {showResult && (
          <div className={`irh-result-box ${isReady ? "ready" : "need-work"}`}>
            <div className="irh-result-header">
              <span className="irh-result-icon">{isReady ? "🎉" : "💡"}</span>
              <div>
                <b className="irh-result-heading">
                  {isReady
                    ? L
                      ? "তুমি ইন্টার্নশিপের জন্য প্রস্তুত! (Skill-Ready Candidate)"
                      : "You are Skill-Ready for competitive internships!"
                    : L
                    ? "আবেদনের আগে আরেকটু প্রস্তুতি প্রয়োজন"
                    : "A little more preparation is recommended before applying"}
                </b>
                <p className="irh-result-sub">
                  {isReady
                    ? L
                      ? "তোমার বেসিক টুলস ও প্রজেক্ট পোর্টফোলিও ঠিক আছে। নিচের ৫টি ক্যাটাগরির যেকোনোটিতে সরাসরি আবেদন করতে পারো।"
                      : "Your foundational toolkit and project readiness are solid. Choose from the 5 categories below to apply."
                    : L
                    ? "কোম্পানিগুলো ইন্টার্নদের কাজ শেখাতে চায়, কিন্তু একদম খালি হাত কাউকে নিতে চায় না। আমাদের ফ্রি সিভি ও পোর্টফোলিও বিল্ডার দিয়ে একটি লাইভ প্রজেক্ট তৈরি করো।"
                    : "Create at least 1 polished project using our free CV & portfolio builder to dramatically boost your interview callback rate."}
                </p>
              </div>
            </div>
            {!isReady && (
              <div className="irh-result-cta-strip">
                <Link to="/cv" className="btn btn-lime sm">
                  {L ? "সিভি স্কোর বাড়িয়ে নাও →" : "Optimize your CV score →"}
                </Link>
                <Link to="/portfolio" className="btn btn-ghost sm">
                  {L ? "ফ্রি পোর্টফোলিও সাইট বানাও →" : "Build Free Portfolio Site →"}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= 5 INTERNSHIP CATEGORY CARDS ================= */}
      <div className="irh-categories-header">
        <h3 className={`irh-cat-section-title ${L ? "bn" : ""}`}>
          {L ? "ইন্টার্নশিপ ক্যাটাগরি বেছে নাও:" : "Choose your internship format:"}
        </h3>
        {activeInternCategory && (
          <button
            type="button"
            className="irh-cat-clear-btn"
            onClick={() => onSelectInternCategory(null)}
          >
            ✕ {L ? "ক্লিয়ার ফিল্টার" : "Clear filter"}
          </button>
        )}
      </div>

      <div className="irh-category-cards-grid">
        {INTERNSHIP_CATEGORIES.map((cat) => {
          const isSelected = activeInternCategory === cat.id;
          return (
            <div
              key={cat.id}
              className={`irh-cat-card ${isSelected ? "selected" : ""}`}
              style={{ "--cat-accent": cat.color }}
              onClick={() => onSelectInternCategory(isSelected ? null : cat)}
              role="button"
              tabIndex={0}
            >
              <div className="irh-cat-top">
                <span className="irh-cat-icon">{cat.icon}</span>
                <span className="irh-cat-tag">{L ? cat.tagBn : cat.tagEn}</span>
              </div>

              <h4 className={`irh-cat-name ${L ? "bn" : ""}`}>
                {L ? cat.titleBn : cat.titleEn}
              </h4>

              <div className="irh-cat-stipend-badge">
                {L ? cat.stipendBn : cat.stipendEn}
              </div>

              <p className={`irh-cat-desc ${L ? "bn" : ""}`}>
                {L ? cat.descBn : cat.descEn}
              </p>

              <div className="irh-cat-footer">
                <span className="irh-cat-action">
                  {isSelected
                    ? L
                      ? "✓ ফিল্টার সক্রিয়"
                      : "✓ Active Filter"
                    : L
                    ? "ইন্টার্নশিপ দেখো →"
                    : "View Openings →"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
