import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Concentric Keplerian Solar System Configuration
 * Each internship category orbits on its OWN concentric horizontal elliptical orbit,
 * exactly like the authentic solar system chart:
 * - Inner orbits move faster, outer orbits move slower.
 * - Central radiant Sun with Sonarhorin Golden Deer logo in the core (no text name).
 * - Floating larger planets with horizontal axial spin and Saturn horizontal Cassini rings.
 * - Pure celestial space: NO boxes or cards around planets.
 */
export const CATEGORY_PLANETS = {
  unpaid: {
    id: "unpaid",
    cls: "learning",
    icon: "📜",
    themeColor: "#6366F1",
    subTitle: ["Mentor & Certificate", "মেন্টর ও সার্টিফিকেট"],
    headline: [
      "Learning Internship — Foundation & Mentorship",
      "লার্নিং ইন্টার্নশিপ — ভেরিফায়েড কাজ ও মেন্টরশিপ",
    ],
    why: [
      "The starting light of your career: no salary, but real-world tasks, industry mentorship and a certified portfolio.",
      "ক্যারিয়ারের প্রথম আলো: বেতন না থাকলেও রিয়েল প্রজেক্ট, ডেডিকেটেড মেন্টর ও ভেরিফায়েড সার্টিফিকেট।",
    ],
    so: [
      "Best for freshers with no prior experience to build credibility before applying to paid roles.",
      "যাদের একদম অভিজ্ঞতা নেই, তাদের জন্য নিজের কাজ প্রমাণ করে পেইড রোলে যাওয়ার সেরা শুরু।",
    ],
  },
  paid: {
    id: "paid",
    cls: "paid",
    icon: "💵",
    themeColor: "#10B981",
    subTitle: ["Stipend ৳10k–25k/mo", "মাসিক স্টাইপেন্ড ৳১০k+"],
    headline: [
      "Paid Internship — Earn While You Learn",
      "পেইড ইন্টার্নশিপ — কাজ ও নিশ্চিত মাসিক স্টাইপেন্ড",
    ],
    why: [
      "Guaranteed monthly stipend (৳10,000–৳25,000) while gaining real industry experience.",
      "পড়াশোনার পাশাপাশি প্রতি মাসে সম্মানজনক স্টাইপেন্ড এবং আসল কাজের প্রফেশনাল এক্সপেরিয়েন্স।",
    ],
    so: [
      "Perfect for 3rd/4th year students looking to cover their expenses while launching their career.",
      "তৃতীয় ও চতুর্থ বর্ষের শিক্ষার্থীদের জন্য স্বাবলম্বী হওয়ার পাশাপাশি ক্যারিয়ার গড়ার সেরা সুযোগ।",
    ],
  },
  corporate: {
    id: "corporate",
    cls: "corporate", // Saturn with realistic horizontal Cassini rings
    icon: "🏢",
    themeColor: "#3B82F6",
    subTitle: ["Top MNC + Job Offer (PPO)", "শীর্ষ MNC ও PPO অফার"],
    headline: [
      "Corporate (PPO) — Big League & Direct Job Offer",
      "কর্পোরেট (PPO) — মাল্টিন্যাশনাল ক্যারিয়ার ও চাকরির অফার",
    ],
    why: [
      "Join top corporate & multinational giants with structured training and executive mentorship.",
      "দেশের শীর্ষ কর্পোরেট ও এমএনসি কোম্পানিতে গোছানো ট্রেনিং ও এক্সিকিউটিভ মেন্টরশিপ।",
    ],
    so: [
      "High-performing interns often receive a direct PPO (Pre-Placement Job Offer) before graduating.",
      "ভালো পারফর্মেন্সে গ্র্যাজুয়েশনের আগেই সরাসরি ফুল-টাইম চাকরির অফার (PPO) পাওয়া যায়।",
    ],
  },
  remote: {
    id: "remote",
    cls: "remote",
    icon: "🌐",
    themeColor: "#EC4899",
    subTitle: ["Work From Anywhere", "বাসা থেকে রিমোট (WFH)"],
    headline: [
      "Remote Internship — Work from Anywhere in Bangladesh",
      "রিমোট ইন্টার্নশিপ — দেশের যেকোনো প্রান্ত থেকে কাজ",
    ],
    why: [
      "No daily traffic or relocation: ship real features for Dhaka companies right from your room.",
      "ঢাকার যানজট বা মেস লাইফের ঝামেলা ছাড়াই যেকোনো জেলা থেকে সরাসরি শীর্ষ কোম্পানিতে কাজ।",
    ],
    so: [
      "All you need is a laptop and good internet to work flexible hours with high-growth teams.",
      "ল্যাপটপ আর ওয়াই-ফাই থাকলেই যেকোনো প্রান্ত থেকে ফ্লেক্সিবল টাইমে প্রফেশনাল কাজ।",
    ],
  },
  versity: {
    id: "versity",
    cls: "versity",
    icon: "🏫",
    themeColor: "#F59E0B",
    subTitle: ["Academic Credit & Thesis", "একাডেমিক ক্রেডিট ও গ্র্যাজুয়েশন"],
    headline: [
      "Versity Credit — Graduate On Schedule",
      "ভার্সিটি ক্রেডিট — সময়মতো গ্র্যাজুয়েশন নিশ্চিত",
    ],
    why: [
      "Fulfills your university's final-semester 3/6 credit internship & supervisor evaluation requirement.",
      "বিশ্ববিদ্যালয়ের শেষ সেমিস্টারের বাধ্যতামূলক ইন্টার্নশিপ ক্রেডিট ও সুপারভাইজার সাইন নিশ্চিত করে।",
    ],
    so: [
      "Get your formal completion certificate and report signed to graduate on time with an A grade.",
      "কোম্পানি রিপোর্টে সুপারভাইজার সাইন ও মূল্যায়ন পেয়ে সময়মতো গ্র্যাজুয়েশন সম্পন্ন করার সুযোগ।",
    ],
  },
};

