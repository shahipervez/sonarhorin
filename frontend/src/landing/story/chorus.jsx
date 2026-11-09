// “চাকরি পাইছো?” — a 52-second film. Everyone around Shuvo asks the same question until he finds সোনারহরিণ.
// Every scene is a pure function of global time `t` (seconds).
import { Bubble, DeerMark, Person } from "./people";
import { clamp, ease, prog } from "./scenes";

const BN = "'Hind Siliguri', sans-serif";
const EN = "Inter, sans-serif";
const HAND = "'Galada', 'Hind Siliguri', cursive";
const lerp = (a, b, k) => a + (b - a) * k;
const S = 0.7;

// ---------------------------------------------------------------- cast
const SHUVO = { skin: "#B97A55", hair: "short", hairColor: "#1b1410", outfit: { type: "tee", color: "#3E6E9E", pants: "#2E3A4E" } };
const SHUVO_FORMAL = { ...SHUVO, outfit: { type: "formal", color: "#F4F7FB", tie: "#4B2FD6", pants: "#2B2D3A" } };
const CHA = { skin: "#8E5A3C", hair: "short", hairColor: "#222", mustache: "#222", gamcha: "#D94F4F", outfit: { type: "lungi", color: "#F2F0E6", lungi: "#2F6E5A" } };
const CHACHA = { skin: "#A86C48", hair: "cap", hairColor: "#bbb", beard: "#e8e8e8", outfit: { type: "panjabi", color: "#FFFFFF", pants: "#E9E4D4", button: "#C9A227" } };
const MAMA = { skin: "#9C6444", hair: "oldman", hairColor: "#777", mustache: "#555", glasses: true, outfit: { type: "panjabi", color: "#BFD4E6", pants: "#2E3A4E", button: "#fff" } };
const MA = { skin: "#C18A62", hair: "bun", hairColor: "#2a1d16", headcover: true, outfit: { type: "sari", color: "#7A2E8C", blouse: "#5A1F69", border: "#E8B634" } };
const BABA = { skin: "#A86C48", hair: "oldman", hairColor: "#8a8a8a", mustache: "#4a4a4a", glasses: true, outfit: { type: "panjabi", color: "#ECE6D6", pants: "#D8D0BE", button: "#C9A227" } };
const BON = { skin: "#C99068", hair: "long", hairColor: "#24160f", outfit: { type: "kurti", color: "#F08AB0", scarf: "#FFD3E2", pants: "#F3E9DC" } };
const AUNTY = { skin: "#C48C66", hair: "bun", hairColor: "#2a1d16", headcover: true, outfit: { type: "sari", color: "#B23A6F", blouse: "#8A2A55", border: "#F2C14E" } };
const RICK = { skin: "#7E4E32", hair: "short", hairColor: "#111", gamcha: "#E8B634", outfit: { type: "lungi", color: "#E7E3D3", lungi: "#6A4C93" } };
const RAKIB = { skin: "#A97452", hair: "short", hairColor: "#111", idcard: "#2D6CDF", outfit: { type: "formal", color: "#DCE8F7", tie: "#2D3561", pants: "#2B2D3A" } };
const MIM = { skin: "#C99068", hair: "long", hairColor: "#1d120c", idcard: "#6B4EFF", outfit: { type: "kurti", color: "#D9467A", scarf: "#FFC23D", pants: "#F3E9DC" } };

export const DUR = 52;
const SC = { title: [0, 2.2], tea: [2.2, 11], home: [11, 18.5], street: [18.5, 24], calls: [24, 30.5], friends: [30.5, 36], app: [36, 45], end: [45, DUR] };
const V = { chacha: { pitch: 0.7, babble: 120 }, mama: { pitch: 0.8, babble: 140 }, cha: { pitch: 0.9, babble: 160 }, shuvo: { pitch: 1, babble: 190 },
  ma: { pitch: 1.25, babble: 260 }, baba: { pitch: 0.75, babble: 130 }, bon: { pitch: 1.6, babble: 340 }, aunty: { pitch: 1.3, babble: 280 },
  rick: { pitch: 0.85, babble: 150 }, rakib: { pitch: 0.95, babble: 175 }, mim: { pitch: 1.3, babble: 290 }, all: { pitch: 1, babble: 220 } };

const LINES = [
  { a: 0.2, b: 2.1, bn: "সোনারহরিণ নিবেদন করছে — একটাই প্রশ্ন", en: "Sonarhorin presents — one single question" },
  { a: 2.6, b: 4.8, who: "চাচা · Uncle", voice: V.chacha, bn: "কী রে শুভ, চাকরি-বাকরি কিছু হইলো?", en: "So, Shuvo — any job yet?" },
  { a: 4.9, b: 7.0, who: "মামা · Uncle", voice: V.mama, bn: "আমার ভাতিজা তো ব্যাংকে ঢুইকা গেছে!", en: "My nephew already got into a bank!" },
  { a: 7.1, b: 9.0, who: "চা-ওয়ালা · Tea seller", voice: V.cha, bn: "মামা, আপনে চাকরি পাইছেন?", en: "Even the tea seller: “Got a job yet, mama?”" },
  { a: 9.1, b: 10.8, who: "শুভ · Shuvo", voice: V.shuvo, bn: "…এখনো না।", en: "…Not yet." },
  { a: 11.4, b: 13.4, who: "মা · Mother", voice: V.ma, bn: "খাওয়ার আগে বল — চাকরি পাইছো?", en: "Before you eat — got a job?" },
  { a: 13.5, b: 15.6, who: "বাবা · Father", voice: V.baba, bn: "পেপারে এত চাকরি, তোর একটাও হয় না?", en: "The paper is full of jobs — and not one for you?" },
  { a: 15.7, b: 18.2, who: "ছোট বোন · Sister", voice: V.bon, bn: "ভাইয়া, চাকরি পাইলে আমাকে ফোন কিনে দিবা?", en: "Bro, when you get a job, will you buy me a phone?" },
  { a: 18.9, b: 21.0, who: "আন্টি · Neighbour", voice: V.aunty, bn: "শুভ! চাকরি পাইছো বাবা?", en: "Shuvo! Got a job, dear?" },
  { a: 21.2, b: 23.8, who: "রিকশাওয়ালা · Rickshaw puller", voice: V.rick, bn: "মামা, চাকরি হইছে? হইলে ভাড়া বাড়ামু!", en: "Got a job, mama? Then the fare goes up!" },
  { a: 24.4, b: 25.9, who: "খালা · Aunt (phone)", voice: V.ma, bn: "হ্যালো শুভ? চাকরি পাইছো?", en: "Hello, Shuvo? Got a job?" },
  { a: 26.0, b: 27.4, who: "মামা · Uncle (phone)", voice: V.mama, bn: "চাকরি পাইছো?", en: "Got a job?" },
  { a: 27.5, b: 28.8, who: "ফুপু · Aunt (phone)", voice: V.aunty, bn: "চাকরি পাইছো??", en: "Got a job??" },
  { a: 28.9, b: 30.4, who: "সবাই · Everyone", voice: V.all, bn: "চাকরি পাইছো???", en: "GOT A JOB???" },
  { a: 30.9, b: 32.9, who: "রাকিব · Rakib", voice: V.rakib, bn: "দোস্ত, তুই এখনো চাকরি পাস নাই?", en: "Dude, you still don't have a job?" },
  { a: 33.0, b: 35.8, who: "মিম · Mim", voice: V.mim, bn: "সোনারহরিণ ট্রাই কর — শুধু ফ্রেশারদের জন্য। আমি ওখান থেকেই পাইছি!", en: "Try Sonarhorin — it's only for freshers. That's where I got mine!" },
  { a: 36.3, b: 38.3, bn: "রাতে, ফোনে — sonarhorin.com", en: "That night, on his phone — sonarhorin.com" },
  { a: 38.4, b: 40.9, bn: "০ বছরের অভিজ্ঞতা — এক ট্যাপে অ্যাপ্লাই", en: "Zero experience needed — apply in one tap" },
  { a: 41.0, b: 42.9, bn: "দুই সপ্তাহ পর — ইন্টারভিউ!", en: "Two weeks later — an interview!" },
  { a: 43.0, b: 44.9, bn: "অফার লেটার! 🎉", en: "Offer letter!" },
  { a: 45.3, b: 46.8, who: "সবাই · Everyone", voice: V.all, bn: "চাকরি পাইছো?", en: "Got a job?" },
  { a: 46.9, b: 48.6, who: "শুভ · Shuvo", voice: { pitch: 1.1, babble: 215 }, bn: "হ্যাঁ, পাইছি!!", en: "YES. I got it!!" },
  { a: 48.7, b: 50.3, who: "চা-ওয়ালা · Tea seller", voice: V.cha, bn: "আজকে চা ফ্রি!", en: "Tea's on the house today!" },
  { a: 50.4, b: 52.1, bn: "তোমার উত্তরটাও বদলাতে পারে।", en: "Your answer can change too." },
];
const L = (i) => LINES[i];
const talk = (t, i) => t > L(i).a + 0.15 && t < L(i).b - 0.25;
const head = (x, y, s = S, sit = false) => [x, y - (sit ? 435 : 505) * s];

