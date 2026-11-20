import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { useLang } from "../i18n";
import "../styles/guide-bot.css";

/**
 * Guide Bot — "where is what on সোনারহরিণ?"
 * 1. Answers instantly in the browser: every page + common how-to questions, in English, Bangla and Banglish.
 * 2. Only when it can't match a question does it ask the backend (/api/guide/, Claude if a key is configured).
 * 3. Last resort: offers to search jobs/internships for what was typed.
 */

// ---- every page the bot can send people to ----
const PAGES = [
  { path: "/jobs", icon: "💼", t: ["Fresher jobs", "ফ্রেশার চাকরি"], d: ["Entry-level jobs with 1-tap apply. Filter by your major.", "এন্ট্রি-লেভেল চাকরি, ১-ট্যাপে আবেদন। মেজর দিয়ে ফিল্টার করো।"],
    k: ["job", "jobs", "chakri", "chakrir", "chakuri", "চাকরি", "চাকুরি", "জব", "কাজ", "vacancy", "hiring", "নিয়োগ", "salary", "বেতন", "fresher", "ফ্রেশার", "apply", "আবেদন", "career", "ক্যারিয়ার"] },
  { path: "/internships", icon: "🎓", t: ["Internships", "ইন্টার্নশিপ"], d: ["Paid, learning, versity-credit, corporate and remote internships.", "পেইড, লার্নিং, ভার্সিটি ক্রেডিট, কর্পোরেট ও রিমোট ইন্টার্নশিপ।"],
    k: ["intern", "internship", "internships", "ইন্টার্ন", "ইন্টার্নশিপ", "stipend", "স্টাইপেন্ড", "credit", "ক্রেডিট", "practicum", "remote", "রিমোট", "unpaid", "paid", "পেইড"] },
  { path: "/programs", icon: "🏛️", t: ["Programs & trainings", "প্রোগ্রাম ও ট্রেনিং"], d: ["Graduate programs, internship programs and offline trainings.", "গ্র্যাজুয়েট প্রোগ্রাম, ইন্টার্নশিপ প্রোগ্রাম ও অফলাইন ট্রেনিং।"],
    k: ["program", "programs", "training", "trainee", "graduate program", "mto", "প্রোগ্রাম", "ট্রেনিং", "ট্রেইনি", "course", "কোর্স", "workshop"] },
  { path: "/cv", icon: "⚖️", t: ["Judge Yourself (CV check)", "জাজ ইওরসেলফ (সিভি চেক)"], d: ["Upload your CV — see your rejection % and exactly what to fix.", "সিভি আপলোড করো — রিজেকশন % আর কী ঠিক করতে হবে দেখো।"],
    k: ["cv", "resume", "ats", "সিভি", "রেজুমে", "রিজিউম", "বায়োডাটা", "biodata", "judge", "reject", "rejection", "রিজেক্ট", "check my cv", "score"] },
  { path: "/studio", icon: "✂️", t: ["CV Studio", "সিভি স্টুডিও"], d: ["Tailor your CV to one specific job with AI.", "এআই দিয়ে নির্দিষ্ট একটা চাকরির জন্য সিভি সাজাও।"],
    k: ["studio", "tailor", "customize", "make cv", "build cv", "create cv", "cv banabo", "সিভি বানাবো", "সিভি তৈরি", "সাজাও", "cover letter", "কভার লেটার"] },
  { path: "/quick-test", icon: "📝", t: ["Quick Test", "কুইক টেস্ট"], d: ["A short MCQ test for your major (BBA, CSE, EEE…).", "তোমার মেজরের ছোট এমসিকিউ টেস্ট (BBA, CSE, EEE…)।"],
    k: ["quick test", "mcq", "এমসিকিউ", "quiz", "কুইজ", "test", "টেস্ট", "পরীক্ষা", "exam", "bba", "cse", "eee"] },
  { path: "/interview", icon: "🎙️", t: ["AI mock interview", "এআই মক ইন্টারভিউ"], d: ["A 10-minute AI interviewer with instant feedback.", "১০ মিনিটের এআই ইন্টারভিউ, সাথে সাথে ফিডব্যাক।"],
    k: ["interview", "ইন্টারভিউ", "mock", "মক", "viva", "ভাইভা", "practice", "প্র্যাকটিস", "question", "প্রশ্ন"] },
  { path: "/coach", icon: "🧭", t: ["Interview Coach", "ইন্টারভিউ কোচ"], d: ["Paste one job — get likely questions and model answers for it.", "একটা চাকরি দাও — সম্ভাব্য প্রশ্ন আর উত্তর পাবে।"],
    k: ["coach", "কোচ", "prep", "prepare", "preparation", "প্রস্তুতি", "prostuti", "answers", "উত্তর"] },
  { path: "/certificates", icon: "🏆", t: ["Certificates", "সার্টিফিকেট"], d: ["Earn verified certificates and verify one by its code.", "ভেরিফায়েড সার্টিফিকেট নাও, কোড দিয়ে যাচাই করো।"],
    k: ["certificate", "certificates", "certification", "সার্টিফিকেট", "সনদ", "verify", "যাচাই"] },
  { path: "/efficiency", icon: "⚡", t: ["Efficiency Test", "এফিসিয়েন্সি টেস্ট"], d: ["The pre-joining efficiency test companies use.", "কোম্পানিগুলো যে প্রি-জয়েনিং এফিসিয়েন্সি টেস্ট নেয়।"],
    k: ["efficiency", "এফিসিয়েন্সি", "speed", "typing", "typing test", "টাইপিং", "pre-joining", "employer"] },
  { path: "/portfolio", icon: "🌐", t: ["Portfolio builder", "পোর্টফোলিও বিল্ডার"], d: ["Make your own portfolio website in a few clicks.", "কয়েক ক্লিকে নিজের পোর্টফোলিও ওয়েবসাইট।"],
    k: ["portfolio", "পোর্টফোলিও", "website", "ওয়েবসাইট", "personal site", "github"] },
  { path: "/network", icon: "🤝", t: ["Network", "নেটওয়ার্ক"], d: ["Connect and chat with students; find a co-founder.", "শিক্ষার্থীদের সাথে কানেক্ট ও চ্যাট; কো-ফাউন্ডার খোঁজো।"],
    k: ["network", "নেটওয়ার্ক", "connect", "friend", "বন্ধু", "chat", "চ্যাট", "message", "co-founder", "cofounder", "কো-ফাউন্ডার", "community", "discord"] },
  { path: "/startup", icon: "🚀", t: ["Startup fund", "স্টার্টআপ ফান্ড"], d: ["Build a pitch, score 45+, get up to ৳10L pre-seed.", "পিচ বানাও, ৪৫+ স্কোর করো, ৳১০ লাখ পর্যন্ত প্রি-সিড।"],
    k: ["startup", "স্টার্টআপ", "idea", "আইডিয়া", "fund", "funding", "ফান্ড", "invest", "investor", "ইনভেস্টর", "pitch", "পিচ", "business", "ব্যবসা", "taka", "টাকা", "seed"] },
  { path: "/stories", icon: "🎬", t: ["Success stories", "সাকসেস স্টোরি"], d: ["Real stories and videos of freshers who made it.", "যারা পেরেছে, সেই ফ্রেশারদের গল্প ও ভিডিও।"],
    k: ["story", "stories", "গল্প", "video", "ভিডিও", "success", "সাফল্য", "inspiration", "অনুপ্রেরণা"] },
  { path: "/applications", icon: "📬", t: ["My applications", "আমার আবেদন"], d: ["Track every job and internship you applied to.", "যেসব জায়গায় আবেদন করেছো তার স্ট্যাটাস দেখো।"],
    k: ["my application", "applications", "applied", "status", "স্ট্যাটাস", "track", "আবেদন করেছি", "shortlist", "result", "রেজাল্ট"] },
  { path: "/me", icon: "👤", t: ["My dashboard", "আমার ড্যাশবোর্ড"], d: ["Your profile, progress and recommendations.", "তোমার প্রোফাইল, অগ্রগতি আর সাজেশন।"],
    k: ["dashboard", "ড্যাশবোর্ড", "profile", "প্রোফাইল", "account", "অ্যাকাউন্ট", "settings", "my page"] },
];
const BY_PATH = Object.fromEntries(PAGES.map((p) => [p.path, p]));