/**
 * 5 Concentric Nested Orbits:
 * - rxPercent: horizontal radius (% from center)
 * - ryPx: vertical radius (px from center)
 * - speed: angular speed in radians/sec (Keplerian: inner faster, outer slower)
 * - phase: starting angle around ellipse
 * - size: larger planet sizes as requested
 */
export const CONCENTRIC_ORBITS = [
  { id: "unpaid",    rxPercent: 15.0, ryPx: 48,  speed: 0.34, phase: 0.85, size: 96 },
  { id: "paid",      rxPercent: 23.5, ryPx: 80,  speed: 0.25, phase: 3.40, size: 106 },
  { id: "corporate", rxPercent: 32.0, ryPx: 114, speed: 0.18, phase: 1.75, size: 122 },
  { id: "remote",    rxPercent: 40.5, ryPx: 148, speed: 0.13, phase: 4.90, size: 100 },
  { id: "versity",   rxPercent: 49.0, ryPx: 182, speed: 0.09, phase: 2.95, size: 106 },
];

export const PLANET_ORDER = ["unpaid", "paid", "corporate", "remote", "versity"];

/**
 * Realistic 3D Planet component.
 * Horizontal axial spin across equator + 3D spherical shade.
 * Saturn (corporate) has horizontal Cassini rings.
 */
export function Planet({ id, size = 90, spin = true }) {
  const p = CATEGORY_PLANETS[id] || CATEGORY_PLANETS.unpaid;
  const isSaturn = p.cls === "corporate";
  const isUranus = p.cls === "remote";

  return (
    <span
      className={`pl pl-${p.cls} ${spin ? "spin" : ""}`}
      style={{ "--s": `${size}px` }}
      aria-hidden="true"
    >
      {/* 3D Ring Back Layer */}
      {(isSaturn || isUranus) && (
        <span className="pl-ring-wrap back">
          <i className="pl-ring back" />
        </span>
      )}

      {/* Spherical Body */}
      <span className="pl-body">
        <span className="pl-surface" />
        <span className="pl-atmosphere" />
        <span className="pl-shade" />
        {isSaturn && <span className="pl-ring-shadow" />}
      </span>

      {/* 3D Ring Front Layer */}
      {(isSaturn || isUranus) && (
        <span className="pl-ring-wrap front">
          <i className="pl-ring front" />
        </span>
      )}
    </span>
  );
}

