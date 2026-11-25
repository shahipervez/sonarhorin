import { useEffect, useState } from "react";

/**
 * Hero story, told inside a phone like Instagram stories:
 * Arif's business fails → father says no → friends say no → he sees Nadia's "we got funded" post
 * → opens সোনারহরিণ → free counselor → pitches → selected by Microsoft for Startups.
 */
const SCENES = ["loss", "father", "friends", "post", "signup", "counselor", "pitch", "selected"];
const CAP = {
  loss: ["Arif's shop shut down. ৳3.2 lakh gone.", "আরিফের দোকান বন্ধ। ৩.২ লাখ টাকা লস।"],
  father: ["He asked his father for help. No.", "বাবার কাছে টাকা চাইল। না।"],
  friends: ["He asked his friends. Nobody helped.", "বন্ধুদের কাছে চাইল। কেউ দিল না।"],
  post: ["Then he saw Nadia's post on Facebook.", "তারপর ফেসবুকে নাদিয়ার পোস্ট দেখল।"],
  signup: ["He opened সোনারহরিণ — free account.", "সোনারহরিণ খুলল — ফ্রি অ্যাকাউন্ট।"],
  counselor: ["A counselor guided him. Free.", "একজন কাউন্সেলর গাইড করলেন। ফ্রি।"],
  pitch: ["He pitched his idea.", "সে তার আইডিয়া পিচ করল।"],
  selected: ["Selected by Microsoft for Startups!", "মাইক্রোসফট ফর স্টার্টআপসে সিলেক্টেড!"],
};
const MS = 3400;

function Bubble({ me, d = 0, children }) {
  return <div className={`hp-b ${me ? "me" : ""}`} style={{ "--d": `${d}ms` }}>{children}</div>;
}
function Typing({ d }) {
  return <div className="hp-b hp-typing" style={{ "--d": `${d}ms` }}><i /><i /><i /></div>;
}
function Head({ av, name, sub, bg }) {
  return (
    <div className="hp-head">
      <span className="hp-back">‹</span>
      <span className="hp-av" style={{ background: bg }}>{av}</span>
      <div><b>{name}</b>{sub && <small>{sub}</small>}</div>
    </div>
  );
}

