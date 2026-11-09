import React from "react";

/**
 * Clean, minimal visual illustrations for the 3 Entry Gate Cards.
 * Each uses a single centered scene with no overlapping elements.
 */
export default function CardVisual({ type }) {
  if (type === "job") {
    return (
      <div className="gc-scene" aria-hidden="true">
        {/* Clean Briefcase Scene */}
        <svg className="gc-svg" viewBox="0 0 200 140" fill="none">
          <defs>
            <linearGradient id="jb" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
            </linearGradient>
          </defs>
          {/* Glow circle behind */}
          <circle cx="100" cy="70" r="52" fill="rgba(255,255,255,0.06)" />
          {/* Briefcase handle */}
          <path d="M75 46 C75 32, 125 32, 125 46" stroke="rgba(255,255,255,0.5)" strokeWidth="4" strokeLinecap="round" fill="none" />
          {/* Briefcase body */}
          <rect x="52" y="46" width="96" height="58" rx="12" fill="url(#jb)" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
          {/* Center buckle */}
          <rect x="90" y="60" width="20" height="16" rx="4" fill="rgba(255,194,61,0.85)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          <circle cx="100" cy="68" r="2.5" fill="rgba(255,255,255,0.7)" />
          {/* Small offer letter peeking out */}
          <rect x="72" y="32" width="56" height="38" rx="5" fill="rgba(255,255,255,0.92)" className="gc-float" />
          <line x1="82" y1="42" x2="118" y2="42" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="82" y1="49" x2="108" y2="49" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
          <line x1="82" y1="55" x2="114" y2="55" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
          <text x="84" y="65" fill="#059669" fontSize="7" fontWeight="800" fontFamily="sans-serif">HIRED ✓</text>
          {/* Floating check badge */}
          <circle cx="156" cy="38" r="14" fill="rgba(16,185,129,0.9)" className="gc-pulse" />
          <text x="156" y="42" fill="#fff" fontSize="12" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">✓</text>
          {/* Salary tag */}
          <rect x="22" y="88" width="72" height="22" rx="11" fill="rgba(0,0,0,0.4)" className="gc-float-alt" />
          <text x="58" y="103" fill="#FFC23D" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">৳ 35–60K/mo</text>
        </svg>
      </div>
    );
  }

  if (type === "internship") {
    return (
      <div className="gc-scene" aria-hidden="true">
        {/* Clean Graduation Cap + Badge */}
        <svg className="gc-svg" viewBox="0 0 200 140" fill="none">
          <defs>
            <linearGradient id="capg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(56,189,248,0.8)" />
              <stop offset="100%" stopColor="rgba(99,102,241,0.8)" />
            </linearGradient>
          </defs>
          {/* Glow */}
          <circle cx="100" cy="65" r="50" fill="rgba(56,189,248,0.08)" />
          {/* Mortarboard */}
          <polygon points="100,18 160,42 100,66 40,42" fill="url(#capg)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" className="gc-float" />
          {/* Cap base */}
          <path d="M62 52 C62 72, 138 72, 138 52" fill="rgba(3,105,161,0.7)" stroke="rgba(56,189,248,0.6)" strokeWidth="1.5" />
          {/* Tassel */}
          <circle cx="100" cy="42" r="3.5" fill="#FBBF24" />
          <path d="M100 42 Q132 48, 146 68" stroke="#FBBF24" strokeWidth="2" fill="none" strokeLinecap="round" />
          <rect x="143" y="68" width="6" height="12" rx="2.5" fill="#F59E0B" />
          {/* Intern badge card */}
          <rect x="52" y="80" width="96" height="44" rx="8" fill="rgba(255,255,255,0.92)" className="gc-float-alt" />
          <circle cx="73" cy="100" r="10" fill="rgba(56,189,248,0.2)" />
          <text x="73" y="104" fill="#0284C7" fontSize="11" textAnchor="middle" fontFamily="sans-serif">🎓</text>
          <text x="90" y="96" fill="#0F172A" fontSize="7.5" fontWeight="800" fontFamily="sans-serif">INTERN PASS</text>
          <text x="90" y="106" fill="#475569" fontSize="6" fontWeight="600" fontFamily="sans-serif">First Real Experience</text>
          {/* Skill pills */}
          <rect x="90" y="111" width="24" height="10" rx="5" fill="#E0F2FE" />
          <text x="102" y="118" fill="#0284C7" fontSize="6" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">React</text>
          <rect x="117" y="111" width="26" height="10" rx="5" fill="#F1F5F9" />
          <text x="130" y="118" fill="#475569" fontSize="6" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">Python</text>
          {/* Mentorship badge */}
          <rect x="132" y="26" width="52" height="20" rx="10" fill="rgba(0,0,0,0.45)" className="gc-pulse" />
          <text x="158" y="39" fill="#38BDF8" fontSize="7.5" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">1:1 Mentor</text>
        </svg>
      </div>
    );
  }

  // Startup
  return (
    <div className="gc-scene" aria-hidden="true">
      {/* Rocket + Growth Scene */}
      <svg className="gc-svg" viewBox="0 0 200 140" fill="none">
        <defs>
          <linearGradient id="rkt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(254,240,138,0.9)" />
            <stop offset="100%" stopColor="rgba(249,115,22,0.9)" />
          </linearGradient>
          <linearGradient id="flm" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="60%" stopColor="#F97316" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        {/* Glow */}
        <circle cx="85" cy="65" r="48" fill="rgba(251,191,36,0.1)" />
        {/* Rocket body */}
        <ellipse cx="85" cy="52" rx="16" ry="28" fill="url(#rkt)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" className="gc-rocket" />
        {/* Nose cone */}
        <path d="M69 38 L85 12 L101 38" fill="rgba(239,68,68,0.85)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        {/* Window */}
        <circle cx="85" cy="46" r="6" fill="rgba(255,255,255,0.85)" />
        <circle cx="85" cy="46" r="4" fill="rgba(56,189,248,0.6)" />
        {/* Fins */}
        <path d="M69 64 L56 80 L69 74 Z" fill="rgba(239,68,68,0.7)" />
        <path d="M101 64 L114 80 L101 74 Z" fill="rgba(239,68,68,0.7)" />
        {/* Flame */}
        <path d="M74 78 Q85 115 96 78" fill="url(#flm)" className="gc-flame" />
        {/* Growth chart card */}
        <rect x="118" y="46" width="68" height="44" rx="8" fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" className="gc-float-alt" />
        <text x="126" y="59" fill="#94A3B8" fontSize="6" fontWeight="700" fontFamily="sans-serif">GROWTH</text>
        <text x="168" y="59" fill="#4ADE80" fontSize="6.5" fontWeight="800" textAnchor="end" fontFamily="sans-serif">+248%</text>
        <path d="M126 68 Q142 72, 150 64 T176 52" stroke="#4ADE80" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="176" cy="52" r="3" fill="#4ADE80" stroke="#fff" strokeWidth="1.2" />
        {/* Funding pill */}
        <rect x="120" y="78" width="60" height="10" rx="5" fill="rgba(34,197,94,0.2)" />
        <text x="150" y="85.5" fill="#4ADE80" fontSize="6" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">৳ 5 Lakh Fund</text>
        {/* Sparkle dots */}
        <circle cx="42" cy="28" r="2" fill="rgba(255,255,255,0.5)" className="gc-sparkle" />
        <circle cx="140" cy="18" r="1.5" fill="rgba(255,255,255,0.4)" className="gc-sparkle" style={{animationDelay: "0.3s"}} />
        <circle cx="165" cy="35" r="2" fill="rgba(255,255,255,0.3)" className="gc-sparkle" style={{animationDelay: "0.6s"}} />
      </svg>
    </div>
  );
}
