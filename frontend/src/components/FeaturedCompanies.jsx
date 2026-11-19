import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useLang } from "../i18n";

/**
 * Bangladesh Top Corporate Career Portals & Featured Companies
 * Displays scraped real logos, verified corporate badges, role-based dynamic job listings, and direct portal links.
 */

function initials(name) {
  const w = name.replace(/\(.*?\)|ltd\.?|limited|plc\.?|inc\.?/gi, "").trim().split(/\s+/).filter(Boolean);
  return (w.length > 1 ? w[0][0] + w[1][0] : (w[0] || "?").slice(0, 2)).toUpperCase();
}

const clean = (name) => name.replace(/\s*\(demo\)\s*/i, "").replace(/\s+(ltd\.?|limited|plc\.?)$/i, "").trim();

function formatSalary(min, max, L) {
  if (min && max) {
    return L ? `৳${Math.round(min / 1000)}k–৳${Math.round(max / 1000)}k` : `৳${Math.round(min / 1000)}k–৳${Math.round(max / 1000)}k`;
  }
  if (min) {
    return L ? `৳${Math.round(min / 1000)}k+` : `৳${Math.round(min / 1000)}k+`;
  }
  return L ? "আলোচনা সাপেক্ষে" : "Negotiable";
}

// 8 Top Fresher Role Categories
const ROLE_CATEGORIES = [
  {
    id: "all",
    icon: "🌟",
    titleEn: "All Roles",
    titleBn: "সকল সার্কুলার",
    matcher: () => true,
  },
  {
    id: "software_ai",
    icon: "💻",
    titleEn: "Software & AI",
    titleBn: "সফটওয়্যার ও এআই",
    matcher: (j) => {
      const text = `${j.title} ${j.company?.name || ""} ${(j.major_list || []).join(" ")} ${j.description || ""}`.toLowerCase();
      return /software|developer|engineer|ml|ai|qa|tech|web|data|python|react|frontend|backend|fullstack|game|cse/.test(text);
    },
  },
  {
    id: "business_mgt",
    icon: "📈",
    titleEn: "Business & Sales",
    titleBn: "বিজনেস ও সেলস",
    matcher: (j) => {
      const text = `${j.title} ${j.company?.name || ""} ${(j.major_list || []).join(" ")} ${j.description || ""}`.toLowerCase();
      return /business|marketing|sales|executive|analyst|commercial|bba|management|growth|supply chain|operations/.test(text);
    },
  },
  {
    id: "banking_fin",
    icon: "🏢",
    titleEn: "Banking & Fintech",
    titleBn: "ব্যাংক ও ফাইন্যান্স",
    matcher: (j) => {
      const text = `${j.title} ${j.company?.name || ""} ${j.company?.industry || ""} ${(j.major_list || []).join(" ")}`.toLowerCase();
      return /bank|fintech|finance|accounts|audit|bkash|brac|ebl|city bank|financial/.test(text);
    },
  },
  {
    id: "textile_rmg",
    icon: "🧵",
    titleEn: "Textile & RMG",
    titleBn: "টেক্সটাইল ও আরএমজি",
    matcher: (j) => {
      const text = `${j.title} ${j.company?.name || ""} ${j.company?.industry || ""} ${(j.major_list || []).join(" ")}`.toLowerCase();
      return /textile|garment|merchandis|qc|fabric|apparel|lab|rmg|spinning|dyeing/.test(text);
    },
  },
  {
    id: "core_eng",
    icon: "⚙️",
    titleEn: "Engineering",
    titleBn: "ইঞ্জিনিয়ারিং",
    matcher: (j) => {
      const text = `${j.title} ${j.company?.name || ""} ${(j.major_list || []).join(" ")}`.toLowerCase();
      return /mechanical|civil|electrical|eee|engineering|hardware|maintenance|production/.test(text);
    },
  },
  {
    id: "internships",
    icon: "🎓",
    titleEn: "Internships",
    titleBn: "ইন্টার্নশিপ",
    matcher: (j) => j.job_type === "internship" || /intern|internship/i.test(j.title),
  },
  {
    id: "trainee",
    icon: "⚡",
    titleEn: "Trainee / MTO",
    titleBn: "ম্যানেজমেন্ট ট্রেইনি",
    matcher: (j) => j.job_type === "trainee" || /trainee|mto|management trainee|leader/i.test(j.title),
  },
];

