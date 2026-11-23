import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Planet } from "./InternPlanets";

/**
 * Internships hero — left: Rafi's story (when → which internship → where to find it),
 * right: a side-view line-up of 5 planets (sun at the edge, real relative sizes).
 * Tap a planet → it flies forward spinning fast, then its live openings appear.
 */
const SYS = [
  { id: "unpaid", planet: ["Venus", "শুক্র"], size: 46, label: "up", one: ["The morning star — your first light.", "শুকতারা — তোমার প্রথম আলো।"] },
  { id: "paid", planet: ["Earth", "পৃথিবী"], size: 50, label: "down", one: ["Home — where you earn a living.", "ঘর — যেখানে রোজগার হয়।"] },
  { id: "corporate", planet: ["Saturn", "শনি"], size: 112, label: "up", one: ["The ringed giant — big & structured.", "বলয়ওয়ালা দানব — বড় ও গোছানো।"] },
  { id: "remote", planet: ["Uranus", "ইউরেনাস"], size: 80, label: "down", one: ["Spins its own way — work from anywhere.", "নিজের মতো ঘোরে — যেকোনো জায়গা থেকে কাজ।"] },
  { id: "versity", planet: ["Neptune", "নেপচুন"], size: 78, label: "up", one: ["The last planet — your final semester.", "শেষ গ্রহ — শেষ সেমিস্টার।"] },
];
const BY = Object.fromEntries(SYS.map((p) => [p.id, p]));

// Rafi's 4 years, in time order
const STORY = [
  { id: "unpaid", when: ["1st–2nd year", "১ম–২য় বর্ষ"], line: ["No experience yet — learns from a mentor.", "অভিজ্ঞতা নেই — মেন্টরের কাছে শেখে।"], where: ["Startups · NGOs", "স্টার্টআপ · এনজিও"] },
  { id: "paid", when: ["3rd year", "৩য় বর্ষ"], line: ["Has a skill now — earns ৳15k a month.", "এখন স্কিল আছে — মাসে ৳১৫k আয়।"], where: ["Tech startups · agencies", "টেক স্টার্টআপ · এজেন্সি"] },
  { id: "remote", when: ["Semester break", "সেমিস্টার ব্রেক"], line: ["Home in Rajshahi — keeps working online.", "রাজশাহীতে বাড়িতে — অনলাইনে কাজ চলে।"], where: ["Online & global teams", "অনলাইন ও গ্লোবাল টিম"] },
  { id: "versity", when: ["Final semester", "শেষ সেমিস্টার"], line: ["His degree needs a credit internship.", "ডিগ্রির জন্য ক্রেডিট ইন্টার্নশিপ লাগবে।"], where: ["Banks · telcos (uni letter)", "ব্যাংক · টেলকো (ভার্সিটির চিঠি)"] },
  { id: "corporate", when: ["After graduation", "গ্র্যাজুয়েশনের পর"], line: ["Joins a big company — gets a job offer.", "বড় কোম্পানিতে — চাকরির অফার।"], where: ["MNCs & big local brands", "এমএনসি ও বড় দেশি ব্র্যান্ড"] },
];