// ---- how-to answers (checked before page matching) ----
const FAQ = [
  { k: ["sign up", "signup", "register", "create account", "new account", "account khul", "অ্যাকাউন্ট খুল", "রেজিস্টার", "নিবন্ধন", "join"],
    a: ["Creating an account is free and takes a minute — just your name, email and major.", "অ্যাকাউন্ট খোলা ফ্রি, এক মিনিট লাগে — শুধু নাম, ইমেইল আর মেজর।"], go: ["/register"] },
  { k: ["log in", "login", "sign in", "signin", "লগইন", "password", "পাসওয়ার্ড"],
    a: ["Use “Sign in” at the top right. Forgot the password? Use the reset link on the login page.", "উপরে ডানে “Sign in” চাপো। পাসওয়ার্ড ভুলে গেলে লগইন পেজে রিসেট লিংক আছে।"], go: ["/login"] },
  { k: ["free", "cost", "price", "fee", "ফ্রি", "খরচ", "টাকা লাগে", "taka lage", "paisa", "charge"],
    a: ["Yes — searching and applying to jobs, internships and the startup fund is free for freshers.", "হ্যাঁ — চাকরি, ইন্টার্নশিপ খোঁজা ও আবেদন আর স্টার্টআপ ফান্ডে আবেদন ফ্রেশারদের জন্য ফ্রি।"], go: ["/jobs", "/register"] },
  { k: ["how to apply", "how do i apply", "kivabe apply", "কিভাবে আবেদন", "কীভাবে আবেদন", "apply korbo", "আবেদন করব"],
    a: ["Open a job or internship and tap “Apply” (or “Board” on an internship pass). You need to be signed in; track it later in My applications.", "চাকরি বা ইন্টার্নশিপ খুলে “Apply” (ইন্টার্নশিপে “বোর্ড করো”) চাপো। লগইন লাগবে; পরে “আমার আবেদন”-এ স্ট্যাটাস দেখবে।"], go: ["/jobs", "/internships", "/applications"] },
  { k: ["no experience", "experience nai", "অভিজ্ঞতা নেই", "অভিজ্ঞতা নাই", "first job", "প্রথম চাকরি", "where to start", "kothay shuru", "কোথা থেকে শুরু", "beginner"],
    a: ["Start here: 1) check your CV in Judge Yourself, 2) take the Quick Test for your major, 3) apply to learning or paid internships.", "এভাবে শুরু করো: ১) জাজ ইওরসেলফে সিভি চেক, ২) মেজরের কুইক টেস্ট, ৩) লার্নিং বা পেইড ইন্টার্নশিপে আবেদন।"], go: ["/cv", "/quick-test", "/internships"] },
  { k: ["bangla", "বাংলা", "english", "ইংরেজি", "language", "ভাষা"],
    a: ["Switch language with the EN / বাং toggle at the top right — I'll follow it too.", "উপরে ডানে EN / বাং টগল দিয়ে ভাষা বদলাও — আমিও সেই ভাষায় কথা বলবো।"], go: [] },
];
const GREET = ["hi", "hello", "hey", "salam", "assalamu", "আসসালামু", "হাই", "হ্যালো", "kemon acho", "কেমন আছ"];
const THANKS = ["thanks", "thank you", "thx", "ধন্যবাদ", "dhonnobad", "shukria"];