const CUP_R = { L: [[-80, -330], [-84, -240]], R: [[96, -350], [58, -392]] };
const READ = { L: [[-96, -380], [-58, -470]], R: [[96, -380], [58, -470]] };

// ================================================================ defs
function Defs() {
  return (
    <defs>
      <linearGradient id="ch-dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2D3561" /><stop offset=".55" stopColor="#B55A72" /><stop offset="1" stopColor="#F3A26F" /></linearGradient>
      <linearGradient id="ch-noon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7CC4FF" /><stop offset="1" stopColor="#FFE7B8" /></linearGradient>
      <linearGradient id="ch-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0B1030" /><stop offset="1" stopColor="#2A2350" /></linearGradient>
      <linearGradient id="ch-app" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F1ECFF" /><stop offset="1" stopColor="#F6F5F0" /></linearGradient>
      <radialGradient id="ch-bulb"><stop offset="0" stopColor="#FFE7A6" stopOpacity=".85" /><stop offset="1" stopColor="#FFE7A6" stopOpacity="0" /></radialGradient>
      <radialGradient id="ch-alarm" cx=".5" cy=".5" r=".7"><stop offset="0" stopColor="#3a1030" /><stop offset="1" stopColor="#0E0F0C" /></radialGradient>
      <radialGradient id="ch-glow"><stop offset="0" stopColor="#FFC23D" stopOpacity=".7" /><stop offset="1" stopColor="#FFC23D" stopOpacity="0" /></radialGradient>
      <clipPath id="ch-scr"><rect x="0" y="0" width="348" height="740" rx="34" /></clipPath>
      <clipPath id="ch-bust"><circle cx="300" cy="450" r="165" /></clipPath>
    </defs>
  );
}

// ================================================================ 0. title
function Title({ t }) {
  const k = ease(prog(t, 0.1, 0.9)), q = ease(prog(t, 0.9, 1.5));
  return (
    <g>
      <rect width="1600" height="900" fill="#0E0F0C" />
      <g opacity={k} transform={`translate(0 ${(1 - k) * 20})`}>
        <DeerMark x={800} y={250} s={2.4} />
        <text x="800" y="330" textAnchor="middle" fontSize="26" fill="#FFC23D" fontFamily={BN} fontWeight="600">সোনারহরিণ নিবেদন করছে</text>
        <text x="800" y="430" textAnchor="middle" fontSize="70" fill="#fff" fontFamily={BN} fontWeight="700">একটাই প্রশ্ন…</text>
      </g>
      <g opacity={q} transform={`translate(800 560) rotate(${-4 + Math.sin(t * 20) * q * 1.5}) scale(${0.6 + 0.4 * q})`}>
        <text textAnchor="middle" fontSize="92" fill="#E5484D" fontFamily={HAND}>চাকরি পাইছো?</text>
      </g>
    </g>
  );
}

