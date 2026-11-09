// Flat-style SVG characters for the story animation.
// Local coordinates: feet at (0,0), standing head centre at (0,-505). Everything is deterministic in `tt` (seconds).

export const ARMS = {
  down: { L: [[-80, -330], [-84, -240]], R: [[80, -330], [84, -240]] },
  point: { L: [[-80, -330], [-84, -240]], R: [[125, -405], [205, -430]] },
  pointL: { L: [[-125, -405], [-205, -430]], R: [[80, -330], [84, -240]] },
  hips: { L: [[-118, -335], [-66, -272]], R: [[118, -335], [66, -272]] },
  cover: { L: [[-88, -380], [-28, -492]], R: [[88, -380], [28, -492]] },
  head: { L: [[-112, -470], [-44, -560]], R: [[112, -470], [44, -560]] },
  phone: { L: [[-70, -320], [-22, -372]], R: [[70, -320], [22, -372]] },
  reach: { L: [[-80, -330], [-84, -240]], R: [[130, -400], [215, -395]] },
  shake: { L: [[-80, -330], [-84, -240]], R: [[110, -300], [165, -252]] },
  shakeL: { L: [[-110, -330], [-165, -322]], R: [[80, -330], [84, -240]] },
  wave: { L: [[-80, -330], [-84, -240]], R: [[115, -470], [125, -565]] },
  tray: { L: [[-75, -320], [-40, -338]], R: [[75, -320], [40, -338]] },
  fist: { L: [[-80, -330], [-84, -240]], R: [[115, -460], [95, -548]] },
  cheer: { L: [[-110, -480], [-125, -578]], R: [[110, -480], [125, -578]] },
  letter: { L: [[-80, -330], [-84, -240]], R: [[115, -470], [120, -560]] },
  run: { L: [[-95, -350], [-70, -280]], R: [[95, -350], [70, -280]] },
};

export function blendArms(a, b, k) {
  const A = typeof a === "string" ? ARMS[a] : a, B = typeof b === "string" ? ARMS[b] : b;
  const mix = (p, q) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
  return { L: [mix(A.L[0], B.L[0]), mix(A.L[1], B.L[1])], R: [mix(A.R[0], B.R[0]), mix(A.R[1], B.R[1])] };
}

export const RAFI = { skin: "#B97A55", hair: "short", hairColor: "#1b1410", outfit: { type: "tee", color: "#6B7684", pants: "#2E3A4E" } };
export const RAFI_FORMAL = { ...RAFI, outfit: { type: "formal", color: "#F4F7FB", tie: "#4B2FD6", pants: "#2B2D3A" } };
export const BABA = { skin: "#A86C48", hair: "oldman", hairColor: "#8a8a8a", mustache: "#4a4a4a", glasses: true, outfit: { type: "panjabi", color: "#ECE6D6", pants: "#D8D0BE", button: "#C9A227" } };
export const MA = { skin: "#C18A62", hair: "bun", hairColor: "#2a1d16", headcover: true, outfit: { type: "sari", color: "#9E2B3F", blouse: "#7A1F31", border: "#E8B634" } };
export const NILA = { skin: "#C99068", hair: "long", hairColor: "#24160f", outfit: { type: "kurti", color: "#E0607E", scarf: "#F6C1CF", pants: "#F3E9DC" } };
export const HR = { skin: "#B07450", hair: "bob", hairColor: "#2b1a12", outfit: { type: "blazer", color: "#2F3B52", pants: "#2F3B52" } };

const INK = "#1b1410";

function Arm({ sh, el, ha, upper, lower, skin }) {
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={`M ${sh[0]} ${sh[1]} L ${el[0]} ${el[1]}`} stroke={upper} strokeWidth="26" />
      <path d={`M ${el[0]} ${el[1]} L ${ha[0]} ${ha[1]}`} stroke={lower} strokeWidth="23" />
      <circle cx={ha[0]} cy={ha[1]} r="14" fill={skin} stroke="none" />
    </g>
  );
}

// ---- anime-style face: big glossy eyes, tapered brows, tiny nose, soft blush, cel shading ----
const IRIS = { dark: ["#2a1810", "#7a4a2c"], brown: ["#3a2214", "#a0673d"], hazel: ["#3b2a12", "#b8873a"], grey: ["#2b2f38", "#7d8796"] };

