import { useLang } from "../i18n";
import "../styles/category-boxes.css";

export const CATEGORY_BOXES = {
  job: [
    {
      id: "it",
      icon: "💻",
      c: "#2563EB",
      bgSoft: "#EFF6FF",
      borderSoft: "rgba(37, 99, 235, 0.2)",
      name: ["IT & Software", "আইটি ও সফটওয়্যার"],
      sub: ["AI, Web & Software", "এআই, ওয়েব ও সফটওয়্যার"],
      chip: ["৳35k–85k+", "৳৩৫k–৮৫k+"],
      badge: ["High Demand", "হাই ডিমান্ড"],
      vacancies: ["42+ Roles", "৪২+ পদ"],
      major: "Computer Science & Engineering",
      query: "it developer software",
    },
    {
      id: "business",
      icon: "📈",
      c: "#D97706",
      bgSoft: "#FFFBEB",
      borderSoft: "rgba(217, 119, 6, 0.2)",
      name: ["Business & Growth", "বিজনেস ও মার্কেটিং"],
      sub: ["MTO, Sales & Finance", "এমটিও, সেলস ও ফাইন্যান্স"],
      chip: ["৳25k–65k", "৳২৫k–৬৫k"],
      badge: ["Corporate MTO", "কর্পোরেট MTO"],
      vacancies: ["38+ Roles", "৩৮+ পদ"],
      major: "Business Administration (BBA)",
      query: "business marketing sales finance",
    },
    {
      id: "agriculture",
      icon: "🌾",
      c: "#059669",
      bgSoft: "#ECFDF5",
      borderSoft: "rgba(5, 150, 105, 0.2)",
      name: ["Agriculture & Biotech", "কৃষি ও এগ্রি-টেক"],
      sub: ["Agri-Tech & Farming", "এগ্রি-টেক ও টেকসই কৃষি"],
      chip: ["৳22k–52k", "৳২২k–৫২k"],
      badge: ["Agri-Tech", "এগ্রি-টেক"],
      vacancies: ["19+ Roles", "১৯+ পদ"],
      major: "Agriculture & Agribusiness",
      query: "agriculture agritech farming",
    },
    {
      id: "textile",
      icon: "🧵",
      c: "#7C3AED",
      bgSoft: "#F5F3FF",
      borderSoft: "rgba(124, 58, 237, 0.2)",
      name: ["Textile & Apparel", "টেক্সটাইল ও গার্মেন্টস"],
      sub: ["Merchandising & QA", "মার্চেন্ডাইজিং ও কোয়ালিটি"],
      chip: ["৳25k–62k", "৳২৫k–৬২k"],
      badge: ["Export Sector", "রপ্তানি খাত"],
      vacancies: ["31+ Roles", "৩১+ পদ"],
      major: "Textile Engineering",
      query: "textile garment merchandising",
    },
    {
      id: "engineering",
      icon: "⚙️",
      c: "#DB2777",
      bgSoft: "#FDF2F8",
      borderSoft: "rgba(219, 39, 119, 0.2)",
      name: ["Core Engineering", "ইঞ্জিনিয়ারিং (Core)"],
      sub: ["EEE, Mechanical, Civil", "ইইই, মেকানিক্যাল, সিভিল"],
      chip: ["৳28k–75k", "৳২৮k–৭৫k"],
      badge: ["Core Sector", "কোর ইন্ডাস্ট্রি"],
      vacancies: ["27+ Roles", "২৭+ পদ"],
      major: "Electrical & Electronic (EEE)",
      query: "engineering mechanical civil electrical",
    },
  ],
  internship: [
    {
      id: "paid",
      icon: "💵",
      c: "#059669",
      bgSoft: "#ECFDF5",
      borderSoft: "rgba(5, 150, 105, 0.2)",
      name: ["Paid Internship", "পেইড ইন্টার্নশিপ"],
      sub: ["Monthly Stipend Included", "মাসিক স্টাইপেন্ডসহ"],
      chip: ["৳10k–25k/mo", "৳১০k–২৫k / মাস"],
      badge: ["Stipend", "স্টাইপেন্ড"],
      vacancies: ["24+ Openings", "২৪+ সুযোগ"],
      query: "paid",
    },
    {
      id: "unpaid",
      icon: "📜",
      c: "#4F46E5",
      bgSoft: "#EEF2FF",
      borderSoft: "rgba(79, 70, 229, 0.2)",
      name: ["Skill & Learning", "লার্নিং ও সার্টিফিকেট"],
      sub: ["Mentorship & Live Project", "মেন্টরশিপ ও লাইভ প্রজেক্ট"],
      chip: ["Certificate", "সার্টিফিকেট"],
      badge: ["Upskilling", "স্কিল গ্রোথ"],
      vacancies: ["18+ Openings", "১৮+ সুযোগ"],
      query: "unpaid",
    },
    {
      id: "versity",
      icon: "🏫",
      c: "#D97706",
      bgSoft: "#FFFBEB",
      borderSoft: "rgba(217, 119, 6, 0.2)",
      name: ["Versity Credit", "ভার্সিটি ক্রেডিট"],
      sub: ["Semester & Thesis Credit", "সেমিস্টার ও থিসিস ক্রেডিট"],
      chip: ["Graduation", "গ্র্যাজুয়েশন"],
      badge: ["Academic", "একাডেমিক"],
      vacancies: ["15+ Openings", "১৫+ সুযোগ"],
      query: "versity",
    },
    {
      id: "corporate",
      icon: "🏢",
      c: "#2563EB",
      bgSoft: "#EFF6FF",
      borderSoft: "rgba(37, 99, 235, 0.2)",
      name: ["Corporate MNC", "কর্পোরেট এমএনসি"],
      sub: ["PPO & Full-Time Offer", "পিটিও ও ফুল-টাইম অফার"],
      chip: ["MNC + PPO", "MNC + PPO"],
      badge: ["Fast-Track", "টপ টিয়ার"],
      vacancies: ["20+ Openings", "২০+ সুযোগ"],
      query: "corporate",
    },
    {
      id: "remote",
      icon: "🌐",
      c: "#DB2777",
      bgSoft: "#FDF2F8",
      borderSoft: "rgba(219, 39, 119, 0.2)",
      name: ["Remote Internship", "রিমোট ইন্টার্নশিপ"],
      sub: ["Work From Anywhere", "বাসা থেকে কাজের সুযোগ"],
      chip: ["Work from home", "ঘরে বসে"],
      badge: ["Remote", "ফ্লেক্সিবল"],
      vacancies: ["16+ Openings", "১৬+ সুযোগ"],
      query: "remote",
    },
  ],
};

