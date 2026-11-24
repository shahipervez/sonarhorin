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
      <div className="fs-videos">
        {VIDEOS.map((v) => (
          <Video key={v.id} v={v} L={L} />
        ))}
      </div>
    </div>
  );
}
