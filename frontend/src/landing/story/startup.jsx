// Pulok's story — 48 seconds. A boy who can't focus on his books dreams of being a businessman, gets an idea,
// hears about সোনারহরিণ, pitches, gets funded and tells his story to the press.
import { Bubble, DeerMark, Person } from "./people";
import { clamp, ease, prog } from "./scenes";

const BN = "'Hind Siliguri', sans-serif";
const EN = "Inter, sans-serif";
const HAND = "'Galada', 'Hind Siliguri', cursive";
const lerp = (a, b, k) => a + (b - a) * k;

const PULOK = { skin: "#B07A55", hair: "spiky", hairColor: "#1b1410", outfit: { type: "hoodie", color: "#3B3F8F", pants: "#2E3A4E" } };
const PULOK_SUIT = { ...PULOK, hair: "short", outfit: { type: "blazer", color: "#1E2A44", pants: "#1E2A44" } };
const MA = { skin: "#C18A62", hair: "bun", hairColor: "#2a1d16", headcover: true, outfit: { type: "sari", color: "#9E2B3F", blouse: "#7A1F31", border: "#E8B634" } };
const J1 = { skin: "#B07450", hair: "bob", hairColor: "#2b1a12", outfit: { type: "blazer", color: "#2F3B52", pants: "#2F3B52" } };
const J2 = { skin: "#9C6444", hair: "short", hairColor: "#333", glasses: true, outfit: { type: "formal", color: "#E8EEF5", tie: "#9E2B3F", pants: "#2B2D3A" } };
const J3 = { skin: "#A86C48", hair: "oldman", hairColor: "#999", mustache: "#666", outfit: { type: "panjabi", color: "#2F5D4F", pants: "#2E3A4E", button: "#E8B634" } };
const PRESS = [{ skin: "#A97452", hair: "short", hairColor: "#111", outfit: { type: "tee", color: "#5A5F6A" } }, { skin: "#C99068", hair: "long", hairColor: "#1d120c", outfit: { type: "kurti", color: "#7A4A8C", scarf: "#C9A6E0" } },
  { skin: "#8E5A3C", hair: "short", hairColor: "#222", outfit: { type: "formal", color: "#E7E3D3", tie: "#333" } }, { skin: "#B97A55", hair: "bob", hairColor: "#2b1a12", outfit: { type: "blazer", color: "#444" } }];

export const DUR = 48;
const SC = { title: [0, 2.2], desk: [2.2, 11.5], idea: [11.5, 17], hear: [17, 22], app: [22, 30.5], pitch: [30.5, 38.5], press: [38.5, DUR] };
const VP = { pitch: 1.05, babble: 200 }, VM = { pitch: 1.25, babble: 260 }, VJ = { pitch: 0.85, babble: 150 };

const LINES = [
  { a: 0.2, b: 2.1, bn: "সোনারহরিণ নিবেদন করছে — একটা আইডিয়ার গল্প", en: "Sonarhorin presents — the story of an idea" },
  { a: 2.6, b: 5.0, bn: "পড়ায় মন নেই। সারাদিন একটাই স্বপ্ন…", en: "No interest in studies. One dream, all day long…" },
  { a: 5.1, b: 7.6, who: "পুলক · Pulok", voice: VP, bn: "একদিন আমি বড় বিজনেসম্যান হব!", en: "One day, I'll be a big businessman!" },
  { a: 7.7, b: 9.6, who: "মা · Mother", voice: VM, bn: "পুলক! বই খোল, স্বপ্ন পরে দেখিস!", en: "Pulok! Open your books — dream later!" },
  { a: 9.7, b: 11.3, who: "পুলক · Pulok", voice: VP, bn: "আম্মু, এটাও তো পড়া — বিজনেস স্টাডিজ!", en: "Mom, this IS studying — business studies!" },
  { a: 11.9, b: 14.0, who: "পুলক · Pulok", voice: VP, bn: "পাইছি! কৃষকের সবজি সরাসরি শহরের রেস্টুরেন্টে!", en: "Got it! Farmers' vegetables, straight to city restaurants!" },
  { a: 14.1, b: 16.8, who: "পুলক · Pulok", voice: { pitch: 0.95, babble: 180 }, bn: "কিন্তু টাকা কই? কে বিশ্বাস করবে আমাকে?", en: "But where's the money? Who'd believe in me?" },
  { a: 17.4, b: 19.6, who: "নাঈম · Friend (phone)", voice: { pitch: 0.95, babble: 170 }, bn: "দোস্ত, সোনারহরিণ-এ স্টার্টআপ পিচ করা যায় — ফান্ডও দেয়!", en: "Dude, you can pitch startups on Sonarhorin — they fund them too!" },
  { a: 19.7, b: 21.8, who: "পুলক · Pulok", voice: VP, bn: "সোনারহরিণ?! এখনই দেখি!", en: "Sonarhorin?! Let me see — right now!" },
  { a: 22.4, b: 24.5, bn: "লগইন → স্টার্টআপ → পিচ বিল্ডার", en: "Log in → Startup → pitch builder" },
  { a: 24.6, b: 27.0, bn: "পিচ রেডিনেস স্কোর: ৩৪ থেকে ৮৮", en: "Pitch readiness score: 34 → 88" },
  { a: 27.1, b: 30.3, bn: "পিচ ডে-তে ডাক এসেছে!", en: "Invited to Pitch Day!" },
  { a: 30.9, b: 33.4, who: "পুলক · Pulok", voice: VP, bn: "কৃষক পায় ১৮ টাকা, রেস্টুরেন্ট দেয় ৬০ — আমরা মাঝের দালাল সরাই।", en: "Farmers get ৳18, restaurants pay ৳60 — we remove the middlemen." },
  { a: 33.5, b: 35.6, who: "বিচারক · Judge", voice: VJ, bn: "ট্র্যাকশন আছে?", en: "Any traction?" },
  { a: 35.7, b: 36.9, who: "পুলক · Pulok", voice: VP, bn: "৬ সপ্তাহে ২১০টা অর্ডার!", en: "210 orders in 6 weeks!" },
  { a: 37.0, b: 38.4, who: "বিচারক · Judge", voice: VJ, bn: "আমরা ইনভেস্ট করছি!", en: "We're investing!" },
  { a: 38.9, b: 41.3, who: "সাংবাদিক · Journalist", voice: { pitch: 1.2, babble: 250 }, bn: "আপনার সাফল্যের রহস্য কী?", en: "What's the secret of your success?" },
  { a: 41.4, b: 44.3, who: "পুলক · Pulok", voice: VP, bn: "একটা আইডিয়া, আর সঠিক জায়গা — আমার জায়গা ছিল সোনারহরিণ।", en: "One idea, and the right place. Mine was Sonarhorin." },
  { a: 44.4, b: 45.9, who: "মা · Mother", voice: VM, bn: "আমার ছেলে!", en: "That's my son!" },
  { a: 46.0, b: 48.1, bn: "তোমার আইডিয়াও উড়তে পারে।", en: "Your idea can fly too." },
];
const L = (i) => LINES[i];
const talk = (t, i) => t > L(i).a + 0.15 && t < L(i).b - 0.25;
const CHEEK = { L: [[-80, -330], [-84, -240]], R: [[100, -380], [52, -462]] };
const WRITE = { L: [[-80, -360], [-40, -300]], R: [[90, -360], [40, -300]] };

