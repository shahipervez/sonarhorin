import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { MAJORS } from "../config";
import Scribble, { Circled, Underline } from "../components/Scribble";
import Vibe from "../components/Vibe";
import { Reel, REELS } from "../landing/Playlist";
import { setTrack, TRACKS } from "../track";

const greet = () => { const h = new Date().getHours(); return h < 12 ? "শুভ সকাল" : h < 17 ? "শুভ দুপুর" : h < 20 ? "শুভ সন্ধ্যা" : "শুভ রাত্রি"; };
const money = (a, b) => (a ? `৳${Math.round(a / 1000)}k${b ? `–${Math.round(b / 1000)}k` : ""}` : "");

/** Page 2 — the dashboard. Notebook paper, hand-written notes, and a different layout for founders. */
function CareerAI() {
  const [o, setO] = useState(null);
  useEffect(() => { api("/api/career/").then(setO).catch(() => {}); }, []);
  return (
    <section className="dai">
      <Link to="/studio" className="dai-c gold">
        <span className="dai-k">✦ CV STUDIO</span>
        <b>Tailor your CV to any job</b>
        <small>{o ? `${o.resumes} CV${o.resumes === 1 ? "" : "s"} · ${o.tailored} tailored` : "Upload once, tailor forever"}</small>
        <i>→</i>
      </Link>
      <Link to="/coach" className="dai-c">
        <span className="dai-k">🎤 INTERVIEW COACH</span>
        <b>Practise for your next interview</b>
        <small>{o ? `${o.kits} kit${o.kits === 1 ? "" : "s"} · ${o.practice} answers practised` : "Questions, model answers, live coach"}</small>
        <i>→</i>
      </Link>
    </section>
  );
}

