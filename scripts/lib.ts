import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const DATA_PATH = join(import.meta.dirname, "..", "data", "espresso.json");
export const TOPO_PATH = join(import.meta.dirname, "..", "public", "countries-50m.json");
export const CSV_PATH = join(import.meta.dirname, "..", "public", "espresso-index.csv");

export type Tier = "surveyed" | "derived" | "modeled";

export interface Country {
  iso3: string;
  name: string;
  region: string;
  priceUSD: number;
  priceLow: number;
  priceHigh: number;
  tier: Tier;
  source: string;
  gdpPerCapitaUSD: number | null;
  gdpYear: number | null;
  burdenPct: number | null;
  rank: number | null;
  updated: string;
}

export interface Dataset {
  version: string;
  generated: string;
  counts: Record<Tier, number>;
  total: number;
  notes: string;
  countries: Country[];
}

export function readDataset(): Dataset {
  return JSON.parse(readFileSync(DATA_PATH, "utf8"));
}

export function writeDataset(data: Dataset): void {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n");
}

/** Competition ranking (SPEC §6.2): descending by priceUSD, ties share the
 *  minimum rank, next rank skips (1, 2, 2, 4). Rank 1 = most expensive.
 *  Returned array is also the display order: ties alphabetical by name. */
export function assignRanks(countries: Country[]): Country[] {
  const sorted = [...countries].sort(
    (a, b) => b.priceUSD - a.priceUSD || a.name.localeCompare(b.name),
  );
  let prevPrice = NaN;
  let prevRank = 0;
  sorted.forEach((c, i) => {
    c.rank = c.priceUSD === prevPrice ? prevRank : i + 1;
    prevPrice = c.priceUSD;
    prevRank = c.rank;
  });
  return sorted;
}
