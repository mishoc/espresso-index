import { describe, expect, it } from "vitest";
import lists from "@/../content/inequality/resources/reading-lists.json";
import { getAllWorks } from "@/lib/inequality/research-works";

const VALID_STATIC = new Set([
  "/inequality/learn/what-is-inequality", "/inequality/learn/how-its-measured", "/inequality/learn/kuznets-curve",
  "/inequality/data/us-top-income-shares", "/inequality/data/country-comparison",
  "/inequality/perspectives/technology-vs-politics", "/inequality/perspectives/does-inequality-hurt-growth", "/inequality/perspectives/gilens-page-debate",
  "/inequality/about/how-we-verify-citations", "/inequality/library/bibliography.bib",
  ...getAllWorks().map((w) => `/inequality/library/${w.type === "paper" ? "papers" : "books"}/${w.id}`),
]);

describe("resources (P4.2)", () => {
  it("each list has 5–10 entries and every link resolves to a real site page", () => {
    expect(lists.lists).toHaveLength(3);
    for (const l of lists.lists) {
      expect(l.items.length).toBeGreaterThanOrEqual(5);
      expect(l.items.length).toBeLessThanOrEqual(10);
      for (const i of l.items) expect(VALID_STATIC.has(i.href), `${l.id}: ${i.href}`).toBe(true);
    }
  });
});
