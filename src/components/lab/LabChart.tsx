"use client";

import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";
import type { TidyRow } from "@/lib/datalab-types";
import { countryName, indicatorLabel, REGION_BY_ISO3, TIER_BY_ISO3 } from "@/lib/lab-data";
import type { JoinedPoint } from "@/lib/lab-join";
import type { ScatterAnalysis } from "@/lib/lab-stats";

export interface GroupFit {
  region: string;
  analysis: ScatterAnalysis<JoinedPoint>;
}
import { isTimeRef, type LabState } from "@/lib/lab-state";

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

const TIER_LABELS = ["surveyed", "derived", "modeled"] as const;

export interface LinePoint {
  iso3: string;
  date: Date;
  value: number;
}

export interface BarPoint {
  iso3: string;
  value: number;
  highlight?: boolean;
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

/** Bar mode: one value per country — the most recent observation ≤ the
 *  selected year. With countries=all, the top 15 by value. */
export function tidyToBarPoints(rows: TidyRow[], state: LabState): BarPoint[] {
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
  const hi = new Set(state.highlight ?? []);
  let points = [...best.entries()].map(([iso3, v]) => ({
    iso3,
    value: v.value,
    highlight: hi.has(iso3),
  }));
  points.sort((a, b) => b.value - a.value);
  if (!wanted) points = points.slice(0, 15);
  return points;
}

function lineLabel(state: LabState): string {
  const base = indicatorLabel(state.series.dataset, state.series.indicator);
  if (state.yoy) return `${base} — YoY %`;
  if (state.index100) return `${base} — index (first year = 100)`;
  return base;
}

function heightFor(width: number) {
  return Math.max(320, Math.round(width * 0.5));
}

function buildLinePlot(state: LabState, points: LinePoint[], width: number) {
  return Plot.plot({
    width,
    height: heightFor(width),
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
      label: lineLabel(state),
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

function buildBarPlot(state: LabState, points: BarPoint[], width: number) {
  return Plot.plot({
    width,
    height: Math.max(320, points.length * 28 + 60),
    marginLeft: 130,
    style: { background: "transparent", fontSize: "12px" },
    x: {
      grid: true,
      type: state.scale === "log" ? "log" : "linear",
      label: indicatorLabel(state.series.dataset, state.series.indicator),
    },
    y: { label: null },
    marks: [
      Plot.barX(points, {
        x: "value",
        y: (d: BarPoint) => countryName(d.iso3),
        sort: { y: "-x" },
        fill: (d: BarPoint) => (d.highlight ? "#6B4A32" : "#C89A5B"),
        tip: true,
        title: (d: BarPoint) => `${countryName(d.iso3)}: ${d.value.toLocaleString()}`,
      }),
      Plot.ruleX([0]),
    ],
  });
}

function buildScatterPlot(
  state: LabState,
  points: JoinedPoint[],
  width: number,
  ghostYear?: string,
  analysis?: ScatterAnalysis<JoinedPoint> | null,
  groupFits?: GroupFit[] | null,
) {
  const timeX = isTimeRef(state.x);
  const espressoAxis =
    state.x.dataset === "espresso" || state.y.dataset === "espresso";
  // Trend + labels come from the transform-space analysis (log bug fix):
  // the fitted line is computed in the same space the axes display.
  const fit = state.trend ? (analysis?.fit ?? null) : null;
  const mode = analysis?.mode ?? { logX: false, logY: false };
  const xs = points.map((p) => p.x).filter((v) => !mode.logX || v > 0);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  const trendPts = fit
    ? Array.from({ length: 60 }, (_, i) => {
        const f = i / 59;
        const x = mode.logX ? x0 * Math.pow(x1 / x0, f) : x0 + (x1 - x0) * f;
        const ty = fit.intercept + fit.slope * (mode.logX ? Math.log(x) : x);
        return { x, y: mode.logY ? Math.exp(ty) : ty };
      })
    : [];
  const groupTrendPts = (groupFits ?? []).flatMap(({ region, analysis: a }) => {
    if (!a.fit) return [];
    const gx = a.used.map((d) => d.orig.x);
    const [g0, g1] = [Math.min(...gx), Math.max(...gx)];
    return Array.from({ length: 40 }, (_, i) => {
      const f = i / 39;
      const x = mode.logX ? g0 * Math.pow(g1 / g0, f) : g0 + (g1 - g0) * f;
      const ty = a.fit!.intercept + a.fit!.slope * (mode.logX ? Math.log(x) : x);
      return { x, y: mode.logY ? Math.exp(ty) : ty, region };
    });
  });
  const labelPts = state.labels && analysis
    ? [...analysis.residuals]
        .sort((a, b) => Math.abs(b.residual) - Math.abs(a.residual))
        .slice(0, 6)
        .map((r) => r.orig)
    : [];

  return Plot.plot({
    width,
    height: heightFor(width),
    marginLeft: 56,
    style: { background: "transparent", fontSize: "12px" },
    color: { legend: true, scheme: "observable10" },
    symbol: espressoAxis ? { legend: true } : undefined,
    x: {
      grid: true,
      type: timeX ? "linear" : mode.logX ? "log" : "linear",
      tickFormat: timeX ? "d" : undefined,
      label: timeX ? "Year" : indicatorLabel(state.x.dataset, state.x.indicator),
    },
    y: {
      grid: true,
      type: mode.logY ? "log" : "linear",
      label: indicatorLabel(state.y.dataset, state.y.indicator),
    },
    marks: [
      ...(ghostYear
        ? [
            Plot.text([ghostYear], {
              frameAnchor: "top-right",
              dx: -12,
              dy: 16,
              text: (d: string) => d,
              fontSize: 44,
              fontWeight: 700,
              fill: "#ede6db",
            }),
          ]
        : []),
      ...(trendPts.length && !groupFits?.length
        ? [Plot.line(trendPts, { x: "x", y: "y", stroke: "#6B4A32", strokeDasharray: "4 3" })]
        : []),
      ...(groupTrendPts.length
        ? [Plot.line(groupTrendPts, { x: "x", y: "y", z: "region", stroke: "region", strokeWidth: 1.5, strokeDasharray: "4 3" })]
        : []),
      ...(labelPts.length
        ? [
            Plot.text(labelPts, {
              x: "x",
              y: "y",
              text: (d: JoinedPoint) => countryName(d.iso3),
              dy: -9,
              fontSize: 10,
              fill: "#2B1B12",
              stroke: "#faf6f0",
              strokeWidth: 3,
              paintOrder: "stroke",
            }),
          ]
        : []),
      Plot.dot(points, {
        x: "x",
        y: "y",
        stroke: (d: JoinedPoint) => REGION_BY_ISO3.get(d.iso3) ?? "Other",
        symbol: espressoAxis
          ? (d: JoinedPoint) => TIER_LABELS[TIER_BY_ISO3.get(d.iso3) ?? 2]
          : undefined,
        r: 4,
        tip: true,
        title: (d: JoinedPoint) =>
          timeX
            ? `${countryName(d.iso3)}\n${d.xDate}: ${d.y.toLocaleString()}`
            : `${countryName(d.iso3)}\nx: ${d.x.toLocaleString()} (${d.xDate})\ny: ${d.y.toLocaleString()} (${d.yDate})`,
      }),
    ],
  });
}

export default function LabChart({
  state,
  linePoints,
  barPoints,
  scatterPoints,
  scatterAnalysis,
  groupFits,
  ghostYear,
  ariaLabel,
}: {
  state: LabState;
  linePoints?: LinePoint[];
  barPoints?: BarPoint[];
  scatterPoints?: JoinedPoint[];
  scatterAnalysis?: ScatterAnalysis<JoinedPoint> | null;
  groupFits?: GroupFit[] | null;
  ghostYear?: string;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const render = () => {
      const width = el.clientWidth || 800;
      const plot =
        state.type === "bar" && barPoints
          ? buildBarPlot(state, barPoints, width)
          : state.type === "scatter" && scatterPoints
            ? buildScatterPlot(state, scatterPoints, width, ghostYear, scatterAnalysis, groupFits)
            : buildLinePlot(state, linePoints ?? [], width);
      // Plot labels its mark groups with aria-label on role-less <g>,
      // which axe rejects (aria-prohibited-attr). role=group permits it.
      plot
        .querySelectorAll("g[aria-label]:not([role])")
        .forEach((g) => g.setAttribute("role", "group"));
      el.replaceChildren(plot);
    };
    render();
    const ro = new ResizeObserver(render);
    ro.observe(el);
    return () => ro.disconnect();
  }, [state, linePoints, barPoints, scatterPoints, scatterAnalysis, groupFits, ghostYear]);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={ariaLabel}
      className="min-h-[320px] w-full [&_svg]:overflow-visible"
    />
  );
}