function CompanyLogo({ company, className = "fc-logo-box", size = "normal" }) {
  const slug = company?.slug;
  const [src, setSrc] = useState(() => (slug ? `/logos/${slug}.svg` : company?.logo));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSrc(slug ? `/logos/${slug}.svg` : company?.logo);
    setFailed(false);
  }, [slug, company?.logo]);

  const handleErr = () => {
    if (src && src.endsWith(".svg")) {
      setSrc(`/logos/${slug}.png`);
    } else if (src && !src.startsWith("/media/")) {
      setSrc(`/media/logos/${slug}.png`);
    } else {
      setFailed(true);
    }
  };

  if (!src || failed) {
    return (
      <span className={`${className} fc-mono-fallback`} style={{ "--c": company?.color || "#FFC23D" }}>
        {initials(company?.name || "CO")}
      </span>
    );
  }

  return (
    <div className={`${className} ${size === "sm" ? "fc-logo-sm" : ""}`}>
      <img src={src} alt={company?.name || "Company"} loading="lazy" onError={handleErr} />
    </div>
  );
}

function Tile({ c, L }) {
  const [src, setSrc] = useState(() => (c.slug ? `/logos/${c.slug}.svg` : c.logo));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSrc(c.slug ? `/logos/${c.slug}.svg` : c.logo);
    setFailed(false);
  }, [c.slug, c.logo]);

  const handleErr = () => {
    if (src && src.endsWith(".svg")) {
      setSrc(`/logos/${c.slug}.png`);
    } else if (src && !src.startsWith("/media/")) {
      setSrc(`/media/logos/${c.slug}.png`);
    } else {
      setFailed(true);
    }
  };

  return (
    <div
      className="fc-tile"
      style={{ "--c": c.color || "#FFC23D" }}
      title={`${c.name} — ${c.industry || "Corporate Office"}`}
    >
      {c.careers_url && (
        <a
          href={c.careers_url}
          target="_blank"
          rel="noopener noreferrer"
          className="fc-quick-ext"
          title={L ? `${c.name}-এর অফিসিয়াল ক্যারিয়ার পোর্টাল দেখুন` : `Visit official ${c.name} Career Portal`}
          onClick={(e) => e.stopPropagation()}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      )}

      <div className="fc-tile-logo-box">
        {src && !failed ? (
          <img src={src} alt={c.name} loading="lazy" onError={handleErr} />
        ) : (
          <span className="fc-mono">
            <i>{initials(c.name)}</i>
            <b>{clean(c.name)}</b>
          </span>
        )}
      </div>

      <div className="fc-hover-actions">
        {c.careers_url && (
          <a
            href={c.careers_url}
            target="_blank"
            rel="noopener noreferrer"
            className="fc-action-btn fc-action-portal"
          >
            <span>{L ? "অফিসিয়াল পোর্টাল" : "Official Portal"}</span>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </a>
        )}
        <Link to={`/jobs?q=${encodeURIComponent(clean(c.name))}`} className="fc-action-btn fc-action-jobs">
          {c.open_jobs > 0 ? (L ? `${c.open_jobs}টি পদ` : `${c.open_jobs} roles`) : (L ? "পদ দেখুন" : "View jobs")}
        </Link>
      </div>

      <div className="fc-tile-meta">
        <span className="fc-tile-name">{clean(c.name)}</span>
        <span className="fc-tile-badge">
          {c.open_jobs > 0 ? (L ? `${c.open_jobs}টি পদ` : `${c.open_jobs} open`) : (L ? "কর্পোরেট" : "Corporate")}
        </span>
      </div>
    </div>
  );
}

