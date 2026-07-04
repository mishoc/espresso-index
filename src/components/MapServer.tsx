import { geoNaturalEarth1, geoPath } from "d3-geo";
import { scaleSequential } from "d3-scale";
import { interpolateBlues } from "d3-scale-chromatic";
import { feature } from "topojson-client";
import { iso31661 } from "iso-3166";
import type { Feature, Geometry } from "geojson";
// Pre-simplified at ~8% of points (regenerate: npm run map:slim). All 241
// polygons survive — only sub-pixel vertices are dropped. The full-detail
// 50m file stays in /public as the validation reference.
import topo from "../data-map/countries-slim.json";
import { dataset } from "@/lib/data";
import EspressoMap, { type MapFeature, type MapMarker } from "./EspressoMap";

/* Server component: the topology is parsed and projected at BUILD time, so
   the choropleth ships as plain SVG in the initial HTML — no client fetch,
   no parse, no post-hydration render (this was the LCP bottleneck). */

const NO_DATA_FILL = "#e2ddd4";

const NUM_TO_A3 = new Map(iso31661.map((c) => [c.numeric, c.alpha3]));
const BY_ISO3 = new Map(dataset.countries.map((c) => [c.iso3, c]));

const prices = dataset.countries.map((c) => c.priceUSD);
const [MIN, MAX] = [Math.min(...prices), Math.max(...prices)];
// Sequential blues, colorblind-safe (SPEC §3). Start above 0 so the
// cheapest countries stay distinguishable from the no-data gray.
const color = scaleSequential(interpolateBlues).domain([MIN - 0.4, MAX]);

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

/* Issue #2 — microstates. Any economy whose projected polygon is smaller
   than MARKER_THRESHOLD_PX gets a centroid marker so it is visible and
   hoverable at world zoom. Data-driven, not a hardcoded list: if a future
   topology renders a country larger, its marker disappears on its own. */
const MARKER_THRESHOLD_PX = 4;
// No polygon exists in world-atlas@2 for Tuvalu — the one manual centroid.
const MANUAL_CENTROIDS: Record<string, [lon: number, lat: number]> = {
  TUV: [179.2, -8.5],
};

function buildMap(): { features: MapFeature[]; markers: MapMarker[] } {
  const projection = geoNaturalEarth1().fitSize([960, 500], {
    type: "Sphere",
  } as unknown as Feature<Geometry>);
  // Integer coordinates: invisible at 960×500, ~35% smaller payload.
  const path = geoPath(projection).digits(0);

  const collection = feature(
    topo as unknown as Parameters<typeof feature>[0],
    (topo as unknown as { objects: { countries: Parameters<typeof feature>[1] } })
      .objects.countries,
  ) as unknown as { features: TopoFeature[] };

  const features: MapFeature[] = [];
  const markers: MapMarker[] = [];
  const seenIso3 = new Set<string>();

  collection.features.forEach((f, idx) => {
    const d = path(f as Feature<Geometry>);
    if (!d) return;
    const iso3 = iso3Of(f);
    const c = iso3 ? BY_ISO3.get(iso3) : undefined;
    features.push({
      key: `${iso3 ?? f.properties?.name ?? "g"}-${idx}`,
      iso3: c ? iso3! : undefined,
      name: f.properties?.name ?? "Unknown",
      d,
      fill: c ? color(c.priceUSD) : NO_DATA_FILL,
    });
    if (c && iso3 && !seenIso3.has(iso3)) {
      seenIso3.add(iso3);
      const [[x0, y0], [x1, y1]] = path.bounds(f as Feature<Geometry>);
      if (Math.max(x1 - x0, y1 - y0) < MARKER_THRESHOLD_PX) {
        const [cx, cy] = path.centroid(f as Feature<Geometry>);
        markers.push({
          iso3,
          name: c.name,
          cx: Math.round(cx),
          cy: Math.round(cy),
          fill: color(c.priceUSD),
        });
      }
    }
  });

  for (const [iso3, lonLat] of Object.entries(MANUAL_CENTROIDS)) {
    const c = BY_ISO3.get(iso3);
    const pt = projection(lonLat);
    if (c && pt && !seenIso3.has(iso3)) {
      markers.push({
        iso3,
        name: c.name,
        cx: Math.round(pt[0]),
        cy: Math.round(pt[1]),
        fill: color(c.priceUSD),
      });
    }
  }

  return { features, markers };
}

const { features: FEATURES, markers: MARKERS } = buildMap();
const LEGEND_STOPS = Array.from({ length: 10 }, (_, i) =>
  color(MIN - 0.4 + ((MAX - MIN + 0.4) * i) / 9),
);

export default function MapServer() {
  return (
    <EspressoMap
      features={FEATURES}
      markers={MARKERS}
      legendStops={LEGEND_STOPS}
      min={MIN}
      max={MAX}
      noDataFill={NO_DATA_FILL}
    />
  );
}
