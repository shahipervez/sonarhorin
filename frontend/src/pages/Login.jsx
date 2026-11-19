import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth";
import { useLang } from "../i18n";
import "../styles/login.css";
import { createWelcome } from "../landing/anime/welcome";
import GoogleButton from "../integrations/GoogleButton";
import PhoneOtpLogin from "../integrations/PhoneOtpLogin";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [lang] = useLang();
  const L = lang === "bn" ? 1 : 0;

  // loginMode: "user" (Phone Number) | "admin" (Gmail)
  const [loginMode, setLoginMode] = useState("user");
  const [form, setForm] = useState({ identifier: "", password: "", remember: true });
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // Animated welcome host: waves hi → opens the card → covers her eyes on password → throws a bouquet on success
  const stageRef = useRef(null);
  const fxRef = useRef(null);
  const welcome = useRef(null);
  const [cardOpen, setCardOpen] = useState(false);
  const pwFocus = useRef(false);
  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    welcome.current = createWelcome(stageRef.current, { L, reduced, fxCanvas: fxRef.current, onOpenCard: () => setCardOpen(true) });
    return () => welcome.current?.destroy();
  }, [L]);
  useEffect(() => { if (pwFocus.current) welcome.current?.setMode(showPass ? "peek" : "cover"); }, [showPass]);
  const skipIntro = () => welcome.current?.skipIntro();

  const switchMode = (mode) => {
    setLoginMode(mode);
    setForm({ ...form, identifier: "", password: "" });
    setErr("");
  };

  const fillPreset = (identifier, password, mode) => {
    setLoginMode(mode);
    setForm({ ...form, identifier, password });
    setErr("");
  };

  const onThirdPartyLogin = () => {
    const go = () => nav(sp.get("next") || "/me");
    if (welcome.current) welcome.current.celebrate(go); else go();
  };

  const submit = async (e) => {
    if (loginMode === "otp") { e.preventDefault(); return; }
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await login(form.identifier.trim(), form.password);
      const go = () => nav(sp.get("next") || "/me");
      if (welcome.current) welcome.current.celebrate(go); else go();
      return;
    } catch (x) {
      if (x.status === 401) {
        setErr(
          L
            ? loginMode === "user"
              ? "ফোন নম্বর বা পাসওয়ার্ড ভুল হয়েছে।"
              : "অ্যাডমিন জিমেইল বা পাসওয়ার্ড ভুল হয়েছে।"
            : loginMode === "user"
            ? "Wrong phone number or password."
            : "Wrong admin Gmail or password."
        );
      } else {
        setErr(x.message);
      }
      welcome.current?.setMode("oops");
    }
    setBusy(false);
  };

  return (
    <div className="forest-login-viewport welcome-mode" onPointerDown={(e) => { if (!e.target.closest("form")) skipIntro(); }}>
      <canvas ref={stageRef} className="welcome-stage" aria-hidden="true" />
      <canvas ref={fxRef} className="welcome-fx" aria-hidden="true" />
      {!cardOpen && (
        <button type="button" className="welcome-skip" onClick={skipIntro}>{L ? "সরাসরি লগইন →" : "Skip to login →"}</button>
      )}
      {/* Top Navigation Bar matching the uploaded design */}
      <header className="forest-top-nav">
        <div className="forest-nav-container">
          {/* Official Golden Deer Logo */}
          <Link to="/" className="forest-brand-link">
            <img src="/logo-gold.png" alt="Sonarhorin Logo" className="forest-brand-logo" />
            <span className="forest-brand-text">
              <span className="part-sonar">SONAR</span>
              <span className="part-horin">HORIN</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="forest-nav-menu">
            <Link to="/" className="forest-nav-item">
              {L ? "হোম" : "Home"}
            </Link>
            <Link to="/stories" className="forest-nav-item">
              {L ? "সম্পর্কে" : "About"}
            </Link>
            <Link to="/jobs" className="forest-nav-item">
              {L ? "সার্ভিসেস" : "Services"}
            </Link>
            <Link to="/network" className="forest-nav-item">
              {L ? "যোগাযোগ" : "Contact"}
            </Link>
            <Link to="/login" className="forest-nav-btn active">
              {L ? "লগইন" : "Login"}
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Center Area with Frosted Glassmorphism Login Card */}
      <main className="forest-login-main">
        <div className={`forest-glass-card-wrapper welcome-card ${cardOpen ? "open" : ""}`} aria-hidden={!cardOpen}>
          <form className="forest-glass-card" onSubmit={submit}>
            {/* Close Button on Top Right (Navigates to Home) */}
            <Link to="/" className="forest-card-close-btn" title={L ? "বন্ধ করো" : "Close"}>
              ✕
            </Link>

            {/* Golden Deer Crest Emblem */}
            <div className="forest-card-crest">
              <img src="/logo-gold.png" alt="Golden Deer Emblem" className="forest-card-stag-img" />
            </div>

            {/* Title */}
            <h1 className="forest-card-title">{L ? "লগইন" : "Login"}</h1>

            {/* Mode Switcher: User (Phone Number) vs Admin (Gmail) */}
            <div className="forest-mode-switcher">
              <button
                type="button"
                className={`forest-mode-chip ${loginMode === "user" ? "active" : ""}`}
                onClick={() => switchMode("user")}
              >
                <span>📱 {L ? "ইউজার (ফোন)" : "User (Phone)"}</span>
              </button>
              <button
                type="button"
                className={`forest-mode-chip ${loginMode === "otp" ? "active" : ""}`}
                onClick={() => switchMode("otp")}
              >
                <span>🔑 {L ? "ফোনে কোড (OTP)" : "Login with phone"}</span>
              </button>
              <button
                type="button"
                className={`forest-mode-chip ${loginMode === "admin" ? "active" : ""}`}
                onClick={() => switchMode("admin")}
              >
                <span>⚡ {L ? "অ্যাডমিন (জিমেইল)" : "Admin (Gmail)"}</span>
              </button>
            </div>

            {/* Continue with Google — rendered only when VITE_GOOGLE_CLIENT_ID is set */}
            <GoogleButton L={L} onSuccess={onThirdPartyLogin} onError={(x) => setErr(x.message)} />

            {loginMode === "otp" ? (
              <PhoneOtpLogin L={L} onSuccess={onThirdPartyLogin} onError={() => welcome.current?.setMode("oops")} />
            ) : (<>

            {/* 1-Click Fast Test Pill */}
            <div className="forest-quick-pill">
              {loginMode === "user" ? (
                <button
                  type="button"
                  className="forest-pill-action"
                  onClick={() => fillPreset("01700000000", "demo1234", "user")}
                >
                  <span className="pill-dot" />
                  <span className="pill-text">
                    ⚡ {L ? "১-ক্লিক ডেমো ইউজার (01700000000)" : "1-Click Demo User (01700000000)"}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  className="forest-pill-action admin"
                  onClick={() => fillPreset("admin@sonarhorin.com", "admin1234", "admin")}
                >
                  <span className="pill-dot admin" />
                  <span className="pill-text">
                    ⚡ {L ? "১-ক্লিক অ্যাডমিন (admin@sonarhorin.com)" : "1-Click Admin (admin@sonarhorin.com)"}
                  </span>
                </button>
              )}
            </div>

            {/* Input Fields with Underlined Styling & Icons on the Right */}
            <div className="forest-inputs-stack">
              {/* Field 1: Phone / Email */}
              <div className="forest-field-group">
                <label className="forest-field-label">
                  {loginMode === "user"
                    ? L
                      ? "ফোন নম্বর"
                      : "Phone Number"
                    : L
                    ? "ইমেইল / জিমেইল"
                    : "Email"}
                </label>
                <div className="forest-input-wrap">
                  <input
                    type={loginMode === "user" ? "tel" : "email"}
                    required
                    placeholder={loginMode === "user" ? "01XXXXXXXXX" : "name@example.com"}
                    value={form.identifier}
                    onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                    onFocus={() => welcome.current?.setMode("idle")}
                    autoComplete={loginMode === "user" ? "tel" : "email"}
                    className="forest-line-input"
                  />
                  <span className="forest-input-icon">
                    {loginMode === "user" ? "📱" : "✉"}
                  </span>
                </div>
              </div>

              {/* Field 2: Password */}
              <div className="forest-field-group">
                <label className="forest-field-label">{L ? "পাসওয়ার্ড" : "Password"}</label>
                <div className="forest-input-wrap">
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    onFocus={() => { pwFocus.current = true; welcome.current?.setMode(showPass ? "peek" : "cover"); }}
                    onBlur={() => { pwFocus.current = false; setTimeout(() => { if (!pwFocus.current) welcome.current?.setMode("idle"); }, 120); }}
                    autoComplete="current-password"
                    className="forest-line-input"
                  />
                  <button
                    type="button"
                    className="forest-input-icon btn-toggle"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowPass(!showPass)}
                    tabIndex={-1}
                    aria-label="Toggle password visibility"
                  >
                    {showPass ? "🔓" : "🔒"}
                  </button>
                </div>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="forest-options-row">
              <label className="forest-remember-label">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                  className="forest-custom-checkbox"
                />
                <span>{L ? "মনে রাখো" : "Remember me"}</span>
              </label>

              <span className="forest-forgot-link">
                {L ? "পাসওয়ার্ড ভুলে গেছো?" : "Forgot Password?"}
              </span>
            </div>

            {/* Error Message */}
            {err && (
              <div className="forest-err-box">
                <span>⚠️ {err}</span>
              </div>
            )}

            {/* Primary Dark Button */}
            <button type="submit" className="forest-submit-btn" disabled={busy}>
              {busy ? (L ? "লগইন হচ্ছে…" : "Signing in…") : L ? "লগইন" : "Login"}
            </button>

            </>)}

            {/* Card Footer: Register Link */}
            <div className="forest-card-footer">
              <p>
                {L ? "অ্যাকাউন্ট নেই? " : "Don't have an account? "}
                <Link
                  to={`/register${sp.get("next") ? `?next=${sp.get("next")}` : ""}`}
                  className="forest-reg-link"
                >
                  {L ? "রেজিস্টার করুন" : "Register"}
                </Link>
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