function Screen({ s, L }) {
  switch (s) {
    case "loss":
      return (
        <div className="hp-scr hp-loss">
          <div className="hp-apptop"><b>{L ? "দোকানের হিসাব" : "Shop sales"}</b><small>2026</small></div>
          <svg className="hp-chart" viewBox="0 0 240 120" aria-hidden="true">
            <path className="hp-line" d="M5 30 L45 26 L80 38 L115 34 L150 62 L185 80 L235 110" />
            <path d="M5 30 L45 26 L80 38 L115 34 L150 62 L185 80 L235 110 L235 120 L5 120 Z" fill="url(#hpRed)" opacity=".35" />
            <defs><linearGradient id="hpRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#EF4444" /><stop offset="1" stopColor="#EF4444" stopOpacity="0" /></linearGradient></defs>
          </svg>
          <strong className="hp-minus">−৳3,20,000</strong>
          <span className="hp-closed">{L ? "দোকান বন্ধ" : "SHOP CLOSED"}</span>
        </div>
      );
    case "father":
      return (
        <div className="hp-scr hp-chat">
          <Head av="👨🏽‍🦳" name={L ? "আব্বা" : "Abba"} sub={L ? "অনলাইন" : "online"} bg="#E0E7FF" />
          <div className="hp-msgs">
            <Bubble me d={200}>{L ? "আব্বা, ব্যবসায় লস হইছে… একটু টাকা লাগবে 🙏" : "Abba, the business failed… I need a little money 🙏"}</Bubble>
            <Typing d={900} />
            <Bubble d={1700}>{L ? "আর ব্যবসা না। চাকরি খোঁজো।" : "No more business. Find a job."}</Bubble>
          </div>
        </div>
      );
    case "friends":
      return (
        <div className="hp-scr hp-chat">
          <Head av="🍵" name={L ? "বন্ধুরা" : "Friends"} sub={L ? "৫ জন" : "5 members"} bg="#FDE68A" />
          <div className="hp-msgs">
            <Bubble me d={200}>{L ? "কেউ ৫০ হাজার ধার দিবি? আবার শুরু করবো" : "Can anyone lend ৳50k? I want to restart"}</Bubble>
            <Bubble d={1000}><em>Rakib</em>{L ? "দোস্ত, আমি নিজেই টাইট 😅" : "Bro, I'm broke myself 😅"}</Bubble>
            <Bubble d={1700}><em>Sumon</em>{L ? "পরে কথা বলি" : "talk later"}</Bubble>
            <span className="hp-seen" style={{ "--d": "2300ms" }}>{L ? "৫ জন দেখেছে" : "Seen by 5"}</span>
          </div>
        </div>
      );
    case "post":
      return (
        <div className="hp-scr hp-fb">
          <div className="hp-fbtop">facebook</div>
          <div className="hp-post">
            <div className="hp-post-h"><span className="hp-av" style={{ background: "#FBCFE8" }}>N</span><div><b>Nadia Rahman</b><small>{L ? "২ ঘণ্টা" : "2h"} · 🌐</small></div></div>
            <p>{L ? "আলহামদুলিল্লাহ! আমাদের স্টার্টআপ ফান্ড পেয়েছে 🎉 গুগলে “startup fund guide Bangladesh” খুঁজে সোনারহরিণ পেয়েছিলাম — ফ্রি কাউন্সেলর পিচ রেডি করে দিয়েছেন।" : "Alhamdulillah! Our startup got funded 🎉 I googled “startup fund guide Bangladesh”, found সোনারহরিণ — a free counselor got my pitch ready."}</p>
            <div className="hp-post-img"><span>🚀</span><b>{L ? "আমরা ফান্ডেড!" : "WE GOT FUNDED"}</b></div>
            <div className="hp-react"><span>👍❤️🎉 2.4K</span><span>{L ? "৩১২ কমেন্ট" : "312 comments"}</span></div>
          </div>
        </div>
      );
    case "signup":
      return (
        <div className="hp-scr hp-signup">
          <div className="hp-logo">🦌<b>সোনারহরিণ</b></div>
          <small>{L ? "ফ্রি অ্যাকাউন্ট খোলো" : "Create your free account"}</small>
          <label><span>{L ? "নাম" : "Name"}</span><i className="hp-type">Arif Hasan</i></label>
          <label><span>{L ? "ফোন" : "Phone"}</span><i className="hp-type d2">01•••••••42</i></label>
          <button type="button" tabIndex={-1} className="hp-cta">{L ? "অ্যাকাউন্ট খোলো" : "Create account"}<i>✓</i></button>
        </div>
      );
    case "counselor":
      return (
        <div className="hp-scr hp-call">
          <span className="hp-free">FREE · {L ? "কাউন্সেলর" : "Counselor"}</span>
          <div className="hp-face">👩🏽‍💼</div>
          <b className="hp-call-n">Farzana · {L ? "স্টার্টআপ কাউন্সেলর" : "Startup counselor"}</b>
          <div className="hp-sub">{L ? "“৩টা ঘর দিয়ে শুরু করো: আইডিয়া, সমস্যা, সমাধান।”" : "“Start with 3 boxes: idea, problem, solution.”"}</div>
          <div className="hp-me">🧑🏽</div>
          <div className="hp-ctrl"><i>🎤</i><i>📷</i><i className="end">📞</i></div>
        </div>
      );
    case "pitch":
      return (
        <div className="hp-scr hp-pitch">
          <div className="hp-slide">
            <small>{L ? "পিচ" : "PITCH"} · 3/8</small>
            <b>ShopKhata</b>
            <span>{L ? "ছোট দর্জিদের অর্ডার, এক অ্যাপে" : "Orders for small tailors, in one app"}</span>
            <div className="hp-boxes"><i>💡</i><i>❗</i><i>✅</i></div>
          </div>
          <div className="hp-score"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="32" /><circle className="f" cx="40" cy="40" r="32" /></svg><b>82</b></div>
          <div className="hp-wave">{Array.from({ length: 22 }, (_, i) => <i key={i} style={{ "--i": i }} />)}</div>
        </div>
      );
    case "selected":
      return (
        <div className="hp-scr hp-mail">
          <div className="hp-mail-top">{L ? "ইনবক্স" : "Inbox"}</div>
          <div className="hp-mail-card">
            <div className="hp-mail-from"><span className="hp-av" style={{ background: "#E0F2FE" }}>M</span><div><b>Microsoft for Startups</b><small>{L ? "এইমাত্র" : "now"}</small></div></div>
            <b className="hp-mail-s">{L ? "তুমি সিলেক্টেড! 🎉" : "You're in! 🎉"}</b>
            <p>{L ? "স্বাগতম, আরিফ। ShopKhata প্রোগ্রামে সিলেক্ট হয়েছে — ক্লাউড ক্রেডিট আর মেন্টর অপেক্ষা করছে।" : "Welcome, Arif. ShopKhata has been accepted — cloud credits and mentors are waiting."}</p>
          </div>
          <div className="hp-confetti" aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ "--i": i }} />)}</div>
        </div>
      );
    default:
      return null;
  }
}

export default function HeroPhoneStory({ L }) {
  const [at, setAt] = useState(0);
  const [hold, setHold] = useState(false);
  useEffect(() => {
    if (hold) return;
    const t = setTimeout(() => setAt((a) => (a + 1) % SCENES.length), at === SCENES.length - 1 ? MS * 1.6 : MS);
    return () => clearTimeout(t);
  }, [at, hold]);
  const s = SCENES[at];
  const go = (d) => setAt((a) => (a + d + SCENES.length) % SCENES.length);

  return (
    <div className="hp" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}>
      <span className="hp-tag">{L ? "একটা গল্প" : "A story"} · {at + 1}/{SCENES.length}</span>
      <div className="hp-phone">
        <div className="hp-notch" />
        <div className="hp-bars">
          {SCENES.map((k, i) => (
            <span key={k} className={i < at ? "done" : i === at ? "now" : ""}>
              <i style={i === at ? { animationDuration: `${s === "selected" ? MS * 1.6 : MS}ms`, animationPlayState: hold ? "paused" : "running" } : undefined} />
            </span>
          ))}
        </div>
        <div className="hp-screen" key={s}><Screen s={s} L={L} /></div>
        <button type="button" className="hp-tap l" onClick={() => go(-1)} aria-label={L ? "আগের" : "Previous"} />
        <button type="button" className="hp-tap r" onClick={() => go(1)} aria-label={L ? "পরের" : "Next"} />
      </div>
      <p className={`hp-cap ${L ? "bn" : ""}`} key={`c${s}`}>{CAP[s][L]}</p>
    </div>
  );
}
