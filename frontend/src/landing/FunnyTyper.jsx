import { useEffect, useRef, useState } from "react";

// Funny Bangla one-liners about the fresher job hunt. Text inside *stars* is highlighted,
// "|" is a line break, and a trailing emoji pops when it lands.
export const HEADLINES = [
  "অভিজ্ঞতা চায় *৫ বছর*,|আমার বয়সই তো ২৩! 🤡",
  "*৪৭টা সিভি*, ০টা কল —|এবার গল্পটা বদলাবে। 🔥",
  "এইচআর *Seen* করে,|রিপ্লাই করে না। 💔",
  "আম্মু: “চাকরি কবে?”|আমি: “*এই তো, আসছে!*” 😎",
  "বেকার না, আমি এখন|*ক্যারিয়ার লোডিং…* ⏳",
  "রেফারেন্স নেই?|*তোমার সিভিই* এখন রেফারেন্স। 💪",
  "ঈদের আগেই চাকরি —|*আত্মীয়দের প্রশ্ন* শেষ! 🎉",
  "বিসিএসের লাইনে ৩ বছর?|এবার *প্ল্যান বি* রেডি। 🚀",
  "সোনার হরিণ ধরা যায় —|*শুধু ঠিক দিকে দৌড়াও।* 🦌",
];

export const INTERN_HEADLINES = [
  "ইন্টার্নশিপ চায় *অভিজ্ঞতা*,|অভিজ্ঞতা চায় ইন্টার্নশিপ! 🔄",
  "*আনপেইড* ইন্টার্নশিপ?|বাস ভাড়াটা অন্তত দাও! 🚌",
  "সিনিয়র ভাই: “*রেফার করব*”…|ছয় মাস ধরে করছেন। 🙃",
  "থিসিস, টিউশনি, ইন্টার্নশিপ —|*একসাথে সব* চলছে! 🤹",
  "প্রথম ইন্টার্নশিপ মানে প্রথম *অভিজ্ঞতা*।|লুপটা এখানেই ভাঙো। ✈️",
];

export const STARTUP_HEADLINES = [
  "আম্মু: “*চাকরি কর!*”|আমি: “চাকরি *দিব*!” 🚀",
  "মাথায় *১০০টা আইডিয়া*,|পকেটে ০ টাকা। 💸",
  "বন্ধুরা বলে *পাগল*,|ইনভেস্টর বলবে *জিনিয়াস*। 😎",
  "পড়ায় মন নেই?|হয়তো তুমি *ফাউন্ডার*। 💡",
  "একটা আইডিয়া, একটা পিচ —|*ফান্ড এখানেই।* 🦌",
];

export const HEADLINES_EN = [
  "“Entry level” —|*5 years* experience? 🤡",
  "*47 CVs*, 0 calls.|This time it changes. 🔥",
  "HR left me on *Seen*.|Not anymore. 💔",
  "Not jobless —|*career loading…* ⏳",
  "No contacts?|*Your CV* is the referral now. 💪",
  "Catch the golden deer —|*just run the right way.* 🦌",
];
export const INTERN_HEADLINES_EN = [
  "Internships want *experience*.|Experience wants an internship. 🔄",
  "*Unpaid* internship?|At least pay the bus fare! 🚌",
  "First internship =|first *real experience*. ✈️",
  "Break the loop|*right here.* 🦌",
];
export const STARTUP_HEADLINES_EN = [
  "Mom: “*Get a job!*”|Me: “I'll *create* jobs.” 🚀",
  "*100 ideas*,|zero taka. 💸",
  "Friends say *crazy*.|Investors say *genius*. 😎",
  "One idea, one pitch —|*funding is here.* 🦌",
];

