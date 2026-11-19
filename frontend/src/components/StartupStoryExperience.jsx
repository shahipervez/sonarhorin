import { useEffect, useRef, useState } from "react";
import { StoryPlayer } from "../landing/StoryAnimation";
import { STARTUP } from "../landing/story/startup";
import { useLang } from "../i18n";
import "../styles/startup-story.css";

// Synthesizer chime for "Life Settle" notification & sound effects
function playNotificationChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    // Arpeggio chord in C major (C5, E5, G5, C6)
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      gain.gain.setValueAtTime(0.01, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.3, now + i * 0.1 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.55);
    });
  } catch (e) {
    // Ignore audio context error if restricted
  }
}

export default function StartupStoryExperience() {
  const [lang] = useLang();
  const bn = lang === "bn";
  const [activeTab, setActiveTab] = useState("anime"); // "anime" | "video" | "full"
  const [step, setStep] = useState(1); // 1: Idea Spark, 2: Submit to Sonarhorin, 3: Phone alert Life Settle
  const [isPlaying, setIsPlaying] = useState(false);
  const autoPlayTimer = useRef(null);
  const videoRef = useRef(null);

  // Auto-advance scenes when playing
  useEffect(() => {
    if (isPlaying) {
      autoPlayTimer.current = setInterval(() => {
        setStep((prev) => {
          if (prev >= 3) {
            setIsPlaying(false);
            return 3;
          }
          const next = prev + 1;
          if (next === 3) playNotificationChime();
          return next;
        });
      }, 4200);
    } else {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    }
    return () => {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    };
  }, [isPlaying]);

  const handleStepSelect = (s) => {
    setIsPlaying(false);
    setStep(s);
    if (s === 3) playNotificationChime();
  };

  const nextStep = () => {
    if (step < 3) {
      const next = step + 1;
      setStep(next);
      if (next === 3) playNotificationChime();
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <section className="st-story-exp" id="story-experience">
      {/* Top Banner & Heading */}
      <div className="st-story-top">
        <span className="st-story-badge">
          ✨ {bn ? "আইডিয়া থেকে সাকসেস — অ্যানিমে স্টোরি" : "From Idea to Success — Anime Story"}
        </span>
        <h2 className="st-story-title">
          {bn ? (
            <>
              মাথায় আইডিয়া আসলে, সোনারহরিণ-এ দিলেই <em>Life Settle!</em>
            </>
          ) : (
            <>
              Got a Startup Idea? Submit on Sonarhorin & <em>Life is Settled!</em>
            </>
          )}
        </h2>
        <p className="st-story-sub">
          {bn
            ? "একজন তরুণের মাথায় আইডিয়া আসা থেকে শুরু করে সোনারহরিণে পিচ দিয়ে ফান্ডিং পাওয়ার পুরো জার্নি দেখুন।"
            : "Watch how a young founder gets an idea spark, pitches on Sonarhorin, and gets funded & life settled."}
        </p>

        {/* Story Tab Bar */}
        <div className="st-story-tabs" role="tablist">
          <button
            type="button"
            className={`st-tab-btn ${activeTab === "anime" ? "active" : ""}`}
            onClick={() => setActiveTab("anime")}
          >
            🎨 {bn ? "কার্টুন অ্যানিমে গল্প" : "Cartoon Anime Story"}
          </button>
          <button
            type="button"
            className={`st-tab-btn ${activeTab === "video" ? "active" : ""}`}
            onClick={() => setActiveTab("video")}
          >
            🎥 {bn ? "ভিডিও দেখুন" : "Watch Video"}
          </button>
          <button
            type="button"
            className={`st-tab-btn ${activeTab === "full" ? "active" : ""}`}
            onClick={() => setActiveTab("full")}
          >
            🎬 {bn ? "ফুল ফিল্ম (৪৮ সেকেন্ড)" : "Full Film (48s)"}
          </button>
        </div>
      </div>

      {/* 1. INTERACTIVE ANIME STORY TAB */}
      {activeTab === "anime" && (
        <div className="st-scene-stage">
          {/* Step Navigator Bar */}
          <div className="st-step-tracker">
            <div
              className={`st-step-item ${step === 1 ? "active" : ""}`}
              onClick={() => handleStepSelect(1)}
              role="button"
              tabIndex={0}
            >
              <span className="step-num">1</span>
              <span>{bn ? "মাথায় আইডিয়া এলো 💡" : "Idea Spark 💡"}</span>
            </div>
            <span className="st-step-line" />
            <div
              className={`st-step-item ${step === 2 ? "active" : ""}`}
              onClick={() => handleStepSelect(2)}
              role="button"
              tabIndex={0}
            >
              <span className="step-num">2</span>
              <span>{bn ? "সোনারহরিণে আইডিয়া দিলো 🚀" : "Pitch on Sonarhorin 🚀"}</span>
            </div>
            <span className="st-step-line" />
            <div
              className={`st-step-item ${step === 3 ? "active" : ""}`}
              onClick={() => handleStepSelect(3)}
              role="button"
              tabIndex={0}
            >
              <span className="step-num">3</span>
              <span>{bn ? "ফোনে নোটিফিকেশন: Life Settle! 📱" : "Life Settle Alert! 📱"}</span>
            </div>
          </div>

          {/* SVG Visualizer Canvas */}
          <div className="st-scene-canvas">
            {step === 1 && <Scene1IdeaSpark bn={bn} />}
            {step === 2 && <Scene2SubmitPitch bn={bn} />}
            {step === 3 && <Scene3PhoneLifeSettle bn={bn} />}
          </div>

          {/* Story Controls */}
          <div className="st-scene-controls">
            <div className="st-ctrl-left">
              <button
                type="button"
                className="st-ctrl-btn"
                onClick={prevStep}
                disabled={step === 1}
                style={{ opacity: step === 1 ? 0.4 : 1 }}
              >
                ◀ {bn ? "আগের দৃশ্য" : "Previous"}
              </button>
              <button
                type="button"
                className="st-ctrl-btn"
                onClick={() => {
                  if (!isPlaying && step === 3) setStep(1);
                  setIsPlaying(!isPlaying);
                }}
              >
                {isPlaying ? (bn ? "❚❚ পজ" : "❚❚ Pause") : (bn ? "▶ অটো প্লে" : "▶ Auto Play")}
              </button>
              <button
                type="button"
                className="st-ctrl-btn"
                onClick={nextStep}
                disabled={step === 3}
                style={{ opacity: step === 3 ? 0.4 : 1 }}
              >
                {bn ? "পরের দৃশ্য" : "Next"} ▶
              </button>
            </div>

            <div className="st-ctrl-right">
              <a href="#builder" className="st-ctrl-btn gold">
                🚀 {bn ? "তোমার আইডিয়া পিচ করো" : "Pitch Your Idea"} →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 2. OFFICIAL VIDEO TAB */}
      {activeTab === "video" && (
        <div className="st-scene-stage">
          <div className="st-video-box">
            <video
              ref={videoRef}
              src="/stories/startup.mp4"
              poster="/stories/startup.jpg"
              controls
              playsInline
              autoPlay
            />
          </div>
          <div className="st-scene-controls" style={{ justifyContent: "center" }}>
            <a href="#builder" className="st-ctrl-btn gold">
              🚀 {bn ? "আইডিয়া নিয়ে শুরু করো" : "Start Pitch Builder"} →
            </a>
          </div>
        </div>
      )}

      {/* 3. FULL 48-SECOND ANIMATION FILM TAB */}
      {activeTab === "full" && (
        <div className="st-scene-stage">
          <div style={{ width: "100%", maxWidth: 860 }}>
            <StoryPlayer film={STARTUP} autoplay={false} />
          </div>
        </div>
      )}
    </section>
  );
}

/* ==========================================================================
   SCENE 1: মাথায় আইডিয়া আসলো (The Eureka Moment 💡)
   Anime Boy sitting, thinking, lightbulb sparks above head!
   ========================================================================== */
function Scene1IdeaSpark({ bn }) {
  return (
    <svg viewBox="0 0 1000 562" className="st-anime-svg">
      <defs>
        <radialGradient id="sparkGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF4B8" stopOpacity="1" />
          <stop offset="40%" stopColor="#FFC23D" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FF8C3C" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="animeDesk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3d2b1f" />
          <stop offset="100%" stopColor="#241912" />
        </linearGradient>
      </defs>

      {/* Room Background */}
      <rect width="1000" height="562" fill="#131728" />
      <circle cx="500" cy="220" r="280" fill="rgba(255, 194, 61, 0.08)" />

      {/* Room Window with night stars */}
      <rect x="760" y="60" width="180" height="180" rx="8" fill="#0b0e1b" stroke="#2c3350" strokeWidth="6" />
      <circle cx="860" cy="110" r="22" fill="#FFE27A" opacity="0.9" />
      <circle cx="870" cy="106" r="20" fill="#0b0e1b" />
      <circle cx="790" cy="90" r="2" fill="#fff" opacity="0.8" />
      <circle cx="830" cy="150" r="2" fill="#fff" opacity="0.6" />
      <circle cx="910" cy="180" r="2.5" fill="#fff" opacity="0.9" />

      {/* Desk and Books */}
      <rect x="180" y="380" width="640" height="24" rx="4" fill="url(#animeDesk)" />
      <rect x="220" y="404" width="18" height="158" fill="#241912" />
      <rect x="760" y="404" width="18" height="158" fill="#241912" />

      {/* Stack of study books */}
      <rect x="240" y="356" width="110" height="24" rx="3" fill="#E5484D" />
      <rect x="246" y="332" width="100" height="24" rx="3" fill="#2D6CDF" />
      <rect x="250" y="308" width="92" height="24" rx="3" fill="#6B4EFF" />
      <text x="295" y="324" fill="#fff" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="'Hind Siliguri', sans-serif">
        {bn ? "বিজনেস স্টাডিজ" : "Textbooks"}
      </text>

      {/* ANIME CHARACTER BOY (Sitting at desk) */}
      <g transform="translate(480, 260)">
        {/* Body / Hoodie */}
        <path d="M -50 120 Q -60 50 -25 35 Q 0 30 25 35 Q 60 50 50 120 Z" fill="#3B3F8F" />
        {/* Hoodie Collar & Drawstrings */}
        <path d="M -22 40 Q 0 55 22 40" stroke="#FFE27A" strokeWidth="4" fill="none" />
        <line x1="-8" y1="48" x2="-8" y2="75" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="8" y1="48" x2="8" y2="75" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />

        {/* Arms (Resting on table thinking) */}
        <path d="M -50 70 Q -90 100 -50 120" stroke="#3B3F8F" strokeWidth="20" strokeLinecap="round" fill="none" />
        <path d="M 50 70 Q 75 95 30 115" stroke="#3B3F8F" strokeWidth="20" strokeLinecap="round" fill="none" />
        {/* Hands / Chin Touch */}
        <circle cx="28" cy="85" r="12" fill="#B07A55" />

        {/* Neck */}
        <rect x="-10" y="24" width="20" height="18" fill="#9C6444" rx="3" />

        {/* Anime Face & Head */}
        <ellipse cx="0" cy="20" rx="36" ry="40" fill="#B07A55" />
        {/* Soft Blush */}
        <ellipse cx="-20" cy="26" rx="8" ry="4" fill="#FF7D8A" opacity="0.5" />
        <ellipse cx="20" cy="26" rx="8" ry="4" fill="#FF7D8A" opacity="0.5" />

        {/* Anime Eyes (Large expressive with spark reflection) */}
        <g transform="translate(-16, 16)">
          <ellipse cx="0" cy="0" rx="9" ry="12" fill="#1b1410" />
          <ellipse cx="0" cy="3" rx="7" ry="8" fill="#7a4a2c" />
          <circle cx="-3" cy="-3" r="3.5" fill="#fff" />
          <circle cx="3" cy="5" r="1.5" fill="#fff" />
          <path d="M -10 -11 Q 0 -17 10 -12" stroke="#1b1410" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
        <g transform="translate(16, 16)">
          <ellipse cx="0" cy="0" rx="9" ry="12" fill="#1b1410" />
          <ellipse cx="0" cy="3" rx="7" ry="8" fill="#7a4a2c" />
          <circle cx="-3" cy="-3" r="3.5" fill="#fff" />
          <circle cx="3" cy="5" r="1.5" fill="#fff" />
          <path d="M -10 -12 Q 0 -17 10 -11" stroke="#1b1410" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>

        {/* Nose & Mouth (Smile of excitement) */}
        <path d="M 0 24 L 2 28" stroke="#7a4a2c" strokeWidth="2" strokeLinecap="round" />
        <path d="M -8 34 Q 0 42 8 34" stroke="#6b2230" strokeWidth="3" fill="#e7808a" strokeLinecap="round" />

        {/* Anime Spiky Hair */}
        <path
          d="M -40 10 Q -45 -35 0 -45 Q 45 -35 40 10 Q 30 -10 20 -20 Q 0 -30 -15 -18 Q -30 -15 -40 10 Z"
          fill="#1b1410"
        />
        <path d="M -36 -10 L -46 -28 L -24 -24 L -15 -42 L -2 -26 L 15 -44 L 22 -22 L 40 -30 L 32 -4 Z" fill="#1b1410" />
      </g>

      {/* THE EUREKA LIGHTBULB & SPARK! (Above head) */}
      <g transform="translate(480, 115)">
        {/* Glowing aura */}
        <circle cx="0" cy="0" r="70" fill="url(#sparkGlow)" className="spark-bulb" />

        {/* Rotating Energy Rays */}
        <g className="spark-rays">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <line
              key={i}
              x1={Math.cos((angle * Math.PI) / 180) * 36}
              y1={Math.sin((angle * Math.PI) / 180) * 36}
              x2={Math.cos((angle * Math.PI) / 180) * 58}
              y2={Math.sin((angle * Math.PI) / 180) * 58}
              stroke="#FFE27A"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* Lightbulb graphic */}
        <circle cx="0" cy="-6" r="24" fill="#FFC23D" stroke="#fff" strokeWidth="3" />
        <path d="M -12 12 L 12 12 L 8 24 L -8 24 Z" fill="#999" />
        <line x1="-8" y1="18" x2="8" y2="18" stroke="#333" strokeWidth="2" />
        <text x="0" y="2" textAnchor="middle" fontSize="22" fontWeight="900" fill="#000">
          💡
        </text>
      </g>

      {/* THOUGHT BUBBLE: THE IDEA! */}
      <g transform="translate(180, 100)" className="floating-cloud">
        {/* Cloud Circles */}
        <ellipse cx="0" cy="0" rx="140" ry="70" fill="#ffffff" filter="drop-shadow(0 6px 16px rgba(0,0,0,0.3))" />
        <circle cx="-90" cy="-20" r="45" fill="#ffffff" />
        <circle cx="90" cy="-15" r="40" fill="#ffffff" />
        <circle cx="20" cy="-45" r="50" fill="#ffffff" />

        {/* Cloud tail pointing to head */}
        <circle cx="120" cy="65" r="12" fill="#ffffff" />
        <circle cx="150" cy="90" r="7" fill="#ffffff" />

        {/* Idea Text inside cloud */}
        <text x="0" y="-22" textAnchor="middle" fontSize="16" fontWeight="800" fill="#ff8c00" fontFamily="'Hind Siliguri', sans-serif">
          ✨ {bn ? "মাথায় আইডিয়া আসলো!" : "Eureka! An Idea!"}
        </text>
        <text x="0" y="2" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1b1410" fontFamily="'Hind Siliguri', sans-serif">
          {bn ? "কৃষকের ফসল সরাসরি রেস্টুরেন্টে!" : "Farm fresh straight to restaurants!"}
        </text>
        <text x="0" y="22" textAnchor="middle" fontSize="12" fontWeight="600" fill="#6B4EFF" fontFamily="'Hind Siliguri', sans-serif">
          {bn ? "মধ্যস্বত্বভোগী ছাড়া সস্তায় খাবার 🥦" : "Direct delivery, no middlemen 🥦"}
        </text>
      </g>

      {/* DILEMMA / QUESTION CARD: "টাকা কই পাবো?" */}
      <g transform="translate(760, 270)">
        <rect x="-110" y="-45" width="220" height="90" rx="14" fill="rgba(24, 28, 48, 0.9)" stroke="#E5484D" strokeWidth="2" />
        <text x="0" y="-18" textAnchor="middle" fontSize="14" fontWeight="700" fill="#FF8080" fontFamily="'Hind Siliguri', sans-serif">
          {bn ? "কিন্তু পুঁজি ও মেন্টর কই? 😟" : "Where to get funding? 😟"}
        </text>
        <text x="0" y="4" textAnchor="middle" fontSize="12" fill="#d1d5db" fontFamily="'Hind Siliguri', sans-serif">
          {bn ? "স্টুডেন্ট মানুষ, কে বিশ্বাস করবে?" : "I am just a student, who'd invest?"}
        </text>
        <text x="0" y="26" textAnchor="middle" fontSize="11" fontWeight="700" fill="#FFE27A" fontFamily="'Hind Siliguri', sans-serif">
          {bn ? "👉 সমাধান: সোনারহরিণ!" : "👉 Solution: Sonarhorin!"}
        </text>
      </g>
    </svg>
  );
}

/* ==========================================================================
   SCENE 2: সোনারহরিণে আইডিয়া দিলো (Submit Pitch on Sonarhorin 🚀)
   Anime Boy on Sonarhorin portal, filling out pitch, score 88/100!
   ========================================================================== */
function Scene2SubmitPitch({ bn }) {
  return (
    <svg viewBox="0 0 1000 562" className="st-anime-svg">
      <defs>
        <linearGradient id="portalBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#121626" />
          <stop offset="100%" stopColor="#1e1838" />
        </linearGradient>
      </defs>

      <rect width="1000" height="562" fill="url(#portalBg)" />

      {/* Top Banner */}
      <rect x="0" y="0" width="1000" height="50" fill="#0b0d17" />
      <circle cx="40" cy="25" r="14" fill="#FFC23D" />
      <text x="40" y="30" textAnchor="middle" fontSize="14" fontWeight="900" fill="#000">🦌</text>
      <text x="70" y="31" fontSize="18" fontWeight="800" fill="#ffffff" fontFamily="'Hind Siliguri', sans-serif">
        {bn ? "সোনারহরিণ স্টার্টআপ ফান্ড পোর্টাল" : "Sonarhorin Startup Fund Portal"}
      </text>

      {/* Left Column: Anime Boy filling out form with joy */}
      <g transform="translate(200, 340)">
        {/* Desk */}
        <rect x="-160" y="100" width="320" height="20" rx="3" fill="#3d2b1f" />
        {/* Laptop */}
        <polygon points="-50,98 50,98 60,104 -60,104" fill="#666" />
        <rect x="-44" y="44" width="88" height="56" rx="4" fill="#1b1c20" stroke="#ffc23d" strokeWidth="2" />
        <text x="0" y="76" textAnchor="middle" fontSize="16">🚀</text>

        {/* Boy body */}
        <path d="M -45 140 Q -55 70 -20 55 Q 0 50 20 55 Q 55 70 45 140 Z" fill="#3B3F8F" />
        {/* Hands typing */}
        <path d="M -45 80 L -25 96" stroke="#3B3F8F" strokeWidth="16" strokeLinecap="round" />
        <path d="M 45 80 L 25 96" stroke="#3B3F8F" strokeWidth="16" strokeLinecap="round" />
        <circle cx="-25" cy="96" r="8" fill="#B07A55" />
        <circle cx="25" cy="96" r="8" fill="#B07A55" />

        {/* Boy Face smiling */}
        <ellipse cx="0" cy="40" rx="30" ry="34" fill="#B07A55" />
        <ellipse cx="-14" cy="45" rx="6" ry="3" fill="#FF7D8A" opacity="0.6" />
        <ellipse cx="14" cy="45" rx="6" ry="3" fill="#FF7D8A" opacity="0.6" />

        {/* Happy Anime Eyes */}
        <path d="M -20 38 Q -13 30 -6 38" stroke="#1b1410" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M 6 38 Q 13 30 20 38" stroke="#1b1410" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M -8 52 Q 0 62 8 52" stroke="#6b2230" strokeWidth="3" fill="#e7808a" strokeLinecap="round" />

        {/* Spiky Hair */}
        <path d="M -32 30 Q -36 -10 0 -18 Q 36 -10 32 30 Q 24 14 16 6 Q 0 -2 -12 8 Q -24 10 -32 30 Z" fill="#1b1410" />
      </g>

      {/* Speech bubble: "আইডিয়া সাবমিট করলাম!" */}
      <g transform="translate(190, 140)" className="floating-cloud">
        <rect x="-95" y="-35" width="190" height="70" rx="14" fill="#fff" filter="drop-shadow(0 4px 12px rgba(0,0,0,0.3))" />
        <polygon points="0,35 -10,35 -15,48" fill="#fff" />
        <text x="0" y="-8" textAnchor="middle" fontSize="13" fontWeight="800" fill="#2563EB" fontFamily="'Hind Siliguri', sans-serif">
          {bn ? "দোস্ত খবর পাইছি!" : "Got the news!"}
        </text>
        <text x="0" y="12" textAnchor="middle" fontSize="12" fontWeight="700" fill="#111827" fontFamily="'Hind Siliguri', sans-serif">
          {bn ? "সোনারহরিণে আইডিয়া দিচ্ছি ✍️" : "Pitching to Sonarhorin ✍️"}
        </text>
      </g>

      {/* Right Column: Interactive Sonarhorin Pitch Card */}
      <g transform="translate(630, 280)">
        {/* Main Pitch Card Container */}
        <rect x="-240" y="-190" width="480" height="390" rx="18" fill="#181d33" stroke="rgba(255, 194, 61, 0.4)" strokeWidth="2" filter="drop-shadow(0 12px 32px rgba(0,0,0,0.5))" />

        {/* Card Header */}
        <rect x="-240" y="-190" width="480" height="54" rx="18" fill="#212642" />
        <text x="-210" y="-156" fontSize="16" fontWeight="800" fill="#FFC23D" fontFamily="'Hind Siliguri', sans-serif">
          📝 {bn ? "স্টার্টআপ পিচ বিল্ডার" : "Startup Pitch Builder"}
        </text>
        <rect x="130" y="-174" width="90" height="24" rx="12" fill="rgba(16, 185, 129, 0.2)" stroke="#10B981" strokeWidth="1" />
        <text x="175" y="-158" textAnchor="middle" fontSize="11" fontWeight="700" fill="#10B981">
          ✓ READY
        </text>

        {/* Form Fields Filled */}
        <g transform="translate(-210, -100)">
          <text x="0" y="0" fontSize="12" fontWeight="600" fill="#9ca3af">Startup Name</text>
          <rect x="0" y="8" width="220" height="34" rx="8" fill="#0f1322" stroke="#374151" strokeWidth="1" />
          <text x="12" y="30" fontSize="13" fontWeight="700" fill="#fff">KrishiBondhu (কৃষকবন্ধু)</text>

          <text x="240" y="0" fontSize="12" fontWeight="600" fill="#9ca3af">Sector</text>
          <rect x="240" y="8" width="180" height="34" rx="8" fill="#0f1322" stroke="#374151" strokeWidth="1" />
          <text x="252" y="30" fontSize="13" fontWeight="700" fill="#FFE27A">AgriTech / B2B</text>
        </g>

        {/* Problem & Solution */}
        <g transform="translate(-210, -30)">
          <text x="0" y="0" fontSize="12" fontWeight="600" fill="#9ca3af">One-Line Pitch</text>
          <rect x="0" y="8" width="420" height="38" rx="8" fill="#0f1322" stroke="#374151" strokeWidth="1" />
          <text x="12" y="32" fontSize="12" fill="#e5e7eb" fontFamily="'Hind Siliguri', sans-serif">
            {bn ? "কৃষকের সবজি সরাসরি শহরের রেস্টুরেন্টে সরবরাহ — দালালমুক্ত।" : "Direct farm-to-restaurant supply chain, removing middlemen."}
          </text>
        </g>

        {/* Pitch Score Ring & Metrics */}
        <g transform="translate(-140, 95)">
          <circle cx="0" cy="0" r="44" fill="none" stroke="#2a304e" strokeWidth="10" />
          <circle
            cx="0"
            cy="0"
            r="44"
            fill="none"
            stroke="#FFC23D"
            strokeWidth="10"
            strokeDasharray="276"
            strokeDashoffset="33"
            transform="rotate(-90)"
            strokeLinecap="round"
          />
          <text x="0" y="8" textAnchor="middle" fontSize="26" fontWeight="900" fill="#fff">
            88
          </text>
          <text x="0" y="60" textAnchor="middle" fontSize="11" fontWeight="700" fill="#FFC23D">
            {bn ? "রেডিনেস স্কোর" : "Readiness Score"}
          </text>
        </g>

        {/* Checks Checklist */}
        <g transform="translate(-50, 65)">
          <text x="0" y="0" fontSize="12" fontWeight="700" fill="#10B981">✓ {bn ? "প্রবলেম ও সমাধান স্পষ্ট" : "Problem & Solution Clear"}</text>
          <text x="0" y="24" fontSize="12" fontWeight="700" fill="#10B981">✓ {bn ? "মার্কেট সাইজ ভ্যালিডেশন" : "Market Size Validated"}</text>
          <text x="0" y="48" fontSize="12" fontWeight="700" fill="#10B981">✓ {bn ? "পিচ ডেক (১২ স্লাইড) আপলোডেড" : "Pitch Deck (12 Slides) Uploaded"}</text>
        </g>

        {/* Big Glow Button: Submit Pitch */}
        <g transform="translate(0, 155)">
          <rect x="-180" y="-18" width="360" height="42" rx="21" fill="#FFC23D" filter="drop-shadow(0 4px 14px rgba(255,194,61,0.4))" />
          <text x="0" y="8" textAnchor="middle" fontSize="15" fontWeight="900" fill="#0e1017" fontFamily="'Hind Siliguri', sans-serif">
            🚀 {bn ? "পিচ সাবমিট সম্পন্ন ✓" : "Pitch Submitted Successfully ✓"}
          </text>
        </g>
      </g>
    </svg>
  );
}

/* ==========================================================================
   SCENE 3: ফোনে নোটিফিকেশন — Life Settle! 📱💰✨
   Phone alert pops up, anime boy celebrating, life settled banner!
   ========================================================================== */
function Scene3PhoneLifeSettle({ bn }) {
  return (
    <svg viewBox="0 0 1000 562" className="st-anime-svg">
      <defs>
        <radialGradient id="settleGoldAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF2B8" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#FFC23D" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FF8C3C" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1000" height="562" fill="#0b0e1b" />

      {/* Floating Confetti & Lanterns */}
      {[
        [120, 80, "#FFC23D"], [880, 100, "#10B981"], [220, 450, "#6B4EFF"], [780, 430, "#FF4081"],
        [90, 260, "#38BDF8"], [920, 290, "#F59E0B"], [300, 70, "#A78BFA"], [700, 60, "#34D399"]
      ].map(([cx, cy, c], i) => (
        <circle key={i} cx={cx} cy={cy} r="4" fill={c} opacity="0.8" />
      ))}

      {/* Golden Aura in Center */}
      <circle cx="500" cy="270" r="320" fill="url(#settleGoldAura)" />

      {/* LEFT: Celebrating Anime Boy (Jumping with Joy / Victory Pose) */}
      <g transform="translate(240, 310)">
        {/* Glow behind boy */}
        <circle cx="0" cy="0" r="140" fill="rgba(255,194,61,0.15)" />

        {/* Boy Body */}
        <path d="M -45 150 Q -55 70 -20 50 Q 0 45 20 50 Q 55 70 45 150 Z" fill="#1E2A44" />
        {/* Golden Lapel / Blazer */}
        <polygon points="-12,50 0,90 12,50" fill="#E8B634" />
        <polygon points="-6,60 0,110 6,60" fill="#E5484D" />

        {/* CHEERING RAISED ARMS! */}
        <path d="M -45 75 Q -80 30 -60 -10" stroke="#1E2A44" strokeWidth="22" strokeLinecap="round" fill="none" />
        <circle cx="-60" cy="-10" r="12" fill="#B07A55" />
        <text x="-60" y="-2" textAnchor="middle" fontSize="14">✊</text>

        <path d="M 45 75 Q 80 30 60 -10" stroke="#1E2A44" strokeWidth="22" strokeLinecap="round" fill="none" />
        <circle cx="60" cy="-10" r="12" fill="#B07A55" />
        <text x="60" y="-2" textAnchor="middle" fontSize="14">✊</text>

        {/* Cheering Head */}
        <ellipse cx="0" cy="30" rx="34" ry="38" fill="#B07A55" />
        {/* Blush */}
        <ellipse cx="-18" cy="36" rx="8" ry="4" fill="#FF7D8A" opacity="0.7" />
        <ellipse cx="18" cy="36" rx="8" ry="4" fill="#FF7D8A" opacity="0.7" />

        {/* Cheerful Anime Eyes */}
        <path d="M -22 28 Q -14 18 -6 28" stroke="#1b1410" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M 6 28 Q 14 18 22 28" stroke="#1b1410" strokeWidth="4" fill="none" strokeLinecap="round" />

        {/* Big Open Laughing Mouth */}
        <path d="M -12 42 Q 0 62 12 42 Z" fill="#6b2230" />
        <ellipse cx="0" cy="50" rx="7" ry="4" fill="#e7808a" />

        {/* Spiky Hair */}
        <path d="M -36 20 Q -42 -22 0 -30 Q 42 -22 36 20 Q 28 4 18 -6 Q 0 -14 -14 -4 Q -28 0 -36 20 Z" fill="#1b1410" />

        {/* Caption below boy */}
        <text x="0" y="190" textAnchor="middle" fontSize="16" fontWeight="900" fill="#FFC23D" fontFamily="'Hind Siliguri', sans-serif">
          {bn ? "ইয়াাহু! ফান্ড পেয়ে গেছি!" : "Yahoo! We are Funded!"}
        </text>
      </g>

      {/* RIGHT: THE SMARTPHONE NOTIFICATION (Life Settle Screen!) */}
      <g transform="translate(640, 275)" className="phone-wrapper">
        {/* Phone Body Outline */}
        <rect x="-170" y="-230" width="340" height="460" rx="36" fill="#000000" stroke="#FFC23D" strokeWidth="4" filter="drop-shadow(0 0 28px rgba(255, 194, 61, 0.5))" />
        {/* Inner Screen */}
        <rect x="-156" y="-216" width="312" height="432" rx="26" fill="#121626" />
        {/* Phone Notch */}
        <rect x="-50" y="-214" width="100" height="18" rx="9" fill="#000000" />

        {/* Screen Header */}
        <g transform="translate(0, -170)">
          <circle cx="0" cy="0" r="22" fill="#FFC23D" />
          <text x="0" y="6" textAnchor="middle" fontSize="18">🦌</text>
          <text x="0" y="32" textAnchor="middle" fontSize="14" fontWeight="800" fill="#FFC23D" fontFamily="'Hind Siliguri', sans-serif">
            {bn ? "সোনারহরিণ নোটিফিকেশন" : "Sonarhorin Notification"}
          </text>
        </g>

        {/* NOTIFICATION CARD POPUP */}
        <g transform="translate(0, -50)" className="notif-card">
          <rect x="-136" y="-60" width="272" height="120" rx="16" fill="rgba(255, 255, 255, 0.08)" stroke="#FFC23D" strokeWidth="1.5" />
          <text x="-115" y="-30" fontSize="14" fontWeight="800" fill="#10B981">
            🎉 {bn ? "অভিনন্দন পুলক!" : "Congratulations Pulok!"}
          </text>
          <text x="-115" y="-8" fontSize="12" fontWeight="700" fill="#ffffff" fontFamily="'Hind Siliguri', sans-serif">
            {bn ? "তোমার আইডিয়া ফান্ডিং পেয়েছে!" : "Your startup pitch is approved!"}
          </text>
          <text x="-115" y="14" fontSize="12" fill="#e5e7eb" fontFamily="'Hind Siliguri', sans-serif">
            {bn ? "গ্রান্ট: ৳১০,০০,০০০ অনুমোদিত 💰" : "Grant: ৳10,00,000 Approved 💰"}
          </text>
          <text x="-115" y="36" fontSize="11" fill="#9ca3af" fontFamily="'Hind Siliguri', sans-serif">
            {bn ? "১:১ ভিসি মেন্টর ও কো-ফাউন্ডার কানেক্টেড" : "1:1 VC Mentor & Co-founder Connected"}
          </text>
        </g>

        {/* THE PUNCHLINE: সোনারহরিণ-এ আইডিয়া দিলেই Life Settle! */}
        <g transform="translate(0, 110)">
          <rect x="-136" y="-35" width="272" height="70" rx="14" fill="linear-gradient(90deg, #ffc23d, #ffa63d)" filter="drop-shadow(0 4px 14px rgba(255,194,61,0.5))" />
          <text x="0" y="-8" textAnchor="middle" fontSize="13" fontWeight="800" fill="#000" fontFamily="'Hind Siliguri', sans-serif">
            {bn ? "সোনারহরিণ-এ আইডিয়া দিলেই" : "Pitch on Sonarhorin &"}
          </text>
          <text x="0" y="18" textAnchor="middle" fontSize="20" fontWeight="900" fill="#000" letterSpacing="0.5">
            🌟 LIFE SETTLE! 🌟
          </text>
        </g>
      </g>
    </svg>
  );
}
