import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Scribble, { Circled } from "../components/Scribble";
import { useLang } from "../i18n";

const PATHS = [
  {
    k: "intern",
    ic: "🎓",
    t: ["Internship", "ইন্টার্নশিপ"],
    d: ["Three months of real work.", "তিন মাসের আসল কাজ।"],
    cv: {
      role: "Frontend Developer Intern",
      org: "Nodi Labs · 3 months",
      pts: [
        "Shipped 6 React screens used by 2,000+ customers",
        "Cut page load time by 35% with lazy loading",
      ],
    },
    to: "/jobs?type=internship",
    cta: ["Find internships", "ইন্টার্নশিপ খোঁজো"],
  },
  {
    k: "site",
    ic: "🌐",
    t: ["Portfolio website", "পোর্টফোলিও ওয়েবসাইট"],
    d: ["Projects recruiters can open.", "প্রজেক্ট, যা রিক্রুটার খুলে দেখবে।"],
    cv: {
      role: "Projects — rimi.sonarhorin.com",
      org: "Live portfolio · 4 projects",
      pts: [
        "Bangla sentiment classifier, 92% accuracy",
        "Campus food ordering app, 300+ student users",
      ],
    },
    to: "/portfolio",
    cta: ["Build my website", "ওয়েবসাইট বানাও"],
  },
  {
    k: "test",
    ic: "🛡️",
    t: ["Verified test", "ভেরিফায়েড টেস্ট"],
    d: ["Proof they can check with one code.", "এক কোডে যাচাই করা যায়।"],
    cv: {
      role: "Verified Efficiency Test — CSE",
      org: "সোনারহরিণ · code SH-9F2A71",
      pts: [
        "Score 84/100 · integrity 98%",
        "Anyone can verify at sonarhorin.com/verify",
      ],
    },
    to: "/efficiency",
    cta: ["Take the test", "টেস্ট দাও"],
  },
  {
    k: "train",
    ic: "🏫",
    t: ["Training program", "ট্রেনিং প্রোগ্রাম"],
    d: ["Hands-on, with a certificate.", "হাতে-কলমে, সার্টিফিকেট সহ।"],
    cv: {
      role: "Data Analytics Bootcamp (offline)",
      org: "8 weeks · capstone project",
      pts: [
        "Built a sales dashboard for a local retailer",
        "Certificate SH-41C0D2 — verifiable",
      ],
    },
    to: "/programs",
    cta: ["See programs", "প্রোগ্রাম দেখো"],
  },
];

