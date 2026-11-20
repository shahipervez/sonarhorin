import { useState } from "react";
import { useLang } from "../i18n";
import "../styles/beyond-startup.css";

const CARDS_DATA = [
  {
    id: "spark",
    num: "01",
    tagBn: "স্পার্ক ০১",
    tagEn: "SPARK 01",
    titleBn: "মাথায় আইডিয়া 💡",
    titleEn: "The Idea Spark 💡",
    descBn: "কৃষক থেকে রেস্টুরেন্ট — তরুণদের উদ্ভাবনী বিজনেস আইডিয়া।",
    descEn: "Where fresh student ideas spark into real solutions.",
    media: "/stories/startup.jpg",
  },
  {
    id: "pitch",
    num: "02",
    tagBn: "বিল্ডার ০২",
    tagEn: "PORTAL 02",
    titleBn: "পিচ বিল্ডার ৪৫+ 🚀",
    titleEn: "Pitch Studio 45+ 🚀",
    descBn: "প্রবলেম, মার্কেট সাইজ ও ১২ স্লাইডের ডেক তৈরি করে সাবমিট।",
    descEn: "Problem, market validation & 12-slide investor deck.",
    media: "/stories/business.jpg",
  },
  {
    id: "settle",
    num: "03",
    tagBn: "ফান্ডেড ০৩",
    tagEn: "FUNDED 03",
    titleBn: "Life Settle! 📱",
    titleEn: "Life Settle! 📱",
    descBn: "১০ লাখ টাকার প্রি-সিড ফান্ডিং ও শীর্ষ ভিসি মেন্টর লাভ।",
    descEn: "Pre-seed grant approval, VC mentors & co-founders matched.",
    media: "/stories/paid.jpg",
  },
];

export default function BeyondStartupHero({ onSelectCard, onStartPitch }) {
  const [lang] = useLang();
  const bn = lang === "bn";
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const prevCard = () => {
    setActiveCardIndex((prev) => (prev > 0 ? prev - 1 : CARDS_DATA.length - 1));
  };

  const nextCard = () => {
    setActiveCardIndex((prev) => (prev < CARDS_DATA.length - 1 ? prev + 1 : 0));
  };

  const activeCard = CARDS_DATA[activeCardIndex];

  return (
    <section className="by-hero">
      {/* 1. Minimal Top Strip */}
      <div className="by-top-bar">
        <div className="by-top-left">
          <a href="#spark">{bn ? "আইডিয়া তৈরি" : "Idea Spark"}</a>
          <a href="#builder">{bn ? "পিচ বিল্ডার (৪৫+)" : "Pitch Rubric"}</a>
          <a href="#funded">{bn ? "ফান্ডেড ফাউন্ডার্স" : "Funded Founders"}</a>
        </div>
        <div className="by-brand-logo">
          .SONARHORIN<span>·</span>STARTUP
        </div>
        <div className="by-top-right">
          <a href="#builder" className="by-btn-cta" onClick={onStartPitch}>
            {bn ? "পিচ শুরু করো" : "Start Pitch"} ↗
          </a>
        </div>
      </div>

      {/* 2. Centerpiece: Looped 3D Refraction Cube + Floating Typography */}
      <div className="by-center-stage">
        {/* Futuristic Technical Metadata */}
        <span className="by-meta-coord left-top">
          MNT-3019 // BDT-PRESEED
        </span>
        <span className="by-meta-coord right-top">
          {bn ? "গ্রান্ট: ৳১০,০০,০০০" : "SEED: ৳10,00,000"}
        </span>
        <span className="by-meta-coord center-bottom">
          RA 10h 44m 1s · DEC -44° 16' 39"
        </span>

        {/* Clean Radiant Centerpiece Hologram & Geometry (No heavy video) */}
        <div className="by-visual-centerpiece" aria-hidden="true">
          <div className="by-aura-glow" />
          <div className="by-hologram-grid" />
          <div className="by-hologram-rings">
            <span className="by-ring by-ring-1" />
            <span className="by-ring by-ring-2" />
            <span className="by-ring by-ring-3" />
          </div>
          <div className="by-center-emblem">
            <span className="by-emblem-deer">🦌</span>
            <span className="by-emblem-label">SONARHORIN VENTURE</span>
          </div>
        </div>

        {/* Cinematic Overlay Typography */}
        <div className="by-typo-wrap">
          <div className="by-typo-line1">
            {bn ? "মাথায়" : "The"}
          </div>
          <div className="by-typo-row">
            <div className="by-typo-sub-blurb">
              <strong>{bn ? "সোনারহরিণ স্টার্টআপ ফান্ড" : "Experience the Shift"}</strong>
              {bn
                ? "তরুণদের আইডিয়া সোনারহরিণে জমা দিলেই প্রি-সিড ফান্ড, মেন্টর এবং লাইফ সেটেল।"
                : "Where student ambition meets pre-seed capital, expert mentors, and venture scale."}
            </div>
            <div className="by-typo-line2">
              {bn ? "আইডিয়া Awaits." : "Idea Awaits."}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Dock: Interactive Preview Cards + Clean Mission Summary */}
      <div className="by-bottom-dock">
        {/* Left: Floating Preview Cards with slider */}
        <div className="by-cards-shelf">
          <div className="by-cards-row">
            {CARDS_DATA.map((card, i) => (
              <div
                key={card.id}
                className={`by-preview-card ${i === activeCardIndex ? "active" : ""}`}
                onClick={() => {
                  setActiveCardIndex(i);
                  if (onSelectCard) onSelectCard(card.id);
                }}
              >
                <div className="by-card-head">
                  <span className="by-card-title">
                    {bn ? card.titleBn : card.titleEn}
                  </span>
                  <span className="by-card-arrow">↗</span>
                </div>
                <div className="by-card-media">
                  <img src={card.media} alt={card.titleEn} />
                  <span className="by-card-tag">
                    {bn ? card.tagBn : card.tagEn}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Slider bar with Left/Right arrow controls */}
          <div className="by-slider-track">
            <div className="by-slider-bar">
              <div
                className="by-slider-fill"
                style={{
                  width: `${((activeCardIndex + 1) / CARDS_DATA.length) * 100}%`,
                }}
              />
            </div>
            <div className="by-nav-arrows">
              <button
                type="button"
                className="by-arrow-btn"
                onClick={prevCard}
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                type="button"
                className="by-arrow-btn"
                onClick={nextCard}
                aria-label="Next"
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {/* Right: Concise Statement & Clean Tag Pills */}
        <div className="by-desc-col">
          <p className="by-mission-text">
            {bn ? (
              <>
                <strong>একটি পরিষ্কার ও শক্তিশালী প্ল্যাটফর্ম</strong> — যেখানে তরুণ স্বপ্নবাজদের একটি বিজনেস আইডিয়া সরাসরি ৳১০ লাখ টাকার প্রি-সিড ফান্ডিং ও শীর্ষ ভেঞ্চার ক্যাপিটালিস্টদের সহায়তা পায়।
              </>
            ) : (
              <>
                <strong>A clean venture launchpad</strong> where bold student ideas collide with seed grants, VC mentorship, and co-founders. Turn your startup pitch into reality.
              </>
            )}
          </p>

          <div className="by-pills-row">
            <span className="by-pill">৳10L Pre-Seed</span>
            <span className="by-pill">1:1 VC Mentorship</span>
            <span className="by-pill">Co-Founders</span>
            <span className="by-pill">Monthly Pitch Day</span>
            <span className="by-pill">0% Equity Cut</span>
          </div>
        </div>
      </div>
    </section>
  );
}
