import { describe, expect, it } from "vitest";
import { assignRanks, type Country } from "../scripts/lib";

const mk = (iso3: string, name: string, priceUSD: number): Country => ({
  iso3,
  name,
  region: "Test",
  priceUSD,
  priceLow: priceUSD * 0.9,
  priceHigh: priceUSD * 1.1,
  tier: "surveyed",
  source: "test",
  gdpPerCapitaUSD: null,
  gdpYear: null,
  burdenPct: null,
  rank: null,
  updated: "2026-07-02",
});

describe("assignRanks — competition ranking (SPEC §6.2)", () => {
  it("gives rank 1 to the most expensive", () => {
    const out = assignRanks([mk("AAA", "Cheap", 1), mk("BBB", "Pricey", 4)]);
    expect(out[0].iso3).toBe("BBB");
    expect(out[0].rank).toBe(1);
  });

  it("ties share the minimum rank and the next rank skips (1,2,2,4)", () => {
    const out = assignRanks([
      mk("AAA", "Top", 5),
      mk("BBB", "TieOne", 3),
      mk("CCC", "TieTwo", 3),
      mk("DDD", "Last", 1),
    ]);
    expect(out.map((c) => c.rank)).toEqual([1, 2, 2, 4]);
  });

  it("orders tied economies alphabetically by name", () => {
    const out = assignRanks([
      mk("ZZZ", "Zebra", 2),
      mk("AAA", "Aardvark", 2),
    ]);
    expect(out.map((c) => c.name)).toEqual(["Aardvark", "Zebra"]);
    expect(out.map((c) => c.rank)).toEqual([1, 1]);
  });
});