const COMPARISON_DATA = [
  {
    id: "fresher",
    cat: "job",
    icon: "🎯",
    k: ["Fresher-only jobs", "শুধু ফ্রেশারদের জব"],
    them: [
      "Mixed with 2–5 year experience roles; freshers get filtered out immediately.",
      "২–৫ বছরের অভিজ্ঞতার জবের ভিড়ে ফ্রেশারদের সিভি শুরুতেই হারিয়ে যায়।",
    ],
    us: [
      "Guaranteed 0–1 year experience only. 100% verified fresher-friendly.",
      "গ্যারান্টিযুক্ত শুধু ০–১ বছর — কোনো অভিজ্ঞতার ফাঁদ নেই, শুধু ফ্রেশারদের জন্য।",
    ],
    tag: ["0 Yrs Required", "০ বছর অভিজ্ঞতা"],
    badge: ["100% Fresher", "১০০% ফ্রেশার"],
  },
  {
    id: "rejection",
    cat: "job",
    icon: "📊",
    k: ["Why you're rejected", "কেন রিজেক্ট হচ্ছো"],
    them: [
      "Complete silence & ghosting after submitting application.",
      "অ্যাপ্লাই করার পর সম্পূর্ণ নিস্তব্ধতা; কেউ জানায় না কেন বাদ পড়লে।",
    ],
    us: [
      "Instant Rejection Risk % score + direct step-by-step actionable fixes.",
      "ইনস্ট্যান্ট ঝুঁকি % এনালাইসিস + সরাসরি সমাধানের উপায় ও সিভি ইমপ্রুভমেন্ট।",
    ],
    tag: ["Risk % + Fixes", "ঝুঁকি % + সমাধান"],
    badge: ["Instant Fixes", "ইনস্ট্যান্ট সমাধান"],
  },
  {
    id: "proof",
    cat: "tools",
    icon: "🏆",
    k: ["Proof without experience", "অভিজ্ঞতা ছাড়া প্রমাণ"],
    them: [
      "No way to prove your skill without having a previous job.",
      "চাকরি ছাড়া নিজেকে প্রমাণ করার কোনো পথ সাধারণ সাইটগুলো দেয় না।",
    ],
    us: [
      "Live portfolio site, verified skill tests & cryptographically verifiable certificates.",
      "ভেরিফায়েড স্কিল টেস্ট, লাইভ পোর্টফোলিও ওয়েবসাইট ও ভেরিফায়েবল সার্টিফিকেট।",
    ],
    tag: ["Skill Proof", "স্কিল প্রমাণ"],
    badge: ["Verifiable", "যাচাইযোগ্য"],
  },
  {
    id: "portal",
    cat: "tools",
    icon: "⚡",
    k: ["Company-portal apply", "কোম্পানির পোর্টালে অ্যাপ্লাই"],
    them: [
      "Endless copy-pasting into 20-page cumbersome portal forms.",
      "প্রতিটি আলাদা পোর্টালে গিয়ে ২০ পাতা ফর্ম কপি-পেস্ট করে ঘণ্টার পর ঘণ্টা অপচয়।",
    ],
    us: [
      "1-Click smart auto-apply assistant & instant verified email submissions.",
      "১-ক্লিক স্মার্ট অ্যাসিস্ট্যান্ট — কয়েক সেকেন্ডে ফর্ম রেডি ও দ্রুত আবেদন।",
    ],
    tag: ["1-Click Fast", "১-ক্লিক আবেদন"],
    badge: ["Smart Apply", "স্মার্ট আবেদন"],
  },
  {
    id: "interview",
    cat: "tools",
    icon: "🎙️",
    k: ["Interview practice", "ইন্টারভিউ প্র্যাকটিস"],
    them: [
      "Zero preparation; first time you practice is in the real interview.",
      "কোনো প্র্যাকটিস নেই, সরাসরি আসল ইন্টারভিউতে গিয়ে ভড়কে যাওয়া।",
    ],
    us: [
      "10-min realistic AI mock interviewer with instant scoring & feedback in Bangla/English.",
      "১০ মিনিটের এআই মক ইন্টারভিউ — সাথে সাথে স্কোর, ফিডব্যাক ও আত্মবিশ্বাস।",
    ],
    tag: ["10-Min AI Mock", "১০ মি. AI ইন্টারভিউ"],
    badge: ["AI Interview", "এআই ইন্টারভিউ"],
  },
  {
    id: "scam",
    cat: "safety",
    icon: "🛡️",
    k: ["Scam safety", "স্ক্যাম ও ভুয়া চাকরি থেকে সাবধান"],
    them: [
      "Anyone can post unverified listings; demand registration fees.",
      "যে কেউ যা খুশি ভুয়া পোস্ট করে ট্রেনিং বা রেজিস্ট্রেশনের নামে টাকা হাতিয়ে নেয়।",
    ],
    us: [
      "100% verified genuine recruiters. We NEVER charge any job seeker a single taka.",
      "১০০% ভেরিফাইড চাকরি — আমরা চাকরিপ্রার্থীদের কাছ থেকে কখনো ১ পয়সাও নিই না।",
    ],
    tag: ["100% Safe", "১০০% নিরাপদ"],
    badge: ["Verified", "ভেরিফাইড"],
  },
  {
    id: "cost",
    cat: "safety",
    icon: "💎",
    k: ["Cost to freshers", "খরচ ও সাবস্ক্রিপশন"],
    them: [
      "Hidden paywalls, paid boosts, premium applicant fees.",
      "নানান পেইড ফিচার, প্রিমিয়াম চার্জ ও হিডেন ফি।",
    ],
    us: [
      "100% Free forever for every student and fresher job seeker.",
      "ফ্রেশার চাকরিপ্রার্থীদের জন্য আজীবন সম্পূর্ণ ১০০% ফ্রি!",
    ],
    tag: ["Free Forever", "আজীবন ফ্রি"],
    badge: ["Free 100%", "ফ্রি"],
  },
];

