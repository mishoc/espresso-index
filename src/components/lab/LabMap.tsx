"use client";

import { useEffect, useRef, useState } from "react";
import { scaleSequential } from "d3-scale";
import { interpolateBlues } from "d3-scale-chromatic";
import type { TidyRow } from "@/lib/datalab-types";
import { countryName, indicatorLabel, loadMapGeometry } from "@/lib/lab-data";
import type { MapGeometry } from "@/lib/map-geometry";
import { MAP_W, MAP_H } from "@/lib/map-geometry";
import type { LabState } from "@/lib/lab-state";

const NO_DATA_FILL = "#e2ddd4";

/** Map mode: one value per country (most recent ≤ selected year),
 *  sequential blues like the homepage choropleth. */
export function tidyToMapValues(rows: TidyRow[], state: LabState): Map<string, number> {
  const year = state.year ?? state.to ?? "9999";
  const wanted =
    state.countries === "all" ? null : new Set(state.countries as string[]);
  const best = new Map<string, { value: number; date: string }>();
  for (const r of rows) {
    if (r.indicator !== state.series.indicator) continue;
    if (r.iso3 === "WLD") continue;
    if (r.date.slice(0, 4) > year) continue;
    if (wanted && !wanted.has(r.iso3)) continue;
    const cur = best.get(r.iso3);
    if (!cur || r.date > cur.date) best.set(r.iso3, { value: r.value, date: r.date });
  }
  return new Map([...best.entries()].map(([k, v]) => [k, v.value]));
}

interface Tip {
  x: number;
  y: number;
  w: number;
  name: string;
  value?: number;
}

export default function LabMap({
  state,
  values,
}: {
  state: LabState;
  values: Map<string, number>;
}) {
  const [geo, setGeo] = useState<MapGeometry | null>(null);
  const [failed, setFailed] = useState(false);
  const [tip, setTip] = useState<Tip | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    loadMapGeometry()
      .then((g) => alive && setGeo(g))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  if (failed)
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-card border border-card-border bg-paper text-sm text-roast">
        Couldn&apos;t load the map geometry — reload to retry.
      </div>
    );
  if (!geo)
    return (
      <div className="flex min-h-[320px] animate-pulse items-center justify-center rounded-card border border-card-border bg-paper text-sm text-modeled-ink">
        Projecting the world…
      </div>
    );

  const vals = [...values.values()];
  const [min, max] = vals.length
    ? [Math.min(...vals), Math.max(...vals)]
    : [0, 1];
  const color = scaleSequential(interpolateBlues).domain([
    min - (max - min) * 0.1,
    max,
  ]);
  const legendStops = Array.from({ length: 10 }, (_, i) =>
    color(min - (max - min) * 0.1 + ((max - min) * 1.1 * i) / 9),
  );

  const move = (e: React.MouseEvent) => {
    const target = (e.target as Element).closest("[data-name]");
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!target || !rect) {
      setTip(null);
      return;
    }
    const iso3 = target.getAttribute("data-iso3") ?? "";
    setTip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      w: rect.width,
      name: values.has(iso3)
        ? countryName(iso3)
        : (target.getAttribute("data-name") ?? "Unknown"),
      value: values.get(iso3),
    });
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`World map of ${indicatorLabel(state.series.dataset, state.series.indicator)}`}
        onMouseMove={move}
        onMouseLeave={() => setTip(null)}
      >
        {geo.features.map((f) => {
          const v = f.iso3 ? values.get(f.iso3) : undefined;
          return (
            <path
              key={f.key}
              d={f.d}
              fill={v !== undefined ? color(v) : NO_DATA_FILL}
              stroke="#faf6f0"
              strokeWidth={0.5}
              data-iso3={f.iso3}
              data-name={f.name}
              className="cursor-pointer"
            />
          );
        })}
        {geo.markers
          .filter((m) => values.has(m.iso3))
          .map((m) => (
            <circle
              key={`marker-${m.iso3}`}
              cx={m.cx}
              cy={m.cy}
              r={3.5}
              fill={color(values.get(m.iso3)!)}
              stroke="#faf6f0"
              strokeWidth={1}
              data-iso3={m.iso3}
              data-name={m.name}
              className="cursor-pointer"
            />
          ))}
      </svg>

      <div className="mt-2 flex items-center gap-2 text-xs text-roast">
        <span className="tabular">{min.toLocaleString()}</span>
        <span
          className="h-2 w-40 rounded-full"
          style={{ background: `linear-gradient(to right, ${legendStops.join(",")})` }}
        />
        <span className="tabular">{max.toLocaleString()}</span>
        <span className="ml-3 inline-block h-3 w-3 rounded-[3px]" style={{ background: NO_DATA_FILL }} />
        <span>no data</span>
      </div>

      {tip && (
        <div
          className="pointer-events-none absolute z-10 max-w-60 rounded-[6px] border border-card-border bg-paper px-3 py-2 text-sm shadow-lg"
          style={{ left: Math.min(tip.x + 14, tip.w - 200), top: tip.y + 14 }}
        >
          <p className="font-medium">{tip.name}</p>
          <p className="tabular text-xs text-modeled-ink">
            {tip.value !== undefined ? tip.value.toLocaleString() : "no data for this selection"}
          </p>
        </div>
      )}
    </div>
  );
}
