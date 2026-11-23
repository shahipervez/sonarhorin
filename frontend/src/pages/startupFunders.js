/**
 * Who funds startups — Bangladesh + global.
 * সোনারহরিণ is NOT one of them: we help founders get ready and apply.
 * Figures checked Nov 2026 from each funder's own page or national press. Terms change — keep `checked` up to date.
 *
 * stage: which founder stages it fits — idea | mvp | traction
 * kind:  grant | govvc | angels | accel | vc | credits
 */
export const FUNDERS_CHECKED = "Nov 2026";

export const FUNDERS = [
  // ---------------- Bangladesh ----------------
  {
    id: "ictd-grant", region: "bd", kind: "grant", equityFree: true, stage: ["idea", "mvp", "traction"],
    name: "ICT Division Startup Grant", by: ["Government of Bangladesh", "বাংলাদেশ সরকার"],
    gives: ["৳1L – ৳50L grant", "৳১ লাখ – ৳৫০ লাখ অনুদান"],
    note: ["Idea ৳1–3L · MVP ৳3–10L · readiness ৳10–30L", "আইডিয়া ৳১–৩ লাখ · MVP ৳৩–১০ লাখ · রেডিনেস ৳১০–৩০ লাখ"],
    url: "https://ictd.gov.bd/",
  },
  {
    id: "idea", region: "bd", kind: "grant", equityFree: true, stage: ["idea", "mvp"],
    name: "iDEA Project", by: ["Bangladesh Computer Council", "বাংলাদেশ কম্পিউটার কাউন্সিল"],
    gives: ["Up to ৳10L grant", "৳১০ লাখ পর্যন্ত অনুদান"],
    note: ["Student teams have won pre-seed grants here", "শিক্ষার্থীদের টিমও এখান থেকে প্রি-সিড পেয়েছে"],
    url: "https://idea.gov.bd/",
  },
  {
    id: "sbl", region: "bd", kind: "govvc", equityFree: false, stage: ["mvp", "traction"],
    name: "Startup Bangladesh Ltd", by: ["Govt venture capital, ICT Division", "সরকারি ভেঞ্চার ক্যাপিটাল"],
    gives: ["Equity investment", "ইকুইটি বিনিয়োগ"],
    note: ["Apply online — no direct loans", "অনলাইনে আবেদন — সরাসরি লোন দেয় না"],
    url: "https://startupbangladesh.vc/contact/apply-for-investment",
  },
  {
    id: "ban", region: "bd", kind: "angels", equityFree: false, stage: ["mvp", "traction"],
    name: "Bangladesh Angels Network", by: ["Angel investors, Dhaka", "অ্যাঞ্জেল ইনভেস্টর, ঢাকা"],
    gives: ["$50K – $500K first check", "$৫০K – $৫০০K প্রথম চেক"],
    note: ["Any startup with a Bangladesh link", "বাংলাদেশের সাথে যোগ থাকলেই"],
    url: "https://www.bdangels.co/",
  },
  {
    id: "udyog", region: "bd", kind: "grant", equityFree: false, stage: ["idea", "mvp"],
    name: "Bangladesh Bank Udyog", by: ["Bangladesh Bank, via banks", "বাংলাদেশ ব্যাংক, ব্যাংকের মাধ্যমে"],
    gives: ["Up to ৳20L (half loan, half grant)", "৳২০ লাখ পর্যন্ত (অর্ধেক লোন, অর্ধেক অনুদান)"],
    note: ["Age 28 or under · watch for the next round", "বয়স ২৮ বা কম · পরের রাউন্ডের দিকে নজর রাখো"],
    url: "https://www.bb.org.bd/",
  },
  // ---------------- Global ----------------
  {
    id: "yc", region: "global", kind: "accel", equityFree: false, stage: ["idea", "mvp", "traction"],
    name: "Y Combinator", by: ["Accelerator, San Francisco", "অ্যাক্সেলারেটর, সান ফ্রান্সিসকো"],
    gives: ["$500K standard deal", "$৫০০K স্ট্যান্ডার্ড ডিল"],
    note: ["$125K for 7% + $375K uncapped SAFE", "$১২৫K-এ ৭% + $৩৭৫K আনক্যাপড SAFE"],
    url: "https://www.ycombinator.com/apply",
  },
  {
    id: "techstars", region: "global", kind: "accel", equityFree: false, stage: ["mvp", "traction"],
    name: "Techstars", by: ["Accelerator, worldwide", "অ্যাক্সেলারেটর, বিশ্বজুড়ে"],
    gives: ["$220K (Asia-Pacific: $100K)", "$২২০K (এশিয়া-প্যাসিফিক: $১০০K)"],
    note: ["3-month program, mentors, investor network", "৩ মাসের প্রোগ্রাম, মেন্টর, ইনভেস্টর নেটওয়ার্ক"],
    url: "https://www.techstars.com/accelerators",
  },
  {
    id: "antler", region: "global", kind: "vc", equityFree: false, stage: ["idea"],
    name: "Antler", by: ["Day-zero investor, 25+ cities", "ডে-জিরো ইনভেস্টর, ২৫+ শহর"],
    gives: ["Pre-seed check (varies by country)", "প্রি-সিড চেক (দেশভেদে আলাদা)"],
    note: ["Backs you before the idea is final; co-founder matching", "আইডিয়া চূড়ান্ত হওয়ার আগেই; কো-ফাউন্ডার ম্যাচিং"],
    url: "https://www.antler.co/apply",
  },
  {
    id: "surge", region: "global", kind: "vc", equityFree: false, stage: ["traction"],
    name: "Surge by Peak XV", by: ["Seed program, India & SE Asia", "সিড প্রোগ্রাম, ভারত ও দক্ষিণ-পূর্ব এশিয়া"],
    gives: ["$500K – $5M seed", "$৫০০K – $৫M সিড"],
    note: ["For teams with real traction", "আসল ট্র্যাকশন থাকা টিমের জন্য"],
    url: "https://surge.peakxv.com/",
  },
  {
    id: "google", region: "global", kind: "credits", equityFree: true, stage: ["traction"],
    name: "Google for Startups Accelerator", by: ["Google", "গুগল"],
    gives: ["Equity-free mentoring + cloud credits", "ইকুইটি-ফ্রি মেন্টরিং + ক্লাউড ক্রেডিট"],
    note: ["Regional cohorts, seed to Series A", "আঞ্চলিক ব্যাচ, সিড থেকে সিরিজ A"],
    url: "https://startup.google.com/programs/accelerator/",
  },
  {
    id: "msft", region: "global", kind: "credits", equityFree: true, stage: ["idea", "mvp", "traction"],
    name: "Microsoft for Startups", by: ["Microsoft", "মাইক্রোসফট"],
    gives: ["$5K Azure credits to start", "শুরুতে $৫K Azure ক্রেডিট"],
    note: ["~$100K+ if your investor is in their network", "ইনভেস্টর তাদের নেটওয়ার্কে থাকলে ~$১০০K+"],
    url: "https://www.microsoft.com/en-us/startups",
  },
];

