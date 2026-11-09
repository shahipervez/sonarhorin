import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import Scribble from "../components/Scribble";
import { useLang } from "../i18n";
import { useTrack } from "../track";

const JOBS = [
  ["Junior Software Engineer", "Nodi Labs", "Apply", "৳45,000/mo", "Dhaka"],
  ["Management Trainee", "Padma Pay", "Apply", "৳40,000/mo", "Banani"],
  ["Data Analyst Trainee", "Shapla Systems", "Apply", "৳38,000/mo", "Remote"],
  ["QC Officer Trainee", "Megh Pharma", "Apply", "৳35,000/mo", "Gazipur"],
];

const INTERNS = [
  ["Frontend Developer Intern", "Nodi Labs", "Apply", "৳18,000/mo", "Dhaka"],
  ["Content Strategy Intern", "Kolom Media", "Apply", "৳15,000/mo", "Remote"],
  ["Biotech Research Intern", "Megh Pharma", "Apply", "৳20,000/mo", "Savar"],
  ["Product Design Intern", "Padma Pay", "Apply", "৳16,000/mo", "Gulshan"],
];

/* 1. Dynamic Mini Feed for Jobs & Internships */
const Feed = ({ rows, isIntern, L }) => (
  <div className="mini-feed">
    <div className="mf-status-bar">
      <div className="mf-status-left">
        <span className="mf-live-dot" />
        <span className="mf-live-text">
          {L ? (isIntern ? "৪টি নতুন ইন্টার্নশিপ আজ যুক্ত" : "৪টি ফ্রেশার জব আজ যুক্ত") : (isIntern ? "4 New Internships Today" : "4 New Fresher Roles Today")}
        </span>
      </div>
      <span className="mf-verified-tag">✓ {L ? "যাচাইকৃত" : "Verified"}</span>
    </div>
    <div className="mf-list">
      {rows.map(([t, c, ch, pay, loc], i) => (
        <div key={t} className="mf-row" style={{ "--i": i }}>
          <span className="mf-lg">{c[0]}</span>
          <div className="mf-t">
            <b>{t}</b>
            <div className="mf-meta-sub">
              <span className="mf-comp">{c}</span>
              <span className="mf-bullet">•</span>
              <span className="mf-loc">{loc}</span>
              <span className="mf-pay">{pay}</span>
            </div>
          </div>
          <span className="mf-btn">
            <i className="a">{L ? "অ্যাপ্লাই" : "Apply"}</i>
            <i className="b">{L ? "অ্যাপ্লাইড ✓" : "Applied ✓"}</i>
          </span>
        </div>
      ))}
    </div>
  </div>
);

/* 2. Dynamic ATS Resume Radar for Judge my CV */
const CvDemo = ({ L }) => (
  <div className="mini-cv-dyn">
    <div className="cv-top-bar">
      <div className="cv-radar-title">
        <span className="cv-radar-dot" />
        <span>{L ? "এআই সিভি স্ক্যানার" : "ATS Resume Radar"}</span>
      </div>
      <span className="cv-score-tag">{L ? "স্কোর: ৮৪%" : "Score: 84%"}</span>
    </div>
    <div className="cv-body-layout">
      <div className="cv-paper-preview">
        <i className="cv-scan-laser" />
        <div className="cv-line cv-line-hd" />
        <div className="cv-line cv-line-sub" />
        <div className="cv-line-group">
          <div className="cv-line" style={{ width: "90%" }} />
          <div className="cv-line" style={{ width: "75%" }} />
          <div className="cv-line" style={{ width: "84%" }} />
          <div className="cv-line" style={{ width: "62%" }} />
        </div>
        <div className="cv-kw-tags">
          <span className="kw-tag ok">React ✓</span>
          <span className="kw-tag ok">Python ✓</span>
          <span className="kw-tag tip">SQL +</span>
        </div>
      </div>
      <div className="cv-gauge-panel">
        <div className="cv-circle-meter">
          <svg viewBox="0 0 36 36" className="cv-circular-chart">
            <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path className="circle-stroke" strokeDasharray="84, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <div className="cv-meter-val">
            <b>16%</b>
            <small>{L ? "ঝুঁকি" : "Risk"}</small>
          </div>
        </div>
        <div className="cv-verdict-badge">✓ {L ? "হাই ইন্টারভিউ চান্স" : "High Call Rate"}</div>
      </div>
    </div>
    <div className="cv-bottom-hint">
      <span>💡 {L ? "রিজেকশন এড়াতে ৩টি জরুরি পরামর্শ তৈরি" : "3 critical fixes ready to beat rejection"}</span>
    </div>
  </div>
);

