import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Mitu from "../components/Mitu";
import { MAJORS } from "../config";
import { fmt, mmss, pickVoice } from "../utils";

const FIELD_BN = { CSE: "সিএসই", EEE: "ইইই", BBA: "বিবিএ", English: "ইংরেজি", Pharmacy: "ফার্মেসি", Textile: "টেক্সটাইল", Other: "অন্য বিষয়" };
const JOBCOUNT = { CSE: 412, EEE: 186, BBA: 538, English: 149, Pharmacy: 97, Textile: 221, Other: 305 };

function buildScript(lang, field, intent) {
  const f = field || "CSE", n = JOBCOUNT[f];
  if (lang === "bn") {
    const ib = { job: "প্রথম চাকরি খুঁজছ", intern: "আগে একটা ইন্টার্নশিপ চাও", browse: "একটু ঘুরে দেখছ" }[intent || "job"];
    return [
      { t: "হাই! আমি মিতু, সোনারহরিণ-এর এআই রিক্রুটার।", card: "hello" },
      { t: `তুমি ${FIELD_BN[f]} পড়েছ, আর ${ib}। সুখবর — এই মুহূর্তে ${n.toLocaleString("bn-BD")}টা কোম্পানি ${FIELD_BN[f]} ফ্রেশার খুঁজছে।`, card: "count", n: n.toLocaleString("bn-BD"), f: FIELD_BN[f] },
      { t: 'এখানে "দুই বছরের অভিজ্ঞতা লাগবে" — এসব নেই। প্রতিটা জব শুধু ফ্রেশারদের জন্য।', card: "zero" },
      { t: "আগে তোমার সিভি চেক করো, তারপর কুইক টেস্ট আর এআই ইন্টারভিউ। চলো, তোমার প্রথম চাকরি খুঁজি!", card: "go" },
    ];
  }
  const ie = { job: "you're hunting for your first job", intern: "you want an internship first", browse: "you're just looking around" }[intent || "job"];
  return [
    { t: "Hi! I'm Mitu, your AI recruiter at Sonarhorin.", card: "hello" },
    { t: `So you studied ${f}, and ${ie}. Good news — ${n} companies are hiring ${f} freshers right now.`, card: "count", n: fmt(n), f },
    { t: 'No "two years of experience" nonsense here. Every single job is built for freshers.', card: "zero" },
    { t: "First, let me judge your CV. Then take a quick test and a mock interview with me. Let's find your first job.", card: "go" },
  ];
}

function Card({ seg }) {
  if (!seg || seg.card === "hello") return (<><span className="sc-badge">AI Recruiter</span><div><span className="sc-big">👋</span></div><div className="sc-t">Mitu</div><div className="sc-s">Sonarhorin AI · always online · free</div></>);
  if (seg.card === "count") return (<><span className="sc-badge">Live now</span><div className="sc-num">{seg.n}</div><div className="sc-s">companies hiring {seg.f} freshers</div>
    <div className="sc-bars">{[40, 62, 48, 80, 70, 95, 88].map((h, i) => <i key={i} style={{ height: `${h}%`, animationDelay: `${i * 70}ms` }} />)}</div></>);
  if (seg.card === "zero") return (<><span className="sc-badge red">Banned here</span><div><span className="sc-strike">“2+ years experience”</span></div><div className="sc-s">0 yrs exp · every single job · verified</div></>);
  return (<><span className="sc-badge">Next step</span><div className="sc-t">Judge your CV</div><div style={{ marginTop: 12 }}><Link to="/cv" className="btn btn-ink sm">Start →</Link></div></>);
}

