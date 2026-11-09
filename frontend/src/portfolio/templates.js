// Portfolio website generator. Pure HTML + CSS (no scripts), so the same output is used for the live site,
// the builder preview and the downloaded .html file. All user text is escaped; links must be http(s).

export const TEMPLATES = [
  { id: "editorial", name: "Editorial", bn: "এডিটোরিয়াল", d: "Big serif type, calm and premium.", sw: ["#F6F3EC", "#141414"] },
  { id: "developer", name: "Developer", bn: "ডেভেলপার", d: "Dark, terminal hero, project grid.", sw: ["#0B0F14", "#A78BFA"] },
  { id: "bold", name: "Bold", bn: "বোল্ড", d: "Colour block hero, playful cards.", sw: ["#FF5A36", "#FFFFFF"] },
  { id: "bangla", name: "Bilingual", bn: "দ্বিভাষিক", d: "Bangla + English, warm and local.", sw: ["#FFF8EC", "#4B2FD6"] },
];
export const ACCENTS = ["#6B4EFF", "#4B2FD6", "#FF4F9A", "#FF6B4A", "#E8A317", "#3DA5FF", "#DB2777", "#12101C"];
export const DEFAULT_SECTIONS = ["about", "skills", "projects", "experience", "education", "certificates", "contact"];

