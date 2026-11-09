import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

const WHY = [
  ["🎲", "Randomized", "Every candidate gets a different question set and option order."],
  ["⏱", "Server-timed", "Each question has its own timer, kept on our server — not your browser."],
  ["➡️", "No going back", "One question at a time. Answers lock when you move on."],
  ["👀", "Proctored", "Tab switches, copy/paste and leaving full screen are recorded. 4 tab switches end the test."],
  ["📷", "Webcam (when required)", "Periodic snapshots are shared only with the hiring company."],
  ["1️⃣", "One attempt", "One genuine attempt per test. The score + integrity score go on a verifiable certificate."],
];

export default function Efficiency() {
  const [tests, setTests] = useState(null);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();
  useEffect(() => { api("/api/assessments/efficiency/").then(setTests).catch(() => setTests([])); }, []);

  const byCode = async (e) => {
    e.preventDefault(); setErr("");
    try { const t = await api(`/api/assessments/efficiency/code/${code.trim()}/`); nav(`/efficiency/${t.id}`); }
    catch { setErr("No active test with that invite code."); }
  };

  return (
    <div className="page"><div className="wrap">
      <div className="page-head"><div>
        <p className="eyebrow">07 · Efficiency Test</p>
        <h1 className="h2">The test companies <em>trust</em><br />before you join.</h1>
        <p className="muted lead2">A strict, proctored test of your major, aptitude and workplace English. Pass it once — share the verified result with any employer.</p>
      </div></div>

      <div className="why-grid">{WHY.map(([e, t, d]) => <div key={t} className="why-item"><span>{e}</span><b>{t}</b><p>{d}</p></div>)}</div>

      <div className="card mt">
        <h3 className="card-t">Got an invite code from a company?</h3>
        <form className="row" onSubmit={byCode}>
          <input className="inp" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. 7KX2QZ9A" />
          <button className="btn btn-ink sm">Open test</button>
        </form>
        {err && <p className="err">{err}</p>}
      </div>

      <h3 className="sec-t">Open tests</h3>
      {!tests ? <p className="muted">Loading…</p> : (
        <div className="pgrid">
          {tests.map((t) => (
            <Link key={t.id} to={`/efficiency/${t.id}`} className="pcard" style={{ "--k": "#0E0F0C" }}>
              <div className="pc-top"><span className="kbadge">{t.company_name}</span>{t.my_session && <span className="tag g">{t.my_session.status === "in_progress" ? "In progress" : "Taken"}</span>}</div>
              <h3>{t.title}</h3>
              <p>{t.description}</p>
              <div className="pmeta">
                <span>📝 {t.question_count} questions</span><span>⏱ {t.seconds_per_question}s each (~{t.total_minutes} min)</span>
                <span>🎯 Pass {t.pass_percent}%</span><span>🛡 Integrity ≥ {t.min_integrity}%</span>
                {t.require_webcam && <span>📷 Webcam</span>}{t.require_fullscreen && <span>⛶ Full screen</span>}
              </div>
              <div className="pfoot"><span>{t.major}</span><span className="fgo">Open →</span></div>
            </Link>
          ))}
        </div>
      )}
      <p className="muted small mt">Employers: create private tests and see every candidate's score, integrity flags and snapshots from the admin panel.</p>
    </div></div>
  );
}
