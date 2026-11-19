import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../i18n";
import "../styles/guide-bot.css";

// Comprehensive knowledge base of Sonarhorin features & routes
const SITE_SECTIONS = [
  {
    id: "jobs",
    path: "/jobs",
    titleBn: "💼 ফ্রেশার ও এন্ট্রি-লেভেল জব",
    titleEn: "💼 Fresher & Entry-Level Jobs",
    descBn: "IT, Marketing, Corporate সহ শত শত নতুন ফ্রেশার চাকরি, ১-ট্যাপে সরাসরি আবেদন।",
    descEn: "Hundreds of verified entry-level jobs with 1-tap instant application.",
    keywords: ["job", "jobs", "chakri", "চাকরি", "কাজ", "fresher", "career", "নিয়োগ", "বেতন"],
  },
  {
    id: "internships",
    path: "/internships",
    titleBn: "🎓 পেইড ও একাডেমিক ইন্টার্নশিপ",
    titleEn: "🎓 Paid & Academic Internships",
    descBn: "ইউনিভার্সিটি স্টুডেন্টদের জন্য পেইড ও আনপেইড ইন্টার্নশিপ এবং সোলার সিস্টেম ট্র্যাক।",
    descEn: "Curated internships for students with the Solar System career orbit.",
    keywords: ["intern", "internship", "internships", "ইন্টার্ন", "ইন্টার্নশিপ", "student", "ছাত্র"],
  },
  {
    id: "startup",
    path: "/startup",
    titleBn: "🚀 স্টার্টআপ পিচ ও ফান্ডিং",
    titleEn: "🚀 Startup Pitch & Funding",
    descBn: "আইডিয়া পিচ করলেই লাইফ সেটেল! ১০ লাখ টাকার প্রি-সিড ফান্ড, মেন্টর ও ইনভেস্টর ম্যাচিং।",
    descEn: "Submit your idea, get up to ৳10,00,000 pre-seed funding and VC mentors.",
    keywords: ["startup", "idea", "fund", "funding", "আইডিয়া", "স্টার্টআপ", "ফান্ড", "টাকা", "investor", "pitch", "পিচ", "বিনিয়োগ"],
  },
  {
    id: "cv",
    path: "/cv",
    titleBn: "📄 এআই সিভি ও ATS স্কোর",
    titleEn: "📄 AI CV Studio & ATS Score",
    descBn: "তোমার সিভি স্ক্যান করে আন্তর্জাতিক স্ট্যান্ডার্ড ATS স্কোর ও দুর্বলতা বের করে ঠিক করে নাও।",
    descEn: "Check your resume with AI ATS scanner and get actionable tips.",
    keywords: ["cv", "resume", "ats", "সিভি", "রেজুমে", "রেজিউমে", "বায়োডাটা", "score"],
  },
  {
    id: "interview",
    path: "/interview",
    titleBn: "🎙️ এআই ইন্টারভিউ কোচ",
    titleEn: "🎙️ AI Interview Coach",
    descBn: "লাইভ এআই-এর সাথে কথা বলে মক ভাইভা দাও ও তাত্ক্ষণিক ফিডব্যাক পেয়ে প্রস্তুতি নাও।",
    descEn: "Practice live voice AI interviews with instant performance feedback.",
    keywords: ["interview", "mock", "ভাইভা", "ইন্টারভিউ", "কোচ", "viva", "voice", "practice"],
  },
  {
    id: "network",
    path: "/network",
    titleBn: "🤝 ক্যাম্পাস ও কো-ফাউন্ডার নেটওয়ার্ক",
    titleEn: "🤝 Campus & Co-Founder Network",
    descBn: "বাংলাদেশের বিশ্ববিদ্যালয়গুলোর সেরা তরুণ ট্যালেন্ট ও কো-ফাউন্ডার খুঁজে বের করো।",
    descEn: "Connect with university talent and find your startup co-founder.",
    keywords: ["network", "founder", "cofounder", "কো-ফাউন্ডার", "নেটওয়ার্ক", "বন্ধু", "partner"],
  },
  {
    id: "certificates",
    path: "/certificates",
    titleBn: "🏆 স্কিল টেস্ট ও সার্টিফিকেট",
    titleEn: "🏆 Skill Tests & Certificates",
    descBn: "স্কিল যাচাই টেস্ট দিয়ে ভেরিফায়েড ডিজিটাল সার্টিফিকেট অর্জন করো।",
    descEn: "Take verified skill assessment tests and earn shareable certificates.",
    keywords: ["certificate", "test", "exam", "সার্টিফিকেট", "সনদ", "পরীক্ষা", "cert"],
  },
  {
    id: "portfolio",
    path: "/portfolio",
    titleBn: "🌐 নিজের পোর্টফোলিও ওয়েবসাইট",
    titleEn: "🌐 Personal Portfolio Builder",
    descBn: "১-ক্লিকে তোমার নিজের পার্সোনাল পোর্টফোলিও লাইভ ওয়েবসাইট তৈরি করো।",
    descEn: "Generate and launch your personal portfolio site in 1 click.",
    keywords: ["portfolio", "website", "পোর্টফোলিও", "ওয়েবসাইট", "site", "web"],
  },
  {
    id: "efficiency",
    path: "/efficiency",
    titleBn: "⚡ টাইপিং ও এফিসিয়েন্সি টেস্ট",
    titleEn: "⚡ Typing & Speed Test",
    descBn: "কাজের স্পিড, টাইপিং গতি ও এফিসিয়েন্সি টেস্ট দিয়ে লিডারবোর্ডে ওঠো।",
    descEn: "Test your execution speed, typing efficiency, and claim top rank.",
    keywords: ["speed", "efficiency", "typing", "এফিসিয়েন্সি", "গতি", "স্পিড"],
  },
  {
    id: "stories",
    path: "/stories",
    titleBn: "🎬 সাকসেস স্টোরি ও ভিডিও",
    titleEn: "🎬 Success Stories & Videos",
    descBn: "তরুণদের চাকরি ও স্টার্টআপ সাফল্যের অ্যানিমে ও ভিডিও গল্পগুলো দেখো।",
    descEn: "Watch inspiring anime films and video stories of successful founders.",
    keywords: ["story", "video", "ভিডিও", "গল্প", "ফিল্ম", "film", "anime", "অ্যানিমে"],
  },
];

