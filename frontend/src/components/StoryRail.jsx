import GalaxyRail from "./GalaxyRail";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useLang } from "../i18n";

/**
 * Category "video stories". Each card is a looping story clip (public/stories/<id>.mp4) with just the
 * category name on it. Tap the card → full-screen story viewer; tap the arrow → straight to the listings.
 * To use your own footage, drop a file with the same name into public/stories/.
 */
export const STORY_SETS = {
  job: [
    { id: "it", icon: "💻", c: "#3B82F6", name: ["IT & Software", "আইটি ও সফটওয়্যার"], chip: ["৳35k–85k+", "৳৩৫k–৮৫k+"], major: "Computer Science & Engineering", query: "it developer software" },
    { id: "business", icon: "📈", c: "#F59E0B", name: ["Business", "বিজনেস"], chip: ["৳25k–65k", "৳২৫k–৬৫k"], major: "Business Administration (BBA)", query: "business marketing sales finance" },
    { id: "agriculture", icon: "🌾", c: "#10B981", name: ["Agriculture", "কৃষি"], chip: ["৳22k–52k", "৳২২k–৫২k"], major: "Agriculture & Agribusiness", query: "agriculture agritech farming" },
    { id: "textile", icon: "🧵", c: "#8B5CF6", name: ["Textile", "টেক্সটাইল"], chip: ["৳25k–62k", "৳২৫k–৬২k"], major: "Textile Engineering", query: "textile garment merchandising" },
    { id: "engineering", icon: "⚙️", c: "#EC4899", name: ["Engineering", "ইঞ্জিনিয়ারিং"], chip: ["৳28k–75k", "৳২৮k–৭৫k"], major: "Electrical & Electronic (EEE)", query: "engineering mechanical civil electrical" },
  ],
  internship: [
    { id: "paid", icon: "💵", c: "#10B981", name: ["Paid", "পেইড"], chip: ["৳10k–25k / mo", "৳১০k–২৫k / মাস"], query: "paid" },
    { id: "unpaid", icon: "📜", c: "#6366F1", name: ["Learning", "লার্নিং"], chip: ["Certificate", "সার্টিফিকেট"], query: "unpaid" },
    { id: "versity", icon: "🏫", c: "#F59E0B", name: ["Versity Credit", "ভার্সিটি ক্রেডিট"], chip: ["Graduation", "গ্র্যাজুয়েশন"], query: "versity" },
    { id: "corporate", icon: "🏢", c: "#3B82F6", name: ["Corporate", "কর্পোরেট"], chip: ["MNC + PPO", "MNC + PPO"], query: "corporate" },
    { id: "remote", icon: "🌐", c: "#EC4899", name: ["Remote", "রিমোট"], chip: ["Work from home", "ঘরে বসে"], query: "remote" },
  ],
};

export const storyLink = (kind, s) =>
  kind === "job"
    ? `/jobs?major=${encodeURIComponent(s.major)}&cat=${s.id}`
    : `/internships?cat=${s.id}`;

function StoryCard({ s, i, L, active, onOpen, onGo }) {
  const ref = useRef(null);
  const [play, setPlay] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, mx: 50, my: 50, hovered: false });

  const handleMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = Math.round((x / rect.width) * 100);
    const py = Math.round((y / rect.height) * 100);
    // Smooth 3D tilt calculation (-10deg to +10deg)
    const rx = ((y / rect.height) - 0.5) * -16;
    const ry = ((x / rect.width) - 0.5) * 16;
    setTilt({ rx, ry, mx: px, my: py, hovered: true });
  };

  const handleMouseLeave = () => {
    dispatchEvent(new CustomEvent("sr-hover", { detail: null }));
    setTilt({ rx: 0, ry: 0, mx: 50, my: 50, hovered: false });
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      const v = el.querySelector("video");
      if (e.isIntersecting) { v?.play().then(() => setPlay(true)).catch(() => {}); }
      else { v?.pause(); setPlay(false); }
    }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`sr-card ${play ? "play" : ""} ${active ? "on" : ""} ${tilt.hovered ? "tilting" : ""}`}
      style={{
        "--c": s.c,
        "--i": i,
        transform: tilt.hovered
          ? `perspective(850px) rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg) scale3d(1.04, 1.04, 1.04) translateY(-6px)`
          : undefined,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => dispatchEvent(new CustomEvent("sr-hover", { detail: s.id }))}
      onMouseLeave={handleMouseLeave}
      onClick={() => onOpen(i)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen(i)}
      aria-label={s.name[L]}
    >
      <video src={`/stories/${s.id}.mp4`} poster={`/stories/${s.id}.jpg`} muted loop playsInline preload="metadata" />

      {/* Dynamic Ambient Aura / Interactive Glare */}
      <div
        className="sr-glare"
        style={{
          background: tilt.hovered
            ? `radial-gradient(circle at ${tilt.mx}% ${tilt.my}%, rgba(255, 255, 255, 0.32) 0%, rgba(255, 255, 255, 0.08) 35%, transparent 70%)`
            : undefined,
          opacity: tilt.hovered ? 1 : 0,
        }}
      />

      {/* Live Pulse Status Badge at Top Left */}
      <div className="sr-live-badge">
        <span className="sr-live-dot" />
        <span className="sr-live-txt">{s.chip[L]}</span>
      </div>

      {/* Floating 3D Category Icon at Top Right */}
      <div className="sr-av">
        <i>{s.icon}</i>
      </div>

      {/* Title & Action Button */}
      <div className="sr-name">
        <b className={L ? "bn" : ""}>{s.name[L]}</b>
        <button
          type="button"
          className="sr-go"
          onClick={(e) => {
            e.stopPropagation();
            onGo(s);
          }}
          aria-label="Open"
        >
          →
        </button>
      </div>
    </div>
  );
}

