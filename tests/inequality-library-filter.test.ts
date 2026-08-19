import { describe, expect, it } from "vitest";
import { applyFilters, DEFAULT_FILTERS, sortWorks } from "@/lib/inequality/library-filter";
import { getAllWorks, disciplineOf } from "@/lib/inequality/research-works";

const works = getAllWorks();
const f = (over: Partial<typeof DEFAULT_FILTERS>) => ({ ...DEFAULT_FILTERS, ...over });

describe("library filters (P2.1) — each filter, alone and combined, yields the mathematically correct subset", () => {
  it("defaults show all 22", () => {
    expect(applyFilters(works, DEFAULT_FILTERS)).toHaveLength(22);
  });

  it("discipline", () => {
    const ps = applyFilters(works, f({ discipline: "political-science" }));
    expect(ps.length).toBe(works.filter((w) => disciplineOf(w) !== "economics").length);
    expect(ps.map((w) => w.id)).toContain("gilens-page-2014");
    expect(ps.map((w) => w.id)).not.toContain("katz-murphy-1992");
  });

  it("theme multi-select is OR across themes", () => {
    const got = applyFilters(works, f({ themes: ["mobility", "global-inequality"] }));
    const expected = works.filter((w) => w.themes.includes("mobility") || w.themes.includes("global-inequality"));
    expect(got.map((w) => w.id).sort()).toEqual(expected.map((w) => w.id).sort());
    expect(got.length).toBe(3);
  });

  it("year range is inclusive on both ends", () => {
    const got = applyFilters(works, f({ yearMin: 2008, yearMax: 2014 }));
    expect(got.every((w) => w.year >= 2008 && w.year <= 2014)).toBe(true);
    expect(got.length).toBe(works.filter((w) => w.year >= 2008 && w.year <= 2014).length);
  });

  it("verified-only keeps exactly the works with a sourced citation_count", () => {
    const got = applyFilters(works, f({ verifiedOnly: true }));
    expect(got.length).toBe(works.filter((w) => w.citation_count !== null).length);
    expect(got.length).toBe(5);
  });

  it("contested-only", () => {
    const got = applyFilters(works, f({ contestedOnly: true }));
    expect(got.every((w) => w.is_contested)).toBe(true);
    expect(got.length).toBe(works.filter((w) => w.is_contested).length);
  });

  it("combination is an intersection", () => {
    const got = applyFilters(works, f({ contestedOnly: true, discipline: "political-science", yearMax: 2000 }));
    expect(got.map((w) => w.id).sort()).toEqual(["alesina-rodrik-1994", "meltzer-richard-1981", "persson-tabellini-1994"]);
  });

  it("query matches title/authors/venue, case-insensitive", () => {
    expect(applyFilters(works, f({ query: "CHETTY" })).length).toBe(2);
    expect(applyFilters(works, f({ query: "science" })).length).toBeGreaterThanOrEqual(2); // venue Science
    expect(applyFilters(works, f({ query: "zzzz" }))).toHaveLength(0);
  });

  it("citation sort puts unverified last in both directions", () => {
    const asc = sortWorks(works, "citations", "asc");
    const desc = sortWorks(works, "citations", "desc");
    expect(asc.at(-1)!.citation_count).toBeNull();
    expect(desc.at(-1)!.citation_count).toBeNull();
    expect(desc[0].id).toBe("kuznets-1955");
  });
});
