import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Mitu from "../components/Mitu";
import Ring from "../components/Ring";
import { MAJORS, useConfig } from "../config";
import { confetti, mmss, speak } from "../utils";

const SR = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

const DEMO_QUESTIONS = {
  CSE: [
    { kind: "Intro", q: "Welcome to your AI Demo Interview! Please introduce yourself — your university, key projects you've built, and what kind of software role you're looking for.", kw: ["study", "university", "project", "software", "developer", "engineer", "built", "skills", "experience"] },
    { kind: "Technical", q: "Explain what happens when you enter a URL in a browser and press Enter, or explain the difference between SQL and NoSQL databases.", kw: ["dns", "ip", "server", "http", "database", "table", "schema", "relational", "document", "query"] },
    { kind: "Problem Solving", q: "Tell me about a challenging bug or technical problem you solved during your studies or personal projects.", kw: ["bug", "problem", "fixed", "debug", "solution", "result", "learned", "task", "situation"] },
    { kind: "Closing", q: "Why should an employer hire you as a fresher, and what unique value or energy will you bring to the engineering team?", kw: ["learn", "fast", "contribute", "passionate", "dedicated", "team", "grow", "value"] },
  ],
  EEE: [
    { kind: "Intro", q: "Welcome to your AI Demo Interview! Please introduce yourself — your university background in EEE and your career ambitions.", kw: ["study", "university", "electrical", "electronics", "circuit", "project", "career", "engineer"] },
    { kind: "Technical", q: "Explain the working principle of a transformer and why high-voltage AC transmission is utilized across national grids.", kw: ["induction", "flux", "voltage", "current", "loss", "transmission", "power", "turns"] },
    { kind: "Problem Solving", q: "Describe a project or laboratory experiment where you had to troubleshoot circuit faults or unexpected readings.", kw: ["fault", "test", "measure", "circuit", "fixed", "result", "multimeter", "troubleshoot"] },
    { kind: "Closing", q: "Why are you the ideal fresh graduate for an electrical engineering opening, and how do you stay updated with industry developments?", kw: ["learn", "standards", "safety", "dedication", "growth", "contribute", "team"] },
  ],
  BBA: [
    { kind: "Intro", q: "Welcome! Tell me about yourself — your concentration, key achievements during university, and the business role you want.", kw: ["bba", "marketing", "finance", "management", "university", "role", "project", "leadership"] },
    { kind: "Technical", q: "How would you design a digital marketing and customer acquisition campaign for a new brand in Bangladesh with a limited budget?", kw: ["target", "audience", "social", "campaign", "budget", "conversion", "content", "channel"] },
    { kind: "Problem Solving", q: "Walk me through a challenging group project or deadline conflict you resolved successfully.", kw: ["team", "conflict", "deadline", "collaborate", "agreed", "plan", "result", "solved"] },
    { kind: "Closing", q: "Why should a company hire you as a Management Trainee or Business Associate over other fresh graduates?", kw: ["analytical", "drive", "communication", "adaptable", "fresh", "contribute", "impact"] },
  ],
  English: [
    { kind: "Intro", q: "Welcome! Tell me about yourself — your studies in English literature or linguistics and your target career field.", kw: ["english", "literature", "linguistics", "communication", "writing", "university", "career"] },
    { kind: "Technical", q: "How do you tailor communication and written tone when drafting reports for corporate leadership versus everyday consumers?", kw: ["audience", "tone", "clarity", "concise", "message", "professional", "adapt"] },
    { kind: "Problem Solving", q: "Describe a situation where a major misunderstanding arose in a team project and how your communication skills resolved it.", kw: ["listen", "clarify", "discuss", "resolved", "understood", "empathy", "result"] },
    { kind: "Closing", q: "What makes your background in English an asset for corporate and creative job roles?", kw: ["articulate", "research", "critical", "thinking", "adaptable", "storytelling", "value"] },
  ],
  Pharmacy: [
    { kind: "Intro", q: "Welcome to your AI Demo Interview! Please introduce yourself, your pharmaceutical studies, and your professional goals.", kw: ["pharmacy", "medicine", "clinical", "lab", "university", "research", "career"] },
    { kind: "Technical", q: "Explain the importance of GMP (Good Manufacturing Practice) and QA/QC quality assurance in modern pharmaceutical plants.", kw: ["gmp", "quality", "assurance", "control", "safety", "standard", "compliance", "batch"] },
    { kind: "Problem Solving", q: "Tell me about a laboratory analysis where you had to re-verify an abnormal test result or formulation issue.", kw: ["test", "verify", "formula", "accurate", "procedure", "sample", "result"] },
    { kind: "Closing", q: "Why should a pharmaceutical company or healthcare provider select you as a fresh graduate?", kw: ["precision", "knowledge", "safety", "ethical", "compliance", "dedicated", "growth"] },
  ],
  Textile: [
    { kind: "Intro", q: "Welcome! Please introduce yourself, your specialization in textile engineering, and your career direction in the apparel/RMG sector.", kw: ["textile", "apparel", "fabric", "spinning", "dyeing", "garments", "university", "career"] },
    { kind: "Technical", q: "Explain the fundamental differences between natural and synthetic fibres, and how colour fastness is controlled during dyeing.", kw: ["cotton", "polyester", "fibre", "dyeing", "fastness", "shade", "process", "quality"] },
    { kind: "Problem Solving", q: "Describe a scenario where fabric defect or shade variation occurred during a trial run, and how you traced the cause.", kw: ["defect", "shade", "machine", "temperature", "inspection", "root", "fixed"] },
    { kind: "Closing", q: "How will your fresh perspective and technical training benefit a modern export-oriented textile company?", kw: ["efficiency", "sustainability", "quality", "passionate", "ready", "learn", "value"] },
  ],
  Other: [
    { kind: "Intro", q: "Welcome! Tell me about yourself — your academic background, projects you're proud of, and what role you're targeting.", kw: ["study", "university", "skills", "project", "career", "interest", "role"] },
    { kind: "Technical", q: "What core competencies from your degree are most relevant to the workplace, and how have you put them into practice?", kw: ["skill", "competency", "practice", "applied", "methodology", "research", "tools"] },
    { kind: "Problem Solving", q: "Tell me about a time you had to learn a completely new tool or handle an unexpected challenge under pressure.", kw: ["learned", "quick", "adapt", "challenge", "plan", "executed", "result"] },
    { kind: "Closing", q: "Why should an employer hire you as a fresher, and what drives your motivation to excel?", kw: ["motivated", "work", "ethic", "reliable", "contribute", "adapt", "grow"] },
  ],
};

