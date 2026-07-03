/** validate-data.ts — SPEC §6.2. CI gate on every commit: schema, unique iso3,
 *  price bounds, tier counts vs metadata, iso3 exists in bundled topojson,
 *  rank consistency. Exits non-zero on any failure. */
import { readFileSync } from "node:fs";
import { iso31661 } from "iso-3166";
import { readDataset, TOPO_PATH, assignRanks, type Country } from "./lib";

// TUV has no polygon in world-atlas@2 countries-50m — the one allowed absence.
// Rendering fallback tracked in issue #2.
const TOPO_ALLOWLIST = new Set(["TUV"]);

const errors: string[] = [];
const fail = (msg: string) => errors.push(msg);

const data = readDataset();

// --- schema ---
const REQUIRED: Record<string, (v: unknown) => boolean> = {
  iso3: (v) => typeof v === "string" && /^[A-Z]{3}$/.test(v),
  name: (v) => typeof v === "string" && v.length > 0,
  region: (v) => typeof v === "string" && v.length > 0,
  priceUSD: (v) => typeof v === "number",
  priceLow: (v) => typeof v === "number",
  priceHigh: (v) => typeof v === "number",
  tier: (v) => v === "surveyed" || v === "derived" || v === "modeled",
  source: (v) => typeof v === "string" && v.length > 0,
  gdpPerCapitaUSD: (v) => v === null || typeof v === "number",
  gdpYear: (v) => v === null || typeof v === "number",
  burdenPct: (v) => v === null || typeof v === "number",
  rank: (v) => v === null || (typeof v === "number" && Number.isInteger(v)),
  updated: (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v),
};

for (const c of data.countries) {
  for (const [key, ok] of Object.entries(REQUIRED)) {
    if (!(key in c)) fail(`${c.iso3 ?? "?"}: missing field ${key}`);
    else if (!ok((c as unknown as Record<string, unknown>)[key]))
      fail(`${c.iso3 ?? "?"}: invalid ${key} = ${JSON.stringify((c as unknown as Record<string, unknown>)[key])}`);
  }
  const extra = Object.keys(c).filter((k) => !(k in REQUIRED));
  if (extra.length) fail(`${c.iso3}: unexpected fields ${extra.join(", ")}`);
}

// --- unique iso3 ---
const seen = new Set<string>();
for (const c of data.countries) {
  if (seen.has(c.iso3)) fail(`duplicate iso3: ${c.iso3}`);
  seen.add(c.iso3);
}

// --- price bounds $0.25–$8 + band sanity ---
for (const c of data.countries) {
  if (c.priceUSD < 0.25 || c.priceUSD > 8)
    fail(`${c.iso3}: priceUSD ${c.priceUSD} outside $0.25–$8`);
  if (!(c.priceLow <= c.priceUSD && c.priceUSD <= c.priceHigh))
    fail(`${c.iso3}: band violated (${c.priceLow} ≤ ${c.priceUSD} ≤ ${c.priceHigh})`);
}

// --- tier counts match metadata (feeds the Rankings counts line) ---
const tally = { surveyed: 0, derived: 0, modeled: 0 };
for (const c of data.countries) tally[c.tier]++;
for (const tier of ["surveyed", "derived", "modeled"] as const) {
  if (tally[tier] !== data.counts[tier])
    fail(`tier count drift: ${tier} actual ${tally[tier]} vs metadata ${data.counts[tier]}`);
}
if (data.total !== data.countries.length)
  fail(`total drift: metadata ${data.total} vs actual ${data.countries.length}`);

// --- every iso3 exists in bundled topojson ---
interface Geometry {
  id?: string;
  properties?: { name?: string };
}
const topo = JSON.parse(readFileSync(TOPO_PATH, "utf8"));
const numToA3 = new Map(iso31661.map((c) => [c.numeric, c.alpha3]));
const geoA3 = new Set<string>();
for (const g of topo.objects.countries.geometries as Geometry[]) {
  const a3 = numToA3.get(String(g.id).padStart(3, "0"));
  if (a3) geoA3.add(a3);
  if (g.properties?.name === "Kosovo") geoA3.add("XKX"); // no ISO numeric id
}
for (const c of data.countries) {
  if (!geoA3.has(c.iso3) && !TOPO_ALLOWLIST.has(c.iso3))
    fail(`${c.iso3} ${c.name}: no geometry in ${TOPO_PATH}`);
}

// --- rank consistency (competition ranking, if ranks are populated) ---
if (data.countries.some((c) => c.rank !== null)) {
  const expected = assignRanks(
    data.countries.map((c) => ({ ...c })) as Country[],
  );
  const expectedRank = new Map(expected.map((c) => [c.iso3, c.rank]));
  for (const c of data.countries) {
    if (c.rank !== expectedRank.get(c.iso3))
      fail(`${c.iso3}: rank ${c.rank} ≠ recomputed ${expectedRank.get(c.iso3)}`);
  }
}

if (errors.length) {
  console.error(`validate-data: ${errors.length} error(s)`);
  for (const e of errors) console.error("  ✗ " + e);
  process.exit(1);
}
console.log(`validate-data: OK — ${data.total} economies, ${tally.surveyed}/${tally.derived}/${tally.modeled} surveyed/derived/modeled`);
