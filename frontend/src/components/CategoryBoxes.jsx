import { useLang } from "../i18n";
import "../styles/category-boxes.css";

export const SUB_CATEGORIES = {
  it: [
    { id: "any", name: ["Any type", "সব ধরনের"], query: "" },
    { id: "data_eng", name: ["Data Engineer", "ডাটা ইঞ্জিনিয়ার"], query: "data engineer analytics sql python" },
    { id: "ai_eng", name: ["AI Engineer", "এআই ইঞ্জিনিয়ার"], query: "ai engineer machine learning python" },
    { id: "swe", name: ["Software Engineer (SWE)", "সফটওয়্যার ইঞ্জিনিয়ার (SWE)"], query: "software engineer swe developer" },
    { id: "web_dev", name: ["Web Developer", "ওয়েব ডেভেলপার"], query: "web developer react node frontend backend" },
    { id: "it_sol", name: ["IT Solution & Network", "আইটি সলিউশন ও নেটওয়ার্ক"], query: "it solution support network system" },
    { id: "frontend", name: ["Frontend Developer", "ফ্রন্টএন্ড"], query: "frontend react" },
    { id: "backend", name: ["Backend Developer", "ব্যাকএন্ড"], query: "backend python django node" },
    { id: "fullstack", name: ["Full Stack", "ফুল স্ট্যাক"], query: "full stack" },
    { id: "mobile", name: ["Mobile App", "মোবাইল অ্যাপ"], query: "mobile android flutter ios" },
    { id: "qa", name: ["SQA / Testing", "SQA ও টেস্টিং"], query: "qa sqa testing" },
    { id: "uiux", name: ["UI/UX Design", "ইউআই/ইউএক্স"], query: "ui ux designer figma" },
    { id: "devops", name: ["DevOps & Cloud", "ডেভঅপস ও ক্লাউড"], query: "devops cloud aws docker" },
  ],
  business: [
    { id: "any", name: ["Any type", "সব ধরনের"], query: "" },
    { id: "mto", name: ["Management Trainee (MTO)", "ম্যানেজমেন্ট ট্রেইনি"], query: "management trainee mto" },
    { id: "marketing", name: ["Digital Marketing", "ডিজিটাল মার্কেটিং"], query: "marketing seo social media" },
    { id: "sales", name: ["Sales & BD", "সেলস ও বিডি"], query: "sales business development" },
    { id: "finance", name: ["Finance & Accounts", "ফাইন্যান্স ও একাউন্টস"], query: "finance accounts audit" },
    { id: "hr", name: ["HR & Admin", "এইচআর ও এডমিন"], query: "hr admin human resources" },
    { id: "supply", name: ["Supply Chain", "সাপ্লাই চেইন"], query: "supply chain operations" },
  ],
  agriculture: [
    { id: "any", name: ["Any type", "সব ধরনের"], query: "" },
    { id: "agritech", name: ["Agri-Tech & Smart Farming", "এগ্রি-টেক ও স্মার্ট ফার্মিং"], query: "agritech smart farming" },
    { id: "food", name: ["Food Tech & QA", "ফুড টেক ও কোয়ালিটি"], query: "food processing quality" },
    { id: "research", name: ["Agronomist & R&D", "এগ্রোনোমিস্ট ও গবেষণা"], query: "agronomist research seeds" },
    { id: "supply", name: ["Agri Supply Chain", "এগ্রি সাপ্লাই চেইন"], query: "supply chain logistics agro" },
  ],
  textile: [
    { id: "any", name: ["Any type", "সব ধরনের"], query: "" },
    { id: "merchandising", name: ["Merchandising", "মার্চেন্ডাইজিং"], query: "merchandiser woven knit" },
    { id: "qa", name: ["Quality Assurance", "কোয়ালিটি কন্ট্রোল"], query: "qa quality audit inspection" },
    { id: "fabric", name: ["Fabric & Dyeing", "ফেব্রিক ও ডাইং"], query: "fabric dyeing textile" },
    { id: "ie", name: ["Industrial Eng (IE)", "আইই ও প্ল্যানিং"], query: "industrial engineering planning" },
  ],
  engineering: [
    { id: "any", name: ["Any type", "সব ধরনের"], query: "" },
    { id: "eee", name: ["Electrical (EEE)", "ইলেকট্রিক্যাল (EEE)"], query: "electrical eee power" },
    { id: "mechanical", name: ["Mechanical", "মেকানিক্যাল"], query: "mechanical maintenance" },
    { id: "civil", name: ["Civil & Site", "সিভিল ও সাইট"], query: "civil site engineer" },
    { id: "automation", name: ["Automation & Robotics", "অটোমেশন ও রোবোটিক্স"], query: "automation robotics plc" },
  ],  driver: [
    { id: "any", name: ["Any type", "সব ধরনের"], kw: "driver" },
    { id: "car", name: ["Car / Private Driver", "প্রাইভেট কার ড্রাইভার"], kw: "car driver private" },
    { id: "ride", name: ["Ride-share Driver", "রাইড শেয়ার ড্রাইভার"], kw: "ride uber pathao" },
    { id: "truck", name: ["Truck / Covered Van", "ট্রাক / কাভার্ড ভ্যান"], kw: "truck covered van lorry" },
    { id: "bus", name: ["Bus / Office Transport", "বাস / অফিস ট্রান্সপোর্ট"], kw: "bus transport microbus" },
  ],
  chef: [
    { id: "any", name: ["Any type", "সব ধরনের"], kw: "chef cook kitchen" },
    { id: "chef", name: ["Chef / Cook", "শেফ / কুক"], kw: "chef cook" },
    { id: "commis", name: ["Commis / Kitchen Helper", "কিচেন হেল্পার"], kw: "commis kitchen helper" },
    { id: "pastry", name: ["Pastry & Bakery", "পেস্ট্রি ও বেকারি"], kw: "pastry bakery baker" },
    { id: "barista", name: ["Barista / Café", "বারিস্তা / ক্যাফে"], kw: "barista cafe coffee" },
  ],
  delivery: [
    { id: "any", name: ["Any type", "সব ধরনের"], kw: "delivery rider courier" },
    { id: "food", name: ["Food Delivery Rider", "ফুড ডেলিভারি রাইডার"], kw: "food delivery rider" },
    { id: "parcel", name: ["Parcel / Courier", "পার্সেল / কুরিয়ার"], kw: "parcel courier" },
    { id: "bike", name: ["Bike Rider", "বাইক রাইডার"], kw: "bike motorcycle rider" },
    { id: "cycle", name: ["Cycle / Walking Delivery", "সাইকেল / হেঁটে ডেলিভারি"], kw: "cycle bicycle" },
  ],
  fitness: [
    { id: "any", name: ["Any type", "সব ধরনের"], kw: "gym trainer fitness" },
    { id: "gym", name: ["Gym Trainer", "জিম ট্রেইনার"], kw: "gym trainer" },
    { id: "pt", name: ["Personal Trainer", "পার্সোনাল ট্রেইনার"], kw: "personal trainer" },
    { id: "yoga", name: ["Yoga / Zumba Instructor", "ইয়োগা / জুম্বা ইন্সট্রাক্টর"], kw: "yoga zumba aerobics" },
    { id: "coach", name: ["Sports Coach", "স্পোর্টস কোচ"], kw: "coach sports swimming football cricket" },
  ],
  legal: [
    { id: "any", name: ["Any type", "সব ধরনের"], kw: "legal law lawyer" },
    { id: "associate", name: ["Junior Lawyer / Associate", "জুনিয়র আইনজীবী"], kw: "lawyer associate advocate" },
    { id: "officer", name: ["Legal Officer", "লিগ্যাল অফিসার"], kw: "legal officer" },
    { id: "compliance", name: ["Compliance", "কমপ্লায়েন্স"], kw: "compliance regulatory" },
    { id: "paralegal", name: ["Paralegal / Legal Assistant", "প্যারালিগ্যাল"], kw: "paralegal legal assistant" },
  ],
  education: [
    { id: "any", name: ["Any type", "সব ধরনের"], kw: "teacher tutor trainer instructor" },
    { id: "teacher", name: ["School / College Teacher", "স্কুল / কলেজ শিক্ষক"], kw: "teacher lecturer" },
    { id: "tutor", name: ["Tutor / Coaching", "টিউটর / কোচিং"], kw: "tutor coaching" },
    { id: "edtech", name: ["EdTech Content", "এডটেক কনটেন্ট"], kw: "content instructor edtech" },
    { id: "trainer", name: ["Corporate Trainer", "কর্পোরেট ট্রেইনার"], kw: "trainer training facilitator" },
  ],
  ngo: [
    { id: "any", name: ["Any type", "সব ধরনের"], kw: "ngo development program project" },
    { id: "program", name: ["Program / Project Officer", "প্রোগ্রাম / প্রজেক্ট অফিসার"], kw: "program officer project officer" },
    { id: "field", name: ["Field Officer", "ফিল্ড অফিসার"], kw: "field officer community" },
    { id: "mel", name: ["M&E / Research", "এমঅ্যান্ডই / রিসার্চ"], kw: "monitoring evaluation research" },
    { id: "humanitarian", name: ["Humanitarian / Relief", "মানবিক সহায়তা"], kw: "humanitarian relief" },
  ],
  technician: [
    { id: "any", name: ["Any type", "সব ধরনের"], kw: "mechanic technician" },
    { id: "auto", name: ["Auto Mechanic", "অটো মেকানিক"], kw: "auto mechanic car bike" },
    { id: "electrician", name: ["Electrician", "ইলেকট্রিশিয়ান"], kw: "electrician wiring" },
    { id: "ac", name: ["AC & Refrigeration", "এসি ও রেফ্রিজারেশন"], kw: "ac refrigeration hvac" },
    { id: "mobile", name: ["Mobile / Electronics Repair", "মোবাইল / ইলেকট্রনিক্স রিপেয়ার"], kw: "mobile repair electronics" },
  ],
};


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
    },    {
      id: "driver", icon: "🚗", c: "#0F766E", bgSoft: "#F0FDFA", borderSoft: "rgba(15, 118, 110, 0.2)",
      name: ["Driver", "ড্রাইভার"], sub: ["Car, ride-share, truck", "কার, রাইড শেয়ার, ট্রাক"], chip: ["৳15k–30k", "৳১৫k–৩০k"],
      major: "", kw: "driver",
    },
    {
      id: "chef", icon: "👨‍🍳", c: "#EA580C", bgSoft: "#FFF7ED", borderSoft: "rgba(234, 88, 12, 0.2)",
      name: ["Chef & Kitchen", "শেফ ও কিচেন"], sub: ["Cook, bakery, café", "কুক, বেকারি, ক্যাফে"], chip: ["৳18k–45k", "৳১৮k–৪৫k"],
      major: "", kw: "chef cook kitchen",
    },
    {
      id: "delivery", icon: "🛵", c: "#DC2626", bgSoft: "#FEF2F2", borderSoft: "rgba(220, 38, 38, 0.2)",
      name: ["Delivery", "ডেলিভারি"], sub: ["Food, parcel, courier", "ফুড, পার্সেল, কুরিয়ার"], chip: ["৳12k–25k+", "৳১২k–২৫k+"],
      major: "", kw: "delivery rider courier",
    },
    {
      id: "fitness", icon: "🏋️", c: "#9333EA", bgSoft: "#FAF5FF", borderSoft: "rgba(147, 51, 234, 0.2)",
      name: ["Gym Trainer", "জিম ট্রেইনার"], sub: ["Gym, yoga, sports", "জিম, ইয়োগা, স্পোর্টস"], chip: ["৳15k–40k", "৳১৫k–৪০k"],
      major: "", kw: "gym trainer fitness",
    },
    {
      id: "legal", icon: "⚖️", c: "#1E3A8A", bgSoft: "#EFF6FF", borderSoft: "rgba(30, 58, 138, 0.2)",
      name: ["Law & Legal", "আইন ও লিগ্যাল"], sub: ["Associate, compliance", "অ্যাসোসিয়েট, কমপ্লায়েন্স"], chip: ["৳20k–50k", "৳২০k–৫০k"],
      major: "", kw: "legal law lawyer",
    },
    {
      id: "education", icon: "📚", c: "#CA8A04", bgSoft: "#FEFCE8", borderSoft: "rgba(202, 138, 4, 0.2)",
      name: ["Education & Training", "শিক্ষা ও ট্রেনিং"], sub: ["Teacher, tutor, trainer", "শিক্ষক, টিউটর, ট্রেইনার"], chip: ["৳15k–40k", "৳১৫k–৪০k"],
      major: "", kw: "teacher tutor trainer instructor",
    },
    {
      id: "ngo", icon: "🤝", c: "#16A34A", bgSoft: "#F0FDF4", borderSoft: "rgba(22, 163, 74, 0.2)",
      name: ["NGO / Development", "এনজিও / ডেভেলপমেন্ট"], sub: ["Program, field, M&E", "প্রোগ্রাম, ফিল্ড, এমঅ্যান্ডই"], chip: ["৳25k–60k", "৳২৫k–৬০k"],
      major: "", kw: "ngo development program project",
    },
    {
      id: "technician", icon: "🔧", c: "#475569", bgSoft: "#F8FAFC", borderSoft: "rgba(71, 85, 105, 0.2)",
      name: ["Mechanic / Technician", "মেকানিক / টেকনিশিয়ান"], sub: ["Auto, electric, AC", "অটো, ইলেকট্রিক, এসি"], chip: ["৳15k–35k", "৳১৫k–৩৫k"],
      major: "", kw: "mechanic technician",
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

export default function CategoryBoxes({
  kind = "job",
  active,
  activeSubCat = "any",
  onSelect,
  onSelectSubCat,
  onSwitch,
  title,
}) {
  const [lang] = useLang();
  const L = lang === "bn" ? 1 : 0;
  const items = CATEGORY_BOXES[kind] || CATEGORY_BOXES.job;

  const currentCat = items.find((c) => c.id === active);
  const subList = active ? SUB_CATEGORIES[active] : null;

  return (
    <section className="cat-boxes-section" aria-label="Job Categories">
      <div className="cat-boxes-header">
        <div className="cat-boxes-title-wrap">
          {title}
          <p className="cat-boxes-sub">
            {kind === "job"
              ? L
                ? "যেকোনো ফিল্ডে ক্লিক করে নির্দিষ্ট ০-অভিজ্ঞতার ফ্রেশার সার্কুলার ফিল্টার করুন।"
                : "Select any category to filter verified 0-experience fresher jobs."
              : L
                ? "যেকোনো ক্যাটাগরিতে ক্লিক করে ইন্টার্নশিপ সুযোগ ফিল্টার করুন।"
                : "Filter tailored student & graduate internships."}
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

      {/* COMPACT CATEGORY BOXES GRID */}
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
                "--anim-delay": `${idx * 35}ms`,
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
              {/* Ultra Compact Card Inner Layout */}
              <div className="cat-box-compact-inner">
                <div className="cat-box-icon-wrap">
                  <span className="cat-box-icon">{cat.icon}</span>
                </div>
                <div className="cat-box-info">
                  <div className="cat-box-title-row">
                    <h3 className={`cat-box-title ${L ? "bn" : ""}`}>
                      {cat.name[L]}
                    </h3>
                    <span className="cat-box-badge">{cat.chip[L]}</span>
                  </div>
                  <div className="cat-box-meta-row">
                    <span className="cat-box-desc">{cat.sub[L]}</span>
                    {isSelected && <span className="cat-box-sel-dot">✓</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
