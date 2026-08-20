import { describe, expect, it } from "vitest";
import {
  olsDetailed, spearmanRho, transformPoints, residuals, topResiduals,
  twoTailedT, tQuantile975, slopeInWords,
} from "@/lib/lab-stats";

/** Hand-computed fixture (same points as the Pearson DoD test):
 *  x = 1..5, y = (2,4,5,4,5)
 *  slope = 0.6, intercept = 2.2, r = 0.774597, R² = 0.6
 *  SSE = 2.4 → s² = 0.8, Sxx = 10 → SE(slope) = √0.08 = 0.282843
 *  t = 2.12132, df = 3 → two-tailed p ≈ 0.124 (scipy: 0.12402)
 *  t.975(3) = 3.18245 → CI = 0.6 ± 3.18245·0.282843 = [-0.3001, 1.5001] */
const PTS = [
  { x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 5 }, { x: 4, y: 4 }, { x: 5, y: 5 },
];

describe("olsDetailed — verified against a hand calculation", () => {
  const fit = olsDetailed(PTS)!;
  it("slope, intercept, r, R²", () => {
    expect(fit.slope).toBeCloseTo(0.6, 10);
    expect(fit.intercept).toBeCloseTo(2.2, 10);
    expect(fit.r).toBeCloseTo(0.7745966692, 8);
    expect(fit.r2).toBeCloseTo(0.6, 10);
  });
  it("standard error, t, p, CI", () => {
    expect(fit.seSlope).toBeCloseTo(0.2828427, 6);
    expect(fit.t).toBeCloseTo(2.1213203, 6);
    expect(fit.p).toBeCloseTo(0.12402, 4);
    expect(fit.ci95[0]).toBeCloseTo(-0.30012, 4);
    expect(fit.ci95[1]).toBeCloseTo(1.50012, 4);
  });
  it("returns null for degenerate input", () => {
    expect(olsDetailed([{ x: 1, y: 1 }, { x: 2, y: 2 }])).toBeNull();
    expect(olsDetailed([{ x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }])).toBeNull();
  });
});

describe("t distribution machinery", () => {
  it("matches known critical values", () => {
    expect(twoTailedT(3.182446, 3)).toBeCloseTo(0.05, 4);   // t.975(3)
    expect(twoTailedT(1.959964, 1e6)).toBeCloseTo(0.05, 3); // → normal
    expect(twoTailedT(2.570582, 5)).toBeCloseTo(0.05, 4);   // t.975(5)
    expect(tQuantile975(3)).toBeCloseTo(3.182446, 3);
    expect(tQuantile975(30)).toBeCloseTo(2.042272, 3);
  });
});

describe("spearmanRho", () => {
  it("is 1 for any monotone relationship (where Pearson is not)", () => {
    const mono = [1, 2, 3, 4, 5].map((v) => ({ x: v, y: Math.exp(v) }));
    expect(spearmanRho(mono)).toBeCloseTo(1, 12);
    expect(olsDetailed(mono)!.r).toBeLessThan(1);
  });
  it("handles ties with average ranks (hand-checked: ρ = 0.35 exactly... verified below)", () => {
    // x: 1,2,2,4  ranks 1, 2.5, 2.5, 4 ; y: 10,20,20,15 ranks 1, 3.5, 3.5, 2
    const pts = [{ x: 1, y: 10 }, { x: 2, y: 20 }, { x: 2, y: 20 }, { x: 4, y: 15 }];
    // hand: dx=(-1.5,0,0,1.5), dy=(-1.5,1,1,-0.5); sxy=2.25-0.75=1.5; sxx=4.5; syy=4.5 → ρ=1.5/4.5=1/3
    expect(spearmanRho(pts)).toBeCloseTo(1 / 3, 10);
  });
});

describe("transform space — the fix for the log bug", () => {
  it("log-log recovers the elasticity of a power law exactly", () => {
    const pts = [1, 2, 4, 8, 16].map((x) => ({ x, y: 3 * Math.pow(x, 0.7) }));
    const t = transformPoints(pts, { logX: true, logY: true });
    const fit = olsDetailed(t.map((d) => d.t))!;
    expect(fit.slope).toBeCloseTo(0.7, 10);
    expect(Math.exp(fit.intercept)).toBeCloseTo(3, 10);
    expect(fit.r2).toBeCloseTo(1, 10);
  });
  it("drops non-positive values only on logged axes", () => {
    const pts = [{ x: -1, y: 2 }, { x: 2, y: -3 }, { x: 4, y: 5 }];
    expect(transformPoints(pts, { logX: true, logY: false })).toHaveLength(2);
    expect(transformPoints(pts, { logX: false, logY: true })).toHaveLength(2);
    expect(transformPoints(pts, { logX: false, logY: false })).toHaveLength(3);
  });
});

describe("residuals", () => {
  it("computes and ranks residuals in the fit space", () => {
    const t = transformPoints(PTS, { logX: false, logY: false });
    const res = residuals(t, { slope: 0.6, intercept: 2.2 });
    expect(res.map((r) => Number(r.residual.toFixed(10)))).toEqual([-0.8, 0.6, 1, -0.6, -0.2]);
    const top = topResiduals(res, 2);
    expect(top[0].orig.x).toBe(3); // residual +1.0
    expect(top[1].orig.x).toBe(1); // residual -0.8
  });
});

describe("slopeInWords", () => {
  const fit = { slope: 0.58 } as never;
  it("reads elasticity for log-log", () => {
    expect(slopeInWords(fit, { logX: true, logY: true }, "GDP per capita", "espresso price")).toContain("10% higher GDP per capita");
  });
  it("reads percent-per-unit for log-Y", () => {
    expect(slopeInWords(fit, { logX: false, logY: true }, "X", "Y")).toContain("%");
  });
});
