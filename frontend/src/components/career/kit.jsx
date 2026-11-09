import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../api";
import { toast } from "../../utils";

/* ============================================================= motion helpers */
export const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Living backdrop: drifting aurora blobs + a soft spotlight that follows the pointer. */
export function Aurora({ tone = "gold" }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;
    let raf = 0;
    const move = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--mx", `${e.clientX}px`);
        el.style.setProperty("--my", `${e.clientY}px`);
      });
    };
    addEventListener("pointermove", move, { passive: true });
    return () => { removeEventListener("pointermove", move); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div ref={ref} className={`cx-aurora ${tone}`} aria-hidden="true">
      <i /><i /><i />
      <span className="cx-grain" />
      <span className="cx-spot" />
    </div>
  );
}

/** Button that leans toward the cursor. */
export function Magnetic({ children, className = "", strength = 0.28, ...rest }) {
  const ref = useRef(null);
  const onMove = (e) => {
    if (reduced()) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * strength;
    const y = (e.clientY - r.top - r.height / 2) * strength;
    ref.current.style.transform = `translate(${x}px, ${y}px)`;
  };
  const reset = () => { if (ref.current) ref.current.style.transform = ""; };
  return (
    <button ref={ref} className={`cx-mag ${className}`} onPointerMove={onMove} onPointerLeave={reset} {...rest}>
      <span className="cx-mag-in">{children}</span>
    </button>
  );
}

/** Card with 3D tilt + glare following the pointer. */
export function Tilt({ children, className = "", max = 7, ...rest }) {
  const ref = useRef(null);
  const onMove = (e) => {
    if (reduced()) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    ref.current.style.setProperty("--rx", `${(0.5 - py) * max}deg`);
    ref.current.style.setProperty("--ry", `${(px - 0.5) * max}deg`);
    ref.current.style.setProperty("--gx", `${px * 100}%`);
    ref.current.style.setProperty("--gy", `${py * 100}%`);
  };
  const reset = () => { ref.current?.style.setProperty("--rx", "0deg"); ref.current?.style.setProperty("--ry", "0deg"); };
  return <div ref={ref} className={`cx-tilt ${className}`} onPointerMove={onMove} onPointerLeave={reset} {...rest}>{children}</div>;
}

