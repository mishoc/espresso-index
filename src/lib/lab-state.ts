/** Lab URL state (SPEC-DATALAB §4.3). The URL is the single source of
 *  truth: parse on load, history.replaceState on change. Unknown/invalid
 *  params fall back to the default preset silently. */

export type ChartType = "line" | "bar" | "scatter" | "map";

/** "wdi-gdppc.gdp_per_capita_usd" → { dataset, indicator } */
export interface SeriesRef {
  dataset: string;
  indicator: string;
}

export interface LabState {
  type: ChartType;
  /** Line/Bar/Map use `series`; Scatter uses `x` and `y`. */
  series: SeriesRef;
  x: SeriesRef;
  y: SeriesRef;
  /** iso3 list, or "all" */
  countries: string[] | "all";
  scale: "linear" | "log";
  yoy: boolean;
  index100: boolean;
  trend: boolean;
  /** Scatter join year ("2026") or line/bar range. */
  year?: string;
  from?: string;
  to?: string;
  /** Bar mode: iso3 codes drawn in the highlight color (preset 3). */
  highlight?: string[];
}

export const LINE_SERIES_CAP = 12;

export const DEFAULT_STATE: LabState = {
  // Preset #1 — Espresso vs. Big Mac, the signature chart.
  type: "scatter",
  series: { dataset: "espresso", indicator: "priceUSD" },
  x: { dataset: "big-mac", indicator: "dollar_price" },
  y: { dataset: "espresso", indicator: "priceUSD" },
  countries: "all",
  scale: "linear",
  yoy: false,
  index100: false,
  trend: true,
};

const REF_RE = /^[a-z0-9-]+\.[A-Za-z0-9_]+$/;

export function parseRef(s: string | null): SeriesRef | undefined {
  if (!s || !REF_RE.test(s)) return undefined;
  const dot = s.indexOf(".");
  return { dataset: s.slice(0, dot), indicator: s.slice(dot + 1) };
}

export const refToString = (r: SeriesRef) => `${r.dataset}.${r.indicator}`;

const ISO3_RE = /^[A-Z]{3}$/;
const YEAR_RE = /^\d{4}$/;

export function parseState(params: URLSearchParams): LabState {
  const s: LabState = structuredClone(DEFAULT_STATE);

  const type = params.get("type");
  if (type === "line" || type === "bar" || type === "scatter" || type === "map")
    s.type = type;

  const series = parseRef(params.get("series"));
  if (series) s.series = series;
  const x = parseRef(params.get("x"));
  if (x) s.x = x;
  const y = parseRef(params.get("y"));
  if (y) s.y = y;

  const countries = params.get("countries");
  if (countries && countries !== "all") {
    const list = countries
      .split(",")
      .map((c) => c.toUpperCase())
      .filter((c) => ISO3_RE.test(c));
    if (list.length) s.countries = [...new Set(list)];
  }

  if (params.get("scale") === "log") s.scale = "log";
  s.yoy = params.get("yoy") === "1";
  s.index100 = params.get("index100") === "1";
  s.trend = params.has("trend") ? params.get("trend") === "1" : s.trend;

  for (const k of ["year", "from", "to"] as const) {
    const v = params.get(k);
    if (v && YEAR_RE.test(v)) s[k] = v;
  }

  const highlight = params.get("highlight");
  if (highlight) {
    const list = highlight
      .split(",")
      .map((c) => c.toUpperCase())
      .filter((c) => ISO3_RE.test(c));
    if (list.length) s.highlight = [...new Set(list)];
  }

  // Mutually sensible combos only (§4.1): YoY is a time transform, and a
  // log axis would silently drop every negative YoY value — force linear.
  if (s.type === "scatter" || s.type === "map") s.yoy = false;
  if (s.yoy) {
    s.index100 = false;
    s.scale = "linear";
  }

  return s;
}

export function serializeState(s: LabState): string {
  const p = new URLSearchParams();
  p.set("type", s.type);
  if (s.type === "scatter") {
    p.set("x", refToString(s.x));
    p.set("y", refToString(s.y));
  } else {
    p.set("series", refToString(s.series));
  }
  p.set("countries", s.countries === "all" ? "all" : s.countries.join(","));
  if (s.scale === "log") p.set("scale", "log");
  if (s.yoy) p.set("yoy", "1");
  if (s.index100) p.set("index100", "1");
  if (s.type === "scatter" && s.trend !== DEFAULT_STATE.trend)
    p.set("trend", s.trend ? "1" : "0");
  for (const k of ["year", "from", "to"] as const) {
    if (s[k]) p.set(k, s[k]!);
  }
  if (s.highlight?.length) p.set("highlight", s.highlight.join(","));
  return p.toString();
}
