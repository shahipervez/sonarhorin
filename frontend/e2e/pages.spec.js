import { expect, test } from "@playwright/test";
import { apiGet, either, skipGate } from "./helpers";

test.beforeEach(async ({ page }) => skipGate(page));

test.describe("/jobs", () => {
  test("lists the seeded fresher jobs with apply channels", async ({ page, request }) => {
    const api = await apiGet(request, "/api/jobs/");
    expect(api.count, "backend at :8000 must be seeded (python manage.py seed)").toBeGreaterThan(0);
    await page.goto("/jobs");
    await expect(page.getByRole("heading", { name: either("Fresher Jobs", "ফ্রেশার") }).first()).toBeVisible();
    await expect(page.getByText(new RegExp(`${api.count} fresher jobs`, "i"))).toBeVisible();
    // the first few titles from the API are visible on the board
    for (const j of api.jobs.slice(0, 3)) {
      await expect(page.getByText(j.title, { exact: true }).first()).toBeVisible();
    }
    await expect(page.getByText(/Company portal/).first()).toBeVisible();
  });

  test("type filter narrows the list", async ({ page, request }) => {
    const trainee = await apiGet(request, "/api/jobs/?type=trainee");
    await page.goto("/jobs");
    await page.locator("select").filter({ has: page.locator('option[value="trainee"]') }).first().selectOption("trainee");
    await expect(page.getByText(new RegExp(`${trainee.count} fresher jobs`, "i"))).toBeVisible();
  });

  test("/jobs?type=internship forwards to /internships", async ({ page }) => {
    await page.goto("/jobs?type=internship&cat=paid");
    await expect(page).toHaveURL(/\/internships\?cat=paid/);
  });
});

test.describe("/internships", () => {
  test("shows the story, departure-board categories and boarding passes", async ({ page, request }) => {
    const api = await apiGet(request, "/api/jobs/?type=internship");
    await page.goto("/internships");
    const main = page.locator("main").first();
    await expect(main.getByText(either("Every gate has a story", "গল্প"))).toBeVisible();
    await expect(main.getByText(/CHAPTER 1|অধ্যায়/).first()).toBeVisible();
    for (const [en, bn] of [["Paid", "পেইড"], ["Learning", "লার্নিং"], ["Versity Credit", "ভার্সিটি ক্রেডিট"], ["Corporate", "কর্পোরেট"], ["Remote", "রিমোট"]]) {
      await expect(main.getByText(either(en, bn)).first()).toBeVisible();
    }
    await expect(main.getByText(new RegExp(`${api.count} pass(es)? found`, "i"))).toBeVisible();
    if (api.count) {
      await expect(main.getByText(/BOARDING PASS/).first()).toBeVisible();
      await expect(main.getByText(api.jobs[0].title).first()).toBeVisible();
    }
  });
});

test.describe("/login", () => {
  test("renders the login form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: either("Login", "লগইন") })).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /^(Login|লগইন)$/ })).toBeVisible();
    await expect(page.getByRole("link", { name: either("Register", "রেজিস্টার") }).first()).toBeVisible();
  });

  test("wrong password shows an error, no crash", async ({ page }) => {
    // Stub the API: real failed logins would count towards the shared backend's per-IP lockout (20 fails / 15 min).
    let hit = 0;
    await page.route("**/api/auth/login/", (route) => {
      hit++;
      return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ detail: "Phone number/Gmail or password is incorrect." }) });
    });
    await page.goto("/login");
    await page.locator('input[placeholder="01XXXXXXXXX"]').fill("01999999999");
    await page.locator('input[type="password"]').fill("definitely-wrong-1");
    await page.getByRole("button", { name: /^(Login|লগইন)$/ }).click();
    await expect(page.getByText(/Wrong|incorrect|ভুল|সঠিক নয়|Too many/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
    expect(hit).toBe(1);
  });
});

test("unknown route shows the 404 page", async ({ page }) => {
  await page.goto("/this-page-does-not-exist");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});

test("protected route redirects anonymous users to login", async ({ page }) => {
  await page.goto("/applications");
  await expect(page).toHaveURL(/\/login/);
});

test("Bangla toggle in the nav translates the page", async ({ page }) => {
  await page.goto("/jobs");
  await page.getByRole("button", { name: /^বাংলা/ }).first().click();
  await expect(page.locator("html")).toHaveAttribute("lang", "bn");
  await expect(page.getByRole("button", { name: "Switch to English" }).first()).toBeVisible();
});
