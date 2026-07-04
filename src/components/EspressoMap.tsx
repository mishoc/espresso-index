"use client";

import { useRef, useState } from "react";
import { dataset, flagEmoji } from "@/lib/data";
import type { Country } from "@/lib/types";

const W = 960;
const H = 500;

export interface MapFeature {
  key: string;
  iso3?: string;
  name: string;
  d: string;
  fill: string;
}

/* Issue #2: centroid markers for economies whose polygon is sub-pixel at
   world zoom (microstates + Tuvalu, which has no polygon at all). */
export interface MapMarker {
  iso3: string;
  name: string;
  cx: number;
  cy: number;
  fill: string;
}

const BY_ISO3 = new Map(dataset.countries.map((c) => [c.iso3, c]));

interface Tip {
  x: number;
  y: number;
  w: number;
  country?: Country;
  label?: string;
}

export default function EspressoMap({
  features,
  markers,
  legendStops,
  min,
  max,
  noDataFill,
}: {
  features: MapFeature[];
  markers: MapMarker[];
  legendStops: string[];
  min: number;
  max: number;
  noDataFill: string;
}) {
  const [tip, setTip] = useState<Tip | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  /* One delegated listener instead of 241 per-path handlers — keeps the
     server-rendered SVG cheap to hydrate. */
  const move = (e: React.MouseEvent) => {
    const target = (e.target as Element).closest("[data-name]");
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!target || !rect) {
      setTip(null);
      return;
    }
    const iso3 = target.getAttribute("data-iso3");
    const country = iso3 ? BY_ISO3.get(iso3) : undefined;
    setTip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      w: rect.width,
      country,
      label: country ? undefined : (target.getAttribute("data-name") ?? "Unknown"),
    });
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="World map of espresso prices"
        onMouseMove={move}
        onMouseLeave={() => setTip(null)}
      >
        {features.map((f) => (
          <path
            key={f.key}
            d={f.d}
            fill={f.fill}
            stroke="#faf6f0"
            strokeWidth={0.5}
            data-iso3={f.iso3}
            data-name={f.name}
            className="cursor-pointer"
          />
        ))}
        {markers.map((m) => (
          <circle
            key={`marker-${m.iso3}`}
            cx={m.cx}
            cy={m.cy}
            r={3.5}
            fill={m.fill}
            stroke="#faf6f0"
            strokeWidth={1}
            data-iso3={m.iso3}
            data-name={m.name}
            className="cursor-pointer"
          />
        ))}
      </svg>

      {/* legend */}
      <div className="mt-2 flex items-center gap-2 text-xs text-roast">
        <span className="tabular">${min.toFixed(2)}</span>
        <span
          className="h-2 w-40 rounded-full"
          style={{ background: `linear-gradient(to right, ${legendStops.join(",")})` }}
        />
        <span className="tabular">${max.toFixed(2)}</span>
        <span className="ml-3 inline-block h-3 w-3 rounded-[3px]" style={{ background: noDataFill }} />
        <span>not in the index</span>
        <span className="ml-3 inline-block h-2.5 w-2.5 rounded-full border border-porcelain" style={{ background: legendStops[5] }} />
        <span>microstates as dots</span>
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
              <p className="text-xs text-modeled-ink capitalize">{tip.country.tier}</p>
            </>
          ) : (
            <>
              <p className="font-medium">{tip.label}</p>
              <p className="text-xs text-modeled-ink">
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
