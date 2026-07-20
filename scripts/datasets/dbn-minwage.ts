import { iso31661 } from "iso-3166";
import { FETCH_UA, type Fetcher, type TidyRow } from "../../src/lib/datalab-types";

/** ILO statutory nominal gross monthly minimum wage via DBnomics
 *  (dataset pinned + verified live 2026-07-14). The dataset carries a
 *  currency dimension; we ingest the USD-denominated series so preset 6
 *  (min wage vs. burden) compares like with like. */
const BASE = "https://api.db.nomics.world/v22";
const DATASET = "ILO/EAR_4MMN_CUR_NB";

const A2_TO_A3 = new Map(iso31661.map((c) => [c.alpha2, c.alpha3]));
const VALID_A3 = new Set(iso31661.map((c) => c.alpha3));

interface DbnSeries {
  series_code: string;
  period: string[];
  value: (number | null)[];
  dimensions?: Record<string, string>;
}

export const fetchMinWage: Fetcher = async () => {
  const rows: TidyRow[] = [];
  const countries = new Set<string>();
  let from = "9999";
  let to = "0000";

  for (let offset = 0; ; offset += 1000) {
    const url = `${BASE}/series/${DATASET}?observations=1&format=json&limit=1000&offset=${offset}`;
    const res = await fetch(url, { headers: { "User-Agent": FETCH_UA } });
    if (!res.ok) throw new Error(`dbn-minwage: HTTP ${res.status}`);
    const json = (await res.json()) as {
      series: { docs: DbnSeries[]; num_found: number };
    };
    const docs = json.series?.docs ?? [];

    for (const s of docs) {
      // Series shape (verified 2026-07-14): code "AFG.FX_3344.CUR_TYPE_USD.A",
      // dimensions { classif1: "CUR_TYPE_USD", ref_area: "AFG", frequency: "A" }.
      if (s.dimensions?.classif1 !== "CUR_TYPE_USD") continue;
      const ref = s.dimensions?.ref_area ?? "";
      const iso3 = VALID_A3.has(ref) ? ref : A2_TO_A3.get(ref);
      if (!iso3) continue;
      s.period.forEach((p, i) => {
        const v = s.value[i];
        if (v === null || !Number.isFinite(v)) return;
        const date = p.slice(0, 4);
        rows.push({ iso3: iso3!, date, indicator: "min_wage_usd_month", value: Math.round(v * 100) / 100 });
        countries.add(iso3!);
        if (date < from) from = date;
        if (date > to) to = date;
      });
    }
    if (offset + 1000 >= (json.series?.num_found ?? 0)) break;
  }
  if (rows.length === 0)
    throw new Error("dbn-minwage: zero USD rows — dimension coding changed? inspect series codes");

  return {
    rows,
    manifest: {
      id: "dbn-minwage",
      name: "Minimum wages",
      description: "Statutory nominal gross monthly minimum wage, converted to US dollars (ILO).",
      sourceName: "ILO",
      sourceUrl: "https://db.nomics.world/ILO/EAR_4MMN_CUR_NB",
      attribution: "Source: ILO via DBnomics",
      license: "Open — attribution required",
      unit: "USD/month",
      frequency: "annual",
      coverage: { from, to, countries: countries.size },
      indicators: [{ code: "min_wage_usd_month", label: "Minimum wage (USD/month)" }],
      bounds: { min_wage_usd_month: { min: 0, max: 10000 } },
    },
  };
};
