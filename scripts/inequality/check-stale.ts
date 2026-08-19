/** Exits non-zero if any dataset snapshot is older than STALE_AFTER_DAYS
 *  (BUILD_PLAN P3.1). Run in CI / before deploy: `npm run data:check`. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isStale, STALE_AFTER_DAYS, type DatasetMeta } from "../../src/lib/inequality/dataset-metadata";

const meta: Record<string, DatasetMeta> = JSON.parse(readFileSync(join(import.meta.dirname, "..", "public", "data", "metadata.json"), "utf8"));
const stale = Object.values(meta).filter((m) => isStale(m));
for (const m of Object.values(meta)) console.log(`${m.id}: synced ${m.last_synced}${isStale(m) ? "  ← STALE" : ""}`);
if (stale.length) { console.error(`${stale.length} dataset(s) older than ${STALE_AFTER_DAYS} days — run npm run sync:data`); process.exit(1); }
console.log("data freshness OK");