function CorpCard({ c, L }) {
  const [src, setSrc] = useState(() => (c.slug ? `/logos/${c.slug}.svg` : c.logo));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSrc(c.slug ? `/logos/${c.slug}.svg` : c.logo);
    setFailed(false);
  }, [c.slug, c.logo]);

  const handleErr = () => {
    if (src && src.endsWith(".svg")) {
      setSrc(`/logos/${c.slug}.png`);
    } else if (src && !src.startsWith("/media/")) {
      setSrc(`/media/logos/${c.slug}.png`);
    } else {
      setFailed(true);
    }
  };

  return (
    <div className="fc-card" style={{ "--c": c.color || "#FFC23D" }}>
      <div className="fc-card-header">
        <div className="fc-card-logo-wrap">
          {src && !failed ? (
            <img src={src} alt={c.name} loading="lazy" onError={handleErr} />
          ) : (
            <span className="fc-card-mono">{initials(c.name)}</span>
          )}
        </div>

        <div className="fc-card-title-group">
          <div className="fc-card-name-row">
            <h3 className="fc-card-name" title={c.name}>{clean(c.name)}</h3>
            <span className="fc-verified-check" title={L ? "ভেরিফায়েড কর্পোরেট অফিস" : "Verified Corporate Office"}>
              ✓
            </span>
          </div>
          <div className="fc-card-meta-row">
            <span className="fc-card-industry">{c.industry || "Corporate"}</span>
            <span className="fc-card-dot">•</span>
            <span className="fc-card-city">📍 {c.city || "Dhaka, BD"}</span>
          </div>
        </div>
      </div>

      <div className="fc-card-body">
        <div className="fc-card-stat">
          <span className="fc-stat-label">{L ? "সোনারহরিণ সার্কুলার" : "Sonarhorin Roles"}</span>
          <span className="fc-stat-val">
            {c.open_jobs > 0 ? (
              <strong className="fc-val-active">{c.open_jobs} {L ? "টি পদ চালু" : "Active"}</strong>
            ) : (
              <span className="fc-val-muted">{L ? "শীঘ্রই আসছে" : "Coming Soon"}</span>
            )}
          </span>
        </div>
      </div>

      <div className="fc-card-actions">
        {c.careers_url ? (
          <a
            href={c.careers_url}
            target="_blank"
            rel="noopener noreferrer"
            className="fc-btn-career-portal"
            title={L ? `${c.name}-এর সরাসরি ক্যারিয়ার পোর্টালে যান` : `Open official ${c.name} Career Portal`}
          >
            <span>{L ? "অফিসিয়াল ক্যারিয়ার পোর্টাল" : "Official Career Portal"}</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        ) : null}

        <Link to={`/jobs?q=${encodeURIComponent(clean(c.name))}`} className="fc-btn-view-jobs">
          {L ? "সার্কুলার দেখুন →" : "View Jobs →"}
        </Link>
      </div>
    </div>
  );
}

