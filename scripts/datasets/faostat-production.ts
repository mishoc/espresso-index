import { createReadStream, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { Parse } from "unzipper";
import { csvParseRows } from "d3-dsv";
import { iso31661 } from "iso-3166";
import { FETCH_UA, type Fetcher, type TidyRow } from "../../src/lib/datalab-types";

/** Green-coffee production by country, from the FAOSTAT bulk normalized CSV
 *  (32MB zip, streamed). Why not the APIs: FAOSTAT's REST API now requires
 *  an Authorization header (401, verified 2026-07-24 — a key would break the
 *  no-new-env-vars rule), and the FAO provider on DBnomics currently indexes
 *  metadata with zero observations (verified same day). The bulk file is
 *  open, keyless, and fine for a monthly build-time job.
 *  Join key: the CSV's M49 numeric area code → iso3 via iso-3166. */

const ZIP_URL =
  "https://bulks-faostat.fao.org/production/Production_Crops_Livestock_E_All_Data_(Normalized).zip";
const ITEM_COFFEE_GREEN = "656";
const ELEMENT_PRODUCTION = "5510";

const NUM_TO_A3 = new Map(iso31661.map((c) => [c.numeric, c.alpha3]));

export const fetchFaostatProduction: Fetcher = async () => {
  const res = await fetch(ZIP_URL, { headers: { "User-Agent": FETCH_UA } });
  if (!res.ok) throw new Error(`faostat-production: HTTP ${res.status}`);
  const tmp = join(tmpdir(), `faostat-qcl-${process.pid}.zip`);
  writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));

  const rows: TidyRow[] = [];
  const countries = new Set<string>();
  let from = "9999";
  let to = "0000";
  let cols: Record<string, number> | null = null;

  try {
    await new Promise<void>((resolve, reject) => {
      createReadStream(tmp)
        .pipe(Parse())
        .on("entry", (entry) => {
          if (!/All_Data.*\.csv$/i.test(entry.path)) {
            entry.autodrain();
            return;
          }
          const rl = createInterface({ input: entry });
          rl.on("line", (line: string) => {
            const parsed = csvParseRows(line)[0];
            if (!parsed) return;
            if (!cols) {
              cols = Object.fromEntries(parsed.map((h, i) => [h.trim(), i]));
              return;
            }
            if (
              parsed[cols["Item Code"]] !== ITEM_COFFEE_GREEN ||
              parsed[cols["Element Code"]] !== ELEMENT_PRODUCTION
            )
              return;
            // M49 codes ship with a leading apostrophe ("'356").
            const m49 = (parsed[cols["Area Code (M49)"]] ?? "").replace(/\D/g, "").padStart(3, "0");
            const iso3 = NUM_TO_A3.get(m49);
            if (!iso3) return; // regions/aggregates have no iso3 — intended
            const year = parsed[cols["Year"]];
            const value = Number(parsed[cols["Value"]]);
            if (!/^\d{4}$/.test(year) || !Number.isFinite(value)) return;
            rows.push({ iso3, date: year, indicator: "coffee_production_t", value: Math.round(value) });
            countries.add(iso3);
            if (year < from) from = year;
            if (year > to) to = year;
          });
          rl.on("close", () => resolve());
          rl.on("error", reject);
        })
        .on("error", reject)
        .on("close", () => resolve());
    });
  } finally {
    try {
      unlinkSync(tmp);
    } catch {
      /* tmp cleanup is best-effort */
    }
  }

  if (rows.length === 0)
    throw new Error("faostat-production: zero rows — bulk CSV layout changed?");

  return {
    rows,
    manifest: {
      id: "faostat-production",
      name: "Coffee production",
      description: "Green coffee production by country, in tonnes (FAOSTAT crops & livestock).",
      sourceName: "FAOSTAT",
      sourceUrl: "https://www.fao.org/faostat/en/#data/QCL",
      attribution: "Source: FAOSTAT (CC-BY 4.0)",
      license: "CC-BY 4.0",
      unit: "tonnes",
      frequency: "annual",
      coverage: { from, to, countries: countries.size },
      indicators: [{ code: "coffee_production_t", label: "Green coffee production (tonnes)" }],
      bounds: { coffee_production_t: { min: 0, max: 6_000_000 } },
    },
  };
};
