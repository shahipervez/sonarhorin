import { useEffect, useRef, useState } from "react";

// Eight reasons, one on each antler tip. [icon, title en, title bn, typical en, typical bn, ours en, ours bn]
const REASONS = [
  ["🎯", "Fresher-only jobs", "শুধু ফ্রেশারদের জব", "Mixed with 2–5 year roles", "২–৫ বছরের জবের সাথে মেশানো", "Only 0–1 year experience", "শুধু ০–১ বছরের অভিজ্ঞতা"],
  ["📊", "Know why you're rejected", "কেন রিজেক্ট, জানো", "Silence after you apply", "অ্যাপ্লাইয়ের পর চুপচাপ", "Rejection risk % + exact fixes", "রিজেকশনের ঝুঁকি % + সমাধান"],
  ["🏅", "Proof without experience", "অভিজ্ঞতা ছাড়া প্রমাণ", "Nothing to show", "দেখানোর কিছু নেই", "Verified tests, live website, certificates", "ভেরিফায়েড টেস্ট, ওয়েবসাইট, সার্টিফিকেট"],
  ["⚡", "Apply anywhere, fast", "দ্রুত যেকোনো জায়গায়", "Copy-paste every form", "প্রতিটা ফর্ম কপি-পেস্ট", "1-click · email · assisted portal apply", "১-ক্লিক · ইমেইল · পোর্টাল সহায়তা"],
  ["🎙️", "Interview practice", "ইন্টারভিউ প্র্যাকটিস", "Learn it in the real interview", "আসল ইন্টারভিউতেই শেখা", "10-minute AI interviewer, scored", "১০ মিনিটের এআই ইন্টারভিউ, স্কোর সহ"],
  ["🛡️", "Scam safety", "স্ক্যাম থেকে নিরাপদ", "Anyone can post anything", "যে কেউ যা খুশি পোস্ট করে", "Scam alerts — we never charge you", "স্ক্যাম অ্যালার্ট — আমরা টাকা নিই না"],
  ["🤝", "Your own network", "নিজের নেটওয়ার্ক", "Strangers, no referrals", "অচেনা মানুষ, রেফারেল নেই", "Your university & major, chat + referrals", "নিজের ভার্সিটি ও মেজর, চ্যাট + রেফারেল"],
  ["💸", "Free for freshers", "ফ্রেশারদের জন্য ফ্রি", "Paid features, varies", "টাকা লাগে, ভিন্ন ভিন্ন", "Free — always", "ফ্রি — সবসময়"],
];

// left antler (right one is the mirror). Tips get a reason each.
const BEAM = "M 566 432 C 540 360 500 290 450 230 C 400 170 340 120 262 78";
const TINES = [
  "M 452 232 C 380 232 270 226 156 204",
  "M 506 304 C 420 300 300 300 138 296",
  "M 548 380 C 470 400 360 430 232 446",
];
const TWIGS = ["M 330 128 C 320 96 312 70 312 40", "M 300 222 C 282 196 264 182 242 172", "M 360 300 C 330 330 300 350 270 360", "M 420 418 C 400 450 380 470 350 490"];
const TIPS = [[262, 78], [156, 204], [138, 296], [232, 446]];
const NODES = [...TIPS, ...TIPS.map(([x, y]) => [1200 - x, y])];