/* 3. Dynamic Voice AI Interviewer */
const IvDemo = ({ L }) => (
  <div className="mini-iv-dyn">
    <div className="iv-top-bar">
      <div className="iv-live-badge">
        <span className="iv-live-dot" /> {L ? "এআই ভয়েস ইন্টারভিউয়ার" : "AI VOICE MOCK"}
      </div>
      <span className="iv-time-clock">10:00 {L ? "মিনিট" : "Mins"}</span>
    </div>
    <div className="iv-interviewer-card">
      <div className="iv-avatar-wrapper">
        <span className="iv-avatar">👩‍💼</span>
        <span className="iv-pulse-ring ring-1" />
        <span className="iv-pulse-ring ring-2" />
      </div>
      <div className="iv-speech-bubble">
        <div className="iv-speaker-name">{L ? "মিতু · এআই হায়ারিং লিড" : "Mitu · AI Lead"}</div>
        <p className="iv-quote">
          {L ? "“তোমার সাম্প্রতিক কোনো জটিল প্রজেক্টের অভিজ্ঞতা বলো…”" : "“Tell me about a challenging bug you recently fixed…”"}
        </p>
      </div>
    </div>
    <div className="iv-audio-strip">
      <span className="iv-mic-status">🎙️ {L ? "কথা হচ্ছে..." : "Speaking..."}</span>
      <div className="iv-dynamic-waves">
        {[8, 14, 22, 12, 18, 24, 16, 20, 26, 15, 22, 18, 10, 14, 25, 17, 21, 11, 19, 9].map((h, i) => (
          <i key={i} style={{ "--h": `${h}px`, "--d": `${(i * 0.07).toFixed(2)}s` }} />
        ))}
      </div>
      <span className="iv-db-val">94% {L ? "স্পষ্টতা" : "Clarity"}</span>
    </div>
    <div className="iv-realtime-metrics">
      <span>{L ? "কনফিডেন্স" : "Confidence"} <b>8.9/10</b></span>
      <span>{L ? "গতি" : "Pacing"} <b>{L ? "স্বাভাবিক" : "Steady"}</b></span>
      <span>{L ? "ফিডব্যাক" : "Feedback"} <b>{L ? "তাত্ক্ষণিক" : "Instant"}</b></span>
    </div>
  </div>
);

/* 4. Dynamic MCQ Quick Test */
const QtDemo = ({ L }) => (
  <div className="mini-qt-dyn">
    <div className="qt-top-bar">
      <span className="qt-badge">{L ? "দৈনিক এমসিকিউ চ্যালেঞ্জ" : "Daily MCQ Challenge"}</span>
      <span className="qt-timer">⏱️ 00:45s</span>
    </div>
    <div className="qt-question-box">
      <span className="qt-num">Q. 02</span>
      <p className="qt-text">
        {L ? "Binary Search এর Worst-Case Time Complexity কোনটি?" : "Worst-case time complexity of Binary Search?"}
      </p>
    </div>
    <div className="qt-options-list">
      <div className="qt-opt"><span>A</span> O(n)</div>
      <div className="qt-opt qt-correct">
        <span>B</span> O(log n)
        <em className="qt-check">✓ {L ? "সঠিক +১০ পয়েন্ট" : "Correct +10pts"}</em>
      </div>
      <div className="qt-opt"><span>C</span> O(n²)</div>
    </div>
    <div className="qt-footer-award">
      <span>🏆 {L ? "স্কোর: ৯০% · “Algo Pro” ব্যাজ আনলকড" : "Score: 90% · “Algo Pro” Badge Unlocked"}</span>
    </div>
  </div>
);

