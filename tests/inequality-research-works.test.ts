import { describe, expect, it } from "vitest";
import { getAllThemes, getAllWorks, getWorkById, getWorksByTheme } from "@/lib/inequality/research-works";

const REQUIRED = [
  "id", "type", "title", "authors", "year", "venue", "doi_or_isbn", "url",
  "summary_plain", "summary_technical", "key_takeaways", "citation_count",
  "is_contested", "contested_note", "related_perspective_slug", "themes",
  "audience_level", "related_works",
] as const;

describe("research-works.json (P1.2)", () => {
  const works = getAllWorks();

  it("loads all 22 seed works", () => {
    expect(works).toHaveLength(22);
  });

  it("every work has every required field present (null allowed where schema says so)", () => {
    for (const w of works) {
      for (const k of REQUIRED) expect(w, `${w.id} missing ${k}`).toHaveProperty(k);
      expect(w.title.length).toBeGreaterThan(0);
      expect(w.authors.length).toBeGreaterThan(0);
      expect(["paper", "book"]).toContain(w.type);
      expect(["intro", "intermediate", "advanced"]).toContain(w.audience_level);
    }
  });

  it("a citation_count, when present, always carries a non-empty source and verified_date — never a bare number", () => {
    for (const w of works) {
      if (w.citation_count !== null) {
        expect(typeof w.citation_count.value).toBe("number");
        expect(w.citation_count.source.length, `${w.id} citation source`).toBeGreaterThan(0);
        expect(w.citation_count.verified_date, `${w.id} verified_date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it("ids are unique and every related_work / theme reference resolves", () => {
    const ids = new Set(works.map((w) => w.id));
    expect(ids.size).toBe(works.length);
    const themeIds = new Set(getAllThemes().map((t) => t.id));
    for (const w of works) {
      for (const r of w.related_works) expect(ids.has(r), `${w.id} → ${r}`).toBe(true);
      for (const t of w.themes) expect(themeIds.has(t), `${w.id} theme ${t}`).toBe(true);
    }
  });

  it("contested works carry a note; loaders work", () => {
    for (const w of works) if (w.is_contested) expect(w.contested_note, w.id).toBeTruthy();
    expect(getWorkById("kuznets-1955")?.year).toBe(1955);
    expect(getWorksByTheme("measurement").map((w) => w.id)).toContain("piketty-saez-2003");
  });
});
