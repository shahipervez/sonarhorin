import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, stream } from "../api";
import { useLang } from "../i18n";
import { toast } from "../utils";
import { Aurora, JobPicker, Magnetic, Md, ResumePicker, ScoreRing, Tilt, Typewriter, jobFromId, jobReady } from "../components/career/kit";

const CATS = {
  technical: ["Technical", "টেকনিক্যাল"], role: ["Role", "রোল"], behavioral: ["Behavioral", "আচরণগত"],
  situational: ["Situational", "পরিস্থিতি"], hr: ["HR", "এইচআর"],
};

function QCard({ q, i, L, onPractice, onAsk }) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  return (
    <Tilt className={`cq ${open ? "open" : ""}`} style={{ "--i": i }}>
      <button type="button" className="cq-head" onClick={() => { setOpen(!open); }} aria-expanded={open}>
        <span className={`cq-cat ${q.category}`}>{CATS[q.category]?.[L] || q.category}</span>
        <span className={`cq-diff ${q.difficulty}`}>{q.difficulty}</span>
        <b>{q.question}</b>
        <i className="cq-plus" aria-hidden="true" />
      </button>
      {open && (
        <div className="cq-body">
          {q.why && <p className="cq-why"><span>{L ? "ওরা আসলে যা দেখছে" : "What they're really checking"}</span>{q.why}</p>}
          <div className="cq-ans">
            <span className="cx-k">{L ? "নমুনা উত্তর" : "Model answer"}</span>
            <p>{seen ? q.answer : <Typewriter text={q.answer} onDone={() => setSeen(true)} />}</p>
          </div>
          <div className="cq-cols">
            {q.key_points?.length > 0 && <div><span className="cx-k">{L ? "মূল পয়েন্ট" : "Hit these"}</span><ul>{q.key_points.map((k, j) => <li key={j}>{k}</li>)}</ul></div>}
            {q.pitfalls?.length > 0 && <div className="bad"><span className="cx-k">{L ? "এড়িয়ে চলো" : "Avoid"}</span><ul>{q.pitfalls.map((k, j) => <li key={j}>{k}</li>)}</ul></div>}
          </div>
          <div className="cq-actions">
            <button className="cx-btn" onClick={() => onPractice(q.id)}>🎙 {L ? "প্র্যাকটিস" : "Practise this"}</button>
            <button className="cx-btn ghost" onClick={() => onAsk(q.question)}>✦ {L ? "কোচকে জিজ্ঞেস" : "Ask the coach"}</button>
          </div>
        </div>
      )}
    </Tilt>
  );
}

