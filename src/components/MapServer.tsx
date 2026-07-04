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
import EspressoMap, { type MapFeature } from "./EspressoMap";

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

function buildFeatures(): MapFeature[] {
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

  return collection.features.flatMap((f, idx) => {
    const d = path(f as Feature<Geometry>);
    if (!d) return [];
    const iso3 = iso3Of(f);
    const c = iso3 ? BY_ISO3.get(iso3) : undefined;
    return [
      {
        key: `${iso3 ?? f.properties?.name ?? "g"}-${idx}`,
        iso3: c ? iso3! : undefined,
        name: f.properties?.name ?? "Unknown",
        d,
        fill: c ? color(c.priceUSD) : NO_DATA_FILL,
      },
    ];
  });
}

const FEATURES = buildFeatures();
const LEGEND_STOPS = Array.from({ length: 10 }, (_, i) =>
  color(MIN - 0.4 + ((MAX - MIN + 0.4) * i) / 9),
);

export default function MapServer() {
  return (
    <EspressoMap
      features={FEATURES}
      legendStops={LEGEND_STOPS}
      min={MIN}
      max={MAX}
      noDataFill={NO_DATA_FILL}
    />
  );
}
