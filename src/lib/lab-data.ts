import manifestJson from "../../public/datasets/manifest.json";
import type { Manifest, ManifestEntry, TidyRow } from "./datalab-types";
import { dataset as espressoDataset } from "./data";

/** The manifest is tiny and bundles with the Lab chunk; dataset bodies are
 *  lazy-fetched per selection (§3.4, §6-5) and cached for the session. */
export const manifest = manifestJson as unknown as Manifest;
export const manifestById = new Map<string, ManifestEntry>(
  manifest.map((m) => [m.id, m]),
);

const cache = new Map<string, Promise<TidyRow[]>>();

export function loadDataset(id: string): Promise<TidyRow[]> {
  if (!cache.has(id)) {
    const p = fetch(`/datasets/${id}.json`).then((r) => {
      if (!r.ok) throw new Error(`dataset ${id}: HTTP ${r.status}`);
      return r.json() as Promise<TidyRow[]>;
    });
    // Drop failed loads from the cache so the retry card can actually retry.
    p.catch(() => cache.delete(id));
    cache.set(id, p);
  }
  return cache.get(id)!;
}

export function indicatorLabel(dsId: string, code: string): string {
  return (
    manifestById.get(dsId)?.indicators.find((i) => i.code === code)?.label ??
    code
  );
}

export function attribution(ids: string[]): string {
  return [...new Set(ids.map((id) => manifestById.get(id)?.attribution).filter(Boolean))].join(" · ");
}

/** Display names + regions for the country selector: espresso dataset is
 *  the canonical 196; WDI-only extras fall back to their iso3. */
export const COUNTRY_NAMES = new Map(
  espressoDataset.countries.map((c) => [c.iso3, c.name]),
);
export const REGIONS = [...new Set(espressoDataset.countries.map((c) => c.region))].sort();
export const COUNTRIES_BY_REGION = new Map(
  REGIONS.map((r) => [
    r,
    espressoDataset.countries.filter((c) => c.region === r).map((c) => c.iso3),
  ]),
);
export const countryName = (iso3: string) => COUNTRY_NAMES.get(iso3) ?? iso3;
export const REGION_BY_ISO3 = new Map(
  espressoDataset.countries.map((c) => [c.iso3, c.region]),
);
const TIER_CODE = { surveyed: 0, derived: 1, modeled: 2 } as const;
export const TIER_BY_ISO3 = new Map(
  espressoDataset.countries.map((c) => [c.iso3, TIER_CODE[c.tier]]),
);

/** Lab Map mode geometry (shared with the homepage choropleth, serialized
 *  at build by scripts/build-map-paths.ts). */
import type { MapGeometry } from "./map-geometry";
let geoPromise: Promise<MapGeometry> | null = null;
export function loadMapGeometry(): Promise<MapGeometry> {
  if (!geoPromise) {
    geoPromise = fetch("/map-paths.json").then((r) => {
      if (!r.ok) throw new Error(`map geometry: HTTP ${r.status}`);
      return r.json() as Promise<MapGeometry>;
    });
    geoPromise.catch(() => (geoPromise = null));
  }
  return geoPromise;
}
