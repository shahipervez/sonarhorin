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
      { actors: ["💻", "🏢", "✈️"], t: ["He boards Gate P1: a paid internship at a fintech — ৳15,000 a month.", "সে গেট P1 দিয়ে উঠল: একটা ফিনটেকে পেইড ইন্টার্নশিপ — মাসে ৳১৫,০০০।"] },
      { actors: ["💰", "⚛️", "🤝"], t: ["3 months later: fee paid, React on his CV, and a job offer.", "৩ মাস পর: ফি শোধ, সিভিতে React, হাতে চাকরির অফার।"] },
    ],
  },
  unpaid: {
    who: ["Mitu · BBA, 2nd year", "মিতু · বিবিএ, ২য় বর্ষ"],
    meaning: ["Learning = no salary, but a mentor, real tasks and a certificate.", "লার্নিং = বেতন নেই, কিন্তু মেন্টর, আসল কাজ আর সার্টিফিকেট।"],
    beats: [
      { actors: ["📚", "🤷‍♀️", "❓"], t: ["Every job post asks for experience she doesn’t have yet.", "প্রতিটা জব পোস্টে অভিজ্ঞতা চায় — যা তার এখনো নেই।"] },
      { actors: ["🧑‍🏫", "📝", "✈️"], t: ["Gate L2: a learning internship. A mentor checks her work every week.", "গেট L2: লার্নিং ইন্টার্নশিপ। প্রতি সপ্তাহে মেন্টর তার কাজ দেখে দেন।"] },
      { actors: ["📜", "🗂️", "🚀"], t: ["She leaves with a certificate + portfolio. Next stop: a paid role.", "হাতে সার্টিফিকেট + পোর্টফোলিও। পরের স্টপ: পেইড রোল।"] },
    ],
  },
  versity: {
    who: ["Sakib · EEE, final semester", "সাকিব · ইইই, শেষ সেমিস্টার"],
    meaning: ["Versity Credit = counts toward your degree; the company signs your report.", "ভার্সিটি ক্রেডিট = ডিগ্রির ক্রেডিটে গোনা হয়; কোম্পানি রিপোর্টে সাইন করে।"],
    beats: [
      { actors: ["🏫", "⏳", "📋"], t: ["He can’t graduate without a 3-credit internship.", "৩ ক্রেডিটের ইন্টার্নশিপ ছাড়া তার গ্র্যাজুয়েশন আটকে আছে।"] },
      { actors: ["🏭", "✍️", "✈️"], t: ["Gate V3: a credit internship — a supervisor guides his report.", "গেট V3: ক্রেডিট ইন্টার্নশিপ — সুপারভাইজার রিপোর্ট গাইড করেন।"] },
      { actors: ["🎓", "🅰️", "🎉"], t: ["Report signed, grade A — he graduates on time.", "রিপোর্ট সাইন, গ্রেড A — সময়মতো গ্র্যাজুয়েশন।"] },
    ],
  },
  corporate: {
    who: ["Tania · BBA, 4th year", "তানিয়া · বিবিএ, ৪র্থ বর্ষ"],
    meaning: ["Corporate = a big-company internship, often with a PPO (job offer).", "কর্পোরেট = বড় কোম্পানিতে ইন্টার্নশিপ, অনেক সময় PPO (চাকরির অফার) সহ।"],
    beats: [
      { actors: ["🏙️", "✨", "🎯"], t: ["She wants a big name on her CV — and a real shot at a job.", "সিভিতে বড় একটা নাম চায় — আর চাকরির সত্যিকারের সুযোগ।"] },
      { actors: ["🏢", "👔", "✈️"], t: ["Gate C4: an MNC internship with structured training and a buddy.", "গেট C4: এমএনসি ইন্টার্নশিপ — গোছানো ট্রেনিং আর একজন বাডি।"] },
      { actors: ["📩", "✅", "🥳"], t: ["Before graduating, she gets a PPO — a pre-placement job offer.", "গ্র্যাজুয়েশনের আগেই PPO — মানে আগাম চাকরির অফার।"] },
    ],
  },
  remote: {
    who: ["Arif · CSE, Rangpur", "আরিফ · সিএসই, রংপুর"],
    meaning: ["Remote = work from anywhere in Bangladesh — laptop + Wi-Fi.", "রিমোট = বাংলাদেশের যেকোনো জায়গা থেকে কাজ — ল্যাপটপ + ওয়াই-ফাই।"],
    beats: [
      { actors: ["🏡", "🗺️", "🚌"], t: ["Dhaka offices are 8 hours away from his home.", "ঢাকার অফিস তার বাসা থেকে ৮ ঘণ্টার পথ।"] },
      { actors: ["💻", "📶", "✈️"], t: ["Gate R5: a work-from-home internship. Stand-ups on Google Meet.", "গেট R5: ঘরে বসে ইন্টার্নশিপ। মিটিং হয় গুগল মিটে।"] },
      { actors: ["🚀", "🌐", "🙌"], t: ["He ships real features for a Dhaka startup — from his own room.", "নিজের রুম থেকেই ঢাকার স্টার্টআপের আসল ফিচার বানাচ্ছে।"] },
    ],
  },
};
export const BEAT_MS = 3600;
