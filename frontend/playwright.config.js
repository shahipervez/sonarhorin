import { defineConfig, devices } from "@playwright/test";

/**
 * E2E suite. Assumes the Django API is ALREADY running and seeded at http://127.0.0.1:8000
 * (`python manage.py seed && python manage.py runserver 8000`). Playwright starts its own Vite dev
 * server on E2E_PORT (default 5185), which proxies /api and /media to :8000.
 *
 *   npm run e2e                     # headless, all specs
 *   E2E_BASE_URL=https://staging… npm run e2e   # run against a deployed site (no local vite)
 */
const PORT = Number(process.env.E2E_PORT || 5185);
const BASE = process.env.E2E_BASE_URL || `http://127.0.0.1:${PORT}`;
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["list"]],
  use: {
    baseURL: BASE,
    trace: "off",
    screenshot: "only-on-failure",
    reducedMotion: "reduce",
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npx vite --port ${PORT} --strictPort --host 127.0.0.1`,
        url: BASE,
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
