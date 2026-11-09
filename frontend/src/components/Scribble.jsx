import { useEffect, useRef, useState } from "react";

const ARROWS = {
  down: { box: "0 0 60 70", d: "M14 6 C 34 10 44 30 32 60", head: "M22 52 L32 62 L39 50" },
  right: { box: "0 0 80 50", d: "M4 30 C 20 6 46 8 70 24", head: "M60 14 L72 25 L58 32" },
  left: { box: "0 0 80 50", d: "M76 30 C 60 6 34 8 10 24", head: "M20 14 L8 25 L22 32" },
  up: { box: "0 0 60 70", d: "M30 64 C 18 44 22 22 34 8", head: "M24 16 L34 6 L42 18" },
  curl: { box: "0 0 90 60", d: "M6 50 C 20 10 50 6 52 30 C 54 50 30 48 40 30 C 50 14 70 14 84 22", head: "M74 12 L86 22 L74 30" },
};

/** Hand-written note that writes itself when it scrolls into view (Galada for Bangla, Caveat for English). */
export default function Scribble({ text, arrow = null, className = "", delay = 0, color, tag: Tag = "span" }) {
  const ref = useRef(null);
  const [go, setGo] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setGo(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setGo(true); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(el); return () => io.disconnect();
  }, []);
  const bn = /[ঀ-৿]/.test(text);
  const a = arrow && ARROWS[arrow];
  return (
    <Tag ref={ref} className={`scribble ${bn ? "bn-hand" : "en-hand"} ${go ? "go" : ""} ${arrow ? "has-" + arrow : ""} ${className}`} style={{ "--d": `${delay}s`, color }}>
      <span className="sc-text">{text}</span>
      {a && (
        <svg className={`sc-arrow a-${arrow}`} viewBox={a.box} aria-hidden="true">
          <path d={a.d} pathLength="1" /><path className="hd" d={a.head} pathLength="1" />
        </svg>
      )}
    </Tag>
  );
}

/** A hand-drawn ellipse around its children. */
export function Circled({ children, color = "#E8B634", className = "" }) {
  const ref = useRef(null);
  const [go, setGo] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setGo(true); io.disconnect(); } }, { threshold: 0.6 });
    io.observe(ref.current); return () => io.disconnect();
  }, []);
  return (
    <span ref={ref} className={`circled ${go ? "go" : ""} ${className}`}>
      {children}
      <svg viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true">
        <path d="M 168 14 C 120 0 30 4 12 30 C -4 56 70 76 130 72 C 186 68 204 40 176 20 C 160 10 120 8 96 10" pathLength="1" stroke={color} />
      </svg>
    </span>
  );
}

/** A hand-drawn underline. */
export function Underline({ children, color = "#FFC23D" }) {
  return (
    <span className="hand-ul">
      {children}
      <svg viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true"><path d="M2 9 C 50 3 120 4 198 7 M 30 12 C 80 8 140 9 190 11" pathLength="1" stroke={color} /></svg>
    </span>
  );
}