function Practice({ kit, qid, setQid, L }) {
  const qs = kit.kit.questions;
  const q = qs.find((x) => x.id === qid) || qs[0];
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [fb, setFb] = useState(null);
  const [rec, setRec] = useState(false);
  const [secs, setSecs] = useState(0);
  const recRef = useRef(null);
  const timer = useRef(null);
  const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => { setAnswer(""); setFb(null); setSecs(0); }, [q?.id]);
  useEffect(() => () => { recRef.current?.stop(); clearInterval(timer.current); }, []);
  const startTimer = () => { if (!timer.current) timer.current = setInterval(() => setSecs((s) => s + 1), 1000); };
  const stopTimer = () => { clearInterval(timer.current); timer.current = null; };

  const toggleMic = () => {
    if (!SR) { toast(L ? "এই ব্রাউজারে ভয়েস ইনপুট নেই — Chrome ব্যবহার করো।" : "Voice input needs Chrome or Edge."); return; }
    if (rec) { recRef.current?.stop(); return; }
    const r = new SR();
    r.lang = L ? "bn-BD" : "en-US";
    r.continuous = true; r.interimResults = false;
    r.onresult = (e) => {
      const txt = Array.from(e.results).slice(e.resultIndex).map((x) => x[0].transcript).join(" ");
      setAnswer((a) => (a ? a + " " : "") + txt.trim());
    };
    r.onend = () => { setRec(false); stopTimer(); };
    r.onerror = () => { setRec(false); stopTimer(); };
    recRef.current = r; r.start(); setRec(true); startTimer();
  };
  const submit = async () => {
    stopTimer(); recRef.current?.stop();
    setBusy(true);
    try { const r = await api(`/api/career/kits/${kit.id}/practice/`, { method: "POST", body: { question_id: q.id, answer } }); setFb(r.feedback); }
    catch (e) { toast(e.message); } finally { setBusy(false); }
  };
  const mm = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

  return (
    <div className="cp">
      <div className="cp-q">
        <select className="cx-in" value={q.id} onChange={(e) => setQid(e.target.value)}>
          {qs.map((x, i) => <option key={x.id} value={x.id}>{i + 1}. {x.question.slice(0, 90)}</option>)}
        </select>
        <h3>{q.question}</h3>
      </div>
      <div className={`cp-box ${rec ? "rec" : ""}`}>
        <textarea rows={8} value={answer} onChange={(e) => { setAnswer(e.target.value); startTimer(); }}
          placeholder={L ? "উত্তর লেখো, অথবা মাইক চাপো আর বলো…" : "Type your answer — or tap the mic and say it out loud…"} maxLength={5000} />
        <div className="cp-bar">
          <button type="button" className={`cp-mic ${rec ? "on" : ""}`} onClick={toggleMic} aria-label="Voice input">
            <svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
            {rec && <span className="cp-wave"><i /><i /><i /><i /><i /></span>}
          </button>
          <span className="cp-time">{mm}</span>
          <span className="cx-dim small">{answer.trim() ? answer.trim().split(/\s+/).length : 0} {L ? "শব্দ" : "words"} · {L ? "লক্ষ্য ১২০–১৮০" : "aim 120–180"}</span>
          <button className="cx-btn" disabled={busy || answer.trim().split(/\s+/).length < 5} onClick={submit}>{busy ? "…" : L ? "ফিডব্যাক দাও" : "Get feedback"}</button>
        </div>
      </div>
      {fb && (
        <div className="cp-fb">
          <div className="cp-fb-top">
            <ScoreRing value={fb.score} size={130} label="/100" />
            <div>
              <h4>{fb.verdict}</h4>
              <div className="cp-star">
                {["situation", "task", "action", "result"].map((k, i) => (
                  <span key={k} className={fb.star?.[k] ? "on" : ""} style={{ "--i": i }}>{k[0].toUpperCase()}<small>{k}</small></span>
                ))}
              </div>
            </div>
          </div>
          <div className="cq-cols">
            {fb.strengths?.length > 0 && <div><span className="cx-k">{L ? "ভালো হয়েছে" : "Working"}</span><ul>{fb.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul></div>}
            {fb.improve?.length > 0 && <div className="bad"><span className="cx-k">{L ? "আরও ভালো করতে" : "Make it stronger"}</span><ul>{fb.improve.map((s, i) => <li key={i}>{s}</li>)}</ul></div>}
          </div>
          {fb.improved_answer && <div className="cq-ans"><span className="cx-k">{L ? "আরও শক্তিশালী ভার্সন" : "A stronger version"}</span><p><Typewriter text={fb.improved_answer} /></p></div>}
        </div>
      )}
    </div>
  );
}

