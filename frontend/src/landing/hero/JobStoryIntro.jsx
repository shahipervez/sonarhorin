import { useCallback, useEffect, useRef, useState } from "react";
import { isLite } from "../../lite";

/**
 * "2 AM" — a 6-second story that opens the Find-a-Job hero.
 *   0.0s  a rejection email lands on a phone in the dark
 *   1.7s  the email dissolves… "But look up."  — stars streak in and gather into constellations
 *   3.1s  "Every star is a real job, open today." — constellation lines draw themselves
 *   4.1s  each category card rises out of its constellation on a beam of light, the title lands
 *   5.9s  done → normal interactive hero
 * Plays once per browser session (Replay button in the hero footer). Skippable. Off for reduced-motion.
 */
export const STORY_END = 5.9;
const KEY = "sh_job_story_seen";
/** window CustomEvent fired every time the intro story starts (first play or Replay). detail: { kind } */
export const STORY_EVENT = "sh-story-start";

export function useJobStory(enabled, kind = "job") {
  const [t0, setT0] = useState(null);
  const [played, setPlayed] = useState(false);
  const timer = useRef(null);
  const start = useCallback(() => {
    clearTimeout(timer.current);
    const now = performance.now();
    setT0(now);
    setPlayed(true);
    try { sessionStorage.setItem(KEY + kind, "1"); } catch { /* ignore */ }
    timer.current = setTimeout(() => setT0(null), STORY_END * 1000);
    // Let the rest of the page (e.g. the success-story pop-up on page 1) react to "the story just started".
    try { window.__shStoryStart = { kind, at: Date.now() }; window.dispatchEvent(new CustomEvent(STORY_EVENT, { detail: { kind } })); } catch { /* ignore */ }
  }, [kind]);
  const skip = useCallback(() => { clearTimeout(timer.current); setT0(null); }, []);

  useEffect(() => {
    if (!enabled) return;
    let seen = false;
    try { seen = !!sessionStorage.getItem(KEY + kind); } catch { /* ignore */ }
    const still = matchMedia?.("(prefers-reduced-motion: reduce)").matches || isLite(); // lite mode: no auto-play (Replay still works)
    if (!seen && !still) start(); else { setT0(null); setPlayed(false); }
    return () => clearTimeout(timer.current);
  }, [enabled, start, kind]);

  return {
    t0,
    playing: t0 != null,
    played,
    replay: () => { scrollTo({ top: 0, behavior: "smooth" }); start(); },
    skip,
  };
}

const INTERN = {
  mail: [
    { from: "Career Fair · Booth 12", sub: "Sorry — we need at least 6 months of experience.", time: "10:42 AM" },
    { from: "ক্যারিয়ার ফেয়ার · বুথ ১২", sub: "দুঃখিত — কমপক্ষে ৬ মাসের অভিজ্ঞতা লাগবে।", time: "সকাল ১০:৪২" },
  ],
  c1: ["Jobs want experience. Experience wants a job.", "চাকরি চায় অভিজ্ঞতা। অভিজ্ঞতা চায় চাকরি।"],
  c2: ["So… take the first flight.", "তাহলে… প্রথম ফ্লাইটটা ধরো।"],
  c3: ["Every internship is a boarding pass.", "প্রতিটা ইন্টার্নশিপ — একটা বোর্ডিং পাস।"],
  c4: ["Now boarding: your first real experience.", "এখন বোর্ডিং: তোমার প্রথম আসল অভিজ্ঞতা।"],
};
const LINES = {
  mail: [
    { from: "HR Team · Dream Corp Ltd.", sub: "Unfortunately, we have decided to move forward with other candidates…", time: "2:07 AM" },
    { from: "HR টিম · ড্রিম কর্প লিমিটেড", sub: "দুঃখিত, আমরা অন্য প্রার্থীদের নিয়ে এগোনোর সিদ্ধান্ত নিয়েছি…", time: "রাত ২:০৭" },
  ],
  c1: ["Application #63. Another “no”.", "৬৩ নম্বর আবেদন। আবারও “না”।"],
  c2: ["But look up…", "কিন্তু একবার আকাশের দিকে তাকাও…"],
  c3: ["Every star is a real job, open today.", "প্রতিটা তারা — আজকের একটা আসল চাকরি।"],
  c4: ["Yours is up there too.", "তোমারটাও ওখানেই আছে।"],
};

export default function JobStoryIntro({ story, L, kind = "job" }) {
  if (!story.playing) return null;
  const T = kind === "internship" ? INTERN : LINES;
  const m = T.mail[L];
  return (
    <div className={`jx jx-${kind} ${L ? "bn" : ""}`} key={story.t0} aria-live="polite">
      <div className="jx-vignette" />
      <div className="jx-phone">
        <div className="jx-note">
          <span className="jx-app">{kind === "internship" ? "🎪" : "✉"}</span>
          <div>
            <b>{m.from}</b>
            <p>{m.sub}</p>
          </div>
          <time>{m.time}</time>
        </div>
      </div>
      <p className="jx-cap c1">{T.c1[L]}</p>
      <p className="jx-cap c2">{T.c2[L]}</p>
      <p className="jx-cap c3"><i>{kind === "internship" ? "✈" : "✦"}</i> {T.c3[L]}</p>
      <p className="jx-cap c4">{T.c4[L]}</p>
      <div className="jx-bar"><i /></div>
      <button type="button" className="jx-skip" onClick={story.skip}>
        {L ? "স্কিপ" : "Skip story"} <span>⏭</span>
      </button>
    </div>
  );
}