/* 5. Dynamic Instant Portfolio Website */
const SiteDemo = ({ L }) => (
  <div className="mini-site-dyn">
    <div className="site-browser-bar">
      <div className="site-dots"><i /><i /><i /></div>
      <div className="site-url"><span>🔒</span> sonarhorin.com/u/rimi</div>
      <span className="site-live-pill">LIVE</span>
    </div>
    <div className="site-preview-content">
      <div className="site-hero-row">
        <div className="site-avatar">👩‍💻</div>
        <div className="site-bio">
          <b>Rimi Ahmed</b>
          <small>{L ? "জুনিয়র ফ্রন্টএন্ড ডেভেলপার" : "Junior Frontend Engineer"}</small>
          <div className="site-tags"><span>React</span><span>Tailwind</span><span>Node</span></div>
        </div>
      </div>
      <div className="site-cards-grid">
        <div className="site-mini-project">
          <b>E-Commerce UI</b>
          <small>Next.js · Cart Demo</small>
        </div>
        <div className="site-mini-project">
          <b>Task Flow</b>
          <small>React · DnD</small>
        </div>
      </div>
    </div>
    <div className="site-instant-deploy">
      <span>⚡ {L ? "১-ক্লিকে নিজের লাইভ পোর্টফোলিও তৈরি করো" : "1-Click Instant Live Portfolio Website"}</span>
    </div>
  </div>
);

/* 6. Dynamic Chat & Network / Founders' Lounge */
const ChatDemo = ({ isStartup, L }) => (
  <div className="mini-chat-dyn">
    <div className="chat-top-header">
      <span className="chat-live-pulse" />
      <span className="chat-channel-title">
        {isStartup ? (L ? "💡 ফাউন্ডারস পিচ লাউঞ্জ" : "💡 Founders' Lounge") : (L ? "💬 ক্যাম্পাস ও অ্যালুমনাই হাব" : "💬 Campus & Alumni Hub")}
      </span>
      <span className="chat-active-count">128 {L ? "অনলাইন" : "Online"}</span>
    </div>
    <div className="chat-thread">
      <div className="chat-msg left">
        <span className="chat-sender-av">{isStartup ? "F" : "R"}</span>
        <div className="chat-bubble">
          <small>{isStartup ? "Fahim (AI Builder)" : "Rakib (CSE '24)"}</small>
          <p>
            {isStartup
              ? (L ? "EdTech MVP রেডি! একজন BBA কো-ফাউন্ডার খুঁজছি 🙋" : "EdTech MVP is live! Looking for a BBA Co-Founder 🙋")
              : (L ? "Nodi Labs এ কাল ইন্টারভিউ। কী কী দেখে যাবো ভাইয়া?" : "Interview tomorrow at Nodi Labs! Any last-minute tips?")}
          </p>
        </div>
      </div>
      <div className="chat-msg right">
        <div className="chat-bubble">
          <small>{L ? "তুমি" : "You"}</small>
          <p>
            {isStartup
              ? (L ? "আমি সেলস আর পার্টনারশিপ পারি! কাল ডেমো দেখাবা? 🚀" : "I handle Sales & GTM! Want to do a demo run tomorrow? 🚀")
              : (L ? "React hooks + Redux আর DB Indexing ভালো করে দেখে যেও! 🙂" : "Revise React hooks, state management & DB indexing! Best of luck 🙂")}
          </p>
        </div>
      </div>
      <div className="chat-typing-indicator">
        <span className="typing-dots"><i /><i /><i /></span>
        <small>{isStartup ? "Fahim is typing..." : "Rakib is typing..."}</small>
      </div>
    </div>
    <div className="chat-quick-action">
      <span>💬 {L ? "সরাসরি রেফারেল ও পিচিং সুবিধা" : "Direct Referrals & Networking Lounge"}</span>
    </div>
  </div>
);

