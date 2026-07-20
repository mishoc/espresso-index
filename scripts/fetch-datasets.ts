/** fetch-datasets.ts — SPEC-DATALAB §3.3 orchestrator.
 *  `npm run data:refresh [-- --only=big-mac]`
 *  Writes tidy JSON per dataset + merged manifest, then validates. */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Fetcher, FetcherResult, Manifest, ManifestEntry } from "../src/lib/datalab-types";
import { fetchEspresso } from "./datasets/espresso";
import { fetchBigMac } from "./datasets/big-mac";
import { fetchWdiGdppc, fetchWdiInflation, fetchWdiPpp, fetchTop10 } from "./datasets/wdi";
import { fetchCoffeePrices } from "./datasets/coffee-prices";
import { fetchMinWage } from "./datasets/dbn-minwage";
import { fetchOecdHours } from "./datasets/oecd-hours";
import { fetchFaostatProduction } from "./datasets/faostat-production";

const DIR = join(import.meta.dirname, "..", "public", "datasets");
const MANIFEST_PATH = join(DIR, "manifest.json");

const FETCHERS: Record<string, Fetcher> = {
  espresso: fetchEspresso,
  "big-mac": fetchBigMac,
  "wdi-gdppc": fetchWdiGdppc,
  "wdi-inflation": fetchWdiInflation,
  "coffee-prices": fetchCoffeePrices,
  "dbn-minwage": fetchMinWage,
  // Phase B (§2.2)
  "wdi-ppp": fetchWdiPpp,
  "top10-share": fetchTop10,
  "oecd-hours": fetchOecdHours,
  "faostat-production": fetchFaostatProduction,
};

const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const ids = only ? only.split(",") : Object.keys(FETCHERS);
const unknown = ids.filter((id) => !FETCHERS[id]);
if (unknown.length) {
  console.error(`unknown dataset id(s): ${unknown.join(", ")} — known: ${Object.keys(FETCHERS).join(", ")}`);
  process.exit(1);
}

const manifest: Manifest = existsSync(MANIFEST_PATH)
  ? JSON.parse(readFileSync(MANIFEST_PATH, "utf8"))
  : [];
const byId = new Map(manifest.map((m) => [m.id, m]));

const today = new Date().toISOString().slice(0, 10);
let failed = 0;

for (const id of ids) {
  process.stdout.write(`⬇︎  ${id} … `);
  try {
    const result: FetcherResult = await FETCHERS[id]();
    const body = JSON.stringify(result.rows);
    const entry: ManifestEntry = {
      ...result.manifest,
      updated: today,
      bytes: Buffer.byteLength(body),
    };
    writeFileSync(join(DIR, `${id}.json`), body);
    byId.set(id, entry);
    console.log(`${result.rows.length} rows, ${(entry.bytes / 1024).toFixed(0)}KB`);
  } catch (e) {
    failed++;
    console.log(`FAILED — ${(e as Error).message}`);
  }
}

const merged = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
writeFileSync(MANIFEST_PATH, JSON.stringify(merged, null, 2) + "\n");
console.log(`manifest: ${merged.length} dataset(s) → ${MANIFEST_PATH}`);
if (failed) {
  console.error(`${failed} fetcher(s) failed — manifest keeps their previous entries`);
  process.exit(1);
}
