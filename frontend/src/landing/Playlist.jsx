import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useLang } from "../i18n";
import { FILMS, StoryPlayer } from "./StoryAnimation";

// Short knowledge reels — kinetic type, narrated when sound is on.
export const REELS = [
  { id: "cv", min: "0:30", bg: ["#4B2FD6", "#6B4EFF"], title: "সিভি কয়েক সেকেন্ডে বাদ পড়ে কেন?", en: "Why CVs get skipped in seconds", cta: ["/cv", "Judge my CV →"], slides: [
    { e: "⏱️", bn: "রিক্রুটার একটা সিভি দেখে মাত্র কয়েক সেকেন্ড।", en: "A recruiter skims a CV in seconds." },
    { e: "👆", bn: "উপরের এক-তৃতীয়াংশই সব — নাম, ফোন, এক লাইনের সামারি।", en: "The top third does the work: name, contact, a one-line summary." },
    { e: "🔢", bn: "বিশেষণ না, সংখ্যা লেখো: “কিউ টাইম ৪০% কমিয়েছি”।", en: "Numbers beat adjectives: “cut queue time by 40%”." },
    { e: "📄", bn: "এক পাতা। PDF। ছবির কোলাজ না।", en: "One page. PDF. No photo collage." },
    { e: "🦌", bn: "তোমারটা ফ্রি চেক করো — রিজেকশনের ঝুঁকি % এ দেখো।", en: "Check yours free — see your rejection risk in %." },
  ] },
  { id: "tmay", min: "0:30", bg: ["#2D3561", "#4A3F8C"], title: "Tell me about yourself — ৬০ সেকেন্ডে", en: "The 60-second answer", cta: ["/interview", "Practise with Mitu →"], slides: [
    { e: "🎤", bn: "সবচেয়ে কমন প্রশ্ন — আর সবচেয়ে বেশি ভুল উত্তর।", en: "The most common question — and the most fumbled." },
    { e: "1️⃣", bn: "বর্তমান: তুমি কে, কী পড়েছো — ১ লাইনে।", en: "Present: who you are, what you studied — one line." },
    { e: "2️⃣", bn: "অতীত: একটা প্রমাণ — প্রজেক্ট, ইন্টার্নশিপ, ফলাফল।", en: "Past: one proof — a project, internship or result." },
    { e: "3️⃣", bn: "ভবিষ্যৎ: এই রোলটা কেন চাও।", en: "Future: why this role, at this company." },
    { e: "🤖", bn: "মিতুর সাথে ১০ মিনিট প্র্যাকটিস করো — প্রতিটা উত্তরের স্কোর পাবে।", en: "Practise 10 minutes with Mitu — every answer scored." },
  ] },
  { id: "exp", min: "0:25", bg: ["#7A3E00", "#C2410C"], title: "অভিজ্ঞতা নেই? প্রজেক্টই অভিজ্ঞতা", en: "No experience? Projects are experience", cta: ["/portfolio", "Build my website →"], slides: [
    { e: "🔁", bn: "চাকরি চায় অভিজ্ঞতা, অভিজ্ঞতা চায় চাকরি।", en: "Jobs want experience. Experience wants a job." },
    { e: "🛠️", bn: "প্রজেক্ট, থিসিস, ক্লাব, ফ্রিল্যান্সিং — সবই অভিজ্ঞতা।", en: "Projects, thesis, clubs, freelancing — all of it counts." },
    { e: "🌐", bn: "একটা লাইভ পোর্টফোলিও ওয়েবসাইটে সব দেখাও।", en: "Show it all on a live portfolio website." },
    { e: "🏅", bn: "ভেরিফায়েড সার্টিফিকেট যোগ করো — কোম্পানি নিজে চেক করতে পারে।", en: "Add verified certificates employers can check themselves." },
  ] },
  { id: "scam", min: "0:30", bg: ["#7F1D1D", "#B4232A"], title: "চাকরির স্ক্যাম চেনার ৫ উপায়", en: "5 ways to spot a job scam", cta: ["/jobs", "Browse safe jobs →"], slides: [
    { e: "💸", bn: "চাকরির জন্য টাকা চাইলে — স্ক্যাম।", en: "Asked to pay for a job? Scam." },
    { e: "📧", bn: "Gmail থেকে অফার লেটার, অফিসিয়াল ডোমেইন নেই — সন্দেহ করো।", en: "Offer from a Gmail address, no company domain? Be suspicious." },
    { e: "🪪", bn: "ইন্টারভিউয়ের আগেই NID, কার্ড বা OTP চাইলে — দিও না।", en: "NID, card or OTP before any interview? Never." },
    { e: "💯", bn: "“১০০% চাকরির গ্যারান্টি” — কেউ দিতে পারে না।", en: "“100% job guarantee” — nobody can promise that." },
    { e: "🤑", bn: "অবিশ্বাস্য বেতন, কোনো ইন্টারভিউ নেই — পালাও।", en: "Unbelievable pay, no interview — run." },
  ] },
  { id: "linkedin", min: "0:25", bg: ["#0B4A8B", "#1D6FD1"], title: "লিংকডইন প্রোফাইল ১০ মিনিটে", en: "A LinkedIn profile in 10 minutes", cta: ["/portfolio", "Make my portfolio →"], slides: [
    { e: "🙂", bn: "পরিষ্কার মুখের ছবি, হালকা ব্যাকগ্রাউন্ড।", en: "A clear face photo, plain background." },
    { e: "✍️", bn: "হেডলাইন: “CSE গ্র্যাজুয়েট · Django · খুঁজছি জুনিয়র রোল”।", en: "Headline: “CSE grad · Django · open to junior roles”." },
    { e: "📌", bn: "Featured-এ তোমার সেরা প্রজেক্ট আর পোর্টফোলিও লিংক।", en: "Pin your best project and portfolio link in Featured." },
    { e: "🤝", bn: "প্রতিদিন ৫ জন — একই ভার্সিটির সিনিয়রদের সাথে কানেক্ট।", en: "Connect with 5 seniors from your university every day." },
  ] },
  { id: "pitch", min: "0:30", bg: ["#1B1446", "#3B1E52"], title: "স্টার্টআপ পিচ: ১০টা স্লাইড", en: "A startup pitch in 10 slides", cta: ["/startup", "Build my pitch →"], slides: [
    { e: "😣", bn: "সমস্যা: একজন মানুষ, একটা কষ্ট — সংখ্যা সহ।", en: "Problem: one person, one pain — with a number." },
    { e: "💡", bn: "সমাধান: প্রথম দিনেই প্রোডাক্ট কী করে।", en: "Solution: what the product does on day one." },
    { e: "📈", bn: "মার্কেট: বাংলাদেশে কত কাস্টমার × কত টাকা।", en: "Market: customers in Bangladesh × what they pay." },
    { e: "✅", bn: "ট্র্যাকশন: ২০টা সার্ভে হলেও দেখাও।", en: "Traction: even 20 survey answers count." },
    { e: "🙋", bn: "আস্ক: কত টাকা, আর সেটা দিয়ে ৬ মাসে কী করবে।", en: "The ask: how much, and what it buys in 6 months." },
  ] },
];

