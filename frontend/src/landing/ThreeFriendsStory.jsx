import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Scribble from "../components/Scribble";

/**
 * The 3 Friends Story ("৩ বন্ধুর গল্প — চা এর দোকানে স্বপ্ন ও সোনারহরিণ")
 *
 * Narrative:
 * 3 friends sitting at a roadside tea stall (টং দোকান) in Dhaka:
 * 1. Friend 1 (আসিফ) wants a job, but everywhere asks for 2+ years exp.
 * 2. Friend 2 (সাকিব) has a great business/agritech idea, but zero funding/capital.
 * 3. Friend 3 (ফারহান) searches for a university internship, but has no references.
 * Suddenly, a phone post reveals Sonarhorin solving all 3 problems!
 * They explore the platform together and discover how it works.
 */

const SCENES = [
  {
    id: 1,
    title: "চা এর দোকানে হতাশা",
    subtitle: "The Roadside Tea Stall · ফ্রাস্ট্রেশনের রাত",
    dialogues: [
      {
        speaker: "আসিফ",
        role: "Job Seeker (ফ্রেশার)",
        avatar: "👨‍💼",
        color: "#3B82F6",
        text: "ভাইরে ভাই! যে পত্রিকাই খুলি, সব জবেই লেখে 'Minimum 2 Years Experience Required!' ফ্রেশাররা এক্সপেরিয়েন্স পাবে কই? আমি কোথায় যাব কিছুই বুঝতে পারছি না...",
        en: "Every single job post asks for 2+ years of experience! Where will freshers get experience from? Where do I go?",
      },
      {
        speaker: "সাকিব",
        role: "Startup Dreamer (আইডিয়াবাজ)",
        avatar: "💡",
        color: "#F59E0B",
        text: "আমার মাথায় এই এগ্রো-টেক স্টার্টআপের অসাধারণ প্ল্যান ঘুরতেছে। কৃষক থেকে সরাসরি ভোক্তা। কিন্তু কোনো ফান্ডিং নাই, এক টাকাও নাই! ব্যাংক তো নতুনদের চেনে না!",
        en: "I have this brilliant agro-tech startup idea to connect farmers directly with consumers. But zero funding! Banks don't even talk to fresh graduates!",
      },
      {
        speaker: "ফারহান",
        role: "Internship Seeker (ভার্সিটি স্টুডেন্ট)",
        avatar: "🎓",
        color: "#10B981",
        text: "আমার ভার্সিটির লাস্ট সেমিস্টার শেষ, ডিগ্রি কমপ্লিট করতে ইন্টার্নশিপ লাগবেই। ৫০ জায়গায় সিভি দিলাম, রেফারেন্স ছাড়া নাকি চাকরি বা ইন্টার্নশিপ পাওয়াই যায় না!",
        en: "My final semester is ending. I need an internship to graduate. Sent 50 CVs, but without references, nobody even calls back!",
      },
    ],
  },
  {
    id: 2,
    title: "ফোনে সেই ভাইরাল পোস্ট",
    subtitle: "The Turning Point · এক নোটিফিকেশনে চমক",
    dialogues: [
      {
        speaker: "ফোন নোটিফিকেশন",
        role: "Facebook & LinkedIn Viral Post",
        avatar: "📱",
        color: "#FFD700",
        text: "🔔 'চাকরি, পেইড ইন্টার্নশিপ আর স্টার্টআপ ফান্ডিং — বাংলাদেশের সব ফ্রেশার ও শিক্ষার্থীদের একমাত্র ওয়ান-স্টপ প্ল্যাটফর্ম: সোনারহরিণ!'",
        en: "Trending: 'Fresher jobs with 0-exp, paid internships & startup seed funding — all under one roof at Sonarhorin!'",
      },
      {
        speaker: "আসিফ",
        role: "Job Seeker",
        avatar: "👨‍💼",
        color: "#3B82F6",
        text: "দোস্ত! ফোনটা দেখ! এই পোস্টে কী লিখেছে দেখ! সোনারহরিণ-এ নাকি শুধু ০ বছরের ফ্রেশারদের জন্য ভেরিফাইড চাকরি আছে?!",
        en: "Guys! Look at this phone! A platform with 100% verified jobs strictly for 0-year freshers?!",
      },
      {
        speaker: "সাকিব",
        role: "Startup Dreamer",
        avatar: "💡",
        color: "#F59E0B",
        text: "দাঁড়া দাঁড়া! নিচে পড় — 'আইডিয়া থাকলে পিচ করো, সোনারহরিণ দিচ্ছে সিড ফান্ডিং ও মেন্টরশিপ!' এটা সত্যি তো?!",
        en: "Wait, read below — 'Got an idea? Pitch on Sonarhorin for seed funding & 1:1 mentorship!' Is this real?!",
      },
      {
        speaker: "ফারহান",
        role: "Internship Seeker",
        avatar: "🎓",
        color: "#10B981",
        text: "আরেহ! এই দেখ — 'পেইড, কর্পোরেট ও রিমোট ইন্টার্নশিপ! স্কিল রেডি থাকলে সরাসরি ১-ক্লিকে আবেদন!' চল এখনই ওয়েবসাইটটা খুলি!",
        en: "Look here — 'Paid, Corporate & Remote internships with 1-click apply!' Let's open the website right now!",
      },
    ],
  },
  {
    id: 3,
    title: "সোনারহরিণে প্রবেশ",
    subtitle: "Inside Sonarhorin · তিন বন্ধুর পথ খুলে গেল",
    dialogues: [
      {
        speaker: "সোনারহরিণ সিস্টেম",
        role: "The Intelligent Platform",
        avatar: "🦌",
        color: "#FFC23D",
        text: "স্বাগতম সোনারহরিণে! এখানে ফ্রেশারদের যোগ্যতা অনুযায়ী পথ সাজানো আছে: ১. ফ্রেশার জব, ২. ইন্টার্নশিপ লঞ্চপ্যাড, ৩. স্টার্টআপ ফান্ড।",
        en: "Welcome to Sonarhorin! Three tailored tracks: 1. Fresher Jobs, 2. Internship Launchpad, 3. Startup Fund.",
      },
      {
        speaker: "আসিফ",
        role: "Job Seeker",
        avatar: "👨‍💼",
        color: "#3B82F6",
        text: "আমি আইটি আর বিজনেস জব ফিল্টারে ঢুকে গেলাম! স্যালারি ট্রান্সপারেন্ট, আর ১-ক্লিকেই আমার সিভি কোম্পানির ইনবক্সে চলে গেল!",
        en: "I just filtered IT & Business jobs! Transparent salaries, and with 1-click my CV is delivered straight to HR!",
      },
      {
        speaker: "সাকিব",
        role: "Startup Dreamer",
        avatar: "💡",
        color: "#F59E0B",
        text: "আমি পিচ বিল্ডারে আমার এগ্রো-টেক আইডিয়া লিখছি! সিস্টেম তাৎক্ষণিক পিচ রেডিনেস স্কোর দিল ৮২/১০০, আর পিচ ডে-র ইনভাইটেশন পেয়ে গেলাম!",
        en: "I filled the Pitch Builder with my agritech idea! Got an 82/100 readiness score and an invite to live Pitch Day!",
      },
      {
        speaker: "ফারহান",
        role: "Internship Seeker",
        avatar: "🎓",
        color: "#10B981",
        text: "আমি স্কিল-রেডি টেস্ট দিলাম! আমার 'Skill Verified' গোল্ড ব্যাজ চলে আসল, আর শীর্ষ কর্পোরেট পেইড ইন্টার্নশিপে আবেদন হয়ে গেল!",
        en: "I took the Skill-Ready assessment! Unlocked my 'Skill Verified' badge and applied to top paid corporate internships!",
      },
    ],
  },
];