/** “Why সোনারহরিণ” as a golden deer whose antlers branch into the reasons. */
export default function WhyAntlers({ L = 0 }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  const [act, setAct] = useState(0);
  const hover = useRef(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(ref.current); return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!seen) return;
    const id = setInterval(() => { if (!hover.current) setAct((a) => (a + 1) % REASONS.length); }, 2800);
    return () => clearInterval(id);
  }, [seen]);
  const r = REASONS[act];
  const antler = (flip) => (
    <g transform={flip ? "translate(1200 0) scale(-1 1)" : undefined}>
      <path className="ant beam" d={BEAM} pathLength="1" />
      {TINES.map((d, i) => <path key={i} className="ant tine" d={d} pathLength="1" style={{ "--d": `${0.7 + i * 0.25}s` }} />)}
      {TWIGS.map((d, i) => <path key={i} className="ant twig" d={d} pathLength="1" style={{ "--d": `${1.3 + i * 0.15}s` }} />)}
    </g>
  );
  return (
    <div className={`antlers ${seen ? "seen" : ""}`} ref={ref}>
      <div className="ant-head">
        <p className="eyebrow light">{L ? "কেন সোনারহরিণ" : "Why সোনারহরিণ"}</p>
        <h3 className={L ? "bn" : ""}>{L ? <>একটা হরিণ, <em>আটটা কারণ।</em></> : <>One deer. <em>Eight reasons.</em></>}</h3>
      </div>
      <div className="ant-stage">
        <svg viewBox="0 0 1200 760" aria-hidden="true">
          <defs>
            <linearGradient id="ant-g" gradientUnits="userSpaceOnUse" x1="600" y1="460" x2="200" y2="40"><stop offset="0" stopColor="#FFD36B" /><stop offset=".55" stopColor="#FFB627" /><stop offset="1" stopColor="#FF8A3D" /></linearGradient>
            <radialGradient id="ant-glow"><stop offset="0" stopColor="#FFB627" stopOpacity=".45" /><stop offset=".5" stopColor="#FF4F9A" stopOpacity=".12" /><stop offset="1" stopColor="#6B4EFF" stopOpacity="0" /></radialGradient>
            <linearGradient id="ant-face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFD36B" /><stop offset="1" stopColor="#F08A1C" /></linearGradient>
            <filter id="ant-soft"><feGaussianBlur stdDeviation="6" /></filter>
          </defs>
          <circle cx="600" cy="540" r="330" fill="url(#ant-glow)" />
          {[...Array(26)].map((_, i) => <circle key={i} className="spark" cx={(i * 197) % 1200} cy={(i * 131) % 700} r={1.2 + (i % 3)} style={{ "--k": i }} />)}
          <g className="ant-glowpaths" filter="url(#ant-soft)" opacity=".55">{antler(false)}{antler(true)}</g>
          {antler(false)}{antler(true)}
          {/* the deer */}
          <g className="deer-face">
            <ellipse cx="505" cy="478" rx="58" ry="22" transform="rotate(-28 505 478)" fill="url(#ant-face)" />
            <ellipse cx="510" cy="476" rx="34" ry="10" transform="rotate(-28 510 476)" fill="#FF9DB8" opacity=".8" />
            <ellipse cx="695" cy="478" rx="58" ry="22" transform="rotate(28 695 478)" fill="url(#ant-face)" />
            <ellipse cx="690" cy="476" rx="34" ry="10" transform="rotate(28 690 476)" fill="#FF9DB8" opacity=".8" />
            <path d="M 600 418 C 652 418 692 452 694 506 C 696 566 660 624 632 682 C 622 704 578 704 568 682 C 540 624 504 566 506 506 C 508 452 548 418 600 418 Z" fill="url(#ant-face)" />
            <path d="M 640 430 C 676 450 690 490 686 530 C 680 580 650 630 628 676 C 640 620 660 560 660 510 C 660 470 652 446 640 430 Z" fill="#B85E0A" opacity=".22" />
            {[[588, 448, 7], [612, 462, 5], [596, 478, 4], [576, 466, 3.5]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#FFF3C9" opacity=".8" />)}
            {[[566, 1], [634, -1]].map(([x, s]) => (
              <g key={x}>
                <path d={`M ${x - 20} ${520} Q ${x} ${496} ${x + 20} ${520} Q ${x} ${544} ${x - 20} ${520} Z`} fill="#fff" />
                <ellipse cx={x} cy="521" rx="11" ry="14" fill="#4B2FD6" /><ellipse cx={x} cy="526" rx="8" ry="7" fill="#8B74FF" />
                <ellipse cx={x} cy="520" rx="5" ry="7" fill="#120a2a" />
                <circle cx={x - 4} cy="514" r="4" fill="#fff" /><circle cx={x + 4} cy="527" r="2" fill="#fff" />
                <path d={`M ${x - 22} ${518} Q ${x} ${492} ${x + 22} ${516}`} stroke="#3a1c05" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                <path d={`M ${x + 20 * s} ${514} l ${8 * s} -6`} stroke="#3a1c05" strokeWidth="2.6" strokeLinecap="round" />
              </g>
            ))}
            <ellipse cx="548" cy="566" rx="14" ry="7" fill="#FF7D8A" opacity=".35" /><ellipse cx="652" cy="566" rx="14" ry="7" fill="#FF7D8A" opacity=".35" />
            <ellipse cx="600" cy="666" rx="20" ry="13" fill="#2a1406" /><ellipse cx="594" cy="662" rx="6" ry="3" fill="#fff" opacity=".5" />
            <path d="M 588 684 Q 600 694 612 684" stroke="#2a1406" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
        </svg>
        {NODES.map(([x, y], i) => (
          <button key={i} className={`ant-node ${act === i ? "on" : ""} ${x < 600 ? "l" : "r"}`} style={{ left: `${(x / 1200) * 100}%`, top: `${(y / 760) * 100}%`, "--i": i }}
            onMouseEnter={() => { hover.current = true; setAct(i); }} onMouseLeave={() => (hover.current = false)} onClick={() => setAct(i)} aria-pressed={act === i}>
            <span className="ic">{REASONS[i][0]}</span>
            <span className={`lb ${L ? "bn" : ""}`}>{REASONS[i][1 + L]}</span>
          </button>
        ))}
      </div>
      <div className="ant-detail" key={act} aria-live="polite">
        <span className="ad-ic">{r[0]}</span>
        <b className={L ? "bn" : ""}>{r[1 + L]}</b>
        <span className="them"><small>{L ? "সাধারণ জব সাইট" : "Typical job board"}</small><s>{r[3 + L]}</s></span>
        <i className="arrow">→</i>
        <span className="us"><small>সোনারহরিণ</small><strong>{r[5 + L]}</strong></span>
      </div>
      <div className="ant-dots">{REASONS.map((_, i) => <button key={i} className={act === i ? "on" : ""} onClick={() => setAct(i)} aria-label={`Reason ${i + 1}`} />)}</div>
    </div>
  );
}