export const KIND = {
  grant: ["Grant", "অনুদান"], govvc: ["Govt VC", "সরকারি VC"], angels: ["Angels", "অ্যাঞ্জেল"],
  accel: ["Accelerator", "অ্যাক্সেলারেটর"], vc: ["Venture", "ভেঞ্চার"], credits: ["Big Tech", "বিগ টেক"],
};

/** Map a pitch's stage (Pitch.STAGES) to the founder stages used above. */
export const stageOf = (pitchStage) => ({ idea: "idea", prototype: "mvp", users: "traction", revenue: "traction" }[pitchStage] || "idea");

// real startup stories on YouTube (IDs checked)
export const VIDEOS = [
  { id: "CBYhVcO4WgI", t: ["How to Start a Startup — Lecture 1", "কিভাবে স্টার্টআপ শুরু করবে — লেকচার ১"], by: "Sam Altman & Dustin Moskovitz · Y Combinator" },
  { id: "lw2X3PxKlAY", t: ["How to pitch your seed-stage startup", "সিড-স্টেজ স্টার্টআপ কিভাবে পিচ করবে"], by: "Michael Seibel (Y Combinator) · SaaStr" },
];
export const BD_STORY = { url: "https://www.ted.com/talks/hussain_m_elius_taking_a_startup_from_zero_to_one", t: ["Pathao: taking a startup from zero to one", "পাঠাও: শূন্য থেকে এক"], by: "Hussain M Elius · TED" };
