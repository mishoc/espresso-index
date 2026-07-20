import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Fetcher, TidyRow } from "../../src/lib/datalab-types";
import type { Dataset } from "../lib";

const TIER_CODE = { surveyed: 0, derived: 1, modeled: 2 } as const;

export const fetchEspresso: Fetcher = async () => {
  const data: Dataset = JSON.parse(
    readFileSync(join(import.meta.dirname, "../../data/espresso.json"), "utf8"),
  );
  const date = data.generated;
  const rows: TidyRow[] = [];
  for (const c of data.countries) {
    rows.push({ iso3: c.iso3, date, indicator: "priceUSD", value: c.priceUSD });
    if (c.burdenPct !== null)
      rows.push({ iso3: c.iso3, date, indicator: "burdenPct", value: c.burdenPct });
    rows.push({ iso3: c.iso3, date, indicator: "tier", value: TIER_CODE[c.tier] });
  }
  return {
    rows,
    manifest: {
      id: "espresso",
      name: "The Espresso Index",
      description: `Espresso prices and purchasing-power burden across ${data.total} economies. Single snapshot; joins ignore the year slider.`,
      sourceName: "The Espresso Index",
      sourceUrl: "https://www.espressoindex.org/methodology",
      attribution: "Source: The Espresso Index (espressoindex.org)",
      license: "Own data — CC-BY 4.0",
      unit: "USD / % of daily GDP per capita",
      frequency: "snapshot",
      coverage: { from: date.slice(0, 4), to: date.slice(0, 4), countries: data.total },
      indicators: [
        { code: "priceUSD", label: "Espresso price (USD)" },
        { code: "burdenPct", label: "Espresso Burden (% of daily GDP/capita)" },
        { code: "tier", label: "Confidence tier (0 surveyed · 1 derived · 2 modeled)" },
      ],
      bounds: {
        priceUSD: { min: 0.25, max: 8 },
        burdenPct: { min: 0, max: 500 },
        tier: { min: 0, max: 2 },
      },
    },
  };
};