function Row({ items, dir, speed, L }) {
  const base = useMemo(() => {
    let r = [...items];
    while (r.length && r.length < 12) r = [...r, ...items];
    return r;
  }, [items]);

  return (
    <div className={`fc-row ${dir}`} style={{ "--dur": `${Math.max(30, base.length * speed)}s` }}>
      <div className="fc-track">
        {[0, 1].map((k) => (
          <div className="fc-set" key={k} aria-hidden={k === 1}>
            {base.map((c, i) => <Tile key={`${k}-${c.id}-${c.slug || i}`} c={c} L={L} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Interactive Dynamic Job Card
function DynamicJobCard({ job, L, onSelect }) {
  const co = job.company || {};
  const isIntern = job.job_type === "internship";
  const isTrainee = job.job_type === "trainee";
  const typeBadge = isIntern
    ? L ? "🎓 ইন্টার্নশিপ" : "🎓 Internship"
    : isTrainee
    ? L ? "⚡ ট্রেইনি" : "⚡ Trainee"
    : L ? "💼 ফুল-টাইম" : "💼 Full-time";

  const applyLink = job.apply_url || co.careers_url;

  return (
    <article className="fc-job-item" style={{ "--cc": co.color || "#FFC23D" }}>
      <div className="fc-job-item-header">
        <CompanyLogo company={co} className="fc-job-logo-box" size="sm" />
        <div className="fc-job-info">
          <h3 className="fc-job-title" onClick={() => onSelect(job)} title={job.title}>
            {job.title}
          </h3>
          <div className="fc-job-sub">
            <span className="fc-job-company-name">{clean(co.name || "Corporate")}</span>
            <span className="fc-job-vcheck" title={L ? "ভেরিফায়েড কোম্পানি" : "Verified Corporate"}>✓</span>
            <span className="fc-job-dot">•</span>
            <span className="fc-job-loc">📍 {job.remote ? (L ? "রিমোট" : "Remote") : (job.location || "Dhaka")}</span>
          </div>
        </div>
      </div>

      <div className="fc-job-pills-row">
        <span className={`fc-pill-badge ${isIntern ? "intern" : isTrainee ? "trainee" : "full"}`}>
          {typeBadge}
        </span>
        <span className="fc-pill-salary">
          💰 {formatSalary(job.salary_min, job.salary_max, L)}
        </span>
        <span className="fc-pill-exp">
          🎯 {L ? "০ বছর অভিজ্ঞতা (ফ্রেসার)" : "Fresher (0-1y)"}
        </span>
      </div>

      {job.requirements?.length > 0 && (
        <div className="fc-job-skills">
          {job.requirements.slice(0, 3).map((r, i) => (
            <span key={i} className="fc-skill-tag">{r}</span>
          ))}
          {job.major_list?.slice(0, 2).map((m, i) => (
            <span key={`m-${i}`} className="fc-skill-tag major">{m}</span>
          ))}
        </div>
      )}

      <div className="fc-job-footer">
        <button
          type="button"
          className="fc-job-btn-details"
          onClick={() => onSelect(job)}
        >
          {L ? "বিস্তারিত" : "Details"}
        </button>

        {applyLink ? (
          <a
            href={applyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="fc-job-btn-apply"
            title={L ? "অফিসিয়াল সার্কুলারে সরাসরি আবেদন করুন" : "Apply directly on official portal"}
          >
            <span>{L ? "আবেদন করুন" : "Apply Now"}</span>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </a>
        ) : (
          <Link to={`/jobs?q=${encodeURIComponent(job.title)}`} className="fc-job-btn-apply">
            <span>{L ? "আবেদন করুন" : "Apply Now"}</span>
          </Link>
        )}
      </div>
    </article>
  );
}

// Sleek Job Details Popup Modal
function JobModal({ job, L, onClose }) {
  if (!job) return null;
  const co = job.company || {};
  const applyLink = job.apply_url || co.careers_url;

  return (
    <div className="fc-modal-backdrop" onClick={onClose}>
      <div className="fc-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="fc-modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="fc-modal-header">
          <CompanyLogo company={co} className="fc-modal-logo" />
          <div className="fc-modal-title-group">
            <span className="fc-modal-co-name">{clean(co.name || "Corporate House")}</span>
            <h2>{job.title}</h2>
            <div className="fc-modal-sub">
              <span>📍 {job.location || "Dhaka, Bangladesh"}</span>
              <span>•</span>
              <span>💼 {job.job_type_label || "Full-time"}</span>
              <span>•</span>
              <span className="fc-modal-money">💰 {formatSalary(job.salary_min, job.salary_max, L)}</span>
            </div>
          </div>
        </div>

        <div className="fc-modal-body">
          {job.requirements?.length > 0 && (
            <div className="fc-modal-section">
              <h4>{L ? "প্রয়োজনীয় স্কিল ও যোগ্যতা" : "Required Skills & Qualifications"}</h4>
              <div className="fc-modal-tags">
                {job.requirements.map((r, i) => (
                  <span key={i} className="fc-skill-tag">{r}</span>
                ))}
                {job.major_list?.map((m, i) => (
                  <span key={`m-${i}`} className="fc-skill-tag major">{m}</span>
                ))}
              </div>
            </div>
          )}

          {job.description && (
            <div className="fc-modal-section">
              <h4>{L ? "কাজের বিবরণী (Job Description)" : "Job Description"}</h4>
              <div className="fc-modal-desc">{job.description}</div>
            </div>
          )}
        </div>

        <div className="fc-modal-footer">
          <button type="button" className="fc-btn-sec" onClick={onClose}>
            {L ? "বন্ধ করুন" : "Close"}
          </button>
          {applyLink && (
            <a
              href={applyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="fc-btn-prim"
            >
              <span>{L ? "অফিসিয়াল ক্যারিয়ার পোর্টালে আবেদন করুন ↗" : "Apply on Official Portal ↗"}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FeaturedCompanies() {
  const [lang] = useLang();
  const L = lang === "bn" ? 1 : 0;
  const [list, setList] = useState(null);
  const [allJobs, setAllJobs] = useState([]);
  const [selectedRole, setSelectedRole] = useState("all");
  const [showDirectory, setShowDirectory] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeJobModal, setActiveJobModal] = useState(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const ref = useRef(null);

  // Fetch Featured Companies
  useEffect(() => {
    api("/api/jobs/companies/featured/")
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setList(data);
        } else {
          setList([]);
        }
      })
      .catch(() => setList([]));
  }, []);

  // Fetch Live Jobs
  useEffect(() => {
    api("/api/jobs/")
      .then((res) => {
        if (res?.jobs) {
          setAllJobs(res.jobs);
        }
      })
      .catch(() => setAllJobs([]));
  }, []);

  // Lean rows with scroll velocity
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let last = scrollY, skew = 0, raf;
    const tick = () => {
      const v = scrollY - last;
      last = scrollY;
      skew += (Math.max(-8, Math.min(8, v * 0.35)) - skew) * 0.12;
      el.style.setProperty("--skew", `${skew.toFixed(2)}deg`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [list]);

  // Extract unique industries for Directory
  const industries = useMemo(() => {
    if (!list) return [];
    const set = new Set();
    list.forEach((c) => {
      if (c.industry) set.add(c.industry);
    });
    return Array.from(set);
  }, [list]);

  // Filtered companies for Directory
  const filteredCompanies = useMemo(() => {
    if (!list) return [];
    return list.filter((c) => {
      const matchInd = selectedIndustry === "all" || c.industry === selectedIndustry;
      const matchQuery =
        !searchQuery.trim() ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.industry && c.industry.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.city && c.city.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchInd && matchQuery;
    });
  }, [list, selectedIndustry, searchQuery]);

  // Dynamic Jobs Filtered by Selected Role
  const filteredJobs = useMemo(() => {
    const activeCategory = ROLE_CATEGORIES.find((r) => r.id === selectedRole) || ROLE_CATEGORIES[0];
    return allJobs.filter(activeCategory.matcher);
  }, [allJobs, selectedRole]);

  if (!list || list.length < 2) return null;
  const half = Math.ceil(list.length / 2);
  const totalRoles = allJobs.length || list.reduce((n, c) => n + (c.open_jobs || 0), 0);

  return (
    <section className="fc" ref={ref} aria-labelledby="fc-h">
      {/* Elevated Compact Header */}
      <header className="fc-head fc-head-slim">
        <h2 id="fc-h">
          {L ? <>শীর্ষ <em>কর্পোরেট</em> জব</> : <>Top <em>corporate</em> jobs</>}
        </h2>
        <span className="fc-live">
          <i />
          {L ? `${list.length}টি কোম্পানি · ${totalRoles}টি লাইভ পদ` : `${list.length} companies · ${totalRoles} live`}
        </span>
      </header>

      {/* ================= 1. DYNAMIC ROLE SELECTOR TABS ================= */}
      <div className="fc-roles-container">
        <div className="fc-roles-scroll fc-roles-wrap">
          {ROLE_CATEGORIES.map((cat) => {
            const count = allJobs.filter(cat.matcher).length;
            const isActive = selectedRole === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                className={`fc-role-chip ${isActive ? "active" : ""}`}
                onClick={() => {
                  setSelectedRole(cat.id);
                  setVisibleCount(6); // reset pagination on change
                }}
              >
                <span className="fc-role-icon">{cat.icon}</span>
                <span className="fc-role-text">{L ? cat.titleBn : cat.titleEn}</span>
                {count > 0 && <span className="fc-role-count">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= 2. DYNAMIC RELEVANT JOBS SHOWCASE ================= */}
      <div className="fc-jobs-showcase">
        <div className="fc-jobs-showcase-header">
          <div className="fc-jobs-showcase-title">
            <span className="fc-jobs-dot" />
            <h3>
              {L ? (
                <>
                  <strong>{ROLE_CATEGORIES.find((r) => r.id === selectedRole)?.titleBn}</strong>-এর জন্য{" "}
                  <span className="fc-highlight-count">{filteredJobs.length}টি</span> সক্রিয় পদ পাওয়া গেছে
                </>
              ) : (
                <>
                  <span className="fc-highlight-count">{filteredJobs.length}</span> Active Openings for{" "}
                  <strong>{ROLE_CATEGORIES.find((r) => r.id === selectedRole)?.titleEn}</strong>
                </>
              )}
            </h3>
          </div>

          <Link to="/jobs" className="fc-explore-all-link">
            <span>{L ? "সকল জব পোর্টাল দেখুন" : "Explore All Jobs"} →</span>
          </Link>
        </div>

        {filteredJobs.length > 0 ? (
          <>
            <div className="fc-jobs-grid">
              {filteredJobs.slice(0, visibleCount).map((job) => (
                <DynamicJobCard
                  key={job.id}
                  job={job}
                  L={L}
                  onSelect={(j) => setActiveJobModal(j)}
                />
              ))}
            </div>

            {visibleCount < filteredJobs.length && (
              <div className="fc-load-more-row">
                <button
                  type="button"
                  className="fc-load-more-btn"
                  onClick={() => setVisibleCount((c) => c + 6)}
                >
                  {L ? `আরও পদ দেখুন (+${Math.min(6, filteredJobs.length - visibleCount)})` : `Show More (+${Math.min(6, filteredJobs.length - visibleCount)})`}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="fc-empty-jobs">
            <p>{L ? "এই ক্যাটাগরিতে বর্তমানে কোনো পদ পাওয়া যায়নি।" : "No current openings found for this category."}</p>
            <button type="button" className="fc-btn-prim sm" onClick={() => setSelectedRole("all")}>
              {L ? "সব পদ দেখুন" : "View All Roles"}
            </button>
          </div>
        )}
      </div>

      {/* ================= 3. CORPORATE LOGOS MARQUEE & DIRECTORY ================= */}
      <div className="fc-corporate-portals-section">
        <div className="fc-portals-bar">
          <div className="fc-portals-title">
            <h4>{L ? "🏢 অফিসিয়াল কর্পোরেট ক্যারিয়ার পোর্টাল ডিরেক্টরি" : "🏢 Official Corporate Career Portals Directory"}</h4>
            <p>{L ? "কোম্পানির সরাসরি ক্যারিয়ার পোর্টালে যেতে লোগোতে ক্লিক করুন" : "Click any logo to visit their verified official career portal"}</p>
          </div>

          <button
            type="button"
            className={`fc-dir-toggle-btn ${showDirectory ? "active" : ""}`}
            onClick={() => setShowDirectory((v) => !v)}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
            <span>
              {showDirectory
                ? (L ? "মারকি ভিউতে ফিরে যান" : "Collapse Directory")
                : (L ? "🏢 সবগুলো ৩০+ কোম্পানি দেখুন" : "🏢 Explore All 30+ Corporate Portals")}
            </span>
          </button>
        </div>

        {/* Infinite Drift Marquee Rows */}
        <div className={`fc-marquee-wrapper ${showDirectory ? "fc-dimmed" : ""}`}>
          <Row items={list.slice(0, half)} dir="left" speed={3.2} L={L} />
          <Row items={list.slice(half)} dir="right" speed={3.6} L={L} />
        </div>

        {/* Interactive Corporate Directory Section */}
        {showDirectory && (
          <div className="fc-directory-container">
            <div className="fc-directory-header">
              <div className="fc-directory-search">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder={
                    L
                      ? "কোম্পানি বা ইন্ডাস্ট্রি দিয়ে খুঁজুন (যেমন: Grameenphone, Bank, Unilever)..."
                      : "Search company or industry (e.g., Grameenphone, Bank, Unilever)..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" className="fc-search-clear" onClick={() => setSearchQuery("")}>
                    ✕
                  </button>
                )}
              </div>

              <div className="fc-filter-tabs">
                <button
                  type="button"
                  className={`fc-filter-tab ${selectedIndustry === "all" ? "active" : ""}`}
                  onClick={() => setSelectedIndustry("all")}
                >
                  {L ? "সবগুলো" : "All"} ({list.length})
                </button>
                {industries.map((ind) => (
                  <button
                    key={ind}
                    type="button"
                    className={`fc-filter-tab ${selectedIndustry === ind ? "active" : ""}`}
                    onClick={() => setSelectedIndustry(ind)}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>

            <div className="fc-cards-grid">
              {filteredCompanies.map((c) => (
                <CorpCard key={c.id} c={c} L={L} />
              ))}
            </div>

            {filteredCompanies.length === 0 && (
              <div className="fc-empty-state">
                <p>{L ? "কোনো কোম্পানি পাওয়া যায়নি।" : "No companies match your search."}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {activeJobModal && (
        <JobModal
          job={activeJobModal}
          L={L}
          onClose={() => setActiveJobModal(null)}
        />
      )}
    </section>
  );
}
