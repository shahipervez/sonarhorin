import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { useLang } from "../i18n";
import { setTrack } from "../track";
import GateFX from "./GateFX";
import IntroStory, { introSeen } from "./IntroStory";
import StoryCanvas from "./StoryCanvas";

const CHOICES = [
  {
    k: "job",
    t: ["Find a Job", "জব খুঁজছি"],
  },
  {
    k: "internship",
    t: ["Internship", "ইন্টার্নশিপ"],
  },
  {
    k: "startup",
    t: ["Ideas to business", "আইডিয়া থেকে বিজনেস"],
  },
];

const ICONS = {
  job: (
    <svg viewBox="0 0 48 48"><rect x="6" y="15" width="36" height="25" rx="5" /><path d="M17 15v-4a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4M6 25h36M22 25v4h4v-4" /></svg>
  ),
  internship: (
    <svg viewBox="0 0 48 48"><path d="M4 18 24 9l20 9-20 9z" /><path d="M12 22v9c0 3 6 6 12 6s12-3 12-6v-9M40 20v11" /></svg>
  ),
  startup: (
    <svg viewBox="0 0 48 48"><path d="M24 5c7 6 9 15 6 25h-12c-3-10-1-19 6-25z" /><circle cx="24" cy="18" r="3.5" /><path d="M18 30l-6 6 1-9M30 30l6 6-1-9M21 36c0 4 3 7 3 7s3-3 3-7" /></svg>
  ),
};