function Eye({ x, y, mood, blink, lookX, lash, iris, side }) {
  const [ci, cl] = IRIS[iris] || IRIS.brown;
  const ix = x + lookX * 0.35;
  if (blink) return <path d={`M ${x - 13} ${y} Q ${x} ${y + 5} ${x + 14} ${y - 1}`} stroke={INK} strokeWidth="3.6" fill="none" strokeLinecap="round" />;
  if (mood === "happy") return <path d={`M ${x - 13} ${y + 3} Q ${x} ${y - 11} ${x + 13} ${y + 3}`} stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />;
  const top = mood === "angry" ? -8 : mood === "surprised" ? -18 : -15;
  const bot = mood === "surprised" ? 13 : 11;
  const ir = mood === "surprised" ? [6.5, 8.5] : [8.6, 11.2];
  return (
    <g>
      <path d={`M ${x - 13} ${y - 2} Q ${x - 12} ${y + top} ${x} ${y + top} Q ${x + 12} ${y + top} ${x + 14} ${y - 4} Q ${x + 12} ${y + bot} ${x} ${y + bot} Q ${x - 12} ${y + bot} ${x - 13} ${y - 2} Z`} fill="#FFFDF9" />
      <ellipse cx={ix} cy={y - 1 + (mood === "angry" ? 2 : 0)} rx={ir[0]} ry={Math.min(ir[1], (bot - top) / 2)} fill={ci} />
      <ellipse cx={ix} cy={y + 4} rx={ir[0] * 0.72} ry={ir[1] * 0.5} fill={cl} opacity=".85" />
      <ellipse cx={ix} cy={y} rx={ir[0] * 0.45} ry={ir[1] * 0.5} fill="#0d0705" />
      <ellipse cx={ix} cy={y + top + 4} rx={ir[0] + 3} ry="4" fill={INK} opacity=".28" />
      <circle cx={ix - 3.2} cy={y - 5} r={mood === "sad" ? 3.8 : 3.2} fill="#fff" />
      <circle cx={ix + 3.6} cy={y + 5} r="1.6" fill="#fff" opacity=".9" />
      <path d={`M ${x - 14} ${y - 2} Q ${x - 11} ${y + top - 1} ${x} ${y + top - 1} Q ${x + 12} ${y + top - 1} ${x + 15} ${y - 5}`} stroke={INK} strokeWidth="3.8" fill="none" strokeLinecap="round" />
      {lash && <path d={side < 0 ? `M ${x - 13} ${y - 3} l -7 -6 M ${x - 12} ${y - 7} l -5 -6` : `M ${x + 14} ${y - 5} l 7 -6 M ${x + 13} ${y - 9} l 5 -6`} stroke={INK} strokeWidth="2.6" strokeLinecap="round" />}
      <path d={`M ${x - 5} ${y + bot} Q ${x + 2} ${y + bot + 1.5} ${x + 9} ${y + bot - 2}`} stroke={INK} strokeWidth="1.6" fill="none" opacity=".45" strokeLinecap="round" />
    </g>
  );
}

