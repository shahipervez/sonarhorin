import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { MAJORS, useConfig } from "../config";
import Ring from "../components/Ring";
import { confetti, mmss } from "../utils";

export default function QuickTest() {
  const { user } = useAuth();
  const { quick_test: cfg } = useConfig();
  const [major, setMajor] = useState(user.major);
  const [test, setTest] = useState(null);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState({});
  const [left, setLeft] = useState(0);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const submitted = useRef(false);
  const answersRef = useRef({});
  answersRef.current = answers;

  const start = async () => {
    setErr("");
    try {
      const t = await api("/api/assessments/quick/start/", { method: "POST", body: { major } });
      submitted.current = false; setTest(t); setI(0); setAnswers({}); setResult(null);
      setLeft(Math.round((new Date(t.expires_at) - Date.now()) / 1000));
    } catch (x) { setErr(x.message); }
  };

  const submit = async () => {
    if (submitted.current) return; submitted.current = true;
    try {
      const r = await api(`/api/assessments/quick/${test.attempt_id}/submit/`, { method: "POST", body: { answers: answersRef.current } });
      setResult(r); if (r.passed) confetti(); scrollTo({ top: 0, behavior: "smooth" });
    } catch (x) { setErr(x.message); submitted.current = false; }
  };

  useEffect(() => {
    if (!test || result) return;
    const id = setInterval(() => setLeft((s) => { if (s <= 1) { clearInterval(id); submit(); return 0; } return s - 1; }), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test, result]);

  // ---------- result
  if (result) {
    return (
      <div className="page"><div className="wrap narrow">
        <p className="eyebrow">03 · Quick Test · {test.major}</p>
        <div className="card res-quick">
          <Ring value={result.percent} size={140} color={result.passed ? "var(--green2)" : "var(--red)"} sub={`${result.correct}/${result.total} correct`} />
          <div>
            <h1 className="h2">{result.passed ? "Passed! 🎉" : "Not yet — keep going."}</h1>
            <p className="muted">Pass mark is {test.pass_percent}%. {result.late && "Submitted after the timer — answers were not counted."}</p>
            {result.certificate_code && <p className="cert-note">🏅 Certificate earned · <Link className="link" to="/certificates">{result.certificate_code}</Link></p>}
            {result.weak_topics.length > 0 && <p>Revise: {result.weak_topics.map((t) => <span key={t} className="tag miss">{t}</span>)}</p>}
            <div className="res-actions"><button className="btn btn-ink sm" onClick={start}>Try a new set</button><Link className="btn btn-out sm" to="/interview">Next: AI Interview →</Link></div>
          </div>
        </div>
        <div className="card">
          <h3 className="card-t">By topic</h3>
          <div className="bars">{result.by_topic.map((t) => <div className="barrow" key={t.topic}><span>{t.topic}</span><div className="bar"><i style={{ width: `${(t.correct / t.total) * 100}%` }} /></div><em>{t.correct}/{t.total}</em></div>)}</div>
        </div>
        <div className="card">
          <h3 className="card-t">Review answers</h3>
          {result.review.map((q, k) => (
            <div key={q.id} className={`review ${q.correct ? "ok" : "bad"}`}>
              <p><b>{k + 1}. {q.text}</b></p>
              <ul>{q.options.map((o, j) => <li key={j} className={j === q.answer ? "ans" : j === q.chosen ? "wrong" : ""}>{o}{j === q.answer ? " ✓" : j === q.chosen ? " ✕" : ""}</li>)}</ul>
              {q.explanation && <p className="muted small">💡 {q.explanation}</p>}
            </div>
          ))}
        </div>
      </div></div>
    );
  }

  // ---------- running
  if (test) {
    const q = test.questions[i];
    const answered = Object.keys(answers).length;
    return (
      <div className="page"><div className="wrap narrow">
        <div className="test-bar">
          <span className="eyebrow">{test.major} Quick Test</span>
          <span className={`timer ${left < 60 ? "warn" : ""}`}>⏱ {mmss(left)}</span>
        </div>
        <div className="qdots">{test.questions.map((x, k) => <button key={x.id} className={`qd ${k === i ? "cur" : ""} ${answers[x.id] !== undefined ? "done" : ""}`} onClick={() => setI(k)}>{k + 1}</button>)}</div>
        <div className="card qcard" key={q.id}>
          <span className="tag">{q.category} · {q.topic}</span>
          <h2 className="qtext">{q.text}</h2>
          <div className="qopts">
            {q.options.map((o, j) => (
              <button key={j} className={`qopt ${answers[q.id] === j ? "sel" : ""}`} onClick={() => setAnswers({ ...answers, [q.id]: j })}>
                <span className="ql">{"ABCD"[j]}</span>{o}
              </button>
            ))}
          </div>
          <div className="qnav">
            <button className="btn btn-out sm" disabled={i === 0} onClick={() => setI(i - 1)}>← Back</button>
            {i < test.questions.length - 1
              ? <button className="btn btn-ink sm" onClick={() => setI(i + 1)}>Next →</button>
              : <button className="btn btn-lime sm" onClick={submit}>Submit ({answered}/{test.questions.length})</button>}
          </div>
        </div>
        {err && <p className="err">{err}</p>}
      </div></div>
    );
  }

  // ---------- intro
  return (
    <div className="page"><div className="wrap narrow">
      <p className="eyebrow">03 · Quick Test</p>
      <h1 className="h2">A quick test on <em>your</em> major.</h1>
      <p className="muted lead2">{cfg.questions} multiple-choice questions picked for your subject, plus a little aptitude and workplace English. {cfg.minutes} minutes. Score {cfg.pass_percent}%+ to earn a Skill Check certificate.</p>
      <div className="card">
        <label className="field"><span>Test me on</span>
          <div className="row chips">{MAJORS.map((m) => <button type="button" key={m} className={`chip ${major === m ? "sel" : ""}`} onClick={() => setMajor(m)}>{m}</button>)}</div>
        </label>
        <ul className="list">
          <li>Questions are randomly drawn — every attempt is different.</li>
          <li>You can move between questions before submitting.</li>
          <li>When the timer ends, your answers are submitted automatically.</li>
        </ul>
        {err && <p className="err">{err}</p>}
        <button className="btn btn-ink" onClick={start}>Start {major} test →</button>
      </div>
    </div></div>
  );
}