function Chat({ kit, seed, L }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [live, setLive] = useState(null);
  const abort = useRef(null);
  const endRef = useRef(null);
  useEffect(() => { api(`/api/career/kits/${kit.id}/chat/`).then(setMsgs).catch(() => {}); }, [kit.id]);
  useEffect(() => { if (seed) setText(L ? `"${seed}" — এই প্রশ্নের উত্তর কীভাবে দেব?` : `How should I answer: "${seed}"?`); }, [seed]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [msgs, live]);
  const send = async (m) => {
    const message = (m ?? text).trim();
    if (!message || live !== null) return;
    setText("");
    setMsgs((l) => [...l, { role: "user", content: message, id: `u${Date.now()}` }]);
    setLive("");
    abort.current = new AbortController();
    let acc = "";
    try {
      acc = await stream(`/api/career/kits/${kit.id}/chat/`, { message }, (_, all) => { acc = all; setLive(all); }, { signal: abort.current.signal });
    } catch (e) {
      if (e.name !== "AbortError") toast(e.message);
    }
    if (acc) setMsgs((l) => [...l, { role: "assistant", content: acc, id: `a${Date.now()}` }]);
    setLive(null);
  };
  const clear = async () => { await api(`/api/career/kits/${kit.id}/chat/`, { method: "DELETE" }).catch(() => {}); setMsgs([]); };
  const sugg = L
    ? ["নিজের সম্পর্কে বলো — কীভাবে বলব?", "আমার সবচেয়ে বড় দুর্বলতা কী বলব?", "এই জবের জন্য কোন প্রজেক্টের কথা বলব?", "স্যালারি জিজ্ঞেস করলে কী বলব?"]
    : ["How do I answer “tell me about yourself”?", "Which of my projects should I talk about?", "What if they ask about a skill I don't have?", "Give me a 60-second pitch for this role"];
  return (
    <div className="cc">
      <div className="cc-log">
        {msgs.length === 0 && live === null && (
          <div className="cc-empty">
            <div className="cc-orb" aria-hidden="true"><i /><i /><i /></div>
            <h3>{L ? "আমি হরিণ — তোমার ইন্টারভিউ কোচ।" : "I'm Horin — your interview coach."}</h3>
            <p className="cx-dim">{L ? "যেকোনো প্রশ্ন করো, বা তোমার উত্তর পেস্ট করো।" : "Ask anything about this interview, or paste an answer to improve."}</p>
          </div>
        )}
        {msgs.map((m) => <div key={m.id} className={`cc-msg ${m.role}`}>{m.role === "assistant" ? <Md text={m.content} /> : <p>{m.content}</p>}</div>)}
        {live !== null && <div className="cc-msg assistant live">{live ? <Md text={live} /> : <span className="cc-dots"><i /><i /><i /></span>}<i className="cx-caret" /></div>}
        <div ref={endRef} />
      </div>
      <div className="cc-sugg">{sugg.map((s) => <button key={s} onClick={() => send(s)} disabled={live !== null}>{s}</button>)}</div>
      <form className="cc-in" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <textarea rows={1} value={text} onChange={(e) => setText(e.target.value)} maxLength={4000}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={L ? "কোচকে লেখো…" : "Message your coach…"} />
        {live !== null
          ? <button type="button" className="cx-btn ghost" onClick={() => abort.current?.abort()}>■ {L ? "থামাও" : "Stop"}</button>
          : <button className="cx-btn" disabled={!text.trim()}>↑</button>}
        {msgs.length > 0 && live === null && <button type="button" className="cc-clear" onClick={clear} title={L ? "চ্যাট মুছে ফেলো" : "Clear chat"}>⟲</button>}
      </form>
    </div>
  );
}

