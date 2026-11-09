// The six scenes of Rafi's story. Each is a pure function of global time `t` (seconds).
import { BABA, blendArms, Bubble, DeerMark, HR, MA, NILA, Person, RAFI, RAFI_FORMAL } from "./people";

export const DUR = 45;
export const SC = { title: [0, 1.8], home: [1.8, 10.2], park: [10.2, 17.4], phone: [17.4, 20.8], app: [20.8, 31.4], office: [31.4, 36.6], photo: [36.6, DUR] };
export const CHAPTERS = [
  { t: 1.8, bn: "চাপ", en: "Pressure" },
  { t: 10.2, bn: "বিচ্ছেদ", en: "Heartbreak" },
  { t: 17.4, bn: "অ্যাপ", en: "The app" },
  { t: 31.4, bn: "ইন্টারভিউ", en: "Interview" },
  { t: 36.6, bn: "পরিবারের ছবি", en: "Family photo" },
];

export const LINES = [
  { a: 0.2, b: 1.8, bn: "সোনারহরিণ নিবেদন করছে", en: "Sonarhorin presents" },
  { a: 2.2, b: 4.6, who: "বাবা · Father", bn: "আর কত দিন বেকার বসে থাকবি?", en: "How long will you sit around jobless?" },
  { a: 4.7, b: 7.1, who: "মা · Mother", bn: "পাশের বাসার ছেলেটা চাকরি পেয়ে গেল!", en: "The neighbour's son already got a job!" },
  { a: 7.2, b: 10.0, who: "বাবা · Father", bn: "এত পড়াশোনা করে কী লাভ হলো?", en: "What was all that studying for?" },
  { a: 10.6, b: 13.4, who: "নীলা · Nila", bn: "বাসায় বিয়ের কথা চলছে… আমি আর অপেক্ষা করতে পারব না।", en: "My family is arranging my marriage… I can't wait any longer." },
  { a: 13.6, b: 15.2, who: "রাফি · Rafi", bn: "নীলা… দাঁড়াও…", en: "Nila… wait…" },
  { a: 15.4, b: 17.4, bn: "৪৭টা সিভি পাঠানো। একটারও উত্তর আসেনি।", en: "47 CVs sent. Not a single reply." },
  { a: 17.6, b: 20.8, bn: "তারপর এক রাতে, একটা নোটিফিকেশন…", en: "Then, one night, a notification…" },
  { a: 21.0, b: 23.4, bn: "১০ সেকেন্ডে লগইন — শুধু ফ্রেশারদের জন্য", en: "Logged in within 10 seconds — built only for freshers" },
  { a: 23.5, b: 26.6, bn: "০ বছরের অভিজ্ঞতা — এক ট্যাপে অ্যাপ্লাই", en: "Zero experience needed — apply in one tap" },
  { a: 26.7, b: 28.8, bn: "সিভি ঠিক করে রিজেকশনের ঝুঁকি ৮০% থেকে ১৮%", en: "CV fixed: rejection risk down from 80% to 18%" },
  { a: 28.9, b: 31.4, bn: "ইন্টারভিউয়ের ডাক এসেছে!", en: "An interview invite!" },
  { a: 32.0, b: 34.4, who: "ইন্টারভিউয়ার · Interviewer", bn: "অভিনন্দন! আপনি সিলেক্টেড।", en: "Congratulations! You're hired." },
  { a: 34.5, b: 36.6, bn: "প্রথম চাকরি। প্রথম অফার লেটার।", en: "First job. First offer letter." },
  { a: 37.0, b: 38.9, who: "বাবা · Father", bn: "আমার ছেলে চাকরি পেয়েছে!", en: "My son got a job!" },
  { a: 39.0, b: 40.4, who: "মা · Mother", bn: "সবাই মিষ্টি খাও!", en: "Everyone, have some sweets!" },
  { a: 40.4, b: 41.6, who: "নীলা · Nila", bn: "আমি জানতাম তুমি পারবে!", en: "I knew you could do it!" },
  { a: 41.7, b: 45.1, bn: "তোমার গল্পটাও বদলাতে পারে।", en: "Your story can change too." },
];

// ---------------------------------------------------------------- helpers
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const lerp = (a, b, k) => a + (b - a) * k;
const BN = "'Hind Siliguri', sans-serif";
const EN = "Inter, sans-serif";
const talking = (t, a, b) => t > a + 0.15 && t < b - 0.25;
const zoom = (t, [a, b], amt = 0.04) => {
  const z = 1 + amt * prog(t, a, b);
  return `translate(800 450) scale(${z}) translate(-800 -450)`;
};

export function Defs() {
  return (
    <defs>
      <linearGradient id="skyDusk" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2D3561" /><stop offset=".45" stopColor="#A4507A" /><stop offset=".75" stopColor="#F3826F" /><stop offset="1" stopColor="#FFD9A0" />
      </linearGradient>
      <linearGradient id="appBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F1ECFF" /><stop offset="1" stopColor="#F6F5F0" /></linearGradient>
      <radialGradient id="phoneGlow"><stop offset="0" stopColor="#BFE3FF" stopOpacity=".75" /><stop offset="1" stopColor="#BFE3FF" stopOpacity="0" /></radialGradient>
      <radialGradient id="redVignette" cx=".5" cy=".5" r=".75"><stop offset=".55" stopColor="#E5484D" stopOpacity="0" /><stop offset="1" stopColor="#E5484D" stopOpacity=".55" /></radialGradient>
      <radialGradient id="lampGlow"><stop offset="0" stopColor="#FFE7A6" stopOpacity=".7" /><stop offset="1" stopColor="#FFE7A6" stopOpacity="0" /></radialGradient>
      <clipPath id="scr"><rect x="0" y="0" width="348" height="740" rx="34" /></clipPath>
      <clipPath id="bust"><circle cx="300" cy="450" r="165" /></clipPath>
    </defs>
  );
}

