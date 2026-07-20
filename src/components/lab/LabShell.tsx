"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { TidyRow } from "@/lib/datalab-types";
import {
  attribution,
  countryName,
  COUNTRIES_BY_REGION,
  COUNTRY_NAMES,
  loadDataset,
  manifest,
  manifestById,
} from "@/lib/lab-data";
import {
  DEFAULT_STATE,
  LINE_SERIES_CAP,
  parseState,
  serializeState,
  type ChartType,
  type LabState,
} from "@/lib/lab-state";
import LabChart, { tidyToLinePoints } from "./LabChart";

/** Keyed by dataset id — "loading" is derived (loaded.id ≠ wanted id),
 *  so the effect never sets state synchronously (react-hooks rule). */
interface Loaded {
  id: string;
  rows?: TidyRow[];
  error?: string;
}

const CHART_TYPES: { id: ChartType; label: string; ready: boolean }[] = [
  { id: "line", label: "Line", ready: true },
  { id: "bar", label: "Bar", ready: false },
  { id: "scatter", label: "Scatter", ready: false },
  { id: "map", label: "Map", ready: false },
];

export default function LabShell() {
  const params = useSearchParams();
  const [state, setState] = useState<LabState>(() => {
    const parsed = parseState(new URLSearchParams(params.toString()));
    // Until Bar/Scatter/Map land (D8–9), coerce to the working chart.
    return parsed.type === "line"
      ? parsed
      : {
          ...parsed,
          type: "line",
          series: { dataset: "wdi-inflation", indicator: "cpi_inflation_pct" },
          countries: ["USA", "DEU", "JPN", "GBR", "ITA", "BRA", "IND", "TUR"],
          from: "1990",
        };
  });
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(false);

  /** URL is the source of truth — replaceState on every change (§4.3). */
  const update = useCallback((patch: Partial<LabState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      window.history.replaceState(null, "", `/lab?${serializeState(next)}`);
      return next;
    });
  }, []);

  useEffect(() => {
    let alive = true;
    const id = state.series.dataset;
    loadDataset(id)
      .then((rows) => alive && setLoaded({ id, rows }))
      .catch((e) => alive && setLoaded({ id, error: (e as Error).message }));
    return () => {
      alive = false;
    };
  }, [state.series.dataset, retryTick]);

  const entry = manifestById.get(state.series.dataset);
  const current = loaded?.id === state.series.dataset ? loaded : null;
  const load = !current
    ? ({ phase: "loading" } as const)
    : current.error
      ? ({ phase: "error", message: current.error } as const)
      : ({ phase: "ready", rows: current.rows! } as const);
  const points = useMemo(
    () => (load.phase === "ready" ? tidyToLinePoints(load.rows, state) : []),
    [load, state],
  );

  const selected = useMemo(
    () => (state.countries === "all" ? [] : (state.countries as string[])),
    [state.countries],
  );
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return [...COUNTRY_NAMES.entries()]
      .filter(
        ([iso3, name]) =>
          !selected.includes(iso3) &&
          (name.toLowerCase().includes(q) || iso3.toLowerCase().includes(q)),
      )
      .slice(0, 8);
  }, [search, selected]);

  const addCountry = (iso3: string) => {
    if (selected.length >= LINE_SERIES_CAP) return;
    update({ countries: [...selected, iso3] });
    setSearch("");
  };
  const addRegion = (region: string) => {
    const add = COUNTRIES_BY_REGION.get(region) ?? [];
    update({
      countries: [...new Set([...selected, ...add])].slice(0, LINE_SERIES_CAP),
    });
  };

  const share = async () => {
    const url = `${location.origin}/lab?${serializeState(state)}`;
    try {
      await navigator.clipboard.writeText(url);
      setToast(true);
      setTimeout(() => setToast(false), 2500);
    } catch {
      window.prompt("Copy link:", url);
    }
  };

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      {/* control panel */}
      <aside className="flex w-full shrink-0 flex-col gap-5 md:w-[280px]">
        <div>
          <p className="mb-1.5 text-xs font-medium tracking-wide text-modeled-ink uppercase">
            Chart type
          </p>
          <div className="flex gap-1">
            {CHART_TYPES.map((t) => (
              <button
                key={t.id}
                disabled={!t.ready}
                title={t.ready ? undefined : "Coming this week"}
                onClick={() => update({ type: t.id })}
                className={`min-h-[36px] flex-1 rounded-[6px] border px-2 text-sm ${
                  state.type === t.id
                    ? "border-crema bg-crema/20 font-medium"
                    : "border-card-border bg-paper text-roast"
                } ${t.ready ? "" : "cursor-not-allowed opacity-40"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium tracking-wide text-modeled-ink uppercase">
            Dataset · indicator
          </p>
          <select
            value={`${state.series.dataset}.${state.series.indicator}`}
            onChange={(e) => {
              const dot = e.target.value.indexOf(".");
              update({
                series: {
                  dataset: e.target.value.slice(0, dot),
                  indicator: e.target.value.slice(dot + 1),
                },
              });
            }}
            aria-label="Dataset and indicator"
            className="min-h-[44px] w-full rounded-[6px] border border-card-border bg-paper px-2 text-sm"
          >
            {manifest.flatMap((d) =>
              d.indicators
                .filter((i) => i.code !== "tier")
                .map((i) => (
                  <option key={`${d.id}.${i.code}`} value={`${d.id}.${i.code}`}>
                    {d.name} — {i.label}
                  </option>
                )),
            )}
          </select>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium tracking-wide text-modeled-ink uppercase">
            Countries ({selected.length}/{LINE_SERIES_CAP})
          </p>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Add a country…"
            aria-label="Search countries to add"
            className="min-h-[44px] w-full rounded-[6px] border border-card-border bg-paper px-3 text-sm outline-none focus:border-crema"
          />
          {search.trim() !== "" && searchResults.length === 0 && (
            <p className="mt-1 text-xs text-modeled-ink">
              No country matches “{search.trim()}” — yet.
            </p>
          )}
          {searchResults.length > 0 && (
            <ul className="mt-1 overflow-hidden rounded-[6px] border border-card-border bg-paper text-sm">
              {searchResults.map(([iso3, name]) => (
                <li key={iso3}>
                  <button
                    onClick={() => addCountry(iso3)}
                    className="w-full px-3 py-1.5 text-left hover:bg-porcelain"
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            {selected.map((iso3) => (
              <button
                key={iso3}
                onClick={() =>
                  update({ countries: selected.filter((c) => c !== iso3) })
                }
                title="Remove"
                className="rounded-[4px] border border-card-border bg-paper px-2 py-0.5 text-xs hover:border-error hover:text-error"
              >
                {countryName(iso3)} ✕
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {[...COUNTRIES_BY_REGION.keys()].slice(0, 4).map((r) => (
              <button
                key={r}
                onClick={() => addRegion(r)}
                className="rounded-[4px] border border-roast/40 px-2 py-0.5 text-xs text-roast hover:bg-paper"
              >
                + {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium tracking-wide text-modeled-ink uppercase">
            Transforms
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={state.scale === "log"}
              onChange={(e) =>
                update({ scale: e.target.checked ? "log" : "linear" })
              }
            />
            Log scale
          </label>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium tracking-wide text-modeled-ink uppercase">
            From · to
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={state.from ?? entry?.coverage.from ?? "1960"}
              min={1960}
              max={2026}
              onChange={(e) => update({ from: e.target.value })}
              aria-label="From year"
              className="tabular min-h-[40px] w-full rounded-[6px] border border-card-border bg-paper px-2 text-sm"
            />
            <span className="text-modeled-ink">–</span>
            <input
              type="number"
              value={state.to ?? entry?.coverage.to ?? "2026"}
              min={1960}
              max={2026}
              onChange={(e) => update({ to: e.target.value })}
              aria-label="To year"
              className="tabular min-h-[40px] w-full rounded-[6px] border border-card-border bg-paper px-2 text-sm"
            />
          </div>
        </div>

        <button
          onClick={share}
          className="min-h-[44px] rounded-[6px] bg-crema px-4 text-sm font-medium text-espresso hover:brightness-105"
        >
          Share this chart
        </button>
      </aside>

      {/* canvas */}
      <section className="min-w-0 flex-1">
        {load.phase === "loading" && (
          <div className="flex min-h-[320px] animate-pulse items-center justify-center rounded-card border border-card-border bg-paper text-sm text-modeled-ink">
            Brewing the data…
          </div>
        )}
        {load.phase === "error" && (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-card border border-card-border bg-paper text-sm">
            <p className="text-roast">Couldn&apos;t load this dataset ({load.message}).</p>
            <button
              onClick={() => {
                setLoaded(null);
                setRetryTick((t) => t + 1);
              }}
              className="min-h-[40px] rounded-[6px] border border-roast px-4 text-roast hover:bg-porcelain"
            >
              Retry
            </button>
          </div>
        )}
        {load.phase === "ready" &&
          (points.length < 3 ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-card border border-card-border bg-paper px-6 text-center text-sm text-roast">
              Not enough overlapping data for this combination — add countries
              or widen the year range.
            </div>
          ) : (
            <LabChart state={state} points={points} />
          ))}
        <p className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-modeled-ink">
          <span>{attribution([state.series.dataset])}</span>
          <Link href="/lab/data" className="underline underline-offset-4 hover:text-espresso">
            About these datasets →
          </Link>
        </p>
      </section>

      <div
        role="status"
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 rounded-[6px] bg-espresso px-4 py-2 text-sm text-porcelain shadow-lg transition-opacity ${toast ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        Link copied — paste it anywhere
      </div>
    </div>
  );
}
