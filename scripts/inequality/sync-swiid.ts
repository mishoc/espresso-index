/** sync-swiid.ts — Standardized World Income Inequality Database (Solt).
 *  Canonical distribution is Harvard Dataverse; the maintainer mirrors the
 *  summary CSV on GitHub (fsolt/swiid, data/swiid_summary.csv — verified
 *  2026-08-19, rows through 2024). We trim to the columns the comparison
 *  chart needs: disposable-income Gini ± standard error, market Gini. */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const UA = "inequality-site-bot/1.0 (+https://github.com/mishoc/inequality-site)";
const URL = "https://raw.githubusercontent.com/fsolt/swiid/master/data/swiid_summary.csv";
const OUT_DIR = join(import.meta.dirname, "..", "..", "public", "data", "inequality");
const META_PATH = join(OUT_DIR, "metadata.json");

async function main() {
  const res = await fetch(URL, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`SWIID: HTTP ${res.status}`);
  const [header, ...lines] = (await res.text()).trim().split("\n");
  const cols = header.split(",");
  const ix = (c: string) => { const i = cols.indexOf(c); if (i < 0) throw new Error(`SWIID column ${c} missing — format changed?`); return i; };
  const [cC, cY, cD, cDse, cM] = ["country", "year", "gini_disp", "gini_disp_se", "gini_mkt"].map(ix);

  const byCountry: Record<string, { year: number; gini_disp: number; se: number; gini_mkt: number | null }[]> = {};
  let minY = 9999, maxY = 0;
  for (const line of lines) {
    // country names may be quoted if they contain commas
    const m = line.match(/^"([^"]*)",(.*)$/);
    const country = m ? m[1] : line.slice(0, line.indexOf(","));
    const rest = (m ? m[2] : line.slice(line.indexOf(",") + 1)).split(",");
    const f = [country, ...rest];
    const year = Number(f[cY]), gd = Number(f[cD]), se = Number(f[cDse]);
    const gm = f[cM] === "" ? null : Number(f[cM]);
    if (!Number.isFinite(year) || !Number.isFinite(gd)) continue;
    (byCountry[country] ??= []).push({ year, gini_disp: gd, se: Number.isFinite(se) ? se : 0, gini_mkt: gm });
    if (year < minY) minY = year; if (year > maxY) maxY = year;
  }
  const countries = Object.keys(byCountry).sort();
  if (countries.length < 150) throw new Error(`only ${countries.length} countries — upstream shrank?`);

  const today = new Date().toISOString().slice(0, 10);
  writeFileSync(join(OUT_DIR, "swiid-gini.json"), JSON.stringify({ unit: "Gini index (0–100)", countries, data: byCountry }));
  const meta = existsSync(META_PATH) ? JSON.parse(readFileSync(META_PATH, "utf8")) : {};
  meta["swiid-gini"] = {
    id: "swiid-gini",
    name: "Gini coefficients, cross-national (SWIID)",
    source_org: "Standardized World Income Inequality Database (Frederick Solt)",
    url: "https://fsolt.org/swiid/",
    license: "CC BY 4.0",
    source_version: `swiid_summary.csv (GitHub mirror), latest year ${maxY}`,
    coverage: `${countries.length} countries, ${minY}–${maxY}`,
    update_frequency: "SWIID releases roughly annually; we re-sync at least every 120 days",
    last_synced: today,
    methodology:
      "Disposable-income (post-tax, post-transfer) Gini on a 0–100 scale, with SWIID's standard-error band reflecting the uncertainty introduced by harmonizing national sources. Market-income Gini shown where available. SWIID standardizes differing national definitions (household vs. individual, gross vs. net); see Solt (2020).",
  };
  writeFileSync(META_PATH, JSON.stringify(meta, null, 2) + "\n");
  console.log(`sync-swiid: ${countries.length} countries, ${minY}–${maxY}; US latest = ${byCountry["United States"].at(-1)?.gini_disp}`);
}

main().catch((e) => { console.error("sync-swiid FAILED:", e.message); process.exit(1); });
