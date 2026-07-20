/** validate-datasets.ts — SPEC-DATALAB §3.3. CI gate for the Lab datasets:
 *  schema conformity, iso3 validity, per-manifest value bounds, shrink
 *  detection (>20% fewer rows than the committed version = upstream
 *  breakage), and manifest byte-count accuracy. Exits non-zero on failure.
 *
 *  Run: bun scripts/validate-datasets.ts  (also part of `prebuild` once
 *  datasets exist).
 */
import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { iso31661 } from "iso-3166";
import type { Manifest, TidyRow } from "../src/lib/datalab-types";

const DIR = join(import.meta.dirname, "..", "public", "datasets");
const MANIFEST_PATH = join(DIR, "manifest.json");

const VALID_ISO3 = new Set<string>([
  ...iso31661.map((c) => c.alpha3),
  "XKX", // Kosovo (user-assigned)
  "WLD", // global/non-country series
]);

const errors: string[] = [];
const fail = (msg: string) => errors.push(msg);

if (!existsSync(MANIFEST_PATH)) {
  console.log("validate-datasets: no manifest yet — nothing to validate.");
  process.exit(0);
}

const manifest: Manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));

const DATE_RE = /^\d{4}(-\d{2})?(-\d{2})?$/;

for (const entry of manifest) {
  const path = join(DIR, `${entry.id}.json`);
  if (!existsSync(path)) {
    fail(`${entry.id}: manifest entry but no dataset file at ${path}`);
    continue;
  }
  const raw = readFileSync(path, "utf8");
  let rows: TidyRow[];
  try {
    rows = JSON.parse(raw);
  } catch {
    fail(`${entry.id}: dataset is not valid JSON`);
    continue;
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    fail(`${entry.id}: dataset is empty or not an array`);
    continue;
  }

  // --- schema + iso3 + bounds ---
  const indicatorCodes = new Set(entry.indicators.map((i) => i.code));
  rows.forEach((r, i) => {
    if (typeof r.iso3 !== "string" || !VALID_ISO3.has(r.iso3))
      fail(`${entry.id}[${i}]: invalid iso3 ${JSON.stringify(r.iso3)}`);
    if (typeof r.date !== "string" || !DATE_RE.test(r.date))
      fail(`${entry.id}[${i}]: invalid date ${JSON.stringify(r.date)}`);
    if (!indicatorCodes.has(r.indicator))
      fail(`${entry.id}[${i}]: indicator ${r.indicator} not in manifest`);
    if (typeof r.value !== "number" || !Number.isFinite(r.value))
      fail(`${entry.id}[${i}]: non-finite value`);
    const b = entry.bounds[r.indicator];
    if (b && (r.value < b.min || r.value > b.max))
      fail(`${entry.id}[${i}]: ${r.indicator}=${r.value} outside [${b.min}, ${b.max}]`);
  });

  // --- manifest byte count accurate (±1% tolerance for EOL drift) ---
  const actualBytes = Buffer.byteLength(raw);
  if (Math.abs(actualBytes - entry.bytes) > Math.max(64, actualBytes * 0.01))
    fail(`${entry.id}: manifest bytes ${entry.bytes} ≠ actual ${actualBytes}`);

  // --- shrink detector vs the last committed version (§6-8) ---
  try {
    const prevRaw = execSync(`git show HEAD:public/datasets/${entry.id}.json`, {
      cwd: join(import.meta.dirname, ".."),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 64 * 1024 * 1024,
    });
    const prevCount = (JSON.parse(prevRaw) as TidyRow[]).length;
    if (rows.length < prevCount * 0.8)
      fail(
        `${entry.id}: shrank ${prevCount} → ${rows.length} rows (>20%) — upstream format probably changed; refusing`,
      );
  } catch {
    // No committed previous version (new dataset) — nothing to compare.
  }
}

// --- every dataset file has a manifest entry ---
import { readdirSync } from "node:fs";
const known = new Set(manifest.map((m) => `${m.id}.json`));
for (const f of readdirSync(DIR)) {
  if (f.endsWith(".json") && f !== "manifest.json" && !known.has(f))
    fail(`orphan dataset file with no manifest entry: ${f}`);
}

if (errors.length) {
  console.error(`validate-datasets: ${errors.length} error(s)`);
  for (const e of errors.slice(0, 40)) console.error("  ✗ " + e);
  if (errors.length > 40) console.error(`  … and ${errors.length - 40} more`);
  process.exit(1);
}
console.log(
  `validate-datasets: OK — ${manifest.length} dataset(s), ${manifest
    .map((m) => m.id)
    .join(", ")}`,
);
