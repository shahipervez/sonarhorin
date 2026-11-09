import { useEffect, useRef, useState } from "react";

const SEEN = "sh_intro_seen";
export const introSeen = () => { try { return !!sessionStorage.getItem(SEEN); } catch { return false; } };

/** 10-second story film that opens the site: 3 friends at a tea stall → the golden deer → 3 paths → logo. */
export default function IntroStory({ onEnd, L }) {
  const v = useRef(null);
  const [p, setP] = useState(0);
  const [out, setOut] = useState(false);

  const finish = () => {
    if (out) return;
    try { sessionStorage.setItem(SEEN, "1"); } catch {}
    setOut(true);
    setTimeout(() => onEnd?.(), 650);
  };

  useEffect(() => {
    const el = v.current; if (!el) return;
    el.play().catch(() => {});
    const fail = setTimeout(() => { if (el.currentTime === 0) finish(); }, 4000);
    return () => clearTimeout(fail);
  }, []);

  return (
    <div className={`intro-story ${out ? "out" : ""}`} role="dialog" aria-label="Sonarhorin story">
      <video
        ref={v}
        src="/stories/intro.mp4"
        poster="/stories/intro.jpg"
        muted
        playsInline
        preload="auto"
        onTimeUpdate={(e) => setP(e.currentTarget.currentTime / (e.currentTarget.duration || 10))}
        onEnded={finish}
        onError={finish}
      />
      <div className="is-bar"><i style={{ transform: `scaleX(${p})` }} /></div>
      <button type="button" className="is-skip" onClick={finish}>
        {L ? "স্কিপ" : "SKIP"} <span>›</span>
      </button>
      <div className="is-curtain l" /><div className="is-curtain r" />
    </div>
  );
}