/* 7. Dynamic Official Verifiable Certificate */
const CertDemo = ({ L }) => (
  <div className="mini-cert-dyn">
    <div className="cert-top-bar">
      <span>{L ? "যাচাইকৃত সনদপত্র" : "OFFICIAL VERIFIED CREDENTIAL"}</span>
      <span className="cert-id-badge">ID: SH-9F2A71</span>
    </div>
    <div className="cert-card-inner">
      <div className="cert-crest">🎓</div>
      <div className="cert-details">
        <b>{L ? "সার্টিফিকেট অব এক্সিলেন্স" : "CERTIFICATE OF EXCELLENCE"}</b>
        <p className="cert-recipient">Tanvir Hasan</p>
        <small className="cert-track">{L ? "ফুল-স্ট্যাক সফটওয়্যার ইঞ্জিনিয়ারিং" : "Full-Stack Software Track"}</small>
      </div>
      <div className="cert-seal-box">
        <div className="cert-stamp-badge">
          <span>VERIFIED</span>
          <small>SONARHORIN</small>
        </div>
      </div>
    </div>
    <div className="cert-qr-row">
      <div className="cert-qr-mini">QR</div>
      <span>{L ? "এক ক্লিকে ভেরিফাই ও লিঙ্কডইনে শেয়ার" : "Instant 1-Click Verification & LinkedIn Share"}</span>
    </div>
  </div>
);

/* 8. Dynamic Programs & MTO Track */
const ProgDemo = ({ L }) => (
  <div className="mini-prog-dyn">
    <div className="prog-top-bar">
      <span className="prog-dot" />
      <span>{L ? "শীর্ষ ক্যারিয়ার প্রোগ্রাম ও এমটিও" : "Top Career Tracks & MTO"}</span>
      <span className="prog-counter">6 {L ? "চলমান" : "Open"}</span>
    </div>
    <div className="prog-cards-list">
      <div className="prog-item">
        <span className="prog-icon">🚀</span>
        <div className="prog-meta">
          <b>Grameenphone Accelerator</b>
          <small>{L ? "৬ মাসের ইনটেনসিভ · স্টাইপেন্ড + মেন্টরশিপ" : "6-month fellowship · Stipend + Mentorship"}</small>
        </div>
        <span className="prog-status-pill open">{L ? "উন্মুক্ত" : "Open"}</span>
      </div>
      <div className="prog-item">
        <span className="prog-icon">💼</span>
        <div className="prog-meta">
          <b>Meghna Group MTO 2026</b>
          <small>{L ? "ম্যানেজমেন্ট ট্রেইনি লিডারশিপ ট্র্যাক" : "Fast-track leadership development"}</small>
        </div>
        <span className="prog-status-pill hiring">{L ? "জরুরি" : "Urgent"}</span>
      </div>
      <div className="prog-item">
        <span className="prog-icon">🌟</span>
        <div className="prog-meta">
          <b>Bangladesh AI Fellowship</b>
          <small>{L ? "শীর্ষ ফ্রেশারদের জন্য এআই ট্রেনিং ও প্লেসমেন্ট" : "AI engineering & deployment cohort"}</small>
        </div>
        <span className="prog-status-pill apply">{L ? "অ্যাপ্লাই" : "Apply"}</span>
      </div>
    </div>
  </div>
);

