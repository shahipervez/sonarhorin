/**
 * One tiny 3-beat story per internship type, so a fresher instantly gets what each type means.
 *
 * Each beat has a cast of 3 Blender-rendered cartoons (left prop, the student in the middle, right prop):
 *   art:    file names in /public/cartoons/<name>.webp  (made by tools/blender/render_intern_cartoons.py)
 *   actors: matching emoji, used as alt text and as a fallback if an image fails to load
 *   t:      the line under the stage  [en, bn]
 * meaning: the one-line, plain-language definition shown under the story.
 */
export const GATE_STORIES = {
  paid: {
    who: ["Rafi · CSE, 3rd year", "রাফি · সিএসই, ৩য় বর্ষ"],
    meaning: ["Paid internship: you learn on the job and get a stipend every month.", "পেইড ইন্টার্নশিপ: কাজ শিখবে, সাথে প্রতি মাসে স্টাইপেন্ড পাবে।"],
    beats: [
      { art: ["calendar", "rafi-think", "cv"], actors: ["📅", "🧑‍🎓", "❓"], t: ["Rafi’s semester fee is due — and his CV says “no experience”.", "রাফির সেমিস্টার ফি বাকি — আর সিভিতে লেখা “কোনো অভিজ্ঞতা নেই”।"] },
      { art: ["laptop", "rafi-go", "plane"], actors: ["💻", "🧑‍🎓", "✈️"], t: ["He joins a paid internship at a fintech: ৳15,000 a month while he learns.", "সে একটা ফিনটেকে পেইড ইন্টার্নশিপ পেল: শিখতে শিখতেই মাসে ৳১৫,০০০।"] },
      { art: ["money", "rafi-win", "letter"], actors: ["💰", "🧑‍🎓", "📩"], t: ["3 months later: fee paid, real React work on his CV — and a job offer.", "৩ মাস পর: ফি শোধ, সিভিতে আসল React-এর কাজ — আর চাকরির অফার।"] },
    ],
  },
  unpaid: {
    who: ["Mitu · BBA, 2nd year", "মিতু · বিবিএ, ২য় বর্ষ"],
    meaning: ["Learning internship: no salary, but a mentor, real tasks and a certificate.", "লার্নিং ইন্টার্নশিপ: বেতন নেই, কিন্তু মেন্টর, আসল কাজ আর সার্টিফিকেট আছে।"],
    beats: [
      { art: ["books", "mitu-think", "question"], actors: ["📚", "👩‍🎓", "❓"], t: ["Every job post asks for experience. Mitu hasn’t had the chance to get any.", "সব জব পোস্টে অভিজ্ঞতা চায়। মিতু এখনো সেই সুযোগই পায়নি।"] },
      { art: ["mentor", "mitu-go", "plane"], actors: ["🧑‍🏫", "👩‍🎓", "✈️"], t: ["She takes a learning internship. A mentor checks her work every week.", "সে একটা লার্নিং ইন্টার্নশিপ নিল। প্রতি সপ্তাহে একজন মেন্টর তার কাজ দেখে দেন।"] },
      { art: ["certificate", "mitu-win", "rocket"], actors: ["📜", "👩‍🎓", "🚀"], t: ["She leaves with a certificate and a portfolio — ready for a paid role.", "হাতে সার্টিফিকেট আর পোর্টফোলিও — এবার পেইড রোলের জন্য তৈরি।"] },
    ],
  },
  versity: {
    who: ["Sakib · EEE, final semester", "সাকিব · ইইই, শেষ সেমিস্টার"],
    meaning: ["Versity credit internship: it counts toward your degree, and the company signs your report.", "ভার্সিটি ক্রেডিট ইন্টার্নশিপ: ডিগ্রির ক্রেডিটে গোনা হয়, কোম্পানি তোমার রিপোর্টে সাইন করে।"],
    beats: [
      { art: ["university", "sakib-think", "hourglass"], actors: ["🏫", "🧑‍🎓", "⏳"], t: ["Sakib can’t graduate until he finishes a 3-credit internship.", "৩ ক্রেডিটের ইন্টার্নশিপ শেষ না করলে সাকিবের গ্র্যাজুয়েশন হবে না।"] },
      { art: ["clipboard", "sakib-go", "plane"], actors: ["📋", "🧑‍🎓", "✈️"], t: ["He picks a credit internship. A supervisor there guides his report.", "সে একটা ক্রেডিট ইন্টার্নশিপ নিল। সেখানকার সুপারভাইজার রিপোর্ট লিখতে সাহায্য করেন।"] },
      { art: ["gradcap", "sakib-win", "grade"], actors: ["🎓", "🧑‍🎓", "🅰️"], t: ["Report signed, grade A — he graduates on time.", "রিপোর্টে সাইন, গ্রেড A — সময়মতোই গ্র্যাজুয়েশন।"] },
    ],
  },
  corporate: {
    who: ["Tania · BBA, 4th year", "তানিয়া · বিবিএ, ৪র্থ বর্ষ"],
    meaning: ["Corporate internship: a big company, proper training, and often a PPO (job offer).", "কর্পোরেট ইন্টার্নশিপ: বড় কোম্পানি, গোছানো ট্রেনিং, আর অনেক সময় PPO (চাকরির অফার)।"],
    beats: [
      { art: ["tower", "tania-think", "target"], actors: ["🏙️", "👩‍🎓", "🎯"], t: ["Tania wants a big company on her CV — and a real chance at a job.", "তানিয়া সিভিতে বড় কোম্পানির নাম চায় — আর চাকরির সত্যিকারের সুযোগ।"] },
      { art: ["badge", "tania-go", "plane"], actors: ["🪪", "👩‍🎓", "✈️"], t: ["She joins an MNC internship with proper training and a buddy to help.", "সে একটা এমএনসিতে ইন্টার্নশিপ পেল — গোছানো ট্রেনিং আর পাশে একজন বাডি।"] },
      { art: ["letter", "tania-win", "trophy"], actors: ["📩", "👩‍🎓", "🏆"], t: ["Before graduation she gets a PPO — a job offer from the same company.", "গ্র্যাজুয়েশনের আগেই সে PPO পেল — একই কোম্পানি থেকে চাকরির অফার।"] },
    ],
  },
  remote: {
    who: ["Arif · CSE, Rangpur", "আরিফ · সিএসই, রংপুর"],
    meaning: ["Remote internship: work from anywhere in Bangladesh with a laptop and Wi-Fi.", "রিমোট ইন্টার্নশিপ: ল্যাপটপ আর ওয়াই-ফাই থাকলেই বাংলাদেশের যেকোনো জায়গা থেকে কাজ।"],
    beats: [
      { art: ["home", "arif-think", "bus"], actors: ["🏡", "🧑‍🎓", "🚌"], t: ["Arif lives in Rangpur. The Dhaka offices are 8 hours away by bus.", "আরিফ থাকে রংপুরে। ঢাকার অফিস বাসে ৮ ঘণ্টার পথ।"] },
      { art: ["wifi", "arif-go", "plane"], actors: ["📶", "🧑‍🎓", "✈️"], t: ["He finds a remote internship. Daily check-ins happen on Google Meet.", "সে একটা রিমোট ইন্টার্নশিপ পেল। প্রতিদিনের মিটিং হয় গুগল মিটে।"] },
      { art: ["globe", "arif-win", "rocket"], actors: ["🌐", "🧑‍🎓", "🚀"], t: ["Now he builds real features for a Dhaka startup — from his own room.", "এখন নিজের রুম থেকেই ঢাকার এক স্টার্টআপের আসল ফিচার বানাচ্ছে।"] },
    ],
  },
};
export const BEAT_MS = 4200;

/** Every cartoon file a story uses — for preloading. */
export const cartoonSrc = (name) => `/cartoons/${name}.webp`;