// ================================================================ 0. Title
export function TitleScene({ t }) {
  const k = ease(prog(t, 0.1, 0.9));
  return (
    <g>
      <rect width="1600" height="900" fill="#0E0F0C" />
      <g opacity={k} transform={`translate(0 ${(1 - k) * 20})`}>
        <DeerMark x={800} y={300} s={2.4} />
        <text x="800" y="380" textAnchor="middle" fontSize="26" fill="#FFC23D" fontFamily={BN} fontWeight="600">সোনারহরিণ নিবেদন করছে</text>
        <text x="800" y="480" textAnchor="middle" fontSize="76" fill="#fff" fontFamily={BN} fontWeight="700">একটা প্রথম চাকরির গল্প</text>
        <text x="800" y="540" textAnchor="middle" fontSize="28" fill="#9aa093" fontFamily={EN}>A story about a first job</text>
      </g>
    </g>
  );
}

// ================================================================ 1. Home — parents shout
export function HomeScene({ t }) {
  const shout = [2.2, 4.7, 7.2].some((a, i) => t > a && t < [4.6, 7.1, 10.0][i]);
  const fatherTalk = talking(t, 2.2, 4.6) || talking(t, 7.2, 10.0);
  const motherTalk = talking(t, 4.7, 7.1);
  const lampSwing = Math.sin(t * 1.6) * 4;
  const pulse = shout ? 0.35 + 0.25 * Math.abs(Math.sin(t * 6)) : 0;
  const fArms = fatherTalk ? "point" : "hips";
  const mArms = motherTalk ? "pointL" : "hips";
  return (
    <g transform={zoom(t, SC.home, 0.05)}>
      {/* room */}
      <rect width="1600" height="700" fill="#EADCC8" />
      <rect y="700" width="1600" height="200" fill="#9C7656" />
      {[740, 790, 850].map((y) => <line key={y} x1="0" y1={y} x2="1600" y2={y} stroke="#8a6648" strokeWidth="3" />)}
      <rect y="690" width="1600" height="14" fill="#cdb79c" />
      <g>
        <rect x="110" y="110" width="270" height="280" rx="8" fill="#F6F1E8" />
        <rect x="126" y="126" width="238" height="248" fill="#1F2A44" />
        <circle cx="300" cy="190" r="34" fill="#F4F1DE" /><circle cx="314" cy="180" r="30" fill="#1F2A44" />
        {[[160, 170], [200, 260], [330, 300], [250, 160]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.5" fill="#fff" opacity={0.5 + 0.5 * Math.sin(t * 3 + i)} />)}
        <line x1="245" y1="126" x2="245" y2="374" stroke="#F6F1E8" strokeWidth="8" />
        <path d="M 96 100 Q 140 260 120 410 L 96 410 Z" fill="#B85042" /><path d="M 394 100 Q 350 260 370 410 L 394 410 Z" fill="#B85042" />
      </g>
      {/* graduation photo on the wall — irony */}
      <g transform="translate(1010 120)">
        <rect width="190" height="160" rx="6" fill="#7A5233" /><rect x="12" y="12" width="166" height="136" fill="#DCEAF5" />
        <circle cx="95" cy="72" r="26" fill="#B97A55" /><rect x="58" y="96" width="74" height="52" rx="18" fill="#1f2a44" />
        <path d="M 60 50 L 95 36 L 130 50 L 95 62 Z" fill="#1f2a44" /><line x1="124" y1="52" x2="128" y2="76" stroke="#E8B634" strokeWidth="3" />
        <text x="95" y="182" textAnchor="middle" fontSize="16" fill="#7a6a5a" fontFamily={EN}>BSc · 2026</text>
      </g>
      {/* clock */}
      <g transform="translate(1470 470)"><circle r="46" fill="#fff" stroke="#7A5233" strokeWidth="7" />
        <line x1="0" y1="0" x2="0" y2="-28" stroke="#222" strokeWidth="5" strokeLinecap="round" transform={`rotate(${t * 20})`} />
        <line x1="0" y1="0" x2="22" y2="0" stroke="#222" strokeWidth="5" strokeLinecap="round" /></g>
      {/* lamp */}
      <g transform={`rotate(${lampSwing} 1260 0)`}>
        <line x1="1260" y1="0" x2="1260" y2="230" stroke="#5c4a3a" strokeWidth="4" />
        <path d="M 1215 230 L 1305 230 L 1285 190 L 1235 190 Z" fill="#E8B634" />
        <circle cx="1260" cy="300" r="140" fill="url(#lampGlow)" />
      </g>

      <Person x={640} y={820} p={BABA} tt={t} mood="angry" talk={fatherTalk} arms={fArms} shake={fatherTalk ? 3.5 : 0} lookX={6} />
      <Person x={380} y={820} p={MA} tt={t} mood={motherTalk ? "angry" : "sad"} talk={motherTalk} arms={mArms} shake={motherTalk ? 2.5 : 0} lookX={motherTalk ? -6 : 8} />
      <Person x={1160} y={820} p={{ ...RAFI, sweat: t > 3, tears: t > 7.5 }} tt={t} mood="sad" sit arms={t > 2.6 ? "cover" : "down"} headDy={14} />

      {/* table + rejected CVs */}
      <rect x="860" y="618" width="600" height="30" rx="6" fill="#7A5233" />
      <rect x="880" y="648" width="20" height="200" fill="#6a4429" /><rect x="1420" y="648" width="20" height="200" fill="#6a4429" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${900 + i * 18} ${560 - i * 6}) rotate(${-8 + i * 7})`}>
          <rect width="110" height="70" fill="#FDFCF7" stroke="#d9d6cc" />
          {[14, 28, 42].map((y) => <rect key={y} x="12" y={y} width="70" height="6" fill="#d9dbd2" />)}
          {i === 2 && <g transform="translate(55 38) rotate(-14)"><rect x="-50" y="-15" width="100" height="30" fill="none" stroke="#E5484D" strokeWidth="4" /><text x="0" y="8" textAnchor="middle" fontSize="18" fontWeight="800" fill="#E5484D" fontFamily={EN}>REJECTED</text></g>}
        </g>
      ))}
      <g transform="translate(1320 588)"><rect width="46" height="34" rx="6" fill="#fff" /><path d="M 46 8 q 16 0 16 12 q 0 12 -16 12" stroke="#fff" strokeWidth="6" fill="none" /></g>

      <rect width="1600" height="900" fill="url(#redVignette)" opacity={pulse} />
      <Bubble t={t} a={2.2} b={4.6} x={700} y={232} w={560} lines={["আর কত দিন বেকার বসে থাকবি?"]} tx={650} ty={262} angry />
      <Bubble t={t} a={4.7} b={7.1} x={540} y={232} w={640} lines={["পাশের বাসার ছেলেটা চাকরি পেয়ে গেল!"]} tx={400} ty={262} angry />
      <Bubble t={t} a={7.2} b={10.0} x={700} y={232} w={540} lines={["এত পড়াশোনা করে কী লাভ হলো?"]} tx={650} ty={262} angry />
    </g>
  );
}

// ================================================================ 2. Park — Nila leaves
const SKY = [[0, 470, 90], [100, 430, 70], [180, 500, 120], [310, 410, 80], [400, 460, 110], [520, 520, 90], [620, 390, 70], [700, 470, 120], [830, 430, 90], [930, 500, 80],
  [1020, 380, 100], [1130, 470, 90], [1230, 430, 120], [1360, 500, 80], [1450, 420, 150]];
export function ParkScene({ t }) {
  const leave = prog(t, 13.4, 16.2);
  const nilaX = lerp(1010, 1900, ease(leave));
  const rain = prog(t, 14.4, 15.6);
  const gray = 0.5 * prog(t, 14.2, 16.0);
  const reaching = t > 13.5 && t < 15.3;
  const heart = prog(t, 15.5, 16.4);
  return (
    <g transform={zoom(t, SC.park, 0.04)}>
      <rect width="1600" height="660" fill="url(#skyDusk)" />
      <circle cx="1250" cy={570 + prog(t, 10.2, 17.4) * 40} r="72" fill="#FFD27F" />
      <g fill="#3A2E4F">
        {SKY.map(([x, top, w], i) => <rect key={i} x={x} y={top} width={w} height={660 - top} />)}
        <path d="M 760 470 Q 800 400 840 470 Z" /><rect x="852" y="380" width="14" height="100" /><path d="M 852 380 L 859 360 L 866 380 Z" />
      </g>
      {SKY.map(([x, top, w], i) => (i % 2 ? [0, 1, 2].map((r) => <rect key={`${i}-${r}`} x={x + 14} y={top + 22 + r * 40} width="10" height="14" fill="#FFD9A0" opacity=".55" />) : null))}
      <rect y="640" width="1600" height="260" fill="#5B7F4A" />
      <rect y="770" width="1600" height="130" fill="#B9A88E" />
      {/* lamp post */}
      <rect x="512" y="300" width="14" height="480" fill="#2c2c34" />
      <path d="M 490 300 L 548 300 L 538 270 L 500 270 Z" fill="#2c2c34" />
      <circle cx="519" cy="320" r="120" fill="url(#lampGlow)" opacity={rain > 0 ? 0.6 + 0.4 * Math.abs(Math.sin(t * 13)) : 1} />
      {/* tree */}
      <rect x="1380" y="460" width="34" height="320" fill="#5b3a29" />
      <circle cx="1397" cy="440" r="110" fill="#3f6a3a" /><circle cx="1330" cy="480" r="70" fill="#4a7a43" /><circle cx="1460" cy="490" r="70" fill="#4a7a43" />
      {/* bench */}
      <rect x="620" y="560" width="400" height="20" rx="6" fill="#8a5d3d" /><rect x="620" y="592" width="400" height="20" rx="6" fill="#8a5d3d" />
      <rect x="610" y="640" width="420" height="22" rx="6" fill="#7A5233" />
      <rect x="640" y="660" width="16" height="120" fill="#4a3324" /><rect x="984" y="660" width="16" height="120" fill="#4a3324" />

      <Person x={790} y={800} p={{ ...RAFI, tears: t > 14.5 }} tt={t} sit mood={t < 10.8 ? "neutral" : "sad"} talk={talking(t, 13.6, 15.2)}
              arms={reaching ? "reach" : t > 15.3 ? "cover" : "down"} headDy={t > 15.3 ? 14 : 0} lookX={6} />
      {nilaX < 1750 && (
        <Person x={nilaX} y={800} p={NILA} tt={t} mood="sad" talk={talking(t, 10.6, 13.4)} back={t > 13.5}
                walk={leave > 0 && leave < 1 ? t * 9 : null} arms={leave > 0 ? "down" : "down"} lookX={-6} />
      )}
      {heart > 0 && (
        <g transform={`translate(790 ${220 - heart * 20})`} opacity={1 - prog(t, 16.8, 17.3)}>
          <path d="M 0 30 C -50 -10 -30 -50 0 -25 L -6 -5 L 6 5 L 0 30 Z" fill="#E5484D" transform={`translate(${-heart * 18} 0) rotate(${-heart * 12})`} />
          <path d="M 0 30 C 50 -10 30 -50 0 -25 L -6 -5 L 6 5 L 0 30 Z" fill="#E5484D" transform={`translate(${heart * 18} 0) rotate(${heart * 12})`} />
        </g>
      )}
      <rect width="1600" height="900" fill="#3b4250" opacity={gray} />
      {rain > 0 && (
        <g stroke="#cfe3ff" strokeWidth="2.4" opacity={0.75 * rain}>
          {Array.from({ length: 90 }, (_, i) => {
            const x = (i * 97) % 1640, y = ((i * 53 + t * 1100) % 1000) - 60;
            return <line key={i} x1={x} y1={y} x2={x - 10} y2={y + 34} />;
          })}
        </g>
      )}
      <Bubble t={t} a={10.6} b={13.4} x={1090} y={240} w={620} lines={["বাসায় বিয়ের কথা চলছে…", "আমি আর অপেক্ষা করতে পারব না।"]} tx={1010} ty={262} />
      <Bubble t={t} a={13.6} b={15.2} x={760} y={316} w={330} lines={["নীলা… দাঁড়াও…"]} tx={800} ty={336} />
    </g>
  );
}

// ================================================================ 3. Night — the notification
export function PhoneScene({ t }) {
  const buzz = t > 18.0 && t < 18.5 ? Math.sin(t * 90) * 4 : 0;
  const pick = ease(prog(t, 18.4, 18.9));
  const lit = prog(t, 18.0, 18.3);
  const phoneX = lerp(1080, 1180, 0), phoneY = 668;
  const note = ease(prog(t, 18.7, 19.2));
  const zoomIn = ease(prog(t, 20.1, 20.8));
  const z = 1 + zoomIn * 2.2;
  const mood = t < 19.4 ? "sad" : t < 19.9 ? "surprised" : "happy";
  const holding = pick >= 1;
  return (
    <g transform={`translate(800 470) scale(${z}) translate(-800 -470)`}>
      <rect width="1600" height="900" fill="#121628" />
      <rect x="140" y="140" width="250" height="270" rx="8" fill="#1d2440" /><rect x="156" y="156" width="218" height="238" fill="#0b1022" />
      <circle cx="300" cy="230" r="30" fill="#E9E6D0" opacity=".85" /><circle cx="312" cy="222" r="27" fill="#0b1022" />
      {/* bed */}
      <rect x="380" y="600" width="980" height="110" rx="24" fill="#2b3557" />
      <rect x="380" y="690" width="980" height="40" rx="12" fill="#1f2742" />
      <rect x="1180" y="560" width="160" height="70" rx="30" fill="#3a4670" />
      <Person x={800} y={840} p={RAFI} tt={t} sit mood={mood} arms={holding ? "phone" : blendArms("cover", "phone", pick)} headDy={holding ? 6 : 14}
              hold={holding ? "phone" : null} glow={holding ? 1 : 0} />
      {!holding && (
        <g transform={`translate(${lerp(phoneX, 800, pick) + buzz} ${lerp(phoneY, 538, pick)})`}>
          <rect x="-22" y="-12" width="44" height="24" rx="6" fill="#16181d" transform="rotate(0)" />
          {lit > 0 && <><rect x="-18" y="-9" width="36" height="18" rx="3" fill="#BFE3FF" opacity={lit} /><circle r="90" fill="url(#phoneGlow)" opacity={lit} /></>}
          {t > 18.0 && t < 18.5 && [26, 40].map((r) => <path key={r} d={`M ${r} -18 q 10 18 0 36 M ${-r} -18 q -10 18 0 36`} stroke="#BFE3FF" strokeWidth="3" fill="none" opacity=".7" />)}
        </g>
      )}
      <rect width="1600" height="900" fill="#000" opacity={0.25 * (1 - lit)} />
      {/* notification */}
      <g transform={`translate(800 ${lerp(-120, 74, note)})`} opacity={note}>
        <rect x="-360" y="-10" width="720" height="128" rx="28" fill="#F6F5F0" />
        <rect x="-336" y="16" width="70" height="70" rx="18" fill="#4B2FD6" />
        <DeerMark x={-301} y={51} s={1.35} />
        <text x="-246" y="44" fontSize="22" fontWeight="700" fill="#0E0F0C" fontFamily={BN}>সোনারহরিণ <tspan fontSize="18" fill="#6B6F66" fontWeight="500" fontFamily={EN}>· now</tspan></text>
        <text x="-246" y="80" fontSize="25" fontWeight="600" fill="#0E0F0C" fontFamily={BN}>৪১২টি ফ্রেশার জব — শুধু CSE-র জন্য 🎯</text>
        <text x="-246" y="106" fontSize="17" fill="#6B6F66" fontFamily={EN}>412 fresher jobs waiting for CSE graduates</text>
      </g>
      {t > 19.9 && <g transform="translate(905 330)" opacity={prog(t, 19.9, 20.1)}><circle r="26" fill="#FFE27A" /><path d="M -8 26 h 16 v 10 h -16 Z" fill="#cfcfcf" />{[0, 60, 120, 180, 240, 300].map((a) => <line key={a} x1="0" y1="-38" x2="0" y2="-50" stroke="#FFE27A" strokeWidth="4" transform={`rotate(${a})`} />)}</g>}
    </g>
  );
}

// ================================================================ 4. The app on the phone
const JOBS = [
  { t: "Junior Software Engineer", c: "Nodi Labs · Dhaka", col: "#FFC23D", l: "N", s: "৳30k–36k" },
  { t: "Trainee ML Engineer", c: "Shapla Systems · Hybrid", col: "#FFB86B", l: "S", s: "৳28k–35k" },
  { t: "QA Engineer (Fresher)", c: "Padma Pay · Dhaka", col: "#7CC4FF", l: "P", s: "৳27k–33k" },
  { t: "Frontend Developer", c: "Doyel Works · Remote", col: "#B9A6FF", l: "D", s: "৳29k–39k" },
];
const TAPS = [3.3, 4.2, 5.1];
const FEATURES = [
  { u: 1.0, bn: "১০ সেকেন্ডে লগইন", en: "Login in 10 seconds" },
  { u: 2.7, bn: "শুধু ফ্রেশার জব", en: "Only fresher jobs" },
  { u: 3.3, bn: "এক ট্যাপে অ্যাপ্লাই", en: "Apply in one tap" },
  { u: 6.0, bn: "এআই দিয়ে সিভি ঠিক", en: "CV fixed with AI" },
  { u: 8.2, bn: "ইন্টারভিউয়ের ডাক!", en: "Interview call!" },
];

function Screen({ u }) {
  const W = 348, H = 740;
  const typed = "+880 1712 345 482".slice(0, Math.floor(clamp((u - 1.25) / 0.6) * 17));
  const otp = Math.floor(clamp((u - 1.85) / 0.45) * 4);
  const applied = TAPS.filter((x) => u >= x).length;
  if (u < 1.0) {
    const k = ease(prog(u, 0, 0.5));
    return <g>
      <rect width={W} height={H} fill="#4B2FD6" />
      <DeerMark x={174} y={300} s={3.2 * (0.7 + 0.3 * k)} eye="#4B2FD6" />
      <text x="174" y="410" textAnchor="middle" fontSize="40" fontWeight="700" fill="#fff" fontFamily={BN} opacity={k}>সোনারহরিণ</text>
      <text x="174" y="446" textAnchor="middle" fontSize="18" fill="#FFC23D" fontFamily={EN} opacity={k}>first job, finally</text>
    </g>;
  }
  if (u < 2.6) {
    const pressed = u > 2.3 && u < 2.45;
    return <g>
      <rect width={W} height={H} fill="#fff" />
      <text x="28" y="130" fontSize="34" fontWeight="700" fill="#0E0F0C" fontFamily={BN}>লগইন</text>
      <text x="28" y="160" fontSize="15" fill="#6B6F66" fontFamily={EN}>Welcome to Sonarhorin</text>
      <text x="28" y="212" fontSize="14" fontWeight="700" fill="#2B2D28" fontFamily={EN}>Phone number</text>
      <rect x="28" y="222" width="292" height="56" rx="14" fill="#F6F5F0" stroke="#0E0F0C" strokeWidth="2" />
      <text x="44" y="258" fontSize="20" fill="#0E0F0C" fontFamily={EN}>{typed}{u < 1.9 && (u * 2) % 1 < 0.5 ? "|" : ""}</text>
      <text x="28" y="320" fontSize="14" fontWeight="700" fill="#2B2D28" fontFamily={EN}>OTP</text>
      {[0, 1, 2, 3].map((i) => <g key={i}><rect x={28 + i * 76} y="332" width="62" height="62" rx="14" fill={i < otp ? "#FFF1CC" : "#F6F5F0"} stroke={i < otp ? "#4B2FD6" : "#E2E0D8"} strokeWidth="2" />
        {i < otp && <text x={59 + i * 76} y="372" textAnchor="middle" fontSize="26" fontWeight="700" fill="#0E0F0C" fontFamily={EN}>{"4821"[i]}</text>}</g>)}
      <g transform={`translate(174 452) scale(${pressed ? 0.95 : 1}) translate(-174 -452)`}>
        <rect x="28" y="424" width="292" height="56" rx="28" fill="#0E0F0C" />
        <text x="174" y="459" textAnchor="middle" fontSize="18" fontWeight="700" fill="#fff" fontFamily={EN}>Continue →</text>
      </g>
      {u > 2.42 && <g opacity={prog(u, 2.42, 2.5)}><rect x="54" y="510" width="240" height="46" rx="23" fill="#FFC23D" /><text x="174" y="540" textAnchor="middle" fontSize="18" fontWeight="700" fill="#0E0F0C" fontFamily={BN}>✓ স্বাগতম, রাফি!</text></g>}
    </g>;
  }
  if (u < 5.9) {
    return <g>
      <rect width={W} height={H} fill="#F6F5F0" />
      <rect width={W} height="112" fill="#4B2FD6" />
      <text x="22" y="62" fontSize="25" fontWeight="700" fill="#fff" fontFamily={EN}>412 fresher jobs</text>
      <text x="22" y="90" fontSize="15" fill="#FFC23D" fontFamily={EN}>CSE · Dhaka · 0 yrs experience</text>
      {applied > 0 && <g><rect x="250" y="38" width="84" height="32" rx="16" fill="#FFC23D" /><text x="292" y="60" textAnchor="middle" fontSize="15" fontWeight="800" fill="#0E0F0C" fontFamily={EN}>Applied {applied}</text></g>}
      {JOBS.map((j, i) => {
        const y = 126 + i * 156, done = u >= (TAPS[i] ?? 99);
        const k = ease(prog(u, 2.6 + i * 0.12, 2.9 + i * 0.12));
        return <g key={i} transform={`translate(${(1 - k) * 60} 0)`} opacity={k}>
          <rect x="12" y={y} width="324" height="142" rx="18" fill="#fff" stroke="#E2E0D8" strokeWidth="2" />
          <rect x="26" y={y + 16} width="50" height="50" rx="12" fill={j.col} stroke="#0E0F0C" strokeWidth="2" />
          <text x="51" y={y + 49} textAnchor="middle" fontSize="22" fontWeight="800" fill="#0E0F0C" fontFamily={EN}>{j.l}</text>
          <text x="90" y={y + 36} fontSize="17" fontWeight="700" fill="#0E0F0C" fontFamily={EN}>{j.t}</text>
          <text x="90" y={y + 58} fontSize="14" fill="#6B6F66" fontFamily={EN}>{j.c}</text>
          <rect x="26" y={y + 84} width="88" height="26" rx="13" fill="#FFF1CC" /><text x="70" y={y + 102} textAnchor="middle" fontSize="13" fontWeight="700" fill="#2f5d0c" fontFamily={EN}>0 yrs exp</text>
          <text x="124" y={y + 102} fontSize="14" fontWeight="700" fill="#0E0F0C" fontFamily={EN}>{j.s}</text>
          <rect x="214" y={y + 84} width="108" height="38" rx="19" fill={done ? "#6B4EFF" : "#0E0F0C"} />
          <text x="268" y={y + 109} textAnchor="middle" fontSize="15" fontWeight="700" fill="#fff" fontFamily={EN}>{done ? "Applied ✓" : "Apply"}</text>
        </g>;
      })}
    </g>;
  }
  if (u < 8.0) {
    const v = lerp(80, 18, ease(prog(u, 6.3, 7.6)));
    const ang = Math.PI * (1 - v / 100);
    const col = v > 55 ? "#E5484D" : v > 35 ? "#E8A317" : "#6B4EFF";
    const arc = (val) => { const a = Math.PI * (1 - val / 100); return `${174 + 120 * Math.cos(a)} ${330 - 120 * Math.sin(a)}`; };
    return <g>
      <rect width={W} height={H} fill="#fff" />
      <text x="24" y="110" fontSize="28" fontWeight="700" fill="#0E0F0C" fontFamily={EN}>CV check</text>
      <text x="24" y="138" fontSize="15" fill="#6B6F66" fontFamily={EN}>Rafi_CV.pdf · Junior Software Engineer</text>
      <path d="M 54 330 A 120 120 0 0 1 294 330" stroke="#E2E0D8" strokeWidth="26" fill="none" strokeLinecap="round" />
      <path d={`M 54 330 A 120 120 0 0 1 ${arc(v)}`} stroke={col} strokeWidth="26" fill="none" strokeLinecap="round" />
      <line x1="174" y1="330" x2={174 + 92 * Math.cos(ang)} y2={330 - 92 * Math.sin(ang)} stroke="#0E0F0C" strokeWidth="6" strokeLinecap="round" />
      <circle cx="174" cy="330" r="10" fill="#0E0F0C" />
      <text x="174" y="398" textAnchor="middle" fontSize="48" fontWeight="800" fill={col} fontFamily={EN}>{Math.round(v)}%</text>
      <text x="174" y="424" textAnchor="middle" fontSize="15" fill="#6B6F66" fontFamily={EN}>chance of rejection</text>
      {["Added GitHub & LinkedIn", "Numbers in every project", "Removed personal details"].map((s, i) => (
        <g key={s} opacity={prog(u, 6.5 + i * 0.45, 6.7 + i * 0.45)}>
          <rect x="24" y={470 + i * 64} width="300" height="50" rx="14" fill="#FFF7E3" />
          <circle cx="50" cy={495 + i * 64} r="12" fill="#6B4EFF" /><path d={`M 44 ${495 + i * 64} l 4 5 l 8 -9`} stroke="#fff" strokeWidth="3" fill="none" />
          <text x="72" y={501 + i * 64} fontSize="16" fontWeight="600" fill="#0E0F0C" fontFamily={EN}>{s}</text>
        </g>
      ))}
    </g>;
  }
  const drop = ease(prog(u, 8.05, 8.4));
  const confirm = u > 9.6;
  return <g>
    <rect width={W} height={H} fill="#F3FBE3" />
    <g transform={`translate(0 ${lerp(-120, 0, drop)})`}>
      <rect x="12" y="44" width="324" height="84" rx="20" fill="#fff" stroke="#E2E0D8" strokeWidth="2" />
      <text x="30" y="80" fontSize="18" fontWeight="800" fill="#0E0F0C" fontFamily={EN}>🎉 Interview invite</text>
      <text x="30" y="106" fontSize="15" fill="#6B6F66" fontFamily={EN}>Padma Pay · Junior Software Engineer</text>
    </g>
    <g opacity={prog(u, 8.4, 8.8)}>
      <rect x="24" y="170" width="300" height="360" rx="24" fill="#fff" stroke="#0E0F0C" strokeWidth="2" />
      <rect x="128" y="200" width="92" height="96" rx="14" fill="#fff" stroke="#0E0F0C" strokeWidth="2" />
      <rect x="128" y="200" width="92" height="28" rx="12" fill="#E5484D" />
      <text x="174" y="220" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff" fontFamily={EN}>SUN</text>
      <text x="174" y="278" textAnchor="middle" fontSize="40" fontWeight="800" fill="#0E0F0C" fontFamily={EN}>02</text>
      <text x="174" y="338" textAnchor="middle" fontSize="22" fontWeight="800" fill="#0E0F0C" fontFamily={EN}>Sunday · 11:00 AM</text>
      <text x="174" y="366" textAnchor="middle" fontSize="15" fill="#6B6F66" fontFamily={EN}>Padma Pay (demo) · Gulshan</text>
      <text x="174" y="390" textAnchor="middle" fontSize="15" fill="#6B6F66" fontFamily={EN}>Junior Software Engineer</text>
      <rect x="54" y="430" width="240" height="56" rx="28" fill={confirm ? "#6B4EFF" : "#0E0F0C"} />
      <text x="174" y="465" textAnchor="middle" fontSize="18" fontWeight="700" fill="#fff" fontFamily={EN}>{confirm ? "Confirmed ✓" : "Confirm interview"}</text>
    </g>
    {confirm && Array.from({ length: 26 }, (_, i) => {
      const k = prog(u, 9.6, 10.6), x = 30 + ((i * 53) % 290), y = 160 + k * (300 + (i % 5) * 60);
      return <rect key={i} x={x} y={y} width="10" height="5" fill={["#FFC23D", "#E5484D", "#7CC4FF", "#E8B634"][i % 4]} transform={`rotate(${i * 40 + k * 300} ${x} ${y})`} opacity={1 - k * 0.6} />;
    })}
  </g>;
}

function tapTarget(u) {
  // finger position (screen coords) for taps: login button, then three Apply buttons, then confirm
  const pts = [[2.35, 174, 452], ...TAPS.map((x, i) => [x, 268, 126 + i * 156 + 103]), [9.6, 174, 458]];
  for (const [at, x, y] of pts) if (u > at - 0.45 && u < at + 0.35) return { x, y, k: clamp((u - (at - 0.45)) / 0.45), r: prog(u, at, at + 0.35) };
  return null;
}

export function AppScene({ t }) {
  const u = t - SC.app[0];
  const intro = ease(prog(u, 0, 0.5));
  const pz = lerp(1.5, 1, intro);
  const buzz = u > 8.05 && u < 8.4 ? Math.sin(u * 120) * 3 : 0;
  const finger = tapTarget(u);
  const face = u < 1 ? "surprised" : u < 3.3 ? "neutral" : "happy";
  return (
    <g>
      <rect width="1600" height="900" fill="url(#appBg)" />
      {[[180, 160, 70, "#FFC23D"], [1400, 760, 90, "#7CC4FF"], [1300, 140, 50, "#FFB86B"], [140, 780, 60, "#B9A6FF"]].map(([x, y, r, c], i) => (
        <circle key={i} cx={x + Math.sin(t * 0.6 + i) * 20} cy={y + Math.cos(t * 0.5 + i) * 16} r={r} fill={c} opacity=".35" />
      ))}
      {/* Rafi's reaction */}
      <g opacity={intro}>
        <circle cx="300" cy="450" r="171" fill="#fff" stroke="#0E0F0C" strokeWidth="6" />
        <g clipPath="url(#bust)"><rect x="130" y="280" width="340" height="340" fill="#FFF1CC" /><Person x={300} y={935} p={RAFI} tt={t} mood={face} arms="down" /></g>
        <rect x="200" y="640" width="200" height="40" rx="20" fill="#0E0F0C" />
        <text x="300" y="667" textAnchor="middle" fontSize="18" fontWeight="700" fill="#fff" fontFamily={EN}>Rafi · CSE '26</text>
        {u > 8.2 && <text x="300" y="250" textAnchor="middle" fontSize="54" opacity={prog(u, 8.2, 8.5)}>🤩</text>}
      </g>
      {/* phone */}
      <g transform={`translate(${800 + buzz} 450) scale(${pz}) translate(-800 -450)`}>
        <rect x="604" y="54" width="392" height="792" rx="56" fill="#0E0F0C" />
        <rect x="610" y="60" width="380" height="780" rx="50" fill="#1c1d20" />
        <g transform="translate(626 80)">
          <g clipPath="url(#scr)"><Screen u={u} />
            <text x="24" y="28" fontSize="14" fontWeight="700" fill={u < 1 || (u > 2.6 && u < 5.9) ? "#fff" : "#0E0F0C"} fontFamily={EN}>11:42</text>
          </g>
          {finger && <g>
            <circle cx={finger.x} cy={finger.y} r={14 + finger.r * 34} fill="none" stroke="#6B4EFF" strokeWidth="3" opacity={finger.r > 0 ? 1 - finger.r : 0} />
            <circle cx={finger.x} cy={finger.y} r={lerp(30, 20, finger.k)} fill="#0E0F0C" opacity={0.18 + 0.2 * finger.k} />
          </g>}
        </g>
        <rect x="750" y="68" width="100" height="22" rx="11" fill="#0E0F0C" />
      </g>
      {/* feature checklist */}
      <g>
        {FEATURES.map((f, i) => {
          const k = ease(prog(u, f.u, f.u + 0.35));
          if (k <= 0) return null;
          const y = 230 + i * 104;
          return <g key={f.en} opacity={k} transform={`translate(${(1 - k) * 40} 0)`}>
            <circle cx="1090" cy={y} r="26" fill="#FFC23D" stroke="#0E0F0C" strokeWidth="3" />
            <path d={`M 1078 ${y} l 8 9 l 16 -18`} stroke="#0E0F0C" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <text x="1136" y={y + 4} fontSize="34" fontWeight="700" fill="#0E0F0C" fontFamily={BN}>{f.bn}</text>
            <text x="1136" y={y + 34} fontSize="19" fill="#6B6F66" fontFamily={EN}>{f.en}</text>
          </g>;
        })}
      </g>
    </g>
  );
}

// ================================================================ 5. Office — hired
export function OfficeScene({ t }) {
  const walkIn = prog(t, 31.4, 32.2);
  const rx = lerp(320, 750, ease(walkIn));
  const shaking = t > 32.4 && t < 34.6;
  const sh = shaking ? Math.sin(t * 14) * 9 : 0;
  const card = ease(prog(t, 34.4, 34.9));
  const stamp = prog(t, 35.0, 35.25);
  const jump = t > 35.2 ? -Math.abs(Math.sin((t - 35.2) * 7)) * 34 : 0;
  const rafiArms = shaking ? { L: [[-80, -330], [-84, -240]], R: [[110, -300], [165, -252 + sh]] } : t > 35.2 ? "cheer" : "down";
  const hrArms = shaking ? { L: [[-110, -300], [-165, -252 + sh]], R: [[80, -330], [84, -240]] } : "down";
  return (
    <g transform={zoom(t, SC.office, 0.035)}>
      <rect width="1600" height="700" fill="#E8F1FB" />
      <rect y="700" width="1600" height="200" fill="#B7C3D0" />
      <rect x="120" y="110" width="520" height="300" rx="8" fill="#fff" /><rect x="134" y="124" width="492" height="272" fill="#BFE0FF" />
      <g fill="#8fb4d8">{[[150, 250, 60], [220, 200, 70], [300, 280, 50], [360, 170, 80], [450, 240, 60], [520, 210, 90]].map(([x, y, w], i) => <rect key={i} x={x} y={y} width={w} height={396 - y} />)}</g>
      <rect x="1280" y="140" width="190" height="120" rx="8" fill="#4B2FD6" />
      <text x="1375" y="210" textAnchor="middle" fontSize="28" fontWeight="800" fill="#FFC23D" fontFamily={EN}>Padma Pay</text>
      <g transform="translate(1440 560)"><rect x="-30" y="0" width="60" height="140" rx="10" fill="#d9c7a8" /><circle cx="0" cy="-30" r="60" fill="#5b8f4f" /><circle cx="-36" cy="-4" r="36" fill="#6aa15c" /></g>
      <Person x={1080} y={820} p={HR} tt={t} sit mood="happy" talk={talking(t, 32.0, 34.4)} arms={hrArms} />
      <rect x="870" y="600" width="560" height="34" rx="6" fill="#5c6b7c" />
      <rect x="890" y="634" width="520" height="220" fill="#6f8092" />
      <rect x="1140" y="560" width="120" height="44" rx="4" fill="#2f3b52" />
      <Person x={rx} y={820 + jump} p={RAFI_FORMAL} tt={t} mood={t < 32.3 ? "neutral" : "happy"} arms={rafiArms} walk={walkIn > 0 && walkIn < 1 ? t * 10 : null} hold={t > 35.2 ? "letter" : null} />
      <Bubble t={t} a={32.0} b={34.4} x={1080} y={300} w={520} lines={["অভিনন্দন! আপনি সিলেক্টেড।"]} tx={1080} ty={322} />
      {card > 0 && (
        <g transform={`translate(1150 340) scale(${0.7 + 0.3 * card}) rotate(${4 - 4 * card})`} opacity={card}>
          <rect x="-250" y="-200" width="500" height="380" rx="20" fill="#fff" stroke="#0E0F0C" strokeWidth="4" />
          <rect x="-250" y="-200" width="500" height="74" rx="20" fill="#4B2FD6" /><rect x="-250" y="-150" width="500" height="24" fill="#4B2FD6" />
          <text x="-220" y="-152" fontSize="30" fontWeight="800" fill="#FFC23D" fontFamily={EN}>OFFER LETTER</text>
          <text x="-220" y="-80" fontSize="24" fontWeight="700" fill="#0E0F0C" fontFamily={EN}>Junior Software Engineer</text>
          <text x="-220" y="-48" fontSize="19" fill="#6B6F66" fontFamily={EN}>Padma Pay (demo) · Dhaka</text>
          {[-6, 22, 50].map((y) => <rect key={y} x="-220" y={y} width={y === 50 ? 220 : 400} height="12" rx="6" fill="#E2E0D8" />)}
          <text x="-220" y="130" fontSize="22" fontWeight="700" fill="#0E0F0C" fontFamily={BN}>স্বাগতম, রাফি!</text>
          {stamp > 0 && (
            <g transform={`translate(130 100) rotate(-14) scale(${lerp(2.2, 1, stamp)})`} opacity={stamp}>
              <rect x="-100" y="-38" width="200" height="76" rx="8" fill="none" stroke="#E5484D" strokeWidth="7" />
              <text x="0" y="16" textAnchor="middle" fontSize="44" fontWeight="900" fill="#E5484D" fontFamily={EN}>HIRED</text>
            </g>
          )}
        </g>
      )}
    </g>
  );
}

// ================================================================ 6. Family photo
export function PhotoScene({ t }) {
  const run = prog(t, 39.7, 40.6);
  const rx = lerp(400, 985, ease(run));
  const pressing = t > 39.25 && t < 39.7;
  const count = t > 39.7 && t < 41.6 ? 3 - Math.floor((t - 39.7) / 0.63) : null;
  const flash = t > 41.6 ? 1 - prog(t, 41.6, 41.95) : 0;
  const pol = ease(prog(t, 41.7, 42.4));
  const posed = t > 40.6;
  const sc = lerp(1, 0.6, pol);
  const ty = lerp(450, 410, pol);
  return (
    <g>
      <rect width="1600" height="900" fill="#1a1410" />
      <g transform={`translate(800 ${ty}) rotate(${-4 * pol}) scale(${sc}) translate(-800 -450)`}>
        {pol > 0 && <><rect x="-50" y="-50" width="1700" height="1180" rx="10" fill="#FDFCF7" opacity={pol} />
          <text x="800" y="1040" textAnchor="middle" fontSize="64" fontWeight="700" fill="#0E0F0C" fontFamily={BN} opacity={pol}>আমাদের প্রথম চাকরির ছবি · ২০২৬</text></>}
        <rect width="1600" height="900" fill="#F7E7C9" />
        <rect y="720" width="1600" height="180" fill="#C49A6C" />
        <path d="M 0 60 Q 800 230 1600 60" stroke="#3f6a3a" strokeWidth="4" fill="none" />
        {Array.from({ length: 32 }, (_, i) => { const x = i * 52 + 10, y = 60 + 170 * (1 - Math.pow((x - 800) / 800, 2)) * 1; return <circle key={i} cx={x} cy={y} r="13" fill={i % 2 ? "#F59E0B" : "#FACC15"} />; })}
        <rect x="1300" y="250" width="240" height="190" rx="8" fill="#fff" /><rect x="1314" y="264" width="212" height="162" fill="#BFE0FF" /><circle cx="1480" cy="310" r="26" fill="#FFE27A" />
        <rect x="460" y="520" width="900" height="200" rx="40" fill="#4B2FD6" /><rect x="430" y="600" width="960" height="130" rx="40" fill="#6B4EFF" />
        <Person x={610} y={820} p={BABA} tt={t} mood="happy" talk={talking(t, 37.0, 38.9)} arms={posed ? "fist" : "hips"} />
        <Person x={800} y={820} p={MA} tt={t} mood="happy" talk={talking(t, 39.0, 40.4)} arms="tray" hold="tray" />
        <Person x={1170} y={820} p={NILA} tt={t} mood="happy" talk={talking(t, 40.4, 41.6)} arms={posed ? "wave" : "down"} />
        {/* tripod camera */}
        <g opacity={1 - pol}>
          <line x1="215" y1="640" x2="150" y2="880" stroke="#2b2b2b" strokeWidth="9" /><line x1="215" y1="640" x2="280" y2="880" stroke="#2b2b2b" strokeWidth="9" /><line x1="215" y1="640" x2="215" y2="885" stroke="#2b2b2b" strokeWidth="9" />
          <rect x="160" y="570" width="110" height="74" rx="12" fill="#222" /><rect x="270" y="588" width="34" height="40" rx="6" fill="#333" /><circle cx="300" cy="608" r="14" fill="#7CC4FF" opacity=".7" />
          <circle cx="178" cy="584" r="6" fill={count && (t * 4) % 1 < 0.5 ? "#E5484D" : "#552222"} />
          {count && <text x="215" y="520" textAnchor="middle" fontSize={90 + 30 * (1 - ((t - 39.7) % 0.63) / 0.63)} fontWeight="900" fill="#E5484D" fontFamily={EN} opacity={0.9}>{count}</text>}
        </g>
        <Person x={rx} y={posed ? 820 : 836} p={RAFI_FORMAL} tt={t} mood="happy" lookX={run > 0 ? 0 : -6}
                arms={pressing ? "pointL" : posed ? "letter" : run > 0 ? "run" : "down"} walk={run > 0 && run < 1 ? t * 12 : null} hold={posed ? "letter" : null} />
        <Bubble t={t} a={37.0} b={38.9} x={600} y={232} w={500} lines={["আমার ছেলে চাকরি পেয়েছে!"]} tx={610} ty={262} />
        <Bubble t={t} a={39.0} b={40.4} x={840} y={232} w={360} lines={["সবাই মিষ্টি খাও!"]} tx={800} ty={262} />
        <Bubble t={t} a={40.4} b={41.6} x={1200} y={232} w={470} lines={["আমি জানতাম তুমি পারবে!"]} tx={1170} ty={262} />
      </g>
      {pol > 0.2 && Array.from({ length: 90 }, (_, i) => {
        const k = t - 41.8, x = (i * 137) % 1600 + Math.sin(k * 2 + i) * 30, y = -40 + ((k * (180 + (i % 7) * 40) + i * 23) % 980);
        return <rect key={i} x={x} y={y} width="16" height="8" rx="2" fill={["#FFC23D", "#E5484D", "#7CC4FF", "#E8B634", "#FF8FB1"][i % 5]} transform={`rotate(${i * 33 + k * 200} ${x} ${y})`} />;
      })}
      <rect width="1600" height="900" fill="#fff" opacity={flash} />
    </g>
  );
}
