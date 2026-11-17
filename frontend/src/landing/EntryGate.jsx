import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { useLang } from "../i18n";
import { setTrack } from "../track";
import StoryCanvas from "./StoryCanvas";

const CHOICES = [
  {
    k: "job",
    code: ["01 // CAREER", "০১ // ক্যারিয়ার"],
    t: ["FIND A JOB", "জব খুঁজছি"],
    sub: ["Verified Fresher Roles", "ভেরিফাইড ফ্রেশার চাকরি"],
    d: [
      "Fresher-only verified jobs with 100% salary transparency. Direct 1-tap apply.",
      "শুধু ফ্রেশারদের ভেরিফাইড চাকরি। স্যালারি ট্রান্সপারেন্সি ও ১-ট্যাপ আবেদন।",
    ],
    specs: [
      ["৳ 35–60K/mo", "Direct Apply"],
      ["৳ ৩৫–৬০ হাজার/মাস", "১-ট্যাপ আবেদন"],
    ],
    btn: ["EXPLORE JOBS", "জব দেখো"],
  },
  {
    k: "internship",
    code: ["02 // LAUNCHPAD", "০২ // লঞ্চপ্যাড"],
    t: ["INTERNSHIP", "ইন্টার্নশিপ"],
    sub: ["First Real Experience", "বাস্তব কাজের অভিজ্ঞতা"],
    d: [
      "Paid internships, 1:1 corporate mentorship & verified certification.",
      "পেইড ইন্টার্নশিপ, কর্পোরেট মেন্টরশিপ ও ভেরিফাইড সার্টিফিকেট।",
    ],
    specs: [
      ["Paid / Remote", "1:1 Mentor"],
      ["পেইড / রিমোট", "১:১ মেন্টর"],
    ],
    btn: ["FIND INTERNSHIP", "ইন্টার্নশিপ দেখো"],
  },
  {
    k: "startup",
    code: ["03 // FOUNDER", "০৩ // ফাউন্ডার"],
    t: ["IDEA TO BUSINESS", "আইডিয়া থেকে বিজনেস"],
    sub: ["Build & Scale Ventures", "স্টার্টআপ ও ফান্ডিং"],
    d: [
      "Pitch your startup idea. Get pre-seed grants, mentorship & find co-founders.",
      "তোমার আইডিয়া পিচ করো, সীড ফান্ডিং পাও এবং কো-ফাউন্ডার টিম তৈরি করো।",
    ],
    specs: [
      ["Seed Grants", "Co-Founders"],
      ["সীড ফান্ডিং", "কো-ফাউন্ডার"],
    ],
    btn: ["BUILD BUSINESS", "স্টার্টআপ শুরু"],
  },
];

const ICONS = {
  job: (
    <svg viewBox="0 0 48 48"><rect x="6" y="15" width="36" height="25" rx="5" /><path d="M17 15v-4a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4M6 25h36M22 25v4h4v-4" /></svg>
  ),
  internship: (
    <svg viewBox="0 0 48 48"><path d="M4 18 24 9l20 9-20 9z" /><path d="M12 22v9c0 3 6 6 12 6s12-3 12-6v-9M40 20v11" /></svg>
  ),
  startup: (
    <svg viewBox="0 0 48 48"><path d="M24 5c7 6 9 15 6 25h-12c-3-10-1-19 6-25z" /><circle cx="24" cy="18" r="3.5" /><path d="M18 30l-6 6 1-9M30 30l6 6-1-9M21 36c0 4 3 7 3 7s3-3 3-7" /></svg>
  ),
};

const WORDS_EN = [
  { text: "WHAT", highlight: false },
  { text: "ARE", highlight: false },
  { text: "YOU", highlight: false },
  { text: "LOOKING", highlight: true },
  { text: "FOR?", highlight: true },
  { text: "HUH!", highlight: true, accent: true },
];

const WORDS_BN = [
  { text: "তুমি", highlight: false },
  { text: "আসলে", highlight: false },
  { text: "কী", highlight: true },
  { text: "খুঁজছো?", highlight: true },
  { text: "বলো!", highlight: true, accent: true },
];

/**
 * EX8-Inspired Dynamic Monochrome Entry Gate (100% Fully Bilingual)
 */
