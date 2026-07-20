import { FETCH_UA } from "../../src/lib/datalab-types";

export interface DbnSeries {
  series_code: string;
  series_name?: string;
  period: string[];
  value: (number | null)[];
  dimensions?: Record<string, string>;
}

/** Observations for explicit series ids ("PROVIDER/DATASET/CODE"), batched.
 *  Needed because q-filtered listings return metadata-only docs. */
export async function dbnObservations(ids: string[]): Promise<DbnSeries[]> {
  const out: DbnSeries[] = [];
  for (let i = 0; i < ids.length; i += 60) {
    const chunk = ids.slice(i, i + 60);
    const url = `https://api.db.nomics.world/v22/series?series_ids=${encodeURIComponent(chunk.join(","))}&observations=1&format=json&limit=${chunk.length}`;
    const res = await fetch(url, { headers: { "User-Agent": FETCH_UA } });
    if (!res.ok) throw new Error(`dbnomics observations: HTTP ${res.status}`);
    const json = (await res.json()) as { series: { docs: DbnSeries[] } };
    out.push(...(json.series?.docs ?? []));
  }
  return out;
}

/** Paged DBnomics series pull (max 1000/page), optional q filter. */
export async function dbnSeries(
  dataset: string,
  q?: string,
): Promise<DbnSeries[]> {
  const out: DbnSeries[] = [];
  for (let offset = 0; ; offset += 1000) {
    const url =
      `https://api.db.nomics.world/v22/series/${dataset}?observations=1&format=json&limit=1000&offset=${offset}` +
      (q ? `&q=${encodeURIComponent(q)}` : "");
    const res = await fetch(url, { headers: { "User-Agent": FETCH_UA } });
    if (!res.ok) throw new Error(`${dataset}: HTTP ${res.status}`);
    const json = (await res.json()) as {
      series: { docs: DbnSeries[]; num_found: number };
    };
    out.push(...(json.series?.docs ?? []));
    if (offset + 1000 >= (json.series?.num_found ?? 0)) break;
  }
  return out;
}
