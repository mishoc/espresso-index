/** sync-wid.ts — US top-income-share series from WID.world.
 *
 *  WID's only bulk download is an ~880MB zip (wid_all_data.zip) and the
 *  old JSON API no longer exists (verified 2026-08-19: /api/* → 404).
 *  Per-country CSVs live inside the zip, so we read the zip's central
 *  directory via HTTP Range requests and extract ONLY WID_data_US.csv
 *  (~7MB compressed) — never the whole archive.
 *
 *  Variable codes (verified against the live file 2026-08-19):
 *    sptincj992 = pre-tax national income share, equal-split adults, age 20+
 *  (the older "sptinc992j" ordering the plan assumed is gone.)
 *
 *  Output: public/data/wid-us-top-shares.json + metadata entry. */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import { join } from "node:path";

const UA = "inequality-site-bot/1.0 (+https://github.com/mishoc/inequality-site)";
const ZIP = "https://wid.world/bulk_download/wid_all_data.zip";
const TARGET = "WID_data_US.csv";
const VARIABLE = "sptincj992";
const PERCENTILES = { p99p100: "top1", p90p100: "top10", p50p90: "middle40", p0p50: "bottom50" } as const;

const OUT_DIR = join(import.meta.dirname, "..", "..", "public", "data", "inequality");
const META_PATH = join(OUT_DIR, "metadata.json");

async function range(start: number, end: number): Promise<Buffer> {
  const res = await fetch(ZIP, { headers: { "User-Agent": UA, Range: `bytes=${start}-${end}` } });
  if (res.status !== 206) throw new Error(`range ${start}-${end}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const head = await fetch(ZIP, { method: "HEAD", headers: { "User-Agent": UA } });
  const total = Number(head.headers.get("content-length"));
  if (!total) throw new Error("no content-length from WID");

  // Central directory sits at the end; 1MB tail is plenty for ~580 entries.
  const tail = await range(Math.max(0, total - 1_048_576), total - 1);
  let i = 0;
  let entry: { method: number; csize: number; lho: number } | null = null;
  while ((i = tail.indexOf(Buffer.from("PK\x01\x02", "binary"), i)) >= 0) {
    const method = tail.readUInt16LE(i + 10);
    const csize = tail.readUInt32LE(i + 20);
    const nlen = tail.readUInt16LE(i + 28);
    const elen = tail.readUInt16LE(i + 30);
    const clen = tail.readUInt16LE(i + 32);
    const lho = tail.readUInt32LE(i + 42);
    const name = tail.toString("utf8", i + 46, i + 46 + nlen);
    if (name.endsWith(TARGET)) { entry = { method, csize, lho }; break; }
    i += 46 + nlen + elen + clen;
  }
  if (!entry) throw new Error(`${TARGET} not found in zip central directory`);

  const part = await range(entry.lho, entry.lho + 30 + 512 + entry.csize);
  if (part.readUInt32LE(0) !== 0x04034b50) throw new Error("bad local header");
  const nl = part.readUInt16LE(26);
  const el = part.readUInt16LE(28);
  const payload = part.subarray(30 + nl + el, 30 + nl + el + entry.csize);
  const csv = (entry.method === 8 ? inflateRawSync(payload) : payload).toString("utf8");

  // country;variable;percentile;year;value;age;pop;data_quality
  const series: Record<string, { year: number; share: number }[]> = {};
  for (const [p, key] of Object.entries(PERCENTILES)) series[key] = [];
  let maxYear = 0;
  for (const line of csv.split("\n")) {
    const [country, variable, pct, year, value] = line.split(";");
    if (country !== "US" || variable !== VARIABLE) continue;
    const key = PERCENTILES[pct as keyof typeof PERCENTILES];
    if (!key) continue;
    const y = Number(year), v = Number(value);
    if (!Number.isFinite(y) || !Number.isFinite(v)) continue;
    series[key].push({ year: y, share: Math.round(v * 10000) / 100 }); // fraction → %
    if (y > maxYear) maxYear = y;
  }
  for (const k of Object.keys(series)) series[k].sort((a, b) => a.year - b.year);
  if (series.top1.length < 50) throw new Error(`top1 series suspiciously short (${series.top1.length}) — WID format changed?`);

  const today = new Date().toISOString().slice(0, 10);
  writeFileSync(join(OUT_DIR, "wid-us-top-shares.json"), JSON.stringify({ variable: VARIABLE, unit: "% of pre-tax national income", series }, null, 0));

  const meta = existsSync(META_PATH) ? JSON.parse(readFileSync(META_PATH, "utf8")) : {};
  meta["wid-us-top-shares"] = {
    id: "wid-us-top-shares",
    name: "US top income shares (pre-tax)",
    source_org: "World Inequality Database (WID.world)",
    url: "https://wid.world/country/usa/",
    license: "CC BY 4.0 (WID.world terms)",
    source_version: `WID bulk data, latest year ${maxYear}`,
    coverage: `United States, ${series.top1[0].year}–${maxYear}`,
    update_frequency: "WID updates annually; we re-sync at least every 120 days",
    last_synced: today,
    methodology:
      "Share of pre-tax national income (before taxes and transfers, after pension/unemployment insurance) received by each group, equal-split among adult couples, age 20+. WID variable sptincj992. Pre-tax shares are the standard series in the Piketty–Saez tradition; post-tax shares are lower at the top.",
  };
  writeFileSync(META_PATH, JSON.stringify(meta, null, 2) + "\n");
  console.log(`sync-wid: top1 ${series.top1.length} yrs (${series.top1[0].year}–${maxYear}); 2024 top1 = ${series.top1.at(-1)?.share}%, top10 = ${series.top10.at(-1)?.share}%`);
}

main().catch((e) => { console.error("sync-wid FAILED:", e.message); process.exit(1); });
