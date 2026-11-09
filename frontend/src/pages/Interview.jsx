import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { MAJORS, useConfig } from "../config";
import Mitu from "../components/Mitu";
import Ring from "../components/Ring";
import { confetti, mmss, speak } from "../utils";

const SR = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
const KIND = { intro: "Introduction", technical: "Technical", behavioural: "Behavioural", situational: "Situational", closing: "Closing" };

export default function Interview() {
  const { user } = useAuth();
  const { interview_minutes, ai_enabled } = useConfig();
  const [major, setMajor] = useState(user.major);
  const [role, setRole] = useState("");
  const [voice, setVoice] = useState(true);
  const [s, setS] = useState(null);        // session state from API
  const [left, setLeft] = useState(0);
  const [answer, setAnswer] = useState("");
  const [talking, setTalking] = useState(false);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lastEval, setLastEval] = useState(null);
  const [report, setReport] = useState(null);
  const [err, setErr] = useState("");
  const recRef = useRef(null);
  const sRef = useRef(null);
  sRef.current = s;

  const say = (text) => {
    if (!voice) return;
    setTalking(true);
    speak(text, { onend: () => setTalking(false) });
  };

  const start = async () => {
    setErr(""); setReport(null); setLastEval(null);
    try {
      const r = await api("/api/interviews/start/", { method: "POST", body: { major, role } });
      setS(r); setLeft(r.seconds_left);
      say(`${r.greeting} ${r.current.question}`);
    } catch (x) { setErr(x.message); }
  };

  const finish = async () => {
    const cur = sRef.current; if (!cur) return;
    stopMic(); window.speechSynthesis?.cancel(); setTalking(false);
    try {
      const r = await api(`/api/interviews/${cur.session_id}/finish/`, { method: "POST" });
      setReport(r.report); if (r.report?.overall >= 70) confetti();
    } catch (x) { setErr(x.message); }
  };

  const send = async () => {
    if (!s?.current || busy) return;
    stopMic(); setBusy(true);
    try {
      const r = await api(`/api/interviews/${s.session_id}/answer/`, { method: "POST", body: { turn_id: s.current.turn_id, answer } });
      setLastEval(r.evaluation); setAnswer("");
      if (r.finished) { setS(r); setReport(r.report); window.speechSynthesis?.cancel(); if (r.report?.overall >= 70) confetti(); }
      else { setS(r); setLeft(r.seconds_left); say(r.current.question); }
    } catch (x) { setErr(x.message); }
    finally { setBusy(false); }
  };

  // timer
  useEffect(() => {
    if (!s || report) return;
    const id = setInterval(() => setLeft((v) => { if (v <= 1) { clearInterval(id); finish(); return 0; } return v - 1; }), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s?.session_id, report]);

  useEffect(() => () => { window.speechSynthesis?.cancel(); recRef.current?.stop(); }, []);

  function startMic() {
    if (!SR) return;
    window.speechSynthesis?.cancel(); setTalking(false);
    const rec = new SR();
    rec.lang = "en-US"; rec.continuous = true; rec.interimResults = true;
    let base = answer ? answer + " " : "";
    rec.onresult = (e) => {
      let fin = "", interim = "";
      for (let k = e.resultIndex; k < e.results.length; k++) {
        const t = e.results[k][0].transcript;
        if (e.results[k].isFinal) fin += t; else interim += t;
      }
      if (fin) base += fin + " ";
      setAnswer((base + interim).trimStart());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start(); recRef.current = rec; setListening(true);
  }
  function stopMic() { recRef.current?.stop(); recRef.current = null; setListening(false); }

  // ------------------------------------------------------------- report
  if (report) {
    return (
      <div className="page"><div className="wrap narrow">
        <p className="eyebrow">04 · AI Interview · Report</p>
        <div className="card res-quick">
          <Ring value={report.overall} size={140} color={report.overall >= 70 ? "var(--green2)" : report.overall >= 50 ? "#E8A317" : "var(--red)"} label={report.overall} sub="out of 100" />
          <div>
            <h1 className="h2">{report.verdict}</h1>
            <p className="muted">You answered {report.answered} of {report.asked} questions.</p>
            {report.certificate_code && <p className="cert-note">🏅 Interview-ready certificate · <Link className="link" to="/certificates">{report.certificate_code}</Link></p>}
            <div className="res-actions"><button className="btn btn-ink sm" onClick={() => { setS(null); setReport(null); }}>Practice again</button><Link className="btn btn-out sm" to="/efficiency">Next: Efficiency Test →</Link></div>
          </div>
        </div>
        <div className="two">
          <div className="card">
            <h3 className="card-t">Scores</h3>
            <div className="bars">{Object.entries(report.scores || {}).map(([k, v]) => <div className="barrow" key={k}><span style={{ textTransform: "capitalize" }}>{k}</span><div className="bar"><i style={{ width: `${v * 10}%` }} /></div><em>{v}/10</em></div>)}</div>
            <h3 className="card-t mt">✅ Strengths</h3><ul className="list good">{report.strengths.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <div className="card">
            <h3 className="card-t">🛠 Work on</h3><ul className="list">{report.improvements.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        </div>
        <div className="card">
          <h3 className="card-t">Question by question</h3>
          {report.per_question.map((q, k) => (
            <details key={k} className="qa">
              <summary><span className="tag">{KIND[q.kind] || q.kind}</span> {q.question} <b className="qa-score">{q.answer ? `${q.score ?? "–"}/10` : "skipped"}</b></summary>
              <p><b>Your answer:</b> {q.answer || "—"}</p>
              {q.feedback && <p className="ex">💡 {q.feedback}</p>}
            </details>
          ))}
        </div>
      </div></div>
    );
  }

  // ------------------------------------------------------------- room
  if (s) {
    const pct = Math.min(100, ((s.asked - 1) / Math.max(1, s.total_questions)) * 100);
    return (
      <div className="page iv-page"><div className="wrap">
        <div className="iv-room">
          <div className="iv-stage">
            <div className="rec"><span className="dot red" />LIVE · MOCK INTERVIEW</div>
            <Mitu talking={talking} className="iv-avatar" />
            <div className={`iv-timer ${left < 60 ? "warn" : ""}`}>⏱ {mmss(left)}</div>
          </div>
          <div className="iv-panel">
            <div className="iv-prog"><div className="bar"><i style={{ width: `${pct}%` }} /></div><small>Question {s.asked} of {s.total_questions}</small></div>
            {s.current && <>
              <span className="tag">{KIND[s.current.kind]}</span>
              <h2 className="iv-q">{s.current.question}</h2>
              <button className="link small" onClick={() => say(s.current.question)}>🔊 Repeat question</button>
            </>}
            <textarea className="iv-ans" rows={6} value={answer} onChange={(e) => setAnswer(e.target.value)}
                      placeholder={SR ? "Press the mic and speak — or type your answer here…" : "Type your answer here…"} />
            <div className="iv-actions">
              {SR && <button className={`btn ${listening ? "btn-red" : "btn-out"} sm`} onClick={listening ? stopMic : startMic}>{listening ? "■ Stop" : "🎙 Speak"}</button>}
              <button className="btn btn-ink sm" disabled={busy || !answer.trim()} onClick={send}>{busy ? "Scoring…" : "Submit answer →"}</button>
              <button className="btn btn-ghost-ink sm" onClick={finish}>End interview</button>
            </div>
            {lastEval && (
              <div className="iv-eval">
                <b>Last answer: {lastEval.score}/10</b>
                <span>content {lastEval.content} · structure {lastEval.structure} · communication {lastEval.communication}</span>
                <p>{lastEval.feedback}</p>
              </div>
            )}
            {err && <p className="err">{err}</p>}
          </div>
        </div>
      </div></div>
    );
  }

  // ------------------------------------------------------------- setup
  return (
    <div className="page"><div className="wrap narrow">
      <p className="eyebrow">04 · AI Interviewer</p>
      <h1 className="h2">A real interview.<br /><em>{interview_minutes} minutes.</em> With Mitu.</h1>
      <p className="muted lead2">Mitu asks an intro, technical questions from your major, behavioural and situational questions — then scores every answer on content, structure and communication. {ai_enabled ? "Powered by AI follow-ups." : ""}</p>
      <div className="card iv-setup">
        <Mitu className="iv-mini" />
        <div>
          <label className="field"><span>Major</span><div className="row chips">{MAJORS.map((m) => <button key={m} type="button" className={`chip ${major === m ? "sel" : ""}`} onClick={() => setMajor(m)}>{m}</button>)}</div></label>
          <label className="field"><span>Role you're preparing for (optional)</span><input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Management Trainee Officer" /></label>
          <label className="check"><input type="checkbox" checked={voice} onChange={(e) => setVoice(e.target.checked)} /> Mitu speaks the questions out loud</label>
          {!SR && <p className="muted small">Speech-to-text isn't supported in this browser — you can type your answers (Chrome supports voice).</p>}
          {err && <p className="err">{err}</p>}
          <button className="btn btn-ink" onClick={start}>Start interview →</button>
        </div>
      </div>
    </div></div>
  );
}