function storyReel(s) {
  return {
    id: `story-${s.id}`, min: "0:20", bg: ["#0E0F0C", "#2B2D28"], title: `${s.name} — ${s.role}`, en: `${s.company}${s.is_demo ? " · sample story" : ""}`, cta: ["/stories", "Read more stories →"],
    slides: [
      { e: "🎓", bn: `${s.name} · ${s.major_label || s.major}`, en: s.university || "" },
      ...(s.months_jobless ? [{ e: "⏳", bn: `${s.months_jobless} মাস চাকরি খুঁজেছে, ${s.applications_before || "অনেক"}টা অ্যাপ্লিকেশন।`, en: `${s.months_jobless} months searching, ${s.applications_before || "many"} applications.` }] : []),
      { e: "💬", bn: `“${(s.quote || "").slice(0, 120)}”`, en: "" },
      { e: "🎉", bn: `এখন ${s.role} — ${s.company}`, en: s.is_demo ? "Sample story for the prototype" : "" },
    ],
  };
}

function useNarrator() {
  const on = useRef(false);
  const speak = useCallback((bn, en) => {
    if (!on.current || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const vs = window.speechSynthesis.getVoices();
      const b = vs.find((v) => /^bn/i.test(v.lang));
      const u = new SpeechSynthesisUtterance(b ? bn : en || bn);
      if (b) { u.voice = b; u.lang = b.lang; } else { const e = vs.find((v) => /^en/i.test(v.lang)); if (e) u.voice = e; u.lang = "en-US"; }
      u.rate = 1.02; window.speechSynthesis.speak(u);
    } catch { /* no TTS */ }
  }, []);
  const stop = useCallback(() => { try { window.speechSynthesis?.cancel(); } catch { /* */ } }, []);
  return useMemo(() => ({ on, speak, stop }), [speak, stop]);
}

