import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTrack, hasChosenTrack, useTrack } from "../track";
import { useLang } from "../i18n";
import EntryGate from "../landing/EntryGate";
import FeaturedCompanies from "../components/FeaturedCompanies";
import Experience from "../landing/Experience";
import Hero from "../landing/Hero";
import Painter from "../landing/Painter";
import Playlist from "../landing/Playlist";
import Popups from "../landing/Popups";
import Roadmap from "../landing/Roadmap";
import Services from "../landing/Services";
import StoryAnimation from "../landing/StoryAnimation";
import SuccessStories from "../landing/SuccessStories";
import Tutorial from "../landing/Tutorial";

/**
 * Page 1. First visit → “তুমি কেন এসেছো?” (Job / Internship / Startup). Everything below then follows that choice:
 * hero world (Categories with Living Visual Background) → interactive tutorial walkthrough → services (horizontal) → the film → your road → সোনারহরিণ TV → experience → painter → stories.
 */
export default function Home() {
  const nav = useNavigate();
  const [track, setTrack] = useTrack();
  const [gate, setGate] = useState(() => !hasChosenTrack());

  useEffect(() => {
    if (track === "startup") {
      nav("/startup", { replace: true });
      return;
    }
    if (track === "internship") {
      nav("/internships", { replace: true });
      return;
    }
  }, [track, nav]);

  useEffect(() => {
    // Record initial history state if not yet set
    if (typeof window !== "undefined") {
      if (!window.history.state) {
        window.history.replaceState({ gate: !hasChosenTrack(), track: getTrack() }, "");
      }
    }

    const onPopState = (e) => {
      // Whenever the user clicks the browser Back or Forward button:
      if (e.state && e.state.gate) {
        setGate(true);
      } else if (!e.state || (!e.state.track && e.state.gate !== false)) {
        setGate(true);
      } else if (e.state && e.state.track) {
        setTrack(e.state.track);
        setGate(false);
      }
    };

    const onOpen = () => {
      if (typeof window !== "undefined") {
        window.history.pushState({ gate: true }, "", "/?gate=1");
      }
      setGate(true);
    };

    window.addEventListener("popstate", onPopState);
    window.addEventListener("open_track_gate", onOpen);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("open_track_gate", onOpen);
    };
  }, [setTrack]);

  const handleOpenGate = () => {
    if (typeof window !== "undefined") {
      window.history.pushState({ gate: true }, "", "/?gate=1");
    }
    setGate(true);
  };

  const [lang] = useLang();
  const L = lang === "bn" ? 1 : 0;

  return (
    <>
      {gate && <EntryGate onDone={() => setGate(false)} />}
      <Hero ready={!gate} />
      {!gate && (
        <button
          type="button"
          className="floating-back-gate"
          onClick={handleOpenGate}
          title={L ? "৩টি অপশনে ফিরে যাও" : "Go back to 3 options"}
        >
          <span className="fbg-arrow">←</span>
          <span className="fbg-lbl">
            {track === "job"
              ? L ? "💼 জব খুঁজছি" : "💼 Find a Job"
              : track === "internship"
              ? L ? "🎓 ইন্টার্নশিপ" : "🎓 Internship"
              : L ? "🚀 স্টার্টআপ" : "🚀 Idea to Business"}
          </span>
          <span className="fbg-badge">{L ? "বদলান" : "Switch Track"}</span>
        </button>
      )}
      {!gate && <Popups />}
      <FeaturedCompanies />
      {/* Job Galaxy now lives in the "Find a Job" hero background (JobStarSky) */}
      <Tutorial />
      <Services />
      <StoryAnimation />
      <Roadmap />
      <Playlist />
      {track !== "startup" && <Experience />}
      <Painter />
      <SuccessStories />
    </>
  );
}
