import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api, download } from "../api";
import { useAuth } from "../auth";
import { MAJORS } from "../config";

const PRIO = { critical: "Critical", high: "High", medium: "Medium", low: "Low" };

function Gauge({ value }) {
  // semicircle gauge: 0% (green) → 100% (red)
  const angle = -90 + (value / 100) * 180;
  const color = value >= 60 ? "var(--red)" : value >= 35 ? "#E8A317" : "var(--green2)";
  return (
    <div className="gauge">
      <svg viewBox="0 0 200 120">
        <defs><linearGradient id="gg" x1="0" x2="1"><stop offset="0" stopColor="#2FA36B" /><stop offset=".5" stopColor="#E8A317" /><stop offset="1" stopColor="#E5484D" /></linearGradient></defs>
        <path d="M20 105 A80 80 0 0 1 180 105" fill="none" stroke="var(--line)" strokeWidth="18" strokeLinecap="round" />
        <path d="M20 105 A80 80 0 0 1 180 105" fill="none" stroke="url(#gg)" strokeWidth="18" strokeLinecap="round" />
        <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: "100px 105px", transition: "transform 1.2s cubic-bezier(.2,1.3,.4,1)" }}>
          <line x1="100" y1="105" x2="100" y2="38" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
        </g>
        <circle cx="100" cy="105" r="8" fill="var(--ink)" />
      </svg>
      <div className="gauge-num" style={{ color }}>{value}%</div>
      <div className="gauge-lbl">chance of rejection</div>
    </div>
  );
}

