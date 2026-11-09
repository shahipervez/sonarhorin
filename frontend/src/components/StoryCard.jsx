import { useState } from "react";

const MAJOR_COLOR = { CSE: "#FFC23D", EEE: "#7CC4FF", BBA: "#FFB86B", English: "#FF8FB1", Pharmacy: "#B9A6FF", Textile: "#B9A6FF", Other: "#E8B634" };
const isBn = (s = "") => /[ঀ-৿]/.test(s);
const initials = (n = "") => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

/** Flip card: front = before → after, back = the journey timeline. */
export default function StoryCard({ s }) {
  const [flip, setFlip] = useState(false);
  const before = s.cv_score_before, after = s.cv_score_after;
  const steps = [
    { c: "bad", t: `${s.months_jobless || "?"} months searching`, d: `${s.applications_before || "Many"} CVs sent, almost no replies` },
    { c: "", t: "Joined সোনারহরিণ", d: s.university || s.major_label },
    before != null && { c: "", t: `CV score ${before}% → ${after ?? "…"}%`, d: "Fixed with the CV report" },
    s.tests_passed > 0 && { c: "", t: `${s.tests_passed} skill test${s.tests_passed > 1 ? "s" : ""} passed`, d: s.verified ? "Verified certificate" : "Major-based quick tests" },
    { c: "good", t: `Hired${s.days_to_hire ? ` · day ${s.days_to_hire}` : ""}`, d: `${s.role} at ${s.company}` },
  ].filter(Boolean);

  return (
    <article className={`scard ${flip ? "flip" : ""}`} style={{ "--mc": MAJOR_COLOR[s.major] || "#FFC23D" }}>
      <div className="scard-in">
        <div className="scard-face front">
          <header>
            <span className="av">{initials(s.name)}</span>
            <div><b>{s.name}</b><small>{s.major} · {s.university || s.city}</small></div>
            {s.is_demo ? <span className="badge sample" title="Sample story for the prototype">Sample</span>
              : s.verified ? <span className="badge ver" title="Has a valid সোনারহরিণ certificate">✓ Verified</span> : null}
          </header>
          <div className="ba">
            <span className="rej">REJECTED ×{s.applications_before || "?"}</span>
            <span className="arrow">→</span>
            <span className="hired">HIRED</span>
          </div>
          <p className="role"><b>{s.role}</b> · {s.company}</p>
          <blockquote className={isBn(s.quote) ? "bn" : ""}>“{s.quote}”</blockquote>
          <div className="nums">
            {before != null && after != null && (
              <div className="cvbar" aria-label={`CV score ${before} to ${after}`}>
                <span>CV score</span>
                <div className="track"><i className="b" style={{ width: `${before}%` }} /><i className="a" style={{ "--w": `${after}%` }} /></div>
                <em>{before}→<b>{after}</b></em>
              </div>
            )}
            <div className="chips">
              <span>⏳ {s.months_jobless} mo jobless</span>
              {s.days_to_hire != null && <span>🚀 hired in {s.days_to_hire} days</span>}
            </div>
          </div>
          <button className="flipbtn" onClick={() => setFlip(true)}>See the journey ↻</button>
        </div>
        <div className="scard-face back" aria-hidden={!flip}>
          <h4>{s.name.split(" ")[0]}'s journey</h4>
          <ol className="tl">
            {steps.map((st, i) => <li key={i} className={st.c} style={{ "--i": i }}><b>{st.t}</b><span>{st.d}</span></li>)}
          </ol>
          <button className="flipbtn" onClick={() => setFlip(false)}>↺ Back</button>
        </div>
      </div>
    </article>
  );
}