function Face({ mood, talk, tt, lookX, p }) {
  const blink = (tt * 1000) % 3900 < 110;
  const ex = [-20 + lookX, 20 + lookX], ey = -503;
  const open = talk ? 0.35 + 0.65 * Math.abs(Math.sin(tt * 17)) * (0.6 + 0.4 * Math.sin(tt * 5.3)) : 0;
  const lash = p.hair === "long" || p.hair === "bob" || p.hair === "bun" || p.lashes;
  const browY = { neutral: [-525, -529], angry: [-520, -530], sad: [-531, -523], surprised: [-534, -536], happy: [-527, -531] }[mood] || [-525, -529];
  const brow = (x, side) => {
    const inner = side < 0 ? x + 11 : x - 11, outer = side < 0 ? x - 12 : x + 12;
    return <path d={`M ${outer} ${browY[0] + 3} Q ${x} ${browY[1] - 3} ${inner} ${browY[0] + (mood === "angry" ? 4 : mood === "sad" ? -6 : 0)}`} stroke={p.hairColor === "#bbb" || p.hairColor === "#8a8a8a" || p.hairColor === "#999" || p.hairColor === "#777" ? "#5a5550" : INK} strokeWidth="3.4" fill="none" strokeLinecap="round" />;
  };
  let mouth;
  const my = -467;
  if (talk) mouth = <g><path d={`M -9 ${my - 1} Q 0 ${my + 4 + open * 11} 9 ${my - 1} Q 0 ${my - 3} -9 ${my - 1} Z`} fill="#6b2230" />{open > 0.5 && <ellipse cx="0" cy={my + 2 + open * 6} rx="4.5" ry="2.4" fill="#e7808a" />}</g>;
  else if (mood === "happy") mouth = <g><path d={`M -11 ${my - 3} Q 0 ${my + 13} 11 ${my - 3} Q 0 ${my} -11 ${my - 3} Z`} fill="#6b2230" /><ellipse cx="0" cy={my + 5} rx="5" ry="2.6" fill="#e7808a" /></g>;
  else if (mood === "sad") mouth = <path d={`M -7 ${my + 3} Q 0 ${my - 3} 7 ${my + 3}`} stroke="#7a3b3b" strokeWidth="2.6" fill="none" strokeLinecap="round" />;
  else if (mood === "angry") mouth = <path d={`M -9 ${my + 1} Q 0 ${my - 3} 9 ${my + 1}`} stroke="#6b2230" strokeWidth="3.2" fill="none" strokeLinecap="round" />;
  else if (mood === "surprised") mouth = <ellipse cx="0" cy={my + 1} rx="4.5" ry="6" fill="#6b2230" />;
  else mouth = <path d={`M -6 ${my} Q 0 ${my + 3.5} 6 ${my}`} stroke="#7a3b3b" strokeWidth="2.4" fill="none" strokeLinecap="round" />;
  return (
    <g>
      <g fill="#FF7D8A" opacity={mood === "happy" ? 0.5 : mood === "angry" ? 0.42 : 0.26}><ellipse cx={-29 + lookX * 0.3} cy="-481" rx="9.5" ry="4.6" /><ellipse cx={29 + lookX * 0.3} cy="-481" rx="9.5" ry="4.6" /></g>
      {[-1, 1].map((side, i) => <Eye key={i} x={ex[i]} y={ey} side={side} mood={mood} blink={blink} lookX={lookX} lash={lash} iris={p.iris} />)}
      {brow(ex[0], -1)}{brow(ex[1], 1)}
      <path d={`M ${2 + lookX * 0.2} -489 q -3.5 5 0.5 7`} stroke="#00000040" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {p.mustache && <path d="M -17 -474 Q 0 -483 17 -474 Q 9 -469 0 -472 Q -9 -469 -17 -474 Z" fill={p.mustache} />}
      {mouth}
      {p.glasses && <g fill="#ffffff1c" stroke="#2b2b2b" strokeWidth="2.6"><rect x={ex[0] - 16} y={ey - 14} width="32" height="26" rx="10" /><rect x={ex[1] - 16} y={ey - 14} width="32" height="26" rx="10" /><path d={`M ${ex[0] + 16} ${ey - 4} Q ${(ex[0] + ex[1]) / 2} ${ey - 9} ${ex[1] - 16} ${ey - 4}`} fill="none" /></g>}
      {mood === "sad" && p.tears && <path d={`M -28 ${-490 + ((tt * 40) % 40)} q -4 8 0 11 q 4 -3 0 -11 Z`} fill="#7CC4FF" opacity="0.9" />}
      {p.sweat && <path d="M 44 -548 q -7 12 0 16 q 7 -4 0 -16 Z" fill="#7CC4FF" />}
    </g>
  );
}

