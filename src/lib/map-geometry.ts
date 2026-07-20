/** Shared choropleth geometry — used by the homepage MapServer (adds
 *  espresso-price fills at build) and serialized to public/map-paths.json
 *  for the Data Lab's client-side Map mode (recolors per dataset).
 *  Pure module: no React, no fills, no colors. */
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { iso31661 } from "iso-3166";
import type { Feature, Geometry } from "geojson";
// Pre-simplified at ~8% of points (regenerate: npm run map:slim). All 241
// polygons survive — only sub-pixel vertices are dropped. The full-detail
// 50m file stays in /public as the validation reference.
import topo from "../data-map/countries-slim.json";

export const MAP_W = 960;
export const MAP_H = 500;

export interface GeoFeature {
  key: string;
  iso3?: string;
  name: string;
  d: string;
}

export interface GeoMarker {
  iso3: string;
  name: string;
  cx: number;
  cy: number;
}

export interface MapGeometry {
  features: GeoFeature[];
  markers: GeoMarker[];
}

const NUM_TO_A3 = new Map(iso31661.map((c) => [c.numeric, c.alpha3]));

interface CountryProps {
  name?: string;
}
type TopoFeature = Feature<Geometry, CountryProps> & { id?: string | number };

function iso3Of(f: TopoFeature): string | undefined {
  if (f.id !== undefined) {
    const a3 = NUM_TO_A3.get(String(f.id).padStart(3, "0"));
    if (a3) return a3;
  }
  if (f.properties?.name === "Kosovo") return "XKX"; // no ISO numeric id
  return undefined;
}

/* Issue #2 — microstates. Any polygon smaller than MARKER_THRESHOLD_PX at
   world zoom gets a centroid marker so it stays visible and hoverable.
   Data-driven, not a hardcoded list. */
const MARKER_THRESHOLD_PX = 4;
// No polygon exists in world-atlas@2 for Tuvalu — the one manual centroid.
const MANUAL_CENTROIDS: Record<string, [lon: number, lat: number]> = {
  TUV: [179.2, -8.5],
};

/** `markerFor` decides which iso3 codes deserve markers (the homepage
 *  passes its dataset membership; the Lab passes all mapped codes). */
export function buildGeometry(markerFor: (iso3: string) => boolean): MapGeometry {
  const projection = geoNaturalEarth1().fitSize([MAP_W, MAP_H], {
    type: "Sphere",
  } as unknown as Feature<Geometry>);
  // Integer coordinates: invisible at 960×500, ~35% smaller payload.
  const path = geoPath(projection).digits(0);

  const collection = feature(
    topo as unknown as Parameters<typeof feature>[0],
    (topo as unknown as { objects: { countries: Parameters<typeof feature>[1] } })
      .objects.countries,
  ) as unknown as { features: TopoFeature[] };

  const features: GeoFeature[] = [];
  const markers: GeoMarker[] = [];
  const seen = new Set<string>();

  collection.features.forEach((f, idx) => {
    const d = path(f as Feature<Geometry>);
    if (!d) return;
    const iso3 = iso3Of(f);
    features.push({
      key: `${iso3 ?? f.properties?.name ?? "g"}-${idx}`,
      iso3,
      name: f.properties?.name ?? "Unknown",
      d,
    });
    if (iso3 && markerFor(iso3) && !seen.has(iso3)) {
      seen.add(iso3);
      const [[x0, y0], [x1, y1]] = path.bounds(f as Feature<Geometry>);
      if (Math.max(x1 - x0, y1 - y0) < MARKER_THRESHOLD_PX) {
        const [cx, cy] = path.centroid(f as Feature<Geometry>);
        markers.push({ iso3, name: f.properties?.name ?? iso3, cx: Math.round(cx), cy: Math.round(cy) });
      }
    }
  });

  for (const [iso3, lonLat] of Object.entries(MANUAL_CENTROIDS)) {
    const pt = projection(lonLat);
    if (pt && markerFor(iso3) && !seen.has(iso3)) {
      markers.push({ iso3, name: iso3, cx: Math.round(pt[0]), cy: Math.round(pt[1]) });
    }
  }

  return { features, markers };
}