export default function CategoryBoxes({ kind = "job", active, onSelect, onSwitch, title }) {
  const [lang] = useLang();
  const L = lang === "bn" ? 1 : 0;
  const items = CATEGORY_BOXES[kind] || CATEGORY_BOXES.job;

  return (
    <section className="cat-boxes-section" aria-label="Job Categories">
      <div className="cat-boxes-header">
        <div className="cat-boxes-title-wrap">
          {title}
          <p className="cat-boxes-sub">
            {kind === "job"
              ? L
                ? "যেকোনো বক্সে ক্লিক করে সরাসরি নির্দিষ্ট বিষয়ের ০-অভিজ্ঞতার ফ্রেশার চাকরি ফিল্টার করুন।"
                : "Click any box to instantly filter verified 0-experience fresher jobs."
              : L
                ? "যেকোনো বক্সে ক্লিক করে সরাসরি ইন্টার্নশিপ সুযোগগুলো ফিল্টার করুন।"
                : "Click any box to filter tailored student & graduate internships."}
          </p>
        </div>

        <div className="cat-boxes-header-controls">
          {active && (
            <button
              type="button"
              className="cat-boxes-clear-btn"
              onClick={() => onSelect(null)}
              title={L ? "ফিল্টার মুছুন" : "Clear filter"}
            >
              <span>✕</span>
              <span>{L ? "ফিল্টার মুছুন" : "Clear Filter"}</span>
            </button>
          )}

          {onSwitch && (
            <div className="cat-boxes-switch" role="tablist">
              <button
                type="button"
                className={`cat-boxes-switch-btn ${kind === "job" ? "active" : ""}`}
                onClick={() => onSwitch("job")}
              >
                💼 {L ? "ফ্রেশার জব" : "Jobs"}
              </button>
              <button
                type="button"
                className={`cat-boxes-switch-btn ${kind === "internship" ? "active" : ""}`}
                onClick={() => onSwitch("internship")}
              >
                🎓 {L ? "ইন্টার্নশিপ" : "Internships"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="cat-boxes-grid">
        {items.map((cat, idx) => {
          const isSelected = active === cat.id;
          return (
            <div
              key={cat.id}
              className={`cat-box-card ${isSelected ? "selected" : ""}`}
              style={{
                "--cat-color": cat.c,
                "--cat-bg-soft": cat.bgSoft,
                "--cat-border-soft": cat.borderSoft,
                "--anim-delay": `${idx * 45}ms`,
              }}
              onClick={() => onSelect(cat)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(cat);
                }
              }}
            >
              {/* Top Row: Icon + Salary Pill */}
              <div className="cat-box-top">
                <div className="cat-box-icon-wrap">
                  <span className="cat-box-icon">{cat.icon}</span>
                </div>
                <div className="cat-box-chip">
                  <span className="cat-box-chip-dot" />
                  <span className="cat-box-chip-text">{cat.chip[L]}</span>
                </div>
              </div>

              {/* Main Content: Title + Subtitle */}
              <div className="cat-box-body">
                <div className="cat-box-meta-line">
                  <span className="cat-box-badge">{cat.badge[L]}</span>
                  {cat.vacancies && (
                    <span className="cat-box-vacancies">{cat.vacancies[L]}</span>
                  )}
                </div>
                <h3 className={`cat-box-title ${L ? "bn" : ""}`}>
                  {cat.name[L]}
                </h3>
                <p className="cat-box-desc">
                  {cat.sub[L]}
                </p>
              </div>

              {/* Bottom Action Footer */}
              <div className="cat-box-foot">
                <span className="cat-box-action-text">
                  {isSelected
                    ? L
                      ? "ফিল্টার অন ✓"
                      : "Active Filter ✓"
                    : L
                      ? "জব দেখুন"
                      : "Explore"}
                </span>
                <span className="cat-box-arrow" aria-hidden="true">
                  {isSelected ? "✓" : "→"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
