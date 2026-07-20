import { describe, expect, it } from "vitest";
import { joinScatter, olsFit, pearsonR } from "../src/lib/lab-join";
import type { TidyRow } from "../src/lib/datalab-types";

const row = (iso3: string, date: string, indicator: string, value: number): TidyRow => ({
  iso3,
  date,
  indicator,
  value,
});

describe("joinScatter — nearest-date rule (§3.4)", () => {
  it("takes the most recent observation of each series ≤ the selected year", () => {
    const x = [
      row("ITA", "2024", "gdp", 100),
      row("ITA", "2025", "gdp", 110), // most recent ≤ 2026
      row("ITA", "2027", "gdp", 999), // future — excluded
    ];
    const y = [row("ITA", "2026-07", "price", 1.45)]; // monthly precision joins annual
    const joined = joinScatter(x, "gdp", y, "price", "2026", "all");
    expect(joined).toEqual([
      { iso3: "ITA", x: 110, y: 1.45, xDate: "2025", yDate: "2026-07" },
    ]);
  });

  it("drops countries missing from either side and WLD global rows", () => {
    const x = [row("ITA", "2025", "gdp", 1), row("FRA", "2025", "gdp", 2), row("WLD", "2025", "gdp", 3)];
    const y = [row("ITA", "2025", "price", 9), row("WLD", "2025", "price", 8)];
    expect(joinScatter(x, "gdp", y, "price", "2026", "all").map((p) => p.iso3)).toEqual(["ITA"]);
  });

  it("respects an explicit country selection", () => {
    const x = [row("ITA", "2025", "g", 1), row("FRA", "2025", "g", 2)];
    const y = [row("ITA", "2025", "p", 3), row("FRA", "2025", "p", 4)];
    expect(joinScatter(x, "g", y, "p", "2026", ["FRA"]).map((p) => p.iso3)).toEqual(["FRA"]);
  });
});

describe("pearsonR — DoD: verified against a hand calculation", () => {
  it("matches the hand-computed r for a small fixture", () => {
    // Hand calculation, points (1,2) (2,4) (3,5) (4,4) (5,5):
    // mx=3, my=4; Σ(dx·dy)=6; Σdx²=10, Σdy²=6 → r = 6/√60 = 0.7745966…
    const pts = [
      { x: 1, y: 2 },
      { x: 2, y: 4 },
      { x: 3, y: 5 },
      { x: 4, y: 4 },
      { x: 5, y: 5 },
    ];
    expect(pearsonR(pts)).toBeCloseTo(0.7745966692, 8);
  });

  it("is exactly 1 for a perfect line and NaN for degenerate inputs", () => {
    const line = [1, 2, 3, 4].map((v) => ({ x: v, y: 3 * v - 1 }));
    expect(pearsonR(line)).toBeCloseTo(1, 12);
    expect(pearsonR([{ x: 1, y: 1 }, { x: 2, y: 2 }])).toBeNaN(); // n < 3
    expect(pearsonR([{ x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }])).toBeNaN(); // zero variance
  });
});

describe("olsFit", () => {
  it("recovers slope and intercept of a perfect line", () => {
    const fit = olsFit([1, 2, 3, 4].map((v) => ({ x: v, y: 3 * v - 1 })))!;
    expect(fit.b).toBeCloseTo(3, 12);
    expect(fit.a).toBeCloseTo(-1, 12);
  });

  it("returns null for degenerate inputs", () => {
    expect(olsFit([{ x: 1, y: 1 }])).toBeNull();
    expect(olsFit([{ x: 2, y: 1 }, { x: 2, y: 5 }, { x: 2, y: 9 }])).toBeNull();
  });
});