export const LINES = [
  "চাকরির বিজ্ঞাপন: *ফ্রেশার চাই*, অভিজ্ঞতা মাত্র ৫ বছর। 🤡",
  "৪৭টা সিভি পাঠালাম। উত্তর দিল শুধু *মামা* — “কিছু হলো?” 😩",
  "আম্মু: “পাশের বাসার রাহাত তো *চাকরি পেয়ে গেল!*” 🙃",
  "HR আমার মেসেজ *Seen* করে, রিপ্লাই করে না — এটাই কি প্রেম? 💔",
  "ইন্টারভিউ: “৫ বছর পর নিজেকে কোথায় দেখেন?” আমি: “*এই চাকরিটাতেই*, প্লিজ।” 🙏",
  "বিসিএস প্রস্তুতি ৩ বছর। ধৈর্য ১০০%, *চুল ৬০%*। 👨‍🦲",
  "ঈদে আত্মীয়দের প্রশ্ন: “*এখন কী করো?*” — এবার উত্তর রেডি থাকবে। 😎",
  "আমার একমাত্র রেফারেন্স: *আম্মু*। তিনিও বলেন “চেষ্টা করো।” 😅",
  "এখানে অভিজ্ঞতা লাগে না, *শুধু সাহস লাগে*। চলো, সোনার হরিণ ধরি! 🦌",
];

const seg = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter("bn", { granularity: "grapheme" }) : null;
const graphemes = (s) => (seg ? Array.from(seg.segment(s), (x) => x.segment) : Array.from(s));

/** Parse "*highlight*" markup into graphemes tagged with their style. */
function parse(line) {
  const out = []; let em = false;
  for (const g of graphemes(line)) {
    if (g === "*") { em = !em; continue; }
    if (g === "|") { out.push({ g: "", br: true }); continue; }
    out.push({ g, em });
  }
  // the trailing emoji pops
  const last = out.length - 1;
  if (last >= 0 && /\p{Extended_Pictographic}/u.test(out[last].g)) out[last].pop = true;
  return out;
}

const TYPE_MS = 24, DELETE_MS = 9, HOLD_MS = 2300, GAP_MS = 260;

/** Types each line very fast, holds, deletes fast, moves on. Loops forever. */
export default function FunnyTyper({ lines = LINES, className = "typer", typeMs = TYPE_MS, holdMs = HOLD_MS }) {
  const parsed = useRef(lines.map(parse));
  const [i, setI] = useState(0);
  const [n, setN] = useState(0);
  const [phase, setPhase] = useState("type"); // type | hold | delete
  const reduce = typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const cur = parsed.current[i];
    if (reduce) { setN(cur.length); const id = setTimeout(() => { setI((i + 1) % lines.length); }, 4200); return () => clearTimeout(id); }
    let id;
    if (phase === "type") {
      if (n < cur.length) id = setTimeout(() => setN(n + 1), typeMs + (cur[n]?.g === " " ? 0 : Math.random() * 16));
      else id = setTimeout(() => setPhase("hold"), 0);
    } else if (phase === "hold") {
      id = setTimeout(() => setPhase("delete"), holdMs);
    } else if (n > 0) {
      id = setTimeout(() => setN(Math.max(0, n - 2)), DELETE_MS);
    } else {
      id = setTimeout(() => { setI((i + 1) % lines.length); setPhase("type"); }, GAP_MS);
    }
    return () => clearTimeout(id);
  }, [i, n, phase, reduce, lines.length, typeMs, holdMs]);

  const cur = parsed.current[i].slice(0, n);
  // group consecutive graphemes with the same style into spans
  const groups = [];
  for (const c of cur) {
    const kind = c.br ? "br" : c.pop ? "pop" : c.em ? "em" : "t";
    const lastG = groups[groups.length - 1];
    if (lastG && lastG.kind === kind && kind !== "pop" && kind !== "br") lastG.s += c.g; else groups.push({ kind, s: c.g });
  }
  return (
    <p className={`${className} ${phase}`} aria-hidden="true">
      <span>
        {groups.map((g, k) => g.kind === "br" ? <br key={k} /> : g.kind === "t" ? <span key={k}>{g.s}</span> : <span key={k} className={g.kind}>{g.s}</span>)}
        <i className="caret" />
      </span>
    </p>
  );
}