export default function Dashboard() {
  const { user, updateMe } = useAuth();
  const [d, setD] = useState({ cv: [], tests: [], interviews: [], apps: [], certs: [], jobs: null, matches: null, site: null, net: null, pitches: null });
  const [vibe, setVibe] = useState(() => { try { return !localStorage.getItem("prothom_vibe_done"); } catch { return false; } });
  const track = user.track || "job";

  useEffect(() => {
    const put = (k) => (v) => setD((p) => ({ ...p, [k]: v }));
    api("/api/cv/analyses/").then(put("cv")).catch(() => {});
    api("/api/assessments/quick/history/").then(put("tests")).catch(() => {});
    api("/api/interviews/history/").then(put("interviews")).catch(() => {});
    api("/api/programs/mine/").then(put("apps")).catch(() => {});
    api("/api/certificates/").then(put("certs")).catch(() => {});
    api("/api/jobs/applications/").then(put("jobs")).catch(() => {});
    api("/api/jobs/matches/").then(put("matches")).catch(() => {});
    api("/api/portfolio/mine/").then(put("site")).catch(() => {});
    api("/api/network/").then(put("net")).catch(() => {});
    api("/api/startups/pitches/").then(put("pitches")).catch(() => {});
  }, []);

  const switchTrack = (k) => { setTrack(k); updateMe({ track: k }).catch(() => {}); };
  const lastCv = d.cv[0], bestTest = d.tests.filter((t) => t.submitted).sort((a, b) => b.percent - a.percent)[0];
  const bestIv = d.interviews.filter((i) => i.status !== "active").sort((a, b) => b.overall - a.overall)[0];
  const sent = d.jobs?.applications?.length || 0;
  const tiles = [
    { to: "/cv", t: "Judge Yourself", v: lastCv ? `${lastCv.rejection_probability}% rejection risk` : "Not checked yet", ok: lastCv && lastCv.rejection_probability < 35 },
    { to: "/quick-test", t: "Quick Test", v: bestTest ? `Best: ${bestTest.percent}%` : "Not taken", ok: bestTest?.passed },
    { to: "/interview", t: "AI Interview", v: bestIv ? `Best: ${bestIv.overall}/100` : "Not practiced", ok: bestIv?.overall >= 70 },
    { to: "/portfolio", t: "Portfolio website", v: d.site?.published ? `Live · ${d.site.views} views` : d.site?.exists ? "Draft — not live yet" : "Not built", ok: d.site?.published },
    { to: sent ? "/applications" : "/jobs", t: "Job applications", v: sent ? `${sent} sent` : "None yet", ok: sent > 0 },
    { to: "/certificates", t: "Certificates", v: `${d.certs.length} earned`, ok: d.certs.length > 0 },
  ];
  const done = tiles.filter((t) => t.ok).length;
  const next = !lastCv ? { to: "/cv", t: "Judge your CV first", d: "See your rejection risk and the exact fixes — 30 seconds.", ic: "📄" }
    : vibe && track !== "startup" ? null
    : !d.site?.published ? { to: "/portfolio", t: "Publish your portfolio website", d: "Built from your CV in a minute. Recruiters can click it.", ic: "🌐" }
    : !sent ? { to: "/jobs", t: `Apply to ${d.matches?.auto_eligible?.length || "your"} matches`, d: "1-click and email jobs — with a tailored cover letter.", ic: "⚡" }
    : !bestIv ? { to: "/interview", t: "Practise one interview", d: "10 minutes with Mitu, every answer scored.", ic: "🎙️" }
    : { to: "/network", t: "Ask your network for a referral", d: "Seniors from your university are one message away.", ic: "🤝" };
  const pitch = d.pitches?.[0];

  return (
    <div className={`page dash2 track-${track}`}>
      <div className="wrap">
        <header className="nb-head">
          <div>
            <p className="eyebrow">পেজ ২ · তোমার ড্যাশবোর্ড</p>
            <h1 className="nb-hello"><Scribble text={`${greet()}, ${user.full_name.split(" ")[0]}!`} /></h1>
            <p className="muted">{user.university || "Add your university"} · {user.major} · Class of {user.graduation_year || "—"}</p>
            <div className="dtrack" role="radiogroup" aria-label="What are you looking for?">
              {Object.entries(TRACKS).map(([k, t]) => <button key={k} role="radio" aria-checked={track === k} className={track === k ? "on" : ""} onClick={() => switchTrack(k)}>{t.ic} <span className="bn">{t.bn}</span></button>)}
            </div>
          </div>
          <div className="readiness">
            <div className="bigring" style={{ "--p": Math.round((done / tiles.length) * 100), "--c": "var(--green2)", width: 120, height: 120 }}>
              <div><b>{done}/{tiles.length}</b><small>job-ready</small></div>
            </div>
            <Scribble className="ring-note" text={done >= 4 ? "দারুণ চলছে!" : "আরেকটু বাকি!"} arrow="left" />
          </div>
        </header>
        <CareerAI />

        {track === "startup" ? (
          <div className="dgrid">
            <div className="dcard dark span2">
              <div className="dc-head"><b>🏮 Your pitch</b>{pitch && <span className="pill">{pitch.status_label}</span>}</div>
              {pitch ? (
                <div className="pitch-sum">
                  <div className="ring-sm" style={{ "--p": pitch.readiness.score }}><b>{pitch.readiness.score}</b><small>ready</small></div>
                  <div><h3>{pitch.name}</h3><p>{pitch.one_liner || "Add a one-line pitch."}</p>
                    <ul>{pitch.readiness.checks.filter((c) => !c.ok).slice(0, 3).map((c) => <li key={c.key}>→ {c.tip}</li>)}</ul></div>
                </div>
              ) : <p className="muted-l">No pitch yet. Most founders start with one honest paragraph about the problem.</p>}
              <Link className="btn btn-lime sm" to="/startup#builder">{pitch ? "Open pitch builder →" : "Start my pitch →"}</Link>
              <Scribble className="dc-note" text="আইডিয়া → পিচ → ফান্ড" color="#FFE27A" />
            </div>
            <div className="dcard reel-card"><Reel reel={REELS.find((r) => r.id === "pitch")} /></div>
            <Link to="/network" className="dcard">
              <div className="dc-head"><b>🤝 Founders' room</b>{d.net?.unread > 0 && <span className="pill red">{d.net.unread} new</span>}</div>
              <p>Find a co-founder, practise your pitch, get feedback from other founders.</p><span className="go">Open network →</span>
            </Link>
            <Link to="/portfolio" className="dcard">
              <div className="dc-head"><b>🌐 Founder website</b></div>
              <p>{d.site?.published ? "Your site is live — add your startup as the first project." : "A one-page site investors can open. Set “Open to: co-founders & investors”."}</p><span className="go">Open builder →</span>
            </Link>
            <Link to="/jobs" className="dcard soft"><div className="dc-head"><b>💼 Need income meanwhile?</b></div><p>Fresher and part-time jobs, 1-tap apply.</p><span className="go">See jobs →</span></Link>
          </div>
        ) : (
          <>
            {next && (
              <div className="next-step">
                <Scribble className="ns-note" text="এখান থেকে শুরু করো" arrow="right" />
                <Circled color="#E5484D"><Link to={next.to} className="ns-card"><span className="ic">{next.ic}</span><span><b>{next.t}</b><small>{next.d}</small></span><i>→</i></Link></Circled>
              </div>
            )}
            {vibe && (
              <div className="dcard vibe-wrap">
                <div className="dc-head"><b>✨ ৬টা সোয়াইপে তোমার ম্যাচ প্রোফাইল</b><button className="link small" onClick={() => { setVibe(false); try { localStorage.setItem("prothom_vibe_done", "1"); } catch { /* */ } }}>Skip</button></div>
                <Vibe onDone={() => { setTimeout(() => setVibe(false), 1600); api("/api/jobs/matches/").then((m) => setD((p) => ({ ...p, matches: m }))).catch(() => {}); }} />
              </div>
            )}
            <div className="dgrid">
              <div className="dcard span2">
                <div className="dc-head"><b>🎯 Today's matches</b><Link className="link small" to={track === "internship" ? "/internships" : "/jobs"}>All jobs →</Link></div>
                {d.matches?.jobs?.length ? (
                  <div className="mlist">{d.matches.jobs.slice(0, 4).map((j) => (
                    <Link key={j.id} to="/jobs" className="mrow"><span className="lg" style={{ background: j.company.color }}>{j.company.name[0]}</span>
                      <span className="tx"><b>{j.title}</b><small>{j.company.name} · {j.location} {money(j.salary_min, j.salary_max) && `· ${money(j.salary_min, j.salary_max)}`}</small></span>
                      <span className={`chbadge c-${j.channel}`}>{j.channel === "partner" || j.channel === "ats" ? "⚡ 1-click" : j.channel === "email" ? "✉️ Email" : "🔗 Portal"}</span></Link>
                  ))}</div>
                ) : <p className="muted">{d.matches ? "No new matches right now — we'll add them as companies post." : "Finding your matches…"}</p>}
                {!d.matches?.has_cv && d.matches && <p className="small err">Upload your CV so we can apply for you — <Link className="link" to="/cv">Judge my CV →</Link></p>}
              </div>
              <Link to={sent ? "/applications" : "/jobs"} className="dcard">
                <div className="dc-head"><b>📨 Applications</b></div>
                <p className="big">{sent}</p>
                <p>{sent ? Object.entries(d.jobs.counts).map(([k, v]) => `${v} ${k.replace("_", " ")}`).join(" · ") : "Apply to your first fresher job in one tap."}</p>
                <span className="go">{sent ? "Track them →" : "Find jobs →"}</span>
              </Link>
              <Link to="/portfolio" className="dcard site-card">
                <div className="dc-head"><b>🌐 Your website</b>{d.site?.published && <span className="pill">Live</span>}</div>
                <div className="mini-browser"><i /><i /><i /><span>/u/{d.site?.slug || "you"}</span></div>
                <p>{d.site?.published ? `${d.site.views} views so far.` : "Build it from your CV, publish it live, download the .html."}</p>
                <Scribble className="dc-note" text="রিক্রুটার এটা খুলবে!" />
                <span className="go">{d.site?.published ? "Edit site →" : "Build my website →"}</span>
              </Link>
              <Link to="/network" className="dcard">
                <div className="dc-head"><b>🤝 Network</b>{(d.net?.unread || 0) + (d.net?.incoming?.length || 0) > 0 && <span className="pill red">{(d.net?.unread || 0) + (d.net?.incoming?.length || 0)} new</span>}</div>
                <p className="big">{d.net?.connections ?? 0}</p>
                <p>{d.net?.incoming?.length ? `${d.net.incoming.length} people want to connect.` : "Chat with your university and major — referrals live here."}</p>
                <span className="go">Open network →</span>
              </Link>
              <div className="dcard span3 tools">
                <div className="dc-head"><b>✅ Job-ready checklist</b><Scribble className="dc-note inline" text={`${done}টা হয়েছে, ${tiles.length - done}টা বাকি`} /></div>
                <div className="dash-grid">
                  {tiles.map((t) => (
                    <Link key={t.t} to={t.to} className={`dtile ${t.ok ? "ok" : ""}`}><span className="dcheck">{t.ok ? "✓" : "○"}</span><h3>{t.t}</h3><p>{t.v}</p><span className="fgo">Open →</span></Link>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        <div className="card mt nb-profile">
          <h3 className="card-t"><Underline>Profile</Underline></h3>
          <div className="row2">
            <label className="field"><span>Major (tests & interviews adapt to it)</span>
              <select value={user.major} onChange={(e) => updateMe({ major: e.target.value })}>{MAJORS.map((m) => <option key={m}>{m}</option>)}</select></label>
            <label className="field"><span>University</span>
              <input defaultValue={user.university} onBlur={(e) => e.target.value !== user.university && updateMe({ university: e.target.value })} /></label>
          </div>
          <label className="field"><span>Headline (shown on the network and your website)</span>
            <input defaultValue={user.headline} maxLength={140} placeholder="CSE '26 · Django & React · open to junior roles" onBlur={(e) => e.target.value !== user.headline && updateMe({ headline: e.target.value })} /></label>
        </div>
      </div>
    </div>
  );
}
