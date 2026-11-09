import { useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n";

export const JOB_CATEGORIES = [
  {
    id: "it",
    titleEn: "IT & Software Job",
    titleBn: "আইটি ও সফটওয়্যার জব",
    icon: "💻",
    tagEn: "High Demand · AI & Web",
    tagBn: "হাই ডিমান্ড · AI ও ওয়েব",
    salaryEn: "৳35,000 – ৳85,000+",
    salaryBn: "৳৩৫,০০০ – ৳৮৫,০০০+",
    vacanciesEn: "42+ Fresher Roles",
    vacanciesBn: "৪২+ ফ্রেশার পদ",
    major: "Computer Science & Engineering",
    query: "it developer software",
    color: "#3B82F6",
    skills: ["React / Next.js", "Python & AI", "Mobile Apps", "Cloud & DB"],
  },
  {
    id: "business",
    titleEn: "Business & Growth Job",
    titleBn: "বিজনেস ও মার্কেটিং জব",
    icon: "📈",
    tagEn: "Corporate MTO · Fast Track",
    tagBn: "কর্পোরেট MTO · ফাস্ট ট্র্যাক",
    salaryEn: "৳25,000 – ৳65,000",
    salaryBn: "৳২৫,০০০ – ৳৬৫,০০০",
    vacanciesEn: "38+ Fresher Roles",
    vacanciesBn: "৩৮+ ফ্রেশার পদ",
    major: "Business Administration (BBA)",
    query: "business marketing sales finance",
    color: "#F59E0B",
    skills: ["Management Trainee", "Digital Growth", "B2B Sales", "Financial Ops"],
  },
  {
    id: "agriculture",
    titleEn: "Agriculture & Agri-Tech",
    titleBn: "এগ্রিকালচার ও এগ্রি-টেক জব",
    icon: "🌾",
    tagEn: "Sustainable · Agri-Tech",
    tagBn: "এগ্রি-টেক ও টেকসই কৃষি",
    salaryEn: "৳22,000 – ৳52,000",
    salaryBn: "৳২২,০০০ – ৳৫২,০০০",
    vacanciesEn: "19+ Fresher Roles",
    vacanciesBn: "১৯+ ফ্রেশার পদ",
    major: "Agriculture & Agribusiness",
    query: "agriculture agritech farming",
    color: "#10B981",
    skills: ["Precision Farming", "Supply Chain", "Quality Testing", "Agri-Tech Sales"],
  },
  {
    id: "textile",
    titleEn: "Textile & Apparel Job",
    titleBn: "টেক্সটাইল ও মার্চেন্ডাইজিং জব",
    icon: "🧵",
    tagEn: "Export Sector · Global Hub",
    tagBn: "রপ্তানি খাত · গ্লোবাল হাব",
    salaryEn: "৳25,000 – ৳62,000",
    salaryBn: "৳২৫,০০০ – ৳৬২,০০০",
    vacanciesEn: "31+ Fresher Roles",
    vacanciesBn: "৩১+ ফ্রেশার পদ",
    major: "Textile Engineering",
    query: "textile garment merchandising",
    color: "#8B5CF6",
    skills: ["Woven / Knit Merchandising", "Fabric Tech", "QA & Audit", "Planning"],
  },
  {
    id: "engineering",
    titleEn: "Core Engineering Job",
    titleBn: "ইঞ্জিনিয়ারিং জব (Core)",
    icon: "⚙️",
    tagEn: "EEE · Civil · Mechanical",
    tagBn: "EEE · সিভিল · মেকানিক্যাল",
    salaryEn: "৳28,000 – ৳75,000",
    salaryBn: "৳২৮,০০০ – ৳৭৫,০০০",
    vacanciesEn: "27+ Fresher Roles",
    vacanciesBn: "২৭+ ফ্রেশার পদ",
    major: "Electrical & Electronic (EEE)",
    query: "engineering mechanical civil electrical",
    color: "#EC4899",
    skills: ["AutoCAD / SolidWorks", "Circuit & Automation", "Site Management", "Maintenance"],
  },
];

export default function JobCategoryHub({ activeCategory, onSelectCategory, onShowTutorial }) {
  const [lang] = useLang();
  const L = lang === "bn" ? 1 : 0;

  return (
    <div className="job-category-hub-wrap">
      {/* Top Banner with Tutorial Guide Trigger */}
      <div className="jch-header-row">
        <div>
          <span className="jch-kicker">
            {L ? "🎯 এক্সক্লুসিভ ক্যাটাগরি হাব · Sector Focused" : "🎯 EXCLUSIVE SECTOR HUB · 0-EXP ROLES"}
          </span>
          <h2 className={`jch-heading ${L ? "bn" : ""}`}>
            {L ? "কোন সেক্টরে ক্যারিয়ার শুরু করতে চাও?" : "Which sector do you want to launch your career in?"}
          </h2>
          <p className="jch-sub">
            {L
              ? "নির্দিষ্ট সেক্টরে ক্লিক করে সরাসরি ০-অভিজ্ঞতার ভেরিফাইড চাকরি ফিল্টার করো।"
              : "Click a sector to directly filter verified 0-experience fresher jobs."}
          </p>
        </div>
        <div className="jch-actions">
          <button
            type="button"
            className="jch-tutorial-btn"
            onClick={onShowTutorial}
            title={L ? "চাকরি পাওয়ার সহজ গাইডলাইন" : "Step-by-step job success guide"}
          >
            <span>{L ? "📚 ৩-স্টেপ ক্যারিয়ার গাইড" : "📚 3-Step Job Guide"}</span>
            <span className="sparkle-icon">✨</span>
          </button>
          {activeCategory && (
            <button
              type="button"
              className="jch-clear-btn"
              onClick={() => onSelectCategory(null)}
              title={L ? "ফিল্টার ক্লিয়ার করো" : "Clear filter"}
            >
              ✕ {L ? "ফিল্টার ক্লিয়ার" : "Clear"}
            </button>
          )}
        </div>
      </div>

      {/* 5 Distinct Sector Cards Grid */}
      <div className="jch-grid">
        {JOB_CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat.id;
          return (
            <div
              key={cat.id}
              className={`jch-card ${isSelected ? "selected" : ""}`}
              style={{ "--cat-color": cat.color }}
              onClick={() => onSelectCategory(isSelected ? null : cat)}
              role="button"
              tabIndex={0}
            >
              <div className="jch-card-header">
                <span className="jch-icon">{cat.icon}</span>
                <span className="jch-tag">{L ? cat.tagBn : cat.tagEn}</span>
              </div>

              <h3 className={`jch-title ${L ? "bn" : ""}`}>
                {L ? cat.titleBn : cat.titleEn}
              </h3>

              <div className="jch-meta-row">
                <span className="jch-salary">{L ? cat.salaryBn : cat.salaryEn}</span>
                <span className="jch-vacancies">{L ? cat.vacanciesBn : cat.vacanciesEn}</span>
              </div>

              <div className="jch-skills-list">
                {cat.skills.map((s, idx) => (
                  <span key={idx} className="jch-skill-pill">
                    {s}
                  </span>
                ))}
              </div>

              <div className="jch-card-footer">
                <span className="jch-cta-text">
                  {isSelected
                    ? L
                      ? "✓ ফিল্টার সক্রিয়"
                      : "✓ Active Filter"
                    : L
                    ? "সার্কুলার দেখো →"
                    : "View Roles →"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
