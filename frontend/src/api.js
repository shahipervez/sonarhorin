const BASE = import.meta.env.VITE_API_URL || "";

/**
 * Auth model: the short-lived access token lives only in memory (never localStorage → not readable by injected
 * scripts after a reload); the refresh token is an HttpOnly cookie the browser sends to /api/auth/ only.
 */
let ACCESS = null;
let REFRESH = null;
try {
  ACCESS = localStorage.getItem("sh_access");
  REFRESH = localStorage.getItem("sh_refresh");
} catch { /* ignore private mode restrictions */ }

export const tokens = {
  get access() { return ACCESS; },
  get refresh() { return REFRESH; },
  set(a, r) {
    ACCESS = a || null;
    if (r !== undefined) REFRESH = r || null;
    try {
      if (a) localStorage.setItem("sh_access", a);
      else localStorage.removeItem("sh_access");
      if (r !== undefined) {
        if (r) localStorage.setItem("sh_refresh", r);
        else localStorage.removeItem("sh_refresh");
      }
    } catch { /* storage disabled */ }
  },
  clear() {
    ACCESS = null;
    REFRESH = null;
    try {
      localStorage.removeItem("sh_access");
      localStorage.removeItem("sh_refresh");
    } catch { /* storage disabled */ }
  },
};

export class ApiError extends Error {
  constructor(status, data) {
    super(errorText(data) || `Request failed (${status})`);
    this.status = status;
    this.data = data;
  }
}

function errorText(data) {
  if (!data) return "";
  if (typeof data === "string") return data.length < 200 ? data : "";
  if (data.detail) return data.detail;
  const first = Object.entries(data)[0];
  if (first) return `${first[0]}: ${Array.isArray(first[1]) ? first[1][0] : first[1]}`;
  return "";
}

let refreshing = null;
/** One refresh at a time — parallel 401s share the same promise. */
export function refreshAccess() {
  if (!refreshing) {
    const payload = REFRESH ? JSON.stringify({ refresh: REFRESH }) : undefined;
    const headers = { "X-Requested-With": "sonarhorin" };
    if (payload) headers["Content-Type"] = "application/json";

    refreshing = fetch(`${BASE}/api/auth/refresh/`, {
      method: "POST",
      credentials: "include",
      headers,
      body: payload,
    })
      .then(async (r) => {
        if (!r.ok || r.status === 204) {
          tokens.clear();
          return false;
        }
        const data = await r.json();
        tokens.set(data.access, data.refresh);
        return true;
      })
      .catch(() => false)
      .finally(() => setTimeout(() => { refreshing = null; }, 0));
  }
  return refreshing;
}

function authHeaders(extra = {}) {
  const h = { ...extra };
  if (ACCESS) h.Authorization = `Bearer ${ACCESS}`;
  return h;
}

/** api("/api/x/", {method, body, form, blob}) — JSON by default, auto JWT + one silent refresh retry. */
export async function api(path, { method = "GET", body, form, blob = false, retry = true } = {}) {
  const headers = authHeaders();
  let payload;
  if (form) payload = form;
  else if (body !== undefined) { headers["Content-Type"] = "application/json"; payload = JSON.stringify(body); }
  const r = await fetch(`${BASE}${path}`, { method, headers, body: payload, credentials: "include" });
  if (r.status === 401 && retry && !path.startsWith("/api/auth/login") && (await refreshAccess())) {
    return api(path, { method, body, form, blob, retry: false });
  }
  if (blob && r.ok) return r.blob();
  const text = await r.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!r.ok) throw new ApiError(r.status, data);
  return data;
}

/**
 * Server-sent events over POST. Calls onChunk(text) as tokens arrive; resolves with the full text.
 * Pass an AbortController's signal to stop generation.
 */
export async function stream(path, body, onChunk, { signal, retry = true } = {}) {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST", credentials: "include", signal,
    headers: authHeaders({ "Content-Type": "application/json", Accept: "text/event-stream" }),
    body: JSON.stringify(body),
  });
  if (r.status === 401 && retry && (await refreshAccess())) return stream(path, body, onChunk, { signal, retry: false });
  if (!r.ok || !r.body) {
    let d = null; try { d = await r.json(); } catch { /* not json */ }
    throw new ApiError(r.status, d);
  }
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = "", full = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const ev = buf.slice(0, i); buf = buf.slice(i + 2);
      const line = ev.split("\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      try {
        const d = JSON.parse(line.slice(5).trim());
        if (d.t) { full += d.t; onChunk?.(d.t, full); }
      } catch { /* partial */ }
    }
  }
  return full;
}

export async function download(path, filename) {
  const b = await api(path, { blob: true });
  const url = URL.createObjectURL(b);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
