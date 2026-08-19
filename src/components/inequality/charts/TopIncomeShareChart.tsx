"use client";

import { useCallback } from "react";
import type * as PlotType from "@observablehq/plot";
import PlotFigure from "./PlotFigure";
import type { SharePoint } from "@/lib/inequality/data-snapshots";

const LABELS: Record<string, string> = { top1: "Top 1%", top10: "Top 10%" };
const COLORS = ["#1f5f8b", "#8b2e1f"];

export default function TopIncomeShareChart({ series }: { series: Record<string, SharePoint[]> }) {
  const rows = Object.entries(LABELS).flatMap(([k, label]) =>
    (series[k] ?? []).filter((p) => p.year >= 1913).map((p) => ({ ...p, group: label })),
  );
  const build = useCallback(
    (Plot: typeof PlotType, width: number) =>
      Plot.plot({
        width,
        height: Math.max(320, Math.round(width * 0.5)),
        marginLeft: 48,
        style: { fontSize: "13px", background: "transparent" },
        color: { legend: true, domain: Object.values(LABELS), range: COLORS },
        x: { label: "Year", tickFormat: "d" },
        y: { label: "Share of pre-tax national income (%)", grid: true, domain: [0, 55] },
        marks: [
          Plot.ruleY([0]),
          Plot.lineY(rows, { x: "year", y: "share", stroke: "group", strokeWidth: 2, tip: true,
            title: (d: { group: string; year: number; share: number }) => `${d.group}, ${d.year}: ${d.share.toFixed(1)}%` }),
        ],
      }),
    [rows],
  );
  return <PlotFigure build={build} />;
}