function Defs() {
  return (
    <defs>
      <linearGradient id="st-room" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#262C47" /><stop offset="1" stopColor="#3A4266" /></linearGradient>
      <linearGradient id="st-app" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1B1446" /><stop offset="1" stopColor="#3B1E52" /></linearGradient>
      <radialGradient id="st-lamp"><stop offset="0" stopColor="#FFE7A6" stopOpacity=".75" /><stop offset="1" stopColor="#FFE7A6" stopOpacity="0" /></radialGradient>
      <radialGradient id="st-spot" cx=".5" cy="0" r="1"><stop offset="0" stopColor="#FFF6D8" stopOpacity=".55" /><stop offset="1" stopColor="#FFF6D8" stopOpacity="0" /></radialGradient>
      <radialGradient id="st-bulb"><stop offset="0" stopColor="#FFE27A" stopOpacity=".9" /><stop offset="1" stopColor="#FFE27A" stopOpacity="0" /></radialGradient>
      <linearGradient id="st-lantern" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF2B8" /><stop offset="1" stopColor="#FF8C3C" /></linearGradient>
      <clipPath id="st-scr"><rect x="0" y="0" width="348" height="740" rx="34" /></clipPath>
      <clipPath id="st-bust"><circle cx="300" cy="450" r="165" /></clipPath>
    </defs>
  );
}

function Lantern({ x, y, s = 1, t }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r="60" fill="url(#st-bulb)" opacity={0.5 + Math.sin(t * 9) * 0.1} />
      <path d="M -18 -28 Q 0 -36 18 -28 L 13 24 Q 0 28 -13 24 Z" fill="url(#st-lantern)" />
      <ellipse cy="28" rx="3" ry="5" fill="#FFFBE0" />
    </g>
  );
}

function Title({ t }) {
  const k = ease(prog(t, 0.1, 0.9));
  return (
    <g>
      <rect width="1600" height="900" fill="#05081A" />
      {[...Array(50)].map((_, i) => <circle key={i} cx={(i * 211) % 1600} cy={(i * 97) % 900} r="1.4" fill="#fff" opacity={0.2 + 0.3 * Math.sin(t * 2 + i)} />)}
      <Lantern x={800} y={760 - t * 90} s={1.6} t={t} />
      <g opacity={k} transform={`translate(0 ${(1 - k) * 20})`}>
        <DeerMark x={800} y={260} s={2.4} />
        <text x="800" y="340" textAnchor="middle" fontSize="26" fill="#FFC23D" fontFamily={BN} fontWeight="600">সোনারহরিণ নিবেদন করছে</text>
        <text x="800" y="450" textAnchor="middle" fontSize="76" fill="#fff" fontFamily={BN} fontWeight="700">একটা আইডিয়ার গল্প</text>
        <text x="800" y="510" textAnchor="middle" fontSize="28" fill="#9aa093" fontFamily={EN}>The story of an idea</text>
      </g>
    </g>
  );
}

function Room({ t, bulb = 0, dim = 0 }) {
  return (
    <g>
      <rect width="1600" height="900" fill="url(#st-room)" />
      <rect x="1180" y="110" width="260" height="230" rx="6" fill="#0B1030" stroke="#5a4a3a" strokeWidth="10" />
      {[...Array(12)].map((_, i) => <circle key={i} cx={1200 + (i * 53) % 230} cy={130 + (i * 37) % 190} r="1.6" fill="#fff" opacity={0.4 + 0.4 * Math.sin(t * 2 + i)} />)}
      <circle cx="1390" cy="160" r="22" fill="#FFF3C9" /><circle cx="1400" cy="154" r="20" fill="#0B1030" />
      <g transform="rotate(-4 300 200)">
        <rect x="200" y="120" width="210" height="150" fill="#F2C14E" />
        <text x="305" y="185" textAnchor="middle" fontSize="44" fill="#0E0F0C" fontFamily={HAND}>CEO 2030</text>
        <text x="305" y="236" textAnchor="middle" fontSize="40">🚀</text>
      </g>
      <rect x="120" y="330" width="160" height="300" fill="#4a3a2a" />
      {[360, 430, 500, 570].map((y, i) => <g key={y}>{[0, 1, 2, 3, 4].map((k) => <rect key={k} x={132 + k * 28} y={y} width="22" height="58" fill={["#E5484D", "#2D6CDF", "#F2C14E", "#6B4EFF", "#B9A6FF"][(k + i) % 5]} />)}</g>)}
      <rect y="760" width="1600" height="140" fill="#2a2f45" />
      <circle cx="1040" cy="430" r={220 * (1 - dim * 0.5)} fill="url(#st-lamp)" />
      {bulb > 0 && <circle cx="800" cy="200" r="260" fill="url(#st-bulb)" opacity={bulb * 0.5} />}
    </g>
  );
}

