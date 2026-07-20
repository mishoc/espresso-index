"use client";

import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";
import type { TidyRow } from "@/lib/datalab-types";
import { countryName, indicatorLabel } from "@/lib/lab-data";
import type { LabState } from "@/lib/lab-state";

/** Categorical ramp: crema first (§4.2), then colorblind-safe. */
export const SERIES_COLORS = [
  "#C89A5B",
  "#0072B2",
  "#009E73",
  "#D55E00",
  "#CC79A7",
  "#56B4E9",
  "#8A6508",
  "#2B1B12",
  "#999999",
  "#E69F00",
  "#6B4A32",
  "#5D3A9B",
];

export interface LinePoint {
  iso3: string;
  date: Date;
  value: number;
}

function buildLinePlot(state: LabState, points: LinePoint[], width: number) {
  return Plot.plot({
    width,
    height: Math.max(320, Math.round(width * 0.5)),
    marginLeft: 56,
    style: { background: "transparent", fontSize: "12px" },
    color: {
      legend: true,
      domain: [...new Set(points.map((p) => p.iso3))].map(countryName),
      range: SERIES_COLORS,
    },
    y: {
      grid: true,
      type: state.scale === "log" ? "log" : "linear",
      label: indicatorLabel(state.series.dataset, state.series.indicator),
    },
    x: { label: null },
    marks: [
      Plot.ruleY([0]),
      Plot.lineY(points, {
        x: "date",
        y: "value",
        stroke: (d: LinePoint) => countryName(d.iso3),
        strokeWidth: 1.75,
        tip: true,
        title: (d: LinePoint) =>
          `${countryName(d.iso3)}\n${d.date.getUTCFullYear()}: ${d.value.toLocaleString()}`,
      }),
    ],
  });
}

export function tidyToLinePoints(rows: TidyRow[], state: LabState): LinePoint[] {
  const wanted =
    state.countries === "all" ? null : new Set(state.countries as string[]);
  const points: LinePoint[] = [];
  for (const r of rows) {
    if (r.indicator !== state.series.indicator) continue;
    if (wanted && !wanted.has(r.iso3)) continue;
    if (!wanted && r.iso3 === "WLD" && state.series.dataset !== "coffee-prices") continue;
    const year = r.date.slice(0, 4);
    if (state.from && year < state.from) continue;
    if (state.to && year > state.to) continue;
    if (state.scale === "log" && r.value <= 0) continue;
    points.push({
      iso3: r.iso3,
      date: new Date(r.date.length === 4 ? `${r.date}-06-30` : `${r.date}-15`),
      value: r.value,
    });
  }
  return points.sort((a, b) => +a.date - +b.date);
}

export default function LabChart({
  state,
  points,
}: {
  state: LabState;
  points: LinePoint[];
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const render = () => {
      el.replaceChildren(
        buildLinePlot(state, points, el.clientWidth || 800),
      );
    };
    render();
    const ro = new ResizeObserver(render);
    ro.observe(el);
    return () => ro.disconnect();
  }, [state, points]);

  const n = new Set(points.map((p) => p.iso3)).size;
  return (
    <div
      ref={ref}
      role="img"
      aria-label={`Line chart of ${indicatorLabel(state.series.dataset, state.series.indicator)} for ${n} ${n === 1 ? "series" : "series"}`}
      className="min-h-[320px] w-full [&_svg]:overflow-visible"
    />
  );
}
