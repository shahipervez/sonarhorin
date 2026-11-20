/**
 * One tiny 3-beat story per internship gate, so a fresher instantly gets what each type means.
 * actors: 3 emoji "characters" on stage (left, centre, right). meaning: the one-line definition.
 */
export const GATE_STORIES = {
  paid: {
    who: ["Rafi · CSE, 3rd year", "রাফি · সিএসই, ৩য় বর্ষ"],
    meaning: ["Paid = you earn a monthly stipend while you learn.", "পেইড = শিখতে শিখতেই প্রতি মাসে স্টাইপেন্ড পাবে।"],
    beats: [
      { actors: ["🎓", "💸", "📅"], t: ["Semester fee is due — and his CV says “no experience”.", "সেমিস্টার ফি বাকি — আর সিভিতে লেখা “কোনো অভিজ্ঞতা নেই”।"] },
      { actors: ["💻", "🏢", "✈️"], t: ["He joins a paid internship at a fintech — ৳15,000 a month.", "সে একটা ফিনটেকে পেইড ইন্টার্নশিপে ঢুকল — মাসে ৳১৫,০০০।"] },
      { actors: ["💰", "⚛️", "🤝"], t: ["3 months later: fee paid, React on his CV, and a job offer.", "৩ মাস পর: ফি শোধ, সিভিতে React, হাতে চাকরির অফার।"] },
    ],
  },
  unpaid: {
    who: ["Mitu · BBA, 2nd year", "মিতু · বিবিএ, ২য় বর্ষ"],
    meaning: ["Learning = no salary, but a mentor, real tasks and a certificate.", "লার্নিং = বেতন নেই, কিন্তু মেন্টর, আসল কাজ আর সার্টিফিকেট।"],
    beats: [
      { actors: ["📚", "🤷‍♀️", "❓"], t: ["Every job post asks for experience she doesn’t have yet.", "প্রতিটা জব পোস্টে অভিজ্ঞতা চায় — যা তার এখনো নেই।"] },
      { actors: ["🧑‍🏫", "📝", "✈️"], t: ["She joins a learning internship. A mentor checks her work every week.", "সে লার্নিং ইন্টার্নশিপে ঢুকল। প্রতি সপ্তাহে মেন্টর তার কাজ দেখে দেন।"] },
      { actors: ["📜", "🗂️", "🚀"], t: ["She leaves with a certificate + portfolio. Next stop: a paid role.", "হাতে সার্টিফিকেট + পোর্টফোলিও। পরের স্টপ: পেইড রোল।"] },
    ],
  },
  versity: {
    who: ["Sakib · EEE, final semester", "সাকিব · ইইই, শেষ সেমিস্টার"],
    meaning: ["Versity Credit = counts toward your degree; the company signs your report.", "ভার্সিটি ক্রেডিট = ডিগ্রির ক্রেডিটে গোনা হয়; কোম্পানি রিপোর্টে সাইন করে।"],
    beats: [
      { actors: ["🏫", "⏳", "📋"], t: ["He can’t graduate without a 3-credit internship.", "৩ ক্রেডিটের ইন্টার্নশিপ ছাড়া তার গ্র্যাজুয়েশন আটকে আছে।"] },
      { actors: ["🏭", "✍️", "✈️"], t: ["He takes a credit internship — a supervisor guides his report.", "সে ক্রেডিট ইন্টার্নশিপ নিল — সুপারভাইজার রিপোর্ট গাইড করেন।"] },
      { actors: ["🎓", "🅰️", "🎉"], t: ["Report signed, grade A — he graduates on time.", "রিপোর্ট সাইন, গ্রেড A — সময়মতো গ্র্যাজুয়েশন।"] },
    ],
  },
  corporate: {
    who: ["Tania · BBA, 4th year", "তানিয়া · বিবিএ, ৪র্থ বর্ষ"],
    meaning: ["Corporate = a big-company internship, often with a PPO (job offer).", "কর্পোরেট = বড় কোম্পানিতে ইন্টার্নশিপ, অনেক সময় PPO (চাকরির অফার) সহ।"],
    beats: [
      { actors: ["🏙️", "✨", "🎯"], t: ["She wants a big name on her CV — and a real shot at a job.", "সিভিতে বড় একটা নাম চায় — আর চাকরির সত্যিকারের সুযোগ।"] },
      { actors: ["🏢", "👔", "✈️"], t: ["She joins an MNC internship with structured training and a buddy.", "সে এমএনসি ইন্টার্নশিপে ঢুকল — গোছানো ট্রেনিং আর একজন বাডি।"] },
      { actors: ["📩", "✅", "🥳"], t: ["Before graduating, she gets a PPO — a pre-placement job offer.", "গ্র্যাজুয়েশনের আগেই PPO — মানে আগাম চাকরির অফার।"] },
    ],
  },
  remote: {
    who: ["Arif · CSE, Rangpur", "আরিফ · সিএসই, রংপুর"],
    meaning: ["Remote = work from anywhere in Bangladesh — laptop + Wi-Fi.", "রিমোট = বাংলাদেশের যেকোনো জায়গা থেকে কাজ — ল্যাপটপ + ওয়াই-ফাই।"],
    beats: [
      { actors: ["🏡", "🗺️", "🚌"], t: ["Dhaka offices are 8 hours away from his home.", "ঢাকার অফিস তার বাসা থেকে ৮ ঘণ্টার পথ।"] },
      { actors: ["💻", "📶", "✈️"], t: ["He joins a work-from-home internship. Meetings happen on Google Meet.", "সে ঘরে বসে ইন্টার্নশিপ শুরু করল। মিটিং হয় গুগল মিটে।"] },
      { actors: ["🚀", "🌐", "🙌"], t: ["He ships real features for a Dhaka startup — from his own room.", "নিজের রুম থেকেই ঢাকার স্টার্টআপের আসল ফিচার বানাচ্ছে।"] },
    ],
  },
};

