import { useEffect, useMemo, useState } from "react";

/**
 * Internship solar system — 5 real planets, each standing for one internship type.
 * Tap a planet → it zooms up, its meaning appears, and that type's internships drop down beneath it.
 */
export const PLANETS = {
  unpaid: {
    planet: ["Venus", "শুক্র"], cls: "venus",
    why: ["The Morning Star — the first light you see in the sky.", "শুকতারা — আকাশে ভোরের প্রথম আলো।"],
    so: ["A learning internship is your first light: no salary, but a mentor, real tasks and a certificate.", "লার্নিং ইন্টার্নশিপ তোমার প্রথম আলো: বেতন নেই, কিন্তু মেন্টর, আসল কাজ আর সার্টিফিকেট।"],
  },
  paid: {
    planet: ["Earth", "পৃথিবী"], cls: "earth",
    why: ["Home — the planet where people earn a living.", "আমাদের ঘর — যেখানে মানুষ রোজগার করে বাঁচে।"],
    so: ["A paid internship pays a monthly stipend while you learn — real work, real money.", "পেইড ইন্টার্নশিপে শিখতে শিখতেই মাসে স্টাইপেন্ড — আসল কাজ, আসল টাকা।"],
  },
  corporate: {
    planet: ["Saturn", "শনি"], cls: "saturn",
    why: ["The giant with rings — big, structured, impossible to miss.", "বলয়ওয়ালা দানব — বড়, গোছানো, চোখে পড়বেই।"],
    so: ["A corporate internship = a big company, rings of structured training around you, and often a PPO (job offer).", "কর্পোরেট ইন্টার্নশিপ = বড় কোম্পানি, চারপাশে গোছানো ট্রেনিংয়ের বলয়, আর প্রায়ই PPO (চাকরির অফার)।"],
  },
  remote: {
    planet: ["Uranus", "ইউরেনাস"], cls: "uranus",
    why: ["It spins on its side — it does things its own way.", "কাত হয়ে ঘোরে — নিজের নিয়মে চলে।"],
    so: ["A remote internship lets you work your own way, from anywhere in Bangladesh — laptop + Wi-Fi.", "রিমোট ইন্টার্নশিপে নিজের মতো কাজ, বাংলাদেশের যেকোনো জায়গা থেকে — ল্যাপটপ + ওয়াই-ফাই।"],
  },
  versity: {
    planet: ["Neptune", "নেপচুন"], cls: "neptune",
    why: ["The last planet of the system — the end of the journey.", "সৌরজগতের শেষ গ্রহ — যাত্রার শেষ ধাপ।"],
    so: ["A versity-credit internship is your final-semester step: it counts toward your degree so you graduate on time.", "ভার্সিটি ক্রেডিট ইন্টার্নশিপ শেষ সেমিস্টারের ধাপ: ডিগ্রির ক্রেডিটে গোনা হয়, সময়মতো গ্র্যাজুয়েশন।"],
  },
};
// real order from the sun
export const PLANET_ORDER = ["unpaid", "paid", "corporate", "remote", "versity"];

export function Planet({ id, size = 90, spin = true }) {
  const p = PLANETS[id];
  return (
    <span className={`pl pl-${p.cls} ${spin ? "spin" : ""}`} style={{ "--s": `${size}px` }} aria-hidden="true">
      {(p.cls === "saturn" || p.cls === "uranus") && <i className="pl-ring back" />}
      <span className="pl-body"><span className="pl-surface" /><span className="pl-shade" /></span>
      {(p.cls === "saturn" || p.cls === "uranus") && <i className="pl-ring front" />}
    </span>
  );
}

