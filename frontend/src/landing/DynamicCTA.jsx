import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { confetti } from "../utils";

const HEADLINES = [
  { line1: "Your first job is closer", em: "than your CV pile." },
  { line1: "রিজেকশন ভুলে নিজের যোগ্যতায় ধরুন", em: "সোনারহরিণ।" },
  { line1: "মামা-চাচা নয়, স্কিল প্রমাণ করে", em: "সরাসরি চাকরি নিন।" },
  { line1: "চাকরি পেয়ে এবার নিশ্চিত করুন", em: "পরিবার ও প্রেমিকার ভবিষ্যৎ।" },
  { line1: "No more 2+ yrs experience traps,", em: "only fresher roles." },
];

const MAJORS_LIST = [
  { id: "CSE", label: "💻 CSE", count: 412 },
  { id: "BBA", label: "📊 BBA", count: 538 },
  { id: "EEE", label: "⚡ EEE", count: 186 },
  { id: "English", label: "📚 English", count: 149 },
  { id: "Pharmacy", label: "💊 Pharmacy", count: 97 },
  { id: "Textile", label: "🧵 Textile", count: 221 },
];

const LIVE_NOTICES = [
  { name: "তামিম", uni: "CSE · NSU", text: "Junior Dev অফার পেলেন (৳45,000/mo)", time: "২ মিনিট আগে", icon: "⚡" },
  { name: "মারিয়া", uni: "BBA · DU", text: "Management Trainee পদে নির্বাচিত", time: "৪ মিনিট আগে", icon: "🎉" },
  { name: "ফাহিম", uni: "EEE · IUBAT", text: "এআই ইন্টারভিউতে ৯৪% স্কোর করেছেন", time: "৭ মিনিট আগে", icon: "🎙️" },
  { name: "আফরিন", uni: "English · JU", text: "Content Lead হিসেবে জয়েন করলেন", time: "৯ মিনিট আগে", icon: "🚀" },
  { name: "রাকিব", uni: "Textile · BUTEX", text: "Merchandiser ট্রেইনি অফার লেটার পেলেন", time: "১২ মিনিট আগে", icon: "👔" },
];

