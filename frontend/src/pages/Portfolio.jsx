import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import Scribble from "../components/Scribble";
import { ACCENTS, buildSite, DEFAULT_SECTIONS, SAMPLE, TEMPLATES } from "../portfolio/templates";
import { toast } from "../utils";

const SEC_LABEL = { about: "About", skills: "Skills", projects: "Projects", experience: "Experience", education: "Education", certificates: "Verified certificates", contact: "Contact" };
const LINK_KEYS = [["linkedin", "LinkedIn"], ["github", "GitHub"], ["website", "Website"], ["kaggle", "Kaggle"], ["scholar", "Google Scholar"], ["behance", "Behance"], ["facebook", "Facebook page"]];
const SAMPLE_VERIFIED = [{ title: "CSE Skill Check", kind: "Skill Check (Quick Test)", score: 80, code: "SH-SAMPLE1", verify_url: "https://sonarhorin.com/verify/SH-SAMPLE1" }];

function List({ items, onChange, fields, blank, addLabel }) {
  const set = (i, k, v) => onChange(items.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const move = (i, d) => { const a = [...items]; const [x] = a.splice(i, 1); a.splice(i + d, 0, x); onChange(a); };
  return (
    <div className="pf-list">
      {items.map((it, i) => (
        <div key={i} className="pf-item">
          <div className="pf-item-bar"><b>{it[fields[0][0]] || `#${i + 1}`}</b>
            <span><button type="button" disabled={!i} onClick={() => move(i, -1)} aria-label="Move up">↑</button><button type="button" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Move down">↓</button>
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove">✕</button></span></div>
          {fields.map(([k, label, type]) => (
            <label key={k} className="field sm"><span>{label}</span>
              {type === "area" ? <textarea rows={3} value={it[k] || ""} onChange={(e) => set(i, k, e.target.value)} />
                : type === "tags" ? <input value={(it[k] || []).join(", ")} onChange={(e) => set(i, k, e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} placeholder="React, Django" />
                : <input value={it[k] || ""} onChange={(e) => set(i, k, e.target.value)} />}
            </label>
          ))}
        </div>
      ))}
      <button type="button" className="btn btn-out sm" onClick={() => onChange([...items, { ...blank }])}>+ {addLabel}</button>
    </div>
  );
}

function Sec({ k, title, open, setOpen, children }) {
  return (
    <div className={`pf-sec ${open === k ? "open" : ""}`}>
      <button className="pf-sec-h" onClick={() => setOpen(open === k ? "" : k)}><b>{title}</b><i>{open === k ? "−" : "+"}</i></button>
      {open === k && <div className="pf-sec-b">{children}</div>}
    </div>
  );
}

/** Page 2 · Portfolio website builder. Anyone can try it; publishing and downloading need an account. */
export default function Portfolio() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [p, setP] = useState(null);           // { slug, template, accent, data, published, show_certificates, verified, views, exists }
  const [open, setOpen] = useState("template");
  const [device, setDevice] = useState("desktop");
  const [saving, setSaving] = useState("");
  const [slugMsg, setSlugMsg] = useState(null);
  const [gh, setGh] = useState(null);
  const [skillIn, setSkillIn] = useState("");
  const dirty = useRef(false);

  useEffect(() => {
    if (!user) { setP({ slug: "your-name", template: "editorial", accent: "#6B4EFF", data: SAMPLE, published: false, show_certificates: true, verified: SAMPLE_VERIFIED, exists: false, demo: true }); return; }
    api("/api/portfolio/mine/").then((r) => setP({ ...r, data: { sections: DEFAULT_SECTIONS, ...r.data } })).catch(() => toast("Couldn't load your portfolio"));
  }, [user]);

  const save = async (extra = {}) => {
    if (!user) { nav("/login?next=/portfolio"); return null; }
    setSaving("Saving…");
    try {
      const r = await api("/api/portfolio/mine/", { method: "PUT", body: { slug: p.slug, template: p.template, accent: p.accent, data: p.data, show_certificates: p.show_certificates, ...extra } });
      setP((o) => ({ ...o, ...r, data: { sections: DEFAULT_SECTIONS, ...r.data } })); setSaving("Saved ✓"); dirty.current = false;
      return r;
    } catch (x) { setSaving(""); toast(x.message || "Couldn't save"); return null; }
  };
  // autosave
  useEffect(() => {
    if (!p || !user || !dirty.current) return;
    const id = setTimeout(() => save(), 1400);
    return () => clearTimeout(id);
  }, [p]); // eslint-disable-line react-hooks/exhaustive-deps

  const up = (patch) => { dirty.current = true; setSaving(""); setP((o) => ({ ...o, ...patch })); };
  const upD = (patch) => up({ data: { ...p.data, ...patch } });
  const html = useMemo(() => (p ? buildSite({ data: p.data, template: p.template, accent: p.accent, verified: p.show_certificates ? p.verified : [], origin: location.origin, slug: p.slug }) : ""), [p]);

  useEffect(() => {
    if (!p?.slug || !user) return;
    const id = setTimeout(() => api(`/api/portfolio/slug-check/?slug=${encodeURIComponent(p.slug)}`).then(setSlugMsg).catch(() => {}), 400);
    return () => clearTimeout(id);
  }, [p?.slug, user]);

  const publish = async (on) => {
    if (!user) { nav("/login?next=/portfolio"); return; }
    const r = await save({ published: on });
    if (r) toast(on ? "🎉 Your website is live!" : "Unpublished — only you can see it now.");
  };
  const download = () => {
    if (!user) { nav("/login?next=/portfolio"); return; }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    a.download = `${p.slug || "portfolio"}.html`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  const importGitHub = async () => {
    const m = /github\.com\/([A-Za-z0-9-]+)/.exec(p.data.links?.github || "");
    const name = m ? m[1] : prompt("Your GitHub username?");
    if (!name) return;
    setGh({ busy: true });
    try {
      const r = await fetch(`https://api.github.com/users/${encodeURIComponent(name)}/repos?sort=updated&per_page=40`);
      if (!r.ok) throw new Error(r.status === 404 ? "No such GitHub user." : "GitHub didn't answer — try again in a minute.");
      const repos = (await r.json()).filter((x) => !x.fork).sort((a, b) => b.stargazers_count - a.stargazers_count || new Date(b.pushed_at) - new Date(a.pushed_at));
      setGh({ repos: repos.slice(0, 12), pick: new Set(repos.slice(0, 4).map((x) => x.id)) });
    } catch (x) { setGh({ error: x.message }); }
  };
  const addRepos = () => {
    const chosen = gh.repos.filter((x) => gh.pick.has(x.id)).map((x) => ({ title: x.name.replace(/[-_]/g, " "), desc: x.description || "", link: x.homepage || x.html_url, tags: [x.language, ...(x.topics || []).slice(0, 3)].filter(Boolean) }));
    upD({ projects: [...chosen, ...p.data.projects.filter((q) => !chosen.some((c) => c.title === q.title))].slice(0, 10) });
    setGh(null); toast(`Added ${chosen.length} projects from GitHub`);
  };

  if (!p) return <div className="page"><div className="wrap"><p className="muted">Loading your website…</p></div></div>;
  const d = p.data;
  const secs = d.sections || DEFAULT_SECTIONS;
  const toggleSec = (k) => upD({ sections: secs.includes(k) ? secs.filter((x) => x !== k) : DEFAULT_SECTIONS.filter((x) => secs.includes(x) || x === k) });
  const liveUrl = `${location.origin}/u/${p.slug}`;

  return (
    <div className="page pf-page">
      <div className="pf-top">
        <div className="pf-title"><p className="eyebrow">পেজ ২ · তোমার ওয়েবসাইট</p><h1 className="h3">Portfolio website</h1></div>
        <div className="pf-addr">
          <span className="pre">{location.host}/u/</span>
          <input value={p.slug} onChange={(e) => up({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40) })} aria-label="Your address" disabled={!user} />
          {user && slugMsg && <em className={slugMsg.ok ? "ok" : "bad"}>{slugMsg.ok ? "✓ free" : slugMsg.detail}</em>}
        </div>
        <div className="pf-actions">
          {user && <span className="muted small">{saving || (p.exists ? `${p.views || 0} views` : "Draft")}</span>}
          <button className="btn btn-out sm" onClick={download}>⬇ Download .html{!user && " 🔒"}</button>
          {p.published ? (
            <><a className="btn btn-ink sm" href={liveUrl} target="_blank" rel="noopener noreferrer">Open live ↗</a><button className="link small" onClick={() => publish(false)}>Unpublish</button></>
          ) : <button className="btn btn-lime sm" onClick={() => publish(true)}>🚀 Publish live{!user && " 🔒"}</button>}
        </div>
      </div>

      {p.demo && (
        <div className="pf-demo">
          <span className="bn">এটা একটা ডেমো।</span> Log in and we fill it from your profile and CV — then publish it live and download it.
          <Link className="btn btn-ink sm" to="/login?next=/portfolio">Log in</Link><Link className="link small" to="/register?next=/portfolio">Create free account</Link>
        </div>
      )}

      <div className="pf-body">
        <aside className="pf-editor">
          <Sec open={open} setOpen={setOpen} k="template" title="1 · Template & colour">
            <div className="tpl-grid">
              {TEMPLATES.map((t) => (
                <button key={t.id} className={`tpl ${p.template === t.id ? "on" : ""}`} onClick={() => up({ template: t.id })}>
                  <span className={`tpl-th th-${t.id}`} style={{ "--a": t.sw[0], "--b": t.sw[1], "--c": p.accent }}><i /><i /><i /></span>
                  <b>{t.name}</b><small className="bn">{t.bn}</small>
                </button>
              ))}
            </div>
            <div className="acc-row">{ACCENTS.map((c) => <button key={c} className={`acc ${p.accent === c ? "on" : ""}`} style={{ background: c }} onClick={() => up({ accent: c })} aria-label={`Accent ${c}`} />)}
              <label className="acc custom" title="Custom colour"><input type="color" value={p.accent} onChange={(e) => up({ accent: e.target.value })} />🎨</label></div>
          </Sec>
          <Sec open={open} setOpen={setOpen} k="basics" title="2 · You">
            <label className="field sm"><span>Name</span><input value={d.name || ""} onChange={(e) => upD({ name: e.target.value })} /></label>
            <label className="field sm"><span>Headline</span><input value={d.headline || ""} onChange={(e) => upD({ headline: e.target.value })} placeholder="CSE graduate · I build web apps" /></label>
            <div className="row2"><label className="field sm"><span>Location</span><input value={d.location || ""} onChange={(e) => upD({ location: e.target.value })} /></label>
              <label className="field sm"><span>Open to</span><input value={d.open_to || ""} onChange={(e) => upD({ open_to: e.target.value })} placeholder="Full-time" /></label></div>
            <label className="field sm"><span>About you</span><textarea rows={5} value={d.about || ""} onChange={(e) => upD({ about: e.target.value })} /></label>
            <div className="row2"><label className="field sm"><span>Email</span><input value={d.email || ""} onChange={(e) => upD({ email: e.target.value })} /></label>
              <label className="field sm"><span>Phone</span><input value={d.phone || ""} onChange={(e) => upD({ phone: e.target.value })} /></label></div>
          </Sec>
          <Sec open={open} setOpen={setOpen} k="skills" title="3 · Skills">
            <div className="skillbox">
              {(d.skills || []).map((s) => <span key={s} className="sk">{s}<button type="button" onClick={() => upD({ skills: d.skills.filter((x) => x !== s) })} aria-label={`Remove ${s}`}>×</button></span>)}
              <input value={skillIn} onChange={(e) => setSkillIn(e.target.value)} placeholder="Type a skill, press Enter"
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); const v = skillIn.trim(); if (v && !(d.skills || []).includes(v)) upD({ skills: [...(d.skills || []), v] }); setSkillIn(""); } }} />
            </div>
          </Sec>
          <Sec open={open} setOpen={setOpen} k="projects" title="4 · Projects">
            <button className="btn btn-ink sm gh-btn" type="button" onClick={importGitHub}>{gh?.busy ? "Reading GitHub…" : "⤓ Import from GitHub"}</button>
            {gh?.error && <p className="err small">{gh.error}</p>}
            {gh?.repos && (
              <div className="gh-pick">
                {gh.repos.map((r) => (
                  <label key={r.id} className="check"><input type="checkbox" checked={gh.pick.has(r.id)} onChange={() => { const s = new Set(gh.pick); s.has(r.id) ? s.delete(r.id) : s.add(r.id); setGh({ ...gh, pick: s }); }} />
                    <span><b>{r.name}</b> <small className="muted">★ {r.stargazers_count} · {r.language || "—"}</small></span></label>
                ))}
                <button className="btn btn-lime sm" onClick={addRepos}>Add {gh.pick.size} projects</button>
              </div>
            )}
            <List items={d.projects || []} onChange={(v) => upD({ projects: v })} addLabel="Add project" blank={{ title: "", desc: "", link: "", tags: [] }}
              fields={[["title", "Title"], ["desc", "What it does + one number (users, accuracy, time saved)", "area"], ["link", "Link (GitHub, live demo)"], ["tags", "Tags (comma separated)", "tags"]]} />
          </Sec>
          <Sec open={open} setOpen={setOpen} k="experience" title="5 · Experience">
            <List items={d.experience || []} onChange={(v) => upD({ experience: v })} addLabel="Add experience" blank={{ role: "", org: "", period: "", desc: "" }}
              fields={[["role", "Role"], ["org", "Company / club"], ["period", "When"], ["desc", "What you did", "area"]]} />
          </Sec>
          <Sec open={open} setOpen={setOpen} k="education" title="6 · Education">
            <List items={d.education || []} onChange={(v) => upD({ education: v })} addLabel="Add education" blank={{ degree: "", school: "", year: "", detail: "" }}
              fields={[["degree", "Degree"], ["school", "University"], ["year", "Year"], ["detail", "CGPA / thesis"]]} />
          </Sec>
          <Sec open={open} setOpen={setOpen} k="links" title="7 · Links">
            {LINK_KEYS.map(([k, l]) => <label key={k} className="field sm"><span>{l}</span><input value={d.links?.[k] || ""} onChange={(e) => upD({ links: { ...d.links, [k]: e.target.value } })} placeholder="https://" /></label>)}
          </Sec>
          <Sec open={open} setOpen={setOpen} k="verified" title="8 · Verified by সোনারহরিণ">
            <p className="small muted">Certificates you earned here show with a live “Verify” link — employers can check them, you can't edit them. This is what makes your site stronger than a normal portfolio.</p>
            <label className="check"><input type="checkbox" checked={p.show_certificates} onChange={(e) => up({ show_certificates: e.target.checked })} /> Show my certificates</label>
            {(p.verified || []).length ? p.verified.map((c) => <div key={c.code} className="vchip">✓ {c.title} · <code>{c.code}</code></div>)
              : <p className="small">No certificates yet — <Link className="link" to="/quick-test">take a Quick Test</Link> or the <Link className="link" to="/efficiency">Efficiency Test</Link>.</p>}
          </Sec>
          <Sec open={open} setOpen={setOpen} k="sections" title="9 · Sections on the page">
            <div className="sec-toggles">{DEFAULT_SECTIONS.map((k) => <label key={k} className="check"><input type="checkbox" checked={secs.includes(k)} onChange={() => toggleSec(k)} /> {SEC_LABEL[k]}</label>)}</div>
          </Sec>
        </aside>

        <div className="pf-preview">
          <div className="pf-bar">
            <span className="dots"><i /><i /><i /></span>
            <span className="url">{p.published ? "🔒" : "👁"} {location.host}/u/{p.slug}</span>
            <span className="dev">
              <button className={device === "desktop" ? "on" : ""} onClick={() => setDevice("desktop")} aria-label="Desktop preview">🖥</button>
              <button className={device === "mobile" ? "on" : ""} onClick={() => setDevice("mobile")} aria-label="Mobile preview">📱</button>
            </span>
          </div>
          <div className={`pf-frame ${device}`}>
            <iframe title="Portfolio preview" srcDoc={html} sandbox="allow-popups allow-popups-to-escape-sandbox" />
          </div>
          <Scribble className="pf-note" text="লাইভ প্রিভিউ — যা দেখছো, সেটাই পাবলিশ হবে" arrow="up" />
        </div>
      </div>
    </div>
  );
}

/** The live site at /u/:slug — full screen, no Sonarhorin chrome. */
export function PublicSite() {
  const { slug } = useParams();
  const [state, setState] = useState(null);
  useEffect(() => {
    api(`/api/portfolio/u/${encodeURIComponent(slug)}/`).then((r) => {
      setState({ html: buildSite({ data: r.data, template: r.template, accent: r.accent, verified: r.verified, origin: location.origin, slug }) });
      document.title = `${r.data?.name || slug} — Portfolio`;
    }).catch(() => setState({ missing: true }));
  }, [slug]);
  if (!state) return <div className="site-loading"><span className="spin" /></div>;
  if (state.missing) return (
    <div className="page"><div className="wrap narrow"><h1 className="h2">This site isn't published.</h1>
      <p className="muted">The address may be wrong, or the owner hasn't made it public yet.</p><Link className="btn btn-ink" to="/portfolio">Make your own website →</Link></div></div>
  );
  return <iframe className="site-full" title={`${slug} portfolio`} srcDoc={state.html} sandbox="allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation" />;
}
