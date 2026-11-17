import { useEffect, useRef } from "react";
import { STORY_LEN, drawAnime } from "./anime/story";

/**
 * Full-bleed Living Story Background — "Episode 01: প্রথম সুযোগ" (Continuous 24/7 anime loop).
 * Plays edge-to-edge as a borderless full screen background without any box or padding.
 */
export default function StoryCanvas({ active = true, loop = true, resetKey = 0, className = "" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    const W = 1280, H = 720;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let raf = 0, start = performance.now(), running = true;
    const render = (now) => {
      if (!running) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!active) {
        ctx.fillStyle = "#04060E";
        ctx.fillRect(0, 0, W, H);
      } else {
        const elapsed = (now - start) / 1000;
        const t = still ? 0 : (loop ? (elapsed % STORY_LEN) : Math.min(elapsed, STORY_LEN));
        drawAnime(ctx, t, W, H);
        // Cinematic smooth fade-to-black before loop restart
        if (loop && t > (STORY_LEN - 0.7)) {
          const fade = (t - (STORY_LEN - 0.7)) / 0.7;
          ctx.fillStyle = `rgba(4, 6, 14, ${fade})`;
          ctx.fillRect(0, 0, W, H);
        }
      }
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => { running = false; cancelAnimationFrame(raf); };
  }, [active, loop, resetKey]);

  return (
    <canvas
      ref={canvasRef}
      className={`gate-story-canvas ${className}`}
      role="img"
      aria-label="সোনারহরিণ — Episode 01: প্রথম সুযোগ (anime story)"
    />
  );
}
