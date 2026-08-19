import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/** Smoke suite per CLAUDE.md: home loads, library filters work, a data
 *  page renders a chart — plus an axe WCAG 2.1 AA pass on every route
 *  family (BUILD_PLAN P4.4). */

const ROUTES = [
  "/inequality", "/inequality/learn", "/inequality/learn/kuznets-curve", "/inequality/library", "/inequality/library/papers/kuznets-1955",
  "/inequality/library/books/piketty-2014", "/inequality/library/themes/measurement", "/inequality/data",
  "/inequality/data/us-top-income-shares", "/inequality/data/country-comparison", "/inequality/perspectives",
  "/inequality/perspectives/technology-vs-politics", "/inequality/resources", "/inequality/about",
  "/inequality/about/how-we-verify-citations", "/inequality/search", "/inequality/this-does-not-exist",
];

for (const route of ROUTES) {
  test(`axe: ${route} has no serious/critical WCAG 2.1 AA violations`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad, JSON.stringify(bad.map((v) => ({ id: v.id, nodes: v.nodes.length, help: v.help })), null, 2)).toEqual([]);
  });
}

test("section home shows the three audience doors", async ({ page }) => {
  await page.goto("/inequality");
  await expect(page.getByRole("link", { name: /Learn the basics/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Open the library/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Browse resources/ })).toBeVisible();
});

test("library filters narrow the table and are keyboard-usable", async ({ page }) => {
  await page.goto("/inequality/library");
  await expect(page.getByText("22 of 22 works")).toBeVisible();
  await page.getByLabel("verified citation count").check();
  await expect(page.getByText("5 of 22 works")).toBeVisible();
  await page.getByLabel("contested findings").check();
  await expect(page.getByText(/^[0-9]+ of 22 works$/)).toBeVisible();
  // keyboard: tab to the Year sort header and activate
  await page.getByRole("button", { name: /Year/ }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("columnheader", { name: /Year/ })).toHaveAttribute("aria-sort", /descending|ascending/);
});

test("data page renders a chart from real synced data with a data-as-of stamp and table alternative", async ({ page }) => {
  await page.goto("/inequality/data/us-top-income-shares");
  // The figure is aria-hidden (the table is the accessible alternative), so
  // assert on rendered line marks rather than visibility.
  await expect.poll(async () => page.locator("figure svg g[aria-label='line'] path").count()).toBeGreaterThan(0);
  await expect(page.getByText(/Data as of/)).toBeVisible();
  await page.getByText("Data table (text alternative)").click();
  await expect(page.locator("details table tbody tr").first()).toBeVisible();
});

test("unverified citation state is explicit, never blank", async ({ page }) => {
  await page.goto("/inequality/library/papers/katz-murphy-1992");
  await expect(page.getByText("Citation count not independently verified")).toBeVisible();
});