export default function EntryGate({ onDone }) {
  const { user, updateMe } = useAuth();
  const [picked, setPicked] = useState(null);
  const [resetCount, setResetCount] = useState(0);
  const [hover, setHover] = useState(null);
  const [lang, setLang] = useLang();
  const L = lang === "bn" ? 1 : 0;

  const words = L ? WORDS_BN : WORDS_EN;

  // Lock body scroll while in gate
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const replayStory = () => {
    setResetCount((c) => c + 1);
  };

  const choose = (k) => {
    setPicked(k);
    setTimeout(() => {
      setTrack(k);
      scrollTo(0, 0);
      if (typeof window !== "undefined") {
        window.history.pushState({ gate: false, track: k }, "", `/?track=${k}`);
      }
      if (user && user.track !== k) updateMe({ track: k }).catch(() => {});
      onDone?.(k);
    }, 380);
  };

  return (
    <div
      className={`gate ex8-dynamic-gate ${picked ? "leaving" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ex8-headline"
    >
      {/* Full-bleed Continuous Animated Story Background (No Box, Zero Padding, Continuous Loop) */}
      <div className="gate-story-backdrop" aria-hidden="true">
        <StoryCanvas active={true} loop={true} resetKey={resetCount} />
        <div className="gate-story-overlay" />
      </div>

      {/* EX8 Style Top Navigation Bar */}
      <header className="ex8-nav-bar">
        <div className="ex8-brand-col">
          <div className="ex8-brand-logo">
            <span className="ex8-logo-symbol">{L ? "সোনার" : "SONAR"}</span>
            <span className="ex8-logo-suffix">{L ? "হরিণ" : "HORIN"}</span>
          </div>
          <span className="ex8-brand-tagline">
            {L ? "প্ল্যাটফর্ম // সংস্করণ ৩.২" : "PLATFORM // v3.2.0"}
          </span>
        </div>

        <div className="ex8-nav-actions">
          <button
            type="button"
            className="ex8-btn-outline ex8-story-btn"
            onClick={replayStory}
            title={L ? "গল্পটি শুরু থেকে দেখো" : "Replay story from beginning"}
          >
            <span className="ex8-play">↻</span>
            <span>{L ? "গল্প রিস্টার্ট" : "REPLAY STORY"}</span>
          </button>

          <button
            className="lang light ex8-lang-toggle"
            onClick={() => setLang(L ? "en" : "bn")}
            aria-label={L ? "Switch to English" : "বাংলায় দেখুন"}
          >
            <span className={L ? "" : "on"}>EN</span>
            <span className={`bn ${L ? "on" : ""}`}>বাং</span>
            <i />
          </button>
        </div>
      </header>

      {/* Main Dynamic Stage */}
      <main className="ex8-content-stage peeked">
        {/* Top Meta Line */}
        <div className="ex8-meta-strip">
          <span className="ex8-meta-code">
            {L ? "[ ট্র্যাক নির্বাচন // রুট ]" : "[ TRACK_SELECTION // ROOT ]"}
          </span>
          <span className="ex8-meta-sep">•</span>
          <span className="ex8-meta-text">
            {L ? "তোমার লক্ষ্য বেছে নাও" : "CHOOSE YOUR MISSION"}
          </span>
        </div>

        {/* Dynamic Headline with Kinetic Mask Reveal */}
        <div className="ex8-headline-wrap">
          <h1 id="ex8-headline" className="ex8-headline">
            {words.map((w, idx) => (
              <span key={idx} className="ex8-word-mask">
                <span
                  className={`ex8-word ${w.highlight ? "highlight" : ""} ${
                    w.accent ? "accent" : ""
                  }`}
                  style={{ transitionDelay: `${0.05 + idx * 0.05}s` }}
                >
                  {w.text}
                </span>
                {idx < words.length - 1 && <span className="ex8-word-space">&nbsp;</span>}
              </span>
            ))}
          </h1>
        </div>

        {/* 3 MISSION CARDS (Clean floating console on top of living story background) */}
        <div className={`gx-console ${hover ? "hl-" + hover : ""}`}>
          <div className="ex8-cards-grid gx-tabs">
            {CHOICES.map((c, i) => (
              <button
                key={c.k}
                className={`ex8-compact-card gx-tab gx-${c.k} ${picked === c.k ? "chosen" : picked ? "other" : ""}`}
                style={{ "--card-order": `${0.15 + i * 0.08}s` }}
                onClick={() => !picked && choose(c.k)}
                onMouseEnter={() => setHover(c.k)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(c.k)}
                onBlur={() => setHover(null)}
              >
                <span className="gx-num" aria-hidden="true">0{i + 1}</span>
                <span className="gx-sweep" aria-hidden="true" />
                <div className="ex8-card-top">
                  <span className="ex8-card-code">{c.code[L]}</span>
                  <div className="ex8-action-btn">
                    <span className="ex8-action-txt">{c.btn[L]}</span>
                    <span className="ex8-action-arrow">↗</span>
                  </div>
                </div>
                <div className="ex8-card-center">
                  <span className="ex8-card-icon" aria-hidden="true">{ICONS[c.k]}</span>
                  <div className="gx-title-col">
                    <h2 className={`ex8-card-big-title ${L ? "bn" : ""}`}>{c.t[L]}</h2>
                    <span className="gx-sub">{c.sub[L]}</span>
                  </div>
                </div>
                <i className="gx-plug" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Skip Link */}
        <div className="ex8-bottom-bar">
          <button className="ex8-skip-link" onClick={() => !picked && choose("job")}>
            <span>
              {L ? "শুধু দেখছি" : "Just browsing"}
            </span>
            <span className="ex8-skip-arrow">→</span>
          </button>
        </div>
      </main>
    </div>
  );
}