/* 9. Dynamic Proctored Efficiency Test */
const EffDemo = ({ L }) => (
  <div className="mini-eff-dyn">
    <div className="eff-top-bar">
      <span className="eff-shield-icon">🛡️</span>
      <span>{L ? "প্রক্টরড স্কিল অ্যাসেসমেন্ট" : "Proctored Skill Assessment"}</span>
      <span className="eff-live-tag">AI Verified</span>
    </div>
    <div className="eff-center-metrics">
      <div className="eff-score-ring">
        <span className="eff-num">98%</span>
        <small>{L ? "ইন্টিগ্রিটি" : "Integrity"}</small>
      </div>
      <div className="eff-features">
        <div className="eff-row"><span>👁️</span> {L ? "ওয়েবক্যাম ও স্ক্রিন মনিটরড" : "Webcam & Screen Proctored"}</div>
        <div className="eff-row"><span>⚡</span> {L ? "রিয়েল কোডিং স্যান্ডবক্স" : "Live Coding Sandbox"}</div>
        <div className="eff-row"><span>🎯</span> {L ? "নকলরোধী বিশ্বস্ত স্কোর" : "Anti-Cheat Verified Score"}</div>
      </div>
    </div>
    <div className="eff-footer-badge">
      <span>{L ? "৪০+ শীর্ষ টেক কোম্পানির বিশ্বস্ত" : "Trusted by 40+ Top Tech Companies"}</span>
    </div>
  </div>
);

/* 10. Dynamic Startup Fund Pipeline */
const FundDemo = ({ L }) => (
  <div className="mini-fund-dyn">
    <div className="fund-top-bar">
      <span>⚡ {L ? "স্টার্টআপ লঞ্চপ্যাড ও সিড ফান্ড" : "Startup Launchpad & Seed Fund"}</span>
      <span className="fund-badge">৳500K Pool</span>
    </div>
    <div className="fund-pipeline">
      <div className="fund-step done">
        <span className="step-circle">✓</span>
        <small>{L ? "পিচ ডেক" : "Deck"}</small>
      </div>
      <div className="fund-connector done" />
      <div className="fund-step done">
        <span className="step-circle">✓</span>
        <small>{L ? "এআই স্কোর" : "AI Score"}</small>
      </div>
      <div className="fund-connector active" />
      <div className="fund-step active">
        <span className="step-circle">94</span>
        <small>{L ? "ইনভেস্টর" : "Investors"}</small>
      </div>
      <div className="fund-connector" />
      <div className="fund-step">
        <span className="step-circle">৳</span>
        <small>{L ? "ফান্ডিং" : "Funded"}</small>
      </div>
    </div>
    <div className="fund-result-card">
      <div className="fund-score-badge">Top 5% Pitch Score</div>
      <p>{L ? "“সরাসরি অ্যাঞ্জেল ইনভেস্টরদের সংযোগ ও সিড গ্র্যান্ট।”" : "“Direct angel investor connections & ৳500k seed grant.”"}</p>
    </div>
  </div>
);

