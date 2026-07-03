/** build-csv.ts — SPEC §6.2. Generates public/espresso-index.csv at build;
 *  the download button serves this static file. */
import { writeFileSync } from "node:fs";
import { readDataset, CSV_PATH } from "./lib";

const COLUMNS = [
  "rank",
  "iso3",
  "name",
  "region",
  "priceUSD",
  "priceLow",
  "priceHigh",
  "tier",
  "gdpPerCapitaUSD",
  "gdpYear",
  "burdenPct",
  "source",
  "updated",
] as const;

const esc = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

const data = readDataset();
const rows = [...data.countries].sort(
  (a, b) => (a.rank ?? 999) - (b.rank ?? 999) || a.name.localeCompare(b.name),
);
const lines = [
  COLUMNS.join(","),
  ...rows.map((c) => COLUMNS.map((col) => esc(c[col])).join(",")),
];
writeFileSync(CSV_PATH, lines.join("\n") + "\n");
console.log(`build-csv: wrote ${rows.length} rows to ${CSV_PATH}`);