export default function MituVideo({ field, intent, setField }) {
  const [lang, setLang] = useState("en");
  const [stage, setStage] = useState("setup"); // setup | rendering | playing | paused | ended
  const [render, setRender] = useState(0);
  const [seg, setSeg] = useState(0);
  const [muted, setMuted] = useState(false);
  const [note, setNote] = useState("");
  const [, force] = useState(0);
  const sceneRef = useRef(null);
  const P = useRef({ segs: [], durs: [], total: 0, i: 0, playing: false, segEl: 0, useTimer: true, utter: null });
  const langRef = useRef(lang), mutedRef = useRef(muted);
  langRef.current = lang; mutedRef.current = muted;

  const est = (s) => Math.max(2.4, s.t.split(/\s+/).length * (langRef.current === "bn" ? 0.55 : 0.4));

  function playSeg(i) {
    const p = P.current; p.i = i; p.segEl = 0; setSeg(i);
    sceneRef.current?.classList.add("swap"); setTimeout(() => sceneRef.current?.classList.remove("swap"), 250);
    const v = pickVoice(langRef.current), synth = window.speechSynthesis;
    if (synth && !mutedRef.current && v) {
      p.useTimer = false;
      const u = new SpeechSynthesisUtterance(p.segs[i].t); u.voice = v; u.lang = v.lang; u.rate = 1.03; u.pitch = 1.1;
      u.onend = u.onerror = () => { if (p.utter === u && p.playing) { p.utter = null; next(); } };
      p.utter = u; synth.cancel(); synth.speak(u);
    } else { p.useTimer = true; p.utter = null; }
  }
  function next() { const p = P.current; if (p.i + 1 < p.segs.length) playSeg(p.i + 1); else end(); }
  function end() { const p = P.current; p.playing = false; p.utter = null; p.segEl = p.durs[p.i]; setStage("ended"); }
  function stopSpeech() { const p = P.current; const u = p.utter; p.utter = null; if (u) window.speechSynthesis?.cancel(); }
  function start() {
    const p = P.current;
    p.segs = buildScript(langRef.current, field, intent); p.durs = p.segs.map(est); p.total = p.durs.reduce((a, b) => a + b, 0);
    p.playing = true; setStage("playing"); playSeg(0);
    const v = pickVoice(lang);
    setNote(!window.speechSynthesis ? "Voice not supported in this browser — showing subtitles." :
      !v && lang === "bn" ? "Bangla voice is not installed on this device — playing with Bangla subtitles." : "");
  }
  function generate() {
    if (!field) setField("CSE");
    if (window.speechSynthesis) { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; window.speechSynthesis.speak(u); }
    setStage("rendering"); setRender(0);
    let k = 0;
    const id = setInterval(() => { k += 4; setRender(k); if (k >= 100) { clearInterval(id); start(); } }, 70);
  }
  const toggle = () => {
    const p = P.current;
    if (stage === "setup") return generate();
    if (stage === "ended") { p.playing = true; setStage("playing"); return playSeg(0); }
    if (p.playing) { p.playing = false; stopSpeech(); setStage("paused"); }
    else { p.playing = true; setStage("playing"); playSeg(p.i); }
  };

  useEffect(() => {
    let raf, last = 0;
    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
      const p = P.current;
      if (!p.playing) return;
      p.segEl += dt;
      if (p.useTimer && p.segEl >= p.durs[p.i]) next();
      else if (!p.useTimer && p.segEl > p.durs[p.i] * 2.5 + 3) next();
      force((x) => (x + 1) % 1e6);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); P.current.playing = false; window.speechSynthesis?.cancel(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const p = P.current;
  const before = p.durs.slice(0, p.i).reduce((a, b) => a + b, 0);
  const cur = Math.min(p.total, before + Math.min(p.segEl, p.durs[p.i] || 0));
  const showGen = stage === "setup" || stage === "rendering";
  const talking = stage === "playing";

  return (
    <section className="bot" id="bot">
      <div className="wrap">
        <h2 className="h2">See it in action.</h2>
        <p className="sub">Meet Mitu — your AI recruiter. She makes a video just for you, with voice.</p>
        <div className="player">
          <div className="stage">
            <div className="grid-bg" />
            <div className="rec"><span className="dot red" />MITU · AI GENERATED</div>
            <Mitu talking={talking} className="avatar" />
            <div className="scene" ref={sceneRef}><Card seg={p.segs[seg]} /></div>
            <div className={`subs ${talking || stage === "paused" ? "on" : ""} ${lang === "bn" ? "bn" : ""}`}>{p.segs[seg]?.t}</div>
            <div className={`gen ${showGen ? "" : "hide"}`}>
              <h3>Make my video</h3>
              <div className="row">{MAJORS.map((f) => <button key={f} className={`chip ${field === f ? "sel" : ""}`} onClick={() => setField(f)}>{f}</button>)}</div>
              <div className="seg">
                <button className={lang === "en" ? "sel" : ""} onClick={() => setLang("en")}>English</button>
                <button className={`bn ${lang === "bn" ? "sel" : ""}`} onClick={() => setLang("bn")}>বাংলা</button>
              </div>
              {stage === "setup" ? <button className="big-play" onClick={generate} aria-label="Generate video">▶</button> : (
                <div className="render" style={{ display: "block" }}>
                  <div className="bar"><i style={{ width: `${render}%` }} /></div>
                  <p>{["Writing your script…", "Animating Mitu…", "Adding voice…", "Rendering frames…"][Math.min(3, (render / 26) | 0)]} {render}%</p>
                </div>
              )}
            </div>
          </div>
          <div className="controls">
            <button className="ctl" onClick={toggle} aria-label="Play/Pause">{stage === "playing" ? "❚❚" : stage === "ended" ? "↺" : "▶"}</button>
            <span>{mmss(cur)} / {mmss(p.total)}</span>
            <div className="prog" onClick={(e) => {
              if (!p.segs.length) return;
              const r = e.currentTarget.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * p.total;
              let acc = 0, i = 0; while (i < p.durs.length - 1 && acc + p.durs[i] < x) { acc += p.durs[i]; i++; }
              stopSpeech(); p.playing = true; setStage("playing"); playSeg(i);
            }}><i style={{ width: `${p.total ? (cur / p.total) * 100 : 0}%` }} /></div>
            <button className="ctl" aria-label="Mute" onClick={() => { mutedRef.current = !muted; setMuted(!muted); if (p.playing) { stopSpeech(); if (mutedRef.current) p.useTimer = true; else playSeg(p.i); } }}>{muted ? "🔇" : "🔊"}</button>
            <button className="ctl" aria-label="Remake" onClick={() => { p.playing = false; stopSpeech(); setStage("setup"); }}>↻</button>
          </div>
        </div>
        <p className="voice-note">{note}</p>
      </div>
    </section>
  );
}