// short tip for the page the visitor is on
const PAGE_TIPS = {
  "/jobs": ["You're on Jobs — use the search and major filter, then tap Apply.", "তুমি জবস পেজে — সার্চ আর মেজর ফিল্টার দিয়ে খুঁজে Apply চাপো।"],
  "/internships": ["You're on Internships — pick what you need (paid, learning, credit…) and the list filters for you.", "তুমি ইন্টার্নশিপ পেজে — কী দরকার (পেইড, লার্নিং, ক্রেডিট…) বেছে নাও, লিস্ট নিজেই ফিল্টার হবে।"],
  "/startup": ["You're on Startup — type your startup name in the hero to start a pitch.", "তুমি স্টার্টআপ পেজে — উপরে স্টার্টআপের নাম লিখে পিচ শুরু করো।"],
  "/cv": ["Upload your CV here and you'll get a rejection % plus a fix list.", "এখানে সিভি আপলোড করলে রিজেকশন % আর ঠিক করার লিস্ট পাবে।"],
};

const norm = (s) => ` ${String(s).toLowerCase().replace(/[?!.,।"“”'’()]/g, " ").replace(/\s+/g, " ").trim()} `;
// short latin keywords (cv, job…) must match a whole word; Bangla & phrases match as substrings
const hit = (text, k) => {
  const kk = k.toLowerCase();
  if (/^[a-z]{1,4}$/.test(kk)) return text.includes(` ${kk} `) || text.includes(` ${kk}s `);
  return text.includes(kk);
};
const score = (text, keys) => keys.reduce((n, k) => n + (hit(text, k) ? (k.length > 6 ? 2 : 1) : 0), 0);

