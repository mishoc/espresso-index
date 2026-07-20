import * as XLSX from "xlsx";
import { FETCH_UA, type Fetcher, type TidyRow } from "../../src/lib/datalab-types";

/** Pink Sheet monthly is XLSX-only (no CSV exists — verified 2026-07-04),
 *  hence the build-time spreadsheet parse. Trimmed to 1990– per §3.1. */
const URL =
  "https://thedocs.worldbank.org/en/doc/5d903e848db1d1b83e0ec8f744e55570-0350012021/related/CMO-Historical-Data-Monthly.xlsx";

const FROM_YEAR = 1990;

export const fetchCoffeePrices: Fetcher = async () => {
  const res = await fetch(URL, { headers: { "User-Agent": FETCH_UA } });
  if (!res.ok) throw new Error(`coffee-prices: HTTP ${res.status}`);
  const wb = XLSX.read(await res.arrayBuffer(), { type: "array" });
  const sheetName = wb.SheetNames.find((n) => /monthly/i.test(n));
  if (!sheetName) throw new Error(`coffee-prices: no Monthly sheet in ${wb.SheetNames.join(", ")}`);
  const grid: unknown[][] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    header: 1,
    raw: true,
  });

  // Header row contains commodity names; find the two coffee columns.
  const headerRowIdx = grid.findIndex((row) =>
    row.some((c) => typeof c === "string" && /coffee/i.test(c)),
  );
  if (headerRowIdx < 0) throw new Error("coffee-prices: no coffee columns found");
  const header = grid[headerRowIdx].map((c) => String(c ?? ""));
  const arabicaCol = header.findIndex((h) => /coffee.*arabic/i.test(h));
  const robustaCol = header.findIndex((h) => /coffee.*robus/i.test(h));
  if (arabicaCol < 0 || robustaCol < 0)
    throw new Error(`coffee-prices: coffee columns missing in header: ${header.join(" | ")}`);

  const rows: TidyRow[] = [];
  let to = "0000";
  for (const row of grid.slice(headerRowIdx + 1)) {
    const label = String(row[0] ?? ""); // e.g. "1990M01"
    const m = label.match(/^(\d{4})M(\d{2})$/);
    if (!m || Number(m[1]) < FROM_YEAR) continue;
    const date = `${m[1]}-${m[2]}`;
    const arabica = Number(row[arabicaCol]);
    const robusta = Number(row[robustaCol]);
    if (Number.isFinite(arabica))
      rows.push({ iso3: "WLD", date, indicator: "arabica_usd_kg", value: Math.round(arabica * 100) / 100 });
    if (Number.isFinite(robusta))
      rows.push({ iso3: "WLD", date, indicator: "robusta_usd_kg", value: Math.round(robusta * 100) / 100 });
    if (date > to) to = date;
  }
  if (rows.length === 0) throw new Error("coffee-prices: zero rows — sheet layout changed?");

  return {
    rows,
    manifest: {
      id: "coffee-prices",
      name: "Arabica & Robusta prices",
      description: "Global monthly coffee prices (USD/kg) from the World Bank Pink Sheet, 1990 onward.",
      sourceName: "World Bank",
      sourceUrl: "https://www.worldbank.org/en/research/commodity-markets",
      attribution: "Source: World Bank Commodity Price Data (Pink Sheet)",
      license: "Open — attribution required",
      unit: "USD/kg",
      frequency: "monthly",
      coverage: { from: String(FROM_YEAR), to: to.slice(0, 4), countries: 1 },
      indicators: [
        { code: "arabica_usd_kg", label: "Arabica price (USD/kg)" },
        { code: "robusta_usd_kg", label: "Robusta price (USD/kg)" },
      ],
      bounds: {
        arabica_usd_kg: { min: 0.5, max: 30 },
        robusta_usd_kg: { min: 0.3, max: 20 },
      },
    },
  };
};
