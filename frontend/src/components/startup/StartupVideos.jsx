import { useState } from "react";
import { VIDEOS } from "../../pages/startupFunders";

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

export default function StartupVideos({ L }) {
  return (
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
  );
}
