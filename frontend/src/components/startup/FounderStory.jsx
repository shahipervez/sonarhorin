import { useState } from "react";
import { GLOBAL_STORIES, VIDEOS } from "../../pages/startupFunders";

function Video({ v, L }) {
  const [play, setPlay] = useState(false);
  return (
    <div className="fs-video">
      <div className="fs-frame">
        {play ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`}
            title={v.t[0]}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button type="button" onClick={() => setPlay(true)} aria-label={`${L ? "ভিডিও দেখো" : "Play"}: ${v.t[L]}`}>
            <img
              src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
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
  const [selectedStory, setSelectedStory] = useState(0);
  const cur = GLOBAL_STORIES[selectedStory] || GLOBAL_STORIES[0];

  return (
    <div className="fs-global-wrap">
      {/* 1. Global Startups That Raised Billions: Interactive Breakdown */}
      <div className="fs-spotlight">
        <div className="fs-spotlight-nav">
          {GLOBAL_STORIES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              className={`fs-spotlight-tab ${idx === selectedStory ? "active" : ""}`}
              onClick={() => setSelectedStory(idx)}
              style={{ "--accent": s.accent }}
            >
              <span className="fs-tab-icon">{s.logoText}</span>
              <div className="fs-tab-text">
                <b>{s.company}</b>
                <small>{s.badge}</small>
              </div>
            </button>
          ))}
        </div>

        <div className="fs-spotlight-card" style={{ "--accent": cur.accent }}>
          <div className="fs-card-header">
            <div className="fs-card-badge">
              <span className="fs-badge-dot" />
              <span>{cur.badge}</span>
            </div>
            <span className="fs-card-tagline">{cur.tagline}</span>
          </div>

          <div className="fs-card-body">
            <div className="fs-card-lead">
              <span className="fs-big-icon">{cur.logoText}</span>
              <div>
                <h3>{cur.company}</h3>
                <p className="fs-founder-name">
                  {L ? "ফাউন্ডার:" : "Founders:"} <b>{cur.founder}</b>
                </p>
              </div>
            </div>

            <p className="fs-card-summary">{cur.summary[L]}</p>

            <div className="fs-card-callout">
              <div className="fs-callout-item">
                <small>{L ? "ফান্ডিং হাইলাইট" : "Funding Highlight"}</small>
                <b>{cur.highlight}</b>
              </div>
              <div className="fs-callout-item">
                <small>{L ? "মূল কৌশল" : "Key Strategy"}</small>
                <span>{cur.keyLesson}</span>
              </div>
            </div>
          </div>

          <div className="fs-card-footer">
            <span className="fs-action-hint">
              {L ? "তোমার আইডিয়া নিয়ে ফান্ডিং প্রস্তুতি শুরু করো" : "Turn your idea into the next global story"}
            </span>
            <button type="button" className="sc-btn pink" onClick={onStart}>
              {L ? "পিচ শুরু করো →" : "Start your pitch →"}
            </button>
          </div>
        </div>
      </div>

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
