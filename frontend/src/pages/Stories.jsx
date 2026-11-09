import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import StoryCard from "../components/StoryCard";
import { confetti } from "../utils";

export default function Stories() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [major, setMajor] = useState("");
  useEffect(() => { api(`/api/stories/${major ? `?major=${major}` : ""}`).then(setData).catch(() => setData({ stats: {}, stories: [] })); }, [major]);

  return (
    <div className="page">
      <div className="wrap">
        <div className="page-head"><div>
          <p className="eyebrow">সাফল্যের গল্প · Success stories</p>
          <h1 className="h2">From <span className="strike-static">REJECTED</span> to <em>HIRED.</em></h1>
          <p className="muted lead2">Freshers who used সোনারহরিণ to land their first job. Stories with a ✓ Verified badge are backed by a real certificate.</p>
        </div></div>
        <div className="tabs">{["", "CSE", "EEE", "BBA", "English", "Pharmacy", "Textile", "Other"].map((m) => <button key={m || "all"} className={`tab ${major === m ? "on" : ""}`} onClick={() => setMajor(m)}>{m || "All"}</button>)}</div>
        {data?.stats?.sample_only && <p className="sample-note left">Showing sample stories for the prototype. Real member stories appear here after review.</p>}
        <div className="stories-grid">
          {!data ? <p className="muted">Loading…</p> : data.stories.map((s) => <StoryCard key={s.id} s={s} />)}
        </div>
        <div id="share" className="mt">{user ? <ShareForm /> : (
          <div className="card share-cta"><h3 className="h3">Got your first job?</h3><p className="muted">Sign in to share your story — we fill in your journey automatically.</p>
            <Link className="btn btn-ink" to="/login?next=/stories">Sign in to share</Link></div>
        )}</div>
      </div>
    </div>
  );
}

function ShareForm() {
  const { user } = useAuth();
  const [mine, setMine] = useState(null);
  const [f, setF] = useState({ name: `${user.full_name.split(" ")[0]} ${(user.full_name.split(" ")[1] || "")[0] || ""}.`.replace(/ \.$/, ""), university: user.university || "", city: "", role: "", company: "", quote: "", months_jobless: "", applications_before: "", consent: false });
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  useEffect(() => { api("/api/stories/mine/").then(setMine).catch(() => {}); }, [sent]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr("");
    try {
      await api("/api/stories/", { method: "POST", body: { ...f, months_jobless: Number(f.months_jobless) || 0, applications_before: Number(f.applications_before) || 0 } });
      setSent(true); confetti();
    } catch (x) { setErr(x.message); }
  };
  const j = mine?.journey;
  const pending = mine?.stories?.find((s) => s.status === "pending");
  if (sent || pending) return <div className="card share-cta"><h3 className="h3">Thank you! 🎉</h3><p className="muted">Your story is waiting for review. Once approved, it appears here and on the home page.</p></div>;
  return (
    <form className="card share-form" onSubmit={submit}>
      <h3 className="h3">Share your story</h3>
      <p className="muted">Your story can be the reason another fresher doesn't give up.</p>
      {j && (
        <div className="auto-journey">
          <span className="eyebrow">Filled in from your সোনারহরিণ activity</span>
          <div className="chips">
            <span>CV score: {j.cv_score_before ?? "—"}{j.cv_score_after != null ? ` → ${j.cv_score_after}` : ""}</span>
            <span>Skill tests passed: {j.tests_passed}</span>
            <span>Days on সোনারহরিণ: {j.days_to_hire}</span>
            <span>{j.certificate_code ? `Certificate ${j.certificate_code} → ✓ Verified badge` : "No certificate yet (no Verified badge)"}</span>
          </div>
        </div>
      )}
      <div className="row2">
        <label className="field"><span>Name to show</span><input required value={f.name} onChange={set("name")} placeholder="e.g. Tania R." /></label>
        <label className="field"><span>University</span><input value={f.university} onChange={set("university")} /></label>
        <label className="field"><span>Role you got</span><input required value={f.role} onChange={set("role")} placeholder="Junior Software Engineer" /></label>
        <label className="field"><span>Company</span><input required value={f.company} onChange={set("company")} /></label>
        <label className="field"><span>Months jobless before joining</span><input type="number" min="0" max="120" value={f.months_jobless} onChange={set("months_jobless")} /></label>
        <label className="field"><span>CVs sent before joining</span><input type="number" min="0" max="2000" value={f.applications_before} onChange={set("applications_before")} /></label>
      </div>
      <label className="field"><span>Your story (Bangla or English, 1–3 sentences)</span><textarea required rows={4} maxLength={600} value={f.quote} onChange={set("quote")} placeholder="What was hard, what changed, what got you hired…" /></label>
      <label className="check"><input type="checkbox" checked={f.consent} onChange={set("consent")} /> I agree that সোনারহরিণ can show this story publicly.</label>
      {err && <p className="err">{err}</p>}
      <button className="btn btn-ink">Submit for review →</button>
    </form>
  );
}
