import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useLang } from "../i18n";
import { MA, NILA, Person, RAFI } from "./story/people";

// Patterns of real job scams aimed at freshers in Bangladesh — no company or person is named.
const SCAMS = [
  { from: "HR Desk (+8801XXXXXXXXX)", msg: "অভিনন্দন! আপনি সিলেক্টেড। জয়েনিং কনফার্ম করতে ৫,০০০ টাকা বিকাশ করুন।", lesson: "আসল কোম্পানি চাকরির জন্য কখনো টাকা চায় না।", en: "Real employers never ask you to pay for a job." },
  { from: "WhatsApp · Part-time Job", msg: "ঘরে বসে দিনে ৩,০০০ টাকা! শুধু ভিডিওতে লাইক দিন। শুরু করতে ৫০০ টাকা ডিপোজিট।", lesson: "‘লাইক দিলেই টাকা’ = টাস্ক স্ক্যাম। ডিপোজিট দিলেই শেষ।", en: "Pay-to-start ‘task jobs’ are scams." },
  { from: "Overseas Jobs BD", msg: "মালয়েশিয়ায় ফ্যাক্টরি জব, বেতন ১ লাখ! শুধু ভিসা প্রসেসিং ফি ১.৫ লাখ।", lesson: "বিদেশে চাকরি? সরকারি অনুমোদন আছে কিনা আগে যাচাই করো।", en: "Check the agency's government licence first." },
  { from: "recruitment.manager@gmail.com", msg: "Dear candidate, send your NID, bank card photo & OTP for salary account setup.", lesson: "ইন্টারভিউয়ের আগেই NID, কার্ড বা OTP চাইলে — দিও না।", en: "Never share NID, card photos or OTPs." },
  { from: "MTO Circular 2026", msg: "বিখ্যাত কোম্পানিতে Management Trainee — সিকিউরিটি ডিপোজিট ১০,০০০ টাকা ফেরতযোগ্য।", lesson: "বড় কোম্পানির নাম দিয়ে ফেক সার্কুলার — অফিসিয়াল সাইটে মিলিয়ে দেখো।", en: "Match circulars with the company's official site." },
  { from: "Training Center", msg: "৩ মাসের কোর্স করলেই ১০০% চাকরির গ্যারান্টি! কোর্স ফি মাত্র ২৫,০০০।", lesson: "‘১০০% চাকরি গ্যারান্টি’ — কেউ এটা দিতে পারে না।", en: "Nobody can guarantee you a job." },
];

const FIGS = [
  { p: NILA, k: "her" },
  { p: RAFI, k: "him" },
  { p: { ...MA, outfit: { ...MA.outfit, color: "#6B4EFF", border: "#FFC23D", blouse: "#4B2FD6" }, headcover: false, hair: "long" }, k: "her" },
];

function Celebrate({ i }) {
  const f = FIGS[i % FIGS.length];
  const [tt, setTt] = useState(0);
  useEffect(() => { let raf; const s = performance.now(); const loop = (n) => { setTt((n - s) / 1000); raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf); }, []);
  return (
    <svg viewBox="-150 -650 300 300" className="pp-fig" aria-hidden="true">
      <circle cx="0" cy="-505" r="140" fill="#FFF1CC" />
      <Person x={0} y={0} p={f.p} tt={tt} mood="happy" arms="cheer" />
      {[...Array(9)].map((_, k) => (
        <rect key={k} x={-120 + k * 30} y={-640 + ((tt * 120 + k * 47) % 300)} width="8" height="12" rx="2"
          fill={["#E8B634", "#FFC23D", "#FF8FB1", "#7CC4FF"][k % 4]} transform={`rotate(${(tt * 200 + k * 40) % 360} ${-116 + k * 30} ${-634 + ((tt * 120 + k * 47) % 300)})`} />
      ))}
    </svg>
  );
}

/**
 * Page-1 pop-ups.
 *  - Right: a success story with the cheering girl. She appears ONCE each time the hero intro story starts
 *    (first play and every "Replay the story" — via the `sh-story-start` window event from useJobStory),
 *    plus once when page 1 opens (covers the startup track, reduced motion, or a story already seen this session).
 *    No timed loop: she does not keep coming back by herself.
 *  - Left: scam warnings keep their slow loop, but never while the success pop-up is on screen (no overlap).
 */
