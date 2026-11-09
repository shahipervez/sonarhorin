import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";

export default function Verify() {
  const { code } = useParams();
  const [c, setC] = useState(undefined);
  useEffect(() => { api(`/api/certificates/verify/${code}/`).then(setC).catch(() => setC(null)); }, [code]);
  return (
    <div className="page"><div className="wrap narrow">
      <p className="eyebrow">Certificate verification</p>
      {c === undefined ? <p className="muted">Checking {code}…</p> : c === null || c.revoked ? (
        <div className="card verify-res bad"><div className="vr-ic">✕</div><div><h1 className="h3">Not a valid certificate</h1><p className="muted">No active সোনারহরিণ certificate matches <code>{code}</code>.</p></div></div>
      ) : (
        <div className="card verify-res ok">
          <div className="vr-ic">✓</div>
          <div>
            <h1 className="h3">Valid সোনারহরিণ certificate</h1>
            <p><b>{c.holder}</b> ({c.major}) earned <b>{c.title}</b></p>
            <p className="muted">{c.kind_label} · issued {new Date(c.issued_at).toLocaleDateString()} · ID <code>{c.code}</code></p>
            {c.score != null && <p>Score: <b>{c.score}%</b>{c.details?.integrity_score != null && <> · Proctoring integrity: <b>{c.details.integrity_score}%</b></>}</p>}
          </div>
        </div>
      )}
      <p className="mt"><Link className="link" to="/certificates">← Verify another</Link></p>
    </div></div>
  );
}
