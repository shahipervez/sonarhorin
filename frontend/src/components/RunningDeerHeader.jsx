import { useEffect, useRef, useState } from "react";

/**
 * High-Impact Running Golden Deer + Dynamic "SONARHORIN" Letter Reveal.
 * The golden deer dashes across above from left to right, emitting a luminous trail
 * of golden sparks and stardust. As the deer gallops past each position, the letters
 * of "SONARHORIN" are dynamically written/revealed with an electric spark burst!
 */
export default function RunningDeerHeader({ L }) {
  const [revealedCount, setRevealedCount] = useState(0);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const deerRef = useRef(null);
  const animRef = useRef(null);
  const particlesRef = useRef([]);

  const wordSonar = L ? ["সো", "না", "র"] : ["S", "O", "N", "A", "R"];
  const wordHorin = L ? ["হ", "রি", "ণ"] : ["H", "O", "R", "I", "N"];
  const allLetters = [
    ...wordSonar.map((char) => ({ char, isHorin: false })),
    ...wordHorin.map((char) => ({ char, isHorin: true })),
  ];
  const totalLetters = allLetters.length;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    const resize = () => {
      if (canvas && container) {
        canvas.width = container.clientWidth || 540;
        canvas.height = 100;
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const sprintDuration = 2400; // 2.4s for deer to gallop across and write all letters
    const holdDuration = 2600;   // 2.6s to showcase full glowing SONARHORIN
    const totalCycle = sprintDuration + holdDuration; // 5.0s full cycle

    let startTime = performance.now();
    let lastRevealed = 0;

    const tick = (now) => {
      const elapsed = (now - startTime) % totalCycle;

      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (elapsed <= sprintDuration) {
            // SPRINT PHASE: Deer gallops across from left to right
            const p = elapsed / sprintDuration;
            const totalDistance = canvas.width + 160;
            const deerX = p * totalDistance - 80;
            const deerY = 20 + Math.sin(p * Math.PI * 10) * 8; // galloping undulating bounce

            if (deerRef.current) {
              deerRef.current.style.opacity = "1";
              deerRef.current.style.transform = `translate3d(${deerX}px, ${deerY}px, 0)`;
            }

            // Letters reveal dynamically as deer bounds across each letter
            const currentLettersToReveal = Math.min(
              totalLetters,
              Math.floor(p * (totalLetters + 1.2))
            );
            if (currentLettersToReveal !== lastRevealed) {
              lastRevealed = currentLettersToReveal;
              setRevealedCount(currentLettersToReveal);
            }

            // Continuously emit golden sparks & celestial dust behind the deer
            for (let i = 0; i < 3; i++) {
              particlesRef.current.push({
                x: deerX + 15 + (Math.random() - 0.5) * 16,
                y: deerY + 28 + (Math.random() - 0.5) * 12,
                vx: -(Math.random() * 2.8 + 1.2),
                vy: (Math.random() - 0.5) * 2,
                radius: Math.random() * 2.8 + 1,
                alpha: 1,
                decay: Math.random() * 0.022 + 0.016,
                color: ["#FFE29A", "#FFD700", "#F59E0B", "#FFFFFF", "#FCD34D"][
                  Math.floor(Math.random() * 5)
                ],
              });
            }
          } else {
            // HOLD / SHOWCASE PHASE: Deer has leaped off screen, full title glows brightly
            if (lastRevealed !== totalLetters) {
              lastRevealed = totalLetters;
              setRevealedCount(totalLetters);
            }
            if (deerRef.current) {
              deerRef.current.style.opacity = "0"; // Smoothly hide deer until next sprint
            }

            // Near end of hold, reset for the next sprint
            if (elapsed > totalCycle - 200 && lastRevealed !== 0) {
              lastRevealed = 0;
              setRevealedCount(0);
            }
          }

          // Update & draw remaining particles
          for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            const pt = particlesRef.current[i];
            pt.x += pt.vx;
            pt.y += pt.vy;
            pt.alpha -= pt.decay;

            if (pt.alpha <= 0) {
              particlesRef.current.splice(i, 1);
              continue;
            }

            ctx.save();
            ctx.globalAlpha = pt.alpha;
            ctx.shadowBlur = 10;
            ctx.shadowColor = pt.color;
            ctx.fillStyle = pt.color;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      }

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [L, totalLetters]);

  return (
    <div className="running-deer-header highlighted-focus" ref={containerRef}>
      {/* Upper Track where the Golden Deer Gallops */}
      <div className="rd-track-box">
        {/* Particle Canvas */}
        <canvas ref={canvasRef} className="deer-particles-canvas" />

        {/* The Galloping Golden Stag */}
        <div className="rd-deer-continuous" ref={deerRef}>
          <svg
            className="rd-stag-svg animated-gallop"
            viewBox="0 0 130 90"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="stagGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF4D0" />
                <stop offset="30%" stopColor="#FFD700" />
                <stop offset="70%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
              <filter id="stagGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Antlers with Golden Shimmer */}
            <g
              stroke="url(#stagGold)"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#stagGlow)"
            >
              <path d="M78 28 C82 18 88 10 96 4" />
              <path d="M84 18 C88 15 92 14 96 15" />
              <path d="M90 12 C93 8 98 6 102 6" />
              <path d="M74 26 C72 16 68 10 60 4" />
              <path d="M70 17 C66 14 62 13 58 15" />
              <path d="M66 12 C62 8 58 6 54 6" />
            </g>

            {/* Galloping Stag Body (Leaping Silhouette) */}
            <path
              d="M78 30 C76 27 72 26 69 29 C65 33 60 38 52 40 C44 42 34 40 26 35 C20 31 16 28 10 24 C8 23 5 24 5 27 C6 30 10 35 15 40 C20 45 25 48 30 50 C26 58 20 68 12 76 C10 78 11 81 14 81 C18 80 25 73 32 64 C36 59 40 54 44 52 C50 51 58 52 66 50 C72 49 78 45 83 40 C88 48 94 60 100 70 C102 73 105 75 108 74 C110 73 110 70 108 67 C103 58 97 46 92 38 C94 36 96 34 98 31 C101 27 99 22 94 23 C90 24 85 27 80 30 Z"
              fill="url(#stagGold)"
              filter="url(#stagGlow)"
            />

            {/* Forelegs in forward sprint stride */}
            <path
              d="M83 40 C90 44 100 48 112 50 C116 51 120 48 118 45 C114 42 105 38 98 34"
              stroke="url(#stagGold)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              filter="url(#stagGlow)"
            />
            <path
              d="M80 43 C88 48 98 54 108 58 C112 59 115 57 114 54 C110 50 102 45 95 39"
              stroke="url(#stagGold)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              filter="url(#stagGlow)"
            />

            {/* Glowing Golden Eye */}
            <circle cx="74" cy="30" r="1.8" fill="#FFFFFF" />
            <circle cx="74" cy="30" r="3.2" fill="#FFD700" opacity="0.85" />
          </svg>
        </div>
      </div>

      {/* SONARHORIN Brand Title: Letters reveal dynamically as deer dashes above */}
      <h1 className="rd-brand-title dynamic-write">
        {allLetters.map((item, idx) => {
          const isRevealed = idx < revealedCount;
          return (
            <span
              key={idx}
              className={`rd-letter ${item.isHorin ? "is-horin" : "is-sonar"} ${
                isRevealed ? "revealed" : "hidden"
              }`}
            >
              {item.char}
            </span>
          );
        })}
      </h1>
    </div>
  );
}