export default function EntryGate({ onDone }) {
  const { user, updateMe } = useAuth();
  const nav = useNavigate();
  const [picked, setPicked] = useState(null);
  const [hasPeeked, setHasPeeked] = useState(false);
  const [storyActive, setStoryActive] = useState(false);
  const [hover, setHover] = useState(null);
  const [lang, setLang] = useLang();
  const L = lang === "bn" ? 1 : 0;

  const vidRef = useRef(null);
  const storyRef = useRef(null);
  const fxRef = useRef(null);
  const lastT = useRef(0);

  // Lock body scroll while in gate
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Start the wallpaper video (girl) on mount; story begins when she pulls curtain
  useEffect(() => {
    const v = vidRef.current;
    if (!v) return;
    v.currentTime = 0;
    lastT.current = 0;
    v.play().catch(() => {});
    const fallback = setTimeout(() => {
      setHasPeeked(true);
      setStoryActive(true);
      if (storyRef.current && storyRef.current.paused) {
        storyRef.current.play().catch(() => {});
      }
    }, 2200);
    return () => clearTimeout(fallback);
  }, []);

  // The moment she pulls the curtain (~1.15s) from the right side:
  // Fire visual FX, reveal headline/cards, and start the story video on the far left!
  const PEEK = 1.15;
  const handleTimeUpdate = () => {
    const v = vidRef.current;
    if (!v) return;
    const t = v.currentTime;
    if (lastT.current < PEEK && t >= PEEK) {
      fxRef.current?.fire();
      setHasPeeked(true);
      setStoryActive(true);
      if (storyRef.current) {
        storyRef.current.currentTime = 0;
        storyRef.current.play().catch(() => {});
      }
    }
    lastT.current = t;
  };

  const replayStory = () => {
    setHasPeeked(false);
    setStoryActive(false);
    lastT.current = 0;
    if (storyRef.current) {
      storyRef.current.pause();
      storyRef.current.currentTime = 0;
    }
    if (vidRef.current) {
      vidRef.current.currentTime = 0;
      vidRef.current.play().catch(() => {});
    }
  };

  const choose = (k) => {
    setPicked(k);
    setTimeout(() => {
      setTrack(k);
      scrollTo(0, 0);
      if (user && user.track !== k) updateMe({ track: k }).catch(() => {});
      if (k === "internship") {
        onDone?.(k);
        nav("/internships");
        return;
      }
      if (k === "startup") {
        onDone?.(k);
        nav("/startup");
        return;
      }
      if (typeof window !== "undefined") {
        window.history.pushState({ gate: false, track: k }, "", `/?track=${k}`);
      }
      onDone?.(k);
    }, 380);
  };

  return (
    <div
      className={`gate ex8-dynamic-gate ${picked ? "leaving" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ex8-headline"
    >
      {/* Dual Video Backdrop: Girl pulls curtain on right, Story plays on left */}
      <div className="ex8-video-backdrop" aria-hidden="true">
        {/* Right side: Anime girl wallpaper video pulling curtain */}
        <video
          ref={vidRef}
          src="/wallpaper.mp4"
          loop
          muted
          autoPlay
          playsInline
          className="ex8-wallpaper-video"
          onTimeUpdate={handleTimeUpdate}
        />

        <div className="ex8-video-overlay" />
      </div>
      <GateFX ref={fxRef} videoRef={vidRef} />

      {/* EX8 Style Top Navigation Bar */}
      <header className="ex8-nav-bar">
        <div className="ex8-brand-col">
          <div className="ex8-brand-logo">
            <img src="/logo-gold.png" alt="" className="ex8-bn-deer" aria-hidden="true" />
            <span className="ex8-logo-bn" lang="bn"><span className="ex8-logo-symbol">সোনার</span><span className="ex8-logo-suffix">হরিণ</span></span>
          </div>
        </div>

        <div className="ex8-nav-actions">
          <button
            type="button"
            className="ex8-btn-outline ex8-story-btn"
            onClick={replayStory}
            title={L ? "পর্দা সরানো ও গল্পটি শুরু থেকে দেখো" : "Replay curtain & story"}
          >
            <span className="ex8-play">▶</span>
            <span>{L ? "গল্প" : "STORY"}</span>
          </button>

          <button
            type="button"
            className="ex8-btn-outline"
            onClick={replayStory}
            title={L ? "গল্পটি আবার দেখো" : "Replay story"}
          >
            <span>{L ? "পুনরায় প্লে" : "REPLAY PEEK"}</span>
            <span className="ex8-arrow-mini">↻</span>
          </button>

          <button
            className="lang light ex8-lang-toggle"
            onClick={() => setLang(L ? "en" : "bn")}
            aria-label={L ? "Switch to English" : "বাংলায় দেখুন"}
          >
            <span className={L ? "" : "on"}>EN</span>
            <span className={`bn ${L ? "on" : ""}`}>বাং</span>
            <i />
          </button>
        </div>
      </header>

      {/* Main Dynamic Stage */}
      <main className={`ex8-content-stage ${hasPeeked ? "peeked" : ""}`}>
        {/* STORY CONSOLE — the 3 mission cards sit on top of the (bigger) story screen like channel tabs */}
        <div className={`gx-console ${hover ? "hl-" + hover : ""}`}>
          <div className="ex8-cards-grid gx-tabs">
            {CHOICES.map((c, i) => (
              <button
                key={c.k}
                className={`ex8-compact-card gx-tab gx-${c.k} ${picked === c.k ? "chosen" : picked ? "other" : ""}`}
                style={{ "--card-order": `${0.35 + i * 0.12}s` }}
                onClick={() => !picked && choose(c.k)}
                onMouseEnter={() => setHover(c.k)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(c.k)}
                onBlur={() => setHover(null)}
              >
                <span className="gx-sweep" aria-hidden="true" />
                <div className="ex8-card-center">
                  <span className="ex8-card-icon" aria-hidden="true">{ICONS[c.k]}</span>
                  <div className="gx-title-col">
                    <h2 className={`ex8-card-big-title ${L ? "bn" : ""}`}>{c.t[L]}</h2>
                  </div>
                </div>
                <i className="gx-plug" aria-hidden="true" />
              </button>
            ))}
          </div>

          {/* The story screen (bigger, framed) */}
          <div className={`ex8-story-left-backdrop gx-screen ${storyActive ? "active" : ""}`}>
            <span className="gx-corner tl" /><span className="gx-corner tr" /><span className="gx-corner bl" /><span className="gx-corner br" />
            <span className="gx-rec"><i />{L ? "গল্প চলছে" : "NOW PLAYING"} · EP 01</span>
            <StoryCanvas active={storyActive} videoRef={vidRef} />
          </div>
        </div>

        {/* Bottom Skip Link */}
        <div className="ex8-bottom-bar">
          <button className="ex8-skip-link" onClick={() => !picked && choose("job")}>
            <span>
              {L ? "শুধু দেখছি" : "Just browsing"}
            </span>
            <span className="ex8-skip-arrow">→</span>
          </button>
        </div>
      </main>
    </div>
  );
}