function evaluateAnswer(qItem, text) {
  const answer = (text || "").trim();
  const words = answer.split(/\s+/).filter(Boolean).length;
  const low = answer.toLowerCase();

  // Content scoring based on keywords
  const hits = (qItem.kw || []).filter((k) => low.includes(k));
  const content = words === 0 ? 0 : Math.min(10, Math.max(3, Math.round((hits.length / Math.max(2, qItem.kw.length * 0.45)) * 10)));

  // Structure scoring (STAR method bonus + logical transition words)
  const starWords = ["when", "situation", "task", "we decided", "i decided", "result", "finally", "outcome", "learned"];
  const starHits = starWords.filter((w) => low.includes(w)).length;
  const transitionWords = ["first", "second", "then", "because", "for example", "furthermore", "overall"];
  const transHits = transitionWords.filter((w) => low.includes(w)).length;
  const structure = words < 10 ? 2 : Math.min(10, Math.max(3, 4 + starHits * 2 + transHits));

  // Communication & Delivery scoring (length, filler control, confidence)
  const fillers = (low.match(/\b(um+|uh+|like|basically|actually|you know)\b/g) || []).length;
  let commBase = words >= 40 ? 9 : words >= 20 ? 7 : words >= 8 ? 5 : 2;
  const communication = Math.max(1, Math.min(10, commBase - Math.floor(fillers / 2)));

  const overall = Math.round((content * 0.4 + structure * 0.3 + communication * 0.3) * 10);

  let feedback = "";
  if (words < 12) {
    feedback = "Try to elaborate more with specific examples and details rather than giving very brief replies.";
  } else if (starHits >= 2) {
    feedback = "Excellent structure! You used the STAR framework to clearly articulate context and outcome.";
  } else if (hits.length >= 3) {
    feedback = "Strong technical relevance and vocabulary. Solid answers that show domain knowledge!";
  } else {
    feedback = "Good response! You can strengthen it further by tying in quantifiable achievements or metrics.";
  }

  return {
    content,
    structure,
    communication,
    score: Math.min(10, Math.round(overall / 10)),
    feedback,
  };
}