function Desk({ notebook = false }) {
  return (
    <g>
      <rect x="380" y="600" width="820" height="30" rx="6" fill="#8B5A2B" />
      <rect x="410" y="630" width="20" height="140" fill="#6f461f" /><rect x="1150" y="630" width="20" height="140" fill="#6f461f" />
      <path d="M 1040 600 L 1060 470 L 1010 420" stroke="#333" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M 970 410 L 1060 390 L 1050 440 Z" fill="#2D6CDF" />
      {[[480, "#E5484D", "হিসাববিজ্ঞান"], [480, "#2D6CDF", "ইংরেজি ২য় পত্র"], [480, "#6B4EFF", "অর্থনীতি"]].map(([x, c, l], i) => (
        <g key={l}><rect x={x - 70 + i * 6} y={566 - i * 30} width="160" height="30" rx="4" fill={c} />
          <text x={x + 10 + i * 6} y={587 - i * 30} textAnchor="middle" fontSize="15" fontWeight="700" fill="#fff" fontFamily={BN}>{l}</text></g>
      ))}
      {notebook && <g><rect x="700" y="560" width="200" height="44" rx="4" fill="#FDFCF7" stroke="#bbb" strokeWidth="2" /></g>}
      <rect x="1100" y="560" width="40" height="40" rx="6" fill="#fff" opacity=".85" />
    </g>
  );
}

function Thought({ t, a, b, children, x = 1120, y = 300, w = 520, h = 340 }) {
  if (t < a || t > b) return null;
  const k = ease(prog(t, a, a + 0.5)) * clamp((b - t) / 0.3);
  return (
    <g opacity={k} transform={`translate(${x} ${y}) scale(${0.7 + 0.3 * k}) translate(${-x} ${-y})`}>
      {[[x - 300, y + 230, 14], [x - 260, y + 190, 22], [x - 215, y + 140, 32]].map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} fill="#fff" opacity=".95" />)}
      <ellipse cx={x} cy={y} rx={w / 2} ry={h / 2} fill="#fff" />
      {[[-0.4, -0.38], [0, -0.48], [0.4, -0.38], [0.48, 0], [0.4, 0.38], [0, 0.48], [-0.4, 0.38], [-0.48, 0]].map(([dx, dy], i) => (
        <circle key={i} cx={x + dx * w} cy={y + dy * h} r={h * 0.26} fill="#fff" />
      ))}
      {children}
    </g>
  );
}

function DeskScene({ t }) {
  const u = t - SC.desk[0];
  const spin = t * 600;
  const momIn = t > 7.5 && t < 9.9;
  return (
    <g>
      <Room t={t} />
      {/* door + mother */}
      <rect x="0" y="230" width="90" height="530" fill="#5a4030" />
      <g opacity={momIn ? 1 : 0}><Person x={150} y={800} s={0.7} p={MA} tt={t} arms="hips" talk={talk(t, 3)} mood="angry" lookX={8} /></g>
      <rect x="70" y="230" width="30" height="530" fill="#6f4e38" />
      <rect x="712" y="470" width="136" height="200" rx="14" fill="#2b2f4a" /><rect x="724" y="482" width="112" height="180" rx="10" fill="#3a3f63" />
      <Person x={780} y={790} s={0.7} p={PULOK} tt={t} sit arms={u < 2.8 ? CHEEK : t > 9.7 ? "shake" : "down"} talk={talk(t, 2) || talk(t, 4)}
        mood={t > 7.7 && t < 9.7 ? "surprised" : u < 2.8 ? "neutral" : "happy"} lookX={momIn ? -10 : 0} headDy={u < 2.8 ? 6 : 0} />
      {u < 2.8 && <line x1={842} y1={510} x2={842 + Math.cos((spin * Math.PI) / 180) * 26} y2={510 + Math.sin((spin * Math.PI) / 180) * 26} stroke="#E8B634" strokeWidth="6" strokeLinecap="round" />}
      <Desk />
      <Thought t={t} a={3.6} b={9.5}>
        <g opacity={ease(prog(t, 4.0, 4.4))}>
          <rect x="910" y="200" width="110" height="230" fill="#2D3561" />
          {[...Array(12)].map((_, i) => <rect key={i} x={922 + (i % 3) * 32} y={240 + Math.floor(i / 3) * 44} width="20" height="26" fill="#FFE27A" />)}
          <rect x="902" y="176" width="126" height="28" fill="#E8B634" />
          <text x="965" y="196" textAnchor="middle" fontSize="15" fontWeight="800" fill="#0E0F0C" fontFamily={EN}>PULOK GROUP</text>
        </g>
        <g opacity={ease(prog(t, 4.8, 5.2))} transform="translate(1070 360)">
          <path d="M 0 40 L 20 10 L 90 6 L 120 40 Z" fill="#E5484D" /><rect x="-10" y="38" width="140" height="28" rx="10" fill="#E5484D" />
          <circle cx="20" cy="70" r="14" fill="#222" /><circle cx="104" cy="70" r="14" fill="#222" />
        </g>
        <g opacity={ease(prog(t, 5.6, 6.0))} transform="translate(1230 190) rotate(6)">
          <rect width="120" height="160" fill="#fff" stroke="#0E0F0C" strokeWidth="3" />
          <rect width="120" height="34" fill="#4B2FD6" />
          <text x="60" y="24" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff" fontFamily={EN}>BUSINESS BD</text>
          <circle cx="60" cy="82" r="28" fill={PULOK.skin} /><path d="M 34 76 Q 32 50 60 50 Q 88 50 86 76 Q 70 62 34 76 Z" fill="#1b1410" />
          <text x="60" y="140" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0E0F0C" fontFamily={BN}>তরুণ উদ্যোক্তা পুলক</text>
        </g>
      </Thought>
      <Bubble t={t} a={5.1} b={7.6} x={560} y={330} w={470} lines={["একদিন আমি বড়", "বিজনেসম্যান হব!"]} tx={720} ty={400} />
      <Bubble t={t} a={7.7} b={9.6} x={330} y={300} w={460} lines={["পুলক! বই খোল,", "স্বপ্ন পরে দেখিস!"]} tx={170} ty={380} angry />
      <Bubble t={t} a={9.7} b={11.3} x={760} y={300} w={480} lines={["আম্মু, এটাও তো পড়া —", "বিজনেস স্টাডিজ! 😅"]} tx={780} ty={400} fs={30} />
    </g>
  );
}

