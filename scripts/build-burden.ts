/** build-burden.ts — SPEC §6.2. Pulls World Bank GDP per capita (current US$),
 *  computes Espresso Burden, recomputes competition rank, rewrites the dataset.
 *  Run quarterly via PR: `bun scripts/build-burden.ts`.
 *  gdpPerCapitaUSD, gdpYear, burdenPct, rank are script-owned — never hand-edit. */
import { readDataset, writeDataset, assignRanks } from "./lib";

const WB_URL =
  "https://api.worldbank.org/v2/country/all/indicator/NY.GDP.PCAP.CD?format=json&mrnev=1&per_page=400";

interface WbRow {
  countryiso3code: string;
  value: number | null;
  date: string;
}

const res = await fetch(WB_URL);
if (!res.ok) {
  console.error(`World Bank API returned ${res.status} — dataset left untouched.`);
  process.exit(1);
}
const [, rows] = (await res.json()) as [unknown, WbRow[]];

const gdp = new Map<string, { value: number; year: number }>();
for (const row of rows) {
  if (row.value !== null && row.countryiso3code) {
    gdp.set(row.countryiso3code, {
      value: row.value,
      year: Number(row.date),
    });
  }
}

const data = readDataset();
const missing: string[] = [];
const stale: string[] = [];

for (const c of data.countries) {
  const g = gdp.get(c.iso3);
  if (!g) {
    c.gdpPerCapitaUSD = null;
    c.gdpYear = null;
    c.burdenPct = null;
    missing.push(`${c.iso3} ${c.name}`);
    continue;
  }
  c.gdpPerCapitaUSD = Math.round(g.value * 100) / 100;
  c.gdpYear = g.year;
  // burdenPct = priceUSD / (gdpPerCapitaUSD / 365) × 100  (SPEC §6.1)
  c.burdenPct = Math.round((c.priceUSD / (g.value / 365)) * 100 * 100) / 100;
  if (g.year < 2022) stale.push(`${c.iso3} ${c.name} (${g.year})`);
}

data.countries = assignRanks(data.countries);
writeDataset(data);

console.log(`Burden computed for ${data.countries.length - missing.length}/${data.countries.length} economies.`);
console.log(`No GDP data (burden = null): ${missing.length ? missing.join(", ") : "none"}`);
console.log(`Stale GDP (< 2022): ${stale.length ? stale.join(", ") : "none"}`);