const getTiles = (L, jobRows = JOBS, internRows = INTERNS) => ({
  jobs: { to: "/jobs", t: ["Fresher jobs", "ফ্রেশার জব"], d: ["0–1 year roles. 1-tap apply.", "০–১ বছরের জব, এক ট্যাপে অ্যাপ্লাই।"], hue: "violet", demo: <Feed rows={jobRows} isIntern={false} L={L} /> },
  interns: { to: "/jobs?type=internship", t: ["Internships", "ইন্টার্নশিপ"], d: ["Internships that take freshers.", "ফ্রেশারদের জন্য ইন্টার্নশিপ।"], hue: "sky", demo: <Feed rows={internRows} isIntern={true} L={L} /> },
  cv: { to: "/cv", t: ["Judge my CV", "সিভি চেক"], d: ["See your rejection risk.", "রিজেকশনের ঝুঁকি দেখো।"], hue: "coral", demo: <CvDemo L={L} /> },
  iv: { to: "/interview", t: ["AI interviewer", "এআই ইন্টারভিউ"], d: ["10-minute mock interview.", "১০ মিনিটের মক ইন্টারভিউ।"], hue: "pink", demo: <IvDemo L={L} /> },
  qt: { to: "/quick-test", t: ["Quick test", "কুইক টেস্ট"], d: ["10 MCQs. Earn a badge.", "১০টা এমসিকিউ, ব্যাজ জেতো।"], hue: "gold", demo: <QtDemo L={L} /> },
  site: { to: "/portfolio", t: ["Portfolio website", "পোর্টফোলিও"], d: ["Your live site in a minute.", "এক মিনিটে নিজের ওয়েবসাইট।"], hue: "sky", demo: <SiteDemo L={L} /> },
  net: { to: "/network", t: ["Network", "নেটওয়ার্ক"], d: ["Chat, referrals, tips.", "চ্যাট, রেফারেল, টিপস।"], hue: "violet", demo: <ChatDemo isStartup={false} L={L} /> },
  cert: { to: "/certificates", t: ["Certificates", "সার্টিফিকেট"], d: ["Verifiable with one code.", "এক কোডে ভেরিফাই।"], hue: "gold", demo: <CertDemo L={L} /> },
  eff: { to: "/efficiency", t: ["Efficiency test", "এফিশিয়েন্সি টেস্ট"], d: ["Proctored. Trusted.", "প্রক্টরড, বিশ্বস্ত।"], hue: "coral", demo: <EffDemo L={L} /> },
  prog: { to: "/programs", t: ["Programs", "প্রোগ্রাম"], d: ["Graduate programs & training.", "গ্র্যাজুয়েট প্রোগ্রাম ও ট্রেনিং।"], hue: "pink", demo: <ProgDemo L={L} /> },
  fund: { to: "/startup", t: ["Startup fund", "স্টার্টআপ ফান্ড"], d: ["Pitch. Score. Get funded.", "পিচ করো, স্কোর দেখো, ফান্ড পাও।"], hue: "gold", demo: <FundDemo L={L} /> },
  pitchnet: { to: "/network", t: ["Founders' room", "ফাউন্ডারস রুম"], d: ["Find a co-founder.", "কো-ফাউন্ডার খোঁজো।"], hue: "violet", demo: <ChatDemo isStartup={true} L={L} /> },
});

const ORDER = {
  job: ["jobs", "cv", "iv", "qt", "site", "net", "cert", "eff", "prog"],
  internship: ["interns", "prog", "cv", "site", "net", "qt", "iv", "cert"],
  startup: ["fund", "pitchnet", "site", "prog", "jobs"],
};

const HEAD = {
  job: [["Everything for your", "first job.", "In one place."], ["প্রথম চাকরির জন্য", "সবকিছু", "এক জায়গায়।"]],
  internship: [["Everything for your", "first internship.", "In one place."], ["প্রথম ইন্টার্নশিপের জন্য", "সবকিছু", "এক জায়গায়।"]],
  startup: [["Everything for your", "first startup.", "In one place."], ["প্রথম স্টার্টআপের জন্য", "সবকিছু", "এক জায়গায়।"]],
};

