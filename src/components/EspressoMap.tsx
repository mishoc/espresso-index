"use client";

import { useEffect, useRef, useState } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { scaleSequential } from "d3-scale";
import { interpolateBlues } from "d3-scale-chromatic";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { Feature, Geometry } from "geojson";
import { iso31661 } from "iso-3166";
import { dataset, flagEmoji } from "@/lib/data";
import type { Country } from "@/lib/types";

const W = 960;
const H = 500;
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
type CountryFeature = Feature<Geometry, CountryProps> & { id?: string | number };

function iso3Of(f: CountryFeature): string | undefined {
  if (f.id !== undefined) {
    const a3 = NUM_TO_A3.get(String(f.id).padStart(3, "0"));
    if (a3) return a3;
  }
  if (f.properties?.name === "Kosovo") return "XKX"; // no ISO numeric id
  return undefined;
}

interface Tip {
  x: number;
  y: number;
  w: number;
  country?: Country;
  label?: string;
}

export default function EspressoMap() {
  const [features, setFeatures] = useState<CountryFeature[]>([]);
  const [tip, setTip] = useState<Tip | null>(null);
  const [failed, setFailed] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    fetch("/countries-50m.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((topo: Topology<{ countries: GeometryCollection<CountryProps> }>) => {
        if (!alive) return;
        const fc = feature(topo, topo.objects.countries);
        setFeatures(fc.features as CountryFeature[]);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  if (failed) return null; // never a broken widget (SPEC §2)

  const projection = geoNaturalEarth1().fitSize([W, H], {
    type: "Sphere",
  } as unknown as Feature<Geometry>);
  const path = geoPath(projection);

  const move = (e: React.MouseEvent, f: CountryFeature) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const iso3 = iso3Of(f);
    const country = iso3 ? BY_ISO3.get(iso3) : undefined;
    setTip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      w: rect.width,
      country,
      label: country ? undefined : (f.properties?.name ?? "Unknown"),
    });
  };

  const legendStops = Array.from({ length: 10 }, (_, i) =>
    color(MIN - 0.4 + ((MAX - MIN + 0.4) * i) / 9),
  );

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="World map of espresso prices"
      >
        {features.map((f, idx) => {
          const iso3 = iso3Of(f);
          const c = iso3 ? BY_ISO3.get(iso3) : undefined;
          return (
            <path
              key={`${iso3 ?? f.properties?.name ?? "g"}-${idx}`}
              d={path(f) ?? undefined}
              fill={c ? color(c.priceUSD) : NO_DATA_FILL}
              stroke="#faf6f0"
              strokeWidth={0.5}
              onMouseMove={(e) => move(e, f)}
              onMouseLeave={() => setTip(null)}
              className="cursor-pointer"
            />
          );
        })}
      </svg>

      {/* legend */}
      <div className="mt-2 flex items-center gap-2 text-xs text-roast">
        <span className="tabular">${MIN.toFixed(2)}</span>
        <span
          className="h-2 w-40 rounded-full"
          style={{ background: `linear-gradient(to right, ${legendStops.join(",")})` }}
        />
        <span className="tabular">${MAX.toFixed(2)}</span>
        <span className="ml-3 inline-block h-3 w-3 rounded-[3px]" style={{ background: NO_DATA_FILL }} />
        <span>not in the index</span>
      </div>

      {/* MapTooltip: flag, price, rank, tier (SPEC §2) */}
      {tip && (
        <div
          className="pointer-events-none absolute z-10 max-w-60 rounded-[6px] border border-card-border bg-paper px-3 py-2 text-sm shadow-lg"
          style={{ left: Math.min(tip.x + 14, tip.w - 200), top: tip.y + 14 }}
        >
          {tip.country ? (
            <>
              <p className="font-medium">
                {flagEmoji(tip.country.iso3)} {tip.country.name}
              </p>
              <p className="tabular">
                ${tip.country.priceUSD.toFixed(2)} · rank {tip.country.rank}/{dataset.total}
              </p>
              <p className="text-xs text-modeled capitalize">{tip.country.tier}</p>
            </>
          ) : (
            <>
              <p className="font-medium">{tip.label}</p>
              <p className="text-xs text-modeled">
                Not in the index — no reliable espresso pricing for this
                territory yet.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