// ---- anime hair: layered bangs with pointed locks + a glossy highlight band ----
const shine = (d, o = 0.32) => <path d={d} stroke="#ffffff" strokeOpacity={o} strokeWidth="5" fill="none" strokeLinecap="round" />;
function Hair({ p, back }) {
  const c = p.hairColor;
  if (back) return <path d="M -56 -515 C -60 -570 -30 -592 0 -592 C 30 -592 60 -570 56 -515 C 54 -470 34 -450 0 -446 C -34 -450 -54 -470 -56 -515 Z" fill={c} />;
  switch (p.hair) {
    case "short":
      return <g>
        <path d="M -55 -506 C -62 -562 -36 -592 2 -592 C 40 -592 62 -562 55 -506 L 50 -514 C 49 -536 42 -548 33 -553 L 30 -528 L 19 -556 L 9 -526 L -1 -558 L -11 -527 L -21 -555 L -29 -527 L -38 -548 C -46 -540 -50 -526 -51 -506 Z" fill={c} />
        <path d="M -51 -506 L -52 -476 L -45 -500 Z M 51 -506 L 52 -478 L 45 -500 Z" fill={c} />
        {shine("M -28 -578 Q 2 -588 28 -578")}
      </g>;
    case "spiky":
      return <g>
        <path d="M -55 -506 C -66 -548 -58 -572 -44 -582 L -50 -606 L -26 -590 L -18 -616 L -2 -592 L 12 -618 L 22 -590 L 44 -606 L 40 -580 C 60 -566 64 -540 55 -506 L 49 -514 C 48 -534 42 -546 32 -552 L 28 -526 L 17 -556 L 6 -524 L -4 -556 L -14 -524 L -24 -554 L -32 -526 L -40 -548 C -48 -538 -51 -524 -51 -506 Z" fill={c} />
        {shine("M -26 -580 Q 0 -590 26 -580")}
      </g>;
    case "oldman":
      return <g fill={c}>
        <path d="M -53 -512 C -54 -548 -40 -566 -24 -570 C -30 -556 -32 -540 -30 -526 L -50 -500 Z" /><path d="M 53 -512 C 54 -548 40 -566 24 -570 C 30 -556 32 -540 30 -526 L 50 -500 Z" />
        <path d="M -54 -505 Q -58 -470 -48 -458 L -44 -500 Z" /><path d="M 54 -505 Q 58 -470 48 -458 L 44 -500 Z" />
        <ellipse cx="-12" cy="-562" rx="14" ry="5" fill="#ffffff" opacity=".22" />
      </g>;
    case "cap":
      return <g><path d="M -54 -520 Q -52 -584 0 -586 Q 52 -584 54 -520 Q 30 -536 0 -536 Q -30 -536 -54 -520 Z" fill={p.capColor || "#F7F5EE"} stroke="#d9d4c4" strokeWidth="2" />
        <path d="M -40 -548 Q 0 -560 40 -548" stroke="#e2ddcd" strokeWidth="2" fill="none" /><path d="M -54 -512 Q -58 -490 -52 -480 L -48 -512 Z M 54 -512 Q 58 -490 52 -480 L 48 -512 Z" fill={c} /></g>;
    case "bob":
      return <g>
        <path d="M -60 -500 C -66 -460 -58 -442 -42 -438 L -44 -500 C -36 -530 -16 -540 2 -536 C 20 -540 38 -530 44 -500 L 42 -438 C 58 -442 66 -460 60 -500 C 64 -566 34 -594 0 -594 C -34 -594 -64 -566 -60 -500 Z" fill={c} />
        <path d="M -46 -506 C -40 -540 -20 -552 6 -552 C -6 -540 -10 -528 -12 -516 C -18 -530 -30 -534 -46 -506 Z" fill={c} />
        {shine("M -34 -576 Q 0 -588 32 -576")}
      </g>;
    case "bun":
    case "long":
      return <g>
        <path d="M -56 -500 C -62 -566 -30 -594 4 -592 C 40 -590 62 -562 56 -500 L 50 -512 C 46 -538 32 -552 16 -557 C 22 -542 20 -530 12 -520 C 7 -538 -6 -550 -22 -553 C -15 -540 -19 -528 -31 -519 C -33 -534 -41 -542 -47 -540 C -51 -530 -52 -516 -50 -500 Z" fill={c} />
        {p.hair === "long" && <><path d="M -56 -514 C -66 -460 -60 -420 -50 -396 L -40 -400 C -48 -440 -48 -476 -46 -506 Z" fill={c} /><path d="M 56 -514 C 66 -460 60 -420 50 -396 L 40 -400 C 48 -440 48 -476 46 -506 Z" fill={c} /></>}
        {p.hair === "bun" && <path d="M -52 -506 C -56 -488 -54 -474 -48 -466 L -46 -504 Z M 52 -506 C 56 -488 54 -474 48 -466 L 46 -504 Z" fill={c} />}
        {shine("M -36 -574 Q 0 -588 34 -575")}
      </g>;
    default:
      return null;
  }
}