/** Our services, right after the hero — a horizontal, scroll-driven row of live boxes, chosen for your path. */
export default function Services() {
  const [track] = useTrack();
  const outer = useRef(null), row = useRef(null);
  const [n, setN] = useState(1);
  const keys = ORDER[track];
  const [lang] = useLang();
  const L = lang === "bn" ? 1 : 0;
  const [liveJobs, setLiveJobs] = useState(null);
  const [liveInterns, setLiveInterns] = useState(null);

  useEffect(() => {
    // Fetch live fresher jobs from Django API
    api("/api/jobs/?job_type=full_time")
      .then((res) => {
        if (res?.jobs?.length) {
          const rows = res.jobs.slice(0, 4).map((j) => [
            j.title,
            j.company.name,
            j.channel === "partner" ? "⚡ Easy Apply" : "Apply",
            j.salary_min ? `৳${Math.round(j.salary_min / 1000)}k/mo` : "৳35,000/mo",
            (j.location || "Dhaka").split(",")[0].trim(),
            j.apply_url || "",
          ]);
          setLiveJobs(rows);
        }
      })
      .catch(() => {});

    // Fetch live internships from Django API
    api("/api/jobs/?type=internship")
      .then((res) => {
        if (res?.jobs?.length) {
          const rows = res.jobs.slice(0, 4).map((j) => [
            j.title,
            j.company.name,
            j.channel === "partner" ? "⚡ Easy Apply" : "Apply",
            j.salary_min ? `৳${Math.round(j.salary_min / 1000)}k/mo` : "৳18,000/mo",
            (j.location || "Dhaka").split(",")[0].trim(),
            j.apply_url || "",
          ]);
          setLiveInterns(rows);
        }
      })
      .catch(() => {});
  }, []);

  const TILES = getTiles(L, liveJobs || JOBS, liveInterns || INTERNS);

  useEffect(() => {
    const el = outer.current, r = row.current;
    let raf, last = -1;
    const mq = matchMedia("(max-width: 760px)");
    const size = () => { el.style.height = mq.matches ? "auto" : `${r.scrollWidth - innerWidth + innerHeight + 120}px`; };
    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (mq.matches) { r.style.transform = ""; return; }
      const b = el.getBoundingClientRect();
      if (b.bottom < 0 || b.top > innerHeight) return;
      const p = Math.min(1, Math.max(0, -b.top / (b.height - innerHeight)));
      if (Math.abs(p - last) < 0.0005) return; last = p;
      const x = -(r.scrollWidth - innerWidth + 80) * p;
      r.style.transform = `translate3d(${x}px,0,0)`;
      el.style.setProperty("--p", p);
      const mid = innerWidth * 0.55;
      let best = 0, bd = 1e9;
      [...r.children].forEach((c, i) => {
        const cb = c.getBoundingClientRect(), d = (cb.left + cb.width / 2 - mid) / innerWidth;
        c.style.setProperty("--d", d.toFixed(3));
        if (Math.abs(d) < bd) { bd = Math.abs(d); best = i; }
      });
      setN(best + 1);
    };
    size(); addEventListener("resize", size);
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", size); };
  }, [track]);

  const onMove = (e) => {
    const t = e.target.closest(".svc");
    if (!t) return;
    const b = t.getBoundingClientRect();
    t.style.setProperty("--mx", `${e.clientX - b.left}px`);
    t.style.setProperty("--my", `${e.clientY - b.top}px`);
  };

  const H = HEAD[track][L];

  return (
    <section className={`services sv-${track}`} ref={outer} id="services">
      <div className="sv-sticky">
        <div className="sv-head">
          <p className="eyebrow light">{L ? "আমাদের সার্ভিস" : "Our services"}</p>
          <h2 className={`sv-title ${L ? "bn-t" : ""}`}>{H[0]} <em>{H[1]}</em> {H[2]}</h2>
          <div className="sv-meta">
            <Scribble key={lang} className="sv-note" text={L ? "স্ক্রল করো, বক্সগুলো সরবে →" : "Scroll — the boxes slide →"} color="#FFC23D" />
            <span className="sv-count"><b>{String(n).padStart(2, "0")}</b> / {String(keys.length).padStart(2, "0")}</span>
          </div>
        </div>
        <div className="sv-row" ref={row} onMouseMove={onMove}>
          {keys.map((k, i) => {
            const t = TILES[k];
            return (
              <Link key={k} to={t.to} className={`svc hue-${t.hue} ${i === 0 ? "first" : ""}`} style={{ "--i": i }}>
                <div className="svc-header">
                  <div className="svc-meta-left">
                    <div className="svc-num-line">
                      <span className="svc-n">{String(i + 1).padStart(2, "0")}</span>
                      <h3 className={`svc-title ${L ? "bn" : ""}`}>{t.t[L]}</h3>
                    </div>
                    <p className="svc-desc">{t.d[L]}</p>
                  </div>
                  <span className="bt-go" aria-hidden="true">↗</span>
                </div>
                <div className="bt-demo" aria-hidden="true">{t.demo}</div>
              </Link>
            );
          })}
        </div>
        <div className="sv-prog"><i /></div>
      </div>
    </section>
  );
}
