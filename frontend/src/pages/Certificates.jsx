import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, download } from "../api";
import { useAuth } from "../auth";
import { toast } from "../utils";

const HOW = [
  { k: "skill_check", t: "Skill Check", d: "Score 70%+ on a Quick Test for your major.", to: "/quick-test" },
  { k: "interview", t: "Interview Ready", d: "Score 70+ in the 10-minute AI interview.", to: "/interview" },
  { k: "efficiency", t: "Verified Efficiency", d: "Pass a proctored Efficiency Test with high integrity.", to: "/efficiency" },
  { k: "training", t: "Program / Training", d: "Complete a graduate program, internship or offline training.", to: "/programs" },
];

export default function Certificates() {
  const { user } = useAuth();
  const [certs, setCerts] = useState(null);
  const [code, setCode] = useState("");
  const nav = useNavigate();
  useEffect(() => { if (user) api("/api/certificates/").then(setCerts).catch(() => setCerts([])); }, [user]);

  return (
    <div className="page"><div className="wrap">
      <div className="page-head"><div>
        <p className="eyebrow">06 · Certification</p>
        <h1 className="h2">Proof that you're <em>job-ready.</em></h1>
        <p className="muted lead2">Every সোনারহরিণ certificate has a unique code. Employers verify it in one click — no fake certificates.</p>
      </div></div>

      <div className="card verify-box" id="verify">
        <h3 className="card-t">Verify a certificate</h3>
        <form className="row" onSubmit={(e) => { e.preventDefault(); if (code.trim()) nav(`/verify/${code.trim().toUpperCase()}`); }}>
          <input className="inp" value={code} onChange={(e) => setCode(e.target.value)} placeholder="SH-XXXXXXXX" />
          <button className="btn btn-ink sm">Verify</button>
        </form>
      </div>

      {user ? (
        <>
          <h3 className="sec-t">My certificates</h3>
          {certs === null ? <p className="muted">Loading…</p> : certs.length === 0 ? <p className="muted">No certificates yet — earn your first one below.</p> : (
            <div className="cgrid">
              {certs.map((c) => (
                <div key={c.id} className={`certcard k-${c.kind}`}>
                  <div className="cc-seal">✓</div>
                  <span className="cc-kind">{c.kind_label}</span>
                  <h3>{c.title}</h3>
                  <p className="muted small">{user.full_name} · {new Date(c.issued_at).toLocaleDateString()}</p>
                  {c.score != null && <p className="cc-score">{c.score}%{c.details?.integrity_score != null && <small> · integrity {c.details.integrity_score}%</small>}</p>}
                  <code>{c.code}</code>
                  <div className="cc-actions">
                    <button className="btn btn-ink sm" onClick={() => download(`/api/certificates/${c.id}/pdf/`, `sonarhorin-${c.code}.pdf`)}>⬇ PDF</button>
                    <button className="btn btn-out sm" onClick={() => { navigator.clipboard?.writeText(`${location.origin}/verify/${c.code}`); toast("Verification link copied — paste it in your CV or LinkedIn."); }}>Copy verify link</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : <p className="muted"><Link className="link" to="/login?next=/certificates">Sign in</Link> to see your certificates.</p>}

      <h3 className="sec-t">How to earn them</h3>
      <div className="cgrid how4">{HOW.map((h) => <Link key={h.k} to={h.to} className={`certcard ghost k-${h.k}`}><span className="cc-kind">{h.t}</span><p>{h.d}</p><span className="fgo">Start →</span></Link>)}</div>
    </div></div>
  );
}