function Torso({ p }) {
  const O = p.outfit;
  switch (O.type) {
    case "formal":
      return <g>
        <rect x="-66" y="-442" width="132" height="232" rx="42" fill={O.color} stroke="#d8dde5" strokeWidth="2" />
        <path d="M -20 -444 L 0 -416 L 20 -444 L 8 -446 L 0 -436 L -8 -446 Z" fill="#e3e8ef" />
        <path d="M -9 -430 L 9 -430 L 13 -300 L 0 -282 L -13 -300 Z" fill={O.tie} />
        <rect x="-66" y="-226" width="132" height="14" fill="#1f2230" />
      </g>;
    case "panjabi":
      return <g>
        <rect x="-70" y="-442" width="140" height="335" rx="40" fill={O.color} stroke="#d6cfbd" strokeWidth="2" />
        <path d="M 0 -440 L 0 -330" stroke="#c9c1ab" strokeWidth="3" />
        {[-420, -390, -360].map((y) => <circle key={y} cx="0" cy={y} r="4" fill={O.button} />)}
        <path d="M -70 -160 L -58 -110 M 70 -160 L 58 -110" stroke="#c9c1ab" strokeWidth="3" />
      </g>;
    case "sari":
      return <g>
        <rect x="-62" y="-442" width="124" height="140" rx="40" fill={O.blouse} />
        <path d="M -64 -312 L 64 -312 L 88 -10 Q 0 6 -88 -10 Z" fill={O.color} />
        <path d="M -88 -10 Q 0 6 88 -10 L 84 -52 Q 0 -38 -84 -52 Z" fill={O.border} />
        {[-30, 0, 30].map((x) => <path key={x} d={`M ${x} -250 L ${x * 1.3} -60`} stroke="#00000022" strokeWidth="3" />)}
        <path d="M -64 -446 L -14 -446 L 68 -232 L 20 -232 Z" fill={O.color} />
        <path d="M -14 -446 L 68 -232 L 58 -232 L -22 -446 Z" fill={O.border} />
      </g>;
    case "kurti":
      return <g>
        <path d="M -62 -300 L 62 -300 L 82 -150 L -82 -150 Z" fill={O.color} />
        <rect x="-62" y="-442" width="124" height="180" rx="40" fill={O.color} />
        <path d="M -66 -432 Q 0 -360 66 -432 L 66 -398 Q 0 -326 -66 -398 Z" fill={O.scarf} />
        <path d="M 52 -404 L 74 -230 L 54 -226 L 38 -396 Z" fill={O.scarf} />
      </g>;
    case "blazer":
      return <g>
        <rect x="-66" y="-442" width="132" height="232" rx="42" fill="#F4F7FB" />
        <path d="M -68 -430 Q -68 -444 -50 -444 L -8 -444 L -2 -212 L -68 -212 Z" fill={O.color} />
        <path d="M 68 -430 Q 68 -444 50 -444 L 8 -444 L 2 -212 L 68 -212 Z" fill={O.color} />
        <path d="M -8 -444 L -30 -400 L -6 -360 Z M 8 -444 L 30 -400 L 6 -360 Z" fill="#202a3b" />
      </g>;
    case "lungi":
      return <g>
        <rect x="-62" y="-442" width="124" height="225" rx="40" fill={O.color} />
        <path d="M -30 -444 Q 0 -400 30 -444" fill={p.skin} />
        <path d="M -62 -400 Q -40 -440 -24 -444 M 62 -400 Q 40 -440 24 -444" stroke="#00000018" strokeWidth="4" fill="none" />
      </g>;
    case "hoodie":
      return <g>
        <rect x="-68" y="-442" width="136" height="236" rx="44" fill={O.color} />
        <path d="M -40 -446 Q 0 -390 40 -446" stroke="#00000030" strokeWidth="7" fill="none" />
        <path d="M -10 -410 L -14 -360 M 10 -410 L 14 -360" stroke="#ffffffaa" strokeWidth="3" strokeLinecap="round" />
        <rect x="-40" y="-300" width="80" height="44" rx="14" fill="#00000018" />
      </g>;
    default: // tee
      return <g>
        <rect x="-66" y="-442" width="132" height="232" rx="44" fill={O.color} />
        <path d="M -22 -444 Q 0 -420 22 -444" stroke="#00000033" strokeWidth="5" fill="none" />
      </g>;
  }
}

function Legs({ p, sit, walk }) {
  const O = p.outfit;
  const pants = O.pants || O.lungi || "#2E3A4E";
  if (O.type === "sari") return <g fill="#3a2a22"><ellipse cx="-30" cy="-4" rx="22" ry="9" /><ellipse cx="30" cy="-4" rx="22" ry="9" /></g>;
  if (O.type === "lungi" && !sit) {
    const L = O.lungi || "#2F6E5A";
    return <g>
      <path d="M -66 -232 L 66 -232 L 74 -36 Q 0 -26 -74 -36 Z" fill={L} />
      {[-48, -20, 8, 36].map((x) => <path key={x} d={`M ${x} -232 L ${x * 1.12} -34`} stroke="#ffffff33" strokeWidth="5" />)}
      {[-190, -140, -90].map((y) => <path key={y} d={`M -70 ${y} L 70 ${y}`} stroke="#00000022" strokeWidth="5" />)}
      <rect x="-48" y="-40" width="24" height="34" rx="9" fill={p.skin} /><rect x="24" y="-40" width="24" height="34" rx="9" fill={p.skin} />
      <ellipse cx="-34" cy="-6" rx="25" ry="10" fill="#6b4a2a" /><ellipse cx="34" cy="-6" rx="25" ry="10" fill="#6b4a2a" />
    </g>;
  }
  if (sit) {
    return <g>
      <rect x="-62" y="-160" width="124" height="54" rx="24" fill={pants} />
      <rect x="-52" y="-120" width="36" height="110" rx="16" fill={pants} />
      <rect x="16" y="-120" width="36" height="110" rx="16" fill={pants} />
      <ellipse cx="-34" cy="-8" rx="27" ry="12" fill="#1c1c1c" /><ellipse cx="34" cy="-8" rx="27" ry="12" fill="#1c1c1c" />
    </g>;
  }
  const a = walk != null ? Math.sin(walk) * 22 : 0;
  const top = O.type === "panjabi" ? -150 : O.type === "kurti" ? -170 : -225;
  const w = O.type === "kurti" ? 30 : 38;
  return <g>
    <g transform={`rotate(${a} -26 ${top})`}>
      <rect x={-26 - w / 2} y={top} width={w} height={-top - 8} rx="16" fill={pants} />
      <ellipse cx="-30" cy="-7" rx="27" ry="12" fill="#1c1c1c" />
    </g>
    <g transform={`rotate(${-a} 26 ${top})`}>
      <rect x={26 - w / 2} y={top} width={w} height={-top - 8} rx="16" fill={pants} />
      <ellipse cx="30" cy="-7" rx="27" ry="12" fill="#1c1c1c" />
    </g>
  </g>;
}

