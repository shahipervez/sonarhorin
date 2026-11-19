import { useEffect, useState } from "react";

/**
 * Lite mode — for slow phones / slow data. Auto-detected, or forced on/off by the user (persisted in localStorage).
 *   auto ON when: Save-Data, 2g/3g connection, deviceMemory ≤ 2 GB, ≤ 4 CPU cores on a mobile, or prefers-reduced-motion.
 * Effects: <html class="lite">, no autoplaying <video>, static gradients instead of canvas skies, CSS animations off.
 * Use: const lite = useLite();  ·  setLite(true | false | null)   (null = back to auto)
 */
const KEY = "sh_lite";
const listeners = new Set();

export function detectLite() {
  if (typeof navigator === "undefined") return false;
  try {
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (c?.saveData) return true;
    if (c && /(^|-)(2g|3g)$/.test(c.effectiveType || "")) return true;
    if (navigator.deviceMemory && navigator.deviceMemory <= 2) return true;
    const mobile = navigator.userAgentData?.mobile ?? /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
    if (mobile && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) return true;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return true;
  } catch { /* ignore */ }
  return false;
}

/** "1" | "0" | null (auto) */
export function litePref() {
  try { const v = localStorage.getItem(KEY); return v === "1" || v === "0" ? v : null; } catch { return null; }
}

export function isLite() {
  const p = litePref();
  return p ? p === "1" : detectLite();
}

function apply(on) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("lite", on);
  if (on) document.querySelectorAll("video").forEach((v) => { try { v.pause(); } catch { /* */ } });
}
apply(isLite());

/** true / false forces lite on/off; null returns to auto-detect. */
export function setLite(v) {
  try {
    if (v == null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, v ? "1" : "0");
  } catch { /* private mode */ }
  const on = isLite();
  apply(on);
  listeners.forEach((f) => f(on));
}

export function useLite() {
  const [on, setOn] = useState(isLite);
  useEffect(() => {
    listeners.add(setOn);
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const conn = navigator.connection;
    const re = () => { if (!litePref()) { const v = isLite(); apply(v); listeners.forEach((f) => f(v)); } };
    mq?.addEventListener?.("change", re);
    conn?.addEventListener?.("change", re);
    return () => { listeners.delete(setOn); mq?.removeEventListener?.("change", re); conn?.removeEventListener?.("change", re); };
  }, []);
  return on;
}

/** Small toggle button for the menu / footer. */
export function LiteToggle({ L, className = "lite-toggle" }) {
  const on = useLite();
  return (
    <button
      type="button"
      className={`${className} ${on ? "on" : ""}`}
      aria-pressed={on}
      onClick={() => setLite(!on)}
      title={L ? "ধীর ফোন বা কম ডেটার জন্য হালকা মোড" : "Lighter pages for slow phones & low data"}
    >
      <span aria-hidden="true">{on ? "🪶" : "⚡"}</span>{" "}
      {L ? (on ? "লাইট মোড: চালু" : "লাইট মোড: বন্ধ") : on ? "Lite mode: on" : "Lite mode: off"}
    </button>
  );
}

/** Drop-in replacement for a heavy canvas scene when lite mode is on. */
export function StaticSky({ variant = "job", className = "" }) {
  return <div className={`lite-sky lite-sky-${variant} ${className}`} aria-hidden="true" />;
}
