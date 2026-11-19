import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import Seo, { jobPostingLd } from "../components/Seo";
import { useLang } from "../i18n";
import { ApplyModal, CompanyLogo, daysLeft, getCH, money } from "./Jobs";

/** /jobs/:id — one job, shareable + indexable (JobPosting JSON-LD for Google for Jobs). */
export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [lang] = useLang();
  const L = lang === "bn" ? 1 : 0;
  const CH = getCH(L);
  const [j, setJ] = useState(null);
  const [err, setErr] = useState(false);
  const [open, setOpen] = useState(false);

  const load = () => api(`/api/jobs/${id}/`).then(setJ).catch(() => setErr(true));
  useEffect(() => { setJ(null); setErr(false); load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (err) {
    return (
      <div className="page"><div className="wrap narrow">
        <Seo title={L ? "চাকরি পাওয়া যায়নি" : "Job not found"} noindex />
        <h1 className="h2">{L ? "এই চাকরিটা আর নেই।" : "This job is no longer here."}</h1>
        <Link to="/jobs" className="btn btn-ink">{L ? "সব চাকরি দেখো →" : "See all jobs →"}</Link>
      </div></div>
    );
  }
  if (!j) return <div className="page"><div className="wrap narrow"><p className="muted">{L ? "লোড হচ্ছে…" : "Loading…"}</p></div></div>;

  const c = CH[j.channel] || {};
  const dl = daysLeft(j.deadline);
  const st = j.my_status;
  const desc = `${j.title} at ${j.company.name} — ${j.remote ? "Remote" : j.location}, ${j.job_type_label}. ${money(j.salary_min, j.salary_max, 0)}. Fresher-friendly job in Bangladesh on Sonarhorin.`;

  return (
    <div className="page job-detail">
      <Seo title={`${j.title} — ${j.company.name}`} description={desc} type="article" image={j.company.logo || undefined} jsonLd={jobPostingLd(j)} />
      <div className="wrap narrow">
        <p className="eyebrow"><Link to="/jobs">← {L ? "সব চাকরি" : "All jobs"}</Link></p>
        <article className="jcard jd-card" style={{ "--cc": j.company.color }}>
          <header>
            <CompanyLogo company={j.company} />
            <div>
              <h1 className="h3">{j.title}</h1>
              <p>{j.company.name}{j.company.is_partner && <span className="partner">✓ Partner</span>}</p>
            </div>
          </header>
          <div className="jmeta">
            <span>📍 {j.remote ? (L ? "রিমোট" : "Remote") : j.location}</span>
            <span>🗂 {j.job_type_label}</span>
            <span>💸 {money(j.salary_min, j.salary_max, L)}</span>
            {dl != null && <span className={dl <= 5 ? "urgent" : ""}>⏳ {L ? `${dl} দিন বাকি` : `${dl}d left`}</span>}
          </div>
          {j.description && <p className="jd-desc">{j.description}</p>}
          {!!j.requirements?.length && (
            <>
              <h2 className="h4">{L ? "যা লাগবে" : "What you need"}</h2>
              <div className="tags">{j.requirements.map((r) => <span key={r} className="tag">{r}</span>)}</div>
            </>
          )}
          <div className="tags">
            <span className="tag g">{L ? "০ বছর অভিজ্ঞতা" : "0 yrs exp"}</span>
            {j.major_list.map((m) => <span key={m} className="tag">{m}</span>)}
          </div>
          <footer>
            <span className={`chbadge ${c.cls || ""}`} title={c.d}>{c.ic} {c.t}</span>
            {st && st !== "needs_action" ? (
              <span className="applied">✓ {L ? "আবেদন সম্পন্ন" : "Applied"} · <Link to="/applications">{L ? "ট্র্যাক করো" : "Track it"}</Link></span>
            ) : (
              <button className="btn btn-ink sm" onClick={() => (user ? setOpen(true) : nav(`/login?next=/jobs/${j.id}`))}>
                {st === "needs_action" ? (L ? "পোর্টালে শেষ করো →" : "Finish on portal →") : j.channel === "portal" ? (L ? "অ্যাসিস্টেড আবেদন" : "Assisted apply") : (L ? "১-ট্যাপে আবেদন" : "Apply in 1 tap")}
              </button>
            )}
          </footer>
        </article>
      </div>
      {open && <ApplyModal j={j} L={L} CH={CH} onClose={() => setOpen(false)} onApplied={load} />}
    </div>
  );
}