/** Counts up to `value` and draws a gradient ring. `from` lets it animate before → after. */
export function ScoreRing({ value = 0, from = 0, size = 150, label, sub }) {
  const [v, setV] = useState(from);
  useEffect(() => {
    if (reduced()) { setV(value); return; }
    let raf, t0;
    const dur = 1400;
    const step = (t) => {
      t0 ??= t;
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 4);
      setV(Math.round(from + (value - from) * e));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, from]);
  const r = 44, C = 2 * Math.PI * r;
  const tone = v >= 80 ? "good" : v >= 60 ? "ok" : "low";
  return (
    <div className={`cx-ring ${tone}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100">
        <defs>
          <linearGradient id="cxg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFE29A" /><stop offset="1" stopColor="#F59E0B" /></linearGradient>
        </defs>
        <circle cx="50" cy="50" r={r} className="trk" />
        <circle cx="50" cy="50" r={r} className="val" style={{ strokeDasharray: `${(v / 100) * C} ${C}` }} />
      </svg>
      <div className="cx-ring-t"><b>{v}</b>{label && <span>{label}</span>}</div>
      {sub && <small className="cx-ring-sub">{sub}</small>}
    </div>
  );
}

/** Reveals text like it's being written (used for model answers the first time they open). */
export function Typewriter({ text = "", speed = 9, onDone }) {
  const [n, setN] = useState(reduced() ? text.length : 0);
  useEffect(() => {
    if (reduced()) { setN(text.length); return; }
    setN(0);
    let i = 0;
    const id = setInterval(() => {
      i += Math.max(1, Math.round(text.length / 260));
      setN(i);
      if (i >= text.length) { clearInterval(id); onDone?.(); }
    }, speed);
    return () => clearInterval(id);
  }, [text]);
  return <span className="cx-tw">{text.slice(0, n)}{n < text.length && <i className="cx-caret" />}</span>;
}

/** Tiny safe markdown → React (bold, bullet lists, paragraphs). Never uses innerHTML. */
export function Md({ text = "" }) {
  const blocks = useMemo(() => {
    const out = [];
    let list = null;
    text.split("\n").forEach((raw) => {
      const ln = raw.trimEnd();
      const b = ln.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
      if (b) { (list ??= []).push(b[1]); return; }
      if (list) { out.push({ t: "ul", items: list }); list = null; }
      if (ln.trim()) out.push({ t: "p", text: ln });
    });
    if (list) out.push({ t: "ul", items: list });
    return out;
  }, [text]);
  const inline = (s) => s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <b key={i}>{part.slice(2, -2)}</b> : <span key={i}>{part}</span>);
  return (
    <div className="cx-md">
      {blocks.map((b, i) => b.t === "ul"
        ? <ul key={i}>{b.items.map((it, j) => <li key={j}>{inline(it)}</li>)}</ul>
        : <p key={i}>{inline(b.text)}</p>)}
    </div>
  );
}

/* ============================================================= pickers */
/** Choose a saved CV, upload a new one, or paste text. */
export function ResumePicker({ resumes, setResumes, value, onChange, L }) {
  const [mode, setMode] = useState(resumes?.length ? "saved" : "upload");
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [paste, setPaste] = useState("");
  const fileRef = useRef(null);

  useEffect(() => { if (resumes?.length && mode === "upload" && !busy) setMode("saved"); }, [resumes?.length]);

  const send = async (payload) => {
    setBusy(true);
    try {
      const r = await api("/api/career/resumes/", payload);
      setResumes((l) => [r, ...(l || []).map((x) => (r.is_primary ? { ...x, is_primary: false } : x))]);
      onChange(r.id);
      setMode("saved");
      toast(L ? "সিভি পড়া হয়েছে ✓" : "CV read ✓");
    } catch (e) { toast(e.message); }
    finally { setBusy(false); }
  };
  const upload = (f) => {
    if (!f) return;
    const fd = new FormData(); fd.append("file", f);
    send({ method: "POST", form: fd });
  };
  const sel = resumes?.find((r) => r.id === value);

  return (
    <div className="cx-picker">
      <div className="cx-seg" role="tablist">
        {[["saved", L ? "সেভ করা" : "Saved"], ["upload", L ? "আপলোড" : "Upload"], ["paste", L ? "পেস্ট" : "Paste"]].map(([k, l]) => (
          <button key={k} type="button" className={mode === k ? "on" : ""} onClick={() => setMode(k)} disabled={k === "saved" && !resumes?.length}>{l}</button>
        ))}
      </div>
      {mode === "saved" && (
        <div className="cx-cvlist">
          {resumes?.map((r) => (
            <button type="button" key={r.id} className={`cx-cv ${value === r.id ? "on" : ""}`} onClick={() => onChange(r.id)}>
              <span className="cx-cv-ic" aria-hidden="true"><i /><i /><i /></span>
              <span className="cx-cv-t"><b>{r.title}</b><small>{r.profile?.skills?.length || 0} {L ? "স্কিল" : "skills"} · {(r.profile?.projects?.length || 0) + (r.profile?.experience?.length || 0)} {L ? "প্রজেক্ট/কাজ" : "projects & roles"}</small></span>
              {r.is_primary && <em>{L ? "মূল" : "Main"}</em>}
            </button>
          ))}
        </div>
      )}
      {mode === "upload" && (
        <div
          className={`cx-drop ${drag ? "drag" : ""} ${busy ? "busy" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files[0]); }}
          onClick={() => !busy && fileRef.current.click()}
          role="button" tabIndex={0}
        >
          <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" hidden onChange={(e) => upload(e.target.files[0])} />
          <div className="cx-papers" aria-hidden="true"><i /><i /><i /></div>
          <b>{busy ? (L ? "পড়ছি…" : "Reading your CV…") : (L ? "সিভি এখানে ছাড়ো" : "Drop your CV here")}</b>
          <small>PDF · DOCX · TXT — {L ? "সর্বোচ্চ ৫ MB, প্রাইভেট থাকবে" : "max 5 MB, stays private"}</small>
        </div>
      )}
      {mode === "paste" && (
        <div className="cx-paste">
          <textarea rows={8} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={L ? "পুরো সিভি এখানে পেস্ট করো…" : "Paste your whole CV here…"} maxLength={30000} />
          <button type="button" className="cx-btn" disabled={busy || paste.trim().split(/\s+/).length < 25}
            onClick={() => send({ method: "POST", body: { text: paste, title: L ? "পেস্ট করা সিভি" : "Pasted CV" } })}>
            {busy ? "…" : L ? "সিভি পড়ো" : "Read CV"}
          </button>
        </div>
      )}
      {sel && mode === "saved" && (
        <div className="cx-peek">
          {sel.profile?.skills?.slice(0, 10).map((s, i) => <span key={s} style={{ "--i": i }}>{s}</span>)}
        </div>
      )}
    </div>
  );
}

