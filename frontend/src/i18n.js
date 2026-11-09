import { useCallback, useEffect, useState } from "react";

// Site language: English by default, one toggle switches to Bangla. Use: const t = useT(); t("Jobs", "চাকরি")
const KEY = "prothom_lang";
const listeners = new Set();
const read = () => { try { return localStorage.getItem(KEY) === "bn" ? "bn" : "en"; } catch { return "en"; } };
const apply = (l) => { document.documentElement.lang = l === "bn" ? "bn" : "en"; document.documentElement.dataset.lang = l; };
if (typeof document !== "undefined") apply(read());

export function setLang(l) {
  try { localStorage.setItem(KEY, l); } catch { /* private mode */ }
  apply(l); listeners.forEach((f) => f(l));
}
export function useLang() {
  const [l, setL] = useState(read);
  useEffect(() => { listeners.add(setL); return () => listeners.delete(setL); }, []);
  return [l, setLang];
}
export function useT() {
  const [l] = useLang();
  return useCallback((en, bn) => (l === "bn" && bn != null ? bn : en), [l]);
}