function Prop({ kind, hands, glow, tt }) {
  const [l, r] = hands;
  const mx = (l[0] + r[0]) / 2, my = (l[1] + r[1]) / 2;
  if (kind === "phone") {
    return <g>
      {glow > 0 && <circle cx={mx} cy={my - 70} r="140" fill="url(#phoneGlow)" opacity={glow} />}
      <rect x={mx - 20} y={my - 34} width="40" height="64" rx="8" fill="#16181d" stroke="#3a3f4a" strokeWidth="2" />
      <circle cx={mx - 8} cy={my - 24} r="3.5" fill="#3a3f4a" />
    </g>;
  }
  if (kind === "tray") {
    return <g>
      <ellipse cx={mx} cy={my - 4} rx="70" ry="16" fill="#F4F4F2" stroke="#cfcfca" strokeWidth="2" />
      {[[-34, "#FFF8E7"], [-10, "#6B3A1F"], [14, "#FFF8E7"], [36, "#6B3A1F"], [2, "#F2C14E"]].map(([dx, c], i) => (
        <circle key={i} cx={mx + dx} cy={my - 14 - (i === 4 ? 12 : 0)} r="12" fill={c} stroke="#00000022" />
      ))}
    </g>;
  }
  if (kind === "letter") {
    const [hx, hy] = r;
    return <g transform={`rotate(${-8 + Math.sin(tt * 6) * 3} ${hx} ${hy})`}>
      <rect x={hx - 16} y={hy - 132} width="98" height="126" rx="6" fill="#fff" stroke="#0E0F0C" strokeWidth="3" />
      <rect x={hx - 16} y={hy - 132} width="98" height="28" rx="6" fill="#4B2FD6" />
      {[-90, -74, -58, -42].map((y) => <rect key={y} x={hx - 4} y={hy + y} width={y === -42 ? 40 : 70} height="6" rx="3" fill="#cfd3c8" />)}
      <circle cx={hx + 60} cy={hy - 24} r="12" fill="none" stroke="#E5484D" strokeWidth="3" />
    </g>;
  }
  if (kind === "cup") {
    const [hx, hy] = r;
    return <g>
      <path d={`M ${hx - 13} ${hy - 30} L ${hx + 13} ${hy - 30} L ${hx + 10} ${hy + 4} L ${hx - 10} ${hy + 4} Z`} fill="#ffffffcc" stroke="#9aa093" strokeWidth="2" />
      <path d={`M ${hx - 12} ${hy - 20} L ${hx + 12} ${hy - 20} L ${hx + 10} ${hy + 3} L ${hx - 10} ${hy + 3} Z`} fill="#B46A2C" />
      {[0, 1].map((i) => <path key={i} d={`M ${hx - 4 + i * 8} ${hy - 38} q 6 -10 0 -20 q -6 -10 0 -20`} stroke="#ffffff88" strokeWidth="3" fill="none" opacity={0.4 + 0.4 * Math.sin(tt * 3 + i)} />)}
    </g>;
  }
  if (kind === "newspaper") {
    return <g transform={`rotate(${Math.sin(tt * 2) * 1.5} ${mx} ${my})`}>
      <rect x={mx - 120} y={my - 150} width="240" height="170" rx="4" fill="#F4F1E6" stroke="#0E0F0C" strokeWidth="3" />
      <rect x={mx - 104} y={my - 136} width="208" height="22" fill="#0E0F0C" />
      <text x={mx} y={my - 119} textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff" fontFamily="'Hind Siliguri', sans-serif">চাকরির খবর</text>
      {[-100, -84, -68, -52, -36, -20].map((y, i) => <rect key={y} x={mx - 104 + (i % 2) * 108} y={my + y} width="96" height="8" rx="3" fill="#c9c6bb" />)}
    </g>;
  }
  if (kind === "mic") {
    const [hx, hy] = r;
    return <g><rect x={hx - 6} y={hy - 40} width="12" height="46" rx="5" fill="#2b2d33" /><circle cx={hx} cy={hy - 48} r="16" fill="#3a3d45" stroke="#1b1c20" strokeWidth="3" /><rect x={hx - 16} y={hy - 30} width="32" height="16" rx="3" fill={p_micColor} /></g>;
  }
  return null;
}
const p_micColor = "#E5484D";

