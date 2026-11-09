import { useEffect, useState } from "react";

const KEY = "prothom_track";
const listeners = new Set();

// Clean up legacy permanent lock from localStorage so the 3 options modal shows upon site entry
try {
  localStorage.removeItem(KEY + "_chosen");
} catch {}

/** What the visitor is looking for. Drives the hero visual, the story film, the automation scene and the dashboard layout. */
export const TRACKS = {
  job: { ic: "💼", bn: "চাকরি", en: "Job", noun: "job" },
  internship: { ic: "🎓", bn: "ইন্টার্নশিপ", en: "Internship", noun: "internship" },
  startup: { ic: "🚀", bn: "স্টার্টআপ", en: "Startup", noun: "startup" },
};

export function getTrack() {
  try { const t = localStorage.getItem(KEY); return TRACKS[t] ? t : "job"; } catch { return "job"; }
}
export function hasChosenTrack() {
  try {
    if (typeof window !== "undefined" && window.location.search.includes("gate")) {
      return false;
    }
    return !!sessionStorage.getItem(KEY + "_session_chosen");
  } catch {
    return false;
  }
}
export function setTrack(t) {
  if (!TRACKS[t]) return;
  try {
    localStorage.setItem(KEY, t);
    sessionStorage.setItem(KEY + "_session_chosen", "1");
  } catch { /* private mode */ }
  listeners.forEach((f) => f(t));
}
export function resetTrack() {
  try {
    sessionStorage.removeItem(KEY + "_session_chosen");
    localStorage.removeItem(KEY + "_chosen");
  } catch {}
}
export function useTrack() {
  const [t, setT] = useState(getTrack);
  useEffect(() => { listeners.add(setT); return () => listeners.delete(setT); }, []);
  return [t, setTrack];
}