function IdeaScene({ t }) {
  const on = t > 11.8;
  const doubt = t > 14.1;
  const bulb = on ? (doubt ? 0.35 : 1) * (t < 12 ? (Math.sin(t * 80) > 0 ? 1 : 0.2) : 1) : 0;
  const z = 1 + 0.08 * ease(prog(t, 11.5, 12.5));
  const notes = [["আইডিয়া 💡", 12.2], ["কৃষক → রেস্টুরেন্ট", 12.8], ["দালাল ✗  দাম ✓", 13.4]];
  return (
    <g transform={`translate(800 450) scale(${z}) translate(-800 -450)`}>
      <Room t={t} bulb={bulb} dim={doubt ? 0.6 : 0} />
      <rect x="712" y="470" width="136" height="200" rx="14" fill="#2b2f4a" /><rect x="724" y="482" width="112" height="180" rx="10" fill="#3a3f63" />
      <Person x={780} y={790} s={0.7} p={PULOK} tt={t} sit arms={doubt ? "head" : on && t < 14 ? "fist" : WRITE} talk={talk(t, 5) || talk(t, 6)} mood={doubt ? "sad" : "surprised"} />
      <Desk notebook />
      {/* bulb */}
      <g transform="translate(780 230)" opacity={on ? 1 : 0}>
        {!doubt && [...Array(8)].map((_, i) => <line key={i} x1={Math.cos((i * Math.PI) / 4) * 60} y1={Math.sin((i * Math.PI) / 4) * 60} x2={Math.cos((i * Math.PI) / 4) * 84} y2={Math.sin((i * Math.PI) / 4) * 84} stroke="#FFE27A" strokeWidth="6" strokeLinecap="round" opacity={bulb} />)}
        <circle r="40" fill={doubt ? "#8a8a70" : "#FFE27A"} opacity={0.6 + 0.4 * bulb} />
        <rect x="-16" y="36" width="32" height="24" rx="4" fill="#999" />
      </g>
      {/* notebook writing, big */}
      <g transform="translate(1060 330) rotate(-3)">
        <rect width="420" height="250" rx="10" fill="#FDFCF7" stroke="#0E0F0C" strokeWidth="4" />
        {[60, 110, 160, 210].map((y) => <line key={y} x1="20" x2="400" y1={y} y2={y} stroke="#cfe0f5" strokeWidth="2" />)}
        {notes.map(([txt, at], i) => (
          <text key={txt} x="30" y={52 + i * 62} fontSize="40" fill={i === 2 ? "#6B4EFF" : "#0E0F0C"} fontFamily={HAND}
            style={{ clipPath: `inset(0 ${100 - clamp((t - at) / 0.6) * 100}% 0 0)` }}>{txt}</text>
        ))}
      </g>
      {doubt && ["টাকা কই?", "কে বিশ্বাস করবে?", "“চাকরি কর!”"].map((w, i) => {
        const k = ease(prog(t, 14.2 + i * 0.5, 14.6 + i * 0.5));
        return (
          <g key={w} opacity={k} transform={`translate(${[300, 560, 380][i]} ${[200, 140, 330][i] + Math.sin(t * 2 + i) * 8})`}>
            <ellipse rx="150" ry="52" fill="#4a4f66" /><ellipse cx="-70" cy="-20" rx="70" ry="44" fill="#4a4f66" /><ellipse cx="60" cy="-26" rx="80" ry="46" fill="#4a4f66" />
            <text y="12" textAnchor="middle" fontSize="34" fontWeight="700" fill="#fff" fontFamily={BN}>{w}</text>
          </g>
        );
      })}
      <Bubble t={t} a={11.9} b={14.0} x={560} y={430} w={470} lines={["পাইছি! কৃষকের সবজি", "সরাসরি রেস্টুরেন্টে!"]} tx={700} ty={470} />
    </g>
  );
}