/** A character. `p` = definition above; arms = preset name or {L,R}. */
export function Person({ x, y, s = 1, p, tt, mood = "neutral", talk = false, arms = "down", sit = false, walk = null, shake = 0, lookX = 0, headDy = 0, back = false, hold = null, glow = 0, opacity = 1 }) {
  const O = p.outfit;
  const sitDy = sit ? 70 : 0;
  const bob = walk != null ? -Math.abs(Math.sin(walk)) * 10 : 0;
  const sx = shake ? Math.sin(tt * 38) * shake : 0;
  const A = typeof arms === "string" ? ARMS[arms] : arms;
  const wob = (pt, k) => (shake ? [pt[0] + Math.sin(tt * 30 + k) * shake * 1.6, pt[1] + Math.cos(tt * 27 + k) * shake] : pt);
  const full = ["formal", "panjabi", "blazer", "hoodie"].includes(O.type);
  const upper = O.type === "sari" ? O.blouse : O.type === "lungi" ? p.skin : O.color;
  const lower = full ? O.color : p.skin;
  const L = [[-58, -420], wob(A.L[0], 1), wob(A.L[1], 2)];
  const R = [[58, -420], wob(A.R[0], 3), wob(A.R[1], 4)];
  const headCover = p.headcover && !back;
  const HT = (dy = 0) => `translate(0 ${dy}) translate(0 -446) scale(1.13) translate(0 446)`; // anime proportions: a slightly bigger head
  return (
    <g transform={`translate(${x + sx} ${y + bob}) scale(${s})`} opacity={opacity}>
      <ellipse cx="0" cy="2" rx="80" ry="12" fill="#00000026" />
      <Legs p={p} sit={sit} walk={walk} />
      <g transform={`translate(0 ${sitDy})`}>
        {headCover && <g transform={HT(headDy)}><path d="M -72 -515 Q -74 -594 0 -596 Q 74 -594 72 -515 L 80 -428 L -80 -428 Z" fill={O.color} /></g>}
        {p.hair === "long" && <path d={`M -64 ${-528 + headDy} Q -84 -380 -66 -300 L 66 -300 Q 84 -380 64 ${-528 + headDy} Z`} fill={p.hairColor} />}
        {p.hair === "bun" && !headCover && <g transform={HT(headDy)}><circle cx="0" cy="-590" r="24" fill={p.hairColor} /><path d="M -14 -600 Q 0 -608 14 -600" stroke="#fff" strokeOpacity=".3" strokeWidth="4" fill="none" /></g>}
        <Torso p={p} />
        {!["sari"].includes(O.type) && <path d="M 24 -442 Q 68 -440 68 -400 L 68 -218 L 34 -218 Q 48 -330 24 -442 Z" fill="#000" opacity=".09" />}
        <ellipse cx="0" cy="-438" rx="26" ry="6" fill="#000" opacity=".10" />
        {p.idcard && <g><path d="M -26 -440 L 0 -350 L 26 -440" stroke={p.idcard} strokeWidth="5" fill="none" /><rect x="-20" y="-352" width="40" height="52" rx="6" fill="#fff" stroke="#0E0F0C" strokeWidth="2" /><rect x="-20" y="-352" width="40" height="14" rx="6" fill={p.idcard} /><circle cx="0" cy="-322" r="8" fill="#cfd3c8" /></g>}
        {p.gamcha && <g><path d="M -64 -432 Q -10 -420 40 -446 L 52 -430 Q -6 -400 -60 -404 Z" fill={p.gamcha} /><path d="M -50 -428 L -46 -404 M -30 -426 L -28 -402 M -10 -428 L -10 -404 M 10 -432 L 8 -410 M 30 -440 L 28 -418" stroke="#ffffffaa" strokeWidth="3" /></g>}
        <rect x="-14" y="-462" width="28" height="36" fill={p.skin} />
        <path d="M -14 -452 Q 0 -432 14 -452 L 14 -428 L -14 -428 Z" fill="#3a1408" opacity=".18" />
        <g transform={HT(headDy)}>
          <ellipse cx="-50" cy="-503" rx="8" ry="11" fill={p.skin} /><ellipse cx="50" cy="-503" rx="8" ry="11" fill={p.skin} />
          <path d="M -51 -520 C -53 -566 -24 -574 0 -574 C 24 -574 53 -566 51 -520 C 51 -486 41 -462 25 -450 C 15 -443 7 -440 0 -440 C -7 -440 -15 -443 -25 -450 C -41 -462 -51 -486 -51 -520 Z" fill={p.skin} />
          <path d="M 22 -572 C 46 -562 54 -532 51 -500 C 48 -474 38 -458 24 -449 C 35 -472 41 -500 37 -530 C 35 -548 30 -562 22 -572 Z" fill="#5a1e10" opacity=".13" />
          <ellipse cx="-22" cy="-544" rx="16" ry="7" fill="#fff" opacity=".10" />
          {!back && <Face mood={mood} talk={talk} tt={tt} lookX={lookX} p={p} />}
          {p.beard && !back && <path d="M -50 -500 Q -50 -440 0 -432 Q 50 -440 50 -500 Q 40 -462 22 -462 Q 0 -470 -22 -462 Q -40 -462 -50 -500 Z" fill={p.beard} />}
          <Hair p={p} back={back} />
          {headCover && <path d="M -56 -508 Q -50 -584 0 -586 Q 50 -584 56 -508" stroke={O.color} strokeWidth="16" fill="none" strokeLinecap="round" />}
        </g>
        <Arm sh={L[0]} el={L[1]} ha={L[2]} upper={upper} lower={lower} skin={p.skin} />
        <Arm sh={R[0]} el={R[1]} ha={R[2]} upper={upper} lower={lower} skin={p.skin} />
        {hold && <Prop kind={hold} hands={[L[2], R[2]]} glow={glow} tt={tt} />}
      </g>
    </g>
  );
}