/** Pick a fresher job from the board, or paste any job post. */
export function JobPicker({ value, onChange, L }) {
  const [mode, setMode] = useState(value?.job_id ? "board" : "paste");
  const [q, setQ] = useState("");
  const [jobs, setJobs] = useState(null);
  useEffect(() => {
    if (mode !== "board") return;
    const id = setTimeout(() => {
      api(`/api/jobs/${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`).then((d) => setJobs(d.jobs || d.results || [])).catch(() => setJobs([]));
    }, 220);
    return () => clearTimeout(id);
  }, [q, mode]);
  const set = (patch) => onChange({ ...value, ...patch });
  return (
    <div className="cx-picker">
      <div className="cx-seg" role="tablist">
        <button type="button" className={mode === "board" ? "on" : ""} onClick={() => setMode("board")}>{L ? "জব বোর্ড" : "From job board"}</button>
        <button type="button" className={mode === "paste" ? "on" : ""} onClick={() => { setMode("paste"); set({ job_id: null }); }}>{L ? "যেকোনো জব পেস্ট" : "Paste any job"}</button>
      </div>
      {mode === "board" ? (
        <div className="cx-jobs">
          <input className="cx-in" value={q} onChange={(e) => setQ(e.target.value)} placeholder={L ? "পদ বা কোম্পানি খোঁজো…" : "Search role or company…"} />
          <div className="cx-joblist">
            {jobs === null && <p className="cx-dim">…</p>}
            {jobs?.length === 0 && <p className="cx-dim">{L ? "কিছু পাওয়া যায়নি — পেস্ট করে দেখো।" : "Nothing found — paste the job instead."}</p>}
            {jobs?.slice(0, 30).map((j) => (
              <button type="button" key={j.id} className={`cx-job ${value?.job_id === j.id ? "on" : ""}`}
                onClick={() => set({ job_id: j.id, job_title: j.title, company: j.company?.name || "", requirements: (j.requirements || []).map((r) => `- ${r}`).join("\n"), responsibilities: j.description || "" })}>
                <span className="cx-logo" style={{ background: j.company?.color || "#FFC23D" }}>{(j.company?.name || "?")[0]}</span>
                <span><b>{j.title}</b><small>{j.company?.name} · {j.location}</small></span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="cx-form">
          <div className="cx-row">
            <input className="cx-in" value={value?.job_title || ""} onChange={(e) => set({ job_title: e.target.value })} placeholder={L ? "পদের নাম *" : "Job title *"} maxLength={160} />
            <input className="cx-in" value={value?.company || ""} onChange={(e) => set({ company: e.target.value })} placeholder={L ? "কোম্পানি" : "Company"} maxLength={140} />
          </div>
          <textarea className="cx-in" rows={5} value={value?.requirements || ""} onChange={(e) => set({ requirements: e.target.value })}
            placeholder={L ? "Requirements — জব পোস্ট থেকে পেস্ট করো" : "Requirements — paste from the job post"} maxLength={12000} />
          <textarea className="cx-in" rows={5} value={value?.responsibilities || ""} onChange={(e) => set({ responsibilities: e.target.value })}
            placeholder={L ? "Responsibilities — কী কাজ করতে হবে" : "Responsibilities — what you'll do"} maxLength={12000} />
        </div>
      )}
    </div>
  );
}

/** Pre-fill from /x?job=ID */
export async function jobFromId(id) {
  const j = await api(`/api/jobs/${id}/`);
  return { job_id: j.id, job_title: j.title, company: j.company?.name || "", requirements: (j.requirements || []).map((r) => `- ${r}`).join("\n"), responsibilities: j.description || "" };
}

/** Keywords flying from the job into the document while the AI works. */
export function KeywordFlight({ words = [], active }) {
  if (!active || reduced()) return null;
  const list = (words.length ? words : ["Skills", "Impact", "Keywords", "Results", "Fit", "Story"]).slice(0, 12);
  return (
    <div className="cx-flight" aria-hidden="true">
      {list.map((w, i) => (
        <span key={w + i} style={{ "--i": i, "--y": `${8 + ((i * 37) % 80)}%`, "--d": `${(i % 6) * 0.35}s` }}>{w}</span>
      ))}
    </div>
  );
}

export const jobReady = (j) => (j?.job_title || "").trim() && ((j?.requirements || "") + " " + (j?.responsibilities || "")).trim().split(/\s+/).length >= 5;
