"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { joinScatter, pearsonR } from "@/lib/lab-join";
import { toIndex100, toYoY } from "@/lib/lab-transform";
import { downloadCsv, svgToPng } from "@/lib/lab-export";
import presetsJson from "../../../data/presets.json";
import {
  LINE_SERIES_CAP,
  parseState,
  serializeState,
  type ChartType,
  type LabState,
  type SeriesRef,
} from "@/lib/lab-state";
import LabChart, { tidyToBarPoints, tidyToLinePoints } from "./LabChart";
import LabMap, { tidyToMapValues } from "./LabMap";

/** Keyed by the dataset ids needed — "loading" is derived (key mismatch),
 *  so the effect never sets state synchronously (react-hooks rule). */
interface Loaded {
  key: string;
  rows?: Record<string, TidyRow[]>;
  error?: string;
}

const CHART_TYPES: { id: ChartType; label: string }[] = [
  { id: "line", label: "Line" },
  { id: "bar", label: "Bar" },
  { id: "scatter", label: "Scatter" },
  { id: "map", label: "Map" },
];

/** Presets are data, not code (§6-10). */
const PRESETS = presetsJson as { id: string; title: string; blurb: string; params: string }[];

function neededDatasets(state: LabState): string[] {
  return state.type === "scatter"
    ? [...new Set([state.x.dataset, state.y.dataset])]
    : [state.series.dataset];
}

function SeriesPicker({
  label,
  value,
  onChange,
  excludeTier = true,
}: {
  label: string;
  value: SeriesRef;
  onChange: (r: SeriesRef) => void;
  excludeTier?: boolean;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium tracking-wide text-modeled-ink uppercase">
        {label}
      </p>
      <select
        value={`${value.dataset}.${value.indicator}`}
        onChange={(e) => {
          const dot = e.target.value.indexOf(".");
          onChange({
            dataset: e.target.value.slice(0, dot),
            indicator: e.target.value.slice(dot + 1),
          });
        }}
        aria-label={label}
        className="min-h-[44px] w-full rounded-[6px] border border-card-border bg-paper px-2 text-sm"
      >
        {manifest.flatMap((d) =>
          d.indicators
            .filter((i) => !excludeTier || i.code !== "tier")
            .map((i) => (
              <option key={`${d.id}.${i.code}`} value={`${d.id}.${i.code}`}>
                {d.name} — {i.label}
              </option>
            )),
        )}
      </select>
    </div>
  );
}

