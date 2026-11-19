import { useEffect, useRef } from "react";
import { STORY_LEN, drawAnime } from "./anime/story";

/**
 * The gate's long story — "Episode 01: প্রথম সুযোগ", a ~24 s anime short drawn live on canvas
 * (see ./anime/story.js). It starts when the girl pulls the curtain (`active` turns true),
 * plays once on its own clock, then holds on the animated title card.
 * Toggling `active` off and on again replays it from the start.
 */
export default function StoryCanvas({ active, className = "" }) {
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

    let raf = 0, start = 0, running = true;
    const render = (now) => {
      if (!running) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!active) {
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
      } else {
        if (!start) start = now;
        const t = still ? STORY_LEN : (now - start) / 1000;
        drawAnime(ctx, t, W, H);
      }
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => { running = false; cancelAnimationFrame(raf); };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className={`ex8-story-left-canvas ${className}`}
      role="img"
      aria-label="সোনারহরিণ — Episode 01: প্রথম সুযোগ (anime story)"
    />
  );
}