function Story({ L, cats, active, setActive, onPick, sel, counts, n2 }) {
  const [hold, setHold] = useState(false);
  useEffect(() => {
    if (hold || sel) return;
    const t = setInterval(() => setActive((a) => (a + 1) % STORY.length), 3200);
    return () => clearInterval(t);
  }, [hold, sel, setActive]);
  const byCat = Object.fromEntries(cats.map((c) => [c.id, c]));
  // walk the little figure to the active chapter
  const olRef = useRef(null);
  const [walkY, setWalkY] = useState(0);
  const cur = sel ? STORY.findIndex((s) => s.id === sel) : active;
  useLayoutEffect(() => {
    const li = olRef.current?.children[cur + 1];
    if (li) setWalkY(li.offsetTop + 8);
  }, [cur, L]);
  return (
    <div className="isx-story" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}>
      <div className="isx-story-head">
        <span className="isx-rafi">R</span>
        <div>
          <b className={L ? "bn" : ""}>{L ? "রাফির গল্প" : "Rafi's story"}</b>
          <small>{L ? "CSE · ৪ বছর · ৫টা ইন্টার্নশিপ" : "CSE · 4 years · 5 internships"}</small>
        </div>
      </div>
      <ol className="isx-steps" ref={olRef}>
        <span className="isx-walker" aria-hidden="true" style={{ top: walkY }}>🚶</span>
        {STORY.map((s, i) => {
          const c = byCat[s.id];
          const on = sel ? sel === s.id : i === active;
          return (
            <li key={s.id} className={on ? "on" : ""} style={{ "--c": c?.c }}>
              <button type="button" onClick={() => onPick(s.id)} onMouseEnter={() => !sel && setActive(i)}>
                <span className="isx-when">{s.when[L]}</span>
                <b className={L ? "bn" : ""}>{c?.icon} {c?.name[L]}</b>
                <p className={L ? "bn" : ""}>{s.line[L]}</p>
                <span className="isx-where">📍 {s.where[L]}</span>
                <em>{n2(counts[s.id] || 0, L)} {L ? "টি খোলা" : "open"} →</em>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Focus({ L, id, cat, cats, from, list, count, daysLeft, n2, onBack, onSwitch, onSeeAll, onOpenJob }) {
  const ref = useRef(null);
  const p = BY[id];
  // switch planets without going back: arrows, keyboard ← →, or the strip on top
  const go = (d) => {
    const i = SYS.findIndex((s) => s.id === id);
    const next = SYS[(i + d + SYS.length) % SYS.length].id;
    const r = ref.current?.getBoundingClientRect();
    onSwitch(next, r ? { left: r.left + d * 220, top: r.top, width: r.width * 0.4, height: r.height * 0.4 } : null);
  };
  useEffect(() => {
    const k = (e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  });
  // fly in from where the planet was in the line-up
  useLayoutEffect(() => {
    const el = ref.current; if (!el || !from) return;
    const to = el.getBoundingClientRect();
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    const s = from.width / to.width;
    el.animate([
      { transform: `translate(${dx}px, ${dy}px) scale(${s})`, filter: "blur(0px)" },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 60}px) scale(${(s + 1) / 2})`, filter: "blur(1.4px)", offset: 0.55 },
      { transform: "none", filter: "blur(0px)" },
    ], { duration: 1000, easing: "cubic-bezier(.65,0,.25,1)" });
  }, [id, from]);

  return (
    <div className="isx-focus" style={{ "--c": cat.c }}>
      <div className="isx-mini">
        <button type="button" className="isx-back" onClick={onBack}>← {L ? "সব গ্রহ" : "All planets"}</button>
        <div className="isx-switch" role="tablist" aria-label={L ? "গ্রহ বদলাও" : "Switch planet"}>
          {SYS.map((s) => (
            <button key={s.id} type="button" role="tab" aria-selected={s.id === id} className={`isx-mini-p ${s.id === id ? "on" : ""}`}
              onClick={(e) => s.id !== id && onSwitch(s.id, e.currentTarget.querySelector(".pl")?.getBoundingClientRect())}>
              <Planet id={s.id} size={s.id === "corporate" ? 34 : 26} />
              <small>{cats[s.id]?.name[L]}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="isx-focus-main">
        <div className="isx-stage">
          <button type="button" className="isx-arrow" onClick={() => go(-1)} aria-label={L ? "আগের গ্রহ" : "Previous planet"}>‹</button>
          <div className="isx-big" ref={ref} key={id}><Planet id={id} size={190} spin={false} /><span className="isx-warp" /></div>
          <button type="button" className="isx-arrow" onClick={() => go(1)} aria-label={L ? "পরের গ্রহ" : "Next planet"}>›</button>
        </div>
        <div className="isx-focus-txt">
          <small>{p.planet[L]}</small>
          <h2 className={L ? "bn" : ""}>{cat.icon} {cat.name[L]}</h2>
          <p className={L ? "bn" : ""}>{p.one[L]}</p>
        </div>
      </div>
      <div className="isx-open" key={`o${id}`}>
        <div className="isx-open-head"><b>{L ? "এখন খোলা" : "Open now"}</b><span>{n2(count, L)}</span></div>
        {list.map((j, k) => {
          const dl = daysLeft(j.deadline);
          return (
            <button key={j.id} type="button" className="isx-job" style={{ "--k": k }} onClick={() => onOpenJob(j)}>
              <span className="isx-logo" style={{ background: j.company?.color || cat.c }}>{(j.company?.name || "?").charAt(0)}</span>
              <span className="isx-job-t"><b>{j.title}</b><small>{j.company?.name}</small></span>
              <span className="isx-job-m">
                <em>{j.salary_min ? `৳${Math.round(j.salary_min / 1000)}k` : "—"}</em>
                {dl != null && <small className={dl <= 5 ? "hot" : ""}>{n2(dl, L)}{L ? " দিন" : "d"}</small>}
              </span>
            </button>
          );
        })}
        {!list.length && <p className="isx-none">{L ? "এখন নেই — প্রতি সপ্তাহে নতুন আসে।" : "None right now — new ones land weekly."}</p>}
        {count > list.length && <button type="button" className="isx-all" onClick={onSeeAll}>{L ? `সব ${n2(count, L)}টি দেখো ↓` : `See all ${count} ↓`}</button>}
      </div>
    </div>
  );
}

export default function InternSystem({ cats, sel, counts, onSelect, L, top, onSeeAll, onOpenJob, daysLeft, n2 }) {
  const [active, setActive] = useState(0);
  const [from, setFrom] = useState(null);
  const byCat = Object.fromEntries(cats.map((c) => [c.id, c]));
  const storyId = STORY[active].id;

  const pick = (id, rect) => {
    if (!byCat[id]) return;
    setFrom(rect || document.querySelector(`.isx-row [data-p="${id}"] .pl`)?.getBoundingClientRect() || null);
    onSelect(id);
    const i = STORY.findIndex((s) => s.id === id); if (i >= 0) setActive(i);
  };

  useEffect(() => {
    if (!sel) return;
    const esc = (e) => e.key === "Escape" && onSelect("");
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [sel, onSelect]);

  return (
    <div className={`isx ${sel ? "has-sel" : ""}`}>
      <Story L={L} cats={cats} active={active} setActive={setActive} sel={sel} counts={counts} n2={n2} onPick={(id) => pick(id)} />

      <div className="isx-space">
        {!sel || !byCat[sel] ? (
          <>
            <span className="isx-sun" aria-hidden="true" />
            <div className="isx-row">
              {SYS.map((s) => {
                const c = byCat[s.id]; if (!c) return null;
                const here = storyId === s.id;
                return (
                  <button key={s.id} type="button" data-p={s.id} className={`isx-p ${s.label} ${here ? "here" : ""}`} style={{ "--c": c.c }}
                    onClick={(e) => pick(s.id, e.currentTarget.querySelector(".pl")?.getBoundingClientRect())}>
                    <span className="isx-tag">
                      <span className="isx-lab">
                        <b className={L ? "bn" : ""}>{c.name[L]}</b>
                        <small>({n2(counts[s.id] || 0, L)} {L ? "টি খোলা" : "open"})</small>
                      </span>
                      <span className="isx-line" />
                    </span>
                    <span className="isx-orb">
                      {here && <span className="isx-pin">{L ? "রাফি এখানে" : "Rafi is here"}</span>}
                      <Planet id={s.id} size={s.size} />
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="isx-hint">{L ? "একটা গ্রহে চাপ দাও" : "Tap a planet"}</p>
          </>
        ) : (
          <Focus L={L} id={sel} cat={byCat[sel]} cats={byCat} from={from} list={top(sel)} count={counts[sel] || 0} daysLeft={daysLeft} n2={n2}
            onBack={() => { setFrom(null); onSelect(""); }} onSwitch={(id, r) => pick(id, r)} onSeeAll={onSeeAll} onOpenJob={onOpenJob} />
        )}
      </div>
    </div>
  );
}
