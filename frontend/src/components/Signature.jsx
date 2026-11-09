import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

const reduced = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const touch = () => window.matchMedia?.("(hover: none), (pointer: coarse)").matches;

/** Gold cursor: a dot + a lagging ring that snaps onto buttons/links and says "View" over cards. */
function GoldCursor() {
  const dot = useRef(null), ring = useRef(null), label = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (touch() || reduced()) return;
    setOn(true);
    document.documentElement.classList.add("sh-cursor");
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, target = null, raf;
    const move = (e) => {
      x = e.clientX; y = e.clientY;
      const t = e.target.closest?.("a, button, [role=button], input, textarea, select, .fc-tile, .sr-card, .jg-canvas");
      target = t && !t.matches("input, textarea, select") ? t : null;
      const mode = !t ? "" : t.matches("input, textarea, select") ? "text" : t.matches(".fc-tile, .sr-card, .job-card, .jcard") ? "view" : "link";
      ring.current.dataset.mode = mode;
      label.current.textContent = mode === "view" ? "View" : "";
    };
    const down = () => ring.current?.classList.add("press");
    const up = () => ring.current?.classList.remove("press");
    const hide = () => { dot.current.style.opacity = ring.current.style.opacity = 0; };
    const show = () => { dot.current.style.opacity = ring.current.style.opacity = 1; };
    const loop = () => {
      let tx = x, ty = y, w = 38, h = 38, r = 999;
      if (target && ring.current.dataset.mode === "link") {
        const b = target.getBoundingClientRect();
        if (b.width < 260 && b.height < 90) { tx = b.left + b.width / 2 + (x - (b.left + b.width / 2)) * 0.15; ty = b.top + b.height / 2 + (y - (b.top + b.height / 2)) * 0.15; w = b.width + 12; h = b.height + 10; r = Math.min(b.height / 2 + 5, 20); }
      }
      rx += (tx - rx) * 0.2; ry += (ty - ry) * 0.2;
      dot.current.style.transform = `translate(${x}px, ${y}px)`;
      Object.assign(ring.current.style, { transform: `translate(${rx}px, ${ry}px)`, width: `${w}px`, height: `${h}px`, borderRadius: `${r}px` });
      raf = requestAnimationFrame(loop);
    };
    addEventListener("pointermove", move, { passive: true }); addEventListener("pointerdown", down); addEventListener("pointerup", up);
    document.addEventListener("pointerleave", hide); document.addEventListener("pointerenter", show);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf); removeEventListener("pointermove", move); removeEventListener("pointerdown", down); removeEventListener("pointerup", up);
      document.removeEventListener("pointerleave", hide); document.removeEventListener("pointerenter", show);
      document.documentElement.classList.remove("sh-cursor");
    };
  }, []);
  if (!on && (typeof window === "undefined" || touch() || reduced())) return null;
  return (
    <>
      <div ref={ring} className="sh-ring" aria-hidden="true"><span ref={label} /></div>
      <div ref={dot} className="sh-dot" aria-hidden="true" />
    </>
  );
}

/** A gold curtain with the deer mark sweeps across on every page change. */
function RouteCurtain() {
  const { pathname } = useLocation();
  const first = useRef(true);
  const [k, setK] = useState(0);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (reduced()) return;
    setK((n) => n + 1);
  }, [pathname]);
  if (!k) return null;
  return (
    <div key={k} className="sh-curtain" aria-hidden="true">
      <i /><i /><i />
      <svg viewBox="0 0 40 40" className="sh-curtain-deer">
        <path d="M14 15c-2-3-5-5-6-9M10 9l-4-1M12 12l-5 1M26 15c2-3 5-5 6-9M30 9l4-1M28 12l5 1" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M13 15c2-1.5 4.5-2 7-2s5 .5 7 2c1 3-1 6-2.5 9.5L22 34c-.6 1.4-3.4 1.4-4 0l-2.5-9.5C14 21 12 18 13 15z" fill="currentColor" />
      </svg>
    </div>
  );
}

/** Thin progress line at the top with a tiny golden deer running along it. */
function ScrollDeer() {
  const ref = useRef(null);
  useEffect(() => {
    let raf, last = -1;
    const tick = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 200 ? scrollY / max : 0;
      if (Math.abs(p - last) > 0.0005) {
        last = p;
        ref.current?.style.setProperty("--p", p.toFixed(4));
        ref.current?.classList.toggle("on", p > 0.01 && p < 0.995);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div ref={ref} className="sh-progress" aria-hidden="true">
      <i />
      <svg viewBox="0 0 40 40" className="sh-progress-deer"><path d="M14 15c-2-3-5-5-6-9M10 9l-4-1M12 12l-5 1M26 15c2-3 5-5 6-9M30 9l4-1M28 12l5 1" fill="none" stroke="#FFC23D" strokeWidth="3" strokeLinecap="round" /><path d="M13 15c2-1.5 4.5-2 7-2s5 .5 7 2c1 3-1 6-2.5 9.5L22 34c-.6 1.4-3.4 1.4-4 0l-2.5-9.5C14 21 12 18 13 15z" fill="#FFC23D" /></svg>
    </div>
  );
}

export default function Signature() {
  return (
    <>
      <ScrollDeer />
      <RouteCurtain />
      <GoldCursor />
    </>
  );
}