export default function DemoInterview() {
  const { user } = useConfig();
  const [major, setMajor] = useState("CSE");
  const [role, setRole] = useState("");
  const [step, setStep] = useState("setup"); // setup | interview | report
  const [cam, setCam] = useState(null);
  const [camErr, setCamErr] = useState("");
  const [mirror, setMirror] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [audioLevel, setAudioLevel] = useState(2);
  const [zoom, setZoom] = useState(1);
  const [theater, setTheater] = useState(false);
  const [layout, setLayout] = useState("split"); // split | mitu | user
  const [qIndex, setQIndex] = useState(0);
  const [left, setLeft] = useState(90);
  const [answer, setAnswer] = useState("");
  const [talking, setTalking] = useState(false);
  const [listening, setListening] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [history, setHistory] = useState([]);
  const [lastEval, setLastEval] = useState(null);

  const videoRef = useRef(null);
  const pipVideoRef = useRef(null);
  const recRef = useRef(null);
  const audioCtxRef = useRef(null);
  const animFrameRef = useRef(null);
  const camStreamRef = useRef(null);

  const questions = DEMO_QUESTIONS[major] || DEMO_QUESTIONS.Other;
  const currentQ = questions[qIndex] || questions[0];

  // Camera acquisition
  const startCamera = async () => {
    setCamErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: true,
      });
      setCam(stream);
      camStreamRef.current = stream;

      // Audio analyser setup for live mic meter
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioCtxRef.current = ctx;
          const src = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          src.connect(analyser);
          const data = new Uint8Array(analyser.frequencyBinCount);

          const checkLevel = () => {
            analyser.getByteFrequencyData(data);
            let sum = 0;
            for (let i = 0; i < data.length; i++) sum += data[i];
            const avg = sum / data.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animFrameRef.current = requestAnimationFrame(checkLevel);
          };
          checkLevel();
        }
      } catch {
        /* audio analysis optional */
      }
    } catch (e) {
      setCamErr(e.message || "Camera access was denied or is not available. You can still continue the demo interview!");
    }
  };

  useEffect(() => {
    if (cam) {
      if (videoRef.current) videoRef.current.srcObject = cam;
      if (pipVideoRef.current) pipVideoRef.current.srcObject = cam;
    }
  }, [cam, layout, step]);

  // Clean up media on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      recRef.current?.stop();
      if (camStreamRef.current) {
        camStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Voice speech synthesis for Mitu
  const mituSpeak = useCallback((text) => {
    window.speechSynthesis?.cancel();
    setTalking(true);
    speak(text, {
      lang: "en",
      onend: () => setTalking(false),
    });
  }, []);

  // Speech Recognition for Candidate voice input
  const startMic = () => {
    if (!SR) return;
    window.speechSynthesis?.cancel();
    setTalking(false);
    try {
      const rec = new SR();
      rec.lang = "en-US";
      rec.continuous = true;
      rec.interimResults = true;
      let base = answer ? answer + " " : "";

      rec.onresult = (e) => {
        let fin = "", interim = "";
        for (let k = e.resultIndex; k < e.results.length; k++) {
          const t = e.results[k][0].transcript;
          if (e.results[k].isFinal) fin += t;
          else interim += t;
        }
        if (fin) base += fin + " ";
        setAnswer((base + interim).trimStart());
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      rec.start();
      recRef.current = rec;
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  const stopMic = () => {
    recRef.current?.stop();
    recRef.current = null;
    setListening(false);
  };

  // Timer per question
  useEffect(() => {
    if (step !== "interview") return;
    const id = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          submitAnswer();
          return 90;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, qIndex, answer]);

  const startDemo = async () => {
    if (!cam) await startCamera();
    setStep("interview");
    setQIndex(0);
    setLeft(90);
    setHistory([]);
    setLastEval(null);
    setAnswer("");
    const firstQ = questions[0];
    setTimeout(() => {
      mituSpeak(`Hello! I'm Mitu. ${firstQ.q}`);
    }, 500);
  };

  const submitAnswer = () => {
    if (evaluating) return;
    stopMic();
    window.speechSynthesis?.cancel();
    setTalking(false);
    setEvaluating(true);

    const q = questions[qIndex];
    const ev = evaluateAnswer(q, answer);
    const item = {
      q: q.q,
      kind: q.kind,
      answer: answer || "(No verbal answer recorded)",
      eval: ev,
    };
    const nextHist = [...history, item];
    setHistory(nextHist);
    setLastEval(ev);
    setAnswer("");

    setTimeout(() => {
      setEvaluating(false);
      if (qIndex + 1 < questions.length) {
        const nextIdx = qIndex + 1;
        setQIndex(nextIdx);
        setLeft(90);
        mituSpeak(questions[nextIdx].q);
      } else {
        // Finish
        setStep("report");
        confetti();
      }
    }, 900);
  };

  // Compute final score
  const overallScore = history.length
    ? Math.round(
        (history.reduce((acc, h) => acc + (h.eval?.score || 0), 0) / (history.length * 10)) * 100
      )
    : 82;

  // -------------------------------------------------------------
  // REPORT VIEW
  // -------------------------------------------------------------
  if (step === "report") {
    return (
      <div className="page demo-iv-page">
        <div className="wrap narrow">
          <div className="demo-badge">🎥 AI Demo Realtime Interview · Completed</div>
          <div className="card res-quick">
            <Ring
              value={overallScore}
              size={140}
              color={overallScore >= 70 ? "var(--green2)" : overallScore >= 50 ? "#E8A317" : "var(--red)"}
              label={`${overallScore}`}
              sub="Demo Score / 100"
            />
            <div>
              <h1 className="h2">{overallScore >= 75 ? "Interview Ready! 🎉" : overallScore >= 50 ? "Solid Foundation! Keep Polishing." : "Keep Practicing!"}</h1>
              <p className="muted">
                Completed on-camera interview for <b>{major}</b> {role ? `(${role})` : ""}. Answered {history.length} questions live with camera & speech recognition.
              </p>
              <div className="res-actions" style={{ marginTop: 16 }}>
                <button className="btn btn-lime sm" onClick={startDemo}>
                  ↻ Practice Again (On Camera)
                </button>
                <Link className="btn btn-ink sm" to="/interview">
                  Take Official 10-Min Interview →
                </Link>
                <Link className="btn btn-out sm" to="/cv">
                  Judge my CV
                </Link>
              </div>
            </div>
          </div>

          <div className="two" style={{ marginTop: 18 }}>
            <div className="card">
              <h3 className="card-t">Category Breakdown</h3>
              <div className="bars">
                <div className="barrow">
                  <span>Camera & Eye Contact</span>
                  <div className="bar"><i style={{ width: cam ? "90%" : "60%" }} /></div>
                  <em>{cam ? "9/10" : "6/10"}</em>
                </div>
                <div className="barrow">
                  <span>Technical Relevance</span>
                  <div className="bar"><i style={{ width: `${Math.min(100, overallScore + 5)}%` }} /></div>
                  <em>{Math.round((overallScore / 10) * 0.9 + 1)}/10</em>
                </div>
                <div className="barrow">
                  <span>Communication Clarity</span>
                  <div className="bar"><i style={{ width: `${overallScore}%` }} /></div>
                  <em>{Math.round(overallScore / 10)}/10</em>
                </div>
                <div className="barrow">
                  <span>Structure (STAR)</span>
                  <div className="bar"><i style={{ width: `${Math.max(40, overallScore - 10)}%` }} /></div>
                  <em>{Math.max(4, Math.round(overallScore / 10 - 1))}/10</em>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="card-t">AI Feedback & Strengths</h3>
              <ul className="list good">
                <li>Clear verbal delivery on camera with prompt responses.</li>
                <li>Good alignment with fresher role expectations for {major}.</li>
                <li>{cam ? "Active camera presence maintained throughout." : "Comfortable answering on microphone."}</li>
              </ul>
              <h3 className="card-t mt">Key Focus Areas</h3>
              <ul className="list">
                <li>Cite concrete metrics and technologies (e.g. tools, speedups, users).</li>
                <li>Structure situational answers around Situation → Task → Action → Result.</li>
              </ul>
            </div>
          </div>

          <div className="card" style={{ marginTop: 18 }}>
            <h3 className="card-t">Question by Question Review</h3>
            {history.map((h, i) => (
              <details key={i} className="qa" open={i === 0}>
                <summary>
                  <span className="tag">{h.kind}</span> {h.q}
                  <b className="qa-score">{h.eval?.score}/10</b>
                </summary>
                <p style={{ marginTop: 8 }}><b>Your answer:</b> {h.answer}</p>
                {h.eval?.feedback && <p className="ex" style={{ marginTop: 6 }}>💡 {h.eval.feedback}</p>}
              </details>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // INTERVIEW ROOM VIEW
  // -------------------------------------------------------------
  if (step === "interview") {
    const pct = Math.round(((qIndex) / questions.length) * 100);

    return (
      <div className="page demo-iv-page">
        <div className="wrap">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div>
              <span className="demo-badge">🎥 Live Realtime Interview On Camera</span>
              <h1 className="h2" style={{ fontSize: 24, margin: 0 }}>Mitu AI Recruiter · Live Session</h1>
            </div>

            {/* ZOOM & VISUALIZATION CONTROLS */}
            <div className="zoom-bar">
              <span className="z-label">🔍 Zoom View:</span>
              <button className="z-btn" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.15).toFixed(2)))} title="Zoom Out">−</button>
              <span className="z-val">{Math.round(zoom * 100)}%</span>
              <button className="z-btn" onClick={() => setZoom((z) => Math.min(2.0, +(z + 0.15).toFixed(2)))} title="Zoom In">+</button>
              <button className="z-btn reset" onClick={() => setZoom(1)} title="Reset to 100%">100%</button>
              <button className={`z-btn expand ${theater ? "active" : ""}`} onClick={() => setTheater((t) => !t)} title={theater ? "Collapse" : "Expand Stage"}>
                {theater ? "⤡ Normal" : "⤢ Expand"}
              </button>
            </div>
          </div>

          <div className="demo-iv-room">
            {/* LEFT: INTERACTIVE VIDEO & CAMERA STAGE */}
            <div className={`demo-stage-box ${theater ? "theater" : ""}`}>
              {/* STAGE HEADER BAR */}
              <div className="demo-stage-topbar">
                <div className="demo-rec-pill">
                  <span className="dot" />
                  <span>ON CAMERA · REALTIME AI</span>
                </div>

                {/* LAYOUT SELECTOR */}
                <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.08)", padding: 2, borderRadius: 999 }}>
                  <button className={`cam-ctl-btn ${layout === "split" ? "active" : ""}`} style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => setLayout("split")} title="50/50 Split view">
                    📱 Split View
                  </button>
                  <button className={`cam-ctl-btn ${layout === "mitu" ? "active" : ""}`} style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => setLayout("mitu")} title="Mitu Focus">
                    🤖 Mitu
                  </button>
                  <button className={`cam-ctl-btn ${layout === "user" ? "active" : ""}`} style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => setLayout("user")} title="Your Camera Focus">
                    👤 Candidate
                  </button>
                </div>

                <div className="demo-rec-pill" style={{ color: "var(--lime)" }}>
                  <span>⏱ {mmss(left)}</span>
                </div>
              </div>

              {/* STAGE VIEW (ZOOMABLE) */}
              <div className="demo-stage-view">
                <div
                  className={`demo-grid ${layout === "mitu" ? "mitu-focus" : layout === "user" ? "user-focus" : "split"}`}
                  style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
                >
                  {/* TILE 1: MITU AI AVATAR */}
                  {(layout === "split" || layout === "mitu") && (
                    <div className="stage-tile mitu-tile">
                      <div className="tile-overlay">
                        <span>🤖 Mitu · AI Recruiter</span>
                        {talking && <span style={{ color: "var(--lime)", fontSize: 10 }}>● Speaking</span>}
                      </div>
                      <Mitu talking={talking} style={{ width: "65%", height: "85%", margin: "auto" }} />

                      {/* Picture in picture user camera when in Mitu Focus */}
                      {layout === "mitu" && cam && (
                        <div className="pip-corner">
                          <video ref={pipVideoRef} autoPlay playsInline muted style={{ transform: mirror ? "scaleX(-1)" : "none" }} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* TILE 2: CANDIDATE LIVE CAMERA */}
                  {(layout === "split" || layout === "user") && (
                    <div className="stage-tile cam-tile">
                      <div className="tile-overlay">
                        <span>👤 You · Candidate ({major})</span>
                        <div className="v-meter" title="Mic Volume">
                          {[1, 2, 3, 4, 5].map((idx) => (
                            <div
                              key={idx}
                              className="v-bar"
                              style={{
                                height: `${Math.max(3, Math.min(16, (audioLevel / 20) * idx * 3.5))}px`,
                                background: listening ? "var(--lime)" : "#666",
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      {cam ? (
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          style={{
                            transform: mirror ? "scaleX(-1)" : "none",
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div className="demo-cam-inactive">
                          <span className="cam-icon-big">📷</span>
                          <p>Camera is currently off or not connected.</p>
                          <button className="btn btn-lime sm" onClick={startCamera}>
                            Turn on Camera
                          </button>
                        </div>
                      )}

                      {/* Picture in picture Mitu when in User Focus */}
                      {layout === "user" && (
                        <div className="pip-corner" style={{ background: "#E3F8B5" }}>
                          <Mitu talking={talking} style={{ width: "100%", height: "100%" }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* LIVE SUBTITLE CAPTION BAR */}
                <div className="demo-caption-bar">
                  <span style={{ color: "var(--lime)", fontWeight: 700 }}>Mitu: </span>
                  {talking ? currentQ.q : "Listening to you... You can speak into your microphone or type your response."}
                </div>
              </div>

              {/* BOTTOM CAMERA CONTROLS BAR */}
              <div className="cam-bot-controls">
                <div className="cam-btn-group">
                  <button
                    className={`cam-ctl-btn ${cam ? "active" : "danger"}`}
                    onClick={cam ? () => { cam.getTracks().forEach((t) => t.stop()); setCam(null); } : startCamera}
                  >
                    {cam ? "📹 Camera On" : "📷 Turn Camera On"}
                  </button>
                  <button
                    className={`cam-ctl-btn ${mirror ? "active" : ""}`}
                    onClick={() => setMirror(!mirror)}
                    title="Mirror / Flip webcam display"
                  >
                    🪞 Mirror Feed
                  </button>
                  <button
                    className={`cam-ctl-btn ${micActive ? "active" : "danger"}`}
                    onClick={() => {
                      if (cam) {
                        cam.getAudioTracks().forEach((t) => (t.enabled = !micActive));
                        setMicActive(!micActive);
                      }
                    }}
                  >
                    {micActive ? "🎙️ Mic Live" : "🔇 Mic Muted"}
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
                  <span>HD 720p 30fps</span>
                  <span>•</span>
                  <span>AI Speech Engine Ready</span>
                </div>
              </div>
            </div>

            {/* RIGHT: QUESTION, SPEECH RECOGNITION & SUBMIT PANEL */}
            <div className="iv-panel">
              <div className="iv-prog">
                <div className="bar">
                  <i style={{ width: `${pct}%` }} />
                </div>
                <small>Question {qIndex + 1} of {questions.length} · {currentQ.kind}</small>
              </div>

              <div style={{ marginTop: 4 }}>
                <span className="tag">{currentQ.kind} Question</span>
                <h2 className="iv-q" style={{ marginTop: 8 }}>{currentQ.q}</h2>
                <button className="link small" style={{ marginTop: 6 }} onClick={() => mituSpeak(currentQ.q)}>
                  🔊 Repeat question
                </button>
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "var(--ink2)", display: "block", marginBottom: 6 }}>
                  Your Live Answer on Camera:
                </label>
                <textarea
                  className="iv-ans"
                  rows={6}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={
                    SR
                      ? "🎙 Speak naturally into your microphone or type your answer here..."
                      : "Type your answer here..."
                  }
                />
              </div>

              <div className="iv-actions" style={{ marginTop: 12 }}>
                {SR && (
                  <button
                    className={`btn ${listening ? "btn-red" : "btn-out"} sm`}
                    onClick={listening ? stopMic : startMic}
                  >
                    {listening ? "■ Stop Voice Mic" : "🎙 Speak on Camera"}
                  </button>
                )}
                <button
                  className="btn btn-lime sm"
                  disabled={evaluating || !answer.trim()}
                  onClick={submitAnswer}
                >
                  {evaluating ? "Evaluating..." : "Submit Answer →"}
                </button>
                <button
                  className="btn btn-ghost-ink sm"
                  onClick={() => {
                    window.speechSynthesis?.cancel();
                    setStep("report");
                  }}
                >
                  Finish Demo
                </button>
              </div>

              {lastEval && (
                <div className="demo-live-turn">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <b>Answer Evaluation:</b>
                    <span className="demo-score-chip">{lastEval.score}/10 Score</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0" }}>
                    Content: {lastEval.content}/10 · Structure: {lastEval.structure}/10 · Communication: {lastEval.communication}/10
                  </div>
                  <p style={{ fontSize: 13, margin: 0 }}>💡 {lastEval.feedback}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SETUP VIEW
  // -------------------------------------------------------------
  return (
    <div className="page demo-iv-page">
      <div className="wrap narrow">
        <div className="demo-badge">🎥 New Feature · AI Realtime Interview On Camera</div>
        <h1 className="h2">
          Experience a Realtime Interview.<br />
          <em>Live on Camera.</em> With Mitu.
        </h1>
        <p className="muted lead2">
          Practice a genuine, interactive on-camera video interview. Mitu asks questions verbally, evaluates your responses in real-time, and gives instant feedback on your confidence, speech, and content.
        </p>

        <div className="card iv-setup" style={{ marginTop: 22 }}>
          <div style={{ textAlign: "center" }}>
            <Mitu className="iv-mini" />
            <div style={{ marginTop: 8 }}>
              <span className="sc-badge">Mitu AI</span>
            </div>
          </div>

          <div>
            <label className="field">
              <span>Select Your Major / Field</span>
              <div className="row chips" style={{ marginTop: 6 }}>
                {MAJORS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`chip ${major === m ? "sel" : ""}`}
                    onClick={() => setMajor(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </label>

            <label className="field" style={{ marginTop: 12 }}>
              <span>Target Role (optional)</span>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Software Engineer, Management Trainee"
              />
            </label>

            <div style={{ marginTop: 14, padding: "14px 16px", background: "var(--bg)", borderRadius: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <b style={{ fontSize: 14 }}>📹 Camera & Microphone Access</b>
                  <p className="muted small" style={{ margin: "2px 0 0" }}>
                    {cam ? "✅ Camera and microphone ready." : "Will connect to your webcam to simulate a real video interview."}
                  </p>
                </div>
                {!cam && (
                  <button className="btn btn-out sm" type="button" onClick={startCamera}>
                    Preview Camera
                  </button>
                )}
              </div>

              {cam && (
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 14 }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: 140,
                      height: 100,
                      borderRadius: 10,
                      objectFit: "cover",
                      transform: mirror ? "scaleX(-1)" : "none",
                      border: "2px solid var(--lime)",
                    }}
                  />
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--green2)" }}>● Camera Connected</span>
                    <p className="small muted">You're ready to interview on camera.</p>
                  </div>
                </div>
              )}

              {camErr && <p className="err small" style={{ marginTop: 8 }}>{camErr}</p>}
            </div>

            <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-lime" onClick={startDemo}>
                Start Realtime Interview On Camera →
              </button>
              <Link to="/interview" className="btn btn-out">
                Go to Official 10-Min Interview
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