export default function DynamicCTA() {
  const [headIdx, setHeadIdx] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState("CSE");
  const [email, setEmail] = useState("");
  const [noticeIdx, setNoticeIdx] = useState(0);
  const [vipPass, setVipPass] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const sectionRef = useRef(null);

  // Rotating headlines
  useEffect(() => {
    const t = setInterval(() => {
      setIsExiting(true);
      setTimeout(() => {
        setHeadIdx((prev) => (prev + 1) % HEADLINES.length);
        setIsExiting(false);
      }, 280);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  // Live ticker progression
  useEffect(() => {
    const t = setInterval(() => {
      setNoticeIdx((prev) => (prev + 1) % LIVE_NOTICES.length);
    }, 3200);
    return () => clearInterval(t);
  }, []);

  // Mouse move radial spotlight
  const handleMouseMove = (e) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const handleQuickDomain = (domain) => {
    const prefix = email.split("@")[0] || "candidate";
    setEmail(`${prefix}@${domain}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;

    // Trigger celebratory confetti
    const btnRect = e.currentTarget.querySelector("button").getBoundingClientRect();
    confetti(btnRect.left + btnRect.width / 2, btnRect.top);

    // Generate VIP Fresher Pass
    const code = Math.floor(1000 + Math.random() * 9000);
    setVipPass({
      code: `SH-2026-${code}`,
      email,
      major: selectedMajor,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    });
  };

  const activeCount = MAJORS_LIST.find((m) => m.id === selectedMajor)?.count || 412;
  const currentNotice = LIVE_NOTICES[noticeIdx];

  return (
    <section
      className="cta dynamic-cta"
      id="cta"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      style={{
        "--spot-x": `${mousePos.x}%`,
        "--spot-y": `${mousePos.y}%`,
      }}
    >
      {/* Background Interactive Radial Glow & Particle Layers */}
      <div className="cta-ambient-glow" />
      <div className="cta-particles">
        <span className="c-part p1">📄</span>
        <span className="c-part p2">✨</span>
        <span className="c-part p3">🦌</span>
        <span className="c-part p4">⚡</span>
        <span className="c-part p5">🎯</span>
      </div>

      <div className="wrap">
        {/* Live Social Proof Pill Ticker */}
        <div className="live-pill-ticker">
          <span className="live-dot-pulse" />
          <span className="live-tag">LIVE FEED</span>
          <div className="live-notice-content animate-slide-up" key={noticeIdx}>
            <span className="notice-icon">{currentNotice.icon}</span>
            <span className="notice-user">
              <b>{currentNotice.name}</b> ({currentNotice.uni})
            </span>
            <span className="notice-text">{currentNotice.text}</span>
            <span className="notice-time">· {currentNotice.time}</span>
          </div>
        </div>

        {/* Dynamic Rotating Headline */}
        <h2 className={`h2 cta-dyn-title ${isExiting ? "title-exit" : "title-enter"}`}>
          {HEADLINES[headIdx].line1}
          <br />
          <em>{HEADLINES[headIdx].em}</em>
        </h2>

        {/* Interactive Major Selector Chips */}
        <div className="major-chips-bar">
          <span className="chips-hint">আপনার বিভাগ সিলেক্ট করুন:</span>
          <div className="chips-flex">
            {MAJORS_LIST.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`major-chip ${selectedMajor === m.id ? "active" : ""}`}
                onClick={() => setSelectedMajor(m.id)}
              >
                <span>{m.label}</span>
                <span className="chip-count">({m.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Waitlist Form */}
        <form className="wait dynamic-wait-form" onSubmit={handleSubmit}>
          <div className="input-glow-wrapper">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@gmail.com"
              aria-label="Email"
              className="dyn-email-input"
            />
            {/* Quick autocomplete helpers */}
            {!email.includes("@") && email.length > 2 && (
              <div className="email-suggestions">
                <button type="button" onClick={() => handleQuickDomain("gmail.com")}>
                  @gmail.com
                </button>
                <button type="button" onClick={() => handleQuickDomain("yahoo.com")}>
                  @yahoo.com
                </button>
                <button type="button" onClick={() => handleQuickDomain("outlook.com")}>
                  @outlook.com
                </button>
              </div>
            )}
          </div>

          <button className="btn btn-lime dyn-submit-btn" type="submit">
            <span>সোনারহরিণ-এ জয়েন করুন</span>
            <small className="btn-subtext">({activeCount}+ {selectedMajor} ফ্রেশার জব দেখুন →)</small>
          </button>
        </form>

        <p className="cta-micro-guarantee">
          🔒 ১০০% ফ্রি · কোনো ক্রেডিট কার্ড লাগবে না · নো স্প্যাম · সরাসরি কোম্পানি যোগাযোগ
        </p>

        {/* Modal: VIP Fresher Pass on Successful Submission */}
        {vipPass && (
          <div className="vip-modal-backdrop" onClick={() => setVipPass(null)}>
            <div className="vip-card animate-pop" onClick={(e) => e.stopPropagation()}>
              <button className="vip-close" onClick={() => setVipPass(null)}>✕</button>
              <div className="vip-badge">🦌 সোনারহরিণ VIP FRESHER PASS</div>
              <h3 className="vip-title">স্বাগতম! আপনার ফার্স্ট জব জার্নি শুরু</h3>
              <p className="vip-desc">
                আপনার অগ্রাধিকার কোড তৈরি করা হয়েছে। কোম্পানি রিক্রুটাররা এই ব্যাজের ক্যান্ডিডেটদের সবার আগে রিভিউ করে।
              </p>

              <div className="vip-ticket-box">
                <div className="ticket-field">
                  <span>PASS ID:</span>
                  <b>{vipPass.code}</b>
                </div>
                <div className="ticket-field">
                  <span>REGISTERED:</span>
                  <b>{vipPass.email}</b>
                </div>
                <div className="ticket-field">
                  <span>MAJOR:</span>
                  <b>{vipPass.major} (0 Yrs Exp)</b>
                </div>
                <div className="ticket-status">
                  <span className="dot lime" />
                  PRIORITY CANDIDATE VERIFIED
                </div>
              </div>

              <div className="vip-actions">
                <Link to="/cv" className="btn btn-lime sm">
                  📄 এখনই সিভি চেক করুন →
                </Link>
                <Link to="/demo-interview" className="btn btn-ghost sm">
                  🎥 মিতুর সাথে ইন্টারভিউ দিন
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Dual Opposing Direction Animated Marquees */}
        <div className="dual-marquee-container">
          {/* Top Marquee (Moving Left) */}
          <div className="marq marq-left">
            <span>
              🦌 সোনারহরিণ · 0 Yrs Exp Required · মামা-চাচা ছাড়া চাকরি · 100% Free · Realtime AI Interview · 🦌 সোনারহরিণ · Direct Company Offer · No Rejections · 🦌 সোনারহরিণ · 0 Yrs Exp Required · মামা-চাচা ছাড়া চাকরি · 100% Free · Realtime AI Interview ·
            </span>
          </div>

          {/* Bottom Marquee (Moving Right) */}
          <div className="marq marq-right">
            <span>
              ✨ যোগ্যতা থাকলে চাকরি নিশ্চিত · প্রেমিকার মুখে হাসি · বাপের হোটেল থেকে মুক্তি · ৳35k-৳60k Starting Salary · সোনারহরিণ · ফ্রেশারদের ফার্স্ট জব · ✨ যোগ্যতা থাকলে চাকরি নিশ্চিত · প্রেমিকার মুখে হাসি · বাপের হোটেল থেকে মুক্তি · ৳35k-৳60k Starting Salary ·
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