const FAQ = [
  {
    q: [
      "I have zero experience. Can I apply?",
      "আমার কোনো অভিজ্ঞতা নেই — অ্যাপ্লাই করতে পারব?",
    ],
    a: [
      "Yes. Every job here is for 0–1 years.",
      "হ্যাঁ। এখানে প্রতিটা জব ০–১ বছরের জন্য।",
    ],
    acts: [["/jobs", "See jobs", "জব দেখো"]],
  },
  {
    q: [
      "Where do I get experience?",
      "অভিজ্ঞতা পাব কোথা থেকে?",
    ],
    a: [
      "Internships, projects, training — shown on your own website.",
      "ইন্টার্নশিপ, প্রজেক্ট, ট্রেনিং — সব তোমার ওয়েবসাইটে।",
    ],
    acts: [
      ["/jobs?type=internship", "Internships", "ইন্টার্নশিপ"],
      ["/portfolio", "My website", "আমার ওয়েবসাইট"],
    ],
  },
  {
    q: [
      "Do you charge freshers?",
      "সোনারহরিণ কি টাকা নেয়?",
    ],
    a: [
      "No. It's free. Anyone asking money for a job is a scammer.",
      "না, সব ফ্রি। চাকরির জন্য টাকা চাইলে সেটা স্ক্যাম।",
    ],
    acts: [["/register", "Create free account", "ফ্রি অ্যাকাউন্ট খোলো"]],
  },
  {
    q: [
      "How do company-portal jobs work?",
      "কোম্পানির পোর্টালে অ্যাপ্লাই কীভাবে হয়?",
    ],
    a: [
      "We prepare everything; you submit in a minute.",
      "আমরা সব রেডি করে দিই, তুমি এক মিনিটে সাবমিট করো।",
    ],
    acts: [["/jobs", "Try it", "ট্রাই করো"]],
  },
  {
    q: [
      "Will employers trust the certificates?",
      "সার্টিফিকেট কি কোম্পানি বিশ্বাস করবে?",
    ],
    a: [
      "Each has a code they can verify themselves.",
      "প্রতিটায় একটা কোড — কোম্পানি নিজেই যাচাই করে।",
    ],
    acts: [["/certificates#verify", "Verify one", "যাচাই করো"]],
  },
  {
    q: [
      "I have a startup idea. Funding?",
      "স্টার্টআপ আইডিয়া আছে — ফান্ড পাব?",
    ],
    a: [
      "Write the pitch, reach 45+, submit. The best pitch on stage.",
      "পিচ লেখো, ৪৫+ স্কোর করো, সাবমিট করো।",
    ],
    acts: [["/startup", "Pitch my idea", "পিচ করো"]],
  },
];

