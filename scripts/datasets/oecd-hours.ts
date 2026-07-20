import { iso31661 } from "iso-3166";
import type { Fetcher, TidyRow } from "../../src/lib/datalab-types";
import { dbnSeries } from "./dbnomics";

/** OECD average annual hours actually worked per worker, via DBnomics
 *  (OECD/DSD_HW@DF_AVG_ANN_HRS_WKD, verified live 2026-07-24).
 *  Filter: total worker status (_T), REF_AREA is iso3 directly. */
const VALID = new Set(iso31661.map((c) => c.alpha3));

export const fetchOecdHours: Fetcher = async () => {
  const series = await dbnSeries("OECD/DSD_HW%40DF_AVG_ANN_HRS_WKD");
  const rows: TidyRow[] = [];
  const countries = new Set<string>();
  let from = "9999";
  let to = "0000";
  for (const s of series) {
    if (s.dimensions?.WORKER_STATUS !== "_T") continue;
    const iso3 = s.dimensions?.REF_AREA ?? "";
    if (!VALID.has(iso3)) continue;
    s.period.forEach((p, i) => {
      const v = s.value[i];
      if (v === null || !Number.isFinite(v)) return;
      const date = p.slice(0, 4);
      rows.push({ iso3, date, indicator: "hours_per_year", value: Math.round(v) });
      countries.add(iso3);
      if (date < from) from = date;
      if (date > to) to = date;
    });
  }
  if (rows.length === 0) throw new Error("oecd-hours: zero rows — dimension coding changed?");
  return {
    rows,
    manifest: {
      id: "oecd-hours",
      name: "Hours worked",
      description: "Average annual hours actually worked per worker (OECD members and partners).",
      sourceName: "OECD",
      sourceUrl: "https://db.nomics.world/OECD/DSD_HW%40DF_AVG_ANN_HRS_WKD",
      attribution: "Source: OECD via DBnomics",
      license: "Open — attribution required",
      unit: "hours/year",
      frequency: "annual",
      coverage: { from, to, countries: countries.size },
      indicators: [{ code: "hours_per_year", label: "Hours worked (per worker/year)" }],
      bounds: { hours_per_year: { min: 900, max: 2900 } },
    },
  };
};