function StoryViewer({ items, start, L, kind, onClose, onGo }) {
  const [i, setI] = useState(start);
  const s = items[i];
  const next = () => (i < items.length - 1 ? setI(i + 1) : onClose());
  const prev = () => i > 0 && setI(i - 1);
  useEffect(() => {
    const k = (e) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowRight") next(); if (e.key === "ArrowLeft") prev(); };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  });
  return (
    <div className="sv-bg" onClick={onClose}>
      <div className="sv" style={{ "--c": s.c }} onClick={(e) => e.stopPropagation()}>
        <video key={s.id} src={`/stories/${s.id}.mp4`} poster={`/stories/${s.id}.jpg`} autoPlay muted playsInline onEnded={next} />
        <div className="sv-bars">{items.map((x, j) => <span key={x.id} className={j < i ? "done" : j === i ? "cur" : ""}><i key={s.id} /></span>)}</div>
        <div className="sv-top">
          <span className="sr-av"><i>{s.icon}</i><b>{kind === "job" ? (L ? "জব" : "Jobs") : (L ? "ইন্টার্নশিপ" : "Internships")}</b></span>
          <button type="button" className="sv-x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <button type="button" className="sv-tap l" onClick={prev} aria-label="Previous" />
        <button type="button" className="sv-tap r" onClick={next} aria-label="Next" />
        <div className="sv-bottom">
          <span className="sv-chip">{s.chip[L]}</span>
          <h3 className={L ? "bn" : ""}>{s.name[L]}</h3>
          <button type="button" className="sv-cta" onClick={() => onGo(s)}>{L ? "দেখো" : "Explore"} →</button>
        </div>
        <button type="button" className="sv-nav l" onClick={prev} aria-label="Previous">‹</button>
        <button type="button" className="sv-nav r" onClick={next} aria-label="Next">›</button>
      </div>
    </div>
  );
}

/**
 * kind: "job" | "internship"
 * onSelect(s): optional — instead of navigating (used on the Jobs page to filter in place).
 */
export default function StoryRail({ kind, title, onSwitch, onSelect, active, light, compact, footer, galaxy }) {
  const [lang] = useLang();
  const L = lang === "bn" ? 1 : 0;
  const nav = useNavigate();
  const [open, setOpen] = useState(-1);
  const items = STORY_SETS[kind];
  const go = (s) => { setOpen(-1); if (onSelect) onSelect(s); else nav(storyLink(kind, s)); };

  return (
    <div className={`story-rail ${light ? "light" : ""} ${compact ? "compact" : ""}`}>
      {(title || onSwitch) && (
        <div className="sr-head">
          {title}
          {onSwitch && (
            <div className="sr-switch" role="tablist">
              <button type="button" className={kind === "job" ? "on" : ""} onClick={() => onSwitch("job")}>💼 {L ? "জব" : "Jobs"}</button>
              <button type="button" className={kind === "internship" ? "on" : ""} onClick={() => onSwitch("internship")}>🎓 {L ? "ইন্টার্নশিপ" : "Internships"}</button>
            </div>
          )}
        </div>
      )}
      {galaxy ? (
        <GalaxyRail items={items} L={L} counts={galaxy.counts} introT0={galaxy.introT0} onGo={go} />
      ) : (
        <div className="sr-grid">
          {items.map((s, i) => (
            <StoryCard key={kind + s.id} s={s} i={i} L={L} active={active === s.id} onOpen={setOpen} onGo={go} />
          ))}
        </div>
      )}
      {footer && <div className="sr-foot">{footer}</div>}
      {open >= 0 && createPortal(<StoryViewer items={items} start={open} L={L} kind={kind} onClose={() => setOpen(-1)} onGo={go} />, document.body)}
    </div>
  );
}