export default function ThreeFriendsStory() {
  const [activeScene, setActiveScene] = useState(0);
  const [activeDiag, setActiveDiag] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioCtxRef = useRef(null);

  const curScene = SCENES[activeScene];
  const curDiag = curScene.dialogues[activeDiag];

  // Play simple synth chime when dialogue progresses
  const playChime = (freq = 440) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (_) {}
  };

  // Auto-play dialogue progression
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(() => {
      if (activeDiag < curScene.dialogues.length - 1) {
        setActiveDiag((d) => d + 1);
        playChime(400 + (activeDiag + 1) * 80);
      } else if (activeScene < SCENES.length - 1) {
        setActiveScene((s) => s + 1);
        setActiveDiag(0);
        playChime(660);
      } else {
        // Loop back after completion
        setActiveScene(0);
        setActiveDiag(0);
      }
    }, 4200);

    return () => clearTimeout(timer);
  }, [isPlaying, activeScene, activeDiag, curScene]);

  const jumpToScene = (idx) => {
    setActiveScene(idx);
    setActiveDiag(0);
    playChime(520);
  };

  return (
    <div className="three-friends-cinema">
      {/* Cinematic Ambience Canvas Header */}
      <div className="tfc-stage">
        {/* Dhaka Tong Shop Visual Background */}
        <div className="tfc-tea-shop-backdrop">
          {/* Street light glow */}
          <div className="tfc-lamp-glow" />
          <div className="tfc-lamp-glow tfc-lamp-right" />

          {/* Steaming tea stall silhouette & elements */}
          <div className="tfc-tong-stall">
            <div className="tfc-kettle">
              <span className="tfc-steam steam-1">☁️</span>
              <span className="tfc-steam steam-2">☁️</span>
              <span className="tfc-steam steam-3">☁️</span>
              <span className="tfc-kettle-icon">🫖</span>
            </div>
            <div className="tfc-tea-cups">
              <span title="দুধ চা">☕</span>
              <span title="রং চা">🍵</span>
              <span title="লেবু চা">🫖</span>
            </div>
          </div>

          {/* 3 Friends Characters on the bench */}
          <div className="tfc-characters-strip">
            {/* Friend 1: Asif (Job) */}
            <div
              className={`tfc-friend-char ${curDiag.speaker === "আসিফ" ? "speaking" : ""}`}
              onClick={() => {
                setActiveDiag(0);
                playChime(420);
              }}
            >
              <div className="tfc-char-bubble">
                {curDiag.speaker === "আসিফ" && <span className="pulse-dot" />}
                <div className="tfc-avatar">👨‍💼</div>
              </div>
              <div className="tfc-char-name">
                <b>আসিফ</b>
                <small>চাকরি খুঁজছে</small>
              </div>
            </div>

            {/* Friend 2: Shakib (Startup) */}
            <div
              className={`tfc-friend-char ${curDiag.speaker === "সাকিব" ? "speaking" : ""}`}
              onClick={() => {
                setActiveDiag(1);
                playChime(500);
              }}
            >
              <div className="tfc-char-bubble">
                {curDiag.speaker === "সাকিব" && <span className="pulse-dot" />}
                <div className="tfc-avatar">💡</div>
              </div>
              <div className="tfc-char-name">
                <b>সাকিব</b>
                <small>স্টার্টআপ স্বপ্ন</small>
              </div>
            </div>

            {/* Friend 3: Farhan (Internship) */}
            <div
              className={`tfc-friend-char ${curDiag.speaker === "ফারহান" ? "speaking" : ""}`}
              onClick={() => {
                setActiveDiag(2);
                playChime(580);
              }}
            >
              <div className="tfc-char-bubble">
                {curDiag.speaker === "ফারহান" && <span className="pulse-dot" />}
                <div className="tfc-avatar">🎓</div>
              </div>
              <div className="tfc-char-name">
                <b>ফারহান</b>
                <small>ইন্টার্নশিপ প্রার্থী</small>
              </div>
            </div>
          </div>
        </div>

        {/* Central Speech / Story Theater */}
        <div className="tfc-dialogue-screen">
          <div className="tfc-screen-header">
            <span className="tfc-badge">
              🎬 দৃশ্য {curScene.id}/৩: {curScene.title}
            </span>
            <div className="tfc-controls">
              <button
                type="button"
                className="tfc-ctrl-btn"
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? "Pause narrative" : "Play narrative"}
              >
                {isPlaying ? "⏸️ পজ" : "▶️ প্লে"}
              </button>
              <button
                type="button"
                className={`tfc-ctrl-btn ${soundEnabled ? "on" : ""}`}
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  playChime(600);
                }}
                title="Toggle Sound Effects"
              >
                {soundEnabled ? "🔊 সাউন্ড অন" : "🔇 সাউন্ড অফ"}
              </button>
            </div>
          </div>

          {/* Active Speaking Card */}
          <div className="tfc-bubble-body" style={{ borderColor: curDiag.color }}>
            <div className="tfc-speaker-info">
              <span className="tfc-speaker-avatar">{curDiag.avatar}</span>
              <div>
                <b className="tfc-speaker-name" style={{ color: curDiag.color }}>
                  {curDiag.speaker}
                </b>
                <span className="tfc-speaker-role">{curDiag.role}</span>
              </div>
            </div>

            <p className="tfc-speech-text bn">"{curDiag.text}"</p>
            <p className="tfc-speech-en">{curDiag.en}</p>
          </div>

          {/* Scene Selectors */}
          <div className="tfc-scene-nav">
            {SCENES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                className={`tfc-scene-pill ${activeScene === idx ? "active" : ""}`}
                onClick={() => jumpToScene(idx)}
              >
                <span>দৃশ্য {s.id}</span>
                <small>{s.title}</small>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* The Smartphone Discovery Experience */}
      <div className="tfc-phone-stage">
        <div className="tfc-phone-frame">
          <div className="tfc-phone-notch" />
          <div className="tfc-phone-screen">
            <div className="tfc-phone-bar">
              <span>9:41 PM</span>
              <span className="tfc-phone-brand">🦌 সোনারহরিণ অ্যাপ</span>
              <span>5G 📶 100%</span>
            </div>

            <div className="tfc-phone-content">
              <div className="tfc-viral-card">
                <span className="tfc-post-tag">🔥 TRENDING IN BANGLADESH</span>
                <h4 className="tfc-post-title">
                  ৩ বন্ধুর সব স্বপ্নের উত্তর এক জায়গায় — সোনারহরিণ
                </h4>
                <p className="tfc-post-desc">
                  চাকরি খুঁজছো? ০ বছরের ফ্রেশার জব। স্টার্টআপ করবে? সিড ফান্ডিং ও মেন্টরশিপ।
                  ইন্টার্নশিপ চাই? পেইড ও কর্পোরেট সুযোগ!
                </p>
              </div>

              {/* 3 Interactive Solutions for the 3 Friends */}
              <div className="tfc-solutions-grid">
                <div className="tfc-sol-item job-sol">
                  <div className="tfc-sol-top">
                    <span>👨‍💼 আসিফের সমাধান</span>
                    <span className="badge-tag">0 EXP JOBS</span>
                  </div>
                  <b>ফ্রেশার ভেরিফাইড চাকরি</b>
                  <p>২ বছর অভিজ্ঞতার বাধা নেই। সরাসরি ১-ট্যাপ আবেদন।</p>
                  <Link to="/jobs" className="tfc-sol-btn">
                    জব দেখো →
                  </Link>
                </div>

                <div className="tfc-sol-item startup-sol">
                  <div className="tfc-sol-top">
                    <span>💡 সাকিবের সমাধান</span>
                    <span className="badge-tag">SEED FUND</span>
                  </div>
                  <b>স্টার্টআপ পিচ বিল্ডার</b>
                  <p>টাকা নেই? আইডিয়া পিচ করো, ফান্ডিং ও গ্রান্টস পাও।</p>
                  <a href="#builder" className="tfc-sol-btn gold">
                    আইডিয়া পিচ করো →
                  </a>
                </div>

                <div className="tfc-sol-item intern-sol">
                  <div className="tfc-sol-top">
                    <span>🎓 ফারহানের সমাধান</span>
                    <span className="badge-tag">PAID INTERN</span>
                  </div>
                  <b>স্কিল-রেডি ইন্টার্নশিপ</b>
                  <p>রেফারেন্স লাগবে না। স্কিল টেস্ট দিয়ে কর্পোরেট ইন্টার্ন।</p>
                  <Link to="/jobs?type=internship" className="tfc-sol-btn">
                    ইন্টার্নশিপ নাও →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
