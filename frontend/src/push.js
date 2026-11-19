/**
 * Web push helper. The service worker itself is registered by the PWA setup (vite-plugin-pwa); here we only use
 * `navigator.serviceWorker.ready` and its PushManager.
 *
 *   import { pushSupported, enablePush, disablePush, getPushState } from "./push";
 *   const state = await getPushState();          // "unsupported" | "disabled" | "denied" | "subscribed" | "default"
 *   await enablePush();                          // asks permission, subscribes, saves on the server
 */
import { api } from "./api";

export function pushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function urlBase64ToUint8Array(base64) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

let keyPromise = null;
function vapidKey() {
  if (!keyPromise) keyPromise = api("/api/push/vapid-key/").catch(() => ({ enabled: false, public_key: "" }));
  return keyPromise;
}

/** Wait for the service worker, but don't hang forever if none is registered (e.g. dev without PWA). */
function swReady(ms = 4000) {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, rej) => setTimeout(() => rej(new Error("No service worker is active.")), ms)),
  ]);
}

export async function getPushState() {
  if (!pushSupported()) return "unsupported";
  const { enabled } = await vapidKey();
  if (!enabled) return "disabled";
  if (Notification.permission === "denied") return "denied";
  try {
    const reg = await swReady(1500);
    return (await reg.pushManager.getSubscription()) ? "subscribed" : "default";
  } catch {
    return "default";
  }
}

/** Ask for permission (must be called from a click), subscribe and register with the backend. */
export async function enablePush() {
  if (!pushSupported()) throw new Error("This browser does not support notifications. / এই ব্রাউজারে নোটিফিকেশন চলে না।");
  const { enabled, public_key } = await vapidKey();
  if (!enabled || !public_key) throw new Error("Notifications are not available yet. / নোটিফিকেশন এখনো চালু হয়নি।");
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("Notification permission was not granted. / নোটিফিকেশনের অনুমতি দেওয়া হয়নি।");
  const reg = await swReady();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(public_key) });
  }
  await api("/api/push/subscribe/", { method: "POST", body: sub.toJSON() });
  return sub;
}

export async function disablePush() {
  if (!pushSupported()) return;
  let reg;
  try { reg = await swReady(1500); } catch { return; }
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  try { await api("/api/push/subscribe/", { method: "DELETE", body: { endpoint: sub.endpoint } }); } catch { /* already gone */ }
  await sub.unsubscribe();
}