function HearScene({ t }) {
  const stand = t > 19.7;
  const ring = t > 17 && t < 17.4 ? Math.sin(t * 90) * 3 : 0;
  return (
    <g>
      <Room t={t} />
      {!stand && <g><rect x="712" y="470" width="136" height="200" rx="14" fill="#2b2f4a" /><rect x="724" y="482" width="112" height="180" rx="10" fill="#3a3f63" /></g>}
      <Person x={780} y={stand ? 830 : 790} s={0.7} p={PULOK} tt={t} sit={!stand} arms="phone" hold="phone" glow={1} talk={talk(t, 8)} mood={stand ? "surprised" : "neutral"} />
      {!stand && <Desk />}
      <g transform={`translate(${1150 + ring} 360) rotate(-4)`}>
        <rect x="-150" y="-230" width="300" height="460" rx="36" fill="#0E0F0C" />
        <rect x="-134" y="-210" width="268" height="420" rx="24" fill="#1B1446" />
        <Lantern x={0} y={-90} s={1.2} t={t} />
        <text y="10" textAnchor="middle" fontSize="26" fontWeight="800" fill="#fff" fontFamily={BN}>সোনারহরিণ</text>
        <text y="44" textAnchor="middle" fontSize="20" fontWeight="700" fill="#FFE27A" fontFamily={EN}>Startup Fund</text>
        <text y="88" textAnchor="middle" fontSize="18" fill="#c9c6e8" fontFamily={BN}>আইডিয়া পিচ করো,</text>
        <text y="114" textAnchor="middle" fontSize="18" fill="#c9c6e8" fontFamily={BN}>ফান্ড পাও</text>
        <rect x="-90" y="140" width="180" height="44" rx="22" fill="#FFC23D" />
        <text y="169" textAnchor="middle" fontSize="18" fontWeight="800" fill="#0E0F0C" fontFamily={EN}>Pitch now →</text>
      </g>
      <Bubble t={t} a={17.4} b={19.6} x={1020} y={150} w={560} lines={["দোস্ত, সোনারহরিণ-এ স্টার্টআপ", "পিচ করা যায় — ফান্ডও দেয়!"]} tx={1120} ty={140} fs={30} />
      <Bubble t={t} a={19.7} b={21.8} x={620} y={320} w={420} lines={["সোনারহরিণ?!", "এখনই দেখি!"]} tx={760} ty={400} fs={38} />
    </g>
  );
}

