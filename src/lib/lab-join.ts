/** Scatter join + statistics (SPEC-DATALAB §3.4, §4.2).
 *  Join rule, documented: for each iso3 present in both series, take the
 *  most recent observation of each series dated ≤ the selected year.
 *  Frequencies may differ; dates compare as ISO strings. The espresso
 *  dataset is a single snapshot and always matches. */
import type { TidyRow } from "./datalab-types";

export interface JoinedPoint {
  iso3: string;
  x: number;
  y: number;
  xDate: string;
  yDate: string;
}

function latestPerCountry(
  rows: TidyRow[],
  indicator: string,
  year: string,
): Map<string, { value: number; date: string }> {
  const best = new Map<string, { value: number; date: string }>();
  for (const r of rows) {
    if (r.indicator !== indicator) continue;
    if (r.iso3 === "WLD") continue; // country scatter — global series excluded
    if (r.date.slice(0, 4) > year) continue;
    const cur = best.get(r.iso3);
    if (!cur || r.date > cur.date) best.set(r.iso3, { value: r.value, date: r.date });
  }
  return best;
}

export function joinScatter(
  xRows: TidyRow[],
  xIndicator: string,
  yRows: TidyRow[],
  yIndicator: string,
  year: string,
  countries: string[] | "all",
): JoinedPoint[] {
  const xs = latestPerCountry(xRows, xIndicator, year);
  const ys = latestPerCountry(yRows, yIndicator, year);
  const wanted = countries === "all" ? null : new Set(countries);
  const out: JoinedPoint[] = [];
  for (const [iso3, x] of xs) {
    const y = ys.get(iso3);
    if (!y) continue;
    if (wanted && !wanted.has(iso3)) continue;
    out.push({ iso3, x: x.value, y: y.value, xDate: x.date, yDate: y.date });
  }
  return out;
}

/** Pearson correlation coefficient. Returns NaN for n < 3 or zero variance. */
export function pearsonR(points: { x: number; y: number }[]): number {
  const n = points.length;
  if (n < 3) return NaN;
  const mx = points.reduce((s, p) => s + p.x, 0) / n;
  const my = points.reduce((s, p) => s + p.y, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (const p of points) {
    sxy += (p.x - mx) * (p.y - my);
    sxx += (p.x - mx) ** 2;
    syy += (p.y - my) ** 2;
  }
  if (sxx === 0 || syy === 0) return NaN;
  return sxy / Math.sqrt(sxx * syy);
}

/** Simple OLS y = a + bx for the trend line. */
export function olsFit(points: { x: number; y: number }[]): { a: number; b: number } | null {
  const n = points.length;
  if (n < 3) return null;
  const mx = points.reduce((s, p) => s + p.x, 0) / n;
  const my = points.reduce((s, p) => s + p.y, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (const p of points) {
    sxy += (p.x - mx) * (p.y - my);
    sxx += (p.x - mx) ** 2;
  }
  if (sxx === 0) return null;
  const b = sxy / sxx;
  return { a: my - b * mx, b };
}
