import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { confetti, fmt } from "../utils";
import Logo from "../components/Logo";

const WORDS = ["CV pile.", "BCS waiting list.", "family's questions.", "next phone scroll."];
const ROW1 = ["প্রথম চাকরি", "First job", "No experience?", "No problem", "০ বছরের অভিজ্ঞতা", "Zero years needed"];
const ROW2 = ["Junior Software Engineer", "Management Trainee", "Content Writer", "Graduate Engineer Trainee", "QA Engineer", "Merchandiser Trainee", "Data Analyst Trainee", "Medical Promotion Officer"];
const STAMPS = ["REJECTED", "NO REPLY", "2+ YRS EXP", "SEEN ✓✓", "ON HOLD"];
const N_CARDS = 16;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Final call-to-action: floating CV pile you can push around, rotating headline, real waitlist. */
export default function JoinCTA() {
  const secRef = useRef(null), btnRef = useRef(null), cardsRef = useRef([]), rowsRef = useRef([]);
  const state = useRef({ mx: -9999, my: -9999, sweep: 0, sweepAt: 0, vel: 0 });
  const [word, setWord] = useState(0);
  const emRefs = useRef([]);
  const [rotW, setRotW] = useState(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(null);
  const [count, setCount] = useState(null);
  const valid = EMAIL.test(email);

  useEffect(() => {
    const m = () => { const el = emRefs.current[word]; if (el) setRotW(el.offsetWidth); };
    m(); document.fonts?.ready.then(m);
    addEventListener("resize", m);
    return () => removeEventListener("resize", m);
  }, [word]);
  useEffect(() => { api("/api/waitlist/").then((d) => setCount(d.count)).catch(() => {}); }, []);
  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setWord((w) => (w + 1) % WORDS.length), 2400);
    return () => clearInterval(id);
  }, [done]);

  // floating CV cards + marquee, one rAF loop, DOM writes only
  useEffect(() => {
    const sec = secRef.current;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // cards live in the side gutters so they never sit under the headline or form
    const cards = Array.from({ length: N_CARDS }, (_, i) => ({
      side: i % 2 ? 1 : -1, f: ((i * 41) % 100) / 100,
      by: 0.06 + ((i * 53) % 80) / 100, ph: i * 1.7, rot: ((i * 29) % 50) - 25,
      ox: 0, oy: 0, vx: 0, vy: 0,
    }));
    let raf, last = 0, visible = false, off1 = 0, off2 = 0, lastScroll = scrollY;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(sec);
    const onMove = (e) => {
      const r = sec.getBoundingClientRect();
      state.current.mx = e.clientX - r.left; state.current.my = e.clientY - r.top;
      sec.style.setProperty("--sx", `${state.current.mx}px`); sec.style.setProperty("--sy", `${state.current.my}px`);
    };
    const onLeave = () => { state.current.mx = -9999; state.current.my = -9999; };
    sec.addEventListener("pointermove", onMove); sec.addEventListener("pointerleave", onLeave);

    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
      if (!visible) return;
      const W = sec.clientWidth, H = sec.clientHeight, t = now / 1000, S = state.current;
      // scroll velocity → marquee speed
      const sv = Math.abs(scrollY - lastScroll) / Math.max(dt, 0.016); lastScroll = scrollY;
      S.vel += (Math.min(sv, 3000) - S.vel) * 0.08;
      const speed = reduce ? 0 : 40 + S.vel * 0.12;
      [rowsRef.current[0], rowsRef.current[1]].forEach((row, k) => {
        if (!row) return;
        const half = row.scrollWidth / 2 || 1;
        if (k === 0) { off1 = (off1 + speed * dt) % half; row.style.transform = `translate3d(${-off1}px,0,0)`; }
        else { off2 = (off2 + speed * 0.8 * dt) % half; row.style.transform = `translate3d(${off2 - half}px,0,0)`; }
      });
      // swept into the button after joining
      let target = null;
      if (S.sweep && btnRef.current) {
        const b = btnRef.current.getBoundingClientRect(), r = sec.getBoundingClientRect();
        target = { x: b.left - r.left + b.width / 2, y: b.top - r.top + b.height / 2 };
      }
      cards.forEach((c, i) => {
        const el = cardsRef.current[i]; if (!el) return;
        const small = W < 700;
        const [a, b] = small ? [-0.03, 0.07] : [0.03, 0.19];
        const edge = (a + (b - a) * c.f) * W;
        const hx = c.side < 0 ? edge : W - edge, hy = c.by * H;
        const fx = reduce ? 0 : Math.sin(t * 0.6 + c.ph) * 14, fy = reduce ? 0 : Math.cos(t * 0.5 + c.ph) * 12;
        const base = small ? 0.7 : 1;
        let x = hx + fx + c.ox, y = hy + fy + c.oy, sc = base, op = small && i >= 10 ? 0 : 1;
        if (target) {
          const k = Math.min(1, Math.max(0, (t - S.sweepAt - i * 0.035) / 0.7));
          const e = k * k * (3 - 2 * k);
          x += (target.x - x) * e; y += (target.y - y) * e; sc = base * (1 - e * 0.9); op = Math.min(op, 1 - e);
        } else {
          // push away from the cursor, spring back home
          const dx = x - S.mx, dy = y - S.my, d = Math.hypot(dx, dy) || 1;
          if (d < 170) { const f = (170 - d) / 170; c.vx += (dx / d) * f * 1400 * dt; c.vy += (dy / d) * f * 1400 * dt; }
          c.vx += -c.ox * 9 * dt; c.vy += -c.oy * 9 * dt;
          c.vx *= 0.9; c.vy *= 0.9; c.ox += c.vx * dt * 8; c.oy += c.vy * dt * 8;
        }
        el.style.transform = `translate3d(${x}px,${y}px,0) rotate(${c.rot + c.vx * 0.04 + Math.sin(t + c.ph) * 3}deg) scale(${sc})`;
        el.style.opacity = op;
      });
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); io.disconnect(); sec.removeEventListener("pointermove", onMove); sec.removeEventListener("pointerleave", onLeave); };
  }, []);

  // magnetic button
  const magnet = (e) => {
    const b = btnRef.current; if (!b || done) return;
    const r = b.getBoundingClientRect();
    b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
  };
  const unmagnet = () => { if (btnRef.current) btnRef.current.style.transform = ""; };

  const submit = async (e) => {
    e.preventDefault();
    if (!valid) { setErr("Enter a valid email — e.g. you@gmail.com"); return; }
    setBusy(true); setErr("");
    try {
      const major = localStorage.getItem("prothom_field") || "";
      const r = await api("/api/waitlist/", { method: "POST", body: { email, major } });
      state.current.sweep = 1; state.current.sweepAt = performance.now() / 1000;
      const b = btnRef.current.getBoundingClientRect();
      setTimeout(() => { confetti(b.left + b.width / 2, b.top); setDone(r); setCount(r.count); }, 750);
    } catch (x) { setErr(x.message || "Something went wrong — try again."); }
    finally { setBusy(false); }
  };

  const shareText = encodeURIComponent("I just joined সোনারহরিণ — a job platform only for fresh graduates in Bangladesh. Join here: " + location.origin);

  return (
    <section className={`cta2 ${done ? "is-done" : ""}`} id="cta" ref={secRef} onPointerMove={magnet}>
      <div className="cta2-spot" aria-hidden="true" />
      <div className="cta2-cards" aria-hidden="true">
        {Array.from({ length: N_CARDS }, (_, i) => (
          <div key={i} className="cta2-cv" ref={(el) => (cardsRef.current[i] = el)}>
            <i className="av" /><i className="l h" /><i className="l" /><i className="l s" />
            <b>{STAMPS[i % STAMPS.length]}</b>
          </div>
        ))}
      </div>

      <div className="wrap cta2-inner">
        {!done ? (
          <>
            <p className="cta2-hint">✋ Psst — push the CV pile around</p>
            <h2 className="h2">Your first job is closer<br />than your{" "}
              <span className="rot" aria-live="polite" style={rotW ? { width: rotW } : undefined}>
                {WORDS.map((w, i) => <em key={w} ref={(el) => (emRefs.current[i] = el)} className={i === word ? "on" : i === (word + WORDS.length - 1) % WORDS.length ? "out" : ""} aria-hidden={i !== word}>{w}</em>)}
              </span>
            </h2>
            <form className="cta2-form" onSubmit={submit} noValidate>
              <label className={`cta2-field ${email ? (valid ? "ok" : "bad") : ""}`}>
                <span className="sr">Email</span>
                <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }} placeholder="you@gmail.com" autoComplete="email" />
                <span className="state" aria-hidden="true">{email ? (valid ? "✓" : "…") : ""}</span>
              </label>
              <button ref={btnRef} className="btn btn-lime cta2-btn" disabled={busy} onPointerLeave={unmagnet}>
                <span>{busy ? "Joining…" : <>Join <span className="bn">সোনারহরিণ</span> — it's free</>}</span>
                <i className="shine" />
              </button>
            </form>
            {err && <p className="cta2-err">{err}</p>}
            <p className="cta2-count">
              {count == null ? "Free forever for freshers · No spam" : count === 0 ? "Be the very first fresher on the list ✨" : <><b>{fmt(count)}</b> fresher{count === 1 ? "" : "s"} already on the list · Free forever</>}
            </p>
          </>
        ) : (
          <div className="cta2-done">
            <Logo light />
            <p className="pos">{done.already ? "You're already in! Your spot:" : "You're in! Your spot:"}</p>
            <div className="big">#{fmt(done.position)}</div>
            <p className="muted2">We'll email your first fresher matches. Don't wait for them — start now:</p>
            <div className="row">
              <Link to="/cv" className="btn btn-lime">Judge my CV now →</Link>
              <a className="btn btn-ghost" href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noopener noreferrer">Share on WhatsApp</a>
            </div>
          </div>
        )}
      </div>

      <div className="cta2-marq" aria-hidden="true">
        <div className="mrow" ref={(el) => (rowsRef.current[0] = el)}>
          {[...ROW1, ...ROW1, ...ROW1, ...ROW1].map((w, i) => <span key={i} className={/[ঀ-৿]/.test(w) ? "bn" : ""}>{w}<i>·</i></span>)}
        </div>
        <div className="mrow two" ref={(el) => (rowsRef.current[1] = el)}>
          {[...ROW2, ...ROW2].map((w, i) => <span key={i}>{w}<i>✦</i></span>)}
        </div>
      </div>
    </section>
  );
}