/** A story-style reel: big animated Bangla type, progress bars on top, tap left/right to move. */
export function Reel({ reel, onDone }) {
  const [lang] = useLang();
  const bn = lang === "bn";
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [sound, setSound] = useState(false);
  const nar = useNarrator();
  const SLIDE = 4600;
  useEffect(() => { setI(0); }, [reel.id]);
  useEffect(() => {
    if (paused) return;
    const s = reel.slides[i]; if (!s) return;
    if (bn) nar.speak(s.bn.replace(/[“”]/g, ""), s.en); else nar.speak(s.en || s.bn, s.en || s.bn);
    const id = setTimeout(() => (i < reel.slides.length - 1 ? setI(i + 1) : onDone?.()), SLIDE);
    return () => clearTimeout(id);
  }, [i, paused, reel, onDone, nar]);
  useEffect(() => () => nar.stop(), [nar]);
  const s = reel.slides[Math.min(i, reel.slides.length - 1)];
  const main = bn || !s.en ? s.bn : s.en;
  const words = main.split(" ");
  return (
    <div className="reel" style={{ "--a": reel.bg[0], "--b": reel.bg[1] }} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="reel-bars">{reel.slides.map((_, k) => <i key={k} className={k < i ? "done" : k === i ? (paused ? "now paused" : "now") : ""} style={{ "--dur": `${SLIDE}ms` }} />)}</div>
      <div className="reel-top"><b>সোনারহরিণ TV</b><span>{bn ? reel.title : reel.en}</span>
        <button onClick={() => { nar.on.current = !sound; setSound(!sound); if (!sound) nar.speak(s.bn, s.en); else nar.stop(); }} aria-label={sound ? "Mute narration" : "Narration on"}>{sound ? "🔊" : "🔈"}</button>
      </div>
      <div className="reel-body" key={`${reel.id}-${i}`}>
        <span className="reel-e">{s.e}</span>
        <p className={`reel-bn ${bn ? "" : "is-en"}`}>{words.map((w, k) => <span key={k} style={{ "--k": k }}>{w}</span>)}</p>
        {i === reel.slides.length - 1 && reel.cta && <Link className="btn btn-lime sm reel-cta" to={reel.cta[0]}>{reel.cta[1]}</Link>}
      </div>
      <button className="reel-nav prev" onClick={() => setI(Math.max(0, i - 1))} aria-label="Previous" />
      <button className="reel-nav next" onClick={() => (i < reel.slides.length - 1 ? setI(i + 1) : onDone?.())} aria-label="Next" />
    </div>
  );
}

