/** Time-series transforms (SPEC-DATALAB §4.1): YoY % and Index=100.
 *  Applied to tidy rows per country BEFORE range filtering, so a YoY
 *  series can use the year preceding the visible range. */
import type { TidyRow } from "./datalab-types";

function prevPeriodKey(date: string): string {
  if (date.length === 4) return String(Number(date) - 1);
  // monthly "YYYY-MM": twelve months earlier
  const [y, m] = date.split("-").map(Number);
  return `${y - 1}-${String(m).padStart(2, "0")}`;
}

/** value → percent change vs the same period one year earlier.
 *  Rows without a prior-year observation are dropped. */
export function toYoY(rows: TidyRow[], indicator: string): TidyRow[] {
  const byKey = new Map<string, number>();
  for (const r of rows) {
    if (r.indicator === indicator) byKey.set(`${r.iso3}|${r.date}`, r.value);
  }
  const out: TidyRow[] = [];
  for (const r of rows) {
    if (r.indicator !== indicator) continue;
    const prev = byKey.get(`${r.iso3}|${prevPeriodKey(r.date)}`);
    if (prev === undefined || prev === 0) continue;
    out.push({
      ...r,
      value: Math.round((r.value / prev - 1) * 1000) / 10,
    });
  }
  return out;
}

/** value → indexed to 100 at each country's first observation ≥ fromYear. */
export function toIndex100(
  rows: TidyRow[],
  indicator: string,
  fromYear?: string,
): TidyRow[] {
  const filtered = rows.filter(
    (r) =>
      r.indicator === indicator &&
      (!fromYear || r.date.slice(0, 4) >= fromYear),
  );
  const base = new Map<string, { date: string; value: number }>();
  for (const r of filtered) {
    const cur = base.get(r.iso3);
    if (!cur || r.date < cur.date) base.set(r.iso3, { date: r.date, value: r.value });
  }
  const out: TidyRow[] = [];
  for (const r of filtered) {
    const b = base.get(r.iso3);
    if (!b || b.value === 0) continue;
    out.push({ ...r, value: Math.round((r.value / b.value) * 1000) / 10 });
  }
  return out;
}
