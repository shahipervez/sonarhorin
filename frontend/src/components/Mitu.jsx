import { useEffect, useRef } from "react";

const SVG = `<svg viewBox="0 0 200 220" aria-hidden="true" style="width:100%;height:100%">
<path d="M48 92 C40 140 52 178 70 186 L130 186 C148 178 160 140 152 92 Z" fill="#1b1410"/>
<path d="M22 220 C24 176 64 156 100 156 C136 156 176 176 178 220Z" fill="#4B2FD6"/>
<path d="M84 156 L100 178 L116 156Z" fill="#FFC23D"/>
<rect x="88" y="132" width="24" height="28" rx="10" fill="#A86C48"/>
<ellipse cx="100" cy="96" rx="47" ry="54" fill="#B97A55"/>
<path d="M52 94 C46 50 76 33 104 35 C136 37 156 60 149 98 C140 74 126 64 102 63 C82 64 64 74 52 94Z" fill="#1b1410"/>
<path d="M70 84 q12 -7 22 -1" stroke="#1b1410" stroke-width="3.5" fill="none" stroke-linecap="round"/>
<path d="M108 83 q11 -6 22 1" stroke="#1b1410" stroke-width="3.5" fill="none" stroke-linecap="round"/>
<g class="m-eyes"><ellipse cx="82" cy="100" rx="5.5" ry="6.5" fill="#1b1410"/><ellipse cx="118" cy="100" rx="5.5" ry="6.5" fill="#1b1410"/>
<circle cx="84" cy="98" r="1.8" fill="#fff"/><circle cx="120" cy="98" r="1.8" fill="#fff"/></g>
<circle cx="70" cy="118" r="8" fill="#E2856F" opacity=".35"/><circle cx="130" cy="118" r="8" fill="#E2856F" opacity=".35"/>
<path d="M100 104 q-4 10 0 13" stroke="#8e5638" stroke-width="2.5" fill="none" stroke-linecap="round"/>
<ellipse class="m-mouth" cx="100" cy="130" rx="10" ry="2.5" fill="#5a1e1e"/>
<path d="M46 98 C44 30 156 30 154 98" stroke="#0E0F0C" stroke-width="6" fill="none"/>
<rect x="38" y="88" width="14" height="26" rx="6" fill="#0E0F0C"/><rect x="148" y="88" width="14" height="26" rx="6" fill="#0E0F0C"/>
<path d="M46 112 C50 136 66 140 80 136" stroke="#0E0F0C" stroke-width="3.5" fill="none" stroke-linecap="round"/>
<circle cx="82" cy="135.5" r="4.5" fill="#FFC23D" stroke="#0E0F0C" stroke-width="2"/></svg>`;

/** Mitu, the AI recruiter avatar. Mouth moves while `talking` is true. */
export default function Mitu({ talking = false, className = "", style }) {
  const ref = useRef(null);
  const talk = useRef(talking);
  talk.current = talking;

  useEffect(() => {
    const mouth = ref.current.querySelector(".m-mouth");
    let raf, last = 0, open = 0, target = 0, jt = 0;
    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
      if (talk.current) {
        jt -= dt;
        if (jt <= 0) { jt = 0.09 + Math.random() * 0.06; target = Math.random() < 0.18 ? 0 : 0.3 + Math.random() * 0.7; }
      } else target = 0;
      open += (target - open) * Math.min(1, dt * 18);
      mouth.setAttribute("ry", (2.5 + open * 9).toFixed(2));
      mouth.setAttribute("rx", (10 - open * 2).toFixed(2));
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <div ref={ref} className={`mitu ${className}`} style={style} dangerouslySetInnerHTML={{ __html: SVG }} />;
}