export default function Popups() {
  const [lang] = useLang();
  const bn = lang === "bn";
  const [scam, setScam] = useState(null);
  const [win, setWin] = useState(null);
  const [off, setOff] = useState(() => { try { return sessionStorage.getItem("prothom_popups_off") === "1"; } catch { return false; } });
  const stories = useRef([]);
  const hover = useRef(false);
  const n = useRef({ s: 0, w: 0 });
  const winOn = useRef(false);
  const pending = useRef(false);
  const lastWin = useRef(0);
  const winTimers = useRef([]);

  const showWin = useRef(null);
  showWin.current = (force) => {
    // one show per story start: ignore duplicates (mount + event fire in the same tick)
    if (!force && Date.now() - lastWin.current < 4000) return;
    const list = stories.current;
    if (!list.length) { pending.current = true; return; }
    pending.current = false;
    lastWin.current = Date.now();
    winTimers.current.forEach(clearTimeout);
    winTimers.current = [];
    if (innerWidth < 760) setScam(null);
    const i = n.current.w++;
    winOn.current = true;
    setWin({ ...list[i % list.length], i, at: Date.now() });
    const hide = () => {
      if (hover.current) { winTimers.current.push(setTimeout(hide, 1500)); return; }
      winOn.current = false;
      setWin(null);
    };
    winTimers.current.push(setTimeout(hide, 9500));
  };

  useEffect(() => {
    let alive = true;
    api("/api/stories/").then((d) => {
      if (!alive) return;
      stories.current = (d.stories || []).slice(0, 12);
      if (pending.current) showWin.current(true);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // Story start (first play + every replay) → show her once. A deliberate replay brings her back even after ✕ (scam pop-ups stay hidden).
  useEffect(() => {
    const onStart = () => showWin.current();
    window.addEventListener("sh-story-start", onStart);
    // first page load: show once (the story, if it plays, starts in this same tick — deduped above)
    if (!off) showWin.current();
    return () => { window.removeEventListener("sh-story-start", onStart); winTimers.current.forEach(clearTimeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Left-side scam warnings: slow loop, paused while hovering, never alongside the success pop-up.
  useEffect(() => {
    if (off) return;
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const mobile = () => innerWidth < 760;
    const pastHero = () => scrollY > innerHeight * 0.8;
    const t0 = Date.now();
    const ready = () => (mobile() ? pastHero() : scrollY > innerHeight * 0.35 || Date.now() - t0 > 18000);
    const showScam = () => {
      if (hover.current || winOn.current || !ready()) return later(showScam, 2500);
      setScam({ ...SCAMS[n.current.s++ % SCAMS.length], at: Date.now() });
      later(() => setScam(null), 9000);
      later(showScam, 9000 + (mobile() ? 14000 : 12000));
    };
    later(showScam, 11000);
    return () => timers.forEach(clearTimeout);
  }, [off]);

  const close = () => { setOff(true); setScam(null); setWin(null); winOn.current = false; try { sessionStorage.setItem("prothom_popups_off", "1"); } catch { /* */ } };
  if (off && !win) return null;
  const hv = { onMouseEnter: () => (hover.current = true), onMouseLeave: () => (hover.current = false) };

  return (
    <>
      {scam && (
        <aside className="pp pp-scam" key={scam.at} role="status" {...hv}>
          <button className="pp-x" onClick={close} aria-label="Hide pop-ups">✕</button>
          <div className="pp-tag">🚩 {bn ? "স্ক্যাম অ্যালার্ট" : "Scam alert"}</div>
          <div className="pp-sms">
            <small>{scam.from}</small>
            <p className="bn">{scam.msg}</p>
            <span className="pp-stamp">SCAM</span>
          </div>
          <p className="pp-lesson"><b className={bn ? "bn" : ""}>{bn ? scam.lesson : scam.en}</b></p>
        </aside>
      )}
      {win && (
        <aside className="pp pp-win" key={win.at} role="status" {...hv}>
          <button className="pp-x" onClick={close} aria-label="Hide pop-ups">✕</button>
          <Celebrate i={0} />
          <div className="pp-body">
            <div className="pp-tag g">🎉 {bn ? "চাকরি পেয়েছে!" : "Got hired!"} {win.is_demo && <em>{bn ? "নমুনা" : "Sample"}</em>}</div>
            <b>{win.name} — {win.role}</b>
            <span>{win.company} · {win.major_label || win.major}{win.months_jobless ? ` · after ${win.months_jobless} months` : ""}</span>
            <p className="bn">“{(win.quote || "").slice(0, 110)}{(win.quote || "").length > 110 ? "…" : ""}”</p>
            <Link to="/stories" className="link small">{bn ? "গল্পটা পড়ো →" : "Read the story →"}</Link>
          </div>
        </aside>
      )}
    </>
  );
}