export default function SonarGuideBot() {
  const [lang] = useLang();
  const bn = lang === "bn";
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      textBn: "হ্যালো! সোনারহরিণ-এ স্বাগতম 🦌 আমি আপনার সাইট গাইড বট। আমাদের ওয়েবসাইটে কোথায় কী আছে বের করতে আমাকে জিজ্ঞেস করুন অথবা নিচের যেকোনো অপশনে ট্যাপ করুন:",
      textEn: "Hello! Welcome to Sonarhorin 🦌 I am your Site Navigation Bot. Ask me where anything is located or tap any option below:",
      chips: ["চাকরি কোথায়?", "পেইড ইন্টার্নশিপ", "স্টার্টআপ আইডিয়া", "সিভি রিভিউ", "এআই ইন্টারভিউ"],
    },
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Handle Query & Search
  const processQuery = (rawText) => {
    const text = rawText.trim().toLowerCase();
    if (!text) return;

    // Add user message
    const userMsg = { sender: "user", textBn: rawText, textEn: rawText };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");

    // Find best match in knowledge base
    const matched = SITE_SECTIONS.filter((sec) =>
      sec.keywords.some((k) => text.includes(k.toLowerCase()))
    );

    setTimeout(() => {
      if (matched.length > 0) {
        const top = matched[0];
        const otherMatches = matched.slice(1, 3);
        const reply = {
          sender: "bot",
          textBn: `পেয়েছি! আপনি "${top.titleBn.replace(/^[^\s]+\s/, "")}" খুঁজছেন। নিচের বাটনে ক্লিক করে সরাসরি সেখানে যেতে পারেন:`,
          textEn: `Found it! You're looking for "${top.titleEn.replace(/^[^\s]+\s/, "")}". Click below to visit directly:`,
          navCard: top,
          chips: otherMatches.map((m) => bn ? m.titleBn : m.titleEn),
        };
        setMessages((prev) => [...prev, reply]);
      } else {
        // Fallback friendly reply with all top categories
        const fallback = {
          sender: "bot",
          textBn: "সোনারহরিণের মূল বিভাগগুলো নিচে দেওয়া হলো। আপনি যেটিতে যেতে চান ক্লিক করুন:",
          textEn: "Here are Sonarhorin's main sections. Tap where you would like to go:",
          chips: [
            bn ? "💼 ফ্রেশার জব" : "💼 Jobs",
            bn ? "🎓 ইন্টার্নশিপ" : "🎓 Internships",
            bn ? "🚀 স্টার্টআপ ফান্ড" : "🚀 Startup Fund",
            bn ? "📄 সিভি তৈরি" : "📄 CV Studio",
            bn ? "🎙️ এআই ইন্টারভিউ" : "🎙️ AI Interview",
          ],
        };
        setMessages((prev) => [...prev, fallback]);
      }
    }, 400);
  };

  const handleChipClick = (chipText) => {
    processQuery(chipText);
  };

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const resetChat = () => {
    setMessages([
      {
        sender: "bot",
        textBn: "হ্যালো! সোনারহরিণ-এ স্বাগতম 🦌 আমি আপনার সাইট গাইড বট। আমাদের ওয়েবসাইটে কোথায় কী আছে বের করতে আমাকে জিজ্ঞেস করুন অথবা নিচের যেকোনো অপশনে ট্যাপ করুন:",
        textEn: "Hello! Welcome to Sonarhorin 🦌 I am your Site Navigation Bot. Ask me where anything is located or tap any option below:",
        chips: ["চাকরি কোথায়?", "পেইড ইন্টার্নশিপ", "স্টার্টআপ আইডিয়া", "সিভি রিভিউ", "এআই ইন্টারভিউ"],
      },
    ]);
  };

  return (
    <div className="sg-bot-container">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          className="sg-bot-trigger"
          onClick={() => setIsOpen(true)}
          aria-label="Open Sonarhorin Navigation Guide Bot"
        >
          <div className="sg-trigger-avatar">
            🦌
            <span className="sg-trigger-badge" />
          </div>
          <div className="sg-trigger-text">
            <span className="sg-trigger-title">
              {bn ? "গাইড বট" : "Guide Bot"}
            </span>
            <span className="sg-trigger-sub">
              {bn ? "কোথায় কী আছে? জিজ্ঞেস করো 🤖" : "Where is what? Ask me 🤖"}
            </span>
          </div>
        </button>
      )}

      {/* Floating Assistant Modal Window */}
      {isOpen && (
        <div className="sg-bot-window" role="dialog" aria-modal="true">
          {/* Header */}
          <div className="sg-bot-header">
            <div className="sg-bot-header-left">
              <div className="sg-bot-header-avatar">🦌</div>
              <div className="sg-bot-header-info">
                <b>{bn ? "সোনারহরিণ গাইড বট" : "Sonarhorin Guide Bot"}</b>
                <span>{bn ? "সক্রিয় · সাইট নেভিগেটর" : "Online · Navigator"}</span>
              </div>
            </div>
            <div className="sg-bot-header-actions">
              <button
                type="button"
                className="sg-hdr-btn"
                onClick={resetChat}
                title={bn ? "রিসেট করুন" : "Reset Chat"}
              >
                ↺
              </button>
              <button
                type="button"
                className="sg-hdr-btn"
                onClick={() => setIsOpen(false)}
                title={bn ? "বন্ধ করুন" : "Close"}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="sg-bot-body">
            {messages.map((msg, i) => (
              <div key={i} className={`sg-msg ${msg.sender}`}>
                <div className="sg-msg-avatar">
                  {msg.sender === "bot" ? "🦌" : "👤"}
                </div>
                <div className="sg-msg-bubble">
                  <p style={{ margin: 0 }}>{bn ? msg.textBn : msg.textEn}</p>

                  {/* Destination Link Card if matched */}
                  {msg.navCard && (
                    <div className="sg-nav-card">
                      <div className="sg-nav-card-title">
                        {bn ? msg.navCard.titleBn : msg.navCard.titleEn}
                      </div>
                      <div className="sg-nav-card-desc">
                        {bn ? msg.navCard.descBn : msg.navCard.descEn}
                      </div>
                      <button
                        type="button"
                        className="sg-nav-card-btn"
                        onClick={() => handleNavigate(msg.navCard.path)}
                      >
                        🚀 {bn ? "এখানে যান" : "Go There"} →
                      </button>
                    </div>
                  )}

                  {/* Quick Action Suggestion Chips */}
                  {msg.chips && msg.chips.length > 0 && (
                    <div className="sg-chips-wrap">
                      <span className="sg-chip-label">
                        {bn ? "দ্রুত খুঁজে পেতে ক্লিক করুন:" : "Quick actions:"}
                      </span>
                      <div className="sg-chips-grid">
                        {msg.chips.map((chip, ci) => (
                          <button
                            key={ci}
                            type="button"
                            className="sg-chip-btn"
                            onClick={() => handleChipClick(chip)}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="sg-bot-footer">
            <form
              className="sg-input-form"
              onSubmit={(e) => {
                e.preventDefault();
                processQuery(inputVal);
              }}
            >
              <input
                type="text"
                className="sg-bot-input"
                placeholder={bn ? "কী খুঁজছেন? যেমন: চাকরি, সিভি, স্টার্টআপ..." : "Search e.g. jobs, internship, pitch..."}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
              />
              <button
                type="submit"
                className="sg-bot-send"
                disabled={!inputVal.trim()}
                aria-label="Send"
              >
                ➤
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