function Stars() {
  const stars = useMemo(
    () =>
      Array.from({ length: 85 }, (_, i) => ({
        x: (i * 137.5) % 100,
        y: (i * 53.3 + (i % 7) * 11) % 100,
        s: i % 9 === 0 ? 3 : i % 3 === 0 ? 2 : 1,
        d: (i % 10) * 0.4,
      })),
    []
  );

  return (
    <div className="ipl-stars" aria-hidden="true">
      {stars.map((s, i) => (
        <i
          key={i}
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.s,
            height: s.s,
            animationDelay: `${s.d}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function InternPlanets({
  cats,
  sel,
  counts,
  onSelect,
  L,
  facts,
  story,
  top,
  onSeeAll,
  onOpenJob,
  daysLeft,
  n2,
}) {
  const [hover, setHover] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const slowRef = useRef(1);
  const timeRef = useRef(0);
  const lastTimeRef = useRef(null);
  const planetElsRef = useRef([]);

  const byId = Object.fromEntries(cats.map((c) => [c.id, c]));
  const cur = sel ? byId[sel] : null;
  const P = sel ? CATEGORY_PLANETS[sel] : null;
  const list = sel ? top(sel) : [];

  // Update speed slowdown on hover
  useEffect(() => {
    slowRef.current = isHovered ? 0.25 : 1;
  }, [isHovered]);

  // Smooth 60FPS continuous horizontal revolution around concentric orbits
  useEffect(() => {
    let animId;

    const loop = (now) => {
      animId = requestAnimationFrame(loop);

      if (lastTimeRef.current == null) {
        lastTimeRef.current = now;
        return;
      }

      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      // When a category is selected (zoomed in focus card), pause the background orbit
      if (!sel) {
        timeRef.current += dt * slowRef.current;
      }

      const t = timeRef.current;

      CONCENTRIC_ORBITS.forEach((orbit, idx) => {
        const el = planetElsRef.current[idx];
        if (!el) return;

        // Current orbital angle along its concentric ellipse
        const theta = (t * orbit.speed + orbit.phase) % (Math.PI * 2);
        const cosVal = Math.cos(theta);
        const sinVal = Math.sin(theta);

        const xPercent = cosVal * orbit.rxPercent;
        const yOffsetPx = sinVal * orbit.ryPx;

        // 3D Depth: sinVal > 0 means lower half (in front of Sun)
        // sinVal < 0 means upper half (behind Sun)
        const inFront = sinVal > 0;
        const depthScale = inFront
          ? 1.0 + sinVal * 0.14
          : 0.88 + sinVal * 0.08;

        const isSelected = sel === orbit.id;
        const scale = isSelected ? 1.25 : depthScale;
        const zIndex = isSelected ? 40 : inFront ? (15 + idx) : (2 + idx);
        const opacity = sel && !isSelected ? 0.25 : inFront ? 1 : 0.84;

        el.style.left = `calc(50% + ${xPercent}%)`;
        el.style.top = `calc(50% + ${yOffsetPx}px)`;
        el.style.transform = `translate(-50%, -50%) scale(${scale})`;
        el.style.zIndex = zIndex;
        el.style.opacity = opacity;
      });
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [sel]);

  useEffect(() => {
    if (!sel) return;
    const esc = (e) => e.key === "Escape" && onSelect("");
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [sel, onSelect]);

  return (
    <div className={`ipl ${sel ? "has-sel" : ""}`}>
      <Stars />

      {/* CONCENTRIC SOLAR SYSTEM ARENA */}
      <div
        className="ipl-orbit-arena"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 5 Concentric Elliptical Orbit Tracks + Directional Arrows */}
        <svg
          className="ipl-orbit-svg"
          viewBox="0 0 1000 500"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            {/* Arrow marker for orbit direction */}
            <marker
              id="orbit-arrow"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(147, 197, 253, 0.7)" />
            </marker>
          </defs>

          {/* 5 Concentric Elliptical Orbits */}
          <ellipse cx="500" cy="250" rx="150" ry="48" className="ipl-orbit-line o-0" />
          <ellipse cx="500" cy="250" rx="235" ry="80" className="ipl-orbit-line o-1" />
          <ellipse cx="500" cy="250" rx="320" ry="114" className="ipl-orbit-line o-2" />
          <ellipse cx="500" cy="250" rx="405" ry="148" className="ipl-orbit-line o-3" />
          <ellipse cx="500" cy="250" rx="490" ry="182" className="ipl-orbit-line o-4" />

          {/* Directional motion arrows along orbits (exactly matching the diagram) */}
          <g className="ipl-orbit-arrows" fill="rgba(147, 197, 253, 0.75)">
            {/* Orbit 0 arrows */}
            <polygon points="503,202 493,198 493,206" />
            <polygon points="497,298 507,294 507,302" />

            {/* Orbit 1 arrows */}
            <polygon points="503,170 493,166 493,174" />
            <polygon points="497,330 507,326 507,334" />

            {/* Orbit 2 arrows */}
            <polygon points="503,136 493,132 493,140" />
            <polygon points="497,364 507,360 507,368" />

            {/* Orbit 3 arrows */}
            <polygon points="503,102 493,98 493,106" />
            <polygon points="497,398 507,394 507,402" />

            {/* Orbit 4 arrows */}
            <polygon points="503,68 493,64 493,72" />
            <polygon points="497,432 507,428 507,436" />
          </g>
        </svg>

        {/* Central Sun: Radiant Star with Sonarhorin Logo in Core (NO NAME TEXT) */}
        <div className="ipl-sun-center" aria-hidden="true">
          <span className="ipl-sun-flare flare-1" />
          <span className="ipl-sun-flare flare-2" />
          <span className="ipl-sun-aura" />
          <span className="ipl-sun-corona" />
          <div className="ipl-sun-core">
            <img
              src="/logo-gold.png"
              alt="Sonarhorin"
              className="ipl-sun-logo"
            />
          </div>
        </div>

        {/* 5 CATEGORY PLANETS REVOLVING ON CONCENTRIC ORBITS (NO BOX) */}
        <div
          className="ipl-planetary-field"
          role="tablist"
          aria-label={L ? "ইন্টার্নশিপ ক্যাটাগরি" : "Internship Categories"}
        >
          {CONCENTRIC_ORBITS.map((orbit, i) => {
            const id = orbit.id;
            const c = byId[id];
            if (!c) return null;
            const on = sel === id;
            const p = CATEGORY_PLANETS[id];

            return (
              <button
                key={id}
                ref={(el) => (planetElsRef.current[i] = el)}
                type="button"
                role="tab"
                aria-selected={on}
                className={`ipl-planet-node ${on ? "on" : ""} ${sel && !on ? "dim" : ""}`}
                style={{ "--c": c.c }}
                onClick={() => onSelect(on ? "" : id)}
                onMouseEnter={() => setHover(id)}
                onMouseLeave={() => setHover("")}
              >
                {/* 3D Planet Sphere (Larger size + horizontal equatorial spin) */}
                <span className="ipl-planet-wrap">
                  <Planet id={id} size={orbit.size} spin={true} />
                </span>

                {/* Bold Category Name Label (like the reference chart) */}
                <b className={`ipl-cat-title ${L ? "bn" : ""}`}>
                  {c.name[L]}
                </b>

                {/* Category Subtitle tag */}
                <small className={`ipl-cat-sub ${L ? "bn" : ""}`}>
                  {c.icon} {p.subTitle[L]}
                </small>

                {/* Openings count pill */}
                <em className="ipl-count-pill">
                  {n2(counts[id] || 0, L)} {L ? "টি সুযোগ" : "openings"}
                </em>

                {/* Hover Tooltip */}
                {hover === id && !on && facts[id]?.need && (
                  <span className="ipl-tip">"{facts[id].need[L]}"</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {!sel && (
        <p className="ipl-hint">
          👆 {L ? "যেকোনো ক্যাটাগরির গ্রহে চাপ দাও — বিস্তারিত তথ্য ও ইন্টার্নশিপের সুযোগসমূহ দেখো" : "Tap any category planet to explore requirements, details and active openings"}
        </p>
      )}

      {/* Focus View: Selected Category zooms up with details & job openings */}
      {sel && cur && P && (
        <div className="ipl-focus" style={{ "--c": cur.c }} key={sel}>
          <div className="ipl-focus-planet">
            <Planet id={sel} size={220} spin={true} />
            <span className="ipl-focus-cat-badge">{cur.icon} {cur.name[L]}</span>
          </div>

          <div className="ipl-focus-text">
            <span className="ipl-kicker">
              {L ? "নির্বাচিত ক্যাটাগরি" : "Selected Category"}
            </span>
            <h2 className={L ? "bn" : ""}>
              {cur.icon} {cur.name[L]} {L ? "ইন্টার্নশিপ" : "Internship"}
            </h2>

            <p className={`ipl-why ${L ? "bn" : ""}`}>
              <span>✨</span> {P.why[L]}
            </p>

            <p className={`ipl-so ${L ? "bn" : ""}`}>
              {P.so[L]}
            </p>

            {/* Facts Grid */}
            <dl className="ipl-facts">
              {[
                ["💰", L ? "স্টাইপেন্ড / পেমেন্ট" : "Stipend", "pay"],
                ["⏱️", L ? "সময়কাল" : "Duration", "length"],
                ["🎯", L ? "কার জন্য উপযুক্ত" : "Best For", "best"],
                ["🎁", L ? "সুবিধাসমূহ" : "Key Benefits", "get"],
              ].map(([ic, lab, k]) => (
                <div key={k}>
                  <dt>{ic} {lab}</dt>
                  <dd className={L ? "bn" : ""}>{facts[sel]?.[k]?.[L] || "—"}</dd>
                </div>
              ))}
            </dl>

            {/* Story Example */}
            {story[sel] && (
              <details className="ipl-story">
                <summary>
                  {L ? `বাস্তব সাফল্যের গল্প — ${story[sel].who[1]}` : `Real Success Story — ${story[sel].who[0]}`}
                </summary>
                <ol>
                  {story[sel].beats.map((b, k) => (
                    <li key={k}>
                      <i>{b.actors[0]}</i>
                      <span className={L ? "bn" : ""}>{b.t[L]}</span>
                    </li>
                  ))}
                </ol>
              </details>
            )}
          </div>

          <button
            type="button"
            className="ipl-close"
            onClick={() => onSelect("")}
            aria-label={L ? "সব ক্যাটাগরিতে ফেরত যান" : "Back to all categories"}
          >
            ✕
          </button>

          {/* Internship Boarding Passes List under Category */}
          <div className="ipl-drop">
            <div className="ipl-drop-head">
              <b className={L ? "bn" : ""}>
                {L ? `${cur.name[1]} ইন্টার্নশিপের সুযোগসমূহ` : `${cur.name[0]} Openings`}
              </b>
              <span>{n2(counts[sel] || 0, L)} {L ? "টি খোলা" : "open"}</span>
            </div>

            <div className="ipl-jobs">
              {list.map((j, k) => {
                const dl = daysLeft(j.deadline);
                return (
                  <button
                    key={j.id}
                    type="button"
                    className="ipl-job"
                    style={{ "--k": k }}
                    onClick={() => onOpenJob(j)}
                  >
                    <span
                      className="ipl-job-logo"
                      style={{ background: j.company?.color || cur.c }}
                    >
                      {(j.company?.name || "?").charAt(0)}
                    </span>
                    <span className="ipl-job-txt">
                      <b>{j.title}</b>
                      <small>
                        {j.company?.name}
                        {j.remote ? ` · ${L ? "রিমোট" : "Remote"}` : j.location ? ` · ${j.location}` : ""}
                      </small>
                    </span>
                    <span className="ipl-job-meta">
                      <em>
                        {j.salary_min
                          ? `৳${Math.round(j.salary_min / 1000)}k${j.salary_max ? `–${Math.round(j.salary_max / 1000)}k` : ""}`
                          : L ? "সার্টিফিকেট" : "Certificate"}
                      </em>
                      {dl != null && (
                        <small className={dl <= 5 ? "hot" : ""}>
                          {n2(dl, L)}{L ? " দিন বাকি" : "d left"}
                        </small>
                      )}
                    </span>
                  </button>
                );
              })}
              {!list.length && (
                <p className="ipl-empty">
                  {L
                    ? "এই ক্যাটাগরিতে এই মুহূর্তে নতুন সার্কুলার প্রসেসিংয়ে রয়েছে — প্রতি সপ্তাহে নতুন ইন্টার্নশিপ আসে।"
                    : "New internships for this category are landing soon. Check back weekly."}
                </p>
              )}
            </div>

            {(counts[sel] || 0) > 0 && (
              <button
                type="button"
                className="ip-btn gold ipl-all"
                onClick={() => onSeeAll(sel)}
              >
                {L
                  ? `সব ${n2(counts[sel], L)}টি ${cur.name[1]} ইন্টার্নশিপ দেখো ও আবেদন করো`
                  : `See all ${counts[sel]} ${cur.name[0]} Internships & Apply`} ↓
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
