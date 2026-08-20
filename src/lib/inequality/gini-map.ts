import type { TidyRow } from "@/lib/datalab-types";

export interface GiniLatest {
  iso3: string;
  value: number;
  year: string;
}

/** Most recent Gini observation per country, at or before `uptoYear`,
 *  sorted most-unequal first. Survey years vary widely by country, so the
 *  year is carried alongside the value — the UI must show it. */
export function latestGini(rows: TidyRow[], uptoYear = "9999"): GiniLatest[] {
  const best = new Map<string, { value: number; year: string }>();
  for (const r of rows) {
    if (r.indicator !== "gini_index") continue;
    const year = r.date.slice(0, 4);
    if (year > uptoYear) continue;
    const cur = best.get(r.iso3);
    if (!cur || year > cur.year) best.set(r.iso3, { value: r.value, year });
  }
  return [...best.entries()]
    .map(([iso3, v]) => ({ iso3, value: v.value, year: v.year }))
    .sort((a, b) => b.value - a.value);
}
