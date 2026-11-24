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

// World's biggest startup funding stories on YouTube (Verified Official Talks & Case-Studies)
export const VIDEOS = [
  {
    id: "1Ut6RouSs0w",
    t: ["Pavel Durov: How Telegram Raised $1.7B & Stayed Independent", "পাভেল দুরভ: যেভাবে টেলিগ্রাম ১.৭ বিলিয়ন ডলার তুলল ও স্বাধীন থাকল"],
    by: "Pavel Durov · Founder & CEO, Telegram",
    badge: "Telegram",
  },
  {
    id: "RfWgVWGEuGE",
    t: ["Brian Chesky: The Airbnb Story — From Cereal Boxes to Billions", "ব্রায়ান চেস্কি: এয়ারবিএনবির গল্প — সিরিয়াল বক্স বিক্রি থেকে বিলিয়ন ডলার"],
    by: "Brian Chesky & Alfred Lin · Airbnb & Sequoia Capital (Stanford)",
    badge: "Airbnb",
  },
  {
    id: "NprBQi0cSHU",
    t: ["Patrick Collison: How We Built & Got Seed Funding for Stripe", "প্যাট্রিক কলিসন: যেভাবে স্ট্রাইপ তৈরি করে পিটার থিল ও এলন মাস্কের ফান্ড পেল"],
    by: "Patrick Collison · Co-Founder & CEO, Stripe (YC Startup School)",
    badge: "Stripe",
  },
  {
    id: "lw2X3PxKlAY",
    t: ["Michael Seibel: How to Pitch Your Seed-Stage Startup to Top Investors", "মাইকেল সিবেল: সিড-স্টেজ স্টার্টআপ যেভাবে পিচ করে ইনভেস্টমেন্ট পাবে"],
    by: "Michael Seibel · Managing Director, Y Combinator",
    badge: "Y Combinator",
  },
];

export const GLOBAL_STORIES = [
  {
    id: "telegram",
    company: "Telegram",
    tagline: "$1.7B Raised · 100% Founder Controlled",
    badge: "Bonds & Institutional Round",
    founder: "Pavel Durov",
    logoText: "✈️",
    accent: "#229ED9",
    summary: [
      "Pavel Durov built Telegram with zero outside venture capital for years. When monthly server costs soared to millions with 500M+ users, rather than giving up control to Silicon Valley VCs or monetizing private user data, he raised $1.7 Billion via private bonds and pre-sales from top global institutional investors. Telegram kept 100% founder control and reached 900M+ active users.",
      "টেলিগ্রামের প্রতিষ্ঠাতা পাভেল দুরভ কোনো প্রথাগত সিলিকন ভ্যালি ভিসিদের কাছে নিজের মালিকানা না দিয়ে প্রাইভেট বন্ডের মাধ্যমে বিশ্বসেরা ইনস্টিটিউশনাল ইনভেস্টরদের থেকে ১.৭ বিলিয়ন ডলার ফান্ডিং তোলেন। ১০০% কন্ট্রোল বজায় রেখে আজ টেলিগ্রাম ৯০০ মিলিয়নের বেশি ইউজারের প্ল্যাটফর্ম।"
    ],
    highlight: "$1.7 Billion raised without giving up board seats or equity to big tech.",
    keyLesson: "Retaining founder control and having uncompromising product architecture creates unstoppable leverage."
  },
  {
    id: "airbnb",
    company: "Airbnb",
    tagline: "$20K YC Seed → $600K Sequoia → $90B IPO",
    badge: "Y Combinator & Sequoia",
    founder: "Brian Chesky & Joe Gebbia",
    logoText: "🏡",
    accent: "#FF5A5F",
    summary: [
      "Maxed out on credit cards and rejected by 7 top Silicon Valley angels, the founders designed and sold $40 novelty 'Obama O's' cereal boxes during the 2008 election, earning $30,000 to keep the company alive. That extreme resourcefulness convinced Paul Graham to back them in Y Combinator, followed by a $600K seed from Sequoia.",
      "৭ জন শীর্ষ ইনভেস্টর রিজেক্ট করার পর এয়ারবিএনবির ফাউন্ডাররা নির্বাচনকালীন সময়ে সিরিয়াল বক্স বিক্রি করে ৩০ হাজার ডলার তুলে কোম্পানি বাঁচিয়ে রাখেন। এই উদ্যম দেখেই ওয়াই কম্বিনেটরের পল গ্রাহাম তাদের ফান্ড করেন।"
    ],
    highlight: "Sold $30,000 worth of breakfast cereal boxes to survive before raising from YC & Sequoia.",
    keyLesson: "Resourcefulness over resources: investors back founders who refuse to give up."
  },
  {
    id: "stripe",
    company: "Stripe",
    tagline: "$2M Seed from Peter Thiel & Elon Musk",
    badge: "Angel Seed Round",
    founder: "Patrick & John Collison",
    logoText: "💳",
    accent: "#635BFF",
    summary: [
      "Online payments used to take weeks of merchant banking paperwork. The Collison brothers built a 7-line snippet of code that accepted cards instantly. In meetings with early founders, they used the famous 'Collison Installation' — taking the founder's laptop and installing Stripe on the spot. That speed attracted PayPal co-founders Peter Thiel and Elon Musk to lead their $2M seed.",
      "স্ট্রাইপের ফাউন্ডাররা মাত্র ৭ লাইনের কোড দিয়ে অনলাইনে পেমেন্ট নেওয়া সম্ভব করেন। মিটিং চলাকালীন তারা ফাউন্ডারদের ল্যাপটপ চেয়ে সরাসরি লাইভ ইন্সটল করে দিতেন, যা পিটার থিল ও এলন মাস্ককে মুগ্ধ করে ২ মিলিয়ন ডলার সিড রাউন্ড পাইয়ে দেয়।"
    ],
    highlight: "Co-led by PayPal founders Peter Thiel and Elon Musk based on an instant 7-line demo.",
    keyLesson: "Frictionless demo: eliminate every barrier between your product and the user's 'aha' moment."
  },
  {
    id: "whatsapp",
    company: "WhatsApp",
    tagline: "$250K Friends & Family → $8M Sequoia",
    badge: "Bootstrapped to Sequoia",
    founder: "Jan Koum & Brian Acton",
    logoText: "💬",
    accent: "#25D366",
    summary: [
      "Turned down for jobs at Twitter and Facebook in 2009, Jan Koum and Brian Acton raised $250,000 from 5 former Yahoo colleagues to cover server costs. They taped a note to their desks: 'No Ads! No Games! No Gimmicks!' Sequoia partner Jim Goetz spent months hunting them down to invest $8 Million, which later turned into a $19 Billion acquisition.",
      "টুইটার ও ফেসবুকে চাকরির ইন্টারভিউতে ব্যর্থ হওয়ার পর বন্ধুরা মিলে ২৫০ হাজার ডলার দিয়ে শুরু করেন। কোনো অ্যাড বা বিজ্ঞাপন ছাড়া শুধুমাত্র নিখুঁত চ্যাটিং সেবার কারণে সিকোইয়া ক্যাপিটাল তাদের খুঁজে বের করে ৮ মিলিয়ন ডলার ইনভেস্ট করে।"
    ],
    highlight: "Turned down by Facebook, later acquired for $19 Billion with Sequoia making $3 Billion.",
    keyLesson: "Pure product retention and word-of-mouth growth beat multi-million dollar marketing campaigns."
  }
];
