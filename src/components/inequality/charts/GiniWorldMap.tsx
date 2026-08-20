"use client";

import { useMemo, useState } from "react";
import { interpolateYlOrRd } from "d3-scale-chromatic";
import type { TidyRow } from "@/lib/datalab-types";
import LabMap from "@/components/lab/LabMap";
import { latestGini } from "@/lib/inequality/gini-map";
import type { LabState } from "@/lib/lab-state";

/** Choropleth of the World Bank Gini index. Reuses the Lab's map renderer
 *  with a warm ramp (darker red = more unequal). Survey years vary by
 *  country, so the slider caps which surveys count — each country shows
 *  its most recent survey at or before the selected year. */
export default function GiniWorldMap({ rows }: { rows: TidyRow[] }) {
  const [year, setYear] = useState(2025);

  const values = useMemo(
    () => new Map(latestGini(rows, String(year)).map((g) => [g.iso3, g.value])),
    [rows, year],
  );

  const state: LabState = {
    type: "map",
    series: { dataset: "wdi-gini", indicator: "gini_index" },
    x: { dataset: "wdi-gini", indicator: "gini_index" },
    y: { dataset: "wdi-gini", indicator: "gini_index" },
    countries: "all",
    scale: "linear",
    logY: false,
    labels: false,
    yoy: false,
    index100: false,
    trend: false,
  };

  return (
    <div className="rounded-card border border-card-border bg-paper p-4">
      <LabMap state={state} values={values} scheme={interpolateYlOrRd} />
      <div className="mt-3 flex items-center gap-3 text-sm">
        <label htmlFor="gini-year" className="text-xs font-medium tracking-wide text-modeled-ink uppercase">
          Surveys up to
        </label>
        <input
          id="gini-year"
          type="range"
          min={1990}
          max={2025}
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="w-48 accent-espresso"
        />
        <span className="tabular font-medium">{year}</span>
        <span className="text-xs text-modeled-ink">
          {values.size} countries · each shows its most recent survey ≤ {year}
        </span>
      </div>
    </div>
  );
}