/** Plain-language "need" + quick facts for each internship type (shown on the Internships page guide). */
export const GATE_FACTS = {
  paid: {
    need: ["I need money while I study", "পড়ার পাশাপাশি টাকা দরকার"],
    pay: ["Monthly stipend, usually ৳10k–25k", "মাসিক স্টাইপেন্ড, সাধারণত ৳১০k–২৫k"],
    length: ["3–6 months", "৩–৬ মাস"],
    best: ["2nd–4th year students with one basic skill", "২য়–৪র্থ বর্ষ, একটা বেসিক স্কিল আছে"],
    get: ["Stipend · real experience · job chance", "স্টাইপেন্ড · আসল অভিজ্ঞতা · চাকরির সুযোগ"],
  },
  unpaid: {
    need: ["I have no experience yet", "এখনো কোনো অভিজ্ঞতা নেই"],
    pay: ["No salary (sometimes travel allowance)", "বেতন নেই (কখনো যাতায়াত ভাতা)"],
    length: ["1–3 months", "১–৩ মাস"],
    best: ["1st–2nd year, or switching field", "১ম–২য় বর্ষ, বা ফিল্ড বদলাচ্ছো"],
    get: ["Mentor · certificate · portfolio work", "মেন্টর · সার্টিফিকেট · পোর্টফোলিওর কাজ"],
  },
  versity: {
    need: ["My degree needs an internship credit", "ডিগ্রির জন্য ইন্টার্নশিপ ক্রেডিট লাগবে"],
    pay: ["Varies — many are unpaid", "কোম্পানি ভেদে — অনেকগুলো আনপেইড"],
    length: ["About 3 months (1 semester)", "প্রায় ৩ মাস (১ সেমিস্টার)"],
    best: ["Final-semester students", "শেষ সেমিস্টারের শিক্ষার্থী"],
    get: ["Signed report · credit · graduate on time", "সাইন করা রিপোর্ট · ক্রেডিট · সময়মতো গ্র্যাজুয়েশন"],
  },
  corporate: {
    need: ["I want a big company on my CV", "সিভিতে বড় কোম্পানির নাম চাই"],
    pay: ["Usually paid, often higher", "সাধারণত পেইড, প্রায়ই বেশি"],
    length: ["2–6 months", "২–৬ মাস"],
    best: ["Final-year students & fresh graduates", "শেষ বর্ষ ও সদ্য গ্র্যাজুয়েট"],
    get: ["Structured training · PPO (job offer) chance", "গোছানো ট্রেনিং · PPO (চাকরির অফার) এর সুযোগ"],
  },
  remote: {
    need: ["I can't move to Dhaka", "ঢাকায় আসা সম্ভব না"],
    pay: ["Paid or unpaid — check each one", "পেইড বা আনপেইড — প্রতিটায় দেখে নাও"],
    length: ["1–6 months", "১–৬ মাস"],
    best: ["Anyone with a laptop + stable internet", "ল্যাপটপ + ভালো ইন্টারনেট থাকলেই"],
    get: ["Work from home · flexible hours", "ঘরে বসে কাজ · নমনীয় সময়"],
  },
};
