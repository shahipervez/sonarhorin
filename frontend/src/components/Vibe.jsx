import { useRef, useState } from "react";
import { api } from "../api";
import { toast } from "../utils";

const CARDS = [
  { k: "far", e: "🗺️", bn: "ঢাকার বাইরে কাজ করতে রাজি?", en: "Happy to work outside Dhaka?" },
  { k: "remote", e: "🏠", bn: "রিমোট বা হাইব্রিড চলবে?", en: "Remote or hybrid is fine?" },
  { k: "trainee", e: "🎯", bn: "ট্রেইনি / MTO প্রোগ্রাম দেখাবো?", en: "Show trainee & MTO programs?" },
  { k: "intern", e: "🎓", bn: "ইন্টার্নশিপও দেখাবো?", en: "Show internships too?" },
  { k: "low", e: "💸", bn: "বেতন ২৫ হাজারের কম হলেও দেখবে?", en: "Okay with offers under ৳25k?" },
  { k: "auto", e: "🤖", bn: "অটো-অ্যাপ্লাই চালু করবো?", en: "Turn on auto-apply?" },
];

/** “Your vibe” — six quick swipes that set your job preferences (moved here from the home page). */
export default function Vibe({ onDone }) {
  const [i, setI] = useState(0);
  const [ans, setAns] = useState({});
  const [drag, setDrag] = useState(0);
  const start = useRef(null);
  const decide = async (yes) => {
    const c = CARDS[i]; const next = { ...ans, [c.k]: yes }; setAns(next); setDrag(yes ? 400 : -400);
    setTimeout(async () => {
      setDrag(0); setI(i + 1);
      if (i + 1 === CARDS.length) {
        const types = ["full_time", next.trainee && "trainee", next.intern && "internship"].filter(Boolean).join(",");
        try {
          await api("/api/jobs/auto-apply/", { method: "PUT", body: { enabled: !!next.auto, locations: next.far ? "" : "Dhaka, Remote", remote_only: false, job_types: types, min_salary: next.low ? null : 25000, max_per_day: 5, channels: "partner,email", note: "", majors: "" } });
          try { localStorage.setItem("prothom_vibe_done", "1"); } catch { /* */ }
          toast("Match profile saved ✓"); onDone?.(next);
        } catch (x) { toast(x.message); }
      }
    }, 260);
  };
  const c = CARDS[i];
  const pct = Math.round((i / CARDS.length) * 100);
  return (
    <div className="vibe">
      <div className="vibe-deck">
        {c ? (
          <div className="vibe-card" key={c.k} style={{ transform: `translateX(${drag}px) rotate(${drag / 18}deg)`, transition: start.current ? "none" : "transform .26s" }}
            onPointerDown={(e) => { start.current = e.clientX; e.currentTarget.setPointerCapture(e.pointerId); }}
            onPointerMove={(e) => start.current != null && setDrag(e.clientX - start.current)}
            onPointerUp={() => { const d = drag; start.current = null; if (Math.abs(d) > 90) decide(d > 0); else setDrag(0); }}>
            <span className="ve">{c.e}</span><b className="bn">{c.bn}</b><small>{c.en}</small>
            {drag > 40 && <i className="stamp yes">YES</i>}{drag < -40 && <i className="stamp no">NOPE</i>}
          </div>
        ) : <div className="vibe-card done"><span className="ve">✅</span><b>Profile done!</b><small>Your matches now follow these answers.</small></div>}
        {CARDS.slice(i + 1, i + 3).map((x, k) => <div key={x.k} className="vibe-card ghost" style={{ transform: `translateY(${(k + 1) * 8}px) scale(${1 - (k + 1) * 0.04})`, zIndex: -k - 1 }} />)}
      </div>
      {c && <div className="vibe-btns"><button className="no" onClick={() => decide(false)} aria-label="No">✕</button><button className="yes" onClick={() => decide(true)} aria-label="Yes">✓</button></div>}
      <div className="vibe-prog"><i style={{ width: `${pct}%` }} /></div>
      <small className="muted">Swipe right for yes, left for nope · {i}/{CARDS.length}</small>
    </div>
  );
}