const STEPS = [{ u: 0.8, bn: "পিচ বিল্ডার", en: "Problem · market · traction · ask" }, { u: 2.8, bn: "রেডিনেস স্কোর", en: "34 → 88 / 100" }, { u: 4.6, bn: "ডেক আপলোড", en: "deck.pdf · 12 slides" }, { u: 5.6, bn: "পিচ ডে", en: "Invited to pitch on stage" }];
function PScreen({ u }) {
  if (u < 1.2) {
    return (
      <g>
        <rect width="348" height="740" fill="#05081A" />
        <DeerMark x={174} y={150} s={2.2} />
        <text x="174" y="230" textAnchor="middle" fontSize="28" fontWeight="700" fill="#fff" fontFamily={BN}>সোনারহরিণ</text>
        {["💼 চাকরি", "🎓 ইন্টার্নশিপ", "🚀 স্টার্টআপ"].map((l, i) => (
          <g key={l}><rect x="44" y={320 + i * 76} width="260" height="58" rx="29" fill={i === 2 && u > 0.6 ? "#FFC23D" : "#25271f"} />
            <text x="174" y={357 + i * 76} textAnchor="middle" fontSize="24" fontWeight="700" fill={i === 2 && u > 0.6 ? "#0E0F0C" : "#fff"} fontFamily={BN}>{l}</text></g>
        ))}
      </g>
    );
  }
  if (u < 5.6) {
    const score = Math.round(lerp(34, 88, ease(prog(u, 1.6, 4.4))));
    const fields = [["Problem", 1.6], ["Solution", 2.1], ["Market size", 2.6], ["Traction", 3.1], ["The ask", 3.6], ["deck.pdf", 4.6]];
    const C = 2 * Math.PI * 54;
    return (
      <g>
        <rect width="348" height="740" fill="#F6F5F0" />
        <text x="24" y="76" fontSize="24" fontWeight="700" fill="#0E0F0C" fontFamily={EN}>KrishiBondhu</text>
        <text x="24" y="102" fontSize="14" fill="#6B6F66" fontFamily={EN}>Pitch builder · AgriTech</text>
        <g transform="translate(174 210)">
          <circle r="54" fill="none" stroke="#E2E0D8" strokeWidth="14" />
          <circle r="54" fill="none" stroke={score > 70 ? "#6B4EFF" : "#E8B634"} strokeWidth="14" strokeDasharray={`${(score / 100) * C} ${C}`} transform="rotate(-90)" strokeLinecap="round" />
          <text y="12" textAnchor="middle" fontSize="38" fontWeight="800" fill="#0E0F0C" fontFamily={EN}>{score}</text>
        </g>
        <text x="174" y="300" textAnchor="middle" fontSize="15" fontWeight="700" fill="#6B6F66" fontFamily={EN}>Pitch readiness</text>
        {fields.map(([f, at], i) => {
          const ok = u > at;
          return <g key={f} transform={`translate(24 ${330 + i * 62})`}>
            <rect width="300" height="50" rx="12" fill="#fff" stroke={ok ? "#6B4EFF" : "#E2E0D8"} strokeWidth="2" />
            <text x="18" y="32" fontSize="17" fontWeight="600" fill="#0E0F0C" fontFamily={EN}>{f}</text>
            <circle cx="272" cy="25" r="13" fill={ok ? "#FFC23D" : "#EFEDE6"} />
            {ok && <path d="M 265 25 l 5 5 l 9 -10" stroke="#0E0F0C" strokeWidth="3" fill="none" strokeLinecap="round" />}
          </g>;
        })}
      </g>
    );
  }
  const k = ease(prog(u, 5.6, 6.0));
  return (
    <g>
      <rect width="348" height="740" fill="#1B1446" />
      {[...Array(14)].map((_, i) => <circle key={i} cx={(i * 71) % 348} cy={(i * 53) % 740} r="1.5" fill="#fff" opacity=".5" />)}
      <g opacity={k} transform={`translate(174 ${330 - k * 20})`}>
        <Lantern x={0} y={-120} s={1.5} t={u} />
        <text y="10" textAnchor="middle" fontSize="40">🎉</text>
        <text y="70" textAnchor="middle" fontSize="28" fontWeight="800" fill="#fff" fontFamily={EN}>Pitch Day invite</text>
        <text y="104" textAnchor="middle" fontSize="18" fill="#FFE27A" fontFamily={BN}>শুক্রবার · সন্ধ্যা ৬টা</text>
      </g>
    </g>
  );
}
function AppScene({ t }) {
  const u = t - SC.app[0];
  const intro = ease(prog(u, 0, 0.5));
  return (
    <g>
      <rect width="1600" height="900" fill="url(#st-app)" />
      {[...Array(30)].map((_, i) => <circle key={i} cx={(i * 211) % 1600} cy={(i * 97) % 900} r="1.5" fill="#fff" opacity={0.25 + 0.25 * Math.sin(t * 2 + i)} />)}
      <Lantern x={1480} y={760 - (t - 22) * 40} s={1} t={t} /><Lantern x={140} y={820 - (t - 22) * 30} s={0.8} t={t + 1} />
      <g opacity={intro}>
        <circle cx="300" cy="450" r="171" fill="#fff" stroke="#0E0F0C" strokeWidth="6" />
        <g clipPath="url(#st-bust)"><rect x="130" y="280" width="340" height="340" fill="#E9E3FF" /><Person x={300} y={935} p={PULOK} tt={t} mood={u > 2.8 ? "happy" : "neutral"} /></g>
        <rect x="200" y="640" width="200" height="40" rx="20" fill="#0E0F0C" />
        <text x="300" y="667" textAnchor="middle" fontSize="18" fontWeight="700" fill="#fff" fontFamily={EN}>Pulok · founder</text>
      </g>
      <g transform={`translate(800 450) scale(${lerp(1.4, 1, intro)}) translate(-800 -450)`}>
        <rect x="604" y="54" width="392" height="792" rx="56" fill="#0E0F0C" />
        <rect x="610" y="60" width="380" height="780" rx="50" fill="#1c1d20" />
        <g transform="translate(626 80)"><g clipPath="url(#st-scr)"><PScreen u={u} /></g></g>
        <rect x="750" y="68" width="100" height="22" rx="11" fill="#0E0F0C" />
      </g>
      {STEPS.map((f, i) => {
        const k = ease(prog(u, f.u, f.u + 0.35));
        if (k <= 0) return null;
        const y = 230 + i * 120;
        return <g key={f.en} opacity={k} transform={`translate(${(1 - k) * 40} 0)`}>
          <circle cx="1090" cy={y} r="26" fill="#FFC23D" stroke="#0E0F0C" strokeWidth="3" />
          <path d={`M 1078 ${y} l 8 9 l 16 -18`} stroke="#0E0F0C" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <text x="1136" y={y + 4} fontSize="34" fontWeight="700" fill="#fff" fontFamily={BN}>{f.bn}</text>
          <text x="1136" y={y + 34} fontSize="19" fill="#c9c6e8" fontFamily={EN}>{f.en}</text>
        </g>;
      })}
    </g>
  );
}

