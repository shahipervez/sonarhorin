import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import Logo from "../components/Logo";
import Ring from "../components/Ring";
import { confetti, mmss } from "../utils";

const FLAG_LABEL = { tab_hidden: "Tab switches", window_blur: "Focus lost", copy: "Copy attempts", paste: "Paste attempts",
  context_menu: "Right-clicks", fullscreen_exit: "Left full screen", devtools: "Dev tools", no_face: "Webcam issues",
  too_fast: "Too-fast answers", timeout: "Timed-out questions" };

export default function EfficiencyRun() {
  const { id } = useParams();
  const [test, setTest] = useState(null);
  const [phase, setPhase] = useState("intro"); // intro | running | result
  const [agree, setAgree] = useState(false);
  const [cam, setCam] = useState(null);       // MediaStream
  const [q, setQ] = useState(null);            // current payload
  const [choice, setChoice] = useState(null);
  const [left, setLeft] = useState(0);
  const [warn, setWarn] = useState(null);
  const [fsLost, setFsLost] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const sid = useRef(null);
  const videoRef = useRef(null);
  const sending = useRef(false);
  const choiceRef = useRef(null);
  choiceRef.current = choice;
  const qRef = useRef(null);
  qRef.current = q;
  const camRef = useRef(null);
  camRef.current = cam;

  useEffect(() => {
    api(`/api/assessments/efficiency/${id}/`).then((t) => {
      setTest(t);
      if (t.my_session && t.my_session.status !== "in_progress") {
        api(`/api/assessments/efficiency/sessions/${t.my_session.id}/result/`).then((r) => { setResult(r); setPhase("result"); }).catch(() => {});
      }
    }).catch(() => setErr("Test not found."));
  }, [id]);

  const report = useCallback(async (kind, detail = "") => {
    if (!sid.current) return;
    try {
      const r = await api(`/api/assessments/efficiency/sessions/${sid.current}/event/`, { method: "POST", body: { kind, detail } });
      if (r.terminated) { end(r.result); return; }
      if (kind === "tab_hidden") setWarn(`You left the test tab. ${r.warnings_left} warning(s) left before the test is terminated.`);
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function end(res) {
    setResult(res); setPhase("result"); sid.current = null;
    camRef.current?.getTracks().forEach((t) => t.stop());
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    if (res?.passed) confetti();
  }

  const askCamera = async () => {
    setErr("");
    try { const s = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: false }); setCam(s); }
    catch { setErr("Camera permission is required for this test."); }
  };
  useEffect(() => { if (videoRef.current && cam) videoRef.current.srcObject = cam; }, [cam, phase]);

  const start = async () => {
    setErr("");
    if (test.require_fullscreen) { try { await document.documentElement.requestFullscreen(); } catch { /* some browsers block */ } }
    try {
      const r = await api(`/api/assessments/efficiency/${id}/start/`, { method: "POST" });
      sid.current = r.session_id; setQ(r); setLeft(r.seconds_left); setChoice(null); setPhase("running");
    } catch (x) {
      if (x.status === 409 && x.data?.result) { setResult(x.data.result); setPhase("result"); }
      else setErr(x.message);
    }
  };

  const answer = useCallback(async (forced) => {
    const cur = qRef.current;
    if (!cur || sending.current || !sid.current) return;
    sending.current = true;
    try {
      const r = await api(`/api/assessments/efficiency/sessions/${sid.current}/answer/`, {
        method: "POST", body: { question_id: cur.question.id, choice: forced ? null : choiceRef.current },
      });
      if (r.finished) end(r.result);
      else { setQ(r); setLeft(r.seconds_left); setChoice(null); }
    } catch (x) { setErr(x.message); }
    finally { sending.current = false; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // per-question countdown
  useEffect(() => {
    if (phase !== "running" || !q) return;
    const t = setInterval(() => setLeft((s) => { if (s <= 1) { clearInterval(t); answer(true); return 0; } return s - 1; }), 1000);
    return () => clearInterval(t);
  }, [phase, q, answer]);

  // proctoring listeners
  useEffect(() => {
    if (phase !== "running") return;
    let blurT;
    const onVis = () => { if (document.hidden) report("tab_hidden"); };
    const onBlur = () => { blurT = setTimeout(() => { if (!document.hidden) report("window_blur"); }, 800); };
    const onFocus = () => clearTimeout(blurT);
    const block = (kind) => (e) => { e.preventDefault(); report(kind); };
    const onCopy = block("copy"), onCut = block("copy"), onPaste = block("paste"), onCtx = block("context_menu");
    const onFs = () => { if (test.require_fullscreen && !document.fullscreenElement) { setFsLost(true); report("fullscreen_exit"); } else setFsLost(false); };
    let dev = false;
    const devCheck = setInterval(() => { if (!dev && (outerWidth - innerWidth > 220 || outerHeight - innerHeight > 260)) { dev = true; report("devtools"); } }, 3000);
    document.addEventListener("visibilitychange", onVis); addEventListener("blur", onBlur); addEventListener("focus", onFocus);
    document.addEventListener("copy", onCopy); document.addEventListener("cut", onCut); document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onCtx); document.addEventListener("fullscreenchange", onFs);

    // webcam snapshots
    let snapT, track;
    if (cam) {
      track = cam.getVideoTracks()[0];
      const onEnd = () => report("no_face", "camera stopped");
      track?.addEventListener("ended", onEnd);
      const snap = () => {
        const v = videoRef.current; if (!v || !v.videoWidth || !sid.current) return;
        const c = document.createElement("canvas"); c.width = 320; c.height = 240;
        c.getContext("2d").drawImage(v, 0, 0, 320, 240);
        api(`/api/assessments/efficiency/sessions/${sid.current}/snapshot/`, { method: "POST", body: { image: c.toDataURL("image/jpeg", 0.6) } }).catch(() => {});
      };
      setTimeout(snap, 3000);
      snapT = setInterval(snap, 20000);
    }
    return () => {
      document.removeEventListener("visibilitychange", onVis); removeEventListener("blur", onBlur); removeEventListener("focus", onFocus);
      document.removeEventListener("copy", onCopy); document.removeEventListener("cut", onCut); document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onCtx); document.removeEventListener("fullscreenchange", onFs);
      clearInterval(devCheck); clearInterval(snapT); clearTimeout(blurT);
    };
  }, [phase, cam, test, report]);

  useEffect(() => () => { cam?.getTracks().forEach((t) => t.stop()); }, [cam]);

  if (err && !test) return <div className="page"><div className="wrap narrow"><p className="err">{err}</p></div></div>;
  if (!test) return <div className="page"><div className="wrap narrow"><p className="muted">Loading…</p></div></div>;

  // ------------------------------------------------------------ result
  if (phase === "result" && result) {
    const flags = Object.entries(result.flags || {}).filter(([, v]) => v > 0);
    return (
      <div className="page"><div className="wrap narrow">
        <p className="eyebrow">Efficiency Test · {result.test}</p>
        <div className="card res-quick">
          <div className="rings2">
            <Ring value={result.percent} size={120} color={result.percent >= result.pass_percent ? "var(--green2)" : "var(--red)"} sub="score" />
            <Ring value={result.integrity_score} size={120} color={result.integrity_score >= result.min_integrity ? "var(--green2)" : "var(--red)"} sub="integrity" />
          </div>
          <div>
            <h1 className="h2">{result.status === "terminated" ? "Test terminated" : result.passed ? "Verified! 🛡" : "Not passed"}</h1>
            <p className="muted">{result.correct}/{result.total} correct · needs {result.pass_percent}% score and {result.min_integrity}% integrity.</p>
            {result.certificate_code && <p className="cert-note">🏅 Verified certificate · <Link className="link" to={`/verify/${result.certificate_code}`}>{result.certificate_code}</Link></p>}
            <div className="res-actions"><Link className="btn btn-out sm" to="/certificates">My certificates</Link><Link className="btn btn-ink sm" to="/">← Back to সোনারহরিণ</Link></div>
          </div>
        </div>
        <div className="card">
          <h3 className="card-t">Integrity log</h3>
          {flags.length === 0 ? <p className="good-t">Clean session — no integrity events recorded. ✓</p>
            : <div className="checks">{flags.map(([k, v]) => <span key={k} className="chk n">{FLAG_LABEL[k] || k}: {v}</span>)}</div>}
          <p className="muted small">One attempt per test — this result is final and is what employers see.</p>
        </div>
      </div></div>
    );
  }

  // ------------------------------------------------------------ running
  if (phase === "running" && q) {
    const pct = (left / q.seconds_per_question) * 100;
    return (
      <div className="exam">
        <div className="exam-top">
          <span className="logo sm"><Logo light /></span>
          <span>{test.title}</span>
          <span>Question {q.index + 1} / {q.total}</span>
          {cam && <video ref={videoRef} autoPlay muted playsInline className="exam-cam" />}
        </div>
        <div className="exam-body">
          <div className={`qtimer ${left <= 10 ? "warn" : ""}`}><i style={{ width: `${pct}%` }} /><span>{mmss(left)}</span></div>
          <div className="card qcard exam-card">
            <span className="tag">{q.question.category} · {q.question.topic}</span>
            <h2 className="qtext">{q.question.text}</h2>
            <div className="qopts">
              {q.question.options.map((o, j) => (
                <button key={j} className={`qopt ${choice === j ? "sel" : ""}`} onClick={() => setChoice(j)}><span className="ql">{"ABCD"[j]}</span>{o}</button>
              ))}
            </div>
            <div className="qnav"><span className="muted small">Answers lock when you continue. No going back.</span>
              <button className="btn btn-ink sm" disabled={choice === null} onClick={() => answer(false)}>{q.index + 1 === q.total ? "Finish" : "Lock & next →"}</button></div>
          </div>
          {err && <p className="err">{err}</p>}
        </div>
        {warn && <div className="exam-warn" role="alert"><p>⚠️ {warn}</p><button className="btn btn-lime sm" onClick={() => setWarn(null)}>I understand</button></div>}
        {fsLost && <div className="exam-warn"><p>⛶ This test must stay in full screen.</p><button className="btn btn-lime sm" onClick={() => document.documentElement.requestFullscreen().catch(() => {})}>Return to full screen</button></div>}
      </div>
    );
  }

  // ------------------------------------------------------------ intro / pre-check
  return (
    <div className="page"><div className="wrap narrow">
      <p className="eyebrow">{test.company_name} · Efficiency Test</p>
      <h1 className="h2">{test.title}</h1>
      <p className="muted lead2">{test.description}</p>
      <div className="card">
        <div className="pmeta">
          <span>📝 {test.question_count} questions</span><span>⏱ {test.seconds_per_question}s per question</span>
          <span>🎯 Pass {test.pass_percent}%</span><span>🛡 Integrity ≥ {test.min_integrity}%</span><span>📚 {test.major}</span>
        </div>
        <h3 className="card-t mt">Rules</h3>
        <ul className="list">
          <li>One attempt only. Questions and options are randomized.</li>
          <li>One question at a time, with its own timer. When time runs out the question is skipped.</li>
          <li>You can't go back to previous questions.</li>
          <li>Switching tabs, copying/pasting, right-clicking or leaving full screen is recorded. <b>4 tab switches end the test.</b></li>
          {test.require_webcam && <li>Your webcam takes a snapshot every 20 seconds for the hiring company.</li>}
        </ul>
        {test.require_webcam && (
          <div className="camcheck">
            {cam ? <video ref={videoRef} autoPlay muted playsInline /> : <button className="btn btn-out sm" onClick={askCamera}>📷 Allow camera</button>}
            <span className="muted small">{cam ? "Camera ready ✓" : "Camera is required for this test."}</span>
          </div>
        )}
        <label className="check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> I'll take this test honestly, alone, without help.</label>
        {err && <p className="err">{err}</p>}
        <button className="btn btn-ink" disabled={!agree || (test.require_webcam && !cam)} onClick={start}>Start test {test.require_fullscreen ? "in full screen" : ""} →</button>
      </div>
    </div></div>
  );
}
