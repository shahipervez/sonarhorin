import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fmt } from "../../utils";

const BOUNCE = ["No vacancy", "Apply next year", "Unpaid?", "Only CSE", "Seen ✓✓", "Need 1 yr exp", "Waitlist"];

/**
 * Internship mode: Bright Blue Sky & Fluffy White Clouds!
 * Every application is a crisp paper plane thrown from campus toward city offices.
 * Features:
 * - Dynamic drifting 3D fluffy white clouds across multiple parallax layers
 * - Radiant golden morning sun with soft god-rays
 * - The mythical Golden Deer (সোনারহরিণ) leaping across the clouds, shedding golden stardust
 * - Flocks of birds soaring in formation through the blue sky
 * - A traditional colorful dream kite (ঘুড়ি) dancing in the wind
 * - Daytime campus architecture & sleek reflective city towers
 * - Interactive tap/click spawning cloud puffs, golden stars & guiding planes into lit internship windows!
 */
export default function PlaneSky() {
  const rootRef = useRef(null);
  const cvRef = useRef(null);
  const thrownRef = useRef(null);
  const landedRef = useRef(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const root = rootRef.current;
    const cv = cvRef.current;
    if (!root || !cv) return;
    const ctx = cv.getContext("2d");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0, H = 0, dpr = 1, bg;
    let towers = [], planes = [], tags = [], sparks = [], puffs = [];
    let clouds = [], birds = [], deer, kite;
    let raf, last = 0, acc = 0, t = 0, visible = true;
    let thrown = 2318, landed = 41;

    // Helper: generate clouds with fluffy puffs
    function makeClouds(w, h) {
      const list = [];
      const count = w < 640 ? 5 : 8;
      for (let i = 0; i < count; i++) {
        const isFar = i < Math.floor(count / 2);
        const cw = isFar ? 140 + Math.random() * 90 : 220 + Math.random() * 160;
        const cy = 20 + (i / count) * (h * 0.48) + (Math.random() - 0.5) * 30;
        const speed = isFar ? 8 + Math.random() * 7 : 18 + Math.random() * 14;
        const opacity = isFar ? 0.65 + Math.random() * 0.15 : 0.92 + Math.random() * 0.08;

        // Build overlapping puff circles to create 3D cumulus shape
        const puffCount = 5 + Math.floor(Math.random() * 4);
        const puffCircles = [];
        for (let j = 0; j < puffCount; j++) {
          const px = (j / (puffCount - 1) - 0.5) * (cw * 0.75);
          const py = Math.sin((j / (puffCount - 1)) * Math.PI) * - (cw * 0.22) + (Math.random() - 0.5) * 12;
          const pr = (cw * 0.22) + Math.sin((j / (puffCount - 1)) * Math.PI) * (cw * 0.2);
          puffCircles.push({ px, py, pr });
        }
        list.push({
          x: Math.random() * w,
          y: cy,
          w: cw,
          speed,
          opacity,
          isFar,
          puffs: puffCircles,
        });
      }
      return list;
    }

    // Helper: make bird flocks
    function makeBirds(w, h) {
      return [
        {
          x: w * 0.25,
          y: h * 0.22,
          vx: 38,
          vy: 2,
          size: 9,
          flock: [
            { ox: 0, oy: 0, phase: 0 },
            { ox: -22, oy: 12, phase: 0.5 },
            { ox: -44, oy: 24, phase: 1.1 },
            { ox: -26, oy: -12, phase: 0.7 },
            { ox: -52, oy: -22, phase: 1.4 },
          ],
        },
        {
          x: w * 0.72,
          y: h * 0.14,
          vx: 28,
          vy: -1.5,
          size: 7,
          flock: [
            { ox: 0, oy: 0, phase: 0.3 },
            { ox: -16, oy: 9, phase: 0.8 },
            { ox: -32, oy: 18, phase: 1.3 },
            { ox: -20, oy: -9, phase: 1.0 },
          ],
        },
      ];
    }

    function build() {
      dpr = Math.min(2, devicePixelRatio || 1);
      const r = root.getBoundingClientRect();
      W = r.width;
      H = r.height;
      cv.width = W * dpr;
      cv.height = H * dpr;
      cv.style.width = W + "px";
      cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Clouds & Birds
      clouds = makeClouds(W, H);
      birds = makeBirds(W, H);

      // Mythical Golden Deer (সোনারহরিণ) initialization
      deer = {
        x: -100,
        baseY: H * 0.26,
        y: H * 0.26,
        vx: 62,
        active: true,
        leap: 0,
        nextSpawn: 6,
        guideTarget: null,
      };

      // Traditional Bangladeshi dream kite (ঘুড়ি)
      kite = {
        baseX: W * 0.16,
        baseY: H * 0.2,
        x: W * 0.16,
        y: H * 0.2,
        size: W < 600 ? 18 : 26,
      };

      // Static background offscreen canvas
      bg = document.createElement("canvas");
      bg.width = W * dpr;
      bg.height = H * dpr;
      const b = bg.getContext("2d");
      b.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 1. Radiant Daytime Azure & Cerulean Sky
      const skyGrad = b.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, "#0284C7");     // Deep azure blue
      skyGrad.addColorStop(0.32, "#38BDF8");  // Crisp vibrant cerulean
      skyGrad.addColorStop(0.68, "#7DD3FC");  // Soft daytime sky
      skyGrad.addColorStop(0.90, "#BAE6FD");  // Morning mist
      skyGrad.addColorStop(1, "#FEF3C7");     // Warm golden horizon glow
      b.fillStyle = skyGrad;
      b.fillRect(0, 0, W, H);

      // 2. Radiant Golden Sun with Warm Corona
      const sunX = W * 0.82;
      const sunY = H * 0.16;
      const sunR = Math.max(70, H * 0.18);

      const sunGlow = b.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 2.4);
      sunGlow.addColorStop(0, "rgba(255, 255, 255, 1)");
      sunGlow.addColorStop(0.12, "rgba(254, 240, 138, 0.95)");
      sunGlow.addColorStop(0.32, "rgba(251, 191, 36, 0.45)");
      sunGlow.addColorStop(0.65, "rgba(245, 158, 11, 0.15)");
      sunGlow.addColorStop(1, "rgba(245, 158, 11, 0)");
      b.fillStyle = sunGlow;
      b.beginPath();
      b.arc(sunX, sunY, sunR * 2.4, 0, Math.PI * 2);
      b.fill();

      // Soft sunbeams / god-rays
      b.save();
      b.translate(sunX, sunY);
      b.fillStyle = "rgba(255, 250, 220, 0.06)";
      for (let i = 0; i < 10; i++) {
        b.beginPath();
        b.moveTo(0, 0);
        const ang = (i * Math.PI) / 5 + 0.15;
        b.arc(0, 0, H * 0.95, ang - 0.08, ang + 0.08);
        b.closePath();
        b.fill();
      }
      b.restore();

      const gy = H * 0.9;
      const cw = Math.min(380, W * 0.32);

      // 3. Left Campus: Collegiate Sandstone & Terracotta Architecture
      // Main Academy Hall
      b.fillStyle = "#E2E8F0";
      b.fillRect(0, gy - H * 0.13, cw, H * 0.13 + 4);
      // Academy brick base
      b.fillStyle = "#C2410C";
      b.fillRect(0, gy - 16, cw, 16);
      // Classic Clock Tower
      b.fillStyle = "#CBD5E1";
      b.fillRect(cw * 0.42, gy - H * 0.24, cw * 0.15, H * 0.24);
      // Tower spire (Terracotta & Gold)
      b.fillStyle = "#EA580C";
      b.beginPath();
      b.moveTo(cw * 0.4, gy - H * 0.24);
      b.lineTo(cw * 0.495, gy - H * 0.31);
      b.lineTo(cw * 0.59, gy - H * 0.24);
      b.fill();
      // Spire tip gold finial
      b.fillStyle = "#F59E0B";
      b.beginPath();
      b.arc(cw * 0.495, gy - H * 0.31, 3.5, 0, Math.PI * 2);
      b.fill();
      // Golden Clock Dial
      b.fillStyle = "#FEF08A";
      b.beginPath();
      b.arc(cw * 0.495, gy - H * 0.205, Math.max(7, H * 0.017), 0, Math.PI * 2);
      b.fill();
      b.strokeStyle = "#B45309";
      b.lineWidth = 1.8;
      b.stroke();
      // Clock hands
      b.beginPath();
      b.moveTo(cw * 0.495, gy - H * 0.205);
      b.lineTo(cw * 0.495, gy - H * 0.216);
      b.moveTo(cw * 0.495, gy - H * 0.205);
      b.lineTo(cw * 0.505, gy - H * 0.2);
      b.stroke();

      // Campus classroom windows catching morning sunlight
      b.fillStyle = "#FEF3C7";
      for (let x = 16; x < cw - 16; x += 28) {
        for (let y = gy - H * 0.11; y < gy - 18; y += 22) {
          b.fillRect(x, y, 11, 10);
        }
      }

      // Lush Campus Trees along the walkway
      const treeCols = ["#15803D", "#16A34A", "#22C55E", "#166534"];
      for (let x = -8; x < cw + 70; x += 28) {
        b.fillStyle = treeCols[(x / 28) % treeCols.length | 0];
        b.beginPath();
        b.arc(x, gy - 6, 20 + (Math.sin(x) * 8 + 8), 0, Math.PI * 2);
        b.fill();
      }

      // 4. Right City Towers: Modern Architectural Glass High-rises
      towers = [];
      let x = Math.max(cw + 110, W * 0.51);
      while (x < W + 40) {
        const w = 65 + Math.random() * 75;
        const h = H * (0.19 + Math.random() * 0.3);
        towers.push({ x, w, top: gy - h, wins: [] });
        x += w + 12 + Math.random() * 24;
      }

      towers.forEach((tw, idx) => {
        // Tower body with soft daylight gradient
        const twGrad = b.createLinearGradient(tw.x, tw.top, tw.x + tw.w, gy);
        twGrad.addColorStop(0, idx % 2 === 0 ? "#1E3A8A" : "#0F172A");
        twGrad.addColorStop(1, idx % 2 === 0 ? "#1E293B" : "#0284C7");
        b.fillStyle = twGrad;
        b.fillRect(tw.x, tw.top, tw.w, gy - tw.top + 4);

        // Tower architectural glass edge reflection
        b.fillStyle = "rgba(255, 255, 255, 0.22)";
        b.fillRect(tw.x, tw.top, 5, gy - tw.top);
        b.fillStyle = "rgba(255, 255, 255, 0.08)";
        b.fillRect(tw.x + tw.w - 4, tw.top, 4, gy - tw.top);

        // Windows: Normal daylight glass reflections + Glowing Golden Internship Windows
        tw.wins = [];
        for (let wy = tw.top + 14; wy < gy - 20; wy += 24) {
          for (let wx = tw.x + 10; wx < tw.x + tw.w - 14; wx += 18) {
            const lit = Math.random() < 0.16;
            if (lit) {
              b.fillStyle = "#F59E0B";
              b.fillRect(wx, wy, 11, 13);
              b.fillStyle = "#FEF08A";
              b.fillRect(wx + 2, wy + 2, 7, 9);
              tw.wins.push({ x: wx + 5, y: wy + 6, glow: 0 });
            } else {
              b.fillStyle = "rgba(224, 242, 254, 0.35)";
              b.fillRect(wx, wy, 11, 13);
            }
          }
        }

        // Green rooftop gardens on selected towers
        if (idx % 2 === 1) {
          b.fillStyle = "#22C55E";
          b.fillRect(tw.x + 4, tw.top - 5, tw.w - 8, 5);
        }
      });

      // Ground promenade & lawn
      b.fillStyle = "#15803D";
      b.fillRect(0, gy, W, 8);
      b.fillStyle = "#0F172A";
      b.fillRect(0, gy + 8, W, H - gy - 8);

      planes = [];
      tags = [];
      sparks = [];
      puffs = [];
    }

    const allWins = () => towers.flatMap((tw) => tw.wins);

    // Spawns a paper plane from campus
    function spawn() {
      const gy = H * 0.9;
      const cw = Math.min(380, W * 0.32);
      const sx = 20 + Math.random() * (cw - 40);
      const sy = gy - H * 0.13 - 6;
      const tw = towers[(Math.random() * towers.length) | 0];
      if (!tw) return;
      const lucky = Math.random() < 0.12 && tw.wins.length > 0;
      const tx = tw.x + 4;
      const ty = tw.top + 20 + Math.random() * (gy - tw.top - 60);

      planes.push({
        x: sx,
        y: sy,
        sx,
        sy,
        tx,
        ty,
        t: 0,
        dur: 2.3 + Math.random() * 1.5,
        arc: 60 + Math.random() * 110,
        st: "fly",
        lucky,
        rot: 0,
        vy: 0,
        vx: 0,
        tw,
        barrelRoll: 0,
      });

      thrown++;
      if (thrownRef.current) thrownRef.current.textContent = fmt(thrown);
    }

    // Guides a plane towards an internship window with golden deer stardust
    function guide(p) {
      const wins = allWins();
      if (!wins.length) return;
      const w = wins.reduce(
        (a, c) => (Math.hypot(c.x - p.x, c.y - p.y) < Math.hypot(a.x - p.x, a.y - p.y) ? c : a),
        wins[0]
      );
      Object.assign(p, {
        st: "guided",
        sx: p.x,
        sy: p.y,
        tx: w.x,
        ty: w.y,
        t: 0,
        dur: 1.15,
        arc: 80,
        win: w,
        barrelRoll: 0,
      });

      // Point the Golden Deer toward this rescue!
      if (deer) {
        deer.guideTarget = { x: w.x, y: w.y };
      }
    }

    // Render Paper Plane (Crisp white with gold wing edges)
    function drawPlane(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot + p.barrelRoll);
      const s = W < 600 ? 0.85 : 1.15;
      ctx.scale(s, s);

      if (p.st === "guided" || p.st === "in") {
        ctx.shadowColor = "#F59E0B";
        ctx.shadowBlur = 20;
      }

      // Upper wing fold
      ctx.fillStyle = p.st === "guided" ? "#FEF08A" : "#FFFFFF";
      ctx.beginPath();
      ctx.moveTo(19, 0);
      ctx.lineTo(-15, -11);
      ctx.lineTo(-9, 0);
      ctx.lineTo(-15, 10);
      ctx.closePath();
      ctx.fill();

      // Lower wing shade / gold foil spine
      ctx.fillStyle = p.st === "guided" ? "#F59E0B" : "#E2E8F0";
      ctx.beginPath();
      ctx.moveTo(19, 0);
      ctx.lineTo(-9, 0);
      ctx.lineTo(-15, 10);
      ctx.closePath();
      ctx.fill();

      // Golden wing edge accent
      ctx.strokeStyle = "#F59E0B";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(19, 0);
      ctx.lineTo(-15, -11);
      ctx.stroke();

      ctx.restore();
    }

    // Draw Fluffy White Clouds with 3D Cumulus shading - Removed per request: "just cloud ta thakbe na"
    function drawClouds(dt) {
      return; // Clouds disabled for clean open sky
      clouds.forEach((cl) => {
        cl.x += cl.speed * dt;
        if (cl.x - cl.w > W) {
          cl.x = -cl.w;
        }

        ctx.save();
        ctx.globalAlpha = cl.opacity;

        // Draw each circular puff
        cl.puffs.forEach((puff) => {
          const cx = cl.x + puff.px;
          const cy = cl.y + puff.py;
          const r = puff.pr;

          // 3D sunlit sphere gradient (sun is top-right)
          const grad = ctx.createRadialGradient(
            cx + r * 0.25,
            cy - r * 0.25,
            r * 0.1,
            cx,
            cy,
            r
          );
          // Highlight: pure white with warm golden sun rim
          grad.addColorStop(0, "#FFFFFF");
          grad.addColorStop(0.55, "#FFFFFF");
          // Underside: soft sky-tinted shadow
          grad.addColorStop(0.9, "rgba(224, 242, 254, 0.85)");
          grad.addColorStop(1, "rgba(186, 230, 253, 0.4)");

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
        });

        // Golden rim light on cloud tops facing the sun
        ctx.fillStyle = "rgba(254, 240, 138, 0.35)";
        cl.puffs.forEach((puff) => {
          const cx = cl.x + puff.px;
          const cy = cl.y + puff.py;
          ctx.beginPath();
          ctx.arc(cx + 2, cy - puff.pr * 0.35, puff.pr * 0.6, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.restore();
      });
    }

    // Draw Soaring Mythical Golden Deer (সোনারহরিণ) Leaping Across Clouds
    function drawGoldenDeer(dt) {
      if (!deer) return;
      deer.leap += dt * 3.5;
      deer.x += deer.vx * dt;
      deer.y = deer.baseY - Math.abs(Math.sin(deer.leap)) * 34;

      // Spawn twinkling golden stardust particles
      if (Math.random() < 0.45) {
        sparks.push({
          x: deer.x - 8 + (Math.random() - 0.5) * 12,
          y: deer.y + 10 + (Math.random() - 0.5) * 10,
          life: 1.2,
          maxLife: 1.2,
          size: 2.4 + Math.random() * 2.5,
          color: Math.random() < 0.5 ? "#FEF08A" : "#F59E0B",
          isStar: true,
        });
      }

      if (deer.x > W + 120) {
        deer.x = -140;
        deer.baseY = H * (0.18 + Math.random() * 0.16);
      }

      // Draw graceful Golden Deer leaping sprite
      ctx.save();
      ctx.translate(deer.x, deer.y);
      const ds = W < 600 ? 0.65 : 0.85;
      ctx.scale(ds, ds);

      ctx.shadowColor = "#F59E0B";
      ctx.shadowBlur = 22;

      // Body (Gleaming Gold)
      ctx.fillStyle = "#F59E0B";
      ctx.beginPath();
      ctx.ellipse(30, 24, 22, 11, Math.sin(deer.leap) * 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Neck & Head
      ctx.beginPath();
      ctx.moveTo(42, 20);
      ctx.lineTo(54, 4);
      ctx.lineTo(60, 8);
      ctx.lineTo(48, 25);
      ctx.closePath();
      ctx.fill();

      // Head
      ctx.beginPath();
      ctx.ellipse(60, 5, 8, 5, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Antlers (Sunlit Starlight)
      ctx.strokeStyle = "#FEF08A";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(58, 2);
      ctx.lineTo(54, -14);
      ctx.lineTo(48, -20);
      ctx.moveTo(54, -14);
      ctx.lineTo(60, -22);
      ctx.moveTo(60, 2);
      ctx.lineTo(66, -12);
      ctx.lineTo(72, -18);
      ctx.moveTo(66, -12);
      ctx.lineTo(62, -22);
      ctx.stroke();

      // Front & Back Legs in Gallop/Leap
      const legPhase = Math.sin(deer.leap);
      ctx.strokeStyle = "#D97706";
      ctx.lineWidth = 3;
      // Front legs stretching forward
      ctx.beginPath();
      ctx.moveTo(46, 26);
      ctx.lineTo(62 + legPhase * 8, 42);
      ctx.lineTo(72 + legPhase * 10, 48);
      // Back legs trailing behind
      ctx.moveTo(16, 26);
      ctx.lineTo(0 - legPhase * 6, 42);
      ctx.lineTo(-12 - legPhase * 8, 46);
      ctx.stroke();

      // Dappled sun spots on back
      ctx.fillStyle = "#FEF9C3";
      [
        [24, 21],
        [32, 19],
        [38, 23],
        [28, 25],
      ].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.arc(dx, dy, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    }

    // Draw Soaring Birds in Formation
    function drawBirds(dt) {
      birds.forEach((flock) => {
        flock.x += flock.vx * dt;
        flock.y += flock.vy * dt;
        if (flock.x > W + 80) flock.x = -100;
        if (flock.y < H * 0.08 || flock.y > H * 0.4) flock.vy *= -1;

        ctx.save();
        ctx.strokeStyle = "rgba(15, 23, 42, 0.72)";
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";

        flock.flock.forEach((bird) => {
          const bx = flock.x + bird.ox;
          const by = flock.y + bird.oy;
          const wing = Math.sin(t * 8 + bird.phase) * (flock.size * 0.6);

          ctx.beginPath();
          // Left wing
          ctx.moveTo(bx - flock.size, by + wing);
          ctx.quadraticCurveTo(bx - flock.size * 0.5, by - flock.size * 0.3, bx, by);
          // Right wing
          ctx.quadraticCurveTo(bx + flock.size * 0.5, by - flock.size * 0.3, bx + flock.size, by + wing);
          ctx.stroke();
        });
        ctx.restore();
      });
    }

    // Draw Traditional Dream Kite (ঘুড়ি)
    function drawKite(dt) {
      if (!kite) return;
      kite.x = kite.baseX + Math.sin(t * 1.6) * 14;
      kite.y = kite.baseY + Math.cos(t * 1.8) * 8;
      const angle = Math.sin(t * 1.4) * 0.12;

      ctx.save();
      ctx.translate(kite.x, kite.y);
      ctx.rotate(angle);
      const s = kite.size;

      // Diamond Kite Body (Quadrants: Crimson, Gold, Azure, White)
      // Top
      ctx.fillStyle = "#EF4444";
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.7, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();

      // Right
      ctx.fillStyle = "#F59E0B";
      ctx.beginPath();
      ctx.moveTo(s * 0.7, 0);
      ctx.lineTo(0, s * 0.9);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();

      // Left
      ctx.fillStyle = "#0284C7";
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(-s * 0.7, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();

      // Bottom-left
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.moveTo(-s * 0.7, 0);
      ctx.lineTo(0, s * 0.9);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();

      // Bamboo struts
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(0, s * 0.9);
      ctx.moveTo(-s * 0.7, 0);
      ctx.lineTo(s * 0.7, 0);
      ctx.stroke();

      // Twisting fluttering ribbon tail
      ctx.strokeStyle = "#F59E0B";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.9);
      for (let i = 1; i <= 6; i++) {
        const tx = Math.sin(t * 4 + i * 0.8) * (8 + i * 3);
        const ty = s * 0.9 + i * 14;
        ctx.lineTo(tx, ty);
      }
      ctx.stroke();

      // Little ribbon bows
      for (let i = 1; i <= 4; i++) {
        const tx = Math.sin(t * 4 + i * 0.8) * (8 + i * 3);
        const ty = s * 0.9 + i * 14;
        ctx.fillStyle = i % 2 === 0 ? "#EF4444" : "#0284C7";
        ctx.beginPath();
        ctx.arc(tx, ty, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // Pointer down: guides planes or spawns interactive cloud puffs + golden starburst
    const onDown = (e) => {
      const r = cv.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;

      // Guide nearest flying plane
      const p = planes.find(
        (q) => (q.st === "fly" || q.st === "fall") && Math.hypot(q.x - mx, q.y - my) < 42
      );
      if (p) {
        guide(p);
        e.preventDefault();
      }

      // Spawn interactive fluffy cloud puff ripple
      puffs.push({ x: mx, y: my, r: 10, maxR: 54, alpha: 0.85 });

      // Spawn golden sparkles
      for (let i = 0; i < 9; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 20 + Math.random() * 60;
        sparks.push({
          x: mx,
          y: my,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 0.8,
          maxLife: 0.8,
          size: 2.8,
          color: "#F59E0B",
          isStar: true,
        });
      }
    };
    cv.addEventListener("pointerdown", onDown);

    // Main animation frame loop
    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!visible) {
        last = now;
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      t += dt;

      acc += dt;
      const every = (W < 600 ? 0.72 : 0.4) * (reduce ? 3 : 1);
      while (acc > every) {
        acc -= every;
        spawn();
      }

      // 1. Draw static background (Sky, Sun, Architecture)
      if (bg) ctx.drawImage(bg, 0, 0, W, H);

      // 2. Dynamic drifting 3D Fluffy White Clouds
      drawClouds(dt);

      // 3. Soaring birds across the blue sky
      drawBirds(dt);

      // 4. Traditional Dream Kite (ঘুড়ি)
      drawKite(dt);

      // 5. Mythical Golden Deer (সোনারহরিণ) Leaping Across the Clouds
      drawGoldenDeer(dt);

      // 6. Interactive Click Puffs (Soft expanding cloud wisps)
      for (const pf of puffs) {
        pf.r += (pf.maxR - pf.r) * dt * 4;
        pf.alpha -= dt * 1.1;
        if (pf.alpha > 0) {
          ctx.save();
          ctx.globalAlpha = pf.alpha;
          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.arc(pf.x, pf.y, pf.r, 0, Math.PI * 2);
          ctx.arc(pf.x - pf.r * 0.4, pf.y, pf.r * 0.7, 0, Math.PI * 2);
          ctx.arc(pf.x + pf.r * 0.4, pf.y, pf.r * 0.7, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      puffs = puffs.filter((pf) => pf.alpha > 0);

      // 7. Lit Internship Windows & Golden Celebratory Glow
      towers.forEach((tw) =>
        tw.wins.forEach((w) => {
          if (w.glow > 0) {
            w.glow -= dt * 0.3;
            ctx.fillStyle = `rgba(245,158,11,${Math.min(0.95, w.glow)})`;
            ctx.shadowColor = "#F59E0B";
            ctx.shadowBlur = 28;
            ctx.fillRect(w.x - 7, w.y - 8, 14, 16);
            ctx.shadowBlur = 0;
          }
        })
      );

      // 8. Airplanes Update & Render
      for (const p of planes) {
        if (p.st === "fly" || p.st === "guided") {
          p.t += dt;
          const k = Math.min(1, p.t / p.dur);
          const e = p.st === "guided" ? 1 - Math.pow(1 - k, 3) : k;

          const nx = p.sx + (p.tx - p.sx) * e;
          const ny =
            p.sy +
            (p.ty - p.sy) * e -
            Math.sin(e * Math.PI) * p.arc +
            (p.st === "fly" ? Math.sin(p.t * 5) * 4 : 0);

          p.rot = Math.atan2(ny - p.y, nx - p.x || 0.001);
          p.x = nx;
          p.y = ny;

          if (p.st === "guided") {
            p.barrelRoll += dt * 14;
            // Trail of golden stardust
            sparks.push({
              x: p.x - Math.cos(p.rot) * 12,
              y: p.y - Math.sin(p.rot) * 12,
              life: 0.65,
              maxLife: 0.65,
              size: 2.8,
              color: "#F59E0B",
              isStar: true,
            });
          }

          if (k >= 1) {
            if (p.st === "guided" || p.lucky) {
              const w = p.win || p.tw.wins[(Math.random() * p.tw.wins.length) | 0];
              if (w) w.glow = 1.8;
              p.st = "gone";
              landed++;
              if (landedRef.current) landedRef.current.textContent = fmt(landed);

              // Confetti burst of golden & cyan sparkles
              for (let i = 0; i < 18; i++) {
                const ang = Math.random() * Math.PI * 2;
                const spd = 30 + Math.random() * 80;
                sparks.push({
                  x: p.x,
                  y: p.y,
                  vx: Math.cos(ang) * spd,
                  vy: Math.sin(ang) * spd - 20,
                  life: 0.9,
                  maxLife: 0.9,
                  size: 3 + Math.random() * 3,
                  color: i % 2 === 0 ? "#F59E0B" : "#38BDF8",
                  isStar: true,
                });
              }
              if (p.st === "gone" && p.win) setToast({ at: Date.now(), n: landed });
            } else {
              p.st = "fall";
              p.vx = -45 - Math.random() * 55;
              p.vy = -60;
              tags.push({
                x: p.x - 10,
                y: p.y - 14,
                text: BOUNCE[(Math.random() * BOUNCE.length) | 0],
                life: 1.6,
              });
            }
          }
        } else if (p.st === "fall") {
          p.vy += 260 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot += dt * 6;
          if (p.y > H * 0.9) p.st = "gone";
        }

        if (p.st !== "gone") drawPlane(p);
      }
      planes = planes.filter((p) => p.st !== "gone").slice(-60);

      // 9. Bounce Tags ("No vacancy", "Apply next year")
      ctx.font = "700 11px Inter, sans-serif";
      ctx.textAlign = "center";
      for (const g of tags) {
        g.life -= dt;
        g.y -= dt * 14;
        const a = Math.max(0, Math.min(1, g.life));
        ctx.fillStyle = `rgba(239, 68, 68, ${a * 0.95})`;
        const tw = ctx.measureText(g.text).width + 16;
        ctx.beginPath();
        ctx.roundRect(g.x - tw / 2, g.y - 11, tw, 20, 10);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
        ctx.fillText(g.text, g.x, g.y + 3);
      }
      tags = tags.filter((g) => g.life > 0);

      // 10. Golden Stardust & Confetti Sparks
      for (const s of sparks) {
        s.life -= dt;
        if (s.vx) s.x += s.vx * dt;
        if (s.vy) {
          s.vy += 60 * dt;
          s.y += s.vy * dt;
        }
        const a = Math.max(0, s.life / (s.maxLife || 1));
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = s.color || "#FEF08A";
        ctx.beginPath();
        if (s.isStar) {
          // Diamond 4-point star
          const sz = s.size || 2.5;
          ctx.moveTo(s.x, s.y - sz * 1.5);
          ctx.lineTo(s.x + sz * 0.8, s.y);
          ctx.lineTo(s.x, s.y + sz * 1.5);
          ctx.lineTo(s.x - sz * 0.8, s.y);
          ctx.closePath();
        } else {
          ctx.arc(s.x, s.y, s.size || 2.5, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.restore();
      }
      sparks = sparks.filter((s) => s.life > 0).slice(-220);
    }

    build();
    let rt;
    const onResize = () => {
      clearTimeout(rt);
      rt = setTimeout(build, 200);
    };
    addEventListener("resize", onResize);
    const io = new IntersectionObserver((e) => (visible = e[0].isIntersecting));
    io.observe(root);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      removeEventListener("resize", onResize);
      clearTimeout(rt);
      cv.removeEventListener("pointerdown", onDown);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <div className="hero-scene scene-intern" ref={rootRef}>
      <canvas ref={cvRef} className="scene-canvas" aria-hidden="true" />
      {toast && (
        <div className="rescue-toast" key={toast.at} role="status">
          <span className="ic">✈️</span>
          <div>
            <b>Landed! That plane found an internship.</b>
            <span>On সোনারহরিণ every internship takes freshers — no plane wasted.</span>
          </div>
          <Link to="/internships" className="btn btn-lime sm">
            See internships →
          </Link>
        </div>
      )}
    </div>
  );
}
