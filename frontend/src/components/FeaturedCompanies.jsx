import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useLang } from "../i18n";

/**
 * Bangladesh Top Corporate Career Portals & Featured Companies
 * Displays scraped real logos, verified corporate badges, and direct links to official career portals.
 */

function initials(name) {
  const w = name.replace(/\(.*?\)|ltd\.?|limited|plc\.?|inc\.?/gi, "").trim().split(/\s+/).filter(Boolean);
  return (w.length > 1 ? w[0][0] + w[1][0] : (w[0] || "?").slice(0, 2)).toUpperCase();
}

const clean = (name) => name.replace(/\s*\(demo\)\s*/i, "").replace(/\s+(ltd\.?|limited|plc\.?)$/i, "").trim();

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
      {/* Top right quick external career portal link */}
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

      {/* Logo container */}
      <div className="fc-tile-logo-box">
        {src && !failed ? (
          <img
            src={src}
            alt={c.name}
            loading="lazy"
            onError={handleErr}
          />
        ) : (
          <span className="fc-mono">
            <i>{initials(c.name)}</i>
            <b>{clean(c.name)}</b>
          </span>
        )}
      </div>

      {/* Hover action overlay */}
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
        <Link
          to={`/jobs?q=${encodeURIComponent(clean(c.name))}`}
          className="fc-action-btn fc-action-jobs"
        >
          {c.open_jobs > 0
            ? (L ? `${c.open_jobs}টি পদ` : `${c.open_jobs} roles`)
            : (L ? "পদ দেখুন" : "View jobs")}
        </Link>
      </div>

      {/* Industry / open-job footer indicator */}
      <div className="fc-tile-meta">
        <span className="fc-tile-name">{clean(c.name)}</span>
        <span className="fc-tile-badge">
          {c.open_jobs > 0
            ? (L ? `${c.open_jobs}টি পদ` : `${c.open_jobs} open`)
            : (L ? "কর্পোরেট" : "Corporate")}
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
            <img
              src={src}
              alt={c.name}
              loading="lazy"
              onError={handleErr}
            />
          ) : (
            <span className="fc-card-mono">
              {initials(c.name)}
            </span>
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

        <Link
          to={`/jobs?q=${encodeURIComponent(clean(c.name))}`}
          className="fc-btn-view-jobs"
        >
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

export default function FeaturedCompanies() {
  const [lang] = useLang();
  const L = lang === "bn" ? 1 : 0;
  const [list, setList] = useState(null);
  const [showDirectory, setShowDirectory] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const ref = useRef(null);

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

  // lean the rows with scroll velocity
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

  // Extract available unique industries
  const industries = useMemo(() => {
    if (!list) return [];
    const set = new Set();
    list.forEach((c) => {
      if (c.industry) set.add(c.industry);
    });
    return Array.from(set);
  }, [list]);

  // Filtered directory items
  const filteredList = useMemo(() => {
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

  if (!list || list.length < 2) return null;
  const half = Math.ceil(list.length / 2);
  const totalRoles = list.reduce((n, c) => n + (c.open_jobs || 0), 0);

  return (
    <section className="fc" ref={ref} aria-labelledby="fc-h">
      <header className="fc-head">
        <div className="fc-pill-tag">
          <span className="fc-bd-flag">🇧🇩</span>
          <span>{L ? "বাংলাদেশের শীর্ষ কর্পোরেট অফিস ও অফিসিয়াল ক্যারিয়ার পোর্টাল" : "Top Bangladesh Corporate Offices & Official Career Portals"}</span>
        </div>
        <h2 id="fc-h">
          {L ? "শীর্ষ কর্পোরেট কোম্পানি ও ক্যারিয়ার হাব" : "Featured Corporate Career Portals"}
        </h2>
        <p>
          {L
            ? "বাংলাদেশে অবস্থিত দেশের শীর্ষ কর্পোরেট হেডঅফিসগুলোর ভেরিফায়েড পোর্টাল ও লাইভ সার্কুলার এক প্ল্যাটফর্মে"
            : "Direct access to verified official career portals and live job circulars of Bangladesh's premier corporate houses"}
          <span className="fc-live">
            <i />
            {L ? `${list.length}টি কর্পোরেট প্রতিষ্ঠান · ${totalRoles}টি পদ` : `${list.length} Corporates · ${totalRoles} Openings`}
          </span>
        </p>

        {/* Directory Toggle Button */}
        <div className="fc-head-actions">
          <button
            type="button"
            className={`fc-dir-toggle-btn ${showDirectory ? "active" : ""}`}
            onClick={() => setShowDirectory((v) => !v)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
            <span>
              {showDirectory
                ? (L ? "মারকি ভিউতে ফিরে যান" : "Collapse Directory")
                : (L ? "🏢 সবগুলো ৩০+ কর্পোরেট ক্যারিয়ার পোর্টাল দেখুন" : "🏢 Explore All 30+ Corporate Portals")}
            </span>
          </button>
        </div>
      </header>

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
                placeholder={L ? "কোম্পানি বা ইন্ডাস্ট্রি দিয়ে খুঁজুন (যেমন: Grameenphone, Bank, Unilever)..." : "Search company or industry (e.g., Grameenphone, Bank, Unilever)..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button type="button" className="fc-search-clear" onClick={() => setSearchQuery("")}>✕</button>
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
              {industries.map((ind) => {
                const count = list.filter((c) => c.industry === ind).length;
                return (
                  <button
                    key={ind}
                    type="button"
                    className={`fc-filter-tab ${selectedIndustry === ind ? "active" : ""}`}
                    onClick={() => setSelectedIndustry(ind)}
                  >
                    {ind} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Corporate Cards Grid */}
          <div className="fc-cards-grid">
            {filteredList.map((c) => (
              <CorpCard key={c.id} c={c} L={L} />
            ))}
          </div>

          {filteredList.length === 0 && (
            <div className="fc-empty-state">
              <p>{L ? "কোনো কোম্পানি পাওয়া যায়নি।" : "No companies matched your query."}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}