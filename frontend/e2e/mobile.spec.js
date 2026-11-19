import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, skipGate } from "./helpers";

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

for (const lang of ["en", "bn"]) {
  test.describe(`mobile 390x844 (${lang})`, () => {
    for (const [path, track] of [["/", "job"], ["/?track=internship", "internship"], ["/jobs", "job"], ["/internships", "internship"]]) {
      test(`no horizontal scroll on ${path}`, async ({ page }) => {
        await skipGate(page, track, lang);
        await page.goto(path);
        await expect(page.locator("main").first()).toBeVisible();
        await expectNoHorizontalScroll(page);
        // scroll through the page so lazy/animated sections mount, then check again
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
          scrollTo(0, 0);
        });
        await expectNoHorizontalScroll(page);
      });
    }
  });
}

test("mobile gate fits the viewport", async ({ page }) => {
  await page.goto("/?gate=1");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expectNoHorizontalScroll(page);
});