export default function Experience() {
  const [lang] = useLang();
  const L = lang === "bn" ? 1 : 0;
  const [pick, setPick] = useState(PATHS[0]);
  const [open, setOpen] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const [activeCard, setActiveCard] = useState(0);
  const tblRef = useRef(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (tblRef.current) io.observe(tblRef.current);
    return () => io.disconnect();
  }, []);

  const filteredRows =
    activeTab === "all"
      ? COMPARISON_DATA
      : COMPARISON_DATA.filter((r) => r.cat === activeTab);

  return (
    <section className={`xp ${L ? "is-bn" : ""}`} id="experience">
      <div className="wrap">
        {/* Experience Proof Section */}
        <div className="xp-head">
          <p className="eyebrow">{L ? "অভিজ্ঞতা" : "Experience"}</p>
          {L ? (
            <h2 className="h2 bn-h">
              কোম্পানি চায়{" "}
              <Circled color="#FF4D5E">
                <em>অভিজ্ঞতা</em>
              </Circled>
              ।<br />
              পাবে কোথায়?
            </h2>
          ) : (
            <h2 className="h2">
              Companies want{" "}
              <Circled color="#FF4D5E">
                <em>experience.</em>
              </Circled>
              <br />
              Where do you get it?
            </h2>
          )}
        </div>

        <div className="xp-grid">
          <div
            className="xp-opts"
            role="radiogroup"
            aria-label={L ? "অভিজ্ঞতা কীভাবে দেখাবে?" : "How will you prove it?"}
          >
            {PATHS.map((p) => (
              <button
                key={p.k}
                role="radio"
                aria-checked={pick.k === p.k}
                className={`xp-opt ${pick.k === p.k ? "on" : ""}`}
                onClick={() => setPick(p)}
              >
                <span className="ic">{p.ic}</span>
                <span className="tx">
                  <b className={L ? "bn" : ""}>{p.t[L]}</b>
                  <em>{p.d[L]}</em>
                </span>
                <span className="rd" />
              </button>
            ))}
          </div>
          <div className="xp-cv" key={pick.k}>
            <div className="cv-paper">
              <div className="cv-h">
                <span className="av" />
                <div>
                  <b>Nusrat Jahan Rimi</b>
                  <small>CSE · IUBAT · 2026</small>
                </div>
              </div>
              <p className="cv-sec">EXPERIENCE</p>
              <div className="cv-new">
                <b>{pick.cv.role}</b>
                <small>{pick.cv.org}</small>
                <ul>
                  {pick.cv.pts.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <p className="cv-sec">SKILLS</p>
              <div className="cv-chips">
                <i>Python</i>
                <i>React</i>
                <i>SQL</i>
                <i>Git</i>
              </div>
            </div>
            <Scribble
              key={lang}
              className="xp-note"
              text={L ? "এটাই তোমার অভিজ্ঞতা!" : "That's your experience!"}
              arrow="left"
            />
            <Link className="btn btn-ink" to={pick.to}>
              {pick.cta[L]} →
            </Link>
          </div>
        </div>

        {/* ========== CREATIVE "কেন সোনারহরিণ" (Why Sonarhorin) SECTION ========== */}
        <div className={`whyus why-creative-wrap ${seen ? "seen" : ""}`} ref={tblRef}>
          {/* Header */}
          <div className="why-hero-badge">
            <span className="why-star-ic">✨</span>
            <span className="why-badge-tx">
              {L ? "সাধারণ জব সাইট বনাম সোনারহরিণ" : "Traditional Job Boards vs Sonarhorin"}
            </span>
          </div>

          <h3 className="h3 why-creative-title">
            {L ? (
              <>
                কেন <span className="gold-text">সোনারহরিণ</span>? ফ্রেশারদের জন্য তৈরি নতুন পৃথিবী
              </>
            ) : (
              <>
                Why <span className="gold-text">সোনারহরিণ</span>? A world built specifically for freshers
              </>
            )}
          </h3>

          <p className="why-creative-sub">
            {L
              ? "সাধারণ জব সাইটে ফ্রেশারদের হতাশা আর নয়। এক নজরে দেখুন কেন লাখো গ্র্যাজুয়েট সোনারহরিণ বেছে নিচ্ছে:"
              : "No more rejection despair on traditional boards. See exactly how Sonarhorin protects and empowers freshers:"}
          </p>

          {/* 4 Quick Stat Highlights (White & Gold) */}
          <div className="why-stats-row">
            <div className="why-stat-box">
              <span className="w-ic">🎯</span>
              <div>
                <b>{L ? "০–১ বছর ফ্রেশার এক্সক্লুসিভ" : "0–1 Yr Fresher Only"}</b>
                <p>{L ? "কোনো ফেক এক্সপেরিয়েন্স রিকোয়ারমেন্ট নেই" : "No 2-5 yr experience traps"}</p>
              </div>
            </div>
            <div className="why-stat-box">
              <span className="w-ic">⚡</span>
              <div>
                <b>{L ? "১-ক্লিক অটো পোর্টাল অ্যাপ্লাই" : "1-Click Auto Apply"}</b>
                <p>{L ? "বারবার বড় ফর্ম কপি-পেস্টের দিন শেষ" : "No tedious repeated forms"}</p>
              </div>
            </div>
            <div className="why-stat-box">
              <span className="w-ic">🎙️</span>
              <div>
                <b>{L ? "১০ মি. রিয়েল এআই ইন্টারভিউ" : "10-Min AI Interview"}</b>
                <p>{L ? "বাস্তব মক প্র্যাকটিস ও ইনস্ট্যান্ট স্কোর" : "Bangla/English instant mock"}</p>
              </div>
            </div>
            <div className="why-stat-box">
              <span className="w-ic">🛡️</span>
              <div>
                <b>{L ? "১০০% নিরাপদ ও আজীবন ফ্রি" : "100% Free & Scam Safe"}</b>
                <p>{L ? "চাকরিপ্রার্থীর কাছ থেকে ১ টাকাও নয়" : "Zero charges from freshers"}</p>
              </div>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="why-tabs-bar">
            <button
              className={`why-tab-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              {L ? "সবগুলো (All ৭টি কারণ)" : "All 7 Reasons"}
            </button>
            <button
              className={`why-tab-btn ${activeTab === "job" ? "active" : ""}`}
              onClick={() => setActiveTab("job")}
            >
              {L ? "🎯 চাকরি ও ফ্রেশার ফোকাস" : "🎯 Jobs & Freshers"}
            </button>
            <button
              className={`why-tab-btn ${activeTab === "tools" ? "active" : ""}`}
              onClick={() => setActiveTab("tools")}
            >
              {L ? "⚡ স্কিল, টেস্ট ও এআই টুলস" : "⚡ Skills & AI Tools"}
            </button>
            <button
              className={`why-tab-btn ${activeTab === "safety" ? "active" : ""}`}
              onClick={() => setActiveTab("safety")}
            >
              {L ? "🛡️ নিরাপত্তা ও ১০০% ফ্রি" : "🛡️ Safety & Free"}
            </button>
          </div>

          {/* Interactive Dual Comparison Cards */}
          <div className="why-duel-container">
            {/* Headers */}
            <div className="duel-header-row">
              <div className="duel-head-col them-head">
                <span className="dh-badge red">❌ {L ? "সাধারণ জব সাইটের অভিজ্ঞতা" : "Traditional Job Sites"}</span>
                <span className="dh-sub">{L ? "যা ফ্রেশারদের প্রতিদিন হতাশ করে" : "The daily fresher struggle"}</span>
              </div>
              <div className="duel-head-col us-head">
                <span className="dh-badge gold">👑 {L ? "সোনারহরিণ সমাধান" : "The Sonarhorin Advantage"}</span>
                <span className="dh-sub">{L ? "ফ্রেশারদের জয় নিশ্চিত করার উপায়" : "Built exclusively for freshers"}</span>
              </div>
            </div>

            {/* Duel Rows */}
            <div className="duel-rows-list">
              {filteredRows.map((row, idx) => (
                <div
                  key={row.id}
                  className={`duel-card-item ${activeCard === idx ? "highlighted" : ""}`}
                  onMouseEnter={() => setActiveCard(idx)}
                >
                  {/* Problem Side */}
                  <div className="duel-side them-side">
                    <div className="duel-title-row">
                      <span className="duel-ic">{row.icon}</span>
                      <b className="duel-label">{row.k[L]}</b>
                    </div>
                    <p className="duel-desc them-desc">
                      <span className="cross-mark">✕</span> {row.them[L]}
                    </p>
                  </div>

                  {/* VS Indicator */}
                  <div className="duel-vs-circle" title={L ? "পার্থক্য দেখুন" : "Contrast"}>
                    <span>VS</span>
                  </div>

                  {/* Solution Side (White & Gold) */}
                  <div className="duel-side us-side">
                    <div className="duel-title-row us-title-row">
                      <span className="us-check">✓</span>
                      <b className="duel-label us-label">{row.k[L]}</b>
                      <span className="us-gold-pill">{row.badge[L]}</span>
                    </div>
                    <p className="duel-desc us-desc">{row.us[L]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Golden Guarantee Callout at Bottom */}
          <div className="why-guarantee-banner">
            <div className="wgb-left">
              <span className="wgb-emblem">🦌</span>
              <div>
                <b>{L ? "সোনারহরিণ ফ্রেশার প্রমিস" : "The Sonarhorin Fresher Promise"}</b>
                <p>
                  {L
                    ? "নো ফেক জবস · নো ২-৫ বছর এক্সপেরিয়েন্স ট্র্যাপ · নো স্ক্যাম · আজীবন ১০০% ফ্রি"
                    : "Zero fake jobs · No experience traps · 100% Free forever"}
                </p>
              </div>
            </div>
            <div className="wgb-right">
              <Link to="/jobs" className="btn btn-lime">
                {L ? "ফ্রেশার জব খুঁজুন →" : "Explore Fresher Jobs →"}
              </Link>
              <Link to="/cv" className="btn btn-outline-gold">
                {L ? "ফ্রি সিভি স্কোরিং →" : "Judge My CV →"}
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="faq">
          <div className="faq-side">
            <h3 className="h3">
              {L ? <span className="bn">প্রশ্ন আছে?</span> : "Questions?"}
              <br />
              <em>{L ? <span className="bn">উত্তর + অ্যাকশন।</span> : "Answers you can act on."}</em>
            </h3>
          </div>
          <div className="faq-list">
            {FAQ.map((f, i) => (
              <div key={f.q[0]} className={`faq-item ${open === i ? "open" : ""}`}>
                <button
                  className="faq-q"
                  aria-expanded={open === i}
                  onClick={() => setOpen(open === i ? -1 : i)}
                >
                  <span>
                    <b className={L ? "bn" : ""}>{f.q[L]}</b>
                  </span>
                  <i>{open === i ? "−" : "+"}</i>
                </button>
                <div className="faq-a">
                  <div>
                    <p className={L ? "bn" : ""}>{f.a[L]}</p>
                    <div className="faq-acts">
                      {f.acts.map(([to, en, bn]) => (
                        <Link
                          key={to}
                          className="btn btn-lime sm"
                          to={to}
                          tabIndex={open === i ? 0 : -1}
                        >
                          {L ? bn : en} →
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