export default function LabShell() {
  const params = useSearchParams();
  const [state, setState] = useState<LabState>(() =>
    parseState(new URLSearchParams(params.toString())),
  );
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(false);

  /** URL is the source of truth — synced via effect after any user change
   *  (§4.3). Never inside the setState updater: updaters run during render,
   *  and history.replaceState there trips Next's router mid-render. */
  const dirty = useRef(false);
  const update = useCallback((patch: Partial<LabState>) => {
    dirty.current = true;
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    if (dirty.current)
      window.history.replaceState(null, "", `/lab?${serializeState(state)}`);
  }, [state]);

  const needed = neededDatasets(state);
  const loadKey = needed.join("+");

  useEffect(() => {
    let alive = true;
    Promise.all(needed.map((id) => loadDataset(id).then((rows) => [id, rows] as const)))
      .then((pairs) => alive && setLoaded({ key: loadKey, rows: Object.fromEntries(pairs) }))
      .catch((e) => alive && setLoaded({ key: loadKey, error: (e as Error).message }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadKey, retryTick]);

  const entry = manifestById.get(state.series.dataset);
  const current = loaded?.key === loadKey ? loaded : null;
  const load = !current
    ? ({ phase: "loading" } as const)
    : current.error
      ? ({ phase: "error", message: current.error } as const)
      : ({ phase: "ready", rows: current.rows! } as const);

  const scatterPoints = useMemo(() => {
    if (load.phase !== "ready" || state.type !== "scatter") return [];
    const year = state.year ?? "2026";
    return joinScatter(
      load.rows[state.x.dataset],
      state.x.indicator,
      load.rows[state.y.dataset],
      state.y.indicator,
      year,
      state.countries,
    );
  }, [load, state]);

  const linePoints = useMemo(() => {
    if (load.phase !== "ready" || state.type !== "line") return [];
    let rows = load.rows[state.series.dataset];
    if (state.yoy) rows = toYoY(rows, state.series.indicator);
    else if (state.index100)
      rows = toIndex100(rows, state.series.indicator, state.from);
    return tidyToLinePoints(rows, state);
  }, [load, state]);
  const barPoints = useMemo(
    () =>
      load.phase === "ready" && state.type === "bar"
        ? tidyToBarPoints(load.rows[state.series.dataset], state)
        : [],
    [load, state],
  );
  const mapValues = useMemo(
    () =>
      load.phase === "ready" && state.type === "map"
        ? tidyToMapValues(load.rows[state.series.dataset], state)
        : new Map<string, number>(),
    [load, state],
  );

  const pointCount =
    state.type === "scatter"
      ? scatterPoints.length
      : state.type === "map"
        ? mapValues.size
        : state.type === "bar"
          ? barPoints.length
          : linePoints.length;
  const r = state.type === "scatter" ? pearsonR(scatterPoints) : NaN;

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

  const capReached =
    state.type === "line" && selected.length >= LINE_SERIES_CAP;
  const addCountry = (iso3: string) => {
    if (capReached) return;
    update({ countries: [...selected, iso3] });
    setSearch("");
  };
  const addRegion = (region: string) => {
    const add = COUNTRIES_BY_REGION.get(region) ?? [];
    const merged = [...new Set([...selected, ...add])];
    update({
      countries:
        state.type === "line" ? merged.slice(0, LINE_SERIES_CAP) : merged,
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

  const exportPng = () => {
    const svg = document.querySelector<SVGSVGElement>("#lab-canvas svg");
    if (svg)
      svgToPng(svg, `espresso-lab-${state.type}.png`, attribution(needed)).catch(
        () => {},
      );
  };

  const exportCsv = () => {
    if (state.type === "scatter") {
      downloadCsv(
        "espresso-lab-scatter.csv",
        ["iso3", "country", "x", "x_date", "y", "y_date"],
        scatterPoints.map((p) => [p.iso3, countryName(p.iso3), p.x, p.xDate, p.y, p.yDate]),
      );
    } else if (state.type === "map") {
      downloadCsv(
        "espresso-lab-map.csv",
        ["iso3", "country", "value"],
        [...mapValues.entries()].map(([iso3, v]) => [iso3, countryName(iso3), v]),
      );
    } else if (state.type === "bar") {
      downloadCsv(
        "espresso-lab-bar.csv",
        ["iso3", "country", "value"],
        barPoints.map((p) => [p.iso3, countryName(p.iso3), p.value]),
      );
    } else {
      downloadCsv(
        "espresso-lab-line.csv",
        ["iso3", "country", "date", "value"],
        linePoints.map((p) => [
          p.iso3,
          countryName(p.iso3),
          p.date.toISOString().slice(0, 10),
          p.value,
        ]),
      );
    }
  };

  const applyPreset = (params: string) => {
    dirty.current = true;
    setState(parseState(new URLSearchParams(params)));
  };

  const attributionIds = needed;
  const isTimeChart = state.type === "line";

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
                onClick={() => update({ type: t.id })}
                className={`min-h-[36px] flex-1 rounded-[6px] border px-2 text-sm ${
                  state.type === t.id
                    ? "border-crema bg-crema/20 font-medium"
                    : "border-card-border bg-paper text-roast"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {state.type === "scatter" ? (
          <>
            <SeriesPicker
              label="X axis"
              value={state.x}
              onChange={(x) => update({ x })}
            />
            <SeriesPicker
              label="Y axis"
              value={state.y}
              onChange={(y) => update({ y })}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={state.trend}
                onChange={(e) => update({ trend: e.target.checked })}
              />
              Trend line (OLS)
            </label>
          </>
        ) : (
          <SeriesPicker
            label="Dataset · indicator"
            value={state.series}
            onChange={(series) => update({ series })}
          />
        )}

        <div>
          <p className="mb-1.5 text-xs font-medium tracking-wide text-modeled-ink uppercase">
            Countries{" "}
            {selected.length === 0
              ? "(all)"
              : isTimeChart
                ? `(${selected.length}/${LINE_SERIES_CAP})`
                : `(${selected.length})`}
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
          {selected.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {selected.map((iso3) => (
                <button
                  key={iso3}
                  onClick={() =>
                    update({
                      countries:
                        selected.length === 1
                          ? "all"
                          : selected.filter((c) => c !== iso3),
                    })
                  }
                  title="Remove"
                  className="rounded-[4px] border border-card-border bg-paper px-2 py-0.5 text-xs hover:border-error hover:text-error"
                >
                  {countryName(iso3)} ✕
                </button>
              ))}
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            {[...COUNTRIES_BY_REGION.keys()].slice(0, 4).map((reg) => (
              <button
                key={reg}
                onClick={() => addRegion(reg)}
                className="rounded-[4px] border border-roast/40 px-2 py-0.5 text-xs text-roast hover:bg-paper"
              >
                + {reg}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={state.scale === "log"}
              onChange={(e) =>
                update({ scale: e.target.checked ? "log" : "linear" })
              }
            />
            Log scale{state.type === "scatter" ? " (X axis)" : ""}
          </label>
          {isTimeChart && (
            <>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={state.yoy}
                  onChange={(e) =>
                    update({
                      yoy: e.target.checked,
                      index100: false,
                      ...(e.target.checked ? { scale: "linear" as const } : {}),
                    })
                  }
                />
                YoY %
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={state.index100}
                  onChange={(e) =>
                    update({ index100: e.target.checked, yoy: false })
                  }
                />
                Index = 100 at first year
              </label>
            </>
          )}
        </div>

        {isTimeChart ? (
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
        ) : (
          <div>
            <p className="mb-1.5 text-xs font-medium tracking-wide text-modeled-ink uppercase">
              Year
            </p>
            <input
              type="number"
              value={state.year ?? "2026"}
              min={1960}
              max={2026}
              onChange={(e) => update({ year: e.target.value })}
              aria-label="Join year"
              className="tabular min-h-[40px] w-full rounded-[6px] border border-card-border bg-paper px-2 text-sm"
            />
            <p className="mt-1 text-xs text-modeled-ink">
              Uses each country&apos;s most recent value up to this year.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            onClick={share}
            className="min-h-[44px] rounded-[6px] bg-crema px-4 text-sm font-medium text-espresso hover:brightness-105"
          >
            Share this chart
          </button>
          <div className="flex gap-2">
            <button
              onClick={exportPng}
              className="min-h-[40px] flex-1 rounded-[6px] border border-roast px-3 text-sm text-roast hover:bg-paper"
            >
              PNG
            </button>
            <button
              onClick={exportCsv}
              className="min-h-[40px] flex-1 rounded-[6px] border border-roast px-3 text-sm text-roast hover:bg-paper"
            >
              CSV
            </button>
          </div>
        </div>
      </aside>

      {/* canvas */}
      <section className="min-w-0 flex-1">
        {/* preset gallery (§4.4) */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p.params)}
              title={p.blurb}
              className="shrink-0 rounded-[6px] border border-card-border bg-paper px-3 py-1.5 text-left text-xs hover:border-crema"
            >
              <span className="font-medium">{p.title}</span>
            </button>
          ))}
        </div>
        {state.type === "scatter" && load.phase === "ready" && pointCount >= 3 && (
          <p className="mb-1 text-right text-sm text-roast">
            {Number.isFinite(r) && (
              <span className="tabular font-medium">r = {r.toFixed(2)}</span>
            )}{" "}
            <span className="tabular text-modeled-ink">n = {pointCount}</span>
          </p>
        )}
        {load.phase === "loading" && (
          <div className="flex min-h-[320px] animate-pulse items-center justify-center rounded-card border border-card-border bg-paper text-sm text-modeled-ink">
            Brewing the data…
          </div>
        )}
        {load.phase === "error" && (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-card border border-card-border bg-paper text-sm">
            <p className="text-roast">
              Couldn&apos;t load this data ({load.message}).
            </p>
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
          (pointCount < 3 ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-card border border-card-border bg-paper px-6 text-center text-sm text-roast">
              Not enough overlapping data for this combination — try a
              different year, or add countries.
            </div>
          ) : (
            <div id="lab-canvas">
              {state.type === "map" ? (
                <LabMap state={state} values={mapValues} />
              ) : (
                <LabChart
                  state={state}
                  linePoints={linePoints}
                  barPoints={barPoints}
                  scatterPoints={scatterPoints}
                  ariaLabel={
                    state.type === "scatter"
                      ? `Scatter plot, ${pointCount} countries`
                      : `${state.type} chart, ${pointCount} points`
                  }
                />
              )}
            </div>
          ))}
        <p className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-modeled-ink">
          <span>{attribution(attributionIds)}</span>
          <Link
            href="/lab/data"
            className="underline underline-offset-4 hover:text-espresso"
          >
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
