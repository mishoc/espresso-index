import { csvParse } from "d3-dsv";
import { iso31661 } from "iso-3166";
import { FETCH_UA, type Fetcher, type TidyRow } from "../../src/lib/datalab-types";

const URL =
  "https://raw.githubusercontent.com/TheEconomist/big-mac-data/master/output-data/big-mac-full-index.csv";

const VALID = new Set(iso31661.map((c) => c.alpha3));

export const fetchBigMac: Fetcher = async () => {
  const res = await fetch(URL, { headers: { "User-Agent": FETCH_UA } });
  if (!res.ok) throw new Error(`big-mac: HTTP ${res.status}`);
  const table = csvParse(await res.text());

  const rows: TidyRow[] = [];
  let from = "9999";
  let to = "0000";
  const countries = new Set<string>();
  for (const r of table) {
    const iso3 = r.iso_a3 ?? "";
    if (!VALID.has(iso3)) continue; // drops EUZ (euro area) and similar
    const date = (r.date ?? "").slice(0, 7); // month precision
    const price = Number(r.dollar_price);
    const usdRaw = Number(r.USD_raw);
    if (!date || !Number.isFinite(price)) continue;
    rows.push({ iso3, date, indicator: "dollar_price", value: price });
    if (Number.isFinite(usdRaw))
      rows.push({ iso3, date, indicator: "usd_valuation", value: usdRaw });
    countries.add(iso3);
    if (date < from) from = date;
    if (date > to) to = date;
  }
  if (rows.length === 0) throw new Error("big-mac: parsed zero rows — upstream format changed?");

  return {
    rows,
    manifest: {
      id: "big-mac",
      name: "Big Mac Index",
      description: "The Economist's burger-based PPP measure. Prices in USD plus raw over/under-valuation vs the dollar.",
      sourceName: "The Economist",
      sourceUrl: "https://github.com/TheEconomist/big-mac-data",
      attribution: "Source: The Economist Big Mac Index",
      license: "Open — attribution required",
      unit: "USD / ratio",
      frequency: "biannual",
      coverage: { from: from.slice(0, 4), to: to.slice(0, 4), countries: countries.size },
      indicators: [
        { code: "dollar_price", label: "Big Mac price (USD)" },
        { code: "usd_valuation", label: "Valuation vs USD (raw, 0 = parity)" },
      ],
      bounds: {
        dollar_price: { min: 0.3, max: 20 },
        usd_valuation: { min: -1, max: 2 },
      },
    },
  };
};
