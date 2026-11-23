import { useEffect, useRef, useState } from "react";
import { BD_STORY, VIDEOS } from "../../pages/startupFunders";

/** Tanvir's story (a short illustrated story) + real startup stories from YouTube. */
const PANELS = [
  { s: ["📄", "📄", "📄", "❌"], bg: "#FDE7EF", t: ["40 CVs sent. Zero calls.", "৪০টা সিভি। একটা কলও না।"] },
  { s: ["🧵", "📒", "😩"], bg: "#FFF2D6", t: ["Mom's tailoring orders keep getting lost on paper.", "মায়ের দর্জির অর্ডার খাতায় হারিয়ে যায়।"] },
  { s: ["💻", "🦌"], bg: "#E9E6FB", t: ["He opens সোনারহরিণ → Startup.", "সে সোনারহরিণ → স্টার্টআপ খোলে।"] },
  { s: ["💡", "❗", "✅"], bg: "#E3F6EC", t: ["Writes just 3 things: idea, problem, solution.", "শুধু ৩টা জিনিস লেখে: আইডিয়া, সমস্যা, সমাধান।"] },
  { s: ["📊", "🗂️", "🤝"], bg: "#E4F1FF", t: ["Score climbs. Full pitch. 4 funders fit him.", "স্কোর বাড়ে। পুরো পিচ। ৪টা ফান্ডার মিলে যায়।"] },
  { s: ["🎉", "🧑‍💻", "🧑‍💻"], bg: "#FFE9DC", t: ["A grant lands. He hires 2 friends.", "অনুদান আসে। ২ বন্ধুকে চাকরি দেয়।"] },
];

function Video({ v, L }) {
  const [play, setPlay] = useState(false);
  return (
    <div className="fs-video">
      <div className="fs-frame">
        {play ? (
          <iframe src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`} title={v.t[0]} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
        ) : (
          <button type="button" onClick={() => setPlay(true)} aria-label={`${L ? "দেখো" : "Play"}: ${v.t[L]}`}>
            <img src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} />
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
  const [at, setAt] = useState(0);
  const [hold, setHold] = useState(false);
  const track = useRef(null);
  useEffect(() => {
    if (hold) return;
    const t = setInterval(() => setAt((a) => (a + 1) % PANELS.length), 2600);
    return () => clearInterval(t);
  }, [hold]);

  return (
    <div className="fs">
      <div className="fs-strip" ref={track} onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}>
        <div className="fs-who">
          <span className="fs-avatar">T</span>
          <div><b>{L ? "তানভীরের গল্প" : "Tanvir's story"}</b><small>{L ? "চাকরি পাচ্ছিল না · ৬ ধাপ" : "Couldn't find a job · 6 steps"}</small></div>
          <button type="button" className="sc-btn pink" onClick={onStart}>{L ? "আমিও শুরু করবো →" : "I'll start too →"}</button>
        </div>
        <ol className="fs-panels">
          {PANELS.map((p, i) => (
            <li key={i} className={`${i === at ? "on" : ""} ${i < at ? "past" : ""}`} style={{ "--bg": p.bg }} onMouseEnter={() => setAt(i)}>
              <span className="fs-n">{i + 1}</span>
              <span className="fs-scene" aria-hidden="true">{p.s.map((e, k) => <i key={k} style={{ "--k": k }}>{e}</i>)}</span>
              <p className={L ? "bn" : ""}>{p.t[L]}</p>
            </li>
          ))}
        </ol>
        <div className="fs-bar"><span style={{ width: `${((at + 1) / PANELS.length) * 100}%` }} /></div>
      </div>

      <div className="fs-real">
        <h3 className={L ? "bn" : ""}>{L ? "আসল গল্প দেখো" : "Real stories"}</h3>
        <div className="fs-videos">
          {VIDEOS.map((v) => <Video key={v.id} v={v} L={L} />)}
          <a className="fs-link" href={BD_STORY.url} target="_blank" rel="noopener noreferrer">
            <span>🇧🇩</span><b className={L ? "bn" : ""}>{BD_STORY.t[L]}</b><small>{BD_STORY.by} ↗</small>
          </a>
        </div>
      </div>
    </div>
  );
}
