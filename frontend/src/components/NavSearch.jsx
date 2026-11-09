import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const QUICK_TOOLS = [
  { label: "Judge my CV", path: "/cv", desc: "ATS checker & fresher score", tag: "AI Tool", icon: "📄" },
  { label: "Fresher Jobs", path: "/jobs", desc: "0 years exp · 1-tap & email apply", tag: "Jobs", icon: "💼" },
  { label: "AI Mock Interview", path: "/interview", desc: "Live practice with AI recruiter", tag: "Practice", icon: "🤖" },
  { label: "Quick Test", path: "/quick-test", desc: "10-min MCQ assessment & certificate", tag: "Exam", icon: "⚡" },
  { label: "Portfolio Website Builder", path: "/portfolio", desc: "Free personal developer website", tag: "Web", icon: "🌐" },
  { label: "Fresher Network", path: "/network", desc: "Chat rooms & connect with peers", tag: "Community", icon: "💬" },
  { label: "Startup Pitch & Fund", path: "/startup", desc: "Pitch builder & funding score", tag: "Startup", icon: "🚀" },
  { label: "Graduate Programs", path: "/programs", desc: "Internships & management trainee", tag: "Programs", icon: "🎓" },
  { label: "Certifications", path: "/certificates", desc: "Verified skill certificates", tag: "Cert", icon: "🏆" },
  { label: "Success Stories", path: "/stories", desc: "How Bangladeshi freshers got hired", tag: "Stories", icon: "⭐" },
];

const POPULAR_SEARCHES = [
  "Frontend Developer",
  "Junior Python / Django Engineer",
  "React Developer",
  "QA Automation Engineer",
  "Data Analyst",
  "Software Engineer (Intern)",
  "UI/UX Designer",
  "Backend Developer",
];

export default function NavSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const boxRef = useRef(null);
  const inputRef = useRef(null);
  const nav = useNavigate();

  // Global hotkey: ⌘K or Ctrl+K to focus search
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      } else if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const trimmed = q.trim().toLowerCase();

  // Filter tools matching query
  const matchingTools = trimmed
    ? QUICK_TOOLS.filter(
        (t) =>
          t.label.toLowerCase().includes(trimmed) ||
          t.desc.toLowerCase().includes(trimmed) ||
          t.tag.toLowerCase().includes(trimmed)
      )
    : QUICK_TOOLS.slice(0, 4);

  // Filter popular job searches matching query
  const matchingRoles = trimmed
    ? POPULAR_SEARCHES.filter((r) => r.toLowerCase().includes(trimmed))
    : POPULAR_SEARCHES.slice(0, 4);

  const handleSubmit = (searchQuery) => {
    const target = searchQuery || q;
    if (!target.trim()) return;
    setOpen(false);
    inputRef.current?.blur();
    nav(`/jobs?q=${encodeURIComponent(target.trim())}`);
  };

  const handleSelectTool = (path) => {
    setOpen(false);
    setQ("");
    inputRef.current?.blur();
    nav(path);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={`nav-search-wrap ${open ? "is-open" : ""}`} ref={boxRef}>
      <div className="nav-search-bar" onClick={() => { setOpen(true); inputRef.current?.focus(); }}>
        <svg className="nav-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="nav-search-input"
          placeholder="Search jobs, skills, tools..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          aria-label="Search jobs, skills, tools"
        />
        {q ? (
          <button
            type="button"
            className="nav-search-clear"
            onClick={(e) => { e.stopPropagation(); setQ(""); inputRef.current?.focus(); }}
            title="Clear search"
          >
            ✕
          </button>
        ) : (
          <kbd className="nav-search-kbd" title="Press ⌘K or Ctrl+K to search">⌘K</kbd>
        )}
      </div>

      {open && (
        <div className="nav-search-dropdown" role="dialog" aria-label="Search suggestions">
          {trimmed && (
            <div className="search-group">
              <button
                type="button"
                className="search-row search-action-row"
                onClick={() => handleSubmit(q)}
              >
                <span className="search-ic">🔍</span>
                <div className="search-info">
                  <div className="search-title">
                    Search jobs for &ldquo;<b>{q}</b>&rdquo;
                  </div>
                  <div className="search-desc">Open fresher job board with this filter</div>
                </div>
                <span className="search-enter-hint">Press ↵ Enter</span>
              </button>
            </div>
          )}

          <div className="search-group">
            <div className="search-group-title">Platform Features & Tools</div>
            {matchingTools.map((t) => (
              <button
                key={t.path}
                type="button"
                className="search-row"
                onClick={() => handleSelectTool(t.path)}
              >
                <span className="search-ic">{t.icon}</span>
                <div className="search-info">
                  <div className="search-title">{t.label}</div>
                  <div className="search-desc">{t.desc}</div>
                </div>
                <span className="search-tag">{t.tag}</span>
              </button>
            ))}
          </div>

          <div className="search-group">
            <div className="search-group-title">
              {trimmed ? "Matching Fresher Roles" : "Popular Searches for Freshers"}
            </div>
            <div className="search-chips">
              {matchingRoles.map((role) => (
                <button
                  key={role}
                  type="button"
                  className="search-chip"
                  onClick={() => handleSubmit(role)}
                >
                  <span className="chip-ic">💼</span> {role}
                </button>
              ))}
            </div>
          </div>

          <div className="search-footer">
            <span>Tip: <b>Enter</b> to search jobs · <b>Esc</b> to close</span>
          </div>
        </div>
      )}
    </div>
  );
}
