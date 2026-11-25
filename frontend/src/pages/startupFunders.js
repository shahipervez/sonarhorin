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
    id: "gpa", region: "bd", kind: "accel", equityFree: false, stage: ["mvp", "traction"],
    name: "GP Accelerator", by: ["Grameenphone & LightCastle", "গ্রামীণফোন ও লাইটক্যাসেল"],
    gives: ["Up to $50K investment + grant", "$৫০K পর্যন্ত বিনিয়োগ ও অনুদান"],
    note: ["6-month growth curriculum, global mentor network", "৬ মাসের গ্রোথ কারিকুলাম, গ্লোবাল মেন্টর নেটওয়ার্ক"],
    url: "https://www.grameenphone.com/about/sustainability/gp-accelerator",
  },
  {
    id: "r-ventures", region: "bd", kind: "vc", equityFree: false, stage: ["mvp", "traction"],
    name: "Robi r-ventures", by: ["Robi Axiata Ltd", "রবি আজিয়াটা লিমিটেড"],
    gives: ["Up to ৳২ কোটি investment", "৳২ কোটি পর্যন্ত বিনিয়োগ"],
    note: ["Growth capital for game-changing digital tech", "ডিজিটাল টেক ও সম্ভাবনাময় স্টার্টআপদের জন্য গ্রোথ ফান্ড"],
    url: "https://www.robi.com.bd/en/r-ventures",
  },
  {
    id: "anchorless", region: "bd", kind: "vc", equityFree: false, stage: ["mvp", "traction"],
    name: "Anchorless Bangladesh", by: ["Global Venture Fund", "গ্লোবাল ভেঞ্চার ফান্ড"],
    gives: ["$100K – $500K seed checks", "$১০০K – $৫০০K সিড চেক"],
    note: ["Dedicated to unlocking Bangladesh's tech potential", "বাংলাদেশের সম্ভাবনাময় উদ্যোগগুলোতে আর্লি-স্টেজ বিনিয়োগ"],
    url: "https://www.anchorless.vc/",
  },
  {
    id: "sbk", region: "bd", kind: "vc", equityFree: false, stage: ["idea", "mvp", "traction"],
    name: "SBK Tech Ventures", by: ["Venture Capital & Accelerator", "ভেঞ্চার ক্যাপিটাল ও অ্যাক্সেলারেটর"],
    gives: ["$50K – $1M investment", "$৫০K – $১M বিনিয়োগ"],
    note: ["Tech solving structural challenges in BD", "বাংলাদেশের ডিজিটাল রূপান্তরের উদ্যোগগুলোতে ফান্ডিং"],
    url: "https://sbktechventures.com/",
  },
  {
    id: "udyog", region: "bd", kind: "grant", equityFree: false, stage: ["idea", "mvp"],
    name: "Bangladesh Bank Udyog", by: ["Bangladesh Bank, via banks", "বাংলাদেশ ব্যাংক, ব্যাংকের মাধ্যমে"],
    gives: ["Up to ৳20L (half loan, half grant)", "৳২০ লাখ পর্যন্ত (অর্ধেক লোন, অর্ধেক অনুদান)"],
    note: ["Age 28 or under · watch for the next round", "বয়স ২৮ বা কম · পরের রাউন্ডের দিকে নজর রাখো"],
    url: "https://www.bb.org.bd/",
  },
  {
    id: "banglalink-it", region: "bd", kind: "grant", equityFree: true, stage: ["idea", "mvp"],
    name: "Banglalink IT Incubator", by: ["Banglalink & ICT Division", "বাংলালিংক ও আইসিটি ডিভিশন"],
    gives: ["Equity-free incubation & mentorship", "ইকুইটি-ফ্রি ইনকিউবেশন ও মেন্টরশিপ"],
    note: ["Co-working, telco API access, market expansion", "কো-ওয়ার্কিং স্পেস, টেলকো API অ্যাক্সেস ও বাজার সম্প্রসারণ"],
    url: "https://www.banglalink.net/",
  },
  {
    id: "bd-venture", region: "bd", kind: "vc", equityFree: false, stage: ["mvp", "traction"],
    name: "BD Venture Limited", by: ["Venture Capital, Bangladesh", "ভেঞ্চার ক্যাপিটাল, বাংলাদেশ"],
    gives: ["৳৫০L – ৳৩ কোটি equity funding", "৳৫০ লাখ – ৳৩ কোটি ইকুইটি ফান্ডিং"],
    note: ["Pioneer VC backed by top financial institutions", "শীর্ষ আর্থিক প্রতিষ্ঠানসমূহের যৌথ ভেঞ্চার ক্যাপিটাল"],
    url: "https://bdventure.com/",
  },
  {
    id: "torun-grant", region: "bd", kind: "grant", equityFree: true, stage: ["idea"],
    name: "Youth Innovation Seed Fund", by: ["Youth Development Grants", "যুব উন্নয়ন অনুদান"],
    gives: ["৳১L – ৳৫L student seed grant", "৳১ লাখ – ৳৫ লাখ শিক্ষার্থী সিড গ্রান্ট"],
    note: ["Campus innovators and first-time founders", "ক্যাম্পাস উদ্ভাবক ও তরুণ উদ্যোক্তাদের জন্য অনুদান"],
    url: "https://idea.gov.bd/",
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
    id: "500-global", region: "global", kind: "accel", equityFree: false, stage: ["mvp", "traction"],
    name: "500 Global", by: ["Seed Accelerator, Silicon Valley", "সিড অ্যাক্সেলারেটর, সিলিকন ভ্যালি"],
    gives: ["$150K seed investment", "$১৫০K সিড বিনিয়োগ"],
    note: ["Flagship accelerator & 3,000+ founder network", "ফ্ল্যাগশিপ প্রোগ্রাম ও ৩,০০০+ ফাউন্ডার নেটওয়ার্ক"],
    url: "https://500.co/accelerators",
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
    id: "sequoia-arc", region: "global", kind: "vc", equityFree: false, stage: ["idea", "mvp"],
    name: "Sequoia Arc", by: ["Sequoia Capital", "সিকোইয়া ক্যাপিটাল"],
    gives: ["$500K – $1M seed check", "$৫০০K – $১M সিড চেক"],
    note: ["7-week company building with legendary partners", "কিংবদন্তি পার্টনারদের সাথে ৭ সপ্তাহের কোম্পানি-বিল্ডিং"],
    url: "https://www.sequoiacap.com/arc/",
  },
  {
    id: "sosv", region: "global", kind: "accel", equityFree: false, stage: ["idea", "mvp"],
    name: "SOSV (HAX & IndieBio)", by: ["Deep Tech & Climate VC", "ডিপ টেক ও ক্লাইমেট VC"],
    gives: ["$250K – $500K initial investment", "$২৫০K – $৫০০K প্রাথমিক বিনিয়োগ"],
    note: ["World leader in AI, hardware, biotech & robotics", "এআই, হার্ডওয়্যার, বায়োটেক ও রোবোটিক্সে শীর্ষস্থানীয়"],
    url: "https://sosv.com/",
  },
  {
    id: "ef", region: "global", kind: "accel", equityFree: false, stage: ["idea"],
    name: "Entrepreneur First (EF)", by: ["Talent Investor, London & SG", "ট্যালেন্ট ইনভেস্টর, লন্ডন ও সিঙ্গাপুর"],
    gives: ["Monthly stipend + ~$100K seed check", "মাসিক ভাতা + ~$১০০K সিড চেক"],
    note: ["Pre-idea, pre-team: build world-class tech companies", "টিম বা আইডিয়া চূড়ান্ত করার আগেই শুরু করার সুবিধা"],
    url: "https://www.joinef.com/",
  },
  {
    id: "thiel", region: "global", kind: "grant", equityFree: true, stage: ["idea", "mvp"],
    name: "Thiel Fellowship", by: ["Theil Foundation", "থিল ফাউন্ডেশন"],
    gives: ["$100,000 equity-free grant", "$১০০,০০০ ইকুইটি-ফ্রি অনুদান"],
    note: ["For young builders under 22 pursuing breakthrough projects", "২২ বছরের কম বয়সী তরুণ উদ্ভাবকদের জন্য অনুদান"],
    url: "https://thielfellowship.org/",
  },
  {
    id: "aws-activate", region: "global", kind: "credits", equityFree: true, stage: ["idea", "mvp", "traction"],
    name: "AWS Activate", by: ["Amazon Web Services", "আমাজন ওয়েব সার্ভিসেস"],
    gives: ["Up to $100K AWS cloud credits", "$১০০,০০০ পর্যন্ত ক্লাউড ক্রেডিট"],
    note: ["Free server infrastructure, architecture reviews & 24/7 support", "ফ্রি সার্ভার ও ক্লাউড অবকাঠামো, আর্কিটেকচার সাপোর্ট"],
    url: "https://aws.amazon.com/activate/",
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
    gives: ["$5K – $150K Azure credits", "$৫K – $১৫০K Azure ক্রেডিট"],
    note: ["OpenAI API credits, GitHub Enterprise & Azure cloud", "OpenAI API ক্রেডিট, GitHub Enterprise ও ক্লাউড সুবিধা"],
    url: "https://www.microsoft.com/en-us/startups",
  },
  {
    id: "nvidia", region: "global", kind: "credits", equityFree: true, stage: ["idea", "mvp", "traction"],
    name: "NVIDIA Inception", by: ["NVIDIA", "এনভিডিয়া"],
    gives: ["GPU cloud credits & AI discounts", "GPU ক্লাউড ক্রেডিট ও এআই ডিসকাউন্ট"],
    note: ["AI hardware discounts, technical guidance & VC alliance", "এআই হার্ডওয়্যার ডিসকাউন্ট ও প্রযুক্তিগত সহায়তা"],
    url: "https://www.nvidia.com/en-us/startups/",
  },
  {
    id: "digitalocean", region: "global", kind: "credits", equityFree: true, stage: ["idea", "mvp"],
    name: "DigitalOcean Hatch", by: ["DigitalOcean", "ডিজিটালওশান"],
    gives: ["$1K – $10K cloud credits", "$১K – $১০K ক্লাউড ক্রেডিট"],
    note: ["12 months free server infrastructure for developers", "ডেভেলপারদের জন্য ১২ মাস ফ্রি সার্ভার পরিকাঠামো"],
    url: "https://www.digitalocean.com/hatch",
  },
  {
    id: "openai-fund", region: "global", kind: "vc", equityFree: false, stage: ["mvp", "traction"],
    name: "OpenAI Startup Fund", by: ["OpenAI & Microsoft", "ওপেনএআই ও মাইক্রোসফট"],
    gives: ["$1M – $5M early-stage investment", "$১M – $৫M আর্লি-স্টেজ বিনিয়োগ"],
    note: ["Backing founders pushing the frontiers of AI", "যুগান্তকারী এআই উদ্ভাবনকারী উদ্যোগগুলোতে বিনিয়োগ"],
    url: "https://openai.com/fund/",
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