export const SAMPLE = {
  name: "Nusrat Jahan Rimi", headline: "CSE graduate · I build web apps and small ML models", location: "Dhaka, Bangladesh", open_to: "Full-time",
  email: "rimi@example.com", phone: "+880 1712 345678",
  about: "I'm a 2026 CSE graduate from IUBAT. I like turning messy problems into simple tools — a food-ordering app my campus actually uses, a Bangla sentiment model for my thesis. I'm looking for a junior developer role where I can ship from week one.",
  skills: ["Python", "Django", "React", "SQL", "Git", "Docker", "scikit-learn", "Figma"],
  projects: [
    { title: "Campus food ordering app", desc: "React + Django REST app used by 300+ students; cut queue time at the canteen by 40%.", link: "https://github.com/", tags: ["React", "Django", "PostgreSQL"] },
    { title: "Bangla sentiment classifier", desc: "Thesis project: 92% accuracy on 18,000 Bangla product reviews with a fine-tuned transformer.", link: "", tags: ["Python", "NLP"] },
    { title: "Tuition finder", desc: "Matches tutors and students by area and subject; 120 sign-ups in the first month.", link: "", tags: ["Next.js", "Firebase"] },
  ],
  experience: [{ role: "Software Engineering Intern", org: "Nodi Labs", period: "Jun – Aug 2025", desc: "Built 6 API endpoints and their tests; fixed 30+ bugs in the admin dashboard." }],
  education: [{ degree: "B.Sc. in Computer Science & Engineering", school: "IUBAT", year: "2026", detail: "CGPA 3.62" }],
  links: { github: "https://github.com/", linkedin: "https://linkedin.com/" },
  sections: DEFAULT_SECTIONS,
};

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const url = (u) => (/^https?:\/\/[^\s<>"']+$/i.test(String(u || "").trim()) ? esc(String(u).trim()) : "");
const LINKS = { linkedin: "LinkedIn", github: "GitHub", website: "Website", kaggle: "Kaggle", scholar: "Google Scholar", behance: "Behance", facebook: "Facebook" };
const BN = {
  about: ["আমার সম্পর্কে", "About"], skills: ["দক্ষতা", "Skills"], projects: ["প্রজেক্ট", "Projects"], experience: ["অভিজ্ঞতা", "Experience"],
  education: ["শিক্ষা", "Education"], certificates: ["ভেরিফায়েড", "Verified"], contact: ["যোগাযোগ", "Contact"],
};
const initials = (n) => esc((n || "?").split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase());

function hexToHsl(hex) {
  const m = /^#?([\da-f]{6})$/i.exec(hex || ""); if (!m) return [150, 80, 20];
  const n = parseInt(m[1], 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
  if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

function head({ d, accent, fonts, css, origin, slug }) {
  const title = `${esc(d.name)} — ${esc(d.headline || "Portfolio")}`;
  const desc = esc((d.about || d.headline || "").slice(0, 160));
  const ld = JSON.stringify({ "@context": "https://schema.org", "@type": "Person", name: d.name, jobTitle: d.headline, email: d.email ? `mailto:${d.email}` : undefined,
    address: d.location, sameAs: Object.values(d.links || {}).filter(Boolean), knowsAbout: d.skills }).replace(/</g, "\\u003c");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><meta name="description" content="${desc}"><meta property="og:title" content="${title}"><meta property="og:description" content="${desc}">
<meta property="og:type" content="profile">${slug && origin ? `<meta property="og:url" content="${esc(origin)}/u/${esc(slug)}"><link rel="canonical" href="${esc(origin)}/u/${esc(slug)}">` : ""}
<meta name="theme-color" content="${esc(accent)}"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?${fonts}&display=swap" rel="stylesheet">
<script type="application/ld+json">${ld}</script>
<style>:root{--ac:${esc(accent)}}*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}a{color:inherit}img{max-width:100%}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}${css}</style></head>`;
}

const linksHtml = (d, cls = "lk") => Object.entries(d.links || {}).filter(([, v]) => url(v)).map(([k, v]) => `<a class="${cls}" href="${url(v)}" target="_blank" rel="noopener">${LINKS[k] || esc(k)} ↗</a>`).join("");
const contactHtml = (d) => [d.email && `<a href="mailto:${esc(d.email)}">${esc(d.email)}</a>`, d.phone && `<a href="tel:${esc(String(d.phone).replace(/\s/g, ""))}">${esc(d.phone)}</a>`].filter(Boolean).join("");
const footer = (origin) => `<footer class="ft"><span>Built with <a href="${esc(origin || "https://sonarhorin.com")}" target="_blank" rel="noopener">সোনারহরিণ</a> · first jobs for freshers in Bangladesh</span></footer>`;
const verifiedHtml = (v, cls = "vf") => v.map((c) => `<a class="${cls}" href="${url(c.verify_url)}" target="_blank" rel="noopener"><span class="seal">✓</span><span><b>${esc(c.title)}</b><small>${esc(c.kind)}${c.score != null ? ` · ${esc(c.score)}/100` : ""} · ${esc(c.code)}</small></span><em>Verify ↗</em></a>`).join("");

// ---------------------------------------------------------------- templates
function editorial(d, v, o) {
  const css = `body{background:#F6F3EC;color:#141414;font:16px/1.65 Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.w{max-width:1040px;margin:0 auto;padding:0 24px}.hero{padding:96px 0 72px;border-bottom:1px solid #d9d3c4}
.kick{font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#6b6659;display:flex;gap:14px;align-items:center;flex-wrap:wrap}
.dot{display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid #d9d3c4;border-radius:99px;padding:5px 12px;letter-spacing:0;text-transform:none;font-size:13px;color:#141414}
.dot i{width:8px;height:8px;border-radius:50%;background:var(--ac);box-shadow:0 0 0 0 var(--ac);animation:pl 2s infinite}@keyframes pl{70%{box-shadow:0 0 0 8px transparent}}
h1{font:400 clamp(56px,11vw,132px)/.92 'Instrument Serif',Georgia,serif;letter-spacing:-.02em;margin:28px 0 18px}
.hl{font:400 clamp(22px,2.6vw,32px)/1.25 'Instrument Serif',Georgia,serif;color:#3d3a32;max-width:760px}.hl em{color:var(--ac)}
.lks{display:flex;gap:10px;flex-wrap:wrap;margin-top:28px}.lk{text-decoration:none;border:1px solid #141414;border-radius:99px;padding:8px 16px;font-size:14px;transition:background .2s,color .2s}.lk:hover{background:#141414;color:#F6F3EC}
section{display:grid;grid-template-columns:220px 1fr;gap:32px;padding:64px 0;border-bottom:1px solid #d9d3c4}
section>h2{font:400 15px Inter;letter-spacing:.14em;text-transform:uppercase;color:#6b6659;position:sticky;top:24px;align-self:start}
.ab{font:400 clamp(22px,2.2vw,28px)/1.4 'Instrument Serif',Georgia,serif}
.sk{display:flex;flex-wrap:wrap;gap:8px}.sk span{border:1px solid #cfc8b6;border-radius:99px;padding:6px 14px;font-size:14px;background:#fff}
.pj{list-style:none;counter-reset:p}.pj li{counter-increment:p;display:grid;grid-template-columns:56px 1fr auto;gap:16px;padding:22px 0;border-top:1px solid #e3ddcf}.pj li:first-child{border-top:0;padding-top:0}
.pj li::before{content:"0" counter(p);font:400 28px 'Instrument Serif',serif;color:var(--ac)}
.pj h3{font:400 30px/1.1 'Instrument Serif',Georgia,serif}.pj p{color:#4a463c;margin-top:6px}.tg{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.tg span{font-size:12px;color:#6b6659}.tg span::before{content:"#"}
.pj a{align-self:start;text-decoration:none;font-size:22px;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;border:1px solid #141414;transition:transform .25s,background .2s}.pj a:hover{transform:rotate(45deg);background:var(--ac);color:#fff;border-color:var(--ac)}
.ex{display:grid;gap:22px}.ex div{display:grid;grid-template-columns:160px 1fr;gap:16px}.ex small{color:#6b6659}.ex b{display:block;font:400 24px 'Instrument Serif',serif}.ex p{color:#4a463c}
.vfs{display:grid;gap:10px}.vf{display:flex;gap:14px;align-items:center;padding:14px 18px;background:#fff;border:1px solid #d9d3c4;border-radius:14px;text-decoration:none}.vf b{display:block}.vf small{color:#6b6659}.vf em{margin-left:auto;font-style:normal;color:var(--ac);font-weight:600;font-size:14px}
.seal{width:36px;height:36px;border-radius:50%;background:var(--ac);color:#fff;display:grid;place-items:center;font-weight:700;flex:none}
.ct a{display:block;font:400 clamp(30px,5vw,56px)/1.15 'Instrument Serif',Georgia,serif;text-decoration:none;border-bottom:1px solid transparent;width:max-content;max-width:100%;overflow-wrap:anywhere}.ct a:hover{color:var(--ac);border-color:var(--ac)}
.ft{padding:40px 24px 60px;text-align:center;font-size:13px;color:#6b6659}
@media(max-width:720px){section{grid-template-columns:1fr;gap:16px;padding:44px 0}section>h2{position:static}.ex div{grid-template-columns:1fr;gap:2px}.pj li{grid-template-columns:40px 1fr}.pj a{grid-column:2}}`;
  const S = {
    about: d.about && `<section id="about"><h2>About</h2><p class="ab">${esc(d.about)}</p></section>`,
    skills: d.skills?.length && `<section id="skills"><h2>Skills</h2><div class="sk">${d.skills.map((s) => `<span>${esc(s)}</span>`).join("")}</div></section>`,
    projects: d.projects?.length && `<section id="projects"><h2>Selected work</h2><ol class="pj">${d.projects.map((p) => `<li><div><h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p>${p.tags?.length ? `<div class="tg">${p.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>` : ""}</div>${url(p.link) ? `<a href="${url(p.link)}" target="_blank" rel="noopener" aria-label="Open ${esc(p.title)}">↗</a>` : ""}</li>`).join("")}</ol></section>`,
    experience: d.experience?.length && `<section id="experience"><h2>Experience</h2><div class="ex">${d.experience.map((e) => `<div><small>${esc(e.period)}</small><span><b>${esc(e.role)}</b><small>${esc(e.org)}</small><p>${esc(e.desc)}</p></span></div>`).join("")}</div></section>`,
    education: d.education?.length && `<section id="education"><h2>Education</h2><div class="ex">${d.education.map((e) => `<div><small>${esc(e.year)}</small><span><b>${esc(e.degree)}</b><small>${esc(e.school)}${e.detail ? ` · ${esc(e.detail)}` : ""}</small></span></div>`).join("")}</div></section>`,
    certificates: v.length && `<section id="verified"><h2>Verified</h2><div class="vfs">${verifiedHtml(v)}</div></section>`,
    contact: contactHtml(d) && `<section id="contact"><h2>Contact</h2><div class="ct">${contactHtml(d)}</div></section>`,
  };
  return { css, fonts: "family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600", body: `<main class="w"><header class="hero">
<div class="kick"><span>Portfolio — ${new Date().getFullYear()}</span>${d.location ? `<span>${esc(d.location)}</span>` : ""}${d.open_to ? `<span class="dot"><i></i>Open to: ${esc(d.open_to)}</span>` : ""}</div>
<h1>${esc(d.name)}</h1><p class="hl">${esc(d.headline)}</p><div class="lks">${linksHtml(d)}</div></header>${order(d).map((k) => S[k] || "").join("")}</main>${footer(o)}` };
}

function developer(d, v, o) {
  const css = `body{background:#0B0F14;color:#C9D1D9;font:15px/1.65 Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.w{max-width:1080px;margin:0 auto;padding:0 22px}.mono{font-family:'JetBrains Mono',ui-monospace,monospace}
nav{display:flex;justify-content:space-between;align-items:center;padding:22px 0;font-size:13px;color:#8B949E}nav b{color:var(--ac)}nav a{text-decoration:none;margin-left:18px}nav a:hover{color:#fff}
.term{margin:40px 0 70px;border:1px solid #21262D;border-radius:14px;background:#0D1117;box-shadow:0 30px 80px rgba(0,0,0,.45);overflow:hidden}
.bar{display:flex;gap:7px;padding:12px 14px;border-bottom:1px solid #21262D}.bar i{width:11px;height:11px;border-radius:50%;background:#30363D}.bar i:first-child{background:#FF5F57}.bar i:nth-child(2){background:#FEBC2E}.bar i:nth-child(3){background:#28C840}
.tb{padding:28px clamp(18px,4vw,40px) 36px}.pr{color:#8B949E}.pr b{color:var(--ac);font-weight:500}
h1{font:700 clamp(40px,8vw,88px)/1 'JetBrains Mono',monospace;color:#fff;margin:14px 0;letter-spacing:-.03em}
.cur{display:inline-block;width:.55em;height:.9em;background:var(--ac);vertical-align:-.08em;animation:bl 1s steps(1) infinite}@keyframes bl{50%{opacity:0}}
.hl{font-size:clamp(17px,2vw,21px);color:#C9D1D9;max-width:720px}.hl::before{content:"// ";color:#6E7681}
.lks{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}.lk{font:500 13px 'JetBrains Mono',monospace;text-decoration:none;border:1px solid #30363D;border-radius:8px;padding:8px 12px}.lk:hover{border-color:var(--ac);color:var(--ac)}
.badge{display:inline-flex;align-items:center;gap:8px;margin-top:18px;font:500 12.5px 'JetBrains Mono',monospace;color:var(--ac);background:color-mix(in srgb,var(--ac) 12%,transparent);border:1px solid color-mix(in srgb,var(--ac) 35%,transparent);padding:5px 10px;border-radius:99px}
section{padding:46px 0;border-top:1px solid #21262D}h2{font:600 13px 'JetBrains Mono',monospace;color:#8B949E;margin-bottom:20px}h2 b{color:var(--ac)}
.ab{font-size:18px;max-width:800px;color:#E6EDF3}
.code{font:13.5px/1.9 'JetBrains Mono',monospace;background:#0D1117;border:1px solid #21262D;border-radius:12px;padding:18px 20px;overflow:auto}.code .k{color:#FF7B72}.code .s{color:#A5D6FF}.code .n{color:#79C0FF}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
.card{position:relative;display:flex;flex-direction:column;gap:10px;background:#0D1117;border:1px solid #21262D;border-radius:14px;padding:20px;text-decoration:none;transition:border-color .2s,transform .2s}
.card:hover{border-color:var(--ac);transform:translateY(-3px)}.card h3{color:#fff;font:600 17px 'JetBrains Mono',monospace}.card h3::before{content:"▸ ";color:var(--ac)}.card p{color:#8B949E;font-size:14.5px}
.tg{display:flex;gap:6px;flex-wrap:wrap;margin-top:auto}.tg span{font:500 11.5px 'JetBrains Mono',monospace;color:#79C0FF;background:#161B22;border-radius:6px;padding:3px 8px}
.log{font:14px/1.7 'JetBrains Mono',monospace}.log div{padding:12px 0;border-bottom:1px dashed #21262D}.log .h{color:#E3B341}.log b{color:#fff}.log p{color:#8B949E;font-family:Inter,sans-serif;margin-top:4px}
.vf{display:flex;gap:12px;align-items:center;padding:14px 16px;border:1px solid #21262D;border-radius:12px;text-decoration:none;margin-bottom:10px;background:#0D1117}.vf:hover{border-color:var(--ac)}.vf b{display:block;color:#fff}.vf small{color:#8B949E;font-family:'JetBrains Mono',monospace;font-size:12px}.vf em{margin-left:auto;font-style:normal;color:var(--ac);font-size:13px}
.seal{width:32px;height:32px;border-radius:8px;background:var(--ac);color:#0B0F14;display:grid;place-items:center;font-weight:800;flex:none}
.ct a{display:inline-block;font:600 clamp(20px,3vw,30px) 'JetBrains Mono',monospace;color:#fff;text-decoration:none;margin-right:26px;overflow-wrap:anywhere}.ct a:hover{color:var(--ac)}
.ft{padding:30px 22px 50px;text-align:center;font:12px 'JetBrains Mono',monospace;color:#6E7681}.ft a{color:var(--ac)}`;
  const slug = (d.name || "me").split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "") || "me";
  const S = {
    about: d.about && `<section id="about"><h2><b>01.</b> about.md</h2><p class="ab">${esc(d.about)}</p></section>`,
    skills: d.skills?.length && `<section id="skills"><h2><b>02.</b> stack.js</h2><pre class="code"><span class="k">const</span> <span class="n">stack</span> = [${d.skills.map((s) => `<span class="s">"${esc(s)}"</span>`).join(", ")}];</pre></section>`,
    projects: d.projects?.length && `<section id="projects"><h2><b>03.</b> projects/</h2><div class="grid">${d.projects.map((p) => `<${url(p.link) ? `a href="${url(p.link)}" target="_blank" rel="noopener"` : "div"} class="card"><h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p>${p.tags?.length ? `<div class="tg">${p.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>` : ""}</${url(p.link) ? "a" : "div"}>`).join("")}</div></section>`,
    experience: d.experience?.length && `<section id="experience"><h2><b>04.</b> git log --experience</h2><div class="log">${d.experience.map((e, i) => `<div><span class="h">commit ${(i + 1).toString(16).padStart(7, "a")}</span> · ${esc(e.period)}<br><b>${esc(e.role)}</b>${e.org ? ` @ ${esc(e.org)}` : ""}<p>${esc(e.desc)}</p></div>`).join("")}</div></section>`,
    education: d.education?.length && `<section id="education"><h2><b>05.</b> education</h2><div class="log">${d.education.map((e) => `<div><b>${esc(e.degree)}</b><p>${esc(e.school)} · ${esc(e.year)}${e.detail ? ` · ${esc(e.detail)}` : ""}</p></div>`).join("")}</div></section>`,
    certificates: v.length && `<section id="verified"><h2><b>06.</b> verified --by sonarhorin</h2>${verifiedHtml(v)}</section>`,
    contact: contactHtml(d) && `<section id="contact"><h2><b>07.</b> contact</h2><div class="ct">${contactHtml(d)}</div></section>`,
  };
  return { css, fonts: "family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600", body: `<div class="w"><nav class="mono"><span><b>~/${esc(slug)}</b></span><span>${order(d).filter((k) => S[k]).slice(0, 4).map((k) => `<a href="#${k === "certificates" ? "verified" : k}">${k}</a>`).join("")}</span></nav>
<div class="term"><div class="bar"><i></i><i></i><i></i></div><div class="tb mono"><div class="pr">${esc(slug)}@sonarhorin:~$ <b>whoami</b></div>
<h1>${esc(d.name)}<span class="cur"></span></h1><p class="hl">${esc(d.headline)}</p>${d.open_to ? `<span class="badge">● open to: ${esc(d.open_to)}${d.location ? ` · ${esc(d.location)}` : ""}</span>` : ""}<div class="lks">${linksHtml(d)}</div></div></div>
${order(d).map((k) => S[k] || "").join("")}</div>${footer(o)}` };
}

function bold(d, v, o) {
  const [h, s] = hexToHsl(d._accent);
  const pal = [0, 40, 160, 200, 280].map((x) => `hsl(${(h + x) % 360} ${Math.max(55, s)}% 58%)`);
  const css = `body{background:#fff;color:#111;font:16px/1.6 'Space Grotesk',Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.hero{position:relative;background:var(--ac);color:#fff;padding:28px 24px 0;overflow:hidden;border-radius:0 0 40px 40px}
.top{display:flex;justify-content:space-between;align-items:center;max-width:1180px;margin:0 auto;font-weight:600}.top .av{width:46px;height:46px;border-radius:14px;background:#fff;color:var(--ac);display:grid;place-items:center;font-weight:800}
.top .op{background:rgba(255,255,255,.18);padding:7px 14px;border-radius:99px;font-size:14px}
.hi{max-width:1180px;margin:0 auto;padding:clamp(50px,10vw,120px) 0 clamp(40px,7vw,80px)}
h1{font:700 clamp(54px,13vw,170px)/.86 'Space Grotesk',sans-serif;letter-spacing:-.05em}
.hl{font-size:clamp(19px,2.4vw,28px);max-width:720px;margin-top:26px;opacity:.95}
.lks{display:flex;gap:10px;flex-wrap:wrap;margin-top:28px}.lk{text-decoration:none;background:#fff;color:#111;padding:10px 18px;border-radius:99px;font-weight:600;transition:transform .2s}.lk:hover{transform:translateY(-2px) rotate(-2deg)}
.mq{display:flex;gap:28px;white-space:nowrap;padding:18px 0;font:700 clamp(22px,3vw,34px) 'Space Grotesk';animation:mq 22s linear infinite;width:max-content}.mq span::after{content:"✦";margin-left:28px;opacity:.6}@keyframes mq{to{transform:translateX(-50%)}}
.w{max-width:1180px;margin:0 auto;padding:0 24px}section{padding:72px 0}h2{font:700 clamp(34px,5vw,60px)/1 'Space Grotesk';letter-spacing:-.03em;margin-bottom:28px}
.ab{font-size:clamp(20px,2.4vw,28px);line-height:1.45;max-width:880px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:18px}
.card{position:relative;border-radius:28px;padding:28px;color:#111;text-decoration:none;min-height:230px;display:flex;flex-direction:column;gap:10px;transition:transform .25s}
.card:nth-child(5n+1){background:${pal[0]}}.card:nth-child(5n+2){background:${pal[1]}}.card:nth-child(5n+3){background:${pal[2]}}.card:nth-child(5n+4){background:${pal[3]}}.card:nth-child(5n+5){background:${pal[4]}}
.card:hover{transform:rotate(-1.5deg) translateY(-4px)}.card h3{font:700 28px/1.05 'Space Grotesk'}.card p{font-size:15.5px}.card .tg{margin-top:auto;display:flex;gap:6px;flex-wrap:wrap}.card .tg span{background:rgba(255,255,255,.55);padding:4px 10px;border-radius:99px;font-size:12.5px;font-weight:600}
.card .go{position:absolute;right:20px;top:20px;width:42px;height:42px;border-radius:50%;background:#111;color:#fff;display:grid;place-items:center}
.tl{display:grid;gap:14px}.tl div{display:grid;grid-template-columns:180px 1fr;gap:20px;padding:22px;border:2px solid #111;border-radius:22px}.tl small{font-weight:700}.tl b{font-size:22px;display:block}.tl p{color:#444}
.vf{display:flex;gap:14px;align-items:center;padding:18px 20px;border:2px solid #111;border-radius:20px;text-decoration:none;margin-bottom:10px}.vf b{display:block;font-size:18px}.vf small{color:#555}.vf em{margin-left:auto;font-style:normal;font-weight:700;color:var(--ac)}
.seal{width:40px;height:40px;border-radius:12px;background:var(--ac);color:#fff;display:grid;place-items:center;font-weight:800;flex:none}
.ct{background:#111;color:#fff;border-radius:40px;padding:clamp(36px,6vw,70px)}.ct h2{color:#fff}.ct a{display:block;font:700 clamp(26px,5vw,58px)/1.15 'Space Grotesk';text-decoration:none;overflow-wrap:anywhere}.ct a:hover{color:var(--ac)}
.ft{padding:30px 24px 60px;text-align:center;font-size:13px;color:#666}
@media(max-width:720px){.tl div{grid-template-columns:1fr;gap:4px}}`;
  const S = {
    about: d.about && `<section id="about"><h2>Hi, I'm ${esc((d.name || "").split(" ")[0])}.</h2><p class="ab">${esc(d.about)}</p></section>`,
    projects: d.projects?.length && `<section id="projects"><h2>Things I made</h2><div class="grid">${d.projects.map((p) => `<${url(p.link) ? `a href="${url(p.link)}" target="_blank" rel="noopener"` : "div"} class="card">${url(p.link) ? `<span class="go">↗</span>` : ""}<h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p>${p.tags?.length ? `<div class="tg">${p.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>` : ""}</${url(p.link) ? "a" : "div"}>`).join("")}</div></section>`,
    experience: d.experience?.length && `<section id="experience"><h2>Where I've worked</h2><div class="tl">${d.experience.map((e) => `<div><small>${esc(e.period)}</small><span><b>${esc(e.role)}</b><small>${esc(e.org)}</small><p>${esc(e.desc)}</p></span></div>`).join("")}</div></section>`,
    education: d.education?.length && `<section id="education"><h2>Education</h2><div class="tl">${d.education.map((e) => `<div><small>${esc(e.year)}</small><span><b>${esc(e.degree)}</b><p>${esc(e.school)}${e.detail ? ` · ${esc(e.detail)}` : ""}</p></span></div>`).join("")}</div></section>`,
    certificates: v.length && `<section id="verified"><h2>Verified skills</h2>${verifiedHtml(v)}</section>`,
    contact: contactHtml(d) && `<section id="contact"><div class="ct"><h2>Let's work together.</h2>${contactHtml(d)}</div></section>`,
    skills: "",
  };
  const sk = (d.skills || []).map((x) => `<span>${esc(x)}</span>`).join("");
  return { css, fonts: "family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;600", body: `<header class="hero"><div class="top"><span class="av">${initials(d.name)}</span>${d.open_to ? `<span class="op">● Open to ${esc(d.open_to)}</span>` : ""}</div>
<div class="hi"><h1>${esc(d.name)}</h1><p class="hl">${esc(d.headline)}${d.location ? ` · ${esc(d.location)}` : ""}</p><div class="lks">${linksHtml(d)}</div></div>
${sk && order(d).includes("skills") ? `<div class="mq">${sk}${sk}</div>` : ""}</header><main class="w">${order(d).map((k) => S[k] || "").join("")}</main>${footer(o)}` };
}

function bangla(d, v, o) {
  const css = `body{background:#FFF8EC;color:#1E1B16;font:16px/1.75 'Hind Siliguri',Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.alp{height:18px;background:radial-gradient(circle at 9px 9px,var(--ac) 3px,transparent 4px) 0 0/18px 18px,radial-gradient(circle at 9px 9px,transparent 6px,color-mix(in srgb,var(--ac) 35%,transparent) 7px,transparent 8px) 0 0/18px 18px}
.w{max-width:980px;margin:0 auto;padding:0 22px}
.hero{text-align:center;padding:70px 0 56px}.av{width:96px;height:96px;margin:0 auto 18px;border-radius:50%;display:grid;place-items:center;font:700 34px 'Hind Siliguri';color:#fff;background:var(--ac);box-shadow:0 0 0 6px #FFF8EC,0 0 0 8px var(--ac)}
h1{font:400 clamp(44px,8vw,92px)/1.1 'Galada','Hind Siliguri',cursive;color:var(--ac)}.en1{font:600 clamp(18px,2.4vw,24px) Inter;letter-spacing:-.01em;margin-top:6px}
.hl{max-width:640px;margin:14px auto 0;color:#5a5446}.chips{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:22px}
.chip{background:#fff;border:1px solid #eadfca;border-radius:99px;padding:6px 14px;font-size:14px}.chip.g{background:var(--ac);color:#fff;border-color:var(--ac)}
.lks{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:18px}.lk{color:var(--ac);font-weight:600;text-decoration:none;border-bottom:2px solid currentColor}
section{padding:46px 0;border-top:1px dashed #e2d5bb}h2{display:flex;align-items:baseline;gap:12px;margin-bottom:18px}h2 b{font:400 34px 'Galada',cursive;color:var(--ac)}h2 small{font:600 13px Inter;letter-spacing:.14em;text-transform:uppercase;color:#8a8170}
.ab{font-size:18px}.sk{display:flex;flex-wrap:wrap;gap:8px}.sk span{background:#fff;border:1px solid #eadfca;border-radius:12px;padding:8px 14px;font-weight:600}
.pj{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}.pc{background:#fff;border:1px solid #eadfca;border-radius:20px;padding:22px;text-decoration:none;display:flex;flex-direction:column;gap:8px;box-shadow:0 6px 0 #eadfca;transition:transform .2s,box-shadow .2s}
.pc:hover{transform:translateY(-3px);box-shadow:0 9px 0 var(--ac)}.pc h3{font-size:19px}.pc p{color:#5a5446;font-size:15px}.pc .tg{margin-top:auto;font-size:13px;color:var(--ac);font-weight:600}
.tl div{position:relative;padding:0 0 22px 26px;border-left:2px solid #eadfca}.tl div::before{content:"";position:absolute;left:-7px;top:6px;width:12px;height:12px;border-radius:50%;background:var(--ac)}.tl small{color:#8a8170}.tl b{display:block;font-size:18px}.tl p{color:#5a5446}
.vf{display:flex;gap:12px;align-items:center;background:#fff;border:1px solid #eadfca;border-radius:16px;padding:14px 16px;text-decoration:none;margin-bottom:10px}.vf b{display:block}.vf small{color:#8a8170}.vf em{margin-left:auto;font-style:normal;color:var(--ac);font-weight:700}
.seal{width:38px;height:38px;border-radius:50%;background:var(--ac);color:#fff;display:grid;place-items:center;font-weight:800;flex:none}
.ct{text-align:center}.ct a{display:block;font:600 clamp(22px,4vw,36px) Inter;color:var(--ac);text-decoration:none;overflow-wrap:anywhere;margin:4px 0}
.ft{padding:30px 22px 50px;text-align:center;font-size:13px;color:#8a8170}.ft a{color:var(--ac)}`;
  const H = (k) => `<h2><b>${BN[k][0]}</b><small>${BN[k][1]}</small></h2>`;
  const S = {
    about: d.about && `<section id="about">${H("about")}<p class="ab">${esc(d.about)}</p></section>`,
    skills: d.skills?.length && `<section id="skills">${H("skills")}<div class="sk">${d.skills.map((s) => `<span>${esc(s)}</span>`).join("")}</div></section>`,
    projects: d.projects?.length && `<section id="projects">${H("projects")}<div class="pj">${d.projects.map((p) => `<${url(p.link) ? `a href="${url(p.link)}" target="_blank" rel="noopener"` : "div"} class="pc"><h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p>${p.tags?.length ? `<span class="tg">${p.tags.map(esc).join(" · ")}</span>` : ""}</${url(p.link) ? "a" : "div"}>`).join("")}</div></section>`,
    experience: d.experience?.length && `<section id="experience">${H("experience")}<div class="tl">${d.experience.map((e) => `<div><small>${esc(e.period)}</small><b>${esc(e.role)}${e.org ? ` · ${esc(e.org)}` : ""}</b><p>${esc(e.desc)}</p></div>`).join("")}</div></section>`,
    education: d.education?.length && `<section id="education">${H("education")}<div class="tl">${d.education.map((e) => `<div><small>${esc(e.year)}</small><b>${esc(e.degree)}</b><p>${esc(e.school)}${e.detail ? ` · ${esc(e.detail)}` : ""}</p></div>`).join("")}</div></section>`,
    certificates: v.length && `<section id="verified">${H("certificates")}${verifiedHtml(v)}</section>`,
    contact: contactHtml(d) && `<section id="contact">${H("contact")}<div class="ct">${contactHtml(d)}</div></section>`,
  };
  return { css, fonts: "family=Galada&family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;600", body: `<div class="alp"></div><main class="w"><header class="hero"><div class="av">${initials(d.name)}</div>
<h1>${esc(d.name)}</h1>${d.headline ? `<p class="hl">${esc(d.headline)}</p>` : ""}<div class="chips">${d.location ? `<span class="chip">📍 ${esc(d.location)}</span>` : ""}${d.open_to ? `<span class="chip g">● ${esc(d.open_to)}</span>` : ""}</div><div class="lks">${linksHtml(d)}</div></header>
${order(d).map((k) => S[k] || "").join("")}</main><div class="alp"></div>${footer(o)}` };
}

const order = (d) => (d.sections?.length ? d.sections : DEFAULT_SECTIONS);
const BUILDERS = { editorial, developer, bold, bangla };

/** Full standalone HTML document for a portfolio. */
export function buildSite({ data, template = "editorial", accent = "#4B2FD6", verified = [], origin = "", slug = "" }) {
  const d = { name: "", headline: "", about: "", skills: [], projects: [], experience: [], education: [], links: {}, ...data, _accent: accent };
  const t = (BUILDERS[template] || editorial)(d, verified || [], origin);
  return `${head({ d, accent, fonts: t.fonts, css: t.css, origin, slug })}<body>${t.body}</body></html>`;
}
