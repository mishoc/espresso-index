import { scaleSequential } from "d3-scale";
import { interpolateBlues } from "d3-scale-chromatic";
import { buildGeometry } from "@/lib/map-geometry";
import { dataset } from "@/lib/data";
import EspressoMap, { type MapFeature, type MapMarker } from "./EspressoMap";

/* Server component: geometry is projected at BUILD time (shared module),
   espresso-price fills are applied here, and the choropleth ships as plain
   SVG in the initial HTML — no client fetch (this was the LCP bottleneck). */

const NO_DATA_FILL = "#e2ddd4";

const BY_ISO3 = new Map(dataset.countries.map((c) => [c.iso3, c]));

const prices = dataset.countries.map((c) => c.priceUSD);
const [MIN, MAX] = [Math.min(...prices), Math.max(...prices)];
// Sequential blues, colorblind-safe (SPEC §3). Start above 0 so the
// cheapest countries stay distinguishable from the no-data gray.
const color = scaleSequential(interpolateBlues).domain([MIN - 0.4, MAX]);

const geo = buildGeometry((iso3) => BY_ISO3.has(iso3));

const FEATURES: MapFeature[] = geo.features.map((f) => {
  const c = f.iso3 ? BY_ISO3.get(f.iso3) : undefined;
  return {
    key: f.key,
    iso3: c ? f.iso3 : undefined,
    name: f.name,
    d: f.d,
    fill: c ? color(c.priceUSD) : NO_DATA_FILL,
  };
});

const MARKERS: MapMarker[] = geo.markers.flatMap((m) => {
  const c = BY_ISO3.get(m.iso3);
  return c
    ? [{ iso3: m.iso3, name: c.name, cx: m.cx, cy: m.cy, fill: color(c.priceUSD) }]
    : [];
});

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
