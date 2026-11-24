import { useEffect, useRef, useState } from "react";
import { VIDEOS } from "../../pages/startupFunders";

/* ── Animated Story: Rafi's Funding Journey ── */
const SCENES = [
  {
    emoji: ["💡", "🧑‍💼"],
    bg: "linear-gradient(135deg, #FFF7ED, #FFEDD5)",
    color: "#EA580C",
    en: "Rafi has a brilliant business idea — an app that connects local farmers directly to city restaurants.",
    bn: "রাফির একটা দারুণ বিজনেস আইডিয়া আছে — একটা অ্যাপ যেটা সরাসরি চাষীদের শহরের রেস্টুরেন্টের সাথে কানেক্ট করবে।",
  },
  {
    emoji: ["💸", "❌", "😟"],
    bg: "linear-gradient(135deg, #FEF2F2, #FEE2E2)",
    color: "#DC2626",
    en: "But there's one problem — he has zero funding. Banks won't even look at him. 'You have no collateral, no track record.'",
    bn: "কিন্তু একটাই সমস্যা — ফান্ড নেই। ব্যাংকে গেলে বলে 'জামানত নেই, ট্র্যাক রেকর্ড নেই।'",
  },
  {
    emoji: ["📄", "📊", "🤯"],
    bg: "linear-gradient(135deg, #F5F3FF, #EDE9FE)",
    color: "#7C3AED",
    en: "He tries reading about grants, VCs, accelerators… pitch decks, term sheets, equity dilution — his head is spinning.",
    bn: "সে গ্রান্ট, ভিসি, অ্যাক্সেলারেটর নিয়ে পড়তে গেল… পিচ ডেক, টার্ম শিট, ইকুইটি ডাইলিউশন — মাথা ঘুরছে।",
  },
  {
    emoji: ["👨‍🏫", "🗣️", "😕"],
    bg: "linear-gradient(135deg, #F0F9FF, #E0F2FE)",
    color: "#0284C7",
    en: "A mentor tries to guide him: 'Write a concept note, find sector-fit funders, build an investor pipeline…' Rafi nods but understands nothing.",
    bn: "একজন মেন্টর গাইড করতে চাইলেন: 'কনসেপ্ট নোট লেখো, সেক্টর-ফিট ফান্ডার খোঁজো, ইনভেস্টর পাইপলাইন বানাও…' রাফি মাথা নাড়ে কিন্তু কিছুই বুঝল না।",
  },
  {
    emoji: ["☕", "🤝", "😊"],
    bg: "linear-gradient(135deg, #ECFDF5, #D1FAE5)",
    color: "#059669",
    en: "One evening at a tea stall, Rafi bumps into his old friend Farhan. 'Bro, I heard you're trying to start something. What's the status?'",
    bn: "একদিন সন্ধ্যায় চায়ের দোকানে পুরনো বন্ধু ফারহানের সাথে দেখা। 'ভাই, শুনলাম তুই কিছু করতে চাস। কী অবস্থা?'",
  },
  {
    emoji: ["😩", "💬"],
    bg: "linear-gradient(135deg, #FFF7ED, #FEF3C7)",
    color: "#D97706",
    en: "'Dude, I have the idea, I have the plan, but I can't figure out funding. Where do I even start? Who do I go to?'",
    bn: "'ভাই আইডিয়া আছে, প্ল্যান আছে, কিন্তু ফান্ডিং কোথায় পাবো বুঝতেসি না। শুরুটা কোত্থেকে করবো? কার কাছে যাবো?'",
  },
  {
    emoji: ["📱", "🦌", "✨"],
    bg: "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
    color: "#B45309",
    en: "Farhan smiles, pulls out his phone: 'Come here — look at this. সোনারহরিণ → Startup. Everything you need is right here.'",
    bn: "ফারহান হাসলো, ফোন বের করলো: 'এদিকে আয় — এইটা দেখ। সোনারহরিণ → Startup। তোর যা লাগবে সব এখানেই আছে।'",
  },
  {
    emoji: ["✍️", "📋", "🎯"],
    bg: "linear-gradient(135deg, #F0FDF4, #DCFCE7)",
    color: "#16A34A",
    en: "Rafi writes his business idea in one box. The problem in another. A full concept note with budget — third box. Score: 72/100 ✓",
    bn: "রাফি এক বক্সে বিজনেস আইডিয়া লিখলো। আরেক বক্সে সমস্যা। বাজেটসহ পুরো কনসেপ্ট নোট — তৃতীয় বক্স। স্কোর: ৭২/১০০ ✓",
  },
  {
    emoji: ["🤝", "💰", "🚀"],
    bg: "linear-gradient(135deg, #FDF2F8, #FCE7F3)",
    color: "#DB2777",
    en: "4 funders matched instantly. Within weeks — a grant lands. Rafi's app is live. He hires his first team. The journey begins.",
    bn: "৪টা ফান্ডার সাথে সাথে ম্যাচ করলো। কয়েক সপ্তাহের মধ্যে — গ্রান্ট পেয়ে গেল। রাফির অ্যাপ লাইভ। প্রথম টিম হায়ার। যাত্রা শুরু।",
  },
];

