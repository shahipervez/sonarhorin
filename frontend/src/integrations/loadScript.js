const cache = new Map();

/** Inject a third-party <script> once; resolves when it has loaded. */
export function loadScript(src, attrs = {}) {
  if (typeof document === "undefined") return Promise.reject(new Error("no document"));
  if (cache.has(src)) return cache.get(src);
  const p = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.defer = true;
    Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
    s.onload = () => resolve(s);
    s.onerror = () => { cache.delete(src); s.remove(); reject(new Error(`Failed to load ${src}`)); };
    document.head.appendChild(s);
  });
  cache.set(src, p);
  return p;
}