// ================================================================ tea stall (also the last scene)
function TeaStall({ t, late = false }) {
  const steam = (i) => `M ${1366 + i * 14} 440 q 10 -18 0 -36 q -10 -18 0 -36`;
  return (
    <g>
      <rect width="1600" height="900" fill="url(#ch-dusk)" />
      <g fill="#5A3F6B" opacity=".55">
        {[[0, 380, 160], [150, 330, 120], [260, 420, 140], [380, 300, 110], [480, 360, 160], [620, 310, 140], [760, 400, 130], [880, 280, 120]].map(([x, y, w], i) => <rect key={i} x={x} y={y} width={w} height={760 - y} />)}
      </g>
      {/* electric wires */}
      <path d="M 0 150 Q 400 230 820 160 T 1600 190" stroke="#1b1410" strokeWidth="3" fill="none" opacity=".6" />
      <path d="M 0 190 Q 500 260 900 200 T 1600 230" stroke="#1b1410" strokeWidth="2.5" fill="none" opacity=".5" />
      <rect y="760" width="1600" height="140" fill="#6B5A4A" />
      <rect y="760" width="1600" height="10" fill="#4f4236" />
      {/* bench */}
      <g fill="#5a3d22"><rect x="246" y="520" width="12" height="160" /><rect x="702" y="520" width="12" height="160" /><rect x="236" y="530" width="488" height="16" rx="4" /><rect x="236" y="566" width="488" height="12" rx="4" /></g>
      {/* stall */}
      <rect x="1000" y="262" width="440" height="300" fill="#5B3A22" />
      {[330, 400, 470].map((y) => <rect key={y} x="1010" y={y} width="420" height="8" fill="#3f2816" />)}
      {[[1030, 300, "#E5484D"], [1072, 300, "#F2C14E"], [1114, 300, "#2D6CDF"], [1300, 300, "#E5484D"], [1342, 300, "#FFC23D"], [1384, 300, "#F2C14E"],
        [1040, 370, "#FFB86B"], [1090, 370, "#E5484D"], [1330, 370, "#7CC4FF"], [1380, 370, "#FFB86B"], [1060, 440, "#F2C14E"], [1360, 440, "#E5484D"]].map(([x, y, c], i) => (
        <rect key={i} x={x} y={y} width="34" height="26" rx="3" fill={c} opacity=".9" />
      ))}
      <g fill="#E8B634">{[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M ${1388 + i * 9} 300 q -16 30 0 64 q 6 -30 0 -64 Z`} />)}</g>
      <path d="M 1405 270 L 1405 300" stroke="#3f2816" strokeWidth="4" />
      <path d="M 950 262 L 1490 262 L 1462 205 L 978 205 Z" fill="#6E7B8B" />
      {[1000, 1060, 1120, 1180, 1240, 1300, 1360, 1420].map((x) => <path key={x} d={`M ${x} 208 L ${x - 8} 260`} stroke="#5a6676" strokeWidth="3" />)}
      <rect x="1056" y="140" width="330" height="64" rx="8" fill="#F2C14E" stroke="#B88A10" strokeWidth="4" />
      <text x="1221" y="183" textAnchor="middle" fontSize="34" fontWeight="700" fill="#B4232A" fontFamily={BN}>মামা টি স্টল ☕</text>
      <circle cx="1130" cy="300" r="190" fill="url(#ch-bulb)" opacity={0.75 + Math.sin(t * 9) * 0.05} />
      <path d="M 1130 262 L 1130 285" stroke="#222" strokeWidth="3" />
      <circle cx="1130" cy="296" r="13" fill="#FFF3C4" />
      <rect x="990" y="548" width="460" height="20" fill="#A86F3A" />
      <rect x="1000" y="566" width="440" height="196" fill="#8B5A2B" />
      {[600, 640, 680, 720].map((y) => <rect key={y} x="1000" y={y} width="440" height="3" fill="#6f461f" />)}
      {[1040, 1100].map((x, i) => (
        <g key={x}><rect x={x - 22} y="486" width="44" height="62" rx="10" fill="#ffffff55" stroke="#ffffffaa" strokeWidth="2" />
          <rect x={x - 24} y="478" width="48" height="12" rx="4" fill={i ? "#E5484D" : "#2D6CDF"} />
          {[0, 1, 2, 3].map((k) => <circle key={k} cx={x - 10 + (k % 2) * 20} cy={505 + Math.floor(k / 2) * 20} r="8" fill={i ? "#C8873B" : "#F2C14E"} />)}</g>
      ))}
      <path d="M 1320 548 L 1330 500 L 1410 500 L 1420 548 Z" fill="#A0522D" />
      <path d="M 1340 500 Q 1340 456 1370 452 Q 1400 456 1400 500 Z" fill="#C9CDD2" stroke="#8d939a" strokeWidth="3" />
      <path d="M 1340 478 L 1314 462" stroke="#8d939a" strokeWidth="7" strokeLinecap="round" />
      {[0, 1].map((i) => <path key={i} d={steam(i)} stroke="#ffffff" strokeWidth="4" fill="none" opacity={0.25 + 0.25 * Math.sin(t * 3 + i * 2)} transform={`translate(0 ${-((t * 18 + i * 20) % 30)})`} />)}
      {late && <g>{[...Array(24)].map((_, i) => {
        const x = (i * 137) % 1600, y = ((t - 47) * 260 + i * 97) % 900;
        return <rect key={i} x={x} y={y} width="12" height="18" rx="2" fill={["#E8B634", "#FFC23D", "#FF8FB1", "#7CC4FF"][i % 4]} transform={`rotate(${(t * 220 + i * 40) % 360} ${x + 6} ${y + 9})`} />;
      })}</g>}
    </g>
  );
}

function TeaScene({ t }) {
  const walkK = ease(prog(t, 2.2, 3.9));
  const sx = lerp(-140, 830, walkK);
  const walking = t < 3.9;
  const hasCup = t > 8.2;
  const seller = t > 7.1 && t < 8.3 ? "reach" : "hips";
  return (
    <g>
      <TeaStall t={t} />
      <Person x={380} y={762} s={S} p={CHACHA} tt={t} sit hold="cup" arms={CUP_R} talk={talk(t, 1)} mood={talk(t, 1) ? "neutral" : "happy"} lookX={6} />
      <Person x={600} y={762} s={S} p={MAMA} tt={t + 1} sit hold="cup" arms={CUP_R} talk={talk(t, 2)} mood="happy" lookX={6} />
      <g><rect x="226" y="644" width="508" height="40" rx="6" fill="#7A5230" /><rect x="226" y="644" width="508" height="8" rx="4" fill="#94683f" />
        <rect x="250" y="684" width="16" height="78" fill="#5a3d22" /><rect x="694" y="684" width="16" height="78" fill="#5a3d22" /></g>
      <g transform="translate(2460 0) scale(-1 1)">
        <Person x={1230} y={760} s={S} p={CHA} tt={t + 2} arms={seller} hold={seller === "reach" ? "cup" : null} talk={talk(t, 3)} mood="happy" lookX={4} />
      </g>
      <rect x="1000" y="566" width="440" height="196" fill="#8B5A2B" />
      {[600, 640, 680, 720].map((y) => <rect key={y} x="1000" y={y} width="440" height="3" fill="#6f461f" />)}
      <rect x="990" y="548" width="460" height="20" fill="#A86F3A" />
      <Person x={sx} y={800} s={S} p={SHUVO} tt={t} walk={walking ? t * 9 : null} arms={hasCup ? CUP_R : "down"} hold={hasCup ? "cup" : null}
        talk={talk(t, 4)} mood={t > 4.8 ? "sad" : "neutral"} lookX={t > 6.8 ? 8 : -4} headDy={t > 9.1 ? 6 : 0} />
      <Bubble t={t} a={2.6} b={4.8} x={380} y={300} w={460} lines={["কী রে শুভ, চাকরি-বাকরি", "কিছু হইলো?"]} tx={head(380, 762, S, true)[0]} ty={head(380, 762, S, true)[1] - 60} />
      <Bubble t={t} a={4.9} b={7.0} x={560} y={300} w={460} lines={["আমার ভাতিজা তো", "ব্যাংকে ঢুইকা গেছে!"]} tx={600} ty={head(600, 762, S, true)[1] - 60} />
      <Bubble t={t} a={7.1} b={9.0} x={980} y={250} w={400} lines={["মামা, আপনে", "চাকরি পাইছেন?"]} tx={1180} ty={370} fs={32} />
      <Bubble t={t} a={9.1} b={10.8} x={840} y={330} w={230} lines={["…এখনো না।"]} tx={830} ty={400} />
    </g>
  );
}

// ================================================================ home dinner
function HomeScene({ t }) {
  const lower = ease(prog(t, 13.4, 13.9));
  const mix = (a, b) => [lerp(a[0], b[0], lower), lerp(a[1], b[1], lower)];
  const babaArms = { L: [mix(READ.L[0], [-80, -330]), mix(READ.L[1], [-70, -300])], R: [mix(READ.R[0], [80, -330]), mix(READ.R[1], [70, -300])] };
  const jump = talk(t, 7) ? Math.abs(Math.sin(t * 9)) * 26 : 0;
  return (
    <g>
      <rect width="1600" height="900" fill="#F3D9B1" />
      <rect y="0" width="1600" height="60" fill="#E9CB9C" />
      <rect y="700" width="1600" height="200" fill="#C99C6A" />
      {[0, 200, 400, 600, 800, 1000, 1200, 1400].map((x) => <rect key={x} x={x} y="700" width="2" height="200" fill="#b48a5a" />)}
      {/* window with grill */}
      <rect x="120" y="150" width="300" height="260" rx="6" fill="#9ED3F2" stroke="#7a5a3a" strokeWidth="10" />
      <g stroke="#3c3c3c" strokeWidth="5" fill="none">{[170, 220, 270, 320, 370].map((x) => <path key={x} d={`M ${x} 150 L ${x} 410`} />)}<path d="M 120 280 L 420 280" /><path d="M 220 210 q 50 -50 100 0 q -50 50 -100 0" /></g>
      {/* calendar + clock + photo */}
      <rect x="1180" y="150" width="130" height="160" fill="#fff" stroke="#bbb" strokeWidth="3" /><rect x="1180" y="150" width="130" height="36" fill="#E5484D" />
      <text x="1245" y="176" textAnchor="middle" fontSize="20" fontWeight="700" fill="#fff" fontFamily={BN}>অক্টোবর</text>
      {[...Array(15)].map((_, i) => <rect key={i} x={1192 + (i % 5) * 22} y={200 + Math.floor(i / 5) * 30} width="14" height="14" fill={i === 11 ? "#E5484D" : "#ddd"} />)}
      <circle cx="1450" cy="220" r="56" fill="#fff" stroke="#7a5a3a" strokeWidth="8" />
      <path d={`M 1450 220 L ${1450 + Math.sin(t) * 34} ${220 - Math.cos(t) * 34}`} stroke="#222" strokeWidth="4" strokeLinecap="round" />
      <path d="M 1450 220 L 1450 186" stroke="#222" strokeWidth="6" strokeLinecap="round" />
      <rect x="600" y="140" width="170" height="130" fill="#E8B634" stroke="#7a5a3a" strokeWidth="8" />
      <circle cx="660" cy="200" r="22" fill="#A86C48" /><circle cx="715" cy="205" r="20" fill="#C18A62" /><rect x="640" y="222" width="100" height="40" rx="14" fill="#9E2B3F" />
      {/* ceiling fan */}
      <path d="M 800 0 L 800 92" stroke="#555" strokeWidth="6" />
      <g transform={`translate(800 100) scale(1 .22) rotate(${t * 520})`}>
        {[0, 120, 240].map((r) => <ellipse key={r} cx="0" cy="-120" rx="34" ry="120" fill="#7a7a7a" transform={`rotate(${r})`} />)}
      </g>
      <ellipse cx="800" cy="100" rx="34" ry="14" fill="#555" />
      {/* family */}
      <rect x="356" y="500" width="148" height="170" rx="10" fill="#6f461f" /><rect x="372" y="516" width="116" height="140" rx="6" fill="#8B5A2B" />
      <Person x={430} y={780} s={S} p={BABA} tt={t} sit arms={babaArms} hold={lower < 1 ? "newspaper" : null} talk={talk(t, 6)} mood={talk(t, 6) ? "angry" : "neutral"} lookX={8} />
      <rect x="350" y="662" width="160" height="38" rx="6" fill="#7A5230" /><rect x="364" y="700" width="14" height="80" fill="#5a3d22" /><rect x="482" y="700" width="14" height="80" fill="#5a3d22" />
      <Person x={800} y={780} s={S} p={SHUVO} tt={t} sit mood={t > 15.7 ? "surprised" : "sad"} lookX={t > 15.6 ? 8 : t > 13.5 ? -8 : 6} />
      <Person x={1110} y={800} s={S} p={MA} tt={t} arms="tray" hold="tray" talk={talk(t, 5)} mood={talk(t, 5) ? "neutral" : "happy"} lookX={-8} />
      <Person x={1330} y={800 - jump} s={0.48} p={BON} tt={t} arms={talk(t, 7) ? "cheer" : "down"} talk={talk(t, 7)} mood="happy" lookX={-8} />
      {/* table */}
      <rect x="560" y="600" width="480" height="30" rx="6" fill="#8B5A2B" />
      <rect x="580" y="630" width="18" height="140" fill="#6f461f" /><rect x="1002" y="630" width="18" height="140" fill="#6f461f" />
      {[680, 800, 920].map((x) => <g key={x}><ellipse cx={x} cy="598" rx="52" ry="12" fill="#fff" stroke="#ddd" strokeWidth="2" /><ellipse cx={x - 8} cy="590" rx="28" ry="10" fill="#FBFAF4" /></g>)}
      <ellipse cx="740" cy="590" rx="18" ry="8" fill="#E8B634" />
      <Bubble t={t} a={11.4} b={13.4} x={1110} y={280} w={420} lines={["খাওয়ার আগে বল —", "চাকরি পাইছো?"]} tx={1110} ty={420} />
      <Bubble t={t} a={13.5} b={15.6} x={430} y={300} w={480} lines={["পেপারে এত চাকরি,", "তোর একটাও হয় না?"]} tx={430} ty={420} angry />
      <Bubble t={t} a={15.7} b={18.2} x={1250} y={420} w={430} lines={["ভাইয়া, চাকরি পাইলে", "ফোন কিনে দিবা? 😁"]} tx={1330} ty={520 - jump} fs={30} />
    </g>
  );
}

// ================================================================ street
const FACADES = [[-60, 300, 300, "#E79AA6"], [250, 230, 260, "#7CC8C0"], [520, 340, 240, "#F2C14E"], [770, 260, 280, "#A7B5E8"], [1060, 320, 250, "#F0A070"], [1320, 240, 300, "#9FD08B"], [1630, 300, 260, "#E79AA6"]];
function StreetScene({ t }) {
  const u = t - SC.street[0];
  const pan = -u * 36;
  const rx = u < 2.7 ? lerp(1900, 1090, ease(prog(u, 0.6, 2.7))) : u < 5.0 ? 1090 : lerp(1090, -500, ease(prog(u, 5.0, 6.5)));
  const wheel = (u < 2.7 || u > 5) ? u * 400 : 2.7 * 400;
  return (
    <g>
      <rect width="1600" height="900" fill="url(#ch-noon)" />
      <g transform={`translate(${pan} 0)`}>
        {FACADES.map(([x, top, w, c], i) => (
          <g key={i}>
            <rect x={x} y={top} width={w} height={760 - top} fill={c} />
            <rect x={x} y={top} width={w} height="16" fill="#00000022" />
            {[0, 1, 2].map((r) => [0, 1, 2].map((cc) => (
              <g key={`${r}${cc}`}><rect x={x + 24 + cc * (w - 40) / 3} y={top + 40 + r * 110} width={(w - 80) / 3} height="62" fill="#3c4a5c" opacity=".75" />
                <path d={`M ${x + 24 + cc * (w - 40) / 3} ${top + 40 + r * 110} l ${(w - 80) / 6} -14 l ${(w - 80) / 6} 14`} fill={c} stroke="#00000033" strokeWidth="2" /></g>
            )))}
            {i === 1 && <rect x={x + 30} y={top + 156} width="140" height="30" rx="4" fill="#fff" />}
          </g>
        ))}
      </g>
      {/* poles + tangled wires */}
      <g transform={`translate(${pan * 1.3} 0)`}>
        {[200, 900, 1600, 2300].map((x) => <rect key={x} x={x} y="120" width="12" height="640" fill="#4a4a4a" />)}
        {[0, 18, 34, 50].map((d, i) => <path key={i} d={`M -200 ${150 + d} Q 550 ${230 + d * 1.6} 906 ${150 + d} T 2306 ${160 + d}`} stroke="#1b1b1b" strokeWidth="2.5" fill="none" />)}
      </g>
      {/* balcony + aunty (building 2) */}
      <g transform={`translate(${pan} 0)`}>
        <Person x={360} y={520} s={0.42} p={AUNTY} tt={t} arms={talk(t, 8) ? "wave" : "hips"} talk={talk(t, 8)} mood="happy" lookX={6} />
        <rect x="270" y="440" width="190" height="16" fill="#3c3c3c" />
        <g stroke="#3c3c3c" strokeWidth="4">{[280, 300, 320, 340, 360, 380, 400, 420, 440].map((x) => <path key={x} d={`M ${x} 456 L ${x} 520`} />)}</g>
        <rect x="262" y="518" width="206" height="12" fill="#3c3c3c" />
      </g>
      <rect y="760" width="1600" height="140" fill="#5c5c5c" />
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={((i * 320 + pan * 2) % 1920 + 1920) % 1920 - 160} y="826" width="120" height="8" fill="#ddd" />)}
      <Person x={640} y={850} s={0.75} p={SHUVO} tt={t} walk={u < 5 ? t * 9 : null} mood={u > 0.5 ? "sad" : "neutral"} lookX={u > 2.8 ? 8 : -6} />
      {/* rickshaw */}
      <g transform={`translate(${rx} 0)`}>
        <Person x={-130} y={790} s={0.6} p={RICK} tt={t} sit arms="reach" talk={talk(t, 9)} mood="happy" lookX={-8} />
        <rect x="-188" y="690" width="116" height="20" rx="8" fill="#2b2b2b" /><path d="M -130 710 L -130 760 L -150 800" stroke="#2b2b2b" strokeWidth="8" fill="none" />
        <g transform="translate(0 860)">
          <path d="M -170 -60 L -120 -150 L 40 -150 L 70 -70" stroke="#2b2b2b" strokeWidth="8" fill="none" />
          <rect x="10" y="-260" width="160" height="110" rx="14" fill="#E5484D" />
          <path d="M 0 -260 Q 90 -380 190 -250" fill="#1b1b1b" />
          <path d="M 20 -268 Q 90 -360 170 -262" stroke="#F2C14E" strokeWidth="6" fill="none" />
          <rect x="130" y="-240" width="40" height="90" rx="6" fill="#2D6CDF" />
          <circle cx="150" cy="-206" r="14" fill="#F2C14E" /><circle cx="150" cy="-206" r="6" fill="#E5484D" />
          {[[90, -70, 72], [-170, -45, 46]].map(([cx, cy, r], i) => (
            <g key={i}><circle cx={cx} cy={cy} r={r} fill="none" stroke="#2b2b2b" strokeWidth="7" />
              {[0, 30, 60, 90, 120, 150].map((a) => <line key={a} x1={cx} y1={cy} x2={cx + r * Math.cos(((a + wheel) * Math.PI) / 180)} y2={cy + r * Math.sin(((a + wheel) * Math.PI) / 180)} stroke="#777" strokeWidth="2" />)}
              {[0, 30, 60, 90, 120, 150].map((a) => <line key={`b${a}`} x1={cx} y1={cy} x2={cx - r * Math.cos(((a + wheel) * Math.PI) / 180)} y2={cy - r * Math.sin(((a + wheel) * Math.PI) / 180)} stroke="#777" strokeWidth="2" />)}
            </g>
          ))}
          <path d="M -150 -160 L -195 -175" stroke="#2b2b2b" strokeWidth="7" strokeLinecap="round" />
        </g>
      </g>
      <Bubble t={t} a={18.9} b={21.0} x={360 + pan} y={260} w={380} lines={["শুভ! চাকরি", "পাইছো বাবা?"]} tx={370 + pan} ty={300} />
      <Bubble t={t} a={21.2} b={23.8} x={1010} y={350} w={460} lines={["মামা, চাকরি হইছে?", "হইলে ভাড়া বাড়ামু! 😄"]} tx={970} ty={430} />
    </g>
  );
}

// ================================================================ the phone calls
const CALLERS = [{ n: "খালা", e: "👩‍🦱", a: 24.2 }, { n: "মামা", e: "👨‍🦳", a: 25.9 }, { n: "ফুপু", e: "👵", a: 27.4 }, { n: "বড় আপা", e: "👩", a: 28.6 }];
const SPAM = [...Array(14)].map((_, i) => ({ at: 24.6 + i * 0.42 + (i > 8 ? -0.6 : 0), x: [1180, 1300, 1120, 1380, 1220, 1050, 1420, 1150, 1330, 1240, 1080, 1400, 1180, 1300][i], y: 140 + ((i * 131) % 640), fs: 30 + i * 3, r: ((i * 37) % 24) - 12 }));
function CallsScene({ t }) {
  const u = t - SC.calls[0];
  const ci = Math.max(0, CALLERS.filter((c) => t >= c.a).length - 1);
  const c = CALLERS[ci];
  const ring = Math.sin(t * 60) * (t > 28.6 ? 9 : 4);
  const panic = t > 28.9;
  return (
    <g transform={panic ? `translate(${Math.sin(t * 70) * 5} ${Math.cos(t * 63) * 4})` : undefined}>
      <rect width="1600" height="900" fill="url(#ch-alarm)" />
      <circle cx="800" cy="450" r={300 + Math.sin(t * 8) * 30} fill="#E5484D" opacity={0.08 + (panic ? 0.08 : 0)} />
      {/* Shuvo */}
      <circle cx="300" cy="450" r="171" fill="#fff" stroke="#0E0F0C" strokeWidth="6" />
      <g clipPath="url(#ch-bust)"><rect x="130" y="280" width="340" height="340" fill="#FFE1E1" />
        <Person x={300} y={935} p={SHUVO} tt={t} mood={panic ? "angry" : u > 1.5 ? "surprised" : "sad"} arms={panic ? "cover" : "down"} shake={panic ? 2 : 0} /></g>
      {panic && <text x="300" y="250" textAnchor="middle" fontSize={62 + Math.sin(t * 30) * 4} fontWeight="800" fill="#fff" fontFamily={BN}>আআআআ!</text>}
      {/* phone */}
      <g transform={`translate(${800 + ring} 450) scale(.82) translate(-800 -450)`}>
        <rect x="604" y="54" width="392" height="792" rx="56" fill="#0E0F0C" />
        <g transform="translate(626 80)">
          <g clipPath="url(#ch-scr)">
            <rect width="348" height="740" fill="#16202c" />
            <circle cx="174" cy="250" r={110 + Math.sin(t * 6) * 6} fill="#2D6CDF" opacity=".15" />
            <text x="174" y="120" textAnchor="middle" fontSize="20" fill="#9fb0c4" fontFamily={EN}>Incoming call…</text>
            <circle cx="174" cy="250" r="72" fill="#2b3a4d" />
            <text x="174" y="278" textAnchor="middle" fontSize="76">{c.e}</text>
            <text x="174" y="390" textAnchor="middle" fontSize="54" fontWeight="700" fill="#fff" fontFamily={BN}>{c.n}</text>
            <text x="174" y="430" textAnchor="middle" fontSize="20" fill="#9fb0c4" fontFamily={EN}>mobile · {ci + 3} missed calls</text>
            <circle cx="90" cy="620" r="40" fill="#E5484D" /><path d="M 72 620 L 108 620" stroke="#fff" strokeWidth="8" strokeLinecap="round" />
            <circle cx="258" cy="620" r={40 + Math.abs(Math.sin(t * 6)) * 6} fill="#22C55E" /><path d="M 244 612 q 14 24 28 8" stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round" />
          </g>
        </g>
      </g>
      {SPAM.filter((s) => t >= s.at).map((s, i) => {
        const k = clamp((t - s.at) / 0.25);
        return (
          <g key={i} transform={`translate(${s.x} ${s.y}) rotate(${s.r}) scale(${0.4 + 0.6 * k})`} opacity={k}>
            <rect x={-s.fs * 3.2} y={-s.fs * 0.95} width={s.fs * 6.4} height={s.fs * 1.5} rx={s.fs * 0.6} fill={i % 3 === 2 ? "#FFF3F2" : "#fff"} stroke="#E5484D" strokeWidth="4" />
            <text y={s.fs * 0.2} textAnchor="middle" fontSize={s.fs} fontWeight="700" fill={i > 9 ? "#E5484D" : "#0E0F0C"} fontFamily={BN}>চাকরি পাইছো?{i > 6 ? "?" : ""}{i > 10 ? "?" : ""}</text>
          </g>
        );
      })}
    </g>
  );
}

// ================================================================ rooftop with friends
function FriendsScene({ t }) {
  const showApp = t > 33.6;
  return (
    <g>
      <rect width="1600" height="900" fill="url(#ch-night)" />
      {[...Array(40)].map((_, i) => <circle key={i} cx={(i * 211) % 1600} cy={(i * 97) % 380} r={1.2 + (i % 3) * 0.6} fill="#fff" opacity={0.3 + 0.3 * Math.sin(t * 2 + i)} />)}
      <g fill="#1a1838">{[[0, 420, 140], [130, 380, 100], [240, 450, 160], [420, 360, 120], [560, 430, 180], [760, 390, 110], [880, 460, 150], [1050, 350, 130], [1200, 420, 170], [1380, 380, 120], [1490, 440, 140]].map(([x, y, w], i) => (
        <g key={i}><rect x={x} y={y} width={w} height={600 - y} />{[...Array(6)].map((_, k) => <rect key={k} x={x + 12 + (k % 3) * (w / 3.4)} y={y + 20 + Math.floor(k / 3) * 46} width="12" height="16" fill="#FFCE78" opacity={(i + k) % 3 ? 0.65 : 0.1} />)}</g>
      ))}</g>
      <rect y="600" width="1600" height="110" fill="#8a7f72" /><rect y="596" width="1600" height="12" fill="#a39888" />
      <rect y="710" width="1600" height="190" fill="#6f665c" />
      <g transform="translate(1390 430)"><rect x="0" y="0" width="150" height="170" rx="16" fill="#2b3a4d" /><ellipse cx="75" cy="0" rx="75" ry="18" fill="#3b4c63" /></g>
      <path d="M 40 210 Q 800 330 1560 220" stroke="#333" strokeWidth="2" fill="none" />
      {[...Array(22)].map((_, i) => {
        const x = 40 + i * 72, y = 210 + Math.sin((i / 21) * Math.PI) * 112 - (i / 21) * -10;
        const on = Math.sin(t * 4 + i) > -0.2;
        return <circle key={i} cx={x} cy={y} r="7" fill={["#FFE27A", "#FF8FB1", "#FFC23D", "#7CC4FF"][i % 4]} opacity={on ? 1 : 0.35} style={{ filter: on ? "drop-shadow(0 0 6px #FFE27A)" : "none" }} />;
      })}
      <Person x={430} y={830} s={0.72} p={RAKIB} tt={t} arms={talk(t, 14) ? "point" : "hips"} talk={talk(t, 14)} mood="happy" lookX={8} />
      <Person x={800} y={830} s={0.72} p={SHUVO} tt={t} mood={showApp ? "surprised" : "sad"} lookX={showApp ? 8 : -8} />
      <g transform="translate(2340 0) scale(-1 1)">
        <Person x={1170} y={830} s={0.72} p={MIM} tt={t} arms={showApp ? "phone" : "down"} hold={showApp ? "phone" : null} glow={showApp ? 1 : 0} talk={talk(t, 15)} mood="happy" lookX={6} />
      </g>
      {showApp && (
        <g opacity={ease(prog(t, 33.6, 34.1))} transform={`translate(1170 ${380 - ease(prog(t, 33.6, 34.2)) * 30})`}>
          <circle r="64" fill="url(#ch-glow)" />
          <rect x="-46" y="-60" width="92" height="120" rx="14" fill="#0E0F0C" stroke="#FFC23D" strokeWidth="3" />
          <DeerMark x={0} y={-12} s={1.4} />
          <text y="40" textAnchor="middle" fontSize="13" fontWeight="700" fill="#FFC23D" fontFamily={BN}>সোনারহরিণ</text>
        </g>
      )}
      <Bubble t={t} a={30.9} b={32.9} x={470} y={320} w={440} lines={["দোস্ত, তুই এখনো", "চাকরি পাস নাই?"]} tx={430} ty={420} />
      <Bubble t={t} a={33.0} b={35.8} x={1010} y={250} w={560} lines={["সোনারহরিণ ট্রাই কর —", "শুধু ফ্রেশারদের জন্য!", "আমি ওখান থেকেই পাইছি!"]} tx={1150} ty={300} fs={30} />
    </g>
  );
}

// ================================================================ the app
const URL = "sonarhorin.com";
const TAPS = [2.4, 3.6, 4.3, 5.0];
function Screen({ u }) {
  if (u < 1.6) {
    const n = Math.floor(clamp((u - 0.2) / 1.0) * URL.length);
    return (
      <g>
        <rect width="348" height="740" fill="#fff" />
        <rect x="16" y="50" width="316" height="44" rx="22" fill="#EFEDE6" />
        <text x="36" y="79" fontSize="18" fill="#0E0F0C" fontFamily={EN}>🔒 {URL.slice(0, n)}{u % 0.6 < 0.3 && n < URL.length ? "|" : ""}</text>
        {u > 1.25 && <rect x="16" y="100" width={316 * clamp((u - 1.25) / 0.35)} height="4" fill="#6B4EFF" />}
        {[...Array(5)].map((_, i) => <rect key={i} x="24" y={140 + i * 70} width={300 - (i % 2) * 80} height="40" rx="8" fill="#F4F3EE" />)}
      </g>
    );
  }
  if (u < 3.0) {
    const k = ease(prog(u, 1.6, 2.0));
    return (
      <g>
        <rect width="348" height="740" fill="#0E0F0C" />
        <g opacity={k}>
          <DeerMark x={174} y={150} s={2.2} />
          <text x="174" y="230" textAnchor="middle" fontSize="30" fontWeight="700" fill="#fff" fontFamily={BN}>সোনারহরিণ</text>
          <text x="174" y="330" textAnchor="middle" fontSize="24" fill="#E8B634" fontFamily={HAND}>তুমি কী খুঁজছো?</text>
          {["💼 চাকরি", "🎓 ইন্টার্নশিপ", "🚀 স্টার্টআপ"].map((l, i) => (
            <g key={l}><rect x="44" y={360 + i * 76} width="260" height="58" rx="29" fill={i === 0 && u > 2.4 ? "#FFC23D" : "#25271f"} stroke="#3a3c33" strokeWidth="2" />
              <text x="174" y={397 + i * 76} textAnchor="middle" fontSize="24" fontWeight="700" fill={i === 0 && u > 2.4 ? "#0E0F0C" : "#fff"} fontFamily={BN}>{l}</text></g>
          ))}
        </g>
      </g>
    );
  }
  if (u < 5.6) {
    const jobs = [["Junior Software Engineer", "Nodi Labs", 3.6], ["Trainee ML Engineer", "Shapla Systems", 4.3], ["QA Engineer (Fresher)", "Padma Pay", 5.0]];
    return (
      <g>
        <rect width="348" height="740" fill="#F6F5F0" />
        <text x="24" y="80" fontSize="26" fontWeight="700" fill="#0E0F0C" fontFamily={BN}>তোমার জন্য জব</text>
        <text x="24" y="108" fontSize="15" fill="#6B6F66" fontFamily={EN}>0 years experience · CSE</text>
        {jobs.map(([title, co, at], i) => {
          const done = u > at + 0.15;
          return (
            <g key={title} transform={`translate(16 ${140 + i * 180})`}>
              <rect width="316" height="160" rx="18" fill="#fff" stroke="#E2E0D8" strokeWidth="2" />
              <rect x="18" y="18" width="44" height="44" rx="12" fill={["#FFC23D", "#FFB86B", "#7CC4FF"][i]} />
              <text x="76" y="40" fontSize="17" fontWeight="700" fill="#0E0F0C" fontFamily={EN}>{title}</text>
              <text x="76" y="62" fontSize="14" fill="#6B6F66" fontFamily={EN}>{co} · Dhaka</text>
              <rect x="18" y="80" width="70" height="24" rx="12" fill="#FFC23D" /><text x="53" y="97" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0E0F0C" fontFamily={EN}>0 yrs exp</text>
              <rect x="150" y="110" width="150" height="38" rx="19" fill={done ? "#6B4EFF" : "#0E0F0C"} />
              <text x="225" y="135" textAnchor="middle" fontSize="15" fontWeight="700" fill="#fff" fontFamily={EN}>{done ? "Applied ✓" : "Apply in 1 tap"}</text>
            </g>
          );
        })}
      </g>
    );
  }
  if (u < 7.0) {
    const k = ease(prog(u, 5.6, 5.9));
    return (
      <g>
        <rect width="348" height="740" fill="#F6F5F0" />
        <g transform={`translate(16 ${-90 + k * 150})`}>
          <rect width="316" height="96" rx="20" fill="#fff" stroke="#6B4EFF" strokeWidth="3" />
          <text x="20" y="38" fontSize="18" fontWeight="700" fill="#0E0F0C" fontFamily={EN}>📩 Interview invite</text>
          <text x="20" y="66" fontSize="15" fill="#6B6F66" fontFamily={EN}>Nodi Labs · Sunday, 11:00 AM</text>
        </g>
        <g transform="translate(74 270)" opacity={k}>
          <rect width="200" height="200" rx="22" fill="#fff" stroke="#0E0F0C" strokeWidth="3" />
          <rect width="200" height="56" rx="22" fill="#E5484D" /><rect y="34" width="200" height="22" fill="#E5484D" />
          <text x="100" y="40" textAnchor="middle" fontSize="22" fontWeight="700" fill="#fff" fontFamily={EN}>SUNDAY</text>
          <text x="100" y="160" textAnchor="middle" fontSize="92" fontWeight="800" fill="#0E0F0C" fontFamily={EN}>12</text>
        </g>
      </g>
    );
  }
  const k = ease(prog(u, 7.0, 7.4));
  return (
    <g>
      <rect width="348" height="740" fill="#4B2FD6" />
      <g transform={`translate(34 ${140 + (1 - k) * 60})`} opacity={k}>
        <rect width="280" height="380" rx="14" fill="#fff" />
        <rect width="280" height="70" rx="14" fill="#E8B634" /><rect y="50" width="280" height="20" fill="#E8B634" />
        <text x="140" y="46" textAnchor="middle" fontSize="24" fontWeight="800" fill="#0E0F0C" fontFamily={EN}>OFFER LETTER</text>
        <text x="140" y="120" textAnchor="middle" fontSize="18" fontWeight="700" fill="#0E0F0C" fontFamily={EN}>Junior Software Engineer</text>
        <text x="140" y="148" textAnchor="middle" fontSize="15" fill="#6B6F66" fontFamily={EN}>Nodi Labs · Dhaka</text>
        {[190, 214, 238, 262].map((y) => <rect key={y} x="30" y={y} width={y === 262 ? 140 : 220} height="10" rx="5" fill="#E2E0D8" />)}
        <circle cx="210" cy="320" r="34" fill="none" stroke="#6B4EFF" strokeWidth="5" />
        <text x="210" y="328" textAnchor="middle" fontSize="20" fontWeight="800" fill="#6B4EFF" fontFamily={EN}>✓</text>
      </g>
      {[...Array(16)].map((_, i) => <rect key={i} x={(i * 61) % 348} y={((u - 7) * 300 + i * 53) % 740} width="10" height="16" fill={["#E8B634", "#FFC23D", "#FF8FB1", "#7CC4FF"][i % 4]} transform={`rotate(${(u * 300 + i * 40) % 360} ${(i * 61) % 348} ${((u - 7) * 300 + i * 53) % 740})`} />)}
    </g>
  );
}
const FEATS = [{ u: 2.6, bn: "০ বছর অভিজ্ঞতা", en: "Only fresher jobs" }, { u: 3.8, bn: "এক ট্যাপে অ্যাপ্লাই", en: "1-click · email · portal" }, { u: 5.8, bn: "ইন্টারভিউ প্র্যাকটিস", en: "10-min AI interviewer" }, { u: 7.2, bn: "প্রথম চাকরি", en: "Your first offer" }];
function AppScene({ t }) {
  const u = t - SC.app[0];
  const intro = ease(prog(u, 0, 0.5));
  const tap = TAPS.find((a) => u > a - 0.35 && u < a + 0.3);
  const tapPos = tap == null ? null : tap === 2.4 ? [174, 389] : [241, 140 + TAPS.indexOf(tap) * 180 - 180 + 129];
  const face = u < 2 ? "neutral" : u < 7 ? "happy" : "happy";
  return (
    <g>
      <rect width="1600" height="900" fill="url(#ch-app)" />
      {[[180, 160, 70, "#FFC23D"], [1400, 760, 90, "#7CC4FF"], [1300, 140, 50, "#FFB86B"], [140, 780, 60, "#B9A6FF"]].map(([x, y, r, c], i) => (
        <circle key={i} cx={x + Math.sin(t * 0.6 + i) * 20} cy={y + Math.cos(t * 0.5 + i) * 16} r={r} fill={c} opacity=".35" />
      ))}
      <g opacity={intro}>
        <circle cx="300" cy="450" r="171" fill="#fff" stroke="#0E0F0C" strokeWidth="6" />
        <g clipPath="url(#ch-bust)"><rect x="130" y="280" width="340" height="340" fill="#FFF1CC" /><Person x={300} y={935} p={SHUVO} tt={t} mood={face} /></g>
        <rect x="200" y="640" width="200" height="40" rx="20" fill="#0E0F0C" />
        <text x="300" y="667" textAnchor="middle" fontSize="18" fontWeight="700" fill="#fff" fontFamily={EN}>Shuvo · CSE '26</text>
        {u > 7.1 && <text x="300" y="250" textAnchor="middle" fontSize="54" opacity={prog(u, 7.1, 7.4)}>🤩</text>}
      </g>
      <g transform={`translate(800 450) scale(${lerp(1.4, 1, intro)}) translate(-800 -450)`}>
        <rect x="604" y="54" width="392" height="792" rx="56" fill="#0E0F0C" />
        <rect x="610" y="60" width="380" height="780" rx="50" fill="#1c1d20" />
        <g transform="translate(626 80)">
          <g clipPath="url(#ch-scr)"><Screen u={u} /></g>
          {tapPos && <circle cx={tapPos[0]} cy={tapPos[1]} r={22} fill="#0E0F0C" opacity={0.25} />}
        </g>
        <rect x="750" y="68" width="100" height="22" rx="11" fill="#0E0F0C" />
      </g>
      {FEATS.map((f, i) => {
        const k = ease(prog(u, f.u, f.u + 0.35));
        if (k <= 0) return null;
        const y = 230 + i * 120;
        return <g key={f.en} opacity={k} transform={`translate(${(1 - k) * 40} 0)`}>
          <circle cx="1090" cy={y} r="26" fill="#FFC23D" stroke="#0E0F0C" strokeWidth="3" />
          <path d={`M 1078 ${y} l 8 9 l 16 -18`} stroke="#0E0F0C" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <text x="1136" y={y + 4} fontSize="34" fontWeight="700" fill="#0E0F0C" fontFamily={BN}>{f.bn}</text>
          <text x="1136" y={y + 34} fontSize="19" fill="#6B6F66" fontFamily={EN}>{f.en}</text>
        </g>;
      })}
    </g>
  );
}

// ================================================================ the answer
function EndScene({ t }) {
  const point = t > 45.3 && t < 46.9;
  const cheer = t > 47.0;
  return (
    <g>
      <TeaStall t={t} late={t > 47} />
      <Person x={380} y={762} s={S} p={CHACHA} tt={t} sit arms={point ? "point" : cheer ? "cheer" : CUP_R} hold={point || cheer ? null : "cup"} talk={talk(t, 20)} mood={cheer ? "surprised" : "neutral"} lookX={6} />
      <Person x={600} y={762} s={S} p={MAMA} tt={t + 1} sit arms={point ? "point" : cheer ? "cheer" : CUP_R} hold={point || cheer ? null : "cup"} talk={talk(t, 20)} mood={cheer ? "happy" : "neutral"} lookX={6} />
      <g><rect x="226" y="644" width="508" height="40" rx="6" fill="#7A5230" /><rect x="226" y="644" width="508" height="8" rx="4" fill="#94683f" />
        <rect x="250" y="684" width="16" height="78" fill="#5a3d22" /><rect x="694" y="684" width="16" height="78" fill="#5a3d22" /></g>
      <g transform="translate(2460 0) scale(-1 1)">
        <Person x={1230} y={760} s={S} p={CHA} tt={t + 2} arms={t > 48.7 ? "letter" : point ? "point" : "hips"} hold={t > 48.7 ? "cup" : null} talk={talk(t, 20) || talk(t, 22)} mood="happy" lookX={4} />
      </g>
      <rect x="1000" y="566" width="440" height="196" fill="#8B5A2B" />
      <rect x="990" y="548" width="460" height="20" fill="#A86F3A" />
      <Person x={830} y={800} s={S} p={SHUVO_FORMAL} tt={t} arms={t > 46.9 ? "letter" : "down"} hold={t > 46.9 ? "letter" : null} talk={talk(t, 21)} mood={t > 46.9 ? "happy" : "neutral"} />
      <Bubble t={t} a={45.3} b={46.8} x={520} y={300} w={360} lines={["চাকরি পাইছো?"]} tx={500} ty={360} />
      <Bubble t={t} a={46.9} b={48.6} x={830} y={280} w={360} lines={["হ্যাঁ, পাইছি!! 🎉"]} tx={830} ty={360} fs={40} />
      <Bubble t={t} a={48.7} b={50.4} x={1060} y={250} w={360} lines={["আজকে চা ফ্রি! ☕"]} tx={1180} ty={370} />
      <g opacity={ease(prog(t, 50.3, 50.9))}>
        <rect width="1600" height="900" fill="#0E0F0C" opacity=".55" />
      </g>
    </g>
  );
}

const Am = [220, 261.6, 329.6], F = [174.6, 220, 261.6], Dm = [146.8, 174.6, 220], E = [164.8, 207.7, 246.9];
const C = [261.6, 329.6, 392], G = [196, 246.9, 293.7], F2 = [349.2, 440, 523.3];
const CUES = [
  [0.4, "pad", Am], [2.4, "pad", F], [6.0, "pad", Am], [9.0, "pad", Dm], [11.2, "pad", F], [11.5, "sting"], [13.6, "sting"], [14.4, "pad", Dm], [16.0, "pad", F],
  [18.6, "pad", C], [21.0, "bell"], [21.6, "pad", G], [24.2, "ring"], [24.3, "pad", E], [25.9, "ring"], [27.4, "ring"], [27.6, "pad", E], [28.6, "ring"], [28.9, "sting"], [29.0, "buzz"],
  [30.6, "pad", Am], [33.0, "ping"], [33.4, "pad", C], [36.2, "whoosh"], [36.4, "pad", G], [38.4, "tap"], [39.6, "tap"], [40.3, "tap"], [41.0, "tap"], [41.0, "pad", C],
  [41.6, "ping"], [43.0, "success"], [43.2, "pad", F2], [45.3, "pad", Am], [46.9, "success"], [47.0, "cheer"], [47.2, "pad", C], [48.8, "pad", F2], [50.5, "pad", C],
];

export const CHORUS = {
  id: "chorus", DUR, Defs, lines: LINES, cues: CUES, endHold: 1.7, poster: 47.5,
  tab: "শুভর গল্প · চাকরি পাইছো?", eyebrow: "শুভর গল্প · 52 sec · voices on",
  headline: <>Everyone asks<br /><em>the same question.</em></>,
  aria: "Animated story: at the tea stall, at home, on the street, on the phone and with friends, everyone asks Shuvo whether he got a job. A friend tells him about Sonarhorin; he applies in one tap, gets an interview and an offer, and finally answers yes.",
  chapters: [
    { t: 2.2, bn: "চায়ের দোকান", en: "Tea stall" }, { t: 11, bn: "বাসায়", en: "Home" }, { t: 18.5, bn: "রাস্তায়", en: "Street" },
    { t: 24, bn: "ফোনে", en: "Calls" }, { t: 30.5, bn: "বন্ধুরা", en: "Friends" }, { t: 36, bn: "অ্যাপ", en: "The app" }, { t: 45, bn: "উত্তর", en: "The answer" },
  ],
  scenes: [["title", Title, ...SC.title], ["tea", TeaScene, ...SC.tea], ["home", HomeScene, ...SC.home], ["street", StreetScene, ...SC.street],
    ["calls", CallsScene, ...SC.calls], ["friends", FriendsScene, ...SC.friends], ["app", AppScene, ...SC.app], ["end", EndScene, ...SC.end]],
  end: { bn: "তোমার উত্তরটাও বদলাতে পারে।", en: "Your answer can change too.", cta: ["/jobs", "Find my first job →"] },
};
