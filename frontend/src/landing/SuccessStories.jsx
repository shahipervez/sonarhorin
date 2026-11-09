import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import StoryCard from "../components/StoryCard";
import { useT } from "../i18n";
import { fmt } from "../utils";

function CountUp({ to, prefix = "", suffix = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; let raf;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; io.disconnect();
      const t0 = performance.now();
      const step = (t) => { const k = Math.min(1, (t - t0) / 1200); el.textContent = prefix + fmt(Math.round(to * (1 - Math.pow(1 - k, 3)))) + suffix; if (k < 1) raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.5 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to, prefix, suffix]);
  return <b ref={ref}>{prefix}0{suffix}</b>;
}

/** Home-page success stories: REJECTED → HIRED headline, live stats, draggable flip-card carousel. */
export default function SuccessStories() {
  const t = useT();
  const [data, setData] = useState(null);
  const [major, setMajor] = useState("");
  const [inView, setInView] = useState(false);
  const rowRef = useRef(null), headRef = useRef(null);
  const drag = useRef({ on: false, x: 0, sl: 0, moved: false });
  const hover = useRef(false);

  useEffect(() => { api(`/api/stories/${major ? `?major=${major}` : ""}`).then(setData).catch(() => setData({ stats: {}, stories: [] })); }, [major]);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } }, { threshold: 0.6 });
    io.observe(headRef.current);
    return () => io.disconnect();
  }, []);
  // gentle auto-advance; pauses on hover/drag
  useEffect(() => {
    const id = setInterval(() => {
      const r = rowRef.current; if (!r || hover.current || drag.current.on) return;
      const card = r.querySelector(".scard"); const step = card ? card.offsetWidth + 18 : 360;
      r.scrollTo({ left: r.scrollLeft + step >= r.scrollWidth - r.clientWidth - 4 ? 0 : r.scrollLeft + step, behavior: "smooth" });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const nudge = (dir) => { const r = rowRef.current; const card = r.querySelector(".scard"); r.scrollBy({ left: dir * ((card?.offsetWidth || 340) + 18), behavior: "smooth" }); };
  const down = (e) => { if (e.pointerType !== "mouse") return; drag.current = { on: true, x: e.clientX, sl: rowRef.current.scrollLeft, moved: false }; };
  const move = (e) => { const d = drag.current; if (!d.on) return; const dx = e.clientX - d.x; if (Math.abs(dx) > 4) d.moved = true; rowRef.current.scrollLeft = d.sl - dx; };
  const up = () => { drag.current.on = false; };

  const st = data?.stats || {};
  const majors = ["", "CSE", "EEE", "BBA", "English", "Pharmacy", "Textile"];

  return (
    <section className="stories" id="stories">
      <div className="wrap">
        <div className={`stories-head ${inView ? "in" : ""}`} ref={headRef}>
          <p className="eyebrow">{t("Success stories", "সাফল্যের গল্প")}</p>
          <h2 className="h2">From <span className="strike">REJECTED</span> to <span className="stamp">HIRED.</span></h2>
          <p className="sub">{t("Flip a card to see how they did it.", "কার্ড উল্টে দেখো কীভাবে পেল।")}</p>
        </div>

        <div className="stories-stats">
          <div><CountUp to={st.count || 0} /><span>{t("stories", "গল্প")}</span></div>
          <div><CountUp to={st.avg_days_to_hire || 0} suffix=" days" /><span>{t("to an offer", "অফার পর্যন্ত")}</span></div>
          <div><CountUp to={st.avg_cv_jump || 0} prefix="+" suffix=" pts" /><span>{t("CV score jump", "সিভি স্কোর বাড়ল")}</span></div>
          <div><CountUp to={st.avg_months_jobless || 0} suffix=" mo" /><span>{t("jobless before", "আগে বেকার")}</span></div>
        </div>

        <div className="stories-bar">
          <div className="tabs">{majors.map((m) => <button key={m || "all"} className={`tab ${major === m ? "on" : ""}`} onClick={() => setMajor(m)}>{m || "All"}</button>)}</div>
          <div className="arrows"><button className="round" onClick={() => nudge(-1)} aria-label="Previous">←</button><button className="round" onClick={() => nudge(1)} aria-label="Next">→</button></div>
        </div>

        <div className="stories-row" ref={rowRef} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={() => { up(); hover.current = false; }}
             onPointerEnter={() => (hover.current = true)} onClickCapture={(e) => { if (drag.current.moved) { e.stopPropagation(); e.preventDefault(); drag.current.moved = false; } }}>
          {!data ? <p className="muted">Loading stories…</p> : data.stories.length === 0 ? <p className="muted">No stories for this major yet — be the first.</p>
            : data.stories.map((s) => <StoryCard key={s.id} s={s} />)}
          <Link to="/stories#share" className="scard share-card">
            <span className="plus">＋</span>
            <b>{t("Got your first job?", "প্রথম চাকরি পেয়েছো?")}</b>
            <span className="fgo">{t("Share my story →", "গল্পটা শেয়ার করো →")}</span>
          </Link>
        </div>
        {st.sample_only && <p className="sample-note">Showing sample stories for the prototype. Real member stories appear here after review.</p>}
        <p className="center mt"><Link to="/stories" className="btn btn-out sm">{t("See all stories →", "সব গল্প দেখো →")}</Link></p>
      </div>
    </section>
  );
}