function PitchScene({ t }) {
  const slide = t < 33.5 ? 0 : t < 35.7 ? 1 : 2;
  const stamp = t > 37.0 ? ease(prog(t, 37.0, 37.25)) : 0;
  return (
    <g>
      <rect width="1600" height="900" fill="#0d0f1c" />
      {[...Array(9)].map((_, i) => <rect key={i} x={i * 180} y="700" width="160" height="40" rx="12" fill="#1a1d30" />)}
      <rect x="50" y="60" width="760" height="430" rx="10" fill="#0E0F0C" stroke="#333" strokeWidth="6" />
      <g transform="translate(70 80)">
        <rect width="720" height="390" fill={slide === 2 ? "#F6F5F0" : slide === 1 ? "#4B2FD6" : "#1B1446"} />
        {slide === 0 && <g>
          <text x="360" y="170" textAnchor="middle" fontSize="70" fontWeight="800" fill="#fff" fontFamily={BN}>কৃষকবন্ধু</text>
          <text x="360" y="230" textAnchor="middle" fontSize="30" fill="#FFC23D" fontFamily={EN}>Farm → restaurant, no middlemen</text>
        </g>}
        {slide === 1 && <g>
          <text x="40" y="70" fontSize="34" fontWeight="700" fill="#fff" fontFamily={EN}>What the farmer earns per kg</text>
          {[["Today", 18, "#E5484D"], ["With us", 40, "#FFC23D"]].map(([l, v, c], i) => {
            const w = 520 * (v / 60) * ease(prog(t, 33.6 + i * 0.3, 34.3 + i * 0.3));
            return <g key={l} transform={`translate(40 ${130 + i * 110})`}><text y="-10" fontSize="24" fill="#fff" fontFamily={EN}>{l}</text>
              <rect y="0" width={w} height="56" rx="10" fill={c} /><text x={w + 14} y="40" fontSize="34" fontWeight="800" fill="#fff" fontFamily={EN}>৳{v}</text></g>;
          })}
        </g>}
        {slide === 2 && <g>
          <text x="40" y="70" fontSize="34" fontWeight="700" fill="#0E0F0C" fontFamily={EN}>Traction · 6 weeks</text>
          <path d={`M 60 330 ${[...Array(7)].map((_, i) => `L ${60 + i * 100} ${330 - Math.pow(i / 6, 1.7) * 210 * ease(prog(t, 35.8, 36.6))}`).join(" ")}`} stroke="#6B4EFF" strokeWidth="8" fill="none" strokeLinejoin="round" />
          <text x="600" y="110" textAnchor="end" fontSize="54" fontWeight="800" fill="#6B4EFF" fontFamily={EN}>210 orders</text>
        </g>}
        {stamp > 0 && <g transform={`translate(360 200) rotate(-12) scale(${lerp(2.4, 1, stamp)})`} opacity={stamp}>
          <rect x="-250" y="-70" width="500" height="140" rx="16" fill="#ffffffcc" stroke="#E5484D" strokeWidth="10" />
          <text y="-6" textAnchor="middle" fontSize="64" fontWeight="900" fill="#E5484D" fontFamily={EN}>FUNDED</text>
          <text y="48" textAnchor="middle" fontSize="38" fontWeight="800" fill="#E5484D" fontFamily={BN}>৳১০ লাখ</text>
        </g>}
      </g>
      <path d="M 820 0 L 700 830 L 1060 830 L 940 0 Z" fill="url(#st-spot)" />
      <Person x={880} y={830} s={0.72} p={PULOK_SUIT} tt={t} arms={talk(t, 12) || talk(t, 14) ? "point" : t > 37 ? "cheer" : "down"} talk={talk(t, 12) || talk(t, 14)} mood="happy" lookX={8} />
      {/* judges */}
      <Person x={1060} y={800} s={0.62} p={J1} tt={t} sit talk={talk(t, 13)} mood={t > 37 ? "happy" : "neutral"} lookX={-8} />
      <Person x={1240} y={800} s={0.62} p={J2} tt={t + 1} sit talk={talk(t, 15)} arms={t > 37 ? "cheer" : "down"} mood={t > 37 ? "happy" : "neutral"} lookX={-8} />
      <Person x={1420} y={800} s={0.62} p={J3} tt={t + 2} sit mood={t > 36 ? "happy" : "neutral"} lookX={-8} />
      <rect x="960" y="610" width="580" height="200" fill="#1E2A44" />
      <rect x="960" y="600" width="580" height="16" fill="#E8B634" />
      <text x="1250" y="700" textAnchor="middle" fontSize="30" fontWeight="800" fill="#E8B634" fontFamily={EN} letterSpacing="6">JUDGES</text>
      <Bubble t={t} a={30.9} b={33.4} x={900} y={330} w={560} lines={["কৃষক পায় ১৮, রেস্টুরেন্ট দেয় ৬০ —", "আমরা দালাল সরাই।"]} tx={880} ty={420} fs={28} />
      <Bubble t={t} a={33.5} b={35.6} x={1240} y={340} w={330} lines={["ট্র্যাকশন আছে?"]} tx={1080} ty={460} />
      <Bubble t={t} a={35.7} b={36.9} x={900} y={340} w={420} lines={["৬ সপ্তাহে ২১০টা অর্ডার!"]} tx={880} ty={420} />
      <Bubble t={t} a={37.0} b={38.4} x={1240} y={360} w={400} lines={["আমরা ইনভেস্ট করছি!"]} tx={1240} ty={470} />
    </g>
  );
}

