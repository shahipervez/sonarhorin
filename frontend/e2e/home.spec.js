import { expect, test } from "@playwright/test";
import { either, freshVisitor, skipGate } from "./helpers";

test.describe("Home — track gate", () => {
  test("first visit shows the Job / Internship / Startup choice", async ({ page }) => {
    await freshVisitor(page);
    await page.goto("/");
    const gate = page.getByRole("dialog");
    await expect(gate).toBeVisible();
    await expect(gate.getByRole("heading", { level: 1 })).toContainText(/LOOKING/i);
    await expect(gate.getByRole("button", { name: /FIND A JOB/i })).toBeVisible();
    await expect(gate.getByRole("button", { name: /INTERNSHIP/i })).toBeVisible();
    await expect(gate.getByRole("button", { name: /IDEA TO BUSINESS/i })).toBeVisible();
    await expect(gate.getByRole("button", { name: /Just browsing/i })).toBeVisible();
  });

  test("gate is bilingual: the language toggle switches cards to Bangla", async ({ page }) => {
    await freshVisitor(page);
    await page.goto("/");
    const gate = page.getByRole("dialog");
    await gate.getByRole("button", { name: /^বাংলা/ }).click();
    // (match Bangla loosely: the codebase mixes precomposed/decomposed forms of some letters, e.g. য়)
    await expect(gate.getByRole("button", { name: /^০১ \/\/ / })).toBeVisible();
    await expect(gate.getByRole("button", { name: /FIND A JOB/i })).toHaveCount(0);
    await expect(page.locator("html")).toHaveAttribute("lang", "bn");
    await gate.getByRole("button", { name: "Switch to English" }).click();
    await expect(gate.getByRole("button", { name: /FIND A JOB/i })).toBeVisible();
  });

  test("choosing Internship closes the gate and shows internship categories", async ({ page }) => {
    await freshVisitor(page);
    await page.goto("/");
    await page.getByRole("dialog").getByRole("button", { name: /FIND INTERNSHIP|INTERNSHIP/i }).first().click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page).toHaveURL(/track=internship/);
    const main = page.locator("main").first();
    for (const [en, bn] of [["Paid", "পেইড"], ["Learning", "লার্নিং"], ["Versity Credit", "ভার্সিটি ক্রেডিট"], ["Corporate", "কর্পোরেট"], ["Remote", "রিমোট"]]) {
      await expect(main.getByText(either(en, bn)).first()).toBeVisible();
    }
    expect(await page.evaluate(() => localStorage.getItem("prothom_track"))).toBe("internship");
  });

  test("'Just browsing' lands on the job track", async ({ page }) => {
    await freshVisitor(page);
    await page.goto("/");
    await page.getByRole("button", { name: /Just browsing/i }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page).toHaveURL(/track=job/);
    await expect(page.locator("main").first().getByText(either("IT & Software", "আইটি ও সফটওয়্যার")).first()).toBeVisible();
  });

  test("returning in the same session skips the gate; ?gate reopens it", async ({ page }) => {
    await skipGate(page, "job");
    await page.goto("/");
    await expect(page.getByRole("navigation").or(page.locator("nav")).first()).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.goto("/?gate=1");
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
