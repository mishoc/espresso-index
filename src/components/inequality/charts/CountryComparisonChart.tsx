"use client";

import { useCallback, useMemo, useState } from "react";
import type * as PlotType from "@observablehq/plot";
import PlotFigure from "./PlotFigure";
import type { GiniPoint } from "@/lib/inequality/data-snapshots";

const PALETTE = ["#1f5f8b", "#8b2e1f", "#1e6b3a", "#8a5a00"];
const MAX = 4;

export default function CountryComparisonChart({
  countries,
  data,
  defaults,
}: {
  countries: string[];
  data: Record<string, GiniPoint[]>;
  defaults: string[];
}) {
  const [picked, setPicked] = useState<string[]>(defaults);
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () => picked.flatMap((c) => (data[c] ?? []).map((p) => ({ ...p, country: c }))),
    [picked, data],
  );
  const build = useCallback(
    (Plot: typeof PlotType, width: number) =>
      Plot.plot({
        width,
        height: Math.max(320, Math.round(width * 0.5)),
        marginLeft: 44,
        style: { fontSize: "13px", background: "transparent" },
        color: { legend: true, domain: picked, range: PALETTE },
        x: { label: "Year", tickFormat: "d" },
        y: { label: "Gini, disposable income (0–100)", grid: true },
        marks: [
          Plot.areaY(rows, { x: "year", y1: (d: GiniPoint) => d.gini_disp - d.se, y2: (d: GiniPoint) => d.gini_disp + d.se, fill: "country", fillOpacity: 0.12 }),
          Plot.lineY(rows, { x: "year", y: "gini_disp", stroke: "country", strokeWidth: 2, tip: true,
            title: (d: GiniPoint & { country: string }) => `${d.country}, ${d.year}: ${d.gini_disp.toFixed(1)} (±${d.se.toFixed(1)})` }),
        ],
      }),
    [rows, picked],
  );

  const suggestions = query.trim()
    ? countries.filter((c) => !picked.includes(c) && c.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
    : [];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-start gap-2 text-sm" role="group" aria-label="Choose countries to compare (2 to 4)">
        {picked.map((c, i) => (
          <button
            key={c}
            onClick={() => picked.length > 2 && setPicked(picked.filter((x) => x !== c))}
            disabled={picked.length <= 2}
            title={picked.length <= 2 ? "Keep at least two countries" : `Remove ${c}`}
            className="inline-flex min-h-[36px] items-center gap-2 rounded border border-card-border px-2 disabled:opacity-60"
          >
            <span aria-hidden className="inline-block h-3 w-3 rounded-sm" style={{ background: PALETTE[i] }} />
            {c} <span aria-hidden>✕</span>
          </button>
        ))}
        {picked.length < MAX && (
          <div className="relative">
            <label className="sr-only" htmlFor="country-add">Add a country</label>
            <input
              id="country-add"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Add a country (up to ${MAX})`}
              className="min-h-[36px] rounded border border-card-border bg-porcelain px-2"
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 w-64 rounded border border-card-border bg-paper shadow" role="listbox">
                {suggestions.map((c) => (
                  <li key={c}>
                    <button className="w-full px-2 py-1.5 text-left hover:bg-paper" onClick={() => { setPicked([...picked, c]); setQuery(""); }}>
                      {c}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      <PlotFigure build={build} />
      <details className="mt-4 rounded-md border border-card-border p-4">
        <summary className="cursor-pointer font-medium">Data table (text alternative) for the selected countries</summary>
        <div className="mt-3 overflow-x-auto">
          <table className="text-sm">
            <caption className="sr-only">Disposable-income Gini by country and year, selected countries, every fifth year</caption>
            <thead><tr className="border-b border-card-border text-left"><th className="py-1 pr-4">Year</th>{picked.map((c) => <th key={c} className="py-1 pr-4">{c}</th>)}</tr></thead>
            <tbody>
              {Array.from(new Set(rows.map((r) => r.year))).filter((y) => y % 5 === 0).sort().map((y) => (
                <tr key={y} className="border-b border-card-border/60">
                  <td className="py-1 pr-4 tabular-nums">{y}</td>
                  {picked.map((c) => { const p = data[c]?.find((x) => x.year === y); return <td key={c} className="py-1 pr-4 tabular-nums">{p ? p.gini_disp.toFixed(1) : "—"}</td>; })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
