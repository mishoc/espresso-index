import { describe, expect, it } from "vitest";
import { latestGini } from "../src/lib/inequality/gini-map";
import type { TidyRow } from "../src/lib/datalab-types";

const row = (iso3: string, date: string, value: number): TidyRow => ({
  iso3,
  date,
  indicator: "gini_index",
  value,
});

describe("latestGini — most recent survey per country", () => {
  const rows = [
    row("ZAF", "2014", 63.0),
    row("ZAF", "2022", 54.1), // newer survey wins even with a lower value
    row("SVK", "2023", 23.8),
    row("BRA", "2023", 51.6),
    { iso3: "BRA", date: "2023", indicator: "other", value: 1 } as TidyRow,
  ];

  it("keeps one row per country with its survey year, sorted most-unequal first", () => {
    expect(latestGini(rows)).toEqual([
      { iso3: "ZAF", value: 54.1, year: "2022" },
      { iso3: "BRA", value: 51.6, year: "2023" },
      { iso3: "SVK", value: 23.8, year: "2023" },
    ]);
  });

  it("respects the upto-year cap (time slider semantics)", () => {
    const capped = latestGini(rows, "2015");
    expect(capped).toEqual([{ iso3: "ZAF", value: 63.0, year: "2014" }]);
  });

  it("ignores non-gini indicators", () => {
    expect(latestGini(rows).find((g) => g.iso3 === "BRA")!.value).toBe(51.6);
  });
});