const STORE = "sh_guide_chat_v2";
const welcome = () => ({
    from: "bot",
    text: ["Hi! I'm the সোনারহরিণ Guide 🦌 Tell me what you're looking for — in English, Bangla or Banglish.", "হ্যালো! আমি সোনারহরিণ গাইড 🦌 কী খুঁজছো লেখো — বাংলা, ইংরেজি বা বাংলিশে।"],
    go: ["/jobs", "/internships", "/cv", "/interview", "/startup"],
    ask: [["I have no experience", "আমার কোনো অভিজ্ঞতা নেই"], ["Is it free?", "এটা কি ফ্রি?"], ["How do I apply?", "কিভাবে আবেদন করবো?"]],
});

export default function SonarGuideBot() {
  const [lang] = useLang();
  const L = lang === "bn" ? 1 : 0;
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [msgs, setMsgs] = useState(() => {
    try { const m = JSON.parse(sessionStorage.getItem(STORE)); if (Array.isArray(m) && m.length) return m; } catch { /* ignore */ }
    return [welcome()];
  });
  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { try { sessionStorage.setItem(STORE, JSON.stringify(msgs.slice(-30))); } catch { /* ignore */ } }, [msgs]);
  useEffect(() => { if (open) { bodyRef.current?.scrollTo({ top: 1e6, behavior: "smooth" }); } }, [msgs, typing, open]);
  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 60);
    const esc = (e) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [open]);

  // don't cover full-screen tools
  const hidden = useMemo(() => /^\/(efficiency\/\d+|u\/|interview\/\d+)/.test(pathname), [pathname]);

  const reply = (m) => { setTyping(false); setMsgs((p) => [...p, { from: "bot", ...m }]); };

  const answer = async (raw) => {
    const q = raw.trim();
    if (!q) return;
    setMsgs((p) => [...p, { from: "user", text: [q, q] }]);
    setInput("");
    setTyping(true);
    const t = norm(q);
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    await wait(350);

    if (THANKS.some((k) => hit(t, k))) return reply({ text: ["Anytime! Good luck 🍀 Ask me whenever you're lost.", "যেকোনো সময়! শুভকামনা 🍀 হারিয়ে গেলে আবার জিজ্ঞেস করো।"] });

    const faq = FAQ.map((f) => ({ f, s: score(t, f.k) })).sort((a, b) => b.s - a.s)[0];
    const pages = PAGES.map((p) => ({ p, s: score(t, p.k) + (t.includes(p.path.slice(1)) ? 1 : 0) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);

    if (faq.s > 0 && faq.s >= (pages[0]?.s || 0)) {
      const go = faq.f.go.filter((g) => !(user && (g === "/register" || g === "/login")));
      return reply({ text: faq.f.a, go: go.length ? go : user ? ["/me"] : [] });
    }
    if (pages.length) {
      const top = pages[0].p;
      const also = pages.slice(1, 3).filter((x) => x.s >= pages[0].s - 1).map((x) => x.p.path);
      const needsLogin = !user && ["/applications", "/me", "/network", "/studio", "/coach", "/interview", "/quick-test", "/cv"].includes(top.path);
      return reply({
        text: [`That's ${top.t[0]}. ${top.d[0]}${needsLogin ? " (You'll need to sign in.)" : ""}`, `এটা ${top.t[1]}। ${top.d[1]}${needsLogin ? " (লগইন লাগবে।)" : ""}`],
        card: top.path,
        go: also,
      });
    }
    if (GREET.some((k) => hit(t, k))) return reply({ text: ["Hello! 👋 What are you looking for today — a job, an internship, or help with your CV?", "হ্যালো! 👋 আজ কী খুঁজছো — চাকরি, ইন্টার্নশিপ, নাকি সিভিতে সাহায্য?"], go: ["/jobs", "/internships", "/cv"] });

    // not matched locally → ask the AI guide (if the server has a key)
    try {
      const r = await api("/api/guide/", { method: "POST", body: { message: q, page: pathname, lang } });
      if (r?.reply) return reply({ text: [r.reply, r.reply], go: (r.links || []).filter((p) => BY_PATH[p] || p === "/register" || p === "/login") });
    } catch { /* offline / throttled → fall through */ }

    // last resort: treat it as a search
    reply({
      text: [`There's no page called “${q}”, but I can search the listings for it:`, `“${q}” নামে কোনো পেজ নেই, তবে লিস্টে খুঁজে দেখতে পারি:`],
      search: q,
      go: ["/jobs", "/internships", "/programs"],
    });
  };

  const go = (path) => { nav(path); setOpen(false); };
  const reset = () => { setMsgs([welcome()]); setTyping(false); };

  if (hidden) return null;

  const label = (path) => {
    const p = BY_PATH[path];
    if (p) return `${p.icon} ${p.t[L]}`;
    if (path === "/register") return L ? "📝 ফ্রি অ্যাকাউন্ট" : "📝 Create free account";
    if (path === "/login") return L ? "🔑 লগইন" : "🔑 Sign in";
    return path;
  };

  return (
    <div className="sg-bot-container">
      {!open && (
        <button type="button" className="sg-bot-trigger" onClick={() => setOpen(true)} aria-label={L ? "গাইড বট খোলো" : "Open the Guide Bot"}>
          <div className="sg-trigger-avatar">🦌<span className="sg-trigger-badge" /></div>
          <div className="sg-trigger-text">
            <span className="sg-trigger-title">{L ? "গাইড বট" : "Guide Bot"}</span>
            <span className="sg-trigger-sub">{L ? "কোথায় কী আছে? জিজ্ঞেস করো" : "Lost? Ask me anything"}</span>
          </div>
        </button>
      )}

      {open && (
        <div className="sg-bot-window" role="dialog" aria-label={L ? "সোনারহরিণ গাইড বট" : "Sonarhorin Guide Bot"}>
          <div className="sg-bot-header">
            <div className="sg-bot-header-left">
              <div className="sg-bot-header-avatar">🦌</div>
              <div className="sg-bot-header-info">
                <b>{L ? "সোনারহরিণ গাইড" : "Sonarhorin Guide"}</b>
                <span>{L ? "অনলাইন · সাধারণত সাথে সাথে উত্তর" : "Online · replies instantly"}</span>
              </div>
            </div>
            <div className="sg-bot-header-actions">
              <button type="button" className="sg-hdr-btn" onClick={reset} title={L ? "নতুন করে শুরু" : "Start over"} aria-label={L ? "নতুন করে শুরু" : "Start over"}>↺</button>
              <button type="button" className="sg-hdr-btn" onClick={() => setOpen(false)} title={L ? "বন্ধ করো" : "Close"} aria-label={L ? "বন্ধ করো" : "Close"}>✕</button>
            </div>
          </div>

          <div className="sg-bot-body" ref={bodyRef} aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`sg-msg is-${m.from}`}>
                <div className="sg-msg-avatar">{m.from === "bot" ? "🦌" : "👤"}</div>
                <div className="sg-msg-bubble">
                  <p>{m.text[L]}</p>
                  {i === 0 && PAGE_TIPS[pathname] && <p className="sg-tip">💡 {PAGE_TIPS[pathname][L]}</p>}

                  {m.card && BY_PATH[m.card] && (
                    <div className="sg-nav-card">
                      <div className="sg-nav-card-title">{BY_PATH[m.card].icon} {BY_PATH[m.card].t[L]}</div>
                      <div className="sg-nav-card-desc">{BY_PATH[m.card].d[L]}</div>
                      <button type="button" className="sg-nav-card-btn" onClick={() => go(m.card)}>
                        {pathname === m.card ? (L ? "তুমি এখানেই আছো ✓" : "You're here ✓") : (L ? "ওখানে চলো →" : "Take me there →")}
                      </button>
                    </div>
                  )}

                  {m.search && (
                    <div className="sg-chips-grid">
                      <button type="button" className="sg-chip-btn strong" onClick={() => go(`/jobs?q=${encodeURIComponent(m.search)}`)}>🔎 {L ? "চাকরিতে খোঁজো" : "Search jobs"}</button>
                      <button type="button" className="sg-chip-btn strong" onClick={() => go(`/internships?q=${encodeURIComponent(m.search)}`)}>🔎 {L ? "ইন্টার্নশিপে খোঁজো" : "Search internships"}</button>
                    </div>
                  )}

                  {m.go?.length > 0 && (
                    <div className="sg-chips-wrap">
                      {m.card && <span className="sg-chip-label">{L ? "এগুলোও দেখতে পারো:" : "You might also mean:"}</span>}
                      <div className="sg-chips-grid">
                        {m.go.map((p) => <button key={p} type="button" className="sg-chip-btn" onClick={() => go(p)}>{label(p)}</button>)}
                      </div>
                    </div>
                  )}

                  {m.ask?.length > 0 && i === msgs.length - 1 && (
                    <div className="sg-chips-wrap">
                      <span className="sg-chip-label">{L ? "অথবা জিজ্ঞেস করো:" : "Or ask:"}</span>
                      <div className="sg-chips-grid">
                        {m.ask.map((a) => <button key={a[0]} type="button" className="sg-chip-btn ask" onClick={() => answer(a[L])}>{a[L]}</button>)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="sg-msg is-bot">
                <div className="sg-msg-avatar">🦌</div>
                <div className="sg-msg-bubble sg-typing" aria-label={L ? "লিখছে" : "typing"}><i /><i /><i /></div>
              </div>
            )}
          </div>

          <div className="sg-bot-footer">
            <form className="sg-input-form" onSubmit={(e) => { e.preventDefault(); if (!typing) answer(input); }}>
              <input ref={inputRef} type="text" className="sg-bot-input" maxLength={300} value={input} onChange={(e) => setInput(e.target.value)}
                placeholder={L ? "যেমন: চাকরি কোথায়? সিভি চেক…" : "e.g. where are jobs? check my CV…"} aria-label={L ? "প্রশ্ন লেখো" : "Type your question"} />
              <button type="submit" className="sg-bot-send" disabled={!input.trim() || typing} aria-label={L ? "পাঠাও" : "Send"}>➤</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