function Stars() {
  const stars = useMemo(() => Array.from({ length: 70 }, (_, i) => ({
    x: (i * 137.5) % 100, y: (i * 53.3 + (i % 7) * 11) % 100, s: i % 9 === 0 ? 3 : i % 3 === 0 ? 2 : 1, d: (i % 10) * 0.4,
  })), []);
  return <div className="ipl-stars" aria-hidden="true">{stars.map((s, i) => <i key={i} style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${s.d}s` }} />)}</div>;
}

/**
 * props: cats (STORY_SETS.internship), sel (id | ""), counts, onSelect(id|""), L,
 *        facts (GATE_FACTS), story (GATE_STORIES), top (id → 4 jobs), onSeeAll(id), onOpenJob(job), daysLeft, n2
 */
export default function InternPlanets({ cats, sel, counts, onSelect, L, facts, story, top, onSeeAll, onOpenJob, daysLeft, n2 }) {
  const [hover, setHover] = useState("");
  const byId = Object.fromEntries(cats.map((c) => [c.id, c]));
  const cur = sel ? byId[sel] : null;
  const P = sel ? PLANETS[sel] : null;
  const list = sel ? top(sel) : [];

  useEffect(() => {
    if (!sel) return;
    const esc = (e) => e.key === "Escape" && onSelect("");
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [sel, onSelect]);

  return (
    <div className={`ipl ${sel ? "has-sel" : ""}`}>
      <Stars />
      <span className="ipl-sun" aria-hidden="true" />
      <svg className="ipl-orbit" viewBox="0 0 1000 200" preserveAspectRatio="none" aria-hidden="true"><ellipse cx="500" cy="100" rx="490" ry="78" /></svg>

      {/* the system */}
      <div className="ipl-row" role="tablist" aria-label={L ? "ইন্টার্নশিপের ধরন" : "Internship types"}>
        {PLANET_ORDER.map((id, i) => {
          const c = byId[id]; if (!c) return null;
          const on = sel === id;
          return (
            <button key={id} type="button" role="tab" aria-selected={on}
              className={`ipl-p ${on ? "on" : ""} ${sel && !on ? "dim" : ""}`}
              style={{ "--c": c.c, "--i": i }}
              onClick={() => onSelect(on ? "" : id)}
              onMouseEnter={() => setHover(id)} onMouseLeave={() => setHover("")}>
              <span className="ipl-float"><Planet id={id} size={on ? 112 : 84} /></span>
              <b className={L ? "bn" : ""}>{PLANETS[id].planet[L]}</b>
              <small className={L ? "bn" : ""}>{c.icon} {c.name[L]}</small>
              <em>{n2(counts[id] || 0, L)} {L ? "টি" : "open"}</em>
              {hover === id && !on && <span className="ipl-tip">“{facts[id].need[L]}”</span>}
            </button>
          );
        })}
      </div>

      {!sel && <p className="ipl-hint">👆 {L ? "একটা গ্রহে চাপ দাও — দেখো তার মানে কী, আর কোন ইন্টার্নশিপ আছে" : "Tap a planet to see what it means — and which internships orbit it"}</p>}

      {/* focus: the chosen planet zooms in, meaning + internships drop below */}
      {sel && cur && (
        <div className="ipl-focus" style={{ "--c": cur.c }} key={sel}>
          <div className="ipl-focus-planet"><Planet id={sel} size={210} /></div>
          <div className="ipl-focus-text">
            <span className="ipl-kicker">{L ? "তুমি এখন" : "You landed on"} <b>{P.planet[L]}</b></span>
            <h2 className={L ? "bn" : ""}>{cur.icon} {cur.name[L]} {L ? "ইন্টার্নশিপ" : "internship"}</h2>
            <p className={`ipl-why ${L ? "bn" : ""}`}><span>🪐</span>{P.why[L]}</p>
            <p className={`ipl-so ${L ? "bn" : ""}`}>{P.so[L]}</p>
            <dl className="ipl-facts">
              {[["💰", L ? "টাকা" : "Pay", "pay"], ["⏱️", L ? "সময়" : "Length", "length"], ["🎯", L ? "কার জন্য" : "Best for", "best"], ["🎁", L ? "যা পাবে" : "You get", "get"]].map(([ic, lab, k]) => (
                <div key={k}><dt>{ic} {lab}</dt><dd className={L ? "bn" : ""}>{facts[sel][k][L]}</dd></div>
              ))}
            </dl>
            <details className="ipl-story">
              <summary>{L ? `একটা বাস্তব উদাহরণ — ${story[sel].who[1]}` : `A real example — ${story[sel].who[0]}`}</summary>
              <ol>{story[sel].beats.map((b, k) => <li key={k}><i>{b.actors[0]}</i><span className={L ? "bn" : ""}>{b.t[L]}</span></li>)}</ol>
            </details>
          </div>
          <button type="button" className="ipl-close" onClick={() => onSelect("")} aria-label={L ? "সৌরজগতে ফেরো" : "Back to the system"}>✕</button>

          <div className="ipl-drop">
            <div className="ipl-drop-head">
              <b className={L ? "bn" : ""}>{L ? `${P.planet[1]}-এর কক্ষপথে ইন্টার্নশিপ` : `Internships orbiting ${P.planet[0]}`}</b>
              <span>{n2(counts[sel] || 0, L)} {L ? "টি খোলা" : "open"}</span>
            </div>
            <div className="ipl-jobs">
              {list.map((j, k) => {
                const dl = daysLeft(j.deadline);
                return (
                  <button key={j.id} type="button" className="ipl-job" style={{ "--k": k }} onClick={() => onOpenJob(j)}>
                    <span className="ipl-job-logo" style={{ background: j.company?.color || cur.c }}>{(j.company?.name || "?").charAt(0)}</span>
                    <span className="ipl-job-txt"><b>{j.title}</b><small>{j.company?.name}{j.remote ? ` · ${L ? "রিমোট" : "Remote"}` : j.location ? ` · ${j.location}` : ""}</small></span>
                    <span className="ipl-job-meta">
                      <em>{j.salary_min ? `৳${Math.round(j.salary_min / 1000)}k${j.salary_max ? `–${Math.round(j.salary_max / 1000)}k` : ""}` : (L ? "সার্টিফিকেট" : "Certificate")}</em>
                      {dl != null && <small className={dl <= 5 ? "hot" : ""}>{n2(dl, L)}{L ? " দিন বাকি" : "d left"}</small>}
                    </span>
                  </button>
                );
              })}
              {!list.length && <p className="ipl-empty">{L ? "এই গ্রহে এখন কোনো ইন্টার্নশিপ নেই — নতুনগুলো প্রতি সপ্তাহে আসে।" : "Nothing orbiting this planet right now — new internships land every week."}</p>}
            </div>
            {(counts[sel] || 0) > 0 && (
              <button type="button" className="ip-btn gold ipl-all" onClick={() => onSeeAll(sel)}>
                {L ? `সব ${n2(counts[sel], L)}টি দেখো ও আবেদন করো` : `See all ${counts[sel]} & apply`} ↓
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
