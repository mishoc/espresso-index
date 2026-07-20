import { iso31661 } from "iso-3166";
import { FETCH_UA, type FetcherResult, type TidyRow } from "../../src/lib/datalab-types";

const VALID = new Set([...iso31661.map((c) => c.alpha3), "XKX"]);

interface WbRow {
  countryiso3code: string;
  date: string;
  value: number | null;
}

/** Paged pull of a WDI indicator for all countries (aggregates dropped by
 *  the iso3 whitelist). Explicit UA — WB rejects some defaults since 2026-07-13. */
async function wdiRows(indicatorId: string, code: string, fromYear: number): Promise<TidyRow[]> {
  const rows: TidyRow[] = [];
  for (let page = 1, pages = 1; page <= pages; page++) {
    const url = `https://api.worldbank.org/v2/country/all/indicator/${indicatorId}?format=json&date=${fromYear}:2026&per_page=20000&page=${page}`;
    const res = await fetch(url, { headers: { "User-Agent": FETCH_UA } });
    if (!res.ok) throw new Error(`${indicatorId}: HTTP ${res.status}`);
    const [meta, data] = (await res.json()) as [{ pages: number }, WbRow[] | null];
    pages = meta.pages;
    for (const r of data ?? []) {
      if (r.value === null || !VALID.has(r.countryiso3code)) continue;
      rows.push({
        iso3: r.countryiso3code,
        date: r.date,
        indicator: code,
        value: Math.round(r.value * 100) / 100,
      });
    }
  }
  if (rows.length === 0) throw new Error(`${indicatorId}: zero rows — API change?`);
  return rows;
}

function coverage(rows: TidyRow[]) {
  const years = rows.map((r) => r.date);
  return {
    from: years.reduce((a, b) => (a < b ? a : b)),
    to: years.reduce((a, b) => (a > b ? a : b)),
    countries: new Set(rows.map((r) => r.iso3)).size,
  };
}

const WB_COMMON = {
  sourceName: "World Bank",
  attribution: "Source: World Bank Open Data (CC-BY 4.0)",
  license: "CC-BY 4.0",
  frequency: "annual" as const,
};

export async function fetchWdiGdppc(): Promise<FetcherResult> {
  const rows = await wdiRows("NY.GDP.PCAP.CD", "gdp_per_capita_usd", 1960);
  return {
    rows,
    manifest: {
      ...WB_COMMON,
      id: "wdi-gdppc",
      name: "GDP per capita",
      description: "GDP per capita in current US dollars, all countries, annual since 1960.",
      sourceUrl: "https://data.worldbank.org/indicator/NY.GDP.PCAP.CD",
      unit: "USD",
      coverage: coverage(rows),
      indicators: [{ code: "gdp_per_capita_usd", label: "GDP per capita (current USD)" }],
      // Min 5, not 20: Myanmar's official-FX era bottoms out at $11.80 (1966)
      // in WB's own published series. Bounds catch unit flips, not history.
      bounds: { gdp_per_capita_usd: { min: 5, max: 500000 } },
    },
  };
}

export async function fetchWdiInflation(): Promise<FetcherResult> {
  const rows = await wdiRows("FP.CPI.TOTL.ZG", "cpi_inflation_pct", 1960);
  return {
    rows,
    manifest: {
      ...WB_COMMON,
      id: "wdi-inflation",
      name: "Inflation (CPI %)",
      description: "Consumer price inflation, annual percent change, all countries.",
      sourceUrl: "https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG",
      unit: "% per year",
      coverage: coverage(rows),
      indicators: [{ code: "cpi_inflation_pct", label: "CPI inflation (% YoY)" }],
      // Hyperinflations are real: Venezuela peaked >65,000%; deflation happens.
      bounds: { cpi_inflation_pct: { min: -30, max: 100000 } },
    },
  };
}
