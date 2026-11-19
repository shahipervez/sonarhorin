import { useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { MAJORS } from "../config";
import { toast } from "../utils";
import GoogleButton from "../integrations/GoogleButton";

// Email removed from ORDER: Candidate accounts are created solely with Phone Number
const ORDER = ["full_name", "phone", "major", "university", "graduation_year", "cgpa", "linkedin", "github", "skills"];

function PwMeter({ pw }) {
  if (!pw) return null;
  const score = [pw.length >= 8, pw.length >= 12, /[A-Z]/.test(pw) && /[a-z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
  const label = ["Too weak", "Weak", "Okay", "Good", "Strong", "Excellent"][score];
  return (
    <div className={`pwm s${score}`} aria-live="polite">
      <div className="pwm-bar">{[0, 1, 2, 3, 4].map((i) => <i key={i} className={i < score ? "on" : ""} />)}</div>
      <small>{label}{/^\d+$/.test(pw) ? " — numbers only won't be accepted" : ""}</small>
    </div>
  );
}

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [form, setForm] = useState({
    full_name: "", phone: "", password: "", university: "", cgpa: "", linkedin: "", github: "",
    major: localStorage.getItem("prothom_field") || "CSE", graduation_year: new Date().getFullYear(),
  });
  const [skills, setSkills] = useState([]);
  const [skillIn, setSkillIn] = useState("");
  const [auto, setAuto] = useState({});       // field → true when filled from the CV
  const [flash, setFlash] = useState(null);   // field currently animating in
  const [cvFile, setCvFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parseMsg, setParseMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef(null);

  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setAuto((a) => ({ ...a, [k]: false })); };
  const lbl = (k, text) => <span>{text}{auto[k] && <em className="autotag">✨ from CV</em>}</span>;

  async function onCV(file) {
    if (!file) return;
    setCvFile(file); setParsing(true); setParseMsg(""); setErr("");
    const fd = new FormData(); fd.append("file", file);
    try {
      const [r] = await Promise.all([api("/api/auth/parse-cv/", { method: "POST", form: fd }), new Promise((ok) => setTimeout(ok, 900))]);
      const fl = r.fields || {};
      let next = { ...form };
      const filled = {};
      for (const k of ORDER) {
        if (fl[k] == null || fl[k] === "" || (Array.isArray(fl[k]) && !fl[k].length)) continue;
        await new Promise((ok) => setTimeout(ok, 120));
        if (k === "skills") { setSkills(fl.skills); }
        else { next = { ...next, [k]: k === "major" && !MAJORS.includes(fl[k]) ? "Other" : String(fl[k]) }; setForm(next); }
        filled[k] = true; setAuto((a) => ({ ...a, [k]: true })); setFlash(k);
      }
      setFlash(null);
      const n = Object.keys(filled).length;
      setParseMsg(n ? `Filled ${n} field${n > 1 ? "s" : ""} from your CV — please check your Phone Number and set a password.` : "We couldn't read details from this CV — please fill the form in.");
    } catch (x) { setParseMsg(""); setErr(x.message); }
    finally { setParsing(false); }
  }

  const addSkill = (e) => {
    if (e.key !== "Enter" && e.key !== ",") return;
    e.preventDefault(); const v = skillIn.trim(); if (v && !skills.includes(v)) setSkills([...skills, v]); setSkillIn("");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.phone.trim()) {
      setErr("অনুগ্রহ করে আপনার ফোন নম্বর দিন (Phone number is required).");
      return;
    }
    setBusy(true); setErr("");
    try {
      const payload = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        password: form.password,
        major: form.major,
        university: form.university,
        graduation_year: Number(form.graduation_year) || null,
        cgpa: form.cgpa ? Number(form.cgpa) : null,
        skills: skills.join(", "),
      };
      if (form.linkedin) payload.linkedin = form.linkedin;
      if (form.github) payload.github = form.github;

      const u = await register(payload);
      if (cvFile) {
        const fd = new FormData(); fd.append("file", cvFile); fd.append("major", u.major);
        api("/api/cv/analyze/", { method: "POST", form: fd }).then((a) => toast(`Your CV score is ${a.score}/100 — rejection risk ${a.rejection_probability}%`)).catch(() => {});
      }
      nav(sp.get("next") || "/me");
    } catch (x) { setErr(x.message); }
    finally { setBusy(false); }
  };

  const fc = (k) => `field ${flash === k ? "flash" : ""} ${auto[k] ? "is-auto" : ""}`;

  return (
    <div className="page auth-page">
      <form className="auth-card wide" onSubmit={submit}>
        <h1 className="h2">Your first job<br />starts here.</h1>
        <p className="muted">ফ্রি ফ্রেশার অ্যাকাউন্ট — শুধুমাত্র ফোন নম্বর দিয়েই রেজিস্টার করুন।</p>
        {/* One-tap sign-up with Google (only when VITE_GOOGLE_CLIENT_ID is set) */}
        <GoogleButton text="signup_with" onSuccess={() => nav(sp.get("next") || "/me")} onError={(x) => setErr(x.message)} />

        <div className={`cvdrop ${drag ? "drag" : ""} ${parsing ? "busy" : ""} ${cvFile && !parsing ? "done" : ""}`}
             onClick={() => fileRef.current.click()} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
             onDrop={(e) => { e.preventDefault(); setDrag(false); onCV(e.dataTransfer.files[0]); }} role="button" tabIndex={0}
             onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current.click()}>
          <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" hidden onChange={(e) => onCV(e.target.files[0])} />
          <span className="cvdrop-ic">{parsing ? "🔎" : cvFile ? "✅" : "⚡"}</span>
          <div>
            <b className="bn">{parsing ? "সিভি পড়ছি…" : cvFile ? cvFile.name : "সিভি দাও, ফর্ম নিজেই ভরে যাবে"}</b>
            <span>{parsing ? "Reading your name, university, major, skills…" : cvFile ? "Click to use a different CV" : "Upload your CV (PDF, DOCX or TXT) — we fill everything in. Takes 2 seconds."}</span>
          </div>
          {parsing && <i className="cvdrop-bar" />}
        </div>
        {parseMsg && <p className="parse-msg">{parseMsg}</p>}

        <div className="or"><span>or fill it in yourself</span></div>

        <div className="row2">
          <label className={fc("full_name")}>{lbl("full_name", "Full name")}<input required value={form.full_name} onChange={set("full_name")} placeholder="Your Name" /></label>
          <label className={fc("phone")}>{lbl("phone", "Phone (শুধুমাত্র ফোন নম্বর)")}<input required value={form.phone} onChange={set("phone")} placeholder="01XXXXXXXXX বা +880 1XXXXXXXXX" /></label>
        </div>
        <label className="field"><span>Password (min 8) <em className="hint">— never in your CV, so we ask</em></span><input type="password" required minLength={8} value={form.password} onChange={set("password")} autoComplete="new-password" /></label>
        <PwMeter pw={form.password} />
        <div className="row2">
          <label className={fc("major")}>{lbl("major", "Major")}<select value={form.major} onChange={set("major")}>{MAJORS.map((m) => <option key={m}>{m}</option>)}</select></label>
          <label className={fc("graduation_year")}>{lbl("graduation_year", "Graduation year")}<input type="number" min="2010" max="2035" value={form.graduation_year} onChange={set("graduation_year")} /></label>
        </div>
        <div className="row2">
          <label className={fc("university")}>{lbl("university", "University")}<input value={form.university} onChange={set("university")} placeholder="e.g. IUBAT" /></label>
          <label className={fc("cgpa")}>{lbl("cgpa", "CGPA")}<input type="number" step="0.01" min="0" max="4" value={form.cgpa} onChange={set("cgpa")} placeholder="3.50" /></label>
        </div>
        <div className="row2">
          <label className={fc("linkedin")}>{lbl("linkedin", "LinkedIn")}<input type="url" value={form.linkedin} onChange={set("linkedin")} placeholder="https://linkedin.com/in/…" /></label>
          <label className={fc("github")}>{lbl("github", "GitHub")}<input type="url" value={form.github} onChange={set("github")} placeholder="https://github.com/…" /></label>
        </div>
        <label className={fc("skills")}>{lbl("skills", "Skills")}
          <div className="skillbox">
            {skills.map((s) => <span key={s} className="sk">{s}<button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))} aria-label={`Remove ${s}`}>×</button></span>)}
            <input value={skillIn} onChange={(e) => setSkillIn(e.target.value)} onKeyDown={addSkill} placeholder={skills.length ? "Add more…" : "Type a skill, press Enter"} />
          </div>
        </label>
        {err && <p className="err">{err}</p>}
        <button className="btn btn-ink wide" disabled={busy || parsing}>{busy ? "Creating…" : cvFile ? "Create account + judge my CV →" : "Create account with Phone"}</button>
        <p className="muted small">Already have an account? <Link to="/login" className="link">Sign in</Link></p>
      </form>
    </div>
  );
}
