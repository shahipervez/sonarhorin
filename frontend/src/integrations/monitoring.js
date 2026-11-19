/**
 * Error monitoring (Sentry) + privacy-friendly analytics (PostHog or Plausible).
 * Everything is opt-in through build-time env vars; with none set this module does nothing and pulls in no code.
 *
 *   VITE_SENTRY_DSN, VITE_SENTRY_ENVIRONMENT, VITE_SENTRY_TRACES_SAMPLE_RATE
 *   VITE_POSTHOG_KEY, VITE_POSTHOG_HOST (default https://us.i.posthog.com)
 *   VITE_PLAUSIBLE_DOMAIN, VITE_PLAUSIBLE_SRC (default https://plausible.io/js/script.js)
 */
import { loadScript } from "./loadScript";

const env = import.meta.env;
let sentry = null;

export async function initSentry() {
  if (!env.VITE_SENTRY_DSN || sentry) return sentry;
  try {
    // Dynamic import → Sentry lives in its own chunk, downloaded only when a DSN is configured.
    const Sentry = await import("@sentry/react");
    Sentry.init({
      dsn: env.VITE_SENTRY_DSN,
      environment: env.VITE_SENTRY_ENVIRONMENT || env.MODE,
      release: env.VITE_SENTRY_RELEASE || undefined,
      tracesSampleRate: Number(env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0),
      sendDefaultPii: false,
      integrations: Number(env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0) > 0 ? [Sentry.browserTracingIntegration()] : [],
    });
    sentry = Sentry;
  } catch (e) {
    console.warn("Sentry failed to load", e);
  }
  return sentry;
}

/** Report an error if Sentry is on (no-op otherwise). */
export function captureException(err, context) {
  sentry?.captureException(err, context ? { extra: context } : undefined);
}

function initPostHog() {
  const key = env.VITE_POSTHOG_KEY;
  if (!key) return false;
  const host = (env.VITE_POSTHOG_HOST || "https://us.i.posthog.com").replace(/\/$/, "");
  const assets = host.replace("://us.i.", "://us-assets.i.").replace("://eu.i.", "://eu-assets.i.");
  loadScript(`${assets}/static/array.js`)
    .then(() => {
      window.posthog?.init(key, {
        api_host: host,
        person_profiles: "identified_only",
        capture_pageview: true,
        autocapture: false,        // keep it light for low-end phones / slow networks
        disable_session_recording: true,
      });
    })
    .catch(() => {});
  return true;
}

function initPlausible() {
  const domain = env.VITE_PLAUSIBLE_DOMAIN;
  if (!domain) return false;
  window.plausible = window.plausible || function (...a) { (window.plausible.q = window.plausible.q || []).push(a); };
  loadScript(env.VITE_PLAUSIBLE_SRC || "https://plausible.io/js/script.js", { "data-domain": domain }).catch(() => {});
  return true;
}

/** Custom event to whichever analytics provider is active. */
export function trackEvent(name, props = {}) {
  try {
    if (window.posthog?.capture) window.posthog.capture(name, props);
    else if (typeof window.plausible === "function" && env.VITE_PLAUSIBLE_DOMAIN) window.plausible(name, { props });
  } catch { /* analytics must never break the app */ }
}

export function initMonitoring() {
  initSentry();
  // PostHog wins if both are configured.
  if (!initPostHog()) initPlausible();
}
