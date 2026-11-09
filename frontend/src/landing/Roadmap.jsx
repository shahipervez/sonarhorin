import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Scribble from "../components/Scribble";
import { useLang } from "../i18n";
import { useTrack } from "../track";

const STEPS = {
  job: [
    ["Day 1", "দিন ১", "📄", "Fix your CV", "সিভি ঠিক করো", "/cv"],
    ["Day 2", "দিন ২", "✅", "Earn a test badge", "টেস্টে ব্যাজ জেতো", "/quick-test"],
    ["Day 4", "দিন ৪", "🌐", "Go live with your website", "ওয়েবসাইট লাইভ করো", "/portfolio"],
    ["Day 6", "দিন ৬", "🎙️", "Practise one interview", "একটা ইন্টারভিউ প্র্যাকটিস", "/interview"],
    ["Day 7+", "দিন ৭+", "⚡", "Apply daily, turn on auto-apply", "রোজ অ্যাপ্লাই, অটো-অ্যাপ্লাই অন", "/jobs"],
    ["Goal", "লক্ষ্য", "🎉", "Your first offer", "প্রথম অফার", "/applications"],
  ],
  internship: [
    ["Day 1", "দিন ১", "📄", "Fix your CV", "সিভি ঠিক করো", "/cv"],
    ["Day 2", "দিন ২", "🌐", "Put your projects online", "প্রজেক্ট দিয়ে ওয়েবসাইট", "/portfolio"],
    ["Day 3", "দিন ৩", "🤝", "Message three seniors", "তিনজন সিনিয়রকে মেসেজ", "/network"],
    ["Day 4+", "দিন ৪+", "🎓", "Apply to internships", "ইন্টার্নশিপে অ্যাপ্লাই", "/jobs?type=internship"],
    ["Day 10", "দিন ১০", "🏫", "Join a training program", "ট্রেনিং প্রোগ্রামে যোগ দাও", "/programs"],
    ["Goal", "লক্ষ্য", "🎉", "Your first experience", "প্রথম অভিজ্ঞতা", "/applications"],
  ],
  startup: [
    ["Day 1", "দিন ১", "✍️", "Write the problem", "সমস্যাটা লেখো", "/startup#builder"],
    ["Day 3", "দিন ৩", "🗣️", "Talk to 20 people", "২০ জনের সাথে কথা বলো", "/network"],
    ["Day 5", "দিন ৫", "📊", "Reach readiness 45+", "রেডিনেস ৪৫+", "/startup#builder"],
    ["Day 7", "দিন ৭", "📎", "Upload a 10-slide deck", "১০ স্লাইডের ডেক", "/startup#builder"],
    ["Day 14", "দিন ১৪", "🎤", "Submit → pitch day", "সাবমিট → পিচ ডে", "/startup"],
    ["Goal", "লক্ষ্য", "🏮", "Funding", "ফান্ড", "/startup"],
  ],
};
const TITLE = { job: ["Your road to a first job", "প্রথম চাকরির রাস্তা"], internship: ["Your road to a first internship", "প্রথম ইন্টার্নশিপের রাস্তা"], startup: ["From idea to funding", "আইডিয়া থেকে ফান্ড"] };
const PATH = "M 200 40 C 200 160 520 140 520 260 S 160 380 160 500 S 520 620 520 740 S 180 860 180 980 S 480 1100 360 1200";

/** Replaces “See it in action”: your personal road, drawn as you scroll, with the golden deer running ahead. */
export default function Roadmap() {
  const [track] = useTrack();
  const ref = useRef(null), pathRef = useRef(null);
  const [p, setP] = useState(0);
  const [pt, setPt] = useState({ x: 200, y: 40, a: 0 });
  useEffect(() => {
    let raf;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const b = ref.current.getBoundingClientRect();
      if (b.bottom < 0 || b.top > innerHeight) return;
      const v = Math.min(1, Math.max(0, (innerHeight * 0.55 - b.top) / b.height));
      setP((o) => (Math.abs(o - v) > 0.002 ? v : o));
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, []);
  useEffect(() => {
    const el = pathRef.current; if (!el) return;
    const L = el.getTotalLength(), q = el.getPointAtLength(L * p), q2 = el.getPointAtLength(Math.min(L, L * p + 2));
    setPt({ x: q.x, y: q.y, a: Math.atan2(q2.y - q.y, q2.x - q.x) });
  }, [p]);
  const steps = STEPS[track];
  const [lang] = useLang();
  const L = lang === "bn" ? 1 : 0;
  return (
    <section className={`roadmap rm-${track}`} ref={ref} id="roadmap">
      <div className="wrap">
        <div className="rm-head">
          <p className="eyebrow">{L ? "তোমার রাস্তা" : "Your plan"}</p>
          <h2 className={`h2 ${L ? "bn-h" : ""}`}>{TITLE[track][L]}</h2>
        </div>
        <div className="rm-body">
          <svg className="rm-road" viewBox="0 0 720 1240" preserveAspectRatio="xMidYMin meet" aria-hidden="true">
            <defs><linearGradient id="rm-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6B4EFF" /><stop offset=".5" stopColor="#FF4F9A" /><stop offset="1" stopColor="#FFB627" /></linearGradient></defs>
            <path d={PATH} stroke="#E6E1D8" strokeWidth="34" fill="none" strokeLinecap="round" />
            <path d={PATH} stroke="#fff" strokeWidth="3" strokeDasharray="14 16" fill="none" strokeLinecap="round" />
            <path ref={pathRef} d={PATH} stroke="url(#rm-g)" strokeWidth="34" fill="none" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - p} opacity=".92" />
            <g transform={`translate(${pt.x} ${pt.y})`}>
              <circle r="30" fill="#fff" stroke="#12101C" strokeWidth="4" />
              <g transform="translate(-20 -22) scale(1.1)">
                <path d="M14 15c-2-3-5-5-6-9M10 9l-4-1M12 12l-5 1M26 15c2-3 5-5 6-9M30 9l4-1M28 12l5 1" stroke="#E8A317" strokeWidth="2.6" fill="none" strokeLinecap="round" />
                <path d="M13 15c2-1.5 4.5-2 7-2s5 .5 7 2c1 3-1 6-2.5 9.5L22 34c-.6 1.4-3.4 1.4-4 0l-2.5-9.5C14 21 12 18 13 15z" fill="#E8A317" />
              </g>
            </g>
          </svg>
          <ol className="rm-stops">
            {steps.map(([de, db, ic, te, tb, to], i) => {
              const on = p > (i + 0.35) / steps.length;
              return (
                <li key={te} className={`rm-stop ${i % 2 ? "r" : "l"} ${on ? "on" : ""} ${i === steps.length - 1 ? "goal" : ""}`} style={{ "--i": i }}>
                  <span className="rm-day">{L ? db : de}</span>
                  <span className="rm-ic">{ic}</span>
                  <b className={L ? "bn" : ""}>{L ? tb : te}</b>
                  <Link className="link small" to={to}>{L ? "শুরু করো →" : "Start →"}</Link>
                </li>
              );
            })}
          </ol>
          <Scribble key={lang} className="rm-note" text={L ? "হরিণটা আগে আগে দৌড়াচ্ছে!" : "Follow the golden deer!"} arrow="left" />
        </div>
      </div>
    </section>
  );
}
