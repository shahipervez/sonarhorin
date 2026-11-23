import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { useLang, useT } from "../i18n";
import Logo from "./Logo";

const I = {
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  cv: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
  test: <><path d="M9 11l2 2 4-4" /><rect x="3" y="3" width="18" height="18" rx="3" /></>,
  bot: <><rect x="4" y="7" width="16" height="12" rx="3" /><circle cx="9" cy="13" r="1.3" /><circle cx="15" cy="13" r="1.3" /><path d="M12 7V4" /></>,
  prog: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" /></>,
  cert: <><circle cx="12" cy="9" r="6" /><path d="M8.5 14L7 21l5-3 5 3-1.5-7" /></>,
  shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />,
  chat: <path d="M4 5h16v10H9l-5 4z" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></>,
  bag: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5h6v2M12 12v3" /></>,
  web: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" /></>,
  rocket: <path d="M12 3c4 2 6 6 6 10l-3 3H9l-3-3c0-4 2-8 6-10zM9 16l-2 5 3-2M15 16l2 5-3-2" />,
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
};
const Icon = ({ n }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">{I[n]}</svg>
);

export default function Nav() {
  const { pathname } = useLocation();
  const home = pathname === "/";
  const [solid, setSolid] = useState(!home);
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const menuRef = useRef(null);
  const [lang, setLang] = useLang();
  const t = useT();
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);
  const search = (e) => { e.preventDefault(); nav(`/jobs${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`); setQ(""); e.currentTarget.querySelector("input")?.blur(); };

  useEffect(() => {
    if (!home) { setSolid(true); return; }
    const on = () => setSolid(scrollY > 40);
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, [home]);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("click", close); addEventListener("keydown", esc);
    return () => { document.removeEventListener("click", close); removeEventListener("keydown", esc); };
  }, []);

  return (
    <nav className={`nav ${solid ? "solid" : ""}`}>
      <Link to="/" className="logo" aria-label="সোনারহরিণ home"><Logo bangla={home} /></Link>
      <div className={`nav-links ${focus ? "searching" : ""}`}>
        <form className="nav-search" role="search" onSubmit={search}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
            placeholder={t("Search jobs, companies…", "জব, কোম্পানি খোঁজো…")} aria-label={t("Search jobs", "জব খোঁজো")} />
          <kbd>↵</kbd>
        </form>
        <NavLink to="/jobs" end>{t("Jobs", "চাকরি")}</NavLink>
        <NavLink to="/internships" className="nl-intern">{t("Internship", "ইন্টার্নশিপ")}</NavLink>
        <NavLink to="/studio" className="nl-ai">{t("CV Studio", "সিভি স্টুডিও")}</NavLink>
        <NavLink to="/coach" className="nl-ai">{t("Interview Coach", "ইন্টারভিউ কোচ")}</NavLink>
        <NavLink to="/network">{t("Network", "নেটওয়ার্ক")}</NavLink>
        <NavLink to="/startup" className="nl-startup"><span>{t("Startup", "স্টার্টআপ")}</span></NavLink>
      </div>
      <div className="nav-right" ref={menuRef}>
        <button className="lang" onClick={() => setLang(lang === "bn" ? "en" : "bn")} aria-label={lang === "bn" ? "Switch to English" : "বাংলায় দেখুন"}>
          <span className={lang === "en" ? "on" : ""}>EN</span><span className={`bn ${lang === "bn" ? "on" : ""}`}>বাং</span><i />
        </button>
        <button className={`menu-btn ${open ? "open" : ""}`} aria-label="Menu" aria-expanded={open} onClick={(e) => { e.stopPropagation(); setOpen(!open); }}><span /></button>
        {user ? (
          <Link to="/me" className="signin"><Icon n="user" />{user.full_name.split(" ")[0]}</Link>
        ) : (
          <Link to="/login" className="signin">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /></svg>
            {t("Sign in", "লগইন")}
          </Link>
        )}
        <div className={`menu ${open ? "open" : ""}`}>
          <Link className="mi" to="/"><Icon n="home" />{t("Home", "হোম")}</Link>
          <Link className="mi" to="/jobs"><Icon n="bag" />{t("Fresher jobs · 1-tap apply", "ফ্রেশার জব")}</Link>
          <Link className="mi" to="/internships"><Icon n="prog" />{t("Internships · boarding passes", "ইন্টার্নশিপ")}</Link>
          <Link className="mi" to="/applications"><Icon n="test" />{t("My applications", "আমার আবেদন")}</Link>
          <Link className="mi" to="/studio"><Icon n="cv" />{t("CV Studio · tailor your CV to a job", "সিভি স্টুডিও")}</Link>
          <Link className="mi" to="/coach"><Icon n="bot" />{t("Interview Coach · AI prep for one job", "ইন্টারভিউ কোচ")}</Link>
          <Link className="mi" to="/cv"><Icon n="cv" />{t("Judge Yourself (CV check)", "সিভি চেক")}</Link>
          <Link className="mi" to="/quick-test"><Icon n="test" />{t("Quick Test", "কুইক টেস্ট")}</Link>
          <Link className="mi" to="/interview"><Icon n="bot" />{t("AI Interview", "এআই ইন্টারভিউ")}</Link>
          <Link className="mi" to="/programs"><Icon n="prog" />{t("Graduate · Internship · Training", "প্রোগ্রাম ও ট্রেনিং")}</Link>
          <Link className="mi" to="/portfolio"><Icon n="web" />{t("Portfolio website builder", "পোর্টফোলিও ওয়েবসাইট")}</Link>
          <Link className="mi" to="/network"><Icon n="chat" />{t("Network · chat with your people", "নেটওয়ার্ক")}</Link>
          <Link className="mi" to="/startup"><Icon n="rocket" />{t("Startup · find funders", "স্টার্টআপ · ফান্ডার খোঁজো")}</Link>
          <Link className="mi" to="/certificates"><Icon n="cert" />{t("Certifications", "সার্টিফিকেট")}</Link>
          <Link className="mi" to="/stories"><Icon n="star" />{t("Success stories", "সাফল্যের গল্প")}</Link>
          <Link className="mi" to="/efficiency"><Icon n="shield" />{t("Efficiency Test · for employers", "এফিশিয়েন্সি টেস্ট")}</Link>
          {user && <button className="mi" onClick={async () => { await logout(); nav("/"); }}><Icon n="user" />{t("Sign out", "লগআউট")}</button>}
          <div className="mfine">Help · Terms of Use · Privacy<br />Dhaka, Bangladesh<br />© 2026 সোনারহরিণ. All rights reserved.</div>
        </div>
      </div>
    </nav>
  );
}
