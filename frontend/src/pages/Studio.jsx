import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, download } from "../api";
import { useLang } from "../i18n";
import { confetti, toast } from "../utils";
import { Aurora, JobPicker, KeywordFlight, Magnetic, ResumePicker, ScoreRing, jobFromId, jobReady } from "../components/career/kit";

const TEMPLATES = [
  ["modern", "Modern", "আধুনিক"],
  ["classic", "Classic", "ক্লাসিক"],
  ["minimal", "Minimal", "মিনিমাল"],
];

/** The CV rendered like the exported PDF — optionally editable in place. */
function Paper({ c, template, edit, onEdit, L }) {
  const set = (patch) => onEdit({ ...c, ...patch });
  const contact = ["email", "phone", "location", "linkedin", "github", "website"].map((k) => c.contact?.[k]).filter(Boolean);
  const field = (v, k, rows = 1, cls = "") => edit
    ? (rows === 1
      ? <input className={`cvp-edit ${cls}`} value={v || ""} onChange={(e) => set({ [k]: e.target.value })} />
      : <textarea className={`cvp-edit ${cls}`} rows={rows} value={v || ""} onChange={(e) => set({ [k]: e.target.value })} />)
    : <span className={cls}>{v}</span>;
  const setItem = (key, i, patch) => set({ [key]: c[key].map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  const bullets = (key, i, list) => list.map((b, bi) => (
    <li key={bi}>{edit
      ? <textarea className="cvp-edit" rows={2} value={b} onChange={(e) => setItem(key, i, { bullets: list.map((x, xj) => (xj === bi ? e.target.value : x)) })} />
      : b}</li>
  ));
  return (
    <article className={`cvp ${template} ${edit ? "editing" : ""}`}>
      <h3 className="cvp-name">{c.name || "Your Name"}</h3>
      <div className="cvp-hl">{field(c.headline, "headline")}</div>
      {contact.length > 0 && <div className="cvp-ct">{contact.join("  ·  ")}</div>}
      {(c.summary || edit) && <section><h4>{L ? "সারাংশ" : "Summary"}</h4><p>{field(c.summary, "summary", 4)}</p></section>}
      {c.skills?.length > 0 && (
        <section><h4>{L ? "স্কিল" : "Skills"}</h4>
          {edit
            ? <input className="cvp-edit" value={c.skills.join(", ")} onChange={(e) => set({ skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
            : <p className="cvp-skills">{c.skills.map((s) => <span key={s}>{s}</span>)}</p>}
        </section>
      )}
      {c.experience?.length > 0 && (
        <section><h4>{L ? "অভিজ্ঞতা" : "Experience"}</h4>
          {c.experience.map((e, i) => (
            <div key={i} className="cvp-item">
              <div className="cvp-ih"><b>{[e.role, e.org].filter(Boolean).join(" — ")}</b><small>{[e.period, e.location].filter(Boolean).join(" · ")}</small></div>
              <ul>{bullets("experience", i, e.bullets)}</ul>
            </div>
          ))}
        </section>
      )}
      {c.projects?.length > 0 && (
        <section><h4>{L ? "প্রজেক্ট" : "Projects"}</h4>
          {c.projects.map((p, i) => (
            <div key={i} className="cvp-item">
              <div className="cvp-ih"><b>{p.name}{p.tech && <em> — {p.tech}</em>}</b>{p.link && <small>{p.link}</small>}</div>
              <ul>{bullets("projects", i, p.bullets)}</ul>
            </div>
          ))}
        </section>
      )}
      {c.education?.length > 0 && (
        <section><h4>{L ? "শিক্ষা" : "Education"}</h4>
          {c.education.map((ed, i) => (
            <div key={i} className="cvp-item"><div className="cvp-ih"><b>{[ed.degree, ed.institution].filter(Boolean).join(" — ")}</b><small>{[ed.period, ed.result].filter(Boolean).join(" · ")}</small></div></div>
          ))}
        </section>
      )}
      {[["certifications", "Certifications", "সার্টিফিকেশন"], ["achievements", "Achievements", "অর্জন"]].map(([k, en, bn]) => c[k]?.length > 0 && (
        <section key={k}><h4>{L ? bn : en}</h4><ul>{c[k].map((x, i) => <li key={i}>{x}</li>)}</ul></section>
      ))}
    </article>
  );
}

function Letter({ c, edit, onEdit, job }) {
  return (
    <article className="cvp letter">
      <h3 className="cvp-name">{c.name || "Your Name"}</h3>
      <div className="cvp-ct">{[c.contact?.email, c.contact?.phone].filter(Boolean).join("  ·  ")}</div>
      <hr />
      <p className="cvp-re"><b>Re: {job.job_title}{job.company ? ` — ${job.company}` : ""}</b></p>
      {edit
        ? <textarea className="cvp-edit letter-edit" rows={18} value={c.cover_letter || ""} onChange={(e) => onEdit({ ...c, cover_letter: e.target.value })} />
        : (c.cover_letter || "").split("\n\n").map((p, i) => <p key={i} className="cvp-par">{p}</p>)}
    </article>
  );
}

function Result({ t, setT, L }) {
  const [tab, setTab] = useState("cv");
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState(t.content);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setDraft(t.content); setEdit(false); }, [t.id]);
  const a = t.analysis || {};
  const save = async () => {
    setSaving(true);
    try { const r = await api(`/api/career/tailor/${t.id}/`, { method: "PATCH", body: { content: draft } }); setT(r); setEdit(false); toast(L ? "সেভ হয়েছে ✓" : "Saved ✓"); }
    catch (e) { toast(e.message); } finally { setSaving(false); }
  };
  const setTemplate = async (tpl) => {
    setT({ ...t, template: tpl });
    try { await api(`/api/career/tailor/${t.id}/`, { method: "PATCH", body: { template: tpl } }); } catch { /* preview already updated */ }
  };
  const file = (doc, fmt) => {
    const nm = (t.content.name || "CV").replace(/\s+/g, "_");
    download(`/api/career/tailor/${t.id}/export/?fmt=${fmt}&doc=${doc}`, `${nm}_${doc === "cover" ? "Cover_Letter" : "CV"}.${fmt}`).catch((e) => toast(e.message));
  };
  return (
    <section className="cx-result" id="result">
      <aside className="cx-insight">
        <div className="cx-score-wrap">
          <ScoreRing value={a.score_after || 0} from={a.score_before || 0} label={L ? "ম্যাচ" : "match"} />
          <div>
            <p className="cx-k">{L ? "ATS ম্যাচ স্কোর" : "ATS match score"}</p>
            <p className="cx-delta">{a.score_before} <span>→</span> <b>{a.score_after}</b></p>
            <p className="cx-dim">{t.job_title}{t.company ? ` · ${t.company}` : ""}</p>
            {t.ai && <span className="cx-ai">✦ Claude</span>}
          </div>
        </div>
        <div className="cx-block">
          <p className="cx-k">{L ? "মিলেছে" : "Matched"}</p>
          <div className="cx-chips">{(a.matched || []).map((k, i) => <span key={k} className="hit" style={{ "--i": i }}>{k}</span>)}</div>
        </div>
        {a.missing?.length > 0 && (
          <div className="cx-block">
            <p className="cx-k">{L ? "ঘাটতি — সত্যি থাকলে যোগ করো" : "Gaps — add only if true"}</p>
            <div className="cx-chips">{a.missing.map((k, i) => <span key={k} className="gap" style={{ "--i": i }}>{k}</span>)}</div>
          </div>
        )}
        {a.changes?.length > 0 && (
          <div className="cx-block">
            <p className="cx-k">{L ? "কী বদলালাম" : "What changed"}</p>
            <ol className="cx-changes">{a.changes.map((c, i) => <li key={i} style={{ "--i": i }}><b>{c.section}</b><span>{c.what}</span>{c.why && <small>{c.why}</small>}</li>)}</ol>
          </div>
        )}
        {[...(a.warnings || []), ...(a.tips || [])].length > 0 && (
          <div className="cx-block cx-notes">{[...(a.warnings || []), ...(a.tips || [])].map((w, i) => <p key={i}>{w}</p>)}</div>
        )}
      </aside>

      <div className="cx-doc">
        <div className="cx-doc-bar">
          <div className="cx-seg small">
            <button className={tab === "cv" ? "on" : ""} onClick={() => setTab("cv")}>{L ? "সিভি" : "CV"}</button>
            <button className={tab === "cover" ? "on" : ""} onClick={() => setTab("cover")}>{L ? "কভার লেটার" : "Cover letter"}</button>
          </div>
          {tab === "cv" && (
            <div className="cx-tpls">{TEMPLATES.map(([k, en, bn]) => (
              <button key={k} className={`cx-tpl ${k} ${t.template === k ? "on" : ""}`} onClick={() => setTemplate(k)} title={L ? bn : en}><i /><span>{L ? bn : en}</span></button>
            ))}</div>
          )}
          <div className="cx-actions">
            {edit
              ? <><button className="cx-btn ghost" onClick={() => { setDraft(t.content); setEdit(false); }}>{L ? "বাতিল" : "Cancel"}</button>
                <button className="cx-btn" onClick={save} disabled={saving}>{saving ? "…" : L ? "সেভ" : "Save"}</button></>
              : <button className="cx-btn ghost" onClick={() => setEdit(true)}>✎ {L ? "এডিট" : "Edit"}</button>}
          </div>
        </div>
        <div className="cx-paper-stage">
          {tab === "cv"
            ? <Paper c={edit ? draft : t.content} template={t.template} edit={edit} onEdit={setDraft} L={L} />
            : <Letter c={edit ? draft : t.content} edit={edit} onEdit={setDraft} job={t} />}
        </div>
        <div className="cx-dl">
          <span className="cx-k">{L ? "ডাউনলোড" : "Download"}</span>
          <button className="cx-btn" onClick={() => file(tab === "cv" ? "resume" : "cover", "pdf")}>PDF</button>
          <button className="cx-btn ghost" onClick={() => file(tab === "cv" ? "resume" : "cover", "docx")}>Word</button>
          <Link className="cx-btn ghost" to={`/coach?${t.job ? `job=${t.job}` : `from=${t.id}`}`}>🎤 {L ? "ইন্টারভিউ প্রস্তুতি" : "Prepare the interview"} →</Link>
        </div>
      </div>
    </section>
  );
}

export default function Studio() {
  const [lang] = useLang();
  const L = lang === "bn" ? 1 : 0;
  const [sp, setSp] = useSearchParams();
  const [resumes, setResumes] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  const [job, setJob] = useState({});
  const [template, setTemplate] = useState("modern");
  const [busy, setBusy] = useState(false);
  const [t, setT] = useState(null);
  const [history, setHistory] = useState([]);
  const resultRef = useRef(null);

  useEffect(() => {
    api("/api/career/resumes/").then((l) => { setResumes(l); if (l[0]) setResumeId(l[0].id); }).catch(() => setResumes([]));
    api("/api/career/tailor/").then(setHistory).catch(() => {});
    const jid = sp.get("job");
    if (jid) jobFromId(jid).then(setJob).catch(() => {});
    const tid = sp.get("t");
    if (tid) api(`/api/career/tailor/${tid}/`).then(setT).catch(() => {});
  }, []);

  const ready = resumeId && jobReady(job);
  const keywords = (job.requirements || "").match(/\b[A-Z][A-Za-z+#.]{1,15}\b/g)?.slice(0, 12) || [];

  const go = async () => {
    if (!ready) { toast(L ? "সিভি আর জবের তথ্য দাও" : "Add your CV and the job first"); return; }
    setBusy(true); setT(null);
    try {
      const [r] = await Promise.all([api("/api/career/tailor/", { method: "POST", body: { ...job, resume_id: resumeId, template } }), new Promise((ok) => setTimeout(ok, 1600))]);
      setT(r);
      setHistory((h) => [{ id: r.id, job_title: r.job_title, company: r.company, score: r.analysis?.score_after, created_at: r.created_at }, ...h]);
      setSp({ t: r.id }, { replace: true });
      setTimeout(() => { resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); confetti(innerWidth * 0.7, 200); }, 120);
    } catch (e) { toast(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="cx-page">
      <Aurora />
      <header className="cx-hero">
        <p className="cx-kicker">{L ? "সিভি স্টুডিও" : "CV STUDIO"}</p>
        <h1 className={`cx-title ${L ? "bn" : ""}`}>{L ? <>এক সিভি। <em>প্রতিটা জবের জন্য।</em></> : <>One CV. <em>Every job.</em></>}</h1>
        <ol className="cx-steps">
          <li className={resumeId ? "done" : "on"}><i>1</i>{L ? "সিভি" : "Your CV"}</li>
          <li className={jobReady(job) ? "done" : resumeId ? "on" : ""}><i>2</i>{L ? "জব" : "The job"}</li>
          <li className={t ? "done" : ready ? "on" : ""}><i>3</i>{L ? "টেইলর" : "Tailor"}</li>
        </ol>
      </header>

      <section className="cx-grid">
        <div className="cx-panel" style={{ "--i": 0 }}>
          <h2><span>01</span>{L ? "তোমার সিভি" : "Your CV"}</h2>
          {resumes === null ? <div className="cx-skel" /> : <ResumePicker resumes={resumes} setResumes={setResumes} value={resumeId} onChange={setResumeId} L={L} />}
        </div>
        <div className="cx-panel" style={{ "--i": 1 }}>
          <h2><span>02</span>{L ? "যে জবে আবেদন করবে" : "The job"}</h2>
          <JobPicker value={job} onChange={setJob} L={L} />
        </div>
        <div className="cx-panel cx-go" style={{ "--i": 2 }}>
          <h2><span>03</span>{L ? "ডিজাইন" : "Design"}</h2>
          <div className="cx-tpls big">{TEMPLATES.map(([k, en, bn]) => (
            <button key={k} type="button" className={`cx-tpl ${k} ${template === k ? "on" : ""}`} onClick={() => setTemplate(k)}><i /><span>{L ? bn : en}</span></button>
          ))}</div>
          <Magnetic className={`cx-cta ${ready ? "" : "off"}`} onClick={go} disabled={busy}>
            {busy ? (L ? "সাজাচ্ছি…" : "Tailoring…") : (L ? "সিভি টেইলর করো" : "Tailor my CV")} <b>✦</b>
          </Magnetic>
          <p className="cx-dim small">{L ? "শুধু তোমার সিভির সত্যি তথ্য — কিছু বানানো হয় না।" : "Only facts from your CV — nothing invented."}</p>
        </div>
      </section>

      {busy && (
        <div className="cx-forge" role="status" aria-live="polite">
          <KeywordFlight words={keywords} active />
          <div className="cx-forge-doc"><i /><i /><i /><i /><i /><i /><span className="beam" /></div>
          <p>{L ? "জবের ভাষায় তোমার সিভি সাজাচ্ছি…" : "Re-writing your CV in the job's language…"}</p>
        </div>
      )}

      <div ref={resultRef}>{t && <Result t={t} setT={setT} L={L} />}</div>

      {history.length > 0 && (
        <section className="cx-history">
          <p className="cx-k">{L ? "আগের টেইলর করা সিভি" : "Your tailored CVs"}</p>
          <div className="cx-hist">
            {history.map((h) => (
              <button key={h.id} className={`cx-h ${t?.id === h.id ? "on" : ""}`} onClick={() => api(`/api/career/tailor/${h.id}/`).then((r) => { setT(r); setSp({ t: r.id }, { replace: true }); setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 60); })}>
                <b>{h.job_title}</b><small>{h.company || "—"}</small>{h.score != null && <em>{h.score}</em>}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
