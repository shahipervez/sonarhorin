import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { storyLink, STORY_SETS } from "../components/StoryRail";
import { MATCH } from "../pages/Internships";
import { CH, daysLeft, getCH, money } from "../pages/Jobs";

describe("money", () => {
  it("formats a salary range in thousands of taka", () => {
    expect(money(25000, 35000, 0)).toBe("৳25k–35k");
  });
  it("shows an open-ended minimum with +", () => {
    expect(money(30000, null, 0)).toBe("৳30k+");
  });
  it("rounds to the nearest thousand", () => {
    expect(money(12499, 18600, 0)).toBe("৳12k–19k");
  });
  it("says negotiable when there is no minimum (EN/BN)", () => {
    expect(money(null, 50000, 0)).toBe("Salary negotiable");
    expect(money(0, 0, 1)).toBe("বেতন আলোচনা সাপেক্ষে");
  });
});

describe("daysLeft", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-19T10:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("returns null without a deadline", () => {
    expect(daysLeft(null)).toBeNull();
    expect(daysLeft("")).toBeNull();
  });
  it("counts whole days until the deadline (UTC)", () => {
    expect(daysLeft("2026-11-19")).toBe(0);
    expect(daysLeft("2026-11-20")).toBe(1);
    expect(daysLeft("2026-11-29")).toBe(10);
  });
  it("is negative for past deadlines", () => {
    expect(daysLeft("2026-11-18")).toBe(-1);
  });

  // KNOWN BUG: `new Date("YYYY-MM-DD")` is parsed as UTC midnight but "today" is local midnight, so in
  // Asia/Dhaka (UTC+6) every deadline shows one extra day ("ends today" shows 1d). Remove `.fails` when fixed.
  it.fails("counts days correctly in Asia/Dhaka (UTC+6)", () => {
    const prev = process.env.TZ;
    process.env.TZ = "Asia/Dhaka";
    try {
      expect(daysLeft("2026-11-19")).toBe(0);
      expect(daysLeft("2026-11-20")).toBe(1);
    } finally {
      process.env.TZ = prev;
    }
  });
});

describe("apply channels", () => {
  it("getCH has the three channels in both languages", () => {
    for (const L of [0, 1]) {
      const ch = getCH(L);
      expect(Object.keys(ch)).toEqual(["partner", "email", "portal"]);
      for (const c of Object.values(ch)) expect(c.t && c.d && c.cls).toBeTruthy();
    }
    expect(getCH(1).partner.t).toBe("১-ক্লিক");
    expect(CH.email.t).toBe("Email apply");
  });
});

describe("internship MATCH filters", () => {
  const job = (o = {}) => ({ title: "Intern", description: "", location: "Dhaka", remote: false, salary_min: null, company: { name: "Nodi Labs", is_partner: false }, ...o });

  it("paid: stipend > 0 or text mentions pay", () => {
    expect(MATCH.paid(job({ salary_min: 10000 }))).toBe(true);
    expect(MATCH.paid(job({ description: "Monthly stipend provided" }))).toBe(true);
    expect(MATCH.paid(job())).toBe(false);
  });
  it("unpaid: no stipend, or a learning/certificate internship", () => {
    expect(MATCH.unpaid(job())).toBe(true);
    expect(MATCH.unpaid(job({ salary_min: 0 }))).toBe(true);
    expect(MATCH.unpaid(job({ salary_min: 8000 }))).toBe(false);
    expect(MATCH.unpaid(job({ salary_min: 8000, title: "Volunteer intern" }))).toBe(true);
  });
  it("versity: academic credit keywords", () => {
    expect(MATCH.versity(job({ description: "Counts as university credit" }))).toBe(true);
    expect(MATCH.versity(job({ title: "Final-year thesis intern" }))).toBe(true);
    expect(MATCH.versity(job())).toBe(false);
  });
  it("corporate: partner company or corporate-sounding name", () => {
    expect(MATCH.corporate(job({ company: { name: "Tiny", is_partner: true } }))).toBeTruthy();
    expect(MATCH.corporate(job({ company: { name: "Padma Bank Ltd" } }))).toBe(true);
    expect(MATCH.corporate(job({ company: { name: "Nodi Labs" } }))).toBe(false);
    expect(MATCH.corporate(job({ company: undefined }))).toBe(false);
  });
  it("remote: flag or WFH wording", () => {
    expect(MATCH.remote(job({ remote: true }))).toBe(true);
    expect(MATCH.remote(job({ location: "Work from home" }))).toBe(true);
    expect(MATCH.remote(job())).toBe(false);
  });
  it("has a filter for every internship story category", () => {
    for (const s of STORY_SETS.internship) expect(typeof MATCH[s.id]).toBe("function");
  });
});

describe("storyLink", () => {
  it("job stories link to /jobs filtered by major + category", () => {
    const it0 = STORY_SETS.job.find((s) => s.id === "business");
    expect(storyLink("job", it0)).toBe("/jobs?major=Business%20Administration%20(BBA)&cat=business");
  });
  it("encodes ampersands in majors", () => {
    expect(storyLink("job", { id: "x", major: "Computer Science & Engineering" })).toBe("/jobs?major=Computer%20Science%20%26%20Engineering&cat=x");
  });
  it("internship stories link to /internships?cat=", () => {
    expect(storyLink("internship", STORY_SETS.internship[0])).toBe("/internships?cat=paid");
  });
  it("every job story has a major and every set has bilingual names", () => {
    for (const s of STORY_SETS.job) expect(s.major).toBeTruthy();
    for (const s of [...STORY_SETS.job, ...STORY_SETS.internship]) expect(s.name).toHaveLength(2);
  });
});
