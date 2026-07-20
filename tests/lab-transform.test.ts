import { describe, expect, it } from "vitest";
import { toIndex100, toYoY } from "../src/lib/lab-transform";
import type { TidyRow } from "../src/lib/datalab-types";

const row = (iso3: string, date: string, value: number): TidyRow => ({
  iso3,
  date,
  indicator: "v",
  value,
});

describe("toYoY", () => {
  it("computes percent change vs the prior year (annual)", () => {
    const out = toYoY([row("ITA", "2024", 100), row("ITA", "2025", 110)], "v");
    expect(out).toEqual([{ iso3: "ITA", date: "2025", indicator: "v", value: 10 }]);
  });

  it("matches monthly observations to twelve months earlier", () => {
    const out = toYoY(
      [row("WLD", "2025-03", 2), row("WLD", "2026-03", 3), row("WLD", "2026-02", 99)],
      "v",
    );
    expect(out).toEqual([
      { iso3: "WLD", date: "2026-03", indicator: "v", value: 50 },
    ]);
  });

  it("drops rows with no prior observation or a zero base", () => {
    expect(toYoY([row("ITA", "2025", 5)], "v")).toEqual([]);
    expect(toYoY([row("ITA", "2024", 0), row("ITA", "2025", 5)], "v")).toEqual([]);
  });
});

describe("toIndex100", () => {
  it("indexes each country to 100 at its first observation in range", () => {
    const out = toIndex100(
      [row("ITA", "2020", 50), row("ITA", "2025", 75), row("FRA", "2021", 200), row("FRA", "2025", 300)],
      "v",
    );
    expect(out).toEqual([
      { iso3: "ITA", date: "2020", indicator: "v", value: 100 },
      { iso3: "ITA", date: "2025", indicator: "v", value: 150 },
      { iso3: "FRA", date: "2021", indicator: "v", value: 100 },
      { iso3: "FRA", date: "2025", indicator: "v", value: 150 },
    ]);
  });

  it("re-bases when a fromYear cuts the early observations", () => {
    const out = toIndex100(
      [row("ITA", "2020", 50), row("ITA", "2024", 100), row("ITA", "2025", 110)],
      "v",
      "2024",
    );
    expect(out.map((r) => r.value)).toEqual([100, 110]);
  });
});