const TICKER = "ব্রেকিং: পড়ায় মন না বসা ছেলেটাই এখন তরুণ উদ্যোক্তা — পুলকের সাফল্যের গল্প  ·  সোনারহরিণ Startup Fund থেকে ফান্ড পেল কৃষকবন্ধু  ·  ";
function PressScene({ t }) {
  const flash = [39.2, 39.9, 40.6, 41.1, 42.0, 42.9, 43.4, 44.6, 45.3, 46.2].some((f) => t > f && t < f + 0.09);
  return (
    <g>
      <rect width="1600" height="900" fill="#0F2A4A" />
      {[...Array(5)].map((_, r) => [...Array(7)].map((_, c) => (
        <g key={`${r}${c}`} opacity=".14" transform={`translate(${120 + c * 230 + (r % 2) * 110} ${80 + r * 120})`}><DeerMark x={0} y={0} s={1.3} /></g>
      )))}
      <rect x="360" y="120" width="880" height="96" rx="12" fill="#E8B634" />
      <text x="800" y="182" textAnchor="middle" fontSize="44" fontWeight="800" fill="#0E0F0C" fontFamily={BN}>সোনারহরিণ Startup Fund · সাফল্যের গল্প</text>
      <Person x={800} y={760} s={0.72} p={PULOK_SUIT} tt={t} sit talk={talk(t, 17)} mood="happy" arms={talk(t, 17) ? "shake" : "down"} />
      <rect x="430" y="560" width="740" height="40" rx="6" fill="#fff" />
      <rect x="440" y="598" width="720" height="200" fill="#16365C" />
      {[620, 720, 880, 980].map((x, i) => <g key={x}><rect x={x - 5} y={500} width="10" height="62" fill="#222" /><circle cx={x} cy={494} r="16" fill="#333" /><rect x={x - 16} y={506} width="32" height="14" rx="3" fill={["#E5484D", "#2D6CDF", "#F2C14E", "#6B4EFF"][i]} /></g>)}
      <path d="M 660 562 L 676 504 L 924 504 L 940 562 Z" fill="#fff" stroke="#d8d6cf" strokeWidth="2" />
      <text x="800" y="530" textAnchor="middle" fontSize="22" fontWeight="800" fill="#0E0F0C" fontFamily={EN}>PULOK</text>
      <text x="800" y="551" textAnchor="middle" fontSize="15" fill="#6B6F66" fontFamily={EN}>Founder, KrishiBondhu</text>
      {/* mother in the audience */}
      <Person x={1440} y={900} s={0.62} p={MA} tt={t} arms={t > 44.4 ? "cheer" : "down"} talk={talk(t, 18)} mood="happy" lookX={-8} />
      {/* journalists, seen from behind */}
      {PRESS.map((p, i) => (
        <g key={i}>
          <Person x={180 + i * 290} y={1080} s={0.78} p={p} tt={t + i} back arms={i % 2 ? "phone" : "down"} />
          {i % 2 === 0 && <g transform={`translate(${180 + i * 290} ${640 + Math.sin(t * 3 + i) * 4})`}>
            <rect x="-46" y="-30" width="92" height="60" rx="8" fill="#1b1c20" /><circle r="20" fill="#3a3d45" stroke="#888" strokeWidth="3" /><rect x="-30" y="-44" width="30" height="16" rx="3" fill="#1b1c20" />
          </g>}
        </g>
      ))}
      {flash && <rect width="1600" height="900" fill="#fff" opacity=".55" />}
      <g transform="translate(0 836)">
        <rect width="1600" height="64" fill="#B4232A" />
        <rect width="170" height="64" fill="#0E0F0C" />
        <text x="85" y="42" textAnchor="middle" fontSize="26" fontWeight="800" fill="#fff" fontFamily={BN}>ব্রেকিং</text>
        <text x={1600 - ((t - 38.5) * 220) % 2600} y="42" fontSize="26" fontWeight="700" fill="#fff" fontFamily={BN}>{TICKER}{TICKER}</text>
      </g>
      <Bubble t={t} a={38.9} b={41.3} x={360} y={420} w={420} lines={["আপনার সাফল্যের", "রহস্য কী?"]} tx={460} ty={640} />
      <Bubble t={t} a={41.4} b={44.3} x={800} y={300} w={560} lines={["একটা আইডিয়া, আর সঠিক জায়গা —", "আমার জায়গা ছিল সোনারহরিণ।"]} tx={800} ty={360} fs={30} />
      <Bubble t={t} a={44.4} b={45.9} x={1300} y={480} w={300} lines={["আমার ছেলে! 🥹"]} tx={1430} ty={540} />
      <g opacity={ease(prog(t, 45.9, 46.5))}><rect width="1600" height="900" fill="#0E0F0C" opacity=".55" /></g>
    </g>
  );
}

const Am = [220, 261.6, 329.6], F = [174.6, 220, 261.6], Dm = [146.8, 174.6, 220];
const C = [261.6, 329.6, 392], G = [196, 246.9, 293.7], F2 = [349.2, 440, 523.3];
const CUES = [
  [0.4, "pad", Am], [2.4, "pad", F], [5.0, "pad", C], [7.7, "sting"], [8.0, "pad", Dm], [9.8, "pad", F], [11.8, "ping"], [11.9, "pad", C], [14.1, "pad", Am], [14.2, "sting"],
  [17.0, "ring"], [17.2, "pad", G], [19.7, "ping"], [19.8, "pad", C], [22.2, "whoosh"], [22.6, "tap"], [23.6, "pad", G], [25.0, "tap"], [26.0, "pad", C], [27.1, "success"],
  [27.3, "pad", F2], [30.6, "pad", Am], [33.5, "pad", F], [35.7, "pad", G], [37.0, "stamp"], [37.1, "cheer"], [37.3, "pad", C], [38.6, "pad", F2],
  [39.2, "shutter"], [40.6, "shutter"], [42.0, "shutter"], [43.4, "shutter"], [41.4, "pad", C], [44.4, "pad", F2], [46.0, "pad", C],
];

export const STARTUP = {
  id: "startup", DUR, Defs, lines: LINES, cues: CUES, endHold: 1.9, poster: 42.5,
  tab: "পুলকের গল্প · আইডিয়া থেকে ফান্ড", eyebrow: "পুলকের গল্প · 48 sec · voices on",
  headline: <>Couldn't sit through a book.<br /><em>Could pitch an idea.</em></>,
  aria: "Animated story: Pulok can't focus on his studies and dreams of being a businessman. He gets an idea, hears about Sonarhorin's startup fund, builds his pitch, pitches on stage, gets funded and tells his story to journalists.",
  chapters: [
    { t: 2.2, bn: "স্বপ্ন", en: "The dream" }, { t: 11.5, bn: "আইডিয়া", en: "The idea" }, { t: 17, bn: "সোনারহরিণ", en: "The app" },
    { t: 30.5, bn: "পিচ ডে", en: "Pitch day" }, { t: 38.5, bn: "সাংবাদিকদের সামনে", en: "The press" },
  ],
  scenes: [["title", Title, ...SC.title], ["desk", DeskScene, ...SC.desk], ["idea", IdeaScene, ...SC.idea], ["hear", HearScene, ...SC.hear],
    ["app", AppScene, ...SC.app], ["pitch", PitchScene, ...SC.pitch], ["press", PressScene, ...SC.press]],
  end: { bn: "তোমার আইডিয়াও উড়তে পারে।", en: "Your idea can fly too.", cta: ["/startup", "Pitch my idea →"] },
};
