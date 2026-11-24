import { useMemo, useState } from "react";
import { FUNDERS, KIND } from "../../pages/startupFunders";

/**
 * The funding wall — every funder is a numbered crate (like the idea crates on the conveyor).
 * Pick your stage → crates that fit you light up and move to the front.
 */
const STAGES = [["idea", ["Just an idea", "শুধু আইডিয়া"], "💡"], ["mvp", ["Have an MVP", "MVP আছে"], "🛠️"], ["traction", ["Have users / revenue", "ইউজার / আয় আছে"], "📈"]];
const FILTERS = [["all", ["All", "সব"]], ["bd", ["🇧🇩 Bangladesh", "🇧🇩 বাংলাদেশ"]], ["global", ["🌍 Global", "🌍 গ্লোবাল"]], ["free", ["No equity", "ইকুইটি ছাড়া"]]];

export default function FunderBoard({ L, stage: initialStage = "" }) {
  const [stage, setStage] = useState(initialStage);
  const [filter, setFilter] = useState("all");

  const list = useMemo(() => {
    const f = FUNDERS.map((x, i) => ({ ...x, n: i + 1, fit: !!stage && x.stage.includes(stage) }))
      .filter((x) => filter === "all" || (filter === "free" ? x.equityFree : x.region === filter));
    return stage ? [...f].sort((a, b) => Number(b.fit) - Number(a.fit) || a.n - b.n) : f;
  }, [stage, filter]);
  const fits = list.filter((x) => x.fit).length;

  return (
    <div className="fb">
      <div className="fb-controls">
        <div className="fb-stage">
          <span>{L ? "তুমি কোথায় আছো?" : "Where are you?"}</span>
          {STAGES.map(([k, t, ic]) => (
            <button key={k} type="button" className={stage === k ? "on" : ""} onClick={() => setStage(stage === k ? "" : k)}>{ic} {t[L]}</button>
          ))}
        </div>
        <div className="fb-filter">
          {FILTERS.map(([k, t]) => <button key={k} type="button" className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>{t[L]}</button>)}
        </div>
      </div>
      {stage && <p className="fb-fits" key={stage + filter}><b>{fits}</b> {L ? "টা তোমার সাথে মেলে" : fits === 1 ? "funder fits you" : "funders fit you"}</p>}

      <div className="fb-grid">
        {list.map((x, i) => (
          <a key={x.id} href={x.url} target="_blank" rel="noopener noreferrer"
            className={`fb-crate k-${x.kind} ${x.fit ? "fit" : ""} ${stage && !x.fit ? "dim" : ""}`} style={{ "--i": i }}>
            <span className="fb-tape" aria-hidden="true" />
            <span className="fb-no">#{String(x.n).padStart(2, "0")}</span>
            <span className="fb-tags">
              <em>{KIND[x.kind][L]}</em>
              <i>{x.region === "bd" ? "🇧🇩" : "🌍"}</i>
            </span>
            <b className="fb-name">{x.name}</b>
            <small className="fb-by">{x.by[L]}</small>
            <strong className={`fb-gives ${L ? "bn" : ""}`}>{x.gives[L]}</strong>
            <span className={`fb-note ${L ? "bn" : ""}`}>{x.note[L]}</span>
            <span className="fb-foot">
              {x.equityFree && <span className="fb-stamp">{L ? "ইকুইটি-ফ্রি" : "EQUITY-FREE"}</span>}
              <span className="fb-go">{L ? "আবেদন" : "Apply"} ↗</span>
            </span>
            {x.fit && <span className="fb-ribbon">{L ? "তোমার জন্য ✓" : "Fits you ✓"}</span>}
          </a>
        ))}
      </div>
    </div>
  );
}