function AnimatedStory({ L, onStart }) {
  const [at, setAt] = useState(0);
  const [paused, setPaused] = useState(false);
  const progressRef = useRef(null);
  const scene = SCENES[at];

  useEffect(() => {
    if (paused) return;
    const dur = at === 6 ? 5500 : 4200; // linger on the reveal scene
    const t = setTimeout(() => setAt((a) => (a + 1) % SCENES.length), dur);
    return () => clearTimeout(t);
  }, [at, paused]);

  const goTo = (i) => { setAt(i); setPaused(true); };

  return (
    <div className="as-wrap" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* Scene viewport */}
      <div
        className="as-viewport"
        key={at}
        style={{ "--bg": scene.bg, "--sc": scene.color }}
      >
        <div className="as-scene-emoji">
          {scene.emoji.map((e, i) => (
            <span key={i} className="as-em" style={{ "--d": `${i * 120}ms` }}>{e}</span>
          ))}
        </div>
        <p className={`as-text ${L ? "bn" : ""}`}>
          {L ? scene.bn : scene.en}
        </p>
      </div>

      {/* Progress dots */}
      <div className="as-dots" ref={progressRef}>
        {SCENES.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`as-dot ${i === at ? "on" : ""} ${i < at ? "done" : ""}`}
            onClick={() => goTo(i)}
            aria-label={`Scene ${i + 1}`}
          >
            <svg viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" className="as-dot-bg" />
              {i === at && !paused && (
                <circle cx="18" cy="18" r="16" className="as-dot-fill" style={{ "--dur": i === 6 ? "5.5s" : "4.2s" }} />
              )}
            </svg>
            <span>{i + 1}</span>
          </button>
        ))}
      </div>

      {/* CTA at the end */}
      <div className="as-cta">
        <span className="as-cta-hint">
          {L ? "তোমার আইডিয়াটাও এভাবেই ফান্ডিং পেতে পারে" : "Your idea could be the next one to get funded"}
        </span>
        <button type="button" className="sc-btn pink" onClick={onStart}>
          {L ? "আমিও শুরু করবো →" : "Start your pitch →"}
        </button>
      </div>
    </div>
  );
}

function Video({ v, L }) {
  const [play, setPlay] = useState(false);
  return (
    <div className="fs-video">
      <div className="fs-frame">
        {play ? (
          <iframe
            src={`https://www.youtube.com/embed/${v.id}?autoplay=1&rel=0`}
            title={v.t[0]}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className="fs-play-btn"
            onClick={() => setPlay(true)}
            aria-label={`${L ? "ভিডিও দেখো" : "Play"}: ${v.t[L]}`}
          >
            <img
              src={`https://img.youtube.com/vi/${v.id}/hqdefault.jpg`}
              alt={v.t[L]}
              loading="lazy"
            />
            <span className="fs-badge-tag">{v.badge}</span>
            <span className="fs-play">▶</span>
          </button>
        )}
      </div>
      <b className={L ? "bn" : ""}>{v.t[L]}</b>
      <small>{v.by}</small>
    </div>
  );
}

export default function FounderStory({ L, onStart }) {
  return (
    <div className="fs-global-wrap">
      {/* 1. Animated Story: Rafi's journey from no funding to funded via সোনারহরিণ */}
      <AnimatedStory L={L} onStart={onStart} />

      {/* 2. Official Global Talks on How Startups Raised Seed & Growth Capital */}
      <div className="fs-real">
        <h3 className={L ? "bn" : ""}>
          {L ? "গ্লোবাল স্টার্টআপ মাস্টারক্লাস ও ভিডিও" : "Global Startup Funding Talks & Masterclasses"}
        </h3>
        <p className="fs-real-sub">
          {L
            ? "বিশ্বের শীর্ষ ভেঞ্চার ক্যাপিটাল ও ফাউন্ডারদের সরাসরি দিকনির্দেশনা — আইডিয়া ভ্যালিডেশন থেকে ইনভেস্টর পিচিং।"
            : "Direct lessons from Silicon Valley VCs, Y Combinator, and unicorn founders on securing seed investment."}
        </p>
        <div className="fs-videos">
          {VIDEOS.map((v) => (
            <Video key={v.id} v={v} L={L} />
          ))}
        </div>
      </div>
    </div>
  );
}