function Plan({ k, L }) {
  return (
    <div className="cpl">
      <ol className="cpl-days">
        {k.plan?.map((d, i) => (
          <li key={i} style={{ "--i": i }}>
            <span className="cpl-n">{L ? "দিন" : "Day"} {d.day}</span>
            <b>{d.title}</b>
            <ul>{d.tasks.map((t, j) => <li key={j}>{t}</li>)}</ul>
          </li>
        ))}
      </ol>
      <div className="cq-cols three">
        <div><span className="cx-k">{L ? "ওদের জিজ্ঞেস করো" : "Ask them"}</span><ul>{k.ask_them?.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
        <div><span className="cx-k">{L ? "করো" : "Do"}</span><ul>{k.dos?.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
        <div className="bad"><span className="cx-k">{L ? "কোরো না" : "Don't"}</span><ul>{k.donts?.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
      </div>
    </div>
  );
}

function KitView({ kit, L }) {
  const [tab, setTab] = useState("questions");
  const [cat, setCat] = useState("all");
  const [qid, setQid] = useState(kit.kit.questions[0]?.id);
  const [seed, setSeed] = useState("");
  const k = kit.kit;
  const cats = useMemo(() => ["all", ...new Set(k.questions.map((q) => q.category))], [k]);
  const qs = cat === "all" ? k.questions : k.questions.filter((q) => q.category === cat);
  const tabs = [["questions", L ? "প্রশ্ন" : "Questions", k.questions.length], ["practice", L ? "প্র্যাকটিস" : "Practice"], ["coach", L ? "কোচ" : "Coach", "✦"], ["plan", L ? "প্ল্যান" : "Plan"]];
  return (
    <section className="ck" id="kit">
      <header className="ck-head">
        <div>
          <p className="cx-kicker">{L ? "ইন্টারভিউ কিট" : "INTERVIEW KIT"}{kit.ai && <span className="cx-ai">✦ Claude</span>}</p>
          <h2>{kit.job_title}{kit.company && <em> · {kit.company}</em>}</h2>
          {k.overview && <p className="ck-ov">{k.overview}</p>}
        </div>
        {k.focus_areas?.length > 0 && (
          <div className="ck-focus">{k.focus_areas.map((f, i) => <span key={i} style={{ "--i": i }} title={f.prep}>{f.name}</span>)}</div>
        )}
      </header>
      <nav className="ck-tabs" role="tablist">
        {tabs.map(([key, label, badge]) => (
          <button key={key} role="tab" aria-selected={tab === key} className={tab === key ? "on" : ""} onClick={() => setTab(key)}>
            {label}{badge != null && <small>{badge}</small>}
          </button>
        ))}
        <span className="ck-ink" style={{ "--x": tabs.findIndex((t) => t[0] === tab) }} />
      </nav>
      {tab === "questions" && (
        <>
          <div className="cx-chips filter">{cats.map((c) => <button key={c} className={cat === c ? "on" : ""} onClick={() => setCat(c)}>{c === "all" ? (L ? "সব" : "All") : CATS[c]?.[L] || c}</button>)}</div>
          <div className="cq-list">{qs.map((q, i) => (
            <QCard key={q.id} q={q} i={i} L={L} onPractice={(id) => { setQid(id); setTab("practice"); }} onAsk={(qq) => { setSeed(qq); setTab("coach"); }} />
          ))}</div>
        </>
      )}
      {tab === "practice" && <Practice kit={kit} qid={qid} setQid={setQid} L={L} />}
      {tab === "coach" && <Chat kit={kit} seed={seed} L={L} />}
      {tab === "plan" && <Plan k={k} L={L} />}
    </section>
  );
}

export default function Coach() {
  const [lang] = useLang();
  const L = lang === "bn" ? 1 : 0;
  const [sp, setSp] = useSearchParams();
  const [resumes, setResumes] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  const [useCv, setUseCv] = useState(true);
  const [job, setJob] = useState({});
  const [busy, setBusy] = useState(false);
  const [kit, setKit] = useState(null);
  const [kits, setKits] = useState([]);
  const kitRef = useRef(null);

  useEffect(() => {
    api("/api/career/resumes/").then((l) => { setResumes(l); if (l[0]) setResumeId(l[0].id); }).catch(() => setResumes([]));
    api("/api/career/kits/").then(setKits).catch(() => {});
    if (sp.get("job")) jobFromId(sp.get("job")).then(setJob).catch(() => {});
    if (sp.get("from")) api(`/api/career/tailor/${sp.get("from")}/`).then((t) => {
      const [, req = "", resp = ""] = (t.job_text || "").match(/REQUIREMENTS:\n([\s\S]*?)\n\nRESPONSIBILITIES:\n([\s\S]*)/) || [];
      setJob({ job_title: t.job_title, company: t.company, requirements: req, responsibilities: resp });
      setResumeId(t.resume);
    }).catch(() => {});
    if (sp.get("k")) api(`/api/career/kits/${sp.get("k")}/`).then(setKit).catch(() => {});
  }, []);

  const open = (k) => { setKit(k); setSp({ k: k.id }, { replace: true }); setTimeout(() => kitRef.current?.scrollIntoView({ behavior: "smooth" }), 80); };
  const go = async () => {
    if (!jobReady(job)) { toast(L ? "জবের নাম আর requirements দাও" : "Add the job title and its requirements"); return; }
    setBusy(true);
    try {
      const [r] = await Promise.all([api("/api/career/kits/", { method: "POST", body: { ...job, resume_id: useCv ? resumeId : null } }), new Promise((ok) => setTimeout(ok, 1600))]);
      setKits((l) => [{ id: r.id, job_title: r.job_title, company: r.company, questions: r.kit.questions.length }, ...l]);
      open(r);
    } catch (e) { toast(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="cx-page coach">
      <Aurora tone="violet" />
      <header className="cx-hero">
        <p className="cx-kicker">{L ? "ইন্টারভিউ কোচ" : "INTERVIEW COACH"}</p>
        <h1 className={`cx-title ${L ? "bn" : ""}`}>{L ? <>প্রশ্ন জানো। <em>উত্তর তৈরি রাখো।</em></> : <>Know the questions. <em>Own the answers.</em></>}</h1>
      </header>

      <section className="cx-grid two">
        <div className="cx-panel" style={{ "--i": 0 }}>
          <h2><span>01</span>{L ? "জবের তথ্য" : "The job"}</h2>
          <JobPicker value={job} onChange={setJob} L={L} />
        </div>
        <div className="cx-panel cx-go" style={{ "--i": 1 }}>
          <h2><span>02</span>{L ? "তোমার সিভি" : "Your CV"} <label className="cx-switch"><input type="checkbox" checked={useCv} onChange={(e) => setUseCv(e.target.checked)} /><i />{L ? "উত্তরে ব্যবহার করো" : "use in answers"}</label></h2>
          {useCv && (resumes === null ? <div className="cx-skel" /> : <ResumePicker resumes={resumes} setResumes={setResumes} value={resumeId} onChange={setResumeId} L={L} />)}
          <Magnetic className={`cx-cta ${jobReady(job) ? "" : "off"}`} onClick={go} disabled={busy}>
            {busy ? (L ? "কিট বানাচ্ছি…" : "Building your kit…") : (L ? "ইন্টারভিউ কিট বানাও" : "Build my interview kit")} <b>✦</b>
          </Magnetic>
        </div>
      </section>

      {busy && (
        <div className="cx-forge" role="status" aria-live="polite">
          <div className="cx-orbit" aria-hidden="true">{Array.from({ length: 8 }).map((_, i) => <i key={i} style={{ "--i": i }}>?</i>)}<b>✦</b></div>
          <p>{L ? "জবের প্রতিটা লাইন থেকে প্রশ্ন খুঁজছি…" : "Predicting questions from every line of the job…"}</p>
        </div>
      )}

      <div ref={kitRef}>{kit && <KitView key={kit.id} kit={kit} L={L} />}</div>

      {kits.length > 0 && (
        <section className="cx-history">
          <p className="cx-k">{L ? "আগের কিট" : "Your kits"}</p>
          <div className="cx-hist">
            {kits.map((k) => (
              <button key={k.id} className={`cx-h ${kit?.id === k.id ? "on" : ""}`} onClick={() => api(`/api/career/kits/${k.id}/`).then(open)}>
                <b>{k.job_title}</b><small>{k.company || "—"}</small><em>{k.questions}Q</em>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