/** Speech bubble that pops in at `a` and out at `b`. Text is Bangla. */
export function Bubble({ t, a, b, x, y, w, lines, tx, ty, angry = false, fs = 34 }) {
  if (t < a || t > b) return null;
  const k = Math.min(1, (t - a) / 0.28);
  const back = 1 + 2.70158 * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2);
  const out = Math.min(1, (b - t) / 0.2);
  const h = lines.length * fs * 1.32 + 30;
  const bx = x - w / 2, by = y - h;
  const ax = Math.min(bx + w - 40, Math.max(bx + 40, tx));
  const stroke = angry ? "#E5484D" : "#0E0F0C";
  return (
    <g opacity={Math.min(1, k * 1.4) * out} transform={`translate(${tx} ${ty}) scale(${0.55 + 0.45 * back}) translate(${-tx} ${-ty})`}>
      <rect x={bx} y={by} width={w} height={h} rx="26" fill={angry ? "#FFF3F2" : "#FFFFFF"} stroke={stroke} strokeWidth="4" />
      <path d={`M ${ax - 20} ${y - 3} L ${tx} ${ty} L ${ax + 20} ${y - 3} Z`} fill={angry ? "#FFF3F2" : "#FFFFFF"} />
      <path d={`M ${ax - 20} ${y} L ${tx} ${ty} L ${ax + 20} ${y}`} fill="none" stroke={stroke} strokeWidth="4" strokeLinejoin="round" />
      {lines.map((l, i) => (
        <text key={i} x={x} y={by + 14 + fs * 1.05 + i * fs * 1.32} textAnchor="middle" fontSize={fs} fontWeight="600" fill="#0E0F0C" fontFamily="'Hind Siliguri', sans-serif">{l}</text>
      ))}
      {angry && <g transform={`translate(${bx + w - 8} ${by + 4})`} stroke="#E5484D" strokeWidth="5" strokeLinecap="round"><path d="M -10 -10 L -2 -2 M 10 -10 L 2 -2 M -10 10 L -2 2 M 10 10 L 2 2" /></g>}
    </g>
  );
}

/** Small golden-deer mark for use inside SVG scenes. */
export function DeerMark({ x, y, s = 1, color = "#E8B634", eye = "#4B2FD6" }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) translate(-20 -20)`}>
      <path d="M14 15c-2-3-5-5-6-9M10 9l-4-1M12 12l-5 1M26 15c2-3 5-5 6-9M30 9l4-1M28 12l5 1" stroke={color} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M13 15c2-1.5 4.5-2 7-2s5 .5 7 2c1 3-1 6-2.5 9.5L22 34c-.6 1.4-3.4 1.4-4 0l-2.5-9.5C14 21 12 18 13 15z" fill={color} />
      <circle cx="17" cy="20" r="1.3" fill={eye} /><circle cx="23" cy="20" r="1.3" fill={eye} />
    </g>
  );
}
