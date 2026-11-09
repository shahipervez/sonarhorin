import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { confetti, toast } from "../utils";

const TABS = [["", "All"], ["graduate", "Graduate Programs"], ["internship", "Internships"], ["training", "Offline Training"]];
const KCOLOR = { graduate: "#6B4EFF", internship: "#2F6FE0", training: "#E8692E" };

const daysLeft = (d) => Math.ceil((new Date(d) - new Date(new Date().toDateString())) / 86400000);

export default function Programs() {
  const [sp, setSp] = useSearchParams();
  const kind = sp.get("kind") || "";
  const [list, setList] = useState(null);
  const [mine, setMine] = useState([]);
  const [open, setOpen] = useState(null);
  const { user } = useAuth();

  useEffect(() => { setList(null); api(`/api/programs/${kind ? `?kind=${kind}` : ""}`).then(setList).catch(() => setList([])); }, [kind]);
  useEffect(() => { if (user) api("/api/programs/mine/").then(setMine).catch(() => {}); }, [user, open]);

  return (
    <div className="page">
      <div className="wrap">
        <div className="page-head">
          <div>
            <p className="eyebrow">05 · Programs</p>
            <h1 className="h2">Graduate programs, internships<br />& <em>our own offline training.</em></h1>
            <p className="muted lead2">Built only for freshers. Every program ends with a সোনারহরিণ certificate.</p>
          </div>
        </div>
        <div className="tabs">{TABS.map(([k, l]) => <button key={k} className={`tab ${kind === k ? "on" : ""}`} onClick={() => setSp(k ? { kind: k } : {})}>{l}</button>)}</div>

        {!list ? <p className="muted">Loading programs…</p> : (
          <div className="pgrid">
            {list.map((p) => {
              const dl = daysLeft(p.deadline);
              return (
                <button key={p.id} className="pcard" onClick={() => setOpen(p)} style={{ "--k": KCOLOR[p.kind] }}>
                  <div className="pc-top"><span className="kbadge">{p.kind_label}</span>{p.applied && <span className="tag g">Applied ✓</span>}</div>
                  <h3>{p.title}</h3>
                  <p className="muted small">{p.organization}</p>
                  <p>{p.summary}</p>
                  <div className="pmeta">
                    <span>📍 {p.location}</span><span>🏷 {p.mode_label}</span><span>⏳ {p.duration}</span>
                    {p.stipend && <span>💸 {p.stipend}</span>}{p.fee && <span>🎟 Fee: {p.fee}</span>}
                  </div>
                  <div className="pfoot">
                    <span className={dl <= 5 ? "urgent" : ""}>{p.open ? `${dl} day${dl === 1 ? "" : "s"} left to apply` : "Closed"}</span>
                    <span>{p.seats_left} seats</span>
                  </div>
                  {p.major_list.length > 0 && <div className="tags">{p.major_list.map((m) => <span key={m} className="tag">{m}</span>)}</div>}
                </button>
              );
            })}
            {list.length === 0 && <p className="muted">No programs here yet.</p>}
          </div>
        )}

        {user && mine.length > 0 && (
          <div className="card mt">
            <h3 className="card-t">My applications</h3>
            <table className="tbl"><thead><tr><th>Program</th><th>Type</th><th>Status</th><th>Applied</th></tr></thead>
              <tbody>{mine.map((a) => <tr key={a.id}><td>{a.program.title}</td><td>{a.program.kind_label}</td><td><span className={`status s-${a.status}`}>{a.status_label}</span></td><td>{new Date(a.created_at).toLocaleDateString()}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </div>
      {open && <ProgramModal p={open} onClose={() => setOpen(null)} onApplied={(id) => setList((l) => l.map((x) => (x.id === id ? { ...x, applied: true } : x)))} />}
    </div>
  );
}

function ProgramModal({ p, onClose, onApplied }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [done, setDone] = useState(p.applied);
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    addEventListener("keydown", esc); document.body.style.overflow = "hidden";
    return () => { removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [onClose]);
  const apply = async (e) => {
    e.preventDefault(); setErr("");
    try {
      await api(`/api/programs/${p.id}/apply/`, { method: "POST", body: { motivation: text } });
      setDone(true); onApplied(p.id); confetti(); toast("Application submitted! We'll email you about next steps.");
    } catch (x) { setErr(x.message); }
  };
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="modal-x" onClick={onClose} aria-label="Close">✕</button>
        <span className="kbadge" style={{ "--k": KCOLOR[p.kind] }}>{p.kind_label}</span>
        <h2 className="h3">{p.title}</h2>
        <p className="muted">{p.organization} · {p.location} · {p.mode_label}</p>
        <p>{p.description}</p>
        <div className="pmeta">
          <span>⏳ {p.duration}</span><span>📅 Starts {new Date(p.start_date).toLocaleDateString()}</span>
          <span>🛑 Apply by {new Date(p.deadline).toLocaleDateString()}</span>
          {p.stipend && <span>💸 {p.stipend}</span>}{p.fee && <span>🎟 {p.fee}</span>}
          {p.certificate_on_completion && <span>🏅 Certificate</span>}
        </div>
        <div className="two tight">
          {p.curriculum.length > 0 && <div><h4>What you'll do</h4><ul className="list">{p.curriculum.map((c) => <li key={c}>{c}</li>)}</ul></div>}
          <div>
            {p.requirements.length > 0 && <><h4>Requirements</h4><ul className="list">{p.requirements.map((c) => <li key={c}>{c}</li>)}</ul></>}
            {p.perks.length > 0 && <><h4>Perks</h4><div className="tags">{p.perks.map((c) => <span key={c} className="tag g">{c}</span>)}</div></>}
          </div>
        </div>
        {done ? <p className="cert-note">✓ You've applied. Track it under “My applications”.</p>
          : !p.open ? <p className="err">Applications are closed.</p>
          : !user ? <button className="btn btn-ink" onClick={() => nav("/login?next=/programs")}>Sign in to apply</button>
          : (
            <form onSubmit={apply}>
              <label className="field"><span>Why do you want to join? (min 40 characters)</span>
                <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="What you want to learn, what you've done so far…" /></label>
              {err && <p className="err">{err}</p>}
              <button className="btn btn-ink">Apply now →</button> <Link to="/cv" className="link small">Check your CV first</Link>
            </form>
          )}
      </div>
    </div>
  );
}