export default function CVJudge() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [major, setMajor] = useState(user.major);
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [res, setRes] = useState(null);
  const [history, setHistory] = useState([]);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);
  const resRef = useRef(null);

  useEffect(() => { api("/api/cv/analyses/").then(setHistory).catch(() => {}); }, [res]);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return setErr("Choose your CV first (PDF, DOCX or TXT).");
    setBusy(true); setErr(""); setRes(null);
    const form = new FormData();
    form.append("file", file); form.append("major", major); form.append("target_role", role);
    try {
      const [r] = await Promise.all([api("/api/cv/analyze/", { method: "POST", form }), new Promise((ok) => setTimeout(ok, 1600))]);
      setRes(r);
      setTimeout(() => resRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (x) { setErr(x.message); }
    finally { setBusy(false); }
  };

  const r = res?.report;
  return (
    <div className="page">
      <div className="wrap">
        <div className="page-head">
          <div>
            <p className="eyebrow">01 · Judge Yourself</p>
            <h1 className="h2">Will your CV get <em>rejected?</em></h1>
            <p className="muted lead2">Upload your CV and our screening engine checks it the way recruiters and ATS software do — then tells you the rejection risk and exactly what to fix.</p>
          </div>
        </div>

        <form className="cv-form card" onSubmit={submit}>
          <div className={`drop ${drag ? "drag" : ""} ${file ? "has" : ""}`} onClick={() => inputRef.current.click()}
               onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
               onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); }}>
            <input ref={inputRef} type="file" accept=".pdf,.docx,.txt" hidden onChange={(e) => setFile(e.target.files[0] || null)} />
            {busy ? (
              <div className="scan"><div className="scan-page"><i /><i /><i /><i /><i /><b className="scan-line" /></div><p>Reading your CV like a recruiter…</p></div>
            ) : (
              <>
                <div className="drop-ic">📄</div>
                <p><b>{file ? file.name : "Drop your CV here"}</b></p>
                <p className="muted small">{file ? `${(file.size / 1024).toFixed(0)} KB · click to change` : "PDF, DOCX or TXT · max 5 MB"}</p>
              </>
            )}
          </div>
          <div className="cv-side">
            <label className="field"><span>Your major</span><select value={major} onChange={(e) => setMajor(e.target.value)}>{MAJORS.map((m) => <option key={m}>{m}</option>)}</select></label>
            <label className="field"><span>Target role (optional)</span><input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Junior Software Engineer" /></label>
            {err && <p className="err">{err}</p>}
            <button className="btn btn-ink wide" disabled={busy}>{busy ? "Judging…" : "Judge my CV →"}</button>
            <p className="muted small">Your CV is private to your account.</p>
          </div>
        </form>

        {r && (
          <div ref={resRef} className="cv-result">
            <div className="res-top card">
              <Gauge value={res.rejection_probability} />
              <div className="res-sum">
                <span className={`verdict v${r.score >= 80 ? 3 : r.score >= 65 ? 2 : r.score >= 45 ? 1 : 0}`}>{r.verdict}</span>
                <h2 className="h3">CV score <b>{r.score}</b>/100</h2>
                <div className="bars">
                  {r.breakdown.map((b) => (
                    <div key={b.name} className="barrow"><span>{b.name}</span><div className="bar"><i style={{ width: `${(b.earned / b.possible) * 100}%` }} /></div><em>{b.earned}/{b.possible}</em></div>
                  ))}
                </div>
                <div className="res-actions">
                  <button className="btn btn-ink sm" onClick={() => download(`/api/cv/analyses/${res.id}/pdf/`, `sonarhorin-cv-report-${res.id}.pdf`)}>⬇ Download PDF report</button>
                  <Link to="/quick-test" className="btn btn-out sm">Next: Quick Test →</Link>
                </div>
              </div>
            </div>

            <div className="two">
              <div className="card">
                <h3 className="card-t">✅ What's already strong</h3>
                <ul className="list good">{(r.strengths.length ? r.strengths : ["Nothing stood out yet — the fixes will change that."]).map((s) => <li key={s}>{s}</li>)}</ul>
                <h3 className="card-t mt">📋 Section checklist</h3>
                <div className="checks">{r.sections.map((s) => <span key={s.key} className={`chk ${s.present ? "y" : "n"}`}>{s.present ? "✓" : "✕"} {s.label}</span>)}</div>
                <h3 className="card-t mt">🔑 Keywords for {res.major}</h3>
                <div className="kw">{r.keywords.found.map((k) => <span key={k} className="tag g">{k}</span>)}{r.keywords.missing.map((k) => <span key={k} className="tag miss">+ {k}</span>)}</div>
                <p className="muted small">Green = found. Dashed = recruiters search for these — add them only if you really know them.</p>
              </div>
              <div className="card">
                <h3 className="card-t">🛠 What to fix — most important first</h3>
                <div className="fixes">
                  {r.improvements.map((f, i) => (
                    <div key={i} className={`fix p-${f.priority}`}>
                      <div className="fix-h"><span className="prio">{PRIO[f.priority]}</span><span className="sec">{f.section}</span></div>
                      <b>{f.title}</b><p>{f.tip}</p>{f.example && <p className="ex">e.g. {f.example}</p>}
                    </div>
                  ))}
                  {!r.improvements.length && <p>Nothing major to fix. 🎉</p>}
                </div>
              </div>
            </div>

            {r.ai_suggestions?.length > 0 && (
              <div className="card">
                <h3 className="card-t">✨ Line-by-line rewrites (AI)</h3>
                {r.ai_summary_line && <p className="ex">Suggested summary: {r.ai_summary_line}</p>}
                {r.ai_suggestions.map((s, i) => (
                  <div key={i} className="rewrite"><p className="before">{s.before}</p><p className="after">{s.after}</p><p className="muted small">{s.why}</p></div>
                ))}
              </div>
            )}

            <div className="card">
              <h3 className="card-t">🧭 How to arrange your CV (fresher order)</h3>
              <ol className="order">{r.recommended_order.map((s) => <li key={s}>{s}</li>)}</ol>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="card mt">
            <h3 className="card-t">Your previous checks</h3>
            <table className="tbl">
              <thead><tr><th>File</th><th>Major</th><th>Score</th><th>Rejection risk</th><th>Date</th><th /></tr></thead>
              <tbody>{history.map((h) => (
                <tr key={h.id}><td>{h.original_name}</td><td>{h.major}</td><td>{h.score}</td><td>{h.rejection_probability}%</td>
                  <td>{new Date(h.created_at).toLocaleDateString()}</td>
                  <td><button className="link" onClick={() => setRes(h)}>View</button> · <button className="link" onClick={() => download(`/api/cv/analyses/${h.id}/pdf/`, `sonarhorin-cv-report-${h.id}.pdf`)}>PDF</button></td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
