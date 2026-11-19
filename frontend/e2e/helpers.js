import { expect } from "@playwright/test";

/** Pretend the visitor already picked a track this session, so the entry gate stays closed. */
export async function skipGate(page, track = "job", lang = "en") {
  await page.addInitScript(
    ([t, l]) => {
      try {
        if (!sessionStorage.getItem("__e2e_init")) {
          localStorage.setItem("prothom_track", t);
          localStorage.setItem("prothom_lang", l);
          sessionStorage.setItem("prothom_track_session_chosen", "1");
          sessionStorage.setItem("__e2e_init", "1");
        }
      } catch { /* ignore */ }
    },
    [track, lang],
  );
}

/** Fresh visitor in a given language (gate will show). */
export async function freshVisitor(page, lang = "en") {
  await page.addInitScript((l) => {
    try {
      if (!sessionStorage.getItem("__e2e_init")) {
        localStorage.clear();
        localStorage.setItem("prothom_lang", l);
        sessionStorage.setItem("__e2e_init", "1");
      }
    } catch { /* ignore */ }
  }, lang);
}

/** Text that may be shown in English or Bangla depending on the toggle. */
export const either = (en, bn) => new RegExp(`${esc(en)}|${esc(bn)}`, "i");
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function expectNoHorizontalScroll(page) {
  // let lazy sections/animations settle
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(500);
  const { sw, cw } = await page.evaluate(() => ({
    sw: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    cw: document.documentElement.clientWidth,
  }));
  expect(sw, `page is ${sw}px wide in a ${cw}px viewport`).toBeLessThanOrEqual(cw + 1);
}

/** Fetch from the backend through the vite proxy — used to compare UI with seeded data. */
export async function apiGet(request, path) {
  const r = await request.get(path);
  expect(r.ok(), `GET ${path} → ${r.status()}`).toBeTruthy();
  return r.json();
}
