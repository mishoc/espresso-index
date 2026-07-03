/** /api/macro — the only runtime backend (SPEC §6.3).
 *  ISR every 6h → ≤4 upstream calls/day at any traffic. On revalidation
 *  failure Next retains the last cached response (stale-on-error); the
 *  client derives "as of" display from fetchedAt age. Never 5xx.
 *
 *  Both series come from FRED (one upstream, one key):
 *  - CUSR0000SEFP01 — US CPI: coffee (YoY computed server-side)
 *  - PCOFFOTMUSDM  — IMF global price, Other Mild Arabicas, ¢/lb
 *  (The WB Pink Sheet monthly file is XLSX-only; parsing it would add a
 *  spreadsheet dependency to the one runtime route for the same number.)
 */

export const revalidate = 21600;

const FRED = "https://api.stlouisfed.org/fred/series/observations";

interface FredObs {
  date: string;
  value: string;
}

async function fredSeries(id: string, key: string, limit: number): Promise<FredObs[]> {
  const url = `${FRED}?series_id=${id}&api_key=${key}&file_type=json&sort_order=desc&limit=${limit}`;
  const res = await fetch(url, { next: { revalidate: 21600 } });
  if (!res.ok) throw new Error(`FRED ${id}: ${res.status}`);
  const json = (await res.json()) as { observations: FredObs[] };
  return json.observations.filter((o) => o.value !== ".");
}

export async function GET() {
  const key = process.env.FRED_API_KEY;
  if (!key) return new Response(null, { status: 204 });

  try {
    const [cpi, arabica] = await Promise.all([
      fredSeries("CUSR0000SEFP01", key, 15),
      fredSeries("PCOFFOTMUSDM", key, 3),
    ]);

    const latest = cpi[0];
    const yearAgoDate = `${Number(latest.date.slice(0, 4)) - 1}${latest.date.slice(4)}`;
    const yearAgo = cpi.find((o) => o.date === yearAgoDate);
    if (!latest || !yearAgo || !arabica[0]) return new Response(null, { status: 204 });

    const coffeeCpiYoY =
      Math.round((Number(latest.value) / Number(yearAgo.value) - 1) * 1000) / 10;
    // PCOFFOTMUSDM is quoted in US cents per pound → USD/lb for the payload.
    const arabicaUSDlb = Math.round(Number(arabica[0].value)) / 100;

    return Response.json({
      coffeeCpiYoY,
      coffeeCpiDate: latest.date,
      arabicaUSDlb,
      arabicaDate: arabica[0].date,
      fetchedAt: new Date().toISOString(),
      stale: false,
    });
  } catch {
    // No cache ever + failure → 204, strip hides (SPEC §6.3).
    // If a cached response exists, ISR keeps serving it instead of this.
    return new Response(null, { status: 204 });
  }
}