/** Scene 4 — সোনারহরিণ TV: their own stories + knowledge, as a playlist. */
export default function Playlist() {
  const [lang] = useLang();
  const bn = lang === "bn";
  const [tab, setTab] = useState("story");
  const [stories, setStories] = useState([]);
  const [videos, setVideos] = useState([]);
  const [cur, setCur] = useState({ kind: "reel", id: "cv" });
  const [started, setStarted] = useState(false);
  useEffect(() => {
    api("/api/stories/").then((d) => setStories((d.stories || []).slice(0, 6))).catch(() => {});
    api("/api/videos/").then(setVideos).catch(() => {});
  }, []);

  const storyItems = [
    ...Object.values(FILMS).map((f) => ({ kind: "film", id: f.id, title: bn ? f.tab : f.id === "startup" ? "Pulok's story" : "Shuvo's story", sub: `${bn ? "অ্যানিমেটেড ফিল্ম" : "Animated film"} · ${Math.round(f.DUR)}s`, thumb: f.id === "startup" ? "🏮" : "☕" })),
    ...stories.map((s) => ({ kind: "reel", id: `story-${s.id}`, reel: storyReel(s), title: `${s.name} — ${s.role}`, sub: `${s.company}${s.is_demo ? " · sample" : ""}`, thumb: "🎉" })),
    ...videos.filter((v) => v.kind === "story").map((v) => ({ kind: "yt", id: `yt-${v.id}`, yt: v.youtube_id, title: v.title_bn || v.title, sub: `${v.speaker || "Video"} · ${v.minutes} min`, thumb: "▶" })),
  ];
  const knowItems = [
    ...REELS.map((r) => ({ kind: "reel", id: r.id, reel: r, title: bn ? r.title : r.en, sub: r.min, thumb: r.slides[0].e })),
    ...videos.filter((v) => v.kind === "knowledge").map((v) => ({ kind: "yt", id: `yt-${v.id}`, yt: v.youtube_id, title: v.title_bn || v.title, sub: `${v.speaker || "Video"} · ${v.minutes} min`, thumb: "▶" })),
  ];
  const items = tab === "story" ? storyItems : knowItems;
  const all = [...storyItems, ...knowItems];
  const item = all.find((x) => x.id === cur.id) || knowItems[0];
  const next = () => { const k = all.findIndex((x) => x.id === item.id); const n = all[(k + 1) % all.length]; setCur(n); };

  return (
    <section className="tv" id="tv">
      <div className="wrap">
        <div className="tv-head">
          <div><p className="eyebrow light">সোনারহরিণ TV</p>
            <h2 className={`h2 ${bn ? "bn-h" : ""}`}>{bn ? <>ওদের গল্প। <em>তোমার জ্ঞান।</em></> : <>Their stories. <em>Your knowledge.</em></>}</h2></div>
          <div className="tv-tabs" role="tablist">
            <button role="tab" aria-selected={tab === "story"} className={tab === "story" ? "on" : ""} onClick={() => setTab("story")}>{bn ? <span className="bn">গল্প</span> : "Stories"}</button>
            <button role="tab" aria-selected={tab === "know"} className={tab === "know" ? "on" : ""} onClick={() => setTab("know")}>{bn ? <span className="bn">জ্ঞান</span> : "Knowledge"}</button>
          </div>
        </div>
        <div className="tv-body">
          <div className="tv-screen">
            {!started ? (
              <button className="tv-poster" onClick={() => setStarted(true)}>
                <span className="tv-play">▶</span>
                <b className={bn ? "bn" : ""}>{item.title}</b><small>{item.sub}</small>
              </button>
            ) : item.kind === "film" ? (
              <StoryPlayer film={FILMS[item.id]} key={item.id} compact autoplay />
            ) : item.kind === "yt" ? (
              <iframe key={item.id} src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(item.yt)}?autoplay=1&rel=0`} title={item.title}
                allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
            ) : (
              <Reel reel={item.reel} key={item.id} onDone={next} />
            )}
          </div>
          <ol className="tv-list">
            {items.map((x, k) => (
              <li key={x.id}>
                <button className={x.id === item.id ? "on" : ""} onClick={() => { setCur(x); setStarted(true); }}>
                  <span className="tn">{String(k + 1).padStart(2, "0")}</span>
                  <span className="th">{x.thumb}</span>
                  <span className="tx"><b className={bn ? "bn" : ""}>{x.title}</b><small>{x.sub}</small></span>
                  {x.id === item.id && started && <span className="eq" aria-hidden="true"><i /><i /><i /></span>}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
